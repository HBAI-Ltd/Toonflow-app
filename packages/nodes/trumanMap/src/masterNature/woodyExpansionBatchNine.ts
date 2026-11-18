import { cap, combineMeshes, design, leaf, lobe, needle, part, petals, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { branchPoint, leafyShoot } from "./woodyExpansionBatchOne";
import { featherCrown } from "./woodyExpansionBatchTwo";
import { buttresses, canopy, forestCrown } from "./woodyExpansionBatchThree";
import { largeBipinnateLeaf } from "./woodyExpansionBatchSeven";

const bark = "#a49a80";
const green = "#869d76";
const pale = "#c2c8a2";
const flowerColor = "#c8b39d";
const fruitColor = "#ae9e7f";

function mix(a: Triple, b: Triple, t: number): Triple { return a.map((value, axis) => value + (b[axis]! - value) * t) as Triple; }

function buttercupTree(): ModelPart[] {
  const { parts, tips } = forestCrown(11.5, 3.9, .2, .19, "palm");
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .045, tip[2]], valves: ModelPart[] = [], cotton: ModelPart[] = [];
    parts.push(needle("黄绵木宽梨形蒴果的粗短果梗", bark, tip, p, .005));
    for (let valve = 0; valve < 5; valve++) { const a = valve * Math.PI * 2 / 5, q: Triple = [p[0] + Math.cos(a) * .017, p[1] - .045, p[2] + Math.sin(a) * .017]; valves.push(flatLeaf("黄绵木蒴果成熟裂开的五片革质果瓣", p, [p[0] + Math.cos(a) * .05, p[1] - .09, p[2] + Math.sin(a) * .05], .045, "obovate", .003)); cotton.push(lobe("黄绵木五瓣蒴果腔内的真实种子绵毛团", pale, q, [.035, .043, .035])); }
    parts.push(combineMeshes("黄绵木一整枚有五条裂缝的开放蒴果", fruitColor, valves), combineMeshes("黄绵木真实果瓣之间的种子绵毛", pale, cotton));
  }
  return parts;
}

function shavingBrushTree(): ModelPart[] {
  const parts: ModelPart[] = [part("粉红绵木基部膨大且向上迅速收窄的绿灰干", "lathe", bark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .52, y: 0 }, { x: .65, y: .9 }, { x: .42, y: 2.2 }, { x: .25, y: 4.3 }, { x: .09, y: 8.2 }, { x: 0, y: 8.5 }] })], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 2.5 + axis * .4, 0], end: Triple = [Math.cos(a) * 3.5, 7 + axis % 3 * .7, Math.sin(a) * 3.5]; tips.push(end); parts.push(tapered("粉红绵木低处分叉的粗绿灰木枝", bark, [root, end], [.19, .015]));
    const base = mix(root, end, .8), b = a + .7, p: Triple = [base[0] + Math.cos(b) * .12, base[1] + .055, base[2] + Math.sin(b) * .12], blades: ModelPart[] = [needle("粉红绵木五掌复叶的长共有叶柄", green, base, p, .005)];
    for (let blade = 0; blade < 5; blade++) { const c = a + (blade - 2) * .65; blades.push(flatLeaf("粉红绵木掌状复叶中宽椭圆的独立小叶", p, [p[0] + Math.cos(c) * .24, p[1] + .045, p[2] + Math.sin(c) * .24], .14)); }
    parts.push(combineMeshes("粉红绵木一片完整五掌大复叶", green, blades));
    const flower: ModelPart[] = [], blossom: Triple = [end[0], end[1] + .025, end[2]]; flower.push(needle("粉红绵木枝端梳刷花的粗短柄", bark, end, blossom, .005));
    for (let stamen = 0; stamen < 72; stamen++) { const c = stamen * 2.4, r = Math.sqrt((stamen + 1) / 72) * .08; flower.push(needle("粉红绵木梳刷花中向四周伸展的独立长雄蕊", flowerColor, blossom, [blossom[0] + Math.cos(c) * r, blossom[1] + .1 + (1 - r / .08) * .04, blossom[2] + Math.sin(c) * r], .0008)); }
    for (let petal = 0; petal < 5; petal++) flower.push(leaf("粉红绵木梳刷雄蕊外部向后反卷的长花瓣", flowerColor, blossom, .013, .06, [125, petal * 72, 0], "YXZ"));
    parts.push(combineMeshes("粉红绵木一整朵真实放射长雄蕊梳刷花", flowerColor, flower));
  }
  parts.push(canopy(tips, 2.8, 2.3));
  return parts;
}

