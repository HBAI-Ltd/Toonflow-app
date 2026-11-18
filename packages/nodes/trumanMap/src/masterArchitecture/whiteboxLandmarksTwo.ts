import type { AssetTheme } from "../sceneDocument";
import { CLEAR, DEG, SLAB, WT, door, win } from "./whitebox";
import { shed } from "./whiteboxCampus";
import { fenceRun, hall } from "./whiteboxCompounds";
import { whiteAnc, type AB } from "./whiteboxAncientKit";
import { cone, ringSlab, ringWall } from "./whiteboxRegional";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·地标与交通：摩天轮、马戏大篷、体育场、铁路桁架桥、收费站、火车站台、汽修厂、棚户区、露天集市、墓园、天际线背景、海滨栈道救生塔、无线电格构塔、风力发电机。
// 都是影视里一眼认得出的地标和场所，尺度取真实大小（单个模型坐标不超过正负 100m，所以体育场、摩天轮按真实大小的上限取）。
const mk = (cat: string, theme: AssetTheme) => (name: string, what: string, build: (b: AB) => void, tags: string[]) => whiteAnc(`白模·${cat}·${name}`, `白模预演${cat}建筑：${what}；原点在平面中心，+z 为正面，地面标高 0`, theme, build, [cat, ...tags]);
const lm = mk("地标", "现代"), tr = mk("交通", "现代"), sc = mk("场所", "现代");
const hs = (i: number) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;

