import { combineMeshes, design, eyes, leaf, lobe, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { fourFeet, head } from "./mammalForms";
import { pointed } from "./insectForms";

const hide = "#aab39c";
const pale = "#c7cbae";
const dark = "#80917c";

// https://www.depts.ttu.edu/nsrl/mammals-of-texas-online-edition/Accounts_Introduced_Artiodactyla/Boselaphus_tragocamelus.php
function nilgai(): ModelPart[] {
  const parts: ModelPart[] = [lobe("蓝牛羚前高后低且前胸厚实的躯", hide, [0, 1.04, -.075], [.59, .76, 1.59], [-10, 0, 0]), lobe("蓝牛羚压扁而深的肩颈基", hide, [0, 1.24, .43], [.44, .7, .66]), tapered("蓝牛羚前举而侧面深的颈", hide, [[0, 1.25, .5], [0, 1.58, .75]], [.17, .115])];
  head(parts, [0, 1.64, .92], [.25, .29, .46], .06, "none");
  fourFeet(parts, [0, 1.06, .46], [0, .87, -.54], .19, .054, false, true);
  for (const side of [-1, 1]) parts.push(pointed("蓝牛羚短而近直立且无螺旋的锐角", dark, [[side * .064, 1.76, .77], [side * .088, 1.94, .73], [side * .085, 1.99, .75]], [.027, .018, 0]), leaf("蓝牛羚长而尖的外耳", pale, [side * .09, 1.73, .72], .1, .19, [-5, side * 20, -side * 45]));
  const mane: ModelPart[] = [];
  for (let i = 0; i < 10; i++) mane.push(leaf("蓝牛羚沿后颈到肩端的短直立鬃", dark, [0, 1.53 - i * .025, .62 - i * .019], .043, .09, [-15, 90, 0]));
  for (let i = 0; i < 7; i++) mane.push(leaf("蓝牛羚喉前集中成束而非连续大垂皮的粗须", dark, [(i - 3) * .01, 1.28, .71], .023, .13, [172, 0, 0]));
  parts.push(combineMeshes("蓝牛羚后颈短鬃与喉前旗状毛束", dark, mane), tapered("蓝牛羚垂至跗关节的短尾轴", hide, [[0, 1.01, -.71], [.03, .67, -.88], [.065, .42, -.89]], [.032, .022, .009]), lobe("蓝牛羚尾端毛束", dark, [.065, .44, -.89], [.07, .17, .08]));
  return parts;
}

// https://animaldiversity.org/accounts/Alcelaphus_buselaphus/
function hartebeest(): ModelPart[] {
  const parts: ModelPart[] = [lobe("狷羚肩部陡高而后腰明显降低的长躯", hide, [0, 1.035, -.08], [.45, .59, 1.53], [-13, 0, 0]), lobe("狷羚高前肩窄胸", hide, [0, 1.19, .43], [.43, .65, .56]), tapered("狷羚细而上举的中长颈", hide, [[0, 1.23, .48], [0, 1.57, .75]], [.12, .075]), tapered("狷羚自高额部向前下伸的特别狭长脸", hide, [[0, 1.68, .85], [0, 1.52, 1.08], [0, 1.38, 1.27]], [.1, .077, .045]), lobe("狷羚窄而扁的鼻端", pale, [0, 1.37, 1.285], [.115, .12, .1]), ...eyes([0, 1.66, .91], .075, .025), lobe("狷羚双角下方共享的高耸额骨角座", pale, [0, 1.79, .78], [.16, .3, .18])];
  fourFeet(parts, [0, 1.09, .45], [0, .86, -.57], .16, .047, false, true);
  for (const side of [-1, 1]) parts.push(tapered("狷羚自共角座分出并急折向后的双角", dark, [[side * .045, 1.9, .79], [side * .15, 2.04, .81], [side * .19, 2.15, .7], [side * .15, 2.29, .59]], [.034, .028, .019, .002]), leaf("狷羚位于高角座两侧的细长耳", pale, [side * .069, 1.71, .73], .1, .21, [-3, side * 15, -side * 65]));
  parts.push(tapered("狷羚较长而末端成帚的尾轴", hide, [[0, .96, -.72], [.04, .57, -.92], [.08, .3, -.96]], [.028, .019, .008]), lobe("狷羚尾端较大的长毛帚", dark, [.08, .32, -.96], [.09, .27, .1]));
  return parts;
}

// https://animaldiversity.org/accounts/Hippotragus_niger/
function sableAntelope(): ModelPart[] {
  const parts: ModelPart[] = [lobe("黑马羚厚胸而后腹较收的强健躯", hide, [0, 1.04, -.08], [.54, .68, 1.63]), lobe("黑马羚高而饱满的前肩", hide, [0, 1.22, .43], [.52, .69, .62]), tapered("黑马羚像马颈般高拱的粗颈", hide, [[0, 1.24, .45], [0, 1.62, .59], [0, 1.84, .87]], [.18, .145, .095])];
  head(parts, [0, 1.87, 1.04], [.26, .3, .44], .07, "none");
  fourFeet(parts, [0, 1.06, .46], [0, .98, -.59], .19, .057, false, true);
  for (const side of [-1, 1]) {
    const path: Triple[] = [], radii: number[] = [];
    for (let i = 0; i < 16; i++) { const a = i / 15 * Math.PI * .82; path.push([side * (.073 + Math.sin(a) * .065), 2.0 + Math.sin(a) * .64, .86 - (1 - Math.cos(a)) * .47]); radii.push(.04 * (1 - i / 15) + .001); }
    parts.push(tapered("黑马羚越过后背的长弧刀状真角", pale, path, radii), leaf("黑马羚高颈头侧的尖长耳", pale, [side * .095, 1.94, .85], .1, .2, [0, side * 20, -side * 55]));
  }
  const mane: ModelPart[] = [];
  for (let i = 0; i < 16; i++) { const t = i / 15; mane.push(leaf("黑马羚沿高拱后颈直立的马状硬鬃", dark, [0, 1.81 - t * .45, .72 - t * .44], .055, .17, [-15, 90, 0])); }
  parts.push(combineMeshes("黑马羚完整高颈马鬃", dark, mane), tapered("黑马羚长而细的垂尾", hide, [[0, 1.04, -.75], [.025, .6, -.97], [.06, .31, -.98]], [.028, .018, .007]), lobe("黑马羚尾端毛簇", dark, [.06, .32, -.98], [.075, .22, .08]));
  return parts;
}

// https://nationalzoo.si.edu/animals/sitatunga
function sitatunga(): ModelPart[] {
  const parts: ModelPart[] = [lobe("泽羚后躯高于前胸的低肩圆拱躯", hide, [0, .745, -.055], [.43, .53, 1.08], [9, 0, 0]), lobe("泽羚较高的后臀部", hide, [0, .82, -.37], [.41, .5, .43]), tapered("泽羚由低前胸伸出的细颈", hide, [[0, .78, .31], [0, 1.04, .51]], [.11, .071])];
  head(parts, [0, 1.1, .64], [.19, .23, .3], .045, "none");
  for (const side of [-1, 1]) {
    parts.push(leaf("泽羚头侧椭圆耳", pale, [side * .069, 1.17, .52], .095, .15, [0, side * 15, -side * 48]));
    const hornPath: Triple[] = [], radii: number[] = [];
    for (let i = 0; i < 19; i++) { const t = i / 18, a = t * Math.PI * 2.6; hornPath.push([side * (.055 + t * .075 + Math.sin(a) * .034), 1.2 + t * .46, .53 - t * .26 + Math.cos(a) * .027]); radii.push(.023 * (1 - t) + .001); }
    parts.push(tapered("泽羚向后倾斜而不直冲上方的扭角", pale, hornPath, radii));
    for (const front of [true, false]) {
      const z = front ? .31 : -.39, ankle: Triple = [side * .16, .088, z + .035];
      parts.push(tapered("泽羚前短后长而末端关节细的湿地肢", hide, [[side * .12, front ? .72 : .85, z], [side * .19, .4, z - .03], ankle], [.061, .04, .026]));
      const hooves: ModelPart[] = [];
      for (const toe of [-1, 1]) {
        hooves.push(pointed("泽羚真正相互分开并延长的香蕉形半蹄", dark, [[ankle[0] + toe * .017, .055, ankle[2] - .018], [ankle[0] + toe * .036, .037, ankle[2] + .072], [ankle[0] + toe * .055, .024, ankle[2] + .157]], [.027, .024, .008]), lobe("泽羚蹄后长而较高的悬蹄", dark, [ankle[0] + toe * .02, .105, ankle[2] - .043], [.027, .046, .06]));
      }
      parts.push(combineMeshes("泽羚适应泥沼且真实张开的长蹄", dark, hooves));
    }
  }
  const coat: ModelPart[] = [];
  for (let i = 0; i < 18; i++) { const z = -.43 + Math.floor(i / 3) * .15, x = (i % 3 - 1) * .085; coat.push(leaf("泽羚体表下垂的较长防水毛束", pale, [x, .78 - Math.abs(x) * .2, z], .065, .12, [155, i % 2 ? 20 : -20, 0])); }
  parts.push(combineMeshes("泽羚与躯背相接的长毛被简化", pale, coat), pointed("泽羚短而粗毛的尾", hide, [[0, .8, -.53], [.03, .6, -.7], [.07, .56, -.73]], [.032, .026, 0]));
  return parts;
}

export const landAnimalExpansionBatchNineDesigns: MasterNatureDesign[] = [
  design("nilgai", "蓝牛羚", "动物", nilgai, ["Boselaphus tragocamelus", "深压颈高肩短角和喉前集中须束"]),
  design("hartebeest", "狷羚", "动物", hartebeest, ["Alcelaphus buselaphus", "陡斜背长窄脸与共享高额角座"]),
  design("sableAntelope", "黑马羚", "动物", sableAntelope, ["Hippotragus niger", "高拱马颈直立硬鬃与长弧刀角"]),
  design("sitatunga", "泽羚", "动物", sitatunga, ["Tragelaphus spekii", "前短后高长毛躯与香蕉形张开长蹄"]),
];
