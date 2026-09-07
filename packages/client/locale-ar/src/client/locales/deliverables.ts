/** `deliverables` namespace: files a turn produced. */
import type { DeliverablesKey } from '@deepseek-ai/dsh-client-ui-deliverables/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `deliverables` key set. */
export const ar = {
  'produced.label': 'أُنتجت',
  'produced.moreOne': '+ ملف واحد',
  'produced.more': '+ {count} ملف',
  // {name} is the produced file's own name and renders verbatim.
  'produced.open': 'فتح {name}',
} satisfies Record<DeliverablesKey, string>
