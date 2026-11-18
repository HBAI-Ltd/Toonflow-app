import type { P } from "./ruinKit";
import { DEG, FH, SLAB, door, win, type Rect } from "./whitebox";
import { whiteAnc, type AB } from "./whiteboxAncientKit";
import { cone, pol, ringSlab, ringWall } from "./whiteboxRegional";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·工业与军事：锅炉房与烟囱、水塔、储罐区、冷却塔、码头仓库、集装箱堆场、机库、矿井井架、塔吊，以及监狱围墙加岗楼、木哨塔、六角碉堡。
// 都是追逐、爆破、对峙、越狱和战争戏里最常出现的大体量建筑，尺度按真实工业和军事设施取。
const tan = (d: number) => Math.tan(d * DEG);
const lo = Math.min, hi = Math.max;
const mk = (cat: string) => (name: string, what: string, build: (b: AB) => void, tags: string[]) => whiteAnc(`白模·${cat}·${name}`, `白模预演${cat}建筑：${what}；原点在平面中心，+z 为正面，地面标高 0`, "现代", build, [cat, ...tags]);
const ind = mk("工业"), mil = mk("军事");

export const whiteIndustryDesigns: ArchitecturePrototype[] = [
  ind("锅炉房与砖烟囱·房18m×12m·烟囱高40m", "锅炉房：18m×12m、墙厚 0.4 高 11、前面一个 4.2m 宽 4.5m 高的大门加两扇高窗、后墙三扇、两山各一扇，15° 双坡屋面带三榀屋架，屋里一台 8m×4m×7m 的锅炉体量，旁边 +x 一座砖烟囱（底径 4.8 顶径 2.6、高 40m、顶带出口圈、5m 见方 0.8 高基台），工厂、爆破、纵火和工业遗址戏", b => {
    b.slab(-9, -6, 9, 6, .3, .3);
    b.wall("x", 6, -9, 9, .3, 11, .4, [door(0, 4.2, 4.5), win(-6, 2, 3, 5), win(6, 2, 3, 5)]); b.wall("x", -6, -9, 9, .3, 11, .4, [-6, 0, 6].map(c => win(c, 2, 3, 5)));
    for (const x of [-9, 9]) b.wall("z", x, -6, 6, .3, 11, .4, [win(0, 2, 3, 5)]);
    for (const x of [-6, 0, 6]) b.frame("z", x, -6, 6, 11.3, 11.3 + 6 * tan(15));
    b.roofGable(-9, -6, 9, 6, 11.3, 15, .5, .4, "x"); b.box("equip", -2, 3.8, 0, 8, 7, 4);
    b.base(11.5, -2.5, 16.5, 2.5, .8); b.steps(0, 11.5, "-x", 2.4, .8); cone(b, "wall", 2.4, .8, 1.3, 40, 16, .35, [14, 0]); b.cyl("rail", 14, 0, 39.8, 40.4, 1.45, 16);
  }, ["锅炉房", "烟囱", "工厂", "爆破"]),

  ind("水塔·高脚圆罐·塔高23m", "水塔：四根 0.8m 方柱（间距 6m、高 14）带三层交叉斜撑和两道环梁，顶上 9.6m 见方的 0.4 厚平台、径 9m 高 6m 的圆罐（24 面）和 20° 锥顶，平台带 1.05m 栏杆，一根 0.5m 宽、每 0.3m 一档的直爬梯贴着 +x 柱子通到平台，乡镇、工厂、狙击点和攀爬戏", b => {
    const L = 3, hL = 14;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.col(sx * L, sz * L, 0, hL, .8);
    for (const y of [4.5, 9]) for (const s of [-1, 1]) { b.beamH("x", s * L, -L, L, y, .4, .4); b.beamH("z", s * L, -L, L, y, .4, .4); }
    for (const [y0, y1] of [[0, 4.5], [4.5, 9], [9, 14]] as [number, number][]) for (const s of [-1, 1]) { b.strut("struct", [-L, y0, s * L], [L, y1, s * L], .25, .25); b.strut("struct", [s * L, y0, -L], [s * L, y1, L], .25, .25); }
    b.slab(-4.8, -4.8, 4.8, 4.8, hL + .4, .4, undefined, "floor"); b.cyl("wall", 0, 0, hL + .4, hL + 6.4, 4.5, 24); cone(b, "roof", 4.8, hL + 6.4, 0, hL + 9.4, 24, .15);
    b.rail(-4.8, 4.8, 4.8, 4.8, hL + .4); b.rail(-4.8, -4.8, 4.8, -4.8, hL + .4); b.rail(-4.8, -4.8, -4.8, 4.8, hL + .4); b.rail(4.8, -4.8, 4.8, 4.8, hL + .4);
    for (const z of [-.25, .25]) b.box("rail", L + .9, hL / 2, z, .05, hL, .05); for (let y = .4; y < hL; y += .3) b.box("rail", L + .9, y, 0, .05, .04, .5);
  }, ["水塔", "狙击", "攀爬", "乡镇"]),

  ind("储罐区·三罐·径16m·高12m·含防火堤", "储罐区：三座径 16m 高 12m 的圆罐（24 面，间距 20m，顶带 1.1m 高圈栏和 13° 浅锥顶）排成一行，外围 60m×28m 的 1.5m 高 0.5 厚防火堤，爆炸、追逐、对峙和工业灾难戏", b => {
    for (const x of [-20, 0, 20]) { b.cyl("wall", x, 0, 0, 12, 8, 24); cone(b, "roof", 8.2, 12, 0, 13.2, 24, .15, [x, 0]); ringWall(b, "rail", 8.1, .1, 12, 13.1, 24, undefined, [x, 0]); }
    for (const z of [-14, 14]) b.wall("x", z, -30, 30, 0, 1.5, .5); for (const x of [-30, 30]) b.wall("z", x, -14, 14, 0, 1.5, .5);
    for (const sz of [-1, 1]) for (const x of [-10, 10]) { b.steps(x, sz * 14.25, sz < 0 ? "-z" : "+z", 2, 1.5); b.steps(x, sz * 13.75, sz < 0 ? "+z" : "-z", 2, 1.5); }
  }, ["储罐", "油库", "爆炸", "工业"]),

  ind("冷却塔·双曲线·高83m·底径44m", "电厂冷却塔：双曲线塔身（底径 44、喉径 24.8、顶径 27.6、高 8–83m，32 面分 8 段）、塔身下 8m 高的进风柱列（24 根径 1.2 的柱加 0.6 高环梁、底部通透可穿行），反乌托邦、核电站、工业遗址和末日戏的地标", b => {
    const pts: [number, number][] = [[8, 22], [18, 19.4], [28, 17], [38, 14.8], [48, 13.2], [58, 12.4], [68, 12.5], [78, 13.2], [83, 13.8]];
    for (let i = 0; i + 1 < pts.length; i++) cone(b, "wall", pts[i]![1], pts[i]![0], pts[i + 1]![1], pts[i + 1]![0], 32, .4);
    ringSlab(b, "floor", 21, 22.4, 8.2, .6, 32); for (let k = 0; k < 24; k++) { const p = pol(21.7, k * 15, 0); b.cyl("struct", p[0], p[2], 0, 7.6, .6, 8); }
  }, ["冷却塔", "电厂", "地标", "末日"]),

  ind("码头·栈桥仓库·两栋·长60m", "码头栈桥仓库：60m×14m 的 0.4 厚混凝土栈桥（桥面标高 1.5、每 6m 一排三根桩、水侧 1.05m 栏杆），上面两栋 24m×9m 的仓库（墙厚 0.3 高 6、水侧各两个 6m 宽 5m 高的大门、陆侧一扇 3m 门、两山各一扇侧门、12° 双坡屋面每 6m 一榀屋架），仓库前 5m 宽的装卸平台，走私、交易、枪战和追逐", b => {
    b.slab(-30, -4, 30, 10, 1.5, .4, undefined, "floor"); b.steps(0, -4, "-z", 3, 1.5); b.steps(3, -30, "-x", 4, 1.5); b.steps(3, 30, "+x", 4, 1.5); for (let x = -30; x <= 30.01; x += 6) for (const z of [-3, 3, 9]) b.cyl("struct", x, z, 0, 1.3, .3, 8); b.rail(-30, 10, 30, 10, 1.5);
    for (const [x0, x1] of [[-28, -4], [4, 28]] as [number, number][]) {
      const cx = (x0 + x1) / 2;
      b.wall("x", 5, x0, x1, 1.5, 6, .3, [door(cx - 6, 6, 5), door(cx + 6, 6, 5)]); b.wall("x", -4, x0, x1, 1.5, 6, .3, [door(cx, 3, 3)]); for (const x of [x0, x1]) b.wall("z", x, -4, 5, 1.5, 6, .3, [door(.5, 1.2, 2.1)]);
      for (let x = x0; x <= x1 + .01; x += 6) b.frame("z", x, -4, 5, 7.5, 7.5 + 4.5 * tan(12)); b.roofGable(x0, -4, x1, 5, 7.5, 12, .5, .4, "x");
    }
  }, ["码头", "仓库", "走私", "交易"]),

  ind("集装箱堆场·四列五排·最高三层", "集装箱堆场：标准 40 尺箱（12.2m×2.44m×2.59m）四列五排、每列间隔 0.2、每排间隔 0.56，堆高一至三层（缺几堆留出通道），共约 40 只箱子，码头枪战、追逐、埋伏和人口走私戏", b => {
    b.group("c1", "集装箱·红", "#b5422f").group("c2", "集装箱·蓝", "#2f5f98").group("c3", "集装箱·绿", "#3f7f4f").group("c4", "集装箱·黄", "#d7a63a").group("c5", "集装箱·灰", "#8c9199");
    for (let ix = 0; ix < 4; ix++) for (let iz = 0; iz < 5; iz++) { if ((ix + iz) % 4 === 3) continue; const n = (ix * 3 + iz * 2) % 3 + 1; for (let k = 0; k < n; k++) b.box(`c${(ix * 2 + iz * 3 + k) % 5 + 1}`, -18.6 + ix * 12.4, 1.295 + k * 2.59, -6 + iz * 3, 12.2, 2.59, 2.44); }
  }, ["集装箱", "码头", "枪战", "埋伏"]),

  ind("机库·筒拱·48m×30m·正面敞开30m大门", "飞机库：48m×30m、墙高 11、筒拱屋面（矢高 6、脊线沿 x），正面（+z）一个 30m 宽 9m 高的敞开大门（洞口上方留 2m 过梁），后墙和两山墙实心（山墙上端补拱形山花），混凝土地面板厚 0.3，军事基地、飞行员、秘密研究和末日戏", b => {
    const x0 = -24, x1 = 24, z0 = -15, z1 = 15, ye = 11.3, rise = 6, w = z1 - z0, R = (rise * rise + w * w / 4) / (2 * rise), al = Math.asin(w / 2 / R), yc = ye + rise - R;
    b.slab(x0, z0, x1, z1, .3, .3); b.wall("x", z1, x0, x1, .3, 11, .4, [door(0, 30, 9)]); b.wall("x", z0, x0, x1, .3, 11, .4); for (const x of [x0, x1]) b.wall("z", x, z0, z1, .3, 11, .4);
    b.vault(x0, x1, z0, z1, ye, rise, 16);
    for (const [xs, n] of [[x0, -1], [x1, 1]] as [number, number][]) for (const d of [-.1, .1]) { const pts: P[] = []; for (let k = 0; k <= 16; k++) { const a = -al + 2 * al * k / 16; pts.push([xs + d, yc + R * Math.cos(a), R * Math.sin(a)]); } for (let k = 0; k < 16; k++) b.tri3("wall", [xs + d, ye, 0], pts[k]!, pts[k + 1]!, [n, 0, 0]); }
  }, ["机库", "飞机", "军事基地", "筒拱"]),

  ind("矿井·井架与绞车房·架高28m", "矿井井架：四根 0.5m 方钢柱（前两根近乎垂直、后两根斜撑到地面后 9m 处，左右间距 7m）共高 28m，每隔 6m 一道横梁和斜撑，顶上两只 1.0m 厚 4.8m 径的天轮（体量），井口 6m 见方 1.0m 高的混凝土井口台，后面 +x 一座 10m×8m 高 8 的砖砌绞车房（一门两窗、18° 双坡屋面），矿难、救援、末世和西部淘金戏", b => {
    const zf = (y: number) => 3 - 2.5 * y / 28, zb = (y: number) => -9 + 8.5 * y / 28;
    b.base(-3.5, -3, 3.5, 3, 1); b.steps(0, 3, "+z", 2.4, 1);
    for (const s of [-1, 1]) { b.strut("struct", [s * 3.5, 1, 3], [s * 3.5, 28, .5], .5, .5); b.strut("struct", [s * 3.5, 1, -9], [s * 3.5, 28, -.5], .5, .5); }
    for (const y of [7, 13, 19, 25]) { b.box("struct", 0, y, zf(y), 7.2, .35, .35); b.box("struct", 0, y, zb(y), 7.2, .35, .35); for (const s of [-1, 1]) b.strut("struct", [s * 3.5, y - 6, zf(y - 6)], [s * 3.5, y, zb(y)], .25, .25); }
    for (const x of [-1.6, 1.6]) b.box("equip", x, 28.6, 0, 1, 4.8, 4.8);
    b.slab(8, -4, 18, 4, .3, .3); b.wall("x", 4, 8, 18, .3, 8, .4, [door(13, 2.4, 3), win(10, 1.5, 2, 2), win(16, 1.5, 2, 2)]); b.wall("x", -4, 8, 18, .3, 8, .4, [win(13, 1.5, 2, 2)]); for (const x of [8, 18]) b.wall("z", x, -4, 4, .3, 8, .4);
    b.roofGable(8, -4, 18, 4, 8.3, 18, .5, .4, "x");
  }, ["矿井", "井架", "矿难", "淘金"]),

  ind("塔吊·塔身42m·起重臂38m", "塔式起重机：6m×6m×1.6m 的混凝土基础、2.0m 见方的格构塔身（四根 0.18 角钢、每 3m 一道水平撑和斜撑）高 42m，顶上司机室 2.0m 立方、两侧起重臂（前臂 +x 38m、平衡臂 -x 12m，格构式上下弦加腹杆）和 4m×2m×1.5m 的配重块，建筑工地、烂尾楼、攀爬追逐和高空打斗", b => {
    b.box("base", 0, .8, 0, 6, 1.6, 6);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.col(sx, sz, 1.6, 42, .18);
    for (let y = 3; y <= 42; y += 3) { for (const s of [-1, 1]) { b.box("struct", 0, y, s, 2, .08, .08); b.box("struct", s, y, 0, .08, .08, 2); b.strut("struct", [-1, y - 3, s], [1, y, s], .08, .08); b.strut("struct", [s, y - 3, -1], [s, y, 1], .08, .08); } }
    b.box("equip", 1.8, 41.2, 1.8, 2, 2, 2);
    for (const z of [-.9, .9]) b.box("struct", 13, 42.1, z, 52, .15, .15); b.box("struct", 13, 44.3, 0, 52, .15, .15);
    for (let x = -12; x < 38; x += 2.5) { for (const z of [-.9, .9]) b.strut("struct", [x, 42.1, z], [x + 1.25, 44.3, 0], .08, .08); b.box("struct", x, 42.1, 0, .08, .08, 1.8); }
    b.box("equip", -10, 43.4, 0, 4, 1.5, 2); b.box("struct", 0, 45.5, 0, .4, 2.4, .4);
  }, ["塔吊", "工地", "高空", "攀爬"]),

  mil("监狱围墙·岗楼·大门·60m×40m", "监狱围墙：60m×40m、墙高 7、厚 0.8 的围墙一圈，正面中央 12m×6m 高 9m 的大门楼（贯通 5.0m 宽、拱顶 4.8m 的拱门洞），四个角各一座 3.6m 见方高 9m 的岗楼塔身加 4.8m 见方的玻璃瞭望舱和平顶，墙内不含囚室楼，越狱、探监、押解和暴动戏（囚室楼见「楼栋·监狱牢区」）", b => {
    b.wall("x", -20, -30, 30, 0, 7, .8); for (const s of [-1, 1]) b.wall("x", 20, lo(s * 6, s * 30), hi(s * 6, s * 30), 0, 7, .8);
    for (const s of [-1, 1]) b.wall("z", s * 30, -20, 20, 0, 7, .8);
    b.archBlock(-6, 6, 0, 9, 17, 23, 0, 2.5, 3.2, 4.8, 12);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * 30, z = sz * 20; b.box("wall", x, 4.5, z, 3.6, 9, 3.6); b.box("wall", x, 10.3, z, 4.8, .3, 4.8); b.box("glass", x, 11.8, z, 4.4, 2.2, 4.4); b.box("roof", x, 13.15, z, 5.4, .3, 5.4); }
  }, ["监狱", "围墙", "岗楼", "越狱"]),

  mil("哨塔·木制·高9m·含爬梯", "木制哨塔：四根 0.3m 方柱（底部间距 3.6m、向上略收）高 8m，三层交叉斜撑，顶上 3.6m 见方的平台加 2.2m 高的板墙哨舍（每面一个 2.0m×1.0m 的瞭望窗、一面开 0.9m 门）和 25° 四坡屋面，平台带 1.05m 栏杆，一部 0.8m 宽的陡直木梯（28 级、踏步 0.29×0.22）从正面通到平台，边防、营地、战争和丛林戏", b => {
    const H = 8;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.strut("struct", [sx * 1.8, 0, sz * 1.8], [sx * 1.5, H, sz * 1.5], .3, .3);
    for (const y of [2.7, 5.4]) { const r = 1.8 - .3 * y / H; for (const s of [-1, 1]) { b.beamH("x", s * r, -r, r, y, .2, .2); b.beamH("z", s * r, -r, r, y, .2, .2); } }
    for (const [y0, y1] of [[0, 2.7], [2.7, 5.4], [5.4, 8]] as [number, number][]) for (const s of [-1, 1]) { const r0 = 1.8 - .3 * y0 / H, r1 = 1.8 - .3 * y1 / H; b.strut("struct", [-r0, y0, s * r0], [r1, y1, s * r1], .15, .15); b.strut("struct", [s * r0, y0, -r0], [s * r1, y1, r1], .15, .15); }
    b.slab(-1.8, -1.8, 1.8, 1.8, H + .2, .2, undefined, "floor");
    b.wall("x", 1.7, -1.7, 1.7, H + .2, 2.2, .1, [win(0, 2, 1, 1.0)]); b.wall("x", -1.7, -1.7, 1.7, H + .2, 2.2, .1, [win(0, 2, 1, 1.0)]); for (const x of [-1.7, 1.7]) b.wall("z", x, -1.7, 1.7, H + .2, 2.2, .1, [x < 0 ? door(0, .9, 1.9) : win(0, 2, 1, 1.0)]);
    b.hip(-1.8, -1.8, 1.8, 1.8, H + 2.4, 25, .8, .1); b.rail(-1.8, 1.8, 1.8, 1.8, H + .2);
    b.flight(-.2, 1.9 + 28 * .22, "-z", 0, 28, .8, (H + .2) / 28, .22);
  }, ["哨塔", "边防", "营地", "木制"]),

  mil("碉堡·混凝土·六角形·三面射孔", "混凝土碉堡：六角形（外径 6.9m、墙厚 0.6、墙高 2.8）、前面三面各一个 0.8m×0.3m 的射孔（离地 1.2）、后面一面 0.9m 宽 1.8m 高的小门、0.4 厚的屋顶板外挑 0.3，战争、边防、海岸防御和废墟戏（半埋式的地面部分，不含地下室）", b => {
    const R = 3, W = 2 * R * tan(30) + .2;
    for (let i = 0; i < 6; i++) {
      const a = i * 60, p = pol(R, a, 0), tg: P = [Math.cos(a * DEG), 0, -Math.sin(a * DEG)];
      const piece = (off: number, y0: number, y1: number, w: number) => { const c: P = [p[0] + tg[0] * off, (y0 + y1) / 2, p[2] + tg[2] * off]; b.boxYaw("wall", c[0], c[1], c[2], w, y1 - y0, .6, a); };
      if (i === 0 || i === 1 || i === 5) { piece(0, 0, 1.2, W); piece(0, 1.5, 2.8, W); for (const s of [-1, 1]) piece(s * (.4 + (W - .8) / 4), 1.2, 1.5, (W - .8) / 2); }
      else if (i === 3) { piece(0, 1.8, 2.8, W); for (const s of [-1, 1]) piece(s * (.45 + (W - .9) / 4), 0, 1.8, (W - .9) / 2); }
      else piece(0, 0, 2.8, W);
    }
    ringSlab(b, "roof", 0, R + .7, 3.2, .4, 6);
  }, ["碉堡", "战争", "海岸", "射孔"]),
];

void FH; void SLAB; void lo; void hi; void (null as unknown as Rect);
