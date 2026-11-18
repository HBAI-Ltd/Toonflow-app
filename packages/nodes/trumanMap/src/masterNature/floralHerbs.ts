import { Euler, Quaternion, Vector3 } from "three";
import { cap, combineMeshes, design, leaf, lobe, needle, part, petals, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { pointed } from "./insectForms";

const green = "#91a17c";
const pale = "#bcc4a5";
const white = "#d0cdb8";
const flowerColor = "#bfb0ba";

function trumpet(root: Triple, direction: Triple, length: number, radius: number, longTube = false): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], rings = longTube ? [[0.08, 0], [0.12, 0.68], [0.72, 0.91], [1, 1]] : [[0.1, 0], [0.25, 0.45], [0.78, 0.85], [1, 1]], sections = 30;
  for (let side = 0; side < 2; side++) for (let row = 0; row < rings.length; row++) for (let col = 0; col < sections; col++) { const a = col * Math.PI * 2 / sections, t = rings[row]![1]!, r = radius * (rings[row]![0]! - side * 0.045) * (row === 3 ? 0.9 + Math.cos(a * 5) * 0.1 : 1); vertices.push({ x: Math.cos(a) * r, y: length * t + (row === 3 ? Math.cos(a * 5) * radius * 0.06 : 0), z: Math.sin(a) * r }); }
  for (let side = 0; side < 2; side++) for (let row = 0; row < 3; row++) for (let col = 0; col < sections; col++) { const a = side * 120 + row * sections + col, b = side * 120 + row * sections + (col + 1) % sections, c = a + sections, d = b + sections; if (side) indices.push(a, b, c, b, d, c); else indices.push(a, c, b, b, c, d); }
  for (const row of [0, 3]) for (let col = 0; col < sections; col++) { const a = row * sections + col, b = row * sections + (col + 1) % sections; if (row) indices.push(a, b, a + 120, b, b + 120, a + 120); else indices.push(a, a + 120, b, b, a + 120, b + 120); }
  const p = part(longTube ? "细长花被筒末端展开的连续五角瓣缘" : "矮牵牛连续有褶的喇叭筒与五裂开放瓣缘", "mesh", flowerColor, root, [1, 1, 1], [0, 0, 0], { vertices, indices }), q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...direction).normalize()), e = new Euler().setFromQuaternion(q); p.rotation = { x: e.x * 180 / Math.PI, y: e.y * 180 / Math.PI, z: e.z * 180 / Math.PI }; return p;
}

function petunia(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let branch = 0; branch < 4; branch++) {
    const a = branch * 2.4, end: Triple = [Math.cos(a) * 0.2, 0.26 + branch % 2 * 0.06, Math.sin(a) * 0.2]; parts.push(tapered("矮牵牛由基部开展的柔软草质枝", pale, [[0, 0, 0], [end[0] * 0.5, 0.19, end[2] * 0.5], end], [0.004, 0.003, 0.0015]));
    const leaves: ModelPart[] = [];
    for (let node = 0; node < 5; node++) { const t = 0.3 + node * 0.14, p: Triple = [end[0] * t, 0.19 * Math.min(t * 2, 1) + Math.max(0, t * 2 - 1) * (end[1] - 0.19), end[2] * t], b = a + (node % 2 ? 1.2 : -1.2); leaves.push(flatLeaf("矮牵牛全缘且近无柄的柔软卵叶", p, [p[0] + Math.cos(b) * 0.062, p[1] + 0.014, p[2] + Math.sin(b) * 0.062], 0.032)); }
    parts.push(combineMeshes("矮牵牛互生茎叶的完整枝段", green, leaves));
    for (const side of [-1, 1]) { const p: Triple = [end[0] + Math.cos(a + side) * 0.024, end[1] + 0.022, end[2] + Math.sin(a + side) * 0.024]; parts.push(needle("矮牵牛单花而非稠密花穗的短柄", green, end, p, 0.0017), trumpet(p, [Math.cos(a + side), 0.9, Math.sin(a + side)], 0.043, 0.027)); const sepals: ModelPart[] = []; for (let i = 0; i < 5; i++) sepals.push(leaf("矮牵牛花基部狭长的五萼裂片", green, p, 0.003, 0.016, [40, i * 72, 0])); parts.push(combineMeshes("真实相连的五裂花萼", green, sepals)); }
  }
  return parts;
}

