import { combineMeshes, design, eyes, frontCup, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body, pectorals, ribbon } from "./fishForms";
import { membrane } from "./animals";
import { tail } from "./marine";

const skin = "#9eac98";
const fin = "#bec7ab";
const armor = "#b3bca0";
const ivory = "#d8d0b3";
const dark = "#778972";

// https://d3qi0qp55mx5f5.cloudfront.net/paulsereno/i/docs/01-SCI-Sarcosuchus.pdf
function sarcosuchus(): ModelPart[] {
  const parts: ModelPart[] = [body("帝鳄宽厚胸腹与骨盆", [[1.7, .78, .31, .34], [.5, .72, .57, .52], [-1.4, .57, .44, .38], [-2.15, .43, .2, .24]], skin), body("帝鳄长颅后部向前延伸的窄上吻", [[3.94, .73, .14, .11], [3.64, .76, .18, .12], [2.3, .79, .22, .15], [1.58, .83, .39, .26]], skin), lobe("帝鳄吻端真实膨大的骨质鼻球", armor, [0, .77, 3.89], [.5, .43, .56]), tapered("与长上颌分离的窄长下颌", skin, [[0, .51, 1.76], [0, .5, 3.7], [0, .56, 4.02]], [.24, .13, .08]), ...eyes([0, 1.015, 1.93], .278, .084), tapered("帝鳄粗尾根至长侧扁尾端", skin, [[0, .49, -1.91], [.1, .3, -3.15], [.38, .13, -5]], [.26, .15, .009])];
  const teeth: ModelPart[] = [], scutes: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(lobe("鼻球上方凸起的外鼻孔缘", dark, [side * .078, .93, 3.97], [.067, .04, .12]));
    for (const rear of [false, true]) { const z = rear ? -1.23 : 1.2, end: Triple = [side * .99, .085, z + .18]; parts.push(tapered("帝鳄侧展且有肘膝转折的承重肢", skin, [[side * .35, .57, z], [side * .93, .31, z - .2], end], [.18, .14, .08])); for (let i = 0; i < (rear ? 4 : 5); i++) parts.push(tapered("帝鳄分开的前五后四足趾", skin, [end, [end[0] + (i - (rear ? 1.5 : 2)) * .075, .048, end[2] + .29 - Math.abs(i - 2) * .022]], [.032, .006])); }
    for (let i = 0; i < 14; i++) { const z = 2 + i * .13, x = side * (.2 - (z - 2) * .025); teeth.push(tapered("帝鳄上下颌相互错开的圆锥牙", ivory, [[x, .68, z], [x, .5, z + .025]], [.033, .001]), tapered("帝鳄下颌向上合入齿隙的牙", ivory, [[x, .55, z + .066], [x, .68, z + .083]], [.024, .001])); }
  }
  for (let row = 0; row < 4; row++) for (let i = 0; i < 10; i++) { const z = 1.38 - i * .36, x = (row - 1.5) * .24; scutes.push(lobe("帝鳄背面叠覆的隆起厚骨甲", armor, [x, 1.13 - Math.abs(x) * .24 - i * .033, z], [.29, .13, .38])); }
  for (const side of [-1, 1]) for (let i = 0; i < 10; i++) scutes.push(tapered("帝鳄后尾渐合拢的成对背棱", armor, [[side * (.18 - i * .012), .61 - i * .036, -2.12 - i * .24], [side * (.18 - i * .012), .78 - i * .047, -2.17 - i * .24]], [.06 - i * .003, .002]));
  for (let i = 0; i < teeth.length; i += 16) parts.push(combineMeshes("帝鳄交错而不连成实墙的牙列", ivory, teeth.slice(i, i + 16)));
  for (let i = 0; i < scutes.length; i += 16) parts.push(combineMeshes("帝鳄背甲及尾背棱", armor, scutes.slice(i, i + 16))); return parts;
}

