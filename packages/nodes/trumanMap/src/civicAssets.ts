import { asset, beam, part, pitchedRoof, ring, type ModelPart, type Triple } from "./assetModelParts";
import type { SceneAsset } from "./sceneDocument";

const stone = "#b9b2a1";
const paleStone = "#d4ccb9";
const slate = "#56616b";
const wood = "#805c43";
const oak = "#aa8159";
const iron = "#394751";
const brass = "#b99c62";
const glass = "#a2c6ce";
const concrete = "#a5aaa9";
const steel = "#6f818b";
const dark = "#28343d";

function european(id: string, name: string, category: "建筑" | "道具" | "自然", parts: ModelPart[]) {
  return asset(`civic${id}`, name, "欧式", category, parts);
}

function modern(id: string, name: string, category: "建筑" | "道具" | "自然", parts: ModelPart[]) {
  return asset(`civic${id}`, name, "现代", category, parts);
}

function legs(width: number, depth: number, height: number, color: string, thickness = 0.08) {
  return [-1, 1].flatMap(x => [-1, 1].map(z => part("支腿", "box", color, [x * width / 2, height / 2, z * depth / 2], [thickness, height, thickness])));
}

function windows(columns: number, rows: number, spacing: number, firstY: number, z: number, color = glass) {
  return Array.from({ length: columns * rows }, (_, index) => part("立面窗格", "box", color, [(index % columns - (columns - 1) / 2) * spacing, firstY + Math.floor(index / columns) * 2.7, z], [spacing * 0.64, 1.45, 0.04], [0, 0, 0], { roughness: 0.22, metalness: 0.25 }));
}

function carWheels(x: number, y: number, axles: number[], radius: number, width: number) {
  return axles.flatMap(z => [-1, 1].flatMap(side => [
    part("橡胶轮胎", "cylinder", "#263039", [x * side, y, z], [radius * 2, width, radius * 2], [0, 0, 90], { roughness: 0.95 }),
    part("金属轮毂", "cylinder", steel, [(x + width * 0.51) * side, y, z], [radius * 1.2, 0.035, radius * 1.2], [0, 0, 90], { metalness: 0.65, roughness: 0.3 }),
  ]));
}

function roundTabletop(radius: number, height: number, color: string) {
  return part("圆形台面", "cylinder", color, [0, height, 0], [radius * 2, 0.1, radius * 2]);
}

function halfTimberHouse() {
  const parts = [part("抹灰屋身", "box", "#e0d3b8", [0, 2, 0], [5.6, 4, 4.2]), { ...pitchedRoof("双坡瓦顶", "#8b6050", 6.2, 4.8, 4.05), scale: { x: 1, y: 2.4, z: 1 } }, part("木门", "box", wood, [0, 1.1, 2.13], [0.95, 2.2, 0.1]), ...windows(4, 1, 1.2, 2.8, 2.13)];
  for (const x of [-2.65, -1.4, 0, 1.4, 2.65]) parts.push(part("半木立柱", "box", wood, [x, 2, 2.17], [0.14, 4, 0.12]));
  for (const y of [0.22, 2.05, 3.9]) parts.push(part("半木横梁", "box", wood, [0, y, 2.18], [5.5, 0.15, 0.12]));
  for (const x of [-2, 2]) parts.push(beam("墙面斜撑", wood, [x - 0.5, 0.3, 2.18], [x + 0.5, 1.9, 2.18], 0.12));
  parts.push(part("砖烟囱", "box", "#906c5c", [-1.6, 4.65, -0.9], [0.65, 2.2, 0.6]));
  return european("HalfTimberHouse", "半木结构民居", "建筑", parts);
}

function cottage() {
  return european("Cottage", "茅顶乡村小屋", "建筑", [
    part("小屋石墙", "box", stone, [0, 1.3, 0], [4.3, 2.6, 3.5]), { ...pitchedRoof("厚茅草屋顶", "#a98e55", 5.1, 4.15, 2.64), scale: { x: 1, y: 2.6, z: 1 } },
    part("橡木门", "box", wood, [-0.65, 0.95, 1.79], [0.85, 1.9, 0.1]), part("小屋方窗", "box", glass, [1.05, 1.55, 1.8], [0.95, 0.9, 0.06]),
    ...[-0.53, 0.53].map(offset => part("窗扇", "box", "#6d7b61", [1.05 + offset, 1.55, 1.83], [0.24, 1.05, 0.07])),
    part("石砌烟囱", "box", "#8c8c82", [-1.25, 3.1, -0.6], [0.7, 2.5, 0.7]), part("入口石阶", "box", paleStone, [-0.65, 0.1, 2.08], [1.25, 0.2, 0.65]),
  ]);
}

function watchtower() {
  const parts = [part("塔基", "box", stone, [0, 0.2, 0], [3.4, 0.4, 3.4]), part("瞭望塔身", "box", "#a5a395", [0, 3.1, 0], [2.8, 5.8, 2.8]), part("顶部平台", "box", paleStone, [0, 6.05, 0], [3.3, 0.3, 3.3]), part("塔门", "box", wood, [0, 1.15, 1.43], [0.9, 2.2, 0.08])];
  for (const side of [-1, 1]) for (let index = -1; index <= 1; index++) {
    parts.push(part("城垛", "box", stone, [index * 1.2, 6.55, side * 1.43], [0.62, 0.8, 0.45]));
    parts.push(part("侧面城垛", "box", stone, [side * 1.43, 6.55, index * 1.2], [0.45, 0.8, 0.62]));
  }
  for (const y of [3.3, 4.8]) parts.push(part("箭窗", "box", dark, [0, y, 1.415], [0.17, 0.8, 0.035]));
  return european("Watchtower", "石砌瞭望塔", "建筑", parts);
}

function windmill() {
  const parts = [part("风车塔身", "lathe", "#c5b9a2", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 1.45, y: 0 }, { x: 0.9, y: 5.3 }, { x: 0, y: 5.3 }] }), part("风车尖顶", "cone", wood, [0, 5.85, 0], [2.65, 1.5, 2.65]), part("风车门", "box", wood, [0, 1, 1.32], [0.8, 2, 0.12]), part("轮轴", "cylinder", iron, [0, 4.4, 1.2], [0.25, 0.8, 0.25], [90, 0, 0])];
  for (let index = 0; index < 4; index++) {
    const angle = Math.PI / 4 + index * Math.PI / 2;
    const x = Math.cos(angle), y = Math.sin(angle);
    parts.push(beam("风车翼梁", wood, [0, 4.4, 1.65], [x * 3.7, 4.4 + y * 3.7, 1.65], 0.14));
    parts.push(part("帆翼", "box", "#d5c79c", [x * 2.55, 4.4 + y * 2.55, 1.65], [0.72, 2.2, 0.07], [0, 0, index * 90 - 45]));
  }
  return european("Windmill", "荷兰风车", "建筑", parts);
}

function castleTurret() {
  const parts = [part("角楼底座", "cylinder", stone, [0, 0.18, 0], [3.8, 0.36, 3.8]), part("圆形角楼", "cylinder", "#a7a99b", [0, 2.8, 0], [3.2, 5.3, 3.2]), ring("外挑檐环", paleStone, 1.85, 0.25, 5.35, 0.4), part("锥形瓦顶", "cone", "#576474", [0, 6.6, 0], [4.1, 2.4, 4.1]), part("楼顶旗杆", "cylinder", iron, [0, 8.3, 0], [0.06, 1.4, 0.06]), part("三角旗", "extrude", "#8e3e3d", [0, 8.6, 0], [1, 1, 1], [0, 0, 0], { depth: 0.03, profile: [{ x: 0, y: 0 }, { x: 0.9, y: -0.2 }, { x: 0, y: -0.45 }] })];
  for (const y of [1.8, 3.7]) parts.push(part("角楼箭窗", "box", dark, [0, y, 1.59], [0.22, 0.9, 0.05]));
  return european("CastleTurret", "城堡圆形角楼", "建筑", parts);
}

function stoneBridge() {
  const profile = [[-3, 1.45], [3, 1.45], [3, 0], [1.9, 0], [1.6, 0.55], [0.8, 1.02], [0, 1.17], [-0.8, 1.02], [-1.6, 0.55], [-1.9, 0], [-3, 0]];
  const parts = [part("石拱桥身", "extrude", stone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 2.1, profile: profile.map(([x, y]) => ({ x: x!, y: y! })) }), part("桥面铺装", "box", paleStone, [0, 1.49, 0], [6.2, 0.14, 2.3])];
  for (const z of [-1.02, 1.02]) {
    parts.push(part("桥栏扶手", "box", paleStone, [0, 2.35, z], [6.2, 0.18, 0.22]));
    for (let index = 0; index < 7; index++) parts.push(part("石栏柱", "box", stone, [-2.85 + index * 0.95, 1.95, z], [0.19, 0.8, 0.2]));
  }
  return european("StoneBridge", "石拱小桥", "建筑", parts);
}

function marketStall() {
  const parts = [...legs(2.6, 1.4, 2.4, wood, 0.12), part("摊位柜台", "box", oak, [0, 0.85, 0], [2.8, 0.18, 1.6]), pitchedRoof("帆布棚", "#aa6c53", 3.15, 2, 2.5), part("柜台挡板", "box", wood, [0, 0.43, 0.7], [2.7, 0.75, 0.1])];
  for (const x of [-0.85, 0, 0.85]) {
    parts.push(part("蔬果筐", "box", "#bb986b", [x, 1.05, 0], [0.72, 0.22, 0.8]));
    for (let index = 0; index < 4; index++) parts.push(part("摊位蔬果", "sphere", x < 0 ? "#b7674b" : "#98a05b", [x + (index % 2 - 0.5) * 0.25, 1.23, (Math.floor(index / 2) - 0.5) * 0.26], [0.24, 0.22, 0.24]));
  }
  return european("MarketStall", "欧式集市摊棚", "建筑", parts);
}

function bellTower() {
  const parts = [part("钟楼台基", "box", stone, [0, 0.25, 0], [3.8, 0.5, 3.8]), part("钟楼塔身", "box", "#c5bba7", [0, 3, 0], [3, 5.5, 3]), ...legs(2.6, 2.6, 7, paleStone, 0.28), part("钟楼檐盘", "box", stone, [0, 7.1, 0], [3.6, 0.3, 3.6]), part("钟楼尖顶", "cone", slate, [0, 8.3, 0], [4.7, 2.3, 4.7]), part("铜钟", "lathe", brass, [0, 5.8, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0.9 }, { x: 0.24, y: 0.85 }, { x: 0.36, y: 0.2 }, { x: 0.58, y: 0 }, { x: 0.52, y: -0.05 }, { x: 0.25, y: 0.7 }] }), part("钟锤", "sphere", iron, [0, 5.87, 0], [0.2, 0.3, 0.2]), part("塔门", "box", wood, [0, 1.3, 1.53], [1.05, 2.6, 0.07])];
  return european("BellTower", "教堂钟楼", "建筑", parts);
}

function pergola() {
  const parts: ModelPart[] = [];
  for (const x of [-1.6, 1.6]) for (const z of [-2.8, 0, 2.8]) parts.push(part("廊架立柱", "box", wood, [x, 1.4, z], [0.2, 2.8, 0.2]));
  for (const x of [-1.6, 1.6]) parts.push(part("廊架纵梁", "box", oak, [x, 2.85, 0], [0.22, 0.28, 6.4]));
  for (let index = 0; index < 10; index++) parts.push(part("顶面木格栅", "box", wood, [0, 3.04, -2.9 + index * 0.65], [3.8, 0.18, 0.14]));
  return european("Pergola", "花园葡萄架长廊", "建筑", parts);
}

