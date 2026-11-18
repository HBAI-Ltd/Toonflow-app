import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, petals, sweptProfile, tapered } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { strip } from "./shapedFoods";
import { starStem } from "./succulentForms";
import { branchCrown, crownLeaves } from "./woodyForms";
import { vineStem } from "./gardenCrops";
import { produceDesigns } from "./produce";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const green = "#91a380";
const pale = "#bec6a4";
const bark = "#a99f88";
const flower = "#d0c7ae";

function perforatedBulb(name: string, size: Triple): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [];
  for (let shell = 0; shell < 2; shell++) for (let row = 1; row < 8; row++) for (let column = 0; column < 16; column++) {
    const a = column * Math.PI / 8, b = row * Math.PI / 8, radius = Math.sin(b) * (shell ? 0.8 : 1);
    vertices.push({ x: Math.cos(a) * radius * size[0], y: ((1 - Math.cos(b)) * (shell ? 0.4 : 0.5) + (shell ? 0.1 : 0)) * size[1], z: Math.sin(a) * radius * size[2] });
  }
  const poles = vertices.length;
  vertices.push({ x: 0, y: 0, z: 0 }, { x: 0, y: size[1], z: 0 }, { x: 0, y: size[1] * 0.1, z: 0 }, { x: 0, y: size[1] * 0.9, z: 0 });
  const indices: number[] = [];
  for (let shell = 0; shell < 2; shell++) {
    const base = shell * 112;
    const face = (a: number, b: number, c: number) => indices.push(...(shell ? [a, c, b] : [a, b, c]));
    for (let row = 0; row < 6; row++) for (let column = 0; column < 16; column++) {
      if (row === 2 && [2, 7, 12].includes(column)) continue;
      const a = base + row * 16 + column, b = base + row * 16 + (column + 1) % 16, c = a + 16, d = b + 16;
      face(a, c, b); face(b, c, d);
    }
    for (let column = 0; column < 16; column++) { const next = (column + 1) % 16; face(poles + shell * 2, base + column, base + next); face(poles + shell * 2 + 1, base + 96 + next, base + 96 + column); }
  }
  for (const column of [2, 7, 12]) {
    const a = 32 + column, b = 32 + (column + 1) % 16, c = a + 16, d = b + 16;
    const rim = [a, b, d, c];
    for (let i = 0; i < 4; i++) { const p = rim[i]!, q = rim[(i + 1) % 4]!; indices.push(p, p + 112, q, q, p + 112, q + 112); }
  }
  return part(name, "mesh", bark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function pitchers(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (let i = 0; i < 7; i++) { const a = i * 2.4; parts.push(flatLeaf("土瓶草独立于捕虫囊的普通叶", [0, 0.006, 0], [Math.cos(a) * 0.08, 0.018, Math.sin(a) * 0.08], 0.025)); }
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5, x = Math.cos(a) * 0.035, z = Math.sin(a) * 0.035, h = 0.06 + i % 2 * 0.015;
      parts.push(part("土瓶草矮壮卵形捕虫瓶的真实内外壁", "lathe", green, [x, 0, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.018, y: h * 0.2 }, { x: 0.021, y: h * 0.55 }, { x: 0.013, y: h }, { x: 0.01, y: h }, { x: 0.017, y: h * 0.55 }, { x: 0.014, y: h * 0.2 }, { x: 0, y: 0.003 }] }), leaf("土瓶草瓶口上方有窗纹的独立小盖", pale, [x, h, z - 0.012], 0.032, 0.036, [40, i * 72, 0]));
      for (let rib = 0; rib < 3; rib++) { const b = rib * Math.PI * 2 / 3; parts.push(tapered("瓶体外部的三条纵向翼棱", pale, [[x + Math.cos(b) * 0.013, 0.005, z + Math.sin(b) * 0.013], [x + Math.cos(b) * 0.024, h * 0.55, z + Math.sin(b) * 0.024], [x + Math.cos(b) * 0.014, h, z + Math.sin(b) * 0.014]], [0.002, 0.0025, 0.001])); }
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2, root: Triple = [Math.cos(a) * 0.035, 0, Math.sin(a) * 0.035], h = 0.23 + i % 2 * 0.04;
      const value = sweptProfile("太阳瓶子草没有大瓶盖的开放漏斗叶", green, [[0, 0], [0.006, 0], [0.018, h * 0.6], [0.032, h], [0.029, h], [0.015, h * 0.6], [0, 0.003]], Math.PI * 2, 24);
      value.vertices = value.vertices!.map(p => ({ x: p.x, y: p.y + p.x / 0.032 * (p.y / h) ** 6 * 0.022, z: p.z })); value.position = { x: root[0], y: 0, z: root[2] }; parts.push(value, tapered("漏斗高侧抬起的细蜜勺柄", pale, [[root[0] + 0.026, h + 0.01, root[2]], [root[0] + 0.032, h + 0.035, root[2]]], [0.002, 0.0015]), cap("太阳瓶子草真正勺状的小蜜腺盖", pale, [root[0] + 0.032, h + 0.032, root[2]], 0.008, 0.007, 3));
    }
  }
  return parts;
}

