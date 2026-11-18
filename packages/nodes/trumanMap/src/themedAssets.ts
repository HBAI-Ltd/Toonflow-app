import { part, asset, ring, pitchedRoof, beam, crystal, type ModelPart } from "./assetModelParts";
import type { SceneAsset } from "./sceneDocument";
import { worldAssets } from "./worldAssets";
import { civicAssets } from "./civicAssets";
import { fantasyAssets } from "./fantasyAssets";
import { easternAssets } from "./easternAssets";

const stone = "#b7b2a6";
const darkStone = "#686c73";
const wood = "#805944";
const red = "#9c3e32";
const roof = "#3c4950";
const brass = "#b89b5b";
const metal = "#465969";
const light = "#a4f3ee";

function paifang() {
  const parts: ModelPart[] = [];
  for (const x of [-1.6, 1.6]) {
    parts.push(part("柱础", "box", stone, [x, 0.22, 0], [0.75, 0.44, 0.75]));
    parts.push(part("朱漆立柱", "cylinder", red, [x, 1.85, 0], [0.34, 3.2, 0.34]));
    parts.push(part("柱帽", "box", brass, [x, 3.32, 0], [0.48, 0.12, 0.48]));
  }
  parts.push(part("下额枋", "box", red, [0, 2.55, 0], [3.5, 0.23, 0.32]));
  parts.push(part("匾额", "box", brass, [0, 3.05, 0], [1.45, 0.55, 0.28]));
  parts.push(part("匾心", "box", "#294e48", [0, 3.05, 0.15], [1.22, 0.36, 0.06]));
  parts.push(part("承檐横梁", "box", red, [0, 3.47, 0], [4.3, 0.22, 0.45]));
  parts.push(pitchedRoof("飞檐瓦顶", roof, 4.8, 1.3, 3.58, true));
  for (const x of [-1.6, 1.6]) parts.push(beam("斜撑斗拱", brass, [x, 2.85, 0], [x * 0.65, 3.4, 0], 0.14));
  return asset("themedPaifang", "中式牌坊", "中式", "建筑", parts);
}

function stoneLantern() {
  const parts = [
    part("石灯座", "cylinder", stone, [0, 0.12, 0], [0.9, 0.24, 0.9]),
    part("灯柱", "lathe", stone, [0, 0.2, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.28, y: 0 }, { x: 0.17, y: 0.18 }, { x: 0.12, y: 0.7 }, { x: 0.27, y: 0.86 }] }),
    part("灯室底板", "box", stone, [0, 1.12, 0], [0.68, 0.16, 0.68]),
    part("暖光灯芯", "sphere", "#ffdc8b", [0, 1.48, 0], [0.32, 0.4, 0.32], [0, 0, 0], { emissive: "#ffbd55", emissiveIntensity: 1.2 }),
    pitchedRoof("石灯檐顶", darkStone, 1.06, 0.98, 1.77, true),
    part("宝顶", "sphere", stone, [0, 2.44, 0], [0.18, 0.2, 0.18]),
  ];
  for (const x of [-0.25, 0.25]) for (const z of [-0.25, 0.25]) parts.push(part("灯室石框", "box", stone, [x, 1.48, z], [0.12, 0.6, 0.12]));
  return asset("themedStoneLantern", "中式石灯", "中式", "道具", parts);
}

function pagoda() {
  const parts = [part("塔基", "cylinder", stone, [0, 0.18, 0], [2.9, 0.36, 2.9])];
  for (let level = 0; level < 4; level++) {
    const width = 2.1 - level * 0.32, y = 0.36 + level * 1.15;
    parts.push(part("塔身", "cylinder", "#cfb997", [0, y + 0.4, 0], [width * 0.72, 0.8, width * 0.72]));
    for (let side = 0; side < 8; side++) {
      const angle = side * Math.PI / 4;
      parts.push(part("檐柱", "cylinder", red, [Math.cos(angle) * width * 0.35, y + 0.44, Math.sin(angle) * width * 0.35], [0.09, 0.85, 0.09]));
    }
    parts.push(part("层叠飞檐", "lathe", roof, [0, y + 0.82, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0.36 }, { x: width * 0.2, y: 0.32 }, { x: width * 0.55, y: 0.03 }, { x: width * 0.66, y: 0.1 }, { x: width * 0.61, y: -0.06 }, { x: 0, y: 0.25 }] }));
  }
  parts.push(part("塔刹", "cone", brass, [0, 5.25, 0], [0.25, 0.75, 0.25]));
  return asset("themedPagoda", "四层中式宝塔", "中式", "建筑", parts);
}

