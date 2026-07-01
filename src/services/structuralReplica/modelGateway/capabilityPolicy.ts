import type { ModelRoute, ProviderCapability, ShotAdaptation } from "../schemas";

export function requiredCapabilitiesForShot(input: {
  adaptation: ShotAdaptation;
  durationSec: number;
  aspectRatio: string;
}): string[] {
  const required = new Set<string>(["textToVideo"]);
  if (input.adaptation.adaptationLevel === "A" || input.adaptation.adaptationLevel === "B") required.add("videoReference");
  if (input.adaptation.adaptationLevel === "C") required.add("imageToVideo");
  if (Object.keys(input.adaptation.matchedAssets).filter((key) => input.adaptation.matchedAssets[key]?.assetId).length > 1) required.add("multiReference");
  if (Object.keys(input.adaptation.matchedAssets).some((key) => key.startsWith("role:"))) required.add("characterLock");
  if (input.durationSec > 0) required.add(`maxDurationSec:${input.durationSec}`);
  if (input.aspectRatio) required.add(`ratio:${input.aspectRatio}`);
  return [...required];
}

function supports(model: ProviderCapability["models"][number], capability: string): boolean {
  if (capability === "textToVideo") return model.capabilities.textToVideo;
  if (capability === "imageToVideo") return model.capabilities.imageToVideo;
  if (capability === "videoReference") return model.capabilities.videoReference;
  if (capability === "multiReference") return model.capabilities.multiReference;
  if (capability === "characterLock") return model.capabilities.characterLock;
  if (capability === "lipSync") return model.capabilities.lipSync;
  if (capability.startsWith("maxDurationSec:")) return model.capabilities.maxDurationSec >= Number(capability.slice("maxDurationSec:".length));
  if (capability.startsWith("ratio:")) return model.capabilities.supportedRatios.includes(capability.slice("ratio:".length) as any);
  return true;
}

export function evaluateModelCandidate(provider: ProviderCapability, model: ProviderCapability["models"][number], required: string[]) {
  const missing = required.filter((capability) => !supports(model, capability));
  const downgradeReasons: string[] = [];
  const fallbackPlan: string[] = [];

  for (const capability of missing) {
    if (capability === "videoReference" && model.capabilities.imageToVideo) {
      downgradeReasons.push("video_reference_not_supported_use_keyframe_image_to_video");
      fallbackPlan.push("use_keyframe_image_to_video");
      continue;
    }
    if (capability === "multiReference") {
      downgradeReasons.push("multi_reference_not_supported_use_primary_role_and_scene");
      fallbackPlan.push("use_primary_role_and_scene_only");
      continue;
    }
    if (capability === "characterLock") {
      downgradeReasons.push("character_lock_not_supported_warn_identity_drift");
      fallbackPlan.push("warn_character_identity_drift");
      continue;
    }
    if (capability.startsWith("maxDurationSec:")) {
      downgradeReasons.push("model_max_duration_insufficient_split_or_compress_dialogue");
      fallbackPlan.push("split_shot_or_compress_dialogue");
      continue;
    }
    downgradeReasons.push(`missing_capability:${capability}`);
  }

  const degradable = ["videoReference", "multiReference", "characterLock"];
  const hardMissing = missing.filter((capability) => !degradable.includes(capability) && !capability.startsWith("maxDurationSec:"));
  const routeStatus: ModelRoute["routeStatus"] = hardMissing.length ? "blocked" : downgradeReasons.length ? "degraded" : "selected";
  const score = (provider.enabled ? 100 : -100) + model.priority * 10 - hardMissing.length * 50 - downgradeReasons.length * 10;
  return { routeStatus, score, missing, downgradeReasons, fallbackPlan };
}
