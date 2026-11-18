import { DEG } from "./partMath";
import type { Opening, Volume } from "./facadeKit";
import { ShapeBuilder, WORLD, type P } from "./shapeKit";

// 实心体量改成空壳：四面外墙（厚 thick）按门窗洞口拆成墙板，洞口四周补洞口侧面，
// 再铺各层楼板和顶层天花，让建筑真正有可进入、可布置的室内。
// 墙板、楼板都只用单面四边形（8 个顶点一块墙板），按颜色合并成少量 mesh。
export type ShellSlab = { cx: number; cz: number; yaw: number; hx: number; hz: number; top: number; bottom: number; area: number; color: string };
export type ShellCover = { cx: number; cz: number; yaw: number; hx: number; hz: number; ceiling: number };
export type Shell = { slabs: ShellSlab[]; covers: ShellCover[]; quads: number };

export type ShellStyle = { outer: string; inner: string; floor: string; ceiling: string; floorColor: string };
export type ShellKeys = { outer: string; inner: string; floor: string; ceil: string };

/** 登记一套墙体、楼板分组，返回分组键；prefix 区分不同墙色的体量。 */
export function shellGroups(b: ShapeBuilder, prefix: string, style: ShellStyle): ShellKeys {
  const keys = { outer: `${prefix}Outer`, inner: `${prefix}Inner`, floor: `${prefix}Floor`, ceil: `${prefix}Ceil` };
  b.group(keys.outer, "墙体外壳", style.outer, { roughness: .92 }).group(keys.inner, "墙体内衬", style.inner, { roughness: .95 })
    .group(keys.floor, "室内楼板", style.floor, { roughness: .85 }).group(keys.ceil, "室内天花", style.ceiling, { roughness: .95 });
  return keys;
}

type Rect = { a: number; b: number; y0: number; y1: number };

/** 按洞口把一面墙拆成不含洞口的矩形：竖向切条，每条里去掉被洞口占的高度区间，再把相邻且高度区间相同的条合并。 */
function wallRects(t0: number, t1: number, y0: number, y1: number, holes: Opening[]): Rect[] {
  const cuts = [...new Set([t0, t1, ...holes.flatMap(hole => [Math.max(t0, hole.t0), Math.min(t1, hole.t1)])])].filter(value => value >= t0 - 1e-6 && value <= t1 + 1e-6).sort((p, q) => p - q);
  const strips: Rect[] = [];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const a = cuts[i]!, b = cuts[i + 1]!;
    if (b - a < 1e-3) continue;
    const blocked = holes.filter(hole => hole.t0 <= a + 1e-6 && hole.t1 >= b - 1e-6).map(hole => [Math.max(y0, hole.y0), Math.min(y1, hole.y1)] as [number, number]).sort((p, q) => p[0] - q[0]);
    let cursor = y0;
    for (const [lo, hi] of blocked) { if (lo - cursor > 1e-3) strips.push({ a, b, y0: cursor, y1: lo }); cursor = Math.max(cursor, hi); }
    if (y1 - cursor > 1e-3) strips.push({ a, b, y0: cursor, y1 });
  }
  // 相邻、高度区间相同的合并
  const merged: Rect[] = [];
  for (const strip of strips) {
    const last = merged.find(rect => Math.abs(rect.b - strip.a) < 1e-6 && Math.abs(rect.y0 - strip.y0) < 1e-6 && Math.abs(rect.y1 - strip.y1) < 1e-6);
    if (last) last.b = strip.b; else merged.push({ ...strip });
  }
  return merged;
}

