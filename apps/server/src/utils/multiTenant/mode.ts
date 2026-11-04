import conf from "@/utils/conf";

export const creationPort = 10888;

export function isEnabled() { return conf.get("settings", {}).multiTenantEnabled === true; }
