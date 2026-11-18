import { design, frontCup, leaf, lobe, part, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { strip } from "./shapedFoods";

const green = "#80966d";
const pale = "#d0cfb9";
const bloom = "#c5b8c0";
const throat = "#a99b9f";

function pleatedLeaf(root: Triple, end: Triple, width: number): ModelPart {
  const delta: Triple = [end[0] - root[0], end[1] - root[1], end[2] - root[2]], length = Math.hypot(...delta), horizontal = Math.hypot(delta[0], delta[2]), across: Triple = [delta[2] / horizontal, 0, -delta[0] / horizontal], up: Triple = [-delta[1] * delta[0] / (length * horizontal), horizontal / length, -delta[1] * delta[2] / (length * horizontal)];
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], rows = 9, columns = 7, sheet = rows * columns;
  for (const layer of [1, 0]) for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) { const t = row / (rows - 1), x = (column / (columns - 1) - 0.5) * (Math.sin(t * Math.PI) * width + 0.0016), fold = (column % 2 * 0.006 + layer * 0.0015) * Math.sin(t * Math.PI) + layer * 0.0006; vertices.push({ x: root[0] + delta[0] * t + across[0] * x + up[0] * fold, y: root[1] + delta[1] * t + up[1] * fold, z: root[2] + delta[2] * t + across[2] * x + up[2] * fold }); }
  for (let row = 0; row < rows - 1; row++) for (let column = 0; column < columns - 1; column++) { const a = row * columns + column, b = a + 1, c = a + columns, d = c + 1; indices.push(a, c, b, b, c, d, a + sheet, b + sheet, c + sheet, b + sheet, d + sheet, c + sheet); }
  for (let row = 0; row < rows - 1; row++) for (const column of [0, columns - 1]) { const a = row * columns + column, b = a + columns; if (column) indices.push(a, b, a + sheet, a + sheet, b, b + sheet); else indices.push(a, a + sheet, b, a + sheet, b + sheet, b); }
  for (let column = 0; column < columns - 1; column++) { const endRow = (rows - 1) * columns, a = endRow + column, b = a + 1; indices.push(column, column + 1, column + sheet, column + 1, column + 1 + sheet, column + sheet, a, a + sheet, b, b, a + sheet, b + sheet); }
  return part("鸽子兰叶面自身折起的连续纵褶叶", "mesh", green, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function aerialRoots(parts: ModelPart[], root: Triple, length: number, count: number) {
  for (let i = 0; i < count; i++) { const a = i * 2.4; parts.push(tapered("地表以上可见的兰科气生根", "#b0b89d", [root, [root[0] + Math.cos(a) * length * 0.55, root[1] - length * 0.35, root[2] + Math.sin(a) * length * 0.35], [root[0] + Math.cos(a) * length, Math.max(0, root[1] - length * 0.75), root[2] + Math.sin(a) * length * 0.55]], [0.0035, 0.0025, 0.001])); }
}

function orchidFace(parts: ModelPart[], root: Triple, size: number, kind: number) {
  const flower: ModelPart[] = [];
  if (kind === 0) {
    for (let i = 0; i < 3; i++) { const a = (90 + i * 120) * Math.PI / 180; flower.push(leaf("卡特兰三片狭长外萼片", pale, [Math.cos(a) * size * 0.08, Math.sin(a) * size * 0.08, 0], size * 0.25, size * 0.7, [0, 0, a * 180 / Math.PI - 90])); }
    for (const side of [-1, 1]) flower.push(leaf("卡特兰两片展开的宽花瓣", bloom, [side * size * 0.08, size * 0.08, 0.002], size * 0.65, size * 0.74, [0, 0, -side * 58]));
    const lip = sweptProfile("卡特兰围合成漏斗的宽大唇瓣", throat, [[size * 0.12, 0], [size * 0.22, size * 0.19], [size * 0.36, size * 0.37], [size * 0.34, size * 0.37], [size * 0.2, size * 0.19], [size * 0.1, 0]], Math.PI * 1.67, 24); lip.rotation.x = 118; lip.position.y = -size * 0.04; flower.push(lip);
    for (let i = 0; i < 9; i++) { const a = Math.PI * 0.18 + i / 8 * Math.PI * 1.5; flower.push(leaf("宽唇瓣远端真实卷曲的褶边", bloom, [Math.cos(a) * size * 0.28, -size * 0.2 + Math.sin(a) * size * 0.15, size * 0.27], size * 0.15, size * 0.17, [35, 0, a * 180 / Math.PI - 90])); }
  } else if (kind === 1) {
    for (let i = 0; i < 5; i++) { const a = [90, 210, 330, 40, 140][i]! * Math.PI / 180; flower.push(leaf("文心兰花中心狭小的萼瓣", pale, [0, 0, 0], size * 0.18, size * 0.32, [0, 0, a * 180 / Math.PI - 90])); }
    flower.push(polygon("文心兰远大于萼瓣的三裂舞裙状唇瓣", "#c4bc97", [[0, 0], [-size * 0.11, size * 0.08], [-size * 0.35, size * 0.13], [-size * 0.42, size * 0.43], [-size * 0.22, size * 0.54], [0, size * 0.46], [size * 0.22, size * 0.54], [size * 0.42, size * 0.43], [size * 0.35, size * 0.13], [size * 0.11, size * 0.08]], size * 0.035)); flower.at(-1)!.rotation.x = 90;
  } else if (kind === 2) {
    for (let i = 0; i < 5; i++) { const a = [90, 210, 330, 35, 145][i]! * Math.PI / 180; flower.push(leaf("万代兰五片近圆而分开的萼瓣", bloom, [Math.cos(a) * size * 0.06, Math.sin(a) * size * 0.06, 0], size * 0.44, size * 0.55, [0, 0, a * 180 / Math.PI - 90])); }
    flower.push(frontCup("万代兰中央短而有腔的小唇瓣", throat, [0, -size * 0.07, 0.001], size * 0.12, size * 0.14));
    for (const side of [-1, 1]) flower.push(leaf("万代兰唇瓣两侧直立的小侧裂片", pale, [side * size * 0.08, -size * 0.06, size * 0.05], size * 0.13, size * 0.17, [25, -side * 65, 0]));
    flower.push(leaf("万代兰唇瓣中央向下的裂片", throat, [0, -size * 0.09, size * 0.08], size * 0.15, size * 0.24, [0, 0, 180]));
  } else if (kind === 3) {
    const cup = sweptProfile("三尖兰三个萼片基部合生的浅三角杯", bloom, [[size * 0.16, 0], [size * 0.3, size * 0.1], [size * 0.27, size * 0.12], [size * 0.14, size * 0.01]], Math.PI * 2, 3); cup.rotation.x = 90; flower.push(cup);
    for (let i = 0; i < 3; i++) { const a = (90 + i * 120) * Math.PI / 180; flower.push(leaf("三尖兰宽三角形的独立萼片前缘", bloom, [Math.cos(a) * size * 0.08, Math.sin(a) * size * 0.08, size * 0.08], size * 0.55, size * 0.48, [0, 0, a * 180 / Math.PI - 90]), tapered("三片萼片末端真实细长的尾尖", pale, [[Math.cos(a) * size * 0.35, Math.sin(a) * size * 0.35, size * 0.08], [Math.cos(a) * size * 0.95, Math.sin(a) * size * 0.95, size * 0.04]], [size * 0.035, size * 0.008])); }
  } else if (kind === 4) {
    const cup = frontCup("鸽子兰肉质花被围成的深杯", pale, [0, 0, 0], size * 0.38, size * 0.26); flower.push(cup);
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; flower.push(leaf("鸽子兰杯口五枚向外圆钝的萼瓣", pale, [Math.cos(a) * size * 0.23, Math.sin(a) * size * 0.23, size * 0.19], size * 0.34, size * 0.25, [18, 0, a * 180 / Math.PI - 90])); }
    flower.push(lobe("杯内弯曲粗壮的蕊柱", pale, [0, size * 0.05, size * 0.21], [size * 0.14, size * 0.31, size * 0.14]), leaf("与蕊柱组成鸽形轮廓的肉质唇瓣", pale, [0, -size * 0.12, size * 0.2], size * 0.3, size * 0.3, [-70, 0, 180]));
    for (const side of [-1, 1]) flower.push(lobe("蕊柱两侧相连的短侧翼", pale, [side * size * 0.1, size * 0.04, size * 0.25], [size * 0.15, size * 0.1, size * 0.08]));
  } else {
    for (let i = 0; i < 5; i++) { const a = [90, 210, 330, 30, 150][i]! * Math.PI / 180; flower.push(leaf("达尔文兰星形排列的五枚细长萼瓣", pale, [0, 0, 0], size * 0.22, size * 0.8, [0, 0, a * 180 / Math.PI - 90])); }
    flower.push(leaf("达尔文兰位于星花下方的宽舌形唇瓣", pale, [0, 0, 0.005], size * 0.47, size * 0.67, [0, 0, 180]), tapered("从花后延伸远长于花体的蜜距", pale, [[0, -size * 0.03, 0], [size * 0.09, -size * 0.26, -size * 0.35], [size * 0.08, -size * 1.3, -size * 0.44], [-size * 0.02, -size * 2.2, -size * 0.24]], [size * 0.045, size * 0.035, size * 0.023, size * 0.01]));
  }
  flower.push(lobe("花中心与唇瓣相连的蕊柱", pale, [0, size * 0.025, size * 0.13], [size * 0.12, size * 0.18, size * 0.12]));
  for (const p of flower) { p.position.x += root[0]; p.position.y += root[1]; p.position.z += root[2]; parts.push(p); }
}

