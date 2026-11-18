import { beam, cap, combineMeshes, design, eyes, leaf, legs, lobe, needle, part, petals, tapered, tube } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";
import { rayFin, tail } from "./marine";

const hide = "#a6af90";
const light = "#c3c8a8";
const armor = "#98a58b";

function toes(parts: ModelPart[], root: Triple, spread: number, length: number) {
  for (const side of [-1, 0, 1]) parts.push(needle("三趾爪", "#cbd0b2", root, [root[0] + side * spread, root[1], root[2] + length], spread * 0.45));
}

function biped(parts: ModelPart[], hipY: number, spread: number, length: number) {
  for (const side of [-1, 1]) { const hip: Triple = [side * spread, hipY, -0.15]; const knee: Triple = [side * spread * 1.3, hipY * 0.58, 0.1]; const ankle: Triple = [side * spread, 0.09, -0.1]; parts.push(tapered("后肢股骨与小腿", hide, [hip, knee, ankle], [spread * 0.55, spread * 0.4, spread * 0.18])); toes(parts, [ankle[0], 0.06, 0.02], spread * 0.35, length); }
}

function skull(parts: ModelPart[], root: Triple, width: number, height: number, length: number, teeth = false) {
  parts.push(lobe("头颅与吻", hide, root, [width, height, length]), ...eyes([root[0], root[1] + height * 0.16, root[2] + length * 0.18], width * 0.36, width * 0.08));
  if (teeth) for (const side of [-1, 1]) for (let i = 0; i < 7; i++) parts.push(needle("上颌牙列", "#d4cfb4", [root[0] + side * width * 0.27, root[1] - height * 0.08, root[2] + i * length * 0.06], [root[0] + side * width * 0.27, root[1] - height * 0.27, root[2] + i * length * 0.06], width * 0.045));
}

