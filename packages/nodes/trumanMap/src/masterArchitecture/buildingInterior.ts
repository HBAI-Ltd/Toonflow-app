import type { ModelPart } from "../assetModelParts";
import { Builder, lantern } from "./chineseArchKit";
import { shade, Soup } from "./chineseRoofKit";
import { dominantWallColor } from "./buildingDetails";
import { exteriorWalls, type Run } from "./chineseWallDressing";
import { CELL, buildGrid, clearance, enclosure, primitivesOf, type Cover, type Grid } from "./interiorGrid";
import { paletteOf, plansFor, purposesOf, type Item, type Role } from "./interiorFurniture";
import { DEG, yawOf } from "./partMath";

// 室内细化：在建筑的室内空地上按用途摆家具、挂灯、铺地面纹理；按楼板分层处理（地面层加最多两层上层）。
// 先把已有几何投影成占位网格，只在“被屋面覆盖、三面以上有墙”的空地里摆放，
// 靠墙家具两侧各留 .9m 连续墙面（避开门洞）、正面留 .85m 通道，自由站立的桌椅组四周留 .9m。
export type RoofFrame = { x: number; y: number; z: number; yaw: number; hx: number; hz: number };
export type InteriorInput = { theme?: string; name: string; group?: string; frames: RoofFrame[]; room: number; /** 空壳化时直接给出的楼板和屋面范围（没有命名的楼板盒、屋顶盒可识别时用） */ slabs?: Slab[]; covers?: Cover[] };

export type Slab = { cx: number; cz: number; yaw: number; hx: number; hz: number; top: number; bottom: number; area: number; color: string };

const FLOOR_NAME = /地坪|地面|地台|地板|楼面|楼板|楼层|层板|生活层|居住层|独立层|台基|基坪|基础|石坪|地基|基座|场坪|站坪|实底|垫台|底台|石台|高台|石基|石庭|前庭|院坪|庭坪|前坪/, NOT_FLOOR = /池|屋盖|屋顶|顶|液|水(?!平)|栏|梯|踏|甲板|座|观众/;
const ROOF_NAME = /屋盖|屋顶|屋面|平屋|平顶|顶板|厚顶|盖板|雨盖|顶盖|整体顶|覆顶/, NOT_ROOF = /坡|脊|窗|晒台|平台|甲板|花园|檐口|女儿墙|宫灯|山墙|瓦垄|鸱吻|曲面|缘板|光带/;

function slabsOf(parts: ModelPart[]): Slab[] {
  const result: Slab[] = [];
  for (const value of parts) {
    if (value.shape !== "box" || !FLOOR_NAME.test(value.name) || NOT_FLOOR.test(value.name)) continue;
    const yaw = yawOf(value);
    if (yaw === undefined || value.scale.y > .7 || value.scale.x * value.scale.z < 12) continue;
    result.push({ cx: value.position.x, cz: value.position.z, yaw, hx: value.scale.x / 2, hz: value.scale.z / 2, top: value.position.y + value.scale.y / 2, bottom: value.position.y - value.scale.y / 2, area: value.scale.x * value.scale.z, color: value.color });
  }
  return result;
}

const inside = (slab: { cx: number; cz: number; yaw: number; hx: number; hz: number }, x: number, z: number, margin = 0) => {
  const c = Math.cos(slab.yaw * DEG), s = Math.sin(slab.yaw * DEG), dx = x - slab.cx, dz = z - slab.cz;
  return Math.abs(dx * c - dz * s) <= slab.hx + margin && Math.abs(dx * s + dz * c) <= slab.hz + margin;
};

