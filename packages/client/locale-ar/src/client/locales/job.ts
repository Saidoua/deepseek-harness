/** `job` namespace: the background-job list and its durations. */
import type { JobKey } from '@deepseek-ai/dsh-client-ui-jobs/src/client/locales.ts'

// Arabic has six plural categories and the runtime interpolates a flat
// template, so the two count keys share one count-neutral wording.
/** Arabic dictionary, checked complete against the `job` key set. */
export const ar = {
  'count.live.one': '{count} مهمة خلفية قيد التشغيل',
  'count.live.other': '{count} مهمة خلفية قيد التشغيل',
  'count.idle.one': '{count} مهمة خلفية',
  'count.idle.other': '{count} مهمة خلفية',
  'list.aria': 'المهام الخلفية',
  'section.live': 'قيد التشغيل',
  'section.settledCount': 'منتهية: {count}',
  'section.clear': 'مسح',
  'row.expandAria': 'عرض المخرجات المباشرة للمهمة {label}',
  'row.collapseAria': 'إخفاء المخرجات المباشرة للمهمة {label}',
  'kill.stop': 'إيقاف المهمة {label}',
  'kill.confirm': 'انقر مجددًا للتأكيد',
  'kill.confirmAction': 'تأكيد الإيقاف',
  'kill.failed': 'فشل الإيقاف',
  'status.running': 'قيد التشغيل',
  'status.stopping': 'جارٍ الإيقاف',
  'status.completed': 'مكتملة',
  'status.killed': 'ملغاة',
  'status.failed': 'فاشلة',
  'duration.seconds': '{seconds} ث',
  'duration.minutes': '{minutes} د {seconds} ث',
  'duration.hours': '{hours} س {minutes} د',
  'duration.title.live': 'قيد التشغيل منذ {duration}',
  'duration.title.done': 'استغرقت {duration}',
  'output.gap': '… أُسقطت مخرجات سابقة …',
  // {error} carries the stream's own diagnostic and renders verbatim.
  'output.error': 'انقطع مجرى المخرجات المباشرة: {error}',
  'terminal.signal': 'إشارة {signal}',
  'terminal.exitCode': 'رمز الخروج {code}',
  'terminal.noExitCode': 'لا يوجد رمز خروج',
  'terminal.running': 'قيد التشغيل',
  'terminal.failed': 'فشل',
  'terminal.done': 'انتهى',
  'terminal.copy': 'نسخ',
  'terminal.copied': 'تم النسخ',
  'terminal.noOutput': '(لا توجد مخرجات)',
  'terminal.collapse': 'طي',
  'terminal.collapseAria': 'طي المخرجات',
  'terminal.expand': 'عرض {n} سطر إضافي',
  'terminal.expandAria': 'توسيع أسطر المخرجات المطوية الـ{n}',
} satisfies Record<JobKey, string>
