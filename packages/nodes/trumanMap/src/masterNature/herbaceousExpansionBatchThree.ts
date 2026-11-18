import { combineMeshes, design, lobe, needle, part, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { radialBlade } from "./herbaceousExpansionBatchOne";

const green = "#839971";
const pale = "#b3bf99";
const cream = "#d6d1b6";
const mauve = "#b4a8bd";
const straw = "#c6b99a";

// 原创高大草本、巨蕨与禾草。物种尺寸依据植物园/植物志，不放大微型物体。
// https://www.nparks.gov.sg/florafaunaweb/flora/4/8/4813
// https://www.nparks.gov.sg/florafaunaweb/flora/2/5/2502
// https://apps.lucidcentral.org/ferns/text/entities/angiopteris_evecta.htm
// https://www.rhs.org.uk/plants/4431/cortaderia-selloana/details
// https://plantnet.rbgsyd.nsw.gov.au/cgi-bin/NSWfl.pl?lvl=sp&name=Cenchrus~purpureus&page=nswfl

export function archedGrassBlade(name: string, root: Triple, heading: number, reach: number, width: number, arch: number): ModelPart {
  const a = heading * Math.PI / 180;
  const cross = [[-0.5, 0], [-0.25, 0.08], [0, 0.15], [0.25, 0.08], [0.5, 0], [0, -0.035]];
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let row = 0; row < 7; row++) {
    const t = row / 6, spread = Math.max(0.001, width * Math.sin((t * 0.96 + 0.02) * Math.PI));
    for (const [x, y] of cross) vertices.push({ x: (Math.cos(a) * reach * t + Math.sin(a) * x! * spread) * 10, y: (Math.sin(t * Math.PI * 0.87) * arch + y! * spread) * 10, z: (Math.sin(a) * reach * t - Math.cos(a) * x! * spread) * 10 });
    if (row) for (let edge = 0; edge < 6; edge++) { const start = (row - 1) * 6 + edge, next = (row - 1) * 6 + (edge + 1) % 6; indices.push(start, start + 6, next, next, start + 6, next + 6); }
  }
  for (let i = 1; i < 5; i++) indices.push(0, i, i + 1, 36, 36 + i + 1, 36 + i);
  return part(name, "mesh", green, root, [0.1, 0.1, 0.1], [0, 0, 0], { vertices, indices });
}

function nobleRhubarb(): ModelPart[] {
  const parts: ModelPart[] = [tapered("塔黄花期直立而粗壮的中心茎", pale, [[0, 0, 0], [0, 1.95, 0]], [0.035, 0.005])];
  for (let i = 0; i < 6; i++) {
    const a = i * 2.4, root: Triple = [Math.cos(a) * 0.07, 0.13 + i % 2 * 0.04, Math.sin(a) * 0.07];
    parts.push(tapered("塔黄下部大型绿色营养叶的短粗柄", pale, [[0, 0.025, 0], root], [0.008, 0.005]), flatLeaf("塔黄基生长卵圆绿叶而非花序苞片", root, [root[0] + Math.cos(a) * 0.48, root[1] + 0.08, root[2] + Math.sin(a) * 0.48], 0.26, "oval", 0.002));
  }
  const bracts: ModelPart[] = [], flowers: ModelPart[] = [];
  for (let row = 0; row < 12; row++) {
    const t = row / 11, y = 0.42 + t * 1.46;
    for (let i = 0; i < 4; i++) {
      const a = i * 90 + row * 35, angle = a * Math.PI / 180, r = 0.025;
      bracts.push(radialBlade("塔黄覆盖内部花序并层层下垂的宽薄苞叶", cream, [Math.cos(angle) * r, y, Math.sin(angle) * r], 0.29 * (1 - t) + 0.055, 0.32 * (1 - t) + 0.09, 115, a));
    }
    for (let i = 0; i < 5; i++) { const a = i * 2.4 + row; flowers.push(lobe("塔黄薄苞片内侧独立的绿色小花簇", pale, [Math.cos(a) * 0.038, y + 0.017, Math.sin(a) * 0.038], [0.02, 0.027, 0.02])); }
  }
  for (let i = 0; i < bracts.length; i += 24) parts.push(combineMeshes("塔黄真实相互叠覆而非整体锥壳的乳白苞叶塔", cream, bracts.slice(i, i + 24)));
  for (let i = 0; i < flowers.length; i += 30) parts.push(combineMeshes("塔黄薄苞片之间能看到的内部绿色花簇", pale, flowers.slice(i, i + 30)));
  return parts;
}

