import { Box3, BoxGeometry, CapsuleGeometry, CatmullRomCurve3, Color, ConeGeometry, CylinderGeometry, Euler, LatheGeometry, Quaternion, ShapeUtils, SphereGeometry, TorusGeometry, TubeGeometry, Vector2, Vector3 } from "three";
import { part } from "./assetModelParts";
import { getAssetItemType } from "./assetMetadata";
import type { ModelPart } from "./assetModelParts";
import type { AssetItemType, AssetState, SceneAsset, Vector3Value } from "./sceneDocument";

type VariantState = Exclude<AssetState, "原始">;
type Axis = "x" | "y" | "z";
const axes: Axis[] = ["x", "y", "z"];
const stateLevels: Record<VariantState, number> = { 老旧: 1, 破损: 2, 废弃: 3 };
const stateSuffixes: Record<VariantState, string> = { 老旧: "Aged", 破损: "Damaged", 废弃: "Abandoned" };

function seedOf(value: string) {
  let seed = 2166136261;
  for (let index = 0; index < value.length; index++) seed = Math.imul(seed ^ value.charCodeAt(index), 16777619);
  return seed >>> 0;
}

function rotationOf(item: ModelPart) {
  return new Quaternion().setFromEuler(new Euler(item.rotation.x * Math.PI / 180, item.rotation.y * Math.PI / 180, item.rotation.z * Math.PI / 180));
}

function localOffset(item: ModelPart, offset: Vector3Value) {
  return new Vector3(offset.x * item.scale.x, offset.y * item.scale.y, offset.z * item.scale.z).applyQuaternion(rotationOf(item)).add(new Vector3(item.position.x, item.position.y, item.position.z));
}

function triangleCount(item: ModelPart) {
  if (item.shape === "mesh") return (item.indices?.length ?? item.vertices?.length ?? 0) / 3;
  if (item.shape === "extrude") return 4 * (item.profile?.length ?? 0);
  if (item.shape === "lathe") return 48 * Math.max(0, (item.profile?.length ?? 0) - 1);
  if (item.shape === "tube") return Math.min(256, Math.max(24, ((item.path?.length ?? 2) - 1) * 8)) * 16;
  return { box: 12, sphere: 384, cylinder: 64, cone: 32, torus: 576, capsule: 512 }[item.shape];
}

function replacePart(parts: ModelPart[], index: number, replacement: ModelPart[]) {
  if (index < 0 || !replacement.length || parts.length - 1 + replacement.length > 120) return false;
  const nextTriangles = parts.reduce((sum, item) => sum + triangleCount(item), 0) - triangleCount(parts[index]!) + replacement.reduce((sum, item) => sum + triangleCount(item), 0);
  if (nextTriangles > 50000) return false;
  parts.splice(index, 1, ...replacement);
  return true;
}

