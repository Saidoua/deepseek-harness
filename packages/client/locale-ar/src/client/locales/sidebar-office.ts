/** `sidebarOffice` namespace: Office document previews in the right sidebar. */
import type { OfficePreviewKey } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/src/client/office/locales.ts'

/** Arabic dictionary, checked complete against the `sidebarOffice` key set. */
export const ar = {
  title: 'مستند Office',
  loading: 'جارٍ القراءة…',
  retry: 'إعادة المحاولة',
  // {fonts} is the list of font family names and renders verbatim.
  missingFonts: 'الخطوط المستخدمة في هذا المستند غير متاحة: {fonts}. قد يختلف النص والتنسيق.',
  showMore: 'عرض المزيد',
  dismissNotice: 'إغلاق تنبيه الخطوط',
  missingFontsTitle: 'الخطوط المفقودة',
  missingFontsDescription: 'هذه الخطوط غير متاحة لهذه المعاينة. قد يختلف النص والتنسيق عن المستند الأصلي.',
  missingFontsCount: 'الخطوط: {count}',
  closeDetails: 'إغلاق تفاصيل الخطوط',
  unavailable: 'معاينة Office غير متاحة. فعّل خدمة معاينة المستندات على الجهاز الذي يشغّل DeepSeek Harness.',
  invalid: 'لا يمكن معاينة ملف Office هذا. قد يكون تالفًا أو محميًا بكلمة مرور أو امتداده غير صحيح.',
  tooLarge: 'ملف Office أو ملف PDF المحوَّل يتجاوز الحد الأقصى لحجم المعاينة. صغّر الملف أو عدّل إعدادات المعاينة.',
  failed: 'لم يُنتج تحويل Office ملف PDF صالحًا. تحقّق من الملف ثم أعد المحاولة.',
  timeout: 'انتهت مهلة تحويل Office. أعد المحاولة.',
  busy: 'معاينة Office مشغولة. أعد المحاولة بعد قليل.',
  changed: 'تغيّر الملف أثناء قراءته. أعد فتح المعاينة.',
} satisfies Record<OfficePreviewKey, string>
