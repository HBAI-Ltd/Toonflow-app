
import { DEG } from "./partMath";
import type { Rng, RuinBuilder, Frame, Hole, P } from "./ruinKit";

// 破败建筑的通用配件：八棱柱（含歪斜折断）、独立断墙、断栅栏、枯树与灌木、烟囱、招牌、破布幡、木箱木桶、残破台阶、碑、井。
/** 八棱柱：中心 (x,z)，底 y0、顶 y1，半径 r；lean 为顶面相对底面的水平偏移（歪斜或半截倒伏）。 */
export function pillar(b: RuinBuilder, key: string, x: number, z: number, y0: number, y1: number, r: number, o: { sides?: number; lean?: [number, number]; cap?: boolean } = {}) {
  const sides = o.sides ?? 8, lean = o.lean ?? [0, 0], bottom: P[] = [], top: P[] = [];
  for (let k = 0; k < sides; k++) { const a = (k + .5) / sides * Math.PI * 2, c = Math.cos(a) * r, s = Math.sin(a) * r; bottom.push([x + c, y0, z + s]); top.push([x + lean[0] + c, y1, z + lean[1] + s]); }
  for (let k = 0; k < sides; k++) { const n = (k + 1) % sides, a = (k + 1) / sides * Math.PI * 2; b.quad(key, bottom[k]!, bottom[n]!, top[n]!, top[k]!, [Math.cos(a - Math.PI / sides), 0, Math.sin(a - Math.PI / sides)]); }
  if (o.cap !== false) for (let k = 1; k + 1 < sides; k++) b.tri(key, top[0]!, top[k]!, top[k + 1]!, [0, 1, 0]);
}

/** 两点之间一道独立的断墙（院墙、残垣）。返回墙顶高度函数。 */
export function freeWall(b: RuinBuilder, rng: Rng, p: [number, number], q: [number, number], y0: number, H: number, thick: number, damage: number, keys: string[], holes: Hole[] = [], o: { gable?: (u: number) => number; floor?: number } = {}) {
  const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz), f: Frame = { x: (p[0] + q[0]) / 2, z: (p[1] + q[1]) / 2, yaw: Math.atan2(-dz, dx) / DEG };
  const top = b.wallRun(rng, f, -L / 2, L / 2, y0, H, thick, holes, { damage, keys, ...(o.gable ? { gable: o.gable } : {}), ...(o.floor !== undefined ? { floor: o.floor } : {}) });
  // 墙面上的苔藓与裂缝
  b.strip(rng.chance(.5) ? "moss" : "damp", rng, f, 1, thick / 2, -L / 2 + .2, L / 2 - .2, y0, .9, top);
  for (let k = 0, n = Math.round(L / 3); k < n; k++) { const u = rng.range(-L / 2 + .4, L / 2 - .4), y = y0 + rng.range(.6, H - .3); if (y < top(u) - .2) b.crack("soot", rng, f, rng.sign() as 1 | -1, thick / 2, u, y, rng.range(.6, 1.4)); }
  return { top, f, L };
}

/** 断栅栏：立柱歪斜、缺几根，两道横木断一道。 */
export function fence(b: RuinBuilder, rng: Rng, p: [number, number], q: [number, number], y0: number, h: number, spacing: number, key = "wood") {
  const L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(2, Math.round(L / spacing)), at2 = (t: number, y: number, lean = 0): P => [p[0] + (q[0] - p[0]) * t + lean, y, p[1] + (q[1] - p[1]) * t];
  for (let k = 0; k <= n; k++) { if (rng.chance(.15)) continue; const t = k / n, lean = rng.range(-.15, .15), hh = h * rng.range(.5, 1); b.beam(key, at2(t, y0), at2(t, y0 + hh, lean), .09, .09); }
  for (const level of [.35, .75]) for (let k = 0; k < n; k++) if (rng.chance(.6)) b.beam(key, at2(k / n, y0 + h * level), at2((k + 1) / n, y0 + h * level + rng.range(-.08, .08)), .05, .09);
}

/** 树：弯曲的主干、几根枝，leafy 时顶上一团叶球；dead 为光秃枯树。 */
export function tree(b: RuinBuilder, rng: Rng, x: number, z: number, h: number, o: { dead?: boolean; y?: number } = {}) {
  const y = o.y ?? 0, r = h * .035 + .06, path: P[] = [[x, y, z], [x + rng.range(-.3, .3), y + h * .35, z + rng.range(-.3, .3)], [x + rng.range(-.5, .5), y + h * .7, z + rng.range(-.5, .5)], [x + rng.range(-.6, .6), y + h, z + rng.range(-.6, .6)]];
  b.sweep("wood", path, [r, r * .78, r * .5, r * .25]);
  for (let k = 0; k < (o.dead ? 5 : 3); k++) {
    const from = path[1 + (k % 2)]!, a = rng.range(0, Math.PI * 2), len = h * rng.range(.25, .45), to: P = [from[0] + Math.cos(a) * len, from[1] + len * rng.range(.35, .8), from[2] + Math.sin(a) * len];
    b.sweep("wood", [from, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + .15, (from[2] + to[2]) / 2], to], [r * .4, r * .28, r * .12]);
    if (!o.dead) b.sphere("leaf", to, h * .16);
  }
  if (!o.dead) b.sphere("leaf", path[3]!, h * .2);
}

