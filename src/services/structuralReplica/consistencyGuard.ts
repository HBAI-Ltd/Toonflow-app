import u from "@/utils";
import { getTaskBundle, saveConsistencyReport } from "./repository";
import {
  AssetBindingSchema,
  ConsistencyReportSchema,
  DialogueStructureSchema,
  FrameUnderstandingSchema,
  PromptPackageSchema,
  RegeneratedStoryboardSchema,
  ShotDetectionSchema,
  StructuralIrSchema,
  TranscriptSchema,
  type AssetBinding,
  type ConsistencyReport,
  type ConsistencyIssue,
  type DialogueStructure,
  type FrameUnderstanding,
  type RegeneratedStoryboard,
  type ShotDetection,
  type StructuralIr,
  type Transcript,
} from "./schemas";
import { associatedAssetIds, missingRequiredBindings } from "./videoDescRenderer";
import { isUserRequiredAssetSlot } from "./assetRequirementPolicy";

const RISK_PATTERN = /原(视频|人物|人脸|脸|品牌|门店|店招|账号)|水印|logo|LOGO|商标|账号名|抖音号|小红书号/;
const SAFETY_INSTRUCTION_PATTERN =
  /禁止|不要出现|不得出现|避免出现|避免使用|不能出现|不包含|必须替换|替换所有|替换原(视频|人物|人脸|脸|品牌|门店|店招|账号)|移除|去除|需更换|更换为|替代演员|替换演员|不复刻|不保留|无品牌标识|无商标|must not include|do not include|do not copy|replace all|remove/iu;

function mapSlotToAssetType(slotType: string): string {
  if (slotType === "role") return "role";
  if (slotType === "scene") return "scene";
  if (slotType === "voice" || slotType === "audio") return "audio";
  return "tool";
}

function charCount(text: string): number {
  return [...text.replace(/\s+/g, "")].length;
}

export function stripSourceSafetyClauses(text: string): string {
  return text
    .split(/[\r\n|。；;]+/)
    .filter((clause) => {
      const normalized = clause.trim();
      return !(RISK_PATTERN.test(normalized) && SAFETY_INSTRUCTION_PATTERN.test(normalized));
    })
    .join(" ");
}

export function hasSourceEntityRisk(text: string): boolean {
  return RISK_PATTERN.test(stripSourceSafetyClauses(text));
}

function markdown(issues: ConsistencyIssue[]): string {
  if (!issues.length) return "# Structural Replica Consistency Report\n\nNo issues.";
  return ["# Structural Replica Consistency Report", "", ...issues.map((issue) => `- [${issue.level}] ${issue.code}${issue.shotId ? ` (${issue.shotId})` : ""}: ${issue.message}`)].join("\n");
}

function parseJson(raw: string | null | undefined): unknown {
  if (!raw) return undefined;
  return JSON.parse(raw);
}

function warningsInclude(warnings: string[] | undefined, fragments: string[]): boolean {
  const normalized = (warnings || []).map((warning) => warning.toLowerCase());
  return fragments.some((fragment) => normalized.some((warning) => warning.includes(fragment.toLowerCase())));
}

function parseFrameUnderstandingRows(rows: Array<{ dataJson?: string | null }>): FrameUnderstanding[] {
  return rows
    .map((row) => {
      if (!row.dataJson) return null;
      return FrameUnderstandingSchema.parse(JSON.parse(row.dataJson));
    })
    .filter((item): item is FrameUnderstanding => Boolean(item));
}

function manuallyReviewedShotIds(ir: StructuralIr): Set<string> {
  return new Set(ir.shots.filter((shot) => shot.enabled && !shot.reviewRequired).map((shot) => shot.shotId));
}