/** 在 b 里造出体量 v 的空壳；openings 是全部门窗洞口（面内切向区间和世界高度）。 */
export function buildShell(b: ShapeBuilder, v: Volume, openings: Opening[], storeys: number, thick: number, keys: ShellKeys, floorColor: string): Shell {
  const c = Math.cos(v.yaw * DEG), s = Math.sin(v.yaw * DEG), H = v.y1 - v.y0, sh = H / storeys;
  const FACE_DIR = [0, 180, 90, 270];
  const info = (id: number) => id < 2 ? { len: 2 * v.hx, half: v.hz, sign: id === 0 ? 1 : -1, alongX: true } : { len: 2 * v.hz, half: v.hx, sign: id === 2 ? 1 : -1, alongX: false };
  const world = (lx: number, lz: number): [number, number] => [v.cx + lx * c + lz * s, v.cz - lx * s + lz * c];
  // 面内点：切向 t、外凸 n（负为朝内）、高度 y
  const pt = (id: number, t: number, n: number, y: number): P => {
    const f = info(id), lx = f.alongX ? t : f.sign * (f.half + n), lz = f.alongX ? f.sign * (f.half + n) : t, [x, z] = world(lx, lz);
    return [x, y, z];
  };
  const dirOf = (deg: number): P => [Math.sin(deg * DEG), 0, Math.cos(deg * DEG)];
  let quads = 0;
  const quad = (key: string, a: P, p: P, q: P, d: P, normal: P) => { quads++; b.xquad(key, WORLD, a, p, q, d, normal); };
  for (let id = 0; id < 4; id++) {
    const f = info(id), out = dirOf(v.yaw + FACE_DIR[id]!), inward: P = [-out[0], 0, -out[2]];
    // ±x 面夹在 ±z 面之间，两端各让出一个墙厚，墙角归 ±z 面
    const T0 = id < 2 ? -f.len / 2 : -f.len / 2 + thick, T1 = id < 2 ? f.len / 2 : f.len / 2 - thick;
    const holes = openings.filter(o => o.face === id).map(o => ({ ...o, t0: Math.max(T0 + .05, o.t0), t1: Math.min(T1 - .05, o.t1), y0: Math.max(v.y0, o.y0), y1: Math.min(v.y1 - .1, o.y1) })).filter(o => o.t1 - o.t0 > .15 && o.y1 - o.y0 > .15);
    // 切向正方向（世界）
    const tangent: P = f.alongX ? [Math.cos(v.yaw * DEG), 0, -Math.sin(v.yaw * DEG)] : [Math.sin(v.yaw * DEG), 0, Math.cos(v.yaw * DEG)], backTangent: P = [-tangent[0], 0, -tangent[2]];
    for (const rect of wallRects(T0, T1, v.y0, v.y1, holes)) {
      quad(keys.outer, pt(id, rect.a, 0, rect.y0), pt(id, rect.b, 0, rect.y0), pt(id, rect.b, 0, rect.y1), pt(id, rect.a, 0, rect.y1), out);
      quad(keys.inner, pt(id, rect.a, -thick, rect.y0), pt(id, rect.b, -thick, rect.y0), pt(id, rect.b, -thick, rect.y1), pt(id, rect.a, -thick, rect.y1), inward);
    }
    // 洞口四周的侧面：左右门窗框内侧、窗台面和过梁底面
    for (const hole of holes) {
      quad(keys.outer, pt(id, hole.t0, -thick, hole.y0), pt(id, hole.t0, 0, hole.y0), pt(id, hole.t0, 0, hole.y1), pt(id, hole.t0, -thick, hole.y1), tangent);
      quad(keys.outer, pt(id, hole.t1, -thick, hole.y0), pt(id, hole.t1, 0, hole.y0), pt(id, hole.t1, 0, hole.y1), pt(id, hole.t1, -thick, hole.y1), backTangent);
      quad(keys.outer, pt(id, hole.t0, -thick, hole.y0), pt(id, hole.t1, -thick, hole.y0), pt(id, hole.t1, 0, hole.y0), pt(id, hole.t0, 0, hole.y0), [0, 1, 0]);
      quad(keys.outer, pt(id, hole.t0, -thick, hole.y1), pt(id, hole.t1, -thick, hole.y1), pt(id, hole.t1, 0, hole.y1), pt(id, hole.t0, 0, hole.y1), [0, -1, 0]);
    }
    // 墙顶：露在屋面外时是一圈窄顶面
    quad(keys.outer, pt(id, T0, -thick, v.y1), pt(id, T1, -thick, v.y1), pt(id, T1, 0, v.y1), pt(id, T0, 0, v.y1), [0, 1, 0]);
    // ±z 面两端的墙角端面，与 ±x 面外表面连成一片
    if (id < 2) for (const end of [-1, 1]) {
      const t = end * f.len / 2;
      quad(keys.outer, pt(id, t, -thick, v.y0), pt(id, t, 0, v.y0), pt(id, t, 0, v.y1), pt(id, t, -thick, v.y1), end > 0 ? tangent : backTangent);
    }
  }
  // 楼板和天花：内壁围出的矩形
  const ihx = v.hx - thick, ihz = v.hz - thick;
  const floorQuad = (y: number, key: string, normal: P) => quad(key, ...[[-ihx, -ihz], [ihx, -ihz], [ihx, ihz], [-ihx, ihz]].map(([lx, lz]) => { const [x, z] = world(lx!, lz!); return [x, y, z] as P; }) as [P, P, P, P], normal);
  const slabs: ShellSlab[] = [], covers: ShellCover[] = [];
  for (let k = 0; k < storeys; k++) {
    // 地面层铺面 8cm，中间楼板厚 20cm，顶层天花在顶面下 8cm
    const base = v.y0 + k * sh, top = base + (k ? .1 : .08), ceiling = k < storeys - 1 ? v.y0 + (k + 1) * sh - .1 : v.y1 - .08;
    if (k) floorQuad(base - .1, keys.ceil, [0, -1, 0]);
    floorQuad(top, keys.floor, [0, 1, 0]);
    slabs.push({ cx: v.cx, cz: v.cz, yaw: v.yaw, hx: ihx, hz: ihz, top, bottom: top - .08, area: 4 * ihx * ihz, color: floorColor });
    // 屋面范围取外墙向外 .6m（与带出檐的屋面一致），好让室内判定把墙算在屋面覆盖范围内
    covers.push({ cx: v.cx, cz: v.cz, yaw: v.yaw, hx: v.hx + .6, hz: v.hz + .6, ceiling: ceiling + .01 });
  }
  floorQuad(v.y1 - .08, keys.ceil, [0, -1, 0]);
  return { slabs, covers, quads };
}
