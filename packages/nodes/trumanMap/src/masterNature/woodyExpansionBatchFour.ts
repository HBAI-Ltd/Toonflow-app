import { cap, combineMeshes, design, leaf, lobe, needle, part, petals, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { compoundLeaf, flatLeaf } from "./ediblePlants";
import { branchPoint, crown, leafyShoot } from "./woodyExpansionBatchOne";
import { featherCrown } from "./woodyExpansionBatchTwo";
import { buttresses, canopy, forestCrown } from "./woodyExpansionBatchThree";

const bark = "#978c74";
const green = "#83956f";
const pale = "#b5c29c";
const seedColor = "#b6a583";
const flowerColor = "#cfc2a3";
const silver = "#b4bcb0";
const serrate: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.28, .17], [-.46, .32], [-.34, .41], [-.49, .58], [-.32, .66], [0, 1], [.32, .66], [.49, .58], [.34, .41], [.46, .32], [.28, .17]];

function mix(a: Triple, b: Triple, t: number): Triple { return a.map((value, axis) => value + (b[axis]! - value) * t) as Triple; }

function follicleCrown(): ModelPart[] {
  const parts: ModelPart[] = [tapered("黑板树轮生冠下的通直木质主干", bark, [[0, 0, 0], [0, 23, 0]], [.65, .018])], tips: Triple[] = [];
  for (let tier = 0; tier < 3; tier++) for (let axis = 0; axis < 4; axis++) {
    const a = axis * Math.PI / 2 + tier * .5, y = 10 + tier * 4.6, reach = 5.2 - tier, p: Triple = [Math.cos(a) * reach, y + .25, Math.sin(a) * reach]; tips.push(p);
    parts.push(tapered("黑板树同节成轮的水平承叶枝", bark, [[0, y, 0], p], [.13 - tier * .024, .006]));
    const leaves: ModelPart[] = [];
    for (let index = 0; index < 7; index++) { const b = index * Math.PI * 2 / 7; leaves.push(flatLeaf("黑板树一节上完整轮生的倒披针叶", p, [p[0] + Math.cos(b) * .19, p[1] + .025, p[2] + Math.sin(b) * .19], .055, "obovate")); }
    parts.push(combineMeshes("黑板树枝端一整轮七枚长叶", green, leaves));
    const pods: ModelPart[] = [];
    for (const side of [-1, 1]) pods.push(tapered("黑板树同一花基生出的成对细长蓇葖", seedColor, [p, [p[0] + side * .025, p[1] - .16, p[2]], [p[0] + side * .038, p[1] - .34, p[2] + .01]], [.0025, .002, .001]));
    parts.push(combineMeshes("黑板树完整一对细长下垂果荚", seedColor, pods));
  }
  parts.push(...buttresses(.65, 2.9, 3.2), canopy(tips, 3.8, 2.1));
  return parts;
}

function mangium(): ModelPart[] {
  const { parts, tips } = forestCrown(21.5, 5, .25, .07, "oval");
  for (const tip of tips) {
    const veins: ModelPart[] = [], phyllodes: ModelPart[] = [];
    for (let index = 0; index < 3; index++) {
      const a = index * Math.PI * 2 / 3, end: Triple = [tip[0] + Math.cos(a) * .24, tip[1] + .045, tip[2] + Math.sin(a) * .24]; phyllodes.push(flatLeaf("马占相思没有小叶的宽镰形叶状柄", tip, end, .075, [[0, 0], [-.1, .12], [-.36, .45], [-.42, .75], [0, 1], [.18, .67], [.16, .34]]));
      for (let vein = -1; vein <= 1; vein++) { const p = mix(tip, end, .8); veins.push(needle("马占相思叶状柄基出平行纵脉", pale, tip, [p[0] + Math.sin(a) * vein * .012, p[1] + .002, p[2] - Math.cos(a) * vein * .012], .0012)); }
    }
    parts.push(combineMeshes("马占相思完整镰形叶状柄", green, phyllodes), combineMeshes("马占相思叶状柄真实纵脉", pale, veins));
    const path: Triple[] = Array.from({ length: 18 }, (_, i) => [tip[0] + Math.cos(i * .6) * (.025 + i * .001), tip[1] - .025 - i * .006, tip[2] + Math.sin(i * .6) * (.025 + i * .001)]);
    parts.push(tapered("马占相思连续不间断的扭曲长荚", seedColor, [tip, ...path], [ .004, ...path.map(() => .004) ]));
  }
  return parts;
}

