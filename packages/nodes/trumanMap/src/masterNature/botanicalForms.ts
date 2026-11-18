import { Euler, Quaternion, Vector3 } from "three";
import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, petals, polygon, tapered } from "./shared";
import { compoundLeaf, flatLeaf } from "./ediblePlants";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const green = "#94a580";
const pale = "#b7c19e";
const stalk = "#a7ac8b";
const bloom = "#d0c6ac";

function basalFan(parts: ModelPart[], count: number, width: number, length: number) {
  for (let i = 0; i < count; i++) parts.push(leaf("从地表套叠的带状基生叶", green, [0, i * 0.004, 0], width, length - i % 3 * length * 0.1, [15 + Math.floor(i / 2) * 8, i % 2 * 180, (i % 2 ? -1 : 1) * Math.floor(i / 2) * 8]));
}

function trumpet(root: Triple, radius: number, length: number, down = false): ModelPart[] {
  const tube = cap("合生花被的开口喇叭花筒", bloom, root, radius, length, 3); tube.rotation.x = down ? 180 : 0;
  const y = root[1] + (down ? -length : length);
  return [tube, petals(5, [root[0], y, root[2]], radius * 0.65, radius * 0.8, down ? 105 : 75, bloom)];
}

function flowerShapes(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0 || kind === 1) {
    const woody = kind === 0; const height = woody ? 1.7 : 0.8;
    parts.push(tapered(woody ? "木本曼陀罗分叉木干" : "曼陀罗直立草质茎", stalk, [[0, 0, 0], [0, height * 0.5, 0], [0.02, height, 0]], [woody ? 0.055 : 0.015, woody ? 0.035 : 0.01, 0.005]));
    for (let i = 0; i < 6; i++) { const a = i * 2.4, y = height * (0.25 + i * 0.1); const p: Triple = [Math.cos(a) * (woody ? 0.38 : 0.16), y + 0.12, Math.sin(a) * (woody ? 0.38 : 0.16)]; parts.push(beam("叶腋伸出的分枝", stalk, [0, y, 0], p, woody ? 0.014 : 0.005), flatLeaf(woody ? "木本曼陀罗大型卵状全缘叶" : "曼陀罗浅波齿卵形叶", p, [p[0] * 1.6, p[1] + 0.1, p[2] * 1.6], woody ? 0.22 : 0.15, woody ? "oval" : "lobed")); if (i % 2 === 0) parts.push(...trumpet(p, woody ? 0.07 : 0.045, woody ? 0.24 : 0.16, woody)); }
    if (!woody) { const p: Triple = [0.12, 0.43, 0.05]; parts.push(beam("曼陀罗球状蒴果短柄", stalk, [0, 0.39, 0], p, 0.004), lobe("曼陀罗有短刺的蒴果", green, p, [0.055, 0.055, 0.055])); const prickles: ModelPart[] = []; for (let i = 0; i < 30; i++) { const a = i * 2.4, y = -0.018 + i % 6 * 0.007, r = Math.sqrt(Math.max(0.00005, 0.025 ** 2 - y ** 2)); const root: Triple = [p[0] + Math.cos(a) * r, p[1] + y, p[2] + Math.sin(a) * r]; prickles.push(needle("果表短棘", pale, root, [p[0] + (root[0] - p[0]) * 1.15, root[1] + 0.004, p[2] + (root[2] - p[2]) * 1.15], 0.0025)); } parts.push(combineMeshes("自然蒴果的完整短刺表面", pale, prickles)); }
  } else if (kind === 2 || kind === 3) {
    basalFan(parts, kind === 2 ? 10 : 6, kind === 2 ? 0.075 : 0.045, kind === 2 ? 0.48 : 0.38);
    const height = kind === 2 ? 0.49 : 0.55; parts.push(beam("粗壮无叶花葶", stalk, [0, 0, 0], [0, height, 0], 0.014));
    for (let i = 0; i < (kind === 2 ? 8 : 4); i++) { const a = i * Math.PI * 2 / (kind === 2 ? 8 : 4), r = kind === 2 ? 0.06 : 0.08; const p: Triple = [Math.cos(a) * r, height + 0.015, Math.sin(a) * r]; parts.push(beam("伞形花序单花梗", stalk, [0, height, 0], p, 0.003)); if (kind === 2) parts.push(...trumpet(p, 0.018, 0.04)); else parts.push(petals(6, p, 0.06, 0.12, 60, bloom), ...[-1, 0, 1].map(side => needle("朱顶红伸出花喉的长雄蕊", pale, p, [p[0] + side * 0.015, p[1] + 0.075, p[2] + 0.035], 0.002))); }
  } else if (kind === 4) {
    for (let i = 0; i < 5; i++) parts.push(flatLeaf("火球花具假茎的宽长叶", [0, 0.04 + i * 0.014, 0], [Math.cos(i * 2.4) * 0.23, 0.2, Math.sin(i * 2.4) * 0.23], 0.085));
    parts.push(beam("火球花花葶", stalk, [0, 0, 0], [0, 0.44, 0], 0.012));
    const rays: ModelPart[] = [], tips: ModelPart[] = [];
    for (let i = 0; i < 36; i++) { const a = i * 2.4, y = -0.07 + i / 35 * 0.14, r = Math.sqrt(0.075 ** 2 - y ** 2); const end: Triple = [Math.cos(a) * r, 0.47 + y, Math.sin(a) * r]; rays.push(needle("伞形花序辐射的长雄蕊", bloom, [0, 0.46, 0], end, 0.0018)); tips.push(lobe("分立小花药", pale, end, [0.0035, 0.0025, 0.0035])); }
    parts.push(combineMeshes("火球花完整放射雄蕊球", bloom, rays), combineMeshes("球面所有分离花药", pale, tips));
  } else if (kind === 5) {
    basalFan(parts, 12, 0.035, 0.52); parts.push(beam("独尾草挺拔无分枝花葶", stalk, [0, 0, 0], [0, 1.35, 0], 0.009));
    for (let i = 0; i < 26; i++) { const a = i * 2.4, y = 0.65 + i * 0.025, r = 0.035 * (1 - i / 32); const p: Triple = [Math.cos(a) * r, y, Math.sin(a) * r]; parts.push(beam("圆柱总状花序短花梗", stalk, [0, y, 0], p, 0.0015), petals(6, p, 0.008, 0.018, 70, bloom)); }
  } else if (kind === 6) {
    basalFan(parts, 10, 0.015, 0.65);
    for (let axis = 0; axis < 3; axis++) { const side = axis - 1; parts.push(tapered("钓竿花高伸后弯垂的弹性花轴", stalk, [[0, 0, 0], [side * 0.12, 0.65, 0], [0.32 + side * 0.12, 0.9, axis * 0.07], [0.62 + side * 0.07, 0.64, axis * 0.1]], [0.003, 0.0025, 0.0018, 0.001])); for (let i = 0; i < 4; i++) { const p: Triple = [0.28 + side * 0.1 + i * 0.09, 0.83 - i * 0.055, axis * 0.08]; parts.push(...trumpet(p, 0.018, 0.045, true)); } }
  } else if (kind === 7) {
    parts.push(beam("宫灯百合纤细直立茎", stalk, [0, 0, 0], [0, 0.75, 0], 0.005));
    for (let i = 0; i < 8; i++) { const y = 0.1 + i * 0.075; parts.push(leaf("宫灯百合尖端延长的披针叶", green, [0, y, 0], 0.025, 0.13, [40, i * 137.5, 0])); if (i > 2) { const side = i % 2 ? -1 : 1, root: Triple = [side * 0.065, y - 0.03, 0]; parts.push(tapered("叶腋弯垂的宫灯花柄", stalk, [[0, y, 0], [side * 0.06, y + 0.025, 0], root], [0.002, 0.0015, 0.001]), part("宫灯百合合瓣的鼓腹灯笼花", "lathe", "#c0ad90", root, [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.004, y: 0 }, { x: 0.015, y: -0.012 }, { x: 0.018, y: -0.032 }, { x: 0.009, y: -0.046 }, { x: 0.006, y: -0.046 }, { x: 0.014, y: -0.03 }, { x: 0.011, y: -0.015 }, { x: 0.003, y: -0.002 }] })); } }
  } else if (kind === 8) {
    basalFan(parts, 5, 0.025, 0.28); parts.push(beam("海星鸢尾短花葶", stalk, [0, 0, 0], [0, 0.27, 0], 0.005));
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const p: Triple = [Math.cos(a) * 0.018, 0.28, Math.sin(a) * 0.018]; const outline: [number, number][] = [[0, 0], [-0.018, 0.017], [-0.012, 0.027], [-0.02, 0.036], [-0.01, 0.046], [0, 0.052], [0.01, 0.046], [0.02, 0.036], [0.012, 0.027], [0.018, 0.017]]; const value = polygon("海星鸢尾深褶波齿花被裂片", bloom, outline, 0.0018, p); value.rotation.y = -a * 180 / Math.PI; parts.push(value, leaf("花被外缘反折的褶边", pale, p, 0.035, 0.055, [105, -a * 180 / Math.PI, 0])); }
    parts.push(lobe("花喉中央分枝花柱基部", "#a79a83", [0, 0.29, 0], [0.017, 0.019, 0.017]));
  } else {
    parts.push(beam("大龙芋斑纹肉质假茎", stalk, [0, 0, 0], [0, 0.65, 0], 0.028));
    for (let i = 0; i < 4; i++) parts.push(compoundLeaf([0, 0.25 + i * 0.09, 0], i * 137.5, 0.43, 3, true));
    const spathe = cap("大龙芋佛焰苞下部包卷的短筒", "#ab9c8e", [0, 0.6, 0], 0.055, 0.12, 3); parts.push(spathe, leaf("佛焰苞单侧高伸的披针形上部", "#ab9c8e", [0, 0.65, -0.035], 0.2, 0.4, [12, 0, 0]), tapered("高出佛焰苞的暗色长肉穗附属体", "#9a9889", [[0, 0.65, 0], [0, 0.92, 0], [0.01, 1.18, 0]], [0.022, 0.018, 0.002]));
  }
  return parts;
}

