import { markMessages, t, translate } from "@toonflow/i18n/vue";
// ACT: 勾选式导出：右上角导出面板、外部总Agent的 editorExport 共用一套导出项；画布里按镜分行建节点，独立打开时打成一个 ZIP 下载。

/** 导出项：每镜三样（分镜图、场景四视图、白模视频），整场五样（场景微缩图、分镜脚本、预演小样、镜头表、剪辑表）。 */
export const exportItemKeys = ["overview", "frames", "views", "clips", "script", "previs", "shotList", "edl"] as const;
export type ExportItem = (typeof exportItemKeys)[number];
export type ExportPicks = Record<ExportItem, boolean>;
export const exportItemInfo: Record<ExportItem, { name: string; perShot: boolean; title: string }> = markMessages({
  frames: { name: "分镜图", perShot: true, title: "每镜一张关键帧（这台机位此刻的真实画面）；多于一镜时加一张分镜总览" },
  views: { name: "四视图", perShot: true, title: "每镜一张场景四视图：以这一镜的主体为中心，从机位一侧、右、后、左四个方向斜俯拍，拼成2×2" },
  clips: { name: "白模视频", perShot: true, title: "每镜一段白模视频，干净画面不带字幕，可直接做视频参考" },
  overview: { name: "场景微缩图", perShot: false, title: "整个场景的鸟瞰全貌，从第一镜的机位一侧斜俯拍" },
  script: { name: "分镜脚本", perShot: false, title: "逐镜景别、角度、焦段、时间、画面描述和台词" },
  previs: { name: "预演小样", perShot: false, title: "整片按成片切换，带镜号、时间码和台词字幕" },
  shotList: { name: "镜头表", perShot: false, title: "逐镜截图、景别、入画人物、台词，带机位平面图；可打印、存PDF、下CSV" },
  edl: { name: "剪辑表 EDL", perShot: false, title: "剪辑软件导入后把预演小样按镜头切开" },
});
export const defaultExportPicks: ExportPicks = { overview: true, frames: true, views: true, clips: true, script: false, previs: false, shotList: false, edl: false };

/** 画布上的导出包：左边一列整场的（微缩图、分镜总览、分镜脚本、预演小样），右边每镜一行（分镜图、四视图、白模视频）。 */
/** 导出进度：phase 是正在做的那一步（“第3/12镜 · 四视图”），done/total 是按耗时估的工作量，startedAt 用来估剩余时间。 */
export type ExportProgress = { phase: string; done: number; total: number; startedAt: number };
/** 剩余时间（做了3%以上、过了1.5秒才估，太早估不准）：“约 20 秒”“约 3 分钟”。 */
export function exportEta(progress: ExportProgress, now = performance.now()) {
  const elapsed = (now - progress.startedAt) / 1000, ratio = progress.done / Math.max(1, progress.total);
  if (ratio < 0.03 || elapsed < 1.5 || ratio >= 1) return "";
  const left = elapsed * (1 - ratio) / ratio;
  return left < 5 ? translate("马上就好") : left < 60 ? t`约 ${Math.ceil(left / 5) * 5} 秒` : t`约 ${Math.ceil(left / 60)} 分钟`;
}
export type CanvasExportBundle = {
  overview?: { file: File; label: string };
  sheet?: { file: File; label: string };
  script?: string;
  previs?: { file: File; label: string };
  shots: { frame?: { file: File; label: string }; views?: { file: File; label: string }; clip?: { file: File; label: string } }[];
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
  return table;
})();
function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (let index = 0; index < data.length; index++) c = crcTable[(c ^ data[index]!) & 255]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * 画布编码成图片（同步）：canvas.toBlob / OffscreenCanvas.convertToBlob 的编码排在浏览器空闲时段，导出时主线程一直忙、或窗口切到后台，
 * 每张都要等约1秒超时才出结果（实测）；toDataURL 当场编码，1920宽的JPEG约20毫秒。
 */
export function encodeCanvas(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.85): Blob {
  const url = canvas.toDataURL(type, quality);
  const text = atob(url.slice(url.indexOf(",") + 1));
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index++) bytes[index] = text.charCodeAt(index);
  return new Blob([bytes], { type: url.slice(5, url.indexOf(";")) || type });
}

