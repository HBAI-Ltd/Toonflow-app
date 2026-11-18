import { cap, combineMeshes, design, leaf, lobe, needle, part, petals, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { compoundLeaf, flatLeaf } from "./ediblePlants";
import { branchPoint, leafyShoot } from "./woodyExpansionBatchOne";
import { featherCrown, palmFrond } from "./woodyExpansionBatchTwo";
import { canopy, forestCrown } from "./woodyExpansionBatchThree";
import { Euler, Quaternion, Vector3 } from "three";

const bark = "#988d75";
const green = "#82966f";
const pale = "#b6c39f";
const seedColor = "#b6a98a";
const white = "#d2ccb3";
const serrate: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.23, .15], [-.43, .28], [-.32, .38], [-.5, .5], [-.37, .62], [-.35, .75], [0, 1], [.35, .75], [.37, .62], [.5, .5], [.32, .38], [.43, .28], [.23, .15]];

function mix(a: Triple, b: Triple, t: number): Triple { return a.map((value, axis) => value + (b[axis]! - value) * t) as Triple; }

function chineseWingnut(): ModelPart[] {
  const { parts, tips } = featherCrown(20.5, 5.4, .43, 4);
  parts.push(canopy(tips, 5.5, 4.4));
  for (const tip of tips) {
    const axis: ModelPart[] = [], nuts: ModelPart[] = [], wings: ModelPart[] = [];
    for (let index = 0; index < 12; index++) {
      const p: Triple = [tip[0] + Math.sin(index * .4) * .035, tip[1] - .045 - index * .03, tip[2]], prev: Triple = index ? [tip[0] + Math.sin((index - 1) * .4) * .035, tip[1] - .045 - (index - 1) * .03, tip[2]] : tip;
      axis.push(needle("枫杨长串果序连续相连的下垂果轴", bark, prev, p, .002)); nuts.push(lobe("枫杨每枚两翅之间的小坚果", seedColor, p, [.005, .006, .005]));
      for (const side of [-1, 1]) wings.push(flatLeaf("枫杨坚果两侧相接的半圆薄翅", p, [p[0] + side * .014, p[1] + .004, p[2]], .014, [[0, 0], [-.42, .12], [-.5, .52], [-.3, .9], [.3, .9], [.5, .52], [.42, .12]]));
    }
    parts.push(combineMeshes("枫杨完整下垂长果序轴", bark, axis), combineMeshes("枫杨果序全部分离小坚果", seedColor, nuts));
    for (let offset = 0; offset < wings.length; offset += 12) parts.push(combineMeshes("枫杨每枚坚果完整成对薄翅", pale, wings.slice(offset, offset + 12)));
  }
  return parts;
}

function europeanAsh(): ModelPart[] {
  const { parts, tips } = featherCrown(23.5, 5.3, .36, 3);
  parts.push(canopy(tips, 5.4, 4.7));
  for (const tip of tips) {
    const wings: ModelPart[] = [], stems: ModelPart[] = [], nuts: ModelPart[] = [];
    for (let index = 0; index < 14; index++) { const a = index * 2.4, p: Triple = [tip[0] + Math.cos(a) * .04, tip[1] - .025 - index % 4 * .018, tip[2] + Math.sin(a) * .04], end: Triple = [p[0] + .018, p[1] - .045, p[2]]; stems.push(needle("白蜡树翅果束独立短果柄", bark, tip, p, .0015)); wings.push(flatLeaf("白蜡树顶端收尖的单侧狭长果翅", p, end, .008)); nuts.push(lobe("白蜡树翅果靠近梗端的长形种核", seedColor, [p[0] + .003, p[1] - .009, p[2]], [.004, .013, .003])); }
    parts.push(combineMeshes("白蜡树一整束相连的果梗", bark, stems), combineMeshes("白蜡树成束下垂的狭长单翅果", pale, wings), combineMeshes("位于单翅基部的白蜡树种核", seedColor, nuts), lobe("白蜡树枝端明显的黑色冬芽", "#798273", [tip[0], tip[1] + .008, tip[2]], [.007, .013, .007]));
  }
  return parts;
}

