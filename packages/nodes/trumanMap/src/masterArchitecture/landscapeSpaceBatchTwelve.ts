import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, design, rail } from "./structures";
import { roadway } from "./landscapeSpaceBatchSeven";

// 每个完整路网只计一个主体，匝道/桥墩不拆分扩数；原创简化静态场景，不作交通工程图。
// https://www.fhwa.dot.gov/policyinformation/tmguide/tmg_2022/appendix-k.cfm
// https://www.txdot.gov/manuals/des/rdw/chapter-15-grade-separations-and-interchanges-/15-3-types-of-interchanges/15-3-1-three-leg-interchanges.html
// https://dot.nebraska.gov/media/miwnlauh/h-chap-5-interchanges.pdf
const stone = "#a8b09e", paving = "#b5b39c", steel = "#738b84";
function smooth(t: number) { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); }
function crossingHeight(z: number) { return .3 + 6.2 * smooth((170 - Math.abs(z)) / 110); }
function line(x: number, from: number, to: number, height: (z: number) => number, count = 15): Triple[] { return Array.from({ length: count }, (_, i) => { const z = from + (to - from) * i / (count - 1); return [x, height(z), z]; }); }
function rotate(point: Triple, degrees: number): Triple { const a = degrees * Math.PI / 180; return [point[0] * Math.cos(a) - point[2] * Math.sin(a), point[1], point[0] * Math.sin(a) + point[2] * Math.cos(a)]; }

function openBridge(name: string, points: Triple[], width: number): ModelPart[] {
  const body = roadway(name, points, width, true, true), guarded = roadway(name, points.slice(1, -1), width, true, true);
  return [...body.slice(0, 2), ...guarded.slice(2)];
}

function mainRoads(bridgeEnd = 22): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const z of [-5, 5]) for (const [from, to] of [[-190, 0], [0, 190]]) parts.push(...roadway("东西向完整双幅直通主线", [[from!, .3, z], [to!, .3, z]], 7));
  for (const x of [-5, 5]) {
    for (const [from, to] of [[-190, -bridgeEnd], [bridgeEnd, 190]]) parts.push(...roadway("南北向连续落地缓坡主线", line(x, from!, to!, crossingHeight), 7));
    parts.push(...roadway("南北向跨过低主线的独立桥跨", line(x, -bridgeEnd, bridgeEnd, () => 6.5, 9), 7, true));
  }
  for (const z of [-bridgeEnd + 6, bridgeEnd - 6]) {
    for (const x of [-12, 12]) parts.push(box("避开低层主线通行带的独立桥脚", x, 2.95, z, 1, 5.9, 1.4, stone));
    parts.push(box("横跨双幅上层桥面的完整承托盖梁", 0, 6.05, z, 25, .3, 1.4, stone));
  }
  return parts;
}

function surfaceJoin(x: number, z: number, original: number): number {
  const offEastWest = smooth((Math.abs(z) - 9) / 12), offNorthSouth = smooth((Math.abs(x) - 9) / 12), y = .3 + (original - .3) * offEastWest;
  return crossingHeight(z) + (y - crossingHeight(z)) * offNorthSouth;
}

function cornerRamps(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const [x, z, angle] of [[165, 165, -90], [-165, 165, 0], [-165, -165, 90], [165, -165, 180]]) {
    const path: Triple[] = Array.from({ length: 25 }, (_, i) => { const a = (angle! - i * 90 / 24) * Math.PI / 180, px = x! + Math.cos(a) * 160, pz = z! + Math.sin(a) * 160; return [px, surfaceJoin(px, pz, .3), pz]; });
    parts.push(...roadway("外缘直接右转且实际落地的匝道", path, 3.8, false, true));
  }
  return parts;
}

function hardPlan(name: string, color: string, outline: [number, number][], height: number, y: number): ModelPart {
  const value = polygon(name, color, outline, height, [0, y, 0]), source = value.vertices!;
  value.vertices = value.indices!.map(i => ({ ...source[i]! })); value.indices = value.vertices.map((_, i) => i); return value;
}

