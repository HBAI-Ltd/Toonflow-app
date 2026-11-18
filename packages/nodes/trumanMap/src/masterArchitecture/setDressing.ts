import { DEG } from "./partMath";
import type { P, Rng, RuinBuilder } from "./ruinKit";
import { pillar } from "./ruinProps";

// 影视置景的陈设件：桌椅床柜沙发书架、灯具（发光件）、挂画卷轴屏风、牢栏锁链、医疗和实验室器具、楼梯。
// 坐标：(x, z) 为占地中心，y 为所在地面高度；yaw 同 boxYaw——局部 z 轴朝向 (sin yaw, cos yaw)，家具的“正面”朝局部 +z。
type B = RuinBuilder;
/** 局部 (u 沿 x, v 沿 z) 点转到世界 xz。 */
export const loc = (x: number, z: number, yaw: number, u: number, v: number): [number, number] => { const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG); return [x + u * c + v * s, z - u * s + v * c]; };
const corners4 = (x: number, z: number, yaw: number, hw: number, hd: number, y: number): [P, P, P, P] => ([[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]] as [number, number][]).map(([u, v]) => { const [px, pz] = loc(x, z, yaw, u, v); return [px, y, pz] as P; }) as [P, P, P, P];

// ---------- 桌椅床柜（破败房间也在用，允许翻倒） ----------
export const table = (b: B, rng: Rng, x: number, y: number, z: number, yaw: number, w = 1.2, d = .7, h = .75, key = "wood", fallen = false) => {
  if (fallen) { b.tbox(key, [x, y + h * .45, z], [w, .06, d], yaw, rng.range(65, 85), rng.range(-8, 8)); for (let k = 0; k < 2; k++) b.tbox(key, [x + rng.range(-.5, .5), y + .05, z + rng.range(-.5, .5)], [.06, h * .9, .06], yaw, 90, rng.range(0, 90)); return; }
  b.boxYaw(key, x, y + h, z, w, .06, d, yaw);
  const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG);
  for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) if (!rng.chance(.12)) { const u = lx * (w / 2 - .06), v = lz * (d / 2 - .06); b.boxYaw(key, x + u * c + v * s, y + h / 2, z - u * s + v * c, .06, h, .06, yaw); }
};
export const chair = (b: B, rng: Rng, x: number, y: number, z: number, yaw: number, key = "wood", fallen = rng.chance(.5)) => {
  if (fallen) { b.tbox(key, [x, y + .22, z], [.42, .06, .42], yaw, rng.range(70, 90), rng.range(-20, 20)); b.tbox(key, [x + .2, y + .08, z + .1], [.42, .4, .05], yaw + 40, 80, 0); return; }
  b.boxYaw(key, x, y + .45, z, .42, .05, .42, yaw); b.boxYaw(key, x, y + .72, z - .19, .42, .5, .04, yaw);
  const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG);
  for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) if (!rng.chance(.15)) { const u = lx * .18, v = lz * .18; b.boxYaw(key, x + u * c + v * s, y + .22, z - u * s + v * c, .04, .45, .04, yaw); }
};
export const bed = (b: B, rng: Rng, x: number, y: number, z: number, yaw: number, w = 1.3, l = 2.0, frame = "wood", sag = true) => {
  b.boxYaw(frame, x, y + .3, z, w, .08, l, yaw); b.boxYaw(frame, x, y + .65, z - l / 2 + .03, w, .8, .06, yaw);
  const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG);
  for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) { const u = lx * (w / 2 - .05), v = lz * (l / 2 - .05); b.boxYaw(frame, x + u * c + v * s, y + .15, z - u * s + v * c, .07, .3, .07, yaw); }
  b.tbox("cloth", [x, y + .42, z + .1], [w - .1, .16, l - .5], yaw, sag ? rng.range(-3, 3) : 0, rng.range(-4, 4));
};
export const cabinet = (b: B, rng: Rng, x: number, y: number, z: number, yaw: number, w = .9, h = 1.8, d = .5, key = "wood", lean = 0) => {
  b.tbox(key, [x, y + h / 2, z], [w, h, d], yaw, 0, lean);
  const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG);
  b.tbox("woodD", [x + (d / 2 + .02) * s, y + h / 2, z + (d / 2 + .02) * c], [w * .46, h * .85, .03], yaw + rng.range(-70, -20), 0, lean);
};
export const pots = (b: B, rng: Rng, x: number, y: number, z: number, n: number, key = "rust") => { for (let k = 0; k < n; k++) pillar(b, rng.pick([key, "metal", "rubbleS"]), x + rng.range(-.5, .5), z + rng.range(-.5, .5), y, y + rng.range(.12, .35), rng.range(.1, .2), rng.chance(.3) ? { lean: [.2, 0] } : {}); };
export const papers = (b: B, rng: Rng, cx: number, cz: number, y: number, rx: number, rz: number, n: number) => { for (let k = 0; k < n; k++) { const x = cx + rng.range(-rx, rx), z = cz + rng.range(-rz, rz), a = rng.range(0, Math.PI), w = .3, d = .21; b.plate("paper", [x, y + .01 + k * .001, z], [x + Math.cos(a) * w, y + .015, z + Math.sin(a) * w], [x + Math.cos(a) * w - Math.sin(a) * d, y + .015, z + Math.sin(a) * w + Math.cos(a) * d], [x - Math.sin(a) * d, y + .01, z + Math.cos(a) * d], .002); } };