function kauri(): ModelPart[] {
  const parts: ModelPart[] = [tapered("贝壳杉成年长距离无枝的巨型柱干", bark, [[0, 0, 0], [0, 20, 0], [.02, 31, 0]], [1.65, 1.25, .25])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * Math.PI / 3, p: Triple = [Math.cos(a) * 7.3, 29 + axis % 3 * 1.25, Math.sin(a) * 7.3]; tips.push(p);
    const branchRoot: Triple = [0, 21.5 + axis * .45, 0], middle: Triple = [p[0] * .45, p[1] - 1.8, p[2] * .45];
    parts.push(tapered("贝壳杉成年树顶展开的粗壮冠枝", bark, [branchRoot, middle, p], [.65, .36, .015]));
    for (let twig = 0; twig < 2; twig++) { const root = branchPoint(branchRoot, middle, p, .8 + twig * .15, .45), b = a + (twig ? .8 : -.8); parts.push(...leafyShoot(root, [root[0] + Math.cos(b) * .34, root[1] + .055, root[2] + Math.sin(b) * .34], .07, .027, "oval", true)); }
    parts.push(lobe("贝壳杉枝端近球形的大木质雌球果", seedColor, [p[0], p[1] + .045, p[2]], [.085, .095, .085]));
  }
  parts.push(canopy(tips, 8.4, 6.8));
  return parts;
}

function rimu(): ModelPart[] {
  const parts: ModelPart[] = [tapered("泪柏成年下方长距离裸露的粗直干", bark, [[0, 0, 0], [0, 27.5, 0], [.02, 36, 0]], [.9, .6, .035])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * Math.PI / 3, p: Triple = [Math.cos(a) * 4.8, 32.5 + axis % 3 * .9, Math.sin(a) * 4.8]; tips.push(p);
    const branchRoot: Triple = [0, 28.7 + axis * .4, 0];
    parts.push(tapered("泪柏成年树冠上部稀疏开展的长侧枝", bark, [branchRoot, p], [.19, .009]));
    const leaves: ModelPart[] = [], stems: ModelPart[] = [];
    for (let twig = 0; twig < 4; twig++) {
      const root = mix(branchRoot, p, .5 + twig * .15), end: Triple = [root[0] + Math.cos(a) * .2, root[1] - 1.15 - twig % 2 * .45, root[2] + Math.sin(a) * .2];
      const middle: Triple = [root[0] + .12, root[1] - .4, root[2]];
      stems.push(tapered("泪柏直接悬自冠枝的连续细垂枝", green, [root, middle, end], [.007, .004, .0015]));
      for (let index = 0; index < 24; index++) { const t = (index + 1) / 26, q = branchPoint(root, middle, end, t, .35), b = index * 2.4; leaves.push(needle("成年泪柏覆瓦排列而贴近垂枝的短鳞锥叶", green, q, [q[0] + Math.cos(b) * .002, q[1] + .003, q[2] + Math.sin(b) * .002], .001)); }
    }
    parts.push(combineMeshes("泪柏一组完整悬垂光合叶枝", green, stems));
    for (let offset = 0; offset < leaves.length; offset += 48) parts.push(combineMeshes("泪柏悬垂枝上真实小型覆瓦鳞叶", green, leaves.slice(offset, offset + 48)));
  }
  parts.push(canopy(tips, 4.9, 3.1));
  return parts;
}

function bottleTree(): ModelPart[] {
  const parts: ModelPart[] = [part("昆士兰瓶树中部膨大而上下收分的完整干", "lathe", bark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .85, y: 0 }, { x: 1.55, y: 2.1 }, { x: 1.45, y: 4.1 }, { x: .66, y: 6.2 }, { x: .3, y: 8 }, { x: 0, y: 8.1 }] })], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, p: Triple = [Math.cos(a) * 3.6, 10.8 + axis % 2 * .8, Math.sin(a) * 3.6]; tips.push(p);
    const root: Triple = [0, 7.3, 0];
    parts.push(tapered("瓶树膨大干顶端伸出的木质骨干枝", bark, [root, p], [.24, .006]), ...leafyShoot(mix(root, p, .85), p, .1, .016, "oval"));
    const pods: ModelPart[] = [];
    for (let index = 0; index < 3; index++) { const b = a + index * Math.PI * 2 / 3; pods.push(tapered("瓶树成簇短舟形的黑色木质蓇葖", "#8e8c73", [p, [p[0] + Math.cos(b) * .035, p[1] + .015, p[2] + Math.sin(b) * .035], [p[0] + Math.cos(b) * .065, p[1] + .005, p[2] + Math.sin(b) * .065]], [.005, .012, .002])); }
    parts.push(combineMeshes("昆士兰瓶树一簇相连木质短果", "#8e8c73", pods));
  }
  parts.push(canopy(tips, 3.9, 2.7));
  return parts;
}