export const landscapeSpaceBatchTwelveDesigns = [
  design("菱形匝道跨线互通", "四条斜接匝道从低位直通公路接到上层横向道路的两个真实平交节点，中间桥跨保留低路净空，上层两端引道平缓落地", () => {
    const parts = mainRoads();
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const path: Triple[] = Array.from({ length: 25 }, (_, i) => { const t = i / 24, u = 1 - t, px = x * (150 * u * u + 80 * u * t + 5 * t * t), pz = z * (5 * u * u + 10 * u * t + 50 * t * t); return [px, surfaceJoin(px, pz, .3 + 6.2 * smooth(t)), pz]; });
      parts.push(...roadway("低主线和桥上平交节点之间的菱形匝道", path, 3.8, false, true));
    }
    for (const z of [-50, 50]) for (const x of [-10, 10]) parts.push(box("上层匝道平交点旁独立信号柱", x, 8.1, z, .12, 3.2, .12, steel), box("面向匝道的信号灯头", x, 9.3, z, .4, .7, .3, "#53665c"));
    return parts;
  }, "设施", "现代"),
  design("喇叭形三岔公路互通", "终止于东西主线的双幅支线经一条四分之三环匝、一条半定向弯匝和两条外侧直转匝完成三岔联络，跨线桥下保持通行净空", () => {
    const parts: ModelPart[] = [];
    for (const z of [-5, 5]) for (const [from, to] of [[-190, 0], [0, 190]]) parts.push(...roadway("三岔互通的东西向直通主线", [[from!, .3, z], [to!, .3, z]], 7));
    const stemHeight = (z: number) => z < 60 ? 6.5 : crossingHeight(z);
    for (const x of [-5, 5]) {
      parts.push(...roadway("三岔支线逐渐落地的接入主路", line(x, 22, 190, stemHeight), 7), ...roadway("三岔支线跨线后接入分流弯匝的高桥", line(x, x < 0 ? -35 : -95, 22, () => 6.5), 7, true));
    }
    const loop: Triple[] = Array.from({ length: 37 }, (_, i) => { const t = i / 36, a = -t * Math.PI * 1.5, x = -35 + Math.cos(a) * 30, z = -35 + Math.sin(a) * 30, y = 6.5 - 6.2 * smooth(t); return [x, .3 + (y - .3) * smooth((Math.abs(z) - 8.5) / 9), z]; });
    parts.push(...roadway("三岔互通单一完整四分之三环匝", loop, 3.8, false, true));
    const semi: Triple[] = Array.from({ length: 25 }, (_, i) => { const t = i / 24, a = Math.PI - t * Math.PI / 2, x = 95 + Math.cos(a) * 90, z = -95 + Math.sin(a) * 90; return [x, .3 + 6.2 * (1 - smooth(t)), z]; });
    parts.push(...roadway("支线和东端主线之间的半定向长弯匝", semi, 3.8, false, true));
    for (const side of [-1, 1]) {
      const path: Triple[] = Array.from({ length: 25 }, (_, i) => { const t = i / 24, a = -Math.PI / 2 - t * Math.PI / 2, x = side * (150 + Math.cos(a) * 145), z = 150 + Math.sin(a) * 145; return [x, surfaceJoin(x, z, .3), z]; });
      parts.push(...roadway("主线与终止支线之间的直接长弧匝", path, 3.8, false, true));
    }
    for (const z of [-75, -45, -18, 18]) {
      const xs = z < -35 ? [5] : [-5, 5];
      for (const x of xs) parts.push(box("跨线和北端分流桥段的独立承重墩", x, 3.1, z, 1.1, 6.2, 1.5, stone));
    }
    return parts;
  }, "设施", "现代"),
  design("四层全定向公路互通", "两条直通主线分处低层和第二层，四条左转高架在第三及第四层成对跨越，外侧直接右转匝道落地连接各方向，完整路网保留独立立体净空", () => {
    const parts: ModelPart[] = [...mainRoads(65), ...cornerRamps()], columns = new Map<string, { x: number; z: number; height: number }>();
    for (const degrees of [0, 90, 180, 270]) {
      const odd = degrees % 180 !== 0, peak = odd ? 18.9 : 12.7, from = odd ? .3 : crossingHeight(-120), to = odd ? crossingHeight(120) : .3;
      const start: Triple[] = [[5, 0, -170], [10, 0, -150]].map(p => { const v = rotate(p as Triple, degrees); v[1] = odd ? .3 : crossingHeight(v[2]); return v; });
      const curve: Triple[] = Array.from({ length: 25 }, (_, i) => { const t = i / 24, u = 1 - t, x = 12 * u * u * u + 36 * u * u * t - 60 * u * t * t + 120 * t * t * t, z = -120 * u * u * u + 60 * u * u * t - 36 * u * t * t - 12 * t * t * t, base = from + (to - from) * smooth(t), lift = smooth(t / .23) * smooth((1 - t) / .23); return rotate([x, base + (peak - base) * lift, z], degrees); });
      const end: Triple[] = [[150, 0, -10], [170, 0, -5]].map(p => { const v = rotate(p as Triple, degrees); v[1] = odd ? crossingHeight(v[2]) : .3; return v; });
      parts.push(...openBridge("跨过其他方向车流的完整左转高架", [...start, ...curve, ...end], 3.8));
      for (const [index, axis] of [[8, 0], [16, 90]]) {
        const p = curve[index!]!, local = rotate(p, -degrees), center = rotate([index === 8 ? 0 : local[0], p[1], index === 8 ? local[2] : 0], degrees), direction = rotate([17, 0, 0], degrees + axis!), a: Triple = [center[0] - direction[0], p[1] - .55, center[2] - direction[2]], b: Triple = [center[0] + direction[0], p[1] - .55, center[2] + direction[2]], height = p[1] - .8;
        for (const foot of [a, b]) { const key = `${foot[0].toFixed(4)},${foot[2].toFixed(4)}`, old = columns.get(key); if (!old || old.height < height) columns.set(key, { x: foot[0], z: foot[2], height }); }
        parts.push(rail(a, b, .5, stone));
      }
    }
    // ACT: 两层共用同一位置的门墩，保留两层横梁，避免叠放两根重合柱浪费体积。
    for (const p of columns.values()) parts.push(box("位于低位车道外侧的连续多层高架门墩", p.x, p.height / 2, p.z, 1.1, p.height, 1.1, stone));
    return parts;
  }, "设施", "现代"),
  design("环形高架四岸人行连桥", "完整高环步道围住通天圆孔并跨过低位十字路口，四角支柱和角向落地石阶避开车道，阶道由外缘真实开口接入环道，内缘连续防护壁保护圆孔", () => {
    const cross: [number, number][] = [[-70, -7], [-7, -7], [-7, -70], [7, -70], [7, -7], [70, -7], [70, 7], [7, 7], [7, 70], [-7, 70], [-7, 7], [-70, 7]], parts: ModelPart[] = [hardPlan("下方完整连通十字路口的护基", stone, cross, .35, 0), hardPlan("下方十字路口完整单片沥青面", "#677269", cross, .025, .35), ring("中间真正通天的宽环形高架步行桥面", paving, 26, 5, 6.6, .3), ring("高环内缘连续低防护壁", stone, 21.2, .16, 7.3, 1.1)];
    for (const degrees of [45, 135, 225, 315]) { const a = degrees * Math.PI / 180, x = Math.cos(a) * 23.5, z = Math.sin(a) * 23.5; parts.push(cylinder("车道外侧实际承托高环桥面的独立柱", x, 3.225, z, 1.2, 6.45, stone), cylinder("高环承柱落地宽基础", x, .2, z, 3, .4, stone)); }
    for (const degrees of [45, 135, 225, 315]) {
      const a = degrees * Math.PI / 180, x = Math.cos(a), z = Math.sin(a), nx = -z, nz = x;
      for (let offset = 0; offset < 40; offset += 5) {
        const profile: [number, number][] = [[0, 0]];
        for (let i = 0; i < 5; i++) profile.push([i * .35, -(6.75 - (offset + i) * .16875)], [(i + 1) * .35, -(6.75 - (offset + i) * .16875)]);
        profile.push([1.75, 0]); const stairs = hardPlan("沿四岸落地并保持正常步高的石阶", stone, profile, 4, 0); stairs.vertices = stairs.vertices!.map(p => ({ x: p.x, y: -p.z, z: p.y - 2 })); stairs.position = { x: x * (25.8 + offset * .35), y: 0, z: z * (25.8 + offset * .35) }; stairs.rotation.y = -degrees; parts.push(stairs);
      }
      const outer = Array.from({ length: 9 }, (_, i): [number, number] => { const t = (degrees + 8 + i * 74 / 8) * Math.PI / 180; return [Math.cos(t) * 26, Math.sin(t) * 26]; }), inner = Array.from({ length: 9 }, (_, i): [number, number] => { const t = (degrees + 82 - i * 74 / 8) * Math.PI / 180; return [Math.cos(t) * 25.84, Math.sin(t) * 25.84]; });
      parts.push(hardPlan("角向阶道入口之间的外环真实防护壁", stone, [...outer, ...inner], 1.1, 6.75));
      for (const side of [-1, 1]) parts.push(rail([x * 25.8 + nx * side * 1.9, 7.85, z * 25.8 + nz * side * 1.9], [x * 39.8 + nx * side * 1.9, 1.1, z * 39.8 + nz * side * 1.9], .07, steel), box("四岸阶道终点真正接地的扶手柱", x * 39.8 + nx * side * 1.9, .55, z * 39.8 + nz * side * 1.9, .07, 1.1, .07, steel));
    }
    return parts;
  }, "建筑", "现代"),
];
