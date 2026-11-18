import { Euler, Quaternion, Vector3 } from "three";
import { mergedWalls, wallSpecs, type MergedWall } from "./roofRegistry";
import { beam, part, createTubeGeometry } from "./assetModelParts";
import type { ModelPart, Triple } from "./assetModelParts";

const lobePoints: Triple[] = [[-1, 1.618, 0], [1, 1.618, 0], [-1, -1.618, 0], [1, -1.618, 0], [0, -1, 1.618], [0, 1, 1.618], [0, -1, -1.618], [0, 1, -1.618], [1.618, 0, -1], [1.618, 0, 1], [-1.618, 0, -1], [-1.618, 0, 1]];
const lobeFaces = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];

export function lobe(name: string, color: string, position: Triple, scale: Triple, rotation: Triple = [0, 0, 0]): ModelPart {
  const divisor = Math.hypot(1, 1.618) * 2;
  return part(name, "mesh", color, position, scale, rotation, { vertices: lobePoints.map(([x, y, z]) => ({ x: x / divisor, y: y / divisor, z: z / divisor })), indices: [...lobeFaces] });
}

export function leaf(name: string, color: string, position: Triple, width: number, length: number, rotation: Triple = [0, 0, 0], rotationOrder: "XYZ" | "YXZ" = "XYZ"): ModelPart {
  if (rotationOrder === "YXZ") {
    const angles = new Euler(...rotation.map(value => value * Math.PI / 180) as Triple, "YXZ").reorder("XYZ");
    rotation = [angles.x, angles.y, angles.z].map(value => value * 180 / Math.PI) as Triple;
  }
  const front = [{ x: 0, y: 0, z: 0 }, { x: -0.5, y: 0.45, z: 0 }, { x: 0, y: 1, z: 0.06 }, { x: 0.5, y: 0.45, z: 0 }, { x: 0, y: 0.48, z: 0.14 }];
  // 正反面使用独立顶点，避免逆序三角形共享顶点时抵消法线。
  return part(name, "mesh", color, position, [width, length, width], rotation, { vertices: [...front, ...front.map(point => ({ ...point }))], indices: [0, 4, 1, 1, 4, 2, 2, 4, 3, 3, 4, 0, 6, 9, 5, 7, 9, 6, 8, 9, 7, 5, 9, 8] });
}

export function needle(name: string, color: string, start: Triple, end: Triple, width: number): ModelPart {
  const frame = beam(name, color, start, end, width);
  return { ...frame, shape: "mesh", vertices: [{ x: -0.5, y: -0.5, z: -0.5 }, { x: 0.5, y: -0.5, z: -0.5 }, { x: 0.5, y: -0.5, z: 0.5 }, { x: -0.5, y: -0.5, z: 0.5 }, { x: 0, y: 0.5, z: 0 }], indices: [0, 1, 2, 0, 2, 3, 0, 4, 1, 1, 4, 2, 2, 4, 3, 3, 4, 0] };
}

export function combineMeshes(name: string, color: string, pieces: ModelPart[]): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [];
  const indices: number[] = [];
  const walls: MergedWall[] = [];
  for (const item of pieces) {
    const offset = vertices.length;
    const rotation = new Quaternion().setFromEuler(new Euler(...[item.rotation.x, item.rotation.y, item.rotation.z].map(value => value * Math.PI / 180) as Triple));
    const spec = wallSpecs.get(item), min: Triple = [Infinity, Infinity, Infinity], max: Triple = [-Infinity, -Infinity, -Infinity];
    for (const point of item.vertices!) {
      const result = new Vector3(point.x * item.scale.x, point.y * item.scale.y, point.z * item.scale.z).applyQuaternion(rotation).add(new Vector3(item.position.x, item.position.y, item.position.z));
      vertices.push({ x: result.x, y: result.y, z: result.z });
      if (spec) { min[0] = Math.min(min[0], result.x); min[1] = Math.min(min[1], result.y); min[2] = Math.min(min[2], result.z); max[0] = Math.max(max[0], result.x); max[1] = Math.max(max[1], result.y); max[2] = Math.max(max[2], result.z); }
    }
    indices.push(...item.indices!.map(index => index + offset));
    // 带洞口登记的墙板被合并后保留洞口信息，供建筑生成后补门窗外框
    if (spec) { const dir = new Vector3(1, 0, 0).applyQuaternion(rotation); walls.push({ spec, min, max, dirX: [dir.x, dir.y, dir.z] }); }
  }
  const merged = part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
  if (walls.length) mergedWalls.set(merged, walls);
  return merged;
}

