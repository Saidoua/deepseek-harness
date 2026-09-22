/** `sidebarExcel` namespace: the spreadsheet preview in the right sidebar. */
import type { ExcelPreviewKey } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/src/client/excel/locales.ts'

/** Arabic dictionary, checked complete against the `sidebarExcel` key set. */
export const ar = {
  title: 'جدول بيانات',
  // The spreadsheet component's own locale id; it ships no Arabic locale, so
  // its built-in menus stay English.
  language: 'en',
  loading: 'جارٍ فتح جدول البيانات…',
  invalid: 'تعذّر فتح جدول البيانات هذا. تحقّق من صيغته أو محتواه أو حمايته بكلمة مرور.',
  tooLarge: 'يتجاوز هذا المصنّف الحد الأقصى لحجم المعاينة.',
  timeout: 'انتهت مهلة فتح هذا المصنّف. جرّب ملفًا أصغر.',
  encoding: 'تعذّرت قراءة ترميز النص هذا. احفظ الملف بترميز UTF-8 أو UTF-16 مع BOM وأعد المحاولة.',
  formulaWarning: 'يحتوي هذا المصنّف على صيغ. قد تكون النتائج المعروضة ناقصة أو غير دقيقة.',
  // {features} is the joined list of the feature names below.
  unsupportedNotice: 'لا تدعم هذه المعاينة {features} في هذا المصنّف. افتحه في تطبيق النظام للحصول على التجربة الكاملة.',
  charts: 'المخططات',
  images: 'الصور',
  shapes: 'الأشكال',
  conditionalFormatting: 'التنسيق الشرطي',
  featureSeparator: '، ',
  retry: 'إعادة المحاولة',
} satisfies Record<ExcelPreviewKey, string>
