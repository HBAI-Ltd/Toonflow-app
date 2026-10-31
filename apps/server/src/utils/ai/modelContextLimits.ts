// ACT: 完整 ID 优先，其次匹配规范化名称和有限别名；两项上限均优先于用户配置和 Pi 内置模型目录。
// 单位为 token；原有条目于 2026-09-20 核对，新增条目于 2026-10-26 核对官方标准 API 上限。
const modelContextLimits: { id: string | RegExp; contextWindow: number; maxTokens: number }[] = [
  // DeepSeek：旧的 deepseek-chat / deepseek-reasoner 已停用，不覆盖中转站的同名模型。
  // https://api-docs.deepseek.com/quick_start/pricing/
  // https://api-docs.deepseek.com/api/create-chat-completion/
  // https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813/blob/main/config.json
  { id: "deepseek-flash", contextWindow: 1048576, maxTokens: 393216 },
  { id: "deepseek-v4-flash", contextWindow: 1048576, maxTokens: 393216 },
  { id: "deepseek-v4-pro", contextWindow: 1048576, maxTokens: 393216 },

  // OpenAI：各型号页面 https://developers.openai.com/api/docs/models/{模型 ID}
  { id: "gpt-6.1-sol", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-6-astra", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-6-sol", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-6-luna", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-5.6", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-5.6-sol", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-5.6-terra", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-5.6-luna", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-5.5", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-5.5-pro", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-5.4", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-5.4-pro", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-5.4-mini", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5.4-nano", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5.3-codex", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5.2", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5.2-pro", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5.1", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5-mini", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5-nano", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-4.1", contextWindow: 1047576, maxTokens: 32768 },
  { id: "gpt-4.1-mini", contextWindow: 1047576, maxTokens: 32768 },
  { id: "gpt-4.1-nano", contextWindow: 1047576, maxTokens: 32768 },
  { id: "gpt-4o", contextWindow: 128000, maxTokens: 16384 },
  { id: "gpt-4o-2024-08-06", contextWindow: 128000, maxTokens: 16384 },
  { id: "gpt-4o-2024-11-20", contextWindow: 128000, maxTokens: 16384 },
  { id: "gpt-4o-mini", contextWindow: 128000, maxTokens: 16384 },
  { id: "gpt-4o-mini-2024-07-18", contextWindow: 128000, maxTokens: 16384 },

  // Gemini：沿用模型目录的输入窗口与最大输出，不将两者相加。
  // https://ai.google.dev/gemini-api/docs/models/{模型 ID}
  { id: "gemini-3.1-pro-preview", contextWindow: 1048576, maxTokens: 65536 },
  { id: "gemini-3.1-pro-preview-customtools", contextWindow: 1048576, maxTokens: 65536 },
  { id: "gemini-3-flash-preview", contextWindow: 1048576, maxTokens: 65536 },
  { id: "gemini-3-pro-preview", contextWindow: 1048576, maxTokens: 65536 },
  { id: "gemini-2.5-pro", contextWindow: 1048576, maxTokens: 65536 },
  { id: "gemini-2.5-flash", contextWindow: 1048576, maxTokens: 65536 },
  { id: "gemini-2.5-flash-lite", contextWindow: 1048576, maxTokens: 65536 },

  // Claude：标准 Messages API，未采用 Batch API 的 300K 输出上限。
  // https://platform.claude.com/docs/en/models/overview
  // https://platform.claude.com/docs/en/build-with-claude/context-windows
  // https://platform.claude.com/docs/en/models/sonnet-4-6/overview
  // https://platform.claude.com/docs/es/models/sonnet-4-5/overview
  { id: "claude-fable-5-1", contextWindow: 1000000, maxTokens: 128000 },
  { id: "claude-opus-5", contextWindow: 1000000, maxTokens: 128000 },
  { id: "claude-sonnet-5", contextWindow: 1000000, maxTokens: 128000 },
  { id: "claude-opus-4-6", contextWindow: 1000000, maxTokens: 128000 },
  { id: "claude-sonnet-4-6", contextWindow: 1000000, maxTokens: 128000 },
  { id: "claude-sonnet-4-5", contextWindow: 200000, maxTokens: 64000 },
  { id: "claude-sonnet-4-5-20250929", contextWindow: 200000, maxTokens: 64000 },
  { id: "claude-haiku-4-5", contextWindow: 200000, maxTokens: 64000 },
  { id: "claude-haiku-4-5-20251001", contextWindow: 200000, maxTokens: 64000 },
  // https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-opus-4-1.html
  // https://docs.cloud.google.com/vertex-ai/generative-ai/docs/partner-models/claude/sonnet-4
  { id: "claude-opus-4-1", contextWindow: 200000, maxTokens: 32000 },
  { id: "claude-sonnet-4", contextWindow: 200000, maxTokens: 64000 },

  // 通义千问：文档区分了总上下文、最大输入和最大输出，取总上下文及最大输出。
  // https://help.aliyun.com/zh/model-studio/qwen3-5-plus
  // https://help.aliyun.com/zh/model-studio/qwen3-5-397b-a17b
  // https://help.aliyun.com/zh/model-studio/qwen3-5-35b-a3b
  // https://help.aliyun.com/zh/model-studio/qwen3-5-27b
  { id: "qwen3.5-plus", contextWindow: 1000000, maxTokens: 65536 },
  { id: "qwen3.5-plus-2026-04-20", contextWindow: 1000000, maxTokens: 65536 },
  { id: "qwen3.5-397b-a17b", contextWindow: 262144, maxTokens: 65536 },
  { id: "qwen3.5-35b-a3b", contextWindow: 262144, maxTokens: 65536 },
  { id: "qwen3.5-27b", contextWindow: 262144, maxTokens: 65536 },

  // GLM：https://docs.z.ai/guides/llm/glm-5 、https://docs.z.ai/guides/llm/glm-4.7
  { id: "glm-5", contextWindow: 200000, maxTokens: 128000 },
  { id: "glm-4.7", contextWindow: 200000, maxTokens: 128000 },

  // Kimi：当前在售型号；输入与输出共用窗口，实际输出上限需扣除 prompt_tokens。
  // https://platform.kimi.ai/docs/models
  // https://platform.kimi.ai/docs/api/models-overview
  // https://www.kimi.ai/help/kimi-api/api-troubleshooting
  { id: "kimi-k3", contextWindow: 1048576, maxTokens: 1048576 },
  { id: "kimi-k2.7-code", contextWindow: 262144, maxTokens: 262144 },
  { id: "kimi-k2.7-code-highspeed", contextWindow: 262144, maxTokens: 262144 },
  { id: "kimi-k2.6", contextWindow: 262144, maxTokens: 262144 },

  // 火山方舟：按规格表的上下文窗口和最大回答填写，k 按 1024 换算，不叠加思维链。
  // https://docs.volcengine.com/docs/ark/model-list?lang=zh
  { id: "doubao-seed-evolving", contextWindow: 1048576, maxTokens: 262144 },
  { id: "doubao-seed-2-1-pro-260915", contextWindow: 1048576, maxTokens: 262144 },
  { id: "doubao-seed-2-1-pro-260628", contextWindow: 262144, maxTokens: 262144 },
  { id: "doubao-seed-2-1-turbo-260628", contextWindow: 262144, maxTokens: 262144 },
  { id: "doubao-seed-2-0-lite-260428", contextWindow: 262144, maxTokens: 131072 },
  { id: "doubao-seed-2-0-mini-260428", contextWindow: 262144, maxTokens: 131072 },
  { id: "doubao-seed-2-0-pro-260215", contextWindow: 262144, maxTokens: 131072 },
  { id: "doubao-seed-2-0-lite-260215", contextWindow: 262144, maxTokens: 131072 },
  { id: "doubao-seed-2-0-mini-260215", contextWindow: 262144, maxTokens: 131072 },
  { id: "doubao-seed-2-0-code-preview-260215", contextWindow: 262144, maxTokens: 131072 },
  { id: "doubao-seed-character-260628", contextWindow: 131072, maxTokens: 32768 },
  { id: "doubao-seed-1-8-251228", contextWindow: 262144, maxTokens: 32768 },
  { id: "doubao-seed-code-preview-251028", contextWindow: 262144, maxTokens: 32768 },
  { id: "doubao-seed-character-251128", contextWindow: 131072, maxTokens: 32768 },
  { id: "doubao-seed-1-6-flash-250828", contextWindow: 262144, maxTokens: 32768 },
  { id: "doubao-seed-translation-250915", contextWindow: 4096, maxTokens: 3072 },
  { id: "doubao-seed-1-6-vision-250815", contextWindow: 262144, maxTokens: 32768 },
  { id: "doubao-seed-1-6-250615", contextWindow: 262144, maxTokens: 32768 },
  { id: "doubao-seed-1-6-251015", contextWindow: 262144, maxTokens: 32768 },
  { id: "doubao-seed-1-6-flash-250615", contextWindow: 262144, maxTokens: 32768 },
  { id: "doubao-1-5-pro-32k-250115", contextWindow: 131072, maxTokens: 16384 },
  { id: "doubao-1-5-pro-32k-character-250715", contextWindow: 32768, maxTokens: 12288 },
  { id: "doubao-1-5-lite-32k-250115", contextWindow: 32768, maxTokens: 12288 },
  { id: "glm-5-3-flash-260828", contextWindow: 1048576, maxTokens: 131072 },
  { id: "glm-5-2-260617", contextWindow: 1048576, maxTokens: 131072 },
  { id: "glm-4-7-251222", contextWindow: 204800, maxTokens: 131072 },
  { id: "deepseek-v4-1-flash-260910", contextWindow: 1048576, maxTokens: 393216 },
  { id: "deepseek-v4-pro-ga-260813", contextWindow: 1048576, maxTokens: 393216 },
  { id: "deepseek-v4-flash-ga-260731", contextWindow: 1048576, maxTokens: 393216 },
  { id: "deepseek-v4-pro-260425", contextWindow: 1048576, maxTokens: 393216 },
  { id: "deepseek-v4-flash-260425", contextWindow: 1048576, maxTokens: 393216 },

  // Agnes：当前正式版 API；512K / 1M 分别按 512 / 1024 个 1024 token 换算。
  // https://www.agnes-ai.com/zh-Hans/docs/agnes-30-flash
  // https://www.agnes-ai.com/zh-Hans/docs/agnes-25-flash
  // https://www.agnes-ai.com/zh-Hans/docs/agnes-25-pro
  { id: "agnes-3.0-flash", contextWindow: 524288, maxTokens: 65536 },
  { id: "agnes-2.5-flash", contextWindow: 524288, maxTokens: 65536 },
  { id: "agnes-2.5-pro", contextWindow: 1048576, maxTokens: 65536 },
];