function stickyLeafPlant(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 2) {
    for (let i = 0; i < 8; i++) { const a = i * 2.4, p: Triple = [Math.cos(a) * 0.06, 0.15 + i % 3 * 0.025, Math.sin(a) * 0.06]; parts.push(tapered("叉叶茅膏菜非黏性长叶柄", green, [[0, 0, 0], p], [0.002, 0.0013])); const glands: ModelPart[] = []; for (const side of [-1, 1]) { const end: Triple = [p[0] + Math.cos(a + side * 0.75) * 0.085, p[1] + 0.025, p[2] + Math.sin(a + side * 0.75) * 0.085]; parts.push(tapered("叉叶茅膏菜T形分叉后的丝状捕虫叶", green, [p, end], [0.0015, 0.0004])); for (let j = 0; j < 10; j++) { const t = (j + 1) / 11; const q: Triple = [p[0] + (end[0] - p[0]) * t, p[1] + (end[1] - p[1]) * t, p[2] + (end[2] - p[2]) * t]; glands.push(needle("分叉叶两侧密布的黏腺", pale, q, [q[0] + Math.cos(a + 1.57) * (j % 2 ? -0.004 : 0.004), q[1] + 0.003, q[2] + Math.sin(a + 1.57) * (j % 2 ? -0.004 : 0.004)], 0.001)); } } parts.push(combineMeshes("一整片分叉捕虫叶的黏腺", pale, glands)); }
  } else {
    const woody = kind === 1; const height = woody ? 0.8 : 0.4;
    for (let axis = 0; axis < 3; axis++) { const a = axis * Math.PI * 2 / 3, end: Triple = [Math.cos(a) * 0.12, height, Math.sin(a) * 0.12]; parts.push(tapered(woody ? "Roridula木质分枝" : "虹彩草纤细的直立分枝", woody ? bark : green, [[0, 0, 0], [end[0] * 0.5, height * 0.5, end[2] * 0.5], end], [woody ? 0.014 : 0.003, woody ? 0.009 : 0.0025, 0.001]));
      for (let row = 0; row < 7; row++) { const t = 0.18 + row * 0.11, b = row * 2.4; const root: Triple = [end[0] * t, height * t, end[2] * t]; const tip: Triple = [root[0] + Math.cos(b) * (woody ? 0.095 : 0.065), root[1] + 0.025, root[2] + Math.sin(b) * (woody ? 0.095 : 0.065)]; parts.push(tapered("沿枝条着生的细长黏性叶", green, [root, tip], [woody ? 0.003 : 0.0015, 0.0004])); const hairs: ModelPart[] = []; for (let i = 0; i < 10; i++) { const f = (i + 1) / 11; const p: Triple = [root[0] + (tip[0] - root[0]) * f, root[1] + (tip[1] - root[1]) * f, root[2] + (tip[2] - root[2]) * f]; hairs.push(needle("黏叶腺毛", pale, p, [p[0] + Math.cos(b + 1.57) * (i % 2 ? -0.003 : 0.003), p[1] + 0.003, p[2] + Math.sin(b + 1.57) * (i % 2 ? -0.003 : 0.003)], 0.001)); } parts.push(combineMeshes("该片叶的全部黏腺", pale, hairs)); }
      parts.push(petals(5, end, woody ? 0.015 : 0.01, woody ? 0.03 : 0.02, 75, flower));
    }
  }
  return parts;
}

