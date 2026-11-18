import { combineMeshes, design, leaf, lobe, needle, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { branchPoint } from "./woodyExpansionBatchOne";
import { featherCrown } from "./woodyExpansionBatchTwo";
import { buttresses, canopy, forestCrown } from "./woodyExpansionBatchThree";
import { fiveLobedCalyx } from "./woodyExpansionBatchFour";
import { smallBipinnateLeaf } from "./woodyExpansionBatchEight";
import { flatNeedle } from "./woodyExpansionBatchTen";

const bark = "#a2987c";
const green = "#879d73";
const pale = "#bcc5a0";
const flowerColor = "#d1c7ab";
const fruitColor = "#b7a789";
const serrate: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.2, .14], [-.45, .28], [-.3, .4], [-.5, .55], [-.3, .66], [0, 1], [.3, .66], [.5, .55], [.3, .4], [.45, .28], [.2, .14]];

function mix(a: Triple, b: Triple, t: number): Triple { return a.map((value, axis) => value + (b[axis]! - value) * t) as Triple; }

function tanjong(): ModelPart[] {
  const { parts, tips } = forestCrown(14.5, 4.8, .1, .05, "oval");
  for (const tip of tips) {
    const flowers: ModelPart[] = [], stems: ModelPart[] = [];
    for (const side of [-1, 1]) { const p: Triple = [tip[0] + side * .012, tip[1] + .012, tip[2]]; stems.push(needle("香榄叶腋星形小花的短柄", bark, tip, p, .001)); for (let petal = 0; petal < 8; petal++) { const a = petal * Math.PI / 4; flowers.push(flatLeaf("香榄每片花瓣顶端真实分成三个尖裂片", p, [p[0] + Math.cos(a) * .006, p[1] + .001, p[2] + Math.sin(a) * .006], .004, [[0, 0], [-.45, .5], [-.45, 1], [-.18, .78], [0, 1], [.18, .78], [.45, 1], [.45, .5]], .0005)); } }
    parts.push(combineMeshes("香榄小花真正连接叶腋的细柄", bark, stems), combineMeshes("香榄八枚三裂瓣构成二十四尖的完整小花", flowerColor, flowers));
  }
  return parts;
}

function roseApple(): ModelPart[] {
  const { parts, tips } = forestCrown(12.5, 4.3, .17, .04, "oval", true);
  for (const tip of tips) {
    const flower: ModelPart[] = [], p: Triple = [tip[0], tip[1] + .025, tip[2]]; flower.push(needle("蒲桃冠顶多雄蕊花的短柄", green, tip, p, .003));
    for (let petal = 0; petal < 4; petal++) flower.push(leaf("蒲桃雄蕊刷基部四片独立浅色花瓣", flowerColor, p, .012, .018, [90, petal * 90, 0], "YXZ"));
    for (let stamen = 0; stamen < 60; stamen++) { const a = stamen * 2.4, r = Math.sqrt((stamen + 1) / 60) * .033; flower.push(needle("蒲桃每朵花上实际独立的长丝状雄蕊", flowerColor, p, [p[0] + Math.cos(a) * r, p[1] + .022 + stamen % 3 * .003, p[2] + Math.sin(a) * r], .0006)); }
    parts.push(combineMeshes("蒲桃完整四瓣与长丝状雄蕊刷花", flowerColor, flower));
    const q: Triple = [tip[0] + .025, tip[1] - .035, tip[2]]; parts.push(needle("蒲桃圆果的独立下垂果梗", bark, tip, q, .003), lobe("蒲桃区别于莲雾钟果的圆球形肉果", fruitColor, [q[0], q[1] - .018, q[2]], [.044, .045, .044]));
  }
  return parts;
}

