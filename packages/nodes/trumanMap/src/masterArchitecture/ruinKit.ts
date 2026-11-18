import type { ModelPart } from "../assetModelParts";
import { Builder } from "./chineseArchKit";
import { shade } from "./chineseRoofKit";
import { DEG } from "./partMath";

// 破败建筑套件（影视用的残墙断壁、漏顶塌屋、被焚空架、烂尾楼、荒废房间共用）：
// 参差断顶的墙板、带洞口的残墙、随机缺瓦的屋面格与外露椽檩、掉了一半的门窗、瓦砾堆、倒伏梁木、苔藓烟熏和杂草藤蔓。
// 所有几何都进 Builder 的同色合并 mesh（每个 mesh ≤ 500 顶点，由 Builder 自动分段），部件数只取决于用到的颜色组数。
export type P = [number, number, number];

const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: P, k: number): P => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: P, b: P): P => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: P) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: P): P => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function mix(a: string, b: string, t: number) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((x >> shift) & 255) * (1 - t) + ((y >> shift) & 255) * t);
  return `#${[16, 8, 0].map(shift => ch(shift).toString(16).padStart(2, "0")).join("")}`;
}

/** 确定性随机：同一个名字永远得到同一座废墟。 */
export class Rng {
  private s: number;
  constructor(seed: string | number) { let h = 2166136261; for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } this.s = (h >>> 0) || 1; }
  next() { let x = this.s; x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; this.s = x; return x / 4294967296; }
  range(a: number, b: number) { return a + (b - a) * this.next(); }
  int(n: number) { return Math.floor(this.next() * n); }
  chance(p: number) { return this.next() < p; }
  pick<T>(list: readonly T[]) { return list[this.int(list.length)]!; }
  sign() { return this.next() < .5 ? -1 : 1; }
}

/** 水平局部坐标系：u 沿墙（与 boxYaw 的局部 x 同向），n 为外法向（与局部 z 同向）。 */
export type Frame = { x: number; z: number; yaw: number };
export const at = (f: Frame, u: number, n: number): [number, number] => {
  const c = Math.cos(f.yaw * DEG), s = Math.sin(f.yaw * DEG);
  return [f.x + u * c + n * s, f.z - u * s + n * c];
};
const pt = (f: Frame, u: number, n: number, y: number): P => { const [x, z] = at(f, u, n); return [x, y, z]; };
const outward = (f: Frame): P => [Math.sin(f.yaw * DEG), 0, Math.cos(f.yaw * DEG)];
const tangent = (f: Frame): P => [Math.cos(f.yaw * DEG), 0, -Math.sin(f.yaw * DEG)];

function rot(v: P, yaw: number, pitch: number, roll: number): P {
  const cr = Math.cos(roll * DEG), sr = Math.sin(roll * DEG), cp = Math.cos(pitch * DEG), sp = Math.sin(pitch * DEG), cy = Math.cos(yaw * DEG), sy = Math.sin(yaw * DEG);
  let x = v[0] * cr - v[1] * sr, y = v[0] * sr + v[1] * cr, z = v[2];
  const y2 = y * cp - z * sp, z2 = y * sp + z * cp; y = y2; z = z2;
  return [x * cy + z * sy, y, -x * sy + z * cy];
}

/** 墙顶起伏：[沿墙位置 u, 高出墙基的高度] 折线。 */
export type Profile = [number, number][];
export function profileAt(p: Profile, u: number) {
  if (u <= p[0]![0]) return p[0]![1];
  for (let i = 1; i < p.length; i++) if (u <= p[i]![0]) { const [ua, ha] = p[i - 1]!, [ub, hb] = p[i]!; return ha + (hb - ha) * (u - ua) / Math.max(1e-6, ub - ua); }
  return p[p.length - 1]![1];
}
/** 断墙顶线：damage 0 为完好平顶，1 为只剩参差的矮墙根；floor 是最低残留高度。 */
export function jagged(rng: Rng, u0: number, u1: number, full: number, damage: number, floor = .35): Profile {
  if (damage <= .02) return [[u0, full], [u1, full]];
  const hOf = (level: number) => Math.max(floor, full - damage * (full - floor) * level);
  let level = rng.next(), u = u0;
  const pts: Profile = [[u0, hOf(level * .6)]];
  while (u < u1 - .3) {
    u = Math.min(u1, u + rng.range(.3, 1.2));
    level = clamp(level + rng.range(-.55, .55), 0, 1);
    if (rng.chance(.15)) level = rng.range(.6, 1);
    if (rng.chance(.12)) level = rng.range(0, .2);
    pts.push([u, u >= u1 - 1e-6 ? hOf(level * .6) : hOf(level)]);
  }
  return pts;
}

