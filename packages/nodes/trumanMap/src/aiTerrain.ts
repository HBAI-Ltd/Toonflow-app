import { z } from "@toonflow/nodes-scaffold/runtime";
import type { SceneDocument, SceneTerrain } from "./sceneDocument";
import { createTerrain, getTerrainHeight, getTerrainWaterLevel, paintTerrain, reconcileTerrainWater, terrainWaterColor, type TerrainBrush } from "./terrainModel";
import { getTerrainSurfaceId, terrainSurfaceOptions } from "./terrainSurfaces";
import { flushTerrainPaint, getTerrainPaint, getTerrainPaintSample } from "./terrainPaint";

const shapeBrushes = [
  { id: "auto", name: "自动抬高" }, { id: "raise", name: "抬高" }, { id: "plateau", name: "高台" },
  { id: "lower", name: "降低" }, { id: "smooth", name: "平滑" }, { id: "level", name: "按起点整平" },
  { id: "flatten", name: "定高" }, { id: "ramp", name: "坡道" }, { id: "slope", name: "缓坡" },
  { id: "ridge", name: "山脊" }, { id: "terrace", name: "梯田" }, { id: "cliff", name: "悬崖" },
  { id: "noise", name: "起伏" }, { id: "hills", name: "丘陵" }, { id: "dunes", name: "沙丘" },
  { id: "gullies", name: "沟壑" }, { id: "canyon", name: "峡谷" }, { id: "basin", name: "盆地" },
  { id: "volcano", name: "火山" }, { id: "river", name: "河流" }, { id: "lake", name: "湖泊" },
] as const;
const brushNames: [TerrainBrush, ...TerrainBrush[]] = ["auto", ...shapeBrushes.slice(1).map(brush => brush.id), ...terrainSurfaceOptions.flatMap(surface => surface.brush ? [surface.brush] : []), "forest"];
const pointSchema = z.strictObject({ x: z.number().finite().min(-10000).max(10000), z: z.number().finite().min(-10000).max(10000) });
const strokeSchema = z.strictObject({
  brush: z.enum(brushNames),
  points: z.array(pointSchema).min(1).max(32),
  radius: z.number().finite().min(0.001).max(128),
  strength: z.number().finite().min(0.1).max(2).default(1),
  seconds: z.number().finite().min(0.1).max(10).default(1),
  hardness: z.number().finite().min(0).max(1).default(0.35),
  flow: z.number().finite().min(0).max(1).default(1),
  color: z.string().regex(/^#[\da-f]{6}$/i, "颜色必须是#rrggbb格式").optional(),
  targetHeight: z.number().finite().min(-12).max(40).optional(),
  waterLevel: z.number().finite().min(-11.8).max(39.8).optional(),
}).refine(stroke => stroke.brush !== "ramp" || stroke.points.length === 2, "坡道须提供且仅提供起点和终点");

export const readTerrainSchema = z.strictObject({ points: z.array(pointSchema).min(1).max(64).optional() });
export const editTerrainSchema = z.strictObject({ strokes: z.array(strokeSchema).min(1).max(8) });

type TerrainPoint = z.infer<typeof pointSchema>;

function validatePoints(terrain: SceneTerrain, points: TerrainPoint[]) {
  if (points.some(point => Math.abs(point.x) > terrain.size / 2 || Math.abs(point.z) > terrain.size / 2)) throw new Error(`地形坐标超出世界边界，X/Z须在 ${-terrain.size / 2}～${terrain.size / 2} 米内；请先读取空间范围`);
}

function sampleTerrain(terrain: SceneTerrain, point: TerrainPoint) {
  const column = Math.round((point.x / terrain.size + 0.5) * terrain.segments);
  const row = Math.round((point.z / terrain.size + 0.5) * terrain.segments);
  const index = row * (terrain.segments + 1) + column;
  const surface = terrain.surfaces[index]!;
  const blendWeight = terrain.surfaceBlend?.weights[index] ?? 0;
  const blendSurface = terrain.surfaceBlend?.surfaces[index] ?? surface;
  const paint = getTerrainPaintSample(terrain, point.x, point.z);
  const waterLevel = getTerrainWaterLevel(terrain, index);
  const weights = new Map<string, { surface: number; color: string; weight: number }>();
  const layers: [number, string, number][] = [
    [surface, terrain.surfaceColors?.[String(surface)] ?? terrainSurfaceOptions[surface]!.color, (1 - blendWeight) * (1 - (paint?.opacity ?? 0))],
    [blendSurface, terrain.surfaceColors?.[String(blendSurface)] ?? terrainSurfaceOptions[blendSurface]!.color, blendWeight * (1 - (paint?.opacity ?? 0))],
    [paint?.base ?? surface, paint?.baseColor ?? terrainSurfaceOptions[surface]!.color, (paint?.opacity ?? 0) * (1 - (paint?.mix ?? 0))],
    [paint?.top ?? surface, paint?.topColor ?? terrainSurfaceOptions[surface]!.color, (paint?.opacity ?? 0) * (paint?.mix ?? 0)],
  ];
  for (const [surface, color, weight] of layers) {
    if (weight <= 0) continue;
    const key = surface + ":" + color.toLowerCase();
    const previous = weights.get(key);
    weights.set(key, { surface, color, weight: weight + (previous?.weight ?? 0) });
  }
  const dominant = [...weights.values()].sort((a, b) => b.weight - a.weight)[0]!;
  return {
    ...point, height: getTerrainHeight(terrain, point.x, point.z), waterLevel, waterColor: waterLevel === null ? null : terrain.waterColors?.[index] ?? terrainWaterColor,
    surface: dominant.surface, surfaceName: terrainSurfaceOptions[dominant.surface]!.name, color: dominant.color,
    baseSurface: surface, baseSurfaceName: terrainSurfaceOptions[surface]!.name,
    ...(blendWeight > 0 ? { surfaceBlend: { surface: blendSurface, name: terrainSurfaceOptions[blendSurface]!.name, weight: blendWeight } } : {}),
    surfacePaint: paint ? { ...paint, baseName: terrainSurfaceOptions[paint.base]!.name, topName: terrainSurfaceOptions[paint.top]!.name } : null,
  };
}

export function readTerrain(document: SceneDocument, args: unknown) {
  const { points = [] } = readTerrainSchema.parse(args);
  const terrain = document.terrain ?? createTerrain();
  validatePoints(terrain, points);
  return {
    exists: !!document.terrain, size: terrain.size, segments: terrain.segments, gridSpacing: terrain.size / terrain.segments,
    surfacePaint: terrain.surfacePaint ? { segments: terrain.surfacePaint.segments, pixelSpacing: terrain.size / terrain.surfacePaint.segments } : null,
    surfaceColors: { ...terrain.surfaceColors },
    defaultWaterColor: terrainWaterColor,
    bounds: { minX: -terrain.size / 2, maxX: terrain.size / 2, minZ: -terrain.size / 2, maxZ: terrain.size / 2, minHeight: -12, maxHeight: 40 },
    radius: { min: terrain.size / terrain.segments, max: Math.min(128, terrain.size / 2) },
    brushes: [
      ...shapeBrushes.map(brush => ({ ...brush, kind: brush.id === "lake" || brush.id === "river" ? "water" : "shape" })),
      ...terrainSurfaceOptions.flatMap(surface => surface.brush ? [{ id: surface.brush, name: surface.name, color: terrain.surfaceColors?.[String(surface.id)] ?? surface.color, kind: "surface" }] : []),
      { id: "forest", name: "森林地貌（树木按地形索引独立删除）", kind: "surface" },
    ],
    limits: { strokes: 8, pointsPerStroke: 32, paintSamples: 1024, scannedCells: 6000000, seconds: [0.1, 10], rampPoints: 2 },
    edgeBehavior: "笔刷范围在世界边缘裁切，不自动扩大世界；物件批量种植请使用独立资产放置工具",
    samples: points.map(point => sampleTerrain(terrain, point)),
  };
}

export async function editSceneTerrain(document: SceneDocument, args: unknown, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const { strokes } = editTerrainSchema.parse(args);
  const source = document.terrain ?? createTerrain();
  const gridSpacing = source.size / source.segments;
  const gridCount = source.heights.length;
  const paintSegments = source.surfacePaint?.segments ?? Math.min(1024, Math.max(256, 2 ** Math.ceil(Math.log2(source.size / 0.25))));
  const paintPixelCount = (paintSegments + 1) ** 2;
  let paintSamples = 0;
  let scannedCells = gridCount * 6;
  let hasWater = !!source.waterLevels || source.surfaces.includes(2);
  let paintDataBudgeted = false;
  let paintPixelScans = 0;
  const plans = strokes.map(stroke => {
    validatePoints(source, stroke.points);
    if (stroke.radius < gridSpacing || stroke.radius > Math.min(128, source.size / 2)) throw new Error(`笔刷半径须为 ${gridSpacing}～${Math.min(128, source.size / 2)} 米，不能小于当前网格间距`);
    const distances = [0];
    for (let index = 1; index < stroke.points.length; index++) distances.push(distances.at(-1)! + Math.hypot(stroke.points[index]!.x - stroke.points[index - 1]!.x, stroke.points[index]!.z - stroke.points[index - 1]!.z));
    const length = distances.at(-1)!;
    const spatialSamples = stroke.brush === "ramp" || length === 0 ? 1 : Math.ceil(length / Math.min(gridSpacing * 0.5, stroke.radius * 0.5)) + 1;
    const count = stroke.flow === 0 ? 0 : Math.max(spatialSamples, Math.ceil(stroke.seconds / 0.1));
    const surfaceBrush = getTerrainSurfaceId(stroke.brush) !== undefined;
    const activeSegments = surfaceBrush ? paintSegments : source.segments;
    const diameterCells = Math.min(activeSegments + 1, Math.ceil(stroke.radius * 2 / (source.size / activeSegments)) + 3);
    const area = diameterCells ** 2;
    const perSample = stroke.brush === "ramp" ? gridCount * 6 : stroke.brush === "smooth" ? gridCount + area * 9 : stroke.brush === "slope" ? gridCount + area : area;
    if (count && (stroke.brush === "lake" || stroke.brush === "river")) hasWater = true;
    paintSamples += count;
    if (surfaceBrush && count) {
      // ACT: 用四次全贴图等价扫描估算解码/分配、像素对比及一次gzip/base64交付，不在每个采样点编码。
      if (!paintDataBudgeted) { scannedCells += paintPixelCount * 4; paintDataBudgeted = true; }
      paintPixelScans += count * area;
    }
    // ACT: 连同快照、混层分配和可能的水位整理保守计费，避免小半径的长路径绕过整图扫描预算。
    scannedCells += count * perSample + (count ? gridCount * (hasWater ? 8 : 4) : 0);
    if (paintSamples > 1024 || scannedCells > 6000000) throw new Error("本次地形操作超出1024次采样或600万格处理预算，请缩短路径、缩小半径或分批执行");
    return { stroke, distances, length, count, surfaceBrush };
  });
  const sourcePaint = paintDataBudgeted ? getTerrainPaint(source) : undefined;
  const terrain = structuredClone(source);
  let processedSamples = 0;
  let paintTouched = false;
  for (const { stroke, distances, length, count, surfaceBrush } of plans) {
    if (!count) continue;
    const reference = structuredClone(terrain);
    const origin = stroke.points[0]!;
    const end = stroke.points.at(-1)!;
    const startHeight = getTerrainHeight(reference, origin.x, origin.z);
    const column = Math.round((origin.x / reference.size + 0.5) * reference.segments);
    const row = Math.round((origin.z / reference.size + 0.5) * reference.segments);
    const previousLevel = getTerrainWaterLevel(reference, row * (reference.segments + 1) + column);
    const water = { level: stroke.waterLevel ?? Math.min(39.8, Math.max(-11.8, previousLevel ?? startHeight - 0.04)), reference };
    const deltaSeconds = stroke.seconds / count;
    let segment = 1;
    for (let index = 0; index < count; index++) {
      signal?.throwIfAborted();
      let position = origin;
      if (length > 0 && stroke.brush !== "ramp") {
        const distance = length * index / Math.max(1, count - 1);
        while (segment < distances.length - 1 && distances[segment]! < distance) segment++;
        const a = stroke.points[segment - 1]!;
        const b = stroke.points[segment]!;
        const span = distances[segment]! - distances[segment - 1]!;
        const progress = span > 0 ? (distance - distances[segment - 1]!) / span : 0;
        position = { x: a.x + (b.x - a.x) * progress, z: a.z + (b.z - a.z) * progress };
      }
      const changed = paintTerrain(terrain, position, stroke.brush, stroke.radius, stroke.strength, deltaSeconds, {
        color: stroke.color, flow: stroke.flow, hardness: stroke.hardness, targetHeight: stroke.targetHeight, water,
        stroke: { origin, end, startHeight, reference, elapsed: deltaSeconds * (index + 1) },
      });
      paintTouched ||= surfaceBrush && changed;
      processedSamples++;
      if (processedSamples % 16 === 0) { await new Promise<void>(resolve => setTimeout(resolve, 0)); signal?.throwIfAborted(); }
    }
    reconcileTerrainWater(terrain);
    signal?.throwIfAborted();
  }
  let changedCells = 0;
  let minHeight = Infinity;
  let maxHeight = -Infinity;
  let changedPaintPixels = 0;
  for (let index = 0; index < gridCount; index++) {
    const height = terrain.heights[index]!;
    minHeight = Math.min(minHeight, height);
    maxHeight = Math.max(maxHeight, height);
    if (height !== source.heights[index] || terrain.surfaces[index] !== source.surfaces[index]
      || (terrain.waterLevels?.[index] ?? null) !== (source.waterLevels?.[index] ?? null)
      || (terrain.surfaceBlend?.surfaces[index] ?? terrain.surfaces[index]) !== (source.surfaceBlend?.surfaces[index] ?? source.surfaces[index])
      || (terrain.surfaceBlend?.weights[index] ?? 0) !== (source.surfaceBlend?.weights[index] ?? 0)
      || terrain.waterColors?.[index] !== source.waterColors?.[index]) changedCells++;
  }
  if (paintTouched) {
    const paint = getTerrainPaint(terrain)!;
    for (let offset = 0; offset < paint.data.length; offset += 4) {
      if (paint.data[offset] !== (sourcePaint?.data[offset] ?? 0) || paint.data[offset + 1] !== (sourcePaint?.data[offset + 1] ?? 0)
        || paint.data[offset + 2] !== (sourcePaint?.data[offset + 2] ?? 0) || paint.data[offset + 3] !== (sourcePaint?.data[offset + 3] ?? 0)) changedPaintPixels++;
    }
    signal?.throwIfAborted();
    flushTerrainPaint(terrain);
  }
  signal?.throwIfAborted();
  const changed = changedCells > 0 || changedPaintPixels > 0;
  return {
    terrain: changed ? terrain : document.terrain,
    summary: {
      changed, changedCells, changedPaintPixels, size: terrain.size, segments: terrain.segments, gridSpacing, minHeight, maxHeight,
      paintSamples: processedSamples, estimatedScannedCells: scannedCells, brushes: [...new Set(strokes.map(stroke => stroke.brush))],
      paintPixelScans, encodingPixels: paintTouched ? paintPixelCount : 0,
      samples: strokes.flatMap(stroke => stroke.points).slice(0, 64).map(point => sampleTerrain(terrain, point)),
    },
  };
}
