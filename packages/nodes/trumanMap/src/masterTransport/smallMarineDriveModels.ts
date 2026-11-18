import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { createMarinePropellerParts } from "./marineEquipmentModels";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

function propulsionRotor(position: Triple, factor: number): ModelPart[] {
  return createMarinePropellerParts().map(value => {
    for (const axis of ["x", "y", "z"] as const) {
      value.position[axis] = (value.position[axis] - (axis === "y" ? 4 : 0)) * factor + position[axis === "x" ? 0 : axis === "y" ? 1 : 2];
      value.scale[axis] *= factor;
    }
    return value;
  });
}

export const smallMarineDriveModels: TransportDefinition[] = [
  { name: "带夹持挂架的汽油船用舷外机", theme: "现代", itemType: "构件", tags: ["舷外发动机", "小船挂机", "船用推进附件"], create: () => {
    const parts: ModelPart[] = [box("上部封闭汽油发动机整流罩", [0, 1.5, 0.05], [0.4, 0.62, 0.55], transportColors.body), box("动力头下方隔振底座", [0, 1.17, 0.05], [0.36, 0.1, 0.48], transportColors.dark), part("扁平流线传动立腿", "extrude", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.13, profile: [{ x: -0.13, y: 0.35 }, { x: 0.1, y: 0.35 }, { x: 0.16, y: 1.2 }, { x: -0.1, y: 1.2 }] }), part("下端封闭水滴形锥齿箱", "lathe", transportColors.body, [0, 0.3, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -0.33 }, { x: 0.09, y: -0.2 }, { x: 0.11, y: 0.05 }, { x: 0.07, y: 0.23 }, { x: 0, y: 0.26 }] }), ...propulsionRotor([0, 0.3, -0.33], 0.04), box("桨叶上方保持间隙的防空化水平板", [0, 0.5, -0.015], [0.42, 0.025, 0.64]), part("齿箱下部保护螺旋桨的尾鳍", "extrude", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.02, profile: [{ x: -0.15, y: 0.3 }, { x: 0.18, y: 0.3 }, { x: 0.16, y: 0.02 }, { x: 0.02, y: 0.04 }] }), cylinder("允许转向的竖直回转套筒", [0, 1.06, 0.15], [0.11, 0.4, 0.11], transportColors.dark), cylinder("允许上翻的横向挂架轴", [0, 1.2, 0.25], [0.09, 0.42, 0.09], transportColors.trim, [0, 0, 90]), strut("驾驶员握持的横向转向操纵杆", [-0.12, 1.3, -0.05], [-0.15, 1.25, -0.65], 0.04, transportColors.dark)];
    for (const side of [-1, 1]) parts.push(part("包过船艉板顶部的真正U形挂钩", "extrude", transportColors.body, [side * 0.15, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.06, profile: [{ x: -0.4, y: 0.88 }, { x: -0.4, y: 1.25 }, { x: -0.16, y: 1.25 }, { x: -0.16, y: 1.04 }, { x: -0.22, y: 1.04 }, { x: -0.22, y: 1.18 }, { x: -0.34, y: 1.18 }, { x: -0.34, y: 0.88 }] }), cylinder("压紧船艉板的螺旋夹紧杆", [side * 0.15, 1, 0.32], [0.025, 0.25, 0.025], transportColors.dark, [90, 0, 0]), cylinder("夹紧杆内侧压盘", [side * 0.15, 1, 0.22], [0.09, 0.025, 0.09], transportColors.trim, [90, 0, 0]));
    return parts;
  } },
  { name: "全回转水下电动吊舱推进器", theme: "现代", itemType: "构件", tags: ["船用吊舱推进器", "全回转电推", "船用推进附件"], create: () => {
    return [part("内含电机且两端收分的封闭吊舱", "lathe", transportColors.body, [0, 1.3, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -1.6 }, { x: 0.38, y: -1.2 }, { x: 0.6, y: -0.7 }, { x: 0.6, y: 0.65 }, { x: 0.32, y: 1.2 }, { x: 0, y: 1.4 }] }), ...propulsionRotor([0, 1.3, -1.75], 0.28), part("连接船底回转座与水下吊舱的流线支柱", "extrude", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.3, profile: [{ x: -0.45, y: 1.4 }, { x: 0.45, y: 1.4 }, { x: 0.35, y: 4.2 }, { x: -0.1, y: 4.2 }] }), ring("船底中空回转安装法兰", transportColors.dark, 0.8, 0.33, 4, 0.28), cylinder("上部回转电驱动头", [0, 4.3, 0], [0.85, 0.38, 0.85], transportColors.signal), ...[-1, 1].map(side => box("回转头侧向维护连接耳", [side * 0.6, 4.18, 0], [0.4, 0.2, 0.28])), cylinder("船内电缆穿越密封管颈", [0, 4.62, 0], [0.25, 0.35, 0.25], transportColors.dark)];
  } },
  { name: "底进水带反推罩船艉喷水泵", theme: "现代", itemType: "构件", tags: ["船用喷水推进器", "水喷泵", "底部进水口"], create: () => {
    const inlet: Triple[] = [[-0.4, 0.1, -1.2], [0, 0.1, -1.2], [0.4, 0.1, -1.2], [0.4, 0.1, -0.9], [0.4, 0.1, -0.6], [0, 0.1, -0.6], [-0.4, 0.1, -0.6], [-0.4, 0.1, -0.9]];
    const outlet = Array.from({ length: 8 }, (_, index) => { const angle = (-135 + index * 45) * Math.PI / 180; return [Math.cos(angle) * 0.3, 0.6 + Math.sin(angle) * 0.3, -0.25] as Triple; });
    const parts: ModelPart[] = [part("前后真正贯通的轴流泵壳", "lathe", transportColors.body, [0, 0.6, 0.25], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.33, y: -0.5 }, { x: 0.33, y: 0.5 }, { x: 0.27, y: 0.5 }, { x: 0.27, y: -0.5 }, { x: 0.33, y: -0.5 }] }), cylinder("泵内贯通叶轮轴", [0, 0.6, 0.1], [0.09, 1.3, 0.09], transportColors.dark, [90, 0, 0]), ring("前部驱动轴密封轴承", transportColors.dark, 0.11, 0.065, 0, 0.08, { position: { x: 0, y: 0.6, z: -0.32 }, rotation: { x: 90, y: 0, z: 0 } }), part("后部收分的真实喷水嘴", "lathe", transportColors.dark, [0, 0.6, 0.95], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.32, y: -0.22 }, { x: 0.18, y: 0.22 }, { x: 0.14, y: 0.22 }, { x: 0.26, y: -0.22 }, { x: 0.32, y: -0.22 }] }), cylinder("反推罩两侧共同翻转轴", [0, 0.9, 1.2], [0.065, 0.85, 0.065], transportColors.trim, [0, 0, 90]), part("抬到喷口上方的反推导流罩", "extrude", transportColors.signal, [0, 0, 1.05], [1, 1, 1], [0, 90, 0], { depth: 0.65, profile: [{ x: -0.25, y: 0.8 }, { x: -0.25, y: 1.05 }, { x: 0, y: 1.28 }, { x: 0.3, y: 1.15 }, { x: 0.42, y: 0.88 }, { x: 0.35, y: 0.86 }, { x: 0.25, y: 1.09 }, { x: 0, y: 1.2 }, { x: -0.18, y: 1.01 }, { x: -0.18, y: 0.8 }] })];
    for (let index = 0; index < 8; index++) {
      const next = (index + 1) % 8;
      // ACT: 转向进口的四角不共面；逐三角按各自法线加壁厚，避免共用首面法线挤出时折叠。
      parts.push(surface("转向进口壁的前半闭合薄壳", transportColors.body, [inlet[index]!, inlet[next]!, outlet[next]!], [0, 1, 2]), surface("转向进口壁的后半闭合薄壳", transportColors.body, [inlet[index]!, outlet[next]!, outlet[index]!], [0, 1, 2]));
    }
    for (const x of [-0.3, -0.15, 0, 0.15, 0.3]) parts.push(strut("底部进水口防杂物栅条", [x, 0.1, -1.2], [x, 0.1, -0.6], 0.018, transportColors.dark));
    for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3; parts.push(box("泵壳内的斜置轴流叶片", [Math.cos(angle) * 0.15, 0.6 + Math.sin(angle) * 0.15, 0.25], [0.24, 0.07, 0.025], transportColors.trim, [20, 0, index * 60])); }
    for (const side of [-1, 1]) parts.push(strut("将反推罩铰轴接到泵壳的侧支臂", [side * 0.3, 0.65, 0.7], [side * 0.39, 0.9, 1.2], 0.045), strut("反推罩操纵连杆", [side * 0.38, 0.82, 0.9], [side * 0.34, 1.08, 1.1], 0.025));
    return parts;
  } },
];
