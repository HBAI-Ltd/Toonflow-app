import { part, type ModelPart } from "../assetModelParts";

// 中式屋面套件：用高度场网格生成凹曲屋面、翘角、瓦垄、压脊、戗脊、鸱吻和檐口装饰。
// 单个 mesh 部件受模型规则限制（≤512 顶点、≤1024 三角形），所以按颜色和用途拆成少量部件。
type P = [number, number, number];
export type RoofStyle = "gable" | "hip" | "xieshan" | "shed";
export type RoofKitInput = {
  width: number; depth: number; style: RoofStyle; color: string; trimColor?: string; ribs?: boolean; lanterns?: boolean;
  /** 檐口向外出挑（x 跨度向、z 进深向），默认 .6/.5 */
  overhang?: [number, number];
  /** 屋脊高度、坡面曲度、翼角上翘量；缺省按跨度推算 */
  rise?: number; curve?: number; lift?: number;
  /** 攒尖宝顶 */
  spire?: boolean;
  /** 双坡屋面两端山墙板颜色；缺省山墙与屋面同色 */
  gableWall?: string;
  /** 部件名前缀，便于在模型里区分多层屋面 */
  label?: string;
  /** 茅草屋面：厚缘、无翘角与脊饰，草束瓦垄；shed 单坡以 +x 侧为高边（靠墙一侧） */
  thatch?: boolean;
  /** 非中式的平直坡屋面：无翘角、无脊饰，薄檐口，瓦垄改为顺脊线的横向瓦行；shed/gable 可用 */
  plain?: boolean;
};

const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: P, b: P): P => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: P, b: P) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: P): P => { const length = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / length, a[1] / length, a[2] / length]; };
const round = (value: number) => Math.round(value * 1000) / 1000;
const UP: P = [0, 1, 0];

export function shade(hex: string, factor: number) {
  const value = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, Math.round(((value >> shift) & 255) * factor)));
  return `#${[16, 8, 0].map(shift => channel(shift).toString(16).padStart(2, "0")).join("")}`;
}