// https://doi.org/10.1080/03115518.2019.1566495
function mourasuchus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("莫拉氏鳄宽而低伏的胸腹", skin, [0, .38, -.25], [1.07, .58, 1.95]), tapered("莫拉氏鳄低矮颈与宽颅后部", skin, [[0, .42, .45], [0, .43, .96]], [.27, .31]), polygon("莫拉氏鳄横向展开的扁宽鸭嘴上颌", skin, [[-.23, .71], [-.52, .94], [-.63, 1.45], [-.55, 1.9], [-.34, 2.1], [.34, 2.1], [.55, 1.9], [.63, 1.45], [.52, .94], [.23, .71]], .11, [0, .38, 0]), polygon("鸭嘴之下较薄且独立的宽下颌", armor, [[-.23, .76], [-.49, .97], [-.59, 1.47], [-.51, 1.9], [-.3, 2.06], [.3, 2.06], [.51, 1.9], [.59, 1.47], [.49, .97], [.23, .76]], .055, [0, .25, 0]), ...eyes([0, .585, .96], .275, .051), tapered("莫拉氏鳄宽尾根后收成长尾", skin, [[0, .35, -1.03], [.08, .2, -1.9], [.28, .075, -3.11]], [.23, .12, .004])];
  const teeth: ModelPart[] = [], scutes: ModelPart[] = [];
  for (const side of [-1, 1]) {
    for (const rear of [false, true]) { const z = rear ? -.86 : .53, end: Triple = [side * .81, .06, z + .12]; parts.push(tapered("莫拉氏鳄低伏的外展四肢", skin, [[side * .3, .33, z], [side * .71, .19, z - .1], end], [.096, .069, .041])); for (let i = 0; i < (rear ? 4 : 5); i++) parts.push(tapered("莫拉氏鳄分离的短足趾", skin, [end, [end[0] + (i - 2) * .042, .031, z + .31]], [.014, .003])); }
    for (let i = 0; i < 21; i++) { const t = i / 20, z = .91 + t * 1.1, x = side * (.48 + Math.sin(t * Math.PI) * .125 - t * .11); teeth.push(tapered("宽扁鸭嘴颌边密集但纤细的牙", ivory, [[x, .385, z], [x, .315, z]], [.007, .0006])); }
    for (let i = 0; i < 6; i++) scutes.push(lobe("莫拉氏鳄低背短骨甲", armor, [side * .23, .61 - i * .021, .45 - i * .25], [.27, .065, .29]));
  }
  for (let i = 0; i < teeth.length; i += 16) parts.push(combineMeshes("莫拉氏鳄鸭嘴边缘独立细齿", ivory, teeth.slice(i, i + 16)));
  parts.push(combineMeshes("莫拉氏鳄躯背的低骨甲", armor, scutes)); return parts;
}

// https://doi.org/10.1111/j.1475-4983.2009.00904.x
function dakosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("达寇龙不具鳄背骨甲的光滑粗躯", [[.65, .59, .21, .23], [.03, .53, .34, .36], [-1.05, .38, .2, .24], [-1.6, .26, .072, .11]], skin), body("达寇龙短而高深的子弹形上颅", [[1.36, .69, .086, .17], [1.12, .76, .24, .32], [.65, .71, .25, .27]], skin), tapered("达寇龙深厚而短的独立下颌", armor, [[0, .39, .66], [0, .36, 1.36]], [.18, .071]), ...eyes([0, .87, .88], .218, .058), tapered("达寇龙尾根到下弯的尾轴", skin, [[0, .26, -1.49], [0, .2, -1.95], [0, .06, -2.29]], [.086, .062, .012]), membrane("达寇龙较高的上尾叶", fin, [[0, .24, -1.88], [0, .84, -2.3], [0, .93, -2.53], [0, .42, -2.26], [0, .14, -2.12]]), membrane("达寇龙下弯轴末端的下尾叶", fin, [[0, .16, -1.94], [0, -.16, -2.32], [0, -.27, -2.48], [0, .05, -2.19]])];
  for (const side of [-1, 1]) {
    parts.push(membrane("达寇龙前部较大的短宽鳍肢", fin, [[side * .21, .42, .39], [side * .77, .16, .13], [side * .69, .11, -.22], [side * .27, .31, -.01]]), membrane("达寇龙尾根前方的短后鳍肢", fin, [[side * .17, .28, -.96], [side * .53, .08, -1.11], [side * .44, .065, -1.35], [side * .14, .22, -1.18]]));
    for (const upper of [false, true]) for (let i = 0; i < 5; i++) parts.push(part("达寇龙侧扁而有锯齿轮廓的粗大切割牙", "extrude", ivory, [side * (.15 - i * .014), upper ? .59 : .4, .78 + i * .115], [1, 1, 1], [0, 90, upper ? 180 : 0], { depth: .021, profile: [{ x: -.036, y: 0 }, { x: -.029, y: .035 }, { x: -.024, y: .029 }, { x: -.021, y: .064 }, { x: -.014, y: .057 }, { x: 0, y: .12 }, { x: .014, y: .057 }, { x: .021, y: .064 }, { x: .024, y: .029 }, { x: .029, y: .035 }, { x: .036, y: 0 }] }));
  }
  return parts;
}

