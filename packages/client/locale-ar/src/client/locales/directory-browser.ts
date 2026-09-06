/**
 * `directory-browser` namespace: the workspace directory dialog.
 *
 * The owning package declares its dictionaries inline rather than exporting a
 * key union, so this dictionary is typed as a plain record. A key that package
 * adds later falls back to English until it is added here; the other
 * namespaces catch that at compile time instead.
 */
export const ar: Record<string, string> = {
  'browser.title': 'اختيار مجلد مساحة العمل',
  'browser.home': 'المجلد الرئيسي',
  'browser.newFolder': 'مجلد جديد',
  'browser.folderName': 'اسم المجلد',
  // {name} is the containing folder's own name.
  'browser.createIn': 'مجلد جديد في «{name}»',
  'browser.untitledFolder': 'مجلد بلا عنوان',
  'browser.create': 'إنشاء',
  'browser.cancel': 'إلغاء',
  'browser.open': 'فتح',
  'browser.editPath': 'تحرير المسار',
  'browser.loading': 'جارٍ التحميل…',
  'browser.truncated': 'عدد المجلدات كبير؛ يُعرض أولها فقط.',
  'browser.showHidden': 'إظهار الملفات المخفية',
}
