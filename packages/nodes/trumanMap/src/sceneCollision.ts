import { Box3, InstancedMesh, Matrix3, Matrix4, Mesh, Vector3 } from "three";
import type { BufferGeometry, Object3D } from "three";
import { OBB } from "three/addons/math/OBB.js";

export type CollisionShape = { bounds: Box3; parts: { bounds: Box3; matrix: Matrix4 }[] };
export type CollisionPart = { bounds: Box3; obb: OBB; axes: [Vector3, Vector3, Vector3] };
export type CollisionBody = { bounds: Box3; parts: CollisionPart[] };

type DrawRange = { start: number; end: number };

function visitCollisionMeshes(root: Object3D, visitMesh: (mesh: Mesh, vertices: Set<number>, ranges: DrawRange[]) => void) {
  function visit(object: Object3D) {
    // 预放置根容器暂时隐藏，不应丢失几何；后代的隐藏状态仍需遵守。
    if (object !== root && !object.visible) return;
    if (object instanceof Mesh) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const position = object.geometry.getAttribute("position");
      if (position && materials.some(material => material.visible && material.opacity > 0)) {
        const geometry: BufferGeometry = object.geometry;
        const total = geometry.index?.count ?? position.count;
        const ranges = Array.isArray(object.material) ? geometry.groups.filter(group => {
          const material = materials[group.materialIndex ?? 0];
          return material?.visible && material.opacity > 0;
        }) : [{ start: 0, count: total }];
        const vertices = new Set<number>();
        const drawn: DrawRange[] = [];
        for (const range of ranges) {
          const start = Math.max(0, range.start, geometry.drawRange.start);
          const end = Math.min(total, range.start + range.count, geometry.drawRange.start + geometry.drawRange.count);
          if (end > start) drawn.push({ start, end });
          for (let index = start; index < end; index++) vertices.add(geometry.index?.getX(index) ?? index);
        }
        if (vertices.size) visitMesh(object, vertices, drawn);
      }
    }
    for (const child of object.children) visit(child);
  }
  visit(root);
}

