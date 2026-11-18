import { combineMeshes, design, eyes, leaf, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";
import { membrane } from "./animals";

const hide = "#a9b29b";
const pale = "#c8cbae";
const dark = "#82917c";

// https://doi.org/10.1371/journal.pone.0254789
// 取navigans已保留的完整架构；属仅一个主素材，不把另种冠形/雌雄假说拆作衍生主。
function tupandactylus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("古神翼龙相对巨冠很短而胸骨深的躯", hide, [0, .383, -.025], [.24, .32, .32], [-19, 0, 0]), tapered("古神翼龙长于躯干且直上前举的轻颈", hide, [[0, .493, .06], [0, .69, .142], [0, .87, .297]], [.052, .038, .029]), lobe("古神翼龙巨冠下小而窄的无齿颅", hide, [0, .913, .406], [.099, .118, .22]), ...eyes([0, .947, .424], .041, .012), part("古神翼龙向前下方钩曲而不生牙的短喙", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .061, profile: [{ x: -.42, y: .969 }, { x: -.61, y: .895 }, { x: -.727, y: .769 }, { x: -.675, y: .79 }, { x: -.472, y: .886 }] }), part("古神翼龙下颌前端很深的正中齿骨冠", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .049, profile: [{ x: -.392, y: .883 }, { x: -.648, y: .784 }, { x: -.614, y: .682 }, { x: -.473, y: .646 }, { x: -.405, y: .682 }] }), part("古神翼龙前直立骨柱与后圆短枕冠支持的巨大软冠", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .012, profile: [{ x: -.312, y: .936 }, { x: -.287, y: 1.213 }, { x: -.343, y: 1.369 }, { x: -.443, y: 1.443 }, { x: -.606, y: 1.472 }, { x: -.586, y: 1.237 }, { x: -.571, y: .974 }, { x: -.445, y: .93 }] }), tapered("古神翼龙软冠前缘真实的细直上颌骨柱", hide, [[0, .954, .573], [0, 1.237, .586], [0, 1.469, .605]], [.01, .008, .004]), pointed("古神翼龙不延成长尾翼龙尾帆的短尾", hide, [[0, .274, -.137], [.025, .237, -.219]], [.019, 0])];
  for (const side of [-1, 1]) {
    const shoulder: Triple = [side * .102, .461, .036], elbow: Triple = [side * .238, .367, .057], carpal: Triple = [side * .219, .185, .16], knuckle: Triple = [side * .186, .048, .24], hip: Triple = [side * .078, .265, -.114], foldedTip: Triple = [side * .18, .62, -.13];
    parts.push(tapered("古神翼龙着地的肱桡尺与长第四掌骨连续前肢", hide, [shoulder, elbow, carpal, knuckle], [.035, .024, .014, .009]), tapered("古神翼龙从腕后折且保留四节的超长第四翼指", pale, [knuckle, [side * .18, .21, .13], [side * .18, .37, .02], [side * .18, .51, -.055], foldedTip], [.01, .008, .006, .004, .002]), membrane("古神翼龙在躯侧紧收而非平展挡地的叠翼膜", hide, [shoulder, elbow, carpal, knuckle, foldedTip, hip]), tapered("古神翼龙陆地四足站姿的细长后肢", hide, [hip, [side * .143, .15, -.168], [side * .17, .043, -.086]], [.027, .018, .009]), lobe("古神翼龙四趾后足的窄长掌", dark, [side * .17, .027, -.046], [.045, .031, .093]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 3; i++) digits.push(pointed("古神翼龙第四翼指之外着地的三枚游离前爪", pale, [knuckle, [knuckle[0] + (i - 1) * .018, .023, .291], [knuckle[0] + (i - 1) * .02, .012, .305]], [.0055, .0035, 0]));
    for (let i = 0; i < 4; i++) digits.push(pointed("古神翼龙后足彼此分开的四枚前趾", pale, [[side * .17 + (i - 1.5) * .009, .028, -.017], [side * .17 + (i - 1.5) * .014, .009, .043 - Math.abs(i - 1.5) * .005]], [.0045, 0]));
    parts.push(combineMeshes("古神翼龙有真实地面支承的完整前后爪趾", pale, digits));
  }
  return parts;
}

