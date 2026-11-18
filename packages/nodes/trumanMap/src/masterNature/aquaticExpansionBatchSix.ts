import { combineMeshes, design, eyes, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { convexValve } from "./bivalveArchitectures";

const skin = "#a2af99";
const armor = "#bec4a7";
const pale = "#d7d0b4";
const dark = "#7c8b72";

// https://zenodo.org/records/17823902
function psephoderma(): ModelPart[] {
  const main = convexValve("楯龟龙覆盖胸腹的宽圆前段骨甲", [[-.27, .2], [-.35, .04], [-.31, -.2], [-.14, -.32], [.14, -.32], [.31, -.2], [.35, .04], [.27, .2]], .13, .022); main.position.y = .18;
  const rear = convexValve("与大甲真正分开的较小骨盆甲", [[-.13, .11], [-.19, 0], [-.13, -.16], [.13, -.16], [.19, 0], [.13, .11]], .085, .018); rear.position = { x: 0, y: .14, z: -.49 };
  const parts: ModelPart[] = [lobe("双甲下相连的低矮软躯", skin, [0, .16, -.13], [.53, .23, .87]), main, rear, tapered("楯龟龙甲前较细的伸出颈", skin, [[0, .19, .23], [0, .17, .44]], [.07, .045]), tapered("楯龟龙向前伸出的极长无齿细吻", skin, [[0, .185, .43], [0, .17, .7], [0, .155, .83]], [.055, .022, .006]), lobe("长吻后方的小头颅", skin, [0, .19, .43], [.13, .1, .21]), ...eyes([0, .225, .47], .045, .019), tapered("小骨盆甲后细长如鞭的尾", skin, [[0, .14, -.6], [.035, .11, -.94], [.08, .08, -1.2]], [.056, .029, .002])];
  for (const side of [-1, 1]) for (const rearLeg of [false, true]) { const z = rearLeg ? -.48 : .2; parts.push(tapered("楯龟龙从甲缘外展的短粗肢", skin, [[side * .21, .15, z], [side * .4, .08, z - .06], [side * .38, .035, z + .03]], [.051, .035, .02]), membrane("甲缘外侧短肢末端的宽泳足", skin, [[side * .38, .035, z + .03], [side * .51, .02, z + .07], [side * .52, .018, z + .19], [side * .35, .025, z + .16]])); }
  return parts;
}

function placochelys(): ModelPart[] {
  const shell = convexValve("豆齿龙前宽后收而呈心形的连续背甲", [[-.08, .37], [-.23, .34], [-.32, .18], [-.3, -.12], [-.16, -.33], [0, -.43], [.16, -.33], [.3, -.12], [.32, .18], [.23, .34], [.08, .37], [0, .3]], .17, .025); shell.position.y = .17;
  const parts: ModelPart[] = [lobe("豆齿龙背甲下方较短宽的躯体", skin, [0, .16, -.02], [.52, .23, .65]), shell, tapered("短颈末端向前收窄的无齿喙", skin, [[0, .19, .3], [0, .2, .52], [0, .18, .66]], [.08, .072, .012]), lobe("豆齿龙喙后颞区宽厚的三角头", skin, [0, .22, .48], [.18, .15, .26]), tapered("无齿上喙下方短而深的下颌", armor, [[0, .12, .48], [0, .13, .65]], [.057, .009]), ...eyes([0, .27, .49], .063, .021), tapered("豆齿龙短厚尾", skin, [[0, .16, -.36], [0, .09, -.68]], [.064, .005])];
  for (const side of [-1, 1]) for (const rearLeg of [false, true]) { const z = rearLeg ? -.24 : .2; parts.push(tapered("从心形背甲边缘伸出的外展肢", skin, [[side * .2, .14, z], [side * .39, .075, z - .045]], [.047, .035]), membrane("豆齿龙宽短而有独立末趾轮廓的泳足", skin, [[side * .39, .075, z - .045], [side * .53, .032, z - .01], [side * .54, .024, z + .13], [side * .45, .023, z + .17], [side * .35, .055, z + .08]])); }
  const knobs: ModelPart[] = []; for (let i = 0; i < 30; i++) { const a = i * 2.4, r = Math.sqrt((i + .5) / 30); knobs.push(lobe("豆齿龙甲面粗突的独立骨瘤", armor, [Math.cos(a) * r * .25, .34 - r * r * .145, Math.sin(a) * r * .31], [.048, .037, .046])); }
  for (let i = 0; i < knobs.length; i += 25) parts.push(combineMeshes("心形甲面的完整粗粒骨板", armor, knobs.slice(i, i + 25))); return parts;
}

// https://www.tandfonline.com/doi/abs/10.1080/14772019.2026.2672998
function thalattosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("海龙较短颈后接长而侧扁的胸腹", [[.62, .34, .1, .1], [.16, .32, .19, .22], [-.58, .25, .14, .16], [-.92, .2, .065, .09]], skin), lobe("海龙眼后区厚而前颌渐窄的颅", skin, [0, .41, .75], [.23, .21, .37]), tapered("海龙前颌骨实际向下弯曲的尖端", armor, [[0, .43, .86], [0, .4, 1.05], [0, .285, 1.15]], [.065, .036, .007]), tapered("与下弯上吻相对的深下颌", skin, [[0, .29, .75], [0, .26, 1.04]], [.065, .02]), ...eyes([0, .49, .78], .083, .029), tapered("海龙显著长而侧扁的推进尾", skin, [[0, .21, -.8], [.03, .17, -1.43], [.09, .1, -2.05]], [.075, .043, .004])];
  for (const side of [-1, 1]) for (const rearLeg of [false, true]) { const z = rearLeg ? -.58 : .32; parts.push(tapered("海龙向外伸而保留关节弯曲的鳍肢", skin, [[side * .13, .25, z], [side * .36, .12, z - .06], [side * .38, .055, z - .16]], [.065, .043, .026]), membrane("海龙前后鳍肢末端完整的短桨面", armor, [[side * .38, .055, z - .16], [side * .56, .025, z - .21], [side * .54, .018, z - .38], [side * .34, .035, z - .33]])); }
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) parts.push(lobe("深颌后段可辨的钝圆牙冠", pale, [side * .047, .325, .76 + i * .046], [.023, .027, .023])); return parts;
}