// ACT: 程序化建筑把整组同色构件并进一张网格（三面墙、满地碎石常在同一张里），
// 整张网格一个包围盒会把整间屋子当成实心，人站在屋里就“撞墙”。这里按真实连通拆开：
// 焊接后的每个连通块单独成盒；空心、L/U 形的连通块继续按三角形对半切到盒子贴合；
// 再把挨得紧、几乎填满的小盒（地砖、瓦、墙段）合回一个，部件数量不至于暴涨。
const decompositionCache = new WeakMap<BufferGeometry, Map<string, Box3[] | null>>();
const smallPart = 0.3;
const solidFill = 0.6;
const packedFill = 0.7;
function boxVolume(box: Box3, floor = 0) {
  return Math.max(floor, box.max.x - box.min.x) * Math.max(floor, box.max.y - box.min.y) * Math.max(floor, box.max.z - box.min.z);
}
function longestAxis(box: Box3) {
  const x = box.max.x - box.min.x, y = box.max.y - box.min.y, z = box.max.z - box.min.z;
  return x >= y && x >= z ? 0 : y >= z ? 1 : 2;
}
// 同一素材每次载入都是新的几何对象（预演、每个摆放的物件各载一份），再按内容哈希复用拆盒结果。
const contentCache = new Map<string, Box3[] | null>();
function hashArray(array: ArrayLike<number> & { buffer: ArrayBufferLike; byteOffset: number; byteLength: number }, seed: [number, number]) {
  let [first, second] = seed;
  const words = array.byteLength % 4 === 0 ? new Uint32Array(array.buffer, array.byteOffset, array.byteLength / 4) : Uint32Array.from(array as ArrayLike<number>);
  for (let index = 0; index < words.length; index++) {
    const word = words[index]!;
    first = Math.imul(first ^ word, 16777619);
    second = Math.imul(second + word | 0, 2246822519) ^ (second >>> 13);
  }
  return [first >>> 0, second >>> 0] as [number, number];
}
function geometryContentKey(geometry: BufferGeometry, ranges: DrawRange[]) {
  const position = geometry.getAttribute("position");
  const source = "isInterleavedBufferAttribute" in position && position.isInterleavedBufferAttribute ? position.data.array : position.array;
  let hash = hashArray(source as Float32Array, [2166136261, 0x9e3779b9]);
  if (geometry.index) hash = hashArray(geometry.index.array as Uint32Array, hash);
  const offset = "offset" in position ? position.offset : 0;
  return `${position.count}/${position.itemSize}/${offset}/${geometry.index?.count ?? -1}/${hash[0]}/${hash[1]}/${JSON.stringify(ranges)}`;
}
function decomposeGeometry(geometry: BufferGeometry, ranges: DrawRange[]): Box3[] | null {
  const key = JSON.stringify(ranges);
  let cached = decompositionCache.get(geometry);
  if (cached?.has(key)) return cached.get(key)!;
  const content = geometryContentKey(geometry, ranges);
  let result = contentCache.get(content);
  if (result === undefined) {
    result = computeDecomposition(geometry, ranges);
    if (contentCache.size >= 2048) contentCache.delete(contentCache.keys().next().value!);
    contentCache.set(content, result);
  }
  if (!cached) decompositionCache.set(geometry, cached = new Map());
  cached.set(key, result);
  return result;
}
function computeDecomposition(geometry: BufferGeometry, ranges: DrawRange[]): Box3[] | null {
  const position = geometry.getAttribute("position");
  const index = geometry.index;
  const corners: number[] = [];
  for (const range of ranges) for (let cursor = Math.ceil(range.start / 3) * 3; cursor + 2 < range.end; cursor += 3) {
    const a = index?.getX(cursor) ?? cursor, b = index?.getX(cursor + 1) ?? cursor + 1, c = index?.getX(cursor + 2) ?? cursor + 2;
    if (Number.isFinite(position.getX(a) + position.getY(a) + position.getZ(a) + position.getX(b) + position.getY(b) + position.getZ(b) + position.getX(c) + position.getY(c) + position.getZ(c))) corners.push(a, b, c);
  }
  const triangleCount = corners.length / 3;
  if (triangleCount < 2) return null;
  const whole = new Box3();
  const point = new Vector3();
  for (const vertex of corners) whole.expandByPoint(point.fromBufferAttribute(position, vertex));
  // 小件：整体一个盒已经贴合。三角形少也要拆：两块窗外景片分在两面墙上，合起来的盒会横穿整间屋。
  if (Math.max(whole.max.x - whole.min.x, whole.max.y - whole.min.y, whole.max.z - whole.min.z) <= smallPart) return null;
  // 按位置焊接顶点（构件每个面各有一套顶点），再按三角形连通分块。
  // 毫米量化；模型限定在 1000 米内，x、y 合成一个整数键（42 位），z 作第二层键。
  const welded = new Map<number, Map<number, number>>();
  let weldCount = 0;
  const representative = new Int32Array(position.count).fill(-1);
  const weld = (vertex: number) => {
    let value = representative[vertex]!;
    if (value >= 0) return value;
    const outer = (Math.round(position.getX(vertex) * 1000) + 1048576) * 2097152 + Math.round(position.getY(vertex) * 1000) + 1048576;
    const inner = Math.round(position.getZ(vertex) * 1000);
    let column = welded.get(outer);
    if (!column) welded.set(outer, column = new Map());
    const known = column.get(inner);
    if (known === undefined) column.set(inner, value = weldCount++); else value = known;
    representative[vertex] = value;
    return value;
  };
  const parent: number[] = [];
  const find = (value: number) => { while (parent[value] !== value) value = parent[value] = parent[parent[value]!]!; return value; };
  const welds = corners.map(weld);
  for (let item = 0; item < weldCount; item++) parent.push(item);
  for (let triangle = 0; triangle < triangleCount; triangle++) {
    const a = find(welds[triangle * 3]!);
    for (let corner = 1; corner < 3; corner++) { const b = find(welds[triangle * 3 + corner]!); if (a !== b) parent[b] = a; }
  }
  const components = new Map<number, number[]>();
  for (let triangle = 0; triangle < triangleCount; triangle++) {
    const root = find(welds[triangle * 3]!);
    const list = components.get(root);
    if (list) list.push(triangle); else components.set(root, [triangle]);
  }
  const a = new Vector3(), b = new Vector3(), c = new Vector3();
  const load = (triangle: number) => { a.fromBufferAttribute(position, corners[triangle * 3]!); b.fromBufferAttribute(position, corners[triangle * 3 + 1]!); c.fromBufferAttribute(position, corners[triangle * 3 + 2]!); };
  // 薄盒是否真被三角形铺满：沿最薄方向投影的三角形面积 / 两倍盒面（封闭板≈1，单面片≈0.5，绕墙一圈的细线脚≈0）。
  const coverage = (triangles: number[], box: Box3) => {
    const size = [box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z];
    const thin = size[0]! <= size[1]! && size[0]! <= size[2]! ? 0 : size[1]! <= size[2]! ? 1 : 2;
    const face = size.reduce((product, value, axis) => axis === thin ? product : product * value, 1);
    if (face <= 1e-9) return 1;
    let area = 0;
    for (const triangle of triangles) { load(triangle); b.sub(a); c.sub(a); area += Math.abs(b.cross(c).getComponent(thin)) / 2; }
    return area / (2 * face);
  };
  const triangleBounds = (triangles: number[]) => {
    const box = new Box3();
    for (const triangle of triangles) for (let corner = 0; corner < 3; corner++) box.expandByPoint(point.fromBufferAttribute(position, corners[triangle * 3 + corner]!));
    return box;
  };
  const leaves: Box3[] = [];
  const split = (triangles: number[], depth: number) => {
    const box = triangleBounds(triangles);
    // 空心块的子集不再是封闭体：只有薄片（墙段、板）、小件或单个四边形才算贴合，否则继续切（L 形墙角也要切开）。
    const size = [box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z].sort((left, right) => left - right);
    if (triangles.length <= 2 || depth >= 32 || size[2]! <= smallPart || size[0]! <= smallPart && coverage(triangles, box) >= 0.45) { leaves.push(box); return; }
    // 从中间切一刀分三组：整片在左、整片在右、横跨切面。横跨的长三角形（背墙整面）自成一组，
    // 它们本身就是一块薄板；按重心对半分会把背墙的长三角形分到两边，两半的盒仍横穿整间屋。
    const extents = [box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z];
    for (const axis of [0, 1, 2].sort((left, right) => extents[right]! - extents[left]!)) {
      const middle = (box.min.getComponent(axis) + box.max.getComponent(axis)) / 2;
      const coordinate = (vertex: number) => axis === 0 ? position.getX(vertex) : axis === 1 ? position.getY(vertex) : position.getZ(vertex);
      const groups: [number[], number[], number[]] = [[], [], []];
      for (const triangle of triangles) {
        const values = [coordinate(corners[triangle * 3]!), coordinate(corners[triangle * 3 + 1]!), coordinate(corners[triangle * 3 + 2]!)];
        groups[Math.max(...values) <= middle ? 0 : Math.min(...values) >= middle ? 1 : 2].push(triangle);
      }
      if (groups.some(group => group.length === triangles.length)) continue;
      for (const group of groups) if (group.length) split(group, depth + 1);
      return;
    }
    leaves.push(box);
  };
  for (const triangles of components.values()) {
    const box = triangleBounds(triangles);
    let volume = 0;
    for (const triangle of triangles) { load(triangle); volume += a.dot(b.cross(c)) / 6; }
    // 封闭且基本实心的块（立方体、柱、车身壳）保留整盒，内部仍算实体；空心或拐弯的块继续切。
    // 只认外法线的正体积：法线朝里的大盒（影棚四壁从里面看）是空心房间，不是实心块。
    // 体积只对封闭网格有意义（每条边被偶数个三角形共用，贴在一起的方块共边算 4 个）；污渍、土堆这类敞口面片的“体积”随原点乱跳。
    let solid = volume >= solidFill * boxVolume(box, 0.01);
    if (solid) {
      const edges = new Map<string, number>();
      for (const triangle of triangles) for (let corner = 0; corner < 3; corner++) {
        const from = welds[triangle * 3 + corner]!, to = welds[triangle * 3 + (corner + 1) % 3]!;
        const edge = from < to ? `${from},${to}` : `${to},${from}`;
        edges.set(edge, (edges.get(edge) ?? 0) + 1);
      }
      for (const count of edges.values()) if (count % 2) { solid = false; break; }
    }
    if (solid || triangles.length <= 12 && volume >= -1e-9 && coverage(triangles, box) >= 0.45) leaves.push(box);
    else split(triangles, 0);
  }
  // 自顶向下合并：一组小盒加起来几乎填满它们的总包围盒时合成一个。
  const merged: Box3[] = [];
  const thickness = 0.05;
  const merge = (boxes: Box3[]) => {
    const union = new Box3();
    let filled = 0;
    for (const box of boxes) { union.union(box); filled += boxVolume(box, thickness); }
    if (boxes.length === 1 || filled >= packedFill * boxVolume(union, thickness)) { merged.push(union); return; }
    const axis = longestAxis(union);
    const center = (box: Box3) => box.min.getComponent(axis) + box.max.getComponent(axis);
    const sorted = [...boxes].sort((left, right) => center(left) - center(right));
    const half = sorted.length >> 1;
    merge(sorted.slice(0, half));
    merge(sorted.slice(half));
  };
  merge(leaves);
  return merged.length > 1 ? merged : null;
}

