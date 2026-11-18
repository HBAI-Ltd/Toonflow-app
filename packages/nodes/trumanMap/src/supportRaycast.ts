import { BufferAttribute, BufferGeometry, Matrix4, Mesh, Vector3 } from "three";
import type { Intersection, Object3D, Raycaster } from "three";

// ACT: 短射线（脚下支撑面探测，全长约0.3米）对大网格的求交加速。three 的 Mesh.raycast 没有空间索引，射线穿过网格包围盒就逐三角形全算一遍，
// 人走到整面墙、整片铺装这类上千三角形的部件旁边时每次都要全扫。这里按几何体缓存一张局部坐标的均匀网格，只把射线线段碰到的格子里的三角形
// 交给 three 自己的求交代码（借一个只带这些三角形索引的临时网格），命中结果、先后顺序与 Raycaster.intersectObjects(objects, true) 完全一样。

type TriangleGrid = { signature: string; min: Vector3; cell: Vector3; size: [number, number, number]; starts: Uint32Array; triangles: Uint32Array };
const grids = new WeakMap<BufferGeometry, TriangleGrid | null>();
const minimumTriangles = 96;
const maximumEntries = 4_000_000;

const inverse = new Matrix4();
const from = new Vector3();
const to = new Vector3();
const scratchGeometry = new BufferGeometry();
let scratchIndices = new Uint32Array(3072);
let scratchIndex = new BufferAttribute(scratchIndices, 1);
scratchGeometry.setIndex(scratchIndex);
const scratchMesh = new Mesh(scratchGeometry);
scratchMesh.matrixAutoUpdate = false;
let candidates = new Uint32Array(1024);

function triangleGrid(geometry: BufferGeometry) {
  const position = geometry.getAttribute("position");
  const index = geometry.index;
  const total = index ? index.count : position.count;
  const signature = `${"version" in position ? position.version : position.data.version}:${index?.version ?? -1}:${total}`;
  const cached = grids.get(geometry);
  if (cached !== undefined && (cached === null || cached.signature === signature)) return cached ?? undefined;
  const count = Math.floor(total / 3);
  const corner = (triangle: number, vertex: number) => index ? index.getX(triangle * 3 + vertex) : triangle * 3 + vertex;
  const low = new Vector3(Infinity, Infinity, Infinity), high = new Vector3(-Infinity, -Infinity, -Infinity);
  // 每个三角形的局部包围盒：6个数。
  const boxes = new Float64Array(count * 6);
  let finite = true;
  for (let triangle = 0; triangle < count; triangle++) {
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (let vertex = 0; vertex < 3; vertex++) {
      const at = corner(triangle, vertex);
      const x = position.getX(at), y = position.getY(at), z = position.getZ(at);
      if (!Number.isFinite(x + y + z)) finite = false;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
    }
    boxes.set([x0, y0, z0, x1, y1, z1], triangle * 6);
    if (x0 < low.x) low.x = x0; if (y0 < low.y) low.y = y0; if (z0 < low.z) low.z = z0;
    if (x1 > high.x) high.x = x1; if (y1 > high.y) high.y = y1; if (z1 > high.z) high.z = z1;
  }
  let grid: TriangleGrid | null = null;
  if (finite && count >= minimumTriangles) {
    const extent = new Vector3().subVectors(high, low);
    const longest = Math.max(extent.x, extent.y, extent.z, 1e-6);
    const step = longest / Math.min(32, Math.max(4, Math.ceil(Math.cbrt(count) * 2)));
    const size: [number, number, number] = [Math.max(1, Math.min(32, Math.ceil(extent.x / step))), Math.max(1, Math.min(32, Math.ceil(extent.y / step))), Math.max(1, Math.min(32, Math.ceil(extent.z / step)))];
    const cell = new Vector3(Math.max(extent.x / size[0], 1e-9), Math.max(extent.y / size[1], 1e-9), Math.max(extent.z / size[2], 1e-9));
    const range = (value: number, origin: number, width: number, cells: number) => Math.max(0, Math.min(cells - 1, Math.floor((value - origin) / width)));
    const starts = new Uint32Array(size[0] * size[1] * size[2] + 1);
    const visit = (triangle: number, each: (cellIndex: number) => void) => {
      const at = triangle * 6;
      const x0 = range(boxes[at]!, low.x, cell.x, size[0]), x1 = range(boxes[at + 3]!, low.x, cell.x, size[0]);
      const y0 = range(boxes[at + 1]!, low.y, cell.y, size[1]), y1 = range(boxes[at + 4]!, low.y, cell.y, size[1]);
      const z0 = range(boxes[at + 2]!, low.z, cell.z, size[2]), z1 = range(boxes[at + 5]!, low.z, cell.z, size[2]);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) each((x * size[1] + y) * size[2] + z);
    };
    let entries = 0;
    for (let triangle = 0; triangle < count && entries <= maximumEntries; triangle++) visit(triangle, cellIndex => { starts[cellIndex + 1]!++; entries++; });
    if (entries <= maximumEntries) {
      for (let cellIndex = 0; cellIndex < starts.length - 1; cellIndex++) starts[cellIndex + 1]! += starts[cellIndex]!;
      const fill = starts.slice(0, -1);
      const triangles = new Uint32Array(entries);
      // 按三角形序号递增填入，每个格子里的列表天然有序。
      for (let triangle = 0; triangle < count; triangle++) visit(triangle, cellIndex => { triangles[fill[cellIndex]!++] = triangle; });
      grid = { signature, min: low, cell, size, starts, triangles };
    }
  }
  grids.set(geometry, grid);
  return grid ?? undefined;
}

