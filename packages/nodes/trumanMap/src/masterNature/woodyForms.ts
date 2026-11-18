import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, petals, tapered } from "./shared";
import { compoundLeaf, flatLeaf } from "./ediblePlants";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const bark = "#a69f88";
const green = "#91a17d";
const pale = "#bdc5a1";
const flower = "#cec5ae";

export function branchCrown(parts: ModelPart[], height: number, points: Triple[]) {
  parts.push(tapered("由地表起的完整木质主干", bark, [[0, 0, 0], [0, height * 0.52, 0], [0.035, height, 0]], [height * 0.045, height * 0.032, height * 0.008]));
  points.forEach((end, i) => parts.push(tapered("与主干相连的木质冠枝", bark, [[0, height * (0.45 + i * 0.055), 0], [end[0] * 0.58, end[1] - 0.24, end[2] * 0.58], end], [height * 0.016, height * 0.01, 0.006])));
}

export function crownLeaves(root: Triple, length: number, form: Parameters<typeof flatLeaf>[4] = "oval", width = length * 0.75): ModelPart {
  const pieces: ModelPart[] = [];
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4, radius = Math.sqrt(i / 12) * length * 0.7;
    const p: Triple = [root[0] + Math.cos(a) * radius, root[1] + i % 3 * length * 0.13, root[2] + Math.sin(a) * radius];
    pieces.push(needle("冠叶相连的绿色嫩枝", green, root, p[0] === root[0] && p[2] === root[2] ? [p[0], p[1] + 0.015, p[2]] : p, 0.003), flatLeaf("完整物种叶形", p, [p[0] + Math.cos(a) * length, p[1] + length * 0.3, p[2] + Math.sin(a) * length], width, form));
  }
  return combineMeshes("与细枝相连的一簇真实轮廓冠叶", green, pieces);
}

function thornBall(root: Triple, radius: number): ModelPart[] {
  const needles: ModelPart[] = [];
  for (let i = 0; i < 24; i++) { const a = i * 2.4, y = -0.7 + i / 23 * 1.4, r = Math.sqrt(1 - y * y); const p: Triple = [root[0] + Math.cos(a) * r * radius, root[1] + y * radius, root[2] + Math.sin(a) * r * radius]; needles.push(needle("木质球果尖突", pale, p, [root[0] + (p[0] - root[0]) * 1.22, root[1] + (p[1] - root[1]) * 1.22, root[2] + (p[2] - root[2]) * 1.22], radius * 0.18)); }
  return [lobe("木质聚合球果", bark, root, [radius * 2.3, radius * 2.3, radius * 2.3]), combineMeshes("整枚球果的外伸果喙", pale, needles)];
}

