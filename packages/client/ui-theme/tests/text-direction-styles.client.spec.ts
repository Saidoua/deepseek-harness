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

/**
 * Stylesheets whose rules style content inside a marked text zone. Their
 * inline-axis spacing must follow the zone's direction, so they carry logical
 * properties; a physical one would keep its left-to-right offset while the
 * text around it flipped. A sheet joins this list in the same change that
 * marks its zone, which is what keeps the migration from silently stalling.
 */
const ZONE_STYLESHEETS = [
  'ui-chat/src/client/chat/ChatView.module.css',
  'ui-chat/src/client/chat/MessageItem.module.css',
  'ui-chat/src/client/chat/MessageIconActions.module.css',
  'ui-chat/src/client/chat/AssistantMarkdown.module.css',
  'ui-chat/src/client/chat/TurnProcessNodeView.module.css',
  'ui-chat/src/client/chat/TurnTailNodeView.module.css',
  'ui-chat/src/client/chat/TurnUsagePanel.module.css',
  'ui-conversation/src/client/skeleton/InputBar.module.css',
  'ui-primitives/src/markdown/MarkdownText.module.css',
  'ui-primitives/src/user-text.module.css',
  'ui-primitives/src/DisclosureRow.module.css',
  'ui-primitives/src/SearchBlock.module.css',
  'ui-primitives/src/WebBlock.module.css',
  'ui-tool/src/client/tool/components/ToolRow.module.css',
  'ui-tool/src/client/tool/components/AskQuestionCard.module.css',
  'ui-tool/src/client/tool/ToolCallTree.module.css',
  'ui-tool/src/client/tool/toolviews/bash-sample.module.css',
  'ui-goal/src/client/GoalBar.module.css',
  'ui-plan/src/client/PlanModeControl.module.css',
  'ui-approval/src/client/ApprovalPanel.module.css',
  'ui-user-questions/src/client/QuestionComposer.module.css',
  'ui-settings-general/src/client/SettingsRoot.module.css',
  'ui-input-trigger/src/client/MenuView.module.css',
]

/** Physical inline-axis properties a zone stylesheet may not declare. */
const PHYSICAL = new RegExp([
  '^(?:margin|padding|border|inset|scroll-margin|scroll-padding)-(?:left|right)$',
  '^border-(?:top|bottom)-(?:left|right)-radius$',
  '^(?:left|right)$',
  '^(?:float|clear)$',
].join('|'))

/**
 * Rules that keep a physical property on purpose, keyed by `sheet suffix`
 * plus the declaration. Each entry names something the reading order does not
 * govern: a decorative sweep, or chrome that sits outside the marked zone and
 * therefore never flips.
 */
const PHYSICAL_ALLOWLIST = new Map([
  // The control is a sibling of the transcript column, not zone content.
  ['ui-chat/src/client/chat/ChatView.module.css|padding-right', 'to-bottom control sits outside the marked column'],
  // The gutter belongs to the composer card, which keeps its placement; the
  // marked zone is the text surface nested inside it.
  ['ui-conversation/src/client/skeleton/InputBar.module.css|margin-right', 'composer scrollport gutter is card chrome'],
  // Both re-anchor controls in the composer's row, outside the text surface.
  ['ui-conversation/src/client/skeleton/InputBar.module.css|margin-left', 'composer row controls sit outside the marked zone'],
  // A caret drawn from borders and a rotation. Alignment changes with the
  // language; the design's glyph does not.
  ['ui-chat/src/client/chat/MessageItem.module.css|border-right', 'disclosure caret keeps one drawn orientation'],
  // Decorative sweeps: the highlight crosses the row the same way in every
  // language, so its offsets are physical screen positions, not reading order.
  ['ui-tool/src/client/tool/components/ToolRow.module.css|left', 'running-row shimmer sweep'],
  ['ui-tool/src/client/tool/toolviews/bash-sample.module.css|left', 'running-row shimmer sweep'],
  // The overlay stretches across its anchor rather than following reading order.
  ['ui-input-trigger/src/client/MenuView.module.css|left', 'trigger menu spans its anchor'],
  ['ui-input-trigger/src/client/MenuView.module.css|right', 'trigger menu spans its anchor'],
])

const sheetPath = fileURLToPath(new URL('../src/styles/text-direction.css', import.meta.url))
const sheetCss = readFileSync(sheetPath, 'utf8')

/** Repo-relative path, so a failure names the offending sheet portably. */
function relative(file: string): string {
  return file.slice(file.indexOf('/packages/') + 1).replaceAll('\\', '/')
}

describe('text-direction.css', () => {
  const rules = parseRules(sheetCss)

  it('moves alignment only, and only under the root attribute', () => {
    const rule = rules.find(entry =>
      entry.selectors.some(selector => selector.includes(ZONE_ATTRIBUTE)))
    expect(rule, `a rule selecting [${ZONE_ATTRIBUTE}]`).toBeDefined()
    // Both halves are load-bearing: without the root attribute the zone would
    // align right in every language, and without the zone marker the change
    // would escape into chrome the locale plugin deliberately leaves alone.
    expect(rule!.selectors[0]).toContain(`[${DIRECTION_ATTRIBUTE}='rtl']`)
    expect(rule!.declarations).toEqual([['text-align', 'right']])
  })

  it('never sets the direction property, which would reorder the design', () => {
    // `direction` reverses flex and grid children, moving the settings
    // navigation, row controls, and every icon beside a label. A bilingual
    // reader meets one layout in every language.
    for (const rule of rules) {
      for (const [property] of rule.declarations) {
        expect(property, rule.selectors.join(', ')).not.toBe('direction')
      }
    }
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

  it('keeps zone stylesheets on logical inline-axis properties', () => {
    const offenders: string[] = []
    for (const suffix of ZONE_STYLESHEETS) {
      const file = packageStylesheets().find(path => path.replaceAll('\\', '/').endsWith(`/packages/client/${suffix}`))
      // A renamed or deleted sheet must fail here rather than drop out of the
      // sweep, which would leave the migration unguarded while staying green.
      expect(file, `zone stylesheet ${suffix}`).toBeDefined()
      for (const rule of parseRules(readFileSync(file!, 'utf8'))) {
        for (const [property] of rule.declarations) {
          if (!PHYSICAL.test(property)) continue
          if (PHYSICAL_ALLOWLIST.has(`${suffix}|${property}`)) continue
          offenders.push(`${suffix}: ${rule.selectors.join(', ')} declares ${property}`)
        }
      }
    }
    expect(offenders, 'use the inline-start/inline-end forms so spacing follows the zone').toEqual([])
  })
})
