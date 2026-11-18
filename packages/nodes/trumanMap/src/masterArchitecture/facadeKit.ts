import type { ModelPart } from "../assetModelParts";
import { Builder } from "./chineseArchKit";
import { shade } from "./chineseRoofKit";
import { DEG } from "./partMath";

// 实心体量建筑的立面细化：窗（窗框、玻璃、窗棂、窗台、过梁、百叶窗）、门（门框、门扇、台阶、雨棚）、
// 勒脚、层间带、檐口线脚、墙角壁柱。窗框、玻璃、窗棂用单面四边形（每扇窗约 50 顶点），
// 窗台、线脚、门用长方体；全部按颜色合并进少量 mesh，调用方给出体量、可见面和已有洞口。
export type FacadeLook = "house" | "classical" | "shop" | "industrial" | "modern" | "tech";

export type FacadeStyle = {
  look: FacadeLook;
  /** 窗的开间形式：独立窗洞，或每层一条连续带形窗 */
  windows: "punched" | "ribbon";
  wall: string; trim: string; plinth: string; frame: string; pane: string; door: string; shutter?: string; awning?: string;
  accent?: { color: string; emissive: string; intensity: number };
  win: { w: number; h: number; sill: number; spacing: number };
  door2: { w: number; h: number };
  storey: number;
  band: boolean; cornice: boolean; quoins: boolean; sillLintel: boolean;
  metal: number;
};

/** 立面主题配色与形制；wall 为墙面主色，seed 决定百叶窗、门扇的色相。 */
export function facadeStyle(theme: string | undefined, look: FacadeLook, wall: string, seed: number): FacadeStyle {
  const base = { wall, trim: shade(wall, 1.14), plinth: shade(wall, .7), band: true, cornice: true, quoins: false, sillLintel: true, metal: 0 };
  const dims = (w: number, h: number, sill: number, spacing: number) => ({ w, h, sill, spacing });
  let style: FacadeStyle;
  switch (look) {
    case "classical": style = { ...base, look, windows: "punched", frame: "#f1ede0", pane: "#4d6877", door: seed % 2 ? "#4a3224" : "#2f4a5e", shutter: seed % 3 === 0 ? "#4e6b53" : seed % 3 === 1 ? "#6a3b32" : "#33495f", win: dims(1.0, 1.55, .85, 2.4), door2: { w: 1.3, h: 2.45 }, storey: 3.2, quoins: true }; break;
    case "shop": style = { ...base, look, windows: "punched", frame: "#e9e4d6", pane: "#547384", door: "#3d3128", awning: ["#a8453a", "#2f6a5a", "#b8892f", "#3c5c86"][seed % 4], win: dims(1.3, 1.5, .9, 2.6), door2: { w: 1.4, h: 2.5 }, storey: 3.4 }; break;
    case "industrial": style = { ...base, look, windows: "ribbon", frame: "#4b5559", pane: "#4a6672", door: "#56676b", win: dims(2.0, .85, 3.0, 2.2), door2: { w: 2.8, h: 3.0 }, storey: 4.6, band: false, cornice: false, sillLintel: false, metal: .3 }; break;
    case "modern": style = { ...base, look, windows: "ribbon", frame: "#3b434a", pane: "#4a7288", door: "#2e373d", win: dims(1.6, 1.4, .9, 2.2), door2: { w: 1.5, h: 2.5 }, storey: 3.2, trim: shade(wall, 1.2), cornice: false, sillLintel: false, metal: .35 }; break;
    case "tech": style = { ...base, look, windows: "ribbon", frame: "#aab6c1", pane: "#27485b", door: "#8d9aa6", win: dims(1.6, 1.0, 1.0, 2.2), door2: { w: 1.5, h: 2.5 }, storey: 3.2, band: true, cornice: false, sillLintel: false, metal: .55, accent: { color: "#9fe8ff", emissive: "#5ad4ff", intensity: .9 } }; break;
    default: style = { ...base, look: "house", windows: "punched", frame: "#e6dfcc", pane: "#52707e", door: "#5c4129", shutter: seed % 2 ? "#5b7a5a" : undefined, win: dims(.95, 1.3, .95, 2.1), door2: { w: 1.05, h: 2.15 }, storey: 2.9, cornice: false };
  }
  switch (theme) {
    case "日式": style.frame = "#3f3226"; style.pane = "#e8dfc4"; style.door = "#5a4630"; style.trim = "#6b5642"; style.plinth = "#8d857a"; style.shutter = undefined; style.awning = undefined; style.quoins = false; style.cornice = false; break;
    case "异域": style.frame = "#6a523a"; style.pane = "#2f3b3f"; style.door = "#5d452f"; style.trim = shade(wall, 1.1); style.shutter = undefined; style.cornice = false; style.quoins = false; break;
    case "科幻": style.frame = "#aab6c1"; style.pane = "#27485b"; style.door = "#8d9aa6"; style.metal = .55; style.accent = { color: "#9fe8ff", emissive: "#5ad4ff", intensity: .9 }; style.shutter = undefined; style.awning = undefined; style.sillLintel = false; style.cornice = false; style.quoins = false; break;
    case "赛博朋克": style.frame = "#2d3540"; style.pane = "#1f3b4a"; style.door = "#262d36"; style.metal = .4; style.accent = seed % 2 ? { color: "#ff7ac8", emissive: "#ff3ea5", intensity: 1.1 } : { color: "#7af2ff", emissive: "#27d8ff", intensity: 1.1 }; style.shutter = undefined; style.sillLintel = false; style.cornice = false; style.quoins = false; break;
    case "蒸汽朋克": style.frame = "#6a4a2e"; style.pane = "#3d4f4a"; style.door = "#3a2c22"; style.trim = "#b08a3a"; style.metal = .35; style.shutter = undefined; break;
    case "奇幻": style.frame = "#5d4a3d"; style.pane = "#6c92a6"; style.door = "#6b4a30"; style.shutter = ["#6b4a8c", "#4d7a5b", "#8c4a4a"][seed % 3]; style.quoins = false; break;
    case "废土": style.frame = "#4a4036"; style.pane = "#364247"; style.door = "#5a4a3a"; style.trim = shade(wall, .9); style.shutter = undefined; style.awning = undefined; style.sillLintel = false; style.cornice = false; style.quoins = false; break;
    case "现代": if (look === "house") { style.frame = "#434b52"; style.shutter = undefined; } break;
    default: break;
  }
  return style;
}

