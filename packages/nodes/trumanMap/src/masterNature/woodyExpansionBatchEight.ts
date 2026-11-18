import { cap, combineMeshes, design, leaf, lobe, needle, part, petals, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { branchPoint, leafyShoot } from "./woodyExpansionBatchOne";
import { featherCrown } from "./woodyExpansionBatchTwo";
import { buttresses, canopy, forestCrown } from "./woodyExpansionBatchThree";
import { bicoloredShoot } from "./woodyExpansionBatchSeven";

const bark = "#998f77";
const green = "#879b72";
const pale = "#bbc5a0";
const fruitColor = "#b6a586";
const flowerColor = "#d1c7a9";

function mix(a: Triple, b: Triple, t: number): Triple { return a.map((value, axis) => value + (b[axis]! - value) * t) as Triple; }

export function smallBipinnateLeaf(root: Triple, angle: number, length: number, pairs: number, pinnae: number, bladeLength: number): ModelPart[] {
  const end: Triple = [root[0] + Math.cos(angle) * length, root[1] + length * .12, root[2] + Math.sin(angle) * length], wood: ModelPart[] = [needle("二回羽状复叶共有的一级叶轴", green, root, end, .002)], blades: ModelPart[] = [];
  for (let axis = 0; axis < pairs; axis++) for (const side of [-1, 1]) {
    const p = mix(root, end, .18 + axis / pairs * .7), b = angle + side * 1.2, reach = length * .34 * Math.sin((axis + 1) / (pairs + 1) * Math.PI), q: Triple = [p[0] + Math.cos(b) * reach, p[1] + .015, p[2] + Math.sin(b) * reach];
    wood.push(needle("与一级叶轴连续相接的次级羽片轴", green, p, q, .001));
    for (let node = 0; node < pinnae; node++) for (const bladeSide of [-1, 1]) {
      const base = mix(p, q, (node + 1) / (pinnae + 1)), c = b + bladeSide * 1.15, finish: Triple = [base[0] + Math.cos(c) * bladeLength, base[1] + bladeLength * .12, base[2] + Math.sin(c) * bladeLength], middle = mix(base, finish, .46), w = bladeLength * .18;
      const ring = [base, [middle[0] - Math.sin(c) * w, middle[1], middle[2] + Math.cos(c) * w], finish, [middle[0] + Math.sin(c) * w, middle[1], middle[2] - Math.cos(c) * w]] as Triple[];
      blades.push(part("次级羽轴上独立排列的微小长圆薄叶", "mesh", green, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices: [...ring, ...ring].map(([x, y, z]) => ({ x, y, z })), indices: [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7] }));
    }
  }
  const result = [combineMeshes("一片二回羽状叶的完整一级与次级叶轴", green, wood)];
  for (let offset = 0; offset < blades.length; offset += 48) result.push(combineMeshes("一片二回羽状复叶上的真实微叶组", green, blades.slice(offset, offset + 48)));
  return result;
}

function cananga(): ModelPart[] {
  const parts: ModelPart[] = [tapered("依兰灰色直立主干", bark, [[0, 0, 0], [.04, 8, 0], [0, 17.2, 0]], [.48, .27, .015])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 6.8 + axis * .6, 0], middle: Triple = [Math.cos(a) * 2.3, 14.6 + axis % 2, Math.sin(a) * 2.3], end: Triple = [Math.cos(a) * 4.6, 10 + axis % 3 * .8, Math.sin(a) * 4.6]; tips.push(end);
    parts.push(tapered("依兰自然弧垂的长木质冠枝", bark, [root, middle, end], [.17, .07, .004]));
    for (let twig = 0; twig < 3; twig++) { const p = branchPoint(root, middle, end, .48 + twig * .2, .5), b = a + (twig - 1) * .65; parts.push(...leafyShoot(p, [p[0] + Math.cos(b) * .7, p[1] - 1, p[2] + Math.sin(b) * .7], .17, .068, "oval")); }
    const blossom: ModelPart[] = [], p: Triple = [end[0], end[1] - .025, end[2]]; blossom.push(needle("依兰叶腋下垂花的短花柄", green, end, p, .002));
    for (let petal = 0; petal < 6; petal++) { const b = petal * Math.PI / 3; blossom.push(flatLeaf("依兰一朵花两轮共六片细长下垂花瓣", p, [p[0] + Math.cos(b) * .035, p[1] - .065, p[2] + Math.sin(b) * .035], .011, [[0, 0], [-.4, .2], [-.5, .55], [-.16, .8], [0, 1], [.18, .75], [.32, .35]])); }
    parts.push(combineMeshes("依兰一整朵六条带状花瓣的悬垂花", flowerColor, blossom));
  }
  parts.push(canopy(tips, 3.8, 2.7));
  return parts;
}

