import type { ImageContent, TextContent } from "@earendil-works/pi-ai";
import { formatDimensionNote, resizeImage } from "@earendil-works/pi-coding-agent";
import { mkdir, readFile, realpath, stat } from "@toonflow/file";
import { createHash } from "node:crypto";
import { z } from "zod";
import { resolveWorkspacePath, writeWorkspaceFile } from "@/utils/workspace/files";

export type AgentImageReference = { id: string; path: string; sourcePath: string; mimeType: string; bytes: number; note?: string };
export type AgentImagePart = TextContent & { toonflowImage: AgentImageReference };

export function getOffloadedImageText(reference: AgentImageReference) {
  return `图片已移出本次模型上下文，附件保留在 ${reference.sourcePath}；需要查看时可用 read 重新读取。`;
}

const imagePathPattern = /^\.agent\/attachments\/([a-f0-9]{64})\.[a-z0-9][a-z0-9.+-]{0,127}$/;
const referenceSchema = z.strictObject({
  id: z.string().min(1).max(1024).regex(/^[^\x00-\x1f\x7f]+$/),
  path: z.string().regex(imagePathPattern),
  sourcePath: z.string().regex(imagePathPattern),
  mimeType: z.string().regex(/^image\/[a-z0-9][a-z0-9.+-]{0,127}$/),
  bytes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  note: z.string().max(2048).optional(),
});
const imagePartSchema = z.strictObject({
  type: z.literal("text"), text: z.string(), textSignature: z.string().optional(), toonflowImage: referenceSchema,
});
const cacheSchema = referenceSchema.omit({ id: true });

function imageHash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function imageExtension(mimeType: string) {
  return ({ "image/jpeg": "jpg", "image/svg+xml": "svg", "image/vnd.microsoft.icon": "ico", "image/x-icon": "ico" } as Record<string, string>)[mimeType] ?? mimeType.slice(6);
}

export function getAgentImageReference(part: unknown): AgentImageReference | undefined {
  const parsed = imagePartSchema.safeParse(part);
  if (!parsed.success || !parsed.data.toonflowImage.path.endsWith(`.${imageExtension(parsed.data.toonflowImage.mimeType)}`)) return;
  return parsed.data.toonflowImage;
}

async function saveImageBytes(cwd: string, bytes: Uint8Array, mimeType: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const hash = imageHash(bytes);
  const relativePath = `.agent/attachments/${hash}.${imageExtension(mimeType)}`;
  const target = await resolveWorkspacePath(cwd, relativePath, true);
  signal?.throwIfAborted();
  try { await writeWorkspaceFile(target.path, bytes, true); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const saved = await readFile((await resolveWorkspacePath(cwd, relativePath)).path, { signal });
    if (imageHash(saved) !== hash) throw new Error(`图片附件内容校验失败：${relativePath}`);
  }
  signal?.throwIfAborted();
  return relativePath;
}

export async function readAgentImage(cwd: string, reference: AgentImageReference, signal?: AbortSignal): Promise<ImageContent> {
  signal?.throwIfAborted();
  const checked = getAgentImageReference({ type: "text", text: "", toonflowImage: reference });
  if (!checked) throw new Error("图片附件引用无效");
  const target = await resolveWorkspacePath(await realpath(cwd), checked.path);
  const bytes = await readFile(target.path, { signal });
  signal?.throwIfAborted();
  if (bytes.byteLength !== checked.bytes || imageHash(bytes) !== imagePathPattern.exec(checked.path)![1]) {
    throw new Error(`图片附件内容校验失败：${checked.path}`);
  }
  return { type: "image", mimeType: checked.mimeType, data: bytes.toString("base64") };
}

export async function saveAgentImage(cwd: string, image: ImageContent, id: string, signal?: AbortSignal): Promise<AgentImagePart> {
  signal?.throwIfAborted();
  referenceSchema.shape.id.parse(id);
  const mimeType = referenceSchema.shape.mimeType.parse(image.mimeType?.toLowerCase());
  if (image.type !== "image" || typeof image.data !== "string" || !image.data || image.data.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.data)) {
    throw new Error("图片附件须为有效的 base64 内容");
  }
  const source = Buffer.from(image.data, "base64");
  if (!source.byteLength || source.toString("base64") !== image.data) throw new Error("图片附件须为有效的 base64 内容");
  cwd = await realpath(cwd);
  if (!(await stat(cwd)).isDirectory()) throw new Error("图片附件所属工作区目录无效");
  const folder = await resolveWorkspacePath(cwd, ".agent/attachments", true);
  await mkdir(folder.path, { recursive: true });
  const sourcePath = await saveImageBytes(cwd, source, mimeType, signal);
  // ACT: 参照 DeepSeek Harness 的单图 1 MiB 目标，复用 Pi 按 2048 边长缩放；编码与像素策略不完全相同。
  // 固定策略从原图生成一次，后续读取缓存或引用，不对已发送版本递减压缩。
  const cachePath = await resolveWorkspacePath(cwd, `${sourcePath}.image2048v1.json`, true);
  const saved = await readFile(cachePath.path, { encoding: "utf8", signal }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return;
    throw error;
  });
  let cached: z.infer<typeof cacheSchema>;
  if (saved !== undefined) {
    cached = cacheSchema.parse(JSON.parse(saved));
    if (cached.sourcePath !== sourcePath) throw new Error("图片附件缓存与原图不匹配");
    await readAgentImage(cwd, { id, ...cached }, signal);
  } else {
    const resized = await resizeImage(source, mimeType, { maxWidth: 2048, maxHeight: 2048, maxBytes: Math.ceil(1024 * 1024 / 3) * 4 });
    signal?.throwIfAborted();
    if (!resized) throw new Error("图片附件无法解码或生成发送版本，原图已保留但未创建图片引用");
    const bytes = Buffer.from(resized.data, "base64");
    const outputMimeType = resized.mimeType;
    const path = await saveImageBytes(cwd, bytes, outputMimeType, signal);
    const note = formatDimensionNote(resized);
    cached = { path, sourcePath, mimeType: outputMimeType, bytes: bytes.byteLength, ...(note ? { note } : {}) };
    signal?.throwIfAborted();
    await writeWorkspaceFile(cachePath.path, JSON.stringify(cached));
  }
  signal?.throwIfAborted();
  return {
    type: "text",
    text: `[图片附件已保存；需要时可 read 原图：${sourcePath}]${cached.note ? `\n${cached.note}` : ""}`,
    toonflowImage: { id, ...cached },
  };
}
