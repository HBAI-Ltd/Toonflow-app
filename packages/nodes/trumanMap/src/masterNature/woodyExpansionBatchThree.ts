import { Quaternion, Vector3 } from "three";
import { cap, combineMeshes, design, leaf, lobe, needle, part, petals, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { branchPoint, crown, leafyShoot } from "./woodyExpansionBatchOne";
import { featherCrown } from "./woodyExpansionBatchTwo";

const bark = "#958b75";
const green = "#7f956e";
const light = "#abbc92";
const seedColor = "#b8ac8b";
const bloomColor = "#d3c6a5";
const toothed: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.25, .12], [-.45, .3], [-.34, .4], [-.5, .56], [-.32, .64], [-.27, .8], [0, 1], [.27, .8], [.32, .64], [.5, .56], [.34, .4], [.45, .3], [.25, .12]];

function lerp(a: Triple, b: Triple, t: number): Triple { return a.map((value, axis) => value + (b[axis]! - value) * t) as Triple; }

export function buttresses(radius: number, reach: number, height: number): ModelPart[] {
  return Array.from({ length: 6 }, (_, index) => part("从干基连续延伸到土面的薄板状支撑根", "extrude", bark, [0, 0, 0], [1, 1, 1], [0, index * 60 + 11, 0], { depth: radius * .28, profile: [{ x: radius * .4, y: 0 }, { x: reach, y: 0 }, { x: reach * .7, y: .14 }, { x: radius, y: height * .46 }, { x: radius * .45, y: height }] }));
}

export function canopy(tips: Triple[], width: number, thickness: number): ModelPart {
  const pieces: ModelPart[] = [];
  for (let index = 0; index < tips.length; index++) {
    const p = tips[index]!, a = index * 2.4;
    pieces.push(lobe("远景保持连续叶冠体积的低面叶簇", green, [p[0] * .8, p[1] + thickness * .15, p[2] * .8], [width, thickness, width * .9]), lobe("分枝末端相接的较小叶簇", green, [p[0] + Math.cos(a) * width * .18, p[1] + thickness * .12, p[2] + Math.sin(a) * width * .18], [width * .7, thickness * .85, width * .7]));
  }
  return combineMeshes("整株大乔木真实空间分布的连续叶冠", green, pieces);
}

export function forestCrown(height: number, width: number, leafLength: number, leafWidth: number, form: Parameters<typeof flatLeaf>[4] = "oval", opposite = false) {
  const value = crown(height, width, leafLength, leafWidth, form, opposite);
  value.parts.push(canopy(value.tips, width * .9, height * .2));
  return value;
}

function rainTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("雨树低处叉开并支承大伞冠的粗干", bark, [[0, 0, 0], [.15, 3.8, 0], [0, 6.3, .1]], [1.05, .8, .38])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * Math.PI / 3, p: Triple = [Math.cos(a) * 9.5, 12.5 + axis % 2 * 1.3, Math.sin(a) * 9.5]; tips.push(p);
    const branchRoot: Triple = [0, 4.3 + axis * .25, 0], middle: Triple = [p[0] * .44, 9.5, p[2] * .44];
    parts.push(tapered("雨树低分叉后拱起的放射承冠枝", bark, [branchRoot, middle, p], [.48, .25, .045]));
    for (let node = 0; node < 2; node++) {
      const root = branchPoint(branchRoot, middle, p, .78 + node * .17, .44), b = a + (node % 2 ? .75 : -.75), end: Triple = [root[0] + Math.cos(b) * .32, root[1] + .04, root[2] + Math.sin(b) * .32], pieces: ModelPart[] = [needle("雨树二回羽叶的第一级主叶轴", light, root, end, .004)];
      for (let pair = 0; pair < 3; pair++) for (const side of [-1, 1]) {
        const q = lerp(root, end, .2 + pair * .29), c = b + side * 1.2, tip: Triple = [q[0] + Math.cos(c) * .12, q[1] + .012, q[2] + Math.sin(c) * .12];
        pieces.push(needle("二回羽状叶中每一条次级羽轴", green, q, tip, .0015));
        for (let node = 0; node < 2; node++) for (const leafSide of [-1, 1]) { const base = lerp(q, tip, .35 + node * .4), d = c + leafSide * 1.15; pieces.push(flatLeaf("雨树成对而不具顶生叶的偏斜小叶", base, [base[0] + Math.cos(d) * .035, base[1] + .004, base[2] + Math.sin(d) * .035], .02, [[0, 0], [-.23, .14], [-.46, .47], [-.2, .85], [0, 1], [.24, .81], [.4, .54], [.25, .16]])); }
      }
      parts.push(combineMeshes("雨树一片完整二回羽状复叶", green, pieces));
    }
    const puffs: ModelPart[] = [];
    for (let i = 0; i < 24; i++) { const b = i * 2.4, r = Math.sqrt(i / 24) * .045; puffs.push(needle("雨树粉扑状花头中真实细雄蕊", bloomColor, p, [p[0] + Math.cos(b) * r, p[1] + .025 + i % 3 * .012, p[2] + Math.sin(b) * r], .0015)); }
    parts.push(combineMeshes("雨树冠缘的完整丝状花头", bloomColor, puffs), tapered("雨树枝端具节间收缩的厚长荚果", "#8f8d71", [p, [p[0] + .05, p[1] - .06, p[2]], [p[0] + .22, p[1] - .07, p[2]]], [.008, .018, .006]));
  }
  parts.push(...buttresses(1, 3, 2.5), canopy(tips, 10.8, 3.8));
  return parts;
}

