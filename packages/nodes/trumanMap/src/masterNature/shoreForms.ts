import { Quaternion, Vector3 } from "three";
import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { hollowPipe, strip } from "./shapedFoods";
import { lump, pointed } from "./insectForms";

const skin = "#aebb9d";
const pale = "#c9cbb0";
const shell = "#b8b99b";
const dark = "#667d70";

function pipe(name: string, path: Triple[], outer: number, inner: number): ModelPart {
  const p = hollowPipe(name, path, outer, inner); p.color = pale; return p;
}

function plumes(root: Triple, count: number, height: number): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < count; i++) {
    const a = i * Math.PI * 2 / count, end: Triple = [root[0] + Math.cos(a) * height * 0.5, root[1] + height, root[2] + Math.sin(a) * height * 0.5];
    parts.push(pointed("分枝鳃羽中轴", pale, [root, end], [height * 0.06, 0]));
    const tips: ModelPart[] = [];
    for (let row = 1; row < 5; row++) for (const side of [-1, 1]) { const t = row / 5, p: Triple = [root[0] + (end[0] - root[0]) * t, root[1] + height * t, root[2] + (end[2] - root[2]) * t]; tips.push(pointed("鳃羽两侧真实小枝", pale, [p, [p[0] + Math.cos(a + side) * height * (1 - t) * 0.35, p[1] + height * 0.15, p[2] + Math.sin(a + side) * height * (1 - t) * 0.35]], [height * 0.022, 0])); }
    parts.push(combineMeshes("一枚完整分枝鳃羽", pale, tips));
  }
  return parts;
}

function sponge(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("竖琴海绵小型固着盘", skin, [0, 0.008, 0], [0.06, 0.02, 0.05]));
    for (const side of [-1, 1]) {
      parts.push(tapered("从中央向两侧水平伸出的匍匐根轴", pale, [[0, 0.012, 0], [side * 0.1, 0.022, 0], [side * 0.23, 0.04, 0]], [0.008, 0.006, 0.003]));
      for (let i = 0; i < 9; i++) { const x = side * (0.025 + i * 0.024), y = 0.014 + Math.abs(x) * 0.11, top = 0.14 + i * 0.012; parts.push(tapered("竖琴同一平面上的直立捕食丝轴", pale, [[x, y, 0], [x + side * 0.007, top, 0]], [0.0025, 0.0014]), lobe("丝轴顶端生殖膨球", skin, [x + side * 0.007, top, 0], [0.013, 0.014, 0.013])); }
    }
  } else if (kind === 1) {
    parts.push(lobe("乒乓树海绵底部固着体", skin, [0, 0.014, 0], [0.07, 0.028, 0.07]), tapered("单一直立的肉质支柱", pale, [[0, 0.012, 0], [0, 0.18, 0], [0.008, 0.34, 0]], [0.013, 0.01, 0.005]));
    for (let tier = 0; tier < 4; tier++) for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + tier * 0.7, h = 0.075 + tier * 0.064, r = 0.095 - tier * 0.011, end: Triple = [Math.cos(a) * r, h + 0.035, Math.sin(a) * r]; parts.push(tapered("三维放射状的球端侧枝", pale, [[0, h, 0], end], [0.005, 0.0028]), lobe("捕食枝末端乒乓状膨球", skin, end, [0.031, 0.031, 0.031])); }
  } else if (kind === 2) {
    const outline: [number, number][] = [[-0.055, 0], [-0.18, 0.13], [-0.28, 0.32], [-0.25, 0.53], [-0.13, 0.63], [0.02, 0.58], [0.16, 0.65], [0.29, 0.5], [0.31, 0.28], [0.18, 0.08], [0.06, 0]];
    const holes: [number, number][][] = Array.from({ length: 7 }, (_, i) => { const x = (i % 3 - 1) * 0.11, y = 0.22 + Math.floor(i / 3) * 0.12; return Array.from({ length: 7 }, (_, j) => [x + Math.cos(j * Math.PI * 2 / 7) * 0.014, y + Math.sin(j * Math.PI * 2 / 7) * 0.019] as [number, number]); });
    const fan = polygon("象耳海绵有真实出水孔的厚扇面", shell, outline, 0.023, [0, 0, 0], holes); fan.rotation.x = -90; parts.push(fan, lobe("象耳海绵短粗基柄", skin, [0, 0.02, 0], [0.15, 0.08, 0.09]));
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) parts.push(strip("扇面纵向柔和隆褶", skin, [[side * 0.035, 0.05, -0.003], [side * (0.075 + i * 0.035), 0.27, -0.008], [side * (0.06 + i * 0.05), 0.48 + i % 2 * 0.035, -0.004]], 0.013, 0.01));
  } else {
    for (let row = 0; row < 4; row++) { const path: Triple[] = Array.from({ length: 13 }, (_, i) => [Math.cos(i / 12 * Math.PI * 2) * (0.045 + row * 0.002), 0.012 + row * 0.014 + Math.sin(i * Math.PI / 3) * 0.008, Math.sin(i / 12 * Math.PI * 2) * 0.035]); parts.push(pipe("白管海绵闭合互联的空心管环", path, 0.006, 0.0034)); }
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; parts.push(pipe("贯通上下管网的分歧水道", [[Math.cos(a) * 0.045, 0.012, Math.sin(a) * 0.035], [Math.cos(a + 0.4) * 0.04, 0.04, Math.sin(a + 0.4) * 0.035], [Math.cos(a) * 0.04, 0.068, Math.sin(a) * 0.035]], 0.006, 0.0034)); }
    parts.push(pipe("管网顶部真正敞开的总出水口", [[0.01, 0.055, 0], [0.01, 0.085, 0]], 0.009, 0.005));
  }
  return parts;
}

