import { cap, combineMeshes, design, leaf, lobe, needle, part, petals, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { compoundLeaf, flatLeaf } from "./ediblePlants";
import { branchPoint, leafyShoot } from "./woodyExpansionBatchOne";
import { featherCrown, palmFrond } from "./woodyExpansionBatchTwo";
import { buttresses, canopy, forestCrown } from "./woodyExpansionBatchThree";
import { fiveLobedCalyx } from "./woodyExpansionBatchFour";

const bark = "#988d74";
const green = "#81966e";
const pale = "#b8c49e";
const fruitColor = "#b9aa83";
const white = "#d0c7ac";
const serrate: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.24, .12], [-.45, .29], [-.32, .38], [-.5, .56], [-.31, .65], [0, 1], [.31, .65], [.5, .56], [.32, .38], [.45, .29], [.24, .12]];

function mix(a: Triple, b: Triple, t: number): Triple { return a.map((value, axis) => value + (b[axis]! - value) * t) as Triple; }

function quince(): ModelPart[] {
  const { parts, tips } = forestCrown(6.4, 2.6, .105, .07, "oval");
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .095, tip[2]];
    parts.push(tapered("榅桲枝端粗短果柄", bark, [tip, p], [.006, .004]), part("榅桲有肩部圆棱的长梨形大果", "lathe", fruitColor, [p[0], p[1] - .1, p[2]], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .038, y: .006 }, { x: .066, y: .044 }, { x: .055, y: .085 }, { x: .031, y: .12 }, { x: .016, y: .16 }, { x: 0, y: .165 }] }), petals(5, [p[0], p[1] - .095, p[2]], .006, .013, 112, bark));
  }
  return parts;
}

function medlarTree(): ModelPart[] {
  const { parts, tips } = forestCrown(6.2, 2.9, .13, .052, serrate);
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .045, tip[2]];
    parts.push(tapered("欧楂短而粗的木质果柄", bark, [tip, p], [.004, .0025]), part("欧楂宽顶梨果与一体形成的真实内凹大萼腔", "lathe", fruitColor, p, [1, 1, 1], [180, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .025, y: .005 }, { x: .055, y: .035 }, { x: .055, y: .065 }, { x: .034, y: .08 }, { x: .024, y: .074 }, { x: .018, y: .055 }, { x: 0, y: .05 }] }), petals(5, [p[0], p[1] - .076, p[2]], .009, .026, 113, fruitColor));
  }
  return parts;
}

function hawthorn(): ModelPart[] {
  const { parts, tips } = forestCrown(8.1, 3.1, .055, .042, "lobed"), thorns: ModelPart[] = [];
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 8; index++) { const a = index * 2.4, p: Triple = [tip[0] + Math.cos(a) * .035, tip[1] - .025 - index % 3 * .019, tip[2] + Math.sin(a) * .035]; stems.push(needle("单核山楂伞房果序细分梗", bark, tip, p, .0015)); fruits.push(lobe("单核山楂一枚球形梨果", "#b49d87", p, [.012, .013, .012])); }
    parts.push(combineMeshes("单核山楂完整果序轴", bark, stems), combineMeshes("单核山楂逐枚分离的小梨果簇", "#b49d87", fruits));
    thorns.push(needle("单核山楂老枝端硬木质直刺", bark, tip, [tip[0] + .04, tip[1] + .025, tip[2]], .006));
  }
  parts.push(combineMeshes("单核山楂全部木质枝刺", bark, thorns));
  return parts;
}

function japaneseRaisinTree(): ModelPart[] {
  const { parts, tips } = forestCrown(14.8, 4.2, .14, .1, serrate);
  for (const tip of tips) {
    const stems: ModelPart[] = [], capsules: ModelPart[] = [];
    for (let fork = 0; fork < 3; fork++) {
      const a = fork * Math.PI * 2 / 3, root: Triple = [tip[0] + Math.cos(a) * .04, tip[1] - .06, tip[2] + Math.sin(a) * .04], end: Triple = [root[0] + Math.cos(a + .8) * .05, root[1] - .025, root[2] + Math.sin(a + .8) * .05];
      stems.push(tapered("拐枣果序实际膨大且连续转折的肉质果柄", fruitColor, [tip, root, end], [.006, .013, .009]));
      for (const side of [-1, 1]) { const q: Triple = [end[0] + Math.cos(a + side) * .025, end[1] + .005, end[2] + Math.sin(a + side) * .025]; stems.push(needle("膨大果柄末端承托小球蒴果的细轴", bark, end, q, .002)); capsules.push(lobe("拐枣真正的果实为独立小球形蒴果", bark, q, [.007, .008, .007])); }
    }
    parts.push(combineMeshes("一整簇可辨转折膨大的拐枣果柄", fruitColor, stems), combineMeshes("拐枣膨大果柄外的真实小蒴果", bark, capsules));
  }
  return parts;
}