// ---------- 完好的家具 ----------
/** 不带随机的方桌或案几：桌面、四条腿、牙板。 */
export function plainTable(b: B, x: number, y: number, z: number, yaw: number, w = 1.2, d = .7, h = .76, key = "wood") {
  b.boxYaw(key, x, y + h - .03, z, w, .06, d, yaw);
  for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) { const [px, pz] = loc(x, z, yaw, lx * (w / 2 - .05), lz * (d / 2 - .05)); b.boxYaw(key, px, y + (h - .06) / 2, pz, .06, h - .06, .06, yaw); }
  b.boxYaw(key, x, y + h - .12, z, w - .1, .1, d - .1, yaw);
}
/** 完好的椅子（含靠背），armrest 带扶手（太师椅）。 */
export function seat(b: B, x: number, y: number, z: number, yaw: number, key = "wood", armrest = false, w = .46) {
  b.boxYaw(key, x, y + .45, z, w, .05, w, yaw);
  const [bx, bz] = loc(x, z, yaw, 0, -w / 2 + .02); b.boxYaw(key, bx, y + .78, bz, w, .6, .04, yaw);
  for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) { const [px, pz] = loc(x, z, yaw, lx * (w / 2 - .03), lz * (w / 2 - .03)); b.boxYaw(key, px, y + .22, pz, .04, .44, .04, yaw); }
  if (armrest) for (const side of [-1, 1]) { const [ax, az] = loc(x, z, yaw, side * (w / 2 - .02), -.04); b.boxYaw(key, ax, y + .68, az, .04, .04, w * .85, yaw); const [px, pz] = loc(x, z, yaw, side * (w / 2 - .02), w * .3); b.boxYaw(key, px, y + .56, pz, .04, .22, .04, yaw); }
}
export const stool = (b: B, x: number, y: number, z: number, key = "wood", r = .2, h = .46) => pillar(b, key, x, z, y, y + h, r, { sides: 8 });
export function sofa(b: B, x: number, y: number, z: number, yaw: number, w = 2, key = "leather", depth = .85) {
  const at = (u: number, v: number) => loc(x, z, yaw, u, v), [sx, sz] = at(0, 0), [bx, bz] = at(0, -depth / 2 + .09), [lx, lz] = at(-(w / 2 - .09), 0), [rx, rz] = at(w / 2 - .09, 0);
  b.boxYaw(key, sx, y + .22, sz, w, .44, depth, yaw); b.boxYaw(key, bx, y + .68, bz, w, .5, .18, yaw);
  b.boxYaw(key, lx, y + .5, lz, .18, .3, depth, yaw); b.boxYaw(key, rx, y + .5, rz, .18, .3, depth, yaw);
}
export function desk(b: B, x: number, y: number, z: number, yaw: number, w = 1.4, d = .7, h = .76, key = "wood") {
  const [px, pz] = loc(x, z, yaw, -w / 2 + .2, 0), [qx, qz] = loc(x, z, yaw, w / 2 - .03, 0), [dx, dz] = loc(x, z, yaw, -w / 2 + .2, d / 2 - .02);
  b.boxYaw(key, x, y + h - .025, z, w, .05, d, yaw); b.boxYaw(key, px, y + (h - .05) / 2, pz, .4, h - .05, d - .06, yaw); b.boxYaw(key, qx, y + (h - .05) / 2, qz, .05, h - .05, d - .06, yaw);
  for (let k = 0; k < 3; k++) b.boxYaw("woodD", dx, y + .12 + k * .2, dz, .34, .015, .02, yaw);
}
/** 书架或博古架：两侧板、背板、隔板，rows 层，可摆成排的书脊（book1–3 组）。 */
export function shelf(b: B, rng: Rng, x: number, y: number, z: number, yaw: number, w = 1.0, h = 2.0, d = .3, rows = 4, key = "wood", books = true) {
  const at = (u: number, v: number) => loc(x, z, yaw, u, v), [lx, lz] = at(-w / 2 + .015, 0), [rx, rz] = at(w / 2 - .015, 0), [cx, cz] = at(0, -d / 2 + .01);
  b.boxYaw(key, lx, y + h / 2, lz, .03, h, d, yaw); b.boxYaw(key, rx, y + h / 2, rz, .03, h, d, yaw); b.boxYaw("woodD", cx, y + h / 2, cz, w, h, .02, yaw);
  const rowH = (h - .06) / rows;
  for (let k = 0; k <= rows; k++) b.boxYaw(key, x, y + .03 + k * rowH, z, w, .03, d, yaw);
  if (!books) return;
  for (let k = 0; k < rows; k++) {
    let u = -w / 2 + .06;
    while (u < w / 2 - .14) {
      const bw = rng.range(.05, .2), bh = Math.min(rowH - .06, rng.range(.18, .3)), [px, pz] = at(u + bw / 2, 0);
      if (rng.chance(.82)) b.boxYaw(rng.pick(["book1", "book2", "book3"]), px, y + .045 + k * rowH + bh / 2, pz, bw, bh, d * .8, yaw);
      u += bw + rng.range(0, .05);
    }
  }
}
export function rug(b: B, x: number, y: number, z: number, yaw: number, w: number, d: number, key = "rug", border = "rugB") {
  b.quad(border, ...corners4(x, z, yaw, w / 2, d / 2, y + .006), [0, 1, 0]); b.quad(key, ...corners4(x, z, yaw, w / 2 - .12, d / 2 - .12, y + .009), [0, 1, 0]);
}
/** 架子床（拔步床简化）：床板被褥、四根立柱、顶框、床头围板、两侧挂帐。 */
export function canopyBed(b: B, x: number, y: number, z: number, yaw: number, w = 1.6, l = 2.1, key = "wood", drape = "curtain") {
  const at = (u: number, v: number) => loc(x, z, yaw, u, v), top = y + 2.1;
  b.boxYaw(key, x, y + .3, z, w, .12, l, yaw); b.boxYaw("cloth", x, y + .42, z, w - .1, .14, l - .2, yaw);
  for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) { const [px, pz] = at(u * (w / 2 - .04), v * (l / 2 - .04)); b.beam(key, [px, y, pz], [px, top, pz], .07, .07); }
  for (const v of [-1, 1]) { const [ax, az] = at(-w / 2 + .04, v * (l / 2 - .04)), [bx, bz] = at(w / 2 - .04, v * (l / 2 - .04)); b.beam(key, [ax, top, az], [bx, top, bz], .06, .08); }
  for (const u of [-1, 1]) { const [ax, az] = at(u * (w / 2 - .04), -l / 2 + .04), [bx, bz] = at(u * (w / 2 - .04), l / 2 - .04); b.beam(key, [ax, top, az], [bx, top, bz], .06, .08); }
  const [hx, hz] = at(0, -l / 2 + .05); b.boxYaw(key, hx, y + 1.1, hz, w, 1.6, .05, yaw);
  for (const u of [-1, 1]) { const [qx, qz] = at(u * (w / 2 - .02), l * .12); b.boxYaw(drape, qx, y + 1.25, qz, .02, 1.7, l * .62, yaw); }
}
export function screen(b: B, x: number, y: number, z: number, yaw: number, w = 2.4, h = 1.8, panels = 3, key = "wood", face = "paper") {
  const pw = w / panels;
  for (let k = 0; k < panels; k++) {
    const u = (k - (panels - 1) / 2) * pw * .92, turn = k % 2 ? 22 : -22, [px, pz] = loc(x, z, yaw, u, k % 2 ? .1 : -.1), [fx, fz] = loc(px, pz, yaw + turn, 0, .025);
    b.boxYaw(key, px, y + h / 2, pz, pw - .02, h, .04, yaw + turn); b.boxYaw(face, fx, y + h / 2, fz, pw - .12, h - .14, .012, yaw + turn);
  }
}
export function framed(b: B, x: number, y: number, z: number, yaw: number, w: number, h: number, art = "paper", frame = "woodD") {
  const [ax, az] = loc(x, z, yaw, 0, .025); b.boxYaw(frame, x, y, z, w, h, .045, yaw); b.boxYaw(art, ax, y, az, w - .1, h - .1, .012, yaw);
}
export function scroll(b: B, x: number, y: number, z: number, yaw: number, w = .5, h = 1.4) {
  const [ax, az] = loc(x, z, yaw, 0, .01); b.boxYaw("paper", ax, y, az, w, h, .01, yaw); b.boxYaw("woodD", ax, y + h / 2 + .02, az, w + .1, .04, .04, yaw); b.boxYaw("woodD", ax, y - h / 2 - .02, az, w + .08, .05, .05, yaw);
}
export function mirror(b: B, x: number, y: number, z: number, yaw: number, w: number, h: number, frame = "woodD") {
  const [ax, az] = loc(x, z, yaw, 0, .022); b.boxYaw(frame, x, y, z, w + .08, h + .08, .04, yaw); b.boxYaw("mirror", ax, y, az, w, h, .01, yaw);
}
/** 一排挂着的衣袍：横杆加几片垂下的布。 */
export function robes(b: B, rng: Rng, x: number, y: number, z: number, yaw: number, w = 2, h = 1.4, keys = ["curtain", "red", "cloth"]) {
  const [ax, az] = loc(x, z, yaw, -w / 2, 0), [bx, bz] = loc(x, z, yaw, w / 2, 0);
  b.beam("woodD", [ax, y + 1.7, az], [bx, y + 1.7, bz], .04, .04);
  for (const side of [ax, bx]) b.beam("woodD", [side, y, side === ax ? az : bz], [side, y + 1.7, side === ax ? az : bz], .04, .04);
  const n = Math.max(2, Math.round(w / .32));
  for (let k = 0; k < n; k++) { const u = -w / 2 + (k + .5) * w / n, [p0x, p0z] = loc(x, z, yaw, u - .14, 0), [p1x, p1z] = loc(x, z, yaw, u + .14, rng.range(-.04, .04)), drop = h * rng.range(.8, 1); b.plate(rng.pick(keys), [p0x, y + 1.66, p0z], [p1x, y + 1.66, p1z], [p1x, y + 1.66 - drop, p1z], [p0x, y + 1.66 - drop * rng.range(.9, 1), p0z], .006); }
}

