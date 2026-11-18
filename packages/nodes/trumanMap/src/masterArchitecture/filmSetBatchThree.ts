import { filmRoom } from "./filmSetBatchOne";
import { pillar } from "./ruinProps";
import { canopyBed, chest, framed, lantern, mirror, plainTable, rug, scroll, screen, seat, shelf, stairFlight, stool } from "./setDressing";
import { banquet, counter, drape, mezzanine, squareSet, weaponRack } from "./setDressingTwo";
import type { ArchitecturePrototype } from "./structures";

// 影视内景三壁置景·古装宫廷与江湖：金銮殿、御书房、后妃寝殿、青楼花厅（带二楼挑台）、酒楼大堂、镖局练功房、书院学堂、茶馆说书台、中军大帐、古墓墓室。
export const filmSetDesignsThree: ArchitecturePrototype[] = [
  filmRoom("古装金銮殿大殿三壁内景龙椅丹陛", "影视置景·古装宫廷：皇宫大殿，朱红墙面，三层丹陛上设龙椅和金屏，红毯从殿门直铺到阶下，两侧朱漆大柱成列、铜鼎香炉、宫灯高悬，梁架外露，两侧殿门透进天光", "中式", "原始",
    { seed: "古装金銮殿大殿", w: 13, d: 10, h: 8.5, pal: { wall: "#7a2f26", wainscot: "#4a1f18", trim: "#c9a45a", wood: "#8a2f26", woodD: "#4a1f18", floorA: "#8a7e5e", floorB: "#7a7054", beam: "#3a1a14", rug: "#a02a26", rugB: "#d9b45a", metal: "#a8854a" }, floor: "flag", wainscot: 1.4, beams: "chinese",
      openings: [{ wall: "left", u: 2.2, w: 2.0, kind: "door", leaf: "none", backing: "day", h: 4.0 }, { wall: "right", u: 2.2, w: 2.0, kind: "door", leaf: "none", backing: "day", h: 4.0 }] },
    (b, c) => {
      const { y, D, H } = c, bz = -D / 2;
      b.box("stone", 0, y + .2, bz + 1.7, 7.4, .4, 3.4); b.box("stone", 0, y + .6, bz + 1.4, 6.0, .4, 2.8); b.box("rugB", 0, y + 1.0, bz + 1.1, 4.4, .4, 2.2);
      seat(b, 0, y + 1.2, bz + 1.0, 0, "rugB", true, 1.0); b.boxYaw("rugB", 0, y + 2.6, bz + .5, 1.6, 2.8, .14, 0); b.boxYaw("red", 0, y + 2.6, bz + .58, 1.2, 2.2, .02, 0);
      screen(b, 0, y + 1.2, bz + .22, 0, 6.0, 4.0, 5, "rugB", "red");
      rug(b, 0, y, 1.5, 0, 2.6, 6.4, "rug", "rugB");
      for (const x of [-4.4, 4.4]) for (const z of [-2.5, .2, 2.9]) { pillar(b, "stone", x, z, y, y + .3, .72, { sides: 14 }); pillar(b, "red", x, z, y + .3, y + H - .4, .52, { sides: 14 }); }
      for (const x of [-1.8, 1.8]) { pillar(b, "gold", x, bz + 4.2, y, y + .8, .36, { sides: 10 }); pillar(b, "gold", x, bz + 4.2, y + .8, y + 1.0, .46, { sides: 10 }); b.sphere("fire", [x, y + 1.1, bz + 4.2], .12); }
      for (const [x, z] of [[-2.6, -2.5], [2.6, -2.5], [-2.6, .2], [2.6, .2], [-2.6, 2.9], [2.6, 2.9]] as [number, number][]) lantern(b, x, y + 6.2, z, .4, 1.4, "lampRed");
    }, ["皇宫", "大殿", "朝堂", "龙椅"]),

  filmRoom("古装御书房三壁内景龙案奏折", "影视置景·古装宫廷：皇帝御书房，米黄墙加朱红墙裙，明黄桌围的龙案上堆满奏折、玉玺和笔架，背后屏风，两侧博古架，宫灯成对，窗前一方、门口半掩", "中式", "原始",
    { seed: "古装御书房", w: 7.2, d: 5.6, h: 4.2, pal: { wall: "#cdb98e", wainscot: "#6a2f26", trim: "#3a2018", wood: "#5a2f22", woodD: "#2a1410", floorA: "#6a5438", floorB: "#5c4830", curtain: "#a8342c", beam: "#3a1a14", rug: "#a02a26", rugB: "#d9b45a" }, floor: "plank", plank: .22, wainscot: 1.1, beams: "chinese",
      openings: [{ wall: "left", u: -.4, w: 1.6, kind: "window", sill: 1.0, h: 1.8, muntins: 3 }, { wall: "right", u: 1.2, w: 1.2, kind: "door", leaf: "ajar", h: 2.6 }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      plainTable(b, 0, y, bz + 1.6, 0, 2.6, 1.1, .85, "woodD"); b.boxYaw("rugB", 0, y + .865, bz + 1.6, 2.7, .015, 1.2, 0);
      for (let k = 0; k < 4; k++) b.boxYaw("paper", -.9 + k * .08, y + .88 + k * .05, bz + 1.5, .34, .05, .24, k * 7);
      b.box("gold", .8, y + .92, bz + 1.4, .2, .1, .2); pillar(b, "porcelain", -1.0, bz + 1.9, y + .865, y + .99, .06, { sides: 8 });
      for (let k = 0; k < 6; k++) b.beam("woodD", [-1.0 + k * .02, y + .99, bz + 1.9], [-1.0 + k * .035, y + 1.2, bz + 1.9 + k * .01], .01, .01);
      seat(b, 0, y, bz + .7, 0, "rugB", true, .8); screen(b, 0, y, bz + .22, 0, 2.6, 2.4, 3, "woodD", "paper");
      for (const x of [-2.9, 2.9]) shelf(b, rng, x, y, bz + .25, 0, 1.4, 2.6, .4, 5, "woodD", true);
      rug(b, 0, y, .9, 0, 3.0, 2.0, "rug", "rugB");
      for (const x of [-1.8, 1.8]) { pillar(b, "gold", x, .8, y, y + 1.4, .04); b.sphere("lamp", [x, y + 1.5, .8], .16); }
      lantern(b, 0, y + 3.0, bz + 2.2, .3, .6, "lampRed");
    }, ["皇宫", "书房", "奏折"]),

  filmRoom("古装后妃寝殿三壁内景凤榻妆台古筝", "影视置景·古装宫廷：嫔妃寝殿，粉墙红柱，粉纱帐的拔步凤榻，梳妆台立铜镜，案上一架古筝，屏风、熏炉、绣墩和宫灯，窗前挂帘，红毯铺地，梁架外露", "中式", "原始",
    { seed: "古装后妃寝殿", w: 6.4, d: 5.4, h: 4.0, pal: { wall: "#e8cfc0", wainscot: "#b04a5a", trim: "#7a2f3a", wood: "#7a3a30", woodD: "#4a2018", floorA: "#9a7a58", floorB: "#8a6c4c", curtain: "#d66a7a", beam: "#5a2a28", rug: "#c0505e", rugB: "#e0b46a" }, floor: "plank", plank: .2, wainscot: 1.0, beams: "chinese",
      openings: [{ wall: "back", u: -1.8, w: 1.2, kind: "window", sill: .9, h: 1.6, muntins: 3, curtain: true }, { wall: "right", u: 1.2, w: 1.1, kind: "door", leaf: "closed" }] },
    (b, c) => {
      const { y, D } = c, bz = -D / 2;
      canopyBed(b, 1.9, y, bz + 1.25, 0, 2.0, 2.3, "wood", "curtain"); chest(b, 1.9, y, .1, 0, 1.3, .5, .5, "woodD");
      plainTable(b, -1.0, y, bz + .4, 0, 1.2, .5, .78, "woodD"); mirror(b, -1.0, y + 1.4, bz + .06, 0, .6, .8); stool(b, -1.0, y, bz + 1.1, "woodD", .22, .45);
      plainTable(b, -2.0, y, .6, 0, 1.6, .5, .42, "woodD"); b.boxYaw("wood", -2.0, y + .5, .6, 1.5, .08, .25, 0);
      for (let k = 0; k < 7; k++) b.beam("metal", [-2.7, y + .55, .52 + k * .027], [-1.3, y + .55, .52 + k * .027], .004, .004);
      stool(b, -2.0, y, 1.3, "woodD", .22, .4); screen(b, -2.9, y, -1.0, 90, 1.8, 1.8, 3, "woodD", "paper");
      pillar(b, "gold", .2, 1.8, y, y + .5, .2, { sides: 10 }); pillar(b, "gold", .2, 1.8, y + .5, y + .6, .26, { sides: 10 });
      rug(b, .2, y, 1.4, 0, 2.6, 2.2, "rug", "rugB"); lantern(b, -1.4, y + 2.9, 1.0, .3, .7, "lampRed"); lantern(b, 1.8, y + 2.9, .6, .3, .7, "lampRed");
    }, ["皇宫", "后宫", "寝殿"]),

  filmRoom("古装青楼花厅三壁内景舞台二楼挑台", "影视置景·古装：青楼花厅，厅北小舞台设屏风红毯，四桌圆桌宴席，左侧木楼梯通二楼挑台、栏杆下垂着纱幔，满厅红灯笼，右侧大门敞开透进夜色", "中式", "原始",
    { seed: "古装青楼花厅", w: 10, d: 8, h: 6.4, pal: { wall: "#c99a80", wainscot: "#8a3a30", trim: "#4a2018", wood: "#7a3a2c", woodD: "#3a1a14", floorA: "#8a6444", floorB: "#7a5638", curtain: "#d66a7a", beam: "#4a2018", rug: "#b02a2a", rugB: "#e0b44a" }, floor: "plank", plank: .22, wainscot: 1.1, beams: "chinese",
      openings: [{ wall: "right", u: 2.4, w: 1.8, kind: "door", leaf: "none", backing: "night", h: 3.0 }, { wall: "right", u: -1.0, w: 1.4, kind: "window", sill: 1.0, h: 1.6, muntins: 3 }] },
    (b, c) => {
      const { y, D, W } = c, bz = -D / 2;
      b.box("woodD", 0, y + .3, bz + 1.3, 4.4, .6, 2.4); b.boxYaw("rug", 0, y + .62, bz + 1.3, 4.0, .02, 2.2, 0); screen(b, 0, y + .6, bz + .25, 0, 4.0, 2.4, 3, "woodD", "paper");
      for (const [x, z] of [[-3.0, .8], [3.0, .8], [-1.4, 2.9], [1.6, 2.9]] as [number, number][]) banquet(b, x, y, z, 4, .7, "woodD");
      mezzanine(b, -W / 2, bz + .2, -W / 2 + 1.7, -.88, y, y + 3.2, ["x1"], "woodD", "wood"); stairFlight(b, -W / 2 + .8, y, 3.6, 90, 1.1, 16, .2, .28, "woodD", "wood");
      drape(b, -3.3, -3.7, -3.3, -1.0, y + 1.0, y + 3.2, "curtain", 5, .08);
      for (const x of [-2.6, 0, 2.6]) for (const z of [-1.4, 1.6]) lantern(b, x, y + 4.8, z, .35, 1.2, "lampRed");
    }, ["青楼", "歌舞", "楼梯", "挑台"]),

  filmRoom("古装酒楼大堂三壁内景柜台二楼回廊", "影视置景·古装：酒楼大堂，六张方桌配长凳，背墙下一整排柜台和酒坛货架，上方二楼回廊栏杆连着左侧木楼梯，满堂红灯笼，右侧大门透进天光，窗口一扇", "中式", "原始",
    { seed: "古装酒楼大堂", w: 11, d: 8, h: 6.4, pal: { wall: "#cfc0a0", wainscot: "#6a4a35", trim: "#3a2c22", wood: "#7a5a3a", woodD: "#3a2c22", floorA: "#8a6a47", floorB: "#7b5c3b", beam: "#3a2c22" }, floor: "plank", plank: .22, wainscot: 1.0, beams: "chinese",
      openings: [{ wall: "right", u: 2.2, w: 2.0, kind: "door", leaf: "none", backing: "day", h: 3.0 }, { wall: "left", u: 1.0, w: 1.4, kind: "window", sill: 1.0, h: 1.6, muntins: 3 }] },
    (b, c) => {
      const { y, D, W, rng } = c, bz = -D / 2;
      mezzanine(b, -3.7, bz, W / 2, bz + 1.9, y, y + 3.2, ["z1"], "woodD", "wood"); mezzanine(b, -W / 2, bz, -3.7, bz + 1.9, y, y + 3.2, [], "woodD", "wood"); pillar(b, "woodD", -3.85, bz + 1.85, y, y + 3.0, .1, { sides: 8 });
      stairFlight(b, -4.6, y, 2.38, 90, 1.1, 16, .2, .28, "woodD", "wood");
      for (const [x, z] of [[-1.5, .4], [1.2, .4], [3.8, .4], [-1.5, 2.6], [1.2, 2.6], [3.8, 2.6]] as [number, number][]) squareSet(b, x, y, z, 0, "wood");
      counter(b, 1.0, y, bz + 2.4, 0, 3.6, .7, 1.1, "woodD", "wood"); b.boxYaw("woodD", .4, y + 1.12, bz + 2.4, .3, .03, .12, 0);
      shelf(b, rng, 1.0, y, bz + 2.0, 0, 3.4, 2.2, .3, 4, "woodD", false);
      for (let r = 0; r < 4; r++) for (let i = 0; i < 7; i++) pillar(b, "rust", -.4 + i * .48, bz + 2.0, y + .045 + r * .53, y + .045 + r * .53 + .3, .09, { sides: 8 });
      for (const x of [-3.5, -1.5, .5, 2.5, 4.5]) lantern(b, x, y + 4.8, 1.2, .35, 1.2, "lampRed");
    }, ["酒楼", "客栈", "大堂", "楼梯"]),

  filmRoom("古装镖局练功房三壁内景兵器架梅花桩", "影视置景·江湖：镖局武馆练功房，后墙两座兵器架插满长枪刀剑、上方「武」字匾，两具木人桩、中间九根梅花桩、石锁和悬挂的沙袋，高窗透光，右门半掩", "中式", "原始",
    { seed: "古装镖局练功房", w: 8, d: 6.4, h: 4.4, pal: { wall: "#c9bd9e", wainscot: "#6a4a35", trim: "#3a2c22", wood: "#7a5a3a", woodD: "#3a2c22", floorA: "#9a7a52", floorB: "#8a6c47", beam: "#3a2c22" }, floor: "plank", plank: .25, wainscot: .9, beams: "chinese",
      openings: [{ wall: "left", u: 1.0, w: 1.2, kind: "window", sill: 2.2, h: 1.2, muntins: 3, backing: "day" }, { wall: "right", u: 1.6, w: 1.4, kind: "door", leaf: "ajar", h: 2.6 }] },
    (b, c) => {
      const { y, D, H, rng } = c, bz = -D / 2;
      weaponRack(b, rng, -2.2, y, bz + .4, 0, 2.4); weaponRack(b, rng, 2.2, y, bz + .4, 0, 2.4);
      b.box("woodD", 0, y + 2.9, bz + .06, 2.6, .8, .08); for (let k = 0; k < 3; k++) b.box("gold", -.6 + k * .6, y + 2.9, bz + .12, .3, .5, .02);
      for (const x of [-3.0, 3.0]) { pillar(b, "wood", x, 1.2, y, y + 1.7, .16, { sides: 8 }); b.beam("wood", [x - .4, y + 1.2, 1.2], [x + .4, y + 1.2, 1.2], .06, .06); b.beam("wood", [x, y + .9, .8], [x, y + .9, 1.6], .06, .06); b.beam("wood", [x, y + .5, 1.2], [x + .3, y + .5, 1.5], .05, .05); }
      const hs = [.6, 1.0, .5, 1.2, .8, .6, 1.1, .7, .9];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) pillar(b, "woodD", -1.2 + i * 1.2, -.4 + j * 1.2, y, y + hs[i * 3 + j]!, .2, { sides: 10 });
      for (const x of [-3.2, -2.6, -2.0]) { b.box("stone", x, y + .15, 2.4, .35, .3, .2); b.beam("stone", [x - .08, y + .3, 2.4], [x + .08, y + .45, 2.4], .03, .03); }
      pillar(b, "cloth", 2.6, -1.0, y + 1.5, y + 2.4, .22, { sides: 10 }); b.beam("metal", [2.6, y + 2.4, -1.0], [2.6, y + H, -1.0], .02, .02);
    }, ["武馆", "镖局", "练武", "江湖"]),

  filmRoom("古装书院学堂三壁内景讲台课桌", "影视置景·古装：私塾书院，讲台上先生案、后墙圣像和对联，三排九张矮课桌配蒲团，右侧书架，窗口两扇，宫灯一盏，木地板", "中式", "原始",
    { seed: "古装书院学堂", w: 8, d: 6.4, h: 4.2, pal: { wall: "#d8cfb6", wainscot: "#6f5238", trim: "#3a2c22", wood: "#7a5a3a", woodD: "#3a2c22", floorA: "#8a6a47", floorB: "#7b5c3b", beam: "#3a2c22" }, floor: "plank", plank: .22, wainscot: .9, beams: "chinese",
      openings: [{ wall: "left", u: -1.0, w: 1.3, kind: "window", sill: 1.0, h: 1.5, muntins: 3 }, { wall: "left", u: 1.6, w: 1.3, kind: "window", sill: 1.0, h: 1.5, muntins: 3 }, { wall: "right", u: 2.0, w: 1.1, kind: "door", leaf: "ajar" }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      b.box("woodD", 0, y + .12, bz + .95, 3.4, .24, 1.5); plainTable(b, 0, y + .24, bz + .85, 0, 1.6, .6, .78, "wood"); b.boxYaw("woodD", .5, y + 1.04, bz + .85, .2, .03, .1, 0); seat(b, 0, y + .24, bz + .35, 0, "woodD", true, .55);
      framed(b, 0, y + 2.7, bz + .06, 0, 1.0, 1.7, "paper", "woodD"); scroll(b, -1.6, y + 2.5, bz + .03, 0, .5, 1.8); scroll(b, 1.6, y + 2.5, bz + .03, 0, .5, 1.8);
      for (const z of [-.5, 1.0, 2.4]) for (const x of [-2.4, 0, 2.4]) { plainTable(b, x, y, z, 0, .9, .5, .45, "wood"); pillar(b, "cloth", x, z + .6, y, y + .07, .22, { sides: 10 }); b.boxYaw("book2", x - .2, y + .47, z, .2, .03, .15, rng.range(-10, 10)); }
      shelf(b, rng, 3.1, y, bz + .2, 0, 1.4, 2.4, .35, 5, "woodD", true); lantern(b, 0, y + 3.2, .6, .26, .7);
    }, ["私塾", "学堂", "书院", "课堂"]),

  filmRoom("古装茶馆三壁内景说书台柜台", "影视置景·古装：茶馆，北面高台设说书案、醒木折扇，六张八仙桌配长凳，右侧长柜台和茶具货架，窗口两扇，大门透进天光，灯笼成排", "中式", "原始",
    { seed: "古装茶馆", w: 10, d: 7.6, h: 5.4, pal: { wall: "#cfc0a0", wainscot: "#6a4a35", trim: "#3a2c22", wood: "#7a5a3a", woodD: "#3a2c22", floorA: "#8a6a47", floorB: "#7b5c3b", beam: "#3a2c22" }, floor: "plank", plank: .22, wainscot: 1.0, beams: "chinese",
      openings: [{ wall: "left", u: -2.0, w: 1.4, kind: "window", sill: 1.0, h: 1.6, muntins: 3 }, { wall: "left", u: 1.5, w: 1.4, kind: "window", sill: 1.0, h: 1.6, muntins: 3 }, { wall: "right", u: 2.6, w: 1.8, kind: "door", leaf: "none", backing: "day", h: 2.9 }] },
    (b, c) => {
      const { y, D, W, rng } = c, bz = -D / 2;
      b.box("woodD", 0, y + .35, bz + 1.2, 3.2, .7, 2.0); plainTable(b, 0, y + .7, bz + 1.2, 0, 1.2, .5, .8, "wood"); b.boxYaw("woodD", .3, y + 1.52, bz + 1.2, .12, .06, .06, 0); b.boxYaw("paper", -.2, y + 1.51, bz + 1.15, .3, .01, .05, 15); pillar(b, "porcelain", -.45, bz + 1.3, y + 1.5, y + 1.62, .05, { sides: 8 });
      screen(b, 0, y + .7, bz + .3, 0, 2.8, 2.2, 3, "woodD", "paper");
      for (const [x, z] of [[-3.6, .2], [-1.2, .2], [1.2, .2], [3.6, .2], [-2.4, 2.4], [2.4, 2.4]] as [number, number][]) squareSet(b, x, y, z, 0, "wood");
      counter(b, W / 2 - .9, y, -1.5, 90, 3.0, .7, 1.1, "woodD", "wood"); shelf(b, rng, W / 2 - .2, y, -1.5, 270, 3.0, 2.4, .3, 4, "woodD", false);
      for (let i = 0; i < 5; i++) pillar(b, "porcelain", W / 2 - .9, -2.5 + i * .55, y + 1.1, y + 1.3, .08, { sides: 8 }); pillar(b, "gold", W / 2 - .9, -.2, y + 1.1, y + 1.45, .14, { sides: 10 });
      for (const x of [-3.5, -1.2, 1.2, 3.5]) lantern(b, x, y + 4.0, 1.2, .3, 1.0, "lampRed");
    }, ["茶楼", "说书", "茶肆"]),

  filmRoom("古装中军大帐三壁内景帅案沙盘", "影视置景·古装军旅：中军大帐，帐布围成三面，帅案后虎皮椅、案上军令与令箭筒，两侧兵器架和战旗，帐中一座沙盘插满小旗，火盆烧着，营门半掀透光", "中式", "原始",
    { seed: "古装中军大帐", w: 8, d: 6.4, h: 3.6, pal: { wall: "#a89a74", trim: "#6a5a3a", wood: "#7a5a3a", woodD: "#3a2c22", floorA: "#7a6a4a", floorB: "#6c5e42", rug: "#8a2f26", rugB: "#c9a45a" }, floor: "carpet", crown: false, baseboard: false, dirt: .25,
      openings: [{ wall: "left", u: 1.4, w: 1.6, kind: "door", leaf: "none", backing: "day", h: 2.5 }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      plainTable(b, 0, y, bz + 1.0, 0, 2.4, .9, .85, "woodD"); b.boxYaw("paper", -.4, y + .86, bz + 1.0, .9, .01, .6, 5); pillar(b, "woodD", .7, bz + 1.0, y + .85, y + 1.05, .07, { sides: 8 });
      for (let k = 0; k < 4; k++) b.beam("red", [.68 + k * .03, y + 1.05, bz + 1.0], [.66 + k * .04, y + 1.3, bz + 1.0], .015, .015);
      seat(b, 0, y, bz + .4, 0, "cloth", true, .8); b.boxYaw("cloth", 0, y + 1.1, bz + .15, .9, .9, .06, 0);
      weaponRack(b, rng, -3.0, y, bz + .3, 0, 2.0); weaponRack(b, rng, 3.0, y, bz + .3, 0, 2.0);
      b.box("wood", 1.8, y + .55, 1.0, 2.4, .12, 1.7); for (const [x, z] of [[.7, .3], [2.9, .3], [.7, 1.7], [2.9, 1.7]] as [number, number][]) pillar(b, "woodD", x, z, y, y + .5, .05, { sides: 6 });
      for (const [dx, dz, r] of [[-.6, -.3, .4], [.2, .2, .5], [.7, -.4, .3], [-.2, .5, .35]] as [number, number, number][]) b.dune("dirt", rng, 1.8 + dx, 1.0 + dz, r, r * .8, .14, 0, y + .61);
      for (let k = 0; k < 6; k++) { const x = 1.1 + k * .28, z = .6 + (k % 3) * .35; b.beam("red", [x, y + .62, z], [x, y + .9, z], .01, .01); b.box("red", x + .06, y + .85, z, .12, .08, .01); }
      for (const x of [-1.8, 1.8]) { b.beam("woodD", [x, y, bz + .2], [x, y + 3.2, bz + .2], .05, .05); b.plate("red", [x, y + 3.1, bz + .2], [x + 1.0, y + 3.0, bz + .2], [x + 1.0, y + 1.9, bz + .22], [x, y + 2.0, bz + .2], .01); }
      pillar(b, "metal", -2.6, 1.8, y, y + .4, .3, { sides: 10 }); b.sphere("fire", [-2.6, y + .5, 1.8], .2); lantern(b, 0, y + 2.9, 1.6, .22, .5);
    }, ["军营", "大帐", "营帐", "沙盘"]),

  filmRoom("古装古墓墓室三壁内景石棺长明灯", "影视置景·古装探险：地下古墓墓室，青砖墙三面围合，壁上彩绘带，中间一具石棺，六盏长明灯幽幽亮着，两侧陪葬陶俑排列，墙角陶罐和一堆金银，蛛网积尘，左侧石门半开", "中式", "老旧",
    { seed: "古装古墓墓室", w: 7, d: 8, h: 4.6, pal: { wall: "#6e6a5e", trim: "#3a3a36", wood: "#7a7568", woodD: "#2a2a26", floorA: "#4a4a46", floorB: "#3f3f3b", metal: "#8a6a3a" }, floor: "flag", wallKeys: ["brick", "wallB", "wall"], crown: false, baseboard: false, dirt: .9,
      openings: [{ wall: "left", u: 1.5, w: 1.6, kind: "door", leaf: "ajar", h: 2.6 }] },
    (b, c) => {
      const { y, D, W, rng } = c, bz = -D / 2;
      for (const [wall, len] of [["back", W], ["right", D]] as ["back" | "right", number][]) for (let k = 0; k < 6; k++) {
        const [px, py, pz] = c.wallPoint(wall, -len / 2 + .6 + k * len / 6, y + 2.0 + (k % 2) * .1, .02), key = ["red", "gold", "book2"][k % 3]!;
        if (wall === "back") b.boxYaw(key, px, py, pz, .8, .6, .02, 0); else b.boxYaw(key, px, py, pz, .02, .6, .8, 0);
      }
      b.box("stone", 0, y + .5, bz + 3.0, 1.2, 1.0, 2.6); b.box("stone", 0, y + 1.1, bz + 3.0, 1.35, .2, 2.75);
      for (const [x, z] of [[-1.8, bz + 1.5], [1.8, bz + 1.5], [-1.8, bz + 4.5], [1.8, bz + 4.5], [-1.8, bz + 3.0], [1.8, bz + 3.0]] as [number, number][]) { pillar(b, "gold", x, z, y, y + 1.0, .1, { sides: 8 }); pillar(b, "gold", x, z, y + 1.0, y + 1.1, .17, { sides: 8 }); b.sphere("fire", [x, y + 1.2, z], .1); }
      for (let k = 0; k < 7; k++) { const z = -3.0 + k * 1.0; pillar(b, "stone", 2.9, z, y, y + 1.2, .17, { sides: 8 }); b.sphere("stone", [2.9, y + 1.35, z], .14); }
      for (let k = 0; k < 3; k++) { const z = -3.0 + k * 1.0; pillar(b, "stone", -2.9, z, y, y + 1.2, .17, { sides: 8 }); b.sphere("stone", [-2.9, y + 1.35, z], .14); }
      for (let k = 0; k < 4; k++) pillar(b, "rust", 2.2 + (k % 2) * .5, 3.2 + Math.floor(k / 2) * .5, y, y + .5, .2, { sides: 10 });
      b.dune("gold", rng, -2.2, bz + .9, .9, .7, .35, 0, y); for (let k = 0; k < 6; k++) b.sphere("gold", [-2.6 + rng.range(0, 1), y + .1, bz + .5 + rng.range(0, 1.2)], .07);
    }, ["古墓", "墓室", "盗墓", "探险"]),
];