function powderyThalia(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 6; i++) {
    const a = i * 2.4, root: Triple = [Math.cos(a) * 0.25, 1.15 + i % 3 * 0.16, Math.sin(a) * 0.25];
    parts.push(tapered("再力花由根颈抽出而顶端连接叶片的高叶柄", pale, [[Math.cos(a) * 0.025, 0, Math.sin(a) * 0.025], root], [0.014, 0.008]), flatLeaf("再力花长柄顶端直立的宽椭圆叶", root, [root[0] + Math.cos(a) * 0.37, root[1] + 0.38, root[2] + Math.sin(a) * 0.37], 0.27, "oval", 0.0018));
  }
  for (const side of [-1, 1]) {
    const stem: Triple = [side * 0.075, 2.12, 0];
    parts.push(tapered("再力花高于叶面的细长独立花葶", pale, [[side * 0.025, 0, 0], stem], [0.009, 0.003]));
    for (let branch = 0; branch < 4; branch++) {
      const a = branch * 2.4, y = 1.87 + branch * 0.08, end: Triple = [stem[0] + Math.cos(a) * 0.18, y + 0.17, Math.sin(a) * 0.18], pieces: ModelPart[] = [tapered("再力花松散分枝花序的细曲轴", pale, [[stem[0], y, 0], [end[0] * 0.75, y + 0.13, end[2] * 0.75], end], [0.0025, 0.0016, 0.0007])];
      for (let node = 0; node < 5; node++) {
        const t = 0.2 + node * 0.17, p: Triple = [stem[0] + (end[0] - stem[0]) * t, y + 0.17 * t, end[2] * t];
        for (const edge of [-1, 1]) { const root: Triple = [p[0] + edge * 0.012, p[1] - 0.006, p[2]]; pieces.push(lobe("再力花一对背向着生的狭长花苞", mauve, root, [0.011, 0.022, 0.008]), radialBlade("再力花不对称外伸的下唇花被片", mauve, root, 0.008, 0.017, 125, a * 180 / Math.PI + edge * 60)); }
      }
      parts.push(combineMeshes("再力花长花葶上可辨的对生紫花与弯曲花轴", mauve, pieces));
    }
  }
  return parts;
}

function pickerelWeed(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, root: Triple = [Math.cos(a) * 0.11, 0.58 + i % 3 * 0.11, Math.sin(a) * 0.11];
    parts.push(tapered("梭鱼草基部抽出的直立叶柄", pale, [[0, 0, 0], root], [0.007, 0.004]), flatLeaf("梭鱼草从叶柄顶端展开的心形宽披针叶", root, [root[0] + Math.cos(a) * 0.13, root[1] + 0.24, root[2] + Math.sin(a) * 0.13], 0.13, "heart", 0.0014));
  }
  for (let stalk = 0; stalk < 3; stalk++) {
    const x = (stalk - 1) * 0.065, y = 0.91 + stalk % 2 * 0.13, flowers: ModelPart[] = [];
    parts.push(tapered("梭鱼草由叶鞘抽出顶着密花穗的花轴", pale, [[x, 0, 0], [x, y + 0.14, 0]], [0.006, 0.002]));
    for (let i = 0; i < 21; i++) {
      const t = i / 20, a = i * 2.4, root: Triple = [x + Math.cos(a) * 0.011, y + t * 0.13, Math.sin(a) * 0.011];
      flowers.push(needle("梭鱼草密花穗上从轴心接到花管的短花梗", pale, [x, root[1], 0], root, 0.001), smallCorolla(root, [Math.cos(a), 0.15, Math.sin(a)], 0.011, 0.0045, "#a4adc0", false, 6, 8));
    }
    for (let i = 0; i < flowers.length; i += 6) parts.push(combineMeshes("梭鱼草直立短穗上向外开放的六裂蓝花", "#a4adc0", flowers.slice(i, i + 6)));
  }
  return parts;
}

