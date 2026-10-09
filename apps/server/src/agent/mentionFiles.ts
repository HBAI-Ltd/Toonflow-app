import { open, opendir, readFile, stat } from "@toonflow/file";
import { basename } from "node:path";
import u from "@/utils";
import { createCanvasMention, mentionAssetType, mentionNodeOutputs, mentionRecord, queryMentionNodes,
  type MentionCanvasNode, type MentionQuery } from "./mentionSources";
import type { AgentMention } from "./runtime/types";
export { queryAssets as queryMentionAssets } from "@/utils/assets";

type StoredCanvas = { revision: string; nodes: MentionCanvasNode[]; byId: Map<string, MentionCanvasNode> };
const canvasCache = new Map<string, { revision: string; bytes: number; value: Promise<StoredCanvas> }>();

async function readMentionText(directory: string, relativePath: string) {
  const { path } = await u.workspaceFile.resolveWorkspacePath(directory, relativePath);
  const info = await stat(path);
  if (!info.isFile() || info.size > 400000) throw Object.assign(new Error("文本引用最多支持 100000 个字符，请缩小内容后重试"), { status: 400 });
  const text = await readFile(path, "utf8");
  if (text.length > 100000) throw Object.assign(new Error("文本引用最多支持 100000 个字符，请缩小内容后重试"), { status: 400 });
  return text;
}

async function readCanvas(directory: string, canvasId: string) {
  const { path } = await u.workspaceFile.resolveWorkspacePath(directory, canvasId);
  const info = await stat(path);
  if (!info.isFile() || info.size > 256 * 1024 * 1024) throw Object.assign(new Error("画布文件无效或超过 256 MB 的读取上限"), { status: 400 });
  const revision = `${info.mtimeMs}:${info.size}`;
  const cached = canvasCache.get(path);
  if (cached?.revision === revision) {
    canvasCache.delete(path);
    canvasCache.set(path, cached);
    return cached.value;
  }
  const value = (async () => {
    const canvas: unknown = JSON.parse(await readFile(path, "utf8"));
    const latest = await stat(path);
    if (latest.mtimeMs !== info.mtimeMs || latest.size !== info.size) throw Object.assign(new Error("画布正在保存，请重试"), { status: 409 });
    if (!mentionRecord(canvas) || canvas.toonflowCanvas !== true || !Array.isArray(canvas.nodes)) throw Object.assign(new Error("文件不是有效画布"), { status: 400 });
    const nodes = canvas.nodes.filter((node): node is MentionCanvasNode => mentionRecord(node) && typeof node.id === "string");
    return { revision, nodes, byId: new Map(nodes.map(node => [node.id, node])) };
  })();
  const entry = { revision, bytes: info.size, value };
  canvasCache.set(path, entry);
  // ACT: 离线画布仅在服务端解析；最多缓存两份、源文件合计 256 MB，每次查询重新核对 mtime/size。
  while (canvasCache.size > 2 || [...canvasCache.values()].reduce((total, entry) => total + entry.bytes, 0) > 256 * 1024 * 1024) {
    canvasCache.delete(canvasCache.keys().next().value!);
  }
  void value.catch(() => { if (canvasCache.get(path) === entry) canvasCache.delete(path); });
  return value;
}

export async function listMentionCanvases(directory: string, signal: AbortSignal) {
  const canvases: { id: string; name: string }[] = [];
  const folders = [""];
  for (const folder of folders) {
    signal.throwIfAborted();
    const resolved = await u.workspaceFile.resolveWorkspacePath(directory, folder);
    const entries = await opendir(resolved.path);
    for await (const entry of entries) {
      signal.throwIfAborted();
      const relativePath = folder ? `${folder}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (entry.name.toLowerCase() !== "assets") folders.push(relativePath);
        continue;
      }
      if (!entry.isFile() || !/\.json$/i.test(entry.name)) continue;
      const { path } = await u.workspaceFile.resolveWorkspacePath(directory, relativePath);
      const file = await open(path, "r");
      try {
        const header = Buffer.alloc(4096);
        const { bytesRead } = await file.read(header, 0, header.length, 0);
        if (/^\s*\{/.test(header.toString("utf8", 0, bytesRead)) && /"toonflowCanvas"\s*:\s*true\s*[,}]/.test(header.toString("utf8", 0, bytesRead))) {
          canvases.push({ id: relativePath, name: relativePath.slice(0, -5) });
        }
      } finally { await file.close(); }
    }
  }
  return canvases.sort((left, right) => left.name.localeCompare(right.name, "zh-CN", { numeric: true }));
}

export async function queryStoredMentionNodes(directory: string, canvasId: string, options: MentionQuery) {
  options.signal?.throwIfAborted();
  const canvas = await readCanvas(directory, canvasId);
  options.signal?.throwIfAborted();
  return queryMentionNodes(canvas.nodes, `${canvasId}:${canvas.revision}`, options);
}

export async function storedMentionOutput(directory: string, canvasId: string, nodeId: string, outputId?: string) {
  const canvas = await readCanvas(directory, canvasId);
  const node = canvas.byId.get(nodeId);
  if (!node) throw Object.assign(new Error("节点已删除，请重新选择"), { status: 404 });
  return outputId === undefined ? mentionNodeOutputs(node) : createCanvasMention(node, canvasId, outputId, path => readMentionText(directory, path));
}

export async function selectMentionAsset(relativePath: string): Promise<AgentMention> {
  const directory = await u.assets.getAssetsDirectory();
  const { path } = await u.workspaceFile.resolveWorkspacePath(directory, relativePath);
  const info = await stat(path);
  const type = mentionAssetType(relativePath);
  if (!info.isFile() || !info.size || info.size > 100 * 1024 * 1024) throw Object.assign(new Error("请选择非空且不超过 100 MB 的素材文件"), { status: 400 });
  const value = type.dataType === "STRING" ? await readMentionText(directory, relativePath) : { url: relativePath, mimeType: type.mimeType };
  return { id: crypto.randomUUID(), label: basename(path), source: { kind: "asset", path: relativePath }, dataType: type.dataType, value };
}
