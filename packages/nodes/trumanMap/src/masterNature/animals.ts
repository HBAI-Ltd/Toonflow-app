import { beam, combineMeshes, design, eyes, leaf, legs, lobe, needle, part, tube } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const hide = "#aa987c";
const dark = "#716d5c";
const feather = "#afbaa2";

function fourFeet(width: number, height: number, length: number, thickness: number, color = hide): ModelPart[] {
  const roots: Triple[] = [-1, 1].flatMap(side => [-1, 1].map(end => [side * width, height, end * length] as Triple));
  return legs(roots, roots.map(root => [root[0], 0.06, root[2]]), thickness, color);
}

function face(root: Triple, width: number, length: number, color = hide): ModelPart[] {
  return [lobe("头颅", color, root, [width, width * 1.1, length]), ...eyes([root[0], root[1] + width * 0.16, root[2] + length * 0.2], width * 0.36, width * 0.09)];
}

function ears(root: Triple, gap: number, width: number, height: number, color = hide): ModelPart[] {
  return [-1, 1].map(side => leaf("外耳", color, [root[0] + side * gap, root[1], root[2]], width, height, [0, side * 25, -side * 15]));
}

function hoofs(width: number, length: number, size: number): ModelPart[] {
  return [-1, 1].flatMap(side => [-1, 1].map(end => part("角质蹄", "box", dark, [side * width, 0.05, end * length + 0.035], [size, 0.1, size * 1.3])));
}

export function membrane(name: string, color: string, points: Triple[]): ModelPart {
  const center = points.reduce((sum, point) => [sum[0] + point[0] / points.length, sum[1] + point[1] / points.length, sum[2] + point[2] / points.length] as Triple, [0, 0, 0] as Triple);
  const count = points.length + 1;
  const indices = points.flatMap((_, index) => [points.length, index, (index + 1) % points.length, count + points.length, count + (index + 1) % points.length, count + index]);
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices: [...points, center, ...points, center].map(([x, y, z]) => ({ x, y, z })), indices });
}

