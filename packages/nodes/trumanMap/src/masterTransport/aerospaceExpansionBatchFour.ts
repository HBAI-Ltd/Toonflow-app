import { Euler, Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { fuselage, propeller } from "./aircraftModels";
import { airfoil, smallGear } from "./aerospaceExpansionBatchOne";
import { ball, box, cylinder, strut, surface, transportColors, wheel, type TransportDefinition } from "./parts";

export function cylinderBetween(name: string, start: Triple, end: Triple, diameter: number, color: string): ModelPart {
  const a = new Vector3(...start), b = new Vector3(...end), direction = b.clone().sub(a);
  const e = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize()));
  const center = a.add(b).multiplyScalar(0.5);
  return cylinder(name, [center.x, center.y, center.z], [diameter, direction.length(), diameter], color, [e.x, e.y, e.z].map(v => v * 180 / Math.PI) as Triple);
}

function kiteCloth(points: Triple[]): ModelPart {
  const vertices = [...points, ...points].map(([x, y, z]) => ({ x, y, z }));
  return part("正反面分顶点的三角风筝帆面", "mesh", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices: [0, 1, 2, 5, 4, 3] });
}

// 公开的构型原理仅用于造型参考；这些静态几何不是航空器/实验装置的制造规格。
// https://www.nasa.gov/aeronautics/nasa-aircraft/x-29-demonstrator/
// https://piaggioaerospace.it/en
// https://www.si.edu/object/nasm_A19810428000
// https://www.loc.gov/resource/magbell.37700202/
// https://www.zarm.uni-bremen.de/en/in-focus/phenomena-in-weightlessness
export const aerospaceExpansionBatchFour: TransportDefinition[] = [
  { name: "前掠主翼鸭式喷气研究飞机", theme: "现代", tags: ["前掠翼", "前置鸭翼", "向前伸出的翼尖"], create: () => {
    const parts: ModelPart[] = [fuselage(14.6, 1.22, 2.12), airfoil("主翼前方的独立鸭翼", 4.1, 0.94, [0, 2.2, -2.6]), ball("狭长单座透明飞行舱", [0, 2.62, -3.55], [0.94, 0.84, 1.9], transportColors.glass), surface("尾段高垂直方向安定面", transportColors.signal, [[0, 0, -1.2], [0, 2.2, 0.35], [0, 0, 1.45]], [0, 1, 2], [0, 2.45, 5.55]), part("机尾真实贯通喷气喷管", "lathe", transportColors.dark, [0, 2.12, 6.9], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.48, y: -0.65 }, { x: 0.37, y: 0.65 }, { x: 0.29, y: 0.65 }, { x: 0.4, y: -0.65 }, { x: 0.48, y: -0.65 }] }), ...smallGear([[-1.0, 2.0, 2.0], [1.0, 2.0, 2.0]], [0, 2.0, -4.0], 0.32)];
    for (const side of [-1, 1]) parts.push(polygon("翼根靠后而翼尖朝前的主翼", transportColors.trim, [[side * 0.55, 1.3], [side * 4.7, -1.6], [side * 4.9, -0.2], [side * 0.55, 2.9]], 0.12, [0, 2.13, 0]), part("机身侧面独立进气支管", "lathe", transportColors.body, [side * 0.75, 2.12, -0.65], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.33, y: -0.8 }, { x: 0.38, y: 0.55 }, { x: 0.29, y: 0.55 }, { x: 0.25, y: -0.8 }, { x: 0.33, y: -0.8 }] }));
    return parts;
  } },
  { name: "前翼主翼高平尾三升力面运输飞机", theme: "现代", tags: ["三升力面", "独立前翼与后平尾", "推式螺旋桨"], create: () => {
    const parts: ModelPart[] = [fuselage(12.6, 1.85, 2.25), airfoil("机鼻两侧的第一升力前翼", 3.5, 0.8, [0, 2.0, -3.65]), airfoil("位于客舱后部的主升力翼", 13.5, 2.0, [0, 2.4, 1.1]), airfoil("独立于前翼的高位水平尾翼", 4.2, 1.0, [0, 4.32, 5.0]), surface("把水平尾翼托高的垂直尾梁", transportColors.signal, [[0, 0, -0.9], [0, 2.35, 0.3], [0, 0, 1.4]], [0, 1, 2], [0, 2.25, 4.85]), ball("前段双人飞行舱透明罩", [0, 2.74, -4.05], [1.35, 0.78, 1.8], transportColors.glass), ...smallGear([[-1.15, 2.2, 1.6], [1.15, 2.2, 1.6]], [0, 2.1, -3.9], 0.3)];
    for (const side of [-1, 1]) parts.push(cylinder("主翼后段的涡桨动力短舱", [side * 2.45, 2.5, 1.8], [0.62, 2.3, 0.62], transportColors.body, [90, 0, 0]), ...propeller(side * 2.45, 2.5, 3.2, 1.15), strut("主翼至动力短舱的连接肋", [side * 2.45, 2.4, 1.1], [side * 2.45, 2.5, 1.8], 0.14));
    return parts;
  } },
  { name: "高展弦比脚踏螺旋桨人力飞机", theme: "现代", tags: ["人力飞机", "脚踏驱动螺旋桨", "拉索轻质主翼", "前置稳定翼"], create: () => {
    const parts: ModelPart[] = [airfoil("极高展弦比的轻质主升力翼", 24, 1.5, [0, 2.8, 0.5]), airfoil("长鼻梁前端的俯仰稳定翼", 3.2, 0.72, [0, 1.25, -3.8]), strut("从飞行座舱通向前翼的细长主梁", [0, 1.1, -0.65], [0, 1.25, -3.8], 0.055), strut("飞行座舱后方轻质尾梁", [0, 1.1, 0], [0, 1.45, 3.3], 0.055), surface("轻质尾梁末端的垂直稳定帆", transportColors.signal, [[0, 0, -0.5], [0, 1.0, 0.35], [0, 0, 0.75]], [0, 1, 2], [0, 1.4, 3.1]), box("脚踏飞行员的低位座垫", [0, 0.9, -0.2], [0.45, 0.12, 0.6], transportColors.dark), box("后倾的轻质飞行靠背", [0, 1.2, 0.02], [0.43, 0.6, 0.06], transportColors.body, [-18, 0, 0]), cylinder("双脚驱动的横向曲柄轴", [0, 1.0, -1.2], [0.035, 0.5, 0.035], transportColors.dark, [0, 0, 90]), ring("脚踏传动的大直径链盘", transportColors.body, 0.19, 0.035, 0, 0.02, { position: { x: 0.08, y: 1.0, z: -1.2 }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("座舱后方的螺旋桨轴承座", [0, 1.8, 1.5], [0.15, 0.4, 0.15], transportColors.dark, [90, 0, 0]), ...propeller(0, 1.8, 1.8, 1.18), strut("高于主翼的拉索支承桅", [0, 1.1, 0.5], [0, 4.7, 0.5], 0.065)];
    for (const side of [-1, 1]) {
      parts.push(strut("飞行座舱侧面主三角管", [side * 0.21, 0.8, -0.65], [0, 2.8, 0.5], 0.035), strut("上桅至翼尖的上拉索", [0, 4.7, 0.5], [side * 10.2, 2.8, 0.5], 0.012), strut("下方座舱承座至翼端的张紧索", [0, 0.6, 0.5], [side * 10.2, 2.8, 0.5], 0.012), strut("脚踏轴上的错位曲柄", [side * 0.24, 1.0, -1.2], [side * 0.24, 1.0 + side * 0.14, -1.2], 0.022), box("可供脚掌接触的踏板", [side * 0.3, 1.0 + side * 0.14, -1.2], [0.15, 0.035, 0.08], transportColors.dark));
    }
    for (const z of [-1.4, 0.5]) parts.push(strut("单列轻质起落轮支柱", [0, 0.85, z], [0, 0.15, z], 0.035), ...wheel([0, 0.15, z], 0.15, 0.06));
    parts.push(strut("脚踏至后部传动座的张紧链带上边", [0.08, 1.16, -1.2], [0.08, 1.8, 1.35], 0.009), strut("脚踏至后部传动座的张紧链带下边", [0.08, 0.84, -1.2], [0.08, 1.67, 1.35], 0.009), strut("后部轴承座向下连接主梁的支架", [0, 1.8, 1.5], [0, 1.25, 1.5], 0.045));
    return parts;
  } },
  { name: "复合四面体空间桁架大型风筝", theme: "现代", tags: ["四面体风筝", "空间桁架", "三角独立帆面", "大型系留风筝"], create: () => {
    const corners: Triple[] = [[-3, 0, -1.732], [3, 0, -1.732], [0, 0, 3.464], [0, 4.899, 0]];
    const parts: ModelPart[] = [];
    for (const root of corners) {
      const p = corners.map(([x, y, z]) => [(x + root[0]) / 2, (y + root[1]) / 2, (z + root[2]) / 2] as Triple);
      for (const [a, b] of [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]) parts.push(strut("单个四面体的轻质刚性棱杆", p[a!]!, p[b!]!, 0.025, transportColors.body));
      parts.push(kiteCloth([p[0]!, p[1]!, p[3]!]), kiteCloth([p[1]!, p[2]!, p[3]!]));
    }
    for (const anchor of [corners[0]!, corners[1]!, [0, 2.4495, 0] as Triple]) parts.push(strut("汇至前下方系留点的风筝平衡绳", anchor, [0, 0.7, -4.4], 0.008, transportColors.dark));
    return parts;
  } },
  { name: "六支柱动感平台完整飞行模拟座舱", theme: "现代", itemType: "设施", tags: ["飞行模拟器", "完整双座驾驶训练舱", "六自由度运动平台"], create: () => {
    const parts: ModelPart[] = [polygon("六角运动机构固定地基", transportColors.dark, Array.from({ length: 6 }, (_, index) => [Math.cos(index * Math.PI / 3) * 3.25, Math.sin(index * Math.PI / 3) * 3.25]), 0.25), box("六缸上方完整座舱承力底台", [0, 2.5, 0], [4.8, 0.25, 5.1], transportColors.body), box("模拟舱独立顶壳", [0, 5.2, 0], [4.7, 0.18, 4.9], transportColors.body), box("前段驾驶仪表台", [0, 3.2, -1.45], [3.8, 0.7, 0.7], transportColors.dark), box("双座之间的推力与操纵中央台", [0, 3.05, -0.35], [0.55, 0.85, 1.55], transportColors.dark), box("驾驶舱后方的可进入连接桥", [0, 2.5, 3.2], [1.2, 0.18, 1.4], transportColors.body)];
    for (let index = 0; index < 6; index++) {
      const a = (index * 60 + (index % 2 ? 10 : -10)) * Math.PI / 180, b = (index * 60 + (index % 2 ? -22 : 22)) * Math.PI / 180;
      const low: Triple = [Math.cos(a) * 2.7, 0.32, Math.sin(a) * 2.7], high: Triple = [Math.cos(b) * 1.9, 2.36, Math.sin(b) * 1.9], split = low.map((value, i) => value + (high[i]! - value) * 0.57) as Triple;
      parts.push(cylinderBetween("独立摆动液压运动缸筒", low, split, 0.22, transportColors.body), cylinderBetween("从缸筒伸向座舱底台的柱塞", split, high, 0.1, transportColors.trim), ball("液压运动缸下部万向铰", low, [0.26, 0.26, 0.26], transportColors.dark), ball("液压柱塞上部万向铰", high, [0.22, 0.22, 0.22], transportColors.dark));
    }
    for (const side of [-1, 1]) parts.push(box("模拟驾驶舱两侧承力侧壳", [side * 2.25, 3.85, 0.1], [0.16, 2.55, 4.6], transportColors.body), box("供飞行员就坐的独立座垫", [side * 0.88, 3.0, 0.35], [0.7, 0.2, 0.75], transportColors.dark), box("驾驶训练座椅靠背", [side * 0.88, 3.6, 0.67], [0.7, 1.05, 0.16], transportColors.dark), strut("飞行员前方的操纵柱", [side * 0.88, 2.68, -0.43], [side * 0.88, 3.43, -0.55], 0.055), box("双手操纵横把", [side * 0.88, 3.45, -0.55], [0.38, 0.055, 0.12], transportColors.dark), part("模拟舱侧前方视觉投影板", "box", transportColors.glass, [side * 1.35, 4.17, -2.05], [1.65, 1.52, 0.07], [0, side * -25, 0], { emissive: "#6c909d", emissiveIntensity: 0.12 }));
    parts.push(part("正前方视觉投影板", "box", transportColors.glass, [0, 4.17, -2.38], [1.3, 1.52, 0.07], [0, 0, 0], { emissive: "#6c909d", emissiveIntensity: 0.12 }));
    for (const side of [-1, 1]) parts.push(strut("连接桥下方独立落地支撑", [side * 0.5, 0.08, 3.6], [side * 0.5, 2.45, 3.6], 0.12), strut("上模拟舱的楼梯承力边梁", [side * 0.52, 0.1, 6.2], [side * 0.52, 2.45, 3.85], 0.1));
    for (let index = 0; index < 6; index++) parts.push(box("进入模拟驾驶舱的钢踏板", [0, 0.4 + index * 0.4, 6.0 - index * 0.4], [1.0, 0.07, 0.43], transportColors.body));
    return parts;
  } },
  { name: "封闭真空自由落体微重力试验塔", theme: "现代", itemType: "设施", tags: ["微重力落塔", "真空落管", "封闭实验舱", "独立真空泵房"], create: () => {
    const parts: ModelPart[] = [cylinder("承受整条落管的厚圆形地基", [0, 0.3, 0], [7.6, 0.6, 7.6], transportColors.dark), part("从底部至顶部连续贯通的真空落管", "lathe", transportColors.body, [0, 1.5, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.55, y: 0 }, { x: 1.55, y: 33.8 }, { x: 1.43, y: 33.8 }, { x: 1.43, y: 0 }, { x: 1.55, y: 0 }] }), part("落管顶端封闭圆弧气密盖", "lathe", transportColors.body, [0, 35.3, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.55, y: 0 }, { x: 1.45, y: 0.35 }, { x: 1.0, y: 0.7 }, { x: 0, y: 0.85 }, { x: 0, y: 0.72 }, { x: 0.96, y: 0.59 }, { x: 1.34, y: 0.29 }, { x: 1.43, y: 0 }, { x: 1.55, y: 0 }] }), cylinder("底部实验舱缓冲回收密封段", [0, 1.15, 0], [3.15, 1.1, 3.15], transportColors.dark), box("落管侧方的接近电梯封闭井", [-3.4, 18.1, 0], [1.35, 35, 1.6], transportColors.dark), box("独立真空泵房基础", [6.4, 0.25, 0], [5.2, 0.5, 5.0], transportColors.dark), box("泵房后部墙体", [6.4, 1.8, 2.25], [5.2, 2.6, 0.22], transportColors.body), box("开放泵房的防雨屋面", [6.4, 3.2, 0], [5.4, 0.2, 5.1], transportColors.body)];
    for (let index = 0; index < 4; index++) {
      const a = index * Math.PI / 2 + Math.PI / 4, b = a + Math.PI / 2;
      const x = Math.cos(a) * 2.65, z = Math.sin(a) * 2.65;
      parts.push(strut("落管外围独立长立柱", [x, 0.6, z], [x, 35.6, z], 0.2));
      for (let level = 0; level < 4; level++) parts.push(strut("抵抗高塔侧移的外框空间斜撑", [x, 0.6 + level * 8.7, z], [Math.cos(b) * 2.65, 9.3 + level * 8.7, Math.sin(b) * 2.65], 0.12));
    }
    for (const y of [3.2, 17.5, 35.0]) {
      parts.push(ring("围绕真空落管的检修环廊", transportColors.body, 3.0, 1.3, y, 0.17), ring("检修环廊外侧连续防护横栏", transportColors.dark, 2.96, 0.04, y + 1.1, 0.08), box("电梯井通往检修环廊的桥接踏板", [-2.95, y, 0], [1.0, 0.17, 1.1], transportColors.body));
      for (let index = 0; index < 4; index++) { const a = index * Math.PI / 2; parts.push(strut("检修环廊护栏立柱", [Math.cos(a) * 2.94, y, Math.sin(a) * 2.94], [Math.cos(a) * 2.94, y + 1.1, Math.sin(a) * 2.94], 0.05)); }
    }
    for (const z of [-1.3, 1.3]) parts.push(cylinder("开放泵房中的大型真空泵组", [6.25, 1.2, z], [1.1, 2.4, 1.1], transportColors.body, [0, 0, 90]), box("泵组驱动电机", [7.8, 1.2, z], [0.8, 0.9, 0.9], transportColors.dark), part("从泵组接至落管底部的抽气支管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.18, path: [{ x: 5.0, y: 1.2, z }, { x: 3.5, y: 1.2, z }, { x: 2.5, y: 1.1, z: z < 0 ? -0.55 : 0.55 }, { x: 1.4, y: 1.1, z: z < 0 ? -0.55 : 0.55 }] }));
    return parts;
  } },
];
