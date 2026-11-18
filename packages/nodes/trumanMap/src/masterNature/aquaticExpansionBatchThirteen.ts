import { combineMeshes, design, eyes, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";

const skin = "#a0af99";
const armor = "#bdc4a6";
const fin = "#c4cbb0";
const pale = "#dad1b4";

// https://www.cambridge.org/core/journals/geological-magazine/article/02DC9563ADF2E5C2E6EB11285E6D29EA
function largocephalosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("巨肋龙长而宽扁的闭合肋篮下活体躯干", [[.43, .21, .09, .1], [.13, .2, .19, .14], [-.34, .16, .15, .12], [-.49, .13, .067, .06]], skin), tapered("巨肋龙短粗颈", skin, [[0, .22, .35], [0, .24, .65]], [.076, .043]), lobe("巨肋龙长度约十六厘米的低三角头", skin, [0, .25, .69], [.16, .115, .19]), tapered("巨肋龙前窄后宽的短上吻", skin, [[0, .26, .67], [0, .245, .8]], [.051, .02]), ...eyes([0, .289, .704], .054, .018), tapered("巨肋龙适度延长而后段侧扁的完整尾", skin, [[0, .14, -.43], [.025, .1, -.88], [.09, .04, -1.5]], [.067, .037, .002])];
  const plates: ModelPart[] = [], granules: ModelPart[] = [];
  for (const side of [-1, 1]) for (const rear of [false, true]) {
    const z = rear ? -.31 : .29, wrist: Triple = [side * .35, .045, z - .07]; parts.push(tapered("巨肋龙关节仍清楚的外展短肢", skin, [[side * .12, .17, z], [side * .28, .095, z - .025], wrist], [.041, .031, .02]), membrane("巨肋龙五趾间真正相连的宽游泳蹼", fin, [wrist, [side * .45, .02, z - .02], [side * .47, .014, z + .1], [side * .34, .025, z + .1]]));
    for (let toe = 0; toe < 5; toe++) parts.push(tapered("巨肋龙蹼缘各自连接的五个短趾端", skin, [wrist, [side * .37 + (toe - 2) * .022, .015, z + .08 + Math.sin(toe / 4 * Math.PI) * .04]], [.008, .001]));
  }
  for (const row of [-1, 0, 1]) for (let i = 0; i < 11; i++) plates.push(lobe("巨肋龙正中及左右旁正中互不铺满的较大骨甲", armor, [row * .105, .33 - Math.abs(row) * .02 - i * .008, .33 - i * .066], [.06, .035, .078]));
  for (const side of [-1, 1]) for (let i = 0; i < 28; i++) granules.push(lobe("巨肋龙侧方大甲间的细粒骨甲", armor, [side * (.14 + i % 3 * .014), .25 - i % 3 * .028, .31 - Math.floor(i / 3) * .07], [.013, .009, .019]));
  for (let i = 0; i < plates.length; i += 30) parts.push(combineMeshes("巨肋龙保留软皮间隙而非龟壳的背骨甲", armor, plates.slice(i, i + 30)));
  for (let i = 0; i < granules.length; i += 36) parts.push(combineMeshes("巨肋龙侧方真实独立的小粒骨甲", armor, granules.slice(i, i + 36))); return parts;
}