function verticalBounds(item: ModelPart): [number, number] {
  const rotation = rotationOf(item);
  const x = new Vector3(1, 0, 0).applyQuaternion(rotation).y * item.scale.x;
  const y = new Vector3(0, 1, 0).applyQuaternion(rotation).y * item.scale.y;
  const z = new Vector3(0, 0, 1).applyQuaternion(rotation).y * item.scale.z;
  const center = item.position.y;
  const radial = Math.hypot(x, z);
  if (item.shape === "box") { const radius = (Math.abs(x) + Math.abs(y) + Math.abs(z)) / 2; return [center - radius, center + radius]; }
  if (item.shape === "sphere") { const radius = Math.hypot(x, y, z) / 2; return [center - radius, center + radius]; }
  if (item.shape === "capsule") { const radius = (Math.hypot(x, y, z) + Math.abs(y)) / 4; return [center - radius, center + radius]; }
  if (item.shape === "cylinder") { const radius = (radial + Math.abs(y)) / 2; return [center - radius, center + radius]; }
  if (item.shape === "cone") return [center + Math.min(-y / 2 - radial / 2, y / 2), center + Math.max(-y / 2 + radial / 2, y / 2)];
  if (item.shape === "torus") { const radius = Math.hypot(x, y) * 0.35 + Math.hypot(x, y, z) * 0.15; return [center - radius, center + radius]; }
  if (item.shape === "lathe") return [center + Math.min(...item.profile!.map(point => point.y * y - point.x * radial)), center + Math.max(...item.profile!.map(point => point.y * y + point.x * radial))];
  if (item.shape === "extrude") return [center + Math.min(...item.profile!.map(point => point.x * x + point.y * y)) - Math.abs(z) * (item.depth ?? 0.2) / 2, center + Math.max(...item.profile!.map(point => point.x * x + point.y * y)) + Math.abs(z) * (item.depth ?? 0.2) / 2];
  if (item.shape === "mesh") { const heights = item.vertices!.map(point => center + point.x * x + point.y * y + point.z * z); return [Math.min(...heights), Math.max(...heights)]; }
  const curve = new CatmullRomCurve3(item.path!.map(point => new Vector3(point.x, point.y, point.z)), false, "centripetal");
  const geometry = new TubeGeometry(curve, Math.min(256, Math.max(24, (item.path!.length - 1) * 8)), item.radius ?? 0.08, 8, false);
  try {
    const attribute = geometry.getAttribute("position");
    let min = Infinity; let max = -Infinity;
    for (let index = 0; index < attribute.count; index++) { const height = center + attribute.getX(index) * x + attribute.getY(index) * y + attribute.getZ(index) * z; min = Math.min(min, height); max = Math.max(max, height); }
    return [min, max];
  } finally { geometry.dispose(); }
}

function boundsOf(item: ModelPart) {
  const bounds = new Box3();
  if (item.vertices) for (const point of item.vertices) bounds.expandByPoint(new Vector3(point.x, point.y, point.z));
  else if (item.path) for (const point of item.path) bounds.expandByPoint(new Vector3(point.x, point.y, point.z));
  else if (item.profile) for (const point of item.profile) {
    if (item.shape === "lathe") { bounds.expandByPoint(new Vector3(-point.x, point.y, -point.x)); bounds.expandByPoint(new Vector3(point.x, point.y, point.x)); }
    else { bounds.expandByPoint(new Vector3(point.x, point.y, -(item.depth ?? 0.2) / 2)); bounds.expandByPoint(new Vector3(point.x, point.y, (item.depth ?? 0.2) / 2)); }
  } else if (item.shape === "capsule") bounds.set(new Vector3(-0.25, -0.5, -0.25), new Vector3(0.25, 0.5, 0.25));
  else if (item.shape === "torus") bounds.set(new Vector3(-0.5, -0.5, -0.15), new Vector3(0.5, 0.5, 0.15));
  else bounds.set(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5));
  if (item.path) bounds.expandByScalar(item.radius ?? 0.08);
  const result = new Box3();
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) result.expandByPoint(localOffset(item, { x, y, z }));
  const [minY, maxY] = verticalBounds(item);
  result.min.y = minY; result.max.y = maxY;
  return result;
}

function primaryPart(parts: ModelPart[], predicate: (item: ModelPart) => boolean = () => true) {
  let chosen = -1;
  let largest = -1;
  parts.forEach((item, index) => {
    if (!predicate(item)) return;
    const size = boundsOf(item).getSize(new Vector3());
    const area = Math.max(size.x * size.y, size.x * size.z, size.y * size.z);
    const score = area * Math.max(0.02, Math.min(size.x, size.y, size.z));
    if (score > largest) { chosen = index; largest = score; }
  });
  return chosen;
}

function meshPart(item: ModelPart, vertices: Vector3Value[], indices: number[], name: string): ModelPart {
  const result = { ...item, name, shape: "mesh" as const, vertices, indices };
  delete result.profile; delete result.depth; delete result.path; delete result.radius;
  return result;
}

function faceAxes(item: ModelPart): [Axis, Axis, Axis] {
  const thin = axes.reduce((chosen, axis) => item.scale[axis] < item.scale[chosen] ? axis : chosen, "z");
  if (thin === "x") return ["y", "z", "x"];
  if (thin === "y") return ["z", "x", "y"];
  return ["x", "y", "z"];
}

