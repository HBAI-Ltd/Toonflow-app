import { cap, combineMeshes, design, leaf, lobe, needle, part, petals, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { branchPoint, leafyShoot } from "./woodyExpansionBatchOne";
import { featherCrown } from "./woodyExpansionBatchTwo";
import { buttresses, canopy, forestCrown } from "./woodyExpansionBatchThree";
import { fiveLobedCalyx } from "./woodyExpansionBatchFour";

const bark = "#988e77";
const green = "#81956f";
const pale = "#b4c09a";
const seedColor = "#b5a583";
const flowerColor = "#d1c7aa";
const serrate: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.26, .14], [-.45, .31], [-.33, .4], [-.5, .57], [-.3, .65], [0, 1], [.3, .65], [.5, .57], [.33, .4], [.45, .31], [.26, .14]];

function mix(a: Triple, b: Triple, t: number): Triple { return a.map((value, axis) => value + (b[axis]! - value) * t) as Triple; }

function trumpetTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("银蚁木直立且具明显节痕的浅色主干", "#b1ad93", [[0, 0, 0], [0, 9, 0], [.04, 19.5, 0]], [.34, .22, .015])], tips: Triple[] = [];
  for (let axis = 0; axis < 5; axis++) {
    const a = axis * 2.4, root: Triple = [0, 11 + axis * .65, 0], p: Triple = [Math.cos(a) * 4.3, 16.7 + axis % 3 * .9, Math.sin(a) * 4.3]; tips.push(p);
    parts.push(tapered("银蚁木冠部向外伸出的有节长枝", bark, [root, p], [.12, .012]));
    for (let node = 0; node < 3; node++) {
      const base = mix(root, p, .65 + node * .14), b = a + (node % 2 ? .8 : -.8), center: Triple = [base[0] + Math.cos(b) * .43, base[1] + .35, base[2] + Math.sin(b) * .43];
      parts.push(tapered("银蚁木连接叶背中心的长盾状叶柄", green, [base, center], [.012, .007]), polygon("银蚁木叶柄着生中心的九深裂盾状大叶", green, Array.from({ length: 18 }, (_, index) => { const c = index * Math.PI / 9, r = index % 2 ? .12 : .36; return [Math.cos(c) * r, Math.sin(c) * r]; }), .003, center));
    }
    const fingers: ModelPart[] = [];
    for (let finger = 0; finger < 4; finger++) fingers.push(tapered("银蚁木指状簇生的独立肉质果穗", seedColor, [p, [p[0] + (finger - 1.5) * .025, p[1] - .035, p[2]], [p[0] + (finger - 1.5) * .035, p[1] - .15, p[2]]], [.004, .008, .005]));
    parts.push(combineMeshes("银蚁木一整簇下垂的指状聚花果", seedColor, fingers));
  }
  for (let index = 0; index < 8; index++) parts.push(part("银蚁木主干上自然连续的环形叶痕", "lathe", "#c2bda1", [0, .5 + index * 1.1, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .315 - index * .013, y: -.015 }, { x: .33 - index * .013, y: -.015 }, { x: .33 - index * .013, y: .015 }, { x: .315 - index * .013, y: .015 }, { x: .315 - index * .013, y: -.015 }] }));
  parts.push(canopy(tips, 4.6, 3.3));
  return parts;
}

function colaTree(): ModelPart[] {
  const { parts, tips } = forestCrown(20.5, 5, .24, .1, "oval");
  for (const tip of tips) {
    const fruits: ModelPart[] = [], ribs: ModelPart[] = [];
    for (let index = 0; index < 3; index++) {
      const a = index * Math.PI * 2 / 3, p: Triple = [tip[0] + Math.cos(a) * .04, tip[1] - .055, tip[2] + Math.sin(a) * .04];
      fruits.push(tapered("可乐果由共同果柄生出的粗短弯曲蓇葖", seedColor, [tip, p, [p[0] + Math.cos(a) * .04, p[1] - .055, p[2] + Math.sin(a) * .04]], [.005, .027, .012]));
      ribs.push(tapered("可乐果果皮沿长轴隆起的真实弯曲果脊", "#a89e7c", [p, [p[0] + Math.cos(a) * .026, p[1] - .018, p[2] + Math.sin(a) * .026], [p[0] + Math.cos(a) * .04, p[1] - .048, p[2] + Math.sin(a) * .04]], [.002, .003, .0015]));
    }
    parts.push(combineMeshes("可乐果树冠端全部独立的厚壁弯果", seedColor, fruits), combineMeshes("可乐果树果皮上完整的弯曲凸脊", "#a89e7c", ribs));
  }
  return parts;
}

