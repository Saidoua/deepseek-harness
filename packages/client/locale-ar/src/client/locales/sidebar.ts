/** `sidebar` namespace: the shell's own controls. */
import type { SidebarKey } from '@deepseek-ai/dsh-client-ui-sidebar/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `sidebar` key set. */
export const ar = {
  'session.new': 'محادثة جديدة',
  'session.new.label': 'محادثة جديدة',
  // The sidebar keeps its side in every language, so these name the panel,
  // never a direction.
  'toggle.open': 'فتح الشريط الجانبي',
  'toggle.collapse': 'طي الشريط الجانبي',
} satisfies Record<SidebarKey, string>
