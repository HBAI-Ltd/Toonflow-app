import { asset, part, ring, beam, pitchedRoof, type ModelPart, type Triple } from "./assetModelParts";
import type { SceneAsset } from "./sceneDocument";

const sand = "#c1aa80";
const stone = "#a9a48e";
const clay = "#b48261";
const wood = "#825c43";
const darkWood = "#584737";
const brass = "#b99b5b";
const cloth = "#d2b995";
const teal = "#568d87";
const leaf = "#647e55";

function make(id: string, name: string, category: "建筑" | "道具" | "自然", parts: ModelPart[]) {
  return asset(`world${id}`, name, "异域", category, parts);
}

function box(name: string, color: string, position: Triple, scale: Triple, rotation: Triple = [0, 0, 0]) {
  return part(name, "box", color, position, scale, rotation);
}

function round(name: string, color: string, position: Triple, diameter: number, height: number, details: Partial<ModelPart> = {}) {
  return part(name, "cylinder", color, position, [diameter, height, diameter], [0, 0, 0], details);
}

function vessel(name: string, color: string, height: number, radius: number, handles = false): ModelPart[] {
  const profile = [{ x: 0, y: 0 }, { x: radius * 0.5, y: 0 }, { x: radius, y: height * 0.35 }, { x: radius * 0.9, y: height * 0.58 }, { x: radius * 0.45, y: height * 0.83 }, { x: radius * 0.5, y: height }, { x: radius * 0.35, y: height }, { x: radius * 0.32, y: height * 0.82 }, { x: radius * 0.76, y: height * 0.55 }, { x: radius * 0.84, y: height * 0.35 }, { x: radius * 0.42, y: 0.06 }, { x: 0, y: 0.06 }];
  const parts = [part(name, "lathe", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile })];
  if (handles) for (const side of [-1, 1]) parts.push(part("双耳把手", "torus", color, [side * radius * 0.88, height * 0.7, 0], [radius * 0.65, height * 0.42, radius * 0.3]));
  return parts;
}

function arch(width: number, height: number, depth: number, color: string, pointed = false): ModelPart[] {
  const parts = [box("左门柱", color, [-width / 2, height * 0.36, 0], [0.32, height * 0.72, depth]), box("右门柱", color, [width / 2, height * 0.36, 0], [0.32, height * 0.72, depth])];
  const steps = 10;
  const radius = width / 2;
  for (let index = 0; index < steps; index++) {
    const angle = (index + 0.5) / steps * Math.PI;
    const y = height * 0.72 + Math.sin(angle) * (pointed ? height * 0.42 : radius);
    parts.push(box("独立拱券石", color, [Math.cos(angle) * radius, y, 0], [0.36, radius * Math.PI / steps * 1.05, depth], [0, 0, angle * 180 / Math.PI]));
  }
  return parts;
}

function platform(size: number, height: number, levels: number, color: string): ModelPart[] {
  return Array.from({ length: levels }, (_, index) => box("逐级收分石台", index % 2 ? color : sand, [0, height / levels * (index + 0.5), 0], [size * (1 - index / levels * 0.76), height / levels, size * (1 - index / levels * 0.76)]));
}

function pavilion(kind: "persian" | "indian" | "thai"): ModelPart[] {
  const parts: ModelPart[] = [round("凉亭台基", sand, [0, 0.16, 0], 3.5, 0.32)];
  for (let index = 0; index < (kind === "indian" ? 8 : 6); index++) {
    const angle = index * Math.PI * 2 / (kind === "indian" ? 8 : 6);
    const x = Math.cos(angle) * 1.35, z = Math.sin(angle) * 1.35;
    parts.push(round("承重石柱", kind === "persian" ? teal : sand, [x, 1.65, z], kind === "thai" ? 0.18 : 0.23, 2.7));
    parts.push(round("柱头", brass, [x, 3.02, z], 0.34, 0.12));
  }
  parts.push(round("檐口", kind === "persian" ? teal : sand, [0, 3.1, 0], 3.6, 0.2));
  if (kind === "thai") for (let level = 0; level < 3; level++) parts.push(part("层叠尖顶", "cone", level % 2 ? brass : "#926346", [0, 3.65 + level * 0.42, 0], [3.8 - level, 1.1, 3.8 - level]));
  else parts.push(part("曲线穹顶", "lathe", kind === "persian" ? teal : "#d5c7a5", [0, 3.2, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 1.7 }, { x: 0.18, y: 1.45 }, { x: 0.8, y: 1.15 }, { x: 1.4, y: 0.55 }, { x: 1.55, y: 0.1 }, { x: 1.55, y: 0 }] }));
  parts.push(round("顶饰", brass, [0, kind === "thai" ? 5.05 : 4.95, 0], 0.12, 0.55));
  return parts;
}

