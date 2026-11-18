import { combineMeshes, design, eyes, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#a8b19a";
const pale = "#c6caad";
const dark = "#82917b";

// https://doi.org/10.1126/science.aal4853
// https://doi.org/10.1093/zoolinnean/zlae085
// 未完整保存的足端按近亲作保守简化；不额外制造无据的长獠牙或兽毛。
function lisowicia(): ModelPart[] {
  const parts: ModelPart[] = [body("利索维兽高肩巨大桶腹与短腰的完整躯", [[-1.42, 1.48, .42, .66], [-.61, 1.58, .84, 1.0], [.66, 1.65, .8, .97], [1.21, 1.73, .43, .66]], hide), lobe("利索维兽直立前肢上方发达的高肩带", hide, [0, 1.95, .81], [1.39, 1.25, 1.23]), tapered("利索维兽粗短颈承托高深的无牙颅", hide, [[0, 1.99, 1.0], [0, 2.03, 1.45]], [.37, .29]), lobe("利索维兽宽颞区且向前变窄的深颅", hide, [0, 2.065, 1.68], [.74, .84, .92]), lobe("利索维兽厚实的短下颌与深颏", dark, [0, 1.73, 1.79], [.53, .29, .76]), ...eyes([0, 2.27, 1.8], .265, .043), part("利索维兽无长犬齿的宽角质钩喙", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .41, profile: [{ x: -1.86, y: 2.2 }, { x: -2.31, y: 2.04 }, { x: -2.36, y: 1.7 }, { x: -2.23, y: 1.79 }, { x: -1.86, y: 1.87 }] }), pointed("利索维兽短而下垂的粗尾", hide, [[0, 1.4, -1.28], [.065, .91, -1.77], [.15, .65, -2.16]], [.19, .105, 0])];
  for (const side of [-1, 1]) for (const front of [true, false]) {
    const z = front ? .86 : -1.04, ankle: Triple = [side * .64, .23, z + .035];
    parts.push(tapered(front ? "利索维兽肘部内收且真正柱状直立的巨前肢" : "利索维兽宽骨盆下直立承重的巨后肢", hide, [[side * .49, front ? 1.94 : 1.56, z], [side * .66, .9, z - .04], ankle], front ? [.33, .25, .15] : [.36, .265, .165]), lobe("利索维兽柱足下与地面接触的宽厚掌垫", dark, [ankle[0], .15, ankle[2] + .09], [.47, .26, .59]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 5; i++) digits.push(lobe("利索维兽足掌前缘保守复原的短宽趾爪", pale, [ankle[0] + (i - 2) * .077, .105, ankle[2] + .315 - Math.abs(i - 2) * .021], [.08, .11, .16]));
    parts.push(combineMeshes("利索维兽不分成牛蹄的完整宽掌趾列", pale, digits));
  }
  return parts;
}

// https://www.nps.gov/pefo/learn/pseudosuchians.htm
// 颈侧长棘来自侧列皮骨板，绝非肩胛骨伸出体外。
function desmatosuchus(): ModelPart[] {
  const sections: [number, number, number, number][] = [[-1.09, .65, .31, .27], [-.53, .7, .64, .33], [.62, .72, .61, .34], [1.06, .73, .3, .25]];
  const parts: ModelPart[] = [body("链鳄长而宽扁的矩形甲背下躯", sections, hide), tapered("链鳄甲背前方细长且偏低的颈", hide, [[0, .7, .89], [0, .69, 1.25]], [.18, .105]), lobe("链鳄后部窄而鼻吻细长的小颅", hide, [0, .705, 1.47], [.245, .255, .56]), part("链鳄向前扩宽且末端上翘的铲形鼻端", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .22, profile: [{ x: -1.63, y: .727 }, { x: -1.95, y: .753 }, { x: -2.04, y: .818 }, { x: -2.056, y: .712 }, { x: -1.71, y: .631 }] }), lobe("链鳄细长下颌而非宽鳄鱼口", dark, [0, .597, 1.54], [.18, .105, .48]), ...eyes([0, .78, 1.46], .09, .025), pointed("链鳄甲背后连续渐细的长鳄式尾", hide, [[0, .62, -.97], [.035, .49, -1.65], [.13, .34, -2.38], [.3, .25, -3.24]], [.3, .22, .116, 0])];
  for (const side of [-1, 1]) {
    for (const front of [true, false]) {
      const z = front ? .67 : -.69, ankle: Triple = [side * .71, .083, z + .15];
      parts.push(tapered("链鳄在宽甲躯两侧下折的短承重肢", hide, [[side * .4, .6, z], [side * .77, .29, z - .08], ankle], front ? [.112, .084, .043] : [.136, .09, .045]), lobe("链鳄宽而低的接地掌", dark, [ankle[0], .058, ankle[2] + .063], [.2, .1, .26]));
      const digits: ModelPart[] = [];
      for (let i = 0; i < (front ? 5 : 4); i++) digits.push(pointed("链鳄前后足分离的短趾爪", pale, [[ankle[0] + (i - (front ? 2 : 1.5)) * .032, .064, ankle[2] + .11], [ankle[0] + (i - (front ? 2 : 1.5)) * .046, .025, ankle[2] + .238 - Math.abs(i - (front ? 2 : 1.5)) * .018]], [.02, 0]));
      parts.push(combineMeshes("链鳄完整的非游泳蹼承重足", pale, digits));
    }
    parts.push(pointed("链鳄颈侧骨板上约半米长且外展前弯的巨棘", pale, [[side * .47, .93, .68], [side * .8, 1.08, .76], [side * .97, 1.1, .96]], [.086, .053, 0]));
    for (let i = 0; i < 5; i++) parts.push(pointed("链鳄颈侧较短而非全等复制的骨板棘", pale, [[side * (.32 + i * .038), .86 + i * .017, 1.04 - i * .26], [side * (.44 + i * .038), 1.02 + i * .009, .99 - i * .26]], [.049, 0]));
  }
  const plates: ModelPart[] = [];
  for (let i = 0; i < 12; i++) {
    const z = -.94 + i * .159, j = z < -.53 ? 0 : z < .62 ? 1 : 2, a = sections[j]!, b = sections[j + 1]!, t = (z - a[0]) / (b[0] - a[0]), y = a[1] + (b[1] - a[1]) * t, w = a[2] + (b[2] - a[2]) * t, h = a[3] + (b[3] - a[3]) * t;
    for (const side of [-1, 1]) {
      plates.push(polygon("链鳄背中线左右成对排列的矩形主骨板", pale, [[-.15, -.074], [.15, -.074], [.15, .074], [-.15, .074]], .055, [side * w * .275, y + h - .025, z]));
      const outer = polygon("链鳄与背板衔接的左右侧骨板", pale, [[-.14, -.074], [.14, -.074], [.14, .074], [-.14, .074]], .052, [side * w * .78, y + h * .625 - .015, z]); outer.rotation.z = -side * 32; plates.push(outer);
    }
  }
  for (let i = 0; i < plates.length; i += 16) parts.push(combineMeshes("链鳄四条连续纵列的矩形甲板", pale, plates.slice(i, i + 16)));
  const tailPlates: ModelPart[] = [];
  for (let i = 0; i < 12; i++) for (const side of [-1, 1]) {
    const z = -1.18 - i * .148, j = z > -1.65 ? 0 : z > -2.38 ? 1 : 2, zs = [-.97, -1.65, -2.38, -3.24], ys = [.62, .49, .34, .25], xs = [0, .035, .13, .3], radii = [.3, .22, .116, 0], t = (z - zs[j]!) / (zs[j + 1]! - zs[j]!), r = radii[j]! + (radii[j + 1]! - radii[j]!) * t, x = xs[j]! + (xs[j + 1]! - xs[j]!) * t, y = ys[j]! + (ys[j + 1]! - ys[j]!) * t;
    tailPlates.push(lobe("链鳄尾部随尾径缩小并贴接的矩形甲片", pale, [x + side * r * .45, y + r * .78, z], [r * .95, .07, .16]));
  }
  parts.push(combineMeshes("链鳄长尾上衔接躯甲的连续甲列", pale, tailPlates));
  return parts;
}

