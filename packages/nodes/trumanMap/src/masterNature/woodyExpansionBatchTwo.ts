import { combineMeshes, design, leaf, lobe, needle, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { branchPoint, crown, leafyShoot } from "./woodyExpansionBatchOne";

const bark = "#9a8f76";
const green = "#81966e";
const pale = "#bbc5a0";
const fruitColor = "#b5a57f";
type LeafForm = Parameters<typeof flatLeaf>[4];
const toothed: LeafForm = [[0, 0], [-.32, .16], [-.26, .23], [-.49, .37], [-.37, .44], [-.47, .6], [-.3, .67], [-.32, .78], [0, 1], [.32, .78], [.3, .67], [.47, .6], [.37, .44], [.49, .37], [.26, .23], [.32, .16]];

function mix(a: Triple, b: Triple, t: number): Triple { return a.map((value, axis) => value + (b[axis]! - value) * t) as Triple; }

export function featherCrown(height: number, span: number, length: number, pairs: number, lobed = false, terminal = true, nodes = 3, form?: Parameters<typeof flatLeaf>[4]): { parts: ModelPart[]; tips: Triple[] } {
  const parts: ModelPart[] = [tapered("羽叶木本从地表起的完整主干", bark, [[0, 0, 0], [.02, height * .58, 0], [0, height, .015]], [height * .035, height * .025, .012])];
  const tips: Triple[] = [];
  for (let branch = 0; branch < 6; branch++) {
    const angle = branch * 2.4, root: Triple = [0, height * (.35 + branch * .06), 0], end: Triple = [Math.cos(angle) * span, height * (.72 + branch % 3 * .1), Math.sin(angle) * span];
    const middle: Triple = [end[0] * .63, end[1] - .25, end[2] * .63];
    parts.push(tapered("真实支承复叶与果序的木质枝", bark, [root, middle, end], [height * .016, .025, .005]));
    for (let node = 0; node < nodes; node++) {
      const origin = branchPoint(root, middle, end, .45 + node * .16, .63), a = angle + (node % 2 ? 1.05 : -1.05), tip: Triple = [origin[0] + Math.cos(a) * length, origin[1] + length * .15, origin[2] + Math.sin(a) * length], pieces: ModelPart[] = [needle("完整羽状复叶的共同叶轴", green, origin, tip, .0025)];
      for (let pair = 0; pair < pairs; pair++) for (const side of [-1, 1]) {
        const p = mix(origin, tip, (pair + 1) / (pairs + .8)), b = a + side * 1.2;
        pieces.push(flatLeaf("羽状复叶上成对相接的小叶", p, [p[0] + Math.cos(b) * length * .28, p[1] + .02, p[2] + Math.sin(b) * length * .28], length * (lobed ? .14 : .1), form ?? (lobed ? "lobed" : [[0, 0], [-.25, .15], [-.5, .35], [-.35, .45], [-.45, .63], [0, 1], [.45, .63], [.35, .45], [.5, .35], [.25, .15]])));
      }
      if (terminal) pieces.push(flatLeaf("奇数羽状复叶独立的顶生小叶", mix(origin, tip, .9), [tip[0] + Math.cos(a) * length * .17, tip[1] + .015, tip[2] + Math.sin(a) * length * .17], length * .1, form ?? (lobed ? "lobed" : "oval")));
      parts.push(combineMeshes(terminal ? "一片完整奇数羽状复叶" : "一片没有顶生小叶的偶数羽状复叶", green, pieces));
    }
    tips.push(end);
  }
  return { parts, tips };
}

function stalk(from: Triple, to: Triple, width = .003): ModelPart { return tapered("连接枝干与独立果体的果梗", bark, [from, to], [width, width * .6]); }

function hazel(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let axis = 0; axis < 5; axis++) {
    const a = axis * 2.4, end: Triple = [Math.cos(a) * .8, 2.7 + axis % 2 * .35, Math.sin(a) * .8];
    const stemRoot: Triple = [Math.cos(a) * .09, 0, Math.sin(a) * .09], middle: Triple = [end[0] * .4, 1.3, end[2] * .4];
    parts.push(tapered("榛树根部萌出的独立木质干", bark, [stemRoot, middle, end], [.075, .04, .006]));
    for (let node = 0; node < 3; node++) { const p = branchPoint(stemRoot, middle, end, .5 + node * .2, .4), q: Triple = [p[0] + Math.cos(a + .8) * .35, p[1] + .15, p[2] + Math.sin(a + .8) * .35]; parts.push(...leafyShoot(p, q, .11, .1, toothed)); }
    const nuts: ModelPart[] = [], bracts: ModelPart[] = [];
    for (let index = 0; index < 3; index++) { const b = index * Math.PI * 2 / 3, p: Triple = [end[0] + Math.cos(b) * .022, end[1] - .033, end[2] + Math.sin(b) * .022]; nuts.push(lobe("短枝头成簇的卵圆榛坚果", fruitColor, p, [.022, .03, .022])); for (let side = 0; side < 3; side++) { const c = side * Math.PI * 2 / 3; bracts.push(flatLeaf("榛果外包的具裂齿叶状总苞", [p[0], p[1] - .012, p[2]], [p[0] + Math.cos(c) * .022, p[1] + .025, p[2] + Math.sin(c) * .022], .018, "lobed")); } }
    parts.push(combineMeshes("一簇独立的榛坚果", fruitColor, nuts), combineMeshes("与榛果相连的完整裂齿总苞", green, bracts));
  }
  return parts;
}

