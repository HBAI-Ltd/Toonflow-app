import { part, asset, pitchedRoof, beam, crystal, type ModelPart, type Triple } from "./assetModelParts";
import type { SceneAsset } from "./sceneDocument";

const steel = "#78817b";
const darkMetal = "#444b4b";
const sand = "#b1a38a";
const concrete = "#96978b";
const wood = "#887151";
const rubber = "#353c3b";
const canvas = "#9a9b7d";
const blue = "#708f91";
const amber = "#b99963";
const olive = "#747e68";

function wheels(parts: ModelPart[], halfTrack: number, axles: number[], radius = 0.42) {
  for (const side of [-1, 1]) for (const z of axles) parts.push(part("橡胶行走轮", "cylinder", rubber, [side * halfTrack, radius, z], [radius * 2, 0.22, radius * 2], [0, 0, 90]), part("金属轮毂", "cylinder", steel, [side * (halfTrack + 0.12), radius, z], [radius * 1.1, 0.035, radius * 1.1], [0, 0, 90]));
}

function drumParts(name: string, color: string, position: Triple, diameter = 0.65, height = 0.95): ModelPart[] {
  const parts = [part(`${name}桶身`, "cylinder", color, position, [diameter, height, diameter], [0, 0, 0], { metalness: 0.35, roughness: 0.72 })];
  for (const offset of [-height * 0.37, height * 0.37]) parts.push(part(`${name}加强箍`, "torus", darkMetal, [position[0], position[1] + offset, position[2]], [diameter * 1.02, diameter * 1.02, 0.07], [90, 0, 0]));
  return parts;
}

function patchedShack() {
  const parts = [part("棚屋地台", "box", wood, [0, 0.12, 0], [3.8, 0.24, 3.4]), part("完整后墙", "box", steel, [0, 1.35, -1.55], [3.6, 2.45, 0.1]), part("斜置铁皮屋盖", "box", olive, [0, 2.65, 0], [4, 0.1, 3.8], [7, 0, 0]), part("前门", "box", "#756c55", [-0.55, 1.2, 1.57], [0.85, 2.05, 0.09]), part("门右侧墙", "box", sand, [0.95, 1.35, 1.57], [1.5, 2.45, 0.1]), part("通风窗", "box", blue, [0.95, 1.7, 1.64], [0.75, 0.6, 0.04])];
  for (const x of [-1.75, 1.75]) parts.push(part("棚屋侧墙", "box", sand, [x, 1.35, 0], [0.1, 2.45, 3.2]));
  for (let index = 0; index < 9; index++) parts.push(part("屋面压条", "box", darkMetal, [-1.8 + index * 0.45, 2.72, 0], [0.035, 0.04, 3.7], [7, 0, 0]));
  for (const x of [-1.65, 1.65]) for (const z of [-1.48, 1.48]) parts.push(part("棚屋木柱", "box", wood, [x, 1.36, z], [0.12, 2.5, 0.12]));
  return asset("wastePatchedShack", "拼装棚屋", "废土", "建筑", parts, { itemType: "建筑" });
}

function outpostTower() {
  const parts = [part("岗塔观测平台", "box", steel, [0, 3.2, 0], [2.8, 0.18, 2.6]), part("岗塔护顶", "box", sand, [0, 5.2, 0], [3.2, 0.1, 3]), part("观测后挡板", "box", olive, [0, 4, -1.15], [2.5, 1.4, 0.09])];
  for (const x of [-1.12, 1.12]) for (const z of [-1.02, 1.02]) parts.push(beam("岗塔承重脚", wood, [x * 1.3, 0.05, z * 1.3], [x, 5.15, z], 0.16));
  for (const side of [-1, 1]) parts.push(beam("塔脚交叉撑", darkMetal, [-1.4, 0.2, side * 1.25], [1.12, 3.15, side * 1.02], 0.08), part("侧面护板", "box", steel, [side * 1.25, 3.75, 0], [0.08, 0.9, 2.4]));
  for (let index = 0; index < 10; index++) parts.push(part("登塔梯档", "box", steel, [-0.72, 0.18 + index * 0.3, 1.25], [0.6, 0.06, 0.12]));
  for (const x of [-1.03, -0.41]) parts.push(beam("爬梯侧梁", darkMetal, [x, 0.05, 1.65], [x, 3.35, 1.12], 0.055));
  return asset("wasteOutpostTower", "据点岗塔", "废土", "建筑", parts, { itemType: "建筑" });
}

function concreteBunker() {
  const parts = [part("掩体底座", "box", concrete, [0, 0.16, 0], [5, 0.32, 3.4]), part("厚重掩体顶板", "box", concrete, [0, 2.15, 0], [4.7, 0.5, 3.25]), part("掩体后墙", "box", concrete, [0, 1.25, -1.35], [4.2, 1.9, 0.4]), part("左前护墙", "box", concrete, [-1.47, 1.1, 1.4], [1.25, 1.65, 0.35]), part("右前护墙", "box", concrete, [1.3, 1.1, 1.4], [1.55, 1.65, 0.35]), part("观察射口顶梁", "box", concrete, [0, 1.87, 1.45], [4.1, 0.22, 0.5])];
  for (const x of [-2.05, 2.05]) parts.push(part("倾斜侧护壁", "box", concrete, [x, 1.15, 0], [0.42, 1.95, 2.75], [0, 0, x < 0 ? -8 : 8]));
  for (let index = 0; index < 7; index++) parts.push(part("顶板沙袋", "capsule", sand, [-1.65 + index * 0.55, 2.5, 1.05], [0.5, 0.65, 0.5], [0, 0, 90]));
  return asset("wasteConcreteBunker", "战术掩体", "废土", "建筑", parts, { itemType: "建筑" });
}

