/** `permission.access` namespace: the in-session access switch. */
import type { PermissionAccessKey } from '@deepseek-ai/dsh-client-ui-permission-presets/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `permission.access` key set. */
export const ar = {
  'preset.readOnly': 'قراءة فقط',
  'preset.workspaceWrite': 'الكتابة في مساحة العمل',
  'preset.fullAccess': 'وصول كامل',
  'confirm.title': 'تفعيل الوصول الكامل؟',
  'confirm.description': 'يقلل الوصول الكامل خطوات التأكيد ويتيح للوكيل تنفيذ إجراءات أكثر مباشرة، بما فيها العمليات الحساسة وتغيير الملفات والأوامر الخارجية. لا تستخدمه إلا إذا كنت تثق بالمهمة الحالية.',
  'confirm.acknowledge': 'أفهم المخاطر وأريد المتابعة',
  'confirm.cancel': 'إلغاء',
  'confirm.enable': 'تفعيل الوصول الكامل',
  mode: 'وضع الوصول، الحالي: {name}',
  close: 'إغلاق',
  'auto.label': 'المراجعة التلقائية',
  'auto.badge': 'تجريبي',
  'auto.description': 'التشغيل دون وضع الحماية بعد مراجعة تجريبية بالنموذج نفسه لكل استدعاء أداة أصلية واستدعاء PTC داخلي.',
  'auto.confirm.title': 'تفعيل المراجعة التلقائية (تجريبية)؟',
  'auto.confirm.description': 'تعمل المراجعة التلقائية دون وضع الحماية. قبل كل استدعاء أداة أصلية واستدعاء PTC داخلي، يراجع النموذجُ نفسه الذي يشغّل الوكيل الحالي ما إذا كان سيسمح به. هذه الميزة تجريبية، وقد تسمح بإجراءات أو ترفضها خطأً، وتستهلك رموزًا إضافية.',
  'auto.confirm.acknowledge': 'أفهم هذه المخاطر وأريد المتابعة',
  'auto.confirm.enable': 'تفعيل المراجعة التلقائية',
} satisfies Record<PermissionAccessKey, string>
