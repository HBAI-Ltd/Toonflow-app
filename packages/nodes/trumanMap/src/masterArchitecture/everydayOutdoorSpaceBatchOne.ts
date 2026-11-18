import { BoxGeometry } from "three";
import { profileBodies } from "../roofRegistry";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design } from "./structures";

const stone = "#aab0a2", paving = "#c1bdab", asphalt = "#78887e", grass = "#94a180", soil = "#9f9273", metal = "#6b8077", white = "#d5d6bc";

export function hardPlan(name: string, color: string, outline: [number, number][], height: number, position: Triple = [0, 0, 0], holes: [number, number][][] = []): ModelPart {
  const value = polygon(name, color, outline, height, position, holes), original = value.vertices!, count = original.length / 2, vertices = [...original], indices: number[] = [];
  for (let i = 0; i < value.indices!.length; i += 3) { const face = value.indices!.slice(i, i + 3); if (face.every(j => j < count) || face.every(j => j >= count)) indices.push(...face); }
  let offset = 0;
  for (const ring of [outline, ...holes]) {
    for (let i = 0; i < ring.length; i++) { const a = offset + i, b = offset + (i + 1) % ring.length, n = vertices.length; vertices.push({ ...original[a]! }, { ...original[a + count]! }, { ...original[b + count]! }, { ...original[b]! }); indices.push(n, n + 2, n + 3, n, n + 1, n + 2); }
    offset += ring.length;
  }
  value.vertices = vertices; value.indices = indices; return value;
}

export function profileBody(name: string, color: string, profile: [number, number][], depth: number, position: Triple, yaw = 0): ModelPart {
  const value = hardPlan(name, color, profile.map(([x, y]) => [x, -y]), depth);
  value.vertices = value.vertices!.map(p => ({ x: p.x, y: -p.z, z: p.y - depth / 2 })); value.position = { x: position[0], y: position[1], z: position[2] }; value.rotation.y = yaw;
  profileBodies.set(value, { profile, depth });
  return value;
}