function mammal(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("马胸腹", hide, [0, 1.25, 0], [0.62, 0.8, 1.65]), beam("斜长马颈", hide, [0, 1.3, 0.5], [0, 1.95, 0.9], 0.36), ...face([0, 1.98, 1.04], 0.32, 0.64), ...ears([0, 2.12, 0.93], 0.13, 0.1, 0.3), ...fourFeet(0.22, 1.18, 0.54, 0.13), ...hoofs(0.22, 0.54, 0.14));
    for (let i = 0; i < 8; i++) parts.push(leaf("直立短鬃", dark, [0, 1.5 + i * 0.065, 0.52 + i * 0.055], 0.18, 0.25, [-35, 0, 0]));
    parts.push(tube("长马尾", dark, [[0, 1.45, -0.65], [0, 1.05, -1], [0, 0.45, -1.05]], 0.065));
  } else if (kind === 1) {
    parts.push(lobe("象躯干", "#a3a595", [0, 1.75, 0], [1.7, 2.1, 2.9]), ...face([0, 2.15, 1.35], 1.05, 0.9, "#a3a595"), ...fourFeet(0.54, 1.45, 0.85, 0.38, "#a3a595"));
    for (const side of [-1, 1]) parts.push(lobe("扇形象耳", "#b6b49f", [side * 0.67, 2.15, 1.14], [0.85, 1.32, 0.14], [0, side * -20, 0]), tube("弯象牙", "#d4ceb5", [[side * 0.3, 1.85, 1.65], [side * 0.36, 1.65, 2.05], [side * 0.4, 1.82, 2.3]], 0.055));
    parts.push(tube("卷曲象鼻", "#a3a595", [[0, 2.15, 1.7], [0, 1.2, 2.05], [0, 0.55, 2.1], [0, 0.65, 2.4]], 0.18));
  } else if (kind === 2) {
    parts.push(lobe("长颈鹿胸腹", "#bdac83", [0, 1.9, 0], [0.75, 0.95, 1.65]), beam("高耸斜颈", "#bdac83", [0, 2.1, 0.5], [0, 4.1, 1.1], 0.32), ...face([0, 4.12, 1.28], 0.32, 0.64, "#bdac83"), ...fourFeet(0.25, 1.8, 0.55, 0.13, "#bdac83"), ...ears([0, 4.25, 1.05], 0.2, 0.18, 0.28));
    for (const side of [-1, 1]) parts.push(beam("骨质短角", dark, [side * 0.11, 4.27, 1.2], [side * 0.12, 4.53, 1.15], 0.055), lobe("角顶毛簇", dark, [side * 0.12, 4.53, 1.15], [0.09, 0.1, 0.09]));
    for (let i = 0; i < 8; i++) parts.push(lobe("颈部块斑", "#968463", [0.145, 2.3 + i * 0.21, 0.58 + i * 0.055], [0.025, 0.15, 0.15]));
  } else if (kind === 3) {
    parts.push(lobe("骆驼长躯", "#b9ac8b", [0, 1.6, 0], [0.75, 0.8, 2]), lobe("双峰前峰", "#b9ac8b", [0, 2.02, 0.4], [0.6, 0.85, 0.7]), lobe("双峰后峰", "#b9ac8b", [0, 2.02, -0.45], [0.6, 0.8, 0.7]), tube("曲颈", "#b9ac8b", [[0, 1.55, 0.8], [0, 1.6, 1.3], [0, 2.15, 1.55]], 0.18), ...face([0, 2.17, 1.73], 0.3, 0.55, "#b9ac8b"), ...fourFeet(0.26, 1.5, 0.65, 0.13, "#b9ac8b"), ...ears([0, 2.3, 1.6], 0.12, 0.1, 0.17));
  } else if (kind === 4) {
    parts.push(lobe("袋鼠斜躯", "#ad9b7b", [0, 0.9, 0], [0.45, 0.95, 0.65], [25, 0, 0]), lobe("育儿袋外缘", "#c3b298", [0, 0.77, 0.23], [0.32, 0.3, 0.07]), ...face([0, 1.55, 0.35], 0.25, 0.42), ...ears([0, 1.65, 0.28], 0.1, 0.12, 0.4), tube("平衡长尾", hide, [[0, 0.75, -0.2], [0, 0.25, -0.8], [0, 0.06, -1.4]], 0.09));
    for (const side of [-1, 1]) parts.push(lobe("强壮后腿", hide, [side * 0.22, 0.55, -0.05], [0.25, 0.55, 0.4]), beam("后胫", hide, [side * 0.22, 0.5, -0.08], [side * 0.22, 0.1, 0.12], 0.1), lobe("长后足", hide, [side * 0.22, 0.08, 0.35], [0.12, 0.1, 0.65]), beam("短前臂", hide, [side * 0.2, 1.17, 0.22], [side * 0.2, 0.85, 0.48], 0.07));
  } else if (kind === 5) {
    parts.push(lobe("兔躯干", "#c2beaa", [0, 0.2, 0], [0.23, 0.32, 0.42]), ...face([0, 0.37, 0.22], 0.19, 0.19, "#c2beaa"), ...ears([0, 0.43, 0.2], 0.055, 0.07, 0.3, "#c2beaa"), lobe("兔尾", "#d5d1bc", [0, 0.2, -0.2], [0.1, 0.1, 0.1]));
    for (const side of [-1, 1]) parts.push(lobe("大后胯", "#b7b29d", [side * 0.08, 0.13, -0.1], [0.15, 0.2, 0.2]), lobe("兔后足", "#c2beaa", [side * 0.1, 0.04, 0], [0.09, 0.06, 0.23]), beam("兔前腿", "#c2beaa", [side * 0.065, 0.2, 0.14], [side * 0.065, 0.035, 0.2], 0.04));
  } else if (kind === 6) {
    parts.push(lobe("松鼠坐躯", hide, [0, 0.2, 0], [0.14, 0.3, 0.2]), ...face([0, 0.38, 0.1], 0.13, 0.16), ...ears([0, 0.43, 0.07], 0.05, 0.045, 0.1), tube("反卷尾骨", hide, [[0, 0.1, -0.08], [0, 0.2, -0.28], [0, 0.49, -0.23]], 0.045), lobe("蓬松大尾", "#9c8a68", [0, 0.38, -0.23], [0.18, 0.4, 0.17]));
    for (const side of [-1, 1]) parts.push(lobe("松鼠后足", hide, [side * 0.07, 0.035, 0.02], [0.065, 0.055, 0.16]), beam("抱食前肢", hide, [side * 0.065, 0.3, 0.03], [side * 0.04, 0.25, 0.15], 0.03));
  } else if (kind === 7) {
    parts.push(lobe("海狸圆躯", "#9c8d72", [0, 0.23, 0], [0.42, 0.4, 0.62]), ...face([0, 0.32, 0.3], 0.28, 0.3, "#9c8d72"), lobe("扁平鳞尾", dark, [0, 0.08, -0.55], [0.3, 0.045, 0.55]), ...fourFeet(0.14, 0.18, 0.2, 0.07, "#9c8d72"), ...ears([0, 0.44, 0.25], 0.1, 0.09, 0.08));
    for (const side of [-1, 1]) parts.push(part("外露板状门齿", "box", "#d6ca9c", [side * 0.025, 0.25, 0.45], [0.04, 0.08, 0.025]));
  } else if (kind === 8) {
    parts.push(lobe("蝙蝠躯体", dark, [0, 0.2, 0], [0.1, 0.23, 0.1]), ...face([0, 0.32, 0], 0.09, 0.09, dark), ...ears([0, 0.35, 0], 0.04, 0.05, 0.12, dark));
    for (const side of [-1, 1]) { const points: Triple[] = [[side * 0.03, 0.26, 0], [side * 0.2, 0.45, 0], [side * 0.52, 0.39, 0], [side * 0.38, 0.19, 0.01], [side * 0.18, 0.13, 0], [side * 0.035, 0.08, 0]]; parts.push(membrane("指间翼膜", "#918e7b", points)); for (const p of points.slice(2, 5)) parts.push(beam("延长翼指骨", dark, [side * 0.2, 0.45, 0], p, 0.007)); }
  } else if (kind === 9) {
    parts.push(lobe("刺猬腹体", "#aa9f84", [0, 0.07, 0], [0.17, 0.13, 0.26]), ...face([0, 0.06, 0.14], 0.07, 0.12), ...fourFeet(0.055, 0.05, 0.07, 0.022));
    parts.push(combineMeshes("密实背刺披覆", "#a7a48a", Array.from({ length: 36 }, (_, i) => { const a = i * 2.4; const r = 0.02 + i % 4 * 0.016; const root: Triple = [Math.cos(a) * r, 0.09, Math.sin(a) * r * 1.4 - 0.025]; return needle("背刺", "#a7a48a", root, [root[0] * 1.45, 0.16 + i % 3 * 0.012, root[2] * 1.35], 0.015); })));
  } else if (kind === 10) {
    parts.push(lobe("犰狳腹体", "#9e9d86", [0, 0.12, 0], [0.2, 0.18, 0.36]), ...face([0, 0.13, 0.23], 0.1, 0.18), ...fourFeet(0.065, 0.1, 0.1, 0.035), tube("甲尾", "#9c9b81", [[0, 0.14, -0.16], [0, 0.06, -0.35], [0, 0.04, -0.48]], 0.023));
    for (let i = 0; i < 7; i++) parts.push(lobe("活动甲带", "#aaad93", [0, 0.16, -0.13 + i * 0.045], [0.23, 0.19, 0.05]));
  } else if (kind === 11) {
    parts.push(lobe("穿山甲躯干", "#a69c80", [0, 0.16, 0], [0.23, 0.24, 0.46]), ...face([0, 0.15, 0.28], 0.1, 0.25), ...fourFeet(0.07, 0.13, 0.14, 0.04), tube("粗鳞长尾", "#a69c80", [[0, 0.18, -0.18], [0, 0.08, -0.55], [0, 0.035, -0.8]], 0.045));
    parts.push(combineMeshes("覆瓦状鳞甲", "#b3ab8d", Array.from({ length: 27 }, (_, i) => leaf("角质鳞", "#b3ab8d", [((i % 3) - 1) * 0.065, 0.22 - Math.abs(i % 3 - 1) * 0.025, -0.25 + Math.floor(i / 3) * 0.058], 0.095, 0.105, [105, 0, 0]))));
  } else if (kind === 12) {
    parts.push(lobe("鸭嘴兽扁躯", "#9b937b", [0, 0.11, 0], [0.22, 0.18, 0.44]), lobe("扁鸭喙", "#aab09a", [0, 0.115, 0.32], [0.16, 0.05, 0.21]), lobe("宽尾", "#8e8c75", [0, 0.08, -0.34], [0.19, 0.055, 0.35]), ...eyes([0, 0.17, 0.18], 0.07, 0.015));
    for (const side of [-1, 1]) for (const z of [-0.12, 0.12]) parts.push(leaf("蹼足", "#9e9a80", [side * 0.09, 0.045, z], 0.1, 0.13, [90, side * 85, 0]));
  } else if (kind === 13) {
    parts.push(lobe("食蚁兽前高后低躯体", "#a8a18a", [0, 0.55, 0], [0.42, 0.55, 0.95], [-12, 0, 0]), tube("细长无齿吻", "#b2ac96", [[0, 0.76, 0.36], [0, 0.62, 0.77], [0, 0.48, 1.05]], 0.065), lobe("扫帚状大尾", "#91917b", [0, 0.4, -0.85], [0.4, 0.52, 0.95], [-20, 0, 0]), ...fourFeet(0.15, 0.5, 0.3, 0.09), ...eyes([0, 0.77, 0.41], 0.08, 0.025));
  } else if (kind === 14) {
    parts.push(lobe("猪圆腹", "#c5b5a7", [0, 0.42, 0], [0.52, 0.55, 0.9]), ...face([0, 0.45, 0.48], 0.35, 0.38, "#c5b5a7"), part("圆盘鼻端", "cylinder", "#ac998e", [0, 0.43, 0.68], [0.22, 0.035, 0.16], [90, 0, 0]), ...fourFeet(0.17, 0.34, 0.28, 0.1, "#c5b5a7"), ...ears([0, 0.58, 0.41], 0.14, 0.16, 0.2, "#c5b5a7"), tube("卷曲猪尾", "#ac998e", [[0, 0.53, -0.4], [0.06, 0.58, -0.5], [0.08, 0.52, -0.53], [0.02, 0.5, -0.51]], 0.018));
  } else if (kind === 15) {
    parts.push(lobe("牛宽胸腹", "#b8b49d", [0, 1.05, 0], [0.9, 1, 1.9]), ...face([0, 1.18, 1], 0.48, 0.7, "#b8b49d"), lobe("宽牛鼻", "#999a86", [0, 1.03, 1.29], [0.4, 0.25, 0.2]), ...fourFeet(0.3, 0.92, 0.62, 0.16), ...hoofs(0.3, 0.62, 0.18), ...ears([0, 1.39, 0.98], 0.22, 0.25, 0.2), lobe("乳房", "#c6b7a5", [0, 0.66, -0.4], [0.3, 0.2, 0.28]));
    for (const side of [-1, 1]) parts.push(needle("外弯牛角", "#c7c1a2", [side * 0.19, 1.38, 0.9], [side * 0.4, 1.64, 0.85], 0.09));
  } else if (kind === 16) {
    parts.push(lobe("猫长躯", "#b9b7a0", [0, 0.24, 0], [0.17, 0.23, 0.44]), ...face([0, 0.34, 0.25], 0.17, 0.14, "#b9b7a0"), ...ears([0, 0.4, 0.22], 0.065, 0.075, 0.13), ...fourFeet(0.058, 0.22, 0.14, 0.035), tube("竖起弯尾", "#b9b7a0", [[0, 0.3, -0.2], [0, 0.55, -0.35], [0.05, 0.68, -0.32]], 0.025));
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) parts.push(beam("触须", "#d0ccba", [side * 0.03, 0.31, 0.32], [side * 0.17, 0.3 + i * 0.012, 0.34], 0.001));
  } else if (kind === 17) {
    parts.push(lobe("犬胸腹", "#b1a58c", [0, 0.43, 0], [0.3, 0.39, 0.68]), ...face([0, 0.64, 0.37], 0.25, 0.26), lobe("犬长吻", "#b1a58c", [0, 0.57, 0.55], [0.15, 0.14, 0.25]), ...fourFeet(0.1, 0.4, 0.22, 0.065), tube("摇尾", hide, [[0, 0.49, -0.3], [0, 0.65, -0.55], [0.05, 0.72, -0.6]], 0.035));
    for (const side of [-1, 1]) parts.push(lobe("下垂耳", "#948870", [side * 0.13, 0.6, 0.34], [0.12, 0.28, 0.1]));
  } else if (kind === 18) {
    parts.push(lobe("树懒躯干", "#aba58d", [0, 0.32, 0], [0.3, 0.42, 0.35]), ...face([0, 0.55, 0.1], 0.24, 0.2, "#bdb7a0"));
    for (const side of [-1, 1]) { parts.push(tube("长前臂", hide, [[side * 0.11, 0.45, 0], [side * 0.3, 0.3, 0.1], [side * 0.22, 0.06, 0.3]], 0.045), tube("屈曲后肢", hide, [[side * 0.1, 0.22, -0.07], [side * 0.22, 0.1, -0.12], [side * 0.17, 0.04, 0]], 0.045)); for (let claw = 0; claw < 3; claw++) parts.push(tube("钩状三趾爪", "#d0c9b0", [[side * 0.22 + claw * 0.018, 0.07, 0.3], [side * 0.22 + claw * 0.018, 0.035, 0.36], [side * 0.22 + claw * 0.018, 0.02, 0.33]], 0.006)); }
  } else {
    parts.push(lobe("猩猩躯干", "#a39478", [0, 0.65, 0], [0.62, 0.9, 0.45]), lobe("猩猩头", "#a39478", [0, 1.13, 0.08], [0.4, 0.42, 0.35]), lobe("面盘", "#8c8e79", [0, 1.1, 0.23], [0.35, 0.34, 0.07]), ...eyes([0, 1.17, 0.27], 0.075, 0.03));
    for (const side of [-1, 1]) parts.push(tube("极长前臂", "#a39478", [[side * 0.25, 0.93, 0], [side * 0.58, 0.54, 0.05], [side * 0.68, 0.07, 0.2]], 0.11), lobe("大手", "#8c8e79", [side * 0.68, 0.06, 0.22], [0.18, 0.09, 0.22]), tube("短弯后肢", "#a39478", [[side * 0.17, 0.4, 0], [side * 0.25, 0.22, 0.15], [side * 0.2, 0.04, 0.2]], 0.1));
  }
  return parts;
}

