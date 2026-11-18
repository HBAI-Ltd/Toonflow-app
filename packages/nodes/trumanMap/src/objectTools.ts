import type { ModelPart } from "./assetModelParts";
import { objectBox, objectCylinder, objectBeam, objectCode, objectColors, objectGrid } from "./objectModelParts";

export const toolNames = ["羊角锤", "石工锤", "木工槌", "开口扳手", "连杆钳", "修枝剪", "背脊手锯", "弓架锯", "手持钻", "磨削机", "木工刨", "夹持器", "手动绞盘", "齿条千斤顶", "工具推车", "锻造砧", "锻炉风箱", "掘土镐", "挖土铲", "园艺耙"];
export function createTools(kind: number, design: number): ModelPart[] {
  const parts: ModelPart[] = [], { frame, layout, joint } = objectCode(design), headY = 1.12;
  if (frame === 0) { objectBox(parts, "直柄主杆", 0, 0.56, 0, 0.1, 1.12, 0.11, objectColors.wood); objectBox(parts, "护手握座", 0, 0.13, 0, 0.16, 0.25, 0.16, objectColors.frame); }
  if (frame === 1) { objectBeam(parts, "曲柄上段", [0, headY, 0], [0.24, 0.6, 0], 0.1, objectColors.wood); objectBeam(parts, "曲柄下段", [0.24, 0.6, 0], [0, 0.1, 0], 0.1, objectColors.wood); objectCylinder(parts, "曲柄转轴", 0.24, 0.6, 0, 0.16, 0.18, 0.16, objectColors.edge, [90, 0, 0]); }
  if (frame === 2) { for (const side of [-1, 1]) objectBeam(parts, "双柄连杆", [0, headY, 0], [side * 0.22, 0.1, 0], 0.085, objectColors.wood); objectBox(parts, "双柄横握", 0, 0.15, 0, 0.5, 0.1, 0.12, objectColors.frame); }
  if (frame === 3) { objectBox(parts, "T形主柄", 0, 0.65, 0, 0.11, 1, 0.11, objectColors.wood); objectBox(parts, "横向把手", 0, 0.18, 0, 0.65, 0.11, 0.12, objectColors.frame); for (const side of [-1, 1]) objectBeam(parts, "握把斜撑", [0, 0.5, 0], [side * 0.28, 0.18, 0], 0.045); }
  if (frame === 4) { for (const side of [-1, 1]) { objectBox(parts, "闭环握柄边", side * 0.16, 0.5, 0, 0.075, 0.85, 0.11, objectColors.wood); objectBeam(parts, "握柄肩", [side * 0.16, 0.9, 0], [0, headY, 0], 0.075); } objectBox(parts, "闭环握柄底", 0, 0.1, 0, 0.4, 0.1, 0.11, objectColors.wood); }
  const offsets = layout === 0 ? [0] : layout === 1 ? [-0.16, 0.16] : layout === 2 ? [-0.24, 0, 0.24] : [-0.2, 0.2];
  for (let index = 0; index < offsets.length; index++) {
    const x = offsets[index]!, y = headY + (layout === 3 ? index * 0.16 : 0), z = layout === 3 ? (index - 0.5) * 0.12 : 0;
    if (layout > 0) objectBeam(parts, "多头共用承力臂", [0, headY - 0.12, 0], [x, y - 0.07, z], 0.06);
    objectCylinder(parts, "头柄连接套", x, y - 0.09, z, 0.17, 0.21, 0.17, objectColors.edge);
    if (kind === 0) { objectBox(parts, "锤击头", x - 0.17, y + 0.05, z, 0.23, 0.2, 0.22); for (const side of [-1, 1]) objectBeam(parts, "开叉拔钉爪", [x + 0.06, y + 0.08, z + side * 0.055], [x + 0.3, y - 0.04, z + side * 0.055], 0.055); }
    if (kind === 1) { objectBox(parts, "石工锤方头", x, y + 0.07, z, 0.45, 0.24, 0.22); objectBox(parts, "石工锤扁刃", x + 0.29, y + 0.07, z, 0.16, 0.15, 0.045, objectColors.edge); }
    if (kind === 2) { objectCylinder(parts, "木槌横头", x, y + 0.09, z, 0.3, 0.52, 0.3, objectColors.wood, [0, 0, 90]); objectBox(parts, "槌头夹楔", x, y + 0.25, z, 0.13, 0.08, 0.2, objectColors.frame); }
    if (kind === 3) { for (const side of [-1, 1]) { objectBox(parts, "扳口夹臂", x + side * 0.14, y + 0.14, z, 0.1, 0.3, 0.14); objectBox(parts, "扳口内齿", x + side * 0.1, y + 0.25, z, 0.08, 0.065, 0.15, objectColors.edge); } }
    if (kind === 4 || kind === 5) { for (const side of [-1, 1]) objectBeam(parts, kind === 4 ? "钳口" : "剪切刀片", [x + side * 0.035, y, z], [x + side * (kind === 4 ? 0.12 : -0.16), y + 0.35, z], kind === 4 ? 0.09 : 0.045); objectCylinder(parts, "交叉铰轴", x, y + 0.03, z, 0.17, 0.2, 0.17, objectColors.edge, [90, 0, 0]); }
    if (kind === 6) { objectBox(parts, "锯片", x, y + 0.1, z, 0.66, 0.2, 0.025); objectGrid(parts, "锯齿", 7, [x, y - 0.02, z], 0.61, [0.045, 0.055, 0.03]); }
    if (kind === 7) { for (const side of [-1, 1]) objectBox(parts, "弓锯边架", x + side * 0.32, y + 0.14, z, 0.045, 0.37, 0.055); objectBox(parts, "弓锯背", x, y + 0.32, z, 0.68, 0.055, 0.06); objectBox(parts, "张紧锯条", x, y - 0.025, z, 0.64, 0.03, 0.018, objectColors.edge); }
    if (kind === 8 || kind === 9) { objectCylinder(parts, "动力壳体", x, y + 0.12, z, 0.25, 0.42, 0.25, objectColors.body, [0, 0, 90]); objectCylinder(parts, kind === 8 ? "钻头" : "磨盘", x + 0.32, y + 0.12, z, kind === 8 ? 0.065 : 0.4, kind === 8 ? 0.3 : 0.045, kind === 8 ? 0.065 : 0.4, objectColors.frame, [0, 0, 90]); }
    if (kind === 10) { objectBox(parts, "刨体", x, y, z, 0.65, 0.16, 0.28, objectColors.wood); objectBox(parts, "斜置刨铁", x + 0.1, y + 0.18, z, 0.08, 0.42, 0.23, objectColors.body, [0, 0, -32]); }
    if (kind === 11) { objectBox(parts, "夹具承梁", x, y, z, 0.6, 0.085, 0.13); for (const side of [-1, 1]) objectBox(parts, "夹口", x + side * 0.26, y + 0.2, z, 0.09, 0.35, 0.14); objectCylinder(parts, "推进丝杆", x + 0.25, y + 0.31, z, 0.055, 0.3, 0.055, objectColors.edge, [0, 0, 90]); }
    if (kind === 12) { objectCylinder(parts, "绳鼓", x, y + 0.12, z, 0.38, 0.28, 0.38, objectColors.wood, [90, 0, 0]); objectBeam(parts, "手摇曲柄", [x, y + 0.12, z - 0.2], [x + 0.26, y + 0.3, z - 0.2], 0.055); }
    if (kind === 13) { objectBox(parts, "齿条", x, y + 0.26, z, 0.12, 0.7, 0.13); objectGrid(parts, "啮合齿", 5, [x, y + 0.27, z - 0.09], 0.08, [0.025, 0.45, 0.06]); objectBox(parts, "抬升托爪", x + 0.16, y + 0.08, z, 0.38, 0.07, 0.24); }
    if (kind === 14) { objectBox(parts, "工具车托盘", x, y, z, 0.8, 0.08, 0.6); for (const side of [-1, 1]) objectBox(parts, "托盘侧挡", x + side * 0.37, y + 0.12, z, 0.05, 0.22, 0.6); objectBox(parts, "工具槽", x, y + 0.09, z + 0.23, 0.65, 0.14, 0.12); }
    if (kind === 15) { objectBox(parts, "砧面", x, y + 0.1, z, 0.65, 0.18, 0.33); objectCylinder(parts, "砧角", x + 0.4, y + 0.1, z, 0.22, 0.3, 0.22, objectColors.body, [0, 0, 90]); objectBox(parts, "砧腰", x, y - 0.09, z, 0.28, 0.2, 0.23); }
    if (kind === 16) { objectBox(parts, "风箱气室", x, y + 0.03, z, 0.6, 0.18, 0.32, objectColors.wood); objectBeam(parts, "风箱压杆", [x - 0.3, y + 0.12, z], [x + 0.35, y + 0.3, z], 0.07, objectColors.wood); objectCylinder(parts, "送风口", x + 0.39, y, z, 0.12, 0.25, 0.12, objectColors.body, [0, 0, 90]); }
    if (kind === 17) for (const side of [-1, 1]) objectBeam(parts, "镐刃", [x, y + 0.06, z], [x + side * 0.38, y - 0.05, z], 0.1);
    if (kind === 18) { objectBox(parts, "铲肩", x, y + 0.1, z, 0.38, 0.12, 0.08); objectBox(parts, "铲刃", x, y + 0.36, z - 0.03, 0.35, 0.42, 0.055, objectColors.body, [10, 0, 0]); }
    if (kind === 19) { objectBox(parts, "耙齿梁", x, y + 0.08, z, 0.62, 0.09, 0.08); objectGrid(parts, "耙齿", 6, [x, y + 0.25, z - 0.07], 0.56, [0.035, 0.32, 0.045]); }
  }
  for (let index = 0; index < 4; index++) { const y = 0.2 + index * 0.16, x = frame === 1 ? y < 0.6 ? 0.24 * (y - 0.1) / 0.5 : 0.24 * (headY - y) / 0.52 : frame === 2 ? (index % 2 ? 1 : -1) * 0.22 * (1 - y / headY) : frame === 4 ? (index % 2 ? 1 : -1) * 0.16 : 0; objectCylinder(parts, "握持防滑节", x, y, joint ? 0.07 : -0.07, 0.15, 0.045, 0.15, objectColors.frame); }
  if (joint) { objectBeam(parts, "主柄拉索", [-0.075, 0.22, 0], [0.18, 1.03, 0], 0.025, objectColors.edge); objectBeam(parts, "头部反力杆", [0.18, 1.03, 0], [0.32, 1.25, 0], 0.035); }
  else { objectBox(parts, "握柄护档", 0, 0.85, 0, 0.3, 0.055, 0.16); objectCylinder(parts, "头部锁销", 0, headY - 0.1, -0.04, 0.09, 0.22, 0.09, objectColors.edge, [90, 0, 0]); }
  return parts;
}