function conservatory() {
  const parts = [...legs(4.6, 3.6, 2.8, iron, 0.1), part("温室地台", "box", stone, [0, 0.08, 0], [5, 0.16, 4]), { ...pitchedRoof("玻璃屋顶", glass, 4.9, 3.9, 2.85), opacity: 0.32, roughness: 0.15 }, part("背面玻璃", "box", glass, [0, 1.5, -1.8], [4.6, 2.6, 0.04], [0, 0, 0], { opacity: 0.28, roughness: 0.15 })];
  for (const x of [-2.3, 2.3]) parts.push(part("侧面玻璃", "box", glass, [x, 1.5, 0], [0.04, 2.6, 3.6], [0, 0, 0], { opacity: 0.28, roughness: 0.15 }));
  for (const z of [-1.8, 0, 1.8]) parts.push(pitchedRoof("金属屋脊框", iron, 4.85, 0.07, 2.88));
  for (const x of [-1.5, -0.5, 0.5, 1.5]) parts.push(part("温室后窗框", "box", iron, [x, 1.5, -1.83], [0.06, 2.7, 0.08]));
  return european("Conservatory", "玻璃花房温室", "建筑", parts);
}

function victorianLamp() {
  const parts = [part("铸铁灯柱", "lathe", iron, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.3, y: 0 }, { x: 0.28, y: 0.22 }, { x: 0.13, y: 0.35 }, { x: 0.08, y: 2.55 }, { x: 0.22, y: 2.68 }] }), part("灯笼底盘", "box", iron, [0, 2.73, 0], [0.6, 0.12, 0.6]), part("暖光灯室", "box", "#efd6a0", [0, 3.1, 0], [0.36, 0.63, 0.36], [0, 0, 0], { emissive: "#e9bf73", emissiveIntensity: 0.8, opacity: 0.7 }), part("灯笼尖顶", "cone", iron, [0, 3.58, 0], [0.91, 0.35, 0.91])];
  for (const x of [-0.23, 0.23]) for (const z of [-0.23, 0.23]) parts.push(part("灯笼框条", "box", iron, [x, 3.1, z], [0.045, 0.72, 0.045]));
  return european("VictorianLamp", "维多利亚庭院灯", "道具", parts);
}

function ironGate() {
  const parts = [part("门顶横梁", "box", iron, [0, 2.25, 0], [3.7, 0.1, 0.12]), part("门底横梁", "box", iron, [0, 0.35, 0], [3.7, 0.1, 0.12])];
  for (const x of [-2.05, 2.05]) { parts.push(part("门柱", "box", stone, [x, 1.35, 0], [0.48, 2.7, 0.55])); parts.push(part("柱顶石球", "sphere", paleStone, [x, 2.92, 0], [0.46, 0.46, 0.46])); }
  for (let index = 0; index < 15; index++) { const x = (index - 7) * 0.24; parts.push(part("铁栅竖杆", "cylinder", iron, [x, 1.3, 0], [0.045, 2.1, 0.045])); parts.push(part("矛尖", "cone", iron, [x, 2.46, 0], [0.13, 0.26, 0.13])); }
  for (const x of [-0.85, 0.85]) parts.push(part("卷草圆饰", "torus", iron, [x, 1.45, 0], [0.8, 0.8, 0.17]));
  return european("IronGate", "锻铁庭院双门", "建筑", parts);
}

function balustrade() {
  const parts = [part("石栏底梁", "box", stone, [0, 0.1, 0], [2.7, 0.2, 0.48]), part("石栏扶手", "box", paleStone, [0, 1.02, 0], [2.8, 0.2, 0.54])];
  for (let index = 0; index < 6; index++) parts.push(part("瓶形石栏柱", "lathe", paleStone, [-1.1 + index * 0.44, 0.2, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.1, y: 0 }, { x: 0.12, y: 0.1 }, { x: 0.075, y: 0.3 }, { x: 0.13, y: 0.5 }, { x: 0.07, y: 0.7 }, { x: 0.12, y: 0.74 }] }));
  return european("Balustrade", "古典石制栏杆", "建筑", parts);
}

function gardenUrn() {
  return european("GardenUrn", "古典花园饰盆", "道具", [part("方形盆座", "box", stone, [0, 0.12, 0], [0.75, 0.24, 0.75]), part("古典盆身", "lathe", paleStone, [0, 0.22, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.22, y: 0 }, { x: 0.17, y: 0.16 }, { x: 0.23, y: 0.35 }, { x: 0.48, y: 0.58 }, { x: 0.53, y: 0.92 }, { x: 0.55, y: 1.01 }, { x: 0.43, y: 1.01 }, { x: 0.42, y: 0.78 }, { x: 0.2, y: 0.5 }] }), ...[-1, 1].map(side => part("双耳环柄", "torus", stone, [side * 0.5, 0.94, 0], [0.48, 0.7, 0.35]))]);
}

function birdbath() {
  return european("Birdbath", "花园鸟浴盆", "道具", [part("浴盆圆座", "cylinder", stone, [0, 0.09, 0], [0.9, 0.18, 0.9]), part("浴盆立柱", "lathe", paleStone, [0, 0.16, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.24, y: 0 }, { x: 0.14, y: 0.25 }, { x: 0.1, y: 0.7 }, { x: 0.28, y: 0.86 }] }), part("浅水石盆", "lathe", paleStone, [0, 1.02, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.6, y: 0.05 }, { x: 0.72, y: 0.22 }, { x: 0.65, y: 0.25 }, { x: 0.52, y: 0.12 }, { x: 0, y: 0.1 }] }), part("盆中水面", "cylinder", "#7ba1aa", [0, 1.19, 0], [1.12, 0.018, 1.12], [0, 0, 0], { roughness: 0.12, metalness: 0.2 })]);
}

function sundial() {
  const parts = [part("日晷基座", "box", stone, [0, 0.15, 0], [0.85, 0.3, 0.85]), part("日晷台柱", "cylinder", paleStone, [0, 0.7, 0], [0.42, 1.1, 0.42]), roundTabletop(0.67, 1.3, brass), part("日晷晷针", "extrude", iron, [0, 1.36, 0], [1, 1, 1], [0, 90, 0], { depth: 0.04, profile: [{ x: -0.35, y: 0 }, { x: 0.35, y: 0 }, { x: -0.35, y: 0.55 }] })];
  for (let index = 0; index < 12; index++) { const angle = index * Math.PI / 6; parts.push(part("时刻标记", "box", iron, [Math.sin(angle) * 0.54, 1.357, Math.cos(angle) * 0.54], [0.025, 0.014, 0.1], [0, index * 30, 0])); }
  return european("Sundial", "古典庭园日晷", "道具", parts);
}

function parkFountain() {
  return european("ParkFountain", "欧式叠水喷泉", "道具", [part("喷泉基盘", "cylinder", stone, [0, 0.15, 0], [3.4, 0.3, 3.4]), ring("外池石沿", paleStone, 1.67, 0.18, 0.4, 0.38), part("池水", "cylinder", "#7eabb9", [0, 0.39, 0], [2.96, 0.025, 2.96], [0, 0, 0], { roughness: 0.15 }), part("喷泉中心柱", "lathe", paleStone, [0, 0.35, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.38, y: 0 }, { x: 0.19, y: 0.65 }, { x: 0.32, y: 1.1 }, { x: 0.15, y: 1.7 }] }), ring("上层蓄水盘", paleStone, 0.87, 0.16, 1.47, 0.25), part("上盘底", "cylinder", paleStone, [0, 1.36, 0], [1.6, 0.08, 1.6]), part("上盘水面", "cylinder", "#8eb5bf", [0, 1.49, 0], [1.4, 0.02, 1.4], [0, 0, 0], { roughness: 0.15 }), part("喷泉顶饰", "sphere", paleStone, [0, 2.12, 0], [0.28, 0.35, 0.28])]);
}

function streetClock() {
  const parts = [part("时钟柱础", "box", iron, [0, 0.14, 0], [0.8, 0.28, 0.8]), part("时钟柱", "cylinder", iron, [0, 1.6, 0], [0.16, 3, 0.16]), part("街钟外框", "cylinder", brass, [0, 3.2, 0], [1.15, 0.22, 1.15], [90, 0, 0]), part("街钟表盘", "cylinder", "#e4ddc8", [0, 3.2, 0.13], [1.02, 0.025, 1.02], [90, 0, 0]), part("时针", "box", iron, [0.1, 3.27, 0.15], [0.28, 0.035, 0.02], [0, 0, 32]), part("分针", "box", iron, [0, 3.41, 0.15], [0.025, 0.43, 0.02])];
  for (let index = 0; index < 12; index++) { const angle = index * Math.PI / 6; parts.push(part("钟面刻度", "box", iron, [Math.sin(angle) * 0.43, 3.2 + Math.cos(angle) * 0.43, 0.15], [0.026, 0.07, 0.02], [0, 0, -index * 30])); }
  return european("StreetClock", "欧式街头座钟", "道具", parts);
}

function postBox() {
  return european("PostBox", "铸铁圆顶邮筒", "道具", [part("邮筒脚座", "cylinder", iron, [0, 0.1, 0], [0.68, 0.2, 0.68]), part("邮筒主体", "cylinder", "#8f3f38", [0, 0.86, 0], [0.55, 1.45, 0.55]), part("邮筒圆顶", "sphere", "#a34b40", [0, 1.58, 0], [0.65, 0.24, 0.65]), part("投信口", "box", dark, [0, 1.27, 0.278], [0.32, 0.08, 0.025]), part("信箱标签", "box", "#ddd5b6", [0, 0.97, 0.286], [0.28, 0.24, 0.025]), part("开箱门板", "box", "#793c35", [0, 0.53, 0.28], [0.3, 0.4, 0.03])]);
}

function carriage() {
  const parts = [part("车架底盘", "box", wood, [0, 0.92, 0], [1.7, 0.22, 2.8]), part("封闭车厢", "box", "#5a6855", [0, 1.9, -0.25], [1.55, 1.75, 2]), part("马车弧顶", "capsule", wood, [0, 2.8, -0.25], [1.8, 0.3, 2.2], [0, 0, 0]), part("车夫座位", "box", oak, [0, 1.55, 1.08], [1.5, 0.18, 0.6]), part("车厢前窗", "box", glass, [0, 2.15, 0.77], [1.1, 0.75, 0.03]), ...carWheels(1.05, 0.64, [-1.15, 1.05], 0.62, 0.15)];
  for (const x of [-0.79, 0.79]) parts.push(part("车厢侧窗", "box", glass, [x, 2.18, -0.2], [0.035, 0.7, 1.05]));
  for (const x of [-0.55, 0.55]) parts.push(beam("马车牵引杆", wood, [x, 0.83, 1.15], [x, 0.7, 3.3], 0.09));
  return european("Carriage", "古典马车车厢", "道具", parts);
}

