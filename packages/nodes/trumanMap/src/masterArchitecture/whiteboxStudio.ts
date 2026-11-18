import { DEG, SLAB, WB, WT, door, white, win, type Op } from "./whitebox";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·影棚与布景：摄影棚（带屋架、灯位格栅、环廊）、放大尺度的布景房间（四壁封顶 / 三壁封顶 / 三壁敞顶）、天花板与屋顶组件。
// 尺度原则：房间比真实住宅放大（面宽 6–15m、净高 3.3–4.2m）以留出机位、轨道和灯位；家具和门窗仍按真实尺寸（门 2.1 高、桌 0.75 高、床 1.8×2.0、沙发 2.2×0.9）。
const spec = "原点在平面中心，+z 为正面，楼板顶面标高 0.2；比真实房间放大，留出机位和打光空间";

// ---------- 家具体量（真实尺寸的白模体量） ----------
export class Furn {
  constructor(readonly b: WB, readonly y: number) {}
  /** 世界对齐的体量：中心 (x,z)、底标高 y0（相对楼面）、尺寸 sx×sy×sz。 */
  blk(x: number, z: number, y0: number, sx: number, sy: number, sz: number, key = "furn") { this.b.box(key, x, this.y + y0 + sy / 2, z, sx, sy, sz); }
  /** 带偏航的体量，(u,v) 是以 (x,z) 为原点的局部偏移（u 沿局部 x，v 沿局部 z，正面朝 +v）。 */
  loc(x: number, z: number, yaw: number, u: number, v: number, y0: number, sx: number, sy: number, sz: number, key = "furn") {
    const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG); this.b.boxYaw(key, x + u * c + v * s, this.y + y0 + sy / 2, z - u * s + v * c, sx, sy, sz, yaw);
  }
  sofa(x: number, z: number, yaw: number, w = 2.2) { this.loc(x, z, yaw, 0, 0, 0, w, .45, .9); this.loc(x, z, yaw, 0, -.35, .45, w, .4, .2); for (const s of [-1, 1]) this.loc(x, z, yaw, s * (w / 2 - .1), 0, .45, .2, .25, .8); }
  chair(x: number, z: number, yaw: number) { this.loc(x, z, yaw, 0, 0, .42, .45, .05, .45); this.loc(x, z, yaw, 0, -.2, .47, .45, .45, .05); for (const [u, v] of [[-.19, -.19], [.19, -.19], [-.19, .19], [.19, .19]] as [number, number][]) this.loc(x, z, yaw, u, v, 0, .04, .42, .04); }
  table(x: number, z: number, w: number, d: number, h = .75) { this.blk(x, z, h - .05, w, .05, d); for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.blk(x + sx * (w / 2 - .06), z + sz * (d / 2 - .06), 0, .06, h - .05, .06); }
  desk(x: number, z: number, w = 1.4, d = .7) { this.table(x, z, w, d); this.blk(x + w / 2 - .25, z, .1, .4, .55, d - .1); }
  bed(x: number, z: number, yaw: number, w = 1.8, l = 2.0) { this.loc(x, z, yaw, 0, 0, 0, w, .3, l); this.loc(x, z, yaw, 0, .03, .3, w - .1, .22, l - .1); this.loc(x, z, yaw, 0, -l / 2 + .04, .3, w, .7, .08); for (const s of [-1, 1]) this.loc(x, z, yaw, s * w * .24, -l / 2 + .3, .52, w * .38, .12, .35); }
  rtable(x: number, z: number, r = .6, h = .75) { this.b.cyl("furn", x, z, this.y + h - .05, this.y + h, r, 16); this.b.cyl("furn", x, z, this.y, this.y + h - .05, .1, 8); }
}

