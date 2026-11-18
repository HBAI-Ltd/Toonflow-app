import { ruinHouse, type HouseCfg, type HouseCtx } from "./ruinHouse";
import { at, type P, type Rng, type RuinBuilder } from "./ruinKit";
import { banner, crates, pillar } from "./ruinProps";
import { bed, cabinet, chair, papers, pots, table } from "./setDressing";
import { CN, CN_RED, CONCRETE, EURO, LOESS, PLASTER, ruin } from "./ruinCommon";
import type { ArchitecturePrototype } from "./structures";

// 影视破败房间：带墙、地面、残顶、门窗洞的小房间，里面摆满翻倒破烂的家具和杂物，适合拍室内镜头。
// 每间房有一面墙破得最重（露出内部），蛛网、剥落墙皮、水渍、天花塌落都是真几何。
type B = RuinBuilder;
const room = (name: string, purpose: string, theme: Parameters<typeof ruin>[2], state: Parameters<typeof ruin>[3], cfg: HouseCfg, furnish: (b: B, rng: Rng, ctx: HouseCtx, y: number) => void, ceiling = 0): ArchitecturePrototype =>
  ruin(name, purpose, theme, state, () => ruinHouse({ elevated: true, roof: "none", found: .12, ...cfg }, (b, rng, ctx) => {
    const y = ctx.found + .04, W = cfg.w, D = cfg.d, t = ctx.t;
    b.group("web", "蛛网", "#d9d9d2", { roughness: 1, opacity: .55 }).group("paintG", "旧墙漆", "#6f8a73", { roughness: .95 }).group("paintW", "旧白漆", "#d8d6cc", { roughness: .95 });
    // 残破天花：一圈格子，缺口很多，几块吊着
    const top = ctx.top;
    if (ceiling > 0) {
      b.floorGrid(rng, "wallC", "woodD", -W / 2 + t, -D / 2 + t, W / 2 - t, D / 2 - t, top - .05, { cell: 1.1, missing: ceiling, thick: .08 });
      for (let k = 0; k < 4; k++) { const x = rng.range(-W / 2 + 1, W / 2 - 1), z = rng.range(-D / 2 + 1, D / 2 - 1); b.plate("wallC", [x, top - .1, z], [x + .9, top - .1, z], [x + .9, top - rng.range(.3, .9), z + .6], [x, top - rng.range(.2, .7), z + .4], .03); }
    }
    // 蛛网：四个上角
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) { const cx = sx * (W / 2 - t), cz = sz * (D / 2 - t), r = rng.range(.5, 1.1); b.plate("web", [cx, top - .1, cz], [cx - sx * r, top - .1, cz], [cx - sx * r * .6, top - r * .9, cz], [cx, top - r * .7, cz - sz * r * .5], .004); }
    furnish(b, rng, ctx, y);
  }), ["房间", "屋子", "室内场景", "内景"]);

/** 墙上两段色的旧墙漆（下半截墙裙、上半截白）和剥落：frameId 0..3 对应前后左右墙的内面。 */
const dado = (b: B, rng: Rng, ctx: HouseCtx, y: number, key: string, height = 1.2, peel = 6) => {
  ctx.frames.forEach((f, id) => {
    const len = ctx.lens[id]!, top = ctx.tops[id]!;
    for (let k = 0; k < Math.round(len / 1.4); k++) { const u = -len / 2 + (k + .5) * len / Math.round(len / 1.4); if (top(u) > y + height + .3 && !rng.chance(.25)) b.patch(key, rng, f, -1, -ctx.t / 2, u, y + height / 2, len / Math.round(len / 1.4) * rng.range(.8, 1.1), height * rng.range(.8, 1), .01, 6); }
    for (let k = 0; k < peel; k++) { const u = rng.range(-len / 2 + .4, len / 2 - .4), yy = y + rng.range(.4, 2.4); if (yy < top(u) - .3) b.patch(rng.pick(["brick", "damp", "wallB"]), rng, f, -1, -ctx.t / 2, u, yy, rng.range(.3, .9), rng.range(.3, .8), .014, 6); }
  });
};