function moonGate() {
  const parts = [
    part("门前石阶", "box", stone, [0, 0.1, 0], [5.4, 0.2, 1.15]),
    part("月洞环墙", "lathe", "#d8d4c8", [0, 1.86, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 1.35, y: -0.24 }, { x: 1.72, y: -0.24 }, { x: 1.72, y: 0.24 }, { x: 1.35, y: 0.24 }, { x: 1.35, y: -0.24 }] }),
  ];
  for (const x of [-2.13, 2.13]) {
    parts.push(part("白墙侧翼", "box", "#d8d4c8", [x, 1.64, 0], [1.1, 2.9, 0.48]));
    parts.push(part("墙头瓦脊", "box", roof, [x, 3.12, 0], [1.25, 0.16, 0.64]));
  }
  return asset("themedMoonGate", "园林月洞门", "中式", "建筑", parts);
}

function torii() {
  const parts = [
    part("贯梁", "box", red, [0, 2.65, 0], [3.85, 0.24, 0.28]),
    part("额束", "box", red, [0, 2.98, 0], [0.26, 0.55, 0.25]),
    part("岛木", "box", red, [0, 3.35, 0], [4.15, 0.22, 0.4]),
    pitchedRoof("黑色笠木", "#2d3339", 4.65, 0.62, 3.47, true),
  ];
  for (const x of [-1.45, 1.45]) {
    parts.push(part("础石", "cylinder", darkStone, [x, 0.16, 0], [0.66, 0.32, 0.66]));
    parts.push(part("朱色圆柱", "cylinder", red, [x, 1.85, 0], [0.35, 3.4, 0.35]));
  }
  return asset("themedTorii", "日式鸟居", "日式", "建筑", parts);
}

function stonePagoda() {
  const parts = [part("方形基座", "box", stone, [0, 0.18, 0], [1.3, 0.36, 1.3])];
  for (let index = 0; index < 5; index++) {
    const width = 1.1 - index * 0.12, y = 0.37 + index * 0.49;
    parts.push(part("石塔塔身", "box", stone, [0, y + 0.16, 0], [width * 0.5, 0.32, width * 0.5]));
    parts.push(part("石塔檐盘", "lathe", "#999c96", [0, y + 0.33, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0.15 }, { x: width * 0.18, y: 0.13 }, { x: width * 0.6, y: 0 }, { x: width * 0.6, y: -0.07 }, { x: 0, y: 0.08 }] }));
  }
  parts.push(part("石塔宝珠", "sphere", stone, [0, 3.02, 0], [0.24, 0.35, 0.24]));
  return asset("themedStonePagoda", "日式五重石塔", "日式", "道具", parts);
}

function bambooScreen() {
  const parts: ModelPart[] = [];
  for (let index = 0; index < 13; index++) parts.push(part("竹竿", "cylinder", index % 2 ? "#8c9a65" : "#a2ac78", [-1.2 + index * 0.2, 1, 0], [0.15, 2, 0.15]));
  for (const y of [0.32, 1.5]) parts.push(part("横竹", "cylinder", "#778351", [0, y, 0.1], [0.12, 2.8, 0.12], [0, 0, 90]));
  for (const x of [-1.3, 1.3]) parts.push(part("支撑脚", "box", wood, [x, 0.08, 0], [0.25, 0.16, 0.8]));
  return asset("themedBambooScreen", "日式竹篱屏风", "日式", "建筑", parts);
}