function holeAxes(item: ModelPart): readonly [Axis, Axis, Axis] {
  return Math.min(item.scale.x, item.scale.y, item.scale.z) < Math.max(item.scale.x, item.scale.y, item.scale.z) * 0.25 ? faceAxes(item) : ["x", "y", "z"];
}

function chippedBox(item: ModelPart, level: number): ModelPart {
  const [u, v, depth] = faceAxes(item);
  const bite = 0.07 + level * 0.085;
  const outline = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5 - bite * 1.7], [0.5 - bite * 0.45, 0.5 - bite * 1.35], [0.5 - bite, 0.5 - bite * 0.4], [0.5 - bite * 1.4, 0.5], [-0.5, 0.5]].map(([x, y]) => new Vector2(x!, y!));
  const vertices: Vector3Value[] = [];
  for (const side of [-0.5, 0.5]) for (const point of outline) { const value = { x: 0, y: 0, z: 0 }; value[u] = point.x; value[v] = point.y; value[depth] = side; vertices.push(value); }
  const indices: number[] = [];
  const count = outline.length;
  for (const triangle of ShapeUtils.triangulateShape(outline, [])) {
    let [a, b, c] = triangle as [number, number, number];
    if ((outline[b]!.x - outline[a]!.x) * (outline[c]!.y - outline[a]!.y) - (outline[b]!.y - outline[a]!.y) * (outline[c]!.x - outline[a]!.x) < 0) [b, c] = [c, b];
    indices.push(a, c, b, count + a, count + b, count + c);
  }
  for (let index = 0; index < count; index++) { const next = (index + 1) % count; indices.push(index, next, count + next, index, count + next, count + index); }
  return meshPart(item, vertices, indices, `${item.name}缺角断面`);
}

function primitiveMesh(item: ModelPart): ModelPart | undefined {
  if (item.shape === "mesh") return { ...item, indices: item.indices ?? item.vertices!.map((_point, index) => index) };
  // ACT: 只网格化被破坏的单个部件，圆周最多12段；32点旋转轮廓也保持在512顶点预算内。
  const geometry = item.shape === "box" ? new BoxGeometry(1, 1, 1) : item.shape === "sphere" ? new SphereGeometry(0.5, 12, 8) : item.shape === "cylinder" ? new CylinderGeometry(0.5, 0.5, 1, 12) : item.shape === "cone" ? new ConeGeometry(0.5, 1, 12) : item.shape === "torus" ? new TorusGeometry(0.35, 0.15, 8, 16) : item.shape === "capsule" ? new CapsuleGeometry(0.25, 0.5, 4, 12) : item.shape === "lathe" ? new LatheGeometry(item.profile!.map(point => new Vector2(point.x, point.y)), 12) : undefined;
  if (!geometry) return;
  try {
    const attribute = geometry.getAttribute("position");
    const vertices = Array.from({ length: attribute.count }, (_, index) => ({ x: attribute.getX(index), y: attribute.getY(index), z: attribute.getZ(index) }));
    const source = geometry.index ? Array.from(geometry.index.array) : vertices.map((_value, index) => index);
    const indices: number[] = [];
    for (let index = 0; index < source.length; index += 3) {
      const a = vertices[source[index]!]!; const b = vertices[source[index + 1]!]!; const c = vertices[source[index + 2]!]!;
      if (new Vector3(b.x - a.x, b.y - a.y, b.z - a.z).cross(new Vector3(c.x - a.x, c.y - a.y, c.z - a.z)).lengthSq() >= 1e-16) indices.push(source[index]!, source[index + 1]!, source[index + 2]!);
    }
    return meshPart(item, vertices, indices, item.name);
  } finally { geometry.dispose(); }
}

