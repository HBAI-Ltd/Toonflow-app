import { part, asset, ring, pitchedRoof, beam, crystal, type ModelPart, type Triple } from "./assetModelParts";
import type { SceneAsset } from "./sceneDocument";

const stone = "#9b9b92";
const darkStone = "#505461";
const wood = "#805e43";
const bark = "#655346";
const leaf = "#547259";
const bronze = "#ab8c52";
const iron = "#48515c";
const linen = "#d0c2a4";
const purple = "#9178ad";
const steel = "#728692";
const hull = "#c0cbd0";
const navy = "#354956";
const blue = "#729fb9";
const copper = "#b17f5e";

function tableParts(name: string, width: number, depth: number, height: number, color = wood): ModelPart[] {
  const parts = [part(`${name}台面`, "box", color, [0, height, 0], [width, 0.14, depth])];
  for (const x of [-width * 0.4, width * 0.4]) for (const z of [-depth * 0.36, depth * 0.36]) parts.push(part(`${name}支脚`, "box", color, [x, height / 2, z], [0.13, height, 0.13]));
  return parts;
}

function bottle(name: string, color: string, position: Triple, height = 0.48, details: Partial<ModelPart> = {}): ModelPart {
  return part(name, "lathe", color, position, [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: height * 0.24, y: 0 }, { x: height * 0.27, y: height * 0.46 }, { x: height * 0.1, y: height * 0.66 }, { x: height * 0.1, y: height }, { x: 0, y: height }], ...details });
}

function wizardTower() {
  const parts = [part("八角塔基", "cylinder", darkStone, [0, 0.2, 0], [4.3, 0.4, 4.3]), part("石砌塔身", "cylinder", stone, [0, 3.3, 0], [2.7, 6.2, 2.7]), part("尖顶", "cone", "#535878", [0, 7.4, 0], [4.1, 3, 4.1]), ring("观星露台", bronze, 1.65, 0.3, 5.7, 0.2)];
  for (let index = 0; index < 8; index++) {
    const angle = index * Math.PI / 4;
    parts.push(part("露台栏杆", "cylinder", bronze, [Math.cos(angle) * 1.55, 6.05, Math.sin(angle) * 1.55], [0.08, 0.65, 0.08]));
    if (index % 2 === 0) parts.push(part("深窗", "box", "#343c4e", [Math.cos(angle) * 1.34, 3.5, Math.sin(angle) * 1.34], [0.5, 1.1, 0.08], [0, 90 - index * 45, 0]));
  }
  parts.push(part("塔门", "box", wood, [0, 1.05, 1.35], [0.75, 1.7, 0.1]), part("天球顶饰", "sphere", bronze, [0, 9.06, 0], [0.26, 0.26, 0.26]));
  return asset("fantasyWizardTower", "巫师高塔", "奇幻", "建筑", parts);
}

function mushroomHouse() {
  const parts = [part("圆形地台", "cylinder", darkStone, [0, 0.08, 0], [4, 0.16, 4]), part("菌柄房身", "lathe", "#d4c3a4", [0, 0.12, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 1.05, y: 0 }, { x: 0.85, y: 1.8 }, { x: 1.2, y: 2.25 }, { x: 0, y: 2.25 }] }), part("伞状屋顶", "lathe", "#a65c55", [0, 2.25, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 1.35 }, { x: 0.65, y: 1.3 }, { x: 1.7, y: 0.75 }, { x: 2.1, y: 0.05 }, { x: 1.8, y: -0.08 }, { x: 0, y: 0.1 }] }), part("橡木小门", "box", wood, [0, 0.84, 0.91], [0.65, 1.45, 0.12])];
  for (let index = 0; index < 7; index++) { const angle = index * Math.PI * 2 / 7; parts.push(part("伞顶浅色斑", "sphere", linen, [Math.cos(angle) * 1.2, 3.12, Math.sin(angle) * 1.2], [0.43, 0.12, 0.43])); }
  for (const x of [-0.7, 0.7]) parts.push(part("圆窗", "cylinder", "#769997", [x, 1.45, 0.62], [0.4, 0.08, 0.4], [90, 0, 0]));
  return asset("fantasyMushroomHouse", "蘑菇小屋", "奇幻", "建筑", parts);
}

function treeHouse() {
  const parts = [part("古树主干", "cylinder", bark, [0, 2.1, 0], [0.85, 4.2, 0.85]), part("树屋平台", "cylinder", wood, [0, 2.55, 0], [3.4, 0.2, 3.4]), part("树屋墙身", "box", "#aa8762", [0.2, 3.3, 0], [2.05, 1.4, 1.75]), pitchedRoof("树屋木瓦", "#526756", 2.65, 2.2, 4.02), part("树屋入口", "box", "#4b5147", [0.2, 3.2, 0.9], [0.65, 1.1, 0.08])];
  for (const x of [-1.3, 1.3]) parts.push(beam("托台树枝", bark, [0, 1, 0], [x, 2.55, 0], 0.22));
  for (let index = 0; index < 8; index++) parts.push(part("爬梯横档", "box", wood, [-1.45, 0.2 + index * 0.32, 0.6], [0.62, 0.08, 0.15]));
  for (const x of [-1.76, -1.14]) parts.push(part("爬梯侧梁", "box", wood, [x, 1.35, 0.6], [0.08, 2.7, 0.12]));
  for (const [x, y, z] of [[-1.5, 4.4, -0.9], [1.45, 4.7, -1], [0, 5.2, -0.8]]) parts.push(part("树屋冠叶", "sphere", leaf, [x!, y!, z!], [2.1, 1.6, 2]));
  return asset("fantasyTreeHouse", "树上小屋", "奇幻", "建筑", parts);
}

function elvenPavilion() {
  const parts = [part("六角台阶", "cylinder", stone, [0, 0.12, 0], [4.2, 0.24, 4.2]), part("莲瓣穹顶", "lathe", "#73988c", [0, 3.4, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 1.4 }, { x: 0.22, y: 0.9 }, { x: 0.7, y: 0.45 }, { x: 1.9, y: 0.1 }, { x: 2.18, y: 0.28 }, { x: 2.05, y: 0 }, { x: 0, y: 0.3 }] })];
  for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3; const x = Math.cos(angle) * 1.62, z = Math.sin(angle) * 1.62; parts.push(part("精灵细柱", "cylinder", "#c4c5ad", [x, 1.85, z], [0.14, 3.25, 0.14]), beam("弧顶斜撑", bronze, [x, 2.7, z], [x * 0.6, 3.65, z * 0.6], 0.07)); }
  parts.push(part("亭中长凳", "box", "#c2b794", [0, 0.65, -0.9], [2.2, 0.16, 0.5]));
  return asset("fantasyElvenPavilion", "精灵凉亭", "奇幻", "建筑", parts);
}

function dwarvenGate() {
  const parts = [part("矿门地基", "box", darkStone, [0, 0.18, 0], [5.4, 0.36, 1.8]), part("矿门额石", "box", stone, [0, 3.1, 0], [4.7, 0.65, 1.3]), part("厚重闸门", "box", wood, [0, 1.65, 0], [2.55, 2.9, 0.35])];
  for (const x of [-1.8, 1.8]) parts.push(part("斜切门柱", "box", stone, [x, 1.72, 0], [0.78, 2.75, 1.25]), part("铁箍", "box", iron, [x, 1.15, 0.65], [0.86, 0.22, 0.08]));
  for (const y of [0.75, 2.25]) parts.push(part("门板铆钉横带", "box", iron, [0, y, 0.23], [2.5, 0.18, 0.1]));
  parts.push(beam("左交叉矿镐", bronze, [-0.6, 3.38, 0.72], [0.55, 2.65, 0.72], 0.09), beam("右交叉矿镐", bronze, [0.6, 3.38, 0.72], [-0.55, 2.65, 0.72], 0.09));
  return asset("fantasyDwarvenGate", "矮人矿门", "奇幻", "建筑", parts);
}

function ruinedArch() {
  const path = Array.from({ length: 15 }, (_, index) => { const angle = Math.PI - index / 14 * Math.PI * 0.64; return { x: Math.cos(angle) * 1.6, y: 2.1 + Math.sin(angle) * 1.6, z: 0 }; });
  const parts = [part("断拱左柱", "box", stone, [-1.6, 1.08, 0], [0.65, 2.16, 0.85]), part("残存右柱", "box", stone, [1.6, 0.62, 0], [0.72, 1.24, 0.85]), part("残缺圆拱", "tube", stone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path, radius: 0.34 })];
  for (let index = 0; index < 5; index++) parts.push(part("散落拱石", "box", index % 2 ? darkStone : stone, [0.3 + index * 0.48, 0.15, 0.7 + index % 2 * 0.3], [0.48, 0.3, 0.4], [0, index * 24, 8]));
  return asset("fantasyRuinedArch", "废墟断拱", "奇幻", "建筑", parts);
}

function valleyBridge() {
  const parts: ModelPart[] = [];
  for (let index = 0; index < 13; index++) { const x = (index - 6) * 0.42, y = 0.15 + Math.cos((index - 6) / 6 * Math.PI / 2) * 0.8; parts.push(part("拱桥面石", "box", stone, [x, y, 0], [0.46, 0.28, 1.7])); for (const z of [-0.76, 0.76]) parts.push(part("石栏矮柱", "box", darkStone, [x, y + 0.38, z], [0.18, 0.7, 0.2])); }
  for (const z of [-0.65, 0.65]) parts.push(part("桥下承重拱", "tube", darkStone, [0, 0, z], [1, 1, 1], [0, 0, 0], { path: Array.from({ length: 17 }, (_, index) => ({ x: -2.6 + index * 0.325, y: 0.03 + Math.sin(index / 16 * Math.PI) * 0.72, z: 0 })), radius: 0.22 }));
  return asset("fantasyValleyBridge", "山谷石桥", "奇幻", "建筑", parts);
}

function dragonGate() {
  const parts = [part("门楼平台", "box", darkStone, [0, 0.14, 0], [5.2, 0.28, 1.6]), part("横梁", "box", iron, [0, 2.9, 0], [4.6, 0.25, 0.65]), part("龙首", "cone", bronze, [0, 3.65, 0.2], [0.7, 1.1, 0.9], [55, 0, 0])];
  for (const side of [-1, 1]) {
    parts.push(part("盘龙门柱", "cylinder", stone, [side * 1.85, 1.75, 0], [0.52, 3.1, 0.52]));
    parts.push(part("展开龙翼", "extrude", "#67596a", [side * 0.3, 3.2, 0], [1, 1, 1], [0, side < 0 ? 180 : 0, 0], { depth: 0.1, profile: [{ x: 0, y: 0 }, { x: 0.55, y: 1.2 }, { x: 1.95, y: 0.65 }, { x: 1.35, y: 0.45 }, { x: 1.8, y: 0.1 }, { x: 0.8, y: 0.25 }] }));
  }
  return asset("fantasyDragonGate", "龙翼门楼", "奇幻", "建筑", parts);
}

function suspensionBridge() {
  const parts: ModelPart[] = [];
  for (let index = 0; index < 17; index++) { const x = -3.2 + index * 0.4, y = 0.72 - Math.sin(index / 16 * Math.PI) * 0.52; parts.push(part("吊桥木板", "box", wood, [x, y, 0], [0.34, 0.1, 1.25])); if (index % 2 === 0) for (const z of [-0.66, 0.66]) parts.push(part("悬挂短索", "cylinder", bronze, [x, y + 0.43, z], [0.035, 0.85, 0.035])); }
  for (const x of [-3.3, 3.3]) for (const z of [-0.7, 0.7]) parts.push(part("桥头木桩", "cylinder", bark, [x, 0.95, z], [0.2, 1.9, 0.2]));
  for (const z of [-0.67, 0.67]) parts.push(part("吊桥主索", "tube", "#b5a17a", [0, 0, z], [1, 1, 1], [0, 0, 0], { path: Array.from({ length: 17 }, (_, index) => ({ x: -3.3 + index * 6.6 / 16, y: 1.57 - Math.sin(index / 16 * Math.PI) * 0.52, z: 0 })), radius: 0.045 }));
  return asset("fantasySuspensionBridge", "悬索吊桥", "奇幻", "建筑", parts);
}