// ---------- 灯具（用发光材质表现灯亮着） ----------
export function bulb(b: B, x: number, y: number, z: number, drop = 1) { b.beam("woodD", [x, y + drop, z], [x, y + .08, z], .015, .015); b.sphere("lamp", [x, y, z], .09); }
export function lantern(b: B, x: number, y: number, z: number, r = .22, cord = .35, key = "lamp") {
  b.sphere(key, [x, y, z], r); b.beam("woodD", [x, y + r, z], [x, y + r + cord, z], .015, .015); b.box("woodD", x, y + r * .95, z, r * .8, .04, r * .8); b.box("woodD", x, y - r * .95, z, r * .55, .04, r * .55);
}
export function tubeLight(b: B, x: number, y: number, z: number, len: number, yaw: number, key = "lamp") { b.boxYaw(key, x, y, z, len, .05, .09, yaw); b.boxYaw("metal", x, y + .045, z, len + .04, .03, .14, yaw); }
export function standLamp(b: B, x: number, y: number, z: number) { pillar(b, "metal", x, z, y, y + .04, .16, { sides: 10 }); b.beam("metal", [x, y, z], [x, y + 1.5, z], .03, .03); b.sphere("lamp", [x, y + 1.58, z], .17); }
export function tableLamp(b: B, x: number, y: number, z: number, key = "metal") { pillar(b, key, x, z, y, y + .03, .08, { sides: 8 }); b.beam(key, [x, y, z], [x, y + .26, z], .02, .02); b.sphere("lamp", [x, y + .32, z], .1); }
export function candle(b: B, x: number, y: number, z: number, h = .16) { pillar(b, "porcelain", x, z, y, y + h, .022, { sides: 6, cap: false }); b.sphere("lamp", [x, y + h + .025, z], .022); }