function guelderRose(): ModelPart[] {
  const threeLobed: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.25, .15], [-.5, .47], [-.16, .44], [-.17, .66], [0, 1], [.17, .66], [.16, .44], [.5, .47], [.25, .15]];
  const parts: ModelPart[] = [], tips: Triple[] = [];
  for (let stem = 0; stem < 3; stem++) {
    const a = stem * Math.PI * 2 / 3, root: Triple = [Math.cos(a) * .08, 0, Math.sin(a) * .08], end: Triple = [Math.cos(a) * .55, 4.3 + stem * .1, Math.sin(a) * .55];
    parts.push(tapered("欧洲荚蒾从地面丛生的独立木质秆", bark, [root, end], [.075, .006]));
    for (let fork = 0; fork < 2; fork++) {
      const b = a + (fork ? .6 : -.6), start = mix(root, end, .48 + fork * .15), tip: Triple = [Math.cos(b) * 1.7, 3.7 + fork * .4, Math.sin(b) * 1.7]; tips.push(tip);
      parts.push(tapered("欧洲荚蒾从丛生秆分出的木质冠枝", bark, [start, tip], [.04, .004]));
      for (let twig = 0; twig < 2; twig++) { const p = mix(start, tip, .65 + twig * .26), c = b + (twig ? .6 : -.6); parts.push(...leafyShoot(p, [p[0] + Math.cos(c) * .32, p[1] + .12, p[2] + Math.sin(c) * .32], .095, .085, threeLobed, true)); }
    }
  }
  parts.push(canopy(tips, 1.45, 1));
  for (const tip of tips) {
    const florets: ModelPart[] = [], axes: ModelPart[] = [];
    for (let index = 0; index < 12; index++) { const a = index * 2.4, r = Math.sqrt(index / 12) * .032, p: Triple = [tip[0] + Math.cos(a) * r, tip[1] + .025, tip[2] + Math.sin(a) * r]; axes.push(needle("荚蒾中心可育小花的细花柄", bark, tip, p, .0012)); florets.push(lobe("荚蒾平顶花序中心的微型可育小花", white, p, [.004, .005, .004])); }
    for (let sterile = 0; sterile < 6; sterile++) { const a = sterile * Math.PI / 3, p: Triple = [tip[0] + Math.cos(a) * .065, tip[1] + .025, tip[2] + Math.sin(a) * .065]; axes.push(needle("荚蒾花序周缘大型不育花的花柄", bark, tip, p, .0015)); for (let petal = 0; petal < 5; petal++) florets.push(leaf("荚蒾周缘不育花的显著大白色花瓣", white, p, .008, .013, [80, petal * 72, 0], "YXZ")); }
    parts.push(combineMeshes("荚蒾完整平顶花序的分级花柄", bark, axes), combineMeshes("荚蒾小中心花与大周缘不育花", white, florets));
  }
  return parts;
}

function cornusCherry(): ModelPart[] {
  const { parts, tips } = forestCrown(7.6, 3.1, .09, .05, "oval", true);
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stalks: ModelPart[] = [];
    for (let index = 0; index < 6; index++) { const a = index * Math.PI / 3, p: Triple = [tip[0] + Math.cos(a) * .025, tip[1] - .035, tip[2] + Math.sin(a) * .025]; stalks.push(needle("山茱萸长圆核果各自独立的细短柄", bark, tip, p, .0015)); fruits.push(lobe("山茱萸叶腋成簇的长椭圆小核果", "#b39c88", p, [.009, .021, .009])); }
    parts.push(combineMeshes("山茱萸全部独立果梗", bark, stalks), combineMeshes("山茱萸一整簇长圆核果", "#b39c88", fruits));
  }
  return parts;
}

function amurCorkTree(): ModelPart[] {
  const { parts, tips } = featherCrown(18.7, 4.8, .36, 3), cork: ModelPart[] = [];
  parts.push(canopy(tips, 4.9, 4));
  for (let index = 0; index < 36; index++) { const a = index * 2.4, y = .1 + index % 12 * .42, radius = .66 - y * .025; cork.push(lobe("黄柏粗干上厚实而隆起的木栓树皮块", bark, [Math.cos(a) * radius, y, Math.sin(a) * radius], [.16, .3, .12], [0, 90 - a * 180 / Math.PI, 0])); }
  parts.push(combineMeshes("黄柏完整厚木栓质树皮层", bark, cork));
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 14; index++) { const a = index * 2.4, p: Triple = [tip[0] + Math.cos(a) * .045, tip[1] - .02 - index % 4 * .02, tip[2] + Math.sin(a) * .045]; stems.push(needle("黄柏短圆锥果序的真实细梗", bark, tip, p, .0015)); fruits.push(lobe("黄柏逐枚分离的小球形核果", "#87917d", p, [.009, .01, .009])); }
    parts.push(combineMeshes("黄柏完整圆锥状分叉果序", bark, stems), combineMeshes("黄柏一整簇球形核果", "#87917d", fruits));
  }
  return parts;
}