function wishingWell() {
  const parts = [ring("古井矮壁", stone, 1.1, 0.22, 0.47, 0.94), ring("井口藤纹压顶", bronze, 1.22, 0.25, 0.98, 0.14), part("静水", "cylinder", "#6d9c98", [0, 0.3, 0], [1.7, 0.035, 1.7], [0, 0, 0], { roughness: 0.15, opacity: 0.75 })];
  for (const side of [-1, 1]) parts.push(beam("树枝井架", bark, [side * 1.12, 0, 0], [side * 0.7, 2.5, 0], 0.18));
  parts.push(beam("弯枝横梁", bark, [-0.75, 2.4, 0], [0.75, 2.4, 0], 0.18), part("铜铃", "cone", bronze, [0, 2.05, 0], [0.34, 0.36, 0.34]), part("系铃细绳", "cylinder", linen, [0, 2.3, 0], [0.035, 0.25, 0.035]));
  return asset("fantasyWishingWell", "许愿古井", "奇幻", "建筑", parts);
}

function wizardDesk() {
  const parts = tableParts("书桌", 2, 0.95, 0.84);
  parts.push(part("抽屉座", "box", "#634c3e", [-0.52, 0.57, 0], [0.62, 0.4, 0.75]), part("抽屉拉环", "torus", bronze, [-0.52, 0.6, 0.4], [0.22, 0.14, 0.06]), part("摊开的书页", "box", linen, [0.1, 0.95, 0.05], [0.65, 0.05, 0.48]), bottle("墨水瓶", "#354553", [0.66, 0.92, -0.2], 0.22), beam("羽毛笔", linen, [0.68, 1.05, -0.18], [0.92, 1.45, -0.2], 0.035));
  return asset("fantasyWizardDesk", "巫师书桌", "奇幻", "道具", parts);
}

function alchemyWorkbench() {
  const parts = tableParts("炼金台", 2.5, 1.15, 0.95, "#6a5849");
  parts.push(part("铁质上架", "box", iron, [0, 1.72, -0.45], [2.3, 0.12, 0.22]), part("蒸馏大瓶", "sphere", "#86a29c", [-0.65, 1.3, 0], [0.5, 0.56, 0.5], [0, 0, 0], { opacity: 0.5, roughness: 0.2 }), part("蒸馏盘管", "tube", bronze, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: -0.65, y: 1.55, z: 0 }, { x: -0.6, y: 1.85, z: 0 }, { x: 0.15, y: 1.8, z: 0 }, { x: 0.45, y: 1.25, z: 0 }], radius: 0.045 }), bottle("接液瓶", "#7fa0b3", [0.5, 1.04, 0], 0.42, { opacity: 0.65 }));
  for (const x of [-1.05, 1.05]) parts.push(part("架杆", "cylinder", iron, [x, 1.42, -0.45], [0.07, 0.9, 0.07]));
  return asset("fantasyAlchemyWorkbench", "炼金工作台", "奇幻", "道具", parts);
}

function crystalThrone() {
  const parts = [part("王座台阶", "box", darkStone, [0, 0.12, 0], [2.2, 0.24, 1.9]), part("王座坐垫", "box", "#644d74", [0, 0.7, 0], [1.25, 0.23, 1.1]), crystal("高背水晶", purple, [0, 1.55, -0.45], [1.1, 1.5, 0.35]), crystal("左背晶", "#797ca3", [-0.65, 1.2, -0.4], [0.45, 1.15, 0.42]), crystal("右背晶", "#797ca3", [0.65, 1.2, -0.4], [0.45, 1.15, 0.42])];
  for (const x of [-0.69, 0.69]) parts.push(part("晶石扶手", "box", bronze, [x, 1.04, 0.1], [0.16, 0.17, 1]), part("王座立腿", "box", darkStone, [x, 0.56, 0.3], [0.22, 0.7, 0.25]));
  return asset("fantasyCrystalThrone", "水晶王座", "奇幻", "道具", parts);
}

function innTable() {
  const parts = [part("旅店桌面", "cylinder", wood, [0, 0.86, 0], [1.8, 0.16, 1.8]), part("桌中柱", "cylinder", bark, [0, 0.44, 0], [0.22, 0.88, 0.22])];
  for (let index = 0; index < 4; index++) { const angle = index * Math.PI / 2; const x = Math.cos(angle), z = Math.sin(angle); parts.push(beam("十字桌脚", bark, [0, 0.12, 0], [x * 0.72, 0.08, z * 0.72], 0.13), part("圆凳", "cylinder", "#a17d54", [x * 1.28, 0.47, z * 1.28], [0.5, 0.13, 0.5]), part("圆凳立柱", "cylinder", bark, [x * 1.28, 0.23, z * 1.28], [0.18, 0.46, 0.18])); }
  parts.push(bottle("陶制酒瓶", "#88725c", [0, 0.95, 0], 0.42));
  return asset("fantasyInnTable", "旅店圆桌", "奇幻", "道具", parts);
}

function carvedWardrobe() {
  const parts = [part("衣柜柜体", "box", "#665047", [0, 1.18, 0], [1.65, 2.2, 0.65]), part("柜顶檐", "box", wood, [0, 2.34, 0], [1.9, 0.2, 0.85]), pitchedRoof("雕花山墙", bronze, 1.7, 0.18, 2.45)];
  for (const x of [-0.42, 0.42]) parts.push(part("雕花柜门", "box", "#967349", [x, 1.23, 0.36], [0.77, 1.9, 0.08]), part("柜门镶板", "box", "#775b44", [x, 1.25, 0.42], [0.53, 1.5, 0.04]), part("铜环把手", "torus", bronze, [x * 0.2, 1.25, 0.46], [0.14, 0.18, 0.05]));
  for (const x of [-0.68, 0.68]) for (const z of [-0.22, 0.22]) parts.push(part("衣柜短足", "box", bark, [x, 0.08, z], [0.17, 0.16, 0.17]));
  return asset("fantasyCarvedWardrobe", "雕花衣柜", "奇幻", "道具", parts);
}

function scrollShelf() {
  const parts: ModelPart[] = [];
  for (const x of [-0.8, 0.8]) parts.push(part("卷轴架侧梁", "box", wood, [x, 1.25, 0], [0.14, 2.5, 0.45]));
  for (let row = 0; row < 4; row++) { const y = 0.3 + row * 0.57; parts.push(part("分层搁板", "box", wood, [0, y, 0], [1.7, 0.1, 0.62])); for (let column = 0; column < 5; column++) parts.push(part("羊皮卷", "cylinder", column % 2 ? linen : "#bba77f", [-0.6 + column * 0.3, y + 0.17, 0], [0.19, 0.56, 0.19], [90, 0, 0])); }
  return asset("fantasyScrollShelf", "卷轴书架", "奇幻", "道具", parts);
}

function potionCabinet() {
  const parts = [part("药柜背板", "box", "#48564f", [0, 1.2, -0.23], [1.65, 2.4, 0.1]), part("玻璃柜门", "box", "#a6c4b4", [0, 1.24, 0.3], [1.45, 2.1, 0.03], [0, 0, 0], { opacity: 0.22 })];
  for (const x of [-0.8, 0.8]) parts.push(part("药柜立柱", "box", wood, [x, 1.23, 0], [0.13, 2.46, 0.65]));
  for (let row = 0; row < 3; row++) { const y = 0.2 + row * 0.75; parts.push(part("药柜隔板", "box", wood, [0, y, 0], [1.6, 0.1, 0.65])); for (let index = 0; index < 4; index++) parts.push(bottle("储藏药瓶", ["#758e6e", "#7888a5", "#a08a6d", "#9b758d"][index]!, [-0.53 + index * 0.35, y + 0.06, 0], 0.4 + index % 2 * 0.12)); }
  return asset("fantasyPotionCabinet", "药剂陈列柜", "奇幻", "道具", parts);
}

function suspendedShelf() {
  const parts = [part("悬架上梁", "box", bark, [0, 2.4, 0], [2.2, 0.2, 0.35])];
  for (const x of [-0.96, 0.96]) parts.push(part("支架竖梁", "box", bark, [x, 1.22, 0], [0.16, 2.44, 0.3]));
  for (const y of [0.65, 1.35, 2.05]) { parts.push(part("悬挂木板", "box", wood, [0, y, 0.15], [1.7, 0.09, 0.75])); for (const x of [-0.7, 0.7]) parts.push(part("悬板锁链", "cylinder", iron, [x, y + 0.34, 0.18], [0.045, 0.68, 0.045])); }
  for (let index = 0; index < 6; index++) parts.push(part("旧书", "box", index % 2 ? "#657b74" : "#99725b", [-0.55 + index * 0.22, 1.64, 0.14], [0.16, 0.48, 0.4], [0, 0, (index % 3 - 1) * 6]));
  return asset("fantasySuspendedShelf", "悬链书架", "奇幻", "道具", parts);
}

function canopyBed() {
  const parts = [part("木床架", "box", wood, [0, 0.46, 0], [1.8, 0.23, 2.55]), part("床褥", "box", linen, [0, 0.64, 0], [1.65, 0.22, 2.3]), part("织花床毯", "box", "#786687", [0, 0.77, 0.35], [1.7, 0.045, 1.55]), part("绣枕", "capsule", "#e0d3b9", [0, 0.84, -0.82], [1.05, 0.25, 0.45], [0, 0, 90]), part("帷幔顶", "box", "#91859d", [0, 2.35, 0], [2, 0.09, 2.75])];
  for (const x of [-0.87, 0.87]) for (const z of [-1.22, 1.22]) parts.push(part("床柱", "cylinder", bark, [x, 1.19, z], [0.1, 2.38, 0.1]));
  for (const x of [-0.92, 0.92]) parts.push(part("侧帘", "box", "#b1a4b8", [x, 1.5, -0.55], [0.045, 1.65, 1.25], [0, 0, 0], { opacity: 0.65 }));
  return asset("fantasyCanopyBed", "帷幔床", "奇幻", "道具", parts);
}

function crystalFloorLamp() {
  const parts = [part("水晶灯座", "cylinder", darkStone, [0, 0.12, 0], [0.8, 0.24, 0.8]), part("扭曲灯杆", "tube", bronze, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: 0, y: 0.15, z: 0 }, { x: 0.16, y: 0.8, z: 0 }, { x: -0.12, y: 1.6, z: 0 }, { x: 0, y: 2.2, z: 0 }], radius: 0.07 }), crystal("灯冠晶体", "#b1b2d5", [0, 2.45, 0], [0.45, 0.5, 0.45], { emissive: "#8174a5", emissiveIntensity: 0.4 })];
  for (const side of [-1, 1]) parts.push(beam("灯冠托叶", bronze, [0, 1.85, 0], [side * 0.32, 2.35, 0], 0.045));
  return asset("fantasyCrystalFloorLamp", "水晶立灯", "奇幻", "道具", parts);
}

function lanternPost() {
  const parts = [part("提灯柱脚", "cylinder", stone, [0, 0.1, 0], [0.65, 0.2, 0.65]), part("铁制弯钩", "tube", iron, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: 0, y: 0.1, z: 0 }, { x: 0, y: 2.1, z: 0 }, { x: 0.2, y: 2.5, z: 0 }, { x: 0.65, y: 2.45, z: 0 }, { x: 0.7, y: 2.2, z: 0 }], radius: 0.055 }), part("提灯底盘", "box", bronze, [0.7, 1.55, 0], [0.5, 0.1, 0.5]), part("提灯顶盖", "cone", bronze, [0.7, 2.12, 0], [0.7, 0.2, 0.7]), part("暖色灯芯", "sphere", "#f0d496", [0.7, 1.82, 0], [0.19, 0.28, 0.19], [0, 0, 0], { emissive: "#b98b42", emissiveIntensity: 0.55 })];
  for (const x of [0.49, 0.91]) for (const z of [-0.21, 0.21]) parts.push(part("灯笼棱柱", "box", iron, [x, 1.83, z], [0.045, 0.55, 0.045]));
  return asset("fantasyLanternPost", "提灯灯柱", "奇幻", "道具", parts);
}

function spellBook() {
  const parts: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(part("硬皮书封", "box", "#4d5675", [side * 0.34, 0.12, 0], [0.7, 0.08, 0.95], [0, 0, side * 12]));
    parts.push(part("展开羊皮纸", "box", linen, [side * 0.33, 0.2, 0], [0.63, 0.09, 0.85], [0, 0, side * 12]));
    for (let line = 0; line < 6; line++) parts.push(part("书页笔迹", "box", "#756952", [side * 0.34, 0.255 + Math.abs(side * 0.05), -0.28 + line * 0.1], [0.4, 0.008, 0.013], [0, 0, side * 12]));
  }
  parts.push(part("书脊", "cylinder", bronze, [0, 0.12, 0], [0.09, 0.96, 0.09], [90, 0, 0]), part("织物书签", "box", "#8d4f5c", [0.11, 0.2, 0.49], [0.065, 0.02, 0.34]));
  return asset("fantasySpellBook", "摊开魔法书", "奇幻", "道具", parts);
}

