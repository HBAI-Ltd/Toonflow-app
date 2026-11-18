import { Quaternion, Vector3 } from "three";
import type { ModelPart } from "../assetModelParts";
import { addInterior } from "./buildingInterior";
import { columnDressing, coneRoofs, dominantWallColor, flatRoofEdges, seedOf, styleOf, windowFrames } from "./buildingDetails";
import { dressBattlement } from "./chineseBattlement";
import { balustradePanels, postInfill } from "./chineseRailing";
import { chooseStyle, roofKitParts, shade, type RoofKitInput, type RoofStyle } from "./chineseRoofKit";
import { dressStall } from "./chineseStallDressing";
import { dressWalls, type RoofFrame } from "./chineseWallDressing";
import { DEG, triangles, yawOf } from "./partMath";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { pitchedRoofs, profileBodies, roofSpecs, slopeRoofs } from "./roofRegistry";

// 建筑生成后的统一细化入口：屋面换成曲面/平直瓦屋顶套件，外墙补线脚与门窗框，玻璃窗补窗框，栏杆补栏柱。
// 中式主题用中式形制（翘角、额枋、壁柱、宫灯）；其他建筑按主题取色，形制平直克制。
const HARD_MAX_PARTS = 120, MAX_TRIANGLES = 48000, BOXES_PER_MESH = 16;
// 部件数上限：新生成的素材用满 120；旧库素材要给款式和状态变化留余量，由入口按调用传入
let MAX_PARTS = HARD_MAX_PARTS;
// 旧库里的门楼、牌坊、鸟居屋面又薄又长（进深 < 2.2m），套件的歇山/庑殿形制不适用，旧库入口把门槛提到 2.2m
let MIN_ROOF_DEPTH = 1.2;

function localMesh(name: string, color: string, boxes: SolidBox[], source: ModelPart): ModelPart[] {
  const meshes: ModelPart[] = [];
  for (let i = 0; i < boxes.length; i += BOXES_PER_MESH) {
    const value = boxesMesh(name, color, boxes.slice(i, i + BOXES_PER_MESH));
    value.position = { ...source.position };
    value.rotation = { ...source.rotation };
    meshes.push(value);
  }
  return meshes;
}

// 栏杆：长而扁的扶手条补上望柱、栏柱与下横栏，沿用扶手自身的位置和朝向。
function railDetail(rail: ModelPart, meshBudget: number): ModelPart[] {
  const alongX = rail.scale.x >= rail.scale.z, length = alongX ? rail.scale.x : rail.scale.z;
  const make = (u: number, y: number, w: number, h: number, d: number): SolidBox => ({ center: alongX ? [u, y, 0] : [0, y, u], size: alongX ? [w, h, d] : [d, h, w] });
  const posts = Math.max(2, Math.ceil(length / .42)), boxes: SolidBox[] = [make(0, -.58, length, .07, .08)];
  for (let i = 0; i <= posts; i++) boxes.push(make(-length / 2 + length * i / posts, -.4, .06, .8, .06));
  for (const s of [-1, 1]) boxes.push(make(s * (length / 2 - .06), -.33, .13, .95, .13), make(s * (length / 2 - .06), .2, .19, .08, .19));
  return localMesh("栏杆望柱栏柱", rail.color, boxes.slice(0, meshBudget * BOXES_PER_MESH), rail);
}

// 一处待替换的屋面：来源部件、套件局部坐标原点（屋面基线中心）、偏航与套件输入。
type Candidate = {
  sources: ModelPart[]; origin: Vector3; yaw: number; width: number; depth: number; overhang: [number, number];
  rise?: number; kind: "tiled" | "pitched" | "slope" | "profile"; color: string; label?: string;
  /** 固定屋面形制（单坡、茅草等）；缺省按平面比例选择 */
  style?: RoofStyle; thatch?: boolean;
};

// 屋面类名称：排除墙、脊、枋、柱等同名词的构件。
const ROOF_NAME = /瓦|屋顶|屋盖|屋面|坡盖|单坡|草顶|茅顶|草棚|苇草|柴棚顶/, NOT_ROOF = /山墙|脊|枋|梁|柱|撑|栏|门|窗|烟|台阶|踏|拱|穹|弧|圆|环/, THATCH_NAME = /茅|草|苇|柴棚/;

