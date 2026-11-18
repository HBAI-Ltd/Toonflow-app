import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, petals, tapered } from "./shared";
import { compoundLeaf, flatLeaf } from "./ediblePlants";
import { produceDesigns } from "./produce";
import { foodDesigns } from "./foods";
import { seedFormDesigns } from "./seedForms";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const green = "#92a57e";
const pale = "#b7c19d";
const stalk = "#a1aa87";
const bloom = "#d0c7ae";

function attach(parts: ModelPart[], source: MasterNatureDesign[], key: string, root: Triple, factor = 1) {
  const entry = source.find(value => value.key === key);
  if (!entry) throw new Error("植株果实构造不存在");
  const groups = new Map<string, ModelPart[]>();
  for (const value of entry.build()) {
    value.position = { x: root[0] + value.position.x * factor, y: root[1] + value.position.y * factor, z: root[2] + value.position.z * factor };
    value.scale = { x: value.scale.x * factor, y: value.scale.y * factor, z: value.scale.z * factor };
    if (value.shape !== "mesh") { parts.push(value); continue; }
    const batch = groups.get(value.color) ?? [];
    if (batch.reduce((sum, item) => sum + item.vertices!.length, 0) + value.vertices!.length > 512 || batch.reduce((sum, item) => sum + item.indices!.length, 0) + value.indices!.length > 3072) {
      parts.push(combineMeshes("果实的完整同材质外形", value.color, batch)); batch.length = 0;
    }
    batch.push(value); groups.set(value.color, batch);
  }
  for (const [color, batch] of groups) parts.push(combineMeshes("果实的完整同材质外形", color, batch));
}

export function tendril(root: Triple): ModelPart {
  const path: Triple[] = [root, [root[0] + 0.025, root[1] + 0.002, root[2]], ...Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 3; return [root[0] + 0.04 + Math.cos(a) * 0.006, root[1] + i * 0.003, root[2] + Math.sin(a) * 0.006] as Triple; })];
  return tapered("与叶腋相连的连续螺旋卷须", pale, path, path.map(() => 0.001));
}

export function vineStem(height: number): ModelPart {
  return tapered("由地表起的木质攀援藤干", stalk, [[0, 0, 0], [-0.035, height * 0.3, 0], [0.03, height * 0.65, 0.02], [0, height, 0]], [0.013, 0.01, 0.006, 0.002]);
}