function africanBreadfruit(): ModelPart[] {
  const { parts } = forestCrown(23, 5.6, .32, .16, "oval");
  parts.push(...buttresses(.8, 2.8, 3));
  for (let fruit = 0; fruit < 4; fruit++) {
    const a = fruit * 2.4, root: Triple = [Math.cos(a) * .67, 2.3 + fruit * 1.4, Math.sin(a) * .67], p: Triple = [Math.cos(a) * 1.12, root[1] - .15, Math.sin(a) * 1.12], grains: ModelPart[] = [];
    parts.push(tapered("非洲面包树大聚花果直接连到老干的粗柄", bark, [root, p], [.025, .017]), lobe("非洲面包树老干上近球形的大型聚花果", seedColor, [p[0], p[1] - .16, p[2]], [.34, .36, .34]));
    for (let index = 0; index < 35; index++) { const b = index * 2.4, h = -.8 + index / 34 * 1.6, r = Math.sqrt(1 - h * h) * .14; grains.push(lobe("非洲面包树聚花果外壁密集的粗小花被凸起", pale, [p[0] + Math.cos(b) * r, p[1] - .16 + h * .15, p[2] + Math.sin(b) * r], [.018, .022, .018])); }
    parts.push(combineMeshes("非洲面包树一整枚聚花果的真实粗糙表面", pale, grains));
  }
  return parts;
}

function tonkaTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("香豆树完整而高耸的木质主干", bark, [[0, 0, 0], [0, 25, 0]], [.8, .015])], tips: Triple[] = [];
  for (let branch = 0; branch < 6; branch++) {
    const a = branch * 2.4, root: Triple = [0, 12 + branch * .7, 0], tip: Triple = [Math.cos(a) * 5.9, 21.2 + branch % 3 * 1.2, Math.sin(a) * 5.9]; tips.push(tip);
    parts.push(tapered("香豆树承载有翼复叶的大木质侧枝", bark, [root, tip], [.25, .008]));
    for (let node = 0; node < 3; node++) {
      const base = mix(root, tip, .65 + node * .15), b = a + (node % 2 ? .8 : -.8), end: Triple = [base[0] + Math.cos(b) * .3, base[1] + .04, base[2] + Math.sin(b) * .3], pieces: ModelPart[] = [needle("香豆树偶数羽叶的共同叶轴", green, base, end, .003), flatLeaf("与四枚小叶真正共用一条轴的狭长叶翼", base, end, .025)];
      for (let pair = 0; pair < 2; pair++) for (const side of [-1, 1]) { const p = mix(base, end, .35 + pair * .45), c = b + side * 1.2; pieces.push(flatLeaf("直接着生在有翼共同叶轴上的香豆树小叶", p, [p[0] + Math.cos(c) * .13, p[1] + .018, p[2] + Math.sin(c) * .13], .05)); }
      parts.push(combineMeshes("香豆树一片完整有翼偶数羽状复叶", green, pieces));
    }
    parts.push(tapered("香豆树枝端独立悬垂的果柄", bark, [tip, [tip[0], tip[1] - .06, tip[2]]], [.003, .002]), lobe("香豆树具一枚硬种核的长卵形肉质果", seedColor, [tip[0], tip[1] - .08, tip[2]], [.035, .067, .03]));
  }
  parts.push(...buttresses(.7, 2.8, 3), canopy(tips, 6.2, 5.2));
  return parts;
}

function sheaTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("乳木果树低分叉而粗糙的完整木质干", bark, [[0, 0, 0], [.2, 3.7, .02], [0, 10.6, 0]], [.58, .4, .035])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 4.5 + axis * .4, 0], p: Triple = [Math.cos(a) * 4, 10.7 + axis % 3 * .6, Math.sin(a) * 4]; tips.push(p);
    parts.push(tapered("乳木果树密生端簇叶的粗木质冠枝", bark, [root, p], [.17, .012]));
    const leaves: ModelPart[] = [], stems: ModelPart[] = [], fruits: ModelPart[] = [];
    for (let index = 0; index < 12; index++) { const b = index * 2.4, q: Triple = [p[0] + Math.cos(b) * .04, p[1] + .015 + index % 3 * .018, p[2] + Math.sin(b) * .04]; leaves.push(flatLeaf("乳木果枝梢成密簇的长倒披针革叶", q, [q[0] + Math.cos(b) * .2, q[1] + .035, q[2] + Math.sin(b) * .2], .06, "obovate")); stems.push(needle("乳木果端簇叶与粗枝相接的短柄", green, p, q, .003)); }
    for (const side of [-1, 1]) { const q: Triple = [p[0] + side * .027, p[1] - .05, p[2]]; stems.push(needle("乳木果端簇叶下方的细果柄", bark, p, q, .002)); fruits.push(lobe("乳木果叶簇下独立的卵圆浆果", seedColor, q, [.042, .057, .04])); }
    parts.push(combineMeshes("乳木果端簇全部相连叶果柄", green, stems), combineMeshes("乳木果树梢完整密集倒披针叶", green, leaves), combineMeshes("乳木果梢端独立肉质果", seedColor, fruits));
  }
  parts.push(canopy(tips, 4.1, 3.5));
  return parts;
}

function marulaTree(): ModelPart[] {
  const { parts, tips } = featherCrown(16.5, 5.1, .27, 3);
  parts.push(canopy(tips, 5.1, 3.9));
  for (const tip of tips) {
    const fruit: ModelPart[] = [], stalks: ModelPart[] = [];
    for (let index = 0; index < 6; index++) { const a = index * 2.4, p: Triple = [tip[0] + Math.cos(a) * .035, tip[1] - .035 - index % 2 * .025, tip[2] + Math.sin(a) * .035]; stalks.push(needle("马鲁拉叶簇间短小的独立果柄", bark, tip, p, .002)); fruit.push(lobe("马鲁拉树上未落地的绿色长卵核果", pale, p, [.034, .045, .034])); }
    parts.push(combineMeshes("马鲁拉树完整梢端果梗", bark, stalks), combineMeshes("马鲁拉树上逐枚分离的完整核果", pale, fruit));
  }
  return parts;
}

function arganTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("摩洛哥坚果树曲折粗壮的主干", bark, [[0, 0, 0], [.35, 2.8, .05], [-.1, 5.7, .02], [.1, 9.3, 0]], [.6, .45, .23, .02])], tips: Triple[] = [], thorns: ModelPart[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 3.8 + axis * .4, 0], p: Triple = [Math.cos(a) * 3.8, 8.6 + axis % 2 * .6, Math.sin(a) * 3.8]; tips.push(p);
    parts.push(tapered("摩洛哥坚果树斜展的硬刺冠枝", bark, [root, p], [.16, .006]), ...leafyShoot(mix(root, p, .86), p, .045, .022, "obovate"));
    for (let node = 0; node < 6; node++) { const q = mix(root, p, .55 + node * .075); thorns.push(needle("摩洛哥坚果枝端叶腋伸出的坚硬直刺", bark, q, [q[0] + Math.cos(a + .7) * .035, q[1] + .01, q[2] + Math.sin(a + .7) * .035], .006)); }
    parts.push(lobe("摩洛哥坚果枝梢短柄上的卵圆果实", seedColor, [p[0], p[1] - .012, p[2]], [.025, .038, .024]));
  }
  parts.push(combineMeshes("摩洛哥坚果树全部真实木质直刺", bark, thorns), canopy(tips, 3.7, 3));
  return parts;
}

