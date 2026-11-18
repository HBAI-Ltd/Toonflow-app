import type { P } from "./ruinKit";
import { CLEAR, DEG, FH, SLAB, WT, door, win, type Op, type Rect } from "./whitebox";
import { whiteAnc, type AB } from "./whiteboxAncientKit";
import { ringSlab } from "./whiteboxRegional";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·古建群落：寺庙中轴三进、宫殿前朝三大殿、衙署三进、三进四合院、江南园林、山寨、水乡古镇。
// 用一个「殿」函数（可转 0/90/180/270 度、可选硬山 / 悬山 / 歇山 / 庑殿 / 重檐，带台基、台阶、柱列、前墙门窗）、游廊、围墙和月洞门拼出院落。
// 殿的局部坐标：u 向右、v 向前（正面），转角 rot 是正面朝向：0=+z、90=+x、180=-z、270=-x。
type Hall = { cx: number; cz: number; rot: 0 | 90 | 180 | 270; bays: number; deep: number; bay?: number; ph?: number; plat?: boolean; ch?: number; y0?: number; roof?: "hard" | "gable" | "xieshan" | "hip" | "double" | "none"; pitch?: number; front?: "doors" | "open" | "wall" | "bars"; t?: number; steps?: boolean; through?: boolean };
/** 殿：through 表示前后穿通（后墙在同一开间也开门并配后台阶）；缺省时低台基（≤0.6m）、正面开门的底层殿算门屋，自动穿通，上层和高台基的主殿不穿通。 */
export function hall(b: AB, o: Hall) {
  const bay = o.bay ?? 4.5, W = o.bays * bay, D = o.deep * 3, ph = o.ph ?? .6, ch = o.ch ?? 3.6, y0 = o.y0 ?? ph, yE = y0 + ch, rot = o.rot, t = o.t ?? .4;
  const T = (u: number, v: number): [number, number] => rot === 0 ? [o.cx + u, o.cz + v] : rot === 90 ? [o.cx + v, o.cz - u] : rot === 180 ? [o.cx - u, o.cz - v] : [o.cx - v, o.cz + u];
  const ax = rot === 0 || rot === 180;
  const rect = (u0: number, v0: number, u1: number, v1: number): Rect => { const a = T(u0, v0), c = T(u1, v1); return [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[0], c[0]), Math.max(a[1], c[1])]; };
  const runU = (v: number) => { const a = T(-W / 2, v), c = T(W / 2, v); return ax ? { axis: "x" as const, fixed: a[1], from: Math.min(a[0], c[0]), to: Math.max(a[0], c[0]), at: (u: number) => T(u, v)[0] } : { axis: "z" as const, fixed: a[0], from: Math.min(a[1], c[1]), to: Math.max(a[1], c[1]), at: (u: number) => T(u, v)[1] }; };
  const runV = (u: number) => { const a = T(u, -D / 2), c = T(u, D / 2); return ax ? { axis: "z" as const, fixed: a[0], from: Math.min(a[1], c[1]), to: Math.max(a[1], c[1]), at: (v: number) => T(u, v)[1] } : { axis: "x" as const, fixed: a[1], from: Math.min(a[0], c[0]), to: Math.max(a[0], c[0]), at: (v: number) => T(u, v)[0] }; };
  const mode = o.front ?? "doors", mid = (k: number) => Math.abs(k - (o.bays - 1) / 2) < .6, dw = Math.min(3, bay - 1), through = o.through ?? (mode === "doors" && ph <= .6 && o.y0 === undefined);
  /** 往 -v 方向（后面）下台阶：edge 是台基后缘，w 是踏步宽。 */
  const backSteps = (e: [number, number], w: number) => { if (rot === 0) b.steps(e[0], e[1], "-z", w, ph); else if (rot === 90) b.steps(e[1], e[0], "-x", w, ph); else if (rot === 180) b.steps(e[0], e[1], "+z", w, ph); else b.steps(e[1], e[0], "+x", w, ph); };
  if (o.plat !== false) {
    const m = .9, r = rect(-W / 2 - m, -D / 2 - m, W / 2 + m, D / 2 + m + 1.5); b.base(r[0], r[1], r[2], r[3], ph);
    if (o.steps !== false) { const e = T(0, D / 2 + m + 1.5), w = Math.min(4.5, Math.max(2, W / 3)); if (rot === 0) b.steps(e[0], e[1], "+z", w, ph); else if (rot === 90) b.steps(e[1], e[0], "+x", w, ph); else if (rot === 180) b.steps(e[0], e[1], "-z", w, ph); else b.steps(e[1], e[0], "-x", w, ph); if (through && ph >= .3) backSteps(T(0, -D / 2 - m), dw + 1); }
  } else if (through && ph >= .3 && o.y0 === undefined && o.steps !== false) { const r2 = rect(-dw / 2 - .6, -D / 2 - 1, dw / 2 + .6, -D / 2); b.base(r2[0], r2[1], r2[2], r2[3], ph); backSteps(T(0, -D / 2 - 1), dw + 1); }
  const back = runU(-D / 2), front = runU(D / 2), cs = Array.from({ length: o.bays }, (_, k) => -W / 2 + (k + .5) * bay);
  b.wall(back.axis, back.fixed, back.from, back.to, y0, ch, t, through ? cs.flatMap((u, k) => mid(k) ? [door(back.at(u), dw, 2.7)] : []) : []);
  if (mode === "doors") b.wall(front.axis, front.fixed, front.from, front.to, y0, ch, t, cs.map((u, k) => mid(k) ? door(front.at(u), dw, 2.7) : win(front.at(u), Math.max(1, bay - 1.8), 1.8, .9)));
  else if (mode === "wall") b.wall(front.axis, front.fixed, front.from, front.to, y0, ch, t, [door(front.at(0), 1.2, 2.4)]);
  else if (mode === "bars") b.bars(front.axis, front.fixed, front.from, front.to, y0, ch - .4, [[front.at(-.6), front.at(.6)].sort((p, q) => p - q) as [number, number]]);
  for (const u of [-W / 2, W / 2]) { const s = runV(u); b.wall(s.axis, s.fixed, s.from, s.to, y0, ch, t, D > 6 ? [win(s.at(0), 1.2, 1.2, 1.4)] : []); }
  for (const v of [-D / 2, D / 2]) for (let k = 0; k <= o.bays; k++) { const p = T(-W / 2 + k * bay, v); b.cyl("struct", p[0], p[1], y0, yE, .22, 8); }
  for (const u of [-W / 2, W / 2]) for (let j = 1; j < o.deep; j++) { const p = T(u, -D / 2 + j * 3); b.cyl("struct", p[0], p[1], y0, yE, .22, 8); }
  for (const s of [runU(-D / 2), runU(D / 2), runV(-W / 2), runV(W / 2)]) b.beamH(s.axis, s.fixed, s.from, s.to, yE, .3, .45);
  const rr = rect(-W / 2, -D / 2, W / 2, D / 2), axisR = ax ? "x" : "z", sh = Math.min(1.2, (axisR === "x" ? rr[2] - rr[0] : rr[3] - rr[1]) / 4);
  const mode2 = o.roof ?? "xieshan";
  if (mode2 === "hard") b.roofGable(rr[0], rr[1], rr[2], rr[3], yE, o.pitch ?? 28, .9, .15, axisR);
  else if (mode2 === "gable") b.roofGable(rr[0], rr[1], rr[2], rr[3], yE, o.pitch ?? 28, .9, .8, axisR);
  else if (mode2 === "xieshan") b.roofXieshan(rr[0], rr[1], rr[2], rr[3], yE, o.pitch ?? 30, 1.5, sh, axisR);
  else if (mode2 === "hip") b.hip(rr[0], rr[1], rr[2], rr[3], yE, o.pitch ?? 30, 1.5, .14);
  else if (mode2 === "double") {
    b.pent([rr[0] - 2.4, rr[1] - 2.4, rr[2] + 2.4, rr[3] + 2.4], yE - .3, [rr[0], rr[1], rr[2], rr[3]], yE + 1.4);
    const ins = rect(-W / 2 + bay, -D / 2 + 3, W / 2 - bay, D / 2 - 3), yu = yE + 1.4;
    b.wall("x", ins[1], ins[0], ins[2], yu, 3, t, [win((ins[0] + ins[2]) / 2, 2.4, 1.8, 1)]); b.wall("x", ins[3], ins[0], ins[2], yu, 3, t); for (const x of [ins[0], ins[2]]) b.wall("z", x, ins[1], ins[3], yu, 3, t);
    if (axisR === "x") b.roofXieshan(ins[0], ins[1], ins[2], ins[3], yu + 3, o.pitch ?? 30, 1.8, 1.2, "x"); else b.roofXieshan(ins[0], ins[1], ins[2], ins[3], yu + 3, o.pitch ?? 30, 1.8, 1.2, "z");
  }
}

