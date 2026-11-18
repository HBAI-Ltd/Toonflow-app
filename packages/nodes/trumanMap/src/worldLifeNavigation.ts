import { Box3, Euler, InstancedMesh, Matrix4, Mesh, Quaternion, Vector3 } from "three";
import type { Object3D } from "three";
import { generateCachedNavMesh } from "./worldLifeNavTiles";
import type { SceneDocument } from "./sceneDocument";
import type { SceneLife } from "./lifeDocument";
import { getTerrainWaterLevel } from "./terrainModel";
import { createCollisionShape, sweepCollision, transformCollisionShape, intersectsCollision, type CollisionBody } from "./sceneCollision";

export type LifeRoadNode = { position: Vector3; outgoing: number[] };
export type LifeRoadEdge = { from: number; to: number; start: Vector3; end: Vector3; direction: Vector3; length: number; width: number; reverse: number };
export type LifeNavigationGeometry = { models: Object3D[]; boxes: Box3[] };
export type LifeNavigationProfile = { radius: number; height: number };
type RoadSegment = { start: Vector3; end: Vector3; width: number; cuts: number[] };

function clipLifeSegment(start: Vector3, end: Vector3, settings: SceneLife) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared < 0.0001) return undefined;
  const closest = ((settings.center.x - start.x) * dx + (settings.center.z - start.z) * dz) / lengthSquared;
  const px = start.x + dx * closest - settings.center.x;
  const pz = start.z + dz * closest - settings.center.z;
  const remaining = settings.radius * settings.radius - px * px - pz * pz;
  if (remaining <= 0) return undefined;
  const halfLength = Math.sqrt(remaining / lengthSquared);
  const from = Math.max(0, closest - halfLength);
  const to = Math.min(1, closest + halfLength);
  if (from >= to) return undefined;
  return [start.clone().lerp(end, from), start.clone().lerp(end, to)] as const;
}

function roadSegments(document: SceneDocument, settings: SceneLife) {
  const segments: RoadSegment[] = [];
  const matrix = new Matrix4();
  const rotation = new Quaternion();
  for (const object of document.objects) {
    const navigation = object.navigation;
    if (!object.visible || navigation?.kind !== "road") continue;
    rotation.setFromEuler(new Euler(object.rotation.x * Math.PI / 180, object.rotation.y * Math.PI / 180, object.rotation.z * Math.PI / 180));
    matrix.compose(new Vector3(object.position.x, object.position.y, object.position.z), rotation, new Vector3(object.scale.x, object.scale.y, object.scale.z));
    const points = navigation.points.map(point => new Vector3(point.x, point.y, point.z).applyMatrix4(matrix));
    const width = navigation.width * Math.min(object.scale.x, object.scale.z);
    if (width < 4) continue;
    const side = Math.min(1.5, Math.max(0.65, width / 4));
    if (side >= settings.radius) continue;
    const laneSettings = { ...settings, radius: settings.radius - side };
    for (let index = 1; index < points.length; index++) {
      const clipped = clipLifeSegment(points[index - 1]!, points[index]!, laneSettings);
      if (!clipped) continue;
      const [start, end] = clipped;
      if (start.distanceToSquared(end) < 0.04) continue;
      segments.push({ start, end, width, cuts: [0, 1] });
    }
  }
  return segments;
}

