/** `deliverables` namespace: files a turn produced. */
import type { DeliverablesKey } from '@deepseek-ai/dsh-client-ui-deliverables/src/client/locales.ts'

export const ar = {
  'produced.label': 'أُنتجت',
  'produced.moreOne': '+ ملف واحد',
  'produced.more': '+ {count} ملف',
  // {name} is the produced file's own name and renders verbatim.
  'produced.open': 'فتح {name}',
  'produced.showInFolder': 'إظهار في المجلد',
} satisfies Record<DeliverablesKey, string>