function foliage(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(tapered("海芋可见地上短假茎", stalk, [[0, 0, 0], [0, 0.25, 0]], [0.055, 0.04]));
    for (let i = 0; i < 6; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.33, 0.8 + i % 3 * 0.13, Math.sin(a) * 0.33]; parts.push(tapered("海芋长而粗壮的肉质叶柄", stalk, [[0, 0.12, 0], p], [0.022, 0.011]), flatLeaf("海芋箭状叶基部相离的耳裂", p, [p[0] * 2.4, p[1] + 0.1, p[2] * 2.4], 0.53, "arrow")); }
  } else if (kind === 1) {
    parts.push(tapered("羽裂蔓绿绒攀援茎", stalk, [[0, 0, 0], [0.035, 0.5, 0], [0, 1.1, 0]], [0.018, 0.012, 0.004]));
    for (let i = 0; i < 6; i++) { const a = i * 2.4, y = 0.18 + i * 0.15; const p: Triple = [Math.cos(a) * 0.12, y + 0.05, Math.sin(a) * 0.12]; parts.push(beam("裂叶蔓绿绒长叶柄", stalk, [0, y, 0], p, 0.004), flatLeaf("羽裂蔓绿绒单一叶身的侧裂片", p, [p[0] * 3.1, p[1] + 0.08, p[2] * 3.1], 0.22, "lobed"), tapered("茎节上外露的附着气根", pale, [[0.01, y, 0], [-0.025, y - 0.07, 0], [-0.03, y - 0.11, 0.01]], [0.0025, 0.002, 0.001])); }
  } else if (kind === 2) {
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4; const length = 0.65 - i % 3 * 0.08; const blade = leaf("鸟巢花烛直立而上部外展的宽波状叶", green, [0, 0.02, 0], 0.16, length, [25 + i % 3 * 10, -a * 180 / Math.PI, 0]); parts.push(blade);
      const rotation = new Quaternion().setFromEuler(new Euler(blade.rotation.x * Math.PI / 180, blade.rotation.y * Math.PI / 180, 0));
      const world = (p: Triple): Triple => { const q = new Vector3(...p).applyQuaternion(rotation); return [q.x, q.y + 0.02, q.z]; };
      const veins: ModelPart[] = [];
      for (let j = 0; j < 5; j++) { const t = 0.2 + j * 0.13; const z = t < 0.48 ? 0.0224 * t / 0.48 : 0.0224 - (t - 0.48) * 0.0246; for (const side of [-1, 1]) veins.push(needle("附着叶面的低凸侧脉", pale, world([0, length * t, z + 0.0007]), world([side * 0.055 * Math.sin(t * Math.PI), length * (t + 0.025), z * 0.26 + 0.0007]), 0.0012)); }
      parts.push(combineMeshes("每片叶自身坐标内的侧脉", pale, veins));
    }
  } else if (kind === 3 || kind === 4) {
    const path: Triple[] = [[-0.17, 0.014, 0], [-0.06, 0.019, 0.015], [0.08, 0.014, 0], [0.18, 0.015, 0.03]];
    parts.push(tapered(kind === 3 ? "兔脚蕨可见的地表匍匐根茎" : "袋鼠爪蕨可见的匍匐根茎", "#aaa184", path, [0.011, 0.012, 0.009, 0.006]));
    for (let i = 0; i < 6; i++) { const a = i * 2.4; const root: Triple = [-0.12 + i * 0.05, 0.02, 0]; const p: Triple = [root[0] + Math.cos(a) * 0.06, 0.22, Math.sin(a) * 0.06]; parts.push(beam("从根茎伸出的蕨叶叶柄", stalk, root, p, 0.003)); if (kind === 4) parts.push(flatLeaf("袋鼠爪蕨单叶的长指状裂片", p, [p[0] + Math.cos(a) * 0.22, 0.36, p[2] + Math.sin(a) * 0.22], 0.16, "palm")); else { const tip: Triple = [p[0] + Math.cos(a) * 0.22, 0.38, p[2] + Math.sin(a) * 0.22]; parts.push(beam("兔脚蕨三角叶身的中轴", stalk, p, tip, 0.002)); for (let row = 0; row < 4; row++) { const t = row / 4; const q: Triple = [p[0] + (tip[0] - p[0]) * t, p[1] + (tip[1] - p[1]) * t, p[2] + (tip[2] - p[2]) * t]; for (const side of [-1, 1]) parts.push(compoundLeaf(q, i * 137.5 + side * 75, 0.11 - row * 0.018, 2)); } } }
    if (kind === 3) { const hairs: ModelPart[] = []; for (let i = 0; i < 36; i++) { const x = -0.16 + i * 0.009; hairs.push(needle("附生根茎表面的棕色短绒毛", pale, [x, 0.02, 0], [x, 0.031, i % 2 ? 0.009 : -0.009], 0.001)); } parts.push(combineMeshes("兔脚根茎的完整毛被", pale, hairs)); }
  } else {
    const fork = (root: Triple, heading: number, length: number, level: number) => { const end: Triple = [root[0] + Math.cos(heading) * length * 0.28, root[1] + length, root[2] + Math.sin(heading) * length * 0.28]; parts.push(tapered("松叶蕨无叶的二叉绿茎", green, [root, end], [0.0028 - level * 0.0006, 0.002 - level * 0.0004])); if (level < 3) for (const side of [-1, 1]) fork(end, heading + side * 0.8, length * 0.65, level + 1); if (level > 0) for (let i = 0; i < 3; i++) parts.push(lobe("茎节处三个融合的孢子囊", "#b9b58d", [end[0] + Math.cos(i * Math.PI * 2 / 3) * 0.002, end[1] - 0.008, end[2] + Math.sin(i * Math.PI * 2 / 3) * 0.002], [0.004, 0.004, 0.004])); };
    fork([0, 0, 0], 0, 0.12, 0);
  }
  return parts;
}

