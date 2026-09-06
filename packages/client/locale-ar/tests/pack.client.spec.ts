// @vitest-environment jsdom
/**
 * The pack's two failure modes that types cannot catch.
 *
 * Completeness is a compile-time guarantee: each dictionary is checked against
 * its namespace's key union, so a missing key fails the build. What no type
 * checks is the namespace *id* each dictionary registers under — a typo there
 * registers Arabic copy that nothing ever reads, and the UI silently falls
 * back to English. This spec pins those ids against the namespaces the shipped
 * packages register, and pins that the language reaches the catalog with the
 * reading order the document attribute is driven from.
 */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { AR, apply, inject } from '../src/client/index.ts'

/** Boot the pack over a bare locale runtime with no Host settings scope. */
async function bench() {
  const ctx = new Context()
  const locale = new LocaleRuntime(ctx)
  ctx.provide('locale', locale)
  const fiber = ctx.plugin({ inject: [...inject], apply })
  await fiber.await()
  return { locale, fiber }
}

describe('Arabic language pack', () => {
  it('adds a right-to-left language that falls back to English', async () => {
    const { locale } = await bench()
    const definition = locale.getLocale().locales.find(entry => entry.id === AR)
    expect(definition).toEqual({ id: AR, label: 'العربية', fallback: 'en', direction: 'rtl' })
  })

  it('translates through every namespace it registers', async () => {
    const { locale } = await bench()
    locale.setLocale(AR)
    // One key per namespace family, chosen where a wrong namespace id would
    // otherwise be invisible because English reads acceptably.
    expect(locale.bind('common')('cancel')).toBe('إلغاء')
    expect(locale.bind('sidebar')('session.new')).toBe('محادثة جديدة')
    expect(locale.bind('chat')('view.chat')).toBe('المحادثة')
    expect(locale.bind('conversation')('input.send')).toBe('إرسال الرسالة')
    expect(locale.bind('settings')('title')).toBe('الإعدادات')
    expect(locale.bind('settings.locale')('language.title')).toBe('اللغة')
    expect(locale.bind('workspace')('section.sessions')).toBe('المحادثات')
    expect(locale.bind('trajectory')('view.trajectory')).toBe('المسار')
    expect(locale.bind('directory-browser')('browser.home')).toBe('المجلد الرئيسي')
    expect(locale.bind('session-log-download')('header.action')).toBe('سجل المحادثة')
  })

  it('leaves an untranslated key on the English fallback rather than the bare key', async () => {
    const { locale } = await bench()
    // A namespace outside the typed table stands in for one this pack has not
    // translated: the declared fallback chain must reach English.
    locale.register('pack-spec', 'en', { only: 'English only' })
    locale.setLocale(AR)
    expect(locale.bind('pack-spec')('only')).toBe('English only')
  })

  it('removes the language and its copy together on unload', async () => {
    const { locale, fiber } = await bench()
    locale.setLocale(AR)
    await fiber.dispose()
    expect(locale.getLocale().locales.map(entry => entry.id)).not.toContain(AR)
    // The active selection returns to an available locale, so no reader is
    // stranded on a language the catalog no longer offers.
    expect(locale.getLocale().active).not.toBe(AR)
  })
})
