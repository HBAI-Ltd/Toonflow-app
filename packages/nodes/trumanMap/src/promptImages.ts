import { t } from "@toonflow/i18n/vue";

export const imageTypes: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

export function validatePromptImages(files: File[], existingSizes: number[]): void {
  if (existingSizes.length + files.length > 4) throw new Error(t`每轮最多添加 4 张图片，请移除部分图片后重试。`);
  let totalBytes = existingSizes.reduce((total, size) => total + size, 0);
  for (const file of files) {
    if (!Object.values(imageTypes).includes(file.type)) throw new Error(t`请选择 PNG、JPEG、WebP 或 GIF 图片。`);
    if (!file.size || file.size > 10 * 1024 * 1024) throw new Error(t`图片“${file.name}”为空或超过 10 MB，请换一张图片。`);
    totalBytes += file.size;
  }
  if (totalBytes > 20 * 1024 * 1024) throw new Error(t`本轮图片总计不能超过 20 MB，请减少图片或缩小文件后重试。`);
}
