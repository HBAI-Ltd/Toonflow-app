import { Box3, Euler, Quaternion, Vector3 } from "three";
import type { ModelPart } from "../assetModelParts";
import { Builder, lantern, palette, standardGroups } from "./chineseArchKit";
import { yawOf } from "./partMath";
import { mergedWalls, wallSpecs, type WallSpec } from "./roofRegistry";

// 已有中式建筑的外墙装修：沿外墙补檐下额枋、柱位壁柱、门窗外框、窗棂和门前宫灯。
// 只读取已生成的部件（薄而高的墙体 box，或 openingWall 登记过洞口的墙板），不改动原有结构。
export type Hole = { c: number; w: number; bottom: number; h: number };
export type Run = { axis: "x" | "z"; fixed: number; from: number; to: number; y0: number; y1: number; thick: number; holes: Hole[]; outward: 1 | -1 };

const DEG = Math.PI / 180;
const quaternionOf = (value: ModelPart) => new Quaternion().setFromEuler(new Euler(value.rotation.x * DEG, value.rotation.y * DEG, value.rotation.z * DEG));

export function worldBox(value: ModelPart): Box3 | undefined {
  const local = new Box3();
  if (value.shape === "box") local.set(new Vector3(-.5, -.5, -.5), new Vector3(.5, .5, .5));
  else if (value.shape === "mesh" && value.vertices) for (const v of value.vertices) local.expandByPoint(new Vector3(v.x, v.y, v.z));
  else if (value.shape === "sphere" || value.shape === "cylinder" || value.shape === "cone" || value.shape === "capsule" || value.shape === "torus") local.set(new Vector3(-.5, -.5, -.5), new Vector3(.5, .5, .5));
  else if (value.shape === "lathe" && value.profile?.length) { const r = Math.max(...value.profile.map(p => p.x)), ys = value.profile.map(p => p.y); local.set(new Vector3(-r, Math.min(...ys), -r), new Vector3(r, Math.max(...ys), r)); }
  else if (value.shape === "extrude" && value.profile?.length) { const xs = value.profile.map(p => p.x), ys = value.profile.map(p => p.y), d = (value.depth ?? .2) / 2; local.set(new Vector3(Math.min(...xs), Math.min(...ys), -d), new Vector3(Math.max(...xs), Math.max(...ys), d)); }
  else if (value.shape === "tube" && value.path) for (const p of value.path) local.expandByPoint(new Vector3(p.x, p.y, p.z)).expandByScalar(value.radius ?? .08);
  else return undefined;
  if (local.isEmpty()) return undefined;
  const q = quaternionOf(value), box = new Box3(), corner = new Vector3(), origin = new Vector3(value.position.x, value.position.y, value.position.z);
  for (const x of [local.min.x, local.max.x]) for (const y of [local.min.y, local.max.y]) for (const z of [local.min.z, local.max.z]) {
    box.expandByPoint(corner.set(x * value.scale.x, y * value.scale.y, z * value.scale.z).applyQuaternion(q).add(origin));
  }
  return box;
}

// 由世界包围盒和（可选的）洞口登记信息生成一段墙。dir 为墙局部 x 轴在世界中的方向。
function runOf(box: Box3, spec: WallSpec | undefined, dir: Vector3, wallBox: boolean): Run | undefined {
  const size = box.getSize(new Vector3()), thin = Math.min(size.x, size.z), along = Math.max(size.x, size.z);
  if (!spec && !wallBox) return undefined;
  if (thin > .5 || along < 2 || size.y < 2) return undefined;
  const axis: "x" | "z" = size.x >= size.z ? "x" : "z";
  const run: Run = { axis, fixed: axis === "x" ? (box.min.z + box.max.z) / 2 : (box.min.x + box.max.x) / 2, from: axis === "x" ? box.min.x : box.min.z, to: axis === "x" ? box.max.x : box.max.z, y0: box.min.y, y1: box.max.y, thick: thin, holes: [], outward: 1 };
  if (spec) {
    // 墙板局部 x 沿墙长，经部件旋转后映射到世界的沿墙方向；符号决定洞口中心的换算。
    const sign = axis === "x" ? Math.sign(dir.x) : Math.sign(dir.z), center = (run.from + run.to) / 2;
    if (sign !== 0 && Math.abs(axis === "x" ? dir.x : dir.z) > .9) for (const ring of spec.holes) {
      const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]), left = Math.min(...xs), right = Math.max(...xs), bottom = Math.min(...ys), top = Math.max(...ys);
      run.holes.push({ c: center + sign * (left + right) / 2, w: right - left, bottom, h: top - bottom });
    }
  }
  return run;
}

function collectRuns(parts: ModelPart[]): Run[] {
  const runs: Run[] = [];
  for (const value of parts) {
    const merged = mergedWalls.get(value);
    if (merged) {
      for (const wall of merged) {
        const run = runOf(new Box3(new Vector3(...wall.min), new Vector3(...wall.max)), wall.spec, new Vector3(...wall.dirX), false);
        if (run) runs.push(run);
      }
      continue;
    }
    const spec = wallSpecs.get(value), wallBox = value.shape === "box" && /墙|壁/.test(value.name) && yawOf(value) !== undefined;
    if (!spec && !wallBox) continue;
    const box = worldBox(value);
    const run = box ? runOf(box, spec, new Vector3(1, 0, 0).applyQuaternion(quaternionOf(value)), wallBox) : undefined;
    if (run) runs.push(run);
  }
  return runs;
}

