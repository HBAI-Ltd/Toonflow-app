import { basalLeaves, beam, cap, combineMeshes, design, leaf, lobe, needle, part, petals, radialLeaves, tube } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const green = "#849d70";
const stem = "#9aa27a";
const pink = "#c0a5ac";
const cream = "#d4cbb5";

function forkLeaf(root: Triple, length: number, angle = 0): ModelPart {
  return combineMeshes("分叉叶掌", green, [-1, 0, 1].map(side => leaf("掌状裂片", green, root, length * 0.16, length * (side ? 0.78 : 1), [40, angle + side * 35, 0])));
}

function compound(root: Triple, angle: number, length: number): ModelPart {
  const a = angle * Math.PI / 180;
  return combineMeshes("对生羽状小叶", green, Array.from({ length: 14 }, (_, i) => { const t = (Math.floor(i / 2) + 1) / 8; const side = i % 2 ? 1 : -1; return leaf("小叶", green, [root[0] + Math.cos(a) * length * t, root[1] + Math.sin(t * Math.PI) * length * 0.25, root[2] + Math.sin(a) * length * t], length * 0.13, length * 0.3, [65, -angle + side * 70, 0]); }));
}

function woody(parts: ModelPart[], height: number, spread: number): Triple[] {
  parts.push(beam("木质主茎", "#958466", [0, 0, 0], [0, height * 0.65, 0], height * 0.045));
  return [-1, 0, 1].map(side => { const p: Triple = [side * spread, height * (side ? 0.8 : 1), side ? 0.03 : -0.05]; parts.push(beam("开张侧枝", "#958466", [0, height * 0.4, 0], p, height * 0.022)); return p; });
}

function spike(parts: ModelPart[], height: number, leaves = true) {
  parts.push(beam("花序轴", stem, [0, 0, 0], [0, height, 0], 0.009));
  if (leaves) parts.push(leaf("下部茎叶", green, [0, height * 0.25, 0], 0.065, height * 0.4, [45, 80, 0]), leaf("上部茎叶", green, [0, height * 0.45, 0], 0.05, height * 0.3, [55, -80, 0]));
}

