/** `sidebarRight` namespace: the right sidebar's shell, docking panes, and start tab. */
import type { SidebarRightKey } from '@deepseek-ai/dsh-client-ui-sidebar-right/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `sidebarRight` key set. */
export const ar = {
  'chrome.expand': 'فتح الشريط الجانبي',
  'chrome.collapse': 'إغلاق الشريط الجانبي',
  'chrome.toFullscreen': 'عرض الشريط الجانبي في ملء الشاشة',
  'chrome.exitFullscreen': 'الخروج من ملء الشاشة',
  'dock.emptyPane': 'لوحة فارغة',
  'dock.splitPane': 'تقسيم إلى اليمين',
  'dock.splitPaneDisabled': 'الحد الأقصى لوحتان',
  'dock.splitPaneNarrow': 'العرض لا يكفي للتقسيم؛ وسّع الشريط الجانبي',
  'dock.closeTab': 'إغلاق',
  'dock.addTab': 'علامة تبويب جديدة',
  'dock.dockFloat': 'الإعادة إلى الشريط الجانبي',
  'dock.closeFloat': 'إغلاق',
  'tab.guide.title': 'البداية',
  'tab.unavailable': 'لا شيء هنا يستطيع عرض هذا النوع من المحتوى بعد.',
  'guide.lead': 'يحتفظ الشريط الجانبي بما تريد إبقاءه أمام عينيك.',
  'guide.body': 'تُفتح ملفات المحادثة ومخرجاتها في هذا العمود؛ والمدخلات أدناه تفتح المزيد.',
} satisfies Record<SidebarRightKey, string>
