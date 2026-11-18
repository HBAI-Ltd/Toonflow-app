import { combineMeshes, design, eyes, frontCup, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";
import { body, pectorals, ribbon } from "./fishForms";
import { tail } from "./marine";

const skin = "#9cab9b";
const fin = "#b8c3a9";
const pale = "#d4cfb3";
const dark = "#798c78";

// https://www.nhm.ac.uk/discover/what-is-a-plesiosaur.html
function pliosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("上龙短颈后粗壮的流线躯体", [[1.9, 1.1, .48, .48], [.6, 1.05, 1, .85], [-1.45, .9, .71, .65], [-2.55, .65, .2, .25]], skin), body("上龙长度接近三米的后宽前窄上颅", [[4.9, 1.08, .16, .14], [4.25, 1.15, .31, .28], [3.35, 1.25, .55, .4], [2.56, 1.15, .64, .47], [1.8, 1.1, .45, .4]], skin), tapered("长而厚的上龙下颌", fin, [[0, .69, 2.6], [0, .56, 3.9], [0, .78, 4.95]], [.41, .27, .13]), tapered("上龙较短的锥形尾", skin, [[0, .66, -2.25], [0, .52, -3.2], [0, .43, -3.75]], [.25, .13, .012]), ...eyes([0, 1.48, 2.93], .49, .09)];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -1.55 : 1.1, length = rear ? 2.6 : 2.2; parts.push(membrane(rear ? "上龙宽根长后桨肢" : "上龙向外后方伸出的完整前桨肢", fin, [[side * .65, .73, z + .27], [side * 1.55, .52, z + .08], [side * length, .27, z - .86], [side * (length - .3), .23, z - 1.25], [side * 1.24, .44, z - .73], [side * .6, .65, z - .16]])); }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 14; i++) { const t = i / 13, z = 2.98 + t * 1.72, x = side * (.43 - t * .26); teeth.push(tapered("上龙长颌内可辨的圆锥獠齿", pale, [[x, .99, z], [x, .7 + Math.sin(t * Math.PI) * .02, z + .025]], [.045 - t * .01, .001])); }
  for (let i = 0; i < teeth.length; i += 14) parts.push(combineMeshes("上龙两侧相互分离的大齿列", pale, teeth.slice(i, i + 14))); return parts;
}

// https://peterboroughmuseum.org.uk/the-jurassic-gallery-large-print-guide
function marineCrocodile(): ModelPart[] {
  const parts: ModelPart[] = [body("海鳄无背甲而连续光滑的纺锤躯体", [[.67, .36, .12, .1], [.17, .35, .24, .19], [-.55, .27, .16, .15], [-1.13, .18, .034, .055]], skin), body("海鳄前伸的窄长鳄形上颅", [[1.45, .4, .033, .03], [1.04, .42, .055, .042], [.72, .46, .15, .1], [.48, .4, .12, .1]], skin), tapered("光滑长吻下方独立的窄下颌", fin, [[0, .34, .7], [0, .32, 1.16], [0, .36, 1.48]], [.085, .045, .025]), ...eyes([0, .49, .72], .107, .035), membrane("海鳄尾端下弯形成的长下叶", fin, [[0, .21, -1.04], [0, .11, -1.34], [0, -.08, -1.57], [0, -.18, -1.66], [0, -.1, -1.41], [0, .1, -1.12]]), membrane("与长下叶对应的上部软尾叶", fin, [[0, .19, -1.08], [0, .43, -1.44], [0, .45, -1.56], [0, .17, -1.38]])];
  for (const side of [-1, 1]) parts.push(membrane("小而呈鳍状的前肢而非有爪行走足", fin, [[side * .17, .29, .42], [side * .48, .16, .2], [side * .52, .12, -.03], [side * .33, .18, .01], [side * .15, .26, .19]]), membrane("较前肢更长的独立后桨肢", fin, [[side * .13, .2, -.54], [side * .54, .1, -.67], [side * .67, .03, -.97], [side * .48, .035, -1.09], [side * .12, .16, -.79]]));
  const teeth: ModelPart[] = []; for (const side of [-1, 1]) for (let i = 0; i < 11; i++) teeth.push(tapered("长窄上下颌之间的独立尖齿", pale, [[side * (.057 - i * .0028), .39, .94 + i * .046], [side * (.057 - i * .0028), .342, .945 + i * .046]], [.008, .0006]));
  parts.push(combineMeshes("海鳄完整的两侧长吻齿列", pale, teeth)); return parts;
}

