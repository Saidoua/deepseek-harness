/** The Web extras bundle adds the Standard + preset as the default, skill usage stats, and the Arabic pack. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as yaml from 'js-yaml'
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include'
import { deriveStandardPlus } from '../src/gen-standard-plus.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string): string => readFileSync(resolve(root, path), 'utf8')

interface Manifest {
  name?: string
  icon?: string
  exports?: Record<string, unknown>
  dependencies?: Record<string, string>
  dsh?: { bundle?: { patch?: string[] } }
}

describe('Web extras bundle', () => {
  const manifest = JSON.parse(read('package.json')) as Manifest

  it('publishes plugin-manager display metadata and both patch files', () => {
    expect(manifest.icon).toBe('./icon.svg')
    expect(manifest.exports?.['./locale/*.json']).toBe('./locale/*.json')
    expect(manifest.dsh?.bundle?.patch).toEqual(['./cordis.patch.yml', './presets/standard-plus.patch.yml'])
    for (const lang of ['en', 'zh']) {
      const meta = (JSON.parse(read(`locale/${lang}.json`)) as { meta?: { title?: string; description?: string } }).meta
      expect(meta?.title, lang).toBeTruthy()
      expect(meta?.description, lang).toBeTruthy()
    }
  })

  it('inserts skill-stats and the Arabic pack, and makes Standard + the default preset', () => {
    const patch = yaml.load(read('cordis.patch.yml'), { schema: entryListSchema })
    expect(patch).toEqual([
      { insert: [
        { id: 'skill-stats', name: '@deepseek-ai/dsh-skill-stats' },
        { id: 'locale-ar', name: '@deepseek-ai/dsh-client-locale-ar' },
      ] },
      { id: 'agent-preset-registry', config: { default: 'standard-plus' } },
    ])
  })

  it('keeps Standard + derived from the shipped standard preset', () => {
    // A stale copy fails here; regenerate with src/gen-standard-plus.ts.
    const standard = readFileSync(resolve(root, '../web-app/presets/standard.patch.yml'), 'utf8')
    expect(read('presets/standard-plus.patch.yml')).toBe(deriveStandardPlus(standard))
  })

  it('depends on every package its rows name', () => {
    const text = read('cordis.patch.yml') + read('presets/standard-plus.patch.yml')
    const names = new Set([...text.matchAll(/name: '(@[^']+)'/g)].map(match => match[1]!.split('/').slice(0, 2).join('/')))
    for (const name of names) expect(manifest.dependencies, name).toHaveProperty(name)
  })
})
