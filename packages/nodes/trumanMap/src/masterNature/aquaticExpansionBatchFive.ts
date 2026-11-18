import { combineMeshes, design, eyes, frontCup, lobe, part, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";
import { body, pectorals, ribbon } from "./fishForms";
import { tail } from "./marine";

const skin = "#9cae9e";
const fin = "#bcc7ad";
const pale = "#d0d0b6";
const dark = "#738b78";

// https://www.fisheries.noaa.gov/species/atlantic-cod
function atlanticCod(): ModelPart[] {
  const parts: ModelPart[] = [body("大西洋鳕头宽尾细的高前躯", [[.4, .21, .028, .034], [.24, .24, .072, .1], [-.03, .2, .086, .13], [-.36, .14, .045, .075], [-.51, .1, .012, .025]], skin), ...eyes([0, .28, .25], .052, .025), tapered("鳕鱼超过下颌的厚上唇", fin, [[0, .185, .31], [0, .185, .44]], [.034, .019]), tapered("下颏唯一向下弯曲的短须", pale, [[0, .16, .365], [0, .105, .4], [0, .078, .39]], [.0045, .003, .0007]), membrane("鳕鱼前段独立的第一背鳍", fin, [[0, .31, .16], [0, .43, .1], [0, .31, -.015]]), membrane("鳕鱼单独的第二背鳍", fin, [[0, .285, -.05], [0, .37, -.15], [0, .27, -.27]]), membrane("鳕鱼尾前独立第三背鳍", fin, [[0, .19, -.32], [0, .26, -.39], [0, .13, -.49]]), ribbon("鳕鱼独立第一臀鳍", -.06, -.25, .084, -.045), ribbon("鳕鱼独立第二臀鳍", -.3, -.47, .066, -.034), membrane("鳕鱼近截平而略圆的尾鳍", fin, [[0, .12, -.49], [0, .18, -.62], [0, .155, -.7], [0, .04, -.7], [0, .025, -.62], [0, .08, -.49]])];
  for (const side of [-1, 1]) parts.push(membrane("位于胸鳍之前下方的小腹鳍", fin, [[side * .035, .12, .21], [side * .065, .04, .17], [side * .03, .054, .09]]));
  pectorals(parts, [0, .17, .17], .15, -.005); return parts;
}

// https://fieldguide.mt.gov/speciesDetail.aspx?elcode=afcma01010
function burbot(): ModelPart[] {
  const parts: ModelPart[] = [body("江鳕宽扁头部之后圆而细长的躯体", [[.4, .16, .055, .035], [.22, .16, .087, .068], [-.05, .14, .073, .075], [-.37, .095, .04, .052], [-.56, .069, .009, .023]], skin), ...eyes([0, .2, .28], .055, .021), tapered("江鳕下颏正中的单一长须", pale, [[0, .11, .35], [0, .05, .4]], [.005, .0008]), membrane("江鳕较短而独立的第一背鳍", fin, [[0, .2, .13], [0, .29, .045], [0, .2, -.045]]), membrane("江鳕延长到尾根的低第二背鳍", fin, [[0, .2, -.1], [0, .235, -.2], [0, .185, -.4], [0, .11, -.55], [0, .09, -.52], [0, .15, -.26]]), ribbon("江鳕尾躯下方的长低臀鳍", -.12, -.54, .058, -.028), membrane("江鳕与背臀鳍分开的圆尾", fin, [[0, .09, -.54], [0, .135, -.66], [0, .09, -.74], [0, .032, -.695], [0, .041, -.54]])];
  for (const side of [-1, 1]) parts.push(tapered("江鳕头下胸前的细尖腹鳍", fin, [[side * .024, .101, .21], [side * .06, .038, .16]], [.009, .001]));
  pectorals(parts, [0, .13, .18], .17, -.01); return parts;
}

// https://saiab.ac.za/wp-content/uploads/2022/11/1._wiof_volume_2_text.pdf
function kingklip(): ModelPart[] {
  const parts: ModelPart[] = [body("南非须鳚粗钝前体至侧扁尖尾的长躯", [[.58, .21, .052, .046], [.34, .23, .093, .13], [-.16, .19, .08, .11], [-.62, .11, .036, .066], [-.91, .069, .004, .015]], skin), ...eyes([0, .285, .37], .066, .026), tapered("略向前突出的须鳚上颌", pale, [[0, .18, .43], [0, .18, .63]], [.043, .027]), membrane("从头后延到尖尾且与尾鳍连续的背鳍褶", fin, [[0, .29, .25], [0, .38, .15], [0, .32, -.2], [0, .2, -.64], [0, .075, -.98], [0, .065, -.91], [0, .15, -.61], [0, .25, -.2]]), membrane("腹后连续并汇入尾端的臀鳍褶", fin, [[0, .09, .02], [0, .025, -.1], [0, .018, -.6], [0, .075, -.98], [0, .065, -.91], [0, .065, -.61]])];
  for (const side of [-1, 1]) for (const ray of [-1, 1]) parts.push(tapered("眼下前腹位置分离成细感觉丝的腹鳍条", pale, [[side * .018, .14, .37], [side * (.04 + ray * .01), .038, .19], [side * (.06 + ray * .012), .018, .035]], [.003, .0016, .0004]));
  pectorals(parts, [0, .18, .23], .18, -.006); return parts;
}

// https://biogeodb.stri.si.edu/sftep/en/thefishes/taxon/2553
function nurseShark(): ModelPart[] {
  const parts: ModelPart[] = [body("护士鲨扁宽钝头和粗长底栖躯", [[.98, .23, .13, .075], [.58, .26, .21, .14], [-.15, .25, .22, .2], [-.84, .19, .11, .12], [-1.19, .14, .03, .055]], skin), ...eyes([0, .32, .72], .135, .027), membrane("护士鲨位于身体后半的圆第一背鳍", fin, [[0, .4, -.23], [0, .67, -.31], [0, .7, -.46], [0, .57, -.6], [0, .3, -.61]]), membrane("距离首背不远且近等大的圆第二背鳍", fin, [[0, .25, -.79], [0, .46, -.89], [0, .47, -1.01], [0, .31, -1.11], [0, .2, -1.08]]), membrane("几乎没有下叶的低长尾鳍", fin, [[0, .17, -1.15], [0, .29, -1.39], [0, .37, -1.77], [0, .21, -1.63], [0, .075, -1.31], [0, .11, -1.18]]), ribbon("护士鲨尾前实际存在的短臀鳍", -.88, -1.12, .085, -.065)];
  for (const side of [-1, 1]) {
    parts.push(tapered("吻端下方成对下垂的长鼻须", pale, [[side * .047, .175, .91], [side * .06, .085, .96], [side * .08, .065, .91]], [.007, .004, .0007]), membrane("护士鲨宽而圆收的胸鳍", fin, [[side * .16, .16, .53], [side * .51, .085, .19], [side * .47, .055, -.09], [side * .2, .12, .035]]), membrane("护士鲨后腹部成对的小腹鳍", fin, [[side * .085, .13, -.61], [side * .24, .06, -.74], [side * .19, .055, -.88], [side * .06, .11, -.73]]));
    for (let i = 0; i < 5; i++) parts.push(tapered("头后体侧可辨的五道短鳃缘", dark, [[side * .19, .3, .55 - i * .055], [side * .2, .17, .56 - i * .055]], [.004, .004]));
  }
  return parts;
}

// https://repository.library.noaa.gov/view/noaa/8714/noaa_8714_DS1.pdf
function greenlandShark(): ModelPart[] {
  const parts: ModelPart[] = [body("格陵兰睡鲨圆钝小眼头和粗厚长躯", [[1.6, .52, .1, .12], [1.08, .55, .28, .29], [.05, .5, .36, .4], [-1.05, .35, .22, .27], [-1.75, .23, .05, .09]], skin), ...eyes([0, .66, 1.2], .197, .034), tapered("睡鲨短宽下颌留出的低口缝", fin, [[0, .35, 1.05], [0, .32, 1.66]], [.15, .07]), membrane("睡鲨中背较小且无棘的第一背鳍", fin, [[0, .72, -.08], [0, .95, -.25], [0, .9, -.43], [0, .56, -.57]]), membrane("睡鲨尾前近等大的第二背鳍", fin, [[0, .45, -1.13], [0, .66, -1.28], [0, .6, -1.44], [0, .31, -1.54]]), membrane("睡鲨上叶较长而钝收的尾鳍", fin, [[0, .26, -1.69], [0, .66, -2.06], [0, .68, -2.36], [0, .33, -2.17], [0, .15, -1.84]]), membrane("睡鲨尾鳍较低而短的下叶", fin, [[0, .2, -1.73], [0, .04, -1.98], [0, .1, -2.08], [0, .24, -1.9]])];
  for (const side of [-1, 1]) {
    parts.push(membrane("睡鲨相对躯体较小的圆胸鳍", fin, [[side * .24, .35, .86], [side * .69, .15, .51], [side * .66, .12, .19], [side * .25, .27, .44]]), membrane("没有相对臀鳍的独立小腹鳍", fin, [[side * .15, .22, -.92], [side * .43, .075, -1.11], [side * .29, .075, -1.32], [side * .13, .2, -1.12]]));
    for (let i = 0; i < 5; i++) parts.push(tapered("睡鲨头后体侧短鳃缘", dark, [[side * .28, .62, .86 - i * .087], [side * .3, .36, .87 - i * .087]], [.006, .006]));
  }
  const lower: ModelPart[] = [];
  for (let i = 0; i < 15; i++) lower.push(part("睡鲨下颌相连成切割刃的倾斜扁牙", "extrude", pale, [-.11 + i * .015, .37, 1.52], [1, 1, 1], [0, 0, 0], { depth: .012, profile: [{ x: -.011, y: 0 }, { x: .011, y: 0 }, { x: .014, y: .043 }, { x: .002, y: .032 }] }));
  parts.push(...lower); return parts;
}

// https://www.dfo-mpo.gc.ca/species-especes/profiles-profils/sixgillshark-requingriset-eng.html
function bluntnoseSixgill(): ModelPart[] {
  const parts: ModelPart[] = [body("六鳃鲨宽钝头后接厚长圆躯", [[1.45, .53, .15, .11], [.94, .57, .3, .3], [-.1, .5, .34, .37], [-1.19, .31, .19, .23], [-1.71, .21, .043, .08]], skin), ...eyes([0, .71, 1.09], .215, .05), membrane("六鳃鲨位于很后方的唯一背鳍", fin, [[0, .46, -.96], [0, .94, -1.14], [0, .87, -1.39], [0, .3, -1.51]]), membrane("六鳃鲨细长而上挑的上尾叶", fin, [[0, .23, -1.63], [0, .63, -2.11], [0, .71, -2.61], [0, .5, -2.49], [0, .11, -1.87]]), membrane("六鳃鲨较小的下尾叶", fin, [[0, .19, -1.69], [0, -.09, -1.96], [0, -.11, -2.14], [0, .15, -1.95]]), ribbon("六鳃鲨尾前的实际臀鳍", -1.24, -1.58, .12, -.1)];
  for (const side of [-1, 1]) {
    parts.push(membrane("六鳃鲨前部宽大后收的胸鳍", fin, [[side * .24, .36, .64], [side * .87, .12, .14], [side * .68, .08, -.12], [side * .22, .26, .16]]), membrane("单一背鳍前方的成对腹鳍", fin, [[side * .17, .25, -.7], [side * .49, .085, -.93], [side * .35, .075, -1.15], [side * .13, .2, -.93]]));
    for (let i = 0; i < 6; i++) parts.push(tapered("六鳃鲨每侧确切六道长鳃缘", dark, [[side * .284, .65, .91 - i * .092], [side * .31, .31, .92 - i * .092]], [.006, .006]));
  }
  return parts;
}

// https://australian.museum/learn/animals/fishes/shark-ray-rhina-ancylostoma-bloch-schneider-1801/
function bowmouthGuitarfish(): ModelPart[] {
  const parts: ModelPart[] = [body("圆犁头鳐头后强壮隆起并向后收窄的鲨形躯", [[.77, .34, .33, .1], [.22, .35, .38, .23], [-.62, .27, .19, .18], [-1.12, .19, .039, .066]], skin), polygon("前缘真正钝圆的宽弓形吻盘", skin, [[-.28, .47], [-.48, .7], [-.4, .96], [-.22, 1.14], [0, 1.2], [.22, 1.14], [.4, .96], [.48, .7], [.28, .47]], .14, [0, .19, 0]), ...eyes([0, .41, .78], .236, .041), membrane("圆犁头鳐高而直立的第一背鳍", fin, [[0, .53, -.04], [0, .94, -.27], [0, .76, -.47], [0, .31, -.44]]), membrane("圆犁头鳐尾前独立第二背鳍", fin, [[0, .3, -.74], [0, .65, -.91], [0, .54, -1.08], [0, .2, -1.07]]), ...tail([0, .19, -1.16], .3, true)];
  for (const side of [-1, 1]) parts.push(membrane("头盘后方与头部界线明确的独立大胸鳍", fin, [[side * .31, .24, .65], [side * .75, .13, .31], [side * .69, .09, -.04], [side * .3, .18, .06]]), membrane("圆犁头鳐向后外方伸出的腹鳍", fin, [[side * .17, .18, -.53], [side * .45, .065, -.74], [side * .3, .06, -.94], [side * .13, .15, -.73]]));
  const thorns: ModelPart[] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) thorns.push(tapered("眼上方粗厚皮脊上的独立大棘", pale, [[side * .22, .41, .63 + i * .043], [side * .245, .49, .62 + i * .043]], [.019, .001]));
    for (let i = 0; i < 5; i++) thorns.push(tapered("肩部角质脊上的真正大棘", pale, [[side * .25, .47, .09 + i * .05], [side * .28, .56, .08 + i * .05]], [.025, .001]));
  }
  for (let i = 0; i < 7; i++) thorns.push(tapered("首背鳍之前正中脊上的大棘", pale, [[0, .55, .05 + i * .054], [0, .64, .04 + i * .054]], [.024, .001]));
  for (let i = 0; i < thorns.length; i += 16) parts.push(combineMeshes("圆犁头鳐眼肩与背中线的独立骨棘", pale, thorns.slice(i, i + 16))); return parts;
}

