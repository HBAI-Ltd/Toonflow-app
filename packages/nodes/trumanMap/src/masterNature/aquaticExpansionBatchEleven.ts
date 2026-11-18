import { combineMeshes, design, eyes, frontCup, lobe, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { body, pectorals, ribbon } from "./fishForms";
import { membrane } from "./animals";
import { tail } from "./marine";

const skin = "#a0b19d";
const fin = "#bec8ad";
const pale = "#d8d1b4";
const dark = "#80977c";

// https://fishesofaustralia.net.au/home/species/4022
function longnoseLancetfish(): ModelPart[] {
  const parts: ModelPart[] = [body("帆蜥鱼深度不足体长十分之一的细长躯体", [[.62, .22, .028, .045], [.34, .23, .066, .09], [-.26, .18, .057, .075], [-.73, .13, .018, .026]], skin), tapered("帆蜥鱼细长而有大口裂的上颌", skin, [[0, .27, .52], [0, .265, .88]], [.049, .017]), tapered("帆蜥鱼分离的长下颌", fin, [[0, .13, .5], [0, .14, .91]], [.041, .015]), ...eyes([0, .293, .562], .044, .028), membrane("帆蜥鱼鳃后起始并覆盖大半躯干的高帆背鳍", fin, [[0, .3, .46], [0, .55, .39], [0, .83, .28], [0, .78, .12], [0, .69, -.14], [0, .54, -.37], [0, .29, -.54], [0, .2, -.55]]), membrane("帆蜥鱼高帆后方真正分开的微小脂鳍", fin, [[0, .2, -.58], [0, .28, -.64], [0, .175, -.7]]), ribbon("帆蜥鱼尾前独立的短臀鳍", -.4, -.65, .083, -.047), ...tail([0, .13, -.76], .25, true)];
  pectorals(parts, [0, .18, .34], .22, -.025);
  for (const side of [-1, 1]) {
    parts.push(membrane("帆蜥鱼较后位且尖长的腹鳍", fin, [[side * .027, .1, -.21], [side * .14, .03, -.42], [side * .035, .073, -.47]]));
    for (let i = 0; i < 3; i++) parts.push(tapered("帆蜥鱼下颌突出的长犬牙", pale, [[side * (.033 - i * .005), .155, .64 + i * .077], [side * (.031 - i * .005), .255, .64 + i * .077]], [.0065, .0003]));
    parts.push(tapered("帆蜥鱼前腭骨向下伸出的直立大獠牙", pale, [[side * .026, .248, .718], [side * .023, .13, .71]], [.008, .0003]));
  }
  for (let i = 0; i < 4; i++) parts.push(tapered("高背帆前部具有真实游离尖端的鳍条", pale, [[0, .3, .38 - i * .085], [0, .57 + Math.sin(i / 3 * Math.PI) * .26, .38 - i * .085], [0, .61 + Math.sin(i / 3 * Math.PI) * .26, .39 - i * .085]], [.0027, .0022, .0004]));
  return parts;
}

// https://www.nafo.int/Portals/0/PDFs/fahay/p1384-1417.pdf
function largeheadHairtail(): ModelPart[] {
  const parts: ModelPart[] = [body("带鱼真实极侧扁而向后收成毛尖的长带状鱼体", [[.5, .2, .022, .07], [.19, .2, .029, .095], [-.35, .16, .023, .078], [-.81, .12, .011, .038], [-1.28, .08, .0008, .0015]], skin), tapered("带鱼长尖上颌", skin, [[0, .255, .42], [0, .25, .7]], [.027, .009]), tapered("带鱼略向前伸出的长下颌", fin, [[0, .125, .42], [0, .14, .73]], [.024, .008]), ...eyes([0, .255, .456], .023, .024), membrane("带鱼从头后一直连续延至细尾的长背鳍", fin, [[0, .27, .47], [0, .38, .39], [0, .35, .05], [0, .29, -.42], [0, .18, -.88], [0, .081, -1.28], [0, .145, -.85], [0, .23, -.4], [0, .29, .16]])];
  pectorals(parts, [0, .19, .35], .105, -.006);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) parts.push(tapered("带鱼前上颌向后略钩曲的长獠牙", pale, [[side * .015, .237, .55 + i * .047], [side * .015, .158, .548 + i * .047], [side * .014, .145, .537 + i * .047]], [.005, .002, .0002]));
    for (let i = 0; i < 4; i++) parts.push(tapered("带鱼下颌朝上合入间隙的长牙", pale, [[side * .014, .151, .51 + i * .045], [side * .013, .222, .512 + i * .045]], [.0038, .0002]));
  }
  // ACT: 带鱼不具腹鳍和尾鳍；不把被皮覆盖的微小臀鳍棘画成长鳍片。
  return parts;
}

