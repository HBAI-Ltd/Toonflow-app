import { combineMeshes, design, eyes, leaf, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";
import { fourFeet, head } from "./mammalForms";
import { pointed } from "./insectForms";

const hide = "#abb29c";
const pale = "#c8caad";
const dark = "#84917d";

// https://www.amnh.org/explore/ology/ology-cards/360-quetzalcoatlus-northropi
// 依据同属骨架的陆地四足姿态作简化复原；不以未知软组织宣称精确复原。
function quetzalcoatlus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("风神翼龙相对于长颈巨喙很短的胸腹", hide, [0, 1.83, -.08], [.88, 1.24, 1.17], [-18, 0, 0]), tapered("风神翼龙由短躯直上延伸的长颈", hide, [[0, 2.18, .23], [0, 3.19, .52], [0, 4.23, .91], [0, 4.62, 1.25]], [.19, .15, .12, .105]), lobe("风神翼龙细小颅盒与长喙基部", hide, [0, 4.65, 1.43], [.34, .37, .61]), ...eyes([0, 4.73, 1.53], .13, .035), part("风神翼龙无齿长喙的上颌实体", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .23, profile: [{ x: -1.5, y: 4.79 }, { x: -3.91, y: 4.33 }, { x: -3.85, y: 4.23 }, { x: -1.51, y: 4.44 }] }), part("风神翼龙长喙下颌保持细口缝", "extrude", dark, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .18, profile: [{ x: -1.5, y: 4.405 }, { x: -3.82, y: 4.195 }, { x: -3.68, y: 4.13 }, { x: -1.51, y: 4.25 }] }), part("风神翼龙颅顶短而后伸的薄冠", "extrude", hide, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .035, profile: [{ x: -1.17, y: 4.68 }, { x: -.75, y: 5.04 }, { x: -1.43, y: 4.8 }] })];
  for (const side of [-1, 1]) {
    const shoulder: Triple = [side * .34, 2.05, .03], elbow: Triple = [side * .79, 1.52, .29], wrist: Triple = [side * .65, .14, .86], foldedTip: Triple = [side * .44, 2.67, -1.54], hip: Triple = [side * .24, 1.31, -.43];
    parts.push(tapered("风神翼龙着地前肢的上臂前臂及长掌骨", hide, [shoulder, elbow, wrist], [.115, .08, .047]), tapered("风神翼龙从腕后翻折收起的延长翼指", pale, [wrist, [side * .58, 1.1, -.05], [side * .49, 1.95, -.89], foldedTip], [.048, .034, .022, .006]), membrane("风神翼龙随长翼指收叠的真实翼膜", hide, [shoulder, elbow, wrist, foldedTip, hip]), tapered("风神翼龙细长后肢而非鸟跗蹠的四足站姿", hide, [hip, [side * .4, .73, -.66], [side * .51, .12, -.31]], [.085, .061, .031]), lobe("风神翼龙接地的后足掌", dark, [side * .51, .075, -.23], [.14, .09, .28]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 3; i++) digits.push(pointed("风神翼龙在腕前着地的三个游离爪指", pale, [wrist, [wrist[0] + (i - 1) * .065, .065, 1.03], [wrist[0] + (i - 1) * .07, .035, 1.08]], [.022, .014, 0]));
    for (let i = 0; i < 4; i++) digits.push(pointed("风神翼龙后足四枚独立前趾", pale, [[side * .51, .065, -.15], [side * .51 + (i - 1.5) * .035, .027, .02]], [.016, 0]));
    parts.push(combineMeshes("风神翼龙前后足实际分开的趾爪列", pale, digits));
  }
  return parts;
}