function fourOClock(): ModelPart[] {
  const parts: ModelPart[] = [tapered("紫茉莉肥厚直立而茎节膨大的主秆", green, [[0, 0, 0], [0, 0.28, 0], [0, 0.55, 0]], [0.012, 0.009, 0.004])];
  for (let fork = 0; fork < 3; fork++) {
    const a = fork * 2.4, root: Triple = [0, 0.2 + fork * 0.1, 0], end: Triple = [Math.cos(a) * 0.22, 0.62 + fork * 0.07, Math.sin(a) * 0.22]; parts.push(tapered("紫茉莉在膨大茎节上生出的叉枝", green, [root, end], [0.006, 0.002]), lobe("紫茉莉真实增粗的分叉节", pale, root, [0.025, 0.018, 0.025]));
    for (let node = 0; node < 3; node++) for (const side of [-1, 1]) { const t = 0.3 + node * 0.26, p: Triple = [end[0] * t, root[1] + (end[1] - root[1]) * t, end[2] * t], b = a + side * 1.25; parts.push(flatLeaf("紫茉莉对生且基部宽心形的长柄叶", p, [p[0] + Math.cos(b) * 0.12, p[1] + 0.03, p[2] + Math.sin(b) * 0.12], 0.082, "heart")); }
    for (let flower = 0; flower < 3; flower++) { const b = a + flower * 1.8, p: Triple = [end[0] + Math.cos(b) * 0.012, end[1] + flower * 0.009, end[2] + Math.sin(b) * 0.012], direction: Triple = [Math.cos(b), 0.5, Math.sin(b)], unit = new Vector3(...direction).normalize(); parts.push(needle("紫茉莉花簇的极短花梗", green, end, p, 0.0018), cap("紫茉莉每朵花基部独立的杯形总苞", green, p, 0.006, 0.008, 3), trumpet(p, direction, 0.044, 0.014, true)); const stamens: ModelPart[] = []; for (let i = 0; i < 5; i++) { const c = i * Math.PI * 2 / 5, base: Triple = [p[0] + unit.x * 0.038, p[1] + unit.y * 0.038, p[2] + unit.z * 0.038], tip: Triple = [p[0] + unit.x * 0.053 + Math.cos(c) * 0.004, p[1] + unit.y * 0.053 + 0.004, p[2] + unit.z * 0.053 + Math.sin(c) * 0.004]; stamens.push(needle("紫茉莉超出窄长花被口的五根细雄蕊", white, base, tip, 0.0007)); } parts.push(combineMeshes("紫茉莉从真实花喉伸出的外露花蕊", white, stamens)); }
  }
  return parts;
}

function rehmannia(): ModelPart[] {
  const parts: ModelPart[] = [tapered("地黄自基生叶丛抽出的短直花葶", pale, [[0, 0, 0], [0.007, 0.17, 0], [0.012, 0.34, 0]], [0.006, 0.004, 0.0015])];
  for (let i = 0; i < 8; i++) { const a = i * 2.4; parts.push(flatLeaf("地黄贴近地表的大型褶皱倒卵叶", [0, 0.004, 0], [Math.cos(a) * 0.13, 0.02 + i % 3 * 0.01, Math.sin(a) * 0.13], 0.055, "obovate")); }
  for (let i = 0; i < 6; i++) { const y = 0.12 + i * 0.034, x = y < 0.17 ? 0.007 * y / 0.17 : 0.007 + 0.005 * (y - 0.17) / 0.17, side = i % 2 ? -1 : 1, root: Triple = [x, y, 0], flower: Triple = [x + side * 0.022, y + 0.006, 0.012]; parts.push(flatLeaf("地黄沿花轴逐渐缩小的茎生苞叶", root, [x - side * 0.033, y + 0.012, -0.012], 0.019, "obovate"), needle("地黄单花叶腋实际相连的短梗", pale, root, flower, 0.0013), smallCorolla(flower, [side, -0.25, 0.35], 0.039, 0.0085, "#bcafb2", true)); }
  return parts;
}

