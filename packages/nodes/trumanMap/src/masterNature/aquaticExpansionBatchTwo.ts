import { combineMeshes, design, eyes, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { tail } from "./marine";

const skin = "#99aaa0";
const pale = "#bac3b1";
const tooth = "#d8d3bb";
const dark = "#71877b";

// https://www.fisheries.noaa.gov/species/gray-whale?page=1
function grayWhale(): ModelPart[] {
  const sections = [[5.15, 1.5, .24, .22, 0], [4.3, 1.65, .86, .67, 1], [2.5, 1.65, 1.13, 1.01, 1], [0, 1.55, 1.12, 1.08, 0], [-2.4, 1.35, .77, .82, 0], [-4.2, 1.08, .34, .48, 0], [-5.5, .96, .12, .19, 0]];
  const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 247, 250, 253, 270, 287, 290, 293, 300, 330], count = angles.length;
  const vertices = sections.flatMap(([z, y, w, h, groove]) => angles.map(angle => { const a = angle * Math.PI / 180; return { x: Math.cos(a) * w!, y: y! + Math.sin(a) * h! + (angle === 250 || angle === 290 ? groove! * .07 : 0), z: z! }; })), indices: number[] = [];
  for (let row = 0; row < sections.length - 1; row++) for (let i = 0; i < count; i++) { const a = row * count + i, b = row * count + (i + 1) % count; indices.push(a, a + count, b, b, a + count, b + count); }
  for (let i = 1; i < count - 1; i++) indices.push(0, i, i + 1, (sections.length - 1) * count, (sections.length - 1) * count + i + 1, (sections.length - 1) * count + i);
  const parts: ModelPart[] = [part("灰鲸短头粗躯及真实凹入腹面的两条短喉沟", "mesh", skin, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), tapered("灰鲸短而弯曲的下颌", pale, [[0, 1.2, 3.45], [0, 1.13, 4.4], [0, 1.3, 5.18]], [.68, .55, .2]), ...eyes([0, 1.83, 4.23], .76, .09), ...tail([0, .96, -5.55], 1.72, false), lobe("代替背鳍的低圆背隆", skin, [0, 1.93, -2.8], [.58, .42, .85])];
  for (let i = 0; i < 8; i++) parts.push(lobe("背隆之后逐渐降低的独立背结", pale, [0, 1.58 - i * .06, -3.36 - i * .25], [.22 - i * .012, .21 - i * .014, .25]));
  for (const side of [-1, 1]) parts.push(membrane("灰鲸短宽而尖端收分的桨形胸鳍", pale, [[side * .9, 1.05, 2.9], [side * 1.9, .59, 2.32], [side * 2.07, .38, 1.38], [side * 1.65, .42, 1.32], [side * .83, .88, 2.17]]));
  return parts;
}

// https://animaldiversity.org/accounts/Platanista_gangetica/
function gangesRiverDolphin(): ModelPart[] {
  const parts: ModelPart[] = [body("恒河豚前部丰满而尾柄细长的躯体", [[.65, .42, .12, .16], [.25, .39, .23, .27], [-.48, .29, .15, .19], [-1.05, .22, .028, .055]], skin), lobe("长吻后方明显隆起的额顶", skin, [0, .47, .58], [.3, .36, .42]), tapered("恒河豚细长而侧扁的上吻", skin, [[0, .4, .65], [0, .38, .92], [0, .375, 1.22]], [.055, .026, .012]), tapered("长下颌在口缝下方完整延伸", pale, [[0, .35, .63], [0, .335, 1.16], [0, .36, 1.23]], [.049, .023, .01]), ...eyes([0, .49, .58], .129, .013), ...tail([0, .22, -1.07], .34, false), membrane("低三角隆脊状而非高镰刀的背鳍", skin, [[0, .46, -.16], [0, .6, -.4], [0, .43, -.74]])];
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 18; i++) { const t = i / 18, z = .72 + t * .44; teeth.push(tapered("细长颌缘露出的间隔圆锥齿", tooth, [[side * (.042 - t * .025), .36, z], [side * (.042 - t * .025), .39, z]], [.004, .0004])); }
  for (let i = 0; i < teeth.length; i += 18) parts.push(combineMeshes("恒河豚两颌间可辨的密齿列", tooth, teeth.slice(i, i + 18)));
  for (const side of [-1, 1]) parts.push(membrane("恒河豚前缘宽而远端圆收的巨大胸鳍", pale, [[side * .15, .29, .4], [side * .55, .19, .33], [side * .7, .12, .02], [side * .52, .1, -.12], [side * .2, .21, .15]]));
  return parts;
}

