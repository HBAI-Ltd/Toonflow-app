# ChatGPT 网页 GPT-5.6 SOL（极高）与 Image2 接入

Toonflow 内置供应商“ChatGPT 网页 GPT-5.6 SOL + Image2”通过本机
`chatgpt2api` 的 OpenAI 兼容接口调用 ChatGPT 网页文本与图片能力。

## 前置条件

1. 确保 `chatgpt2api` 位于 Toonflow 同级目录，或通过
   `TOONFLOW_CHATGPT2API_DIR` 指定项目目录。Toonflow 启动时会使用
   Conda 自动启动该服务；已运行的服务会直接复用。
2. 确认 `GET /v1/models` 的实时结果包含 `gpt-5.6-sol-wm`。
3. 准备 `chatgpt2api` 的 `CHATGPT2API_AUTH_KEY`。

不要把 ChatGPT Access Token 填入 Toonflow。Toonflow 只需要
`chatgpt2api` 的代理 API Key。

`chatgpt2api` 的 `/v1/models` 只返回当前账号可见的文本模型，不列图片兼容
模型；因此 Image2 是否出现在 Toonflow 中由供应商版本决定，不以
`/v1/models` 的列表为准。

## Toonflow 配置

在“设置 → 模型服务”中找到“ChatGPT 网页 GPT-5.6 SOL + Image2”：

- 代理 API Key：填写 `CHATGPT2API_AUTH_KEY`。
- 请求地址：
  - 自动启动时使用 `http://127.0.0.1:8000/v1`；
  - 如果自行启动 `chatgpt2api` 前端开发代理，也可填写
    `http://127.0.0.1:5173/v1`，但 Toonflow 不会代为启动该前端进程。
- 启用供应商后，将 Agent 的语言模型设置为
  “GPT-5.6 SOL（极高）”。
- 图片模型可选择“GPT Image 2”，支持文生图、单张参考图和多参考图。

适配器也接受不带 `/v1` 的服务根地址，以及完整的
`/v1/chat/completions` 地址，并会归一化为 OpenAI Base URL。

## 请求行为

### GPT-5.6 SOL 文本

- Toonflow 模型标识：`chatgptWebSol:gpt-5.6-sol-wm`。
- 上游模型标识：`gpt-5.6-sol-wm`。
- 接口：`POST /v1/chat/completions`。
- 推理强度：每次请求都固定覆盖为 `reasoning_effort: xhigh`。

`chatgpt2api` 会把 `xhigh` 规范化为 ChatGPT 网页端的 extended
推理档，即本接入所称的“极高”。即使 Toonflow 当前对话面板选择了
关闭、轻度或深度，该专用供应商仍固定使用极高档。

### GPT Image 2

- Toonflow 模型标识：`chatgptWebSol:gpt-image-2`。
- 上游模型标识：`gpt-image-2`。
- 无参考图：`POST /v1/images/generations`。
- 有参考图：`POST /v1/images/edits`，支持一张或多张 base64 图片。
- 横图映射为 `1536x1024`，竖图映射为 `1024x1536`，方图映射为
  `1024x1024`。
- 请求固定生成一张图片并要求 `b64_json`；同时兼容后端返回图片 URL。

## 安全说明

- 代理 API Key 按 Toonflow 现有供应商机制保存在本地 SQLite 的
  `o_vendorConfig.inputValues` 中，不在日志中输出。
- 适配器不读取或保存 ChatGPT Access Token、Cookie 或 OAuth 凭据。
- 使用该供应商时，Toonflow 的提示词、剧本和上下文会经本机
  `chatgpt2api` 转发到 ChatGPT 网页服务。
- 使用 Image2 时，提示词和参考图会由本机 `chatgpt2api` 转发到 ChatGPT
  网页图片服务。
- 若 `GET /v1/models` 不再返回 `gpt-5.6-sol-wm`，应先在
  `chatgpt2api` 中检查账号登录状态、套餐和实时模型列表。
