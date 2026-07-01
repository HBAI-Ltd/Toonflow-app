import { clearDerivedArtifactsFromDialogue, getTaskBundle, saveDialogueStructure } from "./repository";
import { DialogueLineSchema, DialogueStructureSchema, StructuralIrSchema, type DialogueStructure, type StructuralIr } from "./schemas";
import { evaluateDialogueTiming } from "./dialogueTimingService";

type DialogueLine = ReturnType<typeof DialogueLineSchema.parse>;

export interface DialoguePatch {
  shotId: string;
  editableTemplate?: string;
  variables?: Record<string, string>;
  finalDialogue?: string;
  subtitle?: string;
  cta?: string;
}

const RISK_PATTERNS = [
  { code: "source_person_risk", pattern: /原(人物|人脸)|本人|店员|老板娘|主播本人/ },
  { code: "source_brand_risk", pattern: /原(品牌|logo|LOGO)|品牌名|商标/ },
  { code: "source_store_risk", pattern: /原(门店|店招|招牌)|门店名/ },
  { code: "watermark_risk", pattern: /水印|账号名|抖音号|小红书号/ },
];

function extractVariables(template: string): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const match of template.matchAll(/\{([^{}]+)\}/g)) {
    const key = match[1].trim();
    if (key) variables[key] = "";
  }
  return variables;
}

function fillTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{([^{}]+)\}/g, (_, key: string) => variables[key.trim()] ?? `{${key}}`);
}

function countChars(text: string): number {
  return [...text.replace(/\s+/g, "")].length;
}

function warningsForLine(text: string, durationSec?: number): string[] {
  const warnings: string[] = [...evaluateDialogueTiming(text, durationSec || 0).warnings];
  if (!text.trim()) warnings.push("empty_dialogue");

  if (durationSec && durationSec > 0) {
    const maxChars = Math.max(4, Math.floor(durationSec * 6));
    if (countChars(text) > maxChars) warnings.push(`dialogue_too_long:max_${maxChars}_chars`);
  }

  for (const item of RISK_PATTERNS) {
    if (item.pattern.test(text)) warnings.push(item.code);
  }

  return [...new Set(warnings)];
}

export function buildInitialDialogueStructure(ir: StructuralIr): DialogueStructure {
  return DialogueStructureSchema.parse({
    taskId: ir.taskId,
    version: 1,
    status: "draft",
    lines: ir.shots.map((shot) => {
      const text = shot.editableDialogue || shot.sourceDialogue || "";
      const timing = evaluateDialogueTiming(text, shot.durationSec);
      return {
        shotId: shot.shotId,
        dialogueMode: text ? "source" : "no_dialogue",
        sourceDialogue: shot.sourceDialogue || "",
        dialoguePattern: shot.dialoguePattern || text,
        editableDialogue: text,
        editableTemplate: text,
        variables: extractVariables(text),
        finalDialogue: text,
        subtitle: shot.subtitlePattern || text,
        charCount: timing.charCount,
        estimatedSpeechSec: timing.estimatedSpeechSec,
        targetDurationSec: timing.targetDurationSec,
        fitsDuration: timing.fitsDuration,
        timingStrategy: timing.timingStrategy,
        timingActions: timing.timingActions,
        warnings: warningsForLine(text, shot.durationSec),
      };
    }),
  });
}

export async function updateDialogueStructure(taskId: number, patches: DialoguePatch[]): Promise<DialogueStructure> {
  const bundle = await getTaskBundle(taskId);
  if (!bundle.dialogueStructure?.dataJson) throw new Error("dialogue structure not found");
  if (!bundle.storyIr?.dataJson) throw new Error("story IR not found");

  const current = DialogueStructureSchema.parse(JSON.parse(bundle.dialogueStructure.dataJson));
  const ir = StructuralIrSchema.parse(JSON.parse(bundle.storyIr.dataJson));
  const durationByShot = new Map(ir.shots.map((shot) => [shot.shotId, shot.durationSec]));
  const lineByShot = new Map<string, DialogueLine>(current.lines.map((line) => [line.shotId, { ...line }]));

  for (const patch of patches) {
    const existing = lineByShot.get(patch.shotId);
    if (!existing) throw new Error(`dialogue line not found for shotId: ${patch.shotId}`);

    const editableTemplate = patch.editableTemplate ?? existing.editableTemplate;
    const variables = {
      ...extractVariables(editableTemplate),
      ...existing.variables,
      ...(patch.variables || {}),
    };
    const finalDialogue = patch.finalDialogue ?? fillTemplate(editableTemplate, variables);
    const subtitle = patch.subtitle ?? existing.subtitle ?? finalDialogue;
    const timing = evaluateDialogueTiming(finalDialogue, durationByShot.get(patch.shotId) || existing.targetDurationSec || 0);

    lineByShot.set(patch.shotId, {
      ...existing,
      dialogueMode: "user_edited",
      editableDialogue: finalDialogue,
      editableTemplate,
      variables,
      finalDialogue,
      subtitle,
      cta: patch.cta ?? existing.cta,
      charCount: timing.charCount,
      estimatedSpeechSec: timing.estimatedSpeechSec,
      targetDurationSec: timing.targetDurationSec,
      fitsDuration: timing.fitsDuration,
      timingStrategy: timing.timingStrategy,
      timingActions: timing.timingActions,
      warnings: warningsForLine(`${finalDialogue} ${subtitle || ""}`, durationByShot.get(patch.shotId)),
    });
  }

  const next = DialogueStructureSchema.parse({
    taskId,
    version: (current.version || 1) + 1,
    status: "reviewed",
    lines: current.lines.map((line) => lineByShot.get(line.shotId) || line),
  });

  await clearDerivedArtifactsFromDialogue(taskId);
  await saveDialogueStructure(taskId, next);
  return next;
}
