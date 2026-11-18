import { beam, combineMeshes, design, eyes, leaf, lobe, needle, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";
import { rayFin, tail } from "./marine";

const fur = "#abb79b";
const pale = "#c6cbb0";
const dark = "#8e9d87";

export function head(parts: ModelPart[], root: Triple, size: Triple, muzzle: number, ears: "round" | "point" | "none" = "round") {
  parts.push(lobe("哺乳类头颅", fur, root, size), ...eyes([root[0], root[1] + size[1] * 0.15, root[2] + size[2] * 0.25], size[0] * 0.32, size[0] * 0.1));
  if (muzzle) parts.push(tapered("独立吻部", pale, [[root[0], root[1] - size[1] * 0.12, root[2] + size[2] * 0.25], [root[0], root[1] - size[1] * 0.15, root[2] + size[2] * 0.35 + muzzle]], [size[0] * 0.24, size[0] * 0.11]), lobe("鼻端", dark, [root[0], root[1] - size[1] * 0.15, root[2] + size[2] * 0.35 + muzzle], [size[0] * 0.2, size[0] * 0.13, size[0] * 0.12]));
  if (ears !== "none") for (const side of [-1, 1]) { const p: Triple = [root[0] + side * size[0] * 0.35, root[1] + size[1] * 0.37, root[2] - size[2] * 0.08]; if (ears === "point") parts.push(needle("直立三角耳", pale, p, [p[0] + side * size[0] * 0.15, p[1] + size[1] * 0.6, p[2]], size[0] * 0.32)); else parts.push(lobe("圆形外耳", pale, p, [size[0] * 0.35, size[1] * 0.4, size[0] * 0.17])); }
}

export function fourFeet(parts: ModelPart[], front: Triple, rear: Triple, spread: number, thickness: number, claws = false, hoof = false) {
  for (const root of [front, rear]) for (const side of [-1, 1]) {
    const p: Triple = [root[0] + side * spread, thickness * 0.5, root[2] + thickness * (root === front ? 0.4 : -0.3)];
    parts.push(tapered("分节承重四肢", fur, [[root[0] + side * spread * 0.6, root[1], root[2]], [root[0] + side * spread, root[1] * 0.55, root[2] - thickness * 0.35], p], [thickness, thickness * 0.7, thickness * 0.42]));
    if (hoof) for (const toe of [-1, 1]) parts.push(lobe("有真实趾间隙的分趾蹄壳", dark, [p[0] + toe * thickness * 0.48, thickness * 0.38, p[2] + thickness * 0.25], [thickness * 0.95, thickness * 0.85, thickness * 2.6]));
    else parts.push(lobe("接地足掌", dark, [p[0], thickness * 0.38, p[2] + thickness * 0.25], [thickness * 2.1, thickness * 0.85, thickness * 2.6]));
    if (claws) { const toes: ModelPart[] = []; for (let i = 0; i < 4; i++) toes.push(needle("外露掘土趾爪", pale, [p[0] + (i - 1.5) * thickness * 0.36, thickness * 0.35, p[2] + thickness], [p[0] + (i - 1.5) * thickness * 0.4, thickness * 0.1, p[2] + thickness * 2], thickness * 0.2)); parts.push(combineMeshes("单足完整爪列", pale, toes)); }
  }
}

export function hand(parts: ModelPart[], root: Triple, scale: number, longFinger = false) {
  parts.push(lobe("灵长类掌部", pale, root, [scale, scale * 0.4, scale * 1.2]));
  const digits: ModelPart[] = []; for (let i = 0; i < 5; i++) { const length = scale * (longFinger && i === 2 ? 2.8 : 0.8 + Math.sin(i / 4 * Math.PI) * 0.5); digits.push(tapered("可抓握的独立手指", pale, [[root[0] + (i - 2) * scale * 0.18, root[1], root[2]], [root[0] + (i - 2) * scale * 0.2, root[1] - scale * 0.15, root[2] + length * 0.7], [root[0] + (i - 2) * scale * 0.18, root[1] + scale * 0.08, root[2] + length]], [scale * (longFinger && i === 2 ? 0.035 : 0.08), scale * 0.05, scale * 0.03])); } parts.push(combineMeshes("五指完整抓握手", pale, digits));
}

function mammal(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("雄狮长腹和强壮胸", fur, [0, 0.8, 0], [0.7, 0.8, 1.65]), lobe("雄狮肩部", fur, [0, 0.9, 0.5], [0.75, 0.85, 0.7])); head(parts, [0, 1.05, 0.85], [0.43, 0.45, 0.5], 0.13);
    const mane: ModelPart[] = []; for (let i = 0; i < 32; i++) { const a = i * 2.4; const y = 0.77 + i % 5 * 0.14; const p: Triple = [Math.cos(a) * 0.31, y, 0.7 + Math.sin(a) * 0.21]; mane.push(leaf("厚长放射鬃毛", "#a8ac8e", p, 0.16, 0.35, [135, i * 137.5 % 360, 0])); } parts.push(combineMeshes("围绕头胸的完整雄狮鬃毛", "#a8ac8e", mane)); fourFeet(parts, [0, 0.85, 0.48], [0, 0.74, -0.55], 0.22, 0.1);
    parts.push(tapered("雄狮细长尾", fur, [[0, 0.85, -0.7], [0.2, 0.55, -1.25], [0.25, 0.15, -1.7]], [0.035, 0.022, 0.015]), lobe("尾端鬃毛团", dark, [0.25, 0.15, -1.7], [0.12, 0.17, 0.12]));
  } else if (kind === 1) {
    parts.push(lobe("猞猁短腰高腿体", fur, [0, 0.48, 0], [0.35, 0.42, 0.8])); head(parts, [0, 0.64, 0.4], [0.25, 0.25, 0.27], 0.045, "point"); fourFeet(parts, [0, 0.5, 0.22], [0, 0.47, -0.25], 0.13, 0.06);
    for (const side of [-1, 1]) parts.push(tapered("猞猁耳端长黑毛簇", dark, [[side * 0.105, 0.85, 0.38], [side * 0.12, 0.98, 0.39]], [0.015, 0.001]), leaf("脸颊两侧下垂领毛", pale, [side * 0.09, 0.6, 0.43], 0.11, 0.18, [155, 0, side * 25])); parts.push(tapered("猞猁截短尾", dark, [[0, 0.5, -0.32], [0.03, 0.45, -0.5]], [0.04, 0.025]));
  } else if (kind === 2) {
    parts.push(tapered("鬣狗前高后低背线", fur, [[0, 0.56, -0.5], [0, 0.68, 0], [0, 0.83, 0.4]], [0.2, 0.3, 0.29]), lobe("鬣狗前肩厚肌", fur, [0, 0.8, 0.33], [0.6, 0.67, 0.55])); head(parts, [0, 0.89, 0.65], [0.35, 0.39, 0.4], 0.2); fourFeet(parts, [0, 0.78, 0.35], [0, 0.5, -0.36], 0.18, 0.085);
    for (let i = 0; i < 9; i++) parts.push(leaf("颈背直立鬣毛", dark, [0, 0.83 - i * 0.025, 0.45 - i * 0.1], 0.055, 0.18, [-15, 0, 0])); parts.push(tapered("鬣狗短粗尾", fur, [[0, 0.55, -0.48], [0.08, 0.27, -0.86]], [0.09, 0.04]));
  } else if (kind === 3) {
    parts.push(lobe("狐狸细长低胸躯", fur, [0, 0.32, 0], [0.26, 0.32, 0.68])); head(parts, [0, 0.46, 0.33], [0.2, 0.22, 0.26], 0.15, "point"); fourFeet(parts, [0, 0.33, 0.2], [0, 0.3, -0.22], 0.09, 0.035);
    parts.push(tapered("狐狸蓬松宽大的扫帚尾", "#b6bea2", [[0, 0.35, -0.28], [0.12, 0.27, -0.6], [0.2, 0.16, -0.95]], [0.08, 0.14, 0.025]), lobe("狐狸尾尖毛团", pale, [0.2, 0.16, -0.93], [0.11, 0.14, 0.17]));
  } else if (kind === 4) {
    parts.push(lobe("臭鼬低伏长躯", fur, [0, 0.18, 0], [0.26, 0.3, 0.54])); head(parts, [0, 0.23, 0.3], [0.14, 0.15, 0.19], 0.085); fourFeet(parts, [0, 0.19, 0.18], [0, 0.18, -0.19], 0.085, 0.035, true);
    parts.push(tapered("臭鼬高拱翻到背上的大尾", "#b8c2a6", [[0, 0.22, -0.22], [0.02, 0.52, -0.37], [0, 0.66, -0.2], [-0.02, 0.53, 0.02]], [0.06, 0.15, 0.17, 0.06]));
    for (let i = 0; i < 12; i++) parts.push(leaf("尾缘张开的长毛束", pale, [0, 0.45 + i % 3 * 0.065, -0.3 + i % 4 * 0.06], 0.028, 0.17, [20, i * 137.5 % 360, 0]));
  } else if (kind === 5) {
    parts.push(lobe("豪猪拱起的厚背躯", fur, [0, 0.29, 0], [0.43, 0.48, 0.65])); head(parts, [0, 0.24, 0.32], [0.21, 0.23, 0.26], 0.07); fourFeet(parts, [0, 0.25, 0.15], [0, 0.24, -0.2], 0.13, 0.045, true);
    const quills: ModelPart[] = []; for (let i = 0; i < 75; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.16, 0.24 + i % 5 * 0.05, -0.2 + Math.sin(a) * 0.14]; quills.push(needle("有体积的长硬刺", i % 3 ? pale : dark, p, [p[0] * 1.65, p[1] + 0.15 + i % 3 * 0.04, p[2] - 0.19], 0.008)); } for (let i = 0; i < quills.length; i += 25) parts.push(combineMeshes("豪猪背部完整长刺群", pale, quills.slice(i, i + 25))); parts.push(tapered("豪猪短粗尾", fur, [[0, 0.2, -0.25], [0, 0.1, -0.5]], [0.05, 0.018]));
  } else if (kind === 6) {
    parts.push(lobe("水豚巨大桶形无尾躯", fur, [0, 0.57, 0], [0.63, 0.75, 1.05]), lobe("水豚钝方形长头", fur, [0, 0.76, 0.49], [0.39, 0.4, 0.6]), ...eyes([0, 0.86, 0.53], 0.15, 0.04));
    for (const side of [-1, 1]) parts.push(lobe("位于头顶的小圆耳", pale, [side * 0.14, 0.96, 0.38], [0.085, 0.1, 0.07]), lobe("高位鼻孔", dark, [side * 0.06, 0.81, 0.75], [0.03, 0.025, 0.013])); fourFeet(parts, [0, 0.55, 0.29], [0, 0.47, -0.32], 0.2, 0.09);
    for (const side of [-1, 1]) for (const z of [-0.34, 0.32]) parts.push(membrane("水豚趾间薄蹼", pale, [[side * 0.2 - 0.04, 0.03, z], [side * 0.2 + 0.04, 0.03, z], [side * 0.2 + 0.055, 0.025, z + 0.12], [side * 0.2 - 0.055, 0.025, z + 0.12]]));
  } else if (kind === 7) {
    parts.push(lobe("獾宽扁低胸和粗后躯", fur, [0, 0.23, 0], [0.4, 0.36, 0.7])); head(parts, [0, 0.25, 0.36], [0.22, 0.19, 0.28], 0.12); fourFeet(parts, [0, 0.23, 0.2], [0, 0.22, -0.22], 0.14, 0.055, true); parts.push(tapered("獾的短平衡尾", fur, [[0, 0.23, -0.3], [0.04, 0.15, -0.5]], [0.045, 0.02]));
    for (const side of [-1, 1]) parts.push(lobe("獾侧向扩展的咀嚼肌", pale, [side * 0.11, 0.23, 0.35], [0.13, 0.16, 0.18]));
  } else if (kind === 8 || kind === 9) {
    const binturong = kind === 9; const y = binturong ? 0.4 : 0.32; const length = binturong ? 0.86 : 0.65;
    parts.push(lobe(binturong ? "熊狸粗壮蓬松躯" : "小熊猫圆而柔软躯", fur, [0, y, 0], binturong ? [0.43, 0.5, length] : [0.36, 0.43, length])); head(parts, [0, y + 0.12, length * 0.46], binturong ? [0.27, 0.25, 0.33] : [0.25, 0.23, 0.25], binturong ? 0.07 : 0.035); fourFeet(parts, [0, y, length * 0.25], [0, y * 0.9, -length * 0.29], binturong ? 0.15 : 0.12, 0.065, true);
    parts.push(tapered(binturong ? "熊狸可卷曲抓握的长尾" : "小熊猫长而蓬松的环状尾", "#bdc4a7", [[0, y, -length * 0.42], [0.12, 0.17, -length * 0.88], [0.24, 0.12, -length * 1.35], [0.32, 0.28, -length * 1.2]], binturong ? [0.07, 0.08, 0.055, 0.018] : [0.09, 0.1, 0.07, 0.025]));
    if (binturong) for (const side of [-1, 1]) { for (let i = 0; i < 5; i++) parts.push(needle("熊狸长硬触须", pale, [side * 0.07, 0.48, 0.5], [side * 0.22, 0.45 + i * 0.016, 0.56], 0.002)); parts.push(leaf("耳后下垂长毛", dark, [side * 0.1, 0.6, 0.34], 0.035, 0.14, [150, 0, side * 20])); }
    else for (let i = 0; i < 6; i++) parts.push(lobe("尾毛自然分段体积", i % 2 ? pale : fur, [0.12 + i * 0.025, 0.17 - i * 0.008, -0.54 - i * 0.055], [0.14, 0.14, 0.12]));
  } else if (kind === 10) {
    parts.push(lobe("象鼩轻巧弓背小躯", fur, [0, 0.07, 0], [0.07, 0.075, 0.13])); head(parts, [0, 0.09, 0.065], [0.04, 0.045, 0.055], 0.015); fourFeet(parts, [0, 0.07, 0.035], [0, 0.06, -0.04], 0.025, 0.008);
    parts.push(tapered("象鼩能弯曲的细长鼻吻", pale, [[0, 0.085, 0.09], [0.005, 0.065, 0.13], [0.01, 0.045, 0.145]], [0.006, 0.003, 0.001]), tapered("象鼩长裸尾", fur, [[0, 0.065, -0.05], [0.02, 0.035, -0.14], [0.04, 0.018, -0.22]], [0.004, 0.002, 0.0005]));
  } else if (kind === 11 || kind === 12) {
    const mole = kind === 12; parts.push(lobe(mole ? "裸鼹鼠圆筒形裸皮躯" : "鼩鼱细长梭形小躯", fur, [0, 0.035, 0], mole ? [0.043, 0.045, 0.11] : [0.03, 0.032, 0.075])); head(parts, [0, 0.037, mole ? 0.055 : 0.04], mole ? [0.033, 0.034, 0.04] : [0.023, 0.025, 0.035], mole ? 0.012 : 0.025, mole ? "none" : "round"); fourFeet(parts, [0, 0.03, 0.027], [0, 0.03, -0.03], 0.018, 0.004, true);
    parts.push(tapered("小型哺乳类细长裸尾", "#b7bfa5", [[0, 0.028, -0.04], [0.025, 0.02, -0.09], [0.04, 0.015, -0.14]], [0.003, 0.0015, 0.0005]));
    if (mole) { for (const side of [-1, 1]) parts.push(needle("裸鼹鼠突出口外的门齿", "#dad3b4", [side * 0.005, 0.04, 0.077], [side * 0.004, 0.023, 0.089], 0.006)); const folds: ModelPart[] = []; for (let i = 0; i < 10; i++) for (const side of [-1, 1]) folds.push(tapered("裸皮横向皱褶", "#bdc3a9", [[side * 0.018, 0.022, -0.035 + i * 0.008], [side * 0.021, 0.037, -0.035 + i * 0.008], [side * 0.015, 0.05, -0.035 + i * 0.008]], [0.001, 0.0012, 0.001])); for (let i = 0; i < folds.length; i += 10) parts.push(combineMeshes("一侧连续皮肤褶皱", "#bdc3a9", folds.slice(i, i + 10))); }
  } else if (kind === 13) {
    parts.push(lobe("负鼠肥厚后躯和细长胸", fur, [0, 0.22, 0], [0.25, 0.29, 0.5])); head(parts, [0, 0.27, 0.26], [0.14, 0.14, 0.2], 0.1); fourFeet(parts, [0, 0.22, 0.14], [0, 0.2, -0.15], 0.09, 0.027, true);
    parts.push(tapered("负鼠可缠绕的无毛尾", pale, [[0, 0.23, -0.2], [0.13, 0.11, -0.45], [0.22, 0.12, -0.62], [0.2, 0.24, -0.67], [0.12, 0.3, -0.61]], [0.017, 0.012, 0.009, 0.006, 0.0015]));
  } else if (kind === 14 || kind === 15) {
    const bilby = kind === 14; parts.push(lobe(bilby ? "兔袋狸后高前低躯" : "袋狸弓形厚后躯", fur, [0, 0.17, 0], bilby ? [0.2, 0.27, 0.36] : [0.2, 0.24, 0.34])); head(parts, [0, 0.17, 0.2], [0.1, 0.12, 0.14], 0.11, "none"); fourFeet(parts, [0, 0.14, 0.1], [0, 0.18, -0.1], 0.07, 0.026, true);
    for (const side of [-1, 1]) parts.push(leaf(bilby ? "兔袋狸长而薄的兔状耳" : "袋狸短尖耳", pale, [side * 0.035, 0.22, 0.17], bilby ? 0.045 : 0.025, bilby ? 0.18 : 0.07, [-10, 0, side * 12]));
    parts.push(tapered(bilby ? "兔袋狸长而细的尾" : "袋狸短尖尾", pale, [[0, 0.17, -0.15], [0.06, 0.08, bilby ? -0.35 : -0.27], [0.08, 0.045, bilby ? -0.48 : -0.29]], [0.016, 0.009, 0.002]));
  } else if (kind === 16) {
    parts.push(lobe("袋獾前宽后窄的结实体", fur, [0, 0.31, 0], [0.37, 0.42, 0.61]), lobe("袋獾极宽的三角形头", fur, [0, 0.37, 0.34], [0.3, 0.29, 0.34]), lobe("袋獾粗壮的下颌", pale, [0, 0.28, 0.43], [0.24, 0.12, 0.27]), ...eyes([0, 0.41, 0.42], 0.09, 0.027));
    for (const side of [-1, 1]) parts.push(lobe("袋獾裸露圆耳", pale, [side * 0.1, 0.51, 0.27], [0.09, 0.11, 0.035])); fourFeet(parts, [0, 0.3, 0.18], [0, 0.25, -0.2], 0.13, 0.055, true); parts.push(tapered("袋獾贮脂粗尾", dark, [[0, 0.3, -0.25], [0.09, 0.17, -0.47], [0.12, 0.12, -0.64]], [0.07, 0.05, 0.015]));
  } else if (kind >= 17 && kind <= 23) {
    const baboon = kind === 17, proboscis = kind === 18, spider = kind === 19, tarsier = kind === 20, aye = kind === 21, loris = kind === 22;
    const y = baboon || proboscis ? 0.55 : spider ? 0.49 : tarsier ? 0.16 : aye ? 0.28 : loris ? 0.2 : 0.35;
    parts.push(lobe(proboscis ? "长鼻猴圆鼓的腹部" : tarsier ? "眼镜猴小型直立躯" : loris ? "懒猴圆而无尾的短躯" : "灵长类独立胸腹", fur, [0, y, 0], proboscis ? [0.43, 0.65, 0.42] : baboon ? [0.36, 0.52, 0.63] : spider ? [0.2, 0.47, 0.3] : tarsier ? [0.09, 0.15, 0.1] : aye ? [0.2, 0.31, 0.25] : loris ? [0.17, 0.23, 0.2] : [0.24, 0.35, 0.43]));
    const faceY = y + (baboon || proboscis ? 0.39 : spider ? 0.32 : tarsier ? 0.12 : aye ? 0.22 : loris ? 0.13 : 0.2); const faceZ = baboon ? 0.34 : 0.08;
    const size: Triple = baboon ? [0.24, 0.27, 0.32] : proboscis ? [0.25, 0.29, 0.26] : tarsier ? [0.105, 0.1, 0.09] : aye ? [0.17, 0.17, 0.16] : loris ? [0.15, 0.14, 0.13] : [0.17, 0.18, 0.2];
    if (tarsier) parts.push(lobe("眼镜猴宽圆头颅", fur, [0, faceY, faceZ], size)); else head(parts, [0, faceY, faceZ], size, baboon ? 0.19 : aye ? 0.035 : kind === 23 ? 0.1 : 0, tarsier || aye ? "none" : "round");
    if (proboscis) parts.push(tapered("长鼻猴粗大下垂鼻", pale, [[0, faceY + 0.015, 0.18], [0, faceY - 0.09, 0.25], [0, faceY - 0.17, 0.23]], [0.055, 0.06, 0.035]));
    if (tarsier) for (const side of [-1, 1]) parts.push(lobe("眼镜猴占头部大半的眼球", "#899982", [side * 0.033, faceY, faceZ + 0.04], [0.06, 0.065, 0.045]), lobe("眼镜猴大圆耳", pale, [side * 0.05, faceY + 0.04, faceZ - 0.01], [0.04, 0.05, 0.012]));
    if (aye) for (const side of [-1, 1]) parts.push(lobe("指猴大而薄的圆耳", pale, [side * 0.08, faceY + 0.04, faceZ - 0.02], [0.105, 0.13, 0.025]), needle("指猴外露的啮齿门齿", "#d9d0b2", [side * 0.01, faceY - 0.04, faceZ + 0.09], [side * 0.009, faceY - 0.08, faceZ + 0.11], 0.017));
    for (const side of [-1, 1]) {
      const shoulder: Triple = [side * size[0] * 0.5, y + size[1] * 0.65, baboon ? 0.17 : 0.02]; const wrist: Triple = [side * (spider ? 0.32 : proboscis || baboon ? 0.2 : size[0] * 0.9), loris ? 0.13 : 0.04, baboon ? 0.32 : 0.16];
      parts.push(tapered("可抓握的长前肢", fur, [shoulder, [wrist[0], y * 0.7, wrist[2] * 0.7], wrist], [size[0] * 0.15, size[0] * 0.11, size[0] * 0.07])); hand(parts, wrist, size[0] * 0.25, aye);
      const heel: Triple = [side * (tarsier ? 0.065 : size[0] * 0.65), 0.025, -size[2] * (tarsier ? 1.3 : 0.5)]; parts.push(tapered(tarsier ? "眼镜猴延长的跗骨与后肢" : "弯曲的后肢", fur, [[side * size[0] * 0.5, y * 0.8, -0.04], [side * size[0], y * 0.5, -size[2]], heel], [size[0] * 0.18, size[0] * 0.13, size[0] * 0.065])); hand(parts, heel, size[0] * (tarsier ? 0.35 : 0.28));
    }
    if (!loris) parts.push(tapered(spider ? "蜘蛛猴具有抓握末端的第五肢长尾" : aye ? "指猴蓬松的大尾" : "灵长类长尾", kind === 23 ? pale : fur, [[0, y * 0.6, -size[2] * 0.6], [0.13, y * 0.3, -size[2] * 1.9], [0.19, y * 0.7, -size[2] * 2.8], [0.12, y * 1.3, -size[2] * 2.5]], aye ? [0.05, 0.08, 0.055, 0.015] : spider ? [0.025, 0.02, 0.014, 0.008] : [size[0] * 0.15, size[0] * 0.12, size[0] * 0.08, size[0] * 0.03]));
  } else if (kind === 24) {
    parts.push(lobe("麝牛低宽而魁梧躯", fur, [0, 0.92, 0], [1.0, 1.15, 1.7])); head(parts, [0, 0.84, 0.87], [0.48, 0.55, 0.58], 0.2, "none"); fourFeet(parts, [0, 0.85, 0.5], [0, 0.8, -0.55], 0.31, 0.14);
    for (const side of [-1, 1]) parts.push(tapered("麝牛额部贴生下弯再上翘的角", pale, [[side * 0.06, 1.1, 0.86], [side * 0.34, 0.96, 0.88], [side * 0.46, 0.7, 0.92], [side * 0.57, 0.82, 0.95]], [0.1, 0.08, 0.045, 0.003]));
    const coat: ModelPart[] = []; for (let i = 0; i < 36; i++) { const a = i * 2.4; const z = -0.6 + i % 9 * 0.15; coat.push(leaf("几乎垂到蹄部的长毛披被", "#a9ad91", [Math.cos(a) * 0.4, 0.8, z], 0.12, 0.65, [170, i * 137.5 % 360, 0])); } parts.push(combineMeshes("麝牛整幅长毛裙", "#a9ad91", coat));
  } else if (kind === 25) {
    parts.push(lobe("疣猪长腿瘦腰躯", fur, [0, 0.58, 0], [0.44, 0.62, 0.95])); head(parts, [0, 0.48, 0.65], [0.33, 0.34, 0.53], 0.12, "point"); fourFeet(parts, [0, 0.57, 0.25], [0, 0.55, -0.3], 0.16, 0.065);
    for (const side of [-1, 1]) { parts.push(tapered("疣猪上弯的大獠牙", pale, [[side * 0.11, 0.42, 0.82], [side * 0.25, 0.47, 0.9], [side * 0.27, 0.65, 0.84]], [0.035, 0.025, 0.002])); for (let i = 0; i < 2; i++) parts.push(lobe("颊部显著的成对皮疣", "#b7bda1", [side * 0.17, 0.49 + i * 0.12, 0.59 + i * 0.04], [0.12, 0.09, 0.1])); }
    for (let i = 0; i < 11; i++) parts.push(leaf("颈背长鬃毛", dark, [0, 0.83 - i * 0.008, 0.45 - i * 0.08], 0.04, 0.21, [10, 0, 0])); parts.push(tapered("竖立警戒的细尾", fur, [[0, 0.62, -0.4], [0.01, 0.9, -0.5], [0, 1.08, -0.52]], [0.018, 0.01, 0.005]));
  } else if (kind === 26) {
    parts.push(lobe("鼬鼹适应游水的纺锤体", fur, [0, 0.085, 0], [0.095, 0.11, 0.21])); head(parts, [0, 0.1, 0.1], [0.06, 0.065, 0.075], 0.01, "none"); parts.push(tapered("鼬鼹弯曲的敏感长鼻", pale, [[0, 0.092, 0.13], [0, 0.075, 0.19], [0.008, 0.06, 0.21]], [0.009, 0.005, 0.001]), tapered("鼬鼹侧扁游泳尾", fur, [[0, 0.07, -0.08], [0.015, 0.06, -0.19], [0.02, 0.04, -0.3]], [0.013, 0.016, 0.002])); parts.at(-1)!.scale.x = 0.5;
    for (const side of [-1, 1]) for (const z of [-0.06, 0.06]) { parts.push(beam("短侧展泳足", fur, [side * 0.03, 0.06, z], [side * 0.07, 0.025, z], 0.009), membrane("趾间宽阔泳蹼", pale, [[side * 0.055, 0.025, z], [side * 0.1, 0.02, z - 0.015], [side * 0.11, 0.02, z + 0.035], [side * 0.06, 0.025, z + 0.03]])); }
  } else if (kind === 27) {
    parts.push(lobe("鼯猴扁平的滑翔躯", fur, [0, 0.24, 0], [0.18, 0.15, 0.38])); head(parts, [0, 0.28, 0.21], [0.12, 0.1, 0.13], 0.02);
    for (const side of [-1, 1]) {
      const wrist: Triple = [side * 0.32, 0.2, 0.2]; const ankle: Triple = [side * 0.25, 0.19, -0.2];
      parts.push(beam("滑翔时伸展前肢", fur, [side * 0.05, 0.25, 0.1], wrist, 0.024), beam("滑翔时伸展后肢", fur, [side * 0.05, 0.23, -0.1], ankle, 0.024), membrane("由颈部包到指趾及尾尖的完整鼯猴翼膜", pale, [[0, 0.26, 0.23], wrist, [side * 0.27, 0.17, 0], ankle, [0, 0.15, -0.43], [0, 0.22, -0.12]])); hand(parts, wrist, 0.025); hand(parts, ankle, 0.025);
    }
    parts.push(tapered("翼膜内部支持尾", fur, [[0, 0.23, -0.15], [0, 0.18, -0.31], [0, 0.15, -0.43]], [0.018, 0.009, 0.002]));
  } else if (kind === 28) {
    parts.push(lobe("毛丝鼠坐姿圆大后躯", fur, [0, 0.16, -0.02], [0.2, 0.28, 0.24]), lobe("毛丝鼠上举小胸", fur, [0, 0.27, 0.04], [0.14, 0.2, 0.16])); head(parts, [0, 0.38, 0.08], [0.13, 0.13, 0.14], 0.025, "none");
    for (const side of [-1, 1]) { parts.push(lobe("毛丝鼠大而薄的圆耳", pale, [side * 0.055, 0.45, 0.055], [0.08, 0.115, 0.025]), tapered("胸前短前肢", fur, [[side * 0.055, 0.28, 0.09], [side * 0.045, 0.2, 0.14]], [0.016, 0.009]), lobe("毛丝鼠后足", pale, [side * 0.07, 0.025, 0.035], [0.055, 0.04, 0.13])); }
    parts.push(tapered("毛丝鼠浓密弯曲尾", "#bcc5aa", [[0, 0.14, -0.12], [0.09, 0.075, -0.24], [0.18, 0.14, -0.28], [0.19, 0.25, -0.22]], [0.035, 0.045, 0.035, 0.008]));
  } else {
    parts.push(tapered("龙王鲸异常延长的蛇形鲸躯", "#a4b7a5", [[0, 1.0, 5.1], [0, 1.0, 2.5], [0.1, 0.95, -0.5], [0.2, 0.8, -3.5], [0, 0.65, -6.2], [0, 0.6, -7.3]], [0.28, 0.55, 0.5, 0.36, 0.15, 0.04]), lobe("龙王鲸长颌头骨", "#b4c1aa", [0, 1.0, 5.7], [0.7, 0.65, 2.0]), lobe("龙王鲸细长下颌", pale, [0, 0.7, 5.95], [0.5, 0.2, 1.7]), ...eyes([0, 1.15, 5.15], 0.27, 0.09), ...tail([0, 0.6, -7.3], 0.7, false));
    for (const side of [-1, 1]) { parts.push(rayFin("龙王鲸具肘关节的前鳍肢", [side * 0.28, 0.7, 3.5], [side * 1.1, 0.27, 2.4], 0.45)); parts.push(tapered("龙王鲸微小外露后肢", pale, [[side * 0.26, 0.7, -3.6], [side * 0.45, 0.45, -3.7], [side * 0.5, 0.38, -3.5]], [0.06, 0.04, 0.025])); for (let toe = 0; toe < 3; toe++) parts.push(needle("鲸后足残存趾", pale, [side * 0.5, 0.38, -3.5], [side * (0.47 + toe * 0.04), 0.35, -3.37], 0.02)); for (let i = 0; i < 10; i++) parts.push(needle("长颌内异型齿列", "#ded6b8", [side * 0.2, 0.85, 5.1 + i * 0.15], [side * 0.2, 0.68, 5.1 + i * 0.15], 0.045)); }
  }
  return parts;
}

