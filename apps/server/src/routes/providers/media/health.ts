import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().get("/", validateFields({ providerId: z.string().regex(/^[a-z][a-zA-Z0-9]{0,95}$/), modelId: z.string().trim().min(1).max(256).optional() }, "query"), async (req, res) => {
  const providerInfo = await u.mediaProvider.getMediaProvider(req.query.providerId as string);
  const modelId = req.query.modelId as string | undefined;
  const model = modelId ? providerInfo.models.find(item => item.id === modelId) : undefined;
  if (modelId && !model) { res.status(404).json({ code: 404, data: null, message: "媒体模型不存在" }); return; }
  const configurations = u.conf.get("settings", {}).mediaProviderConfigs;
  const config = configurations && typeof configurations === "object" && !Array.isArray(configurations)
    ? (configurations as Record<string, unknown>)[providerInfo.id] : undefined;
  const provider = await u.mediaProvider.loadMediaProviderSource(providerInfo.source, config && typeof config === "object" && !Array.isArray(config) ? config as Record<string, unknown> : {});
  if (!provider.healthCheck) {
    if (providerInfo.id === "drawThings") {
      const baseUrl = typeof config === "object" && config && typeof (config as Record<string, unknown>).baseUrl === "string"
        ? String((config as Record<string, unknown>).baseUrl).replace(/\/$/, "") : "http://127.0.0.1:7888";
      try {
        const response = await fetch(`${baseUrl}/sdapi/v1/sd-models`, { signal: AbortSignal.timeout(5000) });
        res.json(success({ providerId: providerInfo.id, modelId, model, reachable: true, capabilityKnown: response.ok, modelAvailable: undefined, message: response.ok ? undefined : `模型列表接口返回 HTTP ${response.status}` }));
      } catch (error) {
        res.json(success({ providerId: providerInfo.id, modelId, model, reachable: false, capabilityKnown: false, message: error instanceof Error ? error.message : String(error) }));
      }
      return;
    }
    res.json(success({ providerId: providerInfo.id, modelId, model, reachable: true, capabilityKnown: false, message: "供应商未声明健康检查" }));
    return;
  }
  const health = await provider.healthCheck();
  const modelAvailable = modelId && health.models?.length ? health.models.includes(modelId) : undefined;
  res.json(success({ providerId: providerInfo.id, modelId, model, ...health, modelAvailable, capabilityKnown: true }));
});