/** 屋面外缘（含出挑）在世界平面中的位置，用来判断一堵墙属于哪座屋面以及朝向哪一侧。 */
export type RoofFrame = { x: number; y: number; z: number; yaw: number; hx: number; hz: number };

// 墙属于哪座屋面：墙顶落在屋面基线下方、墙位于屋面外缘内侧 1.6m 之内；朝向为背离屋面中心的一侧。
function belongsTo(run: Run, roofs: RoofFrame[]): { outward: 1 | -1; gap: number } | undefined {
  const center = new Vector3(run.axis === "x" ? (run.from + run.to) / 2 : run.fixed, 0, run.axis === "z" ? (run.from + run.to) / 2 : run.fixed);
  let best: { outward: 1 | -1; gap: number } | undefined;
  for (const roof of roofs) {
    if (run.y1 < roof.y - 1.8 || run.y1 > roof.y + .5) continue;
    const local = center.clone().sub(new Vector3(roof.x, 0, roof.z)).applyAxisAngle(new Vector3(0, 1, 0), -roof.yaw * Math.PI / 180);
    const quarter = Math.round(((roof.yaw % 180) + 180) % 180 / 90) % 2 === 1;   // 屋面局部 x 是否对应世界 z
    const alongLocalX = (run.axis === "x") !== quarter;
    const fixedLocal = alongLocalX ? local.z : local.x, extent = alongLocalX ? roof.hz : roof.hx, alongLocal = alongLocalX ? local.x : local.z, alongExtent = alongLocalX ? roof.hx : roof.hz;
    const gap = extent - Math.abs(fixedLocal);
    if (gap < -.3 || gap > 1.6 || Math.abs(alongLocal) > alongExtent + .3) continue;
    // 局部朝向（沿 fixedLocal 的符号）换算回世界：局部轴 → 世界轴方向
    const localDir = new Vector3(alongLocalX ? 0 : (Math.sign(fixedLocal) || 1), 0, alongLocalX ? (Math.sign(fixedLocal) || 1) : 0).applyAxisAngle(new Vector3(0, 1, 0), roof.yaw * Math.PI / 180);
    const outward = (run.axis === "x" ? localDir.z : localDir.x) >= 0 ? 1 : -1;
    if (!best || gap < best.gap) best = { outward, gap };
  }
  return best;
}

// 无屋面可依的墙（院墙、独立围墙）：只装修整体外轮廓上的一圈，外侧面距墙体包络边不超过 .7m。
function orient(runs: Run[], roofs: RoofFrame[]) {
  if (!runs.length) return [];
  const min = { x: Infinity, z: Infinity }, max = { x: -Infinity, z: -Infinity };
  for (const run of runs) {
    const half = run.thick / 2;
    if (run.axis === "x") { min.x = Math.min(min.x, run.from); max.x = Math.max(max.x, run.to); min.z = Math.min(min.z, run.fixed - half); max.z = Math.max(max.z, run.fixed + half); }
    else { min.z = Math.min(min.z, run.from); max.z = Math.max(max.z, run.to); min.x = Math.min(min.x, run.fixed - half); max.x = Math.max(max.x, run.fixed + half); }
  }
  const result: Run[] = [];
  for (const run of runs) {
    const owner = belongsTo(run, roofs);
    if (owner) { result.push({ ...run, outward: owner.outward }); continue; }
    if (roofs.length && runs.length > 1 && run.y1 - run.y0 < 2.4) continue;
    const lo = run.axis === "x" ? min.z : min.x, hi = run.axis === "x" ? max.z : max.x, half = run.thick / 2;
    const nearLow = run.fixed - half - lo, nearHigh = hi - (run.fixed + half);
    if (Math.min(nearLow, nearHigh) > .7) continue;
    result.push({ ...run, outward: nearLow <= nearHigh ? -1 : 1 });
  }
  return result;
}

/** 墙面装修的风格：chinese 为额枋壁柱宫灯；plain 只补勒脚、檐口线脚和门窗框；classical 再加墙端壁柱。 */
export type WallLook = { mode: "chinese" | "plain" | "classical"; trim?: string; stone?: string; frame?: string; frames?: boolean };