export function buildLifeRoads(document: SceneDocument, settings: SceneLife, route?: readonly Vector3[]) {
  if (route) {
    // ACT: 个体已有车道动线，按有序节点执行，不要求环境标记，也不将自交点合并为捷径。
    const points: Vector3[] = [];
    for (const point of route) if (!points.length || point.distanceToSquared(points[points.length - 1]!) > 1e-8) points.push(point.clone());
    const nodes: LifeRoadNode[] = points.map(position => ({ position, outgoing: [] }));
    const edges: LifeRoadEdge[] = [];
    for (let index = 1; index < points.length; index++) {
      const start = points[index - 1]!;
      const end = points[index]!;
      const closing = index === points.length - 1 ? points.slice(0, index).findIndex(point => point.distanceToSquared(end) < 1e-8) : -1;
      const from = index - 1;
      const to = closing >= 0 ? closing : index;
      const length = start.distanceTo(end);
      const direction = end.clone().sub(start).divideScalar(length);
      const reverse = edges.length + 1;
      nodes[from]!.outgoing.push(reverse - 1);
      nodes[to]!.outgoing.push(reverse);
      edges.push({ from, to, start, end, direction, length, width: 0, reverse });
      edges.push({ from: to, to: from, start: end, end: start, direction: direction.clone().negate(), length, width: 0, reverse: reverse - 1 });
    }
    return { nodes, edges, truncated: false };
  }
  const allSegments = roadSegments(document, settings);
  // ACT: 首版路网交点为 O(n²)，只分析活动半径内最多768段；更大路网改为空间分桶再拆段。
  const segments = allSegments.slice(0, 768);
  for (let first = 0; first < segments.length; first++) for (let second = first + 1; second < segments.length; second++) {
    const a = segments[first]!;
    const b = segments[second]!;
    const ax = a.end.x - a.start.x;
    const az = a.end.z - a.start.z;
    const bx = b.end.x - b.start.x;
    const bz = b.end.z - b.start.z;
    const cross = ax * bz - az * bx;
    if (Math.abs(cross) < 1e-7) continue;
    const dx = b.start.x - a.start.x;
    const dz = b.start.z - a.start.z;
    const t = (dx * bz - dz * bx) / cross;
    const u = (dx * az - dz * ax) / cross;
    if (t < -0.0001 || t > 1.0001 || u < -0.0001 || u > 1.0001) continue;
    const y = a.start.y + (a.end.y - a.start.y) * t;
    if (Math.abs(y - b.start.y - (b.end.y - b.start.y) * u) > 0.6) continue;
    a.cuts.push(Math.min(1, Math.max(0, t)));
    b.cuts.push(Math.min(1, Math.max(0, u)));
  }
  const nodes: LifeRoadNode[] = [];
  const edges: LifeRoadEdge[] = [];
  const buckets = new Map<string, number[]>();
  function nodeAt(position: Vector3) {
    const x = Math.floor(position.x * 2);
    const z = Math.floor(position.z * 2);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      for (const index of buckets.get(`${x + dx}:${z + dz}`) ?? []) if (nodes[index]!.position.distanceToSquared(position) < 0.16) return index;
    }
    const index = nodes.length;
    nodes.push({ position, outgoing: [] });
    const key = `${x}:${z}`;
    buckets.set(key, [...buckets.get(key) ?? [], index]);
    return index;
  }
  for (const segment of segments) {
    const cuts = [...new Set(segment.cuts)].sort((a, b) => a - b);
    for (let index = 1; index < cuts.length; index++) {
      const a = segment.start.clone().lerp(segment.end, cuts[index - 1]!);
      const b = segment.start.clone().lerp(segment.end, cuts[index]!);
      if (a.distanceToSquared(b) < 0.09) continue;
      const from = nodeAt(a);
      const to = nodeAt(b);
      if (from === to) continue;
      const direction = b.clone().sub(a).normalize();
      const length = a.distanceTo(b);
      const edgeIndex = edges.length;
      edges.push({ from, to, start: a, end: b, direction, length, width: segment.width, reverse: edgeIndex + 1 });
      edges.push({ from: to, to: from, start: b, end: a, direction: direction.clone().negate(), length, width: segment.width, reverse: edgeIndex });
      nodes[from]!.outgoing.push(edgeIndex);
      nodes[to]!.outgoing.push(edgeIndex + 1);
    }
  }
  return { nodes, edges, truncated: allSegments.length > segments.length };
}

export function lifeRoadPoint(edge: LifeRoadEdge, distance: number, output: Vector3) {
  if (!edge.width) return output.copy(edge.start).lerp(edge.end, Math.min(1, Math.max(0, distance / edge.length)));
  const side = Math.min(1.5, Math.max(0.65, edge.width / 4));
  return output.copy(edge.start).lerp(edge.end, Math.min(1, Math.max(0, distance / edge.length))).add(new Vector3(edge.direction.z * side, 0.025, -edge.direction.x * side));
}

type LifeNavPoint = { x: number; y: number; z: number; depth: number };

function clipLifePolygon(points: LifeNavPoint[], distance: (point: LifeNavPoint) => number) {
  const result: LifeNavPoint[] = [];
  for (let index = 0; index < points.length; index++) {
    const from = points[(index + points.length - 1) % points.length]!;
    const to = points[index]!;
    const a = distance(from);
    const b = distance(to);
    if ((a >= 0) !== (b >= 0)) {
      const fraction = a / (a - b);
      result.push({ x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction,
        z: from.z + (to.z - from.z) * fraction, depth: from.depth + (to.depth - from.depth) * fraction });
    }
    if (b >= 0) result.push(to);
  }
  return result;
}

