import { tool, jsonSchema, Tool } from "ai";
import u from "@/utils";
import { z } from "zod";
import _ from "lodash";
import ResTool from "@/socket/resTool";
import { getScriptAgentPlanData } from "@/utils/scriptAgentPlan";

export const ScriptSchema = z.object({
  name: z.string().describe("剧本名称"),
  content: z.string().describe("剧本内容"),
});
export const planData = z.object({
  storySkeleton: z.string().describe("故事骨架"),
  adaptationStrategy: z.string().describe("改编策略"),
  script: z.string().describe("剧本内容"),
});

export type planData = z.infer<typeof planData>;

const keySchema = z.enum(Object.keys(planData.shape) as [keyof planData, ...Array<keyof planData>]);
const planDataKeyLabels = Object.fromEntries(
  Object.entries(planData.shape).map(([key, schema]) => [key, (schema as z.ZodTypeAny).description ?? key]),
) as Record<keyof planData, string>;

interface ToolConfig {
  resTool: ResTool;
  toolsNames?: string[];
  msg: ReturnType<ResTool["newMessage"]>;
}

const formatNovelLocation = (row: any, fallbackOrder?: number) => {
  const chapterOrder = row.index ?? row.chapterOrder ?? row.chapterIndex ?? fallbackOrder;
  const chapterPart = chapterOrder ? `第${chapterOrder}章${row.chapter ? ` ${row.chapter}` : ""}` : row.chapter || "未编号章节";
  const sectionOrder = Number(row.sectionOrder);
  const sectionPart = Number.isFinite(sectionOrder) && sectionOrder > 0 ? ` 第${sectionOrder}节${row.section ? ` ${row.section}` : ""}` : "";
  return `${chapterPart}${sectionPart}`;
};

