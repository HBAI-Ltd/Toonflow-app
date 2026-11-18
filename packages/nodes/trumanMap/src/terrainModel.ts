import type { SceneTerrain } from "./sceneDocument";
import { paintTerrainSurface, resizeTerrainPaint } from "./terrainPaint";
import { getTerrainSurfaceId, type TerrainSurfaceBrush } from "./terrainSurfaces";

export type TerrainBrush = "auto" | "raise" | "plateau" | "lower" | "smooth" | "level" | "flatten" | "ramp" | "slope" | "ridge" | "terrace" | "cliff" | "noise" | "hills" | "dunes" | "gullies" | "canyon" | "basin" | "volcano" | "river" | "lake" | TerrainSurfaceBrush;
type TerrainBrushStroke = { origin: { x: number; z: number }; end: { x: number; z: number }; startHeight: number; reference: SceneTerrain; direction?: number; elapsed?: number };

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function smooth(value: number) { return value * value * (3 - 2 * value); }
function terrainNoise(x: number, z: number, seed: number) {
  const column = Math.floor(x), row = Math.floor(z);
  const hash = (a: number, b: number) => { const value = Math.sin(a * 127.1 + b * 311.7 + seed * 0.17) * 43758.5453; return value - Math.floor(value); };
  const u = smooth(x - column), v = smooth(z - row);
  return (hash(column, row) * (1 - u) + hash(column + 1, row) * u) * (1 - v) + (hash(column, row + 1) * (1 - u) + hash(column + 1, row + 1) * u) * v;
}
function terrainBrushFalloff(distance: number, hardness: number) {
  return hardness === 1 ? 1 : smooth(clamp((1 - distance) / (1 - hardness), 0, 1));
}
function updateTerrainWaterColors(terrain: SceneTerrain, updates: Map<number, string | null>) {
  let colors: Record<string, string> | undefined;
  for (const [index, color] of updates) {
    if (terrain.waterColors?.[index] === (color ?? undefined)) continue;
    colors ??= { ...terrain.waterColors };
    if (color === null) delete colors[index];
    else colors[index] = color;
  }
  if (!colors) return false;
  if (Object.keys(colors).length) terrain.waterColors = colors;
  else delete terrain.waterColors;
  return true;
}
function clearTerrainSurfaceBlend(terrain: SceneTerrain, index: number) {
  if (!terrain.surfaceBlend) return;
  terrain.surfaceBlend.surfaces[index] = terrain.surfaces[index]!;
  terrain.surfaceBlend.weights[index] = 0;
}
const terrainNeighbors = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
export const terrainWaterColor = "#60abbc";
export const worldSizeLimits = { min: 20, max: 1024, default: 80 };

export function createTerrain(): SceneTerrain {
  return { size: worldSizeLimits.default, segments: 64, heights: Array(4225).fill(0), surfaces: Array(4225).fill(38), seed: 41317 };
}

export function getTerrainTreePosition(terrain: SceneTerrain, index: number) {
  const random = (offset: number) => { const value = Math.sin((index + offset) * 127.1 + terrain.seed * 0.17) * 43758.5453; return value - Math.floor(value); };
  const column = index % (terrain.segments + 1);
  const row = Math.floor(index / (terrain.segments + 1));
  const x = (column / terrain.segments - 0.5) * terrain.size + (random(0) - 0.5) * terrain.size / terrain.segments * 0.5;
  const z = (row / terrain.segments - 0.5) * terrain.size + (random(13) - 0.5) * terrain.size / terrain.segments * 0.5;
  return { x, y: getTerrainHeight(terrain, x, z), z };
}

