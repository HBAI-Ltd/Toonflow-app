import { combineMeshes, design, eyes, leaf, lobe, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#aab098";
const pale = "#c9cbb0";
const dark = "#7c8a75";

// https://mdc.mo.gov/discover-nature/field-guide/mountain-lion
// https://tpwd.texas.gov/huntwild/wild/species/mlion/
// 小圆头、长颈瘦躯、高而有力的后躯和粗圆柱尾采用独立体架，不把狮虎换毛色计主。
function puma(): ModelPart[] {
  const parts: ModelPart[] = [body("美洲狮高后躯与收紧腰腹连接的长柔韧体躯", [[-.64, .53, .1, .13], [-.42, .58, .17, .22], [.08, .53, .19, .24], [.48, .55, .16, .21], [.64, .59, .095, .13]], hide), tapered("美洲狮前胸向小头平滑伸长的圆柱肌肉颈", hide, [[0, .61, .49], [0, .7, .74]], [.13, .09]), body("美洲狮明显小于虎且额宽吻短的完整圆颅", [[.69, .772, .06, .08], [.79, .79, .105, .11], [.91, .755, .08, .07], [1.02, .74, .045, .039]], hide), lobe("美洲狮短宽而不向前突出长犬吻的下颌", pale, [0, .69, .908], [.14, .086, .24]), lobe("美洲狮前吻中央小而宽的鼻镜", dark, [0, .757, 1.033], [.057, .04, .034]), ...eyes([0, .818, .8655], .071, .018), tapered("美洲狮从粗尾根连续收细且不带狮式尾簇的长圆尾", hide, [[0, .51, -.6], [.08, .42, -.9], [.22, .29, -1.18], [.34, .245, -1.43]], [.042, .035, .025, .018]), lobe("美洲狮不膨大成团的钝圆尾端", dark, [.34, .245, -1.44], [.039, .04, .065])];
  for (const side of [-1, 1]) {
    parts.push(lobe("美洲狮颅后短圆且没有猞猁耳簇的耳", hide, [side * .069, .863, .726], [.069, .085, .044]), lobe("美洲狮圆耳内贴合的较浅耳面", pale, [side * .069, .867, .744], [.044, .053, .011]), lobe("美洲狮短吻两侧不夸成虎式宽脸的须垫", pale, [side * .042, .739, 1.006], [.084, .076, .082]));
    for (const front of [true, false]) {
      const z = front ? .44 : -.43, ankle: Triple = [side * (front ? .178 : .185), .078, z + .04];
      parts.push(tapered(front ? "美洲狮细长而有柔腕的前肢" : "美洲狮长强股部与后折跗骨构成的高后肢", hide, front ? [[side * .115, .55, z], [side * .195, .31, z - .028], ankle] : [[side * .11, .57, z], [side * .217, .345, z + .14], [side * .2, .155, z - .035], ankle], front ? [.061, .042, .024] : [.092, .054, .026, .022]), lobe("美洲狮宽于细腕但不夸大的肉垫足掌", hide, [ankle[0], .046, ankle[2] + .044], front ? [.117, .075, .17] : [.106, .075, .16]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 4; i++) toes.push(lobe("美洲狮四枚前向短圆趾且爪收进趾鞘", hide, [ankle[0] + (i - 1.5) * .024, .036, ankle[2] + .107 + (i === 1 || i === 2 ? .009 : 0)], [.029, .047, .063]));
      if (front) toes.push(lobe("美洲狮前足内侧第五枚不触地的悬拇趾", hide, [ankle[0] - side * .034, .109, ankle[2] - .011], [.027, .043, .036]));
      parts.push(combineMeshes("美洲狮前五后四且不外露长爪的完整肉足", hide, toes));
    }
  }
  const whiskers: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) whiskers.push(pointed("美洲狮从短须垫中长出的细触须", pale, [[side * .061, .735 + i * .009, 1.012], [side * .17, .73 + i * .017, 1.043]], [.0005, .0002]));
  parts.push(combineMeshes("美洲狮嘴侧嵌入须垫的双侧细须", pale, whiskers));
  return parts;
}

// https://animals.sandiegozoo.org/animals/chimpanzee
// https://www.nczoo.org/conservation/research/learning-how-our-close-relatives-move
// 较轻短胸、长前臂、圆颅大外耳、四卷指背及对握后拇趾，不缩放大猩猩或猩猩整厂。
function chimpanzee(): ModelPart[] {
  const parts: ModelPart[] = [body("黑猩猩较轻短而从低骨盆升向较高肩部的胸腰躯", [[-.26, .51, .09, .13], [-.07, .6, .17, .25], [.25, .69, .155, .22], [.38, .71, .09, .13]], hide), tapered("黑猩猩不像大猩猩宽肩埋头的短颈连接", hide, [[0, .744, .285], [0, .808, .415]], [.087, .069]), lobe("黑猩猩没有成年大猩猩高矢状嵴的小圆颅", hide, [0, .865, .47], [.185, .22, .19]), lobe("黑猩猩外露而眉上缘微突的裸脸", dark, [0, .87, .54], [.16, .13, .07]), lobe("黑猩猩向前突出而不成狒狒犬吻的短口鼻", pale, [0, .807, .584], [.138, .09, .104]), lobe("黑猩猩裸面中央短而扁宽的鼻", dark, [0, .86, .585], [.052, .048, .03]), lobe("黑猩猩贴合前突口鼻的窄厚闭唇", dark, [0, .796, .625], [.105, .025, .021]), ...eyes([0, .8866, .5626], .042, .014)];
  for (const side of [-1, 1]) {
    parts.push(lobe("黑猩猩明显外露而不埋入头毛的大圆耳", pale, [side * .079, .896, .427], [.064, .102, .049]), lobe("黑猩猩外露耳廓内较暗的耳窝", dark, [side * .099, .898, .44], [.022, .059, .027]), tapered("黑猩猩前臂较长且指背承重的细长强手臂", hide, [[side * .15, .68, .24], [side * .29, .35, .39], [side * .25, .09, .53]], [.058, .048, .027]), lobe("黑猩猩指背支撑时轻背屈的窄掌背", dark, [side * .25, .08, .551], [.074, .088, .082]), tapered("黑猩猩短于前臂的屈膝后股胫", hide, [[side * .11, .48, -.19], [side * .22, .24, -.09], [side * .2, .08, -.25]], [.079, .052, .031]), lobe("黑猩猩后足从脚跟到短前掌的裸跖行掌", dark, [side * .2, .043, -.16], [.102, .063, .235]));
    const fingers: ModelPart[] = [], toes: ModelPart[] = [];
    for (let i = 0; i < 4; i++) {
      const x = side * .25 + (i - 1.5) * .014;
      fingers.push(tapered("黑猩猩四枚折入掌心且以中节指背着地的卷指", dark, [[x, .0734, .548], [x, .0184, .585], [x, .0204, .615], [x, .0614, .61]], [.008, .008, .006, .004]));
      const toeX = side * .2 + (i - 1.5) * .017;
      toes.push(tapered("黑猩猩后足四枚前伸可屈的裸长趾", dark, [[toeX, .04, -.091], [toeX + (i - 1.5) * .003, .022, -.012], [toeX + (i - 1.5) * .003, .035, .011]], [.009, .008, .004]));
    }
    fingers.push(tapered("黑猩猩收在内侧且没有变成第五支撑指的短拇指", dark, [[side * .226, .065, .552], [side * .203, .035, .59]], [.011, .006]));
    toes.push(tapered("黑猩猩后足内侧向外分开的可对握大拇趾", dark, [[side * .17, .043, -.13], [side * .105, .023, -.067], [side * .1, .039, -.03]], [.014, .011, .006]));
    parts.push(combineMeshes("黑猩猩四卷指背与内侧短拇指构成的完整前手", dark, fingers), combineMeshes("黑猩猩四前趾和张开对握大趾构成的完整后足", dark, toes));
  }
  return parts;
}

// https://primate.wisc.edu/primate-info-net/pin-factsheets/pin-factsheet-patas-monkey/
// https://apeanatomyevolution.com/wp-content/uploads/2019/08/AAPA-2013-Patas-Poster-optimized.pdf
// 细长灰狗式躯、长前肢短指骨及非预握下垂尾，不用树栖猴整身换红色毛。
function patasMonkey(): ModelPart[] {
  const parts: ModelPart[] = [body("赤猴腰细胸深且前肩高的灰狗式地栖躯", [[-.28, .36, .065, .095], [-.05, .425, .115, .15], [.23, .46, .09, .13], [.32, .47, .045, .075]], hide), tapered("赤猴瘦长肩上连接小短面的高颈", hide, [[0, .495, .245], [0, .567, .353]], [.055, .041]), lobe("赤猴额部圆而没有狒狒长犬颅的短头", hide, [0, .613, .39], [.128, .158, .146]), lobe("赤猴裸露且嘴部不长出的短脸", dark, [0, .597, .453], [.089, .097, .053]), lobe("赤猴眉下小鼻镜", dark, [0, .613, .477], [.029, .035, .018]), lobe("赤猴浅色窄口鼻与短厚上唇", pale, [0, .566, .476], [.073, .047, .046]), ...eyes([0, .6389, .45265], .0247, .011), tapered("赤猴不预握也不卷环的下垂长平衡尾", hide, [[0, .33, -.26], [.04, .22, -.5], [.1, .16, -.77], [.14, .07, -1.03]], [.019, .016, .01, .003])];
  for (const side of [-1, 1]) {
    parts.push(lobe("赤猴颅后短小而外露的圆耳", dark, [side * .053, .633, .35], [.036, .058, .029]), leaf("赤猴嘴侧短胡须而非山魈的大颊垫", pale, [side * .021, .581, .455], .027, .06, [145, side * 17, -side * 26]));
    for (const front of [true, false]) {
      const z = front ? .21 : -.2, ankle: Triple = [side * .093, .046, z + .039];
      parts.push(tapered(front ? "赤猴特别长而瘦的地面奔跑前肢" : "赤猴轻强股部接细长胫踝的奔跑后肢", hide, front ? [[side * .061, .46, z], [side * .114, .265, z - .019], ankle] : [[side * .054, .35, z], [side * .129, .215, z + .065], [side * .105, .073, z - .024], ankle], front ? [.029, .019, .011] : [.046, .029, .014, .011]), lobe("赤猴短指骨前的窄而低平肉掌", dark, [ankle[0], .026, ankle[2] + .027], [.044, .037, .077]));
      const digits: ModelPart[] = [];
      for (let i = 0; i < 4; i++) digits.push(tapered("赤猴适合地面跑步而显著短于攀援猴的指趾", dark, [[ankle[0] + (i - 1.5) * .008, .025, ankle[2] + .049], [ankle[0] + (i - 1.5) * .009, .015, ankle[2] + .076 + (i === 1 || i === 2 ? .006 : 0)]], [.0045, .003]));
      digits.push(tapered(front ? "赤猴前掌内侧短而仍存在的拇指" : "赤猴后足略外展但不夸成猿足的大拇趾", dark, [[ankle[0] - side * .017, .029, ankle[2] + .015], [ankle[0] - side * .032, .016, ankle[2] + .043]], [.006, .0035]));
      parts.push(combineMeshes("赤猴短指骨与完整拇指构成的五指短掌", dark, digits));
    }
  }
  return parts;
}

export const landAnimalExpansionBatchTwentyNineDesigns: MasterNatureDesign[] = [
  design("puma", "美洲狮", "动物", puma, ["Puma concolor", "cougar", "高后躯长股瘦长体长颈小圆头短圆耳与无尾簇粗圆长尾"]),
  design("chimpanzee", "黑猩猩", "动物", chimpanzee, ["Pan troglodytes", "轻短胸长前臂无高矢状嵴圆颅大外耳指背支撑手和对握后拇趾"]),
  design("patasMonkey", "赤猴", "动物", patasMonkey, ["Erythrocebus patas", "灰狗式轻长地栖躯长前肢短手足指骨短面胡须与下垂非预握长尾"]),
];
