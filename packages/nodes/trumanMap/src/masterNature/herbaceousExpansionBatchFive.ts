import { combineMeshes, design, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { radialBlade } from "./herbaceousExpansionBatchOne";
import { archedGrassBlade } from "./herbaceousExpansionBatchThree";

const green = "#899c77";
const pale = "#b7c0a0";
const pink = "#b49fac";
const red = "#b59180";

// 真实的大株草本形态，原创部件工厂；不以株高、花色或损坏状态扩主。
// https://nzflora.info/factsheet/taxon/Furcraea-foetida.html
// https://www.rhs.org.uk/plants/27870/beschorneria-yuccoides/details
// https://www.rhs.org.uk/plants/6039/doryanthes-excelsa/details

function cottonThistle(): ModelPart[] {
  const parts: ModelPart[] = [tapered("大翅飞廉有连续纵翼的高直立粗茎", pale, [[0, 0, 0], [0, 2.13, 0]], [0.016, 0.004])];
  const lobes: [number, number][] = [[0, 0], [-0.16, 0.09], [-0.44, 0.19], [-0.15, 0.27], [-0.53, 0.42], [-0.17, 0.46], [-0.43, 0.65], [-0.12, 0.67], [0, 1], [0.12, 0.67], [0.43, 0.65], [0.17, 0.46], [0.53, 0.42], [0.15, 0.27], [0.44, 0.19], [0.16, 0.09]];
  for (let i = 0; i < 6; i++) { const a = i * 2.4; parts.push(flatLeaf("大翅飞廉基部大而多刺深裂的莲座叶", [0, 0.014, 0], [Math.cos(a) * 0.46, 0.12, Math.sin(a) * 0.46], 0.21, lobes, 0.002)); }
  for (let wing = 0; wing < 3; wing++) {
    const outline: [number, number][] = [[0, 0], [0.012, 0]];
    for (let tooth = 0; tooth < 13; tooth++) outline.push([tooth % 2 ? 0.023 : 0.059, 0.09 + tooth * 0.11]);
    outline.push([0.008, 1.48], [0, 1.48]);
    const value = polygon("大翅飞廉延续整个节间而边缘尖齿的真实茎翼", pale, outline, 0.003);
    value.vertices = value.vertices!.map(p => ({ x: p.x, y: p.z + 0.06, z: -p.y })); value.rotation.y = wing * 120;
    parts.push(value);
  }
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4, y = 0.61 + i * 0.22;
    parts.push(flatLeaf("大翅飞廉沿高秆互生的抱茎刺裂叶", [0, y, 0], [Math.cos(a) * 0.26, y + 0.05, Math.sin(a) * 0.26], 0.14, lobes, 0.0014));
  }
  for (let branch = 0; branch < 5; branch++) {
    const a = branch * 2.4, root: Triple = [Math.cos(a) * 0.24, 1.95 + branch % 3 * 0.1, Math.sin(a) * 0.24], bracts: ModelPart[] = [], flowers: ModelPart[] = [];
    parts.push(tapered("大翅飞廉花头下粗而有支撑的斜分梗", pale, [[0, 1.45 + branch % 3 * 0.12, 0], root], [0.006, 0.0025]), lobe("大翅飞廉花头坚实卵形总苞基部", green, root, [0.055, 0.058, 0.055]));
    for (let i = 0; i < 18; i++) { const b = i * 2.4; bracts.push(needle("大翅飞廉总苞外向外翘出的真实尖刺苞片", pale, [root[0] + Math.cos(b) * 0.018, root[1] + i % 3 * 0.01, root[2] + Math.sin(b) * 0.018], [root[0] + Math.cos(b) * 0.038, root[1] + 0.018 + i % 3 * 0.01, root[2] + Math.sin(b) * 0.038], 0.002)); }
    for (let i = 0; i < 21; i++) { const b = i * 2.4, r = Math.sqrt(i / 21) * 0.018; flowers.push(needle("大翅飞廉花头顶端真正细长的紫色管花", pink, [root[0] + Math.cos(b) * r, root[1] + 0.018, root[2] + Math.sin(b) * r], [root[0] + Math.cos(b) * r, root[1] + 0.047 + i % 3 * 0.004, root[2] + Math.sin(b) * r], 0.0021)); }
    parts.push(combineMeshes("大翅飞廉真实外翘的浅色尖总苞", pale, bracts), combineMeshes("大翅飞廉总苞顶端独立的紫色细管花冠", pink, flowers));
  }
  return parts;
}