function clippedRoof(item: ModelPart, level: number): ModelPart {
  const profile = item.profile!;
  const min = Math.min(...profile.map(point => point.x));
  const max = Math.max(...profile.map(point => point.x));
  const cut = max - (max - min) * (0.08 + level * 0.1);
  const clipped: { x: number; y: number }[] = [];
  let crossings = 0;
  for (let index = 0; index < profile.length; index++) {
    const a = profile[index]!; const b = profile[(index + 1) % profile.length]!;
    if (a.x <= cut) clipped.push({ ...a });
    if ((a.x <= cut) !== (b.x <= cut)) { const t = (cut - a.x) / (b.x - a.x); clipped.push({ x: cut, y: a.y + (b.y - a.y) * t }); crossings++; }
  }
  const outline = clipped.filter((point, index) => !index || Math.hypot(point.x - clipped[index - 1]!.x, point.y - clipped[index - 1]!.y) > 1e-8);
  if (outline.length > 1 && Math.hypot(outline[0]!.x - outline.at(-1)!.x, outline[0]!.y - outline.at(-1)!.y) < 1e-8) outline.pop();
  if (crossings === 2 && outline.length >= 3 && outline.length <= 32) return { ...item, name: `${item.name}断檐`, profile: outline };
  // ACT: 多次穿越的凹轮廓可能被裁成分离区域，改为单侧截断挤出深度，保留原轮廓而不制造自交。
  const depth = item.depth ?? 0.2;
  const amount = 0.12 + level * 0.12;
  const point = localOffset(item, { x: 0, y: 0, z: -depth * amount / 2 });
  return { ...item, name: `${item.name}缺失一段`, depth: Math.max(0.001, depth * (1 - amount)), position: { x: point.x, y: point.y, z: point.z } };
}

function chipPart(item: ModelPart, level: number): ModelPart {
  if (item.shape === "box") return chippedBox(item, level);
  if (item.shape === "extrude") return clippedRoof(item, level);
  if (item.shape === "tube") {
    const path = item.path!;
    const kept = Math.max(2, Math.ceil(path.length * (0.9 - level * 0.13)));
    return { ...item, name: `${item.name}断裂`, path: path.filter((_point, index) => index < kept) };
  }
  const mesh = primitiveMesh(item);
  if (!mesh?.vertices || !mesh.indices) return item;
  const bounds = new Box3().setFromPoints(mesh.vertices.map(point => new Vector3(point.x, point.y, point.z)));
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const indices: number[] = [];
  const edge = 0.77 - level * 0.17;
  for (let index = 0; index < mesh.indices.length; index += 3) {
    const points = [mesh.vertices[mesh.indices[index]!]!, mesh.vertices[mesh.indices[index + 1]!]!, mesh.vertices[mesh.indices[index + 2]!]!];
    const x = (points[0]!.x + points[1]!.x + points[2]!.x) / 3;
    const y = (points[0]!.y + points[1]!.y + points[2]!.y) / 3;
    if ((x - center.x) / Math.max(size.x, 0.001) + (y - center.y) / Math.max(size.y, 0.001) < edge) indices.push(mesh.indices[index]!, mesh.indices[index + 1]!, mesh.indices[index + 2]!);
  }
  if (indices.length < 3) return mesh;
  return { ...mesh, name: `${item.name}崩裂缺口`, indices };
}

function holeInBox(item: ModelPart, level: number): ModelPart[] {
  // ACT: 当前穿孔由四块边壁构成；不引入CSG，任意原旋转通过局部偏移的Quaternion变换保留。
  const [u, v, depth] = holeAxes(item);
  const left = -0.2; const right = 0.05 + level * 0.07; const bottom = -0.2; const top = 0.05 + level * 0.07;
  const sections = [[-0.5, left, -0.5, 0.5], [right, 0.5, -0.5, 0.5], [left, right, -0.5, bottom], [left, right, top, 0.5]];
  return sections.map(([a, b, c, d], index) => {
    const offset = { x: 0, y: 0, z: 0 }; offset[u] = (a! + b!) / 2; offset[v] = (c! + d!) / 2;
    const position = localOffset(item, offset);
    const scale = { ...item.scale }; scale[u] *= b! - a!; scale[v] *= d! - c!; scale[depth] = item.scale[depth];
    const panel = { ...item, name: `${item.name}破洞边壁${index + 1}`, position: { x: position.x, y: position.y, z: position.z }, scale };
    return index === 3 ? chippedBox(panel, level) : panel;
  });
}