function hackberry(): ModelPart[] {
  const { parts, tips } = forestCrown(18.5, 5.3, .085, .04, serrate), warts: ModelPart[] = [];
  for (let index = 0; index < 32; index++) { const a = index * 2.4, y = .2 + index % 12 * .45, r = .83 - y * .035; warts.push(lobe("朴树主干隆起的木栓质斑块", bark, [Math.cos(a) * r, y, Math.sin(a) * r], [.13, .22, .09], [0, 90 - a * 180 / Math.PI, 0])); }
  parts.push(combineMeshes("朴树主干实际隆起的全部木栓斑", bark, warts));
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 4; index++) { const a = index * Math.PI / 2, p: Triple = [tip[0] + Math.cos(a) * .018, tip[1] - .025, tip[2] + Math.sin(a) * .018]; stems.push(needle("朴树叶腋单果的细长果梗", bark, tip, p, .0015)); fruits.push(lobe("朴树叶腋单生的球形小核果", seedColor, p, [.008, .009, .008])); }
    parts.push(combineMeshes("朴树独立叶腋果梗", bark, stems), combineMeshes("朴树逐枚分离的小核果", seedColor, fruits));
  }
  return parts;
}

function kousaDogwood(): ModelPart[] {
  const { parts, tips } = forestCrown(9.8, 3.6, .11, .055, "oval", true);
  for (const tip of tips) {
    parts.push(petals(4, tip, .032, .065, 80, white), lobe("四照花四枚总苞中央的密集小花头", pale, [tip[0], tip[1] + .012, tip[2]], [.012, .014, .012]));
    const p: Triple = [tip[0] + .035, tip[1] - .065, tip[2]], carpels: ModelPart[] = [];
    parts.push(tapered("四照花球形聚合果的独立长柄", bark, [tip, p], [.0025, .0015]));
    for (let index = 0; index < 20; index++) { const a = index * 2.4, h = -.8 + index / 19 * 1.6, r = Math.sqrt(1 - h * h) * .014; carpels.push(lobe("四照花聚合果表面的独立肉质心皮", "#b4a18c", [p[0] + Math.cos(a) * r, p[1] + h * .014, p[2] + Math.sin(a) * r], [.008, .009, .008])); }
    parts.push(combineMeshes("一整枚分粒球形四照花聚合果", "#b4a18c", carpels));
  }
  return parts;
}

function hollyTree(): ModelPart[] {
  const thornLeaf: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.28, .12], [-.5, .15], [-.25, .3], [-.5, .43], [-.28, .53], [-.47, .73], [-.2, .75], [0, 1], [.2, .75], [.47, .73], [.28, .53], [.5, .43], [.25, .3], [.5, .15], [.28, .12]], { parts, tips } = forestCrown(10.5, 3.4, .085, .043, thornLeaf);
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 5; index++) { const a = index * Math.PI * 2 / 5, p: Triple = [tip[0] + Math.cos(a) * .018, tip[1] - .018, tip[2] + Math.sin(a) * .018]; stems.push(needle("冬青叶腋圆果的独立短梗", bark, tip, p, .0015)); fruits.push(lobe("冬青叶腋一枚独立球形核果", "#b49a86", p, [.009, .009, .009])); }
    parts.push(combineMeshes("冬青枝条实际连接的小果梗", bark, stems), combineMeshes("冬青与刺状革叶相伴的球果群", "#b49a86", fruits));
  }
  return parts;
}

function photinia(): ModelPart[] {
  const { parts, tips } = forestCrown(10.6, 3.6, .16, .052, serrate);
  for (const tip of tips) {
    const stems: ModelPart[] = [], flowers: ModelPart[] = [];
    for (let index = 0; index < 8; index++) { const a = index * 2.4, p: Triple = [tip[0] + Math.cos(a) * .065, tip[1] + .025 + index % 3 * .008, tip[2] + Math.sin(a) * .065]; stems.push(needle("石楠顶生平顶复伞房花序的细轴", bark, tip, p, .0015)); for (let petal = 0; petal < 5; petal++) flowers.push(leaf("石楠每朵花中独立的圆卵形花瓣", white, p, .0035, .005, [80, petal * 72, 0], "YXZ")); }
    parts.push(combineMeshes("石楠完整平顶多花伞房序轴", bark, stems), combineMeshes("石楠花序中全部独立五瓣小花", white, flowers));
  }
  return parts;
}

