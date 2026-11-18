import { z } from "@toonflow/nodes-scaffold/runtime";
import { Box3, Vector3 } from "three";
import { resolveAssetModel } from "./assetModelResolver";
import { createSceneBrushPath } from "./aiPlacement";
import { usesNativeScale } from "./assetLibrary";
import { getAssetItemType, getAssetPlacementScale } from "./assetMetadata";
import { createModelGroup, type ModelDefinition } from "./modelGeometry";
import { measureCollisionBounds } from "./sceneCollision";
import { createSceneObject, type SceneAsset, type SceneDocument, type SceneObject } from "./sceneDocument";
import { disposeObject } from "./sceneResources";
import { getTerrainHeight, worldSizeLimits } from "./terrainModel";

// ACT: 影棚布景：按真实占地和素材自己的正面成组摆放（沿墙、围成环、阵列、沿线、围坐），再放成群的胶囊人。
// 弱模型逐件猜坐标和朝向会散乱、穿插；这里按确定规则摆，Agent只需决定摆什么、摆在哪片区域、朝向哪里。

type Planar = { x: number; z: number };
export type Footprint = { width: number; depth: number; height: number; front: Planar };
const footprints = new Map<string, Footprint>();
// 素材正面：门、入口、柜门、抽屉、招牌、车头、船头、床尾、动物的头所在的一侧；靠背、椅背、后墙、车尾、床头、尾巴的反侧。
// 各素材库朝向约定不同，按部件名和位置判断；名字里前后（首尾、头尾）都有的部件不算。
const frontPart = /前|正面|临街|门面|入口|大门|店门|柜门|抽屉|招牌|匾|遮阳篷|雨棚|雨篷|橱窗|灯箱|售卖|台口|键盘|琴键|按键|输入|鼠标|车头|大灯|船头|船首|舰首|机头|头颅|头部|马头|牛头|兽头|口鼻|吻部|辕|车把|驾驶|床尾|门(?!楼|槛|框|闩|轴)/;
const backPart = /后|背(?!包|心|景灯)|车尾|尾灯|船尾|舰尾|摇橹|尾舵|尾巴|马尾|尾部|尾羽|尾鳍|床头/;
const animalFront = /头|喙|嘴|吻|鼻|眼|脸|面部|面盘|角|鬃/, animalBack = /尾|臀/;
const twoEnded = /前.*后|后.*前|首.*尾|头.*尾|尾.*头/;
/** 按部件名判断素材正面；detected=false表示没有可辨认的部件、用的是默认-Z。animal时头、喙、眼也算正面，尾、臀算背面。 */
export function detectModelFront(definition: ModelDefinition, animal = false): { front: Planar; detected: boolean } {
  const parts = definition.parts;
  if (!parts.length) return { front: { x: 0, z: -1 }, detected: false };
  // 只按部件position识别。网格部件（position全为0、坐标都在顶点里）不按顶点猜：门窗框四面都有，猜出来常常是反的，维持-Z约定更稳。
  // 中心取部件位置的包围盒中点：部件扎堆在一侧时平均值会被拉偏（钢琴的琴键、踏板都在前侧）。
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const part of parts) { minX = Math.min(minX, part.position.x); maxX = Math.max(maxX, part.position.x); minZ = Math.min(minZ, part.position.z); maxZ = Math.max(maxZ, part.position.z); }
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  let vx = 0, vz = 0;
  for (const part of parts) {
    if (twoEnded.test(part.name)) continue;
    const front = frontPart.test(part.name) || animal && animalFront.test(part.name), back = backPart.test(part.name) || animal && animalBack.test(part.name);
    const sign = front && !back ? 1 : back && !front ? -1 : 0;
    if (sign) { vx += sign * (part.position.x - cx); vz += sign * (part.position.z - cz); }
  }
  // 没有可辨认的部件时按建筑库约定：临街正面在局部-Z。
  if (Math.hypot(vx, vz) < 0.05) return { front: { x: 0, z: -1 }, detected: false };
  return { front: Math.abs(vx) > Math.abs(vz) ? { x: Math.sign(vx), z: 0 } : { x: 0, z: Math.sign(vz) }, detected: true };
}
const isPerson = (asset: SceneAsset) => asset.shape === "person" || asset.shape === "seatedPerson" || asset.shape === "kneelingPerson" || asset.shape === "riggedPerson";
/** 素材摆进场景后的真实占地和正面方向：和视口同一套造型、碰撞包围盒和缩放规则（视口按包围盒中心对齐摆放位置）。外部GLB无法测量时返回undefined。 */
export function measureAssetFootprint(asset: SceneAsset): Footprint | undefined {
  const cached = footprints.get(asset.id);
  if (cached) return cached;
  if (asset.kind === "primitive") return asset.shape === "seatedPerson" ? { width: 0.5, depth: 0.7, height: 1.3, front: { x: 0, z: 1 } } : asset.shape === "kneelingPerson" ? { width: 0.5, depth: 0.6, height: 1.17, front: { x: 0, z: 1 } } : isPerson(asset) ? { width: 0.5, depth: 0.4, height: 1.75, front: { x: 0, z: 1 } } : { width: 1, depth: 1, height: 1, front: { x: 0, z: -1 } };
  if (asset.path || !(asset.model || asset.recipe || asset.blueprint)) return undefined;
  const definition = resolveAssetModel(asset);
  if (!definition) return undefined;
  const model = createModelGroup(definition);
  try {
    const bounds = measureCollisionBounds(model, new Box3());
    if (bounds.isEmpty()) return undefined;
    const size = bounds.getSize(new Vector3());
    const scale = asset.contentTransform?.scale ?? (usesNativeScale(asset) ? 1 : getAssetPlacementScale(asset, size));
    const result = { width: size.x * scale, depth: size.z * scale, height: size.y * scale, front: detectModelFront(definition, getAssetItemType(asset) === "动物").front };
    footprints.set(asset.id, result);
    if (footprints.size > 512) footprints.delete(footprints.keys().next().value!);
    return result;
  } finally { disposeObject(model); }
}
/** 让素材正面朝向世界方向dir的Y旋转角度（度）。 */
export function faceRotation(footprint: Footprint, dir: Planar) {
  let degrees = (Math.atan2(dir.x, dir.z) - Math.atan2(footprint.front.x, footprint.front.z)) * 180 / Math.PI;
  while (degrees > 180) degrees -= 360;
  while (degrees <= -180) degrees += 360;
  return Math.round(degrees * 100) / 100;
}

