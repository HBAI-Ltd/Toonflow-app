import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";

const stone = "#b1b4a6";

export function stairFlight(name: string, x: number, y: number, z: number, width: number, count: number, rise: number, run: number, reverse = false): ModelPart {
  const profile = [{ x: 0, y: 0 }, { x: count * run, y: 0 }, { x: count * run, y: count * rise }];
  for (let i = count - 1; i >= 0; i--) { profile.push({ x: i * run, y: (i + 1) * rise }); if (i) profile.push({ x: i * run, y: i * rise }); }
  const slab = polygon(name, stone, profile.map(point => [point.x, point.y]), width);
  // ACT: 最多12级，展开后不足320顶点；过滤共线盖面并分开硬面顶点，不影响公共挤出几何。
  const vertices = slab.indices!.map(index => { const point = slab.vertices![index]!; return { x: x + (reverse ? width / 2 - point.y : point.y - width / 2), y: y + point.z, z: z + point.x * (reverse ? -1 : 1) }; });
  return part(name, "mesh", stone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices });
}