export class Soup {
  vertices: { x: number; y: number; z: number }[] = [];
  indices: number[] = [];
  vertex(p: P) { this.vertices.push({ x: round(p[0]), y: round(p[1]), z: round(p[2]) }); return this.vertices.length - 1; }
  point(index: number): P { const v = this.vertices[index]!; return [v.x, v.y, v.z]; }
  // 三角形朝向由 hint 方向校正，避免逐面推算绕序；退化三角形直接丢弃（模型校验不接受）。
  tri(a: number, b: number, c: number, hint: P) {
    const n = cross(sub(this.point(b), this.point(a)), sub(this.point(c), this.point(a)));
    if (dot(n, n) < 1e-10) return;
    if (dot(n, hint) < 0) this.indices.push(a, c, b); else this.indices.push(a, b, c);
  }
  quad(a: number, b: number, c: number, d: number, hint: P) { this.tri(a, b, c, hint); this.tri(a, c, d, hint); }
  box(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    for (const s of [-1, 1]) {
      this.quad(this.vertex([cx + s * hx, cy - hy, cz - hz]), this.vertex([cx + s * hx, cy + hy, cz - hz]), this.vertex([cx + s * hx, cy + hy, cz + hz]), this.vertex([cx + s * hx, cy - hy, cz + hz]), [s, 0, 0]);
      this.quad(this.vertex([cx - hx, cy + s * hy, cz - hz]), this.vertex([cx + hx, cy + s * hy, cz - hz]), this.vertex([cx + hx, cy + s * hy, cz + hz]), this.vertex([cx - hx, cy + s * hy, cz + hz]), [0, s, 0]);
      this.quad(this.vertex([cx - hx, cy - hy, cz + s * hz]), this.vertex([cx + hx, cy - hy, cz + s * hz]), this.vertex([cx + hx, cy + hy, cz + s * hz]), this.vertex([cx - hx, cy + hy, cz + s * hz]), [0, 0, s]);
    }
  }
  // 绕竖轴旋转 yaw 度的长方体：中心 (cx,cy,cz)，局部尺寸 (sx,sy,sz)，局部 x 轴转到 (cosθ,0,-sinθ)。
  boxYaw(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, yawDeg: number) {
    const angle = yawDeg * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle), hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const at = (x: number, y: number, z: number): P => [cx + x * c + z * s, cy + y, cz - x * s + z * c];
    const dir = (x: number, y: number, z: number): P => [x * c + z * s, y, -x * s + z * c];
    for (const sign of [-1, 1]) {
      this.quad(this.vertex(at(sign * hx, -hy, -hz)), this.vertex(at(sign * hx, hy, -hz)), this.vertex(at(sign * hx, hy, hz)), this.vertex(at(sign * hx, -hy, hz)), dir(sign, 0, 0));
      this.quad(this.vertex(at(-hx, sign * hy, -hz)), this.vertex(at(hx, sign * hy, -hz)), this.vertex(at(hx, sign * hy, hz)), this.vertex(at(-hx, sign * hy, hz)), dir(0, sign, 0));
      this.quad(this.vertex(at(-hx, -hy, sign * hz)), this.vertex(at(hx, -hy, sign * hz)), this.vertex(at(hx, hy, sign * hz)), this.vertex(at(-hx, hy, sign * hz)), dir(0, 0, sign));
    }
  }
  // 沿路径扫掠的小管，半径逐点变化，用于脊条、戗脊与卷曲脊饰。
  sweep(path: P[], radii: number[], sides = 5) {
    const rings: number[][] = [], radial: P[][] = [];
    for (let k = 0; k < path.length; k++) {
      const tangent = norm(sub(path[Math.min(path.length - 1, k + 1)]!, path[Math.max(0, k - 1)]!));
      const ref: P = Math.abs(tangent[1]) < .9 ? UP : [1, 0, 0];
      const n = norm(cross(ref, tangent)), b = cross(tangent, n), ring: number[] = [], dirs: P[] = [];
      for (let s = 0; s < sides; s++) {
        const angle = s / sides * Math.PI * 2, c = Math.cos(angle), si = Math.sin(angle);
        const dir: P = [n[0] * c + b[0] * si, n[1] * c + b[1] * si, n[2] * c + b[2] * si];
        dirs.push(dir); ring.push(this.vertex([path[k]![0] + dir[0] * radii[k]!, path[k]![1] + dir[1] * radii[k]!, path[k]![2] + dir[2] * radii[k]!]));
      }
      rings.push(ring); radial.push(dirs);
    }
    for (let k = 0; k + 1 < rings.length; k++) for (let s = 0; s < sides; s++) {
      const t = (s + 1) % sides;
      this.quad(rings[k]![s]!, rings[k]![t]!, rings[k + 1]![t]!, rings[k + 1]![s]!, radial[k]![s]!);
    }
  }
  sphere(center: P, radius: number, segments = 7, rings = 4) {
    const grid: number[][] = [];
    for (let r = 0; r <= rings; r++) {
      const phi = Math.PI * r / rings, row: number[] = [];
      for (let s = 0; s < (r === 0 || r === rings ? 1 : segments); s++) {
        const theta = Math.PI * 2 * s / segments;
        row.push(this.vertex([center[0] + radius * Math.sin(phi) * Math.cos(theta), center[1] + radius * Math.cos(phi), center[2] + radius * Math.sin(phi) * Math.sin(theta)]));
      }
      grid.push(row);
    }
    const at = (r: number, s: number) => grid[r]![r === 0 || r === rings ? 0 : s % segments]!;
    for (let r = 0; r < rings; r++) for (let s = 0; s < segments; s++) {
      const mid = norm(sub(this.point(at(r, s)), center));
      this.quad(at(r, s), at(r + 1, s), at(r + 1, s + 1), at(r, s + 1), mid);
    }
  }
  toPart(name: string, color: string, extra: Partial<ModelPart> = {}): ModelPart | undefined {
    // 超出单个 mesh 上限的部件会令整个模型校验失败，宁可舍弃该细节。
    if (this.indices.length < 3 || this.vertices.length > 512 || this.indices.length > 3072) return undefined;
    return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices: this.vertices, indices: this.indices, ...extra });
  }
}

type Shape = { a: number; b: number; H: number; p: number; rh: number; rg: number; lift: number; kk: number; style: RoofStyle; thatch: boolean; plain: boolean };

