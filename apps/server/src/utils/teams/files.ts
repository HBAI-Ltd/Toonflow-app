import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { teamLimits, teamNameSchema, teamSchema, validateTeamResources } from "@toonflow/teams-scaffold/runtime";
import conf from "@/utils/conf";
import { decodeText, skillPath } from "@/utils/plugins/install";
import { parseTool } from "@/utils/plugins/tools";
import { isWithin, lockWorkspaceFiles } from "@/utils/workspace/files";

export const agentsDirectory = resolve(dirname(conf.path), "agents");
export const maxBytes = teamLimits.maxTotalBytes;
export const installRecord = ".toonflowInstall.json";
export const teamNamePattern = /^[a-z][a-zA-Z0-9]{0,95}$/;

let pending = Promise.resolve();

export function withTeamFiles<T>(operation: () => Promise<T>): Promise<T> {
  // ACT: 团队目录最多 20 MB，短读写统一排队；规模增长时再拆分团队锁或读写锁。
  const result = pending.then(async () => {
    const release = lockWorkspaceFiles([agentsDirectory]);
    try { return await operation(); }
    finally { release(); }
  });
  pending = result.then(() => {}, () => {});
  return result;
}

export function checkName(name: string) {
  if (!teamNameSchema.safeParse(name).success) throw Object.assign(new Error("团队名称须为不超过 96 字符的小驼峰名称，且不能使用保留字"), { status: 400 });
  return name;
}

export function editablePath(path: string) {
  return path === "team.json" || /^members\/.+\.md$/i.test(path) || /^(skills|knowledge)\/.+/.test(path);
}

export function fingerprint(files: Map<string, Uint8Array>) {
  const hash = createHash("sha256");
  for (const path of [...files.keys()].sort()) hash.update(path).update("\0").update(createHash("sha256").update(files.get(path)!).digest());
  return hash.digest("hex");
}

export function validateFiles(name: string, files: Map<string, Uint8Array>) {
  const raw = files.get("team.json");
  if (!raw) throw Object.assign(new Error("团队包缺少 team.json"), { status: 400 });
  let manifest;
  try { manifest = teamSchema.parse(JSON.parse(decodeText(raw))); }
  catch (error) { throw Object.assign(new Error(`team.json 无效：${error instanceof Error ? error.message : String(error)}`), { status: 400 }); }
  if (manifest.name !== name) throw Object.assign(new Error("团队名称、目录及安装文件名必须一致"), { status: 400 });
  let total = 0;
  const names = new Map<string, string>();
  for (const [path, bytes] of files) {
    if (skillPath(path) !== path || !(editablePath(path) || /^readme\.md$/i.test(path) || /^tools\/[a-z][a-zA-Z0-9]*\.tool\.js$/.test(path))) {
      throw Object.assign(new Error(`团队包包含不支持的文件：${path}`), { status: 400 });
    }
    const parts = path.split("/");
    for (let index = 1; index <= parts.length; index++) {
      const prefix = parts.slice(0, index).join("/");
      const existing = names.get(prefix.toLowerCase());
      if (existing && existing !== prefix) throw Object.assign(new Error("团队包含大小写冲突的文件路径"), { status: 409 });
      names.set(prefix.toLowerCase(), prefix);
    }
    total += bytes.byteLength;
    if (path.startsWith("tools/")) {
      const source = decodeText(bytes);
      parseTool(source, path.slice(6, -8));
      try {
        if (!new Bun.Transpiler({ loader: "js" }).scan(source).exports.includes("default")) throw new Error("default");
      } catch { throw Object.assign(new Error(`私有工具语法无效或缺少默认导出：${path}`), { status: 400 }); }
    }
  }
  if (files.size > 2000 || total > maxBytes) throw Object.assign(new Error("团队包最多包含 2000 个文件，文件总大小不能超过 20 MB"), { status: 413 });
  try { validateTeamResources(manifest, files.keys()); }
  catch (error) { throw Object.assign(error instanceof Error ? error : new Error(String(error)), { status: 400 }); }
  for (const member of Object.values(manifest.members)) {
    decodeText(files.get(member.instructions)!);
    for (const skill of member.skills ?? []) decodeText(files.get(`skills/${skill}/SKILL.md`)!);
  }
  return manifest;
}

export async function readFiles(name: string) {
  checkName(name);
  const directory = resolve(agentsDirectory, name);
  for (const path of [agentsDirectory, directory]) {
    const info = await lstat(path);
    if (!info.isDirectory() || info.isSymbolicLink()) throw Object.assign(new Error("团队目录必须是普通目录"), { status: 403 });
  }
  const actualRoot = await realpath(agentsDirectory);
  if (!isWithin(actualRoot, await realpath(directory))) throw Object.assign(new Error("团队目录超出范围"), { status: 403 });
  const files = new Map<string, Uint8Array>();
  const names = new Set<string>();
  let total = 0;
  let entries = 0;
  async function collect(dir: string, prefix: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (!prefix && entry.name === installRecord) continue;
      const path = skillPath(prefix ? `${prefix}/${entry.name}` : entry.name);
      if (++entries > 2000) throw Object.assign(new Error("团队最多包含 2000 个文件和目录"), { status: 413 });
      if (names.has(path.toLowerCase())) throw Object.assign(new Error("团队目录包含大小写冲突的路径"), { status: 400 });
      names.add(path.toLowerCase());
      const target = resolve(dir, entry.name);
      const info = await lstat(target);
      if (info.isSymbolicLink() || !isWithin(actualRoot, await realpath(target))) throw Object.assign(new Error("团队文件不能包含链接或越界路径"), { status: 403 });
      if (info.isDirectory()) await collect(target, path);
      else {
        if (!info.isFile()) throw Object.assign(new Error("团队不能包含特殊文件"), { status: 403 });
        if (total + info.size > maxBytes) throw Object.assign(new Error("团队文件总大小不能超过 20 MB"), { status: 413 });
        const bytes = await readFile(target);
        total += bytes.byteLength;
        if (total > maxBytes) throw Object.assign(new Error("团队文件总大小不能超过 20 MB"), { status: 413 });
        files.set(path, bytes);
      }
    }
  }
  await collect(directory, "");
  return { directory: await realpath(directory), files };
}
