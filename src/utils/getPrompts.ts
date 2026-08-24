import { getLocale } from "@/i18n";
import { getSeedPrompt } from "@/lib/prompts";

export async function getPrompts(type: string) {
  if (type == "event") {
    const locale = await getLocale();
    return getSeedPrompt("eventExtraction", locale);
  }
}
