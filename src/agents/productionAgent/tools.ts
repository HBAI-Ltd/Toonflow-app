import { tool, jsonSchema, Tool } from "ai";
import { z } from "zod";
import _ from "lodash";
import ResTool from "@/socket/resTool";
import u from "@/utils";

const deriveAssetSchema = z.object({
  id: z.number().describe("衍生资产ID,如果新增则为空"),
  assetsId: z.number().describe("关联的资产ID"),
  prompt: z.string().describe("生成提示词"),
  name: z.string().describe("衍生资产名称"),
  desc: z.string().describe("衍生资产描述"),
  src: z.string().nullable().describe("衍生资产资源路径"),
  state: z.enum(["未生成", "生成中", "已完成", "生成失败"]).describe("衍生资产生成状态"),
  type: z.enum(["role", "tool", "scene", "clip"]).describe("衍生资产类型"),
});
export const assetItemSchema = z.object({
  id: z.number().describe("资产唯一标识"),
  name: z.string().describe("资产名称"),
  type: z.enum(["role", "tool", "scene", "clip"]).describe("资产类型"),
  prompt: z.string().describe("生成提示词"),
  desc: z.string().describe("资产描述"),
  derive: z.array(deriveAssetSchema).describe("衍生资产列表"),
});
const storyboardSchema = z.object({
  id: z.number().describe("分镜ID，必须为真实id"),
  duration: z.number().describe("持续时长(秒)"),
  prompt: z.string().describe("生成提示词"),
  associateAssetsIds: z.array(z.number()).describe("关联资产ID列表"),
  src: z.string().nullable().describe("分镜资源路径"),
  index: z.number().nullable().optional().describe("分镜排序字段"),
});
const flexibleNumberArraySchema = z
  .union([z.array(z.number()), z.array(z.string()), z.string(), z.null()])
  .optional()
  .describe("该分镜所需的资产ID列表，支持数组、JSON数组字符串或逗号分隔字符串");
const flexibleBooleanSchema = z
  .union([z.boolean(), z.number(), z.string(), z.null()])
  .optional()
  .describe("是否需要生成分镜图片，支持 true/false、0/1 或字符串");
const workbenchDataSchema = z.object({
  name: z.string().describe("项目名称"),
  duration: z.string().describe("视频时长"),
  resolution: z.string().describe("分辨率"),
  fps: z.string().describe("帧率"),
  cover: z.string().optional().describe("封面图片路径"),
  gradient: z.string().optional().describe("渐变色配置"),
});
const posterItemSchema = z.object({
  id: z.number().describe("海报ID"),
  image: z.string().describe("海报图片路径"),
});
export const flowDataSchema = z.object({
  script: z.string().describe("剧本内容"),
  scriptPlan: z.string().describe("拍摄计划"),
  assets: z.array(assetItemSchema).describe("衍生资产"),
  storyboardTable: z.string().describe("分镜表"),
  storyboard: z.array(storyboardSchema).describe("分镜面板"),
});

export type FlowData = z.infer<typeof flowDataSchema>;

const keySchema = z.enum(Object.keys(flowDataSchema.shape) as [keyof FlowData, ...Array<keyof FlowData>]);
const flowDataKeyLabels = Object.fromEntries(
  Object.entries(flowDataSchema.shape).map(([key, schema]) => [key, (schema as z.ZodTypeAny).description ?? key]),
) as Record<keyof FlowData, string>;

