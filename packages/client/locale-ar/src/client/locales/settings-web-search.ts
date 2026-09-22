/** `settings.webSearch` namespace: the web-search settings page. */
import type { WebSearchSettingsLocaleKey } from '@deepseek-ai/dsh-client-ui-settings-web-search/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `settings.webSearch` key set. */
export const ar = {
  title: 'البحث في الويب',
  description: 'اضبط مزوّد بحث DeepSeek.',
  apiKey: 'مفتاح الواجهة البرمجية',
  apiKeyHint: 'يُخزَّن خارج ملف الإعدادات. اتركه فارغًا للإبقاء على المفتاح الحالي.',
  apiKeySet: 'يوجد مفتاح مُعدّ.',
  apiKeyUnset: 'لا يوجد مفتاح؛ البحث غير متاح حتى تضبط واحدًا.',
  baseUrl: 'عنوان الخدمة',
  baseUrlHint: 'اتركه فارغًا لاستخدام عنوان المزوّد الافتراضي.',
  maxUses: 'أقصى عدد عمليات بحث لكل طلب',
  maxUsesHint: 'كم مرة يمكن للطلب الواحد أن يبحث قبل أن يجيب.',
  overridden: 'مُتجاوَز',
  reset: 'استعادة الافتراضي',
  readOnly: 'يخزّن هذا النشر الإعدادات للقراءة فقط.',
  unavailable: 'هذه الإضافة غير محمّلة، لذا لا يمكن ضبطها الآن.',
  save: 'حفظ',
  saving: 'جارٍ الحفظ…',
  saveFailed: 'لم يقبل النشر هذه القيم، وتُركت لك لتصحيحها.',
  invalidNumber: 'أدخل رقمًا، أو اترك الحقل فارغًا لاستخدام الافتراضي.',
} satisfies Record<WebSearchSettingsLocaleKey, string>
