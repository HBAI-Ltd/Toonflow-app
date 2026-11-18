import type { ModelPart } from "../assetModelParts";
import { at, Rng, ruinBuilder, type Frame, type Hole, type P, type Pal, type RuinBuilder } from "./ruinKit";
import { DEG } from "./partMath";

// 破败房屋合成器：外墙（带洞口的断墙）、台基、屋面（缺瓦、塌陷、露椽）、门窗残件、室内地面与瓦砾、苔藓烟熏和杂草，
// 一份配置出一座房子；各座废墟再叠加自己的特殊构件。坐标：房屋中心在原点，+z 为正面，地面 y=0。
export type RoofKind = "gable" | "hip" | "shed" | "flat" | "none";
export type WindowKind = "lattice" | "boarded" | "glass" | "shutter" | "empty";
export type DoorKind = "missing" | "ajar" | "hanging" | "boarded" | "closed" | "gap";
export type Zone = { x: number; z: number; r: number };

export type HouseCfg = {
  seed: string; pal: Pal;
  w: number; d: number; storeys?: number; hs?: number; thick?: number; found?: number;
  /** 四面墙的损毁度 [前, 后, 左, 右]，单个数字表示四面相同 */
  damage?: number | [number, number, number, number];
  roof?: RoofKind; roofKeys?: string[]; roofLoss?: number; frameLoss?: number; rise?: number; overhang?: number; sag?: number; thatch?: boolean; tin?: boolean; ridge?: "x" | "z";
  windows?: number; win?: { w: number; h: number; sill: number }; winKind?: WindowKind | WindowKind[]; door?: DoorKind; doorW?: number; doorH?: number; backDoor?: DoorKind | false;
  /** 正面各门的位置（沿墙 u，缺省居中一扇）、门洞和窗洞的拱形 */
  doorsAt?: number[]; doorArch?: "round" | "pointed"; winArch?: "round" | "pointed";
  /** 正面各层窗的位置（沿墙 u），缺省按 windows 等分；windowsPerWall 逐面（前、后、左、右）给每层窗数 */
  windowsAt?: number[]; windowsPerWall?: [number, number, number, number];
  wallKeys?: string[]; burnt?: boolean; moss?: number; patches?: number; soot?: number; weeds?: number; vines?: number; rubble?: number; floor?: "dirt" | "wood" | "stone" | "none"; trusses?: boolean;
  /** 窗扇和门板用的木料颜色组 */
  wood?: string;
  /** 架在别处的上层（城楼上的楼阁残墙）：不铺脚下的泥土地、周边杂草瓦砾和灌木 */
  elevated?: boolean;
};

export const faceFrames = (W: number, D: number, t: number): Frame[] => [
  { x: 0, z: D / 2 - t / 2, yaw: 0 }, { x: 0, z: -(D / 2 - t / 2), yaw: 180 },
  { x: -(W / 2 - t / 2), z: 0, yaw: 270 }, { x: W / 2 - t / 2, z: 0, yaw: 90 },
];

const bays = (len: number, count: number) => Array.from({ length: count }, (_, k) => -len / 2 + len * (k + .5) / count);
const world = (f: Frame, n0: number) => (u: number, y: number, n = n0): P => { const [x, z] = at(f, u, n); return [x, y, z]; };

/** 绕竖直合页转开的一扇门板或窗扇（由竖条木板拼成，缺几块、短几块）；hingeRight 合页在 +u 侧，openDeg 向室内转开的角度。 */
export function hingedLeaf(b: RuinBuilder, rng: Rng, f: Frame, n0: number, hu: number, hingeRight: boolean, openDeg: number, width: number, y0: number, height: number, key: string, planks = Math.max(3, Math.round(width / .2))) {
  const yaw = f.yaw + (hingeRight ? 180 - openDeg : openDeg), axis = [(hingeRight ? -1 : 1) * Math.cos(openDeg * DEG), -Math.sin(openDeg * DEG)];
  for (let k = 0; k < planks; k++) {
    if (rng.chance(.1)) continue;
    const s = width * (k + .5) / planks, [cx, cz] = at(f, hu + axis[0]! * s, n0 + axis[1]! * s), cut = rng.chance(.25) ? rng.range(.12, height * .5) : 0;
    b.tbox(key, [cx, y0 + (height - cut) / 2, cz], [width / planks - .015, height - cut, .045], yaw);
  }
}

