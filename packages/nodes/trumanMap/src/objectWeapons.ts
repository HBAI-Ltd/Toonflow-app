import { part, type ModelPart } from "./assetModelParts";
import { objectBox, objectCylinder, objectBeam, objectCode, objectColors, objectGrid, objectFrame } from "./objectModelParts";

export const weaponNames = ["长剑", "刺剑", "战斧", "长柄戟", "长矛", "战锤", "棱头槌", "反曲弓", "机械弩", "塔盾", "法杖", "短杖", "野战炮", "迫击装置", "弩炮", "攻城塔", "投石机", "护卫棍", "链枷", "军旗架"];
export function createWeapons(kind: number, design: number): ModelPart[] {
  const parts: ModelPart[] = [], { frame, layout, joint } = objectCode(design);
  if (kind >= 12 && kind <= 16) {
    objectFrame(parts, frame, 1.5, 1.7, 0.58, joint); objectBox(parts, "战械承台", 0, 0.65, 0, 1.5, 0.15, 1.7, objectColors.wood);
    for (let unit = 0; unit <= layout; unit++) { const x = (unit - layout / 2) * 1.25 / (layout + 1);
      if (kind === 12 || kind === 13) { objectCylinder(parts, "炮管", x, 1.05, -0.2, kind === 12 ? 0.32 : 0.42, kind === 12 ? 1.9 : 1.15, kind === 12 ? 0.32 : 0.42, objectColors.frame, [kind === 12 ? 72 : 25, 0, 0]); objectCylinder(parts, "炮耳轴", x, 0.9, 0, 0.18, 0.55, 0.18, objectColors.edge, [0, 0, 90]); objectBox(parts, "炮尾支架", x, 0.88, 0.5, 0.3, 0.35, 0.26); }
      if (kind === 14) { for (const side of [-1, 1]) objectBeam(parts, "弩炮弓臂", [x, 1.05, 0], [x + side * 0.66, 1.22, -0.3], 0.085, objectColors.wood); objectBox(parts, "弩炮箭槽", x, 1, -0.25, 0.15, 0.1, 1.7, objectColors.wood); objectBeam(parts, "弩炮弦", [x - 0.66, 1.22, -0.3], [x + 0.66, 1.22, -0.3], 0.018, objectColors.edge); }
      if (kind === 15) { for (const side of [-1, 1]) objectBox(parts, "攻城塔立柱", x + side * 0.23, 1.45, 0, 0.09, 1.6, 0.12, objectColors.wood); objectBox(parts, "塔顶平台", x, 2.24, 0, 0.6, 0.1, 1.4, objectColors.wood); objectGrid(parts, "防护女墙", 3, [x, 2.48, -0.64], 0.5, [0.12, 0.4, 0.08]); }
      if (kind === 16) { objectBeam(parts, "投石抛臂", [x, 0.85, 0.65], [x, 2.25, -0.6], 0.14, objectColors.wood); objectBox(parts, "投石兜", x, 2.22, -0.64, 0.42, 0.13, 0.4); objectBox(parts, "配重箱", x, 0.94, 0.6, 0.45, 0.45, 0.5, objectColors.frame); }
    }
    return parts;
  }
  const radius = 0.08, length = kind === 1 ? 0.75 : kind === 11 ? 0.45 : kind === 3 || kind === 4 || kind === 10 || kind === 19 ? 1.5 : 0.9;
  for (let segment = 0; segment < frame + 2; segment++) {
    const y = (segment + 0.5) * length / (frame + 2), offset = frame === 1 ? (segment % 2 - 0.5) * 0.09 : frame === 2 ? Math.sin(segment) * 0.12 : frame === 3 ? (segment % 2) * 0.16 : frame === 4 ? (segment - (frame + 1) / 2) * 0.035 : 0;
    objectCylinder(parts, "分节承力柄", offset, y, 0, radius * 1.65, length / (frame + 2) * 1.03, radius * 1.65, objectColors.wood);
    objectCylinder(parts, "柄节连接箍", offset, y + length / (frame + 2) * 0.45, 0, radius * 2, 0.04, radius * 2, objectColors.edge);
  }
  objectBox(parts, "手部护档", 0, length * 0.8, 0, joint ? 0.45 : 0.32, 0.06, 0.14, objectColors.edge);
  const heads = layout + 1;
  for (let index = 0; index < heads; index++) {
    const x = (index - layout / 2) * 0.22, y = length + (layout === 3 ? index * 0.09 : 0), z = joint ? (index % 2 - 0.5) * 0.12 : 0;
    objectBeam(parts, "头部骨架接臂", [0, length - 0.1, 0], [x, y + 0.1, z], 0.075);
    if (kind === 0 || kind === 1 || kind === 4) { objectBox(parts, "直刃主体", x, y + 0.36, z, kind === 1 ? 0.055 : kind === 4 ? 0.09 : 0.14, 0.6, 0.045, objectColors.edge); parts.push(part("刃尖", "cone", objectColors.edge, [x, y + 0.72, z], [kind === 1 ? 0.055 : 0.14, 0.15, 0.045])); }
    if (kind === 0) { objectBox(parts, "长剑双侧剑格", x, y + 0.02, z, 0.42, 0.055, 0.1, objectColors.edge); objectBox(parts, "剑脊加强肋", x, y + 0.35, z - 0.025, 0.035, 0.5, 0.035); }
    if (kind === 1) for (const side of [-1, 1]) { objectBeam(parts, "刺剑篮式护手", [x + side * 0.08, y - 0.2, z], [x + side * 0.2, y + 0.05, z - 0.12], 0.025, objectColors.edge); objectBeam(parts, "护手篮顶桥", [x + side * 0.2, y + 0.05, z - 0.12], [x, y + 0.1, z], 0.025, objectColors.edge); }
    if (kind === 4) { objectCylinder(parts, "矛刃套筒", x, y + 0.03, z, 0.16, 0.3); objectBox(parts, "矛套横销", x, y - 0.02, z, 0.28, 0.035, 0.04, objectColors.edge); }
    if (kind === 2 || kind === 3) { objectBox(parts, "斧刃根", x, y + 0.16, z, 0.25, 0.32, 0.08); objectBox(parts, "外展斧刃", x + 0.24, y + 0.18, z, 0.32, 0.44, 0.055, objectColors.edge, [0, 0, -16]); if (kind === 3) parts.push(part("戟顶尖", "cone", objectColors.edge, [x, y + 0.5, z], [0.11, 0.48, 0.11])); }
    if (kind === 5 || kind === 6) { objectCylinder(parts, "锤头连接鼓", x, y + 0.15, z, 0.28, 0.3); for (const side of [-1, 1]) objectBox(parts, kind === 5 ? "方锤击面" : "棱槌翼片", x + side * 0.18, y + 0.15, z, kind === 5 ? 0.22 : 0.06, 0.3, 0.26, objectColors.edge); }
    if (kind === 6) for (let fin = 0; fin < 3; fin++) objectBox(parts, "放射槌翼", x, y + 0.15, z, 0.42, 0.27, 0.045, objectColors.edge, [0, fin * 60, 0]);
    if (kind === 7 || kind === 8) { for (const side of [-1, 1]) objectBeam(parts, "弓臂", [x, y + 0.1, z], [x + side * 0.5, y + 0.35, z - 0.2], 0.07, objectColors.wood); objectBeam(parts, "张弦", [x - 0.5, y + 0.35, z - 0.2], [x + 0.5, y + 0.35, z - 0.2], 0.015, objectColors.edge); if (kind === 8) objectBox(parts, "箭槽", x, y, z, 0.12, 0.1, 0.8, objectColors.wood); }
    if (kind === 9) { objectBox(parts, "盾面", x, y + 0.25, z, 0.65, 0.9, 0.09, objectColors.wood); for (const side of [-1, 1]) objectBeam(parts, "盾面交叉肋", [x - side * 0.26, y + 0.6, z - 0.06], [x + side * 0.26, y - 0.1, z - 0.06], 0.045); objectCylinder(parts, "盾心护盖", x, y + 0.25, z - 0.1, 0.23, 0.13, 0.23, objectColors.edge, [90, 0, 0]); }
    if (kind === 10 || kind === 11) { objectCylinder(parts, "法杖冠架", x, y + 0.12, z, 0.25, 0.2, 0.25, objectColors.edge); parts.push(part("晶核", "sphere", objectColors.glass, [x, y + 0.32, z], [0.23, 0.3, 0.23])); for (const side of [-1, 1]) objectBeam(parts, "晶核护爪", [x + side * 0.08, y + 0.1, z], [x + side * 0.17, y + 0.46, z], 0.035); }
    if (kind === 10) for (const side of [-1, 1]) objectBeam(parts, "长杖分叉冠枝", [x, y + 0.05, z], [x + side * 0.27, y + 0.6, z + 0.08], 0.055, objectColors.wood);
    if (kind === 11) { objectBox(parts, "短杖引导叶", x, y + 0.42, z + 0.16, 0.32, 0.08, 0.1, objectColors.edge); objectCylinder(parts, "短杖定向孔", x, y + 0.43, z + 0.18, 0.1, 0.12, 0.1); }
    if (kind === 17) { objectBox(parts, "护卫棍横手柄", x + 0.16, y + 0.1, z, 0.35, 0.09, 0.09, objectColors.wood); objectCylinder(parts, "棍头", x, y + 0.34, z, 0.13, 0.52, 0.13, objectColors.wood); }
    if (kind === 18) { for (let link = 0; link < 3; link++) objectBeam(parts, "链枷连接节", [x + link * 0.08, y + 0.1 - link * 0.07, z], [x + (link + 1) * 0.08, y + 0.03 - link * 0.07, z], 0.045); parts.push(part("链枷击球", "sphere", objectColors.frame, [x + 0.3, y - 0.17, z], [0.3, 0.3, 0.3])); }
    if (kind === 19) { objectBox(parts, "旗面横杆", x, y + 0.35, z, 0.7, 0.055, 0.055, objectColors.wood); objectBox(parts, "旗面", x + 0.2, y + 0.03, z, 0.55, 0.6, 0.025, objectColors.accent); }
  }
  objectCylinder(parts, "柄尾配重", 0, 0.06, 0, 0.18, 0.12, 0.18, objectColors.frame);
  objectBox(parts, "护档卡销", 0, length * 0.79, -0.09, 0.12, 0.07, 0.07);
  return parts;
}
