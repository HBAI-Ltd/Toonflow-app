import { CLEAR, FH, RISE, RUN, SLAB, WB, WT, door, white, win, type Op } from "./whitebox";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·屋顶与街巷：平屋顶设备层、相邻屋顶高差（可跳跃间距）、坡屋面脊线、后巷加外挂钢梯、天井院、天桥、门楼围墙、门卫亭。
// 追逐、跳跃、对峙戏最常用的室外建筑场景；全部是实体建筑体量加真实尺寸的楼梯、栏杆、女儿墙。
const spec = "原点在平面中心，+z 为正面，地面顶面标高 0（体量直接坐地），层高 3.0、女儿墙 1.0、栏杆 1.05";
const st = (name: string, what: string, build: (b: WB) => void, tags: string[], theme: "现代" | "中式" = "现代") => white(`白模·场地·${name}`, `白模预演场地建筑：${what}；${spec}`, theme, build, ["场地", ...tags]);
/** 一栋实心楼块（外墙 + 平屋面 + 女儿墙），用来拼屋顶和后巷。 */
const block = (b: WB, x0: number, z0: number, x1: number, z1: number, floors: number, ops: { front?: Op[]; back?: Op[]; left?: Op[]; right?: Op[] } = {}, parap = true) => {
  const top = floors * FH + SLAB; b.slab(x0, z0, x1, z1, SLAB);
  for (let k = 0; k < floors; k++) { const y = k * FH + SLAB; b.wall("x", z1, x0, x1, y, CLEAR, WT, ops.front); b.wall("x", z0, x0, x1, y, CLEAR, WT, ops.back); b.wall("z", x0, z0, z1, y, CLEAR, WT, ops.left); b.wall("z", x1, z0, z1, y, CLEAR, WT, ops.right); if (k) b.slab(x0, z0, x1, z1, y, SLAB); }
  b.slab(x0, z0, x1, z1, top, SLAB, undefined, "roof"); if (parap) { b.wall("x", z0 + .1, x0, x1, top, 1.0, WT); b.wall("x", z1 - .1, x0, x1, top, 1.0, WT); b.wall("z", x0 + .1, z0 + .2, z1 - .2, top, 1.0, WT); b.wall("z", x1 - .1, z0 + .2, z1 - .2, top, 1.0, WT); }
  return top;
};
/** 屋面出口小房：3m×4m 的实心墙小间，带一扇门和平顶。 */
const bulkhead = (b: WB, x0: number, z0: number, x1: number, z1: number, top: number, doorC: number) => { b.wall("x", z1, x0, x1, top, 2.8, WT, [door(doorC)]); b.wall("x", z0, x0, x1, top, 2.8, WT); b.wall("z", x0, z0, z1, top, 2.8, WT); b.wall("z", x1, z0, z1, top, 2.8, WT); b.slab(x0, z0, x1, z1, top + 3.0, SLAB, undefined, "roof"); };
const windowsRow = (n: number, from: number, step: number, w = 1.5, h = 1.5, sill = .9) => Array.from({ length: n }, (_, i) => win(from + i * step, w, h, sill));