// https://www.ucdavis.edu/curiosity/news/researchers-describe-new-reptile-platypus-early-triassic-0
function eretmorhipis(): ModelPart[] {
  const parts: ModelPart[] = [body("扇鳍龙坚硬长胸腹与很小的颈", [[.15, .105, .026, .036], [.01, .1, .056, .07], [-.15, .075, .041, .05], [-.21, .06, .02, .025]], skin), tapered("扇鳍龙支撑极小头颅的短颈", skin, [[0, .113, .13], [0, .127, .205]], [.023, .012]), lobe("扇鳍龙小于胸宽的微小后颅", skin, [0, .131, .221], [.035, .029, .045]), polygon("扇鳍龙无齿而扁宽的软骨鸭嘴上吻", fin, [[-.013, .218], [-.022, .247], [-.019, .273], [0, .282], [.019, .273], [.022, .247], [.013, .218]], .004, [0, .127, 0]), polygon("软骨鸭嘴下方独立的薄下吻", skin, [[-.012, .221], [-.019, .249], [-.016, .272], [.016, .272], [.019, .249], [.012, .221]], .003, [0, .119, 0]), ...eyes([0, .142, .223], .012, .0024), tapered("扇鳍龙甲躯之后细长柔性的尾", skin, [[0, .063, -.18], [.012, .045, -.31], [.04, .024, -.46]], [.021, .011, .001])];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -.115 : .1; parts.push(tapered("扇鳍龙宽扇鳍前方的短根", skin, [[side * .035, .075, z], [side * .081, .041, z - .016]], [.018, .012]), membrane("扇鳍龙有明显扇面而不是细杆肢的宽桨足", fin, [[side * .076, .043, z], [side * .14, .016, z + .02], [side * .151, .012, z - .044], [side * .122, .011, z - .09], [side * .068, .033, z - .045]])); }
  for (let i = 0; i < 8; i++) { const p = polygon("扇鳍龙正中独立而宽基突起的背骨板", armor, [[-.015, 0], [.015, 0], [.012, .018], [.003, .039], [-.009, .025]], .017); p.rotation.x = -90; p.position = { x: 0, y: .174 - i * .006, z: .116 - i * .035 }; parts.push(p); }
  // ACT: 鸭嘴骨架有中窗，但活体由软骨填充；不把化石骨窗误做成活体吻部贯孔。
  return parts;
}

// https://www.app.pan.pl/archive/published/app59/app20120045.pdf
function utatsusaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("歌津鱼龙细长且不呈海豚短梭形的主躯", [[.57, .23, .057, .07], [.14, .23, .13, .14], [-.54, .18, .087, .1], [-.91, .125, .033, .05]], skin), lobe("歌津鱼龙较宽的头后区", skin, [0, .25, .67], [.16, .16, .28]), tapered("歌津鱼龙上颌细而呈尖矛状的吻", skin, [[0, .268, .69], [0, .26, .96]], [.035, .007]), tapered("歌津鱼龙与上吻相对的长下颌", fin, [[0, .19, .66], [0, .19, .965]], [.03, .006]), ...eyes([0, .294, .683], .058, .024), tapered("歌津鱼龙弯折很低的鳗形长尾轴", skin, [[0, .13, -.86], [.015, .09, -1.16], [.04, .06, -1.54]], [.035, .022, .002]), membrane("歌津鱼龙尾末段仅略抬起的上鳍缘", fin, [[0, .095, -1.13], [0, .23, -1.35], [0, .14, -1.56], [0, .06, -1.54], [0, .07, -1.21]])];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -.56 : .36; parts.push(tapered("歌津鱼龙前后近等长的短鳍肢近端", skin, [[side * .065, .17, z], [side * .17, .085, z - .025]], [.027, .017]), membrane("歌津鱼龙短且略扇形的无爪桨足", fin, [[side * .16, .09, z], [side * .29, .04, z - .025], [side * .3, .025, z - .13], [side * .2, .035, z - .19], [side * .13, .085, z - .1]])); }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (const upper of [false, true]) for (let i = 0; i < 18; i++) { const t = i / 17, x = side * (.026 - t * .018), z = .715 + t * .229; teeth.push(tapered("歌津鱼龙长颌内细小而近等大的牙", pale, [[x, upper ? .245 : .207, z], [x, upper ? .214 : .236, z + .001]], [.0022, .00015])); }
  for (let i = 0; i < teeth.length; i += 27) parts.push(combineMeshes("歌津鱼龙上下长颌的密集等形细牙", pale, teeth.slice(i, i + 27))); return parts;
}

