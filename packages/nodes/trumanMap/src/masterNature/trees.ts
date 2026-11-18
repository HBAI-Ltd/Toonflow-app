import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, petals, radialLeaves, tapered, tube } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { createLeafOrgan } from "./naturalOrgans";

const bark = "#9b8d70";
const green = "#94aa7c";

function compound(root: Triple, direction: number, palmate = false, length = 0.35): ModelPart {
  const a = direction * Math.PI / 180;
  const stalk = tapered("复叶小叶根部相连的真实叶轴", green, palmate ? [root, [root[0], root[1] + 0.025, root[2]]] : [root, [root[0], root[1] + 0.025, root[2]], [root[0] + Math.cos(a) * length, root[1] + 0.025, root[2] + Math.sin(a) * length]], palmate ? [0.004, 0.003] : [0.004, 0.003, 0.001]);
  return combineMeshes(palmate ? "掌状复叶" : "羽状复叶", green, [stalk, ...Array.from({ length: palmate ? 7 : 9 }, (_, i) => {
    const t = palmate ? 0 : (Math.floor(i / 2) + 1) / 6;
    const heading = palmate ? direction - 90 + i * 30 : direction + (i % 2 ? 70 : -70);
    return leaf("独立小叶", green, [root[0] + Math.cos(a) * t * length, root[1] + 0.025, root[2] + Math.sin(a) * t * length], palmate ? 0.09 : Math.min(0.09, 0.055 * length / 0.35), palmate ? 0.28 - Math.abs(i - 3) * 0.02 : 0.17 * length / 0.35, [65, 90 - heading, 0], "YXZ");
  })]);
}

function foliage(parts: ModelPart[], root: Triple, style: number, radius = 0.7) {
  parts.push(lobe("细叶构成的冠层体积", "#8fa577", root, [radius * 1.8, radius * 0.75, radius * 1.5]));
  if (style === 8 || style === 9) { for (let i = 0; i < 4; i++) parts.push(compound([root[0] + Math.cos(i * Math.PI / 2) * radius * 0.55, root[1], root[2] + Math.sin(i * Math.PI / 2) * radius * 0.55], i * 90, style === 9)); return; }
  const blade = createLeafOrgan(style)[0]!;
  parts.push(combineMeshes("外缘可辨叶形", "#aabb8c", Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3; return { ...blade, position: { x: root[0] + Math.cos(a) * radius * 0.8, y: root[1] + i % 2 * 0.07, z: root[2] + Math.sin(a) * radius * 0.65 }, rotation: { x: 10 + i % 2 * 15, y: i * 60, z: i % 2 * 8 } }; })));
}

function pod(parts: ModelPart[], root: Triple, flat = false) {
  if (flat) parts.push(leaf("长而扁平的荚果", "#b4a482", root, 0.045, 0.4, [165, 15, 0]));
  else parts.push(tube("分节弯垂荚果", "#b5a582", [root, [root[0] + 0.03, root[1] - 0.14, root[2]], [root[0] - 0.02, root[1] - 0.28, root[2]]], 0.025));
}