function sculpturalSucculent(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (let i = 0; i < 19; i++) { const a = i * 2.4, r = Math.sqrt(i / 19) * 0.04, h = 0.022 + (1 - i / 20) * 0.02; const root: Triple = [Math.cos(a) * r, 0.006, Math.sin(a) * r], top: Triple = [Math.cos(a) * r * 1.2, h, Math.sin(a) * r * 1.2]; parts.push(tapered("玉露向上膨大的肉质叶基", green, [root, top], [0.004, 0.007]), lobe("玉露肥厚圆顶的透光叶窗", "#b3c1a3", top, [0.014, 0.016, 0.014])); parts.at(-1)!.opacity = 0.65; }
  } else if (kind === 1) {
    for (let i = 0; i < 9; i++) { const a = i * 2.4; const path: Triple[] = Array.from({ length: 20 }, (_, j) => { const t = j / 19; return [Math.cos(a) * t * 0.065 + Math.cos(a + 1.57) * Math.sin(t * Math.PI * 6) * 0.012, t * 0.2, Math.sin(a) * t * 0.065 + Math.sin(a + 1.57) * Math.sin(t * Math.PI * 6) * 0.012]; }); parts.push(strip("龙卷风草具有交替波折的扁平带叶", green, path, 0.011, 0.001)); }
  } else if (kind === 2) {
    for (let axis = 0; axis < 5; axis++) { const a = axis * 2.4; const path: Triple[] = [[Math.cos(a) * 0.007, 0, Math.sin(a) * 0.007], [Math.cos(a) * 0.018, 0.03, Math.sin(a) * 0.018], [Math.cos(a) * 0.026, 0.058, Math.sin(a) * 0.026]]; parts.push(tapered("纸鳞多肉的短圆肉质茎", green, path, [0.006, 0.006, 0.003])); const scales: ModelPart[] = []; for (let i = 0; i < 24; i++) { const b = i * 2.4, t = i / 24; scales.push(leaf("紧覆茎外的纸质鳞片", pale, [Math.cos(a) * (0.007 + 0.019 * t) + Math.cos(b) * 0.005, t * 0.058, Math.sin(a) * (0.007 + 0.019 * t) + Math.sin(b) * 0.005], 0.008, 0.012, [12, -b * 180 / Math.PI, 0])); } parts.push(combineMeshes("每条肉质茎完整的纸鳞外衣", pale, scales)); }
  } else {
    parts.push(part("凝蹄玉四方块状的无叶肉茎", "box", green, [0, 0.033, 0], [0.075, 0.066, 0.075])); const papillae: ModelPart[] = [];
    for (let face = 0; face < 5; face++) for (let i = 0; i < 12; i++) { const a = (i % 4 - 1.5) * 0.017, b = (Math.floor(i / 4) - 1) * 0.018; const p: Triple = face === 0 ? [a, 0.066, b] : face < 3 ? [(face === 1 ? -1 : 1) * 0.037, 0.033 + b, a] : [a, 0.033 + b, (face === 3 ? -1 : 1) * 0.037]; papillae.push(lobe("无叶茎表面的多角肉瘤", pale, p, [0.014, 0.012, 0.014])); }
    for (let i = 0; i < 2; i++) parts.push(combineMeshes("凝蹄玉连续保留的肉瘤表面", pale, papillae.slice(i * 30, i * 30 + 30))); parts.push(needle("肉茎侧面直接伸出的短花梗", green, [0.036, 0.043, 0.01], [0.04, 0.043, 0.01], 0.002), petals(5, [0.04, 0.043, 0.01], 0.007, 0.014, 75, flower));
  }
  return parts;
}

