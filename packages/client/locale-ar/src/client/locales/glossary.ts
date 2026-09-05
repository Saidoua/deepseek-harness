/**
 * Arabic renderings for the product's recurring terms. Every dictionary in
 * this package spells these the same way, because a reader who meets one
 * concept under two names cannot tell whether they are the same thing.
 *
 * The values are documentation, not lookups: dictionaries inline their text so
 * a translator reads a whole sentence in one place. Changing a term here means
 * changing it in every dictionary that uses it, which the review pass checks.
 *
 * Product nouns that name a running thing keep their Latin form where Arabic
 * technical writing already borrows it (a model id, a provider name, a tool
 * name), because translating an identifier makes it unsearchable.
 */
export const GLOSSARY = {
  session: 'جلسة',
  workspace: 'مساحة عمل',
  tool: 'أداة',
  plugin: 'إضافة',
  agent: 'وكيل',
  subagent: 'وكيل فرعي',
  model: 'نموذج',
  provider: 'مزوّد',
  approval: 'موافقة',
  permission: 'إذن',
  plan: 'خطة',
  goal: 'هدف',
  skill: 'مهارة',
  command: 'أمر',
  message: 'رسالة',
  turn: 'دور',
  step: 'خطوة',
  settings: 'الإعدادات',
  workflow: 'سير عمل',
  schedule: 'جدولة',
  reference: 'مرجع',
  attachment: 'مرفق',
  token: 'رمز',
  context: 'سياق',
  file: 'ملف',
  directory: 'مجلد',
  search: 'بحث',
  retry: 'إعادة المحاولة',
  cancel: 'إلغاء',
  close: 'إغلاق',
  copy: 'نسخ',
  expand: 'توسيع',
  collapse: 'طي',
} as const satisfies Record<string, string>