const areaCosine = Math.cos(Math.PI / 32);
const areaNormals = Array.from({ length: 32 }, (_, side) => {
  const angle = side / 32 * Math.PI * 2;
  return { x: Math.cos(angle), z: Math.sin(angle) };
});
function clipLifeArea(points: LifeNavPoint[], settings: SceneLife) {
  const apothem = settings.radius * areaCosine;
  // 三角形的顶点全在内切圆时，其凸包也在原32边形内。
  if (points.every(point => (point.x - settings.center.x) ** 2 + (point.z - settings.center.z) ** 2 <= apothem * apothem)) return points;
  for (const normal of areaNormals) {
    const distance = (point: LifeNavPoint) => apothem - (point.x - settings.center.x) * normal.x - (point.z - settings.center.z) * normal.z;
    let inside = 0;
    for (const point of points) if (distance(point) >= 0) inside++;
    if (!inside) return [];
    if (inside < points.length) points = clipLifePolygon(points, distance);
  }
  return points;
}

// 导航几何统一用「三角形汤」：每个三角形连续9个数（三个顶点的xyz），不带索引；多边形按扇形拆开。
function appendLifePolygon(points: LifeNavPoint[], triangles: number[]) {
  const first = points[0]!;
  for (let index = 1; index < points.length - 1; index++) {
    const second = points[index]!, third = points[index + 1]!;
    triangles.push(first.x, first.y, first.z, second.x, second.y, second.z, third.x, third.y, third.z);
  }
}

function buildLifeTerrainGeometry(document: SceneDocument, settings: SceneLife, surface: "ground" | "water") {
  const terrain = document.terrain;
  const triangles: number[] = [];
  if (!terrain && surface === "water") return triangles;
  const segments = terrain?.segments ?? 64;
  const width = segments + 1;
  const size = terrain?.size ?? settings.radius * 2;
  const lower = (world: number) => terrain ? Math.max(0, Math.floor(((world - settings.radius) / size + 0.5) * segments) - 1) : 0;
  const upper = (world: number) => terrain ? Math.min(segments, Math.ceil(((world + settings.radius) / size + 0.5) * segments) + 1) : segments;
  const minX = lower(settings.center.x), maxX = upper(settings.center.x);
  const minZ = lower(settings.center.z), maxZ = upper(settings.center.z);
  if (minX >= maxX || minZ >= maxZ) return triangles;
  const levelAt = (i: number) => terrain ? getTerrainWaterLevel(terrain, i) : null;
  const waterGrid = new Map<number, number | null>();
  function extendedWater(row: number, column: number) {
    const index = row * width + column;
    const cached = waterGrid.get(index);
    if (cached !== undefined) return cached;
    const ownLevel = levelAt(index);
    if (ownLevel !== null) return ownLevel;
    let sum = 0;
    let weight = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const x = column + dx;
      const z = row + dz;
      if ((!dx && !dz) || x < 0 || z < 0 || x >= width || z >= width) continue;
      const level = levelAt(z * width + x);
      if (typeof level !== "number") continue;
      const part = 1 / (dx * dx + dz * dz);
      sum += level * part;
      weight += part;
    }
    const extended = weight ? sum / weight : null;
    waterGrid.set(index, extended);
    return extended;
  }
  const addTriangle = (a: number, b: number, c: number) => {
    const wet = levelAt(a) !== null || levelAt(b) !== null || levelAt(c) !== null;
    if (surface === "water" && !wet) return;
    let points = [a, b, c].map(index => {
      const column = index % width, row = Math.floor(index / width);
      const ground = terrain?.heights[index] ?? 0;
      const level = wet ? extendedWater(row, column)! : 0;
      return { x: (column / segments - 0.5) * size + (terrain ? 0 : settings.center.x), y: surface === "water" ? level : ground,
        z: (row / segments - 0.5) * size + (terrain ? 0 : settings.center.z), depth: wet ? level - ground : -1 };
    });
    if (points.every(point => point.x < settings.center.x - settings.radius) || points.every(point => point.x > settings.center.x + settings.radius)
      || points.every(point => point.z < settings.center.z - settings.radius) || points.every(point => point.z > settings.center.z + settings.radius)) return;
    // ACT: 地面与水面沿渲染的同一三角岸线互补裁切；水域保留4厘米深度，32边形限定单组活动区。
    if (wet) points = clipLifePolygon(points, point => surface === "water" ? point.depth - 0.04 : -point.depth - 0.005);
    points = clipLifeArea(points, settings);
    if (points.length < 3) return;
    appendLifePolygon(points, triangles);
  };
  for (let row = minZ; row < maxZ; row++) for (let column = minX; column < maxX; column++) {
    const a = row * width + column;
    const b = a + width;
    addTriangle(a, b, a + 1);
    addTriangle(b, b + 1, a + 1);
  }
  return triangles;
}

