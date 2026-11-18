import { ruinHouse, type HouseCfg } from "./ruinHouse";
import { placeParts, Rng, ruinBuilder, type P, type RuinBuilder } from "./ruinKit";
import { banner, crates, fence, freeWall, pillar, sandbags, stairs, tree, well } from "./ruinProps";
import { bars, loc } from "./setDressing";
import { BRICK, CONCRETE, LOESS, WASTE, house, ruin, withProps } from "./ruinCommon";
import type { ArchitecturePrototype } from "./structures";

// 影视破败外景·场景类（二）：战地野战医院帐篷群、末日避难所入口、监狱围墙与岗楼、废弃水塔、荒村残屋群、战火废墟街角。
const DEG = Math.PI / 180;

/** 一顶人字帐篷：两坡顶、侧墙、后山墙、前门帘撩开，带中柱、拉绳、屋面红十字和里面的行军床。 */
function tent(b: RuinBuilder, rng: Rng, cx: number, cz: number, yaw: number, w: number, l: number, h: number, wh: number, torn = false) {
  const p = (lx: number, y: number, lz: number): P => { const [x, z] = loc(cx, cz, yaw, lx, lz); return [x, y, z]; };
  const dir = (lx: number, lz: number): P => { const [x, z] = loc(0, 0, yaw, lx, lz); return [x, 0, z]; };
  const gable = (key: string, z: number, a: P, c: P, d: P) => { b.tri(key, a, c, d, dir(0, z)); b.tri(key, a, d, c, dir(0, -z)); };
  for (const s of [-1, 1]) {
    if (!(torn && s > 0)) b.plate("cv", p(s * w / 2, wh, -l / 2), p(0, h, -l / 2), p(0, h, l / 2), p(s * w / 2, wh, l / 2), .02);
    if (!(torn && s > 0)) b.plate("cvD", p(s * w / 2, 0, -l / 2), p(s * w / 2, 0, l / 2), p(s * w / 2, wh, l / 2), p(s * w / 2, wh, -l / 2), .02);
    b.plate("cvD", p(s * w / 2, 0, l / 2), p(s * (w / 2 - 1.0), 0, l / 2), p(s * (w / 2 - 1.0), wh, l / 2), p(s * w / 2, wh, l / 2), .02);
    for (const z of [-1, 1]) { b.beam("cvD", p(s * w / 2, wh, z * l / 2), p(s * (w / 2 + 1.6), 0, z * l / 2 * 1.2), .02, .02); b.beam("wood", p(s * (w / 2 + 1.6), 0, z * l / 2 * 1.2), p(s * (w / 2 + 1.6), .3, z * l / 2 * 1.2), .06, .06); }
  }
  gable("cvD", -1, p(-w / 2, wh, -l / 2), p(w / 2, wh, -l / 2), p(0, h, -l / 2)); gable("cvD", 1, p(-w / 2, wh, l / 2), p(w / 2, wh, l / 2), p(0, h, l / 2));
  for (const z of [-1, 1]) b.beam("wood", p(0, 0, z * l / 2), p(0, h, z * l / 2), .1, .1);
  b.beam("wood", p(0, h, -l / 2), p(0, h, l / 2), .08, .08);
  const sl = Math.hypot(-w / 2, wh - h), su: [number, number] = [-w / 2 / sl, (wh - h) / sl], sp = (lz: number, t: number): P => p(-w / 4 + su[0] * t, (wh + h) / 2 + su[1] * t + .03, lz);
  if (!torn) { b.plate("rc", sp(-.9, -.25), sp(.9, -.25), sp(.9, .25), sp(-.9, .25), .01); b.plate("rc", sp(-.25, -.9), sp(.25, -.9), sp(.25, .9), sp(-.25, .9), .01); }
  const n = Math.max(2, Math.floor((l - 2.4) / 2));
  for (let k = 0; k < n; k++) for (const s of [-1, 1]) { const [x, z] = loc(cx, cz, yaw, s * w * .3, -l / 2 + 1.4 + k * (l - 2.6) / Math.max(1, n - 1)); b.boxYaw("cvD", x, .45, z, .8, .08, 1.9, yaw); b.boxYaw("wh", x, .53, z, .74, .1, 1.7, yaw); for (const q of [-.9, .9]) b.beam("metal", [x, 0, z + q * Math.cos(yaw * DEG)], [x, .42, z + q * Math.cos(yaw * DEG)], .04, .04); }
  void rng;
}