function potionRack() {
  const parts = [part("药瓶托盘", "box", bark, [0, 0.08, 0], [1.35, 0.16, 0.5]), part("架上横梁", "box", wood, [0, 0.54, -0.04], [1.4, 0.1, 0.13])];
  for (const x of [-0.64, 0.64]) parts.push(part("架端支柱", "box", wood, [x, 0.32, -0.04], [0.09, 0.64, 0.42]));
  for (let index = 0; index < 4; index++) parts.push(bottle("分装药瓶", ["#6b937f", "#8a75a0", "#9c8662", "#678c9d"][index]!, [-0.45 + index * 0.3, 0.16, 0.03], 0.48 + (index % 2) * 0.16, { opacity: 0.72, roughness: 0.25 }));
  return asset("fantasyPotionRack", "药瓶架", "奇幻", "道具", parts);
}

function cauldron() {
  const parts = [part("铸铁坩埚", "lathe", iron, [0, 0.2, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.38, y: 0.02 }, { x: 0.72, y: 0.35 }, { x: 0.65, y: 0.9 }, { x: 0.58, y: 0.94 }, { x: 0.57, y: 0.82 }, { x: 0.6, y: 0.38 }, { x: 0.3, y: 0.14 }, { x: 0, y: 0.14 }], metalness: 0.55 }), ring("锅口卷边", iron, 0.7, 0.12, 1.1, 0.12), part("锅中药液", "cylinder", "#6e9c72", [0, 0.87, 0], [1.08, 0.035, 1.08], [0, 0, 0], { roughness: 0.18 })];
  for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(beam("三足锅脚", iron, [Math.cos(angle) * 0.45, 0.38, Math.sin(angle) * 0.45], [Math.cos(angle) * 0.58, 0.03, Math.sin(angle) * 0.58], 0.13)); }
  for (const x of [-0.7, 0.7]) parts.push(part("耳环把手", "torus", iron, [x, 0.86, 0], [0.38, 0.38, 0.12], [0, 90, 0]));
  return asset("fantasyCauldron", "炼金坩埚", "奇幻", "道具", parts);
}

function hourglass() {
  const parts = [part("沙漏玻璃", "lathe", "#a4bbbd", [0, 0.12, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.3, y: 0 }, { x: 0.29, y: 0.13 }, { x: 0.045, y: 0.52 }, { x: 0.29, y: 0.95 }, { x: 0.3, y: 1.1 }, { x: 0, y: 1.1 }], opacity: 0.28, roughness: 0.15 }), part("下层细砂", "cone", "#d4b575", [0, 0.28, 0], [0.4, 0.3, 0.4]), part("沙流", "cylinder", "#d4b575", [0, 0.58, 0], [0.012, 0.38, 0.012])];
  for (const y of [0.06, 1.28]) parts.push(part("沙漏端盘", "cylinder", bronze, [0, y, 0], [0.85, 0.12, 0.85]));
  for (let index = 0; index < 4; index++) { const angle = index * Math.PI / 2 + Math.PI / 4; parts.push(part("沙漏支柱", "cylinder", wood, [Math.cos(angle) * 0.34, 0.66, Math.sin(angle) * 0.34], [0.055, 1.2, 0.055])); }
  return asset("fantasyHourglass", "铜架沙漏", "奇幻", "道具", parts);
}

function celestialGlobe() {
  const parts = [part("天象仪底盘", "cylinder", darkStone, [0, 0.1, 0], [1.1, 0.2, 1.1]), part("天象仪立杆", "lathe", bronze, [0, 0.2, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.3, y: 0 }, { x: 0.16, y: 0.15 }, { x: 0.08, y: 0.6 }, { x: 0.23, y: 0.75 }] }), part("天球", "sphere", "#6c8797", [0, 1.48, 0], [0.65, 0.65, 0.65])];
  for (const rotation of [[90, 0, 0], [0, 0, 0], [20, 45, 0]]) parts.push(part("黄道铜环", "torus", bronze, [0, 1.48, 0], [1.7, 1.7, 0.15], rotation as Triple));
  parts.push(beam("倾斜极轴", iron, [0, 0.95, -0.28], [0, 2.05, 0.28], 0.04));
  return asset("fantasyCelestialGlobe", "古铜天象仪", "奇幻", "道具", parts);
}

function treasureChest() {
  const parts = [part("宝箱箱体", "box", wood, [0, 0.4, 0], [1.8, 0.8, 0.95]), part("弧顶箱盖", "extrude", "#94704c", [0, 0.81, 0], [1, 1, 1], [0, 0, 0], { depth: 0.98, profile: [{ x: -0.9, y: 0 }, { x: 0.9, y: 0 }, { x: 0.86, y: 0.23 }, { x: 0.52, y: 0.48 }, { x: -0.52, y: 0.48 }, { x: -0.86, y: 0.23 }] }), part("箱扣", "box", bronze, [0, 0.8, 0.51], [0.24, 0.38, 0.08])];
  for (const x of [-0.65, 0.65]) { parts.push(part("箱体铁带", "box", iron, [x, 0.42, 0.49], [0.11, 0.8, 0.035]), part("箱盖铁带", "box", iron, [x, 1.23, 0], [0.12, 0.07, 0.95])); }
  for (const x of [-0.92, 0.92]) parts.push(part("抬箱把手", "torus", iron, [x, 0.5, 0], [0.25, 0.32, 0.08], [0, 90, 0]));
  return asset("fantasyTreasureChest", "铁箍宝箱", "奇幻", "道具", parts);
}

function swordInStone() {
  const parts = [crystal("嶙峋巨石", darkStone, [0, 0.55, 0], [1.5, 0.75, 1.2]), part("嵌石剑刃", "extrude", "#b4bdbe", [0, 1.03, 0], [1, 1, 1], [0, 0, -8], { depth: 0.055, profile: [{ x: 0, y: 0 }, { x: 0.13, y: 0.3 }, { x: 0.13, y: 1.17 }, { x: -0.13, y: 1.17 }, { x: -0.13, y: 0.3 }] }), part("剑格", "box", bronze, [0.13, 2.17, 0], [0.68, 0.09, 0.16], [0, 0, -8]), part("缠皮剑柄", "cylinder", wood, [0.17, 2.4, 0], [0.1, 0.4, 0.1], [0, 0, -8]), part("剑首", "sphere", bronze, [0.2, 2.65, 0], [0.18, 0.2, 0.18])];
  return asset("fantasySwordInStone", "传说石中剑", "奇幻", "道具", parts);
}

function shieldRack() {
  const parts = [part("盾架脚座", "box", bark, [0, 0.08, 0], [2.3, 0.16, 0.9]), part("盾架横梁", "box", wood, [0, 1.27, -0.12], [2.2, 0.15, 0.16])];
  for (const x of [-0.95, 0.95]) parts.push(beam("后斜支架", wood, [x, 0.08, -0.35], [x, 1.62, 0.1], 0.12));
  for (let index = 0; index < 3; index++) { const x = (index - 1) * 0.72; parts.push(part("尖底盾", "extrude", index === 1 ? "#765361" : "#667e82", [x, 0.35, 0.18], [1, 1, 1], [0, 0, 0], { depth: 0.1, profile: [{ x: 0, y: 0 }, { x: 0.3, y: 0.33 }, { x: 0.28, y: 1 }, { x: -0.28, y: 1 }, { x: -0.3, y: 0.33 }] }), part("盾面纹章", "box", bronze, [x, 0.98, 0.245], [0.06, 0.45, 0.025])); }
  return asset("fantasyShieldRack", "骑士盾牌架", "奇幻", "道具", parts);
}

function bowRack() {
  const parts = [part("长弓架横脚", "box", wood, [0, 0.08, 0], [1.9, 0.16, 0.7]), part("挂弓横梁", "box", wood, [0, 1.86, 0], [1.9, 0.12, 0.14])];
  for (const x of [-0.85, 0.85]) parts.push(part("长弓架立柱", "box", bark, [x, 0.95, 0], [0.12, 1.9, 0.17]));
  for (const x of [-0.6, 0, 0.6]) { parts.push(part("弯曲长弓", "tube", "#a2825a", [x, 0, 0.12], [1, 1, 1], [0, 0, 0], { path: [{ x: 0, y: 0.24, z: 0 }, { x: 0.18, y: 0.65, z: 0 }, { x: 0.24, y: 1.05, z: 0 }, { x: 0.12, y: 1.55, z: 0 }, { x: 0, y: 1.9, z: 0 }], radius: 0.035 }), part("弓弦", "cylinder", linen, [x, 1.07, 0.12], [0.012, 1.66, 0.012])); }
  return asset("fantasyBowRack", "游侠长弓架", "奇幻", "道具", parts);
}

function staffRack() {
  const parts = [part("法杖架基座", "box", darkStone, [0, 0.12, 0], [1.9, 0.24, 0.65]), part("法杖上托梁", "box", bronze, [0, 1.4, 0], [1.9, 0.1, 0.25])];
  for (let index = 0; index < 4; index++) { const x = -0.66 + index * 0.44, height = 1.8 + index % 2 * 0.3; parts.push(part("木质杖身", "cylinder", bark, [x, height / 2 + 0.2, 0], [0.06, height, 0.06])); if (index % 2) parts.push(part("圆环杖首", "torus", bronze, [x, height + 0.24, 0], [0.4, 0.4, 0.08])); else parts.push(crystal("镶嵌杖晶", "#8a9ca9", [x, height + 0.22, 0], [0.18, 0.23, 0.18])); }
  return asset("fantasyStaffRack", "术士法杖架", "奇幻", "道具", parts);
}

function dragonNest() {
  const parts = [ring("龙巢盘沿", bark, 1.25, 0.4, 0.26, 0.45), part("龙巢草垫", "cylinder", "#9c8d63", [0, 0.18, 0], [1.9, 0.18, 1.9])];
  for (let index = 0; index < 12; index++) { const angle = index * Math.PI / 6; parts.push(beam("交织枯枝", wood, [Math.cos(angle) * 0.8, 0.15, Math.sin(angle) * 0.8], [Math.cos(angle + 0.7) * 1.3, 0.48, Math.sin(angle + 0.7) * 1.3], 0.08)); }
  for (const [x, z] of [[0, -0.28], [-0.4, 0.32], [0.4, 0.32]]) parts.push(part("鳞纹龙蛋", "sphere", "#7f8d83", [x!, 0.65, z!], [0.58, 0.86, 0.58]));
  return asset("fantasyDragonNest", "龙蛋巢", "奇幻", "自然", parts);
}

function giantMushroom() {
  const parts = [part("巨大菌柄", "lathe", "#bcb59c", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.62, y: 0 }, { x: 0.3, y: 1.9 }, { x: 0.55, y: 2.7 }, { x: 0, y: 2.7 }] }), part("宽大菌伞", "lathe", "#786b96", [0, 2.65, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0.95 }, { x: 0.5, y: 0.92 }, { x: 1.5, y: 0.52 }, { x: 1.95, y: 0.02 }, { x: 1.8, y: -0.12 }, { x: 0, y: 0.12 }] })];
  for (let index = 0; index < 9; index++) { const angle = index * Math.PI * 2 / 9; parts.push(part("菌伞斑点", "sphere", "#c1b7cf", [Math.cos(angle) * 1.15, 3.26, Math.sin(angle) * 1.15], [0.28, 0.1, 0.28])); }
  return asset("fantasyGiantMushroom", "巨型林地蘑菇", "奇幻", "自然", parts);
}

function luminousFern() {
  const parts = [part("蕨根", "sphere", "#5f685c", [0, 0.12, 0], [0.6, 0.25, 0.6])];
  for (let index = 0; index < 8; index++) {
    const angle = index * Math.PI / 4, length = 1.1 + index % 3 * 0.18;
    const end: Triple = [Math.cos(angle) * length, 0.62, Math.sin(angle) * length];
    parts.push(beam("蕨叶主脉", "#6e8e78", [0, 0.15, 0], end, 0.025));
    for (let side = -1; side <= 1; side += 2) parts.push(part("锯齿蕨片", "extrude", index % 2 ? "#729a80" : "#536f6d", [end[0] * 0.5, 0.45, end[2] * 0.5], [1, 1, 1], [-65, 90 - index * 45 + side * 18, 0], { depth: 0.018, profile: [{ x: 0, y: 0 }, { x: 0.18, y: 0.14 }, { x: 0.1, y: 0.28 }, { x: 0.23, y: 0.42 }, { x: 0.1, y: 0.55 }, { x: 0, y: 0.82 }, { x: -0.1, y: 0.55 }, { x: -0.2, y: 0.35 }, { x: -0.1, y: 0.2 }] }));
  }
  return asset("fantasyLuminousFern", "灵光蕨丛", "奇幻", "自然", parts);
}