function stiltHouse(): ModelPart[] {
  const parts: ModelPart[] = [box("高架地板", wood, [0, 1.45, 0], [4.2, 0.22, 3.2]), box("民居墙体", "#b89566", [0, 2.5, 0], [3.6, 1.9, 2.7]), pitchedRoof("陡坡棕榈屋顶", "#8f8561", 4.8, 3.6, 3.6)];
  for (const x of [-1.7, 1.7]) for (const z of [-1.2, 1.2]) parts.push(round("高脚柱", darkWood, [x, 0.7, z], 0.18, 1.4));
  for (const x of [-1, 1]) parts.push(box("木窗", darkWood, [x, 2.6, 1.36], [0.65, 0.7, 0.05]));
  parts.push(box("门洞饰板", darkWood, [0, 2.23, 1.37], [0.7, 1.45, 0.06]));
  for (let index = 0; index < 6; index++) parts.push(box("入户梯级", wood, [0, (index + 0.5) * 0.23, 2.9 - index * 0.23], [0.85, 0.23, 0.28]));
  return parts;
}

function tent(palm = false): ModelPart[] {
  if (palm) {
    const parts = [pitchedRoof("棕榈叶顶", "#9c926c", 4.4, 3.3, 2.55)];
    for (const x of [-1.7, 1.7]) for (const z of [-1.2, 1.2]) parts.push(round("木棚支柱", wood, [x, 1.25, z], 0.15, 2.5));
    return parts;
  }
  const parts = [pitchedRoof("沙漠帐篷布顶", cloth, 4.6, 3.4, 2.2), box("后帐布", cloth, [0, 1.1, -1.55], [4, 2.2, 0.035])];
  for (const x of [-1.7, 1.7]) parts.push(round("帐篷立杆", darkWood, [x, 1.15, 0], 0.09, 2.3));
  for (const side of [-1, 1]) parts.push(beam("外拉绳", darkWood, [side * 1.9, 2.2, 1.5], [side * 2.8, 0.05, 2], 0.022));
  return parts;
}

function lowTable(roundTop = false): ModelPart[] {
  const parts = roundTop ? [round("雕花圆桌面", wood, [0, 0.65, 0], 1.35, 0.1)] : [box("长条坐榻座面", "#b57c63", [0, 0.43, 0], [2.1, 0.22, 0.78]), box("织物靠背", cloth, [0, 0.85, -0.35], [2.1, 0.68, 0.13])];
  for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("弯脚木腿", darkWood, [x * (roundTop ? 0.4 : 0.8), 0.3, z * (roundTop ? 0.4 : 0.26)], [0.1, 0.6, 0.1], [0, 0, x * 8]));
  if (roundTop) parts.push(ring("圆桌镶边", brass, 0.65, 0.04, 0.71, 0.025));
  else for (const x of [-0.9, 0.9]) parts.push(box("坐榻扶手", wood, [x, 0.73, 0], [0.13, 0.18, 0.72]));
  return parts;
}