/** 游廊：沿 x 或 z 的一段带顶回廊，宽 2.8（两排柱），柱距约 3m。 */
export function gallery(b: AB, x0: number, z0: number, x1: number, z1: number, y = .3) {
  const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0), len = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0), n = Math.max(1, Math.round(len / 3)), lo = alongX ? Math.min(x0, x1) : Math.min(z0, z1), f = alongX ? (z0 + z1) / 2 : (x0 + x1) / 2;
  for (let i = 0; i <= n; i++) for (const s of [-1, 1]) { const u = lo + len * i / n; if (alongX) b.cyl("struct", u, f + s * 1.4, y, y + 3, .13, 8); else b.cyl("struct", f + s * 1.4, u, y, y + 3, .13, 8); }
  if (alongX) { b.beamH("x", f - 1.4, lo, lo + len, y + 3, .2, .3); b.beamH("x", f + 1.4, lo, lo + len, y + 3, .2, .3); b.roofGable(lo, f - 1.4, lo + len, f + 1.4, y + 3, 22, .5, .1, "x", .12, false); }
  else { b.beamH("z", f - 1.4, lo, lo + len, y + 3, .2, .3); b.beamH("z", f + 1.4, lo, lo + len, y + 3, .2, .3); b.roofGable(f - 1.4, lo, f + 1.4, lo + len, y + 3, 22, .5, .1, "z", .12, false); }
}
/** 压瓦围墙：沿 x 或 z 的一段实墙，顶上 30° 压瓦顶，ops 是洞口。 */
export function fenceRun(b: AB, x0: number, z0: number, x1: number, z1: number, h = 3, t = .5, ops: Op[] = []) {
  if (Math.abs(x1 - x0) >= Math.abs(z1 - z0)) { const z = (z0 + z1) / 2, a = Math.min(x0, x1), c = Math.max(x0, x1); b.wall("x", z, a, c, 0, h, t, ops); b.roofGable(a, z - t / 2, c, z + t / 2, h, 30, .25, 0, "x", .1, false); }
  else { const x = (x0 + x1) / 2, a = Math.min(z0, z1), c = Math.max(z0, z1); b.wall("z", x, a, c, 0, h, t, ops); b.roofGable(x - t / 2, a, x + t / 2, c, h, 30, .25, 0, "z", .1, false); }
}
/** 月洞门：宽 w 高 h 厚 t 的墙板，圆洞半径 r、圆心离地 cy；墙面沿 axis（x：法向 z；z：法向 x），中心在 (cx,cz)。 */
export function moonGate(b: AB, cx: number, cz: number, axis: "x" | "z", w: number, h: number, r: number, cy: number, t = .3) {
  const angs = Array.from({ length: 16 }, (_, i) => i * 22.5 * DEG).concat([Math.atan2(h - cy, w / 2), Math.atan2(h - cy, -w / 2), Math.atan2(-cy, -w / 2), Math.atan2(-cy, w / 2)].map(a => (a + 2 * Math.PI) % (2 * Math.PI))).sort((p, q) => p - q);
  const hit = (a: number) => { const c = Math.cos(a), s = Math.sin(a), ts: number[] = []; if (c > 1e-6) ts.push(w / 2 / c); if (c < -1e-6) ts.push(-w / 2 / c); if (s > 1e-6) ts.push((h - cy) / s); if (s < -1e-6) ts.push(-cy / s); return Math.min(...ts); };
  const W3 = (u: number, y: number, s: number): P => axis === "x" ? [cx + u, y, cz + s * t / 2] : [cx + s * t / 2, y, cz + u], nrm = (s: number): P => axis === "x" ? [0, 0, s] : [s, 0, 0], inP = (u: number, y: number): P => axis === "x" ? [u, y, 0] : [0, y, u];
  for (let i = 0; i < angs.length; i++) {
    const a0 = angs[i]!, a1 = angs[(i + 1) % angs.length]! + (i + 1 === angs.length ? 2 * Math.PI : 0), t0 = hit(a0), t1 = hit(a1 % (2 * Math.PI));
    const C = (a: number, s: number) => W3(r * Math.cos(a), cy + r * Math.sin(a), s), R = (a: number, tt: number, s: number) => W3(tt * Math.cos(a), cy + tt * Math.sin(a), s), am = (a0 + a1) / 2;
    for (const s of [1, -1]) b.quad4("wall", C(a0, s), R(a0, t0, s), R(a1, t1, s), C(a1, s), nrm(s));
    b.quad4("wall", C(a0, 1), C(a1, 1), C(a1, -1), C(a0, -1), inP(-Math.cos(am), -Math.sin(am)));
    b.quad4("wall", R(a0, t0, 1), R(a1, t1, 1), R(a1, t1, -1), R(a0, t0, -1), inP(Math.cos(am), Math.sin(am)));
  }
}
/** 木制哨楼：四根立柱（向上略收）、交叉斜撑、平台加板墙小屋和四坡顶。 */
function lookout(b: AB, x: number, z: number, H = 7) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.strut("struct", [x + sx * 1.6, 0, z + sz * 1.6], [x + sx * 1.3, H, z + sz * 1.3], .26, .26);
  for (const y of [H / 2]) for (const s of [-1, 1]) { b.beamH("x", z + s * 1.45, x - 1.45, x + 1.45, y, .18, .18); b.beamH("z", x + s * 1.45, z - 1.45, z + 1.45, y, .18, .18); }
  b.slab(x - 1.7, z - 1.7, x + 1.7, z + 1.7, H + .2, .2, undefined, "floor");
  b.wall("x", z + 1.6, x - 1.6, x + 1.6, H + .2, 2.2, .1, [win(x, 2, 1, 1)]); b.wall("x", z - 1.6, x - 1.6, x + 1.6, H + .2, 2.2, .1); for (const sx of [-1, 1]) b.wall("z", x + sx * 1.6, z - 1.6, z + 1.6, H + .2, 2.2, .1, [win(z, 2, 1, 1)]);
  b.hip(x - 1.7, z - 1.7, x + 1.7, z + 1.7, H + 2.4, 28, .7, .1);
}

