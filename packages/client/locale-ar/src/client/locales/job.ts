/** `job` namespace: the background-job list and its durations. */
import type { JobKey } from '@deepseek-ai/dsh-client-ui-jobs/src/client/locales.ts'

// Arabic has six plural categories and the runtime interpolates a flat
// template, so the two count keys share one count-neutral wording.
export const ar = {
  'count.live.one': '{count} مهمة خلفية قيد التشغيل',
  'count.live.other': '{count} مهمة خلفية قيد التشغيل',
  'count.idle.one': '{count} مهمة خلفية',
  'count.idle.other': '{count} مهمة خلفية',
  'list.aria': 'المهام الخلفية',
  'status.running': 'قيد التشغيل',
  'status.stopping': 'جارٍ الإيقاف',
  'status.completed': 'مكتملة',
  'status.killed': 'أُلغيت',
  'status.failed': 'أخفقت',
  'duration.seconds': '{seconds} ث',
  'duration.minutes': '{minutes} د {seconds} ث',
  'duration.hours': '{hours} س {minutes} د',
  'duration.title.live': 'قيد التشغيل منذ {duration}',
  'duration.title.done': 'استغرقت {duration}',
} satisfies Record<JobKey, string>
