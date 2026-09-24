/**
 * The pack's reading-order stylesheet, read from disk: it aligns text and never
 * reorders boxes, and it keys every alignment on the attribute the pack writes.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { TEXT_DIRECTION_ATTRIBUTE } from '../src/client/text-direction.ts'

const css = readFileSync(fileURLToPath(new URL('../src/client/text-direction.css', import.meta.url)), 'utf8')
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '')

describe('Arabic reading-order stylesheet', () => {
  it('never sets direction, which would move the frame, the controls, and every icon beside a label', () => {
    expect(rules).not.toMatch(/(^|[\s;{])direction\s*:/)
  })

  it('aligns product copy right only while the pack marks the root right-to-left', () => {
    const rightAligned = rules.split('}').filter(rule => /text-align:\s*right/.test(rule))
    expect(rightAligned.length).toBeGreaterThan(0)
    for (const rule of rightAligned) expect(rule).toContain(`:root[${TEXT_DIRECTION_ATTRIBUTE}='rtl']`)
  })
})