function coversOf(parts: ModelPart[], frames: RoofFrame[]): Cover[] {
  const covers: Cover[] = frames.map(f => ({ cx: f.x, cz: f.z, yaw: f.yaw, hx: f.hx, hz: f.hz, ceiling: f.y - .25, kit: true }));
  for (const value of parts) {
    // 直接用屋面套件生成的屋顶（宫殿、样板街楼等）：从曲面屋顶网格的局部范围取矩形，屋面基线 y 即部件位置
    if (value.shape === "mesh" && /曲面瓦屋顶$/.test(value.name) && value.vertices?.length) {
      const yaw = yawOf(value);
      if (yaw === undefined || frames.some(f => Math.abs(f.x - value.position.x) < .02 && Math.abs(f.z - value.position.z) < .02 && Math.abs(f.y - value.position.y) < .02)) continue;
      let hx = 0, hz = 0;
      for (const v of value.vertices) { hx = Math.max(hx, Math.abs(v.x)); hz = Math.max(hz, Math.abs(v.z)); }
      if (hx > 1 && hz > 1) covers.push({ cx: value.position.x, cz: value.position.z, yaw, hx, hz, ceiling: value.position.y - .25, kit: true });
      continue;
    }
    if (!ROOF_NAME.test(value.name) || NOT_ROOF.test(value.name)) continue;
    const yaw = yawOf(value);
    if (value.shape === "box") {
      if (yaw === undefined || value.scale.y > 1.2 || value.scale.x * value.scale.z < 12 || Math.min(value.scale.x, value.scale.z) < 2.2) continue;
      covers.push({ cx: value.position.x, cz: value.position.z, yaw, hx: value.scale.x / 2, hz: value.scale.z / 2, ceiling: value.position.y - value.scale.y / 2 });
    } else if (value.shape === "extrude" && value.profile?.length && yaw !== undefined) {
      // 挤出屋面（弧顶、折顶等没被换成屋顶套件的）：取轮廓横向范围和拉伸深度作矩形，天花取轮廓最低点
      const xs = value.profile.map(p => p.x), ys = value.profile.map(p => p.y), w = Math.max(...xs) - Math.min(...xs), d = value.depth ?? .2;
      if (w * d < 12 || Math.min(w, d) < 2.2 || Math.max(...ys) - Math.min(...ys) > 8) continue;
      const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG), lx = (Math.max(...xs) + Math.min(...xs)) / 2;
      covers.push({ cx: value.position.x + lx * c, cz: value.position.z - lx * s, yaw, hx: w / 2, hz: d / 2, ceiling: value.position.y + Math.min(...ys) });
    } else if (value.shape === "mesh" && value.vertices && value.vertices.length >= 4 && yaw !== undefined) {
      // 平顶网格：按局部包围盒取矩形，要求基本是平的
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (const v of value.vertices) { x0 = Math.min(x0, v.x * value.scale.x); x1 = Math.max(x1, v.x * value.scale.x); y0 = Math.min(y0, v.y * value.scale.y); y1 = Math.max(y1, v.y * value.scale.y); z0 = Math.min(z0, v.z * value.scale.z); z1 = Math.max(z1, v.z * value.scale.z); }
      if (y1 - y0 > 8 || (x1 - x0) * (z1 - z0) < 12 || Math.min(x1 - x0, z1 - z0) < 2.2) continue;
      const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG), lx = (x0 + x1) / 2, lz = (z0 + z1) / 2;
      covers.push({ cx: value.position.x + lx * c + lz * s, cz: value.position.z - lx * s + lz * c, yaw, hx: (x1 - x0) / 2, hz: (z1 - z0) / 2, ceiling: value.position.y + y0 });
    }
  }
  return covers;
}

class Random {
  private state: number;
  constructor(seed: number) { this.state = (seed >>> 0) || 1; }
  next() { this.state ^= this.state << 13; this.state >>>= 0; this.state ^= this.state >>> 17; this.state ^= this.state << 5; this.state >>>= 0; return this.state / 4294967296; }
  pick<T>(list: T[]) { return list[Math.floor(this.next() * list.length)]!; }
  shuffle<T>(list: T[]) { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [list[i], list[j]] = [list[j]!, list[i]!]; } return list; }
}