function ordinaryTree(kind: number): ModelPart[] {
  const plans: Triple[][] = [
    [[-1.35, 2.2, 0.2], [1.4, 2.3, -0.2], [-0.9, 3.1, -0.9], [1, 3.4, 0.8], [0, 3.8, 0]],
    [[-1.1, 2.3, 0], [1.1, 2.3, 0], [0, 3.1, -1], [0, 3.1, 1], [-0.65, 3.8, 0], [0.65, 3.8, 0]],
    [[-1, 2.3, -0.6], [1, 2.5, -0.6], [-0.6, 3.1, 0.9], [0.6, 3.4, 0.8], [0, 4, 0]],
    [[-1.2, 2.5, 0.2], [1.2, 2.5, -0.2], [0, 3.4, 1], [0, 3.4, -1], [0, 4.1, 0]],
    [[-1.4, 3.6, 0], [1.4, 3.6, 0], [0, 3.9, -1.2], [0, 3.9, 1.2], [0, 4.4, 0]],
    [[-1.4, 1.8, 0], [1.3, 2.1, 0.4], [-0.7, 2.7, -1.1], [0.9, 3.1, 0.8], [0, 3.8, 0]],
    [[-0.8, 2.2, 0.3], [0.75, 2.5, -0.3], [-0.6, 3.2, -0.7], [0.65, 3.5, 0.6], [0, 4.1, 0]],
    [[-1.3, 2.4, 0.6], [1.2, 2.7, -0.5], [-0.8, 3.5, -0.8], [0.8, 3.6, 0.8], [0, 4.3, 0]],
    [[-1.4, 1.8, 0], [1.5, 2, 0], [0, 2.7, -1.3], [0, 2.7, 1.4], [-0.7, 3.5, 0.2], [0.75, 3.5, -0.2]],
    [[-0.85, 2.4, 0.2], [0.8, 2.8, -0.2], [0, 3.4, -0.75], [0, 3.5, 0.7], [0, 4, 0]],
  ];
  const parts: ModelPart[] = [tapered("木质主干", bark, [[0, 0, 0], [0.07, 1.1, 0], [0, 2.2, 0], [0.1, 3.1, 0]], [0.24, 0.19, 0.13, 0.05])];
  const style = [0, 2, 14, 9, 13, 13, 3, 3, 8, 8][kind]!;
  plans[kind]!.forEach((p, i) => { parts.push(tapered("主干分出的木质枝", bark, [[0, kind === 4 ? 1.3 : 1.2 + i * 0.15, 0], [p[0] * 0.6, p[1] - 0.35, p[2] * 0.6], p], [0.1, 0.055, 0.02])); foliage(parts, p, style, kind === 9 ? 0.52 : 0.7); });
  for (let i = 0; i < 4; i++) parts.push(tapered("贴地扩张根颈", bark, [[0, 0.4, 0], [Math.cos(i * Math.PI / 2) * 0.6, 0.03, Math.sin(i * Math.PI / 2) * 0.6]], [0.11, 0.015]));
  const fruitRoot = plans[kind]![0]!;
  if (kind === 0) for (const side of [-1, 1]) parts.push(lobe("悬挂橡实坚果", "#b9a17c", [fruitRoot[0] + side * 0.16, fruitRoot[1] - 0.2, fruitRoot[2]], [0.045, 0.065, 0.045]), cap("橡实壳斗", "#9fa277", [fruitRoot[0] + side * 0.16, fruitRoot[1] - 0.18, fruitRoot[2]], 0.027, 0.02, 0));
  else if (kind === 1) for (let i = 0; i < 3; i++) for (const side of [-1, 1]) parts.push(leaf("枫树双翅果", "#c6c397", [fruitRoot[0] + i * 0.12, fruitRoot[1] - 0.12, fruitRoot[2]], 0.035, 0.14, [145, side * 55, 0]));
  else if (kind === 2) for (let i = 0; i < 4; i++) parts.push(leaf("椴树带翅花序苞", "#bdc59a", [fruitRoot[0] + i * 0.11, fruitRoot[1] - 0.08, fruitRoot[2]], 0.045, 0.18, [145, i * 35, 0]), lobe("苞片中部附生坚果", "#b1ae83", [fruitRoot[0] + i * 0.11, fruitRoot[1] - 0.19, fruitRoot[2]], [0.035, 0.035, 0.035]));
  else if (kind === 3) for (const p of plans[kind]!.slice(0, 3)) parts.push(part("七叶树烛台状花序", "cone", "#d5d0b5", [p[0], p[1] + 0.3, p[2]], [0.18, 0.5, 0.18]));
  else if (kind === 4) for (let i = 0; i < 5; i++) parts.push(part("榆树扁圆翅果", "cylinder", "#c8cba5", [fruitRoot[0] + Math.sin(i) * 0.15, fruitRoot[1] - 0.12, fruitRoot[2] + Math.cos(i) * 0.15], [0.06, 0.004, 0.06]));
  else if (kind === 5) for (let i = 0; i < 4; i++) parts.push(petals(4, [fruitRoot[0] + i * 0.12, fruitRoot[1] - 0.15, fruitRoot[2]], 0.025, 0.065, 35, "#b6ab82"));
  else if (kind === 6) { for (let i = 0; i < 4; i++) parts.push(petals(3, [fruitRoot[0], fruitRoot[1] - 0.1 - i * 0.09, fruitRoot[2]], 0.035, 0.1, 150, "#b8c08e")); for (let i = 0; i < 6; i++) parts.push(beam("鹅耳枥树干纵向肌理棱", "#b0b497", [Math.cos(i) * 0.18, 0.06, Math.sin(i) * 0.18], [Math.cos(i) * 0.12, 2, Math.sin(i) * 0.12], 0.055)); }
  else if (kind === 7) for (let i = 0; i < 4; i++) parts.push(lobe("板栗刺苞", "#b3b98a", [fruitRoot[0] + i * 0.15, fruitRoot[1] - 0.2, fruitRoot[2]], [0.11, 0.12, 0.1]), petals(12, [fruitRoot[0] + i * 0.15, fruitRoot[1] - 0.2, fruitRoot[2]], 0.003, 0.09, 75, "#c4c69b"));
  else if (kind === 8) for (let i = 0; i < 5; i++) parts.push(lobe("胡桃圆形核果", "#b8c196", [fruitRoot[0] + Math.sin(i) * 0.2, fruitRoot[1] - 0.2, fruitRoot[2] + Math.cos(i) * 0.1], [0.08, 0.08, 0.08]));
  else for (let cluster = 0; cluster < 3; cluster++) parts.push(combineMeshes("花楸伞房果序", "#bda58c", Array.from({ length: 12 }, (_, i) => lobe("花楸小梨果", "#bda58c", [fruitRoot[0] + cluster * 0.12 + Math.sin(i * 2.4) * 0.07, fruitRoot[1] - 0.16 + i % 2 * 0.025, fruitRoot[2] + Math.cos(i * 2.4) * 0.07], [0.025, 0.025, 0.025]))));
  return parts;
}