function copperpod(): ModelPart[] {
  const parts: ModelPart[] = [tapered("盾柱木具有宽阔冠层的主干", bark, [[0, 0, 0], [.04, 12, 0], [0, 24, 0]], [.72, .38, .015])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 10.5 + axis * .7, 0], end: Triple = [Math.cos(a) * 6.8, 20 + axis % 3 * 1.4, Math.sin(a) * 6.8]; tips.push(end);
    parts.push(tapered("盾柱木横向开张的承重木枝", bark, [root, end], [.29, .006]), ...smallBipinnateLeaf(mix(root, end, .94), a + .45, .42, 6, 6, .014));
    const pods: ModelPart[] = [], flowers: ModelPart[] = [];
    for (const side of [-1, 1]) { const p: Triple = [end[0] + side * .035, end[1] - .03, end[2]], q: Triple = [p[0], p[1] - .09, p[2]]; pods.push(needle("盾柱木扁荚果各自相连的果梗", bark, end, p, .002), flatLeaf("盾柱木薄而平扁的长椭圆翅缘豆荚", p, q, .028, "oval")); }
    for (let flower = 0; flower < 6; flower++) { const a = flower * 2.4, p: Triple = [end[0] + Math.cos(a) * .07, end[1] + .03 + flower * .02, end[2] + Math.sin(a) * .07]; flowers.push(needle("盾柱木顶生圆锥花序分枝", green, end, p, .002), petals(5, p, .012, .021, 72, flowerColor)); }
    parts.push(combineMeshes("盾柱木一簇带薄翅缘的扁木荚", fruitColor, pods), combineMeshes("盾柱木冠顶完整五瓣黄花圆锥序", flowerColor, flowers));
  }
  parts.push(canopy(tips, 6.5, 4.2));
  return parts;
}

function earpodTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("象耳豆树从宽根颈起的粗大主干", bark, [[0, 0, 0], [.1, 10, 0], [0, 27, 0]], [1.05, .67, .025])], tips: Triple[] = [];
  parts.push(...buttresses(1.05, 3.7, 4.6));
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 9.8 + axis * .8, 0], end: Triple = [Math.cos(a) * 9.2, 21 + axis % 3 * 1.4, Math.sin(a) * 9.2]; tips.push(end);
    parts.push(tapered("象耳豆树伸向宽伞冠的粗大主枝", bark, [root, end], [.47, .008]));
    for (const side of [-1, 1]) parts.push(...smallBipinnateLeaf(mix(root, end, side < 0 ? .84 : .97), a + side * .65, .34, 4, 4, .012));
    const valves: ModelPart[] = [];
    for (let pod = 0; pod < 2; pod++) { const p: Triple = [end[0] + pod * .035, end[1] - .025, end[2]], outline = Array.from({ length: 16 }, (_, index) => { const a = -Math.PI * .25 + index / 15 * Math.PI * 1.75, r = .045 + .018 * Math.sin(a / 2); return { x: Math.cos(a) * r, y: Math.sin(a) * r }; }), profile = [...outline, ...outline.slice().reverse().map(point => ({ x: point.x * .45, y: point.y * .45 }))].map(point => ({ x: point.x - outline[0]!.x, y: point.y - outline[0]!.y })); parts.push(needle("象耳豆弯曲扁荚的独立短果柄", bark, end, p, .003)); valves.push(part("象耳豆实际弯成耳状且中央留缺口的厚扁荚", "extrude", fruitColor, p, [1, 1, 1], [0, pod * 65, 0], { profile, depth: .009 })); }
    parts.push(...valves);
  }
  parts.push(canopy(tips, 8.8, 5));
  return parts;
}

function petai(): ModelPart[] {
  const parts: ModelPart[] = [tapered("臭豆树笔直高大的木质干", bark, [[0, 0, 0], [0, 15, 0], [.06, 29, 0]], [.8, .4, .02])], tips: Triple[] = [];
  parts.push(...buttresses(.8, 3.1, 3.8));
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 13.5 + axis * .7, 0], end: Triple = [Math.cos(a) * 6.5, 24.8 + axis % 2 * 1.2, Math.sin(a) * 6.5]; tips.push(end);
    parts.push(tapered("臭豆树顶生二回羽叶的长木质冠枝", bark, [root, end], [.3, .008]), ...smallBipinnateLeaf(mix(root, end, .94), a + .4, .53, 8, 8, .01));
    const p: Triple = [end[0], end[1] - .5, end[2]];
    parts.push(needle("臭豆树花头悬挂在长达半米的实际花序柄上", bark, end, p, .004), lobe("臭豆树长柄末端的紧凑梨形头状花序", flowerColor, p, [.035, .065, .035]));
    for (const side of [-1, 1]) parts.push(flatLeaf("臭豆树长柄花头旁真正成簇的宽平长荚", p, [p[0] + side * .035, p[1] - .36, p[2] + .02], .045, [[0, 0], [-.36, .08], [-.5, .3], [-.4, .55], [-.48, .8], [0, 1], [.38, .92], [.48, .6], [.39, .35], [.4, .06]]));
  }
  parts.push(canopy(tips, 6.6, 4.3));
  return parts;
}

function sagaTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("海红豆不规则圆冠下的直立木质主干", bark, [[0, 0, 0], [.07, 11, 0], [0, 23, 0]], [.63, .36, .02])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 10 + axis * .6, 0], end: Triple = [Math.cos(a) * 5.5, 19.5 + axis % 3 * 1.1, Math.sin(a) * 5.5]; tips.push(end);
    parts.push(tapered("海红豆承托二回羽叶和螺扭荚的冠枝", bark, [root, end], [.26, .006]), ...smallBipinnateLeaf(mix(root, end, .9), a + .4, .34, 3, 5, .032));
    const valves: ModelPart[] = [], seeds: ModelPart[] = [], p: Triple = [end[0], end[1] - .025, end[2]];
    parts.push(needle("海红豆实际连接枝端的短果柄", bark, end, p, .003));
    for (const side of [-1, 1]) {
      const path: Triple[] = Array.from({ length: 12 }, (_, index) => { const t = index / 11, b = t * Math.PI * 2.1; return [p[0] + side * .018 * Math.sin(b), p[1] - t * .23, p[2] + side * .015 * (1 - Math.cos(b))]; }), vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
      for (let row = 0; row < path.length; row++) { const b = row / 11 * Math.PI * 2.1, q = path[row]!, width = row === 0 || row === 11 ? .002 : .006; for (const [x, z] of [[-width, -.001], [width, -.001], [width, .001], [-width, .001]]) vertices.push({ x: q[0] + x! * Math.cos(b) - z! * Math.sin(b), y: q[1], z: q[2] + x! * Math.sin(b) + z! * Math.cos(b) }); }
      for (let row = 0; row < 11; row++) for (let edge = 0; edge < 4; edge++) { const i = row * 4 + edge, j = row * 4 + (edge + 1) % 4; indices.push(i, j, j + 4, i, j + 4, i + 4); }
      indices.push(0, 2, 1, 0, 3, 2, 44, 45, 46, 44, 46, 47);
      valves.push(part("海红豆具有真实宽度厚度与扭转截面的薄木质荚瓣", "mesh", fruitColor, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
      for (let seed = 0; seed < 4; seed++) { const q = path[2 + seed * 2]!; seeds.push(lobe("海红豆扭曲荚瓣内显露的独立扁透镜状种子", "#b58e7e", [q[0], q[1], q[2] + .004], [.008, .008, .006])); }
    }
    parts.push(combineMeshes("海红豆一整枚两瓣连续螺扭豆荚", fruitColor, valves), combineMeshes("海红豆荚中仍附着的独立透镜种子", "#b58e7e", seeds));
  }
  parts.push(canopy(tips, 5.4, 4));
  return parts;
}

function neem(): ModelPart[] {
  const parts: ModelPart[] = [tapered("印楝深纵裂树皮的高大木质干", bark, [[0, 0, 0], [.04, 9, 0], [0, 19.5, 0]], [.65, .34, .02])], tips: Triple[] = [], scars: ModelPart[] = [];
  for (let strip = 0; strip < 12; strip++) { const a = strip * Math.PI / 6; scars.push(tapered("印楝粗干外部连续纵向隆起的树皮脊", bark, [[Math.cos(a) * .62, .1, Math.sin(a) * .62], [Math.cos(a) * .51, 4, Math.sin(a) * .51], [Math.cos(a) * .34, 9, Math.sin(a) * .34]], [.055, .045, .013])); }
  parts.push(combineMeshes("印楝全部贴合主干的深裂树皮纵脊", bark, scars));
  const blade: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.08, .15], [-.34, .24], [-.2, .34], [-.41, .46], [-.25, .54], [-.28, .7], [0, 1], [.32, .74], [.19, .63], [.5, .48], [.28, .37], [.42, .23], [.2, .09]];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 8 + axis * .65, 0], end: Triple = [Math.cos(a) * 5.3, 16.3 + axis % 3 * 1.1, Math.sin(a) * 5.3]; tips.push(end); parts.push(tapered("印楝单回羽叶集中生长的木质冠枝", bark, [root, end], [.25, .007]));
    for (let node = 0; node < 2; node++) {
      const p = mix(root, end, .8 + node * .15), b = a + (node ? .6 : -.6), q: Triple = [p[0] + Math.cos(b) * .3, p[1] + .04, p[2] + Math.sin(b) * .3], leaves: ModelPart[] = [needle("印楝一片完整单回羽状复叶的总轴", green, p, q, .002)];
      for (let pair = 0; pair < 4; pair++) for (const side of [-1, 1]) { const base = mix(p, q, .19 + pair * .18), c = b + side * 1.1; leaves.push(flatLeaf("印楝基部偏斜且边缘真实锯齿的镰形小叶", base, [base[0] + Math.cos(c) * .075, base[1] + .014, base[2] + Math.sin(c) * .075], .027, blade)); }
      leaves.push(flatLeaf("印楝羽叶轴端的独立顶生锯齿小叶", q, [q[0] + Math.cos(b) * .07, q[1] + .01, q[2] + Math.sin(b) * .07], .026, blade)); parts.push(combineMeshes("印楝九枚偏基锯齿小叶构成的真实单回羽叶", green, leaves));
    }
    const fruits: ModelPart[] = [], stems: ModelPart[] = [];
    for (let fruit = 0; fruit < 7; fruit++) { const b = fruit * 2.4, p: Triple = [end[0] + Math.cos(b) * .035, end[1] - .02 - fruit % 3 * .03, end[2] + Math.sin(b) * .035]; stems.push(needle("印楝长椭圆核果的分枝细柄", bark, end, p, .0015)); fruits.push(lobe("印楝不可自行开裂的椭圆小核果", fruitColor, p, [.008, .013, .008])); }
    parts.push(combineMeshes("印楝完整分枝小果序轴", bark, stems), combineMeshes("印楝冠枝上一整簇长椭圆核果", fruitColor, fruits));
  }
  parts.push(canopy(tips, 5.1, 3.9));
  return parts;
}