export default (toolCpnfig: ToolConfig) => {
  const { resTool, toolsNames, msg } = toolCpnfig;
  const tools: Record<string, Tool> = {
    get_novel_events: tool({
      description: "按章节展示序号获取章节事件",
      inputSchema: jsonSchema<{ chapterIndexs: number[] }>(
        z
          .object({
            chapterIndexs: z.array(z.number()).describe("章节展示序号（chapterOrder，不是数据库导入序号 chapterIndex）"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ chapterIndexs }) => {
        console.log("[tools] get_novel_events", chapterIndexs);
        if (!Array.isArray(chapterIndexs) || chapterIndexs.length === 0) {
          return "参数错误：chapterIndexs 缺失或为空，请传入章节 Order 数组，例如 {\"chapterIndexs\": [1]}";
        }
        const chapterOrders = chapterIndexs.map(Number).filter((i) => Number.isFinite(i));
        if (chapterOrders.length === 0) {
          return "参数错误：chapterIndexs 必须是数字章节 Order 数组，例如 {\"chapterIndexs\": [1]}";
        }
        const thinking = msg.thinking("正在查询章节事件...");
        const data = await u
          .db("o_novel")
          .where("projectId", resTool.data.projectId)
          .where((builder: any) => {
            builder.whereIn("chapterOrder", chapterOrders).orWhere((fallback: any) => {
              fallback.whereNull("chapterOrder").whereIn("chapterIndex", chapterOrders);
            });
          })
          .select(
            "id",
            u.db.raw("COALESCE(chapterOrder, chapterIndex) as `index`"),
            "chapterIndex",
            "chapterOrder",
            "sectionOrder",
            "reel",
            "chapter",
            "section",
            "chapterData",
            "event",
            "eventState",
          )
          .orderByRaw("COALESCE(chapterOrder, chapterIndex, id) asc")
          .orderByRaw("COALESCE(sectionOrder, 0) asc")
          .orderBy("id", "asc");
        thinking.appendText("正在查询章节 Order: " + chapterOrders.join(","));
        const eventString = data
          .map((i: any) => `${formatNovelLocation(i)}，事件:${i.event || "未分析"}`)
          .join("\n");
        thinking.appendText("查询结果:\n" + eventString);
        thinking.updateTitle("查询章节事件完成");
        thinking.complete();
        return eventString || "无数据";
      },
    }),
    get_planData: tool({
      description: "获取工作区数据",
      inputSchema: jsonSchema<{ key: keyof planData }>(
        z
          .object({
            key: keySchema.describe("数据key"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ key }) => {
        console.log("[tools] get_planData", key);
        if (!key || !(key in planData.shape)) {
          return `参数错误：key 缺失或无效，可选值: ${Object.keys(planData.shape).join(", ")}`;
        }
        const thinking = msg.thinking(`正在获取${planDataKeyLabels[key]}工作区数据...`);
        const result = await getScriptAgentPlanData(Number(resTool.data.projectId));
        const value = (result.data as Record<string, any>)[key];
        const text = typeof value === "string" ? value : JSON.stringify(value || [], null, 2);
        thinking.appendText(`获取到${planDataKeyLabels[key]}:\n` + text);
        thinking.updateTitle(`获取${planDataKeyLabels[key]}完成`);
        thinking.complete();
        return text || "无数据";
      },
    }),
    get_novel_text: tool({
      description: "按章节展示序号获取小说章节原始文本内容",
      inputSchema: jsonSchema<{ chapterIndex: string }>(
        z
          .object({
            chapterIndex: z.string().describe("章节展示序号（chapterOrder，不是数据库导入序号 chapterIndex）"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ chapterIndex }) => {
        console.log("[tools] get_novel_text", chapterIndex);
        if (chapterIndex === undefined || chapterIndex === null || chapterIndex === "") {
          return "参数错误：chapterIndex 缺失，请传入章节 Order，例如 {\"chapterIndex\": \"1\"}";
        }
        const chapterOrder = Number(chapterIndex);
        if (!Number.isFinite(chapterOrder)) {
          return "参数错误：chapterIndex 必须是数字章节 Order，例如 {\"chapterIndex\": \"1\"}";
        }
        const thinking = msg.thinking(`正在获取小说章节原文...`);
        const data = await u
          .db("o_novel")
          .where("projectId", resTool.data.projectId)
          .where((builder: any) => {
            builder.where("chapterOrder", chapterOrder).orWhere((fallback: any) => {
              fallback.whereNull("chapterOrder").where("chapterIndex", chapterOrder);
            });
          })
          .select("chapterIndex", "chapterOrder", "sectionOrder", "chapter", "section", "chapterData")
          .orderByRaw("COALESCE(sectionOrder, 0) asc")
          .orderBy("id", "asc");
        const text = data
          .map((i: any) => [formatNovelLocation(i, chapterOrder), i.chapterData || ""].filter(Boolean).join("\n"))
          .join("\n\n");
        thinking.appendText(`获取到原文:\n` + text);
        thinking.updateTitle(`获取小说章节原文完成`);
        thinking.complete();
        return text || "无数据";
      },
    }),
    get_script_content: tool({
      description: "获取剧本本内容",
      inputSchema: jsonSchema<{ ids: string[] }>(
        z
          .object({
            ids: z.array(z.string()).describe("脚本id"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ ids }) => {
        console.log("[tools] get_script_content", ids);
        if (!Array.isArray(ids) || ids.length === 0) {
          return "参数错误：ids 缺失或为空，请传入脚本 id 数组";
        }
        const thinking = msg.thinking(`正在获取脚本内容...`);
        const data = await u.db("o_script").whereIn("id", ids).select("content", "name");
        const text = data && data.length ? data.map((d) => `<scriptItem name="${d.name}">${d.content}</scriptItem>`).join("\n") : "";
        thinking.appendText(`获取到脚本内容:\n` + JSON.stringify(data, null, 2));
        thinking.updateTitle(`获取脚本内容完成`);
        thinking.complete();
        return text || "无数据";
      },
    }),
  };
  return toolsNames ? Object.fromEntries(Object.entries(tools).filter(([n]) => toolsNames.includes(n))) : tools;
};
