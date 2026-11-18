import { architectureAssets, createArchitectureModel } from "./architectureCatalog";
import { objectAssets, createObjectModel } from "./objectCatalog";
import { natureAssets, createNatureModel } from "./natureCatalog";
import { masterArchitectureAssets, createMasterArchitectureModel } from "./masterArchitecture/catalog";
import { masterObjectAssets, createMasterObjectModel } from "./masterObjects/catalog";
import { masterNatureAssets, createMasterNatureModel } from "./masterNature/catalog";
import { masterTransportAssets, createMasterTransportModel } from "./masterTransport/catalog";
import type { SceneAsset } from "./sceneDocument";

const packs = [architectureAssets, objectAssets, natureAssets, masterArchitectureAssets, masterObjectAssets, masterNatureAssets, masterTransportAssets];
const localDesigns = Array.from({ length: Math.max(...packs.map(pack => pack.length)) }, (_, index) => packs.flatMap(pack => pack[index] ? [pack[index]!] : [])).flat();
export const localAssets = localDesigns.filter(asset => !asset.variantOf);
const localAssetsById = new Map(localDesigns.map(asset => [asset.id, asset]));
if (localAssetsById.size !== localDesigns.length) throw new Error("本地素材定义 ID 重复");
const derivatives = new Map<string, SceneAsset[]>();
for (const asset of localDesigns) if (asset.variantOf) {
  const values = derivatives.get(asset.variantOf) ?? [];
  values.push(asset);
  derivatives.set(asset.variantOf, values);
}
const builders = {
  architecture: createArchitectureModel, objects: createObjectModel, nature: createNatureModel,
  masterArchitecture: (design: number) => createMasterArchitectureModel(`masterArchitecture${String(design).padStart(4, "0")}`),
  masterObjects: createMasterObjectModel, masterNature: createMasterNatureModel, masterTransport: createMasterTransportModel,
};

export function getLocalAssetDerivatives(asset: SceneAsset) {
  return asset.variantOf ? [] : derivatives.get(asset.id) ?? [];
}

export function createLocalAssetModel(asset: SceneAsset) {
  const blueprint = asset.blueprint;
  if (!blueprint) return;
  const registered = localAssetsById.get(asset.id)?.blueprint;
  if (!registered || registered.pack !== blueprint.pack || registered.design !== blueprint.design || blueprint.revision !== 1) throw new Error("本地造型蓝图与素材目录不一致");
  return builders[blueprint.pack](blueprint.design);
}
