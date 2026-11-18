import { combineMeshes, design, eyes, leaf, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#a9b29a";
const pale = "#c7cbb0";
const dark = "#83917c";

// https://australian.museum/learn/australia-over-time/extinct-animals/diprotodon-optatum/
function diprotodon(): ModelPart[] {
  const parts: ModelPart[] = [body("双门齿兽宽深桶腹与接近水平的背", [[-1.12, 1.08, .33, .44], [-.62, 1.12, .65, .65], [.56, 1.15, .61, .62], [1.0, 1.2, .34, .43]], hide), tapered("双门齿兽承托巨颅的短厚颈", hide, [[0, 1.27, .74], [0, 1.45, 1.17]], [.36, .3]), lobe("双门齿兽巨大的深高颅而非放大袋熊小头", pale, [0, 1.57, 1.38], [.73, .8, .88]), lobe("双门齿兽宽阔而无推测性象鼻的鼻吻", hide, [0, 1.41, 1.76], [.59, .38, .38]), lobe("双门齿兽深大的下颌体", hide, [0, 1.21, 1.48], [.56, .36, .78]), ...eyes([0, 1.69, 1.56], .26, .046), tapered("双门齿兽短而下垂的尾", hide, [[0, 1.04, -1.02], [.04, .73, -1.28], [.08, .62, -1.41]], [.11, .065, .027])];
  for (const side of [-1, 1]) {
    parts.push(leaf("双门齿兽头后短圆耳", pale, [side * .28, 1.8, 1.16], .18, .29, [-13, side * 22, -side * 30]), tapered("双门齿兽前伸并略向上弯的成对下门齿", pale, [[side * .067, 1.28, 1.73], [side * .067, 1.29, 1.96], [side * .065, 1.36, 2.025]], [.03, .028, .018]));
    for (const front of [true, false]) {
      const z = front ? .72 : -.79, ankle: Triple = [side * .46, .145, z + .06];
      parts.push(tapered("双门齿兽上段较长而下段短的近柱状粗肢", hide, [[side * .39, front ? 1.23 : 1.12, z], [side * .49, .46, z - .025], ankle], [.235, .143, .092]), lobe("双门齿兽相对躯体较小且稍内转的足掌", dark, [ankle[0] - side * .02, .099, ankle[2] + .055], [.27, .17, .34], [0, side * 14, 0]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 5; i++) {
        const offset = (i - 2) * .044, inward = -side * .025, length = i === 1 || i === 2 ? .105 : .13;
        toes.push(pointed("双门齿兽小足上独立趾爪", pale, [[ankle[0] + offset + inward, .095, ankle[2] + .125], [ankle[0] + offset + inward - side * .025, .035, ankle[2] + length + .125]], [.017, 0]));
      }
      if (!front) toes.push(lobe("双门齿兽后足第二三趾相连的并趾皮鞘", dark, [ankle[0] - side * .045, .083, ankle[2] + .15], [.087, .081, .105]));
      parts.push(combineMeshes("双门齿兽小型内转五趾足端", pale, toes));
    }
  }
  return parts;
}

// https://doi.org/10.1371/journal.pone.0221824
// 外展屈肘据后续运动学研究；保留极小活动幅度，不沿用早期完全锁死结论。
// https://lens.monash.edu/this-unique-ancient-megabeast-had-perpetually-bent-elbows/
function palorchestes(): ModelPart[] {
  const parts: ModelPart[] = [body("袋貘后躯较高且前胸低垂的厚重躯", [[-.84, .9, .29, .35], [-.4, .96, .49, .52], [.34, .89, .46, .49], [.7, .88, .28, .34]], hide), tapered("袋貘粗短并向前伸出的颈", hide, [[0, .99, .53], [0, 1.12, .87]], [.25, .17]), lobe("袋貘高而狭窄的独特颅", pale, [0, 1.15, 1.03], [.34, .51, .56]), lobe("袋貘细长下颌而非貘的宽大下颌", hide, [0, .94, 1.14], [.25, .19, .5]), tapered("袋貘鼻骨缩后所支持的短柔软上唇复原", hide, [[0, 1.18, 1.24], [0, 1.08, 1.39], [0, 1.01, 1.43]], [.102, .078, .044]), ...eyes([0, 1.26, 1.125], .118, .025), tapered("袋貘短而粗的下垂尾", hide, [[0, .83, -.75], [.04, .57, -.99], [.08, .45, -1.07]], [.1, .062, .023])];
  for (const side of [-1, 1]) {
    parts.push(leaf("袋貘颅后小而圆的外耳", pale, [side * .115, 1.32, .85], .095, .17, [-14, side * 25, -side * 24]), lobe("袋貘前胸宽大的肩肌而非直柱前腿", hide, [side * .29, .84, .38], [.39, .54, .48]), tapered("袋貘外展屈肘的短宽上臂与较长前臂", hide, [[side * .25, 1.0, .42], [side * .63, .59, .22], [side * .43, .16, .6]], [.18, .14, .083]), lobe("袋貘向内收的宽大钩爪前掌", dark, [side * .43, .112, .65], [.27, .18, .28]), lobe("袋貘强壮的后股", hide, [side * .29, .62, -.49], [.4, .6, .5]), tapered("袋貘较直立的承重后胫与跗足", hide, [[side * .29, .71, -.54], [side * .45, .29, -.61], [side * .4, .12, -.39]], [.14, .095, .06]), lobe("袋貘宽短后足", dark, [side * .4, .09, -.32], [.25, .15, .31]));
    const frontClaws: ModelPart[] = [], rearClaws: ModelPart[] = [];
    for (let i = 0; i < 5; i++) {
      const x = side * .43 + (i - 2) * .043, reach = .17 - Math.abs(i - 2) * .017;
      frontClaws.push(pointed("袋貘前掌五枚侧扁而向下回钩的巨爪", pale, [[x, .13, .72], [x, .09, .72 + reach], [x, .031, .74 + reach], [x, .018, .7 + reach]], [.026, .019, .011, 0]));
      rearClaws.push(pointed("袋貘后足较短的五枚趾爪", pale, [[side * .4 + (i - 2) * .039, .09, -.215], [side * .4 + (i - 2) * .045, .029, -.11]], [.015, 0]));
    }
    parts.push(combineMeshes("袋貘能撕取植物的整组巨钩爪", pale, frontClaws), combineMeshes("袋貘完整后足趾爪", pale, rearClaws));
  }
  parts.push(part("袋貘前颌略呈铲形的下门齿", "extrude", pale, [0, .967, 1.335], [1, 1, 1], [0, 0, 0], { depth: .041, profile: [{ x: -.055, y: 0 }, { x: -.055, y: .045 }, { x: .055, y: .045 }, { x: .055, y: 0 }] }));
  return parts;
}

// https://researchonline.ljmu.ac.uk/20006/1/rsos.230358.pdf
function hipparion(): ModelPart[] {
  const parts: ModelPart[] = [body("三趾马短腰深胸且比现代骑乘马轻巧的躯", [[-.61, .96, .19, .28], [-.29, 1.0, .28, .38], [.38, 1.04, .27, .38], [.62, 1.1, .16, .24]], hide), tapered("三趾马较直立的窄长颈", hide, [[0, 1.18, .38], [0, 1.47, .64], [0, 1.62, .74]], [.2, .15, .105]), lobe("三趾马具有延长面部的窄颅", hide, [0, 1.61, .91], [.25, .32, .59], [20, 0, 0]), lobe("三趾马较细的下斜鼻吻", pale, [0, 1.4, 1.14], [.21, .22, .28]), lobe("三趾马口后细长下颌枝", hide, [0, 1.43, .99], [.18, .2, .38]), ...eyes([0, 1.68, .91], .087, .024), tapered("三趾马非绳尾的长毛尾体", dark, [[0, 1.03, -.56], [.04, .78, -.77], [.07, .36, -.91], [.09, .22, -.95]], [.053, .064, .052, .018])];
  for (const side of [-1, 1]) {
    parts.push(leaf("三趾马较短且直立的耳", pale, [side * .079, 1.73, .735], .068, .22, [-12, 0, -side * 10]));
    for (const front of [true, false]) {
      const z = front ? .39 : -.43, fetlock: Triple = [side * .185, .21, z + (front ? -.01 : -.09)];
      parts.push(tapered(front ? "三趾马前臂直立至腕及延长掌骨" : "三趾马发达股骨至后折飞节和长跗骨", hide, front ? [[side * .18, 1.05, z], [side * .205, .63, z - .035], fetlock] : [[side * .19, .98, z], [side * .25, .66, z + .18], [side * .21, .45, z - .13], fetlock], front ? [.094, .047, .029] : [.14, .075, .041, .029]), tapered("三趾马主趾球节向前斜出的系部", hide, [fetlock, [fetlock[0], .08, fetlock[2] + .09]], [.038, .031]), lobe("三趾马单枚中央第三趾承重蹄", dark, [fetlock[0], .055, fetlock[2] + .105], [.115, .1, .155]));
      const sideDigits: ModelPart[] = [];
      for (const digitSide of [-1, 1]) {
        const x = fetlock[0] + digitSide * .052;
        sideDigits.push(tapered("三趾马侧掌骨连接而非凭空粘在蹄上的副趾", hide, [[fetlock[0] + digitSide * .019, .4, fetlock[2] - .012], [x, .2, fetlock[2] + .001], [x + digitSide * .009, .12, fetlock[2] + .026]], [.014, .014, .012]), lobe("三趾马离硬地约五厘米的第二第四趾小蹄", dark, [x + digitSide * .009, .092, fetlock[2] + .043], [.048, .061, .065]));
      }
      parts.push(combineMeshes("三趾马具有独立末端小蹄的完整左右副趾", dark, sideDigits));
    }
  }
  const mane: ModelPart[] = [];
  for (let i = 0; i < 11; i++) { const t = i / 10; mane.push(leaf("三趾马窄短颈鬃", dark, [0, 1.32 + t * .36, .36 + t * .305], .028, .105, [-25, 0, 0])); }
  parts.push(combineMeshes("三趾马颈背沿线连续的短鬃", dark, mane));
  return parts;
}

export const landAnimalExpansionBatchElevenDesigns: MasterNatureDesign[] = [
  design("diprotodon", "双门齿兽", "动物", diprotodon, ["Diprotodon optatum", "巨深颅双下门齿柱状肢与内转小足"]),
  design("palorchestes", "袋貘", "动物", palorchestes, ["Palorchestes azael", "窄高颅外展屈肘强前肢与巨钩爪"]),
  design("hipparion", "三趾马", "动物", hipparion, ["Hipparion", "主蹄承重及具有侧掌骨和独立小蹄的双副趾"]),
];