// https://doi.org/10.1111/joa.12162
function placodus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("楯齿龙无龟壳的厚肋桶形躯干", skin, [0, .39, -.2], [.75, .64, 1.17]), tapered("楯齿龙短粗前颈", skin, [[0, .43, .27], [0, .43, .67]], [.22, .18]), lobe("楯齿龙短而深厚的咬合头颅", skin, [0, .49, .8], [.38, .33, .53]), lobe("张口缝下的厚实下颌", fin, [0, .3, .83], [.32, .17, .48]), tapered("没有鲸尾叶的侧向游泳长尾", skin, [[0, .35, -.68], [.04, .24, -1.18], [.09, .18, -1.76]], [.15, .09, .008]), ...eyes([0, .59, .76], .145, .035)];
  for (const side of [-1, 1]) {
    for (const z of [-.53, .25]) { parts.push(tapered("楯齿龙从躯体向外展开再折下的短肢", skin, [[side * .23, .36, z], [side * .48, .19, z - .04], [side * .46, .075, z + .08]], [.095, .064, .039]), membrane("五趾之间连接的推定游泳蹼", fin, [[side * .37, .065, z + .06], [side * .58, .055, z + .13], [side * .57, .05, z + .28], [side * .37, .05, z + .25]])); }
    for (let i = 0; i < 3; i++) parts.push(tapered("前颌前伸的粗柱状取食门齿", pale, [[side * (.037 + i * .023), .4, 1], [side * (.04 + i * .024), .405, 1.17]], [.016, .009]));
    for (let i = 0; i < 4; i++) parts.push(lobe("口腔后方平展的研碎齿", pale, [side * .086, .389, .69 + i * .057], [.073, .035, .055]));
  }
  for (let i = 0; i < 7; i++) parts.push(lobe("脊线上分离的小骨皮而非完整龟甲", fin, [0, .66 - Math.abs(i - 3) * .021, .28 - i * .14], [.095, .052, .11])); return parts;
}

// https://doi.org/10.1093/zoolinnean/zlag166
function hupehsuchus(): ModelPart[] {
  const parts: ModelPart[] = [body("湖北鳄深而较窄的刚性胸腹", [[.19, .14, .042, .035], [.05, .13, .066, .093], [-.2, .12, .052, .076], [-.37, .085, .018, .031]], skin), tapered("湖北鳄短颈前端长而无齿的窄上喙", skin, [[0, .15, .16], [0, .155, .31], [0, .15, .47]], [.038, .026, .006]), tapered("与上喙并行而稍下垂的无齿下颌", fin, [[0, .12, .21], [0, .116, .42], [0, .13, .47]], [.024, .014, .004]), tapered("与躯体连续的长侧扁尾", skin, [[0, .095, -.31], [.01, .07, -.56], [.02, .045, -.83]], [.031, .024, .002]), ...eyes([0, .178, .235], .026, .012)];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -.23 : .1; parts.push(membrane(rear ? "较小的独立后鳍肢" : "前端较宽的桨形前鳍肢", fin, [[side * .045, .086, z + .032], [side * (rear ? .16 : .24), .035, z - .01], [side * (rear ? .18 : .26), .024, z - .1], [side * .085, .048, z - .115], [side * .04, .075, z - .04]])); }
  const plates: ModelPart[] = [];
  for (let i = 0; i < 12; i++) for (const row of [-1, 0, 1]) plates.push(lobe("湖北鳄背部三列覆瓦状骨甲的外表面", fin, [row * .026, .223 - Math.abs(i - 5) * .004 - Math.abs(row) * .009, .12 - i * .027], [.039, .025, .041]));
  for (let i = 0; i < plates.length; i += 24) parts.push(combineMeshes("湖北鳄背面连续重叠的骨甲列", fin, plates.slice(i, i + 24)));
  for (const value of parts) for (const axis of ["x", "y", "z"] as const) { value.position[axis] *= .77; value.scale[axis] *= .77; }
  return parts;
}