export function bicoloredShoot(root: Triple, end: Triple, length = .19, width = .085, underside = "#bdc2ab", name = "银叶树"): ModelPart[] {
  const upper: ModelPart[] = [], lower: ModelPart[] = [], woody: ModelPart[] = [tapered(`${name}与主枝连接的叶枝`, bark, [root, end], [.012, .003])], a = Math.atan2(end[2] - root[2], end[0] - root[0]);
  for (let index = 0; index < 6; index++) {
    const base = mix(root, end, (index + 1) / 7), b = a + (index % 2 ? 1 : -1), p: Triple = [base[0] + Math.cos(b) * .02, base[1] + .01, base[2] + Math.sin(b) * .02]; woody.push(needle(`${name}短而真实相连的叶柄`, bark, base, p, .003));
    const blade = flatLeaf(`${name}完整长椭圆革叶`, p, [p[0] + Math.cos(b) * length, p[1] + .03, p[2] + Math.sin(b) * length], width), half = blade.vertices!.length / 2, groups: number[][] = [[], []];
    for (let face = 0; face < blade.indices!.length; face += 3) { const triangle = blade.indices!.slice(face, face + 3); groups[triangle.every(value => value < half) ? 1 : 0]!.push(...triangle); }
    for (let side = 0; side < 2; side++) {
      const remap = new Map<number, number>(), indices = groups[side]!.map(value => { if (!remap.has(value)) remap.set(value, remap.size); return remap.get(value)!; }), vertices = [...remap.keys()].map(value => ({ ...blade.vertices![value]! }));
      const value: ModelPart = { ...blade, name: side ? `${name}真实异色叶背` : `${name}绿色叶面与叶缘`, color: side ? underside : green, vertices, indices };
      (side ? lower : upper).push(value);
    }
  }
  return [combineMeshes(`${name}全部相连的木质叶枝`, bark, woody), combineMeshes(`${name}全部完整绿色叶面`, green, upper), combineMeshes(`${name}与正面共用边界的真实异色叶背`, underside, lower)];
}

function lookingGlassTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("银叶树巨大板根以上的直立木质干", bark, [[0, 0, 0], [0, 14, 0], [.02, 23.5, 0]], [1.05, .55, .02])], tips: Triple[] = [];
  parts.push(...buttresses(1.05, 4.7, 4.5));
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 10.5 + axis * .6, 0], p: Triple = [Math.cos(a) * 6, 20 + axis % 3 * 1.1, Math.sin(a) * 6]; tips.push(p);
    parts.push(tapered("银叶树斜举后开展的大型冠枝", bark, [root, p], [.27, .008]));
    for (let node = 0; node < 2; node++) { const q = mix(root, p, .8 + node * .15), b = a + (node ? .7 : -.7); parts.push(...bicoloredShoot(q, [q[0] + Math.cos(b) * .45, q[1] + .15, q[2] + Math.sin(b) * .45])); }
    const fruit: ModelPart[] = [];
    for (let index = 0; index < 3; index++) { const b = index * Math.PI * 2 / 3; fruit.push(tapered("银叶树带明显纵脊的木质舟形蓇葖果", fruitColor, [p, [p[0] + Math.cos(b) * .035, p[1] - .015, p[2] + Math.sin(b) * .035], [p[0] + Math.cos(b) * .06, p[1] - .04, p[2] + Math.sin(b) * .06]], [.005, .022, .003])); }
    parts.push(combineMeshes("银叶树枝端完整木质舟形聚合果", fruitColor, fruit));
  }
  parts.push(canopy(tips, 6.2, 5.1));
  return parts;
}

