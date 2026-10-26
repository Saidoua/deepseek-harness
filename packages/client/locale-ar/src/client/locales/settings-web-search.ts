/** `settings.webSearch` namespace: the web-search settings page. */
import type { WebSearchSettingsLocaleKey } from '@deepseek-ai/dsh-client-ui-settings-web-search/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `settings.webSearch` key set. */
export const ar = {
  title: 'البحث في الويب',
  description: 'اضبط مزوّد بحث DeepSeek.',
  useSearchApi: 'استخدام Web Search API الجديدة',
  useSearchApiHint: 'معطّلة افتراضيًا: يجري البحث عبر DeepSeek Messages. للاطلاع على ميزات Web Search API الجديدة وأسعارها، انظر ',
  searchGuide: 'دليل البحث والجلب',
  searchGuideUrl: 'https://api-docs.deepseek.com/guides/search',
  apiKey: 'مفتاح الواجهة البرمجية',
  apiKeyHint: 'يُخزَّن خارج ملف الإعدادات. اتركه فارغًا للإبقاء على المفتاح الحالي.',
  apiKeySet: 'يوجد مفتاح مُعدّ.',
  apiKeyUnset: 'لا يوجد مفتاح؛ البحث غير متاح حتى تضبط واحدًا.',
  baseUrl: 'عنوان الخدمة',
  baseUrlHint: 'اتركه فارغًا لاستخدام عنوان المزوّد الافتراضي.',
  searchApiBaseUrl: 'عنوان واجهة Search / Fetch',
  searchApiBaseUrlHint: 'ضمّن بادئة الواجهة البرمجية، مثل https://api.deepseek.com/v1/tools. يضيف المزوّد /search أو /fetch. اتركه فارغًا لاستعادة الافتراضي.',
  maxUses: 'أقصى عدد عمليات بحث لكل طلب',
  maxUsesHint: 'كم مرة يمكن للطلب الواحد أن يبحث قبل أن يجيب.',
  count: 'عدد النتائج لكل بحث',
  countHint: 'عدد النتائج المعادة لكل استعلام: عدد صحيح من 1 إلى 50، والافتراضي 10. يتحكم هذا في عدد النتائج لا في عمليات البحث. لا يحتفظ web_search بمصادر تتجاوز حد النتائج الخاص به.',
  overridden: 'مُتجاوَز',
  reset: 'استعادة الافتراضي',
  readOnly: 'يخزّن هذا النشر الإعدادات للقراءة فقط.',
  unavailable: 'هذه الإضافة غير محمّلة، لذا لا يمكن ضبطها الآن.',
  save: 'حفظ',
  saving: 'جارٍ الحفظ…',
  saveFailed: 'لم يقبل النشر هذه القيم، وتُركت لك لتصحيحها.',
  invalidNumber: 'أدخل رقمًا، أو اترك الحقل فارغًا لاستخدام الافتراضي.',
  invalidCount: 'أدخل عددًا صحيحًا من 1 إلى 50، أو اترك الحقل فارغًا لاستخدام الافتراضي.',
} satisfies Record<WebSearchSettingsLocaleKey, string>
