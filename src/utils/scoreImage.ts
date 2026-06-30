import Ai from "@/utils/ai";
import oss from "@/utils/oss";

/**
 * VLM 候选图自动打分
 *
 * 使用 universalAi（需配置支持视觉的模型）对生成图与提示词的一致性打分，
 * 用于抽卡多候选的自动预筛。打分失败不影响生成主流程，返回 null。
 */

export interface ImageScore {
  score: number; // 0-100
  reason: string;
  passed?: boolean;
  hardFailures: Array<{
    type?: string;
    object?: string;
    message: string;
    severity?: "hard";
  }>;
  softWarnings: string[];
}

interface ScoreImageOptions {
  throwOnError?: boolean;
}

const SCORE_PROMPT = `你是 AI 绘画质检员。请根据下方「生成提示词」评估这张 AI 生成的图片，从以下维度打分：
1. 提示词一致性：画面内容、角色特征、场景元素是否符合提示词描述（权重最高）
2. 画面质量：是否存在肢体错误、面部畸变、多余肢体、明显伪影
3. 画面完整性：主体是否被裁切、是否存在乱码文字或水印

输出要求：只输出一个 JSON 对象，不要输出任何其他文字，格式如下：
{"passed": true, "score": 85, "reason": "简短中文理由，50字以内", "hardFailures": [], "softWarnings": []}

score 为 0-100 的整数，60 分以下表示有明显缺陷不建议采用。
如果补充评估维度中要求 hard reject，发现任何硬性违规时必须设置 passed=false，并把违规写入 hardFailures。
`;

export async function scoreImage(filePath: string, prompt: string, extraCriteria = "", options: ScoreImageOptions = {}): Promise<ImageScore | null> {
  try {
    const image = await oss.getFile(filePath);
    const result = await Ai.Text("universalAi").invoke({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${SCORE_PROMPT}${extraCriteria ? `\n补充评估维度：\n${extraCriteria}\n` : ""}\n生成提示词：\n${prompt}` },
            { type: "image", image },
          ],
        },
      ],
    });
    return parseImageScore(result.text);
  } catch (e) {
    if (options.throwOnError) throw e;
    console.warn("[图片打分] 失败，跳过打分:", e instanceof Error ? e.message : e);
    return null;
  }
}

export function parseImageScore(text: string): ImageScore | null {
  const json = extractJsonObject(text);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    const score = Number(parsed.score);
    if (!Number.isFinite(score)) return null;
    const hardFailures = Array.isArray(parsed.hardFailures)
      ? parsed.hardFailures
          .map((item: any) => ({
            type: typeof item?.type === "string" ? item.type : undefined,
            object: typeof item?.object === "string" ? item.object : undefined,
            message: typeof item?.message === "string" ? item.message : typeof item?.rule === "string" ? item.rule : "",
            severity: item?.severity === "hard" || item?.hard === true ? "hard" as const : undefined,
          }))
          .filter((item: { message: string }) => item.message)
      : [];
    const softWarnings = Array.isArray(parsed.softWarnings)
      ? parsed.softWarnings.map((item: unknown) => String(item || "").trim()).filter(Boolean)
      : [];
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
      passed: typeof parsed.passed === "boolean" ? parsed.passed : undefined,
      hardFailures,
      softWarnings,
    };
  } catch {
    return null;
  }
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }
    if (char === "\"") {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
