import { BoxGeometry } from "three";
import { part, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, wheel, transportColors, type TransportDefinition } from "./parts";

function conveyorFlights(): ModelPart[] {
  const source = new BoxGeometry(2.15, 0.1, 0.075), positions = source.getAttribute("position"), parts: ModelPart[] = [];
  try {
    for (let start = 0; start < 23; start += 12) {
      const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
      for (let flight = start; flight < Math.min(start + 12, 23); flight++) {
        const offset = vertices.length;
        for (let index = 0; index < positions.count; index++) vertices.push({ x: positions.getX(index), y: positions.getY(index) + 0.93, z: positions.getZ(index) - 3.5 + flight * 7 / 22 });
        for (const index of source.index!.array) indices.push(offset + index);
      }
      parts.push(part("贯穿开放运料槽的独立横向刮板硬面合批", "mesh", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
    }
  } finally { source.dispose(); }
  return parts;
}

// 低位整车中轴本身就是可卸料的贯通刮板槽，并以侧卷筒管理电缆，非自卸矿车换货厢。
// https://www.komatsu.com/en-us/products/equipment/room-and-pillar/shuttle-cars
export const roadExpansionBatchTwentyThree: TransportDefinition[] = [
  { name: "侧卷缆供电低矮贯通刮板运煤梭车", theme: "现代", tags: ["井下运煤梭车", "中轴刮板连续卸料槽", "低位侧驾驶室与自动收缆筒"], create: () => {
    const parts: ModelPart[] = [
      box("贯通车体且不作倾翻的开放运料槽底板", [0, 0.8, 0], [2.2, 0.12, 6.8], transportColors.dark),
      ...conveyorFlights(),
      box("低位侧司机室的独立承载底板", [-1.6, 0.35, 0], [0.75, 0.1, 1.5], transportColors.body),
      box("司机低位座垫下的实际承托座", [-1.65, 0.49, 0.1], [0.35, 0.18, 0.38], transportColors.dark),
      box("适用于低净空侧舱的司机座垫", [-1.65, 0.64, 0.1], [0.44, 0.12, 0.45], transportColors.dark),
      box("低位司机座的靠背", [-1.65, 0.95, 0.3], [0.44, 0.5, 0.08], transportColors.dark),
      box("司机侧舱的独立防落物顶盖", [-1.6, 1.65, 0], [0.8, 0.08, 1.45], transportColors.body),
      box("安装在侧舱前柱之间的低位驾驶操纵台", [-1.6, 0.87, -0.55], [0.64, 0.35, 0.24], transportColors.signal),
      cylinder("储缆卷筒中部承接电缆卷的实心筒体", [1.55, 0.9, 0], [0.56, 0.6, 0.56], transportColors.dark, [0, 0, 90]),
      cylinder("储缆卷筒中间实际缠绕的多层动力电缆", [1.55, 0.9, 0], [0.9, 0.48, 0.9], transportColors.dark, [0, 0, 90]),
      cylinder("电缆卷筒与车体侧框相接的实际主轴", [1.3, 0.9, 0], [0.16, 0.7, 0.16], transportColors.trim, [0, 0, 90]),
      part("从电缆卷切向退出并绕开侧挡盘的随行供电缆", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.025, path: [{ x: 1.78, y: 1.35, z: 0 }, { x: 1.78, y: 1.35, z: 0.7 }, { x: 2.0, y: 0.85, z: 1.0 }, { x: 2.0, y: 0.15, z: 3.4 }, { x: 2.0, y: 0.035, z: 4.9 }] }),
    ];
    for (const side of [-1, 1]) {
      parts.push(box("位于大轮胎内侧的长条承载车架", [side * 1.1, 0.7, 0], [0.2, 0.22, 7.8], transportColors.dark), box("与运料底板接合的低矮连续防撒侧墙", [side * 1.15, 1.29, 0], [0.1, 0.9, 8.0], transportColors.body), box("双链刮板输送机的上行实际链条", [side * 0.65, 0.9, 0], [0.05, 0.06, 7.2], transportColors.dark), box("槽底下方独立返回的实际回程链条", [side * 0.65, 0.56, 0], [0.05, 0.045, 7.2], transportColors.dark));
      for (const z of [-3.6, 3.6]) parts.push(cylinder("双链刮板输送机端部回转链轮", [side * 0.65, 0.73, z], [0.34, 0.12, 0.34], transportColors.trim, [0, 0, 90]));
      parts.push(cylinder("电缆卷筒两端防脱的完整侧挡盘", [1.55 + side * 0.3, 0.9, 0], [1.1, 0.055, 1.1], transportColors.body, [0, 0, 90]));
      for (const end of [-1, 1]) parts.push(strut("侧司机舱实际连接顶盖与地板的支柱", [-1.6 + side * 0.31, 0.4, end * 0.64], [-1.6 + side * 0.31, 1.65, end * 0.64], 0.04, transportColors.dark));
    }
    for (const z of [-2.65, 2.65]) parts.push(box("位于回程刮板链上方的横向承重框梁", [0, 0.7, z], [2.4, 0.2, 0.2], transportColors.dark), ...[-1, 1].flatMap(side => [cylinder("避开中央回程链的独立轮边承重驱动短轴", [side * 1.3, 0.6, z], [0.16, 0.6, 0.16], transportColors.dark, [0, 0, 90]), ...wheel([side * 1.6, 0.6, z], 0.6, 0.5)]));
    for (const end of [-1, 1]) {
      parts.push(strut("司机侧舱地板与主车架连接的斜向承托", [-1.1, 0.7, end * 0.6], [-1.55, 0.4, end * 0.6], 0.13, transportColors.dark), cylinder("端部刮板链轮之间的贯通驱动轴", [0, 0.73, end * 3.6], [0.1, 1.75, 0.1], transportColors.dark, [0, 0, 90]), box("卸料口下方固定两侧链轮轴座的下横梁", [0, 0.46, end * 3.6], [2.4, 0.14, 0.25], transportColors.dark));
      for (const side of [-1, 1]) parts.push(box("避开回程链并把端部链轮轴接到下横梁的轴承座", [side * 0.85, 0.59, end * 3.6], [0.16, 0.22, 0.2], transportColors.body));
    }
    parts.push(cylinder("卸料刮板机构右后侧的独立输送电动机", [1.25, 0.73, 3.6], [0.35, 0.35, 0.35], transportColors.signal, [0, 0, 90]), cylinder("输送电动机通向刮板驱动轴的同轴联接颈", [1.03, 0.73, 3.6], [0.1, 0.4, 0.1], transportColors.trim, [0, 0, 90]));
    return parts;
  } },
];