function cuipo(): ModelPart[] {
  const parts: ModelPart[] = [part("巨腹木高大而局部膨胀的完整光滑圆干", "lathe", bark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.25, y: 0 }, { x: 1.65, y: 8 }, { x: 1.45, y: 18 }, { x: .85, y: 35 }, { x: .3, y: 48 }, { x: 0, y: 54 }] })], tips: Triple[] = [], rings: ModelPart[] = [];
  for (let whorl = 0; whorl < 3; whorl++) for (let axis = 0; axis < 3; axis++) {
    const a = axis * Math.PI * 2 / 3 + whorl * .8, root: Triple = [0, 37 + whorl * 4, 0], end: Triple = [Math.cos(a) * (8.5 - whorl * 1.4), 47.5 + whorl * 2.2, Math.sin(a) * (8.5 - whorl * 1.4)]; tips.push(end);
    parts.push(tapered("巨腹木在上部裸干上分层轮生的粗冠枝", bark, [root, end], [.52 - whorl * .13, .012]), ...leafyShoot(mix(root, end, .87), end, .27, .25, "palm"));
    const p: Triple = [end[0], end[1] - .04, end[2]], wings: ModelPart[] = [];
    parts.push(needle("巨腹木大型翅果真实下垂的果柄", bark, end, p, .003));
    for (let wing = 0; wing < 5; wing++) { const b = wing * Math.PI * 2 / 5; wings.push(flatLeaf("巨腹木同一果体上向五个方向展开的纸质纵翅", p, [p[0], p[1] - .1, p[2]], .065, [[0, 0], [-.12, .13], [-.5, .48], [-.28, .84], [0, 1], [.02, .5]], .001)); wings[wing]!.rotation.y = b * 180 / Math.PI; }
    parts.push(combineMeshes("巨腹木单枚果体上的真实五片纵向翅", fruitColor, wings));
  }
  for (let ring = 0; ring < 5; ring++) { const y = 3 + ring * 6.5, r = y < 8 ? 1.25 + .4 * y / 8 : y < 18 ? 1.65 - (y - 8) * .02 : 1.45 - (y - 18) * .6 / 17; rings.push(part("巨腹木贴合实际干径的水平生长痕", "lathe", "#b2a78c", [0, y, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: r - .006, y: 0 }, { x: r + .014, y: 0 }, { x: r + .012, y: .045 }, { x: r - .008, y: .045 }, { x: r - .006, y: 0 }] })); }
  parts.push(...rings, canopy(tips, 7.6, 4.8));
  return parts;
}

function sausageTree(): ModelPart[] {
  const { parts, tips } = featherCrown(17.5, 6.1, .48, 3, false, true, 2, "oval"); parts.push(canopy(tips, 6, 4.5));
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - 1.1, tip[2]]; parts.push(tapered("吊瓜树吊挂巨大香肠果的真实细长木质柄", bark, [tip, p], [.008, .006]), part("吊瓜树钝端圆肩且向下悬挂的长圆柱巨果", "lathe", fruitColor, [p[0], p[1] - .65, p[2]], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .045, y: .018 }, { x: .066, y: .09 }, { x: .07, y: .47 }, { x: .05, y: .62 }, { x: 0, y: .65 }] }));
  }
  return parts;
}

function pinkBallTree(): ModelPart[] {
  const heartSerrate: Parameters<typeof flatLeaf>[4] = [[0, .08], [-.26, -.05], [-.49, .15], [-.35, .3], [-.5, .45], [-.27, .58], [0, 1], [.27, .58], [.5, .45], [.35, .3], [.49, .15], [.26, -.05]];
  const { parts, tips } = forestCrown(8.5, 3.8, .19, .18, heartSerrate);
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .2, tip[2]], flowers: ModelPart[] = [], stems: ModelPart[] = [];
    parts.push(needle("非洲芙蓉球状伞花序真正下垂的长花序柄", bark, tip, p, .005));
    for (let flower = 0; flower < 18; flower++) { const a = flower * 2.4, y = -.8 + flower / 17 * 1.5, r = Math.sqrt(1 - y * y) * .055, q: Triple = [p[0] + Math.cos(a) * r, p[1] + y * .05, p[2] + Math.sin(a) * r]; stems.push(needle("非洲芙蓉花球中每朵小花的独立放射柄", green, p, q, .0018)); flowers.push(petals(5, q, .007, .015, 90, flowerColor)); }
    parts.push(combineMeshes("非洲芙蓉球形花伞的完整放射花柄", green, stems));
    for (let offset = 0; offset < flowers.length; offset += 8) parts.push(combineMeshes("非洲芙蓉花球中真实分离的五瓣小花", flowerColor, flowers.slice(offset, offset + 8)));
  }
  return parts;
}