// 占地矩形（俯视）：中心、半宽（局部X）、半深（局部Z）、Y旋转。
export type Rect = { x: number; z: number; hw: number; hd: number; angle: number };
export function rectFor(footprint: Footprint, x: number, z: number, rotation: number, scaleX = 1, scaleZ = 1, margin = 0): Rect {
  return { x, z, hw: Math.max(0.05, footprint.width * scaleX / 2 - margin), hd: Math.max(0.05, footprint.depth * scaleZ / 2 - margin), angle: rotation * Math.PI / 180 };
}
function axes(rect: Rect): [Planar, Planar] { return [{ x: Math.cos(rect.angle), z: -Math.sin(rect.angle) }, { x: Math.sin(rect.angle), z: Math.cos(rect.angle) }]; }
export function rectsOverlap(a: Rect, b: Rect) {
  const [ax, az] = axes(a), [bx, bz] = axes(b);
  for (const axis of [ax, az, bx, bz]) {
    const distance = Math.abs((b.x - a.x) * axis.x + (b.z - a.z) * axis.z);
    const ra = a.hw * Math.abs(ax.x * axis.x + ax.z * axis.z) + a.hd * Math.abs(az.x * axis.x + az.z * axis.z);
    const rb = b.hw * Math.abs(bx.x * axis.x + bx.z * axis.z) + b.hd * Math.abs(bz.x * axis.x + bz.z * axis.z);
    if (distance > ra + rb) return false;
  }
  return true;
}
/** 场景里已占的地：已有物体按真实占地矩形；地面铺装、画出的墙体和贴地薄片（地毯、地板）不挡，东西可以贴墙摆、站在铺装上。 */
export function createOccupancy(document: SceneDocument) {
  const rects: Rect[] = [];
  for (const object of document.objects) {
    if (!object.visible || object.asset.id.startsWith("brushPaving") || object.asset.id.startsWith("brushWall")) continue;
    const footprint = measureAssetFootprint(object.asset);
    if (!footprint || footprint.height * object.scale.y < 0.35) continue;
    rects.push(rectFor(footprint, object.position.x, object.position.z, object.rotation.y, object.scale.x, object.scale.z));
  }
  return {
    blocked: (rect: Rect) => rects.some(other => rectsOverlap(rect, other)),
    add: (rect: Rect) => { rects.push(rect); },
  };
}
export type Occupancy = ReturnType<typeof createOccupancy>;

export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

/** 往草稿里摆一件：贴真实地面、按占地登记；avoid时和已占的地重叠就不摆。 */
export function createPlacer(document: SceneDocument, occupancy: Occupancy, objects: SceneObject[]) {
  const halfSize = (document.terrain?.size ?? worldSizeLimits.default) / 2;
  let skipped = 0;
  return {
    get skipped() { return skipped; },
    place(asset: SceneAsset, footprint: Footprint, x: number, z: number, rotation: number, name: string, options: { avoid?: boolean; color?: string } = {}) {
      const rect = rectFor(footprint, x, z, rotation, 1, 1, 0.04);
      // 越界按转过之后真实的轴向外接范围算（横跨街道的牌坊宽而浅，不能拿宽度去算纵向）。
      const cos = Math.abs(Math.cos(rect.angle)), sin = Math.abs(Math.sin(rect.angle));
      const extentX = cos * rect.hw + sin * rect.hd, extentZ = sin * rect.hw + cos * rect.hd;
      if (Math.abs(x) + extentX > halfSize || Math.abs(z) + extentZ > halfSize || options.avoid !== false && occupancy.blocked(rect)) { skipped++; return undefined; }
      const ground = getTerrainHeight(document.terrain, x, z);
      const object = createSceneObject(asset, { x, y: ground, z });
      object.rotation = { x: 0, y: rotation, z: 0 };
      object.height = ground;
      object.name = name;
      if (options.color) object.color = options.color;
      objects.push(object);
      occupancy.add(rect);
      return object;
    },
  };
}

const coordinate = z.number().finite().min(-10000).max(10000);
const groundPoint = z.strictObject({ x: coordinate, z: coordinate });
const assetId = z.string().min(1).max(160);
const sideNames = ["back", "left", "right", "front"] as const;
type Side = typeof sideNames[number];