// ---------- 门窗残件 ----------
export function windowDecor(b: RuinBuilder, rng: Rng, f: Frame, n0: number, h: Hole, kind: WindowKind, wood: string) {
  const w = h.w, ht = h.y1 - h.y0, cy = (h.y0 + h.y1) / 2, p = world(f, n0), fw = .07;
  if (kind === "empty") { if (rng.chance(.5)) b.beam(wood, p(h.u - w / 2 + .03, h.y0 + .1), p(h.u - w / 2 + .03, h.y1 - rng.range(0, ht * .6)), .06, .06); return; }
  if (kind === "boarded") {
    const count = rng.int(3) + 3;
    for (let k = 0; k < count; k++) {
      if (rng.chance(.12)) continue;
      const y = h.y0 + ht * (k + .5) / count + rng.range(-.04, .04), tilt = rng.range(-.07, .07), over = rng.range(.02, .12);
      b.beam(wood, p(h.u - w / 2 - over, y - tilt, n0 + .06), p(h.u + w / 2 + over * rng.range(0, 1.5), y + tilt, n0 + .06), .035, .15);
    }
    if (rng.chance(.5)) b.beam(wood, p(h.u - w / 2, h.y0 + .05, n0 + .1), p(h.u + w / 2, h.y1 - .05, n0 + .1), .035, .13);
    return;
  }
  if (kind === "shutter") {
    for (const side of [-1, 1]) if (!rng.chance(.25)) hingedLeaf(b, rng, f, n0, h.u + side * (w / 2 - .02), side > 0, rng.range(25, 80), w / 2 - .03, h.y0 + .02, ht - .04, wood, 2);
    return;
  }
  // 窗框：四边各留七八成
  if (!rng.chance(.12)) b.beam(wood, p(h.u - w / 2, h.y1 - fw / 2), p(h.u + w / 2, h.y1 - fw / 2), .07, fw);
  if (!rng.chance(.35)) b.beam(wood, p(h.u - w / 2, h.y0 + fw / 2), p(h.u + w / 2, h.y0 + fw / 2), .07, fw);
  for (const s of [-1, 1]) if (!rng.chance(.2)) b.beam(wood, p(h.u + s * (w / 2 - fw / 2), h.y0), p(h.u + s * (w / 2 - fw / 2), h.y1 - rng.range(0, ht * .4)), .07, fw);
  if (kind === "lattice") {
    const bars = Math.max(2, Math.round(w / .16));
    for (let k = 1; k < bars; k++) if (rng.chance(.62)) { const u = h.u - w / 2 + w * k / bars, y1 = h.y1 - (rng.chance(.3) ? rng.range(.1, ht * .6) : fw); b.beam(wood, p(u, h.y0 + fw), p(u + rng.range(-.03, .03), y1), .03, .03); }
    if (rng.chance(.6)) b.beam(wood, p(h.u - w / 2, cy), p(h.u + w / 2, cy + rng.range(-.04, .04)), .035, .035);
    if (rng.chance(.55)) { const u = h.u + rng.range(-w / 3, w / 3), y = h.y1 - ht * rng.range(.15, .5); b.plate("paper", p(u - .22, y - .18, n0 + .02), p(u + .2, y - .22, n0 + .02), p(u + .18, y + .16, n0 + .02), p(u - .2, y + .2, n0 + .02), .004); }
  } else {
    // 玻璃窗：一两根窗挺，边角残留几片三角碎玻璃
    if (w > .9 && rng.chance(.7)) b.beam(wood, p(h.u, h.y0 + fw), p(h.u, h.y1 - fw), .04, .04);
    for (let k = 0, n = rng.int(4); k < n; k++) {
      const corner = rng.pick([-1, 1]), u = h.u + corner * (w / 2 - .02), y = rng.chance(.5) ? h.y1 - .02 : h.y0 + .05, d = rng.range(.15, .4), up = y > cy ? -1 : 1;
      b.plate("glass", p(u, y, n0 + .01), p(u - corner * d, y, n0 + .01), p(u, y + up * d * rng.range(.8, 2), n0 + .01), p(u, y + up * d * .4, n0 + .01), .006);
    }
  }
}

