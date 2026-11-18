import { filmRoom } from "./filmSetBatchOne";
import { pillar } from "./ruinProps";
import { bars, bowl, bulb, chair, chest, desk, drawerGrid, framed, lantern, monitor, papers, plainTable, rug, scroll, seat, shelf, sofa, stool, tableLamp, tubeLight } from "./setDressing";
import { bench, blackboard, bottles, chandelier, counter, drape, roundTable, schoolDesk, tatami } from "./setDressingTwo";
import type { ArchitecturePrototype } from "./structures";

// 影视内景三壁置景·民国与年代：舞厅、咖啡厅、报馆、银行、日式和室、督军府会客厅、照相馆，七八十年代教室、家庭客厅、供销社、知青大通铺。
export const filmSetDesignsFour: ArchitecturePrototype[] = [
  filmRoom("民国舞厅三壁内景舞池乐队台卡座", "影视置景·民国：老上海舞厅，黑白格舞池，北面乐队台挂丝绒幕布、摆钢琴和架子鼓，右墙长吧台和酒架，左墙一排红丝绒卡座，满厅水晶吊灯和旋转灯球，墙面描金", "现代", "原始",
    { seed: "民国舞厅", w: 11, d: 9, h: 5.2, pal: { wall: "#6a2f3a", wainscot: "#3a1a20", trim: "#c9a45a", wood: "#4a2a20", woodD: "#2a1410", floorA: "#e6e0d0", floorB: "#2a2420", curtain: "#8a1f2f", metal: "#c9a45a", rug: "#7a1f2a", rugB: "#c9a45a" }, floor: "tile", tileSize: .75, wainscot: 1.2,
      openings: [{ wall: "right", u: 3.0, w: 1.6, kind: "door", leaf: "ajar", backing: "night", h: 2.6 }] },
    (b, c) => {
      const { y, D, W, rng } = c, bz = -D / 2;
      b.box("woodD", 0, y + .45, bz + 1.5, 8.2, .9, 3.0); b.box("gold", 0, y + 2.6, bz + .1, 3.0, 3.2, .05);
      drape(b, -4.1, bz + .3, -1.5, bz + .3, y + .9, y + 4.8, "curtain", 6, .18); drape(b, 1.5, bz + .3, 4.1, bz + .3, y + .9, y + 4.8, "curtain", 6, .18); b.box("curtain", 0, y + 4.95, bz + .3, 8.4, .5, .3);
      b.box("dark", -2.4, y + 1.55, bz + 1.0, 1.5, 1.3, .6); b.box("porcelain", -2.4, y + 1.7, bz + 1.35, 1.4, .05, .2); stool(b, -2.4, y + .9, bz + 2.0, "woodD", .22, .5);
      pillar(b, "red", 1.9, bz + 1.4, y + .9, y + 1.35, .36, { sides: 12 }); pillar(b, "porcelain", 1.2, bz + 2.0, y + 1.4, y + 1.5, .22, { sides: 12 }); b.beam("metal", [1.2, y + .9, bz + 2.0], [1.2, y + 1.4, bz + 2.0], .03, .03);
      for (const [x, z] of [[2.6, bz + 1.0], [.6, bz + 1.1]] as [number, number][]) { b.beam("metal", [x, y + .9, z], [x, y + 1.9, z], .025, .025); pillar(b, "gold", x, z, y + 1.9, y + 1.92, .24, { sides: 12 }); }
      b.beam("metal", [0, y + .9, bz + 2.5], [0, y + 1.6, bz + 2.5], .02, .02); b.sphere("dark", [0, y + 1.65, bz + 2.5], .06);
      counter(b, W / 2 - 1.0, y, -1.0, 90, 4.0, .8, 1.1, "woodD", "wood"); shelf(b, rng, W / 2 - .2, y, -1.0, 270, 4.0, 2.6, .3, 4, "gold", false);
      for (let r = 0; r < 4; r++) bottles(b, rng, W / 2 - .2, y + .045 + r * .64, -1.0, 270, 3.6);
      for (const z of [-2.6, -1.6, -.6, .4]) stool(b, W / 2 - 1.9, y, z, "red", .2, .75);
      for (const z of [-2.0, .3, 2.6]) { sofa(b, -W / 2 + 1.0, y, z, 90, 1.8, "curtain", .9); roundTable(b, -W / 2 + 2.4, y, z, .4, .7, "woodD", "porcelain"); }
      for (const [x, z] of [[-2.4, -.5], [2.4, -.5], [0, .5]] as [number, number][]) chandelier(b, x, y + 4.2, z, .7, 10, 1.0);
      b.sphere("mirror", [0, y + 4.3, 2.2], .45); b.beam("metal", [0, y + 4.7, 2.2], [0, y + 5.2, 2.2], .02, .02);
    }, ["舞厅", "百乐门", "老上海", "夜总会"]),

  filmRoom("民国咖啡厅三壁内景吧台圆桌", "影视置景·民国：老式咖啡厅，竖纹墙纸配深色墙裙，六张圆桌各配两把椅子，后墙长吧台、咖啡机和蛋糕柜，墙上黑板写着菜单，留声机、吊扇、吊灯和盆栽，窗挂红帘", "现代", "原始",
    { seed: "民国咖啡厅", w: 8, d: 6.4, h: 4.2, pal: { wall: "#d8c9a8", stripe: "#c9b890", wainscot: "#5a3a2a", trim: "#3a2418", wood: "#6a4a35", woodD: "#2a1810", floorA: "#8a6a47", floorB: "#7b5c3b", curtain: "#7a2f3a" }, floor: "plank", plank: .16, wainscot: 1.0, stripes: true,
      openings: [{ wall: "left", u: -1.2, w: 1.5, kind: "window", sill: .9, h: 2.2, muntins: 3, curtain: true }, { wall: "left", u: 1.8, w: 1.5, kind: "window", sill: .9, h: 2.2, muntins: 3, curtain: true }, { wall: "right", u: 1.8, w: 1.2, kind: "door", leaf: "ajar", h: 2.5 }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      for (const [x, z] of [[-2.4, .4], [-.2, .4], [2.0, .4], [-2.4, 2.4], [-.2, 2.4], [2.0, 2.4]] as [number, number][]) {
        roundTable(b, x, y, z, .38, .74, "woodD", "porcelain"); chair(b, rng, x - .7, y, z, 90, "wood", false); chair(b, rng, x + .7, y, z, 270, "wood", false); pillar(b, "porcelain", x + .1, z, y + .74, y + .8, .05, { sides: 8 });
      }
      counter(b, 0, y, bz + .7, 0, 5.0, .7, 1.05, "woodD", "wood"); b.box("steel", -1.5, y + 1.35, bz + .7, .8, .6, .45); b.box("dark", -1.5, y + 1.7, bz + .7, .5, .12, .3);
      b.box("glass", 1.2, y + 1.35, bz + .7, 1.0, .5, .45); for (let k = 0; k < 4; k++) b.sphere("red", [.85 + k * .22, y + 1.22, bz + .7], .07);
      shelf(b, rng, 0, y, bz + .2, 0, 5.0, 2.2, .3, 3, "woodD", false); for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) pillar(b, "porcelain", -2.2 + i * .4, bz + .2, y + .045 + r * .71, y + .045 + r * .71 + .1, .06, { sides: 8 });
      blackboard(b, rng, 3.1, y + 1.9, bz + .06, 0, 1.2, .8);
      plainTable(b, -3.3, y, 2.2, 0, .6, .5, .75, "woodD"); b.box("woodD", -3.3, y + .85, 2.2, .35, .2, .35);
      for (let k = 0; k < 4; k++) pillar(b, "metal", -3.3, 2.2, y + 1.0 + k * .06, y + 1.06 + k * .06, .05 + k * .035, { sides: 10 });
      b.sphere("woodD", [0, y + 3.7, 1.2], .1); b.beam("woodD", [0, y + 3.7, 1.2], [0, y + 4.2, 1.2], .03, .03);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .4; b.beam("woodD", [0, y + 3.7, 1.2], [Math.cos(a) * .9, y + 3.7, 1.2 + Math.sin(a) * .9], .12, .02); }
      for (const x of [-3.5, 3.5]) { pillar(b, "woodD", x, -1.3, y, y + .35, .22, { sides: 8 }); b.sphere("leaf", [x, y + .8, -1.3], .4); }
      chandelier(b, -1.6, y + 3.2, 1.2, .35, 6, .8); chandelier(b, 1.8, y + 3.2, 1.2, .35, 6, .8);
    }, ["咖啡厅", "西餐厅", "民国", "老上海"]),

  filmRoom("民国报馆三壁内景编辑部排字房印刷机", "影视置景·民国：报馆编辑部与排字房，左边四张办公桌配打字机和电话，右边铅字格柜和手摇印刷机，晾稿绳上挂着印好的报纸，墙上挂钟，窗口高、光秃秃的灯泡", "现代", "老旧",
    { seed: "民国报馆", w: 8.4, d: 6.4, h: 4.0, pal: { wall: "#c8bca0", wainscot: "#5a4a3a", trim: "#3a2c22", wood: "#6a4a35", woodD: "#2a1f17", floorA: "#6b6256", floorB: "#5f574c", metal: "#4a4a4c" }, floor: "plank", plank: .2, wainscot: 1.0,
      openings: [{ wall: "left", u: -1.0, w: 1.4, kind: "window", sill: 1.6, h: 1.4, muntins: 3 }, { wall: "left", u: 1.6, w: 1.4, kind: "window", sill: 1.6, h: 1.4, muntins: 3 }, { wall: "right", u: 2.0, w: 1.1, kind: "door", leaf: "closed" }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      for (const [x, z] of [[-3.0, -1.0], [-.8, -1.0], [-3.0, 1.2], [-.8, 1.2]] as [number, number][]) {
        desk(b, x, y, z, 0, 1.4, .7, .76, "wood"); b.box("dark", x + .1, y + .84, z, .32, .14, .26); b.box("steel", x + .1, y + .9, z - .06, .26, .02, .1); b.box("dark", x - .4, y + .82, z + .1, .16, .1, .12); papers(b, rng, x - .3, z - .1, y + .76, .3, .15, 3);
        seat(b, x, y, z + .75, 180, "woodD", false, .45);
      }
      for (const x of [2.0, 3.6]) { b.box("woodD", x, y + .45, bz + .4, 1.5, .9, .6); drawerGrid(b, x, y + .9, bz + .35, 0, 5, 5, .28, .2, .4, "woodD", "metal"); }
      b.box("dark", 3.2, y + .5, 1.5, 1.4, 1.0, .9); b.box("metal", 3.2, y + 1.1, 1.5, 1.2, .2, .7); b.box("dark", 3.2, y + 1.7, 1.1, 1.3, 1.0, .15);
      for (let k = 0; k < 12; k++) { const a0 = k / 12 * Math.PI * 2, a1 = (k + 1) / 12 * Math.PI * 2; b.beam("metal", [2.4 + Math.cos(a0) * .45, y + 1.4 + Math.sin(a0) * .45, 1.5], [2.4 + Math.cos(a1) * .45, y + 1.4 + Math.sin(a1) * .45, 1.5], .06, .06); }
      b.beam("metal", [2.4 - .45, y + 1.4, 1.5], [2.4 + .45, y + 1.4, 1.5], .05, .05); b.beam("metal", [2.4, y + .95, 1.5], [2.4, y + 1.85, 1.5], .05, .05);
      for (const [x, z] of [[1.4, 2.2], [1.9, 2.5]] as [number, number][]) pillar(b, "paper", x, z, y, y + .9, .3, { sides: 12 });
      b.beam("metal", [-4.0, y + 2.9, -.3], [.5, y + 2.9, -.3], .01, .01); for (let k = 0; k < 8; k++) { const x = -3.8 + k * .55; b.plate("paper", [x, y + 2.9, -.3], [x + .4, y + 2.9, -.3], [x + .4, y + 2.1 - (k % 3) * .1, -.3], [x, y + 2.1 - (k % 2) * .1, -.3], .005); }
      b.box("porcelain", 0, y + 3.0, bz + .06, .4, .4, .05); b.beam("dark", [0, y + 3.0, bz + .1], [0, y + 3.15, bz + .1], .015, .015); b.beam("dark", [0, y + 3.0, bz + .1], [.1, y + 3.0, bz + .1], .015, .015);
      bulb(b, -2, y + 3.4, .2, .5); bulb(b, 2, y + 3.4, .2, .5);
    }, ["报馆", "印刷", "排字", "编辑部"]),

  filmRoom("民国银行营业厅三壁内景柜台金库门", "影视置景·民国：银行营业厅，黑白大理石地面，后墙两排带铜栅栏的出纳窗口、右侧圆形钢制金库大门，两根石柱、等候长椅、水晶吊灯，高窗透光", "现代", "原始",
    { seed: "民国银行营业厅", w: 10, d: 7.4, h: 5.6, pal: { wall: "#b8ad92", wainscot: "#6a645a", trim: "#8a7a5a", wood: "#4a2f22", woodD: "#2a1810", floorA: "#d8d0c0", floorB: "#8a8478", metal: "#c9a45a" }, floor: "tile", tileSize: .7, wainscot: 1.5,
      openings: [{ wall: "right", u: 2.4, w: 1.8, kind: "door", leaf: "ajar", h: 3.0 }, { wall: "left", u: 0, w: 1.6, kind: "window", sill: 1.8, h: 2.2, muntins: 3, backing: "day" }] },
    (b, c) => {
      const { y, D } = c, bz = -D / 2;
      for (const x of [-3.2, 0]) { counter(b, x, y, bz + 1.5, 0, 2.8, .9, 1.1, "woodD", "stone"); bars(b, x - 1.4, bz + 1.95, x - .3, bz + 1.95, y + 1.1, 1.1, .1, "gold"); bars(b, x + .3, bz + 1.95, x + 1.4, bz + 1.95, y + 1.1, 1.1, .1, "gold"); b.box("gold", x, y + 2.25, bz + 1.95, 2.8, .12, .1); }
      const [vx, vy, vz] = c.wallPoint("back", 3.4, y + 1.7, .14);
      b.box("stone", vx, vy, bz + .06, 2.4, 2.6, .1);
      for (let k = 0; k < 16; k++) { const a0 = k / 16 * Math.PI * 2, a1 = (k + 1) / 16 * Math.PI * 2; b.tri("steel", [vx, vy, vz - .02], [vx + Math.cos(a0) * .9, vy + Math.sin(a0) * .9, vz - .02], [vx + Math.cos(a1) * .9, vy + Math.sin(a1) * .9, vz - .02], [0, 0, 1]); for (const r of [.95, .62]) b.beam("steel", [vx + Math.cos(a0) * r, vy + Math.sin(a0) * r, vz], [vx + Math.cos(a1) * r, vy + Math.sin(a1) * r, vz], .06, .06); }
      for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; b.beam("gold", [vx + Math.cos(a) * .6, vy + Math.sin(a) * .6, vz + .04], [vx - Math.cos(a) * .6, vy - Math.sin(a) * .6, vz + .04], .05, .05); } b.sphere("gold", [vx, vy, vz + .06], .12);
      for (const x of [-3.4, 3.4]) pillar(b, "stone", x, 1.2, y, y + 4.8, .4, { sides: 12 });
      bench(b, -2.0, y, 2.4, 180, 2.4, "wood", true); bench(b, 1.6, y, 2.4, 180, 2.4, "wood", true);
      for (const x of [-3, 0, 3]) chandelier(b, x, y + 4.6, .8, .7, 10, 1.0);
      b.box("woodD", 0, y + 3.8, bz + .08, .6, .6, .08); b.box("porcelain", 0, y + 3.8, bz + .13, .5, .5, .02);
    }, ["银行", "金库", "营业厅"]),

  filmRoom("日式和室三壁内景榻榻米壁龛", "影视置景·日式：和室，满铺榻榻米，北面壁龛挂字画插花，左侧整面拉窗纸障子透进天光，中间矮桌配四个坐垫和茶具，墙角刀架和纸罩座灯，右侧拉门，适合抗战剧日军军官室或日料店", "日式", "原始",
    { seed: "日式和室", w: 5.4, d: 4.5, h: 3.0, pal: { wall: "#d8cdb0", trim: "#5a4028", wood: "#7a5a3a", woodD: "#3a2c22", floorA: "#8a6a47", curtain: "#5a3a6a" }, floor: "plank", plank: .2, baseboard: false,
      openings: [{ wall: "left", u: 0, w: 2.6, kind: "window", sill: .15, h: 1.9, muntins: 6, backing: "day" }, { wall: "right", u: 1.0, w: 1.6, kind: "door", leaf: "closed", h: 1.95 }] },
    (b, c) => {
      const { y, D } = c, bz = -D / 2;
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) tatami(b, -1.8 + i * 1.8, y, bz + .45 + j * .9, 0, 1.8, .9);
      b.box("wood", 0, y + .1, bz + .5, 1.8, .2, 1.0); scroll(b, 0, y + 1.7, bz + .03, 0, .5, 1.2); pillar(b, "porcelain", .5, bz + .55, y + .2, y + .5, .08, { sides: 8 });
      for (let k = 0; k < 3; k++) b.beam("leaf", [.5, y + .5, bz + .55], [.5 + (k - 1) * .12, y + .85 + k * .05, bz + .55], .015, .015);
      plainTable(b, 0, y + .07, .3, 0, 1.3, .8, .35, "wood"); for (const [x, z] of [[-1.1, .3], [1.1, .3], [0, 1.1], [0, -.5]] as [number, number][]) b.boxYaw("curtain", x, y + .13, z, .5, .1, .5, 0);
      for (const [x, z] of [[-.4, .2], [.1, .5], [.5, .1]] as [number, number][]) bowl(b, x, y + .42, z, .06, .05, "porcelain"); pillar(b, "porcelain", -.1, .0, y + .42, y + .58, .07, { sides: 8 });
      b.box("woodD", -2.2, y + .22, -1.6, .5, .3, .2); b.beam("steel", [-2.4, y + .48, -1.6], [-2.0, y + .52, -1.6], .03, .015); b.beam("woodD", [-2.45, y + .48, -1.6], [-2.35, y + .48, -1.6], .035, .03);
      b.box("woodD", 2.2, y + .5, -1.6, .35, .6, .35); b.box("lamp", 2.2, y + .5, -1.6, .3, .5, .3); lantern(b, 0, y + 2.3, .5, .22, .4);
    }, ["和室", "榻榻米", "日料店", "日军"]),

  filmRoom("民国督军府会客厅三壁内景壁炉沙发座钟", "影视置景·民国：军阀督军府会客厅，红木墙裙和米色墙面，北墙壁炉上挂油画、旁边一座落地大座钟，皮沙发两两相对围着茶几，墙角立旗和地球仪，书桌电话，大地毯和吊灯，窗挂厚帘", "现代", "原始",
    { seed: "民国督军府会客厅", w: 8, d: 6.4, h: 4.6, pal: { wall: "#cfc2a4", wainscot: "#4a2f22", trim: "#3a2418", wood: "#4a2f22", woodD: "#2a1810", floorA: "#6a4a30", floorB: "#5c4028", curtain: "#7a1f2a", rug: "#6a1f2a", rugB: "#c9a45a" }, floor: "plank", plank: .18, wainscot: 1.3,
      openings: [{ wall: "left", u: -1.0, w: 1.6, kind: "window", sill: .9, h: 2.2, muntins: 3, curtain: true }, { wall: "right", u: 1.6, w: 1.3, kind: "door", leaf: "ajar", h: 2.6 }] },
    (b, c) => {
      const { y, D } = c, bz = -D / 2;
      b.box("stone", 0, y + .7, bz + .3, 2.2, 1.4, .6); b.box("dark", 0, y + .45, bz + .62, .9, .8, .02); b.box("woodD", 0, y + 1.45, bz + .35, 2.5, .1, .7); framed(b, 0, y + 2.5, bz + .06, 0, 1.6, 1.0, "paper", "gold");
      b.box("woodD", 3.2, y + 1.2, bz + .35, .55, 2.4, .35); b.box("porcelain", 3.2, y + 1.9, bz + .54, .3, .3, .02); b.box("gold", 3.2, y + 1.1, bz + .54, .12, .5, .02);
      rug(b, 0, y, .6, 0, 4.4, 3.4, "rug", "rugB"); sofa(b, 0, y, 2.0, 180, 2.2, "leather", .9); sofa(b, 0, y, -.8, 0, 2.2, "leather", .9); plainTable(b, 0, y, .6, 0, 1.4, .6, .45, "woodD");
      seat(b, -2.2, y, .6, 90, "woodD", true, .6); seat(b, 2.2, y, .6, 270, "woodD", true, .6);
      desk(b, -3.0, y, bz + 1.0, 0, 1.4, .7, .76, "woodD"); b.box("dark", -2.7, y + .84, bz + 1.0, .2, .14, .18); seat(b, -3.0, y, bz + 1.75, 180, "woodD", false, .5);
      b.beam("woodD", [-3.7, y, bz + .3], [-3.7, y + 3.0, bz + .3], .05, .05); b.plate("red", [-3.7, y + 2.9, bz + .3], [-2.6, y + 2.85, bz + .3], [-2.6, y + 2.0, bz + .32], [-3.7, y + 2.05, bz + .3], .01); b.box("book2", -3.4, y + 2.6, bz + .32, .5, .45, .01); b.box("porcelain", -3.4, y + 2.6, bz + .335, .2, .2, .01);
      pillar(b, "woodD", 3.0, 2.4, y, y + .5, .06); b.sphere("book2", [3.0, y + .8, 2.4], .3);
      chandelier(b, -1.5, y + 3.6, .6, .5, 8, 1.0); chandelier(b, 1.5, y + 3.6, .6, .5, 8, 1.0);
    }, ["督军府", "军阀", "会客厅", "官邸"]),

  filmRoom("民国照相馆三壁内景布景幕布大木箱相机", "影视置景·民国：老照相馆摄影棚，北墙挂着画了廊柱花园的蓝色布景幕布，前面一把太师椅和花几，镜头一侧立着木三脚架上的老式大箱相机和蒙头黑布，两盏强光灯，墙上挂满相框，柜台上堆着相册", "现代", "原始",
    { seed: "民国照相馆", w: 6.4, d: 5.2, h: 3.6, pal: { wall: "#cfc2a4", wainscot: "#5a4030", trim: "#3a2c22", wood: "#6a4a35", woodD: "#2a1f17", floorA: "#7a5a3a", floorB: "#6c4f33", curtain: "#4a2f3a" }, floor: "plank", plank: .16, wainscot: .9,
      openings: [{ wall: "left", u: 0, w: 1.8, kind: "window", sill: 1.2, h: 1.8, muntins: 4, backing: "day" }, { wall: "right", u: 1.4, w: 1.1, kind: "door", leaf: "ajar" }] },
    (b, c) => {
      const { y, D } = c, bz = -D / 2;
      b.box("book2", 0, y + 1.7, bz + .45, 3.4, 3.0, .03); b.beam("woodD", [-1.8, y + 3.25, bz + .45], [1.8, y + 3.25, bz + .45], .06, .06);
      for (const x of [-1.2, 1.2]) { b.box("porcelain", x, y + 1.2, bz + .47, .3, 2.2, .04); b.box("porcelain", x, y + 2.35, bz + .47, .42, .12, .05); } b.box("leaf", 0, y + .3, bz + .48, 2.6, .45, .03);
      seat(b, 0, y, bz + 1.5, 0, "woodD", true, .65); plainTable(b, 1.3, y, bz + 1.5, 0, .5, .5, .7, "woodD"); pillar(b, "porcelain", 1.3, bz + 1.5, y + .7, y + .95, .08, { sides: 8 }); b.sphere("leaf", [1.3, y + 1.1, bz + 1.5], .15);
      for (const [dx, dz] of [[-.4, .3], [.4, .3], [0, -.4]] as [number, number][]) b.beam("woodD", [0, y + 1.35, 1.9], [dx, y, 1.9 + dz], .04, .04);
      b.box("woodD", 0, y + 1.45, 1.9, .4, .4, .3); b.box("dark", 0, y + 1.45, 1.6, .3, .3, .3); b.sphere("glass", [0, y + 1.45, 1.42], .07); b.plate("dark", [-.35, y + 1.7, 2.0], [.35, y + 1.7, 2.0], [.45, y + 1.0, 2.4], [-.45, y + 1.0, 2.4], .01);
      for (const [x, z] of [[-2.3, 1.2], [2.3, 1.0]] as [number, number][]) { b.beam("metal", [x, y, z], [x, y + 2.0, z], .04, .04); b.box("lamp", x, y + 2.1, z, .55, .55, .12); b.box("metal", x, y + 2.1, z + .08, .6, .6, .04); }
      for (const [x, yy] of [[-2.6, 1.9], [-2.6, 1.1], [2.6, 1.9], [2.6, 1.1]] as [number, number][]) framed(b, x, y + yy, bz + .06, 0, .5, .65, "paper", "woodD");
      counter(b, -2.6, y, 1.9, 90, 1.8, .6, 1.0, "woodD", "wood"); for (let k = 0; k < 3; k++) b.boxYaw(["book1", "book2", "book3"][k]!, -2.6, y + 1.04 + k * .05, 1.5 + k * .3, .3, .05, .22, 10 * k);
    }, ["照相馆", "摄影", "老照片"]),

  filmRoom("年代教室三壁内景黑板双人课桌", "影视置景·七八十年代：小学教室，绿墙裙白灰墙，水泥地，后墙大黑板上方贴着红色标语，讲台和三排九张双人木课桌，左墙三扇木窗，右门半掩，日光灯管吊在顶上", "现代", "老旧",
    { seed: "年代教室", w: 8, d: 7, h: 3.8, pal: { wall: "#d9d2b8", wainscot: "#4f8a6a", trim: "#3a5a48", wood: "#8a6a47", woodD: "#3a2c22", floorA: "#8a8a82", floorB: "#7c7c74" }, floor: "concrete", wainscot: 1.2, dirt: .25,
      openings: [{ wall: "left", u: -2.0, w: 1.4, kind: "window", sill: 1.0, h: 1.6, muntins: 4 }, { wall: "left", u: .2, w: 1.4, kind: "window", sill: 1.0, h: 1.6, muntins: 4 }, { wall: "left", u: 2.4, w: 1.4, kind: "window", sill: 1.0, h: 1.6, muntins: 4 }, { wall: "right", u: 2.4, w: 1.0, kind: "door", leaf: "ajar", h: 2.2 }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      blackboard(b, rng, 0, y + 1.9, bz + .06, 0, 4.2, 1.2); b.box("woodD", 0, y + .1, bz + .7, 2.2, .2, .9); plainTable(b, 0, y + .2, bz + .6, 0, 1.2, .6, .76, "wood");
      for (let k = 0; k < 8; k++) b.box(k % 2 ? "porcelain" : "red", -1.5 + k * .42, y + 3.1, bz + .06, .34, .3, .02);
      framed(b, -2.7, y + 2.8, bz + .06, 0, .7, .9, "paper", "woodD"); framed(b, 2.7, y + 2.8, bz + .06, 0, .7, .9, "paper", "woodD");
      for (const z of [-.8, .6, 2.0]) for (const x of [-2.4, 0, 2.4]) schoolDesk(b, x, y, z, 0, "wood");
      for (const [x, z] of [[-1.2, .3], [1.2, .3], [-1.2, 2.2], [1.2, 2.2]] as [number, number][]) tubeLight(b, x, y + 3.55, z, 1.2, 0, "lamp");
    }, ["教室", "课堂", "八十年代", "学校"]),

  filmRoom("八十年代家庭客厅三壁内景沙发电视缝纫机", "影视置景·八十年代：普通人家客厅，绿墙裙白灰墙，水泥地铺小块地毯，布沙发搭钩花沙发巾，电视柜上一台黑白电视机，方桌上的红暖水瓶和搪瓷缸，墙角缝纫机，墙上挂历和全家福，窗挂碎花帘", "现代", "老旧",
    { seed: "八十年代客厅", w: 5.2, d: 4.6, h: 2.9, pal: { wall: "#d8d0b8", wainscot: "#4a8a6a", trim: "#3a5a48", wood: "#7a5a3a", woodD: "#3a2c22", floorA: "#8a8a82", floorB: "#7c7c74", curtain: "#9a5a4a", rug: "#7a2f2a", rugB: "#c9a45a" }, floor: "concrete", wainscot: 1.2, dirt: .2,
      openings: [{ wall: "back", u: 1.2, w: 1.5, kind: "window", sill: .9, h: 1.4, muntins: 4, curtain: true }, { wall: "right", u: 1.2, w: 1.0, kind: "door", leaf: "ajar" }] },
    (b, c) => {
      const { y, D, W } = c, bz = -D / 2;
      sofa(b, -.9, y, bz + .6, 0, 2.1, "leather", .85); b.boxYaw("porcelain", -.9, y + .72, bz + .33, 1.6, .35, .03, 0);
      plainTable(b, -.9, y, .6, 0, 1.0, .6, .45, "wood"); pillar(b, "red", -1.15, .55, y + .45, y + .8, .08, { sides: 8 }); pillar(b, "porcelain", -.7, .65, y + .45, y + .55, .05, { sides: 8 });
      counter(b, -W / 2 + .4, y, .3, 90, 1.3, .5, .7, "woodD", "wood"); monitor(b, -W / 2 + .45, y + .7, .3, 90, true, .6, .45); b.beam("metal", [-W / 2 + .45, y + 1.25, .3], [-W / 2 + .45, y + 1.7, .0], .01, .01); b.beam("metal", [-W / 2 + .45, y + 1.25, .3], [-W / 2 + .45, y + 1.7, .6], .01, .01);
      b.box("woodD", -W / 2 + .4, y + .85, 1.0, .3, .2, .25);
      plainTable(b, 1.8, y, bz + .5, 0, .9, .5, .8, "woodD"); b.box("dark", 1.8, y + .95, bz + .5, .5, .3, .2); b.sphere("metal", [2.15, y + .95, bz + .5], .1);
      b.box("red", 2.3, y + 1.7, bz + .05, .3, .4, .02); b.box("paper", 2.3, y + 1.75, bz + .07, .26, .2, .01); framed(b, -.9, y + 1.8, bz + .05, 0, 1.0, .6, "paper", "woodD");
      rug(b, -.9, y, .5, 0, 2.2, 1.6); bulb(b, 0, y + 2.4, .4, .5);
    }, ["客厅", "八十年代", "年代剧", "家庭"]),

  filmRoom("年代供销社三壁内景柜台货架算盘秤", "影视置景·七八十年代：国营供销社，绿墙裙，后墙和左墙整面货架摆满瓶罐盒布，木柜台上算盘、杆秤和玻璃柜，墙上红标语，地上堆着麻袋，裸灯泡，右门透进日光", "现代", "老旧",
    { seed: "年代供销社", w: 9, d: 6.4, h: 4.0, pal: { wall: "#cdbf9f", wainscot: "#4f8a6a", trim: "#3a5a48", wood: "#7a5a3a", woodD: "#3a2c22", floorA: "#8a8a82", floorB: "#7c7c74" }, floor: "concrete", wainscot: 1.2, dirt: .25,
      openings: [{ wall: "right", u: 1.8, w: 1.8, kind: "door", leaf: "ajar", h: 2.5, backing: "day" }, { wall: "left", u: -1.4, w: 1.4, kind: "window", sill: 1.2, h: 1.4, muntins: 4 }] },
    (b, c) => {
      const { y, D, W, rng } = c, bz = -D / 2;
      counter(b, 0, y, bz + 1.6, 0, 6.4, .8, 1.1, "woodD", "wood"); counter(b, -W / 2 + 1.2, y, 1.3, 90, 3.0, .8, 1.1, "woodD", "wood");
      for (const x of [-1.6, 1.6]) shelf(b, rng, x, y, bz + .2, 0, 3.0, 3.0, .4, 5, "woodD", false);
      shelf(b, rng, -W / 2 + .2, y, 1.3, 90, 3.0, 3.0, .4, 5, "woodD", false);
      const goods = ["glass", "porcelain", "red", "rust", "cloth"];
      for (let r = 0; r < 5; r++) {
        for (let i = 0; i < 8; i++) { for (const x of [-1.6, 1.6]) pillar(b, rng.pick(goods), x - 1.2 + i * .34, bz + .2, y + .045 + r * .588, y + .045 + r * .588 + rng.range(.15, .4), .06, { sides: 6 }); pillar(b, rng.pick(goods), -W / 2 + .2, 1.3 - 1.2 + i * .34, y + .045 + r * .588, y + .045 + r * .588 + rng.range(.15, .4), .06, { sides: 6 }); }
      }
      for (let k = 0; k < 8; k++) b.box(k % 2 ? "porcelain" : "red", -1.5 + k * .42, y + 3.5, bz + .06, .34, .3, .02);
      b.beam("metal", [.8, y + 1.55, bz + 1.6], [1.8, y + 1.5, bz + 1.6], .02, .02); b.sphere("metal", [1.7, y + 1.4, bz + 1.6], .06); b.boxYaw("woodD", -.4, y + 1.13, bz + 1.6, .3, .03, .12, 0);
      b.box("glass", -2.2, y + 1.35, bz + 1.6, 1.6, .5, .6); for (let k = 0; k < 4; k++) b.box(["book1", "book2", "book3", "red"][k]!, -2.8 + k * .35, y + 1.2, bz + 1.6, .25, .2, .3);
      for (const [x, z, r] of [[2.6, 1.9, .5], [3.3, 2.3, .45], [3.0, 1.2, .4]] as [number, number, number][]) b.dune("cloth", rng, x, z, r, r * .8, .45, 20, y);
      bulb(b, -1.5, y + 3.4, 1.0, .5); bulb(b, 1.8, y + 3.4, 1.0, .5);
    }, ["供销社", "商店", "八十年代", "柜台"]),

  filmRoom("知青大通铺三壁内景土炕被褥煤油灯", "影视置景·七十年代下乡：知青宿舍，黄土墙三面围合，后墙下一整条通长大土炕铺草席、六床被褥并排，炕前箱子行李和方桌煤油灯，墙角水缸，高处拉着晾衣绳，墙上红标语，窗糊白纸", "中式", "老旧",
    { seed: "知青大通铺", w: 7, d: 5.4, h: 3.2, pal: { wall: "#b89a6a", trim: "#7a5a3a", wood: "#7a5a3a", woodD: "#3a2c22", floorA: "#7a6a4a", floorB: "#6c5e42", curtain: "#7a2f3a" }, floor: "concrete", wallKeys: ["wall", "wallB"], crown: false, baseboard: false, dirt: .55,
      openings: [{ wall: "left", u: -.8, w: 1.2, kind: "window", sill: 1.2, h: 1.1, muntins: 4 }, { wall: "right", u: 1.5, w: 1.0, kind: "door", leaf: "closed", h: 2.1 }] },
    (b, c) => {
      const { y, D } = c, bz = -D / 2;
      b.box("brick", 0, y + .35, bz + 1.1, 6.6, .7, 2.2); b.box("thatch", 0, y + .72, bz + 1.1, 6.6, .06, 2.2);
      const cols = ["curtain", "book2", "cloth", "red", "book3", "leaf"];
      for (let k = 0; k < 6; k++) { b.box(cols[k]!, -2.7 + k * 1.1, y + .85, bz + 1.5, .95, .2, 1.5); b.box("porcelain", -2.7 + k * 1.1, y + .98, bz + .4, .5, .12, .3); }
      for (const [x, yaw] of [[-2.6, 0], [-.4, 8], [2.2, -6]] as [number, number][]) chest(b, x, y, 1.0, yaw, .8, .5, .45, "woodD");
      plainTable(b, 1.8, y, 1.9, 0, 1.2, .6, .75, "wood"); tableLamp(b, 1.8, y + .75, 1.9, "metal"); bench(b, 1.8, y, 2.4, 180, 1.2, "wood");
      pillar(b, "rust", -3.0, 1.9, y, y + .9, .4, { sides: 12 });
      for (let k = 0; k < 6; k++) b.box(k % 2 ? "porcelain" : "red", -1.4 + k * .5, y + 2.4, bz + .06, .4, .3, .02);
      lantern(b, 0, y + 2.2, .6, .12, .5, "lamp");
      b.beam("metal", [-3.0, y + 2.3, 1.4], [3.0, y + 2.3, 1.4], .01, .01); for (let k = 0; k < 5; k++) { const x = -2.4 + k * 1.1; b.plate("cloth", [x, y + 2.3, 1.4], [x + .5, y + 2.3, 1.4], [x + .5, y + 1.6, 1.4], [x, y + 1.7, 1.4], .005); }
    }, ["知青", "土炕", "宿舍", "七十年代"]),
];
