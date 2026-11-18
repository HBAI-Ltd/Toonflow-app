import { beam, combineMeshes, design, eyes, leaf, lobe, needle, part, polygon, tapered } from "./shared";
import { membrane } from "./animals";
import { fourFeet } from "./mammalForms";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const hide = "#a6b196";
const pale = "#c4c6a8";
const dark = "#929e88";

function biped(parts: ModelPart[], hip: Triple, gap: number, width: number, length: number, webbed = false) {
  for (const side of [-1, 1]) {
    const ankle: Triple = [side * gap, width * 0.2, hip[2] - 0.04];
    parts.push(tapered("分节后肢的股部小腿和跗部", hide, [[side * gap, hip[1], hip[2]], [side * gap * 1.2, hip[1] * 0.55, hip[2] + length * 0.45], ankle], [width * 1.4, width, width * 0.35]), part("脚掌稳定接地的足垫", "box", dark, [ankle[0], width * 0.15, ankle[2] + length * 0.12], [width * 1.3, width * 0.3, length * 0.4]));
    if (webbed) parts.push(polygon("趾间连成完整游泳蹼", pale, [[-width, 0], [-length * 0.7, length], [0, length * 0.82], [length * 0.7, length], [width, 0]], width * 0.06, [ankle[0], width * 0.1, ankle[2]]));
    else for (const toe of [-1, 0, 1]) parts.push(needle("三枚独立承重趾爪", pale, ankle, [ankle[0] + toe * width * 0.9, width * 0.1, ankle[2] + length], width * 0.15));
  }
}

function clawHand(parts: ModelPart[], root: Triple, width: number) {
  for (const digit of [-1, 0, 1]) parts.push(tapered("前肢末端弯曲的抓握爪", pale, [[root[0] + digit * width * 0.45, root[1], root[2]], [root[0] + digit * width * 0.5, root[1] - width * 0.5, root[2] + width], [root[0] + digit * width * 0.5, root[1] - width, root[2] + width * 0.8]], [width * 0.17, width * 0.12, width * 0.02]));
}

