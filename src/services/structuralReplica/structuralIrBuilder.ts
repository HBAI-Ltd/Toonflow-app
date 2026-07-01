import type { o_sr_frame_sample, o_sr_frame_understanding } from "@/types/database";
import { getTaskBundle } from "./repository";
import {
  DialogueStructureSchema,
  FrameUnderstandingSchema,
  ShotDetectionSchema,
  StructuralIrSchema,
  TranscriptSchema,
  type AssetSlot,
  type DialogueStructure,
  type FrameUnderstanding,
  type StructuralIr,
} from "./schemas";
import { normalizeAssetSlot } from "./assetSlotNormalizer";
import { PRIMARY_SCENE_SLOT_NAME, assetRequirementDescription, assetRequirementLabel, isUserRequiredAssetSlot } from "./assetRequirementPolicy";

interface TranscriptSegment {
  startSec: number;
  endSec: number;
  text: string;
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function parseUnderstanding(row: o_sr_frame_understanding): FrameUnderstanding | null {
  if (!row.dataJson) return null;
  return FrameUnderstandingSchema.parse(JSON.parse(row.dataJson));
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function slotDescription(type: AssetSlot["type"], slot: string): string {
  const labels: Record<AssetSlot["type"], string> = {
    role: "可替换角色资产",
    scene: "可替换场景资产",
    prop: "可替换道具资产",
    product: "可替换产品资产",
    clothing: "可替换服装资产",
    voice: "可替换声音资产",
    audio: "可替换音频资产",
  };
  return `${labels[type]}: ${slot}`;
}

function slotsFromUnderstanding(understanding: FrameUnderstanding | null, globalSceneSlots: string[] = []): AssetSlot[] {
  const characterSlots = unique(understanding?.characterSlots || []);
  const sceneSlots = unique(understanding?.sceneSlots || []);
  const primarySceneSources = sceneSlots.length ? sceneSlots : globalSceneSlots;
  const items: AssetSlot[] = [
    ...characterSlots.map((slot) => ({
      slot,
      type: "role" as const,
      required: true,
      description: slotDescription("role", slot),
    })),
    ...characterSlots.map((slot) => ({
      slot: `${slot}角色音频`,
      type: "voice" as const,
      required: true,
      description: slotDescription("voice", `${slot}角色音频`),
    })),
    {
      slot: PRIMARY_SCENE_SLOT_NAME,
      type: "scene" as const,
      required: true,
      description: primarySceneSources.length
        ? `${slotDescription("scene", PRIMARY_SCENE_SLOT_NAME)}；基于识别场景派生：${primarySceneSources.join("、")}`
        : `${slotDescription("scene", PRIMARY_SCENE_SLOT_NAME)}；作为全片空间和风格锚点`,
    },
    ...sceneSlots.map((slot) => ({
      slot,
      type: "scene" as const,
      required: false,
      description: slotDescription("scene", slot),
    })),
    ...unique(understanding?.propSlots || []).map((slot) => ({
      slot,
      type: "prop" as const,
      required: false,
      description: slotDescription("prop", slot),
    })),
    ...unique(understanding?.productSlots || []).map((slot) => ({
      slot,
      type: "product" as const,
      required: false,
      description: slotDescription("product", slot),
    })),
  ];

  const byKey = new Map<string, AssetSlot>();
  for (const item of items) {
    const normalized = normalizeAssetSlot(item);
    if (!normalized) continue;
    const normalizedAsset = {
      slot: normalized.slot,
      type: normalized.type,
    };
    byKey.set(`${normalized.type}:${normalized.slot}`, {
      slot: normalized.slot,
      type: normalized.type,
      required: isUserRequiredAssetSlot(normalizedAsset) && normalized.required,
      description: [
        normalized.description || slotDescription(normalized.type, normalized.slot),
        assetRequirementLabel(normalizedAsset),
        assetRequirementDescription(normalizedAsset),
      ].join("；"),
    });
  }
  return [...byKey.values()];
}

function transcriptForShot(segments: TranscriptSegment[], startSec: number, endSec: number): string {
  return segments
    .filter((segment) => segment.endSec > startSec && segment.startSec < endSec)
    .map((segment) => segment.text.trim())
    .filter(Boolean)
    .join(" ");
}

function framesForShot(samples: o_sr_frame_sample[], shotId: string) {
  return samples
    .filter((sample) => sample.shotId === shotId)
    .map((sample) => ({
      frameType: sample.frameType,
      timeSec: sample.timeSec,
      filePath: sample.filePath,
      qualityScore: sample.qualityScore,
    }));
}

function buildShotPurpose(index: number, total: number, sourceDialogue: string): string {
  if (index === 0) return sourceDialogue ? "开场钩子，沿用源台词节奏" : "开场视觉钩子";
  if (index === total - 1) return sourceDialogue ? "收尾节奏，沿用源台词" : "收尾视觉节奏";
  return sourceDialogue ? "叙事段落，沿用源台词节奏" : "视觉转场段落";
}

function buildSourceStructure(understanding: FrameUnderstanding | null, sourceDialogue: string): string {
  const parts = [
    understanding?.visualSummary,
    understanding?.shotSize ? `景别：${understanding.shotSize}` : "",
    understanding?.cameraAngle ? `角度：${understanding.cameraAngle}` : "",
    understanding?.cameraMotion ? `运镜：${understanding.cameraMotion}` : "",
    understanding?.composition ? `构图：${understanding.composition}` : "",
    sourceDialogue ? `台词：${sourceDialogue}` : "",
  ].filter(Boolean);
  return parts.join("；") || "该镜头需要人工复核结构";
}

function buildReusableStructure(understanding: FrameUnderstanding | null, slots = slotsFromUnderstanding(understanding)): string {
  const userRequiredSlots = slots.filter((slot) => slot.required).map((slot) => slot.slot);
  const autoDetailSlots = slots.filter((slot) => !slot.required).map((slot) => slot.slot);
  const userRequiredText = userRequiredSlots.length ? `；用户需提供资产：${userRequiredSlots.join("、")}` : "";
  const autoDetailText = autoDetailSlots.length ? `；自动生成细节：${autoDetailSlots.join("、")}` : "";
  return `复用原片的时长节奏、镜头目的、运镜方式和台词结构${userRequiredText}${autoDetailText}；替换所有原人物身份、品牌和标识元素`;
}

function mustReplaceFromUnderstanding(understanding: FrameUnderstanding | null): string[] {
  return unique([
    ...(understanding?.notReusableEntities || []),
    "原人物或原脸",
    "原品牌或标志",
    "原门店招牌",
    "水印",
  ]);
}

function buildMedia(bundle: Awaited<ReturnType<typeof getTaskBundle>>): Record<string, unknown> {
  const mediaJson = parseJson<Record<string, unknown>>(bundle.sourceMedia?.mediaJson, {});
  return {
    ...mediaJson,
    taskId: bundle.task.id,
    projectId: bundle.task.projectId,
    sourcePath: bundle.sourceMedia?.sourcePath,
    normalizedPath: bundle.sourceMedia?.normalizedPath,
    audioPath: bundle.sourceMedia?.audioPath,
    coverPath: bundle.sourceMedia?.coverPath,
    durationSec: bundle.sourceMedia?.durationSec ?? mediaJson.durationSec,
    width: bundle.sourceMedia?.width ?? mediaJson.width,
    height: bundle.sourceMedia?.height ?? mediaJson.height,
    fps: bundle.sourceMedia?.fps ?? mediaJson.fps,
    hasAudio: bundle.sourceMedia?.hasAudio === 1 || mediaJson.hasAudio === true,
  };
}

export async function buildStructuralIr(taskId: number): Promise<StructuralIr> {
  const bundle = await getTaskBundle(taskId);
  if (!bundle.shotDetection?.dataJson) throw new Error("shot detection result not found");

  const shotDetection = ShotDetectionSchema.parse(JSON.parse(bundle.shotDetection.dataJson));
  const transcript = bundle.transcript?.dataJson ? TranscriptSchema.parse(JSON.parse(bundle.transcript.dataJson)) : null;
  const understandingByShot = new Map<string, FrameUnderstanding>();

  for (const row of bundle.frameUnderstanding) {
    const parsed = parseUnderstanding(row);
    if (parsed) understandingByShot.set(parsed.shotId, parsed);
  }

  const globalSceneSlots = unique([...understandingByShot.values()].flatMap((item) => item.sceneSlots));

  const shots = shotDetection.shots.map((shot, index) => {
    const understanding = understandingByShot.get(shot.shotId) || null;
    const sourceDialogue = transcriptForShot(transcript?.segments || [], shot.startSec, shot.endSec);
    const requiredAssetSlots = slotsFromUnderstanding(understanding, globalSceneSlots);

    return {
      shotId: shot.shotId,
      enabled: true,
      startSec: shot.startSec,
      endSec: shot.endSec,
      durationSec: shot.durationSec,
      shotPurpose: buildShotPurpose(index, shotDetection.shots.length, sourceDialogue),
      sourceStructure: buildSourceStructure(understanding, sourceDialogue),
      reusableStructure: buildReusableStructure(understanding, requiredAssetSlots),
      shotSize: understanding?.shotSize,
      cameraAngle: understanding?.cameraAngle,
      cameraMotion: understanding?.cameraMotion,
      composition: understanding?.composition,
      sourceDialogue,
      dialoguePattern: sourceDialogue,
      editableDialogue: sourceDialogue,
      subtitlePattern: sourceDialogue,
      sound: transcript?.segments.length ? "源台词或环境声" : "环境声",
      transition: index === 0 ? "直接开场" : "直接切换",
      mustReplace: mustReplaceFromUnderstanding(understanding),
      requiredAssetSlots,
      frameSamples: framesForShot(bundle.frameSamples, shot.shotId),
      reviewRequired: understanding?.reviewRequired ?? true,
      reviewReason: understanding?.reason,
    };
  });

  return StructuralIrSchema.parse({
    taskId,
    media: buildMedia(bundle),
    shots,
  });
}

export function buildInitialDialogueStructure(ir: StructuralIr): DialogueStructure {
  return DialogueStructureSchema.parse({
    taskId: ir.taskId,
    version: 1,
    status: "draft",
    lines: ir.shots.map((shot) => {
      const text = shot.editableDialogue || shot.sourceDialogue || "";
      return {
        shotId: shot.shotId,
        editableTemplate: text,
        variables: {},
        finalDialogue: text,
        subtitle: shot.subtitlePattern || text,
        warnings: text ? [] : ["empty_dialogue"],
      };
    }),
  });
}
