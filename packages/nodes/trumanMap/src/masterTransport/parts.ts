import { beam, part, type ModelPart, type Triple } from "../assetModelParts";
import type { AssetItemType, AssetTheme } from "../sceneDocument";
import { Vector3 } from "three";

export type TransportDefinition = { name: string; create: () => ModelPart[]; tags?: string[]; theme?: AssetTheme; itemType?: AssetItemType };
export const transportColors = { body: "#9badae", dark: "#34434a", glass: "#8eb5bb", trim: "#d4ccaf", wood: "#9a7955", signal: "#bd805b" };
export const box = (name: string, position: Triple, scale: Triple, color = transportColors.body, rotation: Triple = [0, 0, 0]) => part(name, "box", color, position, scale, rotation);
export const cylinder = (name: string, position: Triple, scale: Triple, color = transportColors.dark, rotation: Triple = [0, 0, 0]) => part(name, "cylinder", color, position, scale, rotation);
export const strut = (name: string, start: Triple, end: Triple, width = 0.055, color = transportColors.dark) => beam(name, color, start, end, width);
export const ball = (name: string, position: Triple, scale: Triple, color = transportColors.body) => part(name, "sphere", color, position, scale);

export function surface(name: string, color: string, points: Triple[], faces: number[], position: Triple = [0, 0, 0]): ModelPart {
  const a = new Vector3(...points[faces[0]!]!), b = new Vector3(...points[faces[1]!]!), c = new Vector3(...points[faces[2]!]!);
  const normal = b.sub(a).cross(c.sub(a)).normalize().multiplyScalar(0.012);
  const vertices = [1, -1].flatMap(side => points.map(([x, y, z]) => ({ x: x + normal.x * side, y: y + normal.y * side, z: z + normal.z * side })));
  const count = points.length, indices = [...faces];
  const edges = new Map<string, [number, number]>();
  for (let index = 0; index < faces.length; index += 3) {
    const triangle = faces.slice(index, index + 3);
    indices.push(triangle[2]! + count, triangle[1]! + count, triangle[0]! + count);
    for (let edge = 0; edge < 3; edge++) { const start = triangle[edge]!, end = triangle[(edge + 1) % 3]!; if (!edges.delete(`${end},${start}`)) edges.set(`${start},${end}`, [start, end]); }
  }
  for (const [start, end] of edges.values()) indices.push(start, end + count, end, start, start + count, end + count);
  return part(name, "mesh", color, position, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function helicalFlight(position: Triple, innerRadius: number, outerRadius: number, height: number, turns: number, handedness: 1 | -1 = 1, thickness = 0.04): ModelPart {
  const count = Math.min(100, Math.max(24, turns * 8));
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let index = 0; index < count; index++) {
    const angle = index / (count - 1) * turns * Math.PI * 2 * handedness, y = index / (count - 1) * height;
    for (const offset of [-thickness / 2, thickness / 2]) for (const radius of [innerRadius, outerRadius]) vertices.push({ x: Math.cos(angle) * radius, y: y + offset, z: Math.sin(angle) * radius });
    if (!index) continue;
    const a = (index - 1) * 4, b = index * 4;
    indices.push(a + 2, b + 3, a + 3, a + 2, b + 2, b + 3, a, a + 1, b + 1, a, b + 1, b, a + 3, b + 3, b + 1, a + 3, b + 1, a + 1, a, b, b + 2, a, b + 2, a + 2);
  }
  const last = (count - 1) * 4;
  indices.push(0, 2, 3, 0, 3, 1, last, last + 1, last + 3, last, last + 3, last + 2);
  if (handedness < 0) for (let index = 0; index < indices.length; index += 3) [indices[index], indices[index + 1]] = [indices[index + 1]!, indices[index]!];
  return part("连续螺旋工作翼片", "mesh", transportColors.dark, position, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function wheel(position: Triple, radius: number, width = 0.12): ModelPart[] {
  return [cylinder("轮胎", position, [radius * 2, width, radius * 2], transportColors.dark, [0, 0, 90]), cylinder("轮毂", [position[0] - width * 0.06, position[1], position[2]], [radius * 0.8, width * 1.15, radius * 0.8], transportColors.trim, [0, 0, 90])];
}
export function axles(width: number, positions: number[], radius: number): ModelPart[] {
  return positions.flatMap(z => [cylinder("横向轮轴", [0, radius, z], [0.08, width, 0.08], transportColors.dark, [0, 0, 90]), ...[-1, 1].flatMap(side => wheel([side * width / 2, radius, z], radius, 0.18))]);
}
export function bicycleFrame(front: Triple, rear: Triple, saddle: Triple, crank: Triple, head: Triple): ModelPart[] {
  return [[rear, saddle], [saddle, crank], [crank, rear], [saddle, head], [head, crank], [head, front]].map(([a, b]) => strut("承力车架", a!, b!, 0.045, transportColors.signal));
}
export function cab(position: Triple, size: Triple, open = false): ModelPart[] {
  const [x, y, z] = position, [w, h, d] = size;
  const result = [box("驾驶舱下部", [x, y + h * 0.25, z], [w, h * 0.5, d], transportColors.signal), box("驾驶舱顶盖", [x, y + h, z], [w * 1.04, 0.1, d * 1.04], transportColors.trim)];
  for (const side of [-1, 1]) for (const end of [-1, 1]) result.push(box("驾驶舱支柱", [x + side * w * 0.46, y + h * 0.75, z + end * d * 0.44], [0.055, h * 0.5, 0.055], transportColors.dark));
  if (!open) result.push(box("前风挡", [x, y + h * 0.75, z - d * 0.47], [w * 0.87, h * 0.4, 0.025], transportColors.glass));
  return result;
}
export function boatHull(width: number, length: number, height: number): ModelPart {
  return part("折面船体", "mesh", transportColors.body, [0, height / 2, 0], [width, height, length], [0, 0, 0], {
    vertices: [{ x: -0.5, y: 0.5, z: 0.3 }, { x: 0.5, y: 0.5, z: 0.3 }, { x: 0, y: 0.5, z: -0.5 }, { x: -0.25, y: -0.5, z: 0.25 }, { x: 0.25, y: -0.5, z: 0.25 }, { x: 0, y: -0.25, z: -0.44 }],
    indices: [0, 1, 2, 3, 5, 4, 0, 4, 1, 0, 3, 4, 1, 5, 2, 1, 4, 5, 2, 3, 0, 2, 5, 3],
  });
}

export function shipHull(width: number, length: number, height: number): ModelPart {
  const sections = [[-0.5, 0.025, 0.012, 0.2], [-0.32, 0.47, 0.3, 0], [0.3, 0.5, 0.34, 0], [0.5, 0.4, 0.24, 0.06]];
  const localLength = Math.min(length, 100), stretch = length / localLength;
  const vertices = sections.flatMap(([z, top, bottom, lift]) => [{ x: -top!, y: 1, z: z! * stretch }, { x: top!, y: 1, z: z! * stretch }, { x: bottom!, y: lift!, z: z! * stretch }, { x: -bottom!, y: lift!, z: z! * stretch }]);
  const indices = [0, 1, 2, 0, 2, 3, 12, 14, 13, 12, 15, 14];
  for (let section = 0; section < sections.length - 1; section++) for (let edge = 0; edge < 4; edge++) { const a = section * 4 + edge, b = section * 4 + (edge + 1) % 4; indices.push(a, a + 4, b + 4, a, b + 4, b); }
  return part("多截面封闭船壳", "mesh", transportColors.body, [0, 0, 0], [width, height, localLength], [0, 0, 0], { vertices, indices });
}
export function chassis(width: number, length: number, radius: number, axlePositions: number[]): ModelPart[] {
  return [box("底盘", [0, radius + 0.17, 0], [width * 0.92, 0.22, length], transportColors.dark), ...axles(width, axlePositions, radius)];
}

export function crawler(length: number, width: number): ModelPart[] {
  const parts = [box("履带承载主架", [0, 0.65, 0], [width * 0.7, 0.45, length], transportColors.dark)];
  for (const side of [-1, 1]) {
    for (let index = 0; index < 5; index++) parts.push(...wheel([side * width / 2, 0.36, (index / 4 - 0.5) * length * 0.8], 0.35, 0.38));
    for (const y of [0.06, 0.71]) parts.push(box("连续履带带段", [side * width / 2, y, 0], [0.5, 0.12, length * 0.9], transportColors.dark));
  }
  return parts;
}