function prehistoricMammal(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind <= 2) {
    if (kind === 0) {
      parts.push(tapered("猛犸象前高后低的厚实胸腹", hide, [[0, 1.6, -1.8], [0, 1.9, 0], [0, 2.3, 1.15]], [0.55, 0.95, 0.85]), lobe("肩部高耸脂肪肌肉峰", hide, [0, 2.5, 0.8], [1.75, 1.3, 1.8]), lobe("猛犸象高圆顶头颅", hide, [0, 2.35, 1.85], [1.1, 1.55, 1.2]));
      fourFeet(parts, [0, 1.95, 0.9], [0, 1.5, -1.1], 0.55, 0.27);
      parts.push(tapered("猛犸象末端弯卷的长鼻", hide, [[0, 2.4, 2.2], [0, 1.4, 2.5], [0, 0.45, 2.7], [0.18, 0.5, 2.85]], [0.2, 0.15, 0.08, 0.025]));
      for (const side of [-1, 1]) { parts.push(lobe("猛犸象适应寒冷的小圆耳", dark, [side * 0.5, 2.25, 1.65], [0.14, 0.6, 0.47]), tapered("长牙向前上方强烈盘曲", pale, [[side * 0.32, 1.9, 2.1], [side * 0.63, 1.15, 2.7], [side * 0.82, 1.05, 3.5], [side * 0.6, 1.85, 3.9], [side * 0.27, 2.25, 3.75]], [0.12, 0.1, 0.075, 0.045, 0.006])); for (let i = 0; i < 8; i++) parts.push(leaf("猛犸象腹侧长毛束", dark, [side * 0.63, 1.65, -1.25 + i * 0.35], 0.22, 0.75, [165, side * 12, side * 12])); }
      parts.push(...eyes([0, 2.55, 2.12], 0.36, 0.09), tapered("短尾", hide, [[0, 1.7, -1.75], [0, 0.8, -1.95]], [0.07, 0.025]));
    } else if (kind === 1) {
      parts.push(lobe("恐象长躯与高大前肩", hide, [0, 2, 0], [2, 2.2, 4]), tapered("恐象前倾颈", hide, [[0, 2.2, 1.3], [0, 2.65, 2]], [0.62, 0.45]), lobe("恐象长而低的头颅", hide, [0, 2.55, 2.1], [1.12, 1.1, 1.5]), tapered("恐象长鼻", hide, [[0, 2.65, 2.6], [0, 1.6, 2.9], [0.1, 0.7, 2.9]], [0.18, 0.13, 0.03]), lobe("恐象突出的下颌联合部", dark, [0, 2.1, 2.55], [0.65, 0.44, 0.8])); fourFeet(parts, [0, 2.05, 1.15], [0, 1.85, -1.15], 0.65, 0.29);
      for (const side of [-1, 1]) parts.push(lobe("恐象宽耳", hide, [side * 0.56, 2.55, 1.6], [0.16, 0.88, 0.75]), tapered("下颌而非上颌长出的下弯门齿", pale, [[side * 0.2, 2.08, 2.7], [side * 0.23, 1.65, 2.95], [side * 0.2, 1.15, 2.75]], [0.12, 0.095, 0.008]));
      parts.push(...eyes([0, 2.75, 2.45], 0.4, 0.09));
    } else {
      parts.push(lobe("铲齿象低矮长腹", hide, [0, 1.15, -0.2], [1.28, 1.35, 2.9]), tapered("铲齿象前伸短颈", hide, [[0, 1.35, 0.8], [0, 1.5, 1.5]], [0.4, 0.28]), lobe("铲齿象扁长头", hide, [0, 1.48, 1.6], [0.77, 0.64, 0.95]), tapered("上唇形成的短宽鼻", hide, [[0, 1.58, 1.9], [0, 1.24, 2.12], [0, 1.11, 2.4]], [0.16, 0.14, 0.06])); fourFeet(parts, [0, 1.16, 0.6], [0, 1.03, -1.05], 0.43, 0.17);
      parts.push(polygon("铲齿象向前伸展的铲状下颌", dark, [[-0.13, -0.2], [0.13, -0.2], [0.28, 0.52], [0.3, 0.78], [-0.3, 0.78], [-0.28, 0.52]], 0.08, [0, 0.96, 1.78]), part("下颌前缘宽扁相接的门齿铲板", "box", pale, [0, 1.04, 2.48], [0.6, 0.07, 0.3]));
      for (const side of [-1, 1]) parts.push(lobe("铲齿象圆耳", hide, [side * 0.38, 1.52, 1.25], [0.11, 0.5, 0.42]), tapered("上颌短侧牙", pale, [[side * 0.2, 1.25, 1.89], [side * 0.34, 1.2, 2.25]], [0.055, 0.008])); parts.push(...eyes([0, 1.65, 1.85], 0.27, 0.055));
    }
  } else if (kind === 3) {
    parts.push(tapered("爪兽强壮前胸到低后腰", hide, [[0, 0.88, -0.9], [0, 1.25, 0], [0, 1.7, 0.65]], [0.38, 0.57, 0.55]), tapered("爪兽细长上举颈", hide, [[0, 1.65, 0.65], [0, 2, 0.92]], [0.3, 0.2]), lobe("爪兽似马的长面头", hide, [0, 2.05, 1.17], [0.45, 0.48, 0.86]));
    for (const side of [-1, 1]) { const hand: Triple = [side * 0.45, 0.12, 0.85]; parts.push(tapered("爪兽长于后肢的前臂和强腕", hide, [[side * 0.31, 1.55, 0.6], [side * 0.43, 0.75, 0.43], hand], [0.2, 0.14, 0.11]), lobe("前掌背面承重的指关节", dark, [hand[0], 0.07, 0.85], [0.25, 0.14, 0.3]), tapered("爪兽粗短弯曲后腿", hide, [[side * 0.3, 0.88, -0.65], [side * 0.42, 0.48, -0.4], [side * 0.43, 0.09, -0.74]], [0.23, 0.16, 0.09]), part("后掌", "box", dark, [side * 0.43, 0.045, -0.62], [0.21, 0.09, 0.34])); clawHand(parts, [hand[0], 0.21, 0.87], 0.13); parts.push(leaf("小长耳", hide, [side * 0.15, 2.2, 0.97], 0.12, 0.24, [0, 0, -side * 15])); }
    parts.push(...eyes([0, 2.17, 1.32], 0.16, 0.05));
  } else if (kind === 4) {
    parts.push(lobe("后弓兽无驼峰的细腰胸腹", hide, [0, 1.05, 0], [0.85, 1, 2.15]), tapered("后弓兽高举的长颈", hide, [[0, 1.35, 0.65], [0, 1.9, 0.95], [0, 2.4, 0.94]], [0.27, 0.19, 0.13]), lobe("后弓兽窄长头颅", hide, [0, 2.44, 1.1], [0.37, 0.4, 0.66]), tapered("高鼻孔位置复原的短柔吻", dark, [[0, 2.49, 1.33], [0, 2.31, 1.55], [0.035, 2.19, 1.52]], [0.095, 0.07, 0.018])); fourFeet(parts, [0, 1.1, 0.55], [0, 1.04, -0.7], 0.28, 0.09);
    for (const side of [-1, 1]) parts.push(leaf("后弓兽长耳", hide, [side * 0.12, 2.58, 0.93], 0.08, 0.2, [0, 0, side * -15])); parts.push(...eyes([0, 2.53, 1.26], 0.13, 0.04), tapered("下垂细尾", hide, [[0, 1.08, -0.91], [0, 0.3, -1.1]], [0.034, 0.012]));
  } else {
    parts.push(lobe("重脚兽桶形厚躯", hide, [0, 0.85, -0.25], [1.3, 1.25, 2.6]), lobe("重脚兽高额宽头和短粗颈", hide, [0, 1.1, 1.1], [0.95, 1.04, 1.1]), lobe("重脚兽宽短圆钝吻端", dark, [0, 0.95, 1.56], [0.73, 0.47, 0.5])); fourFeet(parts, [0, 0.88, 0.58], [0, 0.8, -1], 0.43, 0.18);
    for (const side of [-1, 1]) { parts.push(tapered("重脚兽并排而非前后排列的巨大鼻骨角", pale, [[side * 0.23, 1.3, 1.36], [side * 0.25, 1.78, 1.57], [side * 0.22, 2.12, 1.65]], [0.16, 0.11, 0.008]), needle("鼻角之后较小的额骨突", dark, [side * 0.22, 1.45, 0.93], [side * 0.23, 1.65, 0.98], 0.13), lobe("重脚兽短耳", hide, [side * 0.44, 1.36, 0.73], [0.12, 0.21, 0.19])); } parts.push(...eyes([0, 1.35, 1.45], 0.34, 0.06));
  }
  return parts;
}

