import { design, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { clipBed, prism } from "./geologicStructureExpansionBatchOne";

const crust = "#879486";
const inner = "#a8af94";

function lavaTree(): ModelPart[] {
  const outline: [number, number][] = Array.from({ length: 16 }, (_, index) => { const angle = index * Math.PI / 8, radius = 2.2 + Math.sin(index * 2.4) * 0.23; return [Math.cos(angle) * radius, Math.sin(angle) * radius]; });
  const hole: [number, number][] = Array.from({ length: 12 }, (_, index) => [Math.cos(index * Math.PI / 6) * 0.45, Math.sin(index * Math.PI / 6) * 0.45]);
  const parts = [polygon("熔岩树周围保留原树腔的凝固流壳", crust, outline, 0.16, [0, 0, 0], [hole]), part("从已排退熔岩流中露出的真实空心树模柱", "lathe", crust, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.6, y: 0 }, { x: 0.8, y: 0.3 }, { x: 0.6, y: 0.9 }, { x: 0.4, y: 2 }, { x: 0.35, y: 3.15 }, { x: 0.25, y: 3.15 }, { x: 0.28, y: 2 }, { x: 0.45, y: 0.9 }, { x: 0.65, y: 0.3 }, { x: 0.45, y: 0 }, { x: 0.6, y: 0 }] })];
  for (let ridge = 0; ridge < 7; ridge++) {
    const angle = ridge * Math.PI * 2 / 7;
    parts.push(tapered("凝壳外缘随树形向上收束的粗糙熔岩棱", "#929e8c", [[Math.cos(angle) * 0.73, 0.3, Math.sin(angle) * 0.73], [Math.cos(angle) * 0.56, 0.92, Math.sin(angle) * 0.56], [Math.cos(angle) * 0.37, 2, Math.sin(angle) * 0.37], [Math.cos(angle) * 0.32, 2.8 + ridge % 3 * 0.1, Math.sin(angle) * 0.32]], [0.065, 0.05, 0.04, 0.01]));
  }
  return parts;
}

