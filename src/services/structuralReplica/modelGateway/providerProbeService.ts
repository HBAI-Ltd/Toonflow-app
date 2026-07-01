import { recordProviderProbe } from "../repository";
import type { ProviderCapability } from "../schemas";

export async function probeProviderCapability(provider: ProviderCapability, modelName?: string) {
  const startedAt = Date.now();
  const model = modelName ? provider.models.find((item) => item.model === modelName) : provider.models[0];
  if (!provider.enabled) {
    const result = { ok: false, status: "unavailable" as const, reason: "provider is disabled", providerId: provider.providerId, model: model?.model ?? null };
    await recordProviderProbe({ providerId: provider.providerId, model: model?.model ?? null, status: "unavailable", errorReason: result.reason, result });
    return result;
  }
  if (!model) {
    const result = { ok: false, status: "unavailable" as const, reason: "provider has no video model", providerId: provider.providerId, model: null };
    await recordProviderProbe({ providerId: provider.providerId, model: null, status: "unavailable", errorReason: result.reason, result });
    return result;
  }
  if (!provider.baseUrl && provider.providerType === "openai_compatible") {
    const result = { ok: false, status: "unavailable" as const, reason: "provider baseUrl is missing", providerId: provider.providerId, model: model.model };
    await recordProviderProbe({ providerId: provider.providerId, model: model.model, status: "unavailable", errorReason: result.reason, result });
    return result;
  }

  // Capability probe is intentionally lightweight: it validates configured metadata without submitting a paid video job.
  const result = {
    ok: true,
    status: "available" as const,
    reason: "provider capability metadata is usable",
    providerId: provider.providerId,
    model: model.model,
    latencyMs: Date.now() - startedAt,
    capabilities: model.capabilities,
  };
  await recordProviderProbe({
    providerId: provider.providerId,
    model: model.model,
    status: "available",
    latencyMs: result.latencyMs,
    result,
  });
  return result;
}