function flightWing(root: Triple, halfSpan: number, side: number): ModelPart {
  return membrane("具有腕部弯折和飞羽外缘的完整前翼", hide, [[root[0], root[1], root[2]], [side * halfSpan * 0.48, root[1] + halfSpan * 0.14, root[2] + halfSpan * 0.03], [side * halfSpan, root[1] + halfSpan * 0.08, root[2] - halfSpan * 0.18], [side * halfSpan * 0.84, root[1], root[2] - halfSpan * 0.27], [side * halfSpan * 0.52, root[1] - halfSpan * 0.03, root[2] - halfSpan * 0.22], [root[0], root[1] - halfSpan * 0.1, root[2] - halfSpan * 0.18]]);
}

function earlyBird(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("骇鸟高大紧凑的骨盆胸躯", hide, [0, 1.1, 0], [0.68, 0.98, 1.04]), tapered("骇鸟上举后前弯的长颈", hide, [[0, 1.35, 0.32], [0, 1.9, 0.3], [0, 2.15, 0.57]], [0.15, 0.12, 0.14]), lobe("骇鸟侧扁而高大的头骨", hide, [0, 2.13, 0.78], [0.39, 0.57, 0.8]), tapered("骇鸟斧状向下钩的喙", pale, [[0, 2.24, 0.98], [0, 2.19, 1.28], [0, 1.95, 1.35]], [0.13, 0.14, 0.015])); biped(parts, [0, 0.95, 0], 0.18, 0.065, 0.27);
    for (const side of [-1, 1]) parts.push(leaf("骇鸟退化小翼", dark, [side * 0.25, 1.3, 0.1], 0.13, 0.28, [-130, side * 20, 0])); parts.push(...eyes([0, 2.26, 0.96], 0.14, 0.055));
  } else if (kind === 1) {
    parts.push(lobe("黄昏鸟修长的潜水躯体", hide, [0, 0.34, 0], [0.36, 0.48, 0.9]), tapered("黄昏鸟长颈", hide, [[0, 0.5, 0.31], [0, 0.7, 0.42], [0, 0.86, 0.66]], [0.08, 0.055, 0.045]), tapered("黄昏鸟细长的有齿上下颌", pale, [[0, 0.87, 0.67], [0, 0.85, 0.99], [0, 0.84, 1.09]], [0.045, 0.025, 0.003]), lobe("头颅", hide, [0, 0.87, 0.68], [0.12, 0.13, 0.22])); biped(parts, [0, 0.3, -0.27], 0.18, 0.035, 0.17, true);
    for (const side of [-1, 1]) { parts.push(beam("不承担飞行的残余肱骨", dark, [side * 0.13, 0.45, 0.12], [side * 0.18, 0.39, 0.08], 0.02)); for (let i = 0; i < 6; i++) parts.push(needle("潜水取食用的颌缘牙", pale, [side * 0.026, 0.845, 0.75 + i * 0.043], [side * 0.023, 0.825, 0.75 + i * 0.043], 0.007)); } parts.push(...eyes([0, 0.9, 0.74], 0.048, 0.018));
  } else if (kind === 5) {
    parts.push(lobe("伪齿鸟轻巧的滑翔胸体", hide, [0, 0.48, 0], [0.48, 0.5, 1.15]), tapered("伪齿鸟前伸长颈", hide, [[0, 0.55, 0.4], [0, 0.63, 0.85]], [0.12, 0.075]), lobe("伪齿鸟头", hide, [0, 0.64, 0.94], [0.23, 0.22, 0.4]), tapered("伪齿鸟长而窄的骨质喙", pale, [[0, 0.63, 1.05], [0, 0.59, 1.55], [0, 0.56, 1.67]], [0.055, 0.028, 0.003]));
    for (const side of [-1, 1]) { parts.push(flightWing([side * 0.15, 0.55, 0.2], 3.1, side)); const teeth: ModelPart[] = []; for (let i = 0; i < 12; i++) teeth.push(needle("与喙骨连为一体的伪齿突", pale, [side * (0.044 - i * 0.002), 0.59 - i * 0.002, 1.12 + i * 0.043], [side * (0.042 - i * 0.002), 0.55 - i % 2 * 0.015 - i * 0.002, 1.12 + i * 0.043], 0.013)); parts.push(combineMeshes("喙缘交错高低的完整伪齿列", pale, teeth)); } biped(parts, [0, 0.31, -0.25], 0.11, 0.025, 0.13, true); parts.push(...eyes([0, 0.7, 1.02], 0.081, 0.027));
  } else {
    const ornamental = kind === 4, jehol = kind === 3; const size = ornamental ? 0.75 : 1;
    parts.push(lobe("早期鸟类短小而羽被的胸躯", hide, [0, 0.19 * size, 0], [0.16 * size, 0.23 * size, 0.31 * size]), tapered("头颈连接", hide, [[0, 0.25 * size, 0.09 * size], [0, 0.37 * size, 0.15 * size]], [0.04 * size, 0.028 * size]), lobe("早期鸟类短头颅", hide, [0, 0.39 * size, 0.17 * size], [0.09 * size, 0.1 * size, 0.13 * size]), needle("短吻端", pale, [0, 0.38 * size, 0.21 * size], [0, 0.37 * size, 0.29 * size], 0.027 * size)); biped(parts, [0, 0.15 * size, 0], 0.045 * size, 0.012 * size, 0.055 * size);
    for (const side of [-1, 1]) { if (ornamental) { parts.push(tapered("耀龙缺少长飞羽的前肢", hide, [[side * 0.055, 0.24, 0.03], [side * 0.1, 0.18, 0.09], [side * 0.1, 0.13, 0.16]], [0.013, 0.01, 0.006])); clawHand(parts, [side * 0.1, 0.13, 0.16], 0.021); } else { parts.push(flightWing([side * 0.05, 0.27, 0.05], 0.32, side)); clawHand(parts, [side * 0.16, 0.29, 0.035], 0.018); } }
    if (jehol) {
      parts.push(tapered("热河鸟保留骨骼的长尾轴", hide, [[0, 0.19, -0.12], [0, 0.21, -0.35], [0, 0.25, -0.57]], [0.021, 0.012, 0.002]));
      for (let i = 0; i < 7; i++) { parts.push(leaf("尾根展开的近端羽扇", pale, [0, 0.2, -0.15], 0.022, 0.14, [-80, -50 + i * 16, 0]), leaf("长骨尾末端独立的第二羽区", dark, [0, 0.25, -0.52], 0.026, 0.17, [-85, -48 + i * 16, 0])); }
    } else for (let i = 0; i < (ornamental ? 4 : 2); i++) parts.push(leaf(ornamental ? "耀龙长条带状装饰尾羽" : "孔子鸟成对的长中尾羽", pale, [(i - (ornamental ? 1.5 : 0.5)) * 0.012, 0.16 * size, -0.1 * size], 0.017, ornamental ? 0.23 : 0.39, [-85, (i - (ornamental ? 1.5 : 0.5)) * 6, 0]));
    parts.push(...eyes([0, 0.41 * size, 0.2 * size], 0.032 * size, 0.012 * size));
  }
  return parts;
}