function parasolTree(): ModelPart[] {
  const { parts, tips } = forestCrown(17.2, 5.1, .25, .24, "palm");
  for (const tip of tips) {
    const stalks: ModelPart[] = [], seeds: ModelPart[] = [];
    for (let follicle = 0; follicle < 3; follicle++) {
      const a = follicle * Math.PI * 2 / 3, p: Triple = [tip[0] + Math.cos(a) * .04, tip[1] - .025, tip[2] + Math.sin(a) * .04]; stalks.push(needle("青桐纸质果瓣各自连接果序的短柄", bark, tip, p, .003));
      parts.push(part("青桐真实内凹的薄纸质船形果瓣", "lathe", fruitColor, p, [.6, 1, 1.9], [0, -a * 180 / Math.PI, 0], { profile: [{ x: 0, y: 0 }, { x: .025, y: .023 }, { x: .024, y: .025 }, { x: .007, y: .002 }, { x: 0, y: .002 }] }));
      for (const side of [-1, 1]) { const q: Triple = [p[0] + Math.cos(a) * .0075 - Math.sin(a) * side * .0411, p[1] + .024, p[2] + Math.sin(a) * .0075 + Math.cos(a) * side * .0411]; seeds.push(lobe("青桐沿船状果瓣边缘着生的独立圆种子", "#93927b", q, [.0075, .0075, .0075])); }
    }
    parts.push(combineMeshes("青桐开放纸船果序的真实分枝柄", bark, stalks), combineMeshes("青桐真实着生在薄果瓣边缘的圆种子", "#93927b", seeds));
  }
  return parts;
}

function karayaTree(): ModelPart[] {
  const { parts, tips } = forestCrown(14.2, 4.3, .17, .18, "palm");
  parts[0]!.color = "#c9c7af";
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .03, tip[2]], seeds: ModelPart[] = [], stalks: ModelPart[] = [];
    parts.push(needle("白皮苹婆粗厚五室聚合果的短果柄", bark, tip, p, .005));
    for (let follicle = 0; follicle < 3; follicle++) { const a = follicle * Math.PI * 2 / 3, q: Triple = [p[0] + Math.cos(a) * .025, p[1], p[2] + Math.sin(a) * .025]; stalks.push(needle("白皮苹婆聚合果基部分出并接到每个果瓣的短轴", bark, p, q, .004)); parts.push(part("白皮苹婆有真实厚壁与开放腔室的粗舟形果瓣", "lathe", "#b29a85", q, [.75, 1.1, 1.5], [0, -a * 180 / Math.PI, 0], { profile: [{ x: 0, y: 0 }, { x: .026, y: .032 }, { x: .022, y: .035 }, { x: .006, y: .007 }, { x: 0, y: .007 }] })); seeds.push(lobe("白皮苹婆开放果腔里各自独立的黑色种子", "#7c8474", [q[0], q[1] + .016, q[2]], [.012, .016, .022])); }
    parts.push(combineMeshes("白皮苹婆完整聚合果的全部分轴", bark, stalks), combineMeshes("白皮苹婆开放果腔中的真实独立种子", "#7c8474", seeds));
  }
  return parts;
}

function gnemon(): ModelPart[] {
  const parts: ModelPart[] = [tapered("灌状买麻藤有明显水平节痕的直立乔木干", bark, [[0, 0, 0], [0, 9, 0], [.015, 17.5, 0]], [.31, .19, .01])], tips: Triple[] = [];
  for (let tier = 0; tier < 4; tier++) for (let axis = 0; axis < 2; axis++) {
    const a = axis * Math.PI + tier * 1.3, root: Triple = [0, 5 + tier * 2.5, 0], end: Triple = [Math.cos(a) * (2.3 - tier * .35), 6.5 + tier * 2.6, Math.sin(a) * (2.3 - tier * .35)]; tips.push(end);
    parts.push(tapered("灌状买麻藤构成窄圆柱冠的短对生枝", bark, [root, end], [.08 - tier * .012, .003]), ...leafyShoot(mix(root, end, .66), end, .14, .065, "oval", true));
    const axisTop: Triple = [end[0], end[1] + .1, end[2]], seeds: ModelPart[] = [], stems: ModelPart[] = [];
    parts.push(needle("灌状买麻藤叶腋雌球花形成的长种子穗轴", green, end, axisTop, .004));
    for (let node = 0; node < 2; node++) for (let seed = 0; seed < 5; seed++) { const b = seed * Math.PI * 2 / 5, base = mix(end, axisTop, .35 + node * .45), p: Triple = [base[0] + Math.cos(b) * .018, base[1], base[2] + Math.sin(b) * .018]; stems.push(needle("买麻藤种子轮节上逐枚相接的短柄", bark, base, p, .002)); seeds.push(lobe("买麻藤有肉质外种皮的独立长椭圆裸子", fruitColor, p, [.018, .03, .018])); }
    parts.push(combineMeshes("买麻藤雌株每节一轮的完整种子短柄", bark, stems), combineMeshes("买麻藤真轮生肉质裸子而非被子浆果", fruitColor, seeds));
  }
  for (let tier = 0; tier < 3; tier++) parts.push(canopy(tips.slice(tier * 2, tier * 2 + 4), 1.9 - tier * .35, 1.8));
  for (const y of [3, 8, 13]) { const r = y < 9 ? .31 - .12 * y / 9 : .19 - .18 * (y - 9) / 8.5; parts.push(part("买麻藤主干与真实干径一致的环形节痕", "lathe", "#b4aa8d", [y < 9 ? 0 : (y - 9) / 8.5 * .015, y, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: r - .003, y: 0 }, { x: r + .004, y: 0 }, { x: r + .003, y: .025 }, { x: r - .003, y: .025 }, { x: r - .003, y: 0 }] })); }
  return parts;
}

