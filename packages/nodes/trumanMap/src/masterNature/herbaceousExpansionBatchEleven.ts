import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { combineMeshes, design, lobe, needle, part, petals, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { radialBlade } from "./herbaceousExpansionBatchOne";
import { archedGrassBlade } from "./herbaceousExpansionBatchThree";
import { thinLeaf } from "./herbaceousExpansionBatchSix";
import { axisPosition } from "./herbaceousExpansionBatchTen";

const green = "#84996f";
const pale = "#b0bc97";
const brown = "#a4967c";
const cream = "#d8d2b6";
const purple = "#b2a1b8";

// 原创完整米制植物，叶背囊群按真实形状建模，不借花色或盆栽状态扩主。
// https://www.rhs.org.uk/plants/114462/dryopteris-filix-mas/details
// https://research.fs.usda.gov/feis/species-reviews/athfil
// https://www.nparks.gov.sg/florafaunaweb/flora/8/0/8014
// https://www.nparks.gov.sg/florafaunaweb/flora/1/5/1535
// https://www.rhs.org.uk/plants/3094/carex-pendula/details
// https://www.rhs.org.uk/plants/17359/silybum-marianum/details
// https://plants.ces.ncsu.edu/plants/vernonia-noveboracensis/
// https://www.rhs.org.uk/plants/10394/lobelia-cardinalis/details
// https://www.rhs.org.uk/plants/1024/althaea-officinalis/details
// https://plants.ces.ncsu.edu/plants/tithonia-rotundifolia/

function maleFern(): ModelPart[] {
  const parts: ModelPart[] = [lobe("雄鳞毛蕨形成漏斗叶冠的鳞被短根茎", brown, [0, 0.07, 0], [0.22, 0.15, 0.22])];
  const kidney: [number, number][] = [[0, 0.24], [-0.25, 0.05], [-0.47, 0.14], [-0.5, 0.45], [-0.3, 0.74], [0, 0.84], [0.3, 0.74], [0.5, 0.45], [0.47, 0.14], [0.25, 0.05]];
  for (let frond = 0; frond < 5; frond++) {
    const a = frond * 2.4, path: Triple[] = [[0, 0.06, 0], [Math.cos(a) * 0.19, 0.86, Math.sin(a) * 0.19], [Math.cos(a) * 0.61, 1.16 + frond % 2 * 0.045, Math.sin(a) * 0.61]], leaves: ModelPart[] = [], spores: ModelPart[] = [];
    parts.push(tapered("雄鳞毛蕨粗硬漏斗叶的连续叶轴", pale, path, [0.009, 0.0045, 0.0008]));
    for (let node = 0; node < 22; node++) for (const side of [-1, 1]) {
      const t = 0.25 + node * 0.033, p = axisPosition(path, t), b = a + side * 1.18, span = 0.2 * Math.sin((t - 0.08) / 0.92 * Math.PI);
      leaves.push(thinLeaf(flatLeaf("雄鳞毛蕨狭长羽片沿羽轴深裂的连续叶肉", p, [p[0] + Math.cos(b) * span, p[1] + 0.017, p[2] + Math.sin(b) * span], span * 0.32, "lobed", 0.0007)));
      if (frond >= 2 || node < 8 || node % 4) continue;
      for (let cluster = 0; cluster < 4; cluster++) for (const edge of [-1, 1]) {
        const u = 0.16 + cluster * 0.12, offset = edge * span * 0.025, root: Triple = [p[0] + Math.cos(b) * span * u - Math.sin(b) * offset, p[1] + 0.017 * u - 0.00025, p[2] + Math.sin(b) * span * u + Math.cos(b) * offset], value = flatLeaf("雄鳞毛蕨叶背真实有凹口的肾形囊被", root, [root[0] + Math.cos(b) * 0.0032, root[1] + 0.017 / span * 0.0032, root[2] + Math.sin(b) * 0.0032], 0.0032, kidney, 0.0004);
        value.color = brown; spores.push(value);
      }
    }
    for (let i = 0; i < leaves.length; i += 14) parts.push(combineMeshes("雄鳞毛蕨保留全部羽片齿裂的完整长叶列", green, leaves.slice(i, i + 14)));
    for (let i = 0; i < spores.length; i += 20) parts.push(combineMeshes("雄鳞毛蕨叶背成对排列的真正肾形孢子囊群", brown, spores.slice(i, i + 20)));
  }
  return parts;
}

function ladyFern(): ModelPart[] {
  const parts: ModelPart[] = [lobe("蹄盖蕨细羽叶丛下的短横生根茎", brown, [0, 0.04, 0], [0.18, 0.09, 0.16])];
  const teeth: [number, number][] = [[0, 0], [-0.42, 0.13], [-0.23, 0.24], [-0.5, 0.42], [-0.27, 0.48], [-0.28, 0.72], [0, 1], [0.28, 0.72], [0.27, 0.48], [0.5, 0.42], [0.23, 0.24], [0.42, 0.13]];
  for (let frond = 0; frond < 3; frond++) {
    const a = frond * Math.PI * 2 / 3, path: Triple[] = [[0, 0.035, 0], [Math.cos(a) * 0.21, 0.96, Math.sin(a) * 0.21], [Math.cos(a) * 0.79, 1.33 + frond * 0.04, Math.sin(a) * 0.79]], pinnae: ModelPart[] = [], sori: ModelPart[] = [];
    parts.push(tapered("蹄盖蕨细软而上部弧展的长叶轴", pale, path, [0.0065, 0.0034, 0.0006]));
    for (let node = 0; node < 21; node++) for (const side of [-1, 1]) {
      const t = 0.24 + node * 0.035 + (side < 0 ? 0.008 : 0), root = axisPosition(path, t), b = a + side * 1.16, span = 0.25 * Math.sin((t - 0.16) / 0.84 * Math.PI), end: Triple = [root[0] + Math.cos(b) * span, root[1] + 0.02, root[2] + Math.sin(b) * span], pieces: ModelPart[] = [needle("蹄盖蕨二回细羽片的实际次级轴", pale, root, end, 0.0012)];
      for (let leaflet = 0; leaflet < 3; leaflet++) for (const edge of [-1, 1]) {
        const u = 0.18 + leaflet * 0.28, p: Triple = root.map((v, axis) => v + (end[axis]! - v) * u) as Triple, c = b + edge * 1.16, reach = span * (0.25 - leaflet * 0.035), distal: Triple = [p[0] + Math.cos(c) * reach, p[1] + 0.008, p[2] + Math.sin(c) * reach];
        pieces.push(thinLeaf(flatLeaf("蹄盖蕨远比雄鳞毛蕨更细分的尖锯小羽片", p, distal, reach * 0.32, teeth, 0.0005)));
        if (frond || node % 5 || leaflet !== 1) continue;
        const q: Triple = [p[0] + Math.cos(c) * reach * 0.45, p[1] + 0.008 * 0.45 - 0.0002, p[2] + Math.sin(c) * reach * 0.45], curve: Triple[] = [[q[0] - Math.sin(c) * 0.001, q[1], q[2] + Math.cos(c) * 0.001], q, [q[0] + Math.cos(c) * 0.0022, q[1] + 0.008 / reach * 0.0022, q[2] + Math.sin(c) * 0.0022], [q[0] + Math.cos(c) * 0.0025 - Math.sin(c) * 0.0008, q[1] + 0.008 / reach * 0.0025, q[2] + Math.sin(c) * 0.0025 + Math.cos(c) * 0.0008]];
        for (let segment = 0; segment < 3; segment++) sori.push(needle("蹄盖蕨叶背真正弯成钩形而非圆点的长囊群", brown, curve[segment]!, curve[segment + 1]!, 0.0006));
      }
      pinnae.push(combineMeshes("蹄盖蕨保留细轴和六枚尖锯小羽片的一片侧羽", green, pieces));
    }
    for (let i = 0; i < pinnae.length; i += 3) parts.push(combineMeshes("蹄盖蕨完整二回细分的相连大叶段", green, pinnae.slice(i, i + 3)));
    if (sori.length) parts.push(combineMeshes("蹄盖蕨贴附叶背的弯钩形孢子囊群", brown, sori));
  }
  return parts;
}

function vegetableFern(): ModelPart[] {
  const parts: ModelPart[] = [lobe("菜蕨长叶柄基部小型直立根茎", brown, [0, 0.04, 0], [0.17, 0.09, 0.16])];
  const teeth: [number, number][] = [[0, 0], [-0.48, -0.045], [-0.29, 0.14], [-0.5, 0.33], [-0.35, 0.36], [-0.36, 0.61], [-0.23, 0.64], [0, 1], [0.23, 0.64], [0.36, 0.61], [0.35, 0.36], [0.5, 0.33], [0.29, 0.14]];
  for (let frond = 0; frond < 4; frond++) {
    const a = frond * 2.4, base: Triple = [Math.cos(a) * 0.06, 0.66, Math.sin(a) * 0.06], tip: Triple = [Math.cos(a) * 0.76, 0.96 + frond % 2 * 0.025, Math.sin(a) * 0.76], pinnae: ModelPart[] = [], sori: ModelPart[] = [];
    parts.push(tapered("菜蕨长七十厘米的裸叶柄与斜展主叶轴", pale, [[0, 0.035, 0], base, tip], [0.008, 0.004, 0.0008]));
    for (let node = 0; node < 6; node++) for (const side of [-1, 1]) {
      const t = 0.08 + node * 0.15, root: Triple = base.map((v, axis) => v + (tip[axis]! - v) * t) as Triple, b = a + side * 1.1, span = 0.31 * (1 - t * 0.67), end: Triple = [root[0] + Math.cos(b) * span, root[1] + 0.018, root[2] + Math.sin(b) * span], pieces: ModelPart[] = [needle("菜蕨二回羽状大叶真实展开的侧羽轴", pale, root, end, 0.0016)];
      for (let leaflet = 0; leaflet < 6; leaflet++) for (const edge of [-1, 1]) {
        const u = 0.11 + leaflet * 0.145, p: Triple = root.map((v, axis) => v + (end[axis]! - v) * u) as Triple, c = b + edge * 1.13, reach = 0.066 - leaflet * 0.006;
        pieces.push(thinLeaf(flatLeaf("菜蕨具耳形叶基和细锯齿的薄纸质小羽片", p, [p[0] + Math.cos(c) * reach, p[1] + 0.008, p[2] + Math.sin(c) * reach], reach * 0.32, teeth, 0.0006)));
        if (frond || node % 2 || leaflet !== 2) continue;
        for (let vein = 0; vein < 3; vein++) for (const flank of [-1, 1]) { const v = 0.22 + vein * 0.2, offset = flank * 0.0009, q: Triple = [p[0] + Math.cos(c) * reach * v - Math.sin(c) * offset, p[1] + 0.008 * v - 0.0002, p[2] + Math.sin(c) * reach * v + Math.cos(c) * offset]; sori.push(needle("菜蕨沿末级侧脉成对斜出的线形囊群", brown, q, [q[0] + Math.cos(c + flank * 0.8) * 0.004, q[1] + 0.0005, q[2] + Math.sin(c + flank * 0.8) * 0.004], 0.0006)); }
      }
      pinnae.push(combineMeshes("菜蕨长裸柄以上保留全部二回纸质小羽的一片侧叶", green, pieces));
    }
    for (const pinna of pinnae) parts.push(pinna);
    if (sori.length) parts.push(combineMeshes("菜蕨贴在真实叶背侧脉上的成对线形囊群", brown, sori));
  }
  return parts;
}

function goldenLeatherFern(): ModelPart[] {
  const parts: ModelPart[] = [lobe("卤蕨海岸大叶冠的粗直立鳞被根茎", brown, [0, 0.15, 0], [0.39, 0.31, 0.32])];
  const left: [number, number][] = [[-0.045, 0.025], [-0.26, 0.12], [-0.48, 0.36], [-0.47, 0.75], [-0.24, 0.98], [-0.045, 0.99]], right = left.map(([x, y]): [number, number] => [-x, y]).reverse();
  for (let frond = 0; frond < 5; frond++) {
    const a = frond * 2.4, path: Triple[] = [[0, 0.13, 0], [Math.cos(a) * 0.18, 1.12, Math.sin(a) * 0.18], [Math.cos(a) * 0.81, 2.27 + frond % 2 * 0.14, Math.sin(a) * 0.81]], leaves: ModelPart[] = [], felt: ModelPart[] = [];
    parts.push(tapered("卤蕨裸叶柄长约一米且上部一次羽状的粗叶轴", pale, path, [0.018, 0.011, 0.0015]));
    for (let node = 0; node < 15; node++) for (const side of [-1, 1]) {
      const t = 0.49 + node * 0.033 + (side < 0 ? 0.009 : 0), p = axisPosition(path, t), b = a + side * 1.1, span = 0.39 - node * 0.014, end: Triple = [p[0] + Math.cos(b) * span, p[1] + 0.037, p[2] + Math.sin(b) * span], width = 0.063 - node * 0.0016;
      leaves.push(flatLeaf("卤蕨全缘而先端钝圆的厚革质长圆羽片", p, end, width, "obovate", 0.0012));
      if (node < 9) continue;
      // ACT: 微米级密孢子囊层以真实薄面表达，保留中央无囊中肋，不逐粒制造不可见囊体。
      for (const outline of [left, right]) { const root: Triple = [p[0], p[1] - 0.00013, p[2]], distal: Triple = [end[0], end[1] - 0.00013, end[2]], patch = flatLeaf("卤蕨顶羽叶背遍布孢子囊且避开中肋的真实薄层", root, distal, width * 0.95, outline, 0.00025); patch.color = brown; felt.push(patch); }
    }
    const root = axisPosition(path, 0.965), tip = path[2]!;
    leaves.push(flatLeaf("卤蕨粗叶轴最上端相连的长圆顶生羽片", root, [tip[0] + Math.cos(a) * 0.16, tip[1] + 0.04, tip[2] + Math.sin(a) * 0.16], 0.038, "obovate", 0.0012));
    for (let i = 0; i < leaves.length; i += 16) parts.push(combineMeshes("卤蕨交错排列的全部完整厚长圆羽片", green, leaves.slice(i, i + 16)));
    for (let i = 0; i < felt.length; i += 20) parts.push(combineMeshes("卤蕨顶端六对羽片叶背的连续褐孢子层", brown, felt.slice(i, i + 20)));
  }
  return parts;
}

function pendulousSedge(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let leaf = 0; leaf < 21; leaf++) { const a = leaf * 137.5; parts.push(archedGrassBlade("悬穗薹草从基部丛生且真实纵褶的长带叶", [Math.cos(a) * 0.025, 0.005, Math.sin(a) * 0.025], a, 0.47 + leaf % 4 * 0.055, 0.023, 0.61 + leaf % 3 * 0.09)); }
  for (let stem = 0; stem < 4; stem++) {
    const a = stem * 2.4, top: Triple = [Math.cos(a) * 0.09, 1.31 + stem % 2 * 0.09, Math.sin(a) * 0.09], path: Triple[] = [[0, 0, 0], top];
    parts.push(part("悬穗薹草真正有三角截面而非禾草圆秆的花秆", "mesh", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices: [0, 1].flatMap(level => Array.from({ length: 3 }, (_, i) => { const b = i * Math.PI * 2 / 3; return { x: top[0] * level + Math.cos(b) * 0.0035, y: top[1] * level, z: top[2] * level + Math.sin(b) * 0.0035 }; })), indices: [0, 2, 1, 3, 4, 5, 0, 1, 3, 1, 4, 3, 1, 2, 4, 2, 5, 4, 2, 0, 5, 0, 3, 5] }));
    for (let spike = 0; spike < 4; spike++) {
      const root = axisPosition(path, 0.68 + spike * 0.08), b = a + spike * 1.6, elbow: Triple = [root[0] + Math.cos(b) * 0.085, root[1] + 0.025, root[2] + Math.sin(b) * 0.085], tip: Triple = [elbow[0] + Math.cos(b) * 0.02, elbow[1] - 0.19 + spike * 0.012, elbow[2] + Math.sin(b) * 0.02], grains: ModelPart[] = [];
      parts.push(tapered("悬穗薹草从上部节伸出后重力弯垂的细穗柄", pale, [root, elbow, tip], [0.001, 0.0007, 0.0004]));
      for (let grain = 0; grain < 24; grain++) { const t = 0.1 + grain / 26 * 0.86, c = grain * 2.4, p: Triple = elbow.map((v, axis) => v + (tip[axis]! - v) * t) as Triple; grains.push(lobe("悬穗薹草长垂雌穗表面分离的小果囊", brown, [p[0] + Math.cos(c) * 0.002, p[1], p[2] + Math.sin(c) * 0.002], [0.0032, 0.005, 0.0032])); }
      parts.push(combineMeshes("悬穗薹草真实长圆柱而非单个吊球的垂穗", brown, grains));
    }
    parts.push(tapered("悬穗薹草秆顶较短的直立雄穗", brown, [top, [top[0], top[1] + 0.064, top[2]]], [0.003, 0.0013]));
  }
  return parts;
}

