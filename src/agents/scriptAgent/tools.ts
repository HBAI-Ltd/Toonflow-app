import { tool, jsonSchema, Tool } from "ai";
import u from "@/utils";
import { z } from "zod";
import _ from "lodash";
import ResTool from "@/socket/resTool";
import { t, type Locale } from "@/i18n";

// i18n-ignore — module-level zod schema, built once at import time (no request/locale in scope).
// Not sent to the model (never passed through .toJSONSchema()) and not read anywhere at runtime;
// exported for module's public API. The runtime-facing, locale-aware labels built from planData's
// shape live under the agent.script.tools.planData.* catalog keys below instead.
export const ScriptSchema = z.object({
  name: z.string().describe("剧本名称"), // i18n-ignore — dead schema metadata, see note above
  content: z.string().describe("剧本内容"), // i18n-ignore — dead schema metadata, see note above
});
export const planData = z.object({
  storySkeleton: z.string().describe("故事骨架"), // i18n-ignore — dead schema metadata, see note above
  adaptationStrategy: z.string().describe("改编策略"), // i18n-ignore — dead schema metadata, see note above
  script: z.string().describe("剧本内容"), // i18n-ignore — dead schema metadata, see note above
});

export type planData = z.infer<typeof planData>;

const keySchema = z.enum(Object.keys(planData.shape) as [keyof planData, ...Array<keyof planData>]);
// Locale-aware labels for the planData keys, used in user-visible "thinking" text below.
// Deliberately NOT derived from planData's .description (see note above) so they can be
// resolved per-request via the `locale` passed into this factory.
const planDataKeyI18nKeys: Record<keyof planData, string> = {
  storySkeleton: "agent.script.tools.planData.storySkeleton",
  adaptationStrategy: "agent.script.tools.planData.adaptationStrategy",
  script: "agent.script.tools.planData.script",
};

interface ToolConfig {
  resTool: ResTool;
  toolsNames?: string[];
  msg: ReturnType<ResTool["newMessage"]>;
  locale: Locale;
}

export default (toolCpnfig: ToolConfig) => {
  const { resTool, toolsNames, msg, locale } = toolCpnfig;
  const { socket } = resTool;
  const tools: Record<string, Tool> = {
    get_novel_events: tool({
      description: t("agent.script.tools.getNovelEvents.describe", {}, locale),
      inputSchema: jsonSchema<{ chapterIndexs: number[] }>(
        z
          .object({
            chapterIndexs: z.array(z.number()).describe(t("agent.script.tools.getNovelEvents.chapterIndexsDescribe", {}, locale)),
          })
          .toJSONSchema(),
      ),
      execute: async ({ chapterIndexs }) => {
        console.log("[tools] get_novel_events", chapterIndexs);
        const thinking = msg.thinking(t("agent.script.tools.getNovelEvents.querying", {}, locale));
        const data = await u
          .db("o_novel")
          .where("projectId", resTool.data.projectId)
          .select("id", "chapterIndex as index", "reel", "chapter", "chapterData", "event", "eventState")
          .whereIn("chapterIndex", chapterIndexs);
        thinking.appendText(t("agent.script.tools.getNovelEvents.queryingChapters", { chapters: chapterIndexs.join(",") }, locale));
        const eventString = data
          .map((i: any) => [t("agent.script.tools.getNovelEvents.eventLine", { index: i.index, chapter: i.chapter, event: i.event }, locale)].join("\n"))
          .join("\n");
        thinking.appendText(t("agent.script.tools.getNovelEvents.result", { data: eventString }, locale));
        thinking.updateTitle(t("agent.script.tools.getNovelEvents.done", {}, locale));
        thinking.complete();
        return eventString ?? t("agent.script.tools.noData", {}, locale);
      },
    }),
    get_planData: tool({
      description: t("agent.script.tools.getPlanData.describe", {}, locale),
      inputSchema: jsonSchema<{ key: keyof planData }>(
        z
          .object({
            key: keySchema.describe(t("agent.script.tools.getPlanData.keyDescribe", {}, locale)),
          })
          .toJSONSchema(),
      ),
      execute: async ({ key }) => {
        console.log("[tools] get_planData", key);
        const label = t(planDataKeyI18nKeys[key], {}, locale);
        const thinking = msg.thinking(t("agent.script.tools.getPlanData.fetching", { label }, locale));
        const planData: planData = await new Promise((resolve) => socket.emit("getPlanData", { key }, (res: any) => resolve(res)));
        thinking.appendText(t("agent.script.tools.getPlanData.fetched", { label, data: planData[key] }, locale));
        thinking.updateTitle(t("agent.script.tools.getPlanData.done", { label }, locale));
        thinking.complete();
        return planData[key] ?? t("agent.script.tools.noData", {}, locale);
      },
    }),
    get_novel_text: tool({
      description: t("agent.script.tools.getNovelText.describe", {}, locale),
      inputSchema: jsonSchema<{ chapterIndex: string }>(
        z
          .object({
            chapterIndex: z.string().describe(t("agent.script.tools.getNovelText.chapterIndexDescribe", {}, locale)),
          })
          .toJSONSchema(),
      ),
      execute: async ({ chapterIndex }) => {
        console.log("[tools] get_novel_text", "[tools] get_novel_text", chapterIndex);
        const thinking = msg.thinking(t("agent.script.tools.getNovelText.fetching", {}, locale));
        const data = await u.db("o_novel").where("projectId", resTool.data.projectId).where({ chapterIndex }).select("chapterData").first();
        const text = data && data?.chapterData ? data.chapterData : "";
        thinking.appendText(t("agent.script.tools.getNovelText.fetched", { text }, locale));
        thinking.updateTitle(t("agent.script.tools.getNovelText.done", {}, locale));
        thinking.complete();
        return text ?? t("agent.script.tools.noData", {}, locale);
      },
    }),
    get_script_content: tool({
      description: t("agent.script.tools.getScriptContent.describe", {}, locale),
      inputSchema: jsonSchema<{ ids: string[] }>(
        z
          .object({
            ids: z.array(z.string()).describe(t("agent.script.tools.getScriptContent.idsDescribe", {}, locale)),
          })
          .toJSONSchema(),
      ),
      execute: async ({ ids }) => {
        console.log("[tools] get_script_content", "[tools] get_script_content", ids);
        const thinking = msg.thinking(t("agent.script.tools.getScriptContent.fetching", {}, locale));
        const data = await u.db("o_script").whereIn("id", ids).select("content", "name");
        const text = data && data.length ? data.map((d) => `<scriptItem name="${d.name}">${d.content}</scriptItem>`).join("\n") : "";
        thinking.appendText(t("agent.script.tools.getScriptContent.fetched", { data: JSON.stringify(data, null, 2) }, locale));
        thinking.updateTitle(t("agent.script.tools.getScriptContent.done", {}, locale));
        thinking.complete();
        return text ?? t("agent.script.tools.noData", {}, locale);
      },
    }),
  };
  return toolsNames ? Object.fromEntries(Object.entries(tools).filter(([n]) => toolsNames.includes(n))) : tools;
};
