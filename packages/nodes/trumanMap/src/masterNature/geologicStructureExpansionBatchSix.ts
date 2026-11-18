import { combineMeshes, design, lobe, part } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";

type Point3 = { x: number; y: number; z: number };

export function closedGrid(name: string, color: string, top: Point3[], bottom: Point3[], columns: number): ModelPart {
  const count = top.length, vertices = [...top, ...bottom], front: number[] = [];
  const a = top[0]!, b = top[1]!, c = top[columns]!;
  const upwards = (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z) > 0;
  for (let row = 0; row < count / columns - 1; row++) for (let column = 0; column < columns - 1; column++) {
    const a = row * columns + column, b = a + 1, c = a + columns, d = c + 1;
    front.push(...(upwards ? [a, b, c, b, d, c] : [a, c, b, b, c, d]));
  }
  const indices = [...front], edges = new Map<string, [number, number]>();
  for (let index = 0; index < front.length; index += 3) {
    const triangle = front.slice(index, index + 3);
    indices.push(triangle[2]! + count, triangle[1]! + count, triangle[0]! + count);
    for (let edge = 0; edge < 3; edge++) { const a = triangle[edge]!, b = triangle[(edge + 1) % 3]!; if (!edges.delete(`${b},${a}`)) edges.set(`${a},${b}`, [a, b]); }
  }
  for (const [a, b] of edges.values()) indices.push(a, b + count, b, a, a + count, b + count);
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function leveedLavaChannel(): ModelPart[] {
  const cross = [[-8.5, 0], [-6.5, 1], [-4.5, 2.8], [-3.3, 3.2], [-2.5, 0.8], [-2.2, 0], [2.2, 0], [2.5, 0.8], [3.3, 3.2], [4.5, 2.8], [6.5, 1], [8.5, 0]];
  const top: Point3[] = [];
  for (let section = 0; section < 7; section++) {
    const z = -21 + section * 7, bend = Math.sin(z * 0.07) * 1.2, bed = 3.3 - (z + 21) * 0.07;
    for (let point = 0; point < cross.length; point++) {
      const [x, height] = cross[point]!;
      top.push({ x: bend + x!, y: point === 0 || point === cross.length - 1 ? 0.13 : bed + height!, z });
    }
  }
  const parts = [closedGrid("无顶流道与两侧由溢流堆高的连续熔岩堤", "#879385", top, top.map(point => ({ ...point, y: 0 })), cross.length)];
  for (const side of [-1, 1]) for (let tongue = 0; tongue < 3; tongue++) {
    const z = -10 + tongue * 10, bend = Math.sin(z * 0.07) * 1.2, bed = 3.3 - (z + 21) * 0.07;
    const path = [[side * 3.4, bed + 3.15], [side * 4.8, bed + 2.58], [side * 6.5, bed + 1.02], [side * 8.1, 0.145 + (bed + 0.87) * 0.2]];
    const ribbon: Point3[] = [];
    path.forEach(([x, y], row) => { for (const edge of [-1, 1]) ribbon.push({ x: bend + x!, y: y! + 0.045, z: z + row * 0.25 + edge * (0.34 - row * 0.055) }); });
    parts.push(closedGrid("越过堤顶并凝结在外坡上的实厚溢流舌", "#929d89", ribbon, ribbon.map(point => ({ ...point, y: point.y - 0.12 })), 2));
  }
  return parts;
}

function oceanEntryLavaDelta(): ModelPart[] {
  const foundation: Point3[] = [];
  for (let row = 0; row < 7; row++) {
    const z = -18 + row * 6, width = 9 + row * 2.5;
    for (let column = 0; column < 11; column++) {
      const u = -1 + column / 5;
      const height = (7 - (z + 18) * 0.12) * (1 - u * u * 0.25);
      foundation.push({ x: u * width, y: height, z });
    }
  }
  const cover = foundation.map(point => ({ ...point, y: point.y + 0.38 + Math.sin(point.x * 0.25) * 0.055 }));
  const parts = [closedGrid("向原海岸以外堆积的火山碎屑承托基底", "#a0a68e", foundation, foundation.map(point => ({ ...point, y: 0 })), 11), closedGrid("盖在碎屑堆上的连续凝固熔岩流层", "#7c8c80", cover, foundation.map(point => ({ ...point })), 11)];
  const blocks: ModelPart[] = [];
  for (let index = 0; index < 18; index++) blocks.push(lobe("三角洲前缘露出的棱角火山碎块", index % 2 ? "#969f89" : "#899780", [-22 + index * 2.55, 0.7 + index % 3 * 0.6, 18.08], [1.6, 1.2, 1.6], [0, index * 37, index % 3 * 12]));
  parts.push(combineMeshes("新生陆段前缘碎屑基底的外露火山块", "#969f89", blocks));
  return parts;
}

// https://www.usgs.gov/media/images/kilauea-volcano-lava-levees
// https://www.usgs.gov/publications/development-structure-and-behavior-a-perched-lava-channel-kilauea-volcano-hawaii
// https://www.usgs.gov/news/volcano-watch-what-do-we-call-new-land-kilauea-volcanos-ocean-entries
// https://pubs.usgs.gov/pp/pp1676/pp1676.pdf
export const geologicStructureExpansionBatchSixDesigns: MasterNatureDesign[] = [
  design("leveedOpenLavaChannel", "敞口熔岩流道高侧堤", "岩石", leveedLavaChannel, ["Leveed lava channel", "敞口低槽与高堤", "堤外凝固溢流舌", "凝固熔岩地貌"]),
  design("solidifiedOceanEntryLavaDelta", "凝固熔岩入海三角洲", "岩石", oceanEntryLavaDelta, ["Lava delta", "火山碎屑基底与叠覆熔岩流", "凝固新增陆段", "大型海岸地貌"]),
];
