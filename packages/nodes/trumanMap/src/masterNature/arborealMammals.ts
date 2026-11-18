import { combineMeshes, design, eyes, leaf, lobe, needle, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { pointed } from "./insectForms";

const fur = "#a8b198";
const pale = "#c3c8ad";
const dark = "#8b9986";

function digits(parts: ModelPart[], root: Triple, size: number, opposable = true, clawed = false) {
  parts.push(lobe("灵长类相连的掌跖肉垫", pale, root, [size, size * 0.35, size * 1.1])); const fingers: ModelPart[] = [];
  for (let digit = 0; digit < 5; digit++) {
    const thumb = digit === 0 && opposable, x = root[0] + (digit - 2) * size * 0.17, end: Triple = thumb ? [root[0] - size * 0.75, root[1], root[2] + size * 0.18] : [x, root[1] + size * 0.07, root[2] + size * (0.72 + Math.sin(digit * 0.8) * 0.26)]; fingers.push(tapered(thumb ? "与其它四指方向实际分开的对握拇指" : "彼此分离且有屈曲的抓握指趾", pale, [[x, root[1], root[2]], [(x + end[0]) / 2, root[1] - size * 0.08, (root[2] + end[2]) / 2], end], [size * 0.085, size * 0.06, size * 0.035])); if (clawed && !thumb) fingers.push(pointed("狨猴多数指端外伸的爪状甲", dark, [end, [end[0], end[1] - size * 0.1, end[2] + size * 0.17]], [size * 0.045, 0]));
  }
  parts.push(combineMeshes("一只掌跖上完整相连的五枚指趾", pale, fingers));
}

function marmoset(): ModelPart[] {
  const parts: ModelPart[] = [lobe("普通狨猴短小而狭长的攀爬躯", fur, [0, 0.123, 0], [0.09, 0.16, 0.21]), tapered("狨猴从胸部实际相连的短颈", fur, [[0, 0.17, 0.055], [0, 0.21, 0.105]], [0.03, 0.025]), lobe("普通狨猴小而前额圆隆的头颅", fur, [0, 0.23, 0.11], [0.092, 0.102, 0.09]), lobe("狨猴短而圆钝的裸露口鼻", pale, [0, 0.216, 0.148], [0.05, 0.035, 0.04]), ...eyes([0, 0.241, 0.141], 0.026, 0.015)];
  for (const side of [-1, 1]) {
    const front: Triple = [side * 0.04, 0.012, 0.11], rear: Triple = [side * 0.051, 0.012, -0.008]; parts.push(tapered("普通狨猴较细的攀树前肢", fur, [[side * 0.026, 0.165, 0.04], [side * 0.052, 0.07, 0.075], front], [0.016, 0.011, 0.007]), tapered("狨猴后肢明显弯曲的膝与踝", fur, [[side * 0.025, 0.11, -0.045], [side * 0.07, 0.071, -0.055], rear], [0.023, 0.015, 0.008])); digits(parts, front, 0.023, false, true); digits(parts, rear, 0.026, true, true);
    const ear: Triple = [side * 0.041, 0.245, 0.098]; parts.push(lobe("普通狨猴真耳廓的薄软骨体积", dark, ear, [0.025, 0.036, 0.021])); const tufts: ModelPart[] = []; for (let i = 0; i < 9; i++) { const a = i / 8 * Math.PI - Math.PI / 2; tufts.push(needle("普通狨猴耳前向外辐射的长毛束", pale, ear, [ear[0] + side * (0.021 + Math.cos(a) * 0.019), ear[1] + Math.sin(a) * 0.03, ear[2] - 0.004], 0.004)); } parts.push(combineMeshes("狨猴独立于头部的扇状耳绒", pale, tufts));
  }
  parts.push(tapered("普通狨猴较长但并非可抓握钩形的尾", pale, [[0, 0.12, -0.085], [0.055, 0.055, -0.21], [0.12, 0.025, -0.34], [0.175, 0.04, -0.38]], [0.017, 0.022, 0.013, 0.004])); return parts;
}

function galago(): ModelPart[] {
  const parts: ModelPart[] = [lobe("南非婴猴腰短而后肢发达的小躯", fur, [0, 0.12, 0], [0.085, 0.15, 0.15]), tapered("婴猴活动头颅下面实际相连的颈", fur, [[0, 0.165, 0.025], [0, 0.2, 0.065]], [0.025, 0.022]), lobe("婴猴大眼之间短吻的圆头", fur, [0, 0.223, 0.075], [0.095, 0.104, 0.09]), lobe("婴猴凸出的短小湿鼻区", pale, [0, 0.207, 0.114], [0.031, 0.03, 0.035]), ...eyes([0, 0.23, 0.106], 0.026, 0.026)];
  for (const side of [-1, 1]) {
    const front: Triple = [side * 0.043, 0.011, 0.077], rear: Triple = [side * 0.052, 0.012, 0.025]; parts.push(tapered("婴猴纤细前臂", fur, [[side * 0.025, 0.151, 0.02], [side * 0.052, 0.065, 0.035], front], [0.013, 0.009, 0.006]), lobe("婴猴跳跃用的粗大后股", fur, [side * 0.037, 0.098, -0.026], [0.05, 0.085, 0.073]), tapered("婴猴特征性延长的跗骨与后足轴", fur, [[side * 0.049, 0.087, -0.035], [side * 0.072, 0.033, -0.053], rear], [0.013, 0.009, 0.005])); digits(parts, front, 0.023); digits(parts, rear, 0.025);
    const ear: Triple = [side * 0.034, 0.254, 0.051]; parts.push(leaf("婴猴薄而宽且有折线的可活动耳廓", pale, ear, 0.055, 0.06, [-22, side * 20, -side * 25]), tapered("婴猴耳廓内实际凸出的折叠软骨缘", dark, [ear, [ear[0] + side * 0.013, ear[1] + 0.034, ear[2] - 0.014], [ear[0] + side * 0.022, ear[1] + 0.039, ear[2] - 0.01]], [0.002, 0.0015, 0.0007]));
  }
  parts.push(tapered("南非婴猴长于头躯一倍以上的毛尾", pale, [[0, 0.13, -0.06], [0.055, 0.07, -0.17], [0.11, 0.03, -0.29], [0.16, 0.045, -0.32]], [0.014, 0.027, 0.025, 0.007])); return parts;
}

function mandrill(): ModelPart[] {
  const parts: ModelPart[] = [lobe("山魈重而深胸的雄体与短腰", fur, [0, 0.41, 0], [0.39, 0.53, 0.57]), lobe("山魈真正宽厚的前肩与斜颈", fur, [0, 0.61, 0.2], [0.34, 0.38, 0.35]), lobe("山魈前额有冠脊的长脸头颅", fur, [0, 0.76, 0.33], [0.27, 0.33, 0.31]), tapered("山魈上下颌前伸的长吻骨架", pale, [[0, 0.716, 0.4], [0, 0.685, 0.57]], [0.087, 0.054]), lobe("山魈宽厚鼻端", dark, [0, 0.695, 0.568], [0.09, 0.05, 0.035]), ...eyes([0, 0.794, 0.418], 0.082, 0.023)];
  for (const side of [-1, 1]) {
    const front: Triple = [side * 0.18, 0.028, 0.31], rear: Triple = [side * 0.17, 0.025, -0.11]; parts.push(tapered("山魈行走时长而强壮的前臂", fur, [[side * 0.1, 0.61, 0.16], [side * 0.19, 0.29, 0.21], front], [0.075, 0.052, 0.025]), tapered("山魈后腿弯曲的髋膝踝", fur, [[side * 0.1, 0.34, -0.12], [side * 0.22, 0.22, -0.19], rear], [0.078, 0.05, 0.026])); digits(parts, front, 0.065); digits(parts, rear, 0.07); parts.push(lobe("山魈长脸两侧的较小外耳", pale, [side * 0.107, 0.79, 0.277], [0.055, 0.077, 0.028]));
    const ridges: ModelPart[] = [];
    for (let ridge = 0; ridge < 4; ridge++) { const x = side * (0.042 + ridge * 0.009); ridges.push(tapered("山魈鼻侧独立隆起而非平面色条的纵嵴", dark, [[x, 0.756, 0.449], [x, 0.735, 0.488], [side * (0.027 + ridge * 0.006), 0.711, 0.541]], [0.005, 0.0055, 0.002])); } parts.push(combineMeshes("山魈鼻侧真实有高度和凹槽的颊脊", dark, ridges));
    const beard: ModelPart[] = []; for (let i = 0; i < 5; i++) beard.push(leaf("山魈颌下与脸侧的短厚胡须束", pale, [side * (0.025 + i * 0.014), 0.665 + i * 0.004, 0.4], 0.035, 0.09, [155, side * 20, side * 10])); parts.push(combineMeshes("山魈真实下垂的胡须体积", pale, beard));
  }
  const crest: ModelPart[] = []; for (let i = 0; i < 5; i++) crest.push(leaf("山魈前额到顶骨的短冠毛", dark, [(i - 2) * 0.016, 0.87, 0.3], 0.025, 0.055, [-20, i * 10, 0])); parts.push(combineMeshes("山魈有形体而非绘制色斑的头冠", dark, crest), tapered("山魈极短上翘的尾而非狒狒长鞭尾", fur, [[0, 0.46, -0.23], [0.025, 0.51, -0.31]], [0.026, 0.012])); return parts;
}

export const arborealMammalDesigns: MasterNatureDesign[] = [
  design("commonMarmoset", "普通狨猴", "动物", marmoset, ["Callithrix jacchus", "扇状耳绒与多数爪状指甲"]),
  design("southernGalago", "南非婴猴", "动物", galago, ["Galago moholi", "折叠大耳延长跗骨与粗毛长尾"]),
  design("mandrill", "山魈", "动物", mandrill, ["Mandrillus sphinx", "鼻侧立体颊脊与短尾雄体"]),
];