function taikoDrum() {
  const parts = [
    part("太鼓鼓身", "cylinder", red, [0, 1.28, 0], [1.05, 0.78, 1.05], [90, 0, 0]),
    part("前鼓面", "cylinder", "#e6d9b6", [0, 1.28, 0.405], [1.08, 0.04, 1.08], [90, 0, 0]),
    part("后鼓面", "cylinder", "#e6d9b6", [0, 1.28, -0.405], [1.08, 0.04, 1.08], [90, 0, 0]),
  ];
  for (const z of [-0.32, 0.32]) {
    parts.push(beam("交叉鼓架", wood, [-0.65, 0.05, z], [0.5, 1.1, z], 0.12));
    parts.push(beam("交叉鼓架", wood, [0.65, 0.05, z], [-0.5, 1.1, z], 0.12));
  }
  for (let index = 0; index < 12; index++) {
    const angle = index * Math.PI / 6;
    parts.push(part("鼓钉", "sphere", brass, [Math.cos(angle) * 0.49, 1.28 + Math.sin(angle) * 0.49, 0.43], [0.065, 0.065, 0.04]));
  }
  return asset("themedTaikoDrum", "日式太鼓", "日式", "道具", parts);
}

function romanColumn() {
  const parts = [
    part("方形柱础", "box", stone, [0, 0.13, 0], [1.2, 0.26, 1.2]),
    part("柱脚盘", "cylinder", "#c7c3b6", [0, 0.37, 0], [1.02, 0.22, 1.02]),
    part("柱身", "cylinder", "#d7d2c5", [0, 1.79, 0], [0.67, 2.66, 0.67]),
    part("柱头颈环", "cylinder", stone, [0, 3.12, 0], [0.9, 0.2, 0.9]),
    part("柱头承盘", "box", "#d7d2c5", [0, 3.34, 0], [1.2, 0.25, 1.2]),
  ];
  for (let index = 0; index < 12; index++) {
    const angle = index * Math.PI / 6;
    parts.push(part("柱身凹槽棱", "cylinder", "#c7c3b6", [Math.cos(angle) * 0.32, 1.8, Math.sin(angle) * 0.32], [0.075, 2.54, 0.075]));
  }
  return asset("themedRomanColumn", "古典罗马立柱", "欧式", "建筑", parts);
}

function stoneWell() {
  const parts = [
    ring("井壁", stone, 0.92, 0.22, 0.48, 0.96),
    ring("井沿", "#c7c1ad", 1.02, 0.31, 1.02, 0.16),
    part("井水", "cylinder", "#517e87", [0, 0.22, 0], [1.4, 0.03, 1.4], [0, 0, 0], { roughness: 0.18, metalness: 0.25 }),
    part("绞盘", "cylinder", wood, [0, 1.9, 0], [0.12, 2.2, 0.12], [0, 0, 90]),
    part("吊绳", "cylinder", "#aa956d", [0, 1.24, 0], [0.025, 1.15, 0.025]),
    pitchedRoof("木瓦井棚", "#6e4e43", 2.65, 2.1, 2.4),
  ];
  for (const x of [-1.05, 1.05]) parts.push(part("井棚立柱", "box", wood, [x, 1.25, 0], [0.16, 2.5, 0.2]));
  return asset("themedStoneWell", "欧式棚顶水井", "欧式", "建筑", parts);
}

function gothicArch() {
  const outline = [[-1.6, 0], [-1.6, 2.6], [-1.3, 3.4], [0, 4.6], [1.3, 3.4], [1.6, 2.6], [1.6, 0], [1.15, 0], [1.15, 2.5], [0.95, 3.1], [0, 4], [-0.95, 3.1], [-1.15, 2.5], [-1.15, 0]];
  const parts = [part("尖拱石框", "extrude", stone, [0, 0.16, 0], [1, 1, 1], [0, 0, 0], { depth: 0.62, profile: outline.map(([x, y]) => ({ x: x!, y: y! })) })];
  for (const x of [-1.4, 1.4]) {
    parts.push(part("石拱柱脚", "box", darkStone, [x, 0.1, 0], [0.85, 0.2, 1]));
    parts.push(part("石拱柱头", "box", "#c9c3b6", [x, 2.63, 0], [0.64, 0.2, 0.8]));
  }
  return asset("themedGothicArch", "哥特式尖拱门", "欧式", "建筑", parts);
}