// https://anatomypubs.onlinelibrary.wiley.com/doi/10.1002/ar.25442
function mesosaurus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("中龙狭长而不具重甲的低伏躯体", skin, [0, .15, -.1], [.23, .23, .57]), tapered("中龙细长前颈与窄头后部", skin, [[0, .18, .1], [0, .22, .4]], [.058, .035]), tapered("中龙长而极窄的针齿上吻", skin, [[0, .23, .38], [0, .224, .71]], [.031, .011]), tapered("中龙长而近平行的下颌", armor, [[0, .19, .4], [0, .18, .71]], [.025, .009]), ...eyes([0, .25, .395], .023, .014), tapered("中龙占总长一半左右的侧扁长尾", skin, [[0, .13, -.32], [.02, .09, -.71], [.07, .055, -1.12]], [.055, .033, .003])];
  for (const side of [-1, 1]) for (const rearLeg of [false, true]) {
    const z = rearLeg ? -.24 : .1, end: Triple = [side * (rearLeg ? .24 : .19), .025, z - .05]; parts.push(tapered("中龙外展的前后短肢", skin, [[side * .08, .12, z], [side * .2, .065, z - .03], end], [rearLeg ? .031 : .023, .019, .012]));
    if (rearLeg) parts.push(membrane("中龙较前足更宽大的后足泳蹼", armor, [[end[0] - .055, .025, z - .07], [end[0] + .055, .025, z - .07], [end[0] + .062, .015, z + .11], [end[0] - .062, .015, z + .11]]));
    for (let toe = 0; toe < 5; toe++) parts.push(tapered("中龙足末端分离可见的五趾", skin, [end, [end[0] + (toe - 2) * (rearLeg ? .026 : .017), .016, z + (rearLeg ? .11 : .06)]], [.006, .0012]));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (const upper of [false, true]) for (let i = 0; i < 16; i++) { const z = .43 + i * .017, x = side * (.023 - i * .0007); teeth.push(tapered("中龙长吻内交错成笼的细针状牙", pale, [[x, upper ? .218 : .19, z], [x, upper ? .183 : .22, z + .001]], [.0021, .0002])); }
  for (let i = 0; i < teeth.length; i += 16) parts.push(combineMeshes("中龙上下吻完整而相互留隙的长针齿列", pale, teeth.slice(i, i + 16))); return parts;
}