export function fiveLobedCalyx(root: Triple): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let shell = 0; shell < 2; shell++) for (let row = 0; row < 3; row++) for (let index = 0; index < 10; index++) {
    const a = index * Math.PI / 5, radius = [.002, .0055, .008][row]! - shell * .001;
    vertices.push({ x: root[0] + Math.cos(a) * radius, y: root[1] - (row === 0 ? 0 : row === 1 ? .009 : index % 2 ? .014 : .018), z: root[2] + Math.sin(a) * radius });
  }
  for (let row = 0; row < 2; row++) for (let index = 0; index < 10; index++) {
    const a = row * 10 + index, b = row * 10 + (index + 1) % 10, c = a + 10, d = b + 10;
    indices.push(a, b, d, a, d, c, a + 30, d + 30, b + 30, a + 30, c + 30, d + 30);
  }
  for (let index = 0; index < 10; index++) {
    const next = (index + 1) % 10;
    indices.push(index, index + 30, next + 30, index, next + 30, next);
    indices.push(index + 20, next + 20, next + 50, index + 20, next + 50, index + 50);
  }
  return part("槭叶瓶树具真实内腔和五裂萼缘的下垂钟花", "mesh", "#bc9c87", [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function mapleLeafBottleTree(): ModelPart[] {
  const { parts, tips } = forestCrown(19, 4.8, .23, .2, "palm");
  for (const tip of tips) {
    const branches: ModelPart[] = [], flowers: ModelPart[] = [];
    for (let index = 0; index < 6; index++) { const a = index * 2.4, p: Triple = [tip[0] + Math.cos(a) * .055, tip[1] + .035 + index % 3 * .035, tip[2] + Math.sin(a) * .055]; branches.push(needle("槭叶瓶树顶生疏圆锥花序的红色分梗", "#b49b83", tip, p, .002)); flowers.push(fiveLobedCalyx(p)); }
    parts.push(combineMeshes("槭叶瓶树完整顶生花序轴", "#b49b83", branches), combineMeshes("槭叶瓶树一簇五裂钟状萼花", "#bc9c87", flowers));
  }
  return parts;
}

function goldenTrumpetTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("黄花风铃木从地表起的分叉主干", bark, [[0, 0, 0], [.04, 6.5, 0], [0, 14.5, 0]], [.48, .29, .02])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, p: Triple = [Math.cos(a) * 4.2, 11.7 + axis % 3 * .9, Math.sin(a) * 4.2]; tips.push(p);
    parts.push(tapered("风铃木斜展的木质结果枝", bark, [[0, 5.5 + axis * .45, 0], p], [.17, .007]));
    for (let node = 0; node < 3; node++) {
      const root = mix([0, 5.5 + axis * .45, 0], p, .76 + node * .1), q: Triple = [root[0] + Math.cos(a) * .1, root[1] + .04, root[2] + Math.sin(a) * .1], leaves: ModelPart[] = [needle("风铃木掌状复叶的共同长叶柄", green, root, q, .003)];
      for (let finger = 0; finger < 5; finger++) { const b = a + (finger - 2) * .57; leaves.push(flatLeaf("风铃木掌状复叶中分离的长椭圆小叶", q, [q[0] + Math.cos(b) * .14, q[1] + .02, q[2] + Math.sin(b) * .14], .05, serrate)); }
      parts.push(combineMeshes("一片完整五小叶掌状风铃木复叶", green, leaves));
    }
    parts.push(cap("黄花风铃木真正开放的长喇叭花冠", flowerColor, p, .035, .07, 3), tapered("风铃木顶端下垂的细长蒴果", seedColor, [p, [p[0] + .015, p[1] - .19, p[2]], [p[0] + .025, p[1] - .33, p[2]]], [.005, .006, .002]));
  }
  parts.push(canopy(tips, 4.4, 3.1));
  return parts;
}