function woodenCart() {
  const parts = [part("车厢底板", "box", wood, [0, 0.8, 0], [1.5, 0.16, 2.1])];
  for (const x of [-0.76, 0.76]) for (const y of [1.02, 1.28]) parts.push(part("车厢木栏", "box", "#9a7456", [x, y, 0], [0.1, 0.17, 2.1]));
  for (const z of [-1, 1]) parts.push(part("端板", "box", wood, [0, 1.14, z], [1.5, 0.5, 0.1]));
  for (const z of [-0.7, 0.7]) {
    parts.push(part("轮轴", "cylinder", darkStone, [0, 0.59, z], [0.12, 2, 0.12], [0, 0, 90]));
    for (const x of [-0.94, 0.94]) {
      parts.push(part("木车轮", "torus", "#675348", [x, 0.59, z], [1.15, 1.15, 0.52], [0, 90, 0]));
      for (let spoke = 0; spoke < 6; spoke++) parts.push(part("轮辐", "box", wood, [x, 0.59, z], [0.07, 0.92, 0.065], [spoke * 30, 0, 0]));
    }
  }
  for (const x of [-0.48, 0.48]) parts.push(part("牵引车辕", "box", wood, [x, 0.7, 1.75], [0.1, 0.12, 1.6]));
  return asset("themedWoodenCart", "中世纪木车", "欧式", "道具", parts);
}

function modernStreetlight() {
  return asset("themedModernStreetlight", "现代路灯", "现代", "道具", [
    part("灯杆底座", "cylinder", darkStone, [0, 0.12, 0], [0.52, 0.24, 0.52]),
    part("钢制灯杆", "cylinder", metal, [0, 2.15, 0], [0.12, 4.3, 0.12], [0, 0, 0], { metalness: 0.6, roughness: 0.35 }),
    beam("悬臂", metal, [0, 4.13, 0], [1.05, 4.35, 0], 0.1),
    part("灯头", "box", metal, [1.1, 4.28, 0], [0.76, 0.14, 0.32]),
    part("灯面", "box", "#fff3cf", [1.1, 4.2, 0], [0.64, 0.025, 0.25], [0, 0, 0], { emissive: "#ffe4ac", emissiveIntensity: 1.4 }),
  ]);
}

function modernBench() {
  const parts: ModelPart[] = [];
  for (const x of [-0.75, 0.75]) {
    parts.push(part("长椅支腿", "box", metal, [x, 0.24, 0], [0.1, 0.48, 0.56]));
    parts.push(part("靠背支架", "box", metal, [x, 0.69, -0.25], [0.08, 0.9, 0.08], [-8, 0, 0]));
  }
  for (const z of [-0.23, -0.07, 0.09, 0.25]) parts.push(part("座面木条", "box", "#a77e57", [0, 0.49, z], [1.9, 0.07, 0.13]));
  for (const y of [0.75, 0.94]) parts.push(part("靠背木条", "box", "#a77e57", [0, y, -0.3], [1.9, 0.14, 0.07], [-8, 0, 0]));
  return asset("themedModernBench", "城市长椅", "现代", "道具", parts);
}

function phoneBooth() {
  const parts = [
    part("电话亭底台", "box", darkStone, [0, 0.08, 0], [1.1, 0.16, 1.1]),
    part("电话亭顶棚", "box", red, [0, 2.22, 0], [1.18, 0.18, 1.18]),
    part("电话机", "box", "#69757b", [0, 1.3, -0.33], [0.36, 0.6, 0.18]),
    part("按键面板", "box", "#b5c1c4", [0.06, 1.29, -0.22], [0.15, 0.22, 0.025]),
    part("听筒", "capsule", "#263139", [-0.12, 1.32, -0.2], [0.13, 0.42, 0.15]),
  ];
  for (const x of [-0.48, 0.48]) for (const z of [-0.48, 0.48]) parts.push(part("亭体框柱", "box", red, [x, 1.15, z], [0.09, 2.12, 0.09]));
  for (const x of [-0.48, 0.48]) parts.push(part("侧面玻璃", "box", "#b0d5db", [x, 1.2, 0], [0.025, 1.75, 0.83], [0, 0, 0], { opacity: 0.28, roughness: 0.15 }));
  parts.push(part("背面玻璃", "box", "#b0d5db", [0, 1.2, -0.48], [0.83, 1.75, 0.025], [0, 0, 0], { opacity: 0.28, roughness: 0.15 }));
  return asset("themedPhoneBooth", "公共电话亭", "现代", "建筑", parts);
}

