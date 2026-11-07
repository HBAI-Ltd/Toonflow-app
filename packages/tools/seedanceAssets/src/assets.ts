import { providerAssetIdSchema, providerAssetsSchema } from "@toonflow/tools-scaffold/runtime";
import { assetSchema, configSchema, requestAsset, type AssetConfig } from "./api";

const mediaTypes = { Image: "image", Video: "video", Audio: "audio" } as const;

export function assetSummary(value: unknown) {
  const asset = assetSchema.parse(value);
  return {
    id: providerAssetIdSchema.parse(asset.Id),
    mediaType: mediaTypes[asset.AssetType],
    status: asset.Status,
    ...(asset.Name ? { name: asset.Name.slice(0, 64) } : {}),
    ...(asset.GroupId ? { groupId: providerAssetIdSchema.parse(asset.GroupId) } : {}),
    ...(asset.ProjectName ? { projectName: asset.ProjectName } : {}),
    ...(asset.Error?.Code && /^[a-zA-Z0-9_.-]{1,128}$/.test(asset.Error.Code) ? { errorCode: asset.Error.Code } : {}),
  };
}

export async function resolveAssets(config: AssetConfig, input: unknown, signal?: AbortSignal) {
  const parsedConfig = configSchema.parse(config);
  const assets = providerAssetsSchema.parse(input);
  return Promise.all(assets.map(async item => {
    const result = assetSchema.parse(await requestAsset(parsedConfig, "GetAsset", { Id: item.id }, signal));
    if (result.Id !== item.id || result.ProjectName !== parsedConfig.projectName || mediaTypes[result.AssetType] !== item.mediaType) {
      throw new Error(`素材 ${item.id} 的 ID、项目或类型与所选内容不一致，请重新查询`);
    }
    if (result.Status !== "Active") throw new Error(`素材 ${item.id} 当前状态为 ${result.Status}，尚不能用于视频生成`);
    return { id: item.id, mediaType: item.mediaType, ...(result.Name ? { name: result.Name.slice(0, 64) } : {}) };
  }));
}