// https://tpwd.texas.gov/huntwild/wild/species/blackdrum/
function blackDrum(): ModelPart[] {
  const parts: ModelPart[] = [body("黑鼓鱼头后急拱而高厚的胸背", [[.5, .22, .04, .07], [.28, .31, .12, .23], [-.02, .32, .145, .29], [-.39, .23, .09, .16], [-.58, .18, .024, .052]], skin), lobe("黑鼓鱼吻端圆钝且口位于下方的头", skin, [0, .245, .43], [.24, .29, .28]), tapered("黑鼓鱼吻端下面的下位口唇", fin, [[-.035, .136, .5], [0, .13, .57], [.035, .136, .5]], [.012, .012, .012]), ...eyes([0, .337, .418], .091, .028), membrane("黑鼓鱼前段较高的硬棘背鳍", fin, [[0, .49, .25], [0, .79, .11], [0, .64, -.025], [0, .57, -.075]]), membrane("硬棘背后经凹口连接的长软背鳍", fin, [[0, .57, -.075], [0, .68, -.145], [0, .58, -.33], [0, .3, -.53], [0, .27, -.55]]), membrane("黑鼓鱼尾前短基底臀鳍", fin, [[0, .09, -.28], [0, -.005, -.39], [0, .13, -.53]]), membrane("黑鼓鱼成体略凸而不深叉的尾鳍", fin, [[0, .21, -.56], [0, .35, -.7], [0, .32, -.84], [0, .09, -.84], [0, .045, -.72], [0, .14, -.56]])];
  pectorals(parts, [0, .21, .24], .25, -.015);
  for (const side of [-1, 1]) {
    parts.push(membrane("黑鼓鱼胸下独立的腹鳍", fin, [[side * .052, .115, .14], [side * .15, .035, .025], [side * .058, .075, -.04]]));
    for (let i = 0; i < 12; i++) { const t = i / 11; parts.push(tapered("黑鼓鱼下颏成多对排列的短感觉须", pale, [[side * (.012 + t * .024), .132, .445 + t * .108], [side * (.019 + t * .035), .075 - Math.sin(t * Math.PI) * .019, .455 + t * .108]], [.0024, .0003])); }
  }
  return parts;
}