function angsana(): ModelPart[] {
  const { parts, tips } = featherCrown(19, 6.2, .31, 3);
  parts.push(...buttresses(.65, 2.7, 2.8), canopy(tips, 6.3, 4.1));
  for (const tip of tips) {
    const discs: ModelPart[] = [], seeds: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 5; index++) { const p: Triple = [tip[0] + (index - 2) * .018, tip[1] - .06 - index % 2 * .035, tip[2]]; discs.push(polygon("印度紫檀不裂荚果周围的完整圆盘薄翅", seedColor, Array.from({ length: 12 }, (_, i) => [Math.cos(i * Math.PI / 6) * .027, Math.sin(i * Math.PI / 6) * .027]), .0015, p)); seeds.push(lobe("位于印度紫檀果盘中心的膨大种室", bark, p, [.015, .012, .015])); stems.push(needle("紫檀果盘连接木枝的细梗", bark, tip, p, .002)); }
    parts.push(combineMeshes("印度紫檀一簇有梗圆盘荚果", bark, stems), combineMeshes("印度紫檀完整盘状荚果翅", seedColor, discs), combineMeshes("印度紫檀盘状荚果中央种室", bark, seeds));
  }
  return parts;
}

function mahogany(): ModelPart[] {
  const { parts, tips } = featherCrown(25, 6, .42, 3, false, false);
  parts.push(...buttresses(.95, 3.5, 3.6), canopy(tips, 6.8, 5.6));
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] + .15, tip[2]], valves: ModelPart[] = [];
    parts.push(tapered("向上生长的桃花心木粗果柄", bark, [tip, p], [.01, .006]), tapered("桃花心木蒴果中央直立五棱种轴", bark, [p, [p[0], p[1] + .13, p[2]]], [.016, .004]));
    for (let valve = 0; valve < 5; valve++) { const a = valve * Math.PI * 2 / 5; valves.push(flatLeaf("桃花心木向外张开的厚木质蒴果瓣", p, [p[0] + Math.cos(a) * .055, p[1] + .16, p[2] + Math.sin(a) * .055], .04, "oval", .004)); }
    parts.push(combineMeshes("桃花心木完整直立五瓣木质蒴果", seedColor, valves));
  }
  return parts;
}

function ironwood(): ModelPart[] {
  const { parts, tips } = forestCrown(16.5, 3.4, .17, .033, "oval", true);
  for (const tip of tips) {
    const stamens: ModelPart[] = [];
    parts.push(petals(4, tip, .028, .055, 76, bloomColor));
    for (let index = 0; index < 28; index++) { const a = index * 2.4, r = Math.sqrt(index / 28) * .027; stamens.push(needle("铁力木四瓣花内密集细长雄蕊", seedColor, tip, [tip[0] + Math.cos(a) * r, tip[1] + .02 + index % 4 * .004, tip[2] + Math.sin(a) * r], .0012)); }
    parts.push(combineMeshes("铁力木一朵完整多雄蕊四瓣花", seedColor, stamens));
  }
  return parts;
}

