import { combineMeshes, design, eyes, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#a8b199";
const pale = "#c5caad";
const dark = "#82917b";

// Smith等2007, Zoological Journal of the Linnean Society151:377–421。
// 缺失的前吻与部分肢端按近亲保守补形；不把薄横冠误画成双脊龙的纵向双冠。
function cryolophosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("冰脊龙高髋轻前胸且较细长的完整躯", [[-.84, 1.5, .21, .34], [-.31, 1.63, .36, .51], [.54, 1.61, .3, .44], [.87, 1.68, .16, .26]], hide), tapered("冰脊龙上举后向前伸出的较长S形颈", hide, [[0, 1.76, .68], [0, 2.02, 1.02], [0, 2.29, 1.36], [0, 2.35, 1.68]], [.185, .15, .117, .086]), body("冰脊龙颞区收束而鼻吻低长的窄颅", [[1.57, 2.34, .077, .12], [1.79, 2.355, .14, .195], [2.06, 2.29, .111, .14], [2.35, 2.257, .073, .087]], hide), lobe("冰脊龙长而薄的闭合下颌", pale, [0, 2.17, 1.99], [.2, .14, .74]), ...eyes([0, 2.428, 1.861], .118, .031), pointed("冰脊龙无羽饰且渐细的长平衡尾", hide, [[0, 1.48, -.72], [.035, 1.31, -1.5], [.12, 1.14, -2.4], [.25, 1.025, -3.27], [.36, 1.06, -4.08]], [.24, .177, .1, .046, 0])];
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  const crownTop = [2.63, 2.735, 2.797, 2.815, 2.845, 2.845, 2.815, 2.797, 2.735, 2.63];
  for (let i = 0; i < crownTop.length; i++) {
    const x = -.255 + i * .51 / 9, lower = 2.49 + Math.abs(x) * .11, crease = Math.sin(i * Math.PI / 2) * .019;
    vertices.push({ x, y: lower, z: 1.797 + crease }, { x, y: crownTop[i]!, z: 1.797 + crease }, { x, y: lower, z: 1.832 + crease }, { x, y: crownTop[i]!, z: 1.832 + crease });
    if (i) { const a = (i - 1) * 4, b = i * 4; indices.push(a, a + 1, b, a + 1, b + 1, b, a + 2, b + 2, a + 3, a + 3, b + 2, b + 3, a, b, a + 2, a + 2, b, b + 2, a + 1, a + 3, b + 1, a + 3, b + 3, b + 1); }
  }
  indices.push(0, 2, 1, 1, 2, 3, 36, 37, 38, 37, 39, 38);
  parts.push(part("冰脊龙横跨颅宽且具有真实褶曲厚度的薄扇状冠", "mesh", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  for (const side of [-1, 1]) {
    parts.push(tapered("冰脊龙较长胫跗与高髋相接的轻巧后肢", hide, [[side * .255, 1.57, -.34], [side * .405, .9, -.08], [side * .34, .32, -.41], [side * .335, .089, -.08]], [.185, .117, .047, .029]), lobe("冰脊龙三趾后足的窄长掌", dark, [side * .335, .067, .015], [.18, .116, .29]), tapered("冰脊龙不缩成暴龙残臂的弯曲前臂", hide, [[side * .23, 1.68, .58], [side * .4, 1.39, .76], [side * .31, 1.23, 1.02]], [.066, .049, .027]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 3; i++) {
      const x = side * .335 + (i - 1) * .05;
      digits.push(tapered("冰脊龙分开的三枚承重长趾", dark, [[x, .076, .1], [x + (i - 1) * .028, .043, .28 + (i === 1 ? .055 : 0)]], [.027, .019]), pointed("冰脊龙足趾末端短而下弯的爪", pale, [[x + (i - 1) * .028, .045, .27 + (i === 1 ? .055 : 0)], [x + (i - 1) * .032, .021, .36 + (i === 1 ? .055 : 0)]], [.019, 0]), pointed("冰脊龙三枚分离且掌心相向的抓握手指", pale, [[side * .31 + (i - 1) * .024, 1.23, 1.017], [side * .32 + (i - 1) * .033, 1.16, 1.163], [side * .32 + (i - 1) * .033, 1.23, 1.197]], [.017, .012, 0]));
    }
    parts.push(combineMeshes("冰脊龙完整三指手及趾爪", pale, digits), pointed("冰脊龙足掌内后侧不承重的小第一趾", dark, [[side * .309, .155, -.077], [side * .25, .12, -.14]], [.015, 0]));
  }
  return parts;
}

// https://www.naturalsciences.org/learn/faqs/acro-faq
// 颈至近尾的连续高神经棘用厚肌肉外廓包覆，不画成棘龙式极薄高帆。
function acrocanthosaurus(): ModelPart[] {
  const cranialVertices: { x: number; y: number; z: number }[] = [], cranialIndices: number[] = [];
  const cranialSections: [number, number, number, number][] = [[2.38, 3.34, 3.84, .18], [2.68, 3.39, 3.995, .305], [3.45, 3.39, 3.79, .235], [3.88, 3.39, 3.595, .155]];
  for (let i = 0; i < cranialSections.length; i++) {
    const [z, low, high, width] = cranialSections[i]!, middle = (low + high) / 2;
    cranialVertices.push({ x: -width * .85, y: low, z }, { x: -width, y: middle, z }, { x: -width * .65, y: high, z }, { x: width * .65, y: high, z }, { x: width, y: middle, z }, { x: width * .85, y: low, z });
    if (i) { const a = (i - 1) * 6, b = i * 6; for (let j = 0; j < 6; j++) { const k = (j + 1) % 6; cranialIndices.push(a + j, b + j, a + k, a + k, b + j, b + k); } }
  }
  for (let j = 1; j < 5; j++) cranialIndices.push(0, j, j + 1, 18, 18 + j + 1, 18 + j);
  const parts: ModelPart[] = [body("高棘龙宽髋长胸而头部相对窄的重型躯", [[-1.6, 2.75, .48, .65], [-.6, 2.9, .85, 1.03], [.9, 2.9, .78, 1], [1.5, 2.98, .46, .63]], hide), tapered("高棘龙厚颈由长胸向前上方连续伸出", hide, [[0, 3.1, 1.2], [0, 3.45, 1.9], [0, 3.6, 2.5]], [.48, .4, .24]), part("高棘龙颅宽渐窄且下颌缘平直的侧扁深颅", "mesh", hide, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices: cranialVertices, indices: cranialIndices }), body("高棘龙后颌较深而前端渐薄的下颌", [[2.54, 3.225, .18, .17], [2.83, 3.15, .245, .13], [3.47, 3.185, .19, .085], [3.87, 3.205, .125, .055]], pale), ...eyes([0, 3.752, 2.773], .266, .066), pointed("高棘龙平衡宽胸和较短后肢的粗长尾", hide, [[0, 2.71, -1.4], [.04, 2.46, -2.64], [.16, 2.2, -4.15], [.36, 1.97, -5.84], [.61, 1.94, -7.22]], [.49, .36, .211, .091, 0])];
  const ridge: [number, number, number, number][] = [[-3.4, 2.56, .09, 2.76], [-1.6, 3.1, .27, 3.65], [-.6, 3.73, .36, 4.4], [.9, 3.75, .32, 4.33], [1.5, 3.43, .24, 4.12], [2.05, 3.62, .13, 4.01]];
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let i = 0; i < ridge.length; i++) {
    const [z, low, width, high] = ridge[i]!;
    vertices.push({ x: -width, y: low, z }, { x: -width * .22, y: high, z }, { x: width * .22, y: high, z }, { x: width, y: low, z });
    if (i) { const a = (i - 1) * 4, b = i * 4; for (let j = 0; j < 4; j++) { const k = (j + 1) % 4; indices.push(a + j, b + j, a + k, a + k, b + j, b + k); } }
  }
  indices.push(0, 1, 2, 0, 2, 3, 20, 22, 21, 20, 23, 22);
  parts.push(part("高棘龙实际嵌入颈背髋近尾的连续厚肌肉高脊", "mesh", hide, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  for (const side of [-1, 1]) {
    parts.push(tapered("高棘龙较短粗的股胫与强壮足踝", hide, [[side * .59, 2.9, -.68], [side * .93, 1.63, -.12], [side * .8, .51, -.78], [side * .78, .17, -.15]], [.44, .29, .125, .079]), lobe("高棘龙宽厚的三趾后足掌", dark, [side * .78, .122, .045], [.4, .22, .64]), tapered("高棘龙明显较长而强壮的肱骨前臂", hide, [[side * .61, 2.99, 1.02], [side * .94, 2.45, 1.3], [side * .73, 2.2, 1.69]], [.2, .145, .088]), lobe("高棘龙三枚强指连接的厚掌", hide, [side * .73, 2.15, 1.78], [.23, .23, .29]));
    const fingers: ModelPart[] = [], toes: ModelPart[] = [];
    for (let i = 0; i < 3; i++) {
      const x = side * .78 + (i - 1) * .12;
      fingers.push(pointed("高棘龙三枚手掌相向的强弯钩爪", pale, [[side * .73 + (i - 1) * .067, 2.15, 1.82], [side * .74 + (i - 1) * .079, 1.97, 2.09 - i * .025], [side * .74 + (i - 1) * .079, 2.13, 2.16 - i * .025]], [.049, .033, 0]));
      toes.push(tapered("高棘龙扇开的三枚主足趾", dark, [[x, .138, .24], [x + (i - 1) * .058, .072, .61 + (i === 1 ? .1 : 0)]], [.063, .036]), pointed("高棘龙足趾末端的扁长爪鞘", pale, [[x + (i - 1) * .058, .083, .59 + (i === 1 ? .1 : 0)], [x + (i - 1) * .063, .034, .78 + (i === 1 ? .1 : 0)]], [.039, 0]));
    }
    parts.push(combineMeshes("高棘龙完整的三指手爪", pale, fingers), combineMeshes("高棘龙有独立趾骨的承重三趾足", dark, toes), pointed("高棘龙足踝内后方的悬起第一趾", dark, [[side * .706, .325, -.1], [side * .595, .235, -.255]], [.035, 0]));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 12; i++) {
    const z = 2.85 + i * .079, width = z < 3.45 ? .305 - (z - 2.68) / .77 * .07 : .235 - (z - 3.45) / .43 * .08;
    const tooth = polygon("高棘龙薄刃而非暴龙粗锥的上颌牙", pale, [[z - .031, -3.405], [z + .034, -3.405], [z + .019, -3.275]], .021, [side * width * .78 + .0105, 0, 0]); tooth.rotation = { x: 90, y: 0, z: 90 }; teeth.push(tooth);
  }
  parts.push(combineMeshes("高棘龙左右颌缘独立的扁刃齿列", pale, teeth));
  return parts;
}

// https://doi.org/10.1038/nature14307
// 不把有争议的系统位置写死；保留小植食头、强两主指手、短跗及发达第一承重趾。
function chilesaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("智利龙腹部深而前胸紧凑的短植食躯", [[-.43, .67, .14, .21], [-.12, .74, .245, .34], [.4, .77, .21, .29], [.61, .81, .12, .2]], hide), tapered("智利龙从厚肩前上举的短强颈", hide, [[0, .91, .45], [0, 1.12, .67], [0, 1.24, .86]], [.11, .086, .058]), body("智利龙相对于躯体特别小且前吻短钝的植食颅", [[.8, 1.26, .05, .073], [.93, 1.28, .085, .105], [1.09, 1.25, .065, .07], [1.17, 1.245, .046, .045]], hide), lobe("智利龙不扩成鸭嘴龙大喙的圆钝吻端", pale, [0, 1.244, 1.16], [.105, .075, .095]), lobe("智利龙短而深的下颌与植食颏", pale, [0, 1.174, 1.015], [.125, .082, .26]), ...eyes([0, 1.325, .965], .071, .019), pointed("智利龙根部深且末端细长的平衡尾", hide, [[0, .65, -.36], [.024, .52, -.81], [.08, .43, -1.31], [.18, .42, -1.86]], [.16, .117, .061, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("智利龙粗短股胫且远端跗骨明显较短的后肢", hide, [[side * .17, .72, -.16], [side * .28, .43, .015], [side * .235, .15, -.19], [side * .23, .075, -.045]], [.12, .077, .037, .027]), lobe("智利龙宽四趾后足的低平掌", dark, [side * .23, .051, .02], [.19, .083, .23]), tapered("智利龙短而粗壮的非暴龙式两主指前臂", hide, [[side * .16, .8, .39], [side * .283, .625, .5], [side * .215, .57, .66]], [.055, .046, .03]), lobe("智利龙短宽且第一指基节粗厚的掌", hide, [side * .215, .557, .7], [.1, .1, .13]));
    const fingers: ModelPart[] = [], toes: ModelPart[] = [];
    for (let i = 0; i < 2; i++) {
      const x = side * .215 + (i ? side * .027 : -side * .028);
      fingers.push(tapered(i ? "智利龙第二枚较直的强主指" : "智利龙第一枚短厚且明显扭转的主指", hide, [[x, .558, .722], [x + (i ? side * .01 : -side * .024), .525, .795], [x + (i ? side * .007 : -side * .033), .557, .822]], i ? [.019, .015, .009] : [.025, .02, .011]), pointed("智利龙强指末端不夸张为镰刀的短弯爪", pale, [[x + (i ? side * .007 : -side * .033), .557, .815], [x + (i ? side * .007 : -side * .031), .579, .851]], [.01, 0]));
    }
    fingers.push(tapered("智利龙外侧只保留很短的第三残指", hide, [[side * .259, .56, .7], [side * .28, .542, .74]], [.013, .006]));
    for (let i = 0; i < 3; i++) {
      const x = side * .23 + (i - 1) * .043;
      toes.push(tapered("智利龙较短跗下三枚宽主趾", dark, [[x, .059, .082], [x + (i - 1) * .021, .031, .203 + (i === 1 ? .035 : 0)]], [.025, .014]), pointed("智利龙宽足趾端短钝甲", pale, [[x + (i - 1) * .021, .035, .194 + (i === 1 ? .035 : 0)], [x + (i - 1) * .023, .018, .245 + (i === 1 ? .035 : 0)]], [.015, 0]));
    }
    toes.push(tapered("智利龙内侧发达且真正落地的第一承重趾", dark, [[side * .198, .076, .01], [side * .134, .031, .091], [side * .11, .028, .147]], [.03, .023, .014]), pointed("智利龙第一趾末端的短钝甲", pale, [[side * .11, .03, .137], [side * .096, .017, .179]], [.014, 0]));
    parts.push(combineMeshes("智利龙两主指与退化第三指的完整强手", hide, fingers), combineMeshes("智利龙区别于三趾跑行动物的完整四趾足", dark, toes));
  }
  return parts;
}

export const landAnimalExpansionBatchTwentyOneDesigns: MasterNatureDesign[] = [
  design("cryolophosaurus", "冰脊龙", "动物", cryolophosaurus, ["Cryolophosaurus ellioti", "冰冠龙", "薄皱横向扇冠轻前胸长S颈和较长胫跗后肢"]),
  design("acrocanthosaurus", "高棘龙", "动物", acrocanthosaurus, ["Acrocanthosaurus atokensis", "窄长深颅强三指臂及颈背髋近尾连续厚肌肉高脊"]),
  design("chilesaurus", "智利龙", "动物", chilesaurus, ["Chilesaurus diegosuarezi", "小植食颅粗两主指手短跗与第一趾落地的宽四趾足"]),
];