export const whiteSiteDesigns: ArchitecturePrototype[] = [
  st("平屋顶·设备层·18m×12m·五层楼顶", "五层楼的平屋顶：18×12m、女儿墙 1.0m，楼梯间出屋面（3m×4m、带门）、水箱基座和水箱体量（2.4m 方、高 2.2m）、冷却塔基座、两个屋面设备体量（2m×1m×1.5m）、屋面检修爬梯，沿女儿墙留出 1.2m 通行带，追逐和对峙戏的屋顶平台", b => {
    const top = block(b, -9, -6, 9, 6, 5, { front: windowsRow(6, -7.5, 3), back: windowsRow(6, -7.5, 3) });
    bulkhead(b, -7.5, -5, -4.5, -1, top, -6);
    b.box("struct", 4, top + .4, 2, 2.4, .8, 2.4); b.box("equip", 4, top + 1.9, 2, 2.4, 2.2, 2.4); b.box("struct", 7, top + .2, -3, 1.6, .4, 1.6); b.box("equip", 7, top + .9, -3, 1.4, 1.0, 1.4);
    for (const [x, z] of [[0, 3.5], [-3, 3.5]] as [number, number][]) b.box("equip", x, top + .75, z, 2, 1.5, 1.0);
  }, ["屋顶", "天台", "追逐", "设备层"]),
  st("相邻屋顶·高差3m·间距2.4m·双楼", "两栋相邻楼的屋顶：左楼 5 层（屋面标高 15.2m）、右楼 6 层（屋面标高 18.2m，高差 3.0m），中间巷道 2.4m 宽，两边女儿墙 1.0m，左楼屋面有 1.2m 高设备台可作跳板，右楼屋面有出屋面楼梯间，跳跃、追逐和坠落戏", b => {
    block(b, -14, -6, -1.2, 6, 5, { front: windowsRow(4, -11, 3.5), back: windowsRow(4, -11, 3.5) }); const top2 = block(b, 1.2, -6, 12, 6, 6, { front: windowsRow(3, 4, 3.5), back: windowsRow(3, 4, 3.5) });
    b.box("equip", -3, 15.2 + .6, 0, 2, 1.2, 4); bulkhead(b, 6.5, -5, 9.5, -1, top2, 8);
  }, ["屋顶", "高差", "跳跃", "追逐"]),
  st("坡屋顶街区·三户联排·屋脊追逐", "三户联排坡屋顶住宅：每户 5m×10m、两层、30° 双坡屋面（脊线沿 z、屋脊高约 9.4m），户间山墙高出屋面 0.5m 作防火墙，每户首层一门一窗、二层两窗，屋脊和防火墙可跑可跳", b => {
    for (let i = 0; i < 3; i++) { const x0 = -7.5 + i * 5, x1 = x0 + 5; b.slab(x0, -5, x1, 5, SLAB); for (let k = 0; k < 2; k++) { const y = k * FH + SLAB; b.wall("x", 5, x0, x1, y, CLEAR, WT, k ? [win(x0 + 1.5), win(x0 + 3.5)] : [door(x0 + 1.2), win(x0 + 3.5, 1.5, 1.5)]); b.wall("x", -5, x0, x1, y, CLEAR, WT, [win(x0 + 2.5)]); b.wall("z", x0, -5, 5, y, CLEAR, WT); b.wall("z", x1, -5, 5, y, CLEAR, WT); if (k) b.slab(x0, -5, x1, 5, y, SLAB); } b.gable(x0, -5, x1, 5, 2 * FH + SLAB, 30, .4, .15, "roof", "z"); }
    for (const x of [-7.5, -2.5, 2.5, 7.5]) b.box("wall", x, 2 * FH + SLAB + .97, 0, WT, 1.94, 10.2);
  }, ["联排", "屋脊", "坡屋顶", "街区"]),
  st("后巷·外挂钢梯·两侧五层楼·巷宽3m", "城市后巷：长 18m、巷宽 3.0m，两侧是 5 层楼山墙（左侧带每层两扇窗、右侧带空调机位和阳台），右侧外挂一部直通屋面的双跑钢梯（梯宽 1.0m、每层平台 1.2m×1.0m）、地面一道 3.0×2.4m 卷帘门洞，追逐和埋伏戏的经典后巷", b => {
    for (const s of [-1, 1]) { const x0 = s < 0 ? -9 : 1.5, x1 = s < 0 ? -1.5 : 9; for (let k = 0; k < 5; k++) { const y = k * FH + SLAB; b.wall("z", s * 1.5, -9, 9, y, CLEAR, WT, s < 0 ? [win(-5), win(3), ...(k ? [] : [door(-2, 2.4, 2.4)])] : [win(-4, 1.2, 1.2, 1.0), win(4), ...(k ? [] : [door(-7, 1.2, 2.2)])]); if (k) b.slab(Math.min(s * 1.5, s * 9), -9, Math.max(s * 1.5, s * 9), 9, y, SLAB); } b.slab(x0, -9, x1, 9, SLAB); b.wall("z", s * 9, -9, 9, SLAB, 5 * FH, WT); b.wall("x", -9, x0, x1, SLAB, 5 * FH, WT); b.wall("x", 9, x0, x1, SLAB, 5 * FH, WT); }
    for (let k = 0; k < 5; k++) { const y = k * FH + SLAB, up = k % 2 === 0, dir = up ? "+z" : "-z"; b.flight(.9, up ? -1.5 : 3.54, dir, y, 18, 1.0, RISE, RUN, "struct", true); b.stairRails(.9, up ? -1.5 : 3.54, dir, y, 18, 1.0); b.slab(.4, up ? 3.0 : -2.7, 1.4, up ? 4.2 : -1.5, y + FH, .1, undefined, "struct"); }
    for (const k of [1, 3]) b.box("equip", 1.5 - .3, k * FH + SLAB + 2.4, 6.5, .6, .8, 1.0);
  }, ["后巷", "钢梯", "巷战", "追逐"]),
  st("天井院·两层环楼·12m×12m", "天井院：12×12m 外轮廓、两层环形楼、中间 4m×4m 天井（地面低 0.15m 为排水沟）、一层四面带门窗洞对向天井、二层环廊带栏杆，单侧 1.2m 宽直跑楼梯上二层，屋面平顶带 4m×4m 天井口，古装和民国院落戏", b => {
    const y2 = FH + SLAB;
    b.slab(-6, -6, 6, 6, SLAB, SLAB, [-2, -2, 2, 2]); b.slab(-6, -6, 6, 6, y2, SLAB, [[-2, -2, 2, 2], [3.9, -4.5, 5.1, .54]]);
    for (const k of [0, 1]) { const y = k * FH + SLAB; b.wall("x", 6, -6, 6, y, CLEAR, WT, k ? windowsRow(3, -3, 3) : [door(0, 1.2, 2.1), win(-3.5), win(3.5)]); b.wall("x", -6, -6, 6, y, CLEAR, WT, windowsRow(3, -3, 3)); for (const s of [-1, 1]) b.wall("z", s * 6, -6, 6, y, CLEAR, WT, windowsRow(2, -2, 4)); }
    for (const s of [-1, 1]) { b.wall("x", s * 2, -2, 2, SLAB, CLEAR, WT, [door(0, 1.0, 2.1)]); b.wall("z", s * 2, -2, 2, SLAB, CLEAR, WT, [door(0, 1.0, 2.1)]); }
    b.rail(-2, 2, 2, 2, y2); b.rail(-2, -2, 2, -2, y2); b.rail(-2, -2, -2, 2, y2); b.rail(2, -2, 2, 2, y2); b.flight(4.5, -4.5, "+z", SLAB, 18, 1.2); b.slab(-6, -6, 6, 6, 2 * FH + SLAB, SLAB, [-2, -2, 2, 2], "roof");
  }, ["天井", "院落", "环楼"], "中式"),
  st("人行天桥·跨度18m·宽3m·两侧梯道", "城市人行天桥：主跨 18m、桥面宽 3.0m、桥面标高 5.5m（净空 5.2m）、两侧 1.05m 高栏杆，两端各一段 1.8m 宽、26 级的直跑梯道（梯高 0.1625、宽 0.28）和两根 0.8m 方墩，适合追逐、坠落和监控镜头", b => {
    b.slab(-9, -1.5, 9, 1.5, 5.5, .5, undefined, "floor"); b.rail(-9, -1.5, 9, -1.5, 5.5); b.rail(-9, 1.5, 9, 1.5, 5.5); for (const x of [-7, 7]) b.col(x, 0, 0, 5.0, .8);
    for (const s of [-1, 1]) { const x0 = s < 0 ? -16.28 : 16.28, dir = s < 0 ? "+x" : "-x"; b.flight(x0, 0, dir, 0, 26, 1.8, 5.5 / 26, .28); b.stairRails(x0, 0, dir, 0, 26, 1.8, [-1, 1], 5.5 / 26, .28); }
  }, ["天桥", "桥", "市政"]),
  st("门楼围墙·大门·岗亭·25m", "单位门楼和围墙：25m 长、2.4m 高围墙（带砖柱每 3m 一根）、中间 6m 宽车行大门洞和两侧各 1.0m 人行门洞、上有 3.0m 高的门楼横梁（雨棚 0.3m 厚、悬挑 1.2m）、门内右侧 3m×3m 门卫亭（带窗和门），适合工厂、学校、机关大门", b => {
    b.wall("x", 0, -12.5, 12.5, 0, 2.4, .3, [door(0, 6.0, 2.4), door(-4.3, 1.0, 2.1), door(4.3, 1.0, 2.1)]); for (let x = -12; x <= 12.1; x += 3) b.col(x, 0, 0, 2.8, .5, "wall");
    b.box("wall", -3.5, 1.75, 0, .6, 3.5, .6); b.box("wall", 3.5, 1.75, 0, .6, 3.5, .6); b.slab(-4, -.6, 4, .6, 3.5, .3, undefined, "roof"); b.box("roof", 0, 3.6, 1.0, 8.4, .3, 1.2);
    b.slab(5.5, -4.5, 8.5, -1.5, SLAB); b.wall("x", -1.5, 5.5, 8.5, SLAB, CLEAR, WT, [win(7, 1.5, 1.2, .9)]); b.wall("x", -4.5, 5.5, 8.5, SLAB, CLEAR, WT, [door(7)]); b.wall("z", 5.5, -4.5, -1.5, SLAB, CLEAR, WT, [win(-3, 1.2, 1.2, .9)]); b.wall("z", 8.5, -4.5, -1.5, SLAB, CLEAR, WT); b.slab(5.4, -4.6, 8.6, -1.4, 3.0, SLAB, undefined, "roof");
  }, ["大门", "围墙", "门卫", "门楼"]),
];