function dipterocarp(): ModelPart[] {
  const { parts, tips } = forestCrown(27, 6, .23, .11, "oval");
  parts.push(...buttresses(.95, 3.8, 4));
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .06, tip[2]], wings: ModelPart[] = [];
    parts.push(tapered("翼果龙脑香细长果梗", bark, [tip, p], [.004, .002]), lobe("龙脑香果萼筒中的卵形坚果", seedColor, p, [.021, .031, .021]));
    for (let wing = 0; wing < 5; wing++) { const a = wing * Math.PI * 2 / 5, length = wing < 2 ? .17 : .027; wings.push(flatLeaf("萼片延伸成的两长三短龙脑香果翅", p, [p[0] + Math.cos(a) * length, p[1] + length * .23, p[2] + Math.sin(a) * length], wing < 2 ? .026 : .012)); }
    parts.push(combineMeshes("一枚有真实萼片翅的龙脑香果实", seedColor, wings));
  }
  return parts;
}

function teak(): ModelPart[] {
  const { parts, tips } = forestCrown(22, 5.2, .43, .24, "oval", true);
  for (const tip of tips) {
    const branches: ModelPart[] = [], fruits: ModelPart[] = [];
    for (let index = 0; index < 14; index++) { const a = index * 2.4, p: Triple = [tip[0] + Math.cos(a) * .16, tip[1] + .06 + index % 5 * .065, tip[2] + Math.sin(a) * .16]; branches.push(needle("柚木巨大顶生圆锥果序的细分轴", bark, tip, p, .003)); fruits.push(lobe("柚木被膨大萼筒包围的小圆核果", seedColor, p, [.019, .021, .019])); }
    parts.push(combineMeshes("柚木冠顶完整分枝果序轴", bark, branches), combineMeshes("柚木相互分离的小圆果", seedColor, fruits));
  }
  return parts;
}

function seaAlmond(): ModelPart[] {
  const parts: ModelPart[] = [tapered("榄仁树从地表到顶端的直干", bark, [[0, 0, 0], [0, 16.5, 0]], [.66, .03])], tips: Triple[] = [];
  for (let tier = 0; tier < 4; tier++) for (let axis = 0; axis < 4; axis++) {
    const a = axis * Math.PI / 2 + tier * .65, reach = 5.8 - tier * 1.08, y = 4.3 + tier * 3.1, end: Triple = [Math.cos(a) * reach, y + .18, Math.sin(a) * reach]; tips.push(end);
    parts.push(tapered("榄仁树轮生分层的水平长枝", bark, [[0, y, 0], [end[0] * .65, y, end[2] * .65], end], [.14 - tier * .018, .065, .009]));
    const leaves: ModelPart[] = [];
    for (let index = 0; index < 8; index++) { const b = index * Math.PI / 4, p: Triple = [end[0] + Math.cos(b) * .045, end[1], end[2] + Math.sin(b) * .045]; leaves.push(needle("枝端密集榄仁叶的短柄", green, end, p, .003), flatLeaf("榄仁树集中枝端的宽大倒卵形叶", p, [p[0] + Math.cos(b) * .3, p[1] + .035, p[2] + Math.sin(b) * .3], .18, "obovate")); }
    parts.push(combineMeshes("榄仁树每一水平枝端完整的大叶轮簇", green, leaves));
    const p: Triple = [end[0], end[1] - .06, end[2]]; parts.push(tapered("榄仁扁核果短果梗", bark, [end, p], [.004, .002]), lobe("榄仁树具有明显侧棱的扁杏形果", seedColor, p, [.045, .064, .022]));
  }
  const crowns = tips.map((p, index) => lobe("保留各轮间通透间隔的平展叶冠簇", green, p, [3.9 - Math.floor(index / 4) * .55, .85, 3.5 - Math.floor(index / 4) * .5]));
  parts.push(...buttresses(.66, 2.5, 2.2), combineMeshes("榄仁树四层分离的水平叶冠", green, crowns));
  return parts;
}

