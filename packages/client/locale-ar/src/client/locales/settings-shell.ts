/** `settings.shell` namespace: the shell settings page. */
import type { ShellSettingsLocaleKey } from '@deepseek-ai/dsh-client-ui-settings-shell/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `settings.shell` key set. */
export const ar = {
  title: 'سطر الأوامر',
  description: 'يحدّ المدة التي يعمل فيها كل أمر وحجم ما يُخرجه.',
  timeoutMs: 'مهلة الأمر (م.ث)',
  timeoutMsHint: 'المدة المسموح بها لأمر واحد قبل إنهائه.',
  maxOutputBytes: 'حد الإخراج لكل مجرى (بايت)',
  maxOutputBytesHint: 'ما يتجاوز الحد يُحفظ في ملف مؤقت بدلًا من أن يضيع.',
  overridden: 'مُتجاوَز',
  reset: 'استعادة الافتراضي',
  readOnly: 'يخزّن هذا النشر الإعدادات للقراءة فقط.',
  unavailable: 'هذه الإضافة غير محمّلة، لذا لا يمكن ضبطها الآن.',
  save: 'حفظ',
  saving: 'جارٍ الحفظ…',
  saveFailed: 'لم يقبل النشر هذه القيم، وتُركت لك لتصحيحها.',
  invalidNumber: 'أدخل رقمًا، أو اترك الحقل فارغًا لاستخدام الافتراضي.',
} satisfies Record<ShellSettingsLocaleKey, string>