function waterStation() {
  const parts = [part("供水站基台", "box", concrete, [0, 0.15, 0], [4.3, 0.3, 3]), part("蓄水罐", "cylinder", steel, [-0.7, 2.5, 0], [2.1, 2.2, 2.1]), part("蓄水罐顶盖", "cone", olive, [-0.7, 3.7, 0], [2.2, 0.35, 2.2]), part("接水操作台", "box", sand, [1.1, 0.9, 0.8], [1.35, 0.95, 0.6]), part("水槽", "box", blue, [1.1, 1.4, 0.8], [1.1, 0.07, 0.45]), part("供水弯管", "tube", darkMetal, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: -0.1, y: 1.9, z: 0.5 }, { x: 0.6, y: 1.9, z: 0.65 }, { x: 1.1, y: 1.75, z: 0.7 }, { x: 1.1, y: 1.5, z: 0.7 }], radius: 0.06 })];
  for (const x of [-1.45, 0.05]) for (const z of [-0.72, 0.72]) parts.push(part("水罐承重架", "box", darkMetal, [x, 0.86, z], [0.12, 1.45, 0.12]));
  parts.push(part("管阀手轮", "torus", amber, [0.6, 1.96, 0.65], [0.25, 0.25, 0.08], [90, 0, 0]));
  return asset("wasteWaterStation", "集镇供水站", "废土", "建筑", parts, { itemType: "建筑" });
}

function repairGarage() {
  const parts = [part("修理铺地坪", "box", concrete, [0, 0.1, 0], [5.2, 0.2, 4.5]), part("修理铺后墙", "box", steel, [0, 1.6, -2.05], [4.9, 3, 0.12]), pitchedRoof("修理棚屋面", olive, 5.5, 4.9, 3.05), part("维修工作台", "box", wood, [-1.4, 1, -1.4], [1.9, 0.2, 0.8]), part("墙挂备胎", "torus", rubber, [1.2, 1.9, -1.9], [1.15, 1.15, 0.35])];
  for (const x of [-2.35, 2.35]) for (const z of [-2, 2]) parts.push(part("修理棚钢柱", "box", darkMetal, [x, 1.55, z], [0.16, 3.1, 0.16]));
  for (const x of [-2.4, 2.4]) parts.push(part("侧部矮墙", "box", sand, [x, 0.75, 0], [0.12, 1.3, 4.1]));
  for (const x of [-1.2, 1.2]) parts.push(part("车辆维修坡架", "box", darkMetal, [x, 0.24, 0.1], [0.4, 0.3, 2.6]));
  return asset("wasteRepairGarage", "维修棚", "废土", "建筑", parts, { itemType: "建筑" });
}

function aidTent() {
  const parts = [part("救助帐篷底垫", "box", sand, [0, 0.04, 0], [4.3, 0.08, 5.2]), part("帐篷后壁", "box", canvas, [0, 0.84, -2.5], [4, 1.6, 0.04]), part("入口上帘", "box", canvas, [0, 1.6, 2.48], [4, 0.18, 0.04]), part("救助标牌", "box", "#668878", [0, 2.3, 1.6], [0.7, 0.65, 0.04], [32, 0, 0]), part("救助十字竖画", "box", "#ddd9c6", [0, 2.32, 1.65], [0.1, 0.42, 0.025], [32, 0, 0]), part("救助十字横画", "box", "#ddd9c6", [0, 2.32, 1.65], [0.4, 0.1, 0.025], [32, 0, 0])];
  for (const side of [-1, 1]) parts.push(part("帐篷侧布", "box", canvas, [side * 2, 0.85, 0], [0.045, 1.6, 5]), part("人字帐篷顶布", "box", canvas, [side * 1.05, 2.15, 0], [2.55, 0.045, 5.1], [0, 0, side * -34]), part("入口侧帘", "box", "#a5a68a", [side * 1.55, 0.88, 2.48], [0.9, 1.5, 0.045]));
  for (const z of [-2.45, 2.45]) parts.push(part("帐篷中柱", "cylinder", wood, [0, 1.48, z], [0.075, 2.95, 0.075]));
  return asset("wasteAidTent", "救助帐篷", "废土", "建筑", parts, { itemType: "建筑" });
}

function scrapGateway() {
  const parts = [part("大门基础", "box", concrete, [0, 0.12, 0], [5.8, 0.24, 1.5]), part("大门横梁", "box", darkMetal, [0, 3.25, 0], [5.4, 0.3, 0.6])];
  for (const side of [-1, 1]) { parts.push(part("门楼箱柱", "box", steel, [side * 2.4, 1.65, 0], [0.65, 3, 0.9]), part("完整门扇", "box", side < 0 ? olive : sand, [side * 1.05, 1.5, 0], [2.02, 2.6, 0.12]), beam("门扇斜加固", darkMetal, [side * 0.15, 0.3, 0.12], [side * 1.95, 2.7, 0.12], 0.1)); for (const y of [0.65, 2.25]) parts.push(part("铰链", "cylinder", darkMetal, [side * 2.02, y, 0.05], [0.13, 0.24, 0.13])); }
  parts.push(part("门楼识别牌", "box", "#d0be8c", [0, 3.42, 0.34], [1.7, 0.4, 0.06]));
  return asset("wasteScrapGateway", "再生金属大门", "废土", "建筑", parts, { itemType: "建筑" });
}

function containerWorkshop() {
  const parts = [part("工坊箱体地板", "box", darkMetal, [0, 0.16, 0], [5.4, 0.32, 2.6]), part("箱体顶板", "box", steel, [0, 2.7, 0], [5.4, 0.14, 2.6]), part("箱体后壁", "box", olive, [0, 1.45, -1.25], [5.3, 2.5, 0.09]), part("工坊开启门板", "box", sand, [-2.65, 1.4, 1.3], [1.3, 2.4, 0.09], [0, -45, 0]), part("工坊内操作台", "box", wood, [0.6, 1, -0.75], [2.8, 0.18, 0.75])];
  for (const x of [-2.6, 2.6]) parts.push(part("箱体端壁", "box", steel, [x, 1.45, 0], [0.08, 2.5, 2.5]));
  for (let index = 0; index < 12; index++) parts.push(part("后壁压型筋", "box", darkMetal, [-2.4 + index * 0.43, 1.45, -1.32], [0.035, 2.4, 0.05]));
  parts.push(part("工坊上翻雨檐", "box", sand, [0, 2.56, 1.75], [5.3, 0.06, 1.15], [12, 0, 0]));
  return asset("wasteContainerWorkshop", "集装箱工坊", "废土", "建筑", parts, { itemType: "建筑" });
}