// https://peabody.yale.edu/explore/exhibitions/central-gallery
function archelon(): ModelPart[] {
  const parts: ModelPart[] = [body("帝龟较扁而无六角角质盾片的皮质背甲", [[1.15, .61, .35, .19], [.7, .64, .9, .4], [-.4, .59, 1.02, .42], [-1.08, .47, .7, .27], [-1.3, .42, .2, .1]], skin), lobe("帝龟背甲下方较浅的腹甲", fin, [0, .32, -.12], [1.72, .29, 2.05]), tapered("背甲前方粗壮伸出的颈", skin, [[0, .55, .92], [0, .57, 1.55]], [.25, .2]), body("帝龟长而窄前端下钩的巨大颅", [[2.14, .57, .075, .07], [1.88, .65, .19, .16], [1.59, .65, .24, .23], [1.36, .58, .18, .17]], skin), tapered("帝龟尖端下钩的无齿上喙", pale, [[0, .63, 2.08], [0, .53, 2.24], [0, .45, 2.2]], [.075, .044, .006]), tapered("帝龟下方独立的深厚下喙", fin, [[0, .4, 1.74], [0, .37, 2.08], [0, .43, 2.17]], [.13, .07, .025]), tapered("帝龟甲后伸出的短尾", skin, [[0, .39, -1.16], [0, .29, -1.7]], [.1, .007]), ...eyes([0, .75, 1.72], .167, .038)];
  for (const side of [-1, 1]) parts.push(membrane("帝龟从前肩展开的超长桨形前肢", fin, [[side * .64, .43, .65], [side * 1.37, .31, .49], [side * 2.25, .11, -.37], [side * 2.36, .08, -.69], [side * 1.76, .18, -.54], [side * .71, .37, .25]]), membrane("帝龟靠后外伸的较短后桨肢", fin, [[side * .74, .32, -.8], [side * 1.32, .15, -1.1], [side * 1.59, .08, -1.57], [side * 1.27, .09, -1.6], [side * .62, .29, -1.08]]));
  return parts;
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC6255188/
function rhizodus(): ModelPart[] {
  const parts: ModelPart[] = [body("根齿鱼宽圆颅后延伸的厚重长躯", [[1.93, .52, .14, .13], [1.47, .62, .31, .28], [.61, .6, .4, .39], [-.87, .45, .26, .27], [-1.61, .32, .08, .13]], skin), tapered("根齿鱼厚而前伸的下颌", fin, [[0, .36, 1.12], [0, .31, 1.72], [0, .43, 2.03]], [.23, .16, .065]), ...eyes([0, .77, 1.36], .238, .05), ribbon("位于躯体后段的前背鳍", -.53, -.97, .65, .26), ribbon("紧接尾前的第二低背鳍", -1.17, -1.58, .45, .18), membrane("根齿鱼与体轴连接的宽尾叶", fin, [[0, .4, -1.53], [0, .63, -1.98], [0, .59, -2.35], [0, .33, -2.23], [0, .1, -2.34], [0, .075, -2.02], [0, .26, -1.53]])];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -.65 : .94, root: Triple = [side * (rear ? .21 : .29), rear ? .35 : .43, z], joint: Triple = [side * (rear ? .61 : .71), .24, z - .12]; parts.push(tapered(rear ? "根齿鱼带有肌肉根部的腹鳍肢" : "根齿鱼粗壮可辨的肉质胸鳍根", skin, [root, joint], [rear ? .085 : .12, .06]), membrane("肉质鳍肢末端保留完整柔鳍条扇", fin, [joint, [joint[0] + side * .22, .15, z - .27], [joint[0] + side * .15, .13, z - .54], [joint[0] - side * .12, .2, z - .38]])); }
  for (const side of [-1, 1]) parts.push(tapered("根齿鱼颌前一对显著放大的牙根獠齿", pale, [[side * .115, .42, 1.76], [side * .105, .65, 1.83]], [.045, .001])); return parts;
}