function mollusc(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("海苹果球形海参躯体", "#b2ad9e", [0, 0.055, 0], [0.12, 0.13, 0.11]), lobe("上端收窄的口盘", skin, [0, 0.108, 0], [0.038, 0.02, 0.038]));
    parts.push(...plumes([0, 0.11, 0], 10, 0.065));
    const feet: ModelPart[] = []; for (let i = 0; i < 15; i++) { const a = i * 2.4; feet.push(lump("腹侧短管足", [Math.cos(a) * 0.034, 0.007 + i % 3 * 0.006, Math.sin(a) * 0.034], [0.009, 0.014, 0.009])); } parts.push(combineMeshes("海苹果腹侧管足", pale, feet));
  } else if (kind === 1) {
    parts.push(lobe("海柠檬宽厚椭圆足", skin, [0, 0.009, 0], [0.065, 0.018, 0.12]), lobe("海柠檬隆起而不展开成裙的外套膜", shell, [0, 0.025, 0], [0.075, 0.045, 0.125]));
    const bumps: ModelPart[] = []; for (let i = 0; i < 28; i++) { const a = i * 2.4, r = Math.sqrt((i + 0.5) / 29), x = Math.cos(a) * 0.029 * r, z = Math.sin(a) * 0.05 * r; bumps.push(lump("背面圆钝疣粒", [x, 0.025 + Math.sqrt(1 - r * r * 0.75) * 0.019, z], [0.006, 0.006, 0.006], pale)); } parts.push(combineMeshes("分布在外套膜上的独立疣粒", pale, bumps), ...plumes([0, 0.04, -0.028], 6, 0.018));
    for (const side of [-1, 1]) parts.push(tapered("前端短棒嗅角", pale, [[side * 0.014, 0.034, 0.033], [side * 0.015, 0.063, 0.035]], [0.004, 0.002]));
  } else if (kind === 2) {
    parts.push(lobe("侧鳃蛞蝓宽椭圆足", skin, [0, 0.012, 0], [0.12, 0.025, 0.19]), lobe("覆盖背部的穹形外套", shell, [0, 0.039, -0.006], [0.105, 0.058, 0.145]));
    const gills: ModelPart[] = []; for (let i = 0; i < 13; i++) gills.push(leaf("右侧外套下的梳状鳃小叶", pale, [0.044, 0.022, -0.052 + i * 0.0075], 0.009, 0.029 - Math.abs(i - 6) * 0.0015, [10, -90, -45])); parts.push(combineMeshes("仅在右侧可见的一条羽状侧鳃", pale, gills));
    for (const side of [-1, 1]) parts.push(pipe("前端卷成筒的嗅角", [[side * 0.018, 0.034, 0.058], [side * 0.025, 0.064, 0.074]], 0.006, 0.003), leaf("头部口帆的侧叶", skin, [side * 0.018, 0.02, 0.072], 0.035, 0.055, [85, -side * 35, 0]));
  } else if (kind === 3) {
    parts.push(lobe("伞螺巨大的疣状外足", skin, [0, 0.028, 0], [0.18, 0.055, 0.22]));
    const roof = cap("背部远小于足的扁伞形石灰壳", pale, [0, 0.049, -0.008], 0.047, 0.013, 0); roof.scale.z = 1.3; parts.push(roof);
    for (let i = 0; i < 32; i++) { const a = i * 2.4, r = 0.055 + i % 3 * 0.009; parts.push(lump("外露足边的大疣状突起", [Math.cos(a) * r, 0.043 - i % 3 * 0.005, Math.sin(a) * r * 1.2], [0.016, 0.014, 0.016])); }
    for (const side of [-1, 1]) parts.push(pipe("前方粗短的纵卷触角", [[side * 0.029, 0.032, 0.079], [side * 0.041, 0.057, 0.103]], 0.009, 0.005));
  } else if (kind === 4) {
    parts.push(tapered("瓣背海蛞蝓侧扁而高的躯干", skin, [[0, 0.013, -0.04], [0, 0.023, 0], [0, 0.026, 0.035]], [0.002, 0.011, 0.008]));
    for (const side of [-1, 1]) {
      for (const z of [-0.014, 0.017]) { const flap = polygon("两对大型叶状背侧瓣", shell, [[0, 0], [side * 0.015, 0.012], [side * 0.026, 0.042], [side * 0.01, 0.039], [side * 0.004, 0.017]], 0.002); flap.rotation.x = -90; flap.position.z = z; flap.position.y = 0.02; parts.push(flap); }
      parts.push(tapered("前端高起的嗅角鞘", pale, [[side * 0.004, 0.025, 0.028], [side * 0.009, 0.061, 0.032]], [0.004, 0.002]));
    }
    parts.push(strip("腹面狭长的附着足", pale, [[0, 0.006, -0.037], [0, 0.006, 0.038]], 0.01, 0.006));
  } else {
    parts.push(lobe("玫瑰肋螺伸展的大腹足", skin, [0, 0.008, 0], [0.08, 0.016, 0.105]));
    const p = sweptProfile("玫瑰肋螺薄而低螺塔的球壳", pale, [[0.021, 0], [0.035, 0.012], [0.031, 0.04], [0.009, 0.05], [0.009, 0.047], [0.028, 0.038], [0.032, 0.013], [0.019, 0.002]], Math.PI * 1.63, 24); p.position.y = 0.014; p.position.z = -0.015; parts.push(p);
    for (const side of [-1, 1]) { const path: Triple[] = Array.from({ length: 17 }, (_, i) => { const t = i / 16; return [side * (0.032 + Math.sin(t * Math.PI) * 0.022), 0.015 + Math.sin(t * Math.PI * 5) * 0.007, -0.05 + t * 0.11]; }); parts.push(strip("超出螺壳两侧的真实褶皱侧足裙", "#b9b3b3", path, 0.018, 0.0025), pipe("前方卷起的头盾触角", [[side * 0.012, 0.015, 0.038], [side * 0.018, 0.032, 0.052]], 0.004, 0.002)); }
  }
  return parts;
}