function milkThistle(): ModelPart[] {
  const parts: ModelPart[] = [tapered("水飞蓟没有连续纵向膜翼的粗直立花秆", pale, [[0, 0, 0], [0, 1.28, 0]], [0.013, 0.003])];
  for (let leaf = 0; leaf < 9; leaf++) {
    const a = leaf * 2.4, y = leaf < 6 ? 0.012 : 0.34 + (leaf - 6) * 0.22, length = leaf < 6 ? 0.36 + leaf % 2 * 0.04 : 0.23 - (leaf - 6) * 0.035, root: Triple = [0, y, 0], tip: Triple = [Math.cos(a) * length, y + 0.07, Math.sin(a) * length], blade = flatLeaf("水飞蓟基生大刺裂叶与上部渐小抱茎叶", root, tip, length * 0.48, "lobed", 0.0012), veins: ModelPart[] = [], spines: ModelPart[] = [];
    parts.push(blade);
    const start: Triple = [0, y + 0.0008, 0], end: Triple = [tip[0], tip[1] + 0.0008, tip[2]];
    veins.push(needle("水飞蓟沿大叶中脉延伸的明显白叶脉", cream, start, end, 0.0012));
    for (let node = 0; node < 3; node++) for (const side of [-1, 1]) { const t = [0.18, 0.4, 0.65][node]!, width = length * 0.48 * [0.42, 0.5, 0.34][node]!, p: Triple = [tip[0] * t, y + 0.07 * t + 0.0008, tip[2] * t]; veins.push(needle("水飞蓟沿真实裂片侧脉铺开的白色细分脉", cream, p, [p[0] - Math.sin(a) * side * width, p[1], p[2] + Math.cos(a) * side * width], 0.0009)); }
    for (let point = 2; point < blade.vertices!.length / 2; point += 3) { const p = blade.vertices![point]!, base: Triple = [root[0] + p.x, root[1] + p.y, root[2] + p.z], dx = p.x - tip[0] * 0.4, dz = p.z - tip[2] * 0.4, size = Math.hypot(dx, dz); spines.push(needle("水飞蓟从真实叶缘顶点长出的分立硬刺", cream, base, [base[0] + dx / size * 0.009, base[1] + 0.002, base[2] + dz / size * 0.009], 0.0008)); }
    parts.push(combineMeshes("水飞蓟在真实绿叶表面分枝的白脉网", cream, veins), combineMeshes("水飞蓟大裂叶外缘相接的真实硬刺", cream, spines));
  }
  for (let head = 0; head < 4; head++) {
    const a = head * 2.4, root: Triple = [Math.cos(a) * 0.2, 1.17 + head * 0.044, Math.sin(a) * 0.2], bracts: ModelPart[] = [], flowers: ModelPart[] = [];
    parts.push(tapered("水飞蓟单生头花下真实展开的细分枝", pale, [[0, 0.76 + head * 0.1, 0], root], [0.004, 0.0015]), lobe("水飞蓟花头包住小花基部的厚总苞", green, root, [0.044, 0.042, 0.044]));
    for (let bract = 0; bract < 24; bract++) { const b = bract * 2.4, p: Triple = [root[0] + Math.cos(b) * 0.015, root[1] - 0.012 + bract % 3 * 0.006, root[2] + Math.sin(b) * 0.015]; bracts.push(radialBlade("水飞蓟总苞向外翻并以长刺结束的独立苞片", pale, p, 0.006, 0.025, 116, b * 180 / Math.PI)); }
    parts.push(combineMeshes("水飞蓟花头多层外翻长尖总苞片", pale, bracts));
    for (let floret = 0; floret < 14; floret++) { const b = floret * 2.4, r = Math.sqrt((floret + 0.5) / 14) * 0.014, p: Triple = [root[0] + Math.cos(b) * r, root[1] + 0.008, root[2] + Math.sin(b) * r]; flowers.push(smallCorolla(p, [Math.cos(b) * 0.1, 1, Math.sin(b) * 0.1], 0.018, 0.0014, purple, false, 5, 8)); }
    for (let i = 0; i < flowers.length; i += 4) parts.push(combineMeshes("水飞蓟具开口与五裂端的真实紫色细管小花", purple, flowers.slice(i, i + 4)));
  }
  return parts;
}