function rhodoleia(): ModelPart[] {
  const { parts, tips } = forestCrown(12.5, 3.6, .14, .07, "obovate");
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .065, tip[2]], perianths: ModelPart[] = [], filaments: ModelPart[] = [];
    parts.push(tapered("红花荷枝端向下弯的短花梗", bark, [tip, p], [.004, .002]));
    for (let index = 0; index < 5; index++) { const a = index * Math.PI * 2 / 5, q: Triple = [p[0] + Math.cos(a) * .015, p[1], p[2] + Math.sin(a) * .015]; for (let petal = 0; petal < 3; petal++) { const b = a + (petal - 1) * .4; perianths.push(flatLeaf("红花荷花头中扁带状长花瓣", q, [q[0] + Math.cos(b) * .016, q[1] - .035, q[2] + Math.sin(b) * .016], .006)); } for (let stamen = 0; stamen < 5; stamen++) { const b = a + stamen * .35; filaments.push(needle("红花荷下垂而外露的细长雄蕊", "#b3a38e", q, [q[0] + Math.cos(b) * .024, q[1] - .045, q[2] + Math.sin(b) * .024], .0012)); } }
    parts.push(combineMeshes("红花荷一整头下垂带状花瓣", "#bca18f", perianths), combineMeshes("红花荷真实伸出花瓣的雄蕊群", "#b3a38e", filaments));
  }
  return parts;
}

function elaeocarpus(): ModelPart[] {
  const { parts, tips } = forestCrown(16.5, 4.5, .18, .08, "obovate");
  for (const tip of tips) {
    const blossoms: ModelPart[] = [], axes: ModelPart[] = [];
    for (let row = 0; row < 5; row++) {
      const p: Triple = [tip[0] + row * .012, tip[1] - .04 - row * .045, tip[2]], q: Triple = [p[0] + .035, p[1] - .02, p[2]];
      axes.push(needle("杜英下垂总状花序的连续细轴", bark, row ? [p[0] - .012, p[1] + .045, p[2]] : tip, p, .002), needle("杜英单花与花序轴相连的小梗", bark, p, q, .0015));
      for (let petal = 0; petal < 5; petal++) { const a = petal * Math.PI * 2 / 5; for (let tooth = 0; tooth < 3; tooth++) { const b = a + (tooth - 1) * .23; blossoms.push(needle("大花杜英花瓣末端真实流苏状裂齿", flowerColor, [q[0] + Math.cos(a) * .006, q[1], q[2] + Math.sin(a) * .006], [q[0] + Math.cos(b) * .012, q[1] - .016, q[2] + Math.sin(b) * .012], .0018)); } }
    }
    parts.push(combineMeshes("大花杜英一整条相连的总状花序轴", bark, axes), combineMeshes("大花杜英全部五瓣花的流苏裂齿", flowerColor, blossoms));
  }
  return parts;
}

function paperbark(): ModelPart[] {
  const { parts, tips } = forestCrown(16, 4.1, .12, .016, "oval"), flakes: ModelPart[] = [];
  for (let index = 0; index < 22; index++) { const a = index * 2.4, y = .2 + index % 11 * .55, r = .71 - y * .035; flakes.push(flatLeaf("白千层主干真实卷起的薄层纸状树皮", [Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a) * (r + .06), y + .47, Math.sin(a) * (r + .06)], .19, "oval", .003)); }
  for (let offset = 0; offset < flakes.length; offset += 11) parts.push(combineMeshes("白千层一整组层叠剥离的纸质树皮", "#c2bc9f", flakes.slice(offset, offset + 11)));
  for (const tip of tips) {
    const filaments: ModelPart[] = [];
    parts.push(tapered("白千层连续穿过圆柱花穗的嫩枝轴", green, [tip, [tip[0], tip[1] + .15, tip[2]]], [.004, .002]));
    for (let index = 0; index < 50; index++) { const a = index * 2.4, y = tip[1] + .01 + index % 10 * .012; filaments.push(needle("白千层圆柱刷状花穗的放射雄蕊", flowerColor, [tip[0], y, tip[2]], [tip[0] + Math.cos(a) * .025, y + .008, tip[2] + Math.sin(a) * .025], .0012)); }
    parts.push(combineMeshes("白千层一整条真实雄蕊刷状花穗", flowerColor, filaments));
  }
  return parts;
}

function seaMango(): ModelPart[] {
  const { parts, tips } = forestCrown(13.5, 4, .22, .052, "obovate");
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .1, tip[2]];
    parts.push(tapered("海檬果短粗下垂的果柄", bark, [tip, p], [.006, .003]), lobe("海檬果近球形而一侧略隆起的大核果", seedColor, p, [.075, .09, .07]), petals(5, [tip[0] + .05, tip[1], tip[2]], .014, .032, 72, flowerColor));
  }
  return parts;
}

function silverTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("银树从地表直立而分出的灰色木质干", bark, [[0, 0, 0], [0, 5.8, 0], [0, 9.1, 0]], [.24, .12, .006])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, p: Triple = [Math.cos(a) * 2.2, 7.1 + axis % 3 * .55, Math.sin(a) * 2.2]; tips.push(p);
    parts.push(tapered("银树斜向上生长的粗木质枝", bark, [[0, 3.3 + axis * .45, 0], p], [.075, .008]));
    for (let twig = 0; twig < 2; twig++) {
      const root = mix([p[0] * .6, p[1] - .65, p[2] * .6], p, .35 + twig * .45), end: Triple = [root[0] + Math.cos(a) * .08, root[1] + .55, root[2] + Math.sin(a) * .08], leaves: ModelPart[] = [];
      parts.push(tapered("银树被完整叶片覆住的直立叶枝", bark, [root, end], [.009, .003]));
      for (let index = 0; index < 16; index++) { const base = mix(root, end, (index + 1) / 18), b = index * 2.4; leaves.push(flatLeaf("银树覆盖两面绒毛的狭披针形整叶", base, [base[0] + Math.cos(b) * .06, base[1] + .13, base[2] + Math.sin(b) * .06], .022)); }
      parts.push(combineMeshes("银树覆瓦向上排列的全部银灰叶", silver, leaves));
    }
    parts.push(lobe("银树冠端由苞片形成的卵形雌花果球", seedColor, [p[0], p[1] + .05, p[2]], [.06, .09, .06]));
  }
  const volumes = tips.map(p => lobe("银树直立密叶冠的低面体叶簇", silver, [p[0] * .8, p[1] + .18, p[2] * .8], [2.1, 2.9, 2.1]));
  parts.push(combineMeshes("保留细节叶序的银树完整银灰叶冠", silver, volumes));
  return parts;
}

function alder(): ModelPart[] {
  const { parts, tips } = forestCrown(18.5, 4.4, .095, .075, serrate);
  for (const tip of tips) {
    const cones: ModelPart[] = [], axes: ModelPart[] = [], florets: ModelPart[] = [];
    for (let index = 0; index < 3; index++) { const p: Triple = [tip[0] + index * .017, tip[1] - .04, tip[2]]; axes.push(needle("赤杨木质雌果序的短分梗", bark, tip, p, .0018)); cones.push(lobe("赤杨由木质鳞片构成的卵圆宿存雌果序", seedColor, p, [.012, .022, .012])); }
    for (let index = 0; index < 2; index++) {
      const root: Triple = [tip[0] + index * .022, tip[1], tip[2]], end: Triple = [root[0] + .013, root[1] - .11, root[2]]; axes.push(needle("赤杨柔软下垂的雄花序轴", bark, root, end, .002));
      for (let row = 0; row < 12; row++) { const p = mix(root, end, (row + 1) / 13); florets.push(lobe("赤杨雄柔荑花序紧密排列的小花鳞", flowerColor, p, [.006, .008, .006])); }
    }
    parts.push(combineMeshes("赤杨全部雌雄花果序相连细轴", bark, axes), combineMeshes("赤杨一簇小型木质雌球果", seedColor, cones), combineMeshes("赤杨完整下垂雄柔荑花序", flowerColor, florets));
  }
  return parts;
}

function euphratesPoplar(): ModelPart[] {
  const parts: ModelPart[] = [tapered("胡杨弯曲且分成高低两叉的老木质主干", bark, [[0, 0, 0], [.65, 3.5, -.2], [-.3, 7.6, .1], [.3, 12.5, 0]], [.75, .55, .31, .08])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 5.6 + axis * .7, 0], p: Triple = [Math.cos(a) * 4, 11.1 + axis % 3 * 1.1, Math.sin(a) * 4]; tips.push(p);
    const middle: Triple = [p[0] * .45, p[1] - 1.3, p[2] * .45];
    parts.push(tapered("胡杨不规则斜举的稀疏冠枝", bark, [root, middle, p], [.2, .1, .006]), ...leafyShoot(branchPoint(root, middle, p, .84, .45), p, .075, .065, [[0, 0], [-.38, .22], [-.5, .52], [-.24, .8], [0, 1], [.24, .8], [.5, .52], [.38, .22]]));
    const low = middle, end: Triple = [low[0] + Math.cos(a + .7) * .32, low[1] + .25, low[2] + Math.sin(a + .7) * .32];
    parts.push(...leafyShoot(low, end, .11, .018, "oval"));
  }
  parts.push(canopy(tips, 3.8, 2.8));
  return parts;
}

