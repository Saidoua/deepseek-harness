/**
 * Reading-order support the pack contributes without touching the components
 * it styles: a root attribute that says Arabic is active, and the stylesheet
 * that turns that attribute into alignment on surfaces the shipped components
 * already expose ([decision](../../../../../.agents/notes/implemented/architecture/2026-09-24-rtl-from-the-language-pack.md)).
 *
 * @module @deepseek-ai/dsh-client-locale-ar/client/text-direction
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the `locale` service merge onto Context.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import css from './text-direction.css?inline'

/** Root attribute that carries `rtl` while the pack's language is active; absent otherwise. */
export const TEXT_DIRECTION_ATTRIBUTE = 'data-dsh-text-direction'

/** `data-plugin-css` value of the stylesheet tag, so the mounted sheet is identifiable in the document. */
export const STYLESHEET_ID = '@deepseek-ai/dsh-client-locale-ar/text-direction.css'

/**
 * Mount the text-direction stylesheet and keep the root attribute in step
 * with the active language, both for exactly the plugin's lifetime. The
 * attribute is written only while `language` is active and removed on any
 * other language or on unload, so the pack never claims the root for a
 * language it does not own. Browserless boots have no document and skip both.
 * @param ctx - owning client plugin context; needs the `locale` service.
 * @param language - locale id whose activation turns the zones right-to-left.
 */
export function installTextDirection(ctx: ClientContext, language: string): void {
  if (typeof document === 'undefined') return
  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.pluginCss = STYLESHEET_ID
    tag.textContent = css
    document.head.appendChild(tag)
    return () => { tag.remove() }
  }, 'locale-ar: text-direction stylesheet')
  ctx.effect(() => {
    const root = document.documentElement
    const sync = (): void => {
      if (ctx.locale.getLocale().active === language) root.setAttribute(TEXT_DIRECTION_ATTRIBUTE, 'rtl')
      else root.removeAttribute(TEXT_DIRECTION_ATTRIBUTE)
    }
    sync()
    const unsubscribe = ctx.locale.subscribe(sync)
    return () => {
      unsubscribe()
      root.removeAttribute(TEXT_DIRECTION_ATTRIBUTE)
    }
  }, 'locale-ar: root text direction')
}