/** 砖砌烟囱：越往上越细，顶上缺一角。 */
export function chimney(b: RuinBuilder, rng: Rng, x: number, z: number, y0: number, h: number, w: number, key = "wallB") {
  const steps = 4;
  for (let k = 0; k < steps; k++) {
    const ww = w * (1 - k * .06), y = y0 + h * k / steps, hh = h / steps - (k === steps - 1 ? rng.range(0, h * .1) : 0);
    b.box(key, x, y + hh / 2, z, ww, hh, ww);
  }
  b.tbox("rubble", [x + w * .6, y0 + .15, z + w * .4], [.5, .3, .35], rng.range(0, 90), 0, 8);
  b.tbox("rubble", [x - w * .5, y0 + .12, z - w * .5], [.4, .25, .3], rng.range(0, 90), 0, -6);
}

/** 挂着的旧招牌：横梁、两根吊链、一块褪色木牌（key 为牌面颜色组）。 */
export function signBoard(b: RuinBuilder, rng: Rng, x: number, y: number, z: number, yaw: number, w: number, h: number, key = "wood", tilt = 0) {
  const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG), pos = (u: number, yy: number, n = 0): P => [x + u * c + n * s, yy, z - u * s + n * c];
  b.beam("woodD", pos(-w / 2 - .15, y + h / 2 + .25), pos(w / 2 + .15, y + h / 2 + .25), .08, .08);
  b.tbox(key, pos(0, y, .04), [w, h, .06], yaw, 0, tilt);
  for (const side of [-1, 1]) if (!rng.chance(.2)) b.beam("woodD", pos(side * (w / 2 - .1), y + h / 2 + .25), pos(side * (w / 2 - .1), y + h / 2 - .05 - Math.abs(tilt) * .01), .02, .02);
}

/** 破布幡：竖杆上垂下几条长短不一、被风撕烂的布条。 */
export function banner(b: RuinBuilder, rng: Rng, x: number, y0: number, z: number, h: number, key = "cloth", yaw = 0) {
  b.beam("wood", [x, y0, z], [x + rng.range(-.1, .1), y0 + h, z], .1, .1);
  const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG);
  for (let k = 0; k < 4; k++) {
    const u0 = .1 + k * .28, len = rng.range(.8, 2.2), top = y0 + h - .15, w = .24, sway = rng.range(-.2, .2);
    const P1: P = [x + u0 * c, top, z - u0 * s], P2: P = [x + (u0 + w) * c, top, z - (u0 + w) * s], P3: P = [x + (u0 + w) * c + sway * s, top - len, z - (u0 + w) * s + sway * c], P4: P = [x + u0 * c + sway * s, top - len * rng.range(.7, 1), z - u0 * s + sway * c];
    b.plate(key, P1, P2, P3, P4, .004);
  }
}

/** 木箱或木桶（歪倒、半塌）：count 个随机堆放。 */
export function crates(b: RuinBuilder, rng: Rng, x: number, z: number, y: number, count: number, spread = 1.2, key = "wood") {
  for (let k = 0; k < count; k++) {
    const px = x + rng.range(-spread, spread), pz = z + rng.range(-spread, spread), s = rng.range(.35, .7);
    if (rng.chance(.35)) pillar(b, key, px, pz, y, y + s * 1.2, s * .45, { sides: 8, ...(rng.chance(.4) ? { lean: [rng.range(-.4, .4), rng.range(-.4, .4)] as [number, number] } : {}) });
    else b.tbox(key, [px, y + s / 2, pz], [s, s * rng.range(.7, 1.2), s], rng.range(0, 360), rng.range(-8, 8), rng.range(-8, 8));
  }
}

/** 残破石台阶：每级一块条石，某些级缺角或掉落。dir 为台阶上行方向的偏航角（度，同 boxYaw）。 */
export function stairs(b: RuinBuilder, rng: Rng, key: string, x: number, z: number, yaw: number, w: number, steps: number, rise = .18, run = .34, y0 = 0) {
  const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG);
  // 每级是从地面砌起的整块条石（高度随级数增加），朝局部 -z 方向上行；个别级缺失
  for (let k = 0; k < steps; k++) {
    if (rng.chance(.12) && k > 0) continue;
    const n = -k * run, ww = w * rng.range(.85, 1);
    b.boxYaw(key, x + n * s, y0 + (k + 1) * rise / 2, z + n * c, ww, (k + 1) * rise, run, yaw);
  }
}