export function doorDecor(b: RuinBuilder, rng: Rng, f: Frame, n0: number, h0: Hole, kind: DoorKind, wood: string) {
  // 拱门：门扇只做到起拱线以下，不画横梁门楣
  const h: Hole = h0.arch ? { ...h0, y1: h0.y1 - (h0.arch === "round" ? h0.w / 2 : h0.w * .866) } : h0;
  const w = h.w, dh = h.y1 - h.y0, p = world(f, n0);
  if (kind === "gap") return;
  // 门槛和两侧门框（残缺）
  b.beam(wood, p(h.u - w / 2, h.y0 + .03), p(h.u + w / 2, h.y0 + .03), .16, .07);
  for (const s of [-1, 1]) if (!rng.chance(.18)) b.beam(wood, p(h.u + s * (w / 2 - .05), h.y0), p(h.u + s * (w / 2 - .05), h.y1 - rng.range(0, dh * .45)), .09, .1);
  if (!h0.arch && !rng.chance(.35)) b.beam(wood, p(h.u - w / 2, h.y1 - .05), p(h.u + w / 2, h.y1 - .05 + rng.range(-.05, .05)), .1, .1);
  if (kind === "missing") return;
  if (kind === "boarded") {
    const count = rng.int(3) + 3;
    for (let k = 0; k < count; k++) { const y = h.y0 + .3 + (dh - .5) * (k + .5) / count + rng.range(-.05, .05); b.beam(wood, p(h.u - w / 2 - .08, y - .05, n0 + .06), p(h.u + w / 2 + .1, y + .06, n0 + .06), .04, .17); }
    b.beam(wood, p(h.u - w / 2, h.y0 + .2, n0 + .1), p(h.u + w / 2, h.y1 - .2, n0 + .1), .04, .15);
    return;
  }
  const leafW = w - .1, leafH = dh - .1, planks = Math.max(3, Math.round(leafW / .2));
  if (kind === "closed") {
    for (let k = 0; k < planks; k++) { if (rng.chance(.1)) continue; const u = h.u - leafW / 2 + leafW * (k + .5) / planks, cut = rng.chance(.25) ? rng.range(.2, .7) : 0; b.beam(wood, p(u, h.y0 + .08 + cut * .3), p(u, h.y1 - .06 - cut), .045, leafW / planks - .015); }
    for (const y of [.25, .7]) b.beam(wood, p(h.u - leafW / 2, h.y0 + dh * y, n0 + .04), p(h.u + leafW / 2, h.y0 + dh * y, n0 + .04), .035, .1);
    return;
  }
  const right = rng.chance(.5), hu = h.u + (right ? w / 2 - .06 : -w / 2 + .06);
  if (kind === "ajar") { hingedLeaf(b, rng, f, n0, hu, right, rng.range(30, 78), leafW, h.y0 + .05, leafH, wood, planks); return; }
  // 脱了一边合页、歪挂着的门扇：绕上方合页转一个角度
  const roll = (right ? 1 : -1) * rng.range(18, 40), rad = roll * DEG, off = [(right ? -1 : 1) * leafW / 2, -leafH / 2];
  const du = off[0]! * Math.cos(rad) - off[1]! * Math.sin(rad), dy = off[0]! * Math.sin(rad) + off[1]! * Math.cos(rad), [cx, cz] = at(f, hu + du, n0 + .05);
  b.tbox(wood, [cx, h.y1 - .08 + dy, cz], [leafW, leafH, .05], f.yaw, 0, roll);
  b.beam(wood, p(hu - leafW / 2, h.y0 + .4, n0 + .09), p(hu + leafW / 2, h.y0 + .4, n0 + .09), .03, .1);
}

