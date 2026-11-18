import { part, type ModelPart } from "../assetModelParts";
import { Builder, fillOpening, lantern, palette, pillar, railRect, roofAt, standardGroups, wallRun, type Hole } from "./chineseArchKit";
import { roofHeight, type RoofKitInput, type RoofStyle } from "./chineseRoofKit";
import { design, type ArchitecturePrototype } from "./structures";

export const chineseStreetHeroBatchOneDesigns: ArchitecturePrototype[] = [
  design("歇山叠檐挑廊栏杆二层临街铺楼", "古街样板：底层三开间格门配柱枋与匾额，腰檐挑出翘角并围一圈栏杆回廊，二层退进小室顶覆歇山上檐，檐角挂宫灯；沿街成排排布的主力铺楼", () => shopHouse({ W: 9, D: 8, bays: 3, upperW: 5.6, upperD: 4.6, upperStyle: "xieshan" }), "建筑", "中式"),
  design("攒尖宝顶窄面双开间二层街楼", "古街样板：窄面双开间底层铺面，腰檐翘角围栏回廊，二层小室顶覆攒尖宝顶方亭式屋面；夹在铺楼之间的窄面街楼", () => shopHouse({ W: 6.4, D: 7, bays: 2, upperW: 4, upperD: 4, upperStyle: "hip", spire: true }), "建筑", "中式"),
  design("五开间歇山宽面二层临街大铺楼", "古街样板：五开间宽面底层格门铺面，通长腰檐与栏杆回廊，二层退进长条楼阁顶覆歇山长脊上檐；街口转角或集市主立面", () => shopHouse({ W: 15, D: 8, bays: 5, upperW: 10.4, upperD: 4.6, upperStyle: "xieshan" }), "建筑", "中式"),
  design("悬山三开间柱枋格门临街大厅铺", "古街样板：三开间落地格门配柱枋，大出檐悬山屋面带瓦垄与压脊鸱吻，山墙粉白；沿街一层大铺、会馆或仓厅", longHall, "建筑", "中式"),
  design("三层叠檐栏杆回廊攒尖街塔楼", "古街样板：三层方塔式街楼，逐层腰檐翘角、栏杆回廊逐层收分，顶层敞亭四面通透顶覆攒尖宝顶；街口标志性望楼", streetTower, "建筑", "中式"),
  design("三间四柱冲天叠檐石牌坊", "古街样板：三间四柱石牌坊，大小额枋夹花板，中间匾额，三座庑殿式小屋面带翘角鸱吻；街口入口或坊门标志", paifang, "建筑", "中式"),
  design("石座挑灯悬笼街灯杆", "古街样板：石座木杆顶挑宫灯，灯笼下挂小灯，夜景沿街等距排布；配合古街样板铺楼使用", streetLamp, "建筑", "中式"),
];

const door = (c: number, w = 1.9, h = 2.9): Hole => ({ c, w, bottom: 0, h });
const win = (c: number, w = 1.2, bottom = 1.2, h = 1.4): Hole => ({ c, w, bottom, h });

type RoofSpec = Omit<RoofKitInput, "width" | "depth">;

// 屋面按平面尺寸自动取脊向：脊线沿较长一边。overhang 为 [x 向, z 向] 出挑，origin 为屋面基线中心。
function localRoof(w: number, d: number, input: RoofSpec) {
  const alongX = w >= d;
  const overhang = input.overhang ? (alongX ? [input.overhang[1], input.overhang[0]] : input.overhang) as [number, number] : undefined;
  return { alongX, input: { ...input, ...(overhang ? { overhang } : {}), width: alongX ? d : w, depth: alongX ? w : d } as RoofKitInput };
}
function roofOver(w: number, d: number, input: RoofSpec, origin: [number, number, number]): ModelPart[] {
  const local = localRoof(w, d, input);
  return roofAt(local.input, origin, local.alongX);
}
// 世界坐标 (x,z) 处屋面高出基线多少，供栏杆落在屋面上。
function roofRise(w: number, d: number, input: RoofSpec, x: number, z: number) {
  const local = localRoof(w, d, input);
  return roofHeight(local.input, local.alongX ? Math.abs(z) : Math.abs(x), local.alongX ? Math.abs(x) : Math.abs(z));
}

