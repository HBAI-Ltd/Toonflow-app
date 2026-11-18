import { design, eyes, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { membrane } from "./animals";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const skin = "#a6b3a0";
const finColor = "#b7c2aa";
const pale = "#c6c9b0";

function tail(parts: ModelPart[], z: number, y: number, span: number) {
  parts.push(tapered("齿鲸扁侧尾柄与尾叶的连续连接", skin, [[0, y + 0.03, z + 0.25], [0, y, z]], [0.11, 0.075]));
  for (const side of [-1, 1]) parts.push(membrane("齿鲸水平展开且中央保留尾叶缺刻的半尾叶", finColor, [[0, y, z + 0.04], [side * span * 0.8, y + 0.025, z - 0.15], [side * span, y + 0.01, z - 0.4], [side * span * 0.36, y - 0.012, z - 0.32], [side * 0.025, y - 0.01, z - 0.15]]));
}

function longFinnedPilot(): ModelPart[] {
  const parts: ModelPart[] = [body("长肢领航鲸粗前体与渐细长尾柄的实际截面", [[-2.1, 0.72, 0.075, 0.075], [-1.4, 0.76, 0.22, 0.24], [-0.35, 0.82, 0.41, 0.43], [0.72, 0.84, 0.49, 0.52], [1.52, 0.85, 0.36, 0.4], [1.94, 0.83, 0.22, 0.23]], skin), lobe("领航鲸真正隆在短口鼻上方的球形额隆", skin, [0, 1.02, 1.64], [0.79, 0.78, 0.94]), tapered("领航鲸几乎没有外伸吻的短下颌", pale, [[0, 0.72, 1.58], [0, 0.73, 2.03]], [0.22, 0.12]), ...eyes([0, 0.86, 1.59], 0.31, 0.045)];
  parts.push(membrane("领航鲸位于身体前半且根部宽阔的镰形背鳍", finColor, [[0, 1.24, 0.95], [0, 1.86, 0.58], [0, 1.98, 0.1], [0, 1.59, 0.22], [0, 1.3, -0.4], [0, 1.17, -0.5]]));
  for (const side of [-1, 1]) parts.push(membrane("长肢领航鲸有明显肘弯且超过一米的狭长胸鳍", finColor, [[side * 0.34, 0.78, 1.05], [side * 0.94, 0.48, 0.8], [side * 1.55, 0.25, -0.13], [side * 1.12, 0.4, 0.11], [side * 0.56, 0.62, 0.46], [side * 0.31, 0.72, 0.76]]));
  tail(parts, -2.3, 0.72, 0.85); return parts;
}

function beakedBody(): ModelPart {
  const sections: [number, number, number, number, number][] = [[-2.5, 0.7, 0.07, 0.07, 0], [-1.7, 0.75, 0.22, 0.25, 0], [-0.5, 0.8, 0.45, 0.48, 0], [0.7, 0.84, 0.52, 0.5, 0.4], [1.3, 0.84, 0.43, 0.42, 1], [1.82, 0.85, 0.29, 0.3, 1], [2.16, 0.8, 0.14, 0.15, 0.6], [2.4, 0.77, 0.045, 0.045, 0]], angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 249, 252, 255, 270, 285, 288, 291, 300, 330], count = angles.length;
  const vertices = sections.flatMap(([z, y, width, height, groove]) => angles.map(angle => { const a = angle * Math.PI / 180; return { x: Math.cos(a) * width, y: y + Math.sin(a) * height + (angle === 252 || angle === 288 ? groove * 0.026 : 0), z }; })), indices: number[] = [];
  for (let row = 0; row < sections.length - 1; row++) for (let i = 0; i < count; i++) { const a = row * count + i, b = row * count + (i + 1) % count; indices.push(a, b, a + count, b, b + count, a + count); }
  for (let i = 1; i < count - 1; i++) indices.push(0, i + 1, i, (sections.length - 1) * count, (sections.length - 1) * count + i, (sections.length - 1) * count + i + 1);
  return part("柯氏喙鲸圆壮躯体和实际凹入皮面的两条喉沟", "mesh", skin, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function cuviersBeaked(): ModelPart[] {
  const parts: ModelPart[] = [beakedBody(), tapered("柯氏喙鲸朝前上方微翘的独立下颌", pale, [[0, 0.68, 1.94], [0, 0.695, 2.28], [0, 0.74, 2.43]], [0.11, 0.065, 0.032]), ...eyes([0, 0.87, 1.72], 0.245, 0.035)];
  for (const side of [-1, 1]) { parts.push(pointed("雄柯氏喙鲸只在下颌尖端伸出的两枚齿", pale, [[side * 0.018, 0.742, 2.38], [side * 0.018, 0.781, 2.397]], [0.011, 0]), membrane("柯氏喙鲸躯侧较小且可收拢的窄胸鳍", finColor, [[side * 0.38, 0.72, 1.1], [side * 0.78, 0.45, 0.76], [side * 0.85, 0.35, 0.42], [side * 0.59, 0.54, 0.56], [side * 0.34, 0.67, 0.87]])); }
  parts.push(membrane("柯氏喙鲸明显位于躯干后段的小镰形背鳍", finColor, [[0, 0.95, -1.8], [0, 1.02, -1.39], [0, 1.58, -1.54], [0, 1.44, -1.12], [0, 1.14, -0.87]]));
  tail(parts, -2.72, 0.7, 0.86); return parts;
}

export const toothedWhaleDesigns: MasterNatureDesign[] = [
  design("longFinnedPilotWhale", "长肢领航鲸", "动物", longFinnedPilot, ["Globicephala melas", "球额宽根前背鳍与长肘弯胸鳍"]),
  design("cuviersBeakedWhale", "柯氏喙鲸", "动物", cuviersBeaked, ["Ziphius cavirostris", "短喙双颌尖齿与凹入双喉沟"]),
];