function kurrajong(): ModelPart[] {
  const threeLobed: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.2, .16], [-.5, .45], [-.16, .39], [0, 1], [.16, .39], [.5, .45], [.2, .16]], { parts, tips } = forestCrown(13.8, 4.1, .105, .075, "heart");
  for (const tip of tips) {
    parts.push(...leafyShoot(tip, [tip[0] + .18, tip[1] + .13, tip[2]], .12, .085, threeLobed));
    const p: Triple = [tip[0], tip[1] - .03, tip[2]]; parts.push(needle("异叶瓶木深色木质蓇葖的独立短柄", bark, tip, p, .003), part("异叶瓶木成熟开放而真实中空的椭圆舟形荚", "lathe", "#8d8b72", p, [.65, 1, 1.6], [0, 20, 0], { profile: [{ x: 0, y: 0 }, { x: .007, y: 0 }, { x: .026, y: .028 }, { x: .023, y: .032 }, { x: .006, y: .004 }, { x: 0, y: .004 }] }));
  }
  return parts;
}

function antTree(): ModelPart[] {
  const { parts, tips } = forestCrown(25.5, 5.4, .22, .085, "oval");
  for (const tip of tips) {
    const axis: Triple = [tip[0], tip[1] + .28, tip[2]], fruits: ModelPart[] = [], stalks: ModelPart[] = [];
    parts.push(needle("美洲三翅树竖立在枝端的长穗轴", bark, tip, axis, .004));
    for (let nut = 0; nut < 8; nut++) {
      const b = nut * 2.4, base = mix(tip, axis, .12 + nut * .105), p: Triple = [base[0] + Math.cos(b) * .025, base[1], base[2] + Math.sin(b) * .025]; stalks.push(needle("美洲三翅树每枚翅果与总轴相接的短柄", bark, base, p, .0015)); fruits.push(lobe("美洲三翅树三翅花被内的真实小瘦果", fruitColor, p, [.006, .009, .006]));
      for (let wing = 0; wing < 3; wing++) { const a = wing * Math.PI * 2 / 3 + b; fruits.push(flatLeaf("美洲三翅树由宿存花被形成的三片等长薄纵翅", p, [p[0] + Math.cos(a) * .016, p[1] + .028, p[2] + Math.sin(a) * .016], .012, "oval", .001)); }
    }
    parts.push(combineMeshes("美洲三翅树穗中全部翅果的分离柄", bark, stalks), combineMeshes("美洲三翅树每枚真实三翅小瘦果的完整果穗", flowerColor, fruits));
  }
  return parts;
}

function obeche(): ModelPart[] {
  const { parts, tips } = forestCrown(39, 8.7, .18, .2, "palm"); parts.push(...buttresses(1.45, 5.4, 6));
  for (const tip of tips) {
    const wings: ModelPart[] = [], stalks: ModelPart[] = [];
    for (let carpel = 0; carpel < 5; carpel++) { const a = carpel * Math.PI * 2 / 5, p: Triple = [tip[0] + Math.cos(a) * .016, tip[1] - .025, tip[2] + Math.sin(a) * .016]; stalks.push(needle("非洲梧桐同一聚合果中各心皮独立的连接", bark, tip, p, .002)); wings.push(lobe("非洲梧桐长翅近基部的膨大独立种室", fruitColor, p, [.009, .014, .009]), flatLeaf("非洲梧桐每枚独立心皮自带一片长纸翅", p, [p[0] + Math.cos(a) * .025, p[1] - .055, p[2] + Math.sin(a) * .025], .018, "obovate", .001)); }
    parts.push(combineMeshes("非洲梧桐最多五心皮聚合的真实短果柄", bark, stalks), combineMeshes("非洲梧桐五枚独立单翅果构成的聚合果", fruitColor, wings));
  }
  return parts;
}

function tetrameles(): ModelPart[] {
  const toothedHeart: Parameters<typeof flatLeaf>[4] = [[0, .08], [-.25, -.04], [-.48, .14], [-.34, .29], [-.5, .42], [-.3, .54], [-.34, .67], [0, 1], [.34, .67], [.3, .54], [.5, .42], [.34, .29], [.48, .14], [.25, -.04]];
  const { parts, tips } = forestCrown(42, 9.2, .17, .15, toothedHeart); parts.push(...buttresses(1.8, 6.5, 8.5));
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stems: ModelPart[] = [], end: Triple = [tip[0], tip[1] - .18, tip[2]]; parts.push(needle("四数木枝端下垂的细长果序总轴", bark, tip, end, .003));
    for (let fruit = 0; fruit < 15; fruit++) { const a = fruit * 2.4, base = mix(tip, end, (fruit + 1) / 16), p: Triple = [base[0] + Math.cos(a) * .016, base[1], base[2] + Math.sin(a) * .016]; stems.push(needle("四数木总序轴到每个小蒴果的短柄", bark, base, p, .001)); fruits.push(lobe("四数木果穗中真实分离的四室小蒴果", fruitColor, p, [.0045, .006, .0045])); }
    parts.push(combineMeshes("四数木完整果穗的分枝细柄", bark, stems), combineMeshes("四数木巨大板根树冠上的小蒴果穗", fruitColor, fruits));
  }
  return parts;
}

