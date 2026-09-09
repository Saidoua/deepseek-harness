/** `sidebarCodePreview` namespace: the code document renderer and its copy control. */
import type * as codeLocales from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/src/client/code/locales.ts'

/** Arabic dictionary, checked complete against the `sidebarCodePreview` key set. */
export const ar = {
  title: 'شيفرة',
  copy: 'نسخ',
  copied: 'تم النسخ',
} satisfies Record<keyof typeof codeLocales.zh, string>
