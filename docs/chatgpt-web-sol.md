# ChatGPT 网页 GPT-5.6 SOL（极高）接入

Toonflow 内置供应商“ChatGPT 网页 GPT-5.6 SOL”通过本机
`chatgpt2api` 的 OpenAI 兼容接口调用 ChatGPT 网页账号实时返回的模型。

## 前置条件

1. 启动并连接 `chatgpt2api`。
2. 确认 `GET /v1/models` 的实时结果包含 `gpt-5.6-sol-wm`。
3. 准备 `chatgpt2api` 的 `CHATGPT2API_AUTH_KEY`。

不要把 ChatGPT Access Token 填入 Toonflow。Toonflow 只需要
`chatgpt2api` 的代理 API Key。

## Toonflow 配置

在“设置 → 模型服务”中找到“ChatGPT 网页 GPT-5.6 SOL”：

- 代理 API Key：填写 `CHATGPT2API_AUTH_KEY`。
- 请求地址：
  - `chatgpt2api` 前端开发代理运行时可填写
    `http://127.0.0.1:5173/v1`；
  - 直接连接后端时可填写 `http://127.0.0.1:8000/v1`。
- 启用供应商后，将 Agent 的语言模型设置为
  “GPT-5.6 SOL（极高）”。

适配器也接受不带 `/v1` 的服务根地址，以及完整的
`/v1/chat/completions` 地址，并会归一化为 OpenAI Base URL。

## 请求行为

- Toonflow 模型标识：`chatgptWebSol:gpt-5.6-sol-wm`
- 上游模型标识：`gpt-5.6-sol-wm`
- 接口：`POST /v1/chat/completions`
- 推理强度：每次请求都固定覆盖为
  `reasoning_effort: xhigh`

`chatgpt2api` 会把 `xhigh` 规范化为 ChatGPT 网页端的 extended
推理档，即本接入所称的“极高”。即使 Toonflow 当前对话面板选择了
关闭、轻度或深度，该专用供应商仍固定使用极高档。

## 安全说明

- 代理 API Key 按 Toonflow 现有供应商机制保存在本地 SQLite 的
  `o_vendorConfig.inputValues` 中，不在日志中输出。
- 适配器不读取或保存 ChatGPT Access Token、Cookie 或 OAuth 凭据。
- 使用该供应商时，Toonflow 的提示词、剧本和上下文会经本机
  `chatgpt2api` 转发到 ChatGPT 网页服务。
- 若 `GET /v1/models` 不再返回 `gpt-5.6-sol-wm`，应先在
  `chatgpt2api` 中检查账号登录状态、套餐和实时模型列表。