function almond(): ModelPart[] {
  const { parts, tips } = crown(3.8, 1.3, .12, .027, toothed);
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .07, tip[2]], shell: ModelPart[] = [];
    parts.push(stalk(tip, p), lobe("扁桃果内的扁长坚硬果核", fruitColor, p, [.024, .047, .016]));
    for (const side of [-1, 1]) shell.push(flatLeaf("沿纵缝张开的绒毛外果皮半壳", [p[0] + side * .005, p[1] - .02, p[2]], [p[0] + side * .02, p[1] + .025, p[2]], .028, "oval"));
    parts.push(combineMeshes("扁桃与果核相连的两片开裂外果皮", pale, shell));
  }
  return parts;
}

function pistachio(): ModelPart[] {
  const parts: ModelPart[] = [tapered("开心果低分枝粗壮主干", bark, [[0, 0, 0], [.05, 1.3, .01], [0, 3.7, 0]], [.2, .14, .025])];
  for (let axis = 0; axis < 5; axis++) {
    const a = axis * 2.4, root: Triple = [0, 1.3 + axis * .16, 0], p: Triple = [Math.cos(a) * 1.1, 3.1 + axis % 2 * .35, Math.sin(a) * 1.1];
    parts.push(tapered("开心果向外开展的结果枝", bark, [root, p], [.065, .005]));
    for (let node = 0; node < 4; node++) {
      const base = mix(root, p, .5 + node * .15), b = a + (node % 2 ? .9 : -.9), end: Triple = [base[0] + Math.cos(b) * .19, base[1] + .035, base[2] + Math.sin(b) * .19], pieces: ModelPart[] = [needle("开心果三小叶的共同叶轴", green, base, end, .003)];
      pieces.push(flatLeaf("开心果较大的圆卵形顶生小叶", end, [end[0] + Math.cos(b) * .1, end[1] + .02, end[2] + Math.sin(b) * .1], .07));
      for (const side of [-1, 1]) { const q = mix(base, end, .65), c = b + side * 1.2; pieces.push(flatLeaf("开心果一对侧生圆卵小叶", q, [q[0] + Math.cos(c) * .075, q[1] + .015, q[2] + Math.sin(c) * .075], .055)); }
      parts.push(combineMeshes("一片完整开心果三小叶复叶", green, pieces));
    }
    const fruits: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 10; index++) { const b = index * 2.4, q: Triple = [p[0] + Math.cos(b) * .05, p[1] - .04 - index % 4 * .025, p[2] + Math.sin(b) * .05]; fruits.push(lobe("开心果圆锥果序中的卵形核果", fruitColor, q, [.017, .025, .016])); stems.push(needle("果序上分离的细果梗", bark, p, q, .002)); }
    parts.push(combineMeshes("开心果完整分叉果梗", bark, stems), combineMeshes("开心果一簇独立核果", fruitColor, fruits));
  }
  return parts;
}

function pecan(): ModelPart[] {
  const { parts, tips } = featherCrown(6.8, 1.65, .6, 6);
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 3; index++) { const p: Triple = [tip[0] + (index - 1) * .036, tip[1] - .09, tip[2]]; stems.push(needle("山核桃顶生果簇的细梗", bark, tip, p, .003)); fruits.push(lobe("薄壳山核桃完整长椭圆外果皮", pale, p, [.031, .059, .03])); for (let side = 0; side < 4; side++) { const a = side * Math.PI / 2; fruits.push(needle("山核桃青果纵向四瓣合缝", "#99a27b", [p[0] + Math.cos(a) * .012, p[1] - .023, p[2] + Math.sin(a) * .012], [p[0] + Math.cos(a) * .012, p[1] + .023, p[2] + Math.sin(a) * .012], .0015)); } }
    parts.push(combineMeshes("薄壳山核桃果簇的完整梗", bark, stems), combineMeshes("有真实纵缝的薄壳山核桃果簇", pale, fruits));
  }
  return parts;
}