function surinamCherry(): ModelPart[] {
  const { parts, tips } = forestCrown(6.7, 2.6, .045, .023, "oval", true);
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .022, tip[2]], vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    parts.push(needle("棱果蒲桃八棱果实际细长的独立柄", bark, tip, p, .0015));
    for (let ring = 0; ring < 3; ring++) for (let side = 0; side < 16; side++) { const a = side * Math.PI / 8, r = (ring === 1 ? .015 : .009) * (side % 2 ? .73 : 1); vertices.push({ x: Math.cos(a) * r, y: (ring - 1) * .009, z: Math.sin(a) * r }); }
    vertices.push({ x: 0, y: -.011, z: 0 }, { x: 0, y: .011, z: 0 });
    for (let ring = 0; ring < 2; ring++) for (let side = 0; side < 16; side++) { const i = ring * 16 + side, j = ring * 16 + (side + 1) % 16; indices.push(i, j + 16, j, i, i + 16, j + 16); }
    for (let side = 0; side < 16; side++) indices.push(48, side, (side + 1) % 16, 49, (side + 1) % 16 + 32, side + 32);
    parts.push(part("棱果蒲桃八条真实凸棱与深纵沟的扁球肉果", "mesh", "#b59e89", p, [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return parts;
}

function jabuticaba(): ModelPart[] {
  const height = 11.2, { parts } = forestCrown(height, 3.6, .065, .028, "oval", true), fruits: ModelPart[] = [], stalks: ModelPart[] = [];
  for (let fruit = 0; fruit < 60; fruit++) { const a = fruit * 2.4, y = .6 + fruit % 20 * .16, t = y / (height * .38), x = .045 * t, z = -.015 * t, r = height * (.045 + (.034 - .045) * t), base: Triple = [x + Math.cos(a) * r, y, z + Math.sin(a) * r], p: Triple = [base[0] + Math.cos(a) * .012, base[1], base[2] + Math.sin(a) * .012]; stalks.push(needle("嘉宝果直接从真实树干表面长出的极短果柄", bark, base, p, .002)); fruits.push(lobe("嘉宝果密布粗干而各自独立的圆球浆果", "#8b9286", p, [.029, .029, .029])); }
  parts.push(combineMeshes("嘉宝果全干生浆果真实连接的短柄", bark, stalks));
  for (let offset = 0; offset < fruits.length; offset += 36) parts.push(combineMeshes("嘉宝果主干上完整保留的独立圆浆果群", "#8b9286", fruits.slice(offset, offset + 36)));
  return parts;
}

function seaGrapeTree(): ModelPart[] {
  const roundLeaf: Parameters<typeof flatLeaf>[4] = [[0, .08], [-.27, 0], [-.5, .25], [-.5, .65], [-.28, .92], [0, 1], [.28, .92], [.5, .65], [.5, .25], [.27, 0]], { parts, tips } = forestCrown(9.5, 4.4, .22, .24, roundLeaf);
  for (const tip of tips) {
    const end: Triple = [tip[0], tip[1] - .3, tip[2]], fruits: ModelPart[] = [], stalks: ModelPart[] = [needle("海葡萄树真正木本圆叶枝端的长葡萄状果序轴", bark, tip, end, .003)];
    for (let fruit = 0; fruit < 18; fruit++) { const a = fruit * 2.4, base = mix(tip, end, (fruit + 1) / 19), p: Triple = [base[0] + Math.cos(a) * .016, base[1], base[2] + Math.sin(a) * .016]; stalks.push(needle("海葡萄树长串中每枚果实的独立短柄", bark, base, p, .0015)); fruits.push(lobe("海葡萄树长果串中独立的圆形木本核果", fruitColor, p, [.015, .016, .015])); }
    parts.push(combineMeshes("海葡萄树完整下垂长果串的全部柄", bark, stalks), combineMeshes("海葡萄树圆叶下方完整的葡萄状果串", fruitColor, fruits));
  }
  return parts;
}

function bignay(): ModelPart[] {
  const { parts, tips } = forestCrown(18, 4.8, .14, .055, "oval");
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stalks: ModelPart[] = [];
    for (const side of [-1, 1]) { const root: Triple = [tip[0] + side * .015, tip[1] - .01, tip[2]], end: Triple = [root[0] + side * .025, root[1] - .3, root[2]]; stalks.push(needle("五月茶枝端长穗真实分离的主果序轴", bark, tip, root, .002), needle("五月茶长而连续的下垂果序总轴", bark, root, end, .002)); for (let fruit = 0; fruit < 22; fruit++) { const a = fruit * 2.4, base = mix(root, end, (fruit + 1) / 23), p: Triple = [base[0] + Math.cos(a) * .009, base[1], base[2] + Math.sin(a) * .009]; stalks.push(needle("五月茶每枚小核果的极短分梗", bark, base, p, .001)); fruits.push(lobe("五月茶真实总序轴上独立着生的小核果", "#9b9986", p, [.007, .008, .007])); } }
    parts.push(combineMeshes("五月茶全部细长果穗真实总轴与分梗", bark, stalks));
    for (let offset = 0; offset < fruits.length; offset += 36) parts.push(combineMeshes("五月茶长穗中完整保留的独立小核果", "#9b9986", fruits.slice(offset, offset + 36)));
  }
  return parts;
}

function burmeseGrape(): ModelPart[] {
  const { parts } = forestCrown(15.5, 4.8, .19, .075, "oval");
  for (let cluster = 0; cluster < 5; cluster++) {
    const a = cluster * 2.4, base: Triple = [Math.cos(a) * .51, 2 + cluster * .55, Math.sin(a) * .51], end: Triple = [base[0], base[1] - .65, base[2]], fruits: ModelPart[] = [], stems: ModelPart[] = [needle("木奶果粗干直接长出长果串的短木轴", bark, [0, base[1], 0], base, .01), needle("木奶果长达半米以上的真实下垂总果轴", bark, base, end, .004)];
    for (let fruit = 0; fruit < 14; fruit++) { const b = fruit * 2.4, p = mix(base, end, (fruit + 1) / 15), q: Triple = [p[0] + Math.cos(b) * .025, p[1], p[2] + Math.sin(b) * .025]; stems.push(needle("木奶果串中每枚大肉果的真实分梗", bark, p, q, .002)); fruits.push(lobe("木奶果老干长串中完整独立的近球肉果", fruitColor, q, [.028, .036, .028])); }
    parts.push(combineMeshes("木奶果粗干上的完整长串果序轴", bark, stems), combineMeshes("木奶果整个长串中真实分离的球卵肉果", fruitColor, fruits));
  }
  return parts;
}

function dragonPlum(): ModelPart[] {
  const { parts, tips } = featherCrown(27.5, 6.5, .7, 6, false, true, 2, "oval"); parts.push(...buttresses(.96, 4, 4.2), canopy(tips, 6.7, 5));
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stems: ModelPart[] = [];
    for (let fruit = 0; fruit < 5; fruit++) { const a = fruit * 2.4, p: Triple = [tip[0] + Math.cos(a) * .055, tip[1] - .04 - fruit % 2 * .045, tip[2] + Math.sin(a) * .055]; stems.push(needle("人面子圆锥果序中每枚核果的真实柄", bark, tip, p, .002)); fruits.push(lobe("人面子扁圆而带独立果柄的厚肉核果", fruitColor, p, [.032, .028, .032])); }
    parts.push(combineMeshes("人面子一整簇圆锥果序的分枝轴", bark, stems), combineMeshes("人面子长羽叶之下的完整圆核果簇", fruitColor, fruits));
  }
  return parts;
}

function chineseOlive(): ModelPart[] {
  const { parts, tips } = featherCrown(23, 5.6, .56, 3, false, true, 2, "oval"); parts.push(canopy(tips, 5.8, 4.6));
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stems: ModelPart[] = [];
    for (const side of [-1, 1]) { const p: Triple = [tip[0] + side * .035, tip[1] - .035, tip[2]]; stems.push(needle("中国橄榄长梭果的独立下垂柄", bark, tip, p, .0025)); fruits.push(part("中国橄榄两端渐尖的完整长梭形肉果", "lathe", fruitColor, [p[0], p[1] - .045, p[2]], [1, 1, 1], [0, 0, side * 12], { profile: [{ x: 0, y: 0 }, { x: .012, y: .014 }, { x: .016, y: .03 }, { x: .011, y: .044 }, { x: 0, y: .055 }] })); }
    parts.push(combineMeshes("中国橄榄羽叶树枝上真实分叉的果柄", bark, stems), ...fruits);
  }
  return parts;
}