function ornamentalTree(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    const tips: Triple[] = [[-0.9, 2.2, 0.15], [0.8, 2.4, 0.2], [-0.4, 2.6, -0.6], [0.35, 2.8, 0.45]]; branchCrown(parts, 2.5, tips);
    for (const p of tips) parts.push(crownLeaves(p, 0.25, "bilobed"), petals(5, [p[0] + 0.12, p[1], p[2]], 0.04, 0.09, 70, flower), tapered("洋紫荆长而扁的木质荚", pale, [[p[0], p[1] - 0.02, p[2]], [p[0] + 0.02, p[1] - 0.22, p[2]], [p[0] + 0.01, p[1] - 0.34, p[2]]], [0.012, 0.016, 0.002]));
  } else if (kind === 1) {
    const tips: Triple[] = [[-0.55, 1.9, 0.1], [0.55, 2.05, -0.1], [0.1, 2.3, 0.45], [-0.25, 2.45, -0.4]]; branchCrown(parts, 2.15, tips); for (const p of tips) parts.push(crownLeaves(p, 0.19, "heart"));
    for (let i = 0; i < 14; i++) { const a = i * 2.4, y = 0.5 + i * 0.11; parts.push(petals(5, [Math.cos(a) * 0.07, y, Math.sin(a) * 0.07], 0.012, 0.03, 65, flower)); }
  } else if (kind === 2) {
    const tips: Triple[] = [[-0.8, 1.4, 0], [0.65, 1.55, 0.25], [0.1, 1.9, -0.6]]; branchCrown(parts, 1.8, tips); for (const p of tips) parts.push(crownLeaves(p, 0.33));
    for (let i = 0; i < 5; i++) { const a = i * 2.4, y = 0.45 + i * 0.23, p: Triple = [Math.cos(a) * 0.2, y, Math.sin(a) * 0.2]; parts.push(beam("葫芦树干上短果柄", bark, [0, y + 0.08, 0], p, 0.012), lobe("葫芦树直接生于木干的硬壳圆果", pale, p, [0.24, 0.25, 0.24])); }
  } else if (kind === 3) {
    const tips: Triple[] = [[-0.65, 3.15, 0], [0.6, 3.3, 0.25], [0, 3.55, -0.55]]; branchCrown(parts, 3.35, tips); for (const p of tips) parts.push(crownLeaves(p, 0.4));
    for (const side of [-1, 1]) { parts.push(tapered("炮弹树干上长而下垂的木质总花果轴", bark, [[side * 0.12, 2.6, 0], [side * 0.25, 1.8, 0.03], [side * 0.28, 0.6, 0.04]], [0.012, 0.009, 0.004])); for (let i = 0; i < 4; i++) parts.push(lobe("炮弹树沿干生轴悬挂的球形大果", bark, [side * 0.29, 0.8 + i * 0.4, 0.08], [0.22, 0.22, 0.22])); const p: Triple = [side * 0.3, 2.35, 0.13]; parts.push(petals(6, p, 0.04, 0.095, 80, flower), tapered("炮弹树花内弯拱的雄蕊兜罩", pale, [p, [p[0], p[1] + 0.07, p[2] + 0.045], [p[0], p[1] + 0.04, p[2] + 0.08]], [0.015, 0.023, 0.014])); }
  } else if (kind === 4 || kind === 5) {
    const catalpa = kind === 4; const tips: Triple[] = [[-0.9, 2.7, 0], [0.85, 2.9, 0.2], [-0.2, 3.25, -0.65], [0.3, 3.5, 0.55]]; branchCrown(parts, 3.1, tips);
    for (const p of tips) { parts.push(crownLeaves(p, catalpa ? 0.31 : 0.4, "heart")); for (let i = 0; i < 4; i++) { const root: Triple = [p[0] + i * 0.025, p[1] + i * 0.015, p[2]]; const tube = cap(catalpa ? "梓树终端开放的钟状花" : "泡桐顶端大圆锥花序的长筒花", flower, root, 0.028, catalpa ? 0.04 : 0.08, 3); tube.rotation.x = 55; parts.push(tube); } if (catalpa) for (let i = 0; i < 3; i++) parts.push(tapered("梓树细长悬垂的圆柱蒴果", pale, [[p[0] + i * 0.02, p[1], p[2]], [p[0] + i * 0.02, p[1] - 0.42, p[2] + 0.03]], [0.006, 0.002])); else parts.push(lobe("泡桐宿存的尖卵形木质蒴果", pale, [p[0] - 0.07, p[1] - 0.03, p[2]], [0.025, 0.05, 0.024])); }
  } else if (kind === 6) {
    const tips: Triple[] = [[-0.7, 2.6, 0.2], [0.8, 2.7, 0], [0, 3.1, -0.6], [0.15, 3.2, 0.5]]; branchCrown(parts, 2.9, tips);
    for (const p of tips) { parts.push(crownLeaves(p, 0.27)); const fruits: ModelPart[] = []; for (let i = 0; i < 18; i++) { const a = i * 2.4, y = -0.8 + i / 17 * 1.6, r = Math.sqrt(1 - y * y); const root: Triple = [p[0] + Math.cos(a) * r * 0.027, p[1] - 0.06 + y * 0.027, p[2] + Math.sin(a) * r * 0.027]; fruits.push(leaf("喜树球状果序中分离的扁翅果", pale, root, 0.008, 0.035, [i * 18, -a * 180 / Math.PI, 0])); } parts.push(beam("喜树下垂聚合果序梗", bark, p, [p[0], p[1] - 0.06, p[2]], 0.0025), combineMeshes("喜树整枚球状翅果序", pale, fruits)); }
  } else if (kind === 7 || kind === 8) {
    const plane = kind === 8; const tips: Triple[] = plane ? [[-1.3, 2.25, 0.1], [1.3, 2.35, 0], [-0.45, 3, -0.8], [0.35, 3.15, 0.7]] : [[-0.7, 2.6, 0], [0.8, 2.65, 0.2], [0, 3.2, -0.5], [0.2, 3.4, 0.5]]; branchCrown(parts, 3, tips);
    for (const p of tips) { parts.push(crownLeaves(p, 0.27, "palm")); for (let i = 0; i < (plane ? 2 : 1); i++) { const root: Triple = [p[0], p[1] - 0.14 - i * 0.09, p[2]]; parts.push(beam("下垂木质球果轴", bark, p, root, 0.0025), ...thornBall(root, plane ? 0.023 : 0.028)); } }
    if (plane) for (let i = 0; i < 8; i++) { const a = i * 2.4, y = 0.2 + i * 0.23; parts.push(leaf("悬铃木树干剥落的薄树皮板", "#c2bca2", [Math.cos(a) * 0.105, y, Math.sin(a) * 0.105], 0.1, 0.2, [0, -a * 180 / Math.PI, 0])); }
  } else {
    const tips: Triple[] = [[-0.8, 1.85, 0], [0.7, 2.05, 0.25], [-0.2, 2.4, -0.5]]; branchCrown(parts, 2.2, tips);
    tips.forEach((p, index) => { parts.push(crownLeaves(p, 0.25, index % 2 ? "palm" : "heart")); const perianths: ModelPart[] = []; for (let i = 0; i < 24; i++) { const a = i * 2.4, y = -0.7 + i / 23 * 1.4, r = Math.sqrt(1 - y * y); const start: Triple = [p[0] + Math.cos(a) * r * 0.015, p[1] - 0.045 + y * 0.015, p[2] + Math.sin(a) * r * 0.015]; perianths.push(needle("构树聚花果伸长的肉质花被", "#b6ac8e", start, [p[0] + (start[0] - p[0]) * 1.8, p[1] - 0.045 + y * 0.027, p[2] + (start[2] - p[2]) * 1.8], 0.007)); } parts.push(combineMeshes("构树球状果序的全部肉质长突", "#b6ac8e", perianths)); });
  }
  return parts;
}

