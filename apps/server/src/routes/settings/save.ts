import u from "@/utils";
import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import { maxSystemPromptLength } from "@/agent/runtime/prompt";
import { t } from "@/lib/i18n";
import { providerSchema } from "@/utils/ai";
import { isMultiUser, requireUser } from "@/utils/accounts/context";
import { systemConfig } from "@/utils/conf";
import { publicSettings, settingsUpdate } from "@/utils/hosting/tenant";
import { sanitizeHostingError } from "@/utils/hosting/policy";

const router = Router();

export default router.put("/", validateFields({ settings: z.record(z.string(), z.json()).and(z.object({
  agentSystemPrompt: z.string().max(maxSystemPromptLength, { error: () => t`系统提示词不能超过 ${maxSystemPromptLength} 个字符` }).optional(),
  customProviders: z.array(providerSchema.extend({ id: z.string().min(1), label: z.string() })).optional(),
  desktopUpdateSource: z.enum(["official", "github", "custom"]).optional(),
  desktopUpdateCustomUrl: z.string().max(2048).refine(value => !value || u.desktop.isValidUpdateUrl(value),
    "自定义更新源必须是不含账号、查询参数或锚点的 HTTP(S) 地址").optional(),
  mcp: z.object({ enabled: z.boolean().optional(), token: z.string().optional(), port: z.number().int().min(1).max(65535).optional() }).optional(),
})).refine(value => value.desktopUpdateSource !== "custom" || !!value.desktopUpdateCustomUrl, {
  path: ["desktopUpdateCustomUrl"], message: "选择自定义更新源前，请先填写有效地址",
}) }), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const { settings } = req.body;
  if (isMultiUser()) {
    const previous = systemConfig.get("settings", {});
    const next = settingsUpdate(settings, previous);
    let modelRefreshErrors: string[] | undefined;
    if (requireUser().role === "admin") {
      systemConfig.set("settings", next);
      const refreshed = await u.ai.refreshProviderModels(previous);
      modelRefreshErrors = refreshed.modelRefreshErrors?.map(sanitizeHostingError);
    }
    res.json(success({ ...publicSettings(u.conf.get("settings", {})), aiModels: u.ai.listAiModels(), ...(modelRefreshErrors?.length ? { modelRefreshErrors } : {}) }, "设置已保存"));
    return;
  }
  u.removeLegacySettings(settings);
  u.cleanNodeMenuSettings(settings);
  const previousSettings = u.conf.get("settings", {});
  u.conf.set("settings", settings);
  const [models] = await Promise.all([u.ai.refreshProviderModels(previousSettings), u.mcpRuntime.reloadMcpRuntime()]);
  res.json(success({ ...models, aiModels: u.ai.listAiModels(), nodeMenu: u.conf.get("settings.general.nodeMenu") ?? null }, "设置已保存"));
});