function shapeOf(input: RoofKitInput): Shape {
  const { width, depth, style } = input, a = width / 2 + (input.overhang?.[0] ?? .6), b = depth / 2 + (input.overhang?.[1] ?? .5), H = input.rise ?? Math.max(.55, width * .2);
  const thatch = input.thatch === true, plain = input.plain === true && !thatch, tame = (value: number) => thatch ? Math.min(value, .12) : plain ? 0 : value;
  if (style === "shed") return { a, b, H, p: input.curve ?? (plain ? 1 : 1.25), rh: b, rg: b, lift: input.lift ?? tame(Math.min(.22, .04 * a + .08)), kk: 2.6, style, thatch, plain };
  if (style === "gable") return { a, b, H, p: input.curve ?? (thatch ? 1.2 : plain ? 1 : 1.6), rh: b, rg: b, lift: input.lift ?? tame(Math.min(.4, .05 * a + .14)), kk: 2.6, style, thatch, plain };
  const lift = input.lift ?? tame(Math.min(.95, .12 * a + .22));
  if (style === "hip") { const rh = Math.max(.4, b - a); return { a, b, H, p: input.curve ?? (thatch ? 1.25 : 1.7), rh: Math.min(rh, b - .8), rg: Math.min(rh, b - .8), lift, kk: 2.6, style, thatch, plain: false }; }
  const rh = Math.min(b - 1.1, Math.max(.5, b - a));
  return { a, b, H: input.rise ?? H * 1.05, p: input.curve ?? (thatch ? 1.25 : 1.6), rh, rg: rh + (b - rh) * .45, lift, kk: 2.6, style, thatch, plain: false };
}

/** 屋面上任意点的高度（局部坐标，y=0 为屋面基线），供栏杆、灯具等贴合屋面。 */
export function roofHeight(input: RoofKitInput, x: number, z: number) { return heightAt(shapeOf(input), x, z); }

// 翼角上翘量：双坡/庑殿/歇山在四角抬起；单坡只在低边（x=-a）两角抬起。
function liftAt(s: Shape, x: number, z: number) {
  const w = Math.min(1, Math.abs(z) / s.b);
  if (s.style === "shed") return s.lift * Math.pow(1 - Math.min(1, Math.max(0, (x + s.a) / (2 * s.a))), s.kk) * Math.pow(w, s.kk);
  return s.lift * Math.pow(Math.min(1, Math.abs(x) / s.a) * w, s.kk);
}

// 局部坐标：x 跨度、z 进深；y=0 为屋面基线（墙顶在 -.22）。out=false 取歇山山花墙内侧一列。
function heightAt(s: Shape, x: number, z: number, out = true) {
  const az = Math.abs(z);
  if (s.style === "shed") return s.H * Math.pow(Math.min(1, Math.max(0, (x + s.a) / (2 * s.a))), s.p) + liftAt(s, x, z);
  const u = Math.min(1, Math.abs(x) / s.a);
  let h = s.H * Math.pow(1 - u, s.p);
  if (s.rh < s.b) {
    const hip = s.style === "hip" || az > s.rg + 1e-9 || (Math.abs(az - s.rg) <= 1e-9 && out);
    if (hip) h = Math.min(h, az <= s.rh ? s.H : s.H * Math.pow(Math.max(0, 1 - (az - s.rh) / (s.b - s.rh)), s.p));
  }
  return h + liftAt(s, x, z);
}