function mangroveApple(): ModelPart[] {
  const parts: ModelPart[] = [tapered("海桑具有裂纹而非红色支柱的木质主干", bark, [[0, 0, 0], [.04, 6.5, 0], [0, 11.6, 0]], [.56, .3, .025])], tips: Triple[] = [], breathers: ModelPart[] = [];
  for (let root = 0; root < 24; root++) { const a = root * 2.4, r = .65 + Math.sqrt(root / 24) * 2.3, height = .55 + root % 5 * .18; breathers.push(tapered("海桑从泥面直立向上收尖的粗呼吸根", bark, [[Math.cos(a) * r, 0, Math.sin(a) * r], [Math.cos(a) * r, height, Math.sin(a) * r]], [.065, .005])); }
  parts.push(combineMeshes("海桑一整株独立而不附带地面的呼吸根群", bark, breathers));
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 6.2 + axis * .3, 0], middle: Triple = [Math.cos(a) * 2.2, 11.2 + axis % 2 * .5, Math.sin(a) * 2.2], p: Triple = [Math.cos(a) * 4.1, 8.5 + axis % 3 * .35, Math.sin(a) * 4.1]; tips.push(p);
    parts.push(tapered("海桑拱起后柔垂的完整冠枝", bark, [root, middle, p], [.18, .085, .006]), ...leafyShoot(branchPoint(root, middle, p, .82, .54), p, .105, .06, "obovate", true));
    const fruit: Triple = [p[0] + .035, p[1] - .07, p[2]], stamens: ModelPart[] = [];
    parts.push(tapered("海桑球果的短粗果柄", bark, [p, fruit], [.005, .003]), lobe("海桑近球形的绿色革质大浆果", pale, fruit, [.075, .062, .075]), cap("海桑浆果下面真实扁平的宿存萼托", green, [fruit[0], fruit[1] - .029, fruit[2]], .04, .019, 3));
    for (let stamen = 0; stamen < 40; stamen++) { const b = stamen * 2.4, r = Math.sqrt(stamen / 40) * .038; stamens.push(needle("海桑球刷花头中向外伸出的长雄蕊", white, p, [p[0] + Math.cos(b) * r, p[1] + .025 + stamen % 3 * .008, p[2] + Math.sin(b) * r], .0012)); }
    parts.push(combineMeshes("海桑一整朵放射丝状雄蕊花", white, stamens));
  }
  parts.push(canopy(tips, 4.1, 2.6));
  return parts;
}

function bayLaurel(): ModelPart[] {
  const waved: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.22, .15], [-.4, .3], [-.33, .43], [-.5, .57], [-.31, .72], [0, 1], [.31, .72], [.5, .57], [.33, .43], [.4, .3], [.22, .15]], { parts, tips } = forestCrown(9.8, 3.3, .1, .033, waved);
  for (const tip of tips) {
    const florets: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 6; index++) { const a = index * Math.PI / 3, p: Triple = [tip[0] + Math.cos(a) * .022, tip[1] + .02, tip[2] + Math.sin(a) * .022]; stems.push(needle("月桂叶腋小型伞状花序的细花柄", bark, tip, p, .0015)); for (let lobeIndex = 0; lobeIndex < 4; lobeIndex++) florets.push(leaf("月桂小花中四片独立的花被裂片", white, p, .003, .005, [80, lobeIndex * 90, 0], "YXZ")); }
    parts.push(combineMeshes("月桂树完整叶腋花伞分梗", bark, stems), combineMeshes("月桂叶腋全部四裂小花", white, florets));
  }
  return parts;
}

function russianOlive(): ModelPart[] {
  const { parts, tips } = forestCrown(10.5, 3.6, .075, .012, "oval"), thorns: ModelPart[] = [];
  for (const tip of tips) {
    const blossoms: ModelPart[] = [], fruits: ModelPart[] = [];
    for (const side of [-1, 1]) { const p: Triple = [tip[0] + side * .022, tip[1] - .03, tip[2]]; fruits.push(needle("沙枣卵形肉质果的独立短柄", bark, tip, p, .002), lobe("沙枣带鳞质表面的长椭圆肉质果", fruitColor, p, [.016, .028, .015])); }
    for (let flower = 0; flower < 4; flower++) {
      const a = flower * Math.PI / 2, p: Triple = [tip[0] + Math.cos(a) * .015, tip[1] + .015, tip[2] + Math.sin(a) * .015], vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
      blossoms.push(needle("沙枣叶腋花真正连接枝端的细花梗", white, tip, p, .001));
      for (let shell = 0; shell < 2; shell++) for (let ring = 0; ring < 3; ring++) for (let side = 0; side < 8; side++) { const b = side * Math.PI / 4, radius = [.0012, .0013, .004][ring]! - shell * .0004; vertices.push({ x: Math.cos(b) * radius, y: [0, .007, .011 + (side % 2 ? 0 : .0015)][ring]!, z: Math.sin(b) * radius }); }
      for (let shell = 0; shell < 2; shell++) for (let ring = 0; ring < 2; ring++) for (let side = 0; side < 8; side++) { const i = shell * 24 + ring * 8 + side, j = shell * 24 + ring * 8 + (side + 1) % 8; indices.push(...(shell ? [i, j + 8, j, i, i + 8, j + 8] : [i, j, j + 8, i, j + 8, i + 8])); }
      for (let side = 0; side < 8; side++) { const j = (side + 1) % 8; indices.push(side, side + 24, j + 24, side, j + 24, j, side + 16, j + 16, j + 40, side + 16, j + 40, side + 40); }
      for (let index = 0; index < indices.length; index += 3) [indices[index + 1], indices[index + 2]] = [indices[index + 2]!, indices[index + 1]!];
      blossoms.push(part("沙枣具有真实内腔与四尖开口的管状花被", "mesh", white, p, [1, 1, 1], [0, 0, 0], { vertices, indices }));
    }
    thorns.push(needle("沙枣木质枝端独立的坚硬直刺", bark, tip, [tip[0] + .04, tip[1] + .025, tip[2]], .005));
    parts.push(combineMeshes("沙枣完整叶腋四裂花被群", white, blossoms), combineMeshes("沙枣枝端完整独立果实与果柄", fruitColor, fruits));
  }
  parts.push(combineMeshes("沙枣树全部真实木质枝刺", bark, thorns));
  return parts;
}

