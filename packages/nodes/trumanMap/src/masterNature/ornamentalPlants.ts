import { ShapeUtils, Vector2 } from "three";
import { cap, combineMeshes, design, frontCup, leaf, lobe, needle, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { pointed } from "./insectForms";
import { strip } from "./shapedFoods";

const green = "#859a71";
const pale = "#b5c19c";
const wood = "#a0a28a";
const white = "#d4d3bc";
const flowerColor = "#c4b8bc";

function swordLeaf(root: Triple, heading: number, height: number): ModelPart {
  const cross = [[-0.5, 0], [-0.46, -0.003], [0, -0.006], [0.46, -0.003], [0.5, 0], [0, -0.002]], vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  const widths = [0.009, 0.046, 0.037, 0.0015], levels = [0, 0.25, 0.78, 1];
  for (let row = 0; row < 4; row++) { const t = levels[row]!, outward = height * t * t * 0.16; for (const [x, z] of cross) { const across = x! * widths[row]!, depth = z! * Math.sin((t * 0.9 + 0.05) * Math.PI); vertices.push({ x: root[0] + Math.cos(heading) * outward + Math.sin(heading) * across + Math.cos(heading) * depth, y: root[1] + height * t, z: root[2] + Math.sin(heading) * outward - Math.cos(heading) * across + Math.sin(heading) * depth }); } if (row) for (let i = 0; i < 6; i++) { const a = (row - 1) * 6 + i, b = (row - 1) * 6 + (i + 1) % 6, c = a + 6, d = b + 6; indices.push(a, c, b, b, c, d); } }
  for (const [a, b, c] of ShapeUtils.triangulateShape(cross.map(([x, z]) => new Vector2(x!, z!)), [])) indices.push(a!, b!, c!, a! + 18, c! + 18, b! + 18);
  return part("虎尾兰厚实且有浅沟脊的剑形叶", "mesh", green, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function palmate(root: Triple, length: number, count: number, color = green): ModelPart {
  const pieces: ModelPart[] = [];
  for (let i = 0; i < count; i++) { const a = i * Math.PI * 2 / count; const start: Triple = [root[0] + Math.cos(a) * 0.012, root[1], root[2] + Math.sin(a) * 0.012], end: Triple = [root[0] + Math.cos(a) * length, root[1] + length * 0.2, root[2] + Math.sin(a) * length]; pieces.push(needle("掌状复叶中心到小叶基部的叶柄", wood, root, start, 0.002), flatLeaf("与中心共同叶柄相连的独立小叶", start, end, length * 0.33, "oval")); }
  const p = combineMeshes("一片真正离生小叶的掌状复叶", color, pieces); return p;
}

function houseplant(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (let i = 0; i < 9; i++) { const a = i * 2.4, r = i < 3 ? 0.007 : 0.025; parts.push(swordLeaf([Math.cos(a) * r, 0, Math.sin(a) * r], a, 0.45 + i % 4 * 0.12)); }
  } else if (kind === 1) {
    for (let shoot = 0; shoot < 5; shoot++) { const a = shoot * 2.4, height = 0.58 + shoot % 3 * 0.12, tip: Triple = [Math.cos(a) * 0.19, height, Math.sin(a) * 0.19]; parts.push(tapered("金钱树由地下根茎直接抽出的肉质叶轴", green, [[0, 0.003, 0], [tip[0] * 0.45, height * 0.55, tip[2] * 0.45], tip], [0.013, 0.009, 0.002]));
      const leaflets: ModelPart[] = []; for (let node = 0; node < 6; node++) for (const side of [-1, 1]) { const t = 0.32 + node * 0.105, y = height * t, u = t <= 0.55 ? t / 0.55 : (t - 0.55) / 0.45, factor = t <= 0.55 ? u * 0.45 : 0.45 + u * 0.55, root: Triple = [tip[0] * factor, y, tip[2] * factor], d = a + side * 1.15; leaflets.push(flatLeaf("金钱树叶轴两侧厚而独立的卵形小叶", root, [root[0] + Math.cos(d) * 0.095, y + 0.055, root[2] + Math.sin(d) * 0.095], 0.047, "oval")); } parts.push(combineMeshes("一条完整肉质羽状复叶", green, leaflets));
    }
    const spathe = cap("地表附近半包围肉穗花序的短佛焰苞", pale, [0.03, 0.012, 0.025], 0.018, 0.065, 3); parts.push(spathe, tapered("佛焰苞中央独立的短肉穗轴", white, [[0.03, 0.02, 0.025], [0.03, 0.083, 0.025]], [0.005, 0.003]));
  } else if (kind === 2) {
    parts.push(tapered("琴叶榕直立木质枝干", wood, [[0, 0, 0], [0, 1.1, 0], [0.025, 1.82, 0]], [0.033, 0.022, 0.008]));
    for (let i = 0; i < 10; i++) { const a = i * 2.4, y = 0.48 + i * 0.12, x = y < 1.1 ? 0 : 0.025 * (y - 1.1) / 0.72, root: Triple = [x, y, 0], stalk: Triple = [x + Math.cos(a) * 0.045, y + 0.015, Math.sin(a) * 0.045], end: Triple = [stalk[0] + Math.cos(a) * 0.31, y + 0.115, stalk[2] + Math.sin(a) * 0.31]; parts.push(tapered("互生大叶的短粗叶柄", wood, [root, stalk], [0.005, 0.004]), flatLeaf("琴叶榕基部与远端宽中部收腰的琴形叶", stalk, end, 0.21, "fiddle")); }
    parts.push(leaf("枝顶包住新叶的长尖托叶", pale, [0.024, 1.77, 0], 0.025, 0.085, [8, 0, 0]));
  } else if (kind === 3) {
    parts.push(tapered("镜面草短而直立的肉质茎", green, [[0, 0, 0], [0, 0.31, 0]], [0.009, 0.003]));
    for (let i = 0; i < 10; i++) { const a = i * 2.4, y = 0.08 + i * 0.021, end: Triple = [Math.cos(a) * 0.11, y + 0.055, Math.sin(a) * 0.11]; parts.push(tapered("从茎上伸到叶片下表面中央的长叶柄", pale, [[0, y, 0], end], [0.0025, 0.0015])); const disc = polygon("镜面草叶柄盾状着生的完整圆币形叶", green, Array.from({ length: 18 }, (_, j) => [Math.cos(j * Math.PI / 9) * 0.045, Math.sin(j * Math.PI / 9) * 0.045]), 0.0015, end); parts.push(disc); }
  } else {
    const leaves: ModelPart[] = []; for (let i = 0; i < 14; i++) leaves.push(leaf("吊兰细长拱垂的基生带状叶", green, [0, 0.008, 0], 0.018, 0.46 - i % 3 * 0.04, [50 + i % 3 * 12, -i * 137.5, 0])); parts.push(combineMeshes("吊兰母株完整的带叶莲座", green, leaves));
    for (const side of [-1, 1]) { const path: Triple[] = [[0, 0.012, 0], [side * 0.2, 0.42, 0.02], [side * 0.53, 0.16, 0.02]]; parts.push(tapered("吊兰母株抽出的长匍匐花葶", pale, path, [0.0025, 0.0018, 0.001])); for (let node = 0; node < 3; node++) { const t = node / 3, root: Triple = [side * (0.2 + 0.33 * t), 0.42 - 0.26 * t, 0.02]; const plantlet: ModelPart[] = []; for (let i = 0; i < 6; i++) plantlet.push(leaf("仍与母株花葶相连的小植株带叶", green, root, 0.008, 0.11, [50, -i * 60, 0])); parts.push(combineMeshes("花葶节上真正连接的小莲座", green, plantlet)); } }
  }
  return parts;
}

function woodyPlant(kind: number): ModelPart[] {
  const parts: ModelPart[] = [], height = kind === 0 ? 2.5 : kind === 1 ? 1.35 : kind === 2 ? 1.5 : kind === 3 ? 5.5 : 0.85;
  parts.push(tapered("具名木本植物的木质主干", wood, [[0, 0, 0], [0, height * 0.55, 0], [0.03, height, 0]], [height * 0.035, height * 0.022, height * 0.006]));
  for (let axis = 0; axis < 5; axis++) { const a = axis * 2.4, y = height * (0.48 + axis * 0.06), originX = y <= height * 0.55 ? 0 : 0.03 * (y - height * 0.55) / (height * 0.45), root: Triple = [originX, y, 0], tip: Triple = [Math.cos(a) * height * 0.26, y + height * 0.18, Math.sin(a) * height * 0.26]; parts.push(tapered("主干真实分出的侧枝", wood, [root, tip], [height * 0.012, height * 0.003]));
    if (kind === 0 || kind === 2) { const hub: Triple = [tip[0] * 1.08, tip[1] + height * 0.06, tip[2] * 1.08]; parts.push(tapered("掌状复叶共同的长叶柄", green, [tip, hub], [0.004, 0.003]), palmate(hub, kind === 0 ? 0.22 : 0.105, kind === 0 ? 5 : 7)); }
    else if (kind === 1) { const end: Triple = [tip[0] * 1.35, tip[1] + 0.02, tip[2] * 1.35]; parts.push(tapered("八角金盘的粗壮长叶柄", green, [tip, end], [0.004, 0.003]), flatLeaf("八角金盘连续相连的七裂掌状叶", end, [end[0] + Math.cos(a) * 0.26, end[1] + 0.04, end[2] + Math.sin(a) * 0.26], 0.25, "palm")); }
    else { for (let i = 0; i < 3; i++) { const t = 0.4 + i * 0.25, p: Triple = [root[0] + (tip[0] - root[0]) * t, root[1] + (tip[1] - root[1]) * t, root[2] + (tip[2] - root[2]) * t], end: Triple = [p[0] + Math.cos(a + i * 1.4) * (kind === 3 ? 0.18 : 0.12), p[1] + 0.035, p[2] + Math.sin(a + i * 1.4) * (kind === 3 ? 0.18 : 0.12)]; parts.push(flatLeaf(kind === 3 ? "珙桐的心形互生叶" : "草海桐枝端匙状厚叶", p, end, kind === 3 ? 0.13 : 0.065, kind === 3 ? "heart" : "oval")); } }
    if (kind === 3) { const centre: Triple = [tip[0], tip[1] - 0.12, tip[2]]; parts.push(tapered("珙桐头状花序下垂的细花柄", green, [tip, centre], [0.004, 0.002]), lobe("珙桐由小花组成而非花瓣的球形头序", "#a29a8c", centre, [0.025, 0.025, 0.025])); for (const side of [-1, 1]) parts.push(leaf("珙桐大小不等的两枚白色总苞片", white, centre, side > 0 ? 0.065 : 0.045, side > 0 ? 0.18 : 0.11, [155, -side * 40, side * 20])); }
    else if (kind === 4) { const centre: Triple = [tip[0], tip[1] + 0.01, tip[2] + 0.02]; parts.push(tapered("草海桐叶腋短花柄", green, [tip, centre], [0.0018, 0.001]), frontCup("草海桐花朵的短管状基部", white, centre, 0.004, 0.018)); const fan: ModelPart[] = []; for (let i = 0; i < 5; i++) { const angle = 180 + i * 45; fan.push(leaf("草海桐仅在半边展开的五枚花冠裂片", white, [centre[0], centre[1], centre[2] + 0.017], 0.006, 0.014, [0, 0, angle - 90])); } parts.push(combineMeshes("草海桐可辨认的半边扇状花冠", white, fan)); }
  }
  if (kind === 0) {
    for (const side of [-1, 1]) { const root: Triple = [side * 0.2, 1.95, 0.16]; parts.push(tapered("瓜栗腋生大型花朵的花梗", green, [[0.015, 1.83, 0], root], [0.01, 0.006])); const petalsAndStamens: ModelPart[] = []; for (let i = 0; i < 5; i++) petalsAndStamens.push(leaf("瓜栗向后卷曲的长条花瓣", white, root, 0.014, 0.19, [115, i * 72, 0])); for (let i = 0; i < 45; i++) { const a = i * 2.4, radius = 0.06 + i % 3 * 0.018; petalsAndStamens.push(needle("瓜栗张开成刷的大量长雄蕊", pale, root, [root[0] + Math.cos(a) * radius, root[1] + 0.18 - i % 3 * 0.02, root[2] + Math.sin(a) * radius], 0.002)); } parts.push(combineMeshes("瓜栗一朵花完整的反卷瓣与雄蕊刷", white, petalsAndStamens)); }
  } else if (kind === 1) {
    const centre: Triple = [0.025, height + 0.12, 0]; parts.push(tapered("八角金盘顶端复伞形花序的主柄", green, [[0.03, height, 0], centre], [0.006, 0.003]));
    for (let i = 0; i < 5; i++) { const a = i * 2.4, head: Triple = [centre[0] + Math.cos(a) * 0.12, centre[1] + 0.04, Math.sin(a) * 0.12]; parts.push(tapered("复伞花序中的分伞柄", pale, [centre, head], [0.0025, 0.0015])); const florets: ModelPart[] = []; for (let j = 0; j < 12; j++) { const b = j * 2.4, radius = Math.sqrt(j / 12) * 0.025; florets.push(lobe("球形小伞序上独立的小花", white, [head[0] + Math.cos(b) * radius, head[1] + Math.sqrt(0.027 ** 2 - radius ** 2), head[2] + Math.sin(b) * radius], [0.009, 0.009, 0.009])); } parts.push(combineMeshes("八角金盘每个球状分伞花序", white, florets)); }
  }
  return parts;
}

function herb(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (let i = 0; i < 6; i++) { const a = i * 2.4, root: Triple = [0, 0, 0], end: Triple = [Math.cos(a) * 0.22, 0.38, Math.sin(a) * 0.22]; parts.push(tapered("水山楂从水底伸向水面的叶柄", green, [root, end], [0.0035, 0.002]), flatLeaf("水山楂浮在水面的长椭圆叶", end, [end[0] + Math.cos(a) * 0.17, 0.39, end[2] + Math.sin(a) * 0.17], 0.065, "oval")); }
    parts.push(tapered("水山楂从水底抽出的花序长柄", green, [[0, 0, 0], [0, 0.42, 0.01]], [0.004, 0.0025]));
    for (const side of [-1, 1]) { const end: Triple = [side * 0.065, 0.45, 0.02]; parts.push(tapered("花序顶端分成叉状的两条穗轴", pale, [[0, 0.42, 0.01], end], [0.002, 0.0009])); const florets: ModelPart[] = []; for (let i = 0; i < 7; i++) { const t = (i + 0.5) / 7, p: Triple = [end[0] * t, 0.42 + 0.03 * t, 0.01 + 0.01 * t]; florets.push(leaf("叉穗两侧白色匙形花被片", white, p, 0.013, 0.019, [35, side * 90, i % 2 ? -30 : 30])); for (let j = 0; j < 3; j++) florets.push(needle("每枚花旁伸出的短花药", wood, p, [p[0] + (j - 1) * 0.004, p[1] + 0.012, p[2] + 0.004], 0.0015)); } parts.push(combineMeshes("水山楂一条叉穗上的完整小花", white, florets)); }
  } else if (kind === 1) {
    parts.push(tapered("醉蝶花有节的直立主茎", green, [[0, 0, 0], [0, 1.05, 0]], [0.012, 0.003]));
    for (let i = 0; i < 5; i++) { const a = i * 2.4, y = 0.16 + i * 0.13, root: Triple = [Math.cos(a) * 0.075, y + 0.035, Math.sin(a) * 0.075]; parts.push(tapered("醉蝶花掌状复叶长叶柄", green, [[0, y, 0], root], [0.003, 0.002]), palmate(root, 0.12, 5)); }
    for (let i = 0; i < 7; i++) { const a = i * 2.4, y = 0.77 + i * 0.035, root: Triple = [Math.cos(a) * 0.065, y + 0.025, Math.sin(a) * 0.065]; parts.push(tapered("醉蝶花花序的细花柄", green, [[0, y, 0], root], [0.002, 0.001])); const pieces: ModelPart[] = []; for (let j = 0; j < 4; j++) pieces.push(leaf("醉蝶花朝一侧张开的四片花瓣", flowerColor, root, 0.015, 0.031, [15, 0, (j - 1.5) * 35])); for (let j = 0; j < 6; j++) pieces.push(needle("远远伸出花瓣的六枚长雄蕊", pale, root, [root[0] + Math.cos(j * Math.PI / 3) * 0.035, root[1] + 0.065, root[2] + Math.sin(j * Math.PI / 3) * 0.035], 0.001)); parts.push(combineMeshes("醉蝶花完整的不对称四瓣长蕊花", flowerColor, pieces)); if (i < 4) parts.push(pointed("同一花序下部自然着生的细长蒴果", green, [[0, y - 0.07, 0], [Math.cos(a) * 0.06, y - 0.03, Math.sin(a) * 0.06], [Math.cos(a) * 0.14, y - 0.05, Math.sin(a) * 0.14]], [0.0015, 0.0028, 0])); }
  } else if (kind === 2) {
    for (let i = 0; i < 7; i++) { const a = i * 2.4, r = 0.32 + i % 3 * 0.08, path: Triple[] = [[0, 0, 0], [Math.cos(a) * r * 0.35, 0.52, Math.sin(a) * r * 0.35], [Math.cos(a) * r, 0.24, Math.sin(a) * r]]; parts.push(tapered("炮仗竹叶片退化的弧垂细枝", green, path, [0.005, 0.003, 0.001]));
      for (let node = 0; node < 3; node++) { const t = 0.3 + node * 0.23, p: Triple = [Math.cos(a) * r * (0.35 + 0.65 * t), 0.52 - 0.28 * t, Math.sin(a) * r * (0.35 + 0.65 * t)]; const flower = frontCup("炮仗竹枝节下垂的细长管状花", flowerColor, p, 0.003, 0.037); flower.rotation.x = 157; parts.push(flower); }
    }
  } else {
    parts.push(tapered("蓝猪耳有明显分枝的直立草茎", green, [[0, 0, 0], [0, 0.36, 0]], [0.0045, 0.0015]));
    for (let i = 0; i < 5; i++) { const y = 0.055 + i * 0.049; for (const side of [-1, 1]) parts.push(flatLeaf("蓝猪耳成对对生的卵形叶", [0, y, 0], [side * 0.07, y + 0.02, 0.018 * (i % 2 ? 1 : -1)], 0.035, "oval")); }
    for (let i = 0; i < 5; i++) { const a = i * 2.4, y = 0.22 + i * 0.022, root: Triple = [Math.cos(a) * 0.045, y + 0.025, Math.sin(a) * 0.045]; parts.push(tapered("叶腋向外伸出的蓝猪耳花柄", green, [[0, y, 0], root], [0.0015, 0.001]), frontCup("蓝猪耳有真正喉腔的合瓣花冠", flowerColor, root, 0.009, 0.024)); const mouth: Triple = [root[0], root[1], root[2] + 0.024], lobes: ModelPart[] = []; for (const angle of [60, 120, 200, 270, 340]) lobes.push(leaf("二上唇三下唇的不对称花冠裂片", angle < 180 ? flowerColor : white, mouth, angle < 180 ? 0.007 : 0.012, angle < 180 ? 0.012 : 0.015, [0, 0, angle - 90])); parts.push(combineMeshes("蓝猪耳分成上下唇的完整花口", flowerColor, lobes)); for (const side of [-1, 1]) parts.push(tapered("蓝猪耳在花内相接成愿骨状的花药支架", pale, [[mouth[0] + side * 0.005, mouth[1] - 0.003, mouth[2] - 0.008], [mouth[0] + side * 0.002, mouth[1] + 0.003, mouth[2] + 0.003], [mouth[0], mouth[1] + 0.004, mouth[2] + 0.003]], [0.0007, 0.0006, 0.0005])); }
  }
  return parts;
}

const houses = [["snakePlant", "虎尾兰", "Dracaena trifasciata"], ["zamioculcas", "金钱树", "Zamioculcas zamiifolia"], ["fiddleLeafFig", "琴叶榕", "Ficus lyrata"], ["pilea", "镜面草", "Pilea peperomioides"], ["spiderPlant", "吊兰", "Chlorophytum comosum"]];
const woods = [["pachira", "瓜栗", "Pachira aquatica"], ["fatsia", "八角金盘", "Fatsia japonica"], ["schefflera", "鹅掌柴", "Heptapleurum arboricola"], ["davidia", "珙桐", "Davidia involucrata"], ["scaevola", "草海桐", "Scaevola taccada"]];
const herbs = [["waterHawthorn", "水山楂", "Aponogeton distachyos"], ["cleome", "醉蝶花", "Tarenaya hassleriana"], ["russelia", "炮仗竹", "Russelia equisetiformis"], ["torenia", "蓝猪耳", "Torenia fournieri"]];

export const ornamentalPlantDesigns: MasterNatureDesign[] = [
  ...houses.map(([key, name, taxon], i) => design(key!, name!, "植物", () => houseplant(i), [taxon!, "具名观叶植物"])),
  ...woods.map(([key, name, taxon], i) => design(key!, name!, "植物", () => woodyPlant(i), [taxon!, "独特叶序与花序"])),
  ...herbs.map(([key, name, taxon], i) => design(key!, name!, "植物", () => herb(i), [taxon!, "具名花冠与繁殖结构"])),
];
