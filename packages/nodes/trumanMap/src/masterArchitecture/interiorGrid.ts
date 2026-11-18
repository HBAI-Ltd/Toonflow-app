import { Euler, Quaternion, Vector3 } from "three";
import type { ModelPart } from "../assetModelParts";
import { DEG } from "./partMath";

// 室内占位网格：把已有几何按“人身高度带”投影到平面网格，再据此判断哪里是室内、哪里是墙、哪里有空地。
// 家具只摆在空地里，不穿墙、不压住原有器物，并给门口和通道留出余量。
export type Cover = { cx: number; cz: number; yaw: number; hx: number; hz: number; ceiling: number; /** 来自屋面套件的曲面屋顶（中式梁架用） */ kit?: boolean };

export const CELL = .25;

export class Grid {
  readonly nx: number; readonly nz: number;
  /** 0 空；1 被几何占用（人身高度带内有东西）；2 已分配给家具 */
  readonly occ: Uint8Array;
  /** 人身高度带内占用该格的几何的最低点；以及该格上任何高度 ≤ 地面+3.4m 的几何的最高点（含窗台上方的墙、过梁） */
  readonly bottom: Float32Array; readonly topAny: Float32Array;
  /** 人身高度带内占用该格的几何的实际范围 [minX, maxX, minZ, maxZ]，用来把家具贴到真实墙面上 */
  readonly ext: Float32Array;
  /** 该格上方最低的天花（人头 2.2m 以上最低的几何底面），没有则很大 */
  readonly ceil: Float32Array;
  /** 被屋面覆盖且收缩后的室内候选 */
  readonly inside: Uint8Array;
  /** 被屋面覆盖（未收缩），墙就落在这个范围里 */
  readonly covered: Uint8Array;
  constructor(readonly x0: number, readonly z0: number, nx: number, nz: number, readonly floorY: number) {
    this.nx = nx; this.nz = nz;
    this.occ = new Uint8Array(nx * nz); this.inside = new Uint8Array(nx * nz); this.covered = new Uint8Array(nx * nz);
    this.topAny = new Float32Array(nx * nz).fill(-1e9); this.bottom = new Float32Array(nx * nz).fill(1e9);
    this.ceil = new Float32Array(nx * nz).fill(1e9);
    this.ext = new Float32Array(nx * nz * 4); for (let k = 0; k < nx * nz; k++) { this.ext[k * 4] = 1e9; this.ext[k * 4 + 1] = -1e9; this.ext[k * 4 + 2] = 1e9; this.ext[k * 4 + 3] = -1e9; }
  }
  idx(i: number, j: number) { return j * this.nx + i; }
  inBounds(i: number, j: number) { return i >= 0 && j >= 0 && i < this.nx && j < this.nz; }
  cellOf(x: number, z: number): [number, number] { return [Math.floor((x - this.x0) / CELL), Math.floor((z - this.z0) / CELL)]; }
  center(i: number, j: number): [number, number] { return [this.x0 + (i + .5) * CELL, this.z0 + (j + .5) * CELL]; }
  /** 高大且落地的占用：墙、实心柱、大型家具之类 */
  wallLike(i: number, j: number) {
    if (!this.inBounds(i, j)) return false;
    const k = this.idx(i, j);
    return this.occ[k] === 1 && this.bottom[k] <= this.floorY + .5 && this.topAny[k] >= this.floorY + 2.2;
  }
  free(i: number, j: number) { return this.inBounds(i, j) && this.occ[this.idx(i, j)] === 0 && this.inside[this.idx(i, j)] === 1; }
}

type Prim = { y0: number; y1: number; rects: [number, number, number, number][] };

function localBounds(value: ModelPart): { min: Vector3; max: Vector3 } | undefined {
  switch (value.shape) {
    case "box": case "sphere": case "cylinder": case "cone": case "capsule": case "torus": return { min: new Vector3(-.5, -.5, -.5), max: new Vector3(.5, .5, .5) };
    case "lathe": { if (!value.profile?.length) return undefined; const r = Math.max(...value.profile.map(p => p.x)), ys = value.profile.map(p => p.y); return { min: new Vector3(-r, Math.min(...ys), -r), max: new Vector3(r, Math.max(...ys), r) }; }
    case "extrude": { if (!value.profile?.length) return undefined; const xs = value.profile.map(p => p.x), ys = value.profile.map(p => p.y), d = (value.depth ?? .2) / 2; return { min: new Vector3(Math.min(...xs), Math.min(...ys), -d), max: new Vector3(Math.max(...xs), Math.max(...ys), d) }; }
    case "tube": { if (!value.path?.length) return undefined; const min = new Vector3(1e9, 1e9, 1e9), max = new Vector3(-1e9, -1e9, -1e9), r = value.radius ?? .08; for (const p of value.path) { min.min(new Vector3(p.x - r, p.y - r, p.z - r)); max.max(new Vector3(p.x + r, p.y + r, p.z + r)); } return { min, max }; }
    default: return undefined;
  }
}

