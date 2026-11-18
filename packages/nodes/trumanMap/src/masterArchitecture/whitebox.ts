import type { ModelPart } from "../assetModelParts";
import type { AssetTheme } from "../sceneDocument";
import { Builder } from "./chineseArchKit";
import { design, type ArchitecturePrototype } from "./structures";
import type { P } from "./ruinKit";
import { paintParts } from "./whiteboxPalette";
import { triangles } from "./partMath";

// 建筑白模库的共用套件：只表达体积、比例和结构关系，不做纹理和细部；统一尺度、轴向和材质组，便于检索和拼装。
// 约定（单位 m）：
//   层高 3.0 = 楼板 0.2 + 净高 2.8；第 k 层楼板占 y∈[3k, 3k+0.2]，墙从 3k+0.2 立到 3k+3.0；
//   平面模数 3.0，承重墙厚 0.2、隔墙厚 0.1，墙中心线落在 3m 格线上；
//   原点在平面中心、底面 y=0，+z 是正面（外立面、镜头一侧），+x 向右；
//   标准洞口：单门 1.0×2.1，双开门 1.8×2.1，窗 1.5×1.5（窗台 0.9），落地窗 2.4×2.4（窗台 0.1）；
//   楼梯踏步高 FH/18、宽 0.28、梯段净宽 1.2。
export const FH = 3.0, SLAB = .2, CLEAR = 2.8, WT = .2, PT = .1, RISE = FH / 18, RUN = .28, DEG = Math.PI / 180;

export type Rect = [number, number, number, number];
export type Op = { c: number; w: number; h: number; sill: number; glass: boolean };
export const door = (c: number, w = 1.0, h = 2.1): Op => ({ c, w, h, sill: 0, glass: false });
export const win = (c: number, w = 1.5, h = 1.5, sill = .9): Op => ({ c, w, h, sill, glass: true });

// 细节等级：4 再加踢脚线、方柱柱础柱头、低墙压顶、吊顶线脚、楼梯踏步防滑条和中间扶手、筒拱肋、四坡檐口板；3 勒脚檐口线脚、中梃、柱础柱头、瓦垄、栏杆横栏；2 去掉勒脚檐口线和立面中梃；1 只有窗框和外墙门套；0 原白模。
// white() / whiteAnc() 出口按预算从 3 到 0 逐级试建，取第一个部件和三角形都不超限的结果，所以轻的素材保留全部细节、重的素材自动降级。
let detailLevel = 3;
export const getDetail = () => detailLevel;
export const withDetail = <T>(level: number, f: () => T): T => { const old = detailLevel; detailLevel = level; try { return f(); } finally { detailLevel = old; } };
const finishers: [RegExp, (b: WB) => void][] = [];
/** 登记收尾细化：素材名称匹配 re 时，在素材建好之后调用 f 追加异形素材的专用细部（只在细节等级 ≥2 时执行，见 whiteboxFinish.ts）。 */
export const addFinish = (re: RegExp, f: (b: WB) => void) => { finishers.push([re, f]); };
const fits = (parts: ModelPart[]) => parts.length <= 116 && parts.reduce((s, p) => s + triangles(p as never), 0) <= 46000;
export function buildBudget<B extends WB>(name: string, make: () => B, build: (b: B) => void): ModelPart[] {
  let last: ModelPart[] = [];
  for (const lv of [4, 3, 2, 1, 0]) { last = withDetail(lv, () => { const b = make(); build(b); if (lv >= 2) for (const [re, f] of finishers) if (re.test(name)) f(b); return paintParts(b.parts(), name); }); if (fits(last) || lv === 0) return last; }
  return last;
}

