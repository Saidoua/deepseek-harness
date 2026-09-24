// Keyless assembled-browser coverage for zone-scoped text alignment over the
// shipped Web bundles. The Arabic pack's own specs pin that it writes the root
// attribute; this scenario pins what the pack's stylesheet does with it on the
// rendered page, which only a real browser resolves: zone text moves to the
// right while every box stays exactly where the design put it.
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it, onTestFailed } from 'vitest'
import { launchWebScaffold, watchConsole, type WebScaffold } from './scaffold.ts'
import { newEnglishPage, saveFailureShot } from './support.ts'

/** Root attribute the Arabic pack writes while Arabic is active. */
const DIRECTION_ATTRIBUTE = 'data-dsh-text-direction'
/** Arabic sample: first-strong right-to-left, so bidi resolution is observable. */
const ARABIC = 'اكتب اختبارًا للواجهة'

/** Left edge and resolved direction of one element, in page pixels. */
async function box(page: Page, selector: string) {
  return await page.locator(selector).first().evaluate((node) => {
    const element = node as HTMLElement
    const rect = element.getBoundingClientRect()
    return {
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      direction: getComputedStyle(element).direction,
      textAlign: getComputedStyle(element).textAlign,
    }
  })
}

/** Apply or retract the root attribute exactly as the Arabic pack does. */
async function setDirection(page: Page, value: 'ltr' | 'rtl'): Promise<void> {
  await page.evaluate(([attribute, next]) => {
    if (next === 'rtl') document.documentElement.setAttribute(attribute, next)
    else document.documentElement.removeAttribute(attribute)
  }, [DIRECTION_ATTRIBUTE, value])
}

/** Which edge of its block a paragraph's text sits against, from the rendered glyph box. */
async function textEdge(page: Page, selector: string): Promise<'left' | 'right'> {
  return await page.locator(selector).first().evaluate((node) => {
    const block = node.getBoundingClientRect()
    const range = document.createRange()
    range.selectNodeContents(node)
    const text = range.getBoundingClientRect()
    return text.left - block.left < block.right - text.right ? 'left' : 'right'
  })
}

describe('web e2e: zone-scoped text direction', () => {
  let scaffold: WebScaffold
  let browser: Browser
  let page: Page
  let tripwire: ReturnType<typeof watchConsole>

  beforeAll(async () => {
    scaffold = await launchWebScaffold()
    browser = await chromium.launch()
    page = await newEnglishPage(browser)
    tripwire = watchConsole(page)
    const login = await page.context().request.get(scaffold.authenticatedUrl, { maxRedirects: 0 })
    expect(login.status()).toBe(303)
    await page.goto(`${scaffold.baseUrl}?fixture`, { waitUntil: 'load' })
    await page.waitForSelector('[class*="frame"]', { timeout: 30_000 })
  }, 120_000)

  afterAll(async () => {
    await browser?.close()
    await scaffold?.close()
  })

  it('moves zone text to the reading edge while every box stays put', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-text-direction-zones'))
    // The scaffold cannot persist the welcome notice's acknowledgement, so the
    // overlay is detached instead of clicked. It only obscures the surface
    // under test; every assertion below reads computed style and geometry.
    await page.evaluate(() => {
      document.querySelector('[role="dialog"]')?.closest('[role="presentation"]')?.remove()
    })
    const composer = '[data-composer-input]'
    await page.locator(composer).first().waitFor({ timeout: 15_000 })
    // Detaching the notice leaves the body's modal pointer lock in place, which
    // no product gesture clears here, so the surface is focused past it.
    await page.locator(composer).first().click({ force: true })
    await page.keyboard.type(ARABIC)

    // The served page opens in English, where the pack claims nothing on the
    // root, so this is the baseline every assertion below is a delta from.
    expect(await page.getAttribute('html', DIRECTION_ATTRIBUTE)).toBeNull()
    const frameBefore = await box(page, '[class*="sidebarCol"]')
    const composerBefore = await box(page, composer)
    expect(composerBefore.textAlign).toBe('start')
    // The composer's text surface carries authored words, so it follows what
    // is typed rather than the interface language; the zone around it carries
    // product copy and is what the language moves.
    const zone = '[class*="regionArea"]'
    const zoneBefore = await box(page, zone)

    await setDirection(page, 'rtl')
    const frameAfter = await box(page, '[class*="sidebarCol"]')
    const composerAfter = await box(page, composer)

    // The whole point: the sidebar column does not move or resize, so no
    // chrome the user navigates by changes place with the language.
    expect(frameAfter).toEqual(frameBefore)
    // The marked zone's text moves to the reading edge — and only its text.
    const zoneAfter = await box(page, zone)
    expect(zoneAfter.textAlign).toBe('right')
    // `direction` is never set, so nothing reorders inside the zone either.
    expect(zoneAfter.direction).toBe('ltr')
    expect(composerAfter.direction).toBe('ltr')
    // Authored text keeps deciding for itself inside a right-aligned zone.
    expect(composerAfter.textAlign).toBe('start')
    expect(composerAfter.left).toBe(composerBefore.left)
    expect(composerAfter.width).toBe(composerBefore.width)

    await setDirection(page, 'ltr')
    expect((await box(page, zone)).textAlign).toBe(zoneBefore.textAlign)
    expect(tripwire.warnings).toEqual([])
    expect(tripwire.pageErrors).toEqual([])
  })

  it('lets every paragraph of authored text follow its own words', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-text-direction-authored'))
    // A reply that opens in English and continues in Arabic, a message the
    // reader wrote, and a code block, under class names spelled the way the
    // client bundler spells the shipped components' (`<hash>_markdown`).
    await page.evaluate((arabic) => {
      const flow = document.createElement('div')
      flow.dataset.chatFlow = ''
      flow.id = 'authored-probe'
      flow.style.width = '600px'
      flow.innerHTML = '<div class="Pr0be_markdown"><p id="p-en">An English opening line</p>'
        + `<p id="p-ar">${arabic}</p><pre id="p-code">const x = 1</pre></div>`
        + `<div class="Pr0be_bubble" id="p-bubble">${arabic}</div>`
      document.body.appendChild(flow)
    }, ARABIC)
    for (const value of ['ltr', 'rtl'] as const) {
      await setDirection(page, value)
      // Each paragraph resolves its own reading order, so the Arabic one sits
      // on the right even after an English opening, in either interface.
      expect(await textEdge(page, '#p-en')).toBe('left')
      expect(await textEdge(page, '#p-ar')).toBe('right')
      expect(await textEdge(page, '#p-bubble')).toBe('right')
      // Code keeps its column order inside a right-aligned zone.
      expect(await textEdge(page, '#p-code')).toBe('left')
      expect((await box(page, '#p-ar')).direction).toBe('ltr')
    }
    await setDirection(page, 'ltr')
    await page.evaluate(() => { document.getElementById('authored-probe')?.remove() })
    expect(tripwire.pageErrors).toEqual([])
  })
})
