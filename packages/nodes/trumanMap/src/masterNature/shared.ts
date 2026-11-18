import { Euler, Quaternion, ShapeUtils, Vector2, Vector3 } from "three";
import { beam, part } from "../assetModelParts";
import type { ModelPart, Triple } from "../assetModelParts";
import { basalLeaves, cap, combineMeshes, groundParts, leaf, lobe, needle } from "../natureParts";
import type { AssetItemType, AssetTheme } from "../sceneDocument";

export { beam, part, basalLeaves, cap, combineMeshes, groundParts, leaf, lobe, needle };
export type { ModelPart, Triple };
export type MasterNatureDesign = { key: string; name: string; itemType: AssetItemType; tags: string[]; theme?: AssetTheme; build: () => ModelPart[] };

export function design(key: string, name: string, itemType: AssetItemType, build: () => ModelPart[], tags: string[] = [], theme?: AssetTheme): MasterNatureDesign {
  return { key, name, itemType, build, tags, ...(theme ? { theme } : {}) };
}

export function tube(name: string, color: string, path: Triple[], radius: number): ModelPart {
  return part(name, "tube", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: path.map(([x, y, z]) => ({ x, y, z })), radius });
}

export function frontCup(name: string, color: string, root: Triple, radius: number, depth: number): ModelPart {
  return { ...cap(name, color, root, radius, depth, 3), rotation: { x: 90, y: 0, z: 0 } };
}

export function polygon(name: string, color: string, outline: [number, number][], height: number, position: Triple = [0, 0, 0], holes: [number, number][][] = []): ModelPart {
  const rings = [outline, ...holes].map((ring, index) => {
    const points = ring.map(([x, y]) => new Vector2(x, y));
    if (ShapeUtils.isClockWise(points) === (index === 0)) points.reverse();
    return points;
  });
  const flat = rings.flat(); const count = flat.length;
  const vertices = [0, height].flatMap(y => flat.map(point => ({ x: point.x, y, z: point.y })));
  const indices = ShapeUtils.triangulateShape(rings[0]!, rings.slice(1)).filter(([a, b, c]) => {
    const p = flat[a!]!, q = flat[b!]!, r = flat[c!]!;
    const area = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    return area * area >= 1e-16;
  }).flatMap(([a, b, c]) => [a!, b!, c!, a! + count, c! + count, b! + count]);
  let offset = 0;
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) { const a = offset + i; const b = offset + (i + 1) % ring.length; indices.push(a, b + count, b, a, a + count, b + count); }
    offset += ring.length;
  }
  return part(name, "mesh", color, position, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function tapered(name: string, color: string, path: Triple[], radii: number[]): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [];
  const indices: number[] = [];
  for (let i = 0; i < path.length; i++) {
    const direction = new Vector3(...path[Math.min(i + 1, path.length - 1)]!).sub(new Vector3(...path[Math.max(0, i - 1)]!)).normalize();
    const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction);
    for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4; const p = new Vector3(Math.cos(a) * radii[i]!, 0, Math.sin(a) * radii[i]!).applyQuaternion(rotation).add(new Vector3(...path[i]!)); vertices.push({ x: p.x, y: p.y, z: p.z }); }
    if (i) for (let j = 0; j < 8; j++) { const a = (i - 1) * 8 + j; const b = i * 8 + j; const c = (i - 1) * 8 + (j + 1) % 8; const d = i * 8 + (j + 1) % 8; indices.push(a, b, c, c, b, d); }
  }
  const start = vertices.length; const end = start + 1; const first = path[0]!; const last = path.at(-1)!;
  vertices.push({ x: first[0], y: first[1], z: first[2] }, { x: last[0], y: last[1], z: last[2] });
  const offset = (path.length - 1) * 8;
  for (let j = 0; j < 8; j++) indices.push(start, j, (j + 1) % 8, end, offset + (j + 1) % 8, offset + j);
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function sweptProfile(name: string, color: string, profile: [number, number][], angle: number, sections = 16): ModelPart {
  if (ShapeUtils.isClockWise(profile.map(([x, y]) => new Vector2(x, y)))) profile = [...profile].reverse();
  const vertices: { x: number; y: number; z: number }[] = []; const indices: number[] = [];
  const locations = new Map<string, number>(); const grid: number[][] = [];
  for (let step = 0; step <= sections; step++) {
    const a = step / sections * angle;
    grid.push(profile.map(([radius, y]) => {
      const p = { x: Math.cos(a) * radius, y, z: Math.sin(a) * radius };
      const key = [p.x, p.y, p.z].map(value => Math.round(value * 1e10)).join(",");
      if (!locations.has(key)) { locations.set(key, vertices.length); vertices.push(p); }
      return locations.get(key)!;
    }));
  }
  for (let step = 0; step < sections; step++) for (let i = 0; i < profile.length; i++) { const j = (i + 1) % profile.length; const a = grid[step]![i]!, b = grid[step + 1]![i]!, c = grid[step]![j]!, d = grid[step + 1]![j]!; indices.push(a, c, b, c, d, b); }
  if (angle < Math.PI * 2 - 1e-8) for (const [a, b, c] of ShapeUtils.triangulateShape(profile.map(([x, y]) => new Vector2(x, y)), [])) indices.push(grid[0]![c!]!, grid[0]![b!]!, grid[0]![a!]!, grid[sections]![a!]!, grid[sections]![b!]!, grid[sections]![c!]!);
  const faces: number[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const a = vertices[indices[i]!]!, b = vertices[indices[i + 1]!]!, c = vertices[indices[i + 2]!]!;
    if (new Vector3(b.x - a.x, b.y - a.y, b.z - a.z).cross(new Vector3(c.x - a.x, c.y - a.y, c.z - a.z)).lengthSq() >= 1e-16) faces.push(indices[i]!, indices[i + 1]!, indices[i + 2]!);
  }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices: faces });
}

export function radialLeaves(count: number, root: Triple, width: number, length: number, tilt: number, color = "#7b985f"): ModelPart {
  return combineMeshes("相连叶序", color, Array.from({ length: count }, (_, index) => {
    const rotation = new Euler(tilt * Math.PI / 180, -index * Math.PI * 2 / count, 0, "YXZ").reorder("XYZ");
    return leaf("叶片", color, root, width, length, [rotation.x, rotation.y, rotation.z].map(value => value * 180 / Math.PI) as Triple);
  }));
}

export function petals(count: number, root: Triple, width: number, length: number, tilt: number, color: string): ModelPart {
  return { ...radialLeaves(count, root, width, length, tilt, color), name: "完整花冠" };
}

export function eyes(root: Triple, gap: number, radius: number, forward = 0): ModelPart[] {
  return [-1, 1].map(side => lobe("眼睛", "#3f5148", [root[0] + side * gap, root[1], root[2] + forward], [radius, radius, radius * 0.7]));
}

export function legs(roots: Triple[], feet: Triple[], width: number, color = "#9f9e7c", bent = false): ModelPart[] {
  const parts: ModelPart[] = [];
  roots.forEach((root, index) => {
    const end = feet[index]!;
    if (bent) { const joint: Triple = [end[0] * 1.1, root[1] * 0.5, end[2] - width]; parts.push(beam("上肢", color, root, joint, width), beam("下肢", color, joint, end, width * 0.65)); }
    else parts.push(beam("承重肢", color, root, end, width));
    parts.push(lobe("足部", color, end, [width * 1.7, width * 0.8, width * 2]));
  });
  return parts;
}