function bipinnate(root: Triple, angle: number): ModelPart {
  const a = angle * Math.PI / 180, end: Triple = [root[0] + Math.cos(a) * 0.4, root[1] + 0.08, root[2] + Math.sin(a) * 0.4];
  const pieces: ModelPart[] = [needle("二回羽状复叶的主叶轴", green, root, end, 0.003)];
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { const t = 0.2 + i * 0.25; pieces.push(compoundLeaf([root[0] + (end[0] - root[0]) * t, root[1] + 0.08 * t, root[2] + (end[2] - root[2]) * t], angle + side * 75, 0.14, 1)); }
  return combineMeshes("合欢完整的二回羽状复叶", green, pieces);
}

function distinctiveTree(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0 || kind === 1) {
    const tulip = kind === 0; const tips: Triple[] = [[-0.8, 2.65, 0], [0.7, 2.8, 0.35], [-0.2, 3.3, -0.5], [0.1, 3.55, 0.35]]; branchCrown(parts, 3.25, tips);
    for (const p of tips) { parts.push(crownLeaves(p, 0.24, tulip ? "tulip" : "mitten")); if (tulip) { parts.push(cap("北美鹅掌楸向上开放的杯状花心", pale, p, 0.033, 0.055, 3), petals(6, p, 0.025, 0.065, 35, flower)); } else { parts.push(beam("檫树果序鲜明的长梗", bark, p, [p[0], p[1] + 0.06, p[2]], 0.003), cap("檫树浆果基部杯状果托", pale, [p[0], p[1] + 0.055, p[2]], 0.009, 0.008, 3), lobe("檫树单枚卵形核果", "#9ba58c", [p[0], p[1] + 0.066, p[2]], [0.015, 0.022, 0.015])); } }
  } else if (kind === 2 || kind === 3) {
    const silk = kind === 3; const tips: Triple[] = silk ? [[-1.2, 2.3, 0], [1.1, 2.35, 0.2], [-0.4, 2.8, -0.8], [0.4, 2.9, 0.7]] : [[-0.7, 2.7, 0], [0.8, 2.8, 0.15], [-0.3, 3.25, -0.45], [0.2, 3.4, 0.45]]; branchCrown(parts, silk ? 2.6 : 3.1, tips);
    for (let index = 0; index < tips.length; index++) { const p = tips[index]!; for (let j = 0; j < 3; j++) parts.push(silk ? bipinnate([p[0], p[1] + j * 0.05, p[2]], index * 90 + j * 110) : compoundLeaf([p[0], p[1] + j * 0.05, p[2]], index * 90 + j * 110, 0.35, 4));
      if (silk) { const filaments: ModelPart[] = []; for (let i = 0; i < 28; i++) { const a = i * 2.4, r = Math.sqrt(i / 28) * 0.06; filaments.push(needle("合欢花头细长上展的雄蕊", flower, [p[0], p[1], p[2]], [p[0] + Math.cos(a) * r, p[1] + 0.04 + i % 4 * 0.009, p[2] + Math.sin(a) * r], 0.0015)); } parts.push(combineMeshes("完整半球形丝状合欢花", flower, filaments)); }
      else { parts.push(tapered("刺槐下垂的蝶形花序总轴", green, [p, [p[0] + 0.035, p[1] - 0.18, p[2]]], [0.003, 0.001])); for (let i = 0; i < 5; i++) parts.push(petals(5, [p[0] + Math.sin(i * 2.4) * 0.014, p[1] - i * 0.033, p[2] + Math.cos(i * 2.4) * 0.014], 0.012, 0.025, 65, flower)); }
    }
    if (!silk) for (let i = 0; i < 6; i++) for (const side of [-1, 1]) parts.push(needle("刺槐叶基成对的托叶刺", pale, [0, 0.35 + i * 0.21, 0], [side * 0.1, 0.34 + i * 0.21, 0.025], 0.014));
  } else if (kind === 4) {
    const tips: Triple[] = [[-0.7, 2.7, 0], [0.75, 2.8, 0.2], [-0.15, 3.2, -0.5], [0.2, 3.4, 0.5]]; branchCrown(parts, 3.15, tips);
    for (const p of tips) { for (let j = 0; j < 3; j++) parts.push(compoundLeaf([p[0], p[1] + j * 0.035, p[2]], j * 120, 0.38, 4, true)); const styles: ModelPart[] = []; for (let i = 0; i < 18; i++) { const x = p[0] - 0.13 + i * 0.015; styles.push(tapered("银桦花序单侧成排反折的长花柱", flower, [[x, p[1], p[2]], [x, p[1] + 0.055, p[2] + 0.02], [x, p[1] + 0.05, p[2] + 0.05]], [0.002, 0.0015, 0.0005])); } parts.push(beam("银桦水平梳状花序轴", green, [p[0] - 0.14, p[1], p[2]], [p[0] + 0.14, p[1], p[2]], 0.004), combineMeshes("银桦真正单侧排列的完整梳状花序", flower, styles)); }
  } else {
    const tips: Triple[] = [[-0.85, 2.4, 0.2], [0.85, 2.5, 0], [0, 2.9, -0.6]]; branchCrown(parts, 2.7, tips);
    for (const p of tips) { parts.push(crownLeaves(p, 0.42), part("棋盘脚四棱四角的盒状浮水果实", "extrude", pale, [p[0], p[1] - 0.06, p[2]], [1, 1, 1], [0, 0, 0], { profile: [{ x: -0.05, y: 0 }, { x: 0.05, y: 0 }, { x: 0.035, y: 0.1 }, { x: -0.035, y: 0.1 }], depth: 0.095 })); const stamens: ModelPart[] = []; for (let i = 0; i < 30; i++) { const a = i * 2.4, r = Math.sqrt(i / 30) * 0.085; stamens.push(needle("棋盘脚放射状长雄蕊", flower, [p[0], p[1], p[2]], [p[0] + Math.cos(a) * r, p[1] + 0.025 + r * 0.45, p[2] + Math.sin(a) * r], 0.0018)); } parts.push(combineMeshes("棋盘脚毛刷状的完整花冠雄蕊", flower, stamens)); }
  }
  return parts;
}