function spiritTree() {
  const parts = [part("古老灵树干", "lathe", bark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.85, y: 0 }, { x: 0.5, y: 1.5 }, { x: 0.37, y: 3.8 }, { x: 0.15, y: 5.2 }, { x: 0, y: 5.2 }] })];
  for (let index = 0; index < 7; index++) { const angle = index * Math.PI * 2 / 7, x = Math.cos(angle), z = Math.sin(angle); parts.push(beam("灵树盘根", bark, [0, 0.75, 0], [x * 1.7, 0.08, z * 1.7], 0.23), beam("分叉树枝", bark, [0, 2.4, 0], [x * 1.65, 4.2, z * 1.65], 0.16), part("银绿色冠叶", "sphere", index % 2 ? "#748f84" : "#93a799", [x * 1.45, 4.7 + index % 2 * 0.45, z * 1.45], [2.1, 1.6, 2])); }
  parts.push(part("古树左眼", "sphere", "#9ab3a1", [-0.22, 2.1, 0.44], [0.1, 0.14, 0.06]), part("古树右眼", "sphere", "#9ab3a1", [0.22, 2.1, 0.44], [0.1, 0.14, 0.06]));
  return asset("fantasySpiritTree", "古老灵树", "奇幻", "自然", parts);
}

function carnivorousPlant() {
  const parts = [part("肉食花根盘", "cylinder", "#59634a", [0, 0.12, 0], [1.4, 0.24, 1.2]), part("弯曲花茎", "tube", "#52735a", [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: 0, y: 0.1, z: 0 }, { x: -0.2, y: 0.7, z: 0 }, { x: 0.2, y: 1.2, z: 0 }, { x: 0, y: 1.65, z: 0 }], radius: 0.13 }), part("张开的花囊", "lathe", "#946b76", [0, 1.45, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.2, y: 0.05 }, { x: 0.65, y: 0.4 }, { x: 0.82, y: 0.8 }, { x: 0.67, y: 0.82 }, { x: 0.49, y: 0.4 }, { x: 0, y: 0.18 }] })];
  for (let index = 0; index < 10; index++) { const angle = index * Math.PI / 5; parts.push(part("花口尖齿", "cone", linen, [Math.cos(angle) * 0.72, 2.28, Math.sin(angle) * 0.72], [0.1, 0.3, 0.1], [0, 0, 180])); }
  for (const side of [-1, 1]) parts.push(part("基部肥叶", "sphere", leaf, [side * 0.48, 0.28, 0], [1.1, 0.18, 0.5], [0, side * 25, side * 15]));
  return asset("fantasyCarnivorousPlant", "张口食人花", "奇幻", "自然", parts);
}

function crystalCluster() {
  const parts = [part("晶矿母岩", "sphere", darkStone, [0, 0.2, 0], [2.1, 0.45, 1.6])];
  for (let index = 0; index < 7; index++) { const angle = index * Math.PI * 2 / 7, size = 0.45 + index % 3 * 0.2; parts.push(crystal("原生晶柱", index % 2 ? "#879cb5" : "#9a86ad", [Math.cos(angle) * 0.65, 0.55 + size * 0.5, Math.sin(angle) * 0.48], [0.4, size, 0.35])); }
  return asset("fantasyCrystalCluster", "原生晶簇", "奇幻", "自然", parts);
}

function floatingRock() {
  const parts = [part("地面石环", "cylinder", darkStone, [0, 0.06, 0], [2.1, 0.12, 2.1]), crystal("悬空岩台", "#737984", [0, 1.6, 0], [2.7, 0.9, 2.2]), part("岩台草面", "cylinder", "#718565", [0, 2.24, 0], [2.35, 0.12, 1.85])];
  for (let index = 0; index < 5; index++) { const angle = index * Math.PI * 2 / 5; parts.push(beam("悬垂根须", bark, [Math.cos(angle) * 0.75, 1.8, Math.sin(angle) * 0.62], [Math.cos(angle) * 0.4, 0.85 + index % 2 * 0.25, Math.sin(angle) * 0.4], 0.06)); }
  return asset("fantasyFloatingRock", "漂浮岩台", "奇幻", "自然", parts);
}

function starFlower() {
  const parts = [part("星花茎", "tube", leaf, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: 0, y: 0, z: 0 }, { x: 0.08, y: 0.5, z: 0 }, { x: -0.08, y: 1, z: 0 }, { x: 0, y: 1.5, z: 0 }], radius: 0.04 }), part("花心", "sphere", "#d2b678", [0, 1.53, 0], [0.28, 0.18, 0.28])];
  for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4; parts.push(part("星形花瓣", "extrude", "#b5a3c5", [Math.cos(angle) * 0.08, 1.5, Math.sin(angle) * 0.08], [1, 1, 1], [-75, 90 - index * 45, 0], { depth: 0.025, profile: [{ x: 0, y: 0 }, { x: 0.17, y: 0.24 }, { x: 0, y: 0.74 }, { x: -0.17, y: 0.24 }] })); }
  for (const side of [-1, 1]) parts.push(part("披针形叶", "sphere", leaf, [side * 0.28, 0.54, 0], [0.75, 0.1, 0.24], [0, 0, side * 25]));
  return asset("fantasyStarFlower", "星瓣花", "奇幻", "自然", parts);
}

function rootArch() {
  const parts: ModelPart[] = [];
  for (let index = 0; index < 3; index++) parts.push(part("盘根拱干", "tube", index % 2 ? "#76614d" : bark, [0, 0, (index - 1) * 0.22], [1, 1, 1], [0, 0, 0], { path: [{ x: -1.65, y: 0.03, z: 0 }, { x: -1.45, y: 1.55, z: 0.14 }, { x: -0.78, y: 2.75, z: -0.12 }, { x: 0.42, y: 3.1, z: 0 }, { x: 1.35, y: 1.7, z: 0.16 }, { x: 1.65, y: 0.08, z: 0 }], radius: 0.16 + index * 0.025 }));
  for (const side of [-1, 1]) parts.push(beam("外伸树根", bark, [side * 1.55, 0.5, 0], [side * 2.2, 0.06, 0.65], 0.14), part("拱顶苔叶", "sphere", leaf, [side * 0.75, 2.85, -0.1], [1.25, 0.55, 0.8]));
  return asset("fantasyRootArch", "盘根拱", "奇幻", "自然", parts);
}

function ballista() {
  const parts = [part("弩机底架", "box", wood, [0, 0.72, 0], [1.8, 0.25, 1.7]), part("滑箭导轨", "box", iron, [0, 1.4, 0.15], [0.28, 0.16, 2.7]), part("横向弩臂", "tube", "#8c7753", [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: -1.6, y: 1.55, z: 0.42 }, { x: -0.8, y: 1.5, z: -0.12 }, { x: 0, y: 1.45, z: -0.25 }, { x: 0.8, y: 1.5, z: -0.12 }, { x: 1.6, y: 1.55, z: 0.42 }], radius: 0.1 }), beam("绷紧弩弦", linen, [-1.6, 1.55, 0.42], [1.6, 1.55, 0.42], 0.025), part("装填弩箭", "cylinder", bronze, [0, 1.57, 0.25], [0.055, 2.6, 0.055], [90, 0, 0])];
  for (const x of [-0.8, 0.8]) { parts.push(beam("弩机斜撑", wood, [x, 0.65, 0.55], [0, 1.4, 0], 0.16)); for (const z of [-0.55, 0.55]) parts.push(part("弩车木轮", "cylinder", bark, [x, 0.4, z], [0.7, 0.15, 0.7], [0, 0, 90])); }
  return asset("fantasyBallista", "守城弩机", "奇幻", "道具", parts);
}

function gearGate() {
  const parts = [part("闸门基座", "box", darkStone, [0, 0.1, 0], [4, 0.2, 1.4]), part("闸门顶梁", "box", stone, [0, 3.2, 0], [3.8, 0.45, 1.1]), part("石质升降闸", "box", "#6e7378", [0, 1.68, 0], [2.2, 2.9, 0.38]), part("传动齿圈", "torus", bronze, [1.25, 2.5, 0.7], [1.25, 1.25, 0.25])];
  for (const x of [-1.55, 1.55]) parts.push(part("导轨石柱", "box", stone, [x, 1.65, 0], [0.64, 3.1, 1.1]));
  for (let index = 0; index < 12; index++) { const angle = index * Math.PI / 6; parts.push(part("齿轮轮齿", "box", bronze, [1.25 + Math.cos(angle) * 0.61, 2.5 + Math.sin(angle) * 0.61, 0.7], [0.18, 0.16, 0.18], [0, 0, index * 30])); }
  return asset("fantasyGearGate", "齿轮石闸", "奇幻", "建筑", parts);
}

function watermill() {
  const parts = [part("磨坊石基", "box", stone, [0, 0.4, 0], [3.2, 0.8, 2.7]), part("磨坊木屋", "box", "#aa9274", [0, 1.8, 0], [2.8, 2, 2.3]), pitchedRoof("磨坊坡屋顶", "#68584d", 3.5, 3, 2.8), part("水车轮轴", "cylinder", iron, [1.8, 1.3, 0], [0.14, 1.3, 0.14], [0, 0, 90]), part("水车外圈", "torus", wood, [2.1, 1.3, 0], [2.6, 2.6, 0.36], [0, 90, 0]), part("磨坊门", "box", bark, [0, 1.34, 1.2], [0.7, 1.3, 0.08])];
  for (let index = 0; index < 12; index++) { const angle = index * Math.PI / 6; parts.push(beam("水车辐条", wood, [2.1, 1.3, 0], [2.1, 1.3 + Math.cos(angle) * 1.18, Math.sin(angle) * 1.18], 0.07), part("水车轮叶", "box", "#927254", [2.1, 1.3 + Math.cos(angle) * 1.2, Math.sin(angle) * 1.2], [0.55, 0.22, 0.35], [index * 30, 0, 0])); }
  return asset("fantasyWatermill", "水车磨坊", "奇幻", "建筑", parts);
}

function broomRack() {
  const parts = [part("飞帚架横脚", "box", bark, [0, 0.08, 0], [2.2, 0.16, 0.75]), part("飞帚架上梁", "box", wood, [0, 1.45, 0], [2.1, 0.13, 0.2])];
  for (const x of [-0.95, 0.95]) parts.push(part("支架木柱", "box", wood, [x, 0.75, 0], [0.11, 1.5, 0.28]));
  for (let index = 0; index < 4; index++) { const x = -0.7 + index * 0.46; parts.push(beam("飞帚柄", bark, [x, 0.45, 0], [x + 0.16, 2.2, 0], 0.045), part("蓬松帚尾", "cone", "#b49b68", [x - 0.02, 0.35, 0], [0.38, 0.7, 0.34], [0, 0, -5]), part("扎帚铜箍", "cylinder", bronze, [x + 0.02, 0.6, 0], [0.14, 0.1, 0.14])); }
  return asset("fantasyBroomRack", "飞帚架", "奇幻", "道具", parts);
}

function gryphonCart() {
  const parts = [part("货车底板", "box", wood, [0, 0.85, 0], [2, 0.2, 2.5]), part("货舱", "box", "#947b59", [0, 1.1, 0.15], [1.7, 0.4, 1.75]), part("狮鹫颈", "capsule", bronze, [0, 1.65, -1.15], [0.35, 0.9, 0.42], [-20, 0, 0]), part("狮鹫头", "sphere", bronze, [0, 2.15, -1.32], [0.5, 0.46, 0.55]), part("鹰喙", "cone", "#b6a379", [0, 2.12, -1.67], [0.3, 0.5, 0.3], [-90, 0, 0])];
  for (const side of [-1, 1]) { parts.push(part("侧翼", "extrude", "#8c9392", [side * 0.85, 1.3, 0], [1, 1, 1], [0, side < 0 ? 180 : 0, 0], { depth: 0.1, profile: [{ x: 0, y: 0 }, { x: 0.8, y: 1.4 }, { x: 1.6, y: 1.6 }, { x: 1.1, y: 0.9 }, { x: 1.3, y: 0.8 }, { x: 0.7, y: 0.55 }] })); for (const z of [-0.8, 0.8]) parts.push(part("货车轮", "cylinder", iron, [side * 1.05, 0.42, z], [0.8, 0.14, 0.8], [0, 0, 90])); }
  return asset("fantasyGryphonCart", "狮鹫货车", "奇幻", "道具", parts);
}