function slitTube(path: Triple[], outer = 0.0075, inner = 0.005): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], count = 15, rowWidth = count * 2;
  for (let row = 0; row < path.length; row++) { const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...path[Math.min(row + 1, path.length - 1)]!).sub(new Vector3(...path[Math.max(0, row - 1)]!)).normalize());
    for (const r of [outer, inner]) for (let i = 0; i < count; i++) { const a = 0.22 + i / (count - 1) * (Math.PI * 2 - 0.44); const p = new Vector3(Math.cos(a) * r, 0, Math.sin(a) * r).applyQuaternion(q).add(new Vector3(...path[row]!)); vertices.push({ x: p.x, y: p.y, z: p.z }); }
    if (!row) continue;
    const previous = (row - 1) * rowWidth, current = row * rowWidth;
    for (let i = 0; i < count - 1; i++) { const a = previous + i, b = a + 1, c = current + i, d = c + 1; indices.push(a, c, b, b, c, d, a + count, b + count, c + count, b + count, d + count, c + count); }
    for (const i of [0, count - 1]) { const a = previous + i, b = current + i; if (i) indices.push(a, b, a + count, a + count, b, b + count); else indices.push(a, a + count, b, a + count, b + count, b); }
  }
  for (let i = 0; i < count - 1; i++) { const end = (path.length - 1) * rowWidth, j = i + 1; indices.push(i, j, i + count, j, j + count, i + count, end + i, end + i + count, end + j, end + j, end + i + count, end + j + count); }
  return part("裂管螺沿整条卷曲壳管保持开放的纵裂缝", "mesh", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function shellForm(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    const path: Triple[] = Array.from({ length: 16 }, (_, i) => { const a = i / 15 * Math.PI * 4, r = 0.007 + i * 0.002; return [Math.cos(a) * r, 0.011 + i * 0.002, Math.sin(a) * r]; }); parts.push(slitTube(path));
    for (let i = 0; i < 7; i++) { const p = path[i * 2 + 1]!, previous = path[i * 2]!, next = path[i * 2 + 2]!; const direction = new Vector3(...next).sub(new Vector3(...previous)).normalize().multiplyScalar(0.0008); const collar = slitTube([[p[0] - direction.x, p[1] - direction.y, p[2] - direction.z], [p[0] + direction.x, p[1] + direction.y, p[2] + direction.z]], 0.0085, 0.007); collar.name = "保持纵裂缝开放的横向生长肋"; collar.color = shell; parts.push(collar); }
  } else if (kind === 1) {
    const p = sweptProfile("钥孔帽贝从顶部贯穿到壳下的呼吸孔", pale, [[0.05, 0], [0.045, 0.012], [0.027, 0.037], [0.007, 0.048], [0.005, 0.045], [0.024, 0.034], [0.043, 0.01], [0.047, 0]], Math.PI * 2, 24); p.scale.z = 1.3; parts.push(p);
    for (let i = 0; i < 18; i++) { const a = i * Math.PI / 9; parts.push(tapered("钥孔帽贝放射状壳肋", shell, [[Math.cos(a) * 0.008, 0.047, Math.sin(a) * 0.0104], [Math.cos(a) * 0.029, 0.035, Math.sin(a) * 0.0377], [Math.cos(a) * 0.049, 0.002, Math.sin(a) * 0.0637]], [0.0012, 0.002, 0.0015])); }
  } else {
    const p = sweptProfile("舟螺斜帽形壳体的真实腹面大开口", pale, [[0.035, 0], [0.037, 0.009], [0.021, 0.025], [0, 0.028], [0, 0.025], [0.019, 0.022], [0.034, 0.008], [0.032, 0]], Math.PI * 2, 24); p.scale.z = 1.6; p.rotation.x = 165; p.position.y = 0.038; parts.push(p);
    parts.push(polygon("舟螺壳口内部只占后半的甲板状隔板", shell, [[-0.03, -0.045], [0.03, -0.045], [0.033, -0.012], [0.024, 0.006], [-0.022, 0.009], [-0.032, -0.009]], 0.0028, [0, 0.031, 0]));
    for (let i = 0; i < 8; i++) parts.push(tapered("舟形壳顶弧状生长纹", shell, [[-0.024 + i * 0.0065, 0.021, -0.039], [-0.027 + i * 0.0072, 0.012, 0.006], [-0.021 + i * 0.0056, 0.022, 0.041]], [0.001, 0.0012, 0.001]));
  }
  return parts;
}

