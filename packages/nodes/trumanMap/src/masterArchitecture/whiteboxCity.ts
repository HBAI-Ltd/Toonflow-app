import type { P } from "./ruinKit";
import { CLEAR, FH, PT, SLAB, WB, WT, door, getDetail, white, win, type Op, type Rect } from "./whitebox";
import { bld, parapet } from "./whiteboxBuildings";
import { whiteAnc } from "./whiteboxAncientKit";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·现代城市：高层住宅塔楼和办公塔楼（整栋 + 可垂直堆叠的标准层 / 屋顶层模块）、骑楼街、握手楼、烂尾楼、停车楼、机关柱廊大楼，
// 以及加油站、高架桥、隧道。层高统一 3.0（楼板 0.2 + 净高 2.8），标准层模块的楼板底面在 y=0、上下对齐，可以直接叠成任意层数。
const lo = Math.min, hi = Math.max;
const site = (name: string, what: string, build: (b: WB) => void, tags: string[]) => white(`白模·场地·${name}`, `白模预演城市场地建筑：${what}；原点在平面中心，+z 为正面，地面标高 0，层高 3.0`, "现代", build, ["场地", ...tags]);

/** 整面外墙（一个网格）：沿 axis（"x" 沿 x、z 固定；"z" 沿 z、x 固定）从 from 到 to，底 y0、高 h、厚 t；洞口只画内外两张面、侧壁和一片玻璃，比逐块方盒省三倍以上顶点。 */
export function facade(b: WB, axis: "x" | "z", fixed: number, from: number, to: number, y0: number, h: number, t: number, ops: Op[], key = "wall") {
  const pt = (u: number, y: number, s: number): P => axis === "x" ? [u, y, fixed + s * t / 2] : [fixed + s * t / 2, y, u];
  const nr = (s: number): P => axis === "x" ? [0, 0, s] : [s, 0, 0], nu = (s: number): P => axis === "x" ? [s, 0, 0] : [0, 0, s];
  const face = (ua: number, ub: number, ya: number, yb: number) => { if (ub - ua < .01 || yb - ya < .01) return; for (const s of [1, -1]) b.quad4(key, pt(ua, ya, s), pt(ub, ya, s), pt(ub, yb, s), pt(ua, yb, s), nr(s)); };
  let cur = from;
  for (const o of [...ops].sort((p, q) => p.c - q.c)) {
    const a = Math.max(from, o.c - o.w / 2), e = Math.min(to, o.c + o.w / 2); if (e <= a + .01) continue;
    const ya = y0 + o.sill, yb = ya + o.h;
    face(cur, a, y0, y0 + h); face(a, e, y0, ya); face(a, e, yb, y0 + h);
    b.quad4(key, pt(a, ya, 1), pt(a, ya, -1), pt(a, yb, -1), pt(a, yb, 1), nu(1)); b.quad4(key, pt(e, ya, 1), pt(e, ya, -1), pt(e, yb, -1), pt(e, yb, 1), nu(-1));
    if (o.sill > .01) b.quad4(key, pt(a, ya, 1), pt(e, ya, 1), pt(e, ya, -1), pt(a, ya, -1), [0, 1, 0]);
    b.quad4(key, pt(a, yb, 1), pt(e, yb, 1), pt(e, yb, -1), pt(a, yb, -1), [0, -1, 0]);
    if (o.glass) for (const s of [1, -1]) b.quad4("glass", pt(a, ya, 0), pt(e, ya, 0), pt(e, yb, 0), pt(a, yb, 0), nr(s));
    cur = Math.max(cur, e);
  }
  face(cur, to, y0, y0 + h);
  for (const [u, s] of [[from, -1], [to, 1]] as [number, number][]) b.quad4(key, pt(u, y0, -1), pt(u, y0, 1), pt(u, y0 + h, 1), pt(u, y0 + h, -1), nu(s));
  // 细化：窗套、门套、窗中梃（四边形，比方盒省顶点）、首层勒脚和每层檐口带；等级 1 只画朝外一侧，等级 2 起两面都画。
  const lv = getDetail();
  if (lv < 1) return;
  const pl = (u: number, y: number, off: number): P => axis === "x" ? [u, y, fixed + off] : [fixed + off, y, u];
  const sorted = [...ops].sort((p, q) => p.c - q.c), sides = lv >= 2 ? [1, -1] : [fixed >= 0 ? 1 : -1];
  const strip = (k: string, s: number, ua: number, ub: number, ya: number, yb: number, d = .012) => { if (ub - ua > .005 && yb - ya > .005) b.quad4(k, pl(ua, ya, s * (t / 2 + d)), pl(ub, ya, s * (t / 2 + d)), pl(ub, yb, s * (t / 2 + d)), pl(ua, yb, s * (t / 2 + d)), nr(s)); };
  const band = (k: string, s: number, ya: number, yb: number, d: number, blocked: (o: Op) => boolean) => {
    let cur = from;
    for (const o of sorted) { if (!blocked(o)) continue; const a = Math.max(from, o.c - o.w / 2), e = Math.min(to, o.c + o.w / 2); if (e <= a) continue; strip(k, s, cur, a, ya, yb, d); cur = Math.max(cur, e); }
    strip(k, s, cur, to, ya, yb, d);
  };
  for (const s of sides) {
    for (const o of sorted) {
      const a = Math.max(from, o.c - o.w / 2), e = Math.min(to, o.c + o.w / 2); if (e <= a + .3) continue;
      const ya = y0 + o.sill, yb = ya + o.h;
      if (o.glass) {
        const f = .07; strip("frame", s, a - f, a, ya - f, yb + f); strip("frame", s, e, e + f, ya - f, yb + f); strip("frame", s, a, e, yb, yb + f); strip("frame", s, a, e, ya - f, ya);
        if (lv >= 3) {
          const m = (a + e) / 2, ym = (ya + yb) / 2, mq = (u0: number, u1: number, v0: number, v1: number) => b.quad4("frame", pl(u0, v0, s * .02), pl(u1, v0, s * .02), pl(u1, v1, s * .02), pl(u0, v1, s * .02), nr(s));
          if (e - a > 1.1) mq(m - .02, m + .02, ya, yb);
          if (o.h > 1.3) mq(a, e, ym - .02, ym + .02);
        }
      } else if (o.sill < .05 && o.h >= 1.8) { const f = .08; strip("frame", s, a - f, a, y0, yb + f); strip("frame", s, e, e + f, y0, yb + f); strip("frame", s, a, e, yb, yb + f); }
    }
    if (lv >= 3 && h >= 2.5) { if (y0 < .35) band("trim", s, y0, y0 + .5, .03, o => o.sill < .5); band("trim", s, y0 + h - .14, y0 + h, .03, o => o.sill + o.h > h - .14); }
  }
}