function amazonRiverDolphin(): ModelPart[] {
  const parts: ModelPart[] = [body("亚马孙河豚宽胸粗腹与扁长尾柄", [[.58, .4, .13, .13], [.2, .39, .255, .27], [-.52, .28, .18, .17], [-1.06, .19, .035, .055]], skin), tapered("活动颈段前方的长而较深的吻部", skin, [[0, .42, .54], [0, .39, .88], [0, .365, 1.15]], [.08, .045, .021]), lobe("额顶独立圆隆的额瓜", skin, [0, .48, .62], [.32, .31, .4]), tapered("长吻下颌与上吻留出细口缝", pale, [[0, .34, .62], [0, .32, .98], [0, .34, 1.15]], [.067, .034, .017]), ...eyes([0, .45, .65], .128, .026), ...tail([0, .19, -1.08], .43, false), membrane("从中背向后平缓延伸的长低背脊", skin, [[0, .58, .06], [0, .69, -.17], [0, .62, -.43], [0, .35, -.86]])];
  for (const side of [-1, 1]) parts.push(membrane("亚马孙河豚宽阔前缘后掠成指状的胸鳍", pale, [[side * .18, .28, .36], [side * .58, .2, .3], [side * .83, .12, -.08], [side * .65, .105, -.21], [side * .25, .21, .11]]));
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 12; i++) { const z = .7 + i * .032, x = side * (.055 - i * .0027); teeth.push(tapered("长吻前部抓握用细圆锥齿", tooth, [[x, .348, z], [x, .37, z]], [.004, .0005])); }
  for (let i = 0; i < teeth.length; i += 12) parts.push(combineMeshes("河豚上下吻之间的分离齿列", tooth, teeth.slice(i, i + 12))); return parts;
}

// https://www.doc.govt.nz/nature/native-animals/marine-mammals/seals/elephant-seal/
function southernElephantSeal(): ModelPart[] {
  const parts: ModelPart[] = [body("南象海豹雄体宽胸与向后收细的低伏巨躯", [[1.3, .8, .43, .52], [.65, .65, .76, .62], [-.45, .51, .64, .48], [-1.65, .25, .27, .21], [-2.2, .15, .1, .1]], skin), lobe("抬起且无外耳的粗厚短颈", skin, [0, 1.02, 1.14], [.92, 1.18, 1.03]), lobe("宽短海豹颅部", skin, [0, 1.49, 1.49], [.76, .65, .83]), ...eyes([0, 1.6, 1.63], .285, .055), tapered("成年雄体垂到嘴前的厚长鼻", pale, [[0, 1.73, 1.74], [0, 1.65, 2], [0, 1.39, 2.06], [0, 1.3, 1.98]], [.19, .19, .15, .1]), lobe("鼻下圆厚而两侧分开的上唇", pale, [0, 1.25, 1.87], [.55, .24, .4])];
  for (const side of [-1, 1]) {
    parts.push(membrane("象海豹较短而外展的前鳍肢", skin, [[side * .58, .31, .66], [side * .98, .16, .22], [side * 1.01, .08, -.18], [side * .79, .06, -.2], [side * .49, .22, .36]]), membrane("后肢向后延伸的展开泳蹼", pale, [[side * .085, .16, -2.12], [side * .38, .11, -2.49], [side * .41, .08, -2.83], [side * .13, .08, -2.76], [side * .035, .14, -2.25]]), lobe("长鼻末端相互分开的鼻孔", dark, [side * .057, 1.3, 2.03], [.063, .044, .02]));
    const whiskers: ModelPart[] = []; for (let i = 0; i < 9; i++) whiskers.push(tapered("短粗唇部向外散开的感觉须", pale, [[side * .14, 1.28 + (i % 3) * .026, 1.96], [side * (.34 + i * .012), 1.19 + i * .017, 2 + i * .008]], [.003, .0006])); parts.push(combineMeshes("象海豹成扇排列的短唇须", pale, whiskers));
  }
  for (let i = 0; i < 5; i++) parts.push(tapered("雄象海豹胸前分离的厚皮褶", pale, [[-.28, .9 + i * .084, 1.66], [0, .86 + i * .084, 1.72], [.28, .9 + i * .084, 1.66]], [.026, .03, .026]));
  return parts;
}

