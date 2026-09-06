/** `reference` namespace: the file and session reference picker. */
import type { ReferenceKey } from '@deepseek-ai/dsh-client-ui-reference/src/client/locales.ts'

export const ar = {
  'section.files': 'الملفات والمجلدات',
  'section.sessions': 'المحادثات',
  'candidate.noCwd': '(بدون مجلد عمل)',
  'crumb.root': 'مساحة العمل',
  'time.now': 'الآن',
  // Count-neutral: the runtime interpolates a Western digit without plural
  // categories, so each unit reads the same at every count.
  'time.minutes': '{n} د',
  'time.hours': '{n} س',
  'time.days': '{n} ي',
  'time.months': '{n} ش',
  'time.years': '{n} سنة',
} satisfies Record<ReferenceKey, string>