function cambrian(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) { parts.push(tapered("奇虾长椭圆分节体", "#a9b69c", [[0, 0.11, 0.26], [0, 0.1, 0], [0, 0.07, -0.24]], [0.08, 0.1, 0.025]), cap("腹面环形口器", "#c3c6a5", [0, 0.02, 0.18], 0.045, 0.025, 3)); for (const side of [-1, 1]) { parts.push(beam("眼柄", armor, [side * 0.035, 0.15, 0.2], [side * 0.11, 0.18, 0.24], 0.012), lobe("巨大复眼", "#788e7d", [side * 0.11, 0.18, 0.24], [0.045, 0.035, 0.035]), tapered("前端分节捕食附肢", "#b9b895", [[side * 0.045, 0.08, 0.22], [side * 0.08, 0.04, 0.35], [side * 0.05, 0.12, 0.43]], [0.02, 0.017, 0.004])); for (let i = 0; i < 9; i++) parts.push(leaf("连续侧向游泳叶", "#b9c2a4", [side * 0.045, 0.08, 0.17 - i * 0.045], 0.065, 0.12 - i * 0.004, [80, -side * 95, 0])); } }
  else if (kind === 1) { parts.push(tapered("欧巴宾海蝎分节体", "#b2b99b", [[0, 0.06, 0.13], [0, 0.05, 0], [0, 0.04, -0.13]], [0.04, 0.055, 0.02]), tube("前端长抓取吻", "#bbc3a1", [[0, 0.055, 0.15], [0.015, 0.03, 0.25], [0, 0.06, 0.32]], 0.012)); for (let i = 0; i < 5; i++) { const p: Triple = [(i - 2) * 0.018, 0.11 - Math.abs(i - 2) * 0.008, 0.12 + i % 2 * 0.02]; parts.push(beam("五眼眼柄", armor, [p[0], 0.075, 0.11], p, 0.005), lobe("眼", "#7f947d", p, [0.013, 0.014, 0.013])); } for (const side of [-1, 1]) { for (let i = 0; i < 8; i++) parts.push(leaf("体侧叶片", light, [side * 0.03, 0.04, 0.1 - i * 0.03], 0.025, 0.07, [85, -side * 90, 0])); parts.push(needle("吻端夹器", "#c6c7a4", [0, 0.06, 0.32], [side * 0.018, 0.07, 0.345], 0.008)); } }
  else if (kind === 2) { parts.push(tube("怪诞虫细长躯", "#a8b699", [[0, 0.045, -0.1], [0, 0.05, 0], [0, 0.045, 0.11]], 0.012)); for (const side of [-1, 1]) for (let i = 0; i < 7; i++) parts.push(needle("背部硬刺", "#c0c7a6", [side * 0.008, 0.056, -0.075 + i * 0.027], [side * 0.025, 0.12, -0.08 + i * 0.027], 0.008), tapered("细长成对叶足", hide, [[side * 0.008, 0.044, -0.075 + i * 0.027], [side * 0.02, 0.02, -0.075 + i * 0.027], [side * 0.035, 0.003, -0.075 + i * 0.027]], [0.006, 0.004, 0.002])); }
  else if (kind === 3) { parts.push(lobe("威瓦西虫覆甲软体", "#b1b899", [0, 0.04, 0], [0.12, 0.08, 0.15]), combineMeshes("叠覆背部硬鳞片", "#c4c6a4", Array.from({ length: 27 }, (_, i) => leaf("鳞片", "#c4c6a4", [(i % 3 - 1) * 0.035, 0.05 + (i % 3 === 1 ? 0.015 : 0), -0.06 + Math.floor(i / 3) * 0.015], 0.035, 0.04, [55, 0, 0])))); for (const side of [-1, 1]) for (let i = 0; i < 5; i++) parts.push(needle("成列长背棘", "#a9b595", [side * 0.03, 0.055, -0.04 + i * 0.025], [side * 0.06, 0.16, -0.055 + i * 0.025], 0.012)); }
  else if (kind === 4) { parts.push(lobe("马尔拉虫小型头盾", "#b8c3a3", [0, 0.035, 0.06], [0.045, 0.03, 0.045]), tapered("马尔拉虫狭长后体", "#a9b89a", [[0, 0.025, 0.05], [0, 0.025, -0.07]], [0.018, 0.005])); for (const side of [-1, 1]) { parts.push(tapered("头盾后伸长角", light, [[side * 0.012, 0.035, 0.07], [side * 0.07, 0.04, -0.01], [side * 0.035, 0.045, -0.11]], [0.009, 0.005, 0.001]), needle("头盾前外侧角", light, [side * 0.015, 0.035, 0.07], [side * 0.065, 0.04, 0.11], 0.008)); for (let i = 0; i < 12; i++) parts.push(needle("细长分节附肢", hide, [side * 0.01, 0.02, 0.04 - i * 0.009], [side * 0.05, 0.006, 0.045 - i * 0.009], 0.003)); } }
  else { parts.push(tapered("皮卡虫侧扁脊索体", "#b6c5aa", [[-0.12, 0.025, 0], [0, 0.03, 0], [0.12, 0.025, 0]], [0.006, 0.018, 0.003]), beam("背侧脊索", "#d0d5ba", [-0.1, 0.04, 0], [0.1, 0.04, 0], 0.002)); for (let i = 0; i < 18; i++) parts.push(needle("V形肌节", "#9aaf91", [-0.1 + i * 0.011, 0.037, 0], [-0.105 + i * 0.011, 0.014, 0.006], 0.002)); }
  return parts;
}

