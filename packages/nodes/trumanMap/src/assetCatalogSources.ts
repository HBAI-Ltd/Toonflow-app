import { themedAssets } from "./themedAssets";
import { industrialStyleAssets } from "./industrialStyleAssets";
import { wastelandAssets } from "./wastelandAssets";
import { getAssetItemType } from "./assetMetadata";
import { refineSourceModel } from "./masterArchitecture/legacyBuildings";
import type { SceneAsset } from "./sceneDocument";

// 新题材在独立模块定义，仅在此注册；目录构建不创建 Three.js 几何。
export const assetPacks = [themedAssets, industrialStyleAssets, wastelandAssets];
// 旧库里手写的建筑在登记时统一细化（屋面、门窗、线脚、梁枋等）；款式和状态变化都由细化后的模型派生，
// 所以最多细化到 100 个部件，给款式配件和破损状态留出余量。
const refined = (asset: SceneAsset): SceneAsset => asset.model && getAssetItemType(asset) === "建筑" ? { ...asset, model: refineSourceModel(asset.model, asset.theme, asset.name) } : asset;
export const sourceAssets = assetPacks.flat().map(refined);
export const sourceAssetsById = new Map(sourceAssets.map(asset => [asset.id, asset]));
if (sourceAssetsById.size !== sourceAssets.length || sourceAssets.some(asset => !asset.model)) throw new Error("内置素材源须有独立 ID 和模型定义");