export const ruinBuildingFiveDesigns: ArchitecturePrototype[] = [
  ruin("战地野战医院帐篷群", "影视破败：战地野战医院，三顶军绿帆布大帐篷并排扎在空地上，顶上刷着红十字、帐门敞开能看到行军床，沙袋围护、物资箱堆放，一顶帐篷被弹片撕裂塌了半边，旗杆上的旗子破烂", "现代", "破损", () => {
    const b = ruinBuilder(WASTE), rng = new Rng("战地野战医院帐篷群");
    b.group("cv", "军绿帆布", "#76795a", { roughness: 1 }).group("cvD", "旧帆布", "#63664a", { roughness: 1 }).group("rc", "红十字", "#b0302a", { roughness: .8 }).group("wh", "白布", "#d8d4c6", { roughness: 1 });
    tent(b, rng, -9, 0, 5, 6, 12, 4.2, 2.4); tent(b, rng, 0, -2, -3, 5, 9, 3.6, 2.2, true); tent(b, rng, 9, 1, 8, 6, 12, 4.2, 2.4);
    for (const [x, z, yaw, count] of [[-9, 8.2, 0, 9], [9, 8.4, 0, 9], [0, 4.6, 0, 6], [-4.6, 7.0, 40, 6]] as [number, number, number, number][]) sandbags(b, rng, x, z, yaw, count, "cvD");
    crates(b, rng, -3.5, 10, 0, 6, 1.6); crates(b, rng, 4.5, 11, 0, 5, 1.4, "woodD"); pillar(b, "metal", 0, 12, 0, 7, .06, { sides: 6 }); banner(b, rng, 0, 4, 12, 3, "rc");
    b.weeds(rng, 0, 4, 16, 10, 40, 0); b.scatter(rng, 0, 5, 12, 8, 0, 18, ["rubbleS", "dirt"], .14);
    return b.parts();
  }),
  ruin("末日避难所入口防爆门", "影视破败：荒地里一座半埋入土丘的混凝土避难所入口，厚重的防爆铁门歪开着，门前台阶和沙袋，锈蚀的排风管和歪斜的天线探出土丘，警示牌和铁丝网围着，杂草爬满", "废土", "老旧", () => {
    const b = ruinBuilder(CONCRETE), rng = new Rng("末日避难所入口");
    b.group("hazard", "警示黄", "#d8b020", { roughness: .8 });
    b.dune("dirt", rng, 0, -5.5, 11, 8, 5.5, 0, 0, 18);
    b.wallRun(rng, { x: 0, z: 2.5, yaw: 0 }, -3.6, 3.6, 0, 4.8, 1.4, [{ u: 0, w: 2.2, y0: 0, y1: 2.9, kind: "door" }], { damage: .2, keys: ["wall", "stone", "wallB"], lintels: 1 });
    freeWall(b, rng, [-3.6, 2.5], [-8.5, -1], 0, 3.4, .8, .25, ["wall", "stone"]); freeWall(b, rng, [3.6, 2.5], [8.5, -1], 0, 3.4, .8, .25, ["wall", "stone"]);
    b.tbox("metal", [.76, 1.5, 4.14], [2.0, 2.8, .25], -110, 0, 0); for (const y of [.6, 1.5, 2.4]) b.tbox("rust", [.76, y, 4.14], [2.0, .12, .3], -110, 0, 0);
    stairs(b, rng, "stone", 0, 4.4, 0, 3.0, 3, .18, .4, 0);
    pillar(b, "metal", 3.0, -2.0, 4.0, 7.8, .35, { sides: 10 }); pillar(b, "rust", 3.0, -2.0, 7.8, 8.4, .4, { sides: 10, lean: [.5, 0] }); pillar(b, "rust", -2.2, -3.5, 4.8, 7.0, .22, { sides: 8, lean: [-.4, .2] });
    b.beam("metal", [-2.5, 5.0, -3], [-2.9, 12, -3], .06, .06); for (const [y, l] of [[10.2, 1.4], [11.2, 1.0], [8.8, 1.8]] as [number, number][]) b.beam("metal", [-2.7 - l / 2, y, -3], [-2.7 + l / 2, y, -3], .04, .04);
    b.box("hazard", -3.0, 2.3, 3.25, .7, .7, .05); b.box("soot", -3.0, 2.3, 3.29, .3, .3, .02); fence(b, rng, [-9, 9], [9, 9], 0, 1.8, 2.4, "metal");
    sandbags(b, rng, -3.4, 5.5, 20, 6); sandbags(b, rng, 3.5, 5.0, -20, 6); tree(b, rng, -8, 6, 7, { dead: true }); b.weeds(rng, 0, 5, 9, 5, 40, 0);
    return b.parts();
  }),
  ruin("监狱围墙与岗楼铁丝网", "影视破败：高墙监狱的一段围墙，两端各一座高脚岗楼，墙顶拉着带刺铁丝网，中间铁栅大门一扇歪开，墙根杂草和探照灯，墙面水渍污迹斑驳", "现代", "老旧", () => {
    const tower = ruinHouse({ seed: "监狱岗楼", pal: CONCRETE, w: 3.4, d: 3.4, hs: 2.6, found: .2, thick: .2, damage: .15, roof: "flat", door: "closed", doorW: .9, doorH: 2, windows: 1, win: { w: 1.4, h: 1.0, sill: 1.0 }, winKind: "glass", moss: .2, weeds: 0 });
    return withProps([...placeParts(tower, -13, 7, 0), ...placeParts(tower, 13, 7, 0)], CONCRETE, "监狱围墙岗楼p", (b, rng) => {
      for (const tx of [-13, 13]) {
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) pillar(b, "stone", tx + sx * 1.4, sz * 1.4, 0, 7, .25, { sides: 8 });
        for (const y of [2.8, 5.2]) for (const s of [-1, 1]) { b.beam("metal", [tx - 1.4, y, s * 1.4], [tx + 1.4, y, s * 1.4], .1, .1); b.beam("metal", [tx + s * 1.4, y, -1.4], [tx + s * 1.4, y, 1.4], .1, .1); }
        for (const s of [-1, 1]) b.beam("metal", [tx + 1.9 * Math.sign(tx) * -1, 0, s * .3], [tx + 1.9 * Math.sign(tx) * -1, 7, s * .3], .06, .06);
        for (let k = 0; k < 20; k++) if (!rng.chance(.12)) b.beam("metal", [tx - 1.9 * Math.sign(tx), .3 + k * .34, -.3], [tx - 1.9 * Math.sign(tx), .3 + k * .34, .3], .04, .04);
        b.sphere("paper", [tx, 10.0, 0], .35);
      }
      for (const [x0, x1] of [[-24, -14.8], [-11.2, -2.5], [2.5, 11.2], [14.8, 24]] as [number, number][]) {
        freeWall(b, rng, [x0, 0], [x1, 0], 0, 5.5, .6, .1, ["wall", "wallB", "wallC"]);
        for (let x = x0 + .3; x < x1 - .3; x += 1.5) b.beam("metal", [x, 5.5, 0], [x + .25, 6.5, .1], .05, .05);
        for (const [y0, y1] of [[5.7, 6.4], [6.2, 5.6]] as [number, number][]) for (let x = x0 + .3; x < x1 - .6; x += .6) b.beam("metal", [x, y0, .08], [x + .6, y1, .08], .02, .02);
      }
      for (const x of [-2.6, 2.6]) b.box("stone", x, 3.0, 0, 1.0, 6, 1.0);
      bars(b, -2.4, 0, -.3, 0, 0, 4.5, .18, "metal"); bars(b, 2.4, 0, 1.47, 2.0, 0, 4.5, .18, "metal");
      b.weeds(rng, 0, 1, 20, 1.5, 40, 0); b.weeds(rng, 0, -1, 20, 1.5, 24, 0);
    });
  }),
  ruin("废弃砖砌水塔锈蚀水箱", "影视破败：荒废工厂旁的砖砌八边形水塔，砖墙剥落、一侧有大缺口，顶上锈蚀的钢水箱歪斜、锥顶掉了一半，爬梯断了几档，塔脚堆着碎砖，杂草爬满", "废土", "废弃", () => {
    const b = ruinBuilder(BRICK), rng = new Rng("废弃砖砌水塔"), off = (y: number) => (y - 11.2) / 4.2 * .5;
    b.ringWall(rng, 0, 0, 2.8, .2, 11, .6, 8, { damage: .2, keys: ["brick", "wallB", "wall"], breach: { angle: 70, width: 48 }, holes: (k) => k === 0 ? [{ u: 0, w: .9, y0: .2, y1: 2.0, kind: "door" }] : k % 3 === 1 ? [{ u: 0, w: .35, y0: 5 + (k % 2) * 2, y1: 6.6 + (k % 2) * 2, kind: "window" }] : [] });
    pillar(b, "metal", .3, 0, 11.2, 15.4, 3.3, { sides: 14, lean: [.5, .2] }); for (const y of [12.0, 13.2, 14.4]) pillar(b, "rust", .3 + off(y), off(y) * .4, y, y + .1, 3.36, { sides: 14 });
    const apex: P = [.9, 17.3, .3];
    for (let k = 0; k < 14; k++) { if (k >= 4 && k <= 8) continue; const a0 = k / 14 * Math.PI * 2, a1 = (k + 1) / 14 * Math.PI * 2, p0: P = [.8 + Math.cos(a0) * 3.3, 15.4, .2 + Math.sin(a0) * 3.3], p1: P = [.8 + Math.cos(a1) * 3.3, 15.4, .2 + Math.sin(a1) * 3.3]; b.tri("rust", apex, p1, p0, [0, 1, 0]); b.tri("rust", apex, p0, p1, [0, -1, 0]); }
    for (const s of [-1, 1]) b.beam("metal", [3.1, .3, s * .3], [3.1, 11, s * .3], .06, .06);
    for (let k = 0; k < 30; k++) if (!rng.chance(.15)) b.beam("metal", [3.1, .5 + k * .35, -.3], [3.1, .5 + k * .35, .3], .04, .04);
    b.beam("rust", [-3.0, 11.2, 0], [-3.1, 6, 0], .25, .25); b.beam("rust", [-3.2, 3, 0], [-3.2, 0, 0], .25, .25);
    b.heap(rng, Math.sin(70 * DEG) * 4.5, Math.cos(70 * DEG) * 4.5, 0, 2.4, 1.2, ["rubble", "brick", "stone"], 40); b.weeds(rng, 0, 0, 5, 5, 30, 0); b.bush("leaf", rng, -3.8, 0, -2, 1.1);
    return b.parts();
  }),
  ruin("荒村残屋群土墙茅顶", "影视破败：荒弃的山村，四间土坯房东倒西歪，茅草顶烂了大半、土墙开裂塌角，院墙只剩矮垣，村里老井和枯树，荒草没膝", "中式", "废弃", () => {
    const mk = (seed: string, w: number, d: number, dm: [number, number, number, number], extra: Partial<HouseCfg> = {}) => ruinHouse({ seed, pal: LOESS, w, d, hs: 2.8, found: .2, thick: .45, damage: dm, roof: "gable", thatch: true, roofLoss: .6, rise: 1.4, door: "missing", doorW: 1.2, doorH: 2.0, windows: 1, win: { w: .7, h: .8, sill: 1.1 }, winKind: "empty", moss: .2, weeds: 1, rubble: .8, patches: 4, ...extra });
    return withProps([...placeParts(mk("荒村甲", 8, 5, [.3, .5, .4, .55]), -9, 0, 0, 14), ...placeParts(mk("荒村乙", 6, 4.6, [.35, .55, .5, .5], { roof: "none" }), 4, 0, -2, -22), ...placeParts(mk("荒村丙", 7, 5, [.3, .45, .4, .5], { roofLoss: .8 }), 3, 0, 11, 170), ...placeParts(mk("荒村丁", 4.5, 4, [.5, .6, .5, .6], { roof: "none" }), -4, 0, -13, 40)], LOESS, "荒村p", (b, rng) => {
      well(b, rng, -1, 5, 0, .8); freeWall(b, rng, [-14, 5], [-5, 6.5], 0, 1.2, .4, .5, ["wall", "wallB"]); freeWall(b, rng, [8, 4], [12, 9], 0, 1.0, .4, .55, ["wall", "wallB"]);
      tree(b, rng, 9, -8, 7, { dead: true }); tree(b, rng, -14, -6, 6); b.dune("thatch", rng, -6, 8, 1.4, 1.1, .8, 20, 0); b.weeds(rng, 0, 0, 17, 15, 80, 0);
    });
  }),
  ruin("战火废墟街角三层楼残壳", "影视破败：战争中炸毁的临街三层楼，外墙弹孔累累、一整面墙塌掉露出各层楼板和房间，窗洞黑黢黢，街上堆着瓦砾、沙袋工事和烧毁的车辆残骸", "现代", "破损",
    house({ seed: "战火三层楼", pal: { ...BRICK, wall: "#9a8a76", brick: "#7a5240" }, w: 13, d: 10, storeys: 3, hs: 3.3, found: .3, thick: .45, damage: [.4, .6, .5, .55], roof: "none", door: "missing", doorW: 1.8, doorH: 2.6, windows: 3, win: { w: 1.3, h: 1.8, sill: .9 }, winKind: ["empty", "boarded"], soot: 1, rubble: 1.6, weeds: .3, patches: 8 }, (b, rng) => {
      sandbags(b, rng, -3, 9, 0, 9); sandbags(b, rng, 3.5, 8.6, 10, 6);
      b.tbox("rust", [7.5, .6, 10.5], [4.2, .7, 1.8], -15, 0, 3); b.tbox("soot", [7.3, 1.2, 10.5], [2.0, .6, 1.6], -15, 0, 3);
      for (const [dx, dz] of [[-1.4, -.9], [-1.4, .9], [1.4, -.9], [1.4, .9]] as [number, number][]) b.tbox("soot", [7.5 + dx * Math.cos(15 * DEG) + dz * Math.sin(15 * DEG), .35, 10.5 - dx * Math.sin(15 * DEG) * -1 + dz * Math.cos(15 * DEG) * .3], [.7, .7, .3], -15, 0, 0);
      b.heap(rng, -2, 11.5, 0, 2.5, 1.2, ["rubble", "brick", "soot"], 30); b.heap(rng, 5, 7.5, 0, 2.0, .9, ["rubble", "brick"], 20);
    })),
];
