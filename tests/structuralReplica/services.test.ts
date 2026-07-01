import assert from "node:assert/strict";
import { assertTransition, isTerminalStatus } from "../../src/services/structuralReplica/taskState";
import { AssetBindingSchema, AssetGapSchema, FrameUnderstandingSchema, StructuralIrSchema } from "../../src/services/structuralReplica/schemas";
import { hasSourceEntityRisk, stripSourceSafetyClauses, collectAnalysisQualityIssues } from "../../src/services/structuralReplica/consistencyGuard";
import { buildInitialDialogueStructure } from "../../src/services/structuralReplica/dialogueStructureService";
import { associatedAssetIds, missingRequiredBindings, renderVideoDesc } from "../../src/services/structuralReplica/videoDescRenderer";
import { normalizeAssetSlot } from "../../src/services/structuralReplica/assetSlotNormalizer";
import { generatePromptPackage } from "../../src/services/structuralReplica/promptPackageGenerator";
import { PRIMARY_SCENE_SLOT_NAME } from "../../src/services/structuralReplica/assetRequirementPolicy";
import { evaluateDialogueTiming, compressDialogueText } from "../../src/services/structuralReplica/dialogueTimingService";
import { evaluateAdaptationLevel } from "../../src/services/structuralReplica/adaptationLevelPolicy";
import { ProviderCapabilitySchema, ShotAdaptationSchema } from "../../src/services/structuralReplica/schemas";
import { evaluateModelCandidate, requiredCapabilitiesForShot } from "../../src/services/structuralReplica/modelGateway/capabilityPolicy";

assert.doesNotThrow(() => assertTransition("ir_built", "dialogue_reviewed"));
assert.doesNotThrow(() => assertTransition("asset_gap_ready", "understanding_frames"));
assert.doesNotThrow(() => assertTransition("asset_gap_ready", "ir_built"));
assert.doesNotThrow(() => assertTransition("assets_bound", "asset_gap_ready"));
assert.doesNotThrow(() => assertTransition("failed", "understanding_frames"));
assert.throws(() => assertTransition("draft", "ir_built"), /Invalid structural replica task status transition/);
assert.equal(isTerminalStatus("pushed"), true);
assert.equal(isTerminalStatus("checked"), false);

const ir = StructuralIrSchema.parse({
  taskId: 1,
  media: { durationSec: 2 },
  shots: [
    {
      shotId: "shot_001",
      enabled: true,
      startSec: 0,
      endSec: 2,
      durationSec: 2,
      shotPurpose: "hook",
      reusableStructure: "close-up host hook",
      sourceDialogue: "hi {p}",
      editableDialogue: "hi {p}",
      subtitlePattern: "hi {p}",
      requiredAssetSlots: [{ slot: "host", type: "role", required: true }],
      mustReplace: ["original_brand_or_logo"],
      frameSamples: [
        {
          frameType: "middle",
          timeSec: 1,
          filePath: "frames/shot_001_middle.jpg",
          qualityScore: 0.9,
        },
      ],
    },
  ],
});

const dialogue = buildInitialDialogueStructure(ir);
assert.equal(dialogue.lines[0].variables.p, "");
assert.deepEqual(dialogue.lines[0].warnings, []);
assert.equal(dialogue.lines[0].targetDurationSec, 2);
assert.equal(typeof dialogue.lines[0].estimatedSpeechSec, "number");

const longTiming = evaluateDialogueTiming("这是一句明显超过一秒钟镜头可承载长度的中文台词", 1);
assert.equal(longTiming.fitsDuration, false);
assert.ok(longTiming.timingActions.includes("split_shot") || longTiming.timingActions.includes("compress_dialogue"));
assert.ok(compressDialogueText("这是一句明显超过一秒钟镜头可承载长度的中文台词", 1).length < 24);

const binding = AssetBindingSchema.parse({
  taskId: 1,
  shotId: "shot_001",
  slotName: "host",
  slotType: "role",
  assetId: 1001,
  bindingStatus: "bound",
});

assert.deepEqual(missingRequiredBindings(ir.shots[0], [binding]), []);
assert.deepEqual(associatedAssetIds(ir.shots[0], [binding]), [1001]);

const videoDesc = renderVideoDesc(1, ir.shots[0], dialogue.lines[0], [binding]);
assert.match(videoDesc, /资产:1001/);
assert.match(videoDesc, /禁止出现原视频人物/);

const safetyOnlyText = [
  "复用原片的时长节奏、镜头目的、运镜方式和台词结构；替换所有原人物身份、品牌和标识元素",
  "禁止出现原视频人物、原脸、品牌、标志、门店招牌、水印或私人身份信息",
  "不要出现原视频人物脸、原品牌、原门店招牌、原账号、水印、logo、商标、低清晰度、画面畸变、字幕错位、资产身份不一致",
  "必须替换：原人物或原脸，原品牌或标志，原门店招牌，水印",
].join("；");
assert.equal(hasSourceEntityRisk(safetyOnlyText), false);
assert.equal(hasSourceEntityRisk("需更换为新演员，不复刻原脸。需使用替代演员，不复刻原人物面部。需避免使用原人物身份特征。无品牌标识的简洁白色上衣。"), false);
assert.equal(hasSourceEntityRisk("镜头里仍然保留原品牌门店招牌和水印"), true);
assert.match(stripSourceSafetyClauses(`${safetyOnlyText}；镜头里仍然保留原品牌`), /仍然保留原品牌/);