// https://www.isu.edu/news/2018-fall/idaho-state-university-researchers-help-create-skull-of-ancient-scissor-toothed-shark-edestus.html
function edestus(): ModelPart[] {
  const parts: ModelPart[] = [body("剪齿鲨粗前躯至渐细尾柄的复原身体", [[1.06, .53, .16, .17], [.37, .51, .35, .36], [-.68, .4, .22, .26], [-1.54, .27, .045, .08]], skin), lobe("剪齿鲨宽而较短的颅部", skin, [0, .64, 1.03], [.49, .46, .64]), tapered("剪齿鲨独立的浅张下颌", fin, [[0, .36, .94], [0, .24, 1.35]], [.17, .115]), ...eyes([0, .73, 1.1], .195, .046), membrane("复原的高三角背鳍", fin, [[0, .77, .24], [0, 1.31, .02], [0, .57, -.45]]), ...tail([0, .27, -1.57], .45, true)];
  for (const upper of [false, true]) {
    const centers: Triple[] = Array.from({ length: 7 }, (_, i) => [0, upper ? .51 + i * .043 : .26 - i * .02, 1.11 + i * .096]);
    parts.push(tapered(upper ? "上颌中央向前弯曲伸出的连续齿刃基部" : "下颌中央与上刃对应的连续齿刃基部", fin, centers, centers.map(() => .023)));
    for (let i = 0; i < 7; i++) { const [x, y, z] = centers[i]!; parts.push(part("齿刃中线成列的扁平三角切割牙冠", "extrude", pale, [x, y, z], [1, 1, 1], [0, 90, 0], { depth: .024, profile: [{ x: -.04, y: 0 }, { x: .04, y: 0 }, { x: .015, y: upper ? -.17 : .17 }] })); }
  }
  for (const side of [-1, 1]) parts.push(membrane("剪齿鲨两侧完整胸鳍", fin, [[side * .24, .36, .6], [side * .84, .17, .12], [side * .64, .11, -.2], [side * .21, .3, .24]]));
  return parts;
}

// https://pubmed.ncbi.nlm.nih.gov/10493780/
function orthacanthus(): ModelPart[] {
  const parts: ModelPart[] = [body("直棘鲨宽头后延伸的长鳗形躯", [[.97, .36, .13, .1], [.43, .35, .17, .16], [-.46, .27, .11, .14], [-1.2, .19, .052, .089], [-1.59, .17, .008, .02]], skin), ...eyes([0, .435, .81], .09, .035), tapered("从颅后而非背鳍前缘发出的粗直长棘", pale, [[0, .45, .68], [0, .82, .43], [0, .99, .32]], [.033, .021, .001]), membrane("从头后延展至尾尖的低而连续背鳍", fin, [[0, .45, .46], [0, .63, .27], [0, .58, -.42], [0, .43, -1.13], [0, .25, -1.63], [0, .17, -1.6], [0, .3, -1.12], [0, .41, -.42], [0, .47, .15]]), membrane("尾端下方延伸的低软尾叶", fin, [[0, .18, -1.2], [0, .06, -1.47], [0, .13, -1.7], [0, .18, -1.57]])];
  for (const side of [-1, 1]) parts.push(membrane("直棘鲨宽而圆收的低位胸鳍", fin, [[side * .13, .27, .57], [side * .46, .15, .34], [side * .48, .12, .1], [side * .23, .17, .16], [side * .11, .25, .39]]), membrane("尾前独立的小腹鳍", fin, [[side * .065, .18, -.56], [side * .22, .08, -.72], [side * .15, .08, -.9], [side * .05, .17, -.7]]));
  return parts;
}

