import { part, type ModelPart } from "../assetModelParts";
import { ball, box, cylinder, strut, surface, transportColors, wheel, type TransportDefinition } from "./parts";

function liftingBody(): ModelPart {
  const sections = [[-3, 0.06, 0.12, 0.1], [-2.25, 0.78, 0.46, 0], [-0.8, 1.3, 0.69, 0], [1.6, 1.6, 0.62, 0.02], [3, 1.5, 0.56, 0.05]];
  const outline = [[-1, 0], [-0.65, 0.8], [0, 1], [0.65, 0.8], [1, 0], [0.8, -0.7], [0, -0.8], [-0.8, -0.7]];
  const vertices = sections.flatMap(([z, width, height, lift]) => outline.map(([x, y]) => ({ x: x! * width!, y: 1.05 + y! * height! + lift!, z: z! })));
  const indices: number[] = [];
  for (let index = 1; index < 7; index++) indices.push(0, index, index + 1, 32, 32 + index + 1, 32 + index);
  for (let section = 0; section < 4; section++) for (let index = 0; index < 8; index++) {
    const a = section * 8 + index, b = section * 8 + (index + 1) % 8;
    indices.push(a, a + 8, b, b, a + 8, b + 8);
  }
  return part("截面渐变承力升力体", "mesh", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// 水平轴循环变距转子与无翼升力体分别依据公开原理简化，不是制造图。
// https://ntrs.nasa.gov/citations/20160012563
// https://www.nasa.gov/aeronautics/nasa-aircraft/lifting-bodies/
export const experimentalAirModels: TransportDefinition[] = [
  { name: "横轴摆线旋翼试验飞行器", theme: "科幻", tags: ["循环变距", "摆线转子"], create: () => {
    const parts: ModelPart[] = [box("中央电池承力匣", [0, 0.82, 0], [0.62, 0.42, 0.92]), ball("前置航电整流罩", [0, 0.9, -0.5], [0.56, 0.42, 0.43], transportColors.glass)];
    for (const side of [-1, 1]) {
      parts.push(strut("横向驱动轴", [side * 0.25, 0.95, 0], [side * 1.22, 0.95, 0], 0.075), cylinder("偏心变距控制轴", [side * 1.3, 0.95, -0.12], [0.11, 0.64, 0.11], transportColors.signal, [0, 0, 90]));
      for (const x of [side * 0.8, side * 1.6]) parts.push(part("镂空转子端框", "torus", transportColors.dark, [x, 0.95, 0], [1.1, 1.1, 0.065], [0, 90, 0]));
      for (let index = 0; index < 4; index++) {
        const angle = index * Math.PI / 2, y = 0.95 + Math.sin(angle) * 0.55, z = Math.cos(angle) * 0.55;
        parts.push(box("平行横轴的变距翼片", [side * 1.2, y, z], [0.8, 0.025, 0.2], transportColors.trim, [90 + index * 90 + 20 * Math.sin(angle), 0, 0]), strut("偏心变距拉杆", [side * 1.6, 0.95, -0.12], [side * 1.6, y, z], 0.014));
      }
      parts.push(strut("高位侧支脚", [side * 0.25, 0.8, 0], [side * 0.45, 0.08, -0.35], 0.04), strut("后支脚", [side * 0.25, 0.8, 0.3], [side * 0.45, 0.08, 0.45], 0.04), box("落地滑橇", [side * 0.45, 0.04, 0.05], [0.07, 0.08, 1.15], transportColors.dark));
    }
    parts.push(strut("俯仰控制尾梁", [0, 0.85, 0.4], [0, 0.85, 1.2], 0.06), cylinder("尾端俯仰小桨电机", [0, 0.9, 1.2], [0.14, 0.22, 0.14], transportColors.dark), box("尾端俯仰小旋翼", [0, 1.03, 1.2], [0.7, 0.025, 0.08], transportColors.dark));
    return parts;
  } },
  { name: "无翼升力体返回试验机", theme: "科幻", tags: ["升力体", "机身升力", "无主翼"], create: () => {
    const parts: ModelPart[] = [liftingBody(), ball("前置飞行员透明舱盖", [0, 1.57, -1.25], [0.72, 0.58, 1.38], transportColors.glass), box("后体中部减速板", [0, 1.65, 2.25], [1.18, 0.05, 0.82], transportColors.dark)];
    for (const side of [-1, 1]) parts.push(surface("后体外侧稳定鳍", transportColors.signal, [[0, 0, -0.8], [side * 0.35, 1.4, 0.3], [side * 0.18, 0.1, 0.9]], [0, 1, 2], [side * 1.3, 1.25, 2.05]), box("分置尾缘升降副翼", [side * 0.92, 0.97, 3.03], [1.05, 0.08, 0.38], transportColors.trim), strut("主轮缓冲腿", [side * 0.95, 0.85, 1.3], [side * 1.05, 0.19, 1.3], 0.08), ...wheel([side * 1.05, 0.19, 1.3], 0.19, 0.12));
    parts.push(strut("前轮起落支柱", [0, 0.8, -2], [0, 0.16, -2], 0.065), ...wheel([0, 0.16, -2], 0.16, 0.1));
    return parts;
  } },
];
