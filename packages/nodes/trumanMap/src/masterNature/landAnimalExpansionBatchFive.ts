import { combineMeshes, design, eyes, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#a9b29b";
const pale = "#c6caad";
const dark = "#81907b";

// https://www.nhm.ac.uk/discover/dino-directory/plateosaurus.html
function plateosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("板龙深腹长腰且以强后肢承重的躯", [[-1.08, 1.69, .26, .42], [-.48, 1.72, .49, .71], [.42, 1.91, .43, .65], [.95, 2.08, .24, .4]], hide), tapered("板龙上举但仍较粗的早期蜥脚形类颈", hide, [[0, 2.05, .71], [0, 2.56, 1.28], [0, 3.06, 1.94], [0, 3.16, 2.4]], [.27, .22, .15, .11]), lobe("板龙相对于身躯较小的细长头", pale, [0, 3.18, 2.62], [.31, .31, .61]), lobe("板龙前端略钩曲的短口吻", hide, [0, 3.08, 2.87], [.22, .18, .19]), ...eyes([0, 3.25, 2.65], .112, .034), pointed("板龙粗尾基后延的长平衡尾", hide, [[0, 1.69, -.91], [.04, 1.53, -1.74], [.15, 1.3, -2.55], [.31, 1.17, -3.48], [.43, 1.23, -4.0]], [.31, .23, .13, .06, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("板龙粗股长胫和高踝的双足支承肢", hide, [[side * .35, 1.69, -.4], [side * .58, .96, -.08], [side * .49, .31, -.45], [side * .48, .1, -.05]], [.25, .18, .075, .045]), lobe("板龙后足掌", dark, [side * .48, .07, .08], [.23, .12, .38]), tapered("板龙不能向下旋前的内向短前臂", hide, [[side * .31, 2.04, .65], [side * .57, 1.62, .92], [side * .42, 1.49, 1.17]], [.1, .079, .047]), lobe("板龙掌面向内的五指手掌", pale, [side * .4, 1.47, 1.22], [.11, .18, .21]));
    const toes: ModelPart[] = [];
    for (let i = 0; i < 3; i++) toes.push(pointed("板龙后足三枚发达的前向趾", dark, [[side * .48 + (i - 1) * .065, .08, .19], [side * .48 + (i - 1) * .095, .035, .45 + (i === 1 ? .06 : 0)]], [.035, 0]));
    toes.push(pointed("板龙掌内侧显著增大的钩状拇爪", pale, [[side * .36, 1.47, 1.23], [side * .27, 1.44, 1.41], [side * .25, 1.54, 1.44]], [.048, .032, 0]));
    for (let i = 0; i < 4; i++) toes.push(pointed("板龙除巨拇指外真正分开的四指", pale, [[side * .41 + (i - 1.5) * .024, 1.43, 1.24], [side * .41 + (i - 1.5) * .028, 1.36, 1.37 + .02 * Math.sin(i)], [side * .41 + (i - 1.5) * .028, 1.42, 1.41]], [.017, .012, 0]));
    parts.push(combineMeshes("板龙足趾及五指巨拇爪的完整实体", pale, toes));
  }
  return parts;
}

