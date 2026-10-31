import type { ExtDefinition } from "@toonflow/ext-scaffold/runtime";

export default {
  id: "ext-image",
  displayName: "图片",
  icon: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#41b883" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>'),
  configRules: [{ type: "switch", field: "fitToWindow", title: "图片适应窗口", value: true }],
  extensions: ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg", "avif", "ico", "tif", "tiff"],
  resourceKind: "file",
} satisfies Omit<ExtDefinition, "load">;