export const ruinRoomDesigns: ArchitecturePrototype[] = [
  room("破败土炕农家内室灶台", "影视破败房间：北方农家的土坯屋内室，茅草顶漏光，土炕塌了一角，灶台烟熏焦黑，墙角堆着破缸烂罐，窗纸撕烂，地上散落农具", "中式", "老旧",
    { seed: "破败土炕农家内室灶台", pal: LOESS, w: 5.2, d: 4.4, hs: 2.7, thick: .42, damage: [.5, .28, .3, .3], roof: "gable", thatch: true, roofLoss: .7, sag: .3, rise: 1.5, overhang: .4, door: "hanging", doorW: 1.0, doorH: 1.9, windows: 1, win: { w: .9, h: .9, sill: 1.1 }, winKind: ["lattice", "boarded"], weeds: .2, moss: .1 },
    (b, rng, ctx, y) => {
      b.box("wallB", -1.45, y + .38, -1.1, 2.0, .76, 1.9); b.box("soot", -1.45, y + .78, -1.1, 2.04, .04, 1.94); b.tbox("wallB", [-.55, y + .45, .1], [.7, .5, .6], 12, 0, 20);
      b.box("brick", 1.7, y + .45, -1.5, 1.0, .9, .9); b.beam("rust", [1.7, y + .9, -1.5], [1.75, y + 2.4, -1.55], .16, .16); b.patch("soot", rng, ctx.frames[1]!, -1, -ctx.t / 2, -1.5, y + 1.8, 1.4, 2.2, .014, 6);
      for (let k = 0; k < 3; k++) pillar(b, "rubbleS", 1.9 + k * .2, 1.3 - k * .3, y, y + .7 - k * .1, .3 - k * .03, k === 1 ? { lean: [.25, .1] } : {});
      table(b, rng, .3, y, 1.0, 12, 1.0, .65, .6); chair(b, rng, .6, y, 1.7, 40); pots(b, rng, -.6, y, 1.4, 4); b.beam("wood", [-2.0, y + 2.4, 1.9], [-1.9, y + .3, 1.9], .06, .06);
      for (let k = 0; k < 4; k++) b.tbox("woodD", [rng.range(-1.8, 1.8), y + .06, rng.range(-1.2, 1.9)], [.9, .05, .08], rng.range(0, 180), 0, 0);
      b.plate("cloth", [-2.2, y + 1.2, -.4], [-1.4, y + 1.1, -.4], [-1.5, y + .4, -.2], [-2.1, y + .5, -.2], .01); crates(b, rng, 2.0, 1.5, y, 2, .3);
      dado(b, rng, ctx, y, "dirt", .9, 5);
    }, .0),

  room("荒庙佛堂内景残像供桌", "影视破败房间：破庙佛堂内景，泥塑佛像缺臂断头、金漆剥落，供桌翻倒，红柱歪斜，幡布和蛛网垂挂，屋顶漏下一道天光", "中式", "破损",
    { seed: "荒庙佛堂内景残像供桌", pal: CN_RED, w: 7.2, d: 6.2, hs: 4.2, thick: .5, damage: [.55, .3, .35, .3], roof: "gable", roofLoss: .7, rise: 2.2, overhang: .5, door: "missing", doorW: 1.8, doorH: 3, windows: 1, win: { w: .9, h: 1.6, sill: 1.4 }, winKind: "lattice", weeds: .2 },
    (b, rng, ctx, y) => {
      b.group("red", "褪色红漆柱", "#8a3a2e", { roughness: .9 }).group("clay", "残损泥塑", "#b09a70", { roughness: 1 }).group("gold", "剥落贴金", "#b99a4a", { roughness: .6, metalness: .3 });
      b.box("stone", 0, y + .3, -2.1, 3.6, .6, 1.5); b.box("clay", 0, y + 1.3, -2.1, 1.5, 1.4, .9); b.box("clay", -.95, y + 1.2, -1.9, .4, 1.0, .5); b.box("clay", .98, y + .95, -1.8, .4, .5, .5); b.tbox("clay", [1.3, y + .15, -.4], [.5, .8, .5], 30, 84, 0);
      b.sphere("clay", [-.3, y + .22, -.6], .38); b.patch("gold", rng, ctx.frames[1]!, -1, -ctx.t / 2, 0, y + 2.4, 2.6, 1.6, .014, 8);
      [[-2.3, -1.2], [2.3, -1.2], [-2.3, 1.6]].forEach(([x, z], i) => pillar(b, "red", x!, z!, y, y + (i === 2 ? 1.4 : 3.8), .27, i === 2 ? { lean: [.4, .2] } : {}));
      b.beam("red", [2.0, y + .25, 2.2], [.6, y + .3, 1.0], .45, .45);
      table(b, rng, -.2, y, 1.1, 20, 1.5, .7, .85, "red", true); pillar(b, "stone", .6, -.3, y, y + .55, .35); pillar(b, "stone", -1.4, .3, y, y + .3, .32, { lean: [.3, .1] });
      for (let k = 0; k < 5; k++) b.tbox("woodD", [rng.range(-1.2, 1.5), y + .12, rng.range(-.5, 1.4)], [.2, .55, .08], rng.range(0, 180), 85, 0);
      banner(b, rng, -3.2, y, -2.6, 3.6); banner(b, rng, 3.2, y, -2.6, 3.2); dado(b, rng, ctx, y, "red", 1.4, 6);
    }, .0),

  room("破败客栈大堂楼梯断阶", "影视破败房间：荒废客栈的大堂，桌凳翻倒散乱，柜台垮塌，木楼梯断了几级、二楼回廊塌了一半，灯笼残破垂挂，地上满是碎碗烂坛", "中式", "破损",
    { seed: "破败客栈大堂楼梯断阶", pal: CN, w: 9, d: 7, hs: 3.5, thick: .4, damage: [.5, .3, .35, .3], roof: "gable", roofLoss: .65, rise: 2, overhang: .4, door: "hanging", doorW: 2, doorH: 2.6, windows: 2, winKind: ["lattice", "boarded"], floor: "wood", weeds: .1 },
    (b, rng, ctx, y) => {
      for (let k = 0; k < 5; k++) table(b, rng, -2.4 + (k % 3) * 2.0, y, -.4 + Math.floor(k / 3) * 2.2, rng.range(0, 40), 1.1, .8, .75, "wood", k === 1 || k === 4);
      for (let k = 0; k < 9; k++) chair(b, rng, rng.range(-3.5, 3.5), y, rng.range(-1.5, 2.5), rng.range(0, 360));
      b.box("wood", 3.0, y + .55, -2.9, 2.6, 1.1, .8); b.tbox("wood", [1.6, y + .35, -2.1], [1.6, .7, .7], 20, 0, 24);
      for (let k = 0; k < 8; k++) { if (rng.chance(.35)) continue; b.box("wood", -3.7 + k * .2, y + .13 + k * .27, -2.6, .55, .08, 1.0); }
      b.beam("woodD", [-3.8, y, -3.1], [-2.2, y + 2.2, -3.1], .1, .12);
      b.floorGrid(rng, "wood", "woodD", -4.2, -3.2, -1.2, -1.2, y + 2.3, { cell: .9, missing: .4, thick: .12 });
      for (let x = -4.2; x <= -1.2; x += .5) if (rng.chance(.55)) b.beam("wood", [x, y + 2.3, -1.25], [x, y + 3.2, -1.25], .05, .05);
      for (let k = 0; k < 3; k++) { const x = -2 + k * 2.4; b.sphere("rust", [x, y + 2.7 - k * .3, rng.range(-.5, 1)], .22); b.beam("woodD", [x, y + 3.2, 0], [x, y + 2.9 - k * .3, 0], .02, .02); }
      pots(b, rng, 3.8, y, 2.2, 6, "rubbleS"); papers(b, rng, 0, .6, y, 3, 2, 8); dado(b, rng, ctx, y, "dirt", 1.0, 6);
    }, .0),

  room("废弃教室倒课桌黑板", "影视破败房间：废弃教室，课桌椅东倒西歪，黑板剥落只剩斑驳板面，天花板吊顶塌落挂着碎板，窗玻璃碎裂，讲台翻倒，地上撒满纸页书本", "现代", "废弃",
    { seed: "废弃教室倒课桌黑板", pal: PLASTER, w: 8, d: 6.5, hs: 3.3, thick: .3, damage: [.6, .2, .3, .25], roof: "none", door: "hanging", doorsAt: [2.5], doorW: 1.1, doorH: 2.2, windows: 3, win: { w: 1.5, h: 1.5, sill: .9 }, winKind: ["glass", "empty"], floor: "stone", weeds: .1, patches: 7 },
    (b, rng, ctx, y) => {
      b.tbox("woodD", [0, y + 1.5, -ctx.lens[3]! / 2 + .04], [3.8, 1.2, .04], 0, 0, 0); b.patch("paintW", rng, ctx.frames[1]!, -1, -ctx.t / 2, 0, y + 1.5, 2.4, .5, .02, 6);
      b.box("wood", -.5, y + .45, -2.1, 1.4, .9, .6); b.tbox("wood", [1.3, y + .3, -1.6], [1.0, .5, .5], 30, 60, 10);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = -2.8 + c * 1.9 + rng.range(-.2, .2), z = -.3 + r * 1.5 + rng.range(-.2, .2); if (rng.chance(.25)) continue; table(b, rng, x, y, z, rng.range(-12, 12), .9, .5, .72, "wood", rng.chance(.25)); chair(b, rng, x, y, z + .6, rng.range(-30, 30), "metal"); }
      papers(b, rng, 0, 1.2, y, 3.2, 2.4, 22); for (let k = 0; k < 5; k++) b.tbox("wallC", [rng.range(-3, 3), y + .1, rng.range(-2, 2.5)], [.4, .2, .3], rng.range(0, 360), 0, 0);
      dado(b, rng, ctx, y, "paintG", 1.3, 6);
    }, .72),

  room("废弃病房锈床吊帘", "影视破败房间：荒废医院的病房，锈蚀病床歪斜，床帘轨道上挂着发黑的破帘，输液架倒地，墙漆大片剥落，轮椅翻倒，地上积着污水和碎灰泥", "现代", "废弃",
    { seed: "废弃病房锈床吊帘", pal: CONCRETE, w: 5.6, d: 4.6, hs: 3.1, thick: .3, damage: [.55, .2, .25, .3], roof: "none", door: "ajar", doorsAt: [1.6], doorW: 1.1, doorH: 2.2, windows: 2, win: { w: 1.3, h: 1.4, sill: .9 }, winKind: ["glass", "empty"], floor: "stone", patches: 6 },
    (b, rng, ctx, y) => {
      b.group("water", "污水积水", "#4d5a50", { roughness: .2 });
      for (let k = 0; k < 3; k++) { const x = -1.8 + k * 1.9, z = -1.2; if (k === 1) { b.tbox("rust", [x, y + .5, z + .2], [.9, .06, 2.0], 20, 6, 12); b.tbox("rust", [x + .2, y + .3, z + .3], [.06, .6, 1.9], 20, 0, 0); continue; } b.box("rust", x, y + .45, z, .9, .06, 2.0); for (const dx of [-.43, .43]) for (const dz of [-.95, .95]) b.beam("rust", [x + dx, y, z + dz], [x + dx, y + .85, z + dz], .04, .04); b.box("cloth", x, y + .55, z, .8, .12, 1.8); }
      b.beam("metal", [-2.4, y + 2.5, -.2], [2.4, y + 2.5, -.2], .03, .03); for (let k = 0; k < 4; k++) b.plate("cloth", [-2 + k * 1.2, y + 2.45, -.2], [-1.1 + k * 1.2, y + 2.45, -.2], [-1.2 + k * 1.2, y + 1.3 - rng.range(0, .4), -.2], [-2.1 + k * 1.2, y + 1.5, -.2], .004);
      b.beam("metal", [1.2, y, 1.4], [2.3, y + .06, 1.0], .03, .03); b.beam("metal", [1.2, y + .03, 1.4], [1.0, y + .1, 1.6], .03, .03);
      pillar(b, "metal", .2, 1.2, y, y + .5, .3, { lean: [.8, .3] }); pillar(b, "soot", -.2, 1.4, y, y + .06, .3); pillar(b, "soot", .6, 1.1, y, y + .06, .3);
      cabinet(b, rng, -2.2, y, 1.4, 90, .6, 1.4, .4, "metal", 6);
      b.quad("water", [-.9, y + .012, .4], [1.2, y + .012, .1], [1.4, y + .012, 1.3], [-.6, y + .012, 1.6], [0, 1, 0]);
      papers(b, rng, 0, .8, y, 2.2, 1.6, 6); dado(b, rng, ctx, y, "paintG", 1.2, 8);
    }, .7),

  room("荒废卧室剥落墙纸腐床", "影视破败房间：久无人住的卧室，墙纸成片卷边剥落，床垫腐烂塌陷，衣柜门歪挂，梳妆镜碎裂，窗帘破成条，地上散着玩具和旧衣", "现代", "废弃",
    { seed: "荒废卧室剥落墙纸腐床", pal: PLASTER, w: 4.8, d: 4.2, hs: 2.9, thick: .3, damage: [.5, .2, .25, .2], roof: "none", door: "ajar", doorsAt: [-1.2], doorW: .95, doorH: 2.1, windows: 1, win: { w: 1.3, h: 1.5, sill: .9 }, winKind: ["glass", "shutter"], floor: "wood", patches: 5 },
    (b, rng, ctx, y) => {
      bed(b, rng, .4, y, -1.0, 90, 1.5, 2.0); cabinet(b, rng, -1.8, y, -1.6, 0, 1.2, 2.0, .55, "wood", 8); b.box("wood", 1.7, y + .4, 1.3, 1.0, .8, .45);
      b.plate("glass", [1.35, y + 1.0, 1.55], [2.0, y + 1.0, 1.55], [2.05, y + 1.8, 1.55], [1.3, y + 1.9, 1.55], .01); b.plate("glass", [1.8, y + .1, .6], [2.2, y + .08, .7], [2.0, y + .1, 1.0], [1.7, y + .12, .9], .01);
      // 卷边剥落的墙纸条：上沿贴墙，下沿离墙飘出
      for (let k = 0; k < 8; k++) {
        const id = rng.int(4), f = ctx.frames[id]!, len = ctx.lens[id]!, u = rng.range(-len / 2 + .6, len / 2 - .6), yy = y + rng.range(1.5, 2.5), drop = rng.range(.7, 1.4);
        const pt = (du: number, n: number, dy: number): P => { const [x, z] = at(f, u + du, n); return [x, yy + dy, z]; }, wall = -ctx.t / 2 - .012;
        if (ctx.tops[id]!(u) > yy + .1) b.plate("paper", pt(-.3, wall, 0), pt(.3, wall, 0), pt(.28, wall - .22, -drop), pt(-.28, wall - .3, -drop * .8), .003);
      }
      for (let k = 0; k < 6; k++) b.tbox(rng.pick(["cloth", "wood", "rubble"]), [rng.range(-1.8, 1.8), y + .05, rng.range(-1.2, 1.7)], [.3, .1, .25], rng.range(0, 360));
      b.plate("cloth", [-.65, y + 2.3, 2.0], [.65, y + 2.3, 2.0], [.5, y + .9, 2.0], [-.5, y + 1.4, 2.0], .004); b.beam("wood", [-.8, y + 2.35, 2.0], [.8, y + 2.35, 2.0], .03, .03);
      dado(b, rng, ctx, y, "paintW", 1.4, 9);
    }, .7),

  room("破败厨房灶台锈罐", "影视破败房间：荒废厨房，砖砌灶台熏得漆黑，铁锅锈穿，案板和碗柜塌垮，吊着的炊具蒙着厚灰，地面水渍泛绿、碎瓷遍地，墙角冰箱倒伏", "现代", "老旧",
    { seed: "破败厨房灶台锈罐", pal: PLASTER, w: 4.6, d: 3.8, hs: 2.8, thick: .3, damage: [.5, .2, .25, .25], roof: "none", door: "hanging", doorsAt: [1.0], doorW: .95, doorH: 2.1, windows: 1, win: { w: 1.1, h: 1.0, sill: 1.1 }, winKind: ["glass", "boarded"], floor: "stone", patches: 6 },
    (b, rng, ctx, y) => {
      b.group("water", "污水积水", "#4d5a50", { roughness: .2 });
      b.box("brick", -1.2, y + .45, -1.35, 1.8, .9, .7); b.box("soot", -1.2, y + .93, -1.35, 1.84, .05, .74); pillar(b, "rust", -1.5, -1.35, y + .96, y + 1.3, .3); pillar(b, "rust", -.9, -1.35, y + .96, y + 1.2, .25, { lean: [.1, 0] });
      b.beam("rust", [-1.7, y + .95, -1.7], [-1.65, y + 2.6, -1.7], .12, .12); b.patch("soot", rng, ctx.frames[1]!, -1, -ctx.t / 2, -1.3, y + 1.9, 1.6, 1.6, .014, 7);
      b.box("wood", 1.4, y + .42, -1.45, 1.0, .84, .5); b.tbox("wood", [1.9, y + .2, -.6], [1.0, .7, .5], 10, 0, 40); cabinet(b, rng, .2, y, -1.55, 0, .8, 1.9, .4, "wood", 12);
      b.tbox("metal", [1.6, y + .35, 1.1], [.7, 1.7, .7], 0, 82, 5); table(b, rng, -.2, y, .6, 8, 1.0, .65, .7, "wood", true);
      for (let k = 0; k < 14; k++) b.tbox(rng.pick(["paper", "rubbleS", "metal"]), [rng.range(-1.9, 1.9), y + .03, rng.range(-1.4, 1.6)], [.15, .06, .15], rng.range(0, 360));
      for (let k = 0; k < 4; k++) b.beam("metal", [-.9 + k * .55, y + 2.3, 1.7], [-.9 + k * .55 + rng.range(-.1, .1), y + 1.5 + rng.range(0, .4), 1.7], .02, .02);
      b.quad("water", [-1.0, y + .012, 0], [.6, y + .012, -.2], [1.0, y + .012, 1.1], [-.8, y + .012, 1.4], [0, 1, 0]);
      dado(b, rng, ctx, y, "paintG", 1.3, 5);
    }, .6),

  room("废弃办公室散页文件柜", "影视破败房间：荒废的办公室，成排办公桌上落满灰尘，显示器碎裂，转椅翻倒，文件柜抽屉拉出、纸页撒了满地，天花板塌落挂着电线，窗玻璃碎裂", "现代", "废弃",
    { seed: "废弃办公室散页文件柜", pal: CONCRETE, w: 8, d: 6.4, hs: 3.0, thick: .3, damage: [.6, .2, .25, .25], roof: "none", door: "ajar", doorsAt: [2.4], doorW: 1.1, doorH: 2.2, windows: 3, win: { w: 1.6, h: 1.5, sill: .9 }, winKind: ["glass", "empty"], floor: "stone", patches: 6 },
    (b, rng, ctx, y) => {
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
        const x = -2.4 + c * 2.3, z = -1.2 + r * 2.4; table(b, rng, x, y, z, 0, 1.4, .7, .74, "wood", rng.chance(.15));
        if (rng.chance(.7)) { b.tbox("woodD", [x, y + 1.0, z - .1], [.5, .38, .05], 0, rng.chance(.3) ? 20 : 0, 0); b.plate("glass", [x - .2, y + .86, z - .06], [x + .1, y + .86, z - .06], [x + .05, y + 1.1, z - .06], [x - .2, y + 1.15, z - .06], .004); }
        chair(b, rng, x, y, z + .8, rng.range(-40, 40), "woodD");
      }
      for (let k = 0; k < 3; k++) { cabinet(b, rng, 3.4, y, -2.2 + k * .8, 90, .75, 1.35, .5, "metal", k === 1 ? 14 : 0); if (rng.chance(.6)) b.box("metal", 3.1, y + .6 + k * .1, -2.2 + k * .8, .5, .2, .4); }
      papers(b, rng, 0, 0, y, 3.2, 2.6, 40); for (let k = 0; k < 5; k++) b.sweep("soot", [[rng.range(-3, 3), y + 3.0, rng.range(-2.5, 2.5)], [rng.range(-3, 3), y + 2.4, rng.range(-2.5, 2.5)], [rng.range(-3, 3), y + 1.4 + rng.range(0, .6), rng.range(-2.5, 2.5)]] as P[], [.012, .012, .012]);
      b.tbox("paintW", [0, y + 1.7, -ctx.lens[3]! / 2 + .04], [1.8, 1.0, .03], 0, 0, 3); dado(b, rng, ctx, y, "paintG", 1.1, 8);
    }, .75),

  room("地窖石室酒桶铁栅牢笼", "影视破败房间：潮湿的石砌地窖，酒桶塌倒漏酒、酒架断裂，一角用铁栅隔出牢笼，栅门歪斜，稻草堆里挂着生锈的锁链，墙面淌水生苔", "欧式", "废弃",
    { seed: "地窖石室酒桶铁栅牢笼", pal: EURO, w: 6.2, d: 5.2, hs: 3.0, thick: .6, damage: [.45, .25, .25, .3], roof: "none", door: "hanging", doorsAt: [-1.4], doorW: 1.1, doorH: 2.1, doorArch: "round", windows: 0, floor: "stone", moss: 1.2, patches: 8, wallKeys: ["wall", "wallB", "stone", "wallB"] },
    (b, rng, ctx, y) => {
      b.group("water", "污水积水", "#42524d", { roughness: .2 }).group("straw", "稻草", "#b89f5a", { roughness: 1 });
      for (let k = 0; k < 4; k++) { const x = -2.0 + k * .8, z = -1.7; if (k === 2) b.tbox("wood", [x, y + .3, z + .3], [.55, .55, .7], 20, 0, 90); else pillar(b, "wood", x, z, y, y + .75, .32, { sides: 10 }); }
      for (let k = 0; k < 3; k++) b.beam("metal", [-2.4, y + .02 + k * .02, -1.7 + k * .1], [-1.9 + k * .4, y + .02, -.5 + k * .5], .02, .02);
      b.box("wood", 2.4, y + 1.0, -2.3, 1.2, 1.9, .3); b.tbox("wood", [1.2, y + .5, -.9], [1.2, .08, .5], 15, 70, 10);
      for (let i = 0; i <= 6; i++) { if (rng.chance(.12)) continue; const x = .4 + i * .42; b.beam("metal", [x, y, 1.9], [x, y + 2.5 - (rng.chance(.2) ? rng.range(.4, 1.2) : 0), 1.9], .03, .03); }
      b.beam("metal", [.4, y + 2.4, 1.9], [2.9, y + 2.35, 1.9], .04, .04); b.beam("metal", [.4, y + .3, 1.9], [2.9, y + .3, 1.9], .04, .04); b.beam("metal", [.4, y, 1.9], [.4, y + 2.5, .4], .04, .04); b.tbox("metal", [2.2, y + 1.2, 1.95], [.9, 2.2, .05], 20, 0, 6);
      b.dune("straw", rng, 2.1, 2.4, 1.0, .7, .3, 20, y); for (let k = 0; k < 3; k++) b.sweep("rust", [[2.6, y + 1.8, 2.9], [2.6 + rng.range(-.2, .2), y + 1.2, 2.9], [2.5, y + .4 + k * .1, 2.7]] as P[], [.02, .02, .02]);
      b.quad("water", [-1.5, y + .012, -.3], [.8, y + .012, -.6], [1.1, y + .012, 1.0], [-1.2, y + .012, .9], [0, 1, 0]); b.heap(rng, -2.4, 1.6, y, .8, .45, ["rubbleS", "rubble"], 8); dado(b, rng, ctx, y, "damp", 1.0, 4);
    }, .5),

  room("废弃酒吧吧台倒凳霓虹", "影视破败房间：被遗弃的小酒吧，吧台垮了一段，高脚凳东倒西歪，酒架倾倒、碎瓶满地，卡座皮面撕裂，霓虹管断裂，墙上喷满涂鸦", "现代", "废弃",
    { seed: "废弃酒吧吧台倒凳霓虹", pal: CONCRETE, w: 9, d: 6.4, hs: 3.1, thick: .35, damage: [.6, .2, .3, .25], roof: "none", door: "hanging", doorsAt: [2.8], doorW: 1.3, doorH: 2.2, windows: 2, win: { w: 1.4, h: 1.3, sill: 1.0 }, winKind: ["boarded", "glass"], floor: "wood", patches: 8 },
    (b, rng, ctx, y) => {
      b.group("neon", "断裂霓虹管", "#d46a6a", { emissive: "#a02a2a", emissiveIntensity: .35, roughness: .5 }).group("paintR", "喷漆红", "#b0392e", { roughness: .8 }).group("paintB", "喷漆蓝", "#2f5fa0", { roughness: .8 }).group("felt", "台球桌绒面", "#3f6a4a", { roughness: 1 });
      b.box("woodD", -.4, y + .55, -2.2, 5.2, 1.1, .7); b.tbox("woodD", [2.7, y + .4, -1.9], [1.4, 1.1, .7], 25, 0, 18); b.box("wood", -.4, y + 1.12, -2.2, 5.3, .06, .8);
      b.box("wood", -.4, y + 1.6, -3.0, 5.0, 2.0, .08); for (let k = 0; k < 14; k++) if (rng.chance(.7)) pillar(b, rng.pick(["glass", "rubbleS"]), -2.7 + k * .38, -2.9, y + 1.25 + (k % 3) * .5, y + 1.55 + (k % 3) * .5, .05); else pillar(b, "glass", rng.range(-3, 2.5), rng.range(-1.8, -.4), y, y + .03, .06);
      for (let k = 0; k < 6; k++) pillar(b, "woodD", -2.3 + k * .85, -1.45, y, y + .7, .17, rng.chance(.4) ? { lean: [rng.range(-.4, .4), rng.range(-.4, .4)] } : {});
      b.box("woodD", -3.1, y + .38, 1.9, 1.8, .76, .9); b.tbox("woodD", [-3.1, y + .8, 2.2], [1.8, .8, .2], 0, -8, 0); b.box("woodD", 3.2, y + .35, 2.2, 1.6, .7, .9);
      b.box("felt", .6, y + .85, 1.0, 2.2, .1, 1.2); for (const dx of [-.95, .95]) for (const dz of [-.45, .45]) b.box("woodD", .6 + dx, y + .4, 1.0 + dz, .14, .8, .14);
      b.beam("neon", [-3.0, y + 2.4, -ctx.lens[3]! / 2 + .06], [-1.2, y + 2.55, -ctx.lens[3]! / 2 + .06], .06, .06); b.beam("neon", [-.8, y + 2.5, -ctx.lens[3]! / 2 + .06], [.3, y + 2.3, -ctx.lens[3]! / 2 + .06], .06, .06);
      for (let k = 0; k < 7; k++) b.patch(rng.pick(["paintR", "paintB"]), rng, ctx.frames[rng.int(4)]!, -1, -ctx.t / 2, rng.range(-2.5, 2.5), y + rng.range(.8, 2.2), rng.range(.5, 1.4), rng.range(.3, .7), .02, 6);
      papers(b, rng, 0, 0, y, 3.5, 2.2, 10); dado(b, rng, ctx, y, "damp", 1.0, 6);
    }, .7),
];