function berries(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(vineStem(1.4), tapered("葡萄水平延伸结果母枝", stalk, [[0, 0.8, 0], [-0.3, 1.05, 0.02], [-0.65, 1.1, 0]], [0.009, 0.006, 0.002]));
    for (let i = 0; i < 7; i++) { const x = -0.57 + i * 0.12, y = 1.02 + i % 2 * 0.08; parts.push(flatLeaf("葡萄有掌状裂片和缺口的宽叶", [x, y, 0], [x, y + 0.08, i % 2 ? 0.28 : -0.28], 0.22, "palm"), tendril([x, y, 0])); }
    for (const x of [-0.44, -0.1]) { parts.push(beam("果穗下垂的总果梗", stalk, [x, 1.07, 0], [x, 0.9, 0.02], 0.004)); attach(parts, produceDesigns, "grape", [x, 0.72, 0.02]); }
  } else if (kind === 1) {
    for (const side of [-1, 1]) {
      parts.push(tapered("覆盆子拱曲有刺藤条", stalk, [[0, 0, 0], [side * 0.12, 0.5, 0], [side * 0.23, 1.05, 0], [side * 0.46, 0.82, 0]], [0.01, 0.008, 0.005, 0.002]));
      for (let i = 0; i < 5; i++) { const x = side * (0.04 + i * 0.06), y = 0.2 + i * 0.15; parts.push(compoundLeaf([x, y, 0], i * 100, 0.19, 1), needle("覆盆子藤上弯刺", pale, [x, y, 0], [x + side * 0.015, y + 0.025, 0], 0.005)); }
      parts.push(beam("覆盆子下垂的短果梗", stalk, [side * 0.4, 0.88, 0], [side * 0.37, 0.8, 0], 0.0025)); attach(parts, foodDesigns, "raspberry", [side * 0.37, 0.77, 0]);
    }
  } else if (kind === 2) {
    parts.push(beam("蓝莓基部短干", stalk, [0, 0, 0], [0, 0.24, 0], 0.018));
    for (let axis = 0; axis < 4; axis++) { const a = axis * Math.PI / 2; const tip: Triple = [Math.cos(a) * 0.24, 0.72 + axis % 2 * 0.1, Math.sin(a) * 0.24]; parts.push(beam("蓝莓上扬的木质枝条", stalk, [0, 0.17, 0], tip, 0.005)); for (let i = 0; i < 5; i++) { const t = (i + 1) / 6; const p: Triple = [tip[0] * t, 0.17 + (tip[1] - 0.17) * t, tip[2] * t]; parts.push(leaf("蓝莓互生全缘小卵叶", green, p, 0.027, 0.064, [50, axis * 90 + i * 130, 0])); } const fruit: ModelPart[] = [], pedicels: ModelPart[] = []; for (let i = 0; i < 9; i++) { const p: Triple = [tip[0] + Math.cos(i * 2.4) * 0.024, tip[1] - i % 3 * 0.022, tip[2] + Math.sin(i * 2.4) * 0.024]; fruit.push(lobe("蓝莓浆果", "#8d9c93", p, [0.018, 0.018, 0.018])); pedicels.push(needle("浆果连接枝端的独立细果梗", stalk, tip, p, 0.0015)); parts.push(petals(5, [p[0], p[1] + 0.008, p[2]], 0.003, 0.006, 75, pale)); } parts.push(combineMeshes("枝端真实的九枚浆果", "#8d9c93", fruit), combineMeshes("每颗蓝莓各自连接的果梗", stalk, pedicels)); }
  } else if (kind === 3) {
    parts.push(tapered("桑树短主干", stalk, [[0, 0, 0], [0, 0.7, 0], [0.025, 1.5, 0]], [0.07, 0.045, 0.015]));
    for (let i = 0; i < 7; i++) { const a = i * 2.4, y = 0.5 + i * 0.13; const p: Triple = [Math.cos(a) * 0.43, y + 0.25, Math.sin(a) * 0.43]; parts.push(beam("桑树斜出结果枝", stalk, [0, y, 0], p, 0.014), flatLeaf("桑树基部心形锯齿宽叶", p, [p[0] * 1.4, p[1] + 0.1, p[2] * 1.4], 0.2, "heart")); const fruit: ModelPart[] = []; for (let j = 0; j < 18; j++) { const b = j * Math.PI * 2 / 6; fruit.push(lobe("桑葚集聚小核果", "#a49f8a", [p[0] + Math.cos(b) * 0.009, p[1] - 0.015 - Math.floor(j / 6) * 0.01, p[2] + Math.sin(b) * 0.009], [0.011, 0.012, 0.011])); } parts.push(combineMeshes("一枚长柱状桑葚聚合果", "#a49f8a", fruit)); }
  } else {
    parts.push(vineStem(1.3));
    for (let i = 0; i < 7; i++) { const a = i * 2.4, y = 0.25 + i * 0.14; const p: Triple = [Math.cos(a) * 0.18, y + 0.03, Math.sin(a) * 0.18]; parts.push(beam("猕猴桃叶柄", stalk, [0, y, 0], p, 0.004), flatLeaf("猕猴桃厚大心状宽叶", p, [p[0] * 2, p[1] + 0.08, p[2] * 2], 0.22, "heart")); if (i > 2) parts.push(beam("猕猴桃细果梗", stalk, [0, y, 0], [p[0], y - 0.09, p[2]], 0.0025), lobe("下垂的完整猕猴桃果实", "#a7a084", [p[0], y - 0.12, p[2]], [0.055, 0.075, 0.055])); }
  }
  return parts;
}