export const arrangeAssetsSchema = z.strictObject({
  pattern: z.enum(["walls", "ring", "grid", "line", "around"]).describe("walls沿矩形四边贴边摆、正面朝内（房间家具、院落四周房屋）；ring围成一圈；grid行列阵列；line沿折线；around围着已有物体摆一圈（桌边椅、围坐）"),
  assetIds: z.array(assetId).min(1).max(8).optional().describe("按顺序轮换使用的真实assetId"),
  bySide: z.strictObject({ back: z.array(assetId).max(8).optional(), left: z.array(assetId).max(8).optional(), right: z.array(assetId).max(8).optional(), front: z.array(assetId).max(8).optional() }).optional().describe("walls：每条边各用哪些素材，如back放正房/柜台/主座，left/right放厢房/货架"),
  center: groundPoint.optional().describe("walls/ring/grid的中心"),
  angle: z.number().finite().min(-360).max(360).default(0).describe("布局正前方的朝向角度：0朝+Z（南）、90朝+X（东）、180朝-Z（北）、-90朝-X（西）。walls的front边、grid的朝向都在这一侧，一般朝主机位或门"),
  width: z.number().finite().min(0.5).max(300).optional().describe("walls/grid区域宽（左右方向，米）"),
  depth: z.number().finite().min(0.5).max(300).optional().describe("walls/grid区域进深（前后方向，米）"),
  sides: z.array(z.enum(sideNames)).min(1).max(4).optional().describe("walls用哪几条边，默认back、left、right（前面敞开给机位，影棚三面墙）；left/right按站在front一侧看进去的左右"),
  opening: z.number().finite().min(0).max(100).default(0).describe("walls：front边中间留出的门洞/院门/机位开口宽度"),
  enclose: z.strictObject({ style: z.string().min(1).max(80), height: z.number().finite().min(0.2).max(8).default(3), thickness: z.number().finite().min(0.08).max(2).default(0.3), sides: z.array(z.enum(sideNames)).min(1).max(4).optional() }).optional().describe("walls：沿区域边界砌墙（院墙、室内墙），style用readTerrain.objectBrushes的墙体款式；默认砌sides同样几面，front边在门楼或opening处自动断开"),
  fill: z.boolean().optional().describe("walls：true按素材轮换排满整条边；默认bySide列几件摆几件（居中），只给assetIds时排满"),
  radius: z.number().finite().min(0.3).max(300).optional().describe("ring半径（最内一排）"),
  span: z.number().finite().min(10).max(360).default(360).describe("ring：弧的角度，360整圈；扇形看台、阶梯教室、舰桥控制台用90到200，弧的中间朝angle方向"),
  rings: z.number().int().min(1).max(20).default(1).describe("ring：同心几排（剧场、斗兽场、阶梯教室）"),
  ringStep: z.number().finite().min(0.5).max(30).optional().describe("ring：排距，省略按素材进深+0.6"),
  aisle: z.number().finite().min(0).max(30).default(0).describe("grid：中间纵向过道宽度，把各列分成左右两半（教堂、法庭、影院、机舱、课堂），columns用偶数"),
  bothSides: z.boolean().default(false).describe("line：折线两侧对称各摆一排（柱廊、林荫道、仪仗、站班），count按位置计、每个位置两侧各一件"),
  count: z.number().int().min(1).max(200).optional().describe("ring/line/grid最多摆几件；ring省略时按周长排满"),
  rows: z.number().int().min(1).max(40).optional(),
  columns: z.number().int().min(1).max(40).optional(),
  spacing: z.number().finite().min(0.3).max(100).optional().describe("ring/grid/line的中心间距；省略按真实占地+gap"),
  path: z.array(groundPoint).min(2).max(32).optional().describe("line的折线"),
  offset: z.number().finite().min(-100).max(100).default(0).describe("line：离折线的横向距离，正为行进方向右侧"),
  targetIds: z.array(z.string().min(1).max(160)).min(1).max(30).optional().describe("around：被围的已有物体id（桌子、篝火、病床）"),
  perTarget: z.number().int().min(1).max(16).default(4).describe("around：每个目标周围几件"),
  aroundSides: z.array(z.enum(sideNames)).min(1).max(4).optional().describe("around：只摆在目标的哪几边（相对目标自己的正面）：办公桌front配椅、柜台back站掌柜、床left/right配床头柜、长桌left/right各perSide把椅子"),
  perSide: z.number().int().min(1).max(12).default(1).describe("around配aroundSides时每边几件，沿边居中排开"),
  facing: z.enum(["inward", "outward", "front", "back", "target", "along"]).optional().describe("朝向：inward朝区域中心/目标（walls、ring、around默认），outward朝外，front朝布局正前方（grid默认），back朝后，target朝target点，along顺着线走向（line默认朝向折线）"),
  target: groundPoint.optional().describe("facing=target时面向的点，如戏台、王座、讲台、篝火"),
  gap: z.number().finite().min(0).max(20).default(0.3).describe("相邻两件之间的空隙（米）"),
  avoid: z.boolean().default(true).describe("避开已有物体，压到的位置跳过不摆"),
  seed: z.number().int().min(-2147483648).max(2147483647).default(1),
  name: z.string().trim().min(1).max(40).optional(),
}).superRefine((value, context) => {
  if (!value.assetIds && !value.bySide) context.addIssue({ code: "custom", path: ["assetIds"], message: "请提供assetIds或bySide" });
  if (value.pattern === "walls" && (!value.center || !value.width || !value.depth)) context.addIssue({ code: "custom", path: ["width"], message: "walls需要center、width、depth" });
  if (value.pattern === "ring" && (!value.center || !value.radius)) context.addIssue({ code: "custom", path: ["radius"], message: "ring需要center和radius" });
  if (value.pattern === "grid" && !value.center) context.addIssue({ code: "custom", path: ["center"], message: "grid需要center" });
  if (value.pattern === "line" && !value.path) context.addIssue({ code: "custom", path: ["path"], message: "line需要path" });
  if (value.pattern === "around" && !value.targetIds) context.addIssue({ code: "custom", path: ["targetIds"], message: "around需要targetIds" });
  if (value.facing === "target" && !value.target) context.addIssue({ code: "custom", path: ["target"], message: "facing=target需要target点" });
});

