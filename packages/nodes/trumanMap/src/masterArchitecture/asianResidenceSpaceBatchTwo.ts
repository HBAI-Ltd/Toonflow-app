import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, design, rail } from "./structures";

const stone = "#a9a799", timber = "#87745c", earth = "#b7ae93";

export const asianResidenceSpaceBatchTwoDesigns = [design(
  "收分厚墙平顶石碉住宅",
  "四面向上收分的厚石围墙保留贯通门窗，三层木楼面与屋顶晒台沿内梯连接，内柱与横梁共同承住楼板，顶层女儿墙围出可站立平屋面",
  () => batteredStoneResidence(), "建筑", "中式",
)];

function wall(side: number): ModelPart {
  const top = 9.34, holes: [number, number][][] = [];
  if (side === 0) holes.push([[-0.65, 0.34], [0.65, 0.34], [0.65, 2.65], [-0.65, 2.65]]);
  for (const level of side === 0 ? [1, 2] : [0, 1, 2]) for (const x of [-1.75, 1.75]) {
    const y = 1.3 + level * 3;
    holes.push([[x - 0.34, y], [x + 0.34, y], [x + 0.34, y + 0.95], [x - 0.34, y + 0.95]]);
  }
  const mesh = polygon("向上收分并有真实贯通门窗的厚石围墙", stone, [[-3.791, 0.18], [3.791, 0.18], [3.8 - top * 0.05, top], [-3.8 + top * 0.05, top]], 0.45, [0, 0, 0], holes);
  const points = mesh.vertices!.map(({ x, y: thickness, z: height }) => {
    const radius = 3.8 - height * 0.05;
    if (side === 0) return { x, y: height, z: -radius + thickness };
    if (side === 1) return { x: radius - thickness, y: height, z: x };
    if (side === 2) return { x: -x, y: height, z: radius - thickness };
    return { x: -radius + thickness, y: height, z: -x };
  });
  // 坐标从水平板转换成直立收分墙会翻转手性；按面展开并反绕序，保留窗边硬法线。
  const vertices = [];
  for (let index = 0; index < mesh.indices!.length; index += 3) for (const offset of [0, 2, 1]) vertices.push(points[mesh.indices![index + offset]!]!);
  return part(mesh.name, "mesh", stone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices: vertices.map((_, index) => index) });
}

function batteredStoneResidence(): ModelPart[] {
  const parts: ModelPart[] = [box("厚石住宅整体落地基台", 0, 0.09, 0, 8.4, 0.18, 8.4, stone), box("底层内室连续平整地面", 0, 0.26, 0, 6.72, 0.16, 6.72, earth), ...[0, 1, 2, 3].map(wall)];
  for (let level = 1; level <= 3; level++) {
    const top = 0.34 + level * 3, half = level === 3 ? 3.6 : 3.8 - top * 0.05 - 0.43;
    const slab = polygon("给内梯留下真实贯通孔的木楼面及屋顶晒台", level === 3 ? earth : timber, [[-half, -half], [half, -half], [half, half], [-half, half]], 0.16, [0, top - 0.16, 0], [[[-2.25, -1.35], [-1.15, -1.35], [-1.15, 1.35], [-2.25, 1.35]]]);
    slab.vertices = slab.indices!.map(index => slab.vertices![index]!);
    slab.indices = slab.vertices.map((_, index) => index);
    parts.push(slab, box("上层楼梯末端搭接楼面孔边的木平台", -1.7, top - 0.04, 1.3, 1.1, 0.08, 0.3, timber), box("从内柱横向接到厚石墙的承楼梁", 0, top - 0.27, 0, (3.8 - top * 0.05 - 0.43) * 2, 0.22, 0.2, timber));
  }
  parts.push(cylinder("从地坪连续承到晒台下的内室通高木柱", 0.7, 4.75, 0, 0.25, 8.82, timber));
  for (let level = 0; level < 3; level++) {
    const floor = 0.34 + level * 3;
    for (let step = 0; step < 12; step++) parts.push(box("内梯逐级连接楼层的独立木踏板", -1.7, floor + (step + 1) * 0.25 - 0.035, -1.12 + step * 0.2, 1, 0.07, 0.2, timber));
    for (const side of [-1, 1]) parts.push(
      rail([-1.7 + side * 0.43, floor + 0.05, -1.22], [-1.7 + side * 0.43, floor + 2.95, 1.18], 0.12, timber),
      rail([-1.7 + side * 0.56, floor + 1, -1.22], [-1.7 + side * 0.56, floor + 3.9, 1.18], 0.055, timber),
      box("内梯口扶手实际落在楼面上的竖木", -1.7 + side * 0.56, floor + 0.5, -1.22, 0.065, 1, 0.065, timber),
    );
  }
  for (const side of [-1, 1]) parts.push(box("晒台两侧连续厚石女儿墙", side * 3.48, 9.765, 0, 0.24, 0.85, 7.2, stone), box("晒台前后连续厚石女儿墙", 0, 9.765, side * 3.48, 7.2, 0.85, 0.24, stone));
  return parts;
}