function phronima(): ModelPart[] {
  const parts: ModelPart[] = [lump("樽蛃高大透明的头部", [0, 0.026, 0.01], [0.012, 0.022, 0.014]), pointed("与头部明显分离的细弯分节腹部", skin, [[0, 0.017, 0.006], [0, 0.012, -0.012], [0, 0.017, -0.021]], [0.003, 0.0035, 0])]; parts[0]!.opacity = 0.45;
  for (const side of [-1, 1]) {
    parts.push(lump("向上观察的巨大内侧复眼", [side * 0.0027, 0.032, 0.011], [0.0044, 0.01, 0.006], dark), lump("头部两侧另具侧眼", [side * 0.005, 0.025, 0.014], [0.003, 0.003, 0.003], dark));
    for (let i = 0; i < 5; i++) { const z = 0.006 - i * 0.004, length = i === 4 ? 0.016 : 0.009; const end: Triple = [side * length, 0.019 + i * 0.002, z + 0.003]; parts.push(pointed("樽蛃分节抓握胸足", pale, [[side * 0.002, 0.016, z], [side * length * 0.8, 0.009, z], end], [0.0008, 0.0006, 0])); if (i === 4) parts.push(lump("后胸足末端特别膨大的钳掌", end, [0.005, 0.007, 0.003]), pointed("末端回折抓握钩", dark, [end, [end[0] - side * 0.004, end[1] + 0.006, end[2]]], [0.0006, 0])); }
    for (let i = 0; i < 3; i++) parts.push(leaf("后腹部游泳足", pale, [side * 0.002, 0.014, -0.01 - i * 0.004], 0.003, 0.009, [70, side * 60, 0]));
  }
  return parts;
}

