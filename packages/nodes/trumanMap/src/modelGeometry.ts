import {
  Box3, BoxGeometry, BufferGeometry, CapsuleGeometry, ConeGeometry, CylinderGeometry,
  ExtrudeGeometry, Float32BufferAttribute, Group, InstancedMesh, LatheGeometry, MathUtils, Mesh, MeshStandardMaterial,
  Shape, SphereGeometry, TorusGeometry, Vector2, Vector3,
} from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { z } from "@toonflow/nodes-scaffold/runtime";
import { disposeObject } from "./sceneResources";
import { validateModel } from "./assetLibrary";
import { createTubeGeometry, tubeSegments } from "./assetModelParts";

const coordinate = z.number().finite().min(-100).max(100);
const vector = z.strictObject({ x: coordinate, y: coordinate, z: coordinate });
const rotation = z.number().finite().min(-3600).max(3600);
const size = z.number().finite().min(0.001).max(100);

function simpleProfile(points: { x: number; y: number }[]) {
  const cross = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const between = (a: { x: number; y: number }, b: { x: number; y: number }, point: { x: number; y: number }) => point.x >= Math.min(a.x, b.x) - 1e-9 && point.x <= Math.max(a.x, b.x) + 1e-9 && point.y >= Math.min(a.y, b.y) - 1e-9 && point.y <= Math.max(a.y, b.y) + 1e-9;
  // ACT: 单个轮廓最多32点，直接检查非相邻边相交；无需引入几何布尔库。
  for (let index = 0; index < points.length; index++) {
    const a = points[index]!;
    const b = points[(index + 1) % points.length]!;
    if (Math.hypot(a.x - b.x, a.y - b.y) < 1e-8) return false;
    for (let other = index + 1; other < points.length; other++) {
      if ((index + 1) % points.length === other || (other + 1) % points.length === index) continue;
      const c = points[other]!;
      const d = points[(other + 1) % points.length]!;
      const abC = cross(a, b, c), abD = cross(a, b, d), cdA = cross(c, d, a), cdB = cross(c, d, b);
      if (abC * abD < 0 && cdA * cdB < 0) return false;
      if ((Math.abs(abC) < 1e-9 && between(a, b, c)) || (Math.abs(abD) < 1e-9 && between(a, b, d)) || (Math.abs(cdA) < 1e-9 && between(c, d, a)) || (Math.abs(cdB) < 1e-9 && between(c, d, b))) return false;
    }
  }
  return true;
}