/** 把部件拆成可投影的图元：网格按三角形，其余按整体包围盒；变换含位置、旋转、缩放。 */
export function primitivesOf(parts: ModelPart[], limit = 90000): Prim[] {
  const result: Prim[] = []; let budget = limit;
  for (const value of parts) {
    const q = new Quaternion().setFromEuler(new Euler(value.rotation.x * DEG, value.rotation.y * DEG, value.rotation.z * DEG)), origin = new Vector3(value.position.x, value.position.y, value.position.z);
    if (value.shape === "mesh" && value.vertices && value.indices) {
      const world = value.vertices.map(v => new Vector3(v.x * value.scale.x, v.y * value.scale.y, v.z * value.scale.z).applyQuaternion(q).add(origin));
      for (let i = 0; i + 2 < value.indices.length && budget > 0; i += 3, budget--) {
        const a = world[value.indices[i]!]!, b = world[value.indices[i + 1]!]!, c = world[value.indices[i + 2]!]!;
        result.push({ y0: Math.min(a.y, b.y, c.y), y1: Math.max(a.y, b.y, c.y), rects: [[Math.min(a.x, b.x, c.x), Math.min(a.z, b.z, c.z), Math.max(a.x, b.x, c.x), Math.max(a.z, b.z, c.z)]] });
      }
      continue;
    }
    const local = localBounds(value);
    if (!local) continue;
    let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const x of [local.min.x, local.max.x]) for (const y of [local.min.y, local.max.y]) for (const z of [local.min.z, local.max.z]) {
      const p = new Vector3(x * value.scale.x, y * value.scale.y, z * value.scale.z).applyQuaternion(q).add(origin);
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
    }
    result.push({ y0, y1, rects: [[x0, z0, x1, z1]] });
  }
  return result;
}