function busStop() {
  const parts = [
    part("候车亭地台", "box", stone, [0, 0.07, 0], [4.2, 0.14, 1.7]),
    part("候车亭顶棚", "box", metal, [0, 2.5, 0], [4.3, 0.15, 1.8]),
    part("背面玻璃", "box", "#b4d6d9", [0, 1.35, -0.65], [3.8, 2.15, 0.04], [0, 0, 0], { opacity: 0.28, roughness: 0.18 }),
    part("候车座椅", "box", "#a2957f", [-0.4, 0.58, -0.2], [2.6, 0.12, 0.48]),
    part("站牌框", "box", metal, [1.55, 1.58, -0.58], [0.55, 1.2, 0.12]),
    part("线路面板", "box", "#e1e8dc", [1.55, 1.58, -0.5], [0.43, 1.06, 0.025]),
  ];
  for (const x of [-1.88, 1.88]) for (const z of [-0.68, 0.65]) parts.push(part("候车亭立柱", "box", metal, [x, 1.3, z], [0.1, 2.5, 0.1]));
  for (const x of [-1.2, 0.4]) parts.push(part("座椅支腿", "box", metal, [x, 0.31, -0.2], [0.1, 0.5, 0.42]));
  return asset("themedBusStop", "城市候车亭", "现代", "建筑", parts);
}

function runeStone() {
  const parts = [
    part("岩石底座", "cylinder", darkStone, [0, 0.12, 0], [1.65, 0.24, 1.25]),
    crystal("符文立石", "#596177", [0, 1.35, 0], [1.1, 1.7, 0.75]),
  ];
  const glow = { emissive: "#54d4de", emissiveIntensity: 1.15 };
  parts.push(part("符文竖画", "box", light, [0, 1.4, 0.385], [0.045, 0.78, 0.025], [0, 0, 0], glow));
  parts.push(part("符文斜画", "box", light, [0.12, 1.63, 0.37], [0.045, 0.32, 0.03], [0, 0, -48], glow));
  parts.push(part("符文横画", "box", light, [-0.1, 1.23, 0.37], [0.26, 0.045, 0.03], [0, 0, 0], glow));
  return asset("themedRuneStone", "远古符文立石", "奇幻", "道具", parts);
}

function floatingCrystal() {
  const parts = [
    part("水晶祭座", "cylinder", darkStone, [0, 0.18, 0], [1.6, 0.36, 1.6]),
    ring("祭座金环", brass, 0.82, 0.07, 0.37, 0.08, { metalness: 0.65 }),
    crystal("悬浮紫晶", "#ad8dda", [0, 1.82, 0], [0.9, 1.2, 0.9], { emissive: "#64439c", emissiveIntensity: 0.65, roughness: 0.18 }),
    part("悬浮能量环", "torus", "#c3b2ed", [0, 0.85, 0], [1.1, 1.1, 0.15], [90, 0, 0], { emissive: "#9985d6", emissiveIntensity: 1.1 }),
  ];
  for (let index = 0; index < 3; index++) {
    const angle = index * Math.PI * 2 / 3;
    parts.push(crystal("伴生小晶体", "#8bafcf", [Math.cos(angle) * 0.58, 0.72, Math.sin(angle) * 0.58], [0.24, 0.4, 0.24], { emissive: "#4b81a7", emissiveIntensity: 0.5 }));
  }
  return asset("themedFloatingCrystal", "悬浮魔法水晶", "奇幻", "道具", parts);
}

