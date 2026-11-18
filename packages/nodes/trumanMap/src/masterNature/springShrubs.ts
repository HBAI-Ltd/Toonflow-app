import { combineMeshes, design, leaf, lobe, needle, part, petals, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";

const green = "#8f9e7b";
const bark = "#a59f8b";
const cream = "#d3cfb5";
const pink = "#c7b2b1";

export function stemPoint(path: Triple[], t: number): Triple {
  const n = t * (path.length - 1), i = Math.min(path.length - 2, Math.floor(n)), u = n - i;
  return path[i]!.map((v, axis) => v + (path[i + 1]![axis]! - v) * u) as Triple;
}

function goldenBell(): ModelPart[] {
  const paths: Triple[][] = [[[0, 0, 0], [-0.05, 0.78, 0], [-0.28, 1.35, 0.09]], [[0, 0.39, 0], [0.26, 0.95, 0], [0.39, 1.16, 0.18]], [[-0.02, 0.69, 0], [0.01, 1.25, -0.17], [0.08, 1.56, -0.3]]], parts: ModelPart[] = [];
  paths.forEach((path, branch) => {
    parts.push(tapered("金铃花分叉而非一圈等长枝的木质茎", bark, path, [branch ? 0.009 : 0.018, 0.007, 0.0025]));
    for (let node = 0; node < 5; node++) {
      const p = stemPoint(path, 0.28 + node * 0.135), a = branch * 2.1 + node * 2.4, petiole: Triple = [p[0] + Math.cos(a) * 0.05, p[1] + 0.015, p[2] + Math.sin(a) * 0.05];
      parts.push(needle("金铃花互生的长叶柄", green, p, petiole, 0.003), flatLeaf("金铃花有掌状裂缘的宽叶", petiole, [petiole[0] + Math.cos(a) * 0.12, petiole[1] + 0.02, petiole[2] + Math.sin(a) * 0.12], 0.11, "palm"));
      if (node % 2) continue;
      const flower: Triple = [p[0] + Math.cos(a + 1) * 0.075, p[1] - 0.055, p[2] + Math.sin(a + 1) * 0.075];
      parts.push(tapered("金铃花叶腋细梗末端真正下垂的单花", green, [p, [flower[0], p[1] - 0.01, flower[2]], flower], [0.0015, 0.0013, 0.0008]));
      const cup = sweptProfile("金铃花悬钟状合拢的花瓣基部与开放钟口", pink, [[0.003, 0], [0.012, 0.018], [0.025, 0.048], [0.023, 0.048], [0.01, 0.018], [0.0015, 0]], Math.PI * 2, 16); cup.position = { x: flower[0], y: flower[1], z: flower[2] }; cup.rotation.x = 180; parts.push(cup);
      const seams: ModelPart[] = [];
      for (let i = 0; i < 5; i++) { const b = i * Math.PI * 2 / 5; seams.push(leaf("金铃花钟口可辨的五片花瓣末端", pink, [flower[0] + Math.cos(b) * 0.019, flower[1] - 0.039, flower[2] + Math.sin(b) * 0.019], 0.023, 0.017, [143, 90 - i * 72, 0]), needle("钟状花萼上五条相连的萼齿", green, flower, [flower[0] + Math.cos(b) * 0.009, flower[1] - 0.013, flower[2] + Math.sin(b) * 0.009], 0.003)); }
      parts.push(combineMeshes("金铃花开放钟缘与五萼齿", pink, seams), tapered("金铃花穿过钟口后继续下伸的蕊柱", cream, [flower, [flower[0], flower[1] - 0.062, flower[2]]], [0.0011, 0.0009]), lobe("蕊柱末端的花药团", cream, [flower[0], flower[1] - 0.06, flower[2]], [0.007, 0.009, 0.007]));
    }
  });
  return parts;
}

function weigela(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let branch = 0; branch < 4; branch++) {
    const a = branch * 2.4, path: Triple[] = [[0, 0, 0], [Math.cos(a) * 0.26, 1.15, Math.sin(a) * 0.26], [Math.cos(a) * 0.65, 1.45 - branch % 2 * 0.18, Math.sin(a) * 0.65]]; parts.push(tapered("锦带花由基部抽生的弧形主枝", bark, path, [0.024, 0.01, 0.003]));
    const leaves: ModelPart[] = [], stalks: ModelPart[] = [];
    for (let node = 0; node < 5; node++) for (const side of [-1, 1]) {
      const p = stemPoint(path, 0.3 + node * 0.14), b = a + side * 1.1, end: Triple = [p[0] + Math.cos(b) * 0.105, p[1] + 0.025, p[2] + Math.sin(b) * 0.105]; leaves.push(flatLeaf("锦带花交互对生的尖卵形叶", p, end, 0.044));
      if (node % 2) continue;
      const flower: Triple = [p[0] + Math.cos(b) * 0.012, p[1] + 0.005, p[2] + Math.sin(b) * 0.012]; stalks.push(needle("锦带花从叶腋伸出的独立短花柄", green, p, flower, 0.0012)); parts.push(smallCorolla(flower, [Math.cos(b), 0.2, Math.sin(b)], 0.029, 0.0095, pink));
    }
    parts.push(combineMeshes("锦带花沿弧枝排列的对生叶", green, leaves), combineMeshes("锦带花叶腋成簇的短花梗", green, stalks));
  }
  return parts;
}