function orchid(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(tapered("卡特兰地表连接各假鳞茎的根状轴", green, [[-0.07, 0.008, 0], [0.07, 0.008, 0]], [0.007, 0.007]));
    for (let i = 0; i < 3; i++) { const x = (i - 1) * 0.055; parts.push(lobe("卡特兰独立棒状假鳞茎", green, [x, 0.1, 0], [0.035, 0.2, 0.033]), flatLeaf("假鳞茎顶端单片厚革质叶", [x, 0.18, 0], [x + (i - 1) * 0.06, 0.35, -0.04], 0.07, "oval")); }
    parts.push(tapered("从新假鳞茎顶端抽出的花梗", green, [[0, 0.18, 0], [0, 0.37, 0.025]], [0.004, 0.002]), leaf("花梗基部包住新花序的佛焰状鞘", green, [0, 0.18, 0], 0.025, 0.1, [10, 0, 0])); orchidFace(parts, [0, 0.36, 0.03], 0.095, 0); aerialRoots(parts, [0, 0.018, 0], 0.1, 4);
  } else if (kind === 1) {
    for (let i = 0; i < 3; i++) { const x = (i - 1) * 0.035; parts.push(lobe("文心兰扁卵形假鳞茎", green, [x, 0.04, 0], [0.036, 0.08, 0.02]), flatLeaf("假鳞茎顶端的长带形叶", [x, 0.07, 0], [x + (i - 1) * 0.1, 0.26, -0.02], 0.027, "oval")); }
    parts.push(tapered("文心兰从基部抽出的分枝长花序轴", green, [[0, 0.015, 0], [0.01, 0.35, 0], [0.055, 0.59, 0]], [0.003, 0.002, 0.001]));
    for (let i = 0; i < 7; i++) { const y = 0.33 + i * 0.035, x = y < 0.35 ? 0.01 * (y - 0.015) / 0.335 : 0.01 + 0.045 * (y - 0.35) / 0.24, root: Triple = [x + (i % 2 ? 1 : -1) * 0.055, y + 0.016, 0.01]; parts.push(tapered("花序交替伸出的分枝花柄", green, [[x, y, 0], root], [0.0012, 0.0007])); orchidFace(parts, root, 0.028, 1); }
  } else if (kind === 2 || kind === 5) {
    const height = kind === 2 ? 0.44 : 0.38; parts.push(tapered("单轴兰连续向上生长的直立茎", green, [[0, 0, 0], [0, height, 0]], [0.012, 0.007]));
    for (let node = 0; node < 7; node++) { const side = node % 2 ? -1 : 1, y = 0.055 + node * 0.045; parts.push(strip("直立茎上两列相互交叠的厚带状叶", green, [[0, y, 0], [side * 0.07, y + 0.03, 0], [side * (kind === 2 ? 0.16 : 0.21), y + 0.013, 0]], kind === 2 ? 0.026 : 0.044, 0.004)); }
    aerialRoots(parts, [0, 0.12, -0.005], 0.18, 5);
    if (kind === 2) { parts.push(tapered("万代兰叶腋向侧面抽出的花序轴", green, [[0, 0.22, 0], [0.055, 0.4, 0.025], [0.07, 0.57, 0.025]], [0.004, 0.0025, 0.001])); for (let i = 0; i < 4; i++) { const y = 0.39 + i * 0.045, x = y < 0.4 ? 0.055 * (y - 0.22) / 0.18 : 0.055 + 0.015 * (y - 0.4) / 0.17, root: Triple = [x + (i % 2 ? 1 : -1) * 0.025, y, 0.055]; parts.push(tapered("万代兰短花柄", green, [[x, y, 0.025], root], [0.002, 0.001])); orchidFace(parts, root, 0.065, 2); } }
    else { parts.push(tapered("达尔文兰从上部叶腋伸出的粗短花梗", green, [[0, 0.28, 0], [0, 0.42, 0.06]], [0.005, 0.003])); orchidFace(parts, [0, 0.42, 0.06], 0.115, 5); }
  } else if (kind === 3) {
    for (let i = 0; i < 7; i++) { const a = i * 2.4, root: Triple = [Math.cos(a) * 0.012, 0.006, Math.sin(a) * 0.012], end: Triple = [Math.cos(a) * 0.07, 0.14 + i % 3 * 0.012, Math.sin(a) * 0.06]; parts.push(tapered("三尖兰没有假鳞茎的单叶短柄", green, [root, [root[0], 0.045, root[2]]], [0.002, 0.0015]), flatLeaf("每条短柄顶端的独立倒披针叶", [root[0], 0.045, root[2]], end, 0.026, "oval")); }
    parts.push(tapered("从叶丛中伸出的三尖兰单花柄", green, [[0, 0.008, 0], [0, 0.2, 0.02]], [0.0025, 0.001])); orchidFace(parts, [0, 0.2, 0.02], 0.055, 3);
  } else {
    parts.push(lobe("鸽子兰大型近卵形假鳞茎", green, [0, 0.075, 0], [0.09, 0.15, 0.085]));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, root: Triple = [Math.cos(a) * 0.015, 0.13, Math.sin(a) * 0.015], end: Triple = [Math.cos(a) * 0.22, 0.47, Math.sin(a) * 0.22]; parts.push(pleatedLeaf(root, end, 0.095)); }
    parts.push(tapered("鸽子兰从假鳞茎基部抽出的直立花葶", green, [[0.035, 0.015, 0], [0.06, 0.6, 0], [0.07, 0.8, 0]], [0.006, 0.004, 0.002]));
    for (let i = 0; i < 3; i++) { const y = 0.61 + i * 0.064, x = 0.06 + 0.01 * (y - 0.6) / 0.2, root: Triple = [x + (i % 2 ? -0.025 : 0.025), y, 0.032]; parts.push(tapered("鸽子兰花序上短而粗的花柄", green, [[x, y, 0], root], [0.003, 0.002])); orchidFace(parts, root, 0.06, 4); }
  }
  return parts;
}

const entries = [["cattleya", "卡特兰", "Cattleya"], ["oncidium", "文心兰", "Oncidium"], ["vanda", "万代兰", "Vanda"], ["masdevallia", "三尖兰", "Masdevallia"], ["peristeria", "鸽子兰", "Peristeria elata"], ["angraecum", "达尔文兰", "Angraecum sesquipedale"]];

export const orchidFormDesigns: MasterNatureDesign[] = entries.map(([key, name, taxon], i) => design(key!, name!, "植物", () => orchid(i), [taxon!, "兰科具名形态", "独特生长方式与唇瓣"]));