// ---------- 牢房、公堂 ----------
/** 铁栏或木栏：沿 (x0,z0)→(x1,z1) 立一排竖条，上中下三道横档。 */
export function bars(b: B, x0: number, z0: number, x1: number, z1: number, y: number, h = 2.4, step = .13, key = "metal") {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / step));
  for (let k = 0; k <= n; k++) { const t = k / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; b.beam(key, [x, y, z], [x, y + h, z], .035, .035); }
  for (const yy of [.1, h / 2, h - .08]) b.beam(key, [x0, y + yy, z0], [x1, y + yy, z1], .05, .06);
}
export function chain(b: B, a: P, c: P, sag = .35, key = "metal") { b.sweep(key, [a, [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 - sag, (a[2] + c[2]) / 2], c], [.018, .018, .018]); }
export function coffin(b: B, x: number, y: number, z: number, yaw: number, l = 2, w = .66, h = .62) {
  for (const v of [-.6, .6]) { const [px, pz] = loc(x, z, yaw, 0, v); b.boxYaw("wood", px, y + .22, pz, w + .3, .44, .12, yaw); }
  b.boxYaw("woodD", x, y + .44 + h / 2, z, w, h, l, yaw); b.boxYaw("woodD", x, y + .44 + h + .04, z, w + .06, .08, l + .06, yaw);
  const [hx, hz] = loc(x, z, yaw, 0, -l / 2 + .15); b.boxYaw("woodD", hx, y + .44 + h / 2 + .03, hz, w + .1, h + .06, .3, yaw);
}
export function drum(b: B, x: number, y: number, z: number, r = .45, h = .7, key = "red") { for (const s of [-1, 1]) b.beam("woodD", [x + s * (r + .1), y, z], [x + s * (r + .05), y + h, z], .06, .06); pillar(b, key, x, z, y + .2, y + .2 + h * .8, r, { sides: 14 }); b.box("woodD", x, y + .1, z, r * 2 + .3, .2, .5); }
export function barrel(b: B, x: number, y: number, z: number, r = .3, h = .9, key = "metal") { pillar(b, key, x, z, y, y + h, r, { sides: 10 }); for (const f of [.2, .75]) pillar(b, "woodD", x, z, y + h * f, y + h * f + .03, r + .012, { sides: 10, cap: false }); }

