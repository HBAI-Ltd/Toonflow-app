import { z } from "zod";

export const SrAspectRatioSchema = z.enum(["9:16", "16:9", "1:1", "4:3", "3:4"]);
export const SrPlatformSchema = z.enum(["douyin", "xiaohongshu", "kuaishou", "bilibili", "wechat", "other"]);
export const SrAssetSlotTypeSchema = z.enum(["role", "scene", "prop", "product", "clothing", "voice", "audio"]);

export const CreateTaskSchema = z.object({
  projectId: z.number().int().positive(),
  name: z.string().min(1),
  platform: SrPlatformSchema.default("other"),
  aspectRatio: SrAspectRatioSchema.default("9:16"),
});

export const SourceMediaSchema = z.object({
  taskId: z.number().int().positive(),
  sourcePath: z.string().min(1),
  normalizedPath: z.string().min(1).nullable().optional(),
  audioPath: z.string().min(1).nullable().optional(),
  coverPath: z.string().min(1).nullable().optional(),
  mediaJson: z.string().nullable().optional(),
  sha256: z.string().nullable().optional(),
  sizeBytes: z.number().int().nonnegative(),
  durationSec: z.number().nonnegative().nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  fps: z.number().positive().nullable().optional(),
  hasAudio: z.union([z.literal(0), z.literal(1)]),
});

export const TranscriptSegmentSchema = z.object({
  startSec: z.number().nonnegative(),
  endSec: z.number().nonnegative(),
  text: z.string(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  speechRateCps: z.number().nonnegative().nullable().optional(),
});

export const TranscriptSchema = z.object({
  engine: z.string().min(1),
  model: z.string().min(1),
  segments: z.array(TranscriptSegmentSchema),
  warnings: z.array(z.string()).optional(),
});

export const ShotSchema = z.object({
  shotId: z.string().min(1),
  startSec: z.number().nonnegative(),
  endSec: z.number().nonnegative(),
  durationSec: z.number().nonnegative(),
});

export const ShotDetectionSchema = z.object({
  engine: z.string().min(1),
  shots: z.array(ShotSchema),
  warnings: z.array(z.string()).optional(),
});

export const FrameSampleSchema = z.object({
  taskId: z.number().int().positive().optional(),
  shotId: z.string().min(1),
  frameType: z.enum(["start", "middle", "end", "action", "text", "product"]),
  timeSec: z.number().nonnegative(),
  filePath: z.string().min(1),
  qualityScore: z.number().nonnegative().nullable().optional(),
});

function coerceListItem(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidate = record.slot ?? record.name ?? record.label ?? record.title ?? record.text ?? record.description;
    return typeof candidate === "string" ? candidate.trim() || null : null;
  }
  return null;
}

const StringListSchema = z.preprocess(
  (value) => {
    if (!Array.isArray(value)) return value;
    return value.map(coerceListItem).filter((item): item is string => Boolean(item));
  },
  z.array(z.string()).default([]),
);

const BooleanDefaultFalseSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0"].includes(normalized)) return false;
  return value;
}, z.boolean().default(false));

export const FrameUnderstandingSchema = z.object({
  shotId: z.string().min(1),
  provider: z.string().min(1),
  visualSummary: z.string().optional(),
  shotSize: z.string().optional(),
  cameraAngle: z.string().optional(),
  cameraMotion: z.string().optional(),
  composition: z.string().optional(),
  characterSlots: StringListSchema,
  sceneSlots: StringListSchema,
  propSlots: StringListSchema,
  productSlots: StringListSchema,
  visibleText: StringListSchema,
  notReusableEntities: StringListSchema,
  reviewRequired: BooleanDefaultFalseSchema,
  reason: z.string().optional(),
});

export const AssetSlotSchema = z.object({
  slot: z.string().min(1),
  type: SrAssetSlotTypeSchema,
  required: z.boolean().default(true),
  description: z.string().optional(),
});