function marketCanopy() {
  const parts = [part("集市售卖桌", "box", wood, [0, 0.96, 0.25], [3.4, 0.15, 1.05]), part("柜台下挡板", "box", sand, [0, 0.51, 0.7], [3.2, 0.8, 0.07]), part("集市整张篷布", "box", canvas, [0, 2.45, 0], [4, 0.055, 3], [6, 0, 0])];
  for (const x of [-1.65, 1.65]) for (const z of [-1.1, 1.1]) parts.push(part("雨棚撑杆", "cylinder", wood, [x, 1.25, z], [0.09, 2.5, 0.09]));
  for (let index = 0; index < 4; index++) parts.push(part("售卖分格木箱", "box", "#9a805b", [-1.1 + index * 0.72, 1.15, 0.25], [0.62, 0.23, 0.7]));
  return asset("wasteMarketCanopy", "集市雨棚", "废土", "建筑", parts, { itemType: "建筑" });
}

function radioHut() {
  const parts = [part("电台小屋地台", "box", concrete, [0, 0.12, 0], [3, 0.24, 2.8]), part("电台小屋箱身", "box", sand, [0, 1.35, 0], [2.7, 2.4, 2.45]), part("屋盖", "box", steel, [0, 2.6, 0], [3, 0.15, 2.75]), part("电台门", "box", olive, [0, 1.2, 1.27], [0.72, 2.02, 0.07]), part("无线电天线杆", "cylinder", darkMetal, [-0.8, 4.2, -0.6], [0.055, 3.2, 0.055]), part("天线馈线盒", "box", darkMetal, [1, 2.85, -0.5], [0.45, 0.5, 0.4])];
  for (const y of [3.2, 3.9, 4.6, 5.3]) parts.push(part("天线横振子", "cylinder", steel, [-0.8, y, -0.6], [0.025, 2.3 - (y - 3.2) * 0.5, 0.025], [0, 0, 90]));
  parts.push(part("侧窗", "box", blue, [1.38, 1.65, 0], [0.04, 0.65, 0.85]));
  return asset("wasteRadioHut", "电台小屋", "废土", "建筑", parts, { itemType: "建筑" });
}

function armoredPickup() {
  const parts = [part("皮卡底盘", "box", darkMetal, [0, 0.63, 0], [1.65, 0.28, 4]), part("发动机舱", "box", olive, [0, 1.05, -1.2], [1.8, 0.6, 1.3]), part("驾驶室下部", "box", sand, [0, 1.04, -0.15], [1.8, 0.65, 1.35]), part("驾驶室顶", "box", steel, [0, 1.95, -0.15], [1.95, 0.12, 1.5]), part("前风挡", "box", blue, [0, 1.65, -0.86], [1.6, 0.55, 0.045], [-9, 0, 0]), part("后货箱底板", "box", wood, [0, 0.9, 1.25], [1.8, 0.12, 1.8]), part("防撞前杠", "box", darkMetal, [0, 0.85, -2.05], [2.15, 0.2, 0.25])];
  for (const side of [-1, 1]) parts.push(part("货箱侧栏", "box", steel, [side * 0.88, 1.2, 1.25], [0.1, 0.55, 1.8]), part("驾驶室门", "box", olive, [side * 0.91, 1.22, -0.15], [0.06, 0.82, 1.2]), part("车窗", "box", blue, [side * 0.92, 1.68, -0.15], [0.04, 0.4, 1.08]), part("车前灯", "box", amber, [side * 0.62, 1.15, -1.88], [0.3, 0.2, 0.04]));
  parts.push(part("货箱尾门", "box", steel, [0, 1.2, 2.1], [1.8, 0.55, 0.09]));
  wheels(parts, 0.96, [-1.27, 1.3], 0.45);
  return asset("wasteArmoredPickup", "改装皮卡", "废土", "道具", parts, { itemType: "交通" });
}

function armoredBus() {
  const parts = [part("公交底盘", "box", darkMetal, [0, 0.7, 0], [2.25, 0.4, 6.8]), part("公交车身", "box", sand, [0, 1.68, 0], [2.25, 1.8, 6.7]), part("公交车顶", "box", steel, [0, 2.66, 0], [2.4, 0.18, 6.9]), part("公交前风挡", "box", blue, [0, 2.1, -3.4], [1.98, 0.82, 0.045]), part("装甲防护前杠", "box", darkMetal, [0, 0.94, -3.6], [2.6, 0.3, 0.35]), part("车顶行李架", "box", darkMetal, [0, 2.84, 0.6], [1.85, 0.12, 3.3])];
  for (const side of [-1, 1]) { for (let index = 0; index < 5; index++) parts.push(part("公交侧窗", "box", blue, [side * 1.15, 2.1, -2.3 + index * 1.12], [0.045, 0.7, 0.9])); parts.push(part("车身装甲下板", "box", olive, [side * 1.19, 1.15, 0.2], [0.09, 0.65, 5.6])); }
  for (const z of [-2.8, -1.4, 0, 1.4, 2.8]) parts.push(part("顶架拦条", "box", darkMetal, [0, 3.03, z], [2.03, 0.08, 0.07]));
  wheels(parts, 1.18, [-2.3, 1.6, 2.55], 0.5);
  return asset("wasteArmoredBus", "装甲公交", "废土", "道具", parts, { itemType: "交通" });
}

function trackedHauler() {
  const parts = [part("履带车底架", "box", darkMetal, [0, 0.9, 0], [2.05, 0.35, 4.3]), part("履带驾驶舱", "box", steel, [0, 1.65, -1.25], [1.9, 1.3, 1.5]), part("驾驶舱顶板", "box", olive, [0, 2.35, -1.25], [2.1, 0.12, 1.75]), part("驾驶舱前窗", "box", blue, [0, 1.92, -2.03], [1.6, 0.55, 0.04]), part("载货平台", "box", wood, [0, 1.2, 0.95], [2.2, 0.15, 2.7])];
  for (const side of [-1, 1]) { parts.push(part("连续履带", "torus", rubber, [side * 1.16, 0.61, 0], [4.2, 1.15, 0.36], [0, 90, 0])); for (let index = 0; index < 5; index++) parts.push(part("履带支重轮", "cylinder", steel, [side * 1.17, 0.59, -1.5 + index * 0.75], [0.66, 0.24, 0.66], [0, 0, 90])); for (let index = 0; index < 14; index++) { const angle = index * Math.PI / 7; parts.push(part("履带防滑齿", "box", darkMetal, [side * 1.17, 0.61 + Math.sin(angle) * 0.53, Math.cos(angle) * 2], [0.38, 0.07, 0.28], [0, 0, 0])); } parts.push(part("货台护栏", "box", olive, [side * 1.06, 1.56, 0.95], [0.08, 0.6, 2.7])); }
  return asset("wasteTrackedHauler", "履带货车", "废土", "道具", parts, { itemType: "交通" });
}

