import { combineMeshes, design, eyes, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";
import { bodySurfacePoint } from "./landAnimalExpansionBatchEighteen";

const hide = "#a9b29a";
const pale = "#c7ccaf";
const dark = "#80917a";

// https://doi.org/10.7717/peerj.20794
// 2026前颌每侧五个齿槽、窄吻与前鼻骨复合膨大吻；短前肢不补无据禽龙拇刺。
function muttaburrasaurus(): ModelPart[] {
  const skull: [number, number, number, number][] = [[1.54, 2.8, .08, .12], [1.75, 2.83, .15, .185], [2.04, 2.825, .135, .24], [2.22, 2.74, .09, .12], [2.4, 2.665, .047, .055]];
  const parts: ModelPart[] = [body("木他龙前胸较轻而后髋深厚的长植食躯", [[-1.04, 1.74, .24, .37], [-.4, 1.87, .46, .67], [.61, 1.92, .4, .57], [1.03, 2.01, .21, .34]], hide), tapered("木他龙由高胸向前上弯起承托狭吻的肌肉颈", hide, [[0, 2.16, .83], [0, 2.48, 1.19], [0, 2.746, 1.54]], [.24, .18, .105]), body("木他龙背面膨大吻由复合骨形成而前端窄小的完整颅", skull, hide), lobe("木他龙不像鸭嘴龙宽鸭嘴的狭窄薄吻前端", pale, [0, 2.645, 2.4], [.101, .077, .1]), body("木他龙颊部深而向前收尖的植食下颌", [[1.62, 2.575, .07, .09], [1.87, 2.545, .11, .085], [2.18, 2.553, .065, .06], [2.386, 2.577, .035, .027]], pale), ...eyes([0, 2.924, 1.78], .12, .032), pointed("木他龙比腱龙相对短而有骨化肌腱加固的长尾", hide, [[0, 1.71, -.93], [.03, 1.49, -1.79], [.11, 1.28, -2.77], [.26, 1.16, -3.72], [.39, 1.21, -4.56]], [.28, .207, .12, .048, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("木他龙较强股胫与长跗部的高后肢", hide, [[side * .31, 1.79, -.4], [side * .53, 1.05, -.065], [side * .46, .357, -.44], [side * .45, .109, -.04]], [.23, .151, .066, .041]), lobe("木他龙三枚宽后趾相接的厚掌", dark, [side * .45, .079, .065], [.23, .132, .34]), tapered("木他龙细于大躯且不硬拉至地面的短前臂", hide, [[side * .295, 1.996, .7], [side * .52, 1.65, .94], [side * .408, 1.43, 1.23]], [.079, .061, .034]), lobe("木他龙五指而非合并鸭嘴蹄套的窄前掌", hide, [side * .408, 1.394, 1.285], [.115, .13, .18]));
    const fingers: ModelPart[] = [], toes: ModelPart[] = [];
    for (let i = 0; i < 5; i++) {
      const x = side * (.408 + (i - 2) * .018), length = i === 0 ? .065 : i === 4 ? .112 : .146 - Math.abs(i - 2) * .013;
      fingers.push(tapered("木他龙保守五指中短第一指和可屈小第五指", hide, [[x, 1.405, 1.294], [x + side * (i - 2) * .005, 1.345, 1.294 + length], [x + side * (i - 2) * .006, 1.38, 1.313 + length]], [.013, .009, .005]));
      if (i > 0 && i < 4) fingers.push(lobe("木他龙中间三指的短钝甲而不长巨拇刺", pale, [x + side * (i - 2) * .006, 1.38, 1.31 + length], [.013, .021, .025]));
    }
    for (let i = 0; i < 3; i++) {
      const x = side * .45 + (i - 1) * .066;
      toes.push(tapered("木他龙三枚较宽而不做兽脚细爪的承重足趾", dark, [[x, .094, .163], [x + (i - 1) * .026, .045, .367 + (i === 1 ? .052 : 0)]], [.039, .026]), lobe("木他龙三趾末端低而宽的圆钝蹄甲", pale, [x + (i - 1) * .026, .039, .383 + (i === 1 ? .052 : 0)], [.06, .064, .107]));
    }
    for (const color of [hide, pale]) parts.push(combineMeshes("木他龙不强加禽龙拇刺的完整五指手", color, fingers.filter(finger => finger.color === color)));
    for (const color of [dark, pale]) parts.push(combineMeshes("木他龙支撑大型植食躯的完整三趾后足", color, toes.filter(toe => toe.color === color)));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
    const p = bodySurfacePoint(skull, side > 0 ? -.89 : Math.PI + .89, 2.245 + i * .027, -.0015);
    teeth.push(pointed("木他龙新描述所见前颌每侧五枚而非无齿喙的细牙", pale, [[p.x, p.y, p.z], [p.x, p.y - .031, p.z + .003]], [.004, 0]));
  }
  parts.push(combineMeshes("木他龙窄前吻下真实附着的五对前颌牙列", pale, teeth));
  return parts;
}

// https://doi.org/10.1098/rspb.2013.1186
// https://doi.org/10.1080/02724634.2015.1054936
// 短高膨大鼻区、广盾与牛式长弯眉角构成完整头架；皮肤覆盖颈盾骨窗，不开成穿透活体的大洞。
function nasutoceratops(): ModelPart[] {
  const parts: ModelPart[] = [body("大鼻角龙短深腹宽肩而腰部收紧的四足躯", [[-.93, .86, .28, .35], [-.34, .95, .52, .57], [.58, .99, .52, .57], [.97, .97, .28, .33]], hide), tapered("大鼻角龙头后与广胸连接的粗短颈", hide, [[0, 1.035, .74], [0, 1.065, 1.12]], [.3, .25]), body("大鼻角龙吻特别短高且鼻孔区巨大的深宽颅", [[1.01, 1.06, .21, .25], [1.24, 1.13, .31, .36], [1.58, 1.09, .28, .33], [1.8, 1.01, .15, .2]], hide), lobe("大鼻角龙前鼻宽高但喙端短小的上唇外廓", pale, [0, .978, 1.84], [.3, .23, .23]), part("大鼻角龙与短高鼻面相接的鹦鹉式角质钩喙", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .16, profile: [{ x: -1.81, y: 1.055 }, { x: -2.008, y: .935 }, { x: -2.016, y: .777 }, { x: -1.92, y: .835 }, { x: -1.803, y: .87 }] }), lobe("大鼻角龙短而深的下颌与宽厚颏", hide, [0, .773, 1.566], [.4, .23, .6]), ...eyes([0, 1.328, 1.285], .23, .039), lobe("大鼻角龙低而前后延长的鼻骨角基隆起", pale, [0, 1.411, 1.58], [.115, .12, .27]), part("大鼻角龙简缘宽盾有连续皮面而非裸骨穿孔", "extrude", pale, [0, .7, 1.04], [1, 1, 1], [-23, 0, 0], { depth: .062, profile: [{ x: -.22, y: 0 }, { x: -.49, y: .26 }, { x: -.64, y: .68 }, { x: -.6, y: 1.07 }, { x: -.37, y: 1.27 }, { x: 0, y: 1.31 }, { x: .37, y: 1.27 }, { x: .6, y: 1.07 }, { x: .64, y: .68 }, { x: .49, y: .26 }, { x: .22, y: 0 }] }), pointed("大鼻角龙宽骨盆后延伸的粗根短尖尾", hide, [[0, .83, -.82], [.035, .63, -1.4], [.13, .47, -2], [.27, .43, -2.52]], [.23, .16, .08, 0])];
  for (const side of [-1, 1]) {
    parts.push(pointed("大鼻角龙先向前外再向前内弯且末端扭转的长眉角", pale, [[side * .17, 1.37, 1.31], [side * .45, 1.48, 1.47], [side * .56, 1.443, 1.88], [side * .387, 1.56, 2.228]], [.08, .07, .041, 0]));
    for (const front of [true, false]) {
      const z = front ? .62 : -.62, ankle: Triple = [side * .4, .103, z + .06];
      parts.push(tapered(front ? "大鼻角龙肘轻度外展且腕下落地的短粗前肢" : "大鼻角龙粗股内收并接宽足的后肢", hide, [[side * .285, front ? .95 : .835, z], [side * .475, .45, z - .03], ankle], front ? [.145, .103, .055] : [.18, .113, .058]), lobe("大鼻角龙没有牛式一双蹄瓣的完整宽承重掌", hide, [ankle[0], .071, ankle[2] + .053], front ? [.255, .12, .31] : [.28, .12, .355]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < (front ? 5 : 4); i++) {
        const hoof = !front || i < 3;
        toes.push(lobe(hoof ? "大鼻角龙前内三和后四趾的低宽钝蹄甲" : "大鼻角龙前掌外二指缩短且不加爪的肉垫", hoof ? pale : hide, [ankle[0] + side * (i - (front ? 2 : 1.5)) * .047, .052, ankle[2] + (hoof ? .197 : .151)], hoof ? [.047, .072, .109] : [.038, .061, .076]));
      }
      for (const color of [hide, pale]) { const pieces = toes.filter(toe => toe.color === color); if (pieces.length) parts.push(combineMeshes("大鼻角龙完整但并非每个前指都生爪的承重足", color, pieces)); }
    }
  }
  return parts;
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC5603782/
// https://repository.si.edu/bitstream/handle/10088/7636/paleo_Carrano_07b.pdf
// 较低长躯、短壮胫跗和四短无爪指不同于牛龙的高髋奔跑比例，不把额瘤做成牛角。
function majungasaurus(): ModelPart[] {
  const skull: [number, number, number, number][] = [[1.24, 2.16, .14, .2], [1.47, 2.19, .22, .3], [1.86, 2.1, .17, .24], [2.09, 2.04, .125, .15]];
  const parts: ModelPart[] = [body("玛君龙比牛龙较低长且腰胸厚重的完整躯", [[-1.07, 1.39, .27, .39], [-.36, 1.53, .46, .65], [.61, 1.59, .405, .58], [1.03, 1.7, .22, .36]], hide), tapered("玛君龙相对粗短且支持深颅的有力颈", hide, [[0, 1.82, .82], [0, 2.04, 1.15], [0, 2.13, 1.37]], [.28, .22, .16]), body("玛君龙宽后颞区而前后较短的深窄颅", skull, hide), body("玛君龙短深而非狭长鳄吻式的下颌", [[1.3, 1.915, .115, .125], [1.53, 1.865, .17, .105], [1.96, 1.855, .12, .075], [2.074, 1.875, .08, .045]], pale), ...eyes([0, 2.303, 1.553], .185, .047), lobe("玛君龙额顶中央低而粗糙的单骨瘤而非牛龙双角", pale, [0, 2.45, 1.51], [.21, .24, .21]), pointed("玛君龙腰后粗根且没有牛龙特殊长尾肌外形的长尾", hide, [[0, 1.365, -.96], [.035, 1.2, -1.82], [.13, 1.08, -2.8], [.285, 1.025, -3.77], [.43, 1.09, -4.59]], [.29, .215, .125, .052, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("玛君龙胫跗较短而股部特别粗壮的承重后肢", hide, [[side * .315, 1.45, -.37], [side * .53, .84, -.04], [side * .46, .294, -.4], [side * .45, .092, -.085]], [.23, .16, .069, .041]), lobe("玛君龙短壮后腿下宽而厚的三趾掌", dark, [side * .45, .066, .032], [.235, .117, .35]), tapered("玛君龙短粗肱骨末接极短尺桡而非暴龙式长前臂", hide, [[side * .305, 1.745, .72], [side * .47, 1.46, .82], [side * .475, 1.422, .74]], [.055, .037, .023]));
    const hand: ModelPart[] = [], foot: ModelPart[] = [];
    for (let i = 0; i < 4; i++) hand.push(tapered("玛君龙四枚短指没有添加长爪的钝末端", hide, [[side * .475 + (i - 1.5) * .012, 1.427, .747], [side * .48 + (i - 1.5) * .014, 1.383, .675 + (i % 2) * .009]], [.009, .004]));
    for (let i = 0; i < 3; i++) foot.push(tapered("玛君龙承重的三枚粗壮长足趾", dark, [[side * .45 + (i - 1) * .061, .079, .135], [side * .45 + (i - 1) * .099, .035, .356 + (i === 1 ? .052 : 0)]], [.033, .021]), pointed("玛君龙三趾末端的短弯爪", pale, [[side * .45 + (i - 1) * .099, .04, .348 + (i === 1 ? .052 : 0)], [side * .45 + (i - 1) * .105, .018, .453 + (i === 1 ? .052 : 0)]], [.022, 0]));
    parts.push(combineMeshes("玛君龙极短前肢末端完整四短指", hide, hand));
    for (const color of [dark, pale]) parts.push(combineMeshes("玛君龙宽粗三趾骨与爪分色的完整后足", color, foot.filter(toe => toe.color === color)));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 12; i++) {
    const p = bodySurfacePoint(skull, side > 0 ? -.85 : Math.PI + .85, 1.49 + i * .045, -.002);
    const tooth = polygon("玛君龙根部嵌入颅面颌缘的侧扁后弯刃齿", pale, [[-.018, 0], [.019, 0], [.005, .077]], .013, [p.x + .0065, p.y, p.z]); tooth.rotation = { x: 90, y: 0, z: 90 }; teeth.push(tooth);
  }
  parts.push(combineMeshes("玛君龙沿真实深颅下颌缘而非悬空排列的完整刃齿", pale, teeth));
  return parts;
}

export const landAnimalExpansionBatchTwentyEightDesigns: MasterNatureDesign[] = [
  design("muttaburrasaurus", "木他龙", "动物", muttaburrasaurus, ["Muttaburrasaurus langdoni", "木塔龙", "复合前鼻骨膨大吻狭前吻每侧五前颌牙短前肢与强三趾后足"]),
  design("nasutoceratops", "大鼻角龙", "动物", nasutoceratops, ["Nasutoceratops titusi", "短高巨鼻区深宽短脸前外弯扭牛角简缘广盾及短强四肢"]),
  design("majungasaurus", "玛君龙", "动物", majungasaurus, ["Majungasaurus crenatissimus", "Majungatholus", "低长重躯短壮胫跗深短窄颅单额骨瘤与极短尺桡四短无爪指"]),
];
