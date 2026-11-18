import { beam, cap, combineMeshes, design, leaf, lobe, needle, petals, polygon, tapered, tube } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { produceDesigns } from "./produce";

const green = "#98ad86";
const light = "#b5c39f";
const stemColor = "#a4b18d";
const flowerColor = "#d8d1b3";

export function flatLeaf(name: string, root: Triple, end: Triple, width: number, form: "heart" | "palm" | "lobed" | "oval" | "arrow" | "bilobed" | "tulip" | "mitten" | "fiddle" | "obovate" | [number, number][] = "oval", thickness = 0.002): ModelPart {
  const outline: [number, number][] = Array.isArray(form) ? form : form === "obovate" ? [[0, 0], [-0.16, 0.15], [-0.42, 0.48], [-0.5, 0.78], [-0.36, 0.97], [-0.12, 1], [0.12, 1], [0.36, 0.97], [0.5, 0.78], [0.42, 0.48], [0.16, 0.15]] : form === "fiddle" ? [[0, 0], [-0.23, 0.06], [-0.36, 0.23], [-0.2, 0.43], [-0.46, 0.68], [-0.5, 0.87], [-0.27, 1], [0.27, 1], [0.5, 0.87], [0.46, 0.68], [0.2, 0.43], [0.36, 0.23], [0.23, 0.06]] : form === "bilobed" ? [[0, 0], [-0.4, 0.13], [-0.5, 0.55], [-0.34, 0.91], [-0.12, 1], [0, 0.67], [0.12, 1], [0.34, 0.91], [0.5, 0.55], [0.4, 0.13]] : form === "tulip" ? [[0, 0], [-0.22, 0.12], [-0.5, 0.29], [-0.3, 0.51], [-0.47, 0.88], [-0.14, 0.83], [0, 0.68], [0.14, 0.83], [0.47, 0.88], [0.3, 0.51], [0.5, 0.29], [0.22, 0.12]] : form === "mitten" ? [[0, 0], [-0.28, 0.16], [-0.36, 0.58], [-0.06, 1], [0.18, 0.72], [0.2, 0.44], [0.46, 0.65], [0.5, 0.35], [0.2, 0.18]] : form === "arrow" ? [[0, 0.12], [-0.13, 0], [-0.5, -0.25], [-0.4, 0.35], [0, 1], [0.4, 0.35], [0.5, -0.25], [0.13, 0]] : form === "heart" ? [[0, 0.1], [-0.22, -0.08], [-0.5, 0.12], [-0.46, 0.45], [0, 1], [0.46, 0.45], [0.5, 0.12], [0.22, -0.08]] : form === "palm" ? [[0, 0], [-0.48, -0.04], [-0.28, 0.24], [-0.5, 0.4], [-0.23, 0.45], [-0.3, 0.7], [-0.1, 0.65], [0, 1], [0.1, 0.65], [0.3, 0.7], [0.23, 0.45], [0.5, 0.4], [0.28, 0.24], [0.48, -0.04]] : form === "lobed" ? [[0, 0], [-0.18, 0.1], [-0.42, 0.18], [-0.17, 0.26], [-0.5, 0.4], [-0.2, 0.45], [-0.34, 0.65], [-0.12, 0.67], [0, 1], [0.12, 0.67], [0.34, 0.65], [0.2, 0.45], [0.5, 0.4], [0.17, 0.26], [0.42, 0.18], [0.18, 0.1]] : [[0, 0], [-0.35, 0.16], [-0.5, 0.5], [-0.25, 0.82], [0, 1], [0.25, 0.82], [0.5, 0.5], [0.35, 0.16]];
  const dx = end[0] - root[0], dy = end[1] - root[1], dz = end[2] - root[2]; const length = Math.hypot(dx, dy, dz); const horizontal = Math.hypot(dx, dz);
  const across: Triple = horizontal > 1e-8 ? [dz / horizontal, 0, -dx / horizontal] : [1, 0, 0];
  const up: Triple = horizontal > 1e-8 ? [-dy * dx / (length * horizontal), horizontal / length, -dy * dz / (length * horizontal)] : [0, 0, -1];
  const inset = form === "heart" ? 0.1 : form === "arrow" ? 0.12 : 0;
  // ACT: 凹缺接柄点对应root、叶尖对应end；其余轮廓保持原坐标约定。
  const p = polygon(name, green, outline.map(([x, y]) => [x * width, (y - inset) / (1 - inset) * length]), thickness);
  p.vertices = p.vertices!.map(({ x, y, z }) => ({ x: across[0] * x + up[0] * y + dx / length * z, y: up[1] * y + dy / length * z, z: across[2] * x + up[2] * y + dz / length * z })); p.position = { x: root[0], y: root[1], z: root[2] }; return p;
}