function newYorkIronweed(): ModelPart[] {
  const parts: ModelPart[] = [tapered("纽约斑鸠菊粗硬直立且上端分枝的高秆", pale, [[0, 0, 0], [0, 2.06, 0]], [0.012, 0.0025])];
  const teeth: [number, number][] = [[0, 0], [-0.3, 0.18], [-0.25, 0.2], [-0.5, 0.44], [-0.35, 0.47], [-0.3, 0.7], [-0.18, 0.73], [0, 1], [0.18, 0.73], [0.3, 0.7], [0.35, 0.47], [0.5, 0.44], [0.25, 0.2], [0.3, 0.18]];
  for (let leaf = 0; leaf < 14; leaf++) { const a = leaf * 2.4, y = 0.08 + leaf * 0.112, length = 0.21 - leaf * 0.006; parts.push(flatLeaf("纽约斑鸠菊沿高秆互生而不五枚轮生的尖齿长叶", [0, y, 0], [Math.cos(a) * length, y + 0.026, Math.sin(a) * length], length * 0.25, teeth, 0.0008)); }
  for (let branch = 0; branch < 7; branch++) {
    const a = branch * 2.4, root: Triple = [Math.cos(a) * 0.23, 1.93 + branch % 3 * 0.065, Math.sin(a) * 0.23], flowers: ModelPart[] = [], pedicels: ModelPart[] = [], heads: ModelPart[] = [];
    parts.push(tapered("纽约斑鸠菊上端平顶聚伞头花群的细分枝", pale, [[0, 1.62 + branch % 3 * 0.1, 0], root], [0.004, 0.0012]));
    for (let head = 0; head < 3; head++) { const b = a + (head - 1) * 0.8, p: Triple = [root[0] + Math.cos(b) * 0.025, root[1] + head % 2 * 0.009, root[2] + Math.sin(b) * 0.025]; pedicels.push(needle("纽约斑鸠菊每枚小头状花序的独立短柄", pale, root, p, 0.001)); heads.push(lobe("纽约斑鸠菊不具舌花而只承托管花的小总苞", green, p, [0.01, 0.012, 0.01])); for (let floret = 0; floret < 5; floret++) { const c = floret * Math.PI * 0.4, base: Triple = [p[0] + Math.cos(c) * 0.0025, p[1] + 0.002, p[2] + Math.sin(c) * 0.0025]; flowers.push(smallCorolla(base, [Math.cos(c) * 0.3, 1, Math.sin(c) * 0.3], 0.006, 0.0013, purple, false, 5, 8)); } }
    parts.push(combineMeshes("纽约斑鸠菊全部相连的小头花柄", pale, pedicels), combineMeshes("纽约斑鸠菊紫管花下真正分离的绿色小总苞", green, heads));
    for (let i = 0; i < flowers.length; i += 4) parts.push(combineMeshes("纽约斑鸠菊平顶小头中没有舌花的五裂紫管花", purple, flowers.slice(i, i + 4)));
  }
  return parts;
}

