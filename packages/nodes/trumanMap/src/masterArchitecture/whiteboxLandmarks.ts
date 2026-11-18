import type { AssetTheme } from "../sceneDocument";
import type { P } from "./ruinKit";
import { CLEAR, DEG, FH, SLAB, WB, WT, door, win, type Op } from "./whitebox";
import { parapet } from "./whiteboxBuildings";
import { facade } from "./whiteboxCity";
import { whiteAnc, type AB } from "./whiteboxAncientKit";
import { cone, ringSlab, ringWall } from "./whiteboxRegional";
import { prismoid } from "./whiteboxWorld";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·别墅与特色建筑、科幻舱室模块：现代别墅、民国洋房、清真寺、灯塔、荷兰风车、机场塔台，以及科幻舱廊（直段、隔舱门、L、T、气闸舱）、圆形指挥舱和货舱。
const tan = (d: number) => Math.tan(d * DEG);
const mk = (cat: string, theme: AssetTheme) => (name: string, what: string, build: (b: AB) => void, tags: string[]) => whiteAnc(`白模·${cat}·${name}`, `白模预演${cat}建筑：${what}；原点在平面中心，+z 为正面，地面标高 0`, theme, build, [cat, ...tags]);
const vi = mk("住宅", "现代"), rel = mk("宗教", "异域"), lm = mk("地标", "现代");

const stack = (b: AB, key: string, yb: number, R: number, steps: number, N: number, o: [number, number] = [0, 0], t = .2) => { for (let i = 0; i < steps; i++) { const a0 = 90 * i / steps, a1 = 90 * (i + 1) / steps; cone(b, key, R * Math.cos(a0 * DEG), yb + R * Math.sin(a0 * DEG), R * Math.cos(a1 * DEG), yb + R * Math.sin(a1 * DEG), N, t, o); } };

