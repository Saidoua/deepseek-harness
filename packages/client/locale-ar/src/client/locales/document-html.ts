/** `documentHtml` namespace: the HTML document renderer and its status text. */
import type { HtmlPreviewKey } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/src/client/html/locales.ts'

/** Arabic dictionary, checked complete against the `documentHtml` key set. */
export const ar = {
  // HTML is the format's own name and keeps its Latin form.
  title: 'HTML',
  frame: 'معاينة مستند HTML',
  loading: 'جارٍ تحضير معاينة HTML…',
  failed: 'تعذّرت معاينة مستند HTML هذا.',
} satisfies Record<HtmlPreviewKey, string>
