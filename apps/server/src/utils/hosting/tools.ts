import { isMultiUser, requireUser } from "@/utils/accounts/context";

const memberPlugins = new Set(["workspace", "canvas", "mediaGeneration", "askUser", "assetOperator"]);

export function canUseHostedTool(name: string) {
  return !isMultiUser() || requireUser().role === "admin" || memberPlugins.has(name);
}