function quinineTree(): ModelPart[] {
  const { parts, tips } = forestCrown(15, 4.2, .18, .095, "oval", true);
  for (const tip of tips) {
    const axes: ModelPart[] = [], flowers: ModelPart[] = [];
    for (let index = 0; index < 4; index++) {
      const a = index * 2.4, p: Triple = [tip[0] + Math.cos(a) * .055, tip[1] + .03 + index % 4 * .035, tip[2] + Math.sin(a) * .055]; axes.push(needle("金鸡纳顶生圆锥花序的独立花柄", bark, tip, p, .0015));
      const flower = fiveLobedCalyx([0, 0, 0]); flower.name = "金鸡纳有真实内腔和五裂口缘的细长花冠筒"; flower.color = "#bea99b"; flower.scale = { x: .45, y: .75, z: .45 }; flower.rotation.x = 180; flower.position = { x: p[0], y: p[1], z: p[2] }; flowers.push(flower);
    }
    parts.push(combineMeshes("金鸡纳完整顶生圆锥花序轴", bark, axes), combineMeshes("金鸡纳有真实连续花筒的完整五裂小花群", "#bea99b", flowers));
  }
  return parts;
}

function coastTeaTree(): ModelPart[] {
  const { parts, tips } = forestCrown(5.6, 2.4, .025, .008, "obovate");
  for (const tip of tips) {
    const capsules: ModelPart[] = [], flowers: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 5; index++) { const a = index * 2.4, p: Triple = [tip[0] + Math.cos(a) * .024, tip[1] + .015, tip[2] + Math.sin(a) * .024]; stems.push(needle("海岸茶树单花基部的短花枝", bark, tip, p, .0015)); for (let petal = 0; petal < 5; petal++) flowers.push(leaf("海岸茶树独立白色圆花瓣", flowerColor, p, .006, .007, [80, petal * 72, 0], "YXZ")); capsules.push(tapered("海岸茶树老花后倒圆锥形的木质小蒴果", seedColor, [p, [p[0], p[1] - .006, p[2]]], [.004, .002])); }
    parts.push(combineMeshes("海岸茶树整组相连短花枝", bark, stems), combineMeshes("海岸茶树完整五瓣小花", flowerColor, flowers), combineMeshes("海岸茶树老枝上的倒锥小蒴果", seedColor, capsules));
  }
  return parts;
}

function pincushionHakea(): ModelPart[] {
  const parts: ModelPart[] = [tapered("针垫哈克木直立后分叉的粗木质干", bark, [[0, 0, 0], [0, 2.2, 0], [.02, 5.4, 0]], [.22, .12, .006])], tips: Triple[] = [];
  for (let axis = 0; axis < 5; axis++) {
    const a = axis * 2.4, root: Triple = [0, 2.1 + axis * .25, 0], p: Triple = [Math.cos(a) * 2.1, 4.7 + axis % 2 * .4, Math.sin(a) * 2.1]; tips.push(p);
    parts.push(tapered("针垫哈克木细长而下垂的开花侧枝", bark, [root, p], [.065, .004]), ...leafyShoot(mix(root, p, .6), p, .12, .03, "oval"));
    const styles: ModelPart[] = [];
    parts.push(lobe("针垫哈克木花头共同的球状密集花基", seedColor, p, [.018, .019, .018]));
    for (let index = 0; index < 28; index++) { const b = index * 2.4, h = -.75 + index / 27 * 1.5, r = Math.sqrt(1 - h * h), q: Triple = [p[0] + Math.cos(b) * r * .021, p[1] + h * .021, p[2] + Math.sin(b) * r * .021]; styles.push(tapered("针垫哈克木向外弯曲且末端回钩的长花柱", "#b5a58c", [p, q, [q[0] + Math.cos(b + .7) * .007, q[1] + .004, q[2] + Math.sin(b + .7) * .007]], [.0008, .0007, .0006])); }
    for (let offset = 0; offset < styles.length; offset += 14) parts.push(combineMeshes("针垫哈克木完整球形花头的一组回钩长花柱", "#b5a58c", styles.slice(offset, offset + 14)));
  }
  parts.push(canopy(tips, 2.2, 1.8));
  return parts;
}

