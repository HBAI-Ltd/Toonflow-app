import { design, part, polygon } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { prism } from "./geologicStructureExpansionBatchOne";

type Point = [number, number];

function loadFlameOutcrop(): ModelPart[] {
  const contact: Point[] = [[-16, 9.5]];
  for (const center of [-10, 0, 10]) {
    const profile: Point[] = [[center - 5, 9.5], [center - 4, 8.4], [center - 3.2, 5.1], [center - 2.1, 3.9], [center, 3.4], [center + 2.1, 3.9], [center + 3.2, 5.1], [center + 4, 8.4], [center + 5, 9.5]];
    for (const point of profile) { const previous = contact.at(-1)!; if (point[0] !== previous[0] || point[1] !== previous[1]) contact.push(point); }
  }
  contact.push([16, 9.5]);
  return [prism("向上挤入负载囊叶之间并形成窄尖舌的轻软底层", "#a8ad95", [[-16, 0], [16, 0], ...contact.slice().reverse()], 14), prism("始终连在上方砂层而向下垂入的宽圆负载囊叶", "#bdb295", [...contact, [16, 14], [-16, 14]], 14)];
}

function shatterConeFace(): ModelPart[] {
  const rows = 6, columns = 25, radii = [0.08, 0.65, 1.6, 2.8, 4.1, 5.5], count = rows * columns;
  const vertices: { x: number; y: number; z: number }[] = [];
  for (const back of [false, true]) for (const radius of radii) for (let column = 0; column < columns; column++) {
    const angle = (-60 + column * 5) * Math.PI / 180;
    const branch = Math.max(0, radius - 1.4) / 4.1;
    const ridge = Math.sin(angle * 18) * 0.042 + Math.sin(angle * 36 + radius * 0.25) * branch * 0.018;
    vertices.push({ x: Math.sin(angle) * radius, y: 5 - Math.cos(angle) * radius, z: back ? 3.8 : radius * (0.25 + ridge) });
  }
  const front: number[] = [];
  for (let row = 0; row < rows - 1; row++) for (let column = 0; column < columns - 1; column++) {
    const a = row * columns + column, b = a + 1, c = a + columns, d = c + 1;
    front.push(a, b, c, b, d, c);
  }
  const indices = [...front], edges = new Map<string, [number, number]>();
  for (let index = 0; index < front.length; index += 3) {
    const triangle = front.slice(index, index + 3);
    indices.push(triangle[2]! + count, triangle[1]! + count, triangle[0]! + count);
    for (let edge = 0; edge < 3; edge++) { const a = triangle[edge]!, b = triangle[(edge + 1) % 3]!; if (!edges.delete(`${b},${a}`)) edges.set(`${a},${b}`, [a, b]); }
  }
  for (const [a, b] of edges.values()) indices.push(a, b + count, b, a, a + count, b + count);
  return [part("具有米级锥面与向外分叉马尾沟脊的震裂岩体", "mesh", "#a5ad98", [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices })];
}

function radialDikeCenter(): ModelPart[] {
  const inside = 2.4, outside = 18, halfWidth = 0.3;
  const innerStart = Math.asin(halfWidth / inside), outerStart = Math.asin(halfWidth / outside);
  const innerArc: Point[] = Array.from({ length: 7 }, (_, index) => { const angle = innerStart + index / 6 * (Math.PI / 3 - 2 * innerStart); return [Math.cos(angle) * inside, Math.sin(angle) * inside]; });
  const outerArc: Point[] = Array.from({ length: 7 }, (_, index) => { const angle = outerStart + index / 6 * (Math.PI / 3 - 2 * outerStart); return [Math.cos(angle) * outside, Math.sin(angle) * outside]; });
  const wedge = [...innerArc, ...outerArc.reverse()];
  const parts = [part("连通整个放射薄墙系统的连续中央岩颈", "lathe", "#7d9186", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 2.4, y: 0 }, { x: 2.4, y: 12 }, { x: 2.1, y: 14 }, { x: 1.8, y: 16 }, { x: 0, y: 16 }] })];
  for (let ray = 0; ray < 6; ray++) {
    const wall = polygon("从中央岩颈连续伸出而不闭合成环的径向岩墙", "#7d9186", [[2.35, -0.3], [17.97, -0.3], [17.97, 0.3], [2.35, 0.3]], 13);
    wall.rotation.y = -ray * 60; parts.push(wall);
    for (let layer = 0; layer < 3; layer++) {
      const rock = polygon("被两侧径向岩墙真实截开的原岩扇区层", layer % 2 ? "#b6ad91" : "#a5ae96", wedge, 4, [0, layer * 4, 0]);
      rock.rotation.y = -ray * 60; parts.push(rock);
    }
  }
  return parts;
}

// https://africangroundwateratlas.org/data/vocabularies/dictionary.cfm?name=DIC_SOLE_STRUCTURE
// https://www.amnh.org/exhibitions/permanent/meteorites/meteorite-impacts/earth-impacts/all-craters-great-and-small/shatter-cone
// https://www.usgs.gov/publications/shatter-cones-sierra-madera-texas
// https://geoinfo.nmt.edu/publications/periodicals/litegeology/40/lg_v40.pdf
export const geologicStructureExpansionBatchFiveDesigns: MasterNatureDesign[] = [
  design("loadFlameStructureOutcrop", "负载火焰构造岩壁", "岩石", loadFlameOutcrop, ["Load casts and flame structures", "连层下垂囊叶与轻层尖舌", "大型沉积露头段"]),
  design("shatterConeFractureFace", "震裂锥岩面", "岩石", shatterConeFace, ["Shatter cone", "锥状冲击断口", "马尾放射分叉沟脊"]),
  design("radialDikeIntrusionCenter", "放射岩脉中心露头", "岩石", radialDikeCenter, ["Radial dike center", "中央岩颈与连续放射薄墙", "大型侵入中心露头段"]),
];