function normalizeModelId(id: string) {
  return id.normalize("NFKC").trim().toLowerCase()
    .replace(/([a-z])(\d)/g, "$1-$2")
    .replace(/(\d)([a-z])/g, "$1-$2")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .replace(/(^|-)claude-(\d+(?:-\d+)?)-(opus|sonnet|haiku|fable)(?=-|$)/g, "$1claude-$3-$2")
    .replace(/-(20\d{2})-(\d{2})-(\d{2})(?=-|$)/g, "-$1$2$3");
}

// 从目录生成匹配规则，数字之间保留分隔，避免把 5.40、54 等版本当成 5.4。
const normalizedLimits = modelContextLimits.flatMap(item => {
  if (typeof item.id !== "string") return [];
  const name = normalizeModelId(item.id);
  const pattern = new RegExp(`(?:^|-)${name.replace(/(?<=[a-z])-|-(?=[a-z])/g, "-?")}$`);
  return [{ name, pattern, limits: item }];
}).sort((left, right) => right.name.length - left.name.length);

export function findModelContextLimits(modelId: string) {
  const exact = modelContextLimits.find(item => item.id === modelId);
  if (exact) return exact;

  let name = normalizeModelId(modelId);
  // 蒸馏和微调模型中的基础型号名不能作为额度依据。
  if (/(?:^|-)(?:distill(?:ed)?|fine-?tuned?)(?:-|$)/.test(name)) return;

  // ACT: 在分隔边界识别完整型号，允许任意供应商前缀；具体型号与日期版本优先。
  // 只移除明确的路由、思考档位及部署后缀，未知尾词仍交给用户配置或内置目录。
  while (true) {
    const normalized = normalizedLimits.find(item => item.pattern.test(name));
    if (normalized) return normalized.limits;
    const stripped = name.replace(/-(?:latest|free|nitro|online|thinking|non-thinking|reasoning|low|medium|high|xhigh|max|off|v-\d+-\d+)$/, "");
    if (stripped === name) break;
    name = stripped;
  }

  // ACT: 仅已收录的 GPT-5/6、GPT-4.1 和 Claude 型号继承未知日期别名；
  // 其他系列的日期可能改变额度，须显式补表。未知变体、预览版和蒸馏版不猜基础型号。
  const alias = name.replace(/-20\d{6}$/, "");
  if (alias !== name) {
    const snapshot = normalizedLimits.find(item => item.pattern.test(alias));
    if (snapshot && /^(?:gpt-(?:5|6|4-1)(?:-|$)|claude-)/.test(snapshot.name)) return snapshot.limits;
  }
  // 正则针对规范化后的名称，显式日期条目已在上方优先匹配。
  return modelContextLimits.find(item => item.id instanceof RegExp && name.search(item.id) !== -1);
}

export default modelContextLimits;