export const whiteLandmarkDesigns: ArchitecturePrototype[] = [
  vi("现代别墅·两层·双车库·大玻璃客厅", "现代别墅：主楼 18m×10m 两层（层高 3.0、平屋面外挑 0.8 带 1.0m 女儿墙）、首层正面 8m 宽的落地玻璃客厅加一扇 1.2m 门和一扇 2.4m 窗、二层大窗，后部贴墙 3m×6m 双跑楼梯间，+x 接 7m×7m 的单层双车库（5.0m 宽 2.4m 高的车库门、与主楼相通），正面 15m×4m 的 0.45m 高木平台带栏杆和三级台阶、门口 3m×2.2m 的雨棚加两根立柱，悬疑、家庭、豪宅和入室戏", b => {
    const y1 = FH + SLAB, y2 = 2 * FH + SLAB;
    b.slab(-9, -5, 9, 5, SLAB, SLAB); b.slab(-9, -5, 9, 5, y1, SLAB, [b.coreRect(2, -2, {}, -2.9, .92, 1.4)]); b.slab(-9.8, -5.8, 9.8, 5.8, y2, SLAB, undefined, "roof"); parapet(b, -9.8, -5.8, 9.8, 5.8, y2);
    facade(b, "x", 5, -9, 9, SLAB, CLEAR, WT, [door(-6.5, 1.2, 2.4), win(-1.5, 8, 2.4, .1), win(5.5, 2.4, 2.4, .1)]); facade(b, "x", 5, -9, 9, y1, CLEAR, WT, [win(-6.5, 2, 1.5, .9), win(-1.5, 8, 1.8, .6), win(5.5, 2.4, 1.8, .6)]);
    for (const y of [SLAB, y1]) facade(b, "x", -5, -9, 9, y, CLEAR, WT, [win(-6.5, 2, 1.5, .9), win(-3, 2, 1.5, .9), win(6.5, 2, 1.5, .9)]);
    for (const y of [SLAB, y1]) { facade(b, "z", -9, -5, 5, y, CLEAR, WT, [win(0, 2, 1.5, .9)]); facade(b, "z", 9, -5, 5, y, CLEAR, WT, y === SLAB ? [door(0, 1, 2.1)] : [win(0, 2, 1.5, .9)]); }
    b.doglegCore(2, -2, SLAB, { back: false });
    b.slab(9, -3.5, 16, 3.5, SLAB, SLAB); b.wall("x", 3.5, 9, 16, SLAB, CLEAR, WT, [door(12.5, 5, 2.4)]); b.wall("x", -3.5, 9, 16, SLAB, CLEAR, WT); b.wall("z", 16, -3.5, 3.5, SLAB, CLEAR, WT, [win(0, 1.5, 1.2, 1.2)]);
    b.slab(9, -3.9, 16.5, 3.9, y1, SLAB, undefined, "roof"); parapet(b, 9, -3.9, 16.5, 3.9, y1);
    b.slab(-9, 5, 6, 9, .45, .3, undefined, "floor"); b.rail(-9, 9, 6, 9, .45); b.rail(-9, 5, -9, 9, .45); b.rail(6, 7, 6, 9, .45); b.flight(6 + 3 * .3, 6, "-x", 0, 3, 2, .15, .3, "stair");
    b.slab(-8, 5, -5, 7.2, FH, .2, undefined, "roof"); for (const x of [-7.7, -5.3]) b.col(x, 7, .45, FH, .15);
  }, ["别墅", "豪宅", "悬疑", "家庭"]),

  vi("民国洋房·两层带阁楼·双层外廊", "民国小洋楼：15m×11m 主体两层（层高 3.0）、0.5m 高台基（三级台阶）、正面一排六根径 0.44 的圆柱撑起 2.4m 深的双层外廊（二层外廊带 1.05m 栏杆、廊顶披檐 10°），正面每层五扇 1.2m×2.1m 高窗（首层中间 1.8m 大门、二层中间 1.4m 门通外廊），左后角 3m×6m 双跑楼梯间，28° 四坡屋面出檐 0.8、两根烟囱，上海租界、官邸和谍战戏", b => {
    const X = 7.5, Z = 5.5, y0 = .5, y1 = y0 + FH, yT = y0 + 2 * FH;
    b.base(-8, -6, 8, 8.2, y0); b.steps(0, 8.2, "+z", 3, y0);
    b.slab(-X, -Z, X, 8.0, y1, SLAB, [b.coreRect(-5.5, -2.5, {}, -2.9, .92, 1.4)]);
    for (const y of [y0, y1]) facade(b, "x", Z, -X, X, y, CLEAR, WT, [-5.2, -2.6, 0, 2.6, 5.2].map(c => c === 0 ? door(0, y === y0 ? 1.8 : 1.4, 2.4) : win(c, 1.2, 2.1, .3)));
    for (const y of [y0, y1]) facade(b, "x", -Z, -X, X, y, CLEAR, WT, [-2.6, 0, 2.6, 5.2].map(c => win(c, 1.2, 2.1, .3)));
    for (const y of [y0, y1]) for (const s of [-1, 1]) facade(b, "z", s * X, -Z, Z, y, CLEAR, WT, [-2.5, 2.5].map(c => win(c, 1.2, 2.1, .3)));
    b.doglegCore(-5.5, -2.5, y0, { back: false });
    for (let x = -6.25; x <= 6.26; x += 2.5) b.cyl("struct", x, 7.8, y0, yT, .22, 10);
    b.rail(-X, 8, X, 8, y1); for (const x of [-X, X]) b.rail(x, Z, x, 8, y1); b.beamH("x", 7.8, -X, X, yT, .3, .4);
    b.strut("roof", [0, yT + .3, Z], [0, yT - .2, 8.4], 16.4, .12); b.hip(-X, -Z, X, Z, yT, 28, .8, .14); for (const x of [-4, 4]) b.box("wall", x, yT + 2.2, -1, 1, 2.4, 1);
  }, ["洋房", "民国", "官邸", "租界"]),

  rel("清真寺·穹顶·双宣礼塔·礼拜殿24m方", "清真寺：24m 见方的礼拜殿（墙厚 0.6 高 9、正面一扇 3m 宽 3.6m 高的大门加四扇 1.4m×3.0m 高窗、两侧和后墙各四扇）、中央 17m 径的 3m 高鼓座和半球形主穹顶（24 面 6 圈，顶高约 23m）、四角各一个径 6m 的小穹顶，正面两侧各一座径 2.8 高 32m 的宣礼塔（两层环形阳台和 6m 高锥顶，顶到 38m），殿内四根径 2.0 的支柱，穹顶下是 9m 高的平顶（穹顶为外观体量、不含穹窿内腔），中东、中亚、异域和战争戏", b => {
    const H = 9, y0 = .3, yb = y0 + H;
    b.slab(-12.4, -12.4, 12.4, 12.4, y0, .3); b.slab(-12.4, -12.4, 12.4, 12.4, yb, .4, undefined, "roof");
    b.wall("x", 12, -12, 12, y0, H, .6, [door(0, 3, 3.6), ...[-8, -4, 4, 8].map(c => win(c, 1.4, 3, 2.8))]); b.wall("x", -12, -12, 12, y0, H, .6, [-8, -4, 4, 8].map(c => win(c, 1.4, 3, 2.8))); for (const x of [-12, 12]) b.wall("z", x, -12, 12, y0, H, .6, [-8, -4, 4, 8].map(c => win(c, 1.4, 3, 2.8)));
    for (const x of [-6, 6]) for (const z of [-6, 6]) b.cyl("struct", x, z, y0, yb, 1, 12);
    ringWall(b, "wall", 8.5, .6, yb, yb + 3, 24); stack(b, "roof", yb + 3, 8.5, 6, 24);
    for (const x of [-9, 9]) for (const z of [-9, 9]) { ringWall(b, "wall", 3, .4, yb, yb + 1.5, 16, undefined, [x, z]); stack(b, "roof", yb + 1.5, 3, 4, 16, [x, z], .15); }
    for (const x of [-14, 14]) { b.cyl("wall", x, 13, 0, 32, 1.4, 12); for (const y of [22, 28]) { ringSlab(b, "floor", 1.4, 2.4, y, .3, 12, [x, 13]); ringWall(b, "rail", 2.3, .1, y, y + 1, 12, undefined, [x, 13]); } cone(b, "roof", 1.9, 32, 0, 38, 12, .15, [x, 13]); b.col(x, 13, 38, 39.5, .1); }
  }, ["清真寺", "穹顶", "宣礼塔", "中东"]),

  lm("灯塔·白塔·高29m·守塔人小屋", "海岸灯塔（总高约 29.5m）：塔身 11 节从径 7.2 逐节收到 5.0（墙厚 0.9、16 面、总高 22m，底部正面一个 1.4m 宽 2.0m 高的门洞），塔内螺旋木梯（110 级、踏步高 0.2、中柱径 0.3）直通顶部，22m 处 4.2m 外挑的环形平台带 1.1m 栏杆、玻璃灯室径 3.8 高 3m 加锥顶和风向标，灯室中央一盏灯体量，塔基 0.6m 高圆台，旁边 6m×4m 的单层守塔人小屋（一门两窗、25° 双坡屋面），海岸、悬疑、恐怖和孤岛戏", b => {
    b.group("band", "红色条带", "#c0392b", { roughness: .9 }); b.cyl("base", 0, 0, 0, .6, 4.6, 16);
    for (let i = 0; i < 11; i++) ringWall(b, i === 3 || i === 4 || i === 7 || i === 8 ? "band" : "wall", 3.6 - i * .11, .9, .6 + i * 2, .6 + (i + 1) * 2, 16, k => i === 0 && k === 0 ? null : undefined);
    for (let k = 0; k < 110; k++) { const th = k * 20, r = 1.3; b.boxYaw("stair", r * Math.sin(th * DEG), .6 + (k + 1) * .2 - .04, r * Math.cos(th * DEG), 1.1, .08, .6, th + 90); }
    b.cyl("struct", 0, 0, .6, 22.6, .15, 8);
    ringSlab(b, "floor", 2.1, 4.2, 22.6, .3, 16); ringWall(b, "rail", 4.1, .1, 22.6, 23.7, 16);
    ringWall(b, "glass", 1.9, .1, 22.6, 25.6, 16); cone(b, "roof", 2.4, 25.6, 0, 27.8, 16, .15); b.cyl("equip", 0, 0, 22.6, 23.8, .5, 12); b.col(0, 0, 27.8, 29.5, .1);
    b.slab(6, -2, 12, 2, SLAB, SLAB); b.wall("x", 2, 6, 12, SLAB, CLEAR, WT, [door(7.5, 1, 2.1), win(10.5, 1.5, 1.2, .9)]); b.wall("x", -2, 6, 12, SLAB, CLEAR, WT, [win(9, 1.5, 1.2, .9)]); for (const x of [6, 12]) b.wall("z", x, -2, 2, SLAB, CLEAR, WT);
    b.roofGable(6, -2, 12, 2, SLAB + CLEAR, 25, .5, .4, "x");
  }, ["灯塔", "海岸", "孤岛", "悬疑"]),

  lm("风车·荷兰八角塔·塔高15m·四翼风叶", "荷兰风车：八角塔身（五节从径 9 收到 6.4、墙厚 0.7、总高 12m、正面底部一个 1.2m 宽 2.0m 高的门洞）、顶上 3m 高的锥形风车帽，帽前 +z 3.6m 处的风车轴（高 13.6m）上四根 0.25m 粗 12m 长的风车臂（呈 X 形）、每臂一侧带 2.2m 宽 9m 长的板条风叶，田园、乡村和欧洲古装戏", b => {
    for (let i = 0; i < 5; i++) ringWall(b, "wall", 4.5 - i * .32, .7, i * 2.4, (i + 1) * 2.4, 8, k => i === 0 && k === 0 ? 2.0 : undefined);
    cone(b, "roof", 3.7, 12, 0, 15, 8, .15); b.col(0, 0, 15, 16, .15);
    const hub: P = [0, 13.6, 3.6];
    for (const [dx, dy] of [[1, 1], [-1, 1], [-1, -1], [1, -1]] as [number, number][]) {
      const L = 12, ex = hub[0] + dx * L / Math.SQRT2, ey = hub[1] + dy * L / Math.SQRT2, nx = -dy / Math.SQRT2, ny = dx / Math.SQRT2;
      b.strut("struct", hub, [ex, ey, hub[2]], .25, .25); b.strut("roof", [hub[0] + dx * 3 / Math.SQRT2 + nx * 1.4, hub[1] + dy * 3 / Math.SQRT2 + ny * 1.4, hub[2] + .2], [hub[0] + dx * 12 / Math.SQRT2 + nx * 1.4, hub[1] + dy * 12 / Math.SQRT2 + ny * 1.4, hub[2] + .2], .08, 2.2);
    }
    b.box("struct", 0, 13.6, 3.2, .6, .6, 1.2);
  }, ["风车", "荷兰", "田园", "欧洲"]),

  lm("机场塔台·高36m·玻璃指挥舱", "机场塔台：6m 见方的混凝土塔身（墙厚 0.5、高 26、正面底部 1.2m 门洞、每 6m 一个小窗）、塔身顶外扩 2.5m 的实心过渡座（26–28.5m）、11m 见方 2.6m 高的玻璃指挥舱（四面通长玻璃加 1.0m 窗下裙墙）、12.4m 见方的出挑屋面板和 1.05m 栏杆环廊、屋顶天线杆 4m（总高 35.7m），机场、军事基地、悬疑和灾难戏", b => {
    b.wall("x", 2.75, -3, 3, 0, 26, .5, [door(0, 1.2, 2.2), win(-1.5, .6, .8, 8), win(1.5, .6, .8, 14), win(-1.5, .6, .8, 20)]); b.wall("x", -2.75, -3, 3, 0, 26, .5, [win(0, .6, .8, 8), win(0, .6, .8, 14), win(0, .6, .8, 20)]); for (const x of [-2.75, 2.75]) b.wall("z", x, -2.5, 2.5, 0, 26, .5, [win(0, .6, .8, 8), win(0, .6, .8, 14), win(0, .6, .8, 20)]);
    prismoid(b, "wall", [-5.5, -5.5, 5.5, 5.5], 28.5, [-3, -3, 3, 3], 26);
    b.slab(-5.5, -5.5, 5.5, 5.5, 28.5, .4); b.box("wall", 0, 29.3, 5.4, 11, 1, .2); b.box("wall", 0, 29.3, -5.4, 11, 1, .2); for (const x of [-5.4, 5.4]) b.box("wall", x, 29.3, 0, .2, 1, 11);
    for (const [x, z, w, d] of [[0, 5.5, 11, .06], [0, -5.5, 11, .06], [5.5, 0, .06, 11], [-5.5, 0, .06, 11]] as [number, number, number, number][]) b.box("glass", x, 30.8, z, w, 2.1, d);
    b.slab(-6.2, -6.2, 6.2, 6.2, 31.7, .4, undefined, "roof"); b.rail(-6.2, 6.2, 6.2, 6.2, 31.7); b.rail(-6.2, -6.2, 6.2, -6.2, 31.7); b.rail(-6.2, -6.2, -6.2, 6.2, 31.7); b.rail(6.2, -6.2, 6.2, 6.2, 31.7); b.col(0, 0, 31.7, 35.7, .2);
  }, ["塔台", "机场", "军事基地", "灾难"]),
];

