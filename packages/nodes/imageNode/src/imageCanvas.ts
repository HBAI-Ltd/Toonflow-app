import type { MediaToolContext } from "@toonflow/node-shared/mediaTools";
import { createMediaPreview } from "@toonflow/node-shared/mediaPreview";

export function fallbackImageFormat(path: string, mimeType?: string) {
  const type = mimeType?.split(";")[0]?.trim().match(/^image\/(avif|heic|heif)(?:-sequence)?$/i)?.[1];
  return (type ?? path.match(/\.(avif|heic|heif)$/i)?.[1])?.toUpperCase();
}

async function decodeImage(context: MediaToolContext, path: string, data: ArrayBuffer) {
  const image = new Blob([data]);
  try { return await createImageBitmap(image); }
  catch {
    context.signal.throwIfAborted();
    const format = fallbackImageFormat(path, path === context.source.url ? context.source.mimeType : undefined);
    if (!format) throw new Error("当前浏览器无法解码这张图片");
    const url = URL.createObjectURL(image);
    try {
      // 宿主的兼容预览使用本机 FFmpeg 导出原尺寸首帧 PNG，并在成功、失败或取消后清理临时目录。
      const frame = await createMediaPreview(url, "image", context.signal);
      context.signal.throwIfAborted();
      return await createImageBitmap(frame);
    } catch (cause) {
      context.signal.throwIfAborted();
      throw new Error(`无法读取这张 ${format} 图片：${cause instanceof Error ? cause.message : "本机不支持此编码"}`, { cause });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function readImageBitmap(context: MediaToolContext, path: string) {
  context.signal.throwIfAborted();
  const data = await context.workspace.read(path);
  context.signal.throwIfAborted();
  // 文件选择器允许用户切换到“所有文件”，仍须识别改名或 MIME 错误的 GIF。
  const signature = String.fromCharCode(...new Uint8Array(data, 0, Math.min(6, data.byteLength)));
  if (signature === "GIF87a" || signature === "GIF89a") throw new Error("请选择静态图片，GIF 不能用于此工具");
  const bitmap = await decodeImage(context, path, data);
  try {
    context.signal.throwIfAborted();
    if (bitmap.width * bitmap.height > 48_000_000) throw new Error("单张图片不能超过 4800 万像素");
    return bitmap;
  } catch (error) {
    bitmap.close();
    throw error;
  }
}