// https://doi.org/10.1590/S0101-81751982000200001
function tambaqui(): ModelPart[] {
  const parts: ModelPart[] = [body("大盖巨脂鲤背腹都很高的深椭圆鱼躯", [[.3, .27, .04, .065], [.14, .29, .1, .2], [-.13, .28, .125, .25], [-.37, .23, .06, .13], [-.49, .2, .016, .037]], skin), body("大盖巨脂鲤口内留有牙床空间的短上吻", [[.44, .263, .021, .019], [.27, .27, .052, .022]], skin), body("大盖巨脂鲤与上颌分开的较薄下颌", [[.455, .178, .02, .013], [.28, .171, .043, .021]], fin), ...eyes([0, .33, .273], .062, .023), membrane("大盖巨脂鲤中背较短的软条背鳍", fin, [[0, .48, .015], [0, .66, -.05], [0, .44, -.22]]), membrane("大盖巨脂鲤尾柄前明显的低脂鳍", fin, [[0, .31, -.345], [0, .375, -.385], [0, .26, -.435]]), membrane("大盖巨脂鲤相对较长的臀鳍", fin, [[0, .09, -.15], [0, -.01, -.26], [0, .13, -.46]]), ...tail([0, .2, -.51], .17, true)];
  pectorals(parts, [0, .19, .17], .21, -.012);
  for (const side of [-1, 1]) parts.push(membrane("大盖巨脂鲤鳃盖后延伸的真实宽肉质瓣", fin, [[side * .074, .32, .205], [side * .125, .28, .11], [side * .145, .14, .075], [side * .104, .11, .17], [side * .059, .2, .24]]), membrane("大盖巨脂鲤腹部短鳍", fin, [[side * .05, .105, -.03], [side * .14, .035, -.13], [side * .05, .065, -.2]]));
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (const upper of [false, true]) for (const inner of [false, true]) for (let i = 0; i < (upper ? inner ? 2 : 5 : inner ? 3 : 6); i++) { const x = side * (inner ? .012 : .025), z = .31 + i * (inner ? .027 : .023), y = upper ? .242 : .197; teeth.push(lobe("前颌和下牙床多行排列的独立低磨牙", pale, [x, y, z], [.013, .015, .018]), lobe("磨牙冠上低而相连的圆钝咬合结节", pale, [x - side * .003, y + (upper ? -.007 : .007), z], [.009, .008, .012])); }
  for (let i = 0; i < teeth.length; i += 30) parts.push(combineMeshes("巨脂鲤不具食人鱼切割尖的多行磨牙", pale, teeth.slice(i, i + 30)));
  return parts;
}

// https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/sand-tiger-shark/
function sandTigerShark(): ModelPart[] {
  const parts: ModelPart[] = [body("锥齿鲨粗壮前胸与留出长口腔的扁圆锥状上吻", [[1.03, .5, .07, .07], [.8, .54, .16, .09], [.58, .52, .23, .12], [.28, .48, .25, .24], [-.23, .4, .24, .27], [-.95, .25, .12, .16], [-1.29, .18, .03, .05]], skin), body("锥齿鲨长口裂下方独立的扁下颌", [[1.13, .285, .025, .018], [.9, .25, .07, .035], [.51, .26, .12, .05]], fin), ...eyes([0, .594, .71], .171, .035), membrane("锥齿鲨靠后且宽基的第一背鳍", fin, [[0, .58, -.08], [0, 1.02, -.27], [0, .87, -.44], [0, .36, -.62]]), membrane("锥齿鲨与首背几乎等大的第二背鳍", fin, [[0, .34, -.86], [0, .72, -1.03], [0, .57, -1.18], [0, .2, -1.27]]), membrane("锥齿鲨与第二背近等大的臀鳍", fin, [[0, .15, -.88], [0, -.15, -1.05], [0, -.13, -1.21], [0, .14, -1.29]]), membrane("锥齿鲨长而明显上挑的上尾叶", fin, [[0, .2, -1.23], [0, .55, -1.69], [0, .69, -2.02], [0, .38, -1.87], [0, .1, -1.47]]), membrane("锥齿鲨短于上叶的下尾叶", fin, [[0, .15, -1.27], [0, -.08, -1.55], [0, .01, -1.67], [0, .19, -1.49]])];
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(membrane("锥齿鲨较前位的宽三角胸鳍", fin, [[side * .19, .35, .51], [side * .66, .11, .14], [side * .49, .07, -.07], [side * .18, .29, .13]]), membrane("锥齿鲨首背后下方的短腹鳍", fin, [[side * .13, .2, -.63], [side * .39, .025, -.8], [side * .23, .04, -.99], [side * .1, .18, -.82]]));
    for (let i = 0; i < 5; i++) parts.push(tapered("锥齿鲨位于胸鳍起点之前的五道鳃缘", dark, [[side * .212, .53, .56 - i * .049], [side * .226, .34, .56 - i * .049]], [.0045, .0045]));
    for (const upper of [false, true]) for (let i = 0; i < 22; i++) { const t = i / 21, x = side * (.135 - t * .101), z = .6 + t * .48, y = upper ? .406 : .299, direction = upper ? -1 : 1, height = .033 + Math.sin(t * Math.PI) * .035; teeth.push(tapered("锥齿鲨外露细长主牙尖", pale, [[x, y, z], [x, y + direction * height, z + .004]], [.006, .0002])); for (const offset of [-1, 1]) teeth.push(tapered("每枚主牙两边独立而较小的侧齿尖", pale, [[x, y, z + offset * .008], [x, y + direction * .019, z + offset * .008]], [.003, .0002])); }
  }
  for (let i = 0; i < teeth.length; i += 27) parts.push(combineMeshes("锥齿鲨上下颌每侧二十二枚带双侧尖的针牙", pale, teeth.slice(i, i + 27))); return parts;
}