function crabClaw(parts: ModelPart[], root: Triple, end: Triple, size: number, flat = false) {
  const elbow: Triple = [end[0] * 1.1, root[1] * 0.75, (root[2] + end[2]) * 0.5]; parts.push(tapered("螯足相连的腕肘", shell, [root, elbow, end], [size * 0.18, size * 0.2, size * 0.16]), lobe("螯掌", pale, end, [size * (flat ? 1 : 0.8), size * (flat ? 0.75 : 0.55), size * 0.58]));
  const f = end[2] + size * 0.35; for (const side of [-1, 1]) parts.push(pointed("有张口间隙的钳指", shell, [[end[0] + side * size * 0.2, end[1], f], [end[0] + side * size * 0.13, end[1], f + size * 0.45], [end[0] + side * size * 0.035, end[1], f + size * 0.57]], [size * 0.12, size * 0.055, 0]));
}

function crabs(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(polygon("招潮蟹前宽后窄的近方形甲壳", skin, [[-0.024, -0.015], [0.024, -0.015], [0.03, 0.017], [-0.03, 0.017]], 0.018, [0, 0.019, 0]));
    for (const side of [-1, 1]) { parts.push(tapered("长而竖起的招潮蟹眼柄", shell, [[side * 0.012, 0.033, 0.013], [side * 0.018, 0.064, 0.018]], [0.0018, 0.0012]), lump("眼柄顶端球眼", [side * 0.018, 0.065, 0.018], [0.005, 0.007, 0.005], dark)); for (let i = 0; i < 4; i++) parts.push(pointed("招潮蟹横行的四对步足", skin, [[side * 0.022, 0.024, 0.012 - i * 0.008], [side * 0.057, 0.029, 0.021 - i * 0.014], [side * 0.063, 0.002, 0.024 - i * 0.018]], [0.003, 0.002, 0])); }
    crabClaw(parts, [-0.022, 0.025, 0.013], [-0.047, 0.047, 0.06], 0.063); crabClaw(parts, [0.022, 0.025, 0.013], [0.035, 0.018, 0.037], 0.013);
  } else if (kind === 1) {
    parts.push(lobe("羞面蟹后部横扩的高穹头胸甲", shell, [0, 0.055, -0.008], [0.14, 0.12, 0.13]));
    for (const side of [-1, 1]) { const palm = polygon("两片竖起并在脸前合围的扁大螯掌", pale, [[0, 0], [side * 0.048, 0], [side * 0.06, 0.025], [side * 0.036, 0.073], [side * 0.009, 0.068]], 0.014); palm.rotation.x = -90; palm.position.y = 0.013; palm.position.z = 0.06; parts.push(palm, tapered("面罩螯掌与身体相连的折叠腕节", shell, [[side * 0.044, 0.045, 0.014], [side * 0.06, 0.025, 0.036], [side * 0.028, 0.032, 0.062]], [0.012, 0.015, 0.01])); for (let i = 0; i < 4; i++) parts.push(pointed("甲壳侧下方短而收拢的步足", skin, [[side * 0.052, 0.027, 0.023 - i * 0.02], [side * 0.086, 0.022, 0.014 - i * 0.018], [side * 0.083, 0.002, -i * 0.02]], [0.006, 0.004, 0])); for (let i = 0; i < 5; i++) parts.push(needle("后侧甲缘扁齿", pale, [side * 0.054, 0.04, -0.015 - i * 0.01], [side * 0.074, 0.037, -0.015 - i * 0.011], 0.008)); }
  } else if (kind === 2) {
    const body = polygon("箭蟹尖窄三角形头胸甲", shell, [[-0.014, -0.016], [0.014, -0.016], [0.008, 0.014], [0, 0.032], [-0.008, 0.014]], 0.022, [0, 0.071, 0]); parts.push(body, pointed("箭蟹远长于头部的锯齿状针吻", pale, [[0, 0.09, 0.025], [0, 0.105, 0.09]], [0.004, 0]));
    for (const side of [-1, 1]) { for (let i = 0; i < 4; i++) parts.push(pointed("箭蟹极细而高拱的丝状步足", skin, [[side * 0.008, 0.077, 0.012 - i * 0.008], [side * (0.085 + i % 2 * 0.025), 0.12, 0.07 - i * 0.046], [side * (0.115 + i % 2 * 0.02), 0.001, 0.12 - i * 0.075]], [0.0023, 0.0016, 0])); crabClaw(parts, [side * 0.008, 0.075, 0.018], [side * 0.04, 0.056, 0.074], 0.012); parts.push(lump("针吻两侧小眼", [side * 0.008, 0.092, 0.026], [0.004, 0.004, 0.004], dark)); }
  } else {
    parts.push(polygon("帝王蟹后宽前窄的三角形底甲", shell, [[-0.18, -0.12], [0.18, -0.12], [0.14, 0.1], [0.045, 0.18], [-0.045, 0.18], [-0.14, 0.1]], 0.065, [0, 0.13, 0]), lobe("头胸甲隆起的中央胃区", skin, [0, 0.2, 0], [0.28, 0.12, 0.28]));
    for (const side of [-1, 1]) { for (let i = 0; i < 3; i++) parts.push(pointed("帝王蟹仅三对外露长步足", shell, [[side * 0.13, 0.17, 0.075 - i * 0.09], [side * 0.4, 0.25, 0.2 - i * 0.22], [side * 0.56, 0.012, 0.28 - i * 0.3]], [0.023, 0.017, 0])); crabClaw(parts, [side * 0.09, 0.17, 0.13], [side * 0.26, 0.12, 0.29], side > 0 ? 0.14 : 0.105); parts.push(pointed("藏在腹后的小型第五对清洁足", skin, [[side * 0.12, 0.14, -0.07], [side * 0.105, 0.11, -0.12], [side * 0.07, 0.135, -0.14]], [0.006, 0.004, 0])); }
    const spines: ModelPart[] = []; for (let i = 0; i < 24; i++) { const a = i * 2.4, r = 0.03 + i % 4 * 0.025; spines.push(needle("甲面硬棘", pale, [Math.cos(a) * r, 0.22, Math.sin(a) * r], [Math.cos(a) * r * 1.1, 0.255 + i % 2 * 0.012, Math.sin(a) * r * 1.1], 0.016)); } parts.push(combineMeshes("帝王蟹分区棘甲", pale, spines));
  }
  return parts;
}

