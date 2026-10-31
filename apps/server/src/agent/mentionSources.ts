import type { AgentMention } from "./runtime/types";
import { getDocumentMimeType, getTextMimeType } from "../lib/documentFormats";

export type MentionNode = { id: string; name: string; outputCount: number; hasOutput: boolean; dataType?: string; thumbnail?: { url: string; mimeType: string } };
export type MentionOutput = { id: string; name: string; dataType: string; preview: string; available: boolean; thumbnail?: { url: string; mimeType: string } };
export type MentionAsset = { path: string; name: string; type: "file" | "directory"; dataType?: string; preview?: string };
export type MentionPage<T> = { items: T[]; nextCursor?: string };
export type MentionCanvasNode = { id: string; type?: string; label?: unknown; data?: unknown };
export type MentionQuery = { query?: string; cursor?: string; limit?: number; signal?: AbortSignal };
export type MentionCanvasSource = {
  currentCanvasId(): string;
  canvases(signal?: AbortSignal): Promise<{ id: string; name: string }[]>;
  nodes(canvasId: string, options: MentionQuery): Promise<MentionPage<MentionNode>> | undefined;
  outputs(canvasId: string, nodeId: string): MentionOutput[] | undefined;
  selectCanvas(canvasId: string, nodeId: string, outputId?: string): Promise<AgentMention> | undefined;
};

export function mentionRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function nodeData(node: MentionCanvasNode) {
  return mentionRecord(node.data) ? node.data : {};
}

export function mentionNodeName(node: MentionCanvasNode) {
  const label = nodeData(node).label ?? node.label;
  return (typeof label === "string" && label.trim() ? label : node.id).slice(0, 255);
}

export function mentionOutputValue(node: MentionCanvasNode, outputId: string) {
  const data = nodeData(node);
  const outputs = mentionRecord(data.outputs) ? data.outputs : {};
  const output = outputs[outputId];
  if (mentionRecord(output)) {
    const { dataType, value } = output;
    if ((dataType === "STRING" && typeof value === "string") || (dataType === "BOOLEAN" && typeof value === "boolean")
      || (dataType === "INT" && typeof value === "number" && Number.isSafeInteger(value))
      || (dataType === "FLOAT" && typeof value === "number" && Number.isFinite(value))) {
      return { dataType, value };
    }
    if (["IMAGE", "MASK", "VIDEO", "AUDIO", "FILE"].includes(String(dataType)) && mentionRecord(value)
      && typeof value.url === "string" && value.url.trim() && typeof value.mimeType === "string") {
      return { dataType: String(dataType), value: { url: value.url, mimeType: value.mimeType } };
    }
  }
  const handles = Array.isArray(data.handles) ? data.handles : [];
  const handle = handles.find(handle => mentionRecord(handle) && handle.id === outputId && handle.type === "source");
  const isText = mentionRecord(handle) && (Array.isArray(handle.dataType) ? handle.dataType : [handle.dataType]).includes("STRING");
  if (isText || (node.type === "remote-textNode" && outputId === "text")) {
    if (typeof data.textSnapshot === "string") return { dataType: "STRING", value: data.textSnapshot };
    if (typeof data.textPath === "string" && data.textPath) return { dataType: "STRING", textPath: data.textPath };
  }
}

export function mentionNodeOutputs(node: MentionCanvasNode): MentionOutput[] {
  const data = nodeData(node);
  const handles = Array.isArray(data.handles) ? data.handles : [];
  const names = new Map<string, { name: string; dataType: string }>();
  for (const handle of handles) {
    if (!mentionRecord(handle) || handle.type !== "source" || typeof handle.id !== "string") continue;
    names.set(handle.id, { name: typeof handle.label === "string" ? handle.label.slice(0, 160) : handle.id,
      dataType: String(Array.isArray(handle.dataType) ? handle.dataType[0] : handle.dataType ?? "") });
  }
  if (mentionRecord(data.outputs)) for (const id in data.outputs) {
    if (!Object.hasOwn(data.outputs, id) || id === "toJSON" || names.has(id)) continue;
    const output = data.outputs[id];
    if (mentionRecord(output)) names.set(id, { name: id, dataType: String(output.dataType ?? "") });
  }
  if (!names.size && node.type === "remote-textNode" && (data.textPath || data.textSnapshot)) names.set("text", { name: "文本输出", dataType: "STRING" });
  return [...names].map(([id, item]) => {
    const output = mentionOutputValue(node, id);
    const available = !!output && (output.textPath !== undefined || (typeof output.value === "string" ? !!output.value.trim() : output.value !== undefined));
    const preview = output?.textPath ? "文本内容" : mentionRecord(output?.value) ? String(output.value.url).slice(-160).split(/[\\/]/).pop() ?? ""
      : output?.value === undefined ? "暂无输出" : String(output.value).slice(0, 160);
    const media = output?.value;
    const thumbnail = output && ["IMAGE", "MASK", "VIDEO"].includes(output.dataType) && mentionRecord(media)
      && typeof media.url === "string" && media.url.length <= 4096 && typeof media.mimeType === "string" && media.mimeType.length <= 128
      ? { url: media.url, mimeType: media.mimeType } : undefined;
    return { id, ...item, dataType: output?.dataType ?? item.dataType, preview, available, ...(thumbnail ? { thumbnail } : {}) };
  });
}