export function resizeTerrain(terrain: SceneTerrain | undefined, size: number): SceneTerrain {
  if (!Number.isFinite(size) || size < worldSizeLimits.min || size > worldSizeLimits.max) throw new RangeError(`世界边长须为 ${worldSizeLimits.min}–${worldSizeLimits.max} 米`);
  const source = terrain ?? createTerrain();
  if (source.size === size) return source;
  // ACT: 按原世界坐标重采样，最多256格；超出320米后格距逐渐增大，细于格距的旧地貌会损失细节。
  const segments = Math.min(256, Math.max(64, 2 ** Math.ceil(Math.log2(size / 1.25))));
  const count = (segments + 1) ** 2;
  const next: SceneTerrain = { size, segments, heights: Array(count).fill(0), surfaces: Array(count).fill(38), seed: source.seed };
  if (source.surfaceBlend) next.surfaceBlend = { surfaces: Array(count).fill(38), weights: Array(count).fill(0) };
  const waterLevels: (number | null)[] = Array(count).fill(null);
  let hasWater = false;
  for (let row = 0; row <= segments; row++) for (let column = 0; column <= segments; column++) {
    const x = (column / segments - 0.5) * size;
    const z = (row / segments - 0.5) * size;
    if (Math.abs(x) > source.size / 2 || Math.abs(z) > source.size / 2) continue;
    const index = row * (segments + 1) + column;
    const nearColumn = Math.round((x / source.size + 0.5) * source.segments);
    const nearRow = Math.round((z / source.size + 0.5) * source.segments);
    const nearIndex = nearRow * (source.segments + 1) + nearColumn;
    const height = getTerrainHeight(source, x, z);
    const level = getTerrainWaterLevel(source, nearIndex);
    next.heights[index] = height;
    next.surfaces[index] = source.surfaces[nearIndex]!;
    if (next.surfaceBlend && source.surfaceBlend) {
      next.surfaceBlend.surfaces[index] = source.surfaceBlend.surfaces[nearIndex]!;
      next.surfaceBlend.weights[index] = source.surfaceBlend.weights[nearIndex]!;
    }
    if (level !== null && level > height + 0.01) { waterLevels[index] = level; hasWater = true; }
    else if (next.surfaces[index] === 2) { next.surfaces[index] = 0; clearTerrainSurfaceBlend(next, index); }
  }
  if (hasWater || source.waterLevels) next.waterLevels = waterLevels;
  if (source.removedTrees?.length) {
    const removed = new Set<number>();
    for (const index of source.removedTrees) {
      const position = getTerrainTreePosition(source, index);
      if (Math.abs(position.x) > size / 2 || Math.abs(position.z) > size / 2) continue;
      const column = clamp(Math.round(((position.x / size + 0.5) * segments - 1) / 2) * 2 + 1, 1, segments - 1);
      const row = clamp(Math.round(((position.z / size + 0.5) * segments - 1) / 2) * 2 + 1, 1, segments - 1);
      removed.add(row * (segments + 1) + column);
    }
    next.removedTrees = [...removed].sort((a, b) => a - b);
  }
  if (source.surfaceColors) next.surfaceColors = { ...source.surfaceColors };
  resizeTerrainPaint(source, next);
  resizeTerrainWaterColors(source, next);
  reconcileTerrainWater(next);
  return next;
}

export function getTerrainHeight(terrain: SceneTerrain | undefined, x: number, z: number) {
  if (!terrain || !Number.isFinite(x) || !Number.isFinite(z) || x < -terrain.size / 2 || x > terrain.size / 2 || z < -terrain.size / 2 || z > terrain.size / 2) return 0;
  const gx = (x / terrain.size + 0.5) * terrain.segments;
  const gz = (z / terrain.size + 0.5) * terrain.segments;
  const column = Math.min(terrain.segments - 1, Math.floor(gx));
  const row = Math.min(terrain.segments - 1, Math.floor(gz));
  const u = gx - column;
  const v = gz - row;
  const a = row * (terrain.segments + 1) + column;
  const b = a + terrain.segments + 1;
  const d = a + 1;
  const c = b + 1;
  // ACT: 与渲染网格的 a/b/d、b/c/d 三角划分一致，避免双线性采样在山坡产生悬空或穿透。
  return u + v <= 1
    ? terrain.heights[a]! + (terrain.heights[d]! - terrain.heights[a]!) * u + (terrain.heights[b]! - terrain.heights[a]!) * v
    : terrain.heights[c]! + (terrain.heights[b]! - terrain.heights[c]!) * (1 - u) + (terrain.heights[d]! - terrain.heights[c]!) * (1 - v);
}

export function getTerrainWaterLevel(terrain: SceneTerrain, index: number): number | null {
  if (terrain.surfaces[index] !== 2) return null;
  const level = terrain.waterLevels ? terrain.waterLevels[index] : terrain.heights[index]! < 0 ? 0 : null;
  return typeof level === "number" && level > terrain.heights[index]! + 0.01 ? level : null;
}