// 剖面拉伸体（profileBody）的屋面识别：四点平行四边形为单坡，五六点对称山形为双坡；更多点数的弧形、拱形不碰。
function slabOf(profile: [number, number][]): { kind: "gable" | "shed"; width: number; rise: number; baseY: number; centerX: number; flip: boolean } | undefined {
  const xs = profile.map(p => p[0]), xmin = Math.min(...xs), xmax = Math.max(...xs), width = xmax - xmin;
  if (width < 1) return undefined;
  const top = (x: number) => Math.max(...profile.filter(p => Math.abs(p[0] - x) < 1e-6).map(p => p[1]));
  const a = top(xmin), b = top(xmax), centerX = (xmin + xmax) / 2;
  if (profile.length === 4) {
    const rise = Math.abs(b - a);
    return rise < .2 ? undefined : { kind: "shed", width, rise, baseY: Math.min(a, b), centerX, flip: a > b };
  }
  if (profile.length < 5 || profile.length > 6 || Math.abs(a - b) > .2) return undefined;
  const apex = profile.reduce((best, p) => p[1] > best[1] ? p : best, profile[0]!);
  if (Math.abs(apex[0] - centerX) > width * .15 || apex[1] - a < .3) return undefined;
  return { kind: "gable", width, rise: apex[1] - a, baseY: a, centerX, flip: false };
}

function candidates(parts: ModelPart[], mode: "chinese" | "other" | "none"): Candidate[] {
  const result: Candidate[] = [], done = new Set<unknown>();
  for (const value of parts) {
    const yaw = yawOf(value);
    if (yaw === undefined || Math.abs(value.scale.x - 1) > 1e-6 || Math.abs(value.scale.y - 1) > 1e-6 || Math.abs(value.scale.z - 1) > 1e-6) continue;
    const spec = roofSpecs.get(value);
    if (spec) {
      result.push({ sources: [value], origin: new Vector3(value.position.x, value.position.y, value.position.z), yaw, width: spec.width, depth: spec.depth, overhang: [.6, .5], kind: "tiled", color: value.color });
      continue;
    }
    if (mode === "none") continue;
    if (pitchedRoofs.has(value) && value.shape === "extrude" && value.profile && /瓦|屋顶|屋面|屋盖/.test(value.name) && !NOT_ROOF.test(value.name)) {
      // 双坡挤出屋面：宽度取轮廓，坡高取调用方改过后的轮廓最高点；轮廓首点为檐口。
      const xs = value.profile.map(p => p.x), width = Math.max(...xs) - Math.min(...xs), baseY = value.profile[0]!.y, rise = Math.max(...value.profile.map(p => p.y)) - baseY, depth = value.depth ?? .2;
      if (width < 1.2 || depth < MIN_ROOF_DEPTH || rise < .25) continue;
      result.push({ sources: [value], origin: new Vector3(value.position.x, value.position.y + baseY, value.position.z), yaw, width, depth, overhang: [0, 0], rise, kind: "pitched", color: value.color, label: `${value.name}·`, thatch: THATCH_NAME.test(value.name) });
      continue;
    }
    // 未登记的挤出体（直接 part(..., "extrude") 写的屋面）也按轮廓识别
    const body = profileBodies.get(value) ?? (value.shape === "extrude" && value.profile && !pitchedRoofs.has(value) ? { profile: value.profile.map((p): [number, number] => [p.x, p.y]), depth: value.depth ?? .2 } : undefined);
    if (body && ROOF_NAME.test(value.name) && !NOT_ROOF.test(value.name)) {
      const slab = slabOf(body.profile);
      if (!slab || body.depth < MIN_ROOF_DEPTH) continue;
      const offset = new Vector3(slab.centerX, slab.baseY, 0).applyAxisAngle(new Vector3(0, 1, 0), yaw * DEG), thatch = THATCH_NAME.test(value.name);
      result.push({ sources: [value], origin: new Vector3(value.position.x + offset.x, value.position.y + offset.y, value.position.z + offset.z), yaw: yaw + (slab.flip ? 180 : 0), width: slab.width, depth: body.depth, overhang: [0, 0], rise: slab.rise, kind: "profile", color: value.color, label: `${value.name}·`, style: slab.kind, thatch });
      continue;
    }
    const slope = slopeRoofs.get(value);
    if (slope && !done.has(slope) && /瓦|屋顶|屋面|屋盖/.test(value.name) && !NOT_ROOF.test(value.name)) {
      done.add(slope);
      const pair = parts.filter(other => slopeRoofs.get(other) === slope);
      if (pair.length !== 2 || pair.some(other => Math.abs((yawOf(other) ?? 999) - yaw) > .01 || other.position.x !== value.position.x || other.position.z !== value.position.z)) continue;
      const offset = new Vector3(slope.centerX, slope.eave, slope.centerZ).applyAxisAngle(new Vector3(0, 1, 0), yaw * DEG);
      if (slope.width < 2.2 || slope.length < 2.2 || slope.rise < .4) continue;
      result.push({ sources: pair, origin: new Vector3(value.position.x + offset.x, value.position.y + offset.y, value.position.z + offset.z), yaw, width: slope.width, depth: slope.length, overhang: [0, 0], rise: slope.rise, kind: "slope", color: slope.color, label: `${value.name}·`, thatch: THATCH_NAME.test(value.name) });
    }
  }
  return result;
}