export const StructuralIrShotSchema = z.object({
  shotId: z.string().min(1),
  enabled: z.boolean().default(true),
  startSec: z.number().nonnegative(),
  endSec: z.number().nonnegative(),
  durationSec: z.number().nonnegative(),
  shotPurpose: z.string().optional(),
  sourceStructure: z.string().optional(),
  reusableStructure: z.string().optional(),
  shotSize: z.string().optional(),
  cameraAngle: z.string().optional(),
  cameraMotion: z.string().optional(),
  composition: z.string().optional(),
  sourceDialogue: z.string().optional(),
  dialoguePattern: z.string().optional(),
  editableDialogue: z.string().optional(),
  subtitlePattern: z.string().optional(),
  sound: z.string().optional(),
  transition: z.string().optional(),
  mustReplace: z.array(z.string()).default([]),
  requiredAssetSlots: z.array(AssetSlotSchema).default([]),
  frameSamples: z
    .array(
      z.object({
        frameType: z.string().nullable().optional(),
        timeSec: z.number().nullable().optional(),
        filePath: z.string().nullable().optional(),
        qualityScore: z.number().nullable().optional(),
      }),
    )
    .default([]),
  reviewRequired: z.boolean().default(false),
  reviewReason: z.string().optional(),
});

export const StructuralIrSchema = z.object({
  taskId: z.number().int().positive(),
  media: z.record(z.string(), z.unknown()).optional(),
  shots: z.array(StructuralIrShotSchema),
});

export const DialogueLineSchema = z.object({
  shotId: z.string().min(1),
  dialogueMode: z.enum(["source", "user_edited", "compressed", "split", "extended", "no_dialogue"]).default("source"),
  sourceDialogue: z.string().default(""),
  dialoguePattern: z.string().default(""),
  editableDialogue: z.string().default(""),
  editableTemplate: z.string(),
  variables: z.record(z.string(), z.string()).default({}),
  finalDialogue: z.string(),
  subtitle: z.string().optional(),
  cta: z.string().optional(),
  charCount: z.number().int().nonnegative().default(0),
  estimatedSpeechSec: z.number().nonnegative().default(0),
  targetDurationSec: z.number().nonnegative().default(0),
  fitsDuration: z.boolean().default(true),
  timingStrategy: z.enum(["fit", "compress_dialogue", "split_shot", "extend_shot", "no_dialogue"]).default("fit"),
  timingActions: z.array(z.enum(["compress_dialogue", "split_shot", "extend_shot", "mark_no_dialogue", "sync_subtitle_from_dialogue"])).default([]),
  warnings: z.array(z.string()).default([]),
});

export const DialogueStructureSchema = z.object({
  taskId: z.number().int().positive(),
  version: z.number().int().positive(),
  status: z.enum(["draft", "reviewed"]),
  lines: z.array(DialogueLineSchema),
});

export const AssetGapItemSchema = z.object({
  slotName: z.string().min(1),
  slotType: SrAssetSlotTypeSchema,
  required: z.boolean().default(true),
  usedByShots: z.array(z.string()).default([]),
  status: z.enum(["missing", "suggested", "bound"]),
  suggestedAssetIds: z.array(z.number().int().positive()).default([]),
  uploadHint: z.string().optional(),
});

export const AssetGapSchema = z.object({
  taskId: z.number().int().positive(),
  missingCount: z.number().int().nonnegative(),
  items: z.array(AssetGapItemSchema),
});

export const AssetBindingSchema = z.object({
  taskId: z.number().int().positive(),
  shotId: z.string().min(1),
  slotName: z.string().min(1),
  slotType: SrAssetSlotTypeSchema,
  assetId: z.number().int().positive().nullable(),
  bindingStatus: z.enum(["missing", "bound", "cleared"]),
  note: z.string().nullable().optional(),
});

export const PromptAssetSlotSchema = z.object({
  slotName: z.string().min(1),
  slotType: SrAssetSlotTypeSchema,
  token: z.string().min(1),
  required: z.boolean().default(true),
  boundAssetId: z.number().int().positive().nullable().optional(),
  bindingStatus: z.enum(["missing", "bound", "cleared"]).default("missing"),
});