function buildSurface(s: Shape) {
  const xs = Array.from({ length: 13 }, (_, i) => s.a * Math.sin(Math.PI / 2 * (i - 6) / 6));
  const half: { z: number; out: boolean }[] = [];
  const specials = [s.rh, s.rg].filter(v => v > .25 && v < s.b - .25);
  for (let j = 0; j <= 7; j++) { const z = s.b * (1 - Math.pow(1 - j / 7, 1.35)); if (j === 0 || j === 7 || !specials.some(v => Math.abs(v - z) < .4)) half.push({ z, out: true }); }
  if (s.style === "xieshan") half.push({ z: s.rg, out: false }, { z: s.rg, out: true }, { z: s.rh, out: true });
  else if (s.rh < s.b - .25) half.push({ z: s.rh, out: true });
  half.sort((p, q) => p.z - q.z || Number(p.out) - Number(q.out));
  const rows = [...half.filter(r => r.z > 0).reverse().map(r => ({ z: -r.z, out: r.out })), ...half];
  const soup = new Soup(), grid: number[][] = [];
  for (const row of rows) grid.push(xs.map(x => soup.vertex([x, heightAt(s, x, row.z, row.out), row.z])));
  for (let j = 0; j + 1 < rows.length; j++) {
    const vertical = Math.abs(rows[j]!.z - rows[j + 1]!.z) < 1e-9, hint: P = vertical ? [0, 0, rows[j]!.z >= 0 ? 1 : -1] : UP;
    for (let i = 0; i + 1 < xs.length; i++) soup.quad(grid[j]![i]!, grid[j + 1]![i]!, grid[j + 1]![i + 1]!, grid[j]![i + 1]!, hint);
  }
  // 周边环（逆时针看自上而下）：用于裙边、底面和檐口装饰。
  const nz = rows.length, nx = xs.length, ring: [number, number][] = [];
  for (let i = 0; i < nx; i++) ring.push([i, 0]);
  for (let j = 1; j < nz; j++) ring.push([nx - 1, j]);
  for (let i = nx - 2; i >= 0; i--) ring.push([i, nz - 1]);
  for (let j = nz - 2; j >= 1; j--) ring.push([0, j]);
  const edge = ring.map(([i, j]) => { const x = xs[i]!, z = rows[j]!.z, y = heightAt(s, x, z, rows[j]!.out); return { x, y, z, bottom: Math.min(y - .08, -.25 + liftAt(s, x, z)) }; });
  const skirtTop = edge.map(e => soup.vertex([e.x, e.y, e.z])), skirtBottom = edge.map(e => soup.vertex([e.x, e.bottom, e.z])), under = edge.map(e => soup.vertex([e.x, e.bottom, e.z])), center = soup.vertex([0, -.25, 0]);
  for (let k = 0; k < edge.length; k++) {
    const n = (k + 1) % edge.length, here = edge[k]!, outward: P = norm([Math.abs(here.x) >= s.a - 1e-6 ? Math.sign(here.x) : 0, 0, Math.abs(here.z) >= s.b - 1e-6 ? Math.sign(here.z) : 0]);
    soup.quad(skirtTop[k]!, skirtTop[n]!, skirtBottom[n]!, skirtBottom[k]!, outward);
    soup.tri(center, under[k]!, under[n]!, [0, -1, 0]);
  }
  return { soup, edge, xs, rows };
}