// https://www.nhm.ac.uk/discover/the-discovery-of-iguanodon.html
function iguanodon(): ModelPart[] {
  const parts: ModelPart[] = [body("禽龙厚重宽腹和高骨盆的完整躯", [[-1.48, 2.15, .37, .58], [-.7, 2.22, .68, .91], [.6, 2.25, .65, .85], [1.35, 2.26, .34, .54]], hide), tapered("禽龙向前下伸的粗颈", hide, [[0, 2.4, .99], [0, 2.57, 1.64], [0, 2.49, 2.1]], [.35, .26, .19]), lobe("禽龙低长的食草颅", hide, [0, 2.48, 2.36], [.43, .52, .85]), lobe("禽龙前端无齿硬喙", pale, [0, 2.33, 2.72], [.4, .25, .35]), lobe("禽龙食草口腔下方厚颌", hide, [0, 2.2, 2.43], [.36, .22, .7]), ...eyes([0, 2.64, 2.32], .17, .048), pointed("禽龙不拖地的深厚长尾", hide, [[0, 2.13, -1.31], [.05, 1.96, -2.48], [.2, 1.79, -3.73], [.39, 1.68, -4.97], [.57, 1.75, -5.8]], [.42, .31, .18, .075, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("禽龙长而粗大的后股胫", hide, [[side * .48, 2.12, -.78], [side * .73, 1.16, -.53], [side * .65, .36, -.95], [side * .64, .15, -.51]], [.34, .23, .12, .08]), lobe("禽龙接地的三趾后足掌", dark, [side * .64, .11, -.34], [.34, .19, .49]), tapered("禽龙能承托体重的较长前肢", hide, [[side * .45, 2.18, .88], [side * .65, 1.13, .76], [side * .62, .24, 1.14]], [.2, .13, .08]), lobe("禽龙三根中指并拢的承重掌", dark, [side * .62, .15, 1.2], [.27, .25, .3]), pointed("禽龙长在手掌内侧而非鼻上的真正拇刺", pale, [[side * .54, .3, 1.17], [side * .34, .41, 1.35]], [.061, 0]), pointed("禽龙掌外侧不承重的第五抓握指", pale, [[side * .74, .27, 1.15], [side * .84, .25, 1.24], [side * .85, .31, 1.3]], [.035, .025, 0]));
    const toes: ModelPart[] = [];
    for (let i = 0; i < 3; i++) { toes.push(lobe("禽龙前掌三枚并拢的中指端甲", pale, [side * .62 + (i - 1) * .069, .11, 1.3], [.064, .12, .13]), pointed("禽龙后足粗短钝趾", pale, [[side * .64 + (i - 1) * .09, .12, -.17], [side * .64 + (i - 1) * .12, .055, .19]], [.063, 0])); }
    parts.push(combineMeshes("禽龙前后足不同承重构造的完整趾列", pale, toes));
  }
  return parts;
}

// https://perot-museum.imgix.net/05-educators/field-trips/educator-guides/PerotMuseum-UltimateDinosaurs-EdGuide.pdf
function ouranosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("豪勇龙宽腹而后段较高的长躯", [[-1.22, 1.65, .29, .49], [-.52, 1.84, .59, .77], [.58, 1.82, .56, .71], [1.24, 1.72, .28, .43]], hide), tapered("豪勇龙向前伸出的低颈", hide, [[0, 1.92, 1.02], [0, 2.02, 1.59]], [.28, .19]), lobe("豪勇龙长而背腹较扁的食草颅", hide, [0, 2.02, 1.93], [.41, .41, .91]), lobe("豪勇龙横向加宽的鸭形硬喙", pale, [0, 1.91, 2.35], [.5, .17, .34]), ...eyes([0, 2.14, 1.86], .165, .04), pointed("豪勇龙粗根至细尖的长尾", hide, [[0, 1.65, -1.05], [.04, 1.46, -2.05], [.16, 1.27, -3.21], [.34, 1.18, -4.45]], [.31, .23, .12, 0])];
  parts.push(part("豪勇龙从背至尾根连续延展的深高神经棘帆", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .065, profile: [{ x: -1.25, y: 1.95 }, { x: -.96, y: 2.53 }, { x: -.52, y: 3.2 }, { x: .12, y: 3.51 }, { x: .76, y: 3.28 }, { x: 1.32, y: 2.68 }, { x: 1.99, y: 1.56 }, { x: 1.46, y: 1.67 }, { x: 1.08, y: 2.02 }, { x: .42, y: 2.49 }, { x: -.61, y: 2.43 }] }));
  for (const side of [-1, 1]) {
    parts.push(tapered("豪勇龙较短的直立前肢", hide, [[side * .37, 1.75, .84], [side * .52, .87, .78], [side * .5, .17, 1.13]], [.16, .11, .058]), lobe("豪勇龙接地并指前掌", dark, [side * .5, .11, 1.2], [.23, .19, .29]), pointed("豪勇龙内侧短拇刺", pale, [[side * .42, .22, 1.17], [side * .29, .3, 1.27]], [.038, 0]), tapered("豪勇龙发达后股与向前支撑的踝足", hide, [[side * .4, 1.72, -.65], [side * .65, .94, -.45], [side * .56, .24, -.79], [side * .54, .1, -.43]], [.28, .2, .085, .06]), lobe("豪勇龙三趾后足掌", dark, [side * .54, .08, -.3], [.29, .14, .41]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 3; i++) digits.push(pointed("豪勇龙后足分开的三枚粗趾", pale, [[side * .54 + (i - 1) * .076, .09, -.15], [side * .54 + (i - 1) * .11, .03, .16]], [.047, 0]));
    parts.push(combineMeshes("豪勇龙完整后趾", pale, digits));
  }
  return parts;
}