function distinctConifer(kind: "fir" | "douglas" | "norfolk"): ModelPart[] {
  const fir = kind === "fir", norfolk = kind === "norfolk", height = norfolk ? 28 : fir ? 27 : 31, parts: ModelPart[] = [tapered("完整常绿针叶树通直且连续收分的主干", bark, [[0, 0, 0], [0, height, 0]], [norfolk ? .65 : .8, .01])], volumes: ModelPart[] = [];
  for (let branch = 0; branch < (norfolk ? 16 : fir ? 12 : 14); branch++) {
    const a = norfolk ? branch % 4 * Math.PI / 2 + Math.floor(branch / 4) * .5 : branch * 2.4, y = norfolk ? 7 + Math.floor(branch / 4) * 6.2 : 5.5 + branch * 1.7, reach = norfolk ? 5.4 - Math.floor(branch / 4) * 1.35 : 5.7 - branch * .3, root: Triple = [0, y, 0], p: Triple = [Math.cos(a) * reach, y + .15, Math.sin(a) * reach];
    parts.push(tapered(norfolk ? "诺福克岛杉每层同高轮生的平展侧枝" : "针叶大乔木平展的连续木质侧枝", bark, [root, p], [.15 - branch * .007, .005]));
    const twigs: ModelPart[] = [], needles: ModelPart[] = [];
    for (let twig = 0; twig < 3; twig++) {
      const q = mix(root, p, .5 + twig * .22), b = a + (twig % 2 ? .7 : -.7), end: Triple = [q[0] + Math.cos(b) * .35, q[1] + .025, q[2] + Math.sin(b) * .35]; twigs.push(needle("与主枝实际相连的针叶短枝", bark, q, end, .004));
      for (let index = 0; index < (norfolk ? 24 : 12); index++) {
        const base = mix(q, end, (index + 1) / (norfolk ? 26 : 14));
        if (norfolk) { const c = index * 2.4; needles.push(needle("诺福克岛杉环绕叶枝的短锥形鳞针叶", green, base, [base[0] + Math.cos(c) * .009, base[1] + .01, base[2] + Math.sin(c) * .009], .002)); }
        else for (const side of [-1, 1]) { const c = b + side * 1.25; needles.push(leaf(fir ? "冷杉两列排列的扁平钝端针叶" : "花旗松两侧排列的短扁针叶", green, base, fir ? .0025 : .0018, fir ? .032 : .025, [77, 90 - c * 180 / Math.PI, 0], "YXZ")); }
      }
    }
    parts.push(combineMeshes("常绿针叶树一组真实相连的细短枝", bark, twigs));
    for (let offset = 0; offset < needles.length; offset += norfolk ? 60 : 36) parts.push(combineMeshes("常绿针叶树有完整叶序的针叶组", green, needles.slice(offset, offset + (norfolk ? 60 : 36))));
    volumes.push(lobe("常绿针叶大树轮层收分的低面冠簇", green, [p[0] * .7, y + .15, p[2] * .7], [reach * 1.1, norfolk ? 1.4 : 2.1, reach * .85]));
    if (!norfolk && branch % 3 === 0) {
      const q: Triple = [p[0], p[1], p[2]];
      parts.push(part(fir ? "冷杉直立在枝上的长圆柱球果" : "花旗松从枝端垂下的长圆球果", "lathe", seedColor, q, [1, 1, 1], [fir ? 0 : 180, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .02, y: .008 }, { x: .025, y: .045 }, { x: .022, y: fir ? .12 : .065 }, { x: 0, y: fir ? .15 : .08 }] }));
      if (!fir) { const bracts: ModelPart[] = []; for (let scale = 0; scale < 12; scale++) { const b = scale * 2.4, z = .015 + scale / 12 * .05, base: Triple = [q[0] + Math.cos(b) * .019, q[1] - z, q[2] + Math.sin(b) * .019]; for (const prong of [-1, 0, 1]) bracts.push(needle("花旗松球果鳞片外伸的三尖苞鳞裂片", pale, base, [base[0] + Math.cos(b + prong * .35) * .012, base[1] - .009, base[2] + Math.sin(b + prong * .35) * .012], .0015)); } parts.push(combineMeshes("花旗松整枚球果真实外伸的三尖苞鳞", pale, bracts)); }
    }
  }
  parts.push(combineMeshes("常绿针叶大乔木完整的分层叶冠", green, volumes));
  return parts;
}

