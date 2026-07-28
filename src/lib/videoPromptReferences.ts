export type VideoReferenceMediaType = "image" | "video" | "audio";

export interface VideoPromptAssetReference {
  id: number;
  type: string | null;
  name: string | null;
  filePath: string | null;
  mediaType?: string | null;
}

export function isSeedance2Model(modelName: string | null | undefined): boolean {
  const normalized = (modelName ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return /(?:^|-)seedance(?:-[a-z]+)*-?2(?:-0)?(?=$|-[a-z])/.test(normalized);
}

export function resolveVideoReferenceMediaType(
  mediaType: string | null | undefined,
  assetType: string | null | undefined,
  filePath?: string | null,
): VideoReferenceMediaType {
  if (mediaType === "video" || mediaType === "audio") return mediaType;
  if (assetType === "video") return "video";
  if (assetType === "audio") return "audio";

  const normalizedPath = (filePath ?? "").split(/[?#]/, 1)[0].toLowerCase();
  if (/\.(mp4|webm)$/.test(normalizedPath)) return "video";
  if (/\.(mp3|wav|m4a|aiff?|flac|ogg|aac)$/.test(normalizedPath)) return "audio";

  return "image";
}

export function formatLegacyVideoPromptAssetList(
  assets: VideoPromptAssetReference[],
  linkedAudioAssetIds: Record<number, number> = {},
): string {
  return assets
    .filter((asset) => asset.filePath)
    .map(
      (asset) =>
        `[${asset.id},${asset.type ?? ""},${asset.name ?? ""}${linkedAudioAssetIds[asset.id] ? ` audio:${linkedAudioAssetIds[asset.id]}` : ""}]`,
    )
    .join("，");
}

export function buildSeedance2AssetReferenceContext(
  assets: VideoPromptAssetReference[],
  linkedAudioAssetIds: Record<number, number> = {},
): string {
  const referencedAssets = assets.filter((asset) => asset.filePath);
  const counters: Record<VideoReferenceMediaType, number> = {
    image: 0,
    video: 0,
    audio: 0,
  };
  const references = referencedAssets.map((asset) => {
    const mediaType = resolveVideoReferenceMediaType(asset.mediaType, asset.type, asset.filePath);
    const prefix = mediaType === "image" ? "@图片" : mediaType === "video" ? "@视频" : "@音频";
    return {
      id: asset.id,
      type: asset.type ?? "",
      name: asset.name ?? "",
      mediaType,
      referenceLabel: `${prefix}${++counters[mediaType]}`,
    };
  });

  return [
    `**资产信息**（角色、场景、道具、音频）:${formatLegacyVideoPromptAssetList(referencedAssets, linkedAudioAssetIds) || "无"}`,
    `**资产引用映射**（按媒体类型独立编号，referenceLabel 必须原样使用）:${JSON.stringify(references)}`,
  ].join("\n");
}