function blackberryLily(): ModelPart[] {
  const parts: ModelPart[] = [], fan: ModelPart[] = [];
  for (let i = 0; i < 9; i++) { const angle = (i - 4) * 12; fan.push(leaf("射干由同一短茎两列套叠的剑形叶", green, [i % 2 * 0.008, 0.005 + Math.abs(i - 4) * 0.004, 0], 0.034, 0.49 - Math.abs(i - 4) * 0.047, [0, 0, angle])); } parts.push(combineMeshes("射干真正压扁而非放射莲座的叶扇", green, fan), tapered("射干高于叶扇的无宽叶花轴", pale, [[0, 0, 0], [0.012, 0.48, 0], [0, 0.75, 0]], [0.006, 0.004, 0.0015]));
  for (let branch = 0; branch < 3; branch++) { const a = branch * 2.4, root: Triple = [branch === 0 ? 0.012 : 0.008, 0.48 + branch * 0.075, 0], flower: Triple = [Math.cos(a) * 0.09, 0.72 + branch * 0.065, Math.sin(a) * 0.09]; parts.push(tapered("射干在花轴上实际分叉的花梗", pale, [root, flower], [0.002, 0.001]), petals(6, flower, 0.012, 0.027, 75, "#c7b69a")); const organs: ModelPart[] = []; for (let i = 0; i < 3; i++) { const b = i * Math.PI * 2 / 3; organs.push(needle("射干花心三根雄蕊", white, flower, [flower[0] + Math.cos(b) * 0.004, flower[1] + 0.015, flower[2] + Math.sin(b) * 0.004], 0.0007)); } parts.push(combineMeshes("六片近等大花被内真正的三枚雄蕊", white, organs)); }
  return parts;
}

function toadLily(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let stem = 0; stem < 2; stem++) {
    const root: Triple = [stem * 0.035, 0, 0], top: Triple = [0.14 + stem * 0.035, 0.56 + stem * 0.05, 0.035]; parts.push(tapered("油点草不分枝而单向拱曲的草茎", pale, [root, [root[0] + 0.025, 0.32, 0.01], top], [0.005, 0.0035, 0.0013]));
    for (let node = 0; node < 7; node++) { const y = 0.06 + node * 0.071, t = Math.max(0, (y - 0.32) / (top[1] - 0.32)), x = y < 0.32 ? root[0] + 0.025 * y / 0.32 : root[0] + 0.025 + (top[0] - root[0] - 0.025) * t, z = y < 0.32 ? 0.01 * y / 0.32 : 0.01 + 0.025 * t, p: Triple = [x, y, z], side = node % 2 ? -1 : 1; parts.push(flatLeaf("油点草沿茎交错成梯列的抱茎长叶", p, [x + side * 0.105, y + 0.022, z + 0.02], 0.047));
      if (node < 4) continue;
      const flower: Triple = [x, y + 0.02, z + 0.024]; parts.push(needle("油点草上部叶腋单朵上向花的短梗", green, p, flower, 0.0014), petals(6, flower, 0.007, 0.016, 72, white));
      const organs: ModelPart[] = [];
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; organs.push(needle("油点草突出花被的六枚雄蕊", flowerColor, flower, [flower[0] + Math.cos(a) * 0.005, flower[1] + 0.014, flower[2] + Math.sin(a) * 0.005], 0.0006)); if (i % 2 === 0) { organs.push(lobe("油点草外轮花被根部真实膨起的蜜囊", pale, [flower[0] + Math.cos(a) * 0.004, flower[1], flower[2] + Math.sin(a) * 0.004], [0.006, 0.004, 0.006])); const fork: Triple = [flower[0] + Math.cos(a) * 0.003, flower[1] + 0.018, flower[2] + Math.sin(a) * 0.003]; organs.push(needle("油点草三根上举花柱的主干", white, flower, fork, 0.0007)); for (const side of [-1, 1]) organs.push(needle("油点草每根花柱实际二叉分开的柱头", white, fork, [fork[0] + Math.cos(a + side * 0.7) * 0.005, fork[1] + 0.002, fork[2] + Math.sin(a + side * 0.7) * 0.005], 0.0006)); } }
      parts.push(combineMeshes("油点草花心可辨的六蕊三叉柱头冠与蜜囊", flowerColor, organs));
    }
  }
  return parts;
}