export function compoundLeaf(root: Triple, direction: number, length: number, pairs: number, lobed = false): ModelPart {
  const a = direction * Math.PI / 180; const tip: Triple = [root[0] + Math.cos(a) * length, root[1] + length * 0.22, root[2] + Math.sin(a) * length]; const pieces: ModelPart[] = [needle("复叶共同叶轴", stemColor, root, tip, 0.0025)];
  for (let i = 0; i < pairs; i++) for (const side of [-1, 1]) { const t = (i + 1) / (pairs + 1); const p: Triple = [root[0] + (tip[0] - root[0]) * t, root[1] + (tip[1] - root[1]) * t, root[2] + (tip[2] - root[2]) * t]; const end: Triple = [p[0] + Math.cos(a + side * 1.2) * length * 0.3, p[1] + 0.02, p[2] + Math.sin(a + side * 1.2) * length * 0.3]; pieces.push(flatLeaf("复叶侧生小叶", p, end, length * 0.2, lobed ? "lobed" : "oval")); }
  pieces.push(flatLeaf("复叶顶生小叶", [tip[0] * 0.85 + root[0] * 0.15, tip[1], tip[2] * 0.85 + root[2] * 0.15], [tip[0] + Math.cos(a) * length * 0.2, tip[1] + 0.025, tip[2] + Math.sin(a) * length * 0.2], length * 0.22, lobed ? "lobed" : "oval")); return combineMeshes("一片完整复叶", green, pieces);
}

function organ(parts: ModelPart[], key: string, root: Triple, factor = 1) {
  const source = produceDesigns.find(entry => entry.key === key)!;
  for (const item of source.build()) { item.position = { x: root[0] + item.position.x * factor, y: root[1] + item.position.y * factor, z: root[2] + item.position.z * factor }; item.scale = { x: item.scale.x * factor, y: item.scale.y * factor, z: item.scale.z * factor }; parts.push(item); }
}