function ancient(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) { parts.push(lobe("苔藓垫状基部", "#9bad7d", [0, 0.012, 0], [0.2, 0.024, 0.17])); for (let i = 0; i < 16; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * Math.sqrt(i / 16) * 0.08, 0.012, Math.sin(a) * Math.sqrt(i / 16) * 0.06]; parts.push(radialLeaves(5, p, 0.004, 0.022, 35)); if (i % 3 === 0) parts.push(beam("苔藓蒴柄", "#a79d73", p, [p[0] + 0.005, 0.075, p[2]], 0.001), lobe("孢蒴", "#b5a67d", [p[0] + 0.005, 0.077, p[2]], [0.007, 0.012, 0.007])); } }
  else if (kind === 1) { for (let i = 0; i < 7; i++) parts.push(forkLeaf([Math.sin(i * 2.4) * 0.045, 0.006, Math.cos(i * 2.4) * 0.045], 0.065, i * 52)); for (const side of [-1, 1]) parts.push(beam("地钱雌托柄", stem, [side * 0.025, 0.008, 0], [side * 0.025, 0.065, 0], 0.002), petals(8, [side * 0.025, 0.065, 0], 0.009, 0.027, 110, "#a8b98c")); }
  else if (kind === 2) { parts.push(radialLeaves(7, [0, 0.003, 0], 0.025, 0.06, 85)); for (let i = 0; i < 6; i++) parts.push(needle("角苔细长角状孢子体", "#a5ad84", [(i - 2.5) * 0.013, 0.006, Math.sin(i) * 0.015], [(i - 2.5) * 0.017, 0.09 + i % 3 * 0.018, Math.sin(i) * 0.015], 0.005)); }
  else if (kind === 3) { parts.push(tube("石松匍匐茎", "#8fa26f", [[-0.14, 0.015, 0], [0, 0.02, 0], [0.14, 0.015, 0]], 0.009)); for (const side of [-1, 0, 1]) { const p: Triple = [side * 0.085, 0.14, 0]; parts.push(beam("二歧直立枝", green, [side * 0.06, 0.015, 0], p, 0.006)); for (let i = 0; i < 5; i++) parts.push(radialLeaves(4, [p[0], 0.025 + i * 0.025, 0], 0.007, 0.027, 50)); parts.push(needle("顶生孢子穗", "#bdba89", p, [p[0], 0.21, 0], 0.018)); } }
  else if (kind === 4) { parts.push(part("木贼节状中空茎", "cylinder", "#9aac7e", [0, 0.3, 0], [0.018, 0.6, 0.018])); for (let node = 1; node < 7; node++) { parts.push(part("木贼黑节环", "cylinder", "#788d68", [0, node * 0.08, 0], [0.022, 0.012, 0.022])); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; parts.push(beam("轮生细枝", green, [0, node * 0.08, 0], [Math.cos(a) * (0.17 - node * 0.014), node * 0.08 + 0.06, Math.sin(a) * (0.17 - node * 0.014)], 0.003)); } } }
  else if (kind === 5) { for (let i = 0; i < 9; i++) { const a = i * Math.PI * 2 / 9; const end: Triple = [Math.cos(a) * 0.17, 0.045 + i % 2 * 0.02, Math.sin(a) * 0.17]; parts.push(beam("卷柏平展枝", "#9ba67b", [0, 0.035, 0], end, 0.004), combineMeshes("四列鳞形小叶", green, Array.from({ length: 16 }, (_, j) => { const t = (Math.floor(j / 4) + 1) / 5; return leaf("鳞叶", green, [end[0] * t, 0.035, end[2] * t], 0.012, 0.024, [70, -i * 40 + j % 4 * 90, 0]); }))); } }
  else if (kind === 6 || kind === 7) { parts.push(part(kind === 6 ? "苏铁粗短鳞干" : "桫椤细高蕨干", "cylinder", "#9b8e71", [0, kind === 6 ? 0.3 : 1.2, 0], kind === 6 ? [0.28, 0.6, 0.28] : [0.18, 2.4, 0.18])); const y = kind === 6 ? 0.58 : 2.38; for (let i = 0; i < 8; i++) parts.push(compound([0, y, 0], i * 45, kind === 6 ? 1.15 : 1.65)); if (kind === 6) parts.push(part("苏铁大型雌球花", "cone", "#b8a77f", [0, 0.78, 0], [0.2, 0.42, 0.2])); else for (let i = 0; i < 8; i++) parts.push(leaf("枯叶柄基", "#887f65", [0, 0.8 + i * 0.18, 0], 0.2, 0.13, [70, i * 45, 0])); }
  else if (kind === 8) { parts.push(lobe("百岁兰盘状木质茎", "#a99a79", [0, 0.07, 0], [0.42, 0.14, 0.36])); for (const side of [-1, 1]) { const base: Triple = [side * 0.1, 0.08, 0]; const end: Triple = [side * 1.2, 0.025, 0.15]; parts.push(leaf("终生带状叶基部", "#9fae80", base, 0.32, 1.3, [85, -side * 90, side * 8]), tube("叶片扭曲中脉", "#b2b88f", [base, [side * 0.6, 0.16, 0.1], end], 0.012)); } parts.push(part("短柄球花", "cone", "#b49e78", [0.1, 0.23, 0.1], [0.08, 0.2, 0.08])); }
  else { parts.push(tube("人参膨大主根", "#c0ad8c", [[0, 0, 0], [0, 0.13, 0], [0, 0.25, 0]], 0.035), beam("人参地上茎", stem, [0, 0.23, 0], [0, 0.7, 0], 0.009)); for (const side of [-1, 1]) parts.push(tube("人参叉根", "#c0ad8c", [[0, 0.09, 0], [side * 0.055, -0.015, 0.01], [side * 0.09, -0.07, 0]], 0.013)); for (let i = 0; i < 3; i++) parts.push(forkLeaf([0, 0.6, 0], 0.2, i * 120)); for (let i = 0; i < 9; i++) parts.push(lobe("顶生红果伞序", "#b99784", [Math.cos(i) * 0.035, 0.72 + Math.sin(i) * 0.01, Math.sin(i) * 0.035], [0.015, 0.018, 0.015])); }
  return parts;
}

