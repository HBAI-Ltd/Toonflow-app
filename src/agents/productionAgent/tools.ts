import { tool, jsonSchema, Tool } from "ai";
import { z } from "zod";
import _ from "lodash";
import ResTool from "@/socket/resTool";
import u from "@/utils";
import { t, type Locale } from "@/i18n";

// i18n-ignore — module-level zod schema, built once at import time (no request/locale in scope).
// Not sent to the model (never passed through .toJSONSchema()) and not read anywhere at runtime;
// exported for cross-module z.infer type reuse (src/routes/production/{saveFlowData,getFlowData}.ts,
// src/routes/production/storyboard/batchGenerateImage.ts). The runtime-facing, locale-aware labels
// built from this shape live under the agent.production.tools.flowData.* catalog keys below instead.
const deriveAssetSchema = z.object({
  id: z.number().describe("衍生资产ID,如果新增则为空"), // i18n-ignore — dead schema metadata, see note above
  assetsId: z.number().describe("关联的资产ID"), // i18n-ignore — dead schema metadata, see note above
  prompt: z.string().describe("生成提示词"), // i18n-ignore — dead schema metadata, see note above
  name: z.string().describe("衍生资产名称"), // i18n-ignore — dead schema metadata, see note above
  desc: z.string().describe("衍生资产描述"), // i18n-ignore — dead schema metadata, see note above
  src: z.string().nullable().describe("衍生资产资源路径"), // i18n-ignore — dead schema metadata, see note above
  // i18n-ignore — "未生成/生成中/已完成/生成失败" are persisted o_assets state values (b); describe() text is dead schema metadata, see note above (c, left un-converted)
  state: z.enum(["未生成", "生成中", "已完成", "生成失败"]).describe("衍生资产生成状态"),
  type: z.enum(["role", "tool", "scene", "clip"]).describe("衍生资产类型"), // i18n-ignore — dead schema metadata, see note above
});
export const assetItemSchema = z.object({
  id: z.number().describe("资产唯一标识"), // i18n-ignore — dead schema metadata, see note above
  name: z.string().describe("资产名称"), // i18n-ignore — dead schema metadata, see note above
  type: z.enum(["role", "tool", "scene", "clip"]).describe("资产类型"), // i18n-ignore — dead schema metadata, see note above
  prompt: z.string().describe("生成提示词"), // i18n-ignore — dead schema metadata, see note above
  desc: z.string().describe("资产描述"), // i18n-ignore — dead schema metadata, see note above
  derive: z.array(deriveAssetSchema).describe("衍生资产列表"), // i18n-ignore — dead schema metadata, see note above
});
const storyboardSchema = z.object({
  id: z.number().describe("分镜ID，必须为真实id"), // i18n-ignore — dead schema metadata, see note above
  duration: z.number().describe("持续时长(秒)"), // i18n-ignore — dead schema metadata, see note above
  prompt: z.string().describe("生成提示词"), // i18n-ignore — dead schema metadata, see note above
  associateAssetsIds: z.array(z.number()).describe("关联资产ID列表"), // i18n-ignore — dead schema metadata, see note above
  src: z.string().nullable().describe("分镜资源路径"), // i18n-ignore — dead schema metadata, see note above
  index: z.number().nullable().optional().describe("分镜排序字段"), // i18n-ignore — dead schema metadata, see note above
});
const workbenchDataSchema = z.object({
  name: z.string().describe("项目名称"), // i18n-ignore — dead schema metadata, see note above (unused const)
  duration: z.string().describe("视频时长"), // i18n-ignore — dead schema metadata, see note above (unused const)
  resolution: z.string().describe("分辨率"), // i18n-ignore — dead schema metadata, see note above (unused const)
  fps: z.string().describe("帧率"), // i18n-ignore — dead schema metadata, see note above (unused const)
  cover: z.string().optional().describe("封面图片路径"), // i18n-ignore — dead schema metadata, see note above (unused const)
  gradient: z.string().optional().describe("渐变色配置"), // i18n-ignore — dead schema metadata, see note above (unused const)
});
const posterItemSchema = z.object({
  id: z.number().describe("海报ID"), // i18n-ignore — dead schema metadata, see note above (unused const)
  image: z.string().describe("海报图片路径"), // i18n-ignore — dead schema metadata, see note above (unused const)
});
export const flowDataSchema = z.object({
  script: z.string().describe("剧本内容"), // i18n-ignore — dead schema metadata, see note above
  scriptPlan: z.string().describe("拍摄计划"), // i18n-ignore — dead schema metadata, see note above
  assets: z.array(assetItemSchema).describe("衍生资产"), // i18n-ignore — dead schema metadata, see note above
  storyboardTable: z.string().describe("分镜表"), // i18n-ignore — dead schema metadata, see note above
  storyboard: z.array(storyboardSchema).describe("分镜面板"), // i18n-ignore — dead schema metadata, see note above
});