export type Volume = { cx: number; cz: number; yaw: number; hx: number; hz: number; y0: number; y1: number; storeys?: number };
/** 面内已有物体占的矩形：切向局部坐标 [t0,t1]（±z 面沿体量局部 x，±x 面沿局部 z）和高度 [y0,y1]（世界）。 */
export type Occupant = { t0: number; t1: number; y0: number; y1: number; /** 已有的窗或门：空壳化时要在墙上开洞 */ kind?: "window" | "door"; part?: ModelPart };
/** 一处门窗洞口：面序号、面内切向区间、高度区间（世界）。空壳化时按它在墙上开洞；color 是原有门扇的颜色（重画门扇时沿用）。 */
export type Opening = { face: number; t0: number; t1: number; y0: number; y1: number; kind: "window" | "door"; color?: string };
/** 面序号：0 = +z（正面）、1 = -z、2 = +x、3 = -x（体量局部坐标）。 */
export type FaceSpec = { exposed: boolean; occupied: Occupant[]; hasDoor?: boolean; windows?: number };

/** 在 Builder 之上加单面四边形：朝向 dirDeg（0 = +z，90 = +x），宽 w 高 h，每个 4 顶点。 */
export class FacadeBuilder extends Builder {
  private readonly known = new Set<string>();
  /** 只登记一次的分组（按颜色现用现登记的门扇组）；登记过就什么都不做，已有的几何不会被清掉。 */
  groupOnce(key: string, name: string, color: string, extra: Partial<ModelPart> = {}) {
    if (!this.known.has(key)) { this.known.add(key); this.group(key, name, color, extra); }
    return this;
  }
  rect(key: string, cx: number, cy: number, cz: number, w: number, h: number, dirDeg: number) {
    const a = dirDeg * DEG, tx = Math.cos(a), tz = -Math.sin(a), hw = w / 2, hh = h / 2, soup = this.soup(key, 4);
    const v = (sx: number, sy: number) => soup.vertex([cx + tx * hw * sx, cy + hh * sy, cz + tz * hw * sx]);
    soup.quad(v(-1, -1), v(1, -1), v(1, 1), v(-1, 1), [Math.sin(a), 0, Math.cos(a)]);
  }
}

