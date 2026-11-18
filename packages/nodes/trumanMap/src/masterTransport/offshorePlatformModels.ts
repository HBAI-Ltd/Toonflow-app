import { part, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function drillingMast(x: number, y: number, z: number): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(strut("井架收分主柱", [x + side * 2.5, y, z + end * 2.5], [x + side, y + 24, z + end], 0.45));
  for (let tier = 0; tier < 4; tier++) {
    const low = 2.5 - tier * 0.375, high = low - 0.375, bottom = y + tier * 6, top = bottom + 6;
    for (const side of [-1, 1]) parts.push(strut("井架侧向斜撑", [x + side * low, bottom, z - low], [x + side * high, top, z + high], 0.2), strut("井架前后斜撑", [x - low, bottom, z + side * low], [x + high, top, z + side * high], 0.2));
  }
  parts.push(box("井架顶部滑轮横梁", [x, y + 24, z], [3, 0.8, 3]), cylinder("中轴钻柱", [x, y + 10, z], [0.3, 20, 0.3], transportColors.dark));
  return parts;
}

export const offshorePlatformModels: TransportDefinition[] = [
  { name: "三桩腿自升式钻井平台", itemType: "设施", tags: ["海上工程", "自升式", "桩靴", "升降齿条"], create: () => {
    const parts: ModelPart[] = [part("三角浮式主甲板", "extrude", transportColors.body, [0, 31, 0], [1, 1, 1], [90, 0, 0], { depth: 3.4, profile: [{ x: -24, y: 13 }, { x: 24, y: 13 }, { x: 0, y: -27 }] }), box("生活区叠层舱", [-8, 35.7, 1], [14, 6, 11], transportColors.trim), box("生活区窗带", [-8, 36.5, -4.55], [12, 1.2, 0.1], transportColors.glass), cylinder("悬臂直升机甲板", [-23, 37, -2], [17, 0.6, 17], transportColors.dark), strut("停机坪外伸承梁", [-8, 33, -2], [-23, 36.5, -2], 1.2), ...drillingMast(6, 33.3, 18)];
    for (const [x, z] of [[-18, 9], [18, 9], [0, -20]]) {
      parts.push(cylinder("海床承压桩靴", [x!, 1, z!], [8, 2, 8], transportColors.dark), cylinder("主桩腿立柱", [x!, 25, z!], [2.1, 48, 2.1], transportColors.trim), box("齿轮顶升机座", [x!, 32.1, z!], [5, 4, 5], transportColors.signal), box("桩腿纵向齿条", [x! + 1.08, 25, z!], [0.2, 47, 0.6], transportColors.dark));
      for (const y of [8, 16, 24, 40, 48]) parts.push(box("桩腿齿条定位肋", [x! + 1.18, y, z!], [0.25, 0.3, 0.9], transportColors.dark));
    }
    parts.push(box("悬臂钻台滑移梁", [6, 32.7, 10.5], [8, 1.2, 22], transportColors.dark), cylinder("外置钻台井口", [6, 33.45, 18], [3.1, 0.4, 3.1], transportColors.signal));
    return parts;
  } },
  { name: "双浮筒半潜式海上作业平台", itemType: "设施", tags: ["海上工程", "半潜式", "压载浮筒", "锚泊"], create: () => {
    const parts: ModelPart[] = [box("高位主作业甲板", [0, 22, 0], [38, 2, 45]), box("甲板上层设备室", [-8, 26.5, 8], [13, 7, 15], transportColors.trim), box("生活区前窗带", [-8, 27, 0.45], [11.8, 1.4, 0.1], transportColors.glass), cylinder("外伸航空停机坪", [-23, 28, 8], [17, 0.5, 17], transportColors.dark), strut("停机坪下承桁梁", [-13, 23.5, 8], [-23, 27.6, 8], 1.3), ...drillingMast(5, 23, -5)];
    for (const side of [-1, 1]) {
      parts.push(part("水下长条压载浮筒", "capsule", transportColors.dark, [side * 13, 3, 0], [7, 51, 6], [90, 0, 0]));
      for (const end of [-1, 1]) parts.push(cylinder("大直径水线承力立柱", [side * 13, 13.5, end * 14], [6, 18, 6]), strut("横向斜撑", [side * 13, 7, end * 14], [-side * 13, 20.8, end * 14], 0.8), cylinder("锚链导向滚筒", [side * 17, 23.5, end * 20], [2.2, 1.5, 2.2], transportColors.signal), strut("短段锚泊链导向", [side * 17, 23.5, end * 20], [side * 23, 8, end * 29], 0.16));
      parts.push(strut("同侧立柱间斜撑", [side * 13, 6, -14], [side * 13, 20.8, 14], 0.75));
    }
    return parts;
  } },
];