function earlyAnimals(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) { parts.push(lobe("邓氏鱼厚重头甲", armor, [0, 0.4, 0.8], [1.05, 0.8, 1.2]), tapered("无甲柔性后躯", hide, [[0, 0.35, 0.5], [0, 0.35, -0.6], [0, 0.25, -1.5]], [0.4, 0.25, 0.03]), ...eyes([0, 0.54, 1], 0.38, 0.085), ...tail([0, 0.25, -1.5], 0.45, true)); for (const side of [-1, 1]) parts.push(needle("刀刃状颌骨齿板", "#cbd0b0", [side * 0.17, 0.3, 1.15], [side * 0.12, 0.16, 1.48], 0.18), rayFin("侧胸鳍", [side * 0.25, 0.2, 0.45], [side * 0.86, 0.08, -0.1], 0.5)); }
  else if (kind === 1) { parts.push(lobe("旋齿鲨梭形主躯", hide, [0, 0.3, 0], [0.5, 0.48, 1.8]), ...eyes([0, 0.38, 0.65], 0.17, 0.05), ...tail([0, 0.3, -0.95], 0.45, true)); for (const side of [-1, 1]) parts.push(rayFin("大胸鳍", [side * 0.13, 0.2, 0.3], [side * 0.62, 0.09, -0.1], 0.4)); parts.push(tube("下颌螺旋齿列基轴", "#c3c5a5", Array.from({ length: 21 }, (_, i) => { const a = i * Math.PI / 5; const r = 0.025 + i / 20 * 0.15; return [0, 0.22 + Math.sin(a) * r, 0.73 + Math.cos(a) * r] as Triple; }), 0.012)); for (let i = 0; i < 18; i++) { const a = i * Math.PI / 5; const r = 0.025 + i / 20 * 0.15; parts.push(needle("旋列独立三角齿", "#ddd6bc", [0, 0.22 + Math.sin(a) * r, 0.73 + Math.cos(a) * r], [0, 0.22 + Math.sin(a) * (r + 0.045), 0.73 + Math.cos(a) * (r + 0.045)], 0.02)); } }
  else if (kind === 2) { parts.push(part("直角石分室长锥壳", "lathe", "#c4c7a9", [0, 0.3, -0.2], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -0.7 }, { x: 0.025, y: -0.6 }, { x: 0.16, y: 0.6 }, { x: 0.14, y: 0.6 }, { x: 0.012, y: -0.6 }] }), lobe("壳口露出软体", "#a9b99b", [0, 0.3, 0.45], [0.25, 0.25, 0.2]), ...eyes([0, 0.37, 0.5], 0.085, 0.045)); for (let i = 0; i < 10; i++) parts.push(tube("头部前伸腕", hide, [[0, 0.3, 0.49], [Math.sin(i) * 0.15, 0.24, 0.7], [Math.sin(i + 0.3) * 0.2, 0.1, 0.88]], 0.015)); }
  else if (kind === 3) { parts.push(lobe("板足鲎宽扁头甲", armor, [0, 0.14, 0.36], [0.5, 0.18, 0.46]), tapered("长分节后体", hide, [[0, 0.1, 0.25], [0, 0.08, -0.35], [0, 0.06, -0.72]], [0.19, 0.15, 0.035]), needle("尾剑", light, [0, 0.06, -0.7], [0, 0.03, -1.12], 0.06), ...eyes([0, 0.22, 0.43], 0.17, 0.055)); for (const side of [-1, 1]) { parts.push(rayFin("后部宽游泳桨肢", [side * 0.15, 0.09, 0.13], [side * 0.57, 0.05, -0.12], 0.2)); for (let i = 0; i < 4; i++) parts.push(beam("细长前附肢", hide, [side * 0.12, 0.11, 0.25 + i * 0.035], [side * 0.4, 0.025, 0.3 + i * 0.065], 0.018)); } }
  else if (kind === 4) { parts.push(lobe("双臼椎龙蝾螈形躯", hide, [0, 0.09, 0], [0.16, 0.13, 0.45]), membrane("头甲蝾螈回旋镖头盾", "#bdc5a4", [[0, 0.12, 0.23], [-0.22, 0.1, 0.06], [-0.14, 0.11, 0.23], [0, 0.11, 0.32], [0.14, 0.11, 0.23], [0.22, 0.1, 0.06]]), tapered("长尾", hide, [[0, 0.09, -0.18], [0.04, 0.06, -0.4], [0.09, 0.02, -0.57]], [0.04, 0.025, 0.002])); for (const side of [-1, 1]) for (const z of [-0.09, 0.1]) parts.push(beam("短外展肢", hide, [side * 0.05, 0.07, z], [side * 0.16, 0.02, z + 0.035], 0.025)); }
  else { parts.push(lobe("异齿龙低伏合弓躯", hide, [0, 0.45, 0], [0.65, 0.7, 1.6]), tapered("渐细长尾", hide, [[0, 0.45, -0.65], [0, 0.2, -1.3], [0.2, 0.04, -2]], [0.17, 0.09, 0.002])); skull(parts, [0, 0.55, 0.9], 0.43, 0.48, 0.65, true); for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(tapered("侧展承重四肢", hide, [[side * 0.2, 0.44, end * 0.45], [side * 0.45, 0.26, end * 0.5], [side * 0.5, 0.04, end * 0.55]], [0.1, 0.07, 0.04])); parts.push(membrane("连续背部神经棘帆", "#bdc09a", Array.from({ length: 11 }, (_, i) => [0, 0.6 + Math.sin(i / 10 * Math.PI) * 1.15, -0.65 + i * 0.14] as Triple))); for (let i = 0; i < 9; i++) parts.push(beam("背帆支撑神经棘", armor, [0, 0.58, -0.52 + i * 0.14], [0, 0.6 + Math.sin((i + 1) / 10 * Math.PI) * 1.15, -0.52 + i * 0.14], 0.015)); }
  return parts;
}