function forsythia(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let branch = 0; branch < 5; branch++) {
    const a = branch * 2.4, path: Triple[] = [[0, 0, 0], [Math.cos(a) * 0.27, 1.45 + branch % 2 * 0.2, Math.sin(a) * 0.27], [Math.cos(a) * 0.92, 1.13 + branch % 2 * 0.17, Math.sin(a) * 0.92]]; parts.push(tapered("连翘开花时仍少叶的长拱垂枝", bark, path, [0.022, 0.01, 0.002]));
    for (let node = 0; node < 6; node++) {
      const p = stemPoint(path, 0.28 + node * 0.13), b = a + (node % 2 ? 1 : -1); parts.push(smallCorolla(p, [Math.cos(b), 0.1, Math.sin(b)], 0.011, 0.0055, "#d0c397", false, 4));
      if (node === 2) parts.push(flatLeaf("连翘花期刚展开的极少量对生小叶", p, [p[0] - Math.sin(a) * 0.043, p[1] + 0.024, p[2] + Math.cos(a) * 0.043], 0.023));
    }
  }
  return parts;
}

function lilac(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let branch = 0; branch < 3; branch++) {
    const a = branch * 2.4, end: Triple = [Math.cos(a) * 0.37, 1.6 + branch * 0.12, Math.sin(a) * 0.37]; parts.push(tapered("紫丁香由基部簇生的直立老枝", bark, [[0, 0, 0], [end[0] * 0.55, end[1] * 0.58, end[2] * 0.55], end], [0.033, 0.018, 0.004]));
    for (let node = 0; node < 3; node++) for (const side of [-1, 1]) { const t = 0.53 + node * 0.16, p: Triple = [end[0] * t, end[1] * t, end[2] * t], b = a + side * 1.3; parts.push(flatLeaf("紫丁香对生且基部心形的宽叶", p, [p[0] + Math.cos(b) * 0.105, p[1] + 0.035, p[2] + Math.sin(b) * 0.105], 0.084, "heart")); }
    const top: Triple = [end[0], end[1] + 0.23, end[2]]; parts.push(tapered("紫丁香顶生密圆锥花序的主轴", green, [end, top], [0.003, 0.001]));
    const stalks: ModelPart[] = [];
    for (let flower = 0; flower < 12; flower++) { const t = (flower + 1) / 13, b = flower * 2.4, r = (1 - t) * 0.065 + 0.004, p: Triple = [end[0] + Math.cos(b) * r, end[1] + t * 0.23, end[2] + Math.sin(b) * r]; stalks.push(needle("紫丁香圆锥花序内部的分枝花梗", green, [end[0], p[1], end[2]], p, 0.0013)); parts.push(smallCorolla(p, [Math.cos(b), 0.6, Math.sin(b)], 0.012, 0.003, "#b9b0c0", false, 4)); }
    parts.push(combineMeshes("密锥内每朵小管花相连的分枝轴", green, stalks));
  }
  return parts;
}