function fringeTree(): ModelPart[] {
  const { parts, tips } = forestCrown(9.6, 3.3, .12, .055, "oval", true);
  for (const tip of tips) {
    const petals: ModelPart[] = [], stalks: ModelPart[] = [];
    for (let flower = 0; flower < 9; flower++) { const a = flower * 2.4, p: Triple = [tip[0] + Math.cos(a) * .06, tip[1] - flower % 3 * .027, tip[2] + Math.sin(a) * .06]; stalks.push(needle("流苏树短圆锥花序中相连的细花柄", bark, tip, p, .0015)); for (let strip = 0; strip < 4; strip++) { const b = strip * Math.PI / 2; petals.push(leaf("流苏树花冠真实狭长带状裂片", white, p, .0025, .026, [115, -b * 180 / Math.PI, 0], "YXZ")); } }
    parts.push(combineMeshes("流苏树完整疏松下垂花序轴", bark, stalks), combineMeshes("流苏树每朵四裂的狭长带状花冠", white, petals));
  }
  return parts;
}

function emmenopterys(): ModelPart[] {
  const { parts, tips } = forestCrown(20.2, 4.9, .17, .085, "oval", true);
  for (const tip of tips) {
    const p: Triple = [tip[0] + .035, tip[1] + .025, tip[2]], stems: ModelPart[] = [], florets: ModelPart[] = [];
    const bract = flatLeaf("香果树仅一枚萼片扩大而形成的白色叶状萼", p, [p[0] + .075, p[1] + .025, p[2]], .045); bract.color = white;
    parts.push(tapered("香果树膨大花萼对应的短花梗", bark, [tip, p], [.003, .002]), bract);
    for (let flower = 0; flower < 7; flower++) { const a = flower * 2.4, q: Triple = [tip[0] + Math.cos(a) * .045, tip[1] + .04 + flower % 3 * .018, tip[2] + Math.sin(a) * .045]; stems.push(needle("香果树顶生圆锥花序的细分梗", bark, tip, q, .0015)); for (let lobeIndex = 0; lobeIndex < 5; lobeIndex++) florets.push(leaf("香果树小花五裂花冠", white, q, .0025, .006, [75, lobeIndex * 72, 0], "YXZ")); }
    parts.push(combineMeshes("香果树一整簇圆锥花序分梗", bark, stems), combineMeshes("香果树膨大单萼旁的完整小花序", white, florets));
  }
  return parts;
}

