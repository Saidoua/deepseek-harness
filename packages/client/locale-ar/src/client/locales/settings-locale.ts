/** `settings.locale` namespace: the Language row in Settings. */
import type { SettingsLocaleKey } from '@deepseek-ai/dsh-client-locale/src/locales/settings.ts'

/** Arabic dictionary, checked complete against the `settings.locale` key set. */
export const ar = {
  'language.title': 'اللغة',
} satisfies Record<SettingsLocaleKey, string>