// ---------- 屋面 ----------
export function roofOf(b: RuinBuilder, rng: Rng, cfg: HouseCfg, base: number, zones: Zone[]) {
  const { w: W, d: D } = cfg, kind = cfg.roof ?? "gable", oh = cfg.overhang ?? .5, loss = cfg.roofLoss ?? .3, frameLoss = cfg.frameLoss ?? loss * .55;
  if (kind === "none" || kind === "flat") return;
  const ridgeX = (cfg.ridge ?? (W >= D ? "x" : "z")) === "x", L = ridgeX ? W : D, S = ridgeX ? D : W, rise = cfg.rise ?? Math.max(1, S * .28), sag = cfg.sag ?? 0;
  const tileKeys = cfg.roofKeys ?? (cfg.thatch ? ["thatch", "thatch", "thatchD"] : cfg.tin ? ["metal", "metal", "rust"] : ["tile", "tile", "tileD", "tileM"]);
  const near = (p: P, k: number) => zones.some(z => (p[0] - z.x) ** 2 + (p[2] - z.z) ** 2 < (z.r * k) ** 2);
  const goneTile = (p: P) => loss >= .98 || near(p, 1), goneRafter = (p: P) => frameLoss >= .98 || near(p, frameLoss >= .6 ? .8 : .5);
  // 屋面坐标：沿脊 a、垂直于脊 c（离脊线的水平距离），映射到世界 xz
  const xz = (a: number, c: number): [number, number] => ridgeX ? [a, c] : [c, a];
  const half = S / 2 + oh, drop = oh * rise / (S / 2), yE = base - drop, yR = base + rise, wood = cfg.burnt ? "woodD" : "wood";
  const segs = Math.max(1, Math.ceil(L / 3)), rL = kind === "hip" ? Math.max(.3, (L - S) / 2) : L / 2 + oh, e0 = -L / 2 - oh, e1 = L / 2 + oh;
  const ridgeY = (a: number) => yR - sag * Math.max(0, 1 - (2 * a / L) ** 2);
  const v = (a: number, c: number, y: number): P => { const [x, z] = xz(a, c); return [x, y, z]; };
  const slopes: [P, P, P, P][] = [];
  if (kind === "shed") slopes.push([v(-L / 2 - oh, half, yE), v(L / 2 + oh, half, yE), v(L / 2 + oh, -half, base + rise * .6), v(-L / 2 - oh, -half, base + rise * .6)]);
  else {
    const cl = (a: number) => Math.max(-rL, Math.min(rL, a));
    for (const side of [-1, 1]) for (let k = 0; k < segs; k++) {
      const lo = e0 + (e1 - e0) * k / segs, hi = e0 + (e1 - e0) * (k + 1) / segs, ra = cl(lo), rb = cl(hi);
      slopes.push([v(lo, side * half, yE), v(hi, side * half, yE), v(rb, 0, ridgeY(rb)), v(ra, 0, ridgeY(ra))]);
    }
    if (kind === "hip") for (const end of [-1, 1]) slopes.push([v(end * (L / 2 + oh), -half, yE), v(end * (L / 2 + oh), half, yE), v(end * rL, 0, yR), v(end * rL, 0, yR)]);
  }
  for (const q of slopes) b.slope(rng, q, { cell: cfg.thatch ? .62 : .85, thick: cfg.thatch ? .11 : .05, keys: tileKeys, gone: goneTile, hole: .05 + loss * .12, rafters: { key: wood, every: cfg.thatch ? 2 : 1, across: .09, up: .13 }, purlin: wood, jitter: cfg.thatch ? .07 : .04 });
  // 茅草檐口下垂的草须
  if (cfg.thatch && kind !== "shed") for (const side of [-1, 1]) for (let a = e0 + .1; a < e1; a += .17) {
    const [x, z] = xz(a, side * half), p: P = [x, yE + .02, z];
    if (!goneTile(p)) b.droop(rng.pick(["thatch", "thatchD"]), rng, p, ridgeX ? [0, side] : [side, 0], .5);
  }
  // 脊檩与屋架：脊线按下垂量折线，塌陷处断开；塌陷后断在中间的脊檩不留（悬空），挂在山墙上的一端垂下来
  if (kind !== "shed") {
    const steps = Math.max(4, Math.round(L / 1.2)), pts: P[] = [];
    for (let k = 0; k <= steps; k++) { const a = -rL + 2 * rL * k / steps; pts.push(v(a, 0, ridgeY(a) - .1)); }
    const runs: P[][] = [[]];
    for (const q of pts) { if (goneRafter(q)) { if (runs[runs.length - 1]!.length) runs.push([]); } else runs[runs.length - 1]!.push(q); }
    for (const run of runs) {
      if (run.length < 2) continue;
      const head = run[0] === pts[0], tail = run[run.length - 1] === pts[pts.length - 1];
      if (!head && !tail) continue;
      const first = run[0]!, last = run[run.length - 1]!, sagEnd = head && tail ? 0 : Math.min(1.3, Math.hypot(last[0] - first[0], last[2] - first[2]) * .3);
      if (head && !tail) b.beam(wood, first, [last[0], last[1] - sagEnd, last[2]], .17, .2);
      else if (tail && !head) b.beam(wood, [first[0], first[1] - sagEnd, first[2]], last, .17, .2);
      else b.beam(wood, first, last, .17, .2);
    }
  }
  if (cfg.trusses !== false && kind !== "hip" && kind !== "shed") {
    const count = Math.max(2, Math.round(L / 2.8) + 1);
    for (let k = 0; k < count; k++) {
      const a = -L / 2 + L * k / (count - 1), ty = base - .15, mid = v(a, 0, ty);
      if (goneRafter(mid)) continue;
      if (rng.chance(.78)) b.beam(wood, v(a, -S / 2, ty), v(a, S / 2, ty + rng.range(-.08, .12)), .16, .2);
      if (rng.chance(.55)) b.beam(wood, mid, v(a, 0, ridgeY(a) - .1), .14, .14);
    }
  }
}

