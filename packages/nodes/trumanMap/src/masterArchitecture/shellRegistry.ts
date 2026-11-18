import type { ModelPart } from "../assetModelParts";
import type { Opening } from "./facadeKit";

// 空壳化的体量：登记它的门窗洞口（面内切向区间、世界高度），砌缝、面板线条等贴在外墙面上的细节要绕开洞口。
// 键是原来那个实心体量的部件对象，空壳化完成后该部件会从模型里移除，但登记仍可查。
export const bodyHoles = new WeakMap<ModelPart, Opening[]>();

type Piece = [number, number, number, number];

/** 从矩形 [t0,t1]×[y0,y1] 里减掉某个面上的所有洞口（外扩 margin），返回剩下的矩形片。 */
export function clipRect(holes: Opening[] | undefined, face: number, t0: number, t1: number, y0: number, y1: number, margin = .03): Piece[] {
  let pieces: Piece[] = [[t0, t1, y0, y1]];
  for (const hole of holes ?? []) {
    if (hole.face !== face) continue;
    const h0 = hole.t0 - margin, h1 = hole.t1 + margin, hy0 = hole.y0 - margin, hy1 = hole.y1 + margin, next: Piece[] = [];
    for (const [a, c, lo, hi] of pieces) {
      if (c <= h0 || a >= h1 || hi <= hy0 || lo >= hy1) { next.push([a, c, lo, hi]); continue; }
      if (a < h0) next.push([a, h0, lo, hi]);
      if (c > h1) next.push([h1, c, lo, hi]);
      const ma = Math.max(a, h0), mc = Math.min(c, h1);
      if (lo < hy0) next.push([ma, mc, lo, hy0]);
      if (hi > hy1) next.push([ma, mc, hy1, hi]);
    }
    pieces = next.filter(([a, c, lo, hi]) => c - a > .012 && hi - lo > .012);
  }
  return pieces;
}