function beachCalophyllum(): ModelPart[] {
  const { parts, tips } = forestCrown(15.5, 5.3, .17, .095, "oval", true);
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .08, tip[2]];
    parts.push(tapered("琼崖海棠球形核果的细梗", bark, [tip, p], [.004, .002]), lobe("琼崖海棠近球形油料核果", seedColor, p, [.035, .036, .035]), petals(4, [tip[0] + .045, tip[1], tip[2]], .012, .028, 75, bloomColor));
  }
  return parts;
}

function schima(): ModelPart[] {
  const { parts, tips } = forestCrown(19.5, 4.7, .14, .052, toothed);
  for (const tip of tips) {
    const stamens: ModelPart[] = [];
    parts.push(petals(5, tip, .021, .043, 76, bloomColor), lobe("木荷花后的近球形木质蒴果", seedColor, [tip[0] + .04, tip[1] - .015, tip[2]], [.019, .023, .019]));
    for (let index = 0; index < 20; index++) { const a = index * 2.4, r = Math.sqrt(index / 20) * .018; stamens.push(needle("木荷花心密集而直立的雄蕊", light, tip, [tip[0] + Math.cos(a) * r, tip[1] + .014 + index % 3 * .003, tip[2] + Math.sin(a) * r], .0012)); }
    parts.push(combineMeshes("木荷一整朵多雄蕊花心", light, stamens));
  }
  return parts;
}

function chineseTallow(): ModelPart[] {
  const diamond: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.3, .2], [-.5, .48], [-.2, .72], [0, 1], [.2, .72], [.5, .48], [.3, .2]], { parts, tips } = forestCrown(13.2, 4.2, .1, .085, diamond);
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stems: ModelPart[] = [], hulls: ModelPart[] = [];
    for (let index = 0; index < 6; index++) { const p: Triple = [tip[0] + Math.sin(index * 2.4) * .032, tip[1] + .025 + index * .017, tip[2] + Math.cos(index * 2.4) * .032]; stems.push(needle("乌桕顶生果序独立小梗", bark, tip, p, .002)); for (let side = 0; side < 3; side++) { const a = side * Math.PI * 2 / 3; fruits.push(lobe("三裂乌桕蒴果中外露的白色蜡质种子", "#d2cfb4", [p[0] + Math.cos(a) * .006, p[1], p[2] + Math.sin(a) * .006], [.009, .011, .009])); hulls.push(flatLeaf("仍接在果轴上的乌桕蒴果瓣", p, [p[0] + Math.cos(a) * .014, p[1] + .009, p[2] + Math.sin(a) * .014], .006)); } }
    parts.push(combineMeshes("乌桕完整分枝果序轴", bark, stems), combineMeshes("乌桕枝头相互分离的三粒蜡籽", "#d2cfb4", fruits), combineMeshes("乌桕真实三裂蒴果外壁", seedColor, hulls));
  }
  return parts;
}

function sandboxTree(): ModelPart[] {
  const { parts, tips } = forestCrown(23, 6, .23, .17, "heart"), spines: ModelPart[] = [];
  parts.push(...buttresses(.8, 2.7, 2.7));
  for (let index = 0; index < 70; index++) { const a = index * 2.4, y = .2 + index % 14 * .65, r = 1.03 - y * .035; spines.push(needle("响沙树主干直接长出的坚硬圆锥刺", bark, [Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a) * (r + .11), y + .025, Math.sin(a) * (r + .11)], .07)); }
  parts.push(combineMeshes("响沙树真实密布于干面的硬刺", bark, spines));
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .06, tip[2]], chambers: ModelPart[] = [];
    parts.push(tapered("响沙树短粗的下垂果柄", bark, [tip, p], [.004, .002]));
    for (let index = 0; index < 12; index++) { const a = index * Math.PI / 6; chambers.push(lobe("响沙树扁南瓜状蒴果的放射心皮", seedColor, [p[0] + Math.cos(a) * .025, p[1], p[2] + Math.sin(a) * .025], [.017, .035, .017])); }
    parts.push(combineMeshes("具有放射纵沟的完整响沙树木质果", seedColor, chambers));
  }
  return parts;
}