function cardinalFlower(root: Triple, heading: number): ModelPart {
  const tube = sweptProfile("红花半边莲上方有真实纵裂口的长花管", "#b49b92", [[0.0015, 0], [0.0032, 0.029], [0.0025, 0.029], [0.0009, 0]], Math.PI * 1.75, 12), pieces: ModelPart[] = [];
  tube.rotation.y = 247.5; pieces.push(tube);
  for (const angle of [60, 120, 200, 270, 340]) { const a = angle * Math.PI / 180, upper = angle < 180; pieces.push(radialBlade(upper ? "红花半边莲上唇两枚细长分离裂瓣" : "红花半边莲下唇三枚较宽开展裂瓣", "#b49b92", [Math.cos(a) * 0.0029, 0.0285, Math.sin(a) * 0.0029], upper ? 0.0027 : 0.0052, upper ? 0.012 : 0.018, 74, angle)); }
  pieces.push(tapered("红花半边莲从纵裂花管上缘伸出的细花蕊柱", cream, [[0, 0.002, 0.001], [0, 0.032, 0.002]], [0.0009, 0.0006]));
  const value = combineMeshes("红花半边莲具有纵裂长管和上二下三双唇的完整花", "#b49b92", pieces), a = heading * Math.PI / 180, axis = new Vector3(Math.cos(a), 0.18, Math.sin(a)).normalize(), up = new Vector3(0, 1, 0).addScaledVector(axis, -axis.y).normalize(), q = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3().crossVectors(axis, up), axis, up)), e = new Euler().setFromQuaternion(q);
  value.position = { x: root[0], y: root[1], z: root[2] }; value.rotation = { x: e.x * 180 / Math.PI, y: e.y * 180 / Math.PI, z: e.z * 180 / Math.PI }; return value;
}

