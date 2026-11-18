import type { ModelPart } from "../assetModelParts";
import { shade } from "./chineseRoofKit";
import { hingedLeaf } from "./ruinHouse";
import { at, Rng, ruinBuilder, type Frame, type Hole, type P, type RuinBuilder } from "./ruinKit";

// 影视内景置景：三壁一地的开放式布景（背墙、左右墙，正面朝镜头敞开），内净尺寸精确，
// 墙裙、踢脚线、顶线、墙纸竖纹、地板条或地砖都是真几何；门窗洞带门框窗框，窗外有发光的景片、门外有暗景，
// 灯具用发光材质，顶上不封天花（留给灯位），可选外露梁架。坐标：房间中心在原点，背墙在 z=-d/2，镜头在 +z 侧，地面高 0.12m。
export type SetWall = "back" | "left" | "right";
export type SetOpening = {
  wall: SetWall;
  /** 沿墙位置：背墙取 x，左右墙取 z */
  u: number; w: number; kind: "door" | "window"; h?: number; sill?: number;
  leaf?: "closed" | "ajar" | "open" | "none"; backing?: "day" | "night" | "dark" | "none"; curtain?: boolean; muntins?: number;
};
export type SetPal = { wall: string; wainscot?: string; trim?: string; stripe?: string; wood?: string; woodD?: string; floorA: string; floorB?: string; curtain?: string; metal?: string; beam?: string; rug?: string; rugB?: string };
export type SetCfg = {
  seed: string; w: number; d: number; h: number; t?: number; pal: SetPal; floor: "plank" | "tile" | "flag" | "carpet" | "concrete";
  wainscot?: number; stripes?: boolean; openings?: SetOpening[]; beams?: "chinese" | "none"; wallKeys?: string[];
  /** 再省掉的墙（正面本来就敞开） */
  open?: SetWall[]; plank?: number; tileSize?: number; baseboard?: boolean; crown?: boolean;
  /** 脏旧程度 0–1：墙上污渍剥落、裂缝、蛛网、地上污迹 */
  dirt?: number;
  /** 加天花板和灯位格栅（独立材质组），顶上封起来 */
  ceiling?: boolean;
};
export type SetCtx = {
  rng: Rng; y: number; W: number; D: number; H: number; t: number;
  /** 内墙面上一点：沿墙坐标 u（背墙是 x，左右墙是 z）、绝对高度、离墙向室内的距离 */
  wallPoint: (wall: SetWall, u: number, y: number, off?: number) => P;
  /** 靠墙家具面向室内的偏航角 */
  facing: Record<SetWall, number>;
  frames: Record<SetWall, Frame>; tops: Record<SetWall, (u: number) => number>;
};

