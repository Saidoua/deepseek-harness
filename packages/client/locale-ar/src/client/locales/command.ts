/** `command` namespace: the slash-command option palette. */
import type { CommandKey } from '@deepseek-ai/dsh-client-ui-commands/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `command` key set. */
export const ar = {
  'section.add': 'إضافة',
  'section.commands': 'الأوامر',
  'label.goal': 'الهدف',
  'label.plan': 'الخطة',
  'label.feedback': 'الملاحظات',
  'label.compact': 'ضغط',
  'label.permission': 'الأذونات',
  'label.export': 'تصدير',
  // Typed slash tokens stay Latin: they are what the user types.
  'token.goal': 'goal',
  'token.plan': 'plan',
  'token.feedback': 'feedback',
  'token.compact': 'compact',
  'token.permission': 'permission',
  'token.export': 'export',
  'search.placeholder': 'بحث…',
  'search.aria': 'تصفية الخيارات',
  'status.loading': 'جارٍ تحميل الخيارات…',
  'status.applying': 'جارٍ التطبيق…',
  'status.empty': 'لا توجد خيارات',
  // {command} is the typed command name and stays as the user wrote it.
  'overlay.aria': 'خيارات ‎/{command}‎',
  'listbox.aria': 'نتائج ‎/{command}‎',
  'notice.attachmentsUnsupported': 'لا يقبل ‎/{command}‎ مرفقات؛ أزلها أولًا',
  'description.compact': 'ضغط سجل المحادثة الأقدم',
  'description.export': 'تنزيل سجل هذه المحادثة كأرشيف ZIP',
  'description.feedback': 'تسجيل ملاحظات حول هذه المحادثة',
  'description.goal': 'تعيين هدف مهمة طويلة أو عرضه',
  'description.permission': 'تبديل إعداد الأذونات المسبق (وضع الحماية وسياسة الموافقة)',
  'description.plan': 'الدخول إلى وضع الخطة أو الخروج منه',
} satisfies Record<CommandKey, string>