export function resizeTerrainWaterColors(source: SceneTerrain, next: SceneTerrain) {
  let colors: Record<string, string> | undefined;
  if (source.waterColors) for (let row = 0; row <= next.segments; row++) for (let column = 0; column <= next.segments; column++) {
    const x = (column / next.segments - 0.5) * next.size, z = (row / next.segments - 0.5) * next.size;
    if (Math.abs(x) > source.size / 2 || Math.abs(z) > source.size / 2) continue;
    const index = row * (next.segments + 1) + column;
    if (getTerrainWaterLevel(next, index) === null) continue;
    const oldColumn = Math.round((x / source.size + 0.5) * source.segments), oldRow = Math.round((z / source.size + 0.5) * source.segments);
    const color = source.waterColors[oldRow * (source.segments + 1) + oldColumn];
    if (color !== undefined) (colors ??= {})[index] = color;
  }
  if (colors) next.waterColors = colors;
  else delete next.waterColors;
}

export function reconcileTerrainWater(terrain: SceneTerrain) {
  const levels = terrain.waterLevels;
  if (!levels) {
    if (!terrain.waterColors) return false;
    const updates = new Map<number, string | null>();
    for (const key of Object.keys(terrain.waterColors)) if (getTerrainWaterLevel(terrain, Number(key)) === null) updates.set(Number(key), null);
    return updateTerrainWaterColors(terrain, updates);
  }
  let colorUpdates: Map<number, string | null> | undefined;
  let changed = false;
  for (let index = 0; index < levels.length; index++) {
    if (getTerrainWaterLevel(terrain, index) !== null) continue;
    if (terrain.waterColors?.[index] !== undefined) (colorUpdates ??= new Map()).set(index, null);
    if (levels[index] !== null) { levels[index] = null; changed = true; }
    if (terrain.surfaces[index] === 2) { terrain.surfaces[index] = 0; clearTerrainSurfaceBlend(terrain, index); changed = true; }
  }
  const width = terrain.segments + 1;
  const visited = new Uint8Array(levels.length);
  const active = levels.map((_, index) => getTerrainWaterLevel(terrain, index));
  // ACT: 最多257×257网格仅对同水位连通片做最低岸口泄水；坡河保留分段水位，不求解流体质量与惯性。
  for (let start = 0; start < levels.length; start++) {
    const level = active[start]!;
    if (visited[start] || level === null) continue;
    const component = [start];
    visited[start] = 1;
    let spill = level;
    for (let cursor = 0; cursor < component.length; cursor++) {
      const index = component[cursor]!;
      const column = index % width;
      const row = Math.floor(index / width);
      for (const [dx, dz] of terrainNeighbors) {
        const x = column + dx!;
        const z = row + dz!;
        if (x < 0 || z < 0 || x >= width || z >= width) { spill = Math.min(spill, 0); continue; }
        const next = z * width + x;
        const adjacent = active[next]!;
        if (adjacent === null) spill = Math.min(spill, terrain.heights[next]!);
        else if (!visited[next] && Math.abs(adjacent - level) < 0.015) { visited[next] = 1; component.push(next); }
      }
    }
    if (spill >= level - 0.001) continue;
    for (const index of component) {
      const wet = spill > terrain.heights[index]! + 0.01;
      levels[index] = wet ? spill : null;
      if (!wet) {
        terrain.surfaces[index] = 0; clearTerrainSurfaceBlend(terrain, index);
        if (terrain.waterColors?.[index] !== undefined) (colorUpdates ??= new Map()).set(index, null);
      }
    }
    changed = true;
  }
  if (colorUpdates) changed = updateTerrainWaterColors(terrain, colorUpdates) || changed;
  return changed;
}