function silverSinningia(): ModelPart[] {
  const parts: ModelPart[] = [cap("断崖女王天然部分露在地表的木栓块茎", "#aca38e", [0, 0, 0], 0.065, 0.072, 5), tapered("断崖女王由块茎顶端发出的单一短芽轴", pale, [[0, 0.06, 0], [0, 0.18, 0]], [0.008, 0.004])], hairs: ModelPart[] = [];
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, root: Triple = [0, 0.155 + i % 2 * 0.008, 0], end: Triple = [Math.cos(a) * 0.105, root[1] + 0.036, Math.sin(a) * 0.105], p = flatLeaf("断崖女王集中成四叶假轮的银绒宽卵叶", root, end, 0.075); p.color = pale; parts.push(p);
    const delta = new Vector3(...end).sub(new Vector3(...root)), across = new Vector3(delta.z, 0, -delta.x).normalize(), up = new Vector3().crossVectors(delta.clone().normalize(), across).normalize(); if (up.y < 0) up.negate();
    for (let j = p.vertices!.length / 2; j < p.vertices!.length; j++) { const v = p.vertices![j]!, start: Triple = [root[0] + v.x, root[1] + v.y, root[2] + v.z]; hairs.push(needle("断崖女王真正从叶面长出的细银毛", white, start, [start[0] + up.x * 0.002, start[1] + up.y * 0.002, start[2] + up.z * 0.002], 0.00025)); }
  }
  parts.push(combineMeshes("四片叶面连续相连的毫米级银绒", white, hairs));
  for (let i = 0; i < 6; i++) { const a = i * 2.4, p: Triple = [Math.cos(a) * 0.024, 0.21 + i % 2 * 0.012, Math.sin(a) * 0.024]; parts.push(needle("四叶腋间抽出的细长单花梗", pale, [0, 0.167, 0], p, 0.0016), smallCorolla(p, [Math.cos(a), -0.3, Math.sin(a)], 0.034, 0.004, "#c5a99e")); }
  return parts;
}

function jewelsOfOpar(): ModelPart[] {
  const parts: ModelPart[] = [tapered("土人参粗而肉质的短主茎", green, [[0, 0, 0], [0.012, 0.36, 0], [0.015, 0.7, 0]], [0.01, 0.006, 0.0015])];
  for (let node = 0; node < 7; node++) { const a = node * 2.4, y = 0.035 + node * 0.049, x = y / 0.36 * 0.012; parts.push(flatLeaf("土人参短柄肉质倒卵叶", [x, y, 0], [x + Math.cos(a) * 0.1, y + 0.02, Math.sin(a) * 0.1], 0.045, "obovate")); }
  for (let axis = 0; axis < 5; axis++) { const a = axis * 2.4, root: Triple = [0.012 + axis * 0.0005, 0.38 + axis * 0.054, 0], end: Triple = [root[0] + Math.cos(a) * (0.15 - axis * 0.015), root[1] + 0.11, Math.sin(a) * (0.15 - axis * 0.015)]; parts.push(tapered("土人参叶丛上方疏松分枝的细圆锥花轴", "#afa18d", [root, end], [0.0015, 0.0007]));
    const fruit: ModelPart[] = [];
    for (let i = 0; i < 4; i++) { const t = (i + 1) / 5, p: Triple = [root[0] + (end[0] - root[0]) * t, root[1] + (end[1] - root[1]) * t, end[2] * t], tip: Triple = [p[0] + Math.cos(a + 1) * 0.022, p[1] + 0.012, p[2] + Math.sin(a + 1) * 0.022]; fruit.push(needle("土人参每枚果实纤细相连的短柄", "#afa18d", p, tip, 0.0007), lobe("土人参悬在细花轴上的珠状小蒴果", "#b7ac92", tip, [0.006, 0.0065, 0.006])); }
    parts.push(combineMeshes("土人参疏松而非堆团的小果序", "#b7ac92", fruit), petals(5, end, 0.003, 0.006, 80, flowerColor));
  }
  return parts;
}

