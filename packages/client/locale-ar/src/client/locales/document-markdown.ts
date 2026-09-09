/** `documentMarkdown` namespace: the Markdown document renderer and its code and footnote controls. */
import type { MarkdownPreviewKey } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/src/client/markdown/locales.ts'

/** Arabic dictionary, checked complete against the `documentMarkdown` key set. */
export const ar = {
  // Markdown is the format's own name and keeps its Latin form.
  'viewer.label': 'Markdown',
  'code.copy': 'نسخ',
  'code.copied': 'تم النسخ',
  'footnotes': 'الحواشي',
} satisfies Record<MarkdownPreviewKey, string>
