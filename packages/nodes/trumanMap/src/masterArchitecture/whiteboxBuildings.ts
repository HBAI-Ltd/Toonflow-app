import { CLEAR, FH, PT, SLAB, WB, WT, door, white, win, type Op, type Rect } from "./whitebox";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·整栋楼：住宅板楼、外廊式宿舍楼和教学楼、中廊式酒店和医院、办公楼、监狱牢区、地下车库、四合院、街屋。
// 每栋都是完整的楼板、墙、门窗洞、楼梯间和屋面（顶层楼板就是屋面），可以直接走人拍摄；需要看室内的剖切楼把正面（+z）墙去掉。
const spec = "原点在平面中心，+z 为正面，首层楼板底面 y=0、顶面 0.2（车库和四合院基础厚 0.3），层高 3.0（楼板 0.2 + 净高 2.8），楼梯踏步 0.1667×0.28、梯段宽 1.2";
export const parapet = (b: WB, x0: number, z0: number, x1: number, z1: number, y: number) => { b.wall("x", z0 + .1, x0, x1, y, 1.0, WT); b.wall("x", z1 - .1, x0, x1, y, 1.0, WT); b.wall("z", x0 + .1, z0 + .2, z1 - .2, y, 1.0, WT); b.wall("z", x1 - .1, z0 + .2, z1 - .2, y, 1.0, WT);
};
export const centers = (bounds: number[]) => bounds.slice(0, -1).map((v, i) => (v + bounds[i + 1]!) / 2);
export const bld = (name: string, what: string, theme: "现代" | "中式", build: (b: WB) => void, tags: string[]) => white(`白模·楼栋·${name}`, `白模预演整栋建筑：${what}；${spec}`, theme, build, ["整栋", ...tags]);

/** 外廊式楼：一排房间在后、外廊在前（z+），两端各一座双跑楼梯塔；用于筒子楼、教学楼。 */
function gallery(b: WB, o: { n: number; rooms: number; rw: number; rd: number; cw: number; back: (c: number) => Op[]; front: (c: number) => Op[] }) {
  const L = o.rooms * o.rw, x0 = -L / 2, x1 = L / 2, zb = -(o.rd + o.cw) / 2, zr = zb + o.rd, zf = zr + o.cw, zc = (zr + zf) / 2, cores = [{ cx: x1 + 3, flip: true }, { cx: x0 - 3, flip: false }], cs = Array.from({ length: o.rooms }, (_, i) => x0 + (i + .5) * o.rw);
  for (let k = 0; k <= o.n; k++) {
    const y = k * FH + SLAB;
    b.slab(x0, zb, x1, zf, y, SLAB, undefined, k === o.n ? "roof" : "floor"); for (const c of cores) b.doglegSlab(c.cx, zc, y, { swap: true, flip: c.flip }, k > 0);
    if (k === o.n) { parapet(b, x0, zb, x1, zf, y); break; }
    for (const c of cores) b.doglegCore(c.cx, zc, y, { swap: true, flip: c.flip });
    b.wall("x", zb, x0, x1, y, CLEAR, WT, cs.flatMap(o.back)); b.wall("x", zr, x0, x1, y, CLEAR, WT, cs.flatMap(o.front));
    for (let i = 0; i <= o.rooms; i++) b.wall("z", x0 + i * o.rw, zb, zr, y, CLEAR, WT);
    if (k === 0) { b.rail(x0, zf, -1.2, zf, y); b.rail(1.2, zf, x1, zf, y); } else b.rail(x0, zf, x1, zf, y);
  }
}

