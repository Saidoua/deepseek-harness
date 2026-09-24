/** `shortcuts.layout` namespace: the layout commands the shortcut reference lists. */
import type * as layoutLocales from '@deepseek-ai/dsh-client-ui-layout/src/client/shortcut-locales.ts'

// The frame does not mirror, so the left sidebar stays on the left in
// Arabic too and the label names the side the reader sees.
/** Arabic dictionary, checked complete against the `shortcuts.layout` key set. */
export const ar = {
  toggle: 'طي الشريط الجانبي الأيسر أو فتحه',
} satisfies Record<keyof typeof layoutLocales.zh, string>
