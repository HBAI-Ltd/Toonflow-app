import { Euler, MathUtils, Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, wheel, transportColors, type TransportDefinition } from "./parts";

function articulatedFront(): ModelPart[] {
  const parts: ModelPart[] = [
    box("与司机后车体独立铰接的前轮承载架", [0, 0.5, -0.65], [0.78, 0.18, 1.3], transportColors.dark),
    cylinder("承载整个门架前车体的前轮车桥", [0, 0.3, -0.72], [0.12, 1.1, 0.12], transportColors.dark, [0, 0, 90]),
    ...[-1, 1].flatMap(side => wheel([side * 0.55, 0.3, -0.72], 0.3, 0.22)),
    box("外门架下横梁与前车架之间的承托梁", [0, 0.58, -1.12], [1.08, 0.12, 0.25], transportColors.body),
    box("外门架顶部的横向承梁", [0, 3.75, -1.12], [1.08, 0.12, 0.22], transportColors.body),
    box("内门架超出外门架后的顶部连接横梁", [0, 4.05, -1.12], [0.91, 0.12, 0.13], transportColors.trim),
    box("门架前方上货叉架承载横梁", [0, 1.1, -1.37], [1.04, 0.22, 0.15], transportColors.dark),
    box("门架前方下货叉架承载横梁", [0, 0.75, -1.37], [1.04, 0.1, 0.15], transportColors.dark),
    box("升降链下端与前货叉架相接的中央托梁", [0, 1.1, -1.23], [0.6, 0.1, 0.3], transportColors.dark),
  ];
  for (const side of [-1, 1]) {
    parts.push(box("开口朝内的外门架槽钢腹板", [side * 0.5, 2.15, -1.12], [0.05, 3.2, 0.21], transportColors.body), box("保留内侧导轮空隙的内门架槽钢腹板", [side * 0.455, 2.375, -1.12], [0.03, 3.35, 0.1], transportColors.trim), part("带完整竖向叉根和前尖薄趾的实心货叉", "extrude", transportColors.dark, [side * 0.32, 0.55, -1.4], [1, 1, 1], [0, 90, 0], { depth: 0.1, profile: [{ x: 0, y: 0 }, { x: 1.2, y: 0 }, { x: 1.2, y: 0.035 }, { x: 0.1, y: 0.075 }, { x: 0.1, y: 0.65 }, { x: 0, y: 0.65 }] }), cylinder("内门架后方的竖向起升液压缸外筒", [side * 0.2, 1.35, -1.02], [0.11, 1.4, 0.11], transportColors.dark), cylinder("起升缸顶部同轴伸出的活塞杆", [side * 0.2, 2.6, -1.02], [0.048, 1.2, 0.048], transportColors.trim), cylinder("起升缸杆顶部供起升链回绕的滑轮", [side * 0.2, 3.22, -1.02], [0.16, 0.09, 0.16], transportColors.body, [0, 0, 90]), part("绕过顶滑轮并连接叉架的连续起升链", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.012, path: [{ x: side * 0.2, y: 0.65, z: -0.94 }, { x: side * 0.2, y: 3.22, z: -0.94 }, { x: side * 0.2, y: 3.3, z: -1.02 }, { x: side * 0.2, y: 3.22, z: -1.1 }, { x: side * 0.2, y: 1.1, z: -1.1 }] }));
    for (const z of [-1.2, -1.04]) parts.push(box("外门架槽钢保留开口的独立前后翼缘", [side * 0.455, 2.15, z], [0.14, 3.2, 0.04], transportColors.body));
    for (const z of [-1.16, -1.08]) parts.push(box("内门架槽钢包住导轮的前后薄翼缘", [side * 0.425, 2.375, z], [0.09, 3.35, 0.02], transportColors.trim));
    for (const y of [0.9, 1.15]) parts.push(cylinder("在内槽钢空腔内滚动且避开腹板的叉架导轮", [side * 0.405, y, -1.12], [0.05, 0.055, 0.05], transportColors.dark, [0, 0, 90]), strut("导轮从槽钢开放内侧伸出的实际轮轴", [side * 0.425, y, -1.12], [side * 0.3, y, -1.12], 0.05, transportColors.trim), strut("避开槽钢翼缘接到前货叉架的内侧托臂", [side * 0.3, y, -1.12], [side * 0.3, y, -1.37], 0.06, transportColors.dark));
  }
  const yaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI * 35 / 180);
  for (const value of parts) {
    const position = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(yaw).add(new Vector3(0, 0, -0.5));
    const rotation = new Euler().setFromQuaternion(yaw.clone().multiply(new Quaternion().setFromEuler(new Euler(MathUtils.degToRad(value.rotation.x), MathUtils.degToRad(value.rotation.y), MathUtils.degToRad(value.rotation.z)))));
    value.position = { x: position.x, y: position.y, z: position.z };
    value.rotation = { x: MathUtils.radToDeg(rotation.x), y: MathUtils.radToDeg(rotation.y), z: MathUtils.radToDeg(rotation.z) };
  }
  return parts;
}