function phyllanthoidShoot(root: Triple, end: Triple, rows: number, length: number, width: number): ModelPart[] {
  const wood: ModelPart[] = [tapered("叶下珠族具有木质连续轴的落叶性短枝", bark, [root, end], [.009, .002])], leaves: ModelPart[] = [], a = Math.atan2(end[2] - root[2], end[0] - root[0]);
  for (let row = 0; row < rows; row++) for (const side of [-1, 1]) { const base = mix(root, end, (row * 2 + (side < 0 ? 1 : 2)) / (rows * 2 + 1)), b = a + side * 1.2, p: Triple = [base[0] + Math.cos(b) * .004, base[1], base[2] + Math.sin(b) * .004]; wood.push(needle("每枚二列互生单叶各自的短叶柄", green, base, p, .001)); leaves.push(flatLeaf("木质短枝上的独立二列互生单叶而非复叶小叶", p, [p[0] + Math.cos(b) * length, p[1] + length * .1, p[2] + Math.sin(b) * length], width)); }
  const result = [combineMeshes("二列互生叶短枝及其全部真实叶柄", bark, wood)];
  for (let offset = 0; offset < leaves.length; offset += 24) result.push(combineMeshes("短枝上真实分离的两列互生单叶", green, leaves.slice(offset, offset + 24)));
  return result;
}

function starGooseberry(): ModelPart[] {
  const parts: ModelPart[] = [tapered("西印度醋栗疏冠下的短直木质主干", bark, [[0, 0, 0], [.02, 3.8, 0], [0, 8.6, 0]], [.25, .14, .008])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 3.3 + axis * .25, 0], end: Triple = [Math.cos(a) * 2.7, 7 + axis % 3 * .55, Math.sin(a) * 2.7]; tips.push(end); parts.push(tapered("西印度醋栗冠层中承托多列落叶枝的木枝", bark, [root, end], [.1, .004]));
    for (const side of [-1, 1]) { const p = mix(root, end, side < 0 ? .65 : .92), b = a + side * .6; parts.push(...phyllanthoidShoot(p, [p[0] + Math.cos(b) * .42, p[1] - .08, p[2] + Math.sin(b) * .42], 7, .06, .03)); }
    const fruits: ModelPart[] = [], stems: ModelPart[] = [], base = mix(root, end, .48);
    for (let fruit = 0; fruit < 5; fruit++) {
      const b = fruit * 2.4, p: Triple = [base[0] + Math.cos(b) * .035, base[1] - .02 - fruit * .023, base[2] + Math.sin(b) * .035], vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
      stems.push(needle("西印度醋栗老木枝上成簇果实的独立果梗", bark, base, p, .002));
      for (let ring = 0; ring < 3; ring++) for (let side = 0; side < 12; side++) { const a = side * Math.PI / 6, r = (ring === 1 ? .018 : .012) * (side % 2 ? .83 : 1); vertices.push({ x: Math.cos(a) * r, y: (ring - 1) * .009, z: Math.sin(a) * r }); }
      vertices.push({ x: 0, y: -.011, z: 0 }, { x: 0, y: .011, z: 0 });
      for (let ring = 0; ring < 2; ring++) for (let side = 0; side < 12; side++) { const i = ring * 12 + side, j = ring * 12 + (side + 1) % 12; indices.push(i, j + 12, j, i, i + 12, j + 12); }
      for (let side = 0; side < 12; side++) { const j = (side + 1) % 12; indices.push(36, side, j, 37, j + 24, side + 24); }
      fruits.push(part("西印度醋栗真实六条凸纵棱与六条凹沟的扁球果", "mesh", fruitColor, p, [1, 1, 1], [0, 0, 0], { vertices, indices }));
    }
    parts.push(combineMeshes("西印度醋栗木枝上的完整果簇分梗", bark, stems), combineMeshes("西印度醋栗整簇保持独立轮廓的六棱扁圆果", fruitColor, fruits));
  }
  parts.push(canopy(tips, 2.7, 2.1));
  return parts;
}

function emblic(): ModelPart[] {
  const parts: ModelPart[] = [tapered("余甘子细碎树皮的弯直木质主干", bark, [[0, 0, 0], [.05, 5.7, 0], [0, 14.5, 0]], [.43, .25, .01])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 5 + axis * .5, 0], end: Triple = [Math.cos(a) * 4.5, 11.8 + axis % 3 * .9, Math.sin(a) * 4.5]; tips.push(end); parts.push(tapered("余甘子具有密集短枝的开张木质骨枝", bark, [root, end], [.17, .004]));
    for (const side of [-1, 1]) { const p = mix(root, end, side < 0 ? .7 : .94), b = a + side * .65; parts.push(...phyllanthoidShoot(p, [p[0] + Math.cos(b) * .28, p[1] - .025, p[2] + Math.sin(b) * .28], 12, .018, .0045)); }
    const fruits: ModelPart[] = [];
    for (const side of [-1, 1]) { const p: Triple = [end[0] + side * .012, end[1] - .018, end[2]]; fruits.push(needle("余甘子近乎贴木枝的极短果梗", bark, end, p, .002), lobe("余甘子紧挨短枝的光滑圆球肉果", fruitColor, p, [.026, .023, .026])); }
    parts.push(combineMeshes("余甘子完整短柄圆球果实组", fruitColor, fruits));
  }
  parts.push(canopy(tips, 4.5, 3.6));
  return parts;
}

