import type { P } from "./ruinKit";
import { CLEAR, DEG, FH, SLAB, WT, door, win } from "./whitebox";
import { whiteAnc, type AB } from "./whiteboxAncientKit";
import { cone, ringSlab, ringWall } from "./whiteboxRegional";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·地下与隧道空间：下水道主管和交汇井室、矿道、地铁区间双线隧道、防空洞、地牢、酒窖、地下水宫。
// 模型最低点固定在 y=0，所以这些「地下」空间都做成地面以上的实体体量（空腔、通道、步道和台阶都是真的），放进场景时周围的土石由场景负责。
/** 圆管：内半径 ri、壁厚 t、管心离地 cy，沿 axis（z 或 x）从 a 到 c，横向位置 cx；arc 只画一段弧（从顶向两侧的角度，默认整圈）。 */
export function pipe(b: AB, key: string, ri: number, t: number, cy: number, a: number, c: number, N: number, o: { axis?: "z" | "x"; cx?: number; arc?: [number, number] } = {}) {
  const ro = ri + t, [p0, p1] = o.arc ?? [0, 360], st = (p1 - p0) / N, ox = o.cx ?? 0;
  const Q = (rho: number, phi: number, w: number): P => { const u = rho * Math.sin(phi * DEG), v = cy + rho * Math.cos(phi * DEG); return o.axis === "x" ? [w, v, ox + u] : [ox + u, v, w]; };
  for (let i = 0; i < N; i++) {
    const f0 = p0 + i * st, f1 = f0 + st, fm = (f0 + f1) / 2, rad: P = o.axis === "x" ? [0, Math.cos(fm * DEG), Math.sin(fm * DEG)] : [Math.sin(fm * DEG), Math.cos(fm * DEG), 0];
    b.quad4(key, Q(ro, f0, a), Q(ro, f1, a), Q(ro, f1, c), Q(ro, f0, c), rad); b.quad4(key, Q(ri, f0, a), Q(ri, f1, a), Q(ri, f1, c), Q(ri, f0, c), [-rad[0], -rad[1], -rad[2]]);
    for (const [w, n] of [[a, -1], [c, 1]] as [number, number][]) b.quad4(key, Q(ri, f0, w), Q(ro, f0, w), Q(ro, f1, w), Q(ri, f1, w), o.axis === "x" ? [n, 0, 0] : [0, 0, n]);
  }
}
const mk = (name: string, what: string, build: (b: AB) => void, tags: string[]) => whiteAnc(`白模·地下·${name}`, `白模预演地下与隧道空间：${what}；原点在平面中心，+z 为入口一侧，空间底面 y=0（周围土石由场景负责）`, "现代", build, ["地下", "隧道", ...tags]);

