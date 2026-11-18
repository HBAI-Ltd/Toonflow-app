import { cap, combineMeshes, design, lobe, needle, part, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { pointed } from "./insectForms";

const cream = "#d0cdb4";
const flesh = "#c4bea2";
const brown = "#aaa28a";

export function fanCap(name: string, root: Triple, length: number, width: number, thickness: number, rise: number): ModelPart {
  const outline: [number, number][] = [[0, 0], [-0.27, -0.07], [-0.43, 0.15], [-0.5, 0.48], [-0.38, 0.79], [-0.2, 0.95], [0, 1], [0.2, 0.95], [0.38, 0.79], [0.5, 0.48], [0.43, 0.15], [0.27, -0.07]], p = polygon(name, flesh, outline.map(([x, z]) => [x * width, z * length]), thickness, root);
  p.vertices = p.vertices!.map(v => ({ ...v, y: v.y + Math.sin(v.z / length * Math.PI) * rise })); return p;
}

export function gillWall(name: string, color: string, path: Triple[], thickness: number, depth: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let row = 0; row < path.length; row++) { const p = path[row]!, prev = path[Math.max(0, row - 1)]!, next = path[Math.min(path.length - 1, row + 1)]!, dx = next[0] - prev[0], dz = next[2] - prev[2], horizontal = Math.hypot(dx, dz), nx = -dz / horizontal * thickness / 2, nz = dx / horizontal * thickness / 2; vertices.push({ x: p[0] - nx, y: p[1], z: p[2] - nz }, { x: p[0] + nx, y: p[1], z: p[2] + nz }, { x: p[0] + nx, y: p[1] - depth, z: p[2] + nz }, { x: p[0] - nx, y: p[1] - depth, z: p[2] - nz }); if (row) for (let side = 0; side < 4; side++) { const a = (row - 1) * 4 + side, b = (row - 1) * 4 + (side + 1) % 4; indices.push(a, b, a + 4, b, b + 4, a + 4); } }
  const end = (path.length - 1) * 4; indices.push(0, 2, 1, 0, 3, 2, end, end + 1, end + 2, end, end + 2, end + 3); return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function bolete(): ModelPart[] {
  const parts: ModelPart[] = [sweptProfile("美味牛肝菌基部膨大而上端收细的实心肉质柄", flesh, [[0, 0], [0.02, 0], [0.027, 0.017], [0.022, 0.055], [0.015, 0.099], [0, 0.099]], Math.PI * 2, 20), cap("美味牛肝菌宽凸而厚肉质的菌盖", brown, [0, 0.095, 0], 0.066, 0.038, 0)];
  const outline: [number, number][] = Array.from({ length: 24 }, (_, i) => [Math.cos(i * Math.PI / 12) * 0.059, Math.sin(i * Math.PI / 12) * 0.059]), holes: [number, number][][] = [];
  for (let pore = 0; pore < 24; pore++) { const a = pore * 2.4, r = 0.009 + Math.sqrt(pore / 24) * 0.038; holes.push(Array.from({ length: 6 }, (_, i) => { const b = i * Math.PI / 3; return [Math.cos(a) * r + Math.cos(b) * 0.0017, Math.sin(a) * r + Math.sin(b) * 0.0017] as [number, number]; })); }
  parts.push(polygon("牛肝菌盖下具有真实贯通短管孔的厚菌管层", cream, outline, 0.009, [0, 0.095, 0], holes));
  for (const winding of [-1, 1]) for (let line = 0; line < 6; line++) { const path: Triple[] = Array.from({ length: 7 }, (_, row) => { const y = 0.021 + row * 0.011, r = y < 0.055 ? 0.027 - (y - 0.017) / 0.038 * 0.005 : 0.022 - (y - 0.055) / 0.044 * 0.007, a = line * Math.PI / 3 + winding * row * 0.22; return [Math.cos(a) * r * 0.95, y, Math.sin(a) * r * 0.95]; }); parts.push(tapered("牛肝菌柄表面实际交叉凸起的细网纹", cream, path, path.map(() => 0.00075))); }
  return parts;
}

function milkcap(): ModelPart[] {
  const parts: ModelPart[] = [sweptProfile("松乳菇内有真实空腔的圆柄", flesh, [[0.011, 0], [0.012, 0.01], [0.009, 0.08], [0.004, 0.08], [0.0055, 0.01], [0.005, 0]], Math.PI * 2, 16), sweptProfile("松乳菇中央下凹且厚唇内卷的漏斗形肉盖", "#b8ae91", [[0.008, 0.075], [0.031, 0.08], [0.057, 0.082], [0.065, 0.086], [0.062, 0.092], [0.051, 0.089], [0.03, 0.086], [0.008, 0.081]], Math.PI * 2, 24)];
  const gills: ModelPart[] = [];
  for (let i = 0; i < 26; i++) { const a = i * Math.PI * 2 / 26, path: Triple[] = [[Math.cos(a) * 0.008, 0.076, Math.sin(a) * 0.008], [Math.cos(a) * 0.027, 0.081, Math.sin(a) * 0.027], [Math.cos(a) * 0.059, 0.086, Math.sin(a) * 0.059]]; gills.push(gillWall("松乳菇由盖下连续下延到柄上的薄密菌褶", "#c1b69b", path, 0.00055, 0.003)); }
  parts.push(combineMeshes("松乳菇每片彼此分离并下延的真正菌褶", "#c1b69b", gills), lobe("松乳菇一处褶缘自然渗出的乳汁滴", cream, [0.052, 0.0834, 0.026], [0.0022, 0.003, 0.0022])); return parts;
}

function hedgehog(): ModelPart[] {
  const parts: ModelPart[] = [tapered("刺蘑稍偏心而粗短的实心柄", flesh, [[-0.009, 0, 0], [-0.006, 0.034, 0], [0, 0.066, 0]], [0.013, 0.012, 0.009])], top = sweptProfile("刺蘑宽阔但边缘真实波曲的肉质菌盖", flesh, [[0, 0.0792], [0.033, 0.0774], [0.06, 0.0657], [0.054, 0.063], [0.015, 0.0666], [0, 0.0675]], Math.PI * 2, 32);
  top.vertices = top.vertices!.map(v => { const r = Math.hypot(v.x, v.z), a = Math.atan2(v.z, v.x), wave = Math.sin(a * 5 + 0.3) * Math.pow(r / 0.06, 3); return { x: v.x * (1 + wave * 0.045), y: v.y + wave * 0.0015, z: v.z * (1 + wave * 0.045) }; }); parts.push(top);
  const teeth: ModelPart[] = [];
  for (let i = 0; i < 100; i++) { const a = i * 2.4, r = 0.012 + Math.sqrt(i / 100) * 0.041, wave = Math.sin(a * 5 + 0.3) * Math.pow(r / 0.06, 3), radius = r * (1 + wave * 0.045), y = 0.063 + Math.min(1, (0.054 - r) / 0.039) * 0.0036 + wave * 0.0015 + 0.00035, root: Triple = [Math.cos(a) * radius, y, Math.sin(a) * radius]; teeth.push(pointed("刺蘑盖下密生而非辐射薄褶的柔软圆锥齿", cream, [root, [root[0], y - 0.004 - i % 3 * 0.0005, root[2]]], [0.0007, 0])); }
  for (let i = 0; i < teeth.length; i += 25) parts.push(combineMeshes("刺蘑盖下真实分离的一整片软齿", cream, teeth.slice(i, i + 25))); return parts;
}

function jellyTooth(): ModelPart[] {
  const top = fanCap("假齿菌带圆钝前缘的胶质舌状盖", [-0.004, 0.023, 0], 0.037, 0.043, 0.0045, 0.003), parts: ModelPart[] = [tapered("假齿菌偏生而短粗的胶质柄", cream, [[-0.012, 0, 0], [-0.009, 0.019, 0], [-0.004, 0.026, 0]], [0.005, 0.006, 0.004]), top], teeth: ModelPart[] = [];
  for (let i = 0; i < 36; i++) { const z = 0.005 + Math.floor(i / 6) * 0.0047, x = (i % 6 - 2.5) * 0.004, y = 0.023 + Math.sin(z / 0.037 * Math.PI) * 0.003, root: Triple = [x - 0.004, y + 0.0003, z]; teeth.push(pointed("假齿菌舌盖下短于两毫米的软齿", cream, [root, [root[0], y - 0.0015, root[2]]], [0.0004, 0])); }
  parts.push(combineMeshes("假齿菌舌盖下真正独立而下垂的细齿", cream, teeth)); for (const p of parts) { p.opacity = 0.77; p.roughness = 0.38; } return parts;
}

function earPick(): ModelPart[] {
  const top = fanCap("耳匙菌小型偏心肾形盖", [0, 0.034, 0], 0.013, 0.018, 0.0015, 0.001), parts: ModelPart[] = [tapered("耳匙菌从一侧连接菌盖的细硬毛柄", brown, [[0, 0, 0], [-0.001, 0.021, 0], [0, 0.035, 0]], [0.0012, 0.001, 0.0008]), top], hairs: ModelPart[] = [], teeth: ModelPart[] = [];
  for (let i = 0; i < 28; i++) { const a = i * 2.4, y = 0.003 + i % 7 * 0.0042, center = y <= 0.021 ? -y / 0.021 * 0.001 : -0.001 + (y - 0.021) / 0.014 * 0.001, root: Triple = [Math.cos(a) * 0.00065 + center, y, Math.sin(a) * 0.00065]; hairs.push(needle("耳匙菌由细柄表面生出的可见短硬毛", cream, root, [root[0] + Math.cos(a) * 0.0012, y + 0.0007, root[2] + Math.sin(a) * 0.0012], 0.00022)); }
  for (let i = 0; i < 25; i++) { const z = 0.003 + Math.floor(i / 5) * 0.0019, x = (i % 5 - 2) * 0.0024, y = 0.034 + Math.sin(z / 0.013 * Math.PI) * 0.001; teeth.push(pointed("耳匙菌肾盖下真正分开的短齿", cream, [[x, y + 0.0002, z], [x, y - 0.0012, z]], [0.0003, 0])); }
  parts.push(combineMeshes("耳匙菌完整细柄上的微型硬毛", cream, hairs), combineMeshes("耳匙菌小菌盖下的真实细齿层", cream, teeth)); return parts;
}

function splitGill(): ModelPart[] {
  const top = fanCap("裂褶菌无菌柄而由后缘附着的薄扇状盖", [0, 0.005, 0], 0.024, 0.026, 0.0017, 0.003), parts: ModelPart[] = [top], folds: ModelPart[] = [];
  for (let gill = 0; gill < 13; gill++) { const a = -1.05 + gill / 12 * 2.1, end: Triple = [Math.sin(a) * 0.01, 0, 0.013 + Math.cos(a) * 0.008], length = Math.hypot(end[0], end[2]), nx = -end[2] / length, nz = end[0] / length;
    for (const side of [-1, 1]) { const path: Triple[] = [0.14, 0.55, 1].map(t => { const z = end[2] * t + side * nz * 0.0004; return [end[0] * t + side * nx * 0.0004, 0.0052 + Math.sin(z / 0.024 * Math.PI) * 0.003, z]; }); folds.push(gillWall("裂褶菌每条褶下缘实际分开的半片反卷褶叶", cream, path, 0.0003, 0.0014)); }
  }
  parts.push(combineMeshes("裂褶菌真实分成双叶且中间留细缝的菌褶", cream, folds)); return parts;
}

export const hymeniumFungusDesigns: MasterNatureDesign[] = [
  design("boletusEdulis", "美味牛肝菌", "植物", bolete, ["Boletus edulis", "膨大网纹柄与真实菌管孔"]),
  design("lactariusDeliciosus", "松乳菇", "植物", milkcap, ["Lactarius deliciosus", "空心柄卷缘盖与下延薄菌褶"]),
  design("hydnumRepandum", "刺蘑（Hydnum）", "植物", hedgehog, ["Hydnum repandum", "宽肉盖下面密生柔软圆锥齿"]),
  design("pseudohydnum", "假齿菌（Pseudohydnum）", "植物", jellyTooth, ["Pseudohydnum gelatinosum", "胶质舌形盖与短软齿"]),
  design("auriscalpium", "耳匙菌", "植物", earPick, ["Auriscalpium vulgare", "肾状齿盖与偏心硬毛细柄"]),
  design("schizophyllum", "裂褶菌", "植物", splitGill, ["Schizophyllum commune", "无柄扇盖与分成双叶的褶缘"]),
];