// https://doi.org/10.1080/02724634.2013.723082
function guanlingsaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("关岭鱼龙很长而低浅的躯体", [[2.05, .68, .11, .13], [1.17, .65, .4, .3], [-1.1, .56, .39, .3], [-2.48, .4, .18, .18], [-3.35, .28, .075, .1]], skin), lobe("关岭鱼龙远小于胸躯且后部较宽的头颅", skin, [0, .72, 2.15], [.42, .28, .57]), body("关岭鱼龙短而完全无齿的三角上吻", [[2.62, .71, .016, .026], [2.37, .74, .11, .065], [2.06, .73, .19, .11]], skin), body("关岭鱼龙极细而不承载牙齿的下颌", [[2.62, .63, .011, .012], [2.3, .62, .08, .026], [2.01, .64, .14, .037]], fin), ...eyes([0, .798, 2.178], .147, .05), tapered("关岭鱼龙不作强烈下弯的低长尾轴", skin, [[0, .3, -3.14], [.04, .22, -4.29], [.1, .12, -5.28]], [.08, .046, .004]), membrane("关岭鱼龙末尾保守复原的小而低尾缘", fin, [[.06, .21, -4.48], [.08, .42, -4.91], [.1, .19, -5.43], [.1, .12, -5.28], [.08, .045, -4.96], [.06, .18, -4.48]])];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -1.95 : 1.37, span = rear ? .88 : 1.35; parts.push(membrane("关岭鱼龙末端宽圆且前长后较短的独立鳍肢", fin, [[side * .27, .47, z], [side * .74, .25, z - .36], [side * span, .12, z - (rear ? .67 : 1.03)], [side * (span - .11), .08, z - (rear ? .87 : 1.2)], [side * .55, .24, z - .56], [side * .24, .43, z - .24]])); }
  // ACT: 不添加缺乏软组织证据的高背鳍，也不把有争议的吸食假说作为确定功能。
  return parts;
}

// https://bspg.snsb.de/fischsaurier/?lang=en
function eurhinosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("鱼鼻龙短厚流线躯体及窄尾柄", [[.79, .57, .14, .15], [.12, .53, .33, .37], [-.94, .38, .19, .24], [-1.5, .25, .045, .09]], skin), lobe("鱼鼻龙长吻后方有明显大眼眶的颅", skin, [0, .64, .94], [.42, .38, .58]), tapered("鱼鼻龙远超过下颌但本身仍具牙的上颌长吻", skin, [[0, .64, 1.05], [0, .62, 1.69], [0, .6, 2.38]], [.089, .044, .006]), body("鱼鼻龙仅到上吻中段的短而细下颌", [[1.62, .47, .013, .02], [1.14, .455, .06, .04], [.85, .47, .13, .055]], fin), ...eyes([0, .727, .938], .157, .083), membrane("鱼鼻龙躯体上方独立的弯三角背鳍", fin, [[0, .85, .01], [0, 1.4, -.19], [0, 1.26, -.39], [0, .63, -.62]]), tapered("鱼鼻龙明显向下弯的尾轴", skin, [[0, .28, -1.41], [0, .18, -1.91], [0, -.04, -2.23]], [.075, .055, .005]), membrane("鱼鼻龙深叉尾上叶", fin, [[0, .25, -1.72], [0, .98, -2.33], [0, 1.06, -2.6], [0, .37, -2.25], [0, .06, -2.08]]), membrane("鱼鼻龙沿下弯轴支持的下尾叶", fin, [[0, .17, -1.86], [0, -.34, -2.26], [0, -.49, -2.47], [0, -.04, -2.23]])];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -.85 : .55, span = rear ? .57 : .89; parts.push(membrane("鱼鼻龙前长后短且末端细窄的四枚鳍肢", fin, [[side * .16, .37, z], [side * .47, .2, z - .18], [side * span, .07, z - .67], [side * (span - .1), .045, z - .79], [side * .24, .28, z - .36]])); }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) { for (let i = 0; i < 28; i++) { const t = i / 27; teeth.push(tapered("鱼鼻龙延长上颌下缘细密的真牙而非剑面锯齿", pale, [[side * (.065 - t * .054), .6, 1.14 + t * 1.16], [side * (.064 - t * .054), .568, 1.141 + t * 1.16]], [.0032, .0002])); } for (let i = 0; i < 12; i++) teeth.push(tapered("鱼鼻龙短下颌朝上的独立细牙", pale, [[side * .036, .491, 1.15 + i * .038], [side * .035, .54, 1.15 + i * .038]], [.0037, .0002])); }
  for (let i = 0; i < teeth.length; i += 27) parts.push(combineMeshes("鱼鼻龙不等长上下颌各自连续的细牙列", pale, teeth.slice(i, i + 27))); return parts;
}