function duneBike() {
  const parts = [part("沙地摩托发动机", "box", darkMetal, [0, 0.64, 0], [0.42, 0.44, 0.6]), part("摩托油箱", "capsule", sand, [0, 1.08, -0.12], [0.68, 0.75, 0.65], [90, 0, 0]), part("皮质车座", "box", "#6d6557", [0, 1.1, 0.48], [0.42, 0.13, 0.72]), part("车灯", "cylinder", amber, [0, 1.1, -1.1], [0.25, 0.08, 0.25], [90, 0, 0]), part("车把横杆", "cylinder", steel, [0, 1.3, -0.73], [0.05, 0.78, 0.05], [0, 0, 90])];
  for (const z of [-0.95, 0.9]) parts.push(part("越野轮胎", "cylinder", rubber, [0, 0.4, z], [0.8, 0.19, 0.8], [0, 0, 90]), part("越野轮毂", "cylinder", steel, [0, 0.4, z], [0.48, 0.22, 0.48], [0, 0, 90]));
  for (const side of [-1, 1]) parts.push(beam("前悬叉", steel, [side * 0.12, 0.4, -0.95], [side * 0.12, 1.28, -0.65], 0.06), beam("车架斜撑", steel, [side * 0.17, 0.44, 0.9], [side * 0.17, 0.98, 0], 0.07));
  return asset("wasteDuneBike", "沙地摩托", "废土", "道具", parts, { itemType: "交通" });
}

function cargoTricycle() {
  const parts = [part("三轮货斗底板", "box", steel, [0, 0.65, 0.72], [1.55, 0.12, 1.7]), part("三轮车座", "box", "#746956", [0, 0.99, -0.5], [0.48, 0.12, 0.5]), part("车把", "cylinder", darkMetal, [0, 1.3, -1.03], [0.045, 0.8, 0.045], [0, 0, 90]), beam("前车架", darkMetal, [0, 0.48, -1.4], [0, 1.25, -0.95], 0.08)];
  for (const side of [-1, 1]) parts.push(part("货斗侧板", "box", olive, [side * 0.75, 0.97, 0.72], [0.07, 0.55, 1.7]), part("后轮", "cylinder", rubber, [side * 0.84, 0.36, 0.8], [0.72, 0.17, 0.72], [0, 0, 90]), part("后轮轮毂", "cylinder", steel, [side * 0.94, 0.36, 0.8], [0.43, 0.025, 0.43], [0, 0, 90]));
  parts.push(part("三轮车前轮", "cylinder", rubber, [0, 0.36, -1.4], [0.72, 0.17, 0.72], [0, 0, 90]), part("货斗尾板", "box", olive, [0, 0.97, 1.6], [1.55, 0.55, 0.07]), part("货斗前挡板", "box", steel, [0, 0.97, -0.15], [1.55, 0.55, 0.07]));
  return asset("wasteCargoTricycle", "运输三轮", "废土", "道具", parts, { itemType: "交通" });
}

function utilityTrailer() {
  const parts = [part("拖斗主框", "box", darkMetal, [0, 0.65, 0], [1.9, 0.2, 3.3]), part("拖斗木底板", "box", wood, [0, 0.82, 0], [1.75, 0.12, 3.1]), part("尾门", "box", steel, [0, 1.1, 1.66], [1.9, 0.6, 0.08]), beam("牵引架左梁", steel, [-0.8, 0.6, -1.5], [0, 0.6, -2.7], 0.1), beam("牵引架右梁", steel, [0.8, 0.6, -1.5], [0, 0.6, -2.7], 0.1), part("拖斗牵引环", "torus", darkMetal, [0, 0.6, -2.8], [0.24, 0.24, 0.07], [90, 0, 0])];
  for (const x of [-0.9, 0.9]) parts.push(part("拖斗侧栏", "box", olive, [x, 1.1, 0], [0.08, 0.6, 3.2]));
  wheels(parts, 1, [-0.75, 0.75], 0.4);
  return asset("wasteUtilityTrailer", "物资拖斗", "废土", "道具", parts, { itemType: "交通" });
}

function barrelChair() {
  const parts = drumParts("扶手椅桶座", olive, [0, 0.28, 0], 0.8, 0.56);
  parts.push(part("圆形座垫", "cylinder", "#9a8d72", [0, 0.62, 0], [0.78, 0.12, 0.78]), part("桶椅后靠板", "box", olive, [0, 0.97, -0.34], [0.68, 0.7, 0.06], [-8, 0, 0]));
  for (const side of [-1, 1]) parts.push(part("弧形扶手", "capsule", darkMetal, [side * 0.39, 0.9, -0.02], [0.3, 0.66, 0.3], [90, 0, 0]), part("扶手立托", "box", steel, [side * 0.36, 0.73, 0.22], [0.065, 0.35, 0.07]));
  return asset("wasteBarrelChair", "油桶扶手椅", "废土", "道具", parts, { itemType: "家具" });
}

function drumTable() {
  const parts = drumParts("圆桌桶座", steel, [0, 0.46, 0], 0.65, 0.92);
  parts.push(part("再生木圆桌面", "cylinder", wood, [0, 0.98, 0], [1.3, 0.12, 1.3]));
  for (const z of [-0.32, 0, 0.32]) parts.push(part("桌面拼板缝", "box", "#655940", [0, 1.045, z], [0.95, 0.008, 0.012]));
  return asset("wasteDrumTable", "油桶圆桌", "废土", "道具", parts, { itemType: "家具" });
}

