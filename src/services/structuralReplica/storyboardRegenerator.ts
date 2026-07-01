import { getTaskBundle, saveRegeneratedStoryboard } from "./repository";
import { associatedAssetIds, renderVideoDesc } from "./videoDescRenderer";
import { generatePromptPackage } from "./promptPackageGenerator";
import {
  AssetBindingSchema,
  DialogueStructureSchema,
  RegeneratedStoryboardSchema,
  StructuralIrSchema,
  type AssetBinding,
  type RegeneratedStoryboard,
} from "./schemas";

export async function regenerateStoryboard(taskId: number): Promise<RegeneratedStoryboard> {
  const bundle = await getTaskBundle(taskId);
  if (!bundle.storyIr?.dataJson) throw new Error("story IR not found");
  if (!bundle.dialogueStructure?.dataJson) throw new Error("dialogue structure not found");

  const ir = StructuralIrSchema.parse(JSON.parse(bundle.storyIr.dataJson));
  const dialogue = DialogueStructureSchema.parse(JSON.parse(bundle.dialogueStructure.dataJson));
  const dialogueByShot = new Map(dialogue.lines.map((line) => [line.shotId, line]));
  const bindings: AssetBinding[] = bundle.bindings.map((binding) =>
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

  const enabledShots = ir.shots.filter((shot) => shot.enabled);
  const nextVersion = (bundle.regeneratedStoryboard?.version || 0) + 1;
  const promptPackage = generatePromptPackage({
    taskId,
    version: nextVersion,
    ir,
    dialogue,
    bindings,
  });
  const promptByShot = new Map(promptPackage.shots.map((shot) => [shot.shotId, shot]));

  const rows = enabledShots.map((shot, index) => {
    const videoDesc = renderVideoDesc(index + 1, shot, dialogueByShot.get(shot.shotId), bindings);
    const assetIds = associatedAssetIds(shot, bindings);
    const promptShot = promptByShot.get(shot.shotId);

    return {
      shotId: shot.shotId,
      duration: Number(shot.durationSec.toFixed(2)),
      track: `SR-S${String(index + 1).padStart(2, "0")}`,
      prompt: promptShot?.resolvedPrompt || shot.reusableStructure || shot.sourceStructure || shot.shotPurpose || "structural remake shot",
      videoDesc,
      rawPrompt: promptShot?.rawPrompt,
      resolvedPrompt: promptShot?.resolvedPrompt,
      negativePrompt: promptShot?.negativePrompt,
      promptMeta: promptShot
        ? {
            sourceTimeRange: promptShot.sourceTimeRange,
            referenceFrames: promptShot.referenceFrames,
            assetSlots: promptShot.assetSlots,
            warnings: promptShot.warnings,
            validationStatus: promptShot.validationStatus,
          }
        : undefined,
      state: "未生成",
      src: null,
      shouldGenerateImage: 0 as const,
      associateAssetsIds: assetIds,
    };
  });

  const next = RegeneratedStoryboardSchema.parse({
    taskId,
    version: nextVersion,
    rows,
    promptPackage,
  });
  await saveRegeneratedStoryboard(taskId, next);
  return next;
}