/** 洞口：y0 底、y1 顶（拱洞时 y1 是拱顶）；arch 给出半圆拱或尖拱（哥特）洞顶。 */
export type Hole = { u: number; w: number; y0: number; y1: number; kind: "window" | "door" | "gap"; arch?: "round" | "pointed" };

export type Pal = { wall: string; brick: string; stone: string; wood: string; woodD: string; tile: string; thatch: string; metal: string };

export class RuinBuilder extends Builder {
  quad(key: string, a: P, b: P, c: P, d: P, hint: P) { const s = this.soup(key, 4); s.quad(s.vertex(a), s.vertex(b), s.vertex(c), s.vertex(d), hint); }
  tri(key: string, a: P, b: P, c: P, hint: P) { const s = this.soup(key, 3); s.tri(s.vertex(a), s.vertex(b), s.vertex(c), hint); }

  /** 任意朝向的长方体：中心 c、三根单位轴、三个尺寸。 */
  obox(key: string, c: P, ax: P, ay: P, az: P, sx: number, sy: number, sz: number) {
    const s = this.soup(key, 24), hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const p = (i: number, j: number, k: number): P => [c[0] + ax[0] * i * hx + ay[0] * j * hy + az[0] * k * hz, c[1] + ax[1] * i * hx + ay[1] * j * hy + az[1] * k * hz, c[2] + ax[2] * i * hx + ay[2] * j * hy + az[2] * k * hz];
    for (const g of [-1, 1]) {
      s.quad(s.vertex(p(g, -1, -1)), s.vertex(p(g, 1, -1)), s.vertex(p(g, 1, 1)), s.vertex(p(g, -1, 1)), mul(ax, g));
      s.quad(s.vertex(p(-1, g, -1)), s.vertex(p(1, g, -1)), s.vertex(p(1, g, 1)), s.vertex(p(-1, g, 1)), mul(ay, g));
      s.quad(s.vertex(p(-1, -1, g)), s.vertex(p(1, -1, g)), s.vertex(p(1, 1, g)), s.vertex(p(-1, 1, g)), mul(az, g));
    }
  }
  /** 带偏航、俯仰、横滚的长方体（歪斜的砖块、倒下的家具）。size = [沿局部 x, y, z]。 */
  tbox(key: string, c: P, size: P, yaw: number, pitch = 0, roll = 0) {
    this.obox(key, c, rot([1, 0, 0], yaw, pitch, roll), rot([0, 1, 0], yaw, pitch, roll), rot([0, 0, 1], yaw, pitch, roll), size[0], size[1], size[2]);
  }
  /** 两点之间的方梁：across 为水平横截面方向的粗细，up 为竖向（近乎竖直的梁两者对称）。 */
  beam(key: string, a: P, b: P, across: number, up = across) {
    const d = sub(b, a), l = len(d);
    if (l < .02) return;
    const u = norm(d), ref: P = Math.abs(u[1]) < .95 ? [0, 1, 0] : [1, 0, 0], v = norm(cross(ref, u)), w = cross(u, v);
    this.obox(key, lerp(a, b, .5), u, w, v, l, up, across);
  }
  /** 两面都画的薄片（瓦、木板、碎玻璃）：四角成环，法向取 (b-a)×(d-a)，两面间隔 thick。 */
  plate(key: string, a: P, b: P, c: P, d: P, thick = .03) {
    const n = norm(cross(sub(b, a), sub(d, a))), s = this.soup(key, 8);
    const up = (p: P, k: number): P => [p[0] + n[0] * thick * k, p[1] + n[1] * thick * k, p[2] + n[2] * thick * k];
    s.quad(s.vertex(up(a, 1)), s.vertex(up(b, 1)), s.vertex(up(c, 1)), s.vertex(up(d, 1)), n);
    s.quad(s.vertex(a), s.vertex(b), s.vertex(c), s.vertex(d), mul(n, -1));
  }