function crop(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(tapered("玉米实心节秆", stemColor, [[0, 0, 0], [0.015, 1, 0], [0, 1.9, 0]], [0.023, 0.018, 0.007]));
    for (let i = 0; i < 9; i++) { const side = i % 2 ? -1 : 1; parts.push(leaf("抱茎展开的宽玉米叶", green, [0, 0.15 + i * 0.17, 0], 0.065, 0.72 - i * 0.025, [65, i * 137.5 % 360, side * 12], "YXZ")); }
    organ(parts, "corn", [0.03, 0.65, 0], 0.8);
    for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; parts.push(beam("顶生雄穗分枝", stemColor, [0, 1.85, 0], [Math.cos(a) * 0.13, 2.06, Math.sin(a) * 0.13], 0.002)); const flowers: ModelPart[] = []; for (let j = 0; j < 7; j++) flowers.push(lobe("雄花小穗", "#c5c3a1", [Math.cos(a) * j * 0.018, 1.86 + j * 0.028, Math.sin(a) * j * 0.018], [0.011, 0.022, 0.01])); parts.push(combineMeshes("单枝雄花序", "#c5c3a1", flowers)); }
  } else if (kind === 1) {
    parts.push(tapered("甘蔗粗壮含糖茎", "#b1b695", [[0, 0, 0], [0.03, 1.2, 0], [0, 2.5, 0]], [0.036, 0.033, 0.025]));
    for (let i = 0; i < 12; i++) { const y = 0.1 + i * 0.19; parts.push(cap("突出秆面的甘蔗茎节", "#c0c3a2", [0.015, y, 0], 0.036, 0.013, 2)); if (i > 3) parts.push(leaf("甘蔗带中脉长叶", green, [0.015, y, 0], 0.045, 1.05, [62, i * 137.5 % 360, 0], "YXZ")); }
    const plume: ModelPart[] = []; for (let i = 0; i < 35; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * (0.02 + i % 5 * 0.018), 2.3 + i % 7 * 0.08, Math.sin(a) * (0.02 + i % 5 * 0.018)]; plume.push(needle("顶生银白羽状花丝", "#d1cfb4", [0, 2.28 + i % 7 * 0.06, 0], p, 0.005)); } parts.push(combineMeshes("完整羽毛状花穗", "#d1cfb4", plume));
  } else if (kind === 2) {
    parts.push(tapered("木薯木质主干", "#a9ad8d", [[0, 0, 0], [0.01, 0.75, 0], [0, 1.5, 0]], [0.025, 0.018, 0.009]));
    for (let i = 0; i < 9; i++) { const a = i * 137.5 * Math.PI / 180; const p: Triple = [Math.cos(a) * 0.23, 0.45 + i * 0.11, Math.sin(a) * 0.23]; parts.push(beam("木薯红色长叶柄", "#b0ad90", [0, p[1] - 0.06, 0], p, 0.005)); const leaflets: ModelPart[] = []; for (let j = 0; j < 7; j++) leaflets.push(leaf("掌状深裂的狭长叶片", green, p, 0.034, 0.24, [75, j * 360 / 7, 0], "YXZ")); parts.push(combineMeshes("一片完整掌状深裂木薯叶", green, leaflets)); }
  } else if (kind === 3) {
    const vine: Triple[] = Array.from({ length: 21 }, (_, i) => [Math.cos(i * 0.7) * 0.06, i * 0.055, Math.sin(i * 0.7) * 0.06]); parts.push(tube("山药缠绕的棱状藤茎", stemColor, vine, 0.004));
    for (let row = 0; row < 6; row++) for (const side of [-1, 1]) { const y = 0.12 + row * 0.16; parts.push(flatLeaf("山药对生心形叶", [0, y, 0], [side * 0.17, y + 0.04, 0.02], 0.15, "heart")); if (row < 4) parts.push(lobe("叶腋形成的山药零余子", "#b8b18e", [side * 0.045, y, 0], [0.025, 0.029, 0.025])); }
  } else if (kind === 4) {
    parts.push(tapered("番茄有棱的分枝主干", stemColor, [[0, 0, 0], [0, 0.55, 0], [0.04, 1.1, 0]], [0.012, 0.009, 0.003]));
    for (let i = 0; i < 7; i++) { const a = i * 137.5; const y = 0.16 + i * 0.12; parts.push(compoundLeaf([0, y, 0], a, 0.3, 3, true)); }
    for (const side of [-1, 1]) { const p: Triple = [side * 0.16, 0.55 + side * 0.08, 0.05]; parts.push(tube("番茄下垂果序枝", stemColor, [[0, 0.7, 0], [p[0], 0.68, 0.02], p], 0.004)); organ(parts, "tomatoTruss", p, 0.8); } parts.push(petals(5, [0.04, 1.08, 0], 0.008, 0.025, 85, "#cfc996"));
  } else if (kind === 5) {
    parts.push(tapered("茄子直立分枝茎", stemColor, [[0, 0, 0], [0, 0.75, 0]], [0.014, 0.004]));
    for (let i = 0; i < 7; i++) { const a = i * 2.4; const root: Triple = [0, 0.1 + i * 0.09, 0]; const p: Triple = [Math.cos(a) * 0.15, root[1] + 0.03, Math.sin(a) * 0.15]; parts.push(beam("茄子粗短叶柄", stemColor, root, p, 0.005), flatLeaf("茄子浅裂宽卵叶", p, [p[0] * 2.1, p[1] + 0.08, p[2] * 2.1], 0.16, "lobed")); }
    organ(parts, "eggplant", [0.13, 0.25, 0.05], 0.85); parts.push(petals(5, [-0.09, 0.6, 0.06], 0.015, 0.035, 75, "#c5c0b7"));
  } else if (kind === 6) {
    const forks: Triple[] = [[-0.16, 0.72, 0], [0.15, 0.78, 0], [0, 0.67, 0.16]];
    parts.push(beam("辣椒基部木质主茎", stemColor, [0, 0, 0], [0, 0.3, 0], 0.017));
    forks.forEach((p, axis) => { parts.push(beam("辣椒二叉伸展枝", stemColor, [0, 0.3, 0], p, 0.007)); for (let i = 0; i < 4; i++) { const t = (i + 1) / 5; const root: Triple = [p[0] * t, 0.3 + (p[1] - 0.3) * t, p[2] * t]; parts.push(leaf("辣椒全缘披针叶", green, root, 0.045, 0.13, [50, axis * 120 + i * 70, 0], "YXZ")); if (i < 3) parts.push(tapered("叶腋下垂的弯尖辣椒", "#bdad8b", [[root[0], root[1], root[2] + 0.03], [root[0] + 0.015, root[1] - 0.1, root[2] + 0.045], [root[0] + 0.03, root[1] - 0.16, root[2] + 0.025]], [0.012, 0.009, 0.001])); } parts.push(petals(5, p, 0.006, 0.014, 80, flowerColor)); });
  } else if (kind === 7 || kind === 8) {
    const pumpkin = kind === 8; const main: Triple[] = [[-0.5, 0.035, -0.1], [-0.25, 0.05, 0.02], [0, 0.045, 0], [0.3, 0.04, 0.13], [0.6, 0.045, 0.1]]; parts.push(tapered("瓜类匍匐有棱藤茎", stemColor, main, [0.006, 0.007, 0.007, 0.005, 0.002]));
    for (let i = 0; i < 8; i++) { const x = -0.4 + i * 0.13; const side = i % 2 ? -1 : 1; const p: Triple = [x, 0.18, side * 0.2]; parts.push(beam("瓜类长叶柄", green, [x, 0.045, 0.04], p, 0.005), flatLeaf(pumpkin ? "南瓜宽大五裂盾叶" : "黄瓜浅裂粗齿叶", p, [x + 0.025, 0.23, side * 0.47], pumpkin ? 0.32 : 0.2, "palm"), tapered("叶腋弹簧状卷须", light, Array.from({ length: 13 }, (_, j) => { const a = j * Math.PI / 3; return [x + Math.cos(a) * 0.008, 0.05 + j * 0.004, 0.05 + Math.sin(a) * 0.008] as Triple; }), Array.from({ length: 13 }, () => 0.001))); }
    if (pumpkin) { parts.push(lobe("南瓜藤上结出的分瓣果实", "#bdb18d", [0.2, 0.14, -0.1], [0.26, 0.26, 0.25])); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(lobe("真实分瓣瓜棱", "#bdb18d", [0.2 + Math.cos(a) * 0.075, 0.14, -0.1 + Math.sin(a) * 0.075], [0.11, 0.24, 0.11])); } } else parts.push(tapered("黄瓜藤上长圆果实", "#b5be99", [[0.17, 0.07, -0.04], [0.28, 0.055, -0.06], [0.4, 0.05, -0.04]], [0.016, 0.027, 0.009]));
    parts.push(cap("瓜类合瓣漏斗状花冠", "#d3cb9c", [-0.24, 0.07, 0.12], pumpkin ? 0.06 : 0.03, pumpkin ? 0.11 : 0.055, 3));
  } else if (kind === 9) {
    parts.push(beam("蚕豆粗壮方形主秆", stemColor, [0, 0, 0], [0, 0.85, 0], 0.014));
    for (let i = 0; i < 7; i++) { const y = 0.12 + i * 0.09; parts.push(compoundLeaf([0, y, 0], i * 137.5 % 360, 0.22, 2)); if (i < 4) for (const side of [-1, 1]) parts.push(tapered("茎上向上斜生的厚蚕豆荚", "#b9c39f", [[side * 0.015, y + 0.03, 0], [side * 0.06, y + 0.16, 0.015], [side * 0.07, y + 0.23, 0.01]], [0.009, 0.018, 0.004])); }
    for (let i = 0; i < 4; i++) parts.push(petals(5, [0.025, 0.62 + i * 0.04, 0.02], 0.009, 0.022, 50, flowerColor));
  } else if (kind === 10) {
    parts.push(tube("菜豆螺旋缠绕的藤茎", stemColor, Array.from({ length: 25 }, (_, i) => [Math.cos(i * 0.75) * 0.06, i * 0.055, Math.sin(i * 0.75) * 0.06] as Triple), 0.005));
    for (let row = 0; row < 7; row++) { const a = row * 2.4; const p: Triple = [Math.cos(a) * 0.08, 0.1 + row * 0.16, Math.sin(a) * 0.08]; parts.push(flatLeaf("菜豆较大的顶生小叶", p, [p[0] * 2, p[1] + 0.08, p[2] * 2], 0.13, "heart")); for (const side of [-1, 1]) parts.push(flatLeaf("菜豆一对侧生小叶", p, [p[0] + Math.cos(a + side) * 0.13, p[1] + 0.03, p[2] + Math.sin(a + side) * 0.13], 0.1, "heart")); if (row > 0 && row < 5) parts.push(tapered("叶腋下垂的细长菜豆荚", "#b6c19b", [[p[0], p[1], p[2]], [p[0] + 0.025, p[1] - 0.12, p[2]], [p[0] + 0.04, p[1] - 0.24, p[2] + 0.02]], [0.006, 0.009, 0.002])); }
  } else if (kind === 11) {
    for (let stem = 0; stem < 5; stem++) { const a = stem * Math.PI * 2 / 5; const p: Triple = [Math.cos(a) * 0.24, 0.1 + stem % 2 * 0.05, Math.sin(a) * 0.24]; parts.push(tapered("花生低矮横伸分枝", green, [[0, 0, 0], p], [0.005, 0.002])); for (let row = 0; row < 3; row++) { const t = (row + 1) / 4; const root: Triple = [p[0] * t, p[1] * t, p[2] * t]; const leaves: ModelPart[] = []; for (let pair = 0; pair < 2; pair++) for (const side of [-1, 1]) leaves.push(leaf("花生偶数羽状四小叶", light, [root[0], root[1] + pair * 0.015, root[2]], 0.027, 0.045, [65, stem * 72 + side * (55 + pair * 20), 0], "YXZ")); parts.push(combineMeshes("花生一片完整四小叶", light, leaves)); } parts.push(petals(5, [p[0] * 0.6, p[1] * 0.6 + 0.03, p[2] * 0.6], 0.007, 0.013, 55, "#d0c997"), tapered("花后伸至地表的果针", "#b3ae8b", [[p[0] * 0.5, 0.06, p[2] * 0.5], [p[0] * 0.6, 0.015, p[2] * 0.6], [p[0] * 0.65, 0, p[2] * 0.65]], [0.002, 0.0015, 0.001])); }
  } else if (kind === 12) {
    parts.push(beam("芝麻直立多棱茎", green, [0, 0, 0], [0, 1.15, 0], 0.012));
    for (let row = 0; row < 8; row++) for (const side of [-1, 1]) { const y = 0.1 + row * 0.12; parts.push(leaf("芝麻对生长椭圆叶", green, [0, y, 0], 0.05 * (1 - row * 0.06), 0.18 * (1 - row * 0.05), [60, side * 90, 0], "YXZ")); if (row < 5) parts.push(tapered("叶腋直立长蒴果", "#bac29c", [[side * 0.018, y + 0.025, 0], [side * 0.028, y + 0.085, 0]], [0.009, 0.006])); else { const flower = cap("芝麻叶腋钟状合瓣花", flowerColor, [side * 0.025, y, 0], 0.014, 0.04, 3); flower.rotation.z = side * 70; parts.push(flower); } }
  } else if (kind === 13) {
    parts.push(tapered("蓖麻粗壮中空主干", "#b1b092", [[0, 0, 0], [0, 1.4, 0]], [0.035, 0.01]));
    for (let i = 0; i < 8; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.32, 0.25 + i * 0.13, Math.sin(a) * 0.32]; parts.push(beam("蓖麻长叶柄", "#b5af91", [0, p[1] - 0.05, 0], p, 0.008), flatLeaf("蓖麻大掌裂锯齿叶", p, [p[0] + Math.cos(a) * 0.25, p[1] + 0.08, p[2] + Math.sin(a) * 0.25], 0.35, "palm")); }
    parts.push(beam("顶生果序轴", green, [0, 1.25, 0], [0, 1.64, 0], 0.012)); const spines: ModelPart[] = [];
    for (let i = 0; i < 15; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.04, 1.34 + i * 0.016, Math.sin(a) * 0.04]; parts.push(lobe("蓖麻三室蒴果", "#b6bb9a", p, [0.045, 0.05, 0.045])); for (let j = 0; j < 6; j++) { const b = j * Math.PI / 3; spines.push(needle("果壁真实短刺", light, [p[0] + Math.cos(b) * 0.018, p[1], p[2] + Math.sin(b) * 0.018], [p[0] + Math.cos(b) * 0.03, p[1] + 0.01, p[2] + Math.sin(b) * 0.03], 0.003)); } } for (let i = 0; i < spines.length; i += 30) parts.push(combineMeshes("单段果序刺壳", light, spines.slice(i, i + 30)));
  } else if (kind === 14) {
    parts.push(tapered("亚麻细直主茎", green, [[0, 0, 0], [0, 0.65, 0]], [0.004, 0.0015]));
    const leaves: ModelPart[] = []; for (let i = 0; i < 32; i++) leaves.push(leaf("亚麻互生线状披针叶", green, [0, 0.04 + i * 0.016, 0], 0.006, 0.05, [35, i * 137.5 % 360, 0], "YXZ")); parts.push(combineMeshes("茎上完整互生窄叶", green, leaves));
    for (let i = 0; i < 7; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.07, 0.65 + i % 3 * 0.045, Math.sin(a) * 0.07]; parts.push(beam("顶部分枝花梗", green, [0, 0.5, 0], p, 0.0018)); if (i < 4) parts.push(petals(5, p, 0.016, 0.024, 80, "#bfc7c1")); else parts.push(lobe("亚麻圆蒴果", "#c0bfa1", p, [0.016, 0.018, 0.016])); }
  } else if (kind === 15) {
    parts.push(tapered("咖啡小乔木主干", "#a1a88a", [[0, 0, 0], [0.02, 1.4, 0]], [0.035, 0.012]));
    for (let row = 0; row < 4; row++) for (const side of [-1, 1]) { const root: Triple = [0, 0.35 + row * 0.22, 0]; const tip: Triple = [side * (0.45 - row * 0.06), root[1] + 0.06, row % 2 ? 0.14 : -0.1]; parts.push(beam("咖啡水平对生结果枝", stemColor, root, tip, 0.009)); for (let node = 0; node < 3; node++) { const t = (node + 1) / 4; const p: Triple = [tip[0] * t, root[1] + 0.06 * t, tip[2] * t]; parts.push(combineMeshes("咖啡一对对生革质叶", green, [-1, 1].map(leafSide => leaf("咖啡对生革质波缘叶", green, p, 0.06, 0.18, [65, side * 90 + leafSide * 65, 0], "YXZ")))); const cherries: ModelPart[] = []; for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; cherries.push(lobe("叶腋紧簇的咖啡樱果", "#b7ad91", [p[0] + Math.cos(a) * 0.018, p[1] - 0.015, p[2] + Math.sin(a) * 0.018], [0.018, 0.024, 0.017])); } parts.push(combineMeshes("咖啡一节果簇", "#b7ad91", cherries)); } }
  } else if (kind === 16) {
    parts.push(tapered("可可树主干", "#a7aa8d", [[0, 0, 0], [0.02, 1.2, 0], [0, 2.0, 0]], [0.065, 0.04, 0.018]));
    for (let branch = 0; branch < 5; branch++) { const a = branch * Math.PI * 2 / 5; const end: Triple = [Math.cos(a) * 0.65, 1.5 + branch % 2 * 0.25, Math.sin(a) * 0.65]; parts.push(beam("可可伞状侧枝", stemColor, [0, 1.1, 0], end, 0.025)); for (let i = 0; i < 5; i++) parts.push(leaf("可可大披针形全缘叶", green, [end[0] * (0.3 + i * 0.14), 1.1 + (end[1] - 1.1) * (0.3 + i * 0.14), end[2] * (0.3 + i * 0.14)], 0.1, 0.32, [75, branch * 72 + (i % 2 ? 70 : -70), 0], "YXZ")); }
    for (let fruit = 0; fruit < 5; fruit++) { const a = fruit * 2.4; const p: Triple = [Math.cos(a) * 0.07, 0.3 + fruit * 0.21, Math.sin(a) * 0.07]; parts.push(lobe("直接着生树干的可可大果", "#bcb28d", p, [0.13, 0.25, 0.13])); const ribs: ModelPart[] = []; for (let i = 0; i < 8; i++) { const b = i * Math.PI / 4; ribs.push(tapered("可可荚纵向凸棱", "#ccc19b", [[p[0], p[1] - 0.1, p[2]], [p[0] + Math.cos(b) * 0.06, p[1], p[2] + Math.sin(b) * 0.06], [p[0], p[1] + 0.1, p[2]]], [0.0015, 0.004, 0.0015])); } parts.push(combineMeshes("一个可可果完整果棱", "#ccc19b", ribs)); }
  } else if (kind === 17) {
    parts.push(tapered("木瓜无分枝中空干", "#b4b99a", [[0, 0, 0], [0, 2.1, 0]], [0.08, 0.055]));
    for (let i = 0; i < 10; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.6, 1.85 + i % 3 * 0.17, Math.sin(a) * 0.6]; parts.push(beam("木瓜长而中空的叶柄", stemColor, [0, 2.0, 0], p, 0.018), flatLeaf("木瓜掌状深裂大叶", p, [p[0] * 1.6, p[1] + 0.1, p[2] * 1.6], 0.55, "palm")); }
    for (let i = 0; i < 9; i++) { const a = i * 2.4; parts.push(lobe("主干冠下密生的木瓜果", "#bec294", [Math.cos(a) * 0.14, 1.45 + i % 3 * 0.15, Math.sin(a) * 0.14], [0.16, 0.3, 0.17])); }
  } else if (kind === 18) {
    for (let i = 0; i < 22; i++) parts.push(leaf("菠萝硬质狭长基生叶", green, [0, 0.04, 0], 0.045, 0.7 - i % 4 * 0.08, [30 + i % 4 * 12, i * 137.5 % 360, 0], "YXZ"));
    parts.push(beam("菠萝中央粗果柄", stemColor, [0, 0, 0], [0, 0.63, 0], 0.032)); organ(parts, "pineapple", [0, 0.56, 0], 0.85);
  } else if (kind === 19) {
    parts.push(tube("草莓沿地面伸展的匍匐茎", stemColor, [[-0.3, 0.02, 0], [-0.1, 0.025, 0], [0.12, 0.03, 0.06], [0.3, 0.025, 0.03]], 0.003));
    for (let plant = 0; plant < 3; plant++) { const x = (plant - 1) * 0.22; for (let i = 0; i < 3; i++) { const a = i * 2.4; const p: Triple = [x + Math.cos(a) * 0.065, 0.16 + i * 0.02, Math.sin(a) * 0.065]; parts.push(beam("草莓直立细叶柄", green, [x, 0.025, 0], p, 0.003)); const blades: ModelPart[] = []; for (let j = -1; j <= 1; j++) blades.push(flatLeaf("三出复叶的齿状小叶", p, [p[0] + Math.cos(a + j * 0.9) * 0.07, p[1] + 0.02, p[2] + Math.sin(a + j * 0.9) * 0.07], 0.05, "lobed")); parts.push(combineMeshes("一片完整三出草莓叶", green, blades)); } organ(parts, "strawberry", [x + 0.07, 0.025, 0.07], 0.65); parts.push(petals(5, [x - 0.04, 0.13, 0.03], 0.01, 0.017, 80, flowerColor)); }
  } else if (kind === 20) {
    for (let stem = 0; stem < 4; stem++) { const x = (stem - 1.5) * 0.08; parts.push(tapered("姜由叶鞘抱成的假茎", stemColor, [[x, 0, 0], [x + 0.025, 0.9 + stem % 2 * 0.12, 0]], [0.014, 0.004])); for (let i = 0; i < 7; i++) parts.push(leaf("姜两列交替狭披针叶", green, [x + 0.025 * (0.1 + i * 0.1) / (0.9 + stem % 2 * 0.12), 0.1 + i * 0.1, 0], 0.035, 0.24, [60, i % 2 ? 90 : -90, 0], "YXZ")); }
  } else if (kind === 21) {
    for (let i = 0; i < 7; i++) parts.push(leaf("姜黄长柄宽披针基叶", green, [0, 0.02, 0], 0.13, 0.85, [15 + i % 3 * 10, i * 137.5 % 360, 0], "YXZ"));
    parts.push(beam("姜黄粗花葶", stemColor, [0, 0, 0], [0, 0.6, 0], 0.013)); for (let i = 0; i < 18; i++) { const a = i * 2.4; parts.push(leaf("螺旋叠覆的兜状花序苞片", i > 12 ? "#d2c6b8" : light, [Math.cos(a) * 0.014, 0.32 + i * 0.017, Math.sin(a) * 0.014], 0.052, 0.066, [45, i * 137.5 % 360, 0], "YXZ")); }
  } else if (kind === 22) {
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const p: Triple = [Math.cos(a) * 0.25, 0.6 + i % 3 * 0.18, Math.sin(a) * 0.25]; parts.push(tapered("芋头长而粗的叶柄", stemColor, [[0, 0, 0], p], [0.018, 0.012]), flatLeaf("芋头盾状宽心形叶", p, [p[0] * 1.8, p[1] + 0.1, p[2] * 1.8], 0.4, "heart")); }
  } else if (kind === 23) {
    parts.push(tapered("藜麦粗壮分枝茎", stemColor, [[0, 0, 0], [0, 1.15, 0]], [0.014, 0.004]));
    for (let i = 0; i < 9; i++) { const a = i * 2.4; const root: Triple = [0, 0.1 + i * 0.095, 0]; parts.push(flatLeaf("藜麦三角形浅齿叶", root, [Math.cos(a) * 0.2, root[1] + 0.06, Math.sin(a) * 0.2], 0.14 * (1 - i * 0.055), "palm")); }
    for (let branch = 0; branch < 8; branch++) { const a = branch * 2.4; const p: Triple = [Math.cos(a) * (0.09 - branch * 0.007), 0.75 + branch * 0.055, Math.sin(a) * (0.09 - branch * 0.007)]; parts.push(beam("顶生圆锥果序支轴", stemColor, [0, 0.7 + branch * 0.04, 0], p, 0.003)); const grains: ModelPart[] = []; for (let i = 0; i < 18; i++) { const b = i * 2.4; grains.push(lobe("密集团簇的藜麦籽粒", "#c6c19d", [p[0] + Math.cos(b) * 0.026, p[1] + i % 6 * 0.015, p[2] + Math.sin(b) * 0.026], [0.015, 0.02, 0.015])); } parts.push(combineMeshes("一支完整小粒果序", "#c6c19d", grains)); }
  } else if (kind === 24) {
    parts.push(tapered("荞麦曲折的节状茎", "#b0ad90", [[0, 0, 0], [0.015, 0.3, 0], [-0.005, 0.55, 0], [0.025, 0.8, 0]], [0.007, 0.005, 0.004, 0.002]));
    for (let i = 0; i < 7; i++) { const side = i % 2 ? -1 : 1; const y = 0.1 + i * 0.085; parts.push(flatLeaf("荞麦心状三角叶", [0, y, 0], [side * 0.13, y + 0.03, 0.025], 0.1, "heart")); }
    for (let i = 0; i < 9; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.095, 0.65 + i % 3 * 0.06, Math.sin(a) * 0.095]; parts.push(beam("荞麦顶端花序支梗", green, [0.015, 0.58, 0], p, 0.002), petals(5, p, 0.006, 0.011, 80, flowerColor)); const seed = polygon("花序中三棱荞麦坚果", "#a8a98a", [[0, -0.005], [-0.005, 0.004], [0.005, 0.004]], 0.005, [p[0], p[1] - 0.018, p[2]]); parts.push(seed); }
  } else if (kind === 25) {
    for (let stem = 0; stem < 3; stem++) { const x = (stem - 1) * 0.075; parts.push(tapered("薏苡粗节秆", stemColor, [[x, 0, 0], [x + 0.03, 1.2, 0]], [0.014, 0.007])); for (let i = 0; i < 6; i++) { const y = 0.12 + i * 0.15; parts.push(leaf("薏苡宽带形叶", green, [x + 0.03 * y / 1.2, y, 0], 0.055, 0.45, [60, i % 2 ? 85 : -85, 0], "YXZ")); if (i > 2) for (const side of [-1, 1]) parts.push(lobe("坚硬有光泽的泪滴状苞鞘", "#c3c5ae", [x + side * 0.04, y + 0.02, 0], [0.014, 0.021, 0.014]), needle("苞鞘中伸出的雄花小穗", "#b8b797", [x + side * 0.04, y + 0.03, 0], [x + side * 0.065, y + 0.1, 0], 0.004)); } }
  } else if (kind === 26) {
    parts.push(tapered("莴苣肥厚可食直茎", "#bcc5a0", [[0, 0, 0], [0, 0.55, 0]], [0.045, 0.025]));
    for (let i = 0; i < 15; i++) parts.push(flatLeaf("莴苣沿粗茎螺旋着生的大裂叶", [0, 0.03 + i * 0.03, 0], [Math.cos(i * 2.4) * (0.3 - i * 0.009), 0.08 + i * 0.033, Math.sin(i * 2.4) * (0.3 - i * 0.009)], 0.12 * (1 - i * 0.025), "lobed"));
  } else if (kind === 27) {
    parts.push(tapered("油菜多分枝主茎", stemColor, [[0, 0, 0], [0, 1.0, 0]], [0.014, 0.004]));
    for (let i = 0; i < 6; i++) parts.push(flatLeaf("油菜下部羽状裂叶", [0, 0.05 + i * 0.08, 0], [Math.cos(i * 2.4) * 0.25, 0.12 + i * 0.08, Math.sin(i * 2.4) * 0.25], 0.12, "lobed"));
    for (let branch = 0; branch < 5; branch++) { const a = branch * Math.PI * 2 / 5; const p: Triple = [Math.cos(a) * 0.16, 0.85 + branch % 2 * 0.1, Math.sin(a) * 0.16]; parts.push(beam("油菜总状花序支轴", green, [0, 0.6, 0], p, 0.004)); for (let i = 0; i < 4; i++) { const y = p[1] + i * 0.025; parts.push(petals(4, [p[0] + (i % 2 ? 0.018 : -0.018), y, p[2]], 0.011, 0.019, 80, "#d1cd99")); } for (let i = 0; i < 4; i++) parts.push(tapered("花序下部斜生长角果", "#bcc29d", [[p[0] * 0.7, p[1] - 0.2 + i * 0.03, p[2] * 0.7], [p[0] + 0.04, p[1] - 0.12 + i * 0.03, p[2]]], [0.0025, 0.001])); }
  } else if (kind === 28) {
    parts.push(tapered("红花坚硬的直立茎", stemColor, [[0, 0, 0], [0, 0.9, 0]], [0.009, 0.003]));
    for (let i = 0; i < 9; i++) { const a = i * 2.4; parts.push(flatLeaf("红花茎生刺齿卵叶", [0, 0.08 + i * 0.075, 0], [Math.cos(a) * 0.14, 0.1 + i * 0.075, Math.sin(a) * 0.14], 0.055, "lobed")); }
    for (let head = 0; head < 4; head++) { const a = head * Math.PI / 2; const p: Triple = [Math.cos(a) * 0.09, 0.83 + head % 2 * 0.08, Math.sin(a) * 0.09]; parts.push(beam("顶端头状花序支梗", green, [0, 0.6, 0], p, 0.004), cap("红花卵形多层总苞", light, p, 0.025, 0.04, 4)); const flowers: ModelPart[] = []; for (let i = 0; i < 16; i++) { const b = i * 2.4; flowers.push(needle("密集外伸的管状花", "#cbbd98", [p[0] + Math.cos(b) * 0.015, p[1] + 0.03, p[2] + Math.sin(b) * 0.015], [p[0] + Math.cos(b) * 0.022, p[1] + 0.075 + i % 3 * 0.005, p[2] + Math.sin(b) * 0.022], 0.0025)); } parts.push(combineMeshes("单朵红花的管状花冠群", "#cbbd98", flowers)); }
  } else {
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const p: Triple = [Math.cos(a) * 0.2, 0.3 + i % 3 * 0.1, Math.sin(a) * 0.2]; parts.push(tapered("大黄粗厚肉质长叶柄", "#b3aa90", [[0, 0, 0], p], [0.018, 0.012]), flatLeaf("大黄宽卵心形巨叶", p, [p[0] * 2, p[1] + 0.15, p[2] * 2], 0.45, "heart")); }
    parts.push(beam("大黄高举花序主轴", stemColor, [0, 0, 0], [0, 1.3, 0], 0.018));
    for (let tier = 0; tier < 7; tier++) { const flowers: ModelPart[] = []; const r = 0.16 * (1 - tier / 8); for (let i = 0; i < 18; i++) { const a = i * 2.4; flowers.push(lobe("小型密集圆锥花簇", "#d2d2b6", [Math.cos(a) * r, 0.72 + tier * 0.075 + i % 3 * 0.018, Math.sin(a) * r], [0.022, 0.03, 0.022])); } parts.push(combineMeshes("一个圆锥花序分枝层", "#d2d2b6", flowers)); }
  }
  return parts;
}

