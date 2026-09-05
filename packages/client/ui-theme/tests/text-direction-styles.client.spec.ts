/**
 * Text-direction stylesheet contract, asserted against the CSS text on disk.
 *
 * The locale plugin publishes the active language's reading order on the root
 * and never writes `html[dir]`, so the application frame keeps left-to-right
 * placement in every language. Direction therefore reaches the UI through
 * exactly one rule, in the theme package that owns every theme selector: a
 * feature stylesheet that declared its own `direction` or matched `[dir=…]`
 * would flip a region the locale plugin cannot see, and a zone whose owner
 * marked it would then disagree with the language actually active.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { packageStylesheets, parseRules } from './stylesheet-scan.ts'

/** Root attribute the locale plugin writes, and the marker zone owners set. */
const DIRECTION_ATTRIBUTE = 'data-dsh-text-direction'
const ZONE_ATTRIBUTE = 'data-dsh-text-zone'

const sheetPath = fileURLToPath(new URL('../src/styles/text-direction.css', import.meta.url))
const sheetCss = readFileSync(sheetPath, 'utf8')

/** Repo-relative path, so a failure names the offending sheet portably. */
function relative(file: string): string {
  return file.slice(file.indexOf('/packages/') + 1).replaceAll('\\', '/')
}

describe('text-direction.css', () => {
  const rules = parseRules(sheetCss)

  it('scopes the direction flip to marked zones under the root attribute', () => {
    const rule = rules.find(entry =>
      entry.selectors.some(selector => selector.includes(ZONE_ATTRIBUTE)))
    expect(rule, `a rule selecting [${ZONE_ATTRIBUTE}]`).toBeDefined()
    // Both halves are load-bearing: without the root attribute the zone would
    // flip in every language, and without the zone marker the flip would
    // escape into the frame the locale plugin deliberately leaves alone.
    expect(rule!.selectors[0]).toContain(`[${DIRECTION_ATTRIBUTE}='rtl']`)
    expect(rule!.declarations).toContainEqual(['direction', 'rtl'])
    // Isolation keeps a zone's bidi resolution from reordering neighbouring
    // chrome text, which shares the document's own left-to-right paragraph.
    expect(rule!.declarations).toContainEqual(['unicode-bidi', 'isolate'])
    expect(rule!.declarations).toContainEqual(['text-align', 'start'])
  })

  it('is the only package stylesheet that decides direction', () => {
    const offenders: string[] = []
    for (const file of packageStylesheets()) {
      if (file === sheetPath) continue
      for (const rule of parseRules(readFileSync(file, 'utf8'))) {
        if (rule.selectors.some(selector => /\[dir[~^|$*]?=|\[data-dsh-text-direction/.test(selector))) {
          offenders.push(`${relative(file)}: selector ${rule.selectors.join(', ')}`)
        }
        for (const [property, value] of rule.declarations) {
          if (property === 'direction' || property === 'unicode-bidi') {
            offenders.push(`${relative(file)}: ${property}: ${value}`)
          }
        }
      }
    }
    // A component that must stay left-to-right regardless of language (code,
    // terminal, diff, path chrome) pins `dir="ltr"` on its own element, which
    // the browser resolves without a stylesheet rule.
    expect(offenders, 'direction belongs to ui-theme/src/styles/text-direction.css').toEqual([])
  })
})
