/** `settings.theme` namespace: the Appearance and font rows. */
import type { ThemeKey } from '@deepseek-ai/dsh-client-ui-theme/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `settings.theme` key set. */
export const ar = {
  'appearance.title': 'المظهر',
  'appearance.light': 'فاتح',
  'appearance.dark': 'داكن',
  'appearance.system': 'النظام',
  'fontSize.text.title': 'حجم خط النص',
  'fontSize.text.description': 'يؤثر في محتوى المحادثة فقط',
  'fontSize.text.increase': 'تكبير حجم خط النص',
  'fontSize.text.decrease': 'تصغير حجم خط النص',
  'fontSize.code.title': 'حجم خط الشيفرة',
  'fontSize.code.description': 'يُستخدم لكتل الشيفرة والشيفرة المضمنة ومخرجات الأدوات',
  'fontSize.code.increase': 'تكبير حجم خط الشيفرة',
  'fontSize.code.decrease': 'تصغير حجم خط الشيفرة',
  'fontSize.terminal.title': 'حجم خط الطرفية',
  'fontSize.terminal.description': 'يُستخدم لطرفية الشريط الجانبي',
  'fontSize.terminal.increase': 'تكبير حجم خط الطرفية',
  'fontSize.terminal.decrease': 'تصغير حجم خط الطرفية',
  'fontFamily.text.title': 'خط النص',
  'fontFamily.text.description': 'يُستخدم لواجهة المستخدم ونص المحادثة. افصل بين الخطوط بفواصل؛ اتركه فارغًا للخط الافتراضي',
  'fontFamily.code.title': 'خط الشيفرة',
  'fontFamily.code.description': 'يُستخدم لكتل الشيفرة والشيفرة المضمنة ومخرجات الأدوات. افصل بين الخطوط بفواصل؛ اتركه فارغًا للخط الافتراضي',
  'fontFamily.terminal.title': 'خط الطرفية',
  'fontFamily.terminal.description': 'يُستخدم لطرفية الشريط الجانبي. افصل بين الخطوط بفواصل؛ اتركه فارغًا للخط الافتراضي',
  'fontFamily.placeholder': 'الافتراضي',
  'fontSize.more': 'المزيد من إعدادات الخطوط',
  // A CSS unit shown beside a number; it is read as a unit, not a word.
  'fontSize.unit': 'px',
} satisfies Record<ThemeKey, string>