function pandanSeaHolly(): ModelPart[] {
  const parts: ModelPart[] = [];
  const edge: [number, number][] = [[0, 0]];
  for (let i = 0; i < 12; i++) edge.push([i % 2 ? -0.37 : -0.52, 0.07 + i * 0.074]);
  edge.push([0, 1]);
  for (let i = 11; i >= 0; i--) edge.push([i % 2 ? 0.37 : 0.52, 0.07 + i * 0.074]);
  for (let i = 0; i < 15; i++) { const a = i * 2.4; parts.push(flatLeaf("露兜叶刺芹有真实边缘刺齿的基生带状长叶", [0, 0.006, 0], [Math.cos(a) * 0.68, 0.58 + i % 3 * 0.13, Math.sin(a) * 0.68], 0.046, edge, 0.0018)); }
  parts.push(tapered("露兜叶刺芹越过大叶丛的高花序轴", pale, [[0, 0, 0], [0, 2.06, 0]], [0.012, 0.002]));
  for (let branch = 0; branch < 8; branch++) {
    const a = branch * 2.4, y = 1.19 + branch * 0.1, hub: Triple = [Math.cos(a) * 0.28, y + 0.17, Math.sin(a) * 0.28];
    parts.push(tapered("露兜叶刺芹疏松分枝圆锥序的斜生细轴", pale, [[0, y, 0], hub], [0.0035, 0.001]));
    const pieces: ModelPart[] = [];
    for (let head = 0; head < 3; head++) {
      const b = a + (head - 1) * 0.9, root: Triple = [hub[0] + Math.cos(b) * 0.07, hub[1] + head % 2 * 0.023, hub[2] + Math.sin(b) * 0.07];
      pieces.push(needle("露兜叶刺芹小头状花序的短柄", pale, hub, root, 0.001), lobe("露兜叶刺芹顶部小型卵圆花头", "#b2a589", root, [0.022, 0.034, 0.022]));
      for (let bract = 0; bract < 5; bract++) pieces.push(radialBlade("露兜叶刺芹每个小花头下独立的短尖苞片", pale, root, 0.0035, 0.023, 104, bract * 72));
    }
    parts.push(combineMeshes("露兜叶刺芹远高于刺叶丛的细小分枝花头", "#b2a589", pieces));
  }
  return parts;
}

function mauritiusHemp(): ModelPart[] {
  const parts: ModelPart[] = [tapered("毛里求斯麻从无茎莲座中央抽出的数米长花葶", pale, [[0, 0, 0], [0, 4.75, 0]], [0.067, 0.006])];
  for (let i = 0; i < 14; i++) parts.push(radialBlade("毛里求斯麻大莲座里挺直的宽披针纤维叶", green, [0, 0.035 + i % 3 * 0.04, 0], 0.14, 1.34 - i % 3 * 0.1, 35 + i % 4 * 9, i * 137.5));
  for (let branch = 0; branch < 11; branch++) {
    const a = branch * 2.4, y = 2.33 + branch * 0.2, span = 0.75 - branch * 0.043, end: Triple = [Math.cos(a) * span, y + 0.18, Math.sin(a) * span];
    parts.push(tapered("毛里求斯麻巨花枝上层层斜展的侧轴", pale, [[0, y, 0], end], [0.009, 0.002]));
    const bulbils: ModelPart[] = [];
    for (let plantlet = 0; plantlet < 6; plantlet++) {
      const t = 0.2 + plantlet * 0.145, root: Triple = [end[0] * t, y + 0.18 * t, end[2] * t];
      bulbils.push(lobe("毛里求斯麻花枝上真实膨大的珠芽基部", pale, root, [0.02, 0.031, 0.02]));
      for (let leaf = 0; leaf < 3; leaf++) bulbils.push(radialBlade("仍附着母株花枝的珠芽小植株剑叶", green, [root[0], root[1] + 0.008, root[2]], 0.008, 0.05, 30, leaf * 120));
    }
    parts.push(combineMeshes("毛里求斯麻完整花枝上带小叶的独立珠芽", pale, bulbils));
  }
  return parts;
}

