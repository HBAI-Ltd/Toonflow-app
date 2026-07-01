import { assetSlotKey, normalizeAssetSlot, normalizeBindingSlot } from "./assetSlotNormalizer";
import { isUserRequiredAssetSlot } from "./assetRequirementPolicy";
import {
  PromptPackageSchema,
  type AssetBinding,
  type DialogueStructure,
  type PromptAssetSlot,
  type PromptPackage,
  type PromptPackageIssue,
  type PromptPackageValidationReport,
  type PromptShot,
  type StructuralIr,
} from "./schemas";

type IrShot = StructuralIr["shots"][number];

const DEFAULT_NEGATIVE_PROMPT = "不要出现原视频人物脸、原品牌、原门店招牌、原账号、水印、logo、商标、低清晰度、画面畸变、字幕错位、资产身份不一致";

function formatSec(value: number): string {
  return `${Number(value.toFixed(2))}s`;
}

function slotToken(slotType: string, slotName: string): string {
  return `{${slotType}.${slotName}}`;
}

function dialogueForShot(dialogue: DialogueStructure, shot: IrShot): string {
  const line = dialogue.lines.find((item) => item.shotId === shot.shotId);
  return line?.finalDialogue || line?.subtitle || shot.editableDialogue || shot.sourceDialogue || "无台词";
}

function subtitleForShot(dialogue: DialogueStructure, shot: IrShot): string {
  const line = dialogue.lines.find((item) => item.shotId === shot.shotId);
  return line?.subtitle || line?.finalDialogue || shot.subtitlePattern || shot.sourceDialogue || "无字幕";
}

function referenceFrames(shot: IrShot): string[] {
  return shot.frameSamples
    .map((frame) => frame.filePath)
    .filter((filePath): filePath is string => typeof filePath === "string" && filePath.trim().length > 0);
}

function normalizedBindingsForShot(bindings: AssetBinding[], shotId: string): Array<AssetBinding & { normalizedKey: string; token: string }> {
  return bindings
    .filter((binding) => binding.shotId === shotId)
    .map((binding) => {
      const normalized = normalizeBindingSlot(binding);
      if (!normalized) return null;
      return {
        ...binding,
        normalizedKey: assetSlotKey(normalized.type, normalized.slot),
        token: slotToken(normalized.type, normalized.slot),
      };
    })
    .filter((binding): binding is AssetBinding & { normalizedKey: string; token: string } => Boolean(binding));
}

function promptAssetSlots(shot: IrShot, bindings: AssetBinding[]): PromptAssetSlot[] {
  const bindingsByKey = new Map(normalizedBindingsForShot(bindings, shot.shotId).map((binding) => [binding.normalizedKey, binding]));
  const slots = shot.requiredAssetSlots
    .map((slot) => normalizeAssetSlot(slot))
    .filter((slot): slot is NonNullable<typeof slot> => Boolean(slot));

  return slots.map((slot) => {
    const key = assetSlotKey(slot.type, slot.slot);
    const binding = bindingsByKey.get(key);
    const isBound = binding?.bindingStatus === "bound" && typeof binding.assetId === "number";
    return {
      slotName: slot.slot,
      slotType: slot.type,
      token: slotToken(slot.type, slot.slot),
      required: slot.required && isUserRequiredAssetSlot(slot),
      boundAssetId: isBound ? binding.assetId : null,
      bindingStatus: isBound ? ("bound" as const) : binding?.bindingStatus || "missing",
    };
  });
}

function replaceBoundAssetTokens(text: string, slots: PromptAssetSlot[]): string {
  return slots.reduce((result, slot) => {
    if (!slot.boundAssetId) return result;
    return result.split(slot.token).join(`${slot.token}=资产:${slot.boundAssetId}`);
  }, text);
}

function line(label: string, value: string | number | undefined): string {
  const normalized = value === undefined || value === "" ? "未识别" : String(value);
  return `${label}：${normalized}`;
}

function renderRawPrompt(shot: IrShot, dialogue: DialogueStructure, slots: PromptAssetSlot[]): string {
  const slotText = slots.length ? slots.map((slot) => `${slot.token}${slot.required ? "(必需)" : ""}`).join("，") : "无必需资产槽位";
  const frames = referenceFrames(shot);
  return [
    line("镜头ID", shot.shotId),
    line("来源时间", `${formatSec(shot.startSec)} - ${formatSec(shot.endSec)}`),
    line("时长", formatSec(shot.durationSec)),
    line("镜头目的", shot.shotPurpose),
    line("结构反推", shot.reusableStructure || shot.sourceStructure),
    line("景别", shot.shotSize),
    line("角度", shot.cameraAngle),
    line("构图", shot.composition),
    line("运镜", shot.cameraMotion || "直接切换"),
    line("角色/主体动作", slots.find((slot) => slot.slotType === "role")?.token ? `${slots.find((slot) => slot.slotType === "role")?.token} 按源视频节奏完成对应动作和口播` : "按源视频主体动作节奏执行"),
    line("场景", slots.filter((slot) => slot.slotType === "scene").map((slot) => slot.token).join("，") || "沿用结构化场景槽位"),
    line("道具/产品", slots.filter((slot) => slot.slotType === "prop" || slot.slotType === "product").map((slot) => slot.token).join("，") || "无明确道具/产品槽位"),
    line("台词", dialogueForShot(dialogue, shot)),
    line("字幕", subtitleForShot(dialogue, shot)),
    line("音效", shot.sound || "环境声"),
    line("转场", shot.transition || "直接切换"),
    line("资产槽位", slotText),
    line("证据帧", frames.join("，") || "缺少证据帧"),
    line("禁止", "不要出现原视频人物脸、原品牌、原门店招牌、原账号、水印、logo、商标或私人身份信息"),
  ].join("\n");
}

