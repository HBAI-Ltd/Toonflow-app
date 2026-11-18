import { combineMeshes, design, eyes, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#a8b199";
const pale = "#c6cbae";
const dark = "#82917c";

// https://www.nhm.ac.uk/discover/dino-directory/corythosaurus.html
function corythosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("盔龙高髋深胸且有较强腰背的鸭嘴龙躯", [[-1.11, 1.63, .31, .48], [-.5, 1.76, .55, .79], [.55, 1.78, .52, .75], [1.1, 1.83, .27, .43]], hide), tapered("盔龙后厚前细且弯曲上举的肌肉颈", hide, [[0, 1.99, .87], [0, 2.42, 1.29], [0, 2.78, 1.69]], [.3, .25, .17]), lobe("盔龙后部深而鼻吻渐扁的头颅", hide, [0, 2.94, 2.0], [.43, .5, .74]), lobe("盔龙横展的扁平鸭嘴吻而非禽龙尖窄喙", pale, [0, 2.79, 2.37], [.41, .18, .4]), lobe("盔龙宽低下颌与厚颏", hide, [0, 2.7, 2.14], [.35, .18, .67]), ...eyes([0, 3.045, 2.01], .155, .04), part("盔龙侧扁且近圆形的高盔状鼻额骨冠外廓", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .09, profile: [{ x: -1.77, y: 3.08 }, { x: -1.65, y: 3.47 }, { x: -1.81, y: 3.79 }, { x: -2.12, y: 3.94 }, { x: -2.4, y: 3.81 }, { x: -2.53, y: 3.53 }, { x: -2.45, y: 3.22 }, { x: -2.26, y: 3.1 }] }), pointed("盔龙根部深而被骨化肌腱加强的长平衡尾", hide, [[0, 1.58, -.97], [.03, 1.28, -2.19], [.12, 1.08, -3.62], [.31, .94, -4.92], [.49, .91, -6.08]], [.35, .27, .16, .071, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("盔龙长而较直的承重前肢", hide, [[side * .36, 1.76, .75], [side * .57, .94, .92], [side * .53, .15, 1.0]], [.13, .087, .05]), lobe("盔龙第二三四指共同包成的前掌承重蹄套", dark, [side * .53, .105, 1.065], [.23, .18, .27]), tapered("盔龙粗壮股部及后折胫跗", hide, [[side * .4, 1.71, -.59], [side * .71, 1.0, -.26], [side * .62, .31, -.68], [side * .61, .105, -.43]], [.25, .17, .074, .046]), lobe("盔龙三趾后足宽掌", dark, [side * .61, .08, -.32], [.26, .13, .4]), tapered("盔龙前掌外侧不包入蹄套的第五抓握指", hide, [[side * .59, .3, 1.005], [side * .67, .23, 1.12], [side * .68, .3, 1.19]], [.027, .021, .013]));
    const toes: ModelPart[] = [];
    for (let i = 0; i < 3; i++) {
      toes.push(lobe("盔龙后足三枚宽钝蹄趾", pale, [side * .61 + (i - 1) * .087, .064, -.14], [.082, .09, .2]), lobe("盔龙前掌合并皮套前方三枚低矮趾甲", pale, [side * .53 + (i - 1) * .061, .078, 1.165], [.056, .078, .084]));
    }
    parts.push(combineMeshes("盔龙有蹄前掌与三趾后足的完整末端", pale, toes));
  }
  return parts;
}

// https://www.nature.com/articles/s41598-017-08658-8
function shringasaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("双角龙前肩隆起而后腰较细的长四足躯", [[-.76, .64, .19, .27], [-.29, .73, .36, .41], [.42, .84, .33, .43], [.76, .88, .18, .28]], hide), tapered("双角龙明显长于冠鳄兽的上举长颈", hide, [[0, .94, .62], [0, 1.08, 1.02], [0, 1.23, 1.36]], [.19, .145, .095]), lobe("双角龙长颈末端相对小而短圆的头", hide, [0, 1.275, 1.515], [.265, .28, .38]), lobe("双角龙短圆无鸟喙的鼻吻", pale, [0, 1.22, 1.69], [.23, .135, .19]), lobe("双角龙较窄的食草下颌", hide, [0, 1.105, 1.56], [.195, .14, .35]), ...eyes([0, 1.34, 1.54], .094, .025), pointed("双角龙长而逐渐侧弯的粗根尾", hide, [[0, .61, -.65], [.04, .42, -1.06], [.15, .27, -1.54], [.32, .2, -1.97]], [.2, .14, .07, 0])];
  for (const side of [-1, 1]) {
    parts.push(pointed("双角龙眼上朝前上方而非后弯的成对骨角", pale, [[side * .083, 1.36, 1.45], [side * .103, 1.54, 1.54], [side * .115, 1.62, 1.62]], [.055, .036, 0]));
    for (const front of [true, false]) {
      const z = front ? .5 : -.48, ankle: Triple = [side * (front ? .44 : .47), .077, z + .14];
      parts.push(tapered(front ? "双角龙宽肩下较长且肘部外展的前肢" : "双角龙粗短且膝侧展的后肢", hide, [[side * .23, front ? .88 : .67, z], [side * .5, front ? .43 : .33, z - .06], ankle], front ? [.108, .079, .038] : [.14, .092, .041]), lobe("双角龙带五枚短爪的贴地宽掌", dark, [ankle[0], .054, ankle[2] + .055], [.18, .09, .23]));
      const digits: ModelPart[] = [];
      for (let i = 0; i < 5; i++) digits.push(pointed("双角龙长颈干群主龙的分离五趾", pale, [[ankle[0] + (i - 2) * .029, .058, ankle[2] + .09], [ankle[0] + (i - 2) * .042, .019, ankle[2] + .2 - Math.abs(i - 2) * .019]], [.017, 0]));
      parts.push(combineMeshes("双角龙不画成蜥脚类柱形蹄的完整五趾掌", pale, digits));
    }
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) teeth.push(lobe("双角龙口缘低冠叶形食草齿", pale, [side * .086, 1.157, 1.47 + i * .035], [.018, .041, .023]));
  parts.push(combineMeshes("双角龙区别于鳄式锥齿的低冠齿列", pale, teeth));
  return parts;
}