function crepePetal(root: Triple, angle: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], a = angle * Math.PI / 180;
  for (const side of [0, 1]) for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) {
    const t = row / 4, across = col / 4 - 0.5, w = t < 0.35 ? 0.0018 + t * 0.008 : 0.017 * Math.sin((t - 0.3) / 0.7 * Math.PI * 0.7), radial = 0.003 + t * 0.019, x = across * w, y = t * 0.009 + Math.sin(col * Math.PI * 0.85 + row * 0.5) * t * 0.002 + side * 0.00035;
    vertices.push({ x: root[0] + Math.cos(a) * radial - Math.sin(a) * x, y: root[1] + y, z: root[2] + Math.sin(a) * radial + Math.cos(a) * x });
  }
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) { const p = row * 5 + col; indices.push(p, p + 5, p + 1, p + 1, p + 5, p + 6, p + 25, p + 26, p + 30, p + 26, p + 31, p + 30); }
  return part("紫薇有细爪基部与真正起伏褶皱的薄花瓣", "mesh", pink, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function crapeMyrtle(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let branch = 0; branch < 3; branch++) {
    const a = branch * 2.4, end: Triple = [Math.cos(a) * 0.6, 2.6 + branch * 0.15, Math.sin(a) * 0.6]; parts.push(tapered("紫薇细滑而非球冠的多干乔灌木主干", bark, [[Math.cos(a) * 0.04, 0, Math.sin(a) * 0.04], [end[0] * 0.35, 1.45, end[2] * 0.35], end], [0.055, 0.028, 0.004]));
    const leaves: ModelPart[] = [];
    for (let node = 0; node < 5; node++) for (const side of [-1, 1]) { const t = 0.58 + node * 0.085, p: Triple = [end[0] * (0.35 + (t * end[1] - 1.45) / (end[1] - 1.45) * 0.65), end[1] * t, end[2] * (0.35 + (t * end[1] - 1.45) / (end[1] - 1.45) * 0.65)], b = a + side * 1.1; leaves.push(flatLeaf("紫薇短柄对生的椭圆小叶", p, [p[0] + Math.cos(b) * 0.065, p[1] + 0.02, p[2] + Math.sin(b) * 0.065], 0.031)); }
    parts.push(combineMeshes("紫薇沿细梢真实排列的短柄叶", green, leaves));
    const top: Triple = [end[0], end[1] + 0.25, end[2]]; parts.push(tapered("紫薇终端圆锥花序的细主轴", green, [end, top], [0.003, 0.001]));
    for (let flower = 0; flower < 5; flower++) { const t = (flower + 1) / 6, b = flower * 2.4, p: Triple = [end[0] + Math.cos(b) * (1 - t) * 0.085, end[1] + t * 0.25, end[2] + Math.sin(b) * (1 - t) * 0.085]; parts.push(needle("紫薇分离的小花梗", green, [end[0], p[1], end[2]], p, 0.0015), combineMeshes("紫薇每朵六片带爪褶瓣的完整花冠", pink, Array.from({ length: 6 }, (_, i) => crepePetal(p, i * 60)))); const stamens: ModelPart[] = []; for (let i = 0; i < 16; i++) { const c = i * 2.4; stamens.push(needle("紫薇花心长短不一的外露雄蕊", cream, p, [p[0] + Math.cos(c) * 0.01, p[1] + 0.015 + i % 2 * 0.006, p[2] + Math.sin(c) * 0.01], 0.0007)); } parts.push(combineMeshes("紫薇花内真实细雄蕊刷", cream, stamens)); }
  }
  return parts;
}