// ACT: 按可见 Mesh 保留部件间空隙；合并网格按连通块拆盒（见 decomposeGeometry），蒙皮和变形网格仍取整体盒。
// 几何/骨骼姿态变化时需重建 shape，普通平移、旋转、缩放只更新 body。
export function createCollisionShape(root: Object3D): CollisionShape {
  // 蒙皮的绑定逆矩阵由updateMatrixWorld更新，测量须沿用渲染时的更新顺序。
  root.updateWorldMatrix(true, false);
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const shape: CollisionShape = { bounds: new Box3(), parts: [] };
  const point = new Vector3();
  const instanceMatrix = new Matrix4();
  visitCollisionMeshes(root, (mesh, vertices, ranges) => {
    const relative = new Matrix4().multiplyMatrices(inverse, mesh.matrixWorld);
    const count = mesh instanceof InstancedMesh ? mesh.count : 1;
    const deforming = "isSkinnedMesh" in mesh || !!mesh.morphTargetInfluences?.length;
    const pieces = deforming ? null : decomposeGeometry(mesh.geometry, ranges);
    const geometryBounds = new Box3();
    for (let instance = 0; instance < count; instance++) {
      const matrix = relative.clone();
      if (mesh instanceof InstancedMesh) {
        mesh.getMatrixAt(instance, instanceMatrix);
        matrix.multiply(instanceMatrix);
      }
      for (const index of vertices) {
        mesh.getVertexPosition(index, point);
        if (!Number.isFinite(point.x + point.y + point.z)) continue;
        if (!instance) geometryBounds.expandByPoint(point);
        shape.bounds.expandByPoint(point.applyMatrix4(matrix));
      }
      if (pieces) for (const piece of pieces) shape.parts.push({ bounds: piece.clone(), matrix });
      else if (!geometryBounds.isEmpty()) shape.parts.push({ bounds: geometryBounds.clone(), matrix });
    }
  });
  return shape;
}

