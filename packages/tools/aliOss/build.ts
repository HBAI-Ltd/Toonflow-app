import { createToolConfig } from "@toonflow/tools-scaffold";

await createToolConfig({
  name: "aliOss",
  displayName: "阿里云 OSS",
  description: "将工作区媒体上传至阿里云 OSS 私有存储，提供临时 HTTPS 下载地址。",
  author: "Toonflow",
  github: "https://github.com/HBAI-Ltd/Toonflow-app",
  prompt: "仅按用户要求上传工作区媒体。aliOss 上传的对象保留在 OSS 中，不自动删除；上传结果未知时先根据返回的对象标识在阿里云控制台核对，不能自动重复上传。不要索要或输出 AccessKey、签名下载链接。",
  configRules: [
    { type: "input", field: "region", title: "OSS 地域（如 cn-hangzhou）", value: "cn-hangzhou" },
    { type: "input", field: "endpoint", title: "OSS 公网 Endpoint（HTTPS）", value: "" },
    { type: "input", field: "bucket", title: "Bucket 名称", value: "" },
    { type: "input", field: "accessKeyId", title: "阿里云 AccessKey ID", value: "", props: { type: "password", showPassword: true, autocomplete: "off" } },
    { type: "input", field: "accessKeySecret", title: "阿里云 AccessKey Secret", value: "", props: { type: "password", showPassword: true, autocomplete: "off" } },
    { type: "input", field: "prefix", title: "对象前缀", value: "toonflow" },
    { type: "inputNumber", field: "expiresHours", title: "下载链接有效期（小时）", value: 72, props: { min: 1, max: 168, step: 1 } },
  ],
}, import.meta.url);
