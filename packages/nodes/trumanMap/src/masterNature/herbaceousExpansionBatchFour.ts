import { combineMeshes, design, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { radialBlade } from "./herbaceousExpansionBatchOne";
import { asterHead } from "./herbaceousExpansionBatchTwo";

const green = "#85986f";
const pale = "#b0bc96";
const cream = "#d9d3b6";
const pink = "#b7a6b7";
const brown = "#a39578";

// 原创大株植物，未使用远端网格、照片或烘焙图。
// https://www.rhs.org.uk/plants/27487/astilboides-tabularis/details
// https://www.nparks.gov.sg/florafaunaweb/flora/2/4/2497

function burReed(): ModelPart[] {
  const parts: ModelPart[] = [tapered("黑三棱分枝花序下部的直立茎", pale, [[0, 0, 0], [0.02, 1.64, 0]], [0.009, 0.0025])];
  for (let i = 0; i < 10; i++) { const a = i * 2.4; parts.push(flatLeaf("黑三棱基部成扇且有宽中脊的带状长叶", [0, 0.004, 0], [Math.cos(a) * 0.3, 0.98 + i % 3 * 0.16, Math.sin(a) * 0.3], 0.033, [[0, 0], [-0.5, 0.22], [-0.4, 0.76], [0, 1], [0.4, 0.76], [0.5, 0.22]], 0.0013)); }
  for (let i = 0; i < 6; i++) {
    const y = 0.87 + i * 0.105, a = i * 2.4, radius = i < 3 ? 0.019 : 0.011, root: Triple = [Math.cos(a) * (i < 3 ? 0.11 : 0.034), y + 0.035, Math.sin(a) * (i < 3 ? 0.11 : 0.034)];
    parts.push(tapered("黑三棱球状花头连接主轴的真正侧花梗", pale, [[0.02 * y / 1.64, y, 0], root], [0.002, 0.001]), lobe(i < 3 ? "黑三棱下方较大的独立雌性球花头" : "黑三棱上方较小的雄性球花头", i < 3 ? pale : brown, root, [radius * 2, radius * 2, radius * 2]));
    const pieces: ModelPart[] = [];
    for (let spine = 0; spine < 20; spine++) { const z = 1 - (spine + 0.5) / 10, a = spine * 2.4, r = Math.sqrt(1 - z * z); pieces.push(needle("黑三棱球面外真正分离的尖花柱", pale, [root[0] + Math.cos(a) * r * radius * 0.75, root[1] + z * radius * 0.75, root[2] + Math.sin(a) * r * radius * 0.75], [root[0] + Math.cos(a) * r * radius * 1.15, root[1] + z * radius * 1.15, root[2] + Math.sin(a) * r * radius * 1.15], 0.001)); }
    parts.push(combineMeshes("黑三棱单个球状花头表面放射的尖柱", pale, pieces));
  }
  return parts;
}

function softStemBulrush(): ModelPart[] {
  const parts: ModelPart[] = [tapered("水葱各细秆相接的短贴地根茎", brown, [[-0.05, 0.006, 0], [0, 0.006, 0.014], [0.05, 0.006, 0]], [0.006, 0.008, 0.005])];
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4, x = Math.cos(a) * 0.045, z = Math.sin(a) * 0.045, height = 1.21 + i % 4 * 0.1;
    parts.push(tapered("水葱没有宽叶片的圆筒状独立绿秆", green, [[x, 0, z], [x + 0.025, height, z]], [0.0045, 0.0015]));
    if (i % 3) continue;
    const y = height * 0.9, root: Triple = [x + 0.0225, y, z], pieces: ModelPart[] = [];
    for (let branch = 0; branch < 5; branch++) { const b = a + branch * 2.4, p: Triple = [root[0] + Math.cos(b) * 0.045, y + 0.017 + branch % 2 * 0.012, root[2] + Math.sin(b) * 0.045]; pieces.push(needle("水葱看似侧生花序的独立细分梗", pale, root, p, 0.0011)); for (let seed = 0; seed < 3; seed++) pieces.push(lobe("水葱花序末端成簇的褐色卵形小穗", brown, [p[0] + (seed - 1) * 0.005, p[1], p[2]], [0.007, 0.012, 0.006])); }
    parts.push(combineMeshes("水葱秆顶以下的分枝褐色小穗簇", brown, pieces));
  }
  return parts;
}

