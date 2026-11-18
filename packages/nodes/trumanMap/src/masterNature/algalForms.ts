import { combineMeshes, design, leaf, lobe, needle, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { pointed } from "./insectForms";
import { strip } from "./shapedFoods";

const green = "#899b71";
const pale = "#b3bd91";
const brown = "#a5a180";
const red = "#b39f92";

function holdfast(parts: ModelPart[], width: number) {
  const roots: ModelPart[] = [];
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; roots.push(pointed("藻体固着器分叉的抓附丝", brown, [[0, width * 0.22, 0], [Math.cos(a) * width * 0.45, width * 0.12, Math.sin(a) * width * 0.45], [Math.cos(a + 0.25) * width, 0, Math.sin(a + 0.25) * width]], [width * 0.075, width * 0.045, 0])); } parts.push(combineMeshes("完整藻体固着器", brown, roots));
}

function waterNet(): ModelPart[] {
  const parts: ModelPart[] = [], edges = new Map<string, [Triple, Triple]>(), side = 0.013, radius = side * 6 / Math.PI, dy = side * Math.sqrt(3);
  for (let column = 0; column < 8; column++) for (let row = 0; row < 6; row++) {
    const cy = dy * (row + column % 2 * 0.5) + side;
    const points: Triple[] = Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3, u = column * Math.PI / 4 + Math.cos(a) * side / radius; return [Math.cos(u) * radius, cy + Math.sin(a) * side, Math.sin(u) * radius]; });
    for (let i = 0; i < 6; i++) { const a = points[i]!, b = points[(i + 1) % 6]!, key = [a, b].map(p => p.map(v => Math.round(v * 1e7)).join(",")).sort().join("|"); if (!edges.has(key)) edges.set(key, [a, b]); }
  }
  const cells = [...edges.values()].map(([a, b]) => tapered("水网藻在端部互相连接的长柱状细胞", green, [a, b], [0.00085, 0.00085]));
  for (let i = 0; i < cells.length; i += 24) parts.push(combineMeshes("真正贯通的六角网格群体", green, cells.slice(i, i + 24)));
  return parts;
}