const names = [["maizePlant", "玉米植株"], ["sugarcane", "甘蔗"], ["cassava", "木薯植株"], ["yamVine", "山药藤"], ["tomatoPlant", "番茄植株"], ["eggplantPlant", "茄子植株"], ["chiliPlant", "辣椒植株"], ["cucumberVine", "黄瓜藤"], ["pumpkinVine", "南瓜藤"], ["broadBeanPlant", "蚕豆植株"], ["beanVine", "菜豆藤"], ["peanutPlant", "花生植株"], ["sesamePlant", "芝麻植株"], ["castorPlant", "蓖麻植株"], ["flaxPlant", "亚麻植株"], ["coffeePlant", "咖啡树"], ["cacaoTree", "可可树"], ["papayaPlant", "木瓜植株"], ["pineapplePlant", "菠萝植株"], ["strawberryPlant", "草莓植株"], ["gingerPlant", "姜植株"], ["turmericPlant", "姜黄植株"], ["taroPlant", "芋头植株"], ["quinoaPlant", "藜麦植株"], ["buckwheatPlant", "荞麦植株"], ["jobsTears", "薏苡"], ["stemLettuce", "莴苣"], ["oilseedRape", "油菜"], ["safflower", "红花"], ["rhubarb", "大黄"]];

export const ediblePlantDesigns: MasterNatureDesign[] = names.map(([key, name], index) => design(key!, name!, "植物", () => crop(index), ["作物完整植株与生殖器官"]));