export type RoomSpec = { label: string; W: number; D: number; H: number; back: Op[]; left: Op[]; right: Op[]; front: Op[]; furn: (f: Furn, b: WB) => void; tags?: string[] };
const roomVariants = ["四壁封顶", "三壁封顶·前侧敞开", "三壁敞顶·前侧敞开"] as const;
export function roomSet(r: RoomSpec): ArchitecturePrototype[] {
  return roomVariants.map(v => white(`白模·布景·${r.label}·${r.W}m×${r.D}m·净高${r.H}m·${v}`,
    `白模预演影棚布景：${r.label}，净面积 ${r.W}×${r.D}m、净高 ${r.H}m，${v}${v === "三壁敞顶·前侧敞开" ? "（无天花板，便于俯拍和布灯）" : "，带「天花板」和「灯位格栅」两个独立材质组"}；${spec}；门 2.1 高，窗按真实尺寸，家具体量按真实比例`, "现代", b => {
      const { W, D, H } = r, y = SLAB, ox = W / 2 + WT, oz = D / 2 + WT;
      b.slab(-ox, -oz, ox, oz, y); b.wall("x", -D / 2 - WT / 2, -ox, ox, y, H, WT, r.back); b.wall("z", -W / 2 - WT / 2, -oz, oz, y, H, WT, r.left); b.wall("z", W / 2 + WT / 2, -oz, oz, y, H, WT, r.right);
      if (v === "四壁封顶") b.wall("x", D / 2 + WT / 2, -ox, ox, y, H, WT, r.front);
      r.furn(new Furn(b, y), b);
      if (v !== "三壁敞顶·前侧敞开") { b.ceiling(-ox, -oz, ox, oz, y + H, .1); for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box("rig", sx * (W / 2 - .1), y + H + .4, sz * (D / 2 - .1), .1, .6, .1); b.lightGrid(-W / 2 + .1, -D / 2 + .1, W / 2 - .1, D / 2 - .1, y + H + .7, 1.2, 1.2); }
    }, ["布景", "影棚布景", "房间", r.label, v, ...(r.tags ?? [])]));
}