const promptPackage = generatePromptPackage({
  taskId: 1,
  version: 1,
  ir,
  dialogue,
  bindings: [binding],
});
assert.equal(promptPackage.validationReport.status, "pass");
assert.match(promptPackage.shots[0].rawPrompt, /\{role\.讲解者\}/);
assert.match(promptPackage.shots[0].resolvedPrompt, /\{role\.讲解者\}=资产:1001/);
assert.match(promptPackage.shots[0].negativePrompt, /original_brand_or_logo/);
assert.deepEqual(promptPackage.shots[0].referenceFrames, ["frames/shot_001_middle.jpg"]);
assert.match(promptPackage.finalVideoPrompt, /镜头 01/);

const gap = AssetGapSchema.parse({
  taskId: 1,
  missingCount: 1,
  items: [
    {
      slotName: "host",
      slotType: "role",
      required: true,
      usedByShots: ["shot_001"],
      status: "missing",
      suggestedAssetIds: [],
    },
  ],
});
assert.equal(gap.items[0].status, "missing");

assert.equal(normalizeAssetSlot({ slot: "subtitles", type: "prop", required: true }), null);
assert.equal(normalizeAssetSlot({ slot: "字幕贴片", type: "prop", required: true }), null);
assert.deepEqual(normalizeAssetSlot({ slot: "text_overlay", type: "prop", required: true })?.slot, "文字贴片");
assert.deepEqual(normalizeAssetSlot({ slot: "small black lapel microphone", type: "prop", required: true })?.slot, "领夹麦");

const normalizedSlotIr = StructuralIrSchema.parse({
  taskId: 2,
  media: { durationSec: 4 },
  shots: [
    {
      shotId: "shot_001",
      enabled: true,
      startSec: 0,
      endSec: 2,
      durationSec: 2,
      requiredAssetSlots: [
        { slot: "subtitles", type: "prop", required: true },
        { slot: "presenter", type: "role", required: true },
        { slot: "clip_on_microphone", type: "prop", required: true },
      ],
      mustReplace: [],
    },
    {
      shotId: "shot_002",
      enabled: true,
      startSec: 2,
      endSec: 4,
      durationSec: 2,
      requiredAssetSlots: [
        { slot: "host", type: "role", required: true },
        { slot: "lapel_microphone", type: "prop", required: true },
      ],
      mustReplace: [],
    },
  ],
});

const normalizedBindings = [
  AssetBindingSchema.parse({
    taskId: 2,
    shotId: "shot_001",
    slotName: "讲解者",
    slotType: "role",
    assetId: 2001,
    bindingStatus: "bound",
  }),
  AssetBindingSchema.parse({
    taskId: 2,
    shotId: "shot_002",
    slotName: "presenter",
    slotType: "role",
    assetId: 2001,
    bindingStatus: "bound",
  }),
];

assert.deepEqual(missingRequiredBindings(normalizedSlotIr.shots[0], normalizedBindings), []);
assert.deepEqual(missingRequiredBindings(normalizedSlotIr.shots[1], normalizedBindings), []);

const coreSceneIr = StructuralIrSchema.parse({
  taskId: 3,
  media: { durationSec: 2 },
  shots: [
    {
      shotId: "shot_001",
      enabled: true,
      startSec: 0,
      endSec: 2,
      durationSec: 2,
      requiredAssetSlots: [
        { slot: PRIMARY_SCENE_SLOT_NAME, type: "scene", required: true },
        { slot: "consultation_room", type: "scene", required: false },
      ],
      mustReplace: [],
    },
  ],
});
assert.deepEqual(missingRequiredBindings(coreSceneIr.shots[0], []), [`scene:${PRIMARY_SCENE_SLOT_NAME}`]);

const adaptationD = evaluateAdaptationLevel({
  shot: {
    ...ir.shots[0],
    requiredAssetSlots: [
      { slot: "host", type: "role", required: true },
      { slot: "storefront", type: "scene", required: true },
    ],
  },
  bindings: [],
});
assert.equal(adaptationD.adaptationLevel, "D");
assert.ok(adaptationD.blockedReasons.some((reason) => reason.includes("missing_required_role")));

const adaptationC = evaluateAdaptationLevel({
  shot: {
    ...ir.shots[0],
    requiredAssetSlots: [{ slot: "storefront", type: "scene", required: true }],
  },
  bindings: [],
});
assert.equal(adaptationC.adaptationLevel, "C");
assert.ok(adaptationC.downgradeReasons.some((reason) => reason.includes("missing_scene")));