// https://doi.org/10.1080/02724634.1999.10011121
function shonisaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("秀尼鱼龙长而非海豚短躯的巨大胸腹", [[3.1, 1.43, .29, .36], [1.7, 1.35, .83, 1.12], [-1.9, 1.1, .77, 1], [-3.5, .88, .32, .47], [-4.6, .67, .17, .23]], skin), tapered("巨大胸体前细长的低颈", skin, [[0, 1.4, 2.75], [0, 1.48, 3.69]], [.29, .22]), lobe("秀尼鱼龙长颅后部", skin, [0, 1.49, 3.92], [.69, .62, 1.18]), tapered("秀尼鱼龙特别长而窄的上吻", skin, [[0, 1.55, 4.16], [0, 1.51, 5.6], [0, 1.46, 6.54]], [.16, .09, .01]), tapered("长吻下方深度相近的下颌", armor, [[0, 1.22, 4.07], [0, 1.22, 5.64], [0, 1.31, 6.55]], [.15, .073, .009]), ...eyes([0, 1.64, 4.01], .27, .13), tapered("秀尼鱼龙尾部较小弯折的长尾轴", skin, [[0, .7, -4.32], [0, .5, -5.66], [0, .34, -7.26]], [.18, .11, .007]), membrane("秀尼鱼龙尾末端保守复原的低尾缘", fin, [[0, .53, -5.54], [0, .87, -6.72], [0, .55, -7.47], [0, .33, -7.25], [0, .17, -6.64], [0, .38, -5.53]])];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -2.39 : 2.07; parts.push(membrane("秀尼鱼龙前后近等长且窄的长桨肢", fin, [[side * .55, .8, z], [side * 1.13, .52, z - .45], [side * (rear ? 2.23 : 2.49), .17, z - 1.98], [side * (rear ? 2.08 : 2.31), .11, z - 2.2], [side * .78, .45, z - .78]])); }
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) parts.push(tapered("秀尼鱼龙长吻前段稀疏的短牙", ivory, [[side * .052, 1.44, 5.7 + i * .15], [side * .052, 1.34, 5.72 + i * .15]], [.019, .001]));
  // ACT: 背鳍没有软组织标本支持，不添加高大海豚式背鳍；长鳍肢、长吻及弱尾弯按骨架复原。
  return parts;
}

// https://doi.org/10.1038/srep26232
function sclerocormus(): ModelPart[] {
  const parts: ModelPart[] = [body("小头刚体龙宽厚而僵硬的桶形胸腹", [[.27, .22, .07, .11], [.05, .2, .16, .19], [-.32, .15, .11, .12], [-.43, .13, .055, .06]], skin), tapered("粗躯前方极短而窄的颈", skin, [[0, .24, .23], [0, .27, .34]], [.049, .03]), lobe("相对躯体极小的刚体龙头颅", skin, [0, .277, .367], [.071, .069, .106]), tapered("小头前方短细且无牙的吻", armor, [[0, .268, .4], [0, .26, .447]], [.019, .006]), ...eyes([0, .296, .377], .027, .009), tapered("小头刚体龙没有尾叶的极长鞭尾", skin, [[0, .13, -.38], [.018, .1, -.67], [.05, .065, -.99], [.095, .035, -1.22]], [.054, .033, .014, .001])];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -.3 : .14; parts.push(tapered("刚体龙身体两侧短粗的鳍肢根", skin, [[side * .095, .16, z], [side * .21, .075, z - .035]], [.039, .025]), membrane("刚体龙有界限的短宽桨足", fin, [[side * .21, .075, z - .035], [side * .31, .035, z - .1], [side * .3, .022, z - .22], [side * .17, .045, z - .16]])); }
  return parts;
}