// https://biogeodb.stri.si.edu/caribbean/en/thefishes/species/2752
function cownoseRay(): ModelPart[] {
  const parts: ModelPart[] = [lobe("牛鼻鲼拱起而相对短的中央体盘", skin, [0, .22, -.03], [.57, .31, .86]), lobe("明显抬高并突出于体盘之前的头部", skin, [0, .3, .43], [.35, .27, .45]), tapered("牛鼻鲼没有尾鳍的细长鞭状尾", dark, [[0, .17, -.38], [.045, .13, -.9], [.13, .08, -1.72]], [.025, .012, .001]), membrane("尾根上方的真正小背鳍", fin, [[0, .24, -.33], [0, .41, -.41], [0, .21, -.53]]), ...eyes([0, .36, .46], .149, .032)];
  for (const side of [-1, 1]) parts.push(membrane("牛鼻鲼外缘尖锐且后缘明显内凹的三角翼", fin, [[side * .19, .25, .31], [side * .81, .22, .07], [side * .98, .13, -.23], [side * .59, .12, -.18], [side * .23, .18, -.45]]), polygon("前端中间保留真实V缺口的双吻叶", skin, [[side * .008, .55], [side * .085, .72], [side * .18, .69], [side * .23, .58], [side * .17, .45], [side * .025, .47]], .065, [0, .17, 0]), tapered("尾根后方贴近尾部的细锯状刺", pale, [[0, .185, -.51], [.015, .19, -.73]], [.007, .0006]));
  return parts;
}