type Plan = { candidate: Candidate; corners: [number, number][]; area: number };

// 屋面在地面上的投影矩形（含檐口出挑，向内收 .3m，使共墙相接的前后屋面也算重叠）。
function planOf(candidate: Candidate): Plan {
  const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), candidate.yaw * DEG);
  const corners = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([sx, sz]) => {
    const point = new Vector3(sx * (candidate.width / 2 + candidate.overhang[0] - .3), 0, sz * (candidate.depth / 2 + candidate.overhang[1] - .3)).applyQuaternion(q);
    return [candidate.origin.x + point.x, candidate.origin.z + point.z] as [number, number];
  });
  return { candidate, corners, area: candidate.width * candidate.depth };
}

function overlaps(p: Plan, q: Plan) {
  // 凸多边形分离轴检测
  for (const polygon of [p.corners, q.corners]) for (let i = 0; i < 4; i++) {
    const [x1, z1] = polygon[i]!, [x2, z2] = polygon[(i + 1) % 4]!, axis: [number, number] = [z1 - z2, x2 - x1];
    const range = (corners: [number, number][]) => corners.map(([x, z]) => x * axis[0] + z * axis[1]);
    const a = range(p.corners), b = range(q.corners);
    if (Math.max(...a) <= Math.min(...b) + 1e-6 || Math.max(...b) <= Math.min(...a) + 1e-6) return false;
  }
  return true;
}

function toLocal(candidate: Candidate, point: ModelPart["position"]) {
  return new Vector3(point.x - candidate.origin.x, point.y - candidate.origin.y, point.z - candidate.origin.z).applyAxisAngle(new Vector3(0, 1, 0), -candidate.yaw * DEG);
}

/** 建筑生成后的统一细化。theme/group/itemType 来自目录条目；非中式只处理建筑，设施（多为设备）、构件、家具不处理。 */
export function addBuildingDetails(parts: ModelPart[], theme?: string, group?: string, itemType?: string, name?: string, maxParts = HARD_MAX_PARTS, minRoofDepth = 1.2): void {
  MAX_PARTS = Math.min(HARD_MAX_PARTS, maxParts); MIN_ROOF_DEPTH = minRoofDepth;
  try { detail(parts, theme, group, itemType, name); } finally { MAX_PARTS = HARD_MAX_PARTS; MIN_ROOF_DEPTH = 1.2; }
}

