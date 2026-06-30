import express from "express";
import u from "@/utils";
import { z } from "zod";
import { tool, jsonSchema } from "ai";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { assetCardFromPromptText, mergeAssetCards, parseAssetCard } from "@/utils/characterSpec";

const router = express.Router();

type AssetType = "role" | "scene" | "tool";

const assetCardSchemas: Record<AssetType, string> = {
  role: "toonflow.roleCard.v1",
  scene: "toonflow.sceneCard.v1",
  tool: "toonflow.propCard.v1",
};

const assetTypeLabels: Record<AssetType, string> = {
  role: "角色",
  scene: "场景",
  tool: "道具",
};

const AssetCardSchema = z.object({
  schema: z.enum(["toonflow.roleCard.v1", "toonflow.sceneCard.v1", "toonflow.propCard.v1"]),
  summary: z.string().describe("一句话概括该资产的可识别视觉特征"),
  faceReference: z.string().optional().describe("角色面部参考，仅角色需要"),
  bodyReference: z.string().optional().describe("角色身高、体型、比例，仅角色需要"),
  hair: z.string().optional().describe("角色发型、发色、发饰，仅角色需要"),
  costume: z.string().optional().describe("角色服装轮廓、层次和关键纹样，仅角色需要"),
  expressions: z.array(z.string()).optional().describe("角色常用表情或表演气质，仅角色需要"),
  spatialLayout: z.string().optional().describe("场景空间结构、入口、主体区域、动线，仅场景需要"),
  lighting: z.string().optional().describe("场景光源、色温、明暗关系，仅场景需要"),
  fixedElements: z.array(z.string()).optional().describe("场景中必须稳定出现的固定陈设，仅场景需要"),
  spatialContinuity: z
    .object({
      fixedAnchors: z.array(z.string()).optional().describe("同一场景跨镜头必须稳定的空间锚点，仅场景需要"),
      characterBlocking: z.array(z.string()).optional().describe("人物默认站位、座位、朝向或与固定物的关系，仅场景需要；只写可从资产/剧本推断的信息"),
      objectBlocking: z.array(z.string()).optional().describe("关键道具、家具、陈设的相对位置，仅场景需要"),
      cameraAxis: z.string().optional().describe("视轴线、主要观察方向或镜头可变范围，仅场景需要"),
      invariants: z.array(z.string()).optional().describe("跨镜头不得改变的空间关系，仅场景需要"),
      allowedChanges: z.array(z.string()).optional().describe("允许随镜头变化的内容，如景别、裁切、机位高度，仅场景需要"),
      forbiddenDrift: z.array(z.string()).optional().describe("必须避免的空间漂移，如固定物移动、人物无依据换位，仅场景需要"),
    })
    .optional()
    .describe("场景空间连续性卡，仅场景需要"),
  atmosphere: z.string().optional().describe("场景氛围、时代感或情绪基调，仅场景需要"),
  shape: z.string().optional().describe("道具外形轮廓，仅道具需要"),
  material: z.string().optional().describe("道具材质和表面质感，仅道具需要"),
  size: z.string().optional().describe("道具相对尺寸和持握/摆放比例，仅道具需要"),
  usage: z.string().optional().describe("道具使用方式、出场状态，仅道具需要"),
  palette: z.record(z.string(), z.string()).optional().describe("稳定配色，key 是部位或区域，value 是颜色描述或色值"),
  details: z.array(z.string()).optional().describe("必须保留的可识别细节"),
  sourceRemark: z.string().optional().describe("资产原始备注，仅在原备注包含有价值信息时保留"),
  constraints: z
    .object({
      must: z.array(z.string()).optional().describe("后续生成必须保持的内容"),
      avoid: z.array(z.string()).optional().describe("后续生成必须避免的漂移"),
    })
    .optional(),
});

function fallbackAssetCard(asset: any) {
  const type = asset.type as AssetType;
  const summary = String(asset.describe || asset.prompt || asset.name || "").trim() || `${assetTypeLabels[type]}资产`;
  const details = [asset.prompt, asset.describe].map((item) => String(item || "").trim()).filter(Boolean).slice(0, 2);
  const sourceRemark = parseAssetCard(asset.remark) ? "" : String(asset.remark || "").trim();
  const sceneContinuity = type === "scene"
    ? {
        spatialLayout: summary,
        fixedElements: details,
        spatialContinuity: {
          fixedAnchors: details.length ? details : [summary],
          invariants: ["保持该场景的核心空间结构、固定陈设和主要动线可辨认"],
          allowedChanges: ["允许改变景别、裁切、焦段、机位高度和人物在镜头中的可见比例"],
          forbiddenDrift: ["不要无依据移动固定陈设、重排空间结构或把同一场景画成另一个地点"],
        },
      }
    : {};
  return {
    schema: assetCardSchemas[type],
    summary,
    details,
    ...sceneContinuity,
    ...(sourceRemark ? { sourceRemark } : {}),
    constraints: {
      must: [asset.name ? `保持资产名称与身份：${asset.name}` : ""].filter(Boolean),
      avoid: ["不要改变核心身份、时代质感和主要外观特征"],
    },
  };
}

