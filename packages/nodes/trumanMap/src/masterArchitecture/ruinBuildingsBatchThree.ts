import type { ModelPart } from "../assetModelParts";
import { DEG } from "./partMath";
import { ruinHouse } from "./ruinHouse";
import { placeParts, rotateParts, Rng, ruinBuilder, shearParts, type Frame, type Hole, type P } from "./ruinKit";
import { chimney, crates, fence, freeWall, pillar, sandbags, stairs, tree, well } from "./ruinProps";
import { CONCRETE, EURO, SAND, WASTE, house, ruin, withProps } from "./ruinCommon";
import type { ArchitecturePrototype } from "./structures";
// 影视破败建筑·欧式奇幻与废土战损：无顶哥特教堂、荒废庄园、倾颓城堡塔、谷仓、闹鬼老宅、残翼风车、回廊拱券、废弃灯塔；
// 战损砖房、铁皮棚屋、坍塌碉堡、哨塔、半塌集装箱屋、沙埋土屋、被洗劫的商店、废弃据点。
const wall3 = ["wall", "wallB", "wallC"];
/** 多边形塔身第 k 面的局部坐标系（与 ringWall 一致），用来在塔外壁上贴藤蔓。 */
const ringFrame = (cx: number, cz: number, r: number, thick: number, segs: number, k: number): Frame => {
  const psi = 360 * (k + .5) / segs, mid = r * Math.cos(Math.PI / segs) - thick / 2;
  return { x: cx + Math.sin(psi * DEG) * mid, z: cz + Math.cos(psi * DEG) * mid, yaw: psi };
};
/** 一个集装箱（长 6.1、宽 2.44、高 2.6）：波纹壁、顶板、地板、后壁和一扇开着一扇歪挂的门，锈斑和凹痕随机。 */
function container(seed: string, color: string): ModelPart[] {
  const b = ruinBuilder(WASTE), rng = new Rng(seed);
  b.group("ctn", "集装箱钢板", color, { roughness: .6, metalness: .45 });
  b.box("woodD", 0, .08, 0, 6.1, .16, 2.44); b.box("ctn", 0, 2.55, 0, 6.1, .1, 2.44); b.box("ctn", -3.0, 1.3, 0, .1, 2.5, 2.44);
  for (const s of [-1, 1]) {
    b.box("ctn", 0, 1.3, s * 1.2, 6.1, 2.5, .05);
    for (let i = 0; i < 20; i++) if (!rng.chance(.06)) b.box("ctn", -2.9 + i * .3, 1.3, s * 1.245, .13, 2.5, .05);
    b.patch("rust", rng, { x: 0, z: s * 1.27, yaw: s > 0 ? 0 : 180 }, 1, 0, rng.range(-2, 2), rng.range(.6, 2), rng.range(.6, 1.6), rng.range(.4, .9), .01, 6);
  }
  b.tbox("ctn", [3.4, 1.3, 1.9], [1.2, 2.45, .05], 100, 0, 0); b.tbox("ctn", [3.1, 1.2, -1.35], [1.2, 2.45, .05], 20, 0, 6);
  b.tbox("rust", [rng.range(-1, 1), 2.62, rng.range(-.5, .5)], [1.6, .05, 1.2], rng.range(0, 90), 3, 3);
  return b.parts();
}
export const ruinBuildingThreeDesigns: ArchitecturePrototype[] = [
  ruin("废弃哥特教堂残身尖拱窗", "影视破败：屋顶早已不存的哥特式教堂，两道侧墙开着尖拱高窗、窗棂残断，西立面一扇尖拱门和残破玫瑰窗位，西塔只剩半截，墓碑歪斜、枯树横出", "欧式", "废弃", () => {
    const nave = ruinHouse({ seed: "教堂中殿", pal: EURO, w: 9, d: 24, hs: 11, found: .4, thick: .8, damage: [.3, .5, .3, .45], roof: "none", doorArch: "pointed", door: "missing", doorW: 2.6, doorH: 5.4, winArch: "pointed", win: { w: 1.5, h: 5.2, sill: 3.4 }, windowsPerWall: [0, 1, 5, 5], moss: .6, vines: .8, weeds: 1, rubble: 1, patches: 6 }, (b, rng, ctx) => {
      if (ctx.tops[0]!(0) > ctx.found + 10.2) {
        for (let k = 0; k < 12; k++) { const a0 = k / 12 * Math.PI * 2, a1 = (k + 1) / 12 * Math.PI * 2; if (rng.chance(.15)) continue; b.beam("stone", [Math.cos(a0) * 1.5, ctx.found + 8.9 + Math.sin(a0) * 1.5, 12.1], [Math.cos(a1) * 1.5, ctx.found + 8.9 + Math.sin(a1) * 1.5, 12.1], .14, .14); }
        b.patch("soot", rng, ctx.frames[0]!, 1, ctx.t / 2, 0, 8.9, 2.6, 2.6, .02, 12);
      }
      for (let k = 0; k < 5; k++) for (const s of [-1, 1]) { const z = -9 + k * 4.5; if (rng.chance(.8)) b.box("stone", s * 5.1, 3 + rng.range(0, 2), z, .9, 6 + rng.range(-.5, 2), .8); }
      b.box("stone", 0, .9, -10.8, 2.4, 1, 1.2);
    });
    const tower = ruinHouse({ seed: "教堂西塔", pal: EURO, w: 5.4, d: 5.4, hs: 9, found: .4, thick: .8, damage: [.45, .55, .6, .5], roof: "none", door: "gap", windowsPerWall: [1, 1, 1, 1], winArch: "pointed", win: { w: .7, h: 2.2, sill: 3 }, moss: .5, vines: .8, weeds: .4 });
    return withProps([...nave, ...placeParts(tower, -7.2, 0, 9.3, 0)], EURO, "废弃哥特教堂p", (b, rng) => {
      for (let k = 0; k < 7; k++) { const x = rng.range(-9, 9), z = rng.range(15, 22); b.tbox("stone", [x, .5, z], [.6, 1, .16], rng.range(-30, 30), rng.range(-12, 12), rng.range(-14, 14)); b.tbox("stone", [x, .85, z], [.5, .16, .12], rng.range(-30, 30), 0, rng.range(-14, 14)); }
      tree(b, rng, 8.5, 17, 7, { dead: true }); b.weeds(rng, 0, 15, 14, 9, 30, 0);
    });
  }),
  ruin("荒废庄园主宅常春藤烟囱", "影视破败：荒废多年的乡间庄园大宅，常春藤爬满石墙，百叶窗掉落、木板钉窗，两根高烟囱歪斜，屋面塌了一块，门前台阶和铁栏杆锈蚀", "欧式", "废弃",
    house({ seed: "荒废庄园主宅常春藤烟囱", pal: EURO, w: 18, d: 11, storeys: 2, hs: 3.8, found: .6, thick: .5, damage: [.15, .3, .3, .25], roof: "hip", roofLoss: .35, rise: 3, overhang: .6, door: "ajar", doorW: 2.4, doorH: 3.2, windows: 5, win: { w: 1.2, h: 2, sill: .9 }, winKind: ["shutter", "boarded", "glass"], vines: 1, moss: .6, weeds: 1.1, patches: 7 }, (b, rng, ctx) => {
      for (const x of [-6.6, 6.6]) chimney(b, rng, x, 0, ctx.found + .02, 11.4, 1.3, "wallB");
      stairs(b, rng, "stone", 0, 8.4, 0, 3.8, 4, .15, .4, ctx.found - .45);
      fence(b, rng, [-9.5, 11.5], [9.5, 11.5], 0, 1.3, 1.0, "metal"); b.tbox("metal", [3, .5, 12.5], [1.6, 1, .08], 20, 0, 70);
      tree(b, rng, -11, 7, 9); tree(b, rng, 11.5, 8.5, 7, { dead: true });
    })),
  ruin("倾颓城堡塔楼垛口缺口", "影视破败：中世纪城堡的圆塔，一侧塔壁崩塌露出内部木楼板残件，箭窗黑洞洞，垛口缺了大半，塔脚堆着崩落的石块，常春藤垂挂", "奇幻", "破损", () => {
    const b = ruinBuilder(EURO), rng = new Rng("倾颓城堡塔楼垛口缺口"), segs = 10, r = 3.8, th = 1.0, H = 14;
    const tops = b.ringWall(rng, 0, 0, r, .3, H, th, segs, { damage: .32, keys: ["wall", "wallB", "stone"], breach: { angle: 60, width: 110 }, holes: (k) => k === 0 ? [{ u: 0, w: 1.4, y0: .3, y1: 2.9, kind: "door", arch: "pointed" }] : k % 2 ? [{ u: 0, w: .45, y0: 4 + (k % 3) * 2.5, y1: 5.6 + (k % 3) * 2.5, kind: "window" }] : [] });
    for (const y of [5.2, 9.4]) b.floorGrid(rng, "wood", "woodD", -2.4, -2.4, 2.4, 2.4, y, { cell: 1.2, missing: .3, thick: .16, gone: (x, z) => x * x + z * z > 6.2 || (x > 0 && z > 0) });
    // 垛口：只立在塔顶还完好的墙段上
    for (let k = 0; k < 24; k++) {
      const psi = (k + .5) / 24 * 360, seg = Math.floor(psi / (360 / segs)) % segs, u = Math.tan((psi - 360 * (seg + .5) / segs) * DEG) * r * Math.cos(Math.PI / segs);
      if (tops[seg]!(u) > .3 + H - .4 && !rng.chance(.2)) b.tbox("stone", [Math.sin(psi * DEG) * (r - .5), .3 + H + .5, Math.cos(psi * DEG) * (r - .5)], [.9, 1.0, .5], psi, 0, 0);
    }
    for (const k of [2, 4, 6, 8]) b.vine(rng, ringFrame(0, 0, r, th, segs, k), 1, th / 2, rng.range(-.6, .6), .3, 8);
    b.heap(rng, Math.sin(60 * DEG) * 5, Math.cos(60 * DEG) * 5, 0, 2.6, 1.6, ["rubble", "rubbleS", "stone"], 34); b.weeds(rng, 0, 0, 7, 7, 26, .03);
    return b.parts();
  }),
  ruin("荒废农场谷仓锈铁皮顶", "影视破败：废弃农场的木板大谷仓，板壁翘裂脱落，锈铁皮屋顶塌了半边，大门歪挂，旁边立着一座半塌的铁皮粮仓，干草垛和破车轮散在院里", "欧式", "废弃",
    house({ seed: "荒废农场谷仓锈铁皮顶", pal: { ...EURO, wall: "#7c4a3c", brick: "#5a3a30", wood: "#6a5340", tile: "#6a6055" }, w: 16, d: 10, hs: 5.5, found: .25, thick: .25, damage: [.25, .3, .3, .4], wallKeys: ["wall", "wallB", "wood", "woodD"], tin: true, roofLoss: .5, rise: 3, overhang: .5, door: "hanging", doorW: 3.6, doorH: 4.2, windows: 2, win: { w: 1.2, h: 1.2, sill: 3.4 }, winKind: ["boarded", "empty"], weeds: .8, patches: 8 }, (b, rng) => {
      pillar(b, "metal", 11.5, 1, 0, 9.2, 2.2, { sides: 12 }); pillar(b, "rust", 11.5, 1, 9.2, 10.4, 2.0, { sides: 12, lean: [.5, .2] }); b.tbox("metal", [13.6, .5, 3], [1.4, 1, 1], 30, 0, 14);
      for (let k = 0; k < 5; k++) b.tbox("thatch", [rng.range(-6, 1), .45, 7.5 + rng.range(-.8, .8)], [1.2, .9, .8], rng.range(-20, 20), 0, rng.range(-6, 6));
      for (let k = 0; k < 4; k++) b.beam("wood", [-7.7 + k * .02, .3, 3.5], [-7.7, 3.4 - k * .05, 3.5], .06, .06);
      fence(b, rng, [-9, 9], [9, 9], 0, 1.2, 1.4);
    })),
  ruin("闹鬼歪斜老宅尖塔枯树", "影视破败：三层维多利亚式老宅被沉降扯歪，尖塔楼塌了顶、窗洞钉板或空着，藤蔓缠身，门廊塌了一半，门前一棵枯树和断栅栏——恐怖片经典外景", "欧式", "废弃", () => {
    const base = ruinHouse({ seed: "闹鬼歪斜老宅尖塔枯树", pal: { ...EURO, wall: "#7d7d79", tile: "#3e4244" }, w: 9, d: 8, storeys: 3, hs: 3.4, found: .8, thick: .4, damage: .25, ridge: "x", rise: 4.2, roofLoss: .35, door: "ajar", doorW: 1.3, doorH: 2.5, windows: 2, win: { w: 1, h: 1.7, sill: .9 }, winKind: ["boarded", "empty", "shutter"], vines: 1, moss: .7, weeds: 1 });
    const turret = (() => {
      const b = ruinBuilder(EURO), rng = new Rng("老宅尖塔");
      b.ringWall(rng, -4.9, 3.6, 1.9, .8, 10, .4, 6, { damage: .32, keys: ["wall", "wallB"], holes: (k) => k % 2 ? [{ u: 0, w: .6, y0: 3 + (k % 3) * 2.2, y1: 4.6 + (k % 3) * 2.2, kind: "window" as const }] : [] });
      for (let k = 0; k < 6; k++) if (rng.chance(.7)) { const a = (k + .5) / 6 * Math.PI * 2; b.beam("woodD", [-4.9 + Math.sin(a) * 1.9, 10.8, 3.6 + Math.cos(a) * 1.9], [-4.9 + Math.sin(a) * .2, 13.2, 3.6 + Math.cos(a) * .2], .12, .12); }
      for (let k = 0; k < 5; k++) b.plate("tile", [-4.9 + rng.range(-1.5, 1.5), 11 + rng.range(0, 1.5), 3.6 + rng.range(-1.5, 1.5)], [-4.9 + rng.range(-1.5, 1.5), 11.4, 3.6 + rng.range(-1.5, 1.5)], [-4.9, 12.2, 3.6], [-4.9 + rng.range(-1.5, 1.5), 11.6, 3.6 + rng.range(-1.5, 1.5)], .04);
      return b.parts();
    })();
    return withProps(shearParts([...base, ...turret], .06), EURO, "闹鬼老宅p", (b, rng) => {
      b.beam("woodD", [-2.4, .8, 5.2], [-2.4, 4.4, 5.2], .22, .22); b.beam("woodD", [2.4, .8, 5.2], [2.7, 3.6, 5.2], .22, .22);
      fence(b, rng, [-9, 7.5], [9, 7.5], 0, 1.3, 1.2, "woodD"); tree(b, rng, -6.5, 8.5, 8, { dead: true }); tree(b, rng, 7.8, 7, 6.5, { dead: true }); b.weeds(rng, 0, 5, 9, 4, 28, 0);
    });
  }),
  ruin("废弃风车塔残翼", "影视破败：石砌风车塔，木顶帽塌了，四扇风翼断了两扇、横梁挂着破布，塔身裂缝爬藤，门洞黑洞洞，塔脚荒草丛生", "欧式", "废弃", () => {
    const b = ruinBuilder(EURO), rng = new Rng("废弃风车塔残翼");
    let y = .3;
    ([[3.5, 5, .22], [3.05, 5, .38], [2.6, 4.2, .6]] as [number, number, number][]).forEach(([rr, H, dmg], i) => { b.ringWall(rng, 0, 0, rr, y, H, .7, 12, { damage: dmg, keys: ["wall", "wallB", "stone"], holes: (k) => i === 0 && k === 0 ? [{ u: 0, w: 1.4, y0: y, y1: y + 2.6, kind: "door" as const, arch: "round" as const }] : i > 0 && k % 4 === 1 ? [{ u: 0, w: .6, y0: y + 1.3, y1: y + 2.6, kind: "window" as const }] : [] }); y += H; });
    for (let k = 0; k < 12; k++) { if (rng.chance(.3)) continue; const a0 = k / 12 * Math.PI * 2, a1 = (k + 1) / 12 * Math.PI * 2; b.beam("woodD", [Math.sin(a0) * 2.4, y + .1, Math.cos(a0) * 2.4], [Math.sin(a1) * 2.4, y + .1, Math.cos(a1) * 2.4], .3, .3); }
    const hub: P = [0, y - .5, 3.0];
    b.beam("wood", [0, y - .5, 0], hub, .4, .4);
    [[25, 1], [115, .45], [205, 1], [295, .8]].forEach(([deg, len], i) => {
      const th = deg! * DEG, L = 8 * len!, tip: P = [hub[0] + Math.cos(th) * L, hub[1] + Math.sin(th) * L, hub[2]];
      b.beam("wood", hub, tip, .22, .32);
      for (let s = 1; s * .85 < L; s++) { if (rng.chance(.3)) continue; const c: P = [hub[0] + Math.cos(th) * s * .85, hub[1] + Math.sin(th) * s * .85, hub[2]], d: P = [-Math.sin(th) * 1.1, Math.cos(th) * 1.1, 0]; b.beam("wood", [c[0] - d[0], c[1] - d[1], c[2]], [c[0] + d[0], c[1] + d[1], c[2]], .1, .1); }
      if (i !== 1) b.plate("cloth", [hub[0] + Math.cos(th) * 1.5, hub[1] + Math.sin(th) * 1.5, hub[2] + .12], [hub[0] + Math.cos(th) * L * .85, hub[1] + Math.sin(th) * L * .85, hub[2] + .12], [hub[0] + Math.cos(th) * L * .85 - Math.sin(th) * 1.2, hub[1] + Math.sin(th) * L * .85 + Math.cos(th) * 1.2, hub[2] + .12], [hub[0] + Math.cos(th) * 1.5 - Math.sin(th) * 1.2, hub[1] + Math.sin(th) * 1.5 + Math.cos(th) * 1.2, hub[2] + .12], .004);
    });
    for (const k of [3, 7, 10]) b.vine(rng, ringFrame(0, 0, 3.5, .7, 12, k), 1, .35, rng.range(-.5, .5), .3, 7);
    b.heap(rng, -4.4, 2.2, 0, 1.3, .8); b.weeds(rng, 0, 0, 7, 7, 26, .03); tree(b, rng, 7, -3, 5.5, { dead: true });
    return b.parts();
  }),
  ruin("荒废修道院回廊拱券", "影视破败：修道院的石砌回廊，成排圆拱立柱有的断裂缺块，回廊顶早已不存，天井里长满荒草，只剩一口枯井和倒塌的拱石", "欧式", "废弃", () => {
    const b = ruinBuilder(EURO), rng = new Rng("荒废修道院回廊拱券"), keys = ["wall", "wallB", "stone"];
 b.box("stone", 0, .08, 0, 27, .16, 15);
    const arches = (n: number, len: number): Hole[] => Array.from({ length: n }, (_, i) => ({ u: -len / 2 + (i + .5) * len / n, w: 2.5, y0: .16, y1: 4.4, kind: "door" as const, arch: "round" as const }));
    b.wallRun(rng, { x: 0, z: -7, yaw: 180 }, -13, 13, .16, 6.2, .9, arches(6, 26), { damage: .5, keys, lintels: .9 });
    b.wallRun(rng, { x: 0, z: 7, yaw: 0 }, -13, 13, .16, 6.2, .9, arches(6, 26), { damage: .72, keys, lintels: .7 });
    b.wallRun(rng, { x: -13, z: 0, yaw: 270 }, -6.2, 6.2, .16, 6.2, .9, arches(3, 12.4), { damage: .45, keys, lintels: .9 });
    b.wallRun(rng, { x: 13, z: 0, yaw: 90 }, -6.2, 6.2, .16, 6.2, .9, [], { damage: .92, keys });
    well(b, rng, 1.5, 0, .16, 1);
    for (let k = 0; k < 9; k++) b.tbox("stone", [rng.range(-10, 10), .4, rng.range(-4.5, 4.5)], [rng.range(.5, 1.1), .35, .45], rng.range(0, 360), rng.range(-10, 10), rng.range(-12, 12));
    b.heap(rng, -4, 5.2, .16, 1.6, .9); b.heap(rng, 8, -5.4, .16, 1.4, .8); b.weeds(rng, 0, 0, 12, 6, 50, .16); tree(b, rng, -6, 1, 6, { dead: true, y: .16 });
    return b.parts();
  }),
  ruin("废弃灯塔守屋锈蚀灯笼房", "影视破败：海岸废弃的白石灯塔，塔身斑驳、顶部灯笼房玻璃尽碎只剩锈框，环廊栏杆断落，紧挨着一间屋顶塌了半边的守塔人小屋", "欧式", "废弃", () => {
    const b = ruinBuilder(EURO), rng = new Rng("废弃灯塔守屋锈蚀灯笼房");
    let y = .3;
    ([[2.9, 6, .08], [2.55, 6, .18], [2.25, 6, .35]] as [number, number, number][]).forEach(([rr, H, dmg], i) => { b.ringWall(rng, 0, 0, rr, y, H, .6, 12, { damage: dmg, keys: ["wallC", "wall", "wallC"], holes: (k) => i === 0 && k === 3 ? [{ u: 0, w: 1.2, y0: y, y1: y + 2.3, kind: "door" as const, arch: "round" as const }] : k % 4 === 0 ? [{ u: 0, w: .5, y0: y + 1.8, y1: y + 3.4, kind: "window" as const }] : [] }); y += H; });
    pillar(b, "stone", 0, 0, y, y + .35, 3.3, { sides: 12 });
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, x = Math.sin(a) * 3.1, z = Math.cos(a) * 3.1; if (!rng.chance(.25)) b.beam("rust", [x, y + .35, z], [x, y + 1.35, z], .06, .06); if (!rng.chance(.3)) { const a1 = (k + 1) / 12 * Math.PI * 2; b.beam("rust", [x, y + 1.3, z], [Math.sin(a1) * 3.1, y + 1.3, Math.cos(a1) * 3.1], .06, .06); } }
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, x = Math.sin(a) * 1.7, z = Math.cos(a) * 1.7; if (rng.chance(.15)) continue; b.beam("rust", [x, y + .35, z], [x, y + 2.75 - (rng.chance(.3) ? rng.range(.3, 1.2) : 0), z], .1, .1); if (rng.chance(.35)) { const a1 = (k + 1) / 8 * Math.PI * 2; b.plate("glass", [x, y + .5, z], [Math.sin(a1) * 1.7, y + .5, Math.cos(a1) * 1.7], [Math.sin(a1) * 1.7, y + 2.2, Math.cos(a1) * 1.7], [x, y + 2.2, z], .01); } }
    b.beam("rust", [-1.7, y + 2.75, 0], [1.7, y + 2.8, 0], .1, .1); b.beam("rust", [0, y + 2.75, -1.7], [0, y + 3.4, 0], .08, .08);
    for (const k of [1, 5, 8]) b.vine(rng, ringFrame(0, 0, 2.9, .6, 12, k), 1, .3, 0, .3, 6);
    const cottage = ruinHouse({ seed: "灯塔守屋", pal: EURO, w: 7, d: 5, hs: 3, found: .3, thick: .4, damage: [.3, .5, .4, .45], roofLoss: .5, rise: 1.8, door: "hanging", doorW: 1.1, doorH: 2.2, windows: 2, winKind: ["boarded", "empty"], weeds: .5 });
    return withProps([...b.parts(), ...placeParts(cottage, 6.8, 0, .5, 90)], EURO, "废弃灯塔p", (bb, r) => { bb.heap(r, -4, 3, 0, 1.6, 1, ["rubbleS", "stone"], 12); bb.weeds(r, 0, 0, 9, 7, 24, .03); });
  }),
  ruin("战损砖房炮击缺墙沙袋", "影视破败：被炮击过的砖房，一面墙被轰开大缺口，屋顶只剩几根焦黑椽子，立面弹孔累累，门前残留沙袋工事和弹坑", "废土", "破损",
    house({ seed: "战损砖房炮击缺墙沙袋", pal: WASTE, w: 9, d: 7, hs: 3, found: .25, thick: .35, damage: [.3, .3, .86, .3], roofLoss: .8, door: "missing", windows: 2, winKind: ["empty", "boarded"], soot: .7, patches: 10, rubble: 1.2, weeds: .3 }, (b, rng, ctx) => {
      for (let k = 0; k < 18; k++) b.patch("soot", rng, ctx.frames[0]!, 1, ctx.t / 2, rng.range(-4, 4), ctx.found + rng.range(.6, 2.4), .12, .12, .016, 5);
      sandbags(b, rng, -2.2, 4.6, 0, 6); sandbags(b, rng, 2.4, 4.4, -15, 6); b.heap(rng, 6.5, 2.5, 0, 2.4, .4, ["dirt", "rubbleS"], 10);
      for (const dz of [0, .3]) b.sweep("rust", Array.from({ length: 9 }, (_, i) => [-5 + i * 1.3, .5 + (i % 2) * .35 + dz, 6.6 + dz] as P), Array(9).fill(.012));
    })),
  ruin("铁皮拼凑棚屋废料搭建", "影视破败：用锈铁皮、旧门板、木托盘和防雨布东拼西凑的棚屋，墙板高低不齐，屋顶压着旧轮胎和砖块，门口挂着破帘，旁边堆着废料和铁桶", "废土", "废弃", () => {
    const b = ruinBuilder(WASTE), rng = new Rng("铁皮拼凑棚屋废料搭建");
    b.group("tarp", "蓝色防雨布", "#4a6f8f", { roughness: .9 }).group("paintR", "锈红铁皮", "#8a3f2e", { roughness: .7, metalness: .4 }).group("paintG", "灰绿铁皮", "#5d6e62", { roughness: .7, metalness: .4 }).group("pallet", "木托盘", "#8a6a45", { roughness: .95 });
    const W = 6, D = 4.6, panelKeys = ["metal", "rust", "paintR", "paintG", "wood", "pallet", "metal"];
    for (const [x0, z0, dx, dz, yaw, len] of [[-W / 2, D / 2, 1, 0, 0, W], [W / 2, -D / 2, -1, 0, 180, W], [-W / 2, -D / 2, 0, 1, 90, D], [W / 2, D / 2, 0, -1, 270, D]] as number[][]) {
      let u = 0;
      while (u < len! - .2) {
        const w = Math.min(len! - u, rng.range(.9, 1.7)), h = rng.range(2.0, 2.8), c = u + w / 2;
        if (yaw === 0 && c > 2.0 && c < 3.2) { u += w; continue; }
        b.tbox(rng.pick(panelKeys), [x0! + dx! * c, h / 2, z0! + dz! * c], [w, h, .06], yaw! + rng.range(-3, 3), rng.range(-2, 2), rng.range(-2.5, 2.5)); u += w;
      }
    }
    for (const [x, z] of [[-3, 2.3], [3, 2.3], [-3, -2.3], [3, -2.3]] as [number, number][]) b.beam("wood", [x, 0, z], [x + rng.range(-.1, .1), 2.9, z], .13, .13);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const k = rng.pick(["metal", "rust", "tarp", "paintR", "paintG", "tarp"]); b.tbox(k, [-2.5 + i * 1.7 + rng.range(-.1, .1), 2.9 + j * .12 + (3 - j) * .0, -1.7 + j * 1.7], [2.0, .05, 1.8], rng.range(-4, 4), 7 + rng.range(-3, 3), rng.range(-3, 3)); }
    for (let k = 0; k < 4; k++) pillar(b, "soot", rng.range(-2.5, 2.5), rng.range(-1.6, 1.6), 3.3, 3.55, .42);
    b.plate("cloth", [2.0, 2.2, 2.35], [3.2, 2.2, 2.35], [3.1, .5, 2.4], [2.1, .3, 2.4], .004);
    for (let k = 0; k < 4; k++) pillar(b, rng.pick(["rust", "metal", "paintR"]), 4.4 + rng.range(-.6, .6), rng.range(-2, 2), 0, .9, .3);
    crates(b, rng, -4.4, 2.2, 0, 4, .9, "pallet"); b.beam("metal", [-3, 3, -2.3], [-3.2, 6.2, -2.3], .04, .04); b.heap(rng, 4.8, 3, 0, 1.2, .5, ["rubbleS", "rubble", "dirt"], 10); b.weeds(rng, 0, 0, 7, 5, 16, .02);
    return b.parts();
  }),
  ruin("坍塌水泥碉堡射孔钢筋", "影视破败：战后废弃的混凝土碉堡，顶板斜塌一角露出锈蚀钢筋，射击孔黑洞洞，墙面弹痕剥落，周边沙袋与荒草", "废土", "破损", () => {
    const b = ruinBuilder(CONCRETE), rng = new Rng("坍塌水泥碉堡射孔钢筋"), fr: Frame = { x: 0, z: 2.6 - .4, yaw: 0 };
    const keys = ["wallB", "wall", "wallC"];
    b.wallRun(rng, fr, -4, 4, .1, 3.2, .8, [{ u: -1.6, w: 1.5, y0: 1.5, y1: 1.9, kind: "window" }, { u: 1.6, w: 1.5, y0: 1.5, y1: 1.9, kind: "window" }], { damage: .22, keys });
    b.wallRun(rng, { x: 0, z: -2.6 + .4, yaw: 180 }, -4, 4, .1, 3.2, .8, [{ u: 2, w: 1.1, y0: .1, y1: 2.0, kind: "door" }], { damage: .35, keys }); b.wallRun(rng, { x: -4 + .4, z: 0, yaw: 270 }, -1.8, 1.8, .1, 3.2, .8, [], { damage: .4, keys }); b.wallRun(rng, { x: 4 - .4, z: 0, yaw: 90 }, -1.8, 1.8, .1, 3.2, .8, [], { damage: .5, keys });
    b.tbox("wallC", [-.6, 3.5, .2], [6.4, .5, 5.2], 0, 7, 6); b.tbox("wallC", [3.6, .45, 3.8], [2.6, .5, 2.2], 25, 6, 4);
    for (let k = 0; k < 9; k++) b.beam("rust", [rng.range(-3.2, 3.2), 3.1, rng.range(-2, 2)], [rng.range(-3.2, 3.2) + rng.range(-.5, .5), 3.6 + rng.range(0, 1.1), rng.range(-2, 2)], .03, .03);
    b.heap(rng, 3.4, 3.2, 0, 1.4, .8, ["rubble", "rubbleS", "wallC"], 16); sandbags(b, rng, -2.8, 4.1, 0, 6); sandbags(b, rng, 1.4, 4.2, 10, 5); b.weeds(rng, 0, 0, 8, 6, 28, .02);
    return b.parts();
  }),
  ruin("废弃哨所木构高脚岗亭", "影视破败：边境废弃的木构高脚哨塔，木梯断了几级，岗亭板壁残缺、铁皮顶塌歪，探照灯锈死，塔脚堆着沙袋和铁丝网", "废土", "废弃", () => {
    const b = ruinBuilder(WASTE), rng = new Rng("废弃哨所木构高脚岗亭"), yf = 5.4;
    for (const [x, z] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]] as [number, number][]) b.beam("wood", [x * 1.5, 0, z * 1.5], [x, yf, z], .28, .28);
    for (let k = 0; k < 2; k++) { b.beam("wood", [-2.2, 1.0 + k * 2, -2.2], [2.2, 3.0 + k * 2, -2.2], .1, .13); b.beam("wood", [2.2, 1.0 + k * 2, -2.2], [-2.2, 3.0 + k * 2, -2.2], .1, .13); }
    b.floorGrid(rng, "wood", "woodD", -1.9, -1.9, 1.9, 1.9, yf, { cell: .95, missing: .3, thick: .12 });
    for (const [fx, fz, yaw, len] of [[0, -1.8, 180, 3.6], [-1.8, 0, 270, 3.6], [1.8, 0, 90, 3.6]] as number[][]) b.wallRun(rng, { x: fx!, z: fz!, yaw: yaw! }, -len! / 2, len! / 2, yf, 2.2, .1, [{ u: 0, w: 1.4, y0: yf + .9, y1: yf + 1.8, kind: "window" }], { damage: .45, keys: ["wood", "woodD"] });
    b.tbox("metal", [0, yf + 2.55, 0], [4.4, .06, 4.4], 12, 8, 6); b.beam("woodD", [-2, yf + 2.2, 2], [2, yf + 2.2, 2], .1, .1);
    b.box("metal", 0, yf + 1.2, 1.9, .5, .5, .5); pillar(b, "rust", 0, 2.1, yf, yf + .45, .28);
    for (const x of [-.5, .5]) b.beam("wood", [x + 2.3, 0, 2.2], [x + 1.9, yf, 2.0], .07, .07);
    for (let k = 0; k < 14; k++) if (!rng.chance(.25)) b.beam("wood", [1.8, .35 + k * .38, 2.2 - k * .016], [2.8, .35 + k * .38, 2.2 - k * .016], .05, .06);
    sandbags(b, rng, -1.6, 3.2, 0, 6); sandbags(b, rng, 1.6, -3.1, 180, 5);
    for (const dz of [0, .35]) b.sweep("rust", Array.from({ length: 11 }, (_, i) => [-5 + i * 1.0, .45 + (i % 2) * .35 + dz, 4.6 + dz] as P), Array(11).fill(.012));
    b.weeds(rng, 0, 0, 5, 5, 22, .02);
    return b.parts();
  }),
  ruin("半塌集装箱屋错叠锈蚀", "影视破败：两只锈蚀的集装箱错叠成屋，上层一只滑出半截、歪斜塌陷，箱门一开一垂，旁边搭着防雨布披棚、堆着旧轮胎和铁桶", "废土", "破损", () => {
    const lower = container("集装箱下", "#8a3b2e"), upper = container("集装箱上", "#3f5f7f");
    return withProps([...lower, ...rotateParts(upper, 1.4, 2.62, .35, 16, 0, 5)], WASTE, "半塌集装箱屋p", (b, rng) => {
      b.group("tarp", "蓝色防雨布", "#4a6f8f", { roughness: .9 });
      b.tbox("tarp", [-.2, 2.3, 3.2], [5.6, .05, 2.2], 0, -10, 0); b.beam("wood", [-3, 0, 4.2], [-3, 2.5, 4.2], .09, .09); b.beam("wood", [2.6, 0, 4.2], [2.6, 1.9, 4.2], .09, .09);
      for (let k = 0; k < 5; k++) pillar(b, "soot", rng.range(-4, 4), rng.range(3, 5), 0, .22, .42, { sides: 10 });
      for (let k = 0; k < 4; k++) pillar(b, rng.pick(["rust", "metal"]), 4.4 + rng.range(-.5, .5), rng.range(-1, 2), 0, .9, .3);
      crates(b, rng, -4.6, 2.6, 0, 3, .8); b.heap(rng, 4.8, -3, 0, 1.3, .5, ["rubbleS", "dirt"], 8); b.weeds(rng, 0, 0, 7, 5, 18, .02);
    });
  }),
  ruin("沙埋废弃土屋沙丘半掩", "影视破败：荒漠里的黄土坯房被风沙掩埋了一半，平屋顶塌陷、门洞半截埋在沙里，墙面被风蚀得凹凸斑驳，周围是起伏的沙丘", "废土", "废弃", () => {
    const base = ruinHouse({ seed: "沙埋废弃土屋沙丘半掩", pal: SAND, w: 7, d: 5, hs: 2.8, found: .2, thick: .45, damage: .35, roof: "flat", roofLoss: .5, door: "missing", doorW: 1.1, doorH: 1.9, windows: 1, win: { w: .7, h: .8, sill: 1.1 }, winKind: "empty", weeds: .05, moss: 0, vines: 0, rubble: .5 });
    return withProps(base, SAND, "沙埋废弃土屋p", (b, rng) => {
      b.group("sand", "积沙", "#d1b57e", { roughness: 1 });
      b.dune("sand", rng, 3.6, 2.8, 4.2, 2.2, 1.7, 30); b.dune("sand", rng, -3.8, -1.8, 3.8, 2.0, 1.5, -20); b.dune("sand", rng, 0, 4.8, 3.6, 1.7, .9, 5); b.dune("sand", rng, -1, -4.4, 5, 2.2, 1.9, 10); b.dune("sand", rng, 8, -2, 3, 2.6, 1.3, 40);
      b.dune("sand", rng, 0, 0, 2.6, 1.8, .55, 20, .1);
      for (let k = 0; k < 5; k++) b.tuft("grassY", rng, rng.range(-7, 7), 0, rng.range(-6, 6), .5, 4);
    });
  }),
  ruin("被洗劫的废弃商店卷帘撕裂", "影视破败：被洗劫一空的街角商店，卷帘门被撕开垂在门头、橱窗碎光，货架倾倒、货物散落，墙上有喷漆涂鸦和烟熏", "废土", "破损",
    house({ seed: "被洗劫的废弃商店卷帘撕裂", pal: WASTE, w: 10, d: 7, hs: 3.4, found: .25, thick: .35, damage: .15, roof: "flat", roofLoss: .3, door: "hanging", doorW: 1.8, doorH: 2.5, windows: 2, win: { w: 2.2, h: 1.6, sill: .8 }, winKind: ["glass", "boarded"], soot: .4, patches: 9, rubble: .7, weeds: .3 }, (b, rng, ctx) => {
      b.group("paintR", "喷漆红", "#b0392e", { roughness: .8 }).group("paintB", "喷漆蓝", "#2f5fa0", { roughness: .8 });
      for (let k = 0; k < 6; k++) b.patch(rng.pick(["paintR", "paintB"]), rng, ctx.frames[0]!, 1, ctx.t / 2, rng.range(-4.2, 4.2), ctx.found + rng.range(.7, 2.5), rng.range(.5, 1.3), rng.range(.3, .7), .02, 6);
      b.tbox("metal", [1.2, 2.2, 3.7], [2.4, .9, .05], 0, 25, 4); b.tbox("metal", [-2.8, .9, 3.9], [1.9, 1.7, .05], 10, 70, 0);
      for (let k = 0; k < 4; k++) b.tbox("wood", [rng.range(-3.5, 3.5), .5, rng.range(-2, 2)], [1.6, 1.8, .4], rng.range(0, 180), rng.range(60, 90), rng.range(-10, 10));
      for (let k = 0; k < 14; k++) b.tbox(rng.pick(["cloth", "paintR", "paintB", "rubble"]), [rng.range(-4, 4), .35, rng.range(-2.6, 3.8)], [.3, .2, .2], rng.range(0, 360));
      crates(b, rng, 5.8, 4.2, 0, 3, .6);
    })),
  ruin("废弃加固据点围墙哨塔", "影视破败：被放弃的武装据点，混凝土围墙多处塌缺、铁丝网锈断，转角哨塔歪斜，院内的小楼塌了屋顶，满地油桶和防撞障碍", "废土", "废弃", () => {
    const hut = ruinHouse({ seed: "据点内小楼", pal: WASTE, w: 7, d: 5, hs: 3, found: .25, thick: .35, damage: [.3, .4, .35, .5], roof: "flat", roofLoss: .6, door: "hanging", doorW: 1.2, doorH: 2.2, windows: 2, winKind: ["boarded", "empty"], weeds: .3 });
    return withProps(placeParts(hut, 2.5, 0, -2.5, 0), WASTE, "废弃加固据点p", (b, rng) => {
      const keys = ["wallB", "wall", "wallC"];
      freeWall(b, rng, [-9, 7], [9, 7], 0, 3, .6, .4, keys, [{ u: 3, w: 3, y0: 0, y1: 2.8, kind: "gap" }]); freeWall(b, rng, [-9, -7], [9, -7], 0, 3, .6, .45, keys); freeWall(b, rng, [-9, -7], [-9, 7], 0, 3, .6, .5, keys); freeWall(b, rng, [9, -7], [9, 7], 0, 3, .6, .6, keys);
      for (const [x, z] of [[-9, 7], [9, 7]] as [number, number][]) { for (const [dx, dz] of [[-.6, -.6], [.6, -.6], [-.6, .6], [.6, .6]] as [number, number][]) b.beam("wood", [x + dx, 3, z + dz], [x + dx * 1.1, 6.4, z + dz * 1.1], .14, .14); b.box("woodD", x, 6.2, z, 1.8, .1, 1.8); b.tbox("metal", [x, 6.9, z], [2.2, .06, 2.2], rng.range(-10, 10), 6, 5); }
      for (const dz of [0, .4]) b.sweep("rust", Array.from({ length: 24 }, (_, i) => [-9 + i * .78, 3.2 + (i % 2) * .3 + dz, 7 + dz * .3] as P), Array(24).fill(.012));
      for (let k = 0; k < 6; k++) pillar(b, rng.pick(["rust", "metal"]), rng.range(-6, 6), rng.range(-5, 4), 0, .95, .3, rng.chance(.3) ? { lean: [.5, .2] } : {});
      for (let k = 0; k < 4; k++) { const x = rng.range(-6, 5), z = rng.range(2, 5.5); b.beam("rust", [x - .5, .9, z], [x + .5, 0, z], .08, .08); b.beam("rust", [x + .5, .9, z], [x - .5, 0, z], .08, .08); b.beam("rust", [x, .9, z - .5], [x, 0, z + .5], .08, .08); }
      sandbags(b, rng, -6, 5.6, 0, 6); b.weeds(rng, 0, 0, 14, 10, 30, .02);
    });
  }),
];