function frankincense(): ModelPart[] {
  const { parts, tips } = featherCrown(7.6, 3, .22, 3, false, true, 2, serrate);
  parts.push(part("乳香树在岩隙上自持而不附带石头的宽木质根盘", "lathe", bark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .49, y: 0 }, { x: .51, y: .05 }, { x: .38, y: .18 }, { x: .24, y: .35 }, { x: 0, y: .35 }] }), canopy(tips, 2.7, 1.9));
  const peels: ModelPart[] = [];
  for (let peel = 0; peel < 24; peel++) { const a = peel * 2.4, y = .4 + peel % 8 * .26, r = 7.6 * .035 - y * .01 / .58, x = .02 * y / (7.6 * .58); peels.push(leaf("乳香主干表层实际剥离的浅色纸状薄树皮", pale, [x + Math.cos(a) * r, y, Math.sin(a) * r], .045, .12, [8, 90 - a * 180 / Math.PI, 0], "YXZ")); }
  parts.push(combineMeshes("乳香树贴干而略翘起的完整纸皮碎片", pale, peels)); return parts;
}

function myrrh(): ModelPart[] {
  const parts: ModelPart[] = [tapered("没药树低矮且自然曲折的粗木质干", bark, [[0, 0, 0], [.18, 1.8, 0], [0, 4.3, 0]], [.23, .17, .015])], tips: Triple[] = [], spines: ModelPart[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [.08, 1.4 + axis * .22, 0], middle: Triple = [Math.cos(a) * 1.1, 3.8 + axis % 2 * .3, Math.sin(a) * 1.1], end: Triple = [Math.cos(a) * 2.1, 3.4 + axis % 3 * .45, Math.sin(a) * 2.1]; tips.push(end); parts.push(tapered("没药树自然转折而末端带刺的木质冠枝", bark, [root, middle, end], [.085, .04, .002]));
    for (let node = 0; node < 3; node++) { const p = branchPoint(root, middle, end, .6 + node * .16, .52), b = a + node * 2.4, q: Triple = [p[0] + Math.cos(b) * .016, p[1] + .006, p[2] + Math.sin(b) * .016], blades: ModelPart[] = [needle("没药树三出小叶共有的极短叶柄", green, p, q, .0015)]; for (let blade = 0; blade < 3; blade++) { const c = b + (blade - 1) * .9, length = blade === 1 ? .032 : .018; blades.push(flatLeaf("没药树中叶大而两侧叶小的实际三出叶", q, [q[0] + Math.cos(c) * length, q[1] + .004, q[2] + Math.sin(c) * length], blade === 1 ? .018 : .01, serrate, .001)); } parts.push(combineMeshes("没药树一整片真实大小不等的三出小叶", green, blades)); }
    spines.push(needle("没药树木质枝端自然延长形成的硬刺", bark, end, [end[0] + Math.cos(a) * .08, end[1] + .02, end[2] + Math.sin(a) * .08], .008));
  }
  parts.push(combineMeshes("没药树整株各木质枝端的真实硬刺", bark, spines), canopy(tips, 1.8, 1.3)); return parts;
}

function peruvianPepper(): ModelPart[] {
  const parts: ModelPart[] = [tapered("秘鲁胡椒木开张垂冠以下的粗直主干", bark, [[0, 0, 0], [.04, 6, 0], [0, 13.5, 0]], [.46, .29, .012])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 5 + axis * .45, 0], middle: Triple = [Math.cos(a) * 2.6, 11.8 + axis % 2 * .7, Math.sin(a) * 2.6], end: Triple = [Math.cos(a) * 5.1, 8.5 + axis % 3 * .65, Math.sin(a) * 5.1]; tips.push(end); parts.push(tapered("秘鲁胡椒木明显下弯的长木质冠枝", bark, [root, middle, end], [.18, .07, .003]));
    for (let node = 0; node < 3; node++) { const p = branchPoint(root, middle, end, .58 + node * .18, .5), b = a + (node - 1) * .55, q: Triple = [p[0] + Math.cos(b) * .24, p[1] - .55, p[2] + Math.sin(b) * .24], blades: ModelPart[] = [needle("秘鲁胡椒木长垂羽状复叶的真实总轴", green, p, q, .002)]; for (let pair = 0; pair < 10; pair++) for (const side of [-1, 1]) { const base = mix(p, q, (pair + 1) / 11), c = b + side * 1.15; blades.push(flatNeedle("秘鲁胡椒木羽叶上细窄披针形的实际小叶", base, [base[0] + Math.cos(c) * .065, base[1] - .015, base[2] + Math.sin(c) * .065], .006)); } blades.push(flatNeedle("秘鲁胡椒木羽状总轴末端的窄顶生叶", q, [q[0], q[1] - .055, q[2]], .005)); parts.push(combineMeshes("秘鲁胡椒木一片完整细窄叶长垂羽叶", green, blades)); }
    const fruits: ModelPart[] = [], stems: ModelPart[] = []; for (let fruit = 0; fruit < 18; fruit++) { const b = fruit * 2.4, p: Triple = [end[0] + Math.cos(b) * .025, end[1] - .02 - fruit % 5 * .02, end[2] + Math.sin(b) * .025]; stems.push(needle("秘鲁胡椒木粉椒小核果的分枝细柄", bark, end, p, .001)); fruits.push(lobe("秘鲁胡椒木整簇中分离的小圆胡椒状核果", "#b5a18e", p, [.006, .006, .006])); } parts.push(combineMeshes("秘鲁胡椒木真实下垂果序的全部分梗", bark, stems), combineMeshes("秘鲁胡椒木羽叶下整簇胡椒状小圆果", "#b5a18e", fruits));
  }
  parts.push(canopy(tips, 4.2, 2.8)); return parts;
}