export function arrangeSceneAssets(document: SceneDocument, assetMap: Map<string, SceneAsset>, raw: unknown, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const args = arrangeAssetsSchema.parse(raw);
  const resolve = (id: string) => {
    const asset = assetMap.get(id);
    if (!asset) throw new Error(`素材未登记：${id}，请先用listAssets检索真实assetId`);
    const footprint = measureAssetFootprint(asset);
    if (!footprint) throw new Error(`“${asset.name}”是外部模型，无法测量占地，成组布置只支持内置素材；外部模型请用addAsset逐个摆放`);
    return { asset, footprint };
  };
  const pool = (args.assetIds ?? []).map(resolve);
  const sidePools = Object.fromEntries(sideNames.map(side => [side, (args.bySide?.[side] ?? []).map(resolve)])) as Record<Side, ReturnType<typeof resolve>[]>;
  const objects: SceneObject[] = [];
  const occupancy = createOccupancy(document);
  const placer = createPlacer(document, occupancy, objects);
  const label = (asset: SceneAsset) => args.name ? `${args.name}${asset.name}` : asset.name;
  const angle = args.angle * Math.PI / 180;
  const forward = { x: Math.sin(angle), z: Math.cos(angle) }, right = { x: Math.cos(angle), z: -Math.sin(angle) };
  const center = args.center ?? { x: 0, z: 0 };
  const at = (u: number, v: number) => ({ x: center.x + right.x * u + forward.x * v, z: center.z + right.z * u + forward.z * v });
  const facingAt = (point: Planar, fallback: Planar): Planar => {
    switch (args.facing) {
      case "outward": return { x: -fallback.x, z: -fallback.z };
      case "front": return forward;
      case "back": return { x: -forward.x, z: -forward.z };
      case "target": return { x: args.target!.x - point.x, z: args.target!.z - point.z };
      default: return fallback;
    }
  };
  let cursor = 0;
  const next = (list = pool) => { const item = list[cursor % list.length]!; cursor++; return item; };
  const put = (item: ReturnType<typeof resolve>, point: Planar, dir: Planar) => placer.place(item.asset, item.footprint, point.x, point.z, faceRotation(item.footprint, dir), label(item.asset), { avoid: args.avoid });

  if (args.pattern === "walls") {
    const width = args.width!, depth = args.depth!;
    const sides = args.sides ?? ["back", "left", "right"];
    const listFor = (side: Side) => sidePools[side].length ? sidePools[side] : pool;
    const deepest = (side: Side) => sides.includes(side) && listFor(side).length ? Math.max(...listFor(side).map(item => item.footprint.depth)) : 0;
    // 每条边：沿边从start到end排，尽量排满并居中；front边中间留opening。
    const runs: Record<Side, { from: Planar; along: Planar; inward: Planar; start: number; end: number }> = {
      back: { from: at(0, -depth / 2), along: right, inward: forward, start: -width / 2, end: width / 2 },
      front: { from: at(0, depth / 2), along: right, inward: { x: -forward.x, z: -forward.z }, start: -width / 2 + deepest("left"), end: width / 2 - deepest("right") },
      left: { from: at(-width / 2, 0), along: forward, inward: right, start: -depth / 2 + deepest("back"), end: depth / 2 - deepest("front") },
      right: { from: at(width / 2, 0), along: forward, inward: { x: -right.x, z: -right.z }, start: -depth / 2 + deepest("back"), end: depth / 2 - deepest("front") },
    };
    let frontGap = 0;
    for (const side of sides) {
      const list = listFor(side);
      if (!list.length) continue;
      // bySide逐件列出时默认每件摆一次；只给assetIds或fill=true时按轮换排满。
      const fill = args.fill ?? !sidePools[side].length;
      const run = runs[side];
      const segments = side === "front" && args.opening > 0 ? [[run.start, -args.opening / 2], [args.opening / 2, run.end]] : [[run.start, run.end]];
      for (const [segmentIndex, [start, end]] of segments.entries()) {
        // 门洞把前墙分成两段时，逐件列出的陈设左右轮流分，不在两段各摆一遍。
        const own = fill || segments.length === 1 ? list : list.filter((_, index) => index % segments.length === segmentIndex);
        const chosen: ReturnType<typeof resolve>[] = [];
        let used = 0;
        for (let index = 0; index < (fill ? 200 : own.length); index++) {
          const item = fill ? list[(cursor + index) % list.length]! : own[index]!;
          if (used + item.footprint.width + (chosen.length ? args.gap : 0) > end! - start! + 1e-6) break;
          used += item.footprint.width + (chosen.length ? args.gap : 0);
          chosen.push(item);
        }
        if (fill) cursor += chosen.length;
        if (side === "front" && !fill && chosen.length && segments.length === 1) frontGap = used;
        let u = start! + (end! - start! - used) / 2;
        for (const item of chosen) {
          const along = u + item.footprint.width / 2;
          const point = { x: run.from.x + run.along.x * along + run.inward.x * item.footprint.depth / 2, z: run.from.z + run.along.z * along + run.inward.z * item.footprint.depth / 2 };
          put(item, point, facingAt(point, run.inward));
          u += item.footprint.width + args.gap;
        }
      }
    }
    // 围墙：沿边界外侧（墙厚一半）砌直墙，每面一段、转角方正；front在门楼/开口处断开。
    if (args.enclose) {
      const half = args.enclose.thickness / 2, gapHalf = Math.max(args.opening, frontGap + 0.2) / 2;
      const wallSides = args.enclose.sides ?? sides;
      const lines: [number, number, number, number][] = [];
      const W = width / 2 + half, D = depth / 2 + half;
      if (wallSides.includes("back")) lines.push([-W - half, -D, W + half, -D]);
      if (wallSides.includes("left")) lines.push([-W, -D, -W, D]);
      if (wallSides.includes("right")) lines.push([W, -D, W, D]);
      if (wallSides.includes("front")) {
        if (gapHalf > 0.05) lines.push([-W - half, D, -gapHalf, D], [gapHalf, D, W + half, D]);
        else lines.push([-W - half, D, W + half, D]);
      }
      for (const [u0, v0, u1, v1] of lines) {
        if (Math.hypot(u1 - u0, v1 - v0) < 0.3) continue;
        const result = createSceneBrushPath(document, { mode: "wall", style: args.enclose.style, points: [at(u0, v0), at(u1, v1)], width: args.enclose.thickness, height: args.enclose.height }, signal);
        result.object.name = args.name ? args.name + "墙" : "围墙";
        objects.push(result.object);
      }
    }
  } else if (args.pattern === "ring") {
    const widest = Math.max(...pool.map(item => item.footprint.width)), deepest = Math.max(...pool.map(item => item.footprint.depth));
    const span = Math.min(360, args.span) * Math.PI / 180, full = args.span >= 359.9;
    const step = args.ringStep ?? deepest + 0.6, spacing = args.spacing ?? widest + args.gap;
    for (let ring = 0; ring < args.rings; ring++) {
      if (signal?.aborted) signal.throwIfAborted();
      const radius = args.radius! + ring * step;
      const count = args.count ?? Math.max(1, Math.floor(radius * span / spacing) + Number(!full));
      for (let index = 0; index < count; index++) {
        // 整圈均分；扇形两端各放一件，弧的中间朝angle；外排错开半格。
        const theta = full ? angle + (index + (ring % 2) * 0.5) / count * Math.PI * 2 : angle - span / 2 + (count === 1 ? span / 2 : index / (count - 1) * span);
        const point = { x: center.x + Math.sin(theta) * radius, z: center.z + Math.cos(theta) * radius };
        const inward = { x: center.x - point.x, z: center.z - point.z };
        put(next(), point, args.facing === "along" ? { x: Math.cos(theta), z: -Math.sin(theta) } : facingAt(point, inward));
      }
    }
  } else if (args.pattern === "grid") {
    const widest = Math.max(...pool.map(item => item.footprint.width)), deepest = Math.max(...pool.map(item => item.footprint.depth));
    const spacingX = args.spacing ?? widest + args.gap, spacingZ = args.spacing ?? deepest + args.gap;
    const columns = args.columns ?? (args.width ? Math.max(1, Math.floor((args.width + args.gap) / spacingX)) : 4);
    const rows = args.rows ?? (args.depth ? Math.max(1, Math.floor((args.depth + args.gap) / spacingZ)) : 3);
    const limit = args.count ?? rows * columns;
    for (let row = 0; row < rows && objects.length + placer.skipped < limit; row++) for (let column = 0; column < columns && objects.length + placer.skipped < limit; column++) {
      const aisleShift = args.aisle > 0 ? (column < columns / 2 ? -args.aisle / 2 : args.aisle / 2) : 0;
      const point = at((column - (columns - 1) / 2) * spacingX + aisleShift, ((rows - 1) / 2 - row) * spacingZ);
      put(next(), point, args.facing ? facingAt(point, forward) : forward);
    }
  } else if (args.pattern === "line") {
    const path = args.path!;
    const segments = path.slice(1).map((end, index) => {
      const start = path[index]!, length = Math.hypot(end.x - start.x, end.z - start.z);
      return { start, length, dx: (end.x - start.x) / length, dz: (end.z - start.z) / length };
    }).filter(segment => segment.length > 1e-6);
    const total = segments.reduce((sum, segment) => sum + segment.length, 0);
    const widest = Math.max(...pool.map(item => item.footprint.width));
    const spacing = args.spacing ?? widest + args.gap;
    const count = Math.min(args.count ?? Infinity, Math.floor(total / spacing) + 1);
    for (let index = 0; index < count; index++) {
      let rest = Math.min(total, index * spacing + (total - (count - 1) * spacing) / 2);
      const segment = segments.find((item, cursorIndex) => { if (rest <= item.length || cursorIndex === segments.length - 1) return true; rest -= item.length; return false; })!;
      // 行进方向的右手侧（俯视、+Y向上）是(-dz, dx)。bothSides时左右各摆一件、都朝折线。
      const side = { x: -segment.dz, z: segment.dx };
      for (const offset of args.bothSides && Math.abs(args.offset) > 1e-6 ? [args.offset, -args.offset] : [args.offset]) {
        const point = { x: segment.start.x + segment.dx * rest + side.x * offset, z: segment.start.z + segment.dz * rest + side.z * offset };
        const toPath = Math.abs(offset) > 1e-6 ? { x: -side.x * Math.sign(offset), z: -side.z * Math.sign(offset) } : { x: segment.dx, z: segment.dz };
        put(next(), point, args.facing === "along" ? { x: segment.dx, z: segment.dz } : facingAt(point, toPath));
      }
    }
  } else {
    // around：沿目标占地矩形外圈均匀摆，每件朝向它所在的那条边（椅子正对桌边），篝火这类圆物同样适用。
    for (const id of args.targetIds!) {
      if (signal?.aborted) signal.throwIfAborted();
      const target = document.objects.find(object => object.id === id);
      if (!target) throw new Error(`被围的物体不存在：${id}`);
      const base = measureAssetFootprint(target.asset) ?? { width: 1, depth: 1, height: 1, front: { x: 0, z: -1 } };
      const theta = target.rotation.y * Math.PI / 180;
      const tx = { x: Math.cos(theta), z: -Math.sin(theta) }, tz = { x: Math.sin(theta), z: Math.cos(theta) };
      const item0 = pool[0]!;
      if (args.aroundSides) {
        // 目标自己的正面F（世界方向）与右手R；沿各边离边缘item进深一半+gap，perSide件居中排开，全部朝向目标。
        const F = { x: tx.x * base.front.x + tz.x * base.front.z, z: tx.z * base.front.x + tz.z * base.front.z }, R = { x: -F.z, z: F.x };
        const halfW = base.width * target.scale.x / 2, halfD = base.depth * target.scale.z / 2;
        const extF = Math.abs(base.front.x) * halfW + Math.abs(base.front.z) * halfD, extR = Math.abs(base.front.x) * halfD + Math.abs(base.front.z) * halfW;
        for (const side of args.aroundSides) {
          const normal = side === "front" ? F : side === "back" ? { x: -F.x, z: -F.z } : side === "right" ? R : { x: -R.x, z: -R.z };
          const lateral = side === "front" || side === "back" ? R : F;
          const extent = side === "front" || side === "back" ? extF : extR;
          for (let index = 0; index < args.perSide; index++) {
            const item = next();
            const distance = extent + item.footprint.depth / 2 + args.gap;
            const offset = (index - (args.perSide - 1) / 2) * (item.footprint.width + args.gap);
            const point = { x: target.position.x + normal.x * distance + lateral.x * offset, z: target.position.z + normal.z * distance + lateral.z * offset };
            put(item, point, facingAt(point, { x: -normal.x, z: -normal.z }));
          }
        }
        continue;
      }
      const hw = base.width * target.scale.x / 2 + item0.footprint.depth / 2 + args.gap, hd = base.depth * target.scale.z / 2 + item0.footprint.depth / 2 + args.gap;
      // 少量时先占长边中点，再占短边；多了沿外圈周长均分。
      const longX = hw >= hd;
      const clearX = Math.max(hw, item0.footprint.width / 2 + item0.footprint.depth / 2 + 0.08), clearZ = Math.max(hd, item0.footprint.width / 2 + item0.footprint.depth / 2 + 0.08);
      const preset: [number, number][] = longX ? [[0, hd], [0, -hd], [clearX, 0], [-clearX, 0]] : [[hw, 0], [-hw, 0], [0, clearZ], [0, -clearZ]];
      const spots: [number, number][] = [];
      if (args.perTarget <= 4) spots.push(...preset.slice(0, args.perTarget));
      else {
        const perimeter = 4 * (hw + hd);
        for (let index = 0; index < args.perTarget; index++) {
          let s = (index + 0.5) / args.perTarget * perimeter;
          if (s < 2 * hw) { spots.push([-hw + s, hd]); continue; } s -= 2 * hw;
          if (s < 2 * hd) { spots.push([hw, hd - s]); continue; } s -= 2 * hd;
          if (s < 2 * hw) { spots.push([hw - s, -hd]); continue; } s -= 2 * hw;
          spots.push([-hw, -hd + s]);
        }
      }
      for (const [u, v] of spots) {
        const point = { x: target.position.x + tx.x * u + tz.x * v, z: target.position.z + tx.z * u + tz.z * v };
        // 朝向所在边的内法线；正好在角上时朝中心。
        const nu = v === 0 && u !== 0 || Math.abs(Math.abs(u) - hw) < 1e-6 ? -Math.sign(u) : 0, nv = u === 0 && v !== 0 || Math.abs(Math.abs(v) - hd) < 1e-6 ? -Math.sign(v) : 0;
        const inward = nu || nv ? { x: tx.x * nu + tz.x * nv, z: tx.z * nu + tz.z * nv } : { x: target.position.x - point.x, z: target.position.z - point.z };
        put(next(), point, facingAt(point, inward));
      }
    }
  }
  signal?.throwIfAborted();
  return { objects, summary: { pattern: args.pattern, placed: objects.length, skipped: placer.skipped, ...(placer.skipped ? { note: "skipped是压到已有物体或超出世界边界而没摆的件数，可缩小尺寸、换位置或avoid=false" } : {}) } };
}