function palletBed() {
  const parts = [part("栈板左梁", "box", wood, [-0.61, 0.16, 0], [0.17, 0.32, 2.15]), part("栈板右梁", "box", wood, [0.61, 0.16, 0], [0.17, 0.32, 2.15]), part("整洁床垫", "box", "#aaa48b", [0, 0.49, 0], [1.35, 0.22, 2]), part("折叠毛毯", "box", canvas, [0, 0.63, 0.43], [1.3, 0.07, 1.1]), part("布枕", "capsule", "#c6b99b", [0, 0.69, -0.7], [0.9, 0.27, 0.43], [0, 0, 90])];
  for (let index = 0; index < 8; index++) parts.push(part("栈板床横板", "box", "#9b815d", [0, 0.34, -0.95 + index * 0.27], [1.5, 0.08, 0.22]));
  return asset("wastePalletBed", "栈板床", "废土", "道具", parts, { itemType: "家具" });
}

function supplyCabinet() {
  const parts = [part("补给柜箱体", "box", olive, [0, 1.12, 0], [1.65, 2.1, 0.65]), part("补给柜防雨顶", "box", steel, [0, 2.26, 0], [1.85, 0.16, 0.82]), part("柜体离地底座", "box", darkMetal, [0, 0.08, 0], [1.55, 0.16, 0.62])];
  for (const side of [-1, 1]) parts.push(part("柜门镶板", "box", sand, [side * 0.4, 1.15, 0.35], [0.73, 1.95, 0.065]), part("柜门拉手", "box", darkMetal, [side * 0.12, 1.1, 0.41], [0.045, 0.3, 0.05]));
  for (const y of [0.55, 1.75]) parts.push(part("柜门压条", "box", steel, [0, y, 0.4], [1.5, 0.08, 0.025]));
  return asset("wasteSupplyCabinet", "补给柜", "废土", "道具", parts, { itemType: "家具" });
}

function mechanicBench() {
  const parts = [part("工作台台面", "box", steel, [0, 0.95, 0], [2.5, 0.15, 1]), part("后方工具挂板", "box", wood, [0, 1.65, -0.4], [2.3, 1.1, 0.08]), part("下层置物架", "box", wood, [0, 0.3, 0], [2.3, 0.1, 0.85]), part("台钳固定座", "box", darkMetal, [0.7, 1.1, 0.08], [0.38, 0.2, 0.35]), part("台钳钳口", "box", darkMetal, [0.7, 1.26, 0.13], [0.38, 0.12, 0.12])];
  for (const x of [-1.05, 1.05]) for (const z of [-0.34, 0.34]) parts.push(part("工作台钢腿", "box", darkMetal, [x, 0.48, z], [0.1, 0.96, 0.1]));
  for (let index = 0; index < 5; index++) { const x = -0.8 + index * 0.38; parts.push(part("挂放工具柄", "box", darkMetal, [x, 1.7, -0.32], [0.05, 0.48, 0.04]), part("扳手端头", "torus", steel, [x, 1.96, -0.32], [0.17, 0.17, 0.045])); }
  return asset("wasteMechanicBench", "工具工作台", "废土", "道具", parts, { itemType: "家具" });
}

function rainCollector() {
  const parts = drumParts("集雨储罐", blue, [0, 0.57, 0], 1.1, 1.14);
  parts.push(part("集雨漏斗", "lathe", canvas, [0, 1.9, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.12, y: 0 }, { x: 1.65, y: 0.85 }, { x: 1.67, y: 0.92 }, { x: 0.08, y: 0.08 }] }), part("集雨下水管", "cylinder", darkMetal, [0, 1.56, 0], [0.12, 0.75, 0.12]));
  for (let index = 0; index < 4; index++) { const angle = index * Math.PI / 2 + Math.PI / 4; parts.push(beam("集雨撑杆", wood, [Math.cos(angle) * 1.35, 0.04, Math.sin(angle) * 1.35], [Math.cos(angle) * 1.08, 2.7, Math.sin(angle) * 1.08], 0.07)); }
  return asset("wasteRainCollector", "集雨器", "废土", "道具", parts, { itemType: "设施" });
}

function purifier() {
  const parts = [part("净水机机架底座", "box", darkMetal, [0, 0.1, 0], [2.2, 0.2, 0.9]), part("过滤器上梁", "box", steel, [0, 1.45, 0], [2.1, 0.12, 0.55]), part("净水机控制盒", "box", olive, [0.85, 1.12, 0.25], [0.42, 0.58, 0.35])];
  for (const x of [-0.95, 0.95]) parts.push(part("过滤机架立杆", "box", darkMetal, [x, 0.8, -0.28], [0.09, 1.6, 0.09]));
  for (const x of [-0.63, -0.04, 0.55]) parts.push(part("滤芯罐", "cylinder", "#b0ae9a", [x, 0.92, 0], [0.38, 1.05, 0.38]), part("滤芯盖", "cylinder", blue, [x, 1.48, 0], [0.42, 0.1, 0.42]));
  parts.push(part("过滤连接总管", "tube", steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: -0.8, y: 1.58, z: 0 }, { x: -0.8, y: 1.72, z: 0 }, { x: 0.7, y: 1.72, z: 0 }, { x: 0.7, y: 0.45, z: 0.3 }], radius: 0.045 }));
  return asset("wastePurifier", "净水机", "废土", "道具", parts, { itemType: "设施" });
}

function dieselGenerator() {
  const parts = [part("发电机底架", "box", darkMetal, [0, 0.14, 0], [1.9, 0.28, 1.1]), part("柴油发动机", "box", olive, [-0.35, 0.68, 0], [0.9, 0.7, 0.75]), part("发电机圆筒", "cylinder", steel, [0.52, 0.64, 0], [0.68, 0.7, 0.68], [0, 0, 90]), part("燃油上箱", "box", sand, [-0.32, 1.12, 0], [1, 0.26, 0.8]), part("控制面", "box", darkMetal, [0.67, 0.84, 0.4], [0.45, 0.35, 0.05]), part("排气消音器", "cylinder", darkMetal, [-0.75, 1.32, -0.25], [0.16, 0.65, 0.16])];
  for (const x of [-0.85, 0.85]) for (const z of [-0.45, 0.45]) parts.push(part("发电机护架角杆", "box", steel, [x, 0.72, z], [0.055, 1.2, 0.055]));
  for (const z of [-0.45, 0.45]) parts.push(part("发电机提手梁", "box", steel, [0, 1.33, z], [1.75, 0.06, 0.06]));
  return asset("wasteDieselGenerator", "柴油发电机", "废土", "道具", parts, { itemType: "设施" });
}

