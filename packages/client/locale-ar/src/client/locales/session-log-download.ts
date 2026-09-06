/** `session-log-download` namespace: the Session log export control and dialog. */
import type { SessionLogDownloadKey } from '@deepseek-ai/dsh-session-log-export/src/client/locales.ts'

export const ar = {
  'header.action': 'سجل المحادثة',
  'dialog.preparingTitle': 'جارٍ تصدير المحادثة',
  // ZIP is the archive format's own name.
  'dialog.preparingDescription': 'جارٍ تحضير ملف ZIP يضم هذه المحادثة ومحادثاتها الفرعية ومرفقاتها.',
  'dialog.successTitle': 'بدأ تنزيل المحادثة',
  'dialog.successDescription': 'يقوم المتصفح بتنزيل ملف ZIP الخاص بالمحادثة.',
  'dialog.errorTitle': 'أخفق تصدير المحادثة',
  'dialog.close': 'إغلاق',
  'dialog.commandFailed': 'تعذّر بدء تصدير المحادثة.',
} satisfies Record<SessionLogDownloadKey, string>