function rosetteConifer(kind: "goldenLarch" | "cedar"): ModelPart[] {
  const cedar = kind === "cedar", height = cedar ? 25 : 22, parts: ModelPart[] = [tapered(cedar ? "雪松直立而顶端柔弯的完整干" : "金钱松直立高大的木质主干", bark, [[0, 0, 0], [0, height * .82, 0], [cedar ? .4 : 0, height, 0]], [.7, .21, .009])], volumes: ModelPart[] = [];
  for (let axis = 0; axis < 12; axis++) {
    const a = axis * 2.4, y = 5 + axis * 1.4, reach = 5.6 - axis * .31, root: Triple = [0, y, 0], end: Triple = [Math.cos(a) * reach, y - (cedar ? .55 : .12), Math.sin(a) * reach];
    parts.push(tapered(cedar ? "雪松平展后下垂的长侧枝" : "金钱松平展的木质侧枝", bark, [root, end], [.14 - axis * .008, .005]));
    const twigs: ModelPart[] = [], needles: ModelPart[] = [];
    for (let node = 0; node < 3; node++) {
      const p = mix(root, end, .55 + node * .2), q: Triple = [p[0] + Math.cos(a + .6) * .15, p[1] - .035, p[2] + Math.sin(a + .6) * .15]; twigs.push(needle("有轮簇短枝的独立针叶木质小枝", bark, p, q, .004));
      for (let index = 0; index < 20; index++) { const b = index * Math.PI / 10; needles.push(cedar ? needle("雪松在短枝端密集成簇的硬针叶", green, q, [q[0] + Math.cos(b) * .032, q[1] + .012, q[2] + Math.sin(b) * .032], .0015) : leaf("金钱松短枝端柔软扁平的线形簇叶", green, q, .0025, .05, [70, 90 - b * 180 / Math.PI, 0], "YXZ")); }
    }
    parts.push(combineMeshes("针叶树实际相连的全部木质短枝", bark, twigs));
    for (let offset = 0; offset < needles.length; offset += cedar ? 60 : 30) parts.push(combineMeshes(cedar ? "雪松每个短枝端的完整针叶簇" : "金钱松每个短枝端的完整扁叶轮", green, needles.slice(offset, offset + (cedar ? 60 : 30))));
    volumes.push(lobe("针叶大乔木层层收分的密冠枝簇", green, [end[0] * .7, y + .1, end[2] * .7], [reach * 1.1, cedar ? 2.2 : 1.7, reach * .8]));
    if (axis % 3 === 0) parts.push(part(cedar ? "雪松枝上直立桶形球果" : "金钱松枝上直立尖卵形球果", "lathe", seedColor, [end[0], end[1], end[2]], [1, 1, 1], [0, 0, 0], { profile: cedar ? [{ x: 0, y: 0 }, { x: .033, y: .012 }, { x: .037, y: .065 }, { x: .029, y: .105 }, { x: 0, y: .11 }] : [{ x: 0, y: 0 }, { x: .025, y: .005 }, { x: .031, y: .033 }, { x: .02, y: .065 }, { x: 0, y: .085 }] }));
  }
  parts.push(combineMeshes("针叶大乔木有清晰分枝层次的整体叶冠", green, volumes));
  return parts;
}

function hopHornbeam(): ModelPart[] {
  const { parts, tips } = forestCrown(16.3, 4.3, .1, .05, serrate);
  for (const tip of tips) {
    const pods: ModelPart[] = [], axes: ModelPart[] = [];
    for (let index = 0; index < 7; index++) { const a = index * 2.4, p: Triple = [tip[0] + Math.cos(a) * .012, tip[1] - .025 - index * .013, tip[2] + Math.sin(a) * .012], end: Triple = [p[0] + Math.cos(a) * .009, p[1] - .026, p[2] + Math.sin(a) * .009]; axes.push(needle("铁木啤酒花状果序连续下垂的主轴", bark, index ? [tip[0] + Math.cos((index - 1) * 2.4) * .012, tip[1] - .025 - (index - 1) * .013, tip[2] + Math.sin((index - 1) * 2.4) * .012] : tip, p, .0015)); pods.push(tapered("铁木坚果外包的尖卵形纸质囊苞", seedColor, [p, mix(p, end, .55), end], [.0015, .008, .0012])); }
    parts.push(combineMeshes("铁木完整下垂串状果序轴", bark, axes), combineMeshes("铁木由真实膨大囊苞构成的整串果序", seedColor, pods));
  }
  return parts;
}

function smokeTree(): ModelPart[] {
  const { parts, tips } = forestCrown(7.5, 2.8, .08, .06, "obovate");
  for (const tip of tips) {
    const plume: ModelPart[] = [], fruits: ModelPart[] = [];
    for (let axis = 0; axis < 28; axis++) { const a = axis * 2.4, r = Math.sqrt(axis / 28) * .18, end: Triple = [tip[0] + Math.cos(a) * r, tip[1] + .06 + axis % 5 * .03, tip[2] + Math.sin(a) * r]; plume.push(needle("黄栌不育花梗伸长后形成的真实细羽毛果梗", "#b5ad9c", tip, end, .0015)); if (axis % 7 === 0) fruits.push(lobe("黄栌羽毛果序中少量独立小核果", seedColor, end, [.005, .006, .005])); }
    parts.push(combineMeshes("黄栌顶端如烟雾般展开的完整羽毛状果梗", "#b5ad9c", plume), combineMeshes("黄栌羽毛果序中的少数小果", seedColor, fruits));
  }
  return parts;
}