function wheelbarrow() {
  const parts = [part("独轮车斗底", "box", "#8c977f", [0, 0.63, 0], [0.68, 0.08, 0.95]), part("车斗前板", "box", "#8c977f", [0, 0.84, -0.48], [0.8, 0.45, 0.08], [-18, 0, 0]), part("前轮", "cylinder", dark, [0, 0.3, -0.75], [0.6, 0.15, 0.6], [0, 0, 90])];
  for (const x of [-0.37, 0.37]) { parts.push(part("车斗侧板", "box", "#a3ac94", [x, 0.83, 0], [0.07, 0.42, 1.05], [0, 0, x < 0 ? 12 : -12])); parts.push(beam("扶手长梁", wood, [x, 0.38, -0.75], [x, 0.95, 1.15], 0.06)); parts.push(beam("停车支脚", iron, [x, 0.67, 0.35], [x, 0.03, 0.5], 0.05)); }
  return european("Wheelbarrow", "园艺独轮推车", "道具", parts);
}

function barrel() {
  const parts = [part("橡木桶身", "lathe", oak, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.33, y: 0 }, { x: 0.41, y: 0.22 }, { x: 0.44, y: 0.52 }, { x: 0.4, y: 0.85 }, { x: 0.32, y: 1.02 }, { x: 0, y: 1.02 }] })];
  for (const [radius, y] of [[0.36, 0.1], [0.445, 0.4], [0.435, 0.7], [0.35, 0.94]]) parts.push(ring("铁箍", iron, radius!, 0.035, y!, 0.065));
  parts.push(part("桶塞", "cylinder", wood, [0.1, 1.03, 0], [0.12, 0.025, 0.12]));
  return european("Barrel", "橡木酒桶", "道具", parts);
}

function treasureChest() {
  const parts = [part("木箱底身", "box", wood, [0, 0.32, 0], [1.1, 0.64, 0.7]), part("拱形箱盖", "cylinder", oak, [0, 0.65, 0], [0.72, 1.1, 0.72], [0, 0, 90]), part("搭扣", "box", brass, [0, 0.55, 0.38], [0.13, 0.31, 0.06])];
  for (const x of [-0.4, 0.4]) { parts.push(part("箱体金属带", "box", iron, [x, 0.3, 0.36], [0.08, 0.6, 0.04])); parts.push(part("箱盖弧箍", "torus", iron, [x, 0.65, 0], [0.74, 0.74, 0.2], [0, 90, 0])); }
  return european("TreasureChest", "木制搭扣宝箱", "道具", parts);
}

function wineRack() {
  const parts = [part("酒架左框", "box", wood, [-0.72, 0.85, 0], [0.1, 1.7, 0.58]), part("酒架右框", "box", wood, [0.72, 0.85, 0], [0.1, 1.7, 0.58])];
  for (let level = 0; level < 4; level++) { const y = 0.12 + level * 0.44; parts.push(part("酒架层板", "box", oak, [0, y, 0], [1.4, 0.07, 0.6])); for (let column = 0; column < 4; column++) { const x = -0.51 + column * 0.34; parts.push(part("酒瓶瓶身", "cylinder", "#435d46", [x, y + 0.15, 0], [0.2, 0.42, 0.2], [90, 0, 0])); parts.push(part("酒瓶瓶颈", "cylinder", "#435d46", [x, y + 0.15, 0.27], [0.08, 0.16, 0.08], [90, 0, 0])); } }
  return european("WineRack", "酒窖瓶架", "道具", parts);
}

function banquetTable() {
  return european("BanquetTable", "橡木宴会长桌", "道具", [part("厚木桌面", "box", oak, [0, 0.77, 0], [3.4, 0.12, 1]), ...legs(2.8, 0.64, 0.72, wood, 0.16), part("桌下纵梁", "box", wood, [0, 0.3, 0], [2.9, 0.14, 0.14]), part("桌面烛台底盘", "cylinder", brass, [0, 0.87, 0], [0.23, 0.05, 0.23]), part("桌面蜡烛", "cylinder", "#e6d8b5", [0, 1.03, 0], [0.07, 0.29, 0.07])]);
}

function diningChair() {
  const parts = [...legs(0.42, 0.42, 0.47, wood, 0.06), part("餐椅座垫", "box", "#80504e", [0, 0.49, 0], [0.55, 0.1, 0.55])];
  for (const x of [-0.23, 0.23]) parts.push(part("高背边框", "box", wood, [x, 0.9, -0.23], [0.06, 0.86, 0.07]));
  for (const y of [0.77, 1.02, 1.28]) parts.push(part("靠背横档", "box", oak, [0, y, -0.23], [0.44, 0.1, 0.07]));
  return european("DiningChair", "古典高背餐椅", "道具", parts);
}

function armchair() {
  const parts = [...legs(0.65, 0.62, 0.27, wood, 0.08), part("扶手椅座垫", "box", "#6e7359", [0, 0.43, 0], [0.8, 0.23, 0.75]), part("高软靠背", "box", "#6e7359", [0, 0.91, -0.34], [0.86, 0.92, 0.19], [-8, 0, 0])];
  for (const x of [-0.45, 0.45]) { parts.push(part("木制扶手", "capsule", wood, [x, 0.71, 0], [0.18, 0.72, 0.18], [90, 0, 0])); parts.push(part("扶手立撑", "cylinder", wood, [x, 0.45, 0.24], [0.07, 0.48, 0.07])); }
  return european("Armchair", "古典软包扶手椅", "道具", parts);
}

function chaiseLongue() {
  return european("ChaiseLongue", "贵妃躺椅", "道具", [...legs(1.75, 0.63, 0.25, wood, 0.09), part("躺椅软垫", "box", "#8b6a77", [0, 0.43, 0], [2.15, 0.26, 0.82]), part("斜靠背", "box", "#8b6a77", [-0.87, 0.78, 0], [0.26, 0.88, 0.86], [0, 0, -22]), part("低侧靠", "box", wood, [0.2, 0.63, -0.38], [1.65, 0.26, 0.09]), part("圆形头枕", "cylinder", "#b09a96", [-0.65, 0.67, 0], [0.28, 0.74, 0.28], [90, 0, 0])]);
}

function canopyBed() {
  const parts = [part("床架", "box", wood, [0, 0.4, 0], [1.8, 0.22, 2.25]), part("床垫", "box", "#dfd6bc", [0, 0.63, 0], [1.64, 0.25, 2.1]), part("床头板", "box", oak, [0, 0.9, -1.08], [1.78, 1, 0.12]), part("顶帐", "box", "#c6ad91", [0, 2.35, 0], [1.95, 0.08, 2.4]), part("被褥", "box", "#8f7674", [0, 0.79, 0.25], [1.69, 0.09, 1.55])];
  for (const x of [-0.84, 0.84]) for (const z of [-1.07, 1.07]) { parts.push(part("四柱床柱", "cylinder", wood, [x, 1.2, z], [0.09, 2.4, 0.09])); parts.push(part("床柱顶珠", "sphere", brass, [x, 2.48, z], [0.16, 0.16, 0.16])); }
  for (const x of [-0.42, 0.42]) parts.push(part("床枕", "box", "#e7ddc8", [x, 0.8, -0.68], [0.65, 0.15, 0.43]));
  return european("CanopyBed", "古典四柱床", "道具", parts);
}

function wardrobe() {
  return european("Wardrobe", "雕框双门衣橱", "道具", [part("衣橱柜体", "box", wood, [0, 1.14, 0], [1.5, 2.2, 0.62]), part("顶冠", "box", oak, [0, 2.29, 0], [1.68, 0.16, 0.76]), ...[-1, 1].flatMap(side => [part("衣橱门框", "box", oak, [side * 0.365, 1.16, 0.34], [0.69, 1.97, 0.08]), part("门板内芯", "box", "#745239", [side * 0.365, 1.16, 0.39], [0.51, 1.68, 0.03]), part("铜门拉手", "sphere", brass, [side * 0.08, 1.17, 0.45], [0.065, 0.065, 0.065])]), ...legs(1.28, 0.42, 0.12, wood, 0.1)]);
}

function bookcase() {
  const parts = [part("书柜背板", "box", wood, [0, 1.12, -0.2], [1.5, 2.24, 0.07]), part("书柜左侧", "box", wood, [-0.74, 1.12, 0], [0.1, 2.24, 0.48]), part("书柜右侧", "box", wood, [0.74, 1.12, 0], [0.1, 2.24, 0.48])];
  for (let level = 0; level < 5; level++) { const y = 0.1 + level * 0.52; parts.push(part("书柜层板", "box", oak, [0, y, 0], [1.5, 0.08, 0.48])); if (level < 4) for (let index = 0; index < 6; index++) parts.push(part("书脊", "box", ["#8b5750", "#657661", "#67788d"][index % 3]!, [-0.53 + index * 0.2, y + 0.23, 0.03], [0.14, 0.34 + index % 2 * 0.05, 0.31])); }
  return european("Bookcase", "古典开放书柜", "道具", parts);
}

function secretaryDesk() {
  return european("SecretaryDesk", "斜面写字台", "道具", [...legs(1.05, 0.55, 0.72, wood, 0.09), part("写字台柜体", "box", wood, [0, 0.83, -0.05], [1.25, 0.3, 0.75]), part("倾斜书写板", "box", oak, [0, 1, 0.08], [1.35, 0.08, 0.82], [-12, 0, 0]), part("后挡板", "box", wood, [0, 1.16, -0.4], [1.3, 0.3, 0.07]), ...[-1, 1].map(side => part("抽屉面板", "box", oak, [side * 0.31, 0.82, 0.35], [0.55, 0.19, 0.05])), part("墨水瓶", "cylinder", "#34515b", [-0.4, 1.1, 0.1], [0.11, 0.12, 0.11])]);
}

function fireplace() {
  const parts = [part("壁炉地台", "box", stone, [0, 0.09, 0], [2.1, 0.18, 0.9]), part("炉膛背板", "box", "#4a4441", [0, 0.8, -0.22], [1.45, 1.35, 0.13]), part("壁炉檐板", "box", paleStone, [0, 1.54, 0], [2.1, 0.22, 0.8])];
  for (const x of [-0.81, 0.81]) parts.push(part("壁炉侧柱", "box", stone, [x, 0.84, 0], [0.31, 1.32, 0.64]));
  for (const z of [-0.13, 0.13]) parts.push(part("炉内原木", "cylinder", wood, [0, 0.29, z], [0.17, 1.05, 0.17], [0, 0, 90]));
  parts.push(part("炉膛余烬", "sphere", "#da8c50", [0, 0.4, 0], [0.65, 0.22, 0.35], [0, 0, 0], { emissive: "#d77135", emissiveIntensity: 0.9 }));
  return european("Fireplace", "石制壁炉", "道具", parts);
}

function chandelier() {
  const parts = [part("吊灯吊杆", "cylinder", iron, [0, 1.5, 0], [0.055, 1.1, 0.055]), ring("吊灯铁环", iron, 0.76, 0.07, 0.9, 0.09), part("顶挂盘", "cylinder", iron, [0, 2.08, 0], [0.25, 0.08, 0.25])];
  for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3, x = Math.cos(angle) * 0.7, z = Math.sin(angle) * 0.7; parts.push(beam("吊灯拉杆", iron, [0, 1.9, 0], [x, 0.9, z], 0.025)); parts.push(part("吊灯烛座", "cylinder", brass, [x, 0.95, z], [0.19, 0.08, 0.19])); parts.push(part("吊灯蜡烛", "cylinder", "#e9d9b0", [x, 1.14, z], [0.065, 0.32, 0.065])); parts.push(part("烛火", "sphere", "#ffe1a0", [x, 1.35, z], [0.055, 0.12, 0.055], [0, 0, 0], { emissive: "#ffbc68", emissiveIntensity: 1.3 })); }
  return european("Chandelier", "六臂烛台吊灯", "道具", parts);
}