function finelyBranched(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  holdfast(parts, 0.022);
  if (kind === 0) {
    for (let frond = 0; frond < 3; frond++) { const x = (frond - 1) * 0.019; parts.push(tapered("羽枝藻细圆柱状羽轴", green, [[0, 0.005, 0], [x * 0.6, 0.07, 0], [x, 0.15 - frond % 2 * 0.022, 0]], [0.0016, 0.0013, 0.0005]));
      const tips: ModelPart[] = []; for (const side of [-1, 1]) for (let i = 0; i < 17; i++) { const t = (i + 1) / 18, y = 0.025 + t * (0.12 - frond % 2 * 0.022), rootX = y <= 0.07 ? x * 0.6 * (y - 0.005) / 0.065 : x * (0.6 + 0.4 * (y - 0.07) / (0.08 - frond % 2 * 0.022)), length = Math.sin(t * Math.PI) * 0.024; tips.push(pointed("羽轴两侧细而渐尖的圆柱羽枝", pale, [[rootX, y, 0], [rootX + side * length * 0.7, y + 0.005, 0], [rootX + side * length, y + 0.008, 0]], [0.00065, 0.00045, 0])); } for (let i = 0; i < tips.length; i += 24) parts.push(combineMeshes("一段紧接羽轴的纤细羽枝", pale, tips.slice(i, i + 24)));
    }
  } else if (kind === 1) {
    for (let axis = 0; axis < 3; axis++) { const x = (axis - 1) * 0.025; parts.push(strip("石花菜压扁而有韧性的主枝", red, [[0, 0.005, 0], [x * 0.6, 0.07, 0], [x, 0.17, 0]], 0.005, 0.002));
      for (const side of [-1, 1]) { const pieces: ModelPart[] = []; for (let i = 0; i < 7; i++) { const y = 0.035 + i * 0.016, rootX = y <= 0.07 ? x * 0.6 * (y - 0.005) / 0.065 : x * (0.6 + 0.4 * (y - 0.07) / 0.1), length = 0.036 - Math.abs(i - 3) * 0.006, start: Triple = [rootX, y, 0], end: Triple = [rootX + side * length, y + 0.023, 0]; pieces.push(strip("石花菜交替伸出的扁平侧枝", red, [start, end], 0.0035, 0.0014)); for (let j = 0; j < 3; j++) { const t = (j + 1) / 4, p: Triple = [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t, 0]; pieces.push(strip("扁侧枝上的短二级枝", red, [p, [p[0] + side * 0.004, p[1] + 0.012, 0]], 0.0025, 0.001)); } } for (let i = 0; i < pieces.length; i += 24) parts.push(combineMeshes("石花菜一侧完整扁羽片", red, pieces.slice(i, i + 24))); }
    }
  } else if (kind === 2) {
    for (let branch = 0; branch < 5; branch++) { const a = branch * 2.4, end: Triple = [Math.cos(a) * 0.1, 0.14 + branch % 2 * 0.04, Math.sin(a) * 0.08]; parts.push(tapered("棘枝麒麟菜粗圆柱形肉质主枝", red, [[0, 0.005, 0], [end[0] * 0.55, end[1] * 0.5, end[2] * 0.55], end], [0.009, 0.007, 0.004]));
      const spines: ModelPart[] = []; for (let i = 0; i < 16; i++) { const t = (i + 2) / 19, p: Triple = [end[0] * t, end[1] * t, end[2] * t], turn = i * 2.4; spines.push(pointed("肉质圆枝上朝外伸出的短锥形刺枝", pale, [p, [p[0] + Math.cos(turn) * 0.021, p[1] + 0.008, p[2] + Math.sin(turn) * 0.021]], [0.0038, 0])); } parts.push(combineMeshes("麒麟菜每条主枝实际相连的棘枝", pale, spines));
    }
  } else {
    for (let frond = 0; frond < 3; frond++) {
      const x = (frond - 1) * 0.018, end: Triple = [x, 0.14 - frond % 2 * 0.02, 0]; parts.push(tapered("珊瑚藻贯穿钙节的柔性中轴", red, [[0, 0.004, 0], end], [0.0012, 0.0006]));
      const segments: ModelPart[] = [];
      for (let node = 0; node < 9; node++) { const t = (node + 1) / 10, root: Triple = [x * t, end[1] * t, 0]; segments.push(lobe("中央轴两关节间独立的钙化节", pale, root, [0.004, 0.008, 0.003])); for (const side of [-1, 1]) { const tip: Triple = [root[0] + side * (0.026 - Math.abs(node - 4) * 0.004), root[1] + 0.014, 0]; parts.push(tapered("羽状侧枝中贯通节段的柔性关节轴", red, [root, tip], [0.0007, 0.00045])); for (let i = 0; i < 4; i++) { const u = (i + 0.5) / 4; segments.push(lobe("侧枝上由软关节隔开的扁钙节", pale, [root[0] + (tip[0] - root[0]) * u, root[1] + (tip[1] - root[1]) * u, 0], [0.005, 0.003, 0.0025], [0, 0, side * Math.atan2(tip[1] - root[1], Math.abs(tip[0] - root[0])) * 180 / Math.PI])); } } }
      for (let i = 0; i < segments.length; i += 36) parts.push(combineMeshes("珊瑚藻实际分节的钙质羽状体", pale, segments.slice(i, i + 36)));
    }
  }
  return parts;
}

