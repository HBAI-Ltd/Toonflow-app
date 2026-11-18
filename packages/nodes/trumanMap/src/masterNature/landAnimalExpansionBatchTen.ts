import { combineMeshes, design, eyes, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#aab39b";
const pale = "#c8ccae";
const dark = "#81917b";

// https://www.nhm.ac.uk/discover/how-did-baryonyx-change-what-we-knew-about-spinosaurs.html
function baryonyx(): ModelPart[] {
  const parts: ModelPart[] = [body("重爪龙前胸厚而背线无棘龙高帆的躯", [[-1.3, 1.92, .3, .43], [-.55, 2.03, .55, .75], [.6, 2.1, .52, .69], [1.24, 2.17, .27, .44]], hide), tapered("重爪龙粗颈向前承托长吻", hide, [[0, 2.3, 1.0], [0, 2.68, 1.47], [0, 2.79, 1.9]], [.3, .24, .17]), lobe("重爪龙眼眶后方较高的短颅盒", hide, [0, 2.84, 2.03], [.37, .4, .53]), polygon("重爪龙中部收窄而端部膨成玫瑰结的上吻", pale, [[-.12, 1.97], [-.18, 2.17], [-.115, 2.54], [-.085, 2.88], [-.155, 3.13], [-.13, 3.31], [0, 3.39], [.13, 3.31], [.155, 3.13], [.085, 2.88], [.115, 2.54], [.18, 2.17], [.12, 1.97]], .2, [0, 2.66, 0]), polygon("重爪龙与上吻相隔薄口缝的狭长下颌", hide, [[-.12, 2.02], [-.13, 2.2], [-.085, 2.87], [-.125, 3.16], [0, 3.34], [.125, 3.16], [.085, 2.87], [.13, 2.2], [.12, 2.02]], .1, [0, 2.51, 0]), ...eyes([0, 2.95, 2.12], .14, .04), pointed("重爪龙在陆上平衡身体的长尾", hide, [[0, 1.9, -1.15], [.04, 1.69, -2.21], [.14, 1.49, -3.43], [.3, 1.36, -4.76], [.46, 1.4, -5.54]], [.36, .27, .15, .06, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("重爪龙发达后股与较长跗足", hide, [[side * .39, 1.99, -.57], [side * .64, 1.1, -.2], [side * .56, .36, -.61], [side * .54, .12, -.16]], [.28, .2, .085, .055]), lobe("重爪龙后足掌", dark, [side * .54, .09, -.02], [.27, .16, .4]), tapered("重爪龙强壮且显著长于暴龙的前臂", hide, [[side * .38, 2.19, .85], [side * .67, 1.64, 1.15], [side * .5, 1.47, 1.57]], [.13, .105, .065]), lobe("重爪龙厚掌", hide, [side * .5, 1.43, 1.65], [.18, .19, .27]));
    const digits: ModelPart[] = [pointed("重爪龙约三十一厘米弧长的巨大内侧拇爪", pale, [[side * .43, 1.45, 1.72], [side * .38, 1.34, 1.86], [side * .38, 1.21, 1.91]], [.057, .034, 0])];
    for (let i = 0; i < 2; i++) digits.push(pointed("重爪龙拇指外两枚较细的弯曲手指", pale, [[side * .51 + i * .05, 1.41, 1.73], [side * .53 + i * .055, 1.32, 1.93], [side * .53 + i * .055, 1.4, 1.97]], [.031, .019, 0]));
    for (let i = 0; i < 3; i++) digits.push(pointed("重爪龙三枚分离的前向足趾", dark, [[side * .54 + (i - 1) * .075, .1, .13], [side * .54 + (i - 1) * .11, .035, .45 + (i === 1 ? .06 : 0)]], [.041, 0]));
    parts.push(combineMeshes("重爪龙强拇指三指手与三趾后足", pale, digits));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 11; i++) { const z = 2.29 + i * .093, x = z > 3.03 ? .126 : z > 2.8 ? .085 : .12 - (z - 2.29) * .057; teeth.push(pointed("重爪龙狭长颌缘独立的圆锥齿", pale, [[side * x, 2.672, z], [side * x, 2.609, z + .008]], [.013, 0])); }
  parts.push(combineMeshes("重爪龙完整而非锯齿剪纸的圆锥齿列", pale, teeth));
  return parts;
}

// https://www.nhm.ac.uk/discover/dino-directory/allosaurus.html
function allosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("异特龙高髋深腹而颈胸较轻的躯", [[-1.35, 2.22, .33, .46], [-.59, 2.32, .57, .82], [.69, 2.42, .51, .73], [1.35, 2.51, .27, .43]], hide), tapered("异特龙弯曲并上举的肌肉颈", hide, [[0, 2.58, 1.03], [0, 3.04, 1.41], [0, 3.15, 1.79]], [.3, .24, .17]), lobe("异特龙低长而颌缘弯曲的头颅", hide, [0, 3.15, 2.09], [.47, .57, 1.01]), lobe("异特龙短宽鼻端", pale, [0, 3.03, 2.53], [.34, .28, .27]), lobe("异特龙向后变深的下颌", hide, [0, 2.82, 2.13], [.35, .23, .87]), ...eyes([0, 3.31, 2.06], .18, .051), pointed("异特龙长而粗根的平衡尾", hide, [[0, 2.2, -1.16], [.05, 1.98, -2.42], [.17, 1.76, -3.96], [.36, 1.58, -5.53], [.55, 1.59, -6.66]], [.4, .3, .17, .075, 0])];
  for (const side of [-1, 1]) {
    parts.push(part("异特龙眼上纵向薄骨嵴而非牛龙侧出巨角", "extrude", pale, [side * .18, 3.3, 2.02], [1, 1, 1], [0, 90, 0], { depth: .043, profile: [{ x: -.19, y: 0 }, { x: -.045, y: .16 }, { x: .105, y: .2 }, { x: .21, y: 0 }] }), tapered("异特龙粗大的股胫与足踝", hide, [[side * .4, 2.26, -.61], [side * .71, 1.24, -.21], [side * .61, .39, -.7], [side * .6, .13, -.2]], [.32, .23, .104, .067]), lobe("异特龙后足掌", dark, [side * .6, .095, -.035], [.32, .17, .46]), tapered("异特龙有力且长于暴龙的三指前臂", hide, [[side * .41, 2.47, .99], [side * .72, 1.97, 1.33], [side * .51, 1.73, 1.81]], [.12, .098, .058]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 3; i++) digits.push(pointed("异特龙前掌三枚强壮抓握钩指", pale, [[side * .51 + (i - 1) * .053, 1.73, 1.8], [side * .52 + (i - 1) * .061, 1.62, 2.05], [side * .52 + (i - 1) * .06, 1.75, 2.1]], [.035, .024, 0]), pointed("异特龙后足三枚长爪趾", dark, [[side * .6 + (i - 1) * .082, .1, .13], [side * .6 + (i - 1) * .123, .036, .54 + (i === 1 ? .08 : 0)]], [.047, 0]));
    parts.push(combineMeshes("异特龙完整三指手与三趾后足", pale, digits));
  }
  return parts;
}

// https://www.nps.gov/dino/learn/nature/ceratosaurus.htm
function ceratosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("角鼻龙深窄胸腹与较轻的高髋躯", [[-.94, 1.42, .22, .32], [-.35, 1.51, .39, .55], [.51, 1.61, .34, .49], [.98, 1.72, .18, .3]], hide), tapered("角鼻龙弯曲高颈", hide, [[0, 1.79, .76], [0, 2.13, 1.07], [0, 2.19, 1.35]], [.21, .16, .118]), lobe("角鼻龙高深而前部狭窄的颅", hide, [0, 2.19, 1.6], [.35, .5, .73]), lobe("角鼻龙较细的鼻端", pale, [0, 2.05, 1.91], [.27, .25, .27]), lobe("角鼻龙深而较短的下颌", hide, [0, 1.94, 1.66], [.27, .18, .62]), ...eyes([0, 2.31, 1.57], .13, .039), part("角鼻龙鼻骨中线真正上立的薄角冠", "extrude", pale, [0, 2.31, 1.82], [1, 1, 1], [0, 90, 0], { depth: .06, profile: [{ x: -.2, y: 0 }, { x: -.08, y: .37 }, { x: .1, y: .22 }, { x: .2, y: 0 }] }), pointed("角鼻龙尾基侧扁且向末端渐细的长尾", hide, [[0, 1.41, -.84], [.04, 1.25, -1.61], [.13, 1.11, -2.46], [.27, 1.03, -3.49]], [.25, .19, .1, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("角鼻龙强后肢和窄踝", hide, [[side * .28, 1.47, -.36], [side * .48, .85, -.03], [side * .42, .28, -.37], [side * .41, .09, -.03]], [.2, .14, .06, .035]), lobe("角鼻龙后足掌", dark, [side * .41, .066, .07], [.21, .115, .31]), tapered("角鼻龙不退化成牛龙小残肢的短前臂", hide, [[side * .26, 1.68, .65], [side * .44, 1.41, .83], [side * .34, 1.3, 1.09]], [.062, .047, .027]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 3; i++) digits.push(pointed("角鼻龙前掌三枚主抓握指", pale, [[side * .34 + (i - 1) * .026, 1.3, 1.09], [side * .35 + (i - 1) * .033, 1.23, 1.23], [side * .35 + (i - 1) * .034, 1.3, 1.27]], [.019, .012, 0]), pointed("角鼻龙三枚分离的长足趾", dark, [[side * .41 + (i - 1) * .051, .074, .18], [side * .41 + (i - 1) * .082, .025, .43 + (i === 1 ? .05 : 0)]], [.031, 0]));
    digits.push(pointed("角鼻龙前掌外侧缩小的第四指", pale, [[side * .4, 1.3, 1.09], [side * .435, 1.28, 1.16]], [.012, 0]));
    parts.push(combineMeshes("角鼻龙含缩小第四指的完整四指手与足趾", pale, digits));
  }
  const armor: ModelPart[] = [];
  const sections = [[-.94, 1.42, .32], [-.35, 1.51, .55], [.51, 1.61, .49], [.98, 1.72, .3]];
  for (let i = 0; i < 19; i++) { const z = .75 - i * .085, segment = z < -.35 ? 0 : z < .51 ? 1 : 2, a = sections[segment]!, b = sections[segment + 1]!, t = (z - a[0]!) / (b[0]! - a[0]!), y = a[1]! + a[2]! + (b[1]! + b[2]! - a[1]! - a[2]!) * t - .018; armor.push(lobe("角鼻龙背中线实际存在的细小皮骨片", pale, [0, y, z], [.045, .07, .105])); }
  parts.push(combineMeshes("角鼻龙从颈后至尾根的低矮中线骨甲", pale, armor));
  return parts;
}

// https://www.nhm.ac.uk/discover/dino-directory/shunosaurus.html
// 尾椎膨大结构参考Dong等(1989)及 https://pmc.ncbi.nlm.nih.gov/articles/PMC4580109/。
function shunosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("蜀龙较低宽腹且前后肢高度接近的躯", [[-1.5, 1.86, .38, .59], [-.64, 1.98, .73, .95], [.65, 2.0, .69, .88], [1.45, 1.93, .37, .57]], hide), tapered("蜀龙相对梁龙更短粗的平缓上举颈", hide, [[0, 2.1, 1.15], [0, 2.39, 1.97], [0, 2.71, 2.84], [0, 2.95, 3.55]], [.39, .29, .2, .125]), lobe("蜀龙短而较深的宽吻小颅", pale, [0, 2.97, 3.82], [.35, .36, .65]), lobe("蜀龙宽圆的匙齿前吻外廓", hide, [0, 2.87, 4.09], [.3, .19, .25]), ...eyes([0, 3.05, 3.8], .132, .035), tapered("蜀龙尾根至膨大尾椎前端的肌肉尾", hide, [[0, 1.84, -1.32], [.05, 1.61, -2.29], [.17, 1.37, -3.37], [.33, 1.17, -4.34], [.46, 1.1, -5.05]], [.39, .27, .16, .09, .047]), lobe("蜀龙由膨大融合尾椎构成的纺锤状小骨锤", pale, [.48, 1.1, -5.15], [.29, .3, .55])];
  for (const side of [-1, 1]) {
    parts.push(tapered("蜀龙直立较短前肢", hide, [[side * .49, 1.89, .9], [side * .59, .91, .93], [side * .59, .21, 1.02]], [.23, .16, .12]), lobe("蜀龙柱状前掌", hide, [side * .59, .14, 1.04], [.35, .26, .39]), tapered("蜀龙较粗的直立后肢", hide, [[side * .5, 1.9, -.94], [side * .65, .95, -.8], [side * .61, .2, -1.02]], [.28, .19, .13]), lobe("蜀龙宽厚后足", hide, [side * .61, .13, -.94], [.43, .24, .51]), pointed("蜀龙尾锤上前对低矮锥形皮骨突", pale, [[.48 + side * .09, 1.17, -5.03], [.48 + side * .13, 1.21, -5.03]], [.038, 0]), pointed("蜀龙尾锤上后对低矮锥形皮骨突", pale, [[.48 + side * .085, 1.17, -5.23], [.48 + side * .12, 1.21, -5.23]], [.035, 0]));
    const toes: ModelPart[] = [];
    for (let i = 0; i < 3; i++) toes.push(lobe("蜀龙后足分离的三枚主爪趾", pale, [side * .61 + (i - 1) * .105, .095, -.72], [.09, .1, .18]));
    toes.push(pointed("蜀龙前掌内侧的单枚拇爪", pale, [[side * .47, .17, 1.12], [side * .38, .085, 1.3]], [.061, 0]));
    parts.push(combineMeshes("蜀龙完整的前后足爪趾", pale, toes));
  }
  return parts;
}

export const landAnimalExpansionBatchTenDesigns: MasterNatureDesign[] = [
  design("baryonyx", "重爪龙", "动物", baryonyx, ["Baryonyx walkeri", "无高帆玫瑰结长吻圆锥齿与三指巨拇爪"]),
  design("allosaurus", "异特龙", "动物", allosaurus, ["Allosaurus", "眼上薄骨嵴长深颅与强壮三指前臂"]),
  design("ceratosaurus", "角鼻龙", "动物", ceratosaurus, ["Ceratosaurus", "鼻中线薄角冠四指前掌及低矮背中线骨甲"]),
  design("shunosaurus", "蜀龙", "动物", shunosaurus, ["Shunosaurus lii", "短粗颈柱状四足与融合尾椎纺锤骨锤"]),
];