export type FlowData = z.infer<typeof flowDataSchema>;

const keySchema = z.enum(Object.keys(flowDataSchema.shape) as [keyof FlowData, ...Array<keyof FlowData>]);
// Locale-aware labels for the flowData keys, used in user-visible "thinking" text below.
// Deliberately NOT derived from flowDataSchema's .description (see note above) so they can be
// resolved per-request via the `locale` passed into this factory.
const flowDataKeyI18nKeys: Record<keyof FlowData, string> = {
  script: "agent.production.tools.flowData.script",
  scriptPlan: "agent.production.tools.flowData.scriptPlan",
  assets: "agent.production.tools.flowData.assets",
  storyboardTable: "agent.production.tools.flowData.storyboardTable",
  storyboard: "agent.production.tools.flowData.storyboard",
};

interface ToolConfig {
  resTool: ResTool;
  toolsNames?: string[];
  msg: ReturnType<ResTool["newMessage"]>;
  /** Person-facing: the "thinking" panel text shown to whoever is watching the agent run. */
  locale: Locale;
  /**
   * Model-facing: tool description/schema `.describe()` text and the string returned by
   * `execute()` (a tool result the model reads on its next turn) all take this instead of
   * `locale` — see src/i18n/locale.ts.
   */
  promptLocale: Locale;
}

/**
 * 串行队列：确保 socket 操作排队执行，避免并发过高导致假死
 * @param delayMs 每个操作之间的最小间隔(ms)
 */
function createSocketQueue(delayMs = 800) {
  let lastPromise: Promise<any> = Promise.resolve();
  return <T>(fn: () => Promise<T>): Promise<T> => {
    lastPromise = lastPromise.then(
      () =>
        new Promise<T>((resolve, reject) => {
          setTimeout(() => fn().then(resolve, reject), delayMs);
        }),
    );
    return lastPromise;
  };
}

