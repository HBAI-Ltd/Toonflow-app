import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { pointed } from "./insectForms";

const carapace = "#a6af92";
const joint = "#aeb79a";
const eye = "#576b5d";
const soil = "#aa9b7c";
const straw = "#b5aa80";
const wood = "#938267";

function arthropleura(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let segment = 0; segment < 20; segment++) {
    const z = 0.94 - segment * 0.112, width = 0.58 - Math.abs(segment - 8) * 0.008;
    parts.push(part("中央隆脊与左右展叶连成的三分背板", "extrude", carapace, [0, 0, z], [1, 1, 1], [0, 0, 0], { depth: 0.127, profile: [{ x: -width / 2, y: 0.18 }, { x: -width * 0.42, y: 0.205 }, { x: -width * 0.2, y: 0.23 }, { x: -width * 0.17, y: 0.28 }, { x: width * 0.17, y: 0.28 }, { x: width * 0.2, y: 0.23 }, { x: width * 0.42, y: 0.205 }, { x: width / 2, y: 0.18 }, { x: width * 0.4, y: 0.165 }, { x: -width * 0.4, y: 0.165 }] }));
    const feet: ModelPart[] = [];
    for (const side of [-1, 1]) for (const offset of [-0.024, 0.024]) feet.push(pointed("腹下同一体节的双对短关节足", joint, [[side * width * 0.18, 0.19, z + offset], [side * width * 0.36, 0.13, z + offset - 0.025], [side * width * 0.48, 0.012, z + offset - 0.05]], [0.014, 0.011, 0.003]));
    parts.push(combineMeshes("一体节完整的四只承重步足", joint, feet));
  }
  parts.push(lobe("背板前外露的圆形小头", carapace, [0, 0.2, 1.11], [0.24, 0.18, 0.25]));
  for (const side of [-1, 1]) {
    parts.push(tapered("头两侧短柄状眼柄", joint, [[side * 0.075, 0.23, 1.13], [side * 0.15, 0.275, 1.14]], [0.012, 0.018]), lobe("眼柄末端的棒状眼区", eye, [side * 0.15, 0.275, 1.14], [0.042, 0.035, 0.035]), pointed("短而外展的分节触角", joint, [[side * 0.06, 0.21, 1.19], [side * 0.12, 0.22, 1.3], [side * 0.15, 0.2, 1.4]], [0.012, 0.008, 0.003]), lobe("被包覆的小型咀嚼颚而非蜈蚣毒钩", joint, [side * 0.03, 0.145, 1.19], [0.045, 0.045, 0.07]));
  }
  return parts;
}