// https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?spid=52665
// https://file.iflora.cn/fastdfs/group1/M00/64/0B/wKhnoV2IAVmAbKz-ATGoVqySogc513.pdf
function goonch(): ModelPart[] {
  const parts: ModelPart[] = [body("魾低伏前宽而尾柄强壮的长体", [[.51, .2, .18, .08], [.12, .21, .22, .17], [-.58, .16, .12, .12], [-.98, .12, .027, .045]], skin), lobe("魾粗粒皮覆盖的宽扁大头", skin, [0, .21, .53], [.54, .2, .59]), tapered("魾平直而很宽的前口上唇", fin, [[-.12, .155, .69], [0, .15, .81], [.12, .155, .69]], [.025, .025, .025]), tapered("魾分离的宽下颌", skin, [[-.12, .1, .68], [0, .095, .81], [.12, .1, .68]], [.028, .028, .028]), ...eyes([0, .289, .526], .177, .019), membrane("魾前部短基底高背鳍", fin, [[0, .35, .22], [0, .66, .115], [0, .33, -.03]]), membrane("魾后方低长且与尾不连的小脂鳍", fin, [[0, .23, -.54], [0, .32, -.67], [0, .19, -.88]]), membrane("魾尾前下方短臀鳍", fin, [[0, .09, -.61], [0, .005, -.73], [0, .095, -.91]]), ...tail([0, .12, -1.01], .24, true)];
  const granules: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(membrane("魾用于贴近急流底面的宽而低胸鳍", fin, [[side * .19, .16, .29], [side * .52, .06, .13], [side * .46, .035, -.14], [side * .22, .1, .01]]), tapered("魾宽胸鳍前缘粗硬的支撑棘", fin, [[side * .19, .16, .29], [side * .52, .06, .13]], [.017, .002]), membrane("魾位于短背之后的低短腹鳍", fin, [[side * .1, .08, -.32], [side * .29, .025, -.48], [side * .14, .04, -.59]]), tapered("魾带宽扁基部而较短的上颌须", pale, [[side * .16, .155, .65], [side * .34, .13, .69], [side * .49, .085, .51]], [.017, .01, .0005]), tapered("魾鼻前较短的鼻须", pale, [[side * .068, .23, .72], [side * .115, .27, .81]], [.004, .0004]));
    for (const rear of [false, true]) parts.push(tapered("魾两对下颏感觉须", pale, [[side * (rear ? .07 : .035), .1, .74], [side * (rear ? .23 : .16), .04, .78 - (rear ? .18 : .03)]], [.0035, .0004]));
    for (let i = 0; i < 6; i++) parts.push(tapered("魾宽口前部相互留隙的大尖牙", pale, [[side * (.027 + i * .016), .148, .79 - i * .012], [side * (.027 + i * .016), .105, .79 - i * .012]], [.0045, .0003]));
  }
  for (let i = 0; i < 34; i++) granules.push(lobe("魾头顶不连成甲壳的粗糙皮结节", fin, [Math.sin(i * 2.4) * .19, .289 + i % 3 * .004, .37 + Math.cos(i * 2.4) * .2], [.024, .013, .027]));
  parts.push(combineMeshes("魾宽头顶部的独立粗皮结节", fin, granules)); return parts;
}

