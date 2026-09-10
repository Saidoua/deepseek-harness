/** `deliverables` namespace: files a turn presented, and the files it changed. */
import type { DeliverablesKey } from '@deepseek-ai/dsh-client-ui-deliverables/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `deliverables` key set. */
export const ar = {
  'presented.nativeUnavailable': 'لا يوجد مسار مضيف متاح لهذا الملف؛ عايِنه في الشريط الجانبي',
  'presented.revealError': 'تعذّر العرض في مدير الملفات؛ أعد المحاولة',
  'presented.directoryError': 'تعذّر فتح المجلد الحاوي؛ أعد المحاولة',
  'presented.directoryOpening': 'جارٍ فتح المجلد الحاوي…',
  'presented.directoryOpened': 'طُلب فتح المجلد الحاوي',
  'presented.revealed': 'طُلب العرض في مدير الملفات',
  'presented.revealing': 'جارٍ العرض في مدير الملفات…',
  'presented.unavailable': 'لا يوجد سطح مكتب متاح على هذا المضيف لفتح الملفات أو المجلدات',
  'presented.retry': 'إعادة المحاولة',
  'presented.hostError': 'تعذّرت قراءة معلومات سطح مكتب المضيف',
  'presented.directory': 'فتح المجلد الحاوي',
  // File Explorer and Finder are the host file managers' own product names and
  // keep the form the reader sees in their operating system.
  'presented.explorer': 'العرض في File Explorer',
  'presented.finder': 'العرض في Finder',
  'presented.defaultApp': 'الفتح بالتطبيق الافتراضي',
  // {name} is the presented file's own name and renders verbatim.
  'presented.more': 'مزيد من إجراءات الملف {name}',
  'presented.action': 'فتح',
  'presented.preview': 'معاينة في الشريط الجانبي',
  'presented.previewButton': 'فتح {name} في الشريط الجانبي',
  'presented.previewCard': 'معاينة {name} في الشريط الجانبي',
  // {count} is the presented-file count and renders verbatim.
  'presented.all': 'كل الملفات ({count})',
  'presented.expandAria': 'عرض كل الملفات المُسلَّمة ({count})',
  'presented.collapse': 'طي',
  'presented.collapseAria': 'طي قائمة الملفات المُسلَّمة',
  'presented.opening': 'جارٍ الفتح…',
  'presented.opened': 'فُتح بالتطبيق الافتراضي',
  'presented.error': 'تعذّر الفتح؛ انقر لإعادة المحاولة',
  'presented.file': 'ملف',
  'row.title': 'تسليم الملفات',
  'row.running': 'جارٍ التسليم',
  'row.ok': 'تم التسليم',
  'row.error': 'أخفق التسليم',
  'row.stopped': 'أُوقف',
  'row.inspect': 'عرض الاستدعاء',
  'produced.label': 'الملفات المتغيّرة',
  'produced.moreOne': '+ ملف واحد',
  'produced.more': '+ {count} ملف',
  // {name} is the produced file's own name and renders verbatim.
  'produced.open': 'فتح {name}',
} satisfies Record<DeliverablesKey, string>
