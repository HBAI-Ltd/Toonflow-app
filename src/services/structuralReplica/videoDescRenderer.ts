import type { AssetBinding, StructuralIr } from "./schemas";
import { assetSlotKey, normalizeAssetSlot, normalizeBindingSlot } from "./assetSlotNormalizer";
import { isUserRequiredAssetSlot } from "./assetRequirementPolicy";

type IrShot = StructuralIr["shots"][number];

export interface DialogueForShot {
  finalDialogue?: string;
  subtitle?: string;
}

function bindingsForShot(bindings: AssetBinding[], shotId: string): AssetBinding[] {
  return bindings.filter((binding) => binding.shotId === shotId && binding.bindingStatus === "bound" && binding.assetId);
}

export function missingRequiredBindings(shot: IrShot, bindings: AssetBinding[]): string[] {
  const bound = new Set(
    bindingsForShot(bindings, shot.shotId)
      .map((binding) => normalizeBindingSlot(binding))
      .filter((slot): slot is NonNullable<typeof slot> => Boolean(slot))
      .map((slot) => assetSlotKey(slot.type, slot.slot)),
  );
  return shot.requiredAssetSlots
    .map((slot) => normalizeAssetSlot(slot))
    .filter((slot): slot is NonNullable<typeof slot> => Boolean(slot))
    .filter((slot) => slot.required)
    .filter((slot) => isUserRequiredAssetSlot(slot))
    .filter((slot) => !bound.has(assetSlotKey(slot.type, slot.slot)))
    .map((slot) => assetSlotKey(slot.type, slot.slot));
}

export function renderVideoDesc(index: number, shot: IrShot, dialogue: DialogueForShot | undefined, bindings: AssetBinding[]): string {
  const shotBindings = bindingsForShot(bindings, shot.shotId);
  const missing = missingRequiredBindings(shot, bindings);
  if (missing.length) throw new Error(`镜头 ${shot.shotId} 还有必需资产未绑定：${missing.join("，")}`);

  const assetsText = shotBindings.map((binding) => `${binding.slotType}:${binding.slotName}=资产:${binding.assetId}`).join("，");
  const visualText = [
    shot.reusableStructure || shot.sourceStructure || shot.shotPurpose || "结构复刻镜头",
    assetsText ? `使用已绑定资产：${assetsText}` : "没有已绑定资产",
    "禁止出现原视频人物、原脸、品牌、标志、门店招牌、水印或私人身份信息",
  ].join("；");
  const line = dialogue?.finalDialogue || shot.editableDialogue || shot.sourceDialogue || "无台词";

  return [
    "该组分镜行原文：",
    `序号 ${index}`,
    visualText,
    `${Number(shot.durationSec.toFixed(2))}s`,
    shot.shotSize || "未指定景别",
    shot.cameraMotion || "直接切换",
    line,
    shot.sound || "环境声",
  ].join(" | ");
}

export function associatedAssetIds(shot: IrShot, bindings: AssetBinding[]): number[] {
  return [
    ...new Set(
      bindingsForShot(bindings, shot.shotId)
        .map((binding) => binding.assetId)
        .filter((assetId): assetId is number => typeof assetId === "number"),
    ),
  ];
}