function magicAltar() {
  const parts = [
    part("法阵石台", "cylinder", darkStone, [0, 0.16, 0], [3.6, 0.32, 3.6]),
    ring("外圈铭文环", brass, 1.68, 0.06, 0.335, 0.02, { emissive: "#ba8750", emissiveIntensity: 0.6 }),
    ring("内圈法环", "#b29bd5", 1.06, 0.04, 0.34, 0.025, { emissive: "#8871c4", emissiveIntensity: 1 }),
    part("中央晶球", "sphere", "#c3b4e8", [0, 0.55, 0], [0.38, 0.38, 0.38], [0, 0, 0], { emissive: "#9985d6", emissiveIntensity: 0.8 }),
  ];
  for (let index = 0; index < 12; index++) {
    const angle = index * Math.PI / 6;
    parts.push(part("刻度符文", "box", "#cab6e7", [Math.cos(angle) * 1.35, 0.343, Math.sin(angle) * 1.35], [0.055, 0.018, 0.22], [0, 90 - index * 30, 0], { emissive: "#9985d6", emissiveIntensity: 0.8 }));
  }
  return asset("themedMagicAltar", "环形法阵祭坛", "奇幻", "建筑", parts);
}

function magicGate() {
  const path = Array.from({ length: 33 }, (_, index) => {
    const angle = index * Math.PI / 16;
    return { x: Math.sin(angle) * 1.3, y: 2.15 + Math.cos(angle) * 1.9, z: 0 };
  });
  const parts = [
    part("传送门底座", "box", darkStone, [0, 0.12, 0], [3.3, 0.24, 1.1]),
    part("符文门环", "tube", brass, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path, radius: 0.16, metalness: 0.65, roughness: 0.34 }),
    part("传送能量面", "cylinder", "#90d1e1", [0, 2.15, 0], [2.4, 0.025, 3.6], [90, 0, 0], { opacity: 0.28, emissive: "#58a4c9", emissiveIntensity: 0.85, roughness: 0.2 }),
  ];
  for (const x of [-1.36, 1.36]) parts.push(crystal("门侧水晶", "#b598db", [x, 0.52, 0.12], [0.34, 0.44, 0.34], { emissive: "#7f5bbd", emissiveIntensity: 0.9 }));
  return asset("themedMagicGate", "魔法传送门", "奇幻", "建筑", parts);
}

function sciFiTerminal() {
  return asset("themedSciFiTerminal", "科幻交互终端", "科幻", "道具", [
    part("终端底座", "box", metal, [0, 0.08, 0], [0.9, 0.16, 0.8], [0, 0, 0], { metalness: 0.65, roughness: 0.35 }),
    part("终端立柱", "box", "#344655", [0, 0.7, 0], [0.3, 1.2, 0.3]),
    part("显示器外框", "box", metal, [0, 1.43, 0], [1.02, 0.72, 0.16], [-18, 0, 0]),
    part("显示屏", "box", "#72c5d3", [0, 1.44, 0.1], [0.87, 0.56, 0.025], [-18, 0, 0], { emissive: "#3d93b4", emissiveIntensity: 0.9, roughness: 0.2 }),
    part("操作台", "box", "#6c7e89", [0, 1.04, 0.3], [0.9, 0.08, 0.38]),
    part("状态灯条", "box", light, [0, 0.3, 0.16], [0.19, 0.035, 0.025], [0, 0, 0], { emissive: "#65d6c9", emissiveIntensity: 1.2 }),
  ]);
}

