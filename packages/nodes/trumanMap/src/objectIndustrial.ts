import { part, type ModelPart } from "./assetModelParts";
import { objectBox, objectCylinder, objectFrame, objectCode, objectColors, objectBeam, objectPanel, objectGrid } from "./objectModelParts";

export const industrialNames = ["车削机床", "铣削机床", "冲压机", "立式钻床", "管路泵站", "空气压缩机", "发电机组", "涡轮机", "输送设备", "卷扬机", "桥式起重机", "工业机械臂", "锻造炉", "热处理炉", "矿石破碎机", "配料料斗", "储液设备", "变电设备", "风力动力机", "水轮动力机"];
export function createIndustrial(kind: number, design: number): ModelPart[] {
  const parts: ModelPart[] = [], { frame, layout, joint } = objectCode(design), width = kind === 10 ? 3.6 : 1.7, depth = kind === 8 ? 3.8 : 1.35;
  objectFrame(parts, frame, width, depth, 0.65, joint);
  objectBox(parts, "机器安装床身", 0, 0.72, 0, width, 0.16, depth, objectColors.frame);
  const count = layout + 1;
  for (let index = 0; index < count; index++) {
    const x = (index - (count - 1) / 2) * width / count, z = layout === 3 ? (index % 2 - 0.5) * depth * 0.4 : 0, w = width / count * 0.82;
    if (kind === 0) { objectCylinder(parts, "主轴箱", x - w * 0.3, 1.12, z, 0.46, 0.28, 0.46, objectColors.body, [0, 0, 90]); objectBox(parts, "尾座", x + w * 0.3, 1, z, 0.22, 0.35, 0.35); objectCylinder(parts, "车床卡盘轴", x, 1.12, z, 0.18, w * 0.65, 0.18, objectColors.edge, [0, 0, 90]); }
    if (kind === 1 || kind === 3) { objectBox(parts, "竖直主柱", x, 1.27, z + 0.4, 0.24, 1, 0.26); objectBeam(parts, "主轴横臂", [x, 1.72, z + 0.4], [x, 1.72, z - 0.22], 0.2); objectCylinder(parts, kind === 1 ? "铣削主轴" : "钻削主轴", x, 1.42, z - 0.22, 0.18, 0.55); objectBox(parts, "工作滑台", x, 0.95, z - 0.18, w, 0.1, 0.6, objectColors.edge); }
    if (kind === 1) { objectBox(parts, "横向铣削滑轨", x, 0.85, z - 0.18, w * 1.08, 0.09, 0.4); objectCylinder(parts, "进给手轮", x + w * 0.55, 0.86, z - 0.18, 0.2, 0.07, 0.2, objectColors.edge, [0, 0, 90]); }
    if (kind === 3) { objectCylinder(parts, "钻床圆柱升降套", x, 1.27, z + 0.4, 0.32, 0.6, 0.32, objectColors.edge); objectBeam(parts, "钻床压进手柄", [x + 0.15, 1.6, z - 0.2], [x + 0.42, 1.3, z - 0.2], 0.045); }
    if (kind === 2) { for (const side of [-1, 1]) objectBox(parts, "压机门架", x + side * w * 0.4, 1.3, z, 0.1, 1.1, 0.35); objectBox(parts, "压机上梁", x, 1.85, z, w, 0.18, 0.4); objectCylinder(parts, "液压压头", x, 1.35, z, 0.23, 0.72); objectBox(parts, "下模台", x, 0.93, z, w * 0.8, 0.2, 0.42, objectColors.edge); }
    if (kind === 4) { objectCylinder(parts, "泵壳", x, 1.05, z, 0.55, 0.48, 0.55, objectColors.accent); objectCylinder(parts, "进液立管", x, 1.6, z, 0.18, 0.65); objectCylinder(parts, "出液横管", x + w * 0.3, 1.1, z, 0.17, 0.55, 0.17, objectColors.body, [0, 0, 90]); }
    if (kind === 5) { objectCylinder(parts, "压缩储气罐", x, 1.1, z, 0.55, 0.9, 0.55, objectColors.body, [90, 0, 0]); objectBox(parts, "活塞机头", x, 1.52, z, 0.38, 0.3, 0.35); objectCylinder(parts, "调压阀", x + 0.18, 1.66, z - 0.2, 0.11, 0.15, 0.11, objectColors.edge); }
    if (kind === 6) { objectBox(parts, "发动机本体", x, 1.03, z, w, 0.45, 0.7); objectCylinder(parts, "发电转子", x, 1.05, z + 0.48, 0.38, 0.5, 0.38, objectColors.frame, [90, 0, 0]); objectGrid(parts, "散热鳍片", 4, [x, 1.25, z - 0.25], w * 0.7, [0.045, 0.2, 0.34], "x", objectColors.edge); }
    if (kind === 7) { objectCylinder(parts, "涡轮外壳", x, 1.18, z, 0.75, 0.7, 0.75, objectColors.body, [90, 0, 0]); for (let blade = 0; blade < 4; blade++) objectBox(parts, "涡轮扇叶", x, 1.18, z - 0.4, 0.6, 0.08, 0.07, objectColors.edge, [0, 0, blade * 45]); }
    if (kind === 8) { for (let roller = 0; roller < 4; roller++) objectCylinder(parts, "输送滚筒", x, 0.93, -depth * 0.37 + roller * depth * 0.25, 0.16, w, 0.16, objectColors.edge, [0, 0, 90]); for (const side of [-1, 1]) objectBox(parts, "输送侧轨", x + side * w * 0.48, 1.03, 0, 0.06, 0.22, depth); }
    if (kind === 9) { objectCylinder(parts, "卷扬绳鼓", x, 1.13, z, 0.58, w * 0.7, 0.58, objectColors.accent, [0, 0, 90]); for (const side of [-1, 1]) objectBox(parts, "绳鼓支座", x + side * w * 0.4, 1.04, z, 0.09, 0.46, 0.56); }
    if (kind === 10) { for (const side of [-1, 1]) objectBox(parts, "起重立架", side * width * 0.44, 1.65, z, 0.18, 2.1, 0.22); objectBox(parts, "桥架轨道", 0, 2.72, z, width, 0.22, 0.24); objectBox(parts, "行走吊车", x, 2.49, z, 0.38, 0.3, 0.42); objectBeam(parts, "吊索", [x, 2.33, z], [x, 1.25, z], 0.035); }
    if (kind === 11) { objectCylinder(parts, "机械臂转台", x, 0.98, z, w * 0.8, 0.32); objectBeam(parts, "上臂", [x, 1.13, z], [x + 0.35, 1.8, z], 0.18, objectColors.accent); objectBeam(parts, "前臂", [x + 0.35, 1.8, z], [x - 0.15, 1.94, z - 0.5], 0.14, objectColors.accent); for (const side of [-1, 1]) objectBeam(parts, "机械夹指", [x - 0.15, 1.94, z - 0.5], [x - 0.15 + side * 0.12, 1.72, z - 0.65], 0.055); }
    if (kind === 12 || kind === 13) { objectBox(parts, "耐火炉体", x, 1.25, z, w, 0.9, 0.8, objectColors.accent); objectBox(parts, "炉膛开口", x, 1.23, z - 0.42, w * 0.7, 0.45, 0.04, objectColors.frame); objectBox(parts, "炉膛内衬", x, 1.23, z - 0.45, w * 0.54, 0.3, 0.025, objectColors.light); if (kind === 12) objectCylinder(parts, "排烟立管", x + w * 0.26, 2.05, z + 0.2, 0.22, 1); else objectBox(parts, "炉门吊轨", x, 1.86, z - 0.5, w * 1.1, 0.08, 0.08); }
    if (kind === 14) { for (const side of [-1, 1]) objectCylinder(parts, "对辊破碎齿轴", x + side * w * 0.24, 1.1, z, w * 0.4, 0.85, w * 0.4, objectColors.frame, [90, 0, 0]); objectBox(parts, "上部入料斗", x, 1.65, z, w, 0.25, 0.85); }
    if (kind === 15) { parts.push(part("锥形料斗", "cone", objectColors.body, [x, 1.2, z], [w, 0.85, 0.8], [180, 0, 0])); objectCylinder(parts, "卸料管", x, 0.85, z, 0.2, 0.35); objectBox(parts, "料斗口框", x, 1.65, z, w * 1.04, 0.08, 0.84, objectColors.frame); }
    if (kind === 16) { objectCylinder(parts, "立式储罐", x, 1.45, z, w * 0.85, 1.3); objectCylinder(parts, "检修口", x, 2.15, z, w * 0.4, 0.15, w * 0.4, objectColors.edge); objectCylinder(parts, "底排管", x + w * 0.38, 0.95, z, 0.1, 0.45, 0.1, objectColors.frame, [0, 0, 90]); }
    if (kind === 17) { objectBox(parts, "变压器主箱", x, 1.17, z, w, 0.72, 0.65); for (let pole = 0; pole < 3; pole++) objectCylinder(parts, "高压绝缘柱", x + (pole - 1) * w * 0.28, 1.76, z, 0.11, 0.46, 0.11, objectColors.edge); }
    if (kind === 18) { objectCylinder(parts, "风机塔", x, 1.6, z, 0.15, 1.7); for (let blade = 0; blade < 3; blade++) objectBeam(parts, "风轮叶片", [x, 2.5, z], [x + Math.cos(blade * Math.PI * 2 / 3) * 0.9, 2.5 + Math.sin(blade * Math.PI * 2 / 3) * 0.9, z], 0.12, objectColors.wood); }
    if (kind === 19) { for (let blade = 0; blade < 6; blade++) { const angle = blade * Math.PI / 3; objectBeam(parts, "水轮辐条", [x, 1.4, z], [x + Math.cos(angle) * 0.65, 1.4 + Math.sin(angle) * 0.65, z], 0.065); objectBox(parts, "水轮斗板", x + Math.cos(angle) * 0.65, 1.4 + Math.sin(angle) * 0.65, z, 0.23, 0.12, 0.5, objectColors.wood, [0, 0, blade * 60]); } }
  }
  objectPanel(parts, "机器控制箱", [width * 0.36, 0.98, -depth * 0.5 - 0.12], 0.24, 0.28, 2);
  return parts;
}
