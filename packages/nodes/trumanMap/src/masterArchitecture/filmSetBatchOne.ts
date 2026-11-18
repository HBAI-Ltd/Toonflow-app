import type { AssetState, AssetTheme } from "../sceneDocument";
import { film } from "./ruinCommon";
import { filmSet, type SetCfg, type SetCtx } from "./filmSet";
import type { RuinBuilder } from "./ruinKit";
import { pillar } from "./ruinProps";
import { bars, bowl, bulb, candle, canopyBed, chain, chest, coffin, drawerGrid, drum, framed, lantern, mirror, plainTable, robes, rug, scroll, screen, seat, shelf, sofa, standLamp, stool, tableLamp } from "./setDressing";
import type { ArchitecturePrototype } from "./structures";

// 影视内景置景（三壁一地，正面朝镜头敞开）·古装与民国：客栈客房、书房、闺房、药铺、灵堂、喜堂、公堂、大牢，
// 老上海客厅、理发店、旧书店、谍战电报室、戏班后台。按剧情场景陈设齐全，灯具用发光材质，窗外有景片。
const tags = ["三壁内景", "内景", "房间", "屋子", "室内场景", "影棚内景"];
/** 登记一间三壁内景；extra 是这间特有的搜索标签。 */
export const ceilingVariants: ArchitecturePrototype[] = [];
export const filmRoom = (name: string, purpose: string, theme: AssetTheme, state: AssetState, cfg: SetCfg, furnish: (b: RuinBuilder, c: SetCtx) => void, extra: string[] = []): ArchitecturePrototype => {
  ceilingVariants.push(film(`${name}·带天花板`, `${purpose}；封顶版：另加天花板和灯位格栅两个独立材质组，顶上封起来`, theme, state, () => filmSet({ ...cfg, ceiling: true }, furnish), [...tags, ...extra, "天花板", "封顶"]));
  return film(name, purpose, theme, state, () => filmSet(cfg, furnish), [...tags, ...extra]);
};
const set = filmRoom;
const wood = (base: string, dark: string) => ({ wood: base, woodD: dark });