// https://myfwc.com/research/saltwater/sharks-rays/ray-species/spotted-eagle-ray/
function spottedEagleRay(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鹞鲼隆起的前胸和较短中央体盘", skin, [0, .28, -.05], [.77, .39, 1.04]), tapered("鹞鲼延伸到体盘前方的窄头颈", skin, [[0, .32, .29], [0, .34, .77]], [.2, .12]), lobe("头部前端明显外伸的鸭喙形下吻叶", fin, [0, .24, .94], [.26, .12, .36]), ...eyes([0, .41, .68], .121, .039), tapered("鹞鲼极长而无尾鳍的鞭状尾", dark, [[0, .2, -.51], [.08, .15, -1.35], [.25, .085, -2.95]], [.032, .018, .001]), membrane("鹞鲼尾根上方的低小背鳍", fin, [[0, .3, -.45], [0, .48, -.55], [0, .24, -.7]])];
  for (const side of [-1, 1]) parts.push(membrane("鹞鲼高展弦比的长尖角翼", fin, [[side * .23, .31, .38], [side * 1.12, .25, .16], [side * 1.47, .16, -.22], [side * .81, .14, -.3], [side * .33, .21, -.6]]), tapered("鹞鲼尾根背鳍后方的防御尾刺", pale, [[0, .22, -.72], [side * .017, .23, -.99]], [.009, .0007]));
  return parts;
}

