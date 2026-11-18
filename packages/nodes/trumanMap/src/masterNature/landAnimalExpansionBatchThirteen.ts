import { combineMeshes, design, eyes, lobe, part, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";
import { hollowPipe } from "./shapedFoods";

const hide = "#a5af98";
const pale = "#c3c7ac";
const dark = "#7d8c77";

// https://nationalzoo.si.edu/animals/western-lowland-gorilla
function gorilla(): ModelPart[] {
  const parts: ModelPart[] = [body("大猩猩从低骨盆升向高肩的宽短桶胸躯", [[-.44, .62, .22, .27], [-.12, .81, .34, .36], [.27, 1.01, .38, .37], [.43, 1.055, .23, .26]], hide), lobe("大猩猩远宽于腰部的强壮肩背", hide, [0, 1.07, .245], [.83, .57, .57]), tapered("大猩猩隐藏在肩肌中的极短粗颈", hide, [[0, 1.13, .29], [0, 1.25, .39]], [.18, .14]), lobe("大猩猩后高且宽厚的颅与咀嚼肌", hide, [0, 1.32, .44], [.42, .43, .4]), lobe("大猩猩使成年头廓呈圆锥而非尖角的矢状嵴软组织", hide, [0, 1.48, .405], [.19, .27, .25]), lobe("大猩猩向前下伸的短宽裸面", dark, [0, 1.235, .6], [.29, .27, .17]), lobe("大猩猩宽鼻翼与前突鼻盾", hide, [0, 1.266, .679], [.135, .075, .058]), lobe("大猩猩宽而不带猩猩颊垫的下颌", dark, [0, 1.105, .576], [.28, .15, .19]), lobe("大猩猩贴合鼻下的短厚上唇", pale, [0, 1.18, .665], [.19, .048, .065]), ...eyes([0, 1.354, .597], .079, .018)];
  for (const side of [-1, 1]) {
    parts.push(lobe("大猩猩连成横眉的发达眶上脊", hide, [side * .078, 1.381, .594], [.18, .071, .091]), lobe("大猩猩颅侧小而贴头的圆耳", dark, [side * .177, 1.32, .413], [.058, .088, .057]), tapered("大猩猩长于后腿且指背承重的强前臂", hide, [[side * .33, 1.065, .225], [side * .49, .6, .41], [side * .43, .17, .575]], [.145, .11, .065]), lobe("大猩猩保持中立腕的厚掌背", dark, [side * .43, .121, .602], [.155, .19, .15]), lobe("大猩猩短而有力的后股", hide, [side * .227, .47, -.26], [.3, .42, .33]), tapered("大猩猩屈曲短后腿与低踝", hide, [[side * .23, .49, -.27], [side * .28, .25, -.155], [side * .25, .077, -.34]], [.095, .071, .046]), lobe("大猩猩后足贴地的长足掌", dark, [side * .25, .049, -.25], [.16, .083, .28]));
    const knuckles: ModelPart[] = [], toes: ModelPart[] = [];
    for (let i = 0; i < 4; i++) {
      const x = side * .43 + (i - 1.5) * .032;
      knuckles.push(tapered("大猩猩先向下再向掌心弯回的独立手指", dark, [[x, .147, .65], [x, .056, .685], [x, .029, .652], [x, .081, .617]], [.021, .021, .018, .014]));
      toes.push(tapered("大猩猩后足四枚前向短趾", dark, [[side * .25 + (i - 1.5) * .029, .046, -.145], [side * .25 + (i - 1.5) * .032, .025, -.071]], [.016, .011]));
    }
    knuckles.push(tapered("大猩猩收在前掌内侧而不接地的拇指", dark, [[side * .378, .16, .59], [side * .35, .102, .632], [side * .373, .094, .654]], [.024, .019, .014]));
    toes.push(tapered("大猩猩后足向内分开的对握大拇趾", dark, [[side * .203, .058, -.22], [side * .136, .04, -.14], [side * .134, .031, -.094]], [.028, .023, .015]));
    parts.push(combineMeshes("大猩猩真实卷指而非平掌触地的完整前手", dark, knuckles), combineMeshes("大猩猩含对握拇趾的完整后足", dark, toes));
    const nostril = hollowPipe("大猩猩鼻翼内的真正短鼻孔", [[side * .039, 1.273, .686], [side * .046, 1.269, .709]], .012, .007); nostril.color = dark; parts.push(nostril);
  }
  return parts;
}

// https://www.amnh.org/exhibitions/dinosaurs-ancient-fossils/display-or-defense/my-what-a-big-skull-you-have
// 颈盾颞窗在活体被皮肤覆盖，外形保留薄实面，不把骨孔误画成穿透活体的大洞。
function protoceratops(): ModelPart[] {
  const parts: ModelPart[] = [body("原角龙短而深的四足躯与后高前低背线", [[-.41, .47, .13, .19], [-.14, .5, .24, .29], [.33, .47, .23, .28], [.51, .46, .13, .18]], hide), tapered("原角龙支承巨盾颅的短厚颈", hide, [[0, .51, .35], [0, .53, .56]], [.16, .14]), lobe("原角龙短深颅与发达颌肌而无三角龙眉角", hide, [0, .54, .697], [.33, .42, .44]), lobe("原角龙深而向下突出的下颌", dark, [0, .37, .74], [.26, .22, .37]), ...eyes([0, .665, .721], .123, .027), part("原角龙下钩鸟喙状的尖上喙", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .16, profile: [{ x: -.77, y: .63 }, { x: -.968, y: .56 }, { x: -.982, y: .4 }, { x: -.91, y: .45 }, { x: -.77, y: .47 }] }), lobe("原角龙与上喙咬合的短下喙", pale, [0, .386, .89], [.14, .09, .17])];
  const frill = polygon("原角龙头后高圆且向两侧展宽的薄骨质颈盾", pale, [[-.12, -.49], [-.28, -.64], [-.34, -.91], [-.25, -1.095], [0, -1.16], [.25, -1.095], [.34, -.91], [.28, -.64], [.12, -.49]], .04, [0, 0, .49]); frill.rotation.x = 90; parts.push(frill);
  // 高尾来自尾椎神经棘；用完整闭壳截面表现，不画成额外漂浮的薄鳍。
  parts.push(body("原角龙两侧压扁而中后段较高的完整尾", [[-1.15, .24, .004, .009], [-1.0, .29, .035, .11], [-.76, .32, .064, .19], [-.5, .39, .095, .16], [-.36, .455, .13, .145]], hide));
  for (const side of [-1, 1]) {
    parts.push(lobe("原角龙颧部向两侧扩展的低骨突", pale, [side * .143, .43, .64], [.11, .105, .13]));
    for (const front of [true, false]) {
      const z = front ? .31 : -.26, ankle: Triple = [side * .245, .069, z + .074];
      parts.push(tapered(front ? "原角龙较短且向侧前撑开的前肢" : "原角龙较粗的承重后肢", hide, [[side * .17, front ? .45 : .49, z], [side * .285, .24, z - .037], ankle], front ? [.079, .052, .029] : [.105, .064, .036]), lobe("原角龙接地的宽短足掌", dark, [ankle[0], .049, ankle[2] + .042], front ? [.14, .08, .185] : [.17, .08, .23]));
      const digits: ModelPart[] = [];
      for (let i = 0; i < (front ? 5 : 4); i++) digits.push(lobe("原角龙前五后四分离的短钝趾", pale, [ankle[0] + (i - (front ? 2 : 1.5)) * .027, .038, ankle[2] + (front ? .13 : .16)], [.027, .042, .06]));
      parts.push(combineMeshes("原角龙完整的前后掌钝趾列", pale, digits));
    }
  }
  return parts;
}

