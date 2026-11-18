import { BoxGeometry } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon, tapered } from "../masterNature/shared";
import { bankedTrack, type TrackSample } from "./publicSpaceBatchFive";
import { box, colors, cylinder, design, pipe, rail } from "./structures";

const stone = "#a8ad9b", paving = "#b6b39c", earth = "#a79570", steel = "#728b83";
type CenterSample = { x: number; y: number; z: number; bank?: number };

function smooth(t: number) { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); }
function hardPlan(name: string, color: string, outline: [number, number][], height: number, position: Triple = [0, 0, 0], holes: [number, number][][] = []): ModelPart {
  const value = polygon(name, color, outline, height, position, holes), source = value.vertices!;
  value.vertices = value.indices!.map(i => ({ ...source[i]! })); value.indices = value.vertices.map((_, i) => i); return value;
}

function steps(name: string, count: number, top: number, bottom: number, run: number, width: number, start: [number, number], yaw: number): ModelPart[] {
  const result: ModelPart[] = [], rise = (top - bottom) / count, a = yaw * Math.PI / 180;
  for (let offset = 0; offset < count; offset += 5) {
    const n = Math.min(5, count - offset), profile: [number, number][] = [[0, -bottom]];
    for (let i = 0; i < n; i++) profile.push([i * run, -(top - (offset + i) * rise)], [(i + 1) * run, -(top - (offset + i) * rise)]);
    profile.push([n * run, -bottom]); const value = hardPlan(name, stone, profile, width);
    value.vertices = value.vertices!.map(p => ({ x: p.x, y: -p.z, z: p.y - width / 2 })); value.position = { x: start[0] + Math.cos(a) * offset * run, y: 0, z: start[1] - Math.sin(a) * offset * run }; value.rotation.y = yaw; result.push(value);
  }
  return result;
}

function samples(points: CenterSample[], width: number, delta = 0, base: number | null = .2): TrackSample[] {
  return points.map((p, i) => {
    const a = points[Math.max(0, i - 1)]!, b = points[Math.min(points.length - 1, i + 1)]!, length = Math.hypot(b.x - a.x, b.z - a.z), nx = (b.z - a.z) / length, nz = -(b.x - a.x) / length, bank = p.bank ?? 0, half = width * Math.cos(bank) / 2, rise = width * Math.sin(bank);
    return { x: p.x - nx * half, z: p.z - nz * half, nx, nz, bank, height: p.y + delta - rise / 2, base: base ?? p.y };
  });
}

function bands(name: string, color: string, points: TrackSample[], width: number): ModelPart[] {
  const result: ModelPart[] = [];
  for (let start = 0; start < points.length - 1; start += 32) result.push({ ...bankedTrack(name, points.slice(start, start + 33), width, .2), color });
  return result;
}

