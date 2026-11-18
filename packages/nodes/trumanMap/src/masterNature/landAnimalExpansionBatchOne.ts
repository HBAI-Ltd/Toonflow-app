import { combineMeshes, design, eyes, leaf, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";
import { fourFeet, hand, head } from "./mammalForms";
import { hollowPipe } from "./shapedFoods";

const fur = "#a9b09a";
const pale = "#c6c9ac";
const dark = "#7d8b79";

// 形态与米制参考：ADW各物种记述；仅原创简化几何，不包含来源图片或模型。
// https://animaldiversity.org/accounts/Litocranius_walleri/
function gerenuk(): ModelPart[] {
  const parts: ModelPart[] = [lobe("长颈羚细胸窄腹的水平躯", fur, [0, .88, 0], [.31, .36, .93]), tapered("长颈羚由肩前实际伸出的长细颈", fur, [[0, .92, .3], [0, 1.16, .39], [0, 1.39, .49]], [.095, .064, .049])];
  head(parts, [0, 1.42, .58], [.14, .16, .26], .055, "none");
  fourFeet(parts, [0, .88, .28], [0, .83, -.29], .103, .035, false, true);
  for (const side of [-1, 1]) {
    parts.push(leaf("长颈羚侧展的椭圆大耳", pale, [side * .053, 1.445, .52], .11, .17, [4, side * 20, -side * 56]), tapered("雄长颈羚根部直立上段反弯的镰角", dark, [[side * .047, 1.48, .51], [side * .07, 1.64, .43], [side * .075, 1.78, .41], [side * .065, 1.83, .48]], [.018, .015, .01, .001]));
  }
  parts.push(tapered("长颈羚短垂尾及尾端毛束", fur, [[0, .91, -.39], [0, .73, -.5], [.025, .67, -.51]], [.018, .013, .005]), lobe("长颈羚尾端小毛帚", dark, [.025, .675, -.51], [.04, .085, .04]));
  return parts;
}

// https://animaldiversity.org/accounts/Antilocapra_americana/
function pronghorn(): ModelPart[] {
  const parts: ModelPart[] = [lobe("叉角羚深胸紧腰的奔跑躯", fur, [0, .79, -.02], [.4, .49, 1.12]), tapered("叉角羚短粗斜颈", fur, [[0, .86, .35], [0, 1.08, .49], [0, 1.16, .57]], [.13, .087, .068])];
  head(parts, [0, 1.18, .64], [.2, .22, .29], .06, "none");
  fourFeet(parts, [0, .8, .3], [0, .77, -.35], .13, .044, false, true);
  for (const side of [-1, 1]) {
    parts.push(leaf("叉角羚向外上举的长耳", pale, [side * .079, 1.245, .56], .075, .16, [-8, side * 20, -side * 36]), tapered("叉角羚直立角干及向后钩尖", dark, [[side * .065, 1.27, .55], [side * .085, 1.43, .54], [side * .092, 1.58, .5], [side * .089, 1.6, .44]], [.025, .024, .014, .001]), tapered("叉角羚从角干前方分出的真正前叉", dark, [[side * .081, 1.4, .54], [side * .103, 1.45, .63], [side * .111, 1.49, .65]], [.018, .012, .001]));
  }
  const mane = Array.from({ length: 8 }, (_, i) => leaf("叉角羚颈后短鬃", dark, [0, 1.055 - i * .021, .385 - i * .018], .032, .085, [-35, 90, 0]));
  parts.push(combineMeshes("叉角羚后颈完整短鬃列", dark, mane), tapered("叉角羚短竖尾", pale, [[0, .81, -.49], [0, .9, -.59]], [.027, .009]));
  return parts;
}

// https://animaldiversity.org/accounts/Connochaetes_gnou/
function blackWildebeest(): ModelPart[] {
  const parts: ModelPart[] = [lobe("白尾角马前肩深重而后腰收窄的躯", fur, [0, .91, 0], [.55, .61, 1.42]), lobe("白尾角马下垂的宽厚前胸", fur, [0, .86, .46], [.6, .76, .55]), tapered("白尾角马宽短而向前下伸的颈", fur, [[0, 1.06, .4], [0, 1.03, .67], [0, .94, .78]], [.2, .18, .14])];
  head(parts, [0, .95, .89], [.31, .33, .43], .12, "none");
  fourFeet(parts, [0, .96, .38], [0, .77, -.43], .18, .061, false, true);
  for (const side of [-1, 1]) {
    parts.push(lobe("白尾角马宽平角基形成的额盾", dark, [side * .11, 1.065, .84], [.25, .095, .16]), tapered("白尾角马向前下折再上钩的双角", dark, [[side * .12, 1.06, .84], [side * .24, .97, .93], [side * .28, .9, 1.07], [side * .25, 1.02, 1.15], [side * .23, 1.24, 1.16]], [.052, .045, .032, .02, .001]), leaf("白尾角马伸向角外侧的长耳", pale, [side * .12, 1.01, .71], .11, .19, [0, side * 40, -side * 72]));
  }
  const hairs: ModelPart[] = [];
  for (let i = 0; i < 12; i++) hairs.push(leaf("白尾角马直立而非下垂的颈背鬃", pale, [0, 1.12, .48 - i * .055], .075, .18, [-12, 90, 0]));
  for (let i = 0; i < 7; i++) hairs.push(leaf("白尾角马下颌短须", pale, [(i - 3) * .032, .86, .92], .045, .18, [170, 0, 0]));
  for (let i = 0; i < 7; i++) hairs.push(leaf("白尾角马前胸下方长毛", pale, [(i - 3) * .045, .7, .43], .06, .23, [165, 0, 0]));
  parts.push(combineMeshes("白尾角马分别贴接颈背颏胸的完整长毛", pale, hairs), tapered("白尾角马明显细长且末端蓬松的尾", pale, [[0, .93, -.6], [.03, .65, -.76], [.05, .23, -.8]], [.027, .045, .035]));
  return parts;
}

// https://animaldiversity.org/accounts/Theropithecus_gelada/
function gelada(): ModelPart[] {
  const parts: ModelPart[] = [lobe("狮尾狒狒厚肩窄腰的竖坐躯", fur, [0, .31, -.015], [.32, .44, .3]), lobe("狮尾狒狒坐骨处承重的后躯", fur, [0, .13, -.075], [.34, .24, .29]), tapered("狮尾狒狒缩在肩披内的短颈", fur, [[0, .42, .025], [0, .53, .07]], [.095, .065])];
  head(parts, [0, .565, .11], [.17, .19, .16], .025, "none");
  for (const side of [-1, 1]) {
    parts.push(tapered("狮尾狒狒落到坐躯前方的长前臂", fur, [[side * .125, .42, .02], [side * .17, .24, .1], [side * .15, .06, .2]], [.05, .036, .023]), tapered("狮尾狒狒屈膝向两侧展开的后肢", fur, [[side * .11, .17, -.04], [side * .21, .08, .035], [side * .18, .028, .16]], [.07, .044, .024]), lobe("狮尾狒狒贴地的长后掌", dark, [side * .18, .023, .19], [.057, .035, .12]), lobe("狮尾狒狒短吻两侧实际颊垫", pale, [side * .06, .54, .155], [.075, .1, .055]));
    hand(parts, [side * .15, .054, .21], .045);
  }
  const mantle: ModelPart[] = [];
  for (let i = 0; i < 24; i++) { const a = i * Math.PI * 2 / 24; mantle.push(leaf("成年雄狮尾狒狒自肩部下垂的长披毛", pale, [Math.cos(a) * .12, .45, Math.sin(a) * .11], .085, .24 + .025 * Math.cos(a), [150, -a * 180 / Math.PI, 0])); }
  parts.push(combineMeshes("狮尾狒狒肩颈连续而非球状狮鬃的长披", pale, mantle), tapered("狮尾狒狒长尾轴", fur, [[0, .12, -.15], [.06, .065, -.31], [.2, .04, -.53]], [.022, .017, .01]), lobe("狮尾狒狒尾末端独立毛簇", dark, [.2, .043, -.53], [.07, .07, .1]));
  return parts;
}

// https://primate.wisc.edu/primate-info-net/pin-factsheets/pin-factsheet-uakari/
function baldUakari(): ModelPart[] {
  const parts: ModelPart[] = [lobe("秃头丑面猴窄胸拱背的长躯", fur, [0, .245, 0], [.22, .3, .32]), lobe("秃头丑面猴向前上伸的薄颈", fur, [0, .39, .1], [.13, .17, .14]), lobe("秃头丑面猴没有冠毛的裸露圆颅", pale, [0, .475, .14], [.16, .185, .16]), lobe("秃头丑面猴宽而扁的裸面", pale, [0, .46, .203], [.15, .13, .035]), ...eyes([0, .493, .219], .045, .012), lobe("秃头丑面猴宽鼻翼与低矮鼻梁", dark, [0, .46, .228], [.055, .027, .018]), lobe("秃头丑面猴宽颏和前突下唇", pale, [0, .415, .224], [.089, .04, .026])];
  for (const side of [-1, 1]) {
    parts.push(lobe("秃头丑面猴露在颅侧的外耳", pale, [side * .079, .48, .128], [.024, .058, .035]), tapered("秃头丑面猴细长前臂与腕", fur, [[side * .09, .34, .07], [side * .15, .19, .135], [side * .13, .047, .2]], [.034, .025, .014]), tapered("秃头丑面猴较粗后股与屈曲小腿", fur, [[side * .08, .22, -.09], [side * .155, .11, -.03], [side * .13, .027, .07]], [.052, .039, .02]), lobe("秃头丑面猴接地足掌", dark, [side * .13, .022, .1], [.045, .029, .095]));
    hand(parts, [side * .13, .04, .213], .034);
  }
  const coat: ModelPart[] = [];
  for (let i = 0; i < 18; i++) { const a = i * Math.PI * 2 / 18; coat.push(leaf("秃头丑面猴胸背向下披覆而头顶缺失的长毛", fur, [Math.cos(a) * .085, .36, Math.sin(a) * .1], .047, .16, [165, -a * 180 / Math.PI, 0])); }
  parts.push(combineMeshes("秃头丑面猴实际围绕肩背的稀长毛", fur, coat), tapered("秃头丑面猴不足躯长一半的非缠绕短尾", fur, [[0, .21, -.13], [.03, .13, -.22], [.06, .1, -.275]], [.025, .025, .012]));
  return parts;
}

// https://animaldiversity.org/accounts/Rhinopithecus_roxellana/
function goldenSnubNosedMonkey(): ModelPart[] {
  const parts: ModelPart[] = [lobe("川金丝猴胸腹厚实的长圆躯", fur, [0, .39, 0], [.32, .53, .33]), lobe("川金丝猴大腿之间的接地坐骨", fur, [0, .145, -.045], [.34, .25, .25]), tapered("川金丝猴被颈毛包围的直立短颈", fur, [[0, .57, .04], [0, .66, .095]], [.105, .08]), lobe("川金丝猴前额高圆而面部扁平的头", fur, [0, .725, .115], [.21, .225, .18]), lobe("川金丝猴前突上唇下颏", pale, [0, .681, .196], [.12, .07, .053]), ...eyes([0, .748, .195], .058, .017)];
  for (const side of [-1, 1]) {
    const nostril = hollowPipe("川金丝猴真正朝前开口的双鼻孔", [[side * .018, .718, .19], [side * .018, .724, .216]], .009, .005); nostril.color = pale;
    parts.push(nostril, leaf("川金丝猴鼻孔外上方突起的鼻瓣", pale, [side * .018, .721, .207], .024, .038, [-13, 0, -side * 20]), lobe("川金丝猴头侧露出的小圆耳", pale, [side * .096, .733, .086], [.035, .055, .028]), tapered("川金丝猴由粗上臂至细手腕的前肢", fur, [[side * .13, .53, .03], [side * .2, .33, .13], [side * .155, .17, .25]], [.055, .041, .024]), tapered("川金丝猴屈膝后肢", fur, [[side * .1, .23, -.06], [side * .2, .13, .04], [side * .17, .026, .17]], [.08, .055, .027]), lobe("川金丝猴接地的长后足", dark, [side * .17, .022, .215], [.058, .034, .14]));
    hand(parts, [side * .155, .165, .27], .045);
  }
  const neckHair: ModelPart[] = [];
  for (let i = 0; i < 20; i++) { const a = i * Math.PI * 2 / 20; neckHair.push(leaf("川金丝猴围绕脸颊与后颈的长毛", pale, [Math.cos(a) * .085, .66, .075 + Math.sin(a) * .065], .06, .16, [145, -a * 180 / Math.PI, 0])); }
  parts.push(combineMeshes("川金丝猴连续颈肩披毛", pale, neckHair), tapered("川金丝猴接近头躯长的长毛尾", fur, [[0, .23, -.13], [.07, .09, -.32], [.25, .045, -.57], [.4, .05, -.68]], [.04, .038, .031, .013]));
  return parts;
}

function batWing(parts: ModelPart[], side: number, shoulder: Triple, wrist: Triple, tips: Triple[], hip: Triple, color: string) {
  const points = [shoulder, wrist, ...tips, hip];
  parts.push(membrane("掌指间真实展开的翼膜", color, points), tapered("前肢上臂至腕的双段翼骨", dark, [shoulder, [wrist[0] * .55, wrist[1] - .025, wrist[2]], wrist], [.007, .005, .003]));
  const fingers = tips.map(tip => tapered("腕部发出的分离长指骨", dark, [wrist, tip], [.003, .001]));
  parts.push(combineMeshes("蝙蝠翼膜内完整指骨扇", dark, fingers), tapered("腕外真实弯曲的游离拇指钩", dark, [wrist, [wrist[0] + side * .012, wrist[1] + .019, wrist[2]], [wrist[0] + side * .019, wrist[1] + .013, wrist[2]]], [.003, .002, .001]));
}

// https://animaldiversity.org/accounts/Hypsignathus_monstrosus/
function hammerHeadedBat(): ModelPart[] {
  const parts: ModelPart[] = [lobe("锤头果蝠短厚的果蝠躯", fur, [0, .16, 0], [.095, .19, .095]), lobe("雄锤头果蝠膨大的喉部声囊外廓", fur, [0, .224, .018], [.1, .11, .09]), lobe("雄锤头果蝠显著膨大且前端方宽的颅吻", pale, [0, .285, .035], [.106, .09, .12]), lobe("雄锤头果蝠宽阔下垂的上唇", dark, [0, .27, .093], [.103, .039, .025]), lobe("雄锤头果蝠分开的裸颏左瓣", pale, [-.023, .248, .078], [.039, .035, .042]), lobe("雄锤头果蝠分开的裸颏右瓣", pale, [.023, .248, .078], [.039, .035, .042]), ...eyes([0, .302, .062], .042, .009)];
  for (const side of [-1, 1]) {
    parts.push(lobe("锤头果蝠圆基阔耳", dark, [side * .055, .321, .005], [.044, .06, .024]), lobe("雄锤头果蝠吻侧鼓起的颊囊", fur, [side * .048, .277, .045], [.043, .065, .07]), tapered("锤头果蝠接至下部翼膜的短后肢", dark, [[side * .025, .09, 0], [side * .035, .036, .005]], [.01, .005]));
    batWing(parts, side, [side * .034, .214, 0], [side * .173, .297, 0], [[side * .455, .237, .003], [side * .36, .11, .002], [side * .2, .073, 0]], [side * .03, .085, 0], fur);
    const claws: ModelPart[] = [];
    for (let i = 0; i < 4; i++) claws.push(needle("锤头果蝠短后足抓握爪", dark, [side * .035 + (i - 1.5) * .003, .038, .005], [side * .035 + (i - 1.5) * .003, .024, .015], .002));
    parts.push(combineMeshes("锤头果蝠后足完整钩爪列", dark, claws));
  }
  return parts;
}

// https://www.bats.org.uk/about-bats/what-are-bats/uk-bats/greater-horseshoe
function greaterHorseshoeBat(): ModelPart[] {
  const parts: ModelPart[] = [lobe("马铁菊头蝠约六厘米头躯的梨形身体", fur, [0, .047, 0], [.03, .045, .027]), lobe("马铁菊头蝠短小宽颅", fur, [0, .079, .011], [.027, .025, .023]), ...eyes([0, .082, .021], .009, .0025)];
  const nose = polygon("马铁菊头蝠真正开口的马蹄状下鼻叶", pale, [[-.009, 0], [-.009, -.009], [-.006, -.014], [0, -.016], [.006, -.014], [.009, -.009], [.009, 0], [.0055, 0], [.0055, -.007], [.003, -.01], [-.003, -.01], [-.0055, -.007], [-.0055, 0]], .0015, [0, .074, .022]);
  nose.rotation.x = 90;
  parts.push(nose, leaf("马铁菊头蝠鼻梁上独立尖三角柳叶", pale, [0, .081, .025], .011, .02, [0, 0, 0]), lobe("马铁菊头蝠柳叶与下鼻叶间的鞍突", pale, [0, .084, .027], [.006, .008, .004]));
  for (const side of [-1, 1]) {
    parts.push(leaf("马铁菊头蝠无耳屏的尖长耳廓", pale, [side * .011, .085, .006], .017, .027, [-10, side * 8, -side * 12]), tapered("马铁菊头蝠细长后肢", dark, [[side * .009, .029, -.003], [side * .02, .012, -.007]], [.003, .0015]));
    batWing(parts, side, [side * .011, .062, 0], [side * .069, .114, 0], [[side * .19, .085, 0], [side * .143, .044, 0], [side * .081, .024, 0]], [side * .018, .018, -.003], fur);
  }
  parts.push(membrane("马铁菊头蝠后肢之间包入长尾的尾间膜", pale, [[-.02, .017, -.007], [.02, .017, -.007], [.011, .009, -.028], [0, .012, -.048], [-.011, .009, -.028]]), tapered("马铁菊头蝠尾间膜内的细尾轴", dark, [[0, .027, -.006], [0, .018, -.025], [0, .012, -.048]], [.003, .002, .001]));
  return parts;
}

export const landAnimalExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("gerenuk", "长颈羚", "动物", gerenuk, ["Litocranius walleri", "长细颈窄胸与镰角"]),
  design("pronghorn", "叉角羚", "动物", pronghorn, ["Antilocapra americana", "角干真正分出前叉与后钩尖"]),
  design("blackWildebeest", "白尾角马", "动物", blackWildebeest, ["Connochaetes gnou", "前下再上弯角与直立颈鬃"]),
  design("gelada", "狮尾狒狒", "动物", gelada, ["Theropithecus gelada", "短吻长肩披与尾端毛簇"]),
  design("baldUakari", "秃头丑面猴", "动物", baldUakari, ["Cacajao calvus", "裸颅扁面与非缠绕短尾"]),
  design("goldenSnubNosedMonkey", "川金丝猴", "动物", goldenSnubNosedMonkey, ["Rhinopithecus roxellana", "前开双鼻孔鼻瓣与厚肩长尾"]),
  design("hammerHeadedBat", "锤头果蝠", "动物", hammerHeadedBat, ["Hypsignathus monstrosus", "膨大方吻垂唇颊囊与宽翼"]),
  design("greaterHorseshoeBat", "马铁菊头蝠", "动物", greaterHorseshoeBat, ["Rhinolophus ferrumequinum", "中空马蹄下鼻叶柳叶和尾间膜"]),
];
