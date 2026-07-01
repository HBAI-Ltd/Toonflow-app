import { getTaskBundle, parseModelRouteRow } from "./repository";
import { PromptPackageSchema, ShotControlPackageSchema, type ShotControlPackage } from "./schemas";

function parseJson<T>(data: string | null | undefined, fallback: T): T {
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

export async function buildShotControlPackage(taskId: number, shotId: string): Promise<ShotControlPackage> {
  const bundle = await getTaskBundle(taskId);
  if (!bundle.regeneratedStoryboard?.dataJson) throw new Error("regenerated storyboard not found");
  const storyboard = parseJson(bundle.regeneratedStoryboard.dataJson, null);
  const promptPackage = PromptPackageSchema.parse((storyboard as { promptPackage?: unknown } | null)?.promptPackage);
  const promptShot = promptPackage.shots.find((shot) => shot.shotId === shotId);
  if (!promptShot) throw new Error(`prompt package shot not found: ${shotId}`);

  const route = bundle.modelRoutes.map(parseModelRouteRow).find((item) => item.shotId === shotId);
  if (!route) throw new Error(`model route not found: ${shotId}`);
  if (!route.selectedProviderId || !route.selectedModel || route.routeStatus === "blocked") {
    throw new Error(`model route is blocked for shot: ${shotId}`);
  }

  return ShotControlPackageSchema.parse({
    taskId,
    shotId,
    providerId: route.selectedProviderId,
    model: route.selectedModel,
    prompt: promptShot.resolvedPrompt,
    negativePrompt: promptShot.negativePrompt,
    referenceList: promptShot.referenceFrames.map((path) => ({
      type: "image",
      path,
      source: "reference_frame",
    })),
    durationSec: promptShot.durationSec,
    aspectRatio: bundle.task.aspectRatio || "9:16",
    fallbackStrategy: route.fallbackPlan,
    assetSlots: promptShot.assetSlots,
    routeStatus: route.routeStatus,
    warnings: [...promptShot.warnings, ...route.downgradeReasons],
  });
}
