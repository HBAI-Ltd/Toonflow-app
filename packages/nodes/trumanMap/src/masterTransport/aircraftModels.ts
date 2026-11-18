import { part, type ModelPart } from "../assetModelParts";
import { ball, box, cylinder, strut, surface, transportColors, wheel, type TransportDefinition } from "./parts";

export function fuselage(length: number, diameter: number, y = 1.2): ModelPart {
  return part("流线机身", "lathe", transportColors.body, [0, y, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -length / 2 }, { x: diameter * 0.32, y: -length * 0.36 }, { x: diameter / 2, y: -length * 0.15 }, { x: diameter / 2, y: length * 0.23 }, { x: diameter * 0.24, y: length * 0.42 }, { x: 0, y: length / 2 }] });
}
export function wing(span: number, chord: number, z: number, y: number, delta = false): ModelPart {
  return surface("主承力翼面", transportColors.trim, delta ? [[0, 0, -chord], [span / 2, 0.08, chord * 0.4], [-span / 2, 0.08, chord * 0.4]] : [[-span / 2, 0.08, -chord * 0.25], [span / 2, 0.08, -chord * 0.25], [span * 0.46, 0, chord * 0.5], [-span * 0.46, 0, chord * 0.5]], delta ? [0, 2, 1] : [0, 2, 1, 0, 3, 2], [0, y, z]);
}
export function tail(z: number, y: number, span = 1.8): ModelPart[] {
  return [wing(span, 0.65, z, y), surface("垂直尾鳍", transportColors.signal, [[0, 0, -0.4], [0, 1.1, 0.3], [0, 0, 0.65]], [0, 1, 2], [0, y, z])];
}
export function propeller(x: number, y: number, z: number, radius = 0.6): ModelPart[] {
  return [cylinder("桨毂", [x, y, z], [0.2, 0.25, 0.2], transportColors.dark, [90, 0, 0]), ...[0, 60, 120].map(angle => box("螺旋桨叶", [x, y, z - 0.1], [radius * 2, 0.08, 0.035], transportColors.dark, [0, 0, angle]))];
}
export function landingGear(length: number): ModelPart[] {
  return [...[-1, 1].flatMap(side => [strut("起落架支柱", [side * 0.3, 1, 0], [side * 0.65, 0.25, 0.1], 0.08), ...wheel([side * 0.65, 0.25, 0.1], 0.25, 0.12)]), ...wheel([0, 0.16, -length * 0.3], 0.16, 0.1), strut("前轮支柱", [0, 0.16, -length * 0.3], [0, 1, -length * 0.3], 0.065)];
}