function balsaTree(): ModelPart[] {
  const { parts, tips } = forestCrown(24, 5.3, .36, .29, "palm");
  parts.push(...buttresses(.85, 3.1, 3.8));
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] + .04, tip[2]], walls: ModelPart[] = [];
    for (let valve = 0; valve < 5; valve++) { const a = valve * Math.PI * 2 / 5; walls.push(flatLeaf("轻木长蒴果厚实的木质开裂瓣", p, [p[0] + Math.cos(a) * .03, p[1] + .22, p[2] + Math.sin(a) * .03], .027, "oval", .003)); }
    parts.push(tapered("轻木果实相连的直立短柄", bark, [tip, p], [.006, .003]), combineMeshes("轻木冠顶直立的五瓣长木质蒴果", seedColor, walls));
  }
  return parts;
}

function cassiaTree(): ModelPart[] {
  const { parts, tips } = featherCrown(15.5, 4.4, .27, 5, false, false);
  parts.push(canopy(tips, 4.4, 3.5));
  for (const tip of tips) {
    const pods: ModelPart[] = [];
    for (let index = 0; index < 3; index++) { const p: Triple = [tip[0] + (index - 1) * .025, tip[1], tip[2]], end: Triple = [p[0] + .03, p[1] - .24, p[2]]; pods.push(tapered("铁刀木细长平直且有厚边的荚果", seedColor, [p, [p[0] + .015, p[1] - .13, p[2]], end], [.008, .012, .004])); }
    parts.push(combineMeshes("铁刀木枝端完整下垂的长荚果", seedColor, pods), petals(5, [tip[0], tip[1] + .02, tip[2]], .016, .03, 74, bloomColor));
  }
  return parts;
}

function africanTulipTree(): ModelPart[] {
  const { parts, tips } = featherCrown(19.2, 5.1, .43, 4);
  parts.push(canopy(tips, 5.2, 4.3));
  for (const tip of tips) {
    for (let index = 0; index < 2; index++) { const a = index * Math.PI, p: Triple = [tip[0] + Math.cos(a) * .045, tip[1] + index % 2 * .025, tip[2] + Math.sin(a) * .045]; parts.push(tapered("火焰木花冠接到枝端聚伞序的花梗", bark, [tip, p], [.004, .002]), cap("火焰木开放而一侧较高的杯状大花", "#bc9f85", p, .045, .075, 3)); }
    parts.push(tapered("火焰木尖端向上的窄舟状长蒴果", seedColor, [tip, [tip[0] + .035, tip[1] + .19, tip[2]], [tip[0] + .015, tip[1] + .26, tip[2]]], [.006, .022, .001]));
  }
  return parts;
}

function heartLeafTree(kind: "tetracentron" | "katsura"): ModelPart[] {
  const katsura = kind === "katsura", { parts, tips } = forestCrown(katsura ? 16.8 : 20.5, katsura ? 4.3 : 4.7, katsura ? .075 : .13, katsura ? .072 : .1, "heart", katsura);
  if (katsura) parts.push(tapered("连香树与主干共同发出的第二根木质干", bark, [[.35, 0, .05], [.28, 5.4, -.05], [.7, 10.6, .1]], [.4, .22, .04]));
  for (const tip of tips) {
    if (katsura) {
      const follicles: ModelPart[] = [];
      for (let index = 0; index < 4; index++) { const a = index * Math.PI / 2; follicles.push(tapered("连香树成簇弯角状独立蓇葖果", seedColor, [tip, [tip[0] + Math.cos(a) * .009, tip[1] + .014, tip[2] + Math.sin(a) * .009], [tip[0] + Math.cos(a + .3) * .016, tip[1] + .019, tip[2] + Math.sin(a + .3) * .016]], [.0025, .003, .001])); }
      parts.push(combineMeshes("连香树一整簇四枚弯曲蓇葖果", seedColor, follicles));
    } else {
      const path: Triple[] = [tip, [tip[0] + .015, tip[1] - .08, tip[2]], [tip[0] + .03, tip[1] - .17, tip[2]]], florets: ModelPart[] = [];
      parts.push(tapered("水青树由叶腋下垂的细长穗轴", green, path, [.0025, .002, .0015]));
      for (let index = 0; index < 36; index++) { const a = index * Math.PI / 2, y = tip[1] - .02 - index / 35 * .14; florets.push(lobe("水青树无瓣四基数小花的微小花托", light, [tip[0] + .015 + Math.cos(a) * .003, y, tip[2] + Math.sin(a) * .003], [.004, .004, .004])); }
      parts.push(combineMeshes("一整穗围绕穗轴的水青树小花", light, florets));
    }
  }
  return parts;
}

