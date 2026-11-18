import { filmRoom } from "./filmSetBatchOne";
import type { SetOpening } from "./filmSet";
import { pillar } from "./ruinProps";
import { chair, framed, hospitalBed, ivStand, mirror, monitor, papers, plainTable, rug, seat, shelf, sofa, stool, tableLamp, tubeLight } from "./setDressing";
import { basin, bedModern, bench, bottles, chandelier, counter, drape, neon, roundTable } from "./setDressingTwo";
import type { ArchitecturePrototype } from "./structures";

// 影视内景三壁置景·现代生活（一）：总裁办公室、会议室、酒店客房和走廊、医院病房和走廊、现代教室、学校走廊、酒吧、KTV 包间。
const hallDoors = (wall: "left" | "right", us: number[], ajar = -99): SetOpening[] => us.map(u => ({ wall, u, w: .95, kind: "door" as const, leaf: u === ajar ? "ajar" as const : "closed" as const, h: 2.1 }));

export const filmSetDesignsFive: ArchitecturePrototype[] = [
  filmRoom("现代总裁办公室三壁内景落地窗夜景", "影视置景·现代：高层总裁办公室，整面落地玻璃窗外是夜晚的城市灯火，实木大班台配皮椅，左侧沙发茶几会客区，右墙书架和抽象画，射灯成排，右门半掩", "现代", "原始",
    { seed: "现代总裁办公室", w: 8, d: 6.4, h: 3.6, pal: { wall: "#d9d6d0", trim: "#8a8884", wood: "#3a2c24", woodD: "#1f1814", floorA: "#b8b4ac", floorB: "#aaa6a0", curtain: "#3a3a40" }, floor: "tile", tileSize: .8,
      openings: [{ wall: "back", u: 0, w: 6.6, kind: "window", sill: .2, h: 3.0, muntins: 3, backing: "night" }, { wall: "right", u: 1.8, w: 1.2, kind: "door", leaf: "ajar", h: 2.4 }] },
    (b, c) => {
      const { y, D, W, rng } = c, bz = -D / 2;
      for (let k = 0; k < 9; k++) { const h = rng.range(.6, 1.9); b.box("dark", -3.3 + k * .8, y + .2 + h / 2, bz - .56, rng.range(.4, .9), h, .02); }
      for (let k = 0; k < 70; k++) b.box("star", rng.range(-3.2, 3.2), y + rng.range(.4, 2.3), bz - .53, .05, .05, .02);
      plainTable(b, 0, y, bz + 1.7, 0, 2.4, 1.1, .76, "woodD"); monitor(b, -.5, y + .76, bz + 1.8, 180, true, .5, .32); papers(b, rng, .5, bz + 1.6, y + .76, .4, .2, 3); b.box("dark", .9, y + .82, bz + 1.9, .15, .1, .12);
      seat(b, 0, y, bz + .9, 0, "leather", true, .7); b.boxYaw("leather", 0, y + 1.3, bz + .62, .7, .9, .08, 0);
      for (const x of [-.6, .6]) seat(b, x, y, bz + 3.0, 180, "leather", false, .55);
      sofa(b, -3.0, y, .8, 90, 2.4, "leather", .9); plainTable(b, -1.8, y, .8, 90, 1.2, .6, .4, "woodD"); seat(b, -.6, y, .8, 270, "leather", true, .7);
      shelf(b, rng, W / 2 - .25, y, -1.5, 270, 2.0, 2.4, .35, 5, "woodD", true); framed(b, -W / 2 + .05, y + 1.9, -1.0, 90, 1.2, 1.4, "book3", "woodD");
      pillar(b, "woodD", 3.3, bz + .7, y, y + .35, .22, { sides: 10 }); b.sphere("leaf", [3.3, y + .85, bz + .7], .42);
      for (const [x, z] of [[-2.4, -1.5], [0, -1.5], [2.4, -1.5], [-2.4, 1.2], [0, 1.2], [2.4, 1.2]] as [number, number][]) pillar(b, "lampWhite", x, z, y + 3.5, y + 3.52, .09, { sides: 8 });
    }, ["办公室", "总裁", "写字楼", "夜景"]),

  filmRoom("现代会议室三壁内景长桌投影幕", "影视置景·现代：公司会议室，深色地毯和白墙，中间一张长会议桌配十二把办公椅、桌上笔记本和水杯，后墙投影幕和白板，左墙落地窗透进日光，顶上吊着投影仪，右侧门", "现代", "原始",
    { seed: "现代会议室", w: 8.4, d: 6.4, h: 3.4, pal: { wall: "#e6e4de", trim: "#9a9894", wood: "#8a6a4a", woodD: "#2a2a2e", floorA: "#4a5260", floorB: "#424a58", curtain: "#d8dde4" }, floor: "carpet",
      openings: [{ wall: "left", u: -2.0, w: 1.8, kind: "window", sill: .5, h: 2.4, muntins: 0, backing: "day" }, { wall: "left", u: 1.0, w: 1.8, kind: "window", sill: .5, h: 2.4, muntins: 0, backing: "day" }, { wall: "right", u: 1.8, w: 1.2, kind: "door", leaf: "ajar", h: 2.4 }] },
    (b, c) => {
      const { y, D } = c, bz = -D / 2;
      b.box("woodD", 0, y + 2.0, bz + .06, 2.6, 1.6, .06); b.box("porcelain", 0, y + 2.0, bz + .1, 2.5, 1.5, .02); b.box("porcelain", 3.0, y + 1.6, bz + .06, 1.6, 1.0, .04); b.box("steel", 3.0, y + 1.1, bz + .08, 1.6, .05, .06);
      plainTable(b, 0, y, .3, 0, 4.8, 1.4, .76, "woodD");
      for (let i = 0; i < 5; i++) {
        const x = -1.8 + i * .9; seat(b, x, y, -.65, 0, "woodD", false, .5); seat(b, x, y, 1.25, 180, "woodD", false, .5);
        b.box("dark", x, y + .775, -.15, .32, .025, .22); b.box("dark", x, y + .88, -.03, .32, .2, .015); b.box("screen", x, y + .88, -.04, .28, .17, .005);
        b.box("dark", x, y + .775, .75, .32, .025, .22); b.box("dark", x, y + .88, .63, .32, .2, .015); b.box("screen", x, y + .88, .64, .28, .17, .005); pillar(b, "glass", x + .35, .3, y + .76, y + .9, .035, { sides: 8 });
      }
      seat(b, -2.9, y, .3, 90, "woodD", true, .55); seat(b, 2.9, y, .3, 270, "woodD", true, .55);
      b.box("dark", 0, y + 3.1, .3, .4, .15, .3); b.beam("metal", [0, y + 3.4, .3], [0, y + 3.17, .3], .03, .03);
      for (const [x, z] of [[-2, -.3], [2, -.3], [-2, 1.6], [2, 1.6]] as [number, number][]) tubeLight(b, x, y + 3.35, z, 1.2, 0, "lampCold");
    }, ["会议室", "办公室", "公司"]),

  filmRoom("现代酒店客房三壁内景大床窗帘", "影视置景·现代：星级酒店标准间，米色墙纸和深色地毯，大床靠后墙、两侧床头柜台灯，对面电视柜上放着电视，窗边沙发椅和小圆桌、窗帘半拉，右门半掩，迷你吧在墙角", "现代", "原始",
    { seed: "现代酒店客房", w: 5.6, d: 6.2, h: 2.9, pal: { wall: "#dccfb6", stripe: "#d0c3aa", trim: "#8a7a62", wood: "#4a3a2e", woodD: "#2a1f18", floorA: "#5a4a48", floorB: "#4e403e", curtain: "#8a7a5a", rug: "#6a5a48", rugB: "#9a8a6a" }, floor: "carpet", stripes: true,
      openings: [{ wall: "left", u: -.4, w: 1.8, kind: "window", sill: .5, h: 2.0, muntins: 0, curtain: true, backing: "night" }, { wall: "right", u: 2.2, w: .95, kind: "door", leaf: "ajar", h: 2.1 }] },
    (b, c) => {
      const { y, D, W } = c, bz = -D / 2;
      bedModern(b, 0, y, bz + 1.15, 0, 1.8, 2.1, "woodD", "porcelain"); b.boxYaw("curtain", 0, y + .62, bz + 1.9, 1.9, .06, .5, 0);
      for (const s of [-1, 1]) { plainTable(b, s * 1.4, y, bz + .35, 0, .5, .45, .5, "woodD"); tableLamp(b, s * 1.4, y + .5, bz + .35, "metal"); }
      framed(b, 0, y + 1.7, bz + .06, 0, 1.4, .8, "book2", "woodD");
      counter(b, W / 2 - .4, y, -.2, 270, 1.8, .5, .6, "woodD", "wood"); monitor(b, W / 2 - .45, y + .6, -.2, 270, false, 1.1, .65);
      seat(b, -1.9, y, 1.3, 60, "leather", true, .7); roundTable(b, -2.3, y, .5, .3, .6, "woodD", "woodD");
      b.box("porcelain", W / 2 - .35, y + .4, bz + .4, .5, .8, .5); rug(b, 0, y, .6, 0, 2.4, 1.6);
      for (const [x, z] of [[-1, -1.2], [1, -1.2], [0, 1.4]] as [number, number][]) pillar(b, "lampWhite", x, z, y + 2.85, y + 2.88, .1, { sides: 8 });
    }, ["酒店", "客房", "宾馆"]),

  filmRoom("现代酒店走廊三壁内景客房门成排", "影视置景·现代：酒店客房走廊，深红花纹地毯、米色墙纸，两侧各四扇客房门、金色门牌，壁灯成对，尽头一扇窗拉着窗帘，墙边放着客房服务餐车和灭火器，天花射灯成排，恐怖片和追逐戏常用", "现代", "原始",
    { seed: "现代酒店走廊", w: 2.8, d: 14, h: 2.9, pal: { wall: "#d6c8ad", stripe: "#c8b99c", trim: "#7a6a52", wood: "#5a3f2e", woodD: "#2a1f18", floorA: "#6a2a32", floorB: "#8a6a3a", curtain: "#7a2f3a" }, floor: "carpet", stripes: true,
      openings: [...hallDoors("left", [-4.8, -1.6, 1.6, 4.8], -1.6), ...hallDoors("right", [-3.2, 0, 3.2, 6.0]), { wall: "back", u: 0, w: 1.2, kind: "window", sill: .7, h: 1.6, muntins: 2, curtain: true, backing: "night" }] },
    (b, c) => {
      const { y, D } = c, bz = -D / 2;
      for (const u of [-4.8, -1.6, 1.6, 4.8]) { const [px, py, pz] = c.wallPoint("left", u, y + 1.6, .03); b.box("gold", px, py, pz, .03, .12, .2); const [sx, sy, sz] = c.wallPoint("left", u + 1.6, y + 1.7, .08); b.box("lampWhite", sx, sy, sz, .1, .25, .14); }
      for (const u of [-3.2, 0, 3.2, 6.0]) { const [px, py, pz] = c.wallPoint("right", u, y + 1.6, .03); b.box("gold", px, py, pz, .03, .12, .2); const [sx, sy, sz] = c.wallPoint("right", u - 1.6, y + 1.7, .08); b.box("lampWhite", sx, sy, sz, .1, .25, .14); }
      plainTable(b, .75, y, 4.2, 90, 1.0, .5, .85, "steel"); pillar(b, "steel", .75, 4.2, y + .85, y + 1.1, .18, { sides: 12 }); b.box("porcelain", .75, y + .4, 4.2, .5, .02, .9);
      const [fx, fy, fz] = c.wallPoint("right", -6.0, y + 1.2, .1); b.box("red", fx, fy, fz, .2, .5, .3);
      for (const z of [-5.8, -2.4, .9, 4.2]) pillar(b, "lampWhite", 0, z, y + 2.85, y + 2.88, .1, { sides: 8 });
      b.box("signGreen", 0, y + 2.55, bz + .05, .5, .2, .04);
    }, ["酒店", "走廊", "客房走廊", "追逐"]),

  filmRoom("现代医院病房三壁内景双人病床监护仪", "影视置景·现代：医院双人病房，浅绿墙裙白墙，两张病床床头靠后墙、中间拉着浅蓝隔帘，床头输液架和监护仪亮着屏幕，陪护椅和床头柜，墙角洗手池，左窗透进日光，右门半掩", "现代", "原始",
    { seed: "现代医院病房", w: 6.4, d: 5.6, h: 3.2, pal: { wall: "#e8ece8", wainscot: "#a8c8b8", trim: "#8fa6a1", wood: "#c8d0d0", woodD: "#6f7f7d", floorA: "#c2c8c4", floorB: "#b8beba", curtain: "#9ac0d0", metal: "#9aa5a8" }, floor: "tile", tileSize: .6, wainscot: 1.2,
      openings: [{ wall: "left", u: -.4, w: 1.6, kind: "window", sill: .9, h: 1.6, muntins: 0, backing: "day" }, { wall: "right", u: 1.6, w: 1.3, kind: "door", leaf: "ajar", h: 2.2 }] },
    (b, c) => {
      const { y, D } = c, bz = -D / 2;
      for (const s of [-1, 1]) {
        const x = s * 1.7; hospitalBed(b, x, y, bz + 1.15, 0, .9, 2.0); plainTable(b, x + s * .8, y, bz + .4, 0, .45, .45, .65, "steel"); monitor(b, x + s * .8, y + .65, bz + .4, 0, true, .35, .25);
        ivStand(b, x - s * .75, y, bz + .8); seat(b, x + s * .85, y, bz + 1.9, s < 0 ? 90 : 270, "woodD", false, .45);
      }
      drape(b, 0, bz + 1.0, 0, bz + 3.6, y + .3, y + 2.5, "curtain", 6, .07); b.box("dark", 0, y + 2.3, bz + .1, .9, .55, .06);
      basin(b, -3.0, y, 1.8, 90); mirror(b, -3.15, y + 1.5, 1.8, 90, .6, .8);
      for (const [x, z] of [[-1.6, -.5], [1.6, -.5], [0, 1.5]] as [number, number][]) tubeLight(b, x, y + 3.15, z, 1.2, 0, "lampCold");
    }, ["医院", "病房", "病床", "医疗"]),

  filmRoom("现代医院走廊三壁内景候诊长椅推床", "影视置景·现代：医院长走廊，浅绿墙裙白墙、白色地砖，左侧诊室门成排，右墙候诊长椅和窗，一张推床停在墙边，尽头白色双开门上亮着绿色安全出口，冷白灯管成排，手术室外和追逐戏常用", "现代", "原始",
    { seed: "现代医院走廊", w: 3.4, d: 14, h: 3.0, pal: { wall: "#eef0ec", wainscot: "#7fb5a8", trim: "#6f9a8e", wood: "#e4e6e2", woodD: "#7f8c88", floorA: "#c9cdc8", floorB: "#bcc1bb", metal: "#9aa5a8" }, floor: "tile", tileSize: .6, wainscot: 1.2,
      openings: [{ wall: "left", u: -4.5, w: 1.1, kind: "door", leaf: "closed", h: 2.2 }, { wall: "left", u: -.5, w: 1.1, kind: "door", leaf: "ajar", h: 2.2 }, { wall: "left", u: 3.5, w: 1.1, kind: "door", leaf: "closed", h: 2.2 }, { wall: "right", u: 1.5, w: 1.8, kind: "window", sill: 1.0, h: 1.4, muntins: 0, backing: "day" }, { wall: "right", u: 5.0, w: 1.8, kind: "window", sill: 1.0, h: 1.4, muntins: 0, backing: "day" }, { wall: "back", u: 0, w: 1.8, kind: "door", leaf: "closed", h: 2.4 }] },
    (b, c) => {
      const { y, W, D } = c, bz = -D / 2;
      bench(b, W / 2 - .4, y, -2.0, 270, 2.4, "book2", true); bench(b, W / 2 - .4, y, -4.8, 270, 2.4, "book2", true); hospitalBed(b, -.9, y, 4.2, 0, .8, 1.9); ivStand(b, -.3, y, 3.6);
      for (const x of [-W / 2 + .05, W / 2 - .05]) b.beam("steel", [x, y + .9, -6.8], [x, y + .9, 6.8], .05, .05);
      b.box("signGreen", 0, y + 2.7, bz + .05, .6, .2, .04); const [rx, ry, rz] = c.wallPoint("left", 0, y + 2.5, .03); b.box("lampRed", rx, ry, rz, .03, .3, .3);
      const [fx, fy, fz] = c.wallPoint("right", -6.2, y + 1.2, .1); b.box("red", fx, fy, fz, .2, .5, .3); b.box("glass", fx - .05, fy, fz, .02, .4, .2);
      for (const z of [-5.5, -2.7, 0, 2.7, 5.5]) tubeLight(b, 0, y + 2.95, z, 1.4, 90, "lampCold");
      pillar(b, "steel", -1.2, -3.2, y, y + .6, .16, { sides: 10 });
    }, ["医院", "走廊", "候诊", "手术室外"]),

  filmRoom("现代教室三壁内景电子白板课桌椅", "影视置景·现代：学校教室，白墙浅色地砖，后墙电子白板和板书，四排十六套单人课桌椅、桌上摆着课本书包，左墙三扇大窗透进日光，右门半掩，墙上地图和作品展示，冷光灯管成排", "现代", "原始",
    { seed: "现代教室", w: 8.4, d: 7.4, h: 3.4, pal: { wall: "#eceae2", trim: "#a8a69e", wood: "#c8b28a", woodD: "#6a6a70", floorA: "#c8c4b8", floorB: "#bcb8ac", curtain: "#9ac0d0" }, floor: "tile", tileSize: .6,
      openings: [{ wall: "left", u: -2.2, w: 1.8, kind: "window", sill: .9, h: 1.8, muntins: 0, backing: "day" }, { wall: "left", u: .4, w: 1.8, kind: "window", sill: .9, h: 1.8, muntins: 0, backing: "day" }, { wall: "left", u: 3.0, w: 1.8, kind: "window", sill: .9, h: 1.8, muntins: 0, backing: "day" }, { wall: "right", u: 2.6, w: 1.0, kind: "door", leaf: "ajar", h: 2.2 }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      b.box("woodD", 0, y + 1.8, bz + .06, 3.6, 1.7, .06); b.box("screen", 0, y + 1.8, bz + .1, 3.5, 1.6, .02); for (let k = 0; k < 5; k++) b.box("porcelain", -1.4 + rng.range(0, 2.8), y + 2.3 - k * .25, bz + .12, rng.range(.4, 1.0), .03, .005);
      plainTable(b, -2.4, y, bz + .9, 0, 1.2, .6, .76, "wood"); framed(b, 3.4, y + 1.9, bz + .06, 0, 1.2, .9, "book2", "woodD"); framed(b, -3.4, y + 1.9, bz + .06, 0, 1.2, .9, "paper", "woodD");
      for (const z of [-.8, .5, 1.8, 3.1]) for (const x of [-2.7, -.9, .9, 2.7]) {
        plainTable(b, x, y, z, 0, .65, .45, .75, "porcelain"); chair(b, rng, x, y, z + .55, 180, "woodD", false);
        b.box(rng.pick(["book1", "book2", "book3", "red"]), x - .1, y + .78, z, .2, .03, .15); if (rng.chance(.5)) b.box(rng.pick(["curtain", "leaf", "red", "book2"]), x, y + .6, z + .8, .35, .4, .15);
      }
      for (const [x, z] of [[-2.2, -.3], [2.2, -.3], [-2.2, 2.4], [2.2, 2.4]] as [number, number][]) tubeLight(b, x, y + 3.35, z, 1.4, 0, "lampCold");
    }, ["教室", "学校", "课堂", "校园"]),

  filmRoom("现代学校走廊三壁内景储物柜教室门", "影视置景·现代：学校教学楼走廊，浅色地砖、蓝灰墙裙，左墙一整排储物柜，右墙教室门与玻璃窗交替，布告栏和奖杯柜，地上一块黄色小心地滑牌，尽头大窗逆光，冷白灯管成排，校园戏和追逐戏常用", "现代", "原始",
    { seed: "现代学校走廊", w: 3.4, d: 14, h: 3.4, pal: { wall: "#e8e6de", wainscot: "#6f8aa0", trim: "#56708a", wood: "#b89a6a", woodD: "#5a5a60", floorA: "#cfc8b4", floorB: "#bfb8a4", metal: "#9aa5a8" }, floor: "tile", tileSize: .7, wainscot: 1.3,
      openings: [{ wall: "right", u: -4.8, w: 1.0, kind: "door", leaf: "closed", h: 2.2 }, { wall: "right", u: -.8, w: 1.0, kind: "door", leaf: "ajar", h: 2.2 }, { wall: "right", u: 3.2, w: 1.0, kind: "door", leaf: "closed", h: 2.2 }, { wall: "right", u: -2.8, w: 1.6, kind: "window", sill: 1.0, h: 1.1, muntins: 0, backing: "day" }, { wall: "right", u: 1.2, w: 1.6, kind: "window", sill: 1.0, h: 1.1, muntins: 0, backing: "day" }, { wall: "right", u: 5.2, w: 1.6, kind: "window", sill: 1.0, h: 1.1, muntins: 0, backing: "day" }, { wall: "back", u: 0, w: 2.2, kind: "window", sill: .4, h: 2.4, muntins: 3, backing: "day" }] },
    (b, c) => {
      const { y, W, rng } = c;
      for (let k = 0; k < 13; k++) { const z = -6.5 + k * .5; b.box("wainscot", -W / 2 + .25, y + .95, z, .45, 1.9, .46); b.box("dark", -W / 2 + .5, y + 1.5, z, .02, .25, .3); b.box("metal", -W / 2 + .5, y + 1.1, z + .12, .02, .12, .03); }
      const [bx, by, bz2] = c.wallPoint("right", -6.0, y + 1.6, .03); b.box("cork", bx, by, bz2, .03, 1.0, 1.6); for (let k = 0; k < 6; k++) b.box("paper", bx - .02, by + rng.range(-.35, .35), bz2 + rng.range(-.6, .6), .02, .2, .15);
      const [tx, ty, tz] = c.wallPoint("right", 6.2, y + .9, .25); b.box("woodD", tx, ty, tz, .45, 1.8, 1.0); b.box("glass", tx - .22, ty + .2, tz, .02, 1.2, .9); for (let k = 0; k < 3; k++) pillar(b, "gold", tx, tz - .3 + k * .3, ty - .2, ty - .05, .06, { sides: 8 });
      b.plate("hazard", [.2, y, 1.4], [.8, y, 1.4], [.7, y + .6, 1.55], [.3, y + .6, 1.55], .01); b.plate("hazard", [.2, y, 1.7], [.8, y, 1.7], [.7, y + .6, 1.55], [.3, y + .6, 1.55], .01);
      for (const z of [-5.5, -2.7, 0, 2.7, 5.5]) tubeLight(b, 0, y + 3.35, z, 1.4, 90, "lampCold");
      pillar(b, "metal", 1.2, -3.8, y, y + .6, .16, { sides: 10 });
    }, ["学校", "走廊", "储物柜", "校园"]),

  filmRoom("现代酒吧三壁内景吧台背光酒墙霓虹", "影视置景·现代：夜间酒吧，深色墙面，后墙整面背光酒瓶墙，长吧台配皮面高脚凳，墙上粉蓝霓虹招牌，左侧台球桌和吊灯，右墙两组卡座，灯光昏暗，适合谈判、追逐前的酒吧戏", "现代", "原始",
    { seed: "现代酒吧", w: 9, d: 7, h: 3.8, pal: { wall: "#3a3036", trim: "#5a4a40", wood: "#4a3226", woodD: "#2a1c16", floorA: "#4a3a30", floorB: "#3f3128", curtain: "#5a1f2a" }, floor: "plank", plank: .2, baseboard: false,
      openings: [{ wall: "right", u: 2.6, w: 1.2, kind: "door", leaf: "ajar", backing: "night", h: 2.3 }] },
    (b, c) => {
      const { y, D, W, rng } = c, bz = -D / 2;
      b.box("lamp", 0, y + 1.85, bz + .12, 5.6, 1.9, .04); shelf(b, rng, 0, y, bz + .22, 0, 5.6, 2.6, .3, 4, "woodD", false); for (let r = 0; r < 4; r++) bottles(b, rng, 0, y + .045 + r * .64, bz + .22, 0, 5.2);
      counter(b, 0, y, bz + 2.3, 0, 5.6, .8, 1.1, "woodD", "wood"); for (let k = 0; k < 6; k++) stool(b, -2.3 + k * .92, y, bz + 3.1, "leather", .2, .75);
      for (let k = 0; k < 6; k++) pillar(b, "glass", -2.4 + k * .9, bz + 2.3, y + 1.1, y + 1.2 + (k % 2) * .08, .04, { sides: 8 });
      neon(b, -3.4, y + 2.6, bz + .08, 0, 1.4, .6, "neonP"); neon(b, 3.4, y + 2.4, bz + .08, 0, 1.2, .5, "neonC");
      b.box("woodD", -2.6, y + .55, 1.4, 2.5, .2, 1.4); b.box("leaf", -2.6, y + .68, 1.4, 2.3, .04, 1.2); for (const [dx, dz] of [[-1.1, -.55], [1.1, -.55], [-1.1, .55], [1.1, .55]] as [number, number][]) pillar(b, "woodD", -2.6 + dx, 1.4 + dz, y, y + .5, .09, { sides: 6 });
      for (let k = 0; k < 6; k++) b.sphere(rng.pick(["red", "porcelain", "book2", "gold"]), [-3.3 + rng.range(0, 1.5), y + .76, 1.1 + rng.range(0, .6)], .05);
      chandelier(b, -2.6, y + 3.0, 1.4, .5, 3, .8, "lamp");
      for (const z of [.6, 2.6]) { sofa(b, W / 2 - 1.0, y, z, 270, 1.8, "curtain", .9); roundTable(b, W / 2 - 2.3, y, z, .4, .7, "woodD", "woodD"); }
    }, ["酒吧", "夜店", "台球", "霓虹"]),

  filmRoom("现代KTV包间三壁内景沙发大屏灯球", "影视置景·现代：KTV 包间，深紫墙面，L 形软包沙发围着茶几、茶几上酒水和话筒，右墙大屏幕亮着、旁边点歌台，墙角音箱，顶上旋转灯球和彩色射灯，霓虹灯带，门带小窗", "现代", "原始",
    { seed: "现代KTV包间", w: 5.4, d: 4.6, h: 2.8, pal: { wall: "#2a1f3a", trim: "#4a3a5a", wood: "#4a3226", woodD: "#2a1c16", floorA: "#2f2438", floorB: "#2a2033", curtain: "#7a2f6a" }, floor: "carpet", baseboard: false,
      openings: [{ wall: "left", u: 1.2, w: 1.0, kind: "door", leaf: "closed", h: 2.1 }] },
    (b, c) => {
      const { y, D, W, rng } = c, bz = -D / 2;
      sofa(b, 0, y, bz + .55, 0, 4.2, "curtain", .9); plainTable(b, .2, y, .3, 0, 1.6, .7, .45, "woodD");
      for (let k = 0; k < 5; k++) pillar(b, rng.pick(["glass", "liquid", "red", "porcelain"]), -.4 + k * .25, .3 + rng.range(-.15, .15), y + .45, y + .45 + rng.range(.12, .3), .04, { sides: 8 });
      b.box("dark", .9, y + .47, .45, .05, .05, .18); monitor(b, W / 2 - .25, y + .9, -.3, 270, true, 1.8, 1.0); b.box("dark", W / 2 - .35, y + .45, 1.2, .5, .9, .5); b.box("screen", W / 2 - .6, y + .95, 1.2, .02, .3, .4);
      for (const [x, z] of [[-W / 2 + .3, bz + .3], [W / 2 - .3, bz + .3]] as [number, number][]) b.box("dark", x, y + 1.9, z, .35, .6, .3);
      b.sphere("mirror", [0, y + 2.4, .3], .28); b.beam("metal", [0, y + 2.68, .3], [0, y + 2.8, .3], .02, .02);
      for (const [x, z, k] of [[-1.6, -1.4, "neonP"], [1.6, -1.4, "neonC"], [-1.6, 1.2, "neonY"], [1.6, 1.2, "neonP"], [0, 1.6, "neonC"]] as [number, number, string][]) b.sphere(k, [x, y + 2.6, z], .1);
      neon(b, -1.5, y + 1.8, bz + .06, 0, 1.2, .5, "neonP"); neon(b, 1.5, y + 1.8, bz + .06, 0, 1.2, .5, "neonC");
    }, ["KTV", "夜店", "娱乐", "包间"]),
];