type ShopConfig = { W: number; D: number; bays: number; upperW: number; upperD: number; upperStyle: RoofStyle; spire?: boolean };

function shopHouse(cfg: ShopConfig): ModelPart[] {
  const b = standardGroups(new Builder());
  const { W, D, bays } = cfg, y0 = .3, y1 = y0 + 3.5, bayW = W / bays, doorW = Math.min(2.2, bayW - .9);
  b.box("stone", 0, .15, 0, W + .9, .3, D + .9);
  b.box("stone", 0, .075, -D / 2 - .75, Math.min(W - 1, bayW * 1.6 + 1.2), .15, .7);
  // 底层：前墙格门，侧后墙开窗
  const doors = Array.from({ length: bays }, (_, i) => door(-W / 2 + (i + .5) * bayW, doorW));
  wallRun(b, "wall", "x", -D / 2, -W / 2, W / 2, y0, y1, .3, doors);
  for (const hole of doors) fillOpening(b, "x", -D / 2, -1, hole, y0, "door", .3);
  const sides = [-1.9, 1.9].map(c => win(c));
  for (const side of [-1, 1] as const) {
    wallRun(b, "wall", "z", side * W / 2, -D / 2, D / 2, y0, y1, .3, sides);
    for (const hole of sides) fillOpening(b, "z", side * W / 2, side, hole, y0, "window", .3);
  }
  const back = Array.from({ length: bays }, (_, i) => i === Math.floor(bays / 2) ? door(-W / 2 + (i + .5) * bayW, 1.5, 2.7) : win(-W / 2 + (i + .5) * bayW));
  wallRun(b, "wall", "x", D / 2, -W / 2, W / 2, y0, y1, .3, back);
  for (const hole of back) fillOpening(b, "x", D / 2, 1, hole, y0, hole.bottom ? "window" : "door", .3);
  for (let i = 0; i <= bays; i++) pillar(b, -W / 2 + i * bayW, -D / 2 - .2, y0, y1);
  b.box("trim", 0, y1 - .2, -D / 2 - .2, W + .5, .32, .42);
  for (const s of [-1, 1]) b.box("trim", s * (W / 2 + .2), y1 - .2, 0, .42, .32, D + .4);
  b.box("door", 0, y1 - .22, -D / 2 - .44, Math.min(2.6, bayW), .52, .1);
  for (let i = 0; i < bays; i++) lantern(b, -W / 2 + (i + .5) * bayW, y1 - .75, -D / 2 - 1.1);

  // 腰檐：低坡、翼角上翘，兼作二层回廊地面
  const ox = 1.2, oz = 1.3, apron: RoofSpec = { style: "hip", color: palette.tile, overhang: [ox, oz], rise: .5, curve: 1.3, lift: .6, ribs: false };
  const roofY = y1 + .22, railX = W / 2 + ox - 1.1, railZ = D / 2 + oz - 1.1;
  const deck = roofY + roofRise(W, D, apron, railX, 0) - .04;
  const parts: ModelPart[] = [...roofOver(W, D, apron, [0, roofY, 0])];
  railRect(b, -railX, railX, -railZ, railZ, deck);

  // 二层：退进的小室
  const { upperW: UW, upperD: UD } = cfg, base = y1 + .25, top = base + 3.1, floor = roofY + .55;
  const upperFront = UW >= 5
    ? [win(-UW * .32, 1.1, 1.5, 1.3), { c: 0, w: 1.5, bottom: floor - base, h: 2.4 }, win(UW * .32, 1.1, 1.5, 1.3)]
    : [{ c: 0, w: 1.4, bottom: floor - base, h: 2.4 }];
  wallRun(b, "wall", "x", -UD / 2, -UW / 2, UW / 2, base, top, .3, upperFront);
  for (const hole of upperFront) fillOpening(b, "x", -UD / 2, -1, hole, base, hole.bottom > 1.2 ? "window" : "door", .3);
  const upperBack = UW >= 8 ? [-UW * .3, 0, UW * .3].map(c => win(c, 1.3, 1.5, 1.3)) : [win(0, 1.3, 1.5, 1.3)];
  wallRun(b, "wall", "x", UD / 2, -UW / 2, UW / 2, base, top, .3, upperBack);
  for (const hole of upperBack) fillOpening(b, "x", UD / 2, 1, hole, base, "window", .3);
  for (const side of [-1, 1] as const) {
    wallRun(b, "wall", "z", side * UW / 2, -UD / 2, UD / 2, base, top, .3, [win(0, 1.2, 1.5, 1.3)]);
    fillOpening(b, "z", side * UW / 2, side, win(0, 1.2, 1.5, 1.3), base, "window", .3);
  }
  for (const x of [-UW / 2, UW / 2]) for (const z of [-UD / 2, UD / 2]) pillar(b, x, z + (z < 0 ? -.2 : .2), floor, top);
  b.box("trim", 0, top - .2, -UD / 2 - .2, UW + .5, .3, .4);
  b.box("trim", 0, top - .2, UD / 2 + .2, UW + .5, .3, .4);
  const upper: RoofSpec = { style: cfg.upperStyle, color: palette.tile, overhang: [1.0, .9], rise: cfg.spire ? 1.6 : 1.3, lift: .8, ...(cfg.spire ? { spire: true } : {}) };
  parts.push(...roofOver(UW, UD, upper, [0, top + .22, 0]));
  return [...b.parts(), ...parts];
}