// https://www.nhm.ac.uk/discover/irish-elk-giant-deer.html
function megaloceros(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大角鹿与驼鹿不同的直背深胸长躯", hide, [0, 1.65, -.04], [.76, 1.04, 2.15]), lobe("大角鹿肩部的发达颈背基", hide, [0, 1.91, .55], [.72, .94, .78]), tapered("大角鹿承托宽角的上举颈", hide, [[0, 1.87, .65], [0, 2.3, .88], [0, 2.48, 1.03]], [.23, .18, .13])];
  head(parts, [0, 2.5, 1.23], [.31, .37, .55], .1, "none");
  fourFeet(parts, [0, 1.61, .66], [0, 1.53, -.75], .245, .075, false, true);
  for (const side of [-1, 1]) {
    parts.push(leaf("大角鹿狭长而非驼鹿垂唇的侧耳", pale, [side * .11, 2.61, 1.01], .15, .3, [0, side * 20, -side * 55]), tapered("大角鹿向两侧水平展开的粗角梁", pale, [[side * .12, 2.64, 1.04], [side * .45, 2.78, .88], [side * .83, 2.91, .76]], [.071, .063, .045]), pointed("大角鹿由角梁前方伸出的眉叉", pale, [[side * .38, 2.76, .92], [side * .54, 2.86, 1.24], [side * .67, 2.99, 1.33]], [.042, .026, 0]));
    const points: [number, number][] = [[side * .67, -2.88], [side * .95, -2.94], [side * 1.24, -3.03], [side * 1.71, -3.03], [side * 1.95, -3.16], [side * 1.74, -3.2], [side * 1.69, -3.44], [side * 1.57, -3.25], [side * 1.4, -3.49], [side * 1.35, -3.23], [side * 1.13, -3.43], [side * 1.09, -3.17], [side * .88, -3.28], [side * .85, -3.04]];
    const palm = polygon("大角鹿大幅横向展开并含连续掌叶的骨角", pale, points, .074, [0, 0, .73]); palm.rotation.x = 90; parts.push(palm);
  }
  parts.push(tapered("大角鹿短尾", hide, [[0, 1.58, -.96], [.03, 1.37, -1.21]], [.065, .02]));
  return parts;
}

// https://www.nhm.ac.uk/discover/news/2018/april/giant-fossil-mammals-inspired-charles-darwin-theory-evolution.html
function toxodon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("弓齿兽前低后高的巨大桶形胸腹", hide, [0, 1.06, -.14], [1.25, 1.33, 2.3], [7, 0, 0]), lobe("弓齿兽高拱的后躯", hide, [0, 1.25, -.72], [1.17, 1.16, 1.08]), tapered("弓齿兽极短粗颈向前下连接厚头", hide, [[0, 1.08, .66], [0, 1.01, .96]], [.35, .27]), lobe("弓齿兽高而短的深大颅后部", hide, [0, 1.02, 1.13], [.63, .76, .78]), lobe("弓齿兽宽而向前扩展的口鼻", pale, [0, .82, 1.43], [.61, .38, .55]), lobe("弓齿兽厚而前伸的下颌联合", hide, [0, .64, 1.43], [.52, .22, .62]), ...eyes([0, 1.24, 1.24], .23, .052)];
  for (const side of [-1, 1]) for (const front of [true, false]) {
    const z = front ? .6 : -.79, y = front ? .91 : 1.17, x = side * .39;
    parts.push(tapered("弓齿兽前短后长的粗壮有蹄肢", hide, [[x * .8, y, z], [x, y * .5, z - .07], [x, .15, z]], [.21, .14, .09]), lobe("弓齿兽三趾下方宽足垫", hide, [x, .11, z + .05], [.31, .19, .38]));
    const toes: ModelPart[] = [];
    for (let i = 0; i < 3; i++) toes.push(lobe("弓齿兽独立的三枚钝蹄趾", dark, [x + (i - 1) * .085, .085, z + .16], [.08, .125, .17]));
    parts.push(combineMeshes("弓齿兽不并成偶蹄的完整三趾足", dark, toes));
  }
  const incisors: ModelPart[] = [];
  for (let i = 0; i < 4; i++) { const x = (i - 1.5) * .081; incisors.push(polygon("弓齿兽下颌前端扁平并列的铲状门齿", pale, [[x - .0375, 1.66], [x + .0375, 1.66], [x + .0375, 1.81], [x - .0375, 1.81]], .025, [0, .73, 0])); }
  parts.push(combineMeshes("弓齿兽前伸成铲口的完整门齿列", pale, incisors));
  for (const side of [-1, 1]) parts.push(leaf("弓齿兽头顶侧后方小耳", hide, [side * .21, 1.24, .91], .14, .16, [0, side * 20, -side * 35]));
  parts.push(tapered("弓齿兽较短的后垂尾", hide, [[0, 1.2, -1.12], [.05, .66, -1.43], [.08, .38, -1.45]], [.064, .036, .01]));
  return parts;
}

