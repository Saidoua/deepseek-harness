// Keyless assembled-browser coverage for the Arabic language pack over the
// shipped Web bundles: selecting the language through the product's own
// Settings row translates the interface, drives the root text-direction
// attribute, and leaves the application frame where it was.
import type { Browser, Page } from 'playwright'
import { chromium } from 'playwright'
import { afterAll, beforeAll, describe, expect, it, onTestFailed } from 'vitest'
import { launchWebScaffold, watchConsole, type WebScaffold } from './scaffold.ts'
import { newEnglishPage, saveFailureShot } from './support.ts'

/** Root attribute the locale plugin writes for the active language. */
const DIRECTION_ATTRIBUTE = 'data-dsh-text-direction'
/** The language's own name, as the pack registers it in the catalog. */
const ARABIC_LABEL = 'العربية'

describe('web e2e: Arabic language pack', () => {
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

  it('offers Arabic, translates the shell, and turns the text zones over', async () => {
    onTestFailed(() => saveFailureShot(page, 'web-e2e-arabic-language-pack'))
    // The scaffold cannot persist the welcome notice's acknowledgement, so the
    // overlay is detached; it only covers the surface under test.
    await page.evaluate(() => {
      document.querySelector('[role="dialog"]')?.closest('[role="presentation"]')?.remove()
    })
    const sidebarBefore = await page.locator('[class*="sidebarCol"]').first().boundingBox()
    expect(await page.getAttribute('html', DIRECTION_ATTRIBUTE)).toBe('ltr')

    // The pack registers the language into the shared catalog, so it reaches
    // the product's own Settings row with no wiring of its own.
    // The overlay's own pointer lock survives detaching the notice, so the
    // Settings control is opened through its click handler directly.
    await page.evaluate(() => {
      const settings = [...document.querySelectorAll('button')]
        .find(node => (node.textContent ?? '').trim() === 'Settings')
      settings?.click()
    })
    // The Language row opens a menu rather than a native select, so the
    // language is chosen the way a reader does: open the row, pick the entry
    // that names itself in its own language.
    await page.getByRole('dialog').first().waitFor({ timeout: 15_000 })
    await page.evaluate(() => {
      const trigger = [...document.querySelectorAll('button')]
        .find(node => (node.textContent ?? '').includes('English'))
      trigger?.click()
    })
    // English first: the same dialog before any language change is the
    // baseline every Arabic assertion below is a delta from.
    await page.screenshot({ path: '/private/tmp/claude-501/-Users-saidouahdachi-dsh-upstream/d37fb16d-e4c9-4e23-ad03-109031101bae/scratchpad/settings-en.png' })
    const arabic = page.getByText(ARABIC_LABEL, { exact: true }).first()
    await arabic.waitFor({ timeout: 15_000 })
    await arabic.click({ force: true })

    expect(await page.getAttribute('html', 'lang')).toBe('ar')
    expect(await page.getAttribute('html', DIRECTION_ATTRIBUTE)).toBe('rtl')
    await page.screenshot({ path: '/private/tmp/claude-501/-Users-saidouahdachi-dsh-upstream/d37fb16d-e4c9-4e23-ad03-109031101bae/scratchpad/arabic.png' })
    // The frame is the whole point of the zone design: the language changed,
    // the column did not.
    const sidebarAfter = await page.locator('[class*="sidebarCol"]').first().boundingBox()
    expect(sidebarAfter).toEqual(sidebarBefore)
    expect(tripwire.pageErrors).toEqual([])
  })
})