function candelabrum() {
  const parts = [part("烛台底座", "cylinder", brass, [0, 0.045, 0], [0.36, 0.09, 0.36]), part("烛台中柱", "cylinder", brass, [0, 0.29, 0], [0.065, 0.5, 0.065]), part("烛台横臂", "box", brass, [0, 0.44, 0], [0.72, 0.05, 0.055])];
  for (const x of [-0.34, 0, 0.34]) { parts.push(part("烛座", "cylinder", brass, [x, 0.55, 0], [0.15, 0.08, 0.15])); parts.push(part("蜡烛", "cylinder", "#eadfc5", [x, 0.76, 0], [0.065, 0.34, 0.065])); parts.push(part("烛火", "sphere", "#ffdc8a", [x, 0.98, 0], [0.055, 0.12, 0.055], [0, 0, 0], { emissive: "#ffbe64", emissiveIntensity: 1.1 })); }
  return european("Candelabrum", "三臂铜烛台", "道具", parts);
}

function grandfatherClock() {
  return european("GrandfatherClock", "古典落地摆钟", "道具", [part("摆钟底箱", "box", wood, [0, 0.28, 0], [0.68, 0.56, 0.4]), part("摆钟长箱", "box", oak, [0, 1.05, 0], [0.5, 1.5, 0.32]), part("前门玻璃", "box", "#49616b", [0, 1.1, 0.17], [0.34, 1.2, 0.025], [0, 0, 0], { opacity: 0.5 }), part("钟摆杆", "cylinder", brass, [0, 1.13, 0.2], [0.02, 1.05, 0.02]), part("钟摆盘", "cylinder", brass, [0, 0.63, 0.2], [0.23, 0.035, 0.23], [90, 0, 0]), part("钟面头箱", "box", wood, [0, 1.94, 0], [0.72, 0.65, 0.4]), part("白色钟盘", "cylinder", "#ded7c3", [0, 1.95, 0.22], [0.52, 0.03, 0.52], [90, 0, 0]), part("长钟针", "box", iron, [0, 2.05, 0.245], [0.02, 0.23, 0.015]), part("短钟针", "box", iron, [0.07, 1.98, 0.245], [0.17, 0.025, 0.015], [0, 0, 25]), part("钟顶冠檐", "box", oak, [0, 2.32, 0], [0.81, 0.12, 0.48])]);
}

function coatRack() {
  const parts = [part("衣帽架主杆", "cylinder", wood, [0, 0.88, 0], [0.07, 1.76, 0.07])];
  for (let index = 0; index < 4; index++) { const angle = index * Math.PI / 2, x = Math.cos(angle), z = Math.sin(angle); parts.push(beam("衣帽架脚", wood, [0, 0.2, 0], [x * 0.43, 0.04, z * 0.43], 0.065)); parts.push(beam("衣钩", wood, [0, 1.48, 0], [x * 0.32, 1.7, z * 0.32], 0.045)); parts.push(part("钩头圆珠", "sphere", wood, [x * 0.32, 1.73, z * 0.32], [0.09, 0.09, 0.09])); }
  return european("CoatRack", "木制衣帽架", "道具", parts);
}

function easel() {
  return european("Easel", "画家木制画架", "道具", [beam("画架左腿", wood, [-0.48, 0.025, 0.18], [-0.14, 1.8, 0], 0.07), beam("画架右腿", wood, [0.48, 0.025, 0.18], [0.14, 1.8, 0], 0.07), beam("画架后腿", wood, [0, 0.025, -0.6], [0, 1.67, 0], 0.06), part("承画横条", "box", oak, [0, 0.6, 0.15], [1.12, 0.08, 0.15]), part("画布木框", "box", oak, [0, 1.13, 0.1], [0.9, 1.05, 0.07]), part("空白画布", "box", "#e3dcc8", [0, 1.13, 0.145], [0.81, 0.96, 0.025]), part("画架上夹", "box", wood, [0, 1.72, 0.1], [0.3, 0.07, 0.12])]);
}

function piano() {
  const parts = [part("钢琴共鸣箱", "box", "#483b32", [0, 0.84, -0.12], [1.5, 1.45, 0.52]), part("钢琴顶盖", "box", wood, [0, 1.6, -0.12], [1.58, 0.09, 0.58]), part("键盘托台", "box", "#483b32", [0, 0.8, 0.28], [1.45, 0.13, 0.45]), ...legs(1.23, 0.42, 0.75, wood, 0.09)];
  for (let index = 0; index < 24; index++) { const x = -0.64 + index * 0.055; parts.push(part("白琴键", "box", "#e9e3d3", [x, 0.89, 0.32], [0.052, 0.025, 0.34])); if (![2, 6].includes(index % 7)) parts.push(part("黑琴键", "box", dark, [x + 0.025, 0.918, 0.21], [0.027, 0.03, 0.2])); }
  for (const x of [-0.18, 0, 0.18]) parts.push(part("踏板", "box", brass, [x, 0.14, 0.34], [0.08, 0.035, 0.22]));
  return european("Piano", "古典立式钢琴", "道具", parts);
}

function cello() {
  const parts = [part("大提琴下琴身", "sphere", "#9f5c34", [0, 0.54, 0], [0.51, 0.6, 0.19]), part("大提琴上琴身", "sphere", "#9f5c34", [0, 0.89, 0], [0.4, 0.45, 0.17]), part("琴颈", "box", "#6e4129", [0, 1.32, 0], [0.075, 0.72, 0.075]), part("黑色指板", "box", dark, [0, 1.14, 0.1], [0.065, 0.82, 0.025]), part("琴头", "sphere", wood, [0, 1.75, 0], [0.12, 0.17, 0.1]), part("尾柱", "cylinder", iron, [0, 0.13, 0], [0.022, 0.26, 0.022]), part("琴桥", "box", paleStone, [0, 0.68, 0.125], [0.19, 0.065, 0.035])];
  for (let index = 0; index < 4; index++) parts.push(part("琴弦", "cylinder", "#d1c6aa", [(index - 1.5) * 0.014, 0.97, 0.15], [0.003, 1.15, 0.003]));
  parts.push(beam("琴弓", wood, [0.32, 0.2, 0.04], [0.32, 1.55, 0.04], 0.015));
  return european("Cello", "木制大提琴", "道具", parts);
}

function wroughtBench() {
  const parts: ModelPart[] = [];
  for (const x of [-0.78, 0.78]) { parts.push(part("铸铁椅脚", "box", iron, [x, 0.25, 0], [0.1, 0.5, 0.55])); parts.push(part("卷曲扶手", "torus", iron, [x, 0.65, 0], [0.58, 0.58, 0.18], [0, 90, 0])); parts.push(beam("背架", iron, [x, 0.48, -0.2], [x, 1.08, -0.35], 0.055)); }
  for (let index = 0; index < 5; index++) parts.push(part("长椅座条", "box", oak, [0, 0.51, -0.25 + index * 0.125], [1.95, 0.065, 0.1]));
  for (const y of [0.77, 0.97]) parts.push(part("长椅背条", "box", oak, [0, y, -0.32], [1.95, 0.13, 0.055], [-12, 0, 0]));
  return european("WroughtBench", "铸铁花园长椅", "道具", parts);
}

function orchardTree() {
  const parts = [part("果树主干", "cylinder", wood, [0, 1.4, 0], [0.3, 2.8, 0.3])];
  for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3, x = Math.cos(angle) * 1.15, z = Math.sin(angle) * 1.15; parts.push(beam("果树分枝", wood, [0, 1.3, 0], [x, 2.7, z], 0.11)); parts.push(part("苹果树冠", "sphere", index % 2 ? "#74885b" : "#617a51", [x, 2.95, z], [2.05, 1.85, 2.05])); for (let fruit = 0; fruit < 3; fruit++) parts.push(part("苹果", "sphere", "#b75d46", [x + Math.cos(fruit * 2.1) * 0.6, 2.6 + fruit * 0.16, z + Math.sin(fruit * 2.1) * 0.6], [0.14, 0.15, 0.14])); }
  return european("OrchardTree", "果园苹果树", "自然", parts);
}

function topiary() {
  return european("Topiary", "花园修剪灌木", "自然", [part("石质方盆", "box", paleStone, [0, 0.28, 0], [0.78, 0.56, 0.78]), part("灌木主干", "cylinder", wood, [0, 1.05, 0], [0.08, 1.25, 0.08]), part("下层球冠", "sphere", "#567252", [0, 1.05, 0], [1.05, 0.85, 1.05]), part("中层球冠", "sphere", "#67805b", [0, 1.78, 0], [0.8, 0.72, 0.8]), part("顶层球冠", "sphere", "#789263", [0, 2.38, 0], [0.56, 0.56, 0.56])]);
}

function roseTrellis() {
  const path = Array.from({ length: 17 }, (_, index) => ({ x: Math.cos(Math.PI * index / 16) * 1.1, y: 1.9 + Math.sin(Math.PI * index / 16) * 1.1, z: 0 }));
  const parts: ModelPart[] = [];
  for (const z of [-0.3, 0.3]) { for (const x of [-1.1, 1.1]) parts.push(part("花架竖杆", "cylinder", iron, [x, 0.95, z], [0.055, 1.9, 0.055])); parts.push(part("花架圆拱", "tube", iron, [0, 0, z], [1, 1, 1], [0, 0, 0], { path, radius: 0.03 })); }
  for (let index = 0; index < 12; index++) { const angle = index * Math.PI / 11, x = Math.cos(angle) * 1.08, y = 1.9 + Math.sin(angle) * 1.08; parts.push(part("蔷薇叶簇", "sphere", "#62795b", [x, y, 0], [0.48, 0.4, 0.7])); parts.push(part("蔷薇花", "sphere", index % 2 ? "#b97986" : "#d2a1a4", [x, y + 0.1, 0.34], [0.17, 0.16, 0.12])); }
  return european("RoseTrellis", "蔷薇拱架", "自然", parts);
}

function haystack() {
  return european("Haystack", "农庄干草垛", "自然", [part("干草主体", "sphere", "#bda366", [0, 0.75, 0], [2.3, 1.5, 1.8]), part("干草尖顶", "cone", "#c6af74", [0, 1.55, 0], [1.65, 1.1, 1.45]), part("草垛中心木桩", "cylinder", wood, [0, 1.1, 0], [0.09, 2.2, 0.09]), ...[-0.55, 0, 0.55].map(x => part("捆草绳", "torus", "#8b774d", [x, 0.9, 0], [1.35, 1.75, 0.08], [0, 90, 0]))]);
}

function grindstone() {
  return european("Grindstone", "手摇石磨轮", "道具", [...legs(0.85, 0.5, 0.68, wood, 0.11), part("磨轮横轴", "cylinder", iron, [0, 0.88, 0], [0.08, 1.1, 0.08], [0, 0, 90]), part("圆形砂轮", "cylinder", "#97968d", [0, 0.88, 0], [0.95, 0.2, 0.95], [0, 0, 90]), part("曲柄", "box", iron, [0.6, 0.76, 0], [0.06, 0.3, 0.07]), part("摇把木柄", "cylinder", oak, [0.72, 0.61, 0], [0.08, 0.24, 0.08], [0, 0, 90]), part("接水木槽", "box", wood, [0, 0.35, 0], [0.7, 0.2, 0.62])]);
}