function fernCaulerpa(): ModelPart[] {
  const parts: ModelPart[] = [tapered("蕨状蕨藻沿基底爬行的匍匐轴", green, [[-0.07, 0.005, 0], [0, 0.004, 0], [0.075, 0.006, 0]], [0.003, 0.003, 0.002])];
  for (let shoot = 0; shoot < 4; shoot++) { const x = -0.05 + shoot * 0.033, height = 0.12 + shoot % 2 * 0.04; parts.push(tapered("每条蕨状直立体的中央轴", green, [[x, 0.005, 0], [x, height, 0]], [0.002, 0.0005]));
    const pinnae: ModelPart[] = []; for (let i = 0; i < 17; i++) for (const side of [-1, 1]) pinnae.push(leaf("成对扁平而弯尖的蕨状羽片", pale, [x, 0.015 + i * (height - 0.023) / 17, 0], 0.0035, 0.029 - Math.abs(i - 7) * 0.0025, [0, 0, -side * 72])); parts.push(combineMeshes("每条直立体上完整相对的扁羽片", pale, pinnae));
    for (const side of [-1, 1]) parts.push(pointed("匍匐轴下方抓附的假根", brown, [[x, 0.005, 0], [x + side * 0.01, 0.001, 0.009]], [0.001, 0]));
  }
  return parts;
}

function kelp(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  holdfast(parts, kind === 0 ? 0.08 : 0.24);
  if (kind === 0) {
    parts.push(tapered("裙带菜有明显中肋的长柄", brown, [[0, 0.01, 0], [0, 0.35, 0], [0.04, 1.62, 0]], [0.012, 0.013, 0.003]));
    const margin: [number, number][] = [[0, 0.3]]; for (let i = 0; i < 10; i++) { const y = 0.38 + i * 0.12, w = 0.25 * (1 - i / 11); margin.push([-w, y], [-0.045, y + 0.043]); } margin.push([0.04, 1.64]); for (let i = 9; i >= 0; i--) { const y = 0.38 + i * 0.12, w = 0.25 * (1 - i / 11); margin.push([0.055, y + 0.043], [w, y]); } const blade = polygon("裙带菜连接在中肋两侧的完整羽裂藻片", brown, margin, 0.004); blade.rotation.x = -90; parts.push(blade);
    for (const side of [-1, 1]) { const path: Triple[] = Array.from({ length: 25 }, (_, i) => { const a = i / 24 * Math.PI * 5; return [Math.cos(a) * (0.026 + i * 0.0007), 0.08 + i * 0.008, side * 0.02 + Math.sin(a) * 0.025]; }); parts.push(strip("茎基部真正立体卷褶的生殖孢子叶", red, path, 0.06, 0.003)); }
  } else if (kind === 1) {
    for (let axis = 0; axis < 3; axis++) { const x = (axis - 1) * 0.48, height = 6.5 + axis % 2 * 1.2, path: Triple[] = [[0, 0.02, 0], [x * 0.25, height * 0.35, 0.08], [x * 0.7, height * 0.72, -0.06], [x, height, 0]]; parts.push(tapered("巨藻由固着器伸出的长鞭状茎", brown, path, [0.022, 0.019, 0.014, 0.008]));
      for (let node = 0; node < 7; node++) { const t = (node + 1) / 8, y = height * t, segment = t < 0.35 ? 0 : t < 0.72 ? 1 : 2, a = path[segment]!, b = path[segment + 1]!, u = (y - a[1]) / (b[1] - a[1]), root: Triple = [a[0] + (b[0] - a[0]) * u, y, a[2] + (b[2] - a[2]) * u], side = node % 2 ? 1 : -1; parts.push(tapered("逐叶与主茎连接的短叶柄", brown, [root, [root[0] + side * 0.09, y + 0.025, root[2]]], [0.008, 0.005]), lobe("每片叶状体基部独立的气囊", pale, [root[0] + side * 0.09, y + 0.025, root[2]], [0.075, 0.045, 0.045])); const leafPath: Triple[] = Array.from({ length: 17 }, (_, i) => [root[0] + side * (0.1 + i * 0.045), y + Math.sin(i / 16 * Math.PI) * 0.14 - i * 0.012, root[2] + Math.sin(i * 0.55) * 0.045]); parts.push(strip("巨藻沿长茎逐节分布的长叶状藻片", brown, leafPath, 0.14, 0.005)); }
    }
  } else {
    parts.push(tapered("牛尾藻从基部到顶端唯一的细长柄", brown, [[0, 0.02, 0], [-0.12, 3.3, 0.03], [0.2, 6.8, 0.08], [0.08, 9.2, 0]], [0.035, 0.026, 0.018, 0.028]), lobe("全部叶状体集中着生处的单个大气囊", pale, [0.08, 9.21, 0], [0.26, 0.3, 0.26]));
    for (let i = 0; i < 16; i++) { const a = i * 2.4, path: Triple[] = Array.from({ length: 17 }, (_, j) => { const t = j / 16, r = Math.sin(t * Math.PI * 0.65) * (0.7 + i % 3 * 0.12); return [0.08 + Math.cos(a) * r, 9.32 + Math.sin(t * Math.PI) * 0.3 - t * (1.9 + i % 3 * 0.2), Math.sin(a) * r]; }); parts.push(strip("气囊顶端向四周垂下的连续长带叶", brown, path, 0.12, 0.005)); }
  }
  return parts;
}

