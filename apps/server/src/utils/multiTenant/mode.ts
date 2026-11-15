import conf from "@/utils/conf";

export const creationPort = 10888;

// ACT: 创作入口地址由运维写入 settings.json 的 settings.multiTenantCreationUrl；未配置或非法时返回空串，由前端兜底拼接。
export function readCreationUrl() {
  const value = conf.get("settings", {}).multiTenantCreationUrl;
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

export function isEnabled() { return conf.get("settings", {}).multiTenantEnabled === true; }