function epimedium(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let branch = 0; branch < 3; branch++) {
    const a = branch * 2.4, node: Triple = [Math.cos(a) * 0.075, 0.16 + branch * 0.02, Math.sin(a) * 0.075]; parts.push(needle("大花淫羊藿基部长柄三出复叶的主叶柄", green, [0, 0, 0], node, 0.003));
    for (let fork = 0; fork < 3; fork++) { const b = a + (fork - 1) * 1.05, p: Triple = [node[0] + Math.cos(b) * 0.025, node[1] + 0.012, node[2] + Math.sin(b) * 0.025]; parts.push(needle("大花淫羊藿三出叶的二级分叉叶柄", green, node, p, 0.0015)); const leaves: ModelPart[] = []; for (let leaflet = 0; leaflet < 3; leaflet++) { const c = b + (leaflet - 1) * 0.62; leaves.push(flatLeaf("大花淫羊藿有心形叶基的独立小叶", p, [p[0] + Math.cos(c) * 0.055, p[1] + 0.015, p[2] + Math.sin(c) * 0.055], 0.036, "heart")); } parts.push(combineMeshes("大花淫羊藿九小叶中的完整三叶组", green, leaves)); }
  }
  const top: Triple = [0.02, 0.36, 0]; parts.push(tapered("大花淫羊藿高出复叶的细总状花序轴", pale, [[0, 0, 0], [0, 0.24, 0], top], [0.003, 0.0015, 0.0007]));
  for (let i = 0; i < 5; i++) { const a = i * 2.4, root: Triple = [i * 0.004, 0.24 + i * 0.024, 0], p: Triple = [root[0] + Math.cos(a) * 0.045, root[1] - 0.012, Math.sin(a) * 0.045]; parts.push(tapered("大花淫羊藿下垂单花的纤细花梗", pale, [root, p], [0.0008, 0.0005]), petals(4, p, 0.006, 0.011, 70, flowerColor));
    const centers: ModelPart[] = [];
    for (let petal = 0; petal < 4; petal++) { const b = petal * Math.PI / 2, start: Triple = [p[0] + Math.cos(b) * 0.0025, p[1] - 0.002, p[2] + Math.sin(b) * 0.0025]; parts.push(pointed("大花淫羊藿每枚花瓣向后弯成的独立长蜜距", white, [start, [p[0] + Math.cos(b) * 0.011, p[1] - 0.005, p[2] + Math.sin(b) * 0.011], [p[0] + Math.cos(b) * 0.019, p[1] + 0.009, p[2] + Math.sin(b) * 0.019]], [0.0028, 0.0018, 0])); centers.push(needle("大花淫羊藿中央四根雄蕊", white, p, [p[0] + Math.cos(b) * 0.0015, p[1] + 0.006, p[2] + Math.sin(b) * 0.0015], 0.0006)); }
    parts.push(combineMeshes("四距花中央独立的四枚雄蕊", white, centers));
  }
  return parts;
}

export const floralHerbDesigns: MasterNatureDesign[] = [
  design("petunia", "矮牵牛", "植物", petunia, ["Petunia × atkinsiana", "连续五裂喇叭花冠"]),
  design("mirabilis", "紫茉莉", "植物", fourOClock, ["Mirabilis jalapa", "膨大茎节与细长花被筒"]),
  design("rehmannia", "地黄", "植物", rehmannia, ["Rehmannia glutinosa", "基生叶与单侧双唇长管花"]),
  design("irisDomestica", "射干", "植物", blackberryLily, ["Iris domestica", "压扁叶扇与六等瓣花"]),
  design("tricyrtis", "油点草", "植物", toadLily, ["Tricyrtis hirta", "抱茎梯列叶与蜜囊三叉花柱"]),
  design("sinningiaLeucotricha", "断崖女王", "植物", silverSinningia, ["Sinningia leucotricha", "露生块茎与四叶银绒假轮"]),
  design("talinum", "土人参", "植物", jewelsOfOpar, ["Talinum paniculatum", "肉质倒卵叶与疏松珠果序"]),
  design("epimediumGrandiflorum", "大花淫羊藿", "植物", epimedium, ["Epimedium grandiflorum", "二回三出叶与四枚反曲长蜜距"]),
];