function plankBatch(name: string, centers: Triple[], size: Triple, color: string): ModelPart[] {
  const geometry = new BoxGeometry(1, 1, 1), p = geometry.attributes.position!, cube = Array.from({ length: p.count }, (_, i): Triple => [p.getX(i), p.getY(i), p.getZ(i)]), faces = Array.from(geometry.index!.array), result: ModelPart[] = [];
  geometry.dispose();
  for (let offset = 0; offset < centers.length; offset += 20) {
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (const center of centers.slice(offset, offset + 20)) { const n = vertices.length; vertices.push(...cube.map(([x, y, z]) => ({ x: center[0] + x * size[0], y: center[1] + y * size[1], z: center[2] + z * size[2] }))); indices.push(...faces.map(i => n + i)); }
    result.push(part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return result;
}

function bowlRadius(a: number) { return 20 + 8 * Math.cos(a * 2); }
function bowlBody(): ModelPart {
  const bottom = (x: number, z: number) => 1.7 - 1.3 * Math.exp(-((x - 11) ** 2 + z * z) / 98) - Math.exp(-((x + 11) ** 2 + z * z) / 72), vertices: { x: number; y: number; z: number }[] = [{ x: 0, y: bottom(0, 0), z: 0 }], indices: number[] = [];
  const layers = [.15, .3, .45, .6, .75, .88, 1];
  for (let layer = 0; layer < layers.length; layer++) {
    const s = layers[layer]!;
    for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16, r = bowlRadius(a) * s, x = Math.cos(a) * r, z = Math.sin(a) * r, y = bottom(x, z), blend = smooth((s - .45) / .55); vertices.push({ x, y: y + (3.2 - y) * blend, z }); }
    for (let i = 0; i < 32; i++) {
      const j = (i + 1) % 32, row = 1 + layer * 32;
      if (!layer) indices.push(0, row + j, row + i);
      else { const previous = row - 32; indices.push(previous + i, previous + j, row + j, previous + i, row + j, row + i); }
    }
  }
  const edge = 1 + (layers.length - 1) * 32;
  for (let i = 0; i < 32; i++) { const j = (i + 1) % 32, a = vertices[edge + i]!, b = vertices[edge + j]!, n = vertices.length; vertices.push({ ...a }, { ...b }, { x: b.x, y: 0, z: b.z }, { x: a.x, y: 0, z: a.z }); indices.push(n, n + 1, n + 2, n, n + 2, n + 3); }
  const center = vertices.length; vertices.push({ x: 0, y: 0, z: 0 });
  for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16, r = bowlRadius(a); vertices.push({ x: Math.cos(a) * r, y: 0, z: Math.sin(a) * r }); }
  for (let i = 0; i < 32; i++) indices.push(center, center + 1 + i, center + 1 + (i + 1) % 32);
  return part("同一连续曲面内形成浅槽深槽和中间高鞍的完整碗池", "mesh", "#acb3a8", [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const landscapeSpaceBatchFourteenDesigns = [
  design("完整人工激流回旋赛道", "上游集水池经高低连续的U形长水道流向下游池，固定导流墩和跨渠悬门沿完整赛程分布，独立人行桥以两端阶道跨越水道，水流为静态示意", () => {
    const total = 200 + 22 * Math.PI, level = (distance: number) => 5 - 4.4 * distance / total, left: CenterSample[] = Array.from({ length: 41 }, (_, i) => ({ x: -22, y: level(i * 2.5), z: -60 + i * 2.5 })), curve: CenterSample[] = Array.from({ length: 25 }, (_, i) => { const t = i / 24, a = Math.PI * (1 - t); return { x: Math.cos(a) * 22, y: level(100 + t * 22 * Math.PI), z: 40 + Math.sin(a) * 22 }; }), right: CenterSample[] = Array.from({ length: 41 }, (_, i) => ({ x: 22, y: level(100 + 22 * Math.PI + i * 2.5), z: 40 - i * 2.5 })), paths = [left, curve, right], parts: ModelPart[] = [-37.5, 37.5].map(z => box("完整激流场分段落地基坪", 0, .1, z, 90, .2, 75, "#a5aa8f"));
    for (const path of paths) {
      parts.push(...bands("连续承托完整激流水路的厚底", stone, samples(path, 10), 10), ...bands("沿整条赛道下降的静态薄水层", colors.water, samples(path, 9.6, 1, null).map(s => ({ ...s, base: s.base! + .96 })), 9.6));
      for (const side of [-1, 1]) {
        const wall = path.map((p, i) => { const a = path[Math.max(0, i - 1)]!, b = path[Math.min(path.length - 1, i + 1)]!, length = Math.hypot(b.x - a.x, b.z - a.z); return { ...p, x: p.x + (b.z - a.z) / length * side * 5.175, z: p.z - (b.x - a.x) / length * side * 5.175 }; });
        parts.push(...bands("完整赛道两侧跟随渠底下降的止水壁", stone, samples(wall, .35, 1.7, null), .35));
      }
    }
    for (const [x, z, distance] of [[-22, -40, 20], [-22, 20, 80], [22, 20, 120 + 22 * Math.PI], [22, -35, 175 + 22 * Math.PI]]) {
      const y = level(distance!);
      for (const side of [-1, 1]) parts.push(box("悬门支承桅实际从地面升至水道上空", x! + side * 6, (y + 4.7) / 2, z!, .13, y + 4.3, .13, steel), pipe("门杆上端连接跨渠梁的独立吊绳", [x! + side, y + 4.5, z!], [x! + side, y + 4.1, z!], .018), cylinder("跨渠悬门成对独立门杆", x! + side, y + 2.7, z!, .055, 2.8, side < 0 ? "#a77463" : "#769b78"));
      parts.push(rail([x! - 6, y + 4.5, z!], [x! + 6, y + 4.5, z!], .1, steel));
    }
    for (const [x, z, distance] of [[-24.5, -15, 45], [-19.5, 3, 63], [-24.5, 29, 89], [19.5, 28, 112 + 22 * Math.PI], [24.5, 6, 134 + 22 * Math.PI], [19.5, -16, 156 + 22 * Math.PI]]) { const block = box("水道内仍留双侧过流间隙的固定导流墩", x!, level(distance!) + .65, z!, 2.3, 1.3, 1.7, stone); block.rotation.y = z! % 2 ? 18 : -18; parts.push(block); }
    for (const side of [-1, 1]) {
      const x = side * 22, floor = side < 0 ? 5 : .6;
      parts.push(box("上下游集水池真实厚底承台", x, floor / 2, -68, 14, floor, 16, stone), box("上下游集水池静态水面", x, floor + 1, -68, 13.4, .025, 15.4, colors.water), box("集水池外端封水墙", x, floor + .85, -76, 14, 1.7, .3, stone));
      for (const bank of [-1, 1]) parts.push(box("集水池接入赛道的两侧止水墙", x + bank * 7, floor + .85, -68, .3, 1.7, 16, stone));
    }
    const bridgeTop = level(52) + 3.15;
    parts.push(box("跨过完整激流水道的独立人行桥面", -22, bridgeTop - .15, -8, 16, .3, 3, paving));
    for (const x of [-30, -14]) parts.push(box("水道之外独立承托人行桥的落地桥脚", x, (bridgeTop - .3) / 2, -8, .7, bridgeTop - .3, 2.2, stone), ...steps("人行桥两端实际落地的连续阶道", 36, bridgeTop, .2, .3, 3, [x, -8], x < -22 ? 180 : 0));
    for (const z of [-9.4, -6.6]) { parts.push(rail([-30, bridgeTop + 1.1, z], [-14, bridgeTop + 1.1, z], .07, steel)); for (const x of [-30, -22, -14]) parts.push(box("跨渠桥真正连接桥面的低护栏柱", x, bridgeTop + .55, z, .07, 1.1, .07, steel)); }
    return parts;
  }, "设施", "现代"),
  design("连续深浅槽混凝土碗池公园", "一块连续曲面在同一碗池内形成高鞍相连的深浅槽，所有弯壁过渡到同高池缘而非并排两只池，外围厚站台和独立阶道真实落地", () => {
    const parts: ModelPart[] = [bowlBody()];
    for (let quadrant = 0; quadrant < 4; quadrant++) {
      const outer = Array.from({ length: 9 }, (_, i): [number, number] => { const a = (quadrant * 8 + i) * Math.PI / 16, r = bowlRadius(a) + 2; return [Math.cos(a) * r, Math.sin(a) * r]; }), inner = Array.from({ length: 9 }, (_, i): [number, number] => { const a = (quadrant * 8 + 8 - i) * Math.PI / 16, r = bowlRadius(a); return [Math.cos(a) * r, Math.sin(a) * r]; });
      parts.push(hardPlan("围绕同一连续碗口且实际落地的完整站台", paving, [...outer, ...inner], 3.2));
    }
    const coping: Triple[] = Array.from({ length: 33 }, (_, i) => { const a = i * Math.PI / 16, r = bowlRadius(a); return [Math.cos(a) * r, 3.23, Math.sin(a) * r]; });
    parts.push(tapered("沿真实曲口连续布置的金属池缘压管", steel, coping, coping.map(() => .055)));
    for (const side of [-1, 1]) { parts.push(...steps("从池缘站台连续降至地面的外阶", 16, 3.2, 0, .35, 3.2, [0, side * 13.8], side < 0 ? 90 : -90)); for (const x of [-1.5, 1.5]) parts.push(rail([x, 4.3, side * 13.8], [x, 1.1, side * 19.4], .07, steel), box("碗池外阶末端真正接地的扶手柱", x, .55, side * 19.4, .07, 1.1, .07, steel)); }
    return parts;
  }, "建筑", "现代"),
  design("高起跑三直段小轮车竞速场", "高位落门起跑台接入三条竞速直段，两座外侧升高的压坡回头弯把跳跃土丘路段连到独立终点，赛程为起点到终点的开放路线，终点不回接起跑台", () => {
    const first: CenterSample[] = Array.from({ length: 61 }, (_, i) => { const z = -65 + i * 2, hump = 1.4 * Math.exp(-((z + 8) ** 2) / 25) + 1.1 * Math.exp(-((z - 15) ** 2) / 16) + 1.6 * Math.exp(-((z - 38) ** 2) / 36); return { x: -24, y: z < -28 ? 1 + 7 * smooth((-28 - z) / 37) : 1 + hump, z }; }), turnOne: CenterSample[] = Array.from({ length: 25 }, (_, i) => { const t = i / 24, a = Math.PI * (1 - t); return { x: -12 + Math.cos(a) * 12, y: 1 + .8 * Math.sin(t * Math.PI) ** 2, z: 55 + Math.sin(a) * 12, bank: -.35 * Math.sin(t * Math.PI) }; }), second: CenterSample[] = Array.from({ length: 49 }, (_, i) => { const z = 55 - i * 95 / 48; return { x: 0, y: 1 + 1.5 * Math.exp(-((z - 25) ** 2) / 30) + 1.5 * Math.exp(-((z - 12) ** 2) / 30) + .9 * Math.exp(-((z + 13) ** 2) / 18), z }; }), turnTwo: CenterSample[] = Array.from({ length: 25 }, (_, i) => { const t = i / 24, a = Math.PI * (1 + t); return { x: 12 + Math.cos(a) * 12, y: 1 + .8 * Math.sin(t * Math.PI) ** 2, z: -40 + Math.sin(a) * 12, bank: .35 * Math.sin(t * Math.PI) }; }), third: CenterSample[] = Array.from({ length: 49 }, (_, i) => { const z = -40 + i * 110 / 48; return { x: 24, y: z > 63 ? 1 - .75 * smooth((z - 63) / 7) : 1 + 1.3 * Math.exp(-((z + 15) ** 2) / 25) + .8 * Math.exp(-((z - 15) ** 2) / 12) + .8 * Math.exp(-((z - 25) ** 2) / 12), z }; }), parts: ModelPart[] = [-37.5, 37.5].map(z => box("完整竞速场分段落地地基", 0, .1, z, 90, .2, 75, "#a7ab8d"));
    for (const path of [first, turnOne, second, turnTwo, third]) parts.push(...bands("按竞速高程与横坡实际成形的连续土道路体", earth, samples(path, 8), 8));
    parts.push(box("起跑台完整承托高台实体", -24, 3.85, -69, 10, 7.7, 8, stone), box("接入赛道首段的高位完整起跑面", -24, 7.85, -69, 10, .3, 8, paving), box("独立完整可落起跑门", -24, 8.45, -65, 8, .9, .1, steel), cylinder("起跑门底部真实贯通横铰轴", -24, 8, -65, .15, 8.2, steel, [0, 0, 90]), ...plankBatch("起跑台八道之间完整独立分道线", Array.from({ length: 9 }, (_, i): Triple => [-28 + i, 8.0075, -69]), [.035, .015, 7], "#ddd7b9"), ...steps("地面实际进入高起跑台的独立石阶", 39, 8, .2, .3, 3, [-28.8, -69], 180));
    for (const x of [-28.8, -19.2]) {
      if (x < -24) { parts.push(rail([x, 9.1, -73], [x, 9.1, -70.6], .07, steel), rail([x, 9.1, -67.4], [x, 9.1, -65], .07, steel)); for (const z of [-73, -70.6, -67.4, -65]) parts.push(box("起跑台上行入口两侧实际留空的护栏柱", x, 8.55, z, .07, 1.1, .07, steel)); }
      else { parts.push(rail([x, 9.1, -73], [x, 9.1, -65], .07, steel)); for (const z of [-73, -69, -65]) parts.push(box("起跑台落在台面上的固定护栏柱", x, 8.55, z, .07, 1.1, .07, steel)); }
    }
    parts.push(rail([-28.8, 9.1, -72.8], [-19.2, 9.1, -72.8], .07, steel));
    for (const z of [-70.4, -67.6]) parts.push(rail([-28.8, 9.1, z], [-40.5, 1.3, z], .07, steel), box("上行阶道末端实际落地的扶手柱", -40.5, .75, z, .07, 1.1, .07, steel));
    for (const x of [19, 29]) parts.push(box("独立终点横梁的落地门柱", x, 2.2, 63, .15, 4, .15, steel));
    parts.push(box("不连接回起点的独立终点标记横梁", 24, 4.2, 63, 10, .3, .25, steel), box("实际贴住终点土面的完整横向白线", 24, 1.01, 63, 8, .025, .15, "#ddd7b9"));
    return parts;
  }, "设施", "现代"),
  design("四坡嵌庭地景广场", "四块高起厚地台围住下凹圆形公共庭院，四条宽坡道从轴向切口进入中央，外环高廊把四块地台连通，两侧外阶再接回地面，主形为整体地景空间", () => {
    const parts: ModelPart[] = [box("下凹广场与四方地台共用完整底坪", 0, .15, 0, 80, .3, 80, paving), cylinder("四条坡道汇入的完整下凹圆场", 0, .325, 0, 20, .05, paving), hardPlan("联通四块高地台的完整外围厚环廊", stone, [[-40, -40], [40, -40], [40, 40], [-40, 40]], 3.1, [0, .3, 0], [[[-36, -36], [36, -36], [36, 36], [-36, 36]]])];
    const a0 = Math.asin(.27), arc = Array.from({ length: 9 }, (_, i): [number, number] => { const a = Math.PI / 2 - a0 - (Math.PI / 2 - 2 * a0) * i / 8; return [Math.cos(a) * 10, Math.sin(a) * 10]; }), corner: [number, number][] = [...arc, [36, 2.7], [36, 36], [2.7, 36]];
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      parts.push(hardPlan("沿圆形庭边收弧而保留轴向坡口的整块高地台", stone, corner.map(([a, b]) => [a * x, b * z]), 3.1, [0, .3, 0]));
      parts.push(box("地台切口边沿不遮挡坡道的低护壁", x * 2.7, 3.95, z * 22.8, .15, 1.1, 26.4, steel), box("地台切口边沿不遮挡坡道的低护壁", x * 22.8, 3.95, z * 2.7, 26.4, 1.1, .15, steel));
    }
    for (const degrees of [0, 90, 180, 270]) {
      const a = degrees * Math.PI / 180, profile: [number, number][] = [[9.8, .3], [36, .3], [36, 3.4], [9.8, .35]], ramp = hardPlan("真实连接中央低庭与外环高廊的宽斜坡", paving, profile.map(([r, y]) => [r, -y]), 5.2);
      ramp.vertices = ramp.vertices!.map(p => ({ x: p.x, y: -p.z, z: p.y - 2.6 })); ramp.rotation.y = -degrees; parts.push(ramp);
      const outer = arc.map(([x, z]): [number, number] => [x * 1.015, z * 1.015]), inner = [...arc].reverse().map(([x, z]): [number, number] => [x, z]), guard = hardPlan("中央圆庭高台边缘的真实弧形低护壁", steel, [...outer, ...inner], 1.1, [0, 3.4, 0]); guard.rotation.y = -degrees; parts.push(guard);
      if (degrees % 180 === 0) parts.push(...steps("外环高廊连接场地外部的真实落地石阶", 17, 3.4, 0, .3, 4.5, [Math.cos(a) * 39.8, Math.sin(a) * 39.8], -degrees));
    }
    return parts;
  }, "建筑", "现代"),
];