function shortenPart(item: ModelPart, fraction: number, keepTop = false) {
  const center = localOffset(item, { x: 0, y: (1 - fraction) * (keepTop ? 0.5 : -0.5), z: 0 });
  return { ...item, name: `${item.name}折断残段`, position: { x: center.x, y: center.y, z: center.z }, scale: { ...item.scale, y: Math.max(0.001, item.scale.y * fraction) } };
}

function dentedBox(item: ModelPart, level: number): ModelPart {
  const geometry = new BoxGeometry(1, 1, 1, 2, 2, 2);
  try {
    const attribute = geometry.getAttribute("position");
    const vertices = Array.from({ length: attribute.count }, (_, index) => {
      const x = attribute.getX(index); const y = attribute.getY(index); let z = attribute.getZ(index);
      if (z > 0.49) z -= (0.06 + level * 0.07) * Math.max(0.15, 1 - Math.abs(x) * 1.4) * Math.max(0.3, 1 - Math.abs(y) * 1.1);
      return { x, y, z };
    });
    return meshPart(item, vertices, Array.from(geometry.index!.array), `${item.name}碰撞凹陷`);
  } finally { geometry.dispose(); }
}

function tilted(parts: ModelPart[], bounds: Box3, degrees: number) {
  const pivot = bounds.getCenter(new Vector3()); pivot.y = bounds.min.y;
  const tilt = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), degrees * Math.PI / 180);
  for (const item of parts) {
    const point = new Vector3(item.position.x, item.position.y, item.position.z).sub(pivot).applyQuaternion(tilt).add(pivot);
    const rotation = new Euler().setFromQuaternion(tilt.clone().multiply(rotationOf(item)));
    item.position = { x: point.x, y: point.y, z: point.z };
    item.rotation = { x: rotation.x * 180 / Math.PI, y: rotation.y * 180 / Math.PI, z: rotation.z * 180 / Math.PI };
  }
  const floor = Math.min(...parts.map(item => verticalBounds(item)[0]));
  for (const item of parts) item.position.y += bounds.min.y - floor;
}

function splitStone(item: ModelPart, level: number): ModelPart[] {
  const mesh = primitiveMesh(item);
  if (!mesh?.vertices || !mesh.indices) return [chipPart(item, level)];
  const local = new Box3().setFromPoints(mesh.vertices.map(point => new Vector3(point.x, point.y, point.z)));
  const center = local.getCenter(new Vector3());
  const halves: number[][] = [[], []];
  for (let index = 0; index < mesh.indices.length; index += 3) {
    const a = mesh.vertices[mesh.indices[index]!]!; const b = mesh.vertices[mesh.indices[index + 1]!]!; const c = mesh.vertices[mesh.indices[index + 2]!]!;
    halves[(a.x + b.x + c.x) / 3 > center.x ? 1 : 0]!.push(mesh.indices[index]!, mesh.indices[index + 1]!, mesh.indices[index + 2]!);
  }
  if (halves.some(indices => indices.length < 3)) return [chipPart(item, level)];
  const gap = 0.008 + level * 0.02;
  return halves.map((indices, index) => {
    const point = localOffset(item, { x: (index ? 1 : -1) * gap, y: 0, z: 0 });
    return { ...mesh, name: `${item.name}裂石${index + 1}`, position: { x: point.x, y: point.y, z: point.z }, vertices: mesh.vertices!.map(value => ({ ...value })), indices };
  });
}