function sealedCage() {
  const parts = [part("封印牢底", "cylinder", darkStone, [0, 0.13, 0], [2.6, 0.26, 2.6]), ring("牢笼上箍", iron, 1.15, 0.08, 2.25, 0.14), part("穹顶锁", "sphere", bronze, [0, 2.95, 0], [0.22, 0.22, 0.22])];
  for (let index = 0; index < 10; index++) { const angle = index * Math.PI / 5; const x = Math.cos(angle), z = Math.sin(angle); parts.push(part("弯曲牢栏", "tube", iron, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: x * 1.15, y: 0.2, z: z * 1.15 }, { x: x * 1.15, y: 2.2, z: z * 1.15 }, { x: x * 0.75, y: 2.65, z: z * 0.75 }, { x: 0, y: 2.9, z: 0 }], radius: 0.045 })); }
  return asset("fantasySealedCage", "封印牢笼", "奇幻", "道具", parts);
}

function colonyHabitat() {
  const parts = [part("居住舱壳", "capsule", hull, [0, 1.65, 0], [4.8, 5.8, 4.8], [0, 0, 90]), part("舱底托架", "box", navy, [0, 0.48, 0], [4.8, 0.28, 2]), part("舱侧气密门", "box", steel, [0, 1.3, 1.14], [0.9, 1.8, 0.14]), part("门下踏台", "box", steel, [0, 0.26, 1.6], [1.4, 0.25, 0.9]), part("屋顶通风盒", "box", navy, [0, 2.92, 0], [1.8, 0.35, 0.8])];
  for (const x of [-1.8, 1.8]) { parts.push(part("着陆支腿", "box", steel, [x, 0.24, 0], [0.25, 0.48, 1.8])); for (const z of [-1.16, 1.16]) parts.push(part("舷窗", "box", blue, [x * 0.7, 1.8, z], [0.75, 0.55, 0.06])); }
  return asset("futureColonyHabitat", "殖民居住舱", "科幻", "建筑", parts);
}

function researchDome() {
  const parts = [part("科研台基", "cylinder", steel, [0, 0.16, 0], [5, 0.32, 5]), part("透明科研穹顶", "lathe", "#a3c5d2", [0, 0.3, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 2.35, y: 0 }, { x: 2.3, y: 0.6 }, { x: 1.96, y: 1.4 }, { x: 1.32, y: 2 }, { x: 0.5, y: 2.32 }, { x: 0, y: 2.38 }], opacity: 0.32, roughness: 0.18 }), ring("穹顶底箍", navy, 2.4, 0.14, 0.37, 0.2), part("穹顶内操作台", "box", hull, [0, 0.9, -0.5], [2.5, 0.15, 0.8])];
  for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3; parts.push(part("穹顶弧肋", "tube", steel, [0, 0.3, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: Math.cos(angle) * 2.35, y: 0, z: Math.sin(angle) * 2.35 }, { x: Math.cos(angle) * 1.9, y: 1.45, z: Math.sin(angle) * 1.9 }, { x: Math.cos(angle) * 0.9, y: 2.2, z: Math.sin(angle) * 0.9 }, { x: 0, y: 2.4, z: 0 }], radius: 0.045 })); }
  return asset("futureResearchDome", "科研穹顶", "科幻", "建筑", parts);
}

function pressureAirlock() {
  const parts = [part("气闸地台", "box", navy, [0, 0.12, 0], [3.2, 0.24, 1.3]), part("气闸上框", "box", hull, [0, 2.65, 0], [3.1, 0.35, 0.9]), part("门控面板", "box", steel, [1.3, 1.4, 0.53], [0.22, 0.5, 0.08])];
  for (const side of [-1, 1]) parts.push(part("门框承柱", "box", hull, [side * 1.35, 1.4, 0], [0.4, 2.4, 0.9]), part("对开气密门", "box", steel, [side * 0.59, 1.4, 0], [1.13, 2.35, 0.25]), part("内框压条", "box", navy, [side * 1.1, 1.4, 0.3], [0.08, 2.25, 0.08]), part("门扇斜标记", "box", copper, [side * 0.6, 0.65, 0.15], [0.68, 0.08, 0.035], [0, 0, side * 30]));
  return asset("futurePressureAirlock", "气密舱门", "科幻", "建筑", parts);
}

function modularCorridor() {
  const parts = [part("走廊地板", "box", navy, [0, 0.12, 0], [2.8, 0.24, 6]), part("走廊顶板", "box", hull, [0, 2.75, 0], [2.8, 0.18, 6])];
  for (const z of [-2.8, 0, 2.8]) for (const side of [-1, 1]) parts.push(part("走廊肋柱", "box", steel, [side * 1.28, 1.42, z], [0.16, 2.65, 0.2]), beam("顶角斜肋", steel, [side * 1.28, 2.15, z], [side * 0.75, 2.75, z], 0.16));
  for (const x of [-1.32, 1.32]) parts.push(part("侧壁装甲", "box", hull, [x, 0.7, 0], [0.12, 1.05, 5.6]), part("观察窗带", "box", blue, [x, 1.9, 0], [0.06, 0.9, 5.45], [0, 0, 0], { opacity: 0.48 }));
  return asset("futureModularCorridor", "模块走廊", "科幻", "建筑", parts);
}

function landingPad() {
  const parts = [part("停机坪基台", "cylinder", navy, [0, 0.18, 0], [7, 0.36, 7]), part("防滑面层", "cylinder", steel, [0, 0.38, 0], [6.6, 0.06, 6.6]), part("着陆标记横画", "box", linen, [0, 0.42, 0], [2.3, 0.015, 0.25])];
  for (const x of [-1.03, 1.03]) parts.push(part("着陆标记竖画", "box", linen, [x, 0.42, 0], [0.25, 0.015, 2.5]));
  for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4; parts.push(part("坪边警示灯座", "cylinder", copper, [Math.cos(angle) * 3.22, 0.55, Math.sin(angle) * 3.22], [0.18, 0.3, 0.18]), part("坪边灯罩", "sphere", "#d8b675", [Math.cos(angle) * 3.22, 0.74, Math.sin(angle) * 3.22], [0.16, 0.16, 0.16])); }
  return asset("futureLandingPad", "飞船停机坪", "科幻", "建筑", parts);
}

function cargoHangar() {
  const parts = [part("机库地坪", "box", navy, [0, 0.1, 0], [6.4, 0.2, 5.5]), part("机库屋盖", "box", hull, [0, 3.8, 0], [6.5, 0.3, 5.7]), part("机库后墙", "box", steel, [0, 1.95, -2.55], [6, 3.7, 0.16]), part("卷门上盒", "box", steel, [0, 3.45, 2.7], [5.8, 0.45, 0.42])];
  for (const x of [-3, 3]) parts.push(part("机库侧墙", "box", hull, [x, 1.95, 0], [0.22, 3.7, 5.5]));
  for (const x of [-2.9, 2.9]) for (const z of [-2.6, 2.6]) parts.push(part("机库角柱", "box", navy, [x, 1.95, z], [0.24, 3.8, 0.25]));
  for (let index = 0; index < 6; index++) parts.push(part("机库顶撑", "box", navy, [0, 3.58, -2.25 + index * 0.9], [6, 0.13, 0.12]));
  return asset("futureCargoHangar", "货运机库", "科幻", "建筑", parts);
}

function hydroponicPod() {
  const parts = [part("水培舱台座", "box", navy, [0, 0.24, 0], [3.2, 0.48, 1.8]), part("水培舱顶盖", "box", hull, [0, 2.3, 0], [3.2, 0.2, 1.8]), part("水培舱后玻璃", "box", "#96b6bd", [0, 1.42, -0.82], [2.9, 1.6, 0.04], [0, 0, 0], { opacity: 0.25 })];
  for (const x of [-1.45, 1.45]) for (const z of [-0.78, 0.78]) parts.push(part("培育舱框杆", "box", steel, [x, 1.4, z], [0.1, 1.8, 0.1]));
  for (const x of [-0.95, 0, 0.95]) for (const z of [-0.34, 0.34]) { parts.push(part("水培营养杯", "cylinder", hull, [x, 0.62, z], [0.4, 0.26, 0.4]), part("培育植株茎", "cylinder", leaf, [x, 0.97, z], [0.035, 0.6, 0.035]), part("培育叶片", "sphere", "#7fa06f", [x, 1.15, z], [0.5, 0.17, 0.35], [0, 30, 25])); }
  return asset("futureHydroponicPod", "水培培育舱", "科幻", "建筑", parts);
}

function observationDeck() {
  const parts = [part("观测平台", "cylinder", steel, [0, 0.85, 0], [4.2, 0.25, 4.2]), ring("平台栏杆环", navy, 2, 0.07, 1.85, 0.1), part("观测座椅", "box", hull, [0, 1.3, -0.7], [1.6, 0.22, 0.55]), part("操作台", "box", navy, [0, 1.45, 0.7], [1.8, 0.18, 0.6], [-15, 0, 0])];
  for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4; parts.push(part("栏杆柱", "cylinder", navy, [Math.cos(angle) * 2, 1.38, Math.sin(angle) * 2], [0.06, 0.9, 0.06])); if (index % 2 === 0) parts.push(beam("外展平台脚", steel, [Math.cos(angle) * 1.3, 0.78, Math.sin(angle) * 1.3], [Math.cos(angle) * 1.7, 0.05, Math.sin(angle) * 1.7], 0.16)); }
  return asset("futureObservationDeck", "观测平台", "科幻", "建筑", parts);
}

function elevatorDock() {
  const parts = [part("接驳地台", "box", navy, [0, 0.18, 0], [5, 0.36, 4]), part("升降笼底盘", "box", steel, [0, 2.5, 0], [2.4, 0.25, 2.4]), part("缆索", "cylinder", iron, [0, 4.2, -0.9], [0.08, 8.4, 0.08]), part("接驳廊桥", "box", hull, [2, 2.5, 0], [2.8, 0.22, 1.5])];
  for (const x of [-1.4, 1.4]) for (const z of [-1.3, 1.3]) parts.push(part("电梯塔柱", "box", hull, [x, 3.75, z], [0.2, 7.5, 0.2]));
  for (const y of [0.8, 3, 5.3, 7.4]) parts.push(part("塔架横撑", "box", steel, [0, y, -1.3], [3, 0.18, 0.2]), beam("塔架对角撑", steel, [-1.3, Math.max(0.3, y - 1.8), -1.3], [1.3, y, -1.3], 0.09));
  return asset("futureElevatorDock", "太空电梯接驳台", "科幻", "建筑", parts);
}

function launchGantry() {
  const parts = [part("维护架基础", "box", navy, [0, 0.16, 0], [5, 0.32, 3.2]), part("顶端横梁", "box", hull, [0, 5.6, 0], [4.5, 0.35, 0.6])];
  for (const x of [-1.9, 1.9]) parts.push(part("发射架立柱", "box", steel, [x, 2.9, 0], [0.34, 5.4, 0.4]));
  for (const y of [1.5, 3.3, 5.05]) { parts.push(part("维护踏台", "box", hull, [-1.2, y, 0.65], [1.9, 0.14, 1.2]), beam("维护踏台斜撑", navy, [-1.9, y - 0.8, 0], [-0.4, y, 0.8], 0.12)); for (const side of [-1, 1]) parts.push(part("锁紧支臂", "box", copper, [side * 1.3, y + 0.25, 0], [1.25, 0.16, 0.25])); }
  return asset("futureLaunchGantry", "发射维护架", "科幻", "建筑", parts);
}

function commandChair() {
  const parts = [part("指挥椅底盘", "cylinder", navy, [0, 0.08, 0], [1.1, 0.16, 1.1]), part("旋转椅柱", "cylinder", steel, [0, 0.34, 0], [0.2, 0.5, 0.2]), part("座垫", "box", "#687b86", [0, 0.65, 0], [0.88, 0.22, 0.82]), part("高背靠垫", "box", navy, [0, 1.25, -0.36], [0.85, 1.15, 0.18], [-12, 0, 0]), part("头枕", "capsule", steel, [0, 1.86, -0.46], [0.65, 0.3, 0.3], [0, 0, 90])];
  for (const x of [-0.55, 0.55]) parts.push(part("扶手控制台", "box", hull, [x, 0.95, 0.08], [0.27, 0.18, 0.8]), part("扶手显示面", "box", blue, [x, 1.05, 0.22], [0.2, 0.025, 0.3]));
  return asset("futureCommandChair", "舰桥指挥座椅", "科幻", "道具", parts);
}