function dinosaurs(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind < 3) {
    parts.push(lobe(kind === 0 ? "剑龙拱背长躯" : kind === 1 ? "甲龙低宽装甲躯" : "三角龙厚实主躯", hide, [0, kind === 1 ? 0.7 : 1.1, 0], kind === 0 ? [1.6, 1.9, 3.5] : kind === 1 ? [2.2, 1.25, 3.5] : [1.7, 1.85, 3.6]));
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(tapered("粗壮四肢", hide, [[side * 0.52, kind === 1 ? 0.65 : 1, end * 0.95], [side * 0.65, 0.45, end * 1.05], [side * 0.65, 0.09, end * 1.1]], [0.24, 0.2, 0.15]));
    parts.push(tapered("尾部", hide, [[0, 0.9, -1.5], [0, 0.6, -2.7], [0.5, 0.3, -4]], [0.35, 0.18, 0.03]));
    if (kind === 0) { skull(parts, [0, 0.75, 1.9], 0.45, 0.5, 0.9); for (let i = 0; i < 12; i++) parts.push(leaf("交错直立背板", "#bfc29d", [i % 2 ? 0.16 : -0.16, 1.75 - Math.abs(i - 5) * 0.08, -1.6 + i * 0.3], 0.62, 0.65 + Math.sin(i / 11 * Math.PI) * 0.55, [0, 90, i % 2 ? 8 : -8])); for (const side of [-1, 1]) for (const z of [-3.1, -3.55]) parts.push(needle("尾端成对长棘", light, [0.2, 0.45, z], [side * 0.95, 0.65, z - 0.15], 0.16)); }
    else if (kind === 1) { skull(parts, [0, 0.6, 1.75], 0.7, 0.45, 0.8); for (let i = 0; i < 24; i++) parts.push(lobe("嵌合多角骨甲", "#b9c29f", [(i % 4 - 1.5) * 0.42, 1.06 - Math.abs(i % 4 - 1.5) * 0.08, (Math.floor(i / 4) - 2.5) * 0.45], [0.55, 0.21, 0.57])); parts.push(lobe("骨质尾槌", "#b9c29f", [0.5, 0.3, -4], [1, 0.55, 0.75])); }
    else { skull(parts, [0, 0.95, 1.9], 1.05, 1, 1.5); parts.push(leaf("巨型骨质颈盾", "#b8c19c", [0, 1.2, 1.1], 2.1, 1.8, [0, 0, 0]), needle("鼻角", light, [0, 1.08, 2.5], [0, 1.8, 2.8], 0.27)); for (const side of [-1, 1]) parts.push(needle("眉部前伸长角", light, [side * 0.36, 1.35, 2], [side * 0.5, 2.3, 2.75], 0.29)); }
  } else if (kind < 10) {
    const massive = kind === 6; const therizino = kind === 9; const hipY = massive ? 2.3 : therizino ? 2.1 : kind === 5 ? 2 : kind === 7 ? 0.75 : 1.4;
    parts.push(lobe(therizino ? "镰刀龙深大腹部" : "兽脚与鸟脚主躯", hide, [0, hipY + 0.3, 0], massive ? [1.5, 1.8, 3] : therizino ? [1.8, 2.2, 2.1] : kind === 7 ? [0.4, 0.55, 0.95] : [0.95, 1.3, 1.8])); biped(parts, hipY, massive ? 0.5 : kind === 7 ? 0.15 : 0.35, massive ? 0.85 : kind === 7 ? 0.22 : 0.5);
    parts.push(tapered("平衡长尾", hide, [[0, hipY, -0.65], [0, hipY * 0.8, massive ? -2.8 : -1.8], [0.3, hipY * 0.5, massive ? -5 : -3]], [massive ? 0.5 : 0.25, massive ? 0.24 : 0.12, 0.015]));
    if (kind === 3) { parts.push(tapered("厚头龙上举细颈", hide, [[0, 1.7, 0.5], [0, 2.2, 0.75]], [0.18, 0.14])); skull(parts, [0, 2.27, 0.85], 0.45, 0.45, 0.65); parts.push(lobe("头顶厚骨圆穹", light, [0, 2.5, 0.75], [0.5, 0.42, 0.5])); }
    else if (kind === 4) { skull(parts, [0, 2, 0.95], 0.47, 0.62, 0.95); parts.push(lobe("鸭嘴状扁宽口鼻", light, [0, 1.8, 1.4], [0.5, 0.16, 0.5]), tapered("副栉龙后伸空腔冠", light, [[0, 2.22, 0.7], [0, 2.6, 0.2], [0, 2.72, -0.45]], [0.12, 0.09, 0.02])); }
    else if (kind === 5) { skull(parts, [0, 2.5, 1.25], 0.5, 0.55, 1.75, true); parts.push(membrane("棘龙背部连续高帆", "#bdc19d", [[0, 2.65, -1], [0, 3.75, -0.65], [0, 4.15, 0], [0, 3.65, 0.7], [0, 2.65, 0.9]])); }
    else if (kind === 6) { skull(parts, [0, 3.05, 1.65], 1.1, 1.25, 1.7, true); for (const side of [-1, 1]) parts.push(tapered("极短两指前肢", hide, [[side * 0.45, 2.65, 0.85], [side * 0.5, 2.3, 1], [side * 0.55, 2.25, 1.3]], [0.13, 0.08, 0.035])); }
    else if (kind === 7) { skull(parts, [0, 1.05, 0.65], 0.2, 0.24, 0.52, true); for (const side of [-1, 1]) { parts.push(tube("伶盗龙长抓握前肢", hide, [[side * 0.12, 0.95, 0.25], [side * 0.28, 0.75, 0.42], [side * 0.25, 0.7, 0.7]], 0.035), needle("后足抬起镰状第二趾", light, [side * 0.15, 0.09, 0.12], [side * 0.15, 0.29, 0.3], 0.035)); for (let i = 0; i < 6; i++) parts.push(leaf("前臂羽片", "#b5bea2", [side * 0.2, 0.8, 0.33 + i * 0.04], 0.035, 0.25, [-70, side * 90, 0])); } }
    else if (kind === 8) { skull(parts, [0, 2.1, 0.8], 0.36, 0.4, 0.43); parts.push(leaf("偷蛋龙高头冠", light, [0, 2.2, 0.72], 0.45, 0.48, [0, 90, 0]), needle("坚硬无齿喙", "#cbd0b0", [0, 2.05, 0.95], [0, 1.9, 1.2], 0.21)); for (const side of [-1, 1]) parts.push(leaf("羽毛覆盖的长前臂", "#b9c3a4", [side * 0.22, 1.8, 0.32], 0.25, 0.8, [55, side * 50, -side * 30])); }
    else { parts.push(tapered("镰刀龙上举长颈", hide, [[0, 2.7, 0.45], [0, 3.6, 0.6], [0, 4, 0.9]], [0.3, 0.19, 0.14])); skull(parts, [0, 4, 1], 0.32, 0.36, 0.5); for (const side of [-1, 1]) { parts.push(tapered("长前肢", hide, [[side * 0.55, 2.85, 0.6], [side * 0.9, 2, 0.8], [side * 0.85, 1.5, 1.2]], [0.2, 0.14, 0.1])); for (let claw = 0; claw < 3; claw++) parts.push(tapered("镰刀状巨爪", light, [[side * 0.85 + claw * 0.1, 1.5, 1.2], [side * 0.85 + claw * 0.1, 1.2, 1.7], [side * 0.85 + claw * 0.1, 0.85, 1.8]], [0.06, 0.04, 0.002])); } }
    if (kind === 3 || kind === 4 || kind === 5) for (const side of [-1, 1]) parts.push(beam("细短前肢", hide, [side * 0.28, hipY + 0.3, 0.4], [side * 0.45, hipY - 0.4, 0.9], 0.12));
  } else { parts.push(lobe("腕龙巨大胸腹", hide, [0, 2.4, 0], [2.4, 2.8, 5]), tapered("高耸长颈", hide, [[0, 3, 1.5], [0, 5, 2.4], [0, 7, 3], [0, 8, 3.6]], [0.65, 0.47, 0.3, 0.2]), tapered("腕龙渐细长尾", hide, [[0, 2.2, -2.1], [0, 1.4, -4.1], [0.5, 0.7, -6.5]], [0.6, 0.26, 0.02])); skull(parts, [0, 8.05, 3.85], 0.65, 0.65, 1); for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(tapered("柱状承重四肢", hide, [[side * 0.85, end > 0 ? 2.5 : 2, end * 1.5], [side * 0.9, 0.12, end * 1.6]], [0.45, 0.32])); }
  return parts;
}

