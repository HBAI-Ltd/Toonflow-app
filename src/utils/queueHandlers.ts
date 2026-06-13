import { v4 as uuidv4 } from "uuid";
import db from "@/utils/db";
import Ai from "@/utils/ai";
import oss from "@/utils/oss";
import errorUtil from "@/utils/error";
import { scoreImage } from "@/utils/scoreImage";
import { enqueueJob, registerQueueHandler, QueueJob } from "@/utils/genQueue";
import { registerComposeHandlers } from "@/utils/composeHandlers";

/**
 * 生成队列任务处理器 + 抽卡（多候选）入队辅助
 *
 * - assetImage：单张资产候选图生成（同一 batchId 下的多张候选构成一次「抽卡」）
 * - storyboardImage：分镜图生成（执行时按 refImageIds 注入资产参考图）
 * - 候选全部结束后自动选定最优（VLM 打分最高，无分数则取首张成功图）
 */

interface AssetImagePayload {
  imageId: number;
  batchId: string;
  assetsId: number;
  projectId: number;
  model: string; // `${vendorId}:${modelName}`
  resolution: "1K" | "2K" | "4K";
  aspectRatio: `${number}:${number}`;
  prompt: string;
  referenceBase64?: string | null;
  dir: string;
  taskClass: string;
  describe: string;
  enableScore: boolean;
}

interface StoryboardImagePayload {
  storyboardId: number;
  scriptId: number;
  projectId: number;
  prompt: string;
  refImageIds: number[];
  model: string;
  size: "1K" | "2K" | "4K";
  aspectRatio: `${number}:${number}`;
}

// ─── 抽卡入队 ────────────────────────────────────────────────

export interface AssetCandidateOptions {
  projectId: number;
  assetsId: number;
  type: string;
  model: string;
  resolution: "1K" | "2K" | "4K";
  aspectRatio?: `${number}:${number}`;
  prompt: string;
  referenceBase64?: string | null;
  dir: string;
  taskClass: string;
  describe: string;
  candidateCount: number;
  enableScore: boolean;
  priority?: number;
}

/** 为一个资产创建 N 张候选图占位记录并入队，返回候选组信息 */
export async function enqueueAssetCandidates(options: AssetCandidateOptions) {
  const batchId = uuidv4();
  const modelName = options.model.split(/:(.+)/)[1];
  const vendorId = options.model.split(/:(.+)/)[0];

  const imageIds: number[] = [];
  for (let i = 0; i < options.candidateCount; i++) {
    const [imageId] = await db("o_image").insert({
      type: options.type,
      state: "生成中",
      assetsId: options.assetsId,
      model: modelName,
      resolution: options.resolution,
      batchId,
      selected: 0,
    });
    imageIds.push(imageId);
  }
  // 占位：先指向首张候选，保证现有轮询接口可用；批次完成后自动改指最优候选
  await db("o_assets").where("id", options.assetsId).update({ imageId: imageIds[0] });

  const jobs = [];
  for (const imageId of imageIds) {
    const payload: AssetImagePayload = {
      imageId,
      batchId,
      assetsId: options.assetsId,
      projectId: options.projectId,
      model: options.model,
      resolution: options.resolution,
      aspectRatio: options.aspectRatio ?? "16:9",
      prompt: options.prompt,
      referenceBase64: options.referenceBase64 ?? null,
      dir: options.dir,
      taskClass: options.taskClass,
      describe: options.describe,
      enableScore: options.enableScore,
    };
    const job = await enqueueJob({
      projectId: options.projectId,
      kind: "assetImage",
      payload: payload as unknown as Record<string, unknown>,
      vendorId,
      priority: options.priority,
    });
    jobs.push(job);
  }
  return { batchId, imageIds, jobs };
}

// ─── 资产候选图处理器 ────────────────────────────────────────

