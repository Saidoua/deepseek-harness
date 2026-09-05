/** `settings.permission` namespace: the default permission mode row. */
import type { PermissionSettingsKey } from '@deepseek-ai/dsh-client-ui-permission-presets/src/client/locales.ts'

export const ar = {
  'title': 'الأذونات',
  'description': 'اختر وضع الأذونات الافتراضي للجلسات الجديدة',
  'loading': 'جارٍ التحميل',
  'unavailable': 'غير متاح',
  'preset.readOnly': 'قراءة فقط',
  'preset.workspaceWrite': 'الكتابة في مساحة العمل',
  'preset.fullAccess': 'وصول كامل',
  'confirm.title': 'تفعيل الوصول الكامل؟',
  'confirm.description': 'يتيح الوصول الكامل للجلسات الجديدة تقليل خطوات التأكيد وتنفيذ إجراءات أكثر مباشرة، بما فيها العمليات الحساسة وتغيير الملفات والأوامر الخارجية. لا تستخدمه إلا إذا كنت تثق بالمهام اللاحقة.',
  'confirm.acknowledge': 'أفهم المخاطر وأريد المتابعة',
  'confirm.cancel': 'إلغاء',
  'confirm.enable': 'تفعيل الوصول الكامل',
} satisfies Record<PermissionSettingsKey, string>
