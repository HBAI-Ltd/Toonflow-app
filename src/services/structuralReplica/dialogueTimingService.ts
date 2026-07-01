import type { StructuralIr } from "./schemas";

export type DialogueTimingAction = "compress_dialogue" | "split_shot" | "extend_shot" | "mark_no_dialogue" | "sync_subtitle_from_dialogue";

export interface DialogueTimingResult {
  charCount: number;
  estimatedSpeechSec: number;
  targetDurationSec: number;
  fitsDuration: boolean;
  timingStrategy: "fit" | "compress_dialogue" | "split_shot" | "extend_shot" | "no_dialogue";
  timingActions: DialogueTimingAction[];
  warnings: string[];
}

export function countDialogueChars(text: string): number {
  return [...text.replace(/\s+/g, "")].length;
}

export function estimateSpeechSec(text: string): number {
  const charCount = countDialogueChars(text);
  if (!charCount) return 0;
  const asciiWordCount = (text.match(/[A-Za-z0-9]+/g) || []).length;
  const cjkCount = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const mixedUnits = cjkCount + asciiWordCount * 1.6 + Math.max(0, charCount - cjkCount) * 0.4;
  return Number((mixedUnits / 5.2).toFixed(2));
}

export function evaluateDialogueTiming(text: string, targetDurationSec: number): DialogueTimingResult {
  const finalText = text.trim();
  const charCount = countDialogueChars(finalText);
  const estimatedSpeechSec = estimateSpeechSec(finalText);
  const safeTarget = Math.max(0, Number(targetDurationSec) || 0);
  if (!finalText) {
    return {
      charCount,
      estimatedSpeechSec,
      targetDurationSec: safeTarget,
      fitsDuration: true,
      timingStrategy: "no_dialogue",
      timingActions: ["mark_no_dialogue"],
      warnings: ["empty_dialogue"],
    };
  }

  const fitsDuration = !safeTarget || estimatedSpeechSec <= safeTarget * 1.08;
  const timingActions: DialogueTimingAction[] = ["sync_subtitle_from_dialogue"];
  let timingStrategy: DialogueTimingResult["timingStrategy"] = "fit";
  const warnings: string[] = [];
  if (!fitsDuration) {
    warnings.push(`dialogue_too_long:${estimatedSpeechSec}s>${safeTarget}s`);
    if (estimatedSpeechSec > safeTarget * 1.8) {
      timingStrategy = "split_shot";
      timingActions.unshift("split_shot");
    } else if (estimatedSpeechSec > safeTarget * 1.25) {
      timingStrategy = "compress_dialogue";
      timingActions.unshift("compress_dialogue");
    } else {
      timingStrategy = "extend_shot";
      timingActions.unshift("extend_shot");
    }
  }

  return { charCount, estimatedSpeechSec, targetDurationSec: safeTarget, fitsDuration, timingStrategy, timingActions, warnings };
}

export function durationByShot(ir: StructuralIr): Map<string, number> {
  return new Map(ir.shots.map((shot) => [shot.shotId, shot.durationSec]));
}

export function compressDialogueText(text: string, targetDurationSec: number): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  const maxChars = Math.max(4, Math.floor(targetDurationSec * 5.2));
  if (countDialogueChars(trimmed) <= maxChars) return trimmed;
  const chars = [...trimmed];
  if (chars.length <= maxChars) return trimmed;
  return chars.slice(0, Math.max(1, maxChars - 1)).join("").replace(/[，。,.!！?？、;；：:]$/, "") + "…";
}
