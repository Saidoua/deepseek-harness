/**
 * Model-facing `state_write` tool: a typed mutable working state over the
 * DeepSeek Harness event-sourced session log.
 *
 * Why: at matched token budgets, an explicit structured state beats every
 * lossy history compressor (SKILL.state: 0.94 vs 0.18 sliding-window, 0.52
 * summary, 0.84 full ReAct), and a verified working memory carries most of
 * the long-horizon gain (Recuris: +23.9 alone). The state therefore lives as
 * one durable replacing snapshot — the visible prompt does not grow with
 * history; it is rewritten — and is re-injected verbatim after compaction.
 *
 * @module @deepseek-ai/dsh-tool-state
 */

import { createHash } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { z as zod } from 'zod'
import type { Agent, PreStepDecision } from '@deepseek-ai/dsh-agent'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { SessionSeq, type UserMessage } from '@deepseek-ai/dsh-session'
import { defineTool } from '@deepseek-ai/dsh-tools'
// Type-only: resolves the required ctx.sessionProjections service declaration.
import type {} from '@deepseek-ai/dsh-session-projection'
// The `taskState` projection-key declaration lives in src/types.ts (its one
// home); this re-export projects the type face onto the package root AND
// keeps the module edge in the emitted index.d.ts, so aggregate programs
// consuming the declarations still receive the map merges.
export type * from './types.ts'
import type { StateValue, TaskState } from './types.ts'

export const name = 'tool-state'
export const inject = ['agents', 'tools', 'sessionProjections']

const DEFAULT_MAX_STATE_CHARS = 4000
const DEFAULT_MAX_KEYS = 50
const MAX_KEY_CHARS = 64
const MAX_VALUE_CHARS = 500

/** Model-facing state tool configuration. */
export interface Config {
  /** Maximum rendered characters of the published state snapshot. Minimum 500. */
  maxStateChars?: number
  /** Maximum simultaneous state keys. Minimum 1. */
  maxKeys?: number
}

/** Schemastery configuration for the state tool consumer. */
export const Config: z<Config> = z.object({
  maxStateChars: z.number().default(DEFAULT_MAX_STATE_CHARS),
  maxKeys: z.number().default(DEFAULT_MAX_KEYS),
})

/** Wire payload schema of the `taskState` projection (merged state or pre-first-write null). */
const taskStateSchema = zod.union([
  zod.null(),
  zod.record(zod.string(), zod.union([zod.string(), zod.array(zod.string())])),
])

/**
 * Pseudo-XML framing escape, mirroring the skill catalog's escapeText. The
 * durable `state` on the source stays unescaped; this belongs to the frame.
 */
function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

/** Deterministic state renderer, shared by the write-time budget check and the injection.
 * @param state - the merged working state to render.
 * @returns the canonical text block, keys sorted, framing-escaped.
 */
export function renderState(state: TaskState): string {
  const lines: string[] = []
  for (const key of Object.keys(state).sort()) {
    const value = state[key] as StateValue
    if (Array.isArray(value)) {
      lines.push(`${escapeText(key)}:`)
      for (const item of value) lines.push(`  - ${escapeText(item)}`)
    } else {
      lines.push(`${escapeText(key)}: ${escapeText(value)}`)
    }
  }
  return lines.join('\n')
}

/** Merge one patch into a state: string/array values set, null deletes.
 * @param state - the current working state.
 * @param patch - validated patch; `null` values delete their key.
 * @returns the merged state, never referencing the input object.
 */
export function mergeState(state: TaskState, patch: Record<string, string | string[] | null>): TaskState {
  // Rebuilt without `delete` (dynamic deletes push objects into dictionary
  // mode): keys deleted by this patch are simply not carried over.
  const merged: Record<string, string | string[]> = {}
  for (const [key, value] of Object.entries(state)) {
    if (patch[key] === null) continue
    merged[key] = value
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value !== null) merged[key] = value
  }
  return merged
}

/**
 * Validate the model-supplied patch and canonicalize it: non-empty trimmed
 * keys, values null | non-empty string | array of non-empty strings. Throws
 * one explicit error per violation — never silently reshapes, so the logged
 * snapshot equals what the model believes it wrote.
 */
