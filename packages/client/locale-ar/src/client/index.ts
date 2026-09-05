/**
 * Arabic language pack. The plugin adds `ar` to the shared language catalog
 * and registers one dictionary per namespace, all as owned effects, so
 * unloading it removes the language and its copy together.
 *
 * The pack contributes translations and the language's reading order; it does
 * not decide layout. `direction: 'rtl'` reaches the document through the
 * locale runtime's root attribute, and the theme's single rule applies it to
 * the marked text zones ([decision](../../../../.agents/notes/proposed/feature/2026-09-05-arabic-rtl-language-pack.md)).
 *
 * Every dictionary is checked against its namespace's key union at compile
 * time, so a key added upstream without an Arabic counterpart fails this
 * package's typecheck rather than reaching a reader as a bare key.
 *
 * @module @deepseek-ai/dsh-client-locale-ar/client
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: pulls the `locale` service merge onto Context.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { ar as approval } from './locales/approval.ts'
import { ar as chat } from './locales/chat.ts'
import { ar as command } from './locales/command.ts'
import { ar as common } from './locales/common.ts'
import { ar as conversation } from './locales/conversation.ts'
import { ar as cordis } from './locales/cordis.ts'
import { ar as deliverables } from './locales/deliverables.ts'
import { ar as directoryBrowser } from './locales/directory-browser.ts'
import { ar as feedback } from './locales/feedback.ts'
import { ar as goal } from './locales/goal.ts'
import { ar as job } from './locales/job.ts'
import { ar as model } from './locales/model.ts'
import { ar as permissionAccess } from './locales/permission-access.ts'
import { ar as plan } from './locales/plan.ts'
import { ar as question } from './locales/question.ts'
import { ar as reference } from './locales/reference.ts'
import { ar as scheduleCatalog } from './locales/schedule-catalog.ts'
import { ar as settings } from './locales/settings.ts'
import { ar as settingsAgentPreset } from './locales/settings-agent-preset.ts'
import { ar as settingsLocale } from './locales/settings-locale.ts'
import { ar as settingsModels } from './locales/settings-models.ts'
import { ar as settingsPermission } from './locales/settings-permission.ts'
import { ar as settingsPluginInventory } from './locales/settings-plugin-inventory.ts'
import { ar as settingsPlugins } from './locales/settings-plugins.ts'
import { ar as settingsTheme } from './locales/settings-theme.ts'
import { ar as sidebar } from './locales/sidebar.ts'
import { ar as skill } from './locales/skill.ts'
import { ar as slashMenu } from './locales/slash-menu.ts'
import { ar as subagent } from './locales/subagent.ts'
import { ar as trajectory } from './locales/trajectory.ts'
import { ar as workflowRun } from './locales/workflow-run.ts'
import { ar as workspace } from './locales/workspace.ts'

/** The locale id this pack contributes, and the id stored as the preference. */
export const AR = 'ar'

/**
 * Namespace to Arabic dictionary. Each entry names the namespace exactly as
 * its owning package registers it; an id typo would register copy nothing
 * reads, which no type can catch, so the pack's spec pins this list against
 * the namespaces the composition actually declares.
 */
const DICTIONARIES: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.freeze({
  'approval': approval,
  'chat': chat,
  'command': command,
  'common': common,
  'conversation': conversation,
  'cordis': cordis,
  'deliverables': deliverables,
  'directory-browser': directoryBrowser,
  'feedback': feedback,
  'goal': goal,
  'job': job,
  'model': model,
  'permission.access': permissionAccess,
  'plan': plan,
  'question': question,
  'reference': reference,
  'schedule.catalog': scheduleCatalog,
  'settings': settings,
  'settings.agentPreset': settingsAgentPreset,
  'settings.locale': settingsLocale,
  'settings.models': settingsModels,
  'settings.permission': settingsPermission,
  'settings.pluginInventory': settingsPluginInventory,
  'settings.plugins': settingsPlugins,
  'settings.theme': settingsTheme,
  'sidebar': sidebar,
  'skill': skill,
  'slash.menu': slashMenu,
  'subagent': subagent,
  'trajectory': trajectory,
  'workflowRun': workflowRun,
  'workspace': workspace,
})

/** The locale service this pack contributes to. */
export const inject = ['locale']

/**
 * Client plugin body: add the language, then its dictionaries.
 *
 * The order does not matter to the registry, but the language is added first
 * so a dictionary failure leaves a selectable language falling back to
 * English rather than dictionaries nothing can select.
 * @param ctx - client cordis context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(
    () => ctx.locale.addLanguage({
      // The label is written in the language it names, so a reader who cannot
      // read the current interface language still finds their own.
      id: AR, label: 'العربية', fallback: 'en', direction: 'rtl',
    }),
    'locale-ar: language',
  )
  for (const [namespace, dictionary] of Object.entries(DICTIONARIES)) {
    ctx.effect(
      () => ctx.locale.register(namespace, AR, { ...dictionary }),
      `locale-ar: ${namespace} dictionary`,
    )
  }
}