const hash = (text: string) => { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

type Placed = { item: Item; x: number; z: number; yaw: number };

function markRect(grid: Grid, x0: number, z0: number, x1: number, z1: number) {
  const [ia, ja] = grid.cellOf(x0, z0), [ib, jb] = grid.cellOf(x1, z1);
  for (let j = Math.max(0, ja); j <= Math.min(grid.nz - 1, jb); j++) for (let i = Math.max(0, ia); i <= Math.min(grid.nx - 1, ib); i++) { const k = grid.idx(i, j); if (grid.occ[k] === 0) grid.occ[k] = 2; }
}

function rectFree(grid: Grid, enc: Uint8Array, x0: number, z0: number, x1: number, z1: number, needEnclosure: boolean) {
  const [ia, ja] = grid.cellOf(x0 + .001, z0 + .001), [ib, jb] = grid.cellOf(x1 - .001, z1 - .001);
  for (let j = ja; j <= jb; j++) for (let i = ia; i <= ib; i++) {
    if (!grid.free(i, j)) return false;
    if (needEnclosure && enc[grid.idx(i, j)]! < 2) return false;
  }
  return true;
}

function rectClear(grid: Grid, x0: number, z0: number, x1: number, z1: number) {
  const [ia, ja] = grid.cellOf(x0 + .001, z0 + .001), [ib, jb] = grid.cellOf(x1 - .001, z1 - .001);
  for (let j = ja; j <= jb; j++) for (let i = ia; i <= ib; i++) if (!grid.inBounds(i, j) || grid.occ[grid.idx(i, j)] !== 0) return false;
  return true;
}

type Level = { floorY: number; slabs: Slab[] };

// 楼层：地面层取覆盖最大屋面中心的低位板；上面每隔 ≥ 2.4m 的板面各算一层（最多三层）
function levelsOf(slabs: Slab[], covers: Cover[]): Level[] {
  const ground = Math.min(...slabs.map(slab => slab.bottom)), low = slabs.filter(slab => slab.top - ground <= 1.3);
  if (!low.length) return [];
  const main = [...covers].sort((p, q) => q.hx * q.hz - p.hx * p.hz)[0]!;
  const under = low.filter(slab => inside(slab, main.cx, main.cz));
  const floorY = (under.length ? under : [...low].sort((p, q) => q.area - p.area).slice(0, 1)).reduce((best, slab) => Math.max(best, slab.top), -1e9);
  const levels: Level[] = [{ floorY, slabs: low.filter(slab => Math.abs(slab.top - floorY) <= .2) }];
  const upper = slabs.filter(slab => slab.top - floorY >= 2.4 && slab.top - floorY <= 12).sort((p, q) => p.top - q.top);
  for (const slab of upper) {
    const last = levels[levels.length - 1]!;
    if (Math.abs(slab.top - last.floorY) <= .2) last.slabs.push(slab);
    else if (slab.top - last.floorY >= 2.4 && levels.length < 3) levels.push({ floorY: slab.top, slabs: [slab] });
  }
  return levels;
}

type Ctx = { grid: Grid; floorY: number; level: Slab[]; first: boolean; usable: Cover[]; area: number };

export function addInterior(parts: ModelPart[], input: InteriorInput): ModelPart[] {
  if (input.room < 4) return [];
  const slabs = [...slabsOf(parts), ...(input.slabs ?? [])], covers = [...coversOf(parts, input.frames), ...(input.covers ?? [])];
  if (!slabs.length || !covers.length) return [];
  const levels = levelsOf(slabs, covers);
  if (!levels.length) return [];
  const prims = primitivesOf(parts);
  const chinese = input.theme === "中式", palette = paletteOf(input.theme);
  const b = new Builder(), random = new Random(hash(input.name));
  // 部件数紧张（< 10）或要布置多层（各层家具共用同一批颜色组）时把角色合并成 4 种颜色，免得家具被切成一堆小部件
  const compact = input.room < 10 || (levels.length > 1 && input.room < 30), keyOf = (role: Role): Role => !compact ? role : ({ wood: "wood", dark: "dark", metal: "dark", fabric: "fabric", green: "fabric", cream: "cream", accent: "cream", glow: "glow" } as Record<Role, Role>)[role];
  const roles: Role[] = compact ? ["wood", "dark", "fabric", "cream"] : ["wood", "dark", "fabric", "cream", "accent", "metal", "green"];
  for (const role of roles) b.group(role, "室内家具", palette[role], { roughness: .78 });
  b.group("glow", "室内灯具", palette.glow, { emissive: "#f0c878", emissiveIntensity: .6, roughness: .5 });
  b.group("lantern", "室内宫灯", palette.glow, { emissive: "#f0c878", emissiveIntensity: .6, roughness: .5 });
  b.group("cord", "灯具吊绳", shade(palette.dark, .8));
  b.group("door", "灯罩帽", shade(palette.dark, .9));
  b.group("beam", "室内承梁", shade(palette.dark, 1.15), { roughness: .8 });
  // 墙面装饰要分析外墙，成本不低：到第二遍真的需要时才算，并在这时登记踢脚线等构件组
  let walls: Run[] | undefined;
  const wallsOf = (): Run[] => {
    if (walls) return walls;
    walls = input.room >= 12 ? exteriorWalls(parts, input.frames) : [];
    if (walls.length) b.group("skirt", "室内踢脚线", shade(dominantWallColor(parts), .62), { roughness: .9 }).group("rail", "室内腰线", palette.wood).group("artFrame", "室内字画框", palette.dark, { roughness: .7 }).group("artPaper", "室内字画", palette.cream, { roughness: .95 }).group("artInk", "室内字画点缀", palette.accent);
    return walls;
  };
  // 家具块数上限：每个部件约容纳 20 块，按七成填充估算；多层建筑把剩余额度平均分给还没布置的楼层
  const maxBoxes = Math.min(520, Math.max(40, (input.room - 5) * 14));
  let boxes = 0, arts = 0;
  const floors: ModelPart[] = [];

  // 第一遍：每层先摆家具和灯（部件预算紧时保证上层也有家具）；第二遍再补承梁、踢脚线、字画
  const furnish = (floorY: number, level: Slab[], first: boolean, cap: number): Ctx | undefined => {
    const grid = buildGrid(prims, covers, floorY);
    if (!grid) return;
    // 只在本层的楼板上摆放
    for (let j = 0; j < grid.nz; j++) for (let i = 0; i < grid.nx; i++) {
      const k = grid.idx(i, j);
      if (grid.inside[k] === 0) continue;
      const [x, z] = grid.center(i, j);
      if (!level.some(slab => inside(slab, x, z))) grid.inside[k] = 0;
    }
    // 地面纹理：木色地面铺板缝，石色地面铺方砖缝，只画在屋面覆盖的范围内（不依赖可摆放面积）
    if (floors.length < 3) floors.push(...floorLines(level, grid, floorY, 3 - floors.length));
    const enc = enclosure(grid);
    let cells = 0;
    for (let j = 0; j < grid.nz; j++) for (let i = 0; i < grid.nx; i++) if (grid.free(i, j) && enc[grid.idx(i, j)]! >= 3) cells++;
    const area = cells * CELL * CELL;
    if (area < 4.5) return;
    // 本层可用的屋面：天花至少高出地面 2.4m（与建网格时一致），低于楼面的挑檐不算
    const usable = covers.filter(cover => cover.ceiling >= floorY + 2.4);
    const emit = (placement: Placed) => {
      const { item, x, z, yaw } = placement, c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG);
      for (const [role, cx, cy, cz, sx, sy, sz] of item.pieces) { b.boxYaw(keyOf(role), x + cx * c + cz * s, floorY + cy, z - cx * s + cz * c, sx, sy, sz, yaw); boxes++; }
    };
    const plan = plansFor(purposesOf(input.name, input.group), chinese);
    const wallTarget = Math.max(1, Math.min(9, Math.round(area / 9))), freeTarget = area >= 18 ? Math.min(3, Math.round(area / 30) + 1) : 0;
    // 靠墙：每个方向上，空格子贴着墙就是候选
    const anchors: { i: number; j: number; ux: number; uz: number }[] = [];
    for (let j = 0; j < grid.nz; j++) for (let i = 0; i < grid.nx; i++) {
      if (!grid.free(i, j) || enc[grid.idx(i, j)]! < 3) continue;
      for (const [ux, uz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) if (grid.wallLike(i + ux, j + uz)) anchors.push({ i, j, ux, uz });
    }
    random.shuffle(anchors);
    const tryPlace = (item: Item): boolean => {
      for (let n = 0; n < Math.min(anchors.length, 160); n++) {
        const { i, j, ux, uz } = anchors[n]!, [cx, cz] = grid.center(i, j), tx = -uz, tz = ux;
        // 墙面坐标：墙格靠室内一侧的边
        const wallX = ux > 0 ? grid.x0 + (i + 1) * CELL : ux < 0 ? grid.x0 + i * CELL : cx, wallZ = uz > 0 ? grid.z0 + (j + 1) * CELL : uz < 0 ? grid.z0 + j * CELL : cz;
        // 局部 → 世界：world = wall + t*lx + (-u)*lz
        const corner = (lx: number, lz: number): [number, number] => [wallX + tx * lx - ux * lz, wallZ + tz * lx - uz * lz];
        const p0 = corner(-item.w / 2, 0), p1 = corner(item.w / 2, item.d);
        if (!rectFree(grid, enc, Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]), Math.max(p0[0], p1[0]), Math.max(p0[1], p1[1]), true)) continue;
        // 正面通道：item 前方 .85m 内不能有占用
        const f0 = corner(-item.w / 2, item.d), f1 = corner(item.w / 2, item.d + .85);
        if (!rectClear(grid, Math.min(f0[0], f1[0]), Math.min(f0[1], f1[1]), Math.max(f0[0], f1[0]), Math.max(f0[1], f1[1]))) continue;
        // 墙面连续：左右各留 .9m 都是墙，避开门洞
        let continuous = true;
        for (let off = -(item.w / 2 + .9); off <= item.w / 2 + .9 && continuous; off += CELL * .5) {
          const p = corner(off, -CELL * .5), [wi, wj] = grid.cellOf(p[0], p[1]);
          if (!grid.wallLike(wi, wj)) continuous = false;
        }
        if (!continuous) continue;
        // 贴墙：墙格边到真实墙面之间的空隙（0–.25m）补掉
        const wk = grid.idx(i + ux, j + uz);
        const gap = ux > 0 ? grid.ext[wk * 4]! - wallX : ux < 0 ? wallX - grid.ext[wk * 4 + 1]! : uz > 0 ? grid.ext[wk * 4 + 2]! - wallZ : wallZ - grid.ext[wk * 4 + 3]!;
        const shift = Number.isFinite(gap) ? Math.max(0, Math.min(CELL, gap)) : 0;
        const yaw = Math.atan2(-ux, -uz) / DEG, center = corner(0, 0);
        emit({ item, x: center[0] + ux * shift, z: center[1] + uz * shift, yaw });
        const k0 = corner(-item.w / 2 - .05, 0), k1 = corner(item.w / 2 + .05, item.d + .35);
        markRect(grid, Math.min(k0[0], k1[0]), Math.min(k0[1], k1[1]), Math.max(k0[0], k1[0]), Math.max(k0[1], k1[1]));
        return true;
      }
      return false;
    };
    let count = 0;
    for (let round = 0; round < 2 && count < wallTarget; round++) for (const item of plan.wall) {
      if (count >= wallTarget || b.partCount() >= input.room - 3 || boxes > cap) break;
      if (tryPlace(item)) count++;
    }
    // 自由站立：找四周留足通道的格子
    for (let attempt = 0, done = 0; attempt < freeTarget * 6 && done < freeTarget && plan.free.length; attempt++) {
      const item = plan.free[done % plan.free.length]!, need = Math.ceil((Math.max(item.w, item.d) / 2 + .9) / CELL), clr = clearance(grid);
      let best = -1, bi = 0, bj = 0;
      for (let j = 0; j < grid.nz; j++) for (let i = 0; i < grid.nx; i++) {
        const k = grid.idx(i, j);
        if (grid.occ[k] !== 0 || enc[k]! < 4 || clr[k]! < need) continue;
        const score = clr[k]! + random.next() * .5;
        if (score > best) { best = score; bi = i; bj = j; }
      }
      if (best < 0 || b.partCount() >= input.room - 3 || boxes > cap) break;
      const [x, z] = grid.center(bi, bj), hw = item.w / 2, hd = item.d / 2;
      if (!rectFree(grid, enc, x - hw, z - hd, x + hw, z + hd, false)) { grid.occ[grid.idx(bi, bj)] = 2; continue; }
      emit({ item, x, z, yaw: random.pick([0, 90]) });
      done++;
      markRect(grid, x - hw - .3, z - hd - .3, x + hw + .3, z + hd + .3);
    }
    // 吊灯：每约 18㎡ 一盏，挂在空地上，吊绳到天花
    if (input.room >= 9 && b.partCount() < input.room - 2) {
      const lights = Math.max(1, Math.min(4, Math.round(area / 18))), clr = clearance(grid);
      const spots: { i: number; j: number; score: number }[] = [];
      for (let j = 0; j < grid.nz; j++) for (let i = 0; i < grid.nx; i++) { const k = grid.idx(i, j); if (grid.inside[k] === 1 && enc[k]! >= 4 && clr[k]! >= 5) spots.push({ i, j, score: clr[k]! + random.next() }); }
      spots.sort((p, q) => q.score - p.score);
      const chosen: [number, number][] = [];
      for (const spot of spots) {
        if (chosen.length >= lights) break;
        const [x, z] = grid.center(spot.i, spot.j);
        if (chosen.some(([ox, oz]) => Math.hypot(ox - x, oz - z) < 3.2)) continue;
        const ceiling = Math.min(...usable.filter(cover => inside(cover, x, z)).map(cover => cover.ceiling));
        const low = Math.min(ceiling, grid.ceil[grid.idx(spot.i, spot.j)]!);
        if (!Number.isFinite(low) || low < floorY + 2.6) continue;
        chosen.push([x, z]);
        const radius = chinese ? .22 : .17, centerY = Math.max(floorY + 2.2 + radius, low - 1.0 + radius), cord = low - (centerY + radius);
        if (cord > .05) b.box("cord", x, centerY + radius + cord / 2, z, .03, cord, .03);
        if (chinese) lantern(b, x, centerY, z, radius, 0); else { b.sphere("glow", [x, centerY, z], radius); b.box("dark", x, centerY + radius * .9, z, radius * 1.3, .05, radius * 1.3); }
      }
    }
    return { grid, floorY, level, first, usable, area };
  };

  const dress = ({ grid, floorY, level, first, usable, area }: Ctx) => {
    // 中式厅堂：沿屋脊方向每 2.4m 一道横向承梁，从墙到墙，贴在本层天花下（天花取屋面或头顶最低的楼板）
    if (chinese && area >= 12 && input.room >= 9) {
      for (const cover of usable) {
        if (!cover.kit || cover.ceiling < floorY + 2.8 || b.partCount() >= input.room - 2) continue;
        const cos = Math.cos(cover.yaw * DEG), sin = Math.sin(cover.yaw * DEG), world = (lx: number, lz: number): [number, number] => [cover.cx + lx * cos + lz * sin, cover.cz - lx * sin + lz * cos];
        for (let t = -cover.hz + 1.4; t <= cover.hz - 1.4; t += 2.4) {
          const reach = (sign: number) => {
            for (let lx = 0; lx <= cover.hx; lx += CELL) { const [x, z] = world(sign * lx, t), [i, j] = grid.cellOf(x, z); if (grid.wallLike(i, j)) return lx; if (!grid.inBounds(i, j) || grid.covered[grid.idx(i, j)] === 0) return undefined; }
            return undefined;
          };
          const left = reach(-1), right = reach(1);
          if (left === undefined || right === undefined || left + right < 2.5) continue;
          const [mx, mz] = world((right - left) / 2, t), [ci, cj] = grid.cellOf(mx, mz);
          if (!grid.inBounds(ci, cj) || grid.inside[grid.idx(ci, cj)] === 0) continue;
          const roof = Math.min(cover.ceiling, grid.ceil[grid.idx(ci, cj)]!);
          if (roof > floorY + 7 || roof < floorY + 2.7) continue;
          b.boxYaw("beam", mx, roof - .17, mz, left + right, .26, .28, cover.yaw);
        }
      }
    }
    // 墙面：踢脚线、齐腰的横条，空墙面挂字画；洞口（门、窗）处断开，不挡通行
    if (b.partCount() < input.room - 5) for (const run of wallsOf()) {
      // 地面层：墙脚在楼面附近；上层：通高的墙（墙脚在楼面以下）也算，要求墙体至少高出本层楼面 2.4m
      const base = first ? Math.abs(run.y0 - floorY) <= .5 : run.y0 <= floorY + .5 && run.y0 >= floorY - 6;
      if (!base || run.y1 < floorY + 2.4 || b.partCount() >= input.room - 2) continue;
      const inward = -run.outward, off = run.thick / 2 + .02, mid = (run.from + run.to) / 2, length = run.to - run.from;
      const px = run.axis === "x" ? mid : run.fixed + inward * .4, pz = run.axis === "x" ? run.fixed + inward * .4 : mid, probe = grid.cellOf(px, pz);
      if (!grid.inBounds(probe[0], probe[1]) || grid.covered[grid.idx(probe[0], probe[1])] === 0) continue;
      // 上层墙面朝向的一侧必须真的有本层楼板，免得挂到露台或下层屋面外
      if (!first && !level.some(slab => inside(slab, px, pz, .1))) continue;
      const put = (key: string, t: number, y: number, along: number, tall: number, depth: number, extra = 0) => {
        if (run.axis === "x") b.box(key, t, y, run.fixed + inward * (off + extra), along, tall, depth); else b.box(key, run.fixed + inward * (off + extra), y, t, depth, tall, along);
      };
      // 洞口：门洞整个断开；窗洞只断开腰线和字画
      const gaps = run.holes.map(hole => ({ a: hole.c - hole.w / 2 - .05, c: hole.c + hole.w / 2 + .05, door: hole.bottom < .4, low: hole.bottom, high: hole.bottom + hole.h })).sort((p, q) => p.a - q.a);
      const spans = (blocked: (hole: typeof gaps[number]) => boolean, min: number): [number, number][] => {
        const result: [number, number][] = []; let cursor = run.from;
        for (const gap of gaps) { if (!blocked(gap)) continue; if (gap.a - cursor >= min) result.push([cursor, gap.a]); cursor = Math.max(cursor, gap.c); }
        if (run.to - cursor >= min) result.push([cursor, run.to]);
        return result;
      };
      for (const [from, to] of spans(gap => gap.door, .5)) put("skirt", (from + to) / 2, floorY + .08, to - from, .16, .03, .005);
      for (const [from, to] of spans(gap => gap.door || (gap.low <= 1.1 && gap.high >= .95), .8)) put("rail", (from + to) / 2, floorY + 1.0, to - from, .07, .035, .005);
      if (length >= 2.4 && arts < 6) for (const [from, to] of spans(gap => gap.door || gap.high > 1.3 && gap.low < 2.6, 1.5)) {
        if (arts >= 6 || b.partCount() >= input.room - 2) break;
        const t = (from + to) / 2, [ai, aj] = run.axis === "x" ? grid.cellOf(t, run.fixed + inward * .5) : grid.cellOf(run.fixed + inward * .5, t);
        if (!grid.inBounds(ai, aj) || grid.occ[grid.idx(ai, aj)] !== 0) continue;
        put("artFrame", t, floorY + 1.65, .78, 1.12, .035, .02); put("artPaper", t, floorY + 1.65, .66, 1.0, .02, .04); put("artInk", t, floorY + 1.7, .3, .5, .012, .055);
        arts++;
      }
    }
  };
  const contexts: Ctx[] = [];
  levels.forEach((level, index) => {
    if (b.partCount() >= input.room - 3) return;
    const ctx = furnish(level.floorY, level.slabs, index === 0, boxes + (maxBoxes - boxes) / (levels.length - index));
    if (ctx) contexts.push(ctx);
  });
  for (const ctx of contexts) dress(ctx);
  const result = b.parts().slice(0, Math.max(0, input.room - 1));
  for (const value of floors) if (result.length < input.room) result.push(value);
  return result;
}

