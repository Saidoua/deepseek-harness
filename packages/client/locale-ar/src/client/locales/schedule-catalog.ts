/** `schedule.catalog` namespace: active reminders and their cadence. */
import type { ScheduleCatalogKey } from '@deepseek-ai/dsh-client-ui-schedule/src/client/locales.ts'

// One count-neutral wording serves both count keys; see the job namespace.
export const ar = {
  'trigger.one': '{count} تذكير',
  'trigger.other': '{count} تذكير',
  'list.aria': 'التذكيرات النشطة',
  'status.scheduled': 'مجدول',
  'status.overdue': 'متأخر',
  'frequency.once': 'مرة واحدة',
  'frequency.every': 'كل {value} {unit}',
  'unit.day.one': 'يوم',
  'unit.day.other': 'يوم',
  'unit.hour.one': 'ساعة',
  'unit.hour.other': 'ساعة',
  'unit.minute.one': 'دقيقة',
  'unit.minute.other': 'دقيقة',
  'unit.second.one': 'ثانية',
  'unit.second.other': 'ثانية',
  'relative.now': 'حان موعده الآن',
  'relative.future': 'بعد {value} {unit}',
  'relative.overdue': 'متأخر {value} {unit}',
} satisfies Record<ScheduleCatalogKey, string>