function medicalBed() {
  const parts = [part("医疗床底柜", "box", hull, [0, 0.38, 0], [0.8, 0.7, 1.8]), part("医疗床台", "box", steel, [0, 0.8, 0], [1.05, 0.12, 2.4]), part("诊疗床垫", "box", "#89afb0", [0, 0.93, 0.1], [0.9, 0.16, 2]), part("可调头枕", "box", "#789b9d", [0, 1.1, -0.85], [0.85, 0.15, 0.5], [-18, 0, 0]), part("床边监视器", "box", navy, [0.8, 1.5, -0.65], [0.6, 0.48, 0.1]), beam("监视器支臂", steel, [0.48, 0.8, -0.7], [0.8, 1.42, -0.7], 0.06)];
  for (const x of [-0.6, 0.6]) parts.push(part("护栏", "capsule", hull, [x, 1.14, 0.2], [0.12, 1.35, 0.18], [90, 0, 0]));
  return asset("futureMedicalBed", "医疗诊疗床", "科幻", "道具", parts);
}

function laboratoryBench() {
  const parts = tableParts("实验台", 2.7, 1.1, 0.95, hull);
  parts.push(part("实验台下柜", "box", steel, [-0.75, 0.5, 0], [0.85, 0.9, 0.9]), part("仪器背板", "box", navy, [0, 1.4, -0.43], [2.5, 0.75, 0.12]), part("分析仪", "box", steel, [0.7, 1.16, 0], [0.65, 0.3, 0.55]), part("分析显示窗", "box", blue, [0.7, 1.2, 0.29], [0.45, 0.16, 0.025]));
  for (let index = 0; index < 4; index++) parts.push(part("量筒", "cylinder", "#98bcc5", [-0.7 + index * 0.28, 1.24, 0.1], [0.13, 0.5, 0.13], [0, 0, 0], { opacity: 0.45, roughness: 0.16 }));
  return asset("futureLaboratoryBench", "实验工作台", "科幻", "道具", parts);
}

function hologramTable() {
  const parts = [part("全息台底盘", "cylinder", navy, [0, 0.1, 0], [1.8, 0.2, 1.8]), part("六角台身", "cylinder", steel, [0, 0.55, 0], [1.25, 0.9, 1.25]), part("投影桌面", "cylinder", hull, [0, 1.05, 0], [2.2, 0.16, 2.2]), ring("投影发射环", blue, 0.82, 0.1, 1.16, 0.04), part("全息地形球", "sphere", "#72b0c3", [0, 1.52, 0], [0.95, 0.7, 0.95], [0, 0, 0], { opacity: 0.32, emissive: "#3e7d9a", emissiveIntensity: 0.5 })];
  for (let index = 0; index < 4; index++) { const angle = index * Math.PI / 2; parts.push(part("桌缘操作板", "box", navy, [Math.cos(angle) * 0.92, 1.14, Math.sin(angle) * 0.92], [0.38, 0.035, 0.18], [0, 90 - index * 90, 0])); }
  return asset("futureHologramTable", "全息沙盘", "科幻", "道具", parts);
}

function sleepingPod() {
  const parts = [part("休眠舱底座", "box", navy, [0, 0.28, 0], [1.3, 0.56, 2.9]), part("舱内躺垫", "box", "#6f919c", [0, 0.62, 0], [1, 0.18, 2.4]), part("透明舱盖", "capsule", "#a9c7cc", [0, 0.9, 0], [2.1, 2.6, 1.45], [90, 0, 0], { opacity: 0.24, roughness: 0.12 })];
  for (const z of [-1.2, 1.2]) parts.push(part("舱端护圈", "torus", hull, [0, 0.85, z], [1.38, 1, 0.2]), part("舱端锁闩", "box", steel, [0, 1.26, z], [0.5, 0.15, 0.22]));
  parts.push(part("休眠显示板", "box", blue, [0.73, 0.78, -0.9], [0.12, 0.3, 0.48]));
  return asset("futureSleepingPod", "休眠胶囊", "科幻", "道具", parts);
}

function lockerArray() {
  const parts = [part("储物柜顶板", "box", hull, [0, 2.1, 0], [2.1, 0.12, 0.75]), part("储物柜底座", "box", navy, [0, 0.08, 0], [2.1, 0.16, 0.75])];
  for (let index = 0; index < 3; index++) { const x = (index - 1) * 0.7; parts.push(part("独立储物柜体", "box", steel, [x, 1.08, 0], [0.66, 1.98, 0.68]), part("储物柜门", "box", hull, [x, 1.1, 0.37], [0.6, 1.85, 0.045]), part("柜门把手", "box", navy, [x + 0.19, 1.02, 0.41], [0.05, 0.24, 0.035])); for (let slot = 0; slot < 4; slot++) parts.push(part("柜门通风槽", "box", navy, [x, 1.7 + slot * 0.06, 0.401], [0.37, 0.025, 0.015])); }
  return asset("futureLockerArray", "组合储物柜", "科幻", "道具", parts);
}

function serverRack() {
  const parts = [part("机架底座", "box", navy, [0, 0.09, 0], [1, 0.18, 0.95]), part("机架顶盖", "box", steel, [0, 2.15, 0], [1, 0.12, 0.95])];
  for (const x of [-0.43, 0.43]) for (const z of [-0.39, 0.39]) parts.push(part("机架立梁", "box", steel, [x, 1.1, z], [0.07, 2.05, 0.07]));
  for (let index = 0; index < 7; index++) { const y = 0.32 + index * 0.25; parts.push(part("服务器单元", "box", "#465864", [0, y, 0], [0.78, 0.2, 0.8]), part("服务器面板", "box", "#7f9299", [0, y, 0.42], [0.68, 0.14, 0.025]), part("状态指示点", "box", "#8cb89f", [0.24, y, 0.44], [0.035, 0.035, 0.015])); }
  return asset("futureServerRack", "服务器机架", "科幻", "道具", parts);
}

function equipmentCabinet() {
  const parts = [part("维修柜箱身", "box", steel, [0, 0.85, 0], [1.8, 1.45, 0.75]), part("维修柜台面", "box", hull, [0, 1.62, 0], [1.95, 0.13, 0.88]), part("侧挂工具板", "box", navy, [0, 2, -0.3], [1.7, 0.7, 0.1])];
  for (let index = 0; index < 4; index++) parts.push(part("抽屉面", "box", hull, [0.34, 0.42 + index * 0.29, 0.4], [0.95, 0.23, 0.05]), part("抽屉扣手", "box", navy, [0.34, 0.44 + index * 0.29, 0.44], [0.36, 0.04, 0.035]));
  parts.push(part("大工具门", "box", navy, [-0.58, 0.86, 0.4], [0.5, 1.15, 0.06]));
  for (const x of [-0.7, 0.7]) for (const z of [-0.25, 0.25]) parts.push(part("柜底脚轮", "cylinder", iron, [x, 0.12, z], [0.22, 0.09, 0.22], [0, 0, 90]));
  return asset("futureEquipmentCabinet", "维修设备柜", "科幻", "道具", parts);
}

function crewDiningBooth() {
  const parts = [part("餐桌中柱", "box", steel, [0, 0.46, 0], [0.3, 0.9, 0.7]), part("船员餐桌", "box", hull, [0, 0.95, 0], [1.2, 0.13, 1.8])];
  for (const x of [-1, 1]) parts.push(part("餐座底舱", "box", navy, [x, 0.28, 0], [0.65, 0.55, 2]), part("长条座垫", "box", "#779393", [x, 0.64, 0], [0.7, 0.18, 1.9]), part("围合靠背", "box", "#607b82", [x * 1.3, 1.05, 0], [0.16, 0.75, 2.05]));
  parts.push(part("餐桌托盘", "box", steel, [0, 1.03, -0.32], [0.55, 0.035, 0.43]));
  return asset("futureCrewDiningBooth", "船员餐座", "科幻", "道具", parts);
}

function exerciseStation() {
  const parts = [part("训练机底台", "box", navy, [0, 0.16, 0], [1.15, 0.32, 2.3]), part("跑带", "box", "#485b65", [0, 0.35, 0], [0.87, 0.08, 1.85], [-4, 0, 0]), part("控制台", "box", steel, [0, 1.4, -0.85], [0.95, 0.17, 0.45], [20, 0, 0]), part("控制屏", "box", blue, [0, 1.51, -0.88], [0.6, 0.025, 0.25], [20, 0, 0])];
  for (const x of [-0.49, 0.49]) parts.push(beam("训练机斜立杆", hull, [x, 0.28, -0.45], [x, 1.35, -0.9], 0.09), part("扶持栏", "tube", steel, [x, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: 0, y: 1.25, z: -0.85 }, { x: 0, y: 1.15, z: -0.25 }, { x: 0, y: 1.05, z: 0.4 }], radius: 0.04 }));
  return asset("futureExerciseStation", "舰载训练器械", "科幻", "道具", parts);
}

function serviceRobot() {
  const parts = [part("机器人底盘", "cylinder", navy, [0, 0.25, 0], [0.8, 0.35, 0.8]), part("机器人躯干", "capsule", hull, [0, 0.98, 0], [1.2, 1, 1]), part("机器人头部", "box", steel, [0, 1.67, 0], [0.58, 0.36, 0.4]), part("感知镜头", "cylinder", blue, [0, 1.69, 0.24], [0.2, 0.08, 0.2], [90, 0, 0]), part("胸前工具仓", "box", navy, [0, 1.02, 0.3], [0.38, 0.36, 0.12])];
  for (const side of [-1, 1]) { parts.push(part("机器人行走轮", "cylinder", iron, [side * 0.4, 0.23, 0], [0.45, 0.15, 0.45], [0, 0, 90]), beam("上臂", steel, [side * 0.32, 1.25, 0], [side * 0.6, 0.95, 0.08], 0.1), beam("前臂", hull, [side * 0.6, 0.95, 0.08], [side * 0.52, 0.74, 0.35], 0.09)); for (const z of [0.3, 0.42]) parts.push(part("夹持手指", "box", navy, [side * 0.52, 0.72, z], [0.12, 0.12, 0.045])); }
  return asset("futureServiceRobot", "勤务机器人", "科幻", "道具", parts);
}

function cargoDrone() {
  const parts = [part("无人机机身", "box", hull, [0, 0.75, 0], [0.85, 0.3, 0.85]), part("吊运挂钩", "torus", steel, [0, 0.36, 0], [0.28, 0.4, 0.1]), part("机腹吊杆", "cylinder", navy, [0, 0.52, 0], [0.07, 0.35, 0.07])];
  for (const x of [-0.85, 0.85]) for (const z of [-0.85, 0.85]) { parts.push(beam("旋翼支臂", steel, [0, 0.77, 0], [x, 0.77, z], 0.09), part("涵道护圈", "torus", navy, [x, 0.82, z], [0.95, 0.95, 0.16], [90, 0, 0]), part("旋翼桨叶", "box", steel, [x, 0.83, z], [0.75, 0.035, 0.11], [0, x < 0 ? 25 : -25, 0]), part("着陆脚", "box", navy, [x * 0.58, 0.33, z * 0.58], [0.07, 0.6, 0.12])); }
  return asset("futureCargoDrone", "货运无人机", "科幻", "道具", parts);
}

function explorationRover() {
  const parts = [part("月球车底盘", "box", hull, [0, 0.85, 0], [1.65, 0.45, 2.4]), part("车顶仪器舱", "box", steel, [0, 1.25, -0.3], [1.2, 0.4, 1.35]), part("相机桅杆", "cylinder", navy, [0, 1.85, 0.75], [0.09, 1.45, 0.09]), part("双目相机", "box", hull, [0, 2.6, 0.75], [0.55, 0.28, 0.3]), part("太阳能顶板", "box", blue, [0, 1.48, -0.3], [1.75, 0.045, 1.4])];
  for (const side of [-1, 1]) for (const z of [-0.9, 0, 0.9]) parts.push(part("独立行走轮", "cylinder", iron, [side * 1, 0.43, z], [0.78, 0.23, 0.78], [0, 0, 90]), beam("摇臂悬架", steel, [side * 0.68, 0.8, z * 0.5], [side * 1, 0.43, z], 0.1));
  for (const x of [-0.17, 0.17]) parts.push(part("相机物镜", "cylinder", navy, [x, 2.61, 0.93], [0.15, 0.1, 0.15], [90, 0, 0]));
  return asset("futureExplorationRover", "勘探月球车", "科幻", "道具", parts);
}

