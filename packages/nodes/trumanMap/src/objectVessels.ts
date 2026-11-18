import { part, ring, type ModelPart } from "./assetModelParts";
import { objectBox, objectCylinder, objectBeam, objectCode, objectColors } from "./objectModelParts";

export const vesselNames = ["茶杯", "带把饮杯", "高脚杯", "茶壶", "提梁水壶", "旅行水瓶", "长颈瓶", "礼仪瓮", "双耳陶罐", "食碗", "分格餐盘", "洗漱盆", "水桶", "啤酒杯", "倾注水罐", "熏香炉", "储油壶", "编架提篮", "旅行箱", "密封储物罐"];
const vesselProfiles = [
  [0.18, 0.22, 0.25, 0.23], [0.18, 0.21, 0.22, 0.22], [0.1, 0.12, 0.25, 0.2], [0.22, 0.34, 0.31, 0.18], [0.23, 0.3, 0.29, 0.2],
  [0.2, 0.23, 0.2, 0.12], [0.22, 0.3, 0.15, 0.09], [0.24, 0.37, 0.32, 0.15], [0.18, 0.34, 0.29, 0.14], [0.12, 0.2, 0.3, 0.35],
  [0.3, 0.34, 0.39, 0.42], [0.26, 0.32, 0.41, 0.44], [0.22, 0.26, 0.3, 0.32], [0.18, 0.22, 0.22, 0.25], [0.2, 0.3, 0.23, 0.25],
  [0.15, 0.31, 0.27, 0.22], [0.2, 0.33, 0.22, 0.12], [0.25, 0.31, 0.35, 0.37], [0.24, 0.27, 0.28, 0.28], [0.22, 0.29, 0.28, 0.26],
];
export function createVessels(kind: number, design: number): ModelPart[] {
  const parts: ModelPart[] = [], { frame, layout, joint } = objectCode(design), radii = vesselProfiles[kind]!, height = kind === 10 ? 0.14 : kind === 9 || kind === 11 ? 0.24 : kind === 6 || kind === 7 ? 0.68 : 0.43;
  let baseY = 0.12;
  if (frame === 0) { objectCylinder(parts, "平足底盘", 0, 0.035, 0, radii[0]! * 2.1, 0.07, radii[0]! * 2.1, objectColors.wood); for (const side of [-1, 1]) objectBox(parts, "底盘接榫", side * radii[0]! * 0.6, 0.09, 0, 0.055, 0.09, 0.11, objectColors.frame); }
  if (frame === 1) { for (let leg = 0; leg < 3; leg++) { const angle = leg * Math.PI * 2 / 3; objectBeam(parts, "三足支承", [Math.cos(angle) * radii[0]!, 0.02, Math.sin(angle) * radii[0]!], [Math.cos(angle) * radii[0]! * 0.7, 0.16, Math.sin(angle) * radii[0]! * 0.7], 0.055, objectColors.wood); } baseY = 0.18; }
  if (frame === 2) { objectCylinder(parts, "高脚器座", 0, 0.04, 0, 0.36, 0.08, 0.36, objectColors.wood); objectCylinder(parts, "高脚支干", 0, 0.2, 0, 0.075, 0.32, 0.075, objectColors.edge); objectCylinder(parts, "高脚承托", 0, 0.36, 0, radii[0]! * 1.8, 0.06); baseY = 0.4; }
  if (frame === 3) { for (const side of [-1, 1]) { objectBox(parts, "框架器足", side * radii[0]! * 0.8, 0.1, 0, 0.045, 0.2, radii[0]! * 1.8, objectColors.wood); objectBox(parts, "横向器足", 0, 0.08, side * radii[0]! * 0.8, radii[0]! * 1.8, 0.045, 0.045, objectColors.wood); } baseY = 0.23; }
  if (frame === 4) { for (const side of [-1, 1]) { objectBox(parts, "滑架底轨", side * radii[0]! * 0.8, 0.035, 0, 0.07, 0.07, radii[0]! * 2.5, objectColors.wood); objectBeam(parts, "滑架托臂", [side * radii[0]! * 0.8, 0.08, -0.12], [0, 0.2, 0], 0.055); } baseY = 0.23; }
  const profile = [{ x: radii[0]! * 0.6, y: 0 }, ...radii.map((radius, index) => ({ x: radius * (layout === 1 && index === 1 ? 0.66 : layout === 2 && index === 2 ? 0.63 : layout === 3 && index % 2 ? 1.16 : 1), y: height * index / 3 })), { x: radii[3]! - 0.025, y: height }, { x: Math.max(0.025, radii[0]! - 0.025), y: 0.035 }];
  if (kind === 18) {
    if (layout === 0) { objectBox(parts, "箱体", 0, baseY + height / 2, 0, 0.65, height, 0.44, objectColors.wood); objectBox(parts, "上掀箱盖", 0, baseY + height + 0.025, 0, 0.68, 0.055, 0.47, objectColors.wood); }
    if (layout === 1) for (const side of [-1, 1]) { objectBox(parts, "分离侧箱", side * 0.18, baseY + height / 2, 0, 0.32, height, 0.44, objectColors.wood); objectBox(parts, "双仓箱盖", side * 0.18, baseY + height + 0.025, 0, 0.33, 0.055, 0.47, objectColors.wood); }
    if (layout === 2) for (let drawer = 0; drawer < 3; drawer++) { objectBox(parts, "抽屉分仓", 0, baseY + (drawer + 0.5) * height / 3, 0, 0.65, height / 3 * 0.9, 0.44, objectColors.wood); objectBox(parts, "分仓提柄", 0, baseY + (drawer + 0.5) * height / 3, -0.25, 0.22, 0.035, 0.05, objectColors.frame); }
    if (layout === 3) for (const end of [-1, 1]) { objectBox(parts, "前后独立箱仓", 0, baseY + height / 2, end * 0.14, 0.65, height, 0.24, objectColors.wood); objectBox(parts, "外掀仓盖", end * 0.16, baseY + height + 0.05, end * 0.14, 0.35, 0.055, 0.25, objectColors.wood, [0, 0, end * 18]); }
    for (const side of [-1, 1]) objectBox(parts, "旅行箱护角带", side * 0.24, baseY + height / 2, -0.235, 0.055, height, 0.035, objectColors.edge);
  }
  else parts.push(part("中空器身", "lathe", objectColors.body, [0, baseY, 0], [1, 1, 1], [0, 0, 0], { profile }));
  if (kind !== 18) parts.push(ring("口沿加强圈", objectColors.edge, radii[3]! + 0.01, 0.025, baseY + height - 0.01, 0.035));
  const handles = kind === 2 || kind === 6 || kind === 10 ? 1 : kind === 8 ? 2 : kind === 17 ? 3 : 1 + Number(layout === 3);
  for (let handle = 0; handle < handles; handle++) {
    const angle = handle / handles * Math.PI * 2, radius = radii[2]!, x = Math.cos(angle), z = Math.sin(angle), upper = baseY + height * 0.8, lower = baseY + height * 0.24;
    objectBeam(parts, "提耳上连杆", [x * radius, upper, z * radius], [x * (radius + 0.16), upper - 0.03, z * (radius + 0.16)], 0.04, objectColors.wood);
    objectBeam(parts, joint ? "弧耳外段" : "直耳外段", [x * (radius + 0.16), upper - 0.03, z * (radius + 0.16)], [x * (radius + (joint ? 0.23 : 0.16)), lower + 0.03, z * (radius + (joint ? 0.23 : 0.16))], 0.045, objectColors.wood);
    objectBeam(parts, "提耳下连杆", [x * (radius + (joint ? 0.23 : 0.16)), lower + 0.03, z * (radius + (joint ? 0.23 : 0.16))], [x * radii[1]!, lower, z * radii[1]!], 0.04, objectColors.wood);
  }
  if (kind === 3 || kind === 4 || kind === 14 || kind === 16) { objectBeam(parts, "倾注壶嘴", [-radii[2]!, baseY + height * 0.45, 0], [-radii[2]! - 0.25, baseY + height * 0.9, 0], 0.085, objectColors.edge); objectCylinder(parts, "出水口", -radii[2]! - 0.25, baseY + height * 0.9, 0, 0.11, 0.065); }
  if ([3, 4, 5, 6, 7, 8, 12, 13, 15, 16, 19].includes(kind)) { objectCylinder(parts, "器盖", 0, baseY + height + 0.025, 0, radii[3]! * 2.08, 0.05, radii[3]! * 2.08, objectColors.wood); objectCylinder(parts, "盖钮", 0, baseY + height + 0.09, 0, 0.09, 0.09, 0.09, objectColors.frame); }
  if (kind === 10) for (const side of [-1, 1]) objectBox(parts, "餐盘隔栏", side * 0.13, baseY + height, 0, 0.025, 0.06, 0.56, objectColors.wood);
  if (kind === 15) for (let hole = 0; hole < 3; hole++) objectCylinder(parts, "香插管", (hole - 1) * 0.09, baseY + height + 0.06, 0, 0.035, 0.16, 0.035, objectColors.edge);
  if (kind === 17) for (let rib = 0; rib < 5; rib++) { const angle = rib / 5 * Math.PI * 2; objectBeam(parts, "篮身承力筋", [Math.cos(angle) * radii[0]!, baseY, Math.sin(angle) * radii[0]!], [Math.cos(angle) * radii[3]!, baseY + height, Math.sin(angle) * radii[3]!], 0.03, objectColors.wood); }
  objectCylinder(parts, "器底隔热承盘", 0, baseY - 0.025, 0, radii[0]! * 2, 0.05, radii[0]! * 2, objectColors.wood);
  objectCylinder(parts, "底盘定位圈", 0, baseY - 0.055, 0, radii[0]! * 1.4, 0.04, radii[0]! * 1.4, objectColors.frame);
  return parts;
}
