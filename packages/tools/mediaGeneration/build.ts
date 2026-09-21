import { createToolConfig } from "@toonflow/tools-scaffold";

await createToolConfig({
  name: "mediaGeneration",
  displayName: "媒体生成",
  description: "查询已配置的媒体模型，生成图片、视频或音频并保存到工作区。",
  author: "Toonflow",
  github: "https://github.com/HBAI-Ltd/Toonflow-app",
  prompt: `生成前使用可用的 listMediaModels 查询模型，providerId、modelId、模式、画幅、分辨率、时长和音频能力以返回值为准，不根据模型名称猜测。
参考图片、视频、音频及首尾帧使用已存在的工作区相对路径，并确认所选模型支持相应输入。附件消息只提供文件信息，不表示模型已经看过图片或播放过视频。
本轮具备画布节点工具且用户要求在节点内制作时，优先使用该节点已经注册的生成函数，让结果保留在对应节点；独立素材制作使用本轮可用的媒体生成工具。
只生成用户要求的数量与范围，优先复用已有结果；失败后先处理原因，避免重复消耗算力。等待工具返回已保存的文件路径后再交付，不编造文件或用 Base64 代替产物链接。注意除非用户明确要求让Agent生成，否则统一在画布中处理`,
  configRules: [
    { type: "switch", field: "allowImage", title: "允许 AI 生成图片", value: true, props: { "aria-label": "允许 AI 生成图片" } },
    { type: "switch", field: "allowVideo", title: "允许 AI 生成视频", value: true, props: { "aria-label": "允许 AI 生成视频" } },
    { type: "switch", field: "allowAudio", title: "允许 AI 生成音频", value: true, props: { "aria-label": "允许 AI 生成音频" } },
  ],
}, import.meta.url);
