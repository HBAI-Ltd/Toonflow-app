import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, colors, design } from "./structures";

// 完整交通拓扑只登记一个主项，不按车道数/尺寸/匝道数量扩款。
// https://www.fhwa.dot.gov/policyinformation/tmguide/tmg_fhwa_pl_17_003.pdf
// 原创简化场景形体，不提供交通运行或工程验算。
const asphalt = "#606e69", concrete = "#a3aea2";

function normal(points: Triple[], i: number): [number, number] {
  const a = points[Math.max(0, i - 1)]!, b = points[Math.min(points.length - 1, i + 1)]!, dx = b[0] - a[0], dz = b[2] - a[2], length = Math.hypot(dx, dz);
  return [-dz / length, dx / length];
}

function roadSolid(name: string, points: Triple[], width: number, top: number, bottom: number | null, color: string): ModelPart {
  const centerX = Math.max(-95, Math.min(95, (Math.min(...points.map(p => p[0])) + Math.max(...points.map(p => p[0]))) / 2)), centerZ = Math.max(-95, Math.min(95, (Math.min(...points.map(p => p[2])) + Math.max(...points.map(p => p[2]))) / 2));
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  points.forEach(([x, y, z], i) => {
    const [nx, nz] = normal(points, i), low = bottom === null ? 0 : y + bottom;
    for (const [side, level] of [[-1, y + top], [1, y + top], [-1, low], [1, low], [-1, y + top], [-1, low], [1, y + top], [1, low]]) vertices.push({ x: x - centerX + nx * side! * width / 2, y: level!, z: z - centerZ + nz * side! * width / 2 });
    if (!i) return;
    const p = (i - 1) * 8, q = i * 8;
    indices.push(p, p + 1, q, p + 1, q + 1, q, p + 2, q + 2, p + 3, p + 3, q + 2, q + 3, p + 4, q + 4, p + 5, p + 5, q + 4, q + 5, p + 6, p + 7, q + 6, p + 7, q + 7, q + 6);
  });
  for (const [offset, corners] of [[0, [0, 2, 3, 1]], [(points.length - 1) * 8, [0, 1, 3, 2]]] as const) {
    const n = vertices.length;
    vertices.push(...corners.map(i => ({ ...vertices[offset + i]! })));
    indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  // ACT: 380米整体拆为具有独立局部中心的真实闭壳；position与局部顶点仍各在100米预算内。
  return part(name, "mesh", color, [centerX, 0, centerZ], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function roadway(name: string, points: Triple[], width: number, bridge = false, ramp = false): ModelPart[] {
  // ACT: 匝道交接面高5毫米，避免重叠段共面闪烁；不引入道路布尔或改变场景地形。
  const parts = [roadSolid(`${name}完整承托体`, points, width, .3, bridge ? -.3 : null, concrete), roadSolid(`${name}连续沥青面`, points, width - .25, ramp ? .325 : .32, .24, asphalt)];
  for (const side of [-1, 1]) {
    const edge = points.map(([x, y, z], i): Triple => { const [nx, nz] = normal(points, i); return [x + nx * side * (width / 2 - .12), y, z + nz * side * (width / 2 - .12)]; });
    parts.push(roadSolid(`${name}${bridge ? "桥面两侧连续护墙" : "路面两侧连续边线"}`, edge, bridge ? .18 : .12, bridge ? .9 : .337, .32, bridge ? concrete : "#d8d6bb"));
  }
  return parts;
}

function smooth(t: number) { return t * t * (3 - 2 * t); }
function mainHeight(z: number) { return .3 + 6.2 * smooth(Math.max(0, Math.min(1, (165 - Math.abs(z)) / 145))); }
function junctionHeight(x: number, z: number, original: number) {
  const nearNorthSouth = 1 - smooth(Math.max(0, Math.min(1, (Math.abs(x) - 11) / 12)));
  const nearEastWest = 1 - smooth(Math.max(0, Math.min(1, (Math.abs(z) - 11) / 12)));
  const y = original + (mainHeight(z) - original) * nearNorthSouth;
  return y + (.3 - y) * nearEastWest;
}

export const landscapeSpaceBatchSevenDesigns = [
  design("四叶环匝互通立交", "上下分层的双幅主路连接四条左转环匝与四条外侧右转匝，缓升引道在跨线桥两端落地，完整路网保留中央过车净空", () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      for (const [start, end] of [[-190, 0], [0, 190]]) parts.push(...roadway("东西向双幅主路", [[start!, .3, side * 5], [end!, .3, side * 5]], 7));
      for (const [start, end] of [[-190, -20], [20, 190]]) parts.push(...roadway("南北向逐渐落地引道", Array.from({ length: 17 }, (_, i): Triple => { const z = start! + (end! - start!) * i / 16; return [side * 5, mainHeight(z), z]; }), 7));
      parts.push(...roadway("中央真实悬空跨线桥", [[side * 5, 6.5, -20], [side * 5, 6.5, 20]], 7, true));
    }
    for (const [x, z, angle, from, to] of [[30, 30, 180, mainHeight(30), .3], [-30, 30, -90, .3, mainHeight(30)], [-30, -30, 0, mainHeight(-30), .3], [30, -30, 90, .3, mainHeight(-30)]]) {
      const points = Array.from({ length: 37 }, (_, i): Triple => { const t = i / 36, a = (angle! - t * 270) * Math.PI / 180, px = x! + Math.cos(a) * 25, pz = z! + Math.sin(a) * 25; return [px, junctionHeight(px, pz, from! + (to! - from!) * smooth(t)), pz]; });
      parts.push(...roadway("承接跨线左转流向的三分之四环匝", points, 3.8, false, true));
    }
    for (const [x, z, angle] of [[165, 165, -90], [-165, 165, 0], [-165, -165, 90], [165, -165, 180]]) {
      const points = Array.from({ length: 25 }, (_, i): Triple => { const a = (angle! - i / 24 * 90) * Math.PI / 180, px = x! + Math.cos(a) * 160, pz = z! + Math.sin(a) * 160; return [px, junctionHeight(px, pz, .3), pz]; });
      parts.push(...roadway("位于环匝外侧并直接落地的右转匝", points, 3.8, false, true));
    }
    for (const x of [-5, 5]) for (const z of [-16, 16]) parts.push(box("避开下层车道的独立桥墩", x, 3.1, z, 1.35, 6.2, 1.5, colors.stone), box("连续承接桥底的横向盖梁", x, 6.05, z, 7.1, .3, 1.8, colors.stone));
    return parts;
  }, "建筑", "现代"),
];