function africanMahogany(): ModelPart[] {
  const { parts, tips } = featherCrown(31, 6.7, .38, 3, false, false, 2, "oval"); parts.push(...buttresses(1, 3.5, 3.8), canopy(tips, 6.8, 4.9));
  for (const tip of tips) { const p: Triple = [tip[0], tip[1] - .025, tip[2]], valves: ModelPart[] = [], seeds: ModelPart[] = []; parts.push(needle("非洲楝圆木蒴果实际粗直的短果柄", bark, tip, p, .004)); for (let valve = 0; valve < 4; valve++) { const a = valve * Math.PI / 2; valves.push(flatLeaf("非洲楝球形蒴果裂开的四枚厚木质果瓣", p, [p[0] + Math.cos(a) * .036, p[1] - .05, p[2] + Math.sin(a) * .036], .032, "obovate", .003)); seeds.push(flatLeaf("非洲楝四瓣木果之间显露的独立薄翅种子", [p[0], p[1] - .02, p[2]], [p[0] + Math.cos(a) * .018, p[1] - .04, p[2] + Math.sin(a) * .018], .014, "oval", .001)); } parts.push(combineMeshes("非洲楝真实四瓣而非五瓣的开放圆木蒴果", fruitColor, valves), combineMeshes("非洲楝开放圆木蒴果内真实薄翅种子", pale, seeds)); }
  parts.push(combineMeshes("非洲楝四裂木果中真实承托全部翅种的中央果柱", fruitColor, tips.map(tip => tapered("非洲楝翅种附着的真实中央短果柱", fruitColor, [[tip[0], tip[1] - .025, tip[2]], [tip[0], tip[1] - .07, tip[2]]], [.003, .0015]))));
  return parts;
}

function sapele(): ModelPart[] {
  const { parts, tips } = featherCrown(41, 7.5, .55, 5, false, false, 2, "oval"); parts.push(...buttresses(1.42, 4.7, 5.2), canopy(tips, 7.7, 5.6));
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .035, tip[2]], end: Triple = [p[0], p[1] - .17, p[2]], valves: ModelPart[] = [];
    parts.push(needle("沙比利长圆柱木蒴果的短粗柄", bark, tip, p, .005), tapered("沙比利五瓣纵裂后仍存在的真实中央果柱", fruitColor, [p, end], [.005, .003]));
    for (let valve = 0; valve < 5; valve++) { const a = valve * Math.PI * 2 / 5; valves.push(flatLeaf("沙比利长圆柱蒴果沿纵缝裂开的长木质果瓣", p, [p[0] + Math.cos(a) * .035, p[1] - .18, p[2] + Math.sin(a) * .035], .027, "oval", .003)); }
    parts.push(combineMeshes("沙比利一整枚五长瓣开放圆柱木蒴果", fruitColor, valves));
  }
  return parts;
}

function bitterwood(): ModelPart[] {
  const parts: ModelPart[] = [tapered("苦木宽冠下的直立细木质主干", bark, [[0, 0, 0], [.025, 3.2, 0], [0, 6.5, 0]], [.18, .1, .006])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 2.6 + axis * .2, 0], end: Triple = [Math.cos(a) * 2.5, 5.4 + axis % 3 * .4, Math.sin(a) * 2.5]; tips.push(end); parts.push(tapered("苦木同时承托有翼羽叶与管花序的木质冠枝", bark, [root, end], [.065, .002]));
    for (let node = 0; node < 2; node++) { const p = mix(root, end, .78 + node * .17), b = a + (node ? .6 : -.6), q: Triple = [p[0] + Math.cos(b) * .23, p[1] + .025, p[2] + Math.sin(b) * .23], leaves: ModelPart[] = [flatLeaf("苦木真实延伸到各小叶基部的宽翼总叶轴", p, q, .014, [[-.5, 0], [-.5, 1], [.5, 1], [.5, 0]], .001)]; for (let pair = 0; pair < 2; pair++) for (const side of [-1, 1]) { const base = mix(p, q, .3 + pair * .4), c = b + side * 1.1; leaves.push(flatLeaf("苦木有翼总轴上真实成对的全缘椭圆小叶", base, [base[0] + Math.cos(c) * .07, base[1] + .012, base[2] + Math.sin(c) * .07], .032)); } leaves.push(flatLeaf("苦木奇数羽叶末端实际独立的顶生小叶", q, [q[0] + Math.cos(b) * .065, q[1] + .01, q[2] + Math.sin(b) * .065], .03)); parts.push(combineMeshes("苦木有翼总轴和真实五枚小叶组成的完整羽叶", green, leaves)); }
  }
  parts.push(canopy(tips, 2.5, 1.9));
  for (const tip of tips) {
    const blossoms: ModelPart[] = [], stems: ModelPart[] = [];
    for (let flower = 0; flower < 4; flower++) { const a = flower * 2.4, p: Triple = [tip[0] + Math.cos(a) * .02, tip[1] + .03 + flower * .022, tip[2] + Math.sin(a) * .02]; stems.push(needle("苦木枝端直立总状花序的独立花柄", green, tip, p, .0015)); const bloom = fiveLobedCalyx(p); bloom.name = "苦木具有真实细长管腔与五裂小口的红色管花"; bloom.color = "#bb9d8c"; bloom.scale = { x: .4, y: 1.8, z: .4 }; bloom.vertices = bloom.vertices!.map(v => ({ x: v.x - p[0], y: v.y - p[1], z: v.z - p[2] })); bloom.position = { x: p[0], y: p[1], z: p[2] }; blossoms.push(bloom); }
    parts.push(combineMeshes("苦木短总状花序中相连的真实花柄", green, stems), combineMeshes("苦木整穗真实中空五裂长管花", "#bb9d8c", blossoms));
  }
  return parts;
}

function chineseAlangium(): ModelPart[] {
  const { parts, tips } = forestCrown(12.5, 4.3, .14, .13, "mitten");
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .022, tip[2]], petalsGroup: ModelPart[] = [], stamens: ModelPart[] = [];
    parts.push(needle("八角枫叶腋小花实际下垂的细花柄", bark, tip, p, .002));
    for (let petal = 0; petal < 8; petal++) { const a = petal * Math.PI / 4; petalsGroup.push(flatLeaf("八角枫小花中八条细窄独立的花被片", p, [p[0] + Math.cos(a) * .01, p[1] - .018, p[2] + Math.sin(a) * .01], .002, "oval", .0005)); stamens.push(needle("八角枫细长花被之间实际游离的长雄蕊", flowerColor, p, [p[0] + Math.cos(a + .2) * .004, p[1] - .019, p[2] + Math.sin(a + .2) * .004], .0006)); }
    parts.push(combineMeshes("八角枫一整朵真实细带状八裂花被", flowerColor, petalsGroup), combineMeshes("八角枫同一小花中细长游离的雄蕊", pale, stamens));
  }
  return parts;
}