/** 中廊式楼（前侧剖切）：中间走廊、前后各一排房间，后排中央是双跑楼梯间；用于酒店、医院病区。 */
function midCorridor(b: WB, o: { n: number; X: number; rd: number; cw: number; fb: number[]; bb: number[]; frontOps: (c: number) => Op[]; backOps: (c: number) => Op[] }) {
  const hz = o.cw / 2, zb = -hz - o.rd, zf = hz + o.rd, cz = -hz - 3, fc = centers(o.fb), bc = centers(o.bb).filter(c => Math.abs(c) > 1.6);
  for (let k = 0; k <= o.n; k++) {
    const y = k * FH + SLAB;
    b.slab(-o.X, zb, o.X, zf, y, SLAB, k ? b.coreRect(0, cz, {}, -2.9, .92, 1.4) : undefined, k === o.n ? "roof" : "floor");
    if (k === o.n) { parapet(b, -o.X, zb, o.X, zf, y); break; }
    b.doglegCore(0, cz, y, { back: false });
    b.wall("x", hz, -o.X, o.X, y, CLEAR, WT, fc.flatMap(o.frontOps)); b.wall("x", -hz, -o.X, -1.5, y, CLEAR, WT, bc.filter(c => c < 0).flatMap(o.backOps)); b.wall("x", -hz, 1.5, o.X, y, CLEAR, WT, bc.filter(c => c > 0).flatMap(o.backOps));
    b.wall("x", zb, -o.X, o.X, y, CLEAR, WT, [...bc.map(c => win(c, 1.5, 1.5)), win(0, 1.2, 1.2, 1.5)]);
    for (const s of [-1, 1]) b.wall("z", s * o.X, zb, zf, y, CLEAR, WT, [win(0, 1.4, 1.6, .9)]);
    for (const xb of o.fb.slice(1, -1)) b.wall("z", xb, hz, zf, y, CLEAR, WT); for (const xb of o.bb.slice(1, -1)) b.wall("z", xb, zb, -hz, y, CLEAR, WT);
    if (k === 0) { b.rail(-o.X, zf, -1.2, zf, y); b.rail(1.2, zf, o.X, zf, y); } else b.rail(-o.X, zf, o.X, zf, y);
  }
}