function jerseyBarricade() {
  const parts = [part("通行路障主体", "extrude", concrete, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 3.2, profile: [{ x: -0.46, y: 0 }, { x: 0.46, y: 0 }, { x: 0.46, y: 0.2 }, { x: 0.2, y: 0.57 }, { x: 0.14, y: 1 }, { x: -0.14, y: 1 }, { x: -0.2, y: 0.57 }, { x: -0.46, y: 0.2 }] })];
  for (let index = 0; index < 6; index++) parts.push(part("路障反光短条", "box", amber, [-1.3 + index * 0.52, 0.7, 0.22], [0.26, 0.15, 0.035], [0, 0, -22]));
  for (const x of [-1, 1]) parts.push(part("路障吊环", "torus", darkMetal, [x, 1.06, 0], [0.16, 0.18, 0.055]));
  return asset("wasteJerseyBarricade", "混凝土通行路障", "废土", "道具", parts, { itemType: "设施" });
}

function fuelPump() {
  const parts = [part("燃油泵底座", "box", concrete, [0, 0.1, 0], [1.2, 0.2, 0.9]), part("加油泵箱体", "box", olive, [0, 0.85, 0], [0.75, 1.4, 0.55]), part("计量泵上盖", "box", steel, [0, 1.65, 0], [0.85, 0.25, 0.65]), part("计量表窗", "box", "#cfbea0", [0, 1.34, 0.3], [0.47, 0.28, 0.045]), part("燃油输送软管", "tube", rubber, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: 0.37, y: 1.47, z: 0 }, { x: 0.75, y: 1.3, z: 0 }, { x: 0.9, y: 0.45, z: 0 }, { x: 0.64, y: 0.22, z: 0 }, { x: 0.5, y: 0.7, z: 0.1 }, { x: 0.5, y: 1.1, z: 0.1 }], radius: 0.035 }), part("加油枪", "box", darkMetal, [0.48, 1.16, 0.1], [0.11, 0.28, 0.09], [0, 0, -18])];
  return asset("wasteFuelPump", "燃油补给泵", "废土", "道具", parts, { itemType: "设施" });
}

function batteryCharger() {
  const parts = [part("充电架底板", "box", darkMetal, [0, 0.09, 0], [1.9, 0.18, 0.95]), part("充电架仪表盒", "box", olive, [0, 1.63, -0.3], [1.55, 0.38, 0.35]), part("指针电压表", "cylinder", "#c8ba9b", [-0.4, 1.65, -0.1], [0.2, 0.035, 0.2], [90, 0, 0])];
  for (const x of [-0.83, 0.83]) for (const z of [-0.35, 0.35]) parts.push(part("充电架钢柱", "box", steel, [x, 0.85, z], [0.07, 1.7, 0.07]));
  for (const y of [0.35, 1]) { parts.push(part("电池层架", "box", steel, [0, y, 0], [1.7, 0.07, 0.8])); for (const x of [-0.5, 0, 0.5]) parts.push(part("铅酸电池", "box", darkMetal, [x, y + 0.2, 0], [0.4, 0.32, 0.58]), part("电池端子", "cylinder", amber, [x + 0.1, y + 0.39, 0.15], [0.055, 0.05, 0.055])); }
  return asset("wasteBatteryCharger", "蓄电池充电架", "废土", "道具", parts, { itemType: "设施" });
}

function cookingStove() {
  const parts = drumParts("炉灶主体", darkMetal, [0, 0.56, 0], 0.95, 0.95);
  parts.push(part("厚铸铁灶面", "cylinder", steel, [0, 1.08, 0], [1.15, 0.1, 1.15]), part("炉门", "box", "#61685f", [0, 0.55, 0.49], [0.52, 0.42, 0.06]), part("炉门把手", "box", darkMetal, [0.16, 0.58, 0.54], [0.06, 0.16, 0.05]), part("烟囱管", "cylinder", darkMetal, [0, 1.9, -0.35], [0.13, 1.65, 0.13]), part("烟囱防雨帽", "cone", steel, [0, 2.8, -0.35], [0.34, 0.16, 0.34]));
  for (const x of [-0.25, 0.25]) parts.push(part("炉面灶圈", "torus", darkMetal, [x, 1.15, 0.16], [0.33, 0.33, 0.06], [90, 0, 0]));
  for (const x of [-0.32, 0.32]) for (const z of [-0.28, 0.28]) parts.push(part("炉脚", "box", steel, [x, 0.1, z], [0.1, 0.2, 0.1]));
  return asset("wasteCookingStove", "铁炉灶", "废土", "道具", parts, { itemType: "设施" });
}

function utilitySink() {
  const parts = [part("清洗台沥水半台", "box", steel, [0.46, 0.94, 0], [0.94, 0.08, 0.85]), part("清洗台后沿", "box", steel, [0, 0.94, -0.39], [1.9, 0.08, 0.07]), part("洗涤盆", "lathe", blue, [-0.43, 0.88, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: -0.3 }, { x: 0.25, y: -0.3 }, { x: 0.38, y: 0 }, { x: 0.4, y: 0.05 }, { x: 0.36, y: 0.05 }, { x: 0.21, y: -0.25 }, { x: 0, y: -0.25 }] }), part("弯颈龙头", "tube", darkMetal, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: -0.43, y: 0.95, z: -0.32 }, { x: -0.43, y: 1.32, z: -0.3 }, { x: -0.43, y: 1.38, z: -0.05 }, { x: -0.43, y: 1.2, z: 0 }], radius: 0.027 })];
  for (const x of [-0.82, 0.82]) for (const z of [-0.31, 0.31]) parts.push(part("清洗台支腿", "box", darkMetal, [x, 0.46, z], [0.07, 0.92, 0.07]));
  for (let index = 0; index < 6; index++) parts.push(part("沥水槽压纹", "box", darkMetal, [0.25 + index * 0.1, 0.987, 0], [0.015, 0.008, 0.55]));
  return asset("wasteUtilitySink", "营地清洗台", "废土", "道具", parts, { itemType: "设施" });
}