export function measureCollisionBounds(root: Object3D, target: Box3) {
  root.updateWorldMatrix(true, false);
  root.updateMatrixWorld(true);
  target.makeEmpty();
  const point = new Vector3();
  const matrix = new Matrix4();
  const instanceMatrix = new Matrix4();
  visitCollisionMeshes(root, (mesh, vertices) => {
    const count = mesh instanceof InstancedMesh ? mesh.count : 1;
    for (let instance = 0; instance < count; instance++) {
      matrix.copy(mesh.matrixWorld);
      if (mesh instanceof InstancedMesh) {
        mesh.getMatrixAt(instance, instanceMatrix);
        matrix.multiply(instanceMatrix);
      }
      for (const index of vertices) {
        mesh.getVertexPosition(index, point);
        if (Number.isFinite(point.x + point.y + point.z)) target.expandByPoint(point.applyMatrix4(matrix));
      }
    }
  });
  return target;
}

export function transformCollisionShape(shape: CollisionShape, matrix: Matrix4): CollisionBody {
  const body: CollisionBody = { bounds: new Box3(), parts: [] };
  // 同一网格拆出的部件共用一个矩阵：正交轴和各轴上的投影系数每个矩阵只算一次，部件只做一次中心变换和九次乘加
  // （等价于原先逐部件投影八角；拆盒后部件数是原来的几倍，逐角计算占了载入大头）。
  type Frame = { transform: Matrix4; axes: [Vector3, Vector3, Vector3]; rotation: Matrix3; world: number[]; projected: number[] };
  const frames = new Map<Matrix4, Frame>();
  const frameFor = (local: Matrix4) => {
    let frame = frames.get(local);
    if (frame) return frame;
    const transform = new Matrix4().multiplyMatrices(matrix, local);
    const elements = transform.elements;
    const x = new Vector3(elements[0], elements[1], elements[2]);
    const y = new Vector3(elements[4], elements[5], elements[6]);
    if (x.lengthSq() < 1e-16) x.set(1, 0, 0);
    else x.normalize();
    y.addScaledVector(x, -y.dot(x));
    if (y.lengthSq() < 1e-16) y.set(Math.abs(x.y) < 0.9 ? 0 : 1, Math.abs(x.y) < 0.9 ? 1 : 0, 0).addScaledVector(x, -y.dot(x));
    y.normalize();
    const z = new Vector3().crossVectors(x, y).normalize();
    const axes: [Vector3, Vector3, Vector3] = [x, y, z];
    const columns = [0, 1, 2].map(column => new Vector3(elements[column * 4], elements[column * 4 + 1], elements[column * 4 + 2]));
    // world[i*3+j] = |M_ij|（世界包围盒半宽），projected[k*3+j] = |轴k·第j列|（OBB 半宽）。
    const world = [0, 1, 2].flatMap(row => columns.map(column => Math.abs(column.getComponent(row))));
    const projected = axes.flatMap(axis => columns.map(column => Math.abs(axis.dot(column))));
    frame = { transform, axes, rotation: new Matrix3().set(x.x, y.x, z.x, x.y, y.y, z.y, x.z, y.z, z.z), world, projected };
    frames.set(local, frame);
    return frame;
  };
  const center = new Vector3();
  for (const part of shape.parts) {
    // ACT: 非均匀父缩放与子旋转可产生 shear，先正交化，再按正交轴投影，避免把斜轴误当 OBB。
    const frame = frameFor(part.matrix);
    const hx = (part.bounds.max.x - part.bounds.min.x) / 2, hy = (part.bounds.max.y - part.bounds.min.y) / 2, hz = (part.bounds.max.z - part.bounds.min.z) / 2;
    part.bounds.getCenter(center).applyMatrix4(frame.transform);
    const { world, projected } = frame;
    const bounds = new Box3().setFromCenterAndSize(center, new Vector3(
      2 * (world[0]! * hx + world[1]! * hy + world[2]! * hz), 2 * (world[3]! * hx + world[4]! * hy + world[5]! * hz), 2 * (world[6]! * hx + world[7]! * hy + world[8]! * hz)));
    // 支撑面接触不算穿透；缩小只用于窄相，宽相边界始终覆盖原几何。
    const halfSize = new Vector3(
      Math.max(0.00001, projected[0]! * hx + projected[1]! * hy + projected[2]! * hz - 0.001),
      Math.max(0.00001, projected[3]! * hx + projected[4]! * hy + projected[5]! * hz - 0.001),
      Math.max(0.00001, projected[6]! * hx + projected[7]! * hy + projected[8]! * hz - 0.001));
    const obb = new OBB(center.clone(), halfSize, frame.rotation);
    body.parts.push({ bounds, obb, axes: frame.axes });
    body.bounds.union(bounds);
  }
  return body;
}