export const whiteBuildingDesigns: ArchitecturePrototype[] = [
  bld("住宅板楼单元·6层·前侧剖切", "6 层住宅板楼的一个单元，12m×11m 平面，中央双跑楼梯间（3m×6m）加前厅，左右各一户（客厅卧室分隔、户门、窗），每户朝南挑出 3.5m×1.5m 阳台，前侧去墙剖切，顶上是带 1.0m 女儿墙的屋面", "现代", b => {
    const n = 6, X = 6, Z0 = -5.5, Z1 = 5.5, cz = -2.5;
    for (let k = 0; k <= n; k++) {
      const y = k * FH + SLAB;
      b.slab(-X, Z0, X, Z1, y, SLAB, k ? b.coreRect(0, cz, {}, -2.9, .92, 1.4) : undefined, k === n ? "roof" : "floor");
      if (k === n) { parapet(b, -X, Z0, X, Z1, y); break; }
      b.doglegCore(0, cz, y, { back: false });
      b.wall("x", Z0, -X, X, y, CLEAR, WT, [win(-3.75), win(0, 1.2, 1.2, 1.5), win(3.75)]);
      for (const s of [-1, 1]) {
        b.wall("z", s * X, Z0, Z1, y, CLEAR, WT, [win(-2.5), win(2.5)]); b.wall("z", s * 1.5, .5, Z1, y, CLEAR, WT, [door(3.0)]);
        const a = s < 0 ? -X : 1.5, e = s < 0 ? -1.5 : X, m = (a + e) / 2;
        b.wall("x", .5, a, e, y, CLEAR, PT, [door(m)]); b.wall("z", m, Z0, .5, y, CLEAR, PT, [door(-2.5)]);
      }
      for (const [a, e] of [[-5.5, -2.0], [2.0, 5.5]] as [number, number][]) { b.slab(a, Z1, e, Z1 + 1.5, y); b.rail(a, Z1 + 1.5, e, Z1 + 1.5, y); b.rail(a, Z1, a, Z1 + 1.5, y); b.rail(e, Z1, e, Z1 + 1.5, y); }
      if (k === 0) { b.rail(-X, Z1, -1.4, Z1, y); b.rail(1.4, Z1, X, Z1, y); } else b.rail(-X, Z1, X, Z1, y);
    }
  }, ["住宅", "板楼", "剖切"]),

  bld("外廊式宿舍楼·4层·十开间", "筒子楼（外廊式宿舍楼）：4 层、每层 10 间 3m×5m 的房间，前面 1.8m 宽外廊带栏杆，每间一门一窗，两端各一座双跑楼梯塔，屋面带女儿墙，年代剧、市井剧的典型场景", "现代", b => gallery(b, { n: 4, rooms: 10, rw: 3, rd: 5, cw: 1.8, back: c => [win(c, 1.5, 1.5)], front: c => [door(c - .8), win(c + .6, 1.2, 1.2, 1.0)] }), ["宿舍", "筒子楼", "外廊"]),
  bld("外廊式教学楼·3层·四间教室", "外廊式教学楼：3 层、每层 4 间 9m×7.2m 教室，前面 1.8m 外廊带栏杆，每间前后门加两扇窗、后墙三扇大窗，两端各一座双跑楼梯塔", "现代", b => gallery(b, { n: 3, rooms: 4, rw: 9, rd: 7.2, cw: 1.8, back: c => [win(c - 3, 1.8, 1.8), win(c, 1.8, 1.8), win(c + 3, 1.8, 1.8)], front: c => [door(c - 3.5, 1.2), win(c - 1.2, 1.5, 1.2, 1.0), win(c + 1.2, 1.5, 1.2, 1.0), door(c + 3.5, 1.2)] }), ["学校", "教学楼", "外廊"]),
  bld("中廊式酒店客房楼·3层·前侧剖切", "中廊式酒店客房楼：3 层、18m×14.4m 平面，2.4m 宽中间走廊、前排 5 间后排 4 间客房（各 3.6–3.75m×6m）、后排中央双跑楼梯间，前侧去墙剖切看房间，走廊尽头有窗", "现代", b => midCorridor(b, { n: 3, X: 9, rd: 6, cw: 2.4, fb: [-9, -5.4, -1.8, 1.8, 5.4, 9], bb: [-9, -5.25, -1.5, 1.5, 5.25, 9], frontOps: c => [door(c)], backOps: c => [door(c)] }), ["酒店", "客房", "中廊", "剖切"]),
  bld("中廊式医院病区楼·3层·前侧剖切", "中廊式医院病区楼：3 层、24m×14.7m 平面，2.7m 宽中间走廊、前排 4 间病房（6m×6m）、后排 4 间加中央双跑楼梯间，门洞 1.2m 宽，前侧去墙剖切看病房", "现代", b => midCorridor(b, { n: 3, X: 12, rd: 6, cw: 2.7, fb: [-12, -6, 0, 6, 12], bb: [-12, -7.5, -1.5, 1.5, 7.5, 12], frontOps: c => [door(c, 1.2)], backOps: c => [door(c, 1.2)] }), ["医院", "病区", "中廊", "剖切"]),

  bld("办公楼·核心筒框架·3层·前侧剖切", "框架结构办公楼：3 层、30m×18m 平面，中央核心筒（双跑楼梯间加两部电梯井）、柱距 6m 的 12 根方柱、后和两侧玻璃幕墙、前侧去墙剖切，顶上带女儿墙屋面，开敞办公层可任意隔断", "现代", b => {
    const n = 3, X = 15, Z0 = -9, Z1 = 9, holes: Rect[] = [b.coreRect(-1.5, 0, {}, -2.9, .92, 1.4), [.1, -2.9, 2.9, -.1], [.1, .1, 2.9, 2.9]];
    const curtain = (axis: "x" | "z", fixed: number, from: number, to: number, y: number) => { for (let a = from; a < to - .01; a += 3) { const m = a + 1.5; if (axis === "x") { b.box("glass", m, y + 1.4, fixed, 3.0, 2.8, .04); b.box("struct", a, y + 1.4, fixed, .1, 2.8, .12); } else { b.box("glass", fixed, y + 1.4, m, .04, 2.8, 3.0); b.box("struct", fixed, y + 1.4, a, .12, 2.8, .1); } } };
    for (let k = 0; k <= n; k++) {
      const y = k * FH + SLAB;
      b.slab(-X, Z0, X, Z1, y, SLAB, k ? holes : undefined, k === n ? "roof" : "floor");
      if (k === n) { parapet(b, -X, Z0, X, Z1, y); break; }
      b.doglegCore(-1.5, 0, y, { window: false }); b.wall("z", 3, -3, 3, y, CLEAR, WT, [door(-1.5, 1.1), door(1.5, 1.1)]); b.wall("x", -3, 0, 3, y, CLEAR, WT); b.wall("x", 0, 0, 3, y, CLEAR, WT); b.wall("x", 3, 0, 3, y, CLEAR, WT);
      for (const x of [-12, -6, 6, 12]) for (const z of [-6, 0, 6]) b.col(x, z, y, y + CLEAR, .6);
      curtain("x", Z0, -X, X, y); curtain("z", -X, Z0, Z1, y); curtain("z", X, Z0, Z1, y); if (k === 0) { b.rail(-X, Z1, -4, Z1, y); b.rail(4, Z1, X, Z1, y); } else b.rail(-X, Z1, X, Z1, y);
    }
  }, ["办公", "写字楼", "核心筒", "剖切"]),

  bld("监狱牢区·两层·中央大厅", "监狱牢区：18m×24m、两层，中央 9m 宽通高大厅，两侧每层 8 间 3m×4m 牢房（实墙隔间、前面栏栅带门洞、后墙高窗），二层沿大厅两侧的 1.5m 宽环廊带栏杆，右侧一部直跑楼梯上二层，正面（+z）端敞开，劫狱和越狱戏的核心场景", "现代", b => {
    const Xh = 4.5, Xc = 8.5, Z0 = -12, Z1 = 12, y0 = SLAB, y1 = FH + SLAB, ces = Array.from({ length: 8 }, (_, i) => Z0 + 1.5 + i * 3);
    b.slab(-Xc, Z0, Xc, Z1, y0);
    b.slab(-Xc, Z0, -Xh + 1.5, Z1, y1); b.slab(Xh - 1.5, Z0, Xc, Z1, y1, SLAB, [3.15, -11.5, 4.35, -6.46]); b.slab(-Xc, Z0, -Xh, Z1, y1 + FH, SLAB, undefined, "roof"); b.slab(Xh, Z0, Xc, Z1, y1 + FH, SLAB, undefined, "roof");
    b.flight(3.75, -11.5, "+z", y0, 18); b.stairRails(3.75, -11.5, "+z", y0, 18, 1.2);
    for (const y of [y0, y1]) {
      b.wall("x", Z0, -Xc, Xc, y, CLEAR, WT, [win(0, 3.0, 2.0, .6)]);
      for (const s of [-1, 1]) {
        b.wall("z", s * Xc, Z0, Z1, y, CLEAR, WT, ces.map(c => win(c, .6, .4, 2.0)));
        for (let i = 0; i <= 8; i++) b.wall("x", Z0 + i * 3, Math.min(s * Xh, s * Xc), Math.max(s * Xh, s * Xc), y, CLEAR, WT);
        b.bars("z", s * Xh, Z0, Z1, y, 2.4, ces.map(c => [c - .5, c + .5] as [number, number])); b.wall("z", s * Xh, Z0, Z1, y + 2.4, .4, WT);
      }
    }
    for (const s of [-1, 1]) b.rail(s * (Xh - 1.5), Z0, s * (Xh - 1.5), Z1, y1);
  }, ["监狱", "牢房", "越狱"]),

  bld("地下车库·两层·含双坡道", "地下车库：24m×36m、两层（B2、B1）加顶板，6m 柱网共 15 根方柱、四周挡土墙，B2→B1 坡道在右侧、B1→地面坡道在左侧（宽 3m、坡度 1:6），正面（+z）去墙剖切", "现代", b => {
    const y0 = .3, h = 3.6, X = 12, Z = 18;
    b.slab(-X, -Z, X, Z, y0, .3);
    for (let k = 1; k <= 2; k++) b.slab(-X, -Z, X, Z, y0 + k * h, .3, k === 1 ? [8.5, -17, 11.5, 4.6] : [-11.5, -4.6, -8.5, 17], k === 2 ? "roof" : "floor");
    for (let k = 0; k < 2; k++) { const y = y0 + k * h; for (const x of [-6, 0, 6]) for (const z of [-12, -6, 0, 6, 12]) b.col(x, z, y, y + h - .3, .6); b.wall("x", -Z + .2, -X, X, y, h - .3, .4); for (const s of [-1, 1]) b.wall("z", s * (X - .2), -Z, Z, y, h - .3, .4); }
    b.ramp(8.5, -17, 11.5, 4.6, y0, y0 + h); b.ramp(-11.5, -4.6, -8.5, 17, y0 + 2 * h, y0 + h); b.rail(-X, Z, X, Z, y0 + 2 * h);
  }, ["车库", "停车场", "地下"]),

  bld("四合院·单进·正房厢房倒座", "北京四合院（单进）：18m×20.4m，北面正房五开间（中三间加两耳房）、东西厢房各三开间、南面倒座房五开间带 2.4m 大门洞，围合 9m×10.2m 院落，各房硬山双坡屋顶（坡度 25°），台基 0.3m；朝院落一侧是门窗，对外一侧是实墙", "中式", b => {
    const yb = .3, h = 3.6, t = .3;
    b.slab(-9.3, -10.8, 9.3, 9.9, yb, .3);
    const row = (z0: number, z1: number, faceZ: number, outerZ: number, outerOps: Op[]) => {
      b.wall("x", faceZ, -9, 9, yb, h, t, [-7.2, -3.6, 0, 3.6, 7.2].map(c => c === 0 && z0 < 0 ? door(0, 1.8, 2.7) : c === 3.6 && z0 > 0 ? door(3.6, 2.4, 3) : win(c, 1.5, 1.8, .9))); b.wall("x", outerZ, -9, 9, yb, h, t, outerOps);
      for (const x of [-9, 9]) b.wall("z", x, z0, z1, yb, h, t); for (const x of [-5.4, 5.4]) b.wall("z", x, z0, z1, yb, h, t, [door((z0 + z1) / 2, 1.2, 2.4)]); b.gable(-9, z0, 9, z1, yb + h, 25, .6, .15, "roof", "x");
    };
    row(-10.5, -5.1, -5.1, -10.5, [win(-5.4, 1.2, 1.0, 1.6), win(0, 1.2, 1.0, 1.6), win(5.4, 1.2, 1.0, 1.6)]);
    row(5.1, 9.6, 5.1, 9.6, [door(3.6, 2.4, 3.0), win(-7.2, 1.2, 1.0, 1.8), win(-3.6, 1.2, 1.0, 1.8), win(0, 1.2, 1.0, 1.8), win(7.2, 1.2, 1.0, 1.8)]);
    for (const s of [-1, 1]) { b.wall("z", s * 4.5, -5.1, 5.1, yb, h, t, [-3.4, 0, 3.4].map(c => c === 0 ? door(0, 1.2, 2.7) : win(c, 1.5, 1.8, .9))); b.wall("z", s * 9, -5.1, 5.1, yb, h, t); for (const z of [-5.1, 5.1]) b.wall("x", z, Math.min(s * 4.5, s * 9), Math.max(s * 4.5, s * 9), yb, h, t); b.gable(Math.min(s * 4.5, s * 9), -5.1, Math.max(s * 4.5, s * 9), 5.1, yb + h, 25, .6, .15, "roof", "z"); }
  }, ["四合院", "北京", "古装", "民居"]),

  bld("店铺街屋·三开间·两层", "沿街店铺（下店上宅）：9m×12m、两层，首层正面橱窗加双开店门、背面后门，二层正面三扇窗，沿右侧山墙一部直跑楼梯上二层，两侧共墙，屋面是垂直街面的 30° 双坡屋顶（山墙朝街）", "现代", b => {
    const X = 4.5, Z = 6, hole: Rect = [3.1, -5.4, 4.3, -.36];
    for (let k = 0; k <= 2; k++) {
      const y = k * FH + SLAB;
      b.slab(-X, -Z, X, Z, y, SLAB, k === 1 ? hole : undefined, k === 2 ? "roof" : "floor");
      if (k === 2) { b.gable(-X, -Z, X, Z, y, 30, .5, .15, "roof", "z"); break; }
      b.wall("x", Z, -X, X, y, CLEAR, WT, k === 0 ? [win(-3, 2.4, 2.1, .6), door(0, 1.8), win(3, 2.4, 2.1, .6)] : [win(-3), win(0), win(3)]); b.wall("x", -Z, -X, X, y, CLEAR, WT, k === 0 ? [door(-2), win(2.5, 1.5, 1.5)] : [win(-2.5), win(2.5)]);
      for (const s of [-1, 1]) b.wall("z", s * X, -Z, Z, y, CLEAR, WT);
      if (k === 0) { b.flight(3.7, -5.4, "+z", y, 18); b.stairRails(3.7, -5.4, "+z", y, 18, 1.2, [-1]); }
      if (k === 1) b.wall("x", 0, -X, 2.5, y, CLEAR, PT, [door(-1.5)]);
    }
  }, ["店铺", "街屋", "店宅", "街景"]),
];