function longHall(): ModelPart[] {
  const b = standardGroups(new Builder());
  const W = 12, D = 8, y0 = .4, y1 = y0 + 4.2, bays = 3, bayW = W / bays;
  b.box("stone", 0, .2, 0, W + 1, .4, D + 1);
  b.box("stone", 0, .1, -D / 2 - .8, 7, .2, .8);
  const doors = Array.from({ length: bays }, (_, i) => door(-W / 2 + (i + .5) * bayW, 2.8, 3.4));
  wallRun(b, "wall", "x", -D / 2, -W / 2, W / 2, y0, y1, .32, doors);
  for (const hole of doors) fillOpening(b, "x", -D / 2, -1, hole, y0, "door", .32);
  const back = [win(-4, 1.4, 1.4, 1.5), win(0, 1.4, 1.4, 1.5), win(4, 1.4, 1.4, 1.5)];
  wallRun(b, "wall", "x", D / 2, -W / 2, W / 2, y0, y1, .32, back);
  for (const hole of back) fillOpening(b, "x", D / 2, 1, hole, y0, "window", .32);
  for (const side of [-1, 1] as const) {
    wallRun(b, "wall", "z", side * W / 2, -D / 2, D / 2, y0, y1, .32);
    // 山墙上部补到屋脊下：墙体从檐口升到山尖，由屋面山墙板覆盖外侧
  }
  for (let i = 0; i <= bays; i++) pillar(b, -W / 2 + i * bayW, -D / 2 - .22, y0, y1, .44);
  b.box("trim", 0, y1 - .22, -D / 2 - .22, W + .6, .4, .5);
  b.box("trim", 0, y1 - .22, D / 2 + .22, W + .6, .4, .5);
  for (const s of [-1, 1]) b.box("trim", s * (W / 2 + .22), y1 - .22, 0, .5, .4, D + .5);
  b.box("door", 0, y1 - .24, -D / 2 - .5, 3.2, .62, .1);
  for (let i = 0; i < bays; i++) { lantern(b, -W / 2 + (i + .5) * bayW, y1 - .55, -D / 2 - 1.3, .24); }
  const roof = roofOver(W, D, { style: "gable", color: palette.tile, overhang: [1.0, 1.5], rise: 2.1, curve: 1.6, lift: .5, gableWall: palette.wall }, [0, y1 + .22, 0]);
  return [...b.parts(), ...roof];
}

