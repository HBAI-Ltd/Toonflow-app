import type { ModelPart } from "../assetModelParts";
import { shade } from "./chineseRoofKit";
import { FacadeBuilder } from "./facadeKit";
import { ShapeBuilder, Xf, type P } from "./shapeKit";
import { DEG, yawOf } from "./partMath";
import { bodyHoles, clipRect } from "./shellRegistry";

// 石墙、砖墙、夯土墙的砌缝：在大块墙体、塔身、门墩的四个立面上铺横缝和错缝竖缝（单面四边形，很省顶点）。
// 只处理名称带石、砖、岩、土墙、塔身的竖直长方体，名称带台阶、栏杆、地面的不处理。
const STONE = /石|砖|岩|垒|夯土|土墙|土藏|塔身|墙体|城墙|墙垛|墙身/, NOT_MASONRY = /地|台阶|阶|踏|栏|灯|水面|池|屋顶|瓦|门扇|窗|柱础|础|基础|凳|桌|椅|碑|像|兽|雕/;

export function dressMasonry(parts: ModelPart[], room: number, maxQuads = 220): ModelPart[] {
  if (room < 1) return [];
  const b = new FacadeBuilder();
  b.group("mortarStone", "石墙砌缝", "#6f6b62", { roughness: 1 }).group("mortarBrick", "砖墙勾缝", "#cfc8b6", { roughness: 1 });
  let quads = 0, any = false;
  const flat = (key: string, x: number, y: number, z: number, w: number, h: number, dir: number) => { if (quads >= maxQuads) return; quads++; any = true; b.rect(key, x, y, z, w, h, dir); };
  for (const value of parts) {
    if (quads >= maxQuads) break;
    if (value.shape !== "box" || !STONE.test(value.name) || NOT_MASONRY.test(value.name)) continue;
    const yaw = yawOf(value);
    if (yaw === undefined) continue;
    const { x: sx, y: sy, z: sz } = value.scale;
    if (sy < .9 || Math.max(sx, sz) < 1.1) continue;
    const brick = /砖/.test(value.name), key = brick ? "mortarBrick" : "mortarStone", course = brick ? .24 : /夯土|土墙/.test(value.name) ? .6 : .5, block = brick ? .5 : /夯土|土墙/.test(value.name) ? 1.6 : 1.0;
    const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG), y0 = value.position.y - sy / 2;
    // 四个立面：局部 (t, n) → 世界
    const faces = [
      { width: sx, half: sz / 2, along: true, sign: 1, dir: 0 }, { width: sx, half: sz / 2, along: true, sign: -1, dir: 180 },
      { width: sz, half: sx / 2, along: false, sign: 1, dir: 90 }, { width: sz, half: sx / 2, along: false, sign: -1, dir: 270 },
    ];
    const holes = bodyHoles.get(value);
    for (const [faceId, face] of faces.entries()) {
      if (face.width < .6) continue;
      const world = (t: number, n: number): [number, number] => {
        const lx = face.along ? t : face.sign * (face.half + n), lz = face.along ? face.sign * (face.half + n) : t;
        return [value.position.x + lx * c + lz * s, value.position.z - lx * s + lz * c];
      };
      // 空壳体量的门窗洞口要避开：缝线按洞口裁成几段
      const emit = (t0: number, t1: number, ya: number, yb: number, w: number) => {
        for (const [a, e, lo, hi] of clipRect(holes, faceId, t0, t1, ya, yb)) { const [x, z] = world((a + e) / 2, .012); flat(key, x, (lo + hi) / 2, z, Math.max(e - a, w), hi - lo, yaw + face.dir); }
      };
      const rows = Math.floor((sy - .1) / course);
      for (let k = 1; k <= rows; k++) {
        const y = y0 + k * course;
        emit(-face.width / 2 + .02, face.width / 2 - .02, y - .011, y + .011, 0);
        // 竖缝：相邻两层错开半块
        const offset = (k % 2) * block / 2;
        for (let t = -face.width / 2 + block / 2 + offset; t < face.width / 2 - .1; t += block) {
          emit(t - .01, t + .01, y - course + .015, y - .015, .02);
        }
      }
    }
  }
  return any ? b.parts().slice(0, room) : [];
}

// 石、砖、土、墩、柱、墙一类大块的上下加压顶和底座线脚：压顶出挑 6cm，底座出挑 4cm。
// 只在其余细化都没改动模型时作为兜底，让门墩、桥墩、石台这类造型件也有收边。
const EDGE_NAME = /石|砖|土|台|柱|墩|墙|座|碑|塔|门|拱|桥|阶|基/, NOT_EDGE = /地面|水面|池|屋顶|瓦|门扇|窗|灯|栏杆|扶手|梯|旗|绳|索|帐|棚|草/;

