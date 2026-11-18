import { Box3, Vector3 } from "three";
import type { ModelPart } from "../assetModelParts";
import { addBuildingDetails } from "./buildingDetailing";
import { dominantWallColor } from "./buildingDetails";
import { Builder } from "./chineseArchKit";
import { dressColumns } from "./columnStructures";
import { dressRoundTowers } from "./towerDressing";
import { dressEdges, dressMasonry, dressTiers } from "./masonryDressing";
import { dressPanels } from "./panelDressing";
import { dressShapes } from "./shapeDetails";
import { shade } from "./chineseRoofKit";
import { worldBox } from "./chineseWallDressing";
import { dressVolume, FacadeBuilder, facadeGroups, facadeStyle, type FaceSpec, type FacadeLook, type Occupant, type Opening, type Volume } from "./facadeKit";
import { applyHollows, furnishHollows, type HollowPlan } from "./hollowing";
import { bodyHoles } from "./shellRegistry";
import { DEG, triangles, yawOf } from "./partMath";
import { pitchedRoofs } from "./roofRegistry";

// 旧素材库里手写的建筑（几个实心体量加门窗贴片）：先把拉伸屋面的缩放烘进轮廓，让屋面套件能认出来，
// 再走统一细化流程，最后给实心体量补门窗、勒脚、线脚和烟囱帽。
const ROOF_WORD = /瓦|屋顶|屋面|屋盖|茅|草顶/, NOT_ROOF = /山墙|脊|枋|梁|柱|撑|栏|门|窗|烟|台阶|踏|拱|穹|弧|圆|环/;
const NOT_BODY = /屋顶|屋盖|瓦|顶|台基|地台|基座|基础|地坪|平台|台阶|阶|踏|栏|烟|管|梁|桥|甲板|雨棚|雨篷|挑板|檐|柜台|床|桌|椅|牌|旗|灯|水面|池|垛|堆|货|架|罐|桶|集装箱|帐|棚|窗|门/;

/** 缩放过的拉伸屋面把缩放烘进轮廓（套件只认缩放为 1 的屋面），并登记为双坡挤出屋面。 */
export function normalizeRoofs(parts: ModelPart[]) {
  for (const value of parts) {
    if (value.shape !== "extrude" || !value.profile || !ROOF_WORD.test(value.name) || NOT_ROOF.test(value.name)) continue;
    const { x: sx, y: sy, z: sz } = value.scale;
    if (Math.abs(sx - 1) > 1e-6 || Math.abs(sy - 1) > 1e-6 || Math.abs(sz - 1) > 1e-6) {
      value.profile = value.profile.map(point => ({ x: point.x * sx, y: point.y * sy }));
      value.depth = (value.depth ?? .2) * sz;
      value.scale = { x: 1, y: 1, z: 1 };
    }
    // 6 点（直坡）、8 点（飞檐）的对称轮廓是 pitchedRoof 的写法
    if ((value.profile.length === 6 || value.profile.length === 8) && Math.abs(Math.min(...value.profile.map(p => p.x)) + Math.max(...value.profile.map(p => p.x))) < .05) pitchedRoofs.add(value);
  }
}

export type Body = { part: ModelPart; vol: Volume; box: Box3 };

export function findBodies(parts: ModelPart[]): Body[] {
  const result: Body[] = [];
  for (const value of parts) {
    if (value.shape !== "box" || NOT_BODY.test(value.name)) continue;
    const yaw = yawOf(value);
    if (yaw === undefined) continue;
    const { x: sx, y: sy, z: sz } = value.scale;
    if (sy < 1.8 || Math.min(sx, sz) < 1.4 || Math.max(sx, sz) < 2) continue;
    const box = worldBox(value);
    if (!box) continue;
    result.push({ part: value, vol: { cx: value.position.x, cz: value.position.z, yaw, hx: sx / 2, hz: sz / 2, y0: value.position.y - sy / 2, y1: value.position.y + sy / 2 }, box });
  }
  // 完全嵌在更大体量里的不处理
  return result.filter(body => !result.some(other => other !== body && other.box.containsBox(body.box) && other.box.getSize(new Vector3()).y >= body.box.getSize(new Vector3()).y));
}