function addDebris(parts: ModelPart[], bounds: Box3, color: string, level: number, seed: number, type: AssetItemType) {
  const size = bounds.getSize(new Vector3());
  const middle = bounds.getCenter(new Vector3());
  const slots = Math.min(120 - parts.length, level === 1 ? 1 : level === 2 ? 3 : 5);
  // 碎片只使用剩余预算，不能为了加装饰截掉原模型部件。
  let triangles = parts.reduce((sum, item) => sum + triangleCount(item), 0);
  for (let index = 0; index < slots && triangles + 12 <= 50000; index++) {
    const angle = (seed % 360 + index * 137) * Math.PI / 180;
    const width = Math.max(0.025, Math.min(0.55, Math.max(size.x, size.z) * (0.025 + index * 0.004)));
    const panel = type === "交通" && level >= 2 && index === 0;
    const fragment = part(panel ? "脱落车身板件" : "脱落碎片", "box", color, [middle.x + Math.cos(angle) * size.x * 0.55, bounds.min.y + width * 0.16, middle.z + Math.sin(angle) * size.z * 0.5], panel ? [Math.max(0.1, size.x * 0.3), 0.025, Math.max(0.12, size.z * 0.15)] : [width, width * 0.32, width * 0.65], [index % 2 * 13, seed % 75 + index * 37, index % 2 * 9]);
    fragment.position.y += bounds.min.y - verticalBounds(fragment)[0];
    parts.push(fragment); triangles += 12;
  }
}

// 屋面套件生成的网格部件（曲面瓦、檐口缘板、屋脊、山花山墙、瓦垄、宫灯）和室内天花：破损、废弃时在其上挖洞
const ROOF_MESH = /曲面瓦屋顶|檐口缘板|屋脊戗脊|歇山山花板|悬山山墙|瓦垄|檐角宫灯|室内天花/;

/** 空壳建筑（墙是单面墙板拼的，没有方盒墙体可挖洞）的破损：在屋面和天花网格上按三角形中心挖圆洞，露出室内；废弃时洞更大更多，并且门扇朽掉、门洞敞开。 */
function wreckShell(parts: ModelPart[], level: number, seed: number) {
  const shell = parts.filter(item => item.shape === "mesh" && item.vertices && item.name === "墙体外壳");
  if (!shell.length) return false;
  const box = new Box3();
  for (const item of shell) for (const point of item.vertices!) box.expandByPoint(localOffset(item, point));
  const size = box.getSize(new Vector3()), center = box.getCenter(new Vector3());
  let state = seed || 1;
  const random = () => { state ^= state << 13; state >>>= 0; state ^= state >>> 17; state ^= state << 5; state >>>= 0; return state / 4294967296; };
  const zones = Array.from({ length: level === 3 ? 3 : 2 }, () => ({ x: center.x + (random() - .5) * size.x * .7, z: center.z + (random() - .5) * size.z * .7, r: Math.max(size.x, size.z) * (level === 3 ? .38 : .28) * (.7 + random() * .6) }));
  for (const item of parts) {
    if (item.shape !== "mesh" || !item.vertices || !item.indices || !ROOF_MESH.test(item.name)) continue;
    const kept: number[] = [];
    for (let index = 0; index + 2 < item.indices.length; index += 3) {
      const corners = [0, 1, 2].map(offset => localOffset(item, item.vertices![item.indices![index + offset]!]!));
      const cx = (corners[0]!.x + corners[1]!.x + corners[2]!.x) / 3, cz = (corners[0]!.z + corners[1]!.z + corners[2]!.z) / 3;
      if (!zones.some(zone => (cx - zone.x) ** 2 + (cz - zone.z) ** 2 < zone.r ** 2)) kept.push(item.indices[index]!, item.indices[index + 1]!, item.indices[index + 2]!);
    }
    if (kept.length >= 3) item.indices = kept;
  }
  if (level === 3) for (let index = parts.length - 1; index >= 0; index--) if (parts.length > 1 && /^门扇$|^门板缝与铁件$/.test(parts[index]!.name)) parts.splice(index, 1);
  return true;
}

