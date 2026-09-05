/** `question` namespace: the question card and plan review. */
import type { QuestionKey } from '@deepseek-ai/dsh-client-ui-user-questions/src/client/locales.ts'

export const ar = {
  'error.incomplete': 'يرجى إكمال هذا السؤال أولًا.',
  'error.unanswered': 'يرجى اختيار خيار أو كتابة إجابة خاصة.',
  'nav.prev': 'السؤال السابق',
  'nav.next': 'السؤال التالي',
  'nav.minimize': 'طي بطاقة السؤال',
  'nav.maximize': 'توسيع بطاقة السؤال',
  'nav.cancel': 'تجاهل كل الأسئلة',
  'option.recommended': 'موصى به',
  'custom.placeholder': 'اكتب إجابتك',
  'action.skip': 'تخطي هذا السؤال',
  'action.next': 'التالي',
  'plan.header': 'مراجعة الخطة',
  'plan.approve': 'اعتماد',
  'plan.decline': 'رفض',
  'plan.discuss': 'مناقشتها',
} satisfies Record<QuestionKey, string>
