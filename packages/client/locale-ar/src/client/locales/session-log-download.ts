/** `session-log-download` namespace: the Session log export control and dialog. */
import type { SessionLogDownloadKey } from '@deepseek-ai/dsh-session-log-export/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `session-log-download` key set. */
export const ar = {
  'header.more': 'مزيد من الإجراءات',
  'menu.download': 'تنزيل سجل المحادثة',
  'menu.feedback': 'الملاحظات',
  'menu.copyMarkdown': 'نسخ المحادثة بصيغة Markdown',
  'toast.copied': 'نُسخت المحادثة بصيغة Markdown.',
  'toast.preparationFailed': 'تعذّر قراءة المحادثة للنسخ. حاول مجددًا.',
  'toast.clipboardFailed': 'تعذّرت الكتابة إلى الحافظة. تحقّق من إذن الحافظة ثم حاول مجددًا.',
  'dialog.preparingTitle': 'جارٍ تصدير المحادثة',
  // ZIP is the archive format's own name.
  'dialog.preparingDescription': 'جارٍ تحضير ملف ZIP يضم هذه المحادثة ومحادثاتها الفرعية ومرفقاتها.',
  'dialog.successTitle': 'بدأ تنزيل المحادثة',
  'dialog.successDescription': 'يقوم المتصفح بتنزيل ملف ZIP الخاص بالمحادثة.',
  'dialog.errorTitle': 'أخفق تصدير المحادثة',
  'dialog.close': 'إغلاق',
  'dialog.commandFailed': 'تعذّر بدء تصدير المحادثة.',
} satisfies Record<SessionLogDownloadKey, string>