const rooms: RoomSpec[] = [
  { label: "客厅", W: 8.4, D: 6.6, H: 3.6, back: [win(-2.4, 2.4, 1.8, .9), win(2.4, 2.4, 1.8, .9)], left: [door(-1.5)], right: [door(2.2)], front: [win(-2.4, 1.8, 1.5, .9), door(2.4, 1.8)],
    furn: f => { f.blk(3.95, -.5, 0, .45, .5, 1.8); f.blk(4.18, -.5, .9, .05, .7, 1.2); f.sofa(.6, -.5, 90, 2.4); f.loc(1.9, -.5, 90, 0, 0, 0, 1.2, .45, .6); f.sofa(1.9, -2.5, 0, .9); f.sofa(1.9, 1.5, 180, .9); f.table(-2.6, -2.2, 1.6, .9); for (const [x, z, yaw] of [[-3.0, -2.95, 0], [-2.2, -2.95, 0], [-3.0, -1.45, 180], [-2.2, -1.45, 180]] as [number, number, number][]) f.chair(x, z, yaw); f.blk(-3.95, 1.5, 0, .35, 2.0, 1.6); }, tags: ["住宅", "家庭"] },
  { label: "主卧", W: 6.6, D: 6.0, H: 3.3, back: [win(0, 2.4, 1.5, .9)], left: [door(1.8)], right: [win(-1.0, 1.8, 1.5, .9)], front: [door(-2.0), win(2.0, 1.8, 1.5, .9)],
    furn: f => { f.bed(0, -2.0, 0, 1.8, 2.0); for (const s of [-1, 1]) f.blk(s * 1.35, -2.75, 0, .5, .5, .4); f.blk(-3.0, .3, 0, .6, 2.2, 1.8); f.desk(2.8, 1.4, 1.4, .6); f.chair(2.2, 1.4, 270); }, tags: ["住宅", "卧室"] },
  { label: "厨房餐厅", W: 7.2, D: 5.4, H: 3.3, back: [win(-1.5, 1.8, 1.2, 1.0)], left: [door(1.5)], right: [], front: [door(1.5, 1.8)],
    furn: f => { f.blk(-1.2, -2.4, 0, 4.8, .9, .6); f.blk(-1.2, -2.52, 1.4, 4.8, .7, .35); f.blk(-3.3, -.5, 0, .6, .9, 3.0); f.blk(2.9, -2.35, 0, .7, 1.8, .7); f.blk(-.8, .3, 0, 2.0, .9, .9); f.table(2.0, 1.3, 1.5, .9); for (const [x, z, yaw] of [[1.6, .65, 0], [2.4, .65, 0], [1.6, 1.95, 180], [2.4, 1.95, 180]] as [number, number, number][]) f.chair(x, z, yaw); }, tags: ["住宅", "厨房"] },
  { label: "卫生间", W: 4.2, D: 3.6, H: 3.0, back: [win(1.0, .6, .6, 1.5)], left: [], right: [door(.6, .9)], front: [door(-1.0, .9)],
    furn: f => { f.blk(-1.15, -1.4, 0, 1.7, .55, .75); f.blk(1.4, -1.55, 0, .4, .4, .45); f.blk(1.4, -1.72, .4, .4, .4, .2); f.blk(1.75, .4, 0, .5, .85, .9); f.blk(1.95, .4, 1.1, .04, .7, .6); }, tags: ["住宅", "浴室"] },
  { label: "经理办公室", W: 7.2, D: 6.0, H: 3.3, back: [win(0, 3.6, 1.8, .9)], left: [door(1.5)], right: [], front: [door(-1.5)],
    furn: f => { f.table(0, -1.6, 1.8, .9); f.chair(0, -2.5, 0); for (const s of [-1, 1]) f.chair(s * .7, -.5, 180); f.blk(3.3, -1.8, 0, .4, 2.1, 3.0); f.sofa(-2.8, 1.4, 90, 2.2); f.loc(-1.7, 1.4, 90, 0, 0, 0, 1.0, .45, .6); }, tags: ["办公", "经理室"] },
  { label: "会议室", W: 10.2, D: 6.6, H: 3.6, back: [], left: [door(2.0)], right: [win(-1.8, 2.4, 1.8, .9), win(1.8, 2.4, 1.8, .9)], front: [door(-3.0)],
    furn: f => { f.blk(0, -3.25, 1.0, 3.6, 1.6, .1); f.blk(3.6, -3.25, 1.1, 1.8, 1.2, .05); f.table(0, -.3, 5.4, 1.5); for (let i = 0; i < 6; i++) { f.chair(-2.25 + i * .9, -1.3, 0); f.chair(-2.25 + i * .9, .7, 180); } f.chair(-3.2, -.3, 90); f.chair(3.2, -.3, 270); }, tags: ["办公", "会议"] },
  { label: "开放办公", W: 15, D: 10.8, H: 3.9, back: [win(-4.5, 3, 1.8, .9), win(0, 3, 1.8, .9), win(4.5, 3, 1.8, .9)], left: [door(0)], right: [win(-2.5, 3, 1.8, .9), win(2.5, 3, 1.8, .9)], front: [door(0, 1.8)],
    furn: (f) => { for (const x of [-5, 5]) for (const z of [-2.7, 2.7]) f.blk(x, z, 0, .6, 3.9, .6, "struct"); for (let c = 0; c < 4; c++) for (let r = 0; r < 3; r++) { const x = -5.4 + c * 3.6, z = -3.6 + r * 2.7; f.desk(x, z, 1.4, .7); f.chair(x, z + .75, 180); f.desk(x + 1.5, z, 1.4, .7); f.chair(x + 1.5, z + .75, 180); } }, tags: ["办公", "开放办公"] },
  { label: "酒店客房", W: 7.8, D: 5.4, H: 3.3, back: [win(0, 3.0, 2.1, .3)], left: [], right: [], front: [door(-3.0)],
    furn: (f, b) => { b.wall("z", -1.5, -2.7, -.3, SLAB, 3.3, .1, [door(-1.2)]); b.wall("x", -.3, -3.9, -1.5, SLAB, 3.3, .1); f.bed(.6, -1.6, 0, 2.0, 2.0); for (const s of [-1, 1]) f.blk(.6 + s * 1.5, -2.5, 0, .5, .5, .4); f.desk(3.0, -2.3, 1.4, .6); f.chair(3.0, -1.6, 180); f.blk(-1.4, 1.2, 0, 1.2, .5, .45); f.blk(-1.4, 1.2, 1.2, .05, .7, 1.2); f.blk(2.9, 1.2, 0, .6, 2.1, 1.2); }, tags: ["酒店", "客房"] },
  { label: "教室", W: 10.8, D: 8.4, H: 3.6, back: [], left: [win(-2.4, 1.8, 1.8, .9), win(0, 1.8, 1.8, .9), win(2.4, 1.8, 1.8, .9)], right: [door(2.0), door(-2.0)], front: [door(-3.5, 1.2)],
    furn: f => { f.blk(0, -4.15, 1.0, 4.2, 1.2, .05); f.blk(0, -3.4, 0, 3.6, .15, 1.2); f.table(0, -3.3, 1.2, .6); for (let c = 0; c < 4; c++) for (let r = 0; r < 5; r++) { const x = -3.9 + c * 2.6, z = -1.8 + r * 1.2; f.table(x, z, .6, .45); f.chair(x, z + .55, 180); f.table(x + .9, z, .6, .45); f.chair(x + .9, z + .55, 180); } f.blk(4.9, -3.6, 0, .4, 2.0, 1.8); }, tags: ["学校", "课堂"] },
  { label: "病房", W: 8.4, D: 6.0, H: 3.6, back: [win(0, 2.4, 1.5, 1.0)], left: [], right: [door(1.8, 1.2)], front: [door(-2.5, 1.2)],
    furn: f => { for (const s of [-1, 1]) { f.blk(s * 1.9, -1.85, .35, .9, .22, 2.0); f.blk(s * 1.9, -1.85, 0, .7, .35, 1.6); f.blk(s * 1.9, -2.88, .35, .9, .8, .06); f.blk(s * 1.9 + s * .75, -2.5, 0, .5, .6, .4); f.chair(s * 1.9 + s * 1.0, -.8, s < 0 ? 90 : 270); } f.blk(0, -2.9, 1.0, 2.2, .8, .05); }, tags: ["医院", "病房"] },
  { label: "餐厅", W: 12, D: 9, H: 4.2, back: [win(-3.5, 2.4, 1.8, .9), win(3.5, 2.4, 1.8, .9)], left: [door(2.0, 1.8)], right: [], front: [door(0, 1.8)],
    furn: f => { f.blk(5.2, -.5, 0, .8, 1.1, 6.0); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const x = -4.2 + i * 2.4, z = -1.6 + j * 3.0; f.rtable(x, z, .6); for (let k = 0; k < 4; k++) f.chair(x + Math.cos(k * 1.5708) * .95, z + Math.sin(k * 1.5708) * .95, -k * 90 + 90); } }, tags: ["餐饮", "餐厅"] },
];