function fishtailPalm(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let stem = 0; stem < 3; stem++) {
    const root: Triple = [(stem - 1) * .5, 0, stem % 2 * .28], top: Triple = [root[0] + (stem - 1) * .22, 8.2 + stem * .9, root[2]], tips: ModelPart[] = [];
    parts.push(tapered("鱼尾葵自基部丛生的独立木质秆", bark, [root, top], [.16, .11]));
    for (let frond = 0; frond < 4; frond++) {
      const a = frond * Math.PI / 2 + stem, end: Triple = [top[0] + Math.cos(a) * 2.7, top[1] + .35, top[2] + Math.sin(a) * 2.7], middle: Triple = [top[0] + Math.cos(a) * 1.2, top[1] + 1.2, top[2] + Math.sin(a) * 1.2];
      parts.push(tapered("鱼尾葵二回羽叶的弧形一级叶轴", bark, [top, middle, end], [.035, .019, .003]));
      const pinnae: ModelPart[] = [], leaflets: ModelPart[] = [];
      for (let pinna = 0; pinna < 3; pinna++) for (const side of [-1, 1]) { const p = branchPoint(top, middle, end, .3 + pinna * .25, .45), b = a + side * 1.15, q: Triple = [p[0] + Math.cos(b) * .72, p[1] - .1, p[2] + Math.sin(b) * .72]; pinnae.push(needle("鱼尾葵每一支相连的次级羽轴", green, p, q, .006)); for (let leaflet = 0; leaflet < 3; leaflet++) { const base = mix(p, q, .3 + leaflet * .28), c = b + (leaflet % 2 ? .7 : -.7); leaflets.push(flatLeaf("鱼尾葵具有截形裂齿端部的楔形小叶", base, [base[0] + Math.cos(c) * .22, base[1] + .035, base[2] + Math.sin(c) * .22], .16, [[0, 0], [-.22, .24], [-.5, .85], [-.36, .78], [-.22, 1], [0, .86], [.18, 1], [.34, .79], [.5, .87], [.22, .24]])); } }
      parts.push(combineMeshes("鱼尾葵一片完整二回羽叶次级支轴", green, pinnae));
      for (let offset = 0; offset < leaflets.length; offset += 12) parts.push(combineMeshes("鱼尾葵完整鱼尾状小叶群", green, leaflets.slice(offset, offset + 12)));
    }
    for (let fruit = 0; fruit < 10; fruit++) { const a = fruit * 2.4, p: Triple = [top[0] + Math.cos(a) * .15, top[1] - .5 - fruit % 4 * .14, top[2] + Math.sin(a) * .15]; tips.push(needle("鱼尾葵干上悬垂果序分轴", bark, top, p, .005), lobe("鱼尾葵成串的球形核果", seedColor, p, [.024, .025, .024])); }
    parts.push(combineMeshes("鱼尾葵每根秆下方独立连接的果穗", seedColor, tips));
  }
  return parts;
}

function trianglePalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("三角椰子从地表起的正常圆形木质干", bark, [[0, 0, 0], [0, 5.9, 0]], [.28, .21]), part("三角椰子由三列厚叶基形成的三棱干头", "extrude", bark, [0, 6.25, 0], [1, 1, 1], [-90, 0, 0], { depth: 1.1, profile: [{ x: -.32, y: -.23 }, { x: .32, y: -.23 }, { x: 0, y: .4 }] })];
  for (let rank = 0; rank < 3; rank++) for (let leafIndex = 0; leafIndex < 3; leafIndex++) parts.push(...palmFrond([0, 6.4 + leafIndex * .15, 0], rank * Math.PI * 2 / 3, 2.9 + leafIndex * .15, 1.3 + leafIndex * .55, 12, .045));
  return parts;
}

function foxtailPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("狐尾椰子光滑而基部稍鼓的直立干", bark, [[0, 0, 0], [0, 8.8, 0]], [.23, .16]), tapered("狐尾椰子细长绿色冠轴", green, [[0, 8.5, 0], [0, 9.7, 0]], [.18, .13])];
  for (let frond = 0; frond < 8; frond++) {
    const a = frond * 2.4, root: Triple = [0, 9.6, 0], middle: Triple = [Math.cos(a) * 1.2, 10.7, Math.sin(a) * 1.2], end: Triple = [Math.cos(a) * 3.2, 9.3, Math.sin(a) * 3.2], leaves: ModelPart[] = [];
    parts.push(tapered("狐尾椰子宽弧下垂的完整羽叶轴", bark, [root, middle, end], [.04, .025, .003]));
    for (let index = 0; index < 40; index++) {
      const t = (index + 1) / 42, p = branchPoint(root, middle, end, t, .38), b = index * 2.4, length = .6 * Math.sin(t * Math.PI), start = t < .38 ? root : middle, finish = t < .38 ? middle : end, tangent = new Vector3(finish[0] - start[0], finish[1] - start[1], finish[2] - start[2]).normalize(), across = new Vector3(-Math.sin(a), 0, Math.cos(a)), normal = new Vector3().crossVectors(tangent, across).normalize(), lean = 20 * Math.PI / 180;
      const direction = tangent.clone().multiplyScalar(Math.sin(lean)).addScaledVector(across, Math.cos(lean) * Math.cos(b)).addScaledVector(normal, Math.cos(lean) * Math.sin(b)), blade = leaf("狐尾椰子沿真实叶轴全角度放射的蓬松羽片", green, p, .043, length), angles = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, length, .043 * .06).normalize(), direction.normalize()));
      blade.rotation = { x: angles.x * 180 / Math.PI, y: angles.y * 180 / Math.PI, z: angles.z * 180 / Math.PI }; leaves.push(blade);
    }
    parts.push(combineMeshes("一片完整狐尾状立体放射羽叶", green, leaves));
  }
  const fruits: ModelPart[] = [], stalks: ModelPart[] = [];
  for (let index = 0; index < 20; index++) { const a = index * 2.4, p: Triple = [Math.cos(a) * .22, 8.5 - index % 5 * .1, Math.sin(a) * .22]; fruits.push(lobe("狐尾椰子冠轴下成簇长卵形果", seedColor, p, [.033, .05, .033])); stalks.push(needle("狐尾椰子冠下果穗的独立分轴", bark, [0, 8.5, 0], p, .004)); }
  parts.push(combineMeshes("狐尾椰子完整冠下果序分轴", bark, stalks), combineMeshes("狐尾椰子冠轴下全部独立果实", seedColor, fruits));
  return parts;
}

function fanLeaf(root: Triple, angle: number): ModelPart {
  const blades: ModelPart[] = [];
  for (let index = 0; index < 14; index++) { const a = angle + (index / 13 - .5) * Math.PI * 1.15; blades.push(leaf("叉干棕掌状叶的完整放射裂片", green, root, .16, 1.25, [68, 90 - a * 180 / Math.PI, 0], "YXZ")); }
  return combineMeshes("叉干棕一片完整的放射掌叶", green, blades);
}

function doumPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("叉干棕第一次自然二歧分枝以下的粗干", bark, [[0, 0, 0], [0, 4.7, 0]], [.37, .28])];
  for (const side of [-1, 1]) {
    const fork: Triple = [side * 1.7, 8.3, 0];
    parts.push(tapered("棕榈原生而非截顶形成的第一次二歧叉干", bark, [[0, 4.5, 0], fork], [.27, .2]));
    for (const end of [-1, 1]) {
      const tip: Triple = [side * 2.5, 11.5, end * 1.25];
      parts.push(tapered("叉干棕连续第二次二歧分枝的木质秆", bark, [fork, tip], [.19, .12]));
      for (let frond = 0; frond < 4; frond++) { const a = frond * Math.PI / 2, p: Triple = [tip[0] + Math.cos(a) * 1.1, tip[1] + .5, tip[2] + Math.sin(a) * 1.1]; parts.push(tapered("叉干棕掌叶的长而硬叶柄", bark, [tip, p], [.035, .015]), fanLeaf(p, a)); }
    }
  }
  return parts;
}

