/** `approval` namespace: the panel that waits on a user decision. */
import type { ApprovalKey } from '@deepseek-ai/dsh-client-ui-approval/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `approval` key set. */
export const ar = {
  waiting: 'في انتظار الموافقة',
  'detail.aria': 'تفاصيل الموافقة',
  // {toolName} is the tool's registered id and renders verbatim.
  escalation: 'تطلب الأداة {toolName} تنفيذًا بصلاحيات مرتفعة',
  reject: 'رفض',
  allow: 'السماح',
  allowOnce: 'السماح مرة واحدة',
  allowAlways: 'السماح دائمًا',
} satisfies Record<ApprovalKey, string>