export const whiteLandmarkTwoDesigns: ArchitecturePrototype[] = [
  lm("摩天轮·轮径56m·三十六轿厢·高62m", "游乐园摩天轮：两圈各 36 段的轮缘（半径 28、管径 0.3、两圈相距 5m）、每圈 36 根辐条连到轮毂、每个轮缘点一根 5m 长的连杆和一只 2.2m×2.4m×2.6m 的轿厢（共 36 只），一根 10m 长的主轴，两侧各一对 A 字形支腿（脚距 28m、顶到 32m 的轮心，带一道横撑），总高约 62m，游乐园、约会、追逐和惊悚戏", b => {
    const R = 28, hy = 32, N = 36, P = (i: number): [number, number] => [R * Math.sin(i * 10 * DEG), hy + R * Math.cos(i * 10 * DEG)];
    for (const zz of [-2.5, 2.5]) for (let i = 0; i < N; i++) { const [x0, y0] = P(i), [x1, y1] = P(i + 1); b.strut("struct", [x0, y0, zz], [x1, y1, zz], .3, .3); b.strut("struct", [0, hy, zz], [x0, y0, zz], .15, .15); }
    for (let i = 0; i < N; i++) { const [x, y] = P(i); b.box("struct", x, y, 0, .25, .25, 5); b.box("equip", x, y - 1.6, 0, 2.2, 2.4, 2.6); }
    b.box("struct", 0, hy, 0, .8, .8, 10); for (const zz of [-4.5, 4.5]) { b.strut("struct", [-14, 0, zz], [0, hy, zz], .8, .8); b.strut("struct", [14, 0, zz], [0, hy, zz], .8, .8); b.box("struct", 0, 12, zz, 12, .5, .5); }
  }, ["摩天轮", "游乐园", "约会", "惊悚"]),

  sc("马戏大篷·圆顶帐篷·径36m·高14m·含看台", "马戏团大帐篷：径 36m 的圆形篷（24 面）、帐篷墙高 5m（正面留一个 3.6m 宽的入口）、篷顶从 5m 收到 12m 的锥顶再加 2m 高的小锥顶（帐篷布是实体面），中心四根径 0.6 高 13m 的撑杆，篷内三圈斜坡看台（r7–17m 升到 3.6m、正对入口的一条 3.6m 宽过道不设看台、直通表演圈）和一个径 12m 的表演圈地板，马戏、游乐园、复古和恐怖戏", b => {
    b.group("ring", "表演圈", "#c9a24a", { roughness: .95 });
    ringWall(b, "wall", 18, .12, 0, 5, 24, i => i === 0 ? null : undefined); cone(b, "roof", 18.4, 5, 3, 12, 24, .1); cone(b, "roof", 3, 12, 0, 14, 24, .1);
    for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]] as [number, number][]) b.cyl("struct", x, z, 0, 13, .3, 8);
    for (const [r0, y0, r1, y1] of [[7, .4, 10.5, 1.5], [10.5, 1.5, 14, 2.6], [14, 2.6, 17, 3.6]] as [number, number, number, number][]) cone(b, "seat", r0, y0, r1, y1, 23, .4, [0, 0], { arc: [7.5, 352.5] }); ringSlab(b, "ring", 0, 6.5, .12, .1, 24);
  }, ["马戏", "帐篷", "游乐园", "复古"]),

  lm("体育场·椭圆·120m×96m·双层看台·罩棚", "大型体育场：外廓 120m×96m（长轴沿 x）、外墙厚 1.0 高 23（每三段留一个 3.2m 高的拱洞）、下层看台（r30–46m 升到 11m）和 4m 宽的环廊、上层看台（r50–60m 升到 23m）、外缘一圈出挑的罩棚（r44–64m、标高 26–29m）加 24 根支柱，场内椭圆草地和 6m 宽的红色跑道，足球赛、演唱会、体育和灾难戏", b => {
    b.group("track", "跑道", "#b5503a", { roughness: .95 }); b.group("grass", "草地", "#5f9a52", { roughness: .95 }); const ex = { sc: [1, .8] as [number, number] };
    ringSlab(b, "grass", 0, 22, .08, .08, 48, [0, 0], ex); ringSlab(b, "track", 22, 28, .1, .1, 48, [0, 0], ex);
    cone(b, "seat", 30, .4, 46, 11, 69, .4, [0, 0], { ...ex, arc: [7.5, 352.5] }); ringSlab(b, "floor", 46, 50, 11, .6, 72, [0, 0], ex); cone(b, "seat", 50, 11, 60, 23, 72, .6, [0, 0], ex);
    ringWall(b, "wall", 61, 1, 0, 23, 72, i => i % 3 === 0 ? 3.2 : undefined, [0, 0], ex); cone(b, "roof", 44, 26, 64, 29, 72, .5, [0, 0], ex);
    for (let k = 0; k < 24; k++) { const a = k * 15 * DEG; b.col(62 * Math.sin(a), 62 * .8 * Math.cos(a), 0, 28, .8); }
  }, ["体育场", "足球", "演唱会", "灾难"]),

  tr("铁路桁架桥·双线钢桁梁·跨度60m", "铁路桁架桥：60m 跨的双线钢桁梁（桥面板厚 0.8、标高 8、宽 10m，两侧各一榀 7m 高的平行弦桁架——上下弦杆 0.5m、每 5m 一根竖杆、交替斜杆、顶部横撑），两端各一座 6m×7m 的石砌桥台，桥面两条线路（钢轨 0.07m、轨距 1.435、枕木每 0.8m 一根），追火车、爆破、跳桥和战争戏", b => {
    b.group("track", "轨道", "#6a6f75", { roughness: .6, metalness: .4 });
    for (const s of [-1, 1]) b.box("base", s * 33, 3.5, 0, 6, 7, 10); b.slab(-30, -5, 30, 5, 8, .8, undefined, "floor");
    for (const s of [-1, 1]) { const z = s * 5; b.box("struct", 0, 8.3, z, 60, .5, .5); b.box("struct", 0, 14, z, 60, .5, .5); for (let k = 0; k <= 12; k++) { const x = -30 + 5 * k; b.box("struct", x, 11, z, .4, 6, .4); if (k < 12) b.strut("struct", k % 2 ? [x, 14, z] : [x, 8.3, z], k % 2 ? [x + 5, 8.3, z] : [x + 5, 14, z], .3, .3); } }
    for (let k = 0; k <= 12; k++) b.box("struct", -30 + 5 * k, 14, 0, .3, .3, 10);
    for (const tz of [-2.4, 2.4]) { for (const r of [-.72, .72]) b.box("track", 0, 8.5, tz + r, 60, .15, .07); for (let x = -29.6; x <= 29.7; x += .8) b.box("struct", x, 8.45, tz, .22, .1, 2.6); }
  }, ["铁路", "桁架桥", "火车", "爆破"]),

  tr("收费站·六车道·罩棚44m×16m", "高速收费站：44m×16m 的平屋面罩棚（板厚 0.6、标高 6.5、两排共 8 根 1.0m 方柱）下六条 3.5m 宽的车道，之间七座 2.2m×1.8m、高 2.8m 的收费岛亭（带窗和平顶），公路追车、关卡和检查站戏", b => {
    b.slab(-22, -8, 22, 8, 7.1, .6, undefined, "roof"); for (const x of [-20, -7, 7, 20]) for (const z of [-7, 7]) b.col(x, z, 0, 6.5, 1);
    for (let i = 0; i < 7; i++) { const x = -10.5 + i * 3.5; b.wall("x", .9, x - 1.1, x + 1.1, .3, 2.8, .1, [win(x, 1.6, 1.2, 1)]); b.wall("x", -.9, x - 1.1, x + 1.1, .3, 2.8, .1); for (const s of [-1, 1]) b.wall("z", x + s * 1.1, -.9, .9, .3, 2.8, .1); b.slab(x - 1.3, -1.1, x + 1.3, 1.1, 3.4, .2, undefined, "roof"); b.box("base", x, .15, 0, 2.2, .3, 1.8); }
  }, ["收费站", "高速", "关卡", "追车"]),

  tr("火车站台·岛式·雨棚·双线·长60m", "火车站岛式站台：60m 长 8m 宽高 1.1m 的岛式站台，两侧各一条线路（中心距站台 6.2m、钢轨 0.07m、轨距 1.435、枕木每 0.8m 一根），站台上两排共 22 根径 0.4 的立柱（柱距 6m、柱顶标高 4.8）撑着 9m 宽的平雨棚（板厚 0.3），站台两端各一部 1.5m 宽的斜坡，铁路、告别、追车和年代戏", b => {
    b.group("track", "轨道", "#6a6f75", { roughness: .6, metalness: .4 }); b.box("base", 0, .55, 0, 8, 1.1, 60);
    for (const s of [-1, 1]) { for (const r of [-.72, .72]) b.box("track", s * 6.2 + r, .1, 0, .07, .15, 60); for (let z = -29.6; z <= 29.7; z += .8) b.box("struct", s * 6.2, .06, z, 2.6, .12, .22); for (let z = -30; z <= 30.1; z += 6) b.cyl("struct", s * 2.4, z, 1.1, 4.8, .2, 8); }
    b.slab(-4.5, -30, 4.5, 30, 5.1, .3, undefined, "roof"); b.ramp(-.75, 30, .75, 34, 1.1, 0, "base"); b.ramp(-.75, -34, .75, -30, 0, 1.1, "base");
  }, ["火车站", "站台", "铁路", "年代"]),

  sc("汽修厂·两跨·三扇卷帘门·办公室·24m×16m", "汽修厂：24m×16m 墙高 5.5 的车间（正面三个 4m 宽 4m 高的卷帘大门、各面高窗、双坡 12° 屋面），车间里两台举升机（2.4m×0.9m 的臂架加两根 0.3×2.0 的立柱）、一排工具柜和零件架，+x 角一间 5m×5m 的办公室，犯罪、改装车、追车和市井戏", b => {
    shed(b, -12, -8, 12, 8, 5.5, { roof: "gable", doors: 3, doorW: 4 });
    for (const x of [-5, 3]) { b.box("equip", x, .9, 0, 2.4, .12, .9); for (const s of [-1, 1]) b.box("equip", x + s * .9, 1, -.7, .3, 2, .3); } b.box("furn", -10.5, -6.8, 1, 5, 2, .6); b.box("furn", 9, -6.8, 1, 5, 2, .5);
    b.slab(12, -2.5, 17, 2.5, .3, .3); b.wall("x", 2.5, 12, 17, .3, 3, .2, [door(14.5, 1, 2.1), win(16, 1.2, 1.2, 1)]); b.wall("x", -2.5, 12, 17, .3, 3, .2); b.wall("z", 17, -2.5, 2.5, .3, 3, .2, [win(0, 1.4, 1.2, 1)]); b.slab(12, -2.8, 17.3, 2.8, 3.5, .2, undefined, "roof");
  }, ["汽修", "修车", "改装", "犯罪"]),

  sc("棚户区·铁皮屋群·三巷·二十一间·60m×36m", "棚户区：三排共 21 间 3–4.5m 见方、高 2.4–2.8 的铁皮 / 木板棚屋（每间一扇门一扇小窗、单坡铁皮屋面，错落 ±0.6m）夹出三条 1.2–2m 宽的窄巷，其中 6 间上面再叠一层 2.4m 高的棚屋并外挂一部 0.8m 宽的陡直梯，铁皮蓝、绿、锈红、灰木四种墙色，贫民窟、追逐、黑帮和反乌托邦戏", b => {
    for (const [k, n, c] of [["s1", "铁皮蓝", "#5b7d9a"], ["s2", "铁皮绿", "#6a8a6a"], ["s3", "铁皮锈", "#9a5a3a"], ["s4", "木板灰", "#8a8070"]] as [string, string, string][]) b.group(k, n, c, { roughness: .9 });
    let i = 0;
    for (const z0 of [-12, 0, 12]) for (let j = 0; j < 7; j++) {
      const w = 3 + hs(i + 1) * 1.5, d = 3 + hs(i + 2) * 1.5, h = 2.4 + hs(i + 3) * .4, x = -24 + j * 8 + (hs(i + 4) - .5) * 1.2, z = z0 + (hs(i + 5) - .5) * 1.2, key = `s${i % 4 + 1}`; i++;
      b.wall("x", z + d / 2, x - w / 2, x + w / 2, .1, h, .12, [door(x - w / 4, .8, 1.9)], key); b.wall("x", z - d / 2, x - w / 2, x + w / 2, .1, h, .12, [], key); for (const s of [-1, 1]) b.wall("z", x + s * w / 2, z - d / 2, z + d / 2, .1, h, .12, [win(z, .6, .6, 1.2)], key);
      b.strut("roof", [x - w / 2 - .3, .1 + h + .35, z], [x + w / 2 + .3, .1 + h, z], d + .6, .06);
      if (i % 3 === 0) { b.wall("x", z + d / 2 - .3, x - w / 2 + .2, x + w / 2 - .2, .1 + h, 2.4, .1, [win(x, .8, .6, 1)], key); b.wall("x", z - d / 2 + .3, x - w / 2 + .2, x + w / 2 - .2, .1 + h, 2.4, .1, [], key); for (const s of [-1, 1]) b.wall("z", x + s * (w / 2 - .2), z - d / 2 + .3, z + d / 2 - .3, .1 + h, 2.4, .1, [], key); b.strut("roof", [x - w / 2, .1 + h + 2.4 + .3, z], [x + w / 2, .1 + h + 2.4, z], d, .06); b.flight(x + w / 2 + .6, z + d / 2 - .2 + .6, "-z", .1, 12, .8, (h + .1) / 12, .2); }
    }
  }, ["棚户区", "贫民窟", "黑帮", "反乌托邦"]),

  sc("露天集市·棚架摊位·三排二十四个·36m×14m", "露天集市：三排共 24 个 3m×2.4m 的棚架摊位（四根 0.08m 立柱高 2.4、一块 8° 倾斜的彩色遮阳篷板、一张 3m×0.8m 高 0.9 的摊台），红、蓝、黄、绿四种篷色，排间 2.5m 过道，集市、逃亡、追逐和异国风情戏", b => {
    for (const [k, n, c] of [["a1", "篷红", "#c0392b"], ["a2", "篷蓝", "#2f6db3"], ["a3", "篷黄", "#e0b030"], ["a4", "篷绿", "#3f8a4f"]] as [string, string, string][]) b.group(k, n, c, { roughness: .9 });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) { const x = -15.75 + c * 4.5, z = -5.5 + r * 5.5, key = `a${(r * 3 + c) % 4 + 1}`; for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box("struct", x + sx * 1.45, 1.2, z + sz * 1.1, .08, 2.4, .08); b.tilt(key, [x, 2.55, z], [3.4, .06, 2.8], 0, 8); b.box("furn", x, .45, z + .4, 3, .9, .8); }
  }, ["集市", "摊位", "异国", "逃亡"]),

  sc("墓园·铁门·小礼拜堂·家族陵墓·碑林·40m×30m", "墓园：围墙 40m×30m 厚 0.4 高 2.0（正面 5m 宽的铁栅门、中间一扇半开着，加两根 1.0m 见方高 3m 的门柱），园内一座两开间的石砌小礼拜堂（9m×6m、硬山屋面）、两座单间家族陵墓（带山花）、六排每排八块的墓碑（0.6m×0.9m×0.12m、略有错落）和 8 个十字架，恐怖、葬礼、悬疑和哥特戏", b => {
    for (const [x0, z0, x1, z1] of [[-20, 15, -2.5, 15], [2.5, 15, 20, 15], [-20, -15, 20, -15], [-20, -15, -20, 15], [20, -15, 20, 15]] as [number, number, number, number][]) fenceRun(b, x0, z0, x1, z1, 2, .4);
    b.bars("x", 15, -2.5, 2.5, 0, 2.6, [[-.9, .9]]); for (const x of [-2.9, 2.9]) b.box("wall", x, 1.5, 15, 1, 3, 1);
    hall(b, { cx: 0, cz: -9, rot: 0, bays: 2, bay: 4.5, deep: 2, ph: .3, ch: 3.4, roof: "hard", steps: false }); for (const x of [-12, 12]) hall(b, { cx: x, cz: -9, rot: 0, bays: 1, bay: 4, deep: 1.3, ph: .3, ch: 3, roof: "hard", front: "wall", steps: false });
    for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) { const x = -14 + c * 4 + (hs(r * 8 + c) - .5) * .5, z = 9 - r * 2.8 - 5; b.box("wall", x, .45, z, .6, .9, .12); if ((r * 8 + c) % 6 === 0) { b.box("wall", x, 1.2, z, .12, .7, .12); b.box("wall", x, 1.1, z, .45, .12, .12); } }
  }, ["墓园", "葬礼", "哥特", "恐怖"]),

  lm("背景·摩天楼群·长160m·十六座", "城市天际线背景：十六座 34–82m 高的摩天楼（含顶部缩进和塔尖最高约 96m，单个模型坐标不能超过正负 100m）（沿 x 排开、两排前后错落，前排 14m 进深、后排 18m），每座主体加缩进的顶部、塔尖或天线，立面每 6m 一条通长玻璃带，用作远景布景和城市背板，大都市、科幻、犯罪和灾难戏（实心体量不可进入）", b => {
    const hh = [34, 52, 78, 46, 64, 40, 82, 56, 44, 72, 36, 60, 50, 80, 42, 54];
    hh.forEach((h, i) => { const x = -75 + i * 10, back = i % 2, z = back ? -14 : 4, w = 8 + hs(i) * 1.6, d = back ? 18 : 14; b.box("wall", x, h / 2, z, w, h, d); b.box("wall", x, h + 3, z, w * .7, 6, d * .7); b.box("struct", x, h + 10, z, .3, 8, .3); for (let y = 6; y < h; y += 6) b.box("glass", x, y, z + d / 2 + .02, w - .6, 1.6, .04); });
  }, ["天际线", "摩天楼", "背景", "都市"]),

  sc("海滨·栈道·救生塔·三间沙滩棚屋", "海滨场景：40m 长 3m 宽、标高 0.5 的木栈道（立柱每 3m 一对、两侧 1.0m 高栏杆）、栈道端部一座木救生塔（四根斜柱高 3.2、平台上 2.0m 见方高 2.2m 的小屋带前窗、单坡屋面、一部 0.9m 宽的陡直梯）、栈道一侧三间 3m 见方高 2.8m 的沙滩棚屋（一门一窗、双坡 20° 屋面），海滩、度假、救援和惊悚戏", b => {
    b.slab(-20, -1.5, 20, 1.5, .5, .15, undefined, "floor"); for (let x = -20; x <= 20.1; x += 3) for (const z of [-1.3, 1.3]) b.cyl("struct", x, z, 0, .45, .12, 8); b.rail(-20, -1.5, 20, -1.5, .5); b.rail(-20, 1.5, 20, 1.5, .5); b.steps(0, 20, "+x", 3, .5); b.steps(0, -20, "-x", 3, .5);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.strut("struct", [24 + sx * 1.6, 0, sz * 1.6], [24 + sx * 1.3, 3.2, sz * 1.3], .2, .2); b.slab(22.3, -1.7, 25.7, 1.7, 3.3, .15, undefined, "floor");
    b.wall("x", 1, 23, 25, 3.3, 2.2, .08, [win(24, 1.2, 1, 1)]); b.wall("x", -1, 23, 25, 3.3, 2.2, .08); for (const sx of [-1, 1]) b.wall("z", 24 + sx, -1, 1, 3.3, 2.2, .08); b.strut("roof", [22.6, 5.9, 0], [25.4, 5.5, 0], 2.6, .06); b.flight(24, 4.6, "-z", 0, 14, .9, 3.3 / 14, .3);
    for (const x of [-12, -4, 6]) hall(b, { cx: x, cz: 6, rot: 180, bays: 1, bay: 3, deep: 1, ph: .15, ch: 2.8, roof: "gable", pitch: 20, steps: false });
  }, ["海滨", "沙滩", "救生塔", "度假"]),

  lm("无线电格构塔·截面3m·高80m", "无线电（通信）格构塔：3m 见方截面、高 80m 的方形格构塔（四根 0.25m 角钢立柱、每 4m 一道水平环撑、四个侧面每格一对交叉斜撑，共 20 格），40m 和 78m 处各一块 5m 见方的检修平台（带 1.05m 栏杆），塔顶 4m 天线，塔脚一间 3m×3m×2.6m 的设备房，战争、监听、悬疑和灾难戏", b => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.col(sx * 1.5, sz * 1.5, 0, 80, .25);
    for (let j = 0; j < 20; j++) { const y0 = j * 4, y1 = y0 + 4; for (const s of [-1, 1]) { b.beamH("x", s * 1.5, -1.5, 1.5, y1, .12, .12); b.beamH("z", s * 1.5, -1.5, 1.5, y1, .12, .12); b.strut("struct", [-1.5, y0, s * 1.5], [1.5, y1, s * 1.5], .1, .1); b.strut("struct", [1.5, y0, s * 1.5], [-1.5, y1, s * 1.5], .1, .1); b.strut("struct", [s * 1.5, y0, -1.5], [s * 1.5, y1, 1.5], .1, .1); b.strut("struct", [s * 1.5, y0, 1.5], [s * 1.5, y1, -1.5], .1, .1); } }
    for (const y of [40, 78]) { b.slab(-2.5, -2.5, 2.5, 2.5, y, .15, undefined, "floor"); b.rail(-2.5, -2.5, 2.5, -2.5, y); b.rail(-2.5, 2.5, 2.5, 2.5, y); b.rail(-2.5, -2.5, -2.5, 2.5, y); b.rail(2.5, -2.5, 2.5, 2.5, y); }
    b.col(0, 0, 80, 84, .1); b.slab(4, -1.5, 7, 1.5, .2, .2); b.wall("x", 1.5, 4, 7, .2, 2.4, .15, [door(5.5, .9, 2)]); b.wall("x", -1.5, 4, 7, .2, 2.4, .15); for (const x of [4, 7]) b.wall("z", x, -1.5, 1.5, .2, 2.4, .15); b.slab(3.8, -1.7, 7.2, 1.7, 2.8, .15, undefined, "roof");
  }, ["通信塔", "无线电", "监听", "战争"]),

  lm("风力发电机·塔高60m·叶片34m", "风力发电机：锥形塔筒（径 4.4 收到 2.8、高 60m、16 面）、机舱 4m×3m×10m、轮毂锥，三片各长 34m 的叶片（等分 120°、弦宽 2.2、厚 0.3，转子平面朝 +z、叶尖最高约 94m），塔脚一间 2.4m 见方的检修门，乡村、能源、末日和科幻戏", b => {
    ringWall(b, "wall", 2.15, .3, 0, 3, 16, i => i === 0 ? 2.3 : undefined); cone(b, "wall", 2.16, 3, 1.4, 60, 16, .3); b.box("wall", 0, 61.5, 2, 3, 3, 10); b.cyl("struct", 0, 60, 0, 60.1, .1, 8);
    for (const a of [0, 120, 240]) { const s = Math.sin(a * DEG), c = Math.cos(a * DEG); b.strut("roof", [0, 61.5, 7.2], [34 * s, 61.5 + 34 * c, 7.2], .3, 2.2); }
    b.box("equip", 0, 61.5, 7.2, 1.6, 1.6, 1.4);
  }, ["风电", "风车", "乡村", "能源"]),
];

void CLEAR; void SLAB; void WT; void ringWall;