function birdFeet(parts: ModelPart[], hips: Triple[], soles: Triple[], thickness: number, color = "#a8a17d") {
  hips.forEach((hip, index) => {
    const foot = soles[index]!;
    const knee: Triple = [foot[0], (hip[1] + foot[1]) / 2, foot[2] - thickness * 2];
    parts.push(beam("跗蹠", color, hip, knee, thickness), beam("小腿", color, knee, foot, thickness * 0.7));
    for (const side of [-1, 0, 1]) parts.push(needle("前趾", color, foot, [foot[0] + side * thickness * 2, foot[1], foot[2] + thickness * 4], thickness * 0.7));
  });
}

function bird(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("鸵鸟大躯", "#979c88", [0, 1.3, 0], [0.9, 0.95, 1.2]), tube("裸露长颈", "#b9b3a1", [[0, 1.5, 0.4], [0, 2.1, 0.45], [0, 2.3, 0.65]], 0.09), ...face([0, 2.35, 0.68], 0.2, 0.23, "#b9b3a1"), needle("短扁喙", "#b9b091", [0, 2.3, 0.75], [0, 2.28, 0.95], 0.12));
    birdFeet(parts, [[-0.22, 1.2, 0], [0.22, 1.2, 0]], [[-0.22, 0.05, 0.1], [0.22, 0.05, 0.1]], 0.08);
    for (const side of [-1, 1]) parts.push(lobe("退化羽翼", feather, [side * 0.35, 1.28, 0], [0.35, 0.35, 0.8]));
  } else if (kind === 1) {
    parts.push(lobe("企鹅直立躯", "#6f7e76", [0, 0.4, 0], [0.36, 0.64, 0.3]), lobe("企鹅白腹", "#d2d3bd", [0, 0.4, 0.12], [0.26, 0.48, 0.08]), ...face([0, 0.74, 0.02], 0.2, 0.2, "#6f7e76"), needle("企鹅尖喙", "#a6a181", [0, 0.7, 0.09], [0, 0.7, 0.26], 0.065));
    for (const side of [-1, 1]) parts.push(leaf("短鳍状翼", "#7c8b80", [side * 0.15, 0.65, 0], 0.12, 0.4, [10, 0, side * 150]), leaf("企鹅蹼足", "#b9ae88", [side * 0.1, 0.055, 0], 0.14, 0.19, [90, side * 10, 0]));
  } else if (kind === 2 || kind === 3) {
    parts.push(lobe(kind === 2 ? "鸭舟形体" : "天鹅长躯", "#c9cbb1", [0, 0.19, 0], kind === 2 ? [0.3, 0.27, 0.55] : [0.48, 0.38, 0.9]));
    if (kind === 2) parts.push(...face([0, 0.4, 0.22], 0.19, 0.18, "#8d9d7e"), lobe("鸭扁喙", "#bfb382", [0, 0.35, 0.38], [0.14, 0.05, 0.22]));
    else parts.push(tube("S形天鹅颈", "#d2d3bd", [[0, 0.25, 0.3], [0, 0.65, 0.2], [0, 0.85, 0.4], [0, 0.7, 0.6]], 0.065), ...face([0, 0.72, 0.64], 0.14, 0.18, "#d2d3bd"), needle("天鹅喙", "#bdad85", [0, 0.68, 0.7], [0, 0.66, 0.88], 0.065));
    for (const side of [-1, 1]) parts.push(lobe("收拢飞羽", "#b7c0a5", [side * (kind === 2 ? 0.12 : 0.2), 0.25, -0.07], kind === 2 ? [0.12, 0.15, 0.4] : [0.23, 0.22, 0.7]), leaf("蹼足", "#afa681", [side * 0.09, 0.04, 0.04], 0.11, 0.14, [90, side * 15, 0]));
  } else if (kind === 4) {
    parts.push(lobe("孔雀躯干", "#779790", [0, 0.42, 0], [0.24, 0.36, 0.48]), beam("孔雀颈", "#779790", [0, 0.45, 0.15], [0, 0.78, 0.26], 0.09), ...face([0, 0.82, 0.28], 0.12, 0.16, "#779790"), needle("短喙", "#b7b698", [0, 0.8, 0.33], [0, 0.8, 0.44], 0.04));
    birdFeet(parts, [[-0.07, 0.36, 0], [0.07, 0.36, 0]], [[-0.07, 0.03, 0.06], [0.07, 0.03, 0.06]], 0.025);
    for (let i = 0; i < 15; i++) { const a = -Math.PI * 0.45 + i * Math.PI * 0.9 / 14; const end: Triple = [Math.sin(a) * 0.85, 0.7 + Math.cos(a) * 0.75, -0.22]; parts.push(beam("开屏尾羽轴", "#819f79", [0, 0.36, -0.16], end, 0.018), lobe("羽眼外斑", "#acb284", end, [0.13, 0.18, 0.024]), lobe("羽眼深心", "#657f7b", [end[0], end[1], end[2] + 0.014], [0.065, 0.09, 0.008])); }
  } else if (kind === 5 || kind === 13 || kind === 19) {
    const flamingo = kind === 5;
    parts.push(lobe(flamingo ? "火烈鸟体" : kind === 13 ? "鹤体" : "鹮体", flamingo ? "#c4b0a3" : feather, [0, 0.85, 0], [0.28, 0.34, 0.55]), tube("弯长颈", feather, [[0, 0.92, 0.19], [0, 1.25, 0.1], [0, 1.45, 0.3], [0, 1.35, 0.43]], 0.04), ...face([0, 1.37, 0.47], 0.11, 0.14, feather));
    if (flamingo) parts.push(tube("折向下的滤食喙", "#a29e83", [[0, 1.35, 0.52], [0, 1.34, 0.66], [0, 1.24, 0.7]], 0.035));
    else if (kind === 19) parts.push(tube("镰形长喙", "#939b80", [[0, 1.35, 0.5], [0, 1.28, 0.69], [0, 1.15, 0.76]], 0.018));
    else parts.push(needle("鹤直长喙", "#a9ad8f", [0, 1.35, 0.51], [0, 1.34, 0.8], 0.045), lobe("鹤顶裸斑", "#aa9181", [0, 1.43, 0.46], [0.09, 0.035, 0.1]));
    birdFeet(parts, [[-0.07, 0.82, 0], [0.07, 0.82, 0]], [[-0.07, 0.03, 0.06], [0.07, 0.03, 0.06]], 0.023);
    for (const side of [-1, 1]) parts.push(lobe("长收翼", "#a8b59e", [side * 0.12, 0.9, -0.06], [0.12, 0.22, 0.46]));
  } else if (kind === 6) {
    parts.push(lobe("鹦鹉直立躯", "#9aaf82", [0, 0.22, 0], [0.16, 0.25, 0.17]), ...face([0, 0.38, 0.03], 0.14, 0.14, "#a8b58c"), needle("上钩喙", "#b2ab87", [0, 0.39, 0.1], [0, 0.31, 0.19], 0.085));
    for (const side of [-1, 1]) parts.push(leaf("折叠羽翼", "#849b79", [side * 0.065, 0.33, 0], 0.13, 0.22, [0, 0, side * 165]), leaf("长锥尾羽", "#8fa385", [side * 0.025, 0.16, -0.07], 0.05, 0.3, [-140, 0, 0]));
    birdFeet(parts, [[-0.045, 0.13, 0], [0.045, 0.13, 0]], [[-0.045, 0.02, 0.02], [0.045, 0.02, 0.02]], 0.012);
  } else if (kind === 7 || kind === 9) {
    parts.push(lobe("树栖鸟体", feather, [0, 0.26, 0], [0.18, 0.3, 0.27]), ...face([0, 0.47, 0.08], 0.17, 0.19, feather), lobe(kind === 7 ? "犀鸟巨大喙" : "巨嘴鸟大喙", "#c0ba93", [0, 0.45, 0.3], kind === 7 ? [0.15, 0.17, 0.42] : [0.18, 0.22, 0.44]));
    if (kind === 7) parts.push(lobe("中空角盔", "#afa985", [0, 0.58, 0.26], [0.14, 0.16, 0.29]));
    else parts.push(part("喙端切面", "box", dark, [0, 0.43, 0.49], [0.11, 0.1, 0.04], [15, 0, 0]), lobe("裸露眼圈", "#c7c7aa", [0.069, 0.49, 0.11], [0.018, 0.08, 0.07]));
    for (const side of [-1, 1]) parts.push(leaf("宽尾羽", "#929e87", [side * 0.045, 0.2, -0.1], 0.09, 0.32, [-145, 0, 0]));
    birdFeet(parts, [[-0.05, 0.15, 0], [0.05, 0.15, 0]], [[-0.05, 0.02, 0.03], [0.05, 0.02, 0.03]], 0.015);
  } else if (kind === 8) {
    parts.push(lobe("啄木鸟直躯", "#9ea991", [0, 0.23, 0], [0.12, 0.25, 0.17]), ...face([0, 0.4, 0.04], 0.12, 0.13, feather), needle("凿形直喙", dark, [0, 0.39, 0.09], [0, 0.39, 0.27], 0.04), leaf("后枕羽冠", "#b19988", [0, 0.45, -0.02], 0.07, 0.11, [-55, 0, 0]), needle("支撑硬尾", dark, [0, 0.17, -0.07], [0, 0.015, -0.22], 0.07));
    birdFeet(parts, [[-0.04, 0.14, 0], [0.04, 0.14, 0]], [[-0.04, 0.02, 0.04], [0.04, 0.02, 0.04]], 0.009);
  } else if (kind === 10) {
    parts.push(lobe("猫头鹰紧凑体", "#a3a68c", [0, 0.25, 0], [0.24, 0.35, 0.22]), lobe("圆头", "#b2b49b", [0, 0.48, 0], [0.28, 0.25, 0.23]), needle("短钩喙", "#92977c", [0, 0.44, 0.1], [0, 0.4, 0.16], 0.045));
    for (const side of [-1, 1]) parts.push(lobe("面盘", "#c8c7ac", [side * 0.065, 0.49, 0.1], [0.13, 0.15, 0.035]), lobe("正面大眼", dark, [side * 0.065, 0.5, 0.122], [0.052, 0.058, 0.015]), leaf("耳羽簇", "#9b9f85", [side * 0.09, 0.56, 0], 0.06, 0.12, [0, 0, -side * 25]));
    birdFeet(parts, [[-0.07, 0.12, 0], [0.07, 0.12, 0]], [[-0.07, 0.02, 0.02], [0.07, 0.02, 0.02]], 0.017);
  } else if (kind === 11) {
    parts.push(lobe("蜂鸟小体", "#8fa98c", [0, 0.06, 0], [0.035, 0.065, 0.04]), ...face([0, 0.1, 0.02], 0.03, 0.03, "#8fa98c"), needle("细长吸蜜喙", dark, [0, 0.1, 0.03], [0, 0.1, 0.09], 0.004));
    for (const side of [-1, 1]) parts.push(leaf("狭长高速翼", "#a9b8a0", [side * 0.01, 0.075, 0], 0.025, 0.1, [0, -side * 20, -side * 75]), leaf("小尾羽", feather, [side * 0.008, 0.04, -0.015], 0.013, 0.045, [-145, 0, 0]));
  } else if (kind === 12) {
    parts.push(lobe("鹈鹕大胸体", "#c4c7ae", [0, 0.38, 0], [0.5, 0.5, 0.75]), tube("短曲颈", feather, [[0, 0.5, 0.25], [0, 0.75, 0.2], [0, 0.9, 0.35]], 0.085), ...face([0, 0.9, 0.4], 0.18, 0.24, feather), beam("长平上喙", "#bcb58f", [0, 0.87, 0.46], [0, 0.87, 1.05], 0.06, 0.09), lobe("松弛喉囊", "#c4bb97", [0, 0.77, 0.72], [0.17, 0.2, 0.55]));
    for (const side of [-1, 1]) parts.push(leaf("大蹼足", "#a4a58a", [side * 0.14, 0.045, 0], 0.19, 0.24, [90, side * 10, 0]));
  } else if (kind === 14) {
    parts.push(lobe("秃鹫宽体", "#939b84", [0, 0.46, 0], [0.45, 0.56, 0.42]), tube("裸长颈", "#b4b39c", [[0, 0.6, 0.1], [0, 0.83, 0.08], [0, 0.91, 0.24]], 0.055), ...face([0, 0.92, 0.28], 0.16, 0.2, "#b4b39c"), needle("弯钩喙", dark, [0, 0.91, 0.35], [0, 0.81, 0.43], 0.075));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(leaf("颈根羽领", "#c1c3aa", [Math.cos(a) * 0.08, 0.73, 0.1 + Math.sin(a) * 0.08], 0.11, 0.16, [60, -i * 45, 0])); }
    birdFeet(parts, [[-0.12, 0.3, 0], [0.12, 0.3, 0]], [[-0.12, 0.03, 0.08], [0.12, 0.03, 0.08]], 0.035);
  } else if (kind === 15) {
    parts.push(lobe("鹰胸", "#9b9e85", [0, 0.4, 0], [0.24, 0.4, 0.3]), ...face([0, 0.65, 0.08], 0.17, 0.2, "#c5c7ae"), needle("鹰钩喙", "#b7b08d", [0, 0.62, 0.15], [0, 0.54, 0.27], 0.075));
    for (const side of [-1, 1]) { parts.push(membrane("展开鹰翼", "#a3aa90", [[side * 0.08, 0.5, 0], [side * 0.4, 0.65, 0.03], [side * 0.87, 0.55, -0.03], [side * 0.6, 0.4, -0.18], [side * 0.13, 0.34, -0.15]])); for (let i = 0; i < 6; i++) parts.push(leaf("指状初级飞羽", "#8a947e", [side * (0.58 + i * 0.045), 0.49, -0.12], 0.065, 0.25, [-115, 0, -side * (45 + i * 5)])); }
    birdFeet(parts, [[-0.07, 0.22, 0], [0.07, 0.22, 0]], [[-0.07, 0.02, 0.06], [0.07, 0.02, 0.06]], 0.025);
  } else if (kind === 16 || kind === 17) {
    const size = kind === 16 ? 0.16 : 0.75;
    parts.push(lobe("空中流线体", "#80978c", [0, size * 0.45, 0], [size * 0.3, size * 0.35, size]), ...face([0, size * 0.55, size * 0.45], size * 0.22, size * 0.25, "#80978c"), needle("尖喙", dark, [0, size * 0.52, size * 0.53], [0, size * 0.5, size * 0.8], size * 0.07));
    for (const side of [-1, 1]) parts.push(membrane("镰形长翼", "#94a395", [[side * size * 0.1, size * 0.5, size * 0.2], [side * size * 0.7, size * 0.65, size * 0.08], [side * size * 1.5, size * 0.55, -size * 0.55], [side * size * 0.65, size * 0.4, -size * 0.17]]), leaf("深叉尾", "#728d83", [0, size * 0.4, -size * 0.3], size * 0.16, size * 0.65, [-125, side * 35, 0]));
    if (kind === 17) parts.push(lobe("军舰鸟膨大喉囊", "#b89988", [0, size * 0.4, size * 0.4], [size * 0.34, size * 0.3, size * 0.35]));
  } else {
    parts.push(lobe("䴙䴘低舟体", "#a9b4a0", [0, 0.13, 0], [0.18, 0.2, 0.4]), tube("䴙䴘细颈", feather, [[0, 0.18, 0.12], [0, 0.34, 0.15], [0, 0.4, 0.2]], 0.035), ...face([0, 0.41, 0.23], 0.1, 0.12, feather), needle("矛状细喙", "#b4ac8c", [0, 0.4, 0.27], [0, 0.39, 0.44], 0.03));
    for (const side of [-1, 1]) { parts.push(leaf("双侧耳羽冠", "#8c927d", [side * 0.035, 0.45, 0.19], 0.065, 0.12, [-40, 0, -side * 35])); for (let toe = 0; toe < 3; toe++) parts.push(lobe("瓣蹼趾", "#a7a98c", [side * 0.075 + toe * 0.012, 0.025, -0.05], [0.025, 0.012, 0.09])); }
  }
  return parts;
}

