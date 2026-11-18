import { combineMeshes, design, lobe, part, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { pointed } from "./insectForms";

const shell = "#c4c5aa";
const mantle = "#a9b79a";
const pale = "#d1cfb7";

export function convexValve(name: string, outline: [number, number][], dome: number, thickness: number): ModelPart {
  const ring = [...outline], area = ring.reduce((sum, [x, z], i) => { const next = ring[(i + 1) % ring.length]!; return sum + x * next[1] - next[0] * z; }, 0); if (area < 0) ring.reverse();
  const vertices: { x: number; y: number; z: number }[] = [{ x: 0, y: dome, z: 0 }, { x: 0, y: dome - thickness, z: 0 }], indices: number[] = [], n = ring.length;
  for (const lower of [false, true]) for (const t of [0.52, 1]) for (const [x, z] of ring) vertices.push({ x: x * t, y: dome * (1 - t * t) - (lower ? thickness : 0), z: z * t });
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, a = 2 + i, b = 2 + j, c = a + n, d = b + n, e = a + n * 2, f = b + n * 2, g = a + n * 3, h = b + n * 3; indices.push(0, b, a, a, b, c, b, d, c, 1, e, f, e, g, f, f, g, h, c, d, g, d, h, g); }
  return part(name, "mesh", shell, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function hingeValve(p: ModelPart, angle: number, hinge: number, height: number) {
  const a = angle * Math.PI / 180; p.rotation.x = angle; p.position = { x: 0, y: height + hinge * Math.sin(a), z: hinge * (1 - Math.cos(a)) };
}

function hammerOyster(): ModelPart[] {
  const outline: [number, number][] = [[-0.1, -0.022], [-0.103, -0.002], [-0.027, 0.014], [-0.02, 0.074], [-0.027, 0.14], [-0.012, 0.159], [0.012, 0.15], [0.016, 0.086], [0.026, 0.016], [0.098, 0], [0.09, -0.019], [0.022, -0.009], [-0.019, -0.012]], parts: ModelPart[] = [];
  for (const upper of [false, true]) { const p = polygon("锤牡蛎铰合成长横梁和狭长柄的T形薄壳", shell, outline, 0.0032); p.rotation.x = upper ? -12 : 0; p.position.y = upper ? 0.008 : 0.003; parts.push(p); const ridge = tapered("锤牡蛎沿长壳柄真实隆起的增厚壳脊", pale, [[0, 0.008, 0.001], [-0.004, 0.011, 0.072], [-0.008, 0.007, 0.142]], [0.009, 0.008, 0.004]); ridge.rotation.x = p.rotation.x; ridge.position.y = p.position.y; parts.push(ridge); }
  parts.push(lobe("锤牡蛎两壳长柄内相连的柔软外套体", mantle, [0, 0.015, 0.057], [0.026, 0.025, 0.09]), tapered("锤牡蛎长横梁中央真正连续的铰合韧带", mantle, [[-0.033, 0.006, -0.005], [0.034, 0.006, -0.005]], [0.002, 0.002])); return parts;
}

function windowpane(): ModelPart[] {
  const outline: [number, number][] = Array.from({ length: 32 }, (_, i) => { const a = i * Math.PI / 16; return [Math.cos(a) * 0.054, Math.sin(a) * 0.052]; }), parts: ModelPart[] = [];
  for (const upper of [false, true]) { const p = convexValve("海月贝纸薄而近圆形的半透明平壳", outline, upper ? 0.002 : -0.001, 0.0008); p.opacity = 0.48; p.roughness = 0.38; p.position.y = upper ? 0.006 : 0.003; parts.push(p);
    for (const side of [-1, 1]) parts.push(tapered("海月贝壳内可见的V形内韧带齿脊", pale, [[side * 0.016, upper ? 0.007 : 0.003, -0.026], [0, upper ? 0.0075 : 0.0035, -0.044]], [0.0015, 0.001])); }
  parts.push(lobe("海月贝透明薄壳中可见的单个闭壳肌", mantle, [0.009, 0.0048, 0.006], [0.011, 0.003, 0.011])); return parts;
}

function saddleOyster(): ModelPart[] {
  const outline: [number, number][] = Array.from({ length: 28 }, (_, i) => { const a = i * Math.PI / 14, r = 0.026 * (1 + Math.sin(a * 5) * 0.055); return [Math.cos(a) * r, Math.sin(a) * r]; }), hole: [number, number][] = Array.from({ length: 16 }, (_, i) => [Math.cos(i * Math.PI / 8) * 0.0055, -0.011 + Math.sin(i * Math.PI / 8) * 0.008]);
  const lower = polygon("鞍牡蛎贴底平壳上真实贯通的椭圆足丝孔", shell, outline, 0.0015, [0, 0.002, 0], [hole]), upper = convexValve("鞍牡蛎与平壳不等形的拱高上壳", outline, 0.009, 0.0013); hingeValve(upper, -23, -0.022, 0.004);
  const parts: ModelPart[] = [lower, upper, lobe("鞍牡蛎两壳之间相连的外套体", mantle, [0, 0.005, 0.003], [0.033, 0.005, 0.031])], byssus: ModelPart[] = [];
  for (let i = 0; i < 8; i++) byssus.push(pointed("鞍牡蛎穿过下壳足丝孔附着的钙化足丝", pale, [[0, 0.006, -0.01], [(i - 3.5) * 0.001, 0.0004, -0.017 + i % 2 * 0.004]], [0.0007, 0])); parts.push(combineMeshes("鞍牡蛎穿孔而出的真正足丝束", pale, byssus)); return parts;
}

function flameShell(): ModelPart[] {
  const outline: [number, number][] = Array.from({ length: 24 }, (_, i) => { const a = i * Math.PI / 12; return [Math.cos(a) * 0.017 * (1 + Math.sin(a) * 0.15), Math.sin(a) * 0.027]; }), lower = convexValve("火焰锉蛤较狭的椭圆下壳", outline, -0.007, 0.001), upper = convexValve("火焰锉蛤无法完全闭拢的高凸上壳", outline, 0.009, 0.001); lower.position.y = 0.008; hingeValve(upper, -28, -0.026, 0.008);
  const parts: ModelPart[] = [lower, upper, lobe("火焰锉蛤双壳间真实外露的外套膜", mantle, [0, 0.01, 0], [0.025, 0.009, 0.04])], tentacles: ModelPart[] = [];
  for (let i = 0; i < 48; i++) { const a = i * Math.PI / 24, x = Math.cos(a) * 0.014, z = Math.sin(a) * 0.022, end: Triple = [Math.cos(a) * (0.031 + i % 4 * 0.002), 0.006 + (1 + Math.sin(i * 2.4)) * 0.006, Math.sin(a) * (0.04 + i % 3 * 0.003)]; tentacles.push(pointed("火焰锉蛤由外套缘独立伸出的细长感觉触手", pale, [[x, 0.01, z], [(x + end[0]) / 2, end[1] + 0.004, (z + end[2]) / 2], end], [0.0006, 0.00045, 0])); }
  for (let i = 0; i < tentacles.length; i += 20) parts.push(combineMeshes("火焰锉蛤双壳开隙周围完整长触手缘", pale, tentacles.slice(i, i + 20))); return parts;
}

function inequivalvePandora(): ModelPart[] {
  const outline: [number, number][] = [[-0.025, -0.009], [-0.014, -0.016], [0.002, -0.017], [0.021, -0.012], [0.04, -0.006], [0.037, 0.001], [0.025, 0.008], [0.008, 0.014], [-0.01, 0.014], [-0.023, 0.006]], lower = convexValve("潘多拉蛤薄而近乎平坦的一侧壳", outline, -0.0015, 0.0008), upper = convexValve("潘多拉蛤向一端拉成长喙而明显拱高的另一侧壳", outline, 0.010, 0.001); lower.position.y = 0.003; hingeValve(upper, -15, -0.014, 0.004);
  return [lower, upper, lobe("潘多拉蛤不等壳之间薄而侧压的软体", mantle, [0.002, 0.005, 0], [0.041, 0.0045, 0.018]), tapered("潘多拉蛤两壳背侧共同的短铰合韧带", pale, [[-0.012, 0.004, -0.013], [0.015, 0.004, -0.013]], [0.0012, 0.0012])];
}

function wateringPot(): ModelPart[] {
  const outline: [number, number][] = Array.from({ length: 24 }, (_, i) => [Math.cos(i * Math.PI / 12) * 0.022, Math.sin(i * Math.PI / 12) * 0.022]), holes: [number, number][][] = [];
  for (let i = 0; i < 25; i++) { const a = i * 2.4, r = i === 0 ? 0 : 0.004 + Math.sqrt(i / 25) * 0.014; holes.push(Array.from({ length: 6 }, (_, j) => [Math.cos(a) * r + Math.cos(j * Math.PI / 3) * 0.0012, Math.sin(a) * r + Math.sin(j * Math.PI / 3) * 0.0012])); }
  const parts: ModelPart[] = [polygon("喷壶贝前端具有真正筛孔而朝下的洒水盘", pale, outline, 0.0025, [0, 0, 0], holes), sweptProfile("喷壶贝由遗存双壳融合延长成的真实空心管体", shell, [[0.018, 0.002], [0.014, 0.016], [0.011, 0.055], [0.012, 0.112], [0.014, 0.128], [0.012, 0.128], [0.01, 0.112], [0.009, 0.055], [0.012, 0.016], [0.016, 0.002]], Math.PI * 2, 24)];
  for (const side of [-1, 1]) { parts.push(lobe("喷壶贝管体基部仍可辨认的遗存小贝壳", shell, [side * 0.016, 0.017, 0], [0.009, 0.017, 0.015])); const siphon = sweptProfile("喷壶贝顶部独立而有真实开口的软体水管", mantle, [[0.0045, 0.119], [0.004, 0.143], [0.0025, 0.143], [0.003, 0.119]], Math.PI * 2, 12); siphon.position.x = side * 0.005; parts.push(siphon); }
  return parts;
}

export const bivalveArchitectureDesigns: MasterNatureDesign[] = [
  design("hammerOyster", "锤牡蛎", "动物", hammerOyster, ["Malleus malleus", "T形铰合双壳与狭长柄脊"]),
  design("windowpaneOyster", "海月贝", "动物", windowpane, ["Placuna placenta", "纸薄透明圆壳与V形韧带脊"]),
  design("saddleOyster", "鞍牡蛎", "动物", saddleOyster, ["Anomia ephippium", "不等双壳下阀足丝孔与钙化足丝"]),
  design("flameShell", "火焰锉蛤", "动物", flameShell, ["Limaria hians", "不能紧闭的壳缘与密长感觉触手"]),
  design("pandoraClam", "潘多拉蛤", "动物", inequivalvePandora, ["Pandora inaequivalvis", "一平一凸的不等壳与后端长喙"]),
  design("wateringPotShell", "喷壶贝", "动物", wateringPot, ["Brechites vaginiferus", "双壳遗存空心管体与真正多孔前盘"]),
];