function streetTower(): ModelPart[] {
  const b = standardGroups(new Builder());
  const parts: ModelPart[] = [];
  const y0 = .4, W1 = 10, h1 = 4.2, W2 = 7, h2 = 3.4, W3 = 4.6, h3 = 3.2;
  b.box("stone", 0, .2, 0, W1 + 1.2, .4, W1 + 1.2);
  b.box("stone", 0, .1, -W1 / 2 - .9, 5.4, .2, .8);
  const y1 = y0 + h1;
  const front = [win(-3, 1.3, 1.5, 1.4), door(0, 2.4, 3.1), win(3, 1.3, 1.5, 1.4)];
  wallRun(b, "wall", "x", -W1 / 2, -W1 / 2, W1 / 2, y0, y1, .32, front);
  for (const hole of front) fillOpening(b, "x", -W1 / 2, -1, hole, y0, hole.bottom ? "window" : "door", .32);
  const around = [win(-2.4, 1.3, 1.5, 1.4), win(2.4, 1.3, 1.5, 1.4)];
  wallRun(b, "wall", "x", W1 / 2, -W1 / 2, W1 / 2, y0, y1, .32, around);
  for (const hole of around) fillOpening(b, "x", W1 / 2, 1, hole, y0, "window", .32);
  for (const side of [-1, 1] as const) { wallRun(b, "wall", "z", side * W1 / 2, -W1 / 2, W1 / 2, y0, y1, .32, around); for (const hole of around) fillOpening(b, "z", side * W1 / 2, side, hole, y0, "window", .32); }
  for (const x of [-W1 / 2, -W1 / 6, W1 / 6, W1 / 2]) pillar(b, x, -W1 / 2 - .22, y0, y1, .42);
  for (const x of [-W1 / 2, W1 / 2]) pillar(b, x, W1 / 2 + .22, y0, y1, .42);
  b.box("trim", 0, y1 - .22, -W1 / 2 - .22, W1 + .6, .38, .48);
  b.box("trim", 0, y1 - .22, W1 / 2 + .22, W1 + .6, .38, .48);
  for (const s of [-1, 1]) b.box("trim", s * (W1 / 2 + .22), y1 - .22, 0, .48, .38, W1 + .5);
  lantern(b, 0, y1 - .9, -W1 / 2 - 1.2, .26);

  const skirt = (overhang: number): RoofSpec => ({ style: "hip", color: palette.tile, overhang: [overhang, overhang], rise: .55, curve: 1.3, lift: .65, ribs: false });
  const roof1 = y1 + .22, inset1 = W1 / 2 + 1.5 - 1.2, deck1 = roof1 + roofRise(W1, W1, skirt(1.5), inset1, 0) - .04;
  parts.push(...roofOver(W1, W1, skirt(1.5), [0, roof1, 0]));
  railRect(b, -inset1, inset1, -inset1, inset1, deck1);

  const base2 = y1 + .25, top2 = base2 + h2, floor2 = roof1 + .55;
  const f2 = [win(-1.8, 1.2, 1.5, 1.3), { c: 0, w: 1.5, bottom: floor2 - base2, h: 2.4 }, win(1.8, 1.2, 1.5, 1.3)];
  wallRun(b, "wall", "x", -W2 / 2, -W2 / 2, W2 / 2, base2, top2, .3, f2);
  for (const hole of f2) fillOpening(b, "x", -W2 / 2, -1, hole, base2, hole.bottom > 1.2 ? "window" : "door", .3);
  const w2 = [win(-1.7, 1.2, 1.5, 1.3), win(1.7, 1.2, 1.5, 1.3)];
  wallRun(b, "wall", "x", W2 / 2, -W2 / 2, W2 / 2, base2, top2, .3, w2);
  for (const hole of w2) fillOpening(b, "x", W2 / 2, 1, hole, base2, "window", .3);
  for (const side of [-1, 1] as const) { wallRun(b, "wall", "z", side * W2 / 2, -W2 / 2, W2 / 2, base2, top2, .3, w2); for (const hole of w2) fillOpening(b, "z", side * W2 / 2, side, hole, base2, "window", .3); }
  for (const x of [-W2 / 2, W2 / 2]) for (const z of [-W2 / 2, W2 / 2]) pillar(b, x, z + (z < 0 ? -.2 : .2), floor2, top2, .38);
  b.box("trim", 0, top2 - .2, -W2 / 2 - .2, W2 + .5, .32, .42);
  b.box("trim", 0, top2 - .2, W2 / 2 + .2, W2 + .5, .32, .42);
  for (const s of [-1, 1]) b.box("trim", s * (W2 / 2 + .2), top2 - .2, 0, .42, .32, W2 + .4);

  const roof2 = top2 + .22, inset2 = W2 / 2 + 1.2 - 1.1, deck2 = roof2 + roofRise(W2, W2, skirt(1.2), inset2, 0) - .04;
  parts.push(...roofOver(W2, W2, skirt(1.2), [0, roof2, 0]));
  railRect(b, -inset2, inset2, -inset2, inset2, deck2);

  // 顶层敞亭：八根柱，柱间坐栏，顶覆攒尖
  const floor3 = deck2 + .1, top3 = floor3 + h3, p = W3 / 2;
  for (const x of [-p, 0, p]) for (const z of [-p, 0, p]) if (x || z) pillar(b, x, z, floor3, top3, .4);
  railRect(b, -p, p, -p, p, floor3, []);
  for (const s of [-1, 1]) { b.box("trim", 0, top3 - .18, s * p, W3 + .6, .34, .4); b.box("trim", s * p, top3 - .18, 0, .4, .34, W3 + .6); }
  parts.push(...roofOver(W3, W3, { style: "hip", color: palette.tile, overhang: [1.3, 1.3], rise: 1.7, curve: 1.7, lift: .85, spire: true }, [0, top3 + .22, 0]));
  return [...b.parts(), ...parts];
}