function zelkova(): ModelPart[] {
  const parts: ModelPart[] = [tapered("榉树由短粗主干向上叉开的花瓶形干", bark, [[0, 0, 0], [0, 4.2, 0]], [.72, .42])], tips: Triple[] = [];
  for (let axis = 0; axis < 7; axis++) {
    const a = axis * Math.PI * 2 / 7, p: Triple = [Math.cos(a) * 5, 15 + axis % 3 * 1.3, Math.sin(a) * 5]; tips.push(p);
    const branchRoot: Triple = [0, 3.9, 0], middle: Triple = [p[0] * .3, 10.4, p[2] * .3];
    parts.push(tapered("榉树斜举后展开的花瓶形骨干枝", bark, [branchRoot, middle, p], [.34, .17, .015]));
    for (let twig = 0; twig < 2; twig++) { const root = branchPoint(branchRoot, middle, p, .76 + twig * .17, .3), b = a + (twig ? .6 : -.6); parts.push(...leafyShoot(root, [root[0] + Math.cos(b) * .38, root[1] + .15, root[2] + Math.sin(b) * .38], .07, .03, toothed)); }
    parts.push(lobe("榉树叶腋没有翅的细小歪球形坚果", seedColor, [p[0], p[1] - .006, p[2]], [.005, .004, .005]));
  }
  parts.push(canopy(tips, 4.5, 3.8));
  return parts;
}

function dawnRedwood(): ModelPart[] {
  const parts: ModelPart[] = [tapered("水杉通直的高大收分主干", bark, [[0, 0, 0], [0, 13, 0], [0, 27, 0]], [1, .48, .012])], crowns: ModelPart[] = [];
  parts.push(...buttresses(1, 3, 2.2));
  for (let tier = 0; tier < 5; tier++) for (const side of [-1, 1]) {
    const a = tier * 1.05 + (side < 0 ? Math.PI : 0), reach = 5.2 - tier * .85, y = 5.2 + tier * 4.1, p: Triple = [Math.cos(a) * reach, y, Math.sin(a) * reach];
    parts.push(tapered("水杉在同一节上相对伸出的侧枝", bark, [[0, y, 0], p], [.13 - tier * .018, .004]));
    const leaflets: ModelPart[] = [], shoots: ModelPart[] = [];
    for (let twig = 0; twig < 3; twig++) { const root = lerp([0, y, 0], p, .5 + twig * .2), b = a + (twig % 2 ? .85 : -.85), end: Triple = [root[0] + Math.cos(b) * .36, y + .035, root[2] + Math.sin(b) * .36]; shoots.push(needle("水杉扁平二列叶的相连脱落小枝", bark, root, end, .004)); for (let index = 0; index < 10; index++) for (const leafSide of [-1, 1]) { const q = lerp(root, end, (index + 1) / 12), c = b + leafSide * 1.3; leaflets.push(leaf("水杉相对排列的扁平线形叶", green, q, .0025, .026, [78, 90 - c * 180 / Math.PI, 0], "YXZ")); } }
    parts.push(combineMeshes("水杉整条主枝的相连小枝", bark, shoots));
    for (let index = 0; index < leaflets.length; index += 20) parts.push(combineMeshes("保持二列对生排列的水杉扁针叶", green, leaflets.slice(index, index + 20)));
    crowns.push(lobe("水杉三角冠中每一对侧枝的疏密叶簇", green, [p[0] * .7, y + .2, p[2] * .7], [reach * 1.05, 2, reach * .8]));
    const q: Triple = [p[0], y - .06, p[2]]; parts.push(tapered("水杉小球果的长下垂梗", bark, [p, q], [.002, .0012]), lobe("水杉有长梗的近球形木质球果", seedColor, q, [.024, .03, .024]));
  }
  parts.push(combineMeshes("水杉保持轮廓层次的锥形整体叶冠", green, crowns));
  return parts;
}