const navigationGeometryCache = new WeakMap<Object3D, { signature: string; triangles: Float64Array }>();
const movementColliderCache = new WeakMap<Object3D, { signature: string; body: CollisionBody }>();
export function invalidateLifeNavigationGeometry(model: Object3D) { navigationGeometryCache.delete(model); movementColliderCache.delete(model); }
export function isLifeBodyMovementClear(bounds: Box3, from: Vector3, to: Vector3, heading: number, models: readonly Object3D[]) {
  const matrix = new Matrix4().compose(from, new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), heading), new Vector3(1, 1, 1));
  const body = transformCollisionShape({ bounds, parts: [{ bounds, matrix: new Matrix4() }] }, matrix);
  const delta = to.clone().sub(from);
  const swept = body.bounds.clone().union(body.bounds.clone().translate(delta));
  for (const model of models) {
    model.updateWorldMatrix(true, true); model.updateMatrixWorld(true);
    const signature = JSON.stringify([model.matrixWorld.elements, model.children.map(child => child.uuid)]);
    let cached = movementColliderCache.get(model);
    if (!cached || cached.signature !== signature) {
      cached = { signature, body: transformCollisionShape(createCollisionShape(model), model.matrixWorld) };
      movementColliderCache.set(model, cached);
    }
    if (!swept.intersectsBox(cached.body.bounds)) continue;
    if (intersectsCollision(body, cached.body) || sweepCollision(body, cached.body, delta)) return false;
  }
  return true;
}
const obstacleBoxFaces = [0, 3, 2, 0, 2, 1, 4, 5, 6, 4, 6, 7, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2];

