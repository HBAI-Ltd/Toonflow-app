import { filmRoom } from "./filmSetBatchOne";
import { pillar } from "./ruinProps";
import { cabinet, candle, chair, framed, mirror, monitor, plainTable, rug, screen, seat, stool, tableLamp, tubeLight } from "./setDressing";
import { basin, bathtub, bedModern, chandelier, counter, drape, pew, roundTable, serverRack, toilet } from "./setDressingTwo";
import type { ArchitecturePrototype } from "./structures";

// 影视内景三壁置景·现代生活（二）：电梯轿厢、法庭、新闻演播室、健身房、指挥中心、卧室、厨房、浴室、便利店、教堂、中餐包间。
export const filmSetDesignsSix: ArchitecturePrototype[] = [
  filmRoom("现代电梯轿厢三壁内景不锈钢镜面按钮", "影视置景·现代：电梯轿厢内部，不锈钢壁板、后墙镜面、三面扶手，右墙按钮面板亮着楼层键和红色楼层数字，门口敞开能看到门框和半开的轿门，顶角监控探头和灯带，悬疑恐怖戏的经典小空间", "现代", "原始",
    { seed: "现代电梯轿厢", w: 1.9, d: 1.7, h: 2.5, pal: { wall: "#b9bcc0", trim: "#7a7d82", wood: "#aeb2b6", woodD: "#4a4d52", floorA: "#4a4a4e", floorB: "#3f3f43", metal: "#9aa0a4" }, floor: "tile", tileSize: .475, crown: false },
    (b, c) => {
      const { y, D, W } = c, bz = -D / 2;
      mirror(b, 0, y + 1.3, bz + .05, 0, 1.5, 1.3, "steel");
      for (const [x0, z0, x1, z1] of [[-W / 2 + .1, bz + .1, -W / 2 + .1, D / 2 - .15], [W / 2 - .1, bz + .1, W / 2 - .1, D / 2 - .15], [-W / 2 + .1, bz + .1, W / 2 - .1, bz + .1]] as [number, number, number, number][]) b.beam("steel", [x0, y + .9, z0], [x1, y + .9, z1], .04, .04);
      const [px, py, pz] = c.wallPoint("right", .5, y + 1.15, .03); b.box("dark", px, py, pz, .04, .95, .3);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 6; j++) { const [bx, by, bz2] = c.wallPoint("right", .5 + (i - .5) * .1, y + .85 + j * .12, .06); b.box(j === 3 && i === 0 ? "lampRed" : "glowB", bx, by, bz2, .03, .05, .05); }
      const [dx, dy, dz] = c.wallPoint("right", .5, y + 1.8, .05); b.box("lampRed", dx, dy, dz, .03, .12, .22);
      b.box("steel", -W / 2 + .05, y + 1.1, D / 2, .1, 2.2, .12); b.box("steel", W / 2 - .05, y + 1.1, D / 2, .1, 2.2, .12); b.box("steel", 0, y + 2.2, D / 2, W, .12, .12);
      b.box("steel", -W / 2 + .3, y + 1.05, D / 2 - .02, .35, 2.1, .04); b.box("steel", W / 2 - .3, y + 1.05, D / 2 - .02, .35, 2.1, .04);
      b.sphere("dark", [W / 2 - .2, y + 2.3, bz + .2], .08); b.box("lampWhite", 0, y + 2.42, bz + .08, 1.5, .04, .08); b.box("lampWhite", -W / 2 + .08, y + 2.42, 0, .08, .04, 1.2); b.box("lampWhite", W / 2 - .08, y + 2.42, 0, .08, .04, 1.2);
    }, ["电梯", "轿厢", "悬疑", "恐怖"]),

  filmRoom("现代法庭三壁内景审判席旁听席", "影视置景·现代：法庭，深色木护墙，后墙高台上审判席和国徽，两侧旗帜、书记员席和证人席，原被告席各一张对着审判席，木栏杆隔开后面三排旁听长椅，高窗透光，吊灯，庄重肃穆", "现代", "原始",
    { seed: "现代法庭", w: 11, d: 9, h: 5.0, pal: { wall: "#c9bd9e", wainscot: "#5a3f2c", trim: "#3a2c22", wood: "#6a4a35", woodD: "#2a1f17", floorA: "#4a4038", floorB: "#423830", rug: "#5a2a2a", rugB: "#c9a45a" }, floor: "carpet", wainscot: 2.0,
      openings: [{ wall: "left", u: -1.0, w: 1.4, kind: "window", sill: 2.4, h: 1.6, muntins: 3, backing: "day" }, { wall: "left", u: 1.4, w: 1.4, kind: "window", sill: 2.4, h: 1.6, muntins: 3, backing: "day" }, { wall: "right", u: 3.0, w: 1.4, kind: "door", leaf: "ajar", h: 2.6 }] },
    (b, c) => {
      const { y, D, W } = c, bz = -D / 2;
      b.box("woodD", 0, y + .25, bz + 1.5, 6.4, .5, 3.0); counter(b, 0, y + .5, bz + 2.3, 0, 4.6, .8, 1.1, "woodD", "wood"); seat(b, 0, y + .5, bz + 1.2, 0, "leather", true, .7); b.boxYaw("leather", 0, y + 1.9, bz + .9, .7, .9, .08, 0);
      b.box("gold", 0, y + 3.7, bz + .08, 1.4, 1.4, .04); b.box("red", 0, y + 3.7, bz + .11, 1.0, 1.0, .02);
      for (const x of [-3.4, 3.4]) { b.beam("woodD", [x, y, bz + .4], [x, y + 3.2, bz + .4], .05, .05); b.plate("red", [x, y + 3.1, bz + .4], [x + (x < 0 ? .9 : -.9), y + 3.0, bz + .4], [x + (x < 0 ? .9 : -.9), y + 2.2, bz + .42], [x, y + 2.3, bz + .4], .01); }
      plainTable(b, -3.4, y, bz + 3.6, 0, 1.6, .7, .78, "wood"); seat(b, -3.4, y, bz + 4.3, 180, "woodD", false, .5); b.box("woodD", 3.3, y + .5, bz + 3.6, 1.2, 1.0, 1.0); b.beam("wood", [2.7, y + 1.0, bz + 3.1], [3.9, y + 1.0, bz + 3.1], .06, .06);
      for (const x of [-2.0, 2.0]) { plainTable(b, x, y, bz + 5.4, 0, 2.0, .8, .78, "wood"); seat(b, x - .5, y, bz + 6.1, 180, "woodD", false, .5); seat(b, x + .5, y, bz + 6.1, 180, "woodD", false, .5); }
      for (const [x0, x1] of [[-W / 2 + .2, -.6], [.6, W / 2 - .2]] as [number, number][]) { b.beam("woodD", [x0, y + 1.0, bz + 7.0], [x1, y + 1.0, bz + 7.0], .08, .08); for (let x = x0; x <= x1 + .01; x += .3) b.beam("woodD", [x, y, bz + 7.0], [x, y + 1.0, bz + 7.0], .04, .04); }
      for (const x of [-2.6, 2.6]) for (let i = 0; i < 3; i++) pew(b, x, y, bz + 7.7 + i * .9, 180, 2.4, "wood");
      for (const x of [-2.5, 2.5]) chandelier(b, x, y + 4.2, 0, .6, 8, 1.0);
    }, ["法庭", "审判", "法院", "律师"]),

  filmRoom("现代新闻演播室三壁内景主播台灯架", "影视置景·现代：电视台新闻演播室，深蓝墙前整面 LED 屏幕墙，主播台配两把主播椅，台前两台带提词器的摄像机，顶上灯架排满聚光灯，地面光亮反射，右侧门通向后台", "现代", "原始",
    { seed: "现代新闻演播室", w: 9, d: 7.4, h: 5.0, pal: { wall: "#1c2230", trim: "#2a3246", wood: "#d8dce2", woodD: "#2a2d34", floorA: "#2a2d34", floorB: "#25282f", metal: "#5a6070" }, floor: "tile", tileSize: 1.0, baseboard: false, crown: false,
      openings: [{ wall: "right", u: 2.0, w: 1.4, kind: "door", leaf: "ajar", h: 2.4, backing: "dark" }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) b.box(rng.pick(["screen", "glowB", "neonC", "screen"]), -2.55 + i * 1.7, y + 1.0 + j * 1.0, bz + .08, 1.62, .94, .03);
      counter(b, 0, y, bz + 2.6, 0, 3.6, .9, .95, "woodD", "porcelain"); b.box("neonC", 0, y + .6, bz + 3.06, 3.4, .06, .02);
      seat(b, -.8, y, bz + 1.7, 0, "leather", false, .5); seat(b, .8, y, bz + 1.7, 0, "leather", false, .5); monitor(b, -.9, y + .95, bz + 2.5, 180, true, .4, .25); monitor(b, .9, y + .95, bz + 2.5, 180, true, .4, .25);
      for (const x of [-2.2, 2.2]) { for (const [dx, dz] of [[-.3, .3], [.3, .3], [0, -.4]] as [number, number][]) b.beam("steel", [x, y + 1.0, 1.4], [x + dx, y, 1.4 + dz], .04, .04); b.box("dark", x, y + 1.15, 1.4, .5, .4, .7); b.sphere("glass", [x, y + 1.15, 1.0], .1); b.box("glass", x, y + 1.2, .9, .45, .35, .02); }
      for (const z of [-1.5, .5, 2.5]) b.beam("metal", [-4, y + 4.4, z], [4, y + 4.4, z], .06, .06); for (const x of [-4, -2, 0, 2, 4]) b.beam("metal", [x, y + 4.4, -1.5], [x, y + 4.4, 2.5], .06, .06);
      for (let k = 0; k < 9; k++) b.box("lampWhite", -3.6 + k * .9, y + 4.2, [-1.5, .5, 2.5][k % 3]!, .3, .25, .3);
    }, ["演播室", "新闻", "电视台", "直播"]),

  filmRoom("现代健身房三壁内景跑步机镜墙器械", "影视置景·现代：健身房，黑色橡胶地面，后墙整面大镜子，三台跑步机一字排开面对镜子，右侧哑铃架和卧推架、天花吊着沙袋，地上几块瑜伽垫，左墙窗透进天光，灯管成排", "现代", "原始",
    { seed: "现代健身房", w: 9, d: 6.4, h: 3.6, pal: { wall: "#dcdcd6", trim: "#6a6a70", wood: "#8a6a4a", woodD: "#2a2a2e", floorA: "#2f2f33", floorB: "#28282c", metal: "#8a8e94" }, floor: "concrete",
      openings: [{ wall: "left", u: 0, w: 2.4, kind: "window", sill: 1.0, h: 1.8, muntins: 0, backing: "day" }, { wall: "right", u: 2.4, w: 1.2, kind: "door", leaf: "ajar", h: 2.3 }] },
    (b, c) => {
      const { y, D, W } = c, bz = -D / 2;
      for (const x of [-3, 0, 3]) mirror(b, x, y + 1.4, bz + .06, 0, 2.7, 1.9, "dark");
      for (const x of [-3.0, -1.8, -.6]) { b.box("dark", x, y + .25, -.6, .8, .15, 1.8); for (const s of [-1, 1]) b.box("steel", x + s * .42, y + .6, -.7, .05, .7, 1.4); b.box("dark", x, y + 1.25, -1.4, .7, .4, .12); b.box("screen", x, y + 1.25, -1.33, .5, .25, .01); }
      b.box("steel", 3.0, y + .35, bz + .4, 2.6, .08, .5); b.box("steel", 3.0, y + .85, bz + .4, 2.6, .08, .5); for (const s of [-1.2, 1.2]) b.box("steel", 3.0 + s, y + .45, bz + .4, .08, .9, .5);
      for (let i = 0; i < 8; i++) { pillar(b, "dark", 1.95 + i * .3, bz + .4, y + .39, y + .5, .09, { sides: 8 }); pillar(b, "dark", 1.95 + i * .3, bz + .4, y + .89, y + 1.0, .1, { sides: 8 }); }
      b.box("leather", 2.8, y + .45, 1.2, .5, .12, 1.3); for (const z of [.7, 1.7]) b.beam("steel", [2.8, y, z], [2.8, y + .45, z], .05, .05); for (const s of [-.4, .4]) b.beam("steel", [2.8 + s, y, .6], [2.8 + s, y + 1.3, .6], .05, .05);
      b.beam("steel", [2.2, y + 1.3, .6], [3.4, y + 1.3, .6], .04, .04); for (const s of [-1, 1]) pillar(b, "dark", 2.8 + s * .55, .6, y + 1.2, y + 1.4, .17, { sides: 10 });
      b.beam("metal", [-3.0, y + 3.6, 1.8], [-3.0, y + 2.6, 1.8], .02, .02); pillar(b, "red", -3.0, 1.8, y + 1.5, y + 2.6, .2, { sides: 10 });
      for (const [x, z, k] of [[-1.5, 2.1, "curtain"], [-.5, 2.3, "leaf"], [.5, 2.1, "red"]] as [number, number, string][]) b.boxYaw(k, x, y + .02, z, .6, .02, 1.8, 90);
      for (const [x, z] of [[-2.5, -.5], [2.5, -.5], [-2.5, 1.8], [2.5, 1.8]] as [number, number][]) tubeLight(b, x, y + 3.55, z, 1.4, 0, "lampCold");
    }, ["健身房", "运动", "器械"]),

  filmRoom("现代指挥中心三壁内景视频墙操作席", "影视置景·现代：安全或应急指挥中心，深蓝灯光下后墙整面视频墙、三排操作席配双屏显示器，右侧机柜一排亮着指示灯，顶上冷光灯带，左门通向走廊，科幻悬疑、警匪戏常用", "现代", "原始",
    { seed: "现代指挥中心", w: 9, d: 7, h: 3.8, pal: { wall: "#1c2432", trim: "#2a3448", wood: "#2a2d34", woodD: "#16181e", floorA: "#262a34", floorB: "#20242c", metal: "#5a6070" }, floor: "tile", tileSize: .6, baseboard: false, crown: false,
      openings: [{ wall: "left", u: 1.8, w: 1.2, kind: "door", leaf: "ajar", h: 2.3, backing: "dark" }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) b.box(rng.pick(["screen", "glowB", "glowG", "screen", "neonC"]), -3.2 + i * 1.6, y + 1.0 + j * .95, bz + .08, 1.54, .9, .03);
      for (const z of [-.8, 1.0, 2.8]) for (const x of [-2.8, 0, 2.8]) { b.box("dark", x, y + .4, z, 2.2, .8, .7); b.box("steel", x, y + .82, z, 2.24, .04, .74); monitor(b, x - .5, y + .82, z - .1, 0, true, .5, .32); monitor(b, x + .5, y + .82, z - .1, 0, true, .5, .32); seat(b, x, y, z + .8, 180, "woodD", false, .5); }
      for (let k = 0; k < 4; k++) serverRack(b, rng, c.W / 2 - .6, y, -2.4 + k * .75, 270);
      for (const z of [-2.5, 0, 2.5]) b.box("lampCold", 0, y + 3.7, z, 5.5, .04, .1);
    }, ["指挥中心", "监控室", "机房", "科幻"]),

  filmRoom("现代卧室三壁内景大床衣柜梳妆台", "影视置景·现代：公寓主卧，浅灰墙面，大床铺着灰蓝被子、两侧床头柜台灯，左边落地衣柜，对面梳妆台，窗挂纱帘半拉，地毯上一把椅子搭着衣服，适合日常戏和悬疑戏", "现代", "原始",
    { seed: "现代卧室", w: 4.8, d: 5.0, h: 2.8, pal: { wall: "#d4d6d8", trim: "#9a9ca0", wood: "#8a6a4a", woodD: "#3a3a40", floorA: "#a88a68", floorB: "#9a7e5e", curtain: "#e6e2d6", rug: "#6a7a8a", rugB: "#9aaaba" }, floor: "plank", plank: .16,
      openings: [{ wall: "left", u: -.8, w: 1.6, kind: "window", sill: .8, h: 1.6, muntins: 0, curtain: true, backing: "day" }, { wall: "right", u: 1.6, w: .95, kind: "door", leaf: "ajar", h: 2.1 }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      bedModern(b, .3, y, bz + 1.15, 0, 1.6, 2.0, "woodD", "book2"); for (const s of [-1, 1]) { plainTable(b, .3 + s * 1.2, y, bz + .3, 0, .45, .4, .5, "woodD"); tableLamp(b, .3 + s * 1.2, y + .5, bz + .3, "metal"); }
      cabinet(b, rng, -1.9, y, bz + .4, 0, 1.2, 2.2, .6, "wood", 0); plainTable(b, 1.9, y, bz + .4, 0, 1.0, .5, .76, "woodD"); mirror(b, 1.9, y + 1.4, bz + .06, 0, .7, .9); stool(b, 1.9, y, bz + 1.1, "woodD", .22, .45);
      rug(b, .3, y, 1.0, 0, 2.4, 1.8); chair(b, rng, 1.3, y, 1.6, 200, "woodD", false); b.tbox("curtain", [1.3, y + .62, 1.6], [.4, .06, .5], 200, 0, 8);
      framed(b, .3, y + 1.8, bz + .06, 0, 1.2, .7, "book2", "woodD");
    }, ["卧室", "公寓", "日常", "悬疑"]),

  filmRoom("现代厨房三壁内景橱柜灶台冰箱", "影视置景·现代：家庭厨房，白色橱柜呈 L 形转角、石英台面，灶台上方抽油烟机、水槽在窗下，右侧大冰箱，中间小餐桌两把椅子，吊灯，台面上锅碗瓢盆，适合家庭戏和凶杀戏", "现代", "原始",
    { seed: "现代厨房", w: 4.6, d: 4.4, h: 2.8, pal: { wall: "#e8e6dc", trim: "#a8a69a", wood: "#e4e2d8", woodD: "#8a8a8e", floorA: "#b8b4a8", floorB: "#aca89c", metal: "#8a8e94" }, floor: "tile", tileSize: .6,
      openings: [{ wall: "back", u: -.4, w: 1.4, kind: "window", sill: 1.1, h: 1.1, muntins: 2, backing: "day" }, { wall: "right", u: 1.4, w: .95, kind: "door", leaf: "ajar", h: 2.1 }] },
    (b, c) => {
      const { y, D, W, rng } = c, bz = -D / 2;
      counter(b, 0, y, bz + .35, 0, 4.4, .7, .9, "wood", "stone"); counter(b, -W / 2 + .35, y, bz + 1.9, 90, 2.2, .7, .9, "wood", "stone");
      b.box("wood", -.6, y + 2.0, bz + .2, 2.2, .7, .35); b.box("wood", 1.6, y + 2.0, bz + .2, 1.2, .7, .35); b.box("steel", -.4, y + .92, bz + .35, .7, .06, .5); b.beam("steel", [-.4, y + .95, bz + .15], [-.4, y + 1.2, bz + .15], .03, .03);
      b.box("dark", 1.4, y + .93, bz + .35, .6, .04, .5); for (const [dx, dz] of [[-.15, -.12], [.15, -.12], [-.15, .12], [.15, .12]] as [number, number][]) pillar(b, "dark", 1.4 + dx, bz + .35 + dz, y + .95, y + .98, .06, { sides: 8 }); b.box("steel", 1.4, y + 1.85, bz + .3, .8, .5, .45); b.box("steel", 1.4, y + 2.4, bz + .25, .3, .6, .3);
      b.box("steel", W / 2 - .4, y + .95, bz + 1.0, .75, 1.9, .7); b.beam("steel", [W / 2 - .78, y + 1.1, bz + .8], [W / 2 - .78, y + 1.6, bz + .8], .03, .03);
      plainTable(b, .3, y, 1.0, 0, 1.0, .8, .75, "woodD"); chair(b, rng, .3, y, .3, 0, "woodD", false); chair(b, rng, .3, y, 1.7, 180, "woodD", false);
      pillar(b, "steel", -1.4, bz + .35, y + .9, y + 1.1, .13, { sides: 10 }); pillar(b, "rust", -1.0, bz + .35, y + .9, y + 1.05, .1, { sides: 10 });
      for (const [x, z] of [[.3, .8], [-1.0, 1.0]] as [number, number][]) { b.beam("metal", [x, y + 2.8, z], [x, y + 2.1, z], .015, .015); pillar(b, "lampWhite", x, z, y + 2.0, y + 2.1, .15, { sides: 10 }); }
    }, ["厨房", "家庭", "凶杀"]),

  filmRoom("现代浴室三壁内景浴缸淋浴帘洗手台", "影视置景·现代：家庭浴室，白色瓷砖墙地，后墙下浴缸配半拉的淋浴帘，左侧马桶、右侧洗手台和镜柜，毛巾架，磨砂小窗透光，悬疑恐怖戏的经典场景", "现代", "原始",
    { seed: "现代浴室", w: 3.6, d: 3.4, h: 2.7, pal: { wall: "#eeeeea", trim: "#b8b8b2", wood: "#dcdcd6", woodD: "#8a8a8e", floorA: "#d8d8d2", floorB: "#c8c8c2", metal: "#9aa0a4" }, floor: "tile", tileSize: .3,
      openings: [{ wall: "back", u: 1.1, w: .8, kind: "window", sill: 1.5, h: .7, muntins: 0, backing: "day" }, { wall: "right", u: .9, w: .85, kind: "door", leaf: "ajar", h: 2.1 }] },
    (b, c) => {
      const { y, D, W } = c, bz = -D / 2;
      bathtub(b, -.4, y, bz + .45, 0, 1.7, .8); b.beam("steel", [-.4 - .7, y + 2.1, bz + .9], [-.4 + .9, y + 2.1, bz + .9], .02, .02); drape(b, -.4 - .7, bz + .9, -.4 + .1, bz + .9, y + .6, y + 2.1, "porcelain", 5, .04);
      b.beam("steel", [-1.15, y + 1.2, bz + .1], [-1.15, y + 2.0, bz + .1], .025, .025); b.beam("steel", [-1.15, y + 2.0, bz + .1], [-1.15, y + 2.0, bz + .3], .025, .025); pillar(b, "steel", -1.15, bz + .3, y + 1.95, y + 2.0, .08, { sides: 8 });
      toilet(b, -W / 2 + .5, y, .3, 90); basin(b, W / 2 - .45, y, -.2, 270); mirror(b, W / 2 - .1, y + 1.5, -.2, 270, .6, .8, "steel");
      b.beam("steel", [-W / 2 + .06, y + 1.2, 1.0], [-W / 2 + .06, y + 1.2, 1.5], .03, .03); b.box("porcelain", -W / 2 + .06, y + 1.0, 1.25, .02, .4, .35);
      pillar(b, "lampWhite", 0, .6, y + 2.65, y + 2.68, .12, { sides: 8 });
    }, ["浴室", "卫生间", "恐怖", "悬疑"]),

  filmRoom("现代便利店三壁内景货架冰柜收银台", "影视置景·现代：夜间便利店，白色墙面，三排货架摆满零食饮料，后墙一整排亮着冷光的饮料冰柜，右前收银台和关东煮保温柜，左墙大窗外是夜色街道，冷白灯管成排，抢劫戏和深夜戏常用", "现代", "原始",
    { seed: "现代便利店", w: 9, d: 6.4, h: 3.4, pal: { wall: "#eeeeea", trim: "#9a9a9e", wood: "#c8c8c2", woodD: "#4a4a50", floorA: "#d4d2c8", floorB: "#c8c6bc", metal: "#9aa0a4" }, floor: "tile", tileSize: .6,
      openings: [{ wall: "left", u: -.4, w: 3.0, kind: "window", sill: .8, h: 1.9, muntins: 0, backing: "night" }, { wall: "right", u: 2.4, w: 1.4, kind: "door", leaf: "ajar", h: 2.3, backing: "night" }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      for (let k = 0; k < 4; k++) { const x = -3.2 + k * 1.6; b.box("woodD", x, y + .5, bz + .35, 1.5, 1.0, .65); b.box("glass", x, y + 1.6, bz + .5, 1.45, 1.7, .04); b.box("lampCold", x, y + 1.6, bz + .12, 1.4, 1.6, .03); for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) pillar(b, rng.pick(["red", "glass", "liquid", "book2", "leaf"]), x - .6 + i * .24, bz + .3, y + .95 + r * .4, y + 1.15 + r * .4, .05, { sides: 6 }); }
      const goods = ["red", "book1", "book2", "book3", "porcelain", "leaf", "gold", "curtain"];
      for (const z of [-.2, 1.6]) for (const x0 of [-2.2, 1.4]) { b.box("steel", x0, y + .8, z, 2.6, 1.6, .5); for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) b.box(rng.pick(goods), x0 - 1.15 + i * .29, y + .3 + r * .38, z, .2, .22, .4); }
      counter(b, 3.0, y, 1.6, 90, 1.8, .8, 1.0, "woodD", "porcelain"); monitor(b, 3.0, y + 1.0, 1.9, 270, true, .4, .3); b.box("dark", 3.0, y + 1.1, 1.3, .3, .2, .3); b.box("steel", 3.3, y + 1.15, .8, .5, .3, .6);
      pillar(b, "steel", 3.0, .6, y + 1.3, y + 1.5, .12, { sides: 8 });
      for (const [x, z] of [[-2.4, -1.0], [0, -1.0], [2.4, -1.0], [-2.4, 1.2], [0, 1.2], [2.4, 1.2]] as [number, number][]) tubeLight(b, x, y + 3.35, z, 1.4, 0, "lampCold");
    }, ["便利店", "超市", "夜班", "抢劫"]),

  filmRoom("教堂内景三壁内景长椅祭坛彩窗", "影视置景·西式：教堂大厅，石墙三面，两侧排满长椅、中间红毯通向祭坛，祭坛后墙金色十字架、两侧管风琴管和烛台，高窗嵌彩色玻璃，吊灯，婚礼戏和肃穆戏常用", "欧式", "原始",
    { seed: "教堂内景", w: 9, d: 12, h: 8.0, pal: { wall: "#b8b2a0", wainscot: "#8a846e", trim: "#6a6454", wood: "#6a4a35", woodD: "#3a2a20", floorA: "#8a8478", floorB: "#7a7468", rug: "#8a1f2a", rugB: "#c9a45a" }, floor: "flag", wainscot: 1.2,
      openings: [{ wall: "left", u: -3.0, w: 1.2, kind: "window", sill: 2.6, h: 3.6, muntins: 0, backing: "day" }, { wall: "left", u: 0, w: 1.2, kind: "window", sill: 2.6, h: 3.6, muntins: 0, backing: "day" }, { wall: "left", u: 3.0, w: 1.2, kind: "window", sill: 2.6, h: 3.6, muntins: 0, backing: "day" }, { wall: "right", u: -3.0, w: 1.2, kind: "window", sill: 2.6, h: 3.6, muntins: 0, backing: "day" }, { wall: "right", u: 0, w: 1.2, kind: "window", sill: 2.6, h: 3.6, muntins: 0, backing: "day" }, { wall: "right", u: 3.0, w: 1.2, kind: "window", sill: 2.6, h: 3.6, muntins: 0, backing: "day" }] },
    (b, c) => {
      const { y, D, W, H } = c, bz = -D / 2, cols = ["neonP", "neonC", "neonY", "glowG", "lampRed"];
      for (const wall of ["left", "right"] as const) for (const u of [-3.0, 0, 3.0]) for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) { const [px, py, pz] = c.wallPoint(wall, u + (i - .5) * .5, y + 2.9 + j * .85, -.05); b.box(cols[(i + j + (u > 0 ? 1 : 0)) % 5]!, px, py, pz, wall === "left" ? .02 : .02, .78, .48); }
      b.box("stone", 0, y + .3, bz + 1.5, 6.0, .6, 3.0); b.box("stone", 0, y + .15, bz + 3.3, 6.4, .3, .6); b.box("porcelain", 0, y + .95, bz + 1.4, 1.8, .7, .8); b.box("gold", 0, y + 1.35, bz + 1.4, 1.9, .06, .9);
      b.box("gold", 0, y + 4.4, bz + .08, .5, 3.0, .08); b.box("gold", 0, y + 5.0, bz + .08, 1.8, .5, .08);
      for (const x of [-.7, .7]) candle(b, x, y + 1.38, bz + 1.4, .3); for (const x of [-2.4, 2.4]) { pillar(b, "gold", x, bz + 1.0, y + .6, y + 1.6, .05, { sides: 6 }); candle(b, x, y + 1.6, bz + 1.0, .3); }
      for (let k = 0; k < 10; k++) pillar(b, "metal", -4.0 + k * .12, bz + .3, y + .6, y + 3.0 + (k % 4) * .5, .05, { sides: 6 });
      for (let k = 0; k < 10; k++) pillar(b, "metal", 2.8 + k * .12, bz + .3, y + .6, y + 3.0 + (k % 4) * .5, .05, { sides: 6 });
      rug(b, 0, y, 1.4, 0, 1.6, 8.0, "rug", "rugB");
      for (let i = 0; i < 5; i++) for (const x of [-2.7, 2.7]) pew(b, x, y, bz + 5.0 + i * 1.2, 180, 2.6, "wood");
      for (const z of [-1.5, 2.5]) chandelier(b, 0, y + 6.2, z, .8, 8, 1.2);
      void W; void H;
    }, ["教堂", "婚礼", "宗教", "欧式"]),

  filmRoom("中餐包间三壁内景大圆桌转盘屏风", "影视置景·现代中式：餐厅包间，深木护墙，中间一张大圆桌配转盘和十把椅子，桌上碗碟茶壶，后墙一面山水屏风和字画，红灯笼，窗挂格栅，适合宴请、谈判戏", "中式", "原始",
    { seed: "中餐包间", w: 6.4, d: 5.6, h: 3.2, pal: { wall: "#c9a880", wainscot: "#5a3a2a", trim: "#3a2418", wood: "#6a4a35", woodD: "#2a1810", floorA: "#6a4a30", floorB: "#5c4028", curtain: "#8a1f2a", rug: "#7a1f2a", rugB: "#c9a45a" }, floor: "plank", plank: .18, wainscot: 1.1,
      openings: [{ wall: "left", u: -.6, w: 1.6, kind: "window", sill: .9, h: 1.6, muntins: 4, curtain: true, backing: "night" }, { wall: "right", u: 1.6, w: 1.2, kind: "door", leaf: "ajar", h: 2.4 }] },
    (b, c) => {
      const { y, D, rng } = c, bz = -D / 2;
      screen(b, 0, y, bz + .25, 0, 3.6, 2.2, 3, "woodD", "paper"); framed(b, -2.3, y + 1.8, bz + .06, 0, .6, 1.2, "paper", "woodD"); framed(b, 2.3, y + 1.8, bz + .06, 0, .6, 1.2, "paper", "woodD");
      roundTable(b, 0, y, .3, 1.15, .76, "woodD", "red"); pillar(b, "glass", 0, .3, y + .76, y + .79, .8, { sides: 20 }); pillar(b, "woodD", 0, .3, y + .79, y + .82, .15, { sides: 10 });
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; chair(b, rng, Math.cos(a) * 1.65, y, .3 + Math.sin(a) * 1.65, -(a * 180 / Math.PI) - 90, "woodD", false); pillar(b, "porcelain", Math.cos(a) * .85, .3 + Math.sin(a) * .85, y + .79, y + .83, .09, { sides: 10 }); }
      for (let k = 0; k < 4; k++) pillar(b, "porcelain", Math.cos(k * 1.57) * .3, .3 + Math.sin(k * 1.57) * .3, y + .82, y + 1.0 - (k % 2) * .08, .07, { sides: 8 });
      rug(b, 0, y, .3, 0, 5.0, 4.4, "rug", "rugB"); for (const [x, z] of [[-2.4, -1.4], [2.4, -1.4]] as [number, number][]) lantern4(b, x, y, z);
    }, ["饭店", "包间", "宴请", "餐厅"]),
];

/** 红灯笼从顶上垂下（中餐包间用）。 */
function lantern4(b: Parameters<typeof pillar>[0], x: number, y: number, z: number) { b.sphere("lampRed", [x, y + 2.4, z], .25); b.beam("woodD", [x, y + 2.65, z], [x, y + 3.1, z], .015, .015); }
