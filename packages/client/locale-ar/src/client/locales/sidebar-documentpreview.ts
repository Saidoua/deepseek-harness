/** `sidebarDocumentPreview` namespace: the paged document reader in the right sidebar. */
import type { SidebarDocumentPreviewKey } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `sidebarDocumentPreview` key set. */
export const ar = {
  loading: 'جارٍ القراءة…',
  loadMore: 'تحميل المزيد',
  changed: 'تغيّر الملف، والمعروض هو المحتوى السابق.',
  reloadNow: 'إعادة التحميل',
  reload: 'إعادة قراءة الملف',
  'wrap.enable': 'تفعيل التفاف الأسطر',
  'wrap.disable': 'تعطيل التفاف الأسطر',
  'wrap.aria': 'التفاف الأسطر',
  openWith: 'الفتح بواسطة',
  'viewer.text': 'نص عادي',
  resourceUnavailable: 'خدمة موارد الملفات غير متاحة.',
  // {name} is the renderer's own name and renders verbatim.
  rendererUnavailable: 'معاينة {name} غير متاحة.',
  'error.notFound': 'هذا الملف لم يعد موجودًا. ربما نُقل أو حُذف.',
  // {limit} is the formatted size cap and renders verbatim.
  'error.tooLarge': 'تتجاوز هذه الصفحة حد {limit}، لذا تعذّرت قراءتها.',
  'error.notText': 'هذا ليس ملفًا نصيًا، لذا لا يمكن معاينته الآن.',
  'error.notRegularFile': 'هذا ليس ملفًا عاديًا، لذا لا يحوي ما يُعرض.',
  // {message} carries the Host's own diagnostic and renders verbatim.
  'error.unavailable': 'أخفقت القراءة: {message}',
  retry: 'إعادة المحاولة',
} satisfies Record<SidebarDocumentPreviewKey, string>