function lamp(kind: "lantern" | "tray"): ModelPart[] {
  if (kind === "tray") return [round("托灯底座", brass, [0, 0.05, 0], 0.5, 0.1), round("旋柱灯架", brass, [0, 0.45, 0], 0.08, 0.8), ring("环形灯盘", brass, 0.38, 0.07, 0.84, 0.1), ...Array.from({ length: 6 }, (_, index) => part("火焰灯芯", "cone", "#e6bf73", [Math.cos(index * Math.PI / 3) * 0.3, 0.99, Math.sin(index * Math.PI / 3) * 0.3], [0.07, 0.17, 0.07], [0, 0, 0], { emissive: "#d79946", emissiveIntensity: 0.8 }))];
  const parts = [round("六面灯座", brass, [0, 0.08, 0], 0.44, 0.16), part("尖顶罩", "cone", brass, [0, 0.9, 0], [0.55, 0.34, 0.55]), part("暖色灯芯", "cylinder", "#e8d59a", [0, 0.48, 0], [0.2, 0.58, 0.2], [0, 0, 0], { emissive: "#dcb06a", emissiveIntensity: 0.9 })];
  for (let index = 0; index < 6; index++) parts.push(round("镂空灯笼框", brass, [Math.cos(index * Math.PI / 3) * 0.2, 0.48, Math.sin(index * Math.PI / 3) * 0.2], 0.025, 0.7));
  parts.push(part("提环", "torus", brass, [0, 1.16, 0], [0.2, 0.2, 0.08]));
  return parts;
}

function rack(kind: "carpet" | "loom" | "plates" | "cargo"): ModelPart[] {
  const parts: ModelPart[] = [];
  const width = kind === "carpet" ? 1.8 : kind === "cargo" ? 2.1 : 1.25;
  for (const x of [-width / 2, width / 2]) {
    parts.push(box("木架立柱", wood, [x, 1.05, 0], [0.1, 2.1, 0.1]));
    parts.push(box("落地横足", wood, [x, 0.07, 0], [0.16, 0.14, 0.7]));
  }
  if (kind === "carpet") {
    parts.push(box("上横梁", wood, [0, 1.95, 0], [width + 0.2, 0.1, 0.1]), box("织毯底色", "#a86658", [0, 1.05, 0.03], [width * 0.87, 1.65, 0.035]));
    for (let index = 0; index < 5; index++) parts.push(box("织毯几何条纹", index % 2 ? teal : cloth, [0, 0.5 + index * 0.28, 0.053], [width * 0.8, 0.065, 0.008]));
  } else if (kind === "loom") {
    for (const y of [0.3, 1.85]) parts.push(round("织机卷轴", darkWood, [0, y, 0], 0.13, width, { rotation: { x: 0, y: 0, z: 90 } }));
    for (let index = 0; index < 12; index++) parts.push(box("绷紧经线", cloth, [width * (index / 12 - 0.46), 1.05, 0], [0.012, 1.5, 0.012]));
    parts.push(box("织物纬片", "#b78268", [0, 0.7, 0.02], [width * 0.88, 0.62, 0.025]));
  } else {
    for (let level = 0; level < 3; level++) parts.push(box("分层木板", wood, [0, 0.35 + level * 0.58, 0], [width, 0.08, 0.6]));
    for (let index = 0; index < (kind === "plates" ? 6 : 4); index++) {
      if (kind === "plates") parts.push(part("彩陶盘", "cylinder", index % 2 ? teal : clay, [(index % 3 - 1) * 0.32, 0.65 + Math.floor(index / 3) * 0.6, 0.02], [0.28, 0.035, 0.28], [75, 0, 0]));
      else parts.push(box("商旅木箱", index % 2 ? wood : cloth, [(index % 2 - 0.5) * 0.7, 0.65 + Math.floor(index / 2) * 0.58, 0], [0.58, 0.5, 0.5]));
    }
  }
  return parts;
}

function boat(kind: "outrigger" | "catamaran" | "canopy"): ModelPart[] {
  const hull = (x: number, width: number) => part("尖艏船壳", "extrude", wood, [x, 0.25, 0], [1, 1, 1], [90, 0, 0], { depth: 0.42, profile: [{ x: -width / 2, y: -1.7 }, { x: width / 2, y: -1.7 }, { x: width * 0.62, y: 0.9 }, { x: 0, y: 2 }, { x: -width * 0.62, y: 0.9 }] });
  const parts: ModelPart[] = kind === "catamaran" ? [hull(-0.85, 0.55), hull(0.85, 0.55)] : [hull(0, 1.05)];
  if (kind === "outrigger") parts.push(part("外伸浮木", "capsule", darkWood, [1.2, 0.23, 0], [0.2, 3.4, 0.2], [90, 0, 0]));
  for (const z of [-0.8, 0.65]) parts.push(box("横向船梁", darkWood, [kind === "outrigger" ? 0.55 : 0, 0.5, z], [kind === "catamaran" ? 2 : kind === "outrigger" ? 1.6 : 1, 0.1, 0.14]));
  if (kind === "canopy") {
    for (const x of [-0.42, 0.42]) for (const z of [-0.85, 0.85]) parts.push(round("篷架立杆", wood, [x, 0.95, z], 0.045, 1));
    parts.push(pitchedRoof("船篷", cloth, 1.15, 1.95, 1.45));
  } else {
    parts.push(round("木帆桅", darkWood, [0, 1.8, 0], 0.09, 3.1), part("三角编织船帆", "extrude", cloth, [0, 2.05, 0], [1, 1, 1], [0, 0, 0], { depth: 0.018, profile: [{ x: 0.08, y: -0.65 }, { x: 0.08, y: 1.25 }, { x: 1.45, y: -0.65 }] }));
  }
  return parts;
}