// 塔楼核心筒（住宅和办公共用）：楼梯在 x∈[-4.5,-1.5]、z∈[-3,3]（门开向东侧电梯厅），两部电梯井在 x∈[1.8,4.2]，电梯厅宽 3.3m 夹在中间。
const shafts: [number, number][] = [[-3, -.6], [.6, 3]];
const shaftWalls = (b: WB, y: number) => { for (const [a, e] of shafts) { b.wall("z", 1.8, a, e, y, CLEAR, WT, [door((a + e) / 2, 1.2, 2.1)]); b.wall("z", 4.2, a, e, y, CLEAR, WT); b.wall("x", a, 1.8, 4.2, y, CLEAR, WT); b.wall("x", e, 1.8, 4.2, y, CLEAR, WT); } };
const towerHoles = (b: WB): Rect[] => [b.coreRect(-3, 0, {}, -2.9, .92, 1.4), ...shafts.map(([a, e]) => [1.8, a, 4.2, e] as Rect)];
const stairCore = (b: WB, y: number) => b.doglegCore(-3, 0, y, { door: false, window: false, sideOps: [[], [door(2, 1, 2.1)]] });

// 住宅点式塔楼：24m×24m 平面，每层四户（每户一扇户门朝向东西向电梯厅两侧的 3.3m 走廊），外墙每面五扇窗。
const RX = 12;
const resFloor = (b: WB, y: number, ground: boolean) => {
  const w5 = (): Op[] => [-8, -4, 0, 4, 8].map(c => win(c, 1.8, 1.5, .9)), w4 = (): Op[] => [-8, -4, 4, 8].map(c => win(c, 1.8, 1.5, .9));
  facade(b, "x", RX, -RX, RX, y, CLEAR, WT, ground ? [door(0, 2.4, 2.4), ...w4()] : w5()); facade(b, "x", -RX, -RX, RX, y, CLEAR, WT, ground ? [door(0, 1.8, 2.4), ...w4()] : w5());
  for (const s of [-1, 1]) facade(b, "z", s * RX, -RX, RX, y, CLEAR, WT, w5());
  stairCore(b, y); shaftWalls(b, y);
  for (const x of [-1.5, 1.8]) { b.wall("z", x, 3, RX - .1, y, CLEAR, PT, [door(7.5)]); b.wall("z", x, -RX + .1, -3, y, CLEAR, PT, [door(-7.5)]); }
  for (const s of [-1, 1]) b.wall("x", 0, s > 0 ? 4.5 : -RX + .1, s > 0 ? RX - .1 : -4.5, y, CLEAR, PT);
};
const resRoof = (b: WB, y: number) => {
  parapet(b, -RX, -RX, RX, RX, y);
  b.wall("x", 3, -4.5, 4.5, y, CLEAR, WT, [door(-3, 1, 2.1)]); b.wall("x", -3, -4.5, 4.5, y, CLEAR, WT); for (const x of [-4.5, 4.5]) b.wall("z", x, -3, 3, y, CLEAR, WT);
  b.slab(-4.5, -3, 4.5, 3, y + FH, SLAB, undefined, "roof"); b.box("equip", 8, y + 1.2, 7, 3, 2.4, 3); b.box("equip", -8, y + .6, -7, 2.4, 1.2, 1.6);
};
const resTower = (b: WB, n: number) => {
  for (let k = 0; k <= n; k++) { const y = k * FH + SLAB; b.slab(-RX, -RX, RX, RX, y, SLAB, k ? towerHoles(b) : undefined, k === n ? "roof" : "floor"); if (k === n) { resRoof(b, y); break; } resFloor(b, y, k === 0); }
};

