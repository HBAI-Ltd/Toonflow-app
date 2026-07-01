import { getTaskBundle, parseModelRouteRow, parseShotAdaptationRow, saveModelRoutes } from "../repository";
import { ModelRouteSchema, StructuralIrSchema, type ModelRoute, type ProviderCapability, type ShotAdaptation } from "../schemas";
import { listEffectiveProviderCapabilities } from "./providerCapabilityService";
import { evaluateModelCandidate, requiredCapabilitiesForShot } from "./capabilityPolicy";

function routeBlocked(taskId: number, adaptation: ShotAdaptation, reasons: string[], requiredCapabilities: string[]): ModelRoute {
  return ModelRouteSchema.parse({
    taskId,
    shotId: adaptation.shotId,
    selectedProviderId: null,
    selectedModel: null,
    routeStatus: "blocked",
    requiredCapabilities,
    fallbackPlan: [],
    downgradeReasons: reasons,
  });
}

function chooseModel(providers: ProviderCapability[], requiredCapabilities: string[]) {
  let best:
    | {
        provider: ProviderCapability;
        model: ProviderCapability["models"][number];
        routeStatus: ModelRoute["routeStatus"];
        score: number;
        downgradeReasons: string[];
        fallbackPlan: string[];
      }
    | null = null;
  for (const provider of providers.filter((item) => item.enabled)) {
    for (const model of provider.models.filter((item) => item.type === "video")) {
      const evaluated = evaluateModelCandidate(provider, model, requiredCapabilities);
      if (!best || evaluated.score > best.score) best = { provider, model, ...evaluated };
    }
  }
  return best;
}

export async function routeModelsForTask(taskId: number): Promise<ModelRoute[]> {
  const bundle = await getTaskBundle(taskId);
  if (!bundle.storyIr?.dataJson) throw new Error("story IR not found");
  const ir = StructuralIrSchema.parse(JSON.parse(bundle.storyIr.dataJson));
  const adaptationRows = bundle.shotAdaptations;
  if (!adaptationRows.length) throw new Error("shot adaptations not found");
  const adaptations = adaptationRows.map(parseShotAdaptationRow);
  const providers = await listEffectiveProviderCapabilities({ syncVendors: true });
  const routeByShot = new Map<string, ModelRoute>();

  for (const adaptation of adaptations) {
    const shot = ir.shots.find((item) => item.shotId === adaptation.shotId);
    if (!shot) continue;
    const requiredCapabilities = requiredCapabilitiesForShot({
      adaptation,
      durationSec: shot.durationSec,
      aspectRatio: String(bundle.task.aspectRatio || "9:16"),
    });
    if (adaptation.adaptationLevel === "D") {
      routeByShot.set(adaptation.shotId, routeBlocked(taskId, adaptation, adaptation.blockedReasons, requiredCapabilities));
      continue;
    }
    const candidate = chooseModel(providers, requiredCapabilities);
    if (!candidate) {
      routeByShot.set(adaptation.shotId, routeBlocked(taskId, adaptation, ["no_provider_with_video_model"], requiredCapabilities));
      continue;
    }
    routeByShot.set(
      adaptation.shotId,
      ModelRouteSchema.parse({
        taskId,
        shotId: adaptation.shotId,
        selectedProviderId: candidate.provider.providerId,
        selectedModel: candidate.model.model,
        routeStatus: candidate.routeStatus,
        requiredCapabilities,
        fallbackPlan: candidate.fallbackPlan,
        downgradeReasons: candidate.downgradeReasons,
      }),
    );
  }

  const rows = await saveModelRoutes(taskId, [...routeByShot.values()]);
  return rows.map(parseModelRouteRow);
}
