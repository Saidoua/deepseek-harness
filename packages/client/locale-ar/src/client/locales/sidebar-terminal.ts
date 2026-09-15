/** `sidebarTerminal` namespace: the terminal tab in the right sidebar. */
import type * as terminalLocales from '@deepseek-ai/dsh-client-ui-sidebar-terminal/src/client/locales.ts'

/** Arabic dictionary, checked complete against the `sidebarTerminal` key set. */
export const ar = {
  recoveryFailed: 'أخفقت استعادة الطرفية: {message}',
  retryRecovery: 'إعادة محاولة استعادة الطرفية',
  shell: 'اختيار سطر الأوامر',
  shellLoading: 'جارٍ تحميل أسطر الأوامر…',
  shellEmpty: 'لا توجد أسطر أوامر متاحة',
  description: 'تشغيل الأوامر في مساحة عمل المحادثة',
  title: 'الطرفية',
  new: 'طرفية جديدة',
  loading: 'جارٍ قراءة بيئة الطرفية…',
  creating: 'جارٍ البدء…',
  connecting: 'جارٍ الاتصال…',
  disconnected: 'انقطع الاتصال.',
  reconnect: 'إعادة الاتصال',
  readonly: 'هذا العرض للقراءة فقط.',
  control: 'تولّي التحكم',
  closed: 'أُغلقت الطرفية.',
  exited: 'انتهت العملية ({code})',
  failed: 'خطأ في الطرفية: {message}',
  rename: 'اسم الطرفية',
  unavailable: 'غير متاح',
  retry: 'إعادة المحاولة',
  cleanupFailed: 'تعذّر إنهاء الطرفية «{title}»: {message}',
  missingTerminal: 'هذه الطرفية لم تعد موجودة. افتح طرفية جديدة.',
  inputFull: 'مخزن الإدخال ممتلئ. أعد الاتصال وحاول مجددًا.',
  attachmentEnded: 'انتهى اتصال الطرفية. أعد الاتصال للمتابعة.',
  invalidOutput: 'تعذّر استلام شاشة الطرفية. أعد الاتصال لاستعادتها.',
  terminalLimit: 'بُلغ الحد الأقصى للطرفيات. أغلق الطرفيات غير المستخدمة وحاول مجددًا؛ الطرفيات المنتهية تُحتسب ضمن الحد أيضًا.',
} satisfies Record<keyof typeof terminalLocales.zh, string>