function jerusalemArtichoke(): ModelPart[] {
  const parts: ModelPart[] = [tapered("菊芋从根茎抽出的粗直高草茎", pale, [[0, 0, 0], [0, 2.15, 0]], [0.018, 0.004])];
  const teeth: [number, number][] = [[0, 0], [-0.21, 0.12], [-0.43, 0.32], [-0.35, 0.34], [-0.5, 0.52], [-0.38, 0.56], [-0.31, 0.77], [-0.21, 0.78], [0, 1], [0.21, 0.78], [0.31, 0.77], [0.38, 0.56], [0.5, 0.52], [0.35, 0.34], [0.43, 0.32], [0.21, 0.12]];
  for (let i = 0; i < 10; i++) {
    const a = i < 4 ? i % 2 * Math.PI : i * 2.4, y = i < 4 ? 0.12 + Math.floor(i / 2) * 0.22 : 0.7 + (i - 4) * 0.19, p: Triple = [Math.cos(a) * 0.022, y + 0.012, Math.sin(a) * 0.022], length = 0.26 - i * 0.011;
    parts.push(tapered("菊芋下部对生上部互生叶的短叶柄", pale, [[0, y, 0], p], [0.0028, 0.0015]), flatLeaf("菊芋边缘粗锯齿的三出脉长卵形叶", p, [p[0] + Math.cos(a) * length, p[1] + 0.03, p[2] + Math.sin(a) * length], length * 0.48, teeth, 0.001));
  }
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, end: Triple = [Math.cos(a) * 0.29, 1.94 + i % 3 * 0.12, Math.sin(a) * 0.29];
    parts.push(tapered("菊芋上部多分枝小花头的真正花梗", pale, [[0, 1.43 + i % 3 * 0.16, 0], end], [0.005, 0.0015]), asterHead(end, 0.033, 12));
  }
  return parts;
}

function joePyeWeed(): ModelPart[] {
  const parts: ModelPart[] = [tapered("管茎泽兰粗壮的单一直立高秆", pale, [[0, 0, 0], [0, 2.17, 0]], [0.018, 0.004])];
  const teeth: [number, number][] = [[0, 0], [-0.25, 0.16], [-0.47, 0.37], [-0.36, 0.4], [-0.5, 0.58], [-0.36, 0.6], [-0.31, 0.79], [0, 1], [0.31, 0.79], [0.36, 0.6], [0.5, 0.58], [0.36, 0.4], [0.47, 0.37], [0.25, 0.16]];
  for (let node = 0; node < 6; node++) {
    const y = 0.19 + node * 0.27, leaves: ModelPart[] = [];
    for (let blade = 0; blade < 5; blade++) { const a = blade * Math.PI * 2 / 5 + node * 0.3, length = 0.25 - node * 0.018; leaves.push(flatLeaf("管茎泽兰五枚同节轮生的粗锯齿长叶", [0, y, 0], [Math.cos(a) * length, y + 0.035, Math.sin(a) * length], 0.073, teeth, 0.0009)); }
    parts.push(combineMeshes("管茎泽兰一圈真正五叶轮生的节叶", green, leaves));
  }
  for (let branch = 0; branch < 9; branch++) {
    const a = branch * 2.4, hub: Triple = [Math.cos(a) * (0.17 + branch % 2 * 0.08), 2.17 + branch % 3 * 0.03, Math.sin(a) * (0.17 + branch % 2 * 0.08)];
    parts.push(tapered("管茎泽兰宽阔平顶花伞下可见的分枝", pale, [[0, 1.86 + branch % 3 * 0.065, 0], hub], [0.0035, 0.0014]));
    const flowers: ModelPart[] = [];
    for (let flower = 0; flower < 3; flower++) { const b = flower * Math.PI * 2 / 3, root: Triple = [hub[0] + Math.cos(b) * 0.009, hub[1], hub[2] + Math.sin(b) * 0.009]; flowers.push(needle("管茎泽兰小头状花序的极短花梗", pale, hub, root, 0.001), smallCorolla(root, [0, 1, 0], 0.01, 0.003, pink, false, 5, 8)); }
    parts.push(combineMeshes("管茎泽兰不具舌状边花的粉色管花头", pink, flowers));
  }
  return parts;
}