// 科幻舱室模块：净宽 2.8、净高 2.8（和楼层白模同一套 3m 格线、层高 3.0），舱壁厚 0.2，顶板（天花板组）和灯带（灯位格栅组）独立，可首尾相接、上下叠放。
const sf = (name: string, what: string, build: (b: AB) => void, tags: string[]) => whiteAnc(`白模·科幻·${name}`, `白模预演科幻舱室模块：${what}；原点在平面中心，+z 为正面，3m 格线、净宽 2.8 净高 2.8，沿格线首尾相接，层高 3.0`, "科幻", build, ["科幻", "舱室", "模块", ...tags]);
type Arm = "+x" | "-x" | "+z" | "-z";
/** 舱廊节点 3m×3m：没有舱廊的方向封舱壁，四角各一根立柱，顶板下一条灯带沿主方向。 */
function tube(b: WB, open: Arm[], ops: Partial<Record<Arm, Op[]>> = {}) {
  b.slab(-1.5, -1.5, 1.5, 1.5, SLAB); b.ceiling(-1.5, -1.5, 1.5, 1.5, SLAB + CLEAR, .2);
  for (const d of ["+x", "-x", "+z", "-z"] as Arm[]) { if (open.includes(d)) continue; const s = d[0] === "+" ? 1 : -1; if (d.endsWith("x")) b.wall("z", s * 1.5, -1.5, 1.5, SLAB, CLEAR, WT, ops[d] ?? []); else b.wall("x", s * 1.5, -1.5, 1.5, SLAB, CLEAR, WT, ops[d] ?? []); }
  for (const x of [-1.5, 1.5]) for (const z of [-1.5, 1.5]) b.col(x, z, SLAB, SLAB + CLEAR, .2);
  const alongZ = open.some(a => a.endsWith("z")); b.box("rig", 0, SLAB + CLEAR - .05, 0, alongZ ? .3 : 3, .05, alongZ ? 3 : .3);
}