// 拆盒后大建筑有上千个部件：部件多的物体按需建一棵包围盒树，碰撞只看查询盒附近的部件。
type PartTree = { bounds: Box3; parts?: CollisionPart[]; left?: PartTree; right?: PartTree };
const partTrees = new WeakMap<CollisionBody, PartTree>();
function buildPartTree(parts: CollisionPart[]): PartTree {
  const bounds = new Box3();
  for (const part of parts) bounds.union(part.bounds);
  if (parts.length <= 8) return { bounds, parts };
  const axis = longestAxis(bounds);
  const center = (part: CollisionPart) => part.bounds.min.getComponent(axis) + part.bounds.max.getComponent(axis);
  const sorted = [...parts].sort((left, right) => center(left) - center(right));
  const half = sorted.length >> 1;
  return { bounds, left: buildPartTree(sorted.slice(0, half)), right: buildPartTree(sorted.slice(half)) };
}
function nearParts(body: CollisionBody, box: Box3): CollisionPart[] {
  if (body.parts.length <= 16) return body.parts;
  let tree = partTrees.get(body);
  if (!tree) partTrees.set(body, tree = buildPartTree(body.parts));
  const found: CollisionPart[] = [];
  const visit = (node: PartTree) => {
    if (!node.bounds.intersectsBox(box)) return;
    if (node.parts) { for (const part of node.parts) if (part.bounds.intersectsBox(box)) found.push(part); return; }
    visit(node.left!); visit(node.right!);
  };
  visit(tree);
  return found;
}