function antAssociatedPlant(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(perforatedBulb("蚁巢木具有三处真实入口和内部蚁室的膨茎", [0.085, 0.15, 0.075]));
    for (const side of [-1, 1]) { parts.push(tapered("蚁巢木膨茎顶部的木质枝", bark, [[0, 0.13, 0], [side * 0.04, 0.24, 0], [side * 0.075, 0.35, 0]], [0.008, 0.005, 0.0025])); for (let i = 0; i < 4; i++) for (const leafSide of [-1, 1]) parts.push(flatLeaf("蚁巢木对生小椭圆叶", [side * 0.025 + i * side * 0.013, 0.2 + i * 0.043, 0], [side * 0.025 + i * side * 0.013 + leafSide * 0.055, 0.22 + i * 0.043, 0.01], 0.026)); }
  } else if (kind === 1) {
    parts.push(vineStem(0.65));
    for (let i = 0; i < 6; i++) { const side = i % 2 ? -1 : 1, y = 0.1 + i * 0.09; parts.push(flatLeaf("袋叶藤不膨大的普通叶", [0, y, 0], [side * 0.065, y + 0.018, 0], 0.03)); if (i > 0) parts.push(part("袋叶藤由叶片合围的蚁栖囊与窄入口", "lathe", green, [side * 0.025, y - 0.07, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.017, y: 0.012 }, { x: 0.023, y: 0.04 }, { x: 0.011, y: 0.063 }, { x: 0.003, y: 0.07 }, { x: 0.0018, y: 0.07 }, { x: 0.009, y: 0.06 }, { x: 0.02, y: 0.04 }, { x: 0.014, y: 0.012 }, { x: 0, y: 0.003 }] })); }
  } else {
    parts.push(perforatedBulb("蚁蕨露在附生表面的中空匍匐根茎", [0.16, 0.055, 0.065]));
    for (let i = 0; i < 6; i++) { const a = i * 2.4; const root: Triple = [-0.1 + i * 0.038, 0.043, 0]; const p: Triple = [root[0] + Math.cos(a) * 0.045, 0.19, Math.sin(a) * 0.045]; parts.push(beam("中空根茎生出的蕨叶柄", bark, root, p, 0.003), flatLeaf("蚁蕨长指状裂片的完整蕨叶", p, [p[0] + Math.cos(a) * 0.2, 0.28, p[2] + Math.sin(a) * 0.2], 0.18, "lobed")); }
  }
  return parts;
}

function monumentalPlant(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (let i = 0; i < 22; i++) parts.push(leaf("安第斯巨凤梨宽基刺缘的硬质剑叶", green, [0, 0.08, 0], 0.14, 2.1, [35 + i % 3 * 17, i * 137.5, 0])); parts.push(tapered("安第斯巨凤梨巨大花序的单一高轴", bark, [[0, 0, 0], [0, 3.3, 0], [0, 7.1, 0]], [0.15, 0.13, 0.035]));
    for (let band = 0; band < 8; band++) { const buds: ModelPart[] = []; for (let i = 0; i < 24; i++) { const a = i * 2.4, y = 2.3 + band * 0.56 + i % 3 * 0.12, r = (0.38 - band * 0.034) * (0.7 + i % 3 * 0.12); const p: Triple = [Math.cos(a) * r, y, Math.sin(a) * r]; buds.push(needle("巨大穗状花序的短分枝", green, [0, y - 0.08, 0], p, 0.014), lobe("分枝端的完整花簇", flower, p, [0.1, 0.16, 0.1])); } parts.push(combineMeshes("连续花穗的一整段实体现存花簇", flower, buds)); }
  } else if (kind === 1 || kind === 2) {
    const bottle = kind === 2;
    if (bottle) parts.push(tapered("酒瓶兰膨大基部向上收成细木干", bark, [[0, 0, 0], [0, 0.28, 0], [0, 0.65, 0], [0, 1.55, 0]], [0.26, 0.28, 0.09, 0.04]));
    else parts.push(tapered("澳洲草树粗短而有持久叶基的木干", bark, [[0, 0, 0], [0, 0.9, 0], [0, 1.8, 0]], [0.17, 0.16, 0.13]));
    const y = bottle ? 1.55 : 1.85, count = bottle ? 32 : 40; const leaves: ModelPart[] = [];
    for (let i = 0; i < count; i++) { const a = i * 2.4; leaves.push(strip("冠顶向四周弯垂的完整线形叶", green, [[0, y, 0], [Math.cos(a) * (bottle ? 0.35 : 0.45), y + 0.15, Math.sin(a) * (bottle ? 0.35 : 0.45)], [Math.cos(a) * (bottle ? 0.7 : 0.9), y - (bottle ? 0.65 : 0.4), Math.sin(a) * (bottle ? 0.7 : 0.9)]], bottle ? 0.016 : 0.011, 0.001)); }
    parts.push(combineMeshes("草状叶冠中的每条独立弯叶", green, leaves));
    if (!bottle) { parts.push(beam("澳洲草树从叶冠高伸的光裸花葶", bark, [0, y, 0], [0, 3.6, 0], 0.035)); for (let i = 0; i < 12; i++) parts.push(lobe("花葶上部密集的圆柱花穗小段", pale, [0, 3.15 + i * 0.07, 0], [0.095, 0.12, 0.095])); }
  } else {
    const tips: Triple[] = [[-0.6, 2.1, 0], [0.6, 2.2, 0.1], [0, 2.5, -0.4]]; branchCrown(parts, 2.3, tips);
    for (const p of tips) { parts.push(crownLeaves(p, 0.28, "lobed")); const styles: ModelPart[] = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; const start: Triple = [p[0] + Math.cos(a) * 0.015, p[1], p[2] + Math.sin(a) * 0.015], end: Triple = [p[0] + Math.cos(a) * 0.08, p[1] + 0.035, p[2] + Math.sin(a) * 0.08]; styles.push(tapered("火轮树向外辐射后反弯的花柱", flower, [start, end, [end[0], end[1] + 0.025, end[2]]], [0.002, 0.0015, 0.0005])); } parts.push(combineMeshes("火轮树一个完整辐射轮状花序", flower, styles)); }
  }
  return parts;
}

