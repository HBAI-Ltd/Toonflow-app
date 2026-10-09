import { readFile, stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import { t } from "@/lib/i18n";

const mediaTypes: Record<string, string> = {
  ".avif": "image/avif", ".bmp": "image/bmp", ".gif": "image/gif", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".aac": "audio/aac", ".flac": "audio/flac", ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".opus": "audio/ogg", ".wav": "audio/wav",
  ".avi": "video/x-msvideo", ".m4v": "video/mp4", ".mkv": "video/x-matroska", ".mov": "video/quicktime", ".mp4": "video/mp4", ".webm": "video/webm",
};

function clipboardPaths(text: string) {
  const paths = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    let value = line.trim().replace(/^["']|["']$/g, "");
    if (!value) continue;
    if (/^file:/i.test(value)) {
      try { value = fileURLToPath(value); }
      catch { continue; }
    }
    if (/^[a-zA-Z]:[\\/]/.test(value) || /^\\\\/.test(value) || value.startsWith("/")) paths.add(value);
  }
  return [...paths];
}

async function readClipboardFile(path: string) {
  const info = await stat(path);
  if (!info.isFile()) return;
  if (info.size > 100 * 1024 * 1024) throw new Error(t`剪贴板文件“${basename(path)}”超过 100 MB`);
  const mimeType = mediaTypes[extname(path).toLowerCase()];
  if (!mimeType) throw new Error(t`剪贴板文件“${basename(path)}”不是支持的图片、视频或音频`);
  const bytes = await readFile(path);
  return { name: basename(path), mimeType, data: bytes.toString("base64") };
}

// ACT: 读取也使用 POST，复用 desktopRequest 的同源校验。
export default Router().post("/", validateFields({ format: z.enum(["image", "files"]).optional() }), async (req, res) => {
  const desktop = u.desktop.getDesktopRuntime(req);
  if (req.body.format === "image") {
    const image = desktop.readClipboardImage();
    res.json(success({ image: image ? Buffer.from(image).toString("base64") : null }));
    return;
  }
  if (req.body.format === "files") {
    const paths = clipboardPaths(desktop.readClipboardText() ?? "");
    const files = [];
    for (const path of paths) {
      const file = await readClipboardFile(path);
      if (file) files.push(file);
    }
    if (!files.length) {
      const image = desktop.readClipboardImage();
      if (image) files.push({ name: "clipboard-image.png", mimeType: "image/png", data: Buffer.from(image).toString("base64") });
    }
    res.json(success({ files }));
    return;
  }
  res.json(success({ text: desktop.readClipboardText() ?? "" }));
});
