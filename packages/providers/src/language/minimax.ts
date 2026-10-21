const rules = [
  {
    type: "input",
    field: "apiKey" as const,
    title: "API Key",
    value: "",
    props: { type: "password", showPassword: true, autocomplete: "off" },
  },
];

export default {
  id: "minimax" as const,
  label: "MiniMax",
  icon: "",
  version: "2.0.0",
  apiUrl: "https://api.minimax.io/v1",
  protocol: "openai-completions",
  readme: "MiniMax 文本模型，优先推荐 MiniMax-M3.1-Flash，也可选择 MiniMax-M3。",
  rules,
  models: [
    {
      id: "MiniMax-M3.1-Flash",
      label: "MiniMax-M3.1-Flash",
      type: "text",
      think: true,
      contextWindow: 1000000,
      reasoningEfforts: { low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" },
    },
    {
      id: "MiniMax-M3",
      label: "MiniMax-M3",
      type: "text",
      think: true,
      contextWindow: 1000000,
      reasoningEfforts: false,
    },
  ],
} satisfies ProviderDefinition<typeof rules>;
