import { combineMeshes, design, leaf, lobe, needle, part, radialLeaves, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { compoundLeaf, flatLeaf } from "./ediblePlants";

const bark = "#968b72";
const green = "#82996d";
const pale = "#b8c39e";
const warm = "#c3ac7a";
type LeafForm = Parameters<typeof flatLeaf>[4];

const pointedOval: LeafForm = [[0, 0], [-.27, .12], [-.48, .4], [-.41, .68], [-.16, .91], [0, 1], [.16, .91], [.41, .68], [.48, .4], [.27, .12]];
const narrowSerrate: LeafForm = [[0, 0], [-.2, .16], [-.37, .24], [-.25, .3], [-.47, .4], [-.3, .47], [-.48, .56], [-.29, .63], [-.38, .72], [-.2, .77], [0, 1], [.2, .77], [.38, .72], [.29, .63], [.48, .56], [.3, .47], [.47, .4], [.25, .3], [.37, .24], [.2, .16]];
const broadSerrate: LeafForm = [[0, 0], [-.3, .1], [-.39, .24], [-.32, .29], [-.5, .39], [-.4, .45], [-.49, .6], [-.35, .63], [-.36, .77], [-.18, .81], [0, 1], [.18, .81], [.36, .77], [.35, .63], [.49, .6], [.4, .45], [.5, .39], [.32, .29], [.39, .24], [.3, .1]];

function at(start: Triple, end: Triple, t: number): Triple {
  return start.map((value, axis) => value + (end[axis]! - value) * t) as Triple;
}

export function branchPoint(root: Triple, middle: Triple, end: Triple, t: number, middleAt = .65): Triple {
  return t < middleAt ? at(root, middle, t / middleAt) : at(middle, end, (t - middleAt) / (1 - middleAt));
}

export function leafyShoot(root: Triple, end: Triple, length: number, width: number, form: LeafForm, opposite = false): ModelPart[] {
  const woody: ModelPart[] = [tapered("与结果枝连续连接的叶枝", bark, [root, end], [.009, .002])];
  const leaves: ModelPart[] = [], angle = Math.atan2(end[2] - root[2], end[0] - root[0]);
  for (let index = 0; index < 6; index++) {
    const p = at(root, end, (index + 1) / 7), side = index % 2 ? 1 : -1, a = angle + side * 1.04;
    const base: Triple = [p[0] + Math.cos(a) * .018, p[1] + .012, p[2] + Math.sin(a) * .018];
    woody.push(needle("连到叶基的独立叶柄", green, p, base, .002));
    const blade = flatLeaf("有厚度的完整物种叶片", base, [base[0] + Math.cos(a) * length, base[1] + length * .19, base[2] + Math.sin(a) * length], width, form);
    leaves.push(blade);
    if (opposite) {
      const q: Triple = [p[0] - Math.cos(a) * .018, p[1] + .012, p[2] - Math.sin(a) * .018];
      woody.push(needle("对生叶另一侧的叶柄", green, p, q, .002));
      leaves.push(flatLeaf("成对排列的对生叶片", q, [q[0] - Math.cos(a) * length, q[1] + length * .19, q[2] - Math.sin(a) * length], width, form));
    }
  }
  const result = [combineMeshes("完整木质叶枝及相连叶柄", bark, woody)];
  for (let index = 0; index < leaves.length; index += 12) result.push(combineMeshes("结果树梢上的完整叶片组", green, leaves.slice(index, index + 12)));
  return result;
}

export function crown(height: number, spread: number, length: number, width: number, form: LeafForm, opposite = false): { parts: ModelPart[]; tips: Triple[] } {
  const parts: ModelPart[] = [tapered("根颈逐渐收分的完整果树主干", bark, [[0, 0, 0], [.045, height * .38, -.015], [0, height * .81, 0], [.02, height, .015]], [height * .045, height * .034, height * .017, .009])];
  const tips: Triple[] = [];
  for (let index = 0; index < 6; index++) {
    const a = index * 2.39996, root: Triple = [.02, height * (.36 + index * .065), 0];
    const p: Triple = [Math.cos(a) * spread, height * (.72 + index % 3 * .09), Math.sin(a) * spread];
    const middle: Triple = [p[0] * .65, p[1] - height * .12, p[2] * .65];
    parts.push(tapered("由树干伸出的结果骨干枝", bark, [root, middle, p], [height * .019, height * .011, .007]));
    tips.push(p);
    for (let twig = 0; twig < 3; twig++) {
      const start = branchPoint(root, middle, p, .58 + twig * .15), b = a + (twig - 1) * .9;
      const tip: Triple = [start[0] + Math.cos(b) * .37, start[1] + .13 + twig * .055, start[2] + Math.sin(b) * .37];
      parts.push(...leafyShoot(start, tip, length, width, form, opposite));
    }
  }
  return { parts, tips };
}

function pendant(root: Triple, drop: number, offset = .03): { stem: ModelPart; fruit: Triple } {
  const fruit: Triple = [root[0] + offset, root[1] - drop, root[2] + .025];
  return { stem: tapered("从真实枝条垂出的果梗", bark, [root, fruit], [.004, .002]), fruit };
}

function roundedFruit(root: Triple, size: Triple, color = warm): ModelPart {
  return lobe("挂在枝条上的完整果实", color, root, size);
}

function fruitWithCalyx(root: Triple, size: Triple, lobes: number): ModelPart[] {
  return [roundedFruit(root, size), radialLeaves(lobes, [root[0], root[1] + size[1] * .43, root[2]], size[0] * .21, size[0] * .42, 78, green)];
}

function pearTree(): ModelPart[] {
  const { parts, tips } = crown(4.1, 1.15, .09, .055, broadSerrate);
  for (const tip of tips) {
    const { stem, fruit: p } = pendant(tip, .12);
    parts.push(stem, part("有细颈与膨大果腹的完整梨果", "lathe", warm, [p[0], p[1] - .08, p[2]], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .028, y: .004 }, { x: .046, y: .04 }, { x: .034, y: .074 }, { x: .017, y: .11 }, { x: .012, y: .14 }, { x: 0, y: .142 }] }));
  }
  return parts;
}