function chinaberry(): ModelPart[] {
  const parts: ModelPart[] = [tapered("苦楝低处叉开的完整木质干", bark, [[0, 0, 0], [0, 6, 0], [.03, 14, 0]], [.5, .3, .02])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 5 + axis * .4, 0], p: Triple = [Math.cos(a) * 4.8, 11.3 + axis % 3 * .9, Math.sin(a) * 4.8]; tips.push(p);
    parts.push(tapered("苦楝开展后上举的木质主枝", bark, [root, p], [.17, .007]));
    for (let node = 0; node < 2; node++) {
      const q = mix(root, p, .75 + node * .2), b = a + (node ? .8 : -.8), end: Triple = [q[0] + Math.cos(b) * .38, q[1] + .045, q[2] + Math.sin(b) * .38], pieces: ModelPart[] = [needle("苦楝二回羽叶的一级叶轴", green, q, end, .003)];
      for (let row = 0; row < 2; row++) for (const side of [-1, 1]) pieces.push(compoundLeaf(mix(q, end, .3 + row * .48), (b + side * 1.1) * 180 / Math.PI, .16, 1, true));
      parts.push(combineMeshes("一片完整二回羽状裂齿苦楝复叶", green, pieces));
    }
    const fruits: ModelPart[] = [], stalks: ModelPart[] = [];
    for (let index = 0; index < 10; index++) { const b = index * 2.4, q: Triple = [p[0] + Math.cos(b) * .075, p[1] - .035 - index % 4 * .035, p[2] + Math.sin(b) * .075]; fruits.push(lobe("苦楝疏松果簇中分离的卵球形核果", seedColor, q, [.015, .02, .015])); stalks.push(needle("苦楝果簇与木枝相连的细分梗", bark, p, q, .002)); }
    parts.push(combineMeshes("苦楝完整分枝果序轴", bark, stalks), combineMeshes("苦楝一整簇悬垂核果", seedColor, fruits));
  }
  parts.push(canopy(tips, 4.6, 3.3));
  return parts;
}

function elephantApple(): ModelPart[] {
  const { parts, tips } = forestCrown(15.5, 4.8, .34, .16, serrate);
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .12, tip[2]], sepals: ModelPart[] = [];
    parts.push(tapered("五桠果承托大聚合果的短粗果柄", bark, [tip, p], [.012, .008]));
    for (let index = 0; index < 5; index++) { const a = index * Math.PI * 2 / 5; sepals.push(lobe("五桠果包住果体的厚肉质宿存萼片", pale, [p[0] + Math.cos(a) * .045, p[1], p[2] + Math.sin(a) * .045], [.09, .14, .06], [0, -a * 180 / Math.PI, 0])); }
    parts.push(combineMeshes("由五片真实厚萼形成的完整五桠果", pale, sepals));
  }
  return parts;
}

function sandalwood(): ModelPart[] {
  const { parts, tips } = forestCrown(10.2, 3.4, .07, .03, "oval", true);
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .035, tip[2]], blooms: ModelPart[] = [];
    parts.push(tapered("檀香树卵圆小核果的短柄", bark, [tip, p], [.002, .0012]), lobe("檀香树一枚具有宿存小花被的核果", seedColor, p, [.01, .012, .01]));
    for (let flower = 0; flower < 5; flower++) { const a = flower * 2.4, q: Triple = [tip[0] + Math.cos(a) * .018, tip[1] + flower % 2 * .013, tip[2] + Math.sin(a) * .018]; for (let lobeIndex = 0; lobeIndex < 4; lobeIndex++) { const b = lobeIndex * Math.PI / 2; blooms.push(leaf("檀香树聚伞小花的四裂花被", flowerColor, q, .0025, .005, [80, -b * 180 / Math.PI, 0], "YXZ")); } }
    parts.push(combineMeshes("檀香树一整簇四裂小花", flowerColor, blooms));
  }
  return parts;
}

