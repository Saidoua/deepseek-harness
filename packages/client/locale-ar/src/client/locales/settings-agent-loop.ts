/** `settings.agentLoop` namespace: the agent-loop settings page. */
import type { AgentLoopSettingsLocaleKey } from '@deepseek-ai/dsh-client-ui-settings-agent-loop/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `settings.agentLoop` key set. */
export const ar = {
  title: 'حلقة الوكيل',
  description: 'تحكّم في كيفية توزيع الوكيل لاستدعاءات الأدوات.',
  maxParallel: 'استدعاءات الأدوات المتوازية',
  maxParallelHint: 'الحد الأعلى للاستدعاءات الآمنة للتوازي التي تعمل معًا في الخطوة الواحدة.',
  overridden: 'مُتجاوَز',
  reset: 'استعادة الافتراضي',
  readOnly: 'يخزّن هذا النشر الإعدادات للقراءة فقط.',
  unavailable: 'هذه الإضافة غير محمّلة، لذا لا يمكن ضبطها الآن.',
  save: 'حفظ',
  saving: 'جارٍ الحفظ…',
  saveFailed: 'لم يقبل النشر هذه القيم، وتُركت لك لتصحيحها.',
  invalidNumber: 'أدخل رقمًا، أو اترك الحقل فارغًا لاستخدام الافتراضي.',
} satisfies Record<AgentLoopSettingsLocaleKey, string>
