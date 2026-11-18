import { combineMeshes, design, eyes, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#a9b19a";
const pale = "#c6caad";
const dark = "#83917c";

// https://ivpp.cas.cn/sourcedb/zw/lwk/201810/t20181015_5142288.html
function lotosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("芙蓉龙宽厚短躯与四足承重的深胸", [[-.58, .39, .13, .18], [-.2, .43, .27, .28], [.36, .45, .25, .27], [.57, .46, .14, .18]], hide), tapered("芙蓉龙短而上举的粗颈", hide, [[0, .51, .42], [0, .59, .68]], [.13, .085]), lobe("芙蓉龙短高且前端收窄的无齿颅", hide, [0, .63, .805], [.235, .26, .31]), lobe("芙蓉龙完全无齿的短角质上喙", pale, [0, .578, .953], [.18, .115, .13]), lobe("芙蓉龙无齿下颌与较深颏", hide, [0, .489, .82], [.18, .11, .28]), ...eyes([0, .7, .815], .082, .023), part("芙蓉龙由神经棘支撑的低圆弧完整背帆", "extrude", hide, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .047, profile: [{ x: -.6, y: .613 }, { x: -.49, y: .91 }, { x: -.27, y: 1.083 }, { x: .01, y: 1.15 }, { x: .3, y: 1.077 }, { x: .53, y: .85 }, { x: .63, y: .55 }, { x: .34, y: .661 }, { x: -.18, y: .674 }] }), pointed("芙蓉龙帆下骨盆向后延伸的较粗尾", hide, [[0, .36, -.49], [.045, .27, -.9], [.145, .18, -1.27], [.23, .14, -1.59]], [.15, .11, .056, 0])];
  for (const side of [-1, 1]) for (const front of [true, false]) {
    const z = front ? .34 : -.36, ankle: Triple = [side * .3, .07, z + .08];
    parts.push(tapered("芙蓉龙较直立且前后均强壮的承重肢", hide, [[side * .18, front ? .43 : .38, z], [side * .33, .23, z - .025], ankle], front ? [.083, .058, .032] : [.102, .065, .035]), lobe("芙蓉龙接地的宽扁足掌", dark, [ankle[0], .049, ankle[2] + .045], [.145, .08, .19]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 5; i++) digits.push(pointed("芙蓉龙宽掌前端分离的五枚短趾", pale, [[ankle[0] + (i - 2) * .022, .049, ankle[2] + .092], [ankle[0] + (i - 2) * .033, .017, ankle[2] + .177 - Math.abs(i - 2) * .012]], [.013, 0]));
    parts.push(combineMeshes("芙蓉龙不采用异齿龙低侧趴姿的完整五趾掌", pale, digits));
  }
  return parts;
}

