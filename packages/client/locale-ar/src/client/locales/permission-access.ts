/** `permission.access` namespace: the in-session access switch. */
import type { PermissionAccessKey } from '@deepseek-ai/dsh-client-ui-permission-presets/src/client/locales.ts'

export const ar = {
  'preset.readOnly': 'قراءة فقط',
  'preset.workspaceWrite': 'الكتابة في مساحة العمل',
  'preset.fullAccess': 'وصول كامل',
  'confirm.title': 'تفعيل الوصول الكامل؟',
  'confirm.description': 'يقلل الوصول الكامل خطوات التأكيد ويتيح للوكيل تنفيذ إجراءات أكثر مباشرة، بما فيها العمليات الحساسة وتغيير الملفات والأوامر الخارجية. لا تستخدمه إلا إذا كنت تثق بالمهمة الحالية.',
  'confirm.acknowledge': 'أفهم المخاطر وأريد المتابعة',
  'confirm.cancel': 'إلغاء',
  'confirm.enable': 'تفعيل الوصول الكامل',
} satisfies Record<PermissionAccessKey, string>