function wetlandPlant(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0 || kind === 1) {
    const knee = kind === 1; const tips: Triple[] = [[-0.7, 1.9, 0], [0.65, 2, 0.2], [0, 2.4, -0.4]]; branchCrown(parts, 2.2, tips); for (const p of tips) parts.push(crownLeaves(p, knee ? 0.22 : 0.15));
    if (knee) for (let i = 0; i < 8; i++) { const a = i * 2.4, r = 0.25 + i % 3 * 0.16; parts.push(tapered("木榄穿出地表后回入地表的膝状呼吸根", bark, [[Math.cos(a) * r, 0.009, Math.sin(a) * r], [Math.cos(a) * (r + 0.07), 0.14, Math.sin(a) * (r + 0.07)], [Math.cos(a) * (r + 0.14), 0.009, Math.sin(a) * (r + 0.14)]], [0.014, 0.018, 0.012])); }
    else { const roots: ModelPart[] = []; for (let i = 0; i < 30; i++) { const a = i * 2.4, r = 0.15 + Math.sqrt(i / 30) * 0.6; roots.push(needle("海榄雌直接伸出泥面的直立呼吸根", bark, [Math.cos(a) * r, 0, Math.sin(a) * r], [Math.cos(a) * r, 0.11 + i % 4 * 0.026, Math.sin(a) * r], 0.015)); } parts.push(combineMeshes("海榄雌可见地表的完整呼吸根群", bark, roots)); }
    if (knee) for (const p of tips) parts.push(petals(8, p, 0.012, 0.045, 75, flower), tapered("木榄花萼下垂的胎生胚轴", pale, [p, [p[0] + 0.015, p[1] - 0.25, p[2]], [p[0] + 0.01, p[1] - 0.32, p[2]]], [0.013, 0.008, 0.002]));
  } else if (kind === 2) {
    for (let axis = 0; axis < 6; axis++) {
      const a = axis * Math.PI / 3; const path: Triple[] = [[0, 0, 0], [Math.cos(a) * 0.35, 0.7, Math.sin(a) * 0.35], [Math.cos(a) * 1.1, 1.5, Math.sin(a) * 1.1], [Math.cos(a) * 2, 1.6, Math.sin(a) * 2]];
      parts.push(tapered("无地上树干的水椰长羽叶轴", bark, path, [0.04, 0.03, 0.018, 0.003]));
      for (const side of [-1, 1]) { const leaflets: ModelPart[] = []; for (let i = 0; i < 12; i++) { const t = (i + 1) / 13, r = 0.35 + t * 1.65; const p: Triple = [Math.cos(a) * r, r <= 1.1 ? 0.7 + (r - 0.35) / 0.75 * 0.8 : 1.5 + (r - 1.1) / 0.9 * 0.1, Math.sin(a) * r]; const end: Triple = [p[0] + Math.cos(a + side * 1.15) * 0.55, p[1] - 0.08, p[2] + Math.sin(a + side * 1.15) * 0.55]; leaflets.push(flatLeaf("水椰两列排列的长线形羽片", p, end, 0.07)); } parts.push(combineMeshes("一侧全部独立水椰羽片", green, leaflets)); }
    }
    parts.push(beam("水椰基部独立生出的短果序梗", bark, [0, 0, 0], [0.12, 0.55, 0], 0.055));
    const fruit: ModelPart[] = []; for (let i = 0; i < 25; i++) { const a = i * 2.4, y = -0.8 + i / 24 * 1.6, r = Math.sqrt(1 - y * y); const root: Triple = [0.12 + Math.cos(a) * r * 0.09, 0.64 + y * 0.09, Math.sin(a) * r * 0.09]; fruit.push(needle("水椰球果中向外突出的楔形独立核果", bark, [0.12, 0.64, 0], [0.12 + (root[0] - 0.12) * 1.8, 0.64 + y * 0.16, root[2] * 1.8], 0.07)); } parts.push(combineMeshes("水椰完整放射球状复果", bark, fruit));
  } else {
    for (const side of [-1, 1]) { parts.push(tapered("蜂巢姜叶片交叠形成的直立假茎", green, [[side * 0.1, 0, 0], [side * 0.1, 0.8, 0], [side * 0.1, 1.7, 0]], [0.016, 0.014, 0.005])); for (let i = 0; i < 8; i++) parts.push(leaf("蜂巢姜假茎两侧的狭长披针叶", green, [side * 0.1, 0.2 + i * 0.17, 0], 0.095, 0.45, [50, i % 2 ? 80 : -80, 0])); }
    parts.push(beam("蜂巢姜从地表另出的短花序梗", bark, [0, 0, 0.15], [0, 0.38, 0.15], 0.013));
    for (let i = 0; i < 30; i++) { const a = i * 2.4, y = 0.32 + i * 0.007, r = 0.052 * Math.sin((i + 3) / 35 * Math.PI); const bract = cap("蜂巢姜厚蜡质向上开口的苞片杯", "#b9ac8f", [Math.cos(a) * r, y, 0.15 + Math.sin(a) * r], 0.025, 0.034, 3); bract.rotation.z = Math.cos(a) * -35; bract.rotation.x = Math.sin(a) * 35; parts.push(bract); }
  }
  return parts;
}

