import { part, type ModelPart, type Triple } from "../assetModelParts";
import { ball, box, cylinder, strut, surface, transportColors, wheel, type TransportDefinition } from "./parts";

function inflatableBeam(name: string, start: Triple, end: Triple, diameter: number): ModelPart[] {
  const body = strut(name, start, end, diameter, transportColors.signal);
  body.shape = "cylinder";
  return [body, ball("气梁圆弧封端", start, [diameter, diameter, diameter], transportColors.signal), ball("气梁圆弧封端", end, [diameter, diameter, diameter], transportColors.signal)];
}

export const emergencyEquipmentModels: TransportDefinition[] = [
  { name: "升降折叠急救担架车", theme: "现代", tags: ["急救担架车", "折叠车架", "四回转脚轮"], create: () => {
    const parts: ModelPart[] = [box("长向刚性担架承托床", [0, 0.7, 0], [0.61, 0.055, 1.96], transportColors.body), box("身体与腿部软垫", [0, 0.76, 0.18], [0.56, 0.08, 1.43], transportColors.signal), box("可抬高头侧垫板", [0, 0.87, -0.65], [0.56, 0.08, 0.6], transportColors.signal, [20, 0, 0]), ...[-1, 1].map(side => box("下部纵向车架", [side * 0.25, 0.2, 0], [0.055, 0.06, 1.35], transportColors.dark)), ...[-0.6, 0.6].map(z => box("下部车架横梁", [0, 0.2, z], [0.55, 0.06, 0.055], transportColors.dark))];
    for (const side of [-1, 1]) {
      parts.push(strut("交叉升降长支腿", [side * 0.25, 0.22, -0.6], [side * 0.25, 0.69, 0.6], 0.04), strut("反向交叉升降长支腿", [side * 0.25, 0.22, 0.6], [side * 0.25, 0.69, -0.6], 0.04), cylinder("交叉腿共同铰接轴", [side * 0.25, 0.455, 0], [0.065, 0.08, 0.065], transportColors.trim, [0, 0, 90]), strut("担架侧面防落扶栏", [side * 0.31, 0.96, -0.42], [side * 0.31, 0.96, 0.48], 0.025), ...[-0.42, 0.48].map(z => strut("防落扶栏短立杆", [side * 0.31, 0.71, z], [side * 0.31, 0.96, z], 0.025)));
      for (const z of [-0.65, 0.65]) parts.push(cylinder("脚轮竖向转动接头", [side * 0.27, 0.15, z], [0.045, 0.08, 0.045], transportColors.body), ...wheel([side * 0.27, 0.08, z], 0.08, 0.035));
    }
    parts.push(strut("升降辅助液压短缸", [0, 0.2, 0.4], [0, 0.57, -0.25], 0.065, transportColors.body));
    return parts;
  } },
  { name: "液压剪扩一体破拆钳", theme: "现代", itemType: "器物", tags: ["液压破拆", "剪扩钳", "救援工具"], create: () => {
    const parts: ModelPart[] = [cylinder("液压驱动主缸", [0, 0.2, 0], [0.12, 0.35, 0.12], transportColors.signal), box("钳口承力支架", [0, 0.43, 0], [0.18, 0.12, 0.08], transportColors.body), cylinder("中心向上进给活塞杆", [0, 0.43, 0], [0.045, 0.2, 0.045], transportColors.dark), cylinder("后部供油管接头", [0, 0.025, 0], [0.05, 0.05, 0.05], transportColors.dark), part("绕主缸的握持手柄", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.014, path: [{ x: -0.05, y: 0.16, z: 0.04 }, { x: -0.16, y: 0.17, z: 0.04 }, { x: -0.16, y: 0.4, z: 0.04 }, { x: 0.16, y: 0.4, z: 0.04 }, { x: 0.16, y: 0.17, z: 0.04 }, { x: 0.05, y: 0.16, z: 0.04 }] })];
    for (const side of [-1, 1]) parts.push(part("内剪刃外扩尖的承载钳爪", "extrude", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 0.045, profile: [{ x: side * 0.055, y: 0.43 }, { x: side * 0.17, y: 0.52 }, { x: side * 0.2, y: 0.65 }, { x: side * 0.07, y: 0.82 }, { x: side * 0.025, y: 0.8 }, { x: side * 0.105, y: 0.63 }, { x: side * 0.08, y: 0.56 }, { x: side * 0.03, y: 0.5 }] }), cylinder("钳爪根部转动销", [side * 0.065, 0.49, 0], [0.045, 0.1, 0.045], transportColors.dark, [90, 0, 0]), strut("活塞驱动钳爪短联杆", [0, 0.53, -0.04], [side * 0.09, 0.54, -0.04], 0.025, transportColors.trim));
    return parts;
  } },
  { name: "三脚座便携消防水炮", theme: "现代", itemType: "设施", tags: ["消防水炮", "双轴转向", "便携支座"], create: () => {
    const parts: ModelPart[] = [cylinder("回转水炮承载座", [0, 0.18, 0], [0.38, 0.12, 0.38], transportColors.dark), cylinder("纵向回转进水立管", [0, 0.36, 0], [0.17, 0.32, 0.17], transportColors.signal), cylinder("水平俯仰转动轴", [0, 0.55, 0], [0.1, 0.38, 0.1], transportColors.dark, [0, 0, 90]), part("回弯水炮输水弯管", "tube", transportColors.signal, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.075, path: [{ x: 0, y: 0.45, z: 0 }, { x: 0, y: 0.66, z: -0.04 }, { x: 0, y: 0.79, z: -0.34 }] }), part("前口真正贯通的收分喷嘴", "lathe", transportColors.body, [0, 0.87, -0.44], [1, 1, 1], [-52, 0, 0], { profile: [{ x: 0.085, y: -0.16 }, { x: 0.045, y: 0.16 }, { x: 0.033, y: 0.16 }, { x: 0.07, y: -0.16 }, { x: 0.085, y: -0.16 }] }), strut("喷嘴后侧操纵长把", [0.18, 0.55, 0], [0.18, 0.73, 0.34], 0.035, transportColors.dark), part("后侧进水软管接口", "lathe", transportColors.body, [0, 0.25, 0.25], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.05, y: -0.1 }, { x: 0.075, y: -0.1 }, { x: 0.075, y: 0.1 }, { x: 0.05, y: 0.1 }, { x: 0.05, y: -0.1 }] })];
    for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(strut("展开式防倾斜支腿", [Math.cos(angle) * 0.15, 0.18, Math.sin(angle) * 0.15], [Math.cos(angle) * 0.55, 0.035, Math.sin(angle) * 0.55], 0.055), box("落地防滑脚板", [Math.cos(angle) * 0.55, 0.03, Math.sin(angle) * 0.55], [0.15, 0.06, 0.18], transportColors.dark)); }
    return parts;
  } },
  { name: "充气式航空紧急逃生滑梯", theme: "现代", itemType: "设施", tags: ["航空逃生滑梯", "充气气梁", "逃生装备"], create: () => {
    const parts: ModelPart[] = [surface("连续倾斜滑行织物面", transportColors.trim, [[-0.65, 3, -2], [0.65, 3, -2], [0.7, 0.2, 2.4], [-0.7, 0.2, 2.4]], [0, 1, 2, 0, 2, 3])];
    for (const side of [-1, 1]) parts.push(...inflatableBeam("双侧承力充气纵梁", [side * 0.82, 3.05, -2], [side * 0.86, 0.25, 2.4], 0.34), ...inflatableBeam("上端登乘入口扶持气柱", [side * 0.82, 3.05, -2], [side * 0.82, 3.73, -2.08], 0.24), strut("入口系留固定带", [side * 0.65, 3, -2.05], [side * 0.65, 3, -2.5], 0.04, transportColors.dark));
    parts.push(...inflatableBeam("底端缓冲充气横梁", [-0.86, 0.25, 2.4], [0.86, 0.25, 2.4], 0.34), ...inflatableBeam("顶部登乘承托横梁", [-0.82, 3.05, -2], [0.82, 3.05, -2], 0.34));
    return parts;
  } },
  { name: "四点吊索篮式救援担架", theme: "现代", itemType: "器物", tags: ["篮式担架", "吊索救援", "围护笼架"], create: () => {
    const parts: ModelPart[] = [box("围护篮底部连续承托板", [0, 0.045, 0], [0.43, 0.05, 1.8], transportColors.trim), part("沿周边闭合的抬运边框", "tube", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.014, path: [{ x: -0.23, y: 0.25, z: -0.88 }, { x: 0, y: 0.25, z: -1.01 }, { x: 0.23, y: 0.25, z: -0.88 }, { x: 0.26, y: 0.25, z: 0 }, { x: 0.23, y: 0.25, z: 0.88 }, { x: 0, y: 0.25, z: 1.01 }, { x: -0.23, y: 0.25, z: 0.88 }, { x: -0.26, y: 0.25, z: 0 }, { x: -0.23, y: 0.25, z: -0.88 }] }), part("四索汇合承载吊环", "torus", transportColors.dark, [0, 1.34, 0], [0.17, 0.18, 0.05])];
    for (const side of [-1, 1]) {
      for (const z of [-0.8, -0.4, 0, 0.4, 0.8]) parts.push(strut("连接篮底与上框的外侧护肋", [side * 0.2, 0.05, z], [side * 0.25, 0.25, z], 0.016));
      for (const end of [-1, 1]) parts.push(strut("四点独立受拉悬吊索", [side * 0.24, 0.25, end * 0.7], [0, 1.25, 0], 0.012, transportColors.dark));
    }
    for (const z of [-0.5, 0, 0.5]) parts.push(box("跨越篮口的人员固定束带", [0, 0.25, z], [0.51, 0.022, 0.06], transportColors.signal));
    return parts;
  } },
];
