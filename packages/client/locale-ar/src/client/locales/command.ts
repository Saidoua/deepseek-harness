/** `command` namespace: the slash-command option palette. */
import type { CommandKey } from '@deepseek-ai/dsh-client-ui-commands/src/client/locales.ts'

export const ar = {
  'search.placeholder': 'بحث…',
  'search.aria': 'تصفية الخيارات',
  'status.loading': 'جارٍ تحميل الخيارات…',
  'status.applying': 'جارٍ التطبيق…',
  'status.empty': 'لا توجد خيارات',
  // {command} is the typed command name and stays as the user wrote it.
  'overlay.aria': 'خيارات ‎/{command}‎',
  'listbox.aria': 'نتائج ‎/{command}‎',
  'notice.attachmentsUnsupported': 'لا يقبل ‎/{command}‎ مرفقات؛ أزلها أولًا',
} satisfies Record<CommandKey, string>
