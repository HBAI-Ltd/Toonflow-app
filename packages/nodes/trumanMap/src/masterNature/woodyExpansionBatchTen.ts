import { combineMeshes, design, lobe, needle, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { branchPoint, leafyShoot } from "./woodyExpansionBatchOne";

const bark = "#a2987d";
const green = "#83976f";
const coneColor = "#aea282";
type Branch = { root: Triple; middle: Triple; end: Triple };

function mix(a: Triple, b: Triple, t: number): Triple { return a.map((value, axis) => value + (b[axis]! - value) * t) as Triple; }

function coniferFrame(height: number, spread: number, tiers: number, perTier: number, bole = .25): { parts: ModelPart[]; branches: Branch[] } {
  const parts = [tapered("成年针叶乔木完整直立承重干", bark, [[0, 0, 0], [0, height * .6, 0], [0, height, 0]], [height * .022, height * .014, .008])], branches: Branch[] = [];
  for (let tier = 0; tier < tiers; tier++) for (let axis = 0; axis < perTier; axis++) {
    const a = axis * Math.PI * 2 / perTier + tier * .9, y = height * (bole + tier / Math.max(1, tiers - 1) * (.89 - bole)), r = spread * (1 - tier / (tiers + .4)), root: Triple = [0, y, 0], middle: Triple = [Math.cos(a) * r * .64, y + .35, Math.sin(a) * r * .64], end: Triple = [Math.cos(a) * r, y - .14, Math.sin(a) * r];
    parts.push(tapered("与主干连续相接后向外舒展的木质骨枝", bark, [root, middle, end], [height * .0065 * (1 - tier * .13), .022, .002])); branches.push({ root, middle, end });
  }
  branches.push({ root: [0, height * .96, 0], middle: [0, height * .985, 0], end: [0, height, 0] });
  return { parts, branches };
}

function coniferMass(branches: Branch[], thickness: number): ModelPart {
  return combineMeshes("由各层细枝群组成且随真实枝长收窄的叶冠体积", green, branches.map(({ end }) => { const r = Math.max(.3, Math.hypot(end[0], end[2])); return lobe("针叶细枝群的低面远景体积", green, [end[0] * .72, end[1] + thickness * .12, end[2] * .72], [r * .87, thickness, r * .76]); }));
}

export function flatNeedle(name: string, root: Triple, end: Triple, width: number): ModelPart {
  const d = end.map((value, axis) => value - root[axis]!) as Triple, h = Math.hypot(d[0], d[2]), length = Math.hypot(...d), across: Triple = h > 1e-8 ? [d[2] / h, 0, -d[0] / h] : [1, 0, 0], up: Triple = h > 1e-8 ? [-d[1] * d[0] / length / h, h / length, -d[1] * d[2] / length / h] : [0, 0, -1], middle = mix(root, end, .48), thickness = Math.min(width * .15, .001), indices: number[] = [];
  const point = (a: Triple, vector: Triple, k: number) => ({ x: a[0] + vector[0] * k, y: a[1] + vector[1] * k, z: a[2] + vector[2] * k });
  const vertices = [{ x: root[0], y: root[1], z: root[2] }, point(middle, across, width / 2), { x: end[0], y: end[1], z: end[2] }, point(middle, across, -width / 2), point(middle, up, thickness / 2), point(middle, up, -thickness / 2)];
  for (let side = 0; side < 4; side++) { const j = (side + 1) % 4; indices.push(4, j, side, 5, side, j); }
  return part(name, "mesh", green, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function needleShoot(root: Triple, end: Triple, length: number, width: number, rows: number, around = 2, twist = around === 2 ? 0 : .5): ModelPart[] {
  const pieces: ModelPart[] = [], a = Math.atan2(end[2] - root[2], end[0] - root[0]), wood = needle("针叶枝中央连续相连的真实木质细轴", bark, root, end, .0025);
  for (let row = 0; row < rows; row++) for (let side = 0; side < around; side++) { const p = mix(root, end, (row + 1) / (rows + 1)), b = side * Math.PI * 2 / around + row * twist, q: Triple = [p[0] + Math.cos(a) * length * .4 - Math.sin(a) * Math.cos(b) * length, p[1] + Math.sin(b) * length + .002, p[2] + Math.sin(a) * length * .4 + Math.cos(a) * Math.cos(b) * length]; pieces.push(flatNeedle("木质细轴上逐枚独立着生的真实扁针叶", p, q, width)); }
  const result = [wood]; for (let offset = 0; offset < pieces.length; offset += 72) result.push(combineMeshes("保留全部独立扁针叶的完整细枝叶组", green, pieces.slice(offset, offset + 72)));
  return result;
}

function spiralCone(root: Triple, length: number, radius: number, rows: number, perRow: number): ModelPart[] {
  const end: Triple = [root[0], root[1] + length, root[2]], scales: ModelPart[] = [];
  for (let row = 0; row < rows; row++) for (let scale = 0; scale < perRow; scale++) { const a = scale * Math.PI * 2 / perRow + row * 1.1, p = mix(root, end, (row + .3) / rows), r = radius * Math.sin((row + .7) / (rows + 1) * Math.PI); scales.push(flatNeedle("球果同一中轴上逐层螺旋覆叠的独立木质种鳞", p, [p[0] + Math.cos(a) * r, p[1] + length / rows * .85, p[2] + Math.sin(a) * r], radius * .65)); }
  const parts: ModelPart[] = [tapered("承托全部种鳞的真实球果中轴", coneColor, [root, end], [radius * .22, .001])];
  for (let offset = 0; offset < scales.length; offset += 72) parts.push(combineMeshes("同一完整球果上逐枚可辨的覆叠木质种鳞", coneColor, scales.slice(offset, offset + 72)));
  return parts;
}

function scaleFan(root: Triple, end: Triple, length: number, width: number, name: string, underside?: string, vertical = false): ModelPart[] {
  const a = Math.atan2(end[2] - root[2], end[0] - root[0]), wood: ModelPart[] = [needle(`${name}扁枝中心连续的叶轴`, bark, root, end, .002)], blades: ModelPart[] = [];
  for (let node = 0; node < 4; node++) for (const side of [-1, 1]) {
    const p = mix(root, end, .2 + node * .2), reach = .032 * (1 - node * .12), q: Triple = vertical ? [p[0] + Math.cos(a) * .018, p[1] + side * reach, p[2] + Math.sin(a) * .018] : [p[0] + Math.cos(a) * .018 - Math.sin(a) * reach * side, p[1], p[2] + Math.sin(a) * .018 + Math.cos(a) * reach * side]; wood.push(needle(`${name}二级扁平细枝`, bark, p, q, .001));
    for (let row = 0; row < 9; row++) for (const leafSide of [-1, 1]) { const base = mix(p, q, (row + 1) / 10), b = a + side * .7, finish: Triple = vertical ? [base[0] + Math.cos(a) * length * .5, base[1] + leafSide * length, base[2] + Math.sin(a) * length * .5] : [base[0] + Math.cos(b) * length * .6 - Math.sin(b) * leafSide * length, base[1] + .0005, base[2] + Math.sin(b) * length * .6 + Math.cos(b) * leafSide * length]; blades.push(flatNeedle(`${name}实际覆盖在枝表的交互对生鳞叶`, base, finish, width)); }
  }
  const result = [combineMeshes(`${name}完整平面叶枝的全部相连轴`, bark, wood)];
  for (let offset = 0; offset < blades.length; offset += 64) {
    const batch = blades.slice(offset, offset + 64);
    if (!underside) { result.push(combineMeshes(`${name}一组真实交互对生的覆叠鳞叶`, green, batch)); continue; }
    for (const lower of [false, true]) result.push(combineMeshes(`${name}${lower ? "与正面共用轮廓的真实白色叶背" : "完整绿色鳞叶正面"}`, lower ? underside : green, batch.map(value => ({ ...value, indices: value.indices!.filter((_, index, indices) => indices[Math.floor(index / 3) * 3] === (lower ? 5 : 4)) }))));
  }
  return result;
}

function chinaFir(): ModelPart[] {
  const { parts, branches } = coniferFrame(27, 5.6, 4, 2);
  for (const { root, middle, end } of branches) {
    for (const side of [-1, 1]) { const p = branchPoint(root, middle, end, side < 0 ? .72 : .95, .64), a = Math.atan2(end[2], end[0]) + side * .6; parts.push(...needleShoot(p, [p[0] + Math.cos(a) * .28, p[1] + .02, p[2] + Math.sin(a) * .28], .045, .0045, 12, 3)); }
  }
  for (const { end } of branches.slice(0, 4)) parts.push(...spiralCone(end, .035, .02, 4, 6));
  parts.push(coniferMass(branches, 1.6)); return parts;
}

function taiwania(): ModelPart[] {
  const { parts, branches } = coniferFrame(43, 6.6, 4, 2, .4);
  for (const { root, middle, end } of branches) {
    const scales: ModelPart[] = [], stems: ModelPart[] = [], a = Math.atan2(end[2], end[0]);
    for (let twig = 0; twig < 3; twig++) { const p = branchPoint(root, middle, end, .66 + twig * .14, .64), b = a + (twig - 1) * .55, q: Triple = [p[0] + Math.cos(b) * .09, p[1] - .07, p[2] + Math.sin(b) * .09]; stems.push(needle("台湾杉成年柔垂细枝的真实中心轴", bark, p, q, .002)); for (let row = 0; row < 12; row++) for (let leafIndex = 0; leafIndex < 4; leafIndex++) { const base = mix(p, q, (row + 1) / 13), c = leafIndex * Math.PI / 2 + row * .4; scales.push(needle("台湾杉成年枝上覆叠内弯的短鳞钻形叶", green, base, [base[0] + Math.cos(c) * .003, base[1] + .002, base[2] + Math.sin(c) * .003], .0008)); } }
    parts.push(combineMeshes("台湾杉自然柔垂而相连的成年细枝", bark, stems));
    for (let offset = 0; offset < scales.length; offset += 72) parts.push(combineMeshes("台湾杉每条柔垂枝上保留全部的短鳞钻形叶", green, scales.slice(offset, offset + 72)));
  }
  for (const { end } of branches.slice(0, 3)) parts.push(...spiralCone(end, .018, .008, 4, 5));
  parts.push(coniferMass(branches, 2.3)); return parts;
}

function incenseCedar(): ModelPart[] {
  const { parts, branches } = coniferFrame(24.5, 4.7, 4, 2);
  for (const { root, middle, end } of branches) {
    parts.push(...scaleFan(branchPoint(root, middle, end, .9, .64), end, .006, .002, "翠柏"));
  }
  for (const { end } of branches.slice(0, 4)) {
    const scales: ModelPart[] = [];
    for (let pair = 0; pair < 3; pair++) for (const side of [-1, 1]) { const p: Triple = [end[0], end[1] + pair * .007, end[2]]; scales.push(flatNeedle("翠柏球果真实三对木质种鳞中的独立一片", p, [p[0] + side * .004, p[1] + .014, p[2]], .0055)); }
    parts.push(combineMeshes("翠柏由三对种鳞组成而非球形多鳞的长小球果", coneColor, scales));
  }
  parts.push(coniferMass(branches, 1.8)); return parts;
}

function hiba(): ModelPart[] {
  const { parts, branches } = coniferFrame(22, 5.2, 3, 2, .27);
  for (const { root, middle, end } of branches) parts.push(...scaleFan(branchPoint(root, middle, end, .91, .64), end, .009, .0045, "罗汉柏", "#c8cbb6"));
  for (const { end } of branches.slice(0, 3)) {
    const scales: ModelPart[] = [];
    for (let scale = 0; scale < 8; scale++) { const a = scale * 2.4, row = Math.floor(scale / 4), p: Triple = [end[0], end[1] + row * .006, end[2]]; scales.push(flatNeedle("罗汉柏宽木质种鳞端部的硬尖突出部", p, [p[0] + Math.cos(a) * .008, p[1] + .009, p[2] + Math.sin(a) * .008], .008)); }
    parts.push(combineMeshes("罗汉柏真实八枚宽鳞围成的近圆小球果", coneColor, scales));
  }
  parts.push(coniferMass(branches, 2)); return parts;
}

function orientalArborvitae(): ModelPart[] {
  const { parts, branches } = coniferFrame(15.5, 3.7, 4, 2, .2);
  for (const { root, middle, end } of branches) parts.push(...scaleFan(branchPoint(root, middle, end, .9, .64), end, .0055, .002, "侧柏", undefined, true));
  for (const { end } of branches.slice(0, 4)) {
    const scales: ModelPart[] = [], hooks: ModelPart[] = [];
    for (let pair = 0; pair < 4; pair++) for (const side of [-1, 1]) { const a = pair * Math.PI / 2, p: Triple = [end[0], end[1] + pair * .004, end[2]], q: Triple = [p[0] + Math.cos(a) * side * .007, p[1] + .006, p[2] + Math.sin(a) * side * .007]; scales.push(flatNeedle("侧柏八枚厚木质种鳞中有弯尖的一片", p, q, .007)); hooks.push(needle("侧柏成熟厚种鳞端部真实向上反曲的硬钩尖", coneColor, q, [q[0], q[1] + .005, q[2]], .001)); }
    parts.push(combineMeshes("侧柏真实厚鳞构成的长卵球果", coneColor, scales), combineMeshes("侧柏球果每枚木鳞上反曲的独立钩尖", coneColor, hooks));
  }
  parts.push(coniferMass(branches, 1.3)); return parts;
}

function torreya(): ModelPart[] {
  const { parts, branches } = coniferFrame(17.5, 5.5, 3, 2, .35);
  for (const { root, middle, end } of branches) { const p = branchPoint(root, middle, end, .86, .64), a = Math.atan2(end[2], end[0]); parts.push(...needleShoot(p, [p[0] + Math.cos(a) * .2, p[1] + .02, p[2] + Math.sin(a) * .2], .025, .0035, 16)); }
  const seeds: ModelPart[] = [], stems: ModelPart[] = [];
  for (const { end } of branches) for (const side of [-1, 1]) { const p: Triple = [end[0] + side * .008, end[1] - .01, end[2]]; stems.push(needle("榧树完整种子各自极短的种子柄", bark, end, p, .002)); seeds.push(lobe("榧树外种皮完全包合而非开放红杯的长卵裸子", coneColor, [p[0], p[1] - .014, p[2]], [.018, .031, .018])); }
  parts.push(combineMeshes("榧树成对种子真实相连的短轴", bark, stems), combineMeshes("榧树果状包被中的独立长卵裸子", coneColor, seeds), coniferMass(branches, 2)); return parts;
}

function plumYew(): ModelPart[] {
  const { parts, branches } = coniferFrame(9.5, 3.7, 3, 2, .25);
  for (const { root, middle, end } of branches) { const p = branchPoint(root, middle, end, .85, .64), a = Math.atan2(end[2], end[0]); parts.push(...needleShoot(p, [p[0] + Math.cos(a) * .18, p[1] + .015, p[2] + Math.sin(a) * .18], .04, .0032, 14)); }
  const fruits: ModelPart[] = [], stems: ModelPart[] = [];
  for (const { end } of branches) for (let seed = 0; seed < 3; seed++) { const a = seed * Math.PI * 2 / 3, p: Triple = [end[0] + Math.cos(a) * .02, end[1] - .025, end[2] + Math.sin(a) * .02]; stems.push(needle("日本粗榧数枚卵形裸子的共有长柄分轴", bark, end, p, .0018)); fruits.push(lobe("日本粗榧略呈橄榄形的完整肉质包被裸子", "#b4a394", p, [.02, .033, .02])); }
  parts.push(combineMeshes("日本粗榧肉质种子群的分枝长轴", bark, stems), combineMeshes("日本粗榧一整株真实分离的肉质包被种子", "#b4a394", fruits), coniferMass(branches, 1.8)); return parts;
}

function catkinYew(): ModelPart[] {
  const { parts, branches } = coniferFrame(11.5, 4.2, 3, 2, .35);
  for (const { root, middle, end } of branches) { const p = branchPoint(root, middle, end, .85, .64), a = Math.atan2(end[2], end[0]); parts.push(...needleShoot(p, [p[0] + Math.cos(a) * .25, p[1], p[2] + Math.sin(a) * .25], .065, .006, 12)); }
  for (const { end } of branches) {
    const cones: ModelPart[] = [], p: Triple = [end[0], end[1] - .12, end[2]]; parts.push(needle("穗花杉雄株长穗状花粉球花序实际下垂的总轴", bark, end, p, .0015));
    for (let cone = 0; cone < 10; cone++) { const q = mix(end, p, (cone + 1) / 11), side = cone % 2 ? 1 : -1; cones.push(lobe("穗花杉长穗轴上单独排列的小雄球花", coneColor, [q[0] + side * .003, q[1], q[2]], [.0045, .006, .0045])); }
    parts.push(combineMeshes("穗花杉特有的细长下垂雄球花序", coneColor, cones));
  }
  parts.push(coniferMass(branches, 2.2)); return parts;
}

function nagi(): ModelPart[] {
  const { parts, branches } = coniferFrame(21.5, 5, 3, 2, .4);
  for (const { root, middle, end } of branches) { const p = branchPoint(root, middle, end, .86, .64); parts.push(...leafyShoot(p, end, .11, .043, "oval", true)); }
  const seeds: ModelPart[] = [], stems: ModelPart[] = [];
  for (const { end } of branches) { const p: Triple = [end[0], end[1] - .015, end[2]]; stems.push(needle("竹柏单生种子连接枝端的细柄", bark, end, p, .002)); seeds.push(lobe("竹柏无膨大双节种托的球形肉质包被裸子", coneColor, p, [.014, .016, .014])); }
  parts.push(combineMeshes("竹柏一整株种子独立的短柄", bark, stems), combineMeshes("竹柏枝端真实独立的近球裸子", coneColor, seeds), coniferMass(branches, 2.6)); return parts;
}

function africanYellowwood(): ModelPart[] {
  const { parts, branches } = coniferFrame(36.5, 7.2, 3, 2, .48);
  for (const { root, middle, end } of branches) {
    const needles: ModelPart[] = [], stems: ModelPart[] = [], a = Math.atan2(end[2], end[0]);
    for (const side of [-1, 1]) { const p = branchPoint(root, middle, end, side < 0 ? .8 : .95, .64), b = a + side * .6, q: Triple = [p[0] + Math.cos(b) * .15, p[1] + .01, p[2] + Math.sin(b) * .15]; stems.push(needle("非洲罗汉松螺旋细叶真实木质短枝", bark, p, q, .002)); for (let leafIndex = 0; leafIndex < 24; leafIndex++) { const c = leafIndex * 2.4, base = mix(p, q, (leafIndex + 1) / 25); needles.push(flatNeedle("非洲罗汉松螺旋排列的短镰状窄叶", base, [base[0] + Math.cos(c) * .025, base[1] + .004, base[2] + Math.sin(c + .25) * .025], .0025)); } }
    parts.push(combineMeshes("非洲罗汉松同冠枝上全部真实木质细轴", bark, stems), combineMeshes("非洲罗汉松的短镰叶螺旋叶枝", green, needles));
  }
  const seeds: ModelPart[] = [], stems: ModelPart[] = [];
  for (const { end } of branches) for (const side of [-1, 1]) { const p: Triple = [end[0] + side * .012, end[1] - .03, end[2]]; stems.push(needle("非洲罗汉松肉质裸子实际下垂的长柄", bark, end, p, .002)); seeds.push(lobe("非洲罗汉松无膨大种托的独立大圆肉质裸子", coneColor, p, [.022, .023, .022])); }
  parts.push(combineMeshes("非洲罗汉松成簇裸子真实长柄", bark, stems), combineMeshes("非洲罗汉松枝下真实完整的肉质裸子", coneColor, seeds), coniferMass(branches, 3.1)); return parts;
}

function chickenFeatherPine(): ModelPart[] {
  const { parts, branches } = coniferFrame(31.5, 6, 3, 2, .4);
  for (let branch = 0; branch < branches.length; branch++) {
    const { root, middle, end } = branches[branch]!, p = branchPoint(root, middle, end, .88, .64), a = Math.atan2(end[2], end[0]);
    parts.push(...needleShoot(p, [p[0] + Math.cos(a) * .17, p[1] - .06, p[2] + Math.sin(a) * .17], branch < 2 ? .015 : .003, branch < 2 ? .0017 : .001, branch < 2 ? 20 : 18, branch < 2 ? 2 : 3));
  }
  const receptacles: ModelPart[] = [], seeds: ModelPart[] = [], stalks: ModelPart[] = [];
  for (const { end } of branches) { const p: Triple = [end[0], end[1] - .012, end[2]]; stalks.push(needle("鸡毛松枝端膨大肉质种托的短柄", bark, end, p, .002)); receptacles.push(lobe("鸡毛松种子下方偏斜膨大的肉质种托", "#b59d87", p, [.008, .009, .01])); seeds.push(lobe("鸡毛松膨大种托之上独立的单枚裸种", "#859178", [p[0] + .002, p[1] + .008, p[2]], [.006, .008, .006])); }
  parts.push(combineMeshes("鸡毛松全部种托真实连接短柄", bark, stalks), combineMeshes("鸡毛松单一植株上真实偏斜肉质种托", "#b59d87", receptacles), combineMeshes("鸡毛松种托顶端独立的单枚种子", "#859178", seeds), coniferMass(branches, 2.4)); return parts;
}

function celeryPine(): ModelPart[] {
  const { parts, branches } = coniferFrame(19, 5.3, 3, 2, .32), segment: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.15, .12], [-.46, .39], [-.34, .52], [-.5, .73], [-.25, .74], [-.2, 1], [.18, .94], [.35, .72], [.48, .73], [.31, .46], [.44, .32]];
  for (const { root, middle, end } of branches) {
    const p = branchPoint(root, middle, end, .85, .64), a = Math.atan2(end[2], end[0]), q: Triple = [p[0] + Math.cos(a) * .27, p[1] + .02, p[2] + Math.sin(a) * .27], cladodes: ModelPart[] = [], stems: ModelPart[] = [needle("芹叶松光合扁枝的共同绿枝轴", green, p, q, .0025)];
    for (let segmentIndex = 0; segmentIndex < 12; segmentIndex++) { const b = a + (segmentIndex % 2 ? 1 : -1) * 1.15, base = mix(p, q, (segmentIndex + 1) / 13), finish: Triple = [base[0] + Math.cos(b) * .028, base[1] + .005, base[2] + Math.sin(b) * .028]; cladodes.push(flatLeaf("芹叶松真实扁平菱形分裂光合枝而非普通树叶", base, finish, .018, segment, .001)); }
    parts.push(combineMeshes("芹叶松相连的完整绿色枝状轴", green, stems), combineMeshes("芹叶松一整支十二枚分裂菱形光合叶状枝", green, cladodes));
  }
  const seeds: ModelPart[] = [];
  for (const { end } of branches) seeds.push(lobe("芹叶松光合枝边缘的肉质苞托", "#b29e86", end, [.006, .005, .006]), lobe("芹叶松肉质苞托上真实露出的单枚裸种", "#798873", [end[0], end[1] + .005, end[2]], [.004, .006, .004]));
  parts.push(combineMeshes("芹叶松顶端真实种托与裸种群", coneColor, seeds), coniferMass(branches, 2.1)); return parts;
}

function saxegothaea(): ModelPart[] {
  const { parts, branches } = coniferFrame(24, 5.4, 3, 2, .4);
  for (const { root, middle, end } of branches) for (const side of [-1, 1]) { const p = branchPoint(root, middle, end, side < 0 ? .76 : .94, .64), a = Math.atan2(end[2], end[0]) + side * .5; parts.push(...needleShoot(p, [p[0] + Math.cos(a) * .14, p[1] - .025, p[2] + Math.sin(a) * .14], .016, .0022, 15)); }
  for (const { end } of branches.slice(0, 4)) parts.push(...spiralCone(end, .012, .0065, 3, 6));
  parts.push(coniferMass(branches, 2.5)); return parts;
}

function pencilPine(): ModelPart[] {
  const { parts, branches } = coniferFrame(14.7, 3, 4, 2, .24);
  for (const { root, middle, end } of branches) { const p = branchPoint(root, middle, end, .9, .64), a = Math.atan2(end[2], end[0]); parts.push(...needleShoot(p, [p[0] + Math.cos(a) * .1, p[1] + .03, p[2] + Math.sin(a) * .1], .004, .0027, 20, 3)); }
  for (const { end } of branches.slice(0, 4)) parts.push(...spiralCone(end, .016, .008, 4, 5));
  parts.push(coniferMass(branches, 1.25)); return parts;
}

function alerce(): ModelPart[] {
  const { parts, branches } = coniferFrame(54, 8.3, 3, 2, .5), barkStrips: ModelPart[] = [];
  for (let strip = 0; strip < 16; strip++) { const a = strip * Math.PI / 8, r = 1.16; barkStrips.push(tapered("智利柏粗干外部厚而纵向条裂的纤维树皮", bark, [[Math.cos(a) * r, .15, Math.sin(a) * r], [Math.cos(a) * .97, 11, Math.sin(a) * .97], [Math.cos(a) * .77, 23, Math.sin(a) * .77]], [.095, .07, .018])); }
  for (let offset = 0; offset < barkStrips.length; offset += 12) parts.push(combineMeshes("智利柏由根颈连续向上延伸的纵裂树皮", bark, barkStrips.slice(offset, offset + 12)));
  for (const { root, middle, end } of branches) { const p = branchPoint(root, middle, end, .88, .64), a = Math.atan2(end[2], end[0]); parts.push(...needleShoot(p, [p[0] + Math.cos(a) * .13, p[1] + .025, p[2] + Math.sin(a) * .13], .004, .0015, 24, 3, 0)); }
  for (const { end } of branches.slice(0, 3)) {
    const scales: ModelPart[] = [];
    for (let whorl = 0; whorl < 3; whorl++) for (let scale = 0; scale < 3; scale++) { const a = scale * Math.PI * 2 / 3 + whorl * .3, p: Triple = [end[0], end[1] + whorl * .0025, end[2]]; scales.push(flatNeedle("智利柏小球果每轮三枚的真实种鳞", p, [p[0] + Math.cos(a) * .005, p[1] + .005, p[2] + Math.sin(a) * .005], .005)); }
    parts.push(combineMeshes("智利柏三轮各三枚木鳞构成的完整小球果", coneColor, scales));
  }
  parts.push(coniferMass(branches, 3.3)); return parts;
}

function clanwilliamCedar(): ModelPart[] {
  const { parts, branches } = coniferFrame(18.5, 5.2, 3, 2, .36);
  for (const { root, middle, end } of branches) { const p = branchPoint(root, middle, end, .87, .64), a = Math.atan2(end[2], end[0]); parts.push(...needleShoot(p, [p[0] + Math.cos(a) * .12, p[1] + .01, p[2] + Math.sin(a) * .12], .0028, .001, 16, 4, 0)); }
  for (const { end } of branches.slice(0, 4)) {
    const scales: ModelPart[] = [], tips: ModelPart[] = [];
    for (let scale = 0; scale < 4; scale++) { const a = scale * Math.PI / 2, p: Triple = [end[0] + Math.cos(a) * .012, end[1] + .015, end[2] + Math.sin(a) * .012]; scales.push(flatNeedle("南非岩柏成对相对的四片厚木质大种鳞", end, p, .022)); tips.push(needle("南非岩柏粗厚种鳞上的硬角状凸点", coneColor, p, [p[0] + Math.cos(a) * .004, p[1] + .006, p[2] + Math.sin(a) * .004], .002)); }
    parts.push(combineMeshes("南非岩柏由四片明显厚鳞形成的大球果", coneColor, scales), combineMeshes("南非岩柏四枚厚鳞真实凸出的硬角", coneColor, tips));
  }
  parts.push(coniferMass(branches, 2.4)); return parts;
}

function wollemiPine(): ModelPart[] {
  const { parts, branches } = coniferFrame(35, 5.8, 4, 2, .3), bubbles: ModelPart[] = [];
  parts.push(tapered("瓦勒迈杉自然从基部蘖生的第二完整木质干", bark, [[.28, 0, .15], [.35, 14, .15], [.3, 25, .1]], [.39, .23, .008]));
  for (let tier = 0; tier < 4; tier++) { const a = tier * 2.4, root: Triple = [.35, 10 + tier * 2.8, .15], middle: Triple = [root[0] + Math.cos(a) * 2.1, root[1] + .25, root[2] + Math.sin(a) * 2.1], end: Triple = [root[0] + Math.cos(a) * 3.3, root[1] -.1, root[2] + Math.sin(a) * 3.3]; parts.push(tapered("瓦勒迈杉蘖生木质干上真实相连的轮枝", bark, [root, middle, end], [.09, .02, .002])); branches.push({ root, middle, end }); }
  for (let axis = 0; axis < branches.length; axis++) {
    const { root, middle, end } = branches[axis]!, p = branchPoint(root, middle, end, .87, .64), a = Math.atan2(end[2] - root[2], end[0] - root[0]); parts.push(...needleShoot(p, [p[0] + Math.cos(a) * .25, p[1] + .015, p[2] + Math.sin(a) * .25], .043, .0055, axis % 2 ? 12 : 22, axis % 2 ? 4 : 2, 0));
  }
  for (let bubble = 0; bubble < 96; bubble++) { const a = bubble * 2.4, y = .15 + bubble % 24 * .25, r = .77 - y * .28 / 21; bubbles.push(lobe("瓦勒迈杉主干表面真实隆起的细小泡疱状树皮", bark, [Math.cos(a) * r, y, Math.sin(a) * r], [.024, .028, .024])); }
  for (let offset = 0; offset < bubbles.length; offset += 40) parts.push(combineMeshes("瓦勒迈杉粗干上连续而不悬空的泡疱状树皮", bark, bubbles.slice(offset, offset + 40)));
  for (const { end } of branches.slice(5, 8)) parts.push(...spiralCone(end, .1, .04, 6, 6));
  parts.push(coniferMass(branches, 2.4)); return parts;
}

function bunyaPine(): ModelPart[] {
  const { parts, branches } = coniferFrame(31, 7.2, 4, 2, .32);
  for (const { root, middle, end } of branches) for (const side of [-1, 1]) { const p = branchPoint(root, middle, end, side < 0 ? .75 : .94, .64), a = Math.atan2(end[2], end[0]) + side * .5; parts.push(...needleShoot(p, [p[0] + Math.cos(a) * .24, p[1] -.025, p[2] + Math.sin(a) * .24], .04, .0065, 12, 5)); }
  for (const { end } of branches.slice(2, 5)) parts.push(...spiralCone(end, .26, .105, 8, 6));
  parts.push(coniferMass(branches, 2.4)); return parts;
}

function chileanIncenseCedar(): ModelPart[] {
  const { parts, branches } = coniferFrame(21, 4.8, 4, 2, .28);
  for (const { root, middle, end } of branches) {
    const p = branchPoint(root, middle, end, .87, .64), a = Math.atan2(end[2], end[0]), q: Triple = [p[0] + Math.cos(a) * .12, p[1] + .015, p[2] + Math.sin(a) * .12], leaves: ModelPart[] = [];
    parts.push(needle("智利翠柏交互鳞叶细枝的木质真轴", bark, p, q, .002));
    for (let row = 0; row < 24; row++) { const base = mix(p, q, (row + 1) / 25); for (let scale = 0; scale < 4; scale++) { const b = scale * Math.PI / 2, length = scale % 2 ? .0025 : .0055; leaves.push(flatNeedle("智利翠柏同节面鳞短侧鳞长的真实二型鳞叶", base, [base[0] + Math.cos(a) * length * .7 - Math.sin(a) * Math.cos(b) * length, base[1] + Math.sin(b) * length, base[2] + Math.sin(a) * length * .7 + Math.cos(a) * Math.cos(b) * length], scale % 2 ? .0012 : .0018)); } }
    for (let offset = 0; offset < leaves.length; offset += 64) parts.push(combineMeshes("智利翠柏交互覆叠且大小有别的面鳞与侧鳞", green, leaves.slice(offset, offset + 64)));
  }
  for (const { end } of branches.slice(0, 4)) {
    const scales: ModelPart[] = [];
    for (let pair = 0; pair < 2; pair++) for (const side of [-1, 1]) { const p: Triple = [end[0], end[1] + pair * .003, end[2]]; scales.push(flatNeedle("智利翠柏仅两对而大小不等的薄木质种鳞", p, [p[0] + (pair ? 0 : side * .003), p[1] + (pair ? .008 : .004), p[2] + (pair ? side * .004 : 0)], pair ? .0045 : .003)); }
    parts.push(combineMeshes("智利翠柏真两对不等种鳞构成的小长卵球果", coneColor, scales));
  }
  parts.push(coniferMass(branches, 1.9)); return parts;
}

function matai(): ModelPart[] {
  const { parts, branches } = coniferFrame(26.5, 6.2, 3, 2, .48), scars: ModelPart[] = [];
  for (const { root, middle, end } of branches) for (const side of [-1, 1]) { const p = branchPoint(root, middle, end, side < 0 ? .77 : .94, .64), a = Math.atan2(end[2], end[0]) + side * .5; parts.push(...needleShoot(p, [p[0] + Math.cos(a) * .12, p[1] + .005, p[2] + Math.sin(a) * .12], .014, .0016, 15)); }
  for (let scar = 0; scar < 16; scar++) { const a = scar * 2.4, y = .25 + scar % 8 * .43, r = 26.5 * .022 - y * .008 / .6; scars.push(part("玛塔伊杉剥鳞后呈锤击痕的真实浅凹圆疤", "lathe", "#aaa88d", [Math.cos(a) * (r - .003), y, Math.sin(a) * (r - .003)], [1, 1, 1], [90, 0, a * 180 / Math.PI - 90], { profile: [{ x: 0, y: .002 }, { x: .04, y: .003 }, { x: .06, y: .012 }, { x: .058, y: .015 }, { x: .038, y: .006 }, { x: 0, y: .005 }] })); }
  parts.push(...scars);
  const seeds: ModelPart[] = [], stems: ModelPart[] = [];
  for (const { end } of branches) for (let seed = 0; seed < 3; seed++) { const p: Triple = [end[0] + (seed - 1) * .01, end[1] - .012 - seed * .003, end[2]]; stems.push(needle("玛塔伊杉肉质种子穗中的独立短柄", bark, end, p, .001)); seeds.push(lobe("玛塔伊杉枝下真实圆球形深色肉质裸子", "#8d958a", p, [.009, .009, .009])); }
  parts.push(combineMeshes("玛塔伊杉一整株真实相接的种子短柄", bark, stems), combineMeshes("玛塔伊杉细针枝下独立的圆球肉质裸子", "#8d958a", seeds), coniferMass(branches, 2.7)); return parts;
}

// 具名完整裸子植物按各自成年株形、叶序和种子器官装配；不按幼成、盆栽或色相拆主。
// https://www.nzpcn.org.nz/flora/species/phyllocladus-trichomanoides/
// https://www.nzpcn.org.nz/flora/species/prumnopitys-taxifolia/
// https://pza.sanbi.org/afrocarpus-falcatus
// https://www.anbg.gov.au/gardens/visiting/exploring/walks/conifers/athrotaxis-cupress.html
// https://www.dcceew.gov.au/environment/biodiversity/threatened/action-plan/wollemi-pine
export const woodyExpansionBatchTenDesigns: MasterNatureDesign[] = [
  design("chinaFirWholeTree", "杉木", "植物", chinaFir, ["Cunninghamia lanceolata", "分层枝条螺旋硬扁针叶与圆卵覆鳞球果"]),
  design("taiwaniaWholeTree", "台湾杉", "植物", taiwania, ["Taiwania cryptomerioides", "高裸干柔垂枝短鳞钻叶与长卵小球果"]),
  design("incenseCedarWholeTree", "翠柏", "植物", incenseCedar, ["Calocedrus macrolepis", "扁平细枝覆鳞叶与真实三对种鳞球果"]),
  design("hibaWholeTree", "罗汉柏", "植物", hiba, ["Thujopsis dolabrata", "宽扁覆鳞叶真实白叶背与八枚宽鳞圆球果"]),
  design("orientalArborvitaeWholeTree", "侧柏", "植物", orientalArborvitae, ["Platycladus orientalis", "Thuja orientalis", "竖直扁枝面和厚种鳞带反曲硬钩的球果"]),
  design("torreyaWholeTree", "榧树", "植物", torreya, ["Torreya grandis", "坚硬尖二列扁针与全包合长卵肉质裸子"]),
  design("plumYewWholeTree", "日本粗榧", "植物", plumYew, ["Cephalotaxus harringtonia", "长二列扁针与长柄群聚橄榄形包被裸子"]),
  design("catkinYewWholeTree", "穗花杉", "植物", catkinYew, ["Amentotaxus argotaenia", "宽长二列扁针和细长下垂的独立雄球花穗"]),
  design("nagiWholeTree", "竹柏", "植物", nagi, ["Nageia nagi", "Podocarpus nagi", "对生全缘宽叶与无膨大双节种托的近球裸子"]),
  design("africanYellowwoodWholeTree", "非洲罗汉松", "植物", africanYellowwood, ["Afrocarpus falcatus", "Podocarpus falcatus", "高干螺旋短镰叶和下垂圆肉质裸子"]),
  design("chickenFeatherWholeTree", "鸡毛松", "植物", chickenFeatherPine, ["Dacrycarpus imbricatus", "同株细枝扁叶与鳞叶形态及偏斜膨大肉质种托"]),
  design("celeryPineWholeTree", "芹叶松", "植物", celeryPine, ["Phyllocladus trichomanoides", "菱形分裂的真实光合叶状枝及边生种托裸子"]),
  design("saxegothaeaWholeTree", "萨克杉", "植物", saxegothaea, ["Saxegothaea conspicua", "短小二列扁叶和真正多枚种鳞的近球小球果"]),
  design("pencilPineWholeTree", "柏状密叶杉", "植物", pencilPine, ["Athrotaxis cupressoides", "紧密螺旋覆叠宽鳞叶和小型覆鳞球果"]),
  design("alerceWholeTree", "智利柏", "植物", alerce, ["Fitzroya cupressoides", "高大纵裂纤维干真三叶轮与三轮三枚球果鳞"]),
  design("clanwilliamCedarWholeTree", "南非岩柏", "植物", clanwilliamCedar, ["Widdringtonia cedarbergensis", "开张冠交互鳞叶和四片角鳞构成的大球果"]),
  design("wollemiWholeTree", "瓦勒迈杉", "植物", wollemiPine, ["Wollemia nobilis", "基蘖多干泡疱树皮二列四列扁叶与长卵球果"]),
  design("bunyaWholeTree", "布尼亚杉", "植物", bunyaPine, ["Araucaria bidwillii", "大叶南洋杉", "长宽硬披针叶螺旋密枝与巨大长卵木球果"]),
  design("chileanIncenseCedarWholeTree", "智利翠柏", "植物", chileanIncenseCedar, ["Austrocedrus chilensis", "短面鳞长侧鳞真实二型叶与两对不等种鳞果"]),
  design("mataiWholeTree", "玛塔伊杉", "植物", matai, ["Prumnopitys taxifolia", "锤击凹痕剥落树皮短扁针叶和圆球肉质裸子"]),
];
