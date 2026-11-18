import { Vector3 } from "three";
import { combineMeshes, design, lobe, needle, petals, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { shellTube } from "./invertebrateExpansionBatchOne";
import { radialBlade } from "./herbaceousExpansionBatchOne";
import { axisPosition } from "./herbaceousExpansionBatchTen";

const green = "#82976e";
const pale = "#b0bc95";
const cream = "#d7d0b4";
const brown = "#a19178";

// 原创完整米制草本。泛名旧资产逐源比较，不以学名替换、株数或高度扩主。
// https://www.nparks.gov.sg/florafaunaweb/flora/2/4/2491
// https://tbd.tbn.org.tw/botanic-taxon/4869
// https://www.rhs.org.uk/plants/3382/cephalaria-gigantea/details
// https://www.worldfloraonline.org/taxon/wfo-4000007238
// https://plants.ces.ncsu.edu/plants/maianthemum-racemosum/
// https://mdc.mo.gov/discover-nature/field-guide/wood-nettle-stinging-nettle
// https://efloras.org/florataxon.aspx?flora_id=1&taxon_id=117613

function polynesianArrowroot(): ModelPart[] {
  const parts: ModelPart[] = [lobe("裂叶蒟蒻薯埋土球茎上端露出的短根颈", brown, [0, 0.026, 0], [0.065, 0.055, 0.065])], primaryAxes: ModelPart[] = [], leafSegments: ModelPart[] = [], bracts: ModelPart[] = [], whiskers: ModelPart[] = [], flowers: ModelPart[] = [], pedicels: ModelPart[] = [], margin: [number, number][] = [[0, 0], [-0.07, 0.1], [-0.43, 0.24], [-0.1, 0.3], [-0.49, 0.44], [-0.12, 0.49], [-0.4, 0.65], [-0.1, 0.67], [-0.2, 0.82], [0, 1], [0.2, 0.82], [0.1, 0.67], [0.4, 0.65], [0.12, 0.49], [0.49, 0.44], [0.1, 0.3], [0.43, 0.24], [0.07, 0.1]];
  for (let leaf = 0; leaf < 2; leaf++) {
    const a = leaf * 2.7, root: Triple = [Math.cos(a) * 0.075, 0.83 + leaf * 0.18, Math.sin(a) * 0.075];
    parts.push(shellTube("裂叶蒟蒻薯有实际贯通空腔的粗长基生叶柄", [[0, 0.027, 0], [root[0] * 0.3, root[1] * 0.55, root[2] * 0.3], root], [0.016, 0.012, 0.008], 0.0022, pale));
    for (let segment = 0; segment < 3; segment++) {
      const b = a + segment * Math.PI * 2 / 3, joint: Triple = [root[0] + Math.cos(b) * 0.14, root[1] + 0.02, root[2] + Math.sin(b) * 0.14], end: Triple = [joint[0] + Math.cos(b) * 0.38, joint[1] + 0.06, joint[2] + Math.sin(b) * 0.38];
      primaryAxes.push(needle("裂叶蒟蒻薯在长叶柄顶分出的三条有柄初级叶轴", pale, root, joint, 0.005)); leafSegments.push(flatLeaf("裂叶蒟蒻薯初级叶段上真实连续而深羽裂的次级叶面", joint, end, 0.23, margin, 0.001));
    }
  }
  parts.push(combineMeshes("裂叶蒟蒻薯真正三分而非整卵叶的完整主叶轴", pale, primaryAxes), combineMeshes("裂叶蒟蒻薯三大分区内连续深羽裂的完整大叶", green, leafSegments), tapered("裂叶蒟蒻薯高出叶幕的独立无叶长花葶", pale, [[0.025, 0.025, 0], [0.025, 1.66, 0]], [0.011, 0.004]));
  const centre: Triple = [0.025, 1.66, 0];
  for (let bract = 0; bract < 10; bract++) bracts.push(radialBlade("裂叶蒟蒻薯伞端十枚狭叶状而非两片巨大蝙蝠翼的总苞", green, centre, 0.017, 0.072, 107, bract * 36));
  for (let thread = 0; thread < 30; thread++) {
    const a = thread * 2.4, root: Triple = [centre[0] + Math.cos(a) * 0.01, centre[1], Math.sin(a) * 0.01], bend: Triple = [centre[0] + Math.cos(a) * 0.045, 1.62, Math.sin(a) * 0.045], middle: Triple = [centre[0] + Math.cos(a) * 0.064, 1.53, Math.sin(a) * 0.064], tip: Triple = [centre[0] + Math.cos(a) * 0.07, 1.43 - thread % 3 * 0.008, Math.sin(a) * 0.07];
    whiskers.push(needle("裂叶蒟蒻薯细丝苞由花序表面垂下的基段", "#a79d9c", root, bend, 0.0009), needle("裂叶蒟蒻薯保留实际弯点的长细丝苞中段", "#a79d9c", bend, middle, 0.0007), needle("裂叶蒟蒻薯细丝苞自然下垂而不做粗圆管的末段", "#a79d9c", middle, tip, 0.0005));
  }
  for (let flower = 0; flower < 24; flower++) {
    const a = flower * 2.4, radius = 0.046 + flower % 3 * 0.009, root: Triple = [centre[0] + Math.cos(a) * radius, 1.612 + flower % 3 * 0.008, Math.sin(a) * radius];
    pedicels.push(needle("裂叶蒟蒻薯同一伞端向外弯垂的独立长花柄", pale, centre, root, 0.0012)); flowers.push(smallCorolla(root, [Math.cos(a) * 0.1, -1, Math.sin(a) * 0.1], 0.007, 0.0038, "#a5ad8c", false, 6, 8));
  }
  parts.push(combineMeshes("裂叶蒟蒻薯完整十枚叶状总苞", green, bracts), combineMeshes("裂叶蒟蒻薯保持全部弯点的三十条垂丝苞", "#a79d9c", whiskers), combineMeshes("裂叶蒟蒻薯真实相连的下垂伞状花柄", pale, pedicels));
  for (let i = 0; i < flowers.length; i += 4) parts.push(combineMeshes("裂叶蒟蒻薯叶状总苞内的下垂小六被绿花", "#a5ad8c", flowers.slice(i, i + 4)));
  return parts;
}

function giantScabious(): ModelPart[] {
  const parts: ModelPart[] = [], leaves: ModelPart[] = [], bracts: ModelPart[] = [], flowers: ModelPart[] = [], stamens: ModelPart[] = [], pedicels: ModelPart[] = [];
  for (let leaf = 0; leaf < 7; leaf++) {
    const a = leaf * 2.4, root: Triple = [Math.cos(a) * 0.065, 0.075, Math.sin(a) * 0.065];
    pedicels.push(needle("巨头花基生羽裂大叶的独立长叶柄", pale, [0, 0.006, 0], root, 0.004)); leaves.push(flatLeaf("巨头花低处大幅羽状裂片彼此连续的基生叶", root, [root[0] + Math.cos(a) * 0.39, 0.21, root[2] + Math.sin(a) * 0.39], 0.15, "lobed", 0.001));
  }
  for (let shoot = 0; shoot < 3; shoot++) {
    const x = (shoot - 1) * 0.045, height = 1.91 + shoot * 0.19;
    parts.push(tapered("巨头花由根颈直立并在上段分枝的高细花茎", pale, [[x, 0, 0], [x, height, 0]], [0.008, 0.002]));
    for (let node = 0; node < 3; node++) for (const side of [-1, 1]) { const a = node % 2 * Math.PI / 2 + (side < 0 ? Math.PI : 0), y = 0.36 + node * 0.39; leaves.push(flatLeaf("巨头花花茎上逐渐缩小的对生羽裂叶", [x, y, 0], [x + Math.cos(a) * (0.22 - node * 0.035), y + 0.035, Math.sin(a) * (0.22 - node * 0.035)], 0.075 - node * 0.01, "lobed", 0.0008)); }
    for (const side of [-1, 1]) {
      const root: Triple = [x + side * 0.17, height + (side > 0 ? 0.043 : -0.035), shoot * 0.014];
      pedicels.push(tapered("巨头花顶端叉开并真实接到圆垫小花头的细枝", pale, [[x, height - 0.35, 0], [root[0] * 0.86 + x * 0.14, root[1] - 0.1, root[2] * 0.8], root], [0.0028, 0.0016, 0.001])); parts.push(lobe("巨头花六厘米圆垫花头内真实相接的花托", pale, [root[0], root[1] + 0.003, root[2]], [0.055, 0.029, 0.055]));
      for (let bract = 0; bract < 8; bract++) bracts.push(radialBlade("巨头花花垫下短钝总苞而非起绒草长硬钩", green, [root[0], root[1] - 0.004, root[2]], 0.009, 0.015, 105, bract * 45));
      for (let flower = 0; flower < 16; flower++) {
        const a = flower * 2.4, radius = Math.sqrt(flower / 16) * 0.018, base: Triple = [root[0] + Math.cos(a) * radius, root[1] + 0.011 * Math.sqrt(1 - radius * radius / 0.00044), root[2] + Math.sin(a) * radius], organs: ModelPart[] = [], width = flower > 9 ? 0.0032 : 0.0024;
        flowers.push(smallCorolla(base, [Math.cos(a) * 0.12, 1, Math.sin(a) * 0.12], flower > 9 ? 0.012 : 0.009, width, cream, false, 4, 8));
        for (let stamen = 0; stamen < 4; stamen++) { const b = stamen * Math.PI / 2, tip: Triple = [base[0] + Math.cos(b) * 0.0016, base[1] + 0.019, base[2] + Math.sin(b) * 0.0016]; organs.push(needle("巨头花每朵四裂管冠内真正四枚外伸的细雄蕊", cream, [base[0], base[1] + 0.005, base[2]], tip, 0.0006), lobe("巨头花四枚外伸雄蕊端部的小花药", cream, tip, [0.0013, 0.0018, 0.0013])); }
        stamens.push(combineMeshes("巨头花一朵小花中完整的四细蕊组", cream, organs));
      }
    }
  }
  for (let i = 0; i < leaves.length; i += 12) parts.push(combineMeshes("巨头花基生大叶和上部对生小叶的完整深羽裂叶面", green, leaves.slice(i, i + 12)));
  parts.push(combineMeshes("巨头花全部短钝绿色总苞", green, bracts), combineMeshes("巨头花基生叶柄和高位花头相连的真实分枝", pale, pedicels));
  for (let i = 0; i < flowers.length; i += 5) parts.push(combineMeshes("巨头花内小外稍大而保留四裂真管的奶黄垫花", cream, flowers.slice(i, i + 5)));
  for (let i = 0; i < stamens.length; i += 7) parts.push(combineMeshes("巨头花全部小花的完整四细蕊花药组", cream, stamens.slice(i, i + 7)));
  return parts;
}

function solomonPlume(): ModelPart[] {
  const path: Triple[] = [[0, 0, 0], [0, 0.34, 0], [0.07, 0.61, 0], [0.27, 0.77, 0], [0.49, 0.79, 0.008]], parts: ModelPart[] = [tapered("总状舞鹤草没有叶腋垂钟的弧弯不分枝主茎", pale, path, [0.006, 0.005, 0.004, 0.003, 0.0015])], leaves: ModelPart[] = [], veins: ModelPart[] = [], axes: ModelPart[] = [], flowers: ModelPart[] = [], stamens: ModelPart[] = [];
  for (let leaf = 0; leaf < 10; leaf++) {
    const root = axisPosition(path, 0.16 + leaf * 0.073), side = leaf % 2 ? -1 : 1, tip: Triple = [root[0] + 0.023, root[1] + 0.038, root[2] + side * (0.15 - leaf * 0.004)], dx = tip[0] - root[0], dy = tip[1] - root[1], dz = tip[2] - root[2], length = Math.hypot(dx, dy, dz), horizontal = Math.hypot(dx, dz), across: Triple = [dz / horizontal, 0, -dx / horizontal], up: Triple = [-dy * dx / (length * horizontal), horizontal / length, -dy * dz / (length * horizontal)];
    leaves.push(flatLeaf("总状舞鹤草沿拱茎两列互生的长尖椭圆叶", root, tip, 0.069 - leaf * 0.002, "oval", 0.001));
    for (const vein of [-1, 0, 1]) { const base: Triple = root.map((v, axis) => v + up[axis]! * 0.0008) as Triple, top: Triple = tip.map((v, axis) => v + up[axis]! * 0.0008) as Triple, mid: Triple = base.map((v, axis) => v + (top[axis]! - v) * 0.5 + across[axis]! * vein * (0.017 - leaf * 0.0005)) as Triple; veins.push(needle("总状舞鹤草从叶基并行向叶尖的真实弧脉基段", pale, base, mid, 0.00055), needle("总状舞鹤草沿叶面收束到叶尖的弧脉端段", pale, mid, top, 0.00055)); }
  }
  const end = path.at(-1)!, panicle: Triple[] = [end, [0.65, 0.88, 0.008]];
  parts.push(tapered("总状舞鹤草只在拱茎末端延伸的圆锥花序轴", pale, panicle, [0.0015, 0.0005]));
  for (let branch = 0; branch < 8; branch++) {
    const t = 0.1 + branch * 0.095, root = axisPosition(panicle, t), side = branch % 2 ? -1 : 1, top: Triple = [root[0] + 0.027, root[1] + 0.025, root[2] + side * (0.05 - branch * 0.0035)];
    axes.push(needle("总状舞鹤草顶端圆锥花簇实际分出的短侧轴", pale, root, top, 0.00075));
    for (let flower = 0; flower < 5; flower++) {
      const a = flower * 2.4, at: Triple = [top[0] + Math.cos(a) * 0.008, top[1] + 0.003 + flower % 2 * 0.002, top[2] + Math.sin(a) * 0.008], organs: ModelPart[] = [];
      axes.push(needle("总状舞鹤草每朵六星小花与侧花轴的真实短柄", pale, top, at, 0.00045)); flowers.push(petals(6, at, 0.0013, 0.0031, 84, cream));
      for (let stamen = 0; stamen < 6; stamen++) { const b = stamen * Math.PI / 3, tip: Triple = [at[0] + Math.cos(b) * 0.0015, at[1] + 0.003, at[2] + Math.sin(b) * 0.0015]; organs.push(needle("总状舞鹤草微小六被星花中央独立的六根细蕊", cream, at, tip, 0.00035), lobe("总状舞鹤草六细蕊末端的独立花药", cream, tip, [0.0007, 0.001, 0.0007])); }
      stamens.push(combineMeshes("总状舞鹤草一朵小六星花的完整六蕊", cream, organs));
    }
  }
  parts.push(combineMeshes("总状舞鹤草拱茎上完整的两列互生大叶", green, leaves), combineMeshes("总状舞鹤草每叶三条沿真实叶面走向的并行弧脉", pale, veins), combineMeshes("总状舞鹤草全部真实分叉圆锥花轴与独立短花柄", pale, axes));
  for (let i = 0; i < flowers.length; i += 8) parts.push(combineMeshes("总状舞鹤草只生于顶端而非叶腋的六被微白花", cream, flowers.slice(i, i + 8)));
  for (let i = 0; i < stamens.length; i += 4) parts.push(combineMeshes("总状舞鹤草顶端微白花内真实六蕊组", cream, stamens.slice(i, i + 4)));
  return parts;
}

function woodNettlePanicle(root: Triple, heading: number, female: boolean): ModelPart[] {
  // ACT: 亚毫米花在厘米局部坐标中构造，再按0.01回到米；不放大花，也不放宽退化面阈值。
  const axes: ModelPart[] = [], flowers: ModelPart[] = [], reach = female ? 11 : 5, height = female ? -1.5 : -0.4;
  for (let branch = 0; branch < 4; branch++) {
    const a = branch * Math.PI * 0.46 - 0.69 * Math.PI, joint: Triple = [Math.cos(a) * reach * 0.55, height * 0.5, Math.sin(a) * reach * 0.55];
    axes.push(needle("加拿大艾麻叶腋花序真实分开的细侧轴", pale, [0, 0, 0], joint, 0.07));
    for (let flower = 0; flower < (female ? 4 : 3); flower++) {
      const u = 0.3 + flower * 0.22, at: Triple = [joint[0] * (1 + u * 0.58), joint[1] + height * u * 0.5, joint[2] * (1 + u * 0.58) + (flower % 2 ? 0.22 : -0.22)], organs: ModelPart[] = [];
      axes.push(needle("加拿大艾麻每枚亚毫米小花接到真实侧轴上的短细柄", pale, [joint[0] * (1 + u * 0.65), at[1], joint[2] * (1 + u * 0.65)], at, 0.025));
      if (female) {
        organs.push(lobe("加拿大艾麻上方雌小花扁而近圆的真实子房", green, at, [0.045, 0.07, 0.03]));
        for (const side of [-1, 1]) organs.push(radialBlade("加拿大艾麻贴着子房两侧的内对小花被", pale, [at[0] + side * 0.01, at[1] - 0.015, at[2]], 0.025, 0.06, 12, side > 0 ? 0 : 180));
        const bend: Triple = [at[0] + 0.05, at[1] + 0.18, at[2]], tip: Triple = [at[0] + 0.12, at[1] + 0.15, at[2]];
        organs.push(needle("加拿大艾麻雌花长于子房的细长花柱基段", pale, at, bend, 0.012), needle("加拿大艾麻雌花末端真正反弯的扁花柱", pale, bend, tip, 0.01));
      } else {
        for (let tepal = 0; tepal < 5; tepal++) {
          const a = tepal * Math.PI * 2 / 5, tip: Triple = [at[0] + Math.cos(a) * 0.045, at[1] + 0.06, at[2] + Math.sin(a) * 0.045];
          organs.push(radialBlade("加拿大艾麻下方雄小花真实五枚分离花被", pale, at, 0.035, 0.065, 72, tepal * 72), needle("加拿大艾麻雄小花和花被相对的五枚细雄蕊", cream, at, tip, 0.012), lobe("加拿大艾麻雄小花细蕊顶端的微小花药", cream, tip, [0.02, 0.025, 0.02]));
        }
      }
      flowers.push(combineMeshes(female ? "加拿大艾麻一朵真实尺寸的反弯长柱雌花" : "加拿大艾麻一朵真实尺寸的五花被五蕊雄花", pale, organs));
    }
    axes.push(needle("加拿大艾麻侧花轴贯穿各短花柄的连续末段", pale, joint, [joint[0] * 1.65, height, joint[2] * 1.65], 0.045));
  }
  const parts: ModelPart[] = [combineMeshes("加拿大艾麻保留真实分叉连接的完整叶腋花序轴", pale, axes)], batch = female ? 8 : 3;
  for (let i = 0; i < flowers.length; i += batch) parts.push(combineMeshes(female ? "加拿大艾麻上部宽展而稀疏的长柱雌花序" : "加拿大艾麻下部短小的五被五蕊雄花序", pale, flowers.slice(i, i + batch)));
  for (const value of parts) { value.scale = { x: 0.01, y: 0.01, z: 0.01 }; value.position = { x: root[0], y: root[1], z: root[2] }; value.rotation.y = 90 - heading; }
  return parts;
}

function canadianWoodNettle(): ModelPart[] {
  const path: Triple[] = [[0, 0, 0], [0.008, 0.28, 0], [-0.007, 0.57, 0.003], [0.01, 0.86, 0], [-0.005, 1.13, 0.003], [0, 1.35, 0]], stem = tapered("加拿大艾麻单一且节间轻微左右折转的高草茎", pale, path, [0.007, 0.006, 0.005, 0.004, 0.0025, 0.0012]), parts: ModelPart[] = [stem], leaves: ModelPart[] = [], hairs: ModelPart[] = [], stalks: ModelPart[] = [], stipules: ModelPart[] = [], margin: [number, number][] = [[0, 0], [-0.2, 0.06], [-0.29, 0.16], [-0.25, 0.18], [-0.44, 0.28], [-0.34, 0.31], [-0.5, 0.43], [-0.39, 0.46], [-0.45, 0.59], [-0.32, 0.6], [-0.32, 0.74], [-0.19, 0.73], [0, 1], [0.19, 0.73], [0.32, 0.74], [0.32, 0.6], [0.45, 0.59], [0.39, 0.46], [0.5, 0.43], [0.34, 0.31], [0.44, 0.28], [0.25, 0.18], [0.29, 0.16], [0.2, 0.06]];
  for (let leaf = 0; leaf < 12; leaf++) {
    const a = leaf * 2.4, base = axisPosition(path, 0.085 + leaf * 0.076), root: Triple = [base[0] + Math.cos(a) * 0.065, base[1] + 0.024, base[2] + Math.sin(a) * 0.065], length = 0.185 - Math.max(0, leaf - 5) * 0.012, tip: Triple = [root[0] + Math.cos(a) * length, root[1] + 0.034, root[2] + Math.sin(a) * length], blade = flatLeaf("加拿大艾麻明显互生而非荨麻对生的长柄粗齿阔卵叶", root, tip, length * 0.66, margin, 0.0009);
    leaves.push(blade); stalks.push(needle("加拿大艾麻单个节位长柄宽卵叶的真实圆叶柄", pale, base, root, 0.0025));
    for (const side of [-1, 1]) stipules.push(radialBlade("加拿大艾麻单叶柄基部的成对薄狭托叶", pale, base, 0.0025, 0.009, 23, a * 180 / Math.PI + side * 38));
    const length3 = Math.hypot(length, 0.034), normal = new Vector3(-0.034 * Math.cos(a) / length3, length / length3, -0.034 * Math.sin(a) / length3);
    for (const t of [0.22, 0.48, 0.71]) { const at: Triple = root.map((v, axis) => v + (tip[axis]! - v) * t + normal.getComponent(axis) * 0.0006) as Triple; hairs.push(needle("加拿大艾麻从真实上叶面相接处伸出的短刺毛", cream, at, at.map((v, axis) => v + normal.getComponent(axis) * 0.0024) as Triple, 0.00028)); }
    if (leaf === 3 || leaf === 5 || leaf >= 8 && leaf <= 10) parts.push(...woodNettlePanicle(base, a * 180 / Math.PI, leaf >= 8));
  }
  for (let point = 8; point < 40; point += 2) { const p = stem.vertices![point]!, centre = path[Math.floor(point / 8)]!, normal = new Vector3(p.x - centre[0], p.y - centre[1], p.z - centre[2]).normalize(); hairs.push(needle("加拿大艾麻从真实折转茎表面长出的稀疏短刺毛", cream, [p.x, p.y, p.z], [p.x + normal.x * 0.0022, p.y + normal.y * 0.0022, p.z + normal.z * 0.0022], 0.0003)); }
  for (let i = 0; i < leaves.length; i += 8) parts.push(combineMeshes("加拿大艾麻完整互生而宽阔的粗齿大叶", green, leaves.slice(i, i + 8)));
  parts.push(combineMeshes("加拿大艾麻全部长叶柄与折茎相连的实际连接", pale, stalks), combineMeshes("加拿大艾麻每个长叶柄基部真实成对的薄托叶", pale, stipules), combineMeshes("加拿大艾麻保持毫米真实尺寸的茎叶短刺毛", cream, hairs));
  return parts;
}

export const herbaceousExpansionBatchFourteenDesigns: MasterNatureDesign[] = [
  design("polynesianArrowrootPlant", "裂叶蒟蒻薯", "植物", polynesianArrowroot, ["Tacca leontopetaloides", "Tacca pinnatifida", "Tacca involucrata", "Tacca viridis", "真实空心长叶柄三分深羽裂大叶与狭苞垂绿花伞"]),
  design("giantScabiousPlant", "巨头花", "植物", giantScabious, ["Cephalaria gigantea", "Scabiosa gigantea", "Cephalaria caucasica", "基生深羽裂叶高叉枝及无长硬钩的奶黄四裂垫花头"]),
  design("solomonPlumePlant", "总状舞鹤草", "植物", solomonPlume, ["Maianthemum racemosum", "Smilacina racemosa", "拱茎互生平行脉大叶与只生于顶端的六被白圆锥花簇"]),
  design("canadianWoodNettlePlant", "加拿大艾麻", "植物", canadianWoodNettle, ["Laportea canadensis", "单折茎互生长柄粗齿阔卵叶与下雄上雌分置的腋生花序"]),
];
