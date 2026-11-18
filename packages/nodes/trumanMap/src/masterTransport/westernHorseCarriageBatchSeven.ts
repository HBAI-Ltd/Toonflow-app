import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, strut, type TransportDefinition } from "./parts";
import { compactCarriageGear } from "./westernHorseCarriageBatchTwo";

// 原创童话车体：南瓜壳就是完整空舱，不是把南瓜载荷堆到旧客车上。
const pumpkin = "#c48b50", gold = "#b9a66f", dark = "#4d4b3c", leather = "#765847", green = "#70875b";

function pumpkinPoint(row: number, column: number, inset = 0): Triple {
  const phi = (row + 1) * Math.PI / 8, theta = column * Math.PI / 16, lobe = 1 + Math.cos(theta * 8) * 0.085;
  return [Math.cos(theta) * Math.sin(phi) * (1.12 - inset) * lobe, 2.12 + Math.cos(phi) * (1.3 - inset), Math.sin(theta) * Math.sin(phi) * (1.35 - inset) * lobe];
}

function pumpkinWall(name: string, color: string, keeps: (row: number, column: number) => boolean, poles: boolean, inset: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], outer: number[] = [], indices: number[] = [], edges = new Map<string, [number, number]>();
  for (const depth of [0, inset]) {
    for (let row = 0; row < 7; row++) for (let column = 0; column < 32; column++) { const [x, y, z] = pumpkinPoint(row, column, depth); vertices.push({ x, y, z }); }
    vertices.push({ x: 0, y: 3.42 - depth, z: 0 }, { x: 0, y: 0.82 + depth, z: 0 });
  }
  for (let row = 0; row < 6; row++) for (let column = 0; column < 32; column++) if (keeps(row, column)) {
    const a = row * 32 + column, b = row * 32 + (column + 1) % 32, c = (row + 1) * 32 + (column + 1) % 32, d = (row + 1) * 32 + column;
    outer.push(a, b, c, a, c, d);
  }
  if (poles) for (let column = 0; column < 32; column++) { const next = (column + 1) % 32; outer.push(224, next, column, 225, 192 + column, 192 + next); }
  for (let index = 0; index < outer.length; index += 3) {
    const [a, b, c] = outer.slice(index, index + 3) as Triple;
    indices.push(a, b, c, c + 226, b + 226, a + 226);
    for (const [start, end] of [[a, b], [b, c], [c, a]]) if (!edges.delete(`${end},${start}`)) edges.set(`${start},${end}`, [start!, end!]);
  }
  for (const [a, b] of edges.values()) indices.push(a, b + 226, b, a, a + 226, b + 226);
  const referenced = [...new Set(indices)], remap = new Map(referenced.map((value, index) => [value, index]));
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices: referenced.map(index => vertices[index]!), indices: indices.map(index => remap.get(index)!) });
}

function openingRim(name: string, firstRow: number, lastRow: number, firstColumn: number, lastColumn: number): ModelPart {
  const points: Triple[] = [];
  for (let column = firstColumn; column <= lastColumn; column++) points.push(pumpkinPoint(firstRow, column));
  for (let row = firstRow + 1; row <= lastRow; row++) points.push(pumpkinPoint(row, lastColumn));
  for (let column = lastColumn - 1; column >= firstColumn; column--) points.push(pumpkinPoint(lastRow, column));
  for (let row = lastRow - 1; row >= firstRow; row--) points.push(pumpkinPoint(row, firstColumn));
  return part(name, "tube", gold, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.025, path: points.map(([x, y, z]) => ({ x, y, z })) });
}

