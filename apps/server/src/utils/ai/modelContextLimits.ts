// ACT: 字符串优先精确匹配，正则按列表顺序匹配；两项上限均优先于用户配置和 Pi 内置模型目录。
// 单位为 token；2026-09-20 核对官方标准 API 上限，不采用批处理或 Beta 专属上限。
const modelContextLimits: { id: string | RegExp; contextWindow: number; maxTokens: number }[] = [
  // TF-Router
  { id: "deepseek-v4.1-flash", contextWindow: 1048576, maxTokens: 393216 },
  { id: /^deepseek-v4\.1-flash-[0-9]+$/, contextWindow: 1048576, maxTokens: 393216 },
  // DeepSeek：旧的 deepseek-chat / deepseek-reasoner 已停用，不覆盖中转站的同名模型。
  // https://api-docs.deepseek.com/quick_start/pricing/
  // https://api-docs.deepseek.com/api/create-chat-completion/
  // https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro-0813/blob/main/config.json
  { id: "deepseek-flash", contextWindow: 1048576, maxTokens: 393216 },
  { id: "deepseek-v4-flash", contextWindow: 1048576, maxTokens: 393216 },
  { id: "deepseek-v4-pro", contextWindow: 1048576, maxTokens: 393216 },

  // OpenAI：各型号页面 https://developers.openai.com/api/docs/models/{模型 ID}
  { id: "gpt-5.5", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-5.4", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-5.4-pro", contextWindow: 1050000, maxTokens: 128000 },
  { id: "gpt-5.4-mini", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5.4-nano", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5.2", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5.1", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-5-mini", contextWindow: 400000, maxTokens: 128000 },
  { id: "gpt-4.1", contextWindow: 1047576, maxTokens: 32768 },
  { id: "gpt-4.1-mini", contextWindow: 1047576, maxTokens: 32768 },
  { id: "gpt-4.1-nano", contextWindow: 1047576, maxTokens: 32768 },
  { id: "gpt-4o", contextWindow: 128000, maxTokens: 16384 },

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

export default modelContextLimits;
