/** `settings.archivedSessions` namespace: the archived-session list in Settings. */
import type { ArchivedSessionsLocaleKey } from '@deepseek-ai/dsh-client-ui-settings-unarchive-sessions/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `settings.archivedSessions` key set. */
export const ar = {
  nav: 'المحادثات المؤرشفة',
  search: 'بحث في المحادثات المؤرشفة',
  loading: 'جارٍ قراءة المحادثات…',
  empty: 'لا توجد محادثات مؤرشفة.',
  unavailable: 'لا توجد هنا محادثة مؤرشفة يمكن استعادتها.',
  emptySearch: 'لا توجد محادثات مطابقة.',
  unarchive: 'إلغاء الأرشفة',
  unarchiveNamed: 'إلغاء أرشفة {title}',
  ungrouped: 'بلا مجموعة',
  // Compact relative ages; Arabic abbreviations keep the column narrow.
  'time.now': 'الآن',
  'time.minutes': '{n} د',
  'time.hours': '{n} س',
  'time.days': '{n} ي',
  'time.months': '{n} ش',
  'time.years': '{n} سنة',
} satisfies Record<ArchivedSessionsLocaleKey, string>