function cardinalFlowerPlant(): ModelPart[] {
  const parts: ModelPart[] = [tapered("红花半边莲自基部抽出的单一高叶秆", pale, [[0, 0, 0], [0, 0.91, 0]], [0.006, 0.0014])];
  for (let leaf = 0; leaf < 10; leaf++) { const a = leaf * 2.4, y = 0.025 + leaf * 0.052, length = 0.15 - leaf * 0.007; parts.push(flatLeaf("红花半边莲互生的光泽长椭圆叶", [0, y, 0], [Math.cos(a) * length, y + 0.025, Math.sin(a) * length], length * 0.3, "oval", 0.0007)); }
  for (let flower = 0; flower < 13; flower++) { const a = flower * 2.4, y = 0.55 + flower * 0.027, root: Triple = [Math.cos(a) * 0.014, y + 0.003, Math.sin(a) * 0.014]; parts.push(needle("红花半边莲顶生长穗每花独立的短柄", pale, [0, y, 0], root, 0.001), cardinalFlower(root, a * 180 / Math.PI)); }
  return parts;
}

function marshMallow(): ModelPart[] {
  const parts: ModelPart[] = [], leafOutline: [number, number][] = [[0, 0], [-0.27, 0.02], [-0.36, 0.25], [-0.5, 0.49], [-0.28, 0.54], [-0.26, 0.76], [0, 1], [0.26, 0.76], [0.28, 0.54], [0.5, 0.49], [0.36, 0.25], [0.27, 0.02]];
  for (let stem = 0; stem < 3; stem++) {
    const a = stem * 2.4, x = Math.cos(a) * 0.07, z = Math.sin(a) * 0.07, height = 1.54 + stem * 0.06, foliage: ModelPart[] = [], petioles: ModelPart[] = [];
    parts.push(tapered("药蜀葵灰绿的独立长草秆", pale, [[x, 0, z], [x, height, z]], [0.007, 0.0015]));
    for (let node = 0; node < 7; node++) {
      const y = 0.13 + node * 0.185, b = a + node * 2.4, p: Triple = [x + Math.cos(b) * 0.027, y + 0.012, z + Math.sin(b) * 0.027], length = 0.13 - node * 0.008;
      petioles.push(needle("药蜀葵互生灰绿三浅裂叶的实际短叶柄", pale, [x, y, z], p, 0.0014));
      foliage.push(flatLeaf("药蜀葵区别于蜀葵大圆叶的三浅裂卵叶", p, [p[0] + Math.cos(b) * length, p[1] + 0.022, p[2] + Math.sin(b) * length], length * 0.8, leafOutline, 0.0008));
      if (node < 4) continue;
      for (const side of [-1, 1]) {
        const c = b + side * 0.75, root: Triple = [x + Math.cos(c) * 0.043, y + 0.035, z + Math.sin(c) * 0.043], sepals: ModelPart[] = [needle("药蜀葵叶腋小花簇独立伸出的细短梗", pale, [x, y, z], root, 0.0013)], organs: ModelPart[] = [tapered("药蜀葵花中央雄蕊合生成的细柱", cream, [root, [root[0], root[1] + 0.012, root[2]]], [0.002, 0.0013])];
        for (let sepal = 0; sepal < 5; sepal++) sepals.push(radialBlade("药蜀葵花基部五枚真实狭尖萼裂片", pale, root, 0.002, 0.005, 80, sepal * 72));
        for (let anther = 0; anther < 12; anther++) { const d = anther * 2.4; organs.push(lobe("药蜀葵中央蕊柱上分立的浅色短花药", cream, [root[0] + Math.cos(d) * 0.002, root[1] + 0.004 + anther % 3 * 0.0028, root[2] + Math.sin(d) * 0.002], [0.0013, 0.0013, 0.0013])); }
        parts.push(combineMeshes("药蜀葵与叶腋相连的花柄萼片", pale, sepals), petals(5, root, 0.012, 0.017, 73, "#c7b7bf"), combineMeshes("药蜀葵小五瓣盘花中真实突出的合蕊柱花药群", cream, organs));
      }
    }
    parts.push(combineMeshes("药蜀葵高草秆上全部互生三浅裂叶", "#9bad96", foliage), combineMeshes("药蜀葵全部叶片实际相连的短柄", pale, petioles));
  }
  return parts;
}

