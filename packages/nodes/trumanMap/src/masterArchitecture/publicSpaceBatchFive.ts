import { part, ring, type ModelPart } from "../assetModelParts";
import { box, cylinder, design, rail, colors } from "./structures";
import { halfRoundWall } from "./spatialShells";
import { polygon } from "../masterNature/shared";
import { doorway, arcDeck } from "./publicSpaceBatchOne";

const dark = "#52686d", paving = "#b5b29d", wood = "#ac926a", white = "#d8ddd0";
type PaintRect = { x: number; z: number; width: number; depth: number };
export type TrackSample = { x: number; z: number; nx: number; nz: number; bank: number; height?: number; base?: number };

// 球场尺寸采用公开规则的名义尺寸，几何为本地原创简化形体，不包含远端模型或贴图。
// https://www.itftennis.com/media/15607/wta-2026-rulebook.pdf
// https://worldathletics.org/about-iaaf/documents/technical-information
// https://www.uci.org/article/what-is-track-cycling/6yFQsdYGiuw1bIWiLS6Hxq
// https://blob.iihf.com/iihf-media/iihfmvc/media/downloads/projects/ice%20rink%20guide/240926_iihf_ice_arena_guide_2024-september_12_fin.pdf
// https://www.paralympic.org/badminton
export const publicSpaceBatchFiveDesigns = [
  design("双场硬地网球中心", "双打与单打边线、发球区和中央低垂球网按米制排布，两块完整场地之间保留独立观众连廊与有顶休息区", tennisCenter, "建筑", "现代"),
  design("半圆弯道综合田径场", "两段84.39米直道连接36.5米内缘半圆弯道，完整八道环形跑道围住内场，双侧连续阶台与跑道分开", athleticsStadium, "建筑", "现代"),
  design("变倾角弯坡自行车赛车场", "完整木色环场由直道和半圆弯道连续连接，直道中部的低倾角平滑过渡到高倾角弯道，外缘护栏随赛道起伏", velodrome, "建筑", "现代"),
  design("弧角板墙冰球比赛馆", "六十乘三十米弧角冰面由低板墙和上方透明防护围合，球员入口保留真正缺口，场边候场席与两端球门独立设置", hockeyArena, "建筑", "现代"),
  design("多场地高净空羽毛球馆", "四块六点一乘十三点四米场地保留各自短发球线和边线，分道幕位与高净空无柱屋面共同围出完整训练馆", badmintonHall, "建筑", "现代"),
];

export function paint(name: string, color: string, rectangles: PaintRect[], height: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const r of rectangles) { const n = vertices.length; vertices.push({ x: r.x - r.width / 2, y: height, z: r.z - r.depth / 2 }, { x: r.x + r.width / 2, y: height, z: r.z - r.depth / 2 }, { x: r.x + r.width / 2, y: height, z: r.z + r.depth / 2 }, { x: r.x - r.width / 2, y: height, z: r.z + r.depth / 2 }); indices.push(n, n + 2, n + 1, n, n + 3, n + 2); }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function roundedOutline(width: number, depth: number, radius: number): [number, number][] {
  return [[width / 2 - radius, depth / 2 - radius, 0], [-width / 2 + radius, depth / 2 - radius, 90], [-width / 2 + radius, -depth / 2 + radius, 180], [width / 2 - radius, -depth / 2 + radius, 270]].flatMap(([x, z, angle]) => Array.from({ length: 7 }, (_, i): [number, number] => { const a = (angle! + i * 15) * Math.PI / 180; return [x! + Math.cos(a) * radius, z! + Math.sin(a) * radius]; }));
}