export const PromptSourceTimeRangeSchema = z.object({
  startSec: z.number().nonnegative(),
  endSec: z.number().nonnegative(),
});

export const PromptPackageIssueSchema = z.object({
  level: z.enum(["blocker", "warning", "info"]),
  code: z.string().min(1),
  message: z.string().min(1),
  shotId: z.string().optional(),
});

export const PromptPackageValidationReportSchema = z.object({
  status: z.enum(["pass", "blocked"]),
  issues: z.array(PromptPackageIssueSchema).default([]),
  markdown: z.string().optional(),
});

export const PromptShotSchema = z.object({
  shotId: z.string().min(1),
  sourceTimeRange: PromptSourceTimeRangeSchema,
  durationSec: z.number().positive(),
  rawPrompt: z.string().min(1),
  resolvedPrompt: z.string().min(1),
  negativePrompt: z.string().min(1),
  referenceFrames: z.array(z.string()).default([]),
  assetSlots: z.array(PromptAssetSlotSchema).default([]),
  warnings: z.array(z.string()).default([]),
  validationStatus: z.enum(["pass", "blocked"]).default("pass"),
});

export const StoryboardPromptMapSchema = z.record(
  z.string(),
  z.object({
    rawPrompt: z.string().min(1),
    resolvedPrompt: z.string().min(1),
    negativePrompt: z.string().min(1),
  }),
);

export const PromptPackageSchema = z.object({
  taskId: z.number().int().positive(),
  version: z.number().int().positive(),
  shots: z.array(PromptShotSchema),
  finalVideoPrompt: z.string().min(1),
  finalNegativePrompt: z.string().min(1),
  storyboardPromptMap: StoryboardPromptMapSchema,
  validationReport: PromptPackageValidationReportSchema,
});

export const StoryboardPromptMetaSchema = z.object({
  sourceTimeRange: PromptSourceTimeRangeSchema,
  referenceFrames: z.array(z.string()).default([]),
  assetSlots: z.array(PromptAssetSlotSchema).default([]),
  warnings: z.array(z.string()).default([]),
  validationStatus: z.enum(["pass", "blocked"]).default("pass"),
});

export const RegeneratedStoryboardRowSchema = z.object({
  shotId: z.string().min(1),
  duration: z.number().positive(),
  track: z.string().min(1),
  prompt: z.string(),
  videoDesc: z.string().min(1),
  rawPrompt: z.string().optional(),
  resolvedPrompt: z.string().optional(),
  negativePrompt: z.string().optional(),
  promptMeta: StoryboardPromptMetaSchema.optional(),
  state: z.string().optional(),
  src: z.string().nullable().optional(),
  shouldGenerateImage: z.union([z.literal(0), z.literal(1)]).default(0),
  associateAssetsIds: z.array(z.number().int().positive()).default([]),
});

export const RegeneratedStoryboardSchema = z.object({
  taskId: z.number().int().positive(),
  version: z.number().int().positive(),
  rows: z.array(RegeneratedStoryboardRowSchema),
  promptPackage: PromptPackageSchema.optional(),
});

export const ConsistencyIssueSchema = z.object({
  level: z.enum(["blocker", "warning", "info"]),
  code: z.string().min(1),
  message: z.string().min(1),
  shotId: z.string().optional(),
});

export const ConsistencyReportSchema = z.object({
  taskId: z.number().int().positive(),
  status: z.enum(["pass", "blocked"]),
  issues: z.array(ConsistencyIssueSchema),
  markdown: z.string().optional(),
});

export const ShotAdaptationLevelSchema = z.enum(["A", "B", "C", "D"]);