function juniper(): ModelPart[] {
  const parts: ModelPart[] = [tapered("杜松从地表发出的不规则木质干", bark, [[0, 0, 0], [.16, 3, 0], [0, 8.3, 0]], [.3, .18, .008])], tips: Triple[] = [];
  for (let axis = 0; axis < 8; axis++) {
    const a = axis * 2.4, root: Triple = [0, 2.1 + axis * .5, 0], end: Triple = [Math.cos(a) * (2.8 - axis * .16), 5.2 + axis * .3, Math.sin(a) * (2.8 - axis * .16)]; tips.push(end);
    parts.push(tapered("杜松向外弯曲的硬木质冠枝", bark, [root, end], [.085 - axis * .006, .004]));
    const needles: ModelPart[] = [], shoots: ModelPart[] = [], cones: ModelPart[] = [];
    for (let twig = 0; twig < 3; twig++) { const p = mix(root, end, .55 + twig * .2), b = a + (twig % 2 ? .8 : -.8), q: Triple = [p[0] + Math.cos(b) * .24, p[1] + .025, p[2] + Math.sin(b) * .24]; shoots.push(needle("杜松实际承托针叶轮的细木枝", bark, p, q, .004)); for (let row = 0; row < 9; row++) { const base = mix(p, q, (row + 1) / 11); for (let leafIndex = 0; leafIndex < 3; leafIndex++) { const c = leafIndex * Math.PI * 2 / 3 + row * .3; needles.push(needle("杜松每节真实三叶轮生的硬尖针叶", green, base, [base[0] + Math.cos(c) * .018, base[1] + .008, base[2] + Math.sin(c) * .018], .0018)); } } cones.push(lobe("杜松由肉质合生鳞片形成的球形浆果状球果", "#9da895", [q[0], q[1] - .005, q[2]], [.009, .01, .009])); }
    parts.push(combineMeshes("杜松每条主枝的细木质叶枝", bark, shoots), combineMeshes("杜松完整三叶轮生针叶组", green, needles), combineMeshes("杜松各细枝端的独立肉质球果", "#9da895", cones));
  }
  parts.push(canopy(tips, 2.3, 2.3));
  return parts;
}

function pagodaTree(): ModelPart[] {
  const { parts, tips } = featherCrown(20.5, 5.6, .3, 4);
  parts.push(canopy(tips, 5.8, 4.5));
  for (const tip of tips) {
    const pods: ModelPart[] = [];
    for (let fruit = 0; fruit < 3; fruit++) {
      const a = fruit * Math.PI * 2 / 3, path: Triple[] = Array.from({ length: 8 }, (_, index) => [tip[0] + Math.cos(a) * index * .007, tip[1] - index * .021, tip[2] + Math.sin(a) * index * .007]);
      pods.push(tapered("国槐种室间明显收细的连续念珠状荚果", fruitColor, path, path.map((_, index) => index % 2 ? .008 : .002)));
    }
    parts.push(combineMeshes("国槐一整簇不间断的串珠荚果", fruitColor, pods));
  }
  return parts;
}

export function largeBipinnateLeaf(root: Triple, angle: number): ModelPart {
  const end: Triple = [root[0] + Math.cos(angle) * .6, root[1] + .08, root[2] + Math.sin(angle) * .6], pieces: ModelPart[] = [needle("大型二回羽状复叶的第一级共同叶轴", green, root, end, .004)];
  for (let pair = 0; pair < 2; pair++) for (const side of [-1, 1]) pieces.push(compoundLeaf(mix(root, end, .3 + pair * .45), (angle + side * 1.15) * 180 / Math.PI, .28, 2));
  return combineMeshes("一片完整大型二回羽状复叶", green, pieces);
}

function kentuckyCoffeeTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("肯塔基咖啡树疏冠下面的直立粗干", bark, [[0, 0, 0], [0, 12, 0], [0, 23, 0]], [.8, .44, .03])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 10.5 + axis * .7, 0], p: Triple = [Math.cos(a) * 5.7, 20 + axis % 3 * 1.1, Math.sin(a) * 5.7]; tips.push(p);
    parts.push(tapered("肯塔基咖啡树节粗而疏朗的木质骨干枝", bark, [root, p], [.29, .012]));
    for (let node = 0; node < 3; node++) parts.push(largeBipinnateLeaf(mix(root, p, .65 + node * .15), a + (node % 2 ? .6 : -.6)));
    for (const side of [-1, 1]) parts.push(tapered("肯塔基咖啡树宽厚扁平的深褐豆荚", "#a4987b", [p, [p[0] + side * .025, p[1] - .09, p[2]], [p[0] + side * .035, p[1] - .17, p[2]]], [.007, .026, .008]));
  }
  parts.push(canopy(tips, 5.6, 4.2));
  return parts;
}

function chinaDollTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("菜豆树从地表到冠顶的木质主干", bark, [[0, 0, 0], [0, 6.5, 0], [0, 14.5, 0]], [.42, .25, .015])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 5.8 + axis * .35, 0], p: Triple = [Math.cos(a) * 4.2, 11.8 + axis % 3 * .8, Math.sin(a) * 4.2]; tips.push(p);
    parts.push(tapered("菜豆树有二回羽叶的连续木质侧枝", bark, [root, p], [.16, .006]));
    for (let node = 0; node < 2; node++) parts.push(largeBipinnateLeaf(mix(root, p, .76 + node * .19), a + (node ? .7 : -.7)));
    const flower = fiveLobedCalyx([0, 0, 0]); flower.name = "菜豆树真实中空的长喇叭花冠"; flower.color = white; flower.position = { x: p[0], y: p[1], z: p[2] }; flower.rotation.x = 180; flower.scale = { x: 2.1, y: 3, z: 2.1 };
    parts.push(flower, tapered("菜豆树枝端下垂的细长圆柱蒴果", fruitColor, [p, [p[0] + .02, p[1] - .22, p[2]], [p[0] + .025, p[1] - .4, p[2]]], [.005, .006, .002]));
  }
  parts.push(canopy(tips, 4.3, 3.3));
  return parts;
}

function indianCorkTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("羽叶楸高大疏枝的完整直干", bark, [[0, 0, 0], [0, 13, 0], [0, 23.5, 0]], [.68, .35, .02])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 11 + axis * .55, 0], p: Triple = [Math.cos(a) * 5.2, 20 + axis % 3 * 1.2, Math.sin(a) * 5.2]; tips.push(p);
    parts.push(tapered("羽叶楸冠部斜举的连续木质枝", bark, [root, p], [.22, .007]), largeBipinnateLeaf(mix(root, p, .82), a));
    const tubes: ModelPart[] = [], lobes: ModelPart[] = [];
    for (let flower = 0; flower < 8; flower++) {
      const b = flower * 2.4, q: Triple = [p[0] + Math.cos(b) * .04, p[1] + .025 + flower % 3 * .02, p[2] + Math.sin(b) * .04], end: Triple = [q[0], q[1] + .055, q[2]];
      tubes.push(needle("羽叶楸花序里相连的细长花梗", bark, p, q, .0015), tapered("羽叶楸细长而连续的白色花冠筒", white, [q, end], [.0018, .0025]));
      for (let petal = 0; petal < 4; petal++) { const c = petal * Math.PI / 2; lobes.push(leaf("羽叶楸花冠端部十字状四裂片", white, end, .004, .013, [80, -c * 180 / Math.PI, 0], "YXZ")); }
    }
    parts.push(combineMeshes("羽叶楸全部连续长花管与花序梗", white, tubes), combineMeshes("羽叶楸细管端部完整四裂花冠", white, lobes));
  }
  parts.push(canopy(tips, 5.3, 4.1));
  return parts;
}

function glossyPrivet(): ModelPart[] {
  const { parts, tips } = forestCrown(12.4, 3.8, .13, .055, "oval", true);
  for (const tip of tips) {
    const stems: ModelPart[] = [], florets: ModelPart[] = [];
    for (let flower = 0; flower < 12; flower++) { const a = flower * 2.4, p: Triple = [tip[0] + Math.cos(a) * .08, tip[1] + .035 + flower % 4 * .04, tip[2] + Math.sin(a) * .08]; stems.push(needle("大叶女贞顶生圆锥花序的层层细分轴", bark, tip, p, .0015)); for (let lobeIndex = 0; lobeIndex < 4; lobeIndex++) florets.push(leaf("大叶女贞小花的四片圆卵花冠裂片", white, p, .0025, .0045, [80, lobeIndex * 90, 0], "YXZ")); }
    parts.push(combineMeshes("大叶女贞完整冠顶大圆锥花序轴", bark, stems), combineMeshes("大叶女贞全部微型四裂花冠", white, florets));
  }
  return parts;
}

function salakPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("蛇皮果棕从泥面侧生的短粗木质干", bark, [[0, 0, 0], [.1, 1.2, 0]], [.28, .21])], spines: ModelPart[] = [];
  for (let frond = 0; frond < 8; frond++) {
    const a = frond * Math.PI / 4, root: Triple = [.1, 1.1, 0], middle: Triple = [.1 + Math.cos(a) * 1.44, 3.7, Math.sin(a) * 1.44], end: Triple = [.1 + Math.cos(a) * 3.6, 1.88, Math.sin(a) * 3.6];
    parts.push(...palmFrond(root, a, 3.6, 2.6, 12, .08));
    for (let row = 0; row < 9; row++) for (const side of [-1, 1]) { const p = branchPoint(root, middle, end, .035 + row * .035, .4), b = a + side * 1.2; spines.push(needle("蛇皮果棕叶柄基部两侧实际坚硬长刺", bark, p, [p[0] + Math.cos(b) * .17, p[1] + .045, p[2] + Math.sin(b) * .17], .008)); }
  }
  for (let offset = 0; offset < spines.length; offset += 60) parts.push(combineMeshes("蛇皮果棕叶鞘附近真实长刺群", bark, spines.slice(offset, offset + 60)));
  const fruits: ModelPart[] = [], stalks: ModelPart[] = [];
  for (let fruit = 0; fruit < 16; fruit++) { const a = fruit * 2.4, p: Triple = [.1 + Math.cos(a) * .25, .4 + fruit % 3 * .055, Math.sin(a) * .25]; fruits.push(lobe("蛇皮果棕近地表紧簇的卵形蛇皮果", fruitColor, p, [.045, .065, .043])); stalks.push(needle("蛇皮果紧贴短干的真实粗果梗", bark, [.1, .65, 0], p, .006)); }
  parts.push(combineMeshes("蛇皮果棕基部完整低垂果序梗", bark, stalks), combineMeshes("蛇皮果棕短干下方全部独立果实", fruitColor, fruits));
  return parts;
}

function stiltRootPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("支柱根棕榈从根锥顶端开始的直立木质秆", bark, [[0, 2.4, 0], [0, 18.5, 0]], [.22, .15])];
  for (let root = 0; root < 9; root++) { const a = root * Math.PI * 2 / 9; parts.push(tapered("支柱根棕榈直接落地支承树干的斜支柱根", bark, [[0, 2.6 - root % 3 * .25, 0], [Math.cos(a) * .65, 1.2, Math.sin(a) * .65], [Math.cos(a) * 1.35, 0, Math.sin(a) * 1.35]], [.055, .045, .035])); }
  for (let frond = 0; frond < 7; frond++) {
    const a = frond * 2.4, root: Triple = [0, 18.4, 0], middle: Triple = [Math.cos(a) * 1.4, 19.2, Math.sin(a) * 1.4], end: Triple = [Math.cos(a) * 3.4, 18, Math.sin(a) * 3.4], leaflets: ModelPart[] = [];
    parts.push(tapered("支柱根棕榈完整单回羽叶的弧形叶轴", bark, [root, middle, end], [.035, .022, .003]));
    for (let pinna = 0; pinna < 9; pinna++) for (const side of [-1, 1]) { const p = branchPoint(root, middle, end, .2 + pinna * .08, .41), b = a + side * 1.15; leaflets.push(flatLeaf("支柱根棕榈单回叶轴上裂端楔状小叶", p, [p[0] + Math.cos(b) * .55, p[1] - .1, p[2] + Math.sin(b) * .55], .23, [[0, 0], [-.18, .2], [-.5, .8], [-.3, .75], [0, 1], [.3, .75], [.5, .8], [.18, .2]])); }
    parts.push(combineMeshes("支柱根棕榈一片完整单回羽状裂端叶", green, leaflets));
  }
  return parts;
}

function pracaxiTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("南美油豆树高大粗直的木质主干", bark, [[0, 0, 0], [0, 14, 0], [.02, 25.5, 0]], [.8, .43, .025])], tips: Triple[] = [];
  parts.push(...buttresses(.8, 3.2, 3.7));
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 12 + axis * .65, 0], p: Triple = [Math.cos(a) * 5.8, 22 + axis % 3 * 1.2, Math.sin(a) * 5.8]; tips.push(p);
    parts.push(tapered("南美油豆树有大型二回羽叶的木质冠枝", bark, [root, p], [.28, .008]));
    for (let node = 0; node < 2; node++) parts.push(largeBipinnateLeaf(mix(root, p, .75 + node * .2), a + (node ? .8 : -.8)));
    const pod: ModelPart[] = [];
    for (const side of [-1, 1]) pod.push(tapered("南美油豆树开裂后反曲的厚木质长荚瓣", fruitColor, [p, [p[0] + side * .025, p[1] - .14, p[2]], [p[0] + side * .08, p[1] - .23, p[2] + .015], [p[0] + side * .12, p[1] - .18, p[2] + .025]], [.004, .024, .02, .003]));
    parts.push(combineMeshes("南美油豆树一整枚两瓣反曲长木质荚果", fruitColor, pod));
  }
  parts.push(canopy(tips, 6, 4.8));
  return parts;
}