// https://faunafri.africamuseum.be/drupal_faunafri/alestidae/hydrocyini/hydrocynus
function goliathTigerfish(): ModelPart[] {
  const parts: ModelPart[] = [body("巨狗脂鲤背前段高厚而尾柄收细的游猎躯体", [[.37, .24, .052, .079], [.15, .26, .115, .19], [-.28, .22, .095, .16], [-.56, .16, .025, .046]], skin), tapered("巨狗脂鲤直而较深的上颌", skin, [[0, .3, .26], [0, .28, .59]], [.074, .037]), tapered("巨狗脂鲤独立而向前伸的下颌", armor, [[0, .15, .27], [0, .165, .61]], [.065, .03]), ...eyes([0, .325, .326], .073, .032), membrane("巨狗脂鲤位于腹鳍上方的独立背鳍", fin, [[0, .42, .09], [0, .64, .015], [0, .46, -.13], [0, .36, -.15]]), membrane("尾前与第一背分离的小脂鳍", fin, [[0, .25, -.39], [0, .315, -.43], [0, .28, -.49], [0, .21, -.51]]), membrane("巨狗脂鲤深叉尾上叶", fin, [[0, .2, -.53], [0, .43, -.73], [0, .425, -.9], [0, .18, -.7], [0, .16, -.58]]), membrane("巨狗脂鲤深叉尾下叶", fin, [[0, .13, -.55], [0, -.08, -.73], [0, -.09, -.9], [0, .15, -.69]]), ribbon("巨狗脂鲤腹后较短的臀鳍", -.29, -.48, .08, -.055)];
  pectorals(parts, [0, .19, .23], .24, -.008);
  for (const side of [-1, 1]) {
    parts.push(membrane("巨狗脂鲤成对的短腹鳍", fin, [[side * .055, .1, .025], [side * .15, .035, -.1], [side * .055, .08, -.18]]));
    for (const upper of [false, true]) for (let i = 0; i < (upper ? 7 : 5); i++) { const t = i / (upper ? 6 : 4), z = .34 + t * .23, x = side * (.064 - t * .024); parts.push(tapered("巨狗脂鲤单行且长而锋利的犬牙", ivory, [[x, upper ? .265 : .187, z], [x, upper ? .185 : .26, z + .006]], [.009, .0003])); }
  }
  return parts;
}

// https://australian.museum/learn/animals/fishes/australian-lungfish-neoceratodus-forsteri-krefft-1870/
function australianLungfish(): ModelPart[] {
  const parts: ModelPart[] = [body("澳洲肺鱼粗厚而覆盖大圆鳞的躯体", [[.49, .2, .064, .07], [.28, .2, .123, .12], [-.19, .18, .107, .13], [-.56, .12, .054, .07], [-.79, .09, .005, .013]], skin), lobe("澳洲肺鱼扁宽而小眼的短头", skin, [0, .198, .41], [.26, .16, .28]), tapered("头前略下位的短宽口唇", armor, [[-.056, .145, .49], [0, .14, .55], [.056, .145, .49]], [.016, .016, .016]), ...eyes([0, .25, .437], .095, .017), membrane("澳洲肺鱼中背起始并绕尾连到臀部的整片鳍缘", fin, [[0, .295, .06], [0, .39, -.15], [0, .315, -.49], [0, .19, -.75], [0, .09, -.9], [0, .01, -.72], [0, -.025, -.43], [0, .015, -.16], [0, .09, -.14], [0, .07, -.6], [0, .09, -.79], [0, .19, -.5], [0, .255, -.16]])];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -.42 : .27; parts.push(tapered("澳洲肺鱼成对鳍中央真实肥厚的肉质鳍叶", skin, [[side * .08, .14, z], [side * .22, .085, z - .07], [side * .29, .055, z - .17]], [.029, .026, .003]), membrane("肉鳍两侧展开而非丝状的桨形鳍片", fin, [[side * .105, .14, z], [side * .24, .1, z + .005], [side * .315, .055, z - .16], [side * .25, .045, z - .22], [side * .13, .085, z - .13]])); }
  const scales: ModelPart[] = [];
  for (const side of [-1, 1]) for (let row = 0; row < 3; row++) for (let i = 0; i < 10; i++) { const z = .27 - i * .078, waist = 1 - Math.max(0, -z) * .73; scales.push(lobe("澳洲肺鱼重叠的大型圆鳞", armor, [side * (.105 - Math.abs(row - 1) * .016) * waist, .116 + row * .062, z + row % 2 * .03], [.015, .075, .11])); }
  for (let i = 0; i < scales.length; i += 28) parts.push(combineMeshes("澳洲肺鱼体侧真实起伏的大圆鳞片", armor, scales.slice(i, i + 28))); return parts;
}

