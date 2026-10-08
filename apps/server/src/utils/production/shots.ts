import { mkdir, readFile, writeAtomic } from "@toonflow/file";
import { join } from "node:path";
import { lockWorkspaceFiles, resolveWorkspacePath } from "@/utils/workspace/files";

export const shotStatuses = ["draft", "queued", "generating", "review", "approved", "needsRedo", "completed"] as const;
export type ShotStatus = typeof shotStatuses[number];
export type ProductionShot = {
  id: string;
  order: number;
  title: string;
  prompt: string;
  status: ShotStatus;
  providerId?: string;
  modelId?: string;
  mediaType?: "image" | "video" | "audio";
  taskId?: string;
  outputDirectory?: string;
  outputPath?: string;
  model?: string;
  duration?: number;
};
export type ProductionManifest = { version: 1; updatedAt: string; exportedPath?: string; shots: ProductionShot[] };

async function manifestPath(directory: string) {
  await mkdir(join(directory, ".toonflow"), { recursive: true });
  return (await resolveWorkspacePath(directory, ".toonflow/production.json", true)).path;
}

export async function readProductionManifest(directory: string): Promise<ProductionManifest> {
  const path = await manifestPath(directory);
  const content = await readFile(path, "utf8").catch((error: NodeJS.ErrnoException) => error.code === "ENOENT" ? "" : Promise.reject(error));
  if (!content) return { version: 1, updatedAt: new Date().toISOString(), shots: [] };
  const value = JSON.parse(content) as Partial<ProductionManifest>;
  if (value.version !== 1 || !Array.isArray(value.shots)) throw new Error("生产清单格式无效");
  const shots = value.shots.map(validateShot);
  return { version: 1, updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(), exportedPath: typeof value.exportedPath === "string" ? value.exportedPath : undefined, shots };
}

export async function writeProductionManifest(directory: string, manifest: ProductionManifest) {
  const path = await manifestPath(directory);
  const next = { ...manifest, updatedAt: new Date().toISOString() };
  const release = lockWorkspaceFiles([path]);
  try { await writeAtomic(path, JSON.stringify(next, null, 2)); }
  finally { release(); }
  return next;
}

export async function updateProductionManifest(directory: string, update: (manifest: ProductionManifest) => void) {
  const path = await manifestPath(directory);
  const release = lockWorkspaceFiles([path]);
  try {
    const content = await readFile(path, "utf8").catch((error: NodeJS.ErrnoException) => error.code === "ENOENT" ? "" : Promise.reject(error));
    const manifest = content ? JSON.parse(content) as Partial<ProductionManifest> : { version: 1, shots: [] } as Partial<ProductionManifest>;
    if (manifest.version !== 1 || !Array.isArray(manifest.shots)) throw new Error("生产清单格式无效");
    const current: ProductionManifest = { version: 1, updatedAt: typeof manifest.updatedAt === "string" ? manifest.updatedAt : new Date().toISOString(), exportedPath: typeof manifest.exportedPath === "string" ? manifest.exportedPath : undefined, shots: manifest.shots.map(validateShot) };
    update(current);
    const next = { ...current, updatedAt: new Date().toISOString() };
    await writeAtomic(path, JSON.stringify(next, null, 2));
    return next;
  } finally { release(); }
}

export function validateShot(value: unknown): ProductionShot {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("镜头必须是对象"), { status: 400 });
  const shot = value as Partial<ProductionShot>;
  if (typeof shot.id !== "string" || !shot.id.trim() || typeof shot.title !== "string" || typeof shot.prompt !== "string") throw Object.assign(new Error("镜头缺少 id、title 或 prompt"), { status: 400 });
  if (!Number.isInteger(shot.order) || shot.order! < 0 || !shotStatuses.includes(shot.status as ShotStatus)) throw Object.assign(new Error("镜头 order 或 status 无效"), { status: 400 });
  if (shot.outputPath !== undefined && (!shot.outputPath || shot.outputPath.startsWith("/") || shot.outputPath.split(/[\\/]/).some(part => !part || part === "." || part === ".."))) throw Object.assign(new Error("镜头输出路径必须是工作区内的相对路径"), { status: 400 });
  if (shot.duration !== undefined && (!Number.isFinite(shot.duration) || shot.duration <= 0)) throw Object.assign(new Error("镜头时长必须是正数"), { status: 400 });
  if (shot.providerId !== undefined && (typeof shot.providerId !== "string" || !/^[a-z][a-zA-Z0-9]{0,95}$/.test(shot.providerId))) throw Object.assign(new Error("镜头供应商 ID 无效"), { status: 400 });
  if (shot.modelId !== undefined && (typeof shot.modelId !== "string" || !shot.modelId.trim())) throw Object.assign(new Error("镜头模型 ID 无效"), { status: 400 });
  if (shot.outputDirectory !== undefined && (typeof shot.outputDirectory !== "string" || shot.outputDirectory.split(/[\\/]/).some(part => !part || part === "." || part === ".."))) throw Object.assign(new Error("镜头输出目录无效"), { status: 400 });
  return {
    id: shot.id, order: shot.order!, title: shot.title, prompt: shot.prompt, status: shot.status!,
    ...(typeof shot.providerId === "string" ? { providerId: shot.providerId } : {}),
    ...(typeof shot.modelId === "string" ? { modelId: shot.modelId } : {}),
    ...(shot.mediaType ? { mediaType: shot.mediaType } : {}),
    ...(typeof shot.taskId === "string" ? { taskId: shot.taskId } : {}),
    ...(typeof shot.outputDirectory === "string" ? { outputDirectory: shot.outputDirectory } : {}),
    ...(typeof shot.outputPath === "string" ? { outputPath: shot.outputPath } : {}),
    ...(typeof shot.model === "string" ? { model: shot.model } : {}),
    ...(typeof shot.duration === "number" ? { duration: shot.duration } : {}),
  };
}