function vinesAndSpikes(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind < 5) {
    parts.push(tube("攀援木质蔓", "#9a8d6c", [[0, 0, 0], [0.11, 0.6, 0], [-0.07, 1.1, 0], [0.2, 1.5, 0]], 0.018));
    for (let i = 0; i < 5; i++) { const p: Triple = [Math.sin(i * 2.4) * 0.15, 0.35 + i * 0.22, 0.02]; parts.push(beam("叶序支梗", stem, [0, p[1] - 0.07, 0], p, 0.005));
      if (kind === 0) { parts.push(compound(p, i * 72, 0.3)); for (let j = 0; j < 5; j++) parts.push(petals(3, [p[0], p[1] - j * 0.04, 0.07], 0.024, 0.045, 120, "#b3a5c0")); }
      else if (kind === 1) parts.push(forkLeaf(p, 0.15, i * 70));
      else if (kind === 2) parts.push(leaf("卵形三角梅叶", green, p, 0.1, 0.17, [65, i * 60, 0]), petals(3, [p[0], p[1] + 0.08, p[2]], 0.07, 0.1, 65, "#c1a7b3"), part("细小真花筒", "cylinder", cream, [p[0], p[1] + 0.1, p[2]], [0.009, 0.04, 0.009]));
      else if (kind === 3) parts.push(petals(4, p, 0.07, 0.13, 70, "#b8aec3"), petals(14, [p[0], p[1] + 0.02, p[2]], 0.004, 0.055, 65, "#cfc8aa"), leaf("三出叶", green, [p[0], p[1] - 0.12, p[2]], 0.07, 0.15, [70, i * 72, 0]));
      else { parts.push(petals(5, p, 0.045, 0.1, 80, "#c9c6b2"), petals(28, [p[0], p[1] + 0.008, p[2]], 0.004, 0.09, 75, "#afa4ba"), beam("西番莲高举雌雄蕊柱", "#acae86", p, [p[0], p[1] + 0.07, p[2]], 0.009), petals(3, [p[0], p[1] + 0.07, p[2]], 0.011, 0.04, 85, "#a7a680")); }
    }
  } else if (kind === 5 || kind === 6) {
    parts.push(tube("拱形总状花轴", stem, [[0, 0, 0], [0, 0.6, 0], [0.3, 0.75, 0], [0.6, 0.55, 0]], 0.009));
    for (let i = 0; i < 6; i++) { const p: Triple = [0.08 + i * 0.085, 0.63 - i * 0.015, 0]; parts.push(beam("下垂花梗", stem, [p[0], p[1] + 0.06, 0], p, 0.004));
      if (kind === 5) parts.push(cap("倒挂金钟长筒萼", "#b69aa5", p, 0.025, 0.08, 4), petals(4, [p[0], p[1] + 0.02, 0], 0.016, 0.08, 130, pink), petals(4, [p[0], p[1] - 0.025, 0], 0.024, 0.045, 145, "#aaa0b2"));
      else parts.push(lobe("荷包牡丹心形左瓣", pink, [p[0] - 0.014, p[1], 0], [0.036, 0.045, 0.023], [0, 0, -25]), lobe("荷包牡丹心形右瓣", pink, [p[0] + 0.014, p[1], 0], [0.036, 0.045, 0.023], [0, 0, 25]), needle("内瓣垂尖", cream, [p[0], p[1] - 0.015, 0], [p[0], p[1] - 0.055, 0], 0.014));
    }
    parts.push(kind === 5 ? leaf("对生卵叶", green, [0, 0.35, 0], 0.09, 0.19, [65, 75, 0]) : forkLeaf([0, 0.25, 0], 0.22, 80));
  } else {
    spike(parts, 1.05);
    for (let i = 0; i < 8; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.055, 0.48 + i * 0.068, Math.sin(a) * 0.055]; parts.push(beam("侧生花柄", stem, [0, p[1], 0], p, 0.004));
      if (kind === 7) parts.push(cap("金鱼草膨大唇形花", "#c4b29a", p, 0.025, 0.055, 4), leaf("上唇瓣", pink, [p[0], p[1] + 0.04, p[2]], 0.04, 0.04, [80, -a * 180 / Math.PI % 360, 0]));
      else if (kind === 8) parts.push(cap("毛地黄下垂长钟花", "#c4afbb", p, 0.035, 0.075, 4), lobe("花喉斑", "#a18b9b", [p[0], p[1] + 0.01, p[2] + 0.027], [0.012, 0.009, 0.005]));
      else if (kind === 9) parts.push(petals(5, p, 0.07, 0.105, 75, pink), cap("蜀葵花喉", "#c7bb99", p, 0.018, 0.04, 3));
      else if (kind === 10) parts.push(petals(5, p, 0.035, 0.065, 70, "#a8a9be"), tube("飞燕草后伸花距", "#a8a9be", [p, [p[0] - 0.04, p[1], p[2] - 0.02], [p[0] - 0.06, p[1] + 0.025, p[2] - 0.02]], 0.008));
      else parts.push(petals(6, p, 0.055, 0.085, 45, "#c8afa6"), leaf("唐菖蒲长剑叶", green, [0, 0.04, 0], 0.035, 0.85, [5, i * 80, i % 2 * 10]));
    }
  }
  return parts;
}