export const ShotAdaptationSchema = z.object({
  taskId: z.number().int().positive(),
  shotId: z.string().min(1),
  adaptationLevel: ShotAdaptationLevelSchema,
  adaptationStrategy: z.enum(["use_reference_and_assets", "use_user_assets_first", "rewrite_to_available_scene", "blocked_missing_assets"]),
  assetMatchScore: z.number().min(0).max(1),
  requiredSlots: z.array(z.string()).default([]),
  matchedAssets: z.record(
    z.string(),
    z.object({
      assetId: z.number().int().positive().nullable(),
      score: z.number().min(0).max(1),
      reason: z.string().optional(),
    }),
  ),
  adaptedVisual: z.string().default(""),
  blockedReasons: z.array(z.string()).default([]),
  downgradeReasons: z.array(z.string()).default([]),
});

export const ProviderCapabilitySchema = z.object({
  providerId: z.string().min(1),
  providerType: z.enum(["openai_compatible", "toonflow_vendor", "custom"]).default("openai_compatible"),
  displayName: z.string().optional(),
  baseUrl: z.string().optional().default(""),
  apiKey: z.string().optional().default(""),
  enabled: z.boolean().default(true),
  models: z
    .array(
      z.object({
        model: z.string().min(1),
        displayName: z.string().optional(),
        type: z.enum(["text", "image", "video"]).default("video"),
        priority: z.number().int().default(0),
        capabilities: z.object({
          textToVideo: z.boolean().default(false),
          imageToVideo: z.boolean().default(false),
          videoReference: z.boolean().default(false),
          multiReference: z.boolean().default(false),
          characterLock: z.boolean().default(false),
          lipSync: z.boolean().default(false),
          maxDurationSec: z.number().positive().default(5),
          supportedRatios: z.array(SrAspectRatioSchema).default(["9:16"]),
          supportsSeed: z.boolean().default(false),
          supportsNegativePrompt: z.boolean().default(false),
        }),
      }),
    )
    .default([]),
});

export const ModelRouteSchema = z.object({
  taskId: z.number().int().positive(),
  shotId: z.string().min(1),
  selectedProviderId: z.string().nullable(),
  selectedModel: z.string().nullable(),
  routeStatus: z.enum(["selected", "degraded", "blocked"]),
  requiredCapabilities: z.array(z.string()).default([]),
  fallbackPlan: z.array(z.string()).default([]),
  downgradeReasons: z.array(z.string()).default([]),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type SourceMedia = z.infer<typeof SourceMediaSchema>;
export type Transcript = z.infer<typeof TranscriptSchema>;
export type ShotDetection = z.infer<typeof ShotDetectionSchema>;
export type FrameSample = z.infer<typeof FrameSampleSchema>;
export type FrameUnderstanding = z.infer<typeof FrameUnderstandingSchema>;
export type AssetSlot = z.infer<typeof AssetSlotSchema>;
export type StructuralIr = z.infer<typeof StructuralIrSchema>;
export type DialogueStructure = z.infer<typeof DialogueStructureSchema>;
export type AssetGap = z.infer<typeof AssetGapSchema>;
export type AssetBinding = z.infer<typeof AssetBindingSchema>;
export type PromptAssetSlot = z.infer<typeof PromptAssetSlotSchema>;
export type PromptPackageIssue = z.infer<typeof PromptPackageIssueSchema>;
export type PromptPackageValidationReport = z.infer<typeof PromptPackageValidationReportSchema>;
export type PromptShot = z.infer<typeof PromptShotSchema>;
export type PromptPackage = z.infer<typeof PromptPackageSchema>;
export type RegeneratedStoryboard = z.infer<typeof RegeneratedStoryboardSchema>;
export type ConsistencyIssue = z.infer<typeof ConsistencyIssueSchema>;
export type ConsistencyReport = z.infer<typeof ConsistencyReportSchema>;
export type ShotAdaptation = z.infer<typeof ShotAdaptationSchema>;
export type ProviderCapability = z.infer<typeof ProviderCapabilitySchema>;
export type ModelRoute = z.infer<typeof ModelRouteSchema>;