  /** 一块带厚度的墙板：沿 u 从 a 到 b，底在 bottom（常数或随 u 变化，拱洞上方的墙板底边是拱线），顶按 top(u)（绝对高度）起伏，厚 thick、中线在 n0。soffit 补底面（过梁、拱洞内壁）。分段不超过 16 段。 */
  wallPiece(key: string, f: Frame, a: number, b: number, bottom: number | ((u: number) => number), top: (u: number) => number, thick: number, n0 = 0, knots: number[] = [], soffit = false) {
    if (b - a < .06) return;
    const target = clamp(Math.ceil((b - a) / .75), 1, 14), lo = typeof bottom === "number" ? () => bottom : bottom;
    const us = [a, ...knots.filter(u => u > a + .08 && u < b - .08), b];
    if (us.length < target + 1) for (let k = 1; k < target; k++) { const u = a + (b - a) * k / target; if (!us.some(v => Math.abs(v - u) < .15)) us.push(u); }
    us.sort((p, q) => p - q);
    if (us.length > 17) { const mid = us[Math.floor(us.length / 2)]!; this.wallPiece(key, f, a, mid, bottom, top, thick, n0, knots, soffit); this.wallPiece(key, f, mid, b, bottom, top, thick, n0, knots, soffit); return; }
    const nf = n0 + thick / 2, nb = n0 - thick / 2, out = outward(f), tan = tangent(f), neg = mul(out, -1);
    const hi = (u: number) => Math.max(lo(u) + .05, top(u));
    for (let i = 0; i + 1 < us.length; i++) {
      const ua = us[i]!, ub = us[i + 1]!, ta = hi(ua), tb = hi(ub), ba = lo(ua), bb = lo(ub);
      this.quad(key, pt(f, ua, nf, ba), pt(f, ub, nf, bb), pt(f, ub, nf, tb), pt(f, ua, nf, ta), out);
      this.quad(key, pt(f, ua, nb, ba), pt(f, ub, nb, bb), pt(f, ub, nb, tb), pt(f, ua, nb, ta), neg);
      this.quad(key, pt(f, ua, nb, ta), pt(f, ub, nb, tb), pt(f, ub, nf, tb), pt(f, ua, nf, ta), [0, 1, 0]);
      if (soffit) this.quad(key, pt(f, ua, nb, ba), pt(f, ub, nb, bb), pt(f, ub, nf, bb), pt(f, ua, nf, ba), [0, -1, 0]);
    }
    this.quad(key, pt(f, a, nb, lo(a)), pt(f, a, nf, lo(a)), pt(f, a, nf, hi(a)), pt(f, a, nb, hi(a)), mul(tan, -1));
    this.quad(key, pt(f, b, nb, lo(b)), pt(f, b, nf, lo(b)), pt(f, b, nf, hi(b)), pt(f, b, nb, hi(b)), tan);
  }

  /** 一整面残墙：按洞口切成墙垛、窗下墙、过梁，顶线按 damage 起伏（gable 给出山墙斜顶的高度上限）。返回墙顶高度函数（绝对高度）。 */
  wallRun(rng: Rng, f: Frame, u0: number, u1: number, y0: number, H: number, thick: number, holes: Hole[], o: { damage: number; keys: string[]; gable?: (u: number) => number; floor?: number; n0?: number; lintels?: number }): (u: number) => number {
    const prof = jagged(rng, u0, u1, H, o.damage, o.floor ?? .35), knots = prof.map(k => k[0]);
    const topAt = (u: number) => y0 + Math.max(.2, Math.min(o.gable ? o.gable(u) : 1e9, profileAt(prof, u)));
    const n0 = o.n0 ?? 0, key = () => rng.pick(o.keys);
    const sorted = [...holes].sort((p, q) => p.u - q.u);
    let cursor = u0;
    for (const h of sorted) {
      const a = Math.max(u0, h.u - h.w / 2), b = Math.min(u1, h.u + h.w / 2);
      this.wallPiece(key(), f, cursor, a, y0, topAt, thick, n0, knots);
      if (h.kind === "window" && h.y0 > y0 + .05) this.wallPiece(key(), f, a, b, y0, () => h.y0, thick, n0);
      if (h.arch) {
        // 拱洞：洞口上方的墙板底边是拱线，墙板留得够高才有拱
        const r = (b - a) / 2, uc = (a + b) / 2, spring = h.y1 - (h.arch === "round" ? r : r * 1.732);
        const curve = (u: number) => { const d = Math.abs(u - uc); return spring + Math.sqrt(Math.max(0, h.arch === "round" ? r * r - d * d : 4 * r * r - (d + r) ** 2)); };
        const arcKnots = Array.from({ length: 11 }, (_, k) => uc + r * Math.cos(Math.PI * (k + 1) / 12));
        if (topAt(uc) >= h.y1 + .15 && rng.chance(o.lintels ?? .8)) this.wallPiece(key(), f, a, b, curve, u => Math.max(topAt(u), curve(u) + .25), thick, n0, [...knots, ...arcKnots], true);
      } else if (h.kind !== "gap" && topAt(h.u) >= h.y1 + .15 && rng.chance(o.lintels ?? .8)) this.wallPiece(key(), f, a, b, h.y1, u => Math.max(topAt(u), h.y1 + .1), thick, n0, knots, true);
      cursor = Math.max(cursor, b);
    }
    this.wallPiece(key(), f, cursor, u1, y0, topAt, thick, n0, knots);
    return topAt;
  }