function flowers(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind < 9) spike(parts, kind === 6 ? 0.9 : 0.5, kind !== 0 && kind !== 1 && kind !== 2);
  if (kind === 0) { parts.push(...basalLeaves(4, 0.6), petals(3, [0, 0.5, 0], 0.065, 0.14, 20, "#ada6be"), petals(3, [0, 0.5, 0], 0.07, 0.18, 125, "#b6adc4")); }
  else if (kind === 1) parts.push(...basalLeaves(4, 0.4), petals(6, [0, 0.5, 0], 0.055, 0.11, 80, cream), cap("水仙中央喇叭副花冠", "#c8bd8a", [0, 0.5, 0], 0.034, 0.085, 3));
  else if (kind === 2) { parts.push(radialLeaves(6, [0, 0.03, 0], 0.09, 0.14, 75), cap("仙客来反卷花基", pink, [0, 0.47, 0], 0.02, 0.03, 4), petals(5, [0, 0.5, 0], 0.04, 0.14, 10, "#c6aebc")); }
  else if (kind === 3) parts.push(petals(2, [0, 0.5, 0], 0.08, 0.11, 30, "#b6a4bd"), petals(2, [0, 0.49, 0.04], 0.06, 0.08, 100, cream), leaf("三色堇宽下唇瓣", "#c6ba94", [0, 0.48, 0.04], 0.1, 0.1, [130, 0, 0]));
  else if (kind === 4) { parts.push(radialLeaves(6, [0, 0.12, 0], 0.11, 0.14, 70)); for (let i = 0; i < 7; i++) parts.push(petals(5, [Math.cos(i) * 0.065, 0.5 + Math.sin(i) * 0.025, Math.sin(i) * 0.065], 0.025, 0.04, 70, "#c3a6ad")); }
  else if (kind === 5) { for (const side of [-1, 1]) parts.push(leaf("秋海棠偏斜大叶", "#99aa85", [side * 0.02, 0.2, 0], 0.23, 0.3, [55, side * 70, side * 30]), petals(2, [side * 0.04, 0.5, 0], 0.08, 0.075, 75, "#c9b1bc"), petals(2, [side * 0.04, 0.49, 0.01], 0.04, 0.05, 75, "#c9b1bc")); }
  else if (kind === 6) parts.push(leaf("红掌心形佛焰苞左半", "#b8a49d", [-0.025, 0.85, 0], 0.1, 0.2, [45, -25, 0]), leaf("红掌心形佛焰苞右半", "#b8a49d", [0.025, 0.85, 0], 0.1, 0.2, [45, 25, 0]), needle("外伸肉穗花序", "#d1c59b", [0, 0.88, 0.03], [0, 1.03, 0.1], 0.025));
  else if (kind === 7) { parts.push(radialLeaves(7, [0, 0.37, 0], 0.07, 0.18, 65, "#b4a191"), radialLeaves(5, [0, 0.2, 0], 0.06, 0.14, 65)); for (let i = 0; i < 5; i++) parts.push(lobe("一品红小杯状花序", "#c2bd8e", [Math.cos(i) * 0.018, 0.5, Math.sin(i) * 0.018], [0.015, 0.014, 0.015])); }
  else if (kind === 8) parts.push(petals(5, [0, 0.5, 0], 0.095, 0.15, 65, pink), beam("扶桑外伸雄蕊管", "#c4b38d", [0, 0.5, 0], [0.04, 0.72, 0.02], 0.012), petals(5, [0.04, 0.72, 0.02], 0.005, 0.02, 75, "#bea181"));
  else if (kind < 12) {
    const ends = woody(parts, kind === 9 ? 0.7 : 1.1, 0.35);
    for (const p of ends) {
      if (kind === 9) { parts.push(forkLeaf([p[0], p[1] - 0.2, p[2]], 0.24, 60)); for (let layer = 0; layer < 3; layer++) parts.push(petals(8, [p[0], p[1] + layer * 0.018, p[2]], 0.065 - layer * 0.01, 0.13 - layer * 0.025, 40 + layer * 12, "#cbb3b8")); }
      else if (kind === 10) parts.push(leaf("山茶革质叶", green, [p[0], p[1] - 0.2, p[2]], 0.08, 0.17, [60, 70, 0]), petals(6, p, 0.075, 0.11, 60, "#c2aca8"), petals(18, [p[0], p[1] + 0.02, p[2]], 0.003, 0.05, 40, "#c8bd90"));
      else parts.push(petals(9, p, 0.065, 0.16, 20, "#d3c5c1"), cap("玉兰聚合雌蕊柱", "#abb28a", p, 0.022, 0.07, 1));
    }
  } else if (kind === 12) { spike(parts, 0.8); parts.push(cap("帝王花筐状花托", "#bdad99", [0, 0.7, 0], 0.13, 0.18, 3), petals(18, [0, 0.72, 0], 0.04, 0.2, 25, "#c6b0b2"), lobe("密集中央花毛", "#d0c7af", [0, 0.84, 0], [0.19, 0.18, 0.19])); }
  else if (kind === 13) { const ends = woody(parts, 1.2, 0.25); for (const p of ends) { parts.push(part("佛塔花柱状花序", "cylinder", "#b4aa80", p, [0.09, 0.28, 0.09])); for (let i = 0; i < 8; i++) parts.push(petals(8, [p[0], p[1] - 0.12 + i * 0.033, p[2]], 0.012, 0.065, 75, "#c6ba8e")); parts.push(leaf("佛塔花锯齿长叶", green, [p[0], p[1] - 0.3, p[2]], 0.05, 0.35, [60, 80, 0])); } }
  else if (kind === 14) { const ends = woody(parts, 0.9, 0.3); for (const p of ends) { parts.push(beam("红千层花轴", stem, [p[0], p[1] - 0.15, p[2]], [p[0], p[1] + 0.1, p[2]], 0.015)); for (let i = 0; i < 8; i++) parts.push(petals(12, [p[0], p[1] - 0.12 + i * 0.028, p[2]], 0.003, 0.07, 85, "#bba0a0")); } }
  else if (kind === 15) { spike(parts, 1.3, false); parts.push(leaf("蝎尾蕉大叶", green, [0, 0.2, 0], 0.3, 0.85, [25, 80, 0])); for (let i = 0; i < 6; i++) { const side = i % 2 ? 1 : -1; parts.push(leaf("交错舟形苞片", "#b7a08b", [0, 0.6 + i * 0.105, 0], 0.085, 0.28, [70, side * 90, 0]), needle("苞中筒状小花", "#c9bd93", [side * 0.08, 0.64 + i * 0.105, 0], [side * 0.08, 0.72 + i * 0.105, 0], 0.012)); } }
  else if (kind === 16) { spike(parts, 0.95); parts.push(radialLeaves(5, [0, 0.2, 0], 0.1, 0.6, 30)); for (let i = 0; i < 4; i++) { const p: Triple = [Math.cos(i) * 0.05, 0.87 + i * 0.025, Math.sin(i) * 0.05]; parts.push(petals(3, p, 0.06, 0.12, 65, cream), needle("姜花长花丝", "#c8c09c", p, [p[0] + 0.12, p[1] + 0.12, p[2]], 0.005)); } }
  else if (kind === 17) { spike(parts, 1.2, false); for (let i = 0; i < 4; i++) parts.push(leaf("美人蕉抱茎阔叶", green, [0, 0.2 + i * 0.16, 0], 0.27, 0.55, [25, i % 2 * 180 + 90, 0])); for (let i = 0; i < 4; i++) parts.push(petals(3, [Math.sin(i) * 0.05, 1.05 + i * 0.06, 0], 0.07, 0.14, 40, "#c2aa8c"), leaf("不对称瓣化雄蕊", pink, [0, 1.07 + i * 0.06, 0.02], 0.1, 0.13, [65, i * 90, 30])); }
  else { spike(parts, 1.45, false); parts.push(radialLeaves(3, [0, 0.2, 0], 0.17, 0.8, 30)); for (let layer = 0; layer < 4; layer++) parts.push(petals(10, [0, 1.31 + layer * 0.04, 0], 0.055 - layer * 0.007, 0.15 - layer * 0.025, 55 - layer * 10, "#c0a4a8")); parts.push(cap("火炬姜中央苞芽", "#c7b0ac", [0, 1.44, 0], 0.045, 0.13, 1)); }
  return parts;
}