function fourLobedBell(root: Triple): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let shell = 0; shell < 2; shell++) for (let ring = 0; ring < 3; ring++) for (let side = 0; side < 8; side++) { const a = side * Math.PI / 4, r = [.0025, .008, .009][ring]! - shell * .001; vertices.push({ x: Math.cos(a) * r, y: ring === 0 ? 0 : ring === 1 ? -.013 : side % 2 ? -.018 : -.021, z: Math.sin(a) * r }); }
  for (let ring = 0; ring < 2; ring++) for (let side = 0; side < 8; side++) { const a = ring * 8 + side, b = ring * 8 + (side + 1) % 8; indices.push(a, b, b + 8, a, b + 8, a + 8, a + 24, b + 32, b + 24, a + 24, a + 32, b + 32); }
  for (let side = 0; side < 8; side++) { const next = (side + 1) % 8; indices.push(side, side + 24, next + 24, side, next + 24, next, side + 16, next + 16, next + 40, side + 16, next + 40, side + 40); }
  return part("银钟树有真实薄壁内腔和四裂口的下垂钟花", "mesh", flowerColor, root, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function silverbell(): ModelPart[] {
  const { parts, tips } = forestCrown(11.5, 4.8, .11, .055, serrate);
  for (const tip of tips) {
    const blossoms: ModelPart[] = [], stems: ModelPart[] = [];
    for (const side of [-1, 1]) { const p: Triple = [tip[0] + side * .027, tip[1] - .03, tip[2]]; stems.push(needle("银钟树单独悬垂钟花的细长花柄", bark, tip, p, .0015)); blossoms.push(fourLobedBell(p)); }
    const p: Triple = [tip[0], tip[1] - .06, tip[2] + .02], fruit: ModelPart[] = [lobe("银钟树四翅之间长圆柱状的独立核果", fruitColor, p, [.011, .026, .011])]; stems.push(needle("银钟树上年留存四翅果的真实细长柄", bark, tip, p, .0018));
    for (let wing = 0; wing < 4; wing++) { const a = wing * Math.PI / 2; fruit.push(flatLeaf("银钟树每枚长果体沿四边展开的薄木质纵翅", [p[0], p[1] - .014, p[2]], [p[0], p[1] + .014, p[2]], .018, [[0, 0], [-.4, .2], [-.5, .6], [-.2, .9], [0, 1], [.02, .4]], .001)); fruit[wing + 1]!.rotation.y = a * 180 / Math.PI; }
    parts.push(combineMeshes("银钟树钟花与留存四翅果的真实细柄", bark, stems), combineMeshes("银钟树同冠枝两朵真实四裂薄壁钟花", flowerColor, blossoms), combineMeshes("银钟树一枚完整长圆四纵翅木质核果", fruitColor, fruit));
  }
  return parts;
}

function bladdernut(): ModelPart[] {
  const { parts, tips } = featherCrown(8.5, 2.8, .28, 2, false, true, 2, serrate); parts.push(canopy(tips, 2.9, 2.2));
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .05, tip[2]], chambers: ModelPart[] = [], seams: ModelPart[] = [];
    parts.push(needle("省沽油膨胀三室果囊真正细长的下垂果柄", bark, tip, p, .002));
    for (let chamber = 0; chamber < 3; chamber++) { const a = chamber * Math.PI * 2 / 3, q: Triple = [p[0] + Math.cos(a) * .01, p[1] - .02, p[2] + Math.sin(a) * .01]; chambers.push(lobe("省沽油纸质果囊三个独立膨胀的种室", pale, q, [.026, .038, .026])); seams.push(needle("省沽油膨胀囊室交界处的真实纵向接缝", green, p, [q[0], q[1] - .016, q[2]], .0012)); }
    parts.push(combineMeshes("省沽油同一蒴果的完整三室膨胀纸囊", pale, chambers), combineMeshes("省沽油三室纸囊的真实纵接缝", green, seams));
  }
  return parts;
}

function dipteronia(): ModelPart[] {
  const { parts, tips } = featherCrown(15.5, 4.7, .42, 4, false, true, 2, serrate); parts.push(canopy(tips, 4.8, 3.9));
  for (const tip of tips) {
    const wings: ModelPart[] = [], seeds: ModelPart[] = [], stems: ModelPart[] = [];
    for (let pair = 0; pair < 4; pair++) { const p: Triple = [tip[0] + (pair - 1.5) * .014, tip[1] - .035 - pair * .024, tip[2]]; stems.push(needle("金钱槭两枚圆翅果共用的真实果柄", bark, tip, p, .0015)); for (const side of [-1, 1]) { const q: Triple = [p[0] + side * .018, p[1] - .012, p[2]]; wings.push(polygon("金钱槭每枚种室各自一整圈的近圆纸翅", fruitColor, Array.from({ length: 12 }, (_, index) => [Math.cos(index * Math.PI / 6) * .016, Math.sin(index * Math.PI / 6) * .019]), .001, q)); seeds.push(lobe("金钱槭各圆纸翅中心独立膨大的种室", bark, [q[0], q[1] + .001, q[2]], [.008, .012, .006])); stems.push(needle("金钱槭同柄两枚圆翅果实际基部连接", bark, p, q, .0015)); } }
    parts.push(combineMeshes("金钱槭整簇同柄成对圆翅果的所有连接柄", bark, stems), combineMeshes("金钱槭同柄成对而非单圆盘的全部完整果翅", fruitColor, wings), combineMeshes("金钱槭每个独立圆纸翅内的种室", bark, seeds));
  }
  return parts;
}

