import { lstat, mkdir, readdir, rm, unlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import type { AgentCard } from "@toonflow/teams-scaffold/a2a";
import conf from "@/utils/conf";
import { decodeText, skillPath } from "@/utils/plugins/install";
import { resolveWorkspacePath, writeWorkspaceFile } from "@/utils/workspace/files";
import { agentsDirectory, checkName, editablePath, maxBytes, readFiles, validateFiles, withTeamFiles } from "./files";

export { agentsDirectory, teamNamePattern } from "./files";
export { installTeam } from "./install";

export type RemoteTeam = { name: string; cardUrl: string; token?: string; enabled: boolean; card: AgentCard };
const require = createRequire(import.meta.url);

export function getRemoteTeam(name: string) {
  checkName(name);
  return conf.get("remoteConnections", {})[name];
}

async function readSnapshot(name: string) {
  const { directory, files } = await readFiles(name);
  const manifest = validateFiles(name, files);
  const readmePath = [...files.keys()].find(path => /^readme\.md$/i.test(path));
  const readme = readmePath ? decodeText(files.get(readmePath)!) : "";
  const enabled = !(await lstat(resolve(agentsDirectory, `${name}.disabled`)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  }));
  return { directory, manifest, files, readme, enabled };
}

export function readTeam(name: string) {
  return withTeamFiles(() => readSnapshot(name));
}

export async function listTeams() {
  return withTeamFiles(async () => {
    const entries = await readdir(agentsDirectory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const local = [];
    for (const entry of entries.filter(entry => entry.isDirectory() && !entry.isSymbolicLink())) {
      try {
        const { manifest, readme, enabled } = await readSnapshot(entry.name);
        const { name, displayName, description, version, author, github } = manifest;
        local.push({ name, displayName, description, version, author, github, readme, enabled, loadError: "", kind: "local" as const });
      } catch (error) {
        local.push({ name: entry.name, displayName: entry.name, description: "", version: "", author: "", github: "", readme: "", enabled: false,
          loadError: error instanceof Error ? error.message : String(error), kind: "local" as const });
      }
    }
    const remote = Object.values(conf.get("remoteConnections", {})).map(({ name, cardUrl, card, enabled }) => ({
      name, displayName: card.name, description: card.description, version: card.version, author: "", github: "", readme: "", enabled,
      loadError: "", kind: "remote" as const, cardUrl,
    }));
    return [...local, ...remote].sort((left, right) => left.name.localeCompare(right.name));
  });
}

export async function saveRemoteTeam(record: RemoteTeam) {
  checkName(record.name);
  return withTeamFiles(async () => {
    const remotes = conf.get("remoteConnections", {});
    const locals = await readdir(agentsDirectory).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    if ([...locals, ...Object.keys(remotes)].some(name => name.toLowerCase() === record.name.toLowerCase())) {
      throw Object.assign(new Error("已存在同名团队或远端连接"), { status: 409 });
    }
    conf.set("remoteConnections", { ...remotes, [record.name]: record });
  });
}

export async function setEnabled(name: string, enabled: boolean) {
  checkName(name);
  return withTeamFiles(async () => {
    const remote = getRemoteTeam(name);
    if (remote) {
      conf.set("remoteConnections", { ...conf.get("remoteConnections", {}), [name]: { ...remote, enabled } });
      return;
    }
    const { files } = await readFiles(name);
    if (enabled) validateFiles(name, files);
    const path = resolve(agentsDirectory, `${name}.disabled`);
    const marker = await lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    if (marker && !marker.isFile()) throw Object.assign(new Error("团队状态文件无效"), { status: 409 });
    if (enabled && marker) await unlink(path);
    if (!enabled && !marker) await writeFile(path, "", { flag: "wx", mode: 0o600 });
  });
}

export async function uninstall(name: string) {
  checkName(name);
  return withTeamFiles(async () => {
    const remote = getRemoteTeam(name);
    if (remote) {
      const remotes = { ...conf.get("remoteConnections", {}) };
      delete remotes[name];
      conf.set("remoteConnections", remotes);
      return;
    }
    const { directory, files } = await readFiles(name);
    for (const path of files.keys()) if (path.startsWith("tools/")) delete require.cache[resolve(directory, path)];
    // ACT: readFiles 已验证实际目录范围与全部条目，单进程锁内删除该团队目录。
    await rm(directory, { recursive: true });
    await unlink(resolve(agentsDirectory, `${name}.disabled`)).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  });
}

export async function readEditableTeam(name: string) {
  const { manifest, files, readme } = await readTeam(name);
  return { manifest, readme, files: [...files].filter(([path]) => editablePath(path)).flatMap(([path, bytes]) => {
    try { return bytes.includes(0) ? [] : [{ path, content: decodeText(bytes) }]; }
    catch { return []; }
  }).sort((left, right) => left.path === "team.json" ? -1 : right.path === "team.json" ? 1 : left.path.localeCompare(right.path)) };
}

export async function saveTeamFile(name: string, path: string, content: string) {
  path = skillPath(path);
  if (!editablePath(path)) throw Object.assign(new Error("只能编辑团队配置、成员说明、技能或知识文件"), { status: 403 });
  if (content.includes("\0")) throw Object.assign(new Error("文件内容不能包含空字符"), { status: 400 });
  if (Buffer.byteLength(content) > maxBytes) throw Object.assign(new Error("团队文件不能超过 20 MB"), { status: 413 });
  return withTeamFiles(async () => {
    const { directory, files } = await readFiles(name);
    files.set(path, Buffer.from(content));
    validateFiles(name, files);
    const { path: target } = await resolveWorkspacePath(directory, path, true);
    await mkdir(dirname(target), { recursive: true });
    await writeWorkspaceFile(target, content);
  });
}