function tennisCenter(): ModelPart[] {
  const p: ModelPart[] = [box("网球中心整体落地基础", 0, .15, 0, 43, .3, 41, paving), box("双场之间有顶观众休息廊", 0, 3.65, 0, 3, .18, 38, dark)];
  for (const x of [-10.5, 10.5]) {
    p.push(box("每块完整硬地网球场面层", x, .32, 0, 18.3, .04, 36.6, "#779b95"));
    const lines: PaintRect[] = [];
    for (const side of [-1, 1]) lines.push({ x: x + side * 5.485, z: 0, width: .05, depth: 23.77 }, { x: x + side * 4.115, z: 0, width: .05, depth: 23.77 }, { x, z: side * 11.885, width: 10.97, depth: .05 }, { x, z: side * 6.4, width: 8.23, depth: .05 }, { x, z: side * 3.2, width: .05, depth: 6.4 });
    p.push(paint("独立完整网球场白色界线", white, lines, .345), part("中央低垂且两端接柱的网球网面", "extrude", dark, [x, .34, 0], [1, 1, 1], [0, 0, 0], { depth: .015, profile: [{ x: -6.399, y: .03 }, { x: 6.399, y: .03 }, { x: 6.399, y: 1.07 }, { x: 0, y: .914 }, { x: -6.399, y: 1.07 }], opacity: .65 }));
    for (const side of [-1, 1]) p.push(cylinder("网球场两端独立球网柱", x + side * 6.399, .875, 0, .075, 1.07, dark), rail([x + side * 6.399, 1.41, 0], [x, 1.254, 0], .025, white));
  }
  for (const side of [-1, 1]) p.push(part("长边防飞球屏网", "box", dark, [side * 20.5, 2.1, 0], [.04, 3.6, 39], [0, 0, 0], { opacity: .22 }), part("入口两旁保留中央通道的屏网", "box", dark, [side * 11, 2.1, -19.5], [19, 3.6, .04], [0, 0, 0], { opacity: .22 }));
  p.push(part("后端完整防飞球屏网", "box", dark, [0, 2.1, 19.5], [41, 3.6, .04], [0, 0, 0], { opacity: .22 }));
  for (const x of [-20.5, 20.5]) for (const z of [-19.5, -6.5, 6.5, 19.5]) p.push(cylinder("外围屏网落地承柱", x, 2.1, z, .09, 3.6, dark));
  for (const z of [-16, -6, 6, 16]) p.push(box("观众休息廊屋面支柱", 0, 1.98, z, .14, 3.28, .14, dark));
  return p;
}

function athleticsStadium(): ModelPart[] {
  const p: ModelPart[] = [polygon("容纳完整环道与看台的整体场坪", paving, [[-59, -92], [59, -92], [59, 92], [-59, 92]], .2), polygon("环道中央完整运动内场", "#819e7d", [[-34, -52.5], [34, -52.5], [34, 52.5], [-34, 52.5]], .04, [0, .2, 0]), { ...arcDeck("北端八道连续半圆跑道", [0, .26, 42.195], 36.5, 46.26, Math.PI, 0), color: "#af8c73" }, { ...arcDeck("南端八道连续半圆跑道", [0, .26, -42.195], 36.5, 46.26, Math.PI, 0, 0, Math.PI), color: "#af8c73" }];
  for (const side of [-1, 1]) p.push(box("连接两端的平直八道跑道", side * 41.38, .16, 0, 9.76, .2, 84.39, "#af8c73"));
  const lines: PaintRect[] = [];
  for (let lane = 0; lane <= 8; lane++) {
    const radius = 36.5 + lane * 1.22;
    p.push({ ...arcDeck("北弯道连续分道白线", [0, .273, 42.195], radius, radius + .05, Math.PI, 0), color: white }, { ...arcDeck("南弯道连续分道白线", [0, .273, -42.195], radius, radius + .05, Math.PI, 0, 0, Math.PI), color: white });
    for (const side of [-1, 1]) lines.push({ x: side * radius, z: 0, width: .05, depth: 84.39 });
  }
  lines.push({ x: 41.38, z: -35, width: 9.76, depth: .06 }); p.push(paint("两直道的连续分道及终点线", white, lines, .276));
  for (const side of [-1, 1]) for (let row = 0; row < 4; row++) p.push(box("跑道之外连续抬高的观众阶台", side * (48.5 + row * 2.2), .2 + (row + 1) * .7 / 2, 0, 2.2, (row + 1) * .7, 84.39, "#9a9c8d"));
  return p;
}

