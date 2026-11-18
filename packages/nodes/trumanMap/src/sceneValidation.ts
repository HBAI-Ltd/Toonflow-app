import { z } from "@toonflow/nodes-scaffold/runtime";
import { assetThemes, assetStates, assetItemTypes, assetBlueprintPacks, primitiveShapes, type SceneDocument } from "./sceneDocument";
import { modelSchema } from "./modelGeometry";
import { cameraTrackSchema } from "./cameraDocument";
import { navigationSchema, sceneLifeSchema } from "./lifeDocument";
import { getObjaverseUid, isAssetAuthorUrl, isAssetLicenseUrl, isAssetModelUrl, isAssetSourceUrl, isAssetThumbnailUrl } from "./assetLibrary";
import { worldSizeLimits } from "./terrainModel";
import { terrainSurfaceMaxId } from "./terrainSurfaces";
import { terrainPaintMaxEncodedLength, validateTerrainPaint } from "./terrainPaint";
import { validatePerformanceReferences } from "./performanceDocument";

// ACT: 编辑器每次提交都整份校验文档；AI 模型顶点、地形网格动辄几 MB，却几乎每次都原样沿用上一份已校验的对象。
// 校验结果按对象记下，同一个对象再来直接放行（文档按快照替换，不原地改），新对象照常完整校验、报错路径不变。
function reuseValidated<T extends z.ZodType>(schema: T) {
  const validated = new WeakSet<object>();
  return z.unknown().transform((value, context): z.output<T> => {
    if (value && typeof value === "object" && validated.has(value)) return value as z.output<T>;
    const result = schema.safeParse(value);
    if (!result.success) {
      for (const issue of result.error.issues) context.addIssue({ ...issue, input: value } as never);
      return z.NEVER;
    }
    if (result.data && typeof result.data === "object") validated.add(result.data);
    return result.data;
  });
}

const coordinate = z.number().finite().min(-10000).max(10000);
const vector = z.strictObject({ x: coordinate, y: coordinate, z: coordinate });
export const sceneViewSchema = z.strictObject({ position: vector, target: vector, fov: z.number().finite().min(10).max(120).optional() });
const scale = z.number().finite().min(0.001).max(1000);
const identifier = z.string().min(1).max(160);
const color = z.string().regex(/^#[\da-f]{6}$/i, "颜色必须是 #rrggbb 格式");
export const sceneAtmosphereSchema = z.strictObject({ enabled: z.boolean(), intensity: z.number().finite().min(0).max(2), start: z.number().finite().min(0).max(2000), distance: z.number().finite().min(10).max(4000), color, weatherInfluence: z.number().finite().min(0).max(1) });

export const sceneLightingSchema = z.strictObject({
  sunIntensity: z.number().finite().min(0).max(10).optional().describe("太阳/月亮主光的基础强度，0关闭；最终受天气联动衰减"),
  sunAzimuth: z.number().finite().min(0).max(360).optional().describe("光源来向：0度东+X，90度南+Z，180度西-X，270度北-Z"),
  sunElevation: z.number().finite().min(0).max(90).optional().describe("光源相对水平面的高度角，0度地平线，90度头顶"),
  sunColor: color.optional().describe("主光的基础颜色，天气联动可冷却或去饱和"),
  ambientIntensity: z.number().finite().min(0).max(3).optional().describe("环境补光的基础强度，0关闭"),
  ambientColor: color.optional().describe("环境补光的基础颜色"),
  skyIntensity: z.number().finite().min(0).max(5).optional().describe("天空半球散射光的基础强度，0关闭"),
  exposure: z.number().finite().min(0.1).max(3).optional().describe("画面基础曝光倍数"),
  weatherInfluence: z.number().finite().min(0).max(1).optional().describe("天气对光照的影响程度，缺省1；0保留手动光照，雨雪雾本身仍生效"),
});

export const sceneTimeSchema = z.strictObject({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期须为 YYYY-MM-DD").refine(value => {
    const [year, month, day] = value.split("-").map(Number);
    if (year! < 1900 || year! > 2200 || month! < 1 || month! > 12 || day! < 1 || day! > 31) return false;
    const date = new Date(Date.UTC(year!, month! - 1, day!));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day;
  }, "日期必须是 1900–2200 年内的真实日历日期"),
  hour: z.number().finite().min(0).max(24),
  latitude: z.number().finite().min(-89).max(89),
  longitude: z.number().finite().min(-180).max(180).optional().describe("场景经度，东经为正，西经为负"),
  utcOffset: z.number().finite().min(-12).max(14).optional().describe("当地民用时间相对UTC的固定小时偏移；显式设置夏令时，不自动随日期切换"),
  northOffset: z.number().finite().min(0).max(360),
  speed: z.number().finite().min(1).max(3600),
  paused: z.boolean(),
  moonIntensity: z.number().finite().min(0).max(2),
  starIntensity: z.number().finite().min(0).max(2),
  moonPhase: z.number().finite().min(0).max(1).optional().describe("0新月、0.25上弦、0.5满月、0.75下弦；省略按日期自动计算"),
});

