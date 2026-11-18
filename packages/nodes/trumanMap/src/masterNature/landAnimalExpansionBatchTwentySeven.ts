import { combineMeshes, design, eyes, leaf, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#a8b19a";
const pale = "#c6caad";
const dark = "#81917b";

// https://doi.org/10.1080/02724634.2014.994746
// Sidor等2003 Palaeontologia africana39:45–52；手足按近缘保守补形，不增无据巨背甲。
function bunostegos(): ModelPart[] {
  const parts: ModelPart[] = [body("瘤头龙粗深桶腹在较直前肢上抬离地面的完整躯", [[-.68, .58, .23, .28], [-.1, .66, .39, .4], [.57, .74, .34, .36], [.82, .75, .19, .23]], hide), tapered("瘤头龙高肩前连接宽头的短厚颈", hide, [[0, .81, .65], [0, .84, .99]], [.205, .16]), lobe("瘤头龙前短后宽且额顶扁平的植食颅", hide, [0, .868, 1.16], [.43, .38, .59]), lobe("瘤头龙宽而钝圆的鼻端与短吻", pale, [0, .8, 1.402], [.33, .19, .21]), lobe("瘤头龙深而向两侧外扩的植食下颌", hide, [0, .667, 1.21], [.36, .19, .45]), ...eyes([0, .93, 1.205], .159, .027), pointed("瘤头龙不像现代蜥蜴拉成长鞭的粗短尾", hide, [[0, .51, -.58], [.033, .31, -.88], [.105, .226, -1.11]], [.15, .081, 0])];
  for (const x of [-.095, 0, .095]) parts.push(lobe("瘤头龙鼻吻最前端独特的三枚半球骨瘤", pale, [x, .921, 1.367], [.096, .115, .104]));
  for (const side of [-1, 1]) {
    parts.push(tapered("瘤头龙眶上骨瘤与颅顶之间真正变细的骨颈", pale, [[side * .105, .951, 1.11], [side * .23, 1.055, 1.075]], [.031, .022]), lobe("瘤头龙在狭骨颈端部膨大的眶后球瘤", pale, [side * .23, 1.06, 1.07], [.12, .12, .13]), tapered("瘤头龙后颞角落球瘤下的第二对骨颈", pale, [[side * .09, .93, .99], [side * .19, 1.03, .9]], [.028, .02]), lobe("瘤头龙与颅顶分离轮廓明显的后颞半球瘤", pale, [side * .19, 1.033, .895], [.108, .113, .117]));
    for (const front of [true, false]) {
      const z = front ? .51 : -.44, ankle: Triple = [side * (front ? .29 : .33), .072, z + .08];
      parts.push(tapered(front ? "瘤头龙较直立且尺骨较长的承重前肢" : "瘤头龙膝较内收而股骨粗短的后肢", hide, front ? [[side * .22, .75, z], [side * .29, .412, z + .01], ankle] : [[side * .23, .59, z], [side * .365, .307, z + .035], ankle], front ? [.101, .072, .038] : [.126, .079, .041]), lobe("瘤头龙近缘型五趾短宽接地掌", hide, [ankle[0], .05, ankle[2] + .041], [.18, .08, .23]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 5; i++) toes.push(tapered("瘤头龙宽足前方分离而非哺乳类蹄瓣的短趾", hide, [[ankle[0] + (i - 2) * .026, .052, ankle[2] + .093], [ankle[0] + (i - 2) * .036, .025, ankle[2] + .166 - Math.abs(i - 2) * .012]], [.016, .01]), pointed("瘤头龙保守短钝趾甲而不做猛兽巨爪", pale, [[ankle[0] + (i - 2) * .036, .029, ankle[2] + .16 - Math.abs(i - 2) * .012], [ankle[0] + (i - 2) * .039, .014, ankle[2] + .207 - Math.abs(i - 2) * .012]], [.011, 0]));
      for (const color of [hide, pale]) parts.push(combineMeshes("瘤头龙支撑抬高桶腹的完整五趾足", color, toes.filter(toe => toe.color === color)));
    }
  }
  return parts;
}

// Gower2003 Osteology of the early archosaurian reptile Erythrosuchus africanus。
// 踝足复审：https://doi.org/10.1111/j.1096-3642.1996.tb00128.x
// 与钩吻古鳄Proterosuchus分开：引鳄极短颈、巨大深颅、无背骨甲且第五足趾保留。
function erythrosuchus(): ModelPart[] {
  const parts: ModelPart[] = [body("引鳄相对巨颅很短且胸腹宽深的笨重躯", [[-.77, .54, .18, .25], [-.24, .64, .34, .42], [.43, .72, .31, .4], [.72, .76, .19, .28]], hide), tapered("引鳄颈部极短且几乎直接从厚肩接到巨颅", hide, [[0, .86, .6], [0, .955, .9]], [.23, .21]), part("引鳄占头躯比例很大且后深前略低的巨颅", "extrude", hide, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .33, profile: [{ x: -.86, y: 1.2 }, { x: -1.12, y: 1.374 }, { x: -1.52, y: 1.363 }, { x: -1.95, y: 1.18 }, { x: -2.017, y: 1.026 }, { x: -1.94, y: .91 }, { x: -1.13, y: .884 }, { x: -.865, y: .955 }] }), part("引鳄不在鼻端下钩的粗深下颌", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .274, profile: [{ x: -.876, y: .967 }, { x: -1.15, y: .833 }, { x: -1.93, y: .842 }, { x: -1.995, y: .913 }, { x: -1.968, y: .75 }, { x: -1.155, y: .694 }, { x: -.876, y: .799 }] }), ...eyes([0, 1.229, 1.146], .158, .041), pointed("引鳄短重躯后方比古鳄更粗基的连续平衡尾", hide, [[0, .52, -.67], [.024, .381, -1.2], [.09, .28, -1.8], [.19, .25, -2.425]], [.2, .14, .078, 0])];
  for (const side of [-1, 1]) for (const front of [true, false]) {
    const z = front ? .44 : -.43, ankle: Triple = [side * .405, .077, z + .108];
    parts.push(tapered("引鳄半直立且膝肘不极端平展的短强四肢", hide, front ? [[side * .215, .715, z], [side * .455, .364, z - .07], ankle] : [[side * .218, .57, z], [side * .465, .299, z + .01], ankle], front ? [.096, .065, .034] : [.123, .075, .036]), lobe("引鳄具宽跖垫而非高跗恐龙足的五趾掌", hide, [ankle[0], .052, ankle[2] + .043], [.18, .083, .25]));
    if (!front) parts.push(lobe("引鳄踝外侧较小跟突的软组织外廓", hide, [side * .449, .12, z + .041], [.09, .09, .105]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 5; i++) {
      const x = ankle[0] + side * (i - 2) * .029, length = i === 2 ? .209 : i === 1 ? .18 : i === 3 ? .193 : i === 0 ? .143 : .122;
      digits.push(tapered("引鳄第二至四跖较近而第五趾仍保留的独立足趾", hide, [[x, .057, ankle[2] + .091], [x + side * (i - 2) * .014, .025, ankle[2] + length]], [.018, .011]));
      if (i < 3) digits.push(pointed("引鳄内侧主趾上的短弯甲", pale, [[x + side * (i - 2) * .014, .029, ankle[2] + length - .005], [x + side * (i - 2) * .017, .014, ankle[2] + length + .049]], [.012, 0]));
    }
    for (const color of [hide, pale]) parts.push(combineMeshes("引鳄第三趾较长且外第五趾较短的完整足", color, digits.filter(digit => digit.color === color)));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 13; i++) {
    const z = 1.19 + i * .057, y = .884 + (z - 1.13) / .81 * .026 + .009;
    const tooth = polygon("引鳄巨大深头颌缘独立的后弯侧扁肉食牙", pale, [[z - .018, -y], [z + .022, -y], [z + .006, -(y - .078)]], .014, [side * .147 + .007, 0, 0]); tooth.rotation = { x: 90, y: 0, z: 90 }; teeth.push(tooth);
  }
  parts.push(combineMeshes("引鳄没有古鳄下钩前颌的连续刃齿列", pale, teeth));
  return parts;
}

// https://doi.org/10.1111/j.1096-3642.2009.00464.x
// 与进阶镰刀龙的宽髋短跗四承重趾不同；前颅缺失处保守补齐，短臂羽为亲缘推定。
function falcarius(): ModelPart[] {
  const parts: ModelPart[] = [body("铸镰龙窄髋较轻胸腹而不成镰刀龙大桶腹的躯", [[-.45, .82, .12, .2], [-.14, .88, .22, .34], [.48, .95, .19, .28], [.69, .99, .1, .17]], hide), tapered("铸镰龙向前上伸出且没有厚嗉囊的长颈", hide, [[0, 1.08, .55], [0, 1.33, .8], [0, 1.555, 1.07], [0, 1.616, 1.24]], [.109, .081, .056, .039]), body("铸镰龙有齿小颅与前端略下弯的窄吻", [[1.17, 1.625, .037, .057], [1.3, 1.647, .062, .082], [1.466, 1.606, .043, .05], [1.545, 1.597, .027, .025]], hide), lobe("铸镰龙小头下不延成鹦鹉大喙的细长下颌", pale, [0, 1.559, 1.4], [.089, .065, .285]), ...eyes([0, 1.683, 1.322], .05, .016), pointed("铸镰龙比进阶镰刀龙更细长的平衡尾", hide, [[0, .8, -.37], [.02, .685, -.91], [.07, .582, -1.53], [.16, .55, -2.14], [.24, .588, -2.56]], [.13, .091, .052, .02, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("铸镰龙窄股与长跗部支持的三趾双足后肢", hide, [[side * .145, .87, -.13], [side * .26, .557, .056], [side * .225, .245, -.194], [side * .218, .066, .019]], [.105, .071, .03, .018]), lobe("铸镰龙不铺成四趾鸭蹼式的窄长后掌", dark, [side * .218, .047, .078], [.12, .073, .21]), tapered("铸镰龙保留较长且能向内抓握的三指前臂", hide, [[side * .135, .98, .43], [side * .31, .74, .65], [side * .25, .64, .92]], [.05, .039, .023]));
    const hand: ModelPart[] = [], foot: ModelPart[] = [];
    for (let i = 0; i < 3; i++) {
      const x = side * (.25 + (i - 1) * .024), z = 1.034 + (i === 1 ? .032 : 0);
      hand.push(tapered("铸镰龙细长掌骨和三枚分离的主指节", hide, [[x, .642, .915], [x + side * .007, .586, z]], [.016, .01]), pointed("铸镰龙约十厘米而非巨镰刀近米长的弯手爪", pale, [[x + side * .007, .59, z - .007], [x + side * .007, .555, z + .082], [x + side * .007, .622, z + .107]], [.012, .008, 0]));
      const toeX = side * .218 + (i - 1) * .032, end = .234 + (i === 1 ? .045 : 0);
      foot.push(tapered("铸镰龙三枚承担体重而没有第四落地趾的长后趾", dark, [[toeX, .057, .141], [toeX + (i - 1) * .023, .025, end]], [.02, .012]), pointed("铸镰龙普通后趾端的小爪", pale, [[toeX + (i - 1) * .023, .029, end - .006], [toeX + (i - 1) * .027, .013, end + .055]], [.012, 0]));
    }
    foot.push(pointed("铸镰龙内后方悬起而不是进阶镰刀龙承重的大趾", dark, [[side * .199, .147, .018], [side * .153, .106, -.057]], [.011, 0]));
    for (const color of [hide, pale]) parts.push(combineMeshes("铸镰龙完整长指短弯爪手", color, hand.filter(finger => finger.color === color)));
    for (const color of [dark, pale]) parts.push(combineMeshes("铸镰龙三主趾及悬起小第一趾的完整后足", color, foot.filter(toe => toe.color === color)));
    const feathers: ModelPart[] = [];
    for (let i = 0; i < 9; i++) { const t = i / 8; feathers.push(leaf("铸镰龙依据近亲补形的短顺向前臂羽", pale, [side * (.31 - t * .06), .74 - t * .1, .65 + t * .27], .017, .142, [158, side * 10, -side * 22])); }
    parts.push(combineMeshes("铸镰龙不变成鸟类大翅的保守短臂羽", pale, feathers));
  }
  return parts;
}

export const landAnimalExpansionBatchTwentySevenDesigns: MasterNatureDesign[] = [
  design("bunostegos", "瘤头龙", "动物", bunostegos, ["Bunostegos akokanensis", "瘤顶龙", "抬高桶腹直立前肢三枚鼻瘤及有细骨颈的眶后球瘤"]),
  design("erythrosuchus", "引鳄", "动物", erythrosuchus, ["Erythrosuchus africanus", "红鳄", "极短颈不下钩巨大深头无背骨甲短强半直立四肢与五趾足"]),
  design("falcarius", "铸镰龙", "动物", falcarius, ["Falcarius utahensis", "犹他铸镰龙", "窄髋长跗长颈小有齿头短弯手爪三主趾及悬起小第一趾"]),
];