const toLocal = (vol: Volume, x: number, z: number): [number, number] => {
  const c = Math.cos(vol.yaw * DEG), s = Math.sin(vol.yaw * DEG), dx = x - vol.cx, dz = z - vol.cz;
  return [dx * c - dz * s, dx * s + dz * c];
};

/** 体量四个面的可见性与已有洞口：门窗贴片、檐廊柱、阳台等落在面前 .6m 内的物体都算占位。 */
export function facesOf(body: Body, parts: ModelPart[], bodies: Body[], minY: number): { faces: FaceSpec[]; elevated: boolean } {
  const v = body.vol, faces: FaceSpec[] = [0, 1, 2, 3].map(() => ({ exposed: true, occupied: [] as Occupant[], windows: 0 }));
  const dirs: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  // 可见性：面外 .2m、面中心和两侧 1/4 处被其他体量盖住两处以上就算被遮
  dirs.forEach(([nx, nz], id) => {
    const half = id < 2 ? v.hx : v.hz, c = Math.cos(v.yaw * DEG), s = Math.sin(v.yaw * DEG);
    let covered = 0;
    for (const t of [-half / 2, 0, half / 2]) {
      const lx = id < 2 ? t : nx * (v.hx + .2), lz = id < 2 ? nz * (v.hz + .2) : t;
      const x = v.cx + lx * c + lz * s, z = v.cz - lx * s + lz * c, y = (v.y0 + v.y1) / 2;
      if (bodies.some(other => other !== body && other.box.containsPoint(new Vector3(x, y, z)))) covered++;
    }
    if (covered >= 2) faces[id]!.exposed = false;
  });
  for (const other of parts) {
    if (other === body.part) continue;
    const box = worldBox(other);
    if (!box) continue;
    // 底部在体量下沿以下的台基、台阶、屋顶（底在体量顶以上）不占位
    // 屋顶、檐口缘板之类从墙顶 .4m 以内开始的也不占位
    if (box.max.y <= v.y0 + .35 || box.min.y >= v.y1 - .4) continue;
    const xs: number[] = [], zs: number[] = [];
    for (const x of [box.min.x, box.max.x]) for (const z of [box.min.z, box.max.z]) { const [lx, lz] = toLocal(v, x, z); xs.push(lx); zs.push(lz); }
    const lx0 = Math.min(...xs), lx1 = Math.max(...xs), lz0 = Math.min(...zs), lz1 = Math.max(...zs);
    const y0 = Math.max(box.min.y, v.y0), y1 = Math.min(box.max.y, v.y1);
    if (y1 - y0 < .05) continue;
    const spec: [boolean, number, number][] = [
      [lz1 >= v.hz - .08 && lz0 <= v.hz + .6, Math.max(lx0, -v.hx), Math.min(lx1, v.hx)],
      [lz0 <= -v.hz + .08 && lz1 >= -v.hz - .6, Math.max(lx0, -v.hx), Math.min(lx1, v.hx)],
      [lx1 >= v.hx - .08 && lx0 <= v.hx + .6, Math.max(lz0, -v.hz), Math.min(lz1, v.hz)],
      [lx0 <= -v.hx + .08 && lx1 >= -v.hx - .6, Math.max(lz0, -v.hz), Math.min(lz1, v.hz)],
    ];
    // 整个落在体量内部、没有伸出面外的不算（看不见）
    const reach = [lz1 - v.hz, -v.hz - lz0, lx1 - v.hx, -v.hx - lx0];
    spec.forEach(([near, t0, t1], id) => {
      if (!near || t1 - t0 < .03 || reach[id]! < -.08) return;
      const height = box.max.y - box.min.y, width = t1 - t0, thin = Math.min(other.scale.x, other.scale.y, other.scale.z) <= .3;
      // 窗：名称带窗（窗框、窗扇、窗台等配件不算）的薄板；门：名称带门、够高、落地的薄板
      const windowLike = other.shape === "box" && thin && width >= .3 && height >= .3 && (/玻璃|窗格/.test(other.name) || /窗/.test(other.name)) && !/框|窗台|楣|扇|檐|棂|罩|栏|帘|百叶|纸/.test(other.name);
      const doorLike = other.shape === "box" && thin && height >= 1.5 && box.min.y <= v.y0 + .6 && /门/.test(other.name) && !/门楼|门廊|门前|门柱|门框|门槛|门阶|门洞|门斗|门钉|门环|门额|门楣|门灯|门牌/.test(other.name);
      faces[id]!.occupied.push({ t0, t1, y0, y1, ...(windowLike ? { kind: "window" as const, part: other } : doorLike ? { kind: "door" as const, part: other } : {}) });
      if (/窗|玻璃|窗格/.test(other.name) && !/窗框|窗台/.test(other.name) || (/窗/.test(other.name) && width >= .5)) faces[id]!.windows = (faces[id]!.windows ?? 0) + 1;
      if (/门/.test(other.name) && !/门楼|门廊|门前|门柱|门框|门槛|门阶|门洞/.test(other.name) && height >= 1.5 && box.min.y <= v.y0 + .6) faces[id]!.hasDoor = true;
    });
  }
  return { faces, elevated: v.y0 > minY + .6 };
}

