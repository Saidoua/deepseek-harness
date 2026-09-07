/** `sidebarTextpreview` namespace: the paged text-file reader in the right sidebar. */
import type { SidebarTextpreviewKey } from '@deepseek-ai/dsh-client-ui-sidebar-textpreview/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `sidebarTextpreview` key set. */
export const ar = {
  loading: 'جارٍ القراءة…',
  loadMore: 'تحميل المزيد',
  changed: 'تغيّر الملف؛ هذا هو النص الأقدم.',
  reloadNow: 'إعادة التحميل',
  reload: 'إعادة قراءة الملف',
  wrap: 'التفاف الأسطر',
  'error.notFound': 'هذا الملف لم يعد موجودًا. ربما نُقل أو حُذف.',
  'error.outsideWorkspace': 'هذا الملف خارج مساحة العمل، لذا لن يقرأه الشريط الجانبي.',
  // {limit} is the formatted size cap and renders verbatim.
  'error.tooLarge': 'هذه الصفحة كبيرة جدًا؛ لا يقرأ الشريط الجانبي صفحات تتجاوز {limit}.',
  'error.notText': 'هذا ليس ملفًا نصيًا، لذا لا يمكن عرضه هنا.',
  'error.notRegularFile': 'هذا ليس ملفًا عاديًا، لذا لا يحوي نصًا لعرضه.',
  // {message} carries the Host's own diagnostic and renders verbatim.
  'error.unavailable': 'أخفقت القراءة: {message}',
  retry: 'إعادة المحاولة',
} satisfies Record<SidebarTextpreviewKey, string>
