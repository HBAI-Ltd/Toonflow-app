import { ruinHouse, type HouseCfg } from "./ruinHouse";
import { placeParts, type P } from "./ruinKit";
import { fence, freeWall, pillar, signBoard, stele, tree } from "./ruinProps";
import { BRICK, CN, CONCRETE, PLASTER, WASTE, house, ruin, withProps } from "./ruinCommon";
import type { ArchitecturePrototype } from "./structures";

// 影视破败外景·场景类：废弃游乐园与旋转木马、废弃矿场井架、废弃电影院、民国老街旧店面、土地庙废墟、焚毁大宅院。
const DEG = Math.PI / 180;

export const ruinBuildingFourDesigns: ArchitecturePrototype[] = [
  ruin("废弃游乐园入口与旋转木马亭", "影视破败：荒废的游乐园，拱形大门招牌残缺锈蚀，两侧检票亭玻璃全碎，门里一座旋转木马亭——圆台上立着彩漆斑驳的木马，伞形顶塌了几片，杂草从地缝钻出", "现代", "废弃", () => {
    const booth = ruinHouse({ seed: "游乐园检票亭", pal: CONCRETE, w: 2.6, d: 2.2, hs: 2.7, found: .15, thick: .15, damage: .3, roof: "flat", door: "missing", doorW: .9, windows: 1, win: { w: 1.3, h: 1.1, sill: 1 }, winKind: "empty", moss: .3, weeds: .6 });
    return withProps([...placeParts(booth, -6.4, 0, 2.4), ...placeParts(booth, 6.4, 0, 2.4)], CONCRETE, "废弃游乐园p", (b, rng) => {
      b.group("c1", "褪色红漆", "#a9453c", { roughness: .8 }).group("c2", "褪色蓝漆", "#3f6a9e", { roughness: .8 }).group("c3", "褪色黄漆", "#cfae45", { roughness: .8 }).group("pw", "褪色白漆", "#cfcbbf", { roughness: .9 });
      for (const s of [-1, 1]) { b.box("stone", s * 4.2, 2.0, 0, 1.0, 4.0, 1.0); b.box("c1", s * 4.2, 4.15, 0, 1.3, .3, 1.3); }
      for (let k = 0; k < 14; k++) { if (k === 9 || k === 10) continue; const a0 = k / 14 * Math.PI, a1 = (k + 1) / 14 * Math.PI; b.beam("metal", [Math.cos(a0) * 4.2, 4.3 + Math.sin(a0) * 2.4, 0], [Math.cos(a1) * 4.2, 4.3 + Math.sin(a1) * 2.4, 0], .2, .2); }
      b.box("pw", 0, 5.6, 0, 5.6, .9, .12); for (let k = 0; k < 9; k++) if (!rng.chance(.3)) b.box(k % 2 ? "c1" : "c2", -2.4 + k * .6, 5.6, .08, .4, .55, .04);
      for (let k = 0; k < 4; k++) { const x = -1.8 + k * 1.2; pillar(b, "metal", x, 1.2, 0, 1.0, .05); for (let j = 0; j < 3; j++) { const a = j * 2.094 + k; b.beam("metal", [x, .9, 1.2], [x + Math.cos(a) * .4, .9 + Math.sin(a) * .0, 1.2 + Math.sin(a) * .4], .03, .03); } }
      const cz = 14, ry = 5.4, apex: P = [.3, 7.6, cz];
      pillar(b, "pw", 0, cz, .05, .15, 5.05, { sides: 20 }); pillar(b, "c3", 0, cz, .15, .75, 4.8, { sides: 20 }); pillar(b, "c2", 0, cz, .75, 6.4, .45, { sides: 12 });
      for (let k = 0; k < 12; k++) {
        const a0 = k / 12 * Math.PI * 2, a1 = (k + 1) / 12 * Math.PI * 2, p0: P = [Math.cos(a0) * 5.6, ry, cz + Math.sin(a0) * 5.6], p1: P = [Math.cos(a1) * 5.6, ry, cz + Math.sin(a1) * 5.6];
        b.beam("metal", apex, p0, .1, .1);
        if (k === 2 || k === 3 || k === 8) continue;
        b.beam("metal", p0, p1, .12, .12); const key = k % 2 ? "c1" : "pw"; b.tri(key, apex, p1, p0, [0, 1, 0]); b.tri(key, apex, p0, p1, [0, -1, 0]);
      }
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2, x = Math.cos(a) * 3.6, z = cz + Math.sin(a) * 3.6, h = rng.range(1.3, 2.1), col = ["c1", "c2", "c3", "pw"][k % 4]!, yaw = -a / DEG;
        b.beam("metal", [x, .8, z], [x, ry, z], .08, .08);
        if (k === 5) { b.tbox(col, [x * .9, .95, cz + (z - cz) * .9], [.4, .55, 1.1], yaw, 0, 82); continue; }
        if (rng.chance(.2)) continue;
        b.tbox(col, [x, h, z], [.4, .55, 1.1], yaw, 0, rng.range(-6, 6)); b.tbox(col, [x - Math.sin(a) * .6, h + .3, z + Math.cos(a) * .6], [.25, .5, .3], yaw, -20, 0); b.box(col, x, h - .4, z, .16, .5, .16);
      }
      b.weeds(rng, 0, cz, 7, 7, 46, .05); b.weeds(rng, 0, 4, 9, 4, 28, 0); b.bush("leaf", rng, -7, 0, 9, 1.2); tree(b, rng, 9, 17, 8, { dead: true });
    });
  }),
  ruin("废弃矿场井架与工棚", "影视破败：荒废的矿口，高耸的钢木井架顶上立着锈蚀的天轮，旁边铁皮顶工棚塌了一半，窄轨上翻倒着矿车，空地上堆着废石，围着带刺铁丝网", "废土", "废弃", () => {
    const shed = ruinHouse({ seed: "矿场工棚", pal: WASTE, w: 10, d: 6, hs: 3.4, found: .2, thick: .2, damage: [.3, .4, .4, .5], wallKeys: ["wall", "wood", "woodD"], tin: true, roofLoss: .5, rise: 1.4, door: "hanging", doorW: 2.2, doorH: 2.6, windows: 3, win: { w: 1, h: .9, sill: 1.6 }, winKind: ["empty", "boarded"], weeds: .8, patches: 5 });
    return withProps(placeParts(shed, -7, 0, 3), WASTE, "废弃矿场井架p", (b, rng) => {
      const cx = 5, cz = -3, hh = 15, e0 = 2.2, e1 = .5, ex = (y: number) => e0 + (e1 - e0) * y / hh;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.beam("woodD", [cx + sx * e0, 0, cz + sz * e0], [cx + sx * e1, hh, cz + sz * e1], .32, .32);
      for (let k = 1; k <= 5; k++) {
        const y = k * 2.6, e = ex(y), e2 = ex(y + 2.6);
        for (const s of [-1, 1]) { b.beam("wood", [cx - e, y, cz + s * e], [cx + e, y, cz + s * e], .18, .18); b.beam("wood", [cx + s * e, y, cz - e], [cx + s * e, y, cz + e], .18, .18); }
        if (k < 5 && !rng.chance(.2)) { b.beam("wood", [cx - e, y, cz + e], [cx + e2, y + 2.6, cz + e2], .12, .12); b.beam("wood", [cx + e, y, cz - e], [cx - e2, y + 2.6, cz - e2], .12, .12); }
      }
      const wy = hh + .9;
      for (let k = 0; k < 14; k++) { const a0 = k / 14 * Math.PI * 2, a1 = (k + 1) / 14 * Math.PI * 2; b.beam("rust", [cx + Math.cos(a0) * 1.4, wy + Math.sin(a0) * 1.4, cz], [cx + Math.cos(a1) * 1.4, wy + Math.sin(a1) * 1.4, cz], .12, .12); }
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; b.beam("rust", [cx + Math.cos(a) * 1.4, wy + Math.sin(a) * 1.4, cz], [cx - Math.cos(a) * 1.4, wy - Math.sin(a) * 1.4, cz], .08, .08); }
      b.beam("metal", [cx, wy, cz - 1.1], [cx, wy, cz + 1.1], .12, .12); b.beam("metal", [cx - 1.4, wy, cz], [cx - 9, .4, cz], .04, .04);
      for (const s of [-.4, .4]) b.beam("metal", [-2, .18, 5.5 + s], [16, .18, 5.5 + s], .08, .1);
      for (let k = 0; k < 22; k++) b.box("woodD", -2 + k * .8, .08, 5.5, .15, .1, 1.3);
      b.tbox("rust", [10, .6, 5.5], [1.6, .9, 1.0], 20, 0, 75); b.heap(rng, 11, 6.5, 0, 1.2, .5, ["rubbleS", "stone"], 14); b.heap(rng, 12, -6, 0, 5, 3, ["rubbleS", "stone", "dirt"], 60);
      fence(b, rng, [-14, 10], [14, 10], 0, 1.5, 2.6, "metal"); signBoard(b, rng, 2, 1.8, 9.5, 0, 1.8, 1.0, "wood", 6); b.weeds(rng, 2, 4, 12, 5, 30, 0);
    });
  }),
  ruin("废弃电影院门脸雨棚破招牌", "影视破败：停业多年的老电影院，二层门脸灰泥剥落，门口雨棚下海报框里只剩褪色残片，竖向大招牌缺了几个字，三扇大门被木板钉死，墙上爬着藤蔓", "现代", "废弃",
    house({ seed: "废弃电影院", pal: { ...PLASTER, wall: "#b5a58e" }, w: 16, d: 14, storeys: 2, hs: 4.2, found: .4, thick: .4, damage: [.2, .35, .3, .35], roof: "flat", roofLoss: .4, doorsAt: [-4.2, 0, 4.2], door: "boarded", doorW: 2.2, doorH: 3.2, windows: 3, win: { w: 1.5, h: 1.8, sill: .8 }, winKind: ["boarded", "glass", "empty"], moss: .4, vines: .6, weeds: .8, patches: 8 }, (b, rng, ctx) => {
      b.box("metal", 0, 4.1, 8.6, 12, .35, 3.2); b.box("woodD", 0, 3.85, 10.1, 12.1, .25, .12);
      for (let k = 0; k < 14; k++) if (rng.chance(.5)) b.sphere("paper", [-6 + k * .92, 3.7, 10.2], .09);
      for (const s of [-1, 1]) b.beam("metal", [s * 5.8, 4.2, 10.0], [s * 5.8, 6.2, 7.05], .06, .06);
      for (const u of [-6.65, -2.1, 2.1, 6.65]) { b.box("woodD", u, 2.0, 7.05, 1.3, 1.9, .08); if (rng.chance(.6)) b.box("paper", u + rng.range(-.1, .1), 2.0 + rng.range(-.1, .1), 7.1, 1.0, rng.range(1.0, 1.7), .02); }
      b.box("woodD", -7.4, 8.0, 7.8, .3, 6.5, 1.4);
      for (let k = 0; k < 5; k++) if (!rng.chance(.35)) b.box(k % 2 ? "rust" : "paper", -7.23, 5.6 + k * 1.2, 7.8, .04, .8, .9);
      for (let k = 0; k < 3; k++) b.vine(rng, ctx.frames[0]!, 1, ctx.t / 2, rng.range(-7, 7), .4, rng.range(4, 7));
    })),
  ruin("民国老街旧店面三连", "影视破败：一排三间民国风格的旧店铺，二层灰砖外墙，卷帘半塌、木板门歪挂，招牌褪色残缺，二楼小阳台栏杆锈蚀，屋顶瓦片缺了几处，街沿杂草", "现代", "老旧", () => {
    const pal = { ...BRICK, wall: "#a89a82", brick: "#7a5a48" };
    const mk = (seed: string, w: number, roofLoss: number, extra: Partial<HouseCfg>) => ruinHouse({ seed, pal, w, d: 9, storeys: 2, hs: 3.4, found: .25, thick: .3, damage: [.2, .35, .3, .3], roof: "gable", ridge: "z", rise: 1.8, roofLoss, door: "ajar", doorW: 1.5, doorH: 2.5, windows: 2, win: { w: 1.1, h: 1.5, sill: .9 }, winKind: ["shutter", "boarded"], moss: .3, weeds: .5, patches: 6, ...extra });
    return withProps([...placeParts(mk("店甲", 6, .2, { door: "missing", doorW: 3.0, doorH: 2.8 }), -6.5, 0, 0), ...placeParts(mk("店乙", 5, .35, { door: "hanging" }), -1.0, 0, 0), ...placeParts(mk("店丙", 7, .5, { door: "boarded", storeys: 3 }), 5.0, 0, 0)], pal, "老街旧店面p", (b, rng) => {
      b.group("awn", "褪色遮阳篷", "#9a4a3c", { roughness: 1 });
      signBoard(b, rng, -6.5, 3.1, 4.75, 0, 3.6, .7, "wood", rng.range(-4, 4)); signBoard(b, rng, -1.0, 3.1, 4.75, 0, 3.0, .7, "woodD", rng.range(-4, 4)); signBoard(b, rng, 5.0, 3.1, 4.75, 0, 4.0, .7, "wood", rng.range(-4, 4));
      for (const [x, w] of [[-6.5, 4.4], [5.0, 5.2]] as [number, number][]) b.plate("awn", [x - w / 2, 2.9, 4.6], [x + w / 2, 2.9, 4.6], [x + w / 2, 2.35, 6.2], [x - w / 2, 2.35, 6.2], .02);
      b.box("metal", -6.5, 2.35, 4.7, 2.8, .9, .07); b.box("metal", -6.5, 1.6, 4.7, 2.8, .12, .1);
      for (const x of [-1.0, 5.0]) { b.box("woodD", x, 3.7, 5.0, 2.4, .1, 1.0); for (let k = 0; k <= 6; k++) b.beam("metal", [x - 1.15 + k * .38, 3.75, 5.45], [x - 1.15 + k * .38, 4.6, 5.45], .03, .03); b.beam("metal", [x - 1.15, 4.6, 5.45], [x + 1.15, 4.6, 5.45], .04, .04); }
      b.weeds(rng, 0, 5.3, 10, .7, 30, 0);
    });
  }),
  ruin("土地庙废墟残神龛", "影视破败：路边荒废的小土地庙，屋顶塌了一大半、山墙斜出，里面神龛石台上残缺的神像，门前石香炉倒在地上，旁边老树和断碑，藤蔓爬墙", "中式", "废弃",
    house({ seed: "土地庙废墟", pal: CN, w: 4.2, d: 3.6, hs: 2.8, found: .45, thick: .35, damage: [.25, .45, .4, .45], roof: "gable", roofLoss: .6, rise: 1.2, door: "missing", doorW: 1.6, doorH: 2.2, windows: 0, moss: .8, vines: .7, weeds: 1, rubble: .8, patches: 5 }, (b, rng, ctx) => {
      b.box("stone", 0, ctx.found + .4, -.9, 1.6, .8, .9); b.box("wallB", 0, ctx.found + 1.15, -.9, .5, .7, .4); b.sphere("wallB", [0, ctx.found + 1.65, -.9], .22);
      pillar(b, "stone", 1.1, 3.0, 0, .55, .32, { sides: 8, lean: [.25, .1] }); b.tbox("stone", [-.9, .22, 3.4], [.7, .44, .6], 30, 0, 80);
      tree(b, rng, 4.6, -2.6, 6); tree(b, rng, -3.8, 3.8, 3.6, { dead: true }); stele(b, rng, -2.4, 3.6, 0, 20, .8); b.weeds(rng, 0, 3, 4, 3, 26, 0);
    })),
  ruin("焚毁大宅院三进残垣", "影视破败：被大火烧毁的老式大宅院，后堂、两侧厢房和门楼只剩焦黑的砖墙和烧断的梁架，屋顶几乎全塌，院里堆着瓦砾与烧塌的梁柱，院墙缺口很多", "中式", "废弃", () => {
    const hall = (seed: string, w: number, d: number, dm: [number, number, number, number]) => ruinHouse({ seed, pal: CN, w, d, hs: 4, found: .5, thick: .5, damage: dm, burnt: true, roof: "gable", roofLoss: .9, frameLoss: .5, door: "missing", doorW: 1.6, doorH: 3, windows: 3, win: { w: 1.2, h: 1.6, sill: 1 }, winKind: "empty", soot: 1.2, rubble: 1.2, weeds: .7, patches: 6 });
    return withProps([...placeParts(hall("焚毁后堂", 14, 7, [.35, .5, .4, .45]), 0, 0, -10), ...placeParts(hall("焚毁左厢", 10, 4.6, [.4, .5, .45, .5]), -9, 0, 0, 90), ...placeParts(hall("焚毁右厢", 10, 4.6, [.4, .5, .45, .5]), 9, 0, 0, 270), ...placeParts(hall("焚毁门楼", 5, 3.4, [.3, .4, .35, .4]), 0, 0, 9)], CN, "焚毁大宅院p", (b, rng) => {
      freeWall(b, rng, [-12, 9], [-3, 9], 0, 2.6, .5, .5, ["soot", "wallB"]); freeWall(b, rng, [3, 9], [12, 9], 0, 2.6, .5, .5, ["soot", "wallB"]);
      b.heap(rng, 0, 0, 0, 3, 1.2, ["soot", "rubble", "woodD"], 40);
      for (let k = 0; k < 9; k++) b.tbox("woodD", [rng.range(-4, 4), .25, rng.range(-3, 5)], [rng.range(2, 4), .28, .28], rng.range(0, 180), 0, rng.range(-8, 8));
      for (let k = 0; k < 4; k++) pillar(b, "woodD", rng.range(-5, 5), rng.range(-4, 3), 0, rng.range(1.2, 3.2), .17, { sides: 6, lean: [rng.range(-.2, .2), rng.range(-.2, .2)] });
      b.weeds(rng, 0, 0, 9, 8, 36, 0);
    });
  }),
];
