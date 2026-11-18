import type { ModelPart } from "../assetModelParts";
import type { AssetTheme } from "../sceneDocument";
import type { P } from "./ruinKit";
import { DEG, WB, buildBudget, getDetail, type Rect } from "./whitebox";
import { design, type ArchitecturePrototype } from "./structures";

// 古建白模套件（在白模套件 WB 上扩展）：开间 4.5m、进深间 3.0m；台基 0.45–1.5m（踏步级高 0.15、级宽 0.30）；
// 檐柱径 0.4–0.6、柱高 3.6–5.4；屋面只表达坡度、出檐、收山和脊的体量，不做瓦垄、斗拱、脊兽等细部。
export class AB extends WB {
  constructor() { super(); this.group("base", "台基", "#b3b0a9", { roughness: .95 }); }

  /** 台基：实心长方体，顶面标高 h。 */
  base(x0: number, z0: number, x1: number, z1: number, h: number) { this.box("base", (x0 + x1) / 2, h / 2, (z0 + z1) / 2, x1 - x0, h, z1 - z0); if (getDetail() >= 2 && x1 - x0 > 2 && z1 - z0 > 2 && h >= .3) this.box("trim", (x0 + x1) / 2, h - .02, (z0 + z1) / 2, x1 - x0 + .12, .06, z1 - z0 + .12); }
  /** 台基踏步：dir 是踏步通向的方向（从台基边 edge 向外一级级下到地面），c 是踏步中心线，w 是踏步宽，h 是台基高。 */
  steps(c: number, edge: number, dir: "+x" | "-x" | "+z" | "-z", w: number, h: number, run = .3) {
    const n = Math.max(2, Math.round(h / .15)), rise = h / n, L = n * run;
    if (dir === "+z") this.flight(c, edge + L, "-z", 0, n, w, rise, run, "base");
    else if (dir === "-z") this.flight(c, edge - L, "+z", 0, n, w, rise, run, "base");
    else if (dir === "+x") this.flight(edge + L, c, "-x", 0, n, w, rise, run, "base");
    else this.flight(edge - L, c, "+x", 0, n, w, rise, run, "base");
  }
  /** 一排圆柱：沿 axis 方向、另一坐标固定为 fixed，from→to 均分成 n 段（n+1 根）。 */
  colRow(axis: "x" | "z", fixed: number, from: number, to: number, n: number, y0: number, y1: number, r = .22) {
    for (let i = 0; i <= n; i++) { const u = from + (to - from) * i / n; if (axis === "x") this.cyl("struct", u, fixed, y0, y1, r, 10); else this.cyl("struct", fixed, u, y0, y1, r, 10); }
  }
  /** 抬梁小屋架：梁沿 span 方向跨 v0..v1（另一坐标 fixed），梁顶标高 yBeam，脊高 yRidge；中柱加两道斜撑。 */
  frame(span: "x" | "z", fixed: number, v0: number, v1: number, yBeam: number, yRidge: number) {
    const vc = (v0 + v1) / 2, pt = (v: number): [number, number] => span === "z" ? [fixed, v] : [v, fixed];
    this.beamH(span, fixed, v0, v1, yBeam, .3, .5);
    const [cx, cz] = pt(vc); this.col(cx, cz, yBeam, yRidge - .1, .25);
    for (const g of [-1, 1]) { const [px, pz] = pt(vc + g * (v1 - v0) / 4); this.strut("struct", [px, yBeam, pz], [cx, yRidge - .45, cz], .15, .15); }
  }
  /** 垛口墙：连续矮墙高 hl，其上每 step 一个垛（宽 mw、高到 ht），墙厚 t。 */
  crenel(axis: "x" | "z", fixed: number, from: number, to: number, y: number, t = .5, hl = .9, ht = 2.0, step = 1.5, mw = .9) {
    this.wall(axis, fixed, from, to, y, hl, t);
    const n = Math.max(1, Math.floor((to - from) / step)), sp = (to - from) / n;
    for (let i = 0; i < n; i++) { const u = from + (i + .5) * sp; if (axis === "x") this.box("wall", u, y + (hl + ht) / 2, fixed, mw, ht - hl, t); else this.box("wall", fixed, y + (hl + ht) / 2, u, t, ht - hl, mw); }
  }
  /** 带拱洞的实心墙块：x0..x1、y0..y1、z0..z1，拱洞沿 z 贯通；洞中心 cx、半宽 hw、起拱标高 spring、拱顶标高 crown（半椭圆）。 */
  archBlock(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, cx: number, hw: number, spring: number, crown: number, segs = 12, key = "wall") {
    const pts: [number, number][] = [];
    for (let i = 0; i <= segs; i++) { const a = Math.PI * i / segs; pts.push([cx + hw * Math.cos(a), spring + (crown - spring) * Math.sin(a)]); }
    const q = (a: P, b: P, c: P, d: P, n: P) => this.quad4(key, a, b, c, d, n);
    for (const [z, n] of [[z1, 1], [z0, -1]] as [number, number][]) {
      q([x0, y0, z], [cx - hw, y0, z], [cx - hw, y1, z], [x0, y1, z], [0, 0, n]);
      q([cx + hw, y0, z], [x1, y0, z], [x1, y1, z], [cx + hw, y1, z], [0, 0, n]);
      for (let i = 0; i < segs; i++) { const [xa, ya] = pts[i]!, [xb, yb] = pts[i + 1]!; q([xa, ya, z], [xb, yb, z], [xb, y1, z], [xa, y1, z], [0, 0, n]); }
    }
    q([cx - hw, y0, z1], [cx - hw, y0, z0], [cx - hw, spring, z0], [cx - hw, spring, z1], [1, 0, 0]);
    q([cx + hw, y0, z0], [cx + hw, y0, z1], [cx + hw, spring, z1], [cx + hw, spring, z0], [-1, 0, 0]);
    for (let i = 0; i < segs; i++) { const [xa, ya] = pts[i]!, [xb, yb] = pts[i + 1]!, xm = (xa + xb) / 2, ym = (ya + yb) / 2; q([xa, ya, z0], [xb, yb, z0], [xb, yb, z1], [xa, ya, z1], [cx - xm, spring - ym, 0]); }
    q([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0]);
    q([x0, y0, z1], [cx - hw, y0, z1], [cx - hw, y0, z0], [x0, y0, z0], [0, -1, 0]); q([cx + hw, y0, z1], [x1, y0, z1], [x1, y0, z0], [cx + hw, y0, z0], [0, -1, 0]);
    q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]); q([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
  }
  /** 收分墙体：底面 x0..x1 × z0..z1 在 y0，顶面前后各收进 bz（z0+bz..z1-bz）在 y1，两端面竖直。 */
  taper(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, bz: number, key = "wall") {
    const A = (x: number, y: number, z: number): P => [x, y, z];
    this.quad4(key, A(x0, y1, z0 + bz), A(x1, y1, z0 + bz), A(x1, y1, z1 - bz), A(x0, y1, z1 - bz), [0, 1, 0]);
    this.quad4(key, A(x0, y0, z0), A(x1, y0, z0), A(x1, y0, z1), A(x0, y0, z1), [0, -1, 0]);
    this.quad4(key, A(x0, y0, z1), A(x1, y0, z1), A(x1, y1, z1 - bz), A(x0, y1, z1 - bz), [0, .3, 1]);
    this.quad4(key, A(x0, y0, z0), A(x1, y0, z0), A(x1, y1, z0 + bz), A(x0, y1, z0 + bz), [0, .3, -1]);
    for (const [x, n] of [[x0, -1], [x1, 1]] as [number, number][]) this.quad4(key, A(x, y0, z0), A(x, y0, z1), A(x, y1, z1 - bz), A(x, y1, z0 + bz), [n, 0, 0]);
  }
  /** 沿 x 的斜坡实体：x0 处高 ha、x1 处高 hb，z0..z1 宽，底面 y=0。 */
  rampX(x0: number, x1: number, ha: number, hb: number, z0: number, z1: number, key = "base") {
    const A = (x: number, y: number, z: number): P => [x, y, z];
    this.quad4(key, A(x0, ha, z0), A(x0, ha, z1), A(x1, hb, z1), A(x1, hb, z0), [0, 1, 0]); this.quad4(key, A(x0, 0, z0), A(x0, 0, z1), A(x1, 0, z1), A(x1, 0, z0), [0, -1, 0]);
    for (const [z, n] of [[z0, -1], [z1, 1]] as [number, number][]) this.quad4(key, A(x0, 0, z), A(x1, 0, z), A(x1, hb, z), A(x0, ha, z), [0, 0, n]);
    for (const [x, h, n] of [[x0, ha, -1], [x1, hb, 1]] as [number, number, number][]) this.quad4(key, A(x, 0, z0), A(x, 0, z1), A(x, h, z1), A(x, h, z0), [n, 0, 0]);
  }

  private shell(t: number, ...pts: P[]) {
    const dn = (p: P): P => [p[0], p[1] - t, p[2]];
    if (pts.length === 4) { this.quad4("roof", pts[0]!, pts[1]!, pts[2]!, pts[3]!, [0, 1, 0]); this.quad4("roof", dn(pts[0]!), dn(pts[1]!), dn(pts[2]!), dn(pts[3]!), [0, -1, 0]); }
    else { this.tri3("roof", pts[0]!, pts[1]!, pts[2]!, [0, 1, 0]); this.tri3("roof", dn(pts[0]!), dn(pts[1]!), dn(pts[2]!), [0, -1, 0]); }
  }
  /** 硬山 / 悬山屋面：脊线沿 axis；檐口方向挑出 oe，山墙方向挑出 og（硬山约 0.1–0.15，悬山约 0.6–0.9）；ends 为真时山墙补三角墙。 */
  roofGable(x0: number, z0: number, x1: number, z1: number, yEave: number, pitch: number, oe: number, og: number, axis: "x" | "z" = "x", t = .15, ends = true) {
    const tp = Math.tan(pitch * DEG), c = Math.cos(pitch * DEG), x = axis === "x";
    const u0 = x ? x0 : z0, u1 = x ? x1 : z1, v0 = x ? z0 : x0, v1 = x ? z1 : x1, vc = (v0 + v1) / 2;
    const half = (v1 - v0) / 2 + oe, rise = (v1 - v0) / 2 * tp, yc = yEave + rise - half * tp / 2, len = half / c, uc = (u0 + u1) / 2, lu = u1 - u0 + og * 2;
    if (x) { this.tilt("roof", [uc, yc, vc + half / 2], [lu, t, len], 0, pitch); this.tilt("roof", [uc, yc, vc - half / 2], [lu, t, len], 0, -pitch); this.box("roof", uc, yEave + rise + .08, vc, lu, .26, .45); }
    else { this.tilt("roof", [vc + half / 2, yc, uc], [lu, t, len], 90, pitch); this.tilt("roof", [vc - half / 2, yc, uc], [lu, t, len], 90, -pitch); this.box("roof", vc, yEave + rise + .08, uc, .45, .26, lu); }
    if (getDetail() >= 2) { const nr = Math.min(40, Math.floor(lu / .75)); for (let i = 0; i < nr; i++) { const u = uc - lu / 2 + (i + .5) * lu / nr; if (x) { this.tilt("roof", [u, yc + .05, vc + half / 2], [.09, t + .08, len], 0, pitch); this.tilt("roof", [u, yc + .05, vc - half / 2], [.09, t + .08, len], 0, -pitch); } else { this.tilt("roof", [vc + half / 2, yc + .05, u], [.09, t + .08, len], 90, pitch); this.tilt("roof", [vc - half / 2, yc + .05, u], [.09, t + .08, len], 90, -pitch); } } for (const s of [-1, 1]) { if (x) this.box("trim", uc, yEave - oe * tp - .1, vc + s * half, lu, .18, .06); else this.box("trim", vc + s * half, yEave - oe * tp - .1, uc, .06, .18, lu); } }
    if (ends) for (const us of [u0, u1]) for (const d of [-1, 1]) { const p = (u: number, v: number, y: number): P => x ? [u, y, v] : [v, y, u]; this.tri3("wall", p(us + d * .1, v0, yEave), p(us + d * .1, v1, yEave), p(us + d * .1, vc, yEave + rise), x ? [d, 0, 0] : [0, 0, d]); }
  }
  /** 歇山屋面：脊线沿 axis，覆盖檐口线 (x0,z0)-(x1,z1)，檐口标高 yEave，坡度 pitch，出檐 over，收山 s（山花退进檐口线 s）。 */
  roofXieshan(x0: number, z0: number, x1: number, z1: number, yEave: number, pitch: number, over: number, s: number, axis: "x" | "z" = "x", t = .14) {
    const tp = Math.tan(pitch * DEG), x = axis === "x";
    const u0 = x ? x0 : z0, u1 = x ? x1 : z1, v0 = x ? z0 : x0, v1 = x ? z1 : x1, vc = (v0 + v1) / 2;
    const at = (u: number, v: number, y: number): P => x ? [u, y, v] : [v, y, u];
    const yR = yEave + (v1 - v0) / 2 * tp, yS = yEave + s * tp, yO = yEave - over * tp;
    for (const g of [-1, 1]) {
      const ve = g > 0 ? v1 + over : v0 - over, vs = g > 0 ? v1 - s : v0 + s, ue = g > 0 ? u1 + over : u0 - over, us = g > 0 ? u1 - s : u0 + s;
      this.shell(t, at(u0 - over, ve, yO), at(u1 + over, ve, yO), at(u1 - s, vs, yS), at(u0 + s, vs, yS));
      this.shell(t, at(u0 + s, vs, yS), at(u1 - s, vs, yS), at(u1 - s, vc, yR), at(u0 + s, vc, yR));
      this.shell(t, at(ue, v0 - over, yO), at(ue, v1 + over, yO), at(us, v1 - s, yS), at(us, v0 + s, yS));
      for (const d of [-1, 1]) this.tri3("wall", at(us + d * .1, v0 + s, yS), at(us + d * .1, v1 - s, yS), at(us + d * .1, vc, yR), x ? [d, 0, 0] : [0, 0, d]);
    }
    const len = u1 - u0 - 2 * s + .6;
    if (x) this.box("roof", (u0 + u1) / 2, yR + .1, vc, len, .3, .5); else this.box("roof", vc, yR + .1, (u0 + u1) / 2, .5, .3, len);
  }
  /** 腰檐 / 披檐：外框 o 在标高 yO，内框 i 在标高 yI，四片斜板（厚 t）。 */
  pent(o: Rect, yO: number, i: Rect, yI: number, t = .12) {
    const [ox0, oz0, ox1, oz1] = o, [ix0, iz0, ix1, iz1] = i;
    this.shell(t, [ox0, yO, oz1], [ox1, yO, oz1], [ix1, yI, iz1], [ix0, yI, iz1]); this.shell(t, [ox0, yO, oz0], [ox1, yO, oz0], [ix1, yI, iz0], [ix0, yI, iz0]);
    this.shell(t, [ox0, yO, oz0], [ox0, yO, oz1], [ix0, yI, iz1], [ix0, yI, iz0]); this.shell(t, [ox1, yO, oz0], [ox1, yO, oz1], [ix1, yI, iz1], [ix1, yI, iz0]);
  }
}

/** 登记一件古建白模：和 white() 一样走原始白模口径，只是用古建套件。 */
export const whiteAnc = (name: string, purpose: string, theme: AssetTheme, build: (b: AB) => void, tags: string[] = []): ArchitecturePrototype => ({
  ...design(name, purpose, (): ModelPart[] => buildBudget(name, () => new AB(), build), "建筑", theme), raw: true, state: "原始", tags: ["白模", "预演", "建筑白模", ...tags],
});