function yellowSkunkCabbage(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 6; i++) {
    const a = i * 2.4, root: Triple = [Math.cos(a) * 0.045, 0.03, Math.sin(a) * 0.045];
    parts.push(flatLeaf("美洲黄水芋具有短柄的宽椭圆大基生叶", root, [Math.cos(a) * 0.48, 0.72 + i % 3 * 0.12, Math.sin(a) * 0.48], 0.36, "oval", 0.002));
  }
  const root: Triple = [0.13, 0.035, 0.04];
  const spathe = sweptProfile("美洲黄水芋有真实侧向开口的长卵形黄佛焰苞", "#cfc08a", [[0.023, 0], [0.09, 0.07], [0.11, 0.22], [0.06, 0.35], [0.008, 0.43], [0.004, 0.426], [0.054, 0.347], [0.103, 0.22], [0.083, 0.073], [0.019, 0.004]], Math.PI * 1.35, 18);
  spathe.position = { x: root[0], y: root[1], z: root[2] }; spathe.rotation.y = 145;
  parts.push(spathe, tapered("黄佛焰苞内独立而直立的肉穗花序梗", pale, [root, [root[0], 0.26, root[2]]], [0.009, 0.008]));
  const florets: ModelPart[] = [];
  for (let i = 0; i < 40; i++) { const a = i * 2.4; florets.push(lobe("美洲黄水芋肉穗表面独立的小花", pale, [root[0] + Math.cos(a) * 0.012, 0.11 + i / 40 * 0.19, root[2] + Math.sin(a) * 0.012], [0.009, 0.01, 0.009])); }
  parts.push(combineMeshes("美洲黄水芋侧开黄苞里的独立肉穗花轴", pale, florets));
  return parts;
}

function waterBanana(): ModelPart[] {
  const parts: ModelPart[] = [part("林德利水芋由叶鞘套合而非木干组成的粗假茎", "lathe", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.18, y: 0 }, { x: 0.25, y: 0.25 }, { x: 0.17, y: 1.45 }, { x: 0.07, y: 1.7 }, { x: 0, y: 1.7 }] })];
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, root: Triple = [Math.cos(a) * 0.53, 2.15 + i % 3 * 0.12, Math.sin(a) * 0.53];
    parts.push(tapered("林德利水芋从假茎鞘顶斜出的粗叶柄", pale, [[Math.cos(a) * 0.12, 1.35, Math.sin(a) * 0.12], root], [0.045, 0.023]), flatLeaf("林德利水芋非芭蕉椭圆叶的巨幅箭形叶", root, [root[0] + Math.cos(a) * 0.95, root[1] + 0.98, root[2] + Math.sin(a) * 0.95], 0.98, "arrow", 0.004));
  }
  const root: Triple = [0.27, 1.45, 0.11];
  parts.push(tapered("林德利水芋独立叶腋佛焰花序的粗梗", pale, [[0.11, 1.2, 0.04], root], [0.024, 0.018]));
  const spathe = sweptProfile("林德利水芋叶腋独立开放的乳白长佛焰苞", cream, [[0.025, 0], [0.085, 0.12], [0.07, 0.3], [0.012, 0.44], [0.006, 0.433], [0.062, 0.296], [0.077, 0.12], [0.018, 0.007]], Math.PI * 1.4, 16);
  spathe.position = { x: root[0], y: root[1], z: root[2] };
  parts.push(spathe, tapered("林德利水芋佛焰苞中真正独立的粗肉穗", pale, [[root[0], root[1] + 0.015, root[2]], [root[0], root[1] + 0.3, root[2]]], [0.022, 0.012]));
  return parts;
}

