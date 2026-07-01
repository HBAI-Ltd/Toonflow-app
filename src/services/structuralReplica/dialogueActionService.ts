import {
  clearDerivedArtifactsFromDialogue,
  getTaskBundle,
  saveDialogueStructure,
  saveStoryIr,
} from "./repository";
import { DialogueStructureSchema, StructuralIrSchema, type DialogueStructure, type StructuralIr } from "./schemas";
import { compressDialogueText, evaluateDialogueTiming } from "./dialogueTimingService";

export type DialogueActionType =
  | "compress_dialogue"
  | "split_shot"
  | "extend_shot"
  | "mark_no_dialogue"
  | "sync_subtitle_from_dialogue";

export interface DialogueActionInput {
  taskId: number;
  shotId: string;
  action: DialogueActionType;
  value?: string | number | null;
}

function splitText(text: string): [string, string] {
  const chars = [...text.trim()];
  if (chars.length <= 1) return [text.trim(), ""];
  const midpoint = Math.ceil(chars.length / 2);
  const punctuationIndex = chars.findIndex((char, index) => index >= midpoint - 4 && index <= midpoint + 6 && /[，。,.!！?？、;；]/.test(char));
  const splitAt = punctuationIndex > 0 ? punctuationIndex + 1 : midpoint;
  return [chars.slice(0, splitAt).join("").trim(), chars.slice(splitAt).join("").trim()];
}

function nextSplitShotId(ir: StructuralIr, shotId: string): string {
  let index = 2;
  let candidate = `${shotId}_b`;
  const existing = new Set(ir.shots.map((shot) => shot.shotId));
  while (existing.has(candidate)) {
    candidate = `${shotId}_b${index}`;
    index += 1;
  }
  return candidate;
}

function applyTiming(line: DialogueStructure["lines"][number], targetDurationSec: number): DialogueStructure["lines"][number] {
  const timing = evaluateDialogueTiming(line.finalDialogue, targetDurationSec);
  return {
    ...line,
    charCount: timing.charCount,
    estimatedSpeechSec: timing.estimatedSpeechSec,
    targetDurationSec: timing.targetDurationSec,
    fitsDuration: timing.fitsDuration,
    timingStrategy: timing.timingStrategy,
    timingActions: timing.timingActions,
    warnings: [...new Set([...(line.warnings || []).filter((warning) => !warning.startsWith("dialogue_too_long")), ...timing.warnings])],
  };
}

function replaceAt<T>(items: T[], index: number, item: T): T[] {
  return items.map((current, currentIndex) => (currentIndex === index ? item : current));
}