// https://samnoblemuseum.ou.edu/permian-monsters-invade-norman/
function cotylorhynchus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("杯鼻龙发达发酵腹腔的极宽桶状躯", hide, [0, .71, -.03], [1.57, 1.28, 1.8]), lobe("杯鼻龙几乎与躯宽相同的宽肩", hide, [0, .77, .57], [1.23, .93, .72]), tapered("杯鼻龙从巨大前躯伸出的短小细颈", hide, [[0, .82, .71], [0, .85, .99]], [.16, .085]), lobe("杯鼻龙相对于胸腹极小的高鼻孔头", pale, [0, .86, 1.1], [.23, .22, .29]), lobe("杯鼻龙小颅前端向下钩曲的吻", hide, [0, .82, 1.23], [.14, .105, .11]), ...eyes([0, .91, 1.11], .076, .022), pointed("杯鼻龙从宽大骨盆延伸的长肌肉尾", hide, [[0, .57, -.78], [.08, .4, -1.27], [.24, .23, -1.76], [.42, .13, -2.11]], [.22, .16, .085, 0])];
  for (const side of [-1, 1]) for (const front of [true, false]) {
    const z = front ? .53 : -.57, ankle: Triple = [side * (front ? .88 : .94), .065, z + .13];
    parts.push(tapered("杯鼻龙低肘低膝而粗壮侧展的四肢", hide, [[side * .5, .63, z], [side * .88, .31, z - .14], ankle], [.19, .145, .075]), lobe("杯鼻龙贴地宽掌", pale, [ankle[0], .055, ankle[2] + .05], [.22, .085, .29]));
    const toes: ModelPart[] = [];
    for (let i = 0; i < 5; i++) toes.push(pointed("杯鼻龙宽掌前端分离的五枚短趾爪", dark, [[ankle[0] + (i - 2) * .038, .067, ankle[2] + .11], [ankle[0] + (i - 2) * .052, .025, ankle[2] + .27]], [.021, 0]));
    parts.push(combineMeshes("杯鼻龙支持宽体的完整短爪足", dark, toes));
  }
  return parts;
}