const groupColors = ["#7b4f9e", "#3f7d52", "#b48a2f", "#8a9097", "#a9443b", "#4d7f8e", "#6d5a4b", "#5b6aa6", "#9b6b4a", "#4f6b3a"];
export const placeCrowdSchema = z.strictObject({
  center: groundPoint.optional().describe("人群区域中心（圆形用radius，矩形用width/depth/angle）"),
  radius: z.number().finite().min(0.5).max(200).optional(),
  width: z.number().finite().min(0.5).max(300).optional(),
  depth: z.number().finite().min(0.5).max(300).optional(),
  angle: z.number().finite().min(-360).max(360).default(0),
  path: z.array(groundPoint).min(2).max(32).optional().describe("沿路的人流：折线中心线，配合width为带宽"),
  count: z.number().int().min(1).max(150).optional().describe("人数；seated不用填，按座位数和fill算"),
  groupSize: z.number().int().min(1).max(8).default(3).describe("几人一组；1为各走各的"),
  mode: z.enum(["chat", "audience", "wander", "queue", "seated"]).default("chat").describe("chat三五成群面对面交谈；audience全体面向target围观/听讲/列队；wander各自随意朝向；queue沿path排队，队头在path第一个点（柜台、城门、检票口），人人面朝队头；seated坐进seatIds给的椅子、长凳、长椅（课堂、礼堂、法庭旁听、候车、餐厅）"),
  seatIds: z.array(z.string().min(1).max(160)).min(1).max(300).optional().describe("seated：要坐人的椅子、凳子、长椅的物体id（arrangeAssets返回的objects）；长凳按宽度每0.62米坐一人"),
  seatPoints: z.array(groundPoint).min(1).max(300).optional().describe("seated：整块布景里自带的长凳、看台没有物体id时，直接给每个座位的地面坐标，人面朝target"),
  fill: z.number().finite().min(0.05).max(1).default(1).describe("seated：上座率，0.6表示约六成座位有人"),
  children: z.number().finite().min(0).max(0.6).optional().describe("孩子的比例（0到0.6）：这部分人按孩子身高（约0.62倍）放，家眷、集市、公园、学校门口用"),
  floor: z.number().finite().min(-50).max(300).optional().describe("人站或坐的地面高度（米）：站台、舞台、看台、二楼等高出地形的平台上放人时给平台面的Y"),
  posture: z.enum(["chair", "kneel"]).default("chair").describe("seated、sit时的坐法：chair坐椅子长凳；kneel跪坐/席地坐（书院学堂、和室、灵堂跪拜、寺庙蒲团、席地宴饮），人直接坐在地面或floor上"),
  sit: z.boolean().default(false).describe("audience/chat等模式里的人按坐姿下沉（整块布景里自带长凳、没有座位id时用，如法庭旁听席、戏园看台）"),
  target: groundPoint.optional().describe("audience面向的点（戏台、讲台、王座、事故现场）"),
  assetIds: z.array(assetId).min(1).max(4).default(["person"]).describe("默认胶囊人person；主角或要做动作的人另用riggedPerson单独摆"),
  colors: z.boolean().default(true).describe("每组一种衣色，便于区分群组"),
  avoid: z.boolean().default(true),
  seed: z.number().int().min(-2147483648).max(2147483647).default(1),
  name: z.string().trim().min(1).max(40).default("群演"),
}).superRefine((value, context) => {
  if (value.mode === "seated") {
    if (!value.seatIds?.length && !value.seatPoints?.length) context.addIssue({ code: "custom", path: ["seatIds"], message: "seated需要seatIds（椅子、长凳的物体id）或seatPoints（座位坐标）" });
    if (value.seatPoints?.length && !value.target) context.addIssue({ code: "custom", path: ["target"], message: "seatPoints需要target：坐着的人面向哪里" });
    return;
  }
  if (!value.count) context.addIssue({ code: "custom", path: ["count"], message: "请给count人数" });
  if (!value.path && !value.center) context.addIssue({ code: "custom", path: ["center"], message: "请提供center（圆形或矩形区域）或path（沿路）" });
  if (value.center && !value.path && !value.radius && !(value.width && value.depth)) context.addIssue({ code: "custom", path: ["radius"], message: "圆形区域给radius，矩形区域给width和depth" });
  if (value.path && !value.width && value.mode !== "queue") context.addIssue({ code: "custom", path: ["width"], message: "沿路人流需要width带宽" });
  if (value.mode === "queue" && !value.path) context.addIssue({ code: "custom", path: ["path"], message: "queue需要path，第一个点是队头" });
  if (value.mode === "audience" && !value.target) context.addIssue({ code: "custom", path: ["target"], message: "audience需要target面向点" });
});