// https://www.cephref.org/species/mesonychoteuthis-hamiltoni
// https://tolweb.org/Mesonychoteuthis_hamiltoni/19556
function colossalSquid(): ModelPart[] {
  const parts: ModelPart[] = [body("大王酸浆鱿肥厚而深大的长外套筒", [[1.03, .8, .31, .34], [.36, .81, .51, .59], [-.76, .78, .37, .46], [-1.52, .71, .026, .045]], skin), lobe("外套口前方与十腕连接的粗短头", skin, [0, .72, 1.25], [.63, .58, .73]), ...eyes([0, .75, 1.36], .265, .26), frontCup("头腹下方具有壁厚的实际喷漏斗", pale, [0, .48, 1.06], .09, .27)];
  for (const side of [-1, 1]) parts.push(membrane("外套尾部宽大而圆收的肌肉侧鳍", fin, [[side * .08, .78, -1.4], [side * .64, .77, -1.07], [side * .93, .68, -.53], [side * .75, .61, -.18], [side * .29, .67, -.35]]));
  const hooks: ModelPart[] = [], suckers: ModelPart[] = [];
  for (let arm = 0; arm < 8; arm++) {
    const angle = arm * Math.PI / 4, root: Triple = [Math.cos(angle) * .17, .72 + Math.sin(angle) * .17, 1.48], middle: Triple = [Math.cos(angle) * .39, .72 + Math.sin(angle) * .39, 2.15], end: Triple = [Math.cos(angle) * .48, .72 + Math.sin(angle) * .48, 2.93 - arm % 3 * .09];
    parts.push(tapered("八条各自连接到头部的粗短普通腕", skin, [root, middle, end], [.075, .055, .007]));
    for (let i = 0; i < 5; i++) {
      const t = (i + 1) / 7, radial = .17 + t * .3, z = 1.49 + t * 1.39, x = Math.cos(angle) * (radial - .035), y = .72 + Math.sin(angle) * (radial - .035);
      hooks.push(tapered("普通腕内侧有真实回弯空隙的固定钩", pale, [[x, y, z], [x - Math.cos(angle) * .045, y - Math.sin(angle) * .045, z + .016], [x - Math.cos(angle) * .032, y - Math.sin(angle) * .032, z + .045]], [.009, .006, .0008]));
      if (i % 2) continue;
      const cup = sweptProfile("腕内侧与固定钩交错的凹陷吸盘", fin, [[.012, 0], [.029, .008], [.029, .021], [.021, .021], [.019, .008], [.008, .003]], Math.PI * 2, 8); cup.position = { x, y, z: z + .05 }; cup.rotation.z = angle * 180 / Math.PI + 90; suckers.push(cup);
    }
  }
  for (const side of [-1, 1]) {
    parts.push(tapered("八普通腕之外独立伸长的成对捕食触腕", skin, [[side * .13, .62, 1.5], [side * .45, .55, 2.52], [side * .55, .52, 3.45]], [.033, .026, .019]), lobe("触腕末端膨大的捕食腕穗", skin, [side * .55, .52, 3.63], [.17, .18, .55]));
    for (let i = 0; i < 8; i++) { const z = 3.43 + i * .055; hooks.push(tapered("触腕穗上两列具有回弯形体的旋钩", pale, [[side * (.49 + i % 2 * .08), .46, z], [side * (.46 + i % 2 * .08), .4, z + .015], [side * (.48 + i % 2 * .08), .4, z + .045]], [.012, .008, .001])); }
  }
  for (let i = 0; i < hooks.length; i += 16) parts.push(combineMeshes("十腕内侧完整而独立的真实弯钩组", pale, hooks.slice(i, i + 16)));
  for (let i = 0; i < suckers.length; i += 8) parts.push(combineMeshes("普通腕上保留凹孔的吸盘组", fin, suckers.slice(i, i + 8)));
  return parts;
}