// https://doi.org/10.1016/j.jsames.2008.11.005
function armadillosuchus(): ModelPart[] {
  const parts: ModelPart[] = [body("犰狳鳄有厚腹而非犰狳圆壳的长低躯", [[-.54, .255, .17, .16], [-.21, .285, .32, .26], [.34, .29, .29, .245], [.55, .29, .16, .14]], hide), tapered("犰狳鳄甲盾前缘下仍能独立活动的短颈", hide, [[0, .31, .42], [0, .32, .65]], [.13, .105]), lobe("犰狳鳄较短且深的异齿型颅", hide, [0, .34, .765], [.27, .29, .38]), lobe("犰狳鳄前端低而收窄的短鼻吻", pale, [0, .29, .94], [.18, .14, .19]), lobe("犰狳鳄深后颌与短口裂下缘", dark, [0, .218, .815], [.21, .115, .35]), ...eyes([0, .427, .785], .103, .024), pointed("犰狳鳄不缩成哺乳类短尾的鳄式尾简化复原", hide, [[0, .25, -.45], [.035, .19, -.72], [.12, .13, -.96], [.22, .11, -1.18]], [.145, .105, .057, 0])];
  const shield = sweptProfile("犰狳鳄颈后整块刚性前甲盾的真实厚壁半拱", pale, [[.284, -.16], [.326, -.16], [.326, .16], [.284, .16]], Math.PI, 12); shield.position = { x: 0, y: .24, z: .34 }; shield.rotation.x = -90; parts.push(shield);
  for (let i = 0; i < 7; i++) {
    const z = .128 - i * .088, r = .322 - Math.max(0, i - 3) * .023, band = sweptProfile("犰狳鳄紧接前盾且互相有活动间隙的七条背甲带", pale, [[r - .029, -.039], [r, -.039], [r, .039], [r - .029, .039]], Math.PI, 12);
    band.position = { x: 0, y: .235, z }; band.rotation.x = -90; parts.push(band);
  }
  for (const side of [-1, 1]) {
    parts.push(pointed("犰狳鳄前上颌向下突出的单枚较大犬齿状牙", pale, [[side * .073, .285, .93], [side * .077, .2, .954]], [.019, 0]));
    for (const front of [true, false]) {
      const z = front ? .31 : -.37, ankle: Triple = [side * .39, .053, z + .095];
      parts.push(tapered(front ? "犰狳鳄适于掘挖的强壮前肢" : "犰狳鳄长于一般鳄鱼伏地姿态的后肢", hide, [[side * .2, .285, z], [side * .41, .19, z - .052], ankle], front ? [.075, .056, .029] : [.086, .06, .031]), lobe("犰狳鳄完整低足掌", dark, [ankle[0], .039, ankle[2] + .048], [.145, .064, .19]));
      const claws: ModelPart[] = [];
      for (let i = 0; i < (front ? 5 : 4); i++) claws.push(pointed(front ? "犰狳鳄前足延长的分离掘挖钩爪" : "犰狳鳄后足分离短爪趾", pale, [[ankle[0] + (i - (front ? 2 : 1.5)) * .025, .043, ankle[2] + .1], [ankle[0] + (i - (front ? 2 : 1.5)) * .036, .025, ankle[2] + (front ? .22 : .17) - Math.abs(i - (front ? 2 : 1.5)) * .014]], [.014, 0]));
      parts.push(combineMeshes("犰狳鳄前后足功能不同的完整爪趾列", pale, claws));
    }
  }
  const jawTeeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) jawTeeth.push(lobe("犰狳鳄后颌列区别于等形锥牙的低矮颊齿", pale, [side * .092, .259, .73 + i * .037], [.022, .034, .028]));
  parts.push(combineMeshes("犰狳鳄异型牙列的后部低冠齿", pale, jawTeeth));
  return parts;
}

export const landAnimalExpansionBatchThirteenDesigns: MasterNatureDesign[] = [
  design("gorilla", "西部低地大猩猩", "动物", gorilla, ["Gorilla gorilla gorilla", "宽短胸高肩矢状嵴指背承重前手与对握后拇趾"]),
  design("protoceratops", "原角龙", "动物", protoceratops, ["Protoceratops andrewsi", "薄圆高颈盾深钩喙短四足及侧扁高尾"]),
  design("armadillosuchus", "犰狳鳄", "动物", armadillosuchus, ["Armadillosuchus arrudai", "刚性前甲盾接七条活动甲带短异齿颅与掘爪"]),
];
