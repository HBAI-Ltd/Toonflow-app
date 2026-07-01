import type { AssetBinding, AssetSlot, StructuralIr } from "./schemas";
import { normalizeAssetSlot, normalizeBindingSlot } from "./assetSlotNormalizer";
import { isUserRequiredAssetSlot } from "./assetRequirementPolicy";

export interface AdaptationPolicyInput {
  shot: StructuralIr["shots"][number];
  bindings: AssetBinding[];
}

function key(slotType: string, slotName: string): string {
  return `${slotType}:${slotName}`.toLowerCase();
}

function isCoreSlot(slot: AssetSlot): boolean {
  const normalized = normalizeAssetSlot(slot);
  if (!normalized) return false;
  if (normalized.type === "role" || normalized.type === "product") return true;
  return normalized.type === "scene" && /主场景|primary|storefront|门店|门头|外景/i.test(normalized.slot);
}

function downgradeForSlot(slot: AssetSlot): string {
  const label = `${slot.type}:${slot.slot}`;
  if (slot.type === "role") return `missing_required_role:${label}`;
  if (slot.type === "product") return `missing_core_product:${label}`;
  if (slot.type === "scene") return `missing_scene_rewrite_to_indoor:${label}`;
  return `missing_optional_visual_rewrite:${label}`;
}

export function evaluateAdaptationLevel(input: AdaptationPolicyInput) {
  const normalizedSlots = input.shot.requiredAssetSlots.map((slot) => normalizeAssetSlot(slot)).filter((slot): slot is AssetSlot => Boolean(slot));
  const requiredSlots = normalizedSlots.filter(
    (slot) => slot.required && (isUserRequiredAssetSlot(slot) || slot.type === "scene" || slot.type === "product"),
  );
  const bindingByKey = new Map<string, AssetBinding>();
  for (const binding of input.bindings) {
    if (binding.shotId !== input.shot.shotId || binding.bindingStatus !== "bound" || !binding.assetId) continue;
    const normalized = normalizeBindingSlot({ slotName: binding.slotName, slotType: binding.slotType });
    if (normalized) bindingByKey.set(key(normalized.type, normalized.slot), binding);
  }

  const matchedAssets: Record<string, { assetId: number | null; score: number; reason?: string }> = {};
  const missingRequired = [];
  for (const slot of requiredSlots) {
    const binding = bindingByKey.get(key(slot.type, slot.slot));
    const slotKey = `${slot.type}:${slot.slot}`;
    if (binding?.assetId) {
      matchedAssets[slotKey] = { assetId: binding.assetId, score: 1 };
    } else {
      matchedAssets[slotKey] = { assetId: null, score: 0, reason: "missing_binding" };
      missingRequired.push(slot);
    }
  }

  const coreMissing = missingRequired.filter(isCoreSlot);
  const assetMatchScore = requiredSlots.length ? Number(((requiredSlots.length - missingRequired.length) / requiredSlots.length).toFixed(2)) : 1;
  const downgradeReasons = missingRequired.map(downgradeForSlot);
  const blockedReasons = coreMissing.filter((slot) => slot.type === "role" || slot.type === "product").map(downgradeForSlot);

  if (blockedReasons.length) {
    return {
      adaptationLevel: "D" as const,
      adaptationStrategy: "blocked_missing_assets" as const,
      assetMatchScore,
      requiredSlots: requiredSlots.map((slot) => `${slot.type}:${slot.slot}`),
      matchedAssets,
      blockedReasons,
      downgradeReasons,
    };
  }

  if (missingRequired.length) {
    return {
      adaptationLevel: "C" as const,
      adaptationStrategy: "rewrite_to_available_scene" as const,
      assetMatchScore,
      requiredSlots: requiredSlots.map((slot) => `${slot.type}:${slot.slot}`),
      matchedAssets,
      blockedReasons: [],
      downgradeReasons,
    };
  }

  const optionalMissingCount = normalizedSlots.filter((slot) => !slot.required && !bindingByKey.has(key(slot.type, slot.slot))).length;
  if (optionalMissingCount > 0 || /环绕|复杂|快速|whip|orbit/i.test(input.shot.cameraMotion || "")) {
    return {
      adaptationLevel: "B" as const,
      adaptationStrategy: "use_user_assets_first" as const,
      assetMatchScore,
      requiredSlots: requiredSlots.map((slot) => `${slot.type}:${slot.slot}`),
      matchedAssets,
      blockedReasons: [],
      downgradeReasons: optionalMissingCount ? [`optional_slots_missing:${optionalMissingCount}`] : ["complex_camera_motion_simplified"],
    };
  }

  return {
    adaptationLevel: "A" as const,
    adaptationStrategy: "use_reference_and_assets" as const,
    assetMatchScore,
    requiredSlots: requiredSlots.map((slot) => `${slot.type}:${slot.slot}`),
    matchedAssets,
    blockedReasons: [],
    downgradeReasons: [],
  };
}
