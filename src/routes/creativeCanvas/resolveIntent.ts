import express from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";

const router = express.Router();

const intentActions = [
  "unknown",
  "query_status",
  "query_video_count",
  "focus_node",
  "regenerate_asset_image",
  "generate_storyboard_image",
  "regenerate_video_prompt",
] as const;

type IntentAction = (typeof intentActions)[number];

interface IntentNode {
  id: string;
  label: string;
  type: string;
  token?: string;
  status?: string;
  summary?: string;
}

interface ResolvedIntent {
  action: IntentAction;
  targetIds: string[];
  confidence: number;
  reason?: string;
}

const nodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  token: z.string().optional(),
  status: z.string().optional(),
  summary: z.string().optional(),
});

const allowedActions = new Set<string>(intentActions);

function fallbackIntent(reason: string): ResolvedIntent {
  return { action: "unknown", targetIds: [], confidence: 0, reason };
}

function clampConfidence(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1, num));
}

function parseIntent(text: string): unknown {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {}
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function normalizeIntent(parsed: unknown, allowedIds: Set<string>): ResolvedIntent {
  if (!parsed || typeof parsed !== "object") return fallbackIntent("LLM 未返回有效 JSON");
  const raw = parsed as Record<string, unknown>;
  const action = typeof raw.action === "string" && allowedActions.has(raw.action) ? (raw.action as IntentAction) : "unknown";
  const targetIds = Array.isArray(raw.targetIds)
    ? raw.targetIds.map(String).filter((id) => allowedIds.has(id)).slice(0, 24)
    : [];
  return {
    action,
    targetIds: action === "unknown" ? [] : targetIds,
    confidence: action === "unknown" ? Math.min(clampConfidence(raw.confidence), 0.4) : clampConfidence(raw.confidence),
    reason: typeof raw.reason === "string" ? raw.reason.slice(0, 120) : undefined,
  };
}

function buildSystemPrompt() {
  return `你是 Toonflow 画布 Agent 的意图解析器，只做分类，不执行任务。

你必须只输出一个 JSON 对象，不要输出 markdown 或解释：
{"action":"unknown","targetIds":[],"confidence":0,"reason":""}

action 只能是以下白名单之一：
- unknown：无法确定用户要做什么
- query_status：询问节点是否完整、是否完成、是否缺失、状态或进度
- query_video_count：询问某个镜头/Prompt 生成了几个视频、哪些视频或结果数量
- focus_node：查看、定位、打开、选中或聚焦节点
- regenerate_asset_image：对角色/场景/道具资产重新生成资产图
- generate_storyboard_image：生成或重生分镜图
- regenerate_video_prompt：生成、重生或重试视频 Prompt/视频任务

规则：
1. targetIds 只能使用用户输入 nodes 中已有的 id，不能编造。
2. 用户已经 @ 的节点优先作为目标；没有 @ 时可根据 selectedNodeId 或语义匹配 nodes。
3. 如果用户只问“是否完整/生成了几个/状态怎样”，不要选择生成类动作。
4. 如果用户语义不明确或目标不足，返回 unknown，confidence 不超过 0.4。
5. 对高成本动作必须有明确“生成、重生、重新、补齐、执行、提交”等意图才返回生成类动作。`;
}

export default router.post(
  "/",
  validateFields({
    mode: z.string(),
    text: z.string(),
    selectedNodeId: z.string().nullable().optional(),
    mentionedNodeIds: z.array(z.string()).optional(),
    nodes: z.array(nodeSchema).optional(),
  }),
  async (req, res) => {
    const {
      mode,
      text,
      selectedNodeId = null,
      mentionedNodeIds = [],
      nodes = [],
    }: {
      mode: string;
      text: string;
      selectedNodeId?: string | null;
      mentionedNodeIds?: string[];
      nodes?: IntentNode[];
    } = req.body;
    const safeNodes = nodes.slice(0, 80).map((node) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      token: node.token,
      status: node.status,
      summary: node.summary?.slice(0, 180),
    }));
    const allowedIds = new Set(safeNodes.map((node) => node.id));

    try {
      const result = await u.Ai.Text("universalAi", false, 0).invoke({
        system: buildSystemPrompt(),
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              mode,
              text,
              selectedNodeId,
              mentionedNodeIds,
              nodes: safeNodes,
            }),
          },
        ],
      });
      res.status(200).send(success(normalizeIntent(parseIntent(result.text), allowedIds)));
    } catch (err) {
      res.status(200).send(success(fallbackIntent(u.error(err).message)));
    }
  },
);