function culverRoot(): ModelPart[] {
  const parts: ModelPart[] = [tapered("美洲腹水草长直而细的中心茎", pale, [[0, 0, 0], [0, 1.86, 0]], [0.008, 0.0015])];
  for (let node = 0; node < 6; node++) {
    const y = 0.13 + node * 0.19, pieces: ModelPart[] = [];
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + node * 0.17, span = 0.16 - node * 0.013; pieces.push(flatLeaf("美洲腹水草每节六枚轮生的狭披针叶", [0, y, 0], [Math.cos(a) * span, y + 0.018, Math.sin(a) * span], 0.033, "oval", 0.0007)); }
    parts.push(combineMeshes("美洲腹水草重复节位上实际放射的叶轮", green, pieces));
  }
  for (let branch = 0; branch < 6; branch++) {
    const a = branch * Math.PI * 0.4, central = branch === 5, x = central ? 0 : Math.cos(a) * 0.17, z = central ? 0 : Math.sin(a) * 0.17, bottom = central ? 1.49 : 1.35, top = central ? 1.86 : 1.7;
    if (!central) parts.push(tapered("美洲腹水草烛台形侧花穗的斜生花轴", pale, [[0, 1.14, 0], [x, top, z]], [0.003, 0.0007]));
    const flowers: ModelPart[] = [];
    for (let i = 0; i < 15; i++) { const t = i / 14, b = i * 2.4, y = bottom + t * (top - bottom), axisX = central ? 0 : x * (y - 1.14) / (top - 1.14), axisZ = central ? 0 : z * (y - 1.14) / (top - 1.14), root: Triple = [axisX + Math.cos(b) * 0.003, y, axisZ + Math.sin(b) * 0.003]; flowers.push(needle("美洲腹水草每个小花管与穗轴的真实短连接", pale, [axisX, y, axisZ], root, 0.001), smallCorolla(root, [Math.cos(b), 0.2, Math.sin(b)], 0.006, 0.0025, cream, false, 4, 8)); }
    for (let i = 0; i < flowers.length; i += 6) parts.push(combineMeshes("美洲腹水草烛台状狭长花穗上的四裂小白花", cream, flowers.slice(i, i + 6)));
  }
  return parts;
}

