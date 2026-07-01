import { getTaskBundle, saveShotAdaptations } from "./repository";
import { AssetBindingSchema, ShotAdaptationSchema, StructuralIrSchema, type ShotAdaptation } from "./schemas";
import { evaluateAdaptationLevel } from "./adaptationLevelPolicy";

function buildAdaptedVisual(shot: ReturnType<typeof StructuralIrSchema.parse>["shots"][number], level: ShotAdaptation["adaptationLevel"], reasons: string[]): string {
  const base = [shot.reusableStructure, shot.shotPurpose, shot.shotSize, shot.cameraAngle].filter(Boolean).join("；") || "保留镜头目的和节奏";
  if (level === "D") return `${base}。该镜头缺少核心资产，暂不生成，请先补齐：${reasons.join("；")}`;
  if (level === "C") return `${base}。不使用参考视频画面，改写为可用资产驱动的室内柜台/产品展示/静态口播方案。`;
  if (level === "B") return `${base}。优先使用用户资产，弱化参考画面，复杂运镜降级为固定镜头或轻微推拉。`;
  return `${base}。使用参考镜头结构、用户绑定资产和原节奏生成。`;
}

export async function buildShotAdaptations(taskId: number): Promise<ShotAdaptation[]> {
  const bundle = await getTaskBundle(taskId);
  if (!bundle.storyIr?.dataJson) throw new Error("story IR not found");
  const ir = StructuralIrSchema.parse(JSON.parse(bundle.storyIr.dataJson));
  const bindings = bundle.bindings.map((binding) =>
    AssetBindingSchema.parse({
      taskId,
      shotId: binding.shotId,
      slotName: binding.slotName,
      slotType: binding.slotType,
      assetId: binding.assetId ?? null,
      bindingStatus: binding.bindingStatus || "missing",
      note: binding.note ?? null,
    }),
  );

  const adaptations = ir.shots
    .filter((shot) => shot.enabled)
    .map((shot) => {
      const policy = evaluateAdaptationLevel({ shot, bindings });
      return ShotAdaptationSchema.parse({
        taskId,
        shotId: shot.shotId,
        ...policy,
        adaptedVisual: buildAdaptedVisual(shot, policy.adaptationLevel, [...policy.blockedReasons, ...policy.downgradeReasons]),
      });
    });
  await saveShotAdaptations(taskId, adaptations);
  return adaptations;
}
