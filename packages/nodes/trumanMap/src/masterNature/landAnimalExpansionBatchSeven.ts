import { combineMeshes, design, eyes, leaf, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#a9b19a";
const pale = "#c6c9ac";
const dark = "#819079";

// https://australian.museum/learn/australia-over-time/extinct-animals/procoptodon-goliah/
function procoptodon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("短面巨袋鼠明显较粗重且不能完全伸直的胸腹", hide, [0, 1.0, -.015], [.65, 1.15, .69], [9, 0, 0]), lobe("短面巨袋鼠宽大承重骨盆", hide, [0, .59, -.12], [.76, .66, .73]), tapered("短面巨袋鼠从高胸伸出的短粗颈", hide, [[0, 1.4, .12], [0, 1.6, .25]], [.16, .11]), lobe("短面巨袋鼠短深且前面平的颅", pale, [0, 1.7, .32], [.31, .35, .29]), lobe("短面巨袋鼠发达下颌及清楚的下巴", hide, [0, 1.54, .36], [.27, .19, .26]), ...eyes([0, 1.74, .429], .087, .024), tapered("短面巨袋鼠从骨盆下垂再触地的粗重尾", hide, [[0, .64, -.36], [.03, .29, -.72], [.1, .1, -1.16], [.14, .1, -1.32]], [.2, .14, .06, .025])];
  for (const side of [-1, 1]) {
    parts.push(leaf("短面巨袋鼠颅后短宽而直立的外耳", pale, [side * .1, 1.8, .26], .11, .24, [-7, 0, -side * 12]), lobe("短面巨袋鼠粗壮后股", hide, [side * .25, .48, -.07], [.32, .5, .42]), tapered("短面巨袋鼠宽跟骨连接长跗掌的后肢", hide, [[side * .27, .47, -.12], [side * .34, .17, -.17], [side * .3, .055, .11]], [.085, .064, .038]), lobe("短面巨袋鼠只有一枚功能趾的宽厚后掌", dark, [side * .3, .045, .22], [.105, .067, .36]), pointed("短面巨袋鼠唯一后趾末端的蹄状宽爪", pale, [[side * .3, .058, .34], [side * .3, .028, .48]], [.045, 0]), tapered("短面巨袋鼠长而能抓枝的前臂", hide, [[side * .23, 1.34, .13], [side * .38, 1.05, .36], [side * .29, .88, .63]], [.065, .05, .032]), lobe("短面巨袋鼠长掌", pale, [side * .29, .85, .67], [.11, .105, .19]));
    const fingers: ModelPart[] = [];
    for (let i = 0; i < 2; i++) fingers.push(pointed("短面巨袋鼠特别延长的两枚中指及回钩爪", pale, [[side * .29 + (i - .5) * .04, .85, .71], [side * .29 + (i - .5) * .043, .78, .89], [side * .29 + (i - .5) * .044, .89, .94]], [.023, .016, 0]));
    for (const sideFinger of [-1, 1]) fingers.push(pointed("短面巨袋鼠长双指外的较短侧指", pale, [[side * .29 + sideFinger * .043, .85, .68], [side * .29 + sideFinger * .058, .82, .77]], [.014, 0]));
    parts.push(combineMeshes("短面巨袋鼠区别于普通袋鼠的长双钩手", pale, fingers));
  }
  return parts;
}