export function collectAnalysisQualityIssues(args: {
  hasAudio: boolean;
  transcript?: Transcript | null;
  shotDetection?: ShotDetection | null;
  frameUnderstandings: FrameUnderstanding[];
  ir: StructuralIr;
  dialogue: DialogueStructure;
  storyboard: RegeneratedStoryboard;
}): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const enabledShots = args.ir.shots.filter((shot) => shot.enabled);
  const reviewedShotIds = manuallyReviewedShotIds(args.ir);
  const transcriptWarnings = args.transcript?.warnings || [];
  const shotWarnings = args.shotDetection?.warnings || [];

  if (args.hasAudio && warningsInclude(transcriptWarnings, ["openai-whisper is not installed", "import_error", "skipped"])) {
    issues.push({
      level: "blocker",
      code: "transcript_unavailable",
      message: "Source has audio but ASR was skipped or unavailable; dialogue structure is incomplete.",
    });
  }

  if (warningsInclude(shotWarnings, ["scenedetect_unavailable", "fixed_interval_fallback"])) {
    issues.push({
      level: "warning",
      code: "shot_detection_fallback",
      message: "Shot detection used fixed-interval fallback instead of real scene detection.",
    });
  }

  if (enabledShots.length && !args.frameUnderstandings.length) {
    issues.push({
      level: "blocker",
      code: "frame_understanding_missing",
      message: "Frame understanding results are missing for the enabled shots.",
    });
  }

  const unavailableUnderstanding = args.frameUnderstandings.filter((item) => {
    const reason = item.reason || "";
    return (
      item.reviewRequired &&
      !reviewedShotIds.has(item.shotId) &&
      (reason === "vision_provider_not_configured" ||
        reason === "frame_samples_not_found" ||
        reason === "vision_understanding_failed" ||
        reason.startsWith("vision_request_failed_"))
    );
  });
  if (enabledShots.length && unavailableUnderstanding.length > 0) {
    issues.push({
      level: "blocker",
      code: "frame_understanding_unavailable",
      message: "Some enabled shots still need manual review because vision understanding was unavailable.",
    });
  }

  const visualSummaryCount = args.frameUnderstandings.filter((item) => item.visualSummary?.trim()).length;
  const allEnabledShotsReviewed = enabledShots.every((shot) => reviewedShotIds.has(shot.shotId));
  if (enabledShots.length && args.frameUnderstandings.length >= enabledShots.length && visualSummaryCount === 0 && !allEnabledShotsReviewed) {
    issues.push({
      level: "warning",
      code: "frame_understanding_placeholder",
      message: "Frame understanding produced no visual summaries; storyboard content may be generic.",
    });
  }

  const emptyDialogueCount = args.dialogue.lines.filter((line) => line.warnings.includes("empty_dialogue") || (!line.finalDialogue.trim() && !line.subtitle?.trim())).length;
  if (args.hasAudio && enabledShots.length && emptyDialogueCount >= enabledShots.length && (args.transcript?.segments.length || 0) === 0) {
    issues.push({
      level: "warning",
      code: "dialogue_all_empty",
      message: "All dialogue lines are empty while the source has audio.",
    });
  }

  const placeholderRows = args.storyboard.rows.filter((row) => /No dialogue|unspecified shot size|no bound assets|无台词|未指定景别|没有已绑定资产/i.test(row.videoDesc)).length;
  if (args.storyboard.rows.length && placeholderRows >= args.storyboard.rows.length && visualSummaryCount === 0) {
    issues.push({
      level: "warning",
      code: "storyboard_placeholder_content",
      message: "Storyboard rows are mostly placeholder descriptions rather than analyzed source structure.",
    });
  }

  return issues;
}