function erima(): ModelPart[] {
  const parts: ModelPart[] = [tapered("八数木高耸而上部圆整的直立主干", bark, [[0, 0, 0], [0, 22, 0], [.04, 44, 0]], [.95, .52, .02])], tips: Triple[] = [], flutes: ModelPart[] = [];
  parts.push(...buttresses(.95, 3.6, 2.8));
  for (let flute = 0; flute < 8; flute++) { const a = flute * Math.PI / 4; flutes.push(tapered("八数木由板根连续上延的纵向窄沟脊", bark, [[Math.cos(a) * .85, .1, Math.sin(a) * .85], [Math.cos(a) * .75, 6, Math.sin(a) * .75], [Math.cos(a) * .55, 13, Math.sin(a) * .55]], [.18, .13, .015])); }
  parts.push(combineMeshes("八数木粗干连续而不悬空的八道纵沟棱", bark, flutes));
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 21 + axis * 1.1, 0], end: Triple = [Math.cos(a) * 7.5, 37 + axis % 3 * 2.1, Math.sin(a) * 7.5]; tips.push(end); parts.push(tapered("八数木宽展冠层中的大型木质骨枝", bark, [root, end], [.41, .008]));
    const leaves: ModelPart[] = [], petioles: ModelPart[] = [];
    for (let node = 0; node < 7; node++) { const p = mix(root, end, .68 + node * .044), b = a + node * 2.4, q: Triple = [p[0] + Math.cos(b) * .19, p[1] + .07, p[2] + Math.sin(b) * .19]; petioles.push(needle("八数木宽心卵单叶真实十五至三十厘米长叶柄", green, p, q, .004)); leaves.push(flatLeaf("八数木螺旋排列且不分裂的宽心卵叶片", q, [q[0] + Math.cos(b) * .23, q[1] + .05, q[2] + Math.sin(b) * .23], .18, "heart")); }
    const p: Triple = [end[0], end[1] - .22, end[2]], capsules: ModelPart[] = []; parts.push(needle("八数木叶腋向下延伸的简单果序轴", bark, end, p, .003));
    for (let fruit = 0; fruit < 18; fruit++) { const b = fruit * 2.4, base = mix(end, p, (fruit + 1) / 19); capsules.push(lobe("八数木直接附着果轴的八数小蒴果", fruitColor, [base[0] + Math.cos(b) * .005, base[1], base[2] + Math.sin(b) * .005], [.006, .011, .006])); }
    parts.push(combineMeshes("八数木全部真实长柄单叶的叶柄", green, petioles), combineMeshes("八数木与四数木不同的螺旋全缘大叶", green, leaves), combineMeshes("八数木一整串直接附轴的微小蒴果", fruitColor, capsules));
  }
  parts.push(canopy(tips, 7.7, 5.8));
  return parts;
}

function blackBeanTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("澳大利亚栗长卵密冠以下的直立木质干", bark, [[0, 0, 0], [.04, 10, 0], [0, 23, 0]], [.52, .27, .012])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 9 + axis * .55, 0], end: Triple = [Math.cos(a) * 4.2, 19.2 + axis % 3 * 1.2, Math.sin(a) * 4.2]; tips.push(end); parts.push(tapered("澳大利亚栗真羽叶枝和粗木荚的木质冠枝", bark, [root, end], [.21, .006]));
    for (let node = 0; node < 2; node++) {
      const p = mix(root, end, .8 + node * .16), b = a + (node ? .7 : -.7), q: Triple = [p[0] + Math.cos(b) * .34, p[1] + .05, p[2] + Math.sin(b) * .34], leaves: ModelPart[] = [needle("澳大利亚栗一片奇数羽叶的长叶轴", green, p, q, .003)];
      for (let blade = 0; blade < 8; blade++) { const c = b + (blade % 2 ? 1.1 : -1.1), base = mix(p, q, (blade + 1) / 10); leaves.push(flatLeaf("澳大利亚栗沿共同叶轴错位互生的全缘小叶", base, [base[0] + Math.cos(c) * .11, base[1] + .018, base[2] + Math.sin(c) * .11], .043)); }
      leaves.push(flatLeaf("澳大利亚栗羽叶末端单独的全缘小叶", q, [q[0] + Math.cos(b) * .1, q[1] + .015, q[2] + Math.sin(b) * .1], .04)); parts.push(combineMeshes("澳大利亚栗真实互生九小叶的奇数羽叶", green, leaves));
    }
    const p: Triple = [end[0], end[1] - .025, end[2]]; parts.push(needle("澳大利亚栗长圆木荚的真实粗果柄", bark, end, p, .004), part("澳大利亚栗含三至五种室的粗长圆柱木荚", "lathe", fruitColor, [p[0], p[1] - .22, p[2]], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .022, y: .014 }, { x: .026, y: .07 }, { x: .024, y: .18 }, { x: .013, y: .215 }, { x: 0, y: .22 }] }));
  }
  parts.push(canopy(tips, 4.3, 4.5));
  return parts;
}