function damageModel(parts: ModelPart[], type: AssetItemType, level: number, seed: number, bounds: Box3) {
  const primary = primaryPart(parts);
  const replaceChip = (index: number) => index >= 0 && replacePart(parts, index, [chipPart(parts[index]!, level)]);
  if (type === "建筑") {
    const wrecked = level >= 2 && wreckShell(parts, level, seed);
    const roof = primaryPart(parts, item => /屋顶|瓦顶|顶盖|屋檐|檐顶|飞檐|重檐|穹顶|篷顶|木瓦|茅顶|瓦脊|檐瓦/.test(item.name) && !(wrecked && item.shape === "mesh"));
    const wall = primaryPart(parts, item => item.shape === "box" && /墙|壁|房|室|楼身|屋|壳|塔身|建筑结构|公寓结构/.test(item.name) && !/地台|地板|楼板|台基|底|基座|屋顶|檐|顶板|窗|门|柱|梁/.test(item.name));
    if (roof >= 0) replaceChip(roof);
    if (wall >= 0) {
      const original = parts[wall]!;
      if (level === 1 || !replacePart(parts, wall, holeInBox(original, level))) replaceChip(wall);
      else {
        const [u, v, depth] = holeAxes(original);
        const inverse = rotationOf(original).invert();
        for (let index = parts.length - 1; index >= 0; index--) {
          const item = parts[index]!;
          if (!/玻璃|窗|门扇|纸面/.test(item.name)) continue;
          const local = new Vector3(item.position.x - original.position.x, item.position.y - original.position.y, item.position.z - original.position.z).applyQuaternion(inverse);
          local.x /= original.scale.x; local.y /= original.scale.y; local.z /= original.scale.z;
          if (local[u] > -0.2 && local[u] < 0.05 + level * 0.07 && local[v] > -0.2 && local[v] < 0.05 + level * 0.07 && Math.abs(local[depth]) < 0.7 && parts.length > 1) parts.splice(index, 1);
        }
      }
    } else if (roof < 0 && !wrecked) replaceChip(primary);
    for (let index = parts.length - 1, windows = 0; index >= 0 && windows < level; index--) if (/玻璃|窗纸|窗洞|纸面/.test(parts[index]!.name)) { replaceChip(index); windows++; }
  } else if (type === "交通") {
    let body = primaryPart(parts, item => /车身|车厢|货厢|驾驶室|乘员舱|舱体|座舱|吊舱|机壳|气囊|艇身|船壳/.test(item.name) && !/玻璃|窗|风挡|挡风|灯|光带/.test(item.name));
    if (body < 0) body = primaryPart(parts, item => item.shape === "box" && /车座|座箱|主机体|底盘/.test(item.name));
    if (body >= 0) replacePart(parts, body, [parts[body]!.shape === "box" ? dentedBox(parts[body]!, level) : chipPart(parts[body]!, level)]);
    else replaceChip(primary);
    if (level >= 2) {
      const tire = parts.find(item => /轮胎|木车轮|车轮|带铁箍木轮|货车轮|滑板车轮|着陆轮/.test(item.name) && !/辐|轴|盖/.test(item.name));
      if (tire) {
        const center = new Vector3(tire.position.x, tire.position.y, tire.position.z);
        for (let index = parts.length - 1; index >= 0; index--) if (parts.length > 1 && /轮|辐/.test(parts[index]!.name) && center.distanceTo(new Vector3(parts[index]!.position.x, parts[index]!.position.y, parts[index]!.position.z)) < 0.18) parts.splice(index, 1);
      }
      const glass = parts.findIndex(item => /玻璃|侧窗|前窗|挡风|风挡|舷窗|观察窗|座舱罩/.test(item.name));
      replaceChip(glass);
      if (level === 3) tilted(parts, bounds, 8 + seed % 5);
    }
  } else if (type === "家具") {
    const board = primaryPart(parts, item => item.shape === "box" && /面|板|坐|座|抽屉|门|搁/.test(item.name));
    replaceChip(board >= 0 ? board : primary);
    const leg = parts.findIndex(item => /腿|板足|支脚|桌脚|椅脚|床脚|凳脚/.test(item.name));
    if (leg >= 0) replacePart(parts, leg, [shortenPart(parts[leg]!, level === 1 ? 0.88 : level === 2 ? 0.58 : 0.3, true)]);
    if (level === 3) tilted(parts, bounds, 9 + seed % 7);
  } else if (type === "植物") {
    const wood = parts.some(item => /干|枝|竿|根|茎|柄/.test(item.name));
    const foliage = parts.map((item, index) => /叶|冠|花瓣|花簇|针叶|苔|草/.test(item.name) ? index : -1).filter(index => index >= 0);
    if (level >= 2 && wood) for (let index = foliage.length - 1; index >= 0; index--) if (level === 3 || index % 3 === seed % 3) { if (parts.length > 1) parts.splice(foliage[index]!, 1); }
    let branch = parts.findIndex(item => /枝/.test(item.name) && (item.shape === "box" || item.shape === "cylinder"));
    if (branch < 0 && level >= 2) branch = parts.findIndex(item => /主干|竹竿|细茎/.test(item.name) && (item.shape === "box" || item.shape === "cylinder"));
    if (branch >= 0) {
      const original = parts[branch]!;
      const tip = localOffset(original, { x: 0, y: 0.5, z: 0 });
      replacePart(parts, branch, [shortenPart(original, level === 1 ? 0.92 : level === 2 ? 0.68 : 0.45)]);
      let closest = -1; let distance = Infinity;
      parts.forEach((item, index) => { if (/叶|冠|花瓣|花簇|针叶/.test(item.name)) { const next = boundsOf(item).distanceToPoint(tip); if (next < distance) { closest = index; distance = next; } } });
      if (closest >= 0 && parts.length > 1 && distance < Math.max(0.25, original.scale.y * 0.4)) parts.splice(closest, 1);
    } else replaceChip(primaryPart(parts));
    if (level === 1) replaceChip(parts.findIndex(item => /叶|冠|花瓣|花簇|针叶/.test(item.name)));
  } else if (type === "岩石") replacePart(parts, primary, splitStone(parts[primary]!, level));
  else {
    replaceChip(primary);
    if ((type === "设施" || type === "灯具") && level >= 2) tilted(parts, bounds, level === 3 ? type === "灯具" ? 62 : 22 : 6);
    if (type === "构件" && level === 3 && parts.length > 1) tilted(parts, bounds, 17);
  }
  return parts;
}