// https://australian.museum/Thylacoleo-carnifex/?s=1&vm=r
function thylacoleo(): ModelPart[] {
  const parts: ModelPart[] = [lobe("袋狮前胸较深而腰短的强壮躯", hide, [0, .51, -.055], [.44, .59, .8]), lobe("袋狮发达的前肩而非狮鬃", hide, [0, .64, .19], [.48, .5, .38]), tapered("袋狮连接短深头颅的粗颈", hide, [[0, .63, .24], [0, .74, .39]], [.145, .12]), lobe("袋狮宽圆深颅和较短的面", pale, [0, .77, .47], [.31, .35, .3]), lobe("袋狮厚下颌与短吻", hide, [0, .65, .55], [.25, .14, .23]), ...eyes([0, .825, .54], .098, .025), tapered("袋狮区别于无尾袋熊的粗根平衡尾", hide, [[0, .48, -.4], [.07, .31, -.64], [.14, .15, -.89]], [.09, .065, .018])];
  for (const side of [-1, 1]) {
    parts.push(lobe("袋狮颅后圆外耳", hide, [side * .119, .87, .38], [.075, .11, .055]), pointed("袋狮位于颌前而非嘴角的刺状上门齿", pale, [[side * .036, .724, .61], [side * .037, .646, .666]], [.025, 0]), part("袋狮颊部狭长刀刃状切割前臼齿", "extrude", pale, [side * .105, .65, .5], [1, 1, 1], [0, 90, 0], { depth: .025, profile: [{ x: -.059, y: 0 }, { x: .059, y: 0 }, { x: .043, y: .047 }, { x: -.04, y: .054 }] }));
    for (const front of [true, false]) {
      const z = front ? .2 : -.28, ankle: Triple = [side * .19, .046, z + .052];
      parts.push(tapered(front ? "袋狮极强壮的攀抓前臂" : "袋狮较细的后肢", hide, [[side * .15, front ? .59 : .46, z], [side * .23, .28, z - .035], ankle], front ? [.081, .06, .032] : [.068, .05, .026]), lobe("袋狮宽短足掌", dark, [ankle[0], .035, ankle[2] + .034], [.092, .052, .14]));
      const digits: ModelPart[] = [];
      for (let i = 0; i < 4; i++) digits.push(pointed("袋狮足掌上相互分离的四枚小爪趾", pale, [[ankle[0] + (i - 1.5) * .017, .04, ankle[2] + .075], [ankle[0] + (i - 1.5) * .022, .016, ankle[2] + .132]], [.008, 0]));
      if (front) digits.push(pointed("袋狮能向内对握且特别粗大的拇指巨钩爪", pale, [[ankle[0] - side * .038, .062, ankle[2] + .022], [ankle[0] - side * .082, .05, ankle[2] + .09], [ankle[0] - side * .069, .092, ankle[2] + .12]], [.026, .017, 0]));
      parts.push(combineMeshes("袋狮含前掌对握巨拇爪的完整趾结构", pale, digits));
    }
  }
  return parts;
}

