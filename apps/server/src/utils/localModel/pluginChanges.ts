import { dirname, join } from "node:path";
import { lstat, mkdir, readFile, writeAtomic } from "@toonflow/file";
import { localModelDefinitionSchema, localModelDefinitionsSchema, localModelId, localModelKeySchema, localModelOwnerSchema, type LocalModelDefinition, type LocalModelOwner } from "@toonflow/plugin-server/localModels";
import { z } from "zod";
import conf from "@/utils/conf";
import { getPluginModelOwner } from "@/utils/localModel/pluginCatalog";
import { notifyModelChange } from "@/utils/localModel/events";

const directory = join(dirname(conf.path), "model");
const registryPath = join(directory, "pluginModels.json");
const registryByteLimit = 16 * 1024 * 1024;
const changesSchema = z.array(z.strictObject({
  owner: localModelOwnerSchema,
  revision: z.string().regex(/^[0-9a-f]{64}$/),
  models: localModelDefinitionsSchema,
  removed: z.array(localModelKeySchema).max(128),
}));
type Changes = z.infer<typeof changesSchema>;
let writeQueue = Promise.resolve();

async function checkDirectory() {
  const info = await lstat(directory).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
  if (info && !info.isDirectory()) throw Object.assign(new Error("本地模型目录无效"), { status: 403 });
}

export async function readPluginModelChanges(): Promise<Changes> {
  await checkDirectory();
  const file = await lstat(registryPath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
  if (!file) return [];
  if (!file.isFile() || file.size > registryByteLimit) throw new Error("本地模型登记文件无效");
  return changesSchema.parse(JSON.parse(await readFile(registryPath, "utf8")));
}

export function applyPluginModelChanges(owner: LocalModelOwner, revision: string, declared: LocalModelDefinition[], changes: Changes) {
  const entry = changes.find(change => change.owner.kind === owner.kind && change.owner.name === owner.name && change.revision === revision);
  if (!entry) return declared;
  const models = new Map(declared.map(model => [model.id, model]));
  for (const id of entry.removed) models.delete(id);
  for (const model of entry.models) models.set(model.id, model);
  return [...models.values()];
}

export function mutatePluginModel(owner: LocalModelOwner, action: "register" | "update" | "remove", input: LocalModelDefinition | string, expectedRevision?: string): Promise<void> {
  const result = writeQueue.then(async () => {
    const { revision, declared } = await getPluginModelOwner(localModelOwnerSchema.parse(owner));
    if (expectedRevision !== undefined && revision !== expectedRevision) throw Object.assign(new Error("插件已更新，请重新加载插件"), { status: 409 });
    const model = action === "remove" ? undefined : localModelDefinitionSchema.parse(input);
    const id = model?.id ?? localModelKeySchema.parse(input);
    const changes = await readPluginModelChanges();
    const current = applyPluginModelChanges(owner, revision, declared, changes).find(item => item.id === id);
    if (action === "register" && current && JSON.stringify(current) !== JSON.stringify(model)) {
      throw Object.assign(new Error("插件已登记同名模型，请使用更新操作"), { status: 409 });
    }
    if (action === "update" && !current) throw Object.assign(new Error("插件尚未登记此模型"), { status: 404 });
    if (JSON.stringify(current) === JSON.stringify(model)) return;
    const others = changes.filter(entry => entry.owner.kind !== owner.kind || entry.owner.name !== owner.name);
    const previous = changes.find(entry => entry.owner.kind === owner.kind && entry.owner.name === owner.name && entry.revision === revision);
    const models = (previous?.models ?? []).filter(item => item.id !== id);
    const removed = (previous?.removed ?? []).filter(item => item !== id);
    const original = declared.find(item => item.id === id);
    if (model && JSON.stringify(model) !== JSON.stringify(original)) models.push(model);
    if (!model && original) removed.push(id);
    if (models.length || removed.length) others.push({ owner, revision, models, removed });
    localModelDefinitionsSchema.parse(applyPluginModelChanges(owner, revision, declared, others));
    const content = JSON.stringify(others);
    if (Buffer.byteLength(content) > registryByteLimit) throw Object.assign(new Error("本地模型登记数量超过限制"), { status: 413 });
    await mkdir(directory, { recursive: true });
    await checkDirectory();
    await writeAtomic(registryPath, content, { mode: 0o600 });
    notifyModelChange(localModelId(owner, id));
  });
  writeQueue = result.then(() => {}, () => {});
  return result;
}
