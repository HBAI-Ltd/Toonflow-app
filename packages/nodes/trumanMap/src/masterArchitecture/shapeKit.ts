import { Euler, Quaternion, Vector3 } from "three";
import type { ModelPart } from "../assetModelParts";
import { FacadeBuilder } from "./facadeKit";
import { DEG } from "./partMath";

// 造型件细化的小工具：按部件自身的位置、旋转、缩放把局部坐标变到世界，
// 在任意朝向的部件上贴四边形、摆长方体、绕轴铺环线、拉直线管。输出都进 Builder 的合并 mesh。
export type P = [number, number, number];

export class Xf {
  private readonly q: Quaternion; private readonly o: Vector3; private readonly s: Vector3;
  /** useScale = false 时局部坐标直接按米计（贴在被缩放过的方盒表面用）；默认按部件的单位局部坐标（含缩放）。 */
  constructor(value: ModelPart, useScale = true) {
    this.q = new Quaternion().setFromEuler(new Euler(value.rotation.x * DEG, value.rotation.y * DEG, value.rotation.z * DEG));
    this.o = new Vector3(value.position.x, value.position.y, value.position.z);
    this.s = useScale ? new Vector3(value.scale.x, value.scale.y, value.scale.z) : new Vector3(1, 1, 1);
  }
  p(x: number, y: number, z: number): P { const v = new Vector3(x * this.s.x, y * this.s.y, z * this.s.z).applyQuaternion(this.q).add(this.o); return [v.x, v.y, v.z]; }
  d(x: number, y: number, z: number): P { const v = new Vector3(x, y, z).applyQuaternion(this.q); return [v.x, v.y, v.z]; }
}

export class ShapeBuilder extends FacadeBuilder {
  /** 局部四点（逆时针顺序不限）的单面四边形，法向取局部 normal 经部件旋转后的方向。 */
  xquad(key: string, xf: Xf, a: P, b: P, c: P, d: P, normal: P) {
    const soup = this.soup(key, 4), v = (p: P) => soup.vertex(xf.p(...p));
    soup.quad(v(a), v(b), v(c), v(d), xf.d(...normal));
  }
  /** 局部坐标系里的长方体：中心 c、尺寸 size。 */
  xbox(key: string, xf: Xf, c: P, size: P) {
    const [hx, hy, hz] = [size[0] / 2, size[1] / 2, size[2] / 2], soup = this.soup(key, 24);
    const v = (x: number, y: number, z: number) => soup.vertex(xf.p(c[0] + x, c[1] + y, c[2] + z));
    for (const s of [-1, 1]) {
      soup.quad(v(s * hx, -hy, -hz), v(s * hx, hy, -hz), v(s * hx, hy, hz), v(s * hx, -hy, hz), xf.d(s, 0, 0));
      soup.quad(v(-hx, s * hy, -hz), v(hx, s * hy, -hz), v(hx, s * hy, hz), v(-hx, s * hy, hz), xf.d(0, s, 0));
      soup.quad(v(-hx, -hy, s * hz), v(hx, -hy, s * hz), v(hx, hy, s * hz), v(-hx, hy, s * hz), xf.d(0, 0, s));
    }
  }
  /** 绕局部某根轴的圆环线：圆心 c、半径 radius、管粗 tube。 */
  xring(key: string, xf: Xf, c: P, radius: number, tube: number, axis: "x" | "y" | "z" = "y", segments = 18, from = 0, to = Math.PI * 2) {
    const path: P[] = [];
    for (let k = 0; k <= segments; k++) {
      const a = from + (to - from) * k / segments, u = Math.cos(a) * radius, w = Math.sin(a) * radius;
      path.push(xf.p(...(axis === "y" ? [c[0] + u, c[1], c[2] + w] : axis === "x" ? [c[0], c[1] + u, c[2] + w] : [c[0] + u, c[1] + w, c[2]]) as P));
    }
    this.sweep(key, path, path.map(() => tube));
  }
  /** 两个局部点之间的一段直管。 */
  xline(key: string, xf: Xf, a: P, b: P, tube: number) {
    this.sweep(key, [xf.p(...a), xf.p(...b)], [tube, tube]);
  }
  /** 沿一串局部点的曲线管。 */
  xpath(key: string, xf: Xf, points: P[], tube: number) {
    this.sweep(key, points.map(point => xf.p(...point)), points.map(() => tube));
  }
  /** 世界坐标里的双锥晶体：底点 base、朝向 dir（单位向量）、长 length、腰部半径 radius，腰在 30% 长度处。 */
  shard(key: string, base: P, dir: P, radius: number, length: number) {
    const soup = this.soup(key, 6), len = Math.hypot(...dir) || 1, d: P = [dir[0] / len, dir[1] / len, dir[2] / len];
    const ref: P = Math.abs(d[1]) < .9 ? [0, 1, 0] : [1, 0, 0];
    const cross = (a: P, b: P): P => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const norm = (a: P): P => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const u = norm(cross(ref, d)), v = cross(d, u);
    const at = (t: number, du: number, dv: number): P => [base[0] + d[0] * t + u[0] * du + v[0] * dv, base[1] + d[1] * t + u[1] * du + v[1] * dv, base[2] + d[2] * t + u[2] * du + v[2] * dv];
    const apex = soup.vertex(at(length, 0, 0)), bottom = soup.vertex(at(0, 0, 0));
    const ring = [soup.vertex(at(length * .3, radius, 0)), soup.vertex(at(length * .3, 0, radius)), soup.vertex(at(length * .3, -radius, 0)), soup.vertex(at(length * .3, 0, -radius))];
    const out = (index: number): P => { const p = soup.point(index), c = at(length * .3, 0, 0); return [p[0] - c[0], p[1] - c[1], p[2] - c[2]]; };
    for (let i = 0; i < 4; i++) {
      const a = ring[i]!, c = ring[(i + 1) % 4]!, hint = (e: number): P => { const p = out(a), q = out(c), r = out(e); return [(p[0] + q[0] + r[0]) / 3, (p[1] + q[1] + r[1]) / 3, (p[2] + q[2] + r[2]) / 3]; };
      soup.tri(apex, a, c, hint(apex)); soup.tri(bottom, c, a, hint(bottom));
    }
  }
  /** 世界坐标里的球。 */
  ball(key: string, c: P, radius: number) { this.sphere(key, c, radius); }
}

/** 颜色提亮或压暗并限制在合法范围内。 */
export function tone(hex: string, factor: number) {
  const value = parseInt(hex.slice(1), 16), channel = (shift: number) => Math.max(0, Math.min(255, Math.round(((value >> shift) & 255) * factor)));
  return `#${[16, 8, 0].map(shift => channel(shift).toString(16).padStart(2, "0")).join("")}`;
}

/** 世界坐标直接当局部坐标用的恒等变换（贴水平面、摆世界轴向的细件）。 */
export const WORLD = new Xf({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } } as ModelPart);