async function handleAssetImage(payload: AssetImagePayload, job: QueueJob): Promise<void> {
  const imageRow = await db("o_image").where("id", payload.imageId).first();
  if (!imageRow) return; // 资产/图片已被删除，静默结束
  // 用户主动取消（cancelGenerate 置为生成失败且无 errorReason），不再重试
  if (imageRow.state === "生成失败" && !imageRow.errorReason) return;

  await db("o_image").where("id", payload.imageId).update({ state: "生成中", errorReason: null });

  try {
    const aiImage = Ai.Image(payload.model as `${string}:${string}`);
    await aiImage.run(
      {
        prompt: payload.prompt,
        referenceList: payload.referenceBase64 ? [{ type: "image", base64: payload.referenceBase64 }] : [],
        size: payload.resolution,
        aspectRatio: payload.aspectRatio,
      },
      {
        taskClass: payload.taskClass,
        describe: payload.describe,
        projectId: payload.projectId,
        relatedObjects: JSON.stringify({ id: payload.assetsId, projectId: payload.projectId, batchId: payload.batchId }),
      },
    );
    const imagePath = `/${payload.projectId}/${payload.dir}/${uuidv4()}.jpg`;
    await aiImage.save(imagePath);

    const latest = await db("o_image").where("id", payload.imageId).first();
    if (!latest) return;
    if (latest.state === "生成失败" && !latest.errorReason) return; // 执行期间被取消

    await db("o_image").where("id", payload.imageId).update({ state: "已完成", filePath: imagePath });

    if (payload.enableScore) {
      const result = await scoreImage(imagePath, payload.prompt);
      if (result) {
        await db("o_image").where("id", payload.imageId).update({ score: result.score, scoreReason: result.reason });
      }
    }
    await finalizeBatch(payload.batchId, payload.assetsId);
  } catch (e) {
    const message = errorUtil(e).message;
    await db("o_image").where("id", payload.imageId).update({ state: "生成失败", errorReason: message });
    // 已是最后一次尝试时结算批次，避免批次永远停留在未选定状态
    if ((job.retryCount ?? 0) >= (job.maxRetry ?? 0)) {
      await finalizeBatch(payload.batchId, payload.assetsId);
    }
    throw new Error(message);
  }
}

/** 批次内所有候选结束后，自动选定最优候选并更新资产指向 */
async function finalizeBatch(batchId: string, assetsId: number): Promise<void> {
  const siblings = await db("o_image").where("batchId", batchId).select("id", "state", "score");
  if (siblings.some((row) => row.state === "生成中")) return;

  const completed = siblings.filter((row) => row.state === "已完成");
  if (!completed.length) return;

  const best = completed.reduce((acc, row) => {
    const accScore = acc.score ?? -1;
    const rowScore = row.score ?? -1;
    if (rowScore > accScore) return row;
    if (rowScore === accScore && row.id! < acc.id!) return row;
    return acc;
  });

  await db("o_image").where("batchId", batchId).update({ selected: 0 });
  await db("o_image").where("id", best.id).update({ selected: 1 });
  await db("o_assets").where("id", assetsId).update({ imageId: best.id });
}

// ─── 分镜图处理器 ────────────────────────────────────────────

async function handleStoryboardImage(payload: StoryboardImagePayload): Promise<void> {
  const storyboard = await db("o_storyboard").where("id", payload.storyboardId).first();
  if (!storyboard) return; // 分镜已被删除

  await db("o_storyboard").where("id", payload.storyboardId).update({ state: "生成中", reason: null });

  try {
    const referenceList = await getReferenceImages(payload.refImageIds);
    const aiImage = Ai.Image(payload.model as `${string}:${string}`);
    await aiImage.run(
      {
        prompt: payload.prompt,
        referenceList,
        size: payload.size,
        aspectRatio: payload.aspectRatio,
      },
      {
        taskClass: "生成分镜图片",
        describe: "分镜图片生成",
        projectId: payload.projectId,
        relatedObjects: JSON.stringify({ storyboardId: payload.storyboardId, prompt: payload.prompt }),
      },
    );
    const savePath = `/${payload.projectId}/assets/${payload.scriptId}/${uuidv4()}.jpg`;
    await aiImage.save(savePath);
    await db("o_storyboard").where("id", payload.storyboardId).update({ filePath: savePath, state: "已完成" });
  } catch (e) {
    const message = errorUtil(e).message;
    await db("o_storyboard").where("id", payload.storyboardId).update({ filePath: "", reason: message, state: "生成失败" });
    throw new Error(message);
  }
}

/** 按 imageIds 顺序加载资产参考图（执行时实时读取，保证数据新鲜且 payload 轻量） */
async function getReferenceImages(imageIds: number[]): Promise<{ type: "image"; base64: string }[]> {
  if (!imageIds.length) return [];
  const rows = await db("o_image").whereIn("id", imageIds).select("id", "filePath");
  const id2Path = new Map<number, string>();
  for (const row of rows) {
    if (row.filePath) id2Path.set(row.id!, row.filePath);
  }
  const images = await Promise.all(
    imageIds.map(async (id) => {
      const filePath = id2Path.get(id);
      if (!filePath) return null;
      try {
        return await oss.getImageBase64(filePath);
      } catch {
        return null;
      }
    }),
  );
  return (images.filter(Boolean) as string[]).map((base64) => ({ type: "image" as const, base64 }));
}

// ─── 注册 ───────────────────────────────────────────────────

export function registerQueueHandlers(): void {
  registerQueueHandler("assetImage", handleAssetImage);
  registerQueueHandler("storyboardImage", (payload) => handleStoryboardImage(payload));
  registerComposeHandlers();
}

export type { StoryboardImagePayload };