  /** 贴在墙面上的不规则斑块（剥落墙皮露出的砖、水渍、烟熏）：side=1 贴外面，-1 贴里面；off 为离墙面的距离。 */
  patch(key: string, rng: Rng, f: Frame, side: 1 | -1, n: number, u: number, y: number, w: number, h: number, off = .012, sides = 6) {
    const s = this.soup(key, sides + 1), nn = n + side * off, out = mul(outward(f), side);
    const c = s.vertex(pt(f, u, nn, y)), ring: number[] = [];
    for (let k = 0; k < sides; k++) { const a = k / sides * Math.PI * 2, r = rng.range(.55, 1); ring.push(s.vertex(pt(f, u + Math.cos(a) * w / 2 * r, nn, y + Math.sin(a) * h / 2 * r))); }
    for (let k = 0; k < sides; k++) s.tri(c, ring[k]!, ring[(k + 1) % sides]!, out);
  }
  /** 沿墙脚一条参差的苔藓或水渍带。 */
  strip(key: string, rng: Rng, f: Frame, side: 1 | -1, n: number, u0: number, u1: number, y: number, hMax: number, topAt?: (u: number) => number, off = .014) {
    const nn = n + side * off, out = mul(outward(f), side), count = Math.max(2, Math.ceil((u1 - u0) / .5)), s = this.soup(key, (count + 1) * 2);
    const row: [number, number][] = [];
    for (let k = 0; k <= count; k++) { const u = u0 + (u1 - u0) * k / count; const top = Math.min(y + rng.range(.08, 1) * hMax, topAt ? topAt(u) - .05 : 1e9); row.push([s.vertex(pt(f, u, nn, y)), s.vertex(pt(f, u, nn, Math.max(y + .04, top)))]); }
    for (let k = 0; k < count; k++) s.quad(row[k]![0], row[k + 1]![0], row[k + 1]![1], row[k]![1], out);
  }