function smallForms(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (let i = 0; i < 9; i++) { const a = i * 2.4, r = Math.sqrt(i) * 0.008, x = Math.cos(a) * r, z = Math.sin(a) * r; parts.push(beam("水苔无中肋的直立主轴", stalk, [x, 0, z], [x, 0.055, z], 0.0015)); const leaves: ModelPart[] = []; for (let row = 0; row < 4; row++) for (let j = 0; j < 5; j++) leaves.push(leaf("水苔主轴分枝上的微小覆瓦叶", green, [x, 0.016 + row * 0.01, z], 0.004, 0.011, [60, j * 72 + row * 17, 0])); parts.push(combineMeshes("水苔单株的侧枝簇叶", green, leaves), petals(9, [x, 0.055, z], 0.006, 0.015, 65, pale)); }
  } else if (kind === 1) {
    const fork = (root: Triple, heading: number, length: number, level: number) => { const end: Triple = [root[0] + Math.cos(heading) * length, root[1], root[2] + Math.sin(heading) * length]; const branch = polygon("鹿角苔无根二歧的扁平叶状体", green, [[-0.00125, 0], [0.00125, 0], [0.00125, length], [-0.00125, length]], 0.001, root); branch.rotation.y = 90 - heading * 180 / Math.PI; parts.push(branch); if (level < 4) for (const side of [-1, 1]) fork(end, heading + side * 0.55, length * 0.7, level + 1); };
    fork([0, 0, 0], 0, 0.02, 0);
  } else if (kind === 2) {
    parts.push(beam("银扇草直立结实茎", stalk, [0, 0, 0], [0, 0.85, 0], 0.005));
    for (let i = 0; i < 5; i++) { const side = i % 2 ? -1 : 1; parts.push(flatLeaf("银扇草粗齿心状叶", [0, 0.06 + i * 0.08, 0], [side * 0.19, 0.15 + i * 0.08, 0], 0.13, "heart")); }
    for (let i = 0; i < 8; i++) { const side = i % 2 ? -1 : 1, p: Triple = [side * (0.07 + i % 3 * 0.025), 0.4 + i * 0.052, 0]; parts.push(beam("银币状果实的细长果梗", stalk, [0, p[1] - 0.035, 0], p, 0.0018)); const value = lobe("银扇草扁圆荚果的宿存隔膜", "#c9cbb0", p, [0.045, 0.052, 0.0015]); parts.push(value); }
  } else {
    parts.push(beam("起绒草带棱的高茎", stalk, [0, 0, 0], [0, 1.1, 0], 0.01));
    for (let row = 0; row < 4; row++) for (const side of [-1, 1]) parts.push(flatLeaf("起绒草对生基部合抱的长叶", [0, 0.07 + row * 0.2, 0], [side * (0.3 - row * 0.035), 0.15 + row * 0.2, 0.025], 0.095));
    for (const side of [-1, 0, 1]) { const p: Triple = [side * 0.15, side === 0 ? 1.08 : 0.9, 0]; parts.push(beam("起绒草头状花序分枝", stalk, [0, 0.72, 0], p, 0.004), lobe("起绒草长卵柱状的总苞头", green, p, [0.045, 0.075, 0.045])); const scales: ModelPart[] = []; for (let i = 0; i < 36; i++) { const a = i * 2.4, y = -0.027 + i % 6 * 0.011, r = 0.018 * Math.sin((i % 6 + 1) / 7 * Math.PI); const root: Triple = [p[0] + Math.cos(a) * r, p[1] + y, Math.sin(a) * r]; scales.push(needle("头状花序伸直的刚硬苞片喙尖", pale, root, [p[0] + Math.cos(a) * (r + 0.01), root[1] + 0.008, Math.sin(a) * (r + 0.01)], 0.002)); } parts.push(combineMeshes("起绒草总苞的完整放射刚尖", pale, scales)); for (let i = 0; i < 5; i++) parts.push(leaf("长于花序并向上弧抱的总苞片", green, [p[0], p[1] - 0.04, 0], 0.009, 0.1, [15, i * 72, 0])); }
  }
  return parts;
}

