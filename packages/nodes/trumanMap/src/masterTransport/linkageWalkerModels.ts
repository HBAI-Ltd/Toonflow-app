import { ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function crankLeg(x: number, z: number, phase: number): ModelPart[] {
  const crankX = Math.cos(phase), crankY = Math.sin(phase), dx = 2 - crankX, dy = -crankY;
  const distance = Math.hypot(dx, dy), height = Math.sqrt(2.5 ** 2 - distance ** 2 / 4);
  const couplerX = (crankX + 2) / 2 + dy * height / distance, couplerY = crankY / 2 - dx * height / distance;
  const point = (u: number, v: number): Triple => [x, 1 + v * 0.3, z + (u - 1) * 0.3];
  const a = point(0, 0), b = point(2, 0), c = point(crankX, crankY), d = point(couplerX, couplerY), foot = point(2 * couplerX - crankX, 2 * couplerY - crankY);
  const layer = (p: Triple, offset: number): Triple => [p[0] + Math.sign(x) * offset, p[1], p[2]];
  const outerFoot = layer(foot, 0.06);
  return [strut("四杆步足固定基梁", a, b, 0.06, transportColors.wood), strut("内层输入旋转曲柄", layer(a, -0.06), layer(c, -0.06), 0.04, transportColors.signal), strut("外层中点受支承延长足杆", layer(c, 0.06), outerFoot, 0.035, transportColors.trim), strut("中层闭环等长回摇杆", b, d, 0.035, transportColors.trim), cylinder("侧向驱动曲柄盘及轴承", a, [0.17, 0.18, 0.17], transportColors.dark, [0, 0, 90]), cylinder("固定回摇杆独立转销", b, [0.07, 0.18, 0.07], transportColors.dark, [0, 0, 90]), cylinder("跨接内外层的前转销", c, [0.07, 0.18, 0.07], transportColors.dark, [0, 0, 90]), cylinder("跨接中外层的后转销", d, [0.07, 0.18, 0.07], transportColors.dark, [0, 0, 90]), cylinder("延长杆末端足掌转销", outerFoot, [0.06, 0.1, 0.06], transportColors.dark, [0, 0, 90]), box("可转动的独立平足", [outerFoot[0], outerFoot[1] - 0.045, outerFoot[2]], [0.22, 0.06, 0.18], transportColors.wood)];
}

export const linkageWalkerModels: TransportDefinition[] = [
  { name: "风轮连杆步行平台", theme: "蒸汽朋克", tags: ["机械步行", "风力转轮", "闭环四杆步足", "交替支撑", "非轮式移动"], create: () => {
    const parts: ModelPart[] = [box("木制中央承载平台", [0, 1.02, 0], [1.55, 0.12, 2.7], transportColors.wood), ...[-1, 1].map(side => box("平台侧向承力长梁", [side * 0.7, 0.92, 0], [0.28, 0.18, 2.9], transportColors.dark)), box("风轮竖向传动支座", [0.52, 1.62, 0], [0.12, 1.4, 0.18], transportColors.wood), cylinder("转轮横向输入轴", [0, 2.2, 0], [0.13, 1.2, 0.13], transportColors.dark, [0, 0, 90]), cylinder("风轮中央轴毂", [-0.04, 2.2, 0], [0.27, 0.16, 0.27], transportColors.signal, [0, 0, 90]), box("下部传动方向变换箱", [0.52, 1.08, 0], [0.24, 0.24, 0.3], transportColors.signal)];
    const rim = ring("风轮外侧连续承力环", transportColors.wood, 0.84, 0.025, 0, 0.04); rim.position = { x: -0.04, y: 2.2, z: 0 }; rim.rotation.z = 90; parts.push(rim);
    for (let index = 0; index < 6; index++) {
      const angle = index * Math.PI / 3;
      parts.push(strut("风轮径向承力辐条", [-0.04, 2.2, 0], [-0.04, 2.2 + Math.sin(angle) * 0.81, Math.cos(angle) * 0.81], 0.025, transportColors.wood), box("分离布面受风叶片", [-0.06, 2.2 + Math.sin(angle) * 0.58, Math.cos(angle) * 0.58], [0.025, 0.22, 0.43], transportColors.trim, [-index * 60, 0, 0]));
    }
    for (const side of [-1, 1]) {
      parts.push(box("侧部受护的纵向动力联动梁", [side * 0.64, 1, 0], [0.08, 0.08, 2.8], transportColors.signal));
      for (let index = 0; index < 3; index++) parts.push(...crankLeg(side * (0.7 + index * 0.08), (index - 1) * 0.85, Math.PI / 2 + (index % 2 + (side > 0 ? 1 : 0)) * Math.PI));
    }
    return parts;
  } },
];