export function boxBatch(name: string, color: string, centers: Triple[], size: Triple): ModelPart[] {
  const geometry = new BoxGeometry(1, 1, 1), positions = geometry.attributes.position!, cube = Array.from({ length: positions.count }, (_, i): Triple => [positions.getX(i), positions.getY(i), positions.getZ(i)]), faces = Array.from(geometry.index!.array), result: ModelPart[] = [];
  geometry.dispose();
  // ACT: 每件合并20个重复细件，保留每面的硬法线；480顶点以内，避免车位线与格栅各成一个渲染部件。
  for (let offset = 0; offset < centers.length; offset += 20) {
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (const center of centers.slice(offset, offset + 20)) { const n = vertices.length; vertices.push(...cube.map(([x, y, z]) => ({ x: center[0] + x * size[0], y: center[1] + y * size[1], z: center[2] + z * size[2] }))); indices.push(...faces.map(i => n + i)); }
    result.push(part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return result;
}

export function riseSteps(name: string, low: number, high: number, count: number, run: number, width: number, start: Triple): ModelPart {
  const profile: [number, number][] = [[0, 0]];
  for (let i = 0; i < count; i++) profile.push([i * run, low + (high - low) * (i + 1) / count], [(i + 1) * run, low + (high - low) * (i + 1) / count]);
  profile.push([count * run, 0]); return profileBody(name, stone, profile, width, start, -90);
}

export const everydayOutdoorSpaceBatchOneDesigns = [
  design("尽端回车袋住宅街", "窄车行街接入完整展开的尽端回车头，两侧抬高步道为独立入户车道留出真实坡口，连续边沟从入户跨沟格栅下穿过，外侧矮界墙保留对应出入口", () => {
    const road: [number, number][] = [[-3.7, -40], [3.7, -40], [3.7, 14], [10, 14], [14, 20], [14, 28], [10, 34], [-10, 34], [-14, 28], [-14, 20], [-10, 14], [-3.7, 14]], walk: [number, number][] = [[-6, 12], [-11, 12], [-16, 19], [-16, 29], [-11, 36], [11, 36], [16, 29], [16, 19], [11, 12], [6, 12], [4, 12], [4, 14], [10, 14], [14, 20], [14, 28], [10, 34], [-10, 34], [-14, 28], [-14, 20], [-10, 14], [-4, 14], [-4, 12]], parts: ModelPart[] = [hardPlan("从外部街口贯通至回车头的完整车行路体", asphalt, road, .12), hardPlan("绕回车头连续展开且街口保持开放的抬高人行带", paving, walk, .3)];
    const gaps = [-30, -18, -6, 6], ranges = [[-40, -32], [-28, -20], [-16, -8], [-4, 4], [8, 12]], grille: Triple[] = [];
    for (const side of [-1, 1]) {
      parts.push(box("车行道与步道之间低于路面的连续排水沟底", side * 3.85, .025, -13, .3, .05, 54, stone));
      for (const [a, b] of ranges) parts.push(box("真实避开入户坡口的独立抬高步道段", side * 5, .15, (a! + b!) / 2, 2, .3, b! - a!, paving), box("入户引道之间的低位绿化地台", side * 8, .12, (a! + b!) / 2, 4, .24, b! - a!, grass), box("入户引道间保留入口开口的低界墙", side * 10, .65, (a! + b!) / 2, .2, .82, b! - a!, stone));
      for (const z of gaps) {
        parts.push(profileBody("从车行路标高接上人行道与院前地台的独立坡口", paving, [[-3, 0], [3, 0], [3, .3], [-1, .3], [-3, .12]], 4, [side * 7, 0, z], side < 0 ? 180 : 0));
        for (let i = 0; i < 6; i++) grille.push([side * 3.85, .105, z - 1.75 + i * .7]);
      }
    }
    parts.push(...boxBatch("入户坡口实际跨越边沟且仍能透水的独立栅条", metal, grille, [.45, .03, .065]));
    for (const [x, z, w, d] of [[0, 36.1, 22, .25], [-16.1, 24, .25, 10], [16.1, 24, .25, 10]]) parts.push(box("回车头外围接地并不封住街口的低挡边", x!, .4, z!, w!, .8, d!, stone));
    return parts;
  }, "设施", "现代"),
  design("单向环流中央步岛停车庭", "外部车口接通双侧停车带和两端回转车道，中央抬高人行岛由端部过街带接到外围步道，真实车位界线、止轮块和环流箭头让空场可直接布置车辆", () => {
    const parts: ModelPart[] = [box("停车车道与两端回转区共用完整落地路坪", 0, .07, 0, 34, .14, 60, asphalt), box("从外部真实穿过外围步道开口的车行入口", 0, .07, -34, 8, .14, 8, asphalt), box("停车庭后端连通两侧的完整外围步道", 0, .15, 31.5, 34, .3, 3, paving)];
    const island: [number, number][] = [[-3, -20], [-3, 20], [-1.4, 21], [1.4, 21], [3, 20], [3, -20], [1.4, -21], [-1.4, -21]], holes: [number, number][][] = [[[-2.6, -17], [-1.4, -17], [-1.4, 17], [-2.6, 17]], [[1.4, -17], [2.6, -17], [2.6, 17], [1.4, 17]]], lines: Triple[] = [], stops: Triple[] = [], crossing: Triple[] = [];
    parts.push(hardPlan("中间贯通步行路线并有真实种植开口的完整抬高人行岛", paving, island, .32, [0, 0, 0], holes));
    for (const side of [-1, 1]) {
      parts.push(box("中央步岛种植开口内低于围边的土床", side * 2, .075, 0, 1.2, .15, 34, soil), box("种植床内的低矮绿化面", side * 2, .17, 0, 1.1, .04, 33.8, grass), box("外围步道在车行入口旁保留实际通口", side * 10.5, .15, -31.5, 13, .3, 3, paving), box("停车列后缘的连续真实界线", side * 16.5, .15, 0, .06, .02, 42, white));
      for (const [a, b] of [[-33, -25.2], [-22.8, 22.8], [25.2, 33]]) parts.push(box("外围连续步道在过街位置留出的真实坡口", side * 18.5, .15, (a! + b!) / 2, 3, .3, b! - a!, paving));
      for (const z of [-24, 24]) parts.push(profileBody("与过街线正对且实际接上外围步道的路缘坡口", paving, [[-1.5, 0], [1.5, 0], [1.5, .3], [-1.5, .14]], 2.4, [side * 18.5, 0, z], side < 0 ? 180 : 0));
      for (let i = 0; i <= 14; i++) lines.push([side * 13.3, .15, -21 + i * 3]);
      for (let i = 0; i < 14; i++) stops.push([side * 15.8, .2, -19.5 + i * 3]);
      const arrow: [number, number][] = [[-.12, -2.5], [.12, -2.5], [.12, .6], [.8, .6], [0, 1.9], [-.8, .6], [-.12, .6]];
      parts.push(hardPlan("两侧车道方向相反且连成单向环流的地面箭头", white, arrow.map(([x, z]) => [x, z * side]), .015, [side * 7, .145, 0]));
    }
    for (const end of [-1, 1]) parts.push(profileBody("从中央步岛端部真实下降接入过街带的短缓坡", paving, [[-.95, 0], [.95, 0], [.95, .14], [-.95, .32]], 2.8, [0, 0, end * 21.95], end > 0 ? -90 : 90));
    for (const z of [-24, 24]) for (let i = 0; i <= 40; i++) crossing.push([-16 + i * .8, .15, z]);
    parts.push(...boxBatch("双停车带真实独立车位的窄分界线", white, lines, [6.2, .02, .06]), ...boxBatch("车位后端低矮独立止轮块", stone, stops, [.18, .12, 1.6]), ...boxBatch("中央步岛端部与外围坡口相接的完整过街带", white, crossing, [.45, .02, 2.2]));
    return parts;
  }, "设施", "现代"),
  design("纵沟侧行雨水步行街", "两条同高公共步街沿连续下凹雨沟分开，宽横桥真实连通两岸且桥下保留外排空隙，种植土带和中央静态浅水槽贯穿整段，端部坡口分别接回地面", () => {
    const parts: ModelPart[] = [box("连续雨沟完整落地槽底", 0, .03, 0, 4, .06, 60, stone), box("雨沟中央连续浅水示意带", 0, .16, 0, .8, .02, 60, "#819f9b")];
    for (const side of [-1, 1]) {
      parts.push(box("雨沟两岸真实独立且同高的完整公共步街", side * 4.5, .175, 0, 5, .35, 60, paving), box("保留中央水槽的连续雨庭种植土带", side * 1.2, .1, 0, 1.4, .08, 60, soil), box("槽岸连续低挡边", side * 1.95, .175, 0, .1, .35, 60, stone));
      for (const [a, b] of [[-30, -12], [-10, 10], [12, 30]]) parts.push(box("街外沿为侧向出口分段的宽坐墙", side * 7.1, .425, (a! + b!) / 2, .3, .85, b! - a!, stone), box("坐墙顶部连续宽坐面", side * 7.1, .89, (a! + b!) / 2, .5, .08, b! - a!, paving));
      for (const end of [-1, 1]) parts.push(profileBody("端部公共步街独立落地的连续缓坡", paving, [[-1.05, 0], [1.05, 0], [1.05, .35]], 5, [side * 4.5, 0, end * 31.05], end < 0 ? -90 : 90));
      for (const [a, b] of [[-30, -24], [-20, -9], [-5, 6], [10, 21], [25, 30]]) parts.push(box("雨庭土带内为跨沟桥留空的低矮地被带", side * 1.25, .15, (a! + b!) / 2, 1.15, .02, b! - a!, grass));
    }
    for (const z of [-22, -7, 8, 23]) parts.push(box("真实连接两岸且底下保留水槽通路的完整横桥", 0, .29, z, 4.3, .12, 2.2, paving));
    return parts;
  }, "设施", "现代"),
  design("错台通坡社区阶巷", "低中高三处公共巷庭由居中宽阶逐段连接，两条交错侧坡另行绕过高差并接入相应平台，侧缘挡护为每处坡口留出实际通行缺口", () => {
    const parts: ModelPart[] = [box("低位巷口完整落地公共平台", 0, .1, -25, 12, .2, 10, paving), box("中位巷庭完整落地公共平台", 0, .9, -6, 12, 1.8, 20, paving), box("高位巷庭完整落地公共平台", 0, 1.7, 18, 12, 3.4, 20, paving), riseSteps("低位巷口居中接入中庭的完整宽阶", .2, 1.8, 8, .5, 4, [0, 0, -20]), riseSteps("中位巷庭居中接入高庭的完整宽阶", 1.8, 3.4, 8, .5, 4, [0, 0, 4])];
    for (const [x, z, low, high] of [[8, -30, .2, 1.8], [-8, -6, 1.8, 3.4]]) {
      parts.push(profileBody("两端实际变为平坡并接入相邻平台的完整绕行实坡", paving, [[0, 0], [17.4, 0], [17.4, high!], [16, high!], [1.4, low!], [0, low!]], 2.4, [x!, 0, z!], -90));
      for (const side of [-1, 1]) {
        const outside = side === Math.sign(x!), guard: [number, number][] = outside ? [[0, low!], [1.4, low!], [16, high!], [17.4, high!], [17.4, high! + 1.1], [16, high! + 1.1], [1.4, low! + 1.1], [0, low! + 1.1]] : [[1.4, low!], [16, high!], [16, high! + 1.1], [1.4, low! + 1.1]];
        parts.push(profileBody("随侧坡升高并为两端侧向接入口实际留空的防护墙", metal, guard, .1, [x! + side * 1.25, 0, z!], -90));
      }
      for (const [end, y] of [[0, low!], [16, high!]]) parts.push(box("公共巷庭实际连到侧坡平坡端的接入口台", Math.sign(x!) * 7.6, y! / 2, z! + end! + .7, 3.2, y!, 1.4, paving));
    }
    for (const side of [-1, 1]) {
      const ranges = side > 0 ? [[-28.6, -20, .2], [-16, -14, 1.8], [-12.6, 4, 1.8], [8, 28, 3.4]] : [[-30, -20, .2], [-16, -6, 1.8], [-4.6, 4, 1.8], [8, 10, 3.4], [11.4, 28, 3.4]];
      for (const [a, b, y] of ranges) parts.push(box("公共平台侧缘为实际侧坡接入口留空的挡护段", side * 5.9, y! + .55, (a! + b!) / 2, .2, 1.1, b! - a!, stone));
      for (const [z, y] of [[-16, 1.8], [8, 3.4]]) parts.push(box("高平台前沿为中央上行宽阶保留开口的挡护", side * 4.05, y! + .55, z!, 3.7, 1.1, .18, stone));
    }
    return parts;
  }, "设施", "现代"),
];
