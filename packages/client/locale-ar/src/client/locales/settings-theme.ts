/** `settings.theme` namespace: the Appearance and font-size rows. */
import type { ThemeKey } from '@deepseek-ai/dsh-client-ui-theme/src/client/locales.ts'

export const ar = {
  'appearance.title': 'المظهر',
  'appearance.light': 'فاتح',
  'appearance.dark': 'داكن',
  'appearance.system': 'النظام',
  'fontSize.title': 'حجم الخط',
  'fontSize.description': 'يؤثر في محتوى المحادثة فقط',
  // A CSS unit shown beside a number; it is read as a unit, not a word.
  'fontSize.unit': 'px',
  'fontSize.increase': 'تكبير حجم الخط',
  'fontSize.decrease': 'تصغير حجم الخط',
} satisfies Record<ThemeKey, string>
