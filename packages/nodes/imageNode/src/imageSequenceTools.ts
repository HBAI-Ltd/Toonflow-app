import { IconPhotoVideo, IconSlideshow } from "@tabler/icons-vue";
import { markMessages } from "@toonflow/i18n/vue";
import type { MediaTool, ToolField } from "@toonflow/node-shared/mediaTools";

export const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif", "image/bmp"];
export const sequenceRatio: ToolField = { key: "ratio", label: "画面比例", type: "select", value: "auto", options: [
  { label: "跟随首图", value: "auto" },
  { label: "横屏 16∶9", value: "landscape" }, { label: "方形 1∶1", value: "square" }, { label: "竖屏 9∶16", value: "portrait" },
] };

export function getSequenceFrame(ratio: string | number | undefined, width: number, height: number) {
  if (ratio === "auto") {
    const scale = Math.min(1280 / Math.max(width, height), 720 / Math.min(width, height));
    // H.264 的 4:2:0 输出要求偶数宽高。
    return { width: Math.max(2, 2 * Math.round(width * scale / 2)), height: Math.max(2, 2 * Math.round(height * scale / 2)) };
  }
  return { width: ratio === "landscape" ? 1280 : 720, height: ratio === "portrait" ? 1280 : 720 };
}
const seconds: ToolField = { key: "seconds", label: "视频时长（秒）", type: "number", value: 5, min: 1, max: 14400, step: 1 };
const videoOutput = [{ mimeType: "video/mp4" }];

export const imageSequenceTools: MediaTool[] = markMessages<MediaTool[]>([
  { id: "image-to-video", label: "单张图片转视频", actionLabel: "生成视频", icon: IconPhotoVideo, group: "图片转视频", sourceMimeTypes: imageTypes, outputs: videoOutput, fields: [sequenceRatio, seconds],
    accept: "audio/*", attachmentsRequired: false, attachmentLabel: "配音或背景音乐（可选，循环至片尾）" },
  { id: "image-slideshow", label: "多张图片转视频", actionLabel: "生成视频", icon: IconSlideshow, group: "图片转视频", sourceMimeTypes: imageTypes, outputs: videoOutput,
    fields: [sequenceRatio, { ...seconds, label: "每张图片停留（秒）", value: 3, max: 120 }],
    accept: [...imageTypes, ".heic", ".heif", ".avif"].join(","), multiple: true, attachmentLabel: "镜头顺序",
    extraInput: { accept: "audio/*", attachmentLabel: "配音或背景音乐（可选，循环至片尾）" } },
]);