function peachTree(): ModelPart[] {
  const { parts, tips } = crown(3.2, 1.35, .16, .035, narrowSerrate);
  for (const p of tips) {
    const fruit: Triple = [p[0], p[1] - .04, p[2]];
    parts.push(tapered("桃的短果梗", bark, [p, fruit], [.003, .002]), ...[-1, 1].map(side => lobe("合成带腹缝桃果的肉质半瓣", "#bca18c", [fruit[0] + side * .018, fruit[1] - .03, fruit[2]], [.065, .085, .085])));
  }
  return parts;
}

function apricotTree(): ModelPart[] {
  const { parts, tips } = crown(3.7, 1.25, .085, .075, broadSerrate);
  for (const tip of tips) {
    const { stem, fruit } = pendant(tip, .036, .01);
    parts.push(stem, roundedFruit(fruit, [.057, .06, .054]), tapered("杏果由梗到果尖的浅腹缝", "#a89571", [[fruit[0], fruit[1] + .027, fruit[2]], [fruit[0] + .026, fruit[1], fruit[2]], [fruit[0], fruit[1] - .028, fruit[2]]], [.0012, .0014, .0012]));
  }
  return parts;
}

function plumTree(): ModelPart[] {
  const { parts, tips } = crown(3.5, 1.1, .075, .038, broadSerrate);
  for (const tip of tips) for (const side of [-1, 1]) {
    const p: Triple = [tip[0] + side * .035, tip[1] - .07, tip[2] + .02];
    parts.push(tapered("李果成对短果梗", bark, [tip, p], [.0025, .0015]), roundedFruit(p, [.045, .062, .043], "#93968b"));
  }
  return parts;
}

function mumeTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("梅树曲折多节的木质主干", bark, [[0, 0, 0], [.18, .9, -.08], [-.12, 1.5, .02], [.1, 2.15, 0]], [.18, .12, .07, .018])];
  for (let axis = 0; axis < 5; axis++) {
    const a = axis * 2.4, root: Triple = [0, 1.1 + axis * .15, 0], tip: Triple = [Math.cos(a) * .95, 2.1 + axis % 2 * .35, Math.sin(a) * .95];
    const middle: Triple = [tip[0] * .5, tip[1] - .35, tip[2] * .5];
    parts.push(tapered("梅树斜出的弯曲结果长枝", bark, [root, middle, tip], [.05, .022, .005]), ...leafyShoot(branchPoint(root, middle, tip, .6, .5), tip, .065, .036, narrowSerrate));
    for (let index = 0; index < 3; index++) { const p = branchPoint(root, middle, tip, .45 + index * .2, .5); parts.push(tapered("梅的极短果柄", bark, [p, [p[0], p[1] - .022, p[2] + .02]], [.002, .0015]), roundedFruit([p[0], p[1] - .04, p[2] + .02], [.034, .037, .034], pale)); }
  }
  return parts;
}

function cherryTree(): ModelPart[] {
  const { parts, tips } = crown(4.3, 1.4, .105, .05, narrowSerrate);
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 4; index++) { const a = index * Math.PI / 2, p: Triple = [tip[0] + Math.cos(a) * .035, tip[1] - .065, tip[2] + Math.sin(a) * .035]; stems.push(needle("伞簇樱桃的长而细果梗", bark, tip, p, .002)); fruits.push(roundedFruit(p, [.025, .026, .025], "#ad8e81")); }
    parts.push(combineMeshes("樱桃短枝上一簇独立长梗", bark, stems), combineMeshes("四枚独立而不粘连的樱桃", "#ad8e81", fruits));
  }
  return parts;
}

function persimmonTree(): ModelPart[] {
  const { parts, tips } = crown(4.8, 1.5, .145, .083, pointedOval);
  for (const tip of tips) { const { stem, fruit } = pendant(tip, .065); parts.push(stem, ...fruitWithCalyx(fruit, [.105, .073, .102], 4)); }
  return parts;
}

function jujubeTree(): ModelPart[] {
  const { parts, tips } = crown(3.8, 1.05, .055, .026, pointedOval);
  const thorns: ModelPart[] = [];
  for (let axis = 0; axis < tips.length; axis++) {
    const tip = tips[axis]!, root: Triple = [tip[0] * .65, tip[1] - .2, tip[2] * .65];
    for (let index = 0; index < 4; index++) { const p = at(root, tip, .2 + index * .2), q: Triple = [p[0] + .02, p[1] - .03, p[2] + .015]; parts.push(roundedFruit(q, [.025, .038, .024], "#a8987b")); thorns.push(needle("枣叶腋长直托叶刺", bark, p, [p[0] + .035, p[1] + .016, p[2]], .004), needle("枣果与短枝相接的短果梗", bark, p, q, .002)); }
    parts.push(tapered("与枣果短枝相接的结果枝", bark, [root, tip], [.007, .002]));
  }
  parts.push(combineMeshes("枣枝全部真实托叶刺", bark, thorns));
  return parts;
}

function pomegranateTree(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let axis = 0; axis < 5; axis++) {
    const a = axis * 2.4, end: Triple = [Math.cos(a) * .68, 2.3 + axis % 2 * .28, Math.sin(a) * .68];
    const stemRoot: Triple = [Math.cos(a) * .08, 0, Math.sin(a) * .08], middle: Triple = [end[0] * .4, 1.05, end[2] * .4];
    parts.push(tapered("石榴基部丛生的细木质干", bark, [stemRoot, middle, end], [.045, .025, .006]));
    for (let twig = 0; twig < 3; twig++) { const root = branchPoint(stemRoot, middle, end, .55 + twig * .15, .4), tip: Triple = [root[0] + Math.cos(a + twig) * .35, root[1] + .27, root[2] + Math.sin(a + twig) * .35]; parts.push(...leafyShoot(root, tip, .065, .019, "oval", true)); }
    const p: Triple = [end[0], end[1] - .06, end[2]];
    parts.push(tapered("石榴短硬果柄", bark, [end, p], [.005, .003]), roundedFruit(p, [.12, .12, .115], "#b49b80"));
    const teeth: ModelPart[] = [];
    for (let index = 0; index < 6; index++) { const b = index * Math.PI / 3; teeth.push(needle("石榴果端宿存冠状花萼裂片", "#ad9876", [p[0] + Math.cos(b) * .009, p[1] - .049, p[2] + Math.sin(b) * .009], [p[0] + Math.cos(b) * .018, p[1] - .074, p[2] + Math.sin(b) * .018], .012)); }
    parts.push(combineMeshes("石榴果端开口萼冠", "#ad9876", teeth));
  }
  return parts;
}