// https://www.nps.gov/flfo/learn/kidsyouth/brontotheres-mesohippus-and-oreodonts-oh-my.htm
function megacerops(): ModelPart[] {
  const parts: ModelPart[] = [lobe("巨角犀宽腹鞍状背线的庞大躯", hide, [0, 1.64, -.1], [1.6, 1.87, 3.07], [-5, 0, 0]), lobe("巨角犀发达且高于中背的前肩", hide, [0, 1.99, .92], [1.35, 1.6, 1.27]), tapered("巨角犀短而厚的低颈", hide, [[0, 1.92, .99], [0, 1.83, 1.49]], [.43, .34]), lobe("巨角犀长而后部凹陷的深大颅", hide, [0, 1.88, 1.9], [.77, .77, 1.18]), lobe("巨角犀鼻端分叉骨突下的宽短口吻", pale, [0, 1.67, 2.41], [.62, .35, .4]), ...eyes([0, 2.06, 2.02], .29, .05), tapered("巨角犀后垂的细长尾", hide, [[0, 1.65, -1.37], [.09, .9, -1.75], [.14, .41, -1.81]], [.075, .043, .014])];
  parts.push(lobe("巨角犀两鼻骨角共享的低宽骨基", pale, [0, 2.19, 2.22], [.47, .23, .31]));
  for (const side of [-1, 1]) {
    parts.push(tapered("巨角犀鼻端横分的钝圆骨角而非纵列犀角", pale, [[side * .1, 2.21, 2.24], [side * .31, 2.43, 2.26], [side * .36, 2.67, 2.2]], [.14, .115, .055]), leaf("巨角犀颅后较大的椭圆耳", hide, [side * .28, 2.13, 1.47], .22, .34, [-15, side * 25, -side * 35]));
    for (const front of [true, false]) {
      const z = front ? .91 : -1.0, ankle: Triple = [side * .5, .19, z + .07];
      parts.push(tapered("巨角犀粗壮直立的四肢", hide, [[side * .43, front ? 1.64 : 1.4, z], [side * .56, .78, z - .07], ankle], [.28, .21, .12]), lobe("巨角犀宽厚足掌", hide, [ankle[0], .145, ankle[2] + .055], [.42, .25, .49]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < (front ? 4 : 3); i++) toes.push(lobe("巨角犀前四后三区别的钝蹄趾", dark, [ankle[0] + (i - (front ? 1.5 : 1)) * .085, .11, ankle[2] + .22], [.082, .15, .17]));
      parts.push(combineMeshes("巨角犀完整奇蹄足端", dark, toes));
    }
  }
  return parts;
}

// https://www.austintexas.gov/sites/default/files/files/Dino_PDF.pdf
function edaphosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("基龙与异齿龙不同的宽大发酵腹躯", [[-.68, .39, .21, .22], [-.25, .48, .43, .38], [.36, .49, .4, .35], [.71, .43, .18, .2]], hide), tapered("基龙从宽躯前部伸出的细短颈", hide, [[0, .47, .61], [0, .5, .86]], [.13, .075]), lobe("基龙明显小于捕食型异齿龙的短食草头", pale, [0, .52, .98], [.23, .24, .3]), lobe("基龙短钝口吻与厚颏", hide, [0, .45, 1.08], [.19, .12, .19]), ...eyes([0, .59, 1.005], .079, .018), pointed("基龙后部逐渐变尖的长尾", hide, [[0, .36, -.6], [.08, .28, -1.1], [.23, .17, -1.68], [.37, .14, -2.04]], [.17, .12, .06, 0]), part("基龙沿宽背连续延伸的帆状软组织简化", "extrude", hide, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .045, profile: [{ x: -.62, y: .71 }, { x: -.4, y: 1.19 }, { x: -.13, y: 1.45 }, { x: .2, y: 1.49 }, { x: .53, y: 1.28 }, { x: .79, y: .51 }, { x: .4, y: .73 }, { x: -.26, y: .8 }] })];
  for (const side of [-1, 1]) for (const front of [true, false]) {
    const z = front ? .42 : -.43, ankle: Triple = [side * .59, .048, z + .09];
    parts.push(tapered("基龙肘膝侧展且粗短的四肢", hide, [[side * .27, .4, z], [side * .57, .22, z - .1], ankle], [.11, .079, .04]), lobe("基龙接地的宽扁足掌", dark, [ankle[0], .04, ankle[2] + .04], [.16, .063, .23]));
    const toes: ModelPart[] = [];
    for (let i = 0; i < 5; i++) toes.push(pointed("基龙前后掌相互分离的五枚小趾", pale, [[ankle[0] + (i - 2) * .025, .04, ankle[2] + .1], [ankle[0] + (i - 2) * .036, .013, ankle[2] + .21]], [.014, 0]));
    parts.push(combineMeshes("基龙完整五趾爪足", pale, toes));
  }
  const spines: ModelPart[] = [];
  for (let i = 0; i < 9; i++) {
    const z = .54 - i * .145, top = .87 + .6 * Math.sin((i + 1) / 10 * Math.PI), root: Triple = [0, .72, z];
    spines.push(tapered("基龙帆内真实高伸的神经棘", pale, [root, [0, top, z - .035]], [.018, .01]));
    for (const level of [.55, .78]) { const y = .72 + (top - .72) * level; spines.push(tapered("基龙神经棘上向两侧突出的特有横杆", pale, [[-.075, y, z - .02], [0, y, z - .02], [.075, y, z - .02]], [.006, .011, .006])); }
  }
  for (let i = 0; i < spines.length; i += 9) parts.push(combineMeshes("基龙与平直异齿龙帆不同的带横杆棘列", pale, spines.slice(i, i + 9)));
  return parts;
}

export const landAnimalExpansionBatchSevenDesigns: MasterNatureDesign[] = [
  design("procoptodon", "短面巨袋鼠", "动物", procoptodon, ["Procoptodon goliah", "短平深颅单趾宽后掌与双钩长指"]),
  design("thylacoleo", "袋狮", "动物", thylacoleo, ["Thylacoleo carnifex", "刺状门齿刃状颊齿与对握巨拇爪"]),
  design("megacerops", "巨角犀", "动物", megacerops, ["Megacerops coloradensis", "横分钝骨角鞍背与前四后三蹄趾"]),
  design("edaphosaurus", "基龙", "动物", edaphosaurus, ["Edaphosaurus", "小食草头宽腹和带横杆高神经棘帆"]),
];
