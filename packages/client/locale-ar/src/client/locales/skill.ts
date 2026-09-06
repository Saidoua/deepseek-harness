/** `skill` namespace: the skill row in the conversation. */
import type { SkillKey } from '@deepseek-ai/dsh-client-ui-skill/src/client/locales.ts'

export const ar = {
  'row.title': 'مهارة',
  'row.running': 'جارٍ تحميل المهارة',
  'row.failed': 'تعذّر تحميل المهارة',
  'row.stopped': 'أُوقف تحميل المهارة',
  'row.instructions': 'التعليمات',
  'row.inspect': 'فحص',
  'menu.userOnly': 'للمستخدم فقط',
} satisfies Record<SkillKey, string>