export function bankedTrack(name: string, samples: TrackSample[], width = 7.5, base = 1.1): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const s of samples) {
    const horizontal = width * Math.cos(s.bank), rise = width * Math.sin(s.bank), height = s.height ?? 1.3;
    const a = { x: s.x, y: height, z: s.z }, b = { x: s.x + s.nx * horizontal, y: height + rise, z: s.z + s.nz * horizontal }, c = { x: a.x, y: s.base ?? base, z: a.z }, d = { x: b.x, y: s.base ?? base, z: b.z };
    vertices.push(a, b, c, d, c, a, b, d);
  }
  const quad = (a: number, b: number, c: number, d: number) => indices.push(a, b, c, a, c, d);
  for (let i = 0; i < samples.length - 1; i++) { const a = i * 8, b = a + 8; quad(a, b, b + 1, a + 1); quad(a + 2, a + 3, b + 3, b + 2); quad(a + 4, b + 4, b + 5, a + 5); quad(a + 6, b + 6, b + 7, a + 7); }
  for (const end of [0, samples.length - 1]) { const n = end * 8, start = vertices.length; vertices.push(vertices[n]!, vertices[n + 1]!, vertices[n + 7]!, vertices[n + 4]!); if (end) quad(start, start + 3, start + 2, start + 1); else quad(start, start + 1, start + 2, start + 3); }
  return part(name, "mesh", wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function velodrome(): ModelPart[] {
  const straight = (250 - 2 * Math.PI * 22) / 2, halves: TrackSample[][] = [];
  for (const half of [0, 1]) {
    const samples: TrackSample[] = [];
    for (let i = 0; i <= 24; i++) { const a = (half * Math.PI) + i / 24 * Math.PI; samples.push({ x: Math.cos(a) * 22, z: (half ? -1 : 1) * straight / 2 + Math.sin(a) * 22, nx: Math.cos(a), nz: Math.sin(a), bank: 43 * Math.PI / 180 }); }
    for (let i = 1; i <= 16; i++) { const u = i / 16, side = half ? 1 : -1; samples.push({ x: side * 22, z: side * straight * (u - .5), nx: side, nz: 0, bank: (13 + 15 * (1 + Math.cos(u * Math.PI * 2))) * Math.PI / 180 }); }
    halves.push(samples);
  }
  const p: ModelPart[] = [polygon("赛车场与内场共同落地高台", paving, [[-36, -59], [36, -59], [36, 59], [-36, 59]], 1.1)];
  for (const samples of halves) {
    p.push(bankedTrack("弯道与直道倾角连续变化的整段跑道", samples));
    const path = samples.map(s => ({ x: s.x + s.nx * 7.5 * Math.cos(s.bank), y: 2.7 + 7.5 * Math.sin(s.bank), z: s.z + s.nz * 7.5 * Math.cos(s.bank) }));
    p.push(part("随外缘坡面连续起伏的顶部防护扶栏", "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .035, path }));
    for (const index of [0, 10, 20, 30]) { const end = path[index]!; p.push(rail([end.x, end.y - 1.4, end.z], [end.x, end.y, end.z], .06, dark)); }
  }
  for (const side of [-1, 1]) for (let row = 0; row < 3; row++) p.push(box("直道外侧逐级抬起的观众阶台", side * (31 + row * 1.6), 1.1 + (row + 1) * .7 / 2, 0, 1.6, (row + 1) * .7, straight, "#9a9d8f"));
  for (const side of [-1, 1]) p.push(part("从地面进入高台内场的宽车行坡", "extrude", paving, [0, 0, side * 61.5], [1, 1, 1], [0, side * 90, 0], { depth: 4.5, profile: [{ x: -2.5, y: 0 }, { x: 2.5, y: 0 }, { x: 2.5, y: 1.1 }, { x: -2.5, y: .025 }] }));
  return p;
}

function hockeyArena(): ModelPart[] {
  const p: ModelPart[] = [box("冰球馆整体承重基础", 0, .15, 0, 48, .3, 76, paving), polygon("真实弧形四角的完整冰面", "#c6d8d4", roundedOutline(30, 60, 8), .03, [0, .3, 0]), doorway("冰球馆前端观众入口", [0, .3, -37.6], 48, 11.5, 3.2), doorway("冰球馆后端疏散入口", [0, .3, 37.6], 48, 11.5, 3.2), ...[-1, 1].map(s => box("冰球馆两侧完整外墙", s * 23.8, 6.05, 0, .3, 11.5, 75.2, paving)), box("冰球馆无柱大跨平顶", 0, 11.95, 0, 48.5, .3, 76.5, dark)];
  for (const [x, z, yaw] of [[7, 22, 0], [-7, 22, -90], [-7, -22, -180], [7, -22, -270]]) {
    p.push(halfRoundWall("冰球冰面角部连续光滑弧形板墙", 8.12, .12, 1.07, [x!, .33, z!], yaw!, "#d4d8cc", Math.PI / 2));
    const glass = halfRoundWall("板墙上方连续透明弧形防护", 8.08, .04, 2.4, [x!, 1.4, z!], yaw!, colors.glass, Math.PI / 2); glass.opacity = .2; p.push(glass);
  }
  for (const z of [-30.06, 30.06]) p.push(box("端部连续低板墙", 0, .865, z, 14, 1.07, .12, "#d4d8cc"), part("端墙上方透明防护", "box", colors.glass, [0, 2.6, z], [14, 2.4, .04], [0, 0, 0], { opacity: .2 }));
  p.push(box("无入口一侧的完整低板墙", 15.06, .865, 0, .12, 1.07, 44, "#d4d8cc"), part("无入口一侧的透明防护", "box", colors.glass, [15.06, 2.6, 0], [.04, 2.4, 44], [0, 0, 0], { opacity: .2 }));
  for (const [z, depth] of [[-14.5, 15], [0, 10], [14.5, 15]]) p.push(box("球员入口之间保留缺口的低板墙", -15.06, .865, z!, .12, 1.07, depth!, "#d4d8cc"), part("同球员门洞一起收头的透明防护", "box", colors.glass, [-15.06, 2.6, z!], [.04, 2.4, depth!], [0, 0, 0], { opacity: .2 }));
  const lines: PaintRect[] = [{ x: 0, z: 0, width: 30, depth: .2 }];
  for (const side of [-1, 1]) lines.push({ x: 0, z: side * 26, width: 24, depth: .05 });
  p.push(paint("冰面中央及两端球门线", "#aa796c", lines, .335), paint("冰球场两条连续蓝线", "#668a9f", [-1, 1].map(side => ({ x: 0, z: side * 7.5, width: 30, depth: .3 })), .336), ring("冰面中央开球圆", "#668a9f", 4.5, .045, .34, .015));
  for (const side of [-1, 1]) {
    const z = side * 26;
    p.push(rail([-.915, .33, z], [-.915, 1.55, z], .055, "#b47562"), rail([.915, .33, z], [.915, 1.55, z], .055, "#b47562"), rail([-.915, 1.55, z], [.915, 1.55, z], .055, "#b47562"), part("球门后方完整有深度的网兜背面", "box", white, [0, .94, z + side * .75], [1.83, 1.22, .02], [0, 0, 0], { opacity: .5 }), rail([-.915, .33, z], [-.915, .33, z + side * .75], .04, "#b47562"), rail([.915, .33, z], [.915, .33, z + side * .75], .04, "#b47562"), box("位于实际入口外的球员长座", -18.2, .78, side * 6, 1.1, .4, 7.5, wood));
    for (let row = 0; row < 3; row++) p.push(box("冰面外侧逐级升起的观众席台", side < 0 ? -20 - row * 1.1 : 18 + row * 1.6, .3 + (row + 1) * .45 / 2, 0, side < 0 ? 1.1 : 1.6, (row + 1) * .45, 57, "#9ca494"));
  }
  return p;
}

function badmintonHall(): ModelPart[] {
  const p: ModelPart[] = [box("多场地羽毛球馆整体地基", 0, .15, 0, 25, .3, 43, paving), doorway("羽毛球馆前方主要入口", [0, .3, -21.3], 25, 12.2, 2.6), doorway("羽毛球馆后方独立出口", [0, .3, 21.3], 25, 12.2, 2.6), ...[-1, 1].map(side => box("羽毛球馆两侧完整墙", side * 12.3, 6.4, 0, .3, 12.2, 42.6, dark)), box("高净空球馆连续无柱屋面", 0, 12.65, 0, 25.5, .3, 43.5, dark)];
  for (const x of [-5.5, 5.5]) for (const z of [-10, 10]) {
    p.push(box("羽毛球场独立弹性面层", x, .32, z, 8.5, .04, 18, "#789b8f"));
    const lines: PaintRect[] = [];
    for (const side of [-1, 1]) lines.push({ x: x + side * 3.05, z, width: .04, depth: 13.4 }, { x: x + side * 2.59, z, width: .04, depth: 13.4 }, { x, z: z + side * 6.7, width: 6.1, depth: .04 }, { x, z: z + side * 5.94, width: 6.1, depth: .04 }, { x, z: z + side * 1.98, width: 6.1, depth: .04 }, { x, z: z + side * 4.34, width: .04, depth: 4.72 });
    p.push(paint("单块球场完整双打及发球区边线", white, lines, .345), part("中央有轻微垂度的羽毛球网面", "extrude", dark, [x, .34, z], [1, 1, 1], [0, 0, 0], { depth: .012, profile: [{ x: -3.05, y: .79 }, { x: 3.05, y: .79 }, { x: 3.05, y: 1.55 }, { x: 0, y: 1.524 }, { x: -3.05, y: 1.55 }], opacity: .6 }));
    for (const side of [-1, 1]) p.push(cylinder("羽毛球场独立球网柱", x + side * 3.05, 1.115, z, .055, 1.55, white));
  }
  for (const z of [-16, 0, 16]) p.push(rail([-12.1, 12.4, z], [12.1, 12.4, z], .2, dark));
  p.push(box("四场之间的顶置分道幕轨", 0, 8, 0, .08, .12, 38, dark));
  return p;
}
