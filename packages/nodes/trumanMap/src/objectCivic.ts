import { part, type ModelPart } from "./assetModelParts";
import { objectBox, objectCylinder, objectFrame, objectCode, objectColors, objectBeam, objectPanel, objectGrid } from "./objectModelParts";

export const civicNames = ["候车亭", "城市休憩凳", "消防栓站", "交通信号架", "道口栏杆", "入口转闸", "交通隔离栏", "街道垃圾箱", "分类回收站", "邮政投递箱", "公用电话亭", "街角报亭", "停车缴费桩", "防撞桩组", "自行车停放架", "街心喷泉", "饮水站", "导向标识架", "光伏充电站", "票务闸机"];
export function createCivic(kind: number, design: number): ModelPart[] {
  const parts: ModelPart[] = [], { frame, layout, joint } = objectCode(design), width = kind === 0 || kind === 11 ? 2.8 : 1.7, depth = kind === 0 || kind === 11 ? 1.3 : 0.75;
  objectFrame(parts, frame, width, depth, kind === 1 ? 0.43 : 0.22, joint);
  const count = layout + 1;
  for (let index = 0; index < count; index++) {
    const x = (index - layout / 2) * width / count, w = width / count * 0.84, y = 0.26, z = layout === 3 ? (index % 2 - 0.5) * 0.44 : 0;
    if (kind === 0) { objectBox(parts, "候车立柱", x, 1.3, z + 0.45, 0.09, 2.3, 0.09); objectBox(parts, "候车屋面", x, 2.5, z, w * 1.15, 0.1, 1.6); objectPanel(parts, "路线牌", [x, 1.65, z + 0.4], w * 0.7, 0.85, 1); objectBox(parts, "等候座板", x, 0.62, z, w, 0.1, 0.45, objectColors.wood); }
    if (kind === 1) { objectGrid(parts, "座板条", 4, [x, 0.52, z], 0.45, [w, 0.065, 0.07], "z"); objectPanel(parts, "凳背", [x, 0.91, z + 0.27], w, 0.5, 3, objectColors.wood); }
    if (kind === 2) { objectCylinder(parts, "消防栓立管", x, 0.65, z, 0.25, 0.78, 0.25, objectColors.accent); objectCylinder(parts, "消防栓横口", x, 0.7, z, 0.16, 0.55, 0.16, objectColors.edge, [0, 0, 90]); objectCylinder(parts, "顶置阀盖", x, 1.1, z, 0.31, 0.14, 0.31, objectColors.accent); }
    if (kind === 3) { objectBox(parts, "信号杆", x, 1.5, z, 0.1, 2.45, 0.11); objectBox(parts, "信号灯箱", x, 2.45, z - 0.11, 0.28, 0.9, 0.22, objectColors.frame); for (let signal = 0; signal < 3; signal++) objectCylinder(parts, "信号灯面", x, 2.2 + signal * 0.25, z - 0.24, 0.17, 0.035, 0.17, signal === 0 ? objectColors.accent : objectColors.light, [90, 0, 0]); }
    if (kind === 4 || kind === 6) { for (const side of [-1, 1]) objectBox(parts, "隔离柱", x + side * w * 0.43, 0.85, z, 0.11, 1.15, 0.15); objectBox(parts, "通行栏杆", x, kind === 4 ? 1.2 : 0.9, z, w, 0.11, 0.12, objectColors.edge); if (kind === 6) objectGrid(parts, "栏内竖档", 3, [x, 0.8, z], w * 0.7, [0.05, 0.7, 0.05]); else objectCylinder(parts, "栏杆转轴", x - w * 0.43, 1.2, z, 0.24, 0.2, 0.24, objectColors.frame, [90, 0, 0]); }
    if (kind === 5) { objectCylinder(parts, "转闸中心柱", x, 0.9, z, 0.15, 1.3); for (let arm = 0; arm < 3; arm++) { const angle = arm * Math.PI * 2 / 3; objectBeam(parts, "闸杆", [x, 0.95, z], [x + Math.cos(angle) * w * 0.55, 0.95, z + Math.sin(angle) * 0.5], 0.055); } }
    if (kind === 7 || kind === 8) { objectBox(parts, "收集箱体", x, 0.72, z, w * 0.9, 0.85, 0.6); objectBox(parts, "投入口", x, 1.08, z - 0.32, w * 0.65, 0.18, 0.03, objectColors.frame); objectBox(parts, kind === 8 ? "分类翻盖" : "箱顶盖", x, 1.2, z, w, 0.1, 0.66, kind === 8 ? objectColors.accent : objectColors.edge); }
    if (kind === 8) { for (const side of [-1, 1]) objectBox(parts, "三路回收内隔板", x + side * w * 0.16, 0.78, z, 0.035, 0.72, 0.56, objectColors.frame); objectGrid(parts, "分类投递口框", 3, [x, 1.16, z - 0.345], w * 0.7, [w * 0.18, 0.18, 0.065], "x", objectColors.edge); }
    if (kind === 9) { objectBox(parts, "投递箱", x, 1, z, w, 1.1, 0.5, objectColors.accent); objectBox(parts, "信件投口", x, 1.3, z - 0.27, w * 0.75, 0.06, 0.035, objectColors.frame); objectPanel(parts, "取件门", [x, 0.8, z - 0.29], w * 0.7, 0.5, 1); }
    if (kind === 10 || kind === 11) { for (const side of [-1, 1]) objectBox(parts, "亭身边柱", x + side * w * 0.45, 1.32, z, 0.08, 2.1, 0.08); objectBox(parts, "亭顶", x, 2.42, z, w * 1.1, 0.12, 0.8); objectPanel(parts, kind === 10 ? "电话操作台" : "售卖展示台", [x, 1.25, z + 0.27], w * 0.8, kind === 10 ? 0.5 : 1.1, kind === 10 ? 1 : 3); }
    if (kind === 12 || kind === 18 || kind === 19) { objectBox(parts, "服务立机", x, 0.98, z, w * 0.8, 1.4, 0.5); objectPanel(parts, "服务屏", [x, 1.3, z - 0.27], w * 0.65, 0.34, 1); objectBox(parts, "刷卡槽", x, 0.94, z - 0.29, w * 0.5, 0.07, 0.07, objectColors.frame); if (kind === 18) { objectBox(parts, "光伏遮板", x, 2.05, z, w * 1.4, 0.055, 0.9, objectColors.glass, [-18, 0, 0]); objectBeam(parts, "光伏撑杆", [x, 1.5, z + 0.15], [x, 2.05, z + 0.15], 0.065); } if (kind === 19) objectBox(parts, "闸门翼", x + w * 0.65, 0.92, z, w * 0.7, 0.7, 0.045, objectColors.glass); }
    if (kind === 13) { objectCylinder(parts, "防撞柱体", x, 0.7, z, 0.2, 0.9); objectCylinder(parts, "柱顶防护头", x, 1.18, z, 0.24, 0.09, 0.24, objectColors.accent); for (const side of [-1, 1]) objectBox(parts, "横向连链", x + side * w * 0.3, 0.85, z, w * 0.55, 0.04, 0.05, objectColors.edge); }
    if (kind === 14) { for (const side of [-1, 1]) { objectBox(parts, "车架停放竖杆", x + side * w * 0.4, 0.66, z, 0.045, 0.8, 0.05); objectBeam(parts, "停放弧架斜段", [x + side * w * 0.4, 1.03, z], [x, 1.2, z], 0.05); } objectBox(parts, "车轮停靠槽", x, 0.29, z, 0.12, 0.07, 0.85); }
    if (kind === 15) { objectCylinder(parts, "喷泉水池", x, 0.46, z, w * 0.95, 0.35, 0.7, objectColors.edge); objectCylinder(parts, "喷泉中心柱", x, 0.9, z, 0.14, 0.7); objectCylinder(parts, "上层喷碗", x, 1.2, z, w * 0.6, 0.16, 0.5, objectColors.edge); }
    if (kind === 16) { objectBox(parts, "饮水台", x, 0.84, z, w, 1.1, 0.45); objectCylinder(parts, "饮水碗", x, 1.43, z, w * 0.65, 0.12, 0.34, objectColors.edge); objectBeam(parts, "水龙头立管", [x + w * 0.25, 1.3, z], [x + w * 0.25, 1.65, z], 0.045); objectBeam(parts, "水嘴", [x + w * 0.25, 1.65, z], [x, 1.65, z], 0.045); }
    if (kind === 17) { objectBox(parts, "导向立柱", x, 1.35, z, 0.1, 2.1, 0.1); objectPanel(parts, "分向路牌", [x, 2, z], w, 0.32, 2); objectPanel(parts, "目的地牌", [x + w * 0.13, 1.56, z - 0.05], w * 0.8, 0.24, 1); }
  }
  objectBox(parts, "设施地脚连接板", 0, 0.255, depth * 0.33, width * 0.8, 0.045, 0.18, objectColors.edge);
  return parts;
}