export const whiteScifiDesigns: ArchitecturePrototype[] = [
  sf("舱廊·直段·3m", "舱廊直段：3m 长、两侧舱壁厚 0.2 高 2.8、顶板和中央灯带，沿 z 贯通", b => tube(b, ["+z", "-z"]), ["舱廊", "走廊", "直段"]),
  sf("舱廊·隔舱门·3m", "舱廊隔舱门：3m 长舱廊中间一道横向舱壁，开一扇 1.4m 宽 2.2m 高的舱门洞，沿 z 贯通", b => { tube(b, ["+z", "-z"]); b.wall("x", 0, -1.4, 1.4, SLAB, CLEAR, WT, [door(0, 1.4, 2.2)]); }, ["舱廊", "舱门", "隔舱"]),
  sf("舱廊·L形转角·3m", "舱廊 L 形转角：3m 见方、连通 -z 和 +x 两个方向，另两面封舱壁", b => tube(b, ["-z", "+x"]), ["舱廊", "转角"]),
  sf("舱廊·T形节点·3m", "舱廊 T 形节点：3m 见方、连通 -x、+x、-z 三个方向，+z 面封舱壁", b => tube(b, ["-x", "+x", "-z"]), ["舱廊", "T形"]),
  sf("气闸舱·3m×3m", "气闸舱：3m 见方，前后（z=±1.0）各一道舱壁开 1.2m 宽 2.1m 高的气密门洞、门旁各一扇 0.4m 观察窗，两侧舱壁封闭，顶板灯带", b => { tube(b, ["+z", "-z"]); for (const z of [-1, 1]) b.wall("x", z, -1.4, 1.4, SLAB, CLEAR, WT, [door(0, 1.2, 2.1), win(-1.05, .4, .4, 1.4), win(1.05, .4, .4, 1.4)]); }, ["气闸", "舱门"]),
  sf("圆形指挥舱·径18m·高6m·穹顶", "圆形指挥舱：外径 18m、舱壁厚 0.3 高 6.0（24 段，圆周上每 120° 一个 2.4m 宽的舱门，离地 2.2–3.6m 一圈通长观察窗），地板厚 0.2、穹顶三圈收到 9.0m 高，中央一座径 5m 高 1.1m 的指挥台体量，飞船舰桥、基地中枢和外星战舰戏", b => {
    ringSlab(b, "floor", 0, 9.2, SLAB, .2, 24); const dg = (i: number): number | null | undefined => [0, 8, 16].includes(i) ? null : undefined;
    ringWall(b, "wall", 8.95, .3, SLAB, 2.2, 24, dg); ringWall(b, "wall", 8.95, .3, 3.6, 6, 24); ringWall(b, "glass", 8.95, .05, 2.2, 3.6, 24, dg);
    for (const [r0, y0, r1, y1] of [[9.1, 6, 6.5, 7.8], [6.5, 7.8, 3.2, 8.8], [3.2, 8.8, 0, 9]] as [number, number, number, number][]) cone(b, "ceil", r0, y0, r1, y1, 24, .15);
    b.cyl("equip", 0, 0, SLAB, SLAB + 1.1, 2.5, 16); b.cyl("rig", 0, 0, 8.9, 9.05, 1.2, 12);
  }, ["指挥舱", "舰桥", "穹顶", "圆形"]),
  sf("货舱·24m×12m×8m·舱门与吊车梁", "货舱：24m×12m 平面、舱壁厚 0.3 高 8、正面一个 6m 宽 6m 高的货舱大门，顶部每 6m 一榀横向桁梁（5 榀）和两条纵向吊车梁，后壁一层 3m 深的 4.0m 高检修平台（带栏杆）和一部 1.2m 宽直跑楼梯，地面板厚 0.3，飞船货舱、太空港和末日基地戏", b => {
    b.slab(-12, -6, 12, 6, .3, .3); b.wall("x", 6, -12, 12, .3, 8, .3, [door(0, 6, 6)]); b.wall("x", -6, -12, 12, .3, 8, .3); for (const x of [-12, 12]) b.wall("z", x, -6, 6, .3, 8, .3);
    for (let x = -12; x <= 12.01; x += 6) b.box("struct", x, 7.9, 0, .4, .6, 11.6); for (const z of [-2.5, 2.5]) b.box("struct", 0, 7.5, z, 24, .5, .4);
    b.slab(-12, -6, 12, -3, 4.3, .3, undefined, "floor"); b.rail(-12, -3, 12, -3, 4.3); b.flight(10.8, -2.9, "-z", .3, 24, 1.2, 4 / 24, .28);
    b.slab(-12, -6, 12, 6, 8.4, .2, undefined, "ceil");
  }, ["货舱", "太空港", "货运"]),
];
void FH;
