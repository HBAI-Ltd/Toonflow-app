import { cap, combineMeshes, design, eyes, leaf, lobe, needle, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { fourFeet, hand, head } from "./mammalForms";
import { pointed } from "./insectForms";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { rayFin } from "./marine";

const fur = "#a8b69b";
const pale = "#c3c9ae";
const dark = "#899c87";

function whiskers(parts: ModelPart[], root: Triple, length: number) {
  const pieces: ModelPart[] = []; for (const side of [-1, 1]) for (let i = 0; i < 5; i++) pieces.push(needle("从吻侧长出的触须", pale, [root[0] + side * length * 0.12, root[1], root[2]], [root[0] + side * length, root[1] + (i - 2) * length * 0.12, root[2] + length * 0.2], length * 0.025)); parts.push(combineMeshes("完整的两侧吻须", pale, pieces));
}

function diggerFoot(parts: ModelPart[], root: Triple, side: number, width: number, claws: number) {
  const palm: Triple = [root[0] + side * width * 1.1, width * 0.4, root[2] + width * 0.1]; parts.push(tapered("粗短而侧展的掘土前肢", fur, [root, [palm[0], width, root[2]], palm], [width * 0.6, width * 0.42, width * 0.25]), lobe("横向翻出的宽掘土掌", pale, palm, [width * 1.4, width * 0.5, width]));
  const fingers: ModelPart[] = []; for (let i = 0; i < claws; i++) fingers.push(pointed("宽掌前缘真正独立的长铲爪", pale, [[palm[0] + (i - (claws - 1) / 2) * width * 0.36, palm[1], palm[2] + width * 0.25], [palm[0] + (i - (claws - 1) / 2) * width * 0.4, width * 0.25, palm[2] + width * 1.05], [palm[0] + (i - (claws - 1) / 2) * width * 0.4, width * 0.12, palm[2] + width * 1.2]], [width * 0.14, width * 0.09, 0])); parts.push(combineMeshes("一只完整的宽掌铲爪", pale, fingers));
}

function mammal(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("㺢㹢狓后高前收的短腰躯", fur, [0, 1.03, 0], [0.69, 0.84, 1.5]), tapered("㺢㹢狓比长颈鹿短而粗的直举颈", fur, [[0, 1.12, 0.47], [0, 1.64, 0.63]], [0.26, 0.14])); head(parts, [0, 1.73, 0.79], [0.3, 0.35, 0.48], 0.035, "none"); fourFeet(parts, [0, 0.98, 0.42], [0, 1.03, -0.46], 0.2, 0.066, false, true);
    for (const side of [-1, 1]) parts.push(leaf("㺢㹢狓侧上方的大杯形耳", pale, [side * 0.1, 1.84, 0.66], 0.12, 0.28, [-12, side * 35, side * -28]), tapered("雄性㺢㹢狓短而包皮的骨角", dark, [[side * 0.075, 1.87, 0.68], [side * 0.085, 2.01, 0.67]], [0.023, 0.01])); parts.push(tapered("短尾干与末端尾刷", fur, [[0, 1.09, -0.63], [0.035, 0.65, -0.8]], [0.025, 0.012]), lobe("尾尖长毛团", dark, [0.035, 0.64, -0.8], [0.075, 0.16, 0.07]));
  } else if (kind === 1 || kind === 2) {
    const serval = kind === 2, y = serval ? 0.51 : 0.65, length = serval ? 0.74 : 1.12;
    parts.push(lobe(serval ? "薮猫轻而窄的高腿躯" : "猎豹深胸细腰的长跑躯", fur, [0, y, 0], [serval ? 0.25 : 0.33, serval ? 0.35 : 0.42, length]), tapered("猫科高腿型头胸间相连的短颈", fur, [[0, y + 0.08, length * 0.3], [0, y + 0.17, length * 0.48]], [serval ? 0.065 : 0.09, serval ? 0.045 : 0.07]), lobe("胸部向腹侧下探的肺廓", fur, [0, y - 0.045, length * 0.24], [serval ? 0.27 : 0.38, serval ? 0.38 : 0.5, length * 0.48])); head(parts, [0, y + 0.18, length * 0.5], serval ? [0.19, 0.2, 0.23] : [0.21, 0.23, 0.26], 0.035, "none"); fourFeet(parts, [0, y + 0.01, length * 0.28], [0, y - 0.025, -length * 0.31], serval ? 0.09 : 0.13, serval ? 0.034 : 0.048);
    for (const side of [-1, 1]) parts.push(lobe(serval ? "薮猫远大于头宽的高圆耳" : "猎豹小而圆的外耳", pale, [side * (serval ? 0.075 : 0.08), y + (serval ? 0.34 : 0.27), length * 0.47], serval ? [0.115, 0.18, 0.038] : [0.065, 0.07, 0.034]));
    parts.push(tapered(serval ? "薮猫相对短的平衡尾" : "猎豹长而粗壮的平衡尾", dark, [[0, y, -length * 0.4], [0.09, y * 0.65, -length * 0.76], [0.17, y * 0.36, -length * (serval ? 1.05 : 1.28)]], [0.032, 0.031, 0.014]));
    if (!serval) { const nails: ModelPart[] = []; for (const side of [-1, 1]) for (const z of [-0.35, 0.345]) for (let i = 0; i < 3; i++) nails.push(needle("猎豹部分外露的短钝趾爪", pale, [side * 0.13 + (i - 1) * 0.018, 0.02, z + 0.05], [side * 0.13 + (i - 1) * 0.018, 0.008, z + 0.087], 0.009)); parts.push(combineMeshes("四足相连的外露短爪", pale, nails)); }
  } else if (kind === 3) {
    parts.push(tapered("马岛獴低长而柔软的细腰躯", fur, [[0, 0.29, -0.32], [0, 0.32, 0.05], [0, 0.36, 0.37]], [0.12, 0.15, 0.13])); parts.push(tapered("马岛獴头胸之间的连续短颈", fur, [[0, 0.36, 0.33], [0, 0.42, 0.44]], [0.105, 0.075])); head(parts, [0, 0.43, 0.47], [0.2, 0.21, 0.24], 0.055); fourFeet(parts, [0, 0.34, 0.25], [0, 0.27, -0.25], 0.11, 0.042, true); parts.push(tapered("与躯干近等长且不卷握的圆长尾", fur, [[0, 0.3, -0.32], [0.12, 0.16, -0.76], [0.27, 0.11, -1.05]], [0.06, 0.045, 0.018]));
  } else if (kind === 4) {
    parts.push(lobe("蜜熊短粗而长腰的树栖躯", fur, [0, 0.23, 0], [0.28, 0.31, 0.5])); parts.push(tapered("蜜熊躯体到短吻头的紧凑颈", fur, [[0, 0.26, 0.18], [0, 0.32, 0.245]], [0.08, 0.065])); head(parts, [0, 0.33, 0.27], [0.2, 0.2, 0.2], 0.025); fourFeet(parts, [0, 0.24, 0.14], [0, 0.22, -0.15], 0.1, 0.04, true); parts.push(tapered("蜜熊末端可抓握并真正弯成钩的长尾", fur, [[0, 0.24, -0.21], [0.11, 0.1, -0.48], [0.21, 0.1, -0.68], [0.27, 0.23, -0.67], [0.22, 0.29, -0.57]], [0.048, 0.043, 0.035, 0.025, 0.012]));
  } else if (kind === 5) {
    parts.push(lobe("沟齿鼩低而拱背的粗长躯", fur, [0, 0.1, 0], [0.12, 0.15, 0.28])); head(parts, [0, 0.12, 0.15], [0.08, 0.09, 0.1], 0, "round"); fourFeet(parts, [0, 0.085, 0.085], [0, 0.08, -0.085], 0.045, 0.012, true); parts.push(tapered("沟齿鼩向下弯且基部可动的长鼻", pale, [[0, 0.115, 0.18], [0, 0.1, 0.23], [0.007, 0.078, 0.25]], [0.018, 0.009, 0.003]), tapered("基部粗且裸露的长鳞尾", dark, [[0, 0.09, -0.12], [0.035, 0.035, -0.27], [0.07, 0.022, -0.39]], [0.016, 0.009, 0.002]));
  } else if (kind === 6) {
    parts.push(lobe("袋鼹前粗后细的圆筒形短躯", fur, [0, 0.043, 0], [0.062, 0.07, 0.14]), tapered("袋鼹无外耳的楔状头", pale, [[0, 0.044, 0.055], [0, 0.039, 0.105]], [0.025, 0.01]), lobe("吻端用于拱土的硬质鼻盾", dark, [0, 0.039, 0.107], [0.024, 0.027, 0.008]));
    for (const side of [-1, 1]) { diggerFoot(parts, [side * 0.019, 0.036, 0.04], side, 0.022, 2); parts.push(tapered("向侧后伸出的短后足", fur, [[side * 0.02, 0.032, -0.035], [side * 0.045, 0.012, -0.055]], [0.01, 0.006]), lobe("推送松土的后足掌", pale, [side * 0.045, 0.009, -0.055], [0.018, 0.012, 0.03])); } parts.push(pointed("袋鼹短而坚硬的裸尾", pale, [[0, 0.035, -0.06], [0.012, 0.016, -0.105]], [0.008, 0]));
  } else if (kind === 7) {
    parts.push(lobe("囊地鼠前肩厚后体圆的掘穴躯", fur, [0, 0.066, 0], [0.1, 0.1, 0.22]), lobe("囊地鼠宽颊头", fur, [0, 0.08, 0.105], [0.09, 0.085, 0.09]), ...eyes([0, 0.098, 0.13], 0.028, 0.006)); fourFeet(parts, [0, 0.06, 0.065], [0, 0.056, -0.065], 0.043, 0.014, true);
    for (const side of [-1, 1]) { const pocket = cap("在嘴外侧开口的颊囊入口", dark, [side * 0.044, 0.067, 0.118], 0.012, 0.014, 3); pocket.rotation.z = side * -90; parts.push(pocket, lobe("可以装食物的外颊囊膨起", pale, [side * 0.035, 0.077, 0.09], [0.044, 0.06, 0.055]), pointed("伸到闭合嘴唇外的弯门齿", pale, [[side * 0.009, 0.074, 0.14], [side * 0.009, 0.048, 0.16]], [0.007, 0])); } parts.push(tapered("囊地鼠短而裸露的触觉尾", dark, [[0, 0.05, -0.1], [0.02, 0.02, -0.19]], [0.006, 0.002]));
  } else if (kind === 8 || kind === 9) {
    const mara = kind === 8, length = mara ? 0.68 : 0.45, y = mara ? 0.4 : 0.25; parts.push(lobe(mara ? "巴塔哥尼亚豚鼠长腿上的高臀躯" : "刺豚鼠向后拱高的梨形躯", fur, [0, y, 0], mara ? [0.3, 0.43, length] : [0.22, 0.34, length]), lobe("强壮的后腿臀肌", fur, [0, y + 0.02, -length * 0.25], mara ? [0.32, 0.41, 0.34] : [0.25, 0.34, 0.26])); head(parts, [0, y + (mara ? 0.13 : 0.07), length * 0.39], mara ? [0.18, 0.23, 0.26] : [0.14, 0.16, 0.19], mara ? 0.045 : 0.025, "none"); fourFeet(parts, [0, y - 0.04, length * 0.26], [0, y, -length * 0.3], mara ? 0.1 : 0.075, mara ? 0.026 : 0.022);
    for (const side of [-1, 1]) parts.push(mara ? leaf("豚鼠类中格外直立的长耳", pale, [side * 0.06, y + 0.21, length * 0.34], 0.065, 0.12, [-8, side * 15, side * -10]) : lobe("刺豚鼠小圆耳", pale, [side * 0.05, y + 0.13, length * 0.33], [0.05, 0.064, 0.02])); parts.push(pointed("短到不形成外露长尾的尾端", dark, [[0, y, -length * 0.4], [0, y - 0.04, -length * 0.49]], [0.02, 0]));
  } else if (kind === 10) {
    parts.push(lobe("树鼩轻巧而弓背的小型树栖躯", fur, [0, 0.075, 0], [0.07, 0.095, 0.18])); head(parts, [0, 0.105, 0.09], [0.052, 0.052, 0.07], 0.035); fourFeet(parts, [0, 0.072, 0.05], [0, 0.068, -0.055], 0.028, 0.009, true); parts.push(tapered("树鼩有连续毛被的长而柔软尾", pale, [[0, 0.07, -0.075], [0.04, 0.04, -0.17], [0.08, 0.035, -0.28]], [0.014, 0.024, 0.006]));
  } else if (kind === 11) {
    parts.push(lobe("蹄兔无明显尾巴的圆桶状躯", fur, [0, 0.19, 0], [0.28, 0.31, 0.45])); head(parts, [0, 0.27, 0.19], [0.2, 0.18, 0.22], 0.02); fourFeet(parts, [0, 0.15, 0.12], [0, 0.15, -0.13], 0.1, 0.03);
    for (const side of [-1, 1]) for (const front of [true, false]) { const z = front ? 0.12 : -0.13, count = front ? 4 : 3; for (let toe = 0; toe < count; toe++) parts.push(lobe("蹄兔趾端扁平的蹄状短甲", pale, [side * 0.1 + (toe - (count - 1) / 2) * 0.012, 0.016, z + 0.047], [0.012, 0.009, 0.025])); } whiskers(parts, [0, 0.25, 0.28], 0.065);
  } else if (kind === 12) {
    parts.push(lobe("羚牛高耸前肩与厚重深胸", fur, [0, 0.94, 0.08], [0.85, 1.05, 1.62]), lobe("前背向上隆起的肩峰", fur, [0, 1.2, 0.4], [0.74, 0.63, 0.82]), tapered("粗短颈与向前弯的头位", fur, [[0, 1.05, 0.58], [0, 1.26, 0.91]], [0.32, 0.22])); head(parts, [0, 1.22, 1.06], [0.42, 0.45, 0.53], 0.06); parts.push(lobe("羚牛特有膨大而拱起的鼻梁", pale, [0, 1.25, 1.25], [0.29, 0.27, 0.35])); fourFeet(parts, [0, 0.98, 0.45], [0, 0.85, -0.5], 0.26, 0.105, false, true);
    for (const side of [-1, 1]) parts.push(pointed("粗角先侧展再向后上方回弯", dark, [[side * 0.14, 1.42, 0.95], [side * 0.33, 1.42, 0.89], [side * 0.39, 1.63, 0.77]], [0.075, 0.05, 0]), leaf("颌下下垂的粗长鬃须", pale, [side * 0.08, 1.08, 1.07], 0.16, 0.25, [155, 0, side * 15])); parts.push(tapered("羚牛短尾", fur, [[0, 0.98, -0.64], [0.03, 0.72, -0.81]], [0.055, 0.025]));
  } else if (kind === 13) {
    parts.push(lobe("鹿豚背部高拱而四肢修长的裸皮躯", fur, [0, 0.48, 0], [0.44, 0.55, 0.95])); head(parts, [0, 0.57, 0.48], [0.25, 0.3, 0.36], 0.11); fourFeet(parts, [0, 0.42, 0.26], [0, 0.42, -0.3], 0.15, 0.043, false, true);
    for (const side of [-1, 1]) { parts.push(pointed("鹿豚上犬齿穿过吻背并向额头后弯", pale, [[side * 0.06, 0.61, 0.62], [side * 0.09, 0.8, 0.68], [side * 0.08, 0.93, 0.58], [side * 0.06, 0.88, 0.46]], [0.018, 0.014, 0.008, 0]), pointed("下犬齿从口角向外上方弯曲", pale, [[side * 0.09, 0.52, 0.6], [side * 0.18, 0.64, 0.66], [side * 0.17, 0.78, 0.63]], [0.019, 0.013, 0])); } parts.push(tapered("鹿豚稀毛细尾", dark, [[0, 0.48, -0.4], [0.06, 0.22, -0.56]], [0.014, 0.005]));
  } else if (kind === 14 || kind === 15) {
    const finless = kind === 15, length = finless ? 1.45 : 1.85; parts.push(body(finless ? "江豚头圆吻短而无背鳍的流线躯" : "白鱀豚头小颈较活动的流线躯", [[-length * 0.5, 0.33, 0.025, 0.03], [-length * 0.23, 0.38, 0.12, 0.11], [length * 0.16, 0.4, 0.2, 0.17], [length * 0.39, 0.4, 0.11, 0.12], [length * (finless ? 0.42 : 0.48), 0.38, finless ? 0.04 : 0.045, 0.05]], fur));
    if (finless) parts.push(lobe("江豚没有分离长吻的圆钝额隆", fur, [0, 0.445, length * 0.36], [0.3, 0.23, 0.32]), membrane("背部取代背鳍的低矮纵脊", dark, [[0, 0.494, -0.3], [0, 0.525, -0.18], [0, 0.558, 0.03], [0, 0.561, 0.18], [0, 0.54, 0.03], [0, 0.51, -0.18]]));
    else parts.push(tapered("白鱀豚细长而稍微上翘的喙", pale, [[0, 0.37, length * 0.4], [0, 0.36, length * 0.63], [0, 0.385, length * 0.72]], [0.047, 0.028, 0.008]), membrane("白鱀豚躯干后段的低三角背鳍", dark, [[0, 0.49, -0.27], [0, 0.67, -0.24], [0, 0.57, -0.06], [0, 0.53, 0.03]]));
    for (const side of [-1, 1]) { parts.push(rayFin("具有真实肩部连接的胸鳍", [side * 0.13, 0.32, length * 0.2], [side * (finless ? 0.38 : 0.43), 0.15, length * 0.02], 0.12), membrane("左右展开且中央有缺口的水平尾叶", dark, [[0, 0.33, -length * 0.48], [side * 0.36, 0.35, -length * 0.59], [side * 0.29, 0.33, -length * 0.67], [side * 0.025, 0.33, -length * 0.57]]), lobe("头两侧小眼", dark, [side * 0.12, 0.44, length * 0.36], [0.018, 0.018, 0.018])); }
  } else if (kind === 16) {
    parts.push(lobe("鼷鹿后躯高拱前胸窄细的短躯", fur, [0, 0.22, 0], [0.2, 0.26, 0.43]), tapered("从细胸斜举的短颈", fur, [[0, 0.24, 0.15], [0, 0.33, 0.24]], [0.07, 0.043])); head(parts, [0, 0.35, 0.29], [0.1, 0.12, 0.15], 0.028); fourFeet(parts, [0, 0.19, 0.1], [0, 0.23, -0.12], 0.065, 0.013, false, true);
    for (const side of [-1, 1]) parts.push(pointed("雄鼷鹿从上唇侧露出的下向犬齿", pale, [[side * 0.022, 0.33, 0.35], [side * 0.026, 0.302, 0.36]], [0.004, 0])); parts.push(pointed("鼷鹿极短的尾", pale, [[0, 0.23, -0.18], [0.015, 0.2, -0.22]], [0.015, 0]));
  } else if (kind === 17) {
    parts.push(lobe("树袋鼠短腰而粗壮的攀树躯", fur, [0, 0.46, 0], [0.41, 0.68, 0.45])); parts.push(tapered("树袋鼠由肩背连续举起的短颈", fur, [[0, 0.68, 0.04], [0, 0.82, 0.08]], [0.1, 0.08])); head(parts, [0, 0.85, 0.09], [0.24, 0.25, 0.28], 0.055); for (const side of [-1, 1]) { const front: Triple = [side * 0.23, 0.12, 0.23], rear: Triple = [side * 0.17, 0.04, 0]; parts.push(tapered("与后肢长度较接近的强壮攀握前臂", fur, [[side * 0.1, 0.66, 0.03], [side * 0.26, 0.4, 0.15], front], [0.07, 0.05, 0.03]), tapered("适于树枝承重的短而粗后腿", fur, [[side * 0.14, 0.34, -0.08], [side * 0.25, 0.2, 0.03], rear], [0.09, 0.055, 0.03])); hand(parts, front, 0.07); hand(parts, rear, 0.085); } parts.push(tapered("树袋鼠长于头躯合计的下垂平衡尾", pale, [[0, 0.35, -0.15], [0.08, 0.1, -0.57], [0.18, 0.08, -1.05]], [0.075, 0.055, 0.025]));
  } else if (kind === 18) {
    parts.push(lobe("袋食蚁兽背腹稍扁的小型躯干", fur, [0, 0.085, 0], [0.08, 0.09, 0.23])); head(parts, [0, 0.11, 0.11], [0.055, 0.055, 0.075], 0.04); fourFeet(parts, [0, 0.078, 0.065], [0, 0.076, -0.07], 0.03, 0.01, true); const path: Triple[] = [[0, 0.075, -0.1], [0.04, 0.09, -0.2], [0.07, 0.13, -0.29]]; parts.push(tapered("袋食蚁兽向后上方举起的长尾干", fur, path, [0.008, 0.011, 0.003])); const brush: ModelPart[] = []; for (let i = 0; i < 28; i++) { const t = (i + 1) / 29, a = i * 2.4, root: Triple = [0.04 + t * 0.03, 0.09 + t * 0.04, -0.2 - t * 0.09]; brush.push(needle("尾干上的稀松瓶刷状长毛", pale, root, [root[0] + Math.cos(a) * 0.026, root[1] + Math.sin(a) * 0.026, root[2] - 0.012], 0.003)); } parts.push(combineMeshes("袋食蚁兽真正有体积的瓶刷尾", pale, brush));
  } else {
    parts.push(lobe("海狸鼠臀部厚而前颈收窄的水栖躯", fur, [0, 0.21, 0], [0.31, 0.36, 0.56])); head(parts, [0, 0.29, 0.25], [0.2, 0.21, 0.26], 0.03); fourFeet(parts, [0, 0.18, 0.15], [0, 0.17, -0.15], 0.11, 0.03);
    for (const side of [-1, 1]) { parts.push(membrane("海狸鼠后足独立足趾之间的泳蹼", pale, [[side * 0.11 - 0.025, 0.014, -0.15], [side * 0.11 + 0.025, 0.014, -0.15], [side * 0.11 + 0.037, 0.012, -0.065], [side * 0.11 - 0.037, 0.012, -0.065]]), pointed("明显伸到唇外的大门齿", pale, [[side * 0.014, 0.26, 0.38], [side * 0.014, 0.215, 0.39]], [0.009, 0])); } parts.push(tapered("海狸鼠圆截面而非扁桨形的裸长尾", dark, [[0, 0.18, -0.24], [0.11, 0.055, -0.47], [0.2, 0.03, -0.72]], [0.022, 0.015, 0.004])); whiskers(parts, [0, 0.27, 0.38], 0.11);
  }
  return parts;
}

