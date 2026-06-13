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
}

const SCORE_PROMPT = `你是 AI 绘画质检员。请根据下方「生成提示词」评估这张 AI 生成的图片，从以下维度打分：
1. 提示词一致性：画面内容、角色特征、场景元素是否符合提示词描述（权重最高）
2. 画面质量：是否存在肢体错误、面部畸变、多余肢体、明显伪影
3. 画面完整性：主体是否被裁切、是否存在乱码文字或水印

输出要求：只输出一个 JSON 对象，不要输出任何其他文字，格式如下：
{"score": 85, "reason": "简短中文理由，50字以内"}

score 为 0-100 的整数，60 分以下表示有明显缺陷不建议采用。

生成提示词：
`;

export async function scoreImage(filePath: string, prompt: string): Promise<ImageScore | null> {
  try {
    const base64 = await oss.getImageBase64(filePath);
    const result = await Ai.Text("universalAi").invoke({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${SCORE_PROMPT}${prompt}` },
            { type: "image", image: base64 },
          ],
        },
      ],
    });
    return parseScore(result.text);
  } catch (e) {
    console.warn("[图片打分] 失败，跳过打分:", e instanceof Error ? e.message : e);
    return null;
  }
}

function parseScore(text: string): ImageScore | null {
  const match = text.match(/\{[\s\S]*?\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    const score = Number(parsed.score);
    if (!Number.isFinite(score)) return null;
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
  } catch {
    return null;
  }
}