// https://australian.museum/learn/animals/mammals/leopard-seal/
function leopardSeal(): ModelPart[] {
  const parts: ModelPart[] = [body("豹海豹异常长的颈躯与向后细收的身体", [[1.15, .57, .23, .24], [.65, .46, .36, .32], [-.35, .34, .39, .3], [-1.3, .2, .18, .17], [-1.68, .14, .05, .08]], skin), body("豹海豹长而扁的爬行状上颅", [[1.85, .6, .06, .045], [1.54, .65, .2, .1], [1.19, .65, .27, .17], [.91, .57, .2, .16]], skin), tapered("真正张开的长而厚的下颌", pale, [[0, .48, 1.16], [0, .38, 1.51], [0, .4, 1.83]], [.15, .13, .045]), ...eyes([0, .73, 1.29], .205, .04)];
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(membrane("豹海豹较长且末端伸展的前鳍肢", pale, [[side * .27, .31, .54], [side * .75, .17, .31], [side * 1.01, .065, -.14], [side * .79, .06, -.27], [side * .27, .21, .24]]), membrane("不具行走关节的后鳍肢", skin, [[side * .04, .14, -1.6], [side * .33, .08, -1.99], [side * .28, .06, -2.19], [side * .05, .09, -2.08]]));
    teeth.push(tapered("豹海豹前部强大的上犬齿", tooth, [[side * .105, .58, 1.64], [side * .105, .44, 1.66]], [.026, .001]));
    for (let i = 0; i < 7; i++) { const z = 1.24 + i * .058, x = side * (.145 - i * .006); for (const offset of [-1, 0, 1]) teeth.push(tapered("用于滤食的三尖后颊齿", tooth, [[x, .54, z + offset * .015], [x, offset ? .49 : .475, z + offset * .015]], [.009, .0006])); }
  }
  for (let i = 0; i < teeth.length; i += 22) parts.push(combineMeshes("豹海豹独立犬齿与梳状三尖颊齿列", tooth, teeth.slice(i, i + 22))); return parts;
}

