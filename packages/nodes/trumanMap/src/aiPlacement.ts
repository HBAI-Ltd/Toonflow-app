import { z } from "@toonflow/nodes-scaffold/runtime";
import { Box3 } from "three";
import { createSceneObject, type SceneAsset, type SceneDocument, type SceneObject } from "./sceneDocument";
import { createPathBrushObject, pavingBrushStyles, treeBrushAssets, wallBrushStyles } from "./sceneBrushAssets";
import { disposeObject } from "./sceneResources";
import { getTerrainHeight, worldSizeLimits } from "./terrainModel";

const coordinate = z.number().finite().min(-10000).max(10000);
const groundPoint = z.strictObject({ x: coordinate, z: coordinate });

export function getObjectBrushCapabilities() {
  return {
    trees: treeBrushAssets.map(asset => ({ id: asset.id, name: asset.name })),
    wall: { styles: wallBrushStyles.map(style => ({ id: style.id, name: style.name, defaultWidth: style.width ?? 0.25, defaultHeight: style.height ?? 1.8 })), width: { min: 0.08, max: 2 }, height: { min: 0.2, max: 8 } },
    paving: { styles: pavingBrushStyles.map(style => ({ id: style.id, name: style.name, defaultWidth: style.width ?? 3, defaultHeight: style.height ?? 0.08 })), width: { min: 0.4, max: 20 }, height: { min: 0.02, max: 0.5 } },
    path: { points: { min: 2, max: 64 }, localCoordinateLimit: 80, note: "路径按实际地形贴地，长路径需拆为局部段；铺装保留道路或步行导航。" },
  };
}

export const scatterAssetsSchema = z.strictObject({
  assetIds: z.array(z.string().min(1).max(160)).min(1).max(8).refine(ids => new Set(ids).size === ids.length, "素材ID不能重复"),
  points: z.array(groundPoint).min(1).max(32),
  radius: z.number().finite().min(0).max(128),
  spacing: z.number().finite().min(0.25).max(100).default(3),
  count: z.number().int().min(1).max(200),
  seed: z.number().int().min(-2147483648).max(2147483647).default(1),
  scaleMin: z.number().finite().min(0.1).max(10).default(1),
  scaleMax: z.number().finite().min(0.1).max(10).default(1),
  heightOffset: z.number().finite().min(-100).max(100).default(0),
  gravityEnabled: z.boolean().default(true),
}).superRefine((value, context) => {
  if (value.points.length === 1 && value.radius === 0) context.addIssue({ code: "custom", path: ["radius"], message: "单点区域的半径必须大于0" });
  if (value.scaleMin > value.scaleMax) context.addIssue({ code: "custom", path: ["scaleMin"], message: "最小缩放不能大于最大缩放" });
  value.points.forEach((point, index) => {
    if (index && Math.hypot(point.x - value.points[index - 1]!.x, point.z - value.points[index - 1]!.z) < 0.00001) context.addIssue({ code: "custom", path: ["points", index], message: "相邻路径点不能重合" });
  });
});

