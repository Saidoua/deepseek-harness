/** `sidebarRight` namespace: the right sidebar's shell, docking panes, and start tab. */
import type { SidebarRightKey } from '@deepseek-ai/dsh-client-ui-sidebar-right/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `sidebarRight` key set. */
export const ar = {
  'command.close': 'إغلاق الصفحة أو النافذة الحالية',
  'command.refresh': 'تحديث الصفحة الحالية',
  'command.noRefresh': 'لا يمكن تحديث هذه الصفحة',
  'command.toggle': 'طي الشريط الجانبي الأيمن أو فتحه',
  'command.fullscreen': 'تبديل ملء شاشة اللوحة',
  'command.noSession': 'اختر محادثة أولًا',
  'command.noFocus': 'ركّز على لوحة في الشريط الجانبي الأيمن أولًا',
  'command.stale': 'تغيّرت الصفحة؛ ركّز عليها مجددًا',
  'command.collapsed': 'افتح الشريط الجانبي الأيمن أولًا',
  'command.float': 'هذا الإجراء غير متاح في لوحة عائمة',
  'command.empty': 'افتح صفحة أولًا',
  'command.budget': 'الحد الأقصى لوحتان',
  'command.width': 'العرض لا يكفي للتقسيم، وسّع الشريط الجانبي',
  'chrome.expand': 'فتح الشريط الجانبي',
  // The layout does not mirror, so the sidebar stays on the right in Arabic
  // too; the aria labels name that side as the reader sees it.
  'chrome.expandAria': 'فتح الشريط الجانبي الأيمن',
  'chrome.collapse': 'طي الشريط الجانبي',
  'chrome.collapseAria': 'طي الشريط الجانبي الأيمن',
  'chrome.toFullscreen': 'ملء الشاشة',
  'chrome.exitFullscreen': 'الخروج من ملء الشاشة',
  'dock.emptyPane': 'لوحة فارغة',
  'dock.splitPane': 'تقسيم',
  'dock.splitPaneDisabled': 'الحد الأقصى لوحتان',
  'dock.splitPaneNarrow': 'العرض لا يكفي للتقسيم، وسّع الشريط الجانبي',
  'dock.closeTab': 'إغلاق',
  'dock.addTab': 'علامة تبويب جديدة',
  'dock.dockFloat': 'الإعادة إلى الشريط الجانبي',
  'dock.closeFloat': 'إغلاق',
  // Drop targets name a physical edge of the pane the reader is dragging over.
  'dock.drop.center': 'النقل إلى هنا',
  'dock.drop.left': 'تقسيم إلى اليسار',
  'dock.drop.right': 'تقسيم إلى اليمين',
  'dock.drop.top': 'تقسيم إلى الأعلى',
  'dock.drop.bottom': 'تقسيم إلى الأسفل',
  'tab.guide.title': 'البداية',
  'tab.unavailable': 'لا شيء هنا يستطيع عرض هذا النوع من المحتوى بعد.',
} satisfies Record<SidebarRightKey, string>