// https://www.amnh.org/explore/news-blogs/ambulocetus-walking-whale
function walkingWhale(): ModelPart[] {
  const parts: ModelPart[] = [lobe("走鲸厚胸长腹的两栖哺乳躯体", skin, [0, .54, -.15], [.79, .8, 1.69]), tapered("走鲸短而粗的前伸颈", skin, [[0, .65, .51], [0, .66, .93]], [.25, .22]), body("走鲸长齿颌与后宽前窄的厚颅", [[1.58, .65, .06, .046], [1.31, .7, .12, .09], [.99, .7, .22, .18], [.77, .66, .19, .17]], skin), tapered("走鲸略张开的厚下颌", pale, [[0, .54, .98], [0, .52, 1.36], [0, .58, 1.61]], [.13, .09, .045]), tapered("走鲸无现代鲸尾叶的厚长尾", skin, [[0, .49, -.85], [.05, .31, -1.35], [.12, .18, -1.98]], [.16, .105, .008]), ...eyes([0, .8, 1.04], .15, .04)];
  for (const side of [-1, 1]) {
    parts.push(tapered("从胸部外展再前折的粗壮前臂", skin, [[side * .23, .57, .43], [side * .58, .3, .44], [side * .52, .13, .76]], [.14, .11, .067]), tapered("从骨盆外展再后收的巨大后腿", skin, [[side * .23, .48, -.59], [side * .61, .26, -.67], [side * .53, .115, -.96]], [.2, .14, .075]), membrane("后足长趾之间的推定游泳蹼", pale, [[side * .48, .095, -.94], [side * .69, .08, -1.17], [side * .61, .075, -1.46], [side * .34, .08, -1.36], [side * .4, .09, -1.05]]));
    for (let i = 0; i < 4; i++) parts.push(tapered("走鲸后足四根可辨的长泳趾", skin, [[side * .53, .095, -1.01], [side * (.37 + i * .076), .075, -1.36 - Math.sin(i / 3 * Math.PI) * .09]], [.025, .008]), tapered("较短前掌的分离手指", pale, [[side * .52, .13, .75], [side * (.43 + i * .055), .06, .97 + Math.sin(i / 3 * Math.PI) * .04]], [.017, .004]));
    for (let i = 0; i < 6; i++) parts.push(tapered("长颌内分化的尖锥牙齿", tooth, [[side * (.1 - i * .008), .64, 1.1 + i * .074], [side * (.1 - i * .008), .545, 1.11 + i * .074]], [.017, .0007]));
  }
  return parts;
}

// https://repository.si.edu/items/d5af1af2-19a7-4396-aaef-cde2535e5517
function desmostylus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("海豹兽弓背宽胸的桶状长腹", skin, [0, .72, -.18], [.98, 1.04, 1.7]), tapered("低位前伸粗颈", skin, [[0, .77, .44], [0, .67, .96]], [.3, .25]), lobe("海豹兽窄长而鼻端抬起的头颅", skin, [0, .74, 1.03], [.43, .39, .69]), lobe("牙齿前伸的厚而偏低下颌", pale, [0, .55, 1.13], [.35, .21, .58]), tapered("短而下垂的尾", skin, [[0, .6, -.9], [0, .3, -1.18]], [.072, .008]), ...eyes([0, .87, 1.03], .167, .034)];
  for (const side of [-1, 1]) {
    for (const z of [-.65, .45]) {
      parts.push(tapered("海豹兽稍外展且前后方向不同的承重肢", skin, [[side * .3, .67, z], [side * .53, .34, z - .07], [side * .45, .1, z + .1]], [.15, .12, .082]));
      for (let i = 0; i < 4; i++) parts.push(lobe("宽足前方并排的四个短趾", pale, [side * .45 + (i - 1.5) * .047, .055, z + .19 + Math.sin(i / 3 * Math.PI) * .025], [.05, .09, .135]));
    }
    parts.push(tapered("下颌前缘向前伸的粗门齿", tooth, [[side * .07, .59, 1.34], [side * .084, .64, 1.58]], [.031, .009]), lobe("高位颅顶的鼻孔缘", dark, [side * .051, .862, 1.24], [.045, .015, .051]));
  }
  const columns: ModelPart[] = [];
  for (const side of [-1, 1]) for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) columns.push(lobe("轻张口缝内成束的柱状臼齿齿柱", tooth, [side * (.102 + row * .027), .664, .96 + i * .063], [.032, .065, .037]));
  parts.push(combineMeshes("海豹兽独有的成束柱状臼齿咬合面", tooth, columns)); return parts;
}