function ribSoups(s: Shape) {
  const soups: Soup[] = [new Soup()];
  const spacing = (s.thatch ? 1.3 : 1) * Math.max(.36, Math.min(.5, s.a / 10)), half = s.thatch ? .11 : s.plain ? .06 : .085, tall = s.thatch ? .07 : s.plain ? .045 : .11;
  const rib = (path: P[], lateral: P) => {
    if (path.length < 2) return;
    let soup = soups[soups.length - 1]!;
    if (soup.vertices.length + path.length * 4 > 508) soups.push(soup = new Soup());
    // 每条瓦垄用独立顶点的三角截面，两侧坡面分别着色，远看也有明暗条纹。
    const rows = path.map(p => [soup.vertex([p[0] - lateral[0] * half, p[1] - .01, p[2] - lateral[2] * half]), soup.vertex([p[0], p[1] + tall, p[2]]), soup.vertex([p[0], p[1] + tall, p[2]]), soup.vertex([p[0] + lateral[0] * half, p[1] - .01, p[2] + lateral[2] * half])]);
    for (let k = 0; k + 1 < rows.length; k++) { soup.quad(rows[k]![0]!, rows[k]![1]!, rows[k + 1]![1]!, rows[k + 1]![0]!, UP); soup.quad(rows[k]![2]!, rows[k]![3]!, rows[k + 1]![3]!, rows[k + 1]![2]!, UP); }
  };
  const samples = 4;
  // 左右两坡：沿 x 向脊线爬升，垄间沿 z 排布；翼角区止于戗脊交线。
  const zCount = Math.max(1, Math.floor((s.b - .35) / spacing));
  if (s.plain) {
    // 平直坡屋面：沿脊线方向一行行横向瓦行，近坡口密、近脊稀的差别忽略，取等距。
    const courseSpacing = Math.max(.28, Math.min(.42, s.a / 12)), zEnd = s.b - .22, lines: number[] = [];
    if (s.style === "shed") { const lo = -s.a * .96, hi = s.a - .35, count = Math.max(2, Math.floor((hi - lo) / courseSpacing)); for (let n = 0; n < count; n++) lines.push(lo + (hi - lo) * (n + .5) / count); }
    else { const hi = s.a * .96, lo = .45, count = Math.max(2, Math.floor((hi - lo) / courseSpacing)); for (let n = 0; n < count; n++) { const x = hi - (hi - lo) * (n + .5) / count; lines.push(x, -x); } }
    for (const x of lines) rib([-zEnd, 0, zEnd].map(z => [x, heightAt(s, x, z) + .01, z] as P), [1, 0, 0]);
    return soups;
  }
  if (s.style === "shed") {
    // 单坡：自低边向靠墙高边一条条爬升
    for (let n = -zCount; n <= zCount; n++) {
      const z = n * (s.b - .35) / zCount, startX = -s.a * .97, endX = s.a - .3;
      rib(Array.from({ length: samples }, (_, k) => { const x = startX + (endX - startX) * k / (samples - 1); return [x, heightAt(s, x, z) + .015, z] as P; }), [0, 0, 1]);
    }
    return soups;
  }
  for (let n = -zCount; n <= zCount; n++) {
    const z = n * spacing * (s.b - .35) / (zCount * spacing) , az = Math.abs(z);
    for (const side of [-1, 1]) {
      const startX = side * s.a * .97;
      let endU = .06;
      if (s.rh < s.b && az > s.rh && (s.style === "hip" || az > s.rg)) endU = Math.max(endU, (az - s.rh) / (s.b - s.rh));
      const endX = side * (s.a * endU + .3);
      if (Math.abs(startX - endX) < .5) continue;
      rib(Array.from({ length: samples }, (_, k) => { const x = startX + (endX - startX) * k / (samples - 1); return [x, heightAt(s, x, z) + .015, z] as P; }), [0, 0, 1]);
    }
  }
  // 前后两坡（歇山/庑殿）：沿 z 向脊端爬升。
  if (s.rh < s.b) {
    const xCount = Math.max(1, Math.floor((s.a - .35) / spacing));
    for (let n = -xCount; n <= xCount; n++) {
      const x = n * (s.a - .35) / xCount, u = Math.abs(x) / s.a;
      for (const side of [-1, 1]) {
        const startZ = side * s.b * .97, creaseZ = side * (s.rh + u * (s.b - s.rh) + .3), topZ = s.style === "xieshan" ? side * (s.rg + .25) : side * (s.rh + .25);
        const endZ = Math.abs(creaseZ) < Math.abs(topZ) ? topZ : creaseZ;
        if (Math.abs(startZ - endZ) < .5) continue;
        rib(Array.from({ length: samples }, (_, k) => { const z = startZ + (endZ - startZ) * k / (samples - 1); return [x, heightAt(s, x, z) + .015, z] as P; }), [1, 0, 0]);
      }
    }
  }
  return soups;
}

function edgeTrim(s: Shape, edge: { x: number; y: number; z: number }[]) {
  const soup = new Soup();
  // 檐口缘板：沿屋面周边抬起一圈，向外略探。
  const drop = s.thatch ? .34 : s.plain ? .16 : .25, lip = s.thatch ? .14 : s.plain ? .03 : .1, reach = s.thatch ? .12 : s.plain ? .05 : .08;
  const sections = edge.map(e => {
    const out: P = norm([Math.abs(e.x) >= s.a - 1e-6 ? Math.sign(e.x) : 0, 0, Math.abs(e.z) >= s.b - 1e-6 ? Math.sign(e.z) : 0]);
    const inX = e.x - out[0] * .4, inZ = e.z - out[2] * .4;
    return { low: soup.vertex([e.x + out[0] * reach, e.y - drop, e.z + out[2] * reach]), top: soup.vertex([e.x + out[0] * reach, e.y + lip, e.z + out[2] * reach]), inner: soup.vertex([inX, heightAt(s, inX, inZ) + lip - .01, inZ]), out, high: s.style === "shed" && e.x >= s.a - 1e-6 };
  });
  for (let k = 0; k < sections.length; k++) {
    const a = sections[k]!, b = sections[(k + 1) % sections.length]!;
    if (a.high || b.high) continue;
    soup.quad(a.low, a.top, b.top, b.low, a.out); soup.quad(a.top, a.inner, b.inner, b.top, UP);
  }
  return soup;
}