function marineReptile(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) { parts.push(lobe("鱼龙海豚状躯", hide, [0, 0.5, 0], [0.85, 0.85, 2.5]), tapered("长尖齿吻", light, [[0, 0.48, 1], [0, 0.45, 1.65], [0, 0.44, 1.95]], [0.14, 0.07, 0.015]), ...eyes([0, 0.68, 0.97], 0.33, 0.11), ...tail([0, 0.45, -1.4], 0.7, true)); }
  else if (kind === 1) { parts.push(lobe("蛇颈龙宽椭圆躯", hide, [0, 0.5, 0], [1.4, 0.8, 2.2]), tapered("蛇颈龙超长细颈", hide, [[0, 0.55, 0.8], [0, 0.6, 2], [0, 0.8, 3.2], [0, 0.9, 4]], [0.26, 0.2, 0.14, 0.1])); skull(parts, [0, 0.92, 4.15], 0.3, 0.25, 0.5, true); parts.push(tapered("短尾", hide, [[0, 0.5, -0.9], [0, 0.3, -1.8]], [0.2, 0.01])); }
  else { parts.push(tapered("沧龙蜥形长躯", hide, [[0, 0.7, 1.9], [0, 0.7, 0], [0, 0.55, -2.4], [0.4, 0.3, -4]], [0.38, 0.6, 0.3, 0.05])); skull(parts, [0, 0.8, 2.2], 0.8, 0.7, 1.55, true); parts.push(...tail([0.4, 0.3, -4], 0.7, true)); }
  const spread = kind === 1 ? 1.7 : kind === 2 ? 1.5 : 1.1;
  for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(rayFin("四枚独立桨肢", [side * 0.35, 0.35, end * 0.6], [side * spread, 0.12, end * 0.6 - 0.6], kind === 1 ? 0.65 : 0.45, "#b8c3a2"));
  return parts;
}