function unusualTree(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) { parts.push(tapered("木棉高直主干", bark, [[0, 0, 0], [0, 3, 0], [0, 5.5, 0]], [0.35, 0.23, 0.06])); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; parts.push(leaf("巨大板根", "#a09275", [0, 0, 0], 1.8, 1.4, [0, -i * 72, 0])); const p: Triple = [Math.cos(a) * 1.6, 4 + i % 2 * 0.7, Math.sin(a) * 1.6]; parts.push(tapered("近水平分层木棉枝", bark, [[0, 3.4, 0], [p[0] * 0.7, p[1] - 0.2, p[2] * 0.7], p], [0.1, 0.06, 0.02]), compound(p, i * 72, true), petals(5, [p[0], p[1] + 0.1, p[2]], 0.1, 0.16, 65, "#bf9f8f")); } }
  else if (kind === 1) { parts.push(part("异木棉膨大酒瓶干", "lathe", "#acb092", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.42, y: 0 }, { x: 0.62, y: 1.3 }, { x: 0.3, y: 3 }, { x: 0.17, y: 3.9 }, { x: 0, y: 4 }] })); for (let i = 0; i < 30; i++) { const a = i * 2.4; const y = 0.25 + i % 6 * 0.5; const r = 0.55 - y * 0.07; parts.push(needle("树干圆锥形皮刺", "#bfc09e", [Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a) * (r + 0.13), y + 0.03, Math.sin(a) * (r + 0.13)], 0.09)); } for (let i = 0; i < 4; i++) { const p: Triple = [Math.cos(i * Math.PI / 2) * 1.2, 4.2, Math.sin(i * Math.PI / 2) * 1.2]; parts.push(beam("异木棉上部分枝", bark, [0, 3, 0], p, 0.1)); foliage(parts, p, 9, 0.65); } }
  else if (kind === 2) { parts.push(tapered("伞金合欢斜干", bark, [[0, 0, 0], [0.2, 1.7, 0], [0.3, 2.7, 0]], [0.24, 0.17, 0.1])); for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; const p: Triple = [Math.cos(a) * 1.8, 3.1 + i % 2 * 0.1, Math.sin(a) * 1.5]; parts.push(tapered("横展伞形主枝", bark, [[0.2, 1.9, 0], [p[0] * 0.5, 2.8, p[2] * 0.5], p], [0.1, 0.06, 0.02])); foliage(parts, p, 8, 0.75); parts.push(needle("成对托叶刺", "#c7c8a8", [p[0] * 0.6, 2.85, p[2] * 0.6], [p[0] * 0.6, 3.05, p[2] * 0.6], 0.025)); } }
  else if (kind === 3) { parts.push(part("旅人蕉假茎", "cylinder", "#a7ad88", [0, 1.2, 0], [0.35, 2.4, 0.35])); for (let i = 0; i < 11; i++) { const a = -1.25 + i * 0.25; const p: Triple = [Math.sin(a) * 1.1, 2.4 + Math.cos(a) * 1.4, 0]; parts.push(beam("同一平面扇排长叶柄", "#b7bb93", [0, 2.2, 0], p, 0.055), leaf("旅人蕉巨型长椭叶", green, p, 0.48, 1.6, [0, 0, -a * 180 / Math.PI])); } }
  else if (kind === 4) { parts.push(tapered("智利南洋杉主干", bark, [[0, 0, 0], [0, 5, 0]], [0.22, 0.035])); for (let layer = 0; layer < 4; layer++) for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + layer * 0.45; const r = 1.3 - layer * 0.2; const p: Triple = [Math.cos(a) * r, 1.3 + layer * 0.85, Math.sin(a) * r]; parts.push(tapered("上扬绳状粗枝", "#9ba681", [[0, p[1] - 0.3, 0], [p[0] * 0.7, p[1] - 0.15, p[2] * 0.7], p], [0.09, 0.065, 0.03]), combineMeshes("覆盖枝条的硬三角鳞叶", "#b3bf98", Array.from({ length: 15 }, (_, j) => { const t = (j + 1) / 16; return needle("尖鳞叶", "#b3bf98", [p[0] * t, p[1] - 0.2, p[2] * t], [p[0] * t + Math.sin(j * 2.4) * 0.13, p[1] - 0.04, p[2] * t + Math.cos(j * 2.4) * 0.13], 0.055); }))); } }
  else if (kind === 5) { parts.push(part("落羽杉膨大基干", "lathe", "#a6a287", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.7, y: 0 }, { x: 0.26, y: 0.9 }, { x: 0.18, y: 3.5 }, { x: 0.02, y: 5.5 }, { x: 0, y: 5.6 }] })); for (let i = 0; i < 8; i++) { const a = i * 2.4; const r = 1.2 - i * 0.1; const p: Triple = [Math.cos(a) * r, 1.5 + i * 0.45, Math.sin(a) * r]; parts.push(beam("落羽杉扁枝", bark, [0, p[1], 0], p, 0.06), compound(p, i * 137)); } for (let i = 0; i < 6; i++) parts.push(cap("独立膝状呼吸根", "#b8ad8d", [Math.sin(i * 2.4) * 1.1, 0, Math.cos(i * 2.4) * 1.1], 0.13, 0.4 + i % 2 * 0.25, 1)); }
  else if (kind === 6) { parts.push(tapered("刺果松扭曲裸露老干", "#aaa38b", [[0, 0, 0], [-0.25, 0.8, 0.1], [0.2, 1.7, -0.05], [0, 2.8, 0]], [0.32, 0.24, 0.16, 0.035]), tube("裸露扭转木纹脊", "#cbc3a5", [[0.2, 0, 0], [-0.1, 0.8, 0.2], [0.3, 1.7, 0], [0, 2.8, 0]], 0.035)); for (const side of [-1, 1]) { const p: Triple = [side * 1.1, 2.3 + side * 0.35, 0]; parts.push(tapered("盘曲活枝", bark, [[0.1, 1.5, 0], [side * 0.65, 1.8, 0.2], p], [0.1, 0.06, 0.02]), radialLeaves(16, p, 0.025, 0.35, 30, "#a0b287")); } }
  else if (kind === 7) { parts.push(part("大戟树多棱肉质主茎", "extrude", "#a3b78d", [0, 1.2, 0], [1, 1, 1], [-90, 0, 0], { depth: 2.4, profile: [{ x: 0, y: 0.19 }, { x: -0.17, y: -0.1 }, { x: 0.17, y: -0.1 }] })); for (const side of [-1, 1]) for (const end of [-1, 1]) { const p: Triple = [side * 0.7, 1.3, end * 0.5]; parts.push(beam("三棱肉质侧臂", "#a3b78d", [0, 0.8, 0], p, 0.17), part("大戟树三棱直立端枝", "extrude", "#b4c29b", [p[0], 2.25, p[2]], [1, 1, 1], [-90, 0, 0], { depth: 1.9, profile: [{ x: 0, y: 0.14 }, { x: -0.12, y: -0.07 }, { x: 0.12, y: -0.07 }] })); } }
  else if (kind === 8) { parts.push(part("酒瓶椰子下宽上细树干", "lathe", "#b8b696", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.3, y: 0 }, { x: 0.48, y: 0.7 }, { x: 0.28, y: 1.7 }, { x: 0.13, y: 3.4 }, { x: 0, y: 3.5 }] })); for (let i = 0; i < 7; i++) parts.push(compound([0, 3.4, 0], i * 360 / 7, false, 1.7)); parts.push(part("大型绿色冠鞘", "cylinder", "#b3c29a", [0, 3.15, 0], [0.31, 0.7, 0.31])); }
  else { parts.push(tapered("红杉高大沟状树干", "#a49375", [[0, 0, 0], [0, 5, 0], [0, 12, 0]], [0.9, 0.5, 0.06])); for (let i = 0; i < 10; i++) { const a = i * 2.4; const r = 2.2 - i * 0.16; const p: Triple = [Math.cos(a) * r, 4 + i * 0.7, Math.sin(a) * r]; parts.push(beam("红杉层叠扁枝", bark, [0, p[1] - 0.25, 0], p, 0.11), compound(p, i * 137)); } for (let i = 0; i < 5; i++) parts.push(leaf("宽厚根颈板根", "#afa181", [0, 0, 0], 2.7, 2, [0, i * 72, 0])); }
  return parts;
}

