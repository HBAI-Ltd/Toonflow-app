import type { P, RuinBuilder } from "./ruinKit";
import { pillar } from "./ruinProps";
import { filmRoom } from "./filmSetBatchOne";
import { barrel, bed, bowl, bulb, bunkBed, cabinet, candle, chain, chair, chest, desk, drawerGrid, fileCabinet, framed, hospitalBed, ivStand, labBench, lantern, loc, mirror, monitor, papers, plainTable, seat, shelf, stool, surgeryTable, table, tableLamp, tubeLight } from "./setDressing";
import type { ArchitecturePrototype } from "./structures";

// 影视内景置景·现代与惊悚末日：审讯室、警局办公室、手术室、太平间、实验室、被翻乱的出租屋、老小区楼梯间、地下停车场，
// 疯人院软壁囚室、地下避难所、闹鬼阁楼。冷白管灯用发光材质，门上有窗口和标识。
/** 墙上的一道细划痕（折线）。 */
const scratch = (b: RuinBuilder, pts: P[], key = "soot") => { for (let k = 0; k + 1 < pts.length; k++) b.beam(key, pts[k]!, pts[k + 1]!, .006, .006); };

export const filmSetDesignsTwo: ArchitecturePrototype[] = [
  filmRoom("现代审讯室三壁内景单向玻璃", "影视置景·现代：警局审讯室，灰墙三面围合，后墙整面单向玻璃，金属桌两侧各一把椅子，桌上手铐环、卷宗和水杯，顶上冷光管灯，墙角摄像头，左侧铁门", "现代", "原始",
    { seed: "现代审讯室三壁内景单向玻璃", w: 4.8, d: 4.0, h: 3.0, pal: { wall: "#8f979a", trim: "#4a4f52", wood: "#707880", woodD: "#2a2d30", floorA: "#6d7072", floorB: "#64676a", metal: "#9aa0a4" }, floor: "concrete", dirt: .15,
      openings: [{ wall: "left", u: .9, w: 1.0, kind: "door", leaf: "closed", h: 2.1 }] },
    (b, c) => {
      const { y, D, W } = c, bz = -D / 2;
      mirror(b, 0, y + 1.55, bz + .06, 0, 2.6, 1.2, "dark");
      plainTable(b, 0, y, 0, 0, 1.6, .8, .76, "steel");
      seat(b, -1.15, y, 0, 90, "metal", false, .46); seat(b, 1.15, y, 0, 270, "metal", false, .46);
      b.boxYaw("paper", .2, y + .775, .1, .3, .02, .22, 12); pillar(b, "porcelain", -.25, .2, y + .76, y + .86, .04, { sides: 8 }); tableLamp(b, .55, y + .76, -.2, "metal");
      b.sphere("metal", [-.6, y + .79, 0], .035); chain(b, [-.6, y + .79, 0], [-.95, y + .5, .05], .08);
      tubeLight(b, 0, y + 2.75, 0, 1.4, 0, "lampCold"); for (const s of [-1, 1]) b.beam("metal", [s * .6, y + 2.78, 0], [s * .6, y + 2.98, 0], .015, .015);
      b.boxYaw("dark", W / 2 - .3, y + 2.6, bz + .3, .24, .16, .3, 45); b.sphere("red", [W / 2 - .42, y + 2.6, bz + .42], .025);
    }, ["审讯室", "警局", "犯罪"]),

  filmRoom("现代警局办公室三壁内景证物板", "影视置景·现代：刑侦办公室，浅灰墙三面围合，四张带显示器的办公桌，后墙档案柜、贴满照片和红线的软木证物板与白板，窗边挂百叶窗，冷白管灯，饮水机", "现代", "原始",
    { seed: "现代警局办公室三壁内景证物板", w: 7.2, d: 5.4, h: 3.1, pal: { wall: "#c9cbc4", trim: "#8a8d88", wood: "#8a6a4a", woodD: "#3a3c40", floorA: "#5e6672", floorB: "#566070", curtain: "#6a7a8a", metal: "#6f7478" }, floor: "carpet",
      openings: [{ wall: "right", u: -.6, w: 2.0, kind: "window", sill: 1.0, h: 1.4, muntins: 3, curtain: true }, { wall: "left", u: 1.5, w: 1.1, kind: "door", leaf: "ajar", h: 2.1 }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      for (let k = 0; k < 4; k++) fileCabinet(b, -3.0 + k * .55, y, bz + .35, 0, 4, "metal");
      const bx = .9, by = y + 1.7, bzz = bz + .04;
      b.boxYaw("woodD", bx, by, bzz, 2.7, 1.4, .03, 0); b.boxYaw("cork", bx, by, bzz + .02, 2.6, 1.3, .02, 0);
      const pts: [number, number][] = [[-.9, .3], [-.3, .4], [.5, .25], [1.1, .35], [-.6, -.25], [.2, -.3], [.9, -.2]];
      for (const [dx, dy] of pts) b.boxYaw("paper", bx + dx, by + dy, bzz + .04, .26, .2, .006, rng.range(-12, 12));
      for (let k = 0; k + 1 < pts.length; k++) b.beam("red", [bx + pts[k]![0], by + pts[k]![1], bzz + .05], [bx + pts[k + 1]![0], by + pts[k + 1]![1], bzz + .05], .004, .004);
      b.boxYaw("porcelain", 2.95, y + 1.7, bz + .06, 1.0, .9, .02, 0); for (let k = 0; k < 5; k++) b.beam("dark", [2.55, y + 2.0 - k * .15, bz + .075], [2.55 + rng.range(.3, .8), y + 2.0 - k * .15 + rng.range(-.04, .04), bz + .075], .006, .006);
      for (const [x, z] of [[-2.2, -1.0], [.3, -1.0], [-2.2, 1.1], [.3, 1.1]] as [number, number][]) {
        desk(b, x, y, z, 0, 1.4, .7, .76, "wood"); monitor(b, x + .15, y + .76, z - .12, 0, true); papers(b, rng, x - .3, z + .1, y + .76, .3, .15, 3);
        seat(b, x, y, z + .75, 180, "woodD", false, .5); tubeLight(b, x, y + 3.0, z, 1.3, 0, "lampCold");
      }
      pillar(b, "porcelain", 3.1, .2, y, y + .9, .17, { sides: 10 }); pillar(b, "glass", 3.1, .2, y + .9, y + 1.45, .15, { sides: 10 });
      pillar(b, "woodD", 3.1, 2.0, y, y + .35, .2, { sides: 8 }); b.sphere("leaf", [3.1, y + .75, 2.0], .35);
    }, ["警局", "办公室", "刑侦"]),

  filmRoom("现代手术室三壁内景无影灯", "影视置景·现代：医院手术室，瓷砖墙三面围合，手术台上方两盏圆形无影灯亮着，旁边输液架、监护仪、器械台，后墙器械柜和洗手池，右侧双开门上方“手术中”红灯亮起", "现代", "原始",
    { seed: "现代手术室三壁内景无影灯", w: 6.4, d: 5.2, h: 3.2, pal: { wall: "#d9e2df", wainscot: "#a9c4bc", trim: "#8fa6a1", wood: "#c8d0d0", woodD: "#6f7f7d", floorA: "#9fb3ae", floorB: "#93a8a3", metal: "#9aa5a8" }, floor: "tile", tileSize: .5, wainscot: 1.5,
      openings: [{ wall: "right", u: .6, w: 1.8, kind: "door", leaf: "closed", h: 2.2 }, { wall: "left", u: -.4, w: 1.3, kind: "window", sill: 1.1, h: 1.1, backing: "day" }] },
    (b, c) => {
      const { y, D, H } = c, bz = -D / 2;
      surgeryTable(b, 0, y, .1, 0);
      for (const x of [-.35, .35]) { pillar(b, "steel", x, .1, y + 2.5, y + 2.56, .38, { sides: 14 }); pillar(b, "lampCold", x, .1, y + 2.46, y + 2.5, .32, { sides: 14 }); b.beam("steel", [x, y + 2.56, .1], [x, y + H, .1], .04, .04); }
      ivStand(b, -1.0, y, -.3); ivStand(b, 1.0, y, -.45);
      plainTable(b, 1.5, y, .7, 0, .7, .45, .8, "steel"); monitor(b, 1.5, y + .8, .7, 270, true, .45, .32);
      plainTable(b, -1.5, y, .6, 0, .9, .5, .95, "steel"); for (let k = 0; k < 5; k++) b.boxYaw("steel", -1.8 + k * .15, y + .96, .6, .1, .015, .03, 20 * k);
      for (const x of [-2.4, -1.4, -.4]) { b.box("steel", x, y + .5, bz + .3, .9, 1.0, .55); b.box("dark", x, y + 1.02, bz + .3, .94, .04, .58); b.box("steel", x, y + 1.95, bz + .2, .9, .9, .32); b.box("glass", x, y + 1.95, bz + .37, .84, .82, .01); }
      b.box("steel", 1.4, y + .5, bz + .3, 1.1, 1.0, .55); b.box("dark", 1.4, y + 1.02, bz + .3, 1.14, .04, .58); b.beam("steel", [1.4, y + 1.04, bz + .12], [1.4, y + 1.35, bz + .12], .03, .03); b.beam("steel", [1.4, y + 1.35, bz + .12], [1.4, y + 1.3, bz + .3], .03, .03);
      const [px, py, pz] = c.wallPoint("right", .6, y + 2.5, .06); b.boxYaw("lampRed", px, py, pz, .05, .25, .6, 0);
      const [vx, vy, vz] = c.wallPoint("left", 1.7, y + 1.7, .04); b.boxYaw("screen", vx, vy, vz, .04, .6, .9, 0);
    }, ["手术室", "医院", "医疗"]),

  filmRoom("现代太平间三壁内景冷藏柜", "影视置景·现代：医院太平间，白瓷砖三面围合，后墙整排不锈钢冷藏抽屉、其中一格拉出盖着白布，中央解剖台，旁边推床、吊秤和洗手池，冷白管灯", "现代", "原始",
    { seed: "现代太平间三壁内景冷藏柜", w: 6.4, d: 5.2, h: 3.2, pal: { wall: "#cfd8d8", wainscot: "#a9bcbc", trim: "#7f9494", wood: "#b8c0c2", woodD: "#5c6a6c", floorA: "#8f9a9c", floorB: "#858f91", metal: "#98a2a6" }, floor: "tile", tileSize: .5, wainscot: 1.6, dirt: .15,
      openings: [{ wall: "right", u: .8, w: 1.3, kind: "door", leaf: "closed", h: 2.1 }] },
    (b, c) => {
      const { y, D } = c, bz = -D / 2;
      drawerGrid(b, 0, y + .35, bz + .37, 0, 5, 3, .7, .5, .7, "steel", "metal");
      const ox = .72, oy = y + .35 + .25 + .52;
      b.boxYaw("steel", ox, oy - .2, bz + .72 + .95, .62, .05, 1.9, 0); b.boxYaw("drape", ox, oy - .095, bz + .72 + 1.05, .46, .16, 1.65, 0); b.sphere("drape", [ox, oy - .02, bz + .72 + .28], .13); b.boxYaw("paper", ox, oy - .16, bz + .72 + 1.9, .1, .01, .14, 0);
      b.boxYaw("steel", 0, y + .9, 1.0, .7, .06, 2.0, 0); for (const s of [-1, 1]) b.boxYaw("steel", s * .35, y + .95, 1.0, .04, .08, 2.0, 0);
      pillar(b, "steel", 0, 1.0, y, y + .88, .12, { sides: 8 }); b.boxYaw("steel", 0, y + .05, 1.0, .8, .1, .8, 0);
      hospitalBed(b, -1.9, y, 1.4, 90, .8, 1.9); b.boxYaw("drape", -1.9, y + .66, 1.4, 1.7, .1, .6, 0);
      b.beam("steel", [1.9, y + 3.0, .6], [1.9, y + 2.1, .6], .02, .02); pillar(b, "steel", 1.9, .6, y + 2.05, y + 2.1, .22, { sides: 12 }); for (const a of [0, 120, 240]) b.beam("steel", [1.9, y + 2.05, .6], [1.9 + Math.cos(a * Math.PI / 180) * .18, y + 1.78, .6 + Math.sin(a * Math.PI / 180) * .18], .008, .008); pillar(b, "steel", 1.9, .6, y + 1.75, y + 1.78, .2, { sides: 12 });
      b.box("steel", -2.6, y + .45, bz + .35, 1.0, .9, .6); b.box("dark", -2.6, y + .92, bz + .35, 1.04, .04, .64); b.beam("steel", [-2.6, y + .94, bz + .15], [-2.6, y + 1.25, bz + .15], .03, .03);
      const [px, py, pz] = c.wallPoint("left", .2, y + 1.6, .03); b.boxYaw("woodD", px, py, pz, .02, .42, .32, 0); b.boxYaw("paper", px + .012, py, pz, .01, .36, .26, 0);
      for (const [x, z] of [[-1.5, .6], [0, 1.0], [1.5, .6]] as [number, number][]) tubeLight(b, x, y + 3.05, z, 1.3, 0, "lampCold");
    }, ["太平间", "医院", "停尸房"]),

  filmRoom("现代实验室三壁内景通风橱", "影视置景·现代：化学实验室，白墙瓷砖三面围合，两张实验岛台摆满玻璃器皿和显微镜，后墙通风橱和试剂架，白板写满公式，墙上危险警示和洗眼器标识，冷白管灯", "现代", "原始",
    { seed: "现代实验室三壁内景通风橱", w: 7.2, d: 5.4, h: 3.2, pal: { wall: "#dde4e4", wainscot: "#aebbc0", trim: "#8a9a9e", wood: "#c0c8ca", woodD: "#4a5558", floorA: "#a4adb0", floorB: "#99a3a6", metal: "#9aa4a8" }, floor: "tile", tileSize: .6, wainscot: 1.2,
      openings: [{ wall: "left", u: 1.4, w: 1.1, kind: "door", leaf: "closed", h: 2.1 }, { wall: "right", u: -.6, w: 2.0, kind: "window", sill: 1.1, h: 1.2, backing: "day", muntins: 3 }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      labBench(b, rng, -1.2, y, .3, 0, 2.6, .8, .9); labBench(b, rng, 1.6, y, .3, 0, 2.6, .8, .9);
      for (const x of [-1.8, -.6, 1.0, 2.2]) stool(b, x, y, 1.1, "steel", .22, .62);
      b.box("steel", -2.4, y + .5, bz + .4, 1.8, 1.0, .75); b.box("dark", -2.4, y + 1.02, bz + .4, 1.84, .04, .78); b.box("steel", -2.4, y + 2.2, bz + .4, 1.8, .6, .75); b.box("glass", -2.4, y + 1.6, bz + .78, 1.7, .9, .02);
      shelf(b, rng, .8, y, bz + .2, 0, 2.2, 2.2, .35, 4, "steel", false);
      const rowH = (2.2 - .06) / 4;
      for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) pillar(b, rng.pick(["glass", "liquid", "porcelain", "red"]), -.2 + i * .24, bz + .2, y + .045 + r * rowH, y + .045 + r * rowH + rng.range(.14, .26), .045, { sides: 8 });
      b.boxYaw("porcelain", 2.9, y + 1.7, bz + .05, 1.2, .9, .03, 0); for (let k = 0; k < 6; k++) b.beam("dark", [2.4, y + 2.05 - k * .13, bz + .07], [2.4 + rng.range(.3, .9), y + 2.05 - k * .13 + rng.range(-.05, .05), bz + .07], .006, .006);
      b.box("dark", -1.9, y + .94, .1, .18, .05, .24); b.beam("dark", [-1.9, y + .96, .0], [-1.9, y + 1.25, .0], .04, .04); b.beam("steel", [-1.9, y + 1.25, .0], [-1.9, y + 1.1, .12], .03, .03);
      monitor(b, 1.2, y + .9, .45, 0, true, .4, .28);
      const [hx, hy, hz] = c.wallPoint("left", -1.2, y + 1.8, .03); b.boxYaw("hazard", hx, hy, hz, .03, .5, .5, 0);
      const [ex, ey, ez] = c.wallPoint("left", -2.0, y + 1.8, .03); b.boxYaw("signGreen", ex, ey, ez, .03, .3, .5, 0);
      for (const [x, z] of [[-1.5, 0], [1.5, 0], [-1.5, 1.6], [1.5, 1.6]] as [number, number][]) tubeLight(b, x, y + 3.05, z, 1.3, 0, "lampCold");
    }, ["实验室", "科研"]),

  filmRoom("现代凌乱出租屋被翻乱三壁内景", "影视置景·现代：出租屋，三面旧墙围合，家具被翻得乱七八糟——桌椅倒地、衣柜门敞开衣物拖了一地、抽屉拉出、纸张满地、床单被掀到地上，窗帘半垂，适合案发现场或被搜查后的镜头", "现代", "老旧",
    { seed: "现代凌乱出租屋被翻乱三壁内景", w: 5.0, d: 4.2, h: 2.9, pal: { wall: "#c8c0ae", trim: "#8a8478", wood: "#8a7458", woodD: "#3a3228", floorA: "#9a8a74", floorB: "#8f7f6a", curtain: "#7a8a7a", metal: "#7a7d80" }, floor: "plank", plank: .18, dirt: .55,
      openings: [{ wall: "back", u: 1.2, w: 1.2, kind: "window", sill: .95, h: 1.3, muntins: 2, curtain: true }, { wall: "left", u: 1.1, w: .9, kind: "door", leaf: "ajar", h: 2.05 }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      bed(b, rng, 1.3, y, bz + 1.05, 0, 1.3, 2.0, "wood", true);
      b.tbox("cloth", [1.3, y + .62, .3], [1.0, .08, .8], 15, 0, 6); b.dune("cloth", rng, .6, 1.0, .7, .5, .1, 30, y);
      cabinet(b, rng, -1.7, y, bz + .3, 0, 1.2, 1.9, .55, "wood", 0);
      for (const [dx, dz, r] of [[-1.5, -.4, .5], [-.9, .3, .4], [-2.0, .5, .35]] as [number, number, number][]) b.dune(rng.pick(["cloth", "curtain", "drape"]), rng, dx, dz, r, r * .8, .1, rng.range(0, 90), y);
      table(b, rng, -1.0, y, 1.0, 20, 1.1, .6, .75, "wood", true); chair(b, rng, -.2, y, 1.2, 130, "wood", true);
      papers(b, rng, 0, .4, y, 1.4, 1.0, 22);
      for (let k = 0; k < 6; k++) b.boxYaw(rng.pick(["book1", "book2", "book3"]), rng.range(-1.2, .6), y + .04 + (k % 2) * .05, rng.range(-.5, 1.2), .2, .04, .15, rng.range(0, 180));
      b.boxYaw("woodD", -.4, y + .2, bz + 1.4, .5, .22, .4, 35); b.boxYaw("woodD", .2, y + .1, bz + 1.9, .5, .22, .4, -20);
      b.tbox("woodD", [-.6, y + 1.85, bz + .04], [.5, .4, .04], 0, 0, 14); b.sphere("lamp", [.3, y + .09, 1.5], .09);
    }, ["出租屋", "案发现场", "凌乱", "被翻乱", "搜查"]),

  filmRoom("现代老旧小区楼梯间三壁内景", "影视置景·现代：老旧居民楼楼梯间，绿墙裙白墙，混凝土楼梯两跑加休息平台、铁栏杆，左侧一层住户木门、一排绿色信箱，墙上贴满小广告，裸灯泡，墙皮污渍斑驳，追逐和蹲守戏常用", "现代", "老旧",
    { seed: "现代老旧小区楼梯间三壁内景", w: 3.8, d: 5.4, h: 3.8, pal: { wall: "#d4d0c4", wainscot: "#5a8a6c", trim: "#4a6a58", wood: "#7a5a3a", woodD: "#3a3a3a", floorA: "#8a8a86", floorB: "#7e7e7a", metal: "#5a5a5a" }, floor: "concrete", wainscot: 1.5, dirt: .5,
      openings: [{ wall: "left", u: 1.5, w: 1.0, kind: "door", leaf: "closed", h: 2.1 }, { wall: "back", u: -.4, w: 1.0, kind: "window", sill: 2.4, h: 1.0, muntins: 2 }] },
    (b, c) => {
      const { y, D, W, H, rng } = c, bz = -D / 2, rise = .18, run = .27, n = 9, topA = y + n * rise, z0 = D / 2 - .3, z1 = z0 - n * run, xa = W / 2 - .65, xb = -xa;
      for (let k = 0; k < n; k++) b.box("stone", xa, y + (k + 1) * rise / 2, z0 - (k + .5) * run, 1.2, (k + 1) * rise, run);
      b.box("stone", 0, y + n * rise / 2, (bz + z1) / 2, W, n * rise, z1 - bz);
      for (let k = 0; k < n; k++) { b.box("stone", xb, topA + (k + 1) * rise - .03, z1 + (k + .5) * run, 1.2, .06, run); b.box("stone", xb, topA + k * rise + rise / 2, z1 + k * run + .015, 1.2, rise, .03); }
      b.plate("stone", [xb - .6, topA - .14, z1], [xb + .6, topA - .14, z1], [xb + .6, topA + n * rise - .14, z1 + n * run], [xb - .6, topA + n * rise - .14, z1 + n * run], .12);
      b.box("stone", xb, topA + n * rise - .07, D / 2 - .15, 1.2, .14, .3);
      b.beam("metal", [xa - .58, y + rise + .9, z0 - .15], [xa - .58, topA + .9, z1 + .15], .05, .05);
      for (let k = 0; k < n; k += 2) b.beam("metal", [xa - .58, y + (k + 1) * rise, z0 - (k + .5) * run], [xa - .58, y + (k + 1) * rise + .9, z0 - (k + .5) * run], .03, .03);
      b.beam("metal", [xb + .58, topA + rise + .9, z1 + .15], [xb + .58, topA + n * rise + .9, z1 + n * run - .15], .05, .05);
      for (let k = 0; k < n; k += 2) b.beam("metal", [xb + .58, topA + (k + 1) * rise, z1 + (k + .5) * run], [xb + .58, topA + (k + 1) * rise + .9, z1 + (k + .5) * run], .03, .03);
      b.beam("metal", [xb + .58, topA + .9, z1 + .02], [xa - .58, topA + .9, z1 + .02], .05, .05);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const [px, py, pz] = c.wallPoint("left", .2 + i * .3, y + 1.0 + j * .28, .08); b.box("wainscot", px, py, pz, .14, .24, .26); }
      for (let k = 0; k < 8; k++) b.boxYaw(k % 4 === 0 ? "red" : "paper", rng.range(-1.5, 1.5), topA + rng.range(.3, .8), bz + .04, .22, .3, .006, rng.range(-8, 8));
      pillar(b, "metal", -W / 2 + .1, bz + .1, y, y + H, .05, { sides: 6 }); bulb(b, 0, y + 3.4, -1.0, .35);
      pillar(b, "metal", xb + .1, 1.8, y, y + .45, .2, { sides: 8 });
    }, ["楼梯间", "楼道", "居民楼", "追逐"]),

  filmRoom("现代地下停车场一角三壁内景", "影视置景·现代：地下停车场一角，混凝土三面围合，地面车位线和挡车杆，黄黑警示柱、顶上外露管线和电缆桥架、几盏冷白灯有一盏已经熄灭，右侧防火门上亮着绿色安全出口灯，油污斑驳", "现代", "老旧",
    { seed: "现代地下停车场一角三壁内景", w: 8.4, d: 6.4, h: 3.4, pal: { wall: "#a8a8a2", trim: "#6a6a66", wood: "#7a7a76", woodD: "#3a3a3a", floorA: "#7a7b78", floorB: "#707174", metal: "#6f7478" }, floor: "concrete", baseboard: false, crown: false, dirt: .6,
      openings: [{ wall: "right", u: -1.0, w: 1.4, kind: "door", leaf: "closed", h: 2.2 }] },
    (b, c) => {
      const { y, D, W, H, rng } = c, bz = -D / 2, yt = y + .006, up: P = [0, 1, 0];
      for (const x of [-3.9, -1.3, 1.3, 3.9]) b.quad("paint", [x - .05, yt, bz + .05], [x + .05, yt, bz + .05], [x + .05, yt, bz + 5.0], [x - .05, yt, bz + 5.0], up);
      for (const x of [-2.6, 0, 2.6]) b.box("stone", x, y + .07, bz + .6, 1.4, .14, .2);
      for (const x of [-1.3, 1.3]) { b.box("stone", x, y + H / 2, -.4, .7, H, .7); for (let k = 0; k < 3; k++) b.box(k % 2 ? "dark" : "hazard", x, y + .2 + k * .35, -.4, .73, .35, .73); }
      b.beam("metal", [-W / 2, y + H - .5, -2.0], [W / 2, y + H - .5, -2.0], .16, .16); b.beam("rust", [-W / 2, y + H - .5, 1.6], [W / 2, y + H - .5, 1.6], .12, .12);
      b.box("metal", 0, y + H - .15, .6, W, .08, .4); b.box("stone", 0, y + H - .3, 2.4, W, .6, .45);
      tubeLight(b, -2.6, y + H - .72, -.8, 1.2, 0, "lampCold"); tubeLight(b, 0, y + H - .72, -.8, 1.2, 0, "lampCold"); tubeLight(b, 2.6, y + H - .72, -.8, 1.2, 0, "dark");
      const [px, py, pz] = c.wallPoint("right", -1.0, y + 2.6, .05); b.boxYaw("signGreen", px, py, pz, .05, .22, .7, 0);
      b.boxYaw("hazard", 0, y + 2.3, bz + .05, 1.2, .6, .04, 0); b.boxYaw("dark", -.25, y + 2.3, bz + .075, .1, .34, .01, 0); b.boxYaw("dark", .15, y + 2.3, bz + .075, .3, .08, .01, 0); b.boxYaw("dark", .15, y + 2.15, bz + .075, .3, .08, .01, 0); b.boxYaw("dark", .15, y + 2.45, bz + .075, .3, .08, .01, 0);
      b.box("red", 3.3, y + 1.2, bz + .14, .5, .8, .2); b.box("glass", 3.3, y + 1.2, bz + .25, .4, .7, .02);
      for (let k = 0; k < 7; k++) { const x = rng.range(-3.5, 3.5), z = rng.range(bz + 1.0, 1.5), w = rng.range(.4, 1.0); b.quad("soot", [x, yt + .002, z], [x + w, yt + .002, z], [x + w * .9, yt + .002, z + w * .8], [x, yt + .002, z + w * .6], up); }
    }, ["停车场", "地下车库", "车库"]),

  filmRoom("惊悚疯人院软壁囚室三壁内景", "影视置景·惊悚：旧精神病院的软壁隔离室，三面包着软垫的墙地、竖向缝线，铁门上开观察窗，屋顶笼罩的冷光灯，地上一张脏床垫、固定铁环和铁链，墙上密密的抓痕与划痕", "现代", "老旧",
    { seed: "惊悚疯人院软壁囚室三壁内景", w: 3.8, d: 3.6, h: 3.2, pal: { wall: "#d6d2c4", stripe: "#e6e2d4", trim: "#a39e90", wood: "#c8c3b4", woodD: "#3a3a3a", floorA: "#bdb8a8", floorB: "#b2ad9d", metal: "#6a6d70" }, floor: "carpet", stripes: true, crown: false, baseboard: false, dirt: .7,
      openings: [{ wall: "left", u: .2, w: .9, kind: "door", leaf: "closed", h: 2.0 }] },
    (b, c) => {
      const { y, rng } = c;
      const [sx, sy, sz] = c.wallPoint("left", .2, y + 1.55, .035); b.boxYaw("dark", sx, sy, sz, .02, .14, .3, 0);
      b.boxYaw("cloth", -.7, y + .09, -.8, .9, .16, 1.9, 20);
      pillar(b, "metal", .5, .3, y, y + .04, .05, { sides: 8 }); chain(b, [.5, y + .04, .3], [.8, y + .02, .9], .03); bowl(b, 1.0, y, 1.0, .1, .04, "metal");
      b.sphere("lampCold", [0, y + 2.75, -.2], .13); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; b.beam("metal", [Math.cos(a) * .2, y + 2.95, -.2 + Math.sin(a) * .2], [Math.cos(a) * .2, y + 2.55, -.2 + Math.sin(a) * .2], .01, .01); }
      b.beam("metal", [0, y + 2.9, -.2], [0, y + 3.2, -.2], .02, .02);
      for (let g = 0; g < 7; g++) {
        const u = -1.4 + g * .22, yy = y + 1.3 + rng.range(-.1, .1);
        for (let s = 0; s < 4; s++) scratch(b, [c.wallPoint("back", u + s * .035, yy, .02), c.wallPoint("back", u + s * .035, yy + .25, .02)]);
        scratch(b, [c.wallPoint("back", u - .03, yy + .04, .02), c.wallPoint("back", u + .15, yy + .2, .02)]);
      }
    }, ["精神病院", "隔离室", "软壁", "恐怖"]),

  filmRoom("末日地下避难所三壁内景", "影视置景·末日：地下避难所，毛坯混凝土三面围合，左侧圆轮防爆铁门，两组上下铺、码满罐头的货架、水桶、发电机，桌上电台和手摇灯，墙上手绘地图，顶上外露管线，灯光昏黄", "废土", "老旧",
    { seed: "末日地下避难所三壁内景", w: 6.6, d: 4.8, h: 3.0, pal: { wall: "#8c8e88", trim: "#5a5c58", wood: "#4f5558", woodD: "#2a2c2e", floorA: "#6b6d69", floorB: "#60625e", metal: "#6f7478" }, floor: "concrete", crown: false, baseboard: false, dirt: .5,
      openings: [{ wall: "left", u: -.4, w: 1.2, kind: "door", leaf: "closed", h: 2.0 }] },
    (b, c) => {
      const { y, D, W, H, rng } = c, bz = -D / 2;
      bunkBed(b, -2.0, y, bz + 1.0, 0, .9, 1.9, "metal"); bunkBed(b, 2.0, y, bz + 1.0, 0, .9, 1.9, "metal");
      shelf(b, rng, 0, y, bz + .2, 0, 1.6, 2.0, .4, 4, "metal", false);
      const rowH = (2.0 - .06) / 4;
      for (let r = 0; r < 4; r++) for (let i = 0; i < 7; i++) pillar(b, rng.pick(["red", "paint", "porcelain", "steel"]), -.66 + i * .22, bz + .2, y + .045 + r * rowH, y + .045 + r * rowH + .12, .04, { sides: 8 });
      barrel(b, 2.85, y, .2, .3, .9, "metal"); barrel(b, 2.85, y, 1.0, .3, .9, "metal");
      plainTable(b, .3, y, 1.0, 0, 1.2, .7, .76, "woodD"); b.box("metal", .1, y + .87, 1.0, .4, .22, .25); b.beam("metal", [.2, y + .98, 1.0], [.3, y + 1.6, .95], .01, .01); tableLamp(b, .6, y + .76, 1.2, "metal"); stool(b, -.3, y, 1.7, "woodD", .2);
      b.box("metal", -2.6, y + .4, 1.2, .8, .7, .6); b.beam("rust", [-2.8, y + .75, 1.2], [-2.8, y + H - .2, 1.2], .08, .08);
      const [wx, wy, wz] = c.wallPoint("left", -.4, y + 1.05, .1);
      for (let k = 0; k < 12; k++) { const a0 = k * Math.PI / 6, a1 = (k + 1) * Math.PI / 6; b.beam("metal", [wx, wy + Math.sin(a0) * .28, wz + Math.cos(a0) * .28], [wx, wy + Math.sin(a1) * .28, wz + Math.cos(a1) * .28], .04, .04); }
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; b.beam("metal", [wx, wy + Math.sin(a) * .28, wz + Math.cos(a) * .28], [wx, wy - Math.sin(a) * .28, wz - Math.cos(a) * .28], .035, .035); }
      const [mx, my, mz] = c.wallPoint("right", .2, y + 1.7, .03); b.boxYaw("paper", mx, my, mz, .02, 1.0, 1.4, 0); for (let k = 0; k < 4; k++) b.sphere("red", [mx - .02, my + rng.range(-.35, .35), mz + rng.range(-.5, .5)], .025);
      b.beam("metal", [-W / 2, y + H - .25, -1.2], [W / 2, y + H - .25, -1.2], .12, .12); b.beam("rust", [-W / 2, y + H - .25, 1.2], [W / 2, y + H - .25, 1.2], .1, .1); lantern(b, 0, y + 2.5, .3, .14, .3);
      chest(b, 1.2, y, 1.9, 0, .9, .5, .5, "wood");
    }, ["避难所", "末日", "地堡", "防空洞"]),

  filmRoom("惊悚闹鬼阁楼三壁内景", "影视置景·惊悚：荒废老宅的阁楼，积灰木板墙三面围合，顶上外露人字屋架和蛛网，白布盖着旧家具、一把摇椅，地上一只旧娃娃围着蜡烛，一面老镜子，月光从小窗斜洒进来", "欧式", "废弃",
    { seed: "惊悚闹鬼阁楼三壁内景", w: 6.4, d: 5.2, h: 3.8, pal: { wall: "#7d6e5c", trim: "#2f261d", wood: "#5a4632", woodD: "#2a2018", floorA: "#5a4636", floorB: "#503e30", curtain: "#6a4a4a" }, floor: "plank", plank: .22, dirt: 1,
      openings: [{ wall: "back", u: .6, w: .9, kind: "window", sill: 1.2, h: 1.5, muntins: 2, backing: "night" }] },
    (b, c) => {
      const { y, D, W, H, rng } = c, bz = -D / 2, top = y + H;
      for (const z of [-1.7, .9]) { b.beam("woodD", [-W / 2, top - 1.2, z], [0, top, z], .16, .16); b.beam("woodD", [W / 2, top - 1.2, z], [0, top, z], .16, .16); b.beam("woodD", [-W / 4, top - .6, z], [W / 4, top - .6, z], .12, .12); }
      b.beam("woodD", [0, top, bz], [0, top, D / 2], .14, .14);
      const sheet = (x: number, z: number, w: number, h: number, d: number, yaw: number) => { b.tbox("drape", [x, y + h / 2, z], [w, h, d], yaw, 0, 0); b.tbox("drape", [x, y + h + .02, z], [w * .8, .08, d * .8], yaw + 8, 0, 0); };
      sheet(-1.9, bz + .8, 1.4, 1.0, .8, 8); sheet(1.4, bz + .8, 1.0, 1.9, .6, -6); sheet(-2.2, 1.2, .7, .9, .7, 25);
      const [rx, rz, ryaw] = [1.7, 1.6, 200];
      chair(b, rng, rx, y + .1, rz, ryaw, "woodD", false);
      for (const s of [-.2, .2]) for (let k = 0; k < 6; k++) { const v0 = -.45 + k * .15, v1 = v0 + .15, [ax, az] = loc(rx, rz, ryaw, s, v0), [bx, bz2] = loc(rx, rz, ryaw, s, v1); b.beam("woodD", [ax, y + (v0 / .45) ** 2 * .08, az], [bx, y + (v1 / .45) ** 2 * .08, bz2], .03, .03); }
      const dx = -.3, dz = 1.4;
      b.boxYaw("red", dx, y + .1, dz, .16, .2, .1, 15); b.boxYaw("porcelain", dx, y + .26, dz, .1, .12, .07, 15); b.sphere("porcelain", [dx, y + .37, dz], .07);
      for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; candle(b, dx + Math.cos(a) * .5, y, dz + Math.sin(a) * .5, .1 + (k % 3) * .04); }
      b.tbox("woodD", [-2.5, y + .95, bz + .35], [.9, 1.7, .06], 12, -8, 0); b.tbox("mirror", [-2.5, y + .95, bz + .385], [.72, 1.5, .02], 12, -8, 0);
      b.plate("shaft", [.15, y + 2.7, bz + .03], [1.05, y + 2.7, bz + .03], [.75, y + .03, bz + 2.6], [-.15, y + .03, bz + 2.6], .01);
      chest(b, 2.2, y, 0, 270, 1.0, .6, .5, "wood"); chest(b, 2.2, y + .6, 0, 270, .7, .45, .4, "woodD");
      b.plate("drape", [-.3, top - .1, -1.7], [.3, top - .1, -1.7], [.45, y + 1.6, -1.65], [-.45, y + 1.7, -1.75], .01);
      framed(b, -1.0, y + 1.9, bz + .04, 0, .6, .8, "drape", "woodD");
      for (let k = 0; k < 4; k++) { const x = rng.range(-W / 3, W / 3), z = rng.pick([-1.7, .9]); b.plate("web", [x, top - .6, z], [x + .4, top - .6, z], [x + .25, top - 1.2, z], [x - .05, top - 1.0, z], .004); }
    }, ["阁楼", "鬼屋", "恐怖", "闹鬼", "老宅"]),
];