function floorLines(slabs: Slab[], grid: Grid, floorY: number, room: number): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const slab of [...slabs].sort((p, q) => q.area - p.area).slice(0, 2)) {
    if (parts.length >= room) break;
    const r = parseInt(slab.color.slice(1, 3), 16), g = parseInt(slab.color.slice(3, 5), 16), bl = parseInt(slab.color.slice(5, 7), 16), wood = r > g + 8 && g > bl + 8, spacing = wood ? .42 : .7;
    const soup = new Soup(), c = Math.cos(slab.yaw * DEG), s = Math.sin(slab.yaw * DEG), y = floorY + .008;
    const world = (lx: number, lz: number): [number, number, number] => [slab.cx + lx * c + lz * s, y, slab.cz - lx * s + lz * c];
    const covered = (lx: number, lz: number) => { const [x, , z] = world(lx, lz), [i, j] = grid.cellOf(x, z); return grid.inBounds(i, j) && grid.covered[grid.idx(i, j)] === 1; };
    const line = (fixed: number, alongX: boolean, half: number) => {
      // 沿线段扫描，把落在覆盖范围内的连续段各画成一条细长四边形
      const limit = alongX ? slab.hx : slab.hz, step = CELL;
      let start: number | null = null, last = -limit;
      const emitRun = (from: number, to: number) => {
        if (to - from <= .3 || soup.vertices.length >= 480) return;
        const p = (t: number, off: number) => alongX ? world(t, fixed + off) : world(fixed + off, t);
        soup.quad(soup.vertex(p(from, -half)), soup.vertex(p(to, -half)), soup.vertex(p(to, half)), soup.vertex(p(from, half)), [0, 1, 0]);
      };
      for (let t = -limit; t <= limit; t += step) {
        const on = covered(alongX ? t : fixed, alongX ? fixed : t);
        if (on) { if (start === null) start = t; last = t; } else if (start !== null) { emitRun(start, last); start = null; }
      }
      if (start !== null) emitRun(start, last);
    };
    if (wood) for (let z = -slab.hz + spacing / 2; z < slab.hz; z += spacing) line(z, true, .012);
    else { for (let z = -slab.hz + spacing / 2; z < slab.hz; z += spacing) line(z, true, .01); for (let x = -slab.hx + spacing / 2; x < slab.hx; x += spacing) line(x, false, .01); }
    const value = soup.toPart("地面铺装缝", shade(slab.color, .78), { roughness: .95 });
    if (value) parts.push(value);
  }
  return parts;
}