function figTree(): ModelPart[] {
  const { parts, tips } = crown(3.4, 1.35, .2, .19, "palm");
  for (const tip of tips) for (let index = 0; index < 2; index++) {
    const root: Triple = [tip[0] + (index ? .035 : -.035), tip[1] - .025, tip[2]];
    parts.push(tapered("无花果叶腋极短的隐头果柄", bark, [tip, root], [.004, .002]), part("带狭颈的梨状隐头花序果", "lathe", "#a8aa85", [root[0], root[1] - .064, root[2]], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .025, y: .006 }, { x: .035, y: .03 }, { x: .026, y: .05 }, { x: .01, y: .065 }, { x: 0, y: .068 }] }));
  }
  return parts;
}

function citrusTree(kind: "mandarin" | "lemon" | "pomelo"): ModelPart[] {
  const pomelo = kind === "pomelo", lemon = kind === "lemon", { parts, tips } = crown(pomelo ? 4.6 : lemon ? 3.6 : 3.1, pomelo ? 1.4 : .95, pomelo ? .18 : .1, pomelo ? .095 : lemon ? .045 : .035, pointedOval);
  for (const tip of tips) {
    const { stem, fruit: p } = pendant(tip, pomelo ? .14 : .06);
    parts.push(stem);
    if (lemon) parts.push(part("两端收尖并具乳突的柠檬", "lathe", "#c4ba8b", [p[0], p[1] - .05, p[2]], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .008, y: .004 }, { x: .024, y: .018 }, { x: .034, y: .042 }, { x: .032, y: .075 }, { x: .016, y: .099 }, { x: .005, y: .111 }, { x: 0, y: .113 }] }));
    else parts.push(roundedFruit(p, pomelo ? [.2, .23, .2] : [.072, .055, .072], warm));
    if (pomelo) {
      const wings: ModelPart[] = [];
      for (let index = 0; index < 3; index++) {
        const a = index * Math.PI * 2 / 3, r: Triple = [tip[0] + Math.cos(a) * .025, tip[1] + .008, tip[2] + Math.sin(a) * .025], end: Triple = [r[0] + Math.cos(a) * .04, r[1] + .012, r[2] + Math.sin(a) * .04];
        wings.push(needle("树梢到有翼叶柄的短叶枝", green, tip, r, .003), flatLeaf("柚叶柄上显著的宽翼", r, end, .026, "oval"), flatLeaf("与宽翼叶柄相接的大叶片", end, [end[0] + Math.cos(a) * .18, end[1] + .03, end[2] + Math.sin(a) * .18], .095, pointedOval));
      }
      parts.push(combineMeshes("连接完整叶片的柚树有翼叶柄", green, wings));
    }
  }
  if (lemon) {
    const thorns: ModelPart[] = [];
    for (const tip of tips) thorns.push(needle("柠檬嫩枝上的硬直刺", bark, [tip[0] * .8, tip[1] - .1, tip[2] * .8], [tip[0] * .8 + .04, tip[1] - .07, tip[2] * .8], .007));
    parts.push(combineMeshes("柠檬枝全部直刺", bark, thorns));
  }
  return parts;
}

