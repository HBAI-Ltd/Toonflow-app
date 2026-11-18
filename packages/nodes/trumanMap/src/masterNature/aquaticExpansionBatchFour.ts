import { combineMeshes, design, eyes, frontCup, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";
import { body, pectorals, ribbon } from "./fishForms";
import { tail } from "./marine";

const skin = "#9eaf9e";
const fin = "#b8c5ac";
const pale = "#d1cfb5";
const dark = "#778d78";

// https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/dolphinfish/
function mahiMahi(): ModelPart[] {
  const parts: ModelPart[] = [body("鲯鳅雄体近乎垂直的前额与后部急收细长体", [[.68, .3, .026, .13], [.53, .3, .065, .18], [.15, .25, .089, .18], [-.39, .19, .052, .11], [-.69, .14, .011, .026]], skin), ...eyes([0, .32, .56], .044, .027), tapered("陡额下方前伸的薄下颌", pale, [[0, .155, .48], [0, .17, .72]], [.045, .023]), membrane("从眼后一直延至尾柄的唯一高长背鳍", fin, [[0, .42, .57], [0, .65, .54], [0, .61, .25], [0, .48, -.16], [0, .32, -.53], [0, .18, -.68], [0, .25, -.42], [0, .4, .1]]), membrane("后缘明显内凹的长臀鳍", fin, [[0, .1, .04], [0, .022, -.05], [0, .035, -.36], [0, .1, -.66], [0, .14, -.61]]), ...tail([0, .14, -.7], .21, true)];
  for (const side of [-1, 1]) parts.push(membrane("鲯鳅狭长而向后贴体的胸鳍", fin, [[side * .061, .2, .37], [side * .2, .14, .1], [side * .13, .135, .08], [side * .055, .17, .25]])); return parts;
}

// https://fishesofaustralia.net.au/home/species/2962
function humpheadWrasse(): ModelPart[] {
  const parts: ModelPart[] = [body("曲纹唇鱼高而宽厚的椭圆体", [[.65, .37, .085, .1], [.39, .44, .18, .23], [-.08, .4, .23, .32], [-.6, .3, .13, .19], [-.84, .24, .032, .061]], skin), lobe("眼前明显隆起的球状额瘤", skin, [0, .64, .43], [.31, .47, .47]), ...eyes([0, .51, .49], .132, .042), frontCup("曲纹唇鱼厚唇包围的真实口腔", pale, [0, .325, .65], .075, .095), ribbon("从额瘤后连续到尾前的背鳍", .24, -.76, .59, .13), ribbon("后腹部较短的圆臀鳍", -.21, -.73, .15, -.087), membrane("曲纹唇鱼宽而圆收的完整尾扇", fin, [[0, .28, -.82], [0, .4, -1.02], [0, .36, -1.16], [0, .16, -1.16], [0, .105, -1.04], [0, .21, -.82]])];
  pectorals(parts, [0, .31, .23], .34, .006); return parts;
}

// https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/goliath-grouper/
function goliathGrouper(): ModelPart[] {
  const parts: ModelPart[] = [body("巨石斑鱼圆钝大头与深厚长躯", [[.91, .43, .16, .14], [.6, .47, .29, .32], [.02, .43, .35, .38], [-.66, .31, .19, .23], [-.95, .23, .047, .084]], skin), tapered("巨石斑鱼前凸的粗下颌", pale, [[0, .28, .55], [0, .25, .99]], [.18, .14]), frontCup("宽阔颌前真正开放的巨大口腔", dark, [0, .36, .915], .115, .12), ...eyes([0, .58, .64], .219, .043), membrane("前方短棘后方高软条相连的单一背鳍", fin, [[0, .71, .39], [0, .88, .3], [0, .82, .19], [0, .85, .06], [0, .72, -.12], [0, .7, -.31], [0, .78, -.48], [0, .55, -.8], [0, .43, -.87]]), ribbon("尾前短而圆的臀鳍", -.43, -.86, .13, -.1), membrane("巨石斑鱼短宽且圆弧收边的尾鳍", fin, [[0, .28, -.93], [0, .42, -1.15], [0, .37, -1.29], [0, .22, -1.34], [0, .065, -1.25], [0, .05, -1.13], [0, .18, -.93]])];
  pectorals(parts, [0, .35, .38], .4, -.02); return parts;
}

// https://fishesofaustralia.net.au/home/species/4268
function giantTrevally(): ModelPart[] {
  const parts: ModelPart[] = [body("浪人鲹陡额深胸并向尾柄强烈收细的侧体", [[.54, .25, .014, .04], [.38, .32, .061, .13], [.12, .31, .11, .22], [-.29, .2, .058, .12], [-.52, .15, .011, .025]], skin), ...eyes([0, .37, .35], .043, .028), membrane("短而锯状的首背硬棘鳍", fin, [[0, .49, .14], [0, .64, .095], [0, .565, .045], [0, .6, -.01], [0, .45, -.08]]), membrane("前高后低的独立第二背鳍", fin, [[0, .41, -.06], [0, .61, -.15], [0, .35, -.39], [0, .2, -.5]]), membrane("与第二背鳍相对的低位镰形臀鳍", fin, [[0, .14, -.1], [0, -.025, -.2], [0, .065, -.43], [0, .13, -.5]]), ...tail([0, .15, -.53], .19, true)];
  for (const side of [-1, 1]) {
    parts.push(membrane("浪人鲹特别细长而明显向后弯的胸鳍", fin, [[side * .073, .25, .25], [side * .26, .22, -.03], [side * .34, .17, -.38], [side * .26, .17, -.29], [side * .08, .2, .12]]));
    const scutes: ModelPart[] = []; for (let i = 0; i < 12; i++) scutes.push(tapered("尾柄侧线上连续而突起的硬盾板", pale, [[side * (.048 - i * .0024), .17, -.23 - i * .022], [side * (.064 - i * .0028), .17, -.241 - i * .022]], [.009, .001])); parts.push(combineMeshes("浪人鲹直线侧线段的完整骨盾列", pale, scutes));
  }
  return parts;
}

// https://repository.si.edu/bitstreams/e2b6155b-afd6-43e3-81be-982163fed29d/download
function wahoo(): ModelPart[] {
  const parts: ModelPart[] = [body("棘鳞蛇鲭长锥吻与细长高速梭体", [[.82, .18, .013, .022], [.48, .2, .047, .065], [.05, .2, .07, .12], [-.62, .16, .035, .07], [-.85, .13, .008, .019]], skin), tapered("长吻下方与上颌近平行的下颌", pale, [[0, .14, .49], [0, .135, .84]], [.031, .01]), ...eyes([0, .23, .49], .031, .022), ribbon("蛇鲭低而长的首背鳍", .3, -.43, .29, .078), membrane("低长首背之后分离的高第二背鳍", fin, [[0, .2, -.49], [0, .34, -.57], [0, .18, -.68]]), membrane("与第二背鳍相对的三角臀鳍", fin, [[0, .11, -.51], [0, -.01, -.59], [0, .1, -.69]]), ...tail([0, .13, -.86], .17, true)];
  for (const upper of [false, true]) for (let i = 0; i < 7; i++) { const z = -.66 - i * .025, y = upper ? .165 : .096; parts.push(membrane("背臀鳍之后真正分离的小离鳍", fin, [[0, y, z], [0, y + (upper ? .032 : -.032), z - .012], [0, y, z - .023]])); }
  const teeth: ModelPart[] = []; for (const side of [-1, 1]) for (let i = 0; i < 12; i++) teeth.push(tapered("长颌两边紧密排列的强扁尖齿", pale, [[side * (.028 - i * .0012), .166, .51 + i * .025], [side * (.028 - i * .0012), .144, .513 + i * .025]], [.006, .0005]));
  parts.push(combineMeshes("蛇鲭两颌之间独立可辨的完整尖齿列", pale, teeth)); pectorals(parts, [0, .165, .3], .12, .005); return parts;
}

// https://www.fisheries.noaa.gov/species/atlantic-wolffish
function atlanticWolffish(): ModelPart[] {
  const parts: ModelPart[] = [body("大西洋狼鱼粗大钝头后渐细的无腹鳍身体", [[.5, .23, .09, .1], [.24, .23, .12, .15], [-.27, .18, .07, .11], [-.58, .13, .024, .046]], skin), lobe("狼鱼额宽颊鼓的厚重头颅", skin, [0, .26, .41], [.24, .27, .29]), tapered("狼鱼下颌留出真实犬齿间隙", fin, [[0, .12, .33], [0, .1, .59]], [.07, .05]), ...eyes([0, .33, .43], .087, .028), ribbon("沿全背延伸的连续低背鳍", .27, -.57, .29, .065), ribbon("后腹部连续的长臀鳍", -.035, -.58, .085, -.037), membrane("与背臀鳍分离的圆形尾鳍", fin, [[0, .15, -.56], [0, .21, -.69], [0, .18, -.79], [0, .09, -.78], [0, .065, -.67], [0, .11, -.56]])];
  for (const side of [-1, 1]) {
    parts.push(tapered("上颌特别放大的弯曲犬齿", pale, [[side * .04, .22, .545], [side * .04, .15, .57], [side * .036, .13, .55]], [.015, .008, .001]), tapered("下颌前端相向的粗犬齿", pale, [[side * .025, .12, .56], [side * .025, .21, .575]], [.013, .001]));
    for (let i = 0; i < 5; i++) parts.push(lobe("位于犬齿后方的钝圆研碎齿", pale, [side * .061, .175, .34 + i * .036], [.027, .024, .026]));
  }
  pectorals(parts, [0, .16, .24], .24, -.005); return parts;
}

// https://www.vims.edu/research/units/programs/multispecies_fisheries_research/speciesofinterest/monkfish.php
function americanGoosefish(): ModelPart[] {
  const parts: ModelPart[] = [body("美洲鮟鱇极宽而低扁的头胸盘", [[.2, .21, .28, .065], [.03, .18, .39, .12], [-.2, .16, .24, .12], [-.43, .13, .085, .08], [-.64, .1, .018, .025]], skin), ...eyes([0, .29, .11], .17, .032), ...tail([0, .1, -.65], .075, true), tapered("美洲鮟鱇头前上方细而弯曲的钓饵竿", pale, [[0, .28, .1], [0, .56, .16], [0, .52, .31]], [.005, .003, .001]), lobe("诱饵竿末端肉质小旗", fin, [0, .52, .31], [.025, .018, .04]), ribbon("尾躯上的短低后背鳍", -.38, -.58, .17, .085)];
  const mouth = frontCup("头盘前缘整宽展开的真实大口凹腔", dark, [0, .175, .2], .112, .2); mouth.scale.x = 2.75; mouth.scale.z = .58; parts.push(mouth);
  for (const side of [-1, 1]) parts.push(tapered("头盘后方可弯曲支撑的胸鳍柄", skin, [[side * .26, .14, -.11], [side * .48, .08, -.13], [side * .5, .035, .02]], [.04, .025, .018]), membrane("胸鳍柄末端足掌般的鳍扇", fin, [[side * .5, .035, .02], [side * .63, .02, .09], [side * .62, .015, .18], [side * .48, .02, .12]]));
  const fringes: ModelPart[] = []; for (const side of [-1, 1]) for (let i = 0; i < 14; i++) { const z = .13 - i * .027, x = side * (.22 + Math.sin(i / 13 * Math.PI) * .14); fringes.push(tapered("头盘边缘独立的叶状伪装皮瓣", fin, [[x, .14, z], [x + side * .055, .11, z + .013], [x + side * .062, .102, z]], [.007, .004, .0007])); }
  for (let i = 0; i < fringes.length; i += 14) parts.push(combineMeshes("头盘两侧真正分离的流苏皮瓣", fin, fringes.slice(i, i + 14))); return parts;
}

// https://fishesofaustralia.net.au/home/species/2043
function pikeConger(): ModelPart[] {
  const path: Triple[] = [[0, .16, .62], [0, .13, .37], [.03, .115, -.08], [.1, .08, -.53], [.04, .065, -.96], [-.12, .045, -1.19]];
  const parts: ModelPart[] = [tapered("海鳗粗前躯至侧扁尖尾的连续长体", skin, path, [.057, .075, .066, .043, .024, .001]), tapered("海鳗明显延长的宽上吻", skin, [[0, .175, .53], [0, .18, .76], [0, .17, .9]], [.052, .037, .012]), tapered("海鳗深口裂下方独立细下颌", fin, [[0, .115, .56], [0, .1, .78], [0, .14, .91]], [.04, .027, .01]), ...eyes([0, .21, .63], .039, .021), membrane("从颈后连续沿背到尾尖的低背鳍", fin, [[0, .185, .4], [.03, .21, -.08], [.1, .15, -.53], [.04, .105, -.96], [-.12, .045, -1.19], [.04, .076, -.96], [.1, .11, -.53], [.03, .162, -.08]])];
  for (const side of [-1, 1]) {
    parts.push(membrane("鳃后存在的独立小胸鳍", fin, [[side * .048, .13, .4], [side * .15, .105, .29], [side * .1, .08, .23], [side * .039, .113, .32]]));
    for (let i = 0; i < 4; i++) parts.push(tapered("大口裂中突出而非普通细齿的大獠牙", pale, [[side * .023, .17, .69 + i * .05], [side * .023, .114, .695 + i * .05]], [.008, .0006]));
  }
  return parts;
}

// https://www.fishbase.se/summary/Labrus_niloticus.html
function nilePerch(): ModelPart[] {
  const parts: ModelPart[] = [body("尼罗尖吻鲈深厚肩部与后端长尾柄", [[.55, .3, .033, .043], [.37, .35, .105, .14], [-.05, .33, .145, .23], [-.43, .24, .076, .12], [-.59, .19, .02, .04]], skin), tapered("尼罗尖吻鲈向前上方突出的下颌", pale, [[0, .2, .35], [0, .21, .6]], [.075, .041]), ...eyes([0, .392, .345], .074, .035), membrane("由深缺刻隔开前后部的棘背鳍前段", fin, [[0, .49, .19], [0, .7, .13], [0, .57, .05], [0, .66, -.015], [0, .5, -.12]]), membrane("深背鳍缺刻之后独立抬高的软条段", fin, [[0, .45, -.15], [0, .58, -.24], [0, .49, -.42], [0, .29, -.54]]), membrane("尾前圆形臀鳍", fin, [[0, .14, -.2], [0, .045, -.31], [0, .095, -.48], [0, .16, -.5]]), membrane("尼罗尖吻鲈宽而圆收的尾鳍", fin, [[0, .22, -.57], [0, .33, -.74], [0, .27, -.84], [0, .1, -.84], [0, .065, -.72], [0, .16, -.57]])];
  for (const side of [-1, 1]) parts.push(tapered("鳃盖游离边缘突出的强硬骨棘", pale, [[side * .099, .32, .19], [side * .16, .29, .08]], [.018, .001]), tapered("鳃盖上方较小的第二骨棘", pale, [[side * .091, .4, .18], [side * .12, .408, .11]], [.009, .0007]));
  pectorals(parts, [0, .27, .19], .21, -.02); return parts;
}

// https://learn.misin.msu.edu/webapp/facts/detail/?cname=Zander&id=272&project=misin
function pikeperch(): ModelPart[] {
  const parts: ModelPart[] = [body("梭鲈长尖头与圆长而不高耸的躯体", [[.4, .17, .02, .025], [.24, .19, .054, .07], [-.04, .185, .075, .1], [-.32, .135, .043, .06], [-.45, .105, .011, .021]], skin), tapered("尖吻下面独立的小下颌", pale, [[0, .12, .23], [0, .125, .44]], [.035, .019]), ...eyes([0, .225, .258], .035, .024), membrane("梭鲈第一背鳍单独竖立的硬棘扇", fin, [[0, .26, .1], [0, .41, .075], [0, .34, .035], [0, .4, -.01], [0, .32, -.06], [0, .36, -.1], [0, .25, -.16]]), membrane("与第一背鳍真正留隙的长第二背鳍", fin, [[0, .235, -.19], [0, .32, -.23], [0, .26, -.36], [0, .15, -.42]]), ribbon("尾前的短臀鳍", -.24, -.38, .085, -.035), ...tail([0, .105, -.46], .089, true)];
  for (const side of [-1, 1]) parts.push(tapered("梭鲈口前下颌上的一对放大犬齿", pale, [[side * .014, .146, .395], [side * .014, .2, .402]], [.009, .0006]), tapered("前上颌相对的少数强犬齿", pale, [[side * .02, .177, .36], [side * .02, .134, .365]], [.007, .0005]));
  pectorals(parts, [0, .15, .18], .1, .005); return parts;
}

export const aquaticExpansionBatchFourDesigns: MasterNatureDesign[] = [
  design("mahiMahi", "鲯鳅", "动物", mahiMahi, ["Coryphaena hippurus", "陡直额部高长背鳍与急收细尾体"]),
  design("humpheadWrasse", "曲纹唇鱼", "动物", humpheadWrasse, ["Cheilinus undulatus", "实体额瘤厚唇凹口与圆尾"]),
  design("goliathGrouper", "巨石斑鱼", "动物", goliathGrouper, ["Epinephelus itajara", "圆钝巨头大口相连棘背鳍与圆尾扇"]),
  design("giantTrevally", "浪人鲹", "动物", giantTrevally, ["Caranx ignobilis", "陡额长镰胸鳍与连续尾柄骨盾"]),
  design("wahoo", "棘鳞蛇鲭", "动物", wahoo, ["Acanthocybium solandri", "长锥形齿吻与双面分离小离鳍列"]),
  design("atlanticWolffish", "大西洋狼鱼", "动物", atlanticWolffish, ["Anarhichas lupus", "粗前犬齿与后方臼齿无腹鳍的长体"]),
  design("americanGoosefish", "美洲鮟鱇", "动物", americanGoosefish, ["Lophius americanus", "扁宽头盘大口凹腔与足掌形胸鳍及皮瓣"]),
  design("pikeConger", "海鳗", "动物", pikeConger, ["Muraenesox cinereus", "长深齿吻宽头与普通鳗形身体不同的显著獠牙"]),
  design("nilePerch", "尼罗尖吻鲈", "动物", nilePerch, ["Lates niloticus", "高肩深体前突颌与鳃盖骨棘及深背鳍缺刻"]),
  design("pikeperch", "梭鲈", "动物", pikeperch, ["Sander lucioperca", "真正分离的双背鳍与前颌放大犬齿"]),
];