function tamarisk(): ModelPart[] {
  const parts: ModelPart[] = [tapered("柽柳弯曲分叉的独立木质主干", bark, [[0, 0, 0], [.24, 2.6, .05], [0, 5.8, 0]], [.26, .16, .02])];
  for (let axis = 0; axis < 7; axis++) {
    const a = axis * 2.4, root: Triple = [0, 2.4 + axis * .18, 0], tip: Triple = [Math.cos(a) * 2.7, 6.2 + axis % 3 * .45, Math.sin(a) * 2.7];
    const middle: Triple = [tip[0] * .5, 5.5, tip[2] * .5];
    parts.push(tapered("柽柳拱曲而末端柔垂的细长主枝", bark, [root, middle, tip], [.075, .035, .003]));
    const branchlets: ModelPart[] = [], scales: ModelPart[] = [], flowers: ModelPart[] = [];
    for (let twig = 0; twig < 4; twig++) {
      const p = branchPoint(root, middle, tip, .5 + twig * .15, .5), b = a + (twig % 2 ? .7 : -.7), end: Triple = [p[0] + Math.cos(b) * .55, p[1] - .18, p[2] + Math.sin(b) * .55]; branchlets.push(tapered("柽柳光合细绿枝", green, [p, end], [.003, .0012]));
      for (let index = 0; index < 16; index++) { const q = mix(p, end, (index + 1) / 18), c = index * 2.4; scales.push(needle("柽柳紧贴枝条的毫米级覆瓦鳞叶", green, q, [q[0] + Math.cos(c) * .002, q[1] + .002, q[2] + Math.sin(c) * .002], .001)); }
      for (let index = 0; index < 9; index++) { const q = mix(p, end, .65 + index * .035), c = index * 2.4; flowers.push(lobe("柽柳细枝末端穗状花序中的微小花", "#bcafa3", [q[0] + Math.cos(c) * .004, q[1], q[2] + Math.sin(c) * .004], [.004, .005, .004])); }
    }
    parts.push(combineMeshes("柽柳完整相连的透空细绿枝", green, branchlets), combineMeshes("柽柳冠枝全部真实覆瓦鳞叶", green, scales), combineMeshes("柽柳完整细长的小花穗群", "#bcafa3", flowers));
  }
  return parts;
}

function goldenShowerTree(): ModelPart[] {
  const { parts, tips } = featherCrown(13.5, 4.4, .36, 3, false, false);
  parts.push(canopy(tips, 4.5, 3.2));
  for (const tip of tips) {
    const stem: Triple = [tip[0] + .015, tip[1] - .6, tip[2]], blooms: ModelPart[] = [], stalks: ModelPart[] = [];
    parts.push(tapered("腊肠树长总状花序悬垂的主轴", bark, [tip, stem], [.005, .002]), tapered("腊肠树圆柱形而非扁平的长荚果", seedColor, [[tip[0] + .04, tip[1], tip[2]], [tip[0] + .055, tip[1] - .6, tip[2]]], [.014, .011]));
    for (let flower = 0; flower < 10; flower++) { const a = flower * 2.4, root = mix(tip, stem, .1 + flower * .085), p: Triple = [root[0] + Math.cos(a) * .06, root[1] - .015, root[2] + Math.sin(a) * .06]; stalks.push(needle("腊肠树花序上独立细长的花柄", bark, root, p, .0015)); for (let petal = 0; petal < 5; petal++) { const b = petal * Math.PI * 2 / 5; blooms.push(leaf("腊肠树独立五瓣花的圆卵花瓣", flowerColor, p, .015, .022, [85, -b * 180 / Math.PI, 0], "YXZ")); } }
    parts.push(combineMeshes("腊肠树整条下垂花序上的独立花柄", bark, stalks), combineMeshes("腊肠树一整条五瓣花串", flowerColor, blooms));
  }
  return parts;
}

function skunkTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("掌叶苹婆具有粗大根颈的完整直干", bark, [[0, 0, 0], [0, 6, 0], [0, 18, 0]], [.7, .46, .02])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 6.5 + axis * .5, 0], p: Triple = [Math.cos(a) * 5, 14.5 + axis % 3 * 1.2, Math.sin(a) * 5]; tips.push(p);
    parts.push(tapered("掌叶苹婆开展的大木质冠枝", bark, [root, p], [.23, .009]));
    for (let node = 0; node < 2; node++) {
      const base = mix(root, p, .8 + node * .15), end: Triple = [base[0] + Math.cos(a) * .14, base[1] + .04, base[2] + Math.sin(a) * .14], pieces: ModelPart[] = [needle("掌状复叶共同的长叶柄", green, base, end, .004)];
      for (let leaflet = 0; leaflet < 7; leaflet++) { const b = a + (leaflet - 3) * .6; pieces.push(flatLeaf("掌叶苹婆放射状分离的长披针小叶", end, [end[0] + Math.cos(b) * .2, end[1] + .04, end[2] + Math.sin(b) * .2], .05)); }
      parts.push(combineMeshes("掌叶苹婆一片完整七小叶掌状复叶", green, pieces));
    }
    for (let follicle = 0; follicle < 3; follicle++) {
      const b = a + follicle * Math.PI * 2 / 3, q: Triple = [p[0] + Math.cos(b) * .065, p[1], p[2] + Math.sin(b) * .065];
      parts.push(tapered("掌叶苹婆木质蓇葖到果柄基部的连接", bark, [p, q], [.008, .004]), part("掌叶苹婆真实中空的舟形木质蓇葖果壁", "lathe", "#b59e88", q, [.6, 1, 1.7], [0, -b * 180 / Math.PI, 0], { profile: [{ x: 0, y: 0 }, { x: .01, y: 0 }, { x: .034, y: .035 }, { x: .03, y: .041 }, { x: .009, y: .01 }, { x: 0, y: .01 }] }), lobe("掌叶苹婆开放果壁内的黑色种子", "#808879", [q[0], q[1] + .02, q[2]], [.016, .02, .026]));
    }
  }
  parts.push(canopy(tips, 5.1, 3.8));
  return parts;
}