function beschorneria(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 15; i++) parts.push(radialBlade("贝氏龙舌兰略肉质但不硬刺的灰绿带叶莲座", green, [0, 0.018, 0], 0.075, 0.53 - i % 3 * 0.035, 42 + i % 4 * 10, i * 137.5));
  const path: Triple[] = [[0, 0, 0], [0.025, 1.25, 0], [0.39, 1.52, 0.03], [0.73, 1.2, 0.05]];
  parts.push(tapered("贝氏龙舌兰明显偏斜弯拱的粗红花葶", red, path, [0.026, 0.018, 0.011, 0.003]));
  for (let i = 0; i < 9; i++) {
    const t = i / 8, root: Triple = [0.025 + t * 0.705, t < 0.52 ? 1.25 + t / 0.52 * 0.27 : 1.52 - (t - 0.52) / 0.48 * 0.32, t * 0.05], end: Triple = [root[0] + 0.04, root[1] - 0.075, root[2] + (i % 2 ? -0.04 : 0.04)], pieces: ModelPart[] = [needle("贝氏龙舌兰弯花轴上的下垂侧花柄", red, root, end, 0.003), radialBlade("贝氏龙舌兰下垂筒花基部明显的红苞片", red, root, 0.026, 0.085, 135, i % 2 ? 90 : 270)];
    pieces.push(smallCorolla(end, [0.2, -0.95, 0], 0.055, 0.009, "#bec49a", false, 6));
    parts.push(combineMeshes("贝氏龙舌兰红苞片外下垂的黄绿长筒花", red, pieces));
  }
  return parts;
}

function redFalseAloe(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 19; i++) parts.push(archedGrassBlade("红花假芦荟窄而有槽的硬长基生叶", [0, 0.018, 0], i * 137.5, 0.64 + i % 3 * 0.08, 0.017, 0.54 + i % 2 * 0.08));
  for (let stalk = 0; stalk < 3; stalk++) {
    const a = stalk * 2.4, x = Math.cos(a) * 0.11, z = Math.sin(a) * 0.11, height = 1.77 + stalk * 0.18;
    parts.push(tapered("红花假芦荟叶丛中抽出的细长分枝花秆", red, [[0, 0, 0], [x, height, z]], [0.0065, 0.0015]));
    const flowers: ModelPart[] = [];
    for (let flower = 0; flower < 12; flower++) {
      const t = 0.5 + flower / 11 * 0.47, b = flower * 2.4, root: Triple = [x * t, height * t, z * t], end: Triple = [root[0] + Math.cos(b) * 0.032, root[1] - 0.006, root[2] + Math.sin(b) * 0.032];
      flowers.push(needle("红花假芦荟细花秆外的独立短花梗", red, root, end, 0.0012), smallCorolla(end, [Math.cos(b) * 0.4, -0.85, Math.sin(b) * 0.4], 0.033, 0.006, red, false, 6));
    }
    for (let i = 0; i < flowers.length; i += 6) parts.push(combineMeshes("红花假芦荟长花秆上疏生的六裂下垂红筒花", red, flowers.slice(i, i + 6)));
  }
  return parts;
}