function kingFern(): ModelPart[] {
  const parts: ModelPart[] = [lobe("观音座莲粗短而不高耸成树干的肉质根茎座", "#a59c80", [0, 0.18, 0], [0.62, 0.4, 0.62])];
  const lance: [number, number][] = [[0, 0], [-0.43, 0.24], [-0.4, 0.72], [0, 1], [0.4, 0.72], [0.43, 0.24]];
  for (let frond = 0; frond < 6; frond++) {
    const a = frond * Math.PI / 3, height = 2.3 + frond % 2 * 0.3, path: Triple[] = [[Math.cos(a) * 0.12, 0.25, Math.sin(a) * 0.12], [Math.cos(a) * 0.48, 1.45, Math.sin(a) * 0.48], [Math.cos(a) * 2.32, height, Math.sin(a) * 2.32]];
    parts.push(tapered("观音座莲从低根茎座抽出的大型拱展叶轴", pale, path, [0.043, 0.026, 0.004]));
    for (let node = 0; node < 6; node++) for (const side of [-1, 1]) {
      const t = 0.08 + node * 0.16, root: Triple = [path[1]![0] + (path[2]![0] - path[1]![0]) * t, 1.45 + (height - 1.45) * t, path[1]![2] + (path[2]![2] - path[1]![2]) * t];
      const b = a + side * 1.13, span = Math.sin((t * 0.76 + 0.13) * Math.PI) * 0.72, end: Triple = [root[0] + Math.cos(b) * span, root[1] + 0.075, root[2] + Math.sin(b) * span];
      const pieces: ModelPart[] = [needle("观音座莲一回羽片的粗副叶轴", pale, root, end, 0.005)];
      for (let leaflet = 0; leaflet < 6; leaflet++) for (const edge of [-1, 1]) {
        const u = 0.1 + leaflet * 0.14, p: Triple = [root[0] + (end[0] - root[0]) * u, root[1] + 0.075 * u, root[2] + (end[2] - root[2]) * u], c = b + edge * 1.22, length = 0.16 - leaflet * 0.015;
        pieces.push(flatLeaf("观音座莲与副叶轴分离的长披针小羽片", p, [p[0] + Math.cos(c) * length, p[1] + 0.025, p[2] + Math.sin(c) * length], 0.037 - leaflet * 0.003, lance, 0.0008));
      }
      pieces.push(flatLeaf("观音座莲每片羽片最前端独立的小羽片", [end[0] * 0.95 + root[0] * 0.05, end[1], end[2] * 0.95 + root[2] * 0.05], [end[0] + Math.cos(b) * 0.09, end[1] + 0.02, end[2] + Math.sin(b) * 0.09], 0.024, lance, 0.0008));
      parts.push(combineMeshes("观音座莲一片真实分出第二回小羽片的大羽片", green, pieces));
    }
  }
  return parts;
}

function pampasGrass(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 28; i++) { const a = i * 137.5; parts.push(archedGrassBlade("蒲苇真实V形截面且末端下垂的长叶", [0, 0.01 + i % 3 * 0.02, 0], a, 1.13 + i % 4 * 0.09, 0.011, 0.72 + i % 3 * 0.13)); }
  for (let plume = 0; plume < 6; plume++) {
    const a = plume * 2.4, height = 2.2 + plume % 3 * 0.17, x = Math.cos(a) * 0.19, z = Math.sin(a) * 0.19;
    parts.push(tapered("蒲苇从叶丛上方直立伸出的细长花秆", pale, [[0, 0, 0], [x, height + 0.35, z]], [0.009, 0.003]));
    const pieces: ModelPart[] = [];
    for (let node = 0; node < 25; node++) for (const side of [-1, 1]) {
      const t = node / 24, b = a + side * Math.PI / 2 + node * 0.37, span = Math.sin((t * 0.9 + 0.05) * Math.PI) * 0.12, y = height - 0.24 + t * 0.57, root: Triple = [x * y / (height + 0.35), y, z * y / (height + 0.35)], end: Triple = [root[0] + Math.cos(b) * span, root[1] + 0.06, root[2] + Math.sin(b) * span];
      pieces.push(needle("蒲苇羽状圆锥花序真正外伸的细长枝毛", straw, root, end, 0.001), lobe("蒲苇每条细枝末端的纤细小穗", cream, end, [0.006, 0.03, 0.006]));
    }
    for (let i = 0; i < pieces.length; i += 40) parts.push(combineMeshes("蒲苇花秆顶端松软而非实心椭球的羽毛穗", cream, pieces.slice(i, i + 40)));
  }
  return parts;
}