function lookOf(theme: string | undefined, name: string): FacadeLook | "tower" {
  if (/仓库|厂房|锅炉|工厂|机库|车间|库房/.test(name)) return "industrial";
  if (/便利店|商店|店|铺|街机|拉面|集市/.test(name)) return "shop";
  if (/塔|瞭望|钟楼|风车/.test(name)) return "tower";
  if (theme === "科幻" || theme === "赛博朋克") return "tech";
  if (/公寓|办公|旅馆|诊所|大楼|楼体/.test(name) && theme !== "欧式" && theme !== "日式" && theme !== "异域" && theme !== "奇幻") return theme === "蒸汽朋克" ? "classical" : "modern";
  return theme === "欧式" && /钟楼|议会|大厅/.test(name) ? "classical" : "house";
}

/** 能不能做成空壳：室内净宽 ≥ 2.4m、面积 ≥ 9m²、净高 ≥ 2.4m，且在平面上不压住其他体量。 */
export function canHollow(body: Body, bodies: Body[]) {
  const v = body.vol;
  if (v.hx * 2 < 2.8 || v.hz * 2 < 2.8 || 4 * v.hx * v.hz < 9 || v.y1 - v.y0 < 2.55) return false;
  return !bodies.some(other => {
    if (other === body) return false;
    // 岗亭一类小体量落在大体量里不算压住（它们自己也不会被改成空壳）
    if (other.vol.hx * 2 < 2.8 || other.vol.hz * 2 < 2.8 || 4 * other.vol.hx * other.vol.hz < 9) return false;
    const ox = Math.min(body.box.max.x, other.box.max.x) - Math.max(body.box.min.x, other.box.min.x), oz = Math.min(body.box.max.z, other.box.max.z) - Math.max(body.box.min.z, other.box.min.z), oy = Math.min(body.box.max.y, other.box.max.y) - Math.max(body.box.min.y, other.box.min.y);
    // 上下叠着、只在接缝处相贴的体量（退台上层房间）不算压住
    return ox > .05 && oz > .05 && oy > .15 && ox * oz > .3;
  });
}