function tung(): ModelPart[] {
  const { parts, tips } = crown(5, 1.55, .23, .2, "palm");
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .08, tip[2]], lobes: ModelPart[] = [];
    parts.push(stalk(tip, p));
    for (let side = 0; side < 5; side++) { const a = side * Math.PI * 2 / 5; lobes.push(lobe("油桐果实五室凸起的外果壁", pale, [p[0] + Math.cos(a) * .017, p[1], p[2] + Math.sin(a) * .017], [.038, .066, .038])); }
    parts.push(combineMeshes("整枚五室油桐果", pale, lobes));
  }
  return parts;
}

function soapnut(): ModelPart[] {
  const { parts, tips } = featherCrown(6.1, 1.5, .46, 4, false, false);
  for (const p of tips) {
    const fruits: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 14; index++) { const a = index * 2.4, q: Triple = [p[0] + Math.cos(a) * .07, p[1] - .035 - index % 5 * .035, p[2] + Math.sin(a) * .07]; fruits.push(lobe("无患子薄肉质球形核果", fruitColor, q, [.022, .023, .022])); stems.push(needle("无患子圆锥果序细分梗", bark, p, q, .002)); }
    parts.push(combineMeshes("无患子冠顶圆锥果序的果梗", bark, stems), combineMeshes("无患子逐枚分离的小圆果", fruitColor, fruits));
  }
  return parts;
}

function goldenRainTree(): ModelPart[] {
  const { parts, tips } = featherCrown(5.3, 1.5, .43, 3, true, true, 3);
  for (const tip of tips) for (let fruit = 0; fruit < 3; fruit++) {
    const p: Triple = [tip[0] + (fruit - 1) * .035, tip[1] - .09 - fruit % 2 * .04, tip[2]], valves: ModelPart[] = [];
    for (let side = 0; side < 3; side++) { const a = side * Math.PI * 2 / 3; valves.push(flatLeaf("栾树三片独立的纸质膨大果瓣", [p[0], p[1] - .024, p[2]], [p[0] + Math.cos(a) * .024, p[1] + .031, p[2] + Math.sin(a) * .024], .032, "oval")); }
    parts.push(stalk(tip, [p[0], p[1] + .03, p[2]]), combineMeshes("有实际三面薄瓣的灯笼状栾树果", fruitColor, valves));
  }
  return parts;
}

function eucommia(): ModelPart[] {
  const { parts, tips } = crown(5.9, 1.4, .13, .065, toothed);
  for (const tip of tips) {
    const wings: ModelPart[] = [], seeds: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 7; index++) { const p: Triple = [tip[0] + (index - 3) * .012, tip[1] - .055 - index % 2 * .015, tip[2]], end: Triple = [p[0], p[1] - .035, p[2]]; wings.push(flatLeaf("杜仲狭长椭圆翅果的完整薄翅", p, end, .013)); seeds.push(lobe("位于杜仲翅果中部的长种核", bark, [p[0], p[1] - .016, p[2]], [.004, .018, .004])); stems.push(needle("翅果与木枝相接的短梗", bark, tip, p, .0015)); }
    parts.push(combineMeshes("一枝杜仲翅果的果梗", bark, stems), combineMeshes("杜仲成簇狭长薄翅", pale, wings), combineMeshes("杜仲翅果中央独立种核", bark, seeds));
  }
  return parts;
}

function wheelWingnut(): ModelPart[] {
  const { parts, tips } = featherCrown(6.6, 1.65, .52, 4);
  for (const tip of tips) {
    const wings: ModelPart[] = [], seeds: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 6; index++) {
      const p: Triple = [tip[0] + Math.sin(index * .6) * .025, tip[1] - .05 - index * .045, tip[2]];
      wings.push(polygon("青钱柳种核周围一整圈圆盘状翅", pale, Array.from({ length: 12 }, (_, i) => [Math.cos(i * Math.PI / 6) * .023, Math.sin(i * Math.PI / 6) * .023]), .0015, p));
      seeds.push(lobe("青钱柳圆盘果翅中央的突起坚果", bark, p, [.007, .01, .007]));
      stems.push(needle("贯串下垂青钱柳果序的果轴", bark, index ? [tip[0] + Math.sin((index - 1) * .6) * .025, tip[1] - .05 - (index - 1) * .045, tip[2]] : tip, p, .002));
    }
    parts.push(combineMeshes("完整下垂的青钱柳果序轴", bark, stems), combineMeshes("完整圆盘状青钱柳果翅", pale, wings), combineMeshes("圆盘果翅中央全部坚果", bark, seeds));
  }
  return parts;
}

function toona(): ModelPart[] {
  const { parts, tips } = featherCrown(6.2, 1.45, .72, 6, false, false);
  for (const tip of tips) {
    const capsules: ModelPart[] = [], stalks: ModelPart[] = [];
    for (let fruit = 0; fruit < 3; fruit++) {
      const p: Triple = [tip[0] + Math.cos(fruit * 2.4) * .045, tip[1] + .04 + fruit % 3 * .035, tip[2] + Math.sin(fruit * 2.4) * .045];
      stalks.push(needle("香椿顶端直立圆锥果序细分轴", bark, tip, p, .002));
      for (let valve = 0; valve < 5; valve++) { const a = valve * Math.PI * 2 / 5; capsules.push(flatLeaf("香椿木质蒴果开放的五片果瓣", p, [p[0] + Math.cos(a) * .012, p[1] + .022, p[2] + Math.sin(a) * .012], .006)); }
    }
    parts.push(combineMeshes("香椿全部顶生果序分轴", bark, stalks), combineMeshes("香椿独立五瓣开裂蒴果", fruitColor, capsules));
  }
  return parts;
}