// https://saiab.ac.za/wp-content/uploads/2022/11/1._wiof_volume_2_text.pdf
// https://doi.org/10.1643/CI-19-211
function giantMoray(): ModelPart[] {
  const path: Triple[] = [[0, .29, .71], [0, .27, .26], [.05, .2, -.34], [.17, .15, -.92], [.09, .09, -1.48], [-.2, .05, -1.8]], radii = [.105, .12, .095, .067, .035, .002];
  const parts: ModelPart[] = [tapered("巨海鳝无胸腹鳍的粗壮长躯", skin, path, radii), frontCup("巨海鳝有实际深腔和唇壁的前端大口", skin, [0, .29, .68], .13, .29), ...eyes([0, .355, .781], .099, .028)];
  for (let i = 0; i < path.length - 1; i++) { const a = path[i]!, b = path[i + 1]!, ra = radii[i]!, rb = radii[i + 1]!; parts.push(membrane("巨海鳝沿背部延至尾尖的低鳍褶", fin, [[a[0], a[1] + ra * .9, a[2]], [a[0], a[1] + ra + .05 * (1 - i / 6), a[2]], [b[0], b[1] + rb + .05 * (1 - (i + 1) / 6), b[2]], [b[0], b[1] + rb * .9, b[2]]])); if (i > 1) parts.push(membrane("巨海鳝后半段连到尾端的臀鳍褶", fin, [[a[0], a[1] - ra * .8, a[2]], [b[0], b[1] - rb * .8, b[2]], [b[0], b[1] - rb - .025, b[2]], [a[0], a[1] - ra - .025, a[2]]])); }
  for (const side of [-1, 1]) {
    parts.push(tapered("巨海鳝前鼻孔的短管", armor, [[side * .07, .35, .89], [side * .078, .37, .94]], [.009, .006]), tapered("巨海鳝侧面只有短小的鳃孔缘", dark, [[side * .105, .28, .65], [side * .113, .23, .645]], [.005, .005]));
    for (let i = 0; i < 7; i++) { const a = i / 6 * Math.PI; parts.push(tapered("巨海鳝口腔边缘向后弯的单列大牙", ivory, [[side * Math.sin(a) * .112, .29 + Math.cos(a) * .108, .927], [side * Math.sin(a) * .087, .29 + Math.cos(a) * .072, .89]], [.009, .0004])); }
    parts.push(tapered("口腔深处独立于口颌的细长上咽颌", armor, [[side * .043, .325, .725], [side * .032, .323, .815]], [.012, .008]), tapered("口腔深处与上咽颌相对的下咽颌", armor, [[side * .04, .24, .725], [side * .028, .245, .815]], [.013, .008]));
    for (let i = 0; i < 3; i++) parts.push(tapered("第二组咽颌上向后钩曲的独立牙", ivory, [[side * .035, .318, .75 + i * .022], [side * .029, .281, .742 + i * .022]], [.005, .0004]), tapered("第二组咽颌下方向上相对的独立牙", ivory, [[side * .032, .248, .75 + i * .022], [side * .028, .279, .742 + i * .022]], [.005, .0004]));
  }
  return parts;
}

// https://chm-thai.onep.go.th/wp-content/uploads/2021/10/ONEP_V16.pdf
function mekongGiantCatfish(): ModelPart[] {
  const parts: ModelPart[] = [body("湄公河巨鲶高厚而光滑无鳞的躯体", [[.8, .43, .12, .1], [.35, .44, .32, .38], [-.42, .37, .25, .29], [-.98, .24, .04, .075]], skin), lobe("湄公河巨鲶短宽而隆起的头", skin, [0, .42, .69], [.58, .47, .53]), tapered("巨鲶宽钝而不具长须的上唇", armor, [[-.13, .4, .84], [0, .4, .97], [.13, .4, .84]], [.029, .029, .029]), tapered("巨鲶比上颌略前突的无齿下唇", skin, [[-.13, .337, .84], [0, .34, 1], [.13, .337, .84]], [.033, .033, .033]), ...eyes([0, .353, .77], .22, .024), membrane("巨鲶靠前的短基底高三角背鳍", fin, [[0, .72, .32], [0, 1.01, .21], [0, .7, -.03]]), membrane("巨鲶后背与主背分开的低脂鳍", fin, [[0, .43, -.56], [0, .52, -.68], [0, .4, -.84]]), membrane("巨鲶基底较长但不与尾相连的臀鳍", fin, [[0, .16, -.14], [0, -.025, -.26], [0, -.01, -.73], [0, .15, -.88]]), ...tail([0, .24, -1.01], .36, true)];
  pectorals(parts, [0, .28, .47], .49, -.04);
  for (const side of [-1, 1]) parts.push(membrane("巨鲶腹部不带丝状延伸的独立腹鳍", fin, [[side * .16, .14, -.17], [side * .36, .025, -.33], [side * .2, .04, -.52]]));
  return parts;
}