// https://www.nature.com/articles/s42003-020-01207-6
// 属级主体只收一项；不把跨地域、极地状态及大小物种拆为多个主素材。
function lystrosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("水龙兽短桶状且腹部低垂的完整躯", [[-.55, .42, .18, .22], [-.18, .46, .31, .34], [.39, .47, .3, .32], [.64, .49, .17, .2]], hide), lobe("水龙兽几乎不显露颈部的短前胸", hide, [0, .54, .5], [.44, .48, .44]), lobe("水龙兽鼻吻高而陡直下压的短深颅", hide, [0, .645, .79], [.35, .47, .42], [15, 0, 0]), lobe("水龙兽外鼻区域前移而陡直的鼻骨", pale, [0, .685, .965], [.27, .32, .16]), lobe("水龙兽深颏与短下颌", dark, [0, .402, .835], [.27, .2, .35]), ...eyes([0, .77, .805], .122, .027), part("水龙兽无犬齿状骨翼而有独立牙齿的钩形角质上喙", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .18, profile: [{ x: -.92, y: .69 }, { x: -1.082, y: .6 }, { x: -1.093, y: .42 }, { x: -1.02, y: .473 }, { x: -.91, y: .5 }] }), pointed("水龙兽短而逐渐变尖的小尾", hide, [[0, .38, -.46], [.035, .22, -.7], [.085, .16, -.86]], [.085, .047, 0])];
  for (const side of [-1, 1]) {
    parts.push(pointed("水龙兽从上颌犬齿位独立长出的真实长獠牙", pale, [[side * .122, .614, .938], [side * .137, .49, 1.005], [side * .137, .382, 1.01]], [.029, .023, 0]));
    for (const front of [true, false]) {
      const z = front ? .37 : -.35, ankle: Triple = [side * (front ? .4 : .35), .07, z + .105];
      parts.push(tapered(front ? "水龙兽侧展且适于支撑低腹的短粗前肢" : "水龙兽较内收的短后肢", hide, [[side * .19, .46, z], [side * (front ? .42 : .35), .26, z - .035], ankle], front ? [.092, .066, .035] : [.107, .07, .037]), lobe("水龙兽五趾掌下的低宽足垫", dark, [ankle[0], .05, ankle[2] + .05], [.18, .08, .23]));
      const digits: ModelPart[] = [];
      for (let i = 0; i < 5; i++) digits.push(pointed("水龙兽扇形散开的五枚短趾爪", pale, [[ankle[0] + (i - 2) * .029, .053, ankle[2] + .092], [ankle[0] + (i - 2) * .039, .018, ankle[2] + .195 - Math.abs(i - 2) * .018]], [.016, 0]));
      parts.push(combineMeshes("水龙兽短足上真正分离的完整趾爪", pale, digits));
    }
  }
  return parts;
}

export const landAnimalExpansionBatchFourteenDesigns: MasterNatureDesign[] = [
  design("corythosaurus", "盔龙", "动物", corythosaurus, ["Corythosaurus casuarius", "高髋鸭嘴躯圆盔冠三指合并前蹄与独立第五指"]),
  design("shringasaurus", "双角龙", "动物", shringasaurus, ["Shringasaurus indicus", "小圆头长颈宽肩侧展五趾及成对前上骨角"]),
  design("lystrosaurus", "水龙兽", "动物", lystrosaurus, ["Lystrosaurus", "短桶躯低五趾掌陡直深鼻吻与独立长上獠牙"]),
];
