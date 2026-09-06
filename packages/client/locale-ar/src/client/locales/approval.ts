/** `approval` namespace: the panel that waits on a user decision. */
import type { ApprovalKey } from '@deepseek-ai/dsh-client-ui-approval/src/client/locales.ts'

export const ar = {
  waiting: 'في انتظار الموافقة',
  'detail.aria': 'تفاصيل الموافقة',
  // {toolName} is the tool's registered id and renders verbatim.
  escalation: 'تطلب الأداة {toolName} تنفيذًا بصلاحيات مرتفعة',
  reject: 'رفض',
  allowOnce: 'السماح مرة واحدة',
} satisfies Record<ApprovalKey, string>
