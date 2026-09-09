/** `feedback` namespace: per-message rating, the feedback dialog, and its acknowledgement. */
import type { MessageFeedbackKey } from '@deepseek-ai/dsh-client-ui-message-feedback/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `feedback` key set. */
export const ar = {
  'action.like': 'رد جيد',
  'action.likeActive': 'إزالة التقييم',
  'action.dislike': 'رد سيئ',
  'action.dislikeActive': 'إزالة التقييم',
  'dialog.title': 'إرسال ملاحظات',
  'dialog.categories': 'تصنيف الملاحظات',
  'dialog.detail': 'تفاصيل الملاحظات',
  'dialog.hint': 'أضف تفاصيل تساعدنا على تحسين التجربة؛ سيتضمّن ما ترسله سجلّ المحادثة الحالية',
  'category.task-result': 'نتيجة المهمة',
  'category.instruction-following': 'فهم التعليمات واتّباعها',
  'category.product-interaction': 'ميزات المنتج والتفاعل معه',
  'category.service-stability': 'استقرار الخدمة',
  'category.resource-cost': 'استهلاك الموارد والتكلفة',
  'category.security-privacy-permission': 'الأمان والخصوصية والأذونات',
  'category.other': 'أخرى',
  'toast.recorded': 'شكرًا على ملاحظاتك',
  'error.conflict': 'تغيّر هذا التقييم في مكان آخر؛ المعروض هو أحدث حالة',
  'error.load': 'تعذّر تحميل التقييم',
  'error.generic': 'تعذّر حفظ التقييم',
  'error.noteTooLarge': 'الوصف طويل جدًا؛ اختصره ثم أعد الإرسال',
} satisfies Record<MessageFeedbackKey, string>