/** 按屋面覆盖范围建网格：覆盖范围向内收缩 shrink 米后才算室内候选；返回 undefined 表示没有合适的室内。 */
export function buildGrid(prims: Prim[], covers: Cover[], floorY: number, shrink = .7): Grid | undefined {
  const usable = covers.filter(c => c.ceiling >= floorY + 2.4 && c.hx - shrink > 1 && c.hz - shrink > 1);
  if (!usable.length) return undefined;
  let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
  for (const c of usable) { const r = Math.hypot(c.hx, c.hz); x0 = Math.min(x0, c.cx - r); x1 = Math.max(x1, c.cx + r); z0 = Math.min(z0, c.cz - r); z1 = Math.max(z1, c.cz + r); }
  const nx = Math.ceil((x1 - x0) / CELL) + 2, nz = Math.ceil((z1 - z0) / CELL) + 2;
  if (nx * nz > 400000) return undefined;
  const grid = new Grid(x0 - CELL, z0 - CELL, nx, nz, floorY);
  // 室内候选：落在某个收缩后的屋面矩形内
  for (const c of usable) {
    const cos = Math.cos(c.yaw * DEG), sin = Math.sin(c.yaw * DEG), hx = c.hx - shrink, hz = c.hz - shrink;
    const r = Math.hypot(c.hx, c.hz), [ia, ja] = grid.cellOf(c.cx - r, c.cz - r), [ib, jb] = grid.cellOf(c.cx + r, c.cz + r);
    for (let j = Math.max(0, ja); j <= Math.min(nz - 1, jb); j++) for (let i = Math.max(0, ia); i <= Math.min(nx - 1, ib); i++) {
      const [x, z] = grid.center(i, j), dx = x - c.cx, dz = z - c.cz, lx = dx * cos - dz * sin, lz = dx * sin + dz * cos;
      if (Math.abs(lx) <= c.hx && Math.abs(lz) <= c.hz) grid.covered[grid.idx(i, j)] = 1;
      if (Math.abs(lx) <= hx && Math.abs(lz) <= hz) grid.inside[grid.idx(i, j)] = 1;
    }
  }
  // 人身高度带内的几何：y 区间与 [floor+.12, floor+2.0] 相交即占用；另记录 ≤ floor+3.4m 的最高点，用来识别窗台上方还有墙的格子
  const lo = floorY + .12, hi = floorY + 2.0, reach = floorY + 3.4;
  const head = floorY + 2.2, top = floorY + 14;
  for (const prim of prims) {
    if (prim.y1 < lo || prim.y0 > top) continue;
    if (prim.y0 > reach) {
      // 高处的几何只用来求天花高度
      for (const [rx0, rz0, rx1, rz1] of prim.rects) {
        const [ia, ja] = grid.cellOf(rx0, rz0), [ib, jb] = grid.cellOf(rx1, rz1);
        for (let j = Math.max(0, ja); j <= Math.min(nz - 1, jb); j++) for (let i = Math.max(0, ia); i <= Math.min(nx - 1, ib); i++) { const k = grid.idx(i, j); grid.ceil[k] = Math.min(grid.ceil[k]!, prim.y0); }
      }
      continue;
    }
    const inBand = prim.y0 <= hi;
    for (const [rx0, rz0, rx1, rz1] of prim.rects) {
      const [ia, ja] = grid.cellOf(rx0 - .04, rz0 - .04), [ib, jb] = grid.cellOf(rx1 + .04, rz1 + .04);
      for (let j = Math.max(0, ja); j <= Math.min(nz - 1, jb); j++) for (let i = Math.max(0, ia); i <= Math.min(nx - 1, ib); i++) {
        const k = grid.idx(i, j);
        grid.topAny[k] = Math.max(grid.topAny[k]!, prim.y1);
        if (prim.y0 >= head) grid.ceil[k] = Math.min(grid.ceil[k]!, prim.y0);
        if (inBand) {
          grid.occ[k] = 1; grid.bottom[k] = Math.min(grid.bottom[k]!, prim.y0);
          grid.ext[k * 4] = Math.min(grid.ext[k * 4]!, rx0); grid.ext[k * 4 + 1] = Math.max(grid.ext[k * 4 + 1]!, rx1); grid.ext[k * 4 + 2] = Math.min(grid.ext[k * 4 + 2]!, rz0); grid.ext[k * 4 + 3] = Math.max(grid.ext[k * 4 + 3]!, rz1);
        }
      }
    }
  }
  return grid;
}

/** 到最近障碍（占用、已分配、室内之外）的距离，单位格；切比雪夫距离，两遍扫描。 */
export function clearance(grid: Grid): Uint16Array {
  const { nx, nz } = grid, d = new Uint16Array(nx * nz), big = 65000;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = grid.idx(i, j); d[k] = grid.occ[k] !== 0 || grid.inside[k] === 0 ? 0 : big; }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = grid.idx(i, j); if (d[k] === 0) continue;
    let m = d[k]!;
    if (i > 0) m = Math.min(m, d[k - 1]! + 1); if (j > 0) m = Math.min(m, d[k - nx]! + 1);
    if (i > 0 && j > 0) m = Math.min(m, d[k - nx - 1]! + 1); if (i < nx - 1 && j > 0) m = Math.min(m, d[k - nx + 1]! + 1);
    d[k] = m;
  }
  for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) {
    const k = grid.idx(i, j); if (d[k] === 0) continue;
    let m = d[k]!;
    if (i < nx - 1) m = Math.min(m, d[k + 1]! + 1); if (j < nz - 1) m = Math.min(m, d[k + nx]! + 1);
    if (i < nx - 1 && j < nz - 1) m = Math.min(m, d[k + nx + 1]! + 1); if (i > 0 && j < nz - 1) m = Math.min(m, d[k + nx - 1]! + 1);
    d[k] = m;
  }
  return d;
}

/** 室内判定：自该格向四个方向走到墙（高大落地占用）之前不离开屋面覆盖范围的方向数。 */
export function enclosure(grid: Grid, maxCells = 64): Uint8Array {
  const { nx, nz } = grid, result = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (!grid.free(i, j)) continue;
    let hits = 0;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      for (let step = 1; step <= maxCells; step++) {
        const a = i + di * step, b = j + dj * step;
        if (!grid.inBounds(a, b)) break;
        if (grid.wallLike(a, b)) { hits++; break; }
        if (grid.covered[grid.idx(a, b)] === 0) break;
      }
    }
    result[grid.idx(i, j)] = hits;
  }
  return result;
}