function ridgeWork(s: Shape, spire = false) {
  const soup = new Soup();
  if (s.style === "shed") {
    // 靠墙高边：压顶泛水条
    soup.box(s.a - .14, s.H + .05, 0, s.thatch ? .36 : .3, s.thatch ? .24 : .16, s.b * 2 - .1);
    return soup;
  }
  const ridgeHalf = s.style === "gable" ? s.b - .05 : s.style === "xieshan" ? s.rg : Math.max(.3, s.rh);
  if (s.plain) {
    // 平直屋面：一道扣脊瓦，不加鸱吻
    soup.box(0, s.H + .05, 0, .34, .12, ridgeHalf * 2 + .06);
    return soup;
  }
  if (s.thatch) {
    // 草顶：脊上压一道粗大的草束，两端略下垂；戗脊处用细一些的草束收口
    soup.sweep([[0, s.H + .02, -ridgeHalf - .12], [0, s.H + .16, -ridgeHalf + .1], [0, s.H + .2, 0], [0, s.H + .16, ridgeHalf - .1], [0, s.H + .02, ridgeHalf + .12]], [.2, .26, .27, .26, .2], 6);
    if (s.style !== "gable") for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const startZ = s.style === "xieshan" ? s.rg : s.rh, path: P[] = [], radii: number[] = [];
      for (let k = 0; k <= 6; k++) { const t = k / 6, z = startZ + (s.b - startZ) * t, x = s.a * (z - s.rh) / (s.b - s.rh); path.push([sx * x, heightAt(s, x, z) + .06, sz * z]); radii.push(.15 - .05 * t); }
      soup.sweep(path, radii, 5);
    }
    return soup;
  }
  soup.box(0, s.H + .06, 0, s.style === "gable" ? .62 : .54, .2, ridgeHalf * 2 + .16);
  soup.box(0, s.H + .24, 0, s.style === "gable" ? .4 : .34, .2, ridgeHalf * 2);
  // 戗脊：从脊端（歇山为山花墙底角）沿交线下行至翼角，并随翼角上翘。
  if (s.style !== "gable") {
    const startZ = s.style === "xieshan" ? s.rg : s.rh;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const path: P[] = [], radii: number[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8, z = startZ + (s.b - startZ) * t, x = s.a * (z - s.rh) / (s.b - s.rh);
        path.push([sx * x, heightAt(s, x, z) + .07, sz * z]); radii.push(.1 - .035 * t);
      }
      soup.sweep(path, radii, 5);
      // 翼角卷头
      if (s.thatch) continue;
      const c = path[path.length - 1]!, d = norm([sx, 0, sz]);
      soup.sweep([[c[0], c[1], c[2]], [c[0] + d[0] * .16, c[1] + .16, c[2] + d[2] * .16], [c[0] + d[0] * .3, c[1] + .38, c[2] + d[2] * .3], [c[0] + d[0] * .3, c[1] + .58, c[2] + d[2] * .3], [c[0] + d[0] * .18, c[1] + .64, c[2] + d[2] * .18]], [.06, .052, .045, .036, .025], 5);
    }
  }
  if (spire) {
    // 攒尖宝顶：仰莲座、宝珠与刹尖。
    soup.box(0, s.H + .3, 0, .62, .16, .62);
    soup.sphere([0, s.H + .62, 0], .26, 8, 5);
    soup.sweep([[0, s.H + .8, 0], [0, s.H + 1.15, 0], [0, s.H + 1.55, 0]], [.09, .06, .015], 5);
  }
  // 鸱吻：脊端上卷，向脊心回勾；小屋面按比例缩小。
  const fs = Math.min(1, Math.max(.5, s.b / 3.4));
  for (const sz of spire ? [] : [-1, 1]) {
    const z0 = sz * ridgeHalf, y0 = s.H + .26;
    soup.sweep([[0, y0, z0], [0, y0 + .22 * fs, z0 + sz * .05 * fs], [0, y0 + .44 * fs, z0 + sz * .12 * fs], [0, y0 + .62 * fs, z0 + sz * .08 * fs], [0, y0 + .7 * fs, z0 - sz * .06 * fs], [0, y0 + .62 * fs, z0 - sz * .17 * fs], [0, y0 + .5 * fs, z0 - sz * .13 * fs]], [.12, .105, .095, .08, .068, .052, .034].map(r => r * fs), 6);
  }
  return soup;
}