function remaining(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    holdfast(parts, 0.015);
    for (let branch = 0; branch < 3; branch++) { const outline: [number, number][] = [[-0.003, 0], [-0.009, 0.03], [-0.043, 0.061], [-0.047, 0.093], [-0.024, 0.085], [-0.018, 0.137], [-0.002, 0.112], [0.013, 0.164], [0.026, 0.148], [0.018, 0.096], [0.044, 0.125], [0.048, 0.095], [0.023, 0.043], [0.006, 0]]; const p = polygon("掌状红皮藻厚而扁的掌裂藻片", red, outline, 0.0025); p.rotation = { x: -90, y: 0, z: (branch - 1) * 45 }; p.position.z = (branch - 1) * 0.009; parts.push(p); }
  } else if (kind === 1) {
    const bladder = sweptProfile("泡囊藻单个巨型细胞的薄壁与实际内腔", green, [[0, 0], [0.018, 0.005], [0.03, 0.025], [0.027, 0.047], [0.014, 0.058], [0, 0.061], [0, 0.059], [0.013, 0.056], [0.025, 0.046], [0.028, 0.025], [0.017, 0.007], [0, 0.002]], Math.PI * 2, 24); bladder.opacity = 0.62; bladder.roughness = 0.24; parts.push(bladder);
    const roots: ModelPart[] = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; roots.push(pointed("大单细胞基部与基底相连的假根", pale, [[0, 0.003, 0], [Math.cos(a) * 0.014, 0.001, Math.sin(a) * 0.014], [Math.cos(a + 0.4) * 0.025, 0, Math.sin(a + 0.4) * 0.025]], [0.0012, 0.0007, 0])); } parts.push(combineMeshes("泡囊藻基部真正连接的附着丝", pale, roots));
  } else if (kind === 2) {
    parts.push(tapered("串珠藻胶质体中的细长主轴", red, [[0, 0.002, 0], [0, 0.12, 0]], [0.001, 0.0005]));
    for (let node = 0; node < 12; node++) { const root: Triple = [0, 0.008 + node * 0.009, 0], shoots: ModelPart[] = []; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, end: Triple = [Math.cos(a) * 0.011, root[1] + 0.003, Math.sin(a) * 0.011]; shoots.push(pointed("每一轮珠状短枝的放射细轴", red, [root, end], [0.0005, 0])); for (const side of [-1, 1]) shoots.push(pointed("形成胶质珠团的二叉细末枝", pale, [[end[0] * 0.6, root[1] + 0.002, end[2] * 0.6], [end[0] + Math.cos(a + side) * 0.003, root[1] + 0.006, end[2] + Math.sin(a + side) * 0.003]], [0.00035, 0])); } parts.push(combineMeshes("串珠藻一轮球状分枝簇", pale, shoots)); }
  } else {
    parts.push(tapered("轮藻节与节之间裸露的长轴", green, [[0, 0, 0], [0.008, 0.32, 0]], [0.0025, 0.0008]));
    for (let node = 0; node < 6; node++) { const y = 0.045 + node * 0.045, rootX = 0.008 * y / 0.32; const branches: ModelPart[] = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, length = 0.065 - node * 0.007, root: Triple = [rootX, y, 0], end: Triple = [rootX + Math.cos(a) * length, y + length * 0.28, Math.sin(a) * length]; branches.push(pointed("节部轮生且有分节的侧枝", green, [root, end], [0.0012, 0])); for (let j = 1; j < 4; j++) { const t = j / 4, p: Triple = [root[0] + (end[0] - root[0]) * t, root[1] + (end[1] - root[1]) * t, root[2] + (end[2] - root[2]) * t]; branches.push(needle("侧枝节部短小的苞枝", pale, p, [p[0] + Math.cos(a + 0.8) * 0.008, p[1] + 0.009, p[2] + Math.sin(a + 0.8) * 0.008], 0.0009)); } } parts.push(combineMeshes("轮藻一节的完整分枝轮", green, branches));
      const root: Triple = [rootX + 0.004, y + 0.003, 0.003]; parts.push(lobe("枝节侧方球形的精子囊", red, root, [0.004, 0.004, 0.004]), lobe("精子囊上方的卵形藏卵器", pale, [root[0], root[1] + 0.005, root[2]], [0.0034, 0.006, 0.0034])); const spiral: Triple[] = Array.from({ length: 15 }, (_, i) => { const a = i / 14 * Math.PI * 4; return [root[0] + Math.cos(a) * 0.0015, root[1] + 0.0025 + i * 0.00035, root[2] + Math.sin(a) * 0.0015]; }); parts.push(tapered("藏卵器外真正盘绕的螺旋包被细胞", brown, spiral, spiral.map(() => 0.00035)));
    }
  }
  return parts;
}

