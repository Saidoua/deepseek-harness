/** `plan` namespace: the plan-mode chip. */
import type { PlanKey } from '@deepseek-ai/dsh-client-ui-plan/src/client/locales.ts'

export const ar = {
  'chip.label': 'خطة',
  'chip.on.aria': 'وضع الخطة مفعّل، اضغط لإيقافه',
  // The slash command is typed exactly as written, so it stays Latin.
  'chip.on.title': 'وضع الخطة مفعّل — انقر لإيقافه (‎/plan off‎)',
  'chip.off.aria': 'وضع الخطة متوقف، اضغط لتفعيله',
  'chip.off.title': 'وضع الخطة متوقف — انقر لتفعيله (‎/plan‎)',
  'chip.exitFailed': 'تعذّر الخروج من وضع الخطة',
} satisfies Record<PlanKey, string>
