import fs from "node:fs/promises";
import fss from "fs";
import path from "node:path";
import sharp from "sharp";
import { t, getLocale } from "@/i18n";

/**
 * 图片缩放选项
 */
export interface ResizeOptions {
  /** 最大宽度（默认 256 */
  width?: number;
  /** 最大高度（默认 256 */
  height?: number;
  /** 缩放策略，默认等比缩放不超出边界 */
  fit?: keyof sharp.FitEnum;
  /** 是否禁止放大（默认 true） */
  withoutEnlargement?: boolean;
}

const defaultResizeOptions: Required<ResizeOptions> = {
  width: 256,
  height: 256,
  fit: "inside",
  withoutEnlargement: true,
};

/**
 * 将图片缩放后写入目标路径（自动创建父目录）。
 * @param srcPath 源图片绝对路径
 * @param dstPath 目标图片绝对路径
 * @param opts 缩放选项
 */
export async function resizeImage(srcPath: string, dstPath: string, opts?: ResizeOptions): Promise<void> {
  const { width, height, fit, withoutEnlargement } = { ...defaultResizeOptions, ...opts };
  await fs.mkdir(path.dirname(dstPath), { recursive: true });
  await sharp(srcPath).resize(width, height, { fit, withoutEnlargement }).toFile(dstPath);
}

/**
 * 缩略图自定义尺寸选项
 */
export type ThumbnailSize =
  | { type: "dimensions"; width: number; height: number }
  | { type: "percentage"; value: number };

/**
 * 生成缩略图。
 * - 若缩略图已存在，直接返回其路径。
 * - 若不存在，生成后返回目标路径；生成失败返回 null。
 *
 * @param originalPath 原图绝对路径
 * @param thumbnailPath 缩略图绝对路径
 * @param size 可选的自定义尺寸：固定宽高 或 百分比（默认 256x256 inside）
 * @returns 缩略图路径，失败返回 null
 */
export async function ensureThumbnail(
  originalPath: string,
  thumbnailPath: string,
  size?: ThumbnailSize,
): Promise<string | null> {
  const locale = await getLocale();
  // 小图已存在，直接返回
  if (fss.existsSync(thumbnailPath)) {
    return thumbnailPath;
  }
  // 原图不存在，无法生成
  if (!fss.existsSync(originalPath)) {
    return null;
  }
  try {
    if (size?.type === "percentage") {
      // 百分比缩放：先获取原图尺寸，再等比计算目标尺寸
      const meta = await sharp(originalPath).metadata();
      if (!meta.width || !meta.height) {
        console.warn(t("utils.image.cannotGetOriginalSize", {}, locale), originalPath);
        return null;
      }
      const pct = size.value / 100;
      const w = Math.round(meta.width * pct);
      const h = Math.round(meta.height * pct);
      await resizeImage(originalPath, thumbnailPath, { width: w, height: h });
    } else if (size?.type === "dimensions") {
      // 固定宽高：等比缩放适配到指定边界
      await resizeImage(originalPath, thumbnailPath, {
        width: size.width,
        height: size.height,
      });
    } else {
      // 默认 256x256 inside
      await resizeImage(originalPath, thumbnailPath);
    }
    console.info(t("utils.image.thumbnailGenerated", { path: thumbnailPath }, locale));
    return thumbnailPath;
  } catch (e) {
    console.warn(t("utils.image.thumbnailGenerationFailed", {}, locale), e);
    return null;
  }
}