function canvasScreen() {
  const parts: ModelPart[] = [];
  for (let index = 0; index < 4; index++) parts.push(part("帐布支杆", "cylinder", wood, [-1.5 + index, 1.03, index % 2 * 0.16], [0.06, 2.06, 0.06]));
  for (let index = 0; index < 3; index++) { const x = -1 + index; parts.push(part("完整拼缝帐布", "box", index % 2 ? "#aaa088" : canvas, [x, 1.1, 0.08], [0.95, 1.65, 0.035], [0, index % 2 ? -9 : 9, 0]), part("帐布横拼缝", "box", "#c1b397", [x, 1.25, 0.11], [0.9, 0.025, 0.012])); }
  for (const x of [-1.5, 1.5]) parts.push(beam("屏风后撑", wood, [x, 1, 0.08], [x, 0.04, -0.65], 0.05));
  return asset("wasteCanvasScreen", "拼缝帐布屏风", "废土", "道具", parts, { itemType: "构件" });
}

function cageLantern() {
  const parts = [part("营灯灯座", "cylinder", olive, [0, 0.08, 0], [0.42, 0.16, 0.42]), part("营灯玻璃", "cylinder", "#b5b99b", [0, 0.38, 0], [0.31, 0.42, 0.31], [0, 0, 0], { opacity: 0.32 }), part("营灯灯芯", "sphere", "#e8c68b", [0, 0.37, 0], [0.12, 0.25, 0.12], [0, 0, 0], { emissive: "#b98c45", emissiveIntensity: 0.45 }), part("营灯顶帽", "cone", darkMetal, [0, 0.68, 0], [0.46, 0.16, 0.46]), part("携带提环", "torus", darkMetal, [0, 0.87, 0], [0.3, 0.36, 0.045])];
  for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3; parts.push(part("保护笼细杆", "cylinder", darkMetal, [Math.cos(angle) * 0.18, 0.4, Math.sin(angle) * 0.18], [0.018, 0.48, 0.018])); }
  return asset("wasteCageLantern", "保护笼营灯", "废土", "道具", parts, { itemType: "灯具" });
}

function solarLamp() {
  const parts = [part("太阳能灯基座", "cylinder", concrete, [0, 0.12, 0], [0.72, 0.24, 0.72]), part("灯杆", "cylinder", darkMetal, [0, 1.9, 0], [0.09, 3.55, 0.09]), part("太阳能电池板", "box", blue, [0, 3.75, 0], [1.25, 0.055, 0.82], [25, 0, 0]), beam("悬臂灯架", steel, [0, 3.15, 0], [0.7, 3.35, 0], 0.07), part("灯头", "box", olive, [0.78, 3.3, 0], [0.7, 0.15, 0.32]), part("灯面", "box", "#e0d0a5", [0.78, 3.21, 0], [0.57, 0.02, 0.25])];
  for (let index = 0; index < 5; index++) parts.push(part("电池板细栅", "box", "#adb9b1", [-0.5 + index * 0.25, 3.79, 0], [0.012, 0.01, 0.77], [25, 0, 0]));
  return asset("wasteSolarLamp", "太阳能路灯", "废土", "道具", parts, { itemType: "灯具" });
}

function cableWorklight() {
  const parts = [part("检修灯立杆", "cylinder", steel, [0, 1.03, 0], [0.055, 1.95, 0.055]), part("双灯横梁", "box", darkMetal, [0, 2.02, 0], [1.2, 0.08, 0.09]), part("电缆绕线圈", "torus", rubber, [0, 0.76, 0.05], [0.4, 0.4, 0.13])];
  for (const side of [-1, 1]) parts.push(part("检修灯外壳", "box", olive, [side * 0.43, 2.2, 0], [0.48, 0.35, 0.23], [-15, side * -18, 0]), part("检修灯玻璃面", "box", "#e1d19e", [side * 0.43, 2.24, 0.13], [0.4, 0.27, 0.025], [-15, side * -18, 0]));
  for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(beam("折叠灯脚", darkMetal, [0, 0.62, 0], [Math.cos(angle) * 0.63, 0.025, Math.sin(angle) * 0.63], 0.055)); }
  return asset("wasteCableWorklight", "双头检修灯", "废土", "道具", parts, { itemType: "灯具" });
}

function rationCrates() {
  const parts: ModelPart[] = [];
  for (const [x, y, z] of [[-0.48, 0.32, 0], [0.48, 0.32, 0], [0, 0.93, 0]]) { parts.push(part("完整补给木箱", "box", wood, [x!, y!, z!], [0.86, 0.58, 0.7])); for (const offset of [-0.3, 0.3]) parts.push(part("木箱纵压条", "box", "#ac946b", [x! + offset, y!, z! + 0.37], [0.08, 0.56, 0.05])); parts.push(part("木箱物资标签", "box", "#c4b99b", [x!, y! + 0.03, z! + 0.39], [0.35, 0.2, 0.02])); }
  return asset("wasteRationCrates", "补给包装箱组", "废土", "道具", parts, { itemType: "器物" });
}

function waterJerrycans() {
  const parts = [part("储水罐架底座", "box", darkMetal, [0, 0.06, 0], [1.65, 0.12, 0.65]), part("储水罐架后挡", "box", steel, [0, 0.42, -0.27], [1.6, 0.72, 0.06])];
  for (let index = 0; index < 3; index++) { const x = -0.52 + index * 0.52; parts.push(part("完整储水罐", "box", blue, [x, 0.43, 0], [0.44, 0.65, 0.4]), part("罐顶收口肩", "box", blue, [x, 0.77, 0], [0.4, 0.1, 0.35]), part("罐口旋盖", "cylinder", darkMetal, [x + 0.11, 0.86, 0], [0.1, 0.07, 0.1]), part("水罐提环", "tube", darkMetal, [x, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: -0.13, y: 0.8, z: 0 }, { x: -0.13, y: 0.96, z: 0 }, { x: 0.04, y: 0.96, z: 0 }, { x: 0.04, y: 0.82, z: 0 }], radius: 0.02 })); }
  return asset("wasteWaterJerrycans", "储水罐架", "废土", "道具", parts, { itemType: "器物" });
}