function pinkCedar(): ModelPart[] {
  const parts: ModelPart[] = [tapered("顶果木直立高耸而下部少枝的完整主干", bark, [[0, 0, 0], [0, 20, 0], [.02, 36, 0]], [.92, .51, .018])], tips: Triple[] = [];
  parts.push(...buttresses(.92, 3.1, 3.8));
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 18 + axis * 1.1, 0], end: Triple = [Math.cos(a) * 7, 30 + axis % 3 * 1.7, Math.sin(a) * 7]; tips.push(end); parts.push(tapered("顶果木上部承托大型二回羽叶的冠枝", bark, [root, end], [.38, .008]), largeBipinnateLeaf(mix(root, end, .86), a + .5));
    const top: Triple = [end[0], end[1] + .35, end[2]], filaments: ModelPart[] = [], corollas: ModelPart[] = []; parts.push(needle("顶果木密集柱状花序的直立总轴", bark, end, top, .005));
    for (let flower = 0; flower < 10; flower++) { const b = flower * 2.4, base = mix(end, top, .08 + flower * .084), p: Triple = [base[0] + Math.cos(b) * .015, base[1], base[2] + Math.sin(b) * .015]; corollas.push(needle("顶果木每朵花短柄", green, base, p, .0015), petals(5, p, .002, .009, 86, pale)); for (let stamen = 0; stamen < 5; stamen++) { const c = b + stamen * Math.PI * 2 / 5; filaments.push(needle("顶果木每朵花中五条明显伸出的长雄蕊", flowerColor, p, [p[0] + Math.cos(c) * .018, p[1] + .012, p[2] + Math.sin(c) * .018], .0008)); } }
    for (let offset = 0; offset < corollas.length; offset += 10) parts.push(combineMeshes("顶果木完整花穗中的独立五瓣小花", pale, corollas.slice(offset, offset + 10)));
    parts.push(combineMeshes("顶果木一整穗真正独立的五数长雄蕊", flowerColor, filaments));
  }
  parts.push(canopy(tips, 6.8, 5.1));
  return parts;
}

function scarletFlame(): ModelPart[] {
  const { parts, tips } = featherCrown(11.5, 4.2, .42, 5, false, false, 2, "oval"); parts.push(canopy(tips, 4.2, 3.5));
  for (let cluster = 0; cluster < 4; cluster++) {
    const a = cluster * 2.4, base: Triple = [Math.cos(a) * .4, 2.8 + cluster * .7, Math.sin(a) * .4], flowers: ModelPart[] = [], stalks: ModelPart[] = [], stamens: ModelPart[] = [];
    parts.push(needle("绣球树老木上直接生出的团花粗短花序柄", bark, [0, base[1], 0], base, .018));
    for (let flower = 0; flower < 14; flower++) { const b = flower * 2.4, y = -.65 + flower / 13 * 1.5, r = Math.sqrt(1 - y * y) * .085, p: Triple = [base[0] + Math.cos(b) * r, base[1] + y * .07, base[2] + Math.sin(b) * r]; stalks.push(needle("绣球树圆头花序内逐朵辐射的短花柄", green, base, p, .002)); flowers.push(petals(5, p, .009, .021, 88, flowerColor)); for (let stamen = 0; stamen < 5; stamen++) { const c = b + stamen * Math.PI * 2 / 5; stamens.push(needle("绣球树小花超过花瓣的细长外露雄蕊", pale, p, [p[0] + Math.cos(c) * .017, p[1] + .027, p[2] + Math.sin(c) * .017], .0008)); } }
    parts.push(combineMeshes("绣球树老木生花球全部分枝花柄", green, stalks), combineMeshes("绣球树一整团真实伸出的长雄蕊", pale, stamens));
    for (let offset = 0; offset < flowers.length; offset += 8) parts.push(combineMeshes("绣球树花团中真实分开的五瓣花冠", flowerColor, flowers.slice(offset, offset + 8)));
  }
  return parts;
}