function flying(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind < 2) { const span = kind === 0 ? 2.6 : 0.65; const h = kind === 0 ? 1 : 0.35; parts.push(lobe("翼龙窄躯", hide, [0, h, 0], [span * 0.18, span * 0.24, span * 0.35]), tapered("翼龙细长颈", hide, [[0, h + span * 0.1, span * 0.1], [0, h + span * 0.35, span * 0.3]], [span * 0.04, span * 0.025])); skull(parts, [0, h + span * 0.35, span * 0.42], span * 0.09, span * 0.1, span * 0.34, kind === 1); for (const side of [-1, 1]) { const shoulder: Triple = [side * span * 0.06, h + span * 0.13, 0]; const wrist: Triple = [side * span * 0.45, h + span * 0.25, span * 0.05]; const tip: Triple = [side * span, h + span * 0.1, -span * 0.2]; parts.push(beam("翼龙上臂与前臂", hide, shoulder, wrist, span * 0.025), beam("延长第四翼指", "#b7c09f", wrist, tip, span * 0.015), membrane("单翼指支撑完整翼膜", "#c1c7a6", [shoulder, wrist, tip, [side * span * 0.23, h - span * 0.12, -span * 0.2], [side * span * 0.05, h - span * 0.08, -span * 0.14]]), beam("后肢", hide, [side * span * 0.04, h - span * 0.1, -span * 0.05], [side * span * 0.15, 0.05, -span * 0.18], span * 0.025)); }
    if (kind === 0) parts.push(needle("无齿翼龙后伸头冠", "#b9c19f", [0, h + span * 0.39, span * 0.33], [0, h + span * 0.58, -span * 0.08], span * 0.13));
    else parts.push(tapered("喙嘴翼龙长尾", hide, [[0, h - 0.05, -0.15], [0, h - 0.1, -0.6], [0, h - 0.15, -0.95]], [0.025, 0.012, 0.002]), leaf("尾端菱形膜片", light, [0, h - 0.15, -0.9], 0.15, 0.22, [-90, 0, 0]));
  } else { parts.push(lobe("羽恐龙轻型躯", hide, [0, 0.25, 0], [0.15, 0.2, 0.3]), tapered("羽恐龙长骨质尾", hide, [[0, 0.25, -0.12], [0, 0.2, -0.36], [0, 0.17, -0.53]], [0.025, 0.012, 0.002])); skull(parts, [0, 0.4, 0.21], 0.1, 0.11, 0.18, true); for (const side of [-1, 1]) { parts.push(beam("伸展前肢", hide, [side * 0.045, 0.32, 0.04], [side * 0.26, 0.29, 0], 0.015), beam("后肢", hide, [side * 0.04, 0.2, -0.06], [side * 0.11, 0.03, -0.02], 0.018)); for (let i = 0; i < 8; i++) parts.push(leaf("前肢初级飞羽", "#bfc7aa", [side * (0.06 + i * 0.024), 0.3, 0], 0.035, 0.23 - i * 0.01, [-80, side * 20, 0])); if (kind === 3) for (let i = 0; i < 6; i++) parts.push(leaf("小盗龙后肢独立飞羽", "#bfc7aa", [side * 0.09, 0.08, -0.04 + i * 0.016], 0.026, 0.21, [-80, side * 40, 0])); } for (let i = 0; i < 10; i++) parts.push(leaf("长尾两侧羽片", light, [0, 0.22 - i * 0.005, -0.2 - i * 0.025], 0.023, 0.15, [-90, i % 2 ? 70 : -70, 0])); }
  return parts;
}