// https://digimorph.geo.utexas.edu/specimens/Pachyrhachis_problematicus/
function pachyrhachis(): ModelPart[] {
  const path: Triple[] = Array.from({ length: 37 }, (_, i) => { const t = i / 36; return [Math.sin(t * Math.PI * 2.1) * .042, .055 + Math.sin(t * Math.PI) * .009, .43 - t * 1.03]; }), radii = path.map((_, i) => { const t = i / 36; return t < .1 ? .014 + t * .065 : t < .68 ? .021 + Math.sin(t * Math.PI) * .006 : .025 * (1 - (t - .68) / .32) + .0008; });
  const parts: ModelPart[] = [tapered("厚针龙前部肋骨增厚而外观圆厚的海蛇活体", skin, path, radii), lobe("厚针龙低而略宽的无冠蛇头", skin, [0, .058, .455], [.05, .043, .078]), ...eyes([0, .072, .465], .019, .0065)];
  for (const side of [-1, 1]) { const root = path[26]!; parts.push(tapered("厚针龙后躯仍真实保留的细小大腿与小腿", skin, [[root[0] + side * .016, root[1] - .004, root[2]], [root[0] + side * .04, .033, root[2] + .01], [root[0] + side * .05, .017, root[2] - .016]], [.006, .004, .0027]), lobe("厚针龙保守复原而不臆定完整趾数的短足端", fin, [root[0] + side * .052, .016, root[2] - .027], [.013, .008, .024])); }
  return parts;
}

// https://doi.org/10.1017/S175569102400001X
function dinocephalosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("恐头龙延长且低平的胸腹", [[.6, .32, .1, .13], [.18, .3, .2, .18], [-.29, .24, .14, .13], [-.43, .2, .067, .075]], skin), tapered("恐头龙由多颈节组成但颈肋束限制弯曲的超长颈", skin, [[0, .34, .48], [.025, .38, 1.25], [.045, .42, 2.08], [.04, .43, 2.73]], [.089, .066, .047, .031]), lobe("恐头龙长颈末端低扁的小型后颅", skin, [.04, .445, 2.85], [.16, .13, .28]), tapered("恐头龙有鱼笼状齿列的尖吻上颌", skin, [[.04, .465, 2.87], [.04, .455, 3.09]], [.042, .012]), tapered("恐头龙与上吻平行的细长下颌", fin, [[.04, .375, 2.83], [.04, .377, 3.1]], [.038, .009]), ...eyes([.04, .48, 2.852], .059, .023), tapered("恐头龙骨盆后仍很长的侧扁推进尾", skin, [[0, .21, -.35], [.035, .16, -.95], [.11, .09, -1.67], [.2, .045, -2.15]], [.07, .05, .025, .002])];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -.22 : .42, end: Triple = [side * .34, .06, z - .04]; parts.push(tapered("恐头龙连接到胸盆带的短鳍肢根", skin, [[side * .11, .23, z], [side * .26, .12, z + .015], end], [.046, .032, .025]), membrane("恐头龙末端宽圆而不呈尖水翼的完整五趾桨足", fin, [end, [side * .46, .028, z + .03], [side * .5, .018, z - .065], [side * .46, .015, z - .16], [side * .33, .04, z - .16]])); }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (const upper of [false, true]) for (let i = 0; i < 8; i++) { const z = 2.88 + i * .028, x = .04 + side * (.029 - i * .002); teeth.push(tapered("恐头龙互相交错而保持单齿间隙的鱼笼状牙", pale, [[x, upper ? .435 : .394, z], [x, upper ? .388 : .439, z + .002]], [.0035, .0002])); }
  for (let i = 0; i < teeth.length; i += 27) parts.push(combineMeshes("恐头龙长颈末端的交错捕鱼齿列", pale, teeth.slice(i, i + 27))); return parts;
}