  /** 屋面片：corners 依次为 [檐口 A, 檐口 B, 脊 B, 脊 A]（双线性分格）。gone 判断某点所在的瓦是否已塌掉；rafters 给出外露椽条。 */
  slope(rng: Rng, q: [P, P, P, P], o: { cell?: number; thick?: number; keys: string[]; gone?: (p: P) => boolean; hole?: number; rafters?: { key: string; every?: number; across?: number; up?: number }; purlin?: string; jitter?: number }) {
    const cell = o.cell ?? .8, nu = Math.max(1, Math.round(len(sub(q[1], q[0])) / cell)), nv = Math.max(1, Math.round(len(sub(q[3], q[0])) / cell));
    const P = (i: number, j: number): P => lerp(lerp(q[0], q[1], i / nu), lerp(q[3], q[2], i / nu), j / nv);
    const gone = (p: P) => !!o.gone?.(p);
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const mid = lerp(lerp(P(i, j), P(i + 1, j + 1), .5), lerp(P(i + 1, j), P(i, j + 1), .5), .5);
      if (gone(mid) || rng.chance((o.hole ?? 0) * (1 - j / nv * .5))) continue;
      const jit = o.jitter ?? .03, d = (): number => rng.range(-jit, jit);
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), e = P(i, j + 1), lift = (p: P): P => [p[0], p[1] + d(), p[2]];
      this.plate(rng.pick(o.keys), lift(a), lift(b), lift(c), lift(e), o.thick ?? .05);
    }
    if (o.rafters) {
      const every = o.rafters.every ?? 1, across = o.rafters.across ?? .1, up = o.rafters.up ?? .13;
      for (let i = 0; i <= nu; i += every) {
        // 沿椽条取样，砍掉落在塌陷区里的部分
        const steps = nv * 2, run: P[][] = [[]];
        for (let k = 0; k <= steps; k++) { const p = P(i, k / 2); if (gone(p)) { if (run[run.length - 1]!.length) run.push([]); } else run[run.length - 1]!.push(p); }
        for (const r of run) if (r.length >= 2) this.beam(o.rafters.key, r[0]!, r[r.length - 1]!, across, up);
      }
      if (o.purlin) for (const j of [0, Math.round(nv / 3), Math.round(nv * 2 / 3), nv]) {
        let start: P | undefined, last: P | undefined;
        for (let k = 0; k <= nu * 2; k++) {
          const p = P(k / 2, j);
          if (gone(p)) { if (start && last) this.beam(o.purlin, start, last, .13, .15); start = last = undefined; } else { if (!start) start = p; last = p; }
        }
        if (start && last) this.beam(o.purlin, start, last, .13, .15);
      }
    }
  }

  /** 一束杂草：每根草叶是 4 个顶点的三棱尖锥。 */
  tuft(key: string, rng: Rng, x: number, y: number, z: number, h = .45, blades = 5) {
    for (let k = 0; k < blades; k++) {
      const bx = x + rng.range(-.12, .12), bz = z + rng.range(-.12, .12), w = rng.range(.025, .05), hh = h * rng.range(.55, 1.2), lx = rng.range(-.18, .18) * hh, lz = rng.range(-.18, .18) * hh;
      const s = this.soup(key, 4), a = s.vertex([bx - w, y, bz - w * .5]), b = s.vertex([bx + w, y, bz - w * .5]), c = s.vertex([bx, y, bz + w]), t = s.vertex([bx + lx, y + hh, bz + lz]);
      const mid: P = [bx, y, bz];
      s.tri(a, b, t, sub(s.point(a), mid)); s.tri(b, c, t, sub(s.point(b), mid)); s.tri(c, a, t, sub(s.point(c), mid));
    }
  }
  /** 檐口下垂的茅草或破布条：每条是 4 个顶点的三棱尖锥，尖端朝下并略向外。 */
  droop(key: string, rng: Rng, base: P, outDir: [number, number], length: number, w = .05) {
    const s = this.soup(key, 4), a = s.vertex([base[0] - w, base[1], base[2] - w * .5]), b = s.vertex([base[0] + w, base[1], base[2] - w * .5]), c = s.vertex([base[0], base[1], base[2] + w]);
    const hang = length * rng.range(.5, 1.2), t = s.vertex([base[0] + outDir[0] * hang * .25 + rng.range(-.04, .04), base[1] - hang, base[2] + outDir[1] * hang * .25 + rng.range(-.04, .04)]);
    const mid: P = base;
    s.tri(a, b, t, sub(s.point(a), mid)); s.tri(b, c, t, sub(s.point(b), mid)); s.tri(c, a, t, sub(s.point(c), mid));
  }
  /** 一片杂草地。 */
  weeds(rng: Rng, cx: number, cz: number, rx: number, rz: number, count: number, y = 0, keys: string[] = ["grass", "grassD", "grassY"]) {
    for (let k = 0; k < count; k++) { const a = rng.range(0, Math.PI * 2), r = Math.sqrt(rng.next()); this.tuft(rng.pick(keys), rng, cx + Math.cos(a) * rx * r, y, cz + Math.sin(a) * rz * r, rng.range(.25, .7), 4); }
  }
  /** 灌木：几个叠起来的球。 */
  bush(key: string, rng: Rng, x: number, y: number, z: number, r: number) {
    this.sphere(key, [x, y + r * .8, z], r);
    for (let k = 0; k < 2; k++) this.sphere(key, [x + rng.range(-r, r) * .8, y + r * rng.range(.5, 1), z + rng.range(-r, r) * .8], r * rng.range(.55, .8));
  }
  /** 攀在墙上的藤：沿墙面向上的弯曲细管，间隔点缀叶片。 */
  vine(rng: Rng, f: Frame, side: 1 | -1, n: number, u: number, y0: number, y1: number, key = "leaf", stem = "wood") {
    const pts: P[] = [], radii: number[] = [], steps = Math.max(3, Math.round((y1 - y0) / .5));
    for (let k = 0; k <= steps; k++) { pts.push(pt(f, u + Math.sin(k * 1.7 + u) * .18, n + side * .03, y0 + (y1 - y0) * k / steps)); radii.push(.018); }
    this.sweep(stem, pts, radii);
    for (let k = 1; k <= steps; k++) for (const g of [-1, 1]) {
      const p = pts[k]!, d = tangent(f), s = this.soup(key, 4), r = rng.range(.09, .16), o = mul(outward(f), side * .035);
      const base: P = [p[0] + o[0], p[1], p[2] + o[2]];
      const a = s.vertex(base), b = s.vertex([base[0] + d[0] * g * r, base[1] + r * .5, base[2] + d[2] * g * r]), c = s.vertex([base[0] + d[0] * g * r * 1.5, base[1], base[2] + d[2] * g * r * 1.5]), e = s.vertex([base[0] + d[0] * g * r, base[1] - r * .5, base[2] + d[2] * g * r]);
      s.quad(a, b, c, e, mul(outward(f), side));
    }
  }
  /** 碎砖瓦砾堆：矮土丘加一圈歪斜的小方块；r 半径、h 堆高。 */
  heap(rng: Rng, x: number, z: number, y: number, r: number, h: number, keys: string[] = ["rubble", "rubbleS", "dirt"], count = Math.round(r * 9), moundKey = "dirt") {
    // 土丘：八边锥
    const s = this.soup(moundKey, 10), apex = s.vertex([x, y + h, z]), ring: number[] = [];
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; ring.push(s.vertex([x + Math.cos(a) * r, y, z + Math.sin(a) * r * rng.range(.8, 1.1)])); }
    for (let k = 0; k < 8; k++) s.tri(apex, ring[k]!, ring[(k + 1) % 8]!, [Math.cos((k + .5) / 8 * Math.PI * 2), .6, Math.sin((k + .5) / 8 * Math.PI * 2)]);
    for (let k = 0; k < count; k++) {
      const a = rng.range(0, Math.PI * 2), d = Math.sqrt(rng.next()) * r * .95, sz = rng.range(.08, .3) * (r > 1.5 ? 1.2 : 1);
      this.tbox(rng.pick(keys), [x + Math.cos(a) * d, y + h * (1 - d / r) * .9 + sz * .3, z + Math.sin(a) * d], [sz * rng.range(.8, 1.8), sz * rng.range(.5, 1), sz * rng.range(.8, 1.4)], rng.range(0, 360), rng.range(-30, 30), rng.range(-30, 30));
    }
  }
  /** 散落的砖瓦碎块（不堆土丘）。 */
  scatter(rng: Rng, cx: number, cz: number, rx: number, rz: number, y: number, count: number, keys: string[] = ["rubble", "rubbleS"], size = .16) {
    for (let k = 0; k < count; k++) {
      const a = rng.range(0, Math.PI * 2), d = Math.sqrt(rng.next()), sz = rng.range(.4, 1) * size;
      this.tbox(rng.pick(keys), [cx + Math.cos(a) * rx * d, y + sz * .3, cz + Math.sin(a) * rz * d], [sz * rng.range(1, 2), sz * rng.range(.4, .9), sz * rng.range(.8, 1.4)], rng.range(0, 360), rng.range(-12, 12), rng.range(-12, 12));
    }
  }
  /** 扁长的沙丘或土堆：椭圆底、偏心的脊点，贴着墙堆积（key 对应的组需调用方登记）。 */
  dune(key: string, rng: Rng, cx: number, cz: number, rx: number, rz: number, h: number, yaw = 0, y0 = 0, sides = 10) {
    const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG), soup = this.soup(key, sides + 2);
    const pos = (u: number, v: number, y: number): P => [cx + u * c + v * s, y, cz - u * s + v * c], apex = soup.vertex(pos(rx * .15, rz * .1, y0 + h)), ring: number[] = [];
    for (let k = 0; k < sides; k++) { const a = k / sides * Math.PI * 2, r = rng.range(.85, 1.08); ring.push(soup.vertex(pos(Math.cos(a) * rx * r, Math.sin(a) * rz * r, y0))); }
    for (let k = 0; k < sides; k++) { const a = (k + .5) / sides * Math.PI * 2; soup.tri(apex, ring[k]!, ring[(k + 1) % sides]!, [Math.cos(a) * c + Math.sin(a) * s, .7, -Math.cos(a) * s + Math.sin(a) * c]); }
  }
  /** 墙面裂缝：自上而下三折的细黑线。 */
  crack(key: string, rng: Rng, f: Frame, side: 1 | -1, n: number, u: number, y: number, length: number, off = .014) {
    const nn = n + side * off, out = mul(outward(f), side), s = this.soup(key, 8);
    let cu = u, cy = y, w = .035;
    let a = s.vertex(pt(f, cu - w, nn, cy)), b = s.vertex(pt(f, cu + w, nn, cy));
    for (let k = 0; k < 3; k++) {
      cu += rng.range(-.25, .25); cy -= length / 3; w *= .6;
      const c = s.vertex(pt(f, cu + w, nn, cy)), d = s.vertex(pt(f, cu - w, nn, cy));
      s.quad(a, b, c, d, out); a = d; b = c;
    }
  }
  /** 窗台下方或檐口下方的雨水污痕：上宽下窄的竖条。 */
  streak(key: string, f: Frame, side: 1 | -1, n: number, u: number, yTop: number, length: number, w: number, off = .013) {
    const nn = n + side * off, out = mul(outward(f), side);
    this.quad(key, pt(f, u - w / 2, nn, yTop), pt(f, u + w / 2, nn, yTop), pt(f, u + w * .18, nn, yTop - length), pt(f, u - w * .18, nn, yTop - length), out);
  }
  /** 围成圆形或多边形的残墙：segs 段直墙，每段是一面 wallRun；breach 给出缺口方向（度，自 +z 向 +x）和宽度，缺口附近的墙毁得更重。holes(k) 给出第 k 段的洞口。 */
  ringWall(rng: Rng, cx: number, cz: number, r: number, y0: number, H: number, thick: number, segs: number, o: { damage: number; keys: string[]; breach?: { angle: number; width: number }; holes?: (k: number, len: number) => Hole[]; gable?: (k: number) => ((u: number) => number) | undefined }) {
    const apothem = r * Math.cos(Math.PI / segs), edge = 2 * r * Math.sin(Math.PI / segs), ext = thick * Math.tan(Math.PI / segs);
    const tops: ((u: number) => number)[] = [];
    for (let k = 0; k < segs; k++) {
      const psi = 360 * (k + .5) / segs, dir: [number, number] = [Math.sin(psi * DEG), Math.cos(psi * DEG)], mid = apothem - thick / 2;
      const f: Frame = { x: cx + dir[0] * mid, z: cz + dir[1] * mid, yaw: psi };
      let damage = o.damage;
      if (o.breach) { const diff = Math.abs(((psi - o.breach.angle + 540) % 360) - 180); damage = diff < o.breach.width / 2 ? Math.min(1, o.damage + .6) : diff < o.breach.width ? Math.min(1, o.damage + .25) : o.damage; }
      const holes = o.holes?.(k, edge) ?? [], gable = o.gable?.(k);
      tops.push(this.wallRun(rng, f, -edge / 2 - ext, edge / 2 + ext, y0, H, thick, holes, { damage, keys: o.keys, ...(gable ? { gable } : {}) }));
    }
    return tops;
  }
  /** 带随机缺口的楼板：按 cell 分格，格内放一块木板（带两根托梁），zones 或随机比例 missing 的格子缺失；返回缺失格的中心，供上面堆东西。 */
  floorGrid(rng: Rng, key: string, joist: string, x0: number, z0: number, x1: number, z1: number, y: number, o: { cell?: number; missing?: number; thick?: number; gone?: (x: number, z: number) => boolean }) {
    const cell = o.cell ?? 1.2, nx = Math.max(1, Math.round((x1 - x0) / cell)), nz = Math.max(1, Math.round((z1 - z0) / cell)), th = o.thick ?? .12, gaps: [number, number][] = [];
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
      const cx = x0 + (x1 - x0) * (i + .5) / nx, cz = z0 + (z1 - z0) * (k + .5) / nz;
      if (o.gone?.(cx, cz) || rng.chance(o.missing ?? 0)) { gaps.push([cx, cz]); continue; }
      this.box(key, cx, y - th / 2, cz, (x1 - x0) / nx - .02, th, (z1 - z0) / nz - .02);
    }
    for (let k = 0; k <= nz; k += 1) if (rng.chance(.85)) { const z = z0 + (z1 - z0) * k / nz; this.beam(joist, [x0, y - th - .08, z], [x1, y - th - .08 + rng.range(-.05, .05), z], .14, .18); }
    return gaps;
  }
}