function reptile(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  const green = "#94a182";
  if (kind === 0) {
    parts.push(lobe("鳄鱼长躯", green, [0, 0.25, 0], [0.6, 0.4, 1.7]), lobe("鳄鱼扁长吻", "#a5ad8d", [0, 0.24, 1], [0.43, 0.18, 0.95]), tube("鳄尾", green, [[0, 0.27, -0.65], [0.1, 0.18, -1.35], [0.25, 0.05, -2]], 0.17), ...eyes([0, 0.36, 0.65], 0.17, 0.045), ...legs([[-0.22, 0.2, -0.4], [0.22, 0.2, -0.4], [-0.22, 0.2, 0.4], [0.22, 0.2, 0.4]], [[-0.5, 0.04, -0.6], [0.5, 0.04, -0.6], [-0.5, 0.04, 0.55], [0.5, 0.04, 0.55]], 0.09, green, true));
    for (let i = 0; i < 12; i++) parts.push(needle("背部骨板嵴", "#879579", [0, 0.39, -0.7 + i * 0.12], [0, 0.48, -0.73 + i * 0.12], 0.11));
  } else if (kind === 1 || kind === 2) {
    parts.push(lobe(kind === 1 ? "陆龟高拱甲壳" : "海龟扁圆背甲", "#9fa58a", [0, 0.16, 0], kind === 1 ? [0.4, 0.33, 0.48] : [0.6, 0.24, 0.75]), lobe("腹甲", "#bdbea1", [0, 0.07, 0], kind === 1 ? [0.35, 0.07, 0.42] : [0.52, 0.08, 0.66]), ...face([0, 0.12, kind === 1 ? 0.28 : 0.44], 0.1, 0.15, green));
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(kind === 1 ? lobe("粗短龟足", green, [side * 0.17, 0.06, end * 0.17], [0.1, 0.12, 0.14]) : leaf("长鳍状肢", green, [side * 0.23, 0.1, end * 0.22], 0.16, end > 0 ? 0.47 : 0.3, [75, -side * 80 + end * 30, 0]));
    for (let i = 0; i < 5; i++) parts.push(lobe("椎盾", "#b2b79b", [0, kind === 1 ? 0.3 : 0.27, -0.16 + i * 0.08], [0.11, 0.035, 0.1]));
  } else if (kind === 3) {
    parts.push(tube("盘绕蛇体", green, [[-0.3, 0.04, -0.15], [0.2, 0.04, -0.2], [0.28, 0.05, 0.1], [-0.13, 0.08, 0.22], [-0.12, 0.35, 0.2], [0, 0.6, 0.2]], 0.036), lobe("展开颈罩", "#a5b08b", [0, 0.47, 0.2], [0.21, 0.27, 0.045]), ...face([0, 0.63, 0.23], 0.075, 0.11, green));
  } else if (kind === 4) {
    parts.push(lobe("变色龙侧扁体", "#99ad83", [0, 0.15, 0], [0.09, 0.23, 0.3]), lobe("高盔头", "#a7b48e", [0, 0.25, 0.16], [0.13, 0.22, 0.15]), ...eyes([0, 0.26, 0.19], 0.064, 0.035), tube("卷握尾", green, [[0, 0.16, -0.14], [0, 0.08, -0.32], [0, 0.2, -0.39], [0, 0.25, -0.29], [0, 0.19, -0.26]], 0.018), ...legs([[-0.035, 0.13, -0.07], [0.035, 0.13, -0.07], [-0.035, 0.13, 0.08], [0.035, 0.13, 0.08]], [[-0.1, 0.025, -0.1], [0.1, 0.025, -0.1], [-0.1, 0.025, 0.12], [0.1, 0.025, 0.12]], 0.022, green, true));
  } else if (kind === 5) {
    parts.push(lobe("鬣蜥躯干", green, [0, 0.16, 0], [0.22, 0.23, 0.55]), ...face([0, 0.2, 0.33], 0.18, 0.26, green), leaf("喉部皮褶", "#acb38e", [0, 0.2, 0.28], 0.2, 0.23, [170, 90, 0]), tube("鬣蜥鞭尾", green, [[0, 0.18, -0.24], [0.12, 0.09, -0.65], [0.2, 0.025, -1]], 0.045), ...legs([[-0.07, 0.13, -0.12], [0.07, 0.13, -0.12], [-0.07, 0.13, 0.15], [0.07, 0.13, 0.15]], [[-0.22, 0.03, -0.18], [0.22, 0.03, -0.18], [-0.22, 0.03, 0.21], [0.22, 0.03, 0.21]], 0.04, green, true));
    for (let i = 0; i < 10; i++) parts.push(needle("颈背鬣刺", "#b5b88f", [0, 0.25, -0.2 + i * 0.055], [0, 0.37 - Math.abs(i - 6) * 0.008, -0.2 + i * 0.055], 0.035));
  } else if (kind === 6) {
    parts.push(lobe("壁虎扁躯", "#b3b69a", [0, 0.025, 0], [0.04, 0.035, 0.11]), ...face([0, 0.028, 0.065], 0.045, 0.05, "#b3b69a"), tube("壁虎细尾", green, [[0, 0.025, -0.05], [0.02, 0.02, -0.11], [0.025, 0.01, -0.18]], 0.009));
    for (const side of [-1, 1]) for (const end of [-1, 1]) { const root: Triple = [side * 0.05, 0.015, end * 0.045]; parts.push(beam("外展肢", "#b3b69a", [side * 0.015, 0.025, end * 0.03], root, 0.008)); for (let toe = 0; toe < 4; toe++) parts.push(beam("吸盘趾", "#c3c4a6", root, [root[0] + side * 0.02, 0.009, root[2] + (toe - 1.5) * 0.009], 0.003), lobe("趾端吸盘", "#c3c4a6", [root[0] + side * 0.02, 0.009, root[2] + (toe - 1.5) * 0.009], [0.007, 0.004, 0.007])); }
  } else if (kind === 7) {
    parts.push(lobe("美西螈长体", "#bfbdab", [0, 0.055, 0], [0.075, 0.075, 0.23]), ...face([0, 0.06, 0.13], 0.1, 0.09, "#bfbdab"), leaf("尾鳍", "#b7c0ab", [0, 0.05, -0.09], 0.065, 0.2, [-120, 0, 0]));
    for (const side of [-1, 1]) { for (let i = 0; i < 3; i++) parts.push(leaf("外鳃羽状支", "#b8a59a", [side * 0.04, 0.06, 0.09], 0.018, 0.075, [20 + i * 35, side * 70, -side * 70])); for (const z of [-0.07, 0.07]) parts.push(beam("短足", "#bfbdab", [side * 0.02, 0.05, z], [side * 0.075, 0.015, z + 0.01], 0.012)); }
  } else if (kind === 8) {
    parts.push(lobe("蛙宽躯", "#9ead89", [0, 0.075, 0], [0.15, 0.12, 0.19]), lobe("蛙宽头", "#acb592", [0, 0.1, 0.08], [0.18, 0.1, 0.12]), ...eyes([0, 0.15, 0.09], 0.06, 0.035));
    for (const side of [-1, 1]) parts.push(lobe("粗后胯", green, [side * 0.08, 0.065, -0.07], [0.1, 0.1, 0.13]), beam("折返后胫", green, [side * 0.11, 0.05, -0.1], [side * 0.15, 0.025, 0.01], 0.025), leaf("蛙后蹼", green, [side * 0.15, 0.02, 0.01], 0.06, 0.1, [90, side * 10, 0]), beam("细前腿", green, [side * 0.055, 0.07, 0.04], [side * 0.11, 0.02, 0.13], 0.02));
  } else if (kind === 9) {
    parts.push(tube("蚓螈无足长体", "#989b85", [[-0.19, 0.015, 0], [-0.06, 0.015, -0.04], [0.08, 0.015, 0.025], [0.2, 0.015, 0]], 0.016), ...face([0.21, 0.018, 0], 0.032, 0.032, "#989b85"));
    for (let i = 0; i < 15; i++) parts.push(part("环褶", "torus", "#afb096", [-0.16 + i * 0.022, 0.015, Math.sin(i / 14 * Math.PI * 2) * -0.025], [0.036, 0.036, 0.003], [0, 90, 0]));
  } else if (kind === 10) {
    parts.push(lobe("大鲵长扁体", "#969b85", [0, 0.07, 0], [0.25, 0.11, 0.65]), lobe("大鲵扁宽头", "#9ea18b", [0, 0.075, 0.38], [0.3, 0.1, 0.28]), tube("大鲵扁尾", "#969b85", [[0, 0.07, -0.27], [0.05, 0.055, -0.55], [0.11, 0.03, -0.8]], 0.05), ...eyes([0, 0.105, 0.42], 0.11, 0.018));
    for (const side of [-1, 1]) { parts.push(leaf("体侧皮肤褶", "#a9ac92", [side * 0.085, 0.06, -0.22], 0.11, 0.52, [90, 0, 0])); for (const z of [-0.18, 0.2]) parts.push(beam("大鲵短足", "#969b85", [side * 0.07, 0.06, z], [side * 0.22, 0.025, z + 0.035], 0.035)); }
  } else {
    parts.push(lobe("伞蜥体", green, [0, 0.15, 0], [0.1, 0.2, 0.25]), ...face([0, 0.27, 0.13], 0.09, 0.14, green), tube("长细尾", green, [[0, 0.15, -0.1], [0.04, 0.065, -0.3], [0.07, 0.025, -0.53]], 0.018));
    const ring: Triple[] = Array.from({ length: 16 }, (_, i) => [Math.cos(i * Math.PI / 8) * 0.18, 0.25 + Math.sin(i * Math.PI / 8) * 0.18, 0.1]); parts.push(membrane("展开颈褶", "#b7ad8d", ring));
    for (const side of [-1, 1]) parts.push(beam("后肢", green, [side * 0.03, 0.11, -0.06], [side * 0.1, 0.02, 0.03], 0.025), beam("前肢", green, [side * 0.03, 0.2, 0.08], [side * 0.12, 0.04, 0.15], 0.018));
  }
  return parts;
}