function giantReptile(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0 || kind === 1) {
    const mononykus = kind === 0; const h = mononykus ? 0.55 : 1.6;
    parts.push(lobe(mononykus ? "单爪龙轻细长躯" : "双脊龙纤长的兽脚类躯干", hide, [0, h, 0], mononykus ? [0.2, 0.3, 0.58] : [0.82, 1.05, 2.1]), tapered("前伸后上举的S形颈", hide, [[0, h + 0.08, mononykus ? 0.19 : 0.7], [0, h + (mononykus ? 0.18 : 0.55), mononykus ? 0.32 : 0.95], [0, h + (mononykus ? 0.22 : 0.8), mononykus ? 0.44 : 1.3]], mononykus ? [0.055, 0.04, 0.03] : [0.2, 0.14, 0.12]), lobe("窄长头颅", hide, [0, h + (mononykus ? 0.22 : 0.82), mononykus ? 0.48 : 1.52], mononykus ? [0.085, 0.09, 0.19] : [0.38, 0.45, 0.9]), tapered("伸直用于平衡的渐细长尾", hide, [[0, h, mononykus ? -0.2 : -0.8], [0, h - 0.05, mononykus ? -0.65 : -2.2], [0.08, h - 0.1, mononykus ? -0.97 : -3.5]], mononykus ? [0.055, 0.024, 0.0015] : [0.26, 0.12, 0.008])); biped(parts, [0, h - 0.04, mononykus ? -0.12 : -0.4], mononykus ? 0.07 : 0.25, mononykus ? 0.025 : 0.1, mononykus ? 0.11 : 0.38);
    for (const side of [-1, 1]) {
      if (mononykus) parts.push(tapered("单爪龙极短而强壮的上臂前臂", hide, [[side * 0.07, 0.58, 0.18], [side * 0.1, 0.54, 0.23], [side * 0.1, 0.57, 0.29]], [0.025, 0.023, 0.015]), tapered("单爪龙单枚粗大的掘挖指爪", pale, [[side * 0.1, 0.57, 0.29], [side * 0.1, 0.62, 0.32], [side * 0.1, 0.63, 0.29]], [0.017, 0.012, 0.0015]));
      else { parts.push(tapered("双脊龙未退化的三指前肢", hide, [[side * 0.27, 1.8, 0.65], [side * 0.4, 1.3, 0.8], [side * 0.34, 1.25, 1.1]], [0.09, 0.065, 0.04])); clawHand(parts, [side * 0.34, 1.25, 1.1], 0.1); const crest = polygon("双脊龙鼻眶上方成对薄骨冠", pale, [[-0.35, 0], [-0.18, 0.3], [0.15, 0.38], [0.34, 0.08]], 0.035, [side * 0.105, 2.53, 1.53]); crest.rotation = { x: -90, y: 0, z: -90 }; parts.push(crest); }
    }
    parts.push(...eyes([0, h + (mononykus ? 0.25 : 0.95), mononykus ? 0.52 : 1.7], mononykus ? 0.03 : 0.13, mononykus ? 0.012 : 0.045));
  } else {
    const amargasaurus = kind === 2;
    parts.push(lobe("蜥脚类深胸和长腹", hide, [0, 1.7, 0], [1.8, 2, 3.7]), tapered("从胸部向前平伸的长颈", hide, [[0, 2.05, 1.3], [0, 2.35, 2.7], [0, amargasaurus ? 2.7 : 1.2, 4]], [0.5, 0.28, 0.16]), tapered("渐细鞭状尾", hide, [[0, 1.8, -1.5], [0, 1.45, -3.5], [0.6, 0.9, -6]], [0.43, 0.19, 0.009])); fourFeet(parts, [0, 1.65, 1], [0, 1.65, -1.15], 0.65, 0.25);
    if (amargasaurus) { parts.push(lobe("阿马加龙小而长的头", hide, [0, 2.7, 4.22], [0.35, 0.36, 0.65]), ...eyes([0, 2.8, 4.34], 0.12, 0.043)); for (let i = 0; i < 12; i++) { const z = -0.7 + i * 0.37, y = 2.45 + Math.max(0, z - 1) * 0.07; for (const side of [-1, 1]) parts.push(tapered("阿马加龙颈背成对伸长的神经棘", pale, [[side * 0.1, y, z], [side * 0.25, y + 0.7 + Math.sin(i / 11 * Math.PI) * 0.6, z - 0.25], [side * 0.28, y + 1 + Math.sin(i / 11 * Math.PI) * 0.7, z - 0.5]], [0.06, 0.035, 0.004])); } }
    else { parts.push(lobe("尼日尔龙宽阔横展的头骨", hide, [0, 1.15, 4.2], [0.92, 0.4, 0.6]), part("超过头后宽度的横向齿列口缘", "box", dark, [0, 1.04, 4.46], [0.93, 0.1, 0.13]), ...eyes([0, 1.3, 4.1], 0.27, 0.06)); const row: ModelPart[] = []; for (let i = 0; i < 24; i++) row.push(needle("横向排列的密集细柱状牙", pale, [-0.44 + i * 0.038, 1.08, 4.51], [-0.44 + i * 0.038, 0.98, 4.51], 0.019)); parts.push(combineMeshes("尼日尔龙前端连续横齿排", pale, row)); }
  }
  return parts;
}

