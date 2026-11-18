import { combineMeshes, design, leaf, lobe, needle, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { fourFeet, hand, head } from "./mammalForms";
import { pointed } from "./insectForms";
import { hollowPipe } from "./shapedFoods";

const fur = "#a6b097";
const pale = "#c3c6a8";
const dark = "#8e9b85";

function springhare(): ModelPart[] {
  const parts: ModelPart[] = [lobe("跳兔前胸窄而后躯较厚的斜坐躯", fur, [0, 0.19, 0], [0.2, 0.29, 0.27], [14, 0, 0]), tapered("跳兔粗短颈实际承接短头", fur, [[0, 0.27, 0.07], [0, 0.32, 0.12]], [0.045, 0.038])]; head(parts, [0, 0.345, 0.15], [0.12, 0.135, 0.14], 0.025, "none");
  for (const side of [-1, 1]) {
    parts.push(leaf("跳兔长约八厘米的直立耳廓", pale, [side * 0.037, 0.388, 0.12], 0.035, 0.082, [-8, side * 12, -side * 12]), lobe("跳兔耳基阻挡细沙的耳屏", dark, [side * 0.035, 0.385, 0.13], [0.016, 0.022, 0.012]), lobe("跳兔肌肉粗大的跃起后股", fur, [side * 0.072, 0.125, -0.035], [0.12, 0.17, 0.15]), tapered("跳兔膝后弯折的细长后胫", fur, [[side * 0.09, 0.13, -0.035], [side * 0.113, 0.065, -0.075], [side * 0.095, 0.018, 0.01]], [0.028, 0.018, 0.012]), lobe("跳兔真正延长的跗蹠足掌", fur, [side * 0.095, 0.017, 0.063], [0.048, 0.027, 0.15]), tapered("跳兔悬在胸前且明显短小的前肢", fur, [[side * 0.052, 0.27, 0.04], [side * 0.07, 0.19, 0.12], [side * 0.065, 0.16, 0.14]], [0.02, 0.013, 0.009])); hand(parts, [side * 0.065, 0.16, 0.14], 0.025);
    const toes: ModelPart[] = []; for (let i = 0; i < 4; i++) toes.push(pointed("跳兔后足四枚末端近蹄状的独立宽甲", pale, [[side * 0.095 + (i - 1.5) * 0.011, 0.014, 0.112], [side * 0.095 + (i - 1.5) * 0.012, 0.01, 0.14]], [0.0045, 0])); parts.push(combineMeshes("跳兔后足真实分开的四趾", pale, toes));
  }
  parts.push(tapered("跳兔与躯干等长的粗毛平衡尾", pale, [[0, 0.135, -0.08], [0.06, 0.07, -0.24], [0.15, 0.035, -0.43], [0.24, 0.04, -0.47]], [0.025, 0.037, 0.045, 0.02])); return parts;
}

function streakedTenrec(): ModelPart[] {
  const parts: ModelPart[] = [lobe("低地条纹马岛猬狭长而非刺猬圆球的躯", fur, [0, 0.042, 0], [0.054, 0.059, 0.123]), tapered("马岛猬头部向前连续变细的长吻", fur, [[0, 0.047, 0.045], [0, 0.047, 0.073], [0, 0.035, 0.103]], [0.022, 0.015, 0.0035])]; head(parts, [0, 0.047, 0.056], [0.04, 0.037, 0.045], 0, "none"); fourFeet(parts, [0, 0.034, 0.03], [0, 0.033, -0.032], 0.018, 0.006);
  const quills: ModelPart[] = [];
  for (let i = 0; i < 48; i++) { const a = (i % 8) / 7 * Math.PI, z = -0.044 + Math.floor(i / 8) * 0.016, r = Math.sqrt(Math.max(0.08, 1 - (z / 0.0615) ** 2)) * 0.72, root: Triple = [Math.cos(a) * 0.019 * r, 0.043 + Math.sin(a) * 0.022 * r, z]; quills.push(pointed("马岛猬躯背从皮面实际生出的短硬棘", pale, [root, [root[0] * 1.7, root[1] + Math.sin(a) * 0.018, root[2] - 0.006]], [0.0012, 0])); }
  parts.push(combineMeshes("马岛猬背部完整而非随机悬浮的短棘被", pale, quills));
  const collar: ModelPart[] = []; for (let i = 0; i < 14; i++) { const a = i / 13 * Math.PI, root: Triple = [Math.cos(a) * 0.013, 0.048 + Math.sin(a) * 0.008, 0.045]; collar.push(pointed("条纹马岛猬后颈独立竖起的长冠棘", pale, [root, [root[0] * 2, root[1] + Math.sin(a) * 0.025, root[2] + 0.002]], [0.0015, 0])); } parts.push(combineMeshes("条纹马岛猬围绕后头的棘冠", pale, collar));
  const stridulators: ModelPart[] = []; for (let i = 0; i < 7; i++) stridulators.push(leaf("背后部用于摩擦发声的特化扁棘", pale, [(i - 3) * 0.0022, 0.061, -0.025], 0.003, 0.015, [-20, (i - 3) * 5, 0])); parts.push(combineMeshes("条纹马岛猬真实分立的背部发声棘器", pale, stridulators)); return parts;
}

function pacarana(): ModelPart[] {
  const parts: ModelPart[] = [lobe("帕卡拉纳鼠背部高拱的笨重啮齿躯", fur, [0, 0.24, 0], [0.33, 0.38, 0.65]), lobe("帕卡拉纳鼠短颈与发达的宽颊", fur, [0, 0.29, 0.22], [0.29, 0.31, 0.28])]; head(parts, [0, 0.3, 0.34], [0.26, 0.25, 0.29], 0.018); fourFeet(parts, [0, 0.2, 0.2], [0, 0.2, -0.19], 0.11, 0.041);
  const toes: ModelPart[] = [];
  for (const side of [-1, 1]) for (const z of [0.216, -0.202]) for (let i = 0; i < 4; i++) toes.push(pointed("帕卡拉纳鼠每足四枚粗壮趾端弯甲", pale, [[side * 0.11 + (i - 1.5) * 0.014, 0.02, z + 0.025], [side * 0.11 + (i - 1.5) * 0.015, 0.012, z + 0.065], [side * 0.11 + (i - 1.5) * 0.015, 0.006, z + 0.071]], [0.005, 0.003, 0])); parts.push(combineMeshes("帕卡拉纳鼠四足完整粗甲列", pale, toes), tapered("帕卡拉纳鼠区别于无尾水豚的粗短裸尾", dark, [[0, 0.22, -0.27], [0.06, 0.09, -0.41], [0.12, 0.025, -0.51]], [0.035, 0.025, 0.008])); return parts;
}

function thylacine(): ModelPart[] {
  const parts: ModelPart[] = [lobe("袋狼腰部较长而胸腔狭深的躯", fur, [0, 0.44, 0], [0.36, 0.46, 0.96]), tapered("袋狼厚颈与狭长头骨的连续连接", fur, [[0, 0.48, 0.32], [0, 0.59, 0.5]], [0.13, 0.082])]; head(parts, [0, 0.62, 0.6], [0.24, 0.27, 0.34], 0.11); fourFeet(parts, [0, 0.44, 0.29], [0, 0.39, -0.3], 0.12, 0.044);
  parts.push(tapered("袋狼粗根平直地延续脊柱的硬直尾", pale, [[0, 0.43, -0.4], [0.025, 0.35, -0.65], [0.04, 0.23, -1.01]], [0.088, 0.055, 0.013]));
  const pouch = hollowPipe("雌袋狼朝后开口而前端封闭的浅育儿袋缘", [[0, 0.28, -0.085], [0, 0.28, -0.15]], 0.047, 0.037); pouch.color = pale; parts.push(pouch, lobe("与腹壁连续相接的育儿袋前端盲底", pale, [0, 0.28, -0.085], [0.094, 0.094, 0.025])); return parts;
}

function spottedQuoll(): ModelPart[] {
  const parts: ModelPart[] = [lobe("斑尾袋鼬低而细腰的长躯", fur, [0, 0.15, 0], [0.17, 0.2, 0.46]), tapered("袋鼬由胸部通向尖小头的细颈", fur, [[0, 0.18, 0.15], [0, 0.22, 0.22]], [0.049, 0.033])]; head(parts, [0, 0.23, 0.26], [0.11, 0.13, 0.16], 0.04); fourFeet(parts, [0, 0.14, 0.13], [0, 0.14, -0.14], 0.059, 0.022);
  for (const side of [-1, 1]) { const root: Triple = [side * 0.05, 0.014, -0.145]; parts.push(tapered("斑尾袋鼬后足可对握且无爪的内侧第一趾", pale, [root, [side * 0.031, 0.012, -0.133], [side * 0.028, 0.014, -0.118]], [0.005, 0.004, 0.003])); }
  const claws: ModelPart[] = []; for (const side of [-1, 1]) for (const z of [0.139, -0.147]) for (let i = 0; i < 4; i++) claws.push(pointed("斑尾袋鼬其余攀握趾上的短爪", pale, [[side * 0.059 + (i - 1.5) * 0.007, 0.01, z + 0.019], [side * 0.059 + (i - 1.5) * 0.007, 0.006, z + 0.034]], [0.0017, 0])); parts.push(combineMeshes("斑尾袋鼬与足掌相连的攀爬爪列", pale, claws), tapered("斑尾袋鼬几乎与头躯等长的粗毛尾", pale, [[0, 0.15, -0.2], [0.06, 0.07, -0.37], [0.12, 0.028, -0.56], [0.19, 0.034, -0.61]], [0.029, 0.035, 0.026, 0.007])); return parts;
}

function quokka(): ModelPart[] {
  const parts: ModelPart[] = [lobe("短尾矮袋鼠圆背而非高长斜躯的身体", fur, [0, 0.235, 0], [0.31, 0.43, 0.32], [12, 0, 0]), tapered("矮袋鼠短颈和圆钝的面部连接", fur, [[0, 0.35, 0.075], [0, 0.43, 0.145]], [0.06, 0.05])]; head(parts, [0, 0.455, 0.17], [0.16, 0.18, 0.18], 0.025);
  for (const side of [-1, 1]) {
    parts.push(lobe("矮袋鼠短而粗大的后胯", fur, [side * 0.1, 0.14, -0.035], [0.15, 0.23, 0.18]), tapered("矮袋鼠短后胫与前伸的跗足", fur, [[side * 0.1, 0.17, -0.03], [side * 0.14, 0.06, -0.055], [side * 0.12, 0.022, 0.035]], [0.038, 0.023, 0.015]), lobe("矮袋鼠接地的长后掌", pale, [side * 0.12, 0.02, 0.08], [0.055, 0.032, 0.14]), tapered("矮袋鼠在胸前可活动的短前肢", fur, [[side * 0.075, 0.34, 0.055], [side * 0.12, 0.25, 0.14], [side * 0.09, 0.21, 0.17]], [0.022, 0.015, 0.01])); hand(parts, [side * 0.09, 0.21, 0.17], 0.031);
    const toes: ModelPart[] = [pointed("短尾矮袋鼠后足特别发达的第四趾", dark, [[side * 0.12, 0.019, 0.12], [side * 0.12, 0.011, 0.17]], [0.008, 0]), pointed("短尾矮袋鼠后足较小的外侧第五趾", dark, [[side * 0.14, 0.018, 0.1], [side * 0.151, 0.01, 0.143]], [0.006, 0])]; for (let i = 0; i < 2; i++) toes.push(pointed("矮袋鼠后足并趾中的两枚细梳理趾", pale, [[side * 0.103 + i * 0.005, 0.018, 0.11], [side * 0.101 + i * 0.005, 0.011, 0.143]], [0.0022, 0])); parts.push(combineMeshes("矮袋鼠后掌真实不同大小的四趾", pale, toes));
  }
  parts.push(tapered("短尾矮袋鼠不足头躯长的裸短尾", dark, [[0, 0.13, -0.1], [0.055, 0.045, -0.24], [0.11, 0.022, -0.32]], [0.022, 0.017, 0.005])); return parts;
}

export const groundMammalDesigns: MasterNatureDesign[] = [
  design("springhare", "跳兔", "动物", springhare, ["Pedetes capensis", "长跗足四宽甲与粗毛尾"]),
  design("streakedTenrec", "低地条纹马岛猬", "动物", streakedTenrec, ["Hemicentetes semispinosus", "长吻颈棘冠与特化发声棘器"]),
  design("pacarana", "帕卡拉纳鼠（Dinomys）", "动物", pacarana, ["Dinomys branickii", "高拱躯宽颊四粗甲趾与裸尾"]),
  design("thylacine", "袋狼", "动物", thylacine, ["Thylacinus cynocephalus", "硬直粗根尾与后开育儿袋"]),
  design("spottedQuoll", "斑尾袋鼬", "动物", spottedQuoll, ["Dasyurus maculatus", "后足对握无爪第一趾与长毛尾"]),
  design("quokka", "短尾矮袋鼠", "动物", quokka, ["Setonix brachyurus", "圆短躯裸短尾与后足并趾"]),
];
