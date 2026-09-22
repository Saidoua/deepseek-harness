/** `settings.plugins` namespace: the plugin configuration cards. */
import type { PluginsSettingsLocaleKey } from '@deepseek-ai/dsh-client-ui-settings-plugins/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `settings.plugins` key set. */
export const ar = {
  nav: 'الإضافات',
  title: 'الإضافات',
  intro: 'اضبط الإضافات المثبّتة في هذا النشر واطّلع عليها.',
  tabs: 'طرق عرض الإضافات',
  empty: 'لا يعرض هذا النشر أي إعدادات للإضافات.',
} satisfies Record<PluginsSettingsLocaleKey, string>
