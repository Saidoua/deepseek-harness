/** The terminal extras bundle swaps the in-box search row and adds the fork's rows, all off on the Web surface. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as yaml from 'js-yaml'
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include'

const root = fileURLToPath(new URL('..', import.meta.url))
const WEB_GUARD = "ctx.get('profileContext')?.startedBundles.includes('@deepseek-ai/dsh-web-app') ?? false"

interface Row { id: string; name?: string; disabled?: unknown; config?: Record<string, unknown> }
interface Manifest { name?: string; dependencies?: Record<string, string>; dsh?: { bundle?: { patch?: string } } }

/** The `!!js` source a tagged `disabled` value carries; the include schema parses the tag to `{ __jsExpr }`. */
function expressionOf(value: unknown): string | undefined {
  if (typeof value === 'object' && value !== null && '__jsExpr' in value) return String(value.__jsExpr)
  return typeof value === 'string' ? value : JSON.stringify(value)
}

describe('terminal extras bundle', () => {
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as Manifest
  const patch = yaml.load(readFileSync(resolve(root, 'cordis.patch.yml'), 'utf8'), { schema: entryListSchema }) as Array<Row & { insert?: Row[] }>

  it('disables the in-box search row by id and inserts the fork rows', () => {
    expect(patch[0]).toEqual({ id: 'tool-fs-search', disabled: true })
    const inserted = patch[1]?.insert ?? []
    expect(inserted.map(row => [row.id, row.name])).toEqual([
      ['tool-fs-search-native', '@saidouahdachi/dsh-tool-fs-search-native'],
      ['session-rules', '@deepseek-ai/dsh-session-rules'],
      ['skill-stats', '@deepseek-ai/dsh-skill-stats'],
      ['tool-state', '@deepseek-ai/dsh-tool-state'],
    ])
    expect(inserted.find(row => row.id === 'tool-fs-search-native')?.config).toEqual({ sampleOverCapGlobResults: false, whenAddonMissing: 'spawn' })
    expect(inserted.find(row => row.id === 'session-rules')?.config).toEqual({ maxRules: 20, maxRuleChars: 500 })
    expect(inserted.find(row => row.id === 'tool-state')?.config).toEqual({ maxStateChars: 4000, maxKeys: 50 })
  })

  it('switches every inserted row off while dsh-web-app runs', () => {
    for (const row of patch[1]?.insert ?? []) expect(expressionOf(row.disabled), row.id).toContain(WEB_GUARD)
  })

  it('depends on every package its rows name', () => {
    expect(manifest.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
    const named = (patch[1]?.insert ?? []).map(row => row.name)
    for (const name of named) expect(manifest.dependencies, name).toHaveProperty(name!)
  })
})
