import { part, ring, type ModelPart } from "./assetModelParts";
import { objectBox, objectCylinder, objectBeam, objectCode, objectColors, objectPanel } from "./objectModelParts";

export const lightingNames = ["街道灯", "立式阅读灯", "书桌灯", "检修灯", "防护提灯", "枝形吊灯", "门柱灯", "航标灯", "三脚泛光灯", "悬吊灯架", "聚光灯", "轨道照明架", "火炬台", "油灯", "导光柱", "环形摄影灯", "银行罩灯", "双侧壁灯架", "太阳能灯", "双头车间灯"];
export function createLighting(kind: number, design: number): ModelPart[] {
  const parts: ModelPart[] = [], { frame, layout, joint } = objectCode(design), height = kind === 2 || kind === 4 || kind === 13 || kind === 16 ? 0.65 : kind === 0 || kind === 7 || kind === 18 ? 3.2 : 1.75;
  if (frame === 0) { objectCylinder(parts, "盘形底座", 0, 0.055, 0, 0.65, 0.11); objectCylinder(parts, "中立灯杆", 0, height * 0.5, 0, 0.09, height); }
  if (frame === 1) for (const side of [-1, 1]) { objectBox(parts, "双脊底足", side * 0.25, 0.055, 0, 0.16, 0.11, 0.7); objectBox(parts, "双脊立架", side * 0.25, height / 2, 0, 0.065, height, 0.08); objectBeam(parts, "双脊汇合臂", [side * 0.25, height * 0.75, 0], [0, height, 0], 0.06); }
  if (frame === 2) { objectBox(parts, "悬臂底轨", 0, 0.05, 0, 0.6, 0.1, 0.8); objectBeam(parts, "后倾立柱", [0, 0.1, 0.25], [0, height * 0.72, 0.45], 0.085); objectBeam(parts, "前悬灯臂", [0, height * 0.72, 0.45], [0, height, -0.3], 0.085); }
  if (frame === 3) for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; objectBeam(parts, "三脚承灯腿", [Math.cos(angle) * 0.4, 0.06, Math.sin(angle) * 0.4], [0, height * 0.7, 0], 0.065); objectBox(parts, "三脚接地垫", Math.cos(angle) * 0.4, 0.04, Math.sin(angle) * 0.4, 0.16, 0.08, 0.16); }
  if (frame === 4) { for (const side of [-1, 1]) { objectBox(parts, "门形立柱", side * 0.43, height / 2, 0, 0.07, height, 0.1); objectBox(parts, "门形足", side * 0.43, 0.04, 0, 0.24, 0.08, 0.6); } objectBox(parts, "门形横梁", 0, height, 0, 0.96, 0.08, 0.1); }
  objectCylinder(parts, "灯头分线座", 0, height, 0, 0.23, 0.14, 0.23, objectColors.edge);
  const count = layout + 1;
  for (let index = 0; index < count; index++) {
    const angle = index / count * Math.PI * 2, radius = count === 1 ? 0.28 : 0.48, x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
    objectBeam(parts, joint ? "折臂上连杆" : "放射悬臂", [0, height, 0], joint ? [x * 0.5, height + 0.22, z * 0.5] : [x, height + 0.02, z], 0.055);
    if (joint) objectBeam(parts, "折臂下连杆", [x * 0.5, height + 0.22, z * 0.5], [x, height - 0.04, z], 0.045);
    objectCylinder(parts, "光源座", x, height - 0.07, z, 0.18, 0.14, 0.18, objectColors.edge);
    if (kind === 1) { objectBox(parts, "阅读遮光挡板", x, height - 0.1, z + 0.2, 0.5, 0.3, 0.045, objectColors.wood); objectBeam(parts, "阅读灯定向拉杆", [0, height * 0.65, 0], [x, height - 0.08, z], 0.025); }
    if (kind === 2) { objectCylinder(parts, "台灯上铰", x, height + 0.1, z, 0.13, 0.07, 0.13, objectColors.edge, [90, 0, 0]); objectBox(parts, "台灯夹持螺杆座", 0.18, 0.12, 0, 0.18, 0.18, 0.2); objectCylinder(parts, "桌沿锁紧杆", 0.18, 0.1, 0, 0.035, 0.3, 0.035, objectColors.edge); }
    if (kind === 3) for (const side of [-1, 1]) objectBeam(parts, "手持检修灯护笼", [x + side * 0.25, height - 0.35, z], [x + side * 0.25, height + 0.05, z], 0.025, objectColors.edge);
    if (kind === 4) { objectBeam(parts, "提灯左提梁", [x - 0.13, height + 0.02, z], [x, height + 0.32, z], 0.03); objectBeam(parts, "提灯右提梁", [x, height + 0.32, z], [x + 0.13, height + 0.02, z], 0.03); }
    if (kind === 5) for (const side of [-1, 1]) { objectCylinder(parts, "枝形蜡烛托", x + side * 0.16, height + 0.05, z, 0.12, 0.05, 0.12, objectColors.edge); objectCylinder(parts, "枝形蜡烛", x + side * 0.16, height + 0.2, z, 0.06, 0.25, 0.06, objectColors.light); }
    if (kind === 6) { objectBox(parts, "门柱实心灯基", x, height - 0.52, z, 0.4, 0.3, 0.4, objectColors.edge); objectBox(parts, "门柱灯檐", x, height + 0.12, z, 0.48, 0.06, 0.48); }
    if (kind === 7) { objectCylinder(parts, "航标旋转透镜", x, height - 0.14, z, 0.38, 0.16, 0.38, objectColors.glass); objectBox(parts, "航标定向反射面", x, height - 0.14, z + 0.18, 0.36, 0.24, 0.04, objectColors.edge); }
    if (kind === 8) { objectBox(parts, "泛光平面反射器", x, height - 0.2, z - 0.14, 0.55, 0.4, 0.12, objectColors.edge); objectPanel(parts, "泛光灯阵", [x, height - 0.2, z - 0.22], 0.46, 0.29, 3); }
    if (kind === 9) { objectBox(parts, "悬灯配重轨", x, height + 0.14, z, 0.7, 0.06, 0.06); objectCylinder(parts, "悬灯配重", x + 0.28, height - 0.13, z, 0.13, 0.42); }
    if (kind === 10) for (const side of [-1, 1]) objectBox(parts, "聚光遮扉", x + side * 0.24, height - 0.16, z - 0.15, 0.13, 0.25, 0.04, objectColors.frame, [0, side * 25, 0]);
    if (kind === 12) { objectBox(parts, "火炬分叉托", x, height - 0.18, z, 0.38, 0.06, 0.15); for (const side of [-1, 1]) objectCylinder(parts, "火炬托爪", x + side * 0.14, height - 0.06, z, 0.045, 0.27, 0.045, objectColors.frame); }
    if (kind === 13) { objectCylinder(parts, "油灯储油室", x, height - 0.27, z, 0.33, 0.13, 0.33, objectColors.accent); objectCylinder(parts, "玻璃防风烟罩", x, height + 0.03, z, 0.19, 0.43, 0.19, objectColors.glass); parts.at(-1)!.opacity = 0.3; }
    if (kind === 17) { objectBox(parts, "墙架安装板", x, height - 0.14, z + 0.3, 0.3, 0.65, 0.06); objectBeam(parts, "壁灯下托臂", [x, height - 0.44, z + 0.3], [x, height - 0.32, z], 0.055); }
    if (kind === 19) { objectBox(parts, "双管灯桥", x, height - 0.06, z, 0.6, 0.06, 0.08); for (const side of [-1, 1]) objectCylinder(parts, "并排车间灯管", x + side * 0.23, height - 0.18, z, 0.07, 0.55, 0.07, objectColors.light, [90, 0, 0]); }
    if (kind === 0 || kind === 10 || kind === 19) { objectBox(parts, "矩形反射灯壳", x, height - 0.16, z, 0.38, 0.18, 0.24); objectBox(parts, "矩形发光面", x, height - 0.26, z, 0.31, 0.025, 0.19, objectColors.light); }
    else if (kind === 4 || kind === 6 || kind === 7 || kind === 17) {
      objectBox(parts, "提灯顶", x, height + 0.03, z, 0.31, 0.065, 0.31); objectBox(parts, "提灯底", x, height - 0.36, z, 0.31, 0.065, 0.31);
      for (const side of [-1, 1]) objectBox(parts, "光源保护格", x + side * 0.13, height - 0.17, z, 0.025, 0.36, 0.22, objectColors.frame);
      objectCylinder(parts, "灯芯光柱", x, height - 0.17, z, 0.12, 0.26, 0.12, objectColors.light);
    } else if (kind === 12 || kind === 13) { objectCylinder(parts, "油盏", x, height - 0.16, z, 0.27, 0.12, 0.27, objectColors.accent); parts.push(part("火焰罩", "cone", objectColors.light, [x, height + 0.02, z], [0.12, 0.24, 0.12])); }
    else if (kind === 14) { objectCylinder(parts, "导光芯", x, height - 0.28, z, 0.11, 0.65, 0.11, objectColors.light); objectBox(parts, "导光柱背脊", x, height - 0.28, z + 0.07, 0.2, 0.7, 0.07); }
    else if (kind === 15) { parts.push(ring("摄影环灯", objectColors.light, 0.28, 0.045, height - 0.12, 0.045)); parts.at(-1)!.position.x = x; parts.at(-1)!.position.z = z; objectBeam(parts, "环灯托架", [x, height - 0.4, z], [x, height - 0.16, z], 0.045); }
    else if (kind === 16) { objectBox(parts, "横向遮光罩", x, height - 0.12, z, 0.48, 0.18, 0.21, objectColors.accent); objectCylinder(parts, "横置灯管", x, height - 0.21, z, 0.055, 0.37, 0.055, objectColors.light, [0, 0, 90]); }
    else { parts.push(part("锥形遮光罩", "cone", objectColors.body, [x, height - 0.15, z], [0.43, 0.3, 0.43])); objectCylinder(parts, "灯罩内灯泡", x, height - 0.29, z, 0.19, 0.12, 0.19, objectColors.light); }
  }
  if (kind === 3 || kind === 8) { objectBox(parts, "检修电源箱", 0, height * 0.3, 0.1, 0.28, 0.24, 0.19); objectPanel(parts, "电源开关", [0, height * 0.3, -0.01], 0.21, 0.13, 2); }
  else if (kind === 5 || kind === 9) { objectCylinder(parts, "吊索连接轴", 0, height + 0.22, 0, 0.06, 0.4); objectBox(parts, "吊顶安装板", 0, height + 0.45, 0, 0.34, 0.05, 0.22); }
  else if (kind === 11) for (const side of [-1, 1]) objectBox(parts, "照明滑轨", side * 0.3, height - 0.01, 0, 0.055, 0.075, 1.2);
  else if (kind === 18) { objectBox(parts, "光伏电池板", 0, height + 0.24, 0.15, 1, 0.055, 0.68, objectColors.glass, [-20, 0, 0]); objectBox(parts, "蓄电盒", 0, height * 0.3, 0.08, 0.25, 0.34, 0.18); }
  objectBox(parts, "底部接线盒", 0, 0.14, 0.13, 0.19, 0.2, 0.14);
  objectCylinder(parts, "线管上接头", 0, height * 0.64, 0.065, 0.12, 0.07);
  objectCylinder(parts, "线管下接头", 0, height * 0.24, 0.065, 0.12, 0.07);
  objectBox(parts, "可操作开关", 0, 0.22, 0.22, 0.07, 0.06, 0.025, objectColors.accent);
  return parts;
}