export function intersectsCollision(a: CollisionBody, b: CollisionBody) {
  if (!a.bounds.intersectsBox(b.bounds)) return false;
  const near = nearParts(b, a.bounds);
  if (!near.length) return false;
  return nearParts(a, b.bounds).some(left => near.some(right => left.bounds.intersectsBox(right.bounds) && left.obb.intersectsOBB(right.obb)));
}

export function translateCollisionBody(body: CollisionBody, offset: Vector3) {
  partTrees.delete(body);
  body.bounds.translate(offset);
  for (const part of body.parts) {
    part.bounds.translate(offset);
    part.obb.center.add(offset);
  }
}

function collisionInterval(a: CollisionPart, b: CollisionPart, delta: Vector3) {
  const offset = a.obb.center.clone().sub(b.obb.center);
  const axes = [...a.axes, ...b.axes];
  for (const x of a.axes) for (const y of b.axes) {
    const axis = new Vector3().crossVectors(x, y);
    if (axis.lengthSq() > 1e-10) axes.push(axis.normalize());
  }
  const leftSize = a.obb.halfSize.toArray();
  const rightSize = b.obb.halfSize.toArray();
  let entry = -Infinity;
  let exit = Infinity;
  let depth = Infinity;
  let overlapping = true;
  let normal = new Vector3();
  let escape = new Vector3();
  for (const axis of axes) {
    const extent = a.axes.reduce((sum, basis, index) => sum + leftSize[index]! * Math.abs(axis.dot(basis)), 0)
      + b.axes.reduce((sum, basis, index) => sum + rightSize[index]! * Math.abs(axis.dot(basis)), 0);
    const distance = offset.dot(axis);
    const speed = delta.dot(axis);
    const penetration = extent - Math.abs(distance);
    if (penetration <= 1e-7) overlapping = false;
    if (penetration < depth) {
      depth = penetration;
      escape = axis.clone().multiplyScalar(Math.abs(distance) > 1e-8 ? Math.sign(distance) : Math.sign(speed) || 1);
    }
    if (Math.abs(speed) < 1e-10) {
      if (penetration < -1e-7) return;
      continue;
    }
    const first = (-extent - distance) / speed;
    const second = (extent - distance) / speed;
    const near = Math.min(first, second);
    if (near > entry) {
      entry = near;
      normal = axis.clone().multiplyScalar(speed > 0 ? -1 : 1);
    }
    exit = Math.min(exit, Math.max(first, second));
    if (entry > exit + 1e-9) return;
  }
  return { entry, exit, overlapping, normal, escape };
}

function sweptBounds(bounds: Box3, delta: Vector3) {
  return bounds.clone().union(bounds.clone().translate(delta));
}

export function sweepCollision(a: CollisionBody, b: CollisionBody, delta: Vector3, allowEscape = false): { time: number; normal: Vector3 } | undefined {
  const sweep = sweptBounds(a.bounds, delta);
  if (!sweep.intersectsBox(b.bounds)) return;
  const near = nearParts(b, sweep);
  if (!near.length) return;
  let result: { time: number; normal: Vector3 } | undefined;
  for (const left of a.parts) {
    const swept = sweptBounds(left.bounds, delta);
    if (!swept.intersectsBox(b.bounds)) continue;
    for (const right of near) {
      if (!swept.intersectsBox(right.bounds)) continue;
      const interval = collisionInterval(left, right, delta);
      if (!interval) continue;
      if (interval.overlapping) {
        if (allowEscape && delta.dot(interval.escape) >= -1e-8) continue;
        return { time: 0, normal: interval.escape };
      }
      if (interval.exit < 1e-8 || interval.entry < -1e-7 || interval.entry > 1 || delta.dot(interval.normal) >= -1e-10) continue;
      if (!result || interval.entry < result.time) result = { time: Math.max(0, interval.entry), normal: interval.normal };
    }
  }
  return result;
}