function paintTerrainRamp(terrain: SceneTerrain, radius: number, strength: number, hardness: number, targetHeight: number, stroke: TerrainBrushStroke) {
  const reference = stroke.reference;
  const heights = reference.heights.slice();
  const surfaces = reference.surfaces.slice();
  const levels = reference.waterLevels?.slice();
  const waterColors = reference.waterColors ? { ...reference.waterColors } : undefined;
  const blend = reference.surfaceBlend ? { surfaces: reference.surfaceBlend.surfaces.slice(), weights: reference.surfaceBlend.weights.slice() } : undefined;
  const dx = stroke.end.x - stroke.origin.x;
  const dz = stroke.end.z - stroke.origin.z;
  const lengthSquared = dx * dx + dz * dz;
  const spacing = terrain.size / terrain.segments;
  const startHeight = clamp(stroke.startHeight, -12, 40);
  let changed = false;
  // ACT: 坡道是起终点之间的直线走廊，每帧从本笔快照重绘；网格不保留转向前的旧走廊。
  for (let row = 0; row <= terrain.segments; row++) for (let column = 0; column <= terrain.segments; column++) {
    const index = row * (terrain.segments + 1) + column;
    if (lengthSquared > 0.000001) {
      const x = column * spacing - terrain.size / 2;
      const z = row * spacing - terrain.size / 2;
      const progress = clamp(((x - stroke.origin.x) * dx + (z - stroke.origin.z) * dz) / lengthSquared, 0, 1);
      const distance = Math.hypot(x - stroke.origin.x - progress * dx, z - stroke.origin.z - progress * dz) / radius;
      if (distance < 1) {
        const falloff = terrainBrushFalloff(distance, hardness);
        const height = startHeight + (targetHeight - startHeight) * progress;
        heights[index] = Math.round(clamp(heights[index]! + (height - heights[index]!) * (1 - Math.exp(-strength * (stroke.elapsed ?? 0) * 9 * falloff)), -12, 40) * 1000000) / 1000000;
      }
    }
    const level = getTerrainWaterLevel(reference, index);
    if (surfaces[index] === 2 && (level === null || heights[index]! >= level - 0.01)) {
      surfaces[index] = 0;
      if (blend) { blend.surfaces[index] = 0; blend.weights[index] = 0; }
      if (levels) levels[index] = null;
      if (waterColors) delete waterColors[index];
    }
    if (heights[index] !== terrain.heights[index] || surfaces[index] !== terrain.surfaces[index] || (levels?.[index] ?? null) !== (terrain.waterLevels?.[index] ?? null) || (blend?.surfaces[index] ?? surfaces[index]) !== (terrain.surfaceBlend?.surfaces[index] ?? terrain.surfaces[index]) || (blend?.weights[index] ?? 0) !== (terrain.surfaceBlend?.weights[index] ?? 0) || waterColors?.[index] !== terrain.waterColors?.[index]) changed = true;
  }
  if (!changed) return false;
  terrain.heights = heights;
  terrain.surfaces = surfaces;
  if (blend) terrain.surfaceBlend = blend;
  else delete terrain.surfaceBlend;
  if (levels) terrain.waterLevels = levels;
  else delete terrain.waterLevels;
  if (waterColors && Object.keys(waterColors).length) terrain.waterColors = waterColors;
  else delete terrain.waterColors;
  return true;
}