function pinnateTree(kind: "lychee" | "longan" | "carambola"): ModelPart[] {
  const carambola = kind === "carambola", lychee = kind === "lychee", height = carambola ? 4 : lychee ? 5.1 : 5.7;
  const parts: ModelPart[] = [tapered("羽叶果树完整主干", bark, [[0, 0, 0], [0, height * .6, 0], [.02, height, 0]], [.22, .12, .025])];
  for (let branch = 0; branch < 6; branch++) {
    const a = branch * 2.4, p: Triple = [Math.cos(a) * 1.4, height * (.68 + branch % 3 * .1), Math.sin(a) * 1.4], root: Triple = [0, height * (.35 + branch * .055), 0];
    const middle: Triple = [p[0] * .6, p[1] - .22, p[2] * .6];
    parts.push(tapered("真实连接复叶与花果序的木质主枝", bark, [root, middle, p], [.075, .035, .006]));
    for (let node = 0; node < 4; node++) {
      const origin = branchPoint(root, middle, p, .45 + node * .16, .6), direction = a + (node % 2 ? .96 : -.96);
      if (carambola) parts.push(compoundLeaf(origin, direction * 180 / Math.PI, .28, 3));
      else {
        const length = lychee ? .42 : .5, end: Triple = [origin[0] + Math.cos(direction) * length, origin[1] + .05, origin[2] + Math.sin(direction) * length];
        const pieces: ModelPart[] = [needle("没有顶生小叶的偶数羽状共同叶轴", green, origin, end, .0025)];
        for (let pair = 0; pair < (lychee ? 2 : 3); pair++) for (const side of [-1, 1]) {
          const base = at(origin, end, .3 + pair * (lychee ? .4 : .26)), b = direction + side * 1.15;
          pieces.push(flatLeaf(lychee ? "荔枝成对披针形小叶" : "龙眼成对长椭圆小叶", base, [base[0] + Math.cos(b) * (lychee ? .14 : .17), base[1] + .024, base[2] + Math.sin(b) * (lychee ? .14 : .17)], lychee ? .033 : .052, pointedOval));
        }
        parts.push(combineMeshes(lychee ? "荔枝一片完整偶数羽状复叶" : "龙眼一片完整偶数羽状复叶", green, pieces));
      }
    }
    if (carambola) {
      for (const t of [.48, .8]) { const q = branchPoint(root, middle, p, t, .6); parts.push(tapered("杨桃从老枝连接到果体的短果梗", bark, [q, [q[0], q[1] - .028, q[2]]], [.003, .002]), part("老枝着生有五条尖棱的完整杨桃", "extrude", warm, [q[0], q[1] - .09, q[2]], [1, 1, 1], [90, 0, 0], { depth: .13, profile: Array.from({ length: 10 }, (_, i) => { const b = i * Math.PI / 5, r = i % 2 ? .022 : .05; return { x: Math.cos(b) * r, y: Math.sin(b) * r }; }) })); }
    } else {
      const stalks: ModelPart[] = [], fruits: ModelPart[] = [], rough: ModelPart[] = [];
      for (let fruit = 0; fruit < 7; fruit++) { const b = fruit * 2.4, q: Triple = [p[0] + Math.cos(b) * .08, p[1] - .09 - fruit % 3 * .035, p[2] + Math.sin(b) * .08]; stalks.push(needle("圆锥果序中独立分叉的细梗", bark, p, q, .003)); fruits.push(roundedFruit(q, lychee ? [.034, .039, .034] : [.028, .029, .028], lychee ? "#b29884" : "#b5ab8b")); if (lychee) for (let index = 0; index < 8; index++) { const c = index * 2.4; rough.push(lobe("荔枝壳表面立体突起", "#b29884", [q[0] + Math.cos(c) * .013, q[1] - .006 + index % 3 * .006, q[2] + Math.sin(c) * .013], [.007, .007, .007])); } }
      parts.push(combineMeshes("与枝端相接的完整分枝果梗", bark, stalks), combineMeshes("分离悬垂的完整聚生果实", lychee ? "#b29884" : "#b5ab8b", fruits));
      if (lychee) for (let offset = 0; offset < rough.length; offset += 28) parts.push(combineMeshes("荔枝果簇真实疣凸壳面", "#b29884", rough.slice(offset, offset + 28)));
    }
  }
  return parts;
}

function mangoTree(): ModelPart[] {
  const { parts, tips } = crown(5.8, 1.65, .27, .052, pointedOval);
  for (const tip of tips) {
    const end: Triple = [tip[0] + .055, tip[1] - .25, tip[2]];
    parts.push(tapered("芒果顶生圆锥花果序的细长轴", bark, [tip, [tip[0] + .02, tip[1] - .12, tip[2]], end], [.005, .003, .002]), lobe("一侧凸起且末端弯喙的扁长芒果", warm, [end[0] + .015, end[1] - .05, end[2]], [.09, .145, .067], [0, 0, -18]), needle("芒果果端偏向一侧的短喙", warm, [end[0] + .027, end[1] - .095, end[2]], [end[0] + .048, end[1] - .11, end[2]], .018));
  }
  return parts;
}

