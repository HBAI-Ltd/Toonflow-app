import u from "@/utils";
import { AssetBindingSchema, type AssetBinding, type AssetSlot } from "./schemas";
import { getTaskBundle, saveAssetBindings } from "./repository";
import { normalizeBindingSlot } from "./assetSlotNormalizer";

export interface BindingInput {
  shotId?: string;
  shotIds?: string[];
  slotName: string;
  slotType: AssetSlot["type"];
  assetId?: number | null;
  bindingStatus?: "missing" | "bound" | "cleared";
  note?: string | null;
}

type ToonflowAssetType = "role" | "scene" | "tool" | "audio";

function mapSlotToAssetType(slotType: AssetSlot["type"]): ToonflowAssetType {
  if (slotType === "role") return "role";
  if (slotType === "scene") return "scene";
  if (slotType === "voice" || slotType === "audio") return "audio";
  return "tool";
}

function bindingKey(binding: Pick<AssetBinding, "shotId" | "slotName" | "slotType">): string {
  return `${binding.shotId}:${binding.slotType}:${binding.slotName}`;
}

async function assertAssetMatches(assetId: number, slotType: AssetSlot["type"], projectId: number | null | undefined): Promise<void> {
  const asset = await u.db("o_assets").where("id", assetId).first();
  if (!asset) throw new Error(`asset not found: ${assetId}`);
  if (projectId && asset.projectId && asset.projectId !== projectId) throw new Error(`asset ${assetId} does not belong to project ${projectId}`);

  const expectedType = mapSlotToAssetType(slotType);
  if (asset.type !== expectedType) throw new Error(`asset ${assetId} type must be ${expectedType}, got ${asset.type}`);
}

function expandShotIds(binding: BindingInput): string[] {
  const shotIds = binding.shotIds?.length ? binding.shotIds : binding.shotId ? [binding.shotId] : [];
  if (!shotIds.length) throw new Error("binding requires shotId or shotIds");
  return [...new Set(shotIds)];
}

export async function bindAssets(taskId: number, bindings: BindingInput[]): Promise<AssetBinding[]> {
  const bundle = await getTaskBundle(taskId);
  const byKey = new Map<string, AssetBinding>();

  for (const existing of bundle.bindings) {
    if (!existing.shotId || !existing.slotName || !existing.slotType) continue;
    const normalizedSlot = normalizeBindingSlot({ slotName: existing.slotName, slotType: existing.slotType as AssetSlot["type"] });
    if (!normalizedSlot) continue;
    const parsed = AssetBindingSchema.parse({
      taskId,
      shotId: existing.shotId,
      slotName: normalizedSlot.slot,
      slotType: normalizedSlot.type,
      assetId: existing.assetId ?? null,
      bindingStatus: existing.bindingStatus || "missing",
      note: existing.note ?? null,
    });
    byKey.set(bindingKey(parsed), parsed);
  }

  for (const input of bindings) {
    const shotIds = expandShotIds(input);
    const normalizedSlot = normalizeBindingSlot({ slotName: input.slotName, slotType: input.slotType });
    if (!normalizedSlot) continue;
    const status = input.bindingStatus || (input.assetId ? "bound" : "cleared");
    if (status === "bound") {
      if (!input.assetId) throw new Error("bound binding requires assetId");
      await assertAssetMatches(input.assetId, normalizedSlot.type, bundle.task.projectId);
    }

    for (const shotId of shotIds) {
      const parsed = AssetBindingSchema.parse({
        taskId,
        shotId,
        slotName: normalizedSlot.slot,
        slotType: normalizedSlot.type,
        assetId: status === "bound" ? input.assetId : null,
        bindingStatus: status,
        note: input.note ?? null,
      });
      byKey.set(bindingKey(parsed), parsed);
    }
  }

  const saved = await saveAssetBindings(taskId, [...byKey.values()]);
  return saved.map((binding) =>
    AssetBindingSchema.parse({
      taskId,
      shotId: binding.shotId,
      slotName: binding.slotName,
      slotType: binding.slotType,
      assetId: binding.assetId ?? null,
      bindingStatus: binding.bindingStatus,
      note: binding.note ?? null,
    }),
  );
}