function giantSpearLily(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 14; i++) parts.push(radialBlade("矛花百合由地面巨莲座放射的长宽剑叶", green, [0, 0.02 + i % 3 * 0.03, 0], 0.15, 1.4 + i % 3 * 0.1, 36 + i % 4 * 8, i * 137.5));
  const top = 5.15;
  parts.push(tapered("矛花百合叶丛中直上数米的粗花葶", pale, [[0, 0, 0], [0, top, 0]], [0.06, 0.027]));
  for (let i = 0; i < 8; i++) parts.push(radialBlade("矛花百合粗花秆上疏生的小型抱秆苞叶", pale, [0, 0.45 + i * 0.51, 0], 0.035, 0.25 - i * 0.015, 28, i * 137.5));
  const flowers: ModelPart[] = [];
  for (let i = 0; i < 24; i++) {
    const a = i * 2.4, radius = Math.sqrt(i / 24) * 0.15, root: Triple = [Math.cos(a) * radius, top + (1 - i / 24) * 0.16, Math.sin(a) * radius];
    flowers.push(needle("矛花百合硕大顶生花团中实际连接的短梗", red, [0, top - 0.03, 0], root, 0.006), smallCorolla(root, [Math.cos(a) * 0.5, 0.85, Math.sin(a) * 0.5], 0.125, 0.027, red, false, 6));
  }
  for (let i = 0; i < flowers.length; i += 6) parts.push(combineMeshes("矛花百合长粗秆顶端密集向外开放的六被赤花团", red, flowers.slice(i, i + 6)));
  return parts;
}

function newZealandFlax(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let fan = 0; fan < 3; fan++) {
    const heading = fan * 68, a = heading * Math.PI / 180, root: Triple = [Math.cos(a) * 0.09, 0.018, Math.sin(a) * 0.09];
    for (let i = 0; i < 7; i++) {
      const lean = (i - 3) * 12, reach = Math.sin(lean * Math.PI / 180) * (1.5 - Math.abs(i - 3) * 0.1), y = Math.cos(lean * Math.PI / 180) * (1.5 - Math.abs(i - 3) * 0.1);
      parts.push(flatLeaf("新西兰麻在同一扇面内二列套叠的长剑叶", root, [root[0] + Math.cos(a) * reach, root[1] + y, root[2] + Math.sin(a) * reach], 0.086, [[0, 0], [-0.48, 0.1], [-0.45, 0.73], [0, 1], [0.45, 0.73], [0.48, 0.1]], 0.003));
    }
  }
  parts.push(tapered("新西兰麻高于叶扇的粗直花秆", pale, [[0, 0, 0], [0, 2.74, 0]], [0.02, 0.004]));
  for (let i = 0; i < 8; i++) {
    const a = i * 2.4, y = 1.68 + i * 0.125, root: Triple = [Math.cos(a) * 0.18, y + 0.1, Math.sin(a) * 0.18], pieces: ModelPart[] = [needle("新西兰麻花秆上短而有分叉的侧轴", red, [0, y, 0], root, 0.004)];
    for (let flower = 0; flower < 3; flower++) { const b = a + (flower - 1) * 0.5, p: Triple = [root[0] + Math.cos(b) * 0.022, root[1] + flower % 2 * 0.013, root[2] + Math.sin(b) * 0.022]; pieces.push(needle("新西兰麻侧分轴至单花的短花柄", red, root, p, 0.0014), smallCorolla(p, [Math.cos(b) * 0.5, 0.65, Math.sin(b) * 0.5], 0.04, 0.007, red, false, 6)); }
    parts.push(combineMeshes("新西兰麻高花秆上的独立六裂弯筒花簇", red, pieces));
  }
  return parts;
}