function accelerated(mesh: Mesh, raycaster: Raycaster, intersects: Intersection[]) {
  const geometry = mesh.geometry;
  const material = mesh.material;
  const position = geometry.getAttribute("position");
  if (!position || material === undefined || Array.isArray(material) || mesh.morphTargetInfluences?.length || (mesh as { isSkinnedMesh?: boolean }).isSkinnedMesh
    || (mesh as { isInstancedMesh?: boolean }).isInstancedMesh || (mesh as { isBatchedMesh?: boolean }).isBatchedMesh || mesh.raycast !== Mesh.prototype.raycast) return false;
  const index = geometry.index;
  const total = index ? index.count : position.count;
  if (total < minimumTriangles * 3 || geometry.drawRange.start !== 0 || geometry.drawRange.count < total || !Number.isFinite(raycaster.far)) return false;
  const grid = triangleGrid(geometry);
  if (!grid || mesh.matrixWorld.determinant() === 0) return false;
  // 射线线段（near 到 far）在网格局部坐标里的包围盒，取它碰到的格子。
  inverse.copy(mesh.matrixWorld).invert();
  from.copy(raycaster.ray.direction).multiplyScalar(raycaster.near).add(raycaster.ray.origin).applyMatrix4(inverse);
  to.copy(raycaster.ray.direction).multiplyScalar(raycaster.far).add(raycaster.ray.origin).applyMatrix4(inverse);
  if (!Number.isFinite(from.x + from.y + from.z + to.x + to.y + to.z)) return false;
  const { min, cell, size, starts, triangles } = grid;
  // 留一点余量，抵消逆矩阵和格子划分的浮点误差；多取几格只是多验几个三角形。
  const margin = 1e-4 * (1 + Math.abs(from.x) + Math.abs(from.y) + Math.abs(from.z) + Math.abs(to.x) + Math.abs(to.y) + Math.abs(to.z));
  const lower = (a: number, b: number, origin: number, width: number, cells: number) => Math.max(0, Math.min(cells - 1, Math.floor((Math.min(a, b) - margin - origin) / width)));
  const upper = (a: number, b: number, origin: number, width: number, cells: number) => Math.max(0, Math.min(cells - 1, Math.floor((Math.max(a, b) + margin - origin) / width)));
  if (Math.max(from.x, to.x) + margin < min.x || Math.max(from.y, to.y) + margin < min.y || Math.max(from.z, to.z) + margin < min.z
    || Math.min(from.x, to.x) - margin > min.x + cell.x * size[0] || Math.min(from.y, to.y) - margin > min.y + cell.y * size[1] || Math.min(from.z, to.z) - margin > min.z + cell.z * size[2]) return true;
  const x0 = lower(from.x, to.x, min.x, cell.x, size[0]), x1 = upper(from.x, to.x, min.x, cell.x, size[0]);
  const y0 = lower(from.y, to.y, min.y, cell.y, size[1]), y1 = upper(from.y, to.y, min.y, cell.y, size[1]);
  const z0 = lower(from.z, to.z, min.z, cell.z, size[2]), z1 = upper(from.z, to.z, min.z, cell.z, size[2]);
  let found = 0;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    const cellIndex = (x * size[1] + y) * size[2] + z;
    const start = starts[cellIndex]!, end = starts[cellIndex + 1]!;
    if (found + end - start > candidates.length) { const grown = new Uint32Array(Math.max(candidates.length * 2, found + end - start)); grown.set(candidates.subarray(0, found)); candidates = grown; }
    for (let entry = start; entry < end; entry++) candidates[found++] = triangles[entry]!;
  }
  if (!found) return true;
  // 跨多个格子时会有重复：排序去重，保持三角形序号递增（和 three 逐个遍历的先后一致）。
  const list = candidates.subarray(0, found);
  if (x0 !== x1 || y0 !== y1 || z0 !== z1) list.sort();
  if (found * 3 > scratchIndices.length) { scratchIndices = new Uint32Array(Math.max(scratchIndices.length * 2, found * 3)); scratchIndex = new BufferAttribute(scratchIndices, 1); scratchGeometry.setIndex(scratchIndex); }
  let written = 0, previous = -1;
  for (let entry = 0; entry < found; entry++) {
    const triangle = list[entry]!;
    if (triangle === previous) continue;
    previous = triangle;
    scratchIndices[written++] = index ? index.getX(triangle * 3) : triangle * 3;
    scratchIndices[written++] = index ? index.getX(triangle * 3 + 1) : triangle * 3 + 1;
    scratchIndices[written++] = index ? index.getX(triangle * 3 + 2) : triangle * 3 + 2;
  }
  // 临时网格借用原网格的顶点、材质、世界矩阵和包围体，求交走 three 原本的 Mesh.raycast。
  if (geometry.boundingSphere === null) geometry.computeBoundingSphere();
  scratchGeometry.setAttribute("position", position);
  scratchGeometry.boundingSphere = geometry.boundingSphere;
  scratchGeometry.boundingBox = geometry.boundingBox;
  scratchGeometry.setDrawRange(0, written);
  scratchMesh.material = material;
  scratchMesh.matrixWorld.copy(mesh.matrixWorld);
  const before = intersects.length;
  Mesh.prototype.raycast.call(scratchMesh, raycaster, intersects);
  for (let hit = before; hit < intersects.length; hit++) {
    const intersection = intersects[hit]!;
    intersection.object = mesh;
    // faceIndex 在临时索引里没有意义，换回原网格的三角形序号查不到就不给。
    delete intersection.faceIndex;
  }
  scratchGeometry.deleteAttribute("position");
  scratchGeometry.boundingSphere = null;
  scratchGeometry.boundingBox = null;
  return true;
}

function intersect(object: Object3D, raycaster: Raycaster, intersects: Intersection[]) {
  let propagate = true;
  if (object.layers.test(raycaster.layers)) {
    if (!(object instanceof Mesh && accelerated(object, raycaster, intersects)) && (object.raycast(raycaster, intersects) as unknown) === false) propagate = false;
  }
  if (propagate) for (const child of object.children) intersect(child, raycaster, intersects);
}

/** 与 raycaster.intersectObjects(objects, true) 等价（命中集合、排序一致；命中里不带 faceIndex/uv/插值法线），对大网格只验射线线段附近的三角形。 */
export function intersectSupportObjects(raycaster: Raycaster, objects: readonly Object3D[]): Intersection[] {
  const intersects: Intersection[] = [];
  for (const object of objects) intersect(object, raycaster, intersects);
  intersects.sort((left, right) => left.distance - right.distance);
  return intersects;
}