// https://www.tyrrellmuseum.com/whats_on/exhibits/breakthroughs
function borealopelta(): ModelPart[] {
  const sections: [number, number, number, number][] = [[-1.25, .72, .45, .41], [-.6, .84, .79, .56], [.6, .86, .82, .58], [1.3, .77, .45, .4]];
  const parts: ModelPart[] = [body("北方盾龙宽低且完整覆甲的躯", sections, hide), tapered("北方盾龙藏在颈甲下的短颈", hide, [[0, .84, 1.0], [0, .76, 1.46]], [.31, .23]), lobe("北方盾龙窄楔状头及圆钝后颅", hide, [0, .69, 1.7], [.54, .43, .68]), lobe("北方盾龙前端短硬喙", pale, [0, .61, 1.98], [.28, .2, .27]), ...eyes([0, .79, 1.81], .19, .037), pointed("北方盾龙没有骨锤的连续尖尾", hide, [[0, .7, -1.15], [.07, .57, -1.86], [.22, .43, -2.66], [.39, .34, -3.46]], [.24, .17, .08, 0])];
  for (const side of [-1, 1]) {
    parts.push(pointed("北方盾龙从肩带两侧真正长出的巨大侧棘", pale, [[side * .62, 1.0, .78], [side * 1.1, 1.17, .69], [side * 1.53, 1.35, .39]], [.22, .16, 0]));
    for (const front of [true, false]) {
      const z = front ? .8 : -.79, ankle: Triple = [side * .61, .11, z + .11];
      parts.push(tapered("北方盾龙宽体之下的短粗四肢", hide, [[side * .46, .74, z], [side * .68, .39, z - .08], ankle], [.17, .12, .07]), lobe("北方盾龙宽厚接地短足", dark, [ankle[0], .09, ankle[2] + .07], [.28, .16, .35]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 4; i++) toes.push(lobe("北方盾龙足端独立的短趾甲", pale, [ankle[0] + (i - 1.5) * .055, .07, ankle[2] + .2], [.052, .07, .1]));
      parts.push(combineMeshes("北方盾龙短足完整趾甲列", pale, toes));
    }
  }
  const armor: ModelPart[] = [];
  for (let row = 0; row < 7; row++) {
    const z = -1.02 + row * .33, segment = z < -.6 ? 0 : z < .6 ? 1 : 2, a = sections[segment]!, b = sections[segment + 1]!, t = (z - a[0]) / (b[0] - a[0]), y = a[1] + (b[1] - a[1]) * t, width = a[2] + (b[2] - a[2]) * t, height = a[3] + (b[3] - a[3]) * t;
    for (let col = 0; col < 7; col++) { const angle = col * Math.PI / 6, root: Triple = [Math.cos(angle) * width * .98, y + Math.sin(angle) * height * .98, z]; armor.push(pointed("北方盾龙横向成行并具有后向棱脊的皮骨板", pale, [root, [root[0] + Math.cos(angle) * .065, root[1] + Math.sin(angle) * .12, z - .115]], [.115, 0])); }
  }
  for (let i = 0; i < armor.length; i += 24) parts.push(combineMeshes("北方盾龙贴接躯表的成行棱甲", pale, armor.slice(i, i + 24)));
  const neckArmor: ModelPart[] = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 7; col++) { const a = col * Math.PI / 6, root: Triple = [Math.cos(a) * .29, .8 + Math.sin(a) * .26, 1.14 + row * .17]; neckArmor.push(pointed("北方盾龙颈部横带甲片", pale, [root, [root[0] * 1.05, root[1] + .055, root[2] - .05]], [.075, 0])); }
  parts.push(combineMeshes("北方盾龙包绕短颈的两道完整棱甲带", pale, neckArmor));
  return parts;
}

export const landAnimalExpansionBatchFiveDesigns: MasterNatureDesign[] = [
  design("plateosaurus", "板龙", "动物", plateosaurus, ["Plateosaurus", "上举长颈双足与内向五指巨拇爪"]),
  design("iguanodon", "禽龙", "动物", iguanodon, ["Iguanodon bernissartensis", "前掌三并指承重拇刺及第五抓握指"]),
  design("ouranosaurus", "豪勇龙", "动物", ouranosaurus, ["Ouranosaurus nigeriensis", "完整深高背帆和宽扁鸭形硬喙"]),
  design("borealopelta", "北方盾龙", "动物", borealopelta, ["Borealopelta markmitchelli", "横列棱甲长肩棘与无骨锤尖尾"]),
];