function prideOfBurma(): ModelPart[] {
  const { parts, tips } = featherCrown(14, 4.8, .4, 6, false, false, 2, "oval"); parts.push(canopy(tips, 4.8, 3.7));
  for (const tip of tips) {
    const end: Triple = [tip[0], tip[1] - .65, tip[2]], sepals: ModelPart[] = [], petalsGroup: ModelPart[] = [], filaments: ModelPart[] = [];
    parts.push(tapered("缅花枝端自然下垂六十五厘米的总状花序轴", flowerColor, [tip, end], [.005, .002]));
    for (let flower = 0; flower < 4; flower++) {
      const b = flower * 2.4, base = mix(tip, end, .22 + flower * .21), p: Triple = [base[0] + Math.cos(b) * .055, base[1] - .02, base[2] + Math.sin(b) * .055]; sepals.push(needle("缅花长总状花序上的独立红花柄", flowerColor, base, p, .002));
      for (let sepal = 0; sepal < 4; sepal++) sepals.push(leaf("缅花四片细长花瓣状花萼", flowerColor, p, .009, .04, [75, sepal * 90, 0], "YXZ"));
      petalsGroup.push(leaf("缅花一朵花中最大的宽扇形上瓣", flowerColor, p, .045, .042, [45, 90 - b * 180 / Math.PI, 0], "YXZ"));
      for (const side of [-1, 1]) { petalsGroup.push(leaf("缅花上瓣旁两枚较狭的匙形侧瓣", flowerColor, p, .018, .033, [75, 90 - b * 180 / Math.PI + side * 60, 0], "YXZ"), leaf("缅花下方两片实际仅两毫米长的退化花瓣", pale, p, .001, .002, [100, 90 - b * 180 / Math.PI + 180 + side * 65, 0], "YXZ")); }
      for (let stamen = 0; stamen < 10; stamen++) { const c = b + stamen * Math.PI / 5, length = stamen % 2 ? .009 : .04; filaments.push(needle("缅花十条长短明显不同的真实雄蕊游离端", pale, p, [p[0] + Math.cos(c) * length, p[1] - length * .35, p[2] + Math.sin(c) * length], .0007)); }
    }
    parts.push(combineMeshes("缅花长垂总状花序的花柄与四片萼", flowerColor, sepals), combineMeshes("缅花具有一个扇瓣两侧瓣两退化瓣的花冠", flowerColor, petalsGroup), combineMeshes("缅花同穗小花十数长短雄蕊", pale, filaments));
  }
  return parts;
}

function sorrowlessTree(): ModelPart[] {
  const { parts, tips } = featherCrown(15.2, 4.7, .46, 4, false, false, 2, "oval"); parts.push(canopy(tips, 4.7, 3.8));
  for (const tip of tips) {
    const sepals: ModelPart[] = [], stamens: ModelPart[] = [], stalks: ModelPart[] = [];
    for (let flower = 0; flower < 10; flower++) { const a = flower * 2.4, r = Math.sqrt(flower / 10) * .055, p: Triple = [tip[0] + Math.cos(a) * r, tip[1] + .04 + flower % 2 * .008, tip[2] + Math.sin(a) * r]; stalks.push(needle("无忧花平顶伞房花簇中单独花柄", bark, tip, p, .0018)); for (let sepal = 0; sepal < 4; sepal++) sepals.push(leaf("无忧花没有花瓣而由四萼构成的显著花被", flowerColor, p, .004, .009, [78, sepal * 90, 0], "YXZ")); for (let stamen = 0; stamen < 7; stamen++) { const b = stamen * Math.PI * 2 / 7; stamens.push(needle("无忧花每朵花七条真实突出的长雄蕊", pale, p, [p[0] + Math.cos(b) * .01, p[1] + .018, p[2] + Math.sin(b) * .01], .0007)); } }
    parts.push(combineMeshes("无忧花平顶花簇中各自相连的花柄", bark, stalks), combineMeshes("无忧花四萼而无花瓣的完整平顶花序", flowerColor, sepals), combineMeshes("无忧花每花六至八条游离雄蕊的真实外露群", pale, stamens));
  }
  return parts;
}

function mastTree(): ModelPart[] {
  const waved: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.2, .14], [-.35, .3], [-.25, .42], [-.5, .58], [-.3, .7], [0, 1], [.3, .7], [.5, .58], [.25, .42], [.35, .3], [.2, .14]], parts: ModelPart[] = [tapered("长叶暗罗单轴向上延伸的直立细干", bark, [[0, 0, 0], [0, 9, 0], [.02, 21.5, 0]], [.31, .19, .008])], tips: Triple[] = [];
  for (let tier = 0; tier < 5; tier++) for (let axis = 0; axis < 2; axis++) {
    const a = tier * 1.4 + axis * Math.PI, root: Triple = [0, 5 + tier * 2.9, 0], middle: Triple = [Math.cos(a) * (1.7 - tier * .18), 5.3 + tier * 2.9, Math.sin(a) * (1.7 - tier * .18)], end: Triple = [middle[0] * 1.1, middle[1] - 1.7, middle[2] * 1.1]; tips.push(end);
    parts.push(tapered("长叶暗罗自然短侧枝转折下垂形成窄冠", bark, [root, middle, end], [.07 - tier * .008, .018, .002]));
    parts.push(...leafyShoot(branchPoint(root, middle, end, .64, .5), end, .2, .035, waved));
  }
  for (let tier = 0; tier < 4; tier++) parts.push(canopy(tips.slice(tier * 2, tier * 2 + 4), 1.65 - tier * .2, 2.1));
  return parts;
}

