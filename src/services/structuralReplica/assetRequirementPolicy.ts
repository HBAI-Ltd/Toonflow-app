import type { AssetSlot } from "./schemas";

export const PRIMARY_SCENE_SLOT_NAME = "主场景全景图";

export function isUserRequiredAssetType(slotType: AssetSlot["type"]): boolean {
  return slotType === "role" || slotType === "scene" || slotType === "voice" || slotType === "audio";
}

export function isUserRequiredAssetSlot(slot: Pick<AssetSlot, "slot" | "type">): boolean {
  if (slot.type === "role" || slot.type === "voice" || slot.type === "audio") return true;
  if (slot.type === "scene") return slot.slot === PRIMARY_SCENE_SLOT_NAME;
  return false;
}

export function assetRequirementLabel(slot: Pick<AssetSlot, "slot" | "type">): string {
  return isUserRequiredAssetSlot(slot) ? "core_user_asset" : "auto_generated_detail";
}

export function assetRequirementDescription(slot: Pick<AssetSlot, "slot" | "type">): string {
  return isUserRequiredAssetSlot(slot)
    ? "核心资产：需要用户提供或绑定"
    : "分镜细节：由提示词自动生成，不要求用户上传";
}