export const westernHorseCarriageBatchSeven: TransportDefinition[] = [
  { name: "空心舱弧窗藤架童话南瓜马车", theme: "奇幻", tags: ["马车", "影视", "童话奇幻", "南瓜空舱马车", "完整藤形车架"], create: () => {
    const inDoor = (row: number, column: number) => row >= 1 && row < 5 && [30, 31, 0, 1].includes(column);
    const inWindow = (row: number, column: number) => row >= 2 && row < 4 && ((column >= 6 && column < 10) || (column >= 14 && column < 18) || (column >= 22 && column < 26));
    const shell = pumpkinWall("南瓜分瓣薄壳本身围成可进入且真正留门窗孔的空舱", pumpkin, (row, column) => !inDoor(row, column) && !inWindow(row, column), true, 0.055);
    const floor = polygon("顺瓜舱底部曲面向下收窄的实际内地板", dark, [[-0.2, -0.62], [0.2, -0.62], [0.52, -0.24], [0.52, 0.24], [0.2, 0.62], [-0.2, 0.62], [-0.52, 0.24], [-0.52, -0.24]], 0.12, [0, 1.02, 0]);
    floor.vertices!.forEach(p => { const factor = 0.67 + p.y / 0.12 * 0.33; p.x *= factor; p.z *= factor; });
    const parts: ModelPart[] = [...compactCarriageGear(-1.6, 1.55, 0.6, 0.8, 2), shell, floor, openingRim("右侧登舱口沿实际壳边连续闭合的藤金包缘", 1, 5, 30, 34), part("从南瓜顶端实际生出的弯曲短瓜梗", "tube", green, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.075, path: [{ x: 0, y: 3.38, z: 0 }, { x: 0.1, y: 3.7, z: 0.08 }, { x: 0.02, y: 3.92, z: 0.17 }] }), box("南瓜舱前方独立车夫坐垫", [0, 1.65, -1.8], [1.2, 0.12, 0.48], leather), box("前车夫座后面的短靠背", [0, 1.87, -1.55], [1.2, 0.35, 0.065], gold), box("独立前车夫座前沿的完整脚踏", [0, 1.2, -2.02], [1.15, 0.1, 0.35], dark), strut("前第五轮转向桥实接的长牵引辕", [0, 0.715, -1.6], [0, 0.85, -4], 0.12, dark), box("前端供成对挽具使用的完整横轭", [0, 0.85, -3.85], [1.65, 0.11, 0.15], gold), box("登南瓜舱的外侧低踏板", [1.05, 0.83, 0], [0.5, 0.09, 0.6], gold), box("近舱口第二级窄踏板", [0.85, 1.05, 0], [0.35, 0.09, 0.6], gold)];
    for (const firstColumn of [6, 14, 22]) {
      const pane = pumpkinWall("嵌在实际弧窗开口中的独立曲面薄玻璃", "#99b5b0", (row, column) => row >= 2 && row < 4 && column >= firstColumn && column < firstColumn + 4, false, 0.018);
      pane.opacity = 0.24;
      parts.push(pane, openingRim("曲面玻璃周边与南瓜实壳相连的细金窗框", 2, 4, firstColumn, firstColumn + 4));
    }
    for (const side of [-1, 1]) {
      parts.push(box("南瓜底部前后桥之间的实际承载长梁", [side * 0.5, 0.95, 0], [0.14, 0.14, 3.6], dark), box("接到第五轮且避开王销的半幅前承枕", [side * 0.35, 0.94, -1.6], [0.45, 0.08, 0.2], gold));
      for (const end of [-1, 1]) {
        const column = side > 0 ? end > 0 ? 2 : 30 : end > 0 ? 14 : 18, contact = pumpkinPoint(4, column);
        parts.push(part("底梁上实际攀接南瓜门窗下壳边的完整弯藤承柱", "tube", gold, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.05, path: [{ x: side * 0.5, y: 1, z: end * 1.1 }, { x: side * 0.68, y: 1.2, z: end * 0.9 }, { x: side * 0.88, y: 1.4, z: end * 0.7 }, { x: contact[0], y: contact[1], z: contact[2] }] }));
      }
      for (const z of [-1.94, -1.66]) parts.push(strut("独立前驾座真正落到底架前部的座腿", [side * 0.5, 1.01, -1.6], [side * 0.5, 1.59, z], 0.07, gold));
      parts.push(strut("车夫脚踏实际接到前座斜腿中段的短撑", [side * 0.5, 1.3, -1.77], [side * 0.5, 1.2, -2.02], 0.06, gold));
      for (const z of [-0.2, 0.2]) parts.push(box("由瓜壳内底实际承托收窄内地板的短木墩", [side * 0.22, 0.97, z], [0.1, 0.16, 0.1], dark));
    }
    for (const z of [-0.35, 0.35]) parts.push(box("南瓜空舱内两条面对面座位的落地座箱", [0, 1.3, z], [1.1, 0.32, 0.35], dark), box("舱内面对面长座的完整坐垫", [0, 1.52, z], [1.12, 0.12, 0.35], leather), box("舱内两座靠在瓜舱内侧的独立软背", [0, 1.8, z + Math.sign(z) * 0.2], [1.12, 0.5, 0.06], leather));
    for (const z of [-0.18, 0.18]) parts.push(strut("外低踏板实际接到底架的斜托", [0.5, 0.95, z], [1.05, 0.875, z], 0.055, gold));
    for (const z of [-0.18, 0.18]) parts.push(strut("近舱口第二级踏板实际接到底架的独立斜撑", [0.5, 0.97, z], [0.85, 1.05, z], 0.055, gold));
    return parts;
  } },
];
