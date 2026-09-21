import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, realpath } from "node:fs/promises";
import { dirname, join } from "node:path";
import conf from "@/utils/conf";
import { lockWorkspaceFiles, resolveWorkspacePath, writeWorkspaceFile } from "@/utils/workspace/files";

export type PersonalizationDocument = "memory" | "agents";

const documents = { memory: "memories/memory.md", agents: "AGENTS.md" };
const labels = { memory: "全局记忆", agents: "全局 AGENTS.md" };
export const maxDocumentLength = 20000;

export function isMemoryEnabled() {
  const value = conf.get("settings", {}).personalization;
  return !value || typeof value !== "object" || Array.isArray(value) || (value as Record<string, unknown>).memoryEnabled !== false;
}

function result(content: string) {
  return { content, revision: createHash("sha256").update(content).digest("hex") };
}

async function documentPath(document: PersonalizationDocument) {
  if (!Object.hasOwn(documents, document)) throw Object.assign(new Error("个性化文档类型无效"), { status: 400 });
  const directory = dirname(conf.path);
  await mkdir(directory, { recursive: true });
  const directories = [directory, ...(document === "memory" ? [join(directory, "memories")] : [])];
  for (const path of directories) {
    const info = await lstat(path).catch((err: NodeJS.ErrnoException) => { if (err.code === "ENOENT") return null; throw err; });
    if (info?.isSymbolicLink()) throw Object.assign(new Error("不能通过符号链接访问个性化文档"), { status: 403 });
    if (info && !info.isDirectory()) throw Object.assign(new Error("个性化文档所在路径不是目录"), { status: 400 });
  }
  return (await resolveWorkspacePath(await realpath(directory), documents[document], true)).path;
}

async function readContent(path: string) {
  const info = await lstat(path).catch((err: NodeJS.ErrnoException) => { if (err.code === "ENOENT") return null; throw err; });
  if (!info) return "";
  if (info.isSymbolicLink()) throw Object.assign(new Error("不能通过符号链接访问个性化文档"), { status: 403 });
  if (!info.isFile()) throw Object.assign(new Error("个性化文档必须是普通文件"), { status: 400 });
  if (info.size > maxDocumentLength * 3 + 3) throw Object.assign(new Error(`个性化文档不能超过 ${maxDocumentLength} 个字符`), { status: 413 });
  const content = (await readFile(path, "utf8")).replace(/^\uFEFF/, "");
  if (content.length > maxDocumentLength) throw Object.assign(new Error(`个性化文档不能超过 ${maxDocumentLength} 个字符`), { status: 413 });
  return content;
}

function documentError(action: string, document: PersonalizationDocument, cause: unknown) {
  const err = cause as NodeJS.ErrnoException & { status?: number };
  return Object.assign(new Error(`${action}${labels[document] ?? "个性化文档"}失败：${err?.message ?? String(cause)}`, { cause }), { status: err?.status, code: err?.code });
}

export async function readDocument(document: PersonalizationDocument) {
  try {
    return result(await readContent(await documentPath(document)));
  } catch (err) { throw documentError("读取", document, err); }
}

export async function saveDocument(document: PersonalizationDocument, content: string, revision: string) {
  try {
    content = content.replace(/^\uFEFF/, "");
    if (content.length > maxDocumentLength) throw Object.assign(new Error(`个性化文档不能超过 ${maxDocumentLength} 个字符`), { status: 413 });
    const path = await documentPath(document);
    const release = lockWorkspaceFiles([path]);
    try {
      const current = result(await readContent(path));
      if (revision !== current.revision) throw Object.assign(new Error("文档已被其他操作更新，请重新加载后再保存，避免覆盖最新内容"), { status: 409 });
      await mkdir(dirname(path), { recursive: true });
      await writeWorkspaceFile(await documentPath(document), content);
      return result(content);
    } finally { release(); }
  } catch (err) { throw documentError("保存", document, err); }
}