const flowerNames = [["brugmansia", "木本曼陀罗", "Brugmansia suaveolens"], ["datura", "曼陀罗", "Datura metel"], ["clivia", "君子兰", "Clivia miniata"], ["hippeastrum", "朱顶红", "Hippeastrum"], ["scadoxus", "火球花", "Scadoxus multiflorus"], ["eremurus", "独尾草", "Eremurus"], ["dierama", "钓竿花", "Dierama"], ["sandersonia", "宫灯百合", "Sandersonia aurantiaca"], ["ferraria", "海星鸢尾", "Ferraria crispa"], ["dracunculus", "大龙芋", "Dracunculus vulgaris"]];
const foliageNames = [["alocasiaMacrorrhizos", "海芋", "Alocasia macrorrhizos"], ["philodendronPedatum", "羽裂蔓绿绒", "Philodendron pedatum"], ["anthuriumSuperbum", "鸟巢花烛", "Anthurium superbum"], ["davallia", "兔脚蕨", "Davallia fejeensis"], ["kangarooFern", "袋鼠爪蕨", "Microsorum diversifolium"], ["psilotum", "松叶蕨", "Psilotum nudum"]];
const smallNames = [["sphagnum", "水苔", "Sphagnum"], ["riccia", "鹿角苔", "Riccia fluitans"], ["lunaria", "银扇草", "Lunaria annua"], ["fullersTeasel", "起绒草", "Dipsacus fullonum"]];

export const botanicalFormDesigns: MasterNatureDesign[] = [
  ...flowerNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => flowerShapes(i), ["观赏植物", taxon!])),
  ...foliageNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => foliage(i), ["叶形与孢子植物", taxon!])),
  ...smallNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => smallForms(i), ["原生植物形态", taxon!])),
];