// ---------- 摄影棚 ----------
function stage(label: string, W: number, D: number, grid: number, doorW: number, doorH: number, cyc: boolean) {
  return white(`白模·影棚·${label}·${W}m×${D}m·净高${grid}m${cyc ? "·带环幕" : ""}`,
    `白模预演摄影棚：${label}，净面积 ${W}×${D}m、灯位格栅标高 ${grid}m，桁架屋面（脊高约 ${(grid + 1.4 + D / 2 * Math.tan(5 * DEG)).toFixed(1)}m）、灯位格栅带次管、两侧环廊、正面两扇 ${doorW}×${doorH}m 大门洞加一扇人行门${cyc ? "、后墙两角环幕" : ""}，棚内无柱留出机位和布景空间；原点在平面中心、地面顶面标高 0.3，+z 为大门一侧`, "现代", b => {
      const t = .4, y0 = .3, eave = grid + 1.4, ox = W / 2 + t, oz = D / 2 + t;
      b.slab(-ox, -oz, ox, oz, y0, .3);
      b.wall("x", -D / 2 - t / 2, -ox, ox, y0, eave - y0, t); b.wall("z", -W / 2 - t / 2, -oz, oz, y0, eave - y0, t); b.wall("z", W / 2 + t / 2, -oz, oz, y0, eave - y0, t);
      b.wall("x", D / 2 + t / 2, -ox, ox, y0, eave - y0, t, [door(-W / 4, doorW, doorH), door(W / 4, doorW, doorH), door(0, 1.0, 2.1)]);
      b.trussRoof(-ox, -oz, ox, oz, eave, 6, 5, .5);
      for (let x = -W / 2 + 3; x <= W / 2 - 2.9; x += 3) b.box("rig", x, grid - .3, 0, .3, .6, D - .6);
      for (let z = -D / 2 + 1.5; z <= D / 2 - 1.4; z += 1.5) b.box("rig", 0, grid - .65, z, W - .6, .08, .08);
      for (const s of [-1, 1]) { b.slab(-W / 2, s * (D / 2) - (s > 0 ? 1.2 : 0), W / 2, s * (D / 2) + (s > 0 ? 0 : 1.2), grid - .9, .1); b.rail(-W / 2, s * (D / 2 - 1.2), W / 2, s * (D / 2 - 1.2), grid - .9); }
      if (cyc) for (const sd of [-1, 1]) { const R = Math.min(6, D / 3), dl = Math.PI / 16; for (let k = 0; k < 8; k++) { const am = (k + .5) * dl, ad = am / DEG; b.boxYaw("cyc", sd * (W / 2 - R + R * Math.cos(am)), y0 + 3.5, -D / 2 + R - R * Math.sin(am), 2 * R * Math.sin(dl / 2) + .05, 7.0, .1, sd > 0 ? ad - 90 : 90 - ad); } }
    }, ["影棚", "摄影棚", "棚", "建筑"]);
}

