/** `workflowRun` namespace: a workflow run's members and phases. */
import type { WorkflowRunKey } from '@deepseek-ai/dsh-client-ui-workflow-run/src/client/locales.ts'

// One count-neutral wording serves both count keys; see the job namespace.
export const ar = {
  // The run's own name, passed through unchanged.
  'run.title': '{name}',
  'run.members.one': '{count} عضو',
  'run.members.other': '{count} عضو',
  'run.empty': 'لم يبدأ أي عضو',
  'phase.unassigned': 'بلا مرحلة',
  'phase.empty': 'اسم مرحلة فارغ',
  'statusCount.running': 'قيد التشغيل {count}',
  'statusCount.completed': 'مكتمل {count}',
  'statusCount.failed': 'فشل {count}',
  'statusCount.cancelled': 'ملغى {count}',
  'statusCount.interrupted': 'مقاطَع {count}',
  'member.empty': 'اسم عضو فارغ',
  'member.open': 'فتح {name}',
  'status.running': 'قيد التشغيل',
  'status.completed': 'مكتمل',
  'status.failed': 'فشل',
  'status.cancelled': 'ملغى',
  'status.interrupted': 'مقاطَع',
} satisfies Record<WorkflowRunKey, string>