function cart(kind: "merchant" | "hand" | "sled"): ModelPart[] {
  const parts = [box("货架底板", wood, [0, kind === "sled" ? 0.28 : 0.65, 0], [1.4, 0.14, 2])];
  if (kind === "sled") for (const x of [-0.58, 0.58]) parts.push(beam("雪橇滑轨", darkWood, [x, 0.08, -1.1], [x, 0.16, 1.25], 0.13, 0.18));
  else for (const side of [-1, 1]) {
    parts.push(part("木轮外圈", "torus", darkWood, [side * 0.85, 0.46, 0], [0.94, 0.94, 0.2], [0, 90, 0]));
    for (let index = 0; index < 6; index++) parts.push(box("木轮辐条", wood, [side * 0.85, 0.46, 0], [0.08, 0.72, 0.05], [index * 30, 0, 0]));
  }
  if (kind === "merchant") for (const side of [-1, 1]) parts.push(box("货车侧栏", wood, [side * 0.67, 1, 0], [0.08, 0.55, 2]));
  for (const x of [-0.4, 0.4]) parts.push(beam("长辕牵引杆", darkWood, [x, 0.65, 0.7], [x, kind === "sled" ? 0.4 : 0.8, 2.4], 0.07));
  if (kind !== "hand") parts.push(box("捆扎货包", cloth, [0, kind === "sled" ? 0.64 : 1.05, 0], [1.1, 0.6, 1.3]));
  return parts;
}

function palm(date = false): ModelPart[] {
  const parts: ModelPart[] = [part("棕榈树干", "cylinder", wood, [0, 2.6, 0], [date ? 0.45 : 0.3, 5.2, date ? 0.45 : 0.3])];
  for (let index = 0; index < (date ? 12 : 9); index++) {
    const a = index * Math.PI * 2 / (date ? 12 : 9);
    const length = date ? 2.2 : 2.8;
    const end: Triple = [Math.cos(a) * length, 4.6, Math.sin(a) * length];
    parts.push(beam("弧垂叶脉", leaf, [0, 5.15, 0], end, 0.08));
    const blade = part("尖长羽状叶", "extrude", date ? "#72835b" : "#668657", [Math.cos(a) * length * 0.5, 5, Math.sin(a) * length * 0.5], [1, 1, 1], [-90, 0, -a * 180 / Math.PI], { depth: 0.024, profile: [{ x: -length / 2, y: 0 }, { x: -0.15, y: 0.38 }, { x: length / 2, y: 0 }, { x: -0.15, y: -0.38 }] });
    parts.push(blade);
    if (index < 5) parts.push(part(date ? "枣串" : "椰果", "sphere", date ? "#8f6846" : "#86744d", [Math.cos(a) * 0.3, 4.95, Math.sin(a) * 0.3], date ? [0.16, 0.42, 0.16] : [0.25, 0.29, 0.25]));
  }
  return parts;
}

function hammock(): ModelPart[] {
  const parts = [beam("左斜撑", wood, [-1.9, 0, 0], [-1.3, 1.7, 0], 0.12), beam("右斜撑", wood, [1.9, 0, 0], [1.3, 1.7, 0], 0.12), box("吊床底横梁", darkWood, [0, 0.08, 0], [3.9, 0.16, 0.18])];
  for (let index = 0; index < 9; index++) for (const side of [-1, 1]) parts.push(beam("下垂编织条", cloth, [side * 1.3, 1.55, (index - 4) * 0.085], [0, 0.75, (index - 4) * 0.085], 0.045));
  return parts;
}