function ailanthus(): ModelPart[] {
  const { parts, tips } = featherCrown(7, 1.5, .75, 5);
  for (const tip of tips) {
    const wings: ModelPart[] = [], stems: ModelPart[] = [];
    for (let fruit = 0; fruit < 12; fruit++) { const a = fruit * 2.4, p: Triple = [tip[0] + Math.cos(a) * .065, tip[1] - .025 - fruit % 4 * .025, tip[2] + Math.sin(a) * .065]; stems.push(needle("臭椿果序连接每枚翅果的短梗", bark, tip, p, .002)); wings.push(flatLeaf("臭椿两端收尖的长条翅果", p, [p[0] + .026, p[1] - .035, p[2]], .014), lobe("位于翅果中央而非端部的种子", bark, [p[0] + .013, p[1] - .017, p[2]], [.006, .008, .005])); }
    parts.push(combineMeshes("臭椿完整圆锥果序分梗", bark, stems), combineMeshes("臭椿种子居中的狭长翅果簇", pale, wings));
  }
  return parts;
}

function chinesePistache(): ModelPart[] {
  const { parts, tips } = featherCrown(5.9, 1.7, .41, 4, false, false);
  for (const tip of tips) {
    const fruit: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 18; index++) { const a = index * 2.4, q: Triple = [tip[0] + Math.cos(a) * .065, tip[1] - .025 - index % 5 * .024, tip[2] + Math.sin(a) * .065]; stems.push(needle("黄连木疏圆锥果序的纤细分梗", bark, tip, q, .0018)); fruit.push(lobe("黄连木的细小球状核果", "#a3a18b", q, [.007, .008, .007])); }
    parts.push(combineMeshes("黄连木圆锥果序梗", bark, stems), combineMeshes("黄连木分离细小球果", "#a3a18b", fruit));
  }
  return parts;
}

function aromaticLaurel(kind: "camphor" | "cinnamon"): ModelPart[] {
  const cinnamon = kind === "cinnamon", { parts, tips } = crown(cinnamon ? 4.2 : 7.4, cinnamon ? 1 : 2.1, cinnamon ? .16 : .1, cinnamon ? .065 : .045, "oval", cinnamon);
  for (const tip of tips) {
    const veins: ModelPart[] = [], leaves: ModelPart[] = [];
    for (let index = 0; index < 3; index++) {
      const a = index * Math.PI * 2 / 3, p: Triple = [tip[0] + Math.cos(a) * .025, tip[1] + .02, tip[2] + Math.sin(a) * .025], end: Triple = [p[0] + Math.cos(a) * .13, p[1] + .035, p[2] + Math.sin(a) * .13];
      veins.push(needle("樟科树梢到叶柄的连枝", bark, tip, p, .0025)); leaves.push(flatLeaf("基出三主脉的完整樟科叶片", p, end, .055));
      for (const side of [-1, 0, 1]) { const q = mix(p, end, .7), r: Triple = [q[0] + Math.sin(a) * side * .015, q[1] + .002, q[2] - Math.cos(a) * side * .015]; veins.push(needle("从同一叶基分出的三条主脉", pale, p, r, .0012)); }
    }
    parts.push(combineMeshes("樟科树梢完整三脉叶", green, leaves), combineMeshes("相连木枝与叶面真实隆起主脉", pale, veins));
    const p: Triple = [tip[0], tip[1] - .06, tip[2]];
    parts.push(stalk(tip, p), lobe("位于浅杯状果托上的樟科小核果", "#929b82", p, cinnamon ? [.012, .019, .011] : [.008, .01, .008]));
  }
  return parts;
}

function cloveTree(): ModelPart[] {
  const { parts, tips } = crown(5.7, 1.2, .12, .047, "oval", true);
  for (const tip of tips) {
    const buds: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 8; index++) { const a = index * 2.4, p: Triple = [tip[0] + Math.cos(a) * .03, tip[1] + .035 + index % 3 * .015, tip[2] + Math.sin(a) * .03]; stems.push(needle("丁香顶端聚伞花序的分梗", bark, tip, p, .0015)); buds.push(tapered("丁香长筒状花托", fruitColor, [p, [p[0], p[1] + .014, p[2]]], [.002, .003]), lobe("花托顶端覆盖花瓣的圆形丁香花蕾", pale, [p[0], p[1] + .018, p[2]], [.006, .007, .006])); }
    parts.push(combineMeshes("丁香一整簇相连聚伞花序梗", bark, stems), combineMeshes("顶端圆头与细筒组成的完整丁香花蕾", pale, buds));
  }
  return parts;
}