function jaekelopterus(): ModelPart[] {
  const parts = [lobe("巨螯板足鲎宽头胸甲", carapace, [0, 0.22, 0.64], [0.58, 0.23, 0.5])];
  for (let segment = 0; segment < 12; segment++) parts.push(lobe("逐节收分的扁平腹部背甲", carapace, [0, 0.19, 0.39 - segment * 0.125], [0.56 - segment * 0.027, 0.2 - segment * 0.007, 0.185]));
  parts.push(polygon("末端横展的扁平尾桨", joint, [[-0.07, -0.99], [-0.2, -1.25], [-0.03, -1.43], [0.03, -1.43], [0.2, -1.25], [0.07, -0.99]], 0.025, [0, 0.14, 0]));
  for (const side of [-1, 1]) {
    parts.push(pointed("从头前方伸出的长粗螯肢臂", joint, [[side * 0.12, 0.17, 0.78], [side * 0.32, 0.2, 0.92], [side * 0.34, 0.2, 1.18]], [0.045, 0.04, 0.035]), pointed("巨螯内侧固定指", carapace, [[side * 0.34, 0.2, 1.13], [side * 0.22, 0.2, 1.38], [side * 0.24, 0.2, 1.53]], [0.05, 0.033, 0.007]), pointed("与固定指分离的外侧活动指", carapace, [[side * 0.34, 0.2, 1.13], [side * 0.51, 0.2, 1.34], [side * 0.42, 0.2, 1.51]], [0.045, 0.03, 0.006]));
    const teeth: ModelPart[] = [];
    for (let tooth = 0; tooth < 7; tooth++) {
      const z = 1.19 + tooth * 0.039;
      teeth.push(needle("巨螯固定指内缘的粗细交替齿", joint, [side * (0.31 - tooth * 0.013), 0.2, z], [side * (0.37 - tooth * 0.014), 0.2, z + 0.008], tooth % 2 ? 0.018 : 0.025), needle("活动指上与固定指交错的齿", joint, [side * (0.41 + Math.sin(tooth / 6 * Math.PI) * 0.09), 0.2, z], [side * (0.36 + Math.sin(tooth / 6 * Math.PI) * 0.09), 0.2, z - 0.005], 0.017));
    }
    parts.push(combineMeshes("一只巨螯两指之间的独立齿列", joint, teeth));
    for (let leg = 0; leg < 4; leg++) parts.push(pointed("头胸两侧的行走附肢", joint, [[side * 0.19, 0.17, 0.7 - leg * 0.075], [side * 0.4, 0.24, 0.8 - leg * 0.18], [side * 0.61, 0.01, 0.85 - leg * 0.26]], [0.023, 0.018, 0.004]));
    parts.push(pointed("第五对后附肢的宽桨柄", joint, [[side * 0.2, 0.16, 0.4], [side * 0.47, 0.12, 0.14]], [0.035, 0.025]), polygon("末对附肢真正宽薄的游泳桨片", carapace, [[side * 0.42, 0.18], [side * 0.59, 0.15], [side * 0.77, -0.02], [side * 0.7, -0.15], [side * 0.5, 0]], 0.018, [0, 0.1, 0]), lobe("头胸甲前外侧的复眼", eye, [side * 0.18, 0.3, 0.79], [0.075, 0.055, 0.11]));
  }
  for (const item of parts) for (const axis of ["x", "y", "z"] as const) { item.position[axis] *= 0.9; item.scale[axis] *= 0.9; }
  return parts;
}

function hibbertopterus(): ModelPart[] {
  const parts = [lobe("前缘横宽的半圆形头胸甲", carapace, [0, 0.23, 0.37], [0.78, 0.23, 0.68])];
  for (let segment = 0; segment < 9; segment++) parts.push(lobe("粗短腹甲向后逐级收束", carapace, [0, 0.19, 0.12 - segment * 0.09], [0.64 - segment * 0.052, 0.2 - segment * 0.012, 0.145]));
  parts.push(pointed("后端短直刺状尾剑", joint, [[0, 0.16, -0.65], [0, 0.13, -1.02]], [0.045, 0.002]));
  for (const side of [-1, 1]) {
    for (let leg = 0; leg < 2; leg++) parts.push(pointed("后部粗壮的承重行走足", joint, [[side * 0.25, 0.22, 0.25 - leg * 0.17], [side * 0.56, 0.35, 0.13 - leg * 0.3], [side * 0.71, 0.01, -0.05 - leg * 0.42]], [0.036, 0.028, 0.006]));
    for (let limbIndex = 0; limbIndex < 3; limbIndex++) {
      const root: Triple = [side * 0.21, 0.18, 0.55 - limbIndex * 0.08], elbow: Triple = [side * (0.33 + limbIndex * 0.08), 0.12, 0.72 - limbIndex * 0.11], tip: Triple = [side * (0.18 + limbIndex * 0.15), 0.06, 0.91 - limbIndex * 0.06];
      parts.push(pointed("向前扫食而非抓握巨螯的前附肢", joint, [root, elbow, tip], [0.027, 0.022, 0.009]));
      const comb: ModelPart[] = [];
      for (let tooth = 0; tooth < 16; tooth++) { const t = (tooth + 1) / 17; const p: Triple = [elbow[0] + (tip[0] - elbow[0]) * t, elbow[1] + (tip[1] - elbow[1]) * t, elbow[2] + (tip[2] - elbow[2]) * t]; comb.push(needle("前附肢上朝向内侧的独立扫食刺", joint, p, [p[0] - side * (0.06 + Math.sin(t * Math.PI) * 0.045), 0.025, p[2] + 0.018], 0.008)); }
      parts.push(combineMeshes("一条完整前附肢的密排扫食刷", joint, comb));
    }
    parts.push(lobe("宽头甲上方的近前缘侧眼", eye, [side * 0.23, 0.31, 0.54], [0.065, 0.04, 0.09]), pointed("口前小螯肢", joint, [[side * 0.035, 0.15, 0.62], [side * 0.045, 0.11, 0.71], [side * 0.02, 0.12, 0.74]], [0.015, 0.015, 0.003]));
  }
  return parts;
}

