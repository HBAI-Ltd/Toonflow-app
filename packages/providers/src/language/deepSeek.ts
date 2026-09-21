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
  id: "deepSeek" as const,
  label: "DeepSeek",
  version: "2.0.0",
  apiUrl: "https://api.deepseek.com",
  protocol: "openai-completions",
  readme: "DeepSeek 提供的模型列表",
  rules,
  models: [],
} satisfies ProviderDefinition<typeof rules>;
