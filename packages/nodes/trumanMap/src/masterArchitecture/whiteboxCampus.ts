import { CLEAR, DEG, FH, SLAB, WT, door, win, type Op } from "./whitebox";
import { parapet } from "./whiteboxBuildings";
import { facade } from "./whiteboxCity";
import { whiteAnc, type AB } from "./whiteboxAncientKit";
import { fenceRun } from "./whiteboxCompounds";
import { cone, ringSlab } from "./whiteboxRegional";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·现代院区：校园、医院院区、住宅小区、厂区、军营、农场。每个院区是十来栋楼加围墙、院门、旗杆等，按真实院区的楼距和楼间距摆好，
// 每栋楼是带楼板、真实洞口外墙和平屋面（或坡屋面）的实体外壳，主楼带一部双跑楼梯，其余楼只做外壳（层层楼板、外墙窗洞，不含室内隔墙）。
const tan = (d: number) => Math.tan(d * DEG);
type Mass = { x0: number; z0: number; x1: number; z1: number; floors: number; pitch?: number; door?: "+z" | "-z" | "+x" | "-x"; roof?: "flat" | "gable"; gpitch?: number; stair?: boolean; winW?: number };
/** 一栋楼：每层楼板、四面带窗洞的外墙（窗距 pitch）、一面带门、平屋面带女儿墙（或双坡屋面）；stair 为真时靠后墙加一部双跑楼梯和楼板洞口。 */
export function mass(b: AB, m: Mass) {
  const { x0, z0, x1, z1 } = m, W = x1 - x0, D = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, p = m.pitch ?? 4.5, ww = m.winW ?? 2.4, door0 = m.door ?? "+z", scz = z0 + 3.2;
  const wins = (len: number, mid: number): number[] => { const n = Math.max(1, Math.floor(len / p)); return Array.from({ length: n }, (_, i) => mid - len / 2 + (i + .5) * len / n); };
  const opsFor = (side: "+z" | "-z" | "+x" | "-x", k: number): Op[] => {
    const alongX = side.endsWith("z"), len = alongX ? W : D, mid = alongX ? cx : cz, cs = wins(len, mid);
    return side === door0 && k === 0 ? [door(mid, 1.8, 2.4), ...cs.filter(c => Math.abs(c - mid) > 2.4).map(c => win(c, ww, 1.5, .9))] : cs.map(c => win(c, ww, 1.5, .9));
  };
  for (let k = 0; k <= m.floors; k++) {
    const y = k * FH + SLAB;
    b.slab(x0, z0, x1, z1, y, SLAB, m.stair && k > 0 && k < m.floors ? [b.coreRect(cx, scz, {}, -2.9, .92, 1.4)] : undefined, k === m.floors ? "roof" : "floor");
    if (k === m.floors) { if (m.roof === "gable") b.roofGable(x0, z0, x1, z1, y, m.gpitch ?? 25, .6, .4, W >= D ? "x" : "z"); else parapet(b, x0, z0, x1, z1, y); break; }
    facade(b, "x", z1, x0, x1, y, CLEAR, WT, opsFor("+z", k)); facade(b, "x", z0, x0, x1, y, CLEAR, WT, opsFor("-z", k)); facade(b, "z", x0, z0, z1, y, CLEAR, WT, opsFor("-x", k)); facade(b, "z", x1, z0, z1, y, CLEAR, WT, opsFor("+x", k));
    if (m.stair && k < m.floors) b.doglegCore(cx, scz, y, { back: false, window: false });
  }
}
/** 厂房外壳：单层高墙（净高 h）、屋面双坡或锯齿、正面 n 个大门、各面高窗。 */
export function shed(b: AB, x0: number, z0: number, x1: number, z1: number, h: number, o: { roof?: "gable" | "saw"; pitch?: number; doors?: number; doorW?: number } = {}) {
  const W = x1 - x0, D = z1 - z0, n = o.doors ?? 1, dw = o.doorW ?? 4, hi = Math.max(2.6, h - 2.4);
  b.slab(x0, z0, x1, z1, .3, .3);
  const hw = (len: number, from: number) => Array.from({ length: Math.max(1, Math.floor(len / 6)) }, (_, i) => from + (i + .5) * len / Math.max(1, Math.floor(len / 6))).map(c => win(c, 2, 1.4, hi));
  facade(b, "x", z1, x0, x1, .3, h, .3, [...Array.from({ length: n }, (_, i) => door(x0 + (i + .5) * W / n, dw, 4.2)), ...hw(W, x0).filter(c => !Array.from({ length: n }, (_, i) => x0 + (i + .5) * W / n).some(d => Math.abs(d - c.c) < dw / 2 + 1.2))]);
  facade(b, "x", z0, x0, x1, .3, h, .3, hw(W, x0)); facade(b, "z", x0, z0, z1, .3, h, .3, hw(D, z0)); facade(b, "z", x1, z0, z1, .3, h, .3, hw(D, z0));
  if (o.roof === "saw") b.sawtooth(x0, z0, x1, z1, .3 + h, Math.max(2, Math.round(D / 6)), 20); else b.roofGable(x0, z0, x1, z1, .3 + h, o.pitch ?? 12, .5, .3, W >= D ? "x" : "z");
}
const mk = (name: string, what: string, build: (b: AB) => void, tags: string[]) => whiteAnc(`白模·院区·${name}`, `白模预演现代院区：${what}；原点在院区中心，+z 为正面（院门一侧），地面标高 0`, "现代", build, ["院区", "建筑群", ...tags]);