// 保持成年树冠与根干比例；形态参考植物园/保育机构，不把季节、开闭或性别扩成多个主项。
// https://www.nparks.gov.sg/florafaunaweb/flora/2/7/2705
// https://www.nzpcn.org.nz/flora/species/dacrydium-cupressinum/
// https://www.nzpcn.org.nz/flora/species/agathis-australis/
// https://pza.sanbi.org/leucadendron-argenteum
export const woodyExpansionBatchFourDesigns: MasterNatureDesign[] = [
  design("blackboardWholeTree", "黑板树", "植物", follicleCrown, ["Alstonia scholaris", "糖胶树", "轮生长叶与同基部双细长蓇葖"]),
  design("mangiumWholeTree", "马占相思", "植物", mangium, ["Acacia mangium", "宽镰形叶状柄纵脉与扭曲长荚"]),
  design("kauriWholeTree", "贝壳杉", "植物", kauri, ["Agathis australis", "粗柱长裸干与对生宽革叶球果"]),
  design("rimuWholeTree", "泪柏（Rimu）", "植物", rimu, ["Dacrydium cupressinum", "成年高裸干与细长覆瓦鳞叶垂枝"]),
  design("queenslandBottleWholeTree", "昆士兰瓶树", "植物", bottleTree, ["Brachychiton rupestris", "中部膨大瓶干狭叶与舟形木质短果"]),
  design("mapleLeafBottleWholeTree", "槭叶瓶树", "植物", mapleLeafBottleTree, ["Brachychiton acerifolius", "澳洲火焰瓶木", "大掌裂叶与五裂钟状红萼"]),
  design("goldenTrumpetWholeTree", "黄花风铃木", "植物", goldenTrumpetTree, ["Handroanthus chrysanthus", "五小叶掌状复叶喇叭花与长蒴果"]),
  design("rhodoleiaWholeTree", "红花荷", "植物", rhodoleia, ["Rhodoleia championii", "枝端下垂的头状长带瓣花序"]),
  design("largeFlowerElaeocarpusWholeTree", "大花杜英", "植物", elaeocarpus, ["Elaeocarpus grandiflorus", "倒卵大叶与真实流苏裂瓣总状花序"]),
  design("paperbarkWholeTree", "白千层", "植物", paperbark, ["Melaleuca cajuputi", "层叠纸状树皮与白色雄蕊刷状花穗"]),
  design("seaMangoWholeTree", "海檬果", "植物", seaMango, ["Cerbera odollam", "长倒披针叶与独立大核果"]),
  design("silverWholeTree", "银树", "植物", silverTree, ["Leucadendron argenteum", "直立覆瓦银灰长叶与苞片卵形雌球果"]),
  design("alderWholeTree", "赤杨", "植物", alder, ["Alnus glutinosa", "圆齿叶与木质雌果序下垂雄柔荑序"]),
  design("euphratesPoplarWholeTree", "胡杨", "植物", euphratesPoplar, ["Populus euphratica", "曲干稀冠与同株宽卵狭披针异形叶"]),
  design("chinaberryWholeTree", "苦楝", "植物", chinaberry, ["Melia azedarach", "二回羽状裂齿叶与疏松卵球核果簇"]),
  design("elephantAppleWholeTree", "五桠果", "植物", elephantApple, ["Dillenia indica", "粗齿大叶与五片厚肉质宿存萼包果"]),
  design("sandalwoodWholeTree", "檀香树", "植物", sandalwood, ["Santalum album", "对生小革叶与四裂聚伞小花核果"]),
  design("tamariskWholeTree", "柽柳", "植物", tamarisk, ["Tamarix chinensis", "曲枝上微型覆瓦鳞叶与细花穗"]),
  design("goldenShowerWholeTree", "腊肠树", "植物", goldenShowerTree, ["Cassia fistula", "下垂长五瓣花串与圆柱长荚"]),
  design("palmLeafSterculiaWholeTree", "掌叶苹婆", "植物", skunkTree, ["Sterculia foetida", "七小叶掌状复叶与中空舟状蓇葖黑籽"]),
];