/** 成群的人：取样函数给出区域里的随机点，按组摆、组内面对面或全体面向目标，避开已有物体和彼此。 */
export function scatterCrowd(input: { sample: () => Planar; count: number; groupSize: number; mode: "chat" | "audience" | "wander"; target?: Planar; people: SceneAsset[]; colors: boolean; avoid: boolean; random: () => number; name: string; placer: ReturnType<typeof createPlacer> }) {
  const footprint = measureAssetFootprint(input.people[0]!)!;
  let placed = 0, group = 0, attempts = 0;
  while (placed < input.count && attempts < input.count * 40) {
    attempts++;
    const center = input.sample();
    const size = Math.min(input.groupSize, input.count - placed);
    const radius = size === 1 ? 0 : 0.5 + size * 0.13;
    const color = input.colors ? groupColors[group % groupColors.length] : undefined;
    let members = 0;
    for (let member = 0; member < size; member++) {
      const theta = member / size * Math.PI * 2 + input.random() * 0.6;
      // audience：小组横排面向目标；chat：围成小圈面对面。
      const point = input.mode === "audience" && input.target
        ? (() => { const toward = { x: input.target.x - center.x, z: input.target.z - center.z }, length = Math.hypot(toward.x, toward.z) || 1; const side = { x: toward.z / length, z: -toward.x / length }; const offset = (member - (size - 1) / 2) * 0.7; return { x: center.x + side.x * offset, z: center.z + side.z * offset }; })()
        : { x: center.x + Math.sin(theta) * radius, z: center.z + Math.cos(theta) * radius };
      const dir = input.mode === "audience" && input.target ? { x: input.target.x - point.x, z: input.target.z - point.z } : input.mode === "chat" && size > 1 ? { x: center.x - point.x, z: center.z - point.z } : { x: input.random() - 0.5, z: input.random() - 0.5 };
      const asset = input.people[(placed + group) % input.people.length]!;
      const person = input.placer.place(asset, { ...footprint, width: 0.7, depth: 0.7 }, point.x, point.z, faceRotation(footprint, dir), `${input.name}${placed + 1}`, { avoid: input.avoid, color });
      if (person) { placed++; members++; }
    }
    if (members) group++;
  }
  return { placed, groups: group };
}

