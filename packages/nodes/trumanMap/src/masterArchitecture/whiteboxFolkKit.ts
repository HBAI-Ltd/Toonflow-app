import type { AssetTheme } from "../sceneDocument";
import type { P } from "./ruinKit";
import { DEG } from "./whitebox";
import { whiteAnc, type AB } from "./whiteboxAncientKit";
import { cone, ringWall } from "./whiteboxRegional";
import type { ArchitecturePrototype } from "./structures";

// 民俗建筑白模套件：祠堂、庙宇、会馆、鼓楼、民族民居、世界各地的乡土与宗教建筑共用的小函数。
export const tan = (d: number) => Math.tan(d * DEG);
/** 登记一件民俗 / 民居白模：cat 是类别（民俗、民居），scope 写进用途。 */
export const folk = (cat: string, theme: AssetTheme, scope: string) => (name: string, what: string, build: (b: AB) => void, tags: string[]): ArchitecturePrototype =>
  whiteAnc(`白模·${cat}·${name}`, `白模预演${scope}：${what}；原点在平面中心，+z 为正面，地面标高 0`, theme, build, [cat, ...tags]);

/** 任意顶线的实墙：axis="z" 时墙面在 x=fixed、沿 z 从 from 到 to；axis="x" 时墙面在 z=fixed、沿 x 延伸；底 y0，顶线 top(u)，厚 t，分 n 段。 */
export function profileWall(b: AB, key: string, axis: "x" | "z", fixed: number, from: number, to: number, y0: number, top: (u: number) => number, t = .35, n = 10) {
  const pt = (u: number, y: number, s: number): P => axis === "z" ? [fixed + s * t / 2, y, u] : [u, y, fixed + s * t / 2], nr = (s: number): P => axis === "z" ? [s, 0, 0] : [0, 0, s];
  for (let i = 0; i < n; i++) {
    const u0 = from + (to - from) * i / n, u1 = from + (to - from) * (i + 1) / n, ya = top(u0), yb = top(u1);
    for (const s of [1, -1]) b.quad4(key, pt(u0, y0, s), pt(u1, y0, s), pt(u1, yb, s), pt(u0, ya, s), nr(s));
    b.quad4(key, pt(u0, ya, 1), pt(u1, yb, 1), pt(u1, yb, -1), pt(u0, ya, -1), [0, 1, 0]);
  }
  for (const [u, s] of [[from, -1], [to, 1]] as [number, number][]) b.quad4(key, pt(u, y0, -1), pt(u, y0, 1), pt(u, top(u), 1), pt(u, top(u), -1), axis === "z" ? [0, 0, s] : [s, 0, 0]);
}
/** 马头墙：山墙沿屋坡做阶梯形封火墙。fixed 是墙面位置，c±half 是山墙的范围，yEave 檐口标高，pitch 屋面坡度。 */
export function mahead(b: AB, axis: "x" | "z", fixed: number, c: number, half: number, yEave: number, pitch: number, n = 5, t = .35) {
  const L = 2 * half / n;
  for (let i = 0; i < n; i++) {
    const d = -half + (i + .5) * L, h = (half - Math.abs(d)) * tan(pitch) + .45;
    if (axis === "z") b.box("wall", fixed, yEave + h / 2 - .1, c + d, t, h + .2, L - .04); else b.box("wall", c + d, yEave + h / 2 - .1, fixed, L - .04, h + .2, t);
  }
}
/** 镬耳山墙（广府）：山墙顶线是中间隆起的弧形，比屋脊还高约 1m。 */
export function wokEar(b: AB, axis: "x" | "z", fixed: number, c: number, half: number, yEave: number, pitch: number, t = .35) {
  const rise = half * tan(pitch);
  profileWall(b, "wall", axis, fixed, c - half, c + half, yEave - .1, u => yEave + .35 + (rise + 1) * Math.pow(Math.cos(Math.PI / 2 * Math.min(1, Math.abs(u - c) / half)), 1.2), t, 14);
}
/** 燕尾脊（闽南）：正脊两端向上翘起的两叉尾。yR 是脊顶标高。 */
export function swallow(b: AB, x0: number, x1: number, z: number, yR: number) {
  for (const [x, yaw] of [[x1 + .55, 90], [x0 - .55, 270]] as [number, number][]) b.tilt("roof", [x, yR + .3, z], [.32, .22, 1.7], yaw, -28);
}
/** 半球穹顶（实心外壳）：底面标高 y、半径 R，steps 圈、N 边形，squash 压扁系数。 */
export function dome(b: AB, key: string, y: number, R: number, steps = 5, N = 16, o: [number, number] = [0, 0], t = .2, squash = 1) {
  for (let i = 0; i < steps; i++) { const a0 = 90 * i / steps, a1 = 90 * (i + 1) / steps; cone(b, key, R * Math.cos(a0 * DEG), y + R * squash * Math.sin(a0 * DEG), R * Math.cos(a1 * DEG), y + R * squash * Math.sin(a1 * DEG), N, t, o); }
}
/** 圆形小屋：圆墙加锥形屋顶，正面（+z）留一个门洞。 */
export function hutRound(b: AB, cx: number, cz: number, r: number, wallH: number, roofH: number, o: { N?: number; over?: number; t?: number; wallKey?: string; roofKey?: string; doorH?: number } = {}) {
  const N = o.N ?? 16, over = o.over ?? .5, dh = Math.min(o.doorH ?? 1.9, wallH * .85);
  ringWall(b, o.wallKey ?? "wall", r, o.t ?? .3, 0, wallH, N, i => i === 0 ? dh : undefined, [cx, cz]);
  cone(b, o.roofKey ?? "roof", r + over, wallH - .15, .12, wallH + roofH, N, .1, [cx, cz]);
}
/** 柱桩：在 x0..x1、z0..z1 范围内按 nx、nz 排柱，从地面到 y。 */
export function stilts(b: AB, x0: number, z0: number, x1: number, z1: number, y: number, nx: number, nz: number, r = .13) {
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) b.cyl("struct", x0 + (x1 - x0) * i / nx, z0 + (z1 - z0) * j / nz, 0, y, r, 8);
}
