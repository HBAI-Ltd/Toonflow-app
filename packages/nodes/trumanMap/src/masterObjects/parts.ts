import { part, beam, ring, type ModelPart, type Triple } from "../assetModelParts";
import { finishObjectModel } from "../objectModelParts";
import type { ModelDefinition } from "../modelGeometry";
import type { AssetItemType, AssetTheme } from "../sceneDocument";
import { ShapeUtils, Vector2 } from "three";

export type MasterPrototype = { name: string; build: () => ModelPart[]; itemType?: AssetItemType; theme?: AssetTheme };
export const material = { steel: "#929da3", dark: "#34424a", wood: "#98714f", ivory: "#ddd6bf", glass: "#8fafba", red: "#ac6351" };
export function box(name: string, position: Triple, size: Triple, color = material.steel, rotation: Triple = [0, 0, 0]) { return part(name, "box", color, position, size, rotation); }
export function cylinder(name: string, position: Triple, size: Triple, color = material.steel, rotation: Triple = [0, 0, 0]) { return part(name, "cylinder", color, position, size, rotation); }
export function ball(name: string, position: Triple, size: Triple, color = material.ivory) { return part(name, "sphere", color, position, size); }
export function rod(name: string, start: Triple, end: Triple, width = 0.025, color = material.steel) { return { ...beam(name, color, start, end, width), shape: "cylinder" as const }; }
export function loop(name: string, position: Triple, radius: number, thickness = 0.015, rotation: Triple = [0, 0, 0], color = material.steel) { const value = ring(name, color, radius, thickness, 0, thickness * 1.2); value.position = { x: position[0], y: position[1], z: position[2] }; value.rotation = { x: rotation[0], y: rotation[1], z: rotation[2] }; return value; }
export function cup(name: string, position: Triple, radius: number, height: number, color = material.steel) { return part(name, "lathe", color, position, [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: radius * 0.86, y: 0 }, { x: radius, y: height }, { x: Math.max(0.005, radius - 0.008), y: height }, { x: Math.max(0.005, radius * 0.86 - 0.008), y: 0.012 }, { x: 0, y: 0.012 }] }); }
export function cone(name: string, position: Triple, size: Triple, color = material.steel, rotation: Triple = [0, 0, 0]) { return part(name, "cone", color, position, size, rotation); }
export function plate(name: string, position: Triple, points: [number, number][], thickness = 0.01, color = material.wood, rotation: Triple = [-90, 0, 0]) { return part(name, "extrude", color, position, [1, 1, 1], rotation, { profile: points.map(([x, y]) => ({ x, y })), depth: thickness }); }
export function cord(name: string, points: Triple[], radius = 0.008, color = material.dark) { return part(name, "tube", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: points.map(([x, y, z]) => ({ x, y, z })), radius }); }
export function bars(name: string, count: number, position: Triple, span: number, size: Triple, axis: 0 | 1 | 2 = 0, color = material.steel) { return Array.from({ length: count }, (_, index) => { const p = [...position] as Triple; p[axis] += (index / Math.max(1, count - 1) - 0.5) * span; return box(`${name}${index + 1}`, p, size, color); }); }
export function legs(width: number, depth: number, height: number, diameter = 0.035) { return [-1, 1].flatMap(x => [-1, 1].map(z => cylinder("支脚", [x * width / 2, height / 2, z * depth / 2], [diameter, height, diameter], material.dark))); }
export function wheel(name: string, position: Triple, radius: number, rotation: Triple = [90, 0, 0]) { return cylinder(name, position, [radius * 2, 0.035, radius * 2], material.dark, rotation); }
export function cog(name: string, position: Triple, radius: number, depth = 0.015) {
  return plate(name, position, Array.from({ length: 32 }, (_, i): [number, number] => { const a = i * Math.PI / 16, r = radius * (i % 4 === 0 || i % 4 === 3 ? 0.85 : 1); return [Math.cos(a) * r, Math.sin(a) * r]; }), depth, material.wood, [0, 0, 0]);
}

export function piercedPanel(name: string, position: Triple, outline: [number, number][], holes: [number, number][][], thickness = 0.006, color = material.steel, rotation: Triple = [0, 0, 0]): ModelPart {
  const loops = [outline, ...holes].map((loop, index) => {
    const points = loop.map(([x, z]) => new Vector2(x, z));
    return ShapeUtils.isClockWise(points) === (index === 0) ? points.reverse() : points;
  });
  const contour = loops[0]!, voids = loops.slice(1), points = loops.flat(), count = points.length;
  const vertices = [0, thickness].flatMap(y => points.map(p => ({ x: p.x, y, z: p.y }))), indices: number[] = [];
  const onEdge = (point: number, start: number, end: number) => {
    const p = points[point]!, a = points[start]!, b = points[end]!, dx = b.x - a.x, dy = b.y - a.y, lengthSq = dx * dx + dy * dy;
    if (lengthSq < 1e-16) return false;
    const ratio = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
    return ratio > 1e-8 && ratio < 1 - 1e-8 && Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) <= Math.sqrt(lengthSq) * 1e-8;
  };
  const capFaces: number[][] = [];
  // ACT: 单片最多256个轮廓点；沿既有共线点分盖面，避免Earcut合并长边后与孔壁形成T接。
  for (const face of ShapeUtils.triangulateShape(contour, voids)) {
    const [a, b, c] = face, pa = points[a!]!, pb = points[b!]!, pc = points[c!]!;
    if (Math.abs((pb.x - pa.x) * (pc.y - pa.y) - (pb.y - pa.y) * (pc.x - pa.x)) < 1e-8) continue;
    const fragments: number[][] = [face];
    for (let point = 0; point < count; point++) {
      if (face.includes(point) || !face.some((start, edge) => onEdge(point, start!, face[(edge + 1) % 3]!))) continue;
      let divided = false;
      for (let fragment = 0; fragment < fragments.length && !divided; fragment++) for (let edge = 0; edge < 3; edge++) {
        const value = fragments[fragment]!, start = value[edge]!, end = value[(edge + 1) % 3]!, opposite = value[(edge + 2) % 3]!;
        if (!onEdge(point, start, end)) continue;
        fragments.splice(fragment, 1, [start, point, opposite], [point, end, opposite]);
        divided = true;
        break;
      }
    }
    capFaces.push(...fragments);
  }
  for (const [a, b, c] of capFaces) {
    const pa = points[a!]!, pb = points[b!]!, pc = points[c!]!, area = (pb.x - pa.x) * (pc.y - pa.y) - (pb.y - pa.y) * (pc.x - pa.x);
    // ACT: 对齐孔列会产生共线桥片，仅保留真正围成面积的端面，孔壁另行闭合。
    if (Math.abs(area) < 1e-8) continue;
    indices.push(...(area > 0 ? [a!, b!, c!, a! + count, c! + count, b! + count] : [a!, c!, b!, a! + count, b! + count, c! + count]));
  }
  let start = 0;
  for (const loopPoints of loops) {
    for (let i = 0; i < loopPoints.length; i++) { const a = start + i, b = start + (i + 1) % loopPoints.length; indices.push(a, a + count, b + count, a, b + count, b); }
    start += loopPoints.length;
  }
  return part(name, "mesh", color, position, [1, 1, 1], rotation, { vertices, indices });
}

export function finishMasterObject(name: string, parts: ModelPart[]): ModelDefinition {
  return finishObjectModel(name, parts);
}