export const whiteCampusDesigns: ArchitecturePrototype[] = [
  mk("校园·校门教学楼图书馆食堂宿舍操场·110m×84m", "中小学校园：围墙 110m×84m 厚 0.3 高 2.4（正面 10m 宽的校门洞、门柱 1.2m 见方高 5m 两根、传达室一间），门内旗杆一根（高 12m），自 +z 向 -z：两栋三层教学楼（各 40m×12m、每层窗距 4.5m、带楼梯间，正面朝校门）、两层图书馆（24m×18m）、单层坡顶食堂（28m×16m）、四层宿舍楼（30m×10m），院后一个椭圆煤渣跑道（外缘 60m×18m、红色），青春、校园、悬疑和成长戏", b => {
    b.group("track", "跑道", "#b5503a", { roughness: .95 });
    mass(b, { x0: -45, z0: 8, x1: -5, z1: 20, floors: 3, stair: true }); mass(b, { x0: 5, z0: 8, x1: 45, z1: 20, floors: 3, stair: true });
    mass(b, { x0: -12, z0: -20, x1: 12, z1: -2, floors: 2 }); mass(b, { x0: -52, z0: -26, x1: -24, z1: -10, floors: 1, roof: "gable", door: "+x" }); mass(b, { x0: 22, z0: -30, x1: 52, z1: -20, floors: 4, door: "-x" }); mass(b, { x0: -14, z0: 32, x1: -8, z1: 37, floors: 1 });
    for (const x of [-5, 5]) b.box("struct", x, 2.5, 40, 1.2, 5, 1.2); b.cyl("struct", 0, 26, 0, 12, .12, 8); b.box("base", 0, .3, 26, 3, .6, 3);
    ringSlab(b, "track", 20, 24, .06, .06, 48, [0, -34], { sc: [1.25, .38] });
    fenceRun(b, -55, 40, -5, 40, 2.4, .3); fenceRun(b, 5, 40, 55, 40, 2.4, .3); fenceRun(b, -55, -42, 55, -42, 2.4, .3); for (const x of [-55, 55]) fenceRun(b, x, -42, x, 40, 2.4, .3);
  }, ["校园", "学校", "青春", "教学楼"]),

  mk("医院院区·门诊急诊住院医技·110m×66m", "综合医院院区：围墙 110m×66m 厚 0.4 高 2.4（正面 12m 宽的大门），门诊楼（四层 54m×16m、门口 12m×6m 的雨棚）、住院楼（八层 42m×14m、与门诊楼用 6m 宽的二层连廊相连）、急诊楼（单层 20m×14m、救护车雨棚 12m×6m）、医技楼（三层 20m×20m）、太平间（单层 10m×10m），门诊楼和住院楼各带楼梯间，医疗、悬疑、末日和现代都市戏", b => {
    mass(b, { x0: -27, z0: 4, x1: 27, z1: 20, floors: 4, stair: true, pitch: 4.5 }); b.slab(-6, 20, 6, 26, 3.4, .2, undefined, "roof"); for (const x of [-5.6, 5.6]) b.col(x, 25.6, SLAB, 3.4, .3);
    mass(b, { x0: -21, z0: -26, x1: 21, z1: -12, floors: 8, stair: true }); b.slab(-3, -12, 3, 4, 2 * FH + SLAB, .3, undefined, "floor"); b.slab(-3, -12, 3, 4, 3 * FH + .1, .15, undefined, "roof");
    mass(b, { x0: -50, z0: 4, x1: -30, z1: 18, floors: 1, door: "+z" }); b.slab(-48, 18, -36, 24, 3.4, .2, undefined, "roof"); for (const x of [-47.6, -36.4]) b.col(x, 23.6, SLAB, 3.4, .3);
    mass(b, { x0: 32, z0: -8, x1: 52, z1: 12, floors: 3, door: "-x" }); mass(b, { x0: 38, z0: -30, x1: 48, z1: -20, floors: 1, door: "-x" });
    fenceRun(b, -55, 32, -6, 32, 2.4, .4); fenceRun(b, 6, 32, 55, 32, 2.4, .4); fenceRun(b, -55, -34, 55, -34, 2.4, .4); for (const x of [-55, 55]) fenceRun(b, x, -34, x, 32, 2.4, .4);
  }, ["医院", "院区", "门诊", "急诊"]),

  mk("住宅小区·六栋板楼·会所·门岗·124m×80m", "住宅小区：围墙 124m×80m 厚 0.3 高 2.0（正面 12m 宽的小区大门、两侧各一间 3m×3m 的门岗），六栋五层板楼（各 36m×12m、两排三列、窗距 4.5m、南向，每栋只做楼板和窗洞外壳、不含楼梯间）和一栋两层会所（24m×14m），楼距 20m，都市生活、邻里、悬疑和家庭戏", b => {
    for (const [x0, x1] of [[-58, -22], [-18, 18], [22, 58]] as [number, number][]) for (const [z0, z1] of [[-30, -18], [0, 12]] as [number, number][]) mass(b, { x0, z0, x1, z1, floors: 5, pitch: 6 });
    mass(b, { x0: -12, z0: 24, x1: 12, z1: 38, floors: 2 }); for (const x of [-9, 9]) mass(b, { x0: x - 1.5, z0: 40.4, x1: x + 1.5, z1: 43.4, floors: 1, door: x < 0 ? "+x" : "-x" });
    fenceRun(b, -62, 44, -8, 44, 2, .3); fenceRun(b, 8, 44, 62, 44, 2, .3); fenceRun(b, -62, -36, 62, -36, 2, .3); for (const x of [-62, 62]) fenceRun(b, x, -36, x, 44, 2, .3);
  }, ["小区", "住宅", "邻里", "家庭"]),

  mk("厂区·车间锯齿屋面·办公楼·烟囱·仓库·门房·110m×70m", "工厂厂区：围墙 110m×70m 厚 0.4 高 2.8（正面 8m 宽的厂门、门房一间），两座单层车间（36m×18m 净高 8、一座双坡一座锯齿屋面、每座两个 4m 宽的大门）、三层办公楼（30m×12m 带楼梯间）、仓库（24m×14m 净高 6、一个 5m 大门）、一座高 45m 的砖烟囱（底径 4.8 顶径 2.6），工业、劳资、罢工和工厂犯罪戏", b => {
    shed(b, -50, -12, -14, 6, 8, { roof: "gable", doors: 2 }); shed(b, -50, -34, -14, -16, 8, { roof: "saw", doors: 2 }); mass(b, { x0: -10, z0: 10, x1: 20, z1: 22, floors: 3, stair: true });
    shed(b, 8, -26, 32, -12, 6, { roof: "gable", doors: 1, doorW: 5 }); b.base(33, -3, 39, 3, .8); cone(b, "wall", 2.4, .8, 1.3, 45, 16, .35, [36, 0]);
    mass(b, { x0: 5, z0: 29.5, x1: 11, z1: 34.5, floors: 1, door: "-x" }); fenceRun(b, -55, 35, -4, 35, 2.8, .4); fenceRun(b, 4, 35, 55, 35, 2.8, .4); fenceRun(b, -55, -35, 55, -35, 2.8, .4); for (const x of [-55, 55]) fenceRun(b, x, -35, x, 35, 2.8, .4);
  }, ["厂区", "工厂", "车间", "罢工"]),

  mk("军营·营房指挥楼车库操场哨塔·120m×80m", "军营：围墙 120m×80m 厚 0.4 高 3.0（正面 10m 宽的营门、门岗一间、四角四座 6m 高的木哨塔），四栋两层营房（40m×10m、窗距 4.5m）、三层指挥楼（24m×12m 带楼梯间）、车库（36m×16m 四个 4m 大门）、旗杆一根（高 14m）、椭圆跑道（外缘 40m×14m），战争、军旅、训练和军事基地戏", b => {
    b.group("track", "跑道", "#b5503a", { roughness: .95 });
    for (const [x0, z0] of [[-52, -32], [-52, -16], [12, -32], [12, -16]] as [number, number][]) mass(b, { x0, z0, x1: x0 + 40, z1: z0 + 10, floors: 2, door: "+z" });
    mass(b, { x0: -12, z0: 8, x1: 12, z1: 20, floors: 3, stair: true }); shed(b, -52, 10, -16, 26, 5, { roof: "gable", doors: 4 });
    b.cyl("struct", 0, 28, 0, 14, .14, 8); b.box("base", 0, .3, 28, 3, .6, 3); ringSlab(b, "track", 14, 17, .06, .06, 36, [36, 20], { sc: [1.4, .5] });
    mass(b, { x0: 8, z0: 35.4, x1: 14, z1: 39.4, floors: 1, door: "-z" });
    for (const [x, z] of [[-58, -38], [58, -38], [-58, 38], [58, 38]] as [number, number][]) { for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.strut("struct", [x + sx * 1.6, 0, z + sz * 1.6], [x + sx * 1.3, 6, z + sz * 1.3], .26, .26); b.slab(x - 1.7, z - 1.7, x + 1.7, z + 1.7, 6.2, .2, undefined, "floor"); b.wall("x", z + 1.6, x - 1.6, x + 1.6, 6.2, 2.2, .1, [win(x, 2, 1, 1)]); b.wall("x", z - 1.6, x - 1.6, x + 1.6, 6.2, 2.2, .1); for (const sx of [-1, 1]) b.wall("z", x + sx * 1.6, z - 1.6, z + 1.6, 6.2, 2.2, .1); b.hip(x - 1.7, z - 1.7, x + 1.7, z + 1.7, 8.4, 28, .7, .1); }
    fenceRun(b, -60, 40, -5, 40, 3, .4); fenceRun(b, 5, 40, 60, 40, 3, .4); fenceRun(b, -60, -40, 60, -40, 3, .4); for (const x of [-60, 60]) fenceRun(b, x, -40, x, 40, 3, .4);
  }, ["军营", "营房", "军旅", "训练"]),

  mk("农场·农舍谷仓马厩筒仓围栏·90m×56m", "农场牧场：一栋两层农舍（14m×9m、25° 双坡屋面带门廊 3m 深）、谷仓（20m×14m 墙高 6、两个 4m 宽 4.5m 高的大门、22° 双坡屋面）、马厩（24m×8m 单层 六个 1.2m 马栏门）、两座径 6.4 高 16 的筒仓（顶带浅锥顶），牧场四周一圈 1.3m 高的木围栏（立柱每 3m 一根、上下两道横栏、正面留 6m 宽的入口），美国乡村、西部、牧场和恐怖戏", b => {
    mass(b, { x0: -14, z0: 2, x1: 2, z1: 11, floors: 2, roof: "gable", gpitch: 25 }); b.slab(-9, 11, -3, 14, .3, .2, undefined, "floor"); for (const x of [-8.6, -3.4]) b.col(x, 13.6, .3, 3, .2); b.slab(-9.4, 11, -2.6, 14.4, 3.1, .15, undefined, "roof");
    shed(b, 10, -12, 30, 2, 6, { roof: "gable", pitch: 22, doors: 2, doorW: 4 }); shed(b, -30, -12, -6, -4, 3.2, { roof: "gable", pitch: 20, doors: 6, doorW: 1.2 });
    for (const z of [-2, 9]) { b.cyl("wall", 38, z, 0, 16, 3.2, 16); cone(b, "roof", 3.4, 16, 0, 18, 16, .15, [38, z]); }
    for (let x = -45; x <= 45.1; x += 3) for (const z of [-28, 28]) b.col(x, z, 0, 1.3, .12, "rail"); for (let z = -28; z <= 28.1; z += 3) for (const x of [-45, 45]) b.col(x, z, 0, 1.3, .12, "rail");
    for (const y of [.5, 1.1]) { b.beamH("x", -28, -45, 45, y + .05, .06, .08, "rail"); b.beamH("z", -45, -28, 28, y + .05, .06, .08, "rail"); b.beamH("z", 45, -28, 28, y + .05, .06, .08, "rail"); b.beamH("x", 28, -45, -3, y + .05, .06, .08, "rail"); b.beamH("x", 28, 3, 45, y + .05, .06, .08, "rail"); }
  }, ["农场", "牧场", "谷仓", "乡村"]),
];

void tan;