function gourds(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(tapered("西瓜贴地匍匐主蔓", stalk, [[-0.6, 0.012, 0], [0, 0.012, 0], [0.6, 0.012, 0.08]], [0.003, 0.007, 0.002]));
    for (let i = 0; i < 8; i++) { const x = -0.5 + i * 0.14, side = i % 2 ? -1 : 1; parts.push(beam("西瓜有毛长叶柄", stalk, [x, 0.015, 0], [x, 0.12, side * 0.1], 0.004), flatLeaf("西瓜深裂且裂片再分裂的叶", [x, 0.12, side * 0.1], [x + 0.02, 0.15, side * 0.32], 0.18, "lobed"), tendril([x, 0.025, 0])); }
    parts.push(lobe("藤上未切开的椭球形西瓜", green, [0.24, 0.13, -0.13], [0.32, 0.3, 0.37]), cap("叶腋漏斗状瓜花", bloom, [-0.29, 0.03, 0.1], 0.025, 0.035, 3));
  } else {
    parts.push(vineStem(1.5));
    for (let i = 0; i < 7; i++) { const y = 0.18 + i * 0.18, side = i % 2 ? -1 : 1; parts.push(flatLeaf(kind === 1 ? "苦瓜掌状深裂叶" : "葫芦宽心形浅裂叶", [0, y, 0], [side * 0.3, y + 0.08, 0.06], 0.22, kind === 1 ? "palm" : "heart"), tendril([0, y, 0])); }
    for (const side of [-1, 1]) { const root: Triple = [side * 0.12, 0.52 + side * 0.17, 0.03]; const end: Triple = kind === 1 ? [root[0], root[1] + 0.05, root[2] - 0.1] : [root[0] + 0.035, root[1] + 0.33, root[2]]; parts.push(beam("瓜蔓悬果梗", stalk, [0, end[1] + 0.08, 0], end, 0.004)); attach(parts, seedFormDesigns, kind === 1 ? "bitterMelon" : "bottleGourd", root); }
  }
  return parts;
}