function silverGrass(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 13; i++) parts.push(archedGrassBlade("芒基部簇生而弧展的窄带状长叶", [0, 0.01, 0], i * 137.5, 0.71 + i % 3 * 0.1, 0.017, 0.66 + i % 2 * 0.13));
  for (let stalk = 0; stalk < 3; stalk++) {
    const a = stalk * 2.4, height = 1.85 + stalk * 0.18, x = Math.cos(a) * 0.15, z = Math.sin(a) * 0.15;
    parts.push(tapered("芒由叶丛抽出的细竹节状长秆", pale, [[0, 0, 0], [x, height, z]], [0.008, 0.002]));
    for (let node = 0; node < 4; node++) { const t = 0.24 + node * 0.14; parts.push(archedGrassBlade("芒秆节上互生的弧垂带叶", [x * t, height * t, z * t], a * 180 / Math.PI + node * 137.5, 0.57 - node * 0.05, 0.015, 0.17)); }
    for (let ray = 0; ray < 7; ray++) {
      const across = (ray - 3) * 0.09, root: Triple = [x, height, z], end: Triple = [x + Math.cos(a) * 0.17 + Math.sin(a) * across, height + 0.31 - Math.abs(ray - 3) * 0.018, z + Math.sin(a) * 0.17 - Math.cos(a) * across];
      const pieces: ModelPart[] = [tapered("芒花序顶端张成扇面的独立细长总状枝", straw, [root, [root[0] + (end[0] - root[0]) * 0.45, height + 0.21, root[2] + (end[2] - root[2]) * 0.45], end], [0.0015, 0.001, 0.0005])];
      for (let seed = 0; seed < 9; seed++) {
        const t = (seed + 1) / 10, y = t < 0.45 ? height + 0.21 * t / 0.45 : height + 0.21 + (end[1] - height - 0.21) * (t - 0.45) / 0.55, p: Triple = [root[0] + (end[0] - root[0]) * t, y, root[2] + (end[2] - root[2]) * t];
        pieces.push(lobe("芒扇状花序一侧独立的狭长小穗", straw, p, [0.004, 0.012, 0.004]), needle("芒小穗末端真正独立伸出的细芒", cream, p, [p[0] + Math.cos(a) * 0.018, p[1] + 0.025, p[2] + Math.sin(a) * 0.018], 0.0007));
      }
      parts.push(combineMeshes("芒花序张开的单条细芒总状枝", straw, pieces));
    }
  }
  return parts;
}

function elephantGrass(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let stalk = 0; stalk < 2; stalk++) {
    const x = (stalk - 0.5) * 0.16, height = 3.15 + stalk * 0.28;
    parts.push(tapered("象草粗壮高大而有节的直立草秆", pale, [[x, 0, 0], [x + 0.04, height + 0.2, 0]], [0.022, 0.009]));
    for (let node = 0; node < 7; node++) {
      const y = 0.23 + node * 0.35, t = y / (height + 0.2), a = node * 137.5 + stalk * 80, root: Triple = [x + 0.04 * t, y, 0];
      parts.push(part("象草秆节处包住茎的短叶鞘环", "lathe", pale, root, [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.024 - t * 0.012, y: -0.035 }, { x: 0.026 - t * 0.012, y: -0.035 }, { x: 0.025 - t * 0.012, y: 0.035 }, { x: 0.023 - t * 0.012, y: 0.035 }, { x: 0.024 - t * 0.012, y: -0.035 }] }), archedGrassBlade("象草节上长而宽的白中肋带状叶", root, a, 0.96 - node * 0.055, 0.043 - node * 0.002, 0.25));
    }
    const pieces: ModelPart[] = [];
    for (let node = 0; node < 24; node++) for (let side = 0; side < 3; side++) {
      const t = node / 23, a = node * 2.4 + side * Math.PI * 2 / 3, r = Math.sin((t * 0.9 + 0.05) * Math.PI) * 0.023, root: Triple = [x + 0.04 + Math.cos(a) * r, height - 0.09 + t * 0.28, Math.sin(a) * r];
      pieces.push(needle("象草每个小穗与穗轴真正相连的极短梗", straw, [x + 0.04 * root[1] / (height + 0.2), root[1], 0], root, 0.0007), lobe("象草紧密圆柱花穗表面成组的狭小穗", straw, root, [0.008, 0.014, 0.008]), needle("象草小穗基部向外斜伸的硬刚毛", straw, root, [root[0] + Math.cos(a) * 0.023, root[1] + 0.017, root[2] + Math.sin(a) * 0.023], 0.0007));
    }
    for (let i = 0; i < pieces.length; i += 60) parts.push(combineMeshes("象草花秆顶端带真实刚毛的致密圆柱穗", straw, pieces.slice(i, i + 60)));
  }
  return parts;
}