function gableFaces(s: Shape) {
  const soup = new Soup();
  if (s.style !== "xieshan") return soup;
  for (const sz of [-1, 1]) {
    // 山花：歇山脊端的竖直三角墙，沿坡线逐段取点，外移 2cm 避免与屋面共面闪烁。
    const z = sz * (s.rg + .02), xs = Array.from({ length: 9 }, (_, i) => s.a * i / 8);
    const spans = xs.map(x => ({ x, top: heightAt(s, x, sz * s.rg, false), bottom: heightAt(s, x, sz * s.rg, true) }));
    for (const side of [-1, 1]) for (let i = 0; i + 1 < spans.length; i++) {
      const p = spans[i]!, q = spans[i + 1]!;
      if (p.top - p.bottom < .02 && q.top - q.bottom < .02) continue;
      soup.quad(soup.vertex([side * p.x, p.bottom, z]), soup.vertex([side * q.x, q.bottom, z]), soup.vertex([side * q.x, q.top - .02, z]), soup.vertex([side * p.x, p.top - .02, z]), [0, 0, sz]);
    }
  }
  return soup;
}

// 双坡山墙：屋面端部实心三角面外贴一层墙色板，板顶留出檐口缘板的高度。
function gableWalls(s: Shape) {
  const soup = new Soup();
  if (s.style !== "gable" && s.style !== "shed") return soup;
  const xs = Array.from({ length: 13 }, (_, i) => s.a * Math.sin(Math.PI / 2 * (i - 6) / 6));
  for (const sz of [-1, 1]) {
    const z = sz * (s.b + .012), row = xs.map(x => {
      const top = heightAt(s, x, sz * s.b) - (s.thatch ? .36 : .26), bottom = -.25 + liftAt(s, x, sz * s.b) + .02;
      return [soup.vertex([x, bottom, z]), soup.vertex([x, Math.max(top, bottom + .05), z])] as const;
    });
    for (let i = 0; i + 1 < row.length; i++) soup.quad(row[i]![0], row[i + 1]![0], row[i + 1]![1], row[i]![1], [0, 0, sz]);
  }
  return soup;
}

function lanternSoup(s: Shape) {
  const soup = new Soup();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) soup.sphere([sx * (s.a - .22), s.lift - .56, sz * (s.b - .22)], .16);
  return soup;
}

export function chooseStyle(width: number, depth: number): RoofStyle {
  const aspect = depth / width;
  if (width < 3.2) return "gable";
  if (aspect <= 1.45 && width >= 4.5) return "xieshan";
  if (aspect <= 1.9) return "hip";
  return "gable";
}

export function roofKitParts(input: RoofKitInput): ModelPart[] {
  const s = shapeOf(input);
  const trim = input.trimColor ?? "#b5a584";
  const surface = buildSurface(s);
  const body = surface.soup.toPart("曲面瓦屋顶", input.color, { roughness: .85 });
  if (!body) return [];
  const named = (value: ModelPart | undefined) => { if (value && input.label) value.name = `${input.label}${value.name}`; return value; };
  const parts: (ModelPart | undefined)[] = [
    named(body),
    named(edgeTrim(s, surface.edge).toPart("檐口缘板", trim, { roughness: .8 })),
    named(ridgeWork(s, input.spire).toPart("屋脊戗脊与鸱吻", trim, { roughness: .8 })),
  ];
  parts.push(named(gableFaces(s).toPart("歇山山花板", "#cfc5ad", { roughness: .9 })));
  if (input.gableWall) parts.push(named(gableWalls(s).toPart("悬山山墙", input.gableWall, { roughness: .92 })));
  if (input.ribs !== false) for (const soup of ribSoups(s)) parts.push(named(soup.toPart("瓦垄", shade(input.color, 1.1), { roughness: .85 })));
  if (input.lanterns !== false && !input.thatch && input.style !== "gable" && input.style !== "shed" && input.width >= 4.5) parts.push(named(lanternSoup(s).toPart("檐角宫灯", "#f2e3b7", { emissive: "#f0c878", emissiveIntensity: .5, roughness: .6 })));
  return parts.filter((value): value is ModelPart => value !== undefined);
}