const routeAdaptation = ShotAdaptationSchema.parse({
  taskId: 1,
  shotId: "shot_001",
  adaptationLevel: "A",
  adaptationStrategy: "use_reference_and_assets",
  assetMatchScore: 1,
  requiredSlots: ["role:host"],
  matchedAssets: { "role:host": { assetId: 1001, score: 1 } },
  adaptedVisual: "host hook",
  blockedReasons: [],
  downgradeReasons: [],
});
const requiredCaps = requiredCapabilitiesForShot({ adaptation: routeAdaptation, durationSec: 8, aspectRatio: "9:16" });
assert.ok(requiredCaps.includes("videoReference"));
assert.ok(requiredCaps.includes("characterLock"));
const limitedProvider = ProviderCapabilitySchema.parse({
  providerId: "limited",
  providerType: "openai_compatible",
  baseUrl: "https://example.test/v1",
  enabled: true,
  models: [
    {
      model: "i2v-only",
      type: "video",
      capabilities: {
        textToVideo: true,
        imageToVideo: true,
        videoReference: false,
        multiReference: false,
        characterLock: false,
        maxDurationSec: 5,
        supportedRatios: ["9:16"],
      },
    },
  ],
});
const routeEval = evaluateModelCandidate(limitedProvider, limitedProvider.models[0], requiredCaps);
assert.equal(routeEval.routeStatus, "degraded");
assert.ok(routeEval.downgradeReasons.includes("video_reference_not_supported_use_keyframe_image_to_video"));
assert.ok(routeEval.downgradeReasons.includes("model_max_duration_insufficient_split_or_compress_dialogue"));

const objectSlotUnderstanding = FrameUnderstandingSchema.parse({
  shotId: "shot_001",
  provider: "worldclawpro",
  visualSummary: "clinical close-up",
  characterSlots: [{ slot: "patient", description: "adult patient" }],
  sceneSlots: [{ name: "treatment room" }],
  propSlots: [{ label: "medical drape" }],
  productSlots: [],
  visibleText: ["overlay"],
  notReusableEntities: [{ description: "original facial identity" }],
  reviewRequired: "true",
});
assert.deepEqual(objectSlotUnderstanding.characterSlots, ["patient"]);
assert.deepEqual(objectSlotUnderstanding.sceneSlots, ["treatment room"]);
assert.deepEqual(objectSlotUnderstanding.propSlots, ["medical drape"]);
assert.deepEqual(objectSlotUnderstanding.notReusableEntities, ["original facial identity"]);
assert.equal(objectSlotUnderstanding.reviewRequired, true);

const storyboard = {
  taskId: 1,
  version: 1,
  rows: [
    {
      shotId: "shot_001",
      duration: 2,
      track: "SR-S01",
      prompt: "structural remake shot",
      videoDesc: "No dialogue | unspecified shot size | no bound assets",
      state: "pending",
      src: null,
      shouldGenerateImage: 0 as const,
      associateAssetsIds: [],
    },
  ],
};

const reviewRequiredIr = StructuralIrSchema.parse({
  ...ir,
  shots: ir.shots.map((shot) => ({
    ...shot,
    reviewRequired: true,
    reviewReason: "vision_provider_not_configured",
  })),
});

const qualityIssues = collectAnalysisQualityIssues({
  hasAudio: true,
  transcript: {
    engine: "whisper",
    model: "turbo",
    segments: [],
    warnings: ["openai-whisper is not installed; transcript was skipped.", "import_error: No module named 'whisper'"],
  },
  shotDetection: {
    engine: "scenedetect",
    shots: [{ shotId: "shot_001", startSec: 0, endSec: 2, durationSec: 2 }],
    warnings: ["scenedetect_unavailable", "fixed_interval_fallback"],
  },
  frameUnderstandings: [
    {
      shotId: "shot_001",
      provider: "worldclawpro",
      characterSlots: [],
      sceneSlots: [],
      propSlots: [],
      productSlots: [],
      visibleText: [],
      notReusableEntities: [],
      reviewRequired: true,
      reason: "vision_provider_not_configured",
    },
  ],
  ir: reviewRequiredIr,
  dialogue,
  storyboard,
});
const qualityCodes = qualityIssues.map((issue) => issue.code);
assert.ok(qualityCodes.includes("transcript_unavailable"));
assert.ok(qualityCodes.includes("shot_detection_fallback"));
assert.ok(qualityCodes.includes("frame_understanding_unavailable"));
assert.equal(qualityIssues.find((issue) => issue.code === "shot_detection_fallback")?.level, "warning");

const manuallyReviewedIssues = collectAnalysisQualityIssues({
  hasAudio: false,
  transcript: {
    engine: "whisper",
    model: "turbo",
    segments: [],
    warnings: [],
  },
  shotDetection: {
    engine: "scenedetect",
    shots: [{ shotId: "shot_001", startSec: 0, endSec: 2, durationSec: 2 }],
    warnings: [],
  },
  frameUnderstandings: [
    {
      shotId: "shot_001",
      provider: "worldclawpro",
      characterSlots: [],
      sceneSlots: [],
      propSlots: [],
      productSlots: [],
      visibleText: [],
      notReusableEntities: [],
      reviewRequired: true,
      reason: "vision_provider_not_configured",
    },
  ],
  ir,
  dialogue,
  storyboard,
});
assert.ok(!manuallyReviewedIssues.map((issue) => issue.code).includes("frame_understanding_unavailable"));