function tobacco(): ModelPart[] {
  const parts: ModelPart[] = [tapered("烟草粗壮而不木质化的单一直立主茎", pale, [[0, 0, 0], [0, 1.85, 0]], [0.021, 0.006])];
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4, y = 0.11 + i * 0.127, length = 0.51 - i * 0.021;
    parts.push(flatLeaf("烟草互生且下延贴茎的巨大全缘椭圆叶", [0, y, 0], [Math.cos(a) * length, y + 0.045, Math.sin(a) * length], length * 0.46, "oval", 0.0016));
  }
  for (let branch = 0; branch < 5; branch++) {
    const a = branch * 2.4, y = 1.52 + branch * 0.058, hub: Triple = [Math.cos(a) * 0.16, y + 0.2, Math.sin(a) * 0.16];
    parts.push(tapered("烟草茎顶聚伞圆锥花序的独立斜分枝", pale, [[0, y, 0], hub], [0.0045, 0.0016]));
    const flowers: ModelPart[] = [];
    for (let i = 0; i < 3; i++) {
      const b = a + (i - 1) * 0.8, root: Triple = [hub[0] + Math.cos(b) * 0.028, hub[1] + i % 2 * 0.016, hub[2] + Math.sin(b) * 0.028];
      flowers.push(needle("烟草分枝花序上接到长筒花基部的小花梗", pale, hub, root, 0.0012), smallCorolla(root, [Math.cos(b) * 0.7, 0.5, Math.sin(b) * 0.7], 0.045, 0.008, "#c7afba"));
    }
    parts.push(combineMeshes("烟草大叶茎顶真正开口的五裂长筒粉花", "#c7afba", flowers));
  }
  return parts;
}

export const herbaceousExpansionBatchThreeDesigns: MasterNatureDesign[] = [
  design("nobleRhubarbPlant", "塔黄", "植物", nobleRhubarb, ["Rheum nobile", "基生绿叶及覆盖内部花序的层叠乳白苞叶塔"]),
  design("powderyThaliaPlant", "再力花", "植物", powderyThalia, ["Thalia dealbata", "高长柄椭圆叶与超过叶面的松散对生紫花"]),
  design("pickerelWeedPlant", "梭鱼草", "植物", pickerelWeed, ["Pontederia cordata", "长叶柄心形叶和直立六裂蓝花穗"]),
  design("yellowSkunkCabbagePlant", "美洲黄水芋", "植物", yellowSkunkCabbage, ["Lysichiton americanus", "大椭圆基生叶与真侧开口黄佛焰苞"]),
  design("waterBananaPlant", "林德利水芋", "植物", waterBanana, ["Typhonodorum lindleyanum", "叶鞘假茎巨幅箭叶及独立腋生肉穗"]),
  design("angiopterisKingFern", "观音座莲", "植物", kingFern, ["Angiopteris evecta", "低肉质根茎座与跨数米的二回羽状巨叶"]),
  design("pampasGrassPlant", "蒲苇", "植物", pampasGrass, ["Cortaderia selloana", "真正V形弧垂长叶及柔散羽毛圆锥花穗"]),
  design("miscanthusSilverGrass", "芒", "植物", silverGrass, ["Miscanthus sinensis", "秆节弧垂叶与扇状独立长芒总状枝"]),
  design("elephantGrassPlant", "象草", "植物", elephantGrass, ["Cenchrus purpureus", "Pennisetum purpureum", "粗高节秆宽带叶及具真实刚毛的圆柱穗"]),
  design("tobaccoPlant", "烟草", "植物", tobacco, ["Nicotiana tabacum", "互生巨大全缘叶及上部聚伞长筒粉花"]),
];