function insectLegs(parts: ModelPart[], count: number, length: number, height: number, color: string) {
  for (const side of [-1, 1]) for (let i = 0; i < count; i++) { const z = (i - (count - 1) / 2) * length * 0.4; const joint: Triple = [side * length * 0.55, height * 1.2, z]; parts.push(beam("节肢上段", color, [side * length * 0.12, height, z], joint, Math.max(0.001, length * 0.035)), beam("节肢末段", color, joint, [side * length, 0.003, z + (i - 1) * length * 0.25], Math.max(0.001, length * 0.025))); }
}

function insect(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("蚁头", "#998f76", [0, 0.01, 0.022], [0.012, 0.012, 0.014]), lobe("蚁胸", "#998f76", [0, 0.01, 0.005], [0.009, 0.012, 0.016]), lobe("柄节腰", "#998f76", [0, 0.01, -0.01], [0.004, 0.006, 0.009]), lobe("膨大蚁腹", "#8f866e", [0, 0.01, -0.026], [0.017, 0.015, 0.025]));
    insectLegs(parts, 3, 0.023, 0.01, "#998f76");
    for (const side of [-1, 1]) parts.push(tube("肘状触角", "#998f76", [[side * 0.003, 0.012, 0.027], [side * 0.013, 0.018, 0.035], [side * 0.007, 0.022, 0.043]], 0.001));
  } else if (kind === 1) {
    parts.push(lobe("蜂胸", "#aaa581", [0, 0.015, 0.006], [0.014, 0.016, 0.02]), lobe("蜂腹", "#c0b589", [0, 0.015, -0.014], [0.017, 0.016, 0.026]), lobe("蜂头", "#8b9278", [0, 0.016, 0.021], [0.013, 0.014, 0.013]));
    insectLegs(parts, 3, 0.019, 0.014, "#969479");
    for (const side of [-1, 1]) for (const z of [-0.003, 0.005]) parts.push(leaf("透明膜翅", "#d1d6c3", [side * 0.004, 0.024, z], 0.015, 0.034, [55, -side * 75, 0]));
    for (const z of [-0.02, -0.011]) parts.push(part("腹节色带", "torus", "#939176", [0, 0.015, z], [0.018, 0.018, 0.002], [0, 0, 0]));
  } else if (kind === 2) {
    parts.push(lobe("蝶身", "#8d967d", [0, 0.014, 0], [0.008, 0.012, 0.04]));
    for (const side of [-1, 1]) { parts.push(membrane("阔三角前翅", "#c3b69c", [[side * 0.003, 0.018, 0.013], [side * 0.052, 0.032, 0.045], [side * 0.06, 0.028, 0.01], [side * 0.012, 0.018, -0.003]]), lobe("圆扇后翅", "#b5b29a", [side * 0.024, 0.02, -0.022], [0.045, 0.004, 0.046]), tube("棒状触角", "#8d967d", [[side * 0.002, 0.017, 0.017], [side * 0.008, 0.03, 0.029], [side * 0.012, 0.034, 0.03]], 0.001)); }
    insectLegs(parts, 3, 0.014, 0.012, "#8d967d");
  } else if (kind === 3) {
    parts.push(lobe("螳螂长腹", "#9eaf86", [0, 0.026, -0.02], [0.014, 0.013, 0.06]), beam("细长前胸", "#9eaf86", [0, 0.025, 0], [0, 0.049, 0.04], 0.006), lobe("三角螳头", "#aebe93", [0, 0.052, 0.044], [0.021, 0.011, 0.012]), ...eyes([0, 0.055, 0.047], 0.009, 0.006));
    insectLegs(parts, 2, 0.042, 0.023, "#9eaf86");
    for (const side of [-1, 1]) parts.push(beam("抬举捕捉臂", "#9eaf86", [side * 0.003, 0.043, 0.028], [side * 0.017, 0.064, 0.048], 0.004), beam("折叠镰臂", "#9eaf86", [side * 0.017, 0.064, 0.048], [side * 0.01, 0.042, 0.064], 0.003));
  } else if (kind === 4) {
    parts.push(lobe("独角仙胸甲", "#858d78", [0, 0.015, 0.012], [0.025, 0.025, 0.025]), lobe("左右鞘翅", "#969c82", [0, 0.014, -0.013], [0.031, 0.025, 0.04]), beam("鞘翅中缝", "#717c67", [0, 0.025, -0.029], [0, 0.025, 0.006], 0.001), tube("分叉头角", "#858d78", [[0, 0.02, 0.022], [0, 0.05, 0.045], [0, 0.058, 0.035]], 0.003), needle("角端侧叉", "#858d78", [0, 0.049, 0.044], [0.009, 0.059, 0.039], 0.004));
    insectLegs(parts, 3, 0.032, 0.013, "#858d78");
  } else if (kind === 5) {
    parts.push(beam("蜻蜓细长腹节", "#a2ad8c", [0, 0.02, -0.055], [0, 0.02, 0.018], 0.005), lobe("膨大蜻胸", "#919e81", [0, 0.021, 0.016], [0.012, 0.016, 0.02]), ...eyes([0, 0.025, 0.03], 0.006, 0.009));
    for (const side of [-1, 1]) for (const z of [0.002, 0.018]) parts.push(leaf("平伸长膜翼", "#c9d3be", [side * 0.003, 0.024, z], 0.016, 0.07, [90, -side * 90, 0]));
    insectLegs(parts, 3, 0.017, 0.017, "#919e81");
  } else if (kind === 6) {
    parts.push(lobe("蚱蜢长体", "#a6b38c", [0, 0.019, 0], [0.015, 0.021, 0.06]), lobe("蚱蜢斜头", "#b4bb96", [0, 0.029, 0.032], [0.018, 0.029, 0.02]));
    insectLegs(parts, 2, 0.023, 0.019, "#a6b38c");
    for (const side of [-1, 1]) parts.push(beam("粗大跳跃股节", "#a6b38c", [side * 0.005, 0.021, -0.01], [side * 0.025, 0.048, -0.026], 0.009), beam("长后胫", "#a6b38c", [side * 0.025, 0.048, -0.026], [side * 0.03, 0.003, -0.057], 0.003), needle("长丝触角", "#969f80", [side * 0.004, 0.04, 0.036], [side * 0.015, 0.065, 0.065], 0.002));
  } else {
    parts.push(lobe("蜘蛛头胸部", "#979d85", [0, 0.023, 0.017], [0.02, 0.025, 0.025]), lobe("蜘蛛球腹", "#aab097", [0, 0.023, -0.013], [0.035, 0.032, 0.043]));
    insectLegs(parts, 4, 0.055, 0.022, "#979d85");
    for (const side of [-1, 1]) parts.push(needle("口前螯肢", dark, [side * 0.004, 0.018, 0.027], [side * 0.008, 0.01, 0.037], 0.004));
  }
  return parts;
}