export const filmSetDesigns: ArchitecturePrototype[] = [
  set("古装客栈客房三壁内景", "影视置景·古装：客栈客房，木板墙三面围合、正面朝镜头敞开，架子床挂帐，方桌绣墩、脸盆架、箱柜齐备，格窗透光，梁架外露，油灯和灯笼亮着", "中式", "原始",
    { seed: "古装客栈客房三壁内景", w: 5.2, d: 4.4, h: 3.4, pal: { wall: "#b9a88a", wainscot: "#7b5a3c", trim: "#4a3626", ...wood("#7a5a3c", "#3a2c22"), floorA: "#8a6a47", floorB: "#7b5c3b", curtain: "#8a3f3a", beam: "#4a3626" }, floor: "plank", plank: .2, wainscot: 1.0, beams: "chinese",
      openings: [{ wall: "back", u: 1.15, w: 1.1, kind: "window", sill: 1.0, h: 1.2, muntins: 3 }, { wall: "right", u: 1.0, w: 1.0, kind: "door", leaf: "ajar" }] },
    (b, c) => {
      const { y } = c;
      canopyBed(b, -1.5, y, -1.15, 0, 1.6, 2.1, "wood", "curtain");
      plainTable(b, .9, y, -.6, 0, .9, .9, .76); stool(b, .3, y, -.6, "wood", .2); stool(b, 1.5, y, -.6, "wood", .2); stool(b, .9, y, .15, "wood", .2);
      bowl(b, .75, y + .76, -.55, .1, .06); bowl(b, 1.05, y + .76, -.7, .08, .05); tableLamp(b, .95, y + .76, -.9, "woodD"); candle(b, 1.2, y + .76, -.35);
      chest(b, -2.25, y, 1.35, 90, .9, .6, .5, "woodD");
      for (const [x, z] of [[-2.2, .2], [-1.8, .2], [-2.2, .6], [-1.8, .6]] as [number, number][]) pillar(b, "wood", x, z, y, y + .8, .03);
      b.boxYaw("wood", -2.0, y + .8, .4, .5, .03, .5, 0); b.boxYaw("wood", -2.0, y + .3, .4, .5, .02, .5, 0); bowl(b, -2.0, y + .815, .4, .2, .1);
      b.beam("woodD", [-2.45, y + 1.3, .1], [-2.45, y + 1.3, .7], .03, .03); b.boxYaw("cloth", -2.44, y + 1.1, .4, .02, .4, .5, 0);
      rug(b, -.2, y, .9, 0, 1.8, 1.2); lantern(b, 0, y + 2.4, .2, .2, .5);
    }),

  set("古装书房三壁内景博古架书案", "影视置景·古装：文人书房，三面粉墙围合，博古架占满背墙，书案笔墨纸砚俱全，太师椅、挂轴字画、炭盆盆景，格窗透光，梁架外露", "中式", "原始",
    { seed: "古装书房三壁内景博古架书案", w: 5.8, d: 4.6, h: 3.5, pal: { wall: "#d8cfbb", wainscot: "#6f5238", trim: "#3a2c22", ...wood("#6f5238", "#2f241b"), floorA: "#6b4f35", floorB: "#5e452e", curtain: "#5d6f5a", beam: "#3a2c22" }, floor: "plank", plank: .22, wainscot: .9, beams: "chinese",
      openings: [{ wall: "right", u: -.3, w: 1.3, kind: "window", sill: .95, h: 1.4, muntins: 3 }, { wall: "left", u: .9, w: 1.1, kind: "door", leaf: "closed" }] },
    (b, c) => {
      const { y, rng, D } = c, bz = -D / 2;
      for (const x of [-1.95, -.4, 1.15]) shelf(b, rng, x, y, bz + .2, 0, 1.45, 2.3, .36, 5, "woodD", true);
      plainTable(b, .3, y, .1, 0, 1.9, .8, .78, "woodD"); seat(b, .3, y, -.55, 0, "woodD", true, .55); seat(b, -.3, y, 1.1, 180, "wood", false, .45);
      b.boxYaw("paper", .1, y + .81, .1, .7, .015, .45, 0); b.boxYaw("woodD", .75, y + .8, 0, .22, .04, .15, 0); pillar(b, "porcelain", 1.0, .2, y + .78, y + .92, .045, { sides: 8 });
      for (let k = 0; k < 5; k++) b.beam("woodD", [.95 + k * .02, y + .92, .2], [.95 + k * .03, y + 1.12, .2 + k * .01], .008, .008);
      for (let k = 0; k < 3; k++) b.boxYaw(k % 2 ? "book1" : "book2", -.35, y + .82 + k * .04, .35, .26, .035, .18, 8 * k);
      scroll(b, 2.2, y + 1.9, bz + .03, 0, .6, 1.5); scroll(b, 2.65, y + 1.85, bz + .03, 0, .55, 1.3);
      pillar(b, "metal", -2.3, -.9, y, y + .3, .22, { sides: 10 }); b.sphere("lamp", [-2.3, y + .32, -.9], .1); pillar(b, "woodD", 2.1, 1.1, y, y + .3, .16, { sides: 8 }); b.sphere("leaf", [2.1, y + .62, 1.1], .22); lantern(b, .3, y + 2.5, .5, .2, .5);
    }),

  set("古装闺房绣楼三壁内景", "影视置景·古装：小姐闺房，粉墙三面围合，架子床挂红帐，梳妆台立铜镜，绣架、屏风、箱笼、香炉，窗前挂帘，灯笼温暖，梁架外露", "中式", "原始",
    { seed: "古装闺房绣楼三壁内景", w: 5.6, d: 4.6, h: 3.4, pal: { wall: "#e3d3c4", wainscot: "#9a5a52", trim: "#6b3b36", ...wood("#8a5a45", "#4a2f2a"), floorA: "#9a7a58", floorB: "#8a6c4c", curtain: "#c0636a", beam: "#5a3a32", rug: "#b04a5a", rugB: "#e0b46a" }, floor: "plank", plank: .2, wainscot: .95, beams: "chinese",
      openings: [{ wall: "back", u: -1.6, w: 1.2, kind: "window", sill: .9, h: 1.5, muntins: 3, curtain: true }, { wall: "right", u: .9, w: 1.1, kind: "door", leaf: "closed" }] },
    (b, c) => {
      const { y, D } = c, bz = -D / 2;
      canopyBed(b, 1.55, y, bz + 1.15, 0, 1.8, 2.1, "wood", "curtain"); chest(b, 1.55, y, .35, 0, 1.3, .5, .5, "woodD");
      plainTable(b, -.35, y, bz + .4, 0, 1.0, .5, .78, "woodD"); mirror(b, -.35, y + 1.35, bz + .06, 0, .55, .75); stool(b, -.35, y, bz + 1.1, "woodD", .22, .45);
      pillar(b, "porcelain", -.7, bz + .4, y + .78, y + 1.0, .06, { sides: 8 }); b.sphere("red", [-.7, y + 1.06, bz + .4], .09); bowl(b, -.05, y + .78, bz + .42, .08, .04); candle(b, -.2, y + .78, bz + .28);
      for (const x of [-2.0, -1.4]) b.beam("woodD", [x, y, -1.2], [x, y + 1.15, -1.2], .05, .05); b.beam("woodD", [-2.0, y + 1.1, -1.2], [-1.4, y + 1.1, -1.2], .05, .05); b.boxYaw("curtain", -1.7, y + .85, -1.2, .6, .5, .01, 0);
      screen(b, -2.2, y, .8, 90, 1.8, 1.7, 3, "woodD", "paper"); rug(b, .1, y, .9, 0, 2.4, 1.5); lantern(b, -.6, y + 2.5, .4, .2, .6); lantern(b, 1.4, y + 2.5, 1.0, .2, .6, "lampRed");
    }),

  set("古装药铺堂屋三壁内景百子柜", "影视置景·古装：药铺堂屋，背墙整面百子柜抽屉，长柜台、药秤、药碾，梁下悬挂成束草药，青砖地面，右侧大门敞开透进街光", "中式", "原始",
    { seed: "古装药铺堂屋三壁内景百子柜", w: 7, d: 5.2, h: 3.6, pal: { wall: "#cdbf9f", wainscot: "#7a5a3a", trim: "#3a2c22", ...wood("#7a5a3a", "#3a2c22"), floorA: "#6f7378", floorB: "#62666b", beam: "#3a2c22" }, floor: "flag", wainscot: 1.0, beams: "chinese",
      openings: [{ wall: "right", u: 1.0, w: 1.6, kind: "door", leaf: "none", backing: "day", h: 2.6 }, { wall: "left", u: -.6, w: 1.2, kind: "window", sill: 1.1, h: 1.3, muntins: 3 }] },
    (b, c) => {
      const { y, D, H } = c, bz = -D / 2;
      drawerGrid(b, 0, y + .25, bz + .27, 0, 12, 6, .46, .36, .5, "wood", "metal");
      plainTable(b, 0, y, .9, 0, 4.0, .7, 1.05, "woodD");
      b.beam("woodD", [-.2, y + 1.05, .9], [-.2, y + 1.55, .9], .02, .02); b.beam("woodD", [-.5, y + 1.5, .9], [.1, y + 1.5, .9], .02, .02); bowl(b, -.45, y + 1.3, .9, .07, .02, "metal"); bowl(b, .05, y + 1.3, .9, .07, .02, "metal");
      for (let k = 0; k < 5; k++) b.boxYaw("paper", 1.0 + k * .2, y + 1.1, .8 + (k % 2) * .08, .14, .06, .12, k * 11);
      pillar(b, "stone", 2.4, 1.9, y, y + .3, .38, { sides: 10 }); pillar(b, "metal", 2.4, 1.9, y + .3, y + .36, .3, { sides: 10 }); stool(b, -1.8, y, 1.9, "wood", .2); stool(b, -1.2, y, 1.9, "wood", .2);
      for (let k = 0; k < 7; k++) { const x = -2.7 + k * .9, z = -.9 + (k % 2) * .5; b.beam("woodD", [x, y + H - .3, z], [x, y + 2.75, z], .012, .012); pillar(b, "thatch", x, z, y + 2.05, y + 2.75, .08, k % 3 === 0 ? { lean: [.04, 0] } : {}); }
    }),

  set("古装灵堂三壁内景", "影视置景·古装：灵堂，素白帷幔挂满三壁，后墙供桌上立牌位和遗像、烛火香炉，棺木停在供桌前，地上跪垫，白灯笼和纸花，青砖地面，梁架外露", "中式", "原始",
    { seed: "古装灵堂三壁内景", w: 7, d: 5.8, h: 4.4, pal: { wall: "#7d7a72", trim: "#3a3a3a", ...wood("#4a3a30", "#2a2220"), floorA: "#6d7075", floorB: "#62666b", beam: "#2a2220" }, floor: "flag", beams: "chinese",
      openings: [{ wall: "left", u: 1.2, w: 1.6, kind: "door", leaf: "none", backing: "night", h: 2.7 }] },
    (b, c) => {
      const { y, D, W, H } = c, bz = -D / 2, top = y + H;
      for (let k = 0; k < 7; k++) { const x = -3 + k; b.plate("drape", [x, top - .3, bz + .06], [x + .8, top - .3, bz + .06], [x + .75, y + 1.0, bz + .06], [x - .05, y + 1.2, bz + .06], .01); }
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const z = -1.8 + k * 1.6, x = s * (W / 2 - .06); if (s < 0 && z + 1.2 > .3 && z < 2.1) continue; b.plate("drape", [x, top - .3, z], [x, top - .3, z + 1.2], [x, y + 1.2, z + 1.15], [x, y + 1.0, z - .05], .01); }
      plainTable(b, 0, y, bz + .45, 0, 2.0, .55, .95, "woodD"); b.boxYaw("woodD", 0, y + 1.28, bz + .35, .26, .62, .05, 0); framed(b, 0, y + 2.2, bz + .14, 0, .75, .95, "paper", "woodD");
      candle(b, -.7, y + .95, bz + .45, .22); candle(b, .7, y + .95, bz + .45, .22); bowl(b, 0, y + .95, bz + .62, .12, .08, "metal"); bowl(b, -.45, y + .95, bz + .62, .11, .05); bowl(b, .45, y + .95, bz + .62, .11, .05);
      coffin(b, 0, y, bz + 2.0, 0, 2.2, .72, .66); for (let k = 0; k < 8; k++) b.sphere("porcelain", [-1.4 + k * .4, y + .15 + (k % 2) * .06, bz + 1.0 + (k % 3) * .5], .12);
      for (const z of [.6, 1.3]) b.boxYaw("cloth", 0, y + .02, z, 1.3, .04, .6, 0);
      for (const [x, z] of [[-2.7, -1.2], [2.7, -1.2], [-2.7, 1.4], [2.7, 1.4]] as [number, number][]) lantern(b, x, y + 3.0, z, .22, .7, "lampWhite");
    }),

  set("古装喜堂三壁内景", "影视置景·古装：婚礼喜堂，红绸满墙、红烛红灯笼，天地桌设在后墙正中，两把太师椅居高堂，红毯从镜头一直铺到案前，囍字剪纸贴满，青砖地面", "中式", "原始",
    { seed: "古装喜堂三壁内景", w: 7.4, d: 5.8, h: 4.4, pal: { wall: "#e8d8b8", wainscot: "#8a3a30", trim: "#4a2a24", ...wood("#6a3a2c", "#3a2018"), floorA: "#6d7075", floorB: "#62666b", beam: "#4a2a24", rug: "#b02a2a", rugB: "#e0b44a" }, floor: "flag", wainscot: 1.1, beams: "chinese",
      openings: [{ wall: "right", u: 1.2, w: 1.6, kind: "door", leaf: "none", backing: "day", h: 2.7 }] },
    (b, c) => {
      const { y, D, W, H } = c, bz = -D / 2, top = y + H;
      for (let k = 0; k < 8; k++) { const x = -3.3 + k * .95; b.plate("red", [x, top - .3, bz + .08], [x + .8, top - .3, bz + .08], [x + .7, y + 1.5, bz + .08], [x - .05, y + 1.7, bz + .08], .01); }
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const z = -1.8 + k * 1.6, x = s * (W / 2 - .08); if (s > 0 && z + 1.2 > .3 && z < 2.1) continue; b.plate("red", [x, top - .3, z], [x, top - .3, z + 1.2], [x, y + 1.6, z + 1.15], [x, y + 1.8, z - .05], .01); }
      for (const x of [-1.5, 0, 1.5]) { b.boxYaw("red", x, y + 2.4, bz + .13, .55, .55, .01, 0); b.boxYaw("rugB", x, y + 2.4, bz + .136, .4, .4, .006, 45); }
      plainTable(b, 0, y, bz + .7, 0, 2.0, .7, .95, "woodD"); b.boxYaw("red", 0, y + .97, bz + .7, 2.06, .02, .76, 0); candle(b, -.7, y + .98, bz + .7, .26); candle(b, .7, y + .98, bz + .7, .26); bowl(b, 0, y + .98, bz + .8, .15, .09, "metal"); for (let k = 0; k < 5; k++) b.sphere("red", [-.3 + k * .15, y + 1.04, bz + .95], .06);
      seat(b, -.8, y, bz + 1.5, 0, "woodD", true, .62); seat(b, .8, y, bz + 1.5, 0, "woodD", true, .62);
      rug(b, 0, y, .9, 0, 1.6, 3.6, "rug", "rugB");
      for (const [x, z] of [[-2.6, -1.8], [2.6, -1.8], [-2.8, 0], [2.8, 0], [-2.6, 1.8], [2.6, 1.8]] as [number, number][]) lantern(b, x, y + 3.2, z, .26, .8, "lampRed");
    }),

  set("古装衙门公堂三壁内景", "影视置景·古装：县衙公堂，红柱列于两侧，后墙立大屏、悬匾额，高台上公案笔架签筒惊堂木齐备，两侧水火棍架和堂鼓，青砖地面，大门敞开透光", "中式", "原始",
    { seed: "古装衙门公堂三壁内景", w: 9, d: 7, h: 5.2, pal: { wall: "#d9d2c0", wainscot: "#7a2f2a", trim: "#3a2c22", ...wood("#6a4a35", "#2f2018"), floorA: "#6f7378", floorB: "#62666b", beam: "#3a2c22" }, floor: "flag", wainscot: 1.2, beams: "chinese",
      openings: [{ wall: "right", u: 1.6, w: 1.5, kind: "door", leaf: "none", backing: "day", h: 3.0 }] },
    (b, c) => {
      const { y, D, W } = c, bz = -D / 2;
      b.box("stone", 0, y + .17, bz + 1.0, 5.2, .34, 1.8); b.box("stone", 0, y + .09, bz + 2.05, 5.0, .18, .4);
      screen(b, 0, y + .34, bz + .35, 0, 5.0, 2.6, 3, "woodD", "paper"); b.boxYaw("woodD", 0, y + 4.1, bz + .1, 3.4, .85, .1, 0); b.boxYaw("rugB", 0, y + 4.1, bz + .16, 3.2, .65, .02, 0);
      plainTable(b, 0, y + .34, bz + 1.1, 0, 3.2, .9, .95, "woodD"); b.boxYaw("red", 0, y + 1.31, bz + 1.1, 3.28, .02, .96, 0); b.boxYaw("woodD", -.5, y + 1.34, bz + 1.0, .16, .06, .1, 0);
      pillar(b, "woodD", .9, bz + 1.2, y + 1.3, y + 1.5, .09, { sides: 8 }); for (let k = 0; k < 4; k++) b.beam("red", [.88 + k * .03, y + 1.5, bz + 1.2], [.86 + k * .04, y + 1.8, bz + 1.2], .012, .012);
      seat(b, 0, y + .34, bz + .75, 0, "woodD", true, .7);
      for (const x of [-3.5, 3.5]) for (const z of [-1.5, 1.7]) pillar(b, "red", x, z, y, y + 4.7, .3);
      for (const s of [-1, 1]) for (let k = 0; k < 6; k++) b.beam("woodD", [s * (W / 2 - .3), y, -.5 + k * .25], [s * (W / 2 - .1), y + 1.6, -.5 + k * .25], .05, .05);
      drum(b, -W / 2 + .8, y, 1.0, .42, .65, "red"); rug(b, 0, y, 1.1, 0, 2.4, 3.2, "rug", "rugB");
      for (const s of [-1, 1]) lantern(b, s * 2.8, y + 3.2, bz + 1.0, .28, .9, "lampRed");
    }),

  set("古装大牢囚室三壁内景", "影视置景·古装：刑牢囚室，三面石墙围合、正面立粗木栏杆留出牢门（镜头隔着栏杆往里拍），稻草铺地、铁链木桶、破碗，高处一扇小窗漏进冷光，墙面污渍陈旧", "中式", "老旧",
    { seed: "古装大牢囚室三壁内景", w: 5.4, d: 4.6, h: 3.6, pal: { wall: "#7d7a72", trim: "#4a4842", ...wood("#5a4a3a", "#2f261d"), floorA: "#55534e", floorB: "#4a4843", metal: "#4a4d50" }, floor: "flag", crown: false, baseboard: false, dirt: .9,
      openings: [{ wall: "back", u: 1.3, w: .6, kind: "window", sill: 2.3, h: .6, muntins: 2 }] },
    (b, c) => {
      const { y, D, W, rng } = c, bz = -D / 2, fz = D / 2 - .08;
      bars(b, -W / 2 + .1, fz, .3, fz, y, 3.3, .14, "woodD"); bars(b, 1.2, fz, W / 2 - .1, fz, y, 3.3, .14, "woodD");
      b.beam("woodD", [.3, y + 2.5, fz], [1.2, y + 2.5, fz], .1, .12); b.tbox("woodD", [1.2 - .45 * Math.cos(70 * Math.PI / 180), y + 1.27, fz - .45 * Math.sin(70 * Math.PI / 180)], [.9, 2.3, .05], -70);
      b.dune("thatch", rng, -1.0, -.5, 1.5, 1.1, .16, 10, y); b.dune("thatchD", rng, -1.9, -1.4, .9, .7, .2, 40, y);
      b.box("woodD", -1.9, y + .3, 1.2, 1.6, .1, .6); for (const [x, z] of [[-2.6, .95], [-1.2, .95], [-2.6, 1.45], [-1.2, 1.45]] as [number, number][]) pillar(b, "woodD", x, z, y, y + .3, .05, { sides: 6 });
      pillar(b, "wood", 1.5, bz + .6, y, y + .5, .24, { sides: 10 }); bowl(b, -.3, y + .02, 1.3, .1, .05, "metal"); bowl(b, -.6, y + .02, 1.5, .1, .04, "rust");
      for (const x of [-2.4, -1.6]) { b.sphere("metal", [x, y + 2.1, bz + .08], .06); b.boxYaw("metal", x + .2, y + .46, bz + .2, .1, .1, .05, 0); }
      chain(b, [-2.4, y + 2.1, bz + .1], [-2.2, y + .5, bz + .2], .25); chain(b, [-1.6, y + 2.1, bz + .1], [-1.4, y + .5, bz + .2], .25);
      b.box("metal", -W / 2 + .12, y + 1.7, 1.8, .16, .04, .12); pillar(b, "woodD", -W / 2 + .2, 1.8, y + 1.7, y + 1.78, .07); b.sphere("lamp", [-W / 2 + .2, y + 1.9, 1.8], .09);
    }),

  set("民国老上海公寓客厅三壁内景", "影视置景·民国：老上海弄堂公寓客厅，竖条墙纸配深色墙裙，皮沙发、圆茶几、留声机、落地灯，相框挂墙，窗前垂厚帘，木地板铺地毯", "现代", "原始",
    { seed: "民国老上海公寓客厅三壁内景", w: 6, d: 5, h: 3.3, pal: { wall: "#cdb89a", stripe: "#b9a07e", wainscot: "#4a3a2c", trim: "#2f241b", ...wood("#5a4030", "#2a1f17"), floorA: "#7a5a3a", floorB: "#6c4f33", curtain: "#6a2f3a", rug: "#6a3a3a", rugB: "#c9a45a" }, floor: "plank", plank: .14, wainscot: 1.0, stripes: true,
      openings: [{ wall: "back", u: -1.6, w: 1.3, kind: "window", sill: .95, h: 1.7, muntins: 3, curtain: true }, { wall: "right", u: 1.2, w: 1.0, kind: "door", leaf: "ajar" }] },
    (b, c) => {
      const { y, D } = c, bz = -D / 2;
      sofa(b, .4, y, bz + .5, 0, 2.1, "leather"); sofa(b, -2.55, y, .1, 90, .9, "leather", .8);
      pillar(b, "woodD", .4, -.75, y, y + .5, .46, { sides: 14 }); pillar(b, "mirror", .4, -.75, y + .5, y + .53, .5, { sides: 14 }); bowl(b, .4, y + .53, -.75, .12, .06);
      plainTable(b, 1.7, y, bz + .4, 0, .6, .45, .62, "woodD"); tableLamp(b, 1.7, y + .62, bz + .4, "metal"); standLamp(b, -1.15, y, bz + .5);
      b.boxYaw("woodD", -2.5, y + .45, -1.4, .5, .9, .8, 90); b.boxYaw("woodD", -2.5, y + .93, -1.4, .3, .08, .4, 90);
      for (let k = 0; k < 5; k++) pillar(b, "metal", -2.5, -1.4, y + .97 + k * .09, y + 1.06 + k * .09, .04 + k * .035, { sides: 10 });
      for (const [x, w] of [[-.6, .5], [.3, .45], [1.1, .5]] as [number, number][]) framed(b, x, y + 2.0 + (x > 0 ? .1 : 0), bz + .04, 0, w, w * 1.25, "paper", "woodD");
      rug(b, .2, y, 1.0, 0, 3.0, 2.0); bulb(b, 0, y + 2.8, .6, .4);
    }),

  set("民国理发店三壁内景", "影视置景·民国：老式理发店，两把铁座皮理发椅对着满墙大镜，镜下长台摆满瓶罐，黑白方砖地，墙裙白瓷砖，洗头盆、候座长凳，吊灯暖黄，窗外街景发亮", "现代", "原始",
    { seed: "民国理发店三壁内景", w: 6.2, d: 4.6, h: 3.4, pal: { wall: "#a9c4b0", wainscot: "#e8ece6", trim: "#5a6a5e", ...wood("#6a4a35", "#2f2018"), floorA: "#e6e4dc", floorB: "#2f3236", curtain: "#4a6a7a" }, floor: "tile", tileSize: .4, wainscot: 1.3,
      openings: [{ wall: "right", u: -.2, w: 1.4, kind: "window", sill: 1.0, h: 1.6, muntins: 3, curtain: true }, { wall: "left", u: 1.2, w: 1.0, kind: "door", leaf: "ajar" }] },
    (b, c) => {
      const { y, D } = c, bz = -D / 2;
      for (const x of [-1.7, 1.0]) mirror(b, x, y + 1.75, bz + .06, 0, 1.7, 1.3);
      plainTable(b, 0, y, bz + .35, 0, 4.6, .5, .95, "woodD");
      for (let k = 0; k < 14; k++) pillar(b, k % 3 ? "porcelain" : "glass", -2.1 + k * .3, bz + .36, y + .95, y + 1.1 + (k % 4) * .03, .04, { sides: 8 });
      for (const x of [-1.7, 1.0]) {
        const z = bz + 1.5;
        pillar(b, "steel", x, z, y, y + .25, .28, { sides: 10 }); pillar(b, "steel", x, z, y + .25, y + .6, .07, { sides: 8 });
        b.boxYaw("leather", x, y + .72, z, .62, .14, .6, 0); b.boxYaw("leather", x, y + 1.15, z + .28, .6, .8, .12, 0);
        for (const s of [-1, 1]) b.boxYaw("leather", x + s * .34, y + .9, z, .08, .06, .5, 0);
        b.boxYaw("steel", x, y + .38, z - .37, .5, .05, .22, 0);
      }
      b.boxYaw("porcelain", 2.5, y + .95, 1.2, .8, .1, .6, 0); pillar(b, "porcelain", 2.5, 1.2, y, y + .95, .14, { sides: 10 }); b.beam("steel", [2.5, y + .95, 1.0], [2.5, y + 1.4, 1.0], .03, .03);
      for (let k = 0; k < 3; k++) stool(b, -2.6 + k * .6, y, 1.8, "wood", .2, .46);
      for (const x of [-1.7, 0, 1.7]) bulb(b, x, y + 2.7, .5, .6);
    }),

  set("民国旧书店三壁内景", "影视置景·民国：旧书店，三面墙从地到顶全是书架，滚轮书梯靠着后墙，中间书桌堆满旧书，柜台上算盘钱匣，绿罩台灯，木地板磨得发亮", "现代", "老旧",
    { seed: "民国旧书店三壁内景", w: 6.8, d: 5.6, h: 3.6, pal: { wall: "#7a5a40", wainscot: "#5a3f2c", trim: "#2f241b", ...wood("#6a4a35", "#2a1f17"), floorA: "#8a6a47", floorB: "#7b5c3b" }, floor: "plank", plank: .15,
      openings: [{ wall: "left", u: 1.9, w: 1.0, kind: "door", leaf: "closed" }] },
    (b, c) => {
      const { y, D, W, rng } = c, bz = -D / 2, rows = 7;
      for (const x of [-2.6, -1.3, 0, 1.3, 2.6]) shelf(b, rng, x, y, bz + .2, 0, 1.28, 3.2, .34, rows, "woodD", true);
      for (const z of [-1.4, 0, 1.4]) shelf(b, rng, W / 2 - .2, y, z, 270, 1.28, 3.2, .34, rows, "woodD", true);
      for (const z of [-1.6, -.3]) shelf(b, rng, -W / 2 + .2, y, z, 90, 1.28, 3.2, .34, rows, "woodD", true);
      for (const x of [-1.0, .2]) b.beam("woodD", [x, y, bz + .45], [x - .3, y + 2.6, bz + .45], .05, .05);
      for (let k = 0; k < 9; k++) b.beam("woodD", [-1.0 - (.3 + k * .28) * .1154, y + .3 + k * .28, bz + .45], [.2 - (.3 + k * .28) * .1154, y + .3 + k * .28, bz + .45], .03, .03);
      plainTable(b, 0, y, .2, 0, 2.2, 1.0, .78, "woodD");
      for (let k = 0; k < 6; k++) b.boxYaw(rng.pick(["book1", "book2", "book3"]), rng.range(-.8, .8), y + .81 + k * .07, rng.range(-.3, .3) + .2, .3, .06, .22, rng.range(-30, 30));
      plainTable(b, 2.2, y, 1.4, 0, 1.6, .6, 1.0, "woodD"); b.boxYaw("metal", 2.0, y + 1.1, 1.4, .3, .2, .25, 0); b.boxYaw("woodD", 2.5, y + 1.03, 1.4, .3, .04, .12, 0); tableLamp(b, 1.7, y + 1.0, 1.35, "metal");
      for (let k = 0; k < 8; k++) b.boxYaw(rng.pick(["book1", "book2", "book3"]), -2.3 + rng.range(0, 1), y + .05 + (k % 4) * .16, 1.8 + rng.range(-.1, .1), .3, .15, .22, rng.range(-12, 12));
      bulb(b, 0, y + 3.0, .4, .5);
    }),

  set("民国谍战电报密室三壁内景", "影视置景·民国：地下电报密室，毛坯水泥墙三面，木桌上电台、发报键、打字机，桌灯一盏，墙上钉地图和标记，行军床、文件箱、铁门，光秃秃的灯泡，墙面返潮", "现代", "老旧",
    { seed: "民国谍战电报密室三壁内景", w: 4.8, d: 4.2, h: 3.0, pal: { wall: "#8d8f8a", trim: "#5a5c58", ...wood("#6a4a35", "#2a1f17"), floorA: "#6b6d69", floorB: "#5f615d" }, floor: "concrete", crown: false, baseboard: false, dirt: .7,
      openings: [{ wall: "left", u: 1.2, w: 1.0, kind: "door", leaf: "closed" }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      plainTable(b, .4, y, bz + .6, 0, 1.8, .8, .78, "woodD"); b.boxYaw("metal", 0, y + .89, bz + .55, .5, .22, .35, 0); b.boxYaw("screen", 0, y + .91, bz + .73, .34, .1, .01, 0); pillar(b, "metal", -.15, bz + .6, y + .78, y + .83, .05); b.boxYaw("metal", .8, y + .82, bz + .7, .4, .08, .3, 0); b.boxYaw("woodD", .8, y + .87, bz + .75, .1, .02, .1, 0); tableLamp(b, 1.2, y + .78, bz + .4, "metal");
      seat(b, .4, y, bz + 1.3, 180, "woodD", false, .44);
      b.boxYaw("paper", -.4, y + 1.7, bz + .03, 1.6, 1.1, .01, 0); for (let k = 0; k < 7; k++) b.sphere(k % 2 ? "red" : "metal", [-1.0 + rng.range(0, 1.2), y + 1.35 + rng.range(0, .7), bz + .06], .03);
      b.boxYaw("metal", 1.9, y + .3, .6, .7, .06, 1.8, 0); b.boxYaw("cloth", 1.9, y + .38, .6, .62, .1, 1.7, 0); for (const z of [-.2, 1.4]) b.beam("metal", [1.9, y, z], [1.9, y + .3, z], .04, .04);
      for (let k = 0; k < 4; k++) b.boxYaw("woodD", -1.7, y + .15 + k * .3, bz + .7 + (k % 2) * .05, .8, .3, .5, 3 * k);
      pillar(b, "metal", -1.2, -.6, y, y + .3, .09, { sides: 8 }); bulb(b, .4, y + 2.5, .2, .5);
    }),

  set("戏班后台化妆间三壁内景", "影视置景·民国：戏班后台，三张化妆桌排在后墙下，每面镜子围一圈灯泡，戏箱靠墙，衣架上挂满戏服，脸谱和旗帜挂墙，木地板，右侧出口通向舞台透进强光", "现代", "原始",
    { seed: "戏班后台化妆间三壁内景", w: 7.4, d: 5, h: 3.6, pal: { wall: "#a78e6c", wainscot: "#5a4030", trim: "#3a2c22", ...wood("#6a4a35", "#2a1f17"), floorA: "#8a6a47", floorB: "#7b5c3b", curtain: "#8a2f3a" }, floor: "plank", plank: .2, wainscot: .9,
      openings: [{ wall: "right", u: .8, w: 1.4, kind: "door", leaf: "none", backing: "day", h: 2.6 }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      for (const x of [-2.2, -.4, 1.4]) {
        plainTable(b, x, y, bz + .4, 0, 1.4, .6, .78, "woodD"); mirror(b, x, y + 1.55, bz + .06, 0, .9, 1.0); stool(b, x, y, bz + 1.1, "wood", .2);
        for (let k = 0; k < 6; k++) b.sphere("lamp", [x - .5 + k * .2, y + 2.15, bz + .09], .045);
        for (const s of [-1, 1]) for (let j = 0; j < 4; j++) b.sphere("lamp", [x + s * .5, y + 1.1 + j * .28, bz + .09], .045);
        bowl(b, x - .4, y + .78, bz + .4, .06, .04, "red"); bowl(b, x + .3, y + .78, bz + .35, .07, .05, "porcelain");
      }
      robes(b, rng, -2.2, y, 1.4, 0, 2.2, 1.5, ["red", "curtain", "rugB", "porcelain"]); robes(b, rng, .6, y, 1.4, 0, 2.2, 1.4, ["curtain", "red", "leaf"]);
      for (const z of [-1.5, -.5, .5]) chest(b, -3.4, y, z, 90, 1.0, .65, .6, "woodD");
      for (let k = 0; k < 4; k++) framed(b, -3.68, y + 2.0 + (k % 2) * .25, -1.3 + k * .55, 90, .32, .4, k % 2 ? "red" : "rugB", "woodD");
      lantern(b, 2.6, y + 2.7, .2, .24, .6, "lampRed"); lantern(b, -.4, y + 2.7, .8, .22, .6);
    }),
];
