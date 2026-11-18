import { part, type ModelPart } from "./assetModelParts";
import { objectBox, objectCylinder, objectFrame, objectCode, objectColors, objectPanel, objectGrid, objectBeam } from "./objectModelParts";

export const electronicsNames = ["服务终端", "显示器工作站", "桌面计算机", "服务器柜", "通讯电台", "视听接收机", "交互控制台", "打印设备", "扫描设备", "投影设备", "摄影设备", "音频调音台", "冷藏柜", "烘烤设备", "清洗设备", "售货设备", "咖啡设备", "循环风机", "空气处理机", "清洁机器人"];
export function createElectronics(kind: number, design: number): ModelPart[] {
  const parts: ModelPart[] = [], { frame, layout, joint } = objectCode(design), width = kind === 3 || kind === 12 || kind === 15 ? 0.9 : 0.72, height = kind === 3 || kind === 12 || kind === 15 ? 1.6 : 0.8;
  objectFrame(parts, frame, width, 0.6, 0.24, joint);
  const rows = layout === 0 ? 1 : layout === 1 ? 2 : layout === 2 ? 3 : 2;
  for (let index = 0; index < rows; index++) {
    const x = layout === 3 ? (index - 0.5) * width * 0.55 : 0, y = 0.3 + (layout === 3 ? 0 : index * height / rows), moduleWidth = layout === 3 ? width * 0.48 : width;
    objectBox(parts, "主功能机匣", x, y + height / rows * 0.4, 0, moduleWidth, height / rows * 0.8, 0.6);
    objectBox(parts, "模块后框", x, y + height / rows * 0.4, 0.31, moduleWidth * 1.03, height / rows * 0.83, 0.055, objectColors.frame);
    if (kind === 0 || kind === 1 || kind === 2 || kind === 5 || kind === 6) objectPanel(parts, "操作显示面", [x, y + height / rows * 0.5, -0.335], moduleWidth * 0.85, height / rows * 0.5, kind === 6 ? 3 : kind === 1 ? 2 : 1);
    if (kind === 0) { objectBox(parts, "立式触控屏立脊", x, y + height / rows + 0.16, 0.12, 0.12, 0.48, 0.12, objectColors.frame); objectPanel(parts, "竖式触控屏", [x, y + height / rows + 0.3, 0.06], moduleWidth * 0.65, 0.46, 1); objectBox(parts, "公共交互托台", x, y + height / rows * 0.7, -0.46, moduleWidth * 0.8, 0.07, 0.32, objectColors.edge); }
    if (kind === 2) { objectBox(parts, "独立计算主机", x + moduleWidth * 0.65, y + 0.18, 0, moduleWidth * 0.3, 0.36, 0.55, objectColors.frame); objectBox(parts, "独立键盘", x, y + 0.04, -0.55, moduleWidth * 0.85, 0.055, 0.22, objectColors.edge); objectGrid(parts, "主机散热百叶", 3, [x + moduleWidth * 0.65, y + 0.2, -0.285], moduleWidth * 0.2, [0.018, 0.2, 0.025]); }
    if (kind === 5) for (const side of [-1, 1]) { objectBox(parts, "独立音箱腔体", x + side * moduleWidth * 0.62, y + 0.2, -0.04, moduleWidth * 0.26, 0.39, 0.3, objectColors.wood); objectCylinder(parts, "扬声单元", x + side * moduleWidth * 0.62, y + 0.2, -0.21, moduleWidth * 0.2, 0.045, moduleWidth * 0.2, objectColors.frame, [90, 0, 0]); objectCylinder(parts, "音量调谐旋钮", x + side * moduleWidth * 0.2, y + 0.07, -0.37, 0.07, 0.035, 0.07, objectColors.edge, [90, 0, 0]); }
    if (kind === 3) { objectGrid(parts, "服务器抽屉", 3, [x, y + height / rows * 0.4, -0.34], moduleWidth * 0.7, [0.12, height / rows * 0.68, 0.055], "x", objectColors.frame); objectBox(parts, "热插拔拉手", x, y + 0.06, -0.39, moduleWidth * 0.7, 0.035, 0.045, objectColors.edge); }
    if (kind === 4) { for (const side of [-1, 1]) objectCylinder(parts, "调谐旋钮", x + side * moduleWidth * 0.28, y + height / rows * 0.34, -0.35, 0.13, 0.065, 0.13, objectColors.frame, [90, 0, 0]); objectBeam(parts, "伸缩天线", [x + moduleWidth * 0.35, y + height / rows * 0.8, 0.2], [x + moduleWidth * 0.45, y + height / rows * 0.8 + 0.5, 0.2], 0.025); }
    if (kind === 7) { objectBox(parts, "进纸托盘", x, y + height / rows * 0.82, 0.1, moduleWidth * 0.8, 0.045, 0.8, objectColors.edge); objectBox(parts, "出纸槽", x, y + height / rows * 0.25, -0.36, moduleWidth * 0.8, 0.06, 0.16, objectColors.frame); }
    if (kind === 8) { objectBox(parts, "扫描玻璃台", x, y + height / rows * 0.82, 0, moduleWidth * 0.85, 0.03, 0.49, objectColors.glass); objectBox(parts, "打开的扫描盖", x, y + height / rows * 0.98, 0.22, moduleWidth * 0.91, 0.36, 0.045, objectColors.edge); }
    if (kind === 9 || kind === 10) { objectCylinder(parts, "成像镜筒", x, y + height / rows * 0.45, -0.37, kind === 9 ? 0.25 : 0.32, 0.25, kind === 9 ? 0.25 : 0.32, objectColors.frame, [90, 0, 0]); objectCylinder(parts, "前置镜片", x, y + height / rows * 0.45, -0.51, 0.18, 0.025, 0.18, objectColors.glass, [90, 0, 0]); }
    if (kind === 9) objectGrid(parts, "投影机排热百叶", 4, [x, y + height / rows * 0.84, 0.1], moduleWidth * 0.7, [0.035, 0.035, 0.28]);
    if (kind === 10) { objectBox(parts, "光学取景器", x + moduleWidth * 0.25, y + height / rows * 0.88, 0.04, 0.16, 0.13, 0.25, objectColors.frame); objectBox(parts, "摄影机上提手", x, y + height / rows + 0.12, 0, moduleWidth * 0.65, 0.065, 0.1); }
    if (kind === 11) for (let channel = 0; channel < 4; channel++) { objectBox(parts, "推子轨", x + (channel - 1.5) * moduleWidth * 0.2, y + height / rows * 0.83, -0.08, 0.025, 0.025, 0.3, objectColors.frame); objectBox(parts, "通道推子", x + (channel - 1.5) * moduleWidth * 0.2, y + height / rows * 0.86, (channel % 2 - 0.5) * 0.12, 0.08, 0.055, 0.07, objectColors.accent); }
    if (kind === 12) { objectBox(parts, "冷藏门", x, y + height / rows * 0.4, -0.34, moduleWidth * 0.93, height / rows * 0.74, 0.07, objectColors.edge); objectBox(parts, "长门把", x + moduleWidth * 0.34, y + height / rows * 0.5, -0.4, 0.04, height / rows * 0.38, 0.045, objectColors.frame); }
    if (kind === 13) { objectPanel(parts, "炉门观察窗", [x, y + height / rows * 0.38, -0.34], moduleWidth * 0.85, height / rows * 0.5, 1); objectGrid(parts, "炉内加热管", 3, [x, y + 0.06, 0], moduleWidth * 0.75, [0.035, 0.045, 0.45], "x", objectColors.accent); }
    if (kind === 14) { objectCylinder(parts, "前置洗涤舱", x, y + height / rows * 0.4, -0.33, moduleWidth * 0.65, 0.08, moduleWidth * 0.65, objectColors.frame, [90, 0, 0]); objectCylinder(parts, "舱门窗", x, y + height / rows * 0.4, -0.38, moduleWidth * 0.48, 0.025, moduleWidth * 0.48, objectColors.glass, [90, 0, 0]); }
    if (kind === 15) { objectPanel(parts, "商品展示格", [x, y + height / rows * 0.5, -0.34], moduleWidth * 0.88, height / rows * 0.55, 3); objectBox(parts, "取物槽", x, y + height / rows * 0.13, -0.36, moduleWidth * 0.7, 0.12, 0.13, objectColors.frame); }
    if (kind === 16) { objectCylinder(parts, "豆仓", x, y + height / rows * 0.96, 0.08, moduleWidth * 0.58, 0.26, moduleWidth * 0.58, objectColors.glass); for (const side of [-1, 1]) objectCylinder(parts, "出液嘴", x + side * moduleWidth * 0.15, y + height / rows * 0.42, -0.38, 0.05, 0.2, 0.05, objectColors.edge); objectBox(parts, "杯托", x, y + 0.06, -0.42, moduleWidth * 0.65, 0.045, 0.34, objectColors.frame); }
    if (kind === 17) { objectCylinder(parts, "风机轴毂", x, y + height / rows * 0.45, -0.39, 0.16, 0.16, 0.16, objectColors.accent, [90, 0, 0]); for (let blade = 0; blade < 3; blade++) objectBox(parts, "风机叶片", x, y + height / rows * 0.45, -0.4, moduleWidth * 0.85, 0.085, 0.055, objectColors.edge, [0, 0, blade * 60]); }
    if (kind === 18) objectGrid(parts, "空调导流片", 5, [x, y + height / rows * 0.42, -0.35], moduleWidth * 0.78, [0.05, height / rows * 0.63, 0.07], "x", objectColors.edge);
    if (kind === 19) { objectCylinder(parts, "清洁滚刷", x, y + 0.08, -0.39, 0.18, moduleWidth * 0.9, 0.18, objectColors.frame, [0, 0, 90]); parts.push(part("导航扫描头", "sphere", objectColors.glass, [x, y + height / rows * 0.87, -0.1], [0.18, 0.11, 0.18])); }
  }
  objectBox(parts, "主电源舱", width * 0.28, 0.37, 0.37, 0.17, 0.23, 0.18, objectColors.frame);
  objectCylinder(parts, "电源开关", width * 0.28, 0.37, 0.475, 0.065, 0.03, 0.065, objectColors.accent, [90, 0, 0]);
  return parts;
}