// https://www.wits.ac.za/news/latest-news/research-news/2021/2021-03/
// 缺失的躯尾按近亲轮廓简化，不把幼体、成年或不同头部瘤型另立主素材。
function anteosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("前鳄兽长而深的捕食躯及较低后腰", [[-1.05, 1.03, .25, .38], [-.43, 1.11, .45, .59], [.49, 1.18, .46, .62], [.99, 1.24, .25, .39]], hide), lobe("前鳄兽用于稳定巨颅的强壮前肩", hide, [0, 1.34, .62], [.83, .83, .84]), tapered("前鳄兽粗壮且向前举起的短颈", hide, [[0, 1.43, .78], [0, 1.58, 1.27]], [.28, .23]), lobe("前鳄兽远长大于体型近亲的高深颅", hide, [0, 1.62, 1.6], [.54, .7, .89]), lobe("前鳄兽圆高而狭窄的前鼻吻", pale, [0, 1.52, 1.985], [.37, .4, .34]), lobe("前鳄兽长厚下颌及深后颌角", hide, [0, 1.265, 1.645], [.4, .28, .79]), ...eyes([0, 1.82, 1.645], .195, .04), pointed("前鳄兽区别于麝足兽短尾的粗根长肌肉尾", hide, [[0, .98, -.92], [.07, .74, -1.77], [.22, .51, -2.73], [.44, .35, -3.72]], [.25, .18, .09, 0]), tapered("前鳄兽鼻顶沿前后延伸的低矮骨嵴", pale, [[0, 1.916, 1.63], [0, 1.71, 1.97]], [.061, .045])];
  for (const side of [-1, 1]) {
    parts.push(lobe("前鳄兽眶上增厚骨瘤而非长出角鞘", pale, [side * .177, 1.87, 1.57], [.17, .2, .26]), pointed("前鳄兽上颌独立的粗大剑形犬齿", pale, [[side * .159, 1.515, 1.926], [side * .174, 1.34, 1.99], [side * .17, 1.17, 1.96]], [.047, .033, 0]));
    for (const front of [true, false]) {
      const z = front ? .66 : -.69, ankle: Triple = [side * .58, .105, z + .11];
      parts.push(tapered("前鳄兽半侧展肘膝和强壮的陆行四肢", hide, [[side * .31, front ? 1.12 : .95, z], [side * .65, .55, z - .09], ankle], front ? [.18, .128, .061] : [.205, .14, .066]), lobe("前鳄兽有厚垫的宽短足掌", dark, [ankle[0], .078, ankle[2] + .065], [.25, .135, .32]));
      const digits: ModelPart[] = [];
      for (let i = 0; i < 5; i++) digits.push(pointed("前鳄兽粗掌前方分离的五枚短趾爪", pale, [[ankle[0] + (i - 2) * .04, .084, ankle[2] + .145], [ankle[0] + (i - 2) * .052, .029, ankle[2] + .29 - Math.abs(i - 2) * .018]], [.022, 0]));
      parts.push(combineMeshes("前鳄兽支撑长肌肉躯尾的完整五趾足", pale, digits));
    }
  }
  return parts;
}

export const landAnimalExpansionBatchSixteenDesigns: MasterNatureDesign[] = [
  design("lisowicia", "利索维兽", "动物", lisowicia, ["Lisowicia bojani", "巨桶躯高肩带直立柱状四肢及无长獠牙钩喙"]),
  design("desmatosuchus", "链鳄", "动物", desmatosuchus, ["Desmatosuchus", "长扁四列矩形甲躯颈侧长皮骨棘与上翘铲鼻"]),
  design("anteosaurus", "前鳄兽", "动物", anteosaurus, ["Anteosaurus magnificus", "巨深颅眶上骨瘤鼻嵴粗颈与长肌肉尾"]),
];