function reptiles(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("恒河鳄修长而低的躯体", skin, [0, 0.3, 0], [0.72, 0.48, 1.9]), tapered("强壮侧扁而非圆棒的推进长尾", shell, [[0, 0.31, -0.65], [0.1, 0.2, -1.5], [0.2, 0.065, -2.4]], [0.23, 0.13, 0.015]), lobe("高位眼眶与后脑", shell, [0, 0.38, 0.95], [0.34, 0.29, 0.45]), tapered("恒河鳄长而纤细的上下颌吻", shell, [[0, 0.3, 0.98], [0, 0.27, 1.54], [0, 0.27, 2.1]], [0.105, 0.061, 0.046]), lobe("成年雄鳄鼻端的鳄球", pale, [0, 0.32, 2.08], [0.15, 0.13, 0.14]));
    for (const side of [-1, 1]) {
      parts.push(lobe("背侧高位鳄眼", dark, [side * 0.1, 0.49, 1.04], [0.045, 0.04, 0.045]));
      for (const z of [-0.55, 0.58]) { const foot: Triple = [side * 0.5, 0.047, z + (z > 0 ? 0.18 : -0.14)]; parts.push(tapered("贴地外展的鳄肢", skin, [[side * 0.23, 0.28, z], [side * 0.48, 0.13, z - 0.08], foot], [0.075, 0.05, 0.024]), lobe("具蹼的长足", shell, foot, [0.17, 0.08, 0.23])); for (let toe = 0; toe < 3; toe++) parts.push(pointed("足趾", pale, [[foot[0] + (toe - 1) * 0.04, foot[1], foot[2]], [foot[0] + (toe - 1) * 0.06, 0.017, foot[2] + 0.17]], [0.012, 0])); }
      const teeth: ModelPart[] = []; for (let i = 0; i < 22; i++) teeth.push(needle("细吻两侧交错外露的针形齿", pale, [side * (0.087 - i * 0.0019), 0.27, 1.08 + i * 0.044], [side * (0.09 - i * 0.0019), 0.313 - i % 2 * 0.012, 1.08 + i * 0.044], 0.012)); parts.push(combineMeshes("细长颌边连续齿列", pale, teeth));
    }
    for (let i = 0; i < 12; i++) { const ridge = polygon("背部到尾部的竖直鳞脊", shell, [[-0.04, 0], [0.04, 0], [0.026, 0.07], [-0.015, 0.09]], 0.035, [0, 0.46 - i * 0.023, 0.45 - i * 0.21]); ridge.rotation.x = -90; parts.push(ridge); }
  } else {
    parts.push(lobe("平胸龟扁低的长椭圆背甲", shell, [0, 0.07, 0], [0.15, 0.09, 0.23]), polygon("几乎与背甲同宽的三角形硬大头", skin, [[-0.054, 0.07], [0.054, 0.07], [0.043, 0.14], [0, 0.183], [-0.043, 0.14]], 0.063, [0, 0.043, 0]), needle("强烈下钩的角质喙", pale, [0, 0.091, 0.168], [0, 0.049, 0.195], 0.024), pointed("平胸龟长于背甲的肌肉尾", skin, [[0, 0.061, -0.09], [0.022, 0.04, -0.22], [0.035, 0.012, -0.36]], [0.025, 0.014, 0]));
    for (const side of [-1, 1]) { parts.push(lump("大头两侧的眼睛", [side * 0.044, 0.09, 0.137], [0.012, 0.012, 0.012], dark)); for (const z of [-0.065, 0.065]) { const end: Triple = [side * 0.092, 0.014, z + 0.024]; parts.push(tapered("攀爬用有力短肢", skin, [[side * 0.052, 0.055, z], [side * 0.083, 0.035, z - 0.012], end], [0.015, 0.012, 0.009])); for (let i = 0; i < 3; i++) parts.push(pointed("攀岩弯爪", pale, [[end[0] + (i - 1) * 0.008, end[1], end[2]], [end[0] + (i - 1) * 0.011, 0.012, end[2] + 0.025], [end[0] + (i - 1) * 0.011, 0.002, end[2] + 0.029]], [0.003, 0.002, 0])); } }
    for (let i = 0; i < 9; i++) parts.push(needle("尾部锯齿状鳞脊", pale, [i * 0.003, 0.069 - i * 0.005, -0.11 - i * 0.025], [i * 0.003, 0.084 - i * 0.006, -0.11 - i * 0.025], 0.014));
  }
  return parts;
}