function dress(b: Builder, run: Run, seen: Set<string>, lanterns: { count: number }, look: WallLook) {
  const { axis, fixed, from, to, y0, y1, outward } = run, face = run.thick / 2, height = y1 - y0, length = to - from, chinese = look.mode === "chinese";
  const put = (t: number, y: number, along: number, tall: number, depth: number, off: number, key = "trim") => {
    if (axis === "x") b.box(key, t, y, fixed + outward * off, along, tall, depth); else b.box(key, fixed + outward * off, y, t, depth, tall, along);
  };
  // 檐下额枋 / 檐口线脚：通长一道，略探出墙面。
  if (chinese) put((from + to) / 2, y1 - .2, length + .08, .3, .18, face + .07);
  else put((from + to) / 2, y1 - (look.mode === "classical" ? .17 : .12), length + .06, look.mode === "classical" ? .3 : .22, look.mode === "classical" ? .2 : .14, face + (look.mode === "classical" ? .08 : .05));
  // 勒脚：墙根一道石带，门洞处断开，不挡通行。
  if (height >= 2.4 && length >= 1.2) {
    const slab = chinese ? .34 : .28, depth = chinese ? .1 : .08, doors = run.holes.filter(hole => hole.bottom < .4).map(hole => [hole.c - hole.w / 2 - .02, hole.c + hole.w / 2 + .02] as const).sort((p, q) => p[0] - q[0]);
    let cursor = from;
    for (const [left, right] of [...doors, [to, to] as const]) {
      if (left - cursor > .4) {
        const t = (cursor + left) / 2, along = left - cursor;
        if (axis === "x") b.box("stone", t, y0 + slab / 2, fixed + outward * (face + depth / 2 - .015), along, slab, depth); else b.box("stone", fixed + outward * (face + depth / 2 - .015), y0 + slab / 2, t, depth, slab, along);
      }
      cursor = Math.max(cursor, right);
    }
  }
  // 壁柱：中式在墙端与长墙等分处立壁柱（柱础、柱头齐备）；古典式只在墙端立素柱；其余不加。
  if (chinese || look.mode === "classical") {
    const spots = [from + .17, to - .17];
    if (chinese && length > 6) for (let i = 1; i <= Math.floor(length / 4.2); i++) spots.push(from + length * i / (Math.floor(length / 4.2) + 1));
    for (const t of spots) {
      if (run.holes.some(hole => Math.abs(t - hole.c) < hole.w / 2 + .3)) continue;
      const key = `${axis}${outward}|${Math.round(fixed * 4)}|${Math.round(t * 4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (chinese) {
        const shaft = height - .4;
        put(t, y0 + .16 + (shaft - .16) / 2, .32, shaft - .16, .26, face + .1);
        put(t, y0 + .08, .44, .16, .32, face + .13);
        put(t, y1 - .42, .44, .14, .32, face + .13);
      } else put(t, (y0 + y1) / 2, .3, height - .4, .12, face + .05);
    }
  }
  // 门窗外框和窗棂：洞口本身保持贯通，只在墙面外侧加框、在窗洞中补细棂。
  if (!chinese && !look.frames) return;
  const t = chinese ? .12 : .09;
  for (const hole of run.holes) {
    const bottom = y0 + hole.bottom, top = bottom + hole.h, mid = (bottom + top) / 2, isWindow = hole.bottom > .4;
    put(hole.c - hole.w / 2 - t / 2, mid, t, hole.h + t, t, face + .04, chinese ? "trim" : "door");
    put(hole.c + hole.w / 2 + t / 2, mid, t, hole.h + t, t, face + .04, chinese ? "trim" : "door");
    put(hole.c, top + t / 2, hole.w + t * 3, t, t + .02, face + .05, chinese ? "trim" : "door");
    if (isWindow) {
      put(hole.c, bottom - .05, hole.w + t * 3.4, .1, .22, face + .08, chinese ? "trim" : "stone");
      put(hole.c, mid, .05, hole.h, .05, 0, chinese ? "trim" : "door");
      put(hole.c, mid, hole.w, .05, .05, 0, chinese ? "trim" : "door");
    } else if (chinese && hole.h >= 2.2 && height >= 3 && lanterns.count < 6) {
      lanterns.count++;
      const pos = hole.c, off = face + .8;
      if (axis === "x") lantern(b, pos, y1 - .75, fixed + outward * off, .2, .3); else lantern(b, fixed + outward * off, y1 - .75, pos, .2, .3);
    }
  }
}

/** 返回装修新增的部件；room 为还能添加的部件数，用尽即停止。 */
export function dressWalls(parts: ModelPart[], room: number, roofs: RoofFrame[] = [], look: WallLook = { mode: "chinese" }): ModelPart[] {
  const runs = orient(collectRuns(parts), roofs).sort((p, q) => Number(q.outward < 0) - Number(p.outward < 0) || (q.to - q.from) - (p.to - p.from));
  if (!runs.length || room < 2) return [];
  const b = look.mode === "chinese" ? standardGroups(new Builder()) : new Builder()
    .group("trim", "檐口线脚与壁柱", look.trim ?? palette.trim).group("stone", "墙根勒脚", look.stone ?? palette.stone, { roughness: .95 }).group("door", "门窗外框", look.frame ?? "#4f575d");
  const seen = new Set<string>(), lanterns = { count: 0 };
  for (const run of runs) {
    if (b.partCount() >= room - 1) break;
    dress(b, run, seen, lanterns, look);
  }
  return b.parts().slice(0, room);
}

/** 属于某座屋面的外墙（含朝向和洞口），室内装饰用：朝向的反面就是室内。 */
export function exteriorWalls(parts: ModelPart[], roofs: RoofFrame[]): Run[] { return orient(collectRuns(parts), roofs); }