export async function queryMentionNodes(nodes: readonly MentionCanvasNode[], revision: string, options: MentionQuery = {}): Promise<MentionPage<MentionNode>> {
  const query = options.query?.trim().toLocaleLowerCase() ?? "";
  const limit = Math.max(1, Math.min(50, options.limit ?? 20));
  let offset = 0;
  if (options.cursor) {
    let cursor: unknown;
    try { cursor = JSON.parse(options.cursor); } catch { throw new Error("分页已失效，请重新搜索"); }
    if (!Array.isArray(cursor) || cursor[0] !== revision || cursor[1] !== query || !Number.isSafeInteger(cursor[2]) || cursor[2] < 0) throw new Error("分页已失效，请重新搜索");
    offset = cursor[2];
  }
  const items: MentionNode[] = [];
  const end = Math.min(nodes.length, offset + 2000);
  // ACT: 名称搜索每页最多扫描 2000 节点；不复制画布，不读输出正文，不为所有节点建立深响应对象。
  for (; offset < end && items.length < limit; offset++) {
    options.signal?.throwIfAborted();
    const node = nodes[offset];
    if (!node || typeof node.id !== "string") continue;
    const name = mentionNodeName(node);
    if (query && !`${node.id} ${name}`.toLocaleLowerCase().includes(query)) continue;
    const outputs = mentionNodeOutputs(node);
    const available = outputs.find(output => output.available);
    const media = outputs.find(output => output.thumbnail);
    const thumbnail = media?.thumbnail;
    items.push({ id: node.id, name, outputCount: outputs.length, hasOutput: !!available,
      dataType: (media ?? available ?? outputs[0])?.dataType, ...(thumbnail ? { thumbnail } : {}) });
  }
  return { items, ...(offset < nodes.length ? { nextCursor: JSON.stringify([revision, query, offset]) } : {}) };
}

export async function createCanvasMention(node: MentionCanvasNode, canvasId: string, outputId: string | undefined, readText: (path: string) => Promise<string>): Promise<AgentMention> {
  const canvasName = canvasId.replace(/\.json$/i, "").slice(0, 255);
  const nodeName = mentionNodeName(node);
  const source = { kind: "canvas" as const, canvasId, canvasName, nodeId: node.id, nodeName };
  const mention = { id: crypto.randomUUID(), label: nodeName, source, dataType: "NODE", value: null };
  if (outputId === undefined) return mention;
  const output = mentionNodeOutputs(node).find(output => output.id === outputId);
  const selected = mentionOutputValue(node, outputId);
  if (!output?.available || !selected) throw new Error("这个输出暂无内容，请重新选择");
  const value = selected.textPath === undefined ? selected.value : await readText(selected.textPath);
  if (typeof value === "string" && value.length > 100000) throw new Error("文本引用最多支持 100000 个字符，请缩小内容后重试");
  if (typeof value === "string" && !value.trim()) return mention;
  return { ...mention, label: `${nodeName} · ${output.name}`.slice(0, 500), source: { ...source, outputId, outputName: output.name },
    dataType: selected.dataType, value };
}

export function mentionAssetType(path: string) {
  const documentMimeType = getDocumentMimeType(path);
  if (documentMimeType) return { mimeType: documentMimeType, dataType: "FILE" };
  const textMimeType = getTextMimeType(path);
  if (textMimeType) return { mimeType: textMimeType, dataType: "STRING" };
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  const types: Record<string, string> = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", avif: "image/avif", apng: "image/apng", bmp: "image/bmp", svg: "image/svg+xml", ico: "image/x-icon",
    mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime", mkv: "video/x-matroska", avi: "video/x-msvideo", ogv: "video/ogg",
    mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", opus: "audio/ogg", flac: "audio/flac", m4a: "audio/mp4", aac: "audio/aac",
  };
  const mimeType = types[extension] ?? "application/octet-stream";
  const dataType = !types[extension] ? "FILE" : mimeType.startsWith("image/") ? "IMAGE" : mimeType.startsWith("video/") ? "VIDEO" : mimeType.startsWith("audio/") ? "AUDIO" : "STRING";
  return { mimeType, dataType };
}