function paifang(): ModelPart[] {
  const b = standardGroups(new Builder());
  const parts: ModelPart[] = [];
  // 三间四柱不出头：柱顶与大额枋齐平，上承三座庑殿式小屋面；中间高、两侧低。
  const centers = [-5.4, -2.4, 2.4, 5.4], tops = [5.0, 6.0, 6.0, 5.0];
  centers.forEach((x, i) => {
    const top = tops[i]!;
    b.box("stone", x, .3, 0, 1.3, .6, 1.3);
    b.box("stone", x, .6 + (top - .6) / 2, 0, .64, top - .6, .64);
    b.box("stone", x, top + .08, 0, .84, .16, .84);
  });
  const bays: [number, number, number][] = [[-2.4, 2.4, 6.0], [-5.4, -2.4, 5.0], [2.4, 5.4, 5.0]];
  for (const [a, c, top] of bays) {
    const mid = (a + c) / 2, span = c - a, big = top - .3, small = big - 1.25;
    b.box("stone", mid, big, 0, span, .5, .54);
    b.box("stone", mid, small, 0, span, .34, .48);
    b.box("door", mid, (big + small) / 2, 0, span - .7, big - small - .34, .22);
    b.box("trim", mid, (big + small) / 2, -.14, span - .5, big - small - .16, .06);
    const count = Math.round(span / .5);
    for (let i = 0; i < count; i++) b.box("trim", a + .35 + (i + .5) * (span - .7) / count, big - .36, -.3, .2, .24, .12);
  }
  b.box("door", 0, 4.7, -.18, 2.6, 1.0, .1);
  b.box("trim", 0, 4.7, -.26, 2.9, 1.25, .06);
  const roofColor = palette.tile;
  parts.push(...roofOver(4.8, 1.4, { style: "hip", color: roofColor, overhang: [.9, .9], rise: .95, curve: 1.6, lift: .55, ribs: true }, [0, 6.22, 0]));
  for (const s of [-1, 1]) parts.push(...roofOver(3.0, 1.4, { style: "hip", color: roofColor, overhang: [.7, .8], rise: .75, curve: 1.6, lift: .5, ribs: true }, [s * 4.4, 5.22, 0]));
  return [...b.parts(), ...parts];
}

function streetLamp(): ModelPart[] {
  const b = standardGroups(new Builder());
  b.box("stone", 0, .25, 0, .8, .5, .8);
  b.box("stone", 0, .55, 0, .55, .1, .55);
  const parts: ModelPart[] = [
    part("木灯杆", "cylinder", palette.wood, [0, 2.7, 0], [.18, 4.4, .18]),
    part("灯杆顶盖", "cone", palette.tile, [0, 5.28, 0], [.95, .45, .95]),
  ];
  b.box("trim", 0, 4.75, 0, .5, .12, .5);
  lantern(b, 0, 4.95 - .55, 0, .3, 0);
  b.box("trim", 0, 3.7, 0, 1.3, .1, .1);
  for (const x of [-.65, .65]) lantern(b, x, 3.15, 0, .15, .35);
  return [...b.parts(), ...parts];
}