function detail(parts: ModelPart[], theme: string | undefined, group: string | undefined, itemType: string | undefined, name: string | undefined): void {
  const chinese = theme === "中式", mode = chinese ? "chinese" : itemType === "建筑" ? "other" : "none";
  const plainLook = mode === "other";
  let budget = MAX_TRIANGLES - parts.reduce((sum, value) => sum + triangles(value), 0);
  // 细节只是锦上添花：任何一步出错都退回原模型，不能让整个素材生成失败。
  let found: Candidate[] = [];
  try { found = candidates(parts, mode); } catch { found = []; }
  const wallColor = plainLook && found.some(candidate => candidate.kind !== "tiled") ? dominantWallColor(parts) : "#d6cdb6";
  // 同一模型内相互重叠且高度相近的屋面（前后接屋、披屋）保持双坡，主屋面才做庑殿/歇山，避免翼角互相穿插。
  const plans = found.map(planOf).sort((p, q) => q.area - p.area), primary: Plan[] = [], forcedGable = new Set<Candidate>();
  for (const plan of plans) {
    if (plan.candidate.kind !== "tiled" || plan.candidate.style !== undefined || primary.some(other => Math.abs(other.candidate.origin.y - plan.candidate.origin.y) < 1.8 && overlaps(plan, other))) forcedGable.add(plan.candidate);
    if (plan.candidate.kind === "tiled" ? !forcedGable.has(plan.candidate) : true) primary.push(plan);
  }
  // 1) 屋面：把占位屋面替换为屋顶套件；预算不足时保留原屋面。
  for (const candidate of found) {
    const capacity = MAX_PARTS - parts.length + candidate.sources.length;
    if (capacity < 2) continue;
    const style: RoofStyle = candidate.style ?? (forcedGable.has(candidate) ? "gable" : chooseStyle(candidate.width, candidate.depth));
    const thatch = candidate.thatch === true, plain = plainLook && !thatch;
    const input: RoofKitInput = {
      width: candidate.width, depth: candidate.depth, style, color: candidate.color, overhang: candidate.overhang,
      ...(thatch ? { thatch: true, trimColor: shade(candidate.color, 1.18) } : plain ? { plain: true, gableWall: wallColor, trimColor: shade(candidate.color, 1.16) } : { gableWall: "#d6cdb6", ...(candidate.kind === "tiled" ? {} : { curve: style === "shed" ? 1.15 : 1.1 }) }),
      ...(candidate.rise ? { rise: candidate.rise } : {}), ...(candidate.label ? { label: candidate.label } : {}),
    };
    const kit: ModelPart[] = [];
    let used = -candidate.sources.reduce((sum, value) => sum + triangles(value), 0), made: ModelPart[] = [];
    try { made = roofKitParts(input); } catch { made = []; }
    for (const value of made) {
      if (kit.length >= capacity || used + triangles(value) > budget - 2500) break;
      value.position = { x: candidate.origin.x, y: candidate.origin.y, z: candidate.origin.z }; value.rotation = { x: 0, y: candidate.yaw, z: 0 };
      kit.push(value); used += triangles(value);
    }
    if (kit.length < 2) continue;
    budget -= used;
    const first = Math.min(...candidate.sources.map(value => parts.indexOf(value)));
    for (const value of candidate.sources) parts.splice(parts.indexOf(value), 1);
    parts.splice(Math.min(first, parts.length), 0, ...kit);
    if (candidate.kind === "tiled" && style !== "gable") {
      // 庑殿/歇山自带短脊：去掉调用方叠加的通长屋脊条，避免脊条伸出屋面外。
      for (let other = parts.length - 1; other >= 0; other--) {
        const bar = parts[other]!;
        if (bar.shape !== "box" || !/脊/.test(bar.name)) continue;
        const local = toLocal(candidate, bar.position);
        if (Math.abs(local.x) <= candidate.width / 2 + 1 && Math.abs(local.z) <= candidate.depth / 2 + 1.2 && local.y > 0 && local.y < candidate.width * .2 + 1.2) parts.splice(other, 1);
      }
    }
  }
  if (mode === "none") return;
  const frames: RoofFrame[] = found.map(candidate => ({ x: candidate.origin.x, y: candidate.origin.y, z: candidate.origin.z, yaw: candidate.yaw, hx: candidate.width / 2 + candidate.overhang[0], hz: candidate.depth / 2 + candidate.overhang[1] }));
  if (!chinese) { addGeneralDetails(parts, theme, group, frames, budget); addInteriorStep(parts, theme, group, itemType, name, frames); return; }
  // 2) 外墙装修：额枋、壁柱、门窗框、窗棂、门前宫灯。
  let dressing: ModelPart[] = [];
  try { dressing = budget > 6000 ? dressWalls(parts, MAX_PARTS - parts.length - 4, frames) : []; } catch { dressing = []; }
  for (const value of dressing) budget -= triangles(value);
  parts.push(...dressing);
  // 夯土敌台、城台的平顶：补女墙和垛口。
  try { if (budget > 4000) parts.push(...dressBattlement(parts, MAX_PARTS - parts.length - 2)); } catch { /* 退回原模型 */ }
  // 集市摊位、村口社戏场：角上立旗杆，挂幌旗和宫灯。
  if (group?.includes("集市摊位") || group?.includes("水陆市井") && parts.some(value => /社戏/.test(value.name))) { try { parts.push(...dressStall(parts, MAX_PARTS - parts.length - 1)); } catch { /* 退回原模型 */ } }
  // 3) 石栏板换成石栏杆；只有立柱和横栏的桥栏、廊栏补栏柱、柱帽和灯。
  try {
    if (budget > 4000) { const panels = balustradePanels(parts, MAX_PARTS - parts.length - 4); parts.push(...panels); for (const value of panels) budget -= triangles(value); }
    if (budget > 4000) { const infill = postInfill(parts, MAX_PARTS - parts.length - 4); parts.push(...infill); for (const value of infill) budget -= triangles(value); }
  } catch { /* 退回原模型 */ }
  addRails(parts, budget);
  addInteriorStep(parts, theme, group, itemType, name, frames);
}

