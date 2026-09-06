// Keyless assembled-browser coverage for zone-scoped text alignment over the
// shipped Web bundles. The locale plugin's own specs pin that a right-to-left
// language reaches the root attribute; this scenario pins what that attribute
// does to the rendered page, which only a real browser resolves: marked text
// moves to the right while every box stays exactly where the design put it.
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it, onTestFailed } from 'vitest'
import { launchWebScaffold, watchConsole, type WebScaffold } from './scaffold.ts'
import { newEnglishPage, saveFailureShot } from './support.ts'

/** Root attribute the locale plugin writes for a right-to-left language. */
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

/** Apply or retract the root attribute exactly as the locale plugin does. */
async function setDirection(page: Page, value: 'ltr' | 'rtl'): Promise<void> {
  await page.evaluate(([attribute, next]) => {
    document.documentElement.setAttribute(attribute!, next!)
  }, [DIRECTION_ATTRIBUTE, value])
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

    // The served page opens left-to-right, so this is the baseline every
    // assertion below is a delta from.
    expect(await page.getAttribute('html', DIRECTION_ATTRIBUTE)).toBe('ltr')
    const frameBefore = await box(page, '[class*="sidebarCol"]')
    const composerBefore = await box(page, composer)
    expect(composerBefore.textAlign).toBe('start')
    // The composer's text surface carries authored words, so it follows what
    // is typed rather than the interface language; the zone around it carries
    // product copy and is what the language moves.
    const zone = '[class*="regionArea"]'
    expect((await box(page, zone)).textAlign).toBe('start')

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
    expect((await box(page, zone)).textAlign).toBe('start')
    expect(tripwire.warnings).toEqual([])
    expect(tripwire.pageErrors).toEqual([])
  })
})
