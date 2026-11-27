import { markMessages } from "@toonflow/i18n/vue";
import type { ModelDefinition } from "./modelGeometry";
import type { SceneLife, SceneNavigation } from "./lifeDocument";
import type { SceneCamera } from "./cameraDocument";
export type { SceneCamera } from "./cameraDocument";

export type Vector3Value = { x: number; y: number; z: number };
export type SceneAnchor = { kind: "point"; position: Vector3Value } | { kind: "object"; objectId: string; position: Vector3Value };
export const primitiveShapes = ["box", "cuboid", "sphere", "cylinder", "cone", "frustum", "torus", "plane", "disc", "pyramid", "capsule", "person", "seatedPerson", "kneelingPerson", "riggedPerson", "backdrop"] as const;
export type PrimitiveShape = typeof primitiveShapes[number];
export type AssetCategory = "全部" | "自然" | "道具" | "建筑" | "基础" | "本地" | "生成";
export const assetThemes = markMessages(["中式", "日式", "欧式", "异域", "现代", "奇幻", "科幻", "蒸汽朋克", "赛博朋克", "废土"] as const);
export type AssetTheme = typeof assetThemes[number];
export const assetStates = markMessages(["原始", "老旧", "破损", "废弃"] as const);
export type AssetState = typeof assetStates[number];
export const assetItemTypes = markMessages(["建筑", "家具", "交通", "灯具", "器物", "设施", "植物", "岩石", "构件", "人物", "动物", "食品", "服饰", "乐器", "运动用品", "电子设备"] as const);
export type AssetItemType = typeof assetItemTypes[number];
export const assetBlueprintPacks = ["architecture", "objects", "nature", "masterArchitecture", "masterObjects", "masterNature", "masterTransport"] as const;
export type SceneAsset = {
  id: string;
  name: string;
  category: AssetCategory;
  theme?: AssetTheme;
  state?: AssetState;
  itemType?: AssetItemType;
  variantOf?: string;
  recipe?: { sourceId: string; variant: number; state: AssetState; revision: 1 };
  blueprint?: { pack: typeof assetBlueprintPacks[number]; design: number; revision: 1 };
  provider?: "objaverse";
  sha256?: string;
  author?: string;
  authorUrl?: string;
  licenseUrl?: string;
  kind: "primitive" | "model";
  shape?: PrimitiveShape;
  url?: string;
  path?: string;
  thumbnail?: string;
  tags?: string[];
  sourceUrl?: string;
  license?: string;
  bytes?: number;
  normalize?: boolean;
  contentTransform?: { offset: Vector3Value; scale: number };
  model?: ModelDefinition;
  kiln?: { programId: string; revisionId: string; sourcePath: string; glbSha256: string; deliveryPath: string };
};
export type SceneObject = {
  id: string;
  name: string;
  asset: SceneAsset;
  position: Vector3Value;
  rotation: Vector3Value;
  scale: Vector3Value;
  color: string;
  visible: boolean;
  height?: number;
  gravityEnabled?: boolean;
  navigation?: SceneNavigation;
};
export type EditorView = { position: Vector3Value; target: Vector3Value; fov?: number };
export type SceneAtmosphere = { enabled: boolean; intensity: number; start: number; distance: number; color: string; weatherInfluence: number };
export const defaultAtmosphere: SceneAtmosphere = { enabled: false, intensity: 0.6, start: 10, distance: 160, color: "#b7cddd", weatherInfluence: 1 };
export type SceneTerrain = {
  size: number;
  segments: number;
  heights: number[];
  surfaces: number[];
  surfaceBlend?: { surfaces: number[]; weights: number[] };
  surfacePaint?: { segments: number; data: string; styles?: { surface: number; color: string }[] };
  surfaceColors?: Record<string, string>;
  waterLevels?: (number | null)[];
  waterColors?: Record<string, string>;
  removedTrees?: number[];
  seed: number;
};
export type SceneLighting = {
  sunIntensity: number;
  sunAzimuth: number;
  sunElevation: number;
  sunColor: string;
  ambientIntensity: number;
  ambientColor: string;
  skyIntensity: number;
  exposure: number;
  weatherInfluence: number;
};
export type SceneTime = {
  date: string;
  hour: number;
  latitude: number;
  longitude?: number;
  utcOffset?: number;
  northOffset: number;
  speed: number;
  paused: boolean;
  moonIntensity: number;
  starIntensity: number;
  moonPhase?: number;
};
export type SceneWeatherLayers = {
  clouds: number;
  rain: number;
  snow: number;
  fog: number;
  hail?: number;
  thunder?: number;
  dust?: number;
  sandstorm?: number;
  haze?: number;
  blizzard?: number;
  aurora?: number;
  rainbow?: number;
  meteors?: number;
};
export type SceneWeather = {
  condition: "clear" | "cloudy" | "rain" | "snow" | "fog";
  timeOfDay: "day" | "sunset" | "night";
  hour?: number;
  intensity: number;
  wind: number;
  windDirection?: number;
  layers?: SceneWeatherLayers;
  auroraColor?: string;
  auroraDirection?: number;
  lighting?: Partial<SceneLighting>;
};
export type SceneObjectGroup = { id: string; name: string; objectIds: string[] };
/** 时间轴分组：items是轨道的行key（camera:机位ID / track:动线ID）。 */
export type TimelineFolder = { id: string; name: string; collapsed?: boolean; items: string[] };
export type SceneDocument = {
  version: 1;
  objects: SceneObject[];
  objectGroups?: SceneObjectGroup[];
  cameras?: SceneCamera[];
  timeline?: { folders?: TimelineFolder[] };
  view: EditorView;
  gridVisible: boolean;
  display?: { axesVisible?: boolean; shadowsEnabled?: boolean };
  /** 成片画幅，默认16:9。 */
  film?: { format?: "16:9" | "2.39:1" | "1.85:1" | "4:3" | "9:16" };
  atmosphere?: SceneAtmosphere;
  terrain?: SceneTerrain;
  time?: SceneTime;
  weather?: SceneWeather;
  life?: SceneLife;
};
export type EditorTool = "select" | "translate" | "rotate" | "scale";
export function sharesSceneContent(a: SceneDocument, b: SceneDocument) {
  return a.objects === b.objects && a.objectGroups === b.objectGroups && a.cameras === b.cameras && a.terrain === b.terrain && a.life === b.life && a.weather === b.weather;
}

export function createSceneDocument(): SceneDocument {
  return {
    version: 1,
    objects: [],
    view: { position: { x: 9, y: 7, z: 11 }, target: { x: 0, y: 0.5, z: 0 } },
    gridVisible: false,
  };
}

export function createSceneObject(asset: SceneAsset, position: Vector3Value): SceneObject {
  return {
    id: crypto.randomUUID(), name: asset.name, asset: { ...asset }, position: { ...position },
    rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, color: "#bac5d3", visible: true, height: position.y, gravityEnabled: true,
  };
}

export function getObjectGravityEnabled(object: Pick<SceneObject, "gravityEnabled">) {
  return object.gravityEnabled ?? true;
}