function herbs(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind < 5) spike(parts, kind === 3 ? 0.9 : 0.55);
  if (kind === 0) { parts.push(lobe("蓝盆花圆垫花序", "#b9b2c5", [0, 0.55, 0], [0.12, 0.06, 0.12]), petals(12, [0, 0.55, 0], 0.025, 0.08, 85, "#b2a8bf")); for (let i = 0; i < 16; i++) { const a = i * 2.4; parts.push(beam("外伸花柱", "#c6c5b7", [Math.cos(a) * 0.04, 0.57, Math.sin(a) * 0.04], [Math.cos(a) * 0.06, 0.64, Math.sin(a) * 0.06], 0.001)); } }
  else if (kind === 1) { parts.push(part("松果菊尖锥花盘", "cone", "#b0a073", [0, 0.59, 0], [0.075, 0.1, 0.075]), petals(14, [0, 0.55, 0], 0.026, 0.14, 120, "#c3acb4")); }
  else if (kind === 2 || kind === 3) { for (let i = 0; i < 16; i++) { const a = i * 2.4; const y = kind === 2 ? 0.55 + Math.cos(i / 15 * Math.PI) * 0.09 : 0.9 + Math.sin(i) * 0.03; const r = kind === 2 ? Math.sin(i / 15 * Math.PI) * 0.09 : 0.13; const p: Triple = [Math.cos(a) * r, y, Math.sin(a) * r]; parts.push(beam("伞序花梗", stem, [0, kind === 2 ? 0.55 : 0.86, 0], p, 0.002)); if (kind === 2) parts.push(petals(6, p, 0.005, 0.018, 60, "#b9aec4")); else parts.push(cap("百子莲喇叭小花", "#afaac2", p, 0.018, 0.045, 3)); } if (kind === 3) parts.push(...basalLeaves(6, 0.5)); }
  else if (kind === 4) { for (let i = 0; i < 7; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.025, 0.3 + i * 0.035, Math.sin(a) * 0.025]; parts.push(cap("鼠尾草双唇花筒", "#aaa6bd", p, 0.014, 0.03, 4), leaf("下伸唇瓣", "#aaa6bd", p, 0.02, 0.03, [100, -a * 180 / Math.PI % 360, 0])); } }
  else if (kind === 5 || kind === 6 || kind === 7) {
    const ends = woody(parts, kind === 5 ? 0.5 : kind === 6 ? 0.17 : 0.4, kind === 6 ? 0.17 : 0.12);
    for (const p of ends) for (let node = 0; node < 5; node++) { const y = p[1] * (0.35 + node * 0.13); for (const side of [-1, 1]) parts.push(leaf(kind === 5 ? "迷迭香线形革叶" : kind === 6 ? "百里香小卵叶" : "薄荷锯齿对生叶", green, [p[0] * (0.35 + node * 0.13), y, 0], kind === 5 ? 0.009 : kind === 6 ? 0.015 : 0.045, kind === 5 ? 0.065 : kind === 6 ? 0.025 : 0.08, [50, side * 90 + node % 2 * 90, 0])); }
    if (kind === 5) parts.push(petals(4, [0.12, 0.42, 0], 0.006, 0.012, 55, "#b1adc1"));
    else if (kind === 6) for (let i = 0; i < 3; i++) parts.push(petals(5, ends[i]!, 0.009, 0.015, 60, pink));
    else parts.push(part("薄荷顶生花穗", "cone", "#bcb6c1", [0, 0.46, 0], [0.035, 0.13, 0.035]));
  } else if (kind === 8) { spike(parts, 0.5); parts.push(compound([0, 0.2, 0], 20, 0.25), compound([0, 0.25, 0], 160, 0.25)); for (let layer = 0; layer < 4; layer++) parts.push(petals(14, [0, 0.48 + layer * 0.018, 0], 0.028, 0.095 - layer * 0.014, 35 + layer * 8, "#c8b37d")); }
  else { spike(parts, 0.7, false); for (let node = 0; node < 3; node++) parts.push(petals(14, [0, 0.15 + node * 0.12, 0], 0.002, 0.2, 75, green)); parts.push(petals(8, [0, 0.7, 0], 0.045, 0.13, 75, "#c2a6b3"), part("波斯菊小管状花盘", "cylinder", "#c2b381", [0, 0.72, 0], [0.035, 0.015, 0.035])); }
  return parts;
}

