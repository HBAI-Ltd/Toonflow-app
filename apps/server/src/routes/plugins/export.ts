import { loadSkillsFromDir } from "@earendil-works/pi-coding-agent";
import { Router } from "express";
import { zip } from "fflate";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error } from "@/lib/responseFormat";

const router = Router();
const maxBytes = 20 * 1024 * 1024;

export default router.get("/", validateFields({
  type: z.enum(["node", "tool", "skill", "agent"]),
  name: z.string().min(1).max(96).regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*$/),
}, "query"), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机导出插件", null, 403));
  const { type, name } = req.query as { type: "node" | "tool" | "skill" | "agent"; name: string };
  if (type === "agent") {
    const { files } = await u.teams.readTeam(name);
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      zip(Object.fromEntries([...files].map(([path, bytes]) => [`${name}/${path}`, bytes])), { level: 1 }, (err, data) => err ? reject(err) : resolve(data));
    });
    if (bytes.byteLength > maxBytes) return res.status(413).json(error("团队 ZIP 文件不能超过 20 MB", null, 413));
    return res.set("Cache-Control", "no-store").attachment(`${name}.agent.zip`).send(Buffer.from(bytes));
  }
  const root = await realpath(dirname(u.conf.path));
  const directory = resolve(root, `${type}s`);
  if (!(await lstat(directory)).isDirectory() || !u.workspaceFile.isWithin(root, await realpath(directory))) {
    return res.status(400).json(error("插件目录无效", null, 400));
  }
  let totalBytes = 0;
  async function readFileBytes(path: string) {
    if (!u.workspaceFile.isWithin(directory, await realpath(path))) throw Object.assign(new Error("插件资源超出目录范围"), { status: 400 });
    const file = await lstat(path);
    if (!file.isFile()) throw Object.assign(new Error("插件不能包含链接或特殊文件"), { status: 400 });
    if (totalBytes + file.size > maxBytes) throw Object.assign(new Error("插件文件总大小不能超过 20 MB"), { status: 413 });
    const bytes = await readFile(path);
    totalBytes += bytes.byteLength;
    if (totalBytes > maxBytes) throw Object.assign(new Error("插件文件总大小不能超过 20 MB"), { status: 413 });
    return bytes;
  }

  if (type !== "skill") {
    if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) return res.status(400).json(error("插件名称无效", null, 400));
    const fileName = `${name}.${type === "node" ? "umd" : "tool"}.js`;
    const bytes = await readFileBytes(join(directory, fileName));
    return res.set("Cache-Control", "no-store").attachment(fileName).send(bytes);
  }

  const skill = loadSkillsFromDir({ dir: directory, source: "user" }).skills.find(item => item.name === name);
  if (!skill) return res.status(404).json(error("技能不存在", null, 404));
  const files: Record<string, Uint8Array> = Object.create(null);
  let entries = 0;
  async function collectFiles(path: string, prefix: string) {
    const children = await readdir(path, { withFileTypes: true });
    for (const child of children) {
      if (++entries > 2000) throw Object.assign(new Error("技能最多包含 2000 个文件和目录"), { status: 413 });
      const filePath = join(path, child.name);
      const archivePath = u.pluginInstall.skillPath(`${prefix}/${child.name}`, child.isDirectory());
      if (child.isDirectory()) await collectFiles(filePath, archivePath);
      else files[archivePath] = await readFileBytes(filePath);
    }
  }

  if (basename(skill.filePath) === "SKILL.md" && dirname(skill.baseDir) === directory) {
    if (!(await lstat(skill.baseDir)).isDirectory() || !u.workspaceFile.isWithin(directory, await realpath(skill.baseDir))) {
      return res.status(400).json(error("技能目录无效", null, 400));
    }
    await collectFiles(skill.baseDir, name);
  } else {
    files[`${name}/SKILL.md`] = await readFileBytes(skill.filePath);
  }
  const bytes = await new Promise<Uint8Array>((resolve, reject) => {
    zip(files, { level: 1 }, (err, data) => err ? reject(err) : resolve(data));
  });
  if (bytes.byteLength > maxBytes) return res.status(413).json(error("技能 ZIP 文件不能超过 20 MB", null, 413));
  res.set("Cache-Control", "no-store").attachment(`${name}.zip`).send(Buffer.from(bytes));
});
