import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";
import { isMultiUser } from "@/utils/accounts/context";
import { secretMask } from "@/utils/hosting/tenant";

const router = Router();

export default router.post("/", validateFields({
  apiUrl: z.url().refine(value => {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  }, "请填写不含查询参数的 HTTP API 基础地址"),
  protocol: z.enum(["openai-completions", "openai-responses", "anthropic-messages"]),
  apiKey: z.string().max(8192),
}), async (req, res) => {
  const { apiUrl, protocol } = req.body as { apiUrl: string; protocol: string; apiKey: string };
  let apiKey = req.body.apiKey as string;
  if (isMultiUser() && apiKey === secretMask) {
    const providers = u.conf.get("settings", {}).customProviders;
    const provider = Array.isArray(providers) ? providers.find(item => item.apiUrl === apiUrl && item.protocol === protocol) : undefined;
    if (!provider || typeof provider.apiKey !== "string") throw Object.assign(new Error("请填写供应商密钥"), { status: 400 });
    apiKey = provider.apiKey;
  }
  res.json(success(await u.ai.fetchProviderModels({ apiUrl, protocol, apiKey })));
});
