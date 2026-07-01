import fs from "node:fs/promises";
import path from "node:path";

interface Args {
  base: string;
  token: string;
  projectId: number;
  mp4Path: string;
  bindingsJson?: string;
  name: string;
  timeoutSec: number;
}

type ApiResponse<T> = { code: number; data: T; message: string };
type AssetGapItem = {
  slotName: string;
  slotType: string;
  usedByShots: string[];
};

function parseArgs(): Args {
  const args = new Map<string, string>();
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = process.argv[i]?.replace(/^--/, "");
    const value = process.argv[i + 1];
    if (!key || value === undefined) throw new Error(`Invalid argument near ${process.argv[i]}`);
    args.set(key, value);
  }

  const token = args.get("token") || process.env.TOONFLOW_TOKEN || "";
  const projectId = Number(args.get("projectId") || process.env.TOONFLOW_PROJECT_ID);
  const mp4Path = args.get("mp4Path") || "";
  if (!token) throw new Error("Missing --token or TOONFLOW_TOKEN");
  if (!projectId) throw new Error("Missing --projectId or TOONFLOW_PROJECT_ID");
  if (!mp4Path) throw new Error("Missing --mp4Path");

  return {
    base: (args.get("base") || "http://localhost:10588").replace(/\/+$/, ""),
    token,
    projectId,
    mp4Path,
    bindingsJson: args.get("bindingsJson"),
    name: args.get("name") || `SR smoke ${new Date().toISOString()}`,
    timeoutSec: Number(args.get("timeoutSec") || 900),
  };
}

async function api<T>(args: Args, pathName: string, body: unknown): Promise<T> {
  const response = await fetch(`${args.base}/api/structuralReplica/${pathName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: args.token },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!response.ok || payload.code >= 400) throw new Error(`${pathName}: ${payload.message}`);
  return payload.data;
}

async function uploadChunk(args: Args, url: string, body: Buffer): Promise<void> {
  const response = await fetch(`${args.base}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream", Authorization: args.token },
    body: new Uint8Array(body),
  });
  const payload = (await response.json()) as ApiResponse<unknown>;
  if (!response.ok || payload.code >= 400) throw new Error(`upload chunk: ${payload.message}`);
}

async function readBindings(input: string | undefined): Promise<unknown> {
  if (!input) return undefined;
  const resolved = path.resolve(input);
  if (await fs.stat(resolved).then(() => true).catch(() => false)) {
    return JSON.parse((await fs.readFile(resolved, "utf8")).replace(/^\uFEFF/, ""));
  }
  return JSON.parse(input.replace(/^\uFEFF/, ""));
}

export function assetIdForGap(item: AssetGapItem, mapping: Record<string, number>): number | undefined {
  const slotType = item.slotType === "voice" ? "audio" : item.slotType;
  return (
    mapping[`${item.slotType}:${item.slotName}`] ??
    mapping[`${slotType}:${item.slotName}`] ??
    mapping[item.slotName] ??
    mapping[`type:${item.slotType}`] ??
    mapping[`type:${slotType}`]
  );
}

export function bindingsFromGap(gapItems: AssetGapItem[], raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  const mapping = raw && typeof raw === "object" ? (raw as Record<string, number>) : {};

  return gapItems.flatMap((item) => {
    const assetId = assetIdForGap(item, mapping);
    if (!assetId) return [];
    return item.usedByShots.map((shotId: string) => ({
      shotId,
      slotName: item.slotName,
      slotType: item.slotType,
      assetId,
      bindingStatus: "bound",
    }));
  });
}

function reviewPatchForShot(shot: any): any {
  return {
    shotPurpose: shot.shotPurpose || "人工确认后的结构复刻镜头",
    sourceStructure: shot.sourceStructure || "人工确认源视频结构",
    reusableStructure: shot.reusableStructure || "复用镜头时长、节奏、构图和台词结构，替换原人物、品牌和水印",
    shotSize: shot.shotSize || "中景",
    cameraAngle: shot.cameraAngle || "平视",
    cameraMotion: shot.cameraMotion || "轻微手持",
    composition: shot.composition || "主体居中，保留源视频节奏",
    requiredAssetSlots: shot.requiredAssetSlots || [],
    reviewRequired: false,
    reviewReason: null,
  };
}

