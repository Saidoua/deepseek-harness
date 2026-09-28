/** `settings.sessionLog` namespace: the Session-log upload preference in general settings. */
import type * as sessionLogLocales from '@deepseek-ai/dsh-client-ui-settings-session-log/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `settings.sessionLog` key set. */
export const ar = {
  title: 'رفع سجل المحادثة عند استخدام واجهة API الرسمية للنموذج',
  description: 'ساعد في تحسين نماذج DeepSeek ومنتجاتها.',
  saved: 'حُفظ التفضيل',
  failed: 'تعذّر حفظ التفضيل',
} satisfies Record<keyof typeof sessionLogLocales.en, string>