export async function applyDialogueAction(input: DialogueActionInput) {
  const bundle = await getTaskBundle(input.taskId);
  if (!bundle.dialogueStructure?.dataJson) throw new Error("dialogue structure not found");
  if (!bundle.storyIr?.dataJson) throw new Error("story IR not found");

  const ir = StructuralIrSchema.parse(JSON.parse(bundle.storyIr.dataJson));
  const dialogue = DialogueStructureSchema.parse(JSON.parse(bundle.dialogueStructure.dataJson));
  const shotIndex = ir.shots.findIndex((shot) => shot.shotId === input.shotId);
  const lineIndex = dialogue.lines.findIndex((line) => line.shotId === input.shotId);
  if (shotIndex < 0) throw new Error(`shot not found: ${input.shotId}`);
  if (lineIndex < 0) throw new Error(`dialogue line not found: ${input.shotId}`);

  const shot = ir.shots[shotIndex];
  const line = dialogue.lines[lineIndex];
  let nextIr = ir;
  let nextDialogue = dialogue;
  let result: Record<string, unknown> = {};

  if (input.action === "compress_dialogue") {
    const finalDialogue = compressDialogueText(line.finalDialogue, shot.durationSec);
    const nextLine = applyTiming(
      {
        ...line,
        dialogueMode: "compressed",
        editableDialogue: finalDialogue,
        editableTemplate: finalDialogue,
        finalDialogue,
        subtitle: finalDialogue,
      },
      shot.durationSec,
    );
    nextDialogue = { ...dialogue, version: dialogue.version + 1, status: "reviewed", lines: replaceAt(dialogue.lines, lineIndex, nextLine) };
    result = { finalDialogue };
  } else if (input.action === "extend_shot") {
    const targetDurationSec = Math.max(shot.durationSec, Number(input.value) || line.estimatedSpeechSec || shot.durationSec + 1);
    const nextShot = { ...shot, endSec: shot.startSec + targetDurationSec, durationSec: targetDurationSec };
    const nextLine = applyTiming({ ...line, dialogueMode: "extended" }, targetDurationSec);
    nextIr = { ...ir, shots: replaceAt(ir.shots, shotIndex, nextShot) };
    nextDialogue = { ...dialogue, version: dialogue.version + 1, status: "reviewed", lines: replaceAt(dialogue.lines, lineIndex, nextLine) };
    result = { targetDurationSec };
  } else if (input.action === "mark_no_dialogue") {
    const nextLine = applyTiming(
      {
        ...line,
        dialogueMode: "no_dialogue",
        editableDialogue: "",
        editableTemplate: "",
        finalDialogue: "",
        subtitle: "",
      },
      shot.durationSec,
    );
    nextDialogue = { ...dialogue, version: dialogue.version + 1, status: "reviewed", lines: replaceAt(dialogue.lines, lineIndex, nextLine) };
    result = { finalDialogue: "" };
  } else if (input.action === "sync_subtitle_from_dialogue") {
    const nextLine = applyTiming({ ...line, subtitle: line.finalDialogue }, shot.durationSec);
    nextDialogue = { ...dialogue, version: dialogue.version + 1, status: "reviewed", lines: replaceAt(dialogue.lines, lineIndex, nextLine) };
    result = { subtitle: line.finalDialogue };
  } else if (input.action === "split_shot") {
    const [firstText, secondText] = splitText(line.finalDialogue);
    const secondShotId = nextSplitShotId(ir, input.shotId);
    const halfDuration = Math.max(0.5, Number((shot.durationSec / 2).toFixed(2)));
    const firstShot = {
      ...shot,
      endSec: Number((shot.startSec + halfDuration).toFixed(2)),
      durationSec: halfDuration,
      editableDialogue: firstText,
      subtitlePattern: firstText,
    };
    const secondShot = {
      ...shot,
      shotId: secondShotId,
      startSec: firstShot.endSec,
      durationSec: Math.max(0.5, Number((shot.durationSec - halfDuration).toFixed(2))),
      endSec: shot.endSec,
      sourceDialogue: secondText,
      dialoguePattern: secondText,
      editableDialogue: secondText,
      subtitlePattern: secondText,
      shotPurpose: `${shot.shotPurpose || "split shot"} (continued)`,
    };
    const firstLine = applyTiming(
      {
        ...line,
        dialogueMode: "split",
        editableDialogue: firstText,
        editableTemplate: firstText,
        finalDialogue: firstText,
        subtitle: firstText,
      },
      firstShot.durationSec,
    );
    const secondLine = applyTiming(
      {
        ...line,
        shotId: secondShotId,
        dialogueMode: "split",
        sourceDialogue: secondText,
        dialoguePattern: secondText,
        editableDialogue: secondText,
        editableTemplate: secondText,
        variables: {},
        finalDialogue: secondText,
        subtitle: secondText,
      },
      secondShot.durationSec,
    );
    nextIr = { ...ir, shots: [...ir.shots.slice(0, shotIndex), firstShot, secondShot, ...ir.shots.slice(shotIndex + 1)] };
    nextDialogue = {
      ...dialogue,
      version: dialogue.version + 1,
      status: "reviewed",
      lines: [...dialogue.lines.slice(0, lineIndex), firstLine, secondLine, ...dialogue.lines.slice(lineIndex + 1)],
    };
    result = { splitShotId: secondShotId, firstDialogue: firstText, secondDialogue: secondText };
  }

  await clearDerivedArtifactsFromDialogue(input.taskId);
  if (nextIr !== ir) await saveStoryIr(input.taskId, StructuralIrSchema.parse(nextIr));
  await saveDialogueStructure(input.taskId, DialogueStructureSchema.parse(nextDialogue));
  return { taskId: input.taskId, shotId: input.shotId, action: input.action, ...result, dialogueStructure: nextDialogue, storyIr: nextIr };
}