export function createAssetStateVariant(base: SceneAsset, state: AssetState): SceneAsset {
  const type = getAssetItemType(base);
  if (state === "原始") return { ...base, state, itemType: type };
  if (!base.model) throw new Error("此素材缺少可编辑模型，无法生成状态变体");
  const model = structuredClone(base.model!);
  const level = stateLevels[state];
  const seed = seedOf(base.id);
  const bounds = new Box3();
  for (const item of model.parts) bounds.union(boundsOf(item));
  const color = new Color();
  for (const item of model.parts) {
    const weather = new Color(type === "植物" ? level === 3 ? "#756e54" : "#a8a071" : level === 3 ? "#7b8070" : "#9e9a85");
    item.color = `#${color.set(item.color).lerp(weather, level * 0.1).getHexString()}`;
    item.roughness = Math.min(1, (item.roughness ?? 0.78) + level * 0.05);
    if (item.emissive) item.emissiveIntensity = level >= 2 ? 0 : (item.emissiveIntensity ?? 1) * 0.45;
  }
  damageModel(model.parts, type, level, seed, bounds);
  addDebris(model.parts, bounds, model.parts[0]!.color, level, seed, type);
  model.name = `${state}·${base.name}`;
  return { ...base, id: `${base.id}${stateSuffixes[state]}`, name: model.name, state, itemType: type, variantOf: base.id, model };
}

export function createAssetStateVariants(assets: SceneAsset[]): SceneAsset[] {
  const originals = assets.map(base => ({ ...base, state: base.state ?? "原始", itemType: getAssetItemType(base) }));
  const variants: SceneAsset[] = [];
  for (const state of ["老旧", "破损", "废弃"] as const) for (const base of originals) if (base.model && !base.variantOf) variants.push(createAssetStateVariant(base, state));
  return [...originals, ...variants];
}