function champak(): ModelPart[] {
  const { parts, tips } = forestCrown(24, 5.6, .21, .07, "oval");
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] + .025, tip[2]], tepals: ModelPart[] = [];
    tepals.push(needle("黄兰浓香小花真实短粗的叶腋花梗", bark, tip, p, .003));
    for (let tepal = 0; tepal < 14; tepal++) { const a = tepal * 2.4, reach = tepal < 8 ? .026 : .015; tepals.push(flatLeaf("黄兰十余片细长披针形而非宽杯瓣的花被", p, [p[0] + Math.cos(a) * reach, p[1] + .045 - tepal % 3 * .004, p[2] + Math.sin(a) * reach], .0065, "oval", .001)); }
    parts.push(combineMeshes("黄兰一整朵具有多轮细长花被的花", flowerColor, tepals));
  }
  return parts;
}

// https://pza.sanbi.org/kigelia-africana
// https://www.gardensbythebay.com.sg/en/learn-with-us/explore-resources/whats-blooming/cuipo-cavanillesia-platanifolia.html
// https://www.nparks.gov.sg/FloraFaunaWeb/Flora/2/9/2942
// https://www.pngplants.org/PNGtrees/TreeDescriptions/Octomeles_sumatrana_Miq.html
// https://www.nparks.gov.sg/florafaunaweb/flora/2/7/2791
// https://www.biodiversity.bt/species/show/5544
// https://www.worldfloraonline.org/taxon/wfo-0000184535
// https://prosea.prota4u.org/view.aspx?id=2302
export const woodyExpansionBatchNineDesigns: MasterNatureDesign[] = [
  design("buttercupWholeTree", "黄绵木", "植物", buttercupTree, ["Cochlospermum religiosum", "掌裂单叶五瓣开放梨形蒴果与真实绵毛"]),
  design("shavingBrushWholeTree", "粉红绵木", "植物", shavingBrushTree, ["Pseudobombax ellipticum", "膨大绿灰干宽五掌复叶与长雄蕊梳刷花"]),
  design("cuipoWholeTree", "巨腹木", "植物", cuipo, ["Cavanillesia platanifolia", "高裸膨干分层轮枝大掌叶与五纵翅果"]),
  design("sausageWholeTree", "吊瓜树", "植物", sausageTree, ["Kigelia africana", "香肠树", "宽冠奇数羽叶长细果柄与巨大长圆柱果"]),
  design("pinkBallWholeTree", "非洲芙蓉", "植物", pinkBallTree, ["Dombeya wallichii", "大心锯齿单叶长柄悬挂五瓣球状花伞"]),
  design("parasolWholeTree", "青桐", "植物", parasolTree, ["Firmiana simplex", "梧桐", "掌裂单叶薄纸舟果瓣与缘生圆种子"]),
  design("karayaWholeTree", "白皮苹婆", "植物", karayaTree, ["Sterculia urens", "掌裂单叶白主干与厚舟形木质聚合果"]),
  design("gnemonWholeTree", "灌状买麻藤", "植物", gnemon, ["Gnetum gnemon", "直立乔木对生全缘大叶与轮生肉质裸子"]),
  design("kurrajongWholeTree", "异叶瓶木", "植物", kurrajong, ["Brachychiton populneus", "同株心叶与三裂叶真实共存及开放木舟荚"]),
  design("antWholeTree", "美洲三翅树", "植物", antTree, ["Triplaris americana", "大单叶顶穗状果序与每果三片宿存花被翅"]),
  design("obecheWholeTree", "非洲梧桐", "植物", obeche, ["Triplochiton scleroxylon", "巨大板根掌裂叶和五枚单翅心皮聚合果"]),
  design("tetramelesWholeTree", "四数木", "植物", tetrameles, ["Tetrameles nudiflora", "高大直干巨大板根锯齿心叶与小蒴果穗"]),
  design("erimaWholeTree", "八数木", "植物", erima, ["Octomeles sumatrana", "沟棱干低板根长柄螺旋全缘大叶与小蒴果"]),
  design("blackBeanWholeTree", "澳大利亚栗", "植物", blackBeanTree, ["Castanospermum australe", "互生小叶的真羽叶与粗圆长木荚"]),
  design("pinkCedarWholeTree", "顶果木", "植物", pinkCedar, ["Acrocarpus fraxinifolius", "高直板根大型二回羽叶及每花五长蕊柱状花穗"]),
  design("scarletFlameWholeTree", "绣球树", "植物", scarletFlame, ["Brownea grandiceps", "偶数羽叶老木生多花球与长外露雄蕊"]),
  design("prideOfBurmaWholeTree", "缅花", "植物", prideOfBurma, ["Amherstia nobilis", "偶数羽叶长垂总状花序与高度不等的五瓣"]),
  design("sorrowlessWholeTree", "无忧花", "植物", sorrowlessTree, ["Saraca indica", "偶数羽叶无花瓣四萼小花与七条外露雄蕊"]),
  design("mastWholeTree", "长叶暗罗", "植物", mastTree, ["Monoon longifolium", "Polyalthia longifolia", "窄冠真垂枝长披针波缘互生叶"]),
  design("champakWholeTree", "黄兰", "植物", champak, ["Magnolia champaca", "Michelia champaca", "黄玉兰", "互生长卵叶和十余片狭长多轮花被"]),
];
