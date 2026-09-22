/** `sidebarBrowser` namespace: the browser tab in the right sidebar. */
import type { SidebarBrowserKey } from '@deepseek-ai/dsh-client-ui-sidebar-browser/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `sidebarBrowser` key set. */
export const ar = {
  'type.label': 'المتصفح',
  'guide.title': 'المتصفح',
  'guide.description': 'تصفّح صفحات HTTP(S)',
  'address.placeholder': 'أدخل عنوان HTTP(S)',
  'address.changed': 'تغيّر عنوان URL',
  back: 'رجوع',
  forward: 'تقدّم',
  reload: 'إعادة التحميل',
  go: 'انتقال',
  external: 'الفتح في متصفح النظام',
  'sandbox.disable': 'تعطيل قيود العزل',
  'sandbox.enable': 'استعادة قيود العزل',
  'sandbox.warning': 'قيود العزل معطّلة؛ يمكن للصفحة التنقل في التطبيق الرئيسي واستخدام التنزيلات ومربعات الحوار الشرطية وقفل الإدخال.',
  start: 'أدخل عنوان HTTP(S) لبدء التصفح',
  loading: 'جارٍ الفتح…',
  'restore.previous': 'مفتوحة سابقًا',
  'restore.action': 'استعادة الصفحة',
  'error.empty': 'أدخل عنوانًا.',
  'error.invalid': 'هذا العنوان غير صالح أو طويل جدًا.',
  'error.protocol': 'تُدعم عناوين HTTP وHTTPS فقط؛ استخدم معاينة المستندات للملفات المحلية.',
  'error.credentials': 'لا يمكن أن يتضمن العنوان اسم مستخدم أو كلمة مرور.',
  'error.application-origin': 'لا يمكن للمتصفح المضمّن فتح تطبيق DSH نفسه.',
  'load.failed': 'تعذّر تحميل الصفحة؛ أعد التحميل أو افتحها في متصفح النظام.',
  // {code} and {description} carry the browser engine's own diagnostic verbatim.
  'load.failed.detail': 'فشل تحميل الصفحة ({code}): {description}',
  'address.unknown': 'انتقلت الصفحة؛ لا يستطيع هذا العرض قراءة عنوانها الجديد.',
} satisfies Record<SidebarBrowserKey, string>