function bilimbi(): ModelPart[] {
  const { parts, tips } = featherCrown(8.5, 2.9, .52, 8, false, true, 2, "oval");
  parts.push(canopy(tips, 2.8, 2.4));
  for (let cluster = 0; cluster < 4; cluster++) {
    const a = cluster * Math.PI / 2, base: Triple = [Math.cos(a) * .29, 1.4 + cluster * .65, Math.sin(a) * .29], stems: ModelPart[] = [], fruits: ModelPart[] = [];
    parts.push(needle("木胡瓜主干上真正干生的短果序柄", bark, [0, base[1], 0], base, .012));
    for (let fruit = 0; fruit < 5; fruit++) { const b = a + (fruit - 2) * .4, p: Triple = [base[0] + Math.cos(b) * .06, base[1] - .015 - fruit % 3 * .04, base[2] + Math.sin(b) * .06]; stems.push(needle("木胡瓜肉质长果单独下垂的细梗", bark, base, p, .003)); fruits.push(part("木胡瓜有圆肩与钝端的细长圆柱状酸果", "lathe", fruitColor, [p[0], p[1] - .095, p[2]], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .019, y: .011 }, { x: .021, y: .068 }, { x: .015, y: .087 }, { x: 0, y: .095 }] })); }
    parts.push(combineMeshes("木胡瓜一簇干生长果的全部分梗", bark, stems), ...fruits);
  }
  return parts;
}

function mammeeApple(): ModelPart[] {
  const { parts, tips } = forestCrown(18.5, 3.8, .19, .09, "oval", true);
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .045, tip[2]];
    parts.push(needle("美洲杏大肉果真实粗短的果梗", bark, tip, p, .006), lobe("美洲杏大而圆整的厚皮球果", fruitColor, [p[0], p[1] - .08, p[2]], [.14, .16, .14]), cap("美洲杏基部持续宿存的宽四萼托", green, p, .018, .008, 0));
  }
  return parts;
}

function sapodilla(): ModelPart[] {
  const parts: ModelPart[] = [tapered("人心果密集金字塔冠下的直立木质主干", bark, [[0, 0, 0], [.02, 8, 0], [0, 18, 0]], [.48, .24, .012])], tips: Triple[] = [];
  for (let tier = 0; tier < 3; tier++) for (let axis = 0; axis < 3; axis++) {
    const a = axis * Math.PI * 2 / 3 + tier, root: Triple = [0, 6.6 + tier * 3, 0], width = 4.4 - tier * 1.25, end: Triple = [Math.cos(a) * width, 10.6 + tier * 2.6, Math.sin(a) * width]; tips.push(end);
    parts.push(tapered("人心果密集树冠内逐层收窄的侧枝", bark, [root, end], [.15 - tier * .035, .005]), ...leafyShoot(mix(root, end, .78), end, .13, .041, "oval"));
    const p: Triple = [end[0], end[1] - .025, end[2]]; parts.push(needle("人心果螺旋叶腋中单独长出的果柄", bark, end, p, .0025), lobe("人心果褐色薄砂皮的卵圆肉果", fruitColor, [p[0], p[1] - .033, p[2]], [.055, .075, .055]));
  }
  parts.push(canopy(tips.slice(0, 3), 3.9, 3.1), canopy(tips.slice(3, 6), 2.8, 2.8), canopy(tips.slice(6), 1.7, 2.1));
  return parts;
}

function abiu(): ModelPart[] {
  const { parts, tips } = forestCrown(16.2, 4.1, .22, .065, "obovate");
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .022, tip[2]];
    parts.push(needle("黄晶果大叶叶腋中的短直果柄", bark, tip, p, .003), part("黄晶果圆肩下方逐渐收窄的卵圆黄果", "lathe", fruitColor, [p[0], p[1] - .095, p[2]], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .016, y: .009 }, { x: .036, y: .036 }, { x: .04, y: .068 }, { x: .026, y: .09 }, { x: 0, y: .096 }] }), petals(5, p, .003, .009, 100, green));
  }
  return parts;
}

function starApple(): ModelPart[] {
  const parts: ModelPart[] = [tapered("星苹果不带巨大板根的直立树干", bark, [[0, 0, 0], [.05, 6.4, 0], [0, 13.8, 0]], [.44, .26, .015])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 6 + axis * .35, 0], end: Triple = [Math.cos(a) * 4.2, 11.5 + axis % 3 * .7, Math.sin(a) * 4.2]; tips.push(end); parts.push(tapered("星苹果末梢轻垂的开张冠枝", bark, [root, end], [.17, .005]));
    for (const side of [-1, 1]) { const p = mix(root, end, side < 0 ? .74 : .94), b = a + side * .65; parts.push(...bicoloredShoot(p, [p[0] + Math.cos(b) * .34, p[1] - .12, p[2] + Math.sin(b) * .34], .12, .05, "#ac9879", "星苹果")); }
    const p: Triple = [end[0], end[1] - .02, end[2]]; parts.push(needle("星苹果叶腋独立圆果的粗短柄", bark, end, p, .003), lobe("星苹果有明显凹蒂的圆球形肉果", "#a59b92", [p[0], p[1] - .038, p[2]], [.075, .073, .075]));
  }
  parts.push(canopy(tips, 4.1, 3.5));
  return parts;
}