/** 把静态模型和盒体障碍裁进活动区，按块追加到 chunks（每个模型一块，直接引用它缓存的数组，不再拷贝进一张大表）。 */
function appendLifeObstacleGeometry(geometry: LifeNavigationGeometry, settings: SceneLife, ground: number[], chunks: ArrayLike<number>[], clearance: number, walkableSurfaces: boolean) {
  const walkable = new Box3();
  const point = new Vector3();
  for (let i = 0; i < ground.length; i += 3) walkable.expandByPoint(point.fromArray(ground, i));
  const extent = settings.radius * areaCosine - 1e-7;
  // 在地面已经限定完整栅格边界时，高过所有可行走面及净空的障碍不会接触角色。
  // 岛屿、小湖等仅覆盖部分边界时仍保留完整障碍，以保持既有 Navcat 栅格原点。
  const coversArea = walkable.min.x <= settings.center.x - extent && walkable.max.x >= settings.center.x + extent
    && walkable.min.z <= settings.center.z - extent && walkable.max.z >= settings.center.z + extent;
  const ceiling = !walkableSurfaces && coversArea ? walkable.max.y + clearance : Infinity;
  const area = new Box3(new Vector3(settings.center.x - settings.radius, -Infinity, settings.center.z - settings.radius), new Vector3(settings.center.x + settings.radius, ceiling, settings.center.z + settings.radius));
  const bounds = new Box3();
  const instanceMatrix = new Matrix4();
  function appendTriangle(triangle: LifeNavPoint[], output: number[], standable = false) {
    if (triangle.some(vertex => !Number.isFinite(vertex.x + vertex.y + vertex.z))) return;
    bounds.makeEmpty();
    for (const vertex of triangle) bounds.expandByPoint(point.set(vertex.x, vertex.y, vertex.z));
    if (!area.intersectsBox(bounds)) return;
    const [a, b, c] = triangle as [LifeNavPoint, LifeNavPoint, LifeNavPoint];
    // 真实模型踏面保留绕序，由坡度、净空和攀爬高度决定能否通行；盒体代理仍只作障碍。
    if (!standable && (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z) > 0) triangle = [a, c, b];
    appendLifePolygon(clipLifeArea(triangle, settings), output);
  }
  // 与 appendTriangle 逐项等价的数组版：整个三角形落在活动区内切圆里（绝大多数）时直接写出，只有压到活动区边界的才走裁切。
  const apothemSquared = (settings.radius * areaCosine) * (settings.radius * areaCosine);
  function appendWorldTriangle(world: Float64Array, a: number, b: number, c: number, output: number[], standable: boolean) {
    const ax = world[a]!, ay = world[a + 1]!, az = world[a + 2]!;
    let bx = world[b]!, by = world[b + 1]!, bz = world[b + 2]!;
    let cx = world[c]!, cy = world[c + 1]!, cz = world[c + 2]!;
    if (!Number.isFinite(ax + ay + az) || !Number.isFinite(bx + by + bz) || !Number.isFinite(cx + cy + cz)) return;
    if (!(Math.max(ax, bx, cx) >= area.min.x && Math.min(ax, bx, cx) <= area.max.x && Math.max(ay, by, cy) >= area.min.y && Math.min(ay, by, cy) <= area.max.y
      && Math.max(az, bz, cz) >= area.min.z && Math.min(az, bz, cz) <= area.max.z)) return;
    if (!standable && (bz - az) * (cx - ax) - (bx - ax) * (cz - az) > 0) { [bx, by, bz, cx, cy, cz] = [cx, cy, cz, bx, by, bz]; }
    const inside = (x: number, z: number) => (x - settings.center.x) ** 2 + (z - settings.center.z) ** 2 <= apothemSquared;
    if (inside(ax, az) && inside(bx, bz) && inside(cx, cz)) { output.push(ax, ay, az, bx, by, bz, cx, cy, cz); return; }
    appendLifePolygon(clipLifeArea([{ x: ax, y: ay, z: az, depth: 0 }, { x: bx, y: by, z: bz, depth: 0 }, { x: cx, y: cy, z: cz, depth: 0 }], settings), output);
  }
  for (const root of geometry.models) {
    root.updateWorldMatrix(true, true);
    if (!area.intersectsBox(new Box3().setFromObject(root))) continue;
    const signature = JSON.stringify([settings.center.x, settings.center.z, settings.radius, ceiling, walkableSurfaces, root.matrixWorld.elements]);
    let cached = navigationGeometryCache.get(root);
    if (!cached || cached.signature !== signature) {
      const output: number[] = [];
      root.traverseVisible(node => {
        if (!(node instanceof Mesh) || !node.geometry.getAttribute("position")) return;
        const mesh = node;
        const material = Array.isArray(node.material) ? node.material : [node.material];
        const total = node.geometry.index?.count ?? node.geometry.getAttribute("position").count;
        const ranges = Array.isArray(node.material) ? node.geometry.groups : [{ start: 0, count: total, materialIndex: 0 }];
        for (let instance = 0; instance < (node instanceof InstancedMesh ? node.count : 1); instance++) {
          const matrix = node.matrixWorld.clone();
          if (node instanceof InstancedMesh) { node.getMatrixAt(instance, instanceMatrix); matrix.multiply(instanceMatrix); }
          if (!mesh.morphTargetInfluences && !("isSkinnedMesh" in mesh)) {
            if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
            if (mesh.geometry.boundingBox && !area.intersectsBox(bounds.copy(mesh.geometry.boundingBox).applyMatrix4(matrix))) continue;
          }
          // 顶点只变换一次，存进平铺数组；逐三角形不再新建对象（整场十几万个三角形，原先这里占同步时间的大头）。
          const vertexCount = node.geometry.getAttribute("position").count;
          const world = new Float64Array(vertexCount * 3);
          const ready = new Uint8Array(vertexCount);
          const indexAttribute = node.geometry.index;
          const corners = [0, 0, 0];
          for (const range of ranges) {
            const surface = material[range.materialIndex ?? 0];
            if (!surface?.visible || surface.opacity <= 0) continue;
            const start = Math.ceil(Math.max(range.start, node.geometry.drawRange.start) / 3) * 3;
            const end = Math.min(total, range.start + range.count, node.geometry.drawRange.start + node.geometry.drawRange.count);
            for (let index = start; index + 2 < end; index += 3) {
              for (let corner = 0; corner < 3; corner++) {
                const vertex = indexAttribute ? indexAttribute.getX(index + corner) : index + corner;
                if (!ready[vertex]) {
                  mesh.getVertexPosition(vertex, point).applyMatrix4(matrix);
                  world[vertex * 3] = point.x; world[vertex * 3 + 1] = point.y; world[vertex * 3 + 2] = point.z;
                  ready[vertex] = 1;
                }
                corners[corner] = vertex * 3;
              }
              appendWorldTriangle(world, corners[0]!, corners[1]!, corners[2]!, output, walkableSurfaces);
            }
          }
        }
      });
      // 每个静态模型只保留最近活动区的裁切结果，尺寸不同的个体复用，不复制全场高模。
      cached = { signature, triangles: Float64Array.from(output) };
      navigationGeometryCache.set(root, cached);
    }
    if (cached.triangles.length) chunks.push(cached.triangles);
  }
  const boxes: number[] = [];
  for (const box of geometry.boxes) {
    if (!area.intersectsBox(box)) continue;
    const corners = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]].map(([x, y, z]) => ({ x: x ? box.max.x : box.min.x, y: y ? box.max.y : box.min.y, z: z ? box.max.z : box.min.z, depth: 0 }));
    for (let index = 0; index < obstacleBoxFaces.length; index += 3) appendTriangle(obstacleBoxFaces.slice(index, index + 3).map(corner => corners[corner]!), boxes);
  }
  if (boxes.length) chunks.push(boxes);
}

