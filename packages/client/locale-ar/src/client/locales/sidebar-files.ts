/** `sidebarFiles` namespace: the workspace file tree tab in the right sidebar. */
import type { SidebarFilesKey } from '@deepseek-ai/dsh-client-ui-sidebar-files/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `sidebarFiles` key set. */
export const ar = {
  'type.label': 'الملفات',
  'guide.title': 'ملفات مساحة العمل',
  loading: 'جارٍ القراءة…',
  empty: 'مجلد فارغ',
  truncated: 'المدخلات كثيرة جدًا، يُعرض بعضها فقط.',
  noWorkspace: 'لا يوجد مجلد مساحة عمل لهذه المحادثة.',
  reload: 'إعادة التحميل',
  'entry.other': 'ليس ملفًا ولا مجلدًا، لذا لا يمكن فتحه.',
  'error.notFound': 'هذا المجلد لم يعد موجودًا. ربما نُقل أو حُذف.',
  'error.outsideWorkspace': 'هذا المجلد خارج مساحة العمل، لذا لن يقرأه الشريط الجانبي.',
  'error.notDirectory': 'هذا ليس مجلدًا.',
  // {message} carries the Host's own diagnostic and renders verbatim.
  'error.unavailable': 'أخفقت القراءة: {message}',
} satisfies Record<SidebarFilesKey, string>