export const aircraftModels: TransportDefinition[] = [
  { name: "三角翼悬挂滑翔架", create: () => [wing(5.8, 2.2, 0, 2.1, true), ...[-1, 1].flatMap(side => [strut("伞翼外梁", [0, 2.1, -2.2], [side * 2.9, 2.18, 0.88], 0.06), strut("三角操纵架", [0, 2.1, -0.2], [side * 0.65, 0.8, -0.2], 0.055)]), box("操纵底横杆", [0, 0.8, -0.2], [1.3, 0.05, 0.06]), strut("翼根龙骨", [0, 2.1, -2.2], [0, 2.1, 0.7], 0.07), box("飞行吊带", [0, 1.35, 0.1], [0.4, 0.2, 1.2], transportColors.signal)] },
  { name: "滑翔伞飞行吊舱", create: () => {
    const parts: ModelPart[] = [box("飞行吊舱坐垫", [0, 0.45, 0], [0.5, 0.25, 0.6], transportColors.dark), box("吊舱高靠背", [0, 0.85, 0.25], [0.5, 0.8, 0.15], transportColors.signal)];
    for (let index = 0; index < 7; index++) { const x = (index - 3) * 0.7, y = 3.8 - Math.abs(index - 3) * 0.15; parts.push(part("矩形翼伞气室", "capsule", index % 2 ? transportColors.trim : transportColors.signal, [x, y, 0], [1.56, 1.45, 1], [90, 0, 0])); for (const z of [-0.4, 0.4]) parts.push(strut("翼伞悬挂伞绳", [x, y - 0.1, z], [x < 0 ? -0.2 : 0.2, 0.9, 0], 0.012)); }
    return parts;
  } },
  { name: "圆伞救生降落伞", create: () => {
    const parts: ModelPart[] = [part("圆伞半球伞衣", "lathe", transportColors.trim, [0, 3.2, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 1.5 }, { x: 0.85, y: 1.35 }, { x: 1.55, y: 0.95 }, { x: 2.05, y: 0.3 }, { x: 2.15, y: 0 }] }), box("救生伞背带", [0, 0.6, 0], [0.35, 0.75, 0.2], transportColors.dark)];
    for (let index = 0; index < 12; index++) { const angle = index * Math.PI / 6; parts.push(strut("辐射伞绳", [Math.cos(angle) * 2.15, 3.2, Math.sin(angle) * 2.15], [Math.cos(angle) * 0.15, 0.9, Math.sin(angle) * 0.1], 0.012)); }
    return parts;
  } },
  { name: "开放座舱自转旋翼机", create: () => [fuselage(3, 0.65, 0.85), ...landingGear(3), box("开放飞行座", [0, 1.15, -0.25], [0.5, 0.25, 0.6], transportColors.signal), strut("自转旋翼主桅", [0, 0.9, 0.5], [0, 2.3, 0.5], 0.12), box("自由旋转主旋翼", [0, 2.36, 0.5], [5.5, 0.065, 0.18], transportColors.dark), ...propeller(0, 1.1, 1.3, 0.55), ...tail(1.3, 1.05, 1.3)] },
  { name: "双发倾转旋翼运输机", create: () => [fuselage(7.5, 1.4, 1.55), wing(7.5, 1.5, 0, 2.1), ...tail(2.9, 1.9, 3), ...landingGear(7.5), ...[-1, 1].flatMap(side => [cylinder("翼端倾转短舱", [side * 3.3, 2.25, 0], [0.65, 1.5, 0.65], transportColors.body), box("倾转旋翼横叶", [side * 3.3, 3.02, 0], [3.2, 0.055, 0.17], transportColors.dark), box("倾转旋翼纵叶", [side * 3.3, 3.02, 0], [0.17, 0.055, 3.2], transportColors.dark)]), box("座舱风挡", [0, 1.85, -2.7], [1.05, 0.6, 0.15], transportColors.glass)] },
  { name: "三角翼超音速客机", create: () => [fuselage(13.5, 1.1, 1.6), wing(7.2, 4.5, 0.8, 1.5, true), ...tail(5.25, 1.65, 1.5), ...landingGear(13.5), ...[-1, 1].flatMap(side => [-0.35, 0.35].map(offset => cylinder("成对翼下喷气机舱", [side * 1.65 + offset, 1, 1.4], [0.45, 2.2, 0.45], transportColors.dark, [90, 0, 0]))), box("狭长驾驶风挡", [0, 1.82, -4.9], [0.75, 0.3, 0.12], transportColors.glass)] },
  { name: "空中加油机", create: () => [fuselage(11.5, 1.6, 2), wing(10.5, 2.7, -0.2, 2.05), ...tail(4.8, 2.15, 4.2), ...landingGear(11.5), ...[-1, 1].flatMap(side => [cylinder("翼下喷气发动机", [side * 2.1, 1.25, 0], [0.95, 2.4, 0.95], transportColors.dark, [90, 0, 0]), strut("空中加油软管", [side * 4.4, 1.9, 0.4], [side * 4.2, 0.6, 3.5], 0.06), part("锥形受油套", "cone", transportColors.trim, [side * 4.2, 0.6, 3.5], [0.65, 0.55, 0.65], [90, 0, 0])]), strut("中央加油硬管", [0, 1.6, 3.7], [0, 0.5, 7.4], 0.14)] },
  { name: "双浮筒水上飞机", create: () => [fuselage(5, 0.8, 1.8), wing(6.3, 1.2, -0.2, 2.25), ...tail(1.95, 1.95, 2.5), ...propeller(0, 1.8, -2.65, 0.65), ...[-1, 1].flatMap(side => [part("长条水上浮筒", "capsule", transportColors.trim, [side * 0.85, 0.25, -0.2], [0.6, 3.3, 0.6], [90, 0, 0]), strut("浮筒前斜撑", [side * 0.25, 1.5, -0.6], [side * 0.85, 0.4, -0.9]), strut("浮筒后斜撑", [side * 0.25, 1.5, 0.8], [side * 0.85, 0.4, 0.8])]), box("舱顶长窗", [0, 2.15, -0.9], [0.62, 0.35, 0.8], transportColors.glass)] },
  { name: "船体式水上运输飞机", create: () => [part("船底飞机主机身", "mesh", transportColors.body, [0, 1, 0], [1, 1, 1], [0, 0, 0], { vertices: [{ x: -0.7, y: 0, z: 2.8 }, { x: 0.7, y: 0, z: 2.8 }, { x: -0.8, y: 0.55, z: -1.8 }, { x: 0.8, y: 0.55, z: -1.8 }, { x: 0, y: -0.65, z: -2.6 }, { x: 0, y: 0.9, z: -2.1 }, { x: 0, y: 0.4, z: 3.6 }], indices: [0, 1, 6, 0, 2, 3, 0, 3, 1, 2, 4, 3, 2, 5, 4, 3, 4, 5, 0, 6, 2, 2, 6, 5, 1, 3, 6, 3, 5, 6] }), wing(8.2, 1.5, -0.1, 2.25), ...tail(2.8, 1.8, 3.2), ...[-1, 1].flatMap(side => [...propeller(side * 1.8, 2.4, -0.8, 0.68), ball("翼端稳浮筒", [side * 3.8, 0.5, 0.2], [0.5, 0.45, 1.3]), strut("稳浮筒吊杆", [side * 3.8, 2.2, 0.2], [side * 3.8, 0.5, 0.2], 0.065)])] },
  { name: "机载圆盘预警机", create: () => [fuselage(9, 1.5, 1.8), wing(9.5, 2, -0.2, 1.9), ...tail(3.6, 1.9, 3.5), ...landingGear(9), ...[-1, 1].map(side => cylinder("机翼涡扇发动机", [side * 2.2, 1.15, 0], [0.8, 2, 0.8], transportColors.dark, [90, 0, 0])), ...[-1, 1].map(side => strut("雷达盘支架", [side * 0.45, 2.4, 0.8], [side * 0.45, 3.5, 0.8], 0.15)), cylinder("背负式雷达圆盘", [0, 3.6, 0.8], [3.6, 0.35, 3.6], transportColors.dark), box("驾驶风挡", [0, 2.05, -3], [0.95, 0.4, 0.05], transportColors.glass)] },
  { name: "地效翼巡航船", create: () => [fuselage(13, 1.9, 1.4), wing(11.5, 3.3, 0.3, 1.15), ...tail(5.4, 3.4, 5), box("大型高尾翼支架", [0, 2.7, 4.6], [0.22, 3.3, 1.2], transportColors.dark), ...[-1, 1].flatMap(side => [box("翼端下垂稳浮板", [side * 5.5, 0.7, 1.4], [0.2, 1, 2.3], transportColors.signal), ...[1.8, 2.6].map(x => cylinder("前置升力喷气机舱", [side * x, 2, -3.5], [0.65, 1.6, 0.65], transportColors.dark, [90, 0, 0]))]), box("船式驾驶舱风挡", [0, 2.2, -4], [1.2, 0.45, 0.1], transportColors.glass)] },
  { name: "人力扑翼飞行架", create: () => [box("卧姿飞行床", [0, 0.6, 0], [0.5, 0.15, 1.65], transportColors.wood), ...[-1, 1].flatMap(side => [strut("展开扑翼主骨", [side * 0.15, 0.9, 0], [side * 2.8, 1.8, 0.4], 0.08, transportColors.wood), ...[0, 1, 2, 3].map(index => strut("扇状翼肋", [side * 0.4, 1, 0.1], [side * (1 + index * 0.6), 1.3 + index * 0.13, 0.9 + index * 0.08], 0.04, transportColors.wood)), surface("扑翼帆布", transportColors.trim, [[side * 0.4, 1, 0.1], [side * 2.8, 1.8, 0.4], [side * 2.8, 1.69, 1.14], [side * 1, 1.3, 0.9]], [0, 1, 2, 0, 2, 3])]), cylinder("脚踏传动轮", [0, 0.7, 0.5], [0.45, 0.45, 0.45], transportColors.dark, [0, 0, 90]), ...[-1, 1].map(side => strut("扑翼传动连杆", [side * 0.25, 0.7, 0.5], [side * 0.5, 1, 0], 0.045))] },
  { name: "双喷口个人飞行背包", create: () => [box("背负承力板", [0, 0.75, 0], [0.55, 1.1, 0.16], transportColors.dark), ...[-1, 1].flatMap(side => [cylinder("背负燃料罐", [side * 0.32, 0.85, 0.16], [0.34, 1.15, 0.34], transportColors.body), part("向下矢量喷口", "cone", transportColors.dark, [side * 0.32, 0.2, 0.2], [0.4, 0.3, 0.4]), strut("驾驶操纵臂", [side * 0.22, 0.9, -0.05], [side * 0.6, 0.85, -0.5], 0.065), box("肩部束带", [side * 0.17, 0.95, -0.11], [0.08, 0.75, 0.08], transportColors.signal)]), box("腰部系带", [0, 0.4, -0.13], [0.65, 0.12, 0.08], transportColors.signal)] },
  { name: "系留式箱形观测风筝", create: () => {
    const parts: ModelPart[] = [];
    for (const y of [0.8, 2]) for (const side of [-1, 1]) parts.push(box("双箱帆布侧壁", [side * 0.55, y, 0], [0.03, 0.65, 1.1], transportColors.trim), box("双箱帆布顶底", [0, y + side * 0.31, 0], [1.1, 0.03, 1.1], transportColors.signal));
    for (const x of [-0.55, 0.55]) for (const z of [-0.55, 0.55]) parts.push(strut("贯通箱形桁条", [x, 0.45, z], [x, 2.35, z], 0.035, transportColors.wood));
    parts.push(strut("观测系留缆", [0, 1.3, -0.6], [0, 0, -1.8], 0.012), box("气象测量吊盒", [0, 0.25, -1.4], [0.18, 0.3, 0.18], transportColors.dark));
    return parts;
  } },
];