function broadTree(baobab = false): ModelPart[] {
  const parts = [part("宽冠树干", baobab ? "lathe" : "cylinder", "#8a7960", [0, baobab ? 0 : 2, 0], baobab ? [1, 1, 1] : [0.35, 4, 0.35], [0, 0, 0], baobab ? { profile: [{ x: 0.85, y: 0 }, { x: 1.05, y: 1.2 }, { x: 0.78, y: 3.4 }, { x: 0.35, y: 4.8 }] } : {})];
  for (let index = 0; index < 5; index++) {
    const angle = index * Math.PI * 2 / 5;
    const x = Math.cos(angle) * 2, z = Math.sin(angle) * 2;
    parts.push(beam("分叉树枝", "#8a7960", [0, baobab ? 3.9 : 2.6, 0], [x, baobab ? 5 : 4, z], baobab ? 0.22 : 0.12));
    parts.push(part("伞状树冠", "sphere", index % 2 ? "#71875a" : "#61774e", [x, baobab ? 5.4 : 4.2, z], baobab ? [2.2, 1.4, 2.2] : [3.1, 0.75, 2.3]));
  }
  return parts;
}

const pyramid = make("Pyramid", "古埃及阶梯金字塔", "建筑", platform(9, 6, 8, sand));
const obelisk = make("Obelisk", "埃及方尖碑", "建筑", [box("方尖碑基座", sand, [0, 0.25, 0], [1.5, 0.5, 1.5]), part("收分碑身", "extrude", sand, [0, 0.5, 0], [1, 1, 1], [0, 0, 0], { depth: 0.65, profile: [{ x: -0.45, y: 0 }, { x: 0.45, y: 0 }, { x: 0.26, y: 4.8 }, { x: 0, y: 5.35 }, { x: -0.26, y: 4.8 }] }), ...Array.from({ length: 5 }, (_, i) => box("碑面刻槽", "#998b71", [0, 1.1 + i * 0.65, 0.329], [0.16, 0.05, 0.008]))]);
const temple = make("TemplePylon", "埃及神庙门塔", "建筑", [box("门塔基台", sand, [0, 0.15, 0], [8.5, 0.3, 2.5]), ...[-1, 1].map(side => part("倾斜塔身", "extrude", sand, [side * 2.55, 0.3, 0], [1, 1, 1], [0, 0, 0], { depth: 2, profile: [{ x: -1.5, y: 0 }, { x: 1.5, y: 0 }, { x: 1.05, y: 4.8 }, { x: -1.05, y: 4.8 }] })), box("门额横梁", clay, [0, 3.15, 0], [2.1, 0.5, 1.6]), ...[-3.6, -1.5, 1.5, 3.6].map(x => round("门塔旗杆", wood, [x, 3, 1.12], 0.1, 5.4))]);
const nubian = make("NubianHome", "努比亚穹顶民居", "建筑", [box("土屋墙体", clay, [0, 1.3, 0], [3.8, 2.6, 3.2]), part("圆弧穹顶", "sphere", sand, [0, 2.5, 0], [3.85, 2.1, 3.25]), box("深色门扇", darkWood, [0, 1, 1.61], [0.85, 1.9, 0.05]), ...[-1.2, 1.2].map(x => box("小天窗", teal, [x, 1.8, 1.62], [0.45, 0.65, 0.055]))]);
const moroccan = make("MoroccanGate", "摩洛哥庭院拱门", "建筑", [...arch(2.3, 2.8, 0.5, sand, true), ...[-1, 1].map(side => box("马赛克门边", teal, [side * 1.5, 2.025, 0], [0.3, 4.05, 0.54])), box("拱门上墙", sand, [0, 3.64, 0], [2.7, 0.92, 0.5]), box("水平檐饰", clay, [0, 4.15, 0], [3.5, 0.2, 0.7])]);
const windTower = make("WindTower", "中东捕风塔", "建筑", [box("土墙塔身", sand, [0, 2, 0], [2, 4, 2]), box("捕风上舱", clay, [0, 4.8, 0], [2.2, 1.6, 2.2]), box("顶盖", sand, [0, 5.68, 0], [2.5, 0.16, 2.5]), ...[-1, 1].flatMap(side => [box("竖向风道", darkWood, [side * 1.11, 4.8, 0], [0.025, 1.2, 1.3]), box("另一向风道", darkWood, [0, 4.8, side * 1.11], [1.3, 1.2, 0.025])])]);
const stepWell = make("StepWell", "南亚阶井石台", "建筑", [...Array.from({ length: 6 }, (_, level) => {
  const span = 5.4 - level * 0.65, height = (6 - level) * 0.24;
  return [box("阶井横阶", sand, [0, height / 2, -span / 2], [span + 0.55, height, 0.55]), box("阶井左阶", sand, [-span / 2, height / 2, 0], [0.55, height, span]), box("阶井右阶", sand, [span / 2, height / 2, 0], [0.55, height, span])];
}).flat(), box("井中水面", teal, [0, 0.03, 0.15], [1.5, 0.03, 1.5])]);