function starAniseTree(): ModelPart[] {
  const { parts, tips } = crown(4.6, 1.1, .13, .042, "oval");
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .05, tip[2]], follicles: ModelPart[] = [];
    for (let index = 0; index < 8; index++) { const a = index * Math.PI / 4, end: Triple = [p[0] + Math.cos(a) * .026, p[1] + .005, p[2] + Math.sin(a) * .026]; follicles.push(tapered("八角每枚向外开展的木质蓇葖", fruitColor, [p, mix(p, end, .65), end], [.003, .006, .001])); }
    parts.push(stalk(tip, p), combineMeshes("完整八枚相接的星形八角聚合果", fruitColor, follicles));
  }
  return parts;
}

function nutmegTree(): ModelPart[] {
  const { parts, tips } = crown(5.4, 1.35, .14, .055, "oval");
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .085, tip[2]], arils: ModelPart[] = [];
    parts.push(stalk(tip, p), ...[-1, 1].map(side => lobe("肉豆蔻沿纵缝分开的肉质外果皮", fruitColor, [p[0] + side * .025, p[1] - .015, p[2]], [.032, .068, .057])), lobe("露在两片果皮之间的完整肉豆蔻种子", bark, [p[0], p[1] - .015, p[2] - .018], [.026, .039, .03]));
    for (let index = 0; index < 6; index++) { const a = index * Math.PI / 3; arils.push(tapered("包在肉豆蔻种子外的分枝假种皮", "#b59d8e", [[p[0], p[1] - .035, p[2] - .018], [p[0] + Math.cos(a) * .014, p[1] - .012, p[2] - .018 + Math.sin(a) * .016], [p[0], p[1] + .006, p[2] - .018]], [.0012, .0018, .0012])); }
    parts.push(combineMeshes("肉豆蔻完整网裂假种皮", "#b59d8e", arils));
  }
  return parts;
}

function rubberTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("橡胶树无切割状态的直立主干", bark, [[0, 0, 0], [0, 4.5, 0], [.03, 7.5, 0]], [.27, .18, .025])];
  for (let branch = 0; branch < 6; branch++) {
    const a = branch * 2.4, end: Triple = [Math.cos(a) * 1.8, 5.3 + branch % 3 * .8, Math.sin(a) * 1.8], root: Triple = [0, 3.4 + branch * .35, 0];
    parts.push(tapered("橡胶树上部伸展的木质分枝", bark, [root, end], [.11, .008]));
    for (let node = 0; node < 4; node++) {
      const p = mix(root, end, .5 + node * .15), q: Triple = [p[0] + Math.cos(a) * .21, p[1] + .05, p[2] + Math.sin(a) * .21], pieces: ModelPart[] = [needle("橡胶树三出复叶的长叶柄", green, p, q, .004)];
      for (const side of [-1, 0, 1]) { const b = a + side * .75; pieces.push(flatLeaf("橡胶树三出叶的舟状长小叶", q, [q[0] + Math.cos(b) * .24, q[1] + .035, q[2] + Math.sin(b) * .24], .067)); }
      parts.push(combineMeshes("一片完整长柄三出橡胶叶", green, pieces));
    }
    const p: Triple = [end[0], end[1] - .08, end[2]], lobes: ModelPart[] = [];
    parts.push(stalk(end, p));
    for (let chamber = 0; chamber < 3; chamber++) { const b = chamber * Math.PI * 2 / 3; lobes.push(lobe("橡胶树三室木质蒴果的独立圆瓣", fruitColor, [p[0] + Math.cos(b) * .014, p[1], p[2] + Math.sin(b) * .014], [.034, .041, .034])); }
    parts.push(combineMeshes("一整枚三裂橡胶树果", fruitColor, lobes));
  }
  return parts;
}

export function palmFrond(root: Triple, angle: number, reach: number, rise: number, pinnae: number, width: number): ModelPart[] {
  const path: Triple[] = [[...root], [root[0] + Math.cos(angle) * reach * .4, root[1] + rise, root[2] + Math.sin(angle) * reach * .4], [root[0] + Math.cos(angle) * reach, root[1] + rise * .3, root[2] + Math.sin(angle) * reach]];
  const pieces: ModelPart[] = [];
  for (let index = 0; index < pinnae; index++) for (const side of [-1, 1]) {
    const t = (index + 1) / (pinnae + 1), p = t < .4 ? mix(path[0]!, path[1]!, t / .4) : mix(path[1]!, path[2]!, (t - .4) / .6), a = angle + side * 1.15, length = reach * .3 * Math.sin(t * Math.PI);
    pieces.push(flatLeaf("沿棕榈羽叶轴两侧真实排列的狭长羽片", p, [p[0] + Math.cos(a) * length, p[1] - length * .18, p[2] + Math.sin(a) * length], width));
  }
  return [tapered("承托全部羽片的弧形棕榈叶轴", bark, path, [.05, .027, .003]), combineMeshes("一片完整棕榈羽叶的全部分离羽片", green, pieces)];
}

function oilPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("油棕短粗而直立的完整干", bark, [[0, 0, 0], [0, 3.7, 0]], [.36, .3])], bases: ModelPart[] = [];
  for (let index = 0; index < 30; index++) { const a = index * 2.4; bases.push(leaf("油棕干上宿存的粗硬菱形叶柄基", bark, [Math.cos(a) * .28, .12 + index * .105, Math.sin(a) * .28], .21, .3, [20, 90 - a * 180 / Math.PI, 0], "YXZ")); }
  parts.push(combineMeshes("油棕主干真实粗糙交错叶基", bark, bases));
  for (let leafIndex = 0; leafIndex < 10; leafIndex++) parts.push(...palmFrond([0, 3.7, 0], leafIndex * 2.4, 2.7, .7 + leafIndex % 3 * .3, 12, .065));
  for (let axis = 0; axis < 3; axis++) {
    const a = axis * Math.PI * 2 / 3, p: Triple = [Math.cos(a) * .36, 3.5, Math.sin(a) * .36], fruits: ModelPart[] = [], stalks: ModelPart[] = [];
    parts.push(stalk([0, 3.7, 0], p, .035));
    for (let fruit = 0; fruit < 36; fruit++) { const b = fruit * 2.4, h = -.8 + fruit / 35 * 1.6, r = Math.sqrt(1 - h * h) * .14, q: Triple = [p[0] + Math.cos(b) * r, p[1] + h * .18, p[2] + Math.sin(b) * r]; fruits.push(lobe("油棕密集果穗中的卵形油料核果", fruitColor, q, [.055, .074, .055])); stalks.push(needle("油棕果穗轴伸到每枚核果的短粗果梗", bark, p, q, .006)); }
    parts.push(combineMeshes("连在叶腋的一整穗紧密油棕果", fruitColor, fruits), combineMeshes("油棕整穗全部真实连接果梗", bark, stalks));
  }
  return parts;
}

function arecaPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("槟榔细长直立的光滑木质干", bark, [[0, 0, 0], [0, 6.6, 0]], [.11, .08]), tapered("槟榔叶鞘合抱形成的长绿冠轴", green, [[0, 6.45, 0], [0, 7.4, 0]], [.115, .085])];
  const rings: ModelPart[] = [];
  for (let index = 0; index < 19; index++) { const a = index * .31; rings.push(part("槟榔主干上连续的横向叶痕", "lathe", "#b2ac91", [0, .15 + a, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .106 - index * .0013, y: -.007 }, { x: .111 - index * .0013, y: -.007 }, { x: .111 - index * .0013, y: .007 }, { x: .106 - index * .0013, y: .007 }, { x: .106 - index * .0013, y: -.007 }] })); }
  parts.push(...rings);
  for (let index = 0; index < 7; index++) parts.push(...palmFrond([0, 7.3, 0], index * 2.4, 1.5, .65, 10, .07));
  for (let axis = 0; axis < 3; axis++) {
    const a = axis * Math.PI * 2 / 3, p: Triple = [Math.cos(a) * .28, 6.25, Math.sin(a) * .28], fruits: ModelPart[] = [], stems: ModelPart[] = [];
    parts.push(stalk([0, 6.5, 0], p, .02));
    for (let index = 0; index < 16; index++) { const b = index * 2.4, q: Triple = [p[0] + Math.cos(b) * .13, p[1] - .04 - index % 4 * .065, p[2] + Math.sin(b) * .13]; fruits.push(lobe("槟榔冠轴以下的卵形核果", fruitColor, q, [.038, .057, .038])); stems.push(needle("槟榔分枝下垂果序中的果梗", bark, p, q, .003)); }
    parts.push(combineMeshes("槟榔叶冠下方全部分枝果梗", bark, stems), combineMeshes("槟榔下垂圆锥果穗", fruitColor, fruits));
  }
  return parts;
}

function datePalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("海枣粗直且略带膨大的木质干", bark, [[0, 0, 0], [0, 5.5, 0]], [.32, .25])];
  const scars: ModelPart[] = [];
  for (let index = 0; index < 36; index++) { const a = index * 2.4; scars.push(leaf("海枣干上残留的鳞状叶柄基部", bark, [Math.cos(a) * .27, .1 + index * .145, Math.sin(a) * .27], .19, .25, [13, 90 - a * 180 / Math.PI, 0], "YXZ")); }
  parts.push(combineMeshes("海枣树干完整交错叶基", bark, scars));
  for (let index = 0; index < 10; index++) {
    const a = index * 2.4;
    parts.push(...palmFrond([0, 5.5, 0], a, 2.4, 1.25, 12, .043));
    const spines: ModelPart[] = [];
    for (let row = 0; row < 4; row++) for (const side of [-1, 1]) { const r = .18 + row * .1, p: Triple = [Math.cos(a) * r, 5.5 + r * .8, Math.sin(a) * r]; spines.push(needle("海枣叶柄基部变为硬刺的羽片", pale, p, [p[0] + Math.cos(a + side) * .18, p[1] + .08, p[2] + Math.sin(a + side) * .18], .013)); }
    parts.push(combineMeshes("一片海枣叶基的真实对生硬刺", pale, spines));
  }
  for (let axis = 0; axis < 3; axis++) {
    const a = axis * Math.PI * 2 / 3, root: Triple = [0, 5.45, 0], p: Triple = [Math.cos(a) * .7, 4.8, Math.sin(a) * .7], fruits: ModelPart[] = [], stems: ModelPart[] = [];
    parts.push(tapered("由叶腋伸出后弯垂的海枣大果穗轴", bark, [root, [p[0] * .6, 5.5, p[2] * .6], p], [.025, .02, .008]));
    for (let index = 0; index < 24; index++) { const b = index * 2.4, q: Triple = [p[0] + Math.cos(b) * .18, p[1] - index % 6 * .07, p[2] + Math.sin(b) * .18]; stems.push(needle("海枣长圆果穗分支", bark, p, q, .003)); fruits.push(lobe("海枣果穗中一枚完整长圆核果", fruitColor, q, [.024, .044, .023])); }
    parts.push(combineMeshes("海枣果穗真实放射细轴", bark, stems), combineMeshes("整串逐枚分离的海枣核果", fruitColor, fruits));
  }
  return parts;
}

function macadamia(): ModelPart[] {
  const { parts, tips } = crown(4.8, 1.4, .18, .042, toothed);
  for (const tip of tips) {
    const stems: ModelPart[] = [], fruits: ModelPart[] = [];
    for (let index = 0; index < 6; index++) { const p: Triple = [tip[0] + Math.sin(index) * .022, tip[1] - .06 - index * .038, tip[2]]; stems.push(needle("夏威夷果下垂总状果序的连续轴", bark, index ? [tip[0] + Math.sin(index - 1) * .022, tip[1] - .06 - (index - 1) * .038, tip[2]] : tip, p, .003)); fruits.push(lobe("包在光滑绿色果皮内的圆形坚果", pale, p, [.031, .035, .031])); }
    parts.push(combineMeshes("夏威夷果下垂总状果序梗", bark, stems), combineMeshes("夏威夷果一整串独立球果", pale, fruits));
  }
  return parts;
}

function brazilNutTree(): ModelPart[] {
  const { parts, tips } = crown(9.4, 2.45, .3, .13, "oval");
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .16, tip[2]];
    parts.push(stalk(tip, p, .014), lobe("巴西坚果有厚木壁的近球形完整果荚", bark, p, [.145, .16, .145]), part("巴西坚果木质蒴果基端小圆盖", "cylinder", "#b1a585", [p[0], p[1] - .076, p[2]], [.035, .008, .035]));
  }
  return parts;
}

function annona(kind: "soursop" | "sugarApple"): ModelPart[] {
  const spiny = kind === "soursop", { parts, tips } = crown(spiny ? 4.8 : 3.4, spiny ? 1.4 : 1.05, spiny ? .15 : .12, spiny ? .058 : .04, "oval");
  for (const tip of tips.slice(0, 4)) {
    const p: Triple = [tip[0], tip[1] - .11, tip[2]], skin: ModelPart[] = [];
    parts.push(stalk(tip, p, .006), lobe(spiny ? "刺果番荔枝长卵形偏心聚合果体" : "番荔枝短卵形聚合果体", pale, p, spiny ? [.15, .24, .14] : [.1, .125, .1]));
    for (let index = 0; index < (spiny ? 36 : 30); index++) { const a = index * 2.4, h = -.8 + index / (spiny ? 35 : 29) * 1.6, r = Math.sqrt(1 - h * h), q: Triple = [p[0] + Math.cos(a) * r * (spiny ? .065 : .044), p[1] + h * (spiny ? .106 : .053), p[2] + Math.sin(a) * r * (spiny ? .061 : .044)]; if (spiny) skin.push(tapered("刺果番荔枝表皮向外弯出的软刺", green, [q, [q[0] + Math.cos(a) * .012, q[1] + .009, q[2] + Math.sin(a) * .012], [q[0] + Math.cos(a + .4) * .019, q[1] + .014, q[2] + Math.sin(a + .4) * .019]], [.0035, .002, .001])); else skin.push(lobe("番荔枝明显分离的鳞状膨大心皮", green, q, [.027, .034, .027], [0, -a * 180 / Math.PI, 0])); }
    for (let offset = 0; offset < skin.length; offset += spiny ? 12 : 30) parts.push(combineMeshes(spiny ? "刺果番荔枝果壁一组真实软刺" : "一枚番荔枝完整鳞片状果面", green, skin.slice(offset, offset + (spiny ? 12 : 30))));
  }
  return parts;
}

