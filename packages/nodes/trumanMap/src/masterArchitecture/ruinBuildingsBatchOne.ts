import { DEG } from "./partMath";
import { doorDecor, ruinHouse } from "./ruinHouse";
import { placeParts, Rng, ruinBuilder, shearParts, type Frame, type Hole, type P, type RuinBuilder } from "./ruinKit";
import { banner, crates, fence, freeWall, pillar, signBoard, stairs, stele, tree, well } from "./ruinProps";
import { CN, CN_RED, LOESS, house, ruin, withProps } from "./ruinCommon";
import type { ArchitecturePrototype } from "./structures";
// 影视破败建筑·中式古代：断壁残垣、塌顶漏屋、焚毁焦墙、荒庙荒祠、残塔残楼、窑洞戏台。
// 每座都是独立的具名废墟，墙垛断顶、屋面缺瓦露椽、门扇歪挂、瓦砾苔藓杂草都是真几何。
const wall3 = ["wall", "wallB", "wallC"];
/** 竖直的木水轮：轮圈、八根辐条，gapFrom–gapTo（弧度）之间的轮圈已经断掉。 */
function wheel(b: RuinBuilder, cx: number, cy: number, cz: number, r: number, gapFrom: number, gapTo: number) {
  const n = 16;
  for (let k = 0; k < n; k++) {
    const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2, mid = (a0 + a1) / 2;
    if (mid > gapFrom && mid < gapTo) continue;
    b.beam("wood", [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cz], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, cz], .5, .16);
  }
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; if (a > gapFrom && a < gapTo && k % 2) continue; b.beam("wood", [cx, cy, cz], [cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz], .14, .14); }
}
/** 八角塔腰檐：每片一块两面的瓦板，缺的概率 loss。 */
function eaves(b: RuinBuilder, rng: Rng, rIn: number, rOut: number, y: number, loss: number) {
  const p = (rad: number, deg: number, yy: number): P => [Math.sin(deg * DEG) * rad, yy, Math.cos(deg * DEG) * rad];
  for (let k = 0; k < 8; k++) {
    if (rng.chance(loss)) continue;
    const a0 = 45 * k, a1 = 45 * (k + 1);
    b.plate(rng.pick(["tile", "tileD", "tileM"]), p(rIn, a0, y), p(rIn, a1, y), p(rOut, a1, y - .55), p(rOut, a0, y - .55), .07);
    if (rng.chance(.5)) b.bush("leaf", rng, Math.sin((a0 + 22.5) * DEG) * rOut * .92, y - .5, Math.cos((a0 + 22.5) * DEG) * rOut * .92, .3);
  }
}
export const ruinBuildingDesigns: ArchitecturePrototype[] = [
  ruin("塌顶断梁青瓦荒宅", "影视破败：青瓦硬山民居塌了半边屋顶，露出断椽朽檩，山墙缺口参差，门扇歪挂，墙根长苔、屋内瓦砾成堆", "中式", "破损",
    house({ seed: "塌顶断梁青瓦荒宅", pal: CN, w: 10, d: 7, damage: [.3, .55, .35, .5], roofLoss: .55, door: "hanging", windows: 3, winKind: ["lattice", "boarded", "empty"] })),
  ruin("断壁残垣无顶残墙院落", "影视破败：屋顶早已塌光，只剩参差断顶的四面残墙和门窗洞，地面长满杂草碎瓦", "中式", "废弃",
    house({ seed: "断壁残垣无顶残墙院落", pal: CN, w: 11, d: 8, damage: [.7, .85, .75, .8], roof: "none", door: "missing", windows: 3, winKind: ["empty", "lattice"], weeds: 1, rubble: 1 })),
  ruin("朽草塌檐荒废茅屋", "影视破败：茅草顶塌陷下垂、檐口散乱，土坯墙开裂剥落，门板虚掩，屋前杂草丛生", "中式", "老旧",
    house({ seed: "朽草塌檐荒废茅屋", pal: { ...CN, wall: "#a8977a" }, w: 6.5, d: 4.8, hs: 2.6, thick: .45, damage: .25, thatch: true, roofLoss: .35, sag: .35, overhang: .6, rise: 1.6, door: "ajar", windows: 1, winKind: "boarded" })),
  ruin("焚毁漏顶村舍焦墙", "影视破败：大火烧过的村舍，墙面熏黑，屋顶烧塌只剩焦黑的椽檩，门窗洞黑洞洞，地上是灰烬与断梁", "中式", "破损",
    house({ seed: "焚毁漏顶村舍焦墙", pal: CN, w: 8.5, d: 6, damage: [.45, .6, .4, .5], burnt: true, roofLoss: .8, door: "missing", windows: 2, winKind: "empty", weeds: .3 })),
  ruin("斜撑支木歪斜欲倒旧屋", "影视破败：整栋屋子被地基沉降拉得歪斜，山墙外用几根粗木斜撑顶着，屋面下垂、窗扇脱落，一副随时会倒的样子", "中式", "老旧", () => {
    const base = shearParts(ruinHouse({ seed: "斜撑支木歪斜欲倒旧屋", pal: CN, w: 7, d: 5.5, hs: 3, damage: .12, roofLoss: .15, sag: .3, door: "ajar", windows: 2, winKind: ["lattice", "shutter"] }), .1);
    return withProps(base, CN, "斜撑支木歪斜欲倒旧屋p", (b, rng) => {
      for (const z of [-1.7, -.1, 1.5]) { b.beam("wood", [5.4, .05, z], [3.85, 2.9 - z * .05, z], .2, .22); b.tbox("rubbleS", [5.5, .2, z], [.8, .4, .6], 20 + z * 10, 0, 0); }
      b.beam("wood", [5.0, 1.45, -1.7], [5.0, 1.5, 1.5], .12, .14);
      b.weeds(rng, 5, 0, 1.4, 3, 10, 0);
    });
  }),
  ruin("漏顶破庙正殿佛台", "影视破败：红墙褪色的庙宇正殿塌了半边顶，殿内圆柱歪斜折断，佛台上泥塑佛身残缺、佛头滚落在地，幡布破烂、香炉倾倒", "中式", "破损",
    house({ seed: "漏顶破庙正殿佛台", pal: CN_RED, w: 13, d: 9.5, hs: 4.6, thick: .55, found: .5, damage: [.2, .4, .3, .45], roofLoss: .5, rise: 2.8, overhang: .9, door: "missing", doorW: 2.4, doorH: 3.4, win: { w: .9, h: 1.7, sill: 1.5 }, windows: 2, winKind: "lattice", weeds: .8 }, (b, rng, ctx) => {
      b.group("red", "褪色红漆柱", "#8a3a2e", { roughness: .9 }).group("clay", "残损泥塑", "#b09a70", { roughness: 1 }).group("gold", "剥落贴金", "#b99a4a", { roughness: .6, metalness: .3 });
      const y = ctx.found + .02;
      [[-3.4, -1.2], [3.4, -1.2], [-3.4, 2.4], [3.4, 2.4]].forEach(([x, z], i) => i === 3 ? pillar(b, "red", x!, z!, y, y + 1.5, .3, { lean: [.4, .25] }) : pillar(b, "red", x!, z!, y, y + 4.3, .3));
      b.beam("red", [2.6, y + .3, 3.6], [5.0, y + .32, 1.4], .55, .55);
      b.box("stone", 0, y + .35, -3.2, 4.8, .7, 2.5);
      b.box("clay", 0, y + 1.45, -3.2, 2, 1.5, 1.3); b.box("clay", -1.15, y + 1.3, -2.95, .55, 1.2, .7); b.tbox("clay", [1.35, y + .95, -2.2], [.5, 1.1, .6], 0, 70, 0);
      b.sphere("clay", [1.9, y + .45, -.7], .45);
      pillar(b, "stone", .5, -.4, y, y + .75, .42); pillar(b, "stone", -1.6, 1.2, y, y + .35, .42, { lean: [.3, .1] });
      for (let k = 0; k < 7; k++) b.patch(rng.pick(["gold", "red", "red"]), rng, ctx.frames[1]!, -1, -ctx.t / 2, rng.range(-3.5, 3.5), y + rng.range(1, 3.4), rng.range(.3, .9), rng.range(.3, .9));
      banner(b, rng, -4.9, y, -3.9, 4.0); banner(b, rng, 4.8, y, -3.9, 3.6);
    })),
  ruin("残破山门断碑", "影视破败：寺院山门只剩一道厚墙和三个拱门，屋顶残存几垄瓦，大门歪挂，门前石阶残缺、石碑断倒、石狮倾覆", "中式", "破损", () => {
    const b = ruinBuilder(CN_RED), rng = new Rng("残破山门断碑"), f: Frame = { x: 0, z: 0, yaw: 0 };
    b.box("stone", 0, .3, 0, 15.4, .6, 3.4);
    const holes: Hole[] = [{ u: 0, w: 3.4, y0: .6, y1: 5.2, kind: "door", arch: "round" }, { u: -5.3, w: 1.3, y0: .6, y1: 3.1, kind: "door", arch: "round" }, { u: 5.3, w: 1.3, y0: .6, y1: 3.1, kind: "door", arch: "round" }];
    b.wallRun(rng, f, -7.3, 7.3, .6, 6.6, 1.2, holes, { damage: .5, keys: wall3, lintels: .9, floor: 1 });
    doorDecor(b, rng, f, 0, holes[0]!, "hanging", "wood"); doorDecor(b, rng, f, 0, holes[1]!, "closed", "wood");
    for (const side of [-1, 1]) b.slope(rng, [[-7.9, 6.85, side * 1.9], [7.9, 6.85, side * 1.9], [7.9, 8.6, 0], [-7.9, 8.6, 0]], { cell: .85, keys: ["tile", "tile", "tileD", "tileM"], gone: p => (p[0] - 2.5) ** 2 + p[2] ** 2 < 14 || (p[0] < -5.4 && side < 0), hole: .12, rafters: { key: "wood" }, purlin: "wood" });
    stairs(b, rng, "stone", 0, 3.7, 0, 4.2, 6, .1, .4, 0);
    stele(b, rng, 5.8, 3.9, 0, 15);
    b.box("stone", -3.3, .5, 3.3, .9, 1, .8); b.sphere("stone", [-3.3, 1.25, 3.3], .42); b.tbox("stone", [3.3, .4, 3.0], [.9, .8, .8], 30, 0, 80); b.sphere("stone", [4.1, .4, 3.4], .4);
    b.weeds(rng, 0, 3, 8, 4, 40, 0); b.heap(rng, -7, 2.5, 0, 1.4, .7); b.bush("leaf", rng, 6.7, .6, -.5, .5);
    return b.parts();
  }),
  ruin("荒废驿站院落", "影视破败：驿站的院墙塌了几段，正厅半边屋顶漏光，西廊房破败、东马厩茅顶已塌，院里有枯井、断栅栏和翻倒的木箱", "中式", "废弃", () => {
    const hall = ruinHouse({ seed: "驿站正厅", pal: CN, w: 8.6, d: 5.4, damage: [.3, .5, .4, .35], roofLoss: .5, door: "hanging", windows: 3, winKind: ["lattice", "boarded"], weeds: .3, rubble: .4 });
    const west = ruinHouse({ seed: "驿站西廊房", pal: CN, w: 8.5, d: 4.4, hs: 2.9, damage: [.25, .6, .5, .3], roofLoss: .6, door: "missing", windows: 2, winKind: ["boarded", "empty"], weeds: .3 });
    const east = ruinHouse({ seed: "驿站东马厩", pal: CN, w: 8.5, d: 4.4, hs: 2.9, damage: [.5, .5, .4, .3], roofLoss: .85, thatch: true, door: "gap", windows: 1, winKind: "empty", weeds: .3 });
    const base = [...placeParts(hall, 0, 0, -4.4, 0), ...placeParts(west, -7, 0, .2, 90), ...placeParts(east, 7, 0, .2, 270)];
    return withProps(base, CN, "驿站院", (b, rng) => {
      const keys = wall3;
      freeWall(b, rng, [-9.8, 7.2], [9.8, 7.2], .3, 3.2, .45, .55, keys, [{ u: 0, w: 3.2, y0: .3, y1: 3.0, kind: "door" }]);
      freeWall(b, rng, [-9.8, 7.2], [-9.8, 4.6], .3, 3.2, .45, .6, keys); freeWall(b, rng, [9.8, 7.2], [9.8, 4.6], .3, 3.2, .45, .6, keys);
      well(b, rng, 1.2, 1.4, 0, .7); fence(b, rng, [3, 3.6], [8.2, 3.6], 0, 1.1, 1.0); crates(b, rng, -2.5, 2.6, 0, 4);
 b.weeds(rng, 0, 2, 9, 5, 30, 0);
    });
  }),
  ruin("坍塌城楼残台", "影视破败：边城城楼的石砌厚台只剩两道拱门，垛口参差缺失，台顶楼阁坍成几堵残墙，台脚堆满崩落的砖石", "中式", "破损", () => {
    const b = ruinBuilder(CN), rng = new Rng("坍塌城楼残台"), t = 2.2, W = 18, D = 9.5, H = 7.4, keys = ["wallB", "wall", "stone"];
    const fr: Frame[] = [{ x: 0, z: D / 2 - t / 2, yaw: 0 }, { x: 0, z: -(D / 2 - t / 2), yaw: 180 }, { x: -(W / 2 - t / 2), z: 0, yaw: 270 }, { x: W / 2 - t / 2, z: 0, yaw: 90 }];
    const arch: Hole = { u: 0, w: 4.4, y0: 0, y1: 5.6, kind: "door", arch: "round" };
    const tops = [b.wallRun(rng, fr[0]!, -W / 2, W / 2, 0, H, t, [arch], { damage: .3, keys, floor: 2 }), b.wallRun(rng, fr[1]!, -W / 2, W / 2, 0, H, t, [arch], { damage: .42, keys, floor: 2 })];
    b.wallRun(rng, fr[2]!, -(D / 2 - t), D / 2 - t, 0, H, t, [], { damage: .3, keys, floor: 2 }); b.wallRun(rng, fr[3]!, -(D / 2 - t), D / 2 - t, 0, H, t, [], { damage: .5, keys, floor: 2 });
    b.box("stone", 0, .08, 0, W - 2 * t, .16, D - 2 * t);
    b.floorGrid(rng, "wallC", "wood", -W / 2 + t, -D / 2 + t, W / 2 - t, D / 2 - t, H, { cell: 1.5, missing: .42, thick: .3 });
    for (const [sign, top] of [[1, tops[0]!], [-1, tops[1]!]] as const) for (let u = -W / 2 + .6; u < W / 2 - .5; u += 1.75) if (top(u * sign) > H - .35 && !rng.chance(.28)) b.box("wallB", u, H + .55, sign * (D / 2 - .3), 1.0, 1.1, .6);
    for (const k of [-1, 1]) b.heap(rng, k * 6.5, D / 2 + 1.6, 0, 2.2, 1.2); b.heap(rng, 0, -D / 2 - 2, 0, 2.4, 1.1); b.weeds(rng, 0, 0, W / 2 + 2, D / 2 + 2, 24, 0);
    const upper = ruinHouse({ seed: "城楼上层", pal: CN, w: 11.5, d: 5.6, found: .15, hs: 4, thick: .45, damage: [.5, .7, .6, .75], roofLoss: .8, door: "missing", windows: 3, winKind: ["lattice", "empty"], elevated: true, moss: .3, weeds: .4, rubble: .4 });
    return [...b.parts(), ...placeParts(upper, 0, H, 0, 0)];
  }),
  ruin("荒废祠堂石柱前廊", "影视破败：宗祠前廊的石柱歪倒两根，梁枋塌落，正堂屋面漏光，供桌上的牌位散落一地，屋里结满蛛网灰尘", "中式", "废弃",
    house({ seed: "荒废祠堂石柱前廊", pal: CN, w: 12, d: 8, hs: 4.2, found: .5, damage: [.2, .45, .35, .3], roofLoss: .35, rise: 2.4, overhang: .9, doorW: 2, doorH: 3, door: "ajar", windows: 2, winKind: "lattice" }, (b, rng, ctx) => {
      const y = ctx.found;
      for (const x of [-4.5, -1.5, 1.5, 4.5]) {
        b.box("stone", x, y + .15, 5.6, .8, .3, .8);
        if (rng.chance(.85)) pillar(b, "stone", x, 5.6, y + .3, y + 3.9, .28, rng.chance(.3) ? { lean: [rng.range(-.35, .35), rng.range(-.35, .35)] } : {});
        else b.beam("stone", [x - .3, y + .5, 6.8], [x + 1.6, y + .5, 5.2], .55, .55);
      }
      b.beam("wood", [-4.5, y + 3.95, 5.6], [-1.5, y + 3.9, 5.6], .3, .34); b.beam("wood", [1.5, y + 3.95, 5.6], [4.5, y + 3.95, 5.6], .3, .34);
      b.box("wood", 0, y + .6, -2.9, 3.6, 1.1, .9);
      for (let k = 0; k < 7; k++) { const x = -1.5 + k * .5; if (rng.chance(.7)) b.box("woodD", x, y + 1.6, -2.95, .22, .8, .1); else b.tbox("woodD", [x, y + .15, -2.2 + rng.range(-.6, .6)], [.22, .8, .1], rng.range(0, 90), 88, 0); }
      freeWall(b, rng, [-2.8, 9.8], [2.8, 9.8], .3, 3.4, .45, .55, wall3);
      b.weeds(rng, 0, 7, 4, 1.5, 10, 0);
    })),
  ruin("废弃磨坊水碓棚", "影视破败：木柱撑起的磨坊棚屋，屋面塌了大半、梁柱歪斜，棚下石磨裂开，干涸的石砌水槽边横着半截破碎的木水轮", "中式", "废弃", () => {
    const b = ruinBuilder(CN), rng = new Rng("废弃磨坊水碓棚");
 b.box("stone", 0, .15, 0, 6.6, .3, 5);
    ([[-3, -2.1], [3, -2.1], [-3, 2.1], [0, -2.1], [0, 2.1], [3, 2.1]] as [number, number][]).forEach(([x, z], i) => { if (i === 5) return; b.beam("wood", [x, .3, z], [x + (i === 1 ? .45 : 0), 3.3, z], .26, .26); });
    for (const side of [-1, 1]) b.slope(rng, [[-3.7, 2.7, side * 3.1], [3.7, 2.7, side * 3.1], [3.7, 4.4, 0], [-3.7, 4.4, 0]], { cell: .85, keys: ["tile", "tile", "tileD", "tileM"], gone: p => (p[0] - side * 1.2) ** 2 + (p[2] - side * 1.0) ** 2 < 6.2 || (p[0] < -2.4 && side < 0), hole: .12, rafters: { key: "wood" }, purlin: "wood", jitter: .05 });
    b.beam("wood", [-3.7, 4.3, 0], [.8, 3.9, 0], .2, .22); b.beam("wood", [-3, 3.3, -2.1], [-3, 3.3, 2.1], .22, .24);
    b.box("stone", 0, .45, 3.1, 8, .9, .5); b.box("stone", 0, .45, 4.7, 8, .9, .5); b.box("rubbleS", 0, .1, 3.9, 8, .2, 1.1);
    pillar(b, "stone", -1, -.2, .3, .7, .85, { sides: 12 }); pillar(b, "stone", -1.2, -.1, .7, 1.05, .8, { sides: 12, lean: [.3, .12] });
    wheel(b, 4.9, 2.3, 3.9, 2.1, 1.0, 2.5);
    b.heap(rng, -4.4, 0, 0, 1.6, .8); b.weeds(rng, 0, 1, 6, 4, 26, 0); crates(b, rng, -2.2, 1.2, .3, 3, 1);
    return b.parts();
  }),
  ruin("破败茶酒肆挑廊招牌楼", "影视破败：临街两层的旧酒肆，挑廊塌了一半、栏杆断续，褪色的酒招和破旗垂在门前，二层窗扇歪斜，屋面漏瓦", "中式", "老旧",
    house({ seed: "破败茶酒肆挑廊招牌楼", pal: CN, w: 11, d: 7.6, storeys: 2, hs: 3.1, found: .4, thick: .38, damage: [.15, .35, .3, .25], roofLoss: .35, overhang: .8, door: "ajar", doorW: 2.2, doorH: 2.7, windows: 3, win: { w: 1.1, h: 1.4, sill: .9 }, winKind: ["lattice", "boarded", "shutter"], weeds: .4, vines: .8 }, (b, rng, ctx) => {
      const yb = ctx.found + 3.1;
      b.floorGrid(rng, "wood", "woodD", -4.6, 3.8, 4.6, 5.0, yb, { cell: 1.1, missing: .35, thick: .14 });
      for (let x = -4.6; x <= 4.6; x += .55) if (rng.chance(.55)) b.beam("wood", [x, yb, 4.95], [x + rng.range(-.04, .04), yb + 1.0, 4.95], .07, .07);
      b.beam("wood", [-4.6, yb + 1.0, 4.95], [1.5, yb + .98, 4.95], .09, .1);
      for (const x of [-4.4, 0, 4.4]) if (!rng.chance(.2)) b.beam("wood", [x, ctx.found, 4.9], [x + rng.range(-.1, .1), yb, 4.9], .24, .24);
      signBoard(b, rng, 5.0, ctx.found + 2.9, 3.9, 0, 1.8, .6, "wood", 6); banner(b, rng, -5.5, ctx.found, 4.6, 4.2); crates(b, rng, 3.2, 5.2, 0, 4);
    })),
  ruin("荒废古塔残身", "影视破败：八角砖塔的塔顶已塌，各层塔壁一边残缺，腰檐碎落，砖缝里长满灌木杂草，塔脚散着崩落的塔砖", "中式", "废弃", () => {
    const b = ruinBuilder(CN), rng = new Rng("荒废古塔残身");
    pillar(b, "stone", 0, 0, 0, .9, 6.4, { sides: 8 });
    let y = .9, r = 4.1;
    for (let tier = 0; tier < 5; tier++) {
      const H = 3.1 - tier * .15, base = y;
      b.ringWall(rng, 0, 0, r, y, H, .55, 8, { damage: tier === 4 ? .8 : .06 + tier * .15, keys: wall3, ...(tier > 1 ? { breach: { angle: 30 + tier * 30, width: 90 } } : {}), holes: (k) => k === 0 && tier === 0 ? [{ u: 0, w: 1.5, y0: base, y1: base + 2.5, kind: "door" as const, arch: "round" as const }] : tier > 0 && k % 2 === 0 ? [{ u: 0, w: .7, y0: base + 1, y1: base + 2.2, kind: "window" as const }] : [] });
      y += H; eaves(b, rng, r * .94, r + 1.15, y, tier * .1 + .1); r *= .9;
    }
    pillar(b, "stone", 0, 0, y, y + 1.2, .3, { lean: [.5, .1] });
    for (let k = 0; k < 5; k++) { const a = rng.range(0, Math.PI * 2); b.heap(rng, Math.cos(a) * 6.6, Math.sin(a) * 6.6, 0, rng.range(.7, 1.4), rng.range(.3, .7)); }
    b.weeds(rng, 0, 0, 7, 7, 30, .05); b.bush("leaf", rng, 5, .9, 2, .7); b.bush("leaf", rng, -4, .9, -4, .6);
    return b.parts();
  }),
  ruin("废弃黄土窑洞崖面", "影视破败：靠着黄土崖开凿的三孔窑洞，窑脸土墙开裂剥落、拱洞门窗朽烂，崖顶塌下一片黄土，窑前长满蒿草", "中式", "废弃", () => {
    const b = ruinBuilder(LOESS), rng = new Rng("废弃黄土窑洞崖面"), f: Frame = { x: 0, z: 0, yaw: 0 };
    b.group("loess", "黄土崖体", "#b3925f", { roughness: 1 }).group("loessD", "黄土崖体", "#9c7d4f", { roughness: 1 });
    b.heap(rng, 0, -8.8, 0, 10.4, 7, ["rubbleS", "dirt"], 14, "loess"); b.heap(rng, -7, -7, 0, 7.5, 5.2, ["rubbleS"], 6, "loessD"); b.heap(rng, 7.5, -7.6, 0, 7.2, 4.6, ["rubbleS"], 6, "loess");
    const holes: Hole[] = [{ u: -4.4, w: 1.5, y0: 1.1, y1: 2.9, kind: "window", arch: "round" }, { u: 0, w: 1.7, y0: 0, y1: 3.0, kind: "door", arch: "round" }, { u: 4.4, w: 1.5, y0: 1.1, y1: 2.9, kind: "window", arch: "round" }];
    b.wallRun(rng, f, -7, 7, 0, 3.9, 1.1, holes, { damage: .28, keys: wall3, lintels: .9 });
    doorDecor(b, rng, f, 0, holes[1]!, "ajar", "wood");
    b.heap(rng, 3.5, 1.8, 0, 1.6, 1); b.heap(rng, -5.5, 2.6, 0, 1.2, .6); fence(b, rng, [-6, 5.5], [6, 5.5], 0, 1.0, 1.2); b.weeds(rng, 0, 3, 8, 3.5, 36, 0);
    for (let k = 0; k < 4; k++) b.beam("wood", [-6 + k * 1.6, 3.9, -.4], [-6 + k * 1.6 + 1.1, 3.9 + rng.range(.1, .4), -2.2], .1, .1);
    return b.parts();
  }),
  ruin("破败戏台飞檐残幕", "影视破败：乡间戏台的台面木板缺了几块，立柱歪斜、屋面塌了一角，后台墙上残留褪色的彩绘，破烂的幕布挂在台口", "中式", "老旧", () => {
    const b = ruinBuilder(CN_RED), rng = new Rng("破败戏台飞檐残幕"), y = 1.5;
    b.group("red", "褪色红漆柱", "#8a3a2e", { roughness: .9 }).group("blue", "褪色蓝彩", "#476a86", { roughness: .95 }).group("gold", "剥落贴金", "#b99a4a", { roughness: .6, metalness: .3 });
 b.box("stone", 0, y / 2, 0, 10.4, y, 8.4);
    b.floorGrid(rng, "wood", "woodD", -4.8, -3.8, 4.8, 3.8, y + .05, { cell: 1.0, missing: .22, thick: .1 });
    ([[-4.5, 3.7], [4.5, 3.7], [-1.6, 3.7], [1.6, 3.7], [-4.5, -3.7], [4.5, -3.7]] as [number, number][]).forEach(([x, z], i) => pillar(b, "red", x, z, y, y + (i === 1 ? 2.2 : 4.6), .27, i === 1 ? { lean: [.35, .1] } : i === 2 ? { lean: [.15, .2] } : {}));
    const f: Frame = { x: 0, z: -4, yaw: 180 };
    const top = b.wallRun(rng, f, -4.9, 4.9, y, 5.2, .5, [{ u: -2, w: 1.3, y0: y, y1: y + 2.5, kind: "door" }, { u: 2, w: 1.3, y0: y, y1: y + 2.5, kind: "door" }], { damage: .35, keys: wall3, lintels: .8 });
    for (let k = 0; k < 9; k++) { const u = rng.range(-4.2, 4.2), yy = y + rng.range(2.6, 4.6); if (yy < top(u) - .3) b.patch(rng.pick(["red", "blue", "gold"]), rng, f, -1, -.25, u, yy, rng.range(.4, 1.1), rng.range(.4, 1.1)); }
    for (const side of [-1, 1]) b.slope(rng, [[-5.6, y + 5.1, side * 4.9], [5.6, y + 5.1, side * 4.9], [5.6, y + 6.7, 0], [-5.6, y + 6.7, 0]], { cell: .85, keys: ["tile", "tile", "tileD", "tileM"], gone: p => (p[0] - 2.8) ** 2 + (p[2] - side * 2) ** 2 < 5.5, hole: .1, rafters: { key: "wood" }, purlin: "wood" });
    for (let k = 0; k < 4; k++) b.beam("wood", [-4.5, y + 4.7, 3.7], [-4.5 + k * .4, y + 4.7 - k * .05, 3.7], .2, .2);
    banner(b, rng, -3.2, y, 3.6, 4.4); banner(b, rng, 3.4, y, 3.6, 3.8);
    stairs(b, rng, "stone", 0, 6.2, 0, 3.2, 4, .375, .45, 0);
    crates(b, rng, 5.8, 4.8, 0, 3); b.weeds(rng, 0, 4.5, 8, 4, 22, 0); b.heap(rng, -5.6, 5.6, 0, 1.2, .6);
    return b.parts();
  }),
  ruin("荒废宅院门楼残垣", "影视破败：大宅的门楼塌了一角，两扇朱漆大门一扇脱落，门墩石倾斜，两翼院墙断成几截，门前石阶长满青苔", "中式", "废弃", () => {
    const base = ruinHouse({ seed: "荒废宅院门楼残垣", pal: CN, w: 6.4, d: 3.8, hs: 3.8, found: .45, damage: [.25, .35, .4, .5], roofLoss: .5, rise: 1.6, overhang: .9, doorW: 2.2, doorH: 3.0, door: "hanging", windows: 0, weeds: .5 });
    return withProps(base, CN, "荒废宅院门楼p", (b, rng) => {
      freeWall(b, rng, [-3.2, 1.7], [-10.5, 1.7], .45, 3.1, .5, .6, wall3); freeWall(b, rng, [3.2, 1.7], [10.5, 1.7], .45, 3.1, .5, .75, wall3);
      b.box("stone", -1.7, .8, 2.3, .8, .7, .5); b.tbox("stone", [1.9, .45, 2.5], [.8, .7, .5], 20, 0, 70); stairs(b, rng, "stone", 0, 3.5, 0, 2.8, 3, .15, .4, 0);
      b.tbox("woodD", [-2.5, .06, 4.4], [2.2, .1, .8], 12, 0, 0);
      b.weeds(rng, 0, 3, 8, 2.5, 22, 0); b.bush("leaf", rng, -6.5, 0, 2.6, .5); tree(b, rng, 7.5, 3.2, 5.5, { dead: true });
    });
  }),
  ruin("沿街老旧破铺面板窗旧招", "影视破败：临街的两层旧铺面，木板门窗发黑翘裂，褪色的大招牌斜挂，屋面瓦片残缺长草，墙面泛碱污渍，一派没落街景", "中式", "老旧",
    house({ seed: "沿街老旧破铺面板窗旧招", pal: CN, w: 12, d: 8, storeys: 2, hs: 3.3, found: .3, damage: .06, roofLoss: .12, sag: .1, door: "closed", doorsAt: [-3, 3], doorW: 2.1, doorH: 2.7, windows: 4, win: { w: 1.1, h: 1.3, sill: 1 }, winKind: ["lattice", "boarded", "shutter"], patches: 9, moss: .3, vines: .3, rubble: .15, weeds: .3 }, (b, rng, ctx) => {
      signBoard(b, rng, 0, ctx.found + 3.0, 4.1, 0, 4.2, .9, "wood", 5); signBoard(b, rng, 5.9, ctx.found + 5.0, 4.0, 0, 1.0, .5, "woodD", -8);
      crates(b, rng, -4.5, 4.9, 0, 3, .9); crates(b, rng, 4.8, 4.7, 0, 2, .7); banner(b, rng, -6.6, 0, 4.4, 4.4);
    })),
  ruin("坍塌木构吊脚楼残架", "影视破败：依坡而建的吊脚楼，楼板塌出大洞、立柱歪斜折断，板壁只剩几片，屋面塌了一半，木梯断了几级", "中式", "破损", () => {
    const b = ruinBuilder(CN), rng = new Rng("坍塌木构吊脚楼残架");
    b.heap(rng, 0, -4.5, 0, 10, 3.6, ["rubbleS", "dirt", "rubble"], 22);
    const yf = 3.6;
    for (const x of [-4.2, 0, 4.2]) for (const z of [-3.2, 0, 3.2]) { if (rng.chance(.12)) continue; const h = yf - Math.max(0, 1.8 - (z + 3.2) * .3); b.beam("wood", [x, yf - h, z], [x + rng.range(-.2, .2), yf, z + rng.range(-.1, .1)], .3, .3); }
    b.floorGrid(rng, "wood", "woodD", -5, -3.9, 5, 3.9, yf, { cell: 1.0, missing: .3, thick: .14, gone: (x, z) => (x - 1.6) ** 2 + (z - 1) ** 2 < 3.5 });
    const fb: Frame = { x: 0, z: -3.9, yaw: 180 }, fl: Frame = { x: -5, z: 0, yaw: 270 }, fr: Frame = { x: 5, z: 0, yaw: 90 };
    b.wallRun(rng, fb, -5, 5, yf, 2.9, .14, [{ u: 1.2, w: 1.1, y0: yf + .9, y1: yf + 2.1, kind: "window" }], { damage: .5, keys: ["wood", "woodD"] });
    b.wallRun(rng, fl, -3.8, 3.8, yf, 2.9, .14, [], { damage: .7, keys: ["wood", "woodD"] }); b.wallRun(rng, fr, -3.8, 3.8, yf, 2.9, .14, [{ u: -1, w: 1, y0: yf + 1, y1: yf + 2.2, kind: "window" }], { damage: .55, keys: ["wood", "woodD"] });
    for (const side of [-1, 1]) b.slope(rng, [[-5.6, yf + 2.7, side * 4.6], [5.6, yf + 2.7, side * 4.6], [5.6, yf + 4.4, 0], [-5.6, yf + 4.4, 0]], { cell: .85, keys: ["tile", "tile", "tileD", "tileM"], gone: p => (p[0] + 1.5 * side) ** 2 + (p[2] - side * 1.8) ** 2 < 8.5 || (p[0] > 3 && side > 0), hole: .12, rafters: { key: "wood" }, purlin: "wood" });
    for (let k = 0; k < 8; k++) { if (rng.chance(.3)) continue; b.box("wood", 5.9 + k * .18, .3 + k * .42, 4.2 - k * .15, 1, .12, .3); }
    b.beam("wood", [5.8, .2, 4.4], [7.8, 3.5, 3.0], .1, .1); b.beam("wood", [6.4, .2, 4.6], [8.2, 3.5, 3.2], .1, .1);
    b.weeds(rng, 0, 3, 8, 6, 26, 0); b.heap(rng, 2.5, 1.2, yf - .1, 1.5, .5);
    return b.parts();
  }),
];
