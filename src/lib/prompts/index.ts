import type { Locale } from "@/i18n/types";
import { resolveSeedText, type LocaleText } from "./types";
import { eventExtraction } from "./eventExtraction";
import { scriptAssetExtraction } from "./scriptAssetExtraction";
import { videoPromptGeneration } from "./videoPromptGeneration";
import { audioBindPrompt } from "./audioBindPrompt";

export type { LocaleText } from "./types";

export type SeedPromptType = "eventExtraction" | "scriptAssetExtraction" | "videoPromptGeneration" | "audioBindPrompt";

const SEED_PROMPTS: Record<SeedPromptType, LocaleText> = {
  eventExtraction,
  scriptAssetExtraction,
  videoPromptGeneration,
  audioBindPrompt,
};

/** o_prompt.type values that own a seed prompt in this module. */
export const SEED_PROMPT_TYPES: SeedPromptType[] = Object.keys(SEED_PROMPTS) as SeedPromptType[];

/** Resolves the seed text for `type` in `locale`, falling back to zh when the locale is unpopulated. */
export function getSeedPrompt(type: SeedPromptType, locale: Locale): string {
  return resolveSeedText(SEED_PROMPTS[type], locale);
}

/**
 * Every currently-known seed text for `type` across all locales — i.e. the set of values a stored
 * o_prompt.data could still legitimately equal without having been edited by a user. Used by
 * src/lib/migrations/promptSeedSync.ts's guarded update, which also folds in retained legacy seed
 * text that is no longer written anywhere (see that file).
 */
export function getSeedVariants(type: SeedPromptType): string[] {
  const values = Object.values(SEED_PROMPTS[type]).filter((v): v is string => v !== undefined);
  return [...new Set(values)];
}