function chinaChestnut(): ModelPart[] {
  const { parts, tips } = forestCrown(16.5, 4.5, .22, .1, "oval");
  for (const tip of tips) for (const side of [-1, 1]) {
    const p: Triple = [tip[0] + side * .04, tip[1] - .04, tip[2]];
    parts.push(tapered("苹婆单叶枝端的短粗果柄", bark, [tip, p], [.006, .004]), part("苹婆翻开的真实中空厚壁红色蓇葖", "lathe", "#b59d87", p, [.7, 1, 1.9], [20, side * 45, 0], { profile: [{ x: 0, y: 0 }, { x: .018, y: 0 }, { x: .038, y: .04 }, { x: .033, y: .047 }, { x: .014, y: .013 }, { x: 0, y: .013 }] }), lobe("苹婆厚果壁内清晰露出的黑色种子", "#7f8776", [p[0], p[1] + .024, p[2]], [.022, .026, .036]));
  }
  return parts;
}

function weddingCakeTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("灯台树从地表到冠尖的直立主干", bark, [[0, 0, 0], [0, 14.2, 0]], [.42, .012])], crowns: ModelPart[] = [];
  for (let tier = 0; tier < 4; tier++) for (let axis = 0; axis < 3; axis++) {
    const a = axis * Math.PI * 2 / 3 + tier * .7, y = 4 + tier * 2.5, reach = 4.5 - tier * .73, root: Triple = [0, y, 0], p: Triple = [Math.cos(a) * reach, y + .13, Math.sin(a) * reach];
    parts.push(tapered("灯台树层层平展而不相粘连的水平长枝", bark, [root, p], [.11 - tier * .018, .005]), ...leafyShoot(mix(root, p, .84), p, .105, .052, "oval"));
    const flowers: ModelPart[] = [], stems: ModelPart[] = [];
    for (let index = 0; index < 8; index++) { const b = index * 2.4, q: Triple = [p[0] + Math.cos(b) * .045, p[1] + .03 + index % 3 * .006, p[2] + Math.sin(b) * .045]; stems.push(needle("灯台树平顶聚伞花序的细分轴", bark, p, q, .0015)); for (let petal = 0; petal < 4; petal++) flowers.push(leaf("灯台树没有大总苞的四瓣小花", flowerColor, q, .002, .004, [80, petal * 90, 0], "YXZ")); }
    parts.push(combineMeshes("灯台树一整簇相连的平顶花序轴", bark, stems), combineMeshes("灯台树层枝上的完整四瓣小花序", flowerColor, flowers));
    crowns.push(lobe("灯台树每一平展枝层的独立叶簇", green, [p[0] * .75, y + .15, p[2] * .75], [reach * 1.1, .9, reach]));
  }
  parts.push(combineMeshes("灯台树保持各水平层通透间隔的整体冠", green, crowns));
  return parts;
}

function helicia(): ModelPart[] {
  const { parts, tips } = forestCrown(18.5, 4.5, .22, .09, serrate);
  for (const tip of tips) {
    const axis: ModelPart[] = [], flowers: ModelPart[] = [];
    for (let row = 0; row < 8; row++) {
      const root: Triple = [tip[0] + .01, tip[1] - .02 - row * .026, tip[2]], previous: Triple = row ? [root[0], root[1] + .026, root[2]] : tip;
      axis.push(needle("山龙眼叶腋下垂的细长总状花序轴", bark, previous, root, .002));
      for (const side of [-1, 1]) flowers.push(tapered("山龙眼花冠四裂后向外反卷的狭花被", flowerColor, [root, [root[0] + side * .018, root[1] + .008, root[2]], [root[0] + side * .021, root[1] + .002, root[2] + .003]], [.0015, .001, .0005]));
    }
    parts.push(combineMeshes("山龙眼完整叶腋花序轴", bark, axis), combineMeshes("山龙眼总状花序中的成对反曲花", flowerColor, flowers));
  }
  return parts;
}