/**
 * 坐姿：站着的胶囊人换成“坐着的胶囊人”（大腿平伸、小腿垂地，头顶约1.3米），放在地面上；没有这个素材时整体下沉到头顶约1.3米。
 * 都关掉重力，不然会落到椅面上又站起来。骨骼人物不动（它们可以用坐姿动作）。
 */
function sitDown(document: SceneDocument, person: SceneObject, seated?: SceneAsset, floor?: number) {
  if (person.asset.shape === "riggedPerson") return;
  if (seated && person.asset.shape === "person") person.asset = seated;
  // 跪坐的人直接坐在地面（蒲团、席子、矮凳）上。
  if (person.asset.shape === "kneelingPerson") { const ground = Math.round((floor ?? getTerrainHeight(document.terrain, person.position.x, person.position.z)) * 1000) / 1000; person.position = { ...person.position, y: ground }; person.height = ground; person.gravityEnabled = false; return; }
  const height = person.asset.shape === "seatedPerson" ? 1.3 : (measureAssetFootprint(person.asset)?.height ?? 1.75) * person.scale.y;
  const base = Math.round(((floor ?? getTerrainHeight(document.terrain, person.position.x, person.position.z)) + 1.3 - height) * 1000) / 1000;
  person.position = { ...person.position, y: base };
  person.height = base;
  person.gravityEnabled = false;
}

/** 放到平台面上（站台、舞台）：位置和底面高度都设成floor，开着重力也会停在平台上。 */
function raise(objects: SceneObject[], floor: number) { for (const object of objects) { object.position = { ...object.position, y: floor }; object.height = floor; } }