function magneticMound(): ModelPart[] {
  const parts = [lobe("薄板蚁丘低而不规则的土质基脚", soil, [0, 0.14, 0], [1, 0.28, 2.35]), part("南北狭长而东西两面平阔的磁性白蚁丘", "extrude", soil, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.35, profile: [{ x: -0.9, y: 0 }, { x: -0.87, y: 0.7 }, { x: -0.69, y: 1.8 }, { x: -0.5, y: 2.42 }, { x: -0.28, y: 2.61 }, { x: -0.08, y: 2.53 }, { x: 0.13, y: 2.72 }, { x: 0.33, y: 2.63 }, { x: 0.53, y: 2.25 }, { x: 0.77, y: 1.47 }, { x: 0.92, y: 0.6 }, { x: 0.95, y: 0 }] })];
  for (const side of [-1, 1]) for (let ridge = 0; ridge < 4; ridge++) {
    const z = -0.54 + ridge * 0.36;
    parts.push(tapered("薄板两面的浅起伏泥土筋脊", "#b1a286", [[side * 0.17, 0.12, z], [side * 0.2, 0.9, z * 0.92], [side * 0.18, 1.7, z * 0.8], [side * 0.17, 2.22 - Math.abs(z) * 0.5, z * 0.68]], [0.065, 0.042, 0.033, 0.006]));
  }
  return parts;
}

function sociableWeaverNest(): ModelPart[] {
  const outline: [number, number][] = Array.from({ length: 24 }, (_, index) => [Math.cos(index * Math.PI / 12) * 2.04, Math.sin(index * Math.PI / 12) * 1.1]);
  const holes: [number, number][][] = [];
  const locations: Triple[] = [];
  for (let row = 0; row < 3; row++) for (let column = 0; column < 5; column++) {
    const x = (column - 2) * 0.61, z = (row - 1) * 0.55;
    holes.push(Array.from({ length: 8 }, (_, i) => [x + Math.cos(i * Math.PI / 4) * 0.035, z + Math.sin(i * Math.PI / 4) * 0.035]));
    locations.push([x, 1.45, z]);
  }
  const parts = [tapered("承托共同草顶且避开下方巢口的树干段", wood, [[0, 0, 0.9], [0.1, 1.1, 0.9], [0, 2.45, 0.85]], [0.2, 0.17, 0.09]), tapered("在各巢室上方分出的左承托树叉", wood, [[0.04, 1.95, 0.88], [-1.1, 2.18, 0.45], [-2.1, 2.2, 0.15]], [0.13, 0.09, 0.035]), tapered("在各巢室上方分出的右承托树叉", wood, [[0.04, 1.95, 0.88], [0.95, 2.2, 0.4], [2.1, 2.25, -0.2]], [0.13, 0.09, 0.03]), polygon("下表面留出各巢道真实入口的连续草垫", straw, outline, 0.08, [0, 1.45, 0], holes), part("全群共用而非单巢复制的厚草穹顶", "lathe", straw, [0, 1.57, 0], [1.15, 1, 0.68], [0, 0, 0], { profile: [{ x: 1.8, y: 0 }, { x: 1.9, y: 0.2 }, { x: 1.6, y: 0.65 }, { x: 0.9, y: 1.05 }, { x: 0, y: 1.15 }, { x: 0, y: 1.05 }, { x: 0.8, y: 0.95 }, { x: 1.5, y: 0.58 }, { x: 1.75, y: 0.16 }, { x: 1.7, y: 0 }, { x: 1.8, y: 0 }] })];
  for (const location of locations) parts.push(part("底部窄入口连接内部独立封顶巢室", "lathe", "#aca17c", location, [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.047, y: 0 }, { x: 0.047, y: 0.17 }, { x: 0.083, y: 0.23 }, { x: 0.075, y: 0.34 }, { x: 0, y: 0.39 }, { x: 0, y: 0.375 }, { x: 0.063, y: 0.325 }, { x: 0.07, y: 0.235 }, { x: 0.035, y: 0.17 }, { x: 0.035, y: 0 }, { x: 0.047, y: 0 }] }));
  const fringe: ModelPart[] = [];
  for (let index = 0; index < 60; index++) {
    const angle = index * Math.PI / 30, x = Math.cos(angle) * 2.02, z = Math.sin(angle) * 1.13;
    fringe.push(needle("草顶边缘真实垂下的长草茎束", "#c0b38a", [x * 0.91, 1.88 + index % 4 * 0.045, z * 0.91], [x, 1.25 + index % 3 * 0.055, z], 0.018));
  }
  parts.push(combineMeshes("连续悬垂草顶的编织毛边", "#c0b38a", fringe));
  return parts;
}