// ---------- 部件级的摆放与合并（把几座小房子拼成一个建筑群） ----------
/** 把一组 mesh 部件整体平移并绕竖轴转 yaw 度（局部 x 转到 (cosθ,0,-sinθ)，与 boxYaw 一致），返回新部件。 */
export function placeParts(parts: ModelPart[], x: number, y: number, z: number, yaw = 0): ModelPart[] {
  const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG);
  return parts.map(part => part.shape !== "mesh" || !part.vertices ? { ...part, position: { x: part.position.x + x, y: part.position.y + y, z: part.position.z + z } } : { ...part, vertices: part.vertices.map(v => ({ x: Math.round((v.x * c + v.z * s + x) * 1000) / 1000, y: Math.round((v.y + y) * 1000) / 1000, z: Math.round((-v.x * s + v.z * c + z) * 1000) / 1000 })) });
}
/** 把同名同色同材质的 mesh 合并成少量部件（每个不超过 500 顶点），非 mesh 部件原样保留。 */
export function mergeMeshes(parts: ModelPart[]): ModelPart[] {
  const groups = new Map<string, ModelPart[]>(), rest: ModelPart[] = [];
  for (const part of parts) {
    if (part.shape !== "mesh" || !part.vertices || !part.indices) { rest.push(part); continue; }
    const key = JSON.stringify([part.name, part.color, part.roughness, part.metalness, part.opacity, part.emissive, part.emissiveIntensity, part.position, part.rotation, part.scale]);
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(part);
  }
  const out: ModelPart[] = [];
  for (const list of groups.values()) {
    let current: ModelPart | undefined;
    for (const part of list) {
      const n = part.vertices!.length;
      if (!current || current.vertices!.length + n > 500 || current.indices!.length + part.indices!.length > 3072) { current = { ...part, vertices: [], indices: [] }; out.push(current); }
      const base = current.vertices!.length;
      current.vertices!.push(...part.vertices!);
      current.indices!.push(...part.indices!.map(i => i + base));
    }
  }
  return [...out, ...rest];
}
/** 整体旋转并平移：先绕局部 z 横滚、再绕 x 俯仰、最后绕竖轴偏航（度），再平移 (x,y,z)；用来把一个造好的构件（集装箱）摆歪。 */
export function rotateParts(parts: ModelPart[], x: number, y: number, z: number, yaw: number, pitch = 0, roll = 0): ModelPart[] {
  return parts.map(part => part.shape !== "mesh" || !part.vertices ? part : { ...part, vertices: part.vertices.map(v => { const r = rot([v.x, v.y, v.z], yaw, pitch, roll); return { x: Math.round((r[0] + x) * 1000) / 1000, y: Math.round((r[1] + y) * 1000) / 1000, z: Math.round((r[2] + z) * 1000) / 1000 }; }) });
}
/** 整体歪斜：x 方向随高度错动 k 米/米（mesh 部件），让房子看起来快要倒。 */
export function shearParts(parts: ModelPart[], kx: number, kz = 0): ModelPart[] {
  return parts.map(part => part.shape !== "mesh" || !part.vertices ? { ...part, position: { ...part.position, x: part.position.x + kx * part.position.y, z: part.position.z + kz * part.position.y } } : { ...part, vertices: part.vertices.map(v => ({ x: Math.round((v.x + kx * v.y) * 1000) / 1000, y: v.y, z: Math.round((v.z + kz * v.y) * 1000) / 1000 })) });
}

