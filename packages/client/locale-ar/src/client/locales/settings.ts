/** `settings` namespace: the Settings shell and the connection indicator. */
import type { SettingsKey } from '@deepseek-ai/dsh-client-ui-settings-general/src/client/locales.ts'

export const ar = {
  'trigger': 'الإعدادات',
  'title': 'الإعدادات',
  'close': 'إغلاق',
  'openDocument': 'فتح ملف الإعدادات',
  'openDocument.error': 'تعذّر فتح ملف الإعدادات',
  'general.nav': 'عام',
  'connection.error': 'انقطع الاتصال',
  'connection.retry': 'إعادة الاتصال الآن',
  'connection.connecting': 'جارٍ الاتصال',
  'connection.connected': 'متصل',
  'connection.reconnect': 'انقطع الاتصال، أعد الاتصال الآن',
  'connection.restart': 'جارٍ الاتصال، أعد التشغيل الآن',
} satisfies Record<SettingsKey, string>