// 室内：家具、吊灯、地面纹理；只处理建筑，预算不足时整体跳过，出错退回原模型。
function addInteriorStep(parts: ModelPart[], theme: string | undefined, group: string | undefined, itemType: string | undefined, name: string | undefined, frames: RoofFrame[]) {
  if (itemType !== "建筑") return;
  const room = MAX_PARTS - parts.length - 1, budget = MAX_TRIANGLES - parts.reduce((sum, value) => sum + triangles(value), 0);
  if (room < 5 || budget < 9000) return;
  try {
    const added = addInterior(parts, { theme, name: name ?? "", group, frames, room });
    let used = 0;
    for (const value of added) { used += triangles(value); if (used > budget - 1200) break; parts.push(value); }
  } catch { /* 退回原模型 */ }
}

// 栏杆：补望柱、栏柱和下横栏。
function addRails(parts: ModelPart[], budget: number) {
  const extra: ModelPart[] = [];
  try {
    for (const value of parts) {
      const room = MAX_PARTS - parts.length - extra.length;
      if (room < 1 || budget < 3000) break;
      if (value.shape === "box" && /扶手|栏杆|护栏|扶栏/.test(value.name)) {
        const long = Math.max(value.scale.x, value.scale.z), thin = Math.min(value.scale.x, value.scale.z);
        if (long >= 1.2 && thin <= .2 && value.scale.y <= .2) extra.push(...railDetail(value, Math.min(2, room)));
      }
    }
  } catch { extra.length = 0; }
  parts.push(...extra);
}

// 其他主题的建筑与设施：玻璃窗框、外墙线脚、平屋顶檐口与女儿墙、栏杆。
function addGeneralDetails(parts: ModelPart[], theme: string | undefined, group: string | undefined, frames: RoofFrame[], budgetIn: number) {
  let budget = budgetIn;
  const style = styleOf(theme, seedOf(`${group ?? ""}${parts.length}`)), wallColor = dominantWallColor(parts);
  let windows = 0;
  try {
    if (budget > 5000) {
      const result = windowFrames(parts, style, MAX_PARTS - parts.length - 6);
      parts.push(...result.parts); windows = result.count; for (const value of result.parts) budget -= triangles(value);
    }
  } catch { /* 退回原模型 */ }
  try {
    if (budget > 5000) {
      const wall = dressWalls(parts, MAX_PARTS - parts.length - 4, frames, { mode: style.wall, trim: shade(wallColor, theme === "欧式" ? 1.1 : .86), stone: shade(wallColor, .74), frame: style.frame, frames: windows === 0 });
      parts.push(...wall); for (const value of wall) budget -= triangles(value);
    }
  } catch { /* 退回原模型 */ }
  try {
    if (budget > 4000) { const roofs = flatRoofEdges(parts, style, MAX_PARTS - parts.length - 2); parts.push(...roofs); for (const value of roofs) budget -= triangles(value); }
  } catch { /* 退回原模型 */ }
  // 立柱的柱础和柱头、锥顶屋面的放射瓦楞：古典、异域、奇幻和无主题的建筑常见。
  try {
    if (budget > 4000 && theme !== "科幻" && theme !== "赛博朋克" && theme !== "现代") { const columns = columnDressing(parts, theme, MAX_PARTS - parts.length - 3); parts.push(...columns); for (const value of columns) budget -= triangles(value); }
    if (budget > 4000) { const cones = coneRoofs(parts, MAX_PARTS - parts.length - 1); parts.push(...cones); for (const value of cones) budget -= triangles(value); }
  } catch { /* 退回原模型 */ }
  addRails(parts, budget);
}