// https://repository.si.edu/items/c4f6eb65-6eed-4e6c-b769-a3f19f08933f
function walrusWhale(): ModelPart[] {
  const parts: ModelPart[] = [body("海象鲸宽胸与鱼尾式后躯的完整鲸身", [[.59, .47, .18, .2], [.15, .43, .3, .32], [-.65, .3, .17, .18], [-1.14, .22, .034, .058]], skin), lobe("没有延长海豚嘴的短宽圆颅", skin, [0, .58, .65], [.51, .51, .53]), lobe("前缘下垂而宽厚的上唇", pale, [0, .415, .84], [.45, .23, .24]), ...eyes([0, .737, .695], .16, .035), ...tail([0, .22, -1.17], .39, false)];
  for (const side of [-1, 1]) parts.push(tapered("向下后方倾斜的前颌牙槽长鞘", pale, [[side * .15, .43, .83], [side * .19, .24, .73]], [.058, .044]), tapered("左右不对称且向身后指向的象牙", tooth, [[side * .19, .24, .73], [side * .23, side > 0 ? -.21 : .13, side > 0 ? -.09 : .49]], [.026, .006]), membrane("海象鲸无足趾的胸鳍", pale, [[side * .22, .32, .34], [side * .58, .16, .16], [side * .62, .1, -.13], [side * .43, .12, -.18], [side * .2, .25, .09]]));
  return parts;
}

// https://news.yale.edu/2014/03/13/fossil-porpoise-has-chin-ages
function longChinnedPorpoise(): ModelPart[] {
  const parts: ModelPart[] = [body("长颌鼠海豚短粗前躯与尖尾柄", [[.51, .31, .1, .11], [.16, .3, .18, .19], [-.42, .22, .12, .14], [-.85, .15, .025, .045]], skin), lobe("短吻鼠海豚式圆颅", skin, [0, .39, .45], [.29, .3, .37]), tapered("远短于下颌的上吻", skin, [[0, .3, .51], [0, .275, .72]], [.065, .032]), tapered("超过上吻并长达约85厘米的下颌联合部", pale, [[0, .245, .52], [0, .23, .88], [0, .21, 1.37]], [.049, .026, .008]), ...eyes([0, .41, .43], .111, .027), ...tail([0, .15, -.88], .31, false), membrane("短而直立的三角背鳍", pale, [[0, .43, -.15], [0, .77, -.3], [0, .35, -.48]])];
  for (const side of [-1, 1]) parts.push(membrane("长颌鼠海豚前肢桨", pale, [[side * .125, .245, .26], [side * .38, .14, .1], [side * .44, .095, -.09], [side * .3, .12, -.1], [side * .13, .2, .06]])); return parts;
}

export const aquaticExpansionBatchTwoDesigns: MasterNatureDesign[] = [
  design("grayWhale", "灰鲸", "动物", grayWhale, ["Eschrichtius robustus", "实际短喉沟无背鳍并有低背隆及独立背结"]),
  design("gangesRiverDolphin", "恒河豚", "动物", gangesRiverDolphin, ["Platanista gangetica", "窄长齿吻小眼高额顶与宽胸鳍"]),
  design("amazonRiverDolphin", "亚马孙河豚", "动物", amazonRiverDolphin, ["Inia geoffrensis", "长吻宽胸指状胸鳍与长而低的背脊"]),
  design("southernElephantSeal", "南象海豹", "动物", southernElephantSeal, ["Mirounga leonina", "雄体垂鼻皮褶胸盾与向后伸的后鳍"]),
  design("leopardSeal", "豹海豹", "动物", leopardSeal, ["Hydrurga leptonyx", "长爬行状颅强犬齿与三尖后颊齿"]),
  design("walkingWhale", "走鲸", "动物", walkingWhale, ["Ambulocetus natans", "古鲸形态复原", "四条外展肢巨大推定蹼足与无尾叶的厚尾"]),
  design("desmostylus", "海豹兽", "动物", desmostylus, ["Desmostylus hesperus", "束柱类形态复原", "弓背低颅前伸门齿与成束柱状臼齿"]),
  design("walrusWhale", "海象鲸", "动物", walrusWhale, ["Odobenocetops peruvianus", "古鲸形态复原", "短宽颅不等长后向牙与无足趾胸鳍"]),
  design("longChinnedPorpoise", "长颌鼠海豚", "动物", longChinnedPorpoise, ["Semirostrum ceruttii", "古鲸形态复原", "短上吻与极长感知型下颌联合"]),
];