function hamerkopNest(): ModelPart[] {
  const parts = [tapered("枝巢下方的粗支承树干", wood, [[0, 0, 0], [0.1, 0.65, 0], [0, 1.1, 0]], [0.16, 0.13, 0.07]), tapered("在巢底分出的左树叉", wood, [[0.1, 0.65, 0], [-0.45, 0.95, 0], [-0.83, 1.18, -0.08]], [0.12, 0.08, 0.025]), tapered("在巢底分出的右树叉", wood, [[0.1, 0.65, 0], [0.48, 0.94, -0.08], [0.8, 1.22, -0.2]], [0.11, 0.075, 0.025]), part("侧入口长隧道直接接入封闭中空巢腔", "lathe", wood, [0, 1.45, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -0.7 }, { x: 0.35, y: -0.6 }, { x: 0.65, y: -0.35 }, { x: 0.76, y: 0 }, { x: 0.7, y: 0.3 }, { x: 0.48, y: 0.45 }, { x: 0.18, y: 0.48 }, { x: 0.14, y: 0.9 }, { x: 0.1, y: 0.9 }, { x: 0.14, y: 0.48 }, { x: 0.42, y: 0.4 }, { x: 0.62, y: 0.25 }, { x: 0.68, y: 0 }, { x: 0.57, y: -0.3 }, { x: 0.28, y: -0.5 }, { x: 0, y: -0.6 }] }), cap("侧隧道后方巢腔底部的育雏草垫", straw, [0, 0.83, -0.05], 0.4, 0.06, 3)];
  for (let index = 0; index < 30; index++) {
    const z = -0.4 + index % 6 * 0.13, angle = index * 2.4;
    const radius = 0.74 * Math.sqrt(1 - z * z / 0.52);
    const endZ = z + 0.09, endRadius = 0.74 * Math.sqrt(1 - endZ * endZ / 0.52);
    parts.push(beam("交错穿插在厚巢壳表面的承重枯枝", index % 3 ? wood : "#a29273", [Math.cos(angle) * radius, 1.45 + Math.sin(angle) * radius, z], [Math.cos(angle + 0.43) * endRadius, 1.45 + Math.sin(angle + 0.43) * endRadius, endZ], 0.025));
  }
  return parts;
}

