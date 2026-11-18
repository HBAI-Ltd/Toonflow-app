import type { AssetState, AssetTheme } from "../sceneDocument";
import type { ModelPart } from "../assetModelParts";
import { Rng, ruinBuilder, type Hole, type Pal, type RuinBuilder } from "./ruinKit";
import { acUnit, banner, pillar, sandbags } from "./ruinProps";
import { BRICK, CN, CONCRETE, EURO, film } from "./ruinCommon";
import type { ArchitecturePrototype } from "./structures";

// 影视外景置景·背撑立面：片场常见的“只有一面”的街景，薄墙带真门窗洞，墙后有立杆、横档和斜撑落地并压沙袋，
// 墙面不自带地皮；立面朝 +z，背面看得到背撑。门窗里不做室内，镜头只拍正面。
/** bands 是自下而上各段墙的高度（缺省按层数等分）；洞口按高度落进各段，一段里同一横向位置只能有一个洞口。 */
type FacadeCfg = { seed: string; pal: Pal; w: number; storeys: number; hs: number; holes: Hole[]; keys?: string[]; thick?: number; bands?: number[] };
type FacadeCtx = { w: number; H: number; hs: number; t: number };

function facade(cfg: FacadeCfg, decor: (b: RuinBuilder, rng: Rng, c: FacadeCtx) => void): ModelPart[] {
  const rng = new Rng(cfg.seed), b = ruinBuilder(cfg.pal), t = cfg.thick ?? .18, bands = cfg.bands ?? Array.from({ length: cfg.storeys }, () => cfg.hs), H = bands.reduce((s, v) => s + v, 0), W = cfg.w;
  b.group("awn", "红色遮阳篷", "#a33a30", { roughness: 1 }).group("awnW", "白色遮阳篷", "#e2dccb", { roughness: 1 }).group("sign", "招牌底", "#2f3b34", { roughness: .8 })
    .group("lamp", "灯箱与霓虹", "#ffe3a8", { emissive: "#ffd78a", emissiveIntensity: .9, roughness: .4 }).group("red", "红漆与灯笼", "#b3342c", { roughness: .7 })
    .group("shut", "百叶窗", "#4d6b55", { roughness: .8 }).group("gold", "描金", "#c9a45a", { roughness: .5, metalness: .4 });
  const tops: number[] = [];
  for (let y0 = 0, k = 0; k < bands.length; k++) { const h = bands[k]!; b.wallRun(rng, { x: 0, z: 0, yaw: 0 }, -W / 2, W / 2, y0, h, t, cfg.holes.filter(o => o.y0 >= y0 - .01 && o.y1 <= y0 + h + .01), { damage: 0, keys: cfg.keys ?? ["wall"], lintels: 1 }); y0 += h; tops.push(y0); }
  for (const h of cfg.holes) if (h.kind === "window") {
    b.plate("glass", [h.u - h.w / 2, h.y0, 0], [h.u + h.w / 2, h.y0, 0], [h.u + h.w / 2, h.y1, 0], [h.u - h.w / 2, h.y1, 0], .01);
    b.beam("woodD", [h.u, h.y0, .02], [h.u, h.y1, .02], .04, .05); b.beam("woodD", [h.u - h.w / 2, (h.y0 + h.y1) / 2, .02], [h.u + h.w / 2, (h.y0 + h.y1) / 2, .02], .04, .05);
    b.beam("stone", [h.u - h.w / 2 - .1, h.y0 - .04, t / 2 + .08], [h.u + h.w / 2 + .1, h.y0 - .04, t / 2 + .08], .2, .08);
  }
  decor(b, rng, { w: W, H, hs: cfg.hs, t });
  // 背撑：立杆通高、每层一道横档、立杆上部斜撑落地，脚下压沙袋
  const n = Math.max(2, Math.round(W / 2.6)), zb = -t / 2 - .06;
  for (let k = 0; k <= n; k++) {
    const x = -W / 2 + .3 + (W - .6) * k / n;
    b.beam("wood", [x, 0, zb], [x, H - .1, zb], .09, .12); b.beam("wood", [x, H * .72, zb - .04], [x, 0, zb - H * .5], .08, .1);
    b.beam("wood", [x, H * .36, zb - .04], [x, H * .36, zb - H * .25], .06, .06); sandbags(b, rng, x, zb - H * .5 - .3, 0, 4, "cloth");
  }
  for (const y of tops) b.beam("wood", [-W / 2 + .1, y - .25, zb], [W / 2 - .1, y - .25, zb], .1, .1);
  return b.parts();
}

