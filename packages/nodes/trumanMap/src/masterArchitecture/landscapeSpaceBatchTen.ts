import { BoxGeometry } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, colors, cylinder, design, pipe, rail } from "./structures";

// 原创静态完整设施；参考其空间关系，不复刻具体工程的测绘或性能规格。
// https://railroads.dot.gov/sites/fra.dot.gov/files/2024-07/Hazmat%20Risk%20Methodology.pdf
// https://cn.lmcwater.org.cn/knowledge_sharing/water_culture/202007/t20200720_35713.shtml
// https://www.oregon.gov/odot/engineering/pages/drawings-bridge.aspx
const stone = "#a9ac9b", steel = "#6b8580", earth = "#a7a17d";

function flatPlan(name: string, color: string, outline: [number, number][], height: number, position: Triple = [0, 0, 0], holes: [number, number][][] = []): ModelPart {
  const value = polygon(name, color, outline, height, position, holes), source = value.vertices!;
  value.vertices = value.indices!.map(index => ({ ...source[index]! }));
  value.indices = value.vertices.map((_, i) => i);
  return value;
}

function slopeWall(name: string, start: [number, number], end: [number, number], firstHeight: number, lastHeight: number): ModelPart {
  const dx = end[0] - start[0], dz = end[1] - start[1], length = Math.hypot(dx, dz), nx = -dz / length * .35, nz = dx / length * .35;
  const plan = [[start[0] + nx, start[1] + nz], [start[0] - nx, start[1] - nz], [end[0] - nx, end[1] - nz], [end[0] + nx, end[1] + nz]];
  const corners = [...plan.map(([x, z]) => ({ x: x!, y: .55, z: z! })), ...plan.map(([x, z], i) => ({ x: x!, y: i < 2 ? firstHeight : lastHeight, z: z! }))], vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const face of [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) {
    const n = vertices.length; vertices.push(...face.map(i => ({ ...corners[i]! }))); indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  return part(name, "mesh", stone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function trackStrip(name: string, points: Triple[], widths: number[], top: number, bottom: number | null, color: string): ModelPart {
  const centerX = Math.max(-95, Math.min(95, (Math.min(...points.map(p => p[0])) + Math.max(...points.map(p => p[0]))) / 2)), centerZ = Math.max(-95, Math.min(95, (points[0]![2] + points.at(-1)![2]) / 2));
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  points.forEach(([x, y, z], i) => {
    const a = points[Math.max(0, i - 1)]!, b = points[Math.min(points.length - 1, i + 1)]!, length = Math.hypot(b[0] - a[0], b[2] - a[2]), nx = -(b[2] - a[2]) / length, nz = (b[0] - a[0]) / length, low = bottom === null ? .18 : y + bottom;
    for (const [side, level] of [[-1, y + top], [1, y + top], [-1, low], [1, low], [-1, y + top], [-1, low], [1, y + top], [1, low]]) vertices.push({ x: x - centerX + nx * side! * widths[i]! / 2, y: level!, z: z - centerZ + nz * side! * widths[i]! / 2 });
    if (!i) return;
    const p = (i - 1) * 8, q = i * 8;
    indices.push(p, p + 1, q, p + 1, q + 1, q, p + 2, q + 2, p + 3, p + 3, q + 2, q + 3, p + 4, q + 4, p + 5, p + 5, q + 4, q + 5, p + 6, p + 7, q + 6, p + 7, q + 7, q + 6);
  });
  for (const [offset, face] of [[0, [0, 2, 3, 1]], [(points.length - 1) * 8, [0, 1, 3, 2]]] as const) {
    const n = vertices.length; vertices.push(...face.map(i => ({ ...vertices[offset + i]! }))); indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  return part(name, "mesh", color, [centerX, 0, centerZ], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function railPair(points: Triple[]): ModelPart[] {
  return [-1, 1].map(side => {
    const edge = points.map(([x, y, z], i): Triple => { const a = points[Math.max(0, i - 1)]!, b = points[Math.min(points.length - 1, i + 1)]!, length = Math.hypot(b[0] - a[0], b[2] - a[2]); return [x - (b[2] - a[2]) / length * side * .7175, y, z + (b[0] - a[0]) / length * side * .7175]; });
    return trackStrip("按标准轨距连续连接各股道的钢轨", edge, edge.map(() => .08), .07, -.07, steel);
  });
}

function trackSleepers(paths: Triple[][]): ModelPart[] {
  const geometry = new BoxGeometry(1, 1, 1), p = geometry.attributes.position!, cube = Array.from({ length: p.count }, (_, i): Triple => [p.getX(i), p.getY(i), p.getZ(i)]), faces = Array.from(geometry.index!.array), sleepers: { center: Triple; yaw: number }[] = [];
  geometry.dispose();
  for (const path of paths) {
    let gap = 0;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1]!, b = path[i]!, length = Math.hypot(b[0] - a[0], b[2] - a[2]);
      for (let distance = gap; distance < length; distance += 2.4) { const t = distance / length; sleepers.push({ center: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - .15, a[2] + (b[2] - a[2]) * t], yaw: Math.atan2(b[0] - a[0], b[2] - a[2]) }); }
      gap = (gap - length) % 2.4; if (gap < 0) gap += 2.4;
    }
  }
  const result: ModelPart[] = [];
  // ACT: 保留全部真实枕木，20根合批为480顶点；每批独立局部中心，不放宽坐标/几何预算。
  for (let offset = 0; offset < sleepers.length; offset += 20) {
    const batch = sleepers.slice(offset, offset + 20), centerX = Math.max(-95, Math.min(95, batch.reduce((v, item) => v + item.center[0], 0) / batch.length)), centerZ = Math.max(-95, Math.min(95, batch.reduce((v, item) => v + item.center[2], 0) / batch.length)), vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (const { center, yaw } of batch) {
      const n = vertices.length, c = Math.cos(yaw), s = Math.sin(yaw);
      vertices.push(...cube.map(([x, y, z]) => ({ x: center[0] - centerX + x * 2.6 * c + z * .22 * s, y: center[1] + y * .16, z: center[2] - centerZ - x * 2.6 * s + z * .22 * c })));
      indices.push(...faces.map(i => n + i));
    }
    result.push(part("独立实心横枕木合批", "mesh", "#857d65", [centerX, 0, centerZ], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return result;
}

export const landscapeSpaceBatchTenDesigns = [
  design("三岔环孔人行桥", "三条桥臂在中央带通天圆孔的公共环面汇合，斜腿和桥下主梁支承开放通行面，三岸各有连续落地石阶，环孔有独立防护围壁", () => {
    const angles = [-90, 30, 150], outline: [number, number][] = [], parts: ModelPart[] = [];
    for (const degrees of angles) { const a = degrees * Math.PI / 180, x = Math.cos(a), z = Math.sin(a), nx = -z, nz = x; for (const [r, side] of [[4, -1], [28, -1], [28, 1], [4, 1]]) outline.push([x * r! + nx * side! * 3, z * r! + nz * side! * 3]); }
    const hole = Array.from({ length: 12 }, (_, i): [number, number] => [Math.cos(i * Math.PI / 6) * 2.2, Math.sin(i * Math.PI / 6) * 2.2]);
    parts.push(flatPlan("三岸真正连通且中央开圆孔的桥面厚板", stone, outline, .3, [0, 7.5, 0], [hole]), ring("不封住通天孔的连续低围壁", steel, 2.3, .1, 8.35, 1.1), ring("中央环孔下方闭合承力环梁", steel, 3.9, .65, 7.3, .4));
    for (let index = 0; index < angles.length; index++) {
      const a = angles[index]! * Math.PI / 180, x = Math.cos(a), z = Math.sin(a), nx = -z, nz = x, next = angles[(index + 1) % angles.length]! * Math.PI / 180;
      parts.push(rail([x * 3.3, 7.35, z * 3.3], [x * 28, 7.35, z * 28], .42, steel), cylinder("桥臂近岸承重基台", x * 27, 3.7, z * 27, 2.2, 7.4, stone), cylinder("中央斜腿的落地宽基座", x * 5.3, .3, z * 5.3, 2.8, .6, stone), rail([x * 5.3, .6, z * 5.3], [x * 12, 7.15, z * 12], .6, stone));
      for (const side of [-1, 1]) {
        parts.push(rail([x * 4 + nx * side * 2.9, 8.9, z * 4 + nz * side * 2.9], [x * 28 + nx * side * 2.9, 8.9, z * 28 + nz * side * 2.9], .07, steel));
        for (const r of [4, 12, 20, 28]) parts.push(box("外桥缘连到桥面的实际护栏立柱", x * r + nx * side * 2.9, 8.35, z * r + nz * side * 2.9, .07, 1.1, .07, steel));
        parts.push(rail([x * 28 + nx * side * 2.9, 8.9, z * 28 + nz * side * 2.9], [x * 40.8 + nx * side * 2.9, 1.1, z * 40.8 + nz * side * 2.9], .07, steel));
      }
      parts.push(rail([x * 4 - z * 2.9, 8.9, z * 4 + x * 2.9], [Math.cos(next) * 4 + Math.sin(next) * 2.9, 8.9, Math.sin(next) * 4 - Math.cos(next) * 2.9], .07, steel));
      for (let group = 0; group < 4; group++) {
        const profile = [{ x: 0, y: 0 }];
        for (let i = 0; i < 10; i++) profile.push({ x: i * .32, y: 7.8 - (group * 10 + i) * .195 }, { x: (i + 1) * .32, y: 7.8 - (group * 10 + i) * .195 });
        profile.push({ x: 3.2, y: 0 });
        const steps = flatPlan("每阶正常步高并实际落地承托的下桥石阶", stone, profile.map(p => [p.x, -p.y]), 6);
        steps.vertices = steps.vertices!.map(p => ({ x: p.x, y: -p.z, z: p.y - 3 }));
        steps.position = { x: x * (28 + group * 3.2), y: 0, z: z * (28 + group * 3.2) }; steps.rotation.y = -angles[index]!;
        parts.push(steps);
      }
    }
    return parts;
  }, "建筑", "现代"),
  design("鱼嘴分江导流枢纽", "上游共用河床在尖长鱼嘴堤处分成宽浅外江和窄深内江，堤尾低侧堰把过量内江水横向导回外江，完整河床和护岸保持连续，水面为静态示意", () => {
    const parts: ModelPart[] = [box("承接内外江的完整护底河床", 0, .15, 0, 84, .3, 96, earth), flatPlan("尖端切开来水的狭长石砌分水堤", stone, [[0, -32], [8, -16], [8.5, 15], [-7, 15], [-8, -16]], 4.2, [0, .3, 0]), flatPlan("低侧堰后接到堤尾的高起分隔堤", stone, [[-7, 34], [8.5, 34], [6, 48], [-4, 48]], 4.2, [0, .3, 0]), box("真实降低堤顶的侧向排洪石堰", .75, 1, 24.5, 15.5, 1.4, 19, stone)];
    parts.push(flatPlan("鱼嘴前方连续上游静水面", colors.water, [[-37, -48], [37, -48], [37, -13], [8, -16], [0, -32], [-8, -16], [-28, -13]], .025, [0, 1.6, 0]), flatPlan("左岸窄深内江静态水面", colors.water, [[-28, -13], [-8, -16], [-7, 15], [-7, 34], [-4, 48], [-17, 48], [-25, 25], [-29, 2]], .025, [0, 1.6, 0]), flatPlan("右岸宽浅外江静态水面", colors.water, [[8, -16], [37, -13], [38, 48], [6, 48], [8.5, 34], [8.5, 15]], .025, [0, 1.6, 0]));
    for (const side of [-1, 1]) {
      const outline: [number, number][] = side < 0 ? [[-42, -48], [-37, -48], [-29, 2], [-25, 25], [-17, 48], [-42, 48]] : [[37, -48], [42, -48], [42, 48], [38, 48]];
      parts.push(flatPlan("顺应内外江不同线形的连续护岸", "#9ca087", outline, 3.1, [0, .3, 0]));
    }
    parts.push(flatPlan("低于外江浅滩的连续内江护底", "#7d897a", [[-28, -13], [-8, -16], [-7, 15], [-7, 34], [-4, 48], [-17, 48], [-25, 25], [-29, 2]], .1, [0, .3, 0]), flatPlan("外江较高的连续浅滩护底", "#aaa383", [[10, -9], [34, -8], [35, 47], [10, 47]], .5, [0, .3, 0]), box("堤尾低侧堰的石砌导流宽底", .75, .35, 24.5, 17.5, .7, 19));
    return parts;
  }, "设施", "中式"),
  design("外展翼墙双孔路堤箱涵", "两道净空箱孔贯通道路下方，完整底顶板和中隔墙闭合承重框，双端外展翼墙把河床接入洞口，下游消力池保留出水空间，两侧缓坡道路实际落地", () => {
    const parts: ModelPart[] = [box("两孔共用的完整厚底板", 0, .35, 0, 16, .7, 28, stone), box("承托路堤覆土的完整箱涵顶板", 0, 6.3, 0, 16, .7, 28, stone), ...[-7.5, 0, 7.5].map(x => box("闭合双箱框的侧壁与中隔墙", x, 3.325, 0, 1, 5.25, 28, stone)), box("顶板之上真实承托道路的浅覆土", 0, 7.1, 0, 16, .9, 26, earth), box("中央越过涵孔的连续道路面", 0, 7.7, 0, 16, .3, 18, "#69746a")];
    for (const side of [-1, 1]) {
      const soil = part("承托箱涵侧方长缓坡引道的实土坡", "extrude", earth, [side * 48, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 22, profile: (side < 0 ? [{ x: -40, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 7.55 }, { x: -40, y: .05 }] : [{ x: -40, y: 0 }, { x: 40, y: 0 }, { x: 40, y: .05 }, { x: -40, y: 7.55 }]) });
      const surf = part("贴住引道长缓坡而不悬浮的沥青路面", "extrude", "#69746a", [side * 48, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 18, profile: side < 0 ? [{ x: -40, y: .05 }, { x: 40, y: 7.55 }, { x: 40, y: 7.85 }, { x: -40, y: .35 }] : [{ x: -40, y: 7.55 }, { x: 40, y: .05 }, { x: 40, y: .35 }, { x: -40, y: 7.85 }] });
      parts.push(soil, surf);
      for (const bank of [-1, 1]) parts.push(slopeWall("洞口向河岸张开的连续变高翼墙", [bank * 7.8, side * 14], [bank * 17, side * 26], 6.65, 2.4));
      parts.push(flatPlan("翼墙之间实际连续的防冲刷护底", stone, [[-17, side * 26], [17, side * 26], [7.8, side * 14], [-7.8, side * 14]], .4, [0, .3, 0]), flatPlan("箱涵两端静态河道水面", colors.water, [[-16.5, side * 26], [16.5, side * 26], [7.2, side * 13.9], [-7.2, side * 13.9]], .025, [0, 1.45, 0]));
    }
    for (const x of [-3.75, 3.75]) parts.push(box("贯通箱孔且低于顶板的静态水面", x, 1.45, 0, 6.4, .025, 28, colors.water));
    for (const x of [-12, -7.2, -2.4, 2.4, 7.2, 12]) parts.push(box("下游护底上的独立消力墩", x, 1.2, 24, .8, 1, .8, stone));
    return parts;
  }, "设施", "现代"),
  design("驼峰扇状铁路编组线场", "推峰线路先上升后降入分道区，分级道岔把重力溜放线路展开为四条平行编组股道，独立夹轨缓速梁和尽端挡车器均连接实际轨道，完整站场为静态设施", () => {
    const inbound: Triple[] = [[0, .55, -118], [0, .7, -105], [0, 2, -90], [0, 4, -73], [0, 3.3, -61], [0, 1.7, -45]], first: Triple[][] = [-1, 1].map(side => Array.from({ length: 8 }, (_, i): Triple => { const t = i / 7, u = Math.max(0, Math.min(1, (i - 1) / 5)), s = u * u * (3 - 2 * u); return [side * 3 * s, 1.7 - .35 * t, -45 + 18 * t]; })), final: Triple[][] = [], ends: Triple[][] = [];
    for (const side of [-1, 1]) for (const distance of [6, 18]) {
      final.push(Array.from({ length: 12 }, (_, i): Triple => { const t = i / 11, u = Math.max(0, Math.min(1, (i - 1) / 9)), s = u * u * (3 - 2 * u); return [side * (3 + (distance - 3) * s), 1.35 - .8 * s, -27 + 37 * t]; }));
      ends.push([[side * distance, .55, 10], [side * distance, .55, 96]]);
    }
    const paths = [inbound, ...first, ...final, ...ends], highBed: Triple[] = [...inbound, ...first[0]!.slice(1).map(([, y, z]): Triple => [0, y, z])], lowBed: Triple[] = [...final[0]!.map(([, y, z]): Triple => [0, y, z]), [0, .55, 60], [0, .55, 96]], highWidths = [4, 4, 4, 4, 4, 5.5, ...first[0]!.slice(1).map((_, i) => 5.5 + 6.5 * (i + 1) / 7)], lowWidths = [...final[0]!.map(([, y]) => 12 + 32 * (1.35 - y) / .8), 44, 44], parts: ModelPart[] = [[-88, 60], [-28, 60], [32, 60], [80, 36]].map(([z, length]) => box("完整站场分段低基础", 0, .09, z!, 55, .18, length!, "#8d9582"));
    parts.push(trackStrip("峰顶至扇区起点的连续高道床", highBed, highWidths, -.23, null, "#9f9c85"), trackStrip("由扇区贯通平行编组股道的连续宽道床", lowBed, lowWidths, -.23, null, "#9f9c85"), ...paths.flatMap(railPair), ...trackSleepers(paths));
    for (const side of [-1, 1]) for (const distance of [6, 18]) {
      const x = side * distance;
      for (const edge of [-1, 1]) parts.push(box("夹在车轮外侧的实际长缓速梁", x + edge * 1.04, .72, 22, .18, .48, 14, steel), box("连接缓速梁的低位液压执行座", x + edge * 1.48, .45, 22, .7, .54, 2, steel));
      parts.push(box("轨道尽端横向吸能挡车梁", x, 1.25, 94.8, 2.8, .45, .45, "#887b64"), rail([x - 1.2, .18, 96], [x - 1.2, 1.05, 94.8], .18, steel), rail([x + 1.2, .18, 96], [x + 1.2, 1.05, 94.8], .18, steel));
    }
    for (const [x, y, z] of [[0, 1.7, -45], [-3, 1.35, -27], [3, 1.35, -27]]) parts.push(box("道岔转辙机独立低箱", x! + 2.1, y! - .12, z!, .55, .4, 1, steel), pipe("转辙机实际连接尖轨的横拉杆", [x! + .7, y! - .1, z!], [x! + 1.85, y! - .1, z!], .05));
    return parts;
  }, "设施", "现代"),
];