function floweringCrop(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(tapered("秋葵直立粗茎", stalk, [[0, 0, 0], [0, 0.7, 0], [0.015, 1.15, 0]], [0.022, 0.015, 0.004]));
    for (let i = 0; i < 7; i++) { const a = i * 2.4, y = 0.18 + i * 0.13; const p: Triple = [Math.cos(a) * 0.19, y + 0.06, Math.sin(a) * 0.19]; parts.push(beam("秋葵粗长叶柄", stalk, [0, y, 0], p, 0.005), flatLeaf("秋葵五裂大叶", p, [p[0] * 1.8, p[1] + 0.06, p[2] * 1.8], 0.23, "palm")); if (i < 5) parts.push(tapered("由叶腋向上生长的尖长五棱蒴果", green, [[0.02, y + 0.04, 0], [0.08, y + 0.14, 0], [0.1, y + 0.23, 0]], [0.015, 0.013, 0.0015])); }
    parts.push(petals(5, [0.015, 1.12, 0], 0.04, 0.085, 75, bloom), lobe("秋葵花喉", "#b39c8b", [0.015, 1.125, 0], [0.027, 0.015, 0.027]));
  } else if (kind === 1) {
    parts.push(beam("朝鲜蓟粗硬主茎", stalk, [0, 0, 0], [0, 0.75, 0], 0.028));
    for (let i = 0; i < 9; i++) { const a = i * 2.4; parts.push(flatLeaf("朝鲜蓟银灰深裂有棘大叶", [0, 0.04 + i % 3 * 0.15, 0], [Math.cos(a) * 0.55, 0.22 + i % 3 * 0.15, Math.sin(a) * 0.55], 0.27, "lobed")); }
    attach(parts, foodDesigns, "artichoke", [0, 0.74, 0]);
  } else if (kind === 2) {
    parts.push(tapered("成熟芦笋高直秆", stalk, [[0, 0, 0], [0, 0.8, 0], [0.015, 1.45, 0]], [0.012, 0.007, 0.002]));
    for (let i = 0; i < 11; i++) { const a = i * 2.4, y = 0.18 + i * 0.105; const p: Triple = [Math.cos(a) * (0.33 - i * 0.016), y + 0.1, Math.sin(a) * (0.33 - i * 0.016)]; parts.push(beam("芦笋斜上分枝", stalk, [0, y, 0], p, 0.0025)); const needles: ModelPart[] = []; for (let j = 1; j < 5; j++) { const t = j / 5; const root: Triple = [p[0] * t, y + (p[1] - y) * t, p[2] * t]; for (let k = 0; k < 5; k++) needles.push(needle("束生针状叶状枝", green, root, [root[0] + Math.cos(k * Math.PI * 2 / 5) * 0.05, root[1] + 0.035, root[2] + Math.sin(k * Math.PI * 2 / 5) * 0.05], 0.0012)); } parts.push(combineMeshes("单根侧枝的完整束生叶状枝", green, needles)); }
  } else {
    attach(parts, foodDesigns, "fennelBulb", [0, 0, 0]);
    for (let i = 0; i < 5; i++) { const a = i * 2.4; const top: Triple = [Math.cos(a) * 0.12, 0.65 + i % 2 * 0.1, Math.sin(a) * 0.12]; parts.push(beam("球茎茴香由膨大叶鞘伸出的分枝茎", stalk, [0, 0.11, 0], top, 0.005)); for (let row = 0; row < 3; row++) { const p: Triple = [top[0] * 0.7, 0.18 + row * 0.12, top[2] * 0.7]; const filaments: ModelPart[] = []; for (let j = 0; j < 15; j++) { const b = j * 2.4; filaments.push(needle("茴香末回丝状裂叶", green, p, [p[0] + Math.cos(b) * (0.07 + j % 3 * 0.03), p[1] + j / 15 * 0.12, p[2] + Math.sin(b) * 0.1], 0.0012)); } parts.push(combineMeshes("一簇三回细裂茴香叶", green, filaments)); } }
  }
  return parts;
}

function rosette(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (let i = 0; i < 8; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.18, 0.35 + i % 3 * 0.06, Math.sin(a) * 0.18]; parts.push(tapered("芹菜粗长开槽叶柄", pale, [[0, 0, 0], [p[0] * 0.4, 0.2, p[2] * 0.4], p], [0.011, 0.008, 0.004]), compoundLeaf(p, i * 137.5, 0.19, 1, true)); }
  } else if (kind === 1 || kind === 4) {
    for (let i = 0; i < 9; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.09, 0.12, Math.sin(a) * 0.09]; parts.push(beam(kind === 1 ? "甜菜从地表起的肉质长叶柄" : "菠菜细叶柄", kind === 1 ? "#b29d8c" : stalk, [0, 0, 0], p, kind === 1 ? 0.008 : 0.004), flatLeaf(kind === 1 ? "甜菜波状宽卵形叶" : "菠菜基部箭形的叶片", p, [Math.cos(a) * (kind === 1 ? 0.32 : 0.2), kind === 1 ? 0.32 : 0.22, Math.sin(a) * (kind === 1 ? 0.32 : 0.2)], kind === 1 ? 0.18 : 0.12, kind === 1 ? "heart" : "arrow")); }
  } else if (kind === 2) {
    for (let i = 0; i < 8; i++) parts.push(leaf("大蒜基部套叠的扁平带状叶", green, [0, i * 0.006, 0], 0.025, 0.52 - i * 0.028, [22 + i % 3 * 12, i * 137.5, 0]));
    parts.push(tapered("大蒜从叶丛抽出的弯曲花葶", stalk, [[0, 0, 0], [0, 0.43, 0], [0.08, 0.57, 0], [0.16, 0.53, 0], [0.14, 0.46, 0], [0.08, 0.48, 0]], [0.007, 0.005, 0.004, 0.0035, 0.003, 0.002]), lobe("蒜薹端部未展开的总苞", pale, [0.075, 0.48, 0], [0.02, 0.03, 0.02]));
  } else {
    parts.push(tapered("羽衣甘蓝直立有叶痕的短茎", stalk, [[0, 0, 0], [0, 0.32, 0]], [0.02, 0.012]));
    for (let i = 0; i < 10; i++) { const a = i * 2.4; const root: Triple = [0, 0.05 + i * 0.025, 0]; const end: Triple = [Math.cos(a) * 0.27, root[1] + 0.16, Math.sin(a) * 0.27]; const blade = flatLeaf("羽衣甘蓝主叶片", root, end, 0.22, "lobed"); parts.push(blade); const edge: ModelPart[] = []; for (let j = 0; j < 10; j++) { const t = 0.25 + j * 0.065; const side = j % 2 ? -1 : 1; edge.push(leaf("卷曲皱褶的立体叶缘", green, [end[0] * t + Math.sin(a) * side * 0.065, root[1] + 0.16 * t, end[2] * t - Math.cos(a) * side * 0.065], 0.045, 0.05, [j % 2 ? 35 : 80, i * 137.5, 0])); } parts.push(combineMeshes("单片羽衣甘蓝的起伏叶缘", green, edge)); }
  }
  return parts;
}

