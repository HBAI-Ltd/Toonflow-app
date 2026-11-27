import { createHash } from "node:crypto";
import { join } from "node:path";
import { lstat, readFile, readdir } from "@toonflow/file";
import { localModelOwnerSchema, type LocalModelDefinition, type LocalModelOwner } from "@toonflow/plugin-server/localModels";
import { extDirectory, extNameFromFile, parseExt, resolveExtPath } from "@/utils/plugins/ext";
import { nodesDirectory, parseNodeModels } from "@/utils/plugins/nodes";
import { parseTool, toolsDirectory } from "@/utils/plugins/tools";

const directories = { node: nodesDirectory, tool: toolsDirectory, ext: extDirectory };
const cache = new Map<string, { fingerprint: string; declared: LocalModelDefinition[]; revision: string }>();

function missing(error: NodeJS.ErrnoException) {
  if (error.code !== "ENOENT") throw error;
}

async function assertDirectory(directory: string) {
  const info = await lstat(directory);
  if (!info.isDirectory()) throw Object.assign(new Error("插件目录必须是普通文件夹"), { status: 403 });
}

export async function getPluginModelOwner(owner: LocalModelOwner) {
  localModelOwnerSchema.parse(owner);
  const { kind, name } = owner;
  const directory = directories[kind];
  await assertDirectory(directory);
  const disabled = await lstat(join(directory, name + ".disabled")).catch(missing);
  const removed = kind === "ext" && await lstat(join(directory, name + ".removed")).catch(missing);
  if (disabled || removed) throw Object.assign(new Error("插件未启用"), { status: 403 });
  const path = kind === "ext" ? await resolveExtPath(name) : join(directory, name + (kind === "node" ? ".umd.js" : ".tool.js"));
  const file = await lstat(path, { bigint: true });
  if (!file.isFile() || file.size > 20n * 1024n * 1024n) throw Object.assign(new Error("已安装插件文件无效"), { status: 400 });
  const fingerprint = `${file.dev}/${file.ino}/${file.size}/${file.mtimeNs}/${file.ctimeNs}`;
  const cached = cache.get(path);
  if (cached?.fingerprint === fingerprint) return { owner, revision: cached.revision, declared: cached.declared };
  const source = await readFile(path, "utf8");
  const declared = kind === "node" ? parseNodeModels(source)
    : (kind === "ext" ? parseExt(source, name) : parseTool(source, name).metadata).localModels ?? [];
  const revision = createHash("sha256").update(source).digest("hex");
  cache.set(path, { fingerprint, revision, declared });
  return { owner, revision, declared };
}

export async function listPluginModelOwners() {
  const owners: Awaited<ReturnType<typeof getPluginModelOwner>>[] = [];
  for (const kind of ["node", "tool", "ext"] as const) {
    const directory = directories[kind];
    const files = await assertDirectory(directory).then(() => readdir(directory, { withFileTypes: true })).catch(missing);
    if (!files) continue;
    const names = new Set<string>();
    for (const file of files) {
      if (!file.isFile()) continue;
      const name = kind === "ext" ? extNameFromFile(file.name)
        : file.name.match(kind === "node" ? /^([a-z][a-zA-Z0-9]{0,95})\.umd\.js$/ : /^([a-z][a-zA-Z0-9]{0,95})\.tool\.js$/)?.[1];
      if (name && name.length <= 96) names.add(name);
    }
    // ACT: 首次按文件读取，限制同时驻留的 20 MB 插件包数量。后续仅按 stat 指纹复用元数据。
    for (const name of [...names].sort()) {
      try { owners.push(await getPluginModelOwner({ kind, name })); }
      catch (error) {
        const cause = error as NodeJS.ErrnoException & { status?: number };
        if (cause.code !== "ENOENT" && cause.status !== 400 && cause.status !== 403) throw error;
      }
    }
  }
  return owners;
}