function osageOrange(): ModelPart[] {
  const { parts, tips } = forestCrown(13.5, 4.7, .11, .06, "oval"), spines: ModelPart[] = [];
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .09, tip[2]], body = lobe("桑橙巨大近球聚花果的连续肉质主体", fruitColor, p, [.15, .15, .15]), bumps: ModelPart[] = [];
    parts.push(needle("桑橙重型聚花果独立短而粗的果柄", bark, tip, [p[0], p[1] + .065, p[2]], .006));
    const sites = [...body.vertices!, ...Array.from({ length: body.indices!.length / 3 }, (_, face) => { const points = body.indices!.slice(face * 3, face * 3 + 3).map(index => body.vertices![index]!); return { x: points.reduce((sum, v) => sum + v.x, 0) / 3, y: points.reduce((sum, v) => sum + v.y, 0) / 3, z: points.reduce((sum, v) => sum + v.z, 0) / 3 }; })];
    for (const site of sites) { const length = Math.hypot(site.x, site.y, site.z); bumps.push(lobe("桑橙连续聚花果表面真实隆起的脑状单元", fruitColor, [p[0] + site.x * .15 + site.x / length * .003, p[1] + site.y * .15 + site.y / length * .003, p[2] + site.z * .15 + site.z / length * .003], [.019, .019, .019])); }
    parts.push(combineMeshes("桑橙一整枚具实际连续瘤状表面的聚花果", fruitColor, [body, ...bumps])); spines.push(needle("桑橙叶枝端真实单生的木质短刺", bark, tip, [tip[0] + .04, tip[1] + .02, tip[2]], .005));
  }
  parts.push(combineMeshes("桑橙全部木质冠枝实际短硬刺", bark, spines)); return parts;
}

function castillaRubberTree(): ModelPart[] {
  const { parts, tips } = forestCrown(29.5, 6.8, .29, .12, "oval"); parts.push(...buttresses(.95, 3.6, 3.9));
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stems: ModelPart[] = [];
    for (let fruit = 0; fruit < 3; fruit++) { const p: Triple = [tip[0] + (fruit - 1) * .024, tip[1] - .012, tip[2]]; stems.push(needle("卡斯蒂利亚橡胶树叶腋聚花果实际短柄", bark, tip, p, .0015)); fruits.push(lobe("卡斯蒂利亚橡胶树将全部小果连为整体的肉质花托", fruitColor, [p[0], p[1] - .001, p[2]], [.024, .004, .024])); for (let drupe = 0; drupe < 8; drupe++) { const a = drupe * Math.PI / 4; fruits.push(lobe("卡斯蒂利亚橡胶树盘状聚花果中的小肉质单元", fruitColor, [p[0] + Math.cos(a) * .009, p[1], p[2] + Math.sin(a) * .009], [.008, .006, .008])); } }
    parts.push(combineMeshes("卡斯蒂利亚橡胶树全部腋生果的短柄", bark, stems), combineMeshes("卡斯蒂利亚橡胶树大叶腋中的扁盘聚花果", fruitColor, fruits));
  }
  return parts;
}

function bullhornAcacia(): ModelPart[] {
  const parts: ModelPart[] = [tapered("牛角金合欢稀疏开张冠以下的木质主干", bark, [[0, 0, 0], [.04, 3, 0], [0, 7.2, 0]], [.23, .12, .006])], tips: Triple[] = [], horns: ModelPart[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 2.6 + axis * .26, 0], end: Triple = [Math.cos(a) * 3.3, 5.7 + axis % 3 * .5, Math.sin(a) * 3.3]; tips.push(end); parts.push(tapered("牛角金合欢同时承托羽叶与膨大牛角刺的木枝", bark, [root, end], [.095, .002]), ...smallBipinnateLeaf(mix(root, end, .91), a + .5, .28, 4, 10, .009));
    for (let node = 0; node < 3; node++) { const p = mix(root, end, .55 + node * .18), b = a + .8; horns.push(lobe("牛角金合欢一对膨大托叶刺共用的肿大基部", bark, p, [.022, .025, .022])); for (const side of [-1, 1]) horns.push(tapered("牛角金合欢实际向两边弯曲的成对膨大牛角刺", bark, [p, [p[0] + Math.cos(b + side) * .026, p[1] + .033, p[2] + Math.sin(b + side) * .026], [p[0] + Math.cos(b + side * 1.2) * .055, p[1] + .075, p[2] + Math.sin(b + side * 1.2) * .055]], [.009, .007, .0005])); }
  }
  for (let offset = 0; offset < horns.length; offset += 18) parts.push(combineMeshes("牛角金合欢真实相连的膨大成对牛角状托叶刺", bark, horns.slice(offset, offset + 18)));
  parts.push(canopy(tips, 2.8, 1.8)); return parts;
}

function iceCreamBeanTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("冰淇淋豆宽冠下的直立木质干", bark, [[0, 0, 0], [0, 8, 0], [.04, 21, 0]], [.55, .32, .01])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 7 + axis * .55, 0], end: Triple = [Math.cos(a) * 5.4, 17.5 + axis % 3 * 1.1, Math.sin(a) * 5.4]; tips.push(end); parts.push(tapered("冰淇淋豆大羽叶与特长豆荚共有的木质枝", bark, [root, end], [.22, .005]));
    for (let node = 0; node < 2; node++) { const p = mix(root, end, .75 + node * .19), b = a + (node ? .6 : -.6), q: Triple = [p[0] + Math.cos(b) * .55, p[1] + .055, p[2] + Math.sin(b) * .55], leaves: ModelPart[] = [flatLeaf("冰淇淋豆羽叶真实宽扁的有翼共同总轴", p, q, .022, [[-.5, 0], [-.5, 1], [.5, 1], [.5, 0]], .001)]; for (let pair = 0; pair < 3; pair++) { const base = mix(p, q, .22 + pair * .3); leaves.push(lobe("冰淇淋豆每对叶片之间实际叶外蜜腺", green, base, [.006, .004, .006])); for (const side of [-1, 1]) { const c = b + side * 1.1; leaves.push(flatLeaf("冰淇淋豆两侧成对而无顶叶的宽大椭圆小叶", base, [base[0] + Math.cos(c) * .18, base[1] + .027, base[2] + Math.sin(c) * .18], .08)); } } parts.push(combineMeshes("冰淇淋豆一整片有翼偶数羽叶和真实叶外蜜腺", green, leaves)); }
    const p: Triple = [end[0], end[1] - .035, end[2]]; parts.push(needle("冰淇淋豆长荚的粗短果柄", bark, end, p, .005), tapered("冰淇淋豆具纵向棱沟且长达近米的厚荚", fruitColor, [p, [p[0] + .025, p[1] - .2, p[2]], [p[0] + .05, p[1] - .6, p[2] + .015], [p[0] + .035, p[1] - .95, p[2] + .025]], [.005, .024, .022, .003]));
  }
  parts.push(canopy(tips, 5.4, 3.9)); return parts;
}