const mk = (name: string, what: string, build: (b: AB) => void, tags: string[]) => whiteAnc(`白模·古建·${name}`, `白模预演古建筑群：${what}；原点在院落中心，+z 为正面（入口一侧），地面标高 0，殿宇尺度同单体（开间 4.5m、进深间 3.0m）`, "中式", build, ["古建", "建筑群", ...tags]);

export const whiteCompoundDesigns: ArchitecturePrototype[] = [
  mk("寺庙·中轴三进·山门天王殿大雄宝殿藏经楼·68m×96m", "佛寺：围墙 68m×96m 厚 0.6 高 3.6（正面 6m 宽的寺门），中轴自 +z 向 -z 依次是山门殿（三开间）、天王殿（五开间 台基 1.2）、大雄宝殿（七开间 台基 1.8、重檐、带 18m×6m 的月台）、两层藏经楼（七开间），天王殿前左右各一座 6m 见方的钟楼和鼓楼，东西各两座五开间配殿（共四座，正面朝中轴），佛教、僧侣、江湖寺院戏", b => {
    hall(b, { cx: 0, cz: 40, rot: 0, bays: 3, deep: 2, ph: .9, ch: 4.2, roof: "xieshan", through: true });
    hall(b, { cx: 0, cz: 22, rot: 0, bays: 5, deep: 3, ph: 1.2, ch: 5.1, roof: "xieshan", through: true });
    hall(b, { cx: 0, cz: -6, rot: 0, bays: 7, deep: 4, ph: 1.8, ch: 6.6, roof: "double", steps: false }); b.base(-9, 2.4, 9, 8.4, 1.8); b.steps(0, 8.4, "+z", 6, 1.8);
    hall(b, { cx: 0, cz: -34, rot: 0, bays: 7, deep: 3, ph: .9, ch: 4.5, roof: "none", t: .5 }); b.slab(-15.75, -38.5, 15.75, -29.5, 5.6, .3, undefined, "floor"); hall(b, { cx: 0, cz: -34, rot: 0, bays: 7, deep: 3, plat: false, y0: 5.6, ch: 3.6, roof: "xieshan", t: .5 });
    for (const x of [-14, 14]) hall(b, { cx: x, cz: 30, rot: 0, bays: 1, bay: 6, deep: 2, ph: .6, ch: 7, roof: "hip", pitch: 35, front: "wall" });
    for (const z of [10, -22]) { hall(b, { cx: 24, cz: z, rot: 270, bays: 5, deep: 2.5, ph: .6, ch: 3.9, roof: "hard" }); hall(b, { cx: -24, cz: z, rot: 90, bays: 5, deep: 2.5, ph: .6, ch: 3.9, roof: "hard" }); }
    fenceRun(b, -34, 48, -3, 48, 3.6, .6); fenceRun(b, 3, 48, 34, 48, 3.6, .6); fenceRun(b, -34, -48, 34, -48, 3.6, .6); for (const x of [-34, 34]) fenceRun(b, x, -48, x, 48, 3.6, .6);
  }, ["寺庙", "佛寺", "僧侣", "中轴"]),

  mk("宫殿·前朝三大殿·三层白台基·重檐庑殿·64m×92m", "宫殿前朝：工字形三层白石台基（总高 8.1，每层高 2.7、每层向内缩进 2.0，前殿台 62m×36m、中殿台 24m×24m、后殿台 50m×30m），台上自 +z 向 -z 依次是前殿（九开间 进深 12m、重檐庑殿）、中殿（方形三开间 攒尖）、后殿（八开间 歇山），前殿正面一道 12m 宽的御道大台阶（54 级），台面沿边 0.9m 高的白石栏板（前缘留出台阶口），金銮殿、朝会、登基和宫廷史诗戏", b => {
    const tiers = (cx: number, cz: number, w: number, d: number) => { for (let k = 0; k < 3; k++) b.box("base", cx, k * 2.7 + 1.35, cz, w - 4 * k, 2.7, d - 4 * k); };
    tiers(0, 30, 62, 36); tiers(0, 0, 24, 24); tiers(0, -28, 50, 30);
    hall(b, { cx: 0, cz: 30, rot: 0, bays: 9, deep: 4, plat: false, y0: 8.1, ch: 7.2, roof: "double" });
    hall(b, { cx: 0, cz: 0, rot: 0, bays: 3, deep: 4, plat: false, y0: 8.1, ch: 6.0, roof: "hip", pitch: 32 });
    hall(b, { cx: 0, cz: -28, rot: 0, bays: 8, deep: 4, plat: false, y0: 8.1, ch: 6.6, roof: "xieshan" });
    b.steps(0, 48, "+z", 12, 8.1);
    for (const [x0, z0, x1, z1, gap] of [[-27, 16, 27, 44, true], [-8, -8, 8, 8, false], [-21, -41, 21, -15, false]] as [number, number, number, number, boolean][]) {
      if (gap) { b.wall("x", z1, x0, -6, 8.1, .9, .4, [], "rail"); b.wall("x", z1, 6, x1, 8.1, .9, .4, [], "rail"); } else b.wall("x", z1, x0, x1, 8.1, .9, .4, [], "rail");
      b.wall("x", z0, x0, x1, 8.1, .9, .4, [], "rail"); for (const x of [x0, x1]) b.wall("z", x, z0, z1, 8.1, .9, .4, [], "rail");
    }
  }, ["宫殿", "朝堂", "金銮殿", "登基"]),

  mk("衙署·三进·大堂二堂三堂·仪门·六房·监牢·44m×88m", "官衙：围墙 44m×88m 厚 0.5 高 3.2，中轴自 +z 向 -z 依次是衙门大门（三开间）、仪门（三开间）、大堂（五开间 台基 0.9 歇山、前有 12m 宽的宽台阶）、二堂（五开间）、三堂（五开间），仪门内东西各两座两开间的六房（书吏办公房，正面朝庭院，让开大堂台基），后院西北一座两开间的监牢（正面是栏栅、中间留一道门），升堂、审案、衙门与武侠的官府戏", b => {
    hall(b, { cx: 0, cz: 38, rot: 0, bays: 3, deep: 2, ph: .5, ch: 4.2, roof: "gable" });
    hall(b, { cx: 0, cz: 24, rot: 0, bays: 3, deep: 2, ph: .6, ch: 4.0, roof: "hard" });
    hall(b, { cx: 0, cz: 4, rot: 0, bays: 5, deep: 4, ph: .9, ch: 5.1, roof: "xieshan" });
    hall(b, { cx: 0, cz: -16, rot: 0, bays: 5, deep: 3, ph: .6, ch: 3.9, roof: "hard" });
    hall(b, { cx: 0, cz: -34, rot: 0, bays: 5, deep: 3, ph: .6, ch: 3.9, roof: "hard" });
    for (const z of [18.4, 29]) { hall(b, { cx: 14.5, cz: z, rot: 270, bays: 2, bay: 4.2, deep: 2, ph: .4, ch: 3.4, roof: "hard", through: false }); hall(b, { cx: -14.5, cz: z, rot: 90, bays: 2, bay: 4.2, deep: 2, ph: .4, ch: 3.4, roof: "hard", through: false }); }
    hall(b, { cx: -17, cz: -34, rot: 0, bays: 2, deep: 2, ph: .3, ch: 3.2, roof: "hard", front: "bars" }); void 0;
    fenceRun(b, -22, 44, -3, 44, 3.2); fenceRun(b, 3, 44, 22, 44, 3.2); fenceRun(b, -22, -44, 22, -44, 3.2); for (const x of [-22, 22]) fenceRun(b, x, -44, x, 44, 3.2);
  }, ["衙署", "官府", "升堂", "审案"]),

  mk("四合院·三进·垂花门·游廊·35m×60m", "三进四合院：围墙 35m×60m 厚 0.5 高 3.2，自 +z 向 -z：倒座房（五开间 正面朝庭院）、前院、垂花门（一间 3.6m 宽 两侧院墙）、内院（东西各一座三开间厢房、两侧各一道 18m 长的游廊、五开间正房台基 0.9 带两侧 3.6m 宽的耳房）、后罩房（七开间），北方大宅、民国和家族戏", b => {
    hall(b, { cx: 0, cz: 19, rot: 180, bays: 5, deep: 2, ph: .4, ch: 3.4, roof: "hard" });
    hall(b, { cx: 0, cz: 5, rot: 0, bays: 1, bay: 3.6, deep: 2, ph: .6, ch: 3.6, roof: "gable", front: "open", through: true }); fenceRun(b, -17.5, 5, -2.4, 5, 3.2); fenceRun(b, 2.4, 5, 17.5, 5, 3.2);
    hall(b, { cx: 0, cz: -17, rot: 0, bays: 5, deep: 2.5, ph: .9, ch: 3.8, roof: "hard" }); for (const x of [-14.3, 14.3]) hall(b, { cx: x, cz: -17, rot: 0, bays: 1, bay: 3.6, deep: 2, ph: .5, ch: 3.2, roof: "hard" });
    for (const x of [-9.5, 9.5]) hall(b, { cx: x, cz: -6, rot: x < 0 ? 90 : 270, bays: 3, deep: 2, ph: .5, ch: 3.2, roof: "hard" });
    for (const x of [-14, 14]) gallery(b, x, 3, x, -12.5);
    hall(b, { cx: 0, cz: -30, rot: 0, bays: 7, deep: 2, ph: .4, ch: 3.2, roof: "hard" });
    b.wall("x", 11.5, -2, 2, 0, 3.2, .4); fenceRun(b, -17.5, 24, -2.2, 24, 3.2); fenceRun(b, 2.2, 24, 17.5, 24, 3.2); fenceRun(b, -17.5, -36, 17.5, -36, 3.2); for (const x of [-17.5, 17.5]) fenceRun(b, x, -36, x, 24, 3.2);
  }, ["四合院", "三进", "垂花门", "大宅"]),

  mk("江南园林·水榭曲廊月洞门·假山亭·60m×36m", "江南园林：围墙内一池椭圆水面（28m×18m）、南岸水榭（三开间 立在池边 台基 0.4）、西侧四段折线曲廊（共约 36m 长）、东侧叠石假山（八块岩体）顶上一座四角攒尖亭（3.6m 见方）、北墙 8m 宽 4.2m 高的白墙中一个直径 3.0m 的月洞门，两侧各接 26m 长的压瓦白墙，苏州园林、江南宅院、古装爱情和江湖戏", b => {
    b.group("water", "水面", "#6fa8c8", { roughness: .1, opacity: .85 }); ringSlab(b, "water", 0, 14, .14, .08, 40, [0, -2], { sc: [1, .65] });
    hall(b, { cx: 0, cz: 11, rot: 180, bays: 3, deep: 2, ph: .5, ch: 3.4, roof: "hip", pitch: 28, front: "open" });
    for (const [x0, z0, x1, z1] of [[-24, 14, -24, 0], [-24, 0, -14, 0], [-14, 0, -14, -12], [-14, -12, -4, -12]] as [number, number, number, number][]) gallery(b, x0, z0, x1, z1);
    [[16, 8, 5, 3, 0], [18, 5, 4, 3.4, 20], [13.5, 6, 3.2, 2.4, 70], [17, 11, 3.6, 2.8, 35], [20, 8.5, 2.6, 2.2, 10], [15.5, 3.2, 3, 2, 55], [18.5, 2, 2.4, 1.8, 40], [14, 11.5, 2.4, 1.6, 15]].forEach(([x, z, w, hgt, yaw]) => b.boxYaw("base", x!, hgt! / 2, z!, w!, hgt!, w! * .8, yaw!));
    hall(b, { cx: 16, cz: 8, rot: 0, bays: 1, bay: 3.6, deep: 1.2, plat: false, y0: 3.2, ch: 3.0, roof: "hip", pitch: 32, front: "open" });
    moonGate(b, 0, -16, "x", 8, 4.2, 1.5, 1.9); fenceRun(b, -30, -16, -4, -16, 4.2, .4); fenceRun(b, 4, -16, 30, -16, 4.2, .4); fenceRun(b, -30, 18, -21, 18, 4.2, .4); fenceRun(b, -18, 18, 30, 18, 4.2, .4); for (const x of [-30, 30]) fenceRun(b, x, -16, x, 18, 4.2, .4);
  }, ["园林", "江南", "水榭", "月洞门"]),

  mk("山寨·寨墙寨门·聚义厅·八间草屋·哨楼·64m×52m", "山寨：木寨墙 64m×52m 厚 0.5 高 4.5 一圈，正面 8m 宽 4.5m 高的实心门楼块（贯通 4.0m 宽的门洞，顶上一座三开间歇山门楼）、四个角各一座 7m 高的木哨楼，寨内正中偏后一座五开间的聚义厅（台基 0.6、正面完全敞开、悬山屋面），东西两侧各四间两开间的草屋（两坡屋面、正面朝中轴），寨心一根 14m 高的旗杆，土匪、山寨、反派据点和江湖戏", b => {
    b.wall("x", -26, -32, 32, 0, 4.5, .5); for (const x of [-32, 32]) b.wall("z", x, -26, 26, 0, 4.5, .5); b.wall("x", 26, -32, -4, 0, 4.5, .5); b.wall("x", 26, 4, 32, 0, 4.5, .5);
    b.archBlock(-4, 4, 0, 4.5, 24.5, 27.5, 0, 2, 3, 3.9, 8); hall(b, { cx: 0, cz: 26, rot: 0, bays: 2, bay: 3.6, deep: 1.2, plat: false, y0: 4.5, ch: 3.0, roof: "xieshan", front: "open" });
    for (const [x, z] of [[-31, -25], [31, -25], [-31, 25], [31, 25]] as [number, number][]) lookout(b, x, z, 7);
    hall(b, { cx: 0, cz: -10, rot: 0, bays: 5, deep: 3, ph: .6, ch: 4.5, roof: "gable", front: "open" });
    for (const z of [14, 5, -4, -13]) { hall(b, { cx: -22, cz: z, rot: 90, bays: 2, bay: 3.6, deep: 1.5, ph: .3, ch: 2.6, roof: "gable", pitch: 32 }); hall(b, { cx: 22, cz: z, rot: 270, bays: 2, bay: 3.6, deep: 1.5, ph: .3, ch: 2.6, roof: "gable", pitch: 32 }); }
    b.cyl("struct", 0, 8, 0, 14, .15, 8); b.box("rail", 1.2, 13, 8, 2.2, 1.4, .06);
  }, ["山寨", "土匪", "寨门", "江湖"]),

  mk("水乡古镇·临河两排·石拱桥·廊棚河埠·长84m", "江南水乡：一条沿 z 的河（宽 10m 的水面带、长 84m）上一座单孔石拱桥（净跨 8m、桥面高 3.8m、两端各 7m 的引坡），两岸各一排七间两层的临河民居（每间 5.4m 宽 8m 深、一层净高 2.8 二层 2.8、正面朝河、硬山屋面脊线沿 z、白墙小窗），房前 2.4m 深的廊棚（柱距 2.7m、披檐）和三处通向水面的 2.4m 宽石阶河埠，周庄、乌镇、古装水乡和江南诗意戏", b => {
    b.group("water", "水面", "#6fa8c8", { roughness: .1, opacity: .85 }); b.box("water", 0, .12, 0, 10, .08, 84);
    b.archBlock(-6, 6, 0, 3.8, -1.6, 1.6, 0, 4, .9, 3, 12); b.rampX(6, 13, 3.8, 0, -1.6, 1.6); b.rampX(-13, -6, 0, 3.8, -1.6, 1.6);
    for (const s of [-1, 1]) {
      const xf = s * 6.5, xb = s * 14.5, rot = s > 0 ? 270 : 90;
      for (let i = 0; i < 7; i++) {
        const z = -16.2 + i * 5.4 + (i >= 3 ? 5.4 : 0) - (i >= 3 ? 0 : 0), zc = i < 3 ? -19.8 + i * 5.4 : 8.4 + (i - 3) * 5.4;
        void z; hall(b, { cx: s * 10.5, cz: zc, rot: rot as 90 | 270, bays: 1, bay: 5.4, deep: 2.7, ph: .5, ch: 6, roof: "hard", pitch: 28, plat: false, y0: .5, front: "doors", steps: false });
        b.base(s * 10.5 - 4.5, zc - 2.7, s * 10.5 + 4.5, zc + 2.7, .5); b.steps(zc, s * 6, s > 0 ? "-x" : "+x", 2.4, .5);
      }
      void xf; void xb;
      for (let z = -38; z <= 38.1; z += 2.7) { if (Math.abs(z) < 5) continue; b.cyl("struct", s * 6.2, z, .5, 3.4, .12, 8); }
      b.strut("roof", [s * 6.5, 3.6, 0], [s * 5.2, 3.2, 0], 76, .1);
      for (const z of [-30, 18, 34]) b.flight(s * 5.2 + s * 2.4, z, s > 0 ? "-x" : "+x", .1, 6, 2.4, .08, .3, "base");
    }
  }, ["水乡", "古镇", "石桥", "江南"]),
];

void CLEAR; void FH; void SLAB; void WT;