export const whiteUndergroundDesigns: ArchitecturePrototype[] = [
  mk("下水道·圆形主管·内径4.4m·步道·长30m", "城市下水道主管：内径 4.4m、壁厚 0.4、长 30m 的圆管（24 面，管底外缘贴地），管内两侧各一条 1.0m 宽 0.6m 高的检修步道、中间 1.1m 宽的污水渠，沿 z 首尾可接，追逐、逃亡、怪物和犯罪戏", b => {
    b.group("water", "污水", "#5f7f6a", { roughness: .2, opacity: .85 });
    pipe(b, "wall", 2.2, .4, 2.6, -15, 15, 24); for (const s of [-1, 1]) b.box("floor", s * 1.05, .7, 0, 1, .6, 30); b.box("water", 0, .5, 0, 1.1, .1, 30);
  }, ["下水道", "管道", "逃亡"]),

  mk("下水道·交汇井室·三向管口·检修竖井·高12m", "下水道交汇井室：内径 8m 高 5.4m 的圆形井室（24 段、壁厚 0.8、三个方向各留 5 段宽的管口：+z、+x、-z）、15° 锥形穹顶收到 1.2m 的井口、顶上直径 2.0m 高 7m 的检修竖井（带每 0.3m 一档的爬梯和 0.2 厚的井盖），三向各一段 6m 长内径 4.4m 的下水道主管，井室里一圈 1.0m 宽的步道和中央 2.4m 的污水池，下水道追逐、汇合和怪物巢穴戏", b => {
    b.group("water", "污水", "#5f7f6a", { roughness: .2, opacity: .85 });
    const op = (c: number, i: number) => Math.min((i - c + 24) % 24, (c - i + 24) % 24) <= 2;
    ringWall(b, "wall", 4.4, .8, 0, 5.4, 24, i => op(0, i) || op(6, i) || op(12, i) ? null : undefined); ringSlab(b, "floor", 2.4, 4.4, .6, .6, 24); ringSlab(b, "water", 0, 2.4, .4, .08, 24);
    cone(b, "wall", 4.8, 5.4, 1.2, 7.4, 24, .4); ringWall(b, "wall", 1.2, .4, 7.2, 14, 12); b.cyl("equip", 0, 0, 14, 14.2, 1.3, 12);
    for (let y = 8; y < 14; y += .3) b.box("rail", 0, y, -.95, .5, .04, .05);
    pipe(b, "wall", 2.2, .4, 2.6, 4.4, 10.4, 24); pipe(b, "wall", 2.2, .4, 2.6, -10.4, -4.4, 24); pipe(b, "wall", 2.2, .4, 2.6, 4.4, 10.4, 24, { axis: "x" });
  }, ["下水道", "井室", "竖井", "怪物"]),

  mk("矿道·木支架巷道·宽3.2m高3.0m·长30m", "矿山巷道：岩体 8m×5m×30m 中贯通一条宽 3.2m 拱顶 3.0m 的巷道（半椭圆拱 8 段），每 1.5m 一架木支架（两根 0.25m 方立柱加一根 0.3m 厚的顶梁，共 21 架），地面一条轨距 1.0m 的矿车轨道（钢轨 0.06m、枕木每 0.8m 一根），沿 z 首尾可接，矿难、探险、淘金和末日地下戏", b => {
    b.group("track", "轨道", "#6a6f75", { roughness: .6, metalness: .4 }); b.archBlock(-4, 4, 0, 5, -15, 15, 0, 1.6, 1.8, 3, 8);
    for (let z = -15; z <= 15.1; z += 1.5) { for (const s of [-1, 1]) b.box("struct", s * 1.45, 1.05, z, .25, 2.1, .25); b.box("struct", 0, 2.15, z, 3.5, .3, .25); }
    for (const s of [-1, 1]) b.box("track", s * .5, .1, 0, .06, .08, 30); for (let z = -14.6; z <= 14.7; z += .8) b.box("struct", 0, .04, z, 1.4, .08, .14);
  }, ["矿道", "矿井", "矿难", "地下"]),

  mk("地铁区间·双线圆形盾构隧道·内径5.6m·长30m", "地铁区间隧道：两条内径 5.6m、壁厚 0.35、长 30m 的圆形盾构隧道并排（中心距 6.4m、32 面），每条隧道里两根轨距 1.435m 的钢轨（0.07m 宽）加每 1.0m 一根的短枕木、一侧一条 0.8m 宽 0.65m 高的检修步道，沿 z 首尾可接，追逐、跳车、灾难和地下对峙戏", b => {
    b.group("track", "轨道", "#6a6f75", { roughness: .6, metalness: .4 });
    for (const s of [-1, 1]) {
      const cx = s * 3.2; pipe(b, "wall", 2.8, .35, 3.15, -15, 15, 32, { cx });
      b.box("floor", cx + s * 1.4, .65, 0, .8, .6, 30); for (const r of [-.72, .72]) b.box("track", cx + r - s * .3, .6, 0, .07, .15, 30); for (let z = -14.5; z <= 14.6; z += 1) b.box("struct", cx - s * .3, .42, z, 2.2, .1, .22);
    }
  }, ["地铁", "隧道", "盾构", "跳车"]),

  mk("防空洞·混凝土通道·三间掩体·防爆门·26m", "防空洞：混凝土结构 12m×26m×3.6m（墙厚 0.6、顶板厚 0.5），中间 3m 宽的通道长 24m，西侧三间 4m×4m 的掩体（各一道 1.0m×2.0m 的门），+z 端入口一道 0.8m 厚的防爆门框（1.2m×2.0m 门洞），-z 端封闭，屋顶一个 1.2m 见方的通风井，战争、躲避、末日和冷战戏", b => {
    b.slab(-6, -13, 6, 13, SLAB, SLAB); b.wall("x", 13, -6, 6, SLAB, 3, .8, [door(0, 1.2, 2)]); b.wall("x", -13, -6, 6, SLAB, 3, .6); for (const x of [-6, 6]) b.wall("z", x, -13, 13, SLAB, 3, .6);
    b.wall("z", -1.8, -12, 12, SLAB, 3, .5, [-9.5, -4.5, .5].map(c => door(c, 1, 2))); for (const z of [-7.5, -2.5]) b.wall("x", z, -5.7, -1.8, SLAB, 3, .3);
    b.slab(-6.3, -13.3, 6.3, 13.3, 3.7, .5, undefined, "roof"); b.box("equip", 3, 4.3, 2, 1.2, 1.2, 1.2);
  }, ["防空洞", "掩体", "战争", "冷战"]),

  mk("地牢·石砌牢房·六间·刑讯室·楼梯·34m", "地牢：石墙 14m×34m×3.4m（墙厚 0.6、顶板厚 0.4），中间 3m 宽的走廊（牢房段长 12m，入口一侧接 14m×14m 的看守前厅），走廊两侧各三间 5.2m×4m 的牢房（走廊一侧是 2.4m 高的铁栅、每间一个 0.9m 宽的栅门），走廊 -z 尽头一间 14m×7.5m 的刑讯室（一扇 1.2m 门），+z 入口一部 1.2m 宽 18 级的石阶通向地面层平台，中世纪、监禁、审讯和奇幻地下戏", b => {
    b.slab(-7, -17, 7, 17, SLAB, SLAB); b.wall("x", 17, -7, 7, SLAB, 3.2, .6, [door(0, 1.4, 2.4)]); b.wall("x", -17, -7, 7, SLAB, 3.2, .6); for (const x of [-7, 7]) b.wall("z", x, -17, 17, SLAB, 3.2, .6);
    for (const s of [-1, 1]) { b.bars("z", s * 1.5, -9.2, 2.8, SLAB, 2.4, [[-7.65, -6.75], [-3.65, -2.75], [.35, 1.25]]); for (const z of [-9.2, -5.2, -1.2, 2.8]) b.wall("x", z, s < 0 ? -6.7 : 1.5, s < 0 ? -1.5 : 6.7, SLAB, 3.2, .3); }
    b.wall("x", -9.5, -7, 7, SLAB, 3.2, .4, [door(0, 1.2, 2.4)]);
    b.slab(-7.3, -17.3, 7.3, 17.3, 3.6, .4, undefined, "roof"); b.flight(5, 21, "-z", .2, 18, 1.2, FH / 18, .28);
  }, ["地牢", "监禁", "中世纪", "审讯"]),

  mk("酒窖·砖拱顶·宽5m长24m", "砖砌拱顶酒窖：岩体 8m×6.5m×24m 中一条宽 5.0m 的拱顶巷（拱脚 2.2、拱顶 4.5 的半椭圆、12 段），-z 尽头封墙，+z 入口敞开，两侧靠墙各一排 1.0m 宽 1.6m 高的酒架台座（每 2.0m 一座），欧洲古堡、私酿、密室和恐怖戏", b => {
    b.archBlock(-4, 4, 0, 6.5, -12, 12, 0, 2.5, 2.2, 4.5, 12); b.box("wall", 0, 2.25, -11.8, 5, 4.5, .4);
    for (const s of [-1, 1]) for (let z = -10; z <= 10.1; z += 2) b.box("struct", s * 2.0, .8, z, 1, 1.6, 1.6);
  }, ["酒窖", "地窖", "古堡", "密室"]),

  mk("地下水宫·柱厅·五列十行·蓄水池·30m×50m", "地下蓄水池柱厅：石墙厚 1.0 的 30m×50m 大厅，5 列 10 行共 50 根径 1.0 高 8.0 的圆柱（柱距 4.8m）撑起 0.6 厚的屋面板，地面一层水面（水深约 0.4）、-x 侧一条 2.4m 宽 0.8m 高的石砌步道，屋面板留一个 1.4m×1.4m 的检修口加一架 8m 高的铁爬梯，君士坦丁堡、地下密谋、追逐和惊悚戏", b => {
    b.group("water", "水面", "#4f7f8a", { roughness: .1, opacity: .85 }); b.box("water", 1.25, .35, 0, 25.5, .1, 48);
    b.slab(-14, -24, 14, 24, .3, .3); b.box("floor", -12.7, .55, 0, 2.4, .5, 48);
    b.slab(-15, -25, 15, 25, 8.9, .6, [[-14, -22.7, -12.6, -21.3]], "roof");
    for (let i = 0; i < 5; i++) for (let j = 0; j < 10; j++) b.cyl("struct", -9.6 + i * 4.8, -21.6 + j * 4.8, .3, 8.6, .5, 8);
    b.wall("x", -24.5, -15, 15, 0, 8.9, 1); b.wall("x", 24.5, -15, 15, 0, 8.9, 1, [door(-13, 2.4, 3)]); b.steps(-12.7, 24, "+z", 2.4, .8); for (const z of [-9.6, 9.6]) b.steps(z, -11.5, "+x", 2.4, .8); for (const x of [-14.5, 14.5]) b.wall("z", x, -24, 24, 0, 8.9, 1);
    for (let y = .8; y < 8.7; y += .3) b.box("rail", -13.3, y, -22, .6, .04, .05); for (const x of [-13.6, -13]) b.box("rail", x, 4.5, -22, .05, 8, .05);
  }, ["水宫", "蓄水池", "柱厅", "密谋"]),
];

void CLEAR; void WT; void win;
