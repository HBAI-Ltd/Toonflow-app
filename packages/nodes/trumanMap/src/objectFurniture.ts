import { part, type ModelPart } from "./assetModelParts";
import { objectBox, objectCylinder, objectFrame, objectGrid, objectCode, objectColors, objectPanel, objectBeam } from "./objectModelParts";

export const furnitureNames = ["餐椅", "圆凳", "园林长凳", "扶手椅", "摇椅", "躺椅", "书写桌", "餐台", "工艺工作台", "茶几", "单人床", "双层床", "组合沙发", "开放书架", "衣柜", "抽屉柜", "餐边柜", "展柜", "格栅屏风", "模块坐榻"];
export function createFurniture(kind: number, design: number): ModelPart[] {
  const parts: ModelPart[] = [], { frame, layout, joint } = objectCode(design);
  const width = [0.54, 0.48, 1.75, 0.78, 0.65, 0.76, 1.45, 1.9, 1.65, 1.15, 1.1, 1.12, 2.05, 1.3, 1.45, 0.9, 1.65, 1.15, 1.7, 1.65][kind]!;
  const depth = kind === 10 || kind === 11 || kind === 5 ? 2 : kind === 18 ? 0.38 : kind === 7 ? 0.9 : 0.62;
  const height = kind === 9 ? 0.34 : kind === 6 || kind === 7 || kind === 8 ? 0.72 : 0.43;
  objectFrame(parts, frame, width, depth, height, joint);
  const y = height + 0.055;
  if (kind <= 5 || kind === 12 || kind === 19) {
    const seats = layout === 0 ? 1 : layout === 1 ? 2 : layout === 2 ? 3 : 2;
    for (let index = 0; index < seats; index++) {
      const x = (index - (seats - 1) / 2) * width / seats, z = layout === 3 && index === 1 ? -depth * 0.3 : 0;
      objectBox(parts, "独立坐垫", x, y, z, width / seats * 0.91, 0.11, depth * 0.88, kind === 0 || kind === 2 ? objectColors.wood : objectColors.edge);
      if (kind !== 1) objectPanel(parts, "靠背", [x, y + 0.38 + (layout === 3 ? index * 0.12 : 0), depth * 0.4 + z], width / seats * 0.9, kind === 5 ? 0.3 : 0.52, kind === 0 || kind === 2 ? 3 : 1, objectColors.wood);
      if (kind !== 1) for (const side of [-1, 1]) objectBeam(parts, "座背承力连接", [x + side * width / seats * 0.35, y, depth * 0.35 + z], [x + side * width / seats * 0.35, y + 0.4 + (layout === 3 ? index * 0.12 : 0), depth * 0.4 + z], 0.045, objectColors.wood);
    }
    if (kind === 1) { objectCylinder(parts, "圆形座面", 0, y + 0.06, 0, width, 0.08, depth, objectColors.wood); for (const side of [-1, 1]) objectBox(parts, "脚踏横杆", 0, 0.24, side * depth * 0.3, width * 0.75, 0.055, 0.06, objectColors.frame); }
    if (kind === 3 || kind === 12) for (const side of [-1, 1]) objectBox(parts, "扶手承托", side * width * 0.44, y + 0.14, 0, 0.12, 0.28, depth, objectColors.wood);
    if (kind === 2) { objectBox(parts, "长凳中置承腿", 0, height / 2, depth * 0.23, 0.1, height, 0.15, objectColors.wood); for (const side of [-1, 1]) objectBox(parts, "长凳坐区分隔档", side * width * 0.22, y + 0.13, 0, 0.06, 0.2, depth * 0.75, objectColors.frame); }
    if (kind === 12) { objectGrid(parts, "沙发分区弹簧座", 3, [0, y + 0.11, -depth * 0.08], width * 0.64, [width * 0.28, 0.1, depth * 0.72], "x", objectColors.accent); objectBox(parts, "连续软包背梁", 0, y + 0.59, depth * 0.42, width * 0.85, 0.13, 0.17, objectColors.edge); }
    if (kind === 4) for (const side of [-1, 1]) parts.push(part("弧形摇枕", "extrude", objectColors.wood, [side * width * 0.42, 0.08, 0], [1, 1, 1], [0, 90, 0], { depth: 0.08, profile: [{ x: -1.1, y: 0.13 }, { x: -0.65, y: -0.04 }, { x: 0.65, y: -0.04 }, { x: 1.1, y: 0.13 }, { x: 0.65, y: 0.06 }, { x: -0.65, y: 0.06 }] }));
    if (kind === 5) objectBox(parts, "抬升腿托", 0, y + 0.04, -0.72, width * 0.82, 0.12, 0.65, objectColors.edge, [-12, 0, 0]);
    if (kind === 19) objectBox(parts, "坐榻侧台", width * 0.35, y + 0.13, -depth * 0.3, width * 0.28, 0.24, depth * 0.52, objectColors.wood);
  } else if (kind <= 9) {
    objectBox(parts, "主桌面", 0, y, 0, width, 0.095, depth, objectColors.wood);
    if (layout === 1) { objectBox(parts, "双侧延伸桌板", -width * 0.36, y - 0.12, -depth * 0.6, width * 0.28, 0.08, depth * 0.6, objectColors.wood); objectBox(parts, "双侧延伸桌板", width * 0.36, y - 0.12, -depth * 0.6, width * 0.28, 0.08, depth * 0.6, objectColors.wood); }
    else if (layout === 2) { objectBox(parts, "转角工作面", width * 0.33, y - 0.04, -depth * 0.7, width * 0.34, 0.09, depth, objectColors.wood); objectBox(parts, "转角承脚", width * 0.33, height / 2, -depth * 1.02, 0.1, height, 0.1); }
    else if (layout === 3) objectBox(parts, "上层工作面", 0, y + 0.24, depth * 0.3, width * 0.9, 0.08, depth * 0.4, objectColors.wood);
    if (kind === 6) { objectBox(parts, "悬挂抽斗", -width * 0.25, y - 0.17, 0, 0.38, 0.22, 0.42); objectBox(parts, "抽斗拉手", -width * 0.25, y - 0.17, -0.24, 0.16, 0.035, 0.035, objectColors.frame); }
    if (kind === 7) objectGrid(parts, "桌边隔档", 4, [0, y + 0.1, depth * 0.44], width * 0.85, [0.08, 0.15, 0.05]);
    if (kind === 8) { objectPanel(parts, "挂具板", [0, y + 0.37, depth * 0.43], width * 0.9, 0.58, 5); objectBox(parts, "台钳底", -width * 0.3, y + 0.12, -depth * 0.24, 0.22, 0.2, 0.2, objectColors.frame); objectBox(parts, "台钳夹口", -width * 0.3, y + 0.25, -depth * 0.24, 0.3, 0.08, 0.12, objectColors.edge); }
    if (kind === 9) { objectBox(parts, "底部置物板", 0, height * 0.45, 0, width * 0.83, 0.055, depth * 0.8, objectColors.wood); for (const side of [-1, 1]) objectBox(parts, "置物层承托柱", side * width * 0.28, height * 0.68, 0, 0.045, height * 0.48, 0.045, objectColors.frame); }
  } else if (kind === 10 || kind === 11) {
    const levels = kind === 11 ? 2 : 1;
    for (let level = 0; level < levels; level++) { const by = y + level * 1.15; objectBox(parts, "床垫", 0, by + 0.08, 0, width * 0.94, 0.2, depth * 0.94, objectColors.edge); objectBox(parts, "床头", 0, by + 0.33, depth * 0.48, width, 0.55, 0.08, objectColors.wood); objectGrid(parts, "承床排骨", 4 + layout, [0, by - 0.08, 0], depth * 0.85, [width * 0.91, 0.06, 0.1], "z"); }
    if (kind === 11) for (const side of [-1, 1]) { objectBox(parts, "上铺立柱", side * width * 0.45, 1.1, depth * 0.44, 0.075, 2.05, 0.075, objectColors.wood); for (let step = 0; step < 4; step++) objectBox(parts, "梯级", side * width * 0.37, 0.45 + step * 0.28, -depth * 0.45, 0.2, 0.045, 0.12, objectColors.wood); }
  } else {
    const levels = 2 + layout, tall = kind === 18 ? 1.65 : 1.55;
    for (const side of [-1, 1]) objectBox(parts, "柜体侧框", side * width * 0.47, y + tall / 2, 0, 0.075, tall, depth * 0.92, objectColors.wood);
    objectBox(parts, "顶框", 0, y + tall, 0, width, 0.08, depth, objectColors.wood);
    for (let level = 0; level < levels; level++) objectBox(parts, kind === 18 ? "屏风分隔横格" : "功能层板", 0, y + level * tall / levels, 0, width, 0.065, depth, objectColors.wood);
    if (kind === 13 || kind === 18) objectGrid(parts, "竖向分格", 2 + layout, [0, y + tall / 2, 0], width * 0.85, [0.05, tall * 0.95, 0.06]);
    if (kind === 14 || kind === 16) for (const side of [-1, 1]) { objectBox(parts, "柜门", side * width * 0.245, y + tall / 2, -depth * 0.48, width * 0.46, tall * 0.94, 0.045, objectColors.body); objectBox(parts, "门把", side * 0.09, y + tall * 0.52, -depth * 0.53, 0.035, 0.17, 0.04, objectColors.frame); }
    if (kind === 15) for (let level = 0; level < levels; level++) { objectBox(parts, "抽屉面", 0, y + (level + 0.45) * tall / levels, -depth * 0.48, width * 0.88, tall / levels * 0.78, 0.06, objectColors.body); objectBox(parts, "抽屉把", 0, y + (level + 0.45) * tall / levels, -depth * 0.55, 0.25, 0.04, 0.04, objectColors.frame); }
    if (kind === 17) { objectBox(parts, "透明展示门", 0, y + tall / 2, -depth * 0.48, width * 0.9, tall * 0.94, 0.025, objectColors.glass); parts.at(-1)!.opacity = 0.28; objectBeam(parts, "斜向展品托架", [-width * 0.3, y + 0.3, 0], [width * 0.3, y + 0.8, 0], 0.045); }
  }
  return parts;
}