// https://iris.uniroma1.it/retrieve/ab399a2f-e57e-421d-b52c-b0ae4ca92c4f/Bindellini_First_2022.pdf
function helveticosaurus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("瑞士龙粗而深的长肋躯干", skin, [0, .4, -.18], [.63, .67, 1.16]), tapered("短而深的前颈", skin, [[0, .47, .26], [0, .52, .66]], [.18, .16]), body("瑞士龙短深而前缘陡直的箱状颅", [[.98, .54, .075, .11], [.79, .57, .17, .19], [.57, .52, .14, .14]], skin), tapered("短颅下的强壮下颌", armor, [[0, .34, .67], [0, .33, 1.02]], [.11, .056]), tapered("瑞士龙后部侧扁的长推进尾", skin, [[0, .34, -.67], [.04, .2, -1.28], [.1, .12, -1.81]], [.12, .076, .005]), ...eyes([0, .69, .76], .112, .031)];
  for (const side of [-1, 1]) {
    parts.push(tapered("瑞士龙特别粗壮而较长的前鳍肢", skin, [[side * .19, .37, .27], [side * .47, .2, .25], [side * .58, .085, .04]], [.11, .075, .037]), membrane("前肢末端宽而非水翼形的桨面", armor, [[side * .58, .085, .04], [side * .76, .045, -.1], [side * .71, .025, -.3], [side * .51, .055, -.22]]), tapered("瑞士龙较短的后鳍肢", skin, [[side * .18, .25, -.49], [side * .42, .1, -.64], [side * .44, .04, -.8]], [.075, .043, .023]));
    for (let i = 0; i < 5; i++) parts.push(tapered("短深颌前部的长尖锥牙", pale, [[side * .073, .47, .73 + i * .051], [side * .073, .34, .735 + i * .051]], [.017, .0007]));
  }
  return parts;
}

function tiktaalik(): ModelPart[] {
  const head = convexValve("提塔利克无侧面鳃盖的宽扁颅顶", [[-.06, .52], [-.2, .47], [-.31, .21], [-.27, -.12], [.27, -.12], [.31, .21], [.2, .47], [.06, .52]], .09, .035); head.position = { x: 0, y: .29, z: .61 }; head.color = skin;
  const parts: ModelPart[] = [body("提塔利克带肉鳍的鱼形胸腹与细长后躯", [[.51, .28, .13, .1], [.12, .26, .25, .18], [-.62, .19, .15, .12], [-1.08, .14, .03, .044]], skin), head, tapered("颅与肩带分离而形成的短活动颈", skin, [[0, .29, .37], [0, .29, .64]], [.13, .12]), ...eyes([0, .395, .77], .105, .033), membrane("提塔利克尾端仍保留的鱼类尾鳍", armor, [[0, .18, -1.04], [0, .34, -1.32], [0, .27, -1.66], [0, .12, -1.48], [0, .055, -1.6], [0, .05, -1.29], [0, .11, -1.04]])];
  for (const side of [-1, 1]) {
    parts.push(tapered("从肩带外伸并有肘样弯曲的肉质前鳍根", skin, [[side * .16, .23, .2], [side * .4, .15, .13], [side * .45, .075, -.06]], [.095, .068, .04]), membrane("腕样关节前仍带鳍条而没有手指的鳍端", armor, [[side * .45, .075, -.06], [side * .65, .04, -.12], [side * .61, .023, -.35], [side * .38, .055, -.27]]), tapered("提塔利克身体后半较小的肉质腹鳍根", skin, [[side * .12, .15, -.61], [side * .29, .07, -.77]], [.05, .024]), membrane("后肉鳍末端的柔鳍条扇", armor, [[side * .29, .07, -.77], [side * .43, .025, -.86], [side * .31, .025, -1.03], [side * .19, .08, -.87]]));
  }
  return parts;
}

// https://www.nature.com/articles/347066a0
function ichthyostega(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鱼石螈厚肋胸部和略抬高的前躯", skin, [0, .3, -.07], [.51, .53, .84]), lobe("鱼石螈背腹压扁的宽颅", skin, [0, .34, .54], [.39, .22, .55]), tapered("鱼石螈颈与肩之间的粗连接", skin, [[0, .32, .23], [0, .34, .48]], [.15, .13]), ...eyes([0, .435, .6], .11, .022), tapered("保留鱼类尾鳍轴的粗长尾", skin, [[0, .22, -.4], [.02, .16, -.83], [.065, .1, -1.16]], [.1, .062, .005]), membrane("鱼石螈尾轴上方实际保留的低尾鳍", armor, [[0, .25, -.51], [.02, .32, -.77], [.065, .21, -1.16], [.065, .1, -1.16], [.02, .2, -.77]])];
  for (const side of [-1, 1]) {
    parts.push(tapered("鱼石螈能撑起前胸的粗壮前臂", skin, [[side * .15, .28, .23], [side * .34, .2, .28], [side * .36, .065, .43]], [.081, .064, .037]), lobe("前指端材料不全而保守保留的宽前掌", armor, [side * .36, .045, .49], [.14, .059, .18]), tapered("鱼石螈粗壮而外展的后腿", skin, [[side * .16, .23, -.32], [side * .38, .12, -.37], [side * .35, .05, -.58]], [.095, .065, .034]));
    for (let toe = 0; toe < 7; toe++) parts.push(tapered("鱼石螈有化石依据的七根后足趾", armor, [[side * .35, .05, -.58], [side * .35 + (toe - 3) * .022, .025, -.78 - Math.sin(toe / 6 * Math.PI) * .04]], [.009, .002]));
  }
  return parts;
}