const mammals = [["horse", "马"], ["elephant", "象"], ["giraffe", "长颈鹿"], ["camel", "双峰骆驼"], ["kangaroo", "袋鼠"], ["rabbit", "兔"], ["squirrel", "松鼠"], ["beaver", "海狸"], ["bat", "蝙蝠"], ["hedgehog", "刺猬"], ["armadillo", "犰狳"], ["pangolin", "穿山甲"], ["platypus", "鸭嘴兽"], ["anteater", "食蚁兽"], ["pig", "猪"], ["cow", "奶牛"], ["cat", "猫"], ["dog", "狗"], ["sloth", "树懒"], ["orangutan", "猩猩"]];
const birds = [["ostrich", "鸵鸟"], ["penguin", "企鹅"], ["duck", "鸭"], ["swan", "天鹅"], ["peacock", "开屏孔雀"], ["flamingo", "火烈鸟"], ["parrot", "鹦鹉"], ["hornbill", "犀鸟"], ["woodpecker", "啄木鸟"], ["toucan", "巨嘴鸟"], ["owl", "猫头鹰"], ["hummingbird", "蜂鸟"], ["pelican", "鹈鹕"], ["crane", "丹顶鹤"], ["vulture", "秃鹫"], ["eagle", "鹰"], ["swallow", "燕子"], ["frigatebird", "军舰鸟"], ["grebe", "䴙䴘"], ["ibis", "鹮"]];
const reptiles = [["crocodile", "鳄鱼"], ["tortoise", "陆龟"], ["seaTurtle", "海龟"], ["cobra", "眼镜蛇"], ["chameleon", "变色龙"], ["iguana", "鬣蜥"], ["gecko", "壁虎"], ["axolotl", "美西螈"], ["frog", "青蛙"], ["caecilian", "蚓螈"], ["giantSalamander", "大鲵"], ["frilledLizard", "伞蜥"]];
const insects = [["ant", "蚂蚁"], ["bee", "蜜蜂"], ["butterfly", "蝴蝶"], ["mantis", "螳螂"], ["rhinocerosBeetle", "独角仙"], ["dragonfly", "蜻蜓"], ["grasshopper", "蚱蜢"], ["spider", "蜘蛛"]];

export const animalDesigns: MasterNatureDesign[] = [
  ...mammals.map(([key, name], index) => design(key!, name!, "动物", () => mammal(index), ["哺乳动物"])),
  ...birds.map(([key, name], index) => design(key!, name!, "动物", () => bird(index), ["鸟类"])),
  ...reptiles.map(([key, name], index) => design(key!, name!, "动物", () => reptile(index), ["爬行与两栖"])),
  ...insects.map(([key, name], index) => design(key!, name!, "动物", () => insect(index), ["陆生节肢动物"])),
];