function malleefowlMound(): ModelPart[] {
  const profile: [number, number][] = [[2.05, 0], [1.68, 0.24], [1.12, 0.65], [0.66, 0.94], [0.33, 0.94], [0.33, 0.08]];
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const [radius, y] of profile) for (let section = 0; section < 24; section++) {
    const angle = section * Math.PI / 12, roughness = 1 + Math.sin(angle * 5 + 0.4) * 0.024 + Math.cos(angle * 3) * 0.018;
    vertices.push({ x: Math.cos(angle) * radius * roughness, y: y * (1 + Math.sin(angle * 3) * 0.035), z: Math.sin(angle) * radius * roughness });
  }
  for (let row = 0; row < profile.length; row++) for (let section = 0; section < 24; section++) {
    const a = row * 24 + section, b = row * 24 + (section + 1) % 24, c = (row + 1) % profile.length * 24 + section, d = (row + 1) % profile.length * 24 + (section + 1) % 24;
    indices.push(a, c, b, b, c, d);
  }
  const parts = [part("保留顶端真实深竖穴的不规则沙土温床丘", "mesh", soil, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), part("竖穴内可见的湿腐叶温床层", "lathe", "#8c856b", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.33, y: 0.08 }, { x: 0.33, y: 0.36 }, { x: 0.3, y: 0.36 }, { x: 0.3, y: 0.08 }, { x: 0.33, y: 0.08 }] })];
  const litter: ModelPart[] = [];
  for (let index = 0; index < 12; index++) {
    const angle = index * 2.4, radius = 0.08 + index % 3 * 0.055;
    litter.push(leaf("底部交错铺叠的湿叶片", "#9a9575", [Math.cos(angle) * radius, 0.08 + index % 3 * 0.012, Math.sin(angle) * radius], 0.1, 0.21, [76, index * 137.5 % 360, 0]));
  }
  parts.push(combineMeshes("竖穴底部真实叶片保温垫", "#9a9575", litter));
  for (let index = 0; index < 9; index++) {
    const angle = index * 2.4, radius = 1.45 + index % 3 * 0.14;
    const points = [[angle, radius], [angle + 0.19, radius + 0.17]].map(([a, r]) => {
      const roughness = 1 + Math.sin(a! * 5 + 0.4) * 0.024 + Math.cos(a! * 3) * 0.018;
      const y = r! > 1.68 ? (2.05 - r!) / 0.37 * 0.24 : 0.24 + (1.68 - r!) / 0.56 * 0.41;
      return [Math.cos(a!) * r! * roughness, y * (1 + Math.sin(a! * 3) * 0.035) + 0.006, Math.sin(a!) * r! * roughness] as Triple;
    });
    parts.push(beam("贴着温床土丘坡面的掺入细枝", wood, points[0]!, points[1]!, 0.016));
  }
  return parts;
}

// 复原头部参考幼体化石；成年节胸虫的眼部细节尚不能由现有证据确定。
// https://www.nhm.ac.uk/discover/news/2024/october/largest-ever-millipede-head-revealed.html
// https://pmc.ncbi.nlm.nih.gov/articles/PMC2412931/
// https://www.paulselden.net/uploads/7/5/3/2/7532217/viseaneurypterids1994.pdf
// https://nt.gov.au/__data/assets/pdf_file/0003/200001/termite-homes.pdf
// https://animals.sandiegozoo.org/animals/sociable-weaver
// https://www.houstonzoo.org/explore/animals/hamerkop/
// https://www.environment.nsw.gov.au/topics/animals-and-plants/native-animals/native-animal-facts/birds/malleefowl
export const giantArthropodExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("arthropleura", "节胸虫", "动物", arthropleura, ["Arthropleura", "古生物形态复原", "三分背板", "双对体节步足"]),
  design("jaekelopterus", "耶克尔鲎", "动物", jaekelopterus, ["Jaekelopterus rhenaniae", "古生物形态复原", "巨型螯肢", "桨状后附肢"]),
  design("hibbertopterus", "希伯特鲎", "动物", hibbertopterus, ["Hibbertopterus scouleri", "古生物形态复原", "扫食刷肢", "宽头甲"]),
  design("magneticTermiteMound", "磁性白蚁薄板丘", "器物", magneticMound, ["Amitermes meridionalis", "动物巢与栖居构造", "狭长薄板泥丘"]),
  design("sociableWeaverRoofNest", "社会织巢鸟公共草顶巢", "器物", sociableWeaverNest, ["Philetairus socius", "动物巢与栖居构造", "共同厚草顶", "底部独立入口"]),
  design("hamerkopEnclosedNest", "锤头鹳巨枝封闭巢", "器物", hamerkopNest, ["Scopus umbretta", "动物巢与栖居构造", "侧隧道", "封闭巢腔"]),
  design("malleefowlIncubatorMound", "眼斑冢雉温床巢丘", "器物", malleefowlMound, ["Leipoa ocellata", "动物巢与栖居构造", "湿叶温床", "真实竖穴"]),
];
