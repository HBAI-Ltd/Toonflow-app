import u from "@/utils";
import { ProviderCapabilitySchema, type ProviderCapability } from "../schemas";
import { listProviderCapabilities, upsertProviderCapability } from "../repository";

type VendorModel = {
  name?: string;
  modelName: string;
  type?: string;
  mode?: string[];
  maxDuration?: number;
  maxDurationSec?: number;
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function inferModelCapability(model: VendorModel) {
  const name = model.modelName || "";
  const modes = model.mode || [];
  const imageToVideo = /image-to-video|i2v|image/i.test(name) || modes.includes("singleImage");
  const videoReference = /reference-to-video|video_reference|omni|kling-video-o1|wan/i.test(name);
  const multiReference = /reference-to-video|multi|omni|wan|seedance/i.test(name) || modes.includes("multiReference");
  const textToVideo = model.type === "video" && !imageToVideo && !videoReference ? true : /text-to-video|t2v|video/i.test(name);
  return {
    textToVideo,
    imageToVideo,
    videoReference,
    multiReference,
    characterLock: /omni|reference|character|wan|seedance/i.test(name),
    lipSync: /lip|sync|omni/i.test(name),
    maxDurationSec: Number(model.maxDurationSec || model.maxDuration || 5),
    supportedRatios: ["9:16", "16:9"] as const,
    supportsSeed: /seed|wan|kling|seedance/i.test(name),
    supportsNegativePrompt: !/kling/i.test(name),
  };
}

export async function syncProviderCapabilitiesFromVendors(): Promise<ProviderCapability[]> {
  const vendors = await u.db("o_vendorConfig").select("*");
  const saved: ProviderCapability[] = [];
  for (const vendor of vendors) {
    const models = parseJson<VendorModel[]>(vendor.models, []).filter((model) => model.type === "video");
    if (!models.length) continue;
    const inputValues = parseJson<Record<string, string>>(vendor.inputValues, {});
    const capability = ProviderCapabilitySchema.parse({
      providerId: vendor.id,
      providerType: "toonflow_vendor",
      displayName: vendor.id,
      baseUrl: inputValues.baseUrl || inputValues.mediaBaseUrl || "",
      apiKey: inputValues.apiKey || "",
      enabled: vendor.enable !== 0,
      models: models.map((model, index) => ({
        model: model.modelName,
        displayName: model.name || model.modelName,
        type: "video",
        priority: Math.max(0, models.length - index),
        capabilities: inferModelCapability(model),
      })),
    });
    saved.push(await upsertProviderCapability(capability));
  }
  return saved;
}

export async function listEffectiveProviderCapabilities(options: { syncVendors?: boolean } = {}) {
  if (options.syncVendors) await syncProviderCapabilitiesFromVendors();
  return await listProviderCapabilities();
}

export async function saveProviderCapability(input: unknown) {
  return await upsertProviderCapability(ProviderCapabilitySchema.parse(input));
}
