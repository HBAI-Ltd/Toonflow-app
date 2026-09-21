import { loadSkillsFromDir, parseFrontmatter } from "@earendil-works/pi-coding-agent";
import { lstat, readdir, readFile, realpath, rm } from "node:fs/promises";
import { basename, dirname, relative, resolve, sep } from "node:path";
import conf from "@/utils/conf";
import { isWithin, writeWorkspaceFile } from "@/utils/workspace/files";

export const maxBytes = 20 * 1024 * 1024;
// 记录附属文件的手动排序；不改动真实文件名，避免影响 SKILL.md 内部的相对链接。
const orderFileName = ".toonflowOrder.json";

export function directory() {
  return resolve(dirname(conf.path), "skills");
}

async function verifyRoot() {
  const root = directory();
  const rootInfo = await lstat(root);
  if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) {
    throw Object.assign(new Error("技能根目录必须是非符号链接目录"), { status: 403 });
  }
  return { root, actualRoot: await realpath(root) };
}

async function verifyChain(actualRoot: string, start: string, target: string, finalKind: "file" | "directory" = "file") {
  let path = start;
  for (const part of relative(start, target).split(sep)) {
    path = resolve(path, part);
    const info = await lstat(path).catch((err: NodeJS.ErrnoException) => {
      throw Object.assign(new Error(err.code === "ENOENT" ? "文件不存在" : "技能路径无效"), { status: err.code === "ENOENT" ? 404 : 403 });
    });
    const isFinal = path === target;
    const expectDirectory = !isFinal || finalKind === "directory";
    if (info.isSymbolicLink() || (expectDirectory ? !info.isDirectory() : !info.isFile()) || !isWithin(actualRoot, await realpath(path))) {
      throw Object.assign(new Error("技能路径不能包含符号链接、特殊文件或越界目录"), { status: 403 });
    }
    if (isFinal && finalKind === "file" && info.size > maxBytes) throw Object.assign(new Error("技能文件不能超过 20 MB"), { status: 413 });
  }
}