// ---------- 整座房子 ----------
export type HouseCtx = { top: number; found: number; t: number; zones: Zone[]; frames: Frame[]; lens: number[]; /** 四面墙的墙顶高度函数（前、后、左、右） */ tops: ((u: number) => number)[] };

export function ruinHouse(cfg: HouseCfg, extra?: (b: RuinBuilder, rng: Rng, ctx: HouseCtx) => void): ModelPart[] {
  const rng = new Rng(cfg.seed), b = ruinBuilder(cfg.pal);
  const { w: W, d: D } = cfg, t = cfg.thick ?? .4, storeys = cfg.storeys ?? 1, hs = cfg.hs ?? 3.2, found = cfg.found ?? .3, Ht = storeys * hs;
  const dmg: [number, number, number, number] = Array.isArray(cfg.damage) ? cfg.damage : [cfg.damage ?? .3, cfg.damage ?? .3, cfg.damage ?? .3, cfg.damage ?? .3];
  const frames = faceFrames(W, D, t), lens = [W, W, D - 2 * t, D - 2 * t];
  const roofKind = cfg.roof ?? "gable", ridgeX = (cfg.ridge ?? (W >= D ? "x" : "z")) === "x", rise = cfg.rise ?? Math.max(1, (ridgeX ? D : W) * .28);
  const wallKeys = cfg.wallKeys ?? (cfg.burnt ? ["soot", "soot", "wallB"] : ["wall", "wall", "wallB", "wallC"]);
  const wood = cfg.wood ?? (cfg.burnt ? "woodD" : "wood"), win = cfg.win ?? { w: 1, h: 1.25, sill: .95 }, winKinds = Array.isArray(cfg.winKind) ? cfg.winKind : [cfg.winKind ?? "lattice"];
  const y0 = found, doorW = cfg.doorW ?? 1.3, doorH = cfg.doorH ?? 2.3;
  // 台基与室内地面（建筑不再自带伸出墙外的泥土地皮，地面交给地形）
  b.box("stone", 0, found / 2, 0, W + .5, found, D + .5);
  const floorKind = cfg.floor ?? "dirt";
  if (floorKind !== "none") b.box(floorKind === "wood" ? "wood" : floorKind === "stone" ? "rubbleS" : "dirt", 0, y0 + .02, 0, W - 2 * t, .04, D - 2 * t);
  // 塌陷区（屋面和瓦砾堆共用）
  const loss = cfg.roofLoss ?? .3, zoneCount = loss >= .98 ? 0 : Math.round(loss * 3 + (loss > .5 ? 1 : 0)), zones: Zone[] = [];
  for (let k = 0; k < zoneCount; k++) zones.push({ x: rng.range(-W / 2, W / 2) * .8, z: rng.range(-D / 2, D / 2) * .8, r: rng.range(.2, .34) * Math.max(W, D) * (.55 + loss) });
  // 四面墙
  const tops: ((u: number) => number)[] = [];
  frames.forEach((f, id) => {
    const front = id === 0, back = id === 1, len = lens[id]!, alongRidge = ridgeX ? id < 2 : id >= 2;
    const holes: Hole[] = [], perFloor = cfg.windowsPerWall?.[id] ?? cfg.windows ?? (len > 7 ? 3 : len > 4 ? 2 : 1);
    const doorKind: DoorKind | false = front ? cfg.door ?? "ajar" : back ? cfg.backDoor ?? false : false, doorUs = doorKind ? front ? cfg.doorsAt ?? [0] : [len * .18] : [];
    for (const u of doorUs) holes.push({ u, w: doorW, y0, y1: y0 + doorH, kind: "door", ...(cfg.doorArch ? { arch: cfg.doorArch } : {}) });
    for (let k = 0; k < storeys; k++) for (const u of front && cfg.windowsAt ? cfg.windowsAt : bays(len, perFloor)) {
      if (k === 0 && doorUs.some(du => Math.abs(u - du) < doorW / 2 + win.w / 2 + .35)) continue;
      if (rng.chance(.08)) continue;
      holes.push({ u, w: win.w, y0: y0 + k * hs + win.sill, y1: y0 + k * hs + win.sill + win.h, kind: "window", ...(cfg.winArch ? { arch: cfg.winArch } : {}) });
    }
    const gable = !alongRidge && roofKind !== "flat" && roofKind !== "none" && roofKind !== "shed" ? (u: number) => Ht + rise * (1 - Math.abs(u) / (len / 2 + t * .5)) : undefined;
    const damage = dmg[id]!, top = b.wallRun(rng, f, -len / 2, len / 2, y0, gable ? Ht + rise : Ht, t, holes, { damage, keys: wallKeys, ...(gable ? { gable } : {}), floor: Math.min(.6, Ht * .2), lintels: 1 - damage * .6 });
    tops.push(top);
    // 洞口残件
    for (const h of holes) {
      if (h.kind === "door") doorDecor(b, rng, f, 0, h, doorKind as DoorKind, wood);
      else if (h.arch) { const p = world(f, 0); for (let m = 1; m < 3; m++) if (rng.chance(.7)) { const u = h.u - h.w / 2 + h.w * m / 3; b.beam("stone", p(u, h.y0 + .05), p(u, h.y1 - rng.range(.4, 1.6)), .1, .12); } }
      else if (top(h.u) > h.y1 - .1 || rng.chance(.4)) windowDecor(b, rng, f, 0, h, rng.pick(winKinds), wood);
    }
    // 墙面痕迹：剥落露砖、水渍、烟熏、苔藓、藤蔓
    const patches = Math.round((cfg.patches ?? 5) * (len / 6));
    for (let k = 0; k < patches; k++) {
      const side = rng.chance(.7) ? 1 : -1, u = rng.range(-len / 2 + .5, len / 2 - .5), pw = rng.range(.5, 1.6), ph = rng.range(.4, 1.3), y = y0 + rng.range(.4, Math.max(.6, Ht - .8));
      if (y + ph / 2 > top(u) - .1 || holes.some(h => Math.abs(h.u - u) < (h.w + pw) / 2 && y + ph / 2 > h.y0 - .1 && y - ph / 2 < h.y1 + .1)) continue;
      b.patch(rng.pick(cfg.burnt ? ["soot", "wallB"] : ["brick", "brick", "brick", "rubble", "damp", "wallB"]), rng, f, side as 1 | -1, side * t / 2, u, y, pw * rng.range(.5, 1), ph * rng.range(.5, 1), .012 + rng.next() * .008, 5 + rng.int(3));
    }
    // 裂缝和窗下的雨水污痕
    for (let k = 0, n = Math.round(len / 2.5); k < n; k++) {
      const u = rng.range(-len / 2 + .4, len / 2 - .4), y = y0 + rng.range(1, Math.max(1.2, Ht - .3)), side = rng.chance(.7) ? 1 : -1;
      if (y < top(u) - .2 && !holes.some(h => Math.abs(h.u - u) < h.w / 2 + .3 && y > h.y0 - .4 && y < h.y1 + .4)) b.crack("soot", rng, f, side as 1 | -1, side * t / 2, u, y, rng.range(.7, 1.8));
    }
    for (const h of holes) if (h.kind === "window" && h.y0 - y0 > .4 && rng.chance(.55)) b.streak("damp", f, 1, t / 2, h.u + rng.range(-.2, .2), h.y0 - .01, Math.min(rng.range(.6, 1.5), h.y0 - y0 - .1), h.w * .8);
    if ((cfg.moss ?? .5) > 0) for (const side of [1, -1] as const) b.strip(rng.chance(.5) ? "moss" : "damp", rng, f, side, side * t / 2, -len / 2 + .2, len / 2 - .2, y0, 1.2 * (cfg.moss ?? .5) + .25, top);
    for (const h of holes) if (cfg.soot !== 0 && (cfg.burnt || rng.chance(cfg.soot ?? .2))) {
      const ph = Math.min(2.2, top(h.u) - h.y1);
      if (ph > .3) b.patch("soot", rng, f, 1, t / 2, h.u, h.y1 + ph / 2, h.w * rng.range(.9, 1.4), ph, .02, 5);
    }
    if (rng.chance(Math.min(1, cfg.vines ?? .5))) b.vine(rng, f, 1, t / 2, rng.range(-len / 3, len / 3), y0, y0 + Math.min(Ht * .8, 4.5), "leaf", "wood");
  });
  // 屋面
  roofOf(b, rng, cfg, y0 + Ht, zones);
  // 平屋顶：完好时一块混凝土板，破损时按格子拼，塌陷区里的格子缺掉
  if (roofKind === "flat") {
    if (loss <= .05) b.box("wallB", 0, y0 + Ht + .1, 0, W + .2, .2, D + .2);
    else b.floorGrid(rng, "wallB", "woodD", -W / 2 - .1, -D / 2 - .1, W / 2 + .1, D / 2 + .1, y0 + Ht + .2, { cell: 1.7, missing: loss * .12, thick: .2, gone: (x, z) => zones.some(zn => (x - zn.x) ** 2 + (z - zn.z) ** 2 < zn.r * zn.r * .8) });
  }
  for (const z of zones) {
    // 塌下来的屋架和瓦砾堆在塌陷区正下方
    const r = Math.min(z.r * .55, 2.4);
    b.heap(rng, z.x, z.z, y0 + .04, r, rng.range(.35, .8));
    for (let k = 0; k < 3; k++) {
      const a = rng.range(0, Math.PI * 2), d = rng.range(.2, 1) * z.r * .6;
      b.beam(cfg.burnt ? "woodD" : "wood", [z.x + Math.cos(a) * d, y0 + rng.range(1.4, Math.max(1.8, Ht - .4)), z.z + Math.sin(a) * d], [z.x + Math.cos(a + 1) * d * .6, y0 + .15, z.z + Math.sin(a + 1) * d * .6], .13, .16);
    }
    b.scatter(rng, z.x, z.z, z.r * .7, z.r * .7, y0 + .04, 10, ["tile", "tileD", "rubble"], .22);
  }
  // 室内散落物、周边瓦砾和杂草
  const rubble = cfg.rubble ?? .5, weeds = cfg.weeds ?? .6;
  b.scatter(rng, 0, 0, W / 2 - t - .3, D / 2 - t - .3, y0 + .04, Math.round(14 * rubble + 4), ["rubble", "rubbleS", "dirt"], .2);
  b.weeds(rng, 0, 0, W / 2 - t - .2, D / 2 - t - .2, Math.round(16 * weeds), y0, ["grassD", "grassY"]);
  if (!cfg.elevated) {
    for (let k = 0; k < Math.round(3 * rubble); k++) { const id = rng.int(4), f = frames[id]!, [x, z] = at(f, rng.range(-lens[id]! / 3, lens[id]! / 3), t / 2 + rng.range(.7, 1.6)); b.heap(rng, x, z, 0, rng.range(.4, 1), rng.range(.2, .5)); }
    b.weeds(rng, 0, 0, W / 2 + 1.6, D / 2 + 1.6, Math.round(30 * weeds), 0);
    for (let k = 0; k < Math.round(3 * weeds); k++) { const id = rng.int(4), f = frames[id]!, [x, z] = at(f, rng.range(-lens[id]! / 2, lens[id]! / 2), t / 2 + rng.range(.4, 1.2)); b.bush("leaf", rng, x, 0, z, rng.range(.3, .6)); }
  }
  extra?.(b, rng, { top: y0 + Ht, found, t, zones, frames, lens, tops });
  return b.parts();
}
