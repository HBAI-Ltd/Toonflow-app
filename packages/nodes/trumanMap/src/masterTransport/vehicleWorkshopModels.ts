import { part, type ModelPart } from "../assetModelParts";
import { ball, box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";

function flatAirNozzle(): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const inset of [0, 0.003]) for (const [z, width, height] of [[0.53, 0.035, 0.035], [0.695, 0.12, 0.0175]]) for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) vertices.push({ x: x! * (width! - inset), y: 0.24 + y! * (height! - inset), z: z! });
  for (let index = 0; index < 4; index++) {
    const next = (index + 1) % 4;
    indices.push(index, next, next + 4, index, next + 4, index + 4, index + 8, next + 12, next + 8, index + 8, index + 12, next + 12, index, index + 8, next + 8, index, next + 8, next, index + 4, next + 4, next + 12, index + 4, next + 12, index + 12);
  }
  return part("前后贯通的扁口充气喷嘴", "mesh", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const vehicleWorkshopModels: TransportDefinition[] = [
  { name: "卧式液压随车维修千斤顶", itemType: "器物", tags: ["卧式千斤顶", "液压起顶", "维修机具"], create: () => {
    const parts: ModelPart[] = [box("低位液压主泵底座", [0, 0.12, 0.12], [0.22, 0.12, 0.46], transportColors.dark), strut("摆动托盘起升臂", [0, 0.18, 0.18], [0, 0.32, -0.27], 0.095, transportColors.signal), cylinder("托盘接车支点", [0, 0.35, -0.27], [0.16, 0.055, 0.16], transportColors.dark), strut("低位液压顶升缸", [0, 0.15, 0.28], [0, 0.27, -0.02], 0.065), strut("长柄手动压泵杆", [0, 0.2, 0.33], [0, 1.04, 0.71], 0.028), strut("压泵杆防滑握套", [0, 0.85, 0.625], [0, 1.04, 0.71], 0.04, transportColors.dark)];
    for (const side of [-1, 1]) parts.push(part("侧置弧形承力腹板", "extrude", transportColors.signal, [side * 0.115, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.035, profile: [{ x: -0.35, y: 0.07 }, { x: 0.35, y: 0.07 }, { x: 0.35, y: 0.16 }, { x: 0.2, y: 0.23 }, { x: -0.15, y: 0.27 }, { x: -0.35, y: 0.16 }] }), ...wheel([side * 0.15, 0.065, -0.27], 0.065, 0.04), ...wheel([side * 0.15, 0.045, 0.3], 0.045, 0.035));
    return parts;
  } },
  { name: "六脚轮底盘维修躺板", itemType: "器物", tags: ["修车躺板", "底盘维修", "软垫移动板"], create: () => {
    const parts: ModelPart[] = [box("长条刚性承托躺板", [0, 0.105, 0], [0.43, 0.055, 1.02], transportColors.dark), box("低位连续软垫", [0, 0.145, 0.08], [0.39, 0.055, 0.8], transportColors.signal), box("后脑抬高头垫", [0, 0.18, -0.37], [0.35, 0.1, 0.22], transportColors.body)];
    for (const side of [-1, 1]) for (const z of [-0.36, 0, 0.36]) parts.push(cylinder("脚轮竖向回转座", [side * 0.2, 0.075, z], [0.06, 0.04, 0.06]), ...wheel([side * 0.2, 0.035, z], 0.035, 0.025));
    return parts;
  } },
  { name: "储气罐式轮胎胎唇贴合器", itemType: "器物", tags: ["胎唇贴合", "维修储气罐", "扁口充气"], create: () => {
    const parts: ModelPart[] = [cylinder("横置储气钢筒", [0, 0.24, 0], [0.3, 0.54, 0.3], transportColors.signal, [90, 0, 0]), ...[-1, 1].map(side => ball("封闭圆弧罐端", [0, 0.24, side * 0.27], [0.3, 0.3, 0.14], transportColors.signal)), cylinder("前部大流量出气管", [0, 0.24, 0.43], [0.075, 0.23, 0.075], transportColors.dark, [90, 0, 0]), flatAirNozzle(), cylinder("上部压力表圆壳", [0, 0.46, -0.11], [0.08, 0.03, 0.08], transportColors.dark, [65, 0, 0]), strut("出气阀切换手柄", [0, 0.29, 0.39], [0.14, 0.29, 0.39], 0.022, transportColors.trim), box("底部前后固定脚", [0, 0.055, 0], [0.25, 0.11, 0.38], transportColors.dark)];
    for (const side of [-1, 1]) parts.push(strut("提手支撑短臂", [0, 0.37, side * 0.12], [0, 0.52, side * 0.12], 0.022));
    parts.push(strut("罐顶提取握把", [0, 0.52, -0.12], [0, 0.52, 0.12], 0.035, transportColors.dark));
    return parts;
  } },
  { name: "转盘夹爪轮胎拆装机", itemType: "设施", tags: ["轮胎拆装机", "转盘夹爪", "胎唇压铲"], create: () => {
    const parts: ModelPart[] = [box("轮胎机固定底脚", [0, 0.06, 0], [0.77, 0.12, 0.77], transportColors.dark), box("气动机械主机柜", [0, 0.45, 0], [0.62, 0.68, 0.6], transportColors.signal), cylinder("平面转动夹持台", [0, 0.85, 0], [0.64, 0.1, 0.64], transportColors.body), box("后侧摆动立柱", [-0.34, 1.08, 0.26], [0.12, 0.9, 0.12], transportColors.dark), strut("轮缘定位悬臂", [-0.34, 1.48, 0.26], [0.03, 1.48, 0.03], 0.075), cylinder("工具头垂直进给杆", [0.03, 1.2, 0.03], [0.045, 0.58, 0.045], transportColors.trim), box("贴合轮缘的鸭嘴拆胎头", [0.08, 0.925, 0.02], [0.14, 0.05, 0.1], transportColors.dark), strut("侧面胎唇压铲摆臂", [0.36, 0.5, -0.15], [0.65, 0.37, 0.35], 0.065), box("胎唇压铲弧板", [0.65, 0.36, 0.35], [0.18, 0.2, 0.32], transportColors.trim, [0, 0, -20]), box("脚踏气路控制盒", [0, 0.12, -0.43], [0.5, 0.1, 0.17], transportColors.dark)];
    for (let index = 0; index < 4; index++) { const angle = index * Math.PI / 2; parts.push(box("径向滑动夹持爪", [Math.cos(angle) * 0.22, 0.935, Math.sin(angle) * 0.22], [0.13, 0.07, 0.08], transportColors.dark, [0, -index * 90, 0])); }
    for (const x of [-0.16, 0, 0.16]) parts.push(box("脚踏控制瓣", [x, 0.18, -0.43], [0.1, 0.035, 0.14], transportColors.body, [-12, 0, 0]));
    return parts;
  } },
  { name: "卧轴车轮动平衡机", itemType: "设施", tags: ["车轮动平衡", "水平检测主轴", "半圆防护罩"], create: () => {
    const profile: { x: number; y: number }[] = [];
    for (let index = 0; index <= 12; index++) profile.push({ x: Math.cos(index * Math.PI / 12) * 0.4, y: Math.sin(index * Math.PI / 12) * 0.4 });
    for (let index = 12; index >= 0; index--) profile.push({ x: Math.cos(index * Math.PI / 12) * 0.36, y: Math.sin(index * Math.PI / 12) * 0.36 });
    return [box("低位固定承力脚", [0, 0.05, 0], [0.72, 0.1, 0.65], transportColors.dark), box("检测机箱", [0, 0.5, 0], [0.62, 0.85, 0.56], transportColors.signal), cylinder("外伸水平车轮夹持主轴", [0.6, 0.83, 0], [0.055, 0.72, 0.055], transportColors.trim, [0, 0, 90]), part("车轮中心锥形定位套", "cone", transportColors.dark, [0.55, 0.83, 0], [0.17, 0.2, 0.17], [0, 0, -90]), cylinder("旋入锁紧压盘", [0.86, 0.83, 0], [0.2, 0.06, 0.2], transportColors.dark, [0, 0, 90]), part("完整半圆防护弧罩", "extrude", transportColors.dark, [0.68, 0.83, 0], [1, 1, 1], [0, 90, 0], { depth: 0.35, profile }), box("上部倾斜读数操作台", [0, 1.02, -0.12], [0.52, 0.14, 0.29], transportColors.body, [-15, 0, 0]), box("操作台显示窗", [0, 1.102, -0.12], [0.29, 0.01, 0.17], transportColors.glass, [-15, 0, 0])];
  } },
];
