import { BoxGeometry, CylinderGeometry } from "three";
import { part, ring, type ModelPart } from "../assetModelParts";
import { combineMeshes, polygon } from "../masterNature/shared";
import { box, cab, cylinder, strut, wheel, transportColors, type TransportDefinition } from "./parts";

function burnerRow(z: number): ModelPart[] {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], faces: ModelPart[] = [];
  for (const x of [-1.02, 0, 1.02]) {
    const pieces = [{ p: [x, 0.64, 0], s: [0.94, 0.06, 1.52] }, { p: [x - 0.455, 0.46, 0], s: [0.03, 0.3, 1.52] }, { p: [x + 0.455, 0.46, 0], s: [0.03, 0.3, 1.52] }, { p: [x, 0.46, -0.745], s: [0.88, 0.3, 0.03] }, { p: [x, 0.46, 0.745], s: [0.88, 0.3, 0.03] }];
    for (const piece of pieces) {
      const geometry = new BoxGeometry(piece.s[0], piece.s[1], piece.s[2]), source = geometry.getAttribute("position"), offset = vertices.length;
      try {
        for (let point = 0; point < source.count; point++) vertices.push({ x: piece.p[0]! + source.getX(point), y: piece.p[1]! + source.getY(point), z: piece.p[2]! + source.getZ(point) });
        for (const index of geometry.index!.array) indices.push(offset + index);
      } finally { geometry.dispose(); }
    }
    const holes: [number, number][][] = [];
    for (const xSlot of [-0.32, -0.16, 0, 0.16, 0.32]) for (const zSlot of [-0.32, 0.32]) holes.push([[xSlot - 0.035, zSlot - 0.11], [xSlot + 0.035, zSlot - 0.11], [xSlot + 0.035, zSlot + 0.11], [xSlot - 0.035, zSlot + 0.11]]);
    faces.push(polygon("保留真实燃烧通气孔的向下陶瓷热面", "#bd8567", [[-0.46, -0.76], [0.46, -0.76], [0.46, 0.76], [-0.46, 0.76]], 0.035, [x, 0.28, 0], holes));
  }
  const face = combineMeshes("三列真实多孔陶瓷热面合批", "#bd8567", faces);
  face.position.z = z;
  return [part("三列保留内部气腔和底开口的薄壁燃烧炉壳合批", "mesh", transportColors.dark, [0, 0, z], [1, 1, 1], [0, 0, 0], { vertices, indices }), face];
}

