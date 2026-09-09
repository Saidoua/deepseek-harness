/** `sidebarImage` namespace: the image document renderer and its status text. */
import type { ImagePreviewKey } from '@deepseek-ai/dsh-client-ui-sidebar-documentpreview/src/client/image/locales.ts'

/** Arabic dictionary, checked complete against the `sidebarImage` key set. */
export const ar = {
  title: 'صورة',
  // {name} is the image file's own name and renders verbatim.
  preview: 'معاينة الصورة: {name}',
  loading: 'جارٍ فتح الصورة…',
  failed: 'تعذّر عرض هذه الصورة.',
  unsupported: 'تتطلّب معاينة الصور محتوى الملف كاملًا.',
} satisfies Record<ImagePreviewKey, string>
