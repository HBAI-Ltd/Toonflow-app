import type { P, Rng, RuinBuilder } from "./ruinKit";
import { pillar } from "./ruinProps";
import { loc } from "./setDressing";

// 影视置景陈设件（二）：柜台长凳、圆桌宴席、吊灯、帷幔、二层挑台、兵器架、榻榻米、霓虹牌、机柜、教堂长椅、科幻控制台、课桌黑板、卫浴床铺。
// 约定同 setDressing：(x, z) 是占地中心，y 是所在地面高度，yaw 同 boxYaw，家具的“正面”朝局部 +z。
type B = RuinBuilder;

/** 柜台、吧台、案台：台身加略出沿的台面。 */
export function counter(b: B, x: number, y: number, z: number, yaw: number, w: number, d: number, h = 1.0, key = "woodD", top = "wood") {
  b.boxYaw(key, x, y + (h - .05) / 2, z, w, h - .05, d, yaw); b.boxYaw(top, x, y + h - .025, z, w + .06, .05, d + .06, yaw);
}
/** 长凳；back 带靠背（靠背在局部 -z 侧）。 */
export function bench(b: B, x: number, y: number, z: number, yaw: number, w = 1.6, key = "wood", back = false, d = .4, h = .46) {
  b.boxYaw(key, x, y + h - .03, z, w, .06, d, yaw);
  for (const s of [-1, 1]) { const [px, pz] = loc(x, z, yaw, s * (w / 2 - .06), 0); b.boxYaw(key, px, y + (h - .06) / 2, pz, .06, h - .06, d - .06, yaw); }
  if (back) { const [bx, bz] = loc(x, z, yaw, 0, -d / 2 + .02); b.boxYaw(key, bx, y + h + .27, bz, w, .5, .04, yaw); }
}
/** 圆桌（桌面、桌腿、底座），cloth 给桌面另一种颜色（台布）。 */
export function roundTable(b: B, x: number, y: number, z: number, r = .6, h = .76, key = "wood", cloth?: string) {
  pillar(b, key, x, z, y, y + .04, r * .45, { sides: 12 }); pillar(b, key, x, z, y, y + h - .05, .1, { sides: 8 }); pillar(b, cloth ?? key, x, z, y + h - .05, y + h, r, { sides: 16 });
}
/** 圆桌宴席：圆桌加几只圆凳，桌上几只碗碟。 */
export function banquet(b: B, x: number, y: number, z: number, seats = 4, r = .65, key = "woodD") {
  roundTable(b, x, y, z, r, .76, key);
  for (let k = 0; k < seats; k++) { const a = k / seats * Math.PI * 2 + .4; pillar(b, key, x + Math.cos(a) * (r + .38), z + Math.sin(a) * (r + .38), y, y + .46, .17, { sides: 8 }); pillar(b, "porcelain", x + Math.cos(a) * r * .6, z + Math.sin(a) * r * .6, y + .76, y + .8, .07, { sides: 10 }); }
  pillar(b, "porcelain", x, z, y + .76, y + .85, .1, { sides: 10 });
}
/** 方桌加四面长凳，桌上摆几件碗碟（客栈、茶馆、酒楼）。 */
export function squareSet(b: B, x: number, y: number, z: number, yaw = 0, key = "wood") {
  const w = .95;
  b.boxYaw(key, x, y + .75, z, w, .06, w, yaw);
  for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) { const [px, pz] = loc(x, z, yaw, lx * (w / 2 - .06), lz * (w / 2 - .06)); b.boxYaw(key, px, y + .36, pz, .06, .72, .06, yaw); }
  for (const v of [-1, 1]) { const [px, pz] = loc(x, z, yaw, 0, v * .72); b.boxYaw(key, px, y + .43, pz, 1.2, .06, .3, yaw); for (const s of [-1, 1]) { const [lx2, lz2] = loc(x, z, yaw, s * .5, v * .72); b.boxYaw(key, lx2, y + .2, lz2, .05, .4, .05, yaw); } }
  const [tx, tz] = loc(x, z, yaw, .15, .1); pillar(b, "porcelain", tx, tz, y + .78, y + .94, .06, { sides: 8 }); for (const s of [-1, 1]) { const [bx, bz] = loc(x, z, yaw, s * .25, -.15); pillar(b, "porcelain", bx, bz, y + .78, y + .83, .05, { sides: 8 }); }
}
/** 吊灯：一圈灯珠加中心灯、从顶上垂下。y 是灯圈高度。 */
export function chandelier(b: B, x: number, y: number, z: number, r = .5, n = 8, drop = .8, key = "lamp") {
  b.beam("metal", [x, y + drop, z], [x, y + .1, z], .02, .02);
  for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; b.sphere(key, [px, y, pz], .06); b.beam("metal", [x, y + .1, z], [px, y, pz], .015, .015); }
  b.sphere(key, [x, y - .05, z], .1);
}
/** 沿 (x0,z0)→(x1,z1) 垂到地面的一幅帷幔，几道褶（舞台幕布、窗帘、纱幔）。 */
export function drape(b: B, x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, key = "curtain", folds = 6, bulge = .12) {
  const nx = -(z1 - z0), nz = x1 - x0, l = Math.hypot(nx, nz) || 1;
  const p = (t: number, yy: number, o: number): P => [x0 + (x1 - x0) * t + nx / l * o, yy, z0 + (z1 - z0) * t + nz / l * o];
  for (let k = 0; k < folds; k++) { const t0 = k / folds, t1 = (k + 1) / folds, off = (k % 2 ? 1 : -1) * bulge; b.plate(key, p(t0, y1, off), p(t1, y1, -off), p(t1, y0, -off * 1.3), p(t0, y0, off * 1.3), .01); }
}
/** 二层挑台：楼板、立柱到地、指定边的栏杆。(x0,z0)-(x1,z1) 是楼板范围，yTop 是楼板面高度，yFloor 是下面地面高度。 */
export function mezzanine(b: B, x0: number, z0: number, x1: number, z1: number, yFloor: number, yTop: number, rails: ("x0" | "x1" | "z0" | "z1")[], key = "woodD", rail = "wood") {
  b.box(key, (x0 + x1) / 2, yTop - .1, (z0 + z1) / 2, x1 - x0, .2, z1 - z0);
  const posts = new Set<string>(), line = (s: string): [number, number, number, number] => s === "x0" ? [x0, z0, x0, z1] : s === "x1" ? [x1, z0, x1, z1] : s === "z0" ? [x0, z0, x1, z0] : [x0, z1, x1, z1];
  for (const s of rails) {
    const [ax, az, bx, bz] = line(s), n = Math.max(2, Math.round(Math.hypot(bx - ax, bz - az) / .22));
    for (let k = 0; k <= n; k++) { const t = k / n; b.beam(rail, [ax + (bx - ax) * t, yTop, az + (bz - az) * t], [ax + (bx - ax) * t, yTop + .95, az + (bz - az) * t], .03, .03); }
    b.beam(rail, [ax, yTop + .95, az], [bx, yTop + .95, bz], .07, .07);
    for (const [px, pz] of [[ax, az], [bx, bz]] as [number, number][]) { const id = `${px},${pz}`; if (!posts.has(id)) { posts.add(id); pillar(b, key, px, pz, yFloor, yTop - .2, .1, { sides: 8 }); } }
  }
}
/** 兵器架：两立柱、两道横档、斜插的长枪和刀剑。 */
export function weaponRack(b: B, rng: Rng, x: number, y: number, z: number, yaw: number, w = 2.2) {
  const at = (u: number, v: number, yy: number): P => { const [px, pz] = loc(x, z, yaw, u, v); return [px, yy, pz]; };
  for (const s of [-1, 1]) b.beam("woodD", at(s * w / 2, 0, y), at(s * w / 2, 0, y + 1.5), .08, .08);
  for (const yy of [.45, 1.2]) b.beam("woodD", at(-w / 2, 0, y + yy), at(w / 2, 0, y + yy), .06, .06);
  for (let k = 0; k < 7; k++) {
    const u = -w / 2 + .2 + k * (w - .4) / 6, long = k % 3 === 0;
    b.beam(long ? "wood" : "metal", at(u, .05, y + .05), at(u + rng.range(-.03, .03), .06, y + (long ? 1.9 : 1.4)), long ? .04 : .05, long ? .04 : .02);
    if (long) b.beam("metal", at(u, .06, y + 1.9), at(u, .06, y + 2.1), .05, .02);
  }
}
/** 一块榻榻米：草席面加深色包边。 */
export function tatami(b: B, x: number, y: number, z: number, yaw: number, w = 1.8, d = .9) {
  b.boxYaw("tatamiB", x, y + .03, z, w, .06, d, yaw); b.boxYaw("tatami", x, y + .065, z, w - .06, .012, d - .04, yaw);
}
/** 霓虹牌：黑底加四边发光条，lines 条中间的发光笔画。 */
export function neon(b: B, x: number, y: number, z: number, yaw: number, w: number, h: number, key = "neonP", lines = 2) {
  b.boxYaw("dark", x, y, z, w + .1, h + .1, .04, yaw);
  const [ax, az] = loc(x, z, yaw, 0, .03);
  b.boxYaw(key, ax, y + h / 2 - .05, az, w - .1, .05, .03, yaw); b.boxYaw(key, ax, y - h / 2 + .05, az, w - .1, .05, .03, yaw);
  for (const s of [-1, 1]) { const [px, pz] = loc(x, z, yaw, s * (w / 2 - .05), .03); b.boxYaw(key, px, y, pz, .05, h - .1, .03, yaw); }
  for (let k = 0; k < lines; k++) b.boxYaw(key, ax, y + (k - (lines - 1) / 2) * (h - .3) / Math.max(1, lines), az, w * .6, .06, .03, yaw);
}
/** 机柜：黑色柜体，每层一条指示灯带。 */
export function serverRack(b: B, rng: Rng, x: number, y: number, z: number, yaw: number) {
  b.boxYaw("dark", x, y + 1.0, z, .6, 2.0, .9, yaw);
  const [fx, fz] = loc(x, z, yaw, 0, .46);
  for (let k = 0; k < 10; k++) { b.boxYaw("steel", fx, y + .2 + k * .18, fz, .52, .14, .02, yaw); b.boxYaw(rng.chance(.85) ? "glowG" : "lampRed", fx, y + .2 + k * .18, fz + (fz > z ? .012 : -.012), .3, .02, .01, yaw); }
}
/** 教堂长椅或礼堂排椅：座面、靠背（在局部 -z 侧）、两端侧板。 */
export function pew(b: B, x: number, y: number, z: number, yaw: number, w = 2.4, key = "wood") {
  b.boxYaw(key, x, y + .43, z, w, .06, .45, yaw);
  const [bx, bz] = loc(x, z, yaw, 0, -.2); b.boxYaw(key, bx, y + .8, bz, w, .7, .05, yaw);
  for (const s of [-1, 1]) { const [px, pz] = loc(x, z, yaw, s * (w / 2 - .04), -.05); b.boxYaw(key, px, y + .45, pz, .08, .9, .55, yaw); }
}
/** 科幻控制台：黑色台体、台面上立三块发光屏、一排按钮。 */
export function sciConsole(b: B, rng: Rng, x: number, y: number, z: number, yaw: number, w = 2.4, d = .9) {
  b.boxYaw("dark", x, y + .45, z, w, .9, d, yaw); b.boxYaw("steel", x, y + .92, z, w + .04, .04, d + .04, yaw);
  const [bx, bz] = loc(x, z, yaw, 0, -d / 2 + .1);
  for (const s of [-1, 0, 1]) { const [px, pz] = loc(x, z, yaw, s * w * .31, -d / 2 + .1); b.boxYaw("dark", px, y + 1.3, pz, w * .28, .5, .04, yaw); const [sx, sz] = loc(x, z, yaw, s * w * .31, -d / 2 + .13); b.boxYaw(rng.chance(.7) ? "screen" : "glowB", sx, y + 1.3, sz, w * .25, .42, .012, yaw); }
  for (let k = 0; k < 8; k++) { const [px, pz] = loc(x, z, yaw, -w / 2 + .25 + k * (w - .5) / 7, .12); b.boxYaw(rng.pick(["glowB", "glowG", "lampRed", "neonY"]), px, y + .95, pz, .1, .02, .07, yaw); }
  void bx; void bz;
}
/** 双人课桌加长凳。 */
export function schoolDesk(b: B, x: number, y: number, z: number, yaw: number, key = "wood") {
  b.boxYaw(key, x, y + .72, z, 1.2, .04, .5, yaw);
  for (const s of [-1, 1]) for (const v of [-.2, .2]) { const [px, pz] = loc(x, z, yaw, s * .55, v); b.boxYaw(key, px, y + .35, pz, .04, .7, .04, yaw); }
  const [qx, qz] = loc(x, z, yaw, 0, .5); b.boxYaw(key, qx, y + .42, qz, 1.2, .04, .25, yaw);
  for (const s of [-1, 1]) { const [px, pz] = loc(x, z, yaw, s * .55, .5); b.boxYaw(key, px, y + .2, pz, .04, .4, .04, yaw); }
}
/** 黑板：木框、板面、几行粉笔字。 */
export function blackboard(b: B, rng: Rng, x: number, y: number, z: number, yaw: number, w: number, h: number) {
  b.boxYaw("woodD", x, y, z, w + .1, h + .1, .04, yaw);
  const [ax, az] = loc(x, z, yaw, 0, .025); b.boxYaw("board", ax, y, az, w, h, .012, yaw);
  for (let k = 0; k < 6; k++) { const [px, pz] = loc(x, z, yaw, rng.range(-w / 2 + .5, w / 2 - .6), .035); b.boxYaw("porcelain", px, y + h / 2 - .2 - k * h / 8, pz, rng.range(.3, .9), .02, .005, yaw); }
}
/** 现代床：床架、床垫、被子盖住后三分之二、两只枕头、床头板。头在局部 -z 侧。 */
export function bedModern(b: B, x: number, y: number, z: number, yaw: number, w = 1.6, l = 2.0, frame = "woodD", cover = "cloth") {
  b.boxYaw(frame, x, y + .2, z, w + .08, .3, l + .08, yaw); b.boxYaw("porcelain", x, y + .42, z, w, .16, l, yaw);
  const [cx, cz] = loc(x, z, yaw, 0, l * .17); b.boxYaw(cover, cx, y + .54, cz, w + .04, .1, l * .66, yaw);
  for (const s of [-1, 1]) { const [px, pz] = loc(x, z, yaw, s * w * .24, -l / 2 + .25); b.boxYaw("porcelain", px, y + .56, pz, w * .4, .12, .32, yaw); }
  const [hx, hz] = loc(x, z, yaw, 0, -l / 2 - .03); b.boxYaw(frame, hx, y + .65, hz, w + .12, 1.0, .08, yaw);
}
export function toilet(b: B, x: number, y: number, z: number, yaw: number) { b.boxYaw("porcelain", x, y + .2, z, .38, .4, .55, yaw); const [tx, tz] = loc(x, z, yaw, 0, -.3); b.boxYaw("porcelain", tx, y + .5, tz, .4, .5, .18, yaw); }
export function basin(b: B, x: number, y: number, z: number, yaw: number) {
  b.boxYaw("porcelain", x, y + .82, z, .55, .12, .42, yaw); pillar(b, "porcelain", x, z, y, y + .8, .09, { sides: 8 });
  const [tx, tz] = loc(x, z, yaw, 0, -.15); b.beam("steel", [tx, y + .88, tz], [tx, y + 1.08, tz], .025, .025);
}
export function bathtub(b: B, x: number, y: number, z: number, yaw: number, l = 1.7, w = .8) {
  b.boxYaw("porcelain", x, y + .28, z, l, .56, w, yaw); b.boxYaw("water", x, y + .545, z, l - .16, .02, w - .16, yaw);
  const [tx, tz] = loc(x, z, yaw, -l / 2 + .12, 0); b.beam("steel", [tx, y + .56, tz], [tx, y + .8, tz], .03, .03);
}
/** 一排酒瓶（吧台、货架、酒架）。 */
export function bottles(b: B, rng: Rng, x: number, y: number, z: number, yaw: number, w: number, keys = ["glass", "liquid", "red", "porcelain"]) {
  for (let k = 0; k < Math.floor(w / .14); k++) { const [px, pz] = loc(x, z, yaw, -w / 2 + .1 + k * .14, 0); pillar(b, rng.pick(keys), px, pz, y, y + rng.range(.2, .32), .04, { sides: 8 }); }
}
