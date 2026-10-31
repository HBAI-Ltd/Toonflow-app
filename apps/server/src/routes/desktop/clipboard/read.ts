import { readFile, stat } from "@toonflow/file";
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

async function clipboardImageBase64(image: Uint8Array | null) {
  if (!image) return null;
  let bytes = Buffer.from(image);
  // Windows SDK 返回无文件头的 DIB，先补齐 BMP 文件头，再复用图片解码器转为 PNG。
  if (bytes.length >= 4 && [40, 52, 56, 108, 124].includes(bytes.readUInt32LE(0))) {
    const headerSize = bytes.readUInt32LE(0);
    if (bytes.length < headerSize) throw new Error("剪贴板图片数据不完整");
    const bitCount = bytes.readUInt16LE(14);
    if (![1, 4, 8, 16, 24, 32].includes(bitCount)) throw new Error("剪贴板图片位深不受支持");
    const compression = bytes.readUInt32LE(16);
    const colorCount = bytes.readUInt32LE(32) || (bitCount <= 8 ? 2 ** bitCount : 0);
    const maskSize = headerSize === 40 ? (compression === 3 ? 12 : compression === 6 ? 16 : 0) : 0;
    const pixelOffset = 14 + headerSize + colorCount * 4 + maskSize;
    if (pixelOffset >= bytes.length + 14) throw new Error("剪贴板图片数据不完整");
    const header = Buffer.alloc(14);
    header.write("BM");
    header.writeUInt32LE(bytes.length + 14, 2);
    header.writeUInt32LE(pixelOffset, 10);
    bytes = Buffer.concat([header, bytes]);
  }
  const png = await new Bun.Image(bytes).png().buffer();
  return png.toString("base64");
}

// ACT: 读取也使用 POST，复用 desktopRequest 的同源校验。
export default Router().post("/", validateFields({ format: z.enum(["image", "files"]).optional() }), async (req, res) => {
  const desktop = u.desktop.getDesktopRuntime(req);
  if (req.body.format === "image") {
    const image = await clipboardImageBase64(desktop.readClipboardImage());
    res.json(success({ image }));
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
      const image = await clipboardImageBase64(desktop.readClipboardImage());
      if (image) files.push({ name: "clipboard-image.png", mimeType: "image/png", data: image });
    }
    res.json(success({ files }));
    return;
  }
  res.json(success({ text: desktop.readClipboardText() ?? "" }));
});