const europeanAssets = [
  halfTimberHouse(), cottage(), watchtower(), windmill(), castleTurret(), stoneBridge(), marketStall(), bellTower(), pergola(), conservatory(),
  victorianLamp(), ironGate(), balustrade(), gardenUrn(), birdbath(), sundial(), parkFountain(), streetClock(), postBox(), carriage(), wheelbarrow(), barrel(), treasureChest(), wineRack(),
  banquetTable(), diningChair(), armchair(), chaiseLongue(), canopyBed(), wardrobe(), bookcase(), secretaryDesk(), fireplace(), chandelier(), candelabrum(), grandfatherClock(), coatRack(), easel(), piano(), cello(), wroughtBench(),
  orchardTree(), topiary(), roseTrellis(), haystack(), grindstone(),
];

function apartmentBlock() {
  const parts = [part("公寓结构", "box", "#bcb6a8", [0, 6, 0], [9, 12, 6]), part("平屋顶女儿墙", "box", concrete, [0, 12.1, 0], [9.3, 0.3, 6.3]), ...windows(4, 4, 1.85, 1.5, 3.025), part("入口玻璃门", "box", dark, [0, 1.15, 3.06], [1.2, 2.3, 0.08]), part("入口雨棚", "box", steel, [0, 2.7, 3.5], [2.3, 0.12, 1.2])];
  for (let level = 1; level < 4; level++) for (const x of [-3, 3]) { const y = level * 2.7 + 0.45; parts.push(part("阳台挑板", "box", concrete, [x, y, 3.45], [1.8, 0.15, 1.05])); parts.push(part("阳台护栏", "box", steel, [x, y + 0.58, 3.95], [1.8, 0.95, 0.055])); }
  return modern("ApartmentBlock", "城市公寓楼", "建筑", parts);
}

function officeTower() {
  const parts = [part("办公楼体", "box", "#566c79", [0, 10.7, 0], [7.8, 21.4, 6]), part("楼顶机房", "box", concrete, [0.8, 22, -0.8], [3.4, 1.2, 2.8]), ...windows(5, 7, 1.4, 1.5, 3.035, "#8dacb9"), part("入口大厅", "box", glass, [0, 1.7, 3.12], [3.4, 3.4, 0.12], [0, 0, 0], { roughness: 0.18, opacity: 0.7 })];
  for (let index = 0; index < 7; index++) parts.push(part("横向幕墙压条", "box", steel, [0, 2.7 + index * 2.7, 3.07], [7.9, 0.12, 0.1]));
  for (const x of [-3.85, -2.1, 0, 2.1, 3.85]) parts.push(part("竖向幕墙压条", "box", steel, [x, 10.7, 3.08], [0.1, 21.4, 0.1]));
  return modern("OfficeTower", "玻璃幕墙办公楼", "建筑", parts);
}

function retailShop() {
  return modern("RetailShop", "街角便利店", "建筑", [part("商店外墙", "box", "#c8c3b5", [0, 1.55, 0], [6.4, 3.1, 4.6]), part("平顶压檐", "box", concrete, [0, 3.18, 0], [6.7, 0.18, 4.9]), part("前玻璃橱窗", "box", glass, [-1.15, 1.5, 2.34], [3.7, 2.1, 0.05], [0, 0, 0], { roughness: 0.15 }), part("自动玻璃门", "box", "#668b99", [1.9, 1.27, 2.35], [1.4, 2.5, 0.06]), part("店头招牌", "box", "#5f8b7e", [0, 2.86, 2.5], [6.6, 0.5, 0.22]), part("门前雨棚", "box", "#d3d9be", [0, 2.52, 2.8], [6.7, 0.12, 1.05]), part("台阶", "box", concrete, [0, 0.08, 2.65], [6.6, 0.16, 0.8])]);
}

function warehouse() {
  const parts = [part("仓库墙体", "box", "#9ca9a8", [0, 2.8, 0], [12, 5.6, 9]), { ...pitchedRoof("仓库折板屋顶", steel, 12.5, 9.5, 5.65), scale: { x: 1, y: 2, z: 1 } }, part("装卸月台", "box", concrete, [0, 0.45, 4.8], [8, 0.9, 1.4]), part("卷帘门底色", "box", dark, [0, 2.45, 4.54], [4.6, 3.1, 0.08])];
  for (let index = 0; index < 13; index++) parts.push(part("卷帘门横片", "box", steel, [0, 0.99 + index * 0.23, 4.61], [4.45, 0.19, 0.06]));
  for (const x of [-4.2, 4.2]) parts.push(part("仓库高窗", "box", glass, [x, 4.3, 4.54], [1.4, 0.7, 0.05]));
  return modern("Warehouse", "物流装卸仓库", "建筑", parts);
}

function fuelStation() {
  const parts = [...legs(5.4, 3.4, 3.8, concrete, 0.24), part("加油站顶棚", "box", "#d8d7ca", [0, 3.88, 0], [7, 0.3, 5]), part("顶棚色带", "box", "#608d83", [0, 3.92, 2.53], [7, 0.24, 0.04]), part("加油岛", "box", concrete, [0, 0.11, 0], [4.4, 0.22, 1.3])];
  for (const x of [-1.25, 1.25]) { parts.push(part("加油机", "box", "#c8d0ca", [x, 0.95, 0], [0.64, 1.7, 0.48])); parts.push(part("计量屏", "box", dark, [x, 1.41, 0.25], [0.43, 0.3, 0.025])); parts.push(part("油枪软管", "tube", dark, [x, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.025, path: [{ x: 0.34, y: 1.5, z: 0 }, { x: 0.65, y: 1.2, z: 0 }, { x: 0.65, y: 0.35, z: 0 }, { x: 0.4, y: 0.55, z: 0 }] })); }
  return modern("FuelStation", "城市加油站", "建筑", parts);
}

function trainPlatform() {
  const parts = [part("站台基体", "box", concrete, [0, 0.35, 0], [10, 0.7, 3]), part("站台警示线", "box", "#cbb866", [0, 0.71, 1.28], [9.8, 0.02, 0.25]), part("站台雨棚", "box", steel, [0, 3.4, -0.1], [9.5, 0.13, 3.4]), part("候车座椅", "box", "#84998f", [0, 1.25, -0.8], [2.6, 0.13, 0.48]), ...legs(2.1, 0.3, 1.2, steel, 0.08)];
  for (const x of [-4, 0, 4]) parts.push(part("雨棚支柱", "box", steel, [x, 2.05, -1], [0.15, 2.7, 0.15]));
  parts.push(part("站台信息牌", "box", dark, [0, 2.8, -1.07], [2.4, 0.4, 0.1]), part("站台阶梯", "box", concrete, [-4.75, 0.15, -1.9], [0.5, 0.3, 0.8]));
  return modern("TrainPlatform", "轻轨候车站台", "建筑", parts);
}

function pedestrianBridge() {
  const parts = [part("天桥桥面", "box", concrete, [0, 3.25, 0], [8, 0.28, 2.2]), ...legs(6.6, 1.55, 3.2, concrete, 0.35)];
  for (const z of [-1.02, 1.02]) { parts.push(part("天桥扶手", "box", steel, [0, 4.22, z], [8.2, 0.09, 0.08])); for (let index = 0; index < 13; index++) parts.push(part("天桥栏杆", "box", steel, [-3.8 + index * 0.63, 3.76, z], [0.045, 0.9, 0.05])); }
  for (const side of [-1, 1]) for (let step = 0; step < 10; step++) parts.push(part("楼梯踏步", "box", concrete, [side * (4.1 + step * 0.35), 3.1 - step * 0.31, 0], [0.38, 0.25, 2]));
  return modern("PedestrianBridge", "城市人行天桥", "建筑", parts);
}

function trafficLight() {
  const parts = [part("信号灯底座", "box", concrete, [0, 0.16, 0], [0.65, 0.32, 0.65]), part("信号灯立杆", "cylinder", steel, [0, 2.5, 0], [0.14, 5, 0.14]), part("悬臂横杆", "cylinder", steel, [1.45, 4.9, 0], [0.12, 3.1, 0.12], [0, 0, 90]), part("信号灯壳", "box", dark, [2.72, 4.3, 0], [0.4, 1.14, 0.32])];
  for (const [index, color] of ["#b65a51", "#c3ad61", "#73a38b"].entries()) parts.push(part("交通灯面", "cylinder", color, [2.72, 4.65 - index * 0.35, 0.18], [0.25, 0.025, 0.25], [90, 0, 0], { emissive: color, emissiveIntensity: index === 2 ? 0.9 : 0.12 }));
  return modern("TrafficLight", "道路交通信号灯", "道具", parts);
}

function cityBus() {
  const parts = [part("公交车底盘", "box", dark, [0, 0.6, 0], [2.5, 0.35, 9]), part("公交车身", "box", "#71958b", [0, 1.65, 0], [2.48, 2.05, 8.9]), part("公交车顶", "box", "#d4d9d3", [0, 2.78, 0], [2.5, 0.2, 8.9]), part("前挡风玻璃", "box", glass, [0, 2, 4.49], [2.14, 1.2, 0.05]), part("车头灯", "box", "#e4d5a6", [0, 1, 4.5], [2.08, 0.2, 0.04]), part("后挡风玻璃", "box", glass, [0, 2.06, -4.49], [2.1, 0.95, 0.05]), ...carWheels(1.22, 0.51, [-2.8, 2.8], 0.5, 0.29)];
  for (const x of [-1.26, 1.26]) for (let index = 0; index < 7; index++) parts.push(part("公交侧窗", "box", glass, [x, 2.09, -3.6 + index * 1.16], [0.045, 0.95, 1.02]));
  parts.push(part("公交双开门", "box", dark, [1.285, 1.52, 3.45], [0.055, 1.85, 0.85]), part("车顶空调", "box", steel, [0, 2.98, -1], [1.7, 0.25, 1.9]));
  return modern("CityBus", "城市公交车", "道具", parts);
}

function sedan() {
  return modern("Sedan", "城市四门轿车", "道具", [part("轿车底盘", "box", dark, [0, 0.4, 0], [1.8, 0.24, 4.2]), part("车身腰线", "box", "#778b9a", [0, 0.7, 0], [1.85, 0.5, 4.25]), part("乘员舱", "box", "#778b9a", [0, 1.1, -0.08], [1.55, 0.52, 2.2]), part("前挡风玻璃", "box", glass, [0, 1.09, 1.07], [1.42, 0.53, 0.05], [-28, 0, 0]), part("后挡风玻璃", "box", glass, [0, 1.08, -1.2], [1.42, 0.47, 0.05], [28, 0, 0]), ...[-0.8, 0.8].map(x => part("侧窗", "box", glass, [x, 1.13, -0.04], [0.035, 0.36, 1.78])), ...carWheels(0.87, 0.33, [-1.35, 1.35], 0.32, 0.22), ...[-0.65, 0.65].map(x => part("前车灯", "box", "#e2dfbc", [x, 0.72, 2.15], [0.46, 0.17, 0.035]))]);
}

function deliveryVan() {
  return modern("DeliveryVan", "厢式配送货车", "道具", [part("货车底盘", "box", dark, [0, 0.48, 0], [2.05, 0.25, 4.9]), part("封闭货厢", "box", "#d6d9ce", [0, 1.48, -0.7], [2.08, 1.85, 3.2]), part("驾驶室", "box", "#688f88", [0, 1.25, 1.55], [2.02, 1.4, 1.5]), part("驾驶室前窗", "box", glass, [0, 1.56, 2.32], [1.74, 0.78, 0.05]), ...[-1.03, 1.03].map(x => part("驾驶室侧窗", "box", glass, [x, 1.56, 1.6], [0.04, 0.72, 1.05])), ...carWheels(0.99, 0.4, [-1.6, 1.55], 0.39, 0.25), ...[-0.51, 0.51].map(x => part("货厢后门", "box", "#c5cbc6", [x, 1.48, -2.32], [0.97, 1.7, 0.05]))]);
}