export function facadeGroups(b: Builder, style: FacadeStyle) {
  b.group("fTrim", "墙面线脚与窗台", style.trim, { roughness: .88 })
    .group("fPlinth", "勒脚与台阶", style.plinth, { roughness: .95 })
    .group("fFrame", "窗框与窗棂", style.frame, { roughness: .55, metalness: style.metal })
    .group("fPane", "窗格暗面", style.pane, { roughness: .22, metalness: .15 })
    .group("fGlass", "洞口玻璃", style.pane, { roughness: .18, metalness: .1, opacity: .42 })
    .group("fDoor", "门扇", style.door, { roughness: .7, metalness: style.metal * .5 });
  if (style.shutter) b.group("fShutter", "窗扇百叶", style.shutter, { roughness: .8 });
  if (style.awning) b.group("fAwning", "店面遮阳篷", style.awning, { roughness: .85 });
  if (style.accent) b.group("fAccent", "立面灯带", style.accent.color, { emissive: style.accent.emissive, emissiveIntensity: style.accent.intensity, roughness: .4 });
}

/** 在体量的可见面上补门窗与线脚。返回新增的窗数与门数；maxBoxes 限制总盒数（含四边形），避免挤占部件预算。 */
export function dressVolume(b: FacadeBuilder, v: Volume, faces: FaceSpec[], style: FacadeStyle, opts: { door: boolean; seed: number; maxBoxes: number; plinth?: boolean; /** 墙体是空壳：玻璃缩进洞内、门洞敞开 */ hollow?: boolean; /** 记录补出的门窗洞口 */ collect?: Opening[]; /** 已有的门洞（拆掉门扇后）只补门框 */ extraDoors?: Opening[] }): { windows: number; doors: number } {
  const H = v.y1 - v.y0, storeys = Math.max(1, v.storeys ?? Math.round(H / style.storey)), sh = H / storeys;
  const c = Math.cos(v.yaw * DEG), s = Math.sin(v.yaw * DEG);
  let boxes = 0, windows = 0, doors = 0;
  const FACE_DIR = [0, 180, 90, 270];
  const info = (id: number) => id < 2 ? { len: 2 * v.hx, half: v.hz, sign: id === 0 ? 1 : -1, alongX: true } : { len: 2 * v.hz, half: v.hx, sign: id === 2 ? 1 : -1, alongX: false };
  // 面内局部点 (t, n) → 世界 xz；n 为离墙面的外凸距离
  const world = (id: number, t: number, n: number): [number, number] => {
    const f = info(id), lx = f.alongX ? t : f.sign * (f.half + n), lz = f.alongX ? f.sign * (f.half + n) : t;
    return [v.cx + lx * c + lz * s, v.cz - lx * s + lz * c];
  };
  // 长方体：n 为盒心离墙面的外凸距离
  const place = (id: number, key: string, t: number, y: number, n: number, w: number, h: number, d: number) => {
    if (boxes >= opts.maxBoxes) return;
    boxes++;
    const [x, z] = world(id, t, n), f = info(id);
    b.boxYaw(key, x, y, z, f.alongX ? w : d, h, f.alongX ? d : w, v.yaw);
  };
  // 四边形：n 为离墙面的外凸距离（单面，朝外）
  const flat = (id: number, key: string, t: number, y: number, n: number, w: number, h: number) => {
    if (boxes >= opts.maxBoxes) return;
    boxes++;
    const [x, z] = world(id, t, n);
    b.rect(key, x, y, z, w, h, v.yaw + FACE_DIR[id]!);
  };
  const hits = (face: FaceSpec, t0: number, t1: number, y0: number, y1: number, margin: number) => face.occupied.some(o => t1 + margin > o.t0 && t0 - margin < o.t1 && y1 + margin > o.y0 && y0 - margin < o.y1);

  // 一扇窗：外框四条、玻璃、窗棂，加窗台、过梁、百叶窗
  const windowUnit = (id: number, t: number, yc: number, w: number, h: number, step: number) => {
    const ft = Math.min(.09, Math.max(.05, Math.min(w, h) * .06));
    flat(id, opts.hollow ? "fGlass" : "fPane", t, yc, opts.hollow ? -.1 : .02, w, h);
    opts.collect?.push({ face: id, t0: t - w / 2, t1: t + w / 2, y0: yc - h / 2, y1: yc + h / 2, kind: "window" });
    flat(id, "fFrame", t, yc + h / 2 + ft / 2, .045, w + ft * 2, ft); flat(id, "fFrame", t, yc - h / 2 - ft / 2, .045, w + ft * 2, ft);
    flat(id, "fFrame", t - w / 2 - ft / 2, yc, .045, ft, h); flat(id, "fFrame", t + w / 2 + ft / 2, yc, .045, ft, h);
    if (w >= .8) flat(id, "fFrame", t, yc, .035, .05, h);
    if (h >= 1.1) flat(id, "fFrame", t, yc + h * .12, .035, w, .05);
    if (style.sillLintel) { place(id, "fTrim", t, yc - h / 2 - ft - .035, .1, w + .34, .07, .22); place(id, "fTrim", t, yc + h / 2 + ft + .05, .07, w + .3, .1, .14); }
    if (style.shutter && step >= (w + .06) * 2 + .1) for (const side of [-1, 1]) flat(id, "fShutter", t + side * (w / 2 + ft + w * .25), yc, .03, w * .5, h + ft * 2);
    if (style.accent) place(id, "fAccent", t, yc + h / 2 + ft + .08, .06, w + .2, .04, .06);
  };

  // 空壳门洞里的门扇：嵌在墙厚中间（门框、台阶留在外面），带板缝、合页带和把手。
  // 三分之一的门虚掩着绕合页向室内转开，宽门洞做成对开门；hinge 为合页所在侧（-1 在切向起点，+1 在终点）。
  const leaf = (id: number, a: number, z: number, y0: number, y1: number, key: string, hinge: -1 | 1, swing: number) => {
    const W = z - a - .03, H = y1 - y0, T = .055, n0 = -.09, yc = (y0 + y1) / 2;
    if (W < .3 || H < 1 || boxes + 8 > opts.maxBoxes) return;
    const hu = hinge < 0 ? a + .015 : z - .015, rad = swing * DEG;
    // 门扇长轴在面内的方向：(切向, 外凸)；关着时沿切向，转开后向室内（外凸为负）转
    const du = -hinge * Math.cos(rad), dn = -Math.sin(rad);
    const o = world(id, 0, 0), e = world(id, du, dn), yaw = Math.atan2(-(e[1] - o[1]), e[0] - o[0]) / DEG;
    const at = (s: number, side = 0): [number, number] => world(id, hu + du * s + hinge * dn * side, n0 + dn * s - hinge * du * side);
    const [cx, cz] = at(W / 2);
    b.boxYaw(key, cx, yc, cz, W, H, T, yaw); boxes++;
    if (swing === 0) {
      // 关着的门扇：外面一侧画四块镶板的板缝和上下两条合页带
      const nf = n0 + T / 2 + .008, tc = hu + du * W / 2;
      flat(id, "fDoorHw", tc, y0 + H * .36, nf, W - .16, .022); flat(id, "fDoorHw", tc, y0 + H * .7, nf, W - .16, .022);
      if (W >= .75) for (const k of [-1, 1]) flat(id, "fDoorHw", tc + k * W * .22, yc, nf, .022, H - .24);
      for (const f of [.14, .86]) flat(id, "fDoorHw", hu + du * W * .17, y0 + H * f, nf + .004, W * .34, .08);
    }
    // 把手：穿过门扇的一个小方块，离开启边 .12m
    const [hx, hz] = at(W - .12);
    b.boxYaw("fDoorHw", hx, yc - .05, hz, .05, .05, T + .1, yaw); boxes++;
  };
  const doorLeaves = (id: number, a: number, z: number, y0: number, y1: number, color: string | undefined, variant: number) => {
    const own = color && color !== style.door, key = own ? `fLeaf${color}` : "fDoor";
    if (own) b.groupOnce(key, "门扇", color, { roughness: .7, metalness: style.metal * .5 });
    b.groupOnce("fDoorHw", "门板缝与铁件", shade(color ?? style.door, .45), { roughness: .6, metalness: .3 + style.metal * .3 });
    const swing = variant % 3 === 0 ? 24 + (variant % 4) * 18 : 0, mid = (a + z) / 2;
    if (z - a >= 1.7) { leaf(id, a, mid - .005, y0 + .01, y1 - .02, key, -1, swing); leaf(id, mid + .005, z, y0 + .01, y1 - .02, key, 1, 0); }
    else leaf(id, a, z, y0 + .01, y1 - .02, key, variant % 2 ? 1 : -1, swing);
  };

  // 门：优先正面，其次 +x、-x、背面；已有门的建筑不再补门
  let doorFace = -1, doorT = 0, doorW = style.door2.w, doorH = style.door2.h;
  if (opts.door && !faces.some(face => face.hasDoor)) {
    // 先试形制的标准门；窄翼放不下就依次换小一号的门（工业形制的 2.8m 大门放不进窄翼，整栋就没有门了）；
    // 空壳体量最后无视面前的占位硬开一扇小门，免得整栋封死
    const sizes: [number, number][] = [[style.door2.w, style.door2.h], [1.5, Math.min(style.door2.h, 2.5)], [1.1, 2.2], [.9, 2.05]];
    const tries = sizes.map(size => ({ size, strict: true }));
    if (opts.hollow) tries.push({ size: sizes[3]!, strict: false });
    search: for (const { size: [w, h], strict } of tries) {
      if (w > style.door2.w) continue;
      const hh = Math.min(h, Math.max(1.9, sh - .3));
      for (const id of [0, 2, 3, 1]) {
        const face = faces[id]!;
        if (!face.exposed) continue;
        const f = info(id), options = [0, f.len * .18, -f.len * .18, f.len * .3, -f.len * .3];
        const found = options.find(t => Math.abs(t) + w / 2 + .5 < f.len / 2 && (!strict || !hits(face, t - w / 2, t + w / 2, v.y0, v.y0 + hh, .35)));
        if (found !== undefined) { doorFace = id; doorT = found; doorW = w; doorH = hh; break search; }
      }
    }
  }

  faces.forEach((face, id) => {
    if (!face.exposed) return;
    const f = info(id), half = f.len / 2;
    // 带出挑的线脚：±z 面向两端各多伸出一个出挑量盖住墙角，±x 面不伸，墙角处两块盒子不共面叠合
    const run = (p: number) => f.len + (id < 2 ? 2 * p : 0);
    if (opts.plinth !== false) place(id, "fPlinth", 0, v.y0 + .2, .06, run(.12), .4, .12);
    if (style.band && storeys > 1) for (let k = 1; k < storeys; k++) place(id, "fTrim", 0, v.y0 + k * sh, .035, run(.07), .1, .07);
    if (style.cornice) { place(id, "fTrim", 0, v.y1 - .16, .06, run(.12), .3, .12); place(id, "fTrim", 0, v.y1 + .02, .13, run(.26), .1, .26); }
    else if (style.look !== "house") place(id, "fTrim", 0, v.y1 - .08, .05, run(.1), .16, .1);

    // 窗
    if ((face.windows ?? 0) < 2) for (let k = 0; k < storeys; k++) {
      const floor = v.y0 + k * sh, ground = k === 0;
      if (style.windows === "ribbon") {
        // 带形窗：每层一条，门前和已有物体处断开；工业形制贴着层顶做高窗
        const wh = Math.min(style.win.h, sh * .5);
        if (sh < 2 || wh < .5) continue;
        const sill = Math.min(style.win.sill, sh - wh - .5);
        const y0w = style.look === "industrial" ? floor + sh - wh - .45 : floor + sill, yc = y0w + wh / 2;
        const cut = face.occupied.filter(o => o.y1 > y0w - .15 && o.y0 < y0w + wh + .15).map(o => [o.t0 - .15, o.t1 + .15] as [number, number]);
        if (ground && doorFace === id) cut.push([doorT - doorW / 2 - .3, doorT + doorW / 2 + .3]);
        cut.sort((p, q) => p[0] - q[0]);
        const segments: [number, number][] = []; let cursor = -half + .5;
        for (const [a, z] of cut) { if (a - cursor >= 1) segments.push([cursor, Math.min(a, half - .5)]); cursor = Math.max(cursor, z); }
        if (half - .5 - cursor >= 1) segments.push([cursor, half - .5]);
        for (const [a, z] of segments) {
          const w = z - a, t = (a + z) / 2, bars = Math.max(1, Math.round(w / 1.3)), ft = .06;
          flat(id, opts.hollow ? "fGlass" : "fPane", t, yc, opts.hollow ? -.1 : .02, w, wh);
          opts.collect?.push({ face: id, t0: a, t1: z, y0: y0w, y1: y0w + wh, kind: "window" });
          flat(id, "fFrame", t, yc + wh / 2 + ft / 2, .045, w + ft * 2, ft); flat(id, "fFrame", t, yc - wh / 2 - ft / 2, .045, w + ft * 2, ft);
          flat(id, "fFrame", a - ft / 2, yc, .045, ft, wh); flat(id, "fFrame", z + ft / 2, yc, .045, ft, wh);
          for (let i = 1; i < bars; i++) flat(id, "fFrame", a + w * i / bars, yc, .035, .05, wh);
          if (style.accent) place(id, "fAccent", t, y0w + wh + .09, .05, w + .1, .05, .06);
          else place(id, "fTrim", t, y0w - .045, .09, w + .14, .07, .18);
          windows++;
        }
        continue;
      }
      const wh = Math.min(style.win.h, sh - 1.0);
      if (wh < .6) continue;
      const sill = Math.min(style.win.sill, sh - wh - .5), yc = floor + sill + wh / 2;
      const margin = .6, usable = f.len - margin * 2, count = Math.floor(usable / style.win.spacing + .0001);
      if (usable < style.win.w + .2) continue;
      const n = Math.max(1, count), step = usable / n, w = Math.min(style.win.w, step * .62);
      for (let i = 0; i < n; i++) {
        const t = -half + margin + step * (i + .5);
        if (hits(face, t - w / 2 - .15, t + w / 2 + .15, yc - wh / 2 - .1, yc + wh / 2 + .12, .05)) continue;
        if (ground && doorFace === id && Math.abs(t - doorT) < doorW / 2 + w / 2 + .35) continue;
        windowUnit(id, t, yc, w, wh, step);
        windows++;
      }
    }

    // 墙角壁柱（只做在 ±z 面，端头盖住墙角）
    if (style.quoins && id < 2) for (const side of [-1, 1]) place(id, "fTrim", side * (half + .01), v.y0 + H / 2, .015, .3, H, .1);

    // 门
    if (doorFace === id) {
      const dw = doorW, dh = doorH, t = doorT;
      // 空壳：记下洞口（门槛与室内地面齐平），门扇嵌在洞里；实心体量把门扇贴在墙面上
      if (opts.hollow) {
        opts.collect?.push({ face: id, t0: t - dw / 2, t1: t + dw / 2, y0: v.y0 + .1, y1: v.y0 + dh, kind: "door" });
        doorLeaves(id, t - dw / 2, t + dw / 2, v.y0 + .1, v.y0 + dh, undefined, opts.seed + id * 5 + doors);
      } else place(id, "fDoor", t, v.y0 + dh / 2, .045, dw, dh, .07);
      place(id, "fTrim", t - dw / 2 - .07, v.y0 + dh / 2 + .04, .06, .14, dh + .08, .14);
      place(id, "fTrim", t + dw / 2 + .07, v.y0 + dh / 2 + .04, .06, .14, dh + .08, .14);
      place(id, "fTrim", t, v.y0 + dh + .11, .07, dw + .42, .16, .16);
      if (dw >= 1.2 && !opts.hollow) flat(id, "fFrame", t, v.y0 + dh / 2, .085, .05, dh);
      place(id, "fPlinth", t, v.y0 + .09, .34, dw + .7, .18, .6);
      if (style.awning) { place(id, "fAwning", t, v.y0 + dh + .55, .55, dw + 1.4, .1, 1.1); place(id, "fTrim", t - (dw / 2 + .6), v.y0 + dh + .3, .12, .06, .5, .06); place(id, "fTrim", t + (dw / 2 + .6), v.y0 + dh + .3, .12, .06, .5, .06); }
      else if (style.look !== "industrial") place(id, "fTrim", t, v.y0 + dh + .3, .4, dw + .9, .1, .8);
      if (style.accent) place(id, "fAccent", t, v.y0 + dh + .2, .1, dw + .5, .05, .05);
      doors++;
    }
  });
  // 已有的门洞（拆掉原来贴在墙面上的门扇后）：补门框和门楣，门扇改嵌回洞里，颜色沿用原来的
  for (const door of opts.extraDoors ?? []) {
    if (!faces[door.face]?.exposed) continue;
    const t = (door.t0 + door.t1) / 2, dw = door.t1 - door.t0, dh = door.y1 - door.y0, mid = (door.y0 + door.y1) / 2;
    doorLeaves(door.face, door.t0, door.t1, door.y0, door.y1, door.color, Math.abs(Math.round(opts.seed + door.face * 5 + t * 3)));
    place(door.face, "fTrim", door.t0 - .07, mid + .04, .06, .14, dh + .08, .14);
    place(door.face, "fTrim", door.t1 + .07, mid + .04, .06, .14, dh + .08, .14);
    place(door.face, "fTrim", t, door.y1 + .11, .07, dw + .42, .16, .16);
  }
  return { windows, doors };
}