function oddReptile(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("幻龙细长水栖躯体", hide, [0, 0.26, 0], [0.52, 0.48, 1.45]), tapered("幻龙颈椎支持的长颈", hide, [[0, 0.3, 0.56], [0, 0.43, 1.05], [0, 0.42, 1.6]], [0.15, 0.095, 0.06]), lobe("幻龙低长颅骨", hide, [0, 0.42, 1.79], [0.24, 0.16, 0.55]), tapered("幻龙长而侧扁的尾", hide, [[0, 0.26, -0.6], [0, 0.18, -1.4], [0.1, 0.09, -2.1]], [0.17, 0.1, 0.006]), ...eyes([0, 0.48, 1.78], 0.08, 0.032));
    for (const side of [-1, 1]) for (const z of [-0.45, 0.4]) { const foot: Triple = [side * 0.62, 0.04, z + 0.11]; parts.push(tapered("保留肘膝关节的水栖四肢", hide, [[side * 0.17, 0.25, z], [side * 0.42, 0.12, z - 0.07], foot], [0.09, 0.065, 0.037]), polygon("五趾间发达而非完整鳍板的脚蹼", pale, [[-0.09, 0], [-0.14, 0.19], [-0.04, 0.23], [0.03, 0.21], [0.14, 0.17], [0.07, 0]], 0.012, foot)); } const teeth: ModelPart[] = []; for (const side of [-1, 1]) for (let i = 0; i < 9; i++) teeth.push(needle("幻龙细长交错的捕食锥齿", pale, [side * 0.07, 0.4, 1.67 + i * 0.043], [side * 0.064, 0.35, 1.67 + i * 0.043], 0.012)); parts.push(combineMeshes("幻龙颌缘锥齿", pale, teeth));
  } else if (kind === 1) {
    parts.push(lobe("镰龙弓背短躯", hide, [0, 0.16, 0], [0.14, 0.21, 0.27]), tapered("镰龙长颈及鸟状小头", hide, [[0, 0.2, 0.09], [0, 0.29, 0.15], [0, 0.3, 0.21]], [0.035, 0.019, 0.025]), tapered("镰龙向上盘卷的抓握尾", hide, [[0, 0.16, -0.1], [0, 0.08, -0.27], [0.01, 0.17, -0.39], [0, 0.28, -0.35], [0, 0.25, -0.28]], [0.03, 0.022, 0.014, 0.01, 0.004]), needle("抓握尾末端骨质钩", pale, [0, 0.25, -0.28], [0, 0.225, -0.3], 0.012));
    for (const side of [-1, 1]) { parts.push(tapered("镰龙特别粗壮的前肢", hide, [[side * 0.045, 0.2, 0.06], [side * 0.085, 0.13, 0.1], [side * 0.06, 0.08, 0.17]], [0.028, 0.022, 0.014]), tapered("前掌第二指发达的镰形爪", pale, [[side * 0.06, 0.08, 0.17], [side * 0.06, 0.03, 0.22], [side * 0.06, 0.008, 0.18]], [0.014, 0.01, 0.0015]), tapered("镰龙细小后肢", hide, [[side * 0.04, 0.16, -0.07], [side * 0.08, 0.06, -0.05], [side * 0.07, 0.012, 0]], [0.022, 0.014, 0.007])); } parts.push(...eyes([0, 0.312, 0.22], 0.019, 0.008));
  } else if (kind === 2) {
    parts.push(lobe("喙头龙类粗短宽腹", hide, [0, 0.35, -0.14], [0.65, 0.62, 1.08]), polygon("Hyperodapedon后宽前窄的三角头", hide, [[-0.25, -0.13], [0.25, -0.13], [0.15, 0.16], [0.065, 0.31], [-0.065, 0.31], [-0.15, 0.16]], 0.18, [0, 0.3, 0.53]), tapered("前颌骨形成的钩状无齿喙", pale, [[0, 0.42, 0.78], [0, 0.31, 0.93]], [0.065, 0.006]), tapered("后方厚尾", hide, [[0, 0.34, -0.6], [0, 0.15, -1.25]], [0.13, 0.005]), ...eyes([0, 0.49, 0.57], 0.16, 0.045));
    for (const side of [-1, 1]) for (const z of [-0.4, 0.3]) { parts.push(tapered("喙头龙类粗壮外展肢", hide, [[side * 0.2, 0.33, z], [side * 0.43, 0.2, z - 0.06], [side * 0.44, 0.04, z + 0.05]], [0.095, 0.07, 0.035])); for (let i = 0; i < 3; i++) parts.push(needle("着地爪趾", pale, [side * 0.44, 0.035, z + 0.05], [side * 0.44 + (i - 1) * 0.035, 0.008, z + 0.15], 0.014)); }
  } else {
    parts.push(lobe("盾龙短尾宽肋桶形躯干", hide, [0, 0.66, 0], [1.25, 1.2, 1.8]), lobe("盾龙粗短颈与厚颅", hide, [0, 0.75, 0.98], [0.74, 0.62, 0.72]), lobe("盾龙宽短下颌", dark, [0, 0.53, 1.18], [0.59, 0.25, 0.52]), tapered("盾龙短粗尾", hide, [[0, 0.62, -0.7], [0, 0.33, -1.15]], [0.19, 0.012])); fourFeet(parts, [0, 0.6, 0.55], [0, 0.57, -0.55], 0.5, 0.17, true);
    for (let i = 0; i < 24; i++) { const a = i * 2.4; parts.push(lobe("背部相互分离的厚骨质瘤", pale, [Math.cos(a) * 0.43, 0.95 + Math.sin(a) * 0.12, -0.6 + i % 6 * 0.22], [0.15, 0.09, 0.17])); }
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) parts.push(needle("颊部突出的骨性瘤棘", pale, [side * 0.26, 0.66 + i * 0.1, 0.86], [side * 0.42, 0.65 + i * 0.1, 0.88], 0.1)); parts.push(...eyes([0, 0.87, 1.18], 0.25, 0.06));
  }
  return parts;
}