// 整个前轮车体与门架一起铰接，和普通叉车装旋转叉架不同；转向姿态不另计主项。
// https://aislemaster.com/aisle-master-forklifts/
export const roadExpansionBatchTwenty: TransportDefinition[] = [
  { name: "前轮门架整体铰接转向窄巷道叉车", theme: "现代", tags: ["铰接式窄巷道叉车", "前轮和门架共同铰接", "完整双节承载车体"], create: () => {
    const parts: ModelPart[] = [...articulatedFront(), box("后驱动轮内侧的独立司机车体底架", [0, 0.46, 0.75], [0.75, 0.2, 2.0], transportColors.dark), cylinder("司机车体后部的驱动承重车桥", [0, 0.29, 1.5], [0.1, 1.02, 0.1], transportColors.dark, [0, 0, 90]), ...[-1, 1].flatMap(side => wheel([side * 0.51, 0.29, 1.5], 0.29, 0.2)), box("后车体位于轮胎上方的连续司机地板", [0, 0.68, 0.7], [1.08, 0.12, 1.95], transportColors.body), box("后驱动桥上方的低位平衡重", [0, 0.95, 1.65], [1.05, 0.74, 0.6], transportColors.signal), box("司机座垫", [0, 1.0, 0.85], [0.48, 0.14, 0.48], transportColors.dark), box("司机座垫下方的承托座", [0, 0.83, 0.85], [0.35, 0.2, 0.38], transportColors.body), box("前向驾驶座靠背", [0, 1.29, 1.07], [0.48, 0.52, 0.08], transportColors.dark), box("两节车体之间包住垂直铰销的后车颈", [0, 0.46, -0.33], [0.32, 0.2, 0.4], transportColors.dark), cylinder("承载前车与门架转向的大直径垂直铰销", [0, 0.53, -0.5], [0.3, 0.5, 0.3], transportColors.trim), strut("司机前方的倾斜转向操纵柱", [0, 0.75, 0.1], [0, 1.25, 0.25], 0.045), ring("操纵柱顶部的中空方向盘", transportColors.dark, 0.15, 0.025, 1.26, 0.035, { position: { x: 0, y: 1.26, z: 0.25 }, rotation: { x: 17, y: 0, z: 0 } }), box("驾驶区上方的防落物顶盖", [0, 2.18, 0.65], [1.12, 0.08, 1.88], transportColors.dark)];
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(strut("从后车体地板实际撑住司机顶盖的独立立柱", [side * 0.49, 0.74, 0.65 + end * 0.86], [side * 0.49, 2.15, 0.65 + end * 0.86], 0.045, transportColors.body));
    const frontPin = new Vector3(0.35, 0.55, -0.2).applyAxisAngle(new Vector3(0, 1, 0), Math.PI * 35 / 180).add(new Vector3(0, 0, -0.5)), rearPin = new Vector3(0.45, 0.55, -0.1);
    const body = strut("跨过铰点侧面并实际驱动前车体转向的液压缸", rearPin.toArray() as [number, number, number], rearPin.clone().lerp(frontPin, 0.64).toArray() as [number, number, number], 0.09), rod = strut("保持转向缸共同轴线并接到前车体的活塞杆", rearPin.clone().lerp(frontPin, 0.6).toArray() as [number, number, number], frontPin.toArray() as [number, number, number], 0.04, transportColors.trim);
    body.shape = "cylinder"; rod.shape = "cylinder";
    parts.push(box("后车颈承托转向液压缸尾铰点的外伸耳座", [0.4, 0.55, -0.1], [0.18, 0.14, 0.2], transportColors.body), body, rod);
    return parts;
  } },
];