function toPatch(raw: unknown): Record<string, string | string[] | null> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('invalid state_write: `patch` must be an object')
  }
  const entries = Object.entries(raw)
  if (entries.length === 0) {
    throw new Error('invalid state_write: `patch` must set at least one key (null deletes a key)')
  }
  const patch: Record<string, string | string[] | null> = {}
  for (const [rawKey, value] of entries) {
    const key = rawKey.trim()
    if (key.length === 0) throw new Error('invalid state_write: keys must be non-empty')
    if (key.length > MAX_KEY_CHARS) {
      throw new Error(`invalid state_write: key "${key}" exceeds ${String(MAX_KEY_CHARS)} characters`)
    }
    if (value === null) {
      patch[key] = null
    } else if (typeof value === 'string') {
      const text = value.trim()
      if (text.length === 0) throw new Error(`invalid state_write: "${key}" is an empty string (use null to delete)`)
      if (text.length > MAX_VALUE_CHARS) {
        throw new Error(`invalid state_write: "${key}" exceeds ${String(MAX_VALUE_CHARS)} characters`)
      }
      patch[key] = text
    } else if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      const items = (value as unknown[]).map(item => String(item).trim())
      if (items.some(item => item.length === 0)) {
        throw new Error(`invalid state_write: "${key}" contains an empty item (use null on the key to delete)`)
      }
      if (items.some(item => item.length > MAX_VALUE_CHARS)) {
        throw new Error(`invalid state_write: an item of "${key}" exceeds ${String(MAX_VALUE_CHARS)} characters`)
      }
      patch[key] = items
    } else {
      throw new Error(`invalid state_write: "${key}" must be null, a string, or an array of strings`)
    }
  }
  return patch
}

/** Enforce the size bounds on the merged result before anything is durable. */
function checkBudget(state: TaskState, config: { maxStateChars: number; maxKeys: number }): void {
  const keys = Object.keys(state)
  if (keys.length > config.maxKeys) {
    throw new Error(`state_write: at most ${String(config.maxKeys)} state keys (delete some with null first)`)
  }
  const rendered = renderState(state)
  if (rendered.length > config.maxStateChars) {
    throw new Error(`state_write: the state would render to ${String(rendered.length)} characters, above the `
      + `${String(config.maxStateChars)} budget — delete stale keys (null) or shorten values first`)
  }
}

/** Read the session's current working state from the projection. */
function stateOf(ctx: Context, agent: Agent): TaskState {
  return ctx.sessionProjections.stateOf(agent.session, 'taskState') ?? {}
}

/** Snapshot identity over the durable state content, not the rendered prose. */
function digestState(state: TaskState): string {
  const canonical = JSON.stringify(
    Object.keys(state).sort().map(key => [key, state[key] as StateValue]),
  )
  return createHash('sha256').update(canonical).digest('hex')
}

/**
 * Readable state content of one durable task-state source, or undefined when
 * the record is not a usable state. Seed validation only guarantees a
 * non-empty source kind, so an unreadable record is "not this plugin's
 * message" rather than a throw inside the step listener.
 */
function readSourceState(source: unknown): TaskState | undefined {
  const state = (source as { state?: unknown }).state
  if (typeof state !== 'object' || state === null || Array.isArray(state)) return undefined
  const readable: Record<string, StateValue> = {}
  for (const [key, value] of Object.entries(state)) {
    if (key === '') return undefined
    if (typeof value === 'string') readable[key] = value
    else if (Array.isArray(value) && value.every(item => typeof item === 'string')) readable[key] = value
    else return undefined
  }
  return readable
}

/**
 * Scan the durable log for this session's latest readable task-state
 * publication and whether it is still on the visible surface. Mirrors the
 * skill catalog's history scan: shadowed (compacted) publications lose
 * `visibleDigest`, which is exactly what drives the verbatim republish.
 */
function stateHistory(agent: Agent): { visibleDigest?: string; published: boolean } {
  const visible = new Set(agent.session.surface.nodes)
  let published = false
  for (let index = agent.session.seq - 1; index >= 0; index -= 1) {
    const event = agent.session.eventAt(SessionSeq(index))
    if (event === undefined) {
      throw new Error(`task state cannot read seq ${String(index)} below the current Session length`)
    }
    if (event.type !== 'user/message' || event.data.source.kind !== 'task-state') continue
    const state = readSourceState(event.data.source)
    if (state === undefined) continue
    published = true
    if (visible.has(event.seq)) return { visibleDigest: digestState(state), published }
  }
  return { published }
}

/** This plugin's publication already proposed for the entering step, if any. */
function proposedStateMessage(
  messages: readonly UserMessage[],
): { message: UserMessage; state: TaskState } | undefined {
  for (const message of messages) {
    if (message.source.kind !== 'task-state') continue
    const state = readSourceState(message.source)
    if (state !== undefined) return { message, state }
  }
  return undefined
}

function renderStateMessage(state: TaskState, update: boolean): UserMessage {
  const body = Object.keys(state).length === 0
    ? ['The working state is now empty. Earlier task-state snapshots no longer apply.']
    : [
      update
        ? 'The working state changed. This snapshot replaces every earlier task-state snapshot in this session:'
        : 'Current working state for this session, maintained with state_write and surviving context compaction:',
      '',
      '<task_state>',
      renderState(state),
      '</task_state>',
      '',
      'Treat this as the authoritative record of the task\'s durable facts. Update it with state_write whenever '
        + 'it materially changes (a string sets a key, null deletes a key); it replaces this snapshot rather than growing it.',
    ]
  return createUserMessage({
    content: [{
      type: 'text',
      text: ['<system-reminder>', ...body, '</system-reminder>'].join('\n'),
    }],
    source: update
      ? { kind: 'task-state', form: 'instructions', update: true, state }
      : { kind: 'task-state', form: 'instructions', state },
  })
}