function legumesAndTubers(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (const side of [-1, 1]) { const tip: Triple = [side * 0.12, 0.46, 0]; parts.push(beam("鹰嘴豆基部二叉毛茎", stalk, [0, 0, 0], tip, 0.005)); for (let i = 0; i < 5; i++) { const t = (i + 1) / 6, y = 0.46 * t; parts.push(compoundLeaf([tip[0] * t, y, 0], i * 110, 0.12, 4)); if (i > 1) parts.push(lobe("鹰嘴豆膨大的短卵形荚果", pale, [tip[0] * t + 0.023, y - 0.013, 0.012], [0.027, 0.026, 0.024]), needle("豆荚端短弯尖", pale, [tip[0] * t + 0.028, y - 0.02, 0.018], [tip[0] * t + 0.038, y - 0.029, 0.018], 0.008)); } }
  } else if (kind === 1) {
    parts.push(tapered("甘薯贴地蔓生茎", "#a39b87", [[-0.4, 0.009, 0], [0, 0.009, 0], [0.45, 0.009, 0.08]], [0.003, 0.007, 0.002]));
    for (let i = 0; i < 9; i++) { const x = -0.34 + i * 0.08, side = i % 2 ? -1 : 1; const p: Triple = [x, 0.12, side * 0.09]; parts.push(beam("甘薯长叶柄", stalk, [x, 0.01, 0], p, 0.004), flatLeaf("甘薯基部心形的掌裂叶", p, [x, 0.19, side * 0.27], 0.18, "heart")); } parts.push(cap("甘薯合瓣漏斗花", bloom, [0.24, 0.06, 0.02], 0.028, 0.055, 3));
  } else if (kind === 2) {
    for (const side of [-1, 1]) { parts.push(tapered("马铃薯地上分枝茎", stalk, [[0, 0, 0], [side * 0.06, 0.24, 0], [side * 0.13, 0.6, 0]], [0.009, 0.007, 0.003])); for (let i = 0; i < 5; i++) { const p: Triple = [side * 0.025 * i, 0.1 + i * 0.1, 0]; parts.push(compoundLeaf(p, side * (i * 80 + 30), 0.24, 3)); } parts.push(petals(5, [side * 0.13, 0.6, 0], 0.017, 0.035, 75, bloom), lobe("马铃薯花中聚成圆锥的雄蕊", "#c2b58b", [side * 0.13, 0.612, 0], [0.012, 0.021, 0.012])); }
  } else {
    for (let i = 0; i < 7; i++) { const a = i * 2.4; const root: Triple = [0, 0.004, 0]; const tip: Triple = [Math.cos(a) * 0.22, 0.38 + i % 3 * 0.06, Math.sin(a) * 0.22]; parts.push(beam("胡萝卜由地表起的细叶柄", stalk, root, tip, 0.003)); for (let j = 0; j < 4; j++) { const t = 0.35 + j * 0.15; parts.push(compoundLeaf([tip[0] * t, tip[1] * t, tip[2] * t], i * 137.5 + j * 70, 0.09, 2, true)); } }
  }
  return parts;
}

