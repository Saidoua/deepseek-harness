/** `sidebarPdf` namespace: the PDF document renderer, its page labels, and its failures. */
import type { PdfLocaleKey } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/src/client/pdf/locales.ts'

/** Arabic dictionary, checked complete against the `sidebarPdf` key set. */
export const ar = {
  // PDF is the format's own name and keeps its Latin form.
  title: 'PDF',
  // {page} is the page number and renders verbatim.
  pageImage: 'صفحة PDF رقم {page}',
  loading: 'جارٍ فتح ملف PDF…',
  rendering: 'جارٍ رسم الصفحة…',
  // {message} carries the renderer's own diagnostic and renders verbatim.
  failed: 'تعذّر عرض ملف PDF: {message}',
  password: 'يتطلّب ملف PDF هذا كلمة مرور، ومعاينة الملفات المحمية غير مدعومة.',
  workerFailed: 'تعذّرت متابعة عملية عرض PDF؛ أعد المحاولة.',
  unsupported: 'تتطلّب معاينة PDF محتوى الملف كاملًا.',
  retry: 'إعادة المحاولة',
} satisfies Record<PdfLocaleKey, string>