function bicycle() {
  const parts: ModelPart[] = [];
  for (const x of [-0.65, 0.65]) { parts.push(part("自行车轮胎", "torus", dark, [x, 0.36, 0], [0.7, 0.7, 0.16])); for (let index = 0; index < 6; index++) parts.push(part("车轮辐条", "box", steel, [x, 0.36, 0], [0.012, 0.63, 0.012], [0, 0, index * 30])); }
  for (const [start, end] of [[[ -0.65, 0.36, 0], [-0.1, 0.42, 0]], [[-0.65, 0.36, 0], [-0.25, 0.92, 0]], [[-0.25, 0.92, 0], [-0.1, 0.42, 0]], [[-0.25, 0.92, 0], [0.45, 0.92, 0]], [[-0.1, 0.42, 0], [0.45, 0.92, 0]], [[0.45, 0.92, 0], [0.65, 0.36, 0]]] as [Triple, Triple][]) parts.push(beam("自行车车架", "#9e6253", start, end, 0.04));
  parts.push(part("自行车坐垫", "box", dark, [-0.26, 1.01, 0], [0.28, 0.07, 0.17]), part("自行车把手", "cylinder", iron, [0.45, 1.1, 0], [0.035, 0.49, 0.035], [90, 0, 0]), beam("车把立杆", steel, [0.45, 0.9, 0], [0.45, 1.1, 0], 0.035), part("链盘", "cylinder", steel, [-0.1, 0.42, 0.045], [0.23, 0.035, 0.23], [90, 0, 0]));
  return modern("Bicycle", "城市通勤自行车", "道具", parts);
}

function scooter() {
  return modern("Scooter", "电动滑板车", "道具", [part("滑板车踏板", "box", dark, [0, 0.22, 0], [0.95, 0.09, 0.2]), ...[-0.44, 0.44].map(x => part("滑板车轮", "cylinder", dark, [x, 0.13, 0], [0.25, 0.075, 0.25], [90, 0, 0])), beam("滑板车立杆", steel, [0.43, 0.2, 0], [0.34, 1.17, 0], 0.045), part("滑板车把手", "cylinder", iron, [0.34, 1.18, 0], [0.04, 0.46, 0.04], [90, 0, 0]), part("前轮挡泥板", "box", steel, [0.44, 0.28, 0], [0.26, 0.045, 0.13]), part("车载电池", "box", "#637c7c", [0, 0.14, 0], [0.62, 0.08, 0.17])]);
}

function bollard() {
  return modern("Bollard", "道路防撞柱", "道具", [part("防撞柱底盘", "cylinder", steel, [0, 0.035, 0], [0.35, 0.07, 0.35]), part("防撞柱杆", "cylinder", "#6f7d84", [0, 0.5, 0], [0.17, 0.94, 0.17]), part("柱头", "sphere", "#7c8a91", [0, 0.97, 0], [0.18, 0.12, 0.18]), ring("反光色环", "#d4c28a", 0.089, 0.008, 0.77, 0.09)]);
}

function bikeRack() {
  const parts = [part("车架底梁", "box", steel, [0, 0.045, 0], [2.5, 0.09, 0.48])];
  for (let index = 0; index < 5; index++) parts.push(part("U形锁车架", "tube", steel, [-1 + index * 0.5, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.028, path: [{ x: 0, y: 0.04, z: -0.2 }, { x: 0, y: 0.7, z: -0.2 }, { x: 0, y: 0.84, z: 0 }, { x: 0, y: 0.7, z: 0.2 }, { x: 0, y: 0.04, z: 0.2 }] }));
  return modern("BikeRack", "自行车停放架", "道具", parts);
}

function parkingMeter() {
  return modern("ParkingMeter", "路边停车计时器", "道具", [part("计时器底座", "cylinder", concrete, [0, 0.06, 0], [0.3, 0.12, 0.3]), part("计时器立杆", "cylinder", steel, [0, 0.7, 0], [0.07, 1.3, 0.07]), part("计时器机头", "box", "#7b8b86", [0, 1.48, 0], [0.34, 0.52, 0.2]), part("计时器显示窗", "box", dark, [0, 1.59, 0.11], [0.22, 0.16, 0.02]), part("缴费按钮", "cylinder", brass, [0.08, 1.4, 0.12], [0.06, 0.025, 0.06], [90, 0, 0]), part("硬币槽", "box", dark, [-0.07, 1.38, 0.12], [0.07, 0.015, 0.02])]);
}

function fireHydrant() {
  return modern("FireHydrant", "道路消防栓", "道具", [part("消防栓底座", "cylinder", iron, [0, 0.07, 0], [0.46, 0.14, 0.46]), part("栓体", "cylinder", "#a75247", [0, 0.44, 0], [0.3, 0.7, 0.3]), part("栓顶", "sphere", "#b35f4f", [0, 0.83, 0], [0.36, 0.2, 0.36]), part("侧向出水管", "cylinder", "#a75247", [0, 0.55, 0], [0.2, 0.63, 0.2], [0, 0, 90]), ...[-0.34, 0.34].map(x => part("出水口旋盖", "cylinder", brass, [x, 0.55, 0], [0.24, 0.1, 0.24], [0, 0, 90])), part("顶端阀螺母", "cylinder", iron, [0, 0.96, 0], [0.12, 0.09, 0.12])]);
}

function trashBin() {
  const parts: ModelPart[] = [];
  for (const [index, color] of ["#668e8b", "#8c9469", "#9c7c69"].entries()) { const x = (index - 1) * 0.55; parts.push(part("分类桶身", "box", color, [x, 0.45, 0], [0.49, 0.9, 0.48])); parts.push(part("分类桶盖", "box", dark, [x, 0.95, 0], [0.53, 0.1, 0.52])); parts.push(part("投放口", "box", dark, [x, 0.78, 0.25], [0.3, 0.12, 0.025])); parts.push(part("分类标牌", "box", "#dce0ce", [x, 0.52, 0.25], [0.2, 0.18, 0.025])); }
  return modern("TrashBin", "三分类垃圾桶", "道具", parts);
}

function recyclingStation() {
  const parts = [...legs(3.2, 1.3, 2.3, steel, 0.1), part("回收站雨棚", "box", "#78978b", [0, 2.35, 0], [3.7, 0.15, 1.7]), part("回收站地台", "box", concrete, [0, 0.07, 0], [3.7, 0.14, 1.8])];
  for (const x of [-0.85, 0.85]) { parts.push(part("大型回收箱", "box", "#74897e", [x, 0.75, 0], [1.3, 1.3, 1.1])); parts.push(part("斜面投放盖", "box", "#98a691", [x, 1.43, 0], [1.37, 0.13, 1.18], [-8, 0, 0])); parts.push(part("圆形回收口", "cylinder", dark, [x, 1.05, 0.57], [0.35, 0.03, 0.35], [90, 0, 0])); }
  return modern("RecyclingStation", "社区回收站点", "道具", parts);
}

function vendingMachine() {
  const parts = [part("售货机柜体", "box", "#647e8d", [0, 0.96, 0], [1.1, 1.92, 0.77]), part("商品展示窗", "box", dark, [-0.1, 1.17, 0.4], [0.75, 1.18, 0.04]), part("取货口", "box", dark, [-0.08, 0.3, 0.41], [0.75, 0.25, 0.03]), part("支付面板", "box", "#b4c1bc", [0.43, 1.15, 0.41], [0.15, 0.55, 0.04])];
  for (let row = 0; row < 3; row++) for (let column = 0; column < 4; column++) parts.push(part("饮料罐", "cylinder", ["#bc8a5e", "#8ba38a", "#9f7384"][column % 3]!, [-0.36 + column * 0.17, 0.78 + row * 0.32, 0.43], [0.11, 0.23, 0.11]));
  return modern("VendingMachine", "饮料自动售货机", "道具", parts);
}

function parcelLocker() {
  const parts = [part("快递柜框体", "box", "#8c9b91", [0, 1, 0], [3.1, 2, 0.65]), part("快递柜操作屏", "box", dark, [0, 1.3, 0.35], [0.35, 0.5, 0.04])];
  for (const side of [-1, 1]) for (let row = 0; row < 4; row++) for (let column = 0; column < 3; column++) { const x = side * (0.42 + column * 0.41), y = 0.28 + row * 0.48; parts.push(part("独立柜门", "box", "#bdc7b7", [x, y, 0.345], [0.38, 0.44, 0.035])); parts.push(part("柜门锁", "box", dark, [x + 0.12, y, 0.37], [0.045, 0.08, 0.02])); }
  return modern("ParcelLocker", "社区智能快递柜", "道具", parts);
}

function atm() {
  return modern("Atm", "银行自助ATM", "道具", [part("ATM主柜", "box", "#6a8580", [0, 0.95, 0], [0.9, 1.9, 0.75]), part("操作面板", "box", steel, [0, 1.28, 0.43], [0.8, 0.85, 0.13], [-12, 0, 0]), part("ATM显示屏", "box", dark, [0, 1.51, 0.48], [0.55, 0.36, 0.035], [-12, 0, 0]), part("键盘台", "box", "#b7c4c5", [-0.12, 1.08, 0.5], [0.31, 0.05, 0.25]), part("出钞口", "box", dark, [0, 0.79, 0.39], [0.45, 0.075, 0.025]), part("读卡口", "box", dark, [0.27, 1.22, 0.5], [0.12, 0.04, 0.04]), part("顶置遮光檐", "box", steel, [0, 1.96, 0.15], [1.02, 0.1, 0.9])]);
}