function burnerBranches(): ModelPart {
  const geometry = new CylinderGeometry(0.0175, 0.0175, 0.22, 6, 1), source = geometry.getAttribute("position"), used = [...new Set(geometry.index!.array)], remap = new Map(used.map((index, offset) => [index, offset])), vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  try {
    for (const z of [-3.0, -1.0, 1.0, 3.0]) for (const x of [-1.02, 0, 1.02]) {
      const offset = vertices.length;
      for (const point of used) vertices.push({ x: x + source.getX(point), y: 0.78 + source.getY(point), z: z + source.getZ(point) });
      for (const index of geometry.index!.array) indices.push(offset + remap.get(index)!);
    }
  } finally { geometry.dispose(); }
  return part("逐个接到十二个燃烧炉气腔的实际分配支管合批", "mesh", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function tankSaddle(x: number, z: number): ModelPart {
  const profile = [{ x: -0.58, y: 0 }, { x: 0.58, y: 0 }, { x: 0.58, y: 0.7 }, ...Array.from({ length: 9 }, (_, index) => { const a = index * Math.PI / 8; return { x: Math.cos(a) * 0.48, y: 0.65 - Math.sin(a) * 0.48 }; }), { x: -0.58, y: 0.7 }];
  return part("按燃气罐真实外圆承托的弧形钢鞍座", "extrude", transportColors.dark, [x, 1.28, z], [1, 1, 1], [0, 0, 0], { depth: 0.2, profile });
}

// 给热再生工序独立预热的完整自行供热设备，不把普通公路车换上燃料罐作为主项。
// https://www.wirtgen-group.com/en-mt/applications/road-construction/road-rehabilitation/hot-recycling/
export const roadExpansionBatchTwentyNine: TransportDefinition[] = [
  { name: "分区燃气红外热面式自行路面预热机", theme: "现代", tags: ["热再生路面预热机", "十二分区底向燃烧热面", "双燃气罐与调压分配回路"], create: () => {
    const pipeHole: [number, number][] = Array.from({ length: 16 }, (_, index) => { const a = index * Math.PI / 8; return [Math.cos(a) * 0.06, -1.3 + Math.sin(a) * 0.06]; });
    const parts: ModelPart[] = [
      ...[-3.0, -1.0, 1.0, 3.0].flatMap(burnerRow), burnerBranches(),
      polygon("双燃气罐下方保留分配立管真实穿孔的承载甲板", transportColors.body, [[-1.5, -1.5], [1.5, -1.5], [1.5, 3.5], [-1.5, 3.5]], 0.12, [0, 1.28, 0], [pipeHole]),
      box("前方司机室与连续长机架接合的地板", [0, 1.32, -4.3], [2.8, 0.16, 1.8], transportColors.body),
      ...cab([0, 1.4, -4.3], [1.5, 1.5, 1.4]),
      box("后动力舱与长机架接合的承载地板", [0, 1.32, 4.5], [2.8, 0.16, 1.6], transportColors.body),
      box("后方驱动预热专车的独立动力机舱", [0, 1.825, 4.5], [1.4, 0.85, 1.4], transportColors.signal),
      box("甲板上与供气管路接合的调压分配控制柜", [0, 1.6, -1.3], [0.55, 0.4, 0.55], transportColors.dark),
      cylinder("调压柜经甲板真实孔口接到下部供气主管的立管", [0, 1.275, -1.3], [0.07, 0.65, 0.07], transportColors.trim),
      cylinder("下部炉组之间连续贯通的燃气分配主管", [0, 0.95, 0], [0.1, 7.0, 0.1], transportColors.dark, [90, 0, 0]),
    ];
    for (const side of [-1, 1]) {
      parts.push(box("贯穿全部独立加热分区的长承载机架", [side * 1.4, 1.2, 0], [0.16, 0.2, 10.8], transportColors.body), part("带连续圆弧封头的卧式燃气承压罐", "lathe", transportColors.body, [side * 0.65, 1.93, 1.2], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -1.9 }, { x: 0.22, y: -1.82 }, { x: 0.42, y: -1.63 }, { x: 0.48, y: -1.43 }, { x: 0.48, y: 1.43 }, { x: 0.42, y: 1.63 }, { x: 0.22, y: 1.82 }, { x: 0, y: 1.9 }] }), cylinder("燃气罐前封头实际伸出的供气阀口", [side * 0.65, 1.93, -0.77], [0.09, 0.18, 0.09], transportColors.trim, [90, 0, 0]), part("燃气罐阀口接到中央调压柜的独立供气软管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.025, path: [{ x: side * 0.65, y: 1.93, z: -0.85 }, { x: side * 0.65, y: 1.6, z: -1.2 }, { x: 0, y: 1.6, z: -1.3 }] }));
      for (const z of [0, 2.4]) parts.push(tankSaddle(side * 0.65, z), ring("把燃气罐实际固定到钢鞍座的外周钢箍", transportColors.dark, 0.5, 0.02, 0, 0.07, { position: { x: side * 0.65, y: 1.93, z }, rotation: { x: 90, y: 0, z: 0 } }));
      for (const z of [-3.0, -1.0, 1.0, 3.0]) parts.push(strut("主机架到燃烧炉横架的实际悬挂承杆", [side * 1.44, 1.2, z], [side * 1.44, 0.75, z], 0.06, transportColors.body));
      for (const z of [-4.3, 4.3]) parts.push(...wheel([side * 1.9, 0.5, z], 0.5, 0.35), strut("位于轮胎内侧并承托车桥的独立支柱", [side * 1.6, 0.5, z], [side * 1.6, 1.15, z], 0.14, transportColors.dark));
    }
    for (const z of [-4.3, 0, 4.3]) parts.push(box("长机架横向接合且高于轮胎包络的承重横梁", [0, 1.15, z], [3.35, 0.14, 0.18], transportColors.dark));
    for (const z of [-4.3, 4.3]) parts.push(cylinder("加热区外侧连接左右轮胎的转场驱动车桥", [0, 0.5, z], [0.12, 3.8, 0.12], transportColors.dark, [0, 0, 90]));
    for (const z of [-3.0, -1.0, 1.0, 3.0]) parts.push(box("实际承托三列炉壳并接到两侧悬杆的横架", [0, 0.75, z], [3.1, 0.16, 0.12], transportColors.dark), cylinder("主管向每排三列炉壳供气的贯通横支管", [0, 0.9, z], [0.06, 2.8, 0.06], transportColors.trim, [0, 0, 90]));
    return parts;
  } },
];
