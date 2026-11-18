import { part, type ModelPart } from "./assetModelParts";
import { objectBox, objectCylinder, objectBeam, objectCode, objectColors, objectPanel } from "./objectModelParts";

export const transportNames = ["厢式配送车", "城市出租车", "农用牵引车", "平台货车", "移动吊车", "消防救援车", "挖掘作业车", "道路压实车", "桨划艇", "帆船", "双体渡船", "港务工作船", "深潜器", "气垫运输艇", "滑翔机", "双翼邮递机", "旋翼救援机", "多旋翼货机", "巡航飞艇", "科研运载火箭"];
function hull(parts: ModelPart[], x: number, z: number, width: number, depth: number, height: number) {
  parts.push(part("折面船壳", "mesh", objectColors.body, [x, height / 2, z], [width, height, depth], [0, 0, 0], {
    vertices: [{ x: -0.5, y: 0.5, z: 0.38 }, { x: 0.5, y: 0.5, z: 0.38 }, { x: 0.28, y: 0.5, z: -0.5 }, { x: -0.28, y: 0.5, z: -0.5 }, { x: -0.25, y: -0.5, z: 0.24 }, { x: 0.25, y: -0.5, z: 0.24 }, { x: 0.08, y: -0.5, z: -0.4 }, { x: -0.08, y: -0.5, z: -0.4 }],
    indices: [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7],
  }));
}
export function createTransport(kind: number, design: number): ModelPart[] {
  const parts: ModelPart[] = [], { frame, layout, joint } = objectCode(design);
  if (kind < 8) {
    const length = kind < 3 ? 3.6 : 5.2, width = kind === 2 ? 1.65 : 1.95;
    if (frame === 4) { for (const end of [-1, 1]) { objectBox(parts, "铰接分体车架", 0, 0.67, end * length * 0.26, width * 0.78, 0.2, length * 0.42, objectColors.frame); if (!joint) for (const side of [-1, 1]) objectBox(parts, "分体边梁", side * width * 0.36, 0.82, end * length * 0.26, 0.11, 0.14, length * 0.4, objectColors.edge); else for (const side of [-1, 1]) objectBeam(parts, "分体空间斜梁", [side * width * 0.36, 0.8, end * length * 0.47], [-side * width * 0.36, 0.8, end * length * 0.07], 0.1); } objectCylinder(parts, "中置铰接回转节", 0, 0.72, 0, 0.48, 0.28); }
    else if (!joint) { for (const side of [-1, 1]) objectBox(parts, "纵向车架梁", side * width * 0.32, 0.67, 0, 0.13, 0.2, length, objectColors.frame); for (const z of [-length * 0.35, 0, length * 0.35]) objectBox(parts, "车架横梁", 0, 0.67, z, width * 0.86, 0.15, 0.12, objectColors.frame); }
    else { for (const side of [-1, 1]) objectBeam(parts, "空间桁架主梁", [side * width * 0.4, 0.62, -length * 0.46], [-side * width * 0.4, 0.82, length * 0.46], 0.16); objectBox(parts, "中央传动脊", 0, 0.7, 0, 0.25, 0.22, length * 0.92, objectColors.frame); }
    const axles = frame === 0 ? 2 : frame === 1 ? 3 : frame === 2 ? 4 : frame === 3 ? 5 : 3;
    for (let index = 0; index < axles; index++) { const z = (index / (axles - 1) - 0.5) * length * 0.7; objectCylinder(parts, "贯通传动桥", 0, 0.43, z, 0.11, width, 0.11, objectColors.frame, [0, 0, 90]); for (const side of [-1, 1]) { objectCylinder(parts, frame === 3 ? "履带负重轮" : "行走轮", side * width * 0.49, 0.43, z, 0.83, 0.25, 0.83, objectColors.frame, [0, 0, 90]); objectCylinder(parts, "轮毂", side * width * 0.56, 0.43, z, 0.3, 0.055, 0.3, objectColors.edge, [0, 0, 90]); } }
    if (frame === 3) for (const side of [-1, 1]) for (const top of [0, 0.76]) objectBox(parts, "履带连片", side * width * 0.49, top + 0.05, 0, 0.32, 0.1, length * 0.85, objectColors.frame);
    const cabinZ = layout === 0 ? -length * 0.3 : layout === 1 ? length * 0.28 : layout === 2 ? 0 : -length * 0.34;
    objectBox(parts, "驾驶舱下部", 0, 1.05, cabinZ, width * 0.88, 0.55, length * 0.27, objectColors.accent);
    objectBox(parts, "驾驶舱顶", 0, 1.95, cabinZ, width * 0.92, 0.12, length * 0.29, objectColors.edge);
    for (const side of [-1, 1]) for (const end of [-1, 1]) objectBox(parts, "驾驶室立柱", side * width * 0.41, 1.6, cabinZ + end * length * 0.12, 0.07, 0.62, 0.07, objectColors.frame);
    objectPanel(parts, "前挡风", [0, 1.62, cabinZ - length * 0.135], width * 0.72, 0.42, layout === 3 ? 3 : 2);
    const workZ = layout === 1 ? -length * 0.16 : length * 0.18;
    if (kind === 0) { objectBox(parts, "封闭货舱", 0, 1.5, workZ, width * 0.85, 1.2, length * 0.5); objectPanel(parts, "货舱分隔门", [0, 1.45, workZ + length * 0.255], width * 0.8, 0.95, 2 + layout); }
    if (kind === 1) { objectBox(parts, "乘员舱座台", 0, 1.25, workZ, width * 0.82, 0.4, length * 0.42); for (const side of [-1, 1]) objectBox(parts, "乘员扶窗框", side * width * 0.43, 1.62, workZ, 0.075, 0.45, length * 0.44, objectColors.accent); objectBox(parts, "出租车顶标", 0, 2.12, cabinZ, 0.48, 0.22, 0.18, objectColors.light); }
    if (kind === 2) { objectBox(parts, "发动机罩", 0, 1.15, -cabinZ, 0.8, 0.6, 1.25); objectCylinder(parts, "排气管", -0.38, 1.85, -cabinZ, 0.075, 1.05); objectBox(parts, "牵引挂接器", 0, 0.64, length * 0.55, 0.3, 0.18, 0.4); }
    if (kind === 3) { objectBox(parts, "承货平台", 0, 0.95, workZ, width, 0.12, length * 0.55, objectColors.wood); for (const side of [-1, 1]) for (let index = 0; index < 2 + layout; index++) objectBox(parts, "货台侧桩", side * width * 0.48, 1.22, workZ + (index / (1 + layout) - 0.5) * length * 0.45, 0.07, 0.55, 0.07); }
    if (kind === 4) { objectCylinder(parts, "吊臂回转台", 0, 1.12, workZ, 1.15, 0.3); objectBeam(parts, "主吊臂", [0, 1.3, workZ], [0, 3.8, workZ - 1.5], 0.28); objectBeam(parts, "起升绳", [0, 3.8, workZ - 1.5], [0, 1.65, workZ - 1.5], 0.035); objectBox(parts, "吊钩座", 0, 1.62, workZ - 1.5, 0.22, 0.18, 0.2); }
    if (kind === 5) { objectBox(parts, "救援器材舱", 0, 1.24, workZ, width * 0.9, 0.65, length * 0.55, objectColors.accent); for (const side of [-1, 1]) objectBeam(parts, "云梯侧轨", [side * 0.4, 1.7, workZ - 0.9], [side * 0.4, 2.8, workZ + 1.2], 0.07); for (let step = 0; step < 5; step++) objectBox(parts, "云梯横档", 0, 1.7 + step * 0.22, workZ - 0.9 + step * 0.42, 0.85, 0.055, 0.07, objectColors.edge); }
    if (kind === 6) { objectCylinder(parts, "挖臂回转座", 0, 1.1, workZ, 1.1, 0.35); objectBeam(parts, "动臂", [0, 1.4, workZ], [0, 2.75, -2.2], 0.24); objectBeam(parts, "斗杆", [0, 2.75, -2.2], [0, 1.1, -3.3], 0.2); objectBox(parts, "铲斗背", 0, 0.85, -3.3, 1, 0.6, 0.25); objectBox(parts, "铲斗底", 0, 0.6, -3.5, 1, 0.1, 0.65); }
    if (kind === 7) { objectCylinder(parts, "碾压滚筒", 0, 0.7, workZ, 1.4, width * 0.98, 1.4, objectColors.body, [0, 0, 90]); for (const side of [-1, 1]) objectBeam(parts, "滚筒支臂", [side * 0.9, 0.7, workZ], [side * 0.75, 1.1, cabinZ], 0.14); }
    if (layout === 3) { objectBox(parts, "后驾驶台", 0, 1.2, length * 0.41, width * 0.8, 0.38, length * 0.13); objectPanel(parts, "后控制台", [0, 1.6, length * 0.45], width * 0.65, 0.28, 3); }
  } else if (kind < 14) {
    const width = kind === 10 ? 3.3 : 1.8, depth = kind === 12 ? 4.1 : 4.7;
    const hulls = frame === 0 ? [0] : frame === 1 ? [-width * 0.3, width * 0.3] : frame === 2 ? [0, width * 0.65] : frame === 3 ? [-width * 0.6, 0, width * 0.6] : [-width * 0.55, width * 0.55];
    for (const x of hulls) hull(parts, x, 0, width / (hulls.length === 1 ? 1 : 2.5), depth, 0.7);
    if (frame === 4) for (const end of [-1, 1]) { objectBox(parts, "双体水翼承托", 0, 0.05, end * depth * 0.29, width * 1.24, 0.075, 0.3, objectColors.edge); for (const side of [-1, 1]) objectBox(parts, "水翼承重支鳍", side * width * 0.55, 0.24, end * depth * 0.29, 0.06, 0.4, 0.24); }
    for (const end of [-1, 1]) { objectBox(parts, "贯通甲板梁", 0, 0.73, end * depth * 0.3, width * 1.1, 0.12, 0.15); if (joint) objectBeam(parts, "甲板斜撑", [-width * 0.5, 0.5, end * depth * 0.3], [width * 0.5, 0.8, -end * depth * 0.3], 0.07); }
    for (let index = 0; index < 2 + layout; index++) objectBox(parts, "舱室分隔", 0, 0.83, (index / (1 + layout) - 0.5) * depth * 0.65, width * 0.86, 0.15, 0.25, objectColors.wood);
    for (const side of [-1, 1]) objectBeam(parts, "舷侧护栏", [side * width * 0.5, 1.08, -depth * 0.3], [side * width * 0.5, 1.08, depth * 0.3], 0.055);
    if (kind === 8) for (const side of [-1, 1]) { objectBeam(parts, "划桨", [side * 0.4, 0.95, 0], [side * 1.65, 0.35, -0.7], 0.055); objectBox(parts, "桨叶", side * 1.65, 0.35, -0.7, 0.35, 0.055, 0.6, objectColors.wood); }
    if (kind === 9) { objectCylinder(parts, "主桅", 0, 2.3, layout * 0.12, 0.1, 3.4); objectBeam(parts, "横帆桁", [-1.1, 3.4, 0], [1.1, 3.4, 0], 0.06); objectBox(parts, "主帆", 0.4, 2.6, 0, 1.55, 1.65, 0.035, objectColors.edge, [0, -12, 0]); }
    if (kind === 10) { objectBox(parts, "渡船贯通平台", 0, 0.88, 0, width, 0.13, depth * 0.75); objectBox(parts, "乘客雨棚", 0, 2.1, 0, width * 0.9, 0.1, depth * 0.55); for (const side of [-1, 1]) for (const end of [-1, 1]) objectBox(parts, "棚架立柱", side * width * 0.42, 1.48, end * depth * 0.23, 0.065, 1.2, 0.065); }
    if (kind === 11) { objectBox(parts, "驾驶楼", 0, 1.45, -0.7, 1.3, 1.2, 1.35); objectPanel(parts, "驾驶楼窗", [0, 1.7, -1.39], 1.15, 0.42, 3); objectBeam(parts, "绞车吊架", [0, 1.1, 1.1], [0, 2.3, 1.7], 0.12); }
    if (kind === 12) { objectCylinder(parts, "耐压主舱", 0, 1.05, 0, 1.3, 3.4, 1.3, objectColors.body, [90, 0, 0]); objectCylinder(parts, "观察窗", 0, 1.05, -1.72, 0.75, 0.1, 0.75, objectColors.glass, [90, 0, 0]); objectBox(parts, "潜望塔", 0, 1.9, 0.2, 0.4, 0.75, 0.5); }
    if (kind === 13) { objectBox(parts, "环形气裙前沿", 0, 0.32, -depth * 0.43, width * 1.25, 0.42, 0.35, objectColors.frame); objectBox(parts, "运输上甲板", 0, 0.95, 0, width, 0.18, depth * 0.8); for (const side of [-1, 1]) objectCylinder(parts, "推进风扇", side * 0.65, 1.55, depth * 0.4, 0.9, 0.18, 0.9, objectColors.frame, [90, 0, 0]); }
  } else {
    const span = kind === 18 ? 4.8 : 5.5, length = kind === 19 ? 1.3 : 3.8;
    objectBox(parts, "主承力机身", 0, 0.9, 0, 0.65, 0.7, length);
    const wings = frame + 1;
    for (let index = 0; index < wings; index++) { const z = (index - (wings - 1) / 2) * 0.6; for (const side of [-1, 1]) objectBeam(parts, joint ? "三角翼梁" : "直翼主梁", [side * 0.2, 1, z], [side * span * 0.5, 1 + (joint ? 0.22 : 0), z + (joint ? 0.7 : 0)], 0.16); }
    for (let index = 0; index < 1 + layout; index++) { const x = (index - layout / 2) * 0.7; objectCylinder(parts, "分布式动力舱", x, 0.9, -length * 0.45, 0.35, 0.55, 0.35, objectColors.accent, [90, 0, 0]); }
    for (const side of [-1, 1]) { objectBeam(parts, "起落支撑", [side * 0.25, 0.72, 0.4], [side * 0.8, 0.12, 0.5], 0.06); objectCylinder(parts, "起落轮", side * 0.8, 0.12, 0.5, 0.24, 0.1, 0.24, objectColors.frame, [0, 0, 90]); }
    objectBox(parts, "垂直尾翼", 0, 1.45, length * 0.4, 0.065, 0.85, 0.75, objectColors.edge);
    if (kind === 14) objectBox(parts, "无动力座舱罩", 0, 1.38, -0.55, 0.5, 0.42, 1.1, objectColors.glass);
    if (kind === 15) { objectBox(parts, "上层机翼", 0, 1.9, 0, span, 0.09, 0.65, objectColors.wood); for (const side of [-1, 1]) objectBeam(parts, "双翼撑杆", [side * 1.5, 1.05, 0], [side * 1.5, 1.85, 0], 0.045); }
    if (kind === 16) { objectCylinder(parts, "主旋翼轴", 0, 1.65, 0, 0.12, 0.7); for (const side of [-1, 1]) objectBox(parts, "旋翼叶片", side * 1.3, 2.04, 0, 2.45, 0.05, 0.22, objectColors.frame); objectBox(parts, "救援担架舱", 0, 0.6, 0.35, 0.9, 0.35, 2); }
    if (kind === 17) for (const side of [-1, 1]) for (const end of [-1, 1]) { objectBeam(parts, "旋翼动力臂", [0, 1.1, 0], [side * 1.3, 1.2, end * 1.1], 0.12); objectBox(parts, "动力旋叶", side * 1.3, 1.4, end * 1.1, 1.1, 0.04, 0.14, objectColors.frame); }
    if (kind === 18) { parts.push(part("浮力气囊", "sphere", objectColors.edge, [0, 2.2, 0], [2.2, 1.65, 5.8])); for (const side of [-1, 1]) objectBeam(parts, "吊舱悬索", [side * 0.2, 1.2, 0], [side * 0.8, 1.8, 0], 0.035); }
    if (kind === 19) { objectCylinder(parts, "火箭主推进级", 0, 2.1, 0, 1.1, 3.5, 1.1, objectColors.edge); parts.push(part("整流罩", "cone", objectColors.body, [0, 4.2, 0], [1.1, 0.8, 1.1])); for (let index = 0; index < 3 + layout; index++) { const angle = index / (3 + layout) * Math.PI * 2; objectCylinder(parts, "助推单元", Math.cos(angle) * 0.74, 1.3, Math.sin(angle) * 0.74, 0.35, 2.3, 0.35, objectColors.accent); } }
  }
  return parts;
}