const ornamentalNames = [["bauhiniaTree", "洋紫荆", "Bauhinia"], ["cercisTree", "紫荆", "Cercis chinensis"], ["calabashTree", "葫芦树", "Crescentia cujete"], ["cannonballTree", "炮弹树", "Couroupita guianensis"], ["catalpaTree", "梓树", "Catalpa"], ["paulowniaTree", "泡桐", "Paulownia"], ["camptothecaTree", "喜树", "Camptotheca acuminata"], ["sweetgumTree", "枫香树", "Liquidambar"], ["planeTree", "悬铃木", "Platanus"], ["paperMulberryTree", "构树", "Broussonetia papyrifera"]];
const distinctiveNames = [["tulipTree", "北美鹅掌楸", "Liriodendron tulipifera"], ["sassafrasTree", "檫树", "Sassafras"], ["blackLocustTree", "刺槐", "Robinia pseudoacacia"], ["silkTree", "合欢", "Albizia julibrissin"], ["silkyOakTree", "银桦", "Grevillea robusta"], ["fishPoisonTree", "棋盘脚", "Barringtonia asiatica"]];
const wetlandNames = [["greyMangrove", "海榄雌", "Avicennia marina"], ["kneeRootMangrove", "木榄", "Bruguiera gymnorhiza"], ["nipaPalm", "水椰", "Nypa fruticans"], ["beehiveGinger", "蜂巢姜", "Zingiber spectabile"]];

export const woodyFormDesigns: MasterNatureDesign[] = [
  ...ornamentalNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => ornamentalTree(i), ["木本植物结构", taxon!])),
  ...distinctiveNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => distinctiveTree(i), ["木本植物结构", taxon!])),
  ...wetlandNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => wetlandPlant(i), ["水岸植物结构", taxon!])),
];