// 科学名及近义名称只索引同一完整株；不登记单果、单叶、季节或栽培状态为额外主项。
// https://www.nparks.gov.sg/florafaunaweb/flora/3/3/3343
// https://trees.stanford.edu/ENCYC/SOPHjap.htm
// https://www.dnr.state.mn.us/trees/kentucky-coffeetree.html
// https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A110522-1/general-information
export const woodyExpansionBatchSevenDesigns: MasterNatureDesign[] = [
  design("quinceWholeTree", "榅桲", "植物", quince, ["Cydonia oblonga", "圆卵全叶与肩棱梨形大果"]),
  design("medlarWholeTree", "欧楂树", "植物", medlarTree, ["Mespilus germanica", "长锯齿叶与宽顶开张萼腔梨果"]),
  design("hawthornWholeTree", "单核山楂", "植物", hawthorn, ["Crataegus monogyna", "深裂叶木质枝刺与小梨果伞房簇"]),
  design("raisinWholeTree", "拐枣", "植物", japaneseRaisinTree, ["Hovenia dulcis", "枳椇", "转折膨大的肉质果柄与末端独立小蒴果"]),
  design("guelderRoseWholeShrub", "欧洲荚蒾", "植物", guelderRose, ["Viburnum opulus", "掌裂对生叶与中心小边缘大的平顶花序"]),
  design("cornusCherryWholeTree", "山茱萸", "植物", cornusCherry, ["Cornus officinalis", "对生单叶与叶腋独立长圆核果簇"]),
  design("amurCorkWholeTree", "黄柏", "植物", amurCorkTree, ["Phellodendron amurense", "黄檗", "厚木栓树皮奇数羽叶与黑色球果簇"]),
  design("lookingGlassWholeTree", "银叶树", "植物", lookingGlassTree, ["Heritiera littoralis", "巨大板根真实双面异色叶与舟形木质果"]),
  design("mangroveAppleWholeTree", "海桑", "植物", mangroveApple, ["Sonneratia caseolaris", "粗呼吸根垂冠对生叶与扁萼托球果"]),
  design("bayLaurelWholeTree", "月桂树", "植物", bayLaurel, ["Laurus nobilis", "波缘互生革叶与叶腋四裂小花伞"]),
  design("russianOliveWholeTree", "沙枣", "植物", russianOlive, ["Elaeagnus angustifolia", "狭长叶木刺四裂管花与长椭圆肉质果"]),
  design("juniperWholeTree", "杜松", "植物", juniper, ["Juniperus communis", "真实三叶针轮与肉质浆果状球果"]),
  design("pagodaWholeTree", "国槐", "植物", pagodaTree, ["Styphnolobium japonicum", "Sophora japonica", "羽状复叶与种室间收缩的念珠荚果"]),
  design("kentuckyCoffeeWholeTree", "肯塔基咖啡树", "植物", kentuckyCoffeeTree, ["Gymnocladus dioicus", "疏冠粗节枝大型二回羽叶与厚扁荚"]),
  design("chinaDollWholeTree", "菜豆树", "植物", chinaDollTree, ["Radermachera sinica", "幸福树", "二回羽叶真实长喇叭花与圆柱蒴果"]),
  design("indianCorkWholeTree", "羽叶楸", "植物", indianCorkTree, ["Millingtonia hortensis", "二回羽叶与细长花筒端部十字四裂花冠"]),
  design("glossyPrivetWholeTree", "大叶女贞", "植物", glossyPrivet, ["Ligustrum lucidum", "对生大革叶与顶生四裂小花大圆锥序"]),
  design("salakWholePalm", "蛇皮果棕", "植物", salakPalm, ["Salacca zalacca", "短干硬刺叶柄与近地表紧簇蛇皮果"]),
  design("stiltRootWholePalm", "支柱根棕榈", "植物", stiltRootPalm, ["Socratea exorrhiza", "高秆斜撑支柱根与单回裂端羽叶"]),
  design("pracaxiWholeTree", "南美油豆树", "植物", pracaxiTree, ["Pentaclethra macroloba", "板根大型二回羽叶与反曲两瓣木质豆荚"]),
];