function special(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) { parts.push(lobe("鹿角蕨盾叶", "#a2ad85", [0, 0.25, 0], [0.45, 0.5, 0.07])); for (let i = 0; i < 5; i++) { const p: Triple = [(i - 2) * 0.15, 0.3 + Math.abs(i - 2) * 0.07, 0.04]; parts.push(beam("鹿角蕨叶柄", stem, [0, 0.1, 0.04], p, 0.02), forkLeaf(p, 0.5, i * 45)); } }
  else if (kind === 1) { for (let i = 0; i < 14; i++) parts.push(leaf("鸟巢蕨完整波缘长叶", "#8fa77c", [0, 0.035, 0], 0.14, 0.7 + i % 3 * 0.1, [25 + i % 2 * 20, -i * 360 / 14, 0])); }
  else if (kind === 2) { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const p: Triple = [Math.cos(a) * 0.06, 0.025, Math.sin(a) * 0.06]; parts.push(beam("茅膏菜叶柄", green, [0, 0, 0], p, 0.003), lobe("圆形捕虫叶", "#b0ad8b", p, [0.04, 0.005, 0.04])); const glands: ModelPart[] = []; for (let j = 0; j < 8; j++) { const b = j * Math.PI / 4; const q: Triple = [p[0] + Math.cos(b) * 0.018, 0.045, p[2] + Math.sin(b) * 0.018]; glands.push(needle("黏液腺毛", "#bb9d9b", [q[0], 0.025, q[2]], q, 0.002), lobe("黏滴", "#c6b3a7", q, [0.004, 0.005, 0.004])); } parts.push(combineMeshes("完整叶面黏液腺", "#bb9d9b", glands)); } }
  else if (kind === 3) { parts.push(tube("眼镜蛇瓶子草空心叶管", "#9aaf7e", [[0, 0, 0], [0, 0.3, 0], [0.03, 0.48, 0]], 0.035), cap("膨大眼镜蛇形叶罩", "#b1bc91", [0.035, 0.42, 0], 0.085, 0.12, 0), ...[-1, 1].map(side => leaf("分叉鱼尾状叶舌", "#b6a28e", [0.035, 0.44, 0.055], 0.018, 0.11, [155, side * 20, 0]))); }
  else if (kind === 4) { for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 0.065; parts.push(part("直立漏斗捕虫叶", "lathe", "#a4b68b", [x, 0, 0], [1, 1, 1], [0, 0, (i - 1.5) * -10], { profile: [{ x: 0.007, y: 0 }, { x: 0.015, y: 0.2 }, { x: 0.04, y: 0.45 }, { x: 0.035, y: 0.45 }, { x: 0.012, y: 0.2 }, { x: 0.003, y: 0 }] }), leaf("瓶子草口盖", "#b9ae97", [x, 0.45, -0.025], 0.08, 0.1, [70, 0, 0])); } }
  else if (kind === 5) { parts.push(tube("狸藻水下丝状茎", "#9dad81", [[-0.12, 0.02, 0], [0, 0.02, 0], [0.12, 0.02, 0]], 0.003)); for (let i = 0; i < 12; i++) { const x = (i - 5.5) * 0.02; parts.push(leaf("丝裂水下叶", green, [x, 0.02, 0], 0.003, 0.055, [70, i * 137, 0]), lobe("吸入式捕虫囊", "#b6bd9b", [x, 0.022, Math.sin(i) * 0.015], [0.01, 0.012, 0.01])); } parts.push(beam("挺水花葶", stem, [0, 0.02, 0], [0, 0.23, 0], 0.003), petals(3, [0, 0.23, 0], 0.025, 0.035, 65, "#d1c28d")); }
  else if (kind === 6) parts.push(radialLeaves(7, [0, 0.008, 0], 0.045, 0.09, 75, "#b6c096"), tube("捕虫堇曲花梗", stem, [[0, 0, 0], [0, 0.17, 0], [0.04, 0.2, 0]], 0.003), petals(5, [0.04, 0.2, 0], 0.017, 0.03, 65, "#b8abc1"), needle("细长花距", "#b8abc1", [0.04, 0.2, 0], [0.01, 0.18, -0.035], 0.008));
  else if (kind === 7) { parts.push(...basalLeaves(4, 0.3), beam("兜兰花葶", stem, [0, 0, 0], [0, 0.4, 0], 0.007), leaf("兜兰直立背萼", "#bdbe9c", [0, 0.4, 0], 0.08, 0.12), cap("拖鞋形唇囊", "#bea58e", [0, 0.34, 0.04], 0.045, 0.07, 3), ...[-1, 1].map(side => leaf("侧伸带形花瓣", "#b8af92", [0, 0.4, 0], 0.025, 0.15, [75, side * 90, 0]))); }
  else if (kind === 8) { parts.push(part("魔芋花葶", "cylinder", "#a9ae88", [0, 0.35, 0], [0.06, 0.7, 0.06]), cap("深杯状佛焰苞", "#b29d9d", [0, 0.6, 0], 0.28, 0.5, 3), part("高大肉穗花序", "cone", "#bfb99a", [0, 1.18, 0], [0.14, 0.7, 0.14])); }
  else if (kind === 9) { parts.push(petals(5, [0, 0.04, 0], 0.28, 0.38, 80, "#b69b8c"), cap("大王花中央花盘腔", "#ac8d7c", [0, 0.04, 0], 0.16, 0.15, 3)); for (let i = 0; i < 20; i++) { const a = i * 2.4; parts.push(lobe("肉质花瓣斑瘤", "#d3c3a5", [Math.cos(a) * 0.25, 0.075, Math.sin(a) * 0.25], [0.025, 0.01, 0.025])); } }
  else if (kind === 10) { parts.push(beam("槲寄生二叉基枝", "#a3a37b", [0, 0, 0], [0, 0.25, 0], 0.018)); for (const side of [-1, 1]) { const p: Triple = [side * 0.15, 0.45, 0]; parts.push(beam("槲寄生等长叉枝", "#a3a37b", [0, 0.2, 0], p, 0.012), leaf("对生厚叶", green, p, 0.045, 0.13, [35, side * 90, 0]), leaf("对生厚叶", green, p, 0.045, 0.13, [35, -side * 90, 0]), lobe("白色黏质浆果", "#d4d6bd", [p[0], p[1] - 0.025, 0.02], [0.022, 0.023, 0.022])); } }
  else if (kind === 11) { for (let i = 0; i < 7; i++) parts.push(tube("菟丝子无叶缠绕茎", "#bdb17e", Array.from({ length: 13 }, (_, j) => { const a = j * Math.PI / 3 + i; const r = 0.08 + i % 3 * 0.035; return [Math.cos(a) * r, j * 0.018, Math.sin(a) * r] as Triple; }), 0.003)); }
  else if (kind === 12) { for (let i = 0; i < 12; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.1, 0.7, Math.sin(a) * 0.1]; parts.push(tube("松萝下垂丝状体", "#a7b6a0", [p, [p[0] * 0.8, 0.4, p[2]], [p[0] * 1.3, 0.1 + i % 3 * 0.06, p[2] * 1.3]], 0.003), leaf("松萝细分枝", "#a7b6a0", [p[0], 0.45, p[2]], 0.006, 0.25, [150, i * 30, 0])); } }
  else if (kind === 13) { parts.push(radialLeaves(16, [0, 0.04, 0], 0.012, 0.3, 45, "#a8b7a1"), beam("空气凤梨花轴", stem, [0, 0.04, 0], [0, 0.25, 0], 0.006), petals(7, [0, 0.22, 0], 0.025, 0.1, 15, "#baabb4")); }
  else if (kind === 14) { for (let layer = 0; layer < 4; layer++) for (let i = 0; i < 7; i++) { const a = (i + layer * 0.45) * Math.PI * 2 / 7; parts.push(lobe("石莲花匙形肉质叶", "#a7baa1", [Math.cos(a) * (0.08 - layer * 0.017), 0.025 + layer * 0.018, Math.sin(a) * (0.08 - layer * 0.017)], [0.045 - layer * 0.005, 0.017, 0.08 - layer * 0.014], [15 + layer * 10, -a * 180 / Math.PI, 0])); } }
  else if (kind === 15) { for (let strand = 0; strand < 4; strand++) { const x = (strand - 1.5) * 0.04; parts.push(tube("珍珠吊兰细茎", "#9db082", [[x, 0.4, 0], [x + 0.025, 0.2, 0], [x, 0.02, 0.02]], 0.002)); for (let i = 0; i < 10; i++) parts.push(lobe("圆珠状叶", "#a4b890", [x + Math.sin(i * 0.4) * 0.02, 0.04 + i * 0.035, 0], [0.024, 0.025, 0.024])); } }
  else if (kind === 16) { for (let strand = 0; strand < 3; strand++) { const x = (strand - 1) * 0.055; parts.push(tube("玉缀下垂茎", "#a1ad89", [[x, 0.35, 0], [x + 0.015, 0.18, 0], [x, 0.025, 0]], 0.007)); for (let i = 0; i < 18; i++) { const a = i * 2.4; parts.push(lobe("密排梭形肉质叶", "#b2c09c", [x + Math.cos(a) * 0.018, 0.03 + i * 0.018, Math.sin(a) * 0.018], [0.022, 0.033, 0.02], [15, -a * 180 / Math.PI, 0])); } } }
  else if (kind === 17) { for (const side of [-1, 1]) { parts.push(beam("鱼骨令箭扁茎中脉", green, [0, 0, 0], [side * 0.14, 0.4, 0], 0.009)); for (let i = 0; i < 7; i++) parts.push(leaf("鱼骨状锯齿茎裂片", "#98ae83", [side * i * 0.018, i * 0.05, 0], 0.055, 0.085, [5, 0, side * (i % 2 ? 40 : -40)])); } parts.push(petals(16, [0.14, 0.4, 0], 0.025, 0.16, 60, cream), petals(6, [0.14, 0.42, 0], 0.035, 0.08, 35, cream)); }
  else { for (const side of [-1, 1]) { for (let i = 0; i < 5; i++) parts.push(leaf("蟹爪兰扁平节片", "#99ae87", [side * i * 0.035, 0.06 + i * 0.035, 0], 0.035, 0.075, [0, 0, -side * 45])); const p: Triple = [side * 0.18, 0.23, 0]; parts.push(tube("蟹爪兰下垂花筒", pink, [p, [p[0] + side * 0.03, 0.2, 0], [p[0] + side * 0.035, 0.15, 0]], 0.014), petals(6, [p[0] + side * 0.035, 0.15, 0], 0.022, 0.06, 140, pink)); } }
  return parts;
}