/** 登记破败建筑通用的颜色组；没用到的组不出部件。 */
export function ruinBuilder(pal: Pal): RuinBuilder {
  const b = new RuinBuilder();
  b.group("wall", "残墙墙体", pal.wall, { roughness: .95 }).group("wallB", "残墙墙体", shade(pal.wall, .82), { roughness: .96 }).group("wallC", "残墙墙体", shade(pal.wall, 1.1), { roughness: .94 })
    .group("brick", "裸露砖石", pal.brick, { roughness: .97 }).group("stone", "石基础与碎石", pal.stone, { roughness: .97 })
    .group("wood", "朽木构件", pal.wood, { roughness: .95 }).group("woodD", "焦黑朽木", pal.woodD, { roughness: .98 })
    .group("tile", "残瓦", pal.tile, { roughness: .9 }).group("tileD", "残瓦", shade(pal.tile, .78), { roughness: .92 }).group("tileM", "苔藓瓦片", mix(pal.tile, "#5b7a3a", .5), { roughness: .95 })
    .group("thatch", "茅草", pal.thatch, { roughness: 1 }).group("thatchD", "朽茅草", shade(pal.thatch, .72), { roughness: 1 })
    .group("metal", "锈蚀铁皮", pal.metal, { roughness: .6, metalness: .5 }).group("rust", "锈斑", "#7a4a2a", { roughness: .9, metalness: .3 })
    .group("glass", "碎玻璃", "#a9c0c4", { roughness: .15, opacity: .42 })
    .group("moss", "苔藓", "#5f7d3d", { roughness: 1 }).group("grass", "杂草", "#6f8a3c", { roughness: 1 }).group("grassD", "杂草", "#566b2c", { roughness: 1 }).group("grassY", "枯草", "#a09452", { roughness: 1 })
    .group("leaf", "藤叶灌木", "#4f7a34", { roughness: 1 })
    .group("soot", "烟熏黑迹", "#2b2724", { roughness: 1 }).group("dirt", "泥土污渍", "#6a5a45", { roughness: 1 }).group("damp", "水渍霉斑", mix(pal.wall, "#3d4a3a", .45), { roughness: 1 })
    .group("rubble", "碎砖瓦砾", shade(pal.brick, 1.05), { roughness: .97 }).group("rubbleS", "碎砖瓦砾", shade(pal.stone, .95), { roughness: .97 })
    .group("cloth", "破布草席", "#8f7e63", { roughness: 1 }).group("paper", "残破窗纸", "#d9cfb2", { roughness: 1 });
  return b;
}