// https://en.bdfish.org/2011/01/boal-wallago-attu/ （作者为孟加拉国渔业研究人员）
function wallago(): ModelPart[] {
  const parts: ModelPart[] = [body("大口鲶头后强烈侧扁的延长躯体", [[.28, .28, .11, .14], [-.06, .27, .14, .22], [-.62, .2, .08, .16], [-1.03, .135, .019, .045]], skin), body("大口鲶扁宽头顶和延至眼后的口角", [[.75, .34, .055, .037], [.53, .37, .13, .07], [.16, .35, .16, .1]], skin), tapered("大口鲶与颅顶分开而开裂很深的下颌", armor, [[0, .175, .18], [0, .17, .53], [0, .2, .76]], [.12, .1, .04]), ...eyes([0, .42, .43], .113, .025), membrane("大口鲶仅五软条的小型第一背鳍", fin, [[0, .43, .075], [0, .66, .005], [0, .42, -.075]]), membrane("大口鲶沿后腹伸近尾根的极长臀鳍", fin, [[0, .11, .01], [0, -.045, -.16], [0, -.055, -.67], [0, .045, -1], [0, .11, -.96], [0, .09, -.56], [0, .19, -.05]]), ...tail([0, .14, -1.04], .29, true)];
  pectorals(parts, [0, .2, .17], .36, -.015);
  for (const side of [-1, 1]) {
    parts.push(tapered("大口鲶口角延至臀鳍上方的特别长上颌须", ivory, [[side * .14, .28, .25], [side * .3, .27, .08], [side * .42, .21, -.27], [side * .43, .16, -.6]], [.009, .007, .004, .0005]), tapered("大口鲶下颏明显较短的第二对须", ivory, [[side * .055, .18, .53], [side * .16, .09, .48], [side * .25, .075, .29]], [.005, .003, .0005]), membrane("大口鲶臀鳍起点之前的短腹鳍", fin, [[side * .068, .1, .02], [side * .19, .025, -.07], [side * .06, .055, -.19]]));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (const upper of [false, true]) for (let i = 0; i < 12; i++) { const t = i / 11, x = side * (.126 - t * .081), z = .3 + t * .39; teeth.push(tapered("大口鲶深口裂内宽带状的细锥牙", ivory, [[x, upper ? .305 : .21, z], [x, upper ? .25 : .26, z + .002]], [.004, .0003])); }
  for (let i = 0; i < teeth.length; i += 16) parts.push(combineMeshes("大口鲶深口角内上下相对的细牙带", ivory, teeth.slice(i, i + 16))); return parts;
}

export const aquaticExpansionBatchSevenDesigns: MasterNatureDesign[] = [
  design("sarcosuchus", "帝鳄", "动物", sarcosuchus, ["Sarcosuchus imperator", "形态复原", "长窄吻端骨球与叠覆厚背甲"]),
  design("mourasuchus", "莫拉氏鳄", "动物", mourasuchus, ["Mourasuchus", "形态复原", "极宽扁鸭嘴和细小边齿"]),
  design("dakosaurus", "达寇龙", "动物", dakosaurus, ["Dakosaurus andiniensis", "形态复原", "短高深颅与侧扁锯缘切割牙"]),
  design("shonisaurus", "秀尼鱼龙", "动物", shonisaurus, ["Shonisaurus popularis", "形态复原", "长躯细长桨肢与弱尾弯"]),
  design("sclerocormus", "小头刚体龙", "动物", sclerocormus, ["Sclerocormus parviceps", "形态复原", "极小无齿头与不具尾叶的长鞭尾"]),
  design("goliathTigerfish", "巨狗脂鲤", "动物", goliathTigerfish, ["Hydrocynus goliath", "独立单行长犬牙与深叉尾"]),
  design("australianLungfish", "澳洲肺鱼", "动物", australianLungfish, ["Neoceratodus forsteri", "四枚桨状肉鳍与重叠大圆鳞"]),
  design("giantMoray", "巨海鳝", "动物", giantMoray, ["Gymnothorax javanicus", "口腔深处的第二组钩齿咽颌"]),
  design("mekongGiantCatfish", "湄公河巨鲶", "动物", mekongGiantCatfish, ["Pangasianodon gigas", "宽头成体无齿近无须与低位小眼"]),
  design("wallago", "大口鲶", "动物", wallago, ["Wallago attu", "极长臀鳍深口裂与特别长的上颌须"]),
];