/**
 * 把a竖直抬出b需要多高。给了center（a重心的XZ）时只算重心正下方的b部件：
 * 重心不在上面的部件撑不住a（真实世界里会滑下去），比如房子挨着另一栋房的墙，不该被顶上屋顶。
 */
export function getCollisionLift(a: CollisionBody, b: CollisionBody, center?: { x: number; z: number }) {
  if (!a.bounds.intersectsBox(b.bounds)) return 0;
  const up = new Vector3(0, 1, 0);
  const intervals: { entry: number; exit: number; overlapping: boolean }[] = [];
  let overlapping = false;
  // 抬升要看 a 正上方整列里 b 的部件（抬起来会碰到的也算）。
  const column = a.bounds.clone();
  column.max.y = Infinity;
  const near = nearParts(b, column);
  for (const left of a.parts) for (const right of near) {
    if (left.bounds.max.x < right.bounds.min.x || left.bounds.min.x > right.bounds.max.x || left.bounds.max.z < right.bounds.min.z || left.bounds.min.z > right.bounds.max.z) continue;
    if (center && (center.x < right.bounds.min.x - 0.02 || center.x > right.bounds.max.x + 0.02 || center.z < right.bounds.min.z - 0.02 || center.z > right.bounds.max.z + 0.02)) continue;
    const interval = collisionInterval(left, right, up);
    if (!interval || interval.exit <= 0 || !Number.isFinite(interval.exit)) continue;
    intervals.push(interval);
    overlapping ||= interval.overlapping;
  }
  if (!overlapping) return 0;
  intervals.sort((left, right) => left.entry - right.entry);
  let lift = 0;
  for (const interval of intervals) {
    if (interval.entry > lift + 1e-7) break;
    lift = Math.max(lift, interval.exit + 0.0001);
  }
  return lift;
}

export function createCollisionIndex(cellSize = 8) {
  if (!Number.isFinite(cellSize) || cellSize <= 0) throw new Error("碰撞空间网格尺寸必须大于零");
  const bodies = new Map<string, CollisionBody>();
  const buckets = new Map<string, Set<string>>();
  const memberships = new Map<string, string[]>();
  const large = new Set<string>();
  function cells(bounds: Box3): string[] | undefined {
    if (bounds.isEmpty()) return [];
    const minX = Math.floor(bounds.min.x / cellSize);
    const maxX = Math.floor(bounds.max.x / cellSize);
    const minZ = Math.floor(bounds.min.z / cellSize);
    const maxZ = Math.floor(bounds.max.z / cellSize);
    // ACT: 大地板等不展开到成千网格；大查询退回已有物件的 AABB 宽相。
    if (!Number.isFinite(minX + maxX + minZ + maxZ) || (maxX - minX + 1) * (maxZ - minZ + 1) > 256) return;
    const keys: string[] = [];
    for (let x = minX; x <= maxX; x++) for (let z = minZ; z <= maxZ; z++) keys.push(`${x},${z}`);
    return keys;
  }
  function remove(id: string) {
    for (const key of memberships.get(id) ?? []) {
      const bucket = buckets.get(key);
      bucket?.delete(id);
      if (!bucket?.size) buckets.delete(key);
    }
    memberships.delete(id);
    large.delete(id);
    bodies.delete(id);
  }
  function set(id: string, body: CollisionBody) {
    if (bodies.get(id) === body) return;
    remove(id);
    bodies.set(id, body);
    const keys = cells(body.bounds);
    if (!keys) { large.add(id); return; }
    memberships.set(id, keys);
    for (const key of keys) {
      let bucket = buckets.get(key);
      if (!bucket) { bucket = new Set(); buckets.set(key, bucket); }
      bucket.add(id);
    }
  }
  function query(bounds: Box3) {
    const keys = cells(bounds);
    const ids = keys ? new Set(large) : new Set(bodies.keys());
    if (keys) for (const key of keys) for (const id of buckets.get(key) ?? []) ids.add(id);
    const result = new Map<string, CollisionBody>();
    for (const id of ids) {
      const body = bodies.get(id)!;
      if (bounds.intersectsBox(body.bounds)) result.set(id, body);
    }
    return result;
  }
  function clear() { bodies.clear(); buckets.clear(); memberships.clear(); large.clear(); }
  return { set, remove, query, clear };
}