export const worldAssets: SceneAsset[] = [
  pyramid, obelisk, temple, nubian, moroccan,
  make("PersianPavilion", "波斯穹顶凉亭", "建筑", pavilion("persian")), windTower,
  make("IndianPavilion", "南亚八柱穹顶亭", "建筑", pavilion("indian")), stepWell,
  make("BalineseSplitGate", "巴厘岛分体石门", "建筑", [-1, 1].flatMap(side => [box("分体门台座", stone, [side * 1.4, 0.15, 0], [1.5, 0.3, 1.4]), ...Array.from({ length: 6 }, (_, level) => box("逐层收分门塔", level % 2 ? stone : "#8e9481", [side * (1.3 + level * 0.025), 0.55 + level * 0.52, 0], [1.1 - level * 0.1, 0.52, 1.1 - level * 0.08]))])),
  make("StiltHouse", "东南亚高脚屋", "建筑", stiltHouse()),
  make("ThaiPavilion", "泰式层叠尖顶亭", "建筑", pavilion("thai")),
  make("MayaTemple", "美洲阶梯神庙", "建筑", [...platform(7.2, 3.8, 6, stone), box("顶端神庙", sand, [0, 4.6, 0], [2.2, 1.6, 2]), box("庙门", darkWood, [0, 4.5, 1.01], [0.7, 1.35, 0.03]), ...Array.from({ length: 14 }, (_, i) => box("中央石阶", sand, [0, (i + 0.5) * 0.27, 3.7 - i * 0.18], [0.95, 0.27, 0.22]))]),
  make("AndeanHouse", "安第斯石屋", "建筑", [box("粗石墙体", stone, [0, 1.15, 0], [3.2, 2.3, 2.7]), pitchedRoof("草束双坡屋顶", "#b2a071", 3.7, 3.3, 2.5), box("木门", darkWood, [0, 0.92, 1.36], [0.7, 1.84, 0.03]), ...[-1.1, 1.1].map(x => box("石窗", "#6e7565", [x, 1.5, 1.36], [0.45, 0.5, 0.03]))]),
  make("PalmShelter", "海岛棕榈凉棚", "建筑", tent(true)), make("DesertTent", "撒哈拉商旅帐篷", "建筑", tent()),
  make("MoroccanTable", "摩洛哥镶边矮桌", "道具", lowTable(true)), make("Divan", "中东长条坐榻", "道具", lowTable()),
  make("TeaTray", "土耳其铜茶盘", "道具", [round("铜茶盘", brass, [0, 0.03, 0], 0.8, 0.06), ...vessel("铜茶壶", brass, 0.36, 0.12).map(p => ({ ...p, position: { ...p.position, y: p.position.y + 0.06 } })), ...[-0.24, 0.24].map(x => round("小茶杯", teal, [x, 0.12, 0.12], 0.12, 0.14))]),
  make("CarpetRack", "波斯织毯挂架", "道具", rack("carpet")), make("PiercedLantern", "阿拉伯镂空提灯", "道具", lamp("lantern")),
  make("WaterJar", "南亚陶水罐", "道具", vessel("陶水罐", clay, 0.95, 0.4)), make("Amphora", "古埃及双耳陶壶", "道具", vessel("长颈双耳壶", sand, 1.15, 0.32, true)),
  make("OilLampStand", "南亚环盘托灯", "道具", lamp("tray")),
  make("Djembe", "西非高脚木鼓", "道具", [part("收腰鼓身", "lathe", wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.21, y: 0 }, { x: 0.25, y: 0.1 }, { x: 0.12, y: 0.5 }, { x: 0.29, y: 0.75 }, { x: 0.32, y: 0.95 }, { x: 0, y: 0.95 }] }), round("羊皮鼓面", cloth, [0, 0.97, 0], 0.65, 0.04), ...Array.from({ length: 8 }, (_, i) => beam("绷鼓绳", darkWood, [Math.cos(i * Math.PI / 4) * 0.3, 0.95, Math.sin(i * Math.PI / 4) * 0.3], [Math.cos(i * Math.PI / 4) * 0.16, 0.4, Math.sin(i * Math.PI / 4) * 0.16], 0.018))]),
  make("WovenStool", "非洲编织圆凳", "道具", [round("编织凳面", cloth, [0, 0.45, 0], 0.64, 0.12), ...Array.from({ length: 3 }, (_, i) => beam("三叉木腿", wood, [Math.cos(i * Math.PI * 2 / 3) * 0.2, 0.45, Math.sin(i * Math.PI * 2 / 3) * 0.2], [Math.cos(i * Math.PI * 2 / 3) * 0.28, 0.03, Math.sin(i * Math.PI * 2 / 3) * 0.28], 0.065))]),
  make("PeacockChair", "藤编孔雀椅", "道具", [round("藤椅坐垫", cloth, [0, 0.48, 0], 0.65, 0.09), part("扇形高靠背", "torus", wood, [0, 1.25, -0.25], [1.5, 1.8, 0.15]), ...Array.from({ length: 8 }, (_, i) => beam("扇形藤条", wood, [0, 0.55, -0.25], [Math.cos(i / 7 * Math.PI) * 0.67, 1 + Math.sin(i / 7 * Math.PI) * 0.98, -0.25], 0.025)), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("藤椅细腿", darkWood, [x * 0.23, 0.24, z * 0.22], [0.05, 0.48, 0.05])))]),
  make("Hammock", "海岛竹藤吊床", "道具", hammock()),
  make("CarvedScreen", "印尼木雕屏风", "道具", [-1, 0, 1].flatMap(side => [box("屏风边框", wood, [side * 0.7, 0.9, 0], [0.66, 1.8, 0.08]), box("屏风内嵌板", "#a47f58", [side * 0.7, 0.95, 0.045], [0.5, 1.48, 0.025]), ...Array.from({ length: 3 }, (_, i) => part("雕刻环纹", "torus", brass, [side * 0.7, 0.5 + i * 0.42, 0.075], [0.3, 0.3, 0.035]))])),
  make("StoneMortar", "中美洲三足石臼", "道具", [part("石臼盆体", "lathe", stone, [0, 0.15, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.15, y: 0 }, { x: 0.4, y: 0.25 }, { x: 0.43, y: 0.48 }, { x: 0.35, y: 0.48 }, { x: 0.3, y: 0.26 }, { x: 0, y: 0.17 }] }), ...Array.from({ length: 3 }, (_, i) => part("石臼足", "sphere", stone, [Math.cos(i * Math.PI * 2 / 3) * 0.23, 0.13, Math.sin(i * Math.PI * 2 / 3) * 0.23], [0.19, 0.26, 0.19])), beam("石捣杵", "#838a79", [-0.3, 0.62, 0], [0.3, 0.76, 0], 0.12)]),
  make("AndeanLoom", "安第斯立式织机", "道具", rack("loom")), make("PotteryRack", "北非彩陶盘架", "道具", rack("plates")),
  make("PatternPillar", "美洲几何纹石柱", "道具", [box("方柱台座", stone, [0, 0.13, 0], [0.9, 0.26, 0.9]), box("雕纹柱身", sand, [0, 1.35, 0], [0.62, 2.44, 0.62]), ...Array.from({ length: 6 }, (_, i) => box("交错几何石纹", i % 2 ? clay : "#879286", [0, 0.55 + i * 0.35, 0.325], [i % 2 ? 0.45 : 0.2, 0.12, 0.035], [0, 0, i % 2 ? 0 : 45]))]),
  make("StoneDais", "安第斯阶梯石桌", "道具", [box("石桌厚顶", stone, [0, 0.77, 0], [1.65, 0.2, 0.9]), ...[-0.48, 0.48].map(x => box("阶梯式石腿", sand, [x, 0.34, 0], [0.45, 0.68, 0.65]))]),
  make("CaravanRack", "沙漠商旅货架", "道具", rack("cargo")),
  make("SpiceStall", "香料市场货摊", "道具", [box("摊位桌面", wood, [0, 0.85, 0], [2.2, 0.13, 1]), ...[-1, 1].flatMap(x => [-1, 1].map(z => round("货摊支架", wood, [x * 0.95, 1.2, z * 0.42], 0.07, 2.4))), pitchedRoof("织布遮阳篷", "#ba805c", 2.7, 1.5, 2.4), ...Array.from({ length: 5 }, (_, i) => round("香料浅盆", ["#b18b54", "#a16a48", "#87945c"][i % 3]!, [(i - 2) * 0.38, 1, 0], 0.3, 0.2))]),
  make("OutriggerSail", "海岛外伸支架帆舟", "道具", boat("outrigger")), make("Catamaran", "波利尼西亚双体帆船", "道具", boat("catamaran")), make("CanopyBoat", "热带带篷平底船", "道具", boat("canopy")),
  make("MerchantCart", "双轮商旅货车", "道具", cart("merchant")), make("HandCart", "长辕人力货车", "道具", cart("hand")), make("CargoSled", "北地货运雪橇", "道具", cart("sled")),
  make("CoconutPalm", "海岛椰子树", "自然", palm()), make("DatePalm", "绿洲枣椰树", "自然", palm(true)), make("Baobab", "非洲猴面包树", "自然", broadTree(true)), make("Acacia", "草原金合欢树", "自然", broadTree()),
  make("Cactus", "沙漠柱状仙人掌", "自然", [part("主茎", "capsule", leaf, [0, 1.5, 0], [0.65, 3, 0.65]), ...[-1, 1].flatMap(side => [beam("侧伸枝", leaf, [0, side < 0 ? 1.3 : 1.8, 0], [side * 0.72, side < 0 ? 1.3 : 1.8, 0], 0.23), part("直立侧枝", "capsule", leaf, [side * 0.72, side < 0 ? 1.65 : 2.25, 0], [0.42, side < 0 ? 0.9 : 1.2, 0.42])])]),
  make("Agave", "旱地龙舌兰", "自然", Array.from({ length: 12 }, (_, i) => {
    const angle = i * Math.PI / 6;
    return part("尖长叶片", "extrude", i % 2 ? "#7c9372" : "#637d67", [Math.cos(angle) * 0.3, 0.05, Math.sin(angle) * 0.3], [1, 1, 1], [0, -angle * 180 / Math.PI, 0], { depth: 0.035, profile: [{ x: -0.12, y: 0 }, { x: 0.1, y: 0 }, { x: 0.95, y: 0.7 + i % 3 * 0.12 }, { x: 0.32, y: 0.4 }] });
  })),
  make("LotusBasin", "莲花水钵", "自然", [part("厚壁水钵", "lathe", stone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.4, y: 0 }, { x: 0.65, y: 0.4 }, { x: 0.68, y: 0.55 }, { x: 0.6, y: 0.55 }, { x: 0.54, y: 0.37 }, { x: 0, y: 0.15 }] }), round("钵中水", teal, [0, 0.4, 0], 1.08, 0.018), ...Array.from({ length: 5 }, (_, i) => part("莲瓣", "sphere", "#d1adae", [Math.cos(i * Math.PI * 2 / 5) * 0.12, 0.53, Math.sin(i * Math.PI * 2 / 5) * 0.12], [0.2, 0.13, 0.14])), part("莲叶", "sphere", leaf, [-0.26, 0.43, 0.16], [0.4, 0.025, 0.32])]),
  make("DesertRocks", "沙漠风蚀石组", "自然", [part("主风蚀石", "sphere", sand, [0, 0.85, 0], [1.7, 1.7, 1.2]), part("侧斜岩", "sphere", "#b69f80", [0.9, 0.45, -0.15], [1.3, 0.9, 1.2], [0, 22, -18]), part("低岩", "sphere", "#a59277", [-0.8, 0.22, 0.4], [0.8, 0.44, 0.6])]),
];