export function placeSceneCrowd(document: SceneDocument, assetMap: Map<string, SceneAsset>, raw: unknown, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const args = placeCrowdSchema.parse(raw);
  const people = args.assetIds.map(id => {
    const asset = assetMap.get(id);
    if (!asset) throw new Error(`素材未登记：${id}，请先用listAssets检索真实assetId`);
    if (!measureAssetFootprint(asset)) throw new Error(`“${asset.name}”无法测量占地，人群请用person胶囊人或内置人物/动物`);
    return asset;
  });
  const random = seededRandom(args.seed);
  const objects: SceneObject[] = [];
  const placer = createPlacer(document, createOccupancy(document), objects);
  const seatedAsset = assetMap.get(args.posture === "kneel" ? "kneelingPerson" : "seatedPerson");
  const angle = args.angle * Math.PI / 180;
  let sample: () => Planar;
  if (args.path) {
    const segments = args.path.slice(1).map((end, index) => { const start = args.path![index]!, length = Math.hypot(end.x - start.x, end.z - start.z); return { start, length, dx: (end.x - start.x) / length, dz: (end.z - start.z) / length }; }).filter(segment => segment.length > 1e-6);
    const total = segments.reduce((sum, segment) => sum + segment.length, 0);
    sample = () => {
      let rest = random() * total;
      const segment = segments.find((item, index) => { if (rest <= item.length || index === segments.length - 1) return true; rest -= item.length; return false; })!;
      const lateral = (random() - 0.5) * args.width!;
      return { x: segment.start.x + segment.dx * rest - segment.dz * lateral, z: segment.start.z + segment.dz * rest + segment.dx * lateral };
    };
  } else if (args.radius) {
    sample = () => { const theta = random() * Math.PI * 2, distance = Math.sqrt(random()) * args.radius!; return { x: args.center!.x + Math.sin(theta) * distance, z: args.center!.z + Math.cos(theta) * distance }; };
  } else {
    sample = () => { const u = (random() - 0.5) * args.width!, v = (random() - 0.5) * args.depth!; return { x: args.center!.x + Math.cos(angle) * u + Math.sin(angle) * v, z: args.center!.z - Math.sin(angle) * u + Math.cos(angle) * v }; };
  }
  if (args.mode === "seated") {
    // 坐席：换成坐着的胶囊人放在座位中心、面朝座位正面；长凳、长椅按横向宽度每0.62米坐一人。不占用避让，可以再用updateObject微调。
    const footprint = measureAssetFootprint(people[0]!)!;
    let placed = 0, seats = 0, group = 0;
    for (const point of args.seatPoints ?? []) {
      seats++;
      if (random() > args.fill) continue;
      const person = createSceneObject(people[placed % people.length]!, { x: point.x, y: 0, z: point.z });
      person.rotation = { x: 0, y: faceRotation(footprint, { x: args.target!.x - point.x, z: args.target!.z - point.z }), z: 0 };
      sitDown(document, person, seatedAsset, args.floor);
      person.name = `${args.name}${placed + 1}`;
      if (args.colors) person.color = groupColors[Math.floor(seats / 4) % groupColors.length];
      objects.push(person);
      placed++;
    }
    for (const id of args.seatIds ?? []) {
      const seat = document.objects.find(object => object.id === id);
      const seatPrint = seat && measureAssetFootprint(seat.asset);
      if (!seat || !seatPrint) continue;
      seats++;
      const angle = seat.rotation.y * Math.PI / 180;
      const front = { x: seatPrint.front.x * Math.cos(angle) + seatPrint.front.z * Math.sin(angle), z: -seatPrint.front.x * Math.sin(angle) + seatPrint.front.z * Math.cos(angle) };
      const side = { x: front.z, z: -front.x };
      const lateral = Math.abs(seatPrint.front.x) > Math.abs(seatPrint.front.z) ? seatPrint.depth * seat.scale.z : seatPrint.width * seat.scale.x;
      const count = Math.max(1, Math.floor(lateral / 0.62));
      const color = args.colors ? groupColors[group++ % groupColors.length] : undefined;
      for (let index = 0; index < count; index++) {
        if (random() > args.fill) continue;
        const offset = (index - (count - 1) / 2) * lateral / count;
        const x = seat.position.x + side.x * offset, z = seat.position.z + side.z * offset;
        const person = createSceneObject(people[placed % people.length]!, { x, y: 0, z });
        person.rotation = { x: 0, y: faceRotation(footprint, front), z: 0 };
        sitDown(document, person, seatedAsset, args.floor);
        person.name = `${args.name}${placed + 1}`;
        if (color) person.color = color;
        objects.push(person);
        placed++;
      }
    }
    signal?.throwIfAborted();
    if (!seats) throw new Error("seatIds里没有能坐的物体：请给场景里椅子、长凳的真实id");
    const missing = (args.seatIds?.length ?? 0) + (args.seatPoints?.length ?? 0) - seats;
    return { objects, summary: { placed, seats, ...(missing > 0 ? { note: `${missing}个id不是场景里能测量的座位，已跳过` } : {}) } };
  }
  const count = args.count ?? 1;
  if (args.mode === "queue") {
    // 排队：从队头沿path每0.85米一人，面朝前一个人（队头方向）。
    const footprint = measureAssetFootprint(people[0]!)!;
    const points = args.path!;
    let placed = 0, distance = 0;
    for (let index = 1; index < points.length && placed < count; index++) {
      const start = points[index - 1]!, end = points[index]!, length = Math.hypot(end.x - start.x, end.z - start.z);
      if (length < 1e-6) continue;
      const dx = (end.x - start.x) / length, dz = (end.z - start.z) / length;
      for (; distance <= length && placed < count; distance += 0.85) {
        const person = placer.place(people[placed % people.length]!, { ...footprint, width: 0.6, depth: 0.6 }, start.x + dx * distance, start.z + dz * distance, faceRotation(footprint, { x: -dx, z: -dz }), `${args.name}${placed + 1}`, { avoid: args.avoid, color: args.colors ? groupColors[0] : undefined });
        if (person) placed++;
      }
      distance -= length;
    }
    signal?.throwIfAborted();
    if (args.floor !== undefined) raise(objects, args.floor);
    return { objects, summary: { placed, groups: 1, requested: count, ...(placed < count ? { note: "队伍路径不够长或被挡住，只排下这些人；加长path" } : {}) } };
  }
  const result = scatterCrowd({ sample, count, groupSize: args.groupSize, mode: args.mode, target: args.target, people, colors: args.colors, avoid: args.avoid, random, name: args.name, placer });
  // 站着的胶囊人群演高矮略有差别（0.92到1.04倍，按种子固定），人群不像一排一模一样的桩子；只改高度不改占地，避让结果不变。
  if (!args.sit) for (const person of objects) if (person.asset.shape === "person") person.scale = { ...person.scale, y: Math.round((0.92 + random() * 0.12) * 100) / 100 };
  // 孩子：按比例挑几个人缩成孩子身高（0.58到0.66倍，胖瘦也小一号）；名字后加“（孩子）”。
  if (args.children && !args.sit) { const people = objects.filter(person => person.asset.shape === "person"); for (const person of people.slice(0, Math.round(people.length * args.children))) { const scale = Math.round((0.58 + random() * 0.08) * 100) / 100; person.scale = { x: 0.8, y: scale, z: 0.8 }; person.name = `${person.name}（孩子）`.slice(0, 160); } }
  if (args.sit) for (const person of objects) sitDown(document, person, seatedAsset, args.floor);
  else if (args.floor !== undefined) raise(objects, args.floor);
  signal?.throwIfAborted();
  return { objects, summary: { placed: result.placed, groups: result.groups, requested: count, ...(result.placed < count ? { note: "区域太挤或压到已有物体，只放下这些人；可扩大区域或减少人数" } : {}) } };
}

/**
 * ACT: 替换素材（界面“替换”和Agent replaceAsset共用）：ids里的物体换成asset，保留ID、位置、缩放、动线和集合关系；
 * 朝向按两件素材各自识别的正面校正，换完仍朝同一方向；名字里带旧素材名的换成新素材名。
 */
export function replaceObjectsAsset(objects: SceneObject[], ids: ReadonlySet<string>, asset: SceneAsset): SceneObject[] {
  const newFront = measureAssetFootprint(asset)?.front;
  const angle = (front?: Planar) => front ? Math.atan2(front.x, front.z) * 180 / Math.PI : 0;
  return objects.map(object => {
    if (!ids.has(object.id)) return object;
    const oldFront = measureAssetFootprint(object.asset)?.front;
    const turn = oldFront && newFront ? angle(oldFront) - angle(newFront) : 0;
    const name = object.asset.name && object.name.includes(object.asset.name) ? object.name.replace(object.asset.name, asset.name).slice(0, 160) : object.name;
    return { ...object, asset, name, rotation: { ...object.rotation, y: Math.round(((object.rotation.y + turn + 540) % 360 - 180) * 100) / 100 } };
  });
}