// https://thbif.onep.go.th/taxons/taxon_detail/Pangasius%20sanitwongsei
function giantPangasius(): ModelPart[] {
  const parts: ModelPart[] = [body("长丝巨鲶宽大头后接高而侧扁的强壮躯体", [[.83, .43, .1, .05], [.6, .45, .21, .1], [.35, .42, .25, .25], [-.39, .33, .19, .26], [-.93, .2, .034, .062]], skin), lobe("长丝巨鲶低而宽阔的上头颅", skin, [0, .43, .68], [.49, .18, .54]), lobe("长丝巨鲶下方真正承接新月牙带的薄口顶", fin, [0, .34, .745], [.28, .04, .25]), tapered("长丝巨鲶宽口上缘", fin, [[-.11, .34, .8], [0, .33, .94], [.11, .34, .8]], [.025, .025, .025]), tapered("长丝巨鲶宽口下缘", skin, [[-.11, .275, .8], [0, .27, .95], [.11, .275, .8]], [.028, .028, .028]), ...eyes([0, .465, .68], .176, .026), membrane("长丝巨鲶带长延伸鳍条的高背鳍", fin, [[0, .65, .35], [0, .99, .25], [0, .8, .09], [0, .61, -.04]]), tapered("背鳍第一软条之外真实细长的末端丝", fin, [[0, .96, .25], [0, 1.42, .13], [0, 1.58, -.16]], [.009, .005, .0005]), membrane("长丝巨鲶背后独立的小脂鳍", fin, [[0, .38, -.54], [0, .48, -.65], [0, .31, -.8]]), membrane("长丝巨鲶腹后基底较长的臀鳍", fin, [[0, .13, -.18], [0, -.035, -.29], [0, -.02, -.65], [0, .15, -.85]]), ...tail([0, .2, -.96], .34, true)];
  for (const side of [-1, 1]) {
    parts.push(membrane("长丝巨鲶胸鳍的宽三角基面", fin, [[side * .17, .26, .45], [side * .45, .13, .2], [side * .32, .12, -.01], [side * .14, .23, .21]]), tapered("胸鳍第一软鳍条延长成独立长丝", fin, [[side * .43, .135, .22], [side * .61, .08, -.1], [side * .63, .045, -.53]], [.007, .004, .0004]), membrane("长丝巨鲶腹部的短三角鳍基", fin, [[side * .13, .13, -.2], [side * .32, .025, -.36], [side * .17, .05, -.52]]), tapered("腹鳍第一软鳍条同样向后延长成丝", fin, [[side * .3, .03, -.35], [side * .43, .015, -.65], [side * .41, .02, -.95]], [.005, .003, .0004]), tapered("长丝巨鲶仍然存在的上颌感觉须", pale, [[side * .1, .31, .86], [side * .28, .21, .84], [side * .36, .17, .63]], [.006, .0035, .0004]), tapered("长丝巨鲶下颏较短的一对须", pale, [[side * .05, .267, .87], [side * .13, .18, .8]], [.0035, .0004]));
  }
  const teeth: ModelPart[] = [];
  for (let row = 0; row < 2; row++) for (let i = 0; i < 22; i++) { const a = .1 + i / 21 * (Math.PI - .2), r = .115 + row * .012; teeth.push(tapered("长丝巨鲶口顶连续新月形牙带内的独立小牙", pale, [[Math.cos(a) * r, .326, .69 + Math.sin(a) * r], [Math.cos(a) * r, .308, .69 + Math.sin(a) * r]], [.0022, .0002])); }
  for (let i = 0; i < teeth.length; i += 27) parts.push(combineMeshes("长丝巨鲶相连成新月范围而非两孤立斑块的口顶牙列", pale, teeth.slice(i, i + 27))); return parts;
}