function santol(): ModelPart[] {
  const parts: ModelPart[] = [tapered("山陀儿树冠以下的粗大直立主干", bark, [[0, 0, 0], [.05, 14, 0], [0, 29.5, 0]], [.87, .45, .02])], tips: Triple[] = [];
  parts.push(...buttresses(.87, 2.8, 3.8));
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 12 + axis * .7, 0], end: Triple = [Math.cos(a) * 6.5, 25 + axis % 3 * 1.3, Math.sin(a) * 6.5]; tips.push(end); parts.push(tapered("山陀儿承托大三出叶的木质侧枝", bark, [root, end], [.31, .008]));
    for (let node = 0; node < 3; node++) {
      const p = mix(root, end, .65 + node * .15), b = a + node * 2.4, q: Triple = [p[0] + Math.cos(b) * .1, p[1] + .04, p[2] + Math.sin(b) * .1], leaves: ModelPart[] = [needle("山陀儿三出叶真实共用长叶柄", green, p, q, .004)];
      for (let blade = 0; blade < 3; blade++) { const c = b + (blade - 1) * 1.05, start = blade === 1 ? [q[0] + Math.cos(b) * .045, q[1] + .012, q[2] + Math.sin(b) * .045] as Triple : q; if (blade === 1) leaves.push(needle("山陀儿较大的顶生小叶有独立延长柄", green, q, start, .002)); leaves.push(flatLeaf("山陀儿宽卵形柔毛三出叶中的独立小叶", start, [start[0] + Math.cos(c) * .19, start[1] + .035, start[2] + Math.sin(c) * .19], .1)); }
      parts.push(combineMeshes("山陀儿一整片具有真长顶柄的三出复叶", green, leaves));
    }
    const p: Triple = [end[0], end[1] - .045, end[2]]; parts.push(needle("山陀儿宽圆大果的粗短下垂果梗", bark, end, p, .004), lobe("山陀儿厚皮微扁且冠有宿存萼的球果", fruitColor, [p[0], p[1] - .045, p[2]], [.11, .095, .11]), petals(5, p, .004, .01, 96, green));
  }
  parts.push(canopy(tips, 6.7, 5));
  return parts;
}

function langsat(): ModelPart[] {
  const { parts } = featherCrown(14.5, 4.5, .43, 3, false, true, 2, "oval");
  const crownTips: Triple[] = Array.from({ length: 6 }, (_, index) => { const a = index * 2.4; return [Math.cos(a) * 4.5, 12.2 + index % 3 * .8, Math.sin(a) * 4.5]; }); parts.push(canopy(crownTips, 4.5, 3.7));
  for (let axis = 0; axis < 5; axis++) {
    const a = axis * 2.4, base: Triple = [Math.cos(a) * .38, 2.7 + axis * .55, Math.sin(a) * .38], end: Triple = [base[0], base[1] - .22, base[2]], fruits: ModelPart[] = [], stems: ModelPart[] = [];
    parts.push(needle("兰撒树主干和粗枝上垂挂的老木生果序轴", bark, [0, base[1], 0], base, .012), needle("兰撒果穗向下连续延伸的主轴", bark, base, end, .006));
    for (let fruit = 0; fruit < 16; fruit++) { const b = fruit * 2.4, p: Triple = [base[0] + Math.cos(b) * .03, base[1] - .02 - fruit % 6 * .034, base[2] + Math.sin(b) * .03]; stems.push(needle("兰撒长穗中每枚果实各自短柄", bark, [base[0], p[1], base[2]], p, .002)); fruits.push(lobe("兰撒在真实下垂穗中独立相接的薄皮圆果", fruitColor, p, [.028, .034, .028])); }
    parts.push(combineMeshes("兰撒整穗全部独立分离短果柄", bark, stems), combineMeshes("兰撒从主干垂挂的一整串圆果", fruitColor, fruits));
  }
  return parts;
}

function rambutan(): ModelPart[] {
  const { parts, tips } = featherCrown(17.5, 4.7, .28, 3, false, false, 2, "oval"); parts.push(canopy(tips, 4.8, 4));
  for (const tip of tips) {
    const fruits: ModelPart[] = [], hairs: ModelPart[] = [], stems: ModelPart[] = [];
    for (let fruit = 0; fruit < 3; fruit++) {
      const a = fruit * Math.PI * 2 / 3, p: Triple = [tip[0] + Math.cos(a) * .04, tip[1] - .035 - fruit * .015, tip[2] + Math.sin(a) * .04]; stems.push(needle("红毛丹分枝果穗中单果的细果梗", bark, tip, p, .0025)); fruits.push(lobe("红毛丹毛刺以下完整卵圆肉果", fruitColor, p, [.043, .055, .043]));
      for (let hair = 0; hair < 24; hair++) { const b = hair * 2.4, y = -.8 + hair / 23 * 1.6, r = Math.sqrt(1 - y * y), base: Triple = [p[0] + Math.cos(b) * r * .022, p[1] + y * .027, p[2] + Math.sin(b) * r * .022], end: Triple = [p[0] + Math.cos(b + .1) * r * .035, p[1] + y * .04 + .003, p[2] + Math.sin(b + .1) * r * .035]; hairs.push(needle("红毛丹皮表柔软向外弯曲的独立毛状突起", pale, base, end, .001)); }
    }
    parts.push(combineMeshes("红毛丹一簇的真实分枝果柄", bark, stems), combineMeshes("红毛丹一簇完整卵圆果体", fruitColor, fruits), combineMeshes("红毛丹全部果体表面分离的柔毛", pale, hairs));
  }
  return parts;
}

