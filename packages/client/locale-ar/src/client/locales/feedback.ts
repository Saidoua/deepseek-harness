/** `feedback` namespace: per-message rating and its note dialog. */
import type { MessageFeedbackKey } from '@deepseek-ai/dsh-client-ui-message-feedback/src/client/locales.ts'

export const ar = {
  'action.like': 'رد جيد',
  'action.likeActive': 'إزالة التقييم',
  'action.dislike': 'رد سيئ',
  'action.dislikeActive': 'إزالة التقييم',
  'note.open': 'إضافة ملاحظة',
  'note.dialog': 'ملاحظات',
  'note.placeholder': 'ما الذي كان جيدًا، أو ما الذي أخفق؟ (اختياري)',
  'note.save': 'حفظ',
  'note.cancel': 'إلغاء',
  'note.aria': 'ملاحظة التقييم',
  'error.conflict': 'تغيّر هذا التقييم في مكان آخر؛ المعروض هو أحدث حالة',
  'error.load': 'تعذّر تحميل التقييم',
  'error.generic': 'تعذّر حفظ التقييم',
} satisfies Record<MessageFeedbackKey, string>