function manilaTamarind(): ModelPart[] {
  const parts: ModelPart[] = [tapered("牛蹄豆分叉宽冠下的曲直木质主干", bark, [[0, 0, 0], [.08, 5.5, 0], [0, 13.5, 0]], [.43, .25, .01])], tips: Triple[] = [], spines: ModelPart[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 4.5 + axis * .4, 0], end: Triple = [Math.cos(a) * 4.5, 10.7 + axis % 3 * .8, Math.sin(a) * 4.5]; tips.push(end); parts.push(tapered("牛蹄豆羽叶总柄根部带成对托叶刺的木枝", bark, [root, end], [.17, .003]));
    for (let node = 0; node < 3; node++) { const p = mix(root, end, .66 + node * .15), b = a + node * 2.4, q: Triple = [p[0] + Math.cos(b) * .025, p[1] + .007, p[2] + Math.sin(b) * .025], leaves: ModelPart[] = [needle("牛蹄豆二回羽叶的短共同叶柄", green, p, q, .0018)]; for (const pinnaSide of [-1, 1]) { const c = b + pinnaSide * .8, r: Triple = [q[0] + Math.cos(c) * .023, q[1] + .005, q[2] + Math.sin(c) * .023]; leaves.push(needle("牛蹄豆仅两枚羽片各自的短轴", green, q, r, .001)); for (const bladeSide of [-1, 1]) { const d = c + bladeSide * 1.05; leaves.push(flatLeaf("牛蹄豆仅四枚小叶中基部偏斜的圆顶倒卵叶", r, [r[0] + Math.cos(d) * .033, r[1] + .003, r[2] + Math.sin(d) * .033], .018, "obovate", .001)); } } parts.push(combineMeshes("牛蹄豆一整片两羽片各两小叶的真实二回叶", green, leaves)); for (const side of [-1, 1]) spines.push(needle("牛蹄豆每个叶柄基部成对的硬托叶刺", bark, p, [p[0] + Math.cos(b + side) * .025, p[1] + .013, p[2] + Math.sin(b + side) * .025], .003)); }
    const base: Triple = [end[0], end[1] - .06, end[2]], valves: ModelPart[] = [], arils: ModelPart[] = [], seeds: ModelPart[] = [];
    for (const side of [-1, 1]) { const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = []; for (let station = 0; station < 16; station++) { const a = -.35 * Math.PI + station / 15 * Math.PI * 1.7; for (const [w, t] of [[-.005, -.001], [.005, -.001], [.005, .001], [-.005, .001]]) vertices.push({ x: base[0] + Math.cos(a) * (.03 + w!), y: base[1] + Math.sin(a) * (.03 + w!), z: base[2] + side * .004 + t! }); } for (let station = 0; station < 15; station++) for (let edge = 0; edge < 4; edge++) { const i = station * 4 + edge, j = station * 4 + (edge + 1) % 4; indices.push(i, j + 4, j, i, i + 4, j + 4); } indices.push(0, 1, 2, 0, 2, 3, 60, 62, 61, 60, 63, 62); valves.push(part("牛蹄豆环形荚果裂开后真实有宽度的弧形薄果瓣", "mesh", fruitColor, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices })); }
    parts.push(needle("牛蹄豆卷荚一端与木质枝真实相接的短柄", bark, end, [base[0] + Math.cos(-.35 * Math.PI) * .03, base[1] + Math.sin(-.35 * Math.PI) * .03, base[2]], .002));
    for (let seed = 0; seed < 6; seed++) { const a = -.2 * Math.PI + seed / 5 * Math.PI * 1.4, p: Triple = [base[0] + Math.cos(a) * .03, base[1] + Math.sin(a) * .03, base[2]]; arils.push(lobe("牛蹄豆裂荚内真实包裹黑种子基部的肉质假种皮", pale, p, [.012, .012, .011])); seeds.push(lobe("牛蹄豆假种皮外实际露出的光亮黑色种子", "#7d8772", [p[0], p[1], p[2] + .007], [.008, .01, .008])); }
    parts.push(combineMeshes("牛蹄豆一整枚实际开口的环状薄木荚果", fruitColor, valves), combineMeshes("牛蹄豆环荚内分离而相连的浅色假种皮", pale, arils), combineMeshes("牛蹄豆环荚中实际独立的黑色种子", "#7d8772", seeds));
  }
  parts.push(combineMeshes("牛蹄豆所有叶柄根部真实成对托叶刺", bark, spines), canopy(tips, 4.7, 3.3)); return parts;
}

function whiteLeadtree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("银合欢直立而上部开张的完整木质干", bark, [[0, 0, 0], [.03, 4.6, 0], [0, 12, 0]], [.28, .16, .007])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 3.8 + axis * .3, 0], end: Triple = [Math.cos(a) * 4, 9.4 + axis % 3 * .7, Math.sin(a) * 4]; tips.push(end); parts.push(tapered("银合欢精细二回羽叶与成簇豆荚的真实木枝", bark, [root, end], [.12, .003]), ...smallBipinnateLeaf(mix(root, end, .9), a + .5, .3, 4, 10, .009));
    const pods: ModelPart[] = [], flowers: ModelPart[] = [];
    for (let pod = 0; pod < 4; pod++) { const b = a + (pod - 1.5) * .25, p: Triple = [end[0] + Math.cos(b) * .02, end[1] - .02, end[2] + Math.sin(b) * .02]; pods.push(needle("银合欢一簇平扁长荚每枚独立短柄", bark, end, p, .002), flatLeaf("银合欢成簇真实薄而扁平的狭长豆荚", p, [p[0] + Math.cos(b) * .035, p[1] - .16, p[2] + Math.sin(b) * .035], .018, "oval", .0015)); }
    const p: Triple = [end[0], end[1] + .045, end[2]]; parts.push(needle("银合欢球形花头的真实细长花序柄", green, end, p, .0018)); for (let stamen = 0; stamen < 48; stamen++) { const b = stamen * 2.4, y = -.8 + stamen / 47 * 1.7, r = Math.sqrt(1 - y * y); flowers.push(needle("银合欢球形头状花序中真实放射的细雄蕊", flowerColor, p, [p[0] + Math.cos(b) * r * .014, p[1] + y * .014, p[2] + Math.sin(b) * r * .014], .0005)); }
    parts.push(combineMeshes("银合欢一整簇完整的独立平扁长豆荚", fruitColor, pods), combineMeshes("银合欢细羽叶旁真正放射的白绒球状花头", flowerColor, flowers));
  }
  parts.push(canopy(tips, 3.7, 2.5)); return parts;
}