function ackeeTree(): ModelPart[] {
  const { parts, tips } = featherCrown(19, 4.9, .38, 4, false, false, 2, "oval"); parts.push(canopy(tips, 4.9, 4));
  for (const tip of tips) {
    const base: Triple = [tip[0], tip[1] - .035, tip[2]], valves: ModelPart[] = [], seeds: ModelPart[] = [], arils: ModelPart[] = [];
    parts.push(needle("西非荔枝叶腋独立蒴果的粗短果梗", bark, tip, base, .003));
    for (let valve = 0; valve < 3; valve++) { const a = valve * Math.PI * 2 / 3, center: Triple = [base[0] + Math.cos(a) * .024, base[1] - .03, base[2] + Math.sin(a) * .024]; valves.push(flatLeaf("西非荔枝沿三条果缝裂开的厚梨形蒴果瓣", base, [base[0] + Math.cos(a) * .055, base[1] - .055, base[2] + Math.sin(a) * .055], .04, "obovate", .004)); arils.push(lobe("西非荔枝黑种子基部各自包裹的浅色假种皮", flowerColor, center, [.021, .025, .021])); seeds.push(lobe("西非荔枝三瓣果腔中各自露出的光亮黑种子", "#777e74", [center[0] + Math.cos(a) * .005, center[1] - .012, center[2] + Math.sin(a) * .005], [.019, .022, .019])); }
    parts.push(combineMeshes("西非荔枝一整枚真实三裂开口的蒴果", fruitColor, valves), combineMeshes("西非荔枝果内三粒种子基部的独立假种皮", flowerColor, arils), combineMeshes("西非荔枝果内分离的三粒黑种子", "#777e74", seeds));
  }
  return parts;
}

function ambarella(): ModelPart[] {
  const { parts, tips } = featherCrown(19.5, 5, .47, 5, false, true, 2); parts.push(canopy(tips, 5, 4.1));
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stems: ModelPart[] = [];
    for (let fruit = 0; fruit < 6; fruit++) { const a = fruit * 2.4, p: Triple = [tip[0] + Math.cos(a) * .06, tip[1] - .045 - fruit % 3 * .055, tip[2] + Math.sin(a) * .06]; stems.push(needle("金苹果枝端果穗中真实分离的长柄", bark, tip, p, .003)); fruits.push(lobe("金苹果长卵形略有棱线的肉质核果", fruitColor, [p[0], p[1] - .025, p[2]], [.055, .085, .055])); }
    parts.push(combineMeshes("金苹果完整枝端长柄核果穗", bark, stems), combineMeshes("金苹果一整簇鸡蛋形大核果", fruitColor, fruits));
  }
  return parts;
}

function yellowCowWood(): ModelPart[] {
  const { parts, tips } = forestCrown(23.5, 5.2, .09, .036, "oval", true), barkPlates: ModelPart[] = [];
  for (let plate = 0; plate < 24; plate++) { const a = plate * 2.4, y = .2 + plate % 8 * .75, r = 1.04 - y * .033; barkPlates.push(leaf("黄牛木粗干上真实贴生而翘起的剥落薄树皮", "#ad987c", [Math.cos(a) * r, y, Math.sin(a) * r], .12, .34, [15, 90 - a * 180 / Math.PI, 0], "YXZ")); }
  parts.push(combineMeshes("黄牛木主干橙褐色片状剥落外皮", "#ad987c", barkPlates));
  for (const tip of tips) {
    const blossoms: ModelPart[] = [], stamens: ModelPart[] = [];
    for (const side of [-1, 1]) {
      const p: Triple = [tip[0] + side * .018, tip[1] - .015, tip[2]]; blossoms.push(needle("黄牛木枝端成对小花的花柄", green, tip, p, .0015), petals(5, p, .006, .012, 82, "#c4afa5"));
      for (let stamen = 0; stamen < 24; stamen++) { const a = stamen * 2.4, r = Math.sqrt(stamen / 24) * .004; stamens.push(needle("黄牛木五瓣小花内多枚独立雄蕊", flowerColor, p, [p[0] + Math.cos(a) * r, p[1] + .008, p[2] + Math.sin(a) * r], .0006)); }
    }
    parts.push(combineMeshes("黄牛木枝端两朵相连的五瓣小花", "#c4afa5", blossoms), combineMeshes("黄牛木成对花内完整细雄蕊群", flowerColor, stamens));
  }
  return parts;
}