// https://www.cnrs.fr/sites/default/files/press_info/2021-09/CP%20Requin%20ail%C3%A9%20EN%20Web.pdf
function eagleShark(): ModelPart[] {
  const parts: ModelPart[] = [body("鹰鲨短宽头后接较细的梭形躯", [[.41, .21, .115, .055], [.17, .22, .14, .105], [-.5, .18, .09, .082], [-.8, .13, .021, .034]], skin), lobe("鹰鲨接近终端的宽而扁口部", fin, [0, .167, .405], [.22, .03, .063]), ...eyes([0, .24, .337], .086, .015), membrane("上叶特别长且末端纤细的歪尾", fin, [[0, .15, -.78], [0, .37, -1.03], [0, .4, -1.25], [0, .29, -1.19], [0, .11, -.87]]), membrane("鹰鲨尾鳍较短而角度更大的下叶", fin, [[0, .13, -.82], [0, -.065, -.97], [0, -.11, -1.06], [0, .08, -.94]])];
  for (const side of [-1, 1]) parts.push(membrane("翼展超过体长的极长镰形胸鳍", fin, [[side * .105, .18, .25], [side * .35, .19, .27], [side * .76, .14, .19], [side * .97, .09, -.02], [side * .99, .07, -.14], [side * .87, .09, -.12], [side * .45, .14, .035], [side * .1, .16, .105]]));
  // ACT: 唯一标本未保存背、腹、臀鳍；此复原不把未知轮廓补成另一种通用鲨鱼，不能据此推断实际无鳍。
  return parts;
}

// https://www.dmr.nd.gov/dmr/sites/www/files/documents/paleontology/pdfs/prehistoric-life-map/Xiphactinus.pdf
function xiphactinus(): ModelPart[] {
  const parts: ModelPart[] = [body("剑射鱼胸后迅速收细的长游泳躯体", [[1.58, .79, .29, .28], [.67, .68, .38, .48], [-.67, .5, .27, .37], [-1.64, .36, .055, .11]], skin), body("剑射鱼近乎陡直的斗牛犬式巨大上颅", [[2.4, .94, .12, .16], [2.06, 1.03, .23, .29], [1.65, .93, .32, .38], [1.29, .79, .28, .31]], skin), tapered("前端上翘且突出的大下颌", fin, [[0, .52, 1.47], [0, .49, 2.1], [0, .75, 2.49]], [.22, .18, .1]), ...eyes([0, 1.08, 1.84], .235, .071), ribbon("剑射鱼位于体后半部的三角背鳍", -.62, -1.24, .75, .56), ribbon("从腹后部延长到尾前的臀鳍", -.53, -1.49, .29, -.25), ...tail([0, .36, -1.66], .53, true)];
  for (const side of [-1, 1]) {
    parts.push(tapered("剑射鱼口前方特别巨大的下颌尖牙", pale, [[side * .117, .66, 2.29], [side * .117, 1.02, 2.31]], [.052, .001]), tapered("上颌前端向下伸出的长尖牙", pale, [[side * .125, .92, 2.2], [side * .125, .58, 2.22]], [.048, .001]));
    for (let i = 0; i < 7; i++) parts.push(tapered("颌后缘分离的短锥齿", pale, [[side * .18, .78, 1.58 + i * .071], [side * .18, .62, 1.59 + i * .071]], [.025, .001]));
  }
  pectorals(parts, [0, .58, 1.17], .8, -.04); return parts;
}