// https://www.nhm.ac.uk/our-science/services/collections/palaeontology/fossil-amphibians.html
function crassigyrinus(): ModelPart[] {
  const parts: ModelPart[] = [body("粗躯螈前粗后细的厚长水生体", [[.44, .3, .17, .18], [.06, .29, .21, .22], [-.51, .23, .13, .16], [-.9, .16, .055, .08]], skin), body("粗躯螈短吻厚颊的巨大而深高头颅", [[1.12, .4, .054, .084], [.86, .42, .16, .21], [.51, .38, .22, .22], [.3, .3, .15, .16]], skin), tapered("巨大头颅下方独立的强下颌", armor, [[0, .2, .58], [0, .17, 1.13]], [.12, .044]), ...eyes([0, .55, .8], .117, .047), tapered("粗躯螈后端长而侧扁的尾", skin, [[0, .18, -.79], [.03, .12, -1.22], [.08, .07, -1.58]], [.074, .04, .004])];
  for (const side of [-1, 1]) {
    for (const z of [.24, -.57]) parts.push(tapered("相对于巨大躯体极度缩小的短肢", skin, [[side * .14, .21, z], [side * .24, .11, z - .045], [side * .24, .085, z + .045]], [.027, .017, .01]));
    for (let i = 0; i < 8; i++) parts.push(tapered("粗躯螈深口裂内长而弯的獠齿", pale, [[side * (.12 - i * .009), .35, .64 + i * .059], [side * (.105 - i * .008), .2, .66 + i * .059]], [.019, .001]));
  }
  return parts;
}

// https://palass.org/sites/default/files/media/publications/palaeontology/volume_17/vol17_part2_pp253-289.pdf
function mastodonsaurus(): ModelPart[] {
  const outline: [number, number][] = [[-.43, .82], [-.54, 1.1], [-.24, 1.85], [0, 2], [.24, 1.85], [.54, 1.1], [.43, .82]], holes = [-1, 1].map(side => Array.from({ length: 12 }, (_, i): [number, number] => [side * .12 + Math.cos(i * Math.PI / 6) * .043, 1.78 + Math.sin(i * Math.PI / 6) * .043]));
  const parts: ModelPart[] = [lobe("乳齿螈低伏而宽壮的完整身体", skin, [0, .48, -.23], [1.12, .77, 2.34]), polygon("乳齿螈宽三角颅顶及两枚真正贯穿的獠牙孔", skin, outline, .1, [0, .34, 0], holes), lobe("颅顶后半下方的厚而短颈部", skin, [0, .31, .92], [.7, .22, .54]), polygon("上颅孔下方完整而宽薄的下颌", armor, outline, .065, [0, .21, 0]), ...eyes([0, .482, 1.17], .21, .077), tapered("乳齿螈向后延伸的侧扁长尾", skin, [[0, .39, -1.16], [.08, .27, -2.17], [.19, .16, -3.03]], [.19, .11, .008])];
  for (const side of [-1, 1]) {
    parts.push(tapered("从下颌向上穿过颅顶真孔的大獠牙", pale, [[side * .12, .265, 1.78], [side * .12, .57, 1.78]], [.031, .002]));
    for (const z of [.45, -.94]) { parts.push(tapered("乳齿螈身体两侧的外展短承重肢", skin, [[side * .37, .36, z], [side * .73, .19, z - .08], [side * .72, .075, z + .12]], [.1, .075, .04])); for (let toe = 0; toe < 4; toe++) parts.push(tapered("短足末端张开的分离趾", armor, [[side * .72, .075, z + .12], [side * .72 + (toe - 1.5) * .045, .04, z + .3]], [.016, .003])); }
  }
  return parts;
}