// https://www.nparks.gov.sg/florafaunaweb/flora/3/0/3030
// https://www.nparks.gov.sg/florafaunaweb/flora/3/0/3065
// https://www.srs.fs.usda.gov/pubs/misc/ag_654/volume_2/halesia/carolina.htm
// https://plantdatabase.kpu.ca/PlantPrint/hacr
export const woodyExpansionBatchTwelveDesigns: MasterNatureDesign[] = [
  design("tanjongWholeTree", "香榄", "植物", tanjong, ["Mimusops elengi", "厚革单叶与八枚三裂瓣二十四尖星花"]),
  design("roseAppleWholeTree", "蒲桃树", "植物", roseApple, ["Syzygium jambos", "长披针对生叶大长雄蕊刷花与圆果"]),
  design("surinamCherryWholeTree", "棱果蒲桃", "植物", surinamCherry, ["Eugenia uniflora", "巴西番樱桃", "小对生叶与具有真实八凸棱的扁圆果"]),
  design("jabuticabaWholeTree", "嘉宝果树", "植物", jabuticaba, ["Plinia cauliflora", "Myrciaria cauliflora", "短对生小叶和直接老干生长的密集圆浆果"]),
  design("seaGrapeWholeTree", "海葡萄树", "植物", seaGrapeTree, ["Coccoloba uvifera", "巨大近圆心基革叶与长垂葡萄状核果串"]),
  design("bignayWholeTree", "五月茶", "植物", bignay, ["Antidesma bunius", "互生大单叶与细长密集小核果穗"]),
  design("burmeseGrapeWholeTree", "木奶果树", "植物", burmeseGrape, ["Baccaurea ramiflora", "大互生单叶与从粗干垂挂的长串球卵果"]),
  design("dragonPlumWholeTree", "人面子", "植物", dragonPlum, ["Dracontomelon duperreanum", "仁面子", "大板根长奇数羽叶与圆锥序扁圆核果"]),
  design("chineseOliveWholeTree", "中国橄榄树", "植物", chineseOlive, ["Canarium album", "奇数大羽叶与两端渐尖的长梭肉果"]),
  design("frankincenseWholeTree", "乳香树", "植物", frankincense, ["Boswellia sacra", "木质吸附根盘纸状剥皮和锯齿奇数羽叶"]),
  design("myrrhWholeTree", "没药树", "植物", myrrh, ["Commiphora myrrha", "曲折硬刺枝及中央小叶较大的不等三出叶"]),
  design("peruvianPepperWholeTree", "秘鲁胡椒木", "植物", peruvianPepper, ["Schinus molle", "长垂细披针小叶的奇数羽叶与胡椒状小果"]),
  design("africanMahoganyWholeTree", "非洲楝", "植物", africanMahogany, ["Khaya senegalensis", "板根偶数羽叶和四瓣圆木蒴果中的翅种"]),
  design("sapeleWholeTree", "沙比利树", "植物", sapele, ["Entandrophragma cylindricum", "高大板根偶数羽叶与五长瓣圆柱木蒴果"]),
  design("bitterwoodWholeTree", "苦木树", "植物", bitterwood, ["Quassia amara", "有翼奇数羽叶及真实中空的细长五裂管花"]),
  design("chineseAlangiumWholeTree", "八角枫", "植物", chineseAlangium, ["Alangium chinense", "不规则裂叶与叶腋八条细带花被小花"]),
  design("silverbellWholeTree", "银钟树", "植物", silverbell, ["Halesia carolina", "锯齿互生叶真实四裂薄壁钟花与四纵翅果"]),
  design("bladdernutWholeTree", "省沽油", "植物", bladdernut, ["Staphylea pinnata", "奇数锯齿羽叶和纵缝相接的三室膨胀纸囊"]),
  design("dipteroniaWholeTree", "金钱槭", "植物", dipteronia, ["Dipteronia sinensis", "奇数羽叶与真正同柄成对的完整圆盘纸翅果"]),
  design("osageOrangeWholeTree", "桑橙树", "植物", osageOrange, ["Maclura pomifera", "硬枝刺单叶与真实连续瘤纹的巨大聚花果"]),
  design("castillaRubberWholeTree", "卡斯蒂利亚橡胶树", "植物", castillaRubberTree, ["Castilla elastica", "高板根互生巨椭圆叶与扁盘状聚花果"]),
  design("bullhornAcaciaWholeTree", "牛角金合欢", "植物", bullhornAcacia, ["Vachellia cornigera", "Acacia cornigera", "细二回羽叶与真正肿大分叉的成对牛角托叶刺"]),
  design("iceCreamBeanWholeTree", "冰淇淋豆树", "植物", iceCreamBeanTree, ["Inga edulis", "有翼偶数大羽叶真实蜜腺与近米长厚荚"]),
  design("manilaTamarindWholeTree", "牛蹄豆树", "植物", manilaTamarind, ["Pithecellobium dulce", "马尼拉罗望子", "两羽片各两小叶成对托叶刺与肉质假种皮环荚"]),
  design("whiteLeadtreeWholeTree", "银合欢", "植物", whiteLeadtree, ["Leucaena leucocephala", "细密二回羽叶球绒花头和成簇平扁长荚"]),
];