function chargingStation() {
  return modern("ChargingStation", "电动汽车充电桩", "道具", [part("充电桩底座", "box", concrete, [0, 0.08, 0], [0.85, 0.16, 0.65]), part("充电桩主体", "box", "#b2c7be", [0, 0.94, 0], [0.58, 1.75, 0.35]), part("充电显示屏", "box", dark, [0, 1.43, 0.19], [0.36, 0.35, 0.025]), part("充电状态灯", "box", "#9de1c0", [0, 1.75, 0.19], [0.34, 0.045, 0.025], [0, 0, 0], { emissive: "#70b998", emissiveIntensity: 0.9 }), part("充电电缆", "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.025, path: [{ x: 0.3, y: 1.4, z: 0 }, { x: 0.62, y: 1.2, z: 0.1 }, { x: 0.6, y: 0.36, z: 0.14 }, { x: 0.34, y: 0.5, z: 0.18 }, { x: 0.34, y: 1.1, z: 0.2 }] }), part("充电枪", "box", dark, [0.35, 1.14, 0.2], [0.1, 0.22, 0.12])]);
}

function informationKiosk() {
  const parts = [part("信息屏底座", "box", steel, [0, 0.05, 0], [1.15, 0.1, 0.75]), part("信息屏立柱", "box", iron, [0, 0.59, 0], [0.3, 1.1, 0.22]), part("户外屏框", "box", iron, [0, 1.56, 0], [1.15, 1.65, 0.18]), part("户外显示屏", "box", "#8bb5c4", [0, 1.56, 0.105], [1, 1.48, 0.025], [0, 0, 0], { emissive: "#426e84", emissiveIntensity: 0.4 })];
  for (let row = 0; row < 5; row++) parts.push(part("导览信息条", "box", "#dce2d3", [0, 1.95 - row * 0.22, 0.124], [0.67 - row % 2 * 0.18, 0.06, 0.012]));
  return modern("InformationKiosk", "电子导览信息屏", "道具", parts);
}

function securityCamera() {
  return modern("SecurityCamera", "道路监控立杆", "道具", [part("监控杆底座", "box", concrete, [0, 0.12, 0], [0.6, 0.24, 0.6]), part("监控立杆", "cylinder", steel, [0, 2.6, 0], [0.12, 5.2, 0.12]), part("摄像头横臂", "box", steel, [0.45, 5.05, 0], [1.05, 0.08, 0.1]), part("摄像机外壳", "box", "#bac6c7", [0.9, 4.97, 0.15], [0.2, 0.19, 0.5], [15, 0, 0]), part("摄像机镜头", "cylinder", dark, [0.9, 4.91, 0.41], [0.12, 0.07, 0.12], [105, 0, 0]), part("检修机箱", "box", "#9daaa5", [0.12, 1.3, 0], [0.25, 0.45, 0.22])]);
}

function barrierGate() {
  const parts = [part("道闸机箱", "box", "#9daaa1", [-1.7, 0.65, 0], [0.45, 1.3, 0.42]), part("抬杆轴", "cylinder", steel, [-1.55, 1.05, 0.25], [0.2, 0.14, 0.2], [90, 0, 0]), part("道闸横杆", "box", "#dddcc8", [0.1, 1.05, 0.25], [3.5, 0.13, 0.1]), part("道闸末端支架", "box", steel, [1.75, 0.53, 0.25], [0.1, 1.06, 0.12])];
  for (let index = 0; index < 8; index++) parts.push(part("道闸反光条", "box", "#ad6c52", [-1.2 + index * 0.4, 1.05, 0.307], [0.18, 0.13, 0.018]));
  return modern("BarrierGate", "停车场自动道闸", "道具", parts);
}

function shippingContainer() {
  const parts = [part("集装箱箱体", "box", "#78928a", [0, 1.3, 0], [2.44, 2.6, 6.06]), part("集装箱顶板", "box", "#93a59a", [0, 2.62, 0], [2.46, 0.08, 6.08])];
  for (const x of [-1.23, 1.23]) for (let index = 0; index < 20; index++) parts.push(part("侧壁加强波纹", "box", "#648077", [x, 1.33, -2.85 + index * 0.3], [0.06, 2.35, 0.09]));
  for (const x of [-0.61, 0.61]) { parts.push(part("集装箱门", "box", "#82988c", [x, 1.33, 3.06], [1.17, 2.45, 0.06])); for (const offset of [-0.37, 0.37]) parts.push(part("门锁杆", "cylinder", steel, [x + offset, 1.33, 3.11], [0.035, 2.32, 0.035])); }
  return modern("ShippingContainer", "标准物流集装箱", "道具", parts);
}

function forklift() {
  const parts = [part("叉车底盘", "box", "#b49c5e", [0, 0.56, 0], [1.15, 0.4, 2]), part("后配重块", "box", "#ad9251", [0, 0.99, -0.65], [1.12, 0.7, 0.64]), part("司机座垫", "box", dark, [0, 1.13, -0.18], [0.5, 0.13, 0.48]), part("司机靠背", "box", dark, [0, 1.46, -0.41], [0.52, 0.64, 0.13]), part("安全顶棚", "box", dark, [0, 2.12, -0.06], [1.2, 0.1, 1.35]), ...carWheels(0.58, 0.31, [-0.68, 0.7], 0.3, 0.18)];
  for (const x of [-0.48, 0.48]) { parts.push(part("安全顶架", "box", dark, [x, 1.48, -0.6], [0.06, 1.25, 0.06])); parts.push(part("升降门架", "box", dark, [x, 1.32, 1.04], [0.09, 2.5, 0.12])); parts.push(part("货叉竖段", "box", steel, [x * 0.65, 0.65, 1.12], [0.1, 0.9, 0.1])); parts.push(part("货叉水平段", "box", steel, [x * 0.65, 0.24, 1.7], [0.13, 0.07, 1.25])); }
  return modern("Forklift", "仓储电动叉车", "道具", parts);
}

function pallet() {
  const parts: ModelPart[] = [];
  for (let index = 0; index < 7; index++) parts.push(part("托盘顶板", "box", oak, [-0.52 + index * 0.174, 0.16, 0], [0.13, 0.045, 1]));
  for (const x of [-0.48, 0, 0.48]) { parts.push(part("托盘底梁", "box", wood, [x, 0.025, 0], [0.14, 0.05, 1])); for (const z of [-0.4, 0, 0.4]) parts.push(part("托盘垫块", "box", wood, [x, 0.09, z], [0.14, 0.1, 0.15])); }
  return modern("Pallet", "仓储木制托盘", "道具", parts);
}

function cableReel() {
  return modern("CableReel", "工业电缆盘", "道具", [part("电缆卷芯", "cylinder", dark, [0, 0.75, 0], [1.15, 0.72, 1.15], [0, 0, 90]), ...[-0.42, 0.42].flatMap(x => [part("木制卷盘侧板", "cylinder", oak, [x, 0.75, 0], [1.5, 0.1, 1.5], [0, 0, 90]), part("卷盘轴孔", "cylinder", dark, [x * 1.14, 0.75, 0], [0.2, 0.035, 0.2], [0, 0, 90])]), part("散出电缆", "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.022, path: [{ x: 0, y: 0.19, z: 0.2 }, { x: 0, y: 0.03, z: 0.9 }, { x: 0.4, y: 0.03, z: 1.4 }, { x: 0.85, y: 0.03, z: 1.25 }] })]);
}

function transformer() {
  const parts = [part("变压器基础", "box", concrete, [0, 0.12, 0], [1.8, 0.24, 1.2]), part("变压器油箱", "box", "#81918a", [0, 0.88, 0], [1.2, 1.3, 0.8]), part("变压器顶盖", "box", steel, [0, 1.58, 0], [1.35, 0.1, 0.95])];
  for (const x of [-0.7, 0.7]) for (let index = 0; index < 8; index++) parts.push(part("冷却散热片", "box", "#6f8279", [x, 0.9, -0.34 + index * 0.1], [0.2, 1.1, 0.035]));
  for (const x of [-0.4, 0, 0.4]) { parts.push(part("高压绝缘柱", "cylinder", "#aa8e73", [x, 1.83, 0], [0.1, 0.45, 0.1])); for (let index = 0; index < 3; index++) parts.push(part("绝缘伞裙", "cylinder", "#baa385", [x, 1.7 + index * 0.12, 0], [0.23, 0.055, 0.23])); }
  return modern("Transformer", "配电变压器", "道具", parts);
}

function hvacUnit() {
  const parts = [part("空调外机机壳", "box", "#c7d0c9", [0, 0.52, 0], [1.25, 0.9, 0.48]), part("风扇黑色底盘", "cylinder", dark, [-0.16, 0.53, 0.26], [0.68, 0.03, 0.68], [90, 0, 0]), part("风扇轮毂", "cylinder", steel, [-0.16, 0.53, 0.3], [0.14, 0.04, 0.14], [90, 0, 0]), ...legs(1.05, 0.32, 0.1, steel, 0.08)];
  for (let index = 0; index < 5; index++) parts.push(part("空调风叶", "box", steel, [-0.16, 0.53, 0.29], [0.11, 0.57, 0.025], [0, 0, index * 36]));
  for (let index = 0; index < 7; index++) parts.push(part("散热条孔", "box", "#87958d", [0.43, 0.26 + index * 0.08, 0.25], [0.19, 0.025, 0.02]));
  return modern("HvacUnit", "空调室外机", "道具", parts);
}

function generator() {
  const parts = [part("发电机机座", "box", dark, [0, 0.11, 0], [1.85, 0.22, 1.05]), part("静音发电机罩", "box", "#8c9e81", [0, 0.75, 0], [1.7, 1.1, 0.94]), part("控制屏", "box", dark, [-0.45, 0.95, 0.49], [0.4, 0.27, 0.03]), part("排气管", "cylinder", steel, [0.58, 1.5, -0.2], [0.09, 0.55, 0.09]), part("排气消声罐", "cylinder", dark, [0.58, 1.56, -0.2], [0.2, 0.28, 0.2])];
  for (let index = 0; index < 10; index++) parts.push(part("进气百叶", "box", dark, [0.33, 0.4 + index * 0.07, 0.49], [0.65, 0.025, 0.02]));
  return modern("Generator", "静音柴油发电机", "道具", parts);
}

function solarArray() {
  const parts = [...legs(2.1, 1.25, 0.75, steel, 0.07), part("太阳能板金属框", "box", steel, [0, 1.1, 0], [2.5, 0.075, 1.7], [-25, 0, 0]), part("光伏电池面", "box", "#3d5b78", [0, 1.15, -0.02], [2.4, 0.025, 1.6], [-25, 0, 0], { metalness: 0.4, roughness: 0.2 })];
  for (let index = 0; index < 7; index++) parts.push(part("电池纵分隔线", "box", "#8cacc0", [-1.13 + index * 0.377, 1.17, -0.02], [0.012, 0.012, 1.59], [-25, 0, 0]));
  for (const z of [-0.4, 0, 0.4]) parts.push(part("电池横分隔线", "box", "#8cacc0", [0, 1.17 + z * 0.423, z - 0.02], [2.4, 0.012, 0.012], [-25, 0, 0]));
  return modern("SolarArray", "太阳能光伏板架", "道具", parts);
}

function windTurbine() {
  const parts = [part("风机基础", "cylinder", concrete, [0, 0.2, 0], [2.2, 0.4, 2.2]), part("风机锥形塔筒", "lathe", "#c4ceca", [0, 0.25, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.38, y: 0 }, { x: 0.2, y: 10.2 }, { x: 0, y: 10.2 }] }), part("风机机舱", "capsule", "#c4ceca", [0, 10.45, -0.1], [0.8, 1.6, 0.8], [90, 0, 0]), part("风机轮毂", "sphere", "#dbe0d7", [0, 10.45, 0.92], [0.58, 0.58, 0.58])];
  for (let index = 0; index < 3; index++) parts.push(part("风机叶片", "extrude", "#d6ded6", [0, 10.45, 1.02], [1, 1, 1], [0, 0, index * 120], { depth: 0.07, profile: [{ x: -0.12, y: 0.15 }, { x: -0.25, y: 1.3 }, { x: -0.1, y: 3.9 }, { x: 0.04, y: 4.1 }, { x: 0.17, y: 1.2 }, { x: 0.12, y: 0.15 }] }));
  return modern("WindTurbine", "小型风力发电机", "道具", parts);
}

function modularSofa() {
  return modern("ModularSofa", "三座模块沙发", "道具", [...legs(2, 0.62, 0.12, dark, 0.08), part("沙发底座", "box", "#7a8984", [0, 0.27, 0], [2.4, 0.3, 0.9]), part("沙发靠背", "box", "#7a8984", [0, 0.72, -0.36], [2.4, 0.7, 0.22]), ...[-1.13, 1.13].map(x => part("沙发扶手", "box", "#87958b", [x, 0.55, 0], [0.22, 0.55, 0.95])), ...[-0.69, 0, 0.69].map(x => part("独立沙发座垫", "box", "#9ba89a", [x, 0.48, 0.06], [0.66, 0.18, 0.7]))]);
}

function coffeeTable() {
  return modern("CoffeeTable", "玻璃金属茶几", "道具", [part("茶几玻璃台面", "box", "#bdd5d1", [0, 0.45, 0], [1.2, 0.045, 0.65], [0, 0, 0], { opacity: 0.48, roughness: 0.12 }), ...legs(1, 0.45, 0.43, steel, 0.04), part("茶几下层板", "box", "#71828c", [0, 0.14, 0], [1.05, 0.035, 0.5]), part("桌面圆盘", "cylinder", "#d1cbbb", [0.27, 0.49, 0], [0.25, 0.025, 0.25])]);
}

function swivelChair() {
  const parts = [part("办公椅气杆", "cylinder", steel, [0, 0.28, 0], [0.065, 0.45, 0.065]), part("办公椅座垫", "box", "#586e77", [0, 0.51, 0], [0.55, 0.13, 0.55]), part("办公椅靠背", "box", "#586e77", [0, 0.88, -0.24], [0.5, 0.67, 0.12], [-10, 0, 0])];
  for (let index = 0; index < 5; index++) { const angle = index * Math.PI * 2 / 5, x = Math.cos(angle) * 0.31, z = Math.sin(angle) * 0.31; parts.push(beam("五星椅脚", steel, [0, 0.18, 0], [x, 0.09, z], 0.04)); parts.push(part("椅脚脚轮", "sphere", dark, [x, 0.055, z], [0.09, 0.11, 0.09])); }
  for (const x of [-0.31, 0.31]) { parts.push(part("扶手支杆", "box", steel, [x, 0.6, 0], [0.04, 0.27, 0.04])); parts.push(part("办公椅扶手", "box", dark, [x, 0.75, 0], [0.08, 0.055, 0.36])); }
  return modern("SwivelChair", "五星脚办公转椅", "道具", parts);
}

function workstation() {
  return modern("Workstation", "现代办公工位", "道具", [part("办公桌面", "box", "#c4b89c", [0, 0.75, 0], [1.5, 0.065, 0.75]), ...legs(1.3, 0.55, 0.72, steel, 0.05), part("工位隔板", "box", "#7d9992", [0, 0.96, -0.34], [1.5, 0.48, 0.04]), part("显示器底座", "box", dark, [0, 0.8, -0.08], [0.3, 0.035, 0.18]), part("显示器支柱", "box", steel, [0, 0.97, -0.12], [0.06, 0.3, 0.05]), part("液晶显示器", "box", dark, [0, 1.17, -0.12], [0.64, 0.4, 0.05]), part("液晶屏面", "box", "#86aeba", [0, 1.17, -0.088], [0.58, 0.34, 0.012]), part("键盘", "box", "#a7b1ab", [0, 0.8, 0.22], [0.45, 0.025, 0.15]), part("桌下活动柜", "box", "#b2bdb2", [0.53, 0.35, 0], [0.32, 0.64, 0.5])]);
}

function kitchenIsland() {
  return modern("KitchenIsland", "厨房水槽岛台", "道具", [part("岛台橱柜", "box", "#81958d", [0, 0.45, 0], [1.9, 0.9, 0.85]), part("石质操作台", "box", "#d3d0bc", [0, 0.94, 0], [2.05, 0.09, 1]), part("水槽内壁", "box", dark, [-0.45, 0.993, 0], [0.55, 0.02, 0.48]), part("水槽底面", "box", steel, [-0.45, 1.006, 0], [0.45, 0.015, 0.38]), part("弯颈水龙头", "tube", steel, [-0.45, 0, -0.29], [1, 1, 1], [0, 0, 0], { radius: 0.015, path: [{ x: 0, y: 0.99, z: 0 }, { x: 0, y: 1.25, z: 0 }, { x: 0, y: 1.31, z: 0.15 }, { x: 0, y: 1.18, z: 0.2 }] }), ...[-0.47, 0.47].flatMap(x => [part("橱柜门", "box", "#99aaa0", [x, 0.5, 0.44], [0.89, 0.72, 0.045]), part("橱柜把手", "box", steel, [x, 0.77, 0.48], [0.25, 0.025, 0.025])])]);
}

function fridge() {
  return modern("Fridge", "双门家用冰箱", "道具", [part("冰箱柜体", "box", "#b3c0bb", [0, 0.94, 0], [0.9, 1.88, 0.74]), part("冷冻室门", "box", "#c9d1c8", [0, 1.62, 0.4], [0.87, 0.48, 0.06]), part("冷藏室门", "box", "#c9d1c8", [0, 0.71, 0.4], [0.87, 1.27, 0.06]), part("冷冻室把手", "box", steel, [0.31, 1.62, 0.47], [0.04, 0.3, 0.045]), part("冷藏室把手", "box", steel, [0.31, 0.99, 0.47], [0.04, 0.53, 0.045]), part("冰箱下通风槽", "box", dark, [0, 0.055, 0.41], [0.72, 0.06, 0.025])]);
}

function washingMachine() {
  return modern("WashingMachine", "滚筒洗衣机", "道具", [part("洗衣机机壳", "box", "#d5dcd2", [0, 0.43, 0], [0.63, 0.86, 0.6]), part("滚筒黑色内胆", "cylinder", dark, [0, 0.4, 0.32], [0.41, 0.035, 0.41], [90, 0, 0]), part("圆形门框", "torus", steel, [0, 0.4, 0.35], [0.46, 0.46, 0.28]), part("滚筒门玻璃", "cylinder", "#5d7b88", [0, 0.4, 0.36], [0.3, 0.025, 0.3], [90, 0, 0], { opacity: 0.6, roughness: 0.15 }), part("程序旋钮", "cylinder", steel, [0.1, 0.75, 0.32], [0.08, 0.03, 0.08], [90, 0, 0]), part("程序显示屏", "box", dark, [-0.12, 0.75, 0.32], [0.19, 0.08, 0.025]), part("洗涤剂盒", "box", "#b5c1ba", [-0.2, 0.83, 0.31], [0.17, 0.04, 0.025])]);
}

function floorLamp() {
  return modern("FloorLamp", "落地阅读灯", "道具", [part("落地灯圆座", "cylinder", iron, [0, 0.035, 0], [0.38, 0.07, 0.38]), part("落地灯杆", "cylinder", steel, [0, 0.77, 0], [0.025, 1.5, 0.025]), beam("阅读灯弯臂", steel, [0, 1.5, 0], [0.3, 1.75, 0], 0.025), part("锥形阅读灯罩", "cone", "#9aa99d", [0.35, 1.66, 0], [0.35, 0.3, 0.35], [0, 0, -30]), part("灯罩内灯泡", "sphere", "#e9d8ac", [0.4, 1.57, 0], [0.12, 0.12, 0.12], [0, 0, 0], { emissive: "#e7c887", emissiveIntensity: 1 })]);
}

function indoorPlant() {
  const parts = [part("室内花盆", "lathe", "#a99f88", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.16, y: 0 }, { x: 0.24, y: 0.37 }, { x: 0.25, y: 0.39 }, { x: 0.2, y: 0.39 }, { x: 0.16, y: 0.07 }] }), part("盆土", "cylinder", wood, [0, 0.35, 0], [0.4, 0.02, 0.4])];
  for (let index = 0; index < 7; index++) { const angle = index * Math.PI * 2 / 7, x = Math.cos(angle) * 0.35, z = Math.sin(angle) * 0.35, y = 0.6 + index % 3 * 0.2; parts.push(beam("叶柄", "#58704f", [0, 0.34, 0], [x, y, z], 0.014)); parts.push(part("龟背竹叶", "extrude", index % 2 ? "#4e7457" : "#698762", [x, y, z], [1, 1, 1], [35, index * 360 / 7, 0], { depth: 0.012, profile: [{ x: 0, y: 0 }, { x: -0.15, y: 0.13 }, { x: -0.23, y: 0.3 }, { x: -0.17, y: 0.39 }, { x: -0.04, y: 0.31 }, { x: -0.15, y: 0.48 }, { x: -0.04, y: 0.56 }, { x: 0, y: 0.49 }, { x: 0.06, y: 0.56 }, { x: 0.18, y: 0.46 }, { x: 0.06, y: 0.3 }, { x: 0.2, y: 0.37 }, { x: 0.23, y: 0.27 }, { x: 0.13, y: 0.1 }] })); }
  return modern("IndoorPlant", "盆栽龟背竹", "自然", parts);
}

function streetPlanter() {
  const parts = [part("种植箱底板", "box", wood, [0, 0.08, 0], [1.8, 0.16, 0.65]), part("种植箱土面", "box", "#6b5c48", [0, 0.53, 0], [1.65, 0.1, 0.52])];
  for (const z of [-0.31, 0.31]) for (const y of [0.19, 0.37, 0.55]) parts.push(part("种植箱侧板", "box", oak, [0, y, z], [1.8, 0.15, 0.055]));
  for (const x of [-0.87, 0.87]) parts.push(part("种植箱端板", "box", oak, [x, 0.36, 0], [0.06, 0.56, 0.65]));
  for (let index = 0; index < 7; index++) parts.push(part("绿植簇", "sphere", index % 2 ? "#7a9460" : "#607e5a", [-0.7 + index * 0.23, 0.85 + index % 2 * 0.07, 0], [0.44, 0.61, 0.5]));
  return modern("StreetPlanter", "街头木制种植箱", "自然", parts);
}

function playSlide() {
  const parts = [...legs(0.9, 0.8, 1.55, steel, 0.055), part("滑梯顶台", "box", "#b4a26c", [0, 1.58, -0.1], [1.05, 0.12, 0.95]), part("滑道面", "box", "#8db1aa", [0, 0.93, 1.03], [0.76, 0.07, 2.55], [35, 0, 0]), part("滑道末端", "box", "#8db1aa", [0, 0.17, 2.18], [0.76, 0.07, 0.45])];
  for (const x of [-0.43, 0.43]) { parts.push(beam("滑梯边栏", "#bd9871", [x, 1.72, 0.05], [x, 0.32, 2.15], 0.09)); parts.push(beam("梯子扶杆", steel, [x, 0.03, -1.2], [x, 1.92, -0.45], 0.045)); }
  for (let index = 0; index < 6; index++) parts.push(part("梯子踏杆", "cylinder", steel, [0, 0.18 + index * 0.26, -1.14 + index * 0.12], [0.04, 0.83, 0.04], [0, 0, 90]));
  return modern("PlaySlide", "儿童户外滑梯", "道具", parts);
}

const modernAssets = [
  apartmentBlock(), officeTower(), retailShop(), warehouse(), fuelStation(), trainPlatform(), pedestrianBridge(), trafficLight(), cityBus(), sedan(), deliveryVan(), bicycle(), scooter(), bollard(), bikeRack(), parkingMeter(), fireHydrant(), trashBin(), recyclingStation(), vendingMachine(), parcelLocker(), atm(), chargingStation(), informationKiosk(), securityCamera(), barrierGate(),
  shippingContainer(), forklift(), pallet(), cableReel(), transformer(), hvacUnit(), generator(), solarArray(), windTurbine(), modularSofa(), coffeeTable(), swivelChair(), workstation(), kitchenIsland(), fridge(), washingMachine(), floorLamp(), indoorPlant(), streetPlanter(), playSlide(),
];

export const civicAssets: SceneAsset[] = [...europeanAssets, ...modernAssets];
