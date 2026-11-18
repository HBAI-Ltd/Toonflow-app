import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function controlWheel(position: Triple, radius: number, horizontal = false): ModelPart[] {
  const [x, y, z] = position;
  const parts: ModelPart[] = [ring("承力控制手轮轮缘", transportColors.dark, radius, radius * 0.12, y, radius * 0.12, { position: { x, y, z }, rotation: { x: horizontal ? 0 : 90, y: 0, z: 0 } }), cylinder("手轮中心固定轮毂", position, [radius * 0.35, radius * 0.22, radius * 0.35], transportColors.body, horizontal ? [0, 0, 0] : [90, 0, 0])];
  for (const degrees of [0, 120, 240]) {
    const angle = degrees * Math.PI / 180, dx = Math.cos(angle) * radius * 0.94, other = Math.sin(angle) * radius * 0.94;
    parts.push(strut("手轮轮缘至中心承力辐条", position, [x + dx, y + (horizontal ? 0 : other), z + (horizontal ? other : 0)], radius * 0.09));
  }
  return parts;
}

export const shipControlModels: TransportDefinition[] = [
  { name: "链窝轮卧式甲板锚机", theme: "现代", itemType: "设施", tags: ["锚机", "链窝轮", "带式制动"], create: () => {
    const profile: { x: number; y: number }[] = [];
    for (let tooth = 0; tooth < 8; tooth++) for (const [fraction, radius] of [[0, 0.205], [0.2, 0.265], [0.55, 0.265], [0.8, 0.205]]) { const angle = (tooth + fraction!) * Math.PI / 4; profile.push({ x: Math.cos(angle) * radius!, y: Math.sin(angle) * radius! }); }
    const parts: ModelPart[] = [
      box("甲板锚机固定座", [-0.2, 0.075, 0], [1.4, 0.15, 0.7], transportColors.dark),
      box("侧置减速齿轮箱", [-0.42, 0.35, 0], [0.35, 0.4, 0.45]),
      cylinder("横轴电驱动机", [-0.76, 0.34, 0], [0.27, 0.38, 0.27], transportColors.signal, [0, 0, 90]),
      cylinder("贯穿锚机传动轴", [-0.03, 0.4, 0], [0.08, 0.95, 0.08], transportColors.dark, [0, 0, 90]),
      part("深槽咬合锚链的链窝轮", "extrude", transportColors.body, [0, 0.4, 0], [1, 1, 1], [0, 90, 0], { depth: 0.13, profile }),
      cylinder("同轴制动鼓", [0.23, 0.4, 0], [0.46, 0.12, 0.46], transportColors.dark, [0, 0, 90]),
      part("包住制动鼓的制动带", "lathe", transportColors.trim, [0.23, 0.4, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0.232, y: -0.055 }, { x: 0.253, y: -0.055 }, { x: 0.253, y: 0.055 }, { x: 0.232, y: 0.055 }, { x: 0.232, y: -0.055 }] }),
      cylinder("制动带拉紧竖螺杆", [0.36, 0.66, 0.18], [0.03, 0.42, 0.03], transportColors.body),
      ...controlWheel([0.36, 0.88, 0.18], 0.12, true),
      box("链窝轮侧面轴承支座", [-0.16, 0.245, 0], [0.12, 0.23, 0.26]),
      ring("固定承载轴承圈", transportColors.dark, 0.085, 0.044, 0.4, 0.09, { position: { x: -0.16, y: 0.4, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }),
      strut("制动螺杆至带箍端耳", [0.36, 0.47, 0.18], [0.23, 0.5, 0.22], 0.04),
    ];
    return parts;
  } },
  { name: "流线舵叶与贯通舵轴组件", theme: "现代", itemType: "构件", tags: ["船舵", "流线舵叶", "舵轴"], create: () => {
    const section = [[0, -0.6], [0.075, -0.48], [0.06, 0.12], [0, 0.55], [-0.06, 0.12], [-0.075, -0.48]];
    const vertices = [0.2, 1.9].flatMap(y => section.map(([x, z]) => ({ x: x!, y, z: z! }))), indices: number[] = [];
    for (let index = 1; index < 5; index++) indices.push(0, index, index + 1, 6, 6 + index + 1, 6 + index);
    for (let index = 0; index < 6; index++) { const next = (index + 1) % 6; indices.push(index, index + 6, next, next, index + 6, next + 6); }
    return [part("闭合流线横截面舵叶", "mesh", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), cylinder("与舵叶连接的受扭舵轴", [0, 2.35, -0.25], [0.1, 0.9, 0.1], transportColors.dark), ...[2.1, 2.6].map(y => ring("留真实轴孔的固定舵轴承圈", transportColors.trim, 0.11, 0.06, y, 0.09, { position: { x: 0, y, z: -0.25 } }))];
  } },
  { name: "四缸推拉式液压船用舵机", theme: "现代", itemType: "设施", tags: ["液压舵机", "双侧推拉", "水平舵柄"], create: () => {
    const parts: ModelPart[] = [box("四缸舵机共用基座", [0, 0.1, 0], [2.2, 0.2, 1.95], transportColors.dark), cylinder("中央垂直舵轴接头", [0, 0.62, 0], [0.18, 0.9, 0.18], transportColors.body), box("双侧受推拉横向舵柄", [0, 0.65, 0], [1.35, 0.16, 0.22], transportColors.signal), cylinder("舵柄夹紧轴套", [0, 0.68, 0], [0.36, 0.22, 0.36], transportColors.dark)];
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(box("缸端固定支座", [side * 0.55, 0.38, end * 0.83], [0.3, 0.4, 0.26]), cylinder("水平双作用液压缸筒", [side * 0.55, 0.65, end * 0.59], [0.16, 0.54, 0.16], transportColors.body, [90, 0, 0]), strut("连接舵柄的活塞杆", [side * 0.55, 0.65, end * 0.32], [side * 0.55, 0.65, 0], 0.06, transportColors.trim), cylinder("活塞杆与舵柄铰接竖销", [side * 0.55, 0.65, end * 0.055], [0.07, 0.26, 0.07], transportColors.dark));
    return parts;
  } },
  { name: "联杆快闭矩形水密舱门", theme: "现代", itemType: "构件", tags: ["水密门", "中央手轮联杆", "铰链舱门"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].map(side => box("水密门框立边", [side * 0.45, 0.95, 0], [0.08, 1.9, 0.12])), ...[0.04, 1.86].map(y => box("水密门框上下边", [0, y, 0], [0.98, 0.08, 0.12])), part("切角加筋密封门叶", "extrude", transportColors.trim, [0, 0.95, 0], [1, 1, 1], [0, 0, 0], { depth: 0.04, profile: [{ x: -0.41, y: -0.78 }, { x: -0.34, y: -0.85 }, { x: 0.34, y: -0.85 }, { x: 0.41, y: -0.78 }, { x: 0.41, y: 0.78 }, { x: 0.34, y: 0.85 }, { x: -0.34, y: 0.85 }, { x: -0.41, y: 0.78 }] }), cylinder("手轮至中央联动盘轴", [0, 0.95, 0.055], [0.05, 0.11, 0.05], transportColors.body, [90, 0, 0]), ...controlWheel([0, 0.95, 0.09], 0.17)];
    for (const y of [0.45, 1.45]) parts.push(box("门侧铰链承力耳", [-0.49, y, 0], [0.13, 0.23, 0.12]), cylinder("门叶转动竖销", [-0.51, y, 0], [0.035, 0.31, 0.035], transportColors.dark));
    for (const side of [-1, 1]) for (const y of [0.4, 0.95, 1.5]) parts.push(strut("中央盘至侧压扣联杆", [0, 0.95, 0.045], [side * 0.38, y, 0.045], 0.014), strut("压住侧门框的旋压扣", [side * 0.38, y, 0.055], [side * 0.46, y + 0.03, 0.055], 0.035, transportColors.body));
    for (const side of [-1, 1]) parts.push(strut("上下锁扣联杆", [0, 0.95, 0.045], [0, 0.95 + side * 0.78, 0.045], 0.014), box("上下门框压扣", [0, 0.95 + side * 0.83, 0.055], [0.07, 0.16, 0.045], transportColors.body));
    return parts;
  } },
  { name: "联杆快开圆形人孔舱盖", theme: "现代", itemType: "构件", tags: ["人孔舱盖", "快开压扣", "圆形密封盖"], create: () => {
    const parts: ModelPart[] = [ring("保留人孔开口的安装法兰", transportColors.body, 0.5, 0.09, 0.56, 0.07, { rotation: { x: 90, y: 0, z: 0 } }), cylinder("覆盖人孔的密封盖板", [0, 0.56, 0.04], [0.84, 0.04, 0.84], transportColors.trim, [90, 0, 0]), cylinder("联动手轮中央传力轴", [0, 0.56, 0.075], [0.045, 0.1, 0.045], transportColors.body, [90, 0, 0]), ...controlWheel([0, 0.56, 0.12], 0.14), box("圆盖侧面铰链耳", [-0.52, 0.56, 0], [0.12, 0.28, 0.12]), cylinder("圆盖侧面贯穿铰销", [-0.52, 0.56, 0], [0.035, 0.34, 0.035], transportColors.dark)];
    for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3, x = Math.cos(angle), y = Math.sin(angle); parts.push(strut("中央联动压扣拉杆", [x * 0.08, 0.56 + y * 0.08, 0.08], [x * 0.445, 0.56 + y * 0.445, 0.08], 0.015), strut("由外缘扣入的压紧爪", [x * 0.47, 0.56 + y * 0.47, 0.08], [x * 0.38, 0.56 + y * 0.38, 0.08], 0.04, transportColors.body)); }
    return parts;
  } },
];