// 办公塔楼：36m×36m 平面，通长玻璃幕墙（每层一块玻璃、3m 一根竖梃），中央 12m×12m 核心筒（南北各一扇 1.8m 门进电梯厅）。
const OX = 18;
const mullions = (b: WB, y0: number, y1: number, entrance = false) => {
  for (let x = -OX; x <= OX + .01; x += 3) for (const s of [-1, 1]) { if (entrance && s > 0 && Math.abs(x) < .1) continue; b.box("struct", x, (y0 + y1) / 2, s * OX, .15, y1 - y0, .2); }
  for (let z = -OX + 3; z < OX - .01; z += 3) for (const s of [-1, 1]) b.box("struct", s * OX, (y0 + y1) / 2, z, .2, y1 - y0, .15);
};
const offFloor = (b: WB, y: number, ground: boolean) => {
  for (const s of [-1, 1]) {
    if (ground && s > 0) for (const [a, e] of [[-OX, -2.4], [2.4, OX]] as [number, number][]) b.box("glass", (a + e) / 2, y + CLEAR / 2, OX, e - a, CLEAR, .05); else b.box("glass", 0, y + CLEAR / 2, s * OX, 2 * OX, CLEAR, .05);
    b.box("glass", s * OX, y + CLEAR / 2, 0, .05, CLEAR, 2 * OX);
  }
  for (const s of [-1, 1]) b.wall("x", s * 6, -6, 6, y, CLEAR, WT, [door(.15, 1.8, 2.4)]);
  for (const s of [-1, 1]) b.wall("z", s * 6, -6, 6, y, CLEAR, WT);
  stairCore(b, y); shaftWalls(b, y);
};
const offRoof = (b: WB, y: number, helipad: boolean) => {
  parapet(b, -OX, -OX, OX, OX, y);
  b.wall("x", 6, -6, 6, y, CLEAR, WT, [door(.15, 1.8, 2.4)]); b.wall("x", -6, -6, 6, y, CLEAR, WT); for (const x of [-6, 6]) b.wall("z", x, -6, 6, y, CLEAR, WT);
  b.slab(-6, -6, 6, 6, y + FH, SLAB, undefined, "roof");
  if (helipad) { b.cyl("floor", 0, 11, y, y + .3, 7.5, 24); for (const x of [-1.4, 1.4]) b.box("equip", x, y + .32, 11, .5, .04, 6); b.box("equip", 0, y + .32, 11, 2.3, .04, .5); }
  else { for (const x of [-12, 12]) b.box("equip", x, y + 1.2, -12, 4, 2.4, 4); }
};
const offTower = (b: WB, n: number) => {
  for (let k = 0; k <= n; k++) { const y = k * FH + SLAB; b.slab(-OX, -OX, OX, OX, y, SLAB, k ? towerHoles(b) : undefined, k === n ? "roof" : "floor"); if (k === n) { offRoof(b, y, true); break; } offFloor(b, y, k === 0); }
  mullions(b, SLAB, n * FH + SLAB, true);
};