const names = [["lion", "狮"], ["lynx", "猞猁"], ["hyena", "鬣狗"], ["fox", "狐狸"], ["skunk", "臭鼬"], ["porcupine", "豪猪"], ["capybara", "水豚"], ["badger", "獾"], ["redPanda", "小熊猫"], ["binturong", "熊狸"], ["elephantShrew", "象鼩"], ["shrew", "鼩鼱"], ["nakedMoleRat", "裸鼹鼠"], ["opossum", "负鼠"], ["bilby", "兔袋狸"], ["bandicoot", "袋狸"], ["tasmanianDevil", "袋獾"], ["baboon", "狒狒"], ["proboscisMonkey", "长鼻猴"], ["spiderMonkey", "蜘蛛猴"], ["tarsier", "眼镜猴"], ["ayeAye", "指猴"], ["slowLoris", "懒猴"], ["lemur", "狐猴"], ["muskOx", "麝牛"], ["warthog", "疣猪"], ["desman", "鼬鼹"], ["colugo", "鼯猴"], ["chinchilla", "毛丝鼠"], ["basilosaurus", "龙王鲸"]];

export const mammalFormDesigns: MasterNatureDesign[] = names.map(([key, name], index) => design(key!, name!, "动物", () => mammal(index), ["具名哺乳类专化形态"]));