function unusualPlant(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(cap("Rhizanthes无绿叶寄生花的中央空腔", "#b4a18b", [0, 0.005, 0], 0.035, 0.045, 3), lobe("花腔内独立的生殖柱", pale, [0, 0.02, 0], [0.018, 0.034, 0.018]));
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; parts.push(strip("Rhizanthes细长下垂的肉质花被裂片", "#bba58b", [[Math.cos(a) * 0.023, 0.036, Math.sin(a) * 0.023], [Math.cos(a) * 0.065, 0.039, Math.sin(a) * 0.065], [Math.cos(a) * 0.13, 0.01, Math.sin(a) * 0.13]], 0.014, 0.003)); }
  } else if (kind === 1) {
    for (const side of [-1, 1]) { parts.push(tapered("假叶树木质化地上枝条", bark, [[0, 0, 0], [side * 0.045, 0.25, 0], [side * 0.1, 0.55, 0]], [0.008, 0.005, 0.002])); for (let i = 0; i < 7; i++) { const y = 0.08 + i * 0.065; const root: Triple = [side * 0.02 + i * side * 0.01, y, 0], end: Triple = [root[0] + (i % 2 ? -1 : 1) * 0.09, y + 0.03, 0.02]; parts.push(flatLeaf("假叶树真正的扁平叶状枝而非普通叶", root, end, 0.035), lobe("直接生在叶状枝中央的浆果", "#b9a28e", [(root[0] + end[0]) * 0.5, (root[1] + end[1]) * 0.5 + 0.004, 0.01], [0.01, 0.011, 0.01])); } }
  } else if (kind === 2) {
    parts.push(tapered("昙花木质短基干", bark, [[0, 0, 0], [0, 0.4, 0]], [0.025, 0.015]));
    for (let i = 0; i < 7; i++) { const a = i * 2.4, root: Triple = [0, 0.22 + i % 3 * 0.08, 0], end: Triple = [Math.cos(a) * 0.55, 0.62 - i % 2 * 0.13, Math.sin(a) * 0.55]; parts.push(flatLeaf("昙花宽而只有浅波缘的扁平叶状茎", root, end, 0.11)); }
    const p: Triple = [0.3, 0.38, 0.12]; parts.push(tapered("昙花侧缘伸出的弯曲长花筒", pale, [[0.17, 0.4, 0.07], [0.25, 0.32, 0.1], p], [0.012, 0.01, 0.008])); for (let row = 0; row < 3; row++) parts.push(petals(12, [p[0], p[1] + row * 0.01, p[2]], 0.024 - row * 0.004, 0.12 - row * 0.02, 85 - row * 18, flower));
  } else {
    const path: Triple[] = [[0, 0, 0], [0, 0.8, 0], [0.25, 1.35, 0], [0.55, 1.2, 0.05]];
    for (let i = 0; i < path.length - 1; i++) { const a = path[i]!, b = path[i + 1]!, frame = beam("三棱肉质茎段", green, a, b, 0.05); const stem = starStem("火龙果三棱攀援肉质茎", a, frame.scale.y, 0.045, 3, 0.3); stem.rotation = { ...frame.rotation }; parts.push(stem); }
    for (const side of [-1, 1]) { const a: Triple = [0.2, 1.25, 0], b: Triple = [0.2 + side * 0.45, 0.6, side * 0.15], frame = beam("下垂三棱茎段", green, a, b, 0.05); const stem = starStem("火龙果向外下垂的三棱分枝", a, frame.scale.y, 0.045, 3, 0.3); stem.rotation = { ...frame.rotation }; parts.push(stem); }
    const source = produceDesigns.find(entry => entry.key === "dragonFruit")!; for (const value of source.build()) { value.position.x += 0.53; value.position.y += 0.99; value.position.z += 0.05; parts.push(value); }
    for (let i = 0; i < 5; i++) parts.push(tapered("三棱茎上附着攀援的气根", pale, [[0, 0.15 + i * 0.12, 0], [-0.025, 0.13 + i * 0.12, -0.03], [-0.04, 0.1 + i * 0.12, -0.04]], [0.003, 0.002, 0.0007]));
  }
  return parts;
}