function ceylonEbony(): ModelPart[] {
  const { parts, tips } = forestCrown(15.5, 4.3, .105, .035, "oval"), barkScales: ModelPart[] = [];
  for (let scale = 0; scale < 28; scale++) { const a = scale * 2.4, y = .1 + scale % 7 * .64, r = .68 - y * .026; barkScales.push(lobe("乌木树干表面粗厚而不规则的裂鳞", "#898875", [Math.cos(a) * r, y, Math.sin(a) * r], [.13, .25, .095])); }
  parts.push(combineMeshes("乌木主干完整粗鳞状厚树皮", "#898875", barkScales));
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .008, tip[2]];
    parts.push(needle("乌木叶腋近乎无柄的小球果短梗", bark, tip, p, .0017), lobe("乌木与大柿果不同的小球形浆果", fruitColor, [p[0], p[1] - .009, p[2]], [.019, .02, .019]), petals(5, p, .004, .009, 112, green));
  }
  return parts;
}

// 引用只用于可辨植物结构；几何与全部完整树体均为本地原创按需工厂。
// https://www.nparks.gov.sg/florafaunaweb/flora/2/7/2779
// https://www.nparks.gov.sg/florafaunaweb/flora/2/8/2877
// https://www.nparks.gov.sg/florafaunaweb/flora/2/6/2697
// https://www.nparks.gov.sg/florafaunaweb/flora/2/7/2738
// https://plant-directory.ifas.ufl.edu/plant-directory/manilkara-zapota/
// https://indiaflora-ces.iisc.ac.in/FloraKarnataka/herbsheet.php?cat=1&id=1536
export const woodyExpansionBatchEightDesigns: MasterNatureDesign[] = [
  design("canangaWholeTree", "依兰", "植物", cananga, ["Cananga odorata", "香水树", "下垂长枝互生大叶与六条带状花瓣"]),
  design("copperpodWholeTree", "盾柱木", "植物", copperpod, ["Peltophorum pterocarpum", "密集小叶二回羽叶五瓣黄花与翅缘扁荚"]),
  design("earpodWholeTree", "象耳豆树", "植物", earpodTree, ["Enterolobium cyclocarpum", "巨型伞冠细小二回羽叶与耳状厚扁荚"]),
  design("petaiWholeTree", "臭豆树", "植物", petai, ["Parkia speciosa", "板根密细二回羽叶长柄花头与成簇宽长荚"]),
  design("sagaWholeTree", "海红豆", "植物", sagaTree, ["Adenanthera pavonina", "二回羽叶开裂后真螺扭荚瓣与透镜种子"]),
  design("neemWholeTree", "印楝", "植物", neem, ["Azadirachta indica", "偏基锯齿单回羽叶纵裂树皮与长椭核果"]),
  design("starGooseberryWholeTree", "西印度醋栗", "植物", starGooseberry, ["Phyllanthus acidus", "星醋栗", "二列互生单叶短枝与老木生扁棱球果"]),
  design("emblicWholeTree", "余甘子", "植物", emblic, ["Phyllanthus emblica", "Emblica officinalis", "油柑", "极细二列互生单叶与贴短枝圆肉果"]),
  design("bilimbiWholeTree", "木胡瓜", "植物", bilimbi, ["Averrhoa bilimbi", "羽叶和直接主干生长的成簇长圆柱肉果"]),
  design("mammeeAppleWholeTree", "美洲杏", "植物", mammeeApple, ["Mammea americana", "成对厚大革叶与粗短梗厚皮圆果"]),
  design("sapodillaWholeTree", "人心果", "植物", sapodilla, ["Manilkara zapota", "螺旋叶枝密金字塔树冠与单生砂皮卵圆果"]),
  design("abiuWholeTree", "黄晶果", "植物", abiu, ["Pouteria caimito", "长倒卵大叶与圆肩逐渐收窄的黄果"]),
  design("starAppleWholeTree", "星苹果", "植物", starApple, ["Chrysophyllum cainito", "真实铜金叶背互生叶与宽圆球果"]),
  design("santolWholeTree", "山陀儿", "植物", santol, ["Sandoricum koetjape", "板根长顶柄三出大叶与厚皮扁圆大果"]),
  design("langsatWholeTree", "兰撒树", "植物", langsat, ["Lansium domesticum", "奇数羽叶与直接老木生长的下垂长果串"]),
  design("rambutanWholeTree", "红毛丹树", "植物", rambutan, ["Nephelium lappaceum", "偶数羽叶分枝果簇和逐枚毛状果皮"]),
  design("ackeeWholeTree", "西非荔枝树", "植物", ackeeTree, ["Blighia sapida", "阿开木", "偶数羽叶真实三瓣蒴果内的假种皮和黑种子"]),
  design("ambarellaWholeTree", "金苹果树", "植物", ambarella, ["Spondias dulcis", "鸡蛋形核果长柄簇与有锯齿的奇数羽叶"]),
  design("yellowCowWoodWholeTree", "黄牛木", "植物", yellowCowWood, ["Cratoxylum cochinchinense", "对生单叶剥落树皮枝端成对五瓣多雄蕊花"]),
  design("ceylonEbonyWholeTree", "乌木树", "植物", ceylonEbony, ["Diospyros ebenum", "粗鳞树皮二列互生钝端长叶与宿萼小浆果"]),
];