async function markIrReviewed(args: Args, taskId: number): Promise<void> {
  const loaded = await api<any>(args, "getTask", { taskId });
  const shots = loaded.storyIr?.data?.shots || [];
  for (const shot of shots.filter((item: any) => item.reviewRequired)) {
    await api(args, "updateIrShot", {
      taskId,
      shotId: shot.shotId,
      patch: reviewPatchForShot(shot),
    });
  }
}

async function waitForAnalysis(args: Args, taskId: number): Promise<void> {
  const deadline = Date.now() + args.timeoutSec * 1000;
  while (Date.now() < deadline) {
    const progress = await api<any>(args, "getProgress", { taskId });
    if (progress.status === "sampling_frames") return;
    if (progress.status === "failed") throw new Error(progress.errorReason || "analysis failed");
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error("analysis timed out");
}

async function waitForFrameUnderstanding(args: Args, taskId: number): Promise<void> {
  const deadline = Date.now() + args.timeoutSec * 1000;
  while (Date.now() < deadline) {
    const progress = await api<any>(args, "getProgress", { taskId });
    if (progress.status === "failed") throw new Error(progress.errorReason || "frame understanding failed");
    const artifacts = progress.artifacts || {};
    if (artifacts.shotCount > 0 && artifacts.frameUnderstandingCount >= artifacts.shotCount) return;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("frame understanding timed out");
}

async function main() {
  const args = parseArgs();
  const file = await fs.readFile(args.mp4Path);
  const fileName = path.basename(args.mp4Path);
  const task = await api<{ taskId: number }>(args, "createTask", {
    projectId: args.projectId,
    name: args.name,
    platform: "other",
    aspectRatio: "9:16",
  });
  const taskId = task.taskId;

  const init = await api<{ uploadId: string; chunkSize: number }>(args, "sourceUpload/init", {
    taskId,
    fileName,
    sizeBytes: file.length,
    mimeType: "video/mp4",
  });

  const totalParts = Math.ceil(file.length / init.chunkSize);
  for (let partIndex = 0; partIndex < totalParts; partIndex += 1) {
    const start = partIndex * init.chunkSize;
    const chunk = file.subarray(start, Math.min(file.length, start + init.chunkSize));
    await uploadChunk(args, `/api/structuralReplica/sourceUpload/chunk?taskId=${taskId}&uploadId=${encodeURIComponent(init.uploadId)}&partIndex=${partIndex}`, chunk);
  }
  await api(args, "sourceUpload/complete", { taskId, uploadId: init.uploadId, totalParts });

  await api(args, "startAnalysis", { taskId });
  await waitForAnalysis(args, taskId);
  await api(args, "runFrameUnderstanding", { taskId });
  await waitForFrameUnderstanding(args, taskId);
  await api(args, "buildIr", { taskId });
  await markIrReviewed(args, taskId);

  const loaded = await api<any>(args, "getTask", { taskId });
  const patches = (loaded.dialogueStructure?.data?.lines || []).map((line: any) => ({
    shotId: line.shotId,
    finalDialogue: line.finalDialogue || line.editableTemplate || "",
    subtitle: line.subtitle || line.finalDialogue || "",
  }));
  if (patches.length) await api(args, "updateDialogueStructure", { taskId, patches });

  const gap = await api<any>(args, "analyzeAssetGaps", { taskId });
  const rawBindings = await readBindings(args.bindingsJson);
  await api(args, "bindAssets", { taskId, bindings: bindingsFromGap(gap.items || [], rawBindings) });
  await api(args, "regenerateStoryboard", { taskId });
  const report = await api<any>(args, "checkConsistency", { taskId });
  if (report.blockerCount) throw new Error(`Consistency blockers: ${JSON.stringify(report.issues)}`);
  const pushed = await api<any>(args, "pushToProduction", { taskId, createScript: true, scriptName: args.name });

  console.log(JSON.stringify({ taskId, ...pushed }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