export const aquaticExpansionBatchFiveDesigns: MasterNatureDesign[] = [
  design("atlanticCod", "大西洋鳕", "动物", atlanticCod, ["Gadus morhua", "颏须三枚背鳍两枚臀鳍与近截平尾"]),
  design("burbot", "江鳕", "动物", burbot, ["Lota lota", "扁头颏须与一短一长背鳍及独立圆尾"]),
  design("kingklip", "南非须鳚", "动物", kingklip, ["Genypterus capensis", "眼下腹鳍丝与背臀尾连续鳍褶"]),
  design("nurseShark", "护士鲨", "动物", nurseShark, ["Ginglymostoma cirratum", "扁宽钝头鼻须后移圆背鳍与长上尾叶"]),
  design("greenlandShark", "格陵兰睡鲨", "动物", greenlandShark, ["Somniosus microcephalus", "无臀鳍粗圆躯低双背与下颌切割齿刃"]),
  design("bluntnoseSixgill", "六鳃鲨", "动物", bluntnoseSixgill, ["Hexanchus griseus", "每侧六鳃裂与唯一后移背鳍及大歪尾"]),
  design("bowmouthGuitarfish", "圆犁头鳐", "动物", bowmouthGuitarfish, ["Rhina ancylostoma", "宽弓吻盘高双背与眼肩背中线骨棘"]),
  design("cownoseRay", "牛鼻鲼", "动物", cownoseRay, ["Rhinoptera bonasus", "有真实V缺口的双吻叶与角翼体盘"]),
  design("spottedEagleRay", "鹞鲼", "动物", spottedEagleRay, ["Aetobatus narinari", "外伸鸭喙吻叶尖角翼与鞭尾"]),
  design("colossalSquid", "大王酸浆鱿", "动物", colossalSquid, ["Mesonychoteuthis hamiltoni", "肥大外套八粗短腕双触腕与实际弯钩凹吸盘"]),
];