function largeCrocosmia(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 12; i++) {
    const side = i % 2 ? -1 : 1, height = 0.83 + i % 4 * 0.09;
    parts.push(flatLeaf("大穗雄黄兰互相套叠的宽褶剑形基生叶", [(Math.floor(i / 2) - 3) * 0.007, 0, 0], [side * (0.12 + i % 3 * 0.055), height, i % 3 * 0.023], 0.045, [[0, 0], [-0.5, 0.2], [-0.42, 0.75], [0, 1], [0.42, 0.75], [0.5, 0.2]], 0.0018));
  }
  for (let branch = 0; branch < 4; branch++) {
    const a = branch * 2.4, start: Triple = [Math.cos(a) * 0.05, 1.07, Math.sin(a) * 0.05], end: Triple = [Math.cos(a) * 0.37, 1.42 + branch % 2 * 0.06, Math.sin(a) * 0.37];
    parts.push(tapered("大穗雄黄兰上部斜弯而分枝的细花轴", pale, [[0, 0, 0], start, end], [0.006, 0.003, 0.0008]));
    const flowers: ModelPart[] = [];
    for (let flower = 0; flower < 9; flower++) {
      const t = flower / 8, root: Triple = start.map((v, axis) => v + (end[axis]! - v) * t) as Triple, b = a + (flower % 2 ? 0.7 : -0.7), p: Triple = [root[0] + Math.cos(b) * 0.016, root[1], root[2] + Math.sin(b) * 0.016];
      flowers.push(needle("大穗雄黄兰交替着生单花的短柄", pale, root, p, 0.0012), smallCorolla(p, [Math.cos(b) * 0.5, 0.65, Math.sin(b) * 0.5], 0.037, 0.008, "#bf9b7e", false, 6));
    }
    for (let i = 0; i < flowers.length; i += 6) parts.push(combineMeshes("大穗雄黄兰弯花穗上交替朝外的六裂橙花", "#bf9b7e", flowers.slice(i, i + 6)));
  }
  return parts;
}

function falseIndigo(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let branch = 0; branch < 4; branch++) {
    const a = branch * 2.4, x = Math.cos(a) * 0.16, z = Math.sin(a) * 0.16, height = 0.98 + branch % 2 * 0.18;
    parts.push(tapered("蓝赝靛从根冠分枝的直立草茎", pale, [[0, 0, 0], [x, height, z]], [0.006, 0.0015]));
    for (let node = 0; node < 5; node++) {
      const t = 0.14 + node * 0.12, root: Triple = [x * t, height * t, z * t], b = a + node * 2.4, hub: Triple = [root[0] + Math.cos(b) * 0.018, root[1] + 0.005, root[2] + Math.sin(b) * 0.018], pieces: ModelPart[] = [needle("蓝赝靛三出复叶的共同短叶柄", pale, root, hub, 0.0015)];
      for (let blade = 0; blade < 3; blade++) { const c = b + (blade - 1) * 0.87; pieces.push(flatLeaf("蓝赝靛与羽扇豆掌状叶不同的三出倒卵小叶", hub, [hub[0] + Math.cos(c) * 0.052, hub[1] + 0.012, hub[2] + Math.sin(c) * 0.052], 0.023, "obovate", 0.0007)); }
      parts.push(combineMeshes("蓝赝靛一片真正三小叶的互生复叶", green, pieces));
    }
    for (let flower = 0; flower < 8; flower++) {
      const t = 0.63 + flower * 0.044, root: Triple = [x * t, height * t, z * t], b = flower * 2.4, p: Triple = [root[0] + Math.cos(b) * 0.011, root[1], root[2] + Math.sin(b) * 0.011], pieces: ModelPart[] = [needle("蓝赝靛总状花序上各花短梗", pale, root, p, 0.001), radialBlade("蓝赝靛上部直立宽旗瓣", "#a4aac1", p, 0.012, 0.019, 24, b * 180 / Math.PI)];
      for (const side of [-1, 1]) pieces.push(radialBlade("蓝赝靛夹住下方龙骨瓣的两枚狭翼瓣", "#a4aac1", p, 0.006, 0.013, 72, b * 180 / Math.PI + side * 29));
      pieces.push(lobe("蓝赝靛下部合拢成舟形的龙骨瓣", "#929db4", [p[0] + Math.cos(b) * 0.008, p[1] - 0.002, p[2] + Math.sin(b) * 0.008], [0.009, 0.008, 0.015]));
      parts.push(combineMeshes("蓝赝靛具有旗翼龙骨三组器官的独立蝶形花", "#a4aac1", pieces));
    }
  }
  return parts;
}