function royalRaffia(): ModelPart[] {
  const parts: ModelPart[] = [tapered("王酒椰叶柄基部覆盖的短粗木质干", bark, [[0, 0, 0], [0, 1.9, 0]], [.62, .49])];
  for (let frond = 0; frond < 8; frond++) {
    const a = frond * Math.PI / 4, root: Triple = [0, 1.6, 0], middle: Triple = [Math.cos(a) * 7.2, 15.3, Math.sin(a) * 7.2], end: Triple = [Math.cos(a) * 16.5, 12.2, Math.sin(a) * 16.5], leaves: ModelPart[] = [];
    parts.push(tapered("王酒椰自短干生出的巨型连续弧叶轴", bark, [root, middle, end], [.17, .09, .008]));
    for (let pinna = 0; pinna < 18; pinna++) for (const side of [-1, 1]) { const t = .28 + pinna / 18 * .69, p = branchPoint(root, middle, end, t, .42), b = a + side * 1.22, length = 1.55 * Math.sin(t * Math.PI); leaves.push(leaf("王酒椰真实巨羽叶两侧的长线形羽片", green, p, .13, length, [83, 90 - b * 180 / Math.PI, side * 7], "YXZ")); }
    parts.push(combineMeshes("王酒椰一整片巨羽叶的全部长羽片", green, leaves));
  }
  return parts;
}

function javaPlum(): ModelPart[] {
  const { parts, tips } = forestCrown(21, 5.5, .16, .066, "oval", true);
  for (const tip of tips) {
    const fruits: ModelPart[] = [], stalks: ModelPart[] = [];
    for (let index = 0; index < 9; index++) { const a = index * 2.4, p: Triple = [tip[0] + Math.cos(a) * .035, tip[1] - .025 - index % 3 * .028, tip[2] + Math.sin(a) * .035]; stalks.push(needle("乌墨短圆锥果序上逐果分开的细梗", bark, tip, p, .002)); fruits.push(lobe("乌墨长椭圆形单核浆果", "#919a87", p, [.017, .03, .016])); }
    parts.push(combineMeshes("乌墨一整簇相连的细果梗", bark, stalks), combineMeshes("乌墨对生大叶旁的全部独立长果", "#919a87", fruits));
  }
  return parts;
}

function waxAppleTree(): ModelPart[] {
  const { parts, tips } = forestCrown(11.5, 3.9, .2, .105, "oval", true);
  for (const tip of tips) for (const side of [-1, 1]) {
    const root: Triple = [tip[0] + side * .035, tip[1] - .035, tip[2]];
    parts.push(tapered("莲雾枝头果簇的短粗果柄", bark, [tip, root], [.003, .002]), part("莲雾上窄下阔并具有真实凹底的钟状果体", "lathe", "#baa38e", [root[0], root[1] - .07, root[2]], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: .016 }, { x: .022, y: .006 }, { x: .034, y: 0 }, { x: .014, y: .065 }, { x: .008, y: .071 }, { x: 0, y: .073 }] }));
  }
  return parts;
}

function screwbeanMesquite(): ModelPart[] {
  const { parts, tips } = featherCrown(8.9, 3.2, .13, 3);
  parts.push(canopy(tips, 3.1, 2.1));
  for (const tip of tips) {
    const pod: Triple[] = Array.from({ length: 31 }, (_, index) => { const a = index * Math.PI / 3; return [tip[0] + Math.cos(a) * .012, tip[1] - .015 - index * .003, tip[2] + Math.sin(a) * .012]; });
    parts.push(tapered("螺荚牧豆树由同一果柄连到螺旋荚的短梗", bark, [tip, pod[0]!], [.002, .0015]), tapered("螺荚牧豆树盘成紧密圆柱螺旋的连续木质荚", seedColor, pod, pod.map(() => .0035)));
  }
  return parts;
}

