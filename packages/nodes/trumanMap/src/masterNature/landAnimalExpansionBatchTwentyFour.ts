import { combineMeshes, design, eyes, leaf, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#a8b29a";
const pale = "#c6cbae";
const dark = "#81917b";

// https://doi.org/10.1080/02724634.1990.10011815
// 前手五指无禽龙拇刺；后足为四趾，长尾同时有上、下方骨化肌腱加强。
function tenontosaurus(): ModelPart[] {
  const tail: [number, number, number, number][] = [[-5.46, .61, .007, .009], [-4.25, .58, .045, .065], [-3.13, .61, .082, .13], [-1.98, .76, .13, .23], [-.81, 1.02, .24, .46]];
  const parts: ModelPart[] = [body("腱龙窄髋深腹且躯椎轻度下凹的四足躯", [[-.94, 1.02, .23, .32], [-.35, 1.07, .39, .53], [.38, 1.055, .345, .47], [.72, 1.14, .19, .28]], hide), body("腱龙约占全长三分之二且基部高深的肌腱长尾", tail, hide), tapered("腱龙由短前胸向前上举的颈", hide, [[0, 1.23, .55], [0, 1.48, .85], [0, 1.6, 1.1]], [.17, .13, .09]), body("腱龙鼻吻加深且外廓近长方形的无冠颅", [[1.02, 1.61, .06, .1], [1.2, 1.63, .12, .165], [1.51, 1.585, .097, .135], [1.69, 1.59, .074, .095]], hide), lobe("腱龙较窄而不横展成鸭嘴的食草喙", pale, [0, 1.535, 1.699], [.165, .125, .145]), lobe("腱龙短深颌与颊部咀嚼肌外廓", pale, [0, 1.432, 1.379], [.18, .15, .43]), ...eyes([0, 1.703, 1.244], .096, .027)];
  for (const side of [-1, 1]) {
    parts.push(tapered("腱龙较长且肱骨强壮的四足承重前肢", hide, [[side * .225, 1.08, .4], [side * .37, .56, .48], [side * .325, .085, .68]], [.098, .067, .036]), lobe("腱龙五指连接的短宽前掌", dark, [side * .325, .059, .72], [.17, .1, .22]), tapered("腱龙股胫长度接近而非鸭嘴龙巨大股短胫的后肢", hide, [[side * .26, 1.06, -.39], [side * .43, .62, -.14], [side * .37, .223, -.42], [side * .36, .08, -.24]], [.17, .114, .05, .034]), lobe("腱龙四趾后足的低宽掌", dark, [side * .36, .055, -.15], [.22, .09, .31]));
    const fingers: ModelPart[] = [], toes: ModelPart[] = [];
    for (let i = 0; i < 5; i++) {
      const x = side * (.325 + (i - 2) * .027), z = .812 - (i > 2 ? (i - 2) * .025 : Math.abs(i - 1) * .006);
      fingers.push(tapered("腱龙五枚短手指中内三较长外二退短的指骨", hide, [[x, .069, .765], [x + side * (i - 2) * .006, .03, z]], [.014, .009]));
      if (i < 3) fingers.push(pointed("腱龙前手内侧不特化成巨拇刺的短钝甲", pale, [[x + side * (i - 2) * .006, .033, z - .004], [x + side * (i - 2) * .006, .017, z + .035]], [.009, 0]));
    }
    for (let i = 0; i < 4; i++) {
      const x = side * (.36 + (i - 1.5) * .046), end = .034 + (i === 0 ? -.07 : i === 2 ? .055 : 0);
      toes.push(tapered("腱龙第一趾保留而不是仅三趾的后足长趾", dark, [[x, .066, -.05], [x + side * (i - 1.5) * .015, .033, end]], [.026, .017]), pointed("腱龙四枚后趾末端短而宽的钝甲", pale, [[x + side * (i - 1.5) * .015, .037, end - .007], [x + side * (i - 1.5) * .018, .018, end + .066]], [.018, 0]));
    }
    for (const color of [hide, pale]) parts.push(combineMeshes("腱龙有五指但没有禽龙式拇刺的完整手", color, fingers.filter(finger => finger.color === color)));
    parts.push(combineMeshes("腱龙深肌腱尾下支撑宽躯的完整四趾后足", dark, toes));
  }
  return parts;
}

// https://doi.org/10.1098/rspb.2008.1554
// https://doi.org/10.5710/AMGH.30.8.2012.574
// 第二趾末爪缺失，按近亲保守补小弯爪，不把推断放大成夸张的大镰刀；短羽亦为亲缘推定。
function austroraptor(): ModelPart[] {
  const parts: ModelPart[] = [body("南方盗龙高髋窄胸而前躯较低的修长躯", [[-.73, 1.18, .14, .23], [-.25, 1.28, .255, .375], [.43, 1.23, .21, .3], [.7, 1.27, .12, .18]], hide), tapered("南方盗龙从低前胸向前伸出的较长轻颈", hide, [[0, 1.35, .55], [0, 1.53, .87], [0, 1.575, 1.17]], [.12, .087, .062]), lobe("南方盗龙低窄长头后方的小颅盒", hide, [0, 1.57, 1.34], [.2, .23, .32]), polygon("南方盗龙长而低且不膨成玫瑰结的上吻", hide, [[-.057, 1.275], [-.073, 1.48], [-.054, 1.81], [-.032, 2], [.032, 2], [.054, 1.81], [.073, 1.48], [.057, 1.275]], .11, [0, 1.487, 0]), polygon("南方盗龙狭直下颌与细薄口缝", pale, [[-.048, 1.292], [-.061, 1.48], [-.046, 1.82], [-.028, 1.988], [.028, 1.988], [.046, 1.82], [.061, 1.48], [.048, 1.292]], .052, [0, 1.424, 0]), ...eyes([0, 1.626, 1.351], .082, .027), pointed("南方盗龙长而窄根的平衡尾", hide, [[0, 1.16, -.63], [.024, 1.02, -1.3], [.075, .9, -2.06], [.17, .85, -2.8], [.27, .91, -3.43]], [.18, .131, .073, .03, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("南方盗龙股胫近等长且跗部偏长的修长后肢", hide, [[side * .18, 1.27, -.3], [side * .33, .8, -.04], [side * .28, .29, -.32], [side * .27, .069, -.03]], [.13, .087, .036, .022]), lobe("南方盗龙两主承重趾根部的窄掌", dark, [side * .28, .047, .016], [.12, .072, .19]), tapered("南方盗龙肱骨不足股骨一半且尺桡骨很短的前臂", hide, [[side * .18, 1.35, .4], [side * .33, 1.14, .49], [side * .28, 1.02, .62]], [.045, .032, .018]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 3; i++) digits.push(tapered("南方盗龙三枚短掌骨到分离指节", hide, [[side * .28 + (i - 1) * .014, 1.023, .615], [side * .28 + (i - 1) * .024, .977, .711]], [.013, .008]), pointed("南方盗龙非大盗龙式巨爪的小手爪", pale, [[side * .28 + (i - 1) * .024, .982, .706], [side * .28 + (i - 1) * .024, .955, .768], [side * .28 + (i - 1) * .024, .987, .779]], [.009, .006, 0]));
    for (const toe of [0, 1]) {
      const x = side * (.274 + toe * .039), end = .255 - toe * .035;
      digits.push(tapered("南方盗龙第三第四趾真正接地的长足趾", dark, [[x, .058, .064], [x + side * toe * .02, .025, end]], [.022, .014]), pointed("南方盗龙承重趾端短弯爪", pale, [[x + side * toe * .02, .03, end - .008], [x + side * toe * .024, .012, end + .064]], [.015, 0]));
    }
    digits.push(tapered("南方盗龙内侧第二趾按关节构造保守上提的指骨", hide, [[side * .23, .077, .009], [side * .211, .147, .092], [side * .211, .176, .145]], [.025, .02, .012]), pointed("南方盗龙第二趾缺失末端按近亲补小弯爪", pale, [[side * .211, .176, .139], [side * .211, .19, .196], [side * .211, .151, .22]], [.014, .009, 0]), pointed("南方盗龙跗内后方小而悬起的第一趾", dark, [[side * .25, .139, -.04], [side * .198, .1, -.102]], [.011, 0]));
    for (const color of [hide, dark, pale]) parts.push(combineMeshes("南方盗龙短手与二趾上提后足的分色完整指趾", color, digits.filter(digit => digit.color === color)));
    const feathers: ModelPart[] = [];
    for (let i = 0; i < 9; i++) feathers.push(leaf("南方盗龙依据近亲补的短前臂顺向窄羽", pale, [side * (.2 + i * .01), 1.306 - i * .031, .426 + i * .017], .012, .11, [160, side * 12, -side * 23]));
    parts.push(combineMeshes("南方盗龙不扩成飞行大翼的保守短臂羽", pale, feathers));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 17; i++) {
    const z = 1.48 + i * .0285, width = z < 1.81 ? .073 - (z - 1.48) / .33 * .019 : .054 - (z - 1.81) / .19 * .022;
    teeth.push(pointed("南方盗龙鼻吻下小而圆锥状且无锯齿刃的牙", pale, [[side * width * .8, 1.493, z], [side * width * .8, 1.465, z + .002]], [.004, 0]));
  }
  parts.push(combineMeshes("南方盗龙狭长颌缘完整细锥齿列", pale, teeth));
  return parts;
}

// https://doi.org/10.1038/nature05849 ; https://doi.org/10.1038/s41598-017-15709-7
// 2026骨架复审：https://doi.org/10.1080/02724634.2026.2716748
// 上颅缺失，按深无齿下颌保守配低冠形；臂羽为近亲推定，不加入无据大头冠或尾羽扇。
function gigantoraptor(): ModelPart[] {
  const parts: ModelPart[] = [body("巨盗龙胸深而骨盆高的宽大非飞行鸟式完整躯", [[-1.26, 2.43, .31, .45], [-.45, 2.61, .61, .87], [.63, 2.69, .54, .78], [1.11, 2.78, .27, .44]], hide), tapered("巨盗龙长颈从深胸前方上举再轻度前伸", hide, [[0, 2.97, .83], [0, 3.55, 1.24], [0, 4.14, 1.72], [0, 4.39, 2.145]], [.27, .21, .155, .1]), lobe("巨盗龙不套用霸王龙巨头的轻小无冠颅", hide, [0, 4.447, 2.337], [.3, .34, .43]), part("巨盗龙深而前端圆钝的无齿上喙保守外廓", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .21, profile: [{ x: -2.314, y: 4.554 }, { x: -2.554, y: 4.502 }, { x: -2.743, y: 4.349 }, { x: -2.715, y: 4.275 }, { x: -2.568, y: 4.339 }, { x: -2.324, y: 4.365 }] }), part("巨盗龙约四十六厘米且前齿骨特别深的下颌", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .18, profile: [{ x: -2.286, y: 4.357 }, { x: -2.5, y: 4.322 }, { x: -2.718, y: 4.262 }, { x: -2.699, y: 4.118 }, { x: -2.53, y: 4.071 }, { x: -2.327, y: 4.181 }] }), ...eyes([0, 4.519, 2.374], .121, .035), pointed("巨盗龙相对躯颈较短且无大尾帆的肌肉尾", hide, [[0, 2.4, -1.11], [.04, 2.15, -2.15], [.15, 1.95, -3.24], [.33, 1.88, -4.2], [.52, 1.96, -4.94]], [.34, .24, .135, .057, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("巨盗龙股胫长且跗骨不短缩的高挑强后肢", hide, [[side * .46, 2.62, -.55], [side * .76, 1.62, -.1], [side * .68, .62, -.55], [side * .64, .115, -.07]], [.29, .19, .077, .046]), lobe("巨盗龙三枚主趾根部的宽掌", dark, [side * .64, .077, .035], [.29, .13, .42]), tapered("巨盗龙长度发达而三指有长指骨的强前臂", hide, [[side * .4, 2.91, .69], [side * .86, 2.22, 1.12], [side * .67, 1.85, 1.61]], [.14, .111, .067]), lobe("巨盗龙三指连接的较长窄掌", hide, [side * .67, 1.806, 1.705], [.19, .19, .29]));
    const hand: ModelPart[] = [], foot: ModelPart[] = [];
    for (let i = 0; i < 3; i++) {
      const x = side * (.67 + (i - 1) * .052), fingerLength = i === 1 ? .33 : i === 0 ? .265 : .29;
      hand.push(tapered("巨盗龙三枚长指骨且不退化成暴龙两指的手", hide, [[x, 1.825, 1.744], [x + side * .013, 1.724, 1.744 + fingerLength]], [.031, .021]), pointed("巨盗龙手末短弯爪而非镰刀龙巨长爪", pale, [[x + side * .013, 1.727, 1.736 + fingerLength], [x + side * .013, 1.664, 1.837 + fingerLength], [x + side * .013, 1.72, 1.875 + fingerLength]], [.025, .016, 0]));
      const toeX = side * (.64 + (i - 1) * .083), end = i === 2 ? .52 : i === 1 ? .46 : .335;
      foot.push(tapered(i === 0 ? "巨盗龙第二跖骨远端向内偏的短内侧趾" : i === 2 ? "巨盗龙比例特别长的第四外侧足趾" : "巨盗龙较长的第三中央足趾", dark, [[i === 0 ? side * .606 : toeX, .138, -.003], [toeX + (i === 0 ? -side * .027 : 0), .053, end]], [.047, .027]), pointed("巨盗龙足趾端低位短弯爪", pale, [[toeX + (i === 0 ? -side * .027 : 0), .059, end - .013], [toeX + (i === 0 ? -side * .035 : 0), .023, end + .133]], [.03, 0]));
    }
    foot.push(pointed("巨盗龙内后侧不触地的第一小趾", dark, [[side * .57, .231, -.053], [side * .46, .153, -.205]], [.024, 0]));
    for (const color of [hide, pale]) parts.push(combineMeshes("巨盗龙完整长指三指手及短末爪", color, hand.filter(finger => finger.color === color)));
    for (const color of [dark, pale]) parts.push(combineMeshes("巨盗龙第二跖内偏第四趾偏长的真实不等长足", color, foot.filter(toe => toe.color === color)));
    const feathers: ModelPart[] = [];
    for (let i = 0; i < 12; i++) feathers.push(leaf("巨盗龙根据近亲保守补形的短前臂羽", pale, [side * (.46 + i * .018), 2.81 - i * .078, .76 + i * .065], .028, .28, [157, side * 14, -side * 29]));
    parts.push(combineMeshes("巨盗龙不冒充飞行翼的顺向短臂羽列", pale, feathers));
  }
  return parts;
}

export const landAnimalExpansionBatchTwentyFourDesigns: MasterNatureDesign[] = [
  design("tenontosaurus", "腱龙", "动物", tenontosaurus, ["Tenontosaurus tilletti", "肌腱龙", "前五指无拇刺后四趾及约三分之二全长的深肌腱尾"]),
  design("austroraptor", "南方盗龙", "动物", austroraptor, ["Austroraptor cabazai", "南盗龙", "低窄长吻细锥齿特别短前臂与长跗后足"]),
  design("gigantoraptor", "巨盗龙", "动物", gigantoraptor, ["Gigantoraptor erlianensis", "深圆钝无齿下颌长股胫三指长臂和内偏II跖长IV趾"]),
];