interface ToolConfig {
  resTool: ResTool;
  toolsNames?: string[];
  msg: ReturnType<ResTool["newMessage"]>;
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
  const { resTool, toolsNames, msg } = toolCpnfig;
  const { socket } = resTool;
  const socketQueue = createSocketQueue(800);
  const workMap: Record<any, any> = {};
  const readFlowData = () =>
    new Promise<FlowData>((resolve) => socket.emit("getFlowData", { key: "all" }, (res: FlowData) => resolve(res)));
  const persistFlowData = (data: FlowData) =>
    socketQueue(
      () =>
        new Promise((resolve, reject) =>
          socket.emit("saveFlowData", { data }, (res: any) => {
            if (res?.error) return reject(new Error(res.error));
            resolve(res);
          }),
        ),
    );
  const tools: Record<string, Tool> = {
    get_flowData: tool({
      description: "获取工作区数据",
      inputSchema: jsonSchema<{ key: keyof FlowData }>(
        z
          .object({
            key: keySchema.describe("数据key"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ key }) => {
        const thinking = msg.thinking(`正在获取${flowDataKeyLabels[key]}工作区数据...`);

        const flowData: FlowData = await new Promise((resolve) => socket.emit("getFlowData", { key }, (res: any) => resolve(res)));
        thinking.appendText(`获取到${flowDataKeyLabels[key]}:\n` + JSON.stringify(flowData[key], null, 2));
        thinking.updateTitle(`获取${flowDataKeyLabels[key]}完成`);
        thinking.complete();
        if (workMap[key] && JSON.stringify(workMap[key]) === JSON.stringify(flowData[key])) {
          console.info(`[tools] get_flowData: ${flowDataKeyLabels[key]}数据未变化，无需更新`);
          return `${flowDataKeyLabels[key]}数据未变化，无需更新`;
        }
        workMap[key] = flowData[key];
        return flowData[key];
      },
    }),
    save_flowData: tool({
      description: "保存生产流水线工作区数据。导演规划必须写入 scriptPlan，分镜表必须写入 storyboardTable，保存后画布会生成对应卡片。",
      inputSchema: jsonSchema<{ scriptPlan?: string | null; storyboardTable?: string | null }>(
        z
          .object({
            scriptPlan: z.string().nullable().optional().describe("导演规划/拍摄计划完整内容"),
            storyboardTable: z.string().nullable().optional().describe("分镜表/镜头拆解表完整内容"),
          })
          .toJSONSchema(),
      ),
      execute: async (raw) => {
        const thinking = msg.thinking("正在保存生产工作区数据...");
        try {
          const current = await readFlowData();
          const next: FlowData = {
            script: current?.script ?? "",
            scriptPlan: current?.scriptPlan ?? "",
            assets: Array.isArray(current?.assets) ? current.assets : [],
            storyboardTable: current?.storyboardTable ?? "",
            storyboard: Array.isArray(current?.storyboard) ? current.storyboard : [],
          };
          const fields: string[] = [];
          if (raw.scriptPlan != null && String(raw.scriptPlan).trim()) {
            next.scriptPlan = String(raw.scriptPlan).trim();
            fields.push("导演规划");
          }
          if (raw.storyboardTable != null && String(raw.storyboardTable).trim()) {
            next.storyboardTable = String(raw.storyboardTable).trim();
            fields.push("分镜表");
          }
          if (!fields.length) {
            thinking.appendText("没有收到可保存的导演规划或分镜表内容。");
            thinking.updateTitle("生产工作区未更新");
            thinking.complete();
            return "没有可保存内容";
          }
          const res = await persistFlowData(next);
          thinking.appendText(`已保存：${fields.join("、")}`);
          thinking.updateTitle("生产工作区保存完成");
          thinking.complete();
          return res ?? true;
        } catch (e) {
          thinking.appendText("生产工作区保存失败:\n" + u.error(e).message);
          thinking.updateTitle("生产工作区保存失败");
          thinking.complete();
          throw e;
        }
      },
    }),
    add_deriveAsset: tool({
      description: "新增或更新衍生资产",
      inputSchema: jsonSchema<{ assetsId: number; id: number | null; name: string; desc: string }>(
        z
          .object({
            assetsId: z.number().describe("关联的资产ID"),
            id: z.number().nullable().describe("衍生资产ID,如果新增则为空"),
            name: z.string().describe("衍生资产名称"),
            desc: z.string().describe("衍生资产描述"),
          })
          .toJSONSchema(),
      ),
      execute: async (raw) => {
        // 容错：LLM 偶尔传 "null" 字符串或空串，统一规范为 null
        const idRaw = raw.id as unknown;
        const normalizedId = idRaw === "null" || idRaw === "" || idRaw === undefined ? null : (idRaw as number | null);
        const deriveAsset = { ...raw, id: normalizedId };

        const thinking = msg.thinking("正在操作资产...");
        const { projectId, scriptId } = resTool.data;
        const startTime = Date.now();
        const parentAssets = await u.db("o_assets").where("id", deriveAsset.assetsId).select("id", "type").first();
        if (!parentAssets) return "关联的资产不存在";

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
          thinking.appendText(`已更新衍生资产，ID: ${deriveAsset.id}\n`);
        } else {
          const [insertedId] = await u.db("o_assets").insert(data);
          data.id = insertedId;
          await u.db("o_scriptAssets").insert({ scriptId, assetId: insertedId });
          thinking.appendText(`已新增衍生资产，ID: ${insertedId}\n`);
        }
        const res = await new Promise((resolve) => socket.emit("addDeriveAsset", data, (res: any) => resolve(res)));
        thinking.updateTitle("资产操作完成");
        thinking.complete();
        return res ?? "操作成功";
      },
    }),
    del_deriveAsset: tool({
      description: "删除衍生资产",
      inputSchema: jsonSchema<{ assetsId: number; id: number }>(
        z
          .object({
            assetsId: z.number().describe("关联的资产ID"),
            id: z.number().describe("衍生资产ID"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ assetsId, id }) => {
        const thinking = msg.thinking("正在操作资产...");
        const { scriptId } = resTool.data;
        await u.db("o_assets").where("id", id).del();
        await u.db("o_scriptAssets").where({ scriptId, assetId: id }).del();
        thinking.appendText(`已删除衍生资产，ID: ${id}\n`);
        const res = await new Promise((resolve) => socket.emit("delDeriveAsset", { assetsId, id }, (res: any) => resolve(res)));
        thinking.updateTitle("资产操作完成");
        thinking.complete();
        return res ?? "删除成功";
      },
    }),
    generate_deriveAsset: tool({
      description: "生成衍生资产图片",
      inputSchema: jsonSchema<{ ids: number[] }>(
        z
          .object({
            ids: z.array(z.number()).describe("需要生成的 衍生资产ID"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ ids }) => {
        const thinking = msg.thinking("正在生成衍生资产...");
        new Promise((resolve) => socket.emit("generateDeriveAsset", { ids }, (res: any) => resolve(res)))
          .then((res) => {
            thinking.appendText(`已生成衍生资产，ID: ${JSON.stringify(res, null, 2)}\n`);
            thinking.updateTitle("衍生资产开始完成");
            thinking.complete();
          })
          .catch((e) => {
            thinking.appendText("衍生资产生成失败:\n" + u.error(e).message);
            thinking.updateTitle("衍生资产生成失败");
            thinking.complete();
          });

        return "开始生成衍生资产";
      },
    }),
    generate_storyboard: tool({
      description: "生成分镜图片",
      inputSchema: jsonSchema<{ ids: number[] }>(
        z
          .object({
            ids: z.array(z.number()).describe("必须获取真实的分镜ID，支持批量生成"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ ids }) => {
        const thinking = msg.thinking("正在生成分镜...");
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
            thinking.appendText("生成的分镜数据:\n" + JSON.stringify(res, null, 2));
            thinking.updateTitle("分镜生成完成");
            thinking.complete();
          })
          .catch((e) => {
            thinking.appendText("分镜生成失败:\n" + u.error(e).message);
            thinking.updateTitle("分镜生成失败");
            thinking.complete();
          });

        return "开始生成分镜";
      },
    }),
    add_flowData_storyboard: tool({
      description: "新增分镜面板到工作区",
      inputSchema: jsonSchema<{
        videoDesc: string;
        prompt?: string | null;
        track?: string | number;
        duration?: string | number;
        associateAssetsIds?: number[] | string[] | string | null;
        shouldGenerateImage?: string | number | boolean | null;
        continuityContract?: Record<string, unknown> | string | null;
      }>(
        z
          .object({
            videoDesc: z.string().describe("画面描述、场景、关联资产名称、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效、关联资产ID"),
            prompt: z
              .string()
              .nullable()
              .optional()
              .describe(
                "分镜图片提示词。纯文本/多参模式无分镜图时传 null；需要生成分镜图时必须是单张静态关键帧提示词，不得复制 videoDesc，不得包含多段动作、编号镜头、台词或音效。多人画面必须明确每个角色只出现一次，背影/侧脸/边缘半截人物都计入人数。",
              ),
            track: z.union([z.string(), z.number()]).optional().describe("分组"),
            duration: z.union([z.number(), z.string()]).optional().describe("视频推荐时间"),
            associateAssetsIds: flexibleNumberArraySchema,
            shouldGenerateImage: flexibleBooleanSchema,
            continuityContract: z
              .union([z.record(z.string(), z.unknown()), z.string()])
              .nullable()
              .optional()
              .describe("镜头连续性合同。剧情优先，包含起始状态、允许变化、锁定项、结束状态和 QA 检查。"),
          })
          .toJSONSchema(),
      ),
      execute: async (raw) => {
        const thinking = msg.thinking("正在新增 分镜面板 数据...");
        const associateAssetsIds = (() => {
          const value = raw.associateAssetsIds;
          if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite);
          if (typeof value === "string") {
            try {
              const parsed = JSON.parse(value);
              if (Array.isArray(parsed)) return parsed.map(Number).filter(Number.isFinite);
            } catch {}
            return value.split(/[,\s，、]+/).map(Number).filter(Number.isFinite);
          }
          return [];
        })();
        const shouldGenerateImage = /^(?:true|1|yes|y|是|需要|生成)$/i.test(String(raw.shouldGenerateImage ?? "false").trim()) ? "true" : "false";
        const duration = Number(raw.duration ?? 3);
        const data = {
          videoDesc: raw.videoDesc,
          prompt: raw.prompt ?? "",
          track: String(raw.track ?? "主轨道"),
          duration: Number.isFinite(duration) && duration > 0 ? duration : 3,
          associateAssetsIds,
          shouldGenerateImage,
          continuityContract: raw.continuityContract ?? null,
        };
        try {
          const res = await socketQueue(
            () =>
              new Promise((resolve, reject) =>
                socket.emit("addStoryboard", { ...data }, (res: any) => {
                  if (res?.error) return reject(new Error(res.error));
                  resolve(res);
                }),
              ),
          );
          thinking.appendText("新增的分镜数据:\n" + JSON.stringify(data, null, 2));
          thinking.updateTitle("新增分镜成功");
          thinking.complete();
          return res ?? true;
        } catch (e) {
          thinking.appendText("新增的分镜数据:\n" + JSON.stringify(data, null, 2));
          thinking.appendText("\n新增分镜失败:\n" + u.error(e).message);
          thinking.updateTitle("新增分镜失败");
          thinking.complete();
          throw e;
        }
      },
    }),
  };

  return toolsNames ? Object.fromEntries(Object.entries(tools).filter(([n]) => toolsNames.includes(n))) : tools;
};
