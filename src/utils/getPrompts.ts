import { t, getLocale } from "@/i18n";

export async function getPrompts(type: string) {
  if (type == "event") {
    const locale = await getLocale();
    return t("agent.eventExtraction.systemPrompt", {}, locale);
  }
}