function blackCohosh(): ModelPart[] {
  const parts: ModelPart[] = [tapered("黑升麻从根颈抽出越过复叶的细长主茎", pale, [[0, 0, 0], [0, 1.63, 0]], [0.01, 0.002])];
  for (let stalk = 0; stalk < 4; stalk++) {
    const a = stalk * 2.4, y = 0.13 + stalk * 0.15, root: Triple = [Math.cos(a) * 0.19, y + 0.18, Math.sin(a) * 0.19], pieces: ModelPart[] = [needle("黑升麻三出复叶的共同长叶柄", pale, [0, y, 0], root, 0.004)];
    for (let division = 0; division < 3; division++) {
      const b = a + (division - 1) * 0.87, hub: Triple = [root[0] + Math.cos(b) * 0.13, root[1] + 0.018, root[2] + Math.sin(b) * 0.13];
      pieces.push(needle("黑升麻复叶的二级分叉叶柄", pale, root, hub, 0.0018));
      for (let blade = 0; blade < 3; blade++) { const c = b + (blade - 1) * 0.9; pieces.push(flatLeaf("黑升麻再三出分枝的粗齿掌裂小叶", hub, [hub[0] + Math.cos(c) * 0.11, hub[1] + 0.02, hub[2] + Math.sin(c) * 0.11], 0.07, "palm", 0.0008)); }
    }
    parts.push(combineMeshes("黑升麻一片真正再分枝的三出复叶", green, pieces));
  }
  for (let branch = 0; branch < 4; branch++) {
    const a = branch * 2.4, root: Triple = [0, 0.97 + branch * 0.11, 0], start: Triple = [Math.cos(a) * 0.08, 1.46 + branch * 0.08, Math.sin(a) * 0.08], end: Triple = [Math.cos(a) * 0.26, 1.89 + branch * 0.08, Math.sin(a) * 0.26];
    parts.push(tapered("黑升麻总状花序细长而上部弯曲的轴", pale, [root, start, end], [0.0038, 0.0023, 0.0006]));
    const organs: ModelPart[] = [];
    for (let flower = 0; flower < 28; flower++) {
      const t = flower / 27, p: Triple = start.map((v, axis) => v + (end[axis]! - v) * t) as Triple;
      for (let stamen = 0; stamen < 4; stamen++) { const b = flower * 2.4 + stamen * Math.PI / 2, tip: Triple = [p[0] + Math.cos(b) * 0.008, p[1] + 0.006, p[2] + Math.sin(b) * 0.008]; organs.push(needle("黑升麻不靠大花瓣而伸出的细长雄蕊", cream, p, tip, 0.0007), lobe("黑升麻白色细花药", cream, tip, [0.0014, 0.0016, 0.0014])); }
    }
    for (let i = 0; i < organs.length; i += 48) parts.push(combineMeshes("黑升麻长总状轴上独立伸出的白色雄蕊毛刷", cream, organs.slice(i, i + 48)));
  }
  return parts;
}

function shieldleafRodgersia(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let blade = 0; blade < 4; blade++) {
    const a = blade * 2.4, root: Triple = [Math.cos(a) * 0.19, 0.64 + blade % 2 * 0.13, Math.sin(a) * 0.19], radius = 0.35 + blade % 2 * 0.075;
    parts.push(tapered("盾叶鬼灯檠真正连接叶面下中央的长粗叶柄", pale, [[0, 0, 0], root], [0.015, 0.007]));
    const leaf = polygon("盾叶鬼灯檠为整圆盾叶而非掌状复叶的巨叶", green, Array.from({ length: 42 }, (_, i) => { const a = i * Math.PI / 21, r = radius * (0.92 + Math.cos(a * 7) * 0.05 - (i % 3 === 1 ? 0.055 : 0)); return [Math.cos(a) * r, Math.sin(a) * r]; }), 0.0025, root);
    leaf.vertices = leaf.vertices!.map(v => ({ ...v, y: v.y + (v.x * v.x + v.z * v.z) / (radius * radius) * 0.035 }));
    parts.push(leaf);
  }
  const axis: Triple = [0, 1.43, 0];
  parts.push(tapered("盾叶鬼灯檠高过盾叶的细长花葶", pale, [[0, 0, 0], axis], [0.008, 0.0015]));
  for (let branch = 0; branch < 8; branch++) {
    const a = branch * 2.4, y = 1.11 + branch * 0.037, end: Triple = [Math.cos(a) * (0.17 - branch * 0.013), y + 0.11, Math.sin(a) * (0.17 - branch * 0.013)], pieces: ModelPart[] = [needle("盾叶鬼灯檠花序的细分枝轴", pale, [0, y, 0], end, 0.0016)];
    for (let flower = 0; flower < 6; flower++) { const t = 0.17 + flower * 0.14, root: Triple = [end[0] * t, y + 0.11 * t, end[2] * t]; for (let petal = 0; petal < 5; petal++) pieces.push(radialBlade("盾叶鬼灯檠细小白花的独立小花瓣", cream, root, 0.0014, 0.0023, 72, petal * 72)); }
    parts.push(combineMeshes("盾叶鬼灯檠细白花圆锥序的一条真实分枝", cream, pieces));
  }
  return parts;
}