export async function checkConsistency(taskId: number): Promise<ConsistencyReport> {
  const bundle = await getTaskBundle(taskId);
  if (!bundle.storyIr?.dataJson) throw new Error("story IR not found");
  if (!bundle.dialogueStructure?.dataJson) throw new Error("dialogue structure not found");
  if (!bundle.regeneratedStoryboard?.dataJson) throw new Error("regenerated storyboard not found");

  const ir = StructuralIrSchema.parse(JSON.parse(bundle.storyIr.dataJson));
  const dialogue = DialogueStructureSchema.parse(JSON.parse(bundle.dialogueStructure.dataJson));
  const storyboard = RegeneratedStoryboardSchema.parse(JSON.parse(bundle.regeneratedStoryboard.dataJson));
  const promptPackage = storyboard.promptPackage ? PromptPackageSchema.parse(storyboard.promptPackage) : null;
  const transcript = bundle.transcript?.dataJson ? TranscriptSchema.parse(parseJson(bundle.transcript.dataJson)) : null;
  const shotDetection = bundle.shotDetection?.dataJson ? ShotDetectionSchema.parse(parseJson(bundle.shotDetection.dataJson)) : null;
  const frameUnderstandings = parseFrameUnderstandingRows(bundle.frameUnderstanding);
  const dialogueByShot = new Map(dialogue.lines.map((line) => [line.shotId, line]));
  const rowByShot = new Map(storyboard.rows.map((row) => [row.shotId, row]));
  const bindings: AssetBinding[] = bundle.bindings.map((binding) =>
    AssetBindingSchema.parse({
      taskId,
      shotId: binding.shotId,
      slotName: binding.slotName,
      slotType: binding.slotType,
      assetId: binding.assetId ?? null,
      bindingStatus: binding.bindingStatus,
      note: binding.note ?? null,
    }),
  );
  const issues: ConsistencyIssue[] = collectAnalysisQualityIssues({
    hasAudio: bundle.sourceMedia?.hasAudio === 1,
    transcript,
    shotDetection,
    frameUnderstandings,
    ir,
    dialogue,
    storyboard,
  });

  if (!promptPackage) {
    issues.push({
      level: "blocker",
      code: "prompt_package_missing",
      message: "Regenerated storyboard is missing the reverse prompt package.",
    });
  } else {
    for (const issue of promptPackage.validationReport.issues) {
      issues.push({
        level: issue.level,
        code: issue.code,
        message: issue.message,
        shotId: issue.shotId,
      });
    }
  }

  for (const shot of ir.shots.filter((item) => item.enabled)) {
    const missing = missingRequiredBindings(shot, bindings);
    for (const item of missing) {
      issues.push({
        level: "blocker",
        code: "required_slot_missing",
        message: `Required slot is not bound: ${item}`,
        shotId: shot.shotId,
      });
    }

    const assetIds = associatedAssetIds(shot, bindings);
    const hasUserRequiredSlots = shot.requiredAssetSlots.some((slot) => isUserRequiredAssetSlot(slot));
    if (!assetIds.length && hasUserRequiredSlots) {
      issues.push({
        level: "blocker",
        code: "shot_has_no_assets",
        message: "Shot has required slots but no associated assets.",
        shotId: shot.shotId,
      });
    }

    const line = dialogueByShot.get(shot.shotId);
    if (line && charCount(line.finalDialogue) > Math.max(4, Math.floor(shot.durationSec * 6))) {
      issues.push({
        level: "warning",
        code: "dialogue_too_long",
        message: "Dialogue may exceed the shot duration.",
        shotId: shot.shotId,
      });
    }

    const combinedText = `${line?.finalDialogue || ""} ${line?.subtitle || ""} ${rowByShot.get(shot.shotId)?.videoDesc || ""}`;
    if (hasSourceEntityRisk(combinedText)) {
      issues.push({
        level: "blocker",
        code: "source_entity_risk",
        message: "Text appears to retain original person, brand, store, or watermark references.",
        shotId: shot.shotId,
      });
    }
  }

  for (const binding of bindings.filter((item) => item.bindingStatus === "bound" && item.assetId)) {
    const asset = await u.db("o_assets").where("id", binding.assetId).first();
    if (!asset) {
      issues.push({
        level: "blocker",
        code: "bound_asset_not_found",
        message: `Bound asset not found: ${binding.assetId}`,
        shotId: binding.shotId,
      });
      continue;
    }
    const expectedType = mapSlotToAssetType(binding.slotType);
    if (asset.type !== expectedType) {
      issues.push({
        level: "blocker",
        code: "asset_type_mismatch",
        message: `Expected ${expectedType}, got ${asset.type}.`,
        shotId: binding.shotId,
      });
    }
  }

  const report = ConsistencyReportSchema.parse({
    taskId,
    status: issues.some((issue) => issue.level === "blocker") ? "blocked" : "pass",
    issues,
    markdown: markdown(issues),
  });
  await saveConsistencyReport(taskId, report);
  return report;
}