export class WB extends Builder {
  constructor() {
    super();
    this.group("wall", "墙体", "#dcdad4", { roughness: .95 }).group("floor", "楼板", "#bab8b2", { roughness: .95 }).group("struct", "柱梁", "#a4a29c", { roughness: .9 })
      .group("stair", "楼梯", "#cfcdc7", { roughness: .95 }).group("rail", "栏杆", "#8a8883", { roughness: .8 }).group("roof", "屋面", "#8d8b86", { roughness: .95 })
      .group("glass", "玻璃", "#b9cfdc", { roughness: .2, opacity: .4 }).group("equip", "设备", "#7c7a75", { roughness: .8 }).group("seat", "座席", "#c4c2bc", { roughness: .95 })
      .group("furn", "家具", "#c9c7c1", { roughness: .95 }).group("ceil", "天花板", "#e4e2dc", { roughness: .95 }).group("rig", "灯位格栅", "#6a6864", { roughness: .7, metalness: .3 }).group("cyc", "环幕", "#f0efe9", { roughness: .95 })
      .group("frame", "窗框", "#f2f0ea", { roughness: .7 }).group("door", "门扇", "#8a6a4b", { roughness: .85 }).group("trim", "线脚", "#d6d1c4", { roughness: .9 });
  }
  /** 墙：沿 x（z=fixed）或沿 z（x=fixed）从 from 到 to，底 y0、高 h、厚 t；ops 是洞口，窗洞补一片薄玻璃。 */
  wall(axis: "x" | "z", fixed: number, from: number, to: number, y0: number, h: number, t: number, ops: Op[] = [], key = "wall") {
    const seg = (a: number, e: number, ya: number, yb: number) => {
      if (e - a < .01 || yb - ya < .01) return;
      const m = (a + e) / 2, ym = (ya + yb) / 2;
      if (axis === "x") this.box(key, m, ym, fixed, e - a, yb - ya, t); else this.box(key, fixed, ym, m, t, yb - ya, e - a);
    };
    let cur = from;
    for (const o of [...ops].sort((p, q) => p.c - q.c)) {
      if (o.c + o.w / 2 <= from + .001 || o.c - o.w / 2 >= to - .001) continue;
      const a = Math.max(from, o.c - o.w / 2), e = Math.min(to, o.c + o.w / 2);
      seg(cur, a, y0, y0 + h); seg(a, e, y0, y0 + o.sill); seg(a, e, y0 + o.sill + o.h, y0 + h);
      if (o.glass) { const m = (a + e) / 2, ym = y0 + o.sill + o.h / 2; if (axis === "x") this.box("glass", m, ym, fixed, e - a, o.h, .03); else this.box("glass", fixed, ym, m, .03, o.h, e - a); }
      cur = Math.max(cur, e);
    }
    seg(cur, to, y0, y0 + h);
    if (detailLevel >= 1) this.dress(axis, fixed, from, to, y0, h, t, ops, key);
  }
  /** 洞口细部：等级 1 窗补四根窗框、门补门套（贴在墙面上，不占洞口净宽）；等级 2 补中梃、窗台线脚、外墙门扇（向外敞开 90°，室内保持通畅）；等级 3 外墙补勒脚和檐口线。 */
  private dress(axis: "x" | "z", fixed: number, from: number, to: number, y0: number, h: number, t: number, ops: Op[], key: string) {
    const lv = detailLevel, ext = fixed > 0 ? 1 : -1;
    const bx = (k: string, u: number, y: number, du: number, dy: number, dn: number, off = 0) => { if (axis === "x") this.box(k, u, y, fixed + off, du, dy, dn); else this.box(k, fixed + off, y, u, dn, dy, du); };
    for (const o of ops) {
      if (o.c + o.w / 2 <= from + .001 || o.c - o.w / 2 >= to - .001) continue;
      const a = Math.max(from, o.c - o.w / 2), e = Math.min(to, o.c + o.w / 2), w = e - a, c = (a + e) / 2, ya = y0 + o.sill, yb = ya + o.h;
      if (w < .5 || o.h < .5) continue;
      if (o.glass) {
        const f = .06, d = Math.min(t, .14), ym = (ya + yb) / 2;
        bx("frame", a + f / 2, ym, f, o.h, d); bx("frame", e - f / 2, ym, f, o.h, d); bx("frame", c, ya + f / 2, w - 2 * f, f, d); bx("frame", c, yb - f / 2, w - 2 * f, f, d);
        if (lv >= 2) {
          if (w > 1.1) bx("frame", c, ym, .035, o.h - 2 * f, .05);
          if (o.h > 1.3) bx("frame", c, ym, w - 2 * f, .035, .05);
          if (o.sill > .3) bx("trim", c, ya - .024, w + .2, .07, t + .16);
        }
      } else if (o.sill < .05 && o.h >= 1.8 && w <= 3.3 && (lv >= 2 || t >= .19)) {
        const f = .08, dd = t + .04;
        bx("frame", a - f / 2 - .003, y0 + o.h / 2, f, o.h, dd); bx("frame", e + f / 2 + .003, y0 + o.h / 2, f, o.h, dd);
        if (o.h + f <= h) bx("frame", c, y0 + o.h + f / 2 + .003, w + 2 * f, f, dd);
        if (lv >= 2 && t >= .19) {
          const lt = .045, ly = y0 + o.h / 2, lh = o.h - .06, leaf = (hu: number, len: number) => bx("door", hu, ly, lt, lh, len, ext * (t / 2 + .02 + len / 2));
          if (w >= 1.5) { leaf(a + lt / 2, w / 2 - .03); leaf(e - lt / 2, w / 2 - .03); } else leaf(c < (from + to) / 2 ? e - lt / 2 : a + lt / 2, w - .03);
        }
      }
    }
    if (lv >= 3 && key === "wall" && h >= 2.5) {
      const sorted = [...ops].sort((p, q) => p.c - q.c);
      const run = (yc: number, hh: number, dep: number, blocked: (o: Op) => boolean) => {
        let cur = from;
        const put = (a: number, e: number) => { if (e - a > .05) bx("trim", (a + e) / 2, yc, e - a - .008, hh, dep); };
        for (const o of sorted) { if (!blocked(o)) continue; const a = Math.max(from, o.c - o.w / 2), e = Math.min(to, o.c + o.w / 2); if (e <= a) continue; put(cur, a); cur = Math.max(cur, e); }
        put(cur, to);
      };
      if (t >= .19) { run(y0 + .22, .44, t + .06, o => o.sill < .44); run(y0 + h - .06, .14, t + .12, o => o.sill + o.h > h - .14); } else if (lv >= 4) run(y0 + .06, .12, t + .02, o => o.sill < .12);
    }
    // 低墙（女儿墙、矮墙栏板、院墙、窗台围护）墙顶补压顶石。
    if (lv >= 2 && key === "wall" && h < 2.5 && h >= .35 && t >= .09) bx("trim", (from + to) / 2, y0 + h + .03, to - from + .04, .06, t + .1);
  }
  /** 楼板：顶面标高 yTop、厚 t，可挖一个或几个矩形洞 [x0,z0,x1,z1]（楼梯、电梯井）。 */
  slab(x0: number, z0: number, x1: number, z1: number, yTop: number, t = SLAB, hole?: Rect | Rect[], key = "floor") {
    const y = yTop - t / 2;
    let pieces: Rect[] = [[x0, z0, x1, z1]];
    for (const h of hole ? (Array.isArray(hole[0]) ? hole as Rect[] : [hole as Rect]) : []) pieces = pieces.flatMap(([a, c, d, g]) => {
      const [hx0, hz0, hx1, hz1] = h;
      if (hx1 <= a || hx0 >= d || hz1 <= c || hz0 >= g) return [[a, c, d, g] as Rect];
      return ([[a, c, d, Math.max(c, hz0)], [a, Math.min(g, hz1), d, g], [a, Math.max(c, hz0), Math.max(a, hx0), Math.min(g, hz1)], [Math.min(d, hx1), Math.max(c, hz0), d, Math.min(g, hz1)]] as Rect[]).filter(r => r[2] - r[0] > .01 && r[3] - r[1] > .01);
    });
    for (const [a, c, d, g] of pieces) this.box(key, (a + d) / 2, y, (c + g) / 2, d - a, t, g - c);
  }
  col(x: number, z: number, y0: number, y1: number, s = .4, key = "struct") {
    this.box(key, x, (y0 + y1) / 2, z, s, y1 - y0, s);
    if (detailLevel >= 4 && key === "struct" && s >= .4 && y1 - y0 >= 1.8) { this.box("trim", x, y0 + .1, z, s * 1.25, .2, s * 1.25); this.box("trim", x, y1 - .09, z, s * 1.25, .2, s * 1.25); }
  }
  /** 圆柱（12 边形棱柱）。 */
  cyl(key: string, x: number, z: number, y0: number, y1: number, r: number, sides = 12) {
    this.cylBase(key, x, z, y0, y1, r, sides);
    if (detailLevel >= 2 && key === "struct" && r >= .14 && y1 - y0 >= 1.8) { this.cylBase("trim", x, z, y0, y0 + .2, r * 1.3, Math.min(sides, 10)); this.box("trim", x, y1 - .09, z, r * 2.6, .2, r * 2.6); }
  }
  private cylBase(key: string, x: number, z: number, y0: number, y1: number, r: number, sides = 12) {
    const s = this.soup(key, sides * 4 + (sides - 2) * 6);
    for (let k = 0; k < sides; k++) {
      const a0 = k / sides * Math.PI * 2, a1 = (k + 1) / sides * Math.PI * 2, am = (a0 + a1) / 2, p = (a: number, y: number): P => [x + Math.cos(a) * r, y, z + Math.sin(a) * r];
      s.quad(s.vertex(p(a0, y0)), s.vertex(p(a1, y0)), s.vertex(p(a1, y1)), s.vertex(p(a0, y1)), [Math.cos(am), 0, Math.sin(am)]);
    }
    for (const [y, n] of [[y1, 1], [y0, -1]] as [number, number][]) for (let k = 1; k + 1 < sides; k++) { const a = (i: number): P => [x + Math.cos(i / sides * Math.PI * 2) * r, y, z + Math.sin(i / sides * Math.PI * 2) * r]; s.tri(s.vertex(a(0)), s.vertex(a(k)), s.vertex(a(k + 1)), [0, n, 0]); }
  }
  /** 水平梁：沿 x 或 z 方向，顶面 yTop，断面 w×h。 */
  beamH(axis: "x" | "z", fixed: number, from: number, to: number, yTop: number, w = .3, h = .5, key = "struct") {
    if (axis === "x") this.box(key, (from + to) / 2, yTop - h / 2, fixed, to - from, h, w); else this.box(key, fixed, yTop - h / 2, (from + to) / 2, w, h, to - from);
  }
  /** 栏杆：沿 (x0,z0)→(x1,z1)（轴对齐），立柱每 1.2m 一根，扶手一道。y 是栏杆底标高。 */
  rail(x0: number, z0: number, x1: number, z1: number, y: number, h = 1.05) {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.2));
    for (let k = 0; k <= n; k++) this.box("rail", x0 + (x1 - x0) * k / n, y + h / 2, z0 + (z1 - z0) * k / n, .06, h, .06);
    this.box("rail", (x0 + x1) / 2, y + h, (z0 + z1) / 2, Math.abs(x1 - x0) + .06, .05, Math.abs(z1 - z0) + .06);
    if (detailLevel >= 2) for (const f of [.25, .62]) this.box("rail", (x0 + x1) / 2, y + h * f, (z0 + z1) / 2, Math.abs(x1 - x0) + .04, .03, Math.abs(z1 - z0) + .04);
  }
  /** 直跑梯段：从 (x,z) 向 dir 上行，起点标高 y0、n 级、梯段宽 w；默认每级是落地的实心踏步，open 为带侧梁的镂空钢梯。 */
  flight(x: number, z: number, dir: "+x" | "-x" | "+z" | "-z", y0: number, n: number, w = 1.2, rise = RISE, run = RUN, key = "stair", open = false) {
    const sx = dir === "+x" ? 1 : dir === "-x" ? -1 : 0, sz = dir === "+z" ? 1 : dir === "-z" ? -1 : 0, yaw = { "+z": 0, "+x": 90, "-z": 180, "-x": 270 }[dir], ang = Math.atan2(rise, run) / DEG, L = n * run / Math.cos(ang * DEG);
    for (let k = 0; k < n; k++) {
      const off = (k + .5) * run, h = (k + 1) * rise;
      if (open) this.box(key, x + sx * off, y0 + h - .03, z + sz * off, sx ? run : w, .06, sx ? w : run); else this.box(key, x + sx * off, y0 + h / 2, z + sz * off, sx ? run : w, h, sx ? w : run);
      if (detailLevel >= 4 && !open) this.box("trim", x + sx * (k * run + .01), y0 + h - .01, z + sz * (k * run + .01), sx ? .05 : w - .02, .03, sx ? w - .02 : .05);
    }
    if (open) for (const s of [-1, 1]) { const ox = sz ? s * (w / 2 - .03) : 0, oz = sx ? s * (w / 2 - .03) : 0; this.tilt(key, [x + sx * n * run / 2 + ox, y0 + n * rise / 2 + rise / 2 - .1, z + sz * n * run / 2 + oz], [.05, .22, L], yaw, -ang); }
  }
  /** 梯段栏杆：沿梯段两侧（sides 取 -1/1，-1 在行进方向的垂直 -轴一侧）立柱加斜扶手。 */
  stairRails(x: number, z: number, dir: "+x" | "-x" | "+z" | "-z", y0: number, n: number, w = 1.2, sides: (-1 | 1)[] = [-1, 1], rise = RISE, run = RUN) {
    const yaw = { "+z": 0, "+x": 90, "-z": 180, "-x": 270 }[dir], sx = dir === "+x" ? 1 : dir === "-x" ? -1 : 0, sz = dir === "+z" ? 1 : dir === "-z" ? -1 : 0, ang = Math.atan2(rise, run) / DEG, L = n * run / Math.cos(ang * DEG);
    for (const s of sides) {
      const ox = sz ? s * (w / 2 - .03) : 0, oz = sx ? s * (w / 2 - .03) : 0;
      for (let k = 0; k < n; k += 3) { const top = y0 + (k + 1) * rise; this.box("rail", x + sx * (k + .5) * run + ox, top + .45, z + sz * (k + .5) * run + oz, .05, .9, .05); }
      this.tilt("rail", [x + sx * n * run / 2 + ox, y0 + n * rise / 2 + rise / 2 + .9, z + sz * n * run / 2 + oz], [.05, .05, L], yaw, -ang);
      if (detailLevel >= 4) {
        this.tilt("rail", [x + sx * n * run / 2 + ox, y0 + n * rise / 2 + rise / 2 + .45, z + sz * n * run / 2 + oz], [.03, .03, L], yaw, -ang);
        for (const k of [0, n - 1]) { const top = y0 + (k + 1) * rise; this.box("rail", x + sx * (k + .5) * run + ox, top + .5, z + sz * (k + .5) * run + oz, .09, 1.0, .09); }
      }
    }
  }
  /** 沿 z 的斜坡实体：x0..x1 宽、z0..z1 长，坡面高度从 z0 处的 ha 线性升到 z1 处的 hb，底面 y=0。 */
  ramp(x0: number, z0: number, x1: number, z1: number, ha: number, hb: number, key = "floor") {
    const A = (x: number, y: number, z: number): P => [x, y, z];
    this.quad4(key, A(x0, ha, z0), A(x1, ha, z0), A(x1, hb, z1), A(x0, hb, z1), [0, 1, 0]); this.quad4(key, A(x0, 0, z0), A(x1, 0, z0), A(x1, 0, z1), A(x0, 0, z1), [0, -1, 0]);
    this.quad4(key, A(x0, 0, z0), A(x1, 0, z0), A(x1, ha, z0), A(x0, ha, z0), [0, 0, -1]); this.quad4(key, A(x0, 0, z1), A(x1, 0, z1), A(x1, hb, z1), A(x0, hb, z1), [0, 0, 1]);
    for (const [x, n] of [[x0, -1], [x1, 1]] as [number, number][]) this.quad4(key, A(x, 0, z0), A(x, 0, z1), A(x, hb, z1), A(x, ha, z0), [n, 0, 0]);
    if (detailLevel >= 4 && Math.abs(hb - ha) > .01) { const L = Math.hypot(hb - ha, z1 - z0), pitch = Math.atan2(hb - ha, z1 - z0) / DEG; for (const x of [x0 + .06, x1 - .06]) this.tilt("trim", [x, (ha + hb) / 2 + .05, (z0 + z1) / 2], [.1, .1, L], 0, -pitch); }
  }
  /** 天花板：厚 t，底面标高 yBottom，可挖洞（灯槽、检修口）。 */
  ceiling(x0: number, z0: number, x1: number, z1: number, yBottom: number, t = .1, hole?: Rect | Rect[]) {
    this.slab(x0, z0, x1, z1, yBottom + t, t, hole, "ceil");
    if (detailLevel >= 4 && x1 - x0 > 1 && z1 - z0 > 1) { for (const z of [z0 + .03, z1 - .03]) this.box("trim", (x0 + x1) / 2, yBottom - .03, z, x1 - x0, .06, .06); for (const x of [x0 + .03, x1 - .03]) this.box("trim", x, yBottom - .03, (z0 + z1) / 2, .06, .06, z1 - z0 - .12); }
  }
  /** 灯位格栅：钢管网格，沿 x 每 sx、沿 z 每 sz 一根（管径 0.05），位于标高 y。 */
  lightGrid(x0: number, z0: number, x1: number, z1: number, y: number, sx = 1.2, sz = 1.2) {
    for (let x = x0; x <= x1 + .01; x += sx) this.box("rig", x, y, (z0 + z1) / 2, .05, .05, z1 - z0);
    for (let z = z0; z <= z1 + .01; z += sz) this.box("rig", (x0 + x1) / 2, y + .06, z, x1 - x0, .05, .05);
  }
  /** 斜杆：a→b（落在平行于 x 或 z 的竖直面内），断面 w×h。 */
  strut(key: string, a: P, b: P, w = .12, h = .12) {
    const alongX = Math.abs(b[0] - a[0]) > Math.abs(b[2] - a[2]);
    if (alongX ? b[0] < a[0] : b[2] < a[2]) [a, b] = [b, a];
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], c: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    if (alongX) this.tilt(key, c, [w, h, Math.hypot(dx, dy)], 90, -Math.atan2(dy, dx) / DEG); else this.tilt(key, c, [w, h, Math.hypot(dz, dy)], 0, -Math.atan2(dy, dz) / DEG);
  }
  /** 桁架屋面：桁架沿 z（跨度 z0..z1）、沿 x 每 spacing 一榀，下弦标高 yBase，上面铺双坡屋面板。 */
  trussRoof(x0: number, z0: number, x1: number, z1: number, yBase: number, spacing = 6, pitch = 12, over = .5) {
    const tp = Math.tan(pitch * DEG), zc = (z0 + z1) / 2, rise = (z1 - z0) / 2 * tp, n = Math.max(1, Math.round((x1 - x0) / spacing));
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n;
      this.box("struct", x, yBase + .15, zc, .2, .3, z1 - z0); this.strut("struct", [x, yBase, z0], [x, yBase + rise, zc], .2, .25); this.strut("struct", [x, yBase, z1], [x, yBase + rise, zc], .2, .25);
      this.box("struct", x, yBase + rise / 2, zc, .15, rise, .15); for (const s of [-1, 1]) this.strut("struct", [x, yBase + .3, zc + s * (z1 - z0) * .25], [x, yBase + rise, zc], .12, .12);
    }
    this.gable(x0, z0, x1, z1, yBase, pitch, over, .12, "roof");
  }
  /** 四坡屋面（歇山简化为庑殿）：覆盖 (x0,z0)-(x1,z1)，檐口标高 yEave，坡度 pitch°，外挑 over，屋面板厚 t。 */
  hip(x0: number, z0: number, x1: number, z1: number, yEave: number, pitch: number, over = .5, t = .12, key = "roof") {
    const tp = Math.tan(pitch * DEG), W = x1 - x0, D = z1 - z0, m = Math.min(W, D) / 2, yR = yEave + m * tp, yE = yEave - over * tp, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const A: P = [x0 - over, yE, z0 - over], B: P = [x1 + over, yE, z0 - over], C: P = [x1 + over, yE, z1 + over], Dp: P = [x0 - over, yE, z1 + over];
    const R0: P = W >= D ? [x0 + m, yR, cz] : [cx, yR, z0 + m], R1: P = W >= D ? [x1 - m, yR, cz] : [cx, yR, z1 - m];
    const face = (...pts: P[]) => { const dn = (p: P): P => [p[0], p[1] - t, p[2]]; if (pts.length === 4) { this.quad4(key, pts[0]!, pts[1]!, pts[2]!, pts[3]!, [0, 1, 0]); this.quad4(key, dn(pts[0]!), dn(pts[1]!), dn(pts[2]!), dn(pts[3]!), [0, -1, 0]); } else { this.tri3(key, pts[0]!, pts[1]!, pts[2]!, [0, 1, 0]); this.tri3(key, dn(pts[0]!), dn(pts[1]!), dn(pts[2]!), [0, -1, 0]); } };
    if (W >= D) { face(A, B, R1, R0); face(Dp, C, R1, R0); face(A, Dp, R0); face(B, C, R1); } else { face(A, Dp, R1, R0); face(B, C, R1, R0); face(A, B, R0); face(Dp, C, R1); }
    if (detailLevel >= 4) { const fy = yE - .09; for (const z of [z0 - over, z1 + over]) this.box("trim", cx, fy, z, W + 2 * over, .18, .06); for (const x of [x0 - over, x1 + over]) this.box("trim", x, fy, cz, .06, .18, D + 2 * over); }
  }
  /** 筒拱屋面：脊线沿 x，覆盖 x0..x1、z0..z1，拱脚标高 yEave、矢高 rise，分 segs 段。 */
  vault(x0: number, x1: number, z0: number, z1: number, yEave: number, rise: number, segs = 10, t = .15, key = "roof") {
    const w = z1 - z0, R = (rise * rise + w * w / 4) / (2 * rise), al = Math.asin(w / 2 / R), zc = (z0 + z1) / 2, yc = yEave + rise - R;
    for (let k = 0; k < segs; k++) { const a0 = -al + 2 * al * k / segs, a1 = -al + 2 * al * (k + 1) / segs, am = (a0 + a1) / 2; this.tilt(key, [(x0 + x1) / 2, yc + R * Math.cos(am), zc + R * Math.sin(am)], [x1 - x0, t, R * (a1 - a0) + .04], 0, am / DEG); }
    if (detailLevel >= 4) {
      const nr = Math.max(2, Math.round((x1 - x0) / 3)), rr = R - t / 2 - .06;
      for (let i = 0; i <= nr; i++) for (let k = 0; k < segs; k++) { const a0 = -al + 2 * al * k / segs, a1 = -al + 2 * al * (k + 1) / segs, am = (a0 + a1) / 2; this.tilt("trim", [x0 + (x1 - x0) * i / nr, yc + rr * Math.cos(am), zc + rr * Math.sin(am)], [.2, .12, rr * (a1 - a0) + .04], 0, am / DEG); }
    }
  }
  /** 锯齿屋面：沿 z 排 teeth 个锯齿，坡面向 +z 升起，每齿高端是竖直采光玻璃，檐口标高 yBase。 */
  sawtooth(x0: number, z0: number, x1: number, z1: number, yBase: number, teeth: number, pitch = 20, t = .15) {
    const tw = (z1 - z0) / teeth, rise = tw * Math.tan(pitch * DEG), len = tw / Math.cos(pitch * DEG), cx = (x0 + x1) / 2;
    for (let i = 0; i < teeth; i++) { const za = z0 + i * tw, zb = za + tw; this.tilt("roof", [cx, yBase + rise / 2, (za + zb) / 2], [x1 - x0, t, len], 0, -pitch); this.box("glass", cx, yBase + rise / 2, zb, x1 - x0, rise, .04); this.box("struct", cx, yBase + rise, zb, x1 - x0, .15, .15); }
    if (detailLevel >= 4) { const n = Math.max(1, Math.round((x1 - x0) / 3)); for (let i = 0; i <= n; i++) for (let j = 0; j < teeth; j++) this.box("frame", x0 + (x1 - x0) * i / n, yBase + rise / 2, z0 + (j + 1) * tw, .06, rise, .08); }
  }

  /** 任意方向的细杆：a→b，断面 w×h（偏航加俯仰，和 tilt 同一约定）。 */
  segment(key: string, a: P, b: P, w = .05, h = .05) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz); if (L < .01) return;
    this.tilt(key, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], [w, h, L], Math.atan2(dx, dz) / DEG, -Math.asin(dy / L) / DEG);
  }
  tri3(key: string, a: P, b: P, c: P, hint: P) { const s = this.soup(key, 3); s.tri(s.vertex(a), s.vertex(b), s.vertex(c), hint); }
  quad4(key: string, a: P, b: P, c: P, d: P, hint: P) { const s = this.soup(key, 4); s.quad(s.vertex(a), s.vertex(b), s.vertex(c), s.vertex(d), hint); }
  /** 带俯仰和偏航的长方体：先绕 x 俯仰（正值压低 +z 端），再绕竖轴偏航；size 是沿局部 x、y、z 的尺寸。 */
  tilt(key: string, c: P, size: P, yaw: number, pitch: number) {
    const s = this.soup(key, 24), cy = Math.cos(yaw * DEG), sy = Math.sin(yaw * DEG), cp = Math.cos(pitch * DEG), sp = Math.sin(pitch * DEG), hx = size[0] / 2, hy = size[1] / 2, hz = size[2] / 2;
    const D = (lx: number, ly: number, lz: number): P => { const y2 = ly * cp - lz * sp, z2 = ly * sp + lz * cp; return [lx * cy + z2 * sy, y2, -lx * sy + z2 * cy]; };
    const T = (lx: number, ly: number, lz: number): P => { const d = D(lx, ly, lz); return [c[0] + d[0], c[1] + d[1], c[2] + d[2]]; };
    for (const g of [-1, 1]) {
      s.quad(s.vertex(T(g * hx, -hy, -hz)), s.vertex(T(g * hx, hy, -hz)), s.vertex(T(g * hx, hy, hz)), s.vertex(T(g * hx, -hy, hz)), D(g, 0, 0));
      s.quad(s.vertex(T(-hx, g * hy, -hz)), s.vertex(T(hx, g * hy, -hz)), s.vertex(T(hx, g * hy, hz)), s.vertex(T(-hx, g * hy, hz)), D(0, g, 0));
      s.quad(s.vertex(T(-hx, -hy, g * hz)), s.vertex(T(hx, -hy, g * hz)), s.vertex(T(hx, hy, g * hz)), s.vertex(T(-hx, hy, g * hz)), D(0, 0, g));
    }
  }
  /** 双坡屋面：axis=x 时脊线沿 x、山墙朝 ±x，axis=z 时脊线沿 z；覆盖 (x0,z0)-(x1,z1)，檐口标高 yEave、坡度 pitch°、四周外挑 over；两侧山墙补成三角墙。 */
  gable(x0: number, z0: number, x1: number, z1: number, yEave: number, pitch: number, over = .5, t = .15, key = "roof", axis: "x" | "z" = "x") {
    const tp = Math.tan(pitch * DEG);
    if (axis === "x") {
      const zc = (z0 + z1) / 2, half = (z1 - z0) / 2 + over, rise = (z1 - z0) / 2 * tp, yc = yEave + rise - half * tp / 2, len = half / Math.cos(pitch * DEG), cx = (x0 + x1) / 2, lx = x1 - x0 + over * 2;
      this.tilt(key, [cx, yc, zc + half / 2], [lx, t, len], 0, pitch); this.tilt(key, [cx, yc, zc - half / 2], [lx, t, len], 0, -pitch);
      if (detailLevel >= 2) for (const s of [-1, 1]) this.box("trim", cx, yEave - over * tp - .1, zc + s * half, lx, .18, .06);
      for (const xs of [x0, x1]) for (const g of [-1, 1]) this.tri3("wall", [xs + g * .1, yEave, z0], [xs + g * .1, yEave, z1], [xs + g * .1, yEave + rise, zc], [g, 0, 0]);
    } else {
      const xc = (x0 + x1) / 2, half = (x1 - x0) / 2 + over, rise = (x1 - x0) / 2 * tp, yc = yEave + rise - half * tp / 2, len = half / Math.cos(pitch * DEG), cz = (z0 + z1) / 2, lz = z1 - z0 + over * 2;
      this.tilt(key, [xc + half / 2, yc, cz], [lz, t, len], 90, pitch); this.tilt(key, [xc - half / 2, yc, cz], [lz, t, len], 90, -pitch);
      if (detailLevel >= 2) for (const s of [-1, 1]) this.box("trim", xc + s * half, yEave - over * tp - .1, cz, .06, .18, lz);
      for (const zs of [z0, z1]) for (const g of [-1, 1]) this.tri3("wall", [x0, yEave, zs + g * .1], [x1, yEave, zs + g * .1], [xc, yEave + rise, zs + g * .1], [0, 0, g]);
    }
  }
  /** 栏栅（牢房栏杆等）：沿轴线每 step 一根细立柱加上下横档，gaps 是留出的门洞范围。 */
  bars(axis: "x" | "z", fixed: number, from: number, to: number, y: number, h: number, gaps: [number, number][] = [], step = .24) {
    const n = Math.max(1, Math.round((to - from) / step));
    for (let k = 0; k <= n; k++) { const t = from + (to - from) * k / n; if (gaps.some(([a, e]) => t > a - .01 && t < e + .01)) continue; if (axis === "x") this.box("rail", t, y + h / 2, fixed, .04, h, .04); else this.box("rail", fixed, y + h / 2, t, .04, h, .04); }
    let cur = from; const segs: [number, number][] = [];
    for (const [a, e] of [...gaps].sort((p, q) => p[0] - q[0])) { segs.push([cur, a]); cur = e; } segs.push([cur, to]);
    for (const [a, e] of segs) if (e - a > .05) for (const yy of [y + .05, y + h - .05]) { if (axis === "x") this.box("rail", (a + e) / 2, yy, fixed, e - a, .06, .05); else this.box("rail", fixed, yy, (a + e) / 2, .05, .06, e - a); }
  }
  /** 楼梯间局部矩形 u∈[-hw,hw]、v∈[v0,v1] 映射到世界 [x0,z0,x1,z1]。 */
  coreRect(cx: number, cz: number, o: { swap?: boolean; flip?: boolean }, v0: number, v1: number, hw: number): Rect {
    const sw = !!o.swap, fl = o.flip ? -1 : 1, X = (u: number, v: number) => sw ? cx + fl * v : cx + u, Z = (u: number, v: number) => sw ? cz + u : cz + fl * v, xs = [X(-hw, v0), X(hw, v1)], zs = [Z(-hw, v0), Z(hw, v1)];
    return [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)];
  }
  /** 双跑楼梯间（含墙 3m×6m）：平面中心 (cx,cz)、起点楼面标高 y0；swap 把长边转到 x 方向，flip 把门所在的正面反向；
   *  sideOps 是两侧长墙（局部 -u、+u）的洞口（世界坐标），back=false 不画背墙，upper 补上层平台楼板。 */
  doglegCore(cx: number, cz: number, y0: number, o: { swap?: boolean; flip?: boolean; door?: boolean; window?: boolean; back?: boolean; sideOps?: [Op[], Op[]]; upper?: boolean } = {}) {
    const sw = !!o.swap, fl = o.flip ? -1 : 1, X = (u: number, v: number) => sw ? cx + fl * v : cx + u, Z = (u: number, v: number) => sw ? cz + u : cz + fl * v;
    const dir = (sg: number): "+x" | "-x" | "+z" | "-z" => sw ? (sg * fl > 0 ? "+x" : "-x") : (sg * fl > 0 ? "+z" : "-z");
    const side = (u: number, ops: Op[]) => sw ? this.wall("x", cz + u, cx - 3, cx + 3, y0, CLEAR, WT, ops) : this.wall("z", cx + u, cz - 3, cz + 3, y0, CLEAR, WT, ops);
    side(-1.5, o.sideOps?.[0] ?? []); side(1.5, o.sideOps?.[1] ?? []);
    const end = (v: number, ops: Op[]) => sw ? this.wall("z", cx + fl * v, cz - 1.4, cz + 1.4, y0, CLEAR, WT, ops) : this.wall("x", cz + fl * v, cx - 1.4, cx + 1.4, y0, CLEAR, WT, ops);
    end(3, o.door === false ? [] : [door(sw ? cz : cx)]);
    if (o.back !== false) end(-3, o.window === false ? [] : [win(sw ? cz : cx, 1.2, 1.2, 1.5)]);
    this.flight(X(.7, .92), Z(.7, .92), dir(-1), y0, 9); this.stairRails(X(.7, .92), Z(.7, .92), dir(-1), y0, 9, 1.2, [-1]);
    this.box("stair", X(0, -2.25), y0 + .75, Z(0, -2.25), sw ? 1.3 : 2.8, 1.5, sw ? 2.8 : 1.3);
    this.flight(X(-.7, -1.6), Z(-.7, -1.6), dir(1), y0 + 1.5, 9); this.stairRails(X(-.7, -1.6), Z(-.7, -1.6), dir(1), y0 + 1.5, 9, 1.2, [1]);
    if (o.upper) { const r = this.coreRect(cx, cz, o, .92, 3, 1.5); this.slab(r[0], r[1], r[2], r[3], y0 + FH, SLAB); }
  }
  /** 楼梯间所在的楼板（3m×6m），hole 为真时挖出梯段洞口。 */
  doglegSlab(cx: number, cz: number, yTop: number, o: { swap?: boolean; flip?: boolean } = {}, hole = true) {
    const r = this.coreRect(cx, cz, o, -3, 3, 1.5); this.slab(r[0], r[1], r[2], r[3], yTop, SLAB, hole ? this.coreRect(cx, cz, o, -2.9, .92, 1.4) : undefined);
  }
}

/** 登记一件白模：不走通用细化（raw），状态原始，标签统一。 */
export const white = (name: string, purpose: string, theme: AssetTheme, build: (b: WB) => void, tags: string[] = []): ArchitecturePrototype => ({
  ...design(name, purpose, (): ModelPart[] => buildBudget(name, () => new WB(), build), "建筑", theme), raw: true, state: "原始", tags: ["白模", "预演", "建筑白模", ...tags],
});
