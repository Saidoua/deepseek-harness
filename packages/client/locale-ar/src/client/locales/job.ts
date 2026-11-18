/** `job` namespace: the background-job list and its durations. */
import type { JobKey } from '@deepseek-ai/dsh-client-ui-jobs/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `job` key set. */
export const ar = {
  'list.aria': 'المهام الخلفية',
  'indicator.running': 'المهام الخلفية قيد التشغيل: {count}',
  'section.settledCount': 'منتهية: {count}',
  'section.clear': 'مسح',
  // Count-neutral: the runtime interpolates a Western digit without plural
  // categories, so the more/fold keys read the same at every count.
  'live.more': 'عرض {count} مهمة إضافية قيد التشغيل',
  'live.foldName': '{label} (مهام خلفية قيد التشغيل)',
  'settled.more': 'عرض {count} مهمة إضافية منتهية',
  'settled.foldName': '{label} (مهام خلفية منتهية)',
  'fold.less': 'عرض أقل',
  'row.expandAria': 'عرض المخرجات المباشرة للمهمة {label}',
  'row.collapseAria': 'إخفاء المخرجات المباشرة للمهمة {label}',
  'kill.stop': 'إيقاف المهمة',
  'kill.stopAria': 'إيقاف المهمة {label}',
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
  'output.gap': '… أُسقطت مخرجات سابقة …',
  // {error} carries the stream's own diagnostic and renders verbatim.
  'output.error': 'انقطع مجرى المخرجات المباشرة: {error}',
  'terminal.signal': 'إشارة {signal}',
  'terminal.exitCode': 'رمز الخروج {code}',
  'terminal.noExitCode': 'لا يوجد رمز خروج',
  'terminal.running': 'قيد التشغيل',
  'terminal.failed': 'فشل',
  'terminal.done': 'انتهى',
  'terminal.commandLine': 'سطر الأمر {n}',
  'terminal.copy': 'نسخ',
  'terminal.copied': 'تم النسخ',
  'terminal.noOutput': '(لا توجد مخرجات)',
  'terminal.collapse': 'طي',
  'terminal.collapseAria': 'طي المخرجات',
  'terminal.expand': 'عرض {n} سطر إضافي',
  'terminal.expandAria': 'توسيع أسطر المخرجات المطوية الـ{n}',
} satisfies Record<JobKey, string>