export const shoreFormDesigns: MasterNatureDesign[] = [
  design("harpSponge", "竖琴海绵", "动物", () => sponge(0), ["Chondrocladia lyra", "肉食海绵", "平面琴弦枝"]),
  design("pingPongSponge", "乒乓树海绵", "动物", () => sponge(1), ["Chondrocladia lampadiglobus", "球端放射枝"]),
  design("elephantEarSponge", "象耳海绵", "动物", () => sponge(2), ["Ianthella basta", "厚扇状体"]),
  design("clathrina", "管网钙海绵", "动物", () => sponge(3), ["Clathrina clathrus", "互联空心管网"]),
  design("seaApple", "海苹果", "动物", () => mollusc(0), ["Pseudocolochirus violaceus", "球形海参"]),
  design("seaLemon", "海柠檬", "动物", () => mollusc(1), ["Peltodoris nobilis", "疣状外套", "后端鳃冠"]),
  design("sidegillSlug", "侧鳃海蛞蝓", "动物", () => mollusc(2), ["Pleurobranchus", "单侧鳃"]),
  design("umbrellaSlug", "伞螺", "动物", () => mollusc(3), ["Umbraculum umbraculum", "小背壳大腹足"]),
  design("sargassumSlug", "瓣背海蛞蝓", "动物", () => mollusc(4), ["Scyllaea pelagica", "两对叶状背突"]),
  design("rosePetalShell", "玫瑰肋螺", "动物", () => mollusc(5), ["Hydatina physis", "褶皱侧足"]),
  design("slitWormShell", "裂管螺", "动物", () => shellForm(0), ["Siliquaria", "连续纵裂口"]),
  design("keyholeLimpet", "钥孔帽贝", "动物", () => shellForm(1), ["Fissurella", "壳顶贯穿孔"]),
  design("slipperLimpet", "舟螺", "动物", () => shellForm(2), ["Crepidula fornicata", "壳内甲板"]),
  design("phronima", "樽蛃", "动物", phronima, ["Phronima sedentaria", "双重复眼"]),
  design("fiddlerCrab", "招潮蟹", "动物", () => crabs(0), ["Uca", "竖眼柄", "异形螯"]),
  design("boxCrab", "羞面蟹", "动物", () => crabs(1), ["Calappa", "面罩螯掌"]),
  design("arrowCrab", "箭蟹", "动物", () => crabs(2), ["Stenorhynchus seticornis", "尖吻丝状腿"]),
  design("redKingCrab", "帝王蟹", "动物", () => crabs(3), ["Paralithodes camtschaticus", "三对外露步足"]),
  design("gharial", "恒河鳄", "动物", () => reptiles(0), ["Gavialis gangeticus", "纤细齿吻", "鼻端鳄球"]),
  design("bigHeadedTurtle", "平胸龟", "动物", () => reptiles(1), ["Platysternon megacephalum", "长尾大头钩喙"]),
];