// Pi等1996马门溪龙原始描述；https://pmc.ncbi.nlm.nih.gov/articles/PMC3812961/
// 以材料完整的youngi作保守约15米架构，不把其他种的15米推测颈长移植过来。
function mamenchisaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("马门溪龙相对超长颈较短的窄深躯与平缓背线", [[-1.45, 2.18, .4, .66], [-.58, 2.29, .72, 1.02], [.64, 2.29, .67, .93], [1.35, 2.24, .34, .58]], hide), tapered("马门溪龙由延长颈椎和长颈肋支持的连续超长颈", hide, [[0, 2.48, 1.09], [0, 2.88, 2.25], [0, 3.31, 3.52], [0, 3.73, 4.78], [0, 4.1, 5.92], [0, 4.32, 6.96]], [.37, .305, .238, .18, .122, .078]), body("马门溪龙较深而非梁龙扁铲状的轻小颅", [[6.84, 4.32, .06, .09], [7.04, 4.34, .115, .145], [7.28, 4.283, .09, .105], [7.43, 4.26, .068, .057]], pale), lobe("马门溪龙前端深而匙齿颌缘较圆的口吻", hide, [0, 4.267, 7.405], [.16, .1, .13]), ...eyes([0, 4.402, 7.1], .093, .029), pointed("马门溪龙比梁龙鞭尾明显短而根部粗的平衡尾", hide, [[0, 2.14, -1.28], [.035, 1.91, -2.43], [.13, 1.64, -3.82], [.3, 1.44, -5.34], [.54, 1.37, -6.64], [.74, 1.43, -7.71]], [.4, .29, .18, .097, .043, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("马门溪龙肘不大幅外展的直立柱状前肢", hide, [[side * .45, 2.2, .84], [side * .56, 1.13, .91], [side * .56, .23, 1.025]], [.25, .177, .115]), lobe("马门溪龙半环掌骨包裹出的短筒形前掌", hide, [side * .56, .148, 1.047], [.34, .28, .38]), tapered("马门溪龙股部较粗且跟部低的直立后肢", hide, [[side * .49, 2.19, -.88], [side * .67, 1.08, -.67], [side * .63, .218, -.947]], [.31, .212, .14]), lobe("马门溪龙有厚跖垫支撑的完整后足", hide, [side * .63, .139, -.874], [.47, .25, .6]), pointed("马门溪龙前掌内侧发达而外侧不加牛蹄的拇爪", pale, [[side * .448, .186, 1.13], [side * .371, .1, 1.268]], [.068, 0]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 5; i++) {
      const x = side * (.63 + (i - 2) * .067);
      digits.push(lobe("马门溪龙后足五个短肉趾的低外廓", hide, [x, .088, -.618 - Math.abs(i - 2) * .022], [.075, .115, .15]));
      if (i < 3) digits.push(pointed("马门溪龙后足内侧三枚而非五枚巨爪", pale, [[x, .101, -.575 - Math.abs(i - 2) * .022], [x - side * .014, .044, -.421 - Math.abs(i - 2) * .023]], [.043 - i * .005, 0]));
    }
    for (const color of [hide, pale]) parts.push(combineMeshes("马门溪龙有三爪和两枚无爪肉趾的完整后足", color, digits.filter(digit => digit.color === color)));
  }
  return parts;
}