const ancients = [["moss", "苔藓"], ["liverwort", "地钱"], ["hornwort", "角苔"], ["clubmoss", "石松"], ["horsetail", "木贼"], ["selaginella", "卷柏"], ["cycad", "苏铁"], ["treeFern", "桫椤"], ["welwitschia", "百岁兰"], ["ginseng", "人参"]];
const vines = [["wisteria", "紫藤"], ["ivy", "常春藤"], ["bougainvillea", "三角梅"], ["clematis", "铁线莲"], ["passionFlower", "西番莲"], ["fuchsia", "倒挂金钟"], ["bleedingHeart", "荷包牡丹"], ["snapdragon", "金鱼草"], ["foxglove", "毛地黄"], ["hollyhock", "蜀葵"], ["delphinium", "飞燕草"], ["gladiolus", "唐菖蒲"]];
const flowerNames = [["iris", "鸢尾"], ["daffodil", "水仙"], ["cyclamen", "仙客来"], ["pansy", "三色堇"], ["geranium", "天竺葵"], ["begonia", "秋海棠"], ["anthurium", "红掌"], ["poinsettia", "一品红"], ["hibiscus", "扶桑"], ["peony", "牡丹"], ["camellia", "山茶"], ["magnolia", "玉兰"], ["protea", "帝王花"], ["banksia", "佛塔花"], ["bottlebrush", "红千层"], ["heliconia", "蝎尾蕉"], ["gingerLily", "姜花"], ["canna", "美人蕉"], ["torchGinger", "火炬姜"]];
const herbNames = [["scabiosa", "蓝盆花"], ["echinacea", "松果菊"], ["allium", "观赏葱"], ["agapanthus", "百子莲"], ["salvia", "鼠尾草"], ["rosemary", "迷迭香"], ["thyme", "百里香"], ["mint", "薄荷"], ["marigold", "万寿菊"], ["cosmos", "波斯菊"]];
const specials = [["antlerFern", "鹿角蕨"], ["birdNestFern", "鸟巢蕨"], ["sundew", "圆叶茅膏菜"], ["cobraLily", "眼镜蛇瓶子草"], ["sarracenia", "瓶子草"], ["bladderwort", "狸藻"], ["butterwort", "捕虫堇"], ["slipperOrchid", "兜兰"], ["dragonArum", "魔芋"], ["rafflesia", "大王花"], ["mistletoe", "槲寄生"], ["dodder", "菟丝子"], ["spanishMoss", "松萝"], ["tillandsia", "空气凤梨"], ["echeveria", "石莲花"], ["stringOfPearls", "珍珠吊兰"], ["burroTail", "玉缀"], ["fishboneCactus", "鱼骨令箭"], ["christmasCactus", "蟹爪兰"]];

export const extraFloraDesigns: MasterNatureDesign[] = [
  ...ancients.map(([key, name], index) => design(key!, name!, "植物", () => ancient(index), ["孢子与古老植物形态"])),
  ...vines.map(([key, name], index) => design(key!, name!, "植物", () => vinesAndSpikes(index), ["藤蔓与穗序"])),
  ...flowerNames.map(([key, name], index) => design(key!, name!, "植物", () => flowers(index), ["花冠与苞序"])),
  ...herbNames.map(([key, name], index) => design(key!, name!, "植物", () => herbs(index), ["草本"])),
  ...specials.map(([key, name], index) => design(key!, name!, "植物", () => special(index), ["特殊叶器官", ...(key === "sundew" ? ["Drosera rotundifolia"] : [])])),
];