const set = (name: string, purpose: string, theme: AssetTheme, state: AssetState, cfg: FacadeCfg, decor: (b: RuinBuilder, rng: Rng, c: FacadeCtx) => void, extra: string[]): ArchitecturePrototype =>
  film(name, purpose, theme, state, () => facade(cfg, decor), ["背撑立面", "立面", "外景置景", "片场搭景", "街景", ...extra]);
const win = (u: number, w: number, y0: number, y1: number, arch?: "round"): Hole => ({ u, w, y0, y1, kind: "window", ...(arch ? { arch } : {}) });
const door = (u: number, w: number, y1: number, arch?: "round" | "pointed"): Hole => ({ u, w, y0: 0, y1, kind: "door", ...(arch ? { arch } : {}) });

export const backlotFacadeDesigns: ArchitecturePrototype[] = [
  set("古街店铺背撑立面二层木构铺面", "影视置景·古装街景：一段二层古街铺面的立面，粉墙开着宽阔铺面和小门，木柱横梁撑出挂瓦腰檐，二层三扇格窗，屋顶挂瓦檐口，竖招幌子和红灯笼，墙后立杆斜撑压着沙袋", "中式", "原始",
    { seed: "古街店铺背撑立面", pal: { ...CN, wall: "#d8d0bc" }, w: 14, storeys: 2, hs: 3.4, holes: [door(-3.0, 3.4, 2.8), door(3.6, 1.2, 2.5), win(-4.5, 1.3, 4.2, 5.6), win(0, 1.3, 4.2, 5.6), win(4.5, 1.3, 4.2, 5.6)] },
    (b, rng) => {
      for (const x of [-4.8, -1.2]) pillar(b, "wood", x, .28, 0, 3.4, .14, { sides: 8 });
      b.beam("woodD", [-5.0, 3.0, .26], [-1.0, 3.0, .26], .22, .26);
      b.plate("tile", [-6, 3.5, .1], [6, 3.5, .1], [6, 3.1, 1.3], [-6, 3.1, 1.3], .04); b.beam("tileD", [-6.2, 3.56, .1], [6.2, 3.56, .1], .14, .1);
      for (const x of [-5.4, -3.0, -.6, 3.0, 5.4]) b.beam("woodD", [x, 3.0, .12], [x, 3.4, 1.1], .08, .08);
      b.plate("tile", [-7.4, 7.0, .1], [7.4, 7.0, .1], [7.4, 6.6, 1.5], [-7.4, 6.6, 1.5], .05); b.beam("tileD", [-7.5, 7.06, .1], [7.5, 7.06, .1], .18, .14);
      for (const x of [-4.5, 0, 4.5]) { for (const s of [-.45, .45]) b.beam("woodD", [x + s, 4.2, .05], [x + s, 5.6, .05], .04, .05); for (const y of [4.5, 5.1]) b.beam("woodD", [x - .65, y, .05], [x + .65, y, .05], .03, .04); }
      b.beam("woodD", [6.6, 4.9, .1], [6.6, 4.9, .95], .06, .06); b.box("woodD", 6.6, 3.9, .95, .1, 1.7, .5); b.box("red", 6.6, 3.9, .985, .02, 1.4, .36);
      for (const x of [-4.2, -1.8]) { b.sphere("red", [x, 2.75, .95], .2); b.beam("woodD", [x, 2.95, .95], [x, 3.12, .95], .015, .015); }
      b.box("sign", -3.0, 3.3, .2, 3.0, .45, .06); for (let k = 0; k < 4; k++) if (!rng.chance(.2)) b.box("gold", -4.1 + k * .75, 3.3, .24, .4, .3, .02);
    }, ["古装街", "铺面", "店铺", "老街"]),

  set("民国街背撑立面三层砖楼阳台", "影视置景·民国街景：一段三层砖楼的立面，红砖墙配水泥线脚，底层铺面带条纹遮阳篷和招牌灯箱，二层中间挑出铁栏阳台，二三层拱窗各三扇，顶上厚重檐口，墙后立杆斜撑压着沙袋", "现代", "原始",
    { seed: "民国街背撑立面", pal: { ...BRICK, wall: "#a2654f", brick: "#8a523f" }, w: 12, storeys: 3, hs: 3.2, keys: ["brick", "wall", "brick"], holes: [door(-3.0, 4.0, 2.7), door(3.5, 1.3, 2.5), win(-4, 1.2, 4.2, 5.8, "round"), win(0, 1.2, 4.2, 5.8, "round"), win(4, 1.2, 4.2, 5.8, "round"), win(-4, 1.2, 7.4, 9.0, "round"), win(0, 1.2, 7.4, 9.0, "round"), win(4, 1.2, 7.4, 9.0, "round")] },
    (b) => {
      b.box("wallC", 0, 3.2, .12, 12.3, .22, .3); b.box("wallC", 0, 6.4, .12, 12.3, .2, .26); b.box("wallC", 0, 9.6, .18, 12.6, .42, .5);
      b.box("sign", -3.0, 3.0, .14, 4.4, .75, .1); for (let k = 0; k < 6; k++) b.box("lamp", -4.6 + k * .6, 3.0, .21, .4, .45, .02);
      for (let k = 0; k < 8; k++) b.plate(k % 2 ? "awnW" : "awn", [-5 + k * .5 - .0, 2.7, .1], [-4.5 + k * .5, 2.7, .1], [-4.5 + k * .5, 2.25, 1.3], [-5 + k * .5, 2.25, 1.3], .02);
      b.box("stone", 0, 3.35, .65, 3.4, .14, 1.0); for (let k = 0; k <= 8; k++) b.beam("metal", [-1.6 + k * .4, 3.42, 1.1], [-1.6 + k * .4, 4.35, 1.1], .03, .03);
      b.beam("metal", [-1.6, 4.35, 1.1], [1.6, 4.35, 1.1], .05, .05); for (const s of [-1, 1]) b.beam("metal", [s * 1.6, 3.42, .15], [s * 1.6, 4.35, 1.1], .04, .04);
      for (const x of [-6.0, 6.0]) b.box("wallC", x, 4.8, .12, .5, 9.6, .3);
    }, ["民国", "老上海", "砖楼"]),

  set("现代街角店面背撑立面玻璃橱窗", "影视置景·现代街景：一段两层沿街商铺的立面，底层整面玻璃橱窗配招牌灯箱、旁边一扇半拉起的卷帘门，二层四扇玻璃窗外挂着空调外机和管线，墙后立杆斜撑压着沙袋", "现代", "原始",
    { seed: "现代街角店面背撑立面", pal: CONCRETE, w: 12, storeys: 2, hs: 3.6, holes: [door(-1.0, 7.0, 3.0), door(4.7, 1.3, 2.4), win(-4.5, 1.6, 4.6, 6.2), win(-1.5, 1.6, 4.6, 6.2), win(1.5, 1.6, 4.6, 6.2), win(4.5, 1.6, 4.6, 6.2)] },
    (b, rng) => {
      b.plate("glass", [-4.5, .15, 0], [2.5, .15, 0], [2.5, 3.0, 0], [-4.5, 3.0, 0], .01); for (const x of [-4.5, -2.75, -1.0, .75, 2.5]) b.beam("metal", [x, .1, .03], [x, 3.0, .03], .06, .08);
      b.beam("metal", [-4.5, 1.0, .03], [2.5, 1.0, .03], .05, .06);
      b.box("sign", -1.0, 3.35, .12, 7.4, .85, .12); for (let k = 0; k < 7; k++) b.box("lamp", -3.9 + k * 1.05, 3.35, .2, .8, .5, .02);
      b.box("metal", 4.7, 2.65, .1, 1.4, .5, .14); for (let k = 0; k < 6; k++) b.box("metal", 4.7, 1.3 + k * .18, .06, 1.25, .12, .04);
      b.plate("awnW", [-4.7, 3.0, .1], [2.7, 3.0, .1], [2.7, 2.65, 1.2], [-4.7, 2.65, 1.2], .02);
      acUnit(b, -4.5, 3.3, .35, 0); acUnit(b, 1.5, 3.4, .35, 0); b.beam("soot", [-4.0, 3.3, .1], [4.9, 4.2, .1], .02, .02); b.beam("metal", [5.5, .2, .12], [5.5, 7.0, .12], .08, .08);
      for (const x of [-4.5, -1.5, 1.5, 4.5]) b.box("stone", x, 4.55, .12, 1.8, .08, .2);
      void rng;
    }, ["现代", "商铺", "橱窗", "街角"]),

  set("城门楼背撑立面拱门箭楼", "影视置景·古装城池：一段城墙与城门楼的立面，青砖墙中开半圆拱门洞，门洞两扇包钉大门半开，门楼上有匾额和三扇箭窗，墙顶一排垛口和挂瓦飞檐，两侧红旗，墙后立杆斜撑压着沙袋", "中式", "原始",
    { seed: "城门楼背撑立面", pal: { ...CN, wall: "#8d8a80", stone: "#7a776d" }, w: 18, storeys: 2, hs: 5.5, bands: [7, 4], keys: ["wallB", "stone", "wall"], holes: [door(0, 5.0, 6.2, "round"), win(-3, 1.2, 8.2, 9.8), win(0, 1.2, 8.2, 9.8), win(3, 1.2, 8.2, 9.8)] },
    (b, rng, c) => {
      for (let k = 0; k < 16; k++) b.box("wallB", -8.25 + k * 1.1, c.H + .5, 0, .7, 1.0, c.t + .1);
      b.tbox("wood", [-2.5, 2.4, 1.2], [2.4, 4.8, .22], 80, 0, 0); b.tbox("wood", [2.5, 2.4, 1.2], [2.4, 4.8, .22], -80, 0, 0);
      for (const [x, yaw] of [[-2.5, 80], [2.5, -80]] as [number, number][]) for (const y of [.8, 2.4, 4.0]) b.tbox("gold", [x, y, 1.2], [2.42, .14, .26], yaw, 0, 0);
      b.box("woodD", 0, 7.2, .15, 3.0, .9, .1); b.box("gold", 0, 7.2, .21, 2.6, .55, .02);
      b.plate("tile", [-6.5, c.H + 1.3, .1], [6.5, c.H + 1.3, .1], [7.3, c.H - .2, 2.2], [-7.3, c.H - .2, 2.2], .06); b.beam("tileD", [-6.6, c.H + 1.36, .1], [6.6, c.H + 1.36, .1], .2, .16);
      for (const x of [-6.0, -3.0, 3.0, 6.0]) b.beam("woodD", [x, c.H - .1, .12], [x, c.H + .1, 1.9], .1, .1);
      for (const x of [-7.8, 7.8]) banner(b, rng, x, 2.5, .5, 5, "red");
    }, ["城门", "城墙", "古装城池"]),

  set("欧式街背撑立面三层石砌带百叶窗", "影视置景·欧式街景：一段三层石砌楼房的立面，底层拱形门洞和橱窗、壁柱分格，上两层四扇长窗配绿色百叶窗和铸铁阳台，顶上檐口，墙后立杆斜撑压着沙袋", "欧式", "原始",
    { seed: "欧式街背撑立面", pal: { ...EURO, wall: "#bfb8a6", stone: "#a49d8c" }, w: 14, storeys: 3, hs: 3.6, keys: ["wall", "wallC", "wall"], holes: [door(-2.5, 1.7, 2.9, "round"), win(2.8, 2.4, .5, 2.8), win(-5, 1.2, 4.5, 6.8), win(-1.7, 1.2, 4.5, 6.8), win(1.7, 1.2, 4.5, 6.8), win(5, 1.2, 4.5, 6.8), win(-5, 1.2, 8.1, 10.4), win(-1.7, 1.2, 8.1, 10.4), win(1.7, 1.2, 8.1, 10.4), win(5, 1.2, 8.1, 10.4)] },
    (b) => {
      for (const x of [-6.8, -3.8, .2, 3.8, 6.8]) b.box("stone", x, 5.4, .12, .5, 10.8, .26);
      b.box("stone", 0, 3.6, .14, 14.2, .24, .34); b.box("stone", 0, 7.2, .14, 14.2, .2, .3); b.box("stone", 0, 10.8, .2, 14.4, .45, .55);
      for (const [x, y] of [[-5, 5.65], [-1.7, 5.65], [1.7, 5.65], [5, 5.65], [-5, 9.25], [-1.7, 9.25], [1.7, 9.25], [5, 9.25]] as [number, number][]) for (const s of [-1, 1]) b.box("shut", x + s * .85, y, .1, .5, 2.4, .06);
      for (const x of [-1.7, 1.7]) { b.box("metal", x, 4.45, .5, 2.0, .06, .8); for (let k = 0; k <= 6; k++) b.beam("metal", [x - .95 + k * .32, 4.5, .88], [x - .95 + k * .32, 5.3, .88], .025, .025); b.beam("metal", [x - .95, 5.3, .88], [x + .95, 5.3, .88], .04, .04); }
      b.beam("metal", [6.6, 6.0, .15], [6.6, 6.0, 1.3], .05, .05); b.beam("metal", [6.6, 6.0, 1.3], [6.6, 5.4, 1.3], .04, .04); b.sphere("lamp", [6.6, 5.3, 1.3], .17);
    }, ["欧洲", "街景", "石砌"]),
];