// https://www.nps.gov/common/uploads/teachers/lessonplans/Simulated%20Fossil%20Dig%3B%20Teacher%27s%20Guide2.pdf
function placerias(): ModelPart[] {
  const parts: ModelPart[] = [lobe("布拉塞氏兽低背粗重的桶形胸腹", hide, [0, .92, -.08], [1.16, 1.2, 1.95]), lobe("布拉塞氏兽发达肩带与几乎无外露颈的前胸", hide, [0, 1.04, .57], [1.08, 1.13, .96]), lobe("布拉塞氏兽深宽高顶的短颅", hide, [0, 1.07, 1.04], [.73, .69, .77]), lobe("布拉塞氏兽宽短的喙状上颌", pale, [0, .89, 1.39], [.45, .27, .31]), lobe("布拉塞氏兽喙下厚颏", hide, [0, .71, 1.29], [.48, .24, .44]), ...eyes([0, 1.22, 1.15], .27, .047), pointed("布拉塞氏兽短而低垂的尾", hide, [[0, .86, -.9], [.06, .49, -1.29], [.1, .29, -1.44]], [.1, .06, 0])];
  for (const side of [-1, 1]) {
    parts.push(part("布拉塞氏兽上颌骨延长成的向下犬齿状骨翼", "extrude", pale, [side * .255, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .105, profile: [{ x: -1.16, y: 1.12 }, { x: -1.42, y: 1.04 }, { x: -1.53, y: .58 }, { x: -1.39, y: .61 }, { x: -1.23, y: .92 }] }));
    for (const front of [true, false]) {
      const z = front ? .5 : -.57, ankle: Triple = [side * .46, .13, z + .08];
      parts.push(tapered("布拉塞氏兽半直立的厚实四肢", hide, [[side * .34, .87, z], [side * .54, .47, z - .1], ankle], [.2, .15, .09]), lobe("布拉塞氏兽不分偶蹄的宽足掌", hide, [ankle[0], .105, ankle[2] + .03], [.32, .18, .37]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 5; i++) toes.push(pointed("布拉塞氏兽宽掌前方的五趾", pale, [[ankle[0] + (i - 2) * .043, .13, ankle[2] + .09], [ankle[0] + (i - 2) * .049, .045, ankle[2] + .24]], [.023, 0]));
      parts.push(combineMeshes("布拉塞氏兽完整承重趾爪", pale, toes));
    }
  }
  return parts;
}

// https://museumsvictoria.com.au/melbournemuseum/resources/dinosaur-walk/
function inostrancevia(): ModelPart[] {
  const parts: ModelPart[] = [lobe("狼蜥兽较轻巧而长腰的捕食躯", hide, [0, .66, -.04], [.6, .67, 1.34]), tapered("狼蜥兽短而有肌肉的前颈", hide, [[0, .73, .43], [0, .83, .73]], [.21, .17]), lobe("狼蜥兽高而细长的深颅", hide, [0, .87, .96], [.36, .43, .66]), lobe("狼蜥兽狭长鼻吻与高位鼻端", pale, [0, .84, 1.23], [.27, .24, .3]), lobe("狼蜥兽有颏部而非猫短鼻的深下颌", hide, [0, .66, 1.05], [.29, .19, .6]), ...eyes([0, .98, 1.02], .135, .032), pointed("狼蜥兽显著长于剑齿虎短尾的细长平衡尾", hide, [[0, .62, -.62], [.1, .42, -1.04], [.24, .23, -1.43], [.36, .18, -1.59]], [.12, .08, .035, 0])];
  for (const side of [-1, 1]) {
    parts.push(pointed("狼蜥兽从上颌内侧露出的长剑齿", pale, [[side * .121, .81, 1.18], [side * .125, .66, 1.235], [side * .12, .56, 1.23]], [.034, .025, 0]));
    for (const front of [true, false]) {
      const z = front ? .41 : -.4, ankle: Triple = [side * .35, .07, z + .07];
      parts.push(tapered("狼蜥兽半侧展而逐渐收至腹下的步行肢", hide, [[side * .2, .63, z], [side * .39, .33, z - .09], ankle], [.108, .073, .035]), lobe("狼蜥兽接地的较长足掌", dark, [ankle[0], .05, ankle[2] + .065], [.15, .075, .21]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 5; i++) toes.push(pointed("狼蜥兽足掌前端五枚可分辨的趾爪", pale, [[ankle[0] + (i - 2) * .023, .05, ankle[2] + .1], [ankle[0] + (i - 2) * .028, .018, ankle[2] + .2]], [.012, 0]));
      parts.push(combineMeshes("狼蜥兽完整承重爪足", pale, toes));
    }
  }
  return parts;
}

export const landAnimalExpansionBatchFourDesigns: MasterNatureDesign[] = [
  design("quetzalcoatlus", "风神翼龙", "动物", quetzalcoatlus, ["Quetzalcoatlus northropi", "四足腕行长颈无齿巨喙与收折翼指"]),
  design("megaloceros", "大角鹿", "动物", megaloceros, ["Megaloceros giganteus", "近四米横展连续掌叶骨角"]),
  design("toxodon", "弓齿兽", "动物", toxodon, ["Toxodon platensis", "前短后长三趾粗肢与扁平前伸门齿"]),
  design("cotylorhynchus", "杯鼻龙", "动物", cotylorhynchus, ["Cotylorhynchus romeri", "巨大桶腹极小头和低侧展粗肢"]),
  design("placerias", "布拉塞氏兽", "动物", placerias, ["Placerias hesternus", "宽短喙颅犬齿状骨翼与桶躯"]),
  design("inostrancevia", "狼蜥兽", "动物", inostrancevia, ["Inostrancevia", "细长深颅剑犬齿与半侧展步行肢"]),
];