const entries = [["okapi", "㺢㹢狓", "Okapia johnstoni"], ["cheetah", "猎豹", "Acinonyx jubatus"], ["serval", "薮猫", "Leptailurus serval"], ["fossa", "马岛獴", "Cryptoprocta ferox"], ["kinkajou", "蜜熊", "Potos flavus"], ["solenodon", "沟齿鼩", "Solenodon"], ["marsupialMole", "袋鼹", "Notoryctes"], ["pocketGopher", "囊地鼠", "Geomyidae"], ["mara", "巴塔哥尼亚豚鼠", "Dolichotis patagonum"], ["agouti", "刺豚鼠", "Dasyprocta"], ["treeShrew", "树鼩", "Tupaia belangeri"], ["hyrax", "蹄兔", "Procavia capensis"], ["takin", "羚牛", "Budorcas taxicolor"], ["babirusa", "鹿豚", "Babyrousa"], ["baiji", "白鱀豚", "Lipotes vexillifer"], ["finlessPorpoise", "江豚", "Neophocaena asiaeorientalis"], ["mouseDeer", "鼷鹿", "Tragulus"], ["treeKangaroo", "树袋鼠", "Dendrolagus"], ["numbat", "袋食蚁兽", "Myrmecobius fasciatus"], ["coypu", "海狸鼠", "Myocastor coypus"]];

export const distinctMammalDesigns: MasterNatureDesign[] = entries.map(([key, name, taxon], i) => design(key!, name!, "动物", () => mammal(i), [taxon!, "独立哺乳类形态", "真实体型"]));