function brassicas(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("苤蓝在地上膨大的球形茎", pale, [0, 0.095, 0], [0.2, 0.21, 0.2]), beam("膨大茎下方短基茎", stalk, [0, 0, 0], [0, 0.035, 0], 0.032));
    for (let i = 0; i < 8; i++) { const a = i * 2.4, y = 0.045 + i * 0.018; const root: Triple = [Math.cos(a) * 0.075, y, Math.sin(a) * 0.075], p: Triple = [Math.cos(a) * 0.17, y + 0.08, Math.sin(a) * 0.17]; parts.push(beam("球茎表面螺旋着生的叶柄", stalk, root, p, 0.006), flatLeaf("苤蓝粉质蜡层宽叶", p, [p[0] * 1.8, p[1] + 0.12, p[2] * 1.8], 0.16)); }
  } else if (kind === 1) {
    parts.push(tapered("牛蒡高大分枝茎", stalk, [[0, 0, 0], [0, 0.7, 0], [0.015, 1.35, 0]], [0.025, 0.016, 0.004]));
    for (let i = 0; i < 7; i++) { const a = i * 2.4, y = 0.06 + i * 0.14; const p: Triple = [Math.cos(a) * (0.18 - i * 0.013), y + 0.06, Math.sin(a) * (0.18 - i * 0.013)]; parts.push(beam("牛蒡粗长叶柄", stalk, [0, y, 0], p, 0.006), flatLeaf("牛蒡基部巨大心状卵形叶", p, [p[0] * 2.4, y + 0.18, p[2] * 2.4], 0.32 - i * 0.028, "heart")); }
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const p: Triple = [Math.cos(a) * 0.16, 1.15 + i % 2 * 0.12, Math.sin(a) * 0.16]; parts.push(beam("牛蒡顶端头状花序梗", stalk, [0, 1.05, 0], p, 0.004), lobe("牛蒡总苞球", green, p, [0.04, 0.04, 0.04])); const hooks: ModelPart[] = []; for (let j = 0; j < 18; j++) { const b = j * 2.4; const root: Triple = [p[0] + Math.cos(b) * 0.014, p[1] - 0.012 + j % 4 * 0.008, p[2] + Math.sin(b) * 0.014]; const tip: Triple = [p[0] + Math.cos(b) * 0.024, root[1] + 0.008, p[2] + Math.sin(b) * 0.024]; hooks.push(needle("总苞片末端向内弯的钩", pale, root, tip, 0.002), needle("钩刺弯回端", pale, tip, [tip[0] * 0.995, tip[1] - 0.005, tip[2] * 0.995], 0.0015)); } parts.push(combineMeshes("一枚牛蒡总苞的分立钩状苞片", pale, hooks)); }
  } else {
    parts.push(tapered("西兰花粗壮的地上主茎", stalk, [[0, 0, 0], [0, 0.37, 0]], [0.03, 0.023]));
    for (let i = 0; i < 8; i++) { const a = i * 2.4; parts.push(flatLeaf("西兰花宽阔粉质长叶", [0, 0.06 + i * 0.027, 0], [Math.cos(a) * 0.37, 0.22 + i * 0.027, Math.sin(a) * 0.37], 0.24, "lobed")); }
    attach(parts, produceDesigns, "broccoli", [0, 0.32, 0], 1.4);
  }
  return parts;
}