function energyCore() {
  const parts = [
    part("反应堆底座", "cylinder", metal, [0, 0.18, 0], [1.8, 0.36, 1.8], [0, 0, 0], { metalness: 0.7, roughness: 0.32 }),
    part("能量核心", "sphere", "#a2e6ef", [0, 1.35, 0], [0.9, 1.1, 0.9], [0, 0, 0], { emissive: "#4eafcf", emissiveIntensity: 1.5, roughness: 0.2 }),
    ring("下约束环", "#8b9ba7", 0.82, 0.14, 0.52, 0.2, { metalness: 0.75 }),
    ring("上约束环", "#8b9ba7", 0.82, 0.14, 2.16, 0.2, { metalness: 0.75 }),
    part("顶部盖板", "cylinder", metal, [0, 2.4, 0], [1.4, 0.2, 1.4]),
  ];
  for (let index = 0; index < 4; index++) {
    const angle = index * Math.PI / 2 + Math.PI / 4;
    const x = Math.cos(angle) * 0.69, z = Math.sin(angle) * 0.69;
    parts.push(part("反应堆支柱", "cylinder", metal, [x, 1.37, z], [0.14, 1.95, 0.14]));
    parts.push(part("导能管", "cylinder", light, [x * 0.9, 1.34, z * 0.9], [0.045, 1.5, 0.045], [0, 0, 0], { emissive: "#67c8dc", emissiveIntensity: 0.9 }));
  }
  return asset("themedEnergyCore", "能量反应堆", "科幻", "道具", parts);
}

function beaconTower() {
  const parts = [
    part("信标底盘", "cylinder", metal, [0, 0.16, 0], [1.45, 0.32, 1.45]),
    part("信标塔芯", "cylinder", "#74858d", [0, 1.75, 0], [0.24, 3.3, 0.24]),
    part("信标灯舱", "capsule", "#d2e8b5", [0, 3.43, 0], [0.57, 0.9, 0.57], [0, 0, 0], { emissive: "#acd66d", emissiveIntensity: 1.4 }),
    ring("灯舱护环", metal, 0.48, 0.09, 3.42, 0.12, { metalness: 0.65 }),
    part("天线", "cylinder", metal, [0, 4.23, 0], [0.05, 0.7, 0.05]),
  ];
  for (let index = 0; index < 3; index++) {
    const angle = index * Math.PI * 2 / 3;
    parts.push(beam("三脚塔架", metal, [Math.cos(angle) * 0.6, 0.24, Math.sin(angle) * 0.6], [0, 2.8, 0], 0.12));
  }
  return asset("themedBeaconTower", "星际信标塔", "科幻", "道具", parts);
}

function satelliteDish() {
  const parts = [
    part("天线基座", "cylinder", metal, [0, 0.13, 0], [1.3, 0.26, 1.3]),
    part("天线立柱", "box", "#7d8b94", [0, 1.07, 0], [0.26, 1.9, 0.28]),
    part("抛物面天线", "lathe", "#c3d0d4", [0, 2.1, 0], [1, 1, 1], [55, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.3, y: 0.025 }, { x: 0.65, y: 0.1 }, { x: 1, y: 0.24 }, { x: 1.35, y: 0.45 }, { x: 1.4, y: 0.49 }, { x: 1.4, y: 0.43 }, { x: 1, y: 0.18 }, { x: 0.65, y: 0.04 }, { x: 0.3, y: -0.035 }, { x: 0, y: -0.06 }], metalness: 0.6, roughness: 0.28 }),
    beam("馈源支臂", metal, [0, 1.9, -0.25], [0, 2.87, 1.04], 0.07),
    part("馈源接收器", "capsule", "#5c7a8e", [0, 2.87, 1.04], [0.2, 0.32, 0.2], [55, 0, 0]),
  ];
  for (const x of [-0.7, 0.7]) parts.push(beam("基座斜撑", metal, [x, 0.15, 0], [0, 1.45, 0], 0.12));
  return asset("themedSatelliteDish", "卫星接收天线", "科幻", "道具", parts);
}

export const themedAssets: SceneAsset[] = [
  paifang(), stoneLantern(), pagoda(), moonGate(),
  torii(), stonePagoda(), bambooScreen(), taikoDrum(),
  romanColumn(), stoneWell(), gothicArch(), woodenCart(),
  modernStreetlight(), modernBench(), phoneBooth(), busStop(),
  runeStone(), floatingCrystal(), magicAltar(), magicGate(),
  sciFiTerminal(), energyCore(), beaconTower(), satelliteDish(),
  ...easternAssets,
  ...civicAssets,
  ...fantasyAssets,
  ...worldAssets,
];