const pitcherNames = [["cephalotus", "土瓶草", "Cephalotus follicularis"], ["heliamphora", "太阳瓶子草", "Heliamphora"]];
const stickyNames = [["byblis", "虹彩草", "Byblis"], ["roridula", "Roridula黏叶灌木", "Roridula dentata"], ["forkLeavedSundew", "叉叶茅膏菜", "Drosera binata"]];
const succulentNames = [["haworthiaCooperi", "玉露", "Haworthia cooperi"], ["trachyandra", "龙卷风草", "Trachyandra tortilis"], ["paperScaleSucculent", "纸鳞多肉（Avonia）", "Anacampseros papyracea / Avonia papyracea"], ["pseudolithos", "凝蹄玉", "Pseudolithos cubiformis"]];
const antNames = [["hydnophytum", "蚁巢木", "Hydnophytum formicarum"], ["dischidiaPouch", "袋叶藤", "Dischidia major"], ["lecanopteris", "蚁蕨", "Lecanopteris"]];
const monumentalNames = [["puyaRaimondii", "安第斯巨凤梨", "Puya raimondii"], ["australianGrassTree", "澳洲草树", "Xanthorrhoea"], ["ponytailPalm", "酒瓶兰", "Beaucarnea recurvata"], ["firewheelTree", "火轮树", "Stenocarpus sinuatus"]];
const unusualNames = [["rhizanthes", "丝瓣寄生花（Rhizanthes）", "Rhizanthes lowii"], ["butchersBroom", "假叶树", "Ruscus aculeatus"], ["epiphyllum", "昙花", "Epiphyllum oxypetalum"], ["dragonFruitPlant", "火龙果植株", "Selenicereus undatus"]];

export const functionalPlantDesigns: MasterNatureDesign[] = [
  ...pitcherNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => pitchers(i), ["功能叶植物", taxon!])),
  ...stickyNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => stickyLeafPlant(i), ["黏性叶植物", taxon!])),
  ...succulentNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => sculpturalSucculent(i), ["多肉植物结构", taxon!])),
  ...antNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => antAssociatedPlant(i), ["蚁栖植物结构", taxon!])),
  ...monumentalNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => monumentalPlant(i), ["完整植株结构", taxon!])),
  ...unusualNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => unusualPlant(i), ["特殊植物结构", taxon!])),
];
