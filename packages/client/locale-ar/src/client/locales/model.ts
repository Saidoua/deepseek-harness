/** `model` namespace: model and reasoning-effort selection. */
import type { ModelKey } from '@deepseek-ai/dsh-client-ui-model-selection/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `model` key set. */
export const ar = {
  'command.description': 'اختيار النموذج لهذه المحادثة',
  // {message} carries the provider's own diagnostic and renders verbatim.
  'option.loadError': 'تعذّر تحميل الفهرس: {message}',
  'option.deepseekV4Flash.description': 'سريع وفعّال واقتصادي؛ يناسب المهام المحدّدة أو الروتينية أو المتوازية.',
  'option.deepseekV4Pro.description': 'أقوى في البرمجة الوكيلة والمعرفة والاستدلال الصعب؛ يناسب المهام المعقّدة أو التي تتقدّم فيها الجودة، بتكلفة أعلى.',
  'trigger.fallback': 'اختيار نموذج',
  'trigger.loading': 'جارٍ تحميل النماذج…',
  'trigger.selectAria': 'اختيار نموذج',
  // {model} is a model id and keeps its Latin form.
  'trigger.aria': 'اختيار نموذج، الحالي {model}',
  'trigger.ariaEffort': 'اختيار نموذج، الحالي {model}، مستوى الاستدلال {effort}',
  'menu.aria': 'النموذج ومستوى الاستدلال',
  'menu.model': 'النموذج',
  'menu.effort': 'المستوى',
  'effort.providerDefault': 'الافتراضي',
  'status.loading': 'جارٍ تحديث قائمة النماذج…',
  'error.action': 'فشلت العملية على النموذج: {message}',
  'action.reload': 'إعادة التحميل',
  'warning.groupLoad': 'تعذّر تحميل {name}: {message}',
  'empty.models': 'لا تتوفر نماذج.',
  'blocked.composer': 'هذا النموذج غير متاح — اختر نموذجًا للمتابعة',
  'empty.efforts': 'لا يوفر هذا النموذج مستويات الاستدلال.',
} satisfies Record<ModelKey, string>
