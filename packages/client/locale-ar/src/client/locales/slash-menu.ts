/** `slash.menu` namespace: the composer's trigger menu. */
import type { MenuKey } from '@deepseek-ai/dsh-client-ui-input-trigger/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `slash.menu` key set. */
export const ar = {
  'command': 'الأوامر',
  'skill': 'المهارات',
  'subagent': 'الوكلاء الفرعيون',
  'loading': 'جارٍ التحميل…',
  'drill.aria': 'استعراض المجلد',
  'drill.hint': 'استعراض المجلد',
  // The key's printed name on the keyboard, not a translatable word.
  'drill.key': 'Tab',
  'crumbs.aria': 'التنقل بين المجلدات',
  'suggestions.aria': 'اقتراحات الإدخال',
} satisfies Record<MenuKey, string>
