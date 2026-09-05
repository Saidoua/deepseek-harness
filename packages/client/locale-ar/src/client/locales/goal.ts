/** `goal` namespace: the goal bar's phases and actions. */
import type { GoalKey } from '@deepseek-ai/dsh-client-ui-goal/src/client/locales.ts'

export const ar = {
  'phase.active': 'هدف جارٍ',
  'phase.paused': 'هدف متوقف مؤقتًا',
  'phase.blocked': 'هدف متعثّر',
  'objective.aria': 'نص الهدف',
  'commandInput.aria': 'إدخال الأمر',
  'action.save': 'حفظ الهدف',
  'action.cancel': 'إلغاء التحرير',
  'action.pause': 'إيقاف الهدف مؤقتًا',
  'action.resume': 'استئناف الهدف',
  'action.edit': 'تحرير الهدف',
  'action.clear': 'مسح الهدف',
} satisfies Record<GoalKey, string>