// https://www.nhm.ac.uk/discover/prehistoric-fish-timeline.html
function leedsichthys(): ModelPart[] {
  const parts: ModelPart[] = [body("利兹鱼粗壮滤食前躯至狭窄尾柄", [[3.5, 1.58, .86, .78], [1.9, 1.65, 1.05, 1.19], [-1.5, 1.4, .78, .93], [-4.2, 1.06, .35, .48], [-5.4, .9, .12, .2]], skin), frontCup("利兹鱼宽大而真实凹入的滤食口腔", skin, [0, 1.65, 3.44], .89, 1.08), ...eyes([0, 2.13, 3.29], .74, .1), ribbon("利兹鱼后移的主背鳍", -.9, -2.8, 2.1, 1.2), ...tail([0, .9, -5.45], 1.38, true)];
  for (const side of [-1, 1]) parts.push(membrane("巨大鳃篮后方伸出的镰形胸鳍", fin, [[side * .82, 1.02, 2.28], [side * 1.91, .74, 1.91], [side * 2.42, .4, .43], [side * 1.98, .35, .58], [side * .72, .85, 1.57]]));
  const rakers: ModelPart[] = [];
  for (let i = 0; i < 22; i++) { const a = Math.PI * (1.13 + i / 21 * .74), x = Math.cos(a) * .59, y = 1.65 + Math.sin(a) * .59; rakers.push(tapered("口腔内实际相互留隙的梳形滤食鳃耙", pale, [[x, y, 4.1], [x * .64, 1.65 + (y - 1.65) * .64, 3.97]], [.016, .008])); }
  parts.push(combineMeshes("巨大滤食口内的完整梳齿鳃耙弧", pale, rakers)); return parts;
}

export const aquaticExpansionBatchThreeDesigns: MasterNatureDesign[] = [
  design("pliosaurus", "上龙", "动物", pliosaurus, ["Pliosaurus", "古海生爬行动物形态复原", "巨颅短颈与四支独立长桨肢"]),
  design("marineCrocodile", "海鳄", "动物", marineCrocodile, ["Metriorhynchus", "古海生鳄形类复原", "无背甲光滑躯与鳍状四肢及下弯双叶尾"]),
  design("placodus", "楯齿龙", "动物", placodus, ["Placodus gigas", "古海生爬行动物形态复原", "前伸取食门齿与后方平磨齿及无壳厚躯"]),
  design("hupehsuchus", "湖北鳄", "动物", hupehsuchus, ["Hupehsuchus nanchangensis", "古海生爬行动物形态复原", "长无齿喙深胸腹与连续背甲列"]),
  design("archelon", "帝龟", "动物", archelon, ["Archelon ischyros", "古海生龟形态复原", "扁皮质背甲长桨肢与深厚钩喙"]),
  design("rhizodus", "根齿鱼", "动物", rhizodus, ["Rhizodus hibberti", "古肉鳍鱼形态复原", "巨大前颌獠齿与肌肉鳍根及完整柔鳍扇"]),
  design("edestus", "剪齿鲨", "动物", edestus, ["Edestus", "古软骨鱼形态复原", "上下颌正中成列外弯的双齿刃"]),
  design("orthacanthus", "直棘鲨", "动物", orthacanthus, ["Orthacanthus", "古淡水软骨鱼形态复原", "颅后独立长棘鳗形长躯与连续低背鳍"]),
  design("eagleShark", "鹰鲨", "动物", eagleShark, ["Aquilolamna milarcae", "古软骨鱼形态复原", "极长窄胸鳍及宽短头与长上叶歪尾"]),
  design("xiphactinus", "剑射鱼", "动物", xiphactinus, ["Xiphactinus audax", "古鱼类形态复原", "陡直巨颅上翘下颌与口前长獠齿"]),
  design("leedsichthys", "利兹鱼", "动物", leedsichthys, ["Leedsichthys problematicus", "巨型古滤食鱼形态复原", "宽口凹腔与实际留隙的梳状鳃耙"]),
];
