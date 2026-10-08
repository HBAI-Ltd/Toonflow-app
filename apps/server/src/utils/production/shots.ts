import { mkdir, readFile, writeAtomic } from "@toonflow/file";
import { join } from "node:path";
import { resolveWorkspacePath } from "@/utils/workspace/files";

export const shotStatuses = ["draft", "queued", "generating", "review", "approved", "needsRedo", "completed"] as const;
export type ShotStatus = typeof shotStatuses[number];
export type ProductionShot = {
  id: string;
  order: number;
  title: string;
  prompt: string;
  status: ShotStatus;
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
  return { version: 1, updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(), exportedPath: value.exportedPath, shots: value.shots };
}

export async function writeProductionManifest(directory: string, manifest: ProductionManifest) {
  const path = await manifestPath(directory);
  const next = { ...manifest, updatedAt: new Date().toISOString() };
  await writeAtomic(path, JSON.stringify(next, null, 2));
  return next;
}

export function validateShot(value: unknown): ProductionShot {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("镜头必须是对象"), { status: 400 });
  const shot = value as Partial<ProductionShot>;
  if (typeof shot.id !== "string" || !shot.id.trim() || typeof shot.title !== "string" || typeof shot.prompt !== "string") throw Object.assign(new Error("镜头缺少 id、title 或 prompt"), { status: 400 });
  if (!Number.isInteger(shot.order) || shot.order! < 0 || !shotStatuses.includes(shot.status as ShotStatus)) throw Object.assign(new Error("镜头 order 或 status 无效"), { status: 400 });
  return { id: shot.id, order: shot.order!, title: shot.title, prompt: shot.prompt, status: shot.status!, ...(typeof shot.outputPath === "string" ? { outputPath: shot.outputPath } : {}), ...(typeof shot.model === "string" ? { model: shot.model } : {}), ...(typeof shot.duration === "number" ? { duration: shot.duration } : {}) };
}