function avocadoTree(): ModelPart[] {
  const { parts, tips } = crown(5.1, 1.4, .2, .085, pointedOval);
  for (const tip of tips) { const { stem, fruit: p } = pendant(tip, .19); parts.push(stem, part("长梗悬挂的梨形牛油果", "lathe", "#99a17d", [p[0], p[1] - .12, p[2]], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .036, y: .008 }, { x: .055, y: .045 }, { x: .048, y: .085 }, { x: .023, y: .125 }, { x: .012, y: .165 }, { x: 0, y: .17 }] })); }
  return parts;
}

function guavaTree(): ModelPart[] {
  const { parts, tips } = crown(3.5, 1.1, .13, .061, pointedOval, true);
  for (const tip of tips) { const { stem, fruit: p } = pendant(tip, .05); parts.push(stem, roundedFruit(p, [.07, .083, .068], pale), radialLeaves(5, [p[0], p[1] - .035, p[2]], .008, .014, 104, "#a39d78")); }
  return parts;
}

function loquatTree(): ModelPart[] {
  const { parts, tips } = crown(4.4, 1.05, .29, .095, narrowSerrate);
  for (const tip of tips) {
    const stalks: ModelPart[] = [], fruits: ModelPart[] = [], stars: ModelPart[] = [];
    for (let index = 0; index < 5; index++) { const a = index * 2.4, p: Triple = [tip[0] + Math.cos(a) * .043, tip[1] - .08 - index % 2 * .035, tip[2] + Math.sin(a) * .043]; stalks.push(needle("枇杷顶端短圆锥果序的粗小分梗", bark, tip, p, .004)); fruits.push(roundedFruit(p, [.038, .052, .038])); for (let s = 0; s < 5; s++) { const b = s * Math.PI * 2 / 5; stars.push(leaf("枇杷果端内折的宿存萼片", "#9a9578", [p[0] + Math.cos(b) * .004, p[1] - .023, p[2] + Math.sin(b) * .004], .004, .007, [150, -90 - b * 180 / Math.PI, 0], "YXZ")); } }
    parts.push(combineMeshes("枇杷连在冠顶的果序梗", bark, stalks), combineMeshes("同一顶生果序的独立长圆枇杷果", warm, fruits), combineMeshes("每枚枇杷真实下端萼片", "#9a9578", stars));
  }
  return parts;
}

function spinyFruit(root: Triple, size: Triple, count: number, pointed: boolean): ModelPart[] {
  const spines: ModelPart[] = [];
  for (let index = 0; index < count; index++) {
    const a = index * 2.39996, h = -.83 + index / (count - 1) * 1.66, r = Math.sqrt(1 - h * h);
    const p: Triple = [root[0] + Math.cos(a) * r * size[0] * .43, root[1] + h * size[1] * .43, root[2] + Math.sin(a) * r * size[2] * .43];
    const end: Triple = [root[0] + (p[0] - root[0]) * (pointed ? 1.19 : 1.08), root[1] + (p[1] - root[1]) * (pointed ? 1.12 : 1.04), root[2] + (p[2] - root[2]) * (pointed ? 1.19 : 1.08)];
    spines.push(needle(pointed ? "榴莲果壳坚实三棱尖刺" : "菠萝蜜表皮密集低短突起", pale, p, end, pointed ? .027 : .017));
  }
  return [roundedFruit(root, size, "#adb18b"), combineMeshes("完整果壳上的真实立体突起", pale, spines)];
}

function jackfruitTree(): ModelPart[] {
  const { parts } = crown(6.2, 1.7, .18, .09, "oval");
  for (let index = 0; index < 4; index++) {
    const a = index * 2.4, root: Triple = [Math.cos(a) * .13, 1.25 + index * .65, Math.sin(a) * .13], p: Triple = [Math.cos(a) * .25, root[1] - .25, Math.sin(a) * .25];
    parts.push(tapered("直接生于主干的粗壮菠萝蜜果柄", bark, [root, p], [.021, .014]), ...spinyFruit([p[0], p[1] - .23, p[2]], [.31, .59, .32], 64, false));
  }
  return parts;
}

