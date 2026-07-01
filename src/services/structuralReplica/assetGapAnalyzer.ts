import u from "@/utils";
import { AssetGapSchema, StructuralIrSchema, type AssetGap, type AssetSlot } from "./schemas";
import { getTaskBundle } from "./repository";
import { assetSlotKey, assetSlotSearchTerms, normalizeAssetSlot, normalizeBindingSlot } from "./assetSlotNormalizer";
import { isUserRequiredAssetSlot } from "./assetRequirementPolicy";

type ToonflowAssetType = "role" | "scene" | "tool" | "audio";

function mapSlotToAssetType(slotType: AssetSlot["type"]): ToonflowAssetType {
  if (slotType === "role") return "role";
  if (slotType === "scene") return "scene";
  if (slotType === "voice" || slotType === "audio") return "audio";
  return "tool";
}

function uploadHint(slotType: AssetSlot["type"], slotName: string): string {
  const type = mapSlotToAssetType(slotType);
  const labels: Record<ToonflowAssetType, string> = {
    role: "角色",
    scene: "场景",
    tool: "道具",
    audio: "音频",
  };
  const source = slotType === "scene" ? "场景全景图" : labels[type];
  return `请上传或创建 Toonflow ${source}资产，用于“${slotName}”。`;
}

export async function analyzeAssetGaps(taskId: number): Promise<AssetGap> {
  const bundle = await getTaskBundle(taskId);
  if (!bundle.storyIr?.dataJson) throw new Error("story IR not found");

  const ir = StructuralIrSchema.parse(JSON.parse(bundle.storyIr.dataJson));
  const grouped = new Map<string, { slotName: string; slotType: AssetSlot["type"]; required: boolean; usedByShots: Set<string> }>();

  for (const shot of ir.shots) {
    if (!shot.enabled) continue;
    for (const slot of shot.requiredAssetSlots) {
      const normalizedSlot = normalizeAssetSlot(slot);
      if (!normalizedSlot) continue;
      if (!normalizedSlot.required || !isUserRequiredAssetSlot(normalizedSlot)) continue;
      const key = assetSlotKey(normalizedSlot.type, normalizedSlot.slot);
      const item =
        grouped.get(key) ||
        ({
          slotName: normalizedSlot.slot,
          slotType: normalizedSlot.type,
          required: normalizedSlot.required,
          usedByShots: new Set<string>(),
        } satisfies { slotName: string; slotType: AssetSlot["type"]; required: boolean; usedByShots: Set<string> });
      item.required = item.required || normalizedSlot.required;
      item.usedByShots.add(shot.shotId);
      grouped.set(key, item);
    }
  }

  const boundKeys = new Set(
    bundle.bindings
      .filter((binding) => binding.bindingStatus === "bound" && binding.assetId)
      .flatMap((binding) => {
        if (!binding.slotName || !binding.slotType) return [];
        const slot = normalizeBindingSlot({ slotName: binding.slotName, slotType: binding.slotType as AssetSlot["type"] });
        return slot ? [assetSlotKey(slot.type, slot.slot)] : [];
      }),
  );

  const items = [];
  for (const item of grouped.values()) {
    const assetType = mapSlotToAssetType(item.slotType);
    const candidates = await u
      .db("o_assets")
      .where("projectId", bundle.task.projectId)
      .andWhere("type", assetType)
      .select("id", "name")
      .limit(50);
    const searchTerms = assetSlotSearchTerms(item.slotType, item.slotName).map((term) => term.toLowerCase());
    const suggestedAssetIds = candidates
      .filter((asset) => {
        const assetName = (asset.name || "").toLowerCase();
        return searchTerms.some((term) => assetName.includes(term) || term.includes(assetName));
      })
      .map((asset) => asset.id)
      .filter((id): id is number => typeof id === "number")
      .slice(0, 5);

    const key = assetSlotKey(item.slotType, item.slotName);
    const status = boundKeys.has(key) ? "bound" : suggestedAssetIds.length ? "suggested" : "missing";
    items.push({
      slotName: item.slotName,
      slotType: item.slotType,
      required: item.required,
      usedByShots: [...item.usedByShots],
      status,
      suggestedAssetIds,
      uploadHint: status === "missing" ? uploadHint(item.slotType, item.slotName) : undefined,
    });
  }

  return AssetGapSchema.parse({
    taskId,
    missingCount: items.filter((item) => item.status === "missing").length,
    items,
  });
}