export function buildLifeNavMesh(document: SceneDocument, settings: SceneLife, geometry: LifeNavigationGeometry, surface: "ground" | "water" = "ground", profile: LifeNavigationProfile = { radius: 0.3, height: 1.8 }) {
  const ground = buildLifeTerrainGeometry(document, settings, surface);
  const matrix = new Matrix4();
  const rotation = new Quaternion();
  for (const object of surface === "ground" ? document.objects : []) {
    const navigation = object.navigation;
    if (!object.visible || !navigation) continue;
    rotation.setFromEuler(new Euler(object.rotation.x * Math.PI / 180, object.rotation.y * Math.PI / 180, object.rotation.z * Math.PI / 180));
    matrix.compose(new Vector3(object.position.x, object.position.y, object.position.z), rotation, new Vector3(object.scale.x, object.scale.y, object.scale.z));
    const points = navigation.points.map(point => new Vector3(point.x, point.y, point.z).applyMatrix4(matrix));
    const halfWidth = navigation.width * Math.min(object.scale.x, object.scale.z) / 2;
    for (let index = 1; index < points.length; index++) {
      const start = points[index - 1]!;
      const end = points[index]!;
      const direction = end.clone().sub(start);
      const length = Math.hypot(direction.x, direction.z);
      if (length < 0.01) continue;
      const side = new Vector3(direction.z / length * halfWidth, 0, -direction.x / length * halfWidth);
      const strip = [start.clone().add(side), start.clone().sub(side), end.clone().sub(side), end.clone().add(side)]
        .map(point => ({ x: point.x, y: point.y + 0.015, z: point.z, depth: 0 }));
      appendLifePolygon(clipLifeArea(strip, settings), ground);
    }
  }
  if (surface === "water" && !ground.length) return undefined;
  // ACT: 精度由通行净空决定，不随世界半径变粗；分块栅格避免单张巨型高度场。
  const cellSize = 0.1;
  const cellHeight = 0.05;
  const walkableRadiusVoxels = Math.ceil(profile.radius / cellSize - 1e-8);
  const climb = Math.min(0.45, profile.height * 0.25);
  const chunks: ArrayLike<number>[] = ground.length ? [ground] : [];
  appendLifeObstacleGeometry(geometry, settings, ground, chunks, profile.height + climb + 3 * cellHeight, surface === "ground");
  if (!chunks.length) return undefined;
  const navMesh = generateCachedNavMesh(chunks, {
    cellSize, cellHeight, tileSizeVoxels: 128, tileSizeWorld: cellSize * 128,
    walkableRadiusWorld: profile.radius, walkableRadiusVoxels,
    walkableHeightWorld: profile.height, walkableHeightVoxels: Math.ceil(profile.height / cellHeight - 1e-8),
    walkableClimbWorld: climb, walkableClimbVoxels: Math.floor(climb / cellHeight + 1e-8),
    walkableSlopeAngleDegrees: 42, borderSize: walkableRadiusVoxels + 3, minRegionArea: 4, mergeRegionArea: 20,
    maxSimplificationError: 0.5, maxEdgeLength: 48, maxVerticesPerPoly: 6,
    detailSampleDistance: cellSize * 6, detailSampleMaxError: cellHeight,
  });
  return navMesh.nodes.some(node => node.allocated) ? navMesh : undefined;
}