export function cap(name: string, color: string, position: Triple, radius: number, height: number, kind: number): ModelPart {
  const profiles = [
    [[0, 0.9], [0.55, 0.8], [1, 0.15], [0.9, 0], [0.25, 0.2], [0, 0.25]],
    [[0, 1], [0.25, 0.95], [0.8, 0.2], [1, 0], [0.65, 0.05], [0, 0.18]],
    [[0, 0.28], [0.5, 0.3], [1, 0.08], [1, 0], [0.5, 0.07], [0, 0.08]],
    [[0, 0], [0.45, 0.08], [0.85, 0.7], [1, 1], [0.9, 1], [0.73, 0.63], [0.4, 0.1], [0, 0.1]],
    [[0, 1], [0.65, 0.95], [0.8, 0.6], [0.7, 0.2], [1, 0], [0.55, 0.12], [0, 0.15]],
    [[0, 0.85], [0.35, 1], [0.75, 0.9], [1, 0.45], [0.85, 0], [0.5, 0.06], [0, 0.1]],
    [[0, 0.8], [0.5, 0.7], [0.8, 0.9], [1, 0.35], [0.8, 0], [0.35, 0.2], [0, 0.12]],
  ];
  return part(name, "lathe", color, position, [1, 1, 1], [0, 0, 0], { profile: profiles[kind % profiles.length]!.map(([x, y]) => ({ x: x! * radius, y: y! * height })) });
}

export function groundParts(parts: ModelPart[]): ModelPart[] {
  let bottom = Infinity;
  for (const item of parts) {
    const rotation = new Quaternion().setFromEuler(new Euler(...[item.rotation.x, item.rotation.y, item.rotation.z].map(value => value * Math.PI / 180) as Triple));
    const x = new Vector3(1, 0, 0).applyQuaternion(rotation).y * item.scale.x;
    const y = new Vector3(0, 1, 0).applyQuaternion(rotation).y * item.scale.y;
    const z = new Vector3(0, 0, 1).applyQuaternion(rotation).y * item.scale.z;
    let support = 0;
    if (item.shape === "tube") {
      const geometry = createTubeGeometry(item);
      try {
        support = Infinity;
        const positions = geometry.getAttribute("position");
        for (let index = 0; index < positions.count; index++) support = Math.min(support, positions.getX(index) * x + positions.getY(index) * y + positions.getZ(index) * z);
      } finally { geometry.dispose(); }
    } else if (item.vertices) support = Math.min(...item.vertices.map(point => point.x * x + point.y * y + point.z * z));
    else if (item.profile) support = item.shape === "lathe" ? Math.min(...item.profile.map(point => point.y * y - point.x * Math.hypot(x, z))) : Math.min(...item.profile.map(point => point.x * x + point.y * y)) - Math.abs(z) * (item.depth ?? 0.2) / 2;
    else if (item.shape === "sphere") support = -Math.hypot(x, y, z) / 2;
    else if (item.shape === "cylinder") support = -(Math.hypot(x, z) + Math.abs(y)) / 2;
    else if (item.shape === "cone") support = Math.min(-y / 2 - Math.hypot(x, z) / 2, y / 2);
    else if (item.shape === "torus") support = -Math.hypot(x, y) * 0.35 - Math.hypot(x, y, z) * 0.15;
    else if (item.shape === "capsule") support = -Math.abs(y) * 0.25 - Math.hypot(x, y, z) * 0.25;
    else support = -(Math.abs(x) + Math.abs(y) + Math.abs(z)) / 2;
    bottom = Math.min(bottom, item.position.y + support);
  }
  for (const item of parts) item.position = { ...item.position, y: item.position.y - bottom };
  return parts;
}

export function basalLeaves(count: number, radius: number, color = "#78955b"): ModelPart[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = index * Math.PI * 2 / count;
    const rotation = new Euler(35 * Math.PI / 180, Math.PI / 2 - angle, 0, "YXZ").reorder("XYZ");
    return leaf("基生叶", color, [Math.cos(angle) * radius * 0.15, 0.03, Math.sin(angle) * radius * 0.15], radius * 0.4, radius, [rotation.x, rotation.y, rotation.z].map(value => value * 180 / Math.PI) as Triple);
  });
}

export function groundStones(count: number, radius: number): ModelPart[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = index * Math.PI * 2 / count;
    return lobe("地表伴生石", "#939a83", [Math.cos(angle) * radius, 0.09 + index % 2 * 0.015, Math.sin(angle) * radius], [0.27, 0.2 + index % 2 * 0.035, 0.21], [0, index * 31, 0]);
  });
}
