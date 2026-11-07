import { createToolConfig } from "@toonflow/tools-scaffold";

await createToolConfig({
  name: "seedanceAssets",
  displayName: "官方肖像素材库",
  description: "使用火山方舟私域真人人像素材库完成认证、入库、查询与画布引用。",
  author: "Toonflow",
  github: "https://github.com/HBAI-Ltd/Toonflow-app",
  prompt: `官方肖像素材库与工作区、全局素材库不同。使用真人素材前先确保本人同意并完成官方认证。startAuthentication 返回会话 ID，界面提供打开认证页面的按钮，让本人完成认证后再调用 finishAuthentication；服务重启或会话过期需重新认证。完整认证链接仅供本人在界面打开，不请求或记录到对话；不要向对话索取密钥或认证凭证，也不要编造 ID。
通过 listGroups、listAssets 或 getAsset 查询实际素材及状态；只有 Active 素材可以用于生成。createAsset 会上传素材到官方账号，按用户明确要求执行，失败或结果未知时先在官方控制台核对，不自动重复提交。分页时保留筛选条件并使用返回的 nextToken。
需要将素材用在视频节点时，先查询真实画布节点和视频模型，再调用 selectAssets。该操作会替换目标节点整组官方素材引用，调用前确认保留已有引用；它不触发生成。使用本地文件时不要要求用户提供临时下载地址。`,
  configRules: [
    { type: "input", field: "accessKeyId", title: "火山引擎 Access Key ID", value: "", props: { type: "password", showPassword: true, autocomplete: "off" } },
    { type: "input", field: "secretAccessKey", title: "火山引擎 Secret Access Key", value: "", props: { type: "password", showPassword: true, autocomplete: "off" } },
    { type: "input", field: "projectName", title: "方舟项目名称", value: "default" },
    { type: "input", field: "callbackUrl", title: "真人认证完成后的回调地址", value: "https://console.volcengine.com/ark/region:cn-beijing/overview" },
  ],
  components: { seedanceAssets: "src/assetCard.vue" },
}, import.meta.url);