function durianTree(): ModelPart[] {
  const { parts, tips } = crown(7.1, 1.8, .16, .047, pointedOval);
  for (const tip of tips.slice(0, 4)) {
    const root: Triple = [tip[0] * .55, tip[1] - .45, tip[2] * .55], p: Triple = [root[0], root[1] - .22, root[2]];
    parts.push(tapered("榴莲老枝下侧的粗长果梗", bark, [[0, root[1] + .12, 0], root, p], [.025, .012, .01]), ...spinyFruit([p[0], p[1] - .13, p[2]], [.25, .34, .24], 70, true));
  }
  return parts;
}

function mangosteenTree(): ModelPart[] {
  const { parts, tips } = crown(4.8, 1.12, .21, .1, pointedOval, true);
  for (const tip of tips) { const { stem, fruit: p } = pendant(tip, .055); parts.push(stem, ...fruitWithCalyx(p, [.071, .069, .07], 4)); }
  return parts;
}

function cashewTree(): ModelPart[] {
  const { parts, tips } = crown(4.2, 1.6, .16, .095, "obovate");
  for (const tip of tips) {
    const { stem, fruit: p } = pendant(tip, .05);
    parts.push(stem, part("顶端膨大而基部收细的腰果梨果柄", "lathe", warm, [p[0], p[1] - .09, p[2]], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .015, y: .002 }, { x: .035, y: .025 }, { x: .031, y: .064 }, { x: .012, y: .092 }, { x: 0, y: .095 }] }), tapered("位于膨大果柄末端的弯肾形真正坚果", "#9a9985", [[p[0], p[1] - .095, p[2]], [p[0] + .025, p[1] - .102, p[2]], [p[0] + .035, p[1] - .125, p[2]], [p[0] + .015, p[1] - .135, p[2]]], [.01, .014, .014, .008]));
  }
  return parts;
}

function seaBuckthorn(): ModelPart[] {
  const parts: ModelPart[] = [], fruit: ModelPart[] = [], thorns: ModelPart[] = [], stalks: ModelPart[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, end: Triple = [Math.cos(a) * .65, 1.65 + axis % 3 * .16, Math.sin(a) * .65], root: Triple = [Math.cos(a) * .04, 0, Math.sin(a) * .04];
    const middle: Triple = [end[0] * .48, .75, end[2] * .48];
    parts.push(tapered("沙棘丛生上举的木质枝", bark, [root, middle, end], [.036, .019, .004]), ...leafyShoot(branchPoint(root, middle, end, .55, .48), end, .066, .008, "oval"));
    for (let row = 0; row < 6; row++) {
      const p = branchPoint(root, middle, end, .38 + row * .08, .48);
      for (const side of [-1, 1]) { const q: Triple = [p[0] + Math.cos(a + side * 1.2) * .016, p[1], p[2] + Math.sin(a + side * 1.2) * .016]; fruit.push(roundedFruit(q, [.008, .01, .008], warm)); stalks.push(needle("紧贴沙棘木枝的真实短果梗", bark, p, q, .0015)); }
      thorns.push(needle("沙棘枝端或短枝硬刺", bark, p, [p[0] + Math.cos(a) * .045, p[1] + .025, p[2] + Math.sin(a) * .045], .005));
    }
  }
  parts.push(combineMeshes("沙棘枝上全部独立木质刺", bark, thorns), combineMeshes("沙棘全部小浆果相接的短果梗", bark, stalks));
  for (let index = 0; index < fruit.length; index += 30) parts.push(combineMeshes("紧贴木枝的密集小浆果", warm, fruit.slice(index, index + 30)));
  return parts;
}

