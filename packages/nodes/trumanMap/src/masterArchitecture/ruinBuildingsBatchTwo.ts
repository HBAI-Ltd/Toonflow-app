import { ruinHouse } from "./ruinHouse";
import { placeParts, Rng, ruinBuilder } from "./ruinKit";
import { acUnit, cable, chimney, clothesLine, crates, freeWall, gallery, pillar, sandbags, signBoard, tree } from "./ruinProps";
import { BRICK, CONCRETE, PLASTER, house, ruin, withProps } from "./ruinCommon";
import type { ArchitecturePrototype } from "./structures";
// 影视破败建筑·年代与现代：里弄旧屋、筒子楼、红砖厂房、战火洋楼、烂尾楼、废弃医院学校商场、加油站、旅馆、炸毁的居民楼。
const wall3 = ["wall", "wallB", "wallC"];
export const ruinBuildingTwoDesigns: ArchitecturePrototype[] = [
  ruin("破旧石库门弄堂砖木民居", "影视破败：老上海式的两层砖木里弄房，石库门框发黑、木窗扇歪斜缺失，晾衣竹竿横在窗外，山墙泛碱剥落，屋面瓦片残缺", "中式", "老旧",
    house({ seed: "破旧石库门弄堂砖木民居", pal: BRICK, w: 8.4, d: 10.2, storeys: 2, hs: 3.3, found: .35, thick: .37, damage: .08, roofLoss: .2, sag: .15, overhang: .5, rise: 1.9, ridge: "x", door: "closed", doorW: 1.5, doorH: 2.4, windows: 3, win: { w: 1, h: 1.6, sill: .8 }, winKind: ["shutter", "boarded", "glass"], patches: 8, moss: .4, vines: .4, rubble: .2, weeds: .3 }, (b, rng, ctx) => {
      const y = ctx.found;
      b.box("stone", -.95, y + 1.3, 5.12, .3, 2.6, .3); b.box("stone", .95, y + 1.3, 5.12, .3, 2.6, .3); b.box("stone", 0, y + 2.72, 5.14, 2.2, .36, .36);
      for (const x of [-2.6, 2.6]) { b.beam("wood", [x, y + 5, 4.2], [x + 1.5, y + 5.6, 7.2], .06, .06); b.plate("cloth", [x + .5, y + 5.2, 5.2], [x + 1.1, y + 5.3, 6.4], [x + 1.0, y + 4.1, 6.3], [x + .4, y + 4.0, 5.2], .004); }
      clothesLine(b, rng, [-3.8, 6.8], [3.8, 6.8], y + 3.4); cable(b, [-4.2, y + 5.4, 5.1], [4.2, y + 5.0, 8.6], .6);
    })),
  ruin("老旧筒子楼外廊晾衣", "影视破败：三层通廊式老职工宿舍，外廊栏杆断续、晾晒的床单破烂，墙面污渍剥落，空调外机和乱拉的电线挂满立面，窗扇缺失", "现代", "老旧",
    house({ seed: "老旧筒子楼外廊晾衣", pal: PLASTER, w: 24, d: 7.5, storeys: 3, hs: 3, found: .3, thick: .35, damage: .05, roof: "flat", door: "gap", doorW: 1.6, doorH: 2.3, windows: 8, win: { w: 1.1, h: 1.3, sill: 1 }, winKind: ["glass", "boarded", "shutter", "empty"], patches: 14, moss: .3, vines: .3, soot: .25, rubble: .1, weeds: .3 }, (b, rng, ctx) => {
      const D = 7.5, y = ctx.found;
      for (let k = 1; k <= 2; k++) { gallery(b, rng, -11, 11, y + k * 3, D / 2, 1.3, { key: "wallC" }); for (let u = -10; u <= 10; u += 4) b.beam("wallB", [u, y, D / 2 + 1.2], [u, y + k * 3 - .16, D / 2 + 1.2], .25, .25); }
      for (let k = 0; k < 9; k++) b.plate("cloth", [-10 + k * 2.3, y + 5.9, D / 2 + 1.25], [-9.1 + k * 2.3, y + 5.9, D / 2 + 1.25], [-9.2 + k * 2.3, y + 4.9, D / 2 + 1.25], [-10.1 + k * 2.3, y + 5.0, D / 2 + 1.25], .004);
      for (let k = 0; k < 10; k++) acUnit(b, -10.5 + k * 2.3 + rng.range(-.2, .2), y + rng.pick([1.9, 4.9, 7.9]), -D / 2 - .15, 180);
      for (let k = 0; k < 5; k++) cable(b, [-11 + k * 5, y + 9, -D / 2 - .1], [-9 + k * 5, y + 8.2, -D / 2 - 2.4], .5);
      pillar(b, "metal", 8, 0, y + 9, y + 10.6, .9);
    })),
  ruin("废弃红砖厂房高烟囱", "影视破败：老国营红砖厂房，铁皮屋面塌了一大片，高窗玻璃全碎，巨大的卷门歪挂，厂区里立着一根断顶的高砖烟囱", "现代", "废弃",
    house({ seed: "废弃红砖厂房高烟囱", pal: BRICK, w: 20, d: 13, hs: 6.5, found: .3, thick: .45, damage: [.25, .35, .3, .4], roofLoss: .45, tin: true, rise: 2.6, overhang: .4, door: "hanging", doorW: 3.6, doorH: 4.2, windows: 5, win: { w: 1.6, h: 2.6, sill: 1.6 }, winKind: "glass", weeds: .8, rubble: .6 }, (b, rng) => {
      chimney(b, rng, 12.5, -4.5, 0, 17, 2.1, "brick");
      pillar(b, "metal", -13, 3, 0, 3.4, 1.2); pillar(b, "rust", -13, -1.2, 0, 3.1, 1.1, { lean: [.5, 0] });
      b.box("wallB", -2, .4, 8.4, 9, .8, 3);
      for (let s = 0; s < 4; s++) b.box("stone", -3.2 + s * .4, (s + 1) * .2, 6.4, .4, (s + 1) * .4, 2.6);
      for (let k = 0; k < 5; k++) b.tbox("metal", [rng.range(-3, 6), .5 + k * .02, rng.range(2, 6)], [2.2, .06, 1.1], rng.range(0, 90), 0, rng.range(-12, 12));
    })),
  ruin("战火残破民国洋楼弹孔", "影视破败：被炮火打坏的两层民国洋楼，一角山墙崩塌、屋面烧穿，门廊石柱断倒，立面布满弹孔和烟熏，门前垒着沙袋", "欧式", "破损",
    house({ seed: "战火残破民国洋楼弹孔", pal: PLASTER, w: 14, d: 10, storeys: 2, hs: 3.6, found: .6, thick: .5, damage: [.2, .35, .75, .25], roof: "hip", roofLoss: .55, rise: 2.8, overhang: .8, door: "missing", doorW: 2, doorH: 3, windows: 4, win: { w: 1.2, h: 1.9, sill: .9 }, winKind: ["shutter", "empty", "glass"], soot: .6, rubble: .8 }, (b, rng, ctx) => {
      const y = ctx.found, fr = ctx.frames[0]!;
      for (let k = 0; k < 4; k++) { const x = -4.2 + k * 2.8; if (k === 2 && rng.chance(.6)) { b.beam("stone", [x, y + .3, 6.4], [x + 1.7, y + .5, 8.1], .6, .6); continue; } pillar(b, "stone", x, 6.4, y, y + 3.5, .3, k === 3 ? { lean: [.3, .2] } : {}); }
      b.beam("stone", [-4.2, y + 3.6, 6.4], [.8, y + 3.6, 6.4], .35, .4);
      for (let k = 0; k < 16; k++) b.patch("soot", rng, fr, 1, ctx.t / 2, rng.range(-6.2, 6.2), y + rng.range(.8, 6.4), .13, .13, .016, 5);
      sandbags(b, rng, -1.8, 7.4, 0, 6); sandbags(b, rng, 2.3, 7.2, 20, 5);
    })),
  ruin("废弃老礼堂拱窗山花", "影视破败：五六十年代的砖砌礼堂，山花墙上的红星剥落、拱形高窗玻璃尽碎，屋面塌了一块，门前壁柱断裂，台阶长草", "现代", "废弃",
    house({ seed: "废弃老礼堂拱窗山花", pal: PLASTER, w: 22, d: 13, hs: 8.5, found: .5, thick: .55, damage: [.15, .3, .25, .3], ridge: "z", rise: 4.5, roofLoss: .5, overhang: .5, door: "ajar", doorW: 3.2, doorH: 4.2, doorArch: "round", windows: 4, win: { w: 1.5, h: 3.4, sill: 2.2 }, winArch: "round", weeds: .8 }, (b, rng, ctx) => {
      const y = ctx.found;
      for (let k = 0; k < 6; k++) { const x = -9 + k * 3.6; if (Math.abs(x) < 2.2) continue; if (rng.chance(.8)) b.box("wallC", x, y + 4, 11.05, .7, 8, .4); else b.tbox("wallC", [x + .4, y + .5, 12.2], [.7, 3.2, .4], rng.range(0, 40), 82, 0); }
      b.group("red", "剥落红星", "#8a3a2e", { roughness: .9 });
      b.beam("red", [-.9, y + 11.2, 11.1], [.9, y + 13.2, 11.1], .08, .22); b.beam("red", [.9, y + 11.2, 11.1], [-.9, y + 13.2, 11.1], .08, .22);
      crates(b, rng, 5, 9.5, y, 3, .8);
    })),
  ruin("老旧平房小院铁皮顶", "影视破败：北方旧式砖平房，铁皮顶锈穿压着砖块，砖砌院墙缺口，院里堆着煤渣和破缸，晾衣绳上挂着旧布", "现代", "老旧", () => {
    const base = ruinHouse({ seed: "老旧平房小院铁皮顶", pal: BRICK, w: 9, d: 5.6, hs: 2.8, found: .25, thick: .3, damage: .1, tin: true, rise: 1.3, roofLoss: .25, door: "closed", doorW: 1.0, doorH: 2.1, windows: 3, win: { w: 1.1, h: 1.2, sill: .9 }, winKind: ["glass", "boarded"], weeds: .4 });
    return withProps(base, BRICK, "老旧平房小院p", (b, rng) => {
      const keys = ["wall", "brick", "wallB"];
      freeWall(b, rng, [-7, 6.5], [7, 6.5], .25, 1.9, .3, .45, keys, [{ u: 2.5, w: 2, y0: .25, y1: 1.9, kind: "gap" }]); freeWall(b, rng, [-7, 6.5], [-7, -4], .25, 1.9, .3, .4, keys); freeWall(b, rng, [7, 6.5], [7, -4], .25, 1.9, .3, .55, keys); freeWall(b, rng, [-7, -4], [7, -4], .25, 1.9, .3, .5, keys);
      b.heap(rng, 4.6, 4.6, 0, 1.2, .7, ["dirt", "soot", "rubbleS"]); pillar(b, "rust", -5.5, 4.6, 0, .9, .5); clothesLine(b, rng, [-5, 1.8], [-1, 4.5], 2.4); tree(b, rng, 5.8, -2.8, 5.5, { dead: true });
      for (const z of [2.9]) b.tbox("brick", [3.2, 2.9, z], [.5, .13, .22], 20, 0, 0);
    });
  }),
  ruin("废弃火车站房站台雨棚", "影视破败：荒废的小站候车楼，站台雨棚的铁皮顶塌了一截，钢柱锈蚀歪斜，候车长椅翻倒，铁轨枕木间长满荒草", "现代", "废弃", () => {
    const base = ruinHouse({ seed: "废弃火车站房站台雨棚", pal: PLASTER, w: 20, d: 7.2, hs: 4.4, found: .8, thick: .4, damage: [.2, .4, .3, .35], roof: "hip", rise: 1.7, roofLoss: .45, overhang: .8, door: "hanging", doorsAt: [-5, 5], doorW: 2.2, doorH: 3.2, windows: 5, win: { w: 1.4, h: 2.2, sill: 1 }, winKind: ["glass", "boarded"], weeds: .5 });
    return withProps(base, PLASTER, "废弃火车站房p", (b, rng) => {
      b.box("wallC", 0, .35, -6.6, 24, .7, 6); 
      for (let x = -9; x <= 9; x += 4.5) if (!rng.chance(.12)) b.beam("metal", [x, .7, -8.6], [x + (x > 5 ? .4 : 0), 4.4, -8.6], .24, .24);
      b.slope(rng, [[-10.5, 4.1, -9.4], [10.5, 4.1, -9.4], [10.5, 5.2, -4.4], [-10.5, 5.2, -4.4]], { cell: 1.1, keys: ["metal", "metal", "rust"], gone: p => (p[0] - 4) ** 2 + (p[2] + 7) ** 2 < 9, hole: .1, rafters: { key: "rust", every: 2 }, purlin: "rust", jitter: .08 });
      for (const z of [-11.4, -10.6]) { b.beam("rust", [-14, .15, z], [14, .15, z], .1, .15); }
      for (let x = -13.6; x < 14; x += .75) if (!rng.chance(.1)) b.box("wood", x, .1, -11, .24, .14, 2.2);
      for (let k = 0; k < 3; k++) b.tbox("wood", [-6 + k * 5.5, .95, -6.6], [1.8, .08, .5], rng.range(-10, 10), 0, k === 1 ? 78 : 0);
      b.weeds(rng, 0, -11, 14, 1.6, 40, 0.05); b.weeds(rng, 0, -6, 10, 2.6, 14, .7);
    });
  }),
  ruin("破败小卖部卷帘旧招牌", "影视破败：街角的老式小卖部，卷帘门卷了一半卡死，褪色的招牌斜挂，货架空了、冰柜歪倒，门前堆着空酒箱和破塑料凳", "现代", "老旧",
    house({ seed: "破败小卖部卷帘旧招牌", pal: BRICK, w: 6.8, d: 4.2, hs: 2.9, found: .2, thick: .25, damage: .1, roof: "shed", tin: true, rise: .9, roofLoss: .25, door: "ajar", doorsAt: [2.4], doorW: 1, doorH: 2.1, windows: 1, win: { w: 1.9, h: 1.3, sill: 1 }, winKind: "glass", patches: 7, weeds: .3 }, (b, rng, ctx) => {
      const y = ctx.found;
      b.plate("metal", [-.95, y + 2.3, 2.15], [.95, y + 2.3, 2.15], [.95, y + 1.3, 2.17], [-.95, y + 1.3, 2.17], .02);
      signBoard(b, rng, 0, y + 3.3, 2.2, 0, 3.4, .7, "wood", -5);
      crates(b, rng, -2.8, 3.0, 0, 5, .8); b.tbox("metal", [-3, .5, 1.2], [1.2, .9, .6], 10, 0, 20); cable(b, [3.4, y + 3.0, 2.0], [7, y + 4.6, 3], .5);
    })),
  ruin("烂尾楼钢筋混凝土裸框架", "影视破败：盖到一半停工的高层框架楼，只有柱梁楼板，顶层钢筋朝天，楼板缺块，底层砖墙只砌了一半，立面挂着破防护网", "现代", "废弃", () => {
    const b = ruinBuilder(CONCRETE), rng = new Rng("烂尾楼钢筋混凝土裸框架"), xs = [-9, -3, 3, 9], zs = [-6, 0, 6], floors = 7, hs = 3.2, y0 = .35;
    b.group("tarp", "破防护网", "#5d7f93", { roughness: .9, opacity: .8 });
 b.box("wallB", 0, .175, 0, 21, .35, 15);
    for (let k = 1; k <= floors; k++) for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      if (k >= 3 && rng.chance((k - 2) * .07 + (i === 0 ? .1 : 0)) || k === floors && rng.chance(.4)) continue;
      b.box("wallC", -6 + i * 6, y0 + k * hs - .14, -3 + j * 6, 5.9, .28, 5.9);
    }
    for (const x of xs) for (const z of zs) {
      for (let k = 0; k < floors; k++) { if (k > 3 && rng.chance(.04)) continue; const ya = y0 + k * hs, yb = ya + hs - (k === floors - 1 ? rng.range(0, .4) : 0); b.box("wallB", x, (ya + yb) / 2, z, .55, yb - ya, .55); }
      const top = y0 + floors * hs, stub = rng.range(.4, 1.3);
      b.box("wallB", x, top + stub / 2, z, .55, stub, .55);
      for (const [dx, dz] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]] as [number, number][]) b.beam("rust", [x + dx, top + stub, z + dz], [x + dx + rng.range(-.06, .06), top + stub + rng.range(.7, 1.5), z + dz], .025, .025);
    }
    const wallKeys = ["wall", "brick", "wallB"];
    for (const z of [-6, 6]) for (let i = 0; i < 3; i++) if (rng.chance(.7)) freeWall(b, rng, [xs[i]! + .3, z], [xs[i + 1]! - .3, z], y0, rng.chance(.5) ? 1.3 : hs - .3, .22, .35, wallKeys, [], { floor: .5 });
    const core: [number, number][] = [[-1.7, -1.7], [1.7, -1.7], [1.7, 1.7], [-1.7, 1.7]];
    core.forEach((p, i) => freeWall(b, rng, p, core[(i + 1) % 4]!, y0, floors * hs, .3, .35, ["wallB", "wallC"], [], { floor: 3 }));
    for (let k = 0; k < 5; k++) b.plate("tarp", [-8.6 + k * 3.6, y0 + floors * hs, 6.6], [-5.6 + k * 3.6, y0 + floors * hs, 6.6], [-5.8 + k * 3.6, y0 + floors * hs - rng.range(4, 9), 6.6], [-8.4 + k * 3.6, y0 + floors * hs - rng.range(3, 7), 6.6], .005);
    b.beam("rust", [14, 0, -8], [14, 27, -8], .55, .55); b.beam("rust", [14, 27, -8], [3, 27.4, -8], .3, .35); b.beam("rust", [14, 27, -8], [17, 26.6, -8], .3, .35);
    for (let k = 0; k < 7; k++) b.tbox("metal", [-10.5 + k * 3.5, 1.0, 9.2], [3.2, 2, .08], rng.range(-6, 6), 0, rng.range(-5, 5));
    b.heap(rng, -11, 8, 0, 2, 1); b.heap(rng, 10, -9, 0, 1.6, .8); b.weeds(rng, 0, 0, 14, 10, 34, 0);
    return b.parts();
  }),
  ruin("废弃医院住院楼门诊雨棚", "影视破败：荒废的四层住院楼，窗玻璃大面积破碎、藤蔓爬满立面，门诊入口雨棚塌斜，红十字招牌掉在地上，楼前杂草没膝", "现代", "废弃",
    house({ seed: "废弃医院住院楼门诊雨棚", pal: CONCRETE, w: 30, d: 11, storeys: 4, hs: 3.5, found: .5, thick: .4, damage: .12, roof: "flat", roofLoss: .3, door: "missing", doorW: 3, doorH: 2.9, windows: 9, win: { w: 1.4, h: 1.5, sill: .9 }, winKind: ["glass", "empty", "empty", "boarded"], vines: .9, moss: .6, patches: 12, weeds: .8, rubble: .3 }, (b, rng, ctx) => {
      const y = ctx.found;
      b.group("red", "掉落的红十字", "#a33a32", { roughness: .85 });
      b.beam("stone", [-3.4, y, 7.8], [-3.4, y + 3.2, 7.8], .35, .35); b.beam("stone", [3.4, y, 7.8], [3.9, y + 2.5, 7.9], .35, .35);
      b.tbox("wallC", [0, y + 3.1, 6.6], [7.6, .3, 4.4], 0, 9, 4);
      b.tbox("red", [8, .35, 8], [1.6, .7, .12], 20, 0, 0); b.tbox("red", [8, .35, 8], [.7, 1.6, .12], 20, 0, 0);
      pillar(b, "metal", 10, 0, y + 14.5, y + 16.2, 1);
      for (let k = 0; k < 3; k++) b.tbox("metal", [-9 + k * 1.2, .9, 8.5 + k * .4], [.7, 1.2, .8], rng.range(0, 180), 0, k * 20);
    })),
  ruin("废弃教学楼走廊旗杆", "影视破败：荒废的三层砖混教学楼，红瓦屋面塌了一角、窗框空洞，走廊墙皮成片剥落，操场旗杆折断，篮球架只剩锈架子", "现代", "废弃",
    house({ seed: "废弃教学楼走廊旗杆", pal: { ...CONCRETE, wall: "#c9c2a8" }, w: 28, d: 9, storeys: 3, hs: 3.6, found: .5, thick: .4, damage: .14, roof: "hip", rise: 2.2, roofKeys: ["rubble", "rubble", "brick"], roofLoss: .35, overhang: .6, door: "hanging", doorW: 2.4, doorH: 2.9, windows: 8, win: { w: 2, h: 1.8, sill: .9 }, winKind: ["glass", "empty", "boarded"], patches: 12, moss: .5, vines: .6, weeds: .9 }, (b, rng) => {
      b.beam("metal", [10, 0, 10], [12.5, .4, 6.8], .12, .12); b.beam("metal", [12.5, .4, 6.8], [15.2, .5, 5.2], .1, .1);
      b.beam("rust", [-12, 0, 11], [-12, 3.6, 11], .1, .1); b.beam("rust", [-12, 3.6, 11], [-12, 3.6, 12.1], .08, .08); b.tbox("rust", [-12, 3.5, 12.3], [1.2, .9, .05], 0, 0, 4);
    })),
  ruin("炸毁一角居民楼露层家具", "影视破败：被炸掉一个角的五层居民楼，侧墙整片坍塌露出各层房间，楼板悬挑断裂，屋里的衣柜、床架歪倒，墙上烟熏焦黑，楼下堆着崩落的楼板", "现代", "破损",
    house({ seed: "炸毁一角居民楼露层家具", pal: CONCRETE, w: 18, d: 12, storeys: 5, hs: 3, found: .4, thick: .35, damage: [.15, .25, .82, .3], roof: "flat", roofLoss: .5, door: "missing", doorW: 1.8, windows: 4, win: { w: 1.3, h: 1.5, sill: .9 }, winKind: ["glass", "empty", "shutter"], patches: 10, soot: .6, rubble: .8 }, (b, rng, ctx) => {
      const W = 18, D = 12, t = .35, y = ctx.found;
      for (let k = 1; k < 5; k++) {
        b.floorGrid(rng, "wallC", "woodD", -W / 2 + t, -D / 2 + t, W / 2 - t, D / 2 - t, y + k * 3, { cell: 1.5, missing: .08, thick: .22, gone: (x, z) => x < -2.5 + k * .4 + Math.sin(z) * 1.2 });
        const fy = y + (k - 1) * 3 + .06;
        freeWall(b, rng, [2.6, -5.6], [2.6, 5.6], fy, 2.7, .15, .4, wall3, [{ u: 0, w: 1, y0: fy, y1: fy + 2.1, kind: "door" }]);
        b.tbox("wood", [rng.range(-1, 1.6), fy + .9, rng.range(-4, 4)], [.9, 1.8, .5], rng.range(0, 180), 0, rng.range(-28, 28)); b.box("woodD", rng.range(4, 7), fy + .25, rng.range(-4.5, 4.5), 1.9, .45, 1.0);
        b.plate("cloth", [-1, fy + 2.6, 5.6], [.2, fy + 2.6, 5.6], [.1, fy + 1.0, 5.6], [-.9, fy + 1.2, 5.6], .004);
      }
      b.heap(rng, -W / 2 - 2.2, 0, 0, 4.8, 2.6, ["rubble", "rubbleS", "wallC"], 42);
    })),
  ruin("废弃加油站塌斜顶棚油泵", "影视破败：荒废的公路加油站，大顶棚一角塌落、斜压在锈蚀的加油机上，旁边的便利店玻璃全碎，油污和杂草盖满地面", "现代", "废弃", () => {
    const store = ruinHouse({ seed: "废弃加油站便利店", pal: CONCRETE, w: 8, d: 5, hs: 3.3, found: .25, thick: .3, damage: .2, roof: "flat", roofLoss: .3, door: "missing", doorsAt: [2.2], doorW: 1.2, doorH: 2.4, windows: 1, win: { w: 2.8, h: 1.8, sill: .8 }, winKind: "glass", weeds: .5 });
    return withProps(placeParts(store, -10, 0, -2, 0), CONCRETE, "废弃加油站p", (b, rng) => {
      for (const [x, z] of [[-4.5, -2], [4.5, -2], [-4.5, 5], [4.5, 5]] as [number, number][]) b.box("wallB", x, 2.6, z, .7, 5.2, .7);
      b.tbox("wallC", [0, 5.45, 1.5], [10.6, .4, 9.6], 0, 4, 3); b.tbox("wallC", [-1, 1.3, 6.5], [4.2, .4, 3.2], 20, 22, 8);
      b.beam("rust", [4.5, 5.1, 5], [3.4, .6, 6.2], .3, .3);
      for (const [x, tilt] of [[-1.6, 0], [1.6, 22]] as [number, number][]) { b.tbox("rust", [x, .85, 1.5], [.8, 1.7, .55], 0, 0, tilt); b.tbox("soot", [x, 1.45, 1.5], [.6, .35, .58], 0, 0, tilt); }
      b.beam("metal", [9, 0, 6], [9.6, 7.6, 6], .22, .22); b.tbox("metal", [9.6, 7.6, 6], [2.4, 1.2, .2], 0, 0, 6);
      b.weeds(rng, 0, 2, 12, 8, 36, .02);
    });
  }),
  ruin("废弃商场玻璃立面招牌残字", "影视破败：荒废的郊区大商场，整面玻璃橱窗碎得只剩框，招牌大字掉落一半，停车场地面龟裂长草，门前翻倒着购物车", "现代", "废弃",
    house({ seed: "废弃商场玻璃立面招牌残字", pal: CONCRETE, w: 36, d: 22, hs: 7, found: .4, thick: .4, damage: .1, roof: "flat", roofLoss: .35, door: "gap", doorsAt: [0], doorW: 4.2, doorH: 3.4, windows: 6, win: { w: 4.2, h: 3.8, sill: .5 }, winKind: "glass", vines: .5, patches: 12, weeds: .8, rubble: .4 }, (b, rng, ctx) => {
      b.group("letter", "掉落招牌字", "#7a3b36", { roughness: .8 });
      for (let k = 0; k < 6; k++) if (rng.chance(.6)) b.box("letter", -9 + k * 3.4, ctx.found + 6.2, 11.3, 2.4, 1.6, .3); else b.tbox("letter", [-9 + k * 3.4, .8, 13 + rng.range(0, 1.5)], [2.4, 1.6, .3], rng.range(0, 360), 80, rng.range(-10, 10));
      for (let k = 0; k < 6; k++) { const x = rng.range(-12, 12), z = rng.range(12, 16); b.tbox("metal", [x, .45, z], [.9, .9, .6], rng.range(0, 360), rng.range(0, 90), rng.range(-30, 30)); }
      b.weeds(rng, 0, 16, 20, 6, 30, .03);
    })),
  ruin("老旧居民楼空调外机锈迹", "影视破败：六层老居民楼没倒，只是脏旧——外墙雨痕锈迹、水泥剥落，立面挂满空调外机、防盗网和乱拉的电线，楼顶水箱锈蚀", "现代", "老旧",
    house({ seed: "老旧居民楼空调外机锈迹", pal: CONCRETE, w: 22, d: 11, storeys: 6, hs: 2.9, found: .35, thick: .35, damage: .02, roof: "flat", roofLoss: 0, door: "closed", doorW: 1.6, doorH: 2.3, windows: 6, win: { w: 1.3, h: 1.4, sill: .9 }, winKind: ["glass", "shutter", "empty"], patches: 16, moss: .4, vines: .5, soot: 0, rubble: .1, weeds: .4 }, (b, rng, ctx) => {
      const y = ctx.found, fr = ctx.frames[0]!;
      for (let k = 0; k < 18; k++) { const u = -9 + (k % 6) * 3.6 + rng.pick([-.95, .95]), kk = Math.floor(k / 6) + 1 + rng.int(3); acUnit(b, u, y + kk * 2.9 + .8, 5.65, 0); b.streak("rust", fr, 1, ctx.t / 2, u, y + kk * 2.9 + .5, rng.range(.8, 1.8), .35); }
      for (let k = 0; k < 8; k++) cable(b, [-10 + k * 2.8, y + 12, 5.6], [-9 + k * 2.8, y + 7, 5.9], .6);
      pillar(b, "rust", 6, 0, y + 17.4, y + 19.2, 1.2); b.beam("metal", [-6, y + 17.4, 0], [-6, y + 20.2, 0], .06, .06);
    })),
  ruin("废弃工厂铁皮车间塌顶", "影视破败：钢架铁皮的老车间，屋顶铁皮大片掀飞塌落，锈蚀的墙板剥开，高处一排破窗，巨大的卷帘门歪在门框上，院里立着锈罐", "现代", "废弃",
    house({ seed: "废弃工厂铁皮车间塌顶", pal: CONCRETE, w: 26, d: 16, hs: 7.5, found: .2, thick: .3, damage: [.2, .3, .25, .35], wallKeys: ["metal", "metal", "rust", "wallB"], tin: true, roofLoss: .55, rise: 2.4, overhang: .3, door: "hanging", doorW: 4.5, doorH: 4.6, windows: 6, win: { w: 2, h: 1.2, sill: 5.2 }, winKind: "glass", weeds: .7, rubble: .6 }, (b, rng) => {
      pillar(b, "metal", 14.5, -5, 0, 20, .9); pillar(b, "rust", 14.5, 2, 0, 5.4, 2.2); pillar(b, "rust", 17.5, 2, 0, 4.8, 2, { lean: [.3, 0] });
      for (let k = 0; k < 6; k++) b.tbox("metal", [rng.range(-5, 8), .6 + rng.next() * .4, rng.range(7, 11)], [3.2, .08, 1.2], rng.range(0, 360), rng.range(5, 40), rng.range(-15, 15));
      b.box("wallB", -6, .7, 9.4, 8, 1.4, 2.6); b.weeds(rng, 0, 10, 14, 4, 20, .02);
    })),
  ruin("荒废别墅藤蔓覆墙干涸泳池", "影视破败：被遗弃多年的两层现代别墅，藤蔓和灌木爬满外墙，阳台塌了一半，窗玻璃碎裂，院里的泳池干涸积着落叶和污泥", "现代", "废弃", () => {
    const base = ruinHouse({ seed: "荒废别墅藤蔓覆墙干涸泳池", pal: PLASTER, w: 12, d: 9, storeys: 2, hs: 3.3, found: .7, thick: .35, damage: .15, roof: "hip", rise: 2.4, roofLoss: .25, sag: .15, overhang: .6, door: "ajar", doorW: 1.5, doorH: 2.5, windows: 3, win: { w: 1.2, h: 1.6, sill: .9 }, winKind: ["glass", "shutter", "boarded"], vines: 1, moss: .6, weeds: 1.2, rubble: .3 });
    return withProps(base, PLASTER, "荒废别墅p", (b, rng) => {
      b.group("water", "污泥积水", "#4d5a45", { roughness: .3 });
      b.box("stone", 0, .1, 12, 8, .2, 4.4);
      for (const [x, z, w, d] of [[-4.1, 12, .3, 4.8], [4.1, 12, .3, 4.8], [0, 9.8, 8.4, .3], [0, 14.2, 8.4, .3]] as number[][]) b.box("wallC", x!, .22, z!, w!, .44, d!);
      b.quad("water", [-3.8, .12, 10.1], [3.8, .12, 10.1], [3.8, .12, 13.9], [-3.8, .12, 13.9], [0, 1, 0]);
      for (let k = 0; k < 10; k++) b.tbox("leaf", [rng.range(-3.4, 3.4), .16, rng.range(10.4, 13.6)], [.3, .04, .22], rng.range(0, 360));
      gallery(b, rng, -5, 5, 4.7, 4.5, 1.4, { key: "wallC", rail: "rust" });
      for (let k = 0; k < 4; k++) b.bush("leaf", rng, -6.5 + k * 4.4 + rng.range(-1, 1), .3, 5.6 + rng.range(0, 1.5), rng.range(.5, 1));
      b.beam("rust", [-8, 0, 8.5], [8, 0, 8.5], .06, 1.1); tree(b, rng, 8.5, 6, 7);
    });
  }),
  ruin("破败汽车旅馆一字客房霓虹残牌", "影视破败：公路边的一排平房汽车旅馆，客房门板歪斜、窗帘破烂，屋顶的霓虹招牌断裂、字母掉落，停车位地面开裂长草", "现代", "破损",
    house({ seed: "破败汽车旅馆一字客房霓虹残牌", pal: PLASTER, w: 28, d: 6.2, hs: 2.9, found: .25, thick: .25, damage: .1, roof: "flat", roofLoss: .2, door: "ajar", doorsAt: [-10.5, -6, -1.5, 3, 7.5, 12], doorW: 1, doorH: 2.2, windowsAt: [-8.25, -3.75, .75, 5.25, 9.75], windows: 5, win: { w: 1.3, h: 1.2, sill: 1 }, winKind: ["shutter", "glass", "boarded"], patches: 8, weeds: .6 }, (b, rng, ctx) => {
      b.group("neon", "断裂霓虹管", "#d46a6a", { emissive: "#a02a2a", emissiveIntensity: .35, roughness: .5 });
      b.beam("metal", [-11, 0, 8.6], [-11, 7.6, 8.6], .22, .22); b.tbox("wallC", [-11, 7.6, 8.6], [5.4, 1.6, .25], 0, 0, 5);
      for (let k = 0; k < 5; k++) if (rng.chance(.7)) b.beam("neon", [-13 + k * 1, 7.2, 8.8], [-13 + k * 1 + rng.range(-.2, .5), 8.0, 8.8], .08, .08); else b.tbox("neon", [-12 + k * .8, .2, 9.4], [.6, .08, .08], rng.range(0, 90));
      for (let k = 0; k < 6; k++) b.patch("soot", rng, ctx.frames[0]!, 1, ctx.t / 2, -10.5 + k * 4.5, ctx.found + 1.7, .7, .45, .02, 5);
 b.weeds(rng, 0, 8, 15, 3, 24, .03);
    })),
];