// Scott1930 FMNH P13092；Coombs1983 Large Mammalian Clawed Herbivores。
// 后足末端角质形态不明，仅保守短钝趾垫；不宣称掘洞或双足取食行为已经确定。
function homalodotherium(): ModelPart[] {
  const parts: ModelPart[] = [body("平爪兽高肩低臀且腰腹厚重的熊式大躯", [[-.71, .775, .2, .29], [-.3, .9, .4, .49], [.47, 1.12, .385, .47], [.77, 1.12, .22, .3]], hide), lobe("平爪兽承接长前肢的厚肩背", hide, [0, 1.22, .49], [.6, .53, .69]), tapered("平爪兽宽肩前伸向短面颅的较短颈", hide, [[0, 1.27, .62], [0, 1.34, .91]], [.22, .155]), lobe("平爪兽不带犀角或獠牙的短深颅", hide, [0, 1.33, 1.086], [.36, .43, .49]), lobe("平爪兽可活动上唇的较厚短吻", pale, [0, 1.23, 1.315], [.27, .23, .22]), lobe("平爪兽有完整植食齿列的短深下颌", hide, [0, 1.102, 1.129], [.28, .19, .4]), ...eyes([0, 1.437, 1.118], .132, .031), tapered("平爪兽短而下垂的小尾", hide, [[0, .73, -.64], [.04, .42, -.91], [.08, .3, -.98]], [.069, .04, .015])];
  for (const side of [-1, 1]) {
    parts.push(leaf("平爪兽短颅后上方的圆耳", pale, [side * .115, 1.454, .906], .105, .16, [-10, side * 22, -side * 40]), tapered("平爪兽有强肩和长尺桡骨的高位承重前臂", hide, [[side * .27, 1.15, .49], [side * .43, .68, .42], [side * .39, .225, .635]], [.14, .107, .054]), lobe("平爪兽掌骨加长而腕仍抬起的前掌", hide, [side * .39, .185, .683], [.18, .27, .21]), tapered("平爪兽股长而胫腓骨短的低臀后肢", hide, [[side * .27, .83, -.4], [side * .44, .37, -.21], [side * .415, .12, -.49]], [.19, .133, .061]), lobe("平爪兽向外侧承重且跟部真正接地的宽跖行后足", hide, [side * .425, .081, -.36], [.235, .13, .41], [0, -side * 13, -side * 7]));
    const claws: ModelPart[] = [];
    for (let i = 0; i < 4; i++) {
      const x = side * (.346 + i * .033), z = .775 + (i ? .035 : 0);
      claws.push(tapered("平爪兽前掌外侧较长的四枚分离承重指节", hide, [[x, .18, .714], [x, .061, z]], [.025, .017]), pointed("平爪兽趾尖向内回钩且不穿入地面的弯爪", pale, [[x, .0588, z - .009], [x, .0268, z + .083], [x, .0848, z + .119]], [.021, .013, 0]));
    }
    claws.push(lobe("平爪兽前掌内侧较小而退化的第一指", hide, [side * .302, .2, .691], [.038, .067, .06]));
    for (let i = 0; i < 5; i++) claws.push(lobe("平爪兽后足不虚构长镰爪的低钝趾垫", hide, [side * (.425 + (i - 2) * .039), .043 + (4 - i) * .004, -.181 + (i - 2) * .008], [.046, .068, .107]));
    for (const color of [hide, pale]) parts.push(combineMeshes("平爪兽前趾行巨爪手与后跖行外侧承重足", color, claws.filter(claw => claw.color === color)));
  }
  return parts;
}

export const landAnimalExpansionBatchTwentyThreeDesigns: MasterNatureDesign[] = [
  design("tupandactylus", "古神翼龙", "动物", tupandactylus, ["Tupandactylus navigans", "直立巨薄冠深齿骨颏冠长颈与第四翼指折叠四足承重"]),
  design("mamenchisaurus", "马门溪龙", "动物", mamenchisaurus, ["Mamenchisaurus youngi", "十八延长颈椎的超长颈较短尾与柱足三爪五肉趾后足"]),
  design("homalodotherium", "平爪兽", "动物", homalodotherium, ["Homalodotherium cunninghami", "高肩熊样重躯长前臂趾行弯爪掌与短胫外侧跖行后足"]),
];