const partSchema = z.strictObject({
  name: z.string().trim().min(1).max(80).default("部件"),
  shape: z.enum(["box", "sphere", "cylinder", "cone", "torus", "capsule", "lathe", "mesh", "extrude", "tube"]),
  position: vector.default({ x: 0, y: 0, z: 0 }),
  rotation: z.strictObject({ x: rotation, y: rotation, z: rotation }).default({ x: 0, y: 0, z: 0 }),
  scale: z.strictObject({ x: size, y: size, z: size }).default({ x: 1, y: 1, z: 1 }),
  color: z.string().regex(/^#[\da-f]{6}$/i).default("#bac5d3"),
  roughness: z.number().finite().min(0).max(1).optional(),
  metalness: z.number().finite().min(0).max(1).optional(),
  opacity: z.number().finite().min(0).max(1).optional(),
  emissive: z.string().regex(/^#[\da-f]{6}$/i).optional(),
  emissiveIntensity: z.number().finite().min(0).max(5).optional(),
  profile: z.array(z.strictObject({ x: coordinate, y: coordinate })).min(2).max(32).optional()
    .describe("lathe: x为半径、y为高度；extrude: 二维轮廓顶点，无需重复首点"),
  depth: size.optional().describe("仅extrude: 挤出厚度，默认0.2米"),
  path: z.array(vector).min(2).max(64).optional().describe("仅tube: 管道中心路径的局部三维坐标"),
  radius: z.number().finite().min(0.001).max(10).optional().describe("仅tube: 管道半径，默认0.08米"),
  vertices: z.array(vector).min(3).max(512).optional().describe("仅mesh: 局部坐标顶点"),
  indices: z.array(z.number().int().min(0).max(511)).min(3).max(3072).optional()
    .describe("仅mesh: 每三个下标组成一个三角形；省略时每三个顶点组成三角形"),
}).superRefine((part, context) => {
  const issue = (message: string) => context.addIssue({ code: "custom", message });
  if (part.shape === "lathe" || part.shape === "extrude") {
    if (!part.profile) issue(`${part.shape} 必须提供profile轮廓`);
  } else if (part.profile) issue("profile仅用于lathe或extrude");
  if (part.shape === "lathe" && part.profile) {
    if (part.profile.some(point => point.x < 0) || !part.profile.some(point => point.x > 0)) issue("lathe轮廓半径须非负且不能全部为零");
    if (!part.profile.some(point => point.x !== part.profile![0]!.x || point.y !== part.profile![0]!.y)) issue("lathe轮廓不能全部重合");
  }
  if (part.shape === "extrude" && part.profile) {
    if (part.profile.length < 3) issue("extrude至少需要三个轮廓点");
    const area = part.profile.reduce((sum, point, index) => {
      const next = part.profile![(index + 1) % part.profile!.length]!;
      return sum + point.x * next.y - next.x * point.y;
    }, 0);
    if (Math.abs(area) < 1e-8) issue("extrude轮廓必须围成非零面积");
    if (!simpleProfile(part.profile)) issue("extrude轮廓不能自交或重复相邻点");
  } else if (part.depth !== undefined) issue("depth仅用于extrude");
  if (part.shape === "tube") {
    if (!part.path) issue("tube必须提供path");
    else if (part.path.some((point, index) => index > 0 && Math.hypot(point.x - part.path![index - 1]!.x, point.y - part.path![index - 1]!.y, point.z - part.path![index - 1]!.z) < 1e-5)) issue("tube相邻路径点不能重合");
  } else if (part.path || part.radius !== undefined) issue("path和radius仅用于tube");
  if (part.shape === "mesh") {
    if (!part.vertices) issue("mesh必须提供vertices");
    else {
      const indices = part.indices ?? part.vertices.map((_point, index) => index);
      if (indices.length % 3 !== 0) issue("mesh的三角形下标数量必须是3的倍数");
      if (indices.some(index => index >= part.vertices!.length)) issue("mesh下标超出vertices范围");
      for (let index = 0; index + 2 < indices.length; index += 3) {
        const points = indices.slice(index, index + 3).map(index => part.vertices![index]);
        if (points.some(point => !point)) continue;
        const [a, b, c] = points as [{ x: number; y: number; z: number }, { x: number; y: number; z: number }, { x: number; y: number; z: number }];
        const ab = new Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
        const ac = new Vector3(c.x - a.x, c.y - a.y, c.z - a.z);
        if (ab.cross(ac).lengthSq() < 1e-16) { issue("mesh不能包含重合或共线的退化三角形"); break; }
      }
    }
  } else if (part.vertices || part.indices) issue("vertices和indices仅用于mesh");
});

function triangleBudget(part: z.infer<typeof partSchema>) {
  if (part.shape === "mesh") return (part.indices?.length ?? part.vertices?.length ?? 0) / 3;
  if (part.shape === "lathe") return 48 * Math.max(0, (part.profile?.length ?? 0) - 1);
  if (part.shape === "extrude") return 4 * (part.profile?.length ?? 0);
  if (part.shape === "tube") return tubeSegments(part.path?.length ?? 2) * 16;
  return { box: 12, sphere: 384, cylinder: 64, cone: 32, torus: 576, capsule: 512 }[part.shape];
}

export const modelSchema = z.strictObject({
  name: z.string().trim().min(1).max(160),
  parts: z.array(partSchema).min(1).max(120),
}).refine(model => model.parts.reduce((count, part) => count + triangleBudget(part), 0) <= 50000, "模型最多50000个三角形，请减少部件或轮廓细节");
export type ModelDefinition = z.infer<typeof modelSchema>;

function partGeometry(part: ModelDefinition["parts"][number]): BufferGeometry {
  if (part.shape === "sphere") return new SphereGeometry(0.5, 16, 12);
  if (part.shape === "cylinder") return new CylinderGeometry(0.5, 0.5, 1, 16);
  if (part.shape === "cone") return new ConeGeometry(0.5, 1, 16);
  if (part.shape === "torus") return new TorusGeometry(0.35, 0.15, 12, 24);
  if (part.shape === "capsule") return new CapsuleGeometry(0.25, 0.5, 6, 16);
  if (part.shape === "lathe") {
    const geometry = new LatheGeometry(part.profile!.map(point => new Vector2(point.x, point.y)), 24);
    geometry.normalizeNormals();
    return geometry;
  }
  if (part.shape === "extrude") {
    const depth = part.depth ?? 0.2;
    return new ExtrudeGeometry(new Shape(part.profile!.map(point => new Vector2(point.x, point.y))), { depth, steps: 1, bevelEnabled: false, curveSegments: 1 }).translate(0, 0, -depth / 2);
  }
  if (part.shape === "tube") return createTubeGeometry(part);
  if (part.shape === "mesh") {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(part.vertices!.flatMap(point => [point.x, point.y, point.z]), 3));
    if (part.indices) geometry.setIndex(part.indices);
    geometry.computeVertexNormals();
    return geometry;
  }
  return new BoxGeometry(1, 1, 1);
}

// 只登记由此处生成、局部矩阵始终不变的批次。导入模型的实例可能由动画控制。
export const modelPartBatches = new WeakSet<InstancedMesh>();

export function createModelGroup(definition: ModelDefinition, signal?: AbortSignal, instanceParts = false): Group {
  signal?.throwIfAborted();
  const model = modelSchema.parse(definition);
  const group = new Group();
  group.name = model.name;
  // ACT: 仅在同一模型内共享相同几何和材质，导出GLB时复用buffer；不跨物件缓存GPU资源。
  const geometries = new Map<string, BufferGeometry>();
  const materials = new Map<string, MeshStandardMaterial>();
  const batches = instanceParts && model.parts.length >= 6 ? new Map<string, Mesh<BufferGeometry, MeshStandardMaterial>[]>() : undefined;
  try {
    let triangles = 0;
    for (const part of model.parts) {
      signal?.throwIfAborted();
      const geometryKey = JSON.stringify([part.shape, part.profile, part.depth, part.path, part.radius, part.vertices, part.indices]);
      let geometry = geometries.get(geometryKey);
      if (!geometry) {
        geometry = partGeometry(part);
        // ACT: 程序化材质没有贴图，不输出未使用的UV；今后支持贴图时须保留对应坐标。
        geometry.deleteAttribute("uv");
        geometries.set(geometryKey, geometry);
      }
      const opacity = part.opacity ?? 1;
      const materialKey = JSON.stringify([part.color.toLowerCase(), part.roughness ?? 0.7, part.metalness ?? 0, opacity, part.emissive?.toLowerCase() ?? "#000000", part.emissiveIntensity ?? 1]);
      let material = materials.get(materialKey);
      if (!material) {
        material = new MeshStandardMaterial({ color: part.color, roughness: part.roughness ?? 0.7, metalness: part.metalness ?? 0, opacity, transparent: opacity < 1, depthWrite: opacity >= 1, emissive: part.emissive ?? "#000000", emissiveIntensity: part.emissiveIntensity ?? 1 });
        materials.set(materialKey, material);
      }
      const mesh = new Mesh(geometry, material);
      group.add(mesh);
      mesh.name = part.name;
      mesh.position.set(part.position.x, part.position.y, part.position.z);
      mesh.rotation.set(MathUtils.degToRad(part.rotation.x), MathUtils.degToRad(part.rotation.y), MathUtils.degToRad(part.rotation.z));
      mesh.scale.set(part.scale.x, part.scale.y, part.scale.z);
      if (batches && !material.transparent) {
        const key = geometry.id + "/" + material.uuid;
        const parts = batches.get(key);
        if (parts) parts.push(mesh);
        else batches.set(key, [mesh]);
      }
      triangles += (geometry.index?.count ?? geometry.getAttribute("position").count) / 3;
    }
    if (triangles > 50000) throw new Error("模型三角形超过50000，请简化部件");
    group.updateMatrixWorld(true);
    const dimensions = new Box3().setFromObject(group).getSize(new Vector3());
    if (![dimensions.x, dimensions.y, dimensions.z].every(Number.isFinite) || Math.max(dimensions.x, dimensions.y, dimensions.z) > 1000 || dimensions.lengthSq() < 1e-12) throw new Error("模型尺寸无效或超过1000米，请调整局部部件尺寸");
    // ACT: 仅编辑视口的静态部件选择实例化。原网格已计算局部矩阵，几何与材质由新网格继续持有。
    if (batches) for (const parts of batches.values()) {
      if (parts.length < 3) continue;
      const first = parts[0]!;
      const batch = new InstancedMesh(first.geometry, first.material, parts.length);
      modelPartBatches.add(batch);
      batch.name = first.name;
      batch.userData.toonflowPartNames = parts.map(part => part.name);
      parts.forEach((part, index) => batch.setMatrixAt(index, part.matrix));
      batch.instanceMatrix.needsUpdate = true;
      group.remove(...parts);
      group.add(batch);
    }
    return group;
  } catch (error) { disposeObject(group); throw error; }
}

export async function renderModel(definition: ModelDefinition, signal?: AbortSignal): Promise<File> {
  signal?.throwIfAborted();
  const group = createModelGroup(definition, signal);
  try {
    const content = await new GLTFExporter().parseAsync(group, { binary: true, onlyVisible: true });
    signal?.throwIfAborted();
    if (!(content instanceof ArrayBuffer)) throw new Error("建模导出未返回GLB二进制文件");
    validateModel(content);
    return new File([content], "generatedModel.glb", { type: "model/gltf-binary" });
  } finally { disposeObject(group); }
}