function cultivatedTree(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) { parts.push(tapered("茶树矮曲主干", bark, [[0, 0, 0], [0.06, 0.35, 0], [0, 0.7, 0]], [0.09, 0.065, 0.025])); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const p: Triple = [Math.cos(a) * 0.5, 0.75, Math.sin(a) * 0.5]; parts.push(beam("茶树横展骨干枝", bark, [0, 0.3, 0], p, 0.025)); foliage(parts, p, 3, 0.4); parts.push(petals(5, [p[0], 0.9, p[2]], 0.025, 0.05, 65, "#d7d1b7"), petals(18, [p[0], 0.91, p[2]], 0.002, 0.025, 25, "#c9c091")); } }
  else if (kind === 1) { parts.push(tapered("橄榄树扭转粗干", "#a9aa90", [[0, 0, 0], [-0.16, 0.8, 0], [0.12, 1.5, 0], [0, 2.1, 0]], [0.28, 0.2, 0.13, 0.06])); for (let i = 0; i < 5; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 1.1, 2.5 + i % 2 * 0.3, Math.sin(a) * 1.1]; parts.push(beam("橄榄曲折枝", bark, [0, 1.3, 0], p, 0.07)); foliage(parts, p, 12, 0.6); for (const side of [-1, 1]) parts.push(lobe("狭长橄榄核果", "#a6b18b", [p[0] + side * 0.15, p[1] - 0.15, p[2]], [0.035, 0.06, 0.035])); } }
  else if (kind === 2) { parts.push(tapered("辣木柔软高直树干", "#b5ad8d", [[0, 0, 0], [0.05, 1.5, 0], [0, 3.4, 0]], [0.16, 0.1, 0.03])); for (let i = 0; i < 5; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a), 2.2 + i * 0.2, Math.sin(a)]; parts.push(beam("辣木复羽叶枝", bark, [0, 1.6, 0], p, 0.04)); foliage(parts, p, 8, 0.55); parts.push(part("三棱长辣木荚", "extrude", "#b1b789", [p[0], p[1] - 0.3, p[2]], [1, 1, 1], [-90, 0, 0], { depth: 0.6, profile: [{ x: 0, y: 0.025 }, { x: -0.022, y: -0.013 }, { x: 0.022, y: -0.013 }] })); } }
  else { const height = kind === 5 || kind === 6 ? 4.1 : 3.3; parts.push(tapered("自立木质主干", bark, [[0, 0, 0], [0.1, 1.2, 0], [0, 2.5, 0]], [0.23, 0.17, 0.07])); for (let i = 0; i < 5; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 1.4, height - 0.8 + i % 3 * 0.35, Math.sin(a) * 1.3]; parts.push(tapered("开张侧枝", bark, [[0, 1.3, 0], [p[0] * 0.65, p[1] - 0.4, p[2] * 0.65], p], [0.1, 0.05, 0.015])); foliage(parts, p, kind === 4 ? 13 : kind === 9 ? 2 : 8, 0.68);
      if (kind === 3) pod(parts, [p[0], p[1] - 0.1, p[2]]);
      else if (kind === 4) pod(parts, [p[0], p[1] - 0.1, p[2]], true);
      else if (kind === 5) for (let j = 0; j < 3; j++) parts.push(cap("蓝花楹喇叭状花束", "#b5abc5", [p[0] + Math.sin(j) * 0.12, p[1] + 0.1, p[2] + Math.cos(j) * 0.12], 0.025, 0.07, 3));
      else if (kind === 6) parts.push(petals(5, [p[0], p[1] + 0.13, p[2]], 0.065, 0.12, 65, "#c5a592"), leaf("凤凰木长平豆荚", "#a49b79", [p[0], p[1] - 0.1, p[2]], 0.055, 0.55, [170, 20, 0]));
      else if (kind === 7) for (let j = 0; j < 6; j++) parts.push(petals(3, [p[0], p[1] - 0.08 - j * 0.05, p[2]], 0.025, 0.04, 135, "#d0c18b"));
      else if (kind === 8) { pod(parts, [p[0], p[1] - 0.1, p[2]], true); const q: Triple = [0.12, 0.5 + i * 0.3, 0]; parts.push(needle("皂荚树干分枝硬刺", "#b8b08d", q, [0.5, q[1] + 0.1, 0], 0.04), needle("硬刺侧叉", "#b8b08d", [0.3, q[1] + 0.05, 0], [0.4, q[1] + 0.2, 0.1], 0.025)); }
      else parts.push(lobe("面包树大型复果", "#bdc798", [p[0], p[1] - 0.24, p[2]], [0.22, 0.25, 0.2]));
    } }
  return parts;
}

