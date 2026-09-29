/**
 * Derives `presets/standard-plus.patch.yml` from the Web bundle's standard preset.
 *
 * Each edit replaces one anchor that must occur exactly once, so a reshaped
 * upstream preset fails here instead of producing a silently different copy.
 * Run with `pnpm exec tsx packages/bundle/extras-web/src/gen-standard-plus.ts`;
 * `--check` exits 1 when the committed file differs from the derivation.
 * @module
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SOURCE = fileURLToPath(new URL('../../web-app/presets/standard.patch.yml', import.meta.url))
const TARGET = fileURLToPath(new URL('../presets/standard-plus.patch.yml', import.meta.url))

const EDITS: ReadonlyArray<readonly [anchor: string, replacement: string]> = [
  [
    '# Agent preset standard: one `@deepseek-ai/dsh-agent-preset` declaration inserted\n'
      + '# after the web patch. Edits saved from the Web editor override this row\'s\n'
      + '# `config.plugins` by id from the profile patch.\n',
    '# Generated from packages/bundle/web-app/presets/standard.patch.yml by\n'
      + '# src/gen-standard-plus.ts; do not edit. Agent preset standard-plus: the\n'
      + '# standard preset with pinned rules, typed working state, and the in-process\n'
      + '# search backend.\n',
  ],
  ['    - id: preset-standard\n', '    - id: preset-standard-plus\n'],
  [
    '        id: standard\n        order: 1\n',
    '        id: standard-plus\n'
      + '        name: Standard +\n'
      + '        description: Standard, plus pinned rules, typed working state, and in-process search.\n'
      + '        order: 0\n',
  ],
  [
    '          - id: tool-fs-search\n'
      + '            name: \'@deepseek-ai/dsh-tool-fs-search\'\n'
      + '            config:\n'
      + '              sampleOverCapGlobResults: false\n',
    '          - id: tool-fs-search\n'
      + '            name: \'@saidouahdachi/dsh-tool-fs-search-native\'\n'
      + '            config:\n'
      + '              sampleOverCapGlobResults: false\n'
      + '              whenAddonMissing: spawn\n',
  ],
  [
    '            name: \'@deepseek-ai/dsh-tool-todo\'\n'
      + '            config:\n'
      + '              allowParallelInProgress: true\n',
    '            name: \'@deepseek-ai/dsh-tool-todo\'\n'
      + '            config:\n'
      + '              allowParallelInProgress: true\n'
      + '          - id: session-rules\n'
      + '            name: \'@deepseek-ai/dsh-session-rules\'\n'
      + '            config:\n'
      + '              maxRules: 20\n'
      + '              maxRuleChars: 500\n'
      + '          - id: tool-state\n'
      + '            name: \'@deepseek-ai/dsh-tool-state\'\n'
      + '            config:\n'
      + '              maxStateChars: 4000\n'
      + '              maxKeys: 50\n',
  ],
]

/**
 * Apply every edit to the standard preset text.
 * @param source - the standard preset file's text.
 * @returns the standard-plus preset file's text.
 */
export function deriveStandardPlus(source: string): string {
  let text = source
  for (const [anchor, replacement] of EDITS) {
    const count = text.split(anchor).length - 1
    if (count !== 1) throw new Error(`gen-standard-plus: anchor found ${count} times, expected 1:\n${anchor}`)
    text = text.replace(anchor, replacement)
  }
  return text
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  const derived = deriveStandardPlus(readFileSync(SOURCE, 'utf8'))
  if (process.argv.includes('--check')) {
    if (readFileSync(TARGET, 'utf8') !== derived) {
      process.stderr.write('gen-standard-plus: presets/standard-plus.patch.yml is stale; rerun without --check\n')
      process.exit(1)
    }
  } else {
    writeFileSync(TARGET, derived)
    process.stdout.write('gen-standard-plus: wrote presets/standard-plus.patch.yml\n')
  }
}
