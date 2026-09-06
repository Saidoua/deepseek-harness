/** `settings.agentPreset` namespace: the agent-preset section and its dialogs. */
import type { AgentPresetSettingsKey } from '@deepseek-ai/dsh-client-ui-agent-preset/src/client/locales.ts'

export const ar = {
  error: 'تعذّر تحميل إعدادات الوكيل المسبقة.',
  userTrust: 'مخصص',
  seatHint: 'الإعداد المسبق للوكيل في المحادثة التي توشك على بدئها',
  headerHint: 'الإعداد المسبق للوكيل الذي تعمل به هذه المحادثة، وقد ثُبّت عند بدئها',
  nav: 'الإعدادات المسبقة للوكيل',
  sectionIntro:
    'الإعداد المسبق هو تركيبة الإضافات التي يعمل بها وكيل المحادثة — أدواته ومطالبته وقدراته. '
    + 'انسخ إعدادًا قائمًا واجعله لك، أو دع الوكيل يصوغ لك واحدًا في وضع المُنشئ.',
  builtIn: 'مدمج',
  setDefault: 'تعيين كافتراضي',
  view: 'عرض',
  // The mode names are the product's own labels for shipped presets.
  presetStandardName: 'الوضع القياسي',
  presetStandardDescription:
    'وكيل برمجة كامل مع تحرير الملفات وسطر الأوامر والبحث في الملفات والويب والمهارات والتخطيط والأهداف والوكلاء الفرعيين وسير العمل.',
  presetPtcName: 'وضع PTC',
  presetPtcDescription:
    'وكيل برمجة كامل بلا أداة سير العمل؛ تُعرض الأدوات الأخرى عبر حزمة تطوير وضع PTC ليجمع النموذج عمليات متعددة الخطوات في برنامج TypeScript واحد.',
  presetMinimalName: 'الوضع الأدنى',
  presetMinimalDescription:
    'وكيل برمجة بأداتين: سطر أوامر bash دائم وأداة str_replace_editor.',
  presetCordisName: 'وضع المُنشئ',
  presetCordisDescription:
    'مُعدّ لإنشاء إعدادات وكيل مخصصة، بكل قدرات الوضع القياسي إضافة إلى فحص وقت التشغيل وتجارب الإضافات وإرشاد تأليف الإعدادات.',
  duplicate: 'نسخ',
  duplicateUnavailable: 'لا يملك هذا النشر مجلد إعدادات مسبقة قابلًا للكتابة',
  delete: 'حذف',
  presetId: 'المعرّف',
  // A directory name the user types; the placeholder shows its exact form.
  presetIdPlaceholder: 'my-agent',
  displayName: 'الاسم',
  displayNamePlaceholder: 'يظهر في القائمة؛ الافتراضي هو المعرّف',
  inUse: 'قيد الاستخدام',
  builtInGroup: 'مدمج',
  customGroup: 'مخصص',
  noDescription: 'لا يوجد وصف.',
  brokenBadge: 'تعذّر التحميل',
  brokenNoCopy: 'لا يمكن نسخ إعداد مسبق تعذّر تحميله',
  switchRefused: 'تعذّر التبديل إلى {name}: {reason}',
  copyOf: 'منسوخ من',
  // The composition file's exact name on disk.
  composition: 'التركيبة (agent.cordis.yml)',
  cancel: 'إلغاء',
  close: 'إغلاق',
  retry: 'إعادة المحاولة',
  copyTitle: 'نسخ الإعداد المسبق',
  copyIntro:
    'يُنسخ الإعداد المسبق بأكمله على هذا الجهاز. يصبح المعرّف اسم مجلده ولا يمكن '
    + 'تغييره لاحقًا؛ أما بقية التفاصيل فتُحرَّر في ملفات الإعداد نفسه.',
  create: 'إنشاء',
  creating: 'جارٍ الإنشاء…',
  creatorDraft: 'صُغ إعدادًا مخصصًا بوضع المُنشئ',
  openLocation: 'فتح المجلد',
  showLocation: 'إظهار الموقع',
  revealedPathLabel: 'ملفات الإعداد المسبق:',
  idRequired: 'أعطِ الإعداد المسبق معرّفًا.',
  idInvalid: 'استخدم حروفًا لاتينية صغيرة وأرقامًا وشرطات، على أن يبدأ بحرف أو رقم.',
  idTaken: 'يوجد إعداد مسبق بهذا المعرّف بالفعل.',
  deleteTitle: 'حذف هذا الإعداد المسبق؟',
  deleteDescription:
    'يُحذف مجلد الإعداد المسبق. تستمر المحادثات العاملة به، ولا تستطيع المحادثات الجديدة اختياره.',
  deleteConfirm: 'حذف',
  deleting: 'جارٍ الحذف…',
} satisfies Record<AgentPresetSettingsKey, string>