// https://riviste.unimi.it/index.php/RIPS/article/view/6328
// 同属后躯结构近同的物种只保留一项；长窄弯爪而非宽掘土铲爪。
function trilophosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("三棱龙较短而前胸深的灵活四足躯", [[-.49, .37, .12, .17], [-.15, .42, .21, .27], [.31, .46, .2, .26], [.47, .49, .115, .17]], hide), tapered("三棱龙从深胸前伸的短窄颈", hide, [[0, .52, .35], [0, .61, .59]], [.11, .076]), lobe("三棱龙短而高深并有厚颊区的头", hide, [0, .658, .735], [.25, .34, .34]), lobe("三棱龙齿列之前真正无齿的短喙", pale, [0, .6, .907], [.18, .13, .13]), lobe("三棱龙厚实而短的下颌", hide, [0, .503, .757], [.19, .12, .28]), ...eyes([0, .735, .736], .088, .024), pointed("三棱龙超过躯干长度的粗长平衡尾", hide, [[0, .34, -.42], [.025, .26, -.85], [.11, .17, -1.28], [.24, .14, -1.69]], [.145, .105, .06, 0])];
  for (const side of [-1, 1]) for (const front of [true, false]) {
    const z = front ? .3 : -.32, ankle: Triple = [side * (front ? .3 : .33), .108, z + .13];
    parts.push(tapered("三棱龙近端长于远端且较细长的攀爬肢", hide, [[side * .15, front ? .46 : .375, z], [side * .34, .23, z - .045], ankle], front ? [.059, .037, .023] : [.078, .043, .024]), lobe("三棱龙能展开长趾的窄掌", dark, [ankle[0], .082, ankle[2] + .04], [.13, .088, .16]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 5; i++) {
      const x = ankle[0] + (i - 2) * .028, reach = .17 - Math.abs(i - 2) * .019;
      digits.push(tapered("三棱龙有独立趾节而非鳄鱼短趾的长指", hide, [[ankle[0] + (i - 2) * .019, .087, ankle[2] + .033], [x, .071, ankle[2] + reach]], [.014, .011]), pointed("三棱龙长窄且在末端显著向下回钩的攀爬爪", pale, [[x, .075, ankle[2] + reach], [x, .052, ankle[2] + reach + .067], [x, .016, ankle[2] + reach + .065], [x, .019, ankle[2] + reach + .04]], [.014, .01, .006, 0]));
    }
    parts.push(combineMeshes("三棱龙完整五趾长爪掌", pale, digits));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let row = 0; row < 4; row++) for (let cusp = 0; cusp < 3; cusp++) teeth.push(lobe("三棱龙每枚横宽颊齿上的三枚分离齿尖", pale, [side * (.069 + cusp * .012), .556, .686 + row * .035], [.014, .035 + (cusp === 1 ? .01 : 0), .025]));
  parts.push(combineMeshes("三棱龙不把前喙画成锥齿口的后方三尖齿列", pale, teeth));
  return parts;
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC4450940/
// 取陆上四足支承姿；是否半水生不作为已确定的生态结论。
function proterosuchus(): ModelPart[] {
  const parts: ModelPart[] = [body("古鳄背部无现代鳄式大骨甲的低长躯", [[-.63, .265, .12, .135], [-.21, .305, .23, .22], [.35, .33, .215, .215], [.58, .35, .12, .14]], hide), tapered("古鳄低颈至颅后的连续连接", hide, [[0, .37, .47], [0, .415, .73]], [.115, .078]), lobe("古鳄口后较高而前部低窄的颅盒", hide, [0, .455, .813], [.23, .245, .27]), part("古鳄越过下颌前端并显著下钩的上吻前颌", "extrude", hide, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .16, profile: [{ x: -.836, y: .534 }, { x: -1.14, y: .526 }, { x: -1.302, y: .487 }, { x: -1.437, y: .399 }, { x: -1.441, y: .326 }, { x: -1.356, y: .34 }, { x: -1.224, y: .426 }, { x: -.836, y: .436 }] }), part("古鳄在钩吻后方提前收止的独立下颌", "extrude", dark, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .122, profile: [{ x: -.799, y: .392 }, { x: -1.257, y: .395 }, { x: -1.243, y: .348 }, { x: -.802, y: .326 }] }), ...eyes([0, .516, .842], .081, .023), pointed("古鳄在长低躯后延伸的连续肌肉尾", hide, [[0, .245, -.55], [.025, .19, -1.04], [.13, .12, -1.65], [.29, .09, -2.24]], [.15, .11, .06, 0])];
  for (const side of [-1, 1]) for (const front of [true, false]) {
    const z = front ? .35 : -.39, ankle: Triple = [side * .4, .058, z + .11];
    parts.push(tapered("古鳄肘膝侧展且能四足支承的陆地姿势", hide, [[side * .14, front ? .3 : .255, z], [side * .415, .16, z - .04], ankle], front ? [.06, .044, .022] : [.075, .049, .024]), lobe("古鳄长趾下的低足掌", dark, [ankle[0], .043, ankle[2] + .04], [.12, .065, .16]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 5; i++) digits.push(pointed("古鳄与甲背鳄类不同的分离五趾复原", pale, [[ankle[0] + (i - 2) * .019, .046, ankle[2] + .075], [ankle[0] + (i - 2) * .035, .017, ankle[2] + .185 - Math.abs(i - 2) * .015]], [.012, 0]));
    parts.push(combineMeshes("古鳄完整的侧展五趾掌", pale, digits));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 10; i++) teeth.push(pointed("古鳄直段上颌后倾的小锥齿", pale, [[side * .075, .44, .89 + i * .031], [side * .076, .391, .881 + i * .031]], [.009, 0]));
    for (let i = 0; i < 6; i++) { const z = 1.248 + i * .032, y = .419 - i * .016; teeth.push(pointed("古鳄下钩前颌悬在下颌之前的独立牙列", pale, [[side * .073, y, z], [side * .075, y - .055, z - .01]], [.01, 0])); }
  }
  parts.push(combineMeshes("古鳄直上颌与下钩前颌的连续分离齿列", pale, teeth));
  return parts;
}

export const landAnimalExpansionBatchSeventeenDesigns: MasterNatureDesign[] = [
  design("lotosaurus", "芙蓉龙", "动物", lotosaurus, ["Lotosaurus adentus", "无齿短喙低圆弧背帆及强壮四足五趾掌"]),
  design("trilophosaurus", "三棱龙", "动物", trilophosaurus, ["Trilophosaurus", "短深颅无齿前喙三尖横宽颊齿长指弯爪及粗长尾"]),
  design("proterosuchus", "古鳄", "动物", proterosuchus, ["Proterosuchus fergusi", "向下钩曲并越过下颌尖的齿吻无背骨甲低长躯"]),
];