export function filmGroups(b: RuinBuilder, pal: SetPal) {
  b.group("trim", "踢脚线与顶线", pal.trim ?? shade(pal.wall, .8), { roughness: .8 }).group("wainscot", "墙裙", pal.wainscot ?? shade(pal.wall, .72), { roughness: .8 })
    .group("stripe", "墙纸竖纹", pal.stripe ?? shade(pal.wall, 1.12), { roughness: .9 }).group("floorBase", "地板底层", "#3a2f26", { roughness: .95 })
    .group("floorA", "地面", pal.floorA, { roughness: .75 }).group("floorB", "地面", pal.floorB ?? shade(pal.floorA, .86), { roughness: .78 })
    .group("curtain", "窗帘帷幔", pal.curtain ?? "#8a3f3a", { roughness: 1 }).group("beam", "外露梁架", pal.beam ?? pal.woodD ?? "#3a2c22", { roughness: .9 })
    .group("rug", "地毯", pal.rug ?? "#7a2f2f", { roughness: 1 }).group("rugB", "地毯边", pal.rugB ?? "#c9a45a", { roughness: 1 })
    .group("lamp", "灯具光源", "#ffe3a8", { emissive: "#ffd78a", emissiveIntensity: .9, roughness: .4 }).group("screen", "亮着的屏幕", "#8fd3ff", { emissive: "#6fc2ff", emissiveIntensity: .8, roughness: .3 })
    .group("backingDay", "窗外景片", "#dfeaf3", { emissive: "#dfeaf3", emissiveIntensity: .6, roughness: 1 }).group("backingNight", "窗外夜景片", "#27395c", { emissive: "#3a5590", emissiveIntensity: .35, roughness: 1 })
    .group("dark", "门外暗景", "#17151a", { roughness: 1 }).group("leather", "皮革", "#6b3f2a", { roughness: .6 }).group("steel", "不锈钢", "#aeb4b8", { metalness: .6, roughness: .4 })
    .group("porcelain", "瓷与白漆", "#e9e6dc", { roughness: .3 }).group("red", "红色漆绸", "#a3302a", { roughness: .7 }).group("drape", "白色帷幔", "#e8e6de", { roughness: 1 })
    .group("book1", "书脊", "#7a3b32", { roughness: .9 }).group("book2", "书脊", "#35507a", { roughness: .9 }).group("book3", "书脊", "#8a7a45", { roughness: .9 })
    .group("mirror", "镜面", "#d6e4ea", { roughness: .12, metalness: .22 }).group("liquid", "试剂液体", "#6fbf9a", { roughness: .2, opacity: .7 })
    .group("web", "蛛网", "#d9d9d2", { roughness: 1, opacity: .55 })
    .group("lampRed", "红灯笼光", "#d8443a", { emissive: "#ff5a3a", emissiveIntensity: .85, roughness: .5 }).group("lampWhite", "白灯笼光", "#f2f0e8", { emissive: "#eef0ff", emissiveIntensity: .8, roughness: .5 }).group("paint", "车位线与标线", "#d8c04a", { roughness: .8 })
    .group("lampCold", "冷白灯光", "#e6f2ff", { emissive: "#cfe6ff", emissiveIntensity: .9, roughness: .4 }).group("cork", "软木板", "#b58a5a", { roughness: 1 }).group("hazard", "警示黄", "#d8b020", { roughness: .8 })
    .group("shaft", "月光光柱", "#b8c8ff", { emissive: "#8fa6ff", emissiveIntensity: .25, roughness: 1, opacity: .13 })
    .group("board", "黑板", "#25382e", { roughness: .9 }).group("tatami", "榻榻米草席", "#c4bc86", { roughness: 1 }).group("tatamiB", "榻榻米包边", "#4f5a3a", { roughness: 1 })
    .group("neonP", "粉色霓虹", "#ff6ad8", { emissive: "#ff4fd0", emissiveIntensity: 1, roughness: .4 }).group("neonC", "青色霓虹", "#6aeaff", { emissive: "#3fd8ff", emissiveIntensity: 1, roughness: .4 })
    .group("neonY", "黄色霓虹", "#ffe86a", { emissive: "#ffd93f", emissiveIntensity: 1, roughness: .4 }).group("fire", "火焰", "#ff9a3a", { emissive: "#ff7a1a", emissiveIntensity: 1.1, roughness: .5 })
    .group("glowB", "蓝色冷光", "#8ec8ff", { emissive: "#4fa6ff", emissiveIntensity: 1, roughness: .4 }).group("glowG", "绿色指示灯", "#8dffb0", { emissive: "#3dff7a", emissiveIntensity: 1, roughness: .4 })
    .group("star", "星点与城市灯光", "#fffbe8", { emissive: "#fffbe8", emissiveIntensity: 1, roughness: .5 }).group("water", "水面", "#8fc7e0", { roughness: .1, opacity: .6 })
    .group("gold", "描金与铜饰", "#c9a45a", { roughness: .45, metalness: .45 }).group("ceil", "天花板", "#dcd9d0", { roughness: .95 }).group("rig", "灯位格栅", "#6a6864", { roughness: .7, metalness: .3 })
    .group("signGreen", "安全出口灯箱", "#34c46b", { emissive: "#2fe07a", emissiveIntensity: .9, roughness: .5 });
}