export function paintTerrain(terrain: SceneTerrain, position: { x: number; y?: number; z: number }, brush: TerrainBrush, radius: number, strength: number, deltaSeconds: number, options?: { color?: string; flow?: number; hardness?: number; targetHeight?: number; water?: { level: number; reference: SceneTerrain }; stroke?: TerrainBrushStroke }) {
  if (![position.x, position.z, radius, strength, deltaSeconds].every(Number.isFinite) || radius <= 0 || strength <= 0 || deltaSeconds <= 0) return false;
  const requestedFlow = options?.flow;
  const flow = typeof requestedFlow === "number" && Number.isFinite(requestedFlow) ? clamp(requestedFlow, 0, 1) : 1;
  if (flow === 0) return false;
  const surfaceId = getTerrainSurfaceId(brush);
  if (surfaceId !== undefined) return paintTerrainSurface(terrain, position, surfaceId, radius, strength, deltaSeconds, options);
  const requestedHardness = options?.hardness;
  const requestedHeight = options?.targetHeight;
  const hardness = typeof requestedHardness === "number" && Number.isFinite(requestedHardness) ? clamp(requestedHardness, 0, 1) : 0.35;
  const targetHeight = typeof requestedHeight === "number" && Number.isFinite(requestedHeight) ? clamp(requestedHeight, -12, 40) : 0;
  const stroke = options?.stroke;
  const origin = stroke && [stroke.origin.x, stroke.origin.z].every(Number.isFinite) ? stroke.origin : position;
  const end = stroke && [stroke.end.x, stroke.end.z].every(Number.isFinite) ? stroke.end : position;
  const shapeReference = stroke?.reference ?? terrain;
  const startHeight = stroke && Number.isFinite(stroke.startHeight) ? clamp(stroke.startHeight, -12, 40) : getTerrainHeight(shapeReference, origin.x, origin.z);
  const directionLength = Math.hypot(end.x - origin.x, end.z - origin.z);
  const directionX = directionLength > 0.0001 ? (end.x - origin.x) / directionLength : 1;
  const directionZ = directionLength > 0.0001 ? (end.z - origin.z) / directionLength : 0;
  if (brush === "ramp") {
    const rampTarget = typeof requestedHeight === "number" && Number.isFinite(requestedHeight) ? targetHeight : clamp(startHeight + radius * 0.5, -12, 40);
    const elapsed = typeof stroke?.elapsed === "number" && Number.isFinite(stroke.elapsed) ? Math.max(0, stroke.elapsed) : clamp(deltaSeconds, 0, 0.1);
    return paintTerrainRamp(terrain, radius, clamp(strength, 0, 5) * flow, hardness, rampTarget, { origin, end, startHeight, reference: shapeReference, elapsed });
  }
  const width = terrain.segments + 1;
  const spacing = terrain.size / terrain.segments;
  const minColumn = clamp(Math.floor((position.x - radius + terrain.size / 2) / spacing), 0, terrain.segments);
  const maxColumn = clamp(Math.ceil((position.x + radius + terrain.size / 2) / spacing), 0, terrain.segments);
  const minRow = clamp(Math.floor((position.z - radius + terrain.size / 2) / spacing), 0, terrain.segments);
  const maxRow = clamp(Math.ceil((position.z + radius + terrain.size / 2) / spacing), 0, terrain.segments);
  const amount = clamp(strength, 0, 5) * flow * clamp(deltaSeconds, 0, 0.1);
  if (amount <= 0) return false;
  const before = brush === "smooth" || brush === "slope" ? terrain.heights.slice() : terrain.heights;
  const waterBrush = brush === "lake" || brush === "river";
  if (waterBrush && options?.color !== undefined && !/^#[\da-f]{6}$/i.test(options.color)) throw new Error("水体颜色必须是#rrggbb格式");
  const waterColor = waterBrush ? options?.color?.toLowerCase() : undefined;
  let colorUpdates: Map<number, string | null> | undefined;
  if (!terrain.waterLevels && (waterBrush || terrain.surfaces.some((surface, index) => surface === 2 && terrain.heights[index]! < 0))) {
    terrain.waterLevels = terrain.surfaces.map((surface, index) => surface === 2 && terrain.heights[index]! < 0 ? 0 : null);
  }
  const centerColumn = clamp(Math.round((position.x + terrain.size / 2) / spacing), 0, terrain.segments);
  const centerRow = clamp(Math.round((position.z + terrain.size / 2) / spacing), 0, terrain.segments);
  const reference = options?.water?.reference ?? terrain;
  const centerLevel = getTerrainWaterLevel(reference, centerRow * width + centerColumn);
  const localLevel = clamp(centerLevel ?? getTerrainHeight(reference, position.x, position.z) - 0.04, -11.8, 39.8);
  const water = options?.water ?? { level: localLevel, reference };
  if (brush === "river") water.level = Math.min(water.level, localLevel);
  if (brush === "river" && centerLevel === null && getTerrainHeight(reference, position.x, position.z) > water.level + 1.2) return false;
  const depth = Math.min(1.2, Math.max(0.35, radius * 0.12));
  const centerHeight = getTerrainHeight(shapeReference, position.x, position.z);
  const automaticDirection = typeof stroke?.direction === "number" && Number.isFinite(stroke.direction) && stroke.direction < 0 ? -1 : 1;
  let changed = false;
  for (let row = minRow; row <= maxRow; row++) for (let column = minColumn; column <= maxColumn; column++) {
    const x = column * spacing - terrain.size / 2;
    const z = row * spacing - terrain.size / 2;
    const distance = Math.hypot(x - position.x, z - position.z) / radius;
    if (distance >= 1) continue;
    const falloff = terrainBrushFalloff(distance, hardness);
    if (falloff === 0) continue;
    const index = row * width + column;
    const oldHeight = terrain.heights[index]!;
    const oldSurface = terrain.surfaces[index]!;
    let height = oldHeight;
    let surface = oldSurface;
    let waterLevel = terrain.waterLevels?.[index] ?? null;
    let blendChanged = false;
    let paintedWater = false;
    if (brush === "auto") height += automaticDirection * 7 * amount * falloff;
    else if (brush === "raise") height += 7 * amount * falloff;
    else if (brush === "plateau") {
      const core = smooth(clamp((1 - distance) / Math.max(0.1, 1 - Math.max(hardness, 0.65)), 0, 1));
      const target = clamp(startHeight + Math.max(0.6, radius * 0.65), -12, 40);
      height += (target - height) * Math.min(1, amount * 9 * core);
    }
    else if (brush === "lower") height -= 7 * amount * falloff ** 1.5;
    else if (brush === "flatten") height += (targetHeight - height) * Math.min(1, amount * 9 * falloff);
    else if (brush === "level") height += (startHeight - height) * Math.min(1, amount * 9 * falloff);
    else if (brush === "smooth") {
      let sum = 0;
      let count = 0;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const sampleRow = clamp(row + dz, 0, terrain.segments);
        const sampleColumn = clamp(column + dx, 0, terrain.segments);
        sum += before[sampleRow * width + sampleColumn]!;
        count++;
      }
      height += (sum / count - height) * Math.min(1, amount * 9 * falloff);
    } else if (brush === "slope") {
      const grade = Math.hypot(x - position.x, z - position.z) * 0.45;
      const target = clamp(before[index]!, centerHeight - grade, centerHeight + grade);
      height += (target - height) * Math.min(1, amount * 9 * falloff);
    } else if (brush === "ridge") {
      const across = Math.abs((x - position.x) * directionZ - (z - position.z) * directionX);
      const crest = Math.max(0, 1 - across / (radius * 0.55)) ** 2;
      height += 9 * amount * falloff * crest;
    } else if (brush === "terrace") {
      const step = Math.max(0.5, radius * 0.2);
      const target = Math.round(shapeReference.heights[index]! / step) * step;
      height += (target - height) * Math.min(1, amount * 9 * falloff);
    } else if (brush === "cliff") {
      const across = (x - position.x) * directionZ - (z - position.z) * directionX;
      const edge = smooth(clamp(0.5 + across / Math.max(0.15, radius * 0.12), 0, 1));
      const target = startHeight + Math.max(1, radius * 0.8) * edge;
      height += (target - height) * Math.min(1, amount * 12 * falloff);
    } else if (brush === "noise") {
      const seed = terrain.seed % 10000;
      const wave = (Math.sin(x * 0.71 + seed * 0.013) * Math.cos(z * 0.63 - seed * 0.017) + Math.sin(x * 1.43 + z * 0.91 + seed * 0.007) * 0.4) / 1.4;
      height += wave * 7 * amount * falloff;
    } else if (brush === "hills") {
      const rolling = 0.35 + 0.65 * terrainNoise(x / Math.max(1, radius * 0.45), z / Math.max(1, radius * 0.45), terrain.seed);
      const target = shapeReference.heights[index]! + radius * 0.45 * Math.cos(distance * Math.PI / 2) ** 2 * rolling;
      height += (target - height) * Math.min(1, amount * 5 * falloff);
    } else if (brush === "dunes") {
      const along = (x - position.x) * directionX + (z - position.z) * directionZ;
      const across = (x - position.x) * directionZ - (z - position.z) * directionX;
      const phase = along / Math.max(0.8, radius * 0.55) + Math.sin(across / Math.max(1, radius) * 3) * 0.18;
      const wave = ((phase % 1) + 1) % 1;
      const crest = wave < 0.78 ? smooth(wave / 0.78) : 1 - smooth((wave - 0.78) / 0.22);
      const target = shapeReference.heights[index]! + radius * 0.3 * crest * Math.sin(distance * Math.PI / 2 + Math.PI / 2) ** 2;
      height += (target - height) * Math.min(1, amount * 7 * falloff);
    } else if (brush === "gullies") {
      const along = (x - position.x) * directionX + (z - position.z) * directionZ;
      const across = (x - position.x) * directionZ - (z - position.z) * directionX;
      const channel = Math.abs(Math.sin(across / Math.max(0.5, radius * 0.22) + Math.sin(along / Math.max(1, radius * 0.4)) * 0.45));
      const cut = Math.max(0, 1 - channel / 0.42) ** 2;
      const target = shapeReference.heights[index]! - radius * 0.45 * cut;
      height += (target - height) * Math.min(1, amount * 8 * falloff);
    } else if (brush === "canyon") {
      const across = (x - position.x) * directionZ - (z - position.z) * directionX;
      const cut = 1 - smooth(clamp((Math.abs(across) / radius - 0.24) / 0.18, 0, 1));
      const target = shapeReference.heights[index]! - radius * 0.95 * cut;
      height += (target - height) * Math.min(1, amount * 8 * falloff);
    } else if (brush === "basin") {
      const bowl = 1 - smooth(clamp((distance - 0.18) / 0.72, 0, 1));
      const target = shapeReference.heights[index]! - radius * 0.55 * bowl;
      height += (target - height) * Math.min(1, amount * 7 * falloff);
    } else if (brush === "volcano") {
      const cone = Math.max(0, 1 - distance) ** 1.15;
      const crater = Math.max(0, 1 - distance / 0.26) ** 1.4;
      const target = startHeight + radius * (cone * 1.1 - crater * 0.9);
      height += (target - height) * Math.min(1, amount * 7 * falloff);
    } else if (brush === "lake") {
      const basin = distance < 0.5;
      const target = basin ? water.level - depth * Math.max(0.15, 1 - (distance / 0.55) ** 4) : water.level + 0.12;
      const bank = basin ? falloff : Math.sin((distance - 0.5) / 0.5 * Math.PI);
      height += (target - height) * Math.min(1, amount * 16 * Math.max(falloff, bank));
      if (basin && height < water.level - 0.02) { surface = 2; waterLevel = water.level; paintedWater = true; }
    } else if (brush === "river") {
      const previous = getTerrainWaterLevel(reference, index);
      const level = Math.min(water.level, previous ?? clamp(reference.heights[index]! - 0.04, -11.8, 39.8));
      if (oldHeight <= level + 1.2) {
        height = Math.min(height, Math.max(level - depth, height - 7 * amount * falloff));
        if (height < level - 0.02 && falloff > 0.15) { surface = 2; waterLevel = level; paintedWater = true; }
      }
    }
    if (height !== oldHeight) height = Math.round(clamp(height, -12, 40) * 1000000) / 1000000;
    if (surface !== 2 || typeof waterLevel !== "number" || height >= waterLevel - 0.01) { waterLevel = null; if (surface === 2) surface = 0; }
    if (waterLevel === null && terrain.waterColors?.[index] !== undefined) (colorUpdates ??= new Map()).set(index, null);
    else if (paintedWater && waterColor !== undefined) (colorUpdates ??= new Map()).set(index, waterColor === terrainWaterColor ? null : waterColor);
    const clearBlend = surface !== oldSurface || waterBrush && surface === 2;
    if (clearBlend && terrain.surfaceBlend && (terrain.surfaceBlend.weights[index] !== 0 || terrain.surfaceBlend.surfaces[index] !== surface)) blendChanged = true;
    if (blendChanged || height !== oldHeight || surface !== oldSurface || terrain.waterLevels && terrain.waterLevels[index] !== waterLevel) {
      terrain.heights[index] = height;
      terrain.surfaces[index] = surface;
      if (clearBlend) clearTerrainSurfaceBlend(terrain, index);
      if (terrain.waterLevels) terrain.waterLevels[index] = waterLevel;
      changed = true;
    }
  }
  if (colorUpdates) changed = updateTerrainWaterColors(terrain, colorUpdates) || changed;
  return changed;
}