function mexicanSunflower(): ModelPart[] {
  const parts: ModelPart[] = [tapered("墨西哥向日葵有多枝而非单一巨盘的粗草茎", pale, [[0, 0, 0], [0, 1.62, 0]], [0.014, 0.002])], shape: [number, number][] = [[0, 0.06], [-0.23, -0.04], [-0.33, 0.16], [-0.5, 0.44], [-0.22, 0.4], [-0.14, 0.71], [0, 1], [0.14, 0.71], [0.22, 0.4], [0.5, 0.44], [0.33, 0.16], [0.23, -0.04]];
  for (let leaf = 0; leaf < 11; leaf++) { const a = leaf * 2.4, y = 0.09 + leaf * 0.12, p: Triple = [Math.cos(a) * 0.045, y + 0.014, Math.sin(a) * 0.045], length = 0.25 - leaf * 0.01; parts.push(needle("墨西哥向日葵互生粗糙三角叶的真实叶柄", pale, [0, y, 0], p, 0.002), flatLeaf("墨西哥向日葵常三裂的宽三角形叶", p, [p[0] + Math.cos(a) * length, p[1] + 0.04, p[2] + Math.sin(a) * length], length * 0.67, shape, 0.001)); }
  for (let flower = 0; flower < 6; flower++) {
    const a = flower * 2.4, root: Triple = [Math.cos(a) * 0.27, 1.45 + flower % 3 * 0.115, Math.sin(a) * 0.27], rays: ModelPart[] = [], disc: ModelPart[] = [], bracts: ModelPart[] = [];
    parts.push(tapered("墨西哥向日葵头花下部明显伸长的细花梗", pale, [[0, 0.98 + flower % 3 * 0.16, 0], root], [0.004, 0.0014]), lobe("墨西哥向日葵小黄管花下真正承托它们的凸起花托", "#c5b78b", [root[0], root[1] + 0.001, root[2]], [0.033, 0.009, 0.033]));
    for (let ray = 0; ray < 13; ray++) rays.push(radialBlade("墨西哥向日葵小头花外围分离的宽橙舌状花", "#bba083", root, 0.011, 0.036, 85, ray * 360 / 13));
    for (let floret = 0; floret < 26; floret++) { const b = floret * 2.4, r = Math.sqrt((floret + 0.5) / 26) * 0.012; disc.push(lobe("墨西哥向日葵不成巨大黑籽盘的独立黄管花粒", "#c5b78b", [root[0] + Math.cos(b) * r, root[1] + 0.002, root[2] + Math.sin(b) * r], [0.003, 0.004, 0.003])); }
    for (let bract = 0; bract < 12; bract++) bracts.push(radialBlade("墨西哥向日葵小花盘下的短低总苞片", pale, [root[0], root[1] - 0.004, root[2]], 0.005, 0.012, 113, bract * 30));
    parts.push(combineMeshes("墨西哥向日葵独立橙舌状花的完整轮", "#bba083", rays), combineMeshes("墨西哥向日葵中央小黄管花盘", "#c5b78b", disc), combineMeshes("墨西哥向日葵短总苞包托的小花头底部", pale, bracts));
  }
  return parts;
}