const DESCRIPTION =
  'Maintain the working state for the current task: a small typed key/value record that survives context '
  + 'compaction as ONE replacing snapshot — it does not grow the conversation. Typical keys: goal, decisions, '
  + 'files_touched, blockers, next_steps (free keys allowed). Patch semantics: a string or array of strings sets '
  + 'the key, null DELETES the key. Use it for durable facts and decisions of the ongoing work; todo_write is the '
  + 'step checklist and the goal tools own a long-running objective\'s lifecycle. Update it whenever the state '
  + 'materially changes; the visible snapshot is replaced, not appended to.'

/**
 * Register the `state_write` tool on `ctx.tools`, the `taskState` unit on
 * `ctx.sessionProjections`, and the step-boundary republish listener.
 * @param ctx - registrant context carrying the tool and session-projection registries.
 * @param config - deployment's state bounds.
 */
export function apply(ctx: Context, config: Config = {}): void {
  const maxStateChars = config.maxStateChars ?? DEFAULT_MAX_STATE_CHARS
  const maxKeys = config.maxKeys ?? DEFAULT_MAX_KEYS
  const bounds = { maxStateChars, maxKeys }

  // Whole-state fold: latest merged state/write wins; null before the first
  // write and after the state is emptied. Unlike the todos projection this
  // deliberately does NOT reset at turn/start — the working state is the
  // session's cross-turn, compaction-surviving record.
  ctx.sessionProjections.register<'taskState', TaskState | null>({
    key: 'taskState',
    stateSchema: taskStateSchema,
    init: () => null,
    apply: (state, event) => {
      if (event.type === 'state/write') return event.data.state
      return state
    },
    wire: { viewSchema: taskStateSchema, view: state => state },
    stateVersion: 1,
  })

  ctx.tools.register(defineTool({
    name: 'state_write',
    description: DESCRIPTION,
    parameters: {
      patch: {
        type: 'object',
        additionalProperties: true,
        required: true,
        description: 'Keys to set or delete. A string or array of strings sets the key; null deletes it. '
          + 'Example: {"goal": "migrate auth", "files_touched": ["src/auth.ts"], "blockers": null}',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          state: {
            oneOf: [
              { type: 'null' },
              { type: 'object', additionalProperties: true },
            ],
          },
          keys: { type: 'integer', required: true },
          stateChars: { type: 'integer', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.state === null
          ? 'Working state cleared.'
          : `Working state updated: ${String(value.keys)} keys, ${String(value.stateChars)}/${String(maxStateChars)} chars.`,
      }],
    },
    execute(args, exec) {
      if (!exec.agent) {
        // The state is per-agent-session; a non-agent caller (no owning
        // session) has nowhere to write it. Reject rather than silently no-op.
        throw new Error('state_write requires an owning agent session')
      }
      const current = stateOf(ctx, exec.agent)
      const patch = toPatch(args.patch)
      const merged = mergeState(current, patch)
      checkBudget(merged, bounds)
      const state = Object.keys(merged).length === 0 ? null : merged
      exec.agent.session.append('state/write', { state })
      return Promise.resolve({
        state,
        keys: state === null ? 0 : Object.keys(state).length,
        stateChars: state === null ? 0 : renderState(state).length,
      })
    },
    presentCall: args => ({ card: 'generic', title: 'Update working state', kind: 'other', rawInput: args.patch }),
  }))

  // Step-boundary republish: mirror of the skill-catalog listener. The state
  // rides a durable message whose identity is the state digest; when the
  // visible copy is gone (compaction shadowed it) or the state changed, the
  // next step re-injects the exact current snapshot — never summarized, never
  // duplicated. Registration sits after the tool so reverse teardown removes
  // the schema first.
  ctx.on('agent/pre-step', async (
    { agent, signal },
    next,
  ): Promise<PreStepDecision> => {
    const decision = await next()
    if (decision.kind === 'reject' || signal.aborted) return decision
    const state = stateOf(ctx, agent)
    const digest = digestState(state)
    const history = stateHistory(agent)
    const existing = proposedStateMessage(decision.messages)
    if (history.visibleDigest === digest) {
      return existing === undefined
        ? decision
        : { ...decision, messages: decision.messages.filter(message => message.id !== existing.message.id) }
    }
    if (existing !== undefined && digestState(existing.state) === digest) return decision
    if (!history.published && Object.keys(state).length === 0) {
      return existing === undefined
        ? decision
        : { ...decision, messages: decision.messages.filter(message => message.id !== existing.message.id) }
    }
    const publication = renderStateMessage(state, history.published)
    return {
      ...decision,
      messages: existing === undefined
        ? [...decision.messages, publication]
        : decision.messages.map(message => message.id === existing.message.id ? publication : message),
    }
  })
}
