/**
 * Optional in-process execution backend for the `grep` and `glob` tools.
 *
 * When `@saidoua/dsh-native` (the dsh-rs addon) is installed and loadable,
 * both tools run their search inside this process through ripgrep's own
 * library crates instead of spawning the packaged ripgrep binary: no process
 * spawn, no `rg --json` transport, and therefore no raw-stdout cap to
 * overflow. The work still runs off the event loop, so the spawn's one real
 * advantage — not blocking the loop for the length of a tree walk — is kept.
 *
 * The addon is optional: a platform without a prebuilt binary, or a
 * deployment that sets `DSH_NATIVE=0`, spawns ripgrep exactly as before.
 *
 * Cancellation is the one contract difference, and the reason the spawn path
 * remains: `exec.signal` is honoured before the search starts, but a running
 * native search has no process to terminate, so a mid-search timeout is
 * observed when the search returns rather than interrupting it.
 *
 * @module @deepseek-ai/dsh-tool-fs-search/native
 */

import { createRequire } from 'node:module'
import type { ToolExecution } from '@deepseek-ai/dsh-tools'
import type { GrepMatch } from './search-core.ts'
import { SearchError } from './search-core.ts'

/** The addon's search surface, as this package uses it. */
interface NativeSearch {
  grepSearchAsync(
    pattern: string,
    path: string | undefined,
    include: string | undefined,
    workdir: string,
    maxMatches: number,
    maxLineBytes: number,
  ): Promise<{ matches: GrepMatch[]; seen: number; truncated: boolean; formatted: string }>
  globSearchAsync(
    pattern: string,
    path: string | undefined,
    workdir: string,
    maxResults: number,
  ): Promise<{ root: string; paths: string[]; seen: number; truncated: boolean; complete: string }>
}

/**
 * No cap inside the addon: both tools' `execute` returns the COMPLETE result,
 * and the inline caps (`grepMaxMatches`, `globMaxResults`) and per-line
 * previews are applied by the retention layer the render and the search card
 * share.
 */
const UNCAPPED = Number.MAX_SAFE_INTEGER

let loaded: NativeSearch | null | undefined

/**
 * The loaded addon, or `undefined` when it is absent or disabled. Only the
 * module LOAD is memoized (a missing addon must cost one failed resolution
 * per process, not one per search); `DSH_NATIVE` is read per call so a suite
 * can exercise both execution paths in one process.
 * @returns the native search functions, or `undefined` to spawn ripgrep.
 */
export function nativeSearch(): NativeSearch | undefined {
  if (process.env.DSH_NATIVE === '0') return undefined
  if (loaded === undefined) {
    try {
      loaded = createRequire(import.meta.url)('@saidoua/dsh-native') as NativeSearch
    } catch {
      // An absent or unloadable addon is not an error: the spawn path is the
      // contract, and this one is an optimization over it.
      loaded = null
    }
  }
  return loaded ?? undefined
}

/**
 * The workdir the search resolves relative paths against and reports paths
 * relative to — the calling agent's session cwd, as the ripgrep spawn uses.
 * @param exec - the tool-execution context carrying the calling agent.
 * @returns the session cwd, or the process cwd for a call with no agent.
 */
export function searchWorkdir(exec: ToolExecution): string {
  return exec.agent?.session.header.cwd ?? process.cwd()
}

/**
 * Translate an addon failure into the tool error vocabulary. The addon
 * prefixes its message with the machine-routable code, so the classification
 * needs no prose matching.
 */
function nativeError(toolName: string, error: unknown): SearchError {
  const message = error instanceof Error ? error.message : String(error)
  const code = message.startsWith('SEARCH_INVALID_PATTERN') ? 'SEARCH_INVALID_PATTERN' : 'SEARCH_FAILED'
  return new SearchError(`${toolName} ${message}`, code, { cause: error })
}

/**
 * Run one `grep` search in-process.
 * @param native - the loaded addon.
 * @param exec - the tool-execution context; supplies the session cwd and the abort signal.
 * @param input - the validated `grep` arguments.
 * @returns every match, uncapped: the retention layer owns the inline cap.
 */
export async function runNativeGrep(
  native: NativeSearch,
  exec: ToolExecution,
  input: { pattern: string; path?: string; include?: string },
): Promise<GrepMatch[]> {
  if (exec.signal.aborted) {
    throw new SearchError('grep was aborted before completion (tool timeout or caller cancellation)', 'SEARCH_ABORTED')
  }
  try {
    const result = await native.grepSearchAsync(
      input.pattern, input.path, input.include, searchWorkdir(exec), UNCAPPED, UNCAPPED,
    )
    return result.matches
  } catch (error: unknown) {
    throw nativeError('grep', error)
  }
}

/**
 * Run one `glob` discovery in-process.
 * @param native - the loaded addon.
 * @param exec - the tool-execution context; supplies the session cwd and the abort signal.
 * @param input - the validated `glob` arguments.
 * @returns every discovered path in modification-time order, uncapped.
 */
export async function runNativeGlob(
  native: NativeSearch,
  exec: ToolExecution,
  input: { pattern: string; path?: string },
): Promise<string[]> {
  if (exec.signal.aborted) {
    throw new SearchError('glob was aborted before completion (tool timeout or caller cancellation)', 'SEARCH_ABORTED')
  }
  try {
    const result = await native.globSearchAsync(input.pattern, input.path, searchWorkdir(exec), UNCAPPED)
    return result.paths
  } catch (error: unknown) {
    throw nativeError('glob', error)
  }
}