/** 造一间三壁内景；furnish 里摆家具和灯。 */
export function filmSet(cfg: SetCfg, furnish: (b: RuinBuilder, ctx: SetCtx) => void): ModelPart[] {
  const rng = new Rng(cfg.seed), W = cfg.w, D = cfg.d, H = cfg.h, t = cfg.t ?? .2, pal = cfg.pal, y = .12, openings = cfg.openings ?? [];
  const b = ruinBuilder({ wall: pal.wall, brick: shade(pal.wall, .7), stone: shade(pal.wall, .9), wood: pal.wood ?? "#6b5340", woodD: pal.woodD ?? "#2d2823", tile: "#5c615e", thatch: "#a38b5a", metal: pal.metal ?? "#6f6e68" });
  filmGroups(b, pal);
  const frames: Record<SetWall, Frame> = { back: { x: 0, z: -(D / 2 + t / 2), yaw: 180 }, left: { x: -(W / 2 + t / 2), z: 0, yaw: 270 }, right: { x: W / 2 + t / 2, z: 0, yaw: 90 } };
  const flip: Record<SetWall, number> = { back: -1, left: 1, right: -1 }, lenOf: Record<SetWall, number> = { back: W + 2 * t, left: D, right: D }, inner: Record<SetWall, number> = { back: W, left: D, right: D };
  const facing: Record<SetWall, number> = { back: 0, left: 90, right: 270 }, inward: Record<SetWall, P> = { back: [0, 0, 1], left: [1, 0, 0], right: [-1, 0, 0] };
  const pF = (wall: SetWall, u: number, yy: number, n = 0): P => { const [x, z] = at(frames[wall], flip[wall] * u, n); return [x, yy, z]; };
  const wallPoint = (wall: SetWall, u: number, yy: number, off = 0): P => wall === "back" ? [u, yy, -D / 2 + off] : wall === "left" ? [-W / 2 + off, yy, u] : [W / 2 - off, yy, u];
  const walls = (["back", "left", "right"] as SetWall[]).filter(w => !(cfg.open ?? []).includes(w));
  const doorTop = (o: SetOpening) => y + (o.h ?? 2.2), winLo = (o: SetOpening) => y + (o.sill ?? .95), winHi = (o: SetOpening) => winLo(o) + (o.h ?? 1.3);

  // 墙体
  const tops = {} as Record<SetWall, (u: number) => number>;
  for (const wall of walls) {
    const holes: Hole[] = openings.filter(o => o.wall === wall).map(o => o.kind === "door" ? { u: flip[wall] * o.u, w: o.w, y0: 0, y1: doorTop(o), kind: "door" as const } : { u: flip[wall] * o.u, w: o.w, y0: winLo(o), y1: winHi(o), kind: "window" as const });
    const top = b.wallRun(rng, frames[wall], -lenOf[wall] / 2, lenOf[wall] / 2, 0, y + H, t, holes, { damage: 0, keys: cfg.wallKeys ?? ["wall"], lintels: 1 });
    tops[wall] = (u: number) => top(flip[wall] * u);
  }

  // 地面：底层加铺面（地板条、地砖、青砖、地毯或水泥）
  b.box("floorBase", 0, y / 2, 0, W + .02, y, D + .02);
  const yt = y + .002, g = .004, up: P = [0, 1, 0];
  const tile = (key: string, x0: number, x1: number, z0: number, z1: number) => b.quad(key, [x0 + g, yt, z0 + g], [x1 - g, yt, z0 + g], [x1 - g, yt, z1 - g], [x0 + g, yt, z1 - g], up);
  if (cfg.floor === "plank") {
    const pw = cfg.plank ?? .16;
    for (let z = -D / 2; z < D / 2 - .02; z += pw) for (let x = -W / 2 - rng.range(0, 1.2); x < W / 2;) { const len = rng.range(1.1, 2.6), xa = Math.max(-W / 2, x), xb = Math.min(W / 2, x + len); if (xb - xa > .06) tile(rng.chance(.5) ? "floorA" : "floorB", xa, xb, z, Math.min(D / 2, z + pw)); x += len; }
  } else if (cfg.floor === "tile") {
    const ts = cfg.tileSize ?? .45, nx = Math.max(1, Math.round(W / ts)), nz = Math.max(1, Math.round(D / ts));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) tile((i + j) % 2 ? "floorA" : "floorB", -W / 2 + W * i / nx, -W / 2 + W * (i + 1) / nx, -D / 2 + D * j / nz, -D / 2 + D * (j + 1) / nz);
  } else if (cfg.floor === "flag") {
    const fh = .32, fl = .62;
    for (let j = 0, z = -D / 2; z < D / 2 - .01; j++, z += fh) for (let x = -W / 2 - (j % 2 ? fl / 2 : 0); x < W / 2; x += fl) { const xa = Math.max(-W / 2, x), xb = Math.min(W / 2, x + fl); if (xb - xa > .06) tile(rng.pick(["floorA", "floorB", "floorA"]), xa, xb, z, Math.min(D / 2, z + fh)); }
  } else if (cfg.floor === "carpet") { tile("floorA", -W / 2, W / 2, -D / 2, D / 2); tile("floorB", -W / 2 + .25, W / 2 - .25, -D / 2 + .25, D / 2 - .25); tile("floorA", -W / 2 + .4, W / 2 - .4, -D / 2 + .4, D / 2 - .4); }
  else { tile("floorA", -W / 2, W / 2, -D / 2, D / 2); for (let k = 0; k < 7; k++) { const x = rng.range(-W / 2 + .4, W / 2 - 1.2), z = rng.range(-D / 2 + .4, D / 2 - 1.2); tile("floorB", x, x + rng.range(.4, 1.1), z, z + rng.range(.4, 1)); } }

  // 墙面：踢脚线、顶线、墙裙、墙纸竖纹（避开门窗）
  const blocked = (wall: SetWall, y0: number, y1: number): [number, number][] => openings.filter(o => o.wall === wall && (o.kind === "door" ? y0 < doorTop(o) : y0 < winHi(o) && y1 > winLo(o))).map(o => [o.u - o.w / 2 - .03, o.u + o.w / 2 + .03] as [number, number]).sort((p, q) => p[0] - q[0]);
  const spans = (wall: SetWall, y0: number, y1: number): [number, number][] => {
    const half = inner[wall] / 2, out: [number, number][] = []; let cursor = -half;
    for (const [a, c] of blocked(wall, y0, y1)) { if (a - cursor > .05) out.push([cursor, Math.min(a, half)]); cursor = Math.max(cursor, c); }
    if (half - cursor > .05) out.push([cursor, half]);
    return out;
  };
  const strip = (wall: SetWall, u0: number, u1: number, y0: number, y1: number, thick: number, key: string) => { const [px, py, pz] = pF(wall, (u0 + u1) / 2, (y0 + y1) / 2, -t / 2 - thick / 2); b.boxYaw(key, px, py, pz, u1 - u0, y1 - y0, thick, frames[wall].yaw); };
  for (const wall of walls) {
    const half = inner[wall] / 2;
    if (cfg.baseboard !== false) for (const [a, c] of spans(wall, y, y + .12)) strip(wall, a, c, y, y + .12, .03, "trim");
    if (cfg.crown !== false) strip(wall, -half, half, y + H - .12, y + H, .05, "trim");
    if (cfg.wainscot) { for (const [a, c] of spans(wall, y + .12, y + cfg.wainscot)) { strip(wall, a, c, y + .12, y + cfg.wainscot, .03, "wainscot"); strip(wall, a, c, y + cfg.wainscot, y + cfg.wainscot + .045, .05, "trim"); } }
    if (cfg.stripes) {
      const from = y + (cfg.wainscot ? cfg.wainscot + .05 : .14), to = y + H - .14, n = tops[wall];
      for (let u = -half + .1; u < half - .15; u += .36) {
        // 挖掉这一条上被门窗占住的高度区间
        let segs: [number, number][] = [[from, to]];
        for (const o of openings) if (o.wall === wall && u + .12 > o.u - o.w / 2 - .03 && u < o.u + o.w / 2 + .03) { const lo = o.kind === "door" ? 0 : winLo(o) - .03, hi = (o.kind === "door" ? doorTop(o) : winHi(o)) + .05; segs = segs.flatMap(([s0, s1]) => [[s0, Math.min(s1, lo)], [Math.max(s0, hi), s1]] as [number, number][]).filter(([s0, s1]) => s1 - s0 > .12); }
        for (const [s0, s1] of segs) if (s1 <= n(u) - .05) b.quad("stripe", pF(wall, u, s0, -t / 2 - .004), pF(wall, u + .12, s0, -t / 2 - .004), pF(wall, u + .12, s1, -t / 2 - .004), pF(wall, u, s1, -t / 2 - .004), inward[wall]);
      }
    }
  }

  // 门窗：框、窗台、玻璃窗棂、窗帘、窗外景片；门框、门扇、门外暗景
  for (const o of openings) {
    if (!walls.includes(o.wall)) continue;
    const wall = o.wall, f = frames[wall], a = o.u - o.w / 2, c = o.u + o.w / 2, outside = t / 2 + .4;
    if (o.kind === "window") {
      const y0 = winLo(o), y1 = winHi(o), mun = o.muntins ?? 1;
      strip(wall, a - .06, c + .06, y0 - .05, y0, .07, "trim"); strip(wall, a - .06, c + .06, y1, y1 + .06, .07, "trim"); strip(wall, a - .06, a, y0, y1, .07, "trim"); strip(wall, c, c + .06, y0, y1, .07, "trim"); strip(wall, a - .1, c + .1, y0 - .035, y0 + .015, .16, "trim");
      b.plate("glass", pF(wall, a, y0, 0), pF(wall, c, y0, 0), pF(wall, c, y1, 0), pF(wall, a, y1, 0), .01);
      for (let k = 1; k <= mun; k++) { const u = a + (c - a) * k / (mun + 1); b.beam("woodD", pF(wall, u, y0, 0), pF(wall, u, y1, 0), .03, .03); }
      b.beam("woodD", pF(wall, a, (y0 + y1) / 2, 0), pF(wall, c, (y0 + y1) / 2, 0), .03, .03);
      if (o.curtain) {
        const top = y1 + .14, bottom = y0 - y > 1.1 ? y0 - .32 : y + .08, n = -t / 2 - .09;
        for (const side of [-1, 1]) { const e = side < 0 ? a - .15 : c + .15, m = side < 0 ? a + o.w * .3 : c - o.w * .3; b.plate("curtain", pF(wall, e, top, n), pF(wall, m, top, n), pF(wall, m + side * .05, bottom, n - .06), pF(wall, e, bottom + .02, n), .008); }
        b.beam("woodD", pF(wall, a - .22, top + .03, n), pF(wall, c + .22, top + .03, n), .03, .03);
      }
      const back = o.backing ?? "day";
      if (back !== "none") b.quad(back === "night" ? "backingNight" : back === "dark" ? "dark" : "backingDay", pF(wall, a - .3, y0 - .3, outside), pF(wall, c + .3, y0 - .3, outside), pF(wall, c + .3, y1 + .3, outside), pF(wall, a - .3, y1 + .3, outside), inward[wall]);
    } else {
      const y1 = doorTop(o), leaf = o.leaf ?? "closed", uf = flip[wall] * o.u;
      strip(wall, a - .07, a, y, y1, .08, "trim"); strip(wall, c, c + .07, y, y1, .08, "trim"); strip(wall, a - .07, c + .07, y1, y1 + .08, .08, "trim");
      if (leaf === "closed") {
        const [px, py, pz] = pF(wall, o.u, (y + y1) / 2, 0); b.boxYaw("wood", px, py, pz, o.w - .03, y1 - y - .02, .045, f.yaw);
        for (const k of [.3, .68]) strip(wall, a + .08, c - .08, y + (y1 - y) * k, y + (y1 - y) * k + .03, .02, "woodD");
        const [kx, ky, kz] = pF(wall, o.u + o.w / 2 - .12, y + 1.0, -t / 2 - .045); b.sphere("metal", [kx, ky, kz], .035);
      } else if (leaf !== "none") hingedLeaf(b, rng, f, 0, uf - o.w / 2 + .04, false, leaf === "ajar" ? 42 : 88, o.w - .08, y + .02, y1 - y - .04, "wood");
      const back = o.backing ?? "dark";
      if (back !== "none") b.quad(back === "day" ? "backingDay" : back === "night" ? "backingNight" : "dark", pF(wall, a - .1, y, t / 2 + .5), pF(wall, c + .1, y, t / 2 + .5), pF(wall, c + .1, y1 + .1, t / 2 + .5), pF(wall, a - .1, y1 + .1, t / 2 + .5), inward[wall]);
    }
  }

  // 外露梁架（中式厅堂）
  if (cfg.beams === "chinese") {
    const top = y + H, n = Math.max(2, Math.round(D / 2.4));
    for (let k = 0; k <= n; k++) { const z = -D / 2 + .15 + (D - .3) * k / n; b.beam("beam", [-W / 2 - t * .5, top - .32, z], [W / 2 + t * .5, top - .32, z], .26, .34); }
    for (const x of [-W / 4, 0, W / 4]) b.beam("beam", [x, top - .12, -D / 2], [x, top - .12, D / 2], .2, .2);
    for (const s of [-1, 1]) for (let k = 0; k <= n; k++) { const z = -D / 2 + .15 + (D - .3) * k / n; b.box("beam", s * (W / 2 - .12), top - .58, z, .26, .22, .34); }
  }

  // 脏旧：墙面污渍、裂缝、蛛网、地上污迹
  const dirt = cfg.dirt ?? 0;
  if (dirt > 0) {
    for (const wall of walls) {
      const half = inner[wall] / 2, f = frames[wall];
      for (let k = 0, n = Math.round(dirt * inner[wall] / 1.3); k < n; k++) {
        const u = rng.range(-half + .4, half - .4), yy = y + rng.range(.4, Math.max(.6, H - .7)), pw = rng.range(.4, 1.3), ph = rng.range(.3, 1);
        if (yy + ph / 2 > tops[wall](u) - .08 || blocked(wall, yy - ph / 2, yy + ph / 2).some(([a0, c0]) => u + pw / 2 > a0 && u - pw / 2 < c0)) continue;
        b.patch(rng.pick(["damp", "damp", "brick", "wallB"]), rng, f, -1, -t / 2, flip[wall] * u, yy, pw, ph, .012 + rng.next() * .006, 6);
      }
      for (let k = 0, n = Math.round(dirt * inner[wall] / 2.5); k < n; k++) { const u = rng.range(-half + .4, half - .4), yy = y + rng.range(1, Math.max(1.2, H - .5)); if (yy < tops[wall](u) - .2 && !blocked(wall, yy - 1, yy).some(([a0, c0]) => u > a0 - .2 && u < c0 + .2)) b.crack("soot", rng, f, -1, -t / 2, flip[wall] * u, yy, rng.range(.6, 1.5)); }
    }
    for (const [sx, sz] of [[-1, -1], [1, -1]] as [number, number][]) { const cx = sx * W / 2, cz = sz * D / 2, r = rng.range(.5, 1) * (.6 + dirt); b.plate("web", [cx, y + H - .1, cz], [cx - sx * r, y + H - .1, cz], [cx - sx * r * .6, y + H - r * .9, cz], [cx, y + H - r * .7, cz - sz * r * .5], .004); }
    for (let k = 0; k < Math.round(6 * dirt); k++) { const x = rng.range(-W / 2 + .3, W / 2 - .9), z = rng.range(-D / 2 + .3, D / 2 - .9), a = rng.range(.25, .7), c = rng.range(.25, .6); b.quad("dirt", [x, yt + .004, z], [x + a, yt + .004, z + rng.range(0, .1)], [x + a * rng.range(.7, 1), yt + .004, z + c], [x + rng.range(0, .1), yt + .004, z + c * rng.range(.7, 1)], up); }
  }

  furnish(b, { rng, y, W, D, H, t, wallPoint, facing, frames, tops });
  if (cfg.ceiling) {
    b.box("ceil", 0, y + H + .05, 0, W + 2 * t, .1, D + 2 * t);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box("rig", sx * (W / 2 - .1), y + H + .45, sz * (D / 2 - .1), .1, .7, .1);
    for (let x = -W / 2 + .1; x <= W / 2 - .09; x += 1.2) b.box("rig", x, y + H + .8, 0, .05, .05, D - .2);
    for (let z = -D / 2 + .1; z <= D / 2 - .09; z += 1.2) b.box("rig", 0, y + H + .86, z, W - .2, .05, .05);
  }
  return b.parts();
}
