import { combineMeshes, design, eyes, frontCup, lobe, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";
import { body, pectorals, ribbon } from "./fishForms";
import { tail } from "./marine";

const skin = "#9eafa2";
const fin = "#bdc6ad";
const pale = "#cfceb8";
const dark = "#738879";

// 形态依据为博物馆/研究机构的种级描述；下列几何均为本地独立绘制，不取用其图片或模型。
// https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/hogfish/
function hogfish(): ModelPart[] {
  const parts: ModelPart[] = [body("猪齿鱼高圆侧扁体与前伸锥吻", [[.31, .18, .015, .025], [.23, .2, .045, .06], [.09, .21, .075, .17], [-.13, .19, .058, .14], [-.26, .15, .018, .035]], skin), ...eyes([0, .27, .18], .043, .026), frontCup("长吻端部可前突的小口", pale, [0, .175, .315], .018, .013), ...tail([0, .15, -.26], .105, true), ribbon("猪齿鱼后半背鳍", .03, -.23, .31, .075), ribbon("后掠尖端臀鳍", -.04, -.23, .095, -.055)];
  for (let index = 0; index < 3; index++) parts.push(tapered("前三根延长并后飘的粗背鳍棘", fin, [[0, .3 + index * .018, .12 - index * .045], [0, .51 - index * .035, .075 - index * .065], [0, .49 - index * .045, -.08 - index * .045]], [.006, .003, .0006]));
  for (const side of [-1, 1]) parts.push(tapered("长吻前颌实际犬齿", pale, [[side * .009, .173, .323], [side * .009, .184, .33]], [.0025, .0003]));
  pectorals(parts, [0, .17, .11], .135, .02); return parts;
}

// https://biogeodb.stri.si.edu/caribbean/en/thefishes/species/3434
function flyingGurnard(): ModelPart[] {
  const parts: ModelPart[] = [body("飞鲂鮄骨盔后渐细的长躯", [[.16, .055, .045, .035], [.065, .06, .055, .05], [-.15, .05, .03, .032], [-.235, .04, .009, .014]], skin), ...eyes([0, .091, .12], .031, .015), ...tail([0, .04, -.24], .043, true), ribbon("低长第二背鳍", -.015, -.19, .085, .035)];
  for (const side of [-1, 1]) {
    parts.push(tapered("骨质头盔向后突出的尖角", pale, [[side * .04, .087, .105], [side * .055, .102, -.015]], [.014, .0004]), membrane("前段独立且较短的操作胸鳍", fin, [[side * .04, .045, .08], [side * .1, .025, .11], [side * .125, .019, .045], [side * .05, .035, .015]]));
    const outline: Triple[] = [[side * .045, .045, .045], [side * .12, .055, .005], [side * .245, .052, -.095], [side * .29, .037, -.205], [side * .22, .025, -.26], [side * .13, .026, -.23], [side * .045, .034, -.08]];
    parts.push(membrane("向两侧张开的后段大扇翼胸鳍", fin, outline));
    const rays = Array.from({ length: 11 }, (_, i) => { const t = i / 10, angle = -.1 + t * 1.75; return tapered("扇翼从独立基部放射的硬鳍条", dark, [[side * .047, .041, .025], [side * (.1 + Math.sin(angle) * .17), .038 - t * .012, -.02 - t * .21]], [.0013, .0003]); });
    parts.push(combineMeshes("后段扇翼的完整放射鳍条", dark, rays));
  }
  return parts;
}

// https://animaldiversity.org/accounts/Solenostomus_paradoxus/
function ornateGhostPipefish(): ModelPart[] {
  const parts: ModelPart[] = [body("剃刀鼻幽灵海龙腹部短宽的骨板躯体", [[.018, .048, .009, .012], [-.008, .041, .017, .026], [-.034, .035, .008, .015]], skin), tapered("头部直出的细长管吻", pale, [[0, .048, .016], [0, .046, .059], [0, .045, .071]], [.006, .0034, .003]), ...eyes([0, .056, .019], .007, .005), membrane("短尾柄末端宽大而截方的尾扇", fin, [[0, .042, -.028], [0, .07, -.055], [0, .067, -.085], [0, .012, -.083], [0, .013, -.055], [0, .029, -.029]])];
  parts.push(membrane("与躯体分离可见的第一棘背鳍", fin, [[0, .057, .002], [0, .09, .009], [0, .085, -.013], [0, .048, -.018]]), membrane("靠后短小第二背鳍", fin, [[0, .045, -.023], [0, .059, -.033], [0, .045, -.04]]));
  for (const side of [-1, 1]) parts.push(membrane("腹侧放大的独立腹鳍", fin, [[side * .01, .028, -.002], [side * .023, .007, .018], [side * .023, .005, -.02], [side * .007, .021, -.022]]), membrane("头后很小的胸鳍", fin, [[side * .008, .047, .009], [side * .019, .045, -.001], [side * .01, .04, -.006]]));
  const fringes: ModelPart[] = [];
  for (let i = 0; i < 14; i++) { const z = .06 - i * .009; fringes.push(tapered("骨板边缘分散的分枝皮瓣", pale, [[0, i < 6 ? .049 : .06, z], [.002, i < 6 ? .056 : .068, z - .002], [.006, i < 6 ? .058 : .074, z + .001]], [.001, .0007, .0002])); }
  parts.push(combineMeshes("管吻与背缘的独立皮瓣列", pale, fringes)); return parts;
}

// https://australian.museum/learn/animals/fishes/ribbon-eel-rhinomuraena-quaesita/
function ribbonMoray(): ModelPart[] {
  const path: Triple[] = [[0, .16, .32], [0, .12, .21], [.035, .055, .02], [.1, .04, -.22], [.04, .032, -.42], [-.11, .023, -.48], [-.16, .018, -.36]];
  const parts: ModelPart[] = [tapered("管鼻海鳝连续弯曲的细长无鳞体", skin, path, [.023, .025, .027, .021, .015, .009, .002]), lobe("管鼻海鳝延长的扁头", skin, [0, .161, .335], [.047, .036, .082]), ...eyes([0, .174, .337], .018, .009), frontCup("长颌末端的小口腔", dark, [0, .155, .375], .013, .013), membrane("沿背脊贯通的低长鳍褶", fin, [[0, .18, .3], [0, .157, .22], [.035, .094, .02], [.1, .072, -.22], [.04, .054, -.42], [-.11, .035, -.48], [-.16, .018, -.36], [-.11, .026, -.48], [.04, .037, -.42], [.1, .052, -.22], [.035, .069, .02], [0, .13, .21]])];
  for (const side of [-1, 1]) parts.push(tapered("向前突出的管状鼻孔颈", pale, [[side * .009, .17, .36], [side * .015, .185, .385]], [.003, .002]), membrane("前鼻孔末端显著扩大的叶片口缘", fin, [[side * .015, .184, .381], [side * .03, .209, .392], [side * .018, .216, .403], [side * .008, .198, .396]]));
  parts.push(tapered("下颌正中的感觉皮突", pale, [[0, .144, .364], [0, .127, .397]], [.002, .0003])); return parts;
}

// https://www.calacademy.org/learn-explore/creature-closeups/four-eyed-fish
function fourEyedFish(): ModelPart[] {
  const parts: ModelPart[] = [body("四眼鱼平直水面背线与细长腹体", [[.13, .045, .017, .015], [.065, .044, .024, .026], [-.09, .032, .014, .02], [-.15, .028, .004, .01]], skin), ...tail([0, .028, -.15], .032, true), ribbon("四眼鱼靠后的短背鳍", -.07, -.135, .047, .026), ribbon("腹侧小臀鳍", -.075, -.127, .017, -.017)];
  for (const side of [-1, 1]) {
    parts.push(lobe("突出水面背线的完整大眼球", pale, [side * .014, .064, .104], [.023, .023, .021]), lobe("同一个眼球的上半瞳孔", dark, [side * .023, .069, .11], [.009, .007, .01]), lobe("同一个眼球的下半瞳孔", dark, [side * .024, .058, .11], [.009, .007, .01]), tapered("分隔眼球两视觉区的薄组织横带", skin, [[side * .026, .0635, .099], [side * .026, .0635, .12]], [.0012, .0012]));
  }
  pectorals(parts, [0, .032, .062], .039, .004); return parts;
}

// https://animaldiversity.org/accounts/Gasteropelecus_sternicla/
function freshwaterHatchetfish(): ModelPart[] {
  const parts: ModelPart[] = [body("胸斧鱼头后骤然扩大的斧刃状胸腹龙骨", [[.022, .033, .0035, .004], [.013, .029, .005, .012], [-.001, .023, .006, .021], [-.016, .024, .0034, .015], [-.028, .029, .0015, .004]], skin), ...eyes([0, .035, .014], .0037, .004), ...tail([0, .029, -.029], .008, true), ribbon("胸斧鱼后移的小背鳍", -.013, -.025, .034, .007), ribbon("斧刃后缘的斜向臀鳍", -.01, -.027, .015, -.004)];
  for (const side of [-1, 1]) parts.push(membrane("胸肌驱动的高位长翼胸鳍", fin, [[side * .004, .034, .007], [side * .024, .041, -.006], [side * .027, .039, -.021], [side * .009, .032, -.014]])); return parts;
}

// https://museonoelkempff.org/sitio/Informacion/KEMPFFIANA/Kempffiana%203%282%29/18-22.pdf
function amazonLeaffish(): ModelPart[] {
  const parts: ModelPart[] = [body("叶鱼尖吻与不对称叶片状高侧扁躯", [[.044, .04, .002, .003], [.027, .042, .005, .008], [.005, .038, .009, .025], [-.023, .035, .006, .02], [-.036, .032, .002, .007]], skin), ...eyes([0, .049, .023], .0048, .006), membrane("叶缘般连续而锯状的棘背鳍", fin, [[0, .05, .026], [0, .069, .016], [0, .065, .009], [0, .07, .001], [0, .061, -.008], [0, .062, -.017], [0, .042, -.033]]), membrane("叶片下缘连续的臀鳍", fin, [[0, .022, .002], [0, .005, -.005], [0, .008, -.02], [0, .025, -.035]]), membrane("后缘截圆的小透明尾鳍", fin, [[0, .036, -.034], [0, .043, -.048], [0, .024, -.052], [0, .024, -.036]]), tapered("下颌唯一叶柄状短须", pale, [[0, .034, .038], [0, .025, .052]], [.0015, .0003])];
  pectorals(parts, [0, .034, .012], .013, .002); return parts;
}

// https://zenodo.org/records/4561781
function africanKnifefish(): ModelPart[] {
  const parts: ModelPart[] = [body("大裸背鱼粗前躯至无尾鳍的尖末端", [[.28, .1, .026, .035], [.13, .105, .052, .063], [-.18, .09, .041, .05], [-.45, .06, .014, .028], [-.59, .041, .001, .0015]], skin), ...eyes([0, .12, .23], .022, .009), frontCup("圆钝额部下的终端小口", dark, [0, .085, .286], .016, .01), membrane("几乎沿全背延展的柔软推进鳍而无臀尾腹鳍", fin, [[0, .15, .12], [0, .212, .08], [0, .209, -.07], [0, .185, -.25], [0, .13, -.43], [0, .055, -.57], [0, .044, -.57], [0, .078, -.43], [0, .135, -.25], [0, .154, -.07]])];
  pectorals(parts, [0, .085, .16], .056, .003); return parts;
}

// https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/tripletail/
function atlanticTripletail(): ModelPart[] {
  const parts: ModelPart[] = [body("三尾鲈凹额宽颌与深杏仁形侧体", [[.24, .15, .03, .028], [.16, .16, .066, .065], [.065, .18, .08, .14], [-.17, .17, .054, .115], [-.265, .15, .017, .045]], skin), ...eyes([0, .218, .15], .043, .025), membrane("后背鳍显著扩为圆尾叶形", fin, [[0, .27, .08], [0, .335, -.03], [0, .35, -.2], [0, .3, -.31], [0, .22, -.29], [0, .21, -.19]]), membrane("臀鳍同步扩为第二圆尾叶形", fin, [[0, .092, .005], [0, .025, -.09], [0, .014, -.22], [0, .07, -.31], [0, .125, -.27]]), membrane("与背臀双叶对应的真正圆尾鳍", fin, [[0, .18, -.25], [0, .245, -.34], [0, .23, -.415], [0, .145, -.44], [0, .062, -.385], [0, .075, -.32], [0, .12, -.25]])];
  pectorals(parts, [0, .15, .09], .12, .016); return parts;
}

// https://www.vims.edu/research/units/programs/multispecies_fisheries_research/speciesofinterest/cobia.php
function cobia(): ModelPart[] {
  const parts: ModelPart[] = [body("军曹鱼宽扁额头与长亚圆柱形躯体", [[.52, .18, .045, .04], [.34, .185, .096, .055], [.05, .185, .102, .11], [-.5, .15, .05, .064], [-.7, .13, .017, .032]], skin), ...eyes([0, .218, .395], .069, .024), lobe("略向前伸的宽下颌", pale, [0, .16, .49], [.115, .035, .1]), ...tail([0, .13, -.7], .185, true), membrane("前高后低的柔条第二背鳍", fin, [[0, .27, -.055], [0, .375, -.13], [0, .25, -.52], [0, .18, -.66], [0, .185, -.56]]), ribbon("军曹鱼靠后的长臀鳍", -.17, -.63, .092, -.063)];
  for (let i = 0; i < 8; i++) parts.push(tapered("第一背鳍分离而无连接膜的硬棘", pale, [[0, .25 - i * .001, .29 - i * .043], [0, .294 - i * .003, .28 - i * .043]], [.005, .0006]));
  for (const side of [-1, 1]) parts.push(membrane("军曹鱼长弯镰形胸鳍", fin, [[side * .078, .14, .26], [side * .28, .12, -.01], [side * .21, .105, -.03], [side * .07, .13, .16]])); return parts;
}

// https://www.fao.org/fishery/docs/CDrom/aquaculture/I1129m/file/en/en_milkfish.htm
function milkfish(): ModelPart[] {
  const parts: ModelPart[] = [body("虱目鱼平滑纺锤体与小型终端嘴", [[.4, .15, .015, .022], [.27, .16, .055, .063], [.035, .16, .09, .105], [-.28, .135, .044, .064], [-.41, .12, .012, .025]], skin), ...eyes([0, .184, .29], .045, .021), ribbon("唯一中位高三角背鳍", .03, -.18, .24, .125), ribbon("靠近尾基的小臀鳍", -.29, -.36, .085, -.052)];
  parts.push(membrane("虱目鱼宽大深叉的完整尾鳍", fin, [[0, .14, -.4], [0, .32, -.57], [0, .23, -.58], [0, .12, -.47], [0, .011, -.58], [0, -.05, -.57], [0, .1, -.4]]));
  for (const side of [-1, 1]) {
    parts.push(membrane("低位细长胸鳍", fin, [[side * .045, .12, .21], [side * .13, .07, .04], [side * .06, .08, .055]]), membrane("腹部独立腹鳍", fin, [[side * .04, .073, -.05], [side * .087, .018, -.14], [side * .025, .045, -.16]]));
    const lid = lobe("覆盖眼球的透明脂性眼睑", pale, [side * .052, .184, .29], [.006, .035, .039]); lid.opacity = .25; parts.push(lid);
  }
  return parts;
}

// https://myfwc.com/wildlifehabitats/profiles/saltwater/tarpon/tarpon/
function atlanticTarpon(): ModelPart[] {
  const parts: ModelPart[] = [body("大海鲢高背巨鳞体和陡直上位口头部", [[.58, .19, .047, .035], [.39, .24, .074, .105], [.05, .23, .11, .15], [-.43, .19, .065, .1], [-.62, .16, .02, .035]], skin), lobe("明显上翘突出的大下颌", pale, [0, .16, .535], [.11, .055, .17], [20, 0, 0]), ...eyes([0, .29, .41], .058, .034), ...tail([0, .16, -.62], .205, true), ribbon("单个短背鳍的前部鳍面", .035, -.17, .36, .11), tapered("背鳍最后一根向后延伸的长丝状软条", fin, [[0, .37, -.16], [0, .43, -.32], [0, .4, -.52]], [.006, .003, .0006]), ribbon("后腹部镰形臀鳍", -.32, -.57, .1, -.095)];
  const scales: ModelPart[] = [];
  for (const side of [-1, 1]) for (let row = 0; row < 3; row++) for (let i = 0; i < 11; i++) { const z = .33 - i * .077, width = .085 - Math.max(0, i - 5) * .008; scales.push(lobe("体侧大的重叠圆鳞", pale, [side * width, .14 + row * .07, z + row % 2 * .025], [.018, .068, .092])); }
  for (let i = 0; i < scales.length; i += 25) parts.push(combineMeshes("体侧可辨的粗大圆鳞列", pale, scales.slice(i, i + 25)));
  pectorals(parts, [0, .16, .3], .2, -.012); return parts;
}

// https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/bonefish/
function bonefish(): ModelPart[] {
  const parts: ModelPart[] = [body("北梭鱼长圆锥吻及背凸腹平的细体", [[.3, .085, .005, .013], [.2, .09, .034, .033], [.015, .085, .047, .056], [-.23, .07, .027, .038], [-.32, .06, .008, .017]], skin), ...eyes([0, .111, .205], .024, .017), lobe("长吻覆盖下方的短小下颌", pale, [0, .062, .25], [.04, .02, .055]), ...tail([0, .06, -.32], .095, true), membrane("前缘高后缘低的唯一三角背鳍", fin, [[0, .13, .015], [0, .245, -.012], [0, .16, -.11], [0, .11, -.14]]), ribbon("尾前短臀鳍", -.23, -.3, .035, -.03)];
  pectorals(parts, [0, .066, .15], .088, -.005); return parts;
}

// https://www.afma.gov.au/species/john-dory
function johnDory(): ModelPart[] {
  const parts: ModelPart[] = [body("海鲂高而薄的盘体与前突大颌", [[.23, .2, .008, .02], [.13, .22, .022, .06], [.025, .23, .045, .18], [-.14, .21, .031, .14], [-.22, .17, .009, .035]], skin), ...eyes([0, .28, .13], .019, .03), frontCup("强前伸颌末端的真实口腔", pale, [0, .195, .24], .028, .021), membrane("长棘之间较低的背鳍连接膜", fin, [[0, .33, .065], [0, .42, .025], [0, .43, -.04], [0, .37, -.13], [0, .25, -.2]]), ribbon("海鲂后半部柔背鳍", -.1, -.22, .29, .075), ribbon("长腹棘后的柔臀鳍", -.04, -.21, .085, -.052), ...tail([0, .17, -.225], .07, true)];
  for (let i = 0; i < 8; i++) parts.push(tapered("海鲂棘背鳍露出膜外的长丝状鳍条", pale, [[0, .345 - i * .006, .075 - i * .026], [0, .6 - Math.abs(i - 2) * .033, .06 - i * .03], [0, .61 - Math.abs(i - 2) * .035, .015 - i * .032]], [.004, .002, .0004]));
  for (const side of [-1, 1]) parts.push(tapered("腹部靠前的长而分离的腹鳍条", fin, [[side * .013, .085, .08], [side * .035, .006, -.06]], [.004, .0006]));
  pectorals(parts, [0, .18, .09], .07, .002); return parts;
}

// https://www.fishbase.se/Fieldguide/FieldGuideSummary.php?c_code=478&genusname=Capros&speciesname=aper
function boarfish(): ModelPart[] {
  const parts: ModelPart[] = [body("豕鱼极深侧扁的近圆盘躯", [[.09, .095, .003, .01], [.058, .1, .009, .028], [.006, .103, .023, .068], [-.06, .1, .014, .053], [-.087, .087, .005, .015]], skin), ...eyes([0, .124, .047], .012, .02), tapered("豕鱼可伸缩的短管状嘴", pale, [[0, .09, .067], [0, .089, .109]], [.009, .006]), frontCup("短管吻的开放小口", dark, [0, .089, .109], .006, .004), ribbon("圆盘后背连续柔鳍", -.012, -.085, .145, .045), ribbon("圆盘后腹连续柔臀鳍", -.012, -.085, .054, -.033), ...tail([0, .087, -.087], .033, true)];
  parts.push(membrane("豕鱼前部锯状高背棘鳍", fin, [[0, .143, .04], [0, .19, .03], [0, .18, .02], [0, .202, .008], [0, .184, -.008], [0, .194, -.02], [0, .151, -.04]]));
  pectorals(parts, [0, .084, .035], .034, .003); return parts;
}

// https://australian.museum/learn/animals/fishes/bluespine-unicornfish-naso-unicornis/
function bluespineUnicornfish(): ModelPart[] {
  const parts: ModelPart[] = [body("独角吊头部渐斜的厚椭圆侧体", [[.26, .19, .008, .017], [.16, .2, .045, .06], [.02, .21, .069, .14], [-.24, .19, .035, .09], [-.31, .17, .012, .03]], skin), ...eyes([0, .257, .14], .036, .022), tapered("眼前额骨向前上方延伸的实体短角", pale, [[0, .267, .16], [0, .29, .24], [0, .295, .285]], [.018, .01, .001]), ribbon("沿背侧连续的低背鳍", .09, -.29, .29, .064), ribbon("腹侧连续的低臀鳍", -.025, -.29, .105, -.058), membrane("独角吊近截形完整尾鳍", fin, [[0, .19, -.3], [0, .27, -.41], [0, .074, -.41], [0, .15, -.3]])];
  for (const side of [-1, 1]) { for (const z of [-.255, -.29]) parts.push(tapered("尾柄每侧两块刀形骨板棘", pale, [[side * .02, .17, z], [side * .043, .17, z - .018]], [.009, .001])); }
  for (const side of [-1, 1]) parts.push(tapered("尾叶上下缘延伸的细长尾丝", fin, [[0, .17 + side * .096, -.405], [0, .17 + side * .104, -.5]], [.003, .0004]));
  pectorals(parts, [0, .18, .1], .125, .01); return parts;
}

// https://biogeodb.stri.si.edu/sftep/en/thefishes/species/1223
function roosterfish(): ModelPart[] {
  const parts: ModelPart[] = [body("鸡冠鱼略侧扁的梭体与尖头", [[.44, .17, .012, .023], [.29, .185, .05, .064], [.02, .19, .08, .12], [-.35, .16, .043, .078], [-.51, .14, .012, .026]], skin), ...eyes([0, .228, .29], .039, .023), ...tail([0, .14, -.51], .18, true), ribbon("长鸡冠之后低长的第二背鳍", -.09, -.45, .265, .07), ribbon("短于第二背鳍的臀鳍", -.24, -.43, .095, -.065)];
  const rays: ModelPart[] = [];
  for (let i = 0; i < 7; i++) rays.push(tapered("第一背鳍向后流动的鸡冠形独立长棘", dark, [[0, .285, .2 - i * .038], [0, .67 - Math.abs(i - 2) * .045, .12 - i * .05], [0, .7 - Math.abs(i - 2) * .047, -.045 - i * .053]], [.006, .003, .0005]));
  parts.push(combineMeshes("鸡冠鱼完整而稀疏的长棘冠", dark, rays));
  for (const side of [-1, 1]) parts.push(membrane("长而弯曲的镰形胸鳍", fin, [[side * .05, .17, .18], [side * .26, .14, -.18], [side * .21, .125, -.17], [side * .045, .13, .12]])); return parts;
}

// https://www.nature.com/articles/s41598-020-74896-y
function barbuThreadfin(): ModelPart[] {
  const parts: ModelPart[] = [body("马鲅下位口和前高后细的纺锤形躯", [[.18, .083, .009, .014], [.09, .093, .032, .041], [-.02, .091, .042, .057], [-.18, .073, .018, .032], [-.235, .063, .005, .012]], skin), ...eyes([0, .113, .116], .02, .015), lobe("吻端下方短小下颌", pale, [0, .062, .16], [.028, .015, .04]), ...tail([0, .063, -.235], .071, true), membrane("马鲅前部三角形硬背鳍", fin, [[0, .132, .035], [0, .22, .017], [0, .138, -.062]]), ribbon("与首背鳍分离的柔条第二背鳍", -.11, -.207, .107, .046), ribbon("与第二背鳍相对的臀鳍", -.11, -.2, .043, -.04)];
  for (const side of [-1, 1]) {
    parts.push(membrane("游离须条上方的完整普通胸鳍", fin, [[side * .027, .077, .077], [side * .08, .067, -.039], [side * .035, .061, -.044]]));
    for (let i = 0; i < 7; i++) parts.push(tapered("胸鳍下部完全分离的感觉丝条", pale, [[side * .026, .062 - i * .0015, .074], [side * (.063 + i * .003), .022 - i * .002, -.01 - i * .012], [side * (.078 + i * .003), .012, -.065 - i * .017]], [.0012, .0007, .00025]));
  }
  return parts;
}

// https://fishesofaustralia.net.au/home/species/2208
function orbicularBatfish(): ModelPart[] {
  const parts: ModelPart[] = [body("圆燕鱼高而极度侧扁的短圆体", [[.17, .23, .007, .022], [.095, .24, .024, .085], [-.015, .24, .041, .17], [-.14, .23, .018, .12], [-.19, .21, .006, .03]], skin), ...eyes([0, .292, .096], .018, .021), membrane("从额后伸出并圆收的高背鳍", fin, [[0, .31, .095], [0, .48, .035], [0, .52, -.08], [0, .48, -.17], [0, .34, -.2], [0, .29, -.14]]), membrane("与背鳍对应的高圆臀鳍", fin, [[0, .13, .015], [0, -.02, -.04], [0, -.04, -.13], [0, .01, -.21], [0, .14, -.19]]), membrane("短尾柄后的圆扇尾", fin, [[0, .23, -.18], [0, .28, -.26], [0, .25, -.3], [0, .15, -.29], [0, .14, -.24], [0, .19, -.18]])];
  for (const side of [-1, 1]) parts.push(tapered("胸下方较短而真正独立的腹鳍", fin, [[side * .012, .12, .07], [side * .02, .015, .025]], [.008, .0007]));
  pectorals(parts, [0, .235, .067], .085, -.005); return parts;
}

// https://australian.museum/learn/animals/fishes/elephantfish-callorhinchus-milii-bory-de-saint-vincent-1823/
function elephantShark(): ModelPart[] {
  const parts: ModelPart[] = [body("象鼻银鲛肥厚头胸至细长尾柄", [[.29, .16, .035, .055], [.11, .16, .088, .102], [-.15, .13, .053, .067], [-.46, .095, .01, .023]], skin), ...eyes([0, .204, .225], .038, .024), tapered("吻端向下弯曲的柔软短鼻柄", pale, [[0, .155, .3], [0, .12, .35], [0, .085, .36]], [.016, .013, .01]), lobe("锄头形鼻柄末端的宽扁感觉叶", pale, [0, .085, .375], [.085, .017, .056]), ribbon("硬棘后方的第一背鳍", .08, -.04, .24, .13), tapered("第一背鳍前缘的强直背棘", pale, [[0, .24, .09], [0, .4, .06]], [.009, .0008]), ribbon("与第一背鳍间隔的低长第二背鳍", -.14, -.4, .17, .045), membrane("尾鳍特别延长的上叶", fin, [[0, .115, -.43], [0, .2, -.57], [0, .18, -.71], [0, .098, -.63], [0, .08, -.44]]), membrane("比上叶短的尾鳍下叶", fin, [[0, .085, -.43], [0, .024, -.55], [0, .034, -.61], [0, .08, -.56]])];
  for (const side of [-1, 1]) parts.push(membrane("象鼻银鲛宽大圆三角胸鳍", fin, [[side * .055, .12, .12], [side * .31, .06, -.09], [side * .26, .035, -.17], [side * .05, .082, -.07]]), membrane("尾根前方成对独立腹鳍", fin, [[side * .035, .08, -.13], [side * .12, .044, -.24], [side * .045, .054, -.28]]));
  return parts;
}

export const aquaticExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("hogfish", "猪齿鱼", "动物", hogfish, ["Lachnolaimus maximus", "前突猪吻与前三枚延长背棘"]),
  design("flyingGurnard", "飞鲂鮄", "动物", flyingGurnard, ["Dactylopterus volitans", "骨盔后角与前后分区的大扇翼胸鳍"]),
  design("ornateGhostPipefish", "华丽幽灵海龙", "动物", ornateGhostPipefish, ["Solenostomus paradoxus", "短宽骨板腹体宽尾扇与分枝皮瓣"]),
  design("ribbonMoray", "管鼻海鳝", "动物", ribbonMoray, ["Rhinomuraena quaesita", "极长带状体与叶片状扩展前鼻孔"]),
  design("fourEyedFish", "四眼鱼", "动物", fourEyedFish, ["Anableps anableps", "两只突出眼球各有上下分隔视觉区"]),
  design("freshwaterHatchetfish", "胸斧鱼", "动物", freshwaterHatchetfish, ["Gasteropelecus sternicla", "淡水胸腹深龙骨与高位翼状胸鳍"]),
  design("amazonLeaffish", "叶鱼", "动物", amazonLeaffish, ["Monocirrhus polyacanthus", "叶形侧体与唯一叶柄状颏须"]),
  design("africanKnifefish", "大裸背鱼", "动物", africanKnifefish, ["Gymnarchus niloticus", "长柔背鳍和无臀鳍尾鳍腹鳍的尖尾"]),
  design("atlanticTripletail", "三尾鲈", "动物", atlanticTripletail, ["Lobotes surinamensis", "背鳍臀鳍尾鳍构成三个圆尾叶"]),
  design("cobia", "军曹鱼", "动物", cobia, ["Rachycentron canadum", "宽扁额头分离前背硬棘与长柔背鳍"]),
  design("milkfish", "虱目鱼", "动物", milkfish, ["Chanos chanos", "小型终端嘴脂性眼睑与深叉尾"]),
  design("atlanticTarpon", "大海鲢", "动物", atlanticTarpon, ["Megalops atlanticus", "上位巨口粗大圆鳞与背鳍末端长丝"]),
  design("bonefish", "北梭鱼", "动物", bonefish, ["Albula vulpes", "长圆锥鼻覆盖短下颌的下位口"]),
  design("johnDory", "海鲂", "动物", johnDory, ["Zeus faber", "高盘体前突颌与背鳍露膜长棘"]),
  design("boarfish", "豕鱼", "动物", boarfish, ["Capros aper", "深圆盘体与短可伸缩管嘴"]),
  design("bluespineUnicornfish", "独角吊", "动物", bluespineUnicornfish, ["Naso unicornis", "额前实体角尾柄双刀板与尾丝"]),
  design("roosterfish", "鸡冠鱼", "动物", roosterfish, ["Nematistius pectoralis", "稀疏长棘鸡冠与长弯胸鳍"]),
  design("barbuThreadfin", "马鲅（Polydactylus virginicus）", "动物", barbuThreadfin, ["Polydactylus virginicus", "普通胸鳍下方七条游离感觉丝"]),
  design("orbicularBatfish", "圆燕鱼", "动物", orbicularBatfish, ["Platax orbicularis", "短圆侧体与对应的高圆背臀鳍"]),
  design("elephantShark", "象鼻银鲛", "动物", elephantShark, ["Callorhinchus milii", "锄头形吻叶强背棘与延长上尾叶"]),
];