// https://fishesofaustralia.net.au/home/species/1875
function trumpetfish(): ModelPart[] {
  const parts: ModelPart[] = [body("喇叭鱼较烟管鱼更侧扁且有腹鳍的细长躯体", [[.18, .105, .016, .032], [-.08, .1, .023, .047], [-.31, .09, .012, .025]], skin), tapered("喇叭鱼前方长而末端略外扩的管吻", skin, [[0, .105, .16], [0, .104, .34], [0, .101, .44]], [.014, .01, .012]), frontCup("管吻末端具有真实小腔的张口缘", pale, [0, .101, .432], .011, .012), tapered("喇叭鱼下颏唯一的短肉须", fin, [[0, .09, .432], [0, .067, .441]], [.002, .0004]), ...eyes([0, .129, .16], .013, .012), membrane("喇叭鱼尾前的小软背鳍", fin, [[0, .13, -.21], [0, .19, -.25], [0, .11, -.32]]), membrane("喇叭鱼与软背相对的短臀鳍", fin, [[0, .06, -.22], [0, .008, -.27], [0, .07, -.33]]), membrane("喇叭鱼没有长尾丝的小圆截尾", fin, [[0, .105, -.31], [0, .145, -.37], [0, .12, -.42], [0, .055, -.42], [0, .034, -.37], [0, .075, -.31]])];
  for (let i = 0; i < 10; i++) parts.push(tapered("喇叭鱼第一背鳍确实分离的十根短棘", pale, [[0, .14, .08 - i * .027], [0, .184 - i * .002, .08 - i * .027]], [.0024, .0003]));
  pectorals(parts, [0, .09, .125], .058, -.004);
  for (const side of [-1, 1]) parts.push(membrane("喇叭鱼躯体中部成对的小腹鳍", fin, [[side * .012, .06, -.075], [side * .05, .023, -.14], [side * .014, .048, -.17]]));
  return parts;
}

export const aquaticExpansionBatchElevenDesigns: MasterNatureDesign[] = [
  design("longnoseLancetfish", "帆蜥鱼", "动物", longnoseLancetfish, ["Alepisaurus ferox", "长躯大帆与前腭獠牙及独立脂鳍"]),
  design("largeheadHairtail", "带鱼", "动物", largeheadHairtail, ["Trichiurus lepturus", "毛状无鳍尾无腹鳍与长背鳍及长牙口"]),
  design("blackDrum", "黑鼓鱼", "动物", blackDrum, ["Pogonias cromis", "高拱背下位口及多对短颏须"]),
  design("tambaqui", "大盖巨脂鲤", "动物", tambaqui, ["Colossoma macropomum", "深侧扁躯多行低磨牙与鳃盖肉瓣"]),
  design("sandTigerShark", "锥齿鲨", "动物", sandTigerShark, ["Carcharias taurus", "近等双背和臀鳍及带双侧小尖的长针牙"]),
  design("goonch", "魾", "动物", goonch, ["Bagarius bagarius", "Bagarius yarrelli为旧异名不另计", "扁大粗皮头宽低胸鳍及宽基上颌须"]),
  design("giantPangasius", "长丝巨鲶", "动物", giantPangasius, ["Pangasius sanitwongsei", "背胸腹鳍三处长丝及口顶新月形牙带"]),
  design("trumpetfish", "喇叭鱼（Aulostomus chinensis）", "动物", trumpetfish, ["Aulostomus chinensis", "分离短背棘单颏须及不具尾丝的小圆尾"]),
];