function redFruitMahogany(): ModelPart[] {
  const { parts, tips } = featherCrown(22, 5.2, .38, 3);
  parts.push(canopy(tips, 5.4, 4.7));
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .085, tip[2]], valves: ModelPart[] = [], seeds: ModelPart[] = [];
    parts.push(tapered("红果樫木梨形蒴果的短梗", bark, [tip, p], [.005, .003]));
    for (let valve = 0; valve < 4; valve++) { const a = valve * Math.PI / 2; valves.push(flatLeaf("红果樫木向外展开的四片厚蒴果瓣", p, [p[0] + Math.cos(a) * .035, p[1] - .043, p[2] + Math.sin(a) * .035], .027, "obovate", .003)); seeds.push(lobe("红果樫木四室果中独立的深色种子", "#828a79", [p[0] + Math.cos(a) * .013, p[1] - .018, p[2] + Math.sin(a) * .013], [.016, .024, .014])); }
    parts.push(combineMeshes("红果樫木一枚完整开裂的厚四瓣果壁", "#b69c88", valves), combineMeshes("红果樫木四室果中真实分离的种子", "#828a79", seeds));
  }
  return parts;
}

function sacredFig(): ModelPart[] {
  const dripHeart: Parameters<typeof flatLeaf>[4] = [[0, .12], [-.26, -.04], [-.48, .12], [-.44, .42], [-.2, .65], [-.045, .77], [0, 1], [.045, .77], [.2, .65], [.44, .42], [.48, .12], [.26, -.04]], { parts, tips } = forestCrown(19.5, 5.6, .17, .1, dripHeart);
  parts.push(...buttresses(.75, 3.2, 3.1));
  for (const tip of tips) {
    const fruits: ModelPart[] = [];
    for (const side of [-1, 1]) fruits.push(lobe("菩提树叶腋成对生出的无柄球形隐头果", seedColor, [tip[0] + side * .006, tip[1] - .004, tip[2]], [.011, .012, .011]));
    parts.push(combineMeshes("菩提树心形长滴尖叶旁的成对隐头果", seedColor, fruits));
  }
  return parts;
}

function indianRubberFig(): ModelPart[] {
  const { parts, tips } = forestCrown(21.5, 6.1, .29, .13, "oval");
  parts.push(...buttresses(.9, 3.5, 3.4));
  for (let axis = 0; axis < tips.length; axis++) {
    const tip = tips[axis]!, root: Triple = [tip[0] * .7, tip[1] - .2, tip[2] * .7], ground: Triple = [root[0] + .2, 0, root[2]];
    // 气根上端直接回接树梢，不以预估的空间点悬挂一根独立柱。
    parts.push(tapered("橡皮树从枝梢连续垂到地表的木质支柱根", bark, [tip, [tip[0] * .9, tip[1] - 1.2, tip[2] * .9], ground], [.018, .024, .12]), tapered("橡皮树包覆新叶的狭长卷合托叶鞘", "#b4a08f", [tip, [tip[0] + .01, tip[1] + .12, tip[2]]], [.008, .001]));
    const figs: ModelPart[] = [];
    for (const side of [-1, 1]) figs.push(lobe("橡皮树叶腋成对的长椭圆隐头果", seedColor, [tip[0] + side * .01, tip[1] - .004, tip[2]], [.012, .018, .011]));
    parts.push(combineMeshes("橡皮树独立成对的长圆隐头果", seedColor, figs));
  }
  return parts;
}

function monkeyPotTree(): ModelPart[] {
  const { parts, tips } = forestCrown(28, 6.5, .23, .085, serrate);
  parts.push(...buttresses(.9, 3.6, 3.5));
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .045, tip[2]];
    parts.push(tapered("猴锅树木质盖果连接冠枝的粗果柄", bark, [tip, p], [.012, .008]), part("猴锅树盖脱落后真实厚壁而向下开口的木质果锅", "lathe", seedColor, p, [1, 1, 1], [180, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .055, y: .005 }, { x: .1, y: .055 }, { x: .11, y: .115 }, { x: .075, y: .15 }, { x: .055, y: .15 }, { x: .075, y: .105 }, { x: .075, y: .055 }, { x: .045, y: .025 }, { x: 0, y: .025 }] }));
  }
  return parts;
}