function shellGinger(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let shoot = 0; shoot < 2; shoot++) {
    const side = shoot ? -1 : 1, path: Triple[] = [[side * 0.04, 0, 0], [side * 0.12, 1.15, 0], [side * 0.37, 2.1, 0.03]];
    parts.push(tapered("艳山姜基部叶鞘套合而上部弯垂的草质茎", pale, path, [0.024, 0.018, 0.007]));
    for (let node = 0; node < 8; node++) {
      const t = 0.12 + node * 0.105, y = t * 2.1, f = y < 1.15 ? y / 1.15 : (y - 1.15) / 0.95, x = y < 1.15 ? side * (0.04 + 0.08 * f) : side * (0.12 + 0.25 * f), z = y < 1.15 ? 0 : 0.03 * f, a = (node % 2 ? Math.PI : 0) + shoot * 0.9;
      parts.push(flatLeaf("艳山姜沿高秆二列互生的大披针形叶", [x, y, z], [x + Math.cos(a) * 0.47, y + 0.05, z + Math.sin(a) * 0.47], 0.14, "oval", 0.0016));
    }
    const flowerPath: Triple[] = [path[2]!, [side * 0.57, 2.13, 0.03], [side * 0.72, 1.8, 0.04]];
    parts.push(tapered("艳山姜从茎顶接出且末端下垂的总状花轴", pale, flowerPath, [0.007, 0.004, 0.0012]));
    for (let flower = 0; flower < 9; flower++) {
      const t = flower / 8, root: Triple = [side * (0.57 + 0.15 * t), 2.13 - 0.33 * t, 0.04], pieces: ModelPart[] = [];
      for (const edge of [-1, 1]) pieces.push(lobe("艳山姜如瓷贝外壳的独立覆合花被", cream, [root[0], root[1] - 0.015, root[2] + edge * 0.009], [0.027, 0.043, 0.022]), radialBlade("艳山姜从覆合外被口伸出的宽大唇瓣", "#cbbd95", root, 0.024, 0.035, 135, edge * 40));
      parts.push(combineMeshes("艳山姜垂挂总状轴上一朵有开口的贝壳花", cream, pieces));
    }
  }
  return parts;
}

function waxGinger(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let shoot = 0; shoot < 2; shoot++) {
    const x = (shoot - 0.5) * 0.16;
    parts.push(tapered("蜡姜从地下根茎抽出而非木质化的高叶茎", pale, [[x, 0, 0], [x, 2.34 + shoot * 0.19, 0]], [0.021, 0.006]));
    for (let node = 0; node < 12; node++) { const a = node * 2.4 + shoot, y = 0.2 + node * 0.18; parts.push(flatLeaf("蜡姜沿茎连续螺旋排列的宽披针叶", [x, y, 0], [x + Math.cos(a) * 0.33, y + 0.035, Math.sin(a) * 0.33], 0.14, "oval", 0.0014)); }
  }
  const root: Triple = [0.3, 0.48, 0.04], bracts: ModelPart[] = [];
  parts.push(tapered("蜡姜与长叶茎分离的基生粗花序梗", pale, [[0, 0, 0], root, [root[0], 0.79, root[2]]], [0.014, 0.011, 0.004]));
  for (let row = 0; row < 9; row++) for (let column = 0; column < 5; column++) {
    const a = (column * 72 + row * 31) * Math.PI / 180, t = row / 8, p: Triple = [root[0] + Math.cos(a) * (0.037 - t * 0.02), root[1] + row * 0.031, root[2] + Math.sin(a) * (0.037 - t * 0.02)], end: Triple = [p[0] + Math.cos(a) * (0.071 - t * 0.035), p[1] + 0.022, p[2] + Math.sin(a) * (0.071 - t * 0.035)];
    const bract = flatLeaf("蜡姜螺旋叠瓦且末端尖翘的厚蜡质苞片", p, end, 0.063 - t * 0.034, [[0, 0], [-0.48, 0.15], [-0.4, 0.54], [0, 1], [0.4, 0.54], [0.48, 0.15]], 0.004); bract.color = "#b18a76"; bracts.push(bract);
  }
  for (let i = 0; i < bracts.length; i += 24) parts.push(combineMeshes("蜡姜真实独立尖厚苞片组成的螺旋花锥", "#b18a76", bracts.slice(i, i + 24)));
  parts.push(smallCorolla([root[0] + 0.065, 0.63, root[2]], [1, 0.2, 0], 0.034, 0.011, "#d1c494", true));
  return parts;
}

