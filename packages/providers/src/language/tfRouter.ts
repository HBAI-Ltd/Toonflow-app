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
  id: "tfRouter" as const,
  label: "影幻",
  version: "3.0.0",
  apiUrl: "https://api.safillu.com/v1",
  protocol: "openai-completions",
  readme: "## 影幻\n\n提供文本对话模型服务，可在平台中为账号添加文本渠道后自动更新模型列表。\n\n[前往平台](https://api.safillu.com/)",
  rules,
  models: [],
} satisfies ProviderDefinition<typeof rules>;
