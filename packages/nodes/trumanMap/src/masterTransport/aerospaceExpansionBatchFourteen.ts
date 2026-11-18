import { part, type ModelPart } from "../assetModelParts";
import { fuselage, propeller } from "./aircraftModels";
import { sweptWing } from "./aerospaceExpansionBatchFive";
import { airfoil, smallGear } from "./aerospaceExpansionBatchOne";
import { ball, box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

function doubleLobedBody(): ModelPart {
  const sections = [[-14, 0.1, 0.12, 0], [-11, 2.7, 2.8, 0], [-5, 5.5, 3.3, 0], [6, 6.5, 3.0, 0.15], [12, 5.0, 2.5, 0.3], [14, 4.5, 2.1, 0.3]], outline = [[-1, 0], [-0.65, -0.45], [0, -0.55], [0.65, -0.45], [1, 0], [0.9, 0.55], [0.6, 0.95], [0.3, 0.88], [0, 0.5], [-0.3, 0.88], [-0.6, 0.95], [-0.9, 0.55]];
  const vertices = sections.flatMap(([z, width, height, lift]) => outline.map(([x, y]) => ({ x: x! * width!, y: 3.7 + y! * height! + lift!, z: z! }))), indices: number[] = [];
  for (let level = 0; level < sections.length - 1; level++) for (let index = 0; index < outline.length; index++) { const a = level * 12 + index, b = level * 12 + (index + 1) % 12; indices.push(a, b, b + 12, a, b + 12, a + 12); }
  const front = vertices.length, rear = front + 1, last = (sections.length - 1) * 12;
  vertices.push({ x: 0, y: 3.7, z: -14 }, { x: 0, y: 4.0, z: 14 });
  for (let index = 0; index < 12; index++) indices.push(front, (index + 1) % 12, index, rear, last + index, last + (index + 1) % 12);
  return part("上背形成两个连续承压叶峰而腹面相连的整体升力体", "mesh", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// 完整构造类别分别设计，不以螺旋桨数量、历史品牌或动力替换扩主。
// https://rotorcraft.arc.nasa.gov/Publications/files/vtol-urban-air-2.pdf
// https://airandspace.si.edu/collection-objects/wright-1903-flyer/nasm_A19610048000
// https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/powered-aircraft/
// https://www.nasa.gov/image-article/x-33/
export const aerospaceExpansionBatchFourteen: TransportDefinition[] = [
  { name: "固定翼升力巡航推力分离式载客飞行器", theme: "现代", tags: ["升力巡航分离", "固定竖轴升力桨", "独立后推巡航桨", "双纵梁完整飞行器"], create: () => {
    const parts: ModelPart[] = [fuselage(9.8, 1.65, 2.0), ball("乘员舱前方的宽视野驾驶风挡", [0, 2.7, -3.0], [1.35, 1.0, 1.6], transportColors.glass), cylinder("独立后推巡航螺旋桨的尾部电机舱", [0, 2.0, 4.75], [0.55, 1.0, 0.55], transportColors.dark, [90, 0, 0]), ...propeller(0, 2.0, 5.4, 0.85), ...smallGear([[-1.1, 1.9, 1.5], [1.1, 1.9, 1.5]], [0, 1.7, -3.1], 0.3)];
    for (const side of [-1, 1]) {
      parts.push(sweptWing("从乘员舱延伸并支承纵向升力梁的固定主翼", [side * 0.6, 2.35, 0.35], [side * 7.2, 2.5, 1.5], 1.8, 0.8), box("承载前后独立升力电机的固定长纵梁", [side * 3.4, 1.95, 0.05], [0.22, 0.2, 8.0], transportColors.body), strut("主翼承力骨架至升力长纵梁的固定支柱", [side * 3.4, 2.4, 0.5], [side * 3.4, 1.95, 0.5], 0.16), surface("避开巡航后推桨平面的外张V形尾翼", transportColors.signal, [[0, 0, -0.65], [side * 1.25, 1.45, 0.65], [side * 1.05, 1.25, 1.2], [0, 0, 0.65]], [0, 1, 2, 0, 2, 3], [side * 0.2, 2.15, 3.25]));
      for (const z of [-3.4, -1.1, 1.2, 3.5]) parts.push(cylinder("固定升力轴从纵梁接到电机舱的承载柱", [side * 3.4, 2.425, z], [0.08, 0.85, 0.08], transportColors.dark), cylinder("不参与巡航推进的独立竖轴升力电机", [side * 3.4, 2.73, z], [0.28, 0.3, 0.28], transportColors.body), airfoil("与前后相邻桨盘保持间隙的固定轴双叶升力桨", 2.15, 0.16, [side * 3.4, 2.9, z], [0, 90 + z * 17, 0]));
    }
    return parts;
  } },
  { name: "前置双层升降面开放框架先驱双翼机", theme: "现代", tags: ["先驱鸭式双翼机", "前升降面后双方向舵", "无封闭机身木框架", "双后推桨链传动"], create: () => {
    const parts: ModelPart[] = [airfoil("开放框架下层的连续布蒙皮承力机翼", 12.3, 2.0, [0, 1.0, 0.25]), airfoil("由竖撑和张索连接的上层布蒙皮承力机翼", 12.3, 2.0, [0, 2.7, 0.25]), airfoil("主承力翼之前的下层俯仰控制翼面", 3.7, 0.8, [0, 1.3, -3.8]), airfoil("与下层联动的上层俯仰控制翼面", 3.7, 0.8, [0, 2.1, -3.8]), box("与俯卧飞行员并列安装的开放发动机", [0.6, 1.2, 0], [0.7, 0.5, 0.8], transportColors.dark), box("俯卧操纵姿态的飞行员髋部支架", [-0.6, 1.15, -0.1], [0.5, 0.12, 1.3], transportColors.wood)];
    for (const side of [-1, 1]) {
      parts.push(box("从主翼下方向前后延伸的连续着陆滑橇", [side * 0.7, 0.08, -0.3], [0.1, 0.16, 6.2], transportColors.wood), strut("开放主翼框架向前升降面延伸的木质承力梁", [side * 0.6, 0.9, 0.2], [side * 0.6, 1.3, -3.8], 0.065, transportColors.wood), strut("连接前方上下俯仰控制面的外侧竖撑", [side * 1.4, 1.3, -3.8], [side * 1.4, 2.1, -3.8], 0.045, transportColors.wood), strut("前升降面承力根部至外侧竖撑的横向连杆", [side * 0.6, 1.3, -3.8], [side * 1.4, 1.3, -3.8], 0.045, transportColors.wood), cylinder("主翼后方由链传动驱动的螺旋桨轴", [side * 2.2, 1.8, 0.95], [0.09, 1.3, 0.09], transportColors.dark, [90, 0, 0]), airfoil("位于承力主翼之后的木质双端推式桨叶", 2.1, 0.22, [side * 2.2, 1.8, 1.65], [90, 0, side * 22]), cylinder("推式桨叶在传动长轴上的中央轴毂", [side * 2.2, 1.8, 1.65], [0.17, 0.14, 0.17], transportColors.wood, [90, 0, 0]), strut("主翼下部至后方向舵框架的下承力梁", [side * 0.4, 1.0, 0.9], [side * 0.25, 1.2, 3.4], 0.055, transportColors.wood), strut("主翼上部至后方向舵框架的上承力梁", [side * 0.4, 2.7, 0.9], [side * 0.25, 2.6, 3.4], 0.055, transportColors.wood), surface("后框架内相互平行的竖向方向控制舵", transportColors.trim, [[0, 0, -0.35], [0, 1.4, -0.35], [0, 1.4, 0.35], [0, 0, 0.35]], [0, 1, 2, 0, 2, 3], [side * 0.25, 1.2, 3.4]));
      for (const z of [-0.6, 0.7]) parts.push(strut("将主翼载荷传到下方着陆滑橇的立柱", [side * 0.7, 1.0, z], [side * 0.7, 0.16, z], 0.055, transportColors.wood));
      for (const y of [1.0, 2.7]) parts.push(strut("后推桨长轴轴承至主翼竖撑的固定承载架", [side * 2.4, y, 0.95], [side * 2.2, 1.8, 0.95], 0.045, transportColors.wood));
      for (const distance of [0.6, 2.4, 4.8]) for (const z of [-0.55, 0.95]) parts.push(strut("上下承力翼之间的木质竖撑", [side * distance, 1.0, z], [side * distance, 2.7, z], 0.045, transportColors.wood));
      for (const z of [-0.55, 0.95]) parts.push(strut("外翼箱前后两面的交叉张力钢索", [side * 2.4, 1.0, z], [side * 4.8, 2.7, z], 0.014, transportColors.dark), strut("外翼箱前后两面反向连接的张力钢索", [side * 2.4, 2.7, z], [side * 4.8, 1.0, z], 0.014, transportColors.dark));
      for (const offset of [-0.06, 0.06]) parts.push(strut("并列发动机至后推桨轴的链传动边线", [0.6, 1.2 + offset, 0.5], [side * 2.2, 1.8 + offset, 0.5], 0.022, transportColors.dark));
    }
    return parts;
  } },
  { name: "双叶承压升力体短翼轨道试验机", theme: "科幻", tags: ["双叶承压升力体", "短侧控制翼", "成对线性气塞开放槽", "完整复用航天试验载体"], create: () => {
    const parts: ModelPart[] = [doubleLobedBody(), ...smallGear([[-3.5, 3.0, 6.0], [3.5, 3.0, 6.0]], [0, 2.8, -9.0], 0.55)];
    for (const side of [-1, 1]) {
      parts.push(sweptWing("由双叶整体承力体接出的短侧向控制翼", [side * 5.0, 3.5, 5.0], [side * 9.0, 4.5, 10.0], 6.0, 1.6), surface("厚承压体后部外张的高方向稳定尾鳍", transportColors.signal, [[0, 0, -1.8], [side * 1.4, 3.6, 0.8], [side * 1.1, 3.2, 2.2], [0, 0, 2.4]], [0, 1, 2, 0, 2, 3], [side * 4.7, 4.6, 10.5]), box("厚腹面后缘分置的气动俯仰控制襟板", [side * 2.5, 2.65, 14.2], [3.0, 0.12, 1.3], transportColors.trim, [15, 0, 0]), part("上下流道之间向后收尖的连续线性气塞楔", "extrude", transportColors.dark, [side * 2.1, 4.0, 13.7], [1, 1, 1], [0, -90, 0], { depth: 3.6, profile: [{ x: 0, y: -0.6 }, { x: 0, y: 0.6 }, { x: 2.0, y: 0.08 }, { x: 2.0, y: -0.08 }] }), box("线性气塞开放流道上方的喷注承力块", [side * 2.1, 4.7, 14.4], [3.7, 0.4, 1.0], transportColors.body), box("线性气塞开放流道下方的喷注承力块", [side * 2.1, 3.3, 14.4], [3.7, 0.35, 1.0], transportColors.body));
      for (const edge of [-1, 1]) parts.push(box("仅围合侧边而不封堵后方出口的线性流道侧壁", [side * 2.1 + edge * 1.9, 4.0, 14.5], [0.16, 1.2, 1.7], transportColors.body));
    }
    return parts;
  } },
];