function specialty(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0 || kind === 1 || kind === 2 || kind === 5) {
    parts.push(vineStem(kind === 2 ? 1.8 : 1.15));
    for (let i = 0; i < 8; i++) { const a = i * 2.4, y = 0.15 + i * (kind === 2 ? 0.2 : 0.12); const root: Triple = [0, y, 0]; const p: Triple = [Math.cos(a) * 0.19, y + 0.06, Math.sin(a) * 0.19]; parts.push(flatLeaf(kind === 0 ? "荜茇互生心形叶" : kind === 1 ? "啤酒花掌状粗齿叶" : kind === 2 ? "香草兰肥厚长椭圆叶" : "木耳菜肉质近心形叶", root, p, kind === 2 ? 0.055 : 0.14, kind === 1 ? "palm" : kind === 2 ? "oval" : "heart"));
      if (kind === 0) parts.push(tapered("荜茇叶对面的密集肉穗果序", pale, [[0.025, y, 0], [0.035, y + 0.05, 0], [0.034, y + 0.085, 0]], [0.005, 0.006, 0.002]));
      if (kind === 1 && i > 3) attach(parts, seedFormDesigns, "hopsCone", [0.05, y - 0.07, 0], 0.8);
      if (kind === 2) { parts.push(tapered("香草兰茎节伸出的附着气根", pale, [root, [-0.025, y - 0.06, 0], [-0.04, y - 0.1, 0.01]], [0.0025, 0.002, 0.001])); if (i > 3) parts.push(tapered("叶腋下垂的长香草蒴果", green, [[0.015, y, 0], [0.045, y - 0.1, 0], [0.04, y - 0.2, 0]], [0.004, 0.0035, 0.0012])); }
      if (kind === 5 && i > 2) { parts.push(beam("木耳菜叶腋短穗轴", stalk, root, [0.06, y + 0.03, 0], 0.002)); for (let j = 0; j < 4; j++) parts.push(lobe("穗轴上的肉质浆果", "#9e9e8c", [0.025 + j * 0.01, y + 0.012 + j * 0.005, 0], [0.009, 0.009, 0.009])); }
    }
    if (kind === 2) parts.push(petals(5, [0, 1.76, 0], 0.025, 0.08, 65, bloom), cap("香草兰厚褶唇瓣", bloom, [0, 1.76, 0.03], 0.022, 0.05, 3));
  } else if (kind === 3) {
    parts.push(tapered("胭脂树矮小木质主干", stalk, [[0, 0, 0], [0, 0.6, 0], [0.02, 1.2, 0]], [0.045, 0.025, 0.01]));
    for (let i = 0; i < 6; i++) { const a = i * 2.4, y = 0.3 + i * 0.13; const p: Triple = [Math.cos(a) * 0.32, y + 0.14, Math.sin(a) * 0.32]; parts.push(beam("胭脂树结果枝", stalk, [0, y, 0], p, 0.009), flatLeaf("胭脂树互生大心形叶", p, [p[0] * 1.5, p[1] + 0.06, p[2] * 1.5], 0.16, "heart"), lobe("枝顶有软棘的心状蒴果", "#b5a087", [p[0], p[1] - 0.01, p[2]], [0.04, 0.05, 0.035])); const prickles: ModelPart[] = []; for (let j = 0; j < 18; j++) { const b = j * 2.4; const root: Triple = [p[0] + Math.cos(b) * 0.014, p[1] - 0.023 + j % 4 * 0.009, p[2] + Math.sin(b) * 0.012]; prickles.push(needle("蒴果外皮密生软棘", pale, root, [p[0] + (root[0] - p[0]) * 1.5, root[1] + 0.009, p[2] + (root[2] - p[2]) * 1.6], 0.002)); } parts.push(combineMeshes("一枚胭脂树果实的真实软棘", pale, prickles)); }
  } else {
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const p: Triple = [Math.cos(a) * 0.18, 0.024, Math.sin(a) * 0.18]; parts.push(tapered("马齿苋贴地辐射的肉质红茎", "#ad9a88", [[0, 0.006, 0], [p[0] * 0.5, 0.018, p[2] * 0.5], p], [0.0045, 0.003, 0.0015])); for (let row = 1; row < 5; row++) for (const side of [-1, 1]) { const t = row / 5; const root: Triple = [p[0] * t, 0.012 + t * 0.012, p[2] * t]; const end: Triple = [root[0] + Math.cos(a + side * 1.2) * 0.038, root[1] + 0.012, root[2] + Math.sin(a + side * 1.2) * 0.038]; parts.push(flatLeaf("马齿苋肉质倒卵形匙叶", root, end, 0.021)); } parts.push(petals(5, p, 0.004, 0.009, 65, bloom)); }
  }
  return parts;
}