function sorghumPlant(): ModelPart[] {
  const parts: ModelPart[] = [tapered("高粱没有侧生玉米果穗的直立节秆", pale, [[0, 0, 0], [0, 2.16, 0]], [0.017, 0.007])];
  for (let i = 0; i < 8; i++) parts.push(archedGrassBlade("高粱从秆节外展而末端弧垂的宽带叶", [0, 0.14 + i * 0.21, 0], i * 137.5, 0.72 - i * 0.035, 0.045, 0.24));
  const grains: ModelPart[] = [];
  for (let branch = 0; branch < 13; branch++) {
    const a = branch * 2.4, y = 1.96 + branch * 0.019, r = Math.sin((branch / 13 * 0.85 + 0.08) * Math.PI) * 0.075, tip: Triple = [Math.cos(a) * r, y + 0.15, Math.sin(a) * r];
    grains.push(needle("高粱顶生圆锥粮穗的真实分枝梗", pale, [0, y, 0], tip, 0.0014));
    for (let seed = 0; seed < 10; seed++) { const t = 0.2 + seed * 0.075, b = seed * 2.4, root: Triple = [tip[0] * t + Math.cos(b) * 0.007, y + 0.15 * t, tip[2] * t + Math.sin(b) * 0.007]; grains.push(needle("高粱每枚谷粒与侧穗梗相接的极短小梗", pale, [tip[0] * t, root[1], tip[2] * t], root, 0.001), lobe("高粱高秆顶端独立着生的圆粒颖果", "#b19c82", root, [0.008, 0.009, 0.008])); }
  }
  for (let i = 0; i < grains.length; i += 35) parts.push(combineMeshes("高粱由分枝与独立谷粒构成的稠密顶生圆锥穗", "#b19c82", grains.slice(i, i + 35)));
  return parts;
}

export const herbaceousExpansionBatchFiveDesigns: MasterNatureDesign[] = [
  design("cottonThistlePlant", "大翅飞廉", "植物", cottonThistle, ["Onopordum acanthium", "多刺深裂叶与沿节间连续的尖齿茎翼"]),
  design("pandanSeaHollyPlant", "露兜叶刺芹", "植物", pandanSeaHolly, ["Eryngium pandanifolium", "刺齿带叶莲座与高大疏枝小花头"]),
  design("mauritiusHempPlant", "毛里求斯麻", "植物", mauritiusHemp, ["Furcraea foetida", "宽剑叶莲座与数米巨花枝上的带叶珠芽"]),
  design("beschorneriaPlant", "贝氏龙舌兰", "植物", beschorneria, ["Beschorneria yuccoides", "柔带叶莲座和偏拱红轴上的绿垂筒花"]),
  design("redFalseAloePlant", "红花假芦荟", "植物", redFalseAloe, ["Hesperaloe parviflora", "窄槽长叶及高疏枝六裂垂筒花"]),
  design("giantSpearLilyPlant", "矛花百合", "植物", giantSpearLily, ["Doryanthes excelsa", "巨剑叶莲座与数米粗花葶顶生大赤花团"]),
  design("newZealandFlaxPlant", "新西兰麻", "植物", newZealandFlax, ["Phormium tenax", "二列剑叶扇面和高长分枝红花秆"]),
  design("largeCrocosmiaPlant", "大穗雄黄兰", "植物", largeCrocosmia, ["Crocosmia paniculata", "套叠褶剑叶与多枝弯穗上的六裂橙花"]),
  design("blueFalseIndigoPlant", "蓝赝靛", "植物", falseIndigo, ["Baptisia australis", "三出倒卵复叶与具旗翼龙骨的直立蝶花序"]),
  design("sorghumPlant", "高粱植株", "植物", sorghumPlant, ["Sorghum bicolor", "宽带叶节秆及真正分枝着粒的顶生粮穗"]),
];