// 形态依据：大学/植物园的叶序、着果位置与果体描述；仅原创简化几何，不下载模型或图像。
// https://ask.ifas.ufl.edu/publication/MG370  https://ask.ifas.ufl.edu/publication/MG269
// https://landscapeplants.oregonstate.edu/plants/ficus-carica
// https://www.nparks.gov.sg/florafaunaweb/flora/2/9/2927
export const woodyExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("pearWholeTree", "梨树", "植物", pearTree, ["Pyrus communis", "细颈梨果与互生锯齿叶"]),
  design("peachWholeTree", "桃树", "植物", peachTree, ["Prunus persica", "长披针锯齿叶与具腹缝桃果"]),
  design("apricotWholeTree", "杏树", "植物", apricotTree, ["Prunus armeniaca", "宽卵叶与短梗杏果"]),
  design("plumWholeTree", "李树", "植物", plumTree, ["Prunus domestica", "椭圆锯齿叶与成对长圆核果"]),
  design("mumeWholeTree", "梅树", "植物", mumeTree, ["Prunus mume", "曲折枝干与短柄小核果"]),
  design("sweetCherryWholeTree", "樱桃树", "植物", cherryTree, ["Prunus avium", "长果梗伞簇核果与锯齿长叶"]),
  design("persimmonWholeTree", "柿树", "植物", persimmonTree, ["Diospyros kaki", "大卵叶与四裂宿存萼"]),
  design("jujubeWholeTree", "枣树", "植物", jujubeTree, ["Ziziphus jujuba", "托叶刺小叶与长圆核果"]),
  design("pomegranateWholeTree", "石榴树", "植物", pomegranateTree, ["Punica granatum", "丛生木干对生窄叶与冠状萼筒"]),
  design("commonFigWholeTree", "无花果树", "植物", figTree, ["Ficus carica", "掌裂大叶与叶腋隐头果"]),
  design("mandarinWholeTree", "橘树", "植物", () => citrusTree("mandarin"), ["Citrus reticulata", "窄小互生叶与扁圆柑果"]),
  design("lemonWholeTree", "柠檬树", "植物", () => citrusTree("lemon"), ["Citrus limon", "硬枝刺与双端乳突长柑果"]),
  design("pomeloWholeTree", "柚树", "植物", () => citrusTree("pomelo"), ["Citrus maxima", "宽翼叶柄大革叶与大型柑果"]),
  design("lycheeWholeTree", "荔枝树", "植物", () => pinnateTree("lychee"), ["Litchi chinensis", "偶数羽状叶与具疣凸的圆锥果簇"]),
  design("longanWholeTree", "龙眼树", "植物", () => pinnateTree("longan"), ["Dimocarpus longan", "大羽状叶与细分枝圆果簇"]),
  design("mangoWholeTree", "芒果树", "植物", mangoTree, ["Mangifera indica", "长披针革叶与偏喙扁长核果"]),
  design("avocadoWholeTree", "牛油果树", "植物", avocadoTree, ["Persea americana", "全缘革质叶与长梗梨形浆果"]),
  design("guavaWholeTree", "番石榴树", "植物", guavaTree, ["Psidium guajava", "对生革叶与果端宿存萼"]),
  design("loquatWholeTree", "枇杷树", "植物", loquatTree, ["Eriobotrya japonica", "长锯齿革叶与顶生短圆锥果序"]),
  design("carambolaWholeTree", "杨桃树", "植物", () => pinnateTree("carambola"), ["Averrhoa carambola", "奇数羽状复叶与老枝着生五棱果"]),
  design("jackfruitWholeTree", "菠萝蜜树", "植物", jackfruitTree, ["Artocarpus heterophyllus", "主干直接着生大长圆聚花果"]),
  design("durianWholeTree", "榴莲树", "植物", durianTree, ["Durio zibethinus", "老枝下垂果柄与硬刺大果壳"]),
  design("mangosteenWholeTree", "山竹树", "植物", mangosteenTree, ["Garcinia mangostana", "对生厚叶与四裂宽萼球形浆果"]),
  design("cashewWholeTree", "腰果树", "植物", cashewTree, ["Anacardium occidentale", "倒卵叶膨大果柄与末端肾形坚果"]),
  design("seaBuckthornWholeShrub", "沙棘", "植物", seaBuckthorn, ["Hippophae rhamnoides", "细窄银叶硬刺与紧贴枝条的密果"]),
];
