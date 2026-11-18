import type { AssetItemType, SceneAsset } from "./sceneDocument";

export function isVegetationAsset(asset: Pick<SceneAsset, "category" | "name" | "itemType">) {
  // 优先使用目录类型；旧资产回退名称识别，避免把已标注的动物、岩石当成植物。
  return asset.category === "自然" && (asset.itemType ? asset.itemType === "植物" : /树|杉|松|柏|桦|枫|樱|棕榈|灌木|草|植被|蕨/.test(asset.name));
}

export function getAssetItemType(asset: Pick<SceneAsset, "category" | "name" | "itemType">): AssetItemType {
  if (asset.itemType) return asset.itemType;
  if (asset.category === "建筑") return "建筑";
  if (/岩|石组|风蚀石|尖晶|晶簇|矿物/.test(asset.name)) return "岩石";
  if (asset.category === "自然") return "植物";
  if (/车|舟|船|艇|摩托|飞艇|飞行|无人机|机器人|雪橇|滑板/.test(asset.name)) return "交通";
  if (/灯|烛台/.test(asset.name)) return "灯具";
  if (/桌|椅|凳|床|柜|书架|置物架|屏风|箪笥|坐榻|沙发|工位|茶几|岛台/.test(asset.name)) return "家具";
  if (/机|泵|电|信号|充电|路障|闸|轨|罐架|净水|集雨|消防|升降|工具台|清洗台|炉灶|站点|探针|终端|路牌|垃圾|回收|配电|控制|信标/.test(asset.name)) return "设施";
  if (/门|窗|墙|柱|栏|梁|棚布|帐布|支架|瓦|踏步|地板|铺装/.test(asset.name)) return "构件";
  return "器物";
}

export function getAssetPlacementScale(asset: SceneAsset, size: { x: number; y: number; z: number }) {
  const extent = Math.max(size.x, size.y, size.z);
  if (asset.provider !== "objaverse") return 3 / extent;
  const words = `${asset.name} ${(asset.tags ?? []).join(" ")}`.toLowerCase();
  const rules: [RegExp, number, "height" | "extent"][] = [
    [/\b(?:bonsai|sapling|bush|shrub)\b/, 1.2, "height"],
    [/\b(?:tree|palm|oak|pine|cypress|spruce)\b/, 7, "height"],
    [/\b(?:chair|stool|armchair)\b/, 0.95, "height"],
    [/\b(?:bench|sofa|couch|bed)\b/, 2, "extent"],
    [/\b(?:table|desk)\b/, 0.76, "height"],
    [/\b(?:car|sedan|suv|taxi)\b/, 4.4, "extent"],
    [/\b(?:truck|bus|van)\b/, 7, "extent"],
    [/\b(?:bicycle|bike|motorcycle)\b/, 1.8, "extent"],
    [/\b(?:person|human|man|woman|character|soldier)\b/, 1.75, "height"],
    [/\b(?:cup|mug|glass|bottle|can)\b/, 0.23, "height"],
  ];
  const rule = rules.find(([pattern]) => pattern.test(words));
  // ACT: Objaverse没有可靠米制单位，按明确品类给初始估算；保留自由缩放，不能当作实测尺寸。
  if (rule) return rule[1] / (rule[2] === "height" ? Math.max(size.y, extent * 0.05) : extent);
  const nominalExtent: Partial<Record<AssetItemType, number>> = { 建筑: 8, 家具: 1.4, 交通: 4.4, 灯具: 1.6, 植物: 2, 岩石: 1.5, 构件: 2, 人物: 1.75, 动物: 1, 食品: 0.25, 服饰: 0.7, 乐器: 1, 运动用品: 0.7, 电子设备: 0.5 };
  return (nominalExtent[getAssetItemType(asset)] ?? 1) / extent;
}
