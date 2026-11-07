import { createToolConfig } from "@toonflow/tools-scaffold";

await createToolConfig({
  name: "videoUpscale",
  displayName: "视频升清",
  description: "将工作区视频通过 reAPI 增强至 720p、1080p 或 4K，并保留原视频。",
  author: "Toonflow",
  github: "https://github.com/HBAI-Ltd/Toonflow-app",
  prompt: "视频升清使用 reAPI Standard 将工作区视频增强至 720p、1080p 或 4K。Agent 仅使用 quote 展示所选 resolution 的估算费用、status 查询已有任务；由用户在视频节点的升清面板中点击开始或继续提交。任务提交后不能更改分辨率。估算不含存储及流量费，也不是最终扣费上限。提交结果未知时不要自动重发，先在 reAPI 控制台核对。",
  configRules: [
    { type: "input", field: "apiKey", title: "reAPI API Key", value: "", props: { type: "password", showPassword: true, autocomplete: "off" } },
    { type: "input", field: "endpoint", title: "S3 兼容存储 Endpoint（HTTPS；阿里云 OSS 填含桶名的主机）", value: "" },
    { type: "input", field: "bucket", title: "S3 私有 Bucket", value: "" },
    { type: "input", field: "region", title: "S3 Region", value: "" },
    { type: "input", field: "accessKeyId", title: "S3 Access Key ID", value: "", props: { type: "password", showPassword: true, autocomplete: "off" } },
    { type: "input", field: "secretAccessKey", title: "S3 Secret Access Key", value: "", props: { type: "password", showPassword: true, autocomplete: "off" } },
  ],
  components: { videoUpscalePanel: "src/upscalePanel.vue" },
}, import.meta.url);