function whiteShrub(deutzia: boolean): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let branch = 0; branch < 4; branch++) {
    const a = branch * 2.4, path: Triple[] = [[0, 0, 0], [Math.cos(a) * 0.23, deutzia ? 1.3 : 1.05, Math.sin(a) * 0.23], [Math.cos(a) * 0.65, deutzia ? 1.63 : 0.84, Math.sin(a) * 0.65]]; parts.push(tapered(deutzia ? "溲疏开张直立的细木质枝" : "绣线菊由根颈抽出后下弯的拱枝", bark, path, [0.024, 0.012, 0.0025]));
    const leaves: ModelPart[] = [];
    for (let node = 0; node < 5; node++) { const p = stemPoint(path, 0.28 + node * 0.14); for (const side of deutzia ? [-1, 1] : [node % 2 ? -1 : 1]) { const b = a + side * 1.2; leaves.push(flatLeaf(deutzia ? "溲疏沿枝交互对生的尖卵叶" : "绣线菊交错互生的菱状披针叶", p, [p[0] + Math.cos(b) * (deutzia ? 0.08 : 0.055), p[1] + 0.02, p[2] + Math.sin(b) * (deutzia ? 0.08 : 0.055)], deutzia ? 0.037 : 0.027)); } }
    parts.push(combineMeshes(deutzia ? "溲疏对生叶序" : "绣线菊沿枝互生叶序", green, leaves));
    for (let cluster = 0; cluster < 3; cluster++) {
      const root = stemPoint(path, 0.55 + cluster * 0.19), tip: Triple = [root[0], root[1] + (deutzia ? 0.11 : 0.045), root[2]]; parts.push(needle(deutzia ? "溲疏花簇延长的圆锥轴" : "绣线菊接近半球形的短伞房花序轴", green, root, tip, 0.0018));
      const flowers: ModelPart[] = [], centers: ModelPart[] = [];
      for (let flower = 0; flower < 5; flower++) { const b = flower * 2.4, t = (flower + 1) / 6, r = deutzia ? 0.026 * (1 - t) : 0.025, p: Triple = [root[0] + Math.cos(b) * r, root[1] + (deutzia ? t * 0.11 : 0.043 - flower % 2 * 0.009), root[2] + Math.sin(b) * r]; centers.push(needle("白花灌木每朵花真实相接的分枝花柄", green, [root[0], deutzia ? p[1] : root[1] + 0.022, root[2]], p, 0.0008)); flowers.push(petals(5, p, deutzia ? 0.0035 : 0.003, deutzia ? 0.009 : 0.006, deutzia ? 51 : 77, cream)); for (let i = 0; i < (deutzia ? 10 : 12); i++) { const c = i * 2.4; centers.push(needle(deutzia ? "溲疏花内十枚独立雄蕊" : "绣线菊花心多数外伸雄蕊", cream, p, [p[0] + Math.cos(c) * 0.003, p[1] + 0.004, p[2] + Math.sin(c) * 0.003], 0.0005)); } }
      parts.push(combineMeshes("一整簇白花上彼此分离的五瓣花冠", cream, flowers), combineMeshes("白花簇全部相连花梗与独立细雄蕊", cream, centers));
    }
  }
  return parts;
}

export const springShrubDesigns: MasterNatureDesign[] = [
  design("abutilonPictum", "金铃花", "植物", goldenBell, ["Abutilon pictum", "掌裂叶与悬垂钟花"]),
  design("weigela", "锦带花", "植物", weigela, ["Weigela florida", "对生叶与叶腋喇叭花"]),
  design("forsythia", "连翘", "植物", forsythia, ["Forsythia suspensa", "裸垂枝与四裂花冠"]),
  design("syringa", "紫丁香", "植物", lilac, ["Syringa vulgaris", "心形对生叶与密锥四裂花"]),
  design("lagerstroemia", "紫薇", "植物", crapeMyrtle, ["Lagerstroemia indica", "六瓣有爪褶皱花冠"]),
  design("spiraeaCantoniensis", "绣线菊", "植物", () => whiteShrub(false), ["Spiraea cantoniensis", "拱枝短伞房花序"]),
  design("deutzia", "溲疏", "植物", () => whiteShrub(true), ["Deutzia scabra", "对生叶与圆锥星状花"]),
];