// ACT: 安装/导出与编辑器共用段名规则，各自保留路径规范化方式。
export function isSafeSegment(part: string) {
  return !!part && part !== "." && part !== ".."
    && !/[\\/<>:"|?*\x00-\x1f]/.test(part) && !/[. ]$/.test(part)
    && !/^(con|prn|aux|nul|conin\$|conout\$|com[1-9¹²³]|lpt[1-9¹²³])$/i.test(part.split(".")[0]!.trimEnd());
}

function validatePath(path: string) {
  const parts = path.split(/[\\/]/);
  if (!parts.length || parts.some(part => !isSafeSegment(part))) {
    throw Object.assign(new Error("文件路径无效"), { status: 400 });
  }
  return parts;
}

async function resolveSkill(name: string) {
  const { root, actualRoot } = await verifyRoot();
  const skill = loadSkillsFromDir({ dir: root, source: "user" }).skills.find(skill => skill.name === name);
  if (!skill) throw Object.assign(new Error("技能不存在"), { status: 404 });
  const mainTarget = resolve(skill.filePath);
  if (mainTarget === root || !isWithin(root, mainTarget)) throw Object.assign(new Error("技能文件超出目录范围"), { status: 403 });
  await verifyChain(actualRoot, root, mainTarget);
  const baseDir = dirname(mainTarget);
  // 仅当技能是 skills 根目录下一级的独占文件夹（安装流程始终如此创建）时，才浏览/编辑该目录内的附属文件；避免暴露根目录或其他技能。
  const isDirectorySkill = basename(mainTarget) === "SKILL.md" && dirname(baseDir) === root;
  return { root, actualRoot, mainTarget, baseDir, isDirectorySkill };
}

export async function uninstall(name: string) {
  const { mainTarget, baseDir, isDirectorySkill } = await resolveSkill(name);
  const { frontmatter } = parseFrontmatter(await readFile(mainTarget, "utf8"));
  const metadata = frontmatter.metadata && typeof frontmatter.metadata === "object" && !Array.isArray(frontmatter.metadata)
    ? frontmatter.metadata as Record<string, unknown> : {};
  if (metadata.author === "Toonflow") {
    throw Object.assign(new Error("内置技能不能卸载"), { status: 403 });
  }
  if (isDirectorySkill) {
    const entries = await readdir(baseDir, { recursive: true, withFileTypes: true });
    if (entries.some(entry => entry.name.toLowerCase() === "skill.md" && resolve(entry.parentPath, entry.name) !== mainTarget)) {
      throw Object.assign(new Error("目录中包含其他技能，不能整体卸载"), { status: 409 });
    }
  }
  // ACT: 非标准目录布局仅删除主文件，保留可能与其他技能共享的目录。
  await rm(isDirectorySkill ? baseDir : mainTarget, { recursive: isDirectorySkill });
}

export async function locate(name: string, path?: string) {
  const { actualRoot, mainTarget, baseDir, isDirectorySkill } = await resolveSkill(name);
  if (!path) return { target: mainTarget, isMain: true };
  if (!isDirectorySkill) throw Object.assign(new Error("该技能没有可编辑的附属文件"), { status: 400 });
  const parts = validatePath(path);
  if (parts.length === 1 && parts[0]!.toLowerCase() === orderFileName.toLowerCase()) {
    throw Object.assign(new Error("该文件由系统管理，不能直接编辑"), { status: 403 });
  }
  const target = resolve(baseDir, path);
  if (!isWithin(baseDir, target)) throw Object.assign(new Error("文件路径超出技能目录"), { status: 403 });
  await verifyChain(actualRoot, baseDir, target);
  return { target, isMain: target === mainTarget };
}

// 供新增文件与移动的目标路径复用：父目录须已存在，目标本身不能已存在。
export async function resolveNewFile(name: string, path: string) {
  const { actualRoot, baseDir, isDirectorySkill } = await resolveSkill(name);
  if (!isDirectorySkill) throw Object.assign(new Error("该技能没有可编辑的附属文件"), { status: 400 });
  const parts = validatePath(path);
  const leaf = parts.at(-1)!.toLowerCase();
  if (leaf === "skill.md" || leaf === orderFileName.toLowerCase()) {
    throw Object.assign(new Error("不能创建或移动为该保留文件名"), { status: 400 });
  }
  const target = resolve(baseDir, path);
  if (!isWithin(baseDir, target)) throw Object.assign(new Error("文件路径超出技能目录"), { status: 403 });
  const parent = dirname(target);
  if (parent !== baseDir) await verifyChain(actualRoot, baseDir, parent, "directory");
  const exists = await lstat(target).catch((err: NodeJS.ErrnoException) => { if (err.code === "ENOENT") return null; throw err; });
  if (exists) throw Object.assign(new Error("已存在同名文件或目录"), { status: 409 });
  return target;
}

export async function move(name: string, sourcePath: string, targetPath: string) {
  const { target: source, isMain } = await locate(name, sourcePath);
  if (isMain) throw Object.assign(new Error("不能移动主文件"), { status: 400 });
  const target = await resolveNewFile(name, targetPath);
  return { source, target };
}

async function readOrder(baseDir: string) {
  try {
    const parsed: unknown = JSON.parse(await readFile(resolve(baseDir, orderFileName), "utf8"));
    return Array.isArray(parsed) && parsed.every(item => typeof item === "string") ? parsed : [];
  } catch { return []; }
}

export async function list(name: string) {
  const { root, actualRoot, mainTarget, baseDir, isDirectorySkill } = await resolveSkill(name);
  const mainPath = relative(root, mainTarget).split(sep).join("/");
  if (!isDirectorySkill) return { mainPath, files: [mainPath] };
  const files: string[] = [];
  async function walk(dir: string, prefix: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || (!prefix && entry.name === orderFileName)) continue;
      if (files.length >= 2000) throw Object.assign(new Error("技能文件过多，无法列出"), { status: 413 });
      const entryPath = resolve(dir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (isWithin(actualRoot, await realpath(entryPath))) await walk(entryPath, relPath);
      } else if (entry.isFile() && isWithin(actualRoot, await realpath(entryPath))) {
        files.push(relPath);
      }
    }
  }
  await walk(baseDir, "");
  const known = new Set(files);
  const order = (await readOrder(baseDir)).filter(path => path !== "SKILL.md" && known.has(path));
  const ordered = new Set(order);
  const remaining = files.filter(path => path !== "SKILL.md" && !ordered.has(path)).sort((left, right) => left.localeCompare(right));
  return { mainPath: "SKILL.md", files: ["SKILL.md", ...order, ...remaining] };
}

export async function saveOrder(name: string, order: string[]) {
  const { baseDir, isDirectorySkill } = await resolveSkill(name);
  if (!isDirectorySkill) throw Object.assign(new Error("该技能没有可编辑的附属文件"), { status: 400 });
  if (new Set(order).size !== order.length) throw Object.assign(new Error("顺序列表包含重复路径"), { status: 400 });
  const { files } = await list(name);
  const known = new Set(files);
  if (order.some(path => path === "SKILL.md" || !known.has(path))) {
    throw Object.assign(new Error("顺序列表包含无效或不存在的文件"), { status: 400 });
  }
  await writeWorkspaceFile(resolve(baseDir, orderFileName), JSON.stringify(order));
}
