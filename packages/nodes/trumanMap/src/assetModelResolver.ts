import { sourceAssetsById } from "./assetCatalogSources";
import { createParametricAssetModel } from "./parametricAssetModel";
import { createAssetStateVariant } from "./assetStateVariants";
import { modelSchema, type ModelDefinition } from "./modelGeometry";
import { assetStates, type SceneAsset } from "./sceneDocument";
import { createLocalAssetModel } from "./localAssetCatalog";
import { resolveBrushTree } from "./sceneBrushAssets";

const models = new Map<string, ModelDefinition>();

export function resolveAssetModel(asset: SceneAsset): ModelDefinition | undefined {
  if (asset.model) return asset.model;
  if (asset.blueprint) {
    const key = JSON.stringify([asset.id, asset.blueprint]);
    const cached = models.get(key);
    if (cached) { models.delete(key); models.set(key, cached); return cached; }
    const model = modelSchema.parse(createLocalAssetModel(asset));
    models.set(key, model);
    if (models.size > 64) models.delete(models.keys().next().value!);
    return model;
  }
  const recipe = asset.recipe;
  if (!recipe) return;
  const brushTree = resolveBrushTree(asset);
  if (brushTree) return brushTree;
  if (recipe.revision !== 1 || !Number.isInteger(recipe.variant) || recipe.variant < 0 || recipe.variant > 26 || !assetStates.includes(recipe.state)) throw new Error("素材配方无效或版本不受支持");
  const source = sourceAssetsById.get(recipe.sourceId);
  if (!source?.model) throw new Error("内置素材配方源不存在，请更新插件");
  const key = JSON.stringify([recipe.sourceId, recipe.variant, recipe.state, recipe.revision]);
  const cached = models.get(key);
  if (cached) { models.delete(key); models.set(key, cached); return cached; }
  const model = createParametricAssetModel(source, recipe.variant);
  const configured = { ...source, id: recipe.variant ? `${source.id}Variant${recipe.variant}` : source.id, name: recipe.variant ? `${source.name}·款式${String(recipe.variant).padStart(2, "0")}` : source.name, model };
  const result = modelSchema.parse(createAssetStateVariant(configured, recipe.state).model);
  // ACT: 只缓存最近 64 份 CPU 定义，不保留几何或 GPU 对象；保存后以实际 GLB 文件为准。
  models.set(key, result);
  if (models.size > 64) models.delete(models.keys().next().value!);
  return result;
}