// 所有棕榈均建完整干叶；不以叶色、开闭、季节或果实数登记额外主项。
// https://plants.ces.ncsu.edu/plants/pseudolarix-amabilis/
// https://www.nparks.gov.sg/FloraFaunaWeb/Flora/2/6/2691
// https://palmpedia.net/wiki/books/21_Genera_Palmarum_Dransfield_et_al._2008.pdf
export const woodyExpansionBatchFiveDesigns: MasterNatureDesign[] = [
  design("chineseWingnutWholeTree", "枫杨", "植物", chineseWingnut, ["Pterocarya stenoptera", "羽状复叶与长串成对薄翅果"]),
  design("europeanAshWholeTree", "欧洲白蜡树", "植物", europeanAsh, ["Fraxinus excelsior", "白蜡树", "奇数羽叶黑冬芽与成束单翅果"]),
  design("hackberryWholeTree", "朴树", "植物", hackberry, ["Celtis sinensis", "木栓斑干偏斜锯齿叶与独立小核果"]),
  design("kousaDogwoodWholeTree", "四照花", "植物", kousaDogwood, ["Cornus kousa", "对生叶四大总苞与球形分粒聚合果"]),
  design("hollyWholeTree", "欧洲冬青", "植物", hollyTree, ["Ilex aquifolium", "冬青树", "刺状革叶与叶腋小圆核果"]),
  design("photiniaWholeTree", "石楠树", "植物", photinia, ["Photinia serratifolia", "长锯齿革叶与平顶多花伞房序"]),
  design("fringeWholeTree", "流苏树", "植物", fringeTree, ["Chionanthus retusus", "对生叶与四枚白色狭带裂瓣"]),
  design("emmenopterysWholeTree", "香果树", "植物", emmenopterys, ["Emmenopterys henryi", "对生大叶小花序与单片膨大白萼"]),
  design("goldenLarchWholeTree", "金钱松", "植物", () => rosetteConifer("goldenLarch"), ["Pseudolarix amabilis", "短枝软扁叶轮与直立尖卵球果"]),
  design("deodarWholeTree", "雪松", "植物", () => rosetteConifer("cedar"), ["Cedrus deodara", "平展垂枝硬针簇与直立桶形球果"]),
  design("hopHornbeamWholeTree", "铁木", "植物", hopHornbeam, ["Ostrya japonica", "锯齿单叶与纸质囊苞下垂果穗"]),
  design("smokeWholeTree", "黄栌", "植物", smokeTree, ["Cotinus coggygria", "倒卵叶与延伸不育花梗形成的羽毛果序"]),
  design("clumpingFishtailWholePalm", "短穗鱼尾葵", "植物", fishtailPalm, ["Caryota mitis", "鱼尾葵", "丛生秆二回羽叶与裂齿鱼尾形小叶"]),
  design("triangleWholePalm", "三角椰子", "植物", trianglePalm, ["Dypsis decaryi", "三棱干头与三个平面的完整长羽叶"]),
  design("foxtailWholePalm", "狐尾椰子", "植物", foxtailPalm, ["Wodyetia bifurcata", "绿冠轴与向全角度放射的蓬松羽叶"]),
  design("doumWholePalm", "埃及叉干棕", "植物", doumPalm, ["Hyphaene thebaica", "自然连续二歧分枝的掌叶棕榈"]),
  design("royalRaffiaWholePalm", "王酒椰（Raphia regalis）", "植物", royalRaffia, ["Raphia regalis", "短干生出的巨型完整弧形羽叶"]),
  design("javaPlumWholeTree", "乌墨", "植物", javaPlum, ["Syzygium cumini", "对生长革叶与长卵形浆果短簇"]),
  design("waxAppleWholeTree", "莲雾树", "植物", waxAppleTree, ["Syzygium samarangense", "对生大革叶与有真实凹底的钟状果"]),
  design("screwbeanMesquiteWholeTree", "螺荚牧豆树", "植物", screwbeanMesquite, ["Prosopis pubescens", "小羽状复叶与连续圆柱螺旋荚"]),
];