// 植物学近缘不是颜色/尺寸状态；保留实际叶器官、冠枝、花果结构的区别。
// https://www.nparks.gov.sg/florafaunaweb/flora/2/8/2822
// https://pza.sanbi.org/sclerocarya-birrea
// https://vicflora.rbg.vic.gov.au/flora/taxon/cceb9dbe-48dc-494b-84a8-8a84693b48e0
// https://www.nparks.gov.sg/florafaunaweb/flora/3/1/3139
// https://www.nparks.gov.sg/FloraFaunaWeb/Flora/2/9/2906
// https://www.nybg.org/botany/mori/lecythidaceae/brazilnut_presentation/presentation_slide_24.htm
export const woodyExpansionBatchSixDesigns: MasterNatureDesign[] = [
  design("cecropiaWholeTree", "银蚁木", "植物", trumpetTree, ["Cecropia peltata", "长盾状叶柄九深裂大叶与指状聚花果"]),
  design("colaWholeTree", "可乐果树", "植物", colaTree, ["Cola nitida", "大互生革叶与带长脊的厚弯蓇葖"]),
  design("africanBreadfruitWholeTree", "非洲面包树", "植物", africanBreadfruit, ["Treculia africana", "板根大叶与老干直接着生的大球聚花果"]),
  design("tonkaWholeTree", "香豆树", "植物", tonkaTree, ["Dipteryx odorata", "有翼偶数羽叶与独立长卵核果"]),
  design("sheaWholeTree", "乳木果树", "植物", sheaTree, ["Vitellaria paradoxa", "低叉粗干与枝端簇生长倒披针叶"]),
  design("marulaWholeTree", "马鲁拉树", "植物", marulaTree, ["Sclerocarya birrea", "端簇羽状复叶与树上绿色卵圆核果"]),
  design("arganWholeTree", "摩洛哥坚果树", "植物", arganTree, ["Argania spinosa", "曲折枝干木质硬刺与小倒卵叶核果"]),
  design("quinineWholeTree", "金鸡纳树", "植物", quinineTree, ["Cinchona pubescens", "大对生叶与顶生细筒五裂花序"]),
  design("coastTeaWholeTree", "海岸茶树", "植物", coastTeaTree, ["Gaudium laevigatum", "Leptospermum laevigatum", "灰绿小倒卵叶五瓣白花与倒锥蒴果"]),
  design("pincushionHakeaWholeTree", "针垫哈克木", "植物", pincushionHakea, ["Hakea laurina", "狭革叶与真实回钩长花柱的针垫花头"]),
  design("silverFirWholeTree", "欧洲冷杉", "植物", () => distinctConifer("fir"), ["Abies alba", "二列扁针叶与枝上直立的长圆柱球果"]),
  design("douglasWholeTree", "花旗松", "植物", () => distinctConifer("douglas"), ["Pseudotsuga menziesii", "短扁针叶与垂果外伸的三尖苞鳞"]),
  design("norfolkWholeTree", "诺福克岛杉", "植物", () => distinctConifer("norfolk"), ["Araucaria heterophylla", "同高轮生水平枝层与短锥形鳞针叶"]),
  design("chinaChestnutWholeTree", "苹婆", "植物", chinaChestnut, ["Sterculia monosperma", "Sterculia nobilis", "宽大单叶与厚壁开口蓇葖黑籽"]),
  design("weddingCakeWholeTree", "灯台树", "植物", weddingCakeTree, ["Cornus controversa", "互生叶层层平展枝冠与无大苞四瓣小花序"]),
  design("heliciaWholeTree", "山龙眼", "植物", helicia, ["Helicia hainanensis", "大锯齿叶与叶腋长总状反曲花序"]),
  design("redFruitMahoganyWholeTree", "红果樫木", "植物", redFruitMahogany, ["Dysoxylum gotadhora", "Dysoxylum binectariferum", "羽状复叶与独立四室裂果深色种子"]),
  design("sacredFigWholeTree", "菩提树", "植物", sacredFig, ["Ficus religiosa", "板根高冠与具长滴尖的心形盾基叶"]),
  design("indianRubberFigWholeTree", "橡皮树", "植物", indianRubberFig, ["Ficus elastica", "大椭圆革叶卷合托叶与真实落地支柱根"]),
  design("monkeyPotWholeTree", "猴锅树", "植物", monkeyPotTree, ["Lecythis pisonis", "大乔木枝端真实厚壁开口木质盖果"]),
];