// ---------- 天花板与屋顶组件 ----------
const ceilMod = (name: string, what: string, build: (b: WB) => void) => white(`白模·天花·${name}`, `白模预演天花板组件：${what}；原点在平面中心，底面 y=0，放置高度取吊顶底标高，+z 为正面`, "现代", build, ["组件", "天花板", "模块"]);
const roofMod = (name: string, what: string, build: (b: WB) => void) => white(`白模·屋顶·${name}`, `白模预演屋顶组件：${what}；原点在平面中心，底面 y=0，放置高度取墙顶标高，+z 为正面`, "现代", build, ["组件", "屋顶", "模块"]);

export const whiteStudioDesigns: ArchitecturePrototype[] = [
  stage("小棚", 18, 12, 6, 4.5, 4.5, false), stage("标准棚", 30, 21, 8, 6, 6, false), stage("标准棚", 30, 21, 8, 6, 6, true), stage("大棚", 42, 30, 10, 6, 6, false), stage("超大棚", 60, 36, 12, 7.5, 7.5, true),
  ...rooms.flatMap(roomSet),
  ...([[6, 6], [9, 6], [12, 9], [18, 12]] as [number, number][]).map(([w, d]) => ceilMod(`吊顶板·${w}m×${d}m·厚0.1m`, `${w}×${d}m 平吊顶板，厚 0.1m`, b => b.ceiling(-w / 2, -d / 2, w / 2, d / 2, 0))),
  ceilMod("井格吊顶·6m×6m", "6×6m 井格吊顶，板下 0.25m 高格梁每 1.5m 一道", b => { b.ceiling(-3, -3, 3, 3, .25); for (let k = 0; k <= 4; k++) { const v = -3 + k * 1.5; b.box("ceil", 0, .125, v, 6, .25, .2); b.box("ceil", v, .125, 0, .2, .25, 6); } }),
  ceilMod("带灯槽吊顶·6m×6m", "6×6m 吊顶板，开 0.6m 宽灯槽三道，板上 0.7m 处架灯位格栅", b => { b.ceiling(-3, -3, 3, 3, 0, .1, [[-2.1, -2.7, -1.5, 2.7], [-.3, -2.7, .3, 2.7], [1.5, -2.7, 2.1, 2.7]]); b.lightGrid(-3, -3, 3, 3, .7, 1.2, 1.2); }),
  ceilMod("灯位格栅·12m×9m·管距1.2m", "12×9m 灯位格栅，管径 0.05m，纵横管距 1.2m，吊在棚顶下", b => b.lightGrid(-6, -4.5, 6, 4.5, 0, 1.2, 1.2)),
  ...([[12, 9], [18, 12]] as [number, number][]).map(([w, d]) => roofMod(`平屋面女儿墙·${w}m×${d}m`, `${w}×${d}m 平屋面板加 1.0m 高女儿墙`, b => { b.slab(-w / 2, -d / 2, w / 2, d / 2, SLAB, SLAB, undefined, "roof"); b.wall("x", -d / 2 + .1, -w / 2, w / 2, SLAB, 1.0, WT); b.wall("x", d / 2 - .1, -w / 2, w / 2, SLAB, 1.0, WT); b.wall("z", -w / 2 + .1, -d / 2 + .2, d / 2 - .2, SLAB, 1.0, WT); b.wall("z", w / 2 - .1, -d / 2 + .2, d / 2 - .2, SLAB, 1.0, WT); })),
  ...([[12, 9, 25], [18, 12, 20]] as [number, number, number][]).map(([w, d, p]) => roofMod(`双坡屋顶·${w}m×${d}m·${p}度`, `${w}×${d}m 双坡屋顶，坡度 ${p}°，下带 0.4m 圈梁，山墙朝 ±x`, b => { b.box("struct", 0, .2, -d / 2 + .1, w, .4, .2); b.box("struct", 0, .2, d / 2 - .1, w, .4, .2); b.box("struct", -w / 2 + .1, .2, 0, .2, .4, d - .4); b.box("struct", w / 2 - .1, .2, 0, .2, .4, d - .4); b.gable(-w / 2, -d / 2, w / 2, d / 2, .4, p, .5); })),
  ...([[9, 9], [12, 9]] as [number, number][]).map(([w, d]) => roofMod(`四坡屋顶·${w}m×${d}m·25度`, `${w}×${d}m 四坡屋顶，坡度 25°，檐口外挑 0.5m，下带 0.4m 圈梁`, b => { b.box("struct", 0, .2, -d / 2 + .1, w, .4, .2); b.box("struct", 0, .2, d / 2 - .1, w, .4, .2); b.box("struct", -w / 2 + .1, .2, 0, .2, .4, d - .4); b.box("struct", w / 2 - .1, .2, 0, .2, .4, d - .4); b.hip(-w / 2, -d / 2, w / 2, d / 2, .4, 25, .5); })),
  roofMod("锯齿屋面·18m×12m·三齿", "18×12m 三齿锯齿屋面，坡面 20° 向 +z 升起，每齿高端竖直采光玻璃，用于厂房和仓库", b => b.sawtooth(-9, -6, 9, 6, 0, 3, 20)),
  roofMod("筒拱屋面·18m×12m·矢高3m", "18×12m 筒拱屋面，拱脚标高 0、矢高 3m，脊线沿 x，用于车站、体育馆和仓库", b => b.vault(-9, 9, -6, 6, 0, 3, 12)),
  ...([[24, 18], [30, 21]] as [number, number][]).map(([w, d]) => roofMod(`桁架屋面·${w}m×${d}m·榀距6m`, `${w}×${d}m 钢桁架屋面，桁架跨度 ${d}m 沿 z、每 6m 一榀，上铺 5° 双坡屋面板，用于影棚、厂房和展厅`, b => b.trussRoof(-w / 2, -d / 2, w / 2, d / 2, 0, 6, 5, .5))),
  roofMod("采光天窗·6m×6m", "6×6m 采光天窗：0.4m 高窗台围护加平板玻璃顶", b => { b.wall("x", -2.9, -3, 3, 0, .4, .2); b.wall("x", 2.9, -3, 3, 0, .4, .2); b.wall("z", -2.9, -2.8, 2.8, 0, .4, .2); b.wall("z", 2.9, -2.8, 2.8, 0, .4, .2); b.box("glass", 0, .45, 0, 5.8, .06, 5.8); for (const v of [-1.9, 0, 1.9]) { b.box("struct", v, .5, 0, .08, .08, 5.8); b.box("struct", 0, .5, v, 5.8, .08, .08); } }),
];
