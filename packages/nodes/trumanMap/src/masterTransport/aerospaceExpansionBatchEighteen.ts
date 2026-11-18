import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon, tapered } from "../masterNature/shared";
import { cylinderBetween } from "./aerospaceExpansionBatchFour";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 遮星载体的花瓣只表达公开构型；不声称该场景轮廓具备实际光学消光性能。
// https://www.nasa.gov/universe/starshade-would-take-formation-flying-to-extremes/
// https://science.nasa.gov/mission/webb/webbs-sunshield/
// https://www.nasa.gov/wp-content/uploads/2022/06/508318main_iss_ref_guide_nov2010.pdf
export const aerospaceExpansionBatchEighteen: TransportDefinition[] = [
  { name: "花瓣边缘自由编队遮星飞行器", theme: "科幻", tags: ["独立遮星航天器", "连续花瓣外轮廓", "展开承力背肋", "自由编队概念飞行器"], create: () => {
    const outline: [number, number][] = [];
    for (let index = 0; index < 20; index++) {
      const a = index * Math.PI / 10;
      outline.push([Math.cos(a - Math.PI / 20) * 10, Math.sin(a - Math.PI / 20) * 10]);
      for (const [radius, tangent] of [[12, -1.5], [16, -0.85], [19, -0.25], [20, 0], [19, 0.25], [16, 0.85], [12, 1.5]]) outline.push([Math.cos(a) * radius! - Math.sin(a) * tangent!, Math.sin(a) * radius! + Math.cos(a) * tangent!]);
    }
    const parts: ModelPart[] = [polygon("中央实心遮光区与周向尖花瓣合为一体的连续薄膜屏", transportColors.dark, outline, 0.04, [0, 2.98, 0]), ring("连续连接各片花瓣背肋根部的周向展开承圈", transportColors.body, 10, 0.12, 2.93, 0.12), cylinder("遮星薄膜背后的自由飞行载荷与姿态控制舱", [0, 1.25, 0], [3.0, 2.5, 3.0], transportColors.body), cylinder("控制舱与遮光屏之间的轴向承力短颈", [0, 2.75, 0], [0.5, 0.6, 0.5], transportColors.dark)];
    for (let index = 0; index < 20; index++) {
      const a = index * Math.PI / 10;
      parts.push(strut("从周向展开承圈托住完整尖花瓣的细长背肋", [Math.cos(a) * 9.9, 2.97, Math.sin(a) * 9.9], [Math.cos(a) * 19.6, 2.97, Math.sin(a) * 19.6], 0.05));
    }
    for (let index = 0; index < 8; index++) {
      const a = index * Math.PI / 4;
      parts.push(strut("自由飞行舱至大直径展开承圈的背部承力撑", [Math.cos(a) * 1.4, 2.2, Math.sin(a) * 1.4], [Math.cos(a) * 9.95, 2.95, Math.sin(a) * 9.95], 0.08));
    }
    for (const side of [-1, 1]) parts.push(box("位于遮光屏背侧的飞行舱供电翼", [side * 3.0, 1.4, 0], [3.0, 0.08, 1.8], "#496e82"), strut("控制舱至背侧供电翼的固定展开梁", [side * 1.4, 1.4, 0], [side * 3.0, 1.4, 0], 0.12), ring("飞行舱侧方沿横向布置的真实姿态喷口", transportColors.dark, 0.1, 0.035, 0, 0.2, { position: { x: side * 1.6, y: 0.7, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }), ring("飞行舱前后侧沿纵向布置的真实姿态喷口", transportColors.dark, 0.1, 0.035, 0, 0.2, { position: { x: 0, y: 0.7, z: side * 1.6 }, rotation: { x: 90, y: 0, z: 0 } }));
    return parts;
  } },
  { name: "展臂张索多层菱形航天遮阳屏总成", theme: "科幻", itemType: "构件", tags: ["独立航天遮阳屏", "多层分离柔性薄膜", "展臂与张索", "真实中央设备开孔"], create: () => {
    const outline: [number, number][] = [[0, -11], [5.8, -4], [6.1, 2], [0, 10.5], [-6.1, 2], [-5.8, -4]], opening: [number, number][] = [[-1.0, -1.1], [1.0, -1.1], [1.0, 1.1], [-1.0, 1.1]];
    const parts: ModelPart[] = [box("多层屏中央保留接口空间的封闭展开设备模块", [0, 1.25, 0], [1.8, 2.5, 2.0], transportColors.body)];
    for (const [x, z] of outline) parts.push(strut("从中央展开模块伸至遮阳屏最大外缘的承力展臂", [0, 0.55, 0], [x, 0.55, z], 0.12), strut("在薄膜外缘分层连接张索的短立向张紧轨", [x, 0.55, z], [x, 1.9, z], 0.045));
    for (let index = 0; index < 5; index++) {
      const y = 0.8 + index * 0.22, layer = outline.map(([x, z]) => [x * (1 - index * 0.03), z * (1 - index * 0.02)] as [number, number]), membrane = polygon("有真实层间间隙与中央设备孔的独立柔性遮阳膜", index % 2 ? "#b7b2a2" : "#d0c6ae", layer, 0.008, [0, y, 0], [opening]); membrane.metalness = 0.65; membrane.roughness = 0.3; parts.push(membrane);
      for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(strut("各薄膜层内孔边缘与中央展开模块之间的短张索", [side * 0.9, y, end * 1.0], [side * 1.0, y, end * 1.1], 0.015, transportColors.dark));
      if (index) for (let corner = 0; corner < outline.length; corner++) parts.push(strut("较小上层薄膜顶点至外缘张紧轨的分层张索", [layer[corner]![0], y, layer[corner]![1]], [outline[corner]![0], y, outline[corner]![1]], 0.015, transportColors.dark));
    }
    return parts;
  } },
  { name: "泵循环铰接硬板航天散热翼总成", theme: "科幻", itemType: "构件", tags: ["独立航天散热翼", "分段铰接硬散热板", "背面连通管网", "跨铰柔性回环管"], create: () => {
    const parts: ModelPart[] = [box("散热翼根部的封闭循环接口与泵控模块", [0, 0.3, -1], [2.0, 0.6, 2.0], transportColors.body)];
    for (const z of [0, 8, 16, 24]) parts.push(cylinder("连接相邻硬散热板并保留折展转轴的横向铰轴", [0, 1.2, z], [0.24, 6.4, 0.24], transportColors.dark, [0, 0, 90]));
    for (let index = 0; index < 3; index++) {
      const center = 4 + index * 8, start = index * 8 + 0.3, end = index * 8 + 7.7;
      parts.push(box("通过铰轴连接而不混作柔性电池毯的硬质散热面板", [0, 1.2, center], [6.0, 0.06, 7.7], "#c7cdca"));
      for (const side of [-1, 1]) parts.push(box("硬散热板两侧实际接触面板的承力边框", [side * 3.05, 1.2, center], [0.12, 0.14, 7.76], transportColors.body), cylinderBetween("散热板背侧连续连接进出端的纵向总管", [side * 2.8, 1.1, start], [side * 2.8, 1.1, end], 0.15, transportColors.dark));
      for (const z of [center - 3.88, center + 3.88]) parts.push(box("散热板端缘将左右边框接到铰轴的横向承力条", [0, 1.2, z], [6.1, 0.14, 0.12], transportColors.body));
      for (const z of [center - 3.3, center + 3.3]) parts.push(cylinderBetween("连接背面纵向总管与多条细支管的横向汇管", [-2.8, 1.1, z], [2.8, 1.1, z], 0.15, transportColors.dark));
      for (const x of [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]) parts.push(cylinderBetween("与硬散热板背面接触且接入两端汇管的细支管", [x, 1.155, center - 3.3], [x, 1.155, center + 3.3], 0.05, transportColors.body));
    }
    for (const side of [-1, 1]) {
      parts.push(strut("循环模块至首段散热翼铰轴的实际承载叉臂", [side * 0.8, 0.5, -0.8], [side * 2.9, 1.2, 0], 0.14), tapered("将根部循环模块接到首段板总管且避开铰轴的弯接管", transportColors.dark, [[side * 0.5, 0.5, -0.8], [side * 2.8, 0.65, 0.25], [side * 2.8, 1.1, 0.3]], [0.075, 0.075, 0.075]), ring("循环接口模块前方可见的真实空心介质接头", transportColors.dark, 0.15, 0.05, 0, 0.3, { position: { x: side * 0.5, y: 0.35, z: -2.1 }, rotation: { x: 90, y: 0, z: 0 } }));
      for (const z of [8, 16]) {
        const path: Triple[] = [[side * 2.8, 1.1, z - 0.3], [side * 2.8, 0.85, z - 0.22], [side * 2.8, 0.65, z - 0.13], [side * 2.8, 0.65, z + 0.13], [side * 2.8, 0.85, z + 0.22], [side * 2.8, 1.1, z + 0.3]];
        parts.push(tapered("连接相邻板总管并从铰轴下方绕过的柔性回环管", transportColors.dark, path, path.map(() => 0.075)));
      }
    }
    return parts;
  } },
];