function railShuttle() {
  const parts = [part("摆渡车车厢", "box", hull, [0, 1.5, 0], [2.1, 2.1, 5]), part("车顶圆舱", "capsule", steel, [0, 2.58, 0], [3.8, 4.8, 0.8], [90, 0, 0]), part("车底裙板", "box", navy, [0, 0.55, 0], [2.2, 0.4, 5.1]), part("前风挡", "box", blue, [0, 1.9, 2.54], [1.7, 0.95, 0.06])];
  for (const side of [-1, 1]) { for (const z of [-1.65, 0.85]) parts.push(part("侧窗", "box", blue, [side * 1.07, 1.9, z], [0.045, 0.85, 1.25])); parts.push(part("车厢门", "box", steel, [side * 1.08, 1.42, -0.4], [0.06, 1.75, 0.8]), part("钢轨", "box", iron, [side * 0.65, 0.09, 0], [0.14, 0.18, 6.5])); for (const z of [-1.65, 1.65]) parts.push(part("导向轮", "cylinder", iron, [side * 0.65, 0.36, z], [0.55, 0.16, 0.55], [0, 0, 90])); }
  return asset("futureRailShuttle", "轨道摆渡车", "科幻", "道具", parts);
}

function hoverbike() {
  const parts = [part("悬浮摩托主架", "capsule", navy, [0, 0.85, 0], [0.65, 2.3, 0.75], [90, 0, 0]), part("骑行座垫", "box", "#6c7681", [0, 1.2, 0.2], [0.48, 0.15, 0.9]), part("前整流罩", "cone", hull, [0, 1.05, -1], [0.85, 1.05, 0.8], [90, 0, 0]), part("仪表", "box", blue, [0, 1.44, -0.52], [0.35, 0.05, 0.25], [25, 0, 0])];
  for (const z of [-0.95, 1]) parts.push(part("悬浮涵道", "torus", steel, [0, 0.66, z], [1.1, 1.1, 0.3], [90, 0, 0]), part("涵道转盘", "cylinder", navy, [0, 0.64, z], [0.75, 0.08, 0.75]));
  for (const side of [-1, 1]) parts.push(beam("车把", steel, [0, 1.35, -0.5], [side * 0.48, 1.48, -0.4], 0.05), part("停驻支脚", "box", iron, [side * 0.35, 0.28, 0.2], [0.08, 0.56, 0.35]));
  return asset("futureHoverbike", "悬浮摩托", "科幻", "道具", parts);
}

function escapePod() {
  const parts = [part("逃生舱体", "capsule", hull, [0, 1.6, 0], [3.4, 2.9, 3.4]), part("舱门面板", "box", steel, [0, 1.4, 0.86], [0.95, 1.75, 0.12]), part("观察舷窗", "cylinder", blue, [0, 1.92, 0.94], [0.55, 0.07, 0.55], [90, 0, 0]), part("顶部应急伞盖", "cylinder", copper, [0, 3.05, 0], [0.75, 0.25, 0.75])];
  for (let index = 0; index < 4; index++) { const angle = index * Math.PI / 2 + Math.PI / 4; parts.push(beam("缓冲支腿", steel, [Math.cos(angle) * 0.65, 0.9, Math.sin(angle) * 0.65], [Math.cos(angle) * 1.15, 0.12, Math.sin(angle) * 1.15], 0.11), part("支腿脚垫", "cylinder", navy, [Math.cos(angle) * 1.15, 0.08, Math.sin(angle) * 1.15], [0.4, 0.16, 0.4])); }
  return asset("futureEscapePod", "救生逃生舱", "科幻", "道具", parts);
}

function cargoCrate() {
  const parts = [part("货箱内体", "box", hull, [0, 0.67, 0], [1.8, 1.2, 1.3]), part("货箱盖", "box", steel, [0, 1.31, 0], [1.9, 0.15, 1.4]), part("识别面板", "box", navy, [0, 0.8, 0.68], [0.58, 0.35, 0.035])];
  for (const x of [-0.82, 0.82]) for (const z of [-0.58, 0.58]) parts.push(part("货箱角骨架", "box", navy, [x, 0.7, z], [0.16, 1.4, 0.16]));
  for (const z of [-0.69, 0.69]) for (const x of [-0.55, 0.55]) parts.push(part("装卸加强肋", "box", steel, [x, 0.68, z], [0.12, 1.05, 0.07]));
  for (const x of [-0.96, 0.96]) parts.push(part("货箱把手", "torus", navy, [x, 0.9, 0], [0.25, 0.4, 0.08], [0, 90, 0]));
  return asset("futureCargoCrate", "加固货运箱", "科幻", "道具", parts);
}

function pressureTank() {
  const parts = [part("横置压力罐", "capsule", steel, [0, 1.05, 0], [2.8, 3.4, 2.8], [0, 0, 90]), part("压力计", "cylinder", hull, [0.7, 1.95, 0.05], [0.3, 0.1, 0.3], [90, 0, 0]), part("顶部出气管", "cylinder", copper, [0.7, 1.74, 0], [0.13, 0.5, 0.13]), part("阀门手轮", "torus", navy, [-0.7, 1.87, 0], [0.45, 0.45, 0.1], [90, 0, 0])];
  for (const x of [-1.05, 1.05]) parts.push(part("罐体抱箍", "torus", navy, [x, 1.05, 0], [1.45, 1.45, 0.12], [0, 90, 0]), part("压力罐支座", "box", navy, [x, 0.24, 0], [0.3, 0.48, 1.2]));
  return asset("futurePressureTank", "卧式压力储罐", "科幻", "道具", parts);
}

function oxygenRack() {
  const parts = [part("气瓶架底盘", "box", navy, [0, 0.08, 0], [2, 0.16, 0.75]), part("气瓶束紧横杆", "box", steel, [0, 0.95, 0.22], [2, 0.12, 0.12])];
  for (let index = 0; index < 5; index++) { const x = -0.76 + index * 0.38; parts.push(part("氧气瓶", "capsule", hull, [x, 0.78, 0], [0.62, 1.35, 0.62]), part("气瓶阀", "box", copper, [x, 1.51, 0], [0.12, 0.14, 0.09]), part("气瓶色环", "cylinder", blue, [x, 1.2, 0], [0.32, 0.08, 0.32])); }
  for (const x of [-0.94, 0.94]) parts.push(part("气瓶架侧柱", "box", steel, [x, 0.6, 0.22], [0.1, 1.2, 0.12]));
  return asset("futureOxygenRack", "氧气瓶架", "科幻", "道具", parts);
}

function toolCart() {
  const parts: ModelPart[] = [];
  for (const y of [0.3, 0.8]) parts.push(part("检修车托盘", "box", steel, [0, y, 0], [1.3, 0.08, 0.8]));
  for (const x of [-0.58, 0.58]) for (const z of [-0.32, 0.32]) parts.push(part("检修车立柱", "box", navy, [x, 0.52, z], [0.06, 0.95, 0.06]), part("万向轮", "cylinder", iron, [x, 0.12, z], [0.22, 0.08, 0.22], [0, 0, 90]));
  parts.push(part("推车手把", "tube", navy, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: 0.62, y: 0.7, z: -0.34 }, { x: 0.8, y: 1.12, z: -0.34 }, { x: 0.8, y: 1.12, z: 0.34 }, { x: 0.62, y: 0.7, z: 0.34 }], radius: 0.035 }), part("工具盒", "box", copper, [0, 0.94, 0.05], [0.65, 0.2, 0.45]));
  return asset("futureToolCart", "检修工具车", "科幻", "道具", parts);
}

function batteryRack() {
  const parts = [part("电池架底座", "box", navy, [0, 0.1, 0], [1.9, 0.2, 1.1])];
  for (const x of [-0.86, 0.86]) for (const z of [-0.45, 0.45]) parts.push(part("电池架钢梁", "box", steel, [x, 0.95, z], [0.1, 1.9, 0.1]));
  for (let row = 0; row < 3; row++) { const y = 0.4 + row * 0.55; parts.push(part("电池搁层", "box", steel, [0, y - 0.17, 0], [1.75, 0.08, 1])); for (const x of [-0.42, 0.42]) parts.push(part("高密度电池", "box", "#5c717b", [x, y, 0], [0.65, 0.3, 0.8]), part("电池正极", "cylinder", copper, [x + 0.18, y + 0.18, 0.22], [0.08, 0.06, 0.08]), part("电池负极", "cylinder", navy, [x - 0.18, y + 0.18, 0.22], [0.08, 0.06, 0.08])); }
  parts.push(part("配电母线", "box", copper, [0, 1.84, 0.47], [1.65, 0.08, 0.08]));
  return asset("futureBatteryRack", "蓄电池架", "科幻", "道具", parts);
}

function sampleCarousel() {
  const parts = [part("样本转盘底座", "cylinder", navy, [0, 0.1, 0], [1.3, 0.2, 1.3]), part("转盘轴", "cylinder", steel, [0, 0.4, 0], [0.18, 0.6, 0.18]), part("样本旋转托盘", "cylinder", hull, [0, 0.65, 0], [1.5, 0.1, 1.5]), part("中心控制头", "cylinder", navy, [0, 0.96, 0], [0.28, 0.5, 0.28])];
  for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4, x = Math.cos(angle) * 0.55, z = Math.sin(angle) * 0.55; parts.push(part("样本管", "cylinder", "#9ebec1", [x, 0.96, z], [0.15, 0.48, 0.15], [0, 0, 0], { opacity: 0.5 }), part("样本管盖", "cylinder", steel, [x, 1.23, z], [0.18, 0.07, 0.18])); }
  return asset("futureSampleCarousel", "实验样本转盘", "科幻", "道具", parts);
}

function stasisTube() {
  const parts = [part("培养管底座", "cylinder", navy, [0, 0.16, 0], [1.6, 0.32, 1.6]), part("透明培养壁", "cylinder", "#8bb5bf", [0, 1.55, 0], [1.3, 2.4, 1.3], [0, 0, 0], { opacity: 0.2, roughness: 0.12 }), part("培养管顶盖", "cylinder", hull, [0, 2.87, 0], [1.6, 0.24, 1.6]), part("有机样本", "capsule", "#8c9b7a", [0, 1.55, 0], [0.65, 1.2, 0.55], [0, 0, 15])];
  for (const side of [-1, 1]) parts.push(part("培养管外支柱", "box", steel, [side * 0.72, 1.55, 0], [0.09, 2.65, 0.16]), part("维生连接管", "tube", "#677f83", [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: side * 0.6, y: 0.4, z: -0.2 }, { x: side * 0.4, y: 0.8, z: -0.1 }, { x: side * 0.15, y: 1.2, z: 0 }], radius: 0.04 }));
  return asset("futureStasisTube", "透明培养管", "科幻", "道具", parts);
}

function roboticArm() {
  const parts = [part("机械臂固定座", "cylinder", navy, [0, 0.16, 0], [1.25, 0.32, 1.25]), part("转台关节", "cylinder", steel, [0, 0.48, 0], [0.7, 0.35, 0.7]), beam("主臂", hull, [0, 0.62, 0], [0.15, 1.65, 0], 0.3, 0.38), part("肘部轴", "cylinder", navy, [0.15, 1.65, 0], [0.46, 0.48, 0.46], [90, 0, 0]), beam("前臂", steel, [0.15, 1.65, 0], [1.15, 1.92, 0], 0.23, 0.28), part("腕轴", "sphere", navy, [1.2, 1.92, 0], [0.32, 0.32, 0.32])];
  for (const z of [-0.18, 0.18]) parts.push(beam("夹爪", hull, [1.25, 1.92, z * 0.6], [1.62, 1.66, z], 0.08), part("夹持端", "box", navy, [1.62, 1.58, z], [0.1, 0.22, 0.07]));
  return asset("futureRoboticArm", "工业机械臂", "科幻", "道具", parts);
}

