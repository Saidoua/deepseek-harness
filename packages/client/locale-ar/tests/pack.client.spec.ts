// @vitest-environment jsdom
/**
 * The pack's two failure modes that types cannot catch.
 *
 * Completeness is a compile-time guarantee: each dictionary is checked against
 * its namespace's key union, so a missing key fails the build. What no type
 * checks is the namespace *id* each dictionary registers under — a typo there
 * registers Arabic copy that nothing ever reads, and the UI silently falls
 * back to English. This spec pins those ids against the namespaces the shipped
 * packages register, and pins the reading-order attribute and stylesheet the
 * pack owns for exactly its lifetime.
 */
import { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, expect, it } from 'vitest'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { AR, apply, inject } from '../src/client/index.ts'
import { STYLESHEET_ID, TEXT_DIRECTION_ATTRIBUTE } from '../src/client/text-direction.ts'

const fibers: { dispose(): unknown }[] = []

afterEach(async () => {
  // Every case boots its own pack over the one jsdom document; disposing them
  // keeps a sheet or root subscription from one case out of the next.
  for (const fiber of fibers.splice(0)) await fiber.dispose()
})

/** Boot the pack over a bare locale runtime with no Host settings scope. */
async function bench() {
  const ctx = new Context()
  const locale = new LocaleRuntime(ctx)
  ctx.provide('locale', locale)
  const fiber = ctx.plugin({ inject: [...inject], apply })
  fibers.push(fiber)
  await fiber.await()
  return { locale, fiber }
}

describe('Arabic language pack', () => {
  it('adds a language that falls back to English', async () => {
    const { locale } = await bench()
    const definition = locale.getLocale().locales.find(entry => entry.id === AR)
    expect(definition).toEqual({ id: AR, label: 'العربية', fallback: 'en' })
  })

  it('marks the root right-to-left only while Arabic is active', async () => {
    const { locale } = await bench()
    const direction = () => document.documentElement.getAttribute(TEXT_DIRECTION_ATTRIBUTE)
    // Loading the pack does not claim the root for a language nobody chose.
    expect(direction()).toBeNull()
    locale.setLocale(AR)
    expect(direction()).toBe('rtl')
    locale.setLocale('en')
    expect(direction()).toBeNull()
  })

  it('mounts its stylesheet and releases the root on unload', async () => {
    const { locale, fiber } = await bench()
    const sheet = () => document.head.querySelector(`style[data-plugin-css="${STYLESHEET_ID}"]`)
    expect(sheet()).not.toBeNull()
    locale.setLocale(AR)
    await fiber.dispose()
    expect(sheet()).toBeNull()
    expect(document.documentElement.hasAttribute(TEXT_DIRECTION_ATTRIBUTE)).toBe(false)
  })

  it('translates through every namespace it registers', async () => {
    const { locale } = await bench()
    locale.setLocale(AR)
    // One key per namespace family, chosen where a wrong namespace id would
    // otherwise be invisible because English reads acceptably.
    expect(locale.bind('common')('cancel')).toBe('إلغاء')
    expect(locale.bind('sidebar')('session.new')).toBe('محادثة جديدة')
    expect(locale.bind('sidebarFiles')('type.label')).toBe('الملفات')
    expect(locale.bind('sidebarRight')('tab.guide.title')).toBe('البداية')
    expect(locale.bind('sidebarTerminal')('title')).toBe('الطرفية')
    expect(locale.bind('sidebarBrowser')('type.label')).toBe('المتصفح')
    expect(locale.bind('sidebarOffice')('title')).toBe('مستند Office')
    expect(locale.bind('pluginManager')('title')).toBe('الإضافات')
    expect(locale.bind('sidebarDocumentPreview')('wrap.aria')).toBe('التفاف الأسطر')
    expect(locale.bind('chat')('view.chat')).toBe('المحادثة')
    expect(locale.bind('conversation')('input.send')).toBe('إرسال الرسالة')
    expect(locale.bind('settings')('title')).toBe('الإعدادات')
    expect(locale.bind('settings.locale')('language.title')).toBe('اللغة')
    expect(locale.bind('workspace')('section.sessions')).toBe('المحادثات')
    expect(locale.bind('trajectory')('view.trajectory')).toBe('المسار')
    expect(locale.bind('directory-browser')('browser.home')).toBe('المجلد الرئيسي')
    expect(locale.bind('session-log-download')('menu.download')).toBe('تنزيل سجل المحادثة')
    expect(locale.bind('settings.account')('nav')).toBe('الحساب')
    expect(locale.bind('settings.agentLoop')('title')).toBe('حلقة الوكيل')
    expect(locale.bind('settings.shell')('title')).toBe('سطر الأوامر')
    expect(locale.bind('settings.subagent')('subagentTitle')).toBe('الوكيل الفرعي')
    expect(locale.bind('settings.webSearch')('title')).toBe('البحث في الويب')
    expect(locale.bind('sidebarExcel')('title')).toBe('جدول بيانات')
    expect(locale.bind('schedule.manager')('detail.label')).toBe('تفاصيل المهمة')
    expect(locale.bind('shortcuts')('title')).toBe('اختصارات لوحة المفاتيح')
    expect(locale.bind('shortcuts.layout')('toggle')).toBe('طي الشريط الجانبي الأيسر أو فتحه')
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