function cigarCalathea(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, root: Triple = [Math.cos(a) * 0.27, 1.63 + i % 3 * 0.18, Math.sin(a) * 0.27];
    parts.push(tapered("黄苞竹芋由短根茎抽出的高长叶柄", pale, [[Math.cos(a) * 0.025, 0, Math.sin(a) * 0.025], root], [0.022, 0.012]), flatLeaf("黄苞竹芋长柄顶端整缘的大幅长椭圆叶", root, [root[0] + Math.cos(a) * 0.54, root[1] + 0.84, root[2] + Math.sin(a) * 0.54], 0.47, "oval", 0.0025));
  }
  for (let stalk = 0; stalk < 3; stalk++) {
    const a = stalk * 2.4, root: Triple = [Math.cos(a) * 0.26, 1.61 + stalk * 0.17, Math.sin(a) * 0.26], bracts: ModelPart[] = [];
    parts.push(tapered("黄苞竹芋独立于大叶片的直立花序梗", pale, [[0, 0, 0], root, [root[0], root[1] + 0.31, root[2]]], [0.01, 0.007, 0.002]));
    for (let row = 0; row < 9; row++) for (const side of [-1, 1]) {
      const p: Triple = [root[0], root[1] + row * 0.032, root[2]], b = a + (side < 0 ? Math.PI : 0), bract = flatLeaf("黄苞竹芋花序两列互叠的褐色舟形苞片", p, [p[0] + Math.cos(b) * 0.047, p[1] + 0.039, p[2] + Math.sin(b) * 0.047], 0.036, "oval", 0.003);
      bract.color = brown; bracts.push(bract);
    }
    parts.push(combineMeshes("黄苞竹芋由两列舟苞构成而非实心圆柱的雪茄花序", brown, bracts), smallCorolla([root[0] + Math.cos(a) * 0.043, root[1] + 0.18, root[2] + Math.sin(a) * 0.043], [Math.cos(a), 0.1, Math.sin(a)], 0.018, 0.006, "#d1c599", true));
  }
  return parts;
}

export const herbaceousExpansionBatchFourDesigns: MasterNatureDesign[] = [
  design("erectBurReed", "黑三棱", "植物", burReed, ["Sparganium erectum", "带状基生长叶与分列上下的雌雄球花头"]),
  design("softStemBulrushPlant", "水葱", "植物", softStemBulrush, ["Schoenoplectus tabernaemontani", "圆筒无宽叶绿秆及近顶部看似侧生的褐小穗簇"]),
  design("jerusalemArtichokePlant", "菊芋", "植物", jerusalemArtichoke, ["Helianthus tuberosus", "粗齿卵叶高分枝茎和多朵小头状花序"]),
  design("joePyeWeedPlant", "管茎泽兰", "植物", joePyeWeed, ["Eutrochium fistulosum", "五轮生长齿叶与无舌状边花的粉色顶伞"]),
  design("culverRootPlant", "美洲腹水草", "植物", culverRoot, ["Veronicastrum virginicum", "轮生狭叶和烛台状的狭长白花穗"]),
  design("blackCohoshPlant", "黑升麻", "植物", blackCohosh, ["Actaea racemosa", "三出再分复叶与不靠大花瓣的细蕊花刷"]),
  design("shieldleafAstilboides", "盾叶鬼灯檠", "植物", shieldleafRodgersia, ["Astilboides tabularis", "完整巨圆盾叶和高出叶面的细白花圆锥序"]),
  design("shellGingerPlant", "艳山姜", "植物", shellGinger, ["Alpinia zerumbet", "二列披针叶高茎与茎顶下垂贝壳状花串"]),
  design("waxGingerPlant", "蜡姜", "植物", waxGinger, ["Tapeinochilos ananassae", "螺旋叶高茎和独立基生尖蜡苞花锥"]),
  design("cigarCalatheaPlant", "黄苞竹芋", "植物", cigarCalathea, ["Calathea lutea", "高长柄巨椭圆叶与两列褐舟苞雪茄花序"]),
];