// https://sternbergca.fhsu.edu/index.php/Detail/objects/7a640672-a325-4d92-ac34-2f1cce09fefc
function dolichorhynchops(): ModelPart[] {
  const parts: ModelPart[] = [lobe("长喙龙短而流线的圆腹主躯", skin, [0, .39, -.11], [.61, .54, 1.19]), tapered("长喙龙明显短于躯体而仍独立的短颈", skin, [[0, .43, .31], [0, .48, .77]], [.14, .089]), lobe("长喙龙高后颅与大眼眶后部", skin, [0, .52, .86], [.29, .25, .31]), tapered("长喙龙薄而狭窄的长尖上吻", skin, [[0, .54, .94], [0, .53, 1.34]], [.063, .009]), body("长喙龙下颌较薄且与上吻留出齿间口腔", [[1.35, .414, .007, .01], [.92, .41, .054, .027], [.76, .416, .085, .04]], fin), ...eyes([0, .585, .86], .101, .047), tapered("长喙龙胸腹后收为短尾", skin, [[0, .34, -.58], [.04, .24, -1.02], [.09, .14, -1.6]], [.12, .066, .003])];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -.5 : .27; parts.push(membrane("长喙龙四枚宽而长的尖桨水翼", fin, [[side * .17, .27, z], [side * .57, .16, z - .09], [side * .98, .055, z - .48], [side * .87, .035, z - .66], [side * .42, .16, z - .43], [side * .16, .25, z - .18]])); }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (const upper of [false, true]) for (let i = 0; i < 18; i++) { const t = i / 17, x = side * (.051 - t * .04), z = .91 + t * .41; teeth.push(tapered("长喙龙细长喙中密集而非上龙粗锥状的细针牙", pale, [[x, upper ? .501 : .438, z], [x, upper ? .455 : .484, z + .002]], [.0034, .0002])); }
  for (let i = 0; i < teeth.length; i += 27) parts.push(combineMeshes("长喙龙四列相互错开的细长捕食牙", pale, teeth.slice(i, i + 27))); return parts;
}

export const aquaticExpansionBatchThirteenDesigns: MasterNatureDesign[] = [
  design("largocephalosaurus", "巨肋龙", "动物", largocephalosaurus, ["Largocephalosaurus qianensis", "形态复原", "长闭合肋篮与保留间隙的不完整背甲"]),
  design("eretmorhipis", "扇鳍龙", "动物", eretmorhipis, ["Eretmorhipis carrolldongi", "形态复原", "小头微眼软骨鸭嘴宽扇足与高背骨板"]),
  design("utatsusaurus", "歌津鱼龙", "动物", utatsusaurus, ["Utatsusaurus hataii", "形态复原", "细长无背鳍躯短桨足及密等形细牙"]),
  design("guanlingsaurus", "关岭鱼龙", "动物", guanlingsaurus, ["Guanlingsaurus liangae", "Shastasaurus liangae为旧组合不另计", "形态复原", "低浅长躯与短无齿三角头"]),
  design("eurhinosaurus", "鱼鼻龙", "动物", eurhinosaurus, ["Eurhinosaurus", "形态复原", "具细牙上颌显著超出短下颌与四鳍肢"]),
  design("pachyrhachis", "厚针龙", "动物", pachyrhachis, ["Pachyrhachis problematicus", "形态复原", "增厚前肋海蛇躯仍保留两条后肢"]),
  design("dinocephalosaurus", "恐头龙", "动物", dinocephalosaurus, ["Dinocephalosaurus orientalis", "形态复原", "多节超长颈长尾和宽圆桨足及鱼笼齿"]),
  design("dolichorhynchops", "长喙龙", "动物", dolichorhynchops, ["Dolichorhynchops osborni", "形态复原", "短颈大眼后颅长细喙与四尖桨水翼"]),
];