function medicalKit() {
  const parts = [part("急救箱下壳", "box", olive, [0, 0.2, 0], [0.8, 0.4, 0.55]), part("急救箱上盖", "box", "#8c9c7d", [0, 0.46, 0], [0.82, 0.12, 0.57]), part("提箱把手", "tube", darkMetal, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: -0.18, y: 0.5, z: 0 }, { x: -0.18, y: 0.66, z: 0 }, { x: 0.18, y: 0.66, z: 0 }, { x: 0.18, y: 0.5, z: 0 }], radius: 0.025 }), part("急救白标竖画", "box", "#d9d5bd", [0, 0.25, 0.29], [0.07, 0.25, 0.02]), part("急救白标横画", "box", "#d9d5bd", [0, 0.25, 0.29], [0.25, 0.07, 0.02])];
  for (const x of [-0.28, 0.28]) parts.push(part("箱扣", "box", darkMetal, [x, 0.42, 0.3], [0.09, 0.12, 0.04]));
  return asset("wasteMedicalKit", "急救箱", "废土", "道具", parts, { itemType: "器物" });
}

function hardyCactus() {
  const parts = [part("仙人掌主干", "capsule", "#788b65", [0, 1.15, 0], [0.8, 2.3, 0.8]), part("左侧分叉", "tube", "#74875f", [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: -0.12, y: 0.8, z: 0 }, { x: -0.6, y: 0.85, z: 0 }, { x: -0.68, y: 1.15, z: 0 }, { x: -0.68, y: 1.68, z: 0 }], radius: 0.13 }), part("右侧分叉", "tube", "#7f926c", [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: 0.12, y: 1.25, z: 0 }, { x: 0.55, y: 1.3, z: 0 }, { x: 0.65, y: 1.55, z: 0 }, { x: 0.65, y: 2.05, z: 0 }], radius: 0.12 })];
  for (let ring = 0; ring < 5; ring++) for (let side = 0; side < 6; side++) { const angle = side * Math.PI / 3; parts.push(beam("仙人掌刺", "#c2b99c", [Math.cos(angle) * 0.18, 0.35 + ring * 0.38, Math.sin(angle) * 0.18], [Math.cos(angle) * 0.27, 0.4 + ring * 0.38, Math.sin(angle) * 0.27], 0.008)); }
  return asset("wasteHardyCactus", "耐旱仙人掌", "废土", "自然", parts, { itemType: "植物" });
}

function scrubBush() {
  const parts = [part("灌丛根基", "sphere", "#827859", [0, 0.08, 0], [0.65, 0.18, 0.55])];
  for (let index = 0; index < 7; index++) { const angle = index * Math.PI * 2 / 7, x = Math.cos(angle) * 0.65, z = Math.sin(angle) * 0.65, y = 0.65 + index % 3 * 0.12; parts.push(beam("防风灌丛枝", wood, [0, 0.08, 0], [x, y, z], 0.035), part("耐旱灌丛叶", "sphere", index % 2 ? "#8f9872" : "#737f5e", [x, y, z], [0.65, 0.35, 0.45], [0, index * 40, 0])); }
  return asset("wasteScrubBush", "防风灌丛", "废土", "自然", parts, { itemType: "植物" });
}

function shelterSapling() {
  const parts = [part("防沙幼树干", "cylinder", wood, [0, 1.4, 0], [0.11, 2.8, 0.11])];
  for (let index = 0; index < 5; index++) { const angle = index * Math.PI * 2 / 5, x = Math.cos(angle) * 0.65, z = Math.sin(angle) * 0.65, y = 2 + index % 2 * 0.45; parts.push(beam("幼树枝", wood, [0, y - 0.8, 0], [x, y, z], 0.04), part("幼树绿叶冠", "sphere", index % 2 ? "#8d9b72" : "#6b855e", [x, y + 0.23, z], [0.95, 0.7, 0.8])); }
  for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(beam("护树木支桩", "#a58d62", [Math.cos(angle) * 0.65, 0, Math.sin(angle) * 0.65], [Math.cos(angle) * 0.15, 1.5, Math.sin(angle) * 0.15], 0.045)); }
  return asset("wasteShelterSapling", "防沙幼树", "废土", "自然", parts, { itemType: "植物" });
}

function sandstoneBoulder() {
  const parts = [crystal("风化砂岩主体", "#a5977e", [0, 0.55, 0], [2.1, 0.82, 1.55]), crystal("侧面岩块", "#9c8b72", [0.85, 0.25, 0.28], [0.85, 0.4, 0.7]), crystal("地面砾石", "#b1a188", [-0.86, 0.13, 0.48], [0.6, 0.2, 0.5]), part("岩体沉积层", "box", "#b6a389", [0, 0.65, 0], [1.45, 0.075, 1.1], [0, 12, 4])];
  return asset("wasteSandstoneBoulder", "风化砂岩", "废土", "自然", parts, { itemType: "岩石" });
}

export const wastelandAssets: SceneAsset[] = [
  patchedShack(), outpostTower(), concreteBunker(), waterStation(), repairGarage(), aidTent(), scrapGateway(), containerWorkshop(), marketCanopy(), radioHut(),
  armoredPickup(), armoredBus(), trackedHauler(), duneBike(), cargoTricycle(), utilityTrailer(),
  barrelChair(), drumTable(), palletBed(), supplyCabinet(), mechanicBench(),
  rainCollector(), purifier(), dieselGenerator(), jerseyBarricade(), fuelPump(), batteryCharger(), cookingStove(), utilitySink(), canvasScreen(),
  cageLantern(), solarLamp(), cableWorklight(), rationCrates(), waterJerrycans(), medicalKit(), hardyCactus(), scrubBush(), shelterSapling(), sandstoneBoulder(),
];