function normalizeAssetCard(card: Record<string, unknown>, type: AssetType) {
  return {
    ...card,
    schema: assetCardSchemas[type],
  };
}

const requestSchema = {
  id: z.number(),
  projectId: z.number().optional(),
  force: z.boolean().optional(),
};

export default router.post("/", validateFields(requestSchema), async (req, res) => {
  const { id, projectId, force } = req.body;
  const query = u
    .db("o_assets")
    .where("o_assets.id", id)
    .leftJoin("o_project", "o_project.id", "o_assets.projectId")
    .select(
      "o_assets.id",
      "o_assets.projectId",
      "o_assets.name",
      "o_assets.type",
      "o_assets.describe",
      "o_assets.prompt",
      "o_assets.remark",
      "o_project.artStyle",
      "o_project.intro as projectIntro",
    );
  if (projectId) query.where("o_assets.projectId", projectId);

  const asset = await query.first();
  if (!asset) return res.status(404).send(error("资产不存在"));
  if (!["role", "scene", "tool"].includes(asset.type)) return res.status(400).send(error("仅角色、场景、道具支持生成资产卡规格"));

  const existing = parseAssetCard(asset.remark);
  const promptCard = assetCardFromPromptText(asset.prompt, asset.type, {
    summary: asset.describe || asset.name,
    existingRemark: asset.remark,
  });
  if (existing && !force) return res.status(200).send(success({ assetId: id, existing: true, card: existing }));
  if (promptCard && !force) {
    await u.db("o_assets").where("id", id).update({ remark: JSON.stringify(promptCard) });
    return res.status(200).send(success({ assetId: id, existing: false, source: "prompt", card: promptCard }));
  }

  const type = asset.type as AssetType;
  let generatedCard: Record<string, unknown> | null = null;
  try {
    const resultTool = tool({
      description: "返回资产卡规格时必须调用这个工具",
      inputSchema: jsonSchema<{ card: z.infer<typeof AssetCardSchema> }>(
        z
          .object({
            card: AssetCardSchema.describe("结构化资产卡规格"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ card }) => {
        generatedCard = normalizeAssetCard(card, type);
        return "无需回复用户任何内容";
      },
    });

    await u.Ai.Text("universalAi").invoke({
      messages: [
        {
          role: "system",
          content:
            "你是影视前期设定师。请把资产描述整理成后续分镜图、视频 Prompt 可复用的结构化资产卡规格。" +
            "不要编造剧本外身份和剧情，只提炼可稳定复用的视觉连续性约束。" +
            "角色重点是脸、体型、发型、服装、表情；场景重点是空间结构、光源、固定陈设、氛围；道具重点是形状、材质、尺寸、使用方式。" +
            "若资产类型是场景，必须尽量生成 spatialContinuity：用抽象但可执行的空间锚点、人物/物件调度基准、视轴线、不变量、允许变化和禁止漂移来约束跨镜头连续性；不得写入当前资产信息无法支持的具体剧情细节。" +
            "结果必须通过 resultTool 返回。",
        },
        {
          role: "user",
          content: [
            `资产类型：${assetTypeLabels[type]}`,
            `目标 schema：${assetCardSchemas[type]}`,
            `项目画风：${asset.artStyle || "未指定"}`,
            `项目简介：${asset.projectIntro || "无"}`,
            `资产名称：${asset.name || ""}`,
            `资产描述：${asset.describe || ""}`,
            `现有备注：${parseAssetCard(asset.remark) ? "" : asset.remark || ""}`,
            `图片提示词：${asset.prompt || ""}`,
          ].join("\n"),
        },
      ],
      tools: { resultTool },
    });
  } catch (e) {
    console.warn("[generateAssetCard] AI asset card generation failed, using fallback", u.error(e).message);
  }

  const card = generatedCard
    ? (promptCard ? mergeAssetCards(promptCard, generatedCard) : generatedCard)
    : promptCard || fallbackAssetCard(asset);
  await u.db("o_assets").where("id", id).update({
    remark: JSON.stringify(card),
  });

  return res.status(200).send(success({ assetId: id, existing: false, card }));
});