export async function scatterSceneAssets(document: SceneDocument, assetMap: Map<string, SceneAsset>, raw: unknown, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const args = scatterAssetsSchema.parse(raw);
  const assets = args.assetIds.map(id => {
    const asset = assetMap.get(id);
    if (!asset || asset.id !== id) throw new Error(`素材未登记：${id}，请先检索真实assetId`);
    return asset;
  });
  const halfSize = (document.terrain?.size ?? worldSizeLimits.default) / 2;
  if (args.points.some(point => Math.abs(point.x) > halfSize || Math.abs(point.z) > halfSize)) throw new Error(`散布路径须在世界边界内：X/Z各为-${halfSize}～${halfSize}米`);
  const segments = args.points.slice(1).map((end, index) => {
    const start = args.points[index]!;
    return { start, end, length: Math.hypot(end.x - start.x, end.z - start.z) };
  });
  const length = segments.reduce((sum, segment) => sum + segment.length, 0);
  let randomState = args.seed >>> 0;
  const random = () => {
    randomState = (randomState + 0x6d2b79f5) | 0;
    let value = Math.imul(randomState ^ randomState >>> 15, 1 | randomState);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  const roots = new Map<string, { x: number; z: number }[]>();
  const addRoot = (x: number, z: number) => {
    const key = `${Math.floor(x / args.spacing)},${Math.floor(z / args.spacing)}`;
    const bucket = roots.get(key) ?? [];
    if (!bucket.length) roots.set(key, bucket);
    bucket.push({ x, z });
  };
  for (const object of document.objects) {
    if (!object.visible) continue;
    const { x, z } = object.position;
    const offset = (object.height ?? object.position.y) - getTerrainHeight(document.terrain, x, z);
    if (Math.abs(offset - args.heightOffset) <= 0.5) addRoot(x, z);
  }
  const objects: SceneObject[] = [];
  let attempts = 0;
  while (objects.length < args.count && attempts < args.count * 40) {
    if (attempts % 16 === 0) {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      signal?.throwIfAborted();
    }
    attempts++;
    let x: number;
    let z: number;
    if (!segments.length) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * args.radius;
      x = args.points[0]!.x + Math.cos(angle) * distance;
      z = args.points[0]!.z + Math.sin(angle) * distance;
    } else {
      let travel = random() * length;
      const segment = segments.find((segment, index) => {
        if (travel <= segment.length || index === segments.length - 1) return true;
        travel -= segment.length;
        return false;
      })!;
      const fraction = travel / segment.length;
      const side = (random() * 2 - 1) * args.radius;
      const dx = segment.end.x - segment.start.x;
      const dz = segment.end.z - segment.start.z;
      x = segment.start.x + dx * fraction - dz / segment.length * side;
      z = segment.start.z + dz * fraction + dx / segment.length * side;
    }
    if (Math.abs(x) > halfSize || Math.abs(z) > halfSize) continue;
    const height = getTerrainHeight(document.terrain, x, z) + args.heightOffset;
    const column = Math.floor(x / args.spacing);
    const row = Math.floor(z / args.spacing);
    let blocked = false;
    // ACT: 根部网格只保证XZ间距；旧物件仅纳入离地偏移相差≤0.5米的根部，不冒充模型几何碰撞。
    for (let dx = -1; dx <= 1 && !blocked; dx++) for (let dz = -1; dz <= 1 && !blocked; dz++) blocked = roots.get(`${column + dx},${row + dz}`)?.some(root =>
      (root.x - x) ** 2 + (root.z - z) ** 2 < args.spacing ** 2) ?? false;
    if (blocked) continue;
    const object = createSceneObject(assets[objects.length % assets.length]!, { x, y: height, z });
    object.rotation.y = random() * 360;
    const scale = args.scaleMin + (args.scaleMax - args.scaleMin) * random();
    // 资产的米制/归一化由视口统一处理，这里和手工笔刷一样只写物件的附加缩放。
    object.scale = { x: scale, y: scale, z: scale };
    object.height = height;
    object.gravityEnabled = args.gravityEnabled;
    objects.push(object);
    addRoot(x, z);
  }
  signal?.throwIfAborted();
  if (!objects.length) throw new Error("区域内没有满足间距和世界边界的位置，请扩大范围、减小间距或更换位置");
  return { objects, summary: { requested: args.count, placed: objects.length, skipped: args.count - objects.length, attempts, spacing: args.spacing, seed: args.seed } };
}

export const createBrushPathSchema = z.strictObject({
  mode: z.enum(["wall", "paving"]),
  style: z.string().min(1).max(80),
  points: z.array(groundPoint).min(2).max(64),
  width: z.number().finite().min(0.08).max(20),
  height: z.number().finite().min(0.02).max(8),
}).superRefine((value, context) => {
  const styles = value.mode === "wall" ? wallBrushStyles : pavingBrushStyles;
  if (!styles.some(style => style.id === value.style)) context.addIssue({ code: "custom", path: ["style"], message: "请先查询真实墙体或铺装样式" });
  if (value.width < (value.mode === "wall" ? 0.08 : 0.4) || value.width > (value.mode === "wall" ? 2 : 20)) context.addIssue({ code: "custom", path: ["width"], message: "墙宽须0.08～2米，铺装宽须0.4～20米" });
  if (value.height < (value.mode === "wall" ? 0.2 : 0.02) || value.height > (value.mode === "wall" ? 8 : 0.5)) context.addIssue({ code: "custom", path: ["height"], message: "墙高须0.2～8米，铺装厚度须0.02～0.5米" });
  value.points.forEach((point, index) => {
    if (index && Math.hypot(point.x - value.points[index - 1]!.x, point.z - value.points[index - 1]!.z) < 0.00001) context.addIssue({ code: "custom", path: ["points", index], message: "相邻路径点不能重合" });
  });
});

export function createSceneBrushPath(document: SceneDocument, raw: unknown, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const args = createBrushPathSchema.parse(raw);
  const halfSize = (document.terrain?.size ?? worldSizeLimits.default) / 2;
  if (args.points.some(point => Math.abs(point.x) > halfSize || Math.abs(point.z) > halfSize)) throw new Error(`路径须在世界边界内：X/Z各为-${halfSize}～${halfSize}米`);
  const path = createPathBrushObject(args.mode, args.style, args.points, args.width, args.height, document.terrain, signal);
  if (!path) throw new Error("路径长度须至少0.15米");
  try {
    const bounds = new Box3().setFromObject(path.content);
    if (bounds.min.x < -halfSize || bounds.max.x > halfSize || bounds.min.z < -halfSize || bounds.max.z > halfSize) throw new Error("墙体或铺装的边缘超出世界范围，请缩短路径、减小宽度或调整位置");
    signal?.throwIfAborted();
    return { object: path.object, asset: path.object.asset, summary: { id: path.object.id, assetId: path.object.asset.id, name: path.object.name, mode: args.mode, style: args.style, width: args.width, height: args.height, points: args.points.length } };
  } finally { disposeObject(path.content); }
}