const ordinaryNames = [["oakTree", "橡树"], ["mapleTree", "枫树"], ["lindenTree", "椴树"], ["horseChestnutTree", "七叶树"], ["elmTree", "榆树"], ["beechTree", "山毛榉"], ["hornbeamTree", "鹅耳枥"], ["chestnutTree", "栗树"], ["walnutTree", "胡桃树"], ["rowanTree", "花楸树"]];
const unusualNames = [["kapokTree", "木棉树"], ["silkFlossTree", "美丽异木棉"], ["umbrellaAcacia", "伞金合欢"], ["travellersPalm", "旅人蕉"], ["monkeyPuzzleTree", "智利南洋杉"], ["baldCypress", "落羽杉"], ["bristleconePine", "刺果松"], ["euphorbiaTree", "大戟树"], ["bottlePalm", "酒瓶椰子"], ["redwood", "红杉"]];
const cultivatedNames = [["teaTree", "茶树"], ["oliveTree", "橄榄树"], ["moringaTree", "辣木"], ["tamarindTree", "罗望子树"], ["carobTree", "角豆树"], ["jacarandaTree", "蓝花楹"], ["flameTree", "凤凰木"], ["goldenChainTree", "金链花"], ["honeyLocustTree", "皂荚树"], ["breadfruitTree", "面包树"]];

export const treeDesigns: MasterNatureDesign[] = [
  ...ordinaryNames.map(([key, name], index) => design(key!, name!, "植物", () => ordinaryTree(index), ["具名乔木叶果形态"])),
  ...unusualNames.map(([key, name], index) => design(key!, name!, "植物", () => unusualTree(index), ["特殊树干与冠叶结构"])),
  ...cultivatedNames.map(([key, name], index) => design(key!, name!, "植物", () => cultivatedTree(index), ["自立木本植物"])),
];