// 仅复用木干/叶片构造，不用地域前缀或叶果数量乘积登记主项。
// https://www.nparks.gov.sg/florafaunaweb/flora/2/9/2953
// https://auth1.dpr.ncparks.gov/flora/plant_list.php?name_sn=Koelreuteria+paniculata
// https://www.dendrology.org/publications/tree-of-the-year/eucommia-ulmoides-2008/
export const woodyExpansionBatchTwoDesigns: MasterNatureDesign[] = [
  design("hazelWholeShrub", "榛树", "植物", hazel, ["Corylus avellana", "丛生枝锯齿圆叶与叶状裂苞坚果"]),
  design("almondWholeTree", "扁桃树", "植物", almond, ["Prunus dulcis", "巴旦木", "细锯齿狭叶与开裂绒果皮"]),
  design("pistachioWholeTree", "开心果树", "植物", pistachio, ["Pistacia vera", "三小叶与成簇卵形核果"]),
  design("pecanWholeTree", "薄壳山核桃", "植物", pecan, ["Carya illinoinensis", "碧根果树", "长羽叶与四合缝长坚果"]),
  design("tungWholeTree", "油桐", "植物", tung, ["Vernicia fordii", "宽掌裂叶与五室桐果"]),
  design("soapnutWholeTree", "无患子", "植物", soapnut, ["Sapindus mukorossi", "羽状叶与悬垂圆锥果序"]),
  design("goldenRainWholeTree", "栾树", "植物", goldenRainTree, ["Koelreuteria paniculata", "裂齿复叶与三面薄壁灯笼蒴果"]),
  design("eucommiaWholeTree", "杜仲", "植物", eucommia, ["Eucommia ulmoides", "锯齿单叶与中部具种核的狭椭圆翅果"]),
  design("wheelWingnutWholeTree", "青钱柳", "植物", wheelWingnut, ["Cyclocarya paliurus", "羽状叶与圆盘状果翅"]),
  design("toonaWholeTree", "香椿", "植物", toona, ["Toona sinensis", "长羽叶与直立五瓣裂蒴果"]),
  design("ailanthusWholeTree", "臭椿", "植物", ailanthus, ["Ailanthus altissima", "长复叶与中央着生种核的狭翅果"]),
  design("chinesePistacheWholeTree", "黄连木", "植物", chinesePistache, ["Pistacia chinensis", "长复叶与疏松小核果圆锥序"]),
  design("camphorWholeTree", "香樟", "植物", () => aromaticLaurel("camphor"), ["Cinnamomum camphora", "基出三主脉互生叶与小核果"]),
  design("cinnamonWholeTree", "肉桂树", "植物", () => aromaticLaurel("cinnamon"), ["Cinnamomum verum", "对生三脉革叶与长卵形核果"]),
  design("cloveWholeTree", "丁香树", "植物", cloveTree, ["Syzygium aromaticum", "香料丁香", "对生叶与长萼筒圆头花蕾"]),
  design("starAniseWholeTree", "八角树", "植物", starAniseTree, ["Illicium verum", "革质长叶与八枚木质蓇葖"]),
  design("nutmegWholeTree", "肉豆蔻树", "植物", nutmegTree, ["Myristica fragrans", "开裂肉质果皮与网状假种皮"]),
  design("rubberWholeTree", "橡胶树", "植物", rubberTree, ["Hevea brasiliensis", "长柄三出叶与三室木质蒴果"]),
  design("oilWholePalm", "油棕", "植物", oilPalm, ["Elaeis guineensis", "粗糙叶基干与叶腋紧密油料果穗"]),
  design("arecaWholePalm", "槟榔", "植物", arecaPalm, ["Areca catechu", "细环纹干绿冠轴与冠下果序"]),
  design("dateWholePalm", "海枣", "植物", datePalm, ["Phoenix dactylifera", "鳞状叶基叶柄刺与长串核果"]),
  design("macadamiaWholeTree", "夏威夷果树", "植物", macadamia, ["Macadamia integrifolia", "长齿革叶与下垂总状球果"]),
  design("brazilNutWholeTree", "巴西坚果树", "植物", brazilNutTree, ["Bertholletia excelsa", "大革叶与木质球形果荚"]),
  design("soursopWholeTree", "刺果番荔枝树", "植物", () => annona("soursop"), ["Annona muricata", "长卵聚合果与软刺壳面"]),
  design("sugarAppleWholeTree", "番荔枝树", "植物", () => annona("sugarApple"), ["Annona squamosa", "鳞片状独立心皮形成的聚合果"]),
];