export const algalFormDesigns: MasterNatureDesign[] = [
  design("hydrodictyon", "水网藻", "植物", waterNet, ["Hydrodictyon reticulatum", "绿藻", "真实网状群体"]),
  design("bryopsis", "羽枝藻", "植物", () => finelyBranched(0), ["Bryopsis", "绿藻", "圆柱羽枝"]),
  design("gelidium", "石花菜", "植物", () => finelyBranched(1), ["Gelidium", "红藻", "扁平羽枝"]),
  design("eucheuma", "棘枝麒麟菜", "植物", () => finelyBranched(2), ["Eucheuma denticulatum", "红藻", "肉质棘枝"]),
  design("corallina", "珊瑚藻", "植物", () => finelyBranched(3), ["Corallina officinalis", "红藻", "钙化关节"]),
  design("fernCaulerpa", "蕨状蕨藻", "植物", fernCaulerpa, ["Caulerpa taxifolia", "绿藻", "扁平对生羽片"]),
  design("undaria", "裙带菜", "植物", () => kelp(0), ["Undaria pinnatifida", "褐藻", "基部卷褶孢子叶"]),
  design("macrocystis", "巨藻", "植物", () => kelp(1), ["Macrocystis pyrifera", "褐藻", "逐叶独立气囊"]),
  design("nereocystis", "牛尾藻", "植物", () => kelp(2), ["Nereocystis luetkeana", "褐藻", "顶端单气囊"]),
  design("palmaria", "掌状红皮藻", "植物", () => remaining(0), ["Palmaria palmata", "红藻", "掌裂薄体"]),
  design("ventricaria", "泡囊藻", "植物", () => remaining(1), ["Ventricaria ventricosa", "绿藻", "巨型单细胞"]),
  design("batrachospermum", "串珠藻", "植物", () => remaining(2), ["Batrachospermum", "红藻", "珠状短枝轮"]),
  design("chara", "轮藻", "植物", () => remaining(3), ["Chara", "轮藻", "轮生枝与螺旋藏卵器"]),
];