export default (toolCpnfig: ToolConfig) => {
  const { resTool, toolsNames, msg, locale, promptLocale } = toolCpnfig;
  const { socket } = resTool;
  const socketQueue = createSocketQueue(800);
  const workMap: Record<any, any> = {};
  const tools: Record<string, Tool> = {
    get_flowData: tool({
      description: t("agent.production.tools.getFlowData.describe", {}, promptLocale),
      inputSchema: jsonSchema<{ key: keyof FlowData }>(
        z
          .object({
            key: keySchema.describe(t("agent.production.tools.getFlowData.keyDescribe", {}, promptLocale)),
          })
          .toJSONSchema(),
      ),
      execute: async ({ key }) => {
        const label = t(flowDataKeyI18nKeys[key], {}, locale);
        const thinking = msg.thinking(t("agent.production.tools.getFlowData.fetching", { label }, locale));

        const flowData: FlowData = await new Promise((resolve) => socket.emit("getFlowData", { key }, (res: any) => resolve(res)));
        thinking.appendText(t("agent.production.tools.getFlowData.fetched", { label, data: JSON.stringify(flowData[key], null, 2) }, locale));
        thinking.updateTitle(t("agent.production.tools.getFlowData.done", { label }, locale));
        thinking.complete();
        if (workMap[key] && JSON.stringify(workMap[key]) === JSON.stringify(flowData[key])) {
          // Returned as the tool's own result (read by the model on its next turn), unlike the
          // `label`/thinking text above — resolves via prompt_language, not content_language.
          const promptLabel = t(flowDataKeyI18nKeys[key], {}, promptLocale);
          const unchanged = t("agent.production.tools.getFlowData.unchanged", { label: promptLabel }, promptLocale);
          console.info(`[tools] get_flowData: ${unchanged}`);
          return unchanged;
        }
        workMap[key] = flowData[key];
        return flowData[key];
      },
    }),
    add_deriveAsset: tool({
      description: t("agent.production.tools.addDeriveAsset.describe", {}, promptLocale),
      inputSchema: jsonSchema<{ assetsId: number; id: number | null; name: string; desc: string }>(
        z
          .object({
            assetsId: z.number().describe(t("agent.production.tools.deriveAsset.assetsId", {}, promptLocale)),
            id: z.number().nullable().describe(t("agent.production.tools.deriveAsset.id", {}, promptLocale)),
            name: z.string().describe(t("agent.production.tools.deriveAsset.name", {}, promptLocale)),
            desc: z.string().describe(t("agent.production.tools.deriveAsset.desc", {}, promptLocale)),
          })
          .toJSONSchema(),
      ),
      execute: async (raw) => {
        // 容错：LLM 偶尔传 "null" 字符串或空串，统一规范为 null
        const idRaw = raw.id as unknown;
        const normalizedId = idRaw === "null" || idRaw === "" || idRaw === undefined ? null : (idRaw as number | null);
        const deriveAsset = { ...raw, id: normalizedId };

        const thinking = msg.thinking(t("agent.production.tools.addDeriveAsset.working", {}, locale));
        const { projectId, scriptId } = resTool.data;
        const startTime = Date.now();
        const parentAssets = await u.db("o_assets").where("id", deriveAsset.assetsId).select("id", "type").first();
        if (!parentAssets) return t("agent.production.tools.addDeriveAsset.assetNotFound", {}, promptLocale);

        const data = {
          id: deriveAsset.id ?? undefined,
          assetsId: deriveAsset.assetsId,
          projectId,
          name: deriveAsset.name,
          type: parentAssets.type,
          describe: deriveAsset.desc,
          startTime,
        };
        if (deriveAsset.id) {
          await u.db("o_assets").where("id", deriveAsset.id).update(data);
          thinking.appendText(t("agent.production.tools.addDeriveAsset.updated", { id: deriveAsset.id }, locale));
        } else {
          const [insertedId] = await u.db("o_assets").insert(data);
          data.id = insertedId;
          await u.db("o_scriptAssets").insert({ scriptId, assetId: insertedId });
          thinking.appendText(t("agent.production.tools.addDeriveAsset.added", { id: insertedId }, locale));
        }
        const res = await new Promise((resolve) => socket.emit("addDeriveAsset", data, (res: any) => resolve(res)));
        thinking.updateTitle(t("agent.production.tools.addDeriveAsset.done", {}, locale));
        thinking.complete();
        return res ?? t("agent.production.tools.addDeriveAsset.success", {}, promptLocale);
      },
    }),
    del_deriveAsset: tool({
      description: t("agent.production.tools.delDeriveAsset.describe", {}, promptLocale),
      inputSchema: jsonSchema<{ assetsId: number; id: number }>(
        z
          .object({
            assetsId: z.number().describe(t("agent.production.tools.deriveAsset.assetsId", {}, promptLocale)),
            id: z.number().describe(t("agent.production.tools.deriveAsset.idOnly", {}, promptLocale)),
          })
          .toJSONSchema(),
      ),
      execute: async ({ assetsId, id }) => {
        const thinking = msg.thinking(t("agent.production.tools.addDeriveAsset.working", {}, locale));
        const { scriptId } = resTool.data;
        await u.db("o_assets").where("id", id).del();
        await u.db("o_scriptAssets").where({ scriptId, assetId: id }).del();
        thinking.appendText(t("agent.production.tools.delDeriveAsset.deleted", { id }, locale));
        const res = await new Promise((resolve) => socket.emit("delDeriveAsset", { assetsId, id }, (res: any) => resolve(res)));
        thinking.updateTitle(t("agent.production.tools.addDeriveAsset.done", {}, locale));
        thinking.complete();
        return res ?? t("agent.production.tools.delDeriveAsset.success", {}, promptLocale);
      },
    }),
    generate_deriveAsset: tool({
      description: t("agent.production.tools.generateDeriveAsset.describe", {}, promptLocale),
      inputSchema: jsonSchema<{ ids: number[] }>(
        z
          .object({
            ids: z.array(z.number()).describe(t("agent.production.tools.generateDeriveAsset.idsDescribe", {}, promptLocale)),
          })
          .toJSONSchema(),
      ),
      execute: async ({ ids }) => {
        const thinking = msg.thinking(t("agent.production.tools.generateDeriveAsset.generating", {}, locale));
        new Promise((resolve) => socket.emit("generateDeriveAsset", { ids }, (res: any) => resolve(res)))
          .then((res) => {
            thinking.appendText(t("agent.production.tools.generateDeriveAsset.generated", { result: JSON.stringify(res, null, 2) }, locale));
            thinking.updateTitle(t("agent.production.tools.generateDeriveAsset.startCompleted", {}, locale));
            thinking.complete();
          })
          .catch((e) => {
            thinking.appendText(t("agent.production.tools.generateDeriveAsset.failedText", { error: u.error(e).message }, locale));
            thinking.updateTitle(t("agent.production.tools.generateDeriveAsset.failedTitle", {}, locale));
            thinking.complete();
          });

        // Returned immediately as this tool's own result — model-facing.
        return t("agent.production.tools.generateDeriveAsset.started", {}, promptLocale);
      },
    }),
    generate_storyboard: tool({
      description: t("agent.production.tools.generateStoryboard.describe", {}, promptLocale),
      inputSchema: jsonSchema<{ ids: number[] }>(
        z
          .object({
            ids: z.array(z.number()).describe(t("agent.production.tools.generateStoryboard.idsDescribe", {}, promptLocale)),
          })
          .toJSONSchema(),
      ),
      execute: async ({ ids }) => {
        const thinking = msg.thinking(t("agent.production.tools.generateStoryboard.generating", {}, locale));
        socketQueue(
          () =>
            new Promise((resolve, reject) =>
              socket.emit("generateStoryboard", { ids }, (res: any) => {
                if (res?.error) return reject(new Error(res.error));
                resolve(res);
              }),
            ),
        )
          .then((res) => {
            thinking.appendText(t("agent.production.tools.generateStoryboard.generatedData", { data: JSON.stringify(res, null, 2) }, locale));
            thinking.updateTitle(t("agent.production.tools.generateStoryboard.done", {}, locale));
            thinking.complete();
          })
          .catch((e) => {
            thinking.appendText(t("agent.production.tools.generateStoryboard.failedText", { error: u.error(e).message }, locale));
            thinking.updateTitle(t("agent.production.tools.generateStoryboard.failedTitle", {}, locale));
            thinking.complete();
          });

        // Returned immediately as this tool's own result — model-facing.
        return t("agent.production.tools.generateStoryboard.started", {}, promptLocale);
      },
    }),
    add_flowData_storyboard: tool({
      description: t("agent.production.tools.addStoryboardPanel.describe", {}, promptLocale),
      inputSchema: jsonSchema<{
        videoDesc: string;
        prompt: string | null;
        track: string;
        duration: number;
        associateAssetsIds: number[] | null;
        shouldGenerateImage: string;
      }>(
        z
          .object({
            videoDesc: z.string().describe(t("agent.production.tools.storyboardPanel.videoDesc", {}, promptLocale)),
            prompt: z.string().nullable().describe(t("agent.production.tools.storyboardPanel.prompt", {}, promptLocale)),
            track: z.string().describe(t("agent.production.tools.storyboardPanel.track", {}, promptLocale)),
            duration: z.number().describe(t("agent.production.tools.storyboardPanel.duration", {}, promptLocale)),
            associateAssetsIds: z
              .array(z.number())
              .nullable()
              .describe(t("agent.production.tools.storyboardPanel.associateAssetsIds", {}, promptLocale)),
            shouldGenerateImage: z
              .enum(["true", "false"])
              .describe(t("agent.production.tools.storyboardPanel.shouldGenerateImage", {}, promptLocale)),
          })
          .toJSONSchema(),
      ),
      execute: async (raw) => {
        const thinking = msg.thinking(t("agent.production.tools.addStoryboardPanel.adding", {}, locale));
        const data = {
          videoDesc: raw.videoDesc,
          prompt: raw.prompt,
          track: raw.track,
          duration: raw.duration,
          associateAssetsIds: raw.associateAssetsIds ?? [],
          shouldGenerateImage: raw.shouldGenerateImage,
        };
        socketQueue(
          () =>
            new Promise((resolve, reject) =>
              socket.emit("addStoryboard", { ...data }, (res: any) => {
                if (res?.error) return reject(new Error(res.error));
                resolve(res);
              }),
            ),
        )
          .then((res) => {
            thinking.appendText(t("agent.production.tools.addStoryboardPanel.addedData", { data: JSON.stringify(data, null, 2) }, locale));
            thinking.updateTitle(t("agent.production.tools.addStoryboardPanel.success", {}, locale));
            thinking.complete();
          })
          .catch((e) => {
            thinking.appendText(t("agent.production.tools.addStoryboardPanel.addedData", { data: JSON.stringify(data, null, 2) }, locale));
            thinking.updateTitle(t("agent.production.tools.addStoryboardPanel.failed", {}, locale));
            thinking.complete();
          });
        return true;
      },
    }),
  };

  return toolsNames ? Object.fromEntries(Object.entries(tools).filter(([n]) => toolsNames.includes(n))) : tools;
};