export function dressEdges(parts: ModelPart[], room: number, maxBoxes = 60): ModelPart[] {
  if (room < 1) return [];
  const b = new ShapeBuilder();
  const groups = new Map<string, string>();
  let count = 0;
  for (const value of parts) {
    if (count >= maxBoxes) break;
    if (value.shape !== "box" || !EDGE_NAME.test(value.name) || NOT_EDGE.test(value.name)) continue;
    const yaw = yawOf(value);
    if (yaw === undefined) continue;
    const { x: sx, y: sy, z: sz } = value.scale;
    if (sy < .5 || Math.min(sx, sz) < .4 || Math.max(sx, sz) < .45) continue;
    let key = groups.get(value.color);
    if (!key) { key = `edge${groups.size}`; groups.set(value.color, key); const hex = value.color.length === 7 ? value.color : "#a8a396"; b.group(key, "收边线脚", shade(hex, 1.1), { roughness: .9 }); }
    const base = value.position.y - sy / 2, top = value.position.y + sy / 2;
    b.boxYaw(key, value.position.x, top + .04, value.position.z, sx + .12, .08, sz + .12, yaw);
    if (sy >= .9) b.boxYaw(key, value.position.x, base + .07, value.position.z, sx + .08, .14, sz + .08, yaw);
    count += sy >= .9 ? 2 : 1;
    // 高大的墩柱四个立面各压一圈凹板线（四条细线）
    if (sy >= 1.8 && Math.min(sx, sz) >= .4) {
      const xf = new Xf(value, false), line = `${key}l`;
      b.group(line, "墩柱凹板线", shade(value.color.length === 7 ? value.color : "#a8a396", .72), { roughness: 1 });
      const y0 = -sy / 2 + .42, y1 = sy / 2 - .38, t = .024;
      for (const face of [{ along: sx, half: sz / 2, alongX: true }, { along: sz, half: sx / 2, alongX: false }]) for (const sign of [-1, 1]) {
        const w = face.along - .18, n = sign * (face.half + .008);
        const q = (u0: number, v0: number, u1: number, v1: number) => {
          const p = (u: number, v: number): P => face.alongX ? [u, v, n] : [n, v, u];
          b.xquad(line, xf, p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1), face.alongX ? [0, 0, sign] : [sign, 0, 0]);
        };
        q(-w / 2, y1 - t, w / 2, y1); q(-w / 2, y0, w / 2, y0 + t); q(-w / 2, y0, -w / 2 + t, y1); q(w / 2 - t, y0, w / 2, y1);
      }
    }
  }
  return count ? b.parts().slice(0, room) : [];
}

// 逐级收分的台塔（金字塔、阶梯神庙）：中心对齐、边长逐级缩小的一叠方台，正面（+z）补一道通到顶的中央踏道。
export function dressTiers(parts: ModelPart[], room: number): ModelPart[] {
  if (room < 1) return [];
  const tiers = parts.filter(value => value.shape === "box" && yawOf(value) === 0 && value.scale.y >= .3 && Math.abs(value.scale.x - value.scale.z) < .05 && value.scale.x >= 2);
  const groups: ModelPart[][] = [];
  for (const tier of tiers) {
    const group = groups.find(list => Math.abs(list[0]!.position.x - tier.position.x) < .1 && Math.abs(list[0]!.position.z - tier.position.z) < .1);
    if (group) group.push(tier); else groups.push([tier]);
  }
  const stack = groups.sort((p, q) => q.length - p.length)[0];
  if (!stack || stack.length < 3) return [];
  const sorted = [...stack].sort((p, q) => p.position.y - q.position.y);
  const bottom = sorted[0]!, top = sorted[sorted.length - 1]!, y0 = bottom.position.y - bottom.scale.y / 2, y1 = top.position.y + top.scale.y / 2;
  const zFront0 = bottom.position.z + bottom.scale.z / 2, zFront1 = top.position.z + top.scale.z / 2, run = zFront0 - zFront1, rise = y1 - y0;
  if (run < .8 || rise < .8) return [];
  const steps = Math.max(6, Math.min(28, Math.round(rise / .22))), width = Math.min(2.6, Math.max(1.2, bottom.scale.x * .2));
  const b = new FacadeBuilder();
  b.group("stair", "中央踏道", shade(bottom.color, 1.12), { roughness: .92 }).group("stairEdge", "踏道边墙", shade(bottom.color, .86), { roughness: .92 });
  for (let k = 0; k < steps; k++) {
    const h = rise * (k + 1) / steps, depth = run / steps, z = zFront0 - depth * (k + .5) + .04;
    b.box("stair", bottom.position.x, y0 + h / 2, z, width, h, depth + .02);
  }
  for (const side of [-1, 1]) b.boxYaw("stairEdge", bottom.position.x + side * (width / 2 + .12), y0 + rise / 2 - .1, (zFront0 + zFront1) / 2 + .04, .24, rise * .96, run, 0);
  return b.parts().slice(0, room);
}
