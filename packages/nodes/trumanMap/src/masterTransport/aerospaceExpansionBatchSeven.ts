import { part, type ModelPart } from "../assetModelParts";
import { fuselage, propeller, tail } from "./aircraftModels";
import { airfoil, smallGear } from "./aerospaceExpansionBatchOne";
import { ball, box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

function vectorNozzle(side: number, z: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const radius of [0.2, 0.15]) for (let section = 0; section <= 8; section++) {
    const a = section * Math.PI / 16;
    for (let index = 0; index < 8; index++) { const t = index * Math.PI / 4; vertices.push({ x: side * (0.8 + 0.4 * Math.sin(a)) + radius * Math.cos(t) * Math.sin(a), y: 2.1 - 0.4 * (1 - Math.cos(a)) + radius * Math.cos(t) * side * Math.cos(a), z: z + radius * Math.sin(t) }); }
  }
  for (let layer = 0; layer < 2; layer++) for (let section = 0; section < 8; section++) for (let index = 0; index < 8; index++) {
    const a = layer * 72 + section * 8 + index, b = layer * 72 + section * 8 + (index + 1) % 8;
    const faces = [a, b, b + 8, a, b + 8, a + 8];
    if (layer) for (let i = 0; i < faces.length; i += 3) [faces[i + 1], faces[i + 2]] = [faces[i + 2]!, faces[i + 1]!];
    indices.push(...faces);
  }
  for (let index = 0; index < 8; index++) {
    const next = (index + 1) % 8;
    indices.push(index, index + 72, next + 72, index, next + 72, next, 64 + index, 64 + next, 136 + next, 64 + index, 136 + next, 136 + index);
  }
  return part("内外壁独立且两端贯通的四分之一弯矢量喷口", "mesh", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// 原创静态完整载体，只采用公开的升力/反扭矩构型，不含武器或动力仿真。
// https://boeing.mediaroom.com/1999-02-19-Boeing-Completes-Sale-Of-Light-Helicopter-Product-Lines-To-RDM
// https://www.lockheedmartin.com/en-us/products/x2-technology.html
// https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/vectored-thrust/
export const aerospaceExpansionBatchSeven: TransportDefinition[] = [
  { name: "尾梁喷流反扭矩无尾桨直升机", theme: "现代", tags: ["无尾桨直升机", "尾梁喷流", "连续狭缝与侧向喷口"], create: () => {
    const outer = Array.from({ length: 15 }, (_, index) => { const a = 0.045 + index / 14 * (Math.PI * 2 - 0.09); return { x: Math.cos(a) * 0.29, y: Math.sin(a) * 0.29 }; });
    const inner = Array.from({ length: 15 }, (_, index) => { const a = 0.045 + (14 - index) / 14 * (Math.PI * 2 - 0.09); return { x: Math.cos(a) * 0.25, y: Math.sin(a) * 0.25 }; });
    const parts: ModelPart[] = [fuselage(8.2, 2.2, 1.8), ball("前机身的大面积双座透明风挡", [0, 2.25, -2.45], [1.65, 1.25, 1.6], transportColors.glass), cylinder("主旋翼减速箱上方的竖直主桅", [0, 3.34, 0.15], [0.22, 1.35, 0.22], transportColors.dark), cylinder("单层主旋翼承力桨毂", [0, 4.08, 0.15], [0.64, 0.2, 0.64], transportColors.body), part("沿右侧留有真实狭缝的中空送风尾梁", "extrude", transportColors.body, [0, 2.3, 4.7], [1, 1, 1], [0, 0, 0], { depth: 4.4, profile: [...outer, ...inner] }), box("尾端侧喷导流罩上壁", [0.1, 2.58, 7.05], [0.8, 0.06, 0.6], transportColors.dark), box("尾端侧喷导流罩下壁", [0.1, 2.02, 7.05], [0.8, 0.06, 0.6], transportColors.dark), box("尾端侧喷导流罩封闭背壁", [0.1, 2.3, 7.34], [0.8, 0.55, 0.06], transportColors.dark), box("尾端导流罩与喷口相对的封闭侧壁", [-0.29, 2.3, 7.05], [0.06, 0.55, 0.6], transportColors.dark), airfoil("尾梁后段的水平稳定翼", 2.7, 0.65, [0, 2.65, 5.9]), surface("尾梁上方的竖直稳定鳍", transportColors.signal, [[0, 0, -0.7], [0, 1.5, 0.3], [0, 0, 1]], [0, 1, 2], [0, 2.5, 6.2]), ...smallGear([[-0.95, 1.6, 0.7], [0.95, 1.6, 0.7]], [0, 1.4, -2.2], 0.3)];
    for (let index = 0; index < 5; index++) { const a = index * Math.PI * 2 / 5; parts.push(airfoil("单层主旋翼独立承力桨叶", 5.2, 0.3, [Math.cos(a) * 2.65, 4.08, 0.15 + Math.sin(a) * 2.65], [0, 90 - index * 72, 0])); }
    return parts;
  } },
  { name: "同轴主旋翼推式尾桨复合高速直升机", theme: "现代", tags: ["复合高速旋翼机", "共轴反转主旋翼", "独立巡航推式桨", "承力短翼"], create: () => {
    const parts: ModelPart[] = [fuselage(13.5, 2.2, 2.6), ball("双座并列飞行透明前舱", [0, 3.3, -4.0], [1.65, 1.05, 2.0], transportColors.glass), airfoil("分担高速升力的固定短翼", 7.2, 1.45, [0, 2.8, 0.15]), cylinder("下层主旋翼的外套传动主轴", [0, 4.0, 0], [0.3, 2.0, 0.3], transportColors.dark), cylinder("上层反转旋翼的同心内主轴", [0, 5.2, 0], [0.17, 1.3, 0.17], transportColors.trim), cylinder("从尾身内通至推式尾桨的传动轴罩", [0, 3.0, 6.3], [0.16, 1.75, 0.16], transportColors.body, [90, 0, 0]), ...propeller(0, 3.0, 7.1, 1.5), airfoil("避开尾部推桨的后水平稳定翼", 4.8, 0.85, [0, 2.8, 5.4]), ...smallGear([[-1.15, 2.4, 1.3], [1.15, 2.4, 1.3]], [0, 2.1, -3.8], 0.4)];
    for (const layer of [0, 1]) {
      const y = 4.95 + layer * 0.73;
      parts.push(cylinder("上下分离的反转主旋翼桨毂", [0, y, 0], [0.75, 0.2, 0.75], transportColors.body));
      for (let index = 0; index < 4; index++) { const a = (index * 90 + layer * 45) * Math.PI / 180; parts.push(airfoil("上下错相且不相交的承力主旋翼叶片", 6.8, 0.42, [Math.cos(a) * 3.45, y, Math.sin(a) * 3.45], [0, 90 - index * 90 - layer * 45, 0])); }
    }
    for (const side of [-1, 1]) parts.push(cylinder("后机身上方的动力机匣", [side * 0.68, 3.45, 0.95], [0.65, 2.4, 0.65], transportColors.body, [90, 0, 0]), surface("水平尾翼外侧的垂直稳定鳍", transportColors.signal, [[0, 0, -0.45], [0, 1.3, 0.1], [0, 0, 0.75]], [0, 1, 2], [side * 2.05, 2.75, 5.4]));
    return parts;
  } },
  { name: "四向量喷口水平机身垂直起降喷气机", theme: "现代", tags: ["矢量推力垂直起降", "四个旋转弯喷口", "水平姿态起降"], create: () => {
    const parts: ModelPart[] = [fuselage(14.0, 1.7, 2.05), ball("抬高的单座前方透明舱盖", [0, 2.8, -3.75], [1.1, 0.95, 1.8], transportColors.glass), airfoil("主机翼之后的独立水平安定面", 4.8, 0.85, [0, 2.4, 5.65]), surface("喷气机尾部的高垂直稳定鳍", transportColors.signal, [[0, 0, -1.2], [0, 2.5, 0.25], [0, 0, 1.55]], [0, 1, 2], [0, 2.15, 5.25]), ...smallGear([[0, 1.8, 2.6], [-3.5, 2.0, 1.9], [3.5, 2.0, 1.9]], [0, 1.8, -2.8], 0.24)];
    for (const side of [-1, 1]) {
      parts.push(surface("从高翼根向后下方收分的主翼", transportColors.trim, [[side * 0.7, 2.35, -1.2], [side * 4.5, 2.1, 1.5], [side * 4.3, 2.1, 2.6], [side * 0.7, 2.35, 1.8]], [0, 1, 2, 0, 2, 3]), part("机舱两侧独立的开放发动机进气口", "lathe", transportColors.body, [side * 1.0, 2.25, -2.5], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.42, y: -0.6 }, { x: 0.43, y: 0.6 }, { x: 0.34, y: 0.6 }, { x: 0.33, y: -0.6 }, { x: 0.42, y: -0.6 }] }));
      for (const z of [-0.8, 1.35]) parts.push(vectorNozzle(side, z));
    }
    return parts;
  } },
  { name: "水平大涵道尾部偏流无机翼试验机", theme: "科幻", tags: ["水平轴涵道", "出口可偏流叶板", "无主机翼概念飞行器"], create: () => {
    const parts: ModelPart[] = [part("前后贯通的长轴主动力涵道", "lathe", transportColors.body, [0, 2.3, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 1.9, y: -2.0 }, { x: 2.0, y: -1.5 }, { x: 2.0, y: 1.2 }, { x: 1.7, y: 2.0 }, { x: 1.48, y: 2.0 }, { x: 1.76, y: 1.2 }, { x: 1.76, y: -1.5 }, { x: 1.66, y: -2.0 }, { x: 1.9, y: -2.0 }] }), cylinder("涵道内水平驱动电机和轴承匣", [0, 2.3, -0.25], [0.6, 1.35, 0.6], transportColors.dark, [90, 0, 0]), ...propeller(0, 2.3, -1.0, 1.5), strut("从涵道上方跨过尾部气流的高尾梁", [0, 4.15, 0.5], [0, 3.95, 5.3], 0.15), airfoil("高尾梁末端的水平操纵面", 2.7, 0.85, [0, 3.95, 5.05]), surface("位于气流偏转区上方的垂直尾鳍", transportColors.signal, [[0, 0, -0.6], [0, 1.35, 0.1], [0, 0, 0.85]], [0, 1, 2], [0, 3.9, 5.1])];
    for (let index = 0; index < 4; index++) { const a = index * Math.PI / 2; parts.push(strut("把内电机持在涵道轴心的径向支臂", [Math.cos(a) * 0.25, 2.3 + Math.sin(a) * 0.25, -0.25], [Math.cos(a) * 1.79, 2.3 + Math.sin(a) * 1.79, -0.25], 0.08)); }
    for (const y of [1.5, 2.3, 3.1]) parts.push(box("出口后侧把气流导向下方的偏流板", [0, y, 2.12], [2.7, 0.08, 0.8], transportColors.dark, [30, 0, 0]));
    for (const side of [-1, 1]) for (const z of [-1.2, 1.0]) parts.push(strut("大涵道两侧的外张接地支架", [side * 1.6, 1.15, z], [side * 1.85, 0.22, z], 0.11), cylinder("四点着陆支架的小接地轮", [side * 1.85, 0.22, z], [0.44, 0.2, 0.44], transportColors.dark, [0, 0, 90]));
    return parts;
  } },
];