function renderNegativePrompt(shot: IrShot): string {
  const mustReplace = shot.mustReplace.length ? `，必须替换：${shot.mustReplace.join("，")}` : "";
  return `${DEFAULT_NEGATIVE_PROMPT}${mustReplace}`;
}

function validatePromptShot(shot: PromptShot): PromptPackageIssue[] {
  const issues: PromptPackageIssue[] = [];
  if (!shot.referenceFrames.length) {
    issues.push({
      level: "warning",
      code: "prompt_missing_reference_frames",
      message: "镜头提示词缺少证据帧，生成时构图稳定性会降低。",
      shotId: shot.shotId,
    });
  }

  const missingSlots = shot.assetSlots.filter((slot) => slot.required && slot.bindingStatus !== "bound");
  if (missingSlots.length) {
    issues.push({
      level: "blocker",
      code: "prompt_required_assets_unbound",
      message: `镜头还有必需资产槽位未绑定：${missingSlots.map((slot) => `${slot.slotType}:${slot.slotName}`).join("，")}`,
      shotId: shot.shotId,
    });
  }

  if (!shot.rawPrompt.includes("来源时间") || !shot.rawPrompt.includes("禁止")) {
    issues.push({
      level: "blocker",
      code: "prompt_missing_evidence_or_safety_clause",
      message: "镜头提示词缺少来源时间或禁止项。",
      shotId: shot.shotId,
    });
  }

  return issues;
}

function markdownReport(issues: PromptPackageIssue[]): string {
  if (!issues.length) return "# 反推提示词包校验报告\n\n结论：通过";
  const status = issues.some((issue) => issue.level === "blocker") ? "阻塞" : "通过，有警告";
  return ["# 反推提示词包校验报告", "", `结论：${status}`, "", ...issues.map((issue) => `- [${issue.level}] ${issue.code}${issue.shotId ? ` (${issue.shotId})` : ""}: ${issue.message}`)].join("\n");
}

function validationReport(shots: PromptShot[]): PromptPackageValidationReport {
  const issues = shots.flatMap(validatePromptShot);
  return {
    status: issues.some((issue) => issue.level === "blocker") ? "blocked" : "pass",
    issues,
    markdown: markdownReport(issues),
  };
}

export function generatePromptPackage(args: {
  taskId: number;
  version: number;
  ir: StructuralIr;
  dialogue: DialogueStructure;
  bindings: AssetBinding[];
}): PromptPackage {
  const promptShots = args.ir.shots
    .filter((shot) => shot.enabled)
    .map((shot) => {
      const assetSlots = promptAssetSlots(shot, args.bindings);
      const rawPrompt = renderRawPrompt(shot, args.dialogue, assetSlots);
      const resolvedPrompt = replaceBoundAssetTokens(rawPrompt, assetSlots);
      const negativePrompt = renderNegativePrompt(shot);
      const issues = validatePromptShot({
        shotId: shot.shotId,
        sourceTimeRange: { startSec: shot.startSec, endSec: shot.endSec },
        durationSec: shot.durationSec,
        rawPrompt,
        resolvedPrompt,
        negativePrompt,
        referenceFrames: referenceFrames(shot),
        assetSlots,
        warnings: [],
        validationStatus: "pass",
      });

      return {
        shotId: shot.shotId,
        sourceTimeRange: { startSec: shot.startSec, endSec: shot.endSec },
        durationSec: Number(shot.durationSec.toFixed(2)),
        rawPrompt,
        resolvedPrompt,
        negativePrompt,
        referenceFrames: referenceFrames(shot),
        assetSlots,
        warnings: issues.filter((issue) => issue.level !== "blocker").map((issue) => issue.code),
        validationStatus: issues.some((issue) => issue.level === "blocker") ? ("blocked" as const) : ("pass" as const),
      };
    });

  const report = validationReport(promptShots);
  return PromptPackageSchema.parse({
    taskId: args.taskId,
    version: args.version,
    shots: promptShots,
    finalVideoPrompt: promptShots.map((shot, index) => `# 镜头 ${String(index + 1).padStart(2, "0")}\n${shot.resolvedPrompt}`).join("\n\n"),
    finalNegativePrompt: DEFAULT_NEGATIVE_PROMPT,
    storyboardPromptMap: Object.fromEntries(
      promptShots.map((shot) => [
        shot.shotId,
        {
          rawPrompt: shot.rawPrompt,
          resolvedPrompt: shot.resolvedPrompt,
          negativePrompt: shot.negativePrompt,
        },
      ]),
    ),
    validationReport: report,
  });
}
