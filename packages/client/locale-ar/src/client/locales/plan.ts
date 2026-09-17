/** `plan` namespace: the plan-mode chip. */
import type { PlanKey } from '@deepseek-ai/dsh-client-ui-plan/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `plan` key set. */
export const ar = {
  'chip.label': 'خطة',
  'chip.on.aria': 'وضع الخطة مفعّل، اضغط لإيقافه',
  // The slash command is typed exactly as written, so it stays Latin.
  'chip.on.title': 'وضع الخطة مفعّل — انقر لإيقافه (‎/plan off‎)',
  'chip.off.aria': 'وضع الخطة متوقف، اضغط لتفعيله',
  'chip.off.title': 'وضع الخطة متوقف — انقر لتفعيله (‎/plan‎)',
  'chip.exitFailed': 'تعذّر الخروج من وضع الخطة',
  'preview.title': 'الخطة',
  'preview.document': 'الخطة · Markdown',
  'preview.action': 'فتح',
  'preview.open': 'فتح الخطة في الشريط الجانبي',
  'preview.full': 'عرض الخطة كاملة',
  'preview.openNamed': 'فتح الخطة: {title}',
  'preview.loading': 'جارٍ تحميل الخطة…',
  'preview.failed': 'تعذّر تحميل الخطة',
  'preview.invalidAddress': 'عنوان الخطة غير صالح',
  'preview.historyUnavailable': 'سجل المحادثة غير متاح',
  'preview.notFound': 'لم يُعثر على هذه الخطة',
  'preview.unavailable': 'معاينة الخطة غير متاحة',
  'preview.expired': 'انتهت صلاحية معاينة الخطة المؤقتة هذه. أعد فتحها من بطاقة المراجعة المعلّقة.',
} satisfies Record<PlanKey, string>