function curvedNeedle(start: Triple, middle: Triple, end: Triple): ModelPart {
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...end).sub(new Vector3(...start)).normalize());
  const vertices = [start, middle].flatMap((p, row) => Array.from({ length: 3 }, (_, index) => {
    const a = index * Math.PI * 2 / 3, radius = row ? .0012 : .0018, v = new Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius).applyQuaternion(rotation);
    return { x: p[0] + v.x, y: p[1] + v.y, z: p[2] + v.z };
  }));
  vertices.push({ x: end[0], y: end[1], z: end[2] });
  const indices = [0, 1, 2];
  for (let index = 0; index < 3; index++) { const next = (index + 1) % 3; indices.push(index, index + 3, next + 3, index, next + 3, next, index + 3, 6, next + 3); }
  return part("柳杉从叶基到内弯尖端的完整镰状锥叶", "mesh", green, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function cryptomeria(): ModelPart[] {
  const parts: ModelPart[] = [tapered("柳杉直立纤维树皮长干", bark, [[0, 0, 0], [0, 22, 0]], [.72, .009])], crowns: ModelPart[] = [];
  for (let branch = 0; branch < 12; branch++) {
    const a = branch * 2.4, y = 4.6 + branch * 1.3, reach = 4.2 - branch * .25, p: Triple = [Math.cos(a) * reach, y - .18, Math.sin(a) * reach];
    parts.push(tapered("柳杉向外斜伸的螺旋木质侧枝", bark, [[0, y, 0], p], [.12 - branch * .006, .004]));
    const twigs: ModelPart[] = [], needles: ModelPart[] = [];
    for (let twig = 0; twig < 2; twig++) { const root = lerp([0, y, 0], p, .65 + twig * .27), end: Triple = [root[0] + Math.cos(a + twig) * .25, root[1] + .035, root[2] + Math.sin(a + twig) * .25]; twigs.push(needle("柳杉直接连到骨干枝的叶枝", bark, root, end, .004)); for (let index = 0; index < 24; index++) { const b = index * 2.4, q = lerp(root, end, (index + 1) / 25); needles.push(curvedNeedle(q, [q[0] + Math.cos(b) * .012, q[1] + .006, q[2] + Math.sin(b) * .012], [q[0] + Math.cos(b) * .014 + Math.cos(a) * .006, q[1] + .017, q[2] + Math.sin(b) * .014 + Math.sin(a) * .006])); } }
    parts.push(combineMeshes("柳杉相连的末端木质叶枝", bark, twigs));
    for (let offset = 0; offset < needles.length; offset += 16) parts.push(combineMeshes("柳杉完整镰状叶序的一段", green, needles.slice(offset, offset + 16)));
    crowns.push(lobe("柳杉上窄下宽的密叶分枝簇", green, [p[0] * .75, y, p[2] * .75], [reach * 1.1, 2.6, reach]));
  }
  parts.push(combineMeshes("柳杉完整尖塔形叶冠", green, crowns));
  return parts;
}

function umbrellaPine(): ModelPart[] {
  const parts: ModelPart[] = [tapered("金松通直的纤细木质主干", bark, [[0, 0, 0], [0, 15, 0]], [.38, .009])], crowns: ModelPart[] = [];
  for (let branch = 0; branch < 12; branch++) {
    const a = branch * 2.4, y = 3.2 + branch * .86, reach = 3.4 - branch * .19, p: Triple = [Math.cos(a) * reach, y + .25, Math.sin(a) * reach];
    parts.push(tapered("金松有轮生长叶束的木质侧枝", bark, [[0, y, 0], p], [.08 - branch * .004, .004]));
    const leaves: ModelPart[] = [];
    for (let node = 0; node < 2; node++) {
      const q = lerp([0, y, 0], p, .72 + node * .26);
      for (let index = 0; index < 14; index++) { const b = index * Math.PI / 7; leaves.push(flatLeaf("金松伞骨状轮生的扁平双针叶", q, [q[0] + Math.cos(b) * .105, q[1] + .05, q[2] + Math.sin(b) * .105], .005)); }
    }
    parts.push(combineMeshes("金松每条枝端完整两轮伞状双针叶", green, leaves));
    crowns.push(lobe("金松收分侧枝的低面密叶簇", green, [p[0] * .7, y + .15, p[2] * .7], [reach * .95, 1.5, reach * .8]));
    if (branch % 3 === 0) parts.push(lobe("金松直立卵形球果", seedColor, [p[0], p[1] + .025, p[2]], [.045, .085, .045]));
  }
  parts.push(combineMeshes("金松有清晰锥形收分的完整叶冠", green, crowns));
  return parts;
}

// 大型树保持成年米制；低面叶簇支承远景冠形，近处可辨真实叶序与生殖结构。
// https://www.nparks.gov.sg/florafaunaweb/flora/3/1/3106
// https://biodiversitysg.nparks.gov.sg/our-biodiversity/flowering-plants/trees/ketapang-/
// https://www.nparks.gov.sg/florafaunaweb/flora/2/9/2966
// https://www.ffpri.go.jp/kys/business/jumokuen/jumoku/zukan/metasekoia.html
// https://plantfinder.mobot.org/PlantFinderDetails.aspx?basic=on&isprofile=0&taxonid=290606
export const woodyExpansionBatchThreeDesigns: MasterNatureDesign[] = [
  design("rainWholeTree", "雨树", "植物", rainTree, ["Samanea saman", "低叉拱枝伞冠二回羽叶与厚长荚"]),
  design("angsanaWholeTree", "印度紫檀树", "植物", angsana, ["Pterocarpus indicus", "板根大冠与圆盘薄翅荚果"]),
  design("mahoganyWholeTree", "桃花心木", "植物", mahogany, ["Swietenia macrophylla", "高干板根偶数羽叶与直立五瓣蒴果"]),
  design("ironwoodWholeTree", "铁力木", "植物", ironwood, ["Mesua ferrea", "狭对生革叶与四瓣多雄蕊花"]),
  design("wingedDipterocarpWholeTree", "翼果龙脑香树", "植物", dipterocarp, ["Dipterocarpus alatus", "高干板根大叶与两长三短萼翅果"]),
  design("teakWholeTree", "柚木", "植物", teak, ["Tectona grandis", "大对生宽叶与顶端大圆锥果序"]),
  design("seaAlmondWholeTree", "榄仁树", "植物", seaAlmond, ["Terminalia catappa", "水平轮生分层枝端大倒卵叶与扁核果"]),
  design("beachCalophyllumWholeTree", "琼崖海棠", "植物", beachCalophyllum, ["Calophyllum inophyllum", "宽对生革叶与球形核果"]),
  design("schimaWholeTree", "木荷", "植物", schima, ["Schima superba", "锯齿革叶五瓣多雄蕊花与小木质果"]),
  design("chineseTallowWholeTree", "乌桕", "植物", chineseTallow, ["Triadica sebifera", "菱形互生叶与三裂蒴果白蜡籽"]),
  design("sandboxWholeTree", "响沙树", "植物", sandboxTree, ["Hura crepitans", "干面圆锥硬刺与放射纵沟扁果"]),
  design("balsaWholeTree", "轻木", "植物", balsaTree, ["Ochroma pyramidale", "板根长干大掌裂叶与直立长蒴果"]),
  design("cassiaWholeTree", "铁刀木", "植物", cassiaTree, ["Senna siamea", "偶数羽叶黄色蝶形花与细长荚果"]),
  design("africanTulipWholeTree", "火焰木", "植物", africanTulipTree, ["Spathodea campanulata", "羽状复叶枝端杯花与直立舟状蒴果"]),
  design("tetracentronWholeTree", "水青树", "植物", () => heartLeafTree("tetracentron"), ["Tetracentron sinense", "互生心形叶与下垂无瓣花穗"]),
  design("katsuraWholeTree", "连香树", "植物", () => heartLeafTree("katsura"), ["Cercidiphyllum japonicum", "双干对生心形叶与弯角蓇葖簇"]),
  design("zelkovaWholeTree", "榉树", "植物", zelkova, ["Zelkova serrata", "斜举叉枝的花瓶冠与小无翅坚果"]),
  design("dawnRedwoodWholeTree", "水杉", "植物", dawnRedwood, ["Metasequoia glyptostroboides", "高干板根与对生侧枝二列对生扁针叶"]),
  design("cryptomeriaWholeTree", "柳杉", "植物", cryptomeria, ["Cryptomeria japonica", "长直干螺旋侧枝与内弯镰状针叶"]),
  design("umbrellaPineWholeTree", "金松", "植物", umbrellaPine, ["Sciadopitys verticillata", "锥形高冠与枝端伞骨状双针叶轮"]),
];