const weatherWeight = z.number().finite().min(0).max(1);
export const sceneWeatherLayersSchema = z.strictObject({
  clouds: weatherWeight, rain: weatherWeight, snow: weatherWeight, fog: weatherWeight,
  hail: weatherWeight.optional(), thunder: weatherWeight.optional(), dust: weatherWeight.optional(),
  sandstorm: weatherWeight.optional(), haze: weatherWeight.optional(), blizzard: weatherWeight.optional(),
  aurora: weatherWeight.optional(), rainbow: weatherWeight.optional(), meteors: weatherWeight.optional(),
});
export const sceneWeatherLayersPatchSchema = sceneWeatherLayersSchema.partial().refine(value => Object.values(value).some(item => item !== undefined), "至少提供一个天气层");

function isWorkspaceModel(value: string) {
  return value.startsWith("assets/") && /\.glb$/i.test(value) && value.length <= 1024
    && value.split("/").every(part => !!part && part !== "." && part !== ".." && !/[\\<>:"|?*%\x00-\x1f]/.test(part));
}

const asset = z.strictObject({
  id: identifier,
  name: z.string().min(1).max(160),
  category: z.enum(["全部", "自然", "道具", "建筑", "基础", "本地", "生成"]),
  theme: z.enum(assetThemes).optional(),
  state: z.enum(assetStates).optional(),
  itemType: z.enum(assetItemTypes).optional(),
  tags: z.array(z.string().max(160)).max(64).optional(),
  variantOf: identifier.optional(),
  recipe: z.strictObject({ sourceId: identifier, variant: z.number().int().min(0).max(26), state: z.enum(assetStates), revision: z.literal(1) }).optional(),
  blueprint: z.strictObject({ pack: z.enum(assetBlueprintPacks), design: z.number().int().min(0).max(99999), revision: z.literal(1) }).superRefine((value, context) => {
    const limit = { architecture: 7000, objects: 8000, nature: 4518, masterArchitecture: 100000, masterObjects: 100000, masterNature: 100000, masterTransport: 100000 }[value.pack];
    if (value.design >= limit) context.addIssue({ code: "custom", message: "本地造型超出所属素材包范围" });
  }).optional(),
  kind: z.enum(["primitive", "model"]),
  shape: z.enum(primitiveShapes).optional(),
  url: z.string().max(2048).refine(isAssetModelUrl, "仅支持固定版本 Holodeck 或 Objaverse 资产库中的 GLB 模型").optional(),
  path: z.string().refine(isWorkspaceModel, "本地模型必须是 assets/ 内的 GLB 文件").optional(),
  thumbnail: z.string().max(2048).refine(isAssetThumbnailUrl, "缩略图地址不在允许的资产源内").optional(),
  sourceUrl: z.string().max(2048).refine(isAssetSourceUrl, "资产来源地址无效").optional(),
  provider: z.literal("objaverse").optional(),
  sha256: z.string().regex(/^[a-f\d]{64}$/).optional(),
  author: z.string().min(1).max(300).optional(),
  authorUrl: z.string().max(2048).refine(isAssetAuthorUrl, "作者地址不在允许的来源内").optional(),
  licenseUrl: z.string().max(2048).refine(isAssetLicenseUrl, "许可地址无效").optional(),
  license: z.string().max(2000).optional(),
  bytes: z.number().int().min(1).max(100 * 1024 * 1024).optional(),
  normalize: z.boolean().optional(),
  contentTransform: z.strictObject({ offset: vector, scale }).optional(),
  model: reuseValidated(modelSchema).optional(),
  kiln: z.strictObject({
    programId: z.uuid(),
    revisionId: z.string().regex(/^[a-f\d]{64}$/),
    glbSha256: z.string().regex(/^[a-f\d]{64}$/),
    deliveryPath: z.string().max(1024).refine(value => value.startsWith("assets/") && /\.json$/.test(value)
      && value.split("/").every(part => !!part && part !== "." && part !== ".." && !/[\\<>:"|?*%\x00-\x1f]/.test(part)), "Kiln 交付记录必须位于工作区 assets/ 内"),
    sourcePath: z.string().max(1024).refine(value => value.startsWith("assets/") && /\.(?:mjs|json)$/.test(value)
      && value.split("/").every(part => !!part && part !== "." && part !== ".." && !/[\\<>:"|?*%\x00-\x1f]/.test(part)), "Kiln 源码必须位于工作区 assets/ 内"),
  }).optional(),
}).superRefine((value, context) => {
  const objaverseUid = value.url ? getObjaverseUid(value.url) : undefined;
  if (objaverseUid && value.provider !== "objaverse") context.addIssue({ code: "custom", message: "Objaverse 在线模型必须登记来源与完整性信息" });
  if (value.provider === "objaverse") {
    const sourceUid = value.sourceUrl?.match(/^https:\/\/sketchfab\.com\/3d-models\/(?:[a-z\d_-]+-)?([a-f\d]{32})\/?$/i)?.[1];
    if (value.kind !== "model" || !value.sha256 || !value.bytes || value.bytes <= 20 || value.bytes > 50 * 1024 * 1024 || (!value.path && !objaverseUid) || !sourceUid || (objaverseUid && sourceUid !== objaverseUid) || value.model || value.recipe || value.blueprint || value.kiln) {
      context.addIssue({ code: "custom", message: "Objaverse 模型须保留固定来源、实际大小、SHA256 与对应来源页" });
    }
    if (value.thumbnail && !value.thumbnail.startsWith(`https://media.sketchfab.com/models/${sourceUid}/thumbnails/`)) context.addIssue({ code: "custom", message: "Objaverse 缩略图与模型 UID 不一致" });
  }
  if (value.blueprint && (value.kind !== "model" || value.url || value.model || value.recipe || value.kiln || value.provider)) context.addIssue({ code: "custom", message: "本地造型蓝图不能混用其他模型来源" });
  if (value.kiln && (value.kind !== "model" || !value.path || value.model || value.recipe || value.blueprint)) {
    context.addIssue({ code: "custom", message: "Kiln 来源只适用于已导出的工作区 GLB 模型" });
  }
  if (value.kind === "primitive" ? !value.shape || !!value.url || !!value.path || !!value.model || !!value.recipe || !!value.blueprint : !!value.shape || Number(!!value.url) + Number(!!value.path || !!value.model || !!value.recipe || !!value.blueprint) !== 1) {
    context.addIssue({ code: "custom", message: "基础资产须指定形状；模型资产须指定唯一在线来源或本地模型、配方" });
  }
});

const documentSchema = z.strictObject({
  version: z.literal(1),
  objects: z.array(z.strictObject({
    id: identifier,
    name: z.string().min(1).max(160),
    asset,
    position: vector,
    rotation: vector,
    scale: z.strictObject({ x: scale, y: scale, z: scale }),
    color,
    visible: z.boolean(),
    height: coordinate.optional(),
    gravityEnabled: z.boolean().optional(),
    navigation: navigationSchema.optional(),
  })).refine(objects => new Set(objects.map(object => object.id)).size === objects.length, "场景物体 ID 不能重复"),
  objectGroups: z.array(z.strictObject({
    id: identifier,
    name: z.string().trim().min(1).max(160),
    objectIds: z.array(identifier),
  })).optional(),
  cameras: z.array(cameraTrackSchema).max(24).refine(cameras => new Set(cameras.map(camera => camera.id)).size === cameras.length, "摄像机ID不能重复").optional(),
  timeline: z.strictObject({
    folders: z.array(z.strictObject({ id: identifier, name: z.string().trim().min(1).max(40), collapsed: z.boolean().optional(), items: z.array(z.string().min(1).max(200)).max(512) })).max(32)
      .refine(folders => new Set(folders.map(folder => folder.id)).size === folders.length, "时间轴分组ID不能重复").optional(),
  }).optional(),
  view: sceneViewSchema,
  gridVisible: z.boolean(),
  display: z.strictObject({ axesVisible: z.boolean().optional(), shadowsEnabled: z.boolean().optional() }).optional(),
  film: z.strictObject({ format: z.enum(["16:9", "2.39:1", "1.85:1", "4:3", "9:16"]).optional() }).optional(),
  atmosphere: sceneAtmosphereSchema.optional(),
  life: sceneLifeSchema.optional(),
  terrain: reuseValidated(z.strictObject({
    size: z.number().finite().min(worldSizeLimits.min).max(worldSizeLimits.max),
    segments: z.number().int().min(64).max(256),
    heights: z.array(z.number().finite().min(-12).max(40)).min(4225).max(66049),
    surfaces: z.array(z.number().int().min(0).max(terrainSurfaceMaxId)).min(4225).max(66049),
    surfaceBlend: z.strictObject({
      surfaces: z.array(z.number().int().min(0).max(terrainSurfaceMaxId)).min(4225).max(66049),
      weights: z.array(z.number().finite().min(0).max(1)).min(4225).max(66049),
    }).optional(),
    surfacePaint: z.strictObject({ segments: z.union([z.literal(256), z.literal(512), z.literal(1024)]), data: z.string().min(1).max(terrainPaintMaxEncodedLength), styles: z.array(z.strictObject({ surface: z.number().int().min(0).max(terrainSurfaceMaxId), color })).min(1).max(256).optional() }).superRefine((paint, context) => {
      const message = validateTerrainPaint(paint);
      if (message) context.addIssue({ code: "custom", path: ["data"], message });
    }).optional(),
    surfaceColors: z.record(z.string().refine(key => /^(?:0|[1-9][0-9]*)$/.test(key) && Number(key) <= terrainSurfaceMaxId && Number(key) !== 38, "地表颜色ID无效"), color).optional(),
    waterColors: z.record(z.string().regex(/^(?:0|[1-9][0-9]{0,4})$/).refine(key => Number(key) <= 66048, "水色索引超出范围"), color).refine(colors => Object.keys(colors).length <= 66049, "水色记录超出预算").optional(),
    waterLevels: z.array(z.number().finite().min(-12).max(40).nullable()).min(4225).max(66049).optional(),
    removedTrees: z.array(z.number().int().min(0).max(66048)).max(16384).refine(indices => new Set(indices).size === indices.length, "移除的树木索引不能重复").optional(),
    seed: z.number().int().min(0).max(2147483647),
  }).superRefine((terrain, context) => {
    const count = (terrain.segments + 1) ** 2;
    for (const field of ["heights", "surfaces", "waterLevels"] as const) {
      if (terrain[field] && terrain[field].length !== count) context.addIssue({ code: "custom", path: [field], message: "地形数据长度须与分段数一致" });
    }
    for (const field of ["surfaces", "weights"] as const) {
      if (terrain.surfaceBlend && terrain.surfaceBlend[field].length !== count) context.addIssue({ code: "custom", path: ["surfaceBlend", field], message: "混合地表长度须与分段数一致" });
    }
    if (terrain.waterColors && Object.keys(terrain.waterColors).some(key => Number(key) >= count)) context.addIssue({ code: "custom", path: ["waterColors"], message: "水色索引须在地形网格范围内" });
    if (terrain.removedTrees?.some(index => index >= count)) context.addIssue({ code: "custom", path: ["removedTrees"], message: "移除的树木索引超出地形范围" });
  })).optional(),
  time: sceneTimeSchema.optional(),
  weather: z.strictObject({
    condition: z.enum(["clear", "cloudy", "rain", "snow", "fog"]),
    timeOfDay: z.enum(["day", "sunset", "night"]),
    hour: z.number().finite().min(0).max(24).optional(),
    intensity: z.number().finite().min(0).max(1),
    wind: z.number().finite().min(0).max(1),
    windDirection: z.number().finite().min(0).max(360).optional(),
    lighting: sceneLightingSchema.optional(),
    layers: sceneWeatherLayersSchema.optional(),
    auroraColor: color.optional(),
    auroraDirection: z.number().finite().min(0).max(360).optional(),
  }).optional(),
}).superRefine((document, context) => {
  const objectIds = new Set(document.objects.map(object => object.id));
  const groupIds = new Set<string>();
  const groupedObjects = new Set<string>();
  const skeletalTracks = document.life?.tracks ?? [];
  if (skeletalTracks.length) {
    try { validatePerformanceReferences(skeletalTracks, document.objects, document.objectGroups); }
    catch (error) { context.addIssue({ code: "custom", path: ["life", "tracks"], message: error instanceof Error ? error.message : "骨骼动作引用无效" }); }
  }
  for (const [index, group] of (document.objectGroups ?? []).entries()) {
    if (groupIds.has(group.id)) context.addIssue({ code: "custom", path: ["objectGroups", index, "id"], message: "场景分组 ID 不能重复" });
    groupIds.add(group.id);
    for (const [member, id] of group.objectIds.entries()) {
      const path = ["objectGroups", index, "objectIds", member];
      if (!objectIds.has(id)) context.addIssue({ code: "custom", path, message: "分组引用的场景物体不存在" });
      if (groupedObjects.has(id)) context.addIssue({ code: "custom", path, message: "同一场景物体只能属于一个分组，不能重复加入" });
      groupedObjects.add(id);
    }
  }
});

export function parseSceneDocument(value: unknown): SceneDocument {
  return documentSchema.parse(value);
}