const berryNames = [["grapeVine", "葡萄藤", "Vitis vinifera"], ["raspberryPlant", "覆盆子植株", "Rubus idaeus"], ["blueberryPlant", "蓝莓灌木", "Vaccinium corymbosum"], ["mulberryTree", "桑树", "Morus alba"], ["kiwiVine", "猕猴桃藤", "Actinidia chinensis"]];
const gourdNames = [["watermelonVine", "西瓜藤", "Citrullus lanatus"], ["bitterMelonVine", "苦瓜藤", "Momordica charantia"], ["bottleGourdVine", "葫芦藤", "Lagenaria siceraria"]];
const floweringNames = [["okraPlant", "秋葵植株", "Abelmoschus esculentus"], ["artichokePlant", "朝鲜蓟植株", "Cynara cardunculus"], ["asparagusPlant", "芦笋植株", "Asparagus officinalis"], ["fennelPlant", "球茎茴香植株", "Foeniculum vulgare"]];
const rosetteNames = [["celeryPlant", "芹菜植株", "Apium graveolens"], ["beetPlant", "甜菜植株", "Beta vulgaris"], ["garlicPlant", "大蒜植株", "Allium sativum"], ["kalePlant", "羽衣甘蓝", "Brassica oleracea Acephala Group"], ["spinachPlant", "菠菜", "Spinacia oleracea"]];
const tuberNames = [["chickpeaPlant", "鹰嘴豆植株", "Cicer arietinum"], ["sweetPotatoVine", "甘薯藤", "Ipomoea batatas"], ["potatoPlant", "马铃薯植株", "Solanum tuberosum"], ["carrotPlant", "胡萝卜植株", "Daucus carota"]];
const brassicaNames = [["kohlrabi", "苤蓝", "Brassica oleracea Gongylodes Group"], ["burdockPlant", "牛蒡植株", "Arctium lappa"], ["broccoliPlant", "西兰花植株", "Brassica oleracea Italica Group"]];
const specialtyNames = [["longPepperPlant", "荜茇植株", "Piper longum"], ["hopsVine", "啤酒花藤", "Humulus lupulus"], ["vanillaOrchid", "香草兰", "Vanilla planifolia"], ["annattoTree", "胭脂树", "Bixa orellana"], ["purslane", "马齿苋", "Portulaca oleracea"], ["malabarSpinach", "木耳菜", "Basella alba"]];

export const gardenCropDesigns: MasterNatureDesign[] = [
  ...berryNames.map(([key, name, species], i) => design(key!, name!, "植物", () => berries(i), ["果园与菜园植株", species!])),
  ...gourdNames.map(([key, name, species], i) => design(key!, name!, "植物", () => gourds(i), ["果园与菜园植株", species!])),
  ...floweringNames.map(([key, name, species], i) => design(key!, name!, "植物", () => floweringCrop(i), ["果园与菜园植株", species!])),
  ...rosetteNames.map(([key, name, species], i) => design(key!, name!, "植物", () => rosette(i), ["果园与菜园植株", species!])),
  ...tuberNames.map(([key, name, species], i) => design(key!, name!, "植物", () => legumesAndTubers(i), ["果园与菜园植株", species!])),
  ...brassicaNames.map(([key, name, species], i) => design(key!, name!, "植物", () => brassicas(i), ["果园与菜园植株", species!])),
  ...specialtyNames.map(([key, name, species], i) => design(key!, name!, "植物", () => specialty(i), ["果园与菜园植株", species!])),
];