function upliftedCrustHalf(side: number): ModelPart {
  const rows = 7, columns = 5, count = rows * columns;
  const vertices: { x: number; y: number; z: number }[] = [];
  for (const offset of [0, -0.22]) for (let row = 0; row < rows; row++) {
    const x = -7.5 + row * 2.5, dome = Math.sqrt(Math.max(0, 1 - (x / 7.5) ** 2)), width = 0.4 + dome * 2.8;
    for (let column = 0; column < columns; column++) {
      const fraction = column / (columns - 1), z = 0.16 + fraction * width;
      vertices.push({ x, y: 0.25 + dome * 2.9 * (1 - fraction ** 1.6) + offset, z: side * z });
    }
  }
  const top: number[] = [];
  for (let row = 0; row < rows - 1; row++) for (let column = 0; column < columns - 1; column++) {
    const a = row * columns + column, b = a + 1, c = a + columns, d = c + 1;
    top.push(a, b, c, b, d, c);
  }
  if (side < 0) for (let index = 0; index < top.length; index += 3) [top[index], top[index + 1]] = [top[index + 1]!, top[index]!];
  const indices = [...top], edges = new Map<string, [number, number]>();
  for (let index = 0; index < top.length; index += 3) {
    const triangle = top.slice(index, index + 3);
    indices.push(triangle[2]! + count, triangle[1]! + count, triangle[0]! + count);
    for (let edge = 0; edge < 3; edge++) { const a = triangle[edge]!, b = triangle[(edge + 1) % 3]!; if (!edges.delete(`${b},${a}`)) edges.set(`${a},${b}`, [a, b]); }
  }
  for (const [a, b] of edges.values()) indices.push(a, b + count, b, a, a + count, b + count);
  return part("中脊张裂后仍连续抬升的一侧厚凝壳", "mesh", crust, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function lavaTumulus(): ModelPart[] {
  const outline: [number, number][] = [[-8.2, -1.4], [-6.7, -3.2], [-2, -4], [3.6, -3.6], [7.7, -1.9], [8.1, 1.2], [6.5, 3.3], [1, 3.9], [-5.7, 3.2], [-8.1, 1.6]];
  return [polygon("承托压力隆起的整片凝固熔岩底壳", crust, outline, 0.14), upliftedCrustHalf(-1), upliftedCrustHalf(1)];
}

function breadcrustBomb(): ModelPart[] {
  const core = lobe("冷凝裂壳下膨胀的连续火山弹内核", inner, [0, 0.75, 0], [1.62, 1.44, 1.44]);
  const template = lobe("火山弹冷壳外形基准", crust, [0, 0, 0], [1.8, 1.6, 1.6]);
  const parts = [core];
  for (let index = 0; index < template.indices!.length; index += 3) {
    const points = template.indices!.slice(index, index + 3).map(i => template.vertices![i]!);
    const outer = points.map(point => ({ x: point.x * 1.8, y: point.y * 1.6, z: point.z * 1.6 }));
    const center = { x: outer.reduce((sum, point) => sum + point.x, 0) / 3, y: outer.reduce((sum, point) => sum + point.y, 0) / 3, z: outer.reduce((sum, point) => sum + point.z, 0) / 3 };
    const inset = outer.map(point => ({ x: point.x * 0.93 + center.x * 0.07, y: point.y * 0.93 + center.y * 0.07, z: point.z * 0.93 + center.z * 0.07 }));
    const vertices = [...inset, ...inset.map(point => ({ x: point.x * 0.91, y: point.y * 0.91, z: point.z * 0.91 }))];
    const indices = [0, 1, 2, 5, 4, 3];
    for (let edge = 0; edge < 3; edge++) { const a = edge, b = (edge + 1) % 3; indices.push(a, b + 3, b, a, a + 3, b + 3); }
    parts.push(part("因内核继续膨胀而分离的实厚冷凝壳片", "mesh", crust, [0, 0.75, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return parts;
}

function crossBeddedSandstone(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let group = 0; group < 3; group++) for (let layer = -7; layer < 12; layer++) {
    const direction = group === 1 ? -1 : 1, low = layer * 1.1;
    const lower: [number, number][] = Array.from({ length: 11 }, (_, index) => { const x = -18 + index * 3.6; return [x, low + direction * 6 * (1 - Math.exp(-(x + 18) / 14))]; });
    const upper = lower.map(([x, y]) => [x, y + 1.1] as [number, number]);
    const profile = clipBed([...lower, ...upper.reverse()], 0, 5).map(([x, y]) => [x, y + group * 5] as [number, number]);
    if (profile.length >= 3) parts.push(prism("在本层组内弯曲倾斜而被上下组界截断的沉积纹层", layer % 2 ? "#c0b08f" : "#ada78d", profile, 14));
  }
  return parts;
}

// https://www.nps.gov/havo/learn/nature/lava-trees.htm
// https://volcanoes.usgs.gov/volcanic_ash/glossary/tumulus.html
// https://npshistory.com/publications/geology/bul/1292/sec3.htm
// https://www.nps.gov/zion/learn/nature/navajo.htm
export const geologicStructureExpansionBatchFourDesigns: MasterNatureDesign[] = [
  design("hollowLavaTreeCast", "熔岩树模柱", "岩石", lavaTree, ["Lava tree", "树体消失后的真实竖腔", "排退熔岩凝壳"]),
  design("inflatedLavaTumulus", "熔岩压力隆起丘", "岩石", lavaTumulus, ["Lava tumulus", "整体抬升的厚流壳", "中脊真张裂"]),
  design("breadcrustVolcanicBomb", "面包皮状火山弹", "岩石", breadcrustBomb, ["Breadcrust bomb", "冷凝裂壳与膨胀内核"]),
  design("crossBeddedSandstoneOutcrop", "交错层理砂岩壁", "岩石", crossBeddedSandstone, ["Cross-bedding", "层组内弯曲倾斜纹层", "大型沉积露头段"]),
];