/** 实心体量补立面；返回新增部件和空壳计划。chimney 等小件一并处理。 */
function dressBodies(parts: ModelPart[], theme: string | undefined, name: string, room: number): { made: ModelPart[]; plans: HollowPlan[] } {
  const bodies = findBodies(parts), plans: HollowPlan[] = [];
  if (!bodies.length || room < 6) return { made: [], plans };
  let minY = Infinity;
  for (const value of parts) { const box = worldBox(value); if (box) minY = Math.min(minY, box.min.y); }
  const wallColor = dominantWallColor(parts), seed = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const b = new FacadeBuilder();
  const look = lookOf(theme, name);
  const tower = look === "tower";
  const style = facadeStyle(theme, tower ? "house" : look, bodies[0]!.part.color, seed);
  if (tower) { style.win = { w: .38, h: 1.1, sill: 1.1, spacing: 2.8 }; style.shutter = undefined; style.sillLintel = false; style.band = false; style.cornice = false; style.awning = undefined; }
  facadeGroups(b, style);
  let windows = 0, doors = 0, first = true;
  // 大体量先做；同一座建筑里只补一扇门
  const sorted = [...bodies].sort((p, q) => q.vol.hx * q.vol.hz * (q.vol.y1 - q.vol.y0) - p.vol.hx * p.vol.hz * (p.vol.y1 - p.vol.y0));
  for (const body of sorted) {
    const { faces, elevated } = facesOf(body, parts, bodies, minY);
    // 空壳：体量够大、不压住别的体量，且部件预算还够造墙板（每个体量约 3 个部件）
    const hollow = !tower && canHollow(body, bodies) && room >= 16 + plans.length * 3;
    const collect: Opening[] = [], extraDoors: Opening[] = [], existing: Opening[] = [], remove: ModelPart[] = [], glass: ModelPart[] = [];
    if (hollow) faces.forEach((face, id) => {
      for (const occ of face.occupied) {
        if (!occ.kind || !occ.part) continue;
        if (occ.kind === "window") { existing.push({ face: id, t0: occ.t0, t1: occ.t1, y0: occ.y0, y1: occ.y1, kind: "window" }); glass.push(occ.part); continue; }
        // 已有的门：玻璃门留着（变半透明）；木门拆掉原来贴在墙面上的门扇，补门框，再把门扇（沿用原色）嵌回洞里
        const door: Opening = { face: id, t0: occ.t0, t1: occ.t1, y0: Math.max(occ.y0, body.vol.y0 + .1), y1: occ.y1, kind: "door", color: occ.part.color };
        existing.push(door);
        if (/玻璃/.test(occ.part.name)) glass.push(occ.part); else { remove.push(occ.part); extraDoors.push(door); }
      }
    });
    const result = dressVolume(b, body.vol, faces, style, { door: hollow || (first && !elevated), seed, maxBoxes: 220, plinth: !elevated, hollow, collect, extraDoors });
    windows += result.windows; doors += result.doors;
    if (result.doors) first = false;
    if (hollow) {
      const openings = [...existing, ...collect];
      // 洞口太多（幕墙一类）墙板会碎成一大堆，保持实心
      if (openings.length <= 60) { plans.push({ body, storeys: Math.max(1, Math.round((body.vol.y1 - body.vol.y0) / style.storey)), openings, removeParts: remove, glassParts: glass, style }); bodyHoles.set(body.part, openings); }
    }
  }
  void wallColor;
  const made = b.parts().slice(0, Math.max(0, room - 3));
  // 烟囱：顶上加压顶和一圈砖带
  const chimneys = parts.filter(value => value.shape === "box" && /烟囱|烟筒/.test(value.name) && value.scale.y >= .8 && yawOf(value) !== undefined);
  if (chimneys.length && made.length < room - 1) {
    const c = new Builder().group("chim", "烟囱压顶", "#8b8478", { roughness: .9 });
    for (const chimney of chimneys.slice(0, 3)) {
      const top = chimney.position.y + chimney.scale.y / 2, { x, z } = chimney.position;
      c.boxYaw("chim", x, top + .05, z, chimney.scale.x + .16, .1, chimney.scale.z + .16, yawOf(chimney) ?? 0);
      c.boxYaw("chim", x, top - .35, z, chimney.scale.x + .08, .1, chimney.scale.z + .08, yawOf(chimney) ?? 0);
    }
    for (const value of c.parts()) { value.color = shade(chimneys[0]!.color, 1.18); made.push(value); }
  }
  void windows; void doors;
  return { made, plans };
}