export const whiteCityDesigns: ArchitecturePrototype[] = [
  bld("高层住宅塔楼·16层·点式·24m方·高49m", "一梯两井点式住宅塔楼：16 层、24m×24m 平面、总高 49.2m（含屋面机房 52m），每层四户（户间隔墙 0.1 厚、户门 1.0m 开向东西向 3.3m 走廊），外墙每面五扇 1.8m×1.5m 窗（窗台 0.9），中央核心筒（双跑楼梯间加两部电梯井、电梯厅 3.3m），首层南面 2.4m 大门，屋面 1.0m 女儿墙加楼梯电梯机房和水箱，屋顶追逐、楼梯间戏和住宅楼走廊", "现代", b => resTower(b, 16), ["高层", "塔楼", "住宅", "屋顶"]),
  bld("高层办公塔楼·24层·玻璃幕墙·36m方·高72m", "玻璃幕墙办公塔楼：24 层、36m×36m 平面、总高 72.2m，通长玻璃幕墙（每层一块、3m 一根竖梃通高）、中央 12m×12m 核心筒（南北各一扇 1.8m 门、双跑楼梯间加两部电梯井）、首层南面留 4.8m 宽入口，开敞办公层可任意隔断，屋面 1.0m 女儿墙带直升机停机坪（直径 15m）和 3m 高设备机房，企业总部、天台对峙、直升机戏", "现代", b => offTower(b, 24), ["高层", "塔楼", "办公", "幕墙", "停机坪"]),
  bld("塔楼模块·住宅标准层·24m方·层高3.0m", "住宅塔楼标准层模块：24m×24m、楼板（带楼梯和电梯井洞口）厚 0.2 在底、净高 2.8，四户、核心筒、外墙五窗，模块底面 y=0、上下楼板对齐，直接垂直堆叠成任意层数，最下面一层换成首层，最上面放「屋顶层」", "现代", b => { b.slab(-RX, -RX, RX, RX, SLAB, SLAB, towerHoles(b)); resFloor(b, SLAB, false); }, ["塔楼", "标准层", "模块", "住宅"]),
  bld("塔楼模块·住宅屋顶层·24m方", "住宅塔楼屋顶层模块：24m×24m 屋面楼板（带楼梯和电梯井洞口）、1.0m 女儿墙、楼梯电梯机房、水箱和设备体量，模块底面 y=0，放在最上一层「标准层」上面", "现代", b => { b.slab(-RX, -RX, RX, RX, SLAB, SLAB, towerHoles(b), "roof"); resRoof(b, SLAB); }, ["塔楼", "屋顶层", "模块", "住宅"]),
  bld("塔楼模块·办公标准层·36m方·幕墙·层高3.0m", "办公塔楼标准层模块：36m×36m、通长玻璃幕墙一圈（3m 一根竖梃）、楼板（带楼梯和电梯井洞口）厚 0.2 在底、净高 2.8、中央 12m 核心筒，模块底面 y=0、上下楼板对齐，直接垂直堆叠成任意层数", "现代", b => { b.slab(-OX, -OX, OX, OX, SLAB, SLAB, towerHoles(b)); offFloor(b, SLAB, false); mullions(b, SLAB, FH + SLAB); }, ["塔楼", "标准层", "模块", "办公", "幕墙"]),
  bld("塔楼模块·办公屋顶层·36m方·停机坪", "办公塔楼屋顶层模块：36m×36m 屋面楼板（带楼梯和电梯井洞口）、1.0m 女儿墙、核心筒出屋面机房、直径 15m 的直升机停机坪（带 H 标线），模块底面 y=0，放在最上一层「标准层」上面", "现代", b => { b.slab(-OX, -OX, OX, OX, SLAB, SLAB, towerHoles(b), "roof"); offRoof(b, SLAB, true); }, ["塔楼", "屋顶层", "模块", "办公", "停机坪"]),

  bld("骑楼街·两侧三层·街宽9m·长24m", "岭南和南洋骑楼街：24m 长、中间 9m 宽车行道、两侧各 3m 宽骑楼人行道（0.5m 方柱每 4m 一根、首层净高 2.8）、每侧三间 8m 宽的店铺（首层 4.0m 宽卷帘门洞、后门）、二三层悬挑在人行道上空（前窗六扇 1.5m×1.8m、后窗六扇），店间隔墙 0.2 厚，每间两跑直梯上楼，平屋面 1.0m 女儿墙，港片追逐、南洋市井、老城区街景", "现代", b => {
    for (const s of [-1, 1] as const) {
      const zf = s * 4.5, zs = s * 7.5, zb = s * 16.5, za = lo(zf, zb), zz = hi(zf, zb), sc = [-8, 0, 8], rooms = [-10, -6, -2, 2, 6, 10];
      b.slab(-12, za, 12, zz, SLAB, SLAB);
      for (let x = -12; x <= 12.01; x += 4) b.col(x, zf, SLAB, FH + SLAB, .5);
      b.wall("x", zs, -12, 12, SLAB, CLEAR, WT, sc.map(c => door(c, 4, 2.7))); b.wall("x", zb, -12, 12, SLAB, CLEAR, WT, sc.map(c => door(c, 1, 2.1)));
      for (const x of [-12, -4, 4, 12]) b.wall("z", x, lo(zs, zb), hi(zs, zb), SLAB, CLEAR, WT);
      for (let k = 1; k <= 3; k++) {
        const y = k * FH + SLAB, off = k % 2 ? 3 : -3, holes = sc.map(c => [c + off - .5, lo(s * 10.7, s * 16), c + off + .5, hi(s * 10.7, s * 16)] as Rect);
        b.slab(-12, za, 12, zz, y, SLAB, holes, k === 3 ? "roof" : "floor");
        for (const c of sc) b.flight(c + off, s * 16, s > 0 ? "-z" : "+z", y - FH, 18, 1, FH / 18, .28);
        if (k === 3) { parapet(b, -12, za, 12, zz, y); break; }
        b.wall("x", zf, -12, 12, y, CLEAR, WT, rooms.map(c => win(c, 1.5, 1.8, .6))); b.wall("x", zb, -12, 12, y, CLEAR, WT, rooms.map(c => win(c, 1.2, 1.2, 1.0)));
        for (const x of [-12, -4, 4, 12]) b.wall("z", x, za, zz, y, CLEAR, WT);
      }
    }
  }, ["骑楼", "街景", "港片", "追逐", "商铺"]),

  bld("握手楼·三栋并立·楼间距0.9m·七八六层", "城中村握手楼：三栋 6m×12m 的窄楼并立、楼间距只有 0.9m（可侧身通过、可从窗口对跳），分别是 7、8、6 层，每层前后墙各两扇窗、侧墙（对着邻楼的窄缝）各两扇窗、每栋一座 3m×6m 双跑楼梯间贴后墙，首层前面是 3m 宽门面，屋面 1.0m 女儿墙加水箱，逼仄的市井追逐、窗口对视和楼缝打斗", "现代", b => {
    for (const d of [{ cx: -6.9, n: 7 }, { cx: 0, n: 8 }, { cx: 6.9, n: 6 }]) {
      const x0 = d.cx - 3, x1 = d.cx + 3, Z = 6;
      for (let k = 0; k <= d.n; k++) {
        const y = k * FH + SLAB;
        b.slab(x0, -Z, x1, Z, y, SLAB, k ? b.coreRect(d.cx, -3, {}, -2.9, .92, 1.4) : undefined, k === d.n ? "roof" : "floor");
        if (k === d.n) { parapet(b, x0, -Z, x1, Z, y); b.box("equip", d.cx + 1.2, y + 1.1, 3.5, 1.6, 2.2, 1.6); break; }
        b.doglegCore(d.cx, -3, y, { back: false });
        b.wall("x", Z, x0, x1, y, CLEAR, WT, k ? [win(d.cx - 1.5), win(d.cx + 1.5)] : [door(d.cx, 3, 2.7)]); b.wall("x", -Z, x0, x1, y, CLEAR, WT, [win(d.cx - 2.25, 1, 1.5), win(d.cx + 2.25, 1, 1.5)]);
        for (const x of [x0, x1]) b.wall("z", x, -Z, Z, y, CLEAR, WT, [win(-3, 1.2, 1.5), win(3, 1.2, 1.5)]);
      }
    }
  }, ["握手楼", "城中村", "窄巷", "追逐", "市井"]),

  bld("烂尾楼·框架结构·八层·无外墙", "烂尾楼：36m×18m、8 层现浇混凝土框架（0.6m 方柱 7×4 共 28 根通高、柱距 6m、楼板 0.2 厚外挑 0.3），无外墙无围护，+x 端一座已浇好的核心筒（双跑楼梯加两部电梯井、墙到顶），首层和二层后墙砌了一半砖墙（带窗洞）和两道隔墙，屋面无女儿墙，绑架、解救、终局对决的经典场景", "现代", b => {
    const xs = [-18, -12, -6, 0, 6, 12, 18], zs = [-9, -3, 3, 9], n = 8, o = { swap: true, flip: true };
    for (const x of xs) for (const z of zs) b.col(x, z, 0, n * FH + SLAB, .6);
    const holes = (): Rect[] => [b.coreRect(15, 0, o, -2.9, .92, 1.4), [13.8, 3.3, 16.2, 5.7], [13.8, -5.7, 16.2, -3.3]];
    for (let k = 0; k <= n; k++) {
      const y = k * FH + SLAB;
      b.slab(-18.3, -9.3, 18.3, 9.3, y, SLAB, k ? holes() : undefined, k === n ? "roof" : "floor");
      if (k === n) break;
      b.doglegCore(15, 0, y, { ...o, window: false });
      for (const z of [4.5, -4.5]) { b.wall("x", z + 1.2, 13.8, 16.2, y, CLEAR, WT); b.wall("x", z - 1.2, 13.8, 16.2, y, CLEAR, WT); b.wall("z", 13.8, z - 1.2, z + 1.2, y, CLEAR, WT); b.wall("z", 16.2, z - 1.2, z + 1.2, y, CLEAR, WT); }
    }
    for (let k = 0; k < 2; k++) { const y = k * FH + SLAB; b.wall("x", -9, -18, 12, y, CLEAR, .2, [win(-14, 1.5, 1.5), win(-8, 1.5, 1.5), win(-2, 1.5, 1.5), win(4, 1.5, 1.5)]); b.wall("z", -6, -9, 3, y, CLEAR, .1, [door(-3)]); b.wall("x", 3, -12, -6, y, CLEAR, .1, [door(-9)]); }
  }, ["烂尾楼", "框架", "绑架", "对决", "毛坯"]),

  bld("停车楼·五层·36m×18m·双向坡道·楼梯塔", "五层敞开式停车楼：36m×18m 每层楼板（外挑 0.3）、7×3 共 21 根 0.5m 方柱通高、每层 1.0m 高车挡墙，层高 3.0；相邻两层用 5m 宽的实心斜坡板连接（坡度 0.25，偶数层坡道在 +x 一端、奇数层在 -x 一端，上层楼板在坡口留洞），+x 外挂一座双跑楼梯塔、每层有门，飞车追逐、地下交易、狙击对峙的典型场景", "现代", b => {
    const X = 18, Z = 9, n = 4, o = { swap: true, flip: true };
    for (const x of [-18, -12, -6, 0, 6, 12, 18]) for (const z of [-9, 0, 9]) b.col(x, z, 0, n * FH + SLAB, .5);
    for (let k = 0; k <= n; k++) {
      const y = k * FH + SLAB;
      b.slab(-X - .3, -Z - .3, X + .3, Z + .3, y, SLAB, k ? [k % 2 ? [3, -8.5, 15, -3.5] : [-15, -8.5, -3, -3.5]] : undefined, k === n ? "roof" : "floor");
      b.doglegSlab(21, 6, y, o, k > 0); if (k < n) b.doglegCore(21, 6, y, o);
      if (k > 0) {
        for (const s of [-1, 1]) b.wall("x", s * (Z + .1), -X, X, y, 1.0, .2);
        b.wall("z", -X, -Z, Z, y, 1.0, .2); b.wall("z", X, -Z, Z, y, 1.0, .2, [door(6, 1.4, 1.0)]);
      }
      if (k < n) { const up = k % 2 === 0, xa = up ? 15 : -15, xb = up ? 3 : -3; b.strut("floor", [xa, y - .15, -6], [xb, y + FH - .15, -6], 5, .3); }
    }
  }, ["停车楼", "车库", "追逐", "交易", "坡道"]),

  bld("机关大楼·六柱柱廊·十二级台阶·四层", "机关柱廊大楼（法院、银行、警局、政府）：36m×18m 主体 4 层、2.0m 高台基（正面 15m 宽 12 级台阶）、前门廊 18m×6.5m 带六根径 1.0 高 9m 的圆柱和 15° 山花屋面，首层三扇 2.4m 大门，各层开敞平面加两端各一座双跑楼梯间，平屋面 1.2m 女儿墙，台阶上的对峙、抗议、押解和记者围堵", "现代", b => {
    const PH = 2, X = 18, Z = 9, n = 4;
    b.box("floor", 0, PH / 2, 2.5, 39, PH, 26);
    for (let k = 0; k <= n; k++) {
      const y = PH + k * FH + SLAB, front: Op[] = k ? [-15, -12, -9, -6, -3, 0, 3, 6, 9, 12, 15].map(c => win(c, 1.5, 1.8, .6)) : [door(-4.5, 2.4, 2.7), door(0, 2.4, 2.7), door(4.5, 2.4, 2.7), ...[-15, -12, -9, 9, 12, 15].map(c => win(c, 1.5, 2.1, .6))];
      b.slab(-X, -Z, X, Z, y, SLAB, k && k < n ? [b.coreRect(-15, 0, {}, -2.9, .92, 1.4), b.coreRect(15, 0, {}, -2.9, .92, 1.4)] : undefined, k === n ? "roof" : "floor");
      if (k === n) { parapet(b, -X, -Z, X, Z, y); break; }
      facade(b, "x", Z, -X, X, y, CLEAR, WT, front); facade(b, "x", -Z, -X, X, y, CLEAR, WT, [-15, -12, -9, -6, -3, 0, 3, 6, 9, 12, 15].map(c => win(c, 1.5, 1.8, .6)));
      for (const s of [-1, 1]) facade(b, "z", s * X, -Z, Z, y, CLEAR, WT, [-6, -3, 0, 3, 6].map(c => win(c, 1.5, 1.8, .6)));
      if (k < n - 1) for (const x of [-15, 15]) b.doglegCore(x, 0, y, { back: false, door: true, window: false });
    }
    const yT = PH + 3 * FH;
    for (const x of [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5]) b.cyl("struct", x, 14.5, PH, yT, .5, 12);
    b.beamH("x", 14.5, -9, 9, yT + .8, 1, .8); b.gable(-9.5, 9, 9.5, 15.5, yT + .8, 15, .3, .2, "roof", "z");
    b.flight(0, 15.5 + 12 * .3, "-z", 0, 12, 15, PH / 12, .3, "stair");
  }, ["机关", "柱廊", "台阶", "法院", "银行", "警局"]),

  site("加油站·罩棚24m×12m·站房·四台加油机", "加油站：24m×12m 平屋面罩棚（板厚 0.3、净高 5.5、四根 0.6m 方柱在岛端）、两座 20m×1.2m 加油岛（高 0.2）各两台 0.8m×1.6m×0.5m 的加油机，罩棚后面 12m×8m 站房（前面一整排 7m 宽落地窗加一扇 1.8m 门、净高 3.4、平屋面），路边 7m 高的价格牌塔，夜景、追车、劫案和对峙", b => {
    b.slab(-12, -6, 12, 6, 5.8, .3, undefined, "roof");
    for (const x of [-8, 8]) for (const z of [-2.4, 2.4]) b.col(x, z, 0, 5.5, .6);
    for (const z of [-2.4, 2.4]) { b.box("floor", 0, .1, z, 20, .2, 1.2); for (const x of [-3, 3]) b.box("equip", x, 1.0, z, .8, 1.6, .5); }
    b.slab(-6, -14, 6, -6, SLAB, SLAB);
    b.wall("x", -6, -6, 6, SLAB, 3.4, WT, [win(-1.5, 7, 2.6, .4), door(4.5, 1.8, 2.4)]); b.wall("x", -14, -6, 6, SLAB, 3.4, WT, [door(0, 1, 2.1)]);
    for (const x of [-6, 6]) b.wall("z", x, -14, -6, SLAB, 3.4, WT, [win(-10, 1.5, 1.2, 1.2)]);
    b.slab(-6.6, -14.6, 6.6, -5.4, SLAB + 3.4 + .3, .3, undefined, "roof"); b.box("equip", 16, 3.5, 4, 1.2, 7, .4);
  }, ["加油站", "夜景", "追车", "劫案"]),

  site("高架桥·双向四车道·宽15m·三跨72m", "城市高架桥：长 72m（三跨各 24m）、桥面宽 15m（双向四车道、中央 0.6m 宽混凝土分隔墩高 0.8）、箱梁厚 1.2、桥面标高 8.0、两侧 1.0m 高防撞护栏，桥墩每 24m 一排（两端和 ±12m 共四排、每排两根 1.6m 方柱带盖梁），沿 x 向首尾可连，桥上追车、桥下躲藏、坠落和跳桥", b => {
    b.slab(-36, -7.5, 36, 7.5, 8, 1.2, undefined, "floor");
    for (const s of [-1, 1]) b.wall("x", s * 7.3, -36, 36, 8, 1, .4); b.wall("x", 0, -36, 36, 8, .8, .6);
    for (const x of [-36, -12, 12, 36]) { for (const z of [-3.75, 3.75]) b.col(x, z, 0, 6.8, 1.6); b.box("struct", x, 6.4, 0, 1.8, .8, 12); }
  }, ["高架桥", "桥", "追车", "市政"]),
];

// 隧道段：用古建套件里的拱洞墙块，一个洞口加洞身；写在这里是因为它属于城市交通场景。
export const whiteTunnelDesigns: ArchitecturePrototype[] = [
  whiteAnc("白模·场地·隧道·单洞双车道·洞身段长30m", "公路隧道洞身段：外廓 16m 宽 9.0m 高 30m 长的实心体量，贯通一个 9m 宽、拱脚 3.5m、拱顶 7.0m 的半椭圆拱洞（16 段），洞内两侧各一条 1.0m 宽 0.75m 高的检修道，沿 z 贯通可首尾相连，追车、枪战、塌方和逃生；原点在平面中心，洞口朝 ±z，地面标高 0", "现代", b => {
    b.archBlock(-8, 8, 0, 9, -15, 15, 0, 4.5, 3.5, 7, 16);
    for (const s of [-1, 1]) b.box("floor", s * 4, .375, 0, 1, .75, 30);
  }, ["白模", "场地", "隧道", "追车", "市政"]),
];