/** 断碑：碑座（龟趺或方座）、歪斜的碑身，另有一截倒在地上的碑头。 */
export function stele(b: RuinBuilder, rng: Rng, x: number, z: number, y: number, yaw: number, scale = 1) {
  b.boxYaw("stone", x, y + .25 * scale, z, 1.9 * scale, .5 * scale, 1.1 * scale, yaw);
  b.tbox("stone", [x, y + .5 * scale + 1.1 * scale, z], [1.1 * scale, 2.2 * scale, .32 * scale], yaw, rng.range(-6, 6), rng.range(-5, 5));
  const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG);
  b.tbox("stone", [x + (1.6 * c + .9 * s) * scale, y + .22 * scale, z + (-1.6 * s + .9 * c) * scale], [1.1 * scale, .45 * scale, .32 * scale], yaw + 35, 0, 9);
}

/** 井：一圈条石加井沿，井盖半塌。 */
export function well(b: RuinBuilder, rng: Rng, x: number, z: number, y: number, r = .7) {
  for (let k = 0; k < 8; k++) { if (rng.chance(.08)) continue; const a = (k + .5) / 8 * Math.PI * 2; b.tbox("stone", [x + Math.cos(a) * r, y + .25, z + Math.sin(a) * r], [r * .8, .5, .35], -a / DEG + 90, 0, 0); }
  b.beam("wood", [x - r * 1.2, y + 1.6, z], [x + r * 1.2, y + 1.55, z], .12, .12);
  b.beam("wood", [x - r * 1.1, y + .4, z], [x - r * 1.15, y + 1.6, z], .12, .12);
}

/** 带破布和蛛网的简单枯木架、晾衣竿一类：一根横杆搭在两根立柱上，挂几块布。 */
export function clothesLine(b: RuinBuilder, rng: Rng, p: [number, number], q: [number, number], y: number, key = "cloth") {
  const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz);
  for (const e of [p, q]) b.beam("wood", [e[0], y - 2, e[1]], [e[0], y + .1, e[1]], .07, .07);
  b.beam("wood", [p[0], y, p[1]], [q[0], y - .15, q[1]], .04, .04);
  const n = Math.max(2, Math.round(L / .9));
  for (let k = 0; k < n; k++) {
    if (rng.chance(.35)) continue;
    const t = (k + .5) / n, w = .45, len = rng.range(.5, 1.1), ux = dx / L, uz = dz / L, cx = p[0] + dx * t, cz = p[1] + dz * t, cy = y - .15 * t;
    b.plate(key, [cx - ux * w / 2, cy, cz - uz * w / 2], [cx + ux * w / 2, cy, cz + uz * w / 2], [cx + ux * w / 2, cy - len, cz + uz * w / 2], [cx - ux * w / 2, cy - len * rng.range(.7, 1), cz - uz * w / 2], .004);
  }
}

/** 沿 x 向挑出的走廊或阳台：楼板一块、栏杆立柱缺几根、扶手断一段；(x0..x1) 沿墙，z 为墙面位置，depth 为挑出深度。 */
export function gallery(b: RuinBuilder, rng: Rng, x0: number, x1: number, y: number, z: number, depth: number, o: { key?: string; rail?: string; step?: number } = {}) {
  b.box(o.key ?? "wallB", (x0 + x1) / 2, y - .08, z + depth / 2, x1 - x0, .16, depth);
  const rz = z + depth - .05, rail = o.rail ?? "metal";
  for (let x = x0 + .1; x <= x1; x += o.step ?? .7) if (!rng.chance(.25)) b.beam(rail, [x, y, rz], [x, y + 1.0, rz], .05, .05);
  const cut = rng.range(.3, .7);
  b.beam(rail, [x0, y + 1.0, rz], [x0 + (x1 - x0) * cut, y + 1.0, rz], .06, .06); b.beam(rail, [x0 + (x1 - x0) * (cut + .25), y + .98, rz], [x1, y + 1.0, rz], .06, .06);
}
/** 空调外机：灰盒加暗色风扇面。 */
export function acUnit(b: RuinBuilder, x: number, y: number, z: number, yaw = 0) { b.boxYaw("metal", x, y, z, .85, .55, .3, yaw); b.boxYaw("soot", x, y, z, .6, .4, .33, yaw); }
/** 一根下垂的电线或缆线。 */
export function cable(b: RuinBuilder, a: P, c: P, sag = .5) { b.sweep("soot", [a, [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 - sag, (a[2] + c[2]) / 2], c], [.012, .012, .012]); }
/** 沙袋垒：两三层交错的矮包，随机歪倒。 */
export function sandbags(b: RuinBuilder, rng: Rng, x: number, z: number, yaw: number, count = 6, key = "cloth") {
  const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG);
  for (let k = 0; k < count; k++) { const row = Math.floor(k / 3), col = k % 3, u = (col - 1 + (row % 2) * .5) * .62; b.tbox(key, [x + u * c, .16 + row * .3, z - u * s], [.55, .28, .32], yaw + rng.range(-8, 8), rng.range(-4, 4), rng.range(-6, 6)); }
}