const mammalNames = [["woollyMammoth", "猛犸象", "Mammuthus primigenius"], ["deinotherium", "恐象", "Deinotherium"], ["platybelodon", "铲齿象", "Platybelodon"], ["chalicotherium", "爪兽", "Chalicotherium"], ["macrauchenia", "后弓兽", "Macrauchenia"], ["arsinoitherium", "重脚兽", "Arsinoitherium"]];
const birdNames = [["phorusrhacos", "骇鸟", "Phorusrhacos"], ["hesperornis", "黄昏鸟", "Hesperornis"], ["confuciusornis", "孔子鸟", "Confuciusornis"], ["jeholornis", "热河鸟", "Jeholornis"], ["epidexipteryx", "耀龙", "Epidexipteryx"], ["pelagornis", "伪齿鸟", "Pelagornis"]];
const dinosaurNames = [["mononykus", "单爪龙", "Mononykus"], ["dilophosaurus", "双脊龙", "Dilophosaurus"], ["amargasaurus", "阿马加龙", "Amargasaurus"], ["nigersaurus", "尼日尔龙", "Nigersaurus"]];
const reptileNames = [["nothosaurus", "幻龙", "Nothosaurus"], ["drepanosaurus", "镰龙", "Drepanosaurus"], ["hyperodapedon", "Hyperodapedon（喙头龙类）", "Hyperodapedon"], ["scutosaurus", "盾龙（Scutosaurus）", "Scutosaurus"]];

export const extinctFormDesigns: MasterNatureDesign[] = [
  ...mammalNames.map(([key, name, taxon], i) => design(key!, name!, "动物", () => prehistoricMammal(i), ["古哺乳动物形态复原", taxon!])),
  ...birdNames.map(([key, name, taxon], i) => design(key!, name!, "动物", () => earlyBird(i), ["古鸟与羽被恐龙形态复原", taxon!])),
  ...dinosaurNames.map(([key, name, taxon], i) => design(key!, name!, "动物", () => giantReptile(i), ["古脊椎动物形态复原", taxon!])),
  ...reptileNames.map(([key, name, taxon], i) => design(key!, name!, "动物", () => oddReptile(i), ["古脊椎动物形态复原", taxon!])),
];