export const herbaceousExpansionBatchElevenDesigns: MasterNatureDesign[] = [
  design("maleFernPlant", "雄鳞毛蕨", "植物", maleFern, ["Dryopteris filix-mas", "漏斗叶冠连续深裂羽片和叶背肾形囊被"]),
  design("commonLadyFernPlant", "蹄盖蕨", "植物", ladyFern, ["Athyrium filix-femina", "细分二回尖锯小羽叶与贴叶背的弯钩囊群"]),
  design("vegetableFernPlant", "菜蕨", "植物", vegetableFern, ["Diplazium esculentum", "七十厘米裸叶柄纸质耳基小羽与成对斜线囊群"]),
  design("goldenLeatherFernPlant", "卤蕨", "植物", goldenLeatherFern, ["Acrostichum aureum", "米长裸柄和钝长圆革羽顶端整面叶背孢子层"]),
  design("pendulousSedgePlant", "悬穗薹草", "植物", pendulousSedge, ["Carex pendula", "三角花秆带状褶叶与多条真正长圆柱下垂穗"]),
  design("milkThistlePlant", "水飞蓟", "植物", milkThistle, ["Silybum marianum", "白脉大刺裂叶和外翻长刺总苞的紫管花头"]),
  design("newYorkIronweedPlant", "纽约斑鸠菊", "植物", newYorkIronweed, ["Vernonia noveboracensis", "高硬秆互生尖齿叶与无舌花紫管小头群"]),
  design("cardinalFlowerPlant", "红花半边莲", "植物", cardinalFlowerPlant, ["Lobelia cardinalis", "互生长叶高穗和纵裂长管上二下三的双唇花"]),
  design("marshMallowPlant", "药蜀葵", "植物", marshMallow, ["Althaea officinalis", "高灰绿草秆互生三浅裂叶及具中央合蕊柱的小五瓣花"]),
  design("mexicanSunflowerPlant", "墨西哥向日葵", "植物", mexicanSunflower, ["Tithonia rotundifolia", "三裂三角互生粗叶及长花梗上的小橙舌黄盘花头"]),
];