function checkpointScanner() {
  const parts = [part("安检通道底板", "box", navy, [0, 0.09, 0], [2.5, 0.18, 1.65]), part("扫描门上梁", "box", hull, [0, 2.65, 0], [2.5, 0.3, 1]), part("扫描光栅", "box", blue, [0, 2.44, 0], [1.65, 0.045, 0.1])];
  for (const side of [-1, 1]) { parts.push(part("扫描器侧柱", "box", hull, [side * 1.08, 1.38, 0], [0.3, 2.55, 1]), part("侧柱控制面", "box", navy, [side * 1.08, 1.5, 0.53], [0.22, 0.7, 0.06])); for (const y of [0.65, 1.1, 1.55, 2]) parts.push(part("侧向检测窗", "box", blue, [side * 0.91, y, 0], [0.025, 0.16, 0.55])); }
  return asset("futureCheckpointScanner", "安检扫描门", "科幻", "建筑", parts);
}

function forcefieldGate() {
  const parts = [part("力场基轨", "box", navy, [0, 0.11, 0], [4.8, 0.22, 0.9]), part("半透明力场", "box", "#8bb9c9", [0, 1.52, 0], [3.7, 2.7, 0.03], [0, 0, 0], { opacity: 0.18, emissive: "#527e9c", emissiveIntensity: 0.35 })];
  for (const side of [-1, 1]) { parts.push(part("力场发射柱", "box", steel, [side * 2.03, 1.6, 0], [0.46, 3, 0.8]), part("上端导流鳍", "box", hull, [side * 1.8, 3.05, 0], [0.8, 0.17, 0.85])); for (let index = 0; index < 5; index++) parts.push(part("柱上发射片", "box", blue, [side * 1.78, 0.55 + index * 0.48, 0], [0.06, 0.2, 0.5])); }
  return asset("futureForcefieldGate", "力场闸门", "科幻", "建筑", parts);
}

function retractableBarrier() {
  const parts = [part("升降路障地槽", "box", steel, [0, 0.09, 0], [4.6, 0.18, 0.9])];
  for (let index = 0; index < 6; index++) { const x = -1.9 + index * 0.76; parts.push(part("液压路桩", "cylinder", navy, [x, 0.65, 0], [0.28, 1.1, 0.28]), part("路桩警示帽", "cylinder", copper, [x, 1.17, 0], [0.3, 0.12, 0.3]), part("地槽套环", "torus", hull, [x, 0.2, 0], [0.37, 0.37, 0.07], [90, 0, 0])); }
  return asset("futureRetractableBarrier", "液压升降路障", "科幻", "建筑", parts);
}

function coolantPump() {
  const parts = [part("泵站底座", "box", navy, [0, 0.15, 0], [2.6, 0.3, 1.5]), part("电机外壳", "cylinder", steel, [-0.45, 0.75, 0], [0.8, 1.2, 0.8], [0, 0, 90]), part("泵蜗壳", "sphere", hull, [0.5, 0.75, 0], [1.1, 1.1, 0.7]), part("冷却盘管", "tube", copper, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: 0.5, y: 1.18, z: 0 }, { x: 0.5, y: 1.65, z: 0 }, { x: -0.8, y: 1.65, z: 0 }, { x: -0.8, y: 0.55, z: 0 }], radius: 0.12 }), part("泵出口", "cylinder", steel, [1.05, 0.75, 0], [0.25, 0.8, 0.25], [0, 0, 90])];
  for (let index = 0; index < 7; index++) parts.push(part("电机散热鳍", "box", navy, [-0.95 + index * 0.16, 0.85, 0], [0.04, 0.85, 0.86]));
  return asset("futureCoolantPump", "冷却泵站", "科幻", "道具", parts);
}

function solarArray() {
  const parts = [part("太阳翼接头", "box", hull, [0, 0.7, 0], [0.8, 1.3, 0.8]), part("太阳翼主梁", "box", steel, [0, 1.15, 0], [6.4, 0.12, 0.16])];
  for (const side of [-1, 1]) for (const z of [-0.7, 0.7]) { parts.push(part("光伏电池板", "box", "#486e91", [side * 1.95, 1.12, z], [2.9, 0.07, 1.2])); for (let index = 0; index < 7; index++) parts.push(part("电池板导电栅", "box", "#9ab1bb", [side * 1.95 - 1.2 + index * 0.4, 1.165, z], [0.015, 0.012, 1.1])); parts.push(part("电池板横栅", "box", "#9ab1bb", [side * 1.95, 1.165, z], [2.8, 0.012, 0.015])); }
  return asset("futureSolarArray", "轨道太阳能翼", "科幻", "道具", parts);
}

function thrusterModule() {
  const parts = [part("推进器外壳", "lathe", steel, [0, 1.05, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -1.1 }, { x: 0.62, y: -1.1 }, { x: 0.62, y: -0.5 }, { x: 0.36, y: -0.2 }, { x: 0.72, y: 0.8 }, { x: 0.84, y: 1.1 }, { x: 0.7, y: 1.1 }, { x: 0.48, y: 0.3 }, { x: 0.15, y: -0.1 }, { x: 0, y: -0.1 }], metalness: 0.65, roughness: 0.3 }), part("推进器检修底架", "box", navy, [0, 0.15, 0], [1.4, 0.3, 2.3])];
  for (const side of [-1, 1]) parts.push(part("冷却装甲翼", "box", hull, [side * 0.65, 1.1, 0.35], [0.12, 1.1, 1.35], [0, side * 12, 0]), beam("检修托架", steel, [side * 0.55, 0.25, -0.55], [side * 0.55, 0.75, -0.55], 0.14));
  return asset("futureThrusterModule", "推进器组件", "科幻", "道具", parts);
}

function alienFanPlant() {
  const parts = [part("异星根球", "sphere", "#536b68", [0, 0.15, 0], [0.7, 0.3, 0.7]), part("植株主茎", "cylinder", "#4e797c", [0, 0.7, 0], [0.07, 1.4, 0.07])];
  for (let index = 0; index < 7; index++) { const angle = -75 + index * 25; parts.push(part("宽扇叶", "extrude", index % 2 ? "#6d9b9c" : "#658a95", [0, 1.05, 0], [1, 1, 1], [0, angle, (index - 3) * 13], { depth: 0.025, profile: [{ x: 0, y: 0 }, { x: 0.45, y: 0.45 }, { x: 0.5, y: 1.15 }, { x: 0.15, y: 1.6 }, { x: -0.18, y: 1.45 }, { x: -0.32, y: 0.65 }] })); }
  return asset("futureAlienFanPlant", "异星扇叶植物", "科幻", "自然", parts);
}

function sporeTree() {
  const parts = [part("孢子树干", "lathe", "#647270", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.6, y: 0 }, { x: 0.22, y: 1.8 }, { x: 0.12, y: 3.8 }, { x: 0, y: 4 }] })];
  for (let index = 0; index < 5; index++) { const angle = index * Math.PI * 2 / 5, x = Math.cos(angle) * 1.2, z = Math.sin(angle) * 1.2, y = 2.8 + index % 2 * 0.7; parts.push(beam("孢子枝", "#687d78", [0, 1.5, 0], [x, y, z], 0.1), part("伞状孢囊", "lathe", index % 2 ? "#9f8fa5" : "#859ea7", [x, y, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0.5 }, { x: 0.25, y: 0.6 }, { x: 0.65, y: 0.35 }, { x: 0.86, y: 0.1 }, { x: 0.74, y: -0.06 }, { x: 0, y: 0.1 }] })); }
  return asset("futureSporeTree", "异星孢子树", "科幻", "自然", parts);
}

function mineralSpire() {
  const parts = [part("矿物母岩", "sphere", "#697579", [0, 0.16, 0], [2.2, 0.35, 1.6])];
  for (let index = 0; index < 5; index++) { const x = (index - 2) * 0.35, height = 1.2 + (2 - Math.abs(index - 2)) * 0.7; parts.push(crystal("六棱矿柱", index % 2 ? "#789296" : "#96a5a3", [x, height * 0.48, (index % 2 - 0.5) * 0.35], [0.45, height * 0.58, 0.4])); }
  return asset("futureMineralSpire", "异星矿物尖晶", "科幻", "自然", parts);
}

function bioPlanter() {
  const parts = [part("生态槽外壳", "box", hull, [0, 0.38, 0], [2.4, 0.76, 1]), part("营养土层", "box", "#647368", [0, 0.79, 0], [2.2, 0.08, 0.8]), part("营养液侧箱", "box", navy, [1.32, 0.42, 0], [0.32, 0.65, 0.85]), part("状态窗", "box", blue, [1.32, 0.48, 0.44], [0.2, 0.25, 0.025])];
  for (let index = 0; index < 5; index++) { const x = -0.85 + index * 0.43; parts.push(part("生态植株茎", "cylinder", "#557e73", [x, 1.12, 0], [0.04, 0.65, 0.04])); for (const side of [-1, 1]) parts.push(part("生态植株叶", "sphere", index % 2 ? "#81a28f" : "#6f999b", [x + side * 0.15, 1.3, side * 0.1], [0.45, 0.12, 0.28], [0, side * 30, side * 32])); }
  return asset("futureBioPlanter", "生态种植槽", "科幻", "自然", parts);
}

function seismicProbe() {
  const parts = [part("探针仪器舱", "cylinder", steel, [0, 0.8, 0], [0.75, 0.65, 0.75]), part("探地钻杆", "cylinder", navy, [0, 0.4, 0], [0.1, 0.8, 0.1]), part("仪器显示面", "box", blue, [0, 0.88, 0.4], [0.35, 0.25, 0.04]), part("测量杆", "cylinder", copper, [0, 1.42, 0], [0.05, 0.65, 0.05])];
  for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3, x = Math.cos(angle), z = Math.sin(angle); parts.push(beam("三脚探针支架", hull, [x * 0.3, 0.9, z * 0.3], [x * 0.9, 0.05, z * 0.9], 0.08), part("探针地脚", "cylinder", navy, [x * 0.9, 0.05, z * 0.9], [0.22, 0.1, 0.22])); }
  return asset("futureSeismicProbe", "地震探针", "科幻", "道具", parts);
}

function phasedArray() {
  const parts = [part("通信站地台", "box", navy, [0, 0.12, 0], [3.5, 0.24, 2]), part("相控阵背梁", "box", steel, [0, 2.2, -0.25], [3.2, 0.16, 0.22]), part("通信设备柜", "box", hull, [0, 0.65, -0.55], [1.5, 1.05, 0.65])];
  for (const x of [-1.25, 0, 1.25]) { parts.push(part("平板阵列天线", "box", blue, [x, 2.25, 0], [1.04, 1.4, 0.16], [-12, x * 12, 0]), beam("阵列支架", steel, [x, 0.25, -0.3], [x, 2.3, -0.3], 0.09)); for (let row = 0; row < 4; row++) parts.push(part("阵面阵元横列", "box", hull, [x, 1.85 + row * 0.26, 0.115], [0.87, 0.025, 0.02], [-12, x * 12, 0])); }
  return asset("futurePhasedArray", "相控阵通信站", "科幻", "建筑", parts);
}

export const fantasyAssets: SceneAsset[] = [
  wizardTower(), mushroomHouse(), treeHouse(), elvenPavilion(), dwarvenGate(), ruinedArch(), valleyBridge(), dragonGate(), suspensionBridge(), wishingWell(),
  wizardDesk(), alchemyWorkbench(), crystalThrone(), innTable(), carvedWardrobe(), scrollShelf(), potionCabinet(), suspendedShelf(), canopyBed(), crystalFloorLamp(),
  lanternPost(), spellBook(), potionRack(), cauldron(), hourglass(), celestialGlobe(), treasureChest(), swordInStone(), shieldRack(), bowRack(), staffRack(), dragonNest(),
  giantMushroom(), luminousFern(), spiritTree(), carnivorousPlant(), crystalCluster(), floatingRock(), starFlower(), rootArch(), ballista(), gearGate(), watermill(), broomRack(), gryphonCart(), sealedCage(),
  colonyHabitat(), researchDome(), pressureAirlock(), modularCorridor(), landingPad(), cargoHangar(), hydroponicPod(), observationDeck(), elevatorDock(), launchGantry(),
  commandChair(), medicalBed(), laboratoryBench(), hologramTable(), sleepingPod(), lockerArray(), serverRack(), equipmentCabinet(), crewDiningBooth(), exerciseStation(),
  serviceRobot(), cargoDrone(), explorationRover(), railShuttle(), hoverbike(), escapePod(), cargoCrate(), pressureTank(), oxygenRack(), toolCart(), batteryRack(), sampleCarousel(),
  stasisTube(), roboticArm(), checkpointScanner(), forcefieldGate(), retractableBarrier(), coolantPump(), solarArray(), thrusterModule(), alienFanPlant(), sporeTree(), mineralSpire(), bioPlanter(), seismicProbe(), phasedArray(),
];
