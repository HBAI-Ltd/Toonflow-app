import { getPromptLanguage } from "@/i18n";
import { getSeedPrompt } from "@/lib/prompts";

// Model-facing: this text is used directly as (part of) the system prompt sent to the AI model
// (see src/utils/cleanNovel.ts), so it must follow prompt_language, not content_language.
export async function getPrompts(type: string) {
  if (type == "event") {
    const promptLocale = await getPromptLanguage();
    return getSeedPrompt("eventExtraction", promptLocale);
  }
}