/** 让出主线程一下：界面能刷新进度、响应停止按钮。用 MessageChannel，不像 setTimeout 在后台标签页里被节流到1秒一次。 */
export function yieldToBrowser() {
  return new Promise<void>(resolve => { const channel = new MessageChannel(); channel.port1.onmessage = () => { channel.port1.close(); resolve(); }; channel.port2.postMessage(null); });
}
/** 按时间片让出：距上次让出超过 budget 毫秒才让，逐帧调用开销很小。 */
export function createYielder(budget = 32) {
  let last = performance.now();
  return async () => { if (performance.now() - last < budget) return; await yieldToBrowser(); last = performance.now(); };
}

/** 最小的 ZIP（只存不压：图片、视频本来就压缩过）。文件名按 UTF-8 标记，Windows 资源管理器、macOS 解出来中文不乱码。每个文件之间让出主线程。 */
export async function createZip(entries: { path: string; file: Blob }[], date = new Date(), onEntry?: () => void): Promise<Blob> {
  const encoder = new TextEncoder();
  const parts: BlobPart[] = [], central: BlobPart[] = [];
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day = (Math.max(0, date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  let offset = 0, centralSize = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    const data = new Uint8Array(await entry.file.arrayBuffer());
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
    local.setUint16(10, time, true); local.setUint16(12, day, true); local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true); local.setUint32(22, data.length, true); local.setUint16(26, name.length, true);
    parts.push(local.buffer, name, data);
    const header = new DataView(new ArrayBuffer(46));
    header.setUint32(0, 0x02014b50, true); header.setUint16(4, 20, true); header.setUint16(6, 20, true); header.setUint16(8, 0x0800, true);
    header.setUint16(12, time, true); header.setUint16(14, day, true); header.setUint32(16, crc, true);
    header.setUint32(20, data.length, true); header.setUint32(24, data.length, true); header.setUint16(28, name.length, true);
    header.setUint32(42, offset, true);
    central.push(header.buffer, name);
    offset += 30 + name.length + data.length;
    centralSize += 46 + name.length;
    onEntry?.();
    await yieldToBrowser();
  }
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
}

/** 把几张同样大小的图拼成网格（四视图2×2），每格左上角压一个小标签。 */
export async function composeImageGrid(images: { blob: Blob; label: string }[], columns: number): Promise<Blob> {
  const bitmaps = await Promise.all(images.map(image => createImageBitmap(image.blob)));
  try {
    const cell = { width: bitmaps[0]!.width, height: bitmaps[0]!.height }, gap = Math.max(4, Math.round(cell.width / 160));
    const rows = Math.ceil(bitmaps.length / columns);
    const canvas = Object.assign(document.createElement("canvas"), { width: columns * cell.width + (columns - 1) * gap, height: rows * cell.height + (rows - 1) * gap });
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#111"; context.fillRect(0, 0, canvas.width, canvas.height);
    const unit = Math.min(cell.width, cell.height) / 540;
    context.font = `600 ${Math.round(22 * unit)}px system-ui, "Microsoft YaHei", sans-serif`;
    context.textBaseline = "middle";
    for (const [index, bitmap] of bitmaps.entries()) {
      const x = (index % columns) * (cell.width + gap), y = Math.floor(index / columns) * (cell.height + gap);
      context.drawImage(bitmap, x, y, cell.width, cell.height);
      const label = images[index]!.label, pad = 10 * unit, height = 34 * unit, width = context.measureText(label).width + pad * 2;
      context.fillStyle = "rgba(0,0,0,0.55)"; context.beginPath(); context.roundRect(x + 12 * unit, y + 12 * unit, width, height, height / 2); context.fill();
      context.fillStyle = "#fff"; context.fillText(label, x + 12 * unit + pad, y + 12 * unit + height / 2);
    }
    return encodeCanvas(canvas, "image/jpeg", 0.88);
  } finally { for (const bitmap of bitmaps) bitmap.close(); }
}