// ---------- 现代、医疗、实验室 ----------
export function monitor(b: B, x: number, y: number, z: number, yaw: number, lit = false, w = .45, h = .32) {
  const [fx, fz] = loc(x, z, yaw, 0, .027); b.boxYaw("metal", x, y + .03, z, .12, .06, .12, yaw); b.boxYaw("metal", x, y + .06 + h / 2, z, w, h, .05, yaw); b.boxYaw(lit ? "screen" : "dark", fx, y + .06 + h / 2, fz, w - .05, h - .05, .01, yaw);
}
export function fileCabinet(b: B, x: number, y: number, z: number, yaw: number, drawers = 4, key = "metal") {
  const h = .28 * drawers + .06; b.boxYaw(key, x, y + h / 2, z, .47, h, .62, yaw);
  for (let k = 0; k < drawers; k++) { const [fx, fz] = loc(x, z, yaw, 0, .312); b.boxYaw("dark", fx, y + .2 + k * .28, fz, .4, .015, .01, yaw); b.boxYaw("steel", fx, y + .13 + k * .28, fz, .12, .02, .02, yaw); }
}
/** 一面抽屉柜（太平间冷柜、百子药柜）：cols×rows 个抽屉面，每个带把手。 */
export function drawerGrid(b: B, x: number, y: number, z: number, yaw: number, cols: number, rows: number, cw: number, ch: number, depth = .5, key = "steel", handle = "metal") {
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const u = (i - (cols - 1) / 2) * (cw + .02), [px, pz] = loc(x, z, yaw, u, 0), [hx, hz] = loc(x, z, yaw, u, depth / 2 + .012);
    b.boxYaw(key, px, y + ch / 2 + j * (ch + .02), pz, cw, ch, depth, yaw); b.boxYaw(handle, hx, y + ch * .55 + j * (ch + .02), hz, cw * .35, .025, .025, yaw);
  }
}
export function surgicalLight(b: B, x: number, y: number, z: number) {
  pillar(b, "steel", x, z, y, y + .05, .25, { sides: 10 }); b.beam("steel", [x, y, z], [x, y + 2.3, z], .05, .05); b.beam("steel", [x, y + 2.3, z], [x + .7, y + 2.05, z], .045, .045);
  pillar(b, "steel", x + .7, z, y + 2.0, y + 2.06, .4, { sides: 14 }); pillar(b, "lamp", x + .7, z, y + 1.96, y + 2.0, .34, { sides: 14 });
}
export function surgeryTable(b: B, x: number, y: number, z: number, yaw: number) {
  pillar(b, "steel", x, z, y, y + .8, .12, { sides: 8 }); b.boxYaw("steel", x, y + .85, z, .6, .08, 1.9, yaw); b.boxYaw("steel", x, y + .1, z, .7, .1, .7, yaw);
}
export function ivStand(b: B, x: number, y: number, z: number) {
  b.beam("steel", [x, y, z], [x, y + 1.9, z], .025, .025);
  for (const a of [0, 120, 240]) b.beam("steel", [x, y + .05, z], [x + Math.cos(a * DEG) * .25, y + .02, z + Math.sin(a * DEG) * .25], .02, .02);
  b.beam("steel", [x, y + 1.88, z], [x + .12, y + 1.92, z], .02, .02); b.box("glass", x + .12, y + 1.72, z, .12, .22, .03);
}
export function hospitalBed(b: B, x: number, y: number, z: number, yaw: number, w = .9, l = 2) {
  b.boxYaw("steel", x, y + .45, z, w, .06, l, yaw); b.boxYaw("cloth", x, y + .54, z, w - .06, .12, l - .1, yaw);
  const [hx, hz] = loc(x, z, yaw, 0, -l / 2); b.boxYaw("steel", hx, y + .8, hz, w, .5, .05, yaw);
  for (const u of [-1, 1]) { const [rx, rz] = loc(x, z, yaw, u * (w / 2), 0); b.boxYaw("steel", rx, y + .72, rz, .03, .22, l * .6, yaw); }
  for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) { const [px, pz] = loc(x, z, yaw, u * (w / 2 - .05), v * (l / 2 - .08)); pillar(b, "steel", px, pz, y, y + .45, .03, { sides: 6 }); }
}
export function labBench(b: B, rng: Rng, x: number, y: number, z: number, yaw: number, len = 2.4, d = .75, h = .9) {
  b.boxYaw("woodD", x, y + (h - .04) / 2, z, len, h - .04, d, yaw); b.boxYaw("dark", x, y + h - .02, z, len + .04, .04, d + .04, yaw);
  for (let k = 0; k < 5; k++) { const [px, pz] = loc(x, z, yaw, rng.range(-len / 2 + .2, len / 2 - .2), rng.range(-d / 4, d / 4)), hh = rng.range(.14, .3); pillar(b, "glass", px, pz, y + h, y + h + hh, .05, { sides: 8 }); if (rng.chance(.7)) pillar(b, "liquid", px, pz, y + h, y + h + hh * .5, .045, { sides: 8 }); }
}
export function bunkBed(b: B, x: number, y: number, z: number, yaw: number, w = .9, l = 1.9, key = "metal") {
  for (const lvl of [0, 1]) { b.boxYaw(key, x, y + .35 + lvl * .95, z, w, .05, l, yaw); b.boxYaw("cloth", x, y + .43 + lvl * .95, z, w - .08, .1, l - .1, yaw); }
  for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) { const [px, pz] = loc(x, z, yaw, u * (w / 2 - .03), v * (l / 2 - .03)); b.beam(key, [px, y, pz], [px, y + 1.9, pz], .05, .05); }
  const [lx, lz] = loc(x, z, yaw, w / 2 + .03, l * .3); for (let k = 0; k < 5; k++) b.beam(key, [lx, y + .3 + k * .2, lz - .12], [lx, y + .3 + k * .2, lz + .12], .03, .03);
}
/** 一段直楼梯：沿 dirYaw 方向上行，每级是从地面砌起的实心踏步，一侧加扶手栏。 */
export function stairFlight(b: B, x0: number, y0: number, z0: number, dirYaw: number, w: number, steps: number, rise: number, run: number, key = "stone", rail?: string) {
  for (let k = 0; k < steps; k++) { const [cx, cz] = loc(x0, z0, dirYaw, (k + .5) * run, 0); b.boxYaw(key, cx, y0 + (k + 1) * rise / 2, cz, run, (k + 1) * rise, w, dirYaw); }
  if (!rail) return;
  const [ax, az] = loc(x0, z0, dirYaw, 0, w / 2 - .04), [bx, bz] = loc(x0, z0, dirYaw, steps * run, w / 2 - .04);
  b.beam(rail, [ax, y0 + rise + .9, az], [bx, y0 + steps * rise + .9, bz], .05, .05);
  for (let k = 0; k <= steps; k += 2) { const [px, pz] = loc(x0, z0, dirYaw, k * run, w / 2 - .04); b.beam(rail, [px, y0 + (k + 1) * rise, pz], [px, y0 + (k + 1) * rise + .9, pz], .03, .03); }
}
/** 箱柜：箱身、略宽的箱盖、四角包铜和锁扣。 */
export function chest(b: B, x: number, y: number, z: number, yaw: number, w = .9, h = .55, d = .5, key = "wood") {
  b.boxYaw(key, x, y + h * .42, z, w, h * .84, d, yaw); b.boxYaw(key, x, y + h * .88, z, w + .04, h * .2, d + .04, yaw);
  for (const s of [-1, 1]) { const [px, pz] = loc(x, z, yaw, s * (w / 2 - .02), d / 2 + .005); b.boxYaw("metal", px, y + h * .42, pz, .05, h * .84, .02, yaw); }
  const [lx, lz] = loc(x, z, yaw, 0, d / 2 + .012); b.boxYaw("metal", lx, y + h * .8, lz, .1, .1, .02, yaw);
}
/** 圆形或方形的器皿：低矮的盆、碗、碟。 */
export function bowl(b: B, x: number, y: number, z: number, r = .15, h = .08, key = "porcelain") { pillar(b, key, x, z, y, y + h, r, { sides: 12 }); }