// https://www.museum.qld.gov.au/assets/media/project/qm/qm-website/collections-and-research/memoirs/nature-memoirs/nature-volume-50/mqm-n50-1-10-sachs.pdf
function aristonectes(): ModelPart[] {
  const parts: ModelPart[] = [body("极泳龙宽厚胸腹与短尾前的渐收躯", [[1.24, 1.01, .45, .43], [.18, .93, .78, .72], [-1.2, .7, .55, .48], [-1.88, .49, .14, .18]], skin), tapered("极泳龙粗长而渐向前收细的直颈", skin, [[0, 1.05, 1.11], [0, 1.21, 2.42], [0, 1.3, 3.55]], [.35, .23, .18]), body("极泳龙低而横宽的卵尖形头颅", [[4.32, 1.32, .09, .07], [4.02, 1.36, .34, .17], [3.61, 1.34, .31, .18], [3.4, 1.3, .16, .13]], skin), tapered("宽低头颅下短而高的下颌", armor, [[0, 1.11, 3.64], [0, 1.1, 4.15], [0, 1.2, 4.36]], [.23, .2, .055]), ...eyes([0, 1.47, 3.76], .22, .052), tapered("极泳龙短而不形成鲸尾的锥尾", skin, [[0, .5, -1.72], [0, .38, -2.7]], [.19, .008])];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -1.02 : .94, span = rear ? 2.1 : 1.85; parts.push(membrane("极泳龙各自连接肩或骨盆的完整长桨肢", armor, [[side * .49, .67, z + .22], [side * 1.14, .42, z + .1], [side * span, .17, z - .65], [side * (span - .2), .15, z - .95], [side * .92, .39, z - .58], [side * .44, .62, z - .17]])); }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (const upper of [false, true]) for (let i = 0; i < 28; i++) { const t = i / 27, x = side * (.255 - t * .17), z = 3.62 + t * .69; teeth.push(tapered("极泳龙口缘密集并朝外倾斜的针状小齿", pale, [[x, upper ? 1.29 : 1.17, z], [x + side * .025, upper ? 1.17 : 1.29, z + .004]], [.006, .0005])); }
  for (let i = 0; i < teeth.length; i += 18) parts.push(combineMeshes("低宽头颅两颌完整的密针齿筛", pale, teeth.slice(i, i + 18))); return parts;
}

export const aquaticExpansionBatchSixDesigns: MasterNatureDesign[] = [
  design("psephoderma", "楯龟龙（Psephoderma）", "动物", psephoderma, ["Psephoderma alpinum", "古海生爬行动物形态复原", "前后分离的双骨甲长细吻与鞭尾"]),
  design("placochelys", "豆齿龙（Placochelys）", "动物", placochelys, ["Placochelys placodonta", "古海生爬行动物形态复原", "心形粗突背甲无齿短喙与短尾泳足"]),
  design("thalattosaurus", "海龙（Thalattosaurus）", "动物", thalattosaurus, ["Thalattosaurus alexandrae", "古海生爬行动物形态复原", "下弯上吻深颌与长侧扁尾及四短桨肢"]),
  design("mesosaurus", "中龙", "动物", mesosaurus, ["Mesosaurus tenuidens", "古水生爬行动物形态复原", "窄长针齿吻大后蹼足和长侧扁尾"]),
  design("helveticosaurus", "瑞士龙", "动物", helveticosaurus, ["Helveticosaurus zollingeri", "古海生爬行动物形态复原", "短深颅粗躯与发达的桨状前肢"]),
  design("tiktaalik", "提塔利克", "动物", tiktaalik, ["Tiktaalik roseae", "古四足形类复原", "扁颅活动颈与有腕样弯曲但无手指的肉鳍"]),
  design("ichthyostega", "鱼石螈", "动物", ichthyostega, ["Ichthyostega", "古四足形类复原", "厚肋胸粗前臂尾鳍与七趾后足"]),
  design("crassigyrinus", "粗躯螈", "动物", crassigyrinus, ["Crassigyrinus scoticus", "古两栖类形态复原", "巨大深颅长粗躯与极小四肢"]),
  design("mastodonsaurus", "乳齿螈", "动物", mastodonsaurus, ["Mastodonsaurus giganteus", "古两栖类形态复原", "宽三角颅与穿过真颅孔的下颌大獠牙"]),
  design("aristonectes", "极泳龙", "动物", aristonectes, ["Aristonectes parvidens", "古海生爬行动物形态复原", "低宽头颅密针齿筛与四长桨肢"]),
];