const cambrianNames = [["anomalocaris", "奇虾"], ["opabinia", "欧巴宾海蝎"], ["hallucigenia", "怪诞虫"], ["wiwaxia", "威瓦西虫"], ["marrella", "马尔拉虫"], ["pikaia", "皮卡虫"]];
const earlyNames = [["dunkleosteus", "邓氏鱼"], ["helicoprion", "旋齿鲨"], ["orthoceras", "直角石"], ["eurypterid", "板足鲎"], ["diplocaulus", "头甲蝾螈"], ["dimetrodon", "异齿龙"]];
const dinosaurNames = [["stegosaurus", "剑龙"], ["ankylosaurus", "甲龙"], ["triceratops", "三角龙"], ["pachycephalosaurus", "厚头龙"], ["parasaurolophus", "副栉龙"], ["spinosaurus", "棘龙"], ["tyrannosaurus", "霸王龙"], ["velociraptor", "伶盗龙"], ["oviraptor", "偷蛋龙"], ["therizinosaurus", "镰刀龙"], ["brachiosaurus", "腕龙"]];
const marineNames = [["ichthyosaurus", "鱼龙"], ["plesiosaurus", "蛇颈龙"], ["mosasaurus", "沧龙"]];
const flyingNames = [["pteranodon", "无齿翼龙"], ["rhamphorhynchus", "喙嘴翼龙"], ["archaeopteryx", "始祖鸟"], ["microraptor", "小盗龙"]];

export const prehistoricDesigns: MasterNatureDesign[] = [
  ...cambrianNames.map(([key, name], index) => design(key!, name!, "动物", () => cambrian(index), ["寒武纪形态复原"])),
  ...earlyNames.map(([key, name], index) => design(key!, name!, "动物", () => earlyAnimals(index), ["古生物形态复原"])),
  ...dinosaurNames.map(([key, name], index) => design(key!, name!, "动物", () => dinosaurs(index), ["恐龙形态复原"])),
  ...marineNames.map(([key, name], index) => design(key!, name!, "动物", () => marineReptile(index), ["古海生爬行类"])),
  ...flyingNames.map(([key, name], index) => design(key!, name!, "动物", () => flying(index), ["古飞行形态"])),
];