/** 旧库建筑的统一细化入口：调用方传入深拷贝后的部件；任何一步出错保持原样。maxParts 给变体和状态变化留余量。 */
export function refineLegacyBuilding(parts: ModelPart[], theme: string | undefined, name: string, maxParts: number) {
  const fingerprint = JSON.stringify(parts);
  try { normalizeRoofs(parts); } catch { /* 保持原样 */ }
  const roofBoxes = parts.filter(value => pitchedRoofs.has(value)).map(value => worldBox(value)).filter((box): box is Box3 => !!box);
  try { addBuildingDetails(parts, theme, undefined, "建筑", name, maxParts, 2.2); } catch { /* 保持原样 */ }
  try { parts.push(...dressColumns(parts, theme, maxParts - parts.length - 2, { bases: theme === "中式", rails: !parts.some(value => /栏|凳|座椅|扶手|美人靠|护/.test(value.name)) && /亭|榭|廊|棚|阁/.test(name), roofs: roofBoxes })); } catch { /* 保持原样 */ }
  try {
    const glass = facadeStyle(theme, "house", "#999999", 0), room = maxParts - parts.length - 2;
    if (room >= 3) parts.push(...dressRoundTowers(parts, theme, room, { pane: glass.pane, frame: glass.frame }));
  } catch { /* 保持原样 */ }
  let plans: HollowPlan[] = [];
  try {
    const budget = 48000 - parts.reduce((sum, value) => sum + triangles(value), 0);
    if (budget > 6000) {
      const result = dressBodies(parts, theme, name, maxParts - parts.length);
      plans = result.plans;
      let used = 0;
      for (const value of result.made) { used += triangles(value); if (used > budget - 2000 || parts.length >= maxParts) break; parts.push(value); }
    }
  } catch { plans = []; }
  // 石墙、砖墙砌缝：最后做，立面门窗在它前面
  try {
    const budget = 48000 - parts.reduce((sum, value) => sum + triangles(value), 0);
    if (budget > 3000) for (const value of dressMasonry(parts, maxParts - parts.length)) { if (parts.length >= maxParts) break; parts.push(value); }
  } catch { /* 保持原样 */ }
  // 逐级收分的台塔补中央踏道
  try { for (const value of dressTiers(parts, maxParts - parts.length)) { if (parts.length >= maxParts) break; parts.push(value); } } catch { /* 保持原样 */ }
  // 金属外壳面板、木板缝
  try {
    const budget = 48000 - parts.reduce((sum, value) => sum + triangles(value), 0), seed = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    if (budget > 3000) for (const value of dressPanels(parts, theme, maxParts - parts.length, seed)) { if (parts.length >= maxParts) break; parts.push(value); }
  } catch { /* 保持原样 */ }
  // 造型件（拱桥、门、塔、井、帐篷、科幻舱体等）的专用细化
  try { for (const value of dressShapes(parts, theme, name, maxParts - parts.length)) { if (parts.length >= maxParts) break; parts.push(value); } } catch { /* 保持原样 */ }
  // 实心体量改成空壳（墙上开真的门窗洞）并布置室内；预算不够就保持实心
  try {
    const shell = applyHollows(parts, plans, theme, maxParts);
    if (shell) furnishHollows(parts, theme, name, maxParts, shell);
  } catch { /* 保持原样 */ }
  // 以上都没改动模型（门、拱、桥一类造型件）：给石、砖、土大块补压顶和底座线脚作兜底
  try { if (JSON.stringify(parts) === fingerprint) for (const value of dressEdges(parts, maxParts - parts.length)) { if (parts.length >= maxParts) break; parts.push(value); } } catch { /* 保持原样 */ }
}

/** 旧库手写建筑的入口：深拷贝部件后细化；部件数或三角形超出预算时退回原模型。cap 给款式和状态变化留余量。 */
export function refineSourceModel<T extends { name: string; parts: ModelPart[] }>(model: T, theme: string | undefined, name: string, cap = 100): T {
  try {
    const parts = structuredClone(model.parts);
    refineLegacyBuilding(parts, theme, name, cap);
    if (parts.length > cap || parts.reduce((sum, value) => sum + triangles(value), 0) > 48000) return model;
    return { ...model, parts };
  } catch { return model; }
}
