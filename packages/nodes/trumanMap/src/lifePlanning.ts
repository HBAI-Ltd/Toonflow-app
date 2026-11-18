import { Vector3 } from "three";
import type { Box3, Matrix4 } from "three";
import type { LifeAnchor, LifePlanningContext, LifeStatus } from "./lifeDocument";
import type { SceneDocument, Vector3Value } from "./sceneDocument";
import { getTerrainHeight, getTerrainWaterLevel } from "./terrainModel";

type SurfacePoint = { position: Vector3Value; surface: "ground" | "water"; slope: number };

export function buildLifePlanningContext(document: SceneDocument, measured: { objectId: string; bounds: Box3; matrixWorld: Matrix4; effectParts?: { id: string; name: string }[] }[], execution: LifeStatus): LifePlanningContext {
  const terrain = document.terrain;
  const width = (terrain?.segments ?? 0) + 1;
  const spacing = terrain ? terrain.size / terrain.segments : 1;
  const levels = terrain ? terrain.heights.map((_, index) => getTerrainWaterLevel(terrain, index)) : [];
  const extended = levels.slice();
  if (terrain) for (let row = 0; row < width; row++) for (let column = 0; column < width; column++) {
    const index = row * width + column;
    if (levels[index] !== null) continue;
    let sum = 0;
    let weight = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const x = column + dx;
      const z = row + dz;
      if ((!dx && !dz) || x < 0 || z < 0 || x >= width || z >= width) continue;
      const level = levels[z * width + x];
      if (typeof level !== "number") continue;
      const part = 1 / (dx * dx + dz * dz);
      sum += level * part;
      weight += part;
    }
    if (weight) extended[index] = sum / weight;
  }
  const maxSlope = Math.tan(42 * Math.PI / 180);
  const validCoordinate = (point: Vector3Value) => [point.x, point.y, point.z].every(value => Number.isFinite(value) && Math.abs(value) <= 10000);
  const toValue = (point: Vector3Value): Vector3Value => ({ x: point.x, y: point.y, z: point.z });
  const visibleObjects = document.objects.filter(object => object.visible);
  const visibleIds = new Set(visibleObjects.map(object => object.id));
  const measures = new Map(measured.filter(item => visibleIds.has(item.objectId) && !item.bounds.isEmpty()
    && [...item.bounds.min.toArray(), ...item.bounds.max.toArray()].every(Number.isFinite)).map(item => [item.objectId, item]));

  function sampleSurface(x: number, z: number): SurfacePoint | undefined {
    if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > 10000 || Math.abs(z) > 10000) return undefined;
    if (!terrain) return { position: { x, y: 0, z }, surface: "ground", slope: 0 };
    if (Math.abs(x) > terrain.size / 2 || Math.abs(z) > terrain.size / 2) return undefined;
    const gx = (x / terrain.size + 0.5) * terrain.segments;
    const gz = (z / terrain.size + 0.5) * terrain.segments;
    const column = Math.min(terrain.segments - 1, Math.max(0, Math.floor(gx)));
    const row = Math.min(terrain.segments - 1, Math.max(0, Math.floor(gz)));
    const u = gx - column;
    const v = gz - row;
    const a = row * width + column;
    const b = a + width;
    const d = a + 1;
    const c = b + 1;
    const first = u + v <= 1;
    const indices = first ? [a, b, d] : [c, b, d];
    const weights = first ? [1 - u - v, v, u] : [u + v - 1, 1 - u, 1 - v];
    const ground = getTerrainHeight(terrain, x, z);
    let surface: "ground" | "water" = "ground";
    let y = ground;
    if (indices.some(index => levels[index] !== null)) {
      const level = indices.reduce((sum, index, part) => sum + extended[index]! * weights[part]!, 0);
      if (Number.isFinite(level) && level >= ground - 0.005) { surface = "water"; y = level; }
    }
    const heights = surface === "water" ? extended : terrain.heights;
    const slopeX = first ? (heights[d]! - heights[a]!) / spacing : (heights[c]! - heights[b]!) / spacing;
    const slopeZ = first ? (heights[b]! - heights[a]!) / spacing : (heights[c]! - heights[d]!) / spacing;
    return { position: { x, y, z }, surface, slope: Math.hypot(slopeX, slopeZ) };
  }

  function unobstructed(point: SurfacePoint, exceptObjectId?: string) {
    if (!validCoordinate(point.position) || !Number.isFinite(point.slope) || point.slope > maxSlope) return false;
    const { x, y, z } = point.position;
    for (const item of measures.values()) {
      if (item.objectId === exceptObjectId) continue;
      const box = item.bounds;
      if (x >= box.min.x - 0.4 && x <= box.max.x + 0.4 && z >= box.min.z - 0.4 && z <= box.max.z + 0.4
        && box.max.y > y + 0.15 && box.min.y < y + 1.8) return false;
    }
    return true;
  }

  const objects: LifePlanningContext["objects"] = [];
  const unavailableObjectIds: string[] = [];
  for (const object of visibleObjects) {
    const item = measures.get(object.id);
    if (!item) { unavailableObjectIds.push(object.id); continue; }
    const box = item.bounds;
    const middleX = (box.min.x + box.max.x) / 2;
    const middleZ = (box.min.z + box.max.z) / 2;
    const minX = box.min.x - 0.8;
    const maxX = box.max.x + 0.8;
    const minZ = box.min.z - 0.8;
    const maxZ = box.max.z + 0.8;
    const determinant = item.matrixWorld.determinant();
    const inverse = item.matrixWorld.elements.every(Number.isFinite) && Number.isFinite(determinant) && Math.abs(determinant) > 1e-12
      ? item.matrixWorld.clone().invert() : undefined;
    const approaches: LifePlanningContext["objects"][number]["approaches"] = [];
    for (const [x, z] of [[minX, middleZ], [maxX, middleZ], [middleX, minZ], [middleX, maxZ], [minX, minZ], [minX, maxZ], [maxX, minZ], [maxX, maxZ]]) {
      const point = sampleSurface(x!, z!);
      if (!point || !unobstructed(point, object.id)) continue;
      const position = toValue(point.position);
      const offset = inverse ? new Vector3(position.x, position.y, position.z).applyMatrix4(inverse) : undefined;
      const anchor: LifeAnchor = offset && validCoordinate(offset)
        ? { kind: "object", objectId: object.id, offset: toValue(offset) } : { kind: "point", position: toValue(position) };
      approaches.push({ anchor, position, surface: point.surface, reachability: "notChecked" });
    }
    objects.push({ objectId: object.id, name: object.name, tags: [...(object.asset.tags ?? [])], effectParts: item.effectParts,
      bounds: { min: toValue(box.min), max: toValue(box.max) }, approaches });
  }

  const shorePoints = new Map<number, SurfacePoint>();
  if (terrain) {
    const grid = terrain.heights.map((_, index) => sampleSurface((index % width / terrain.segments - 0.5) * terrain.size,
      (Math.floor(index / width) / terrain.segments - 0.5) * terrain.size));
    for (let row = 0; row < width; row++) for (let column = 0; column < width; column++) {
      if (levels[row * width + column] === null) continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let distance = 2; distance <= 4; distance++) {
        const x = column + dx! * distance;
        const z = row + dz! * distance;
        if (x < 1 || z < 1 || x >= width - 1 || z >= width - 1) continue;
        const index = z * width + x;
        if (shorePoints.has(index)) break;
        const point = grid[index];
        if (!point || point.surface !== "ground" || !unobstructed(point)) continue;
        let dryBuffer = true;
        // ACT: 固定地形网格上保留一格干地缓冲；这里只筛表面候选，不构建或宣称完整路径可达。
        for (let nearZ = -1; nearZ <= 1; nearZ++) for (let nearX = -1; nearX <= 1; nearX++) {
          if (grid[(z + nearZ) * width + x + nearX]?.surface !== "ground") dryBuffer = false;
        }
        if (!dryBuffer) continue;
        shorePoints.set(index, point);
        break;
      }
    }
  }
  const candidates = [...shorePoints.values()];
  const shoreCount = Math.min(24, candidates.length);
  const shores: LifePlanningContext["shores"] = Array.from({ length: shoreCount }, (_, index) => {
    const position = toValue(candidates[Math.floor(index * candidates.length / shoreCount)]!.position);
    return { anchor: { kind: "point", position: toValue(position) }, position, surface: "ground", reachability: "notChecked" };
  });
  return { objects, shores, unavailableObjectIds, execution: structuredClone(execution),
    note: "候选点仅经过实际地表、水位、坡度和已测量物体包围盒筛选，未验证导航连通性。请依据物体原名与标签判断用途；完整路径由运行时预检，不可把 notChecked 当作可达。" };
}
