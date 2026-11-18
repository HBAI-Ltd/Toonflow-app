import { combineMeshes, design, eyes, lobe, needle, part, tapered, type ModelPart, type Triple } from "./shared";
import { membrane } from "./animals";
import { flightFeather } from "./mythicCreatureExpansionBatchOne";

const dark = "#5f7664", ivory = "#c5c5ac";

// 具名传统动物的整体母题；原创米制静态模型，不模拟传说中的呼风、疗效或其他能力。
// https://tmach-culture.tainan.gov.tw/templemuseums/warehouse/25AD5CF1-4B44-4A6F-B9B7-2425AADD7CCD/F_1669097517690e.pdf
// https://ctext.org/shan-hai-jing/nan-shan-jing/zh
// https://ctext.org/text.pl?if=en&node=83601&show=parallel
// https://dict.variants.moe.edu.tw/dictView.jsp?ID=91936

function feilian(): ModelPart[] {
  const hide = "#b2a68a", plumage = "#9eaf93";
  const parts: ModelPart[] = [lobe("飞廉从肩胸到臀部连续收窄的完整鹿躯", hide, [0, 1.65, -.15], [1.25, 1.65, 3.25]), lobe("鹿躯前方高耸的肩峰和胸部", hide, [0, 1.95, .9], [1.2, 1.45, 1.4]),
    tapered("鹿形肩胸上举并接到雀首的细长颈", plumage, [[0, 2.1, 1.05], [0, 2.75, 1.45], [0, 3.15, 1.75]], [.27, .2, .13]), lobe("飞廉具有圆额眼眶的完整雀形头颅", plumage, [0, 3.32, 1.91], [.64, .7, .74]),
    tapered("雀首前方收尖的短喙", ivory, [[0, 3.27, 2.15], [0, 3.18, 2.61]], [.16, .007]), ...eyes([0, 3.42, 2.08], .21, .07),
    tapered("鹿形后躯连出并反曲向上的蛇式长尾", hide, [[0, 1.7, -1.46], [-.35, 1.3, -2.25], [-.75, 1.55, -3], [-.48, 2.1, -3.32], [.1, 2.4, -3.1]], [.13, .1, .075, .045, .009])];
  for (const side of [-1, 1]) {
    parts.push(tapered("飞廉前腿从鹿肩经长前臂连接球节", hide, [[side * .38, 1.7, .9], [side * .46, .88, 1.05], [side * .45, .2, .93]], [.15, .085, .05]),
      tapered("飞廉后腿由鹿股经膝跗反折到蹄踝", hide, [[side * .4, 1.55, -1.2], [side * .59, .87, -1.45], [side * .56, .2, -.96]], [.23, .11, .05]),
      tapered("雀首后上方真实相连的上举长角", ivory, [[side * .15, 3.48, 1.72], [side * .3, 3.9, 1.65], [side * .45, 4.32, 1.9]], [.075, .05, .007]),
      tapered("长角主干上向内分出的短枝", ivory, [[side * .27, 3.82, 1.66], [side * .48, 3.96, 1.36]], [.045, .006]));
    for (const front of [false, true]) for (const toe of [-1, 1]) parts.push(part("飞廉鹿肢末端各自分离的双瓣蹄", "box", dark, [side * (front ? .45 : .56) + toe * .065, .1, front ? .99 : -.9], [.11, .2, .33]));
  }
  const spots: ModelPart[] = [];
  for (const side of [-1, 1]) for (const [y, z, x] of [[1.65, -.7, .529], [1.65, .05, .529], [1.83, -.2, .477], [1.47, -.2, .477]]) spots.push(lobe("鹿形躯干表面稀疏而相连的豹式斑块", dark, [side * x!, y!, z!], [.06, .14, .22]));
  // 斑块仅附着既有躯面，不作为其他花色款登记。
  parts.push(combineMeshes("飞廉鹿躯两侧的豹式斑纹", dark, spots));
  return parts;
}

function xuangui(): ModelPart[] {
  const shell = "#849684", hide = "#a6b298";
  const parts: ModelPart[] = [part("旋龟前后扁阔且具有真实壁厚的完整背甲", "lathe", shell, [0, .55, 0], [1.2, .75, 1.6], [0, 0, 0], { profile: [{ x: 0, y: .9 }, { x: .55, y: .8 }, { x: 1.05, y: .45 }, { x: 1.3, y: .1 }, { x: 1.35, y: 0 }, { x: 1.31, y: -.1 }, { x: 1.2, y: -.12 }, { x: 1.17, y: .02 }, { x: .96, y: .35 }, { x: .5, y: .67 }, { x: 0, y: .77 }] }),
    lobe("背甲下方与四肢根部相接的完整腹甲", hide, [0, .5, 0], [3.1, .6, 4.2]), tapered("旋龟甲缘前方上举并前弯的完整鸟颈", hide, [[0, .75, 1.6], [0, 1.25, 2], [0, 1.75, 2.25]], [.27, .19, .12]),
    lobe("旋龟完整的鸟形头颅与颊部", hide, [0, 1.9, 2.43], [.55, .6, .7]), tapered("鸟首前伸再下扣的完整上喙", ivory, [[0, 1.9, 2.65], [0, 1.85, 3.2], [0, 1.68, 3.32]], [.17, .1, .005]),
    tapered("上喙下方与鸟颅相连的细长下喙", ivory, [[0, 1.67, 2.7], [0, 1.65, 3.18]], [.1, .04]), ...eyes([0, 2, 2.57], .18, .055),
    tapered("旋龟背甲后缘连出并盘曲的虺尾", hide, [[0, .6, -1.8], [.3, .5, -2.8], [1, .35, -3.6], [1.7, .5, -3.4], [1.9, .65, -2.9]], [.22, .17, .12, .07, .01])];
  for (const side of [-1, 1]) for (const z of [-1.2, 1.2]) {
    const ankle: Triple = [side * 1.65, .1, z + .3];
    parts.push(tapered("旋龟腹甲下外展并弯至接地足的完整短肢", hide, [[side * 1, .55, z], [side * 1.55, .32, z + .15], ankle], [.25, .16, .09]), lobe("龟肢末端接地且宽阔的掌部", hide, [ankle[0], .09, ankle[2] + .1], [.45, .18, .5]));
    const claws: ModelPart[] = [];
    for (let toe = 0; toe < 3; toe++) claws.push(needle("龟足前缘分开的短爪", ivory, [ankle[0] + (toe - 1) * .11, .07, ankle[2] + .22], [ankle[0] + (toe - 1) * .12, .025, ankle[2] + .43], .055));
    parts.push(combineMeshes("旋龟单足前缘的完整三爪", ivory, claws));
  }
  return parts;
}

function ranyiFish(): ModelPart[] {
  const scales = "#8aab9c", fin = "#abbda4";
  const body = tapered("冉遗鱼由尾柄至前胸连续收分的完整鱼躯", scales, [[0, 1.2, -2], [0, 1.2, -1.5], [0, 1.2, -.7], [0, 1.2, .3], [0, 1.2, 1.1], [0, 1.2, 1.6]], [.07, .4, .7, .75, .58, .35]);
  body.scale.x = .75;
  const parts: ModelPart[] = [body, tapered("鱼躯前端向上前弯并接蛇首的细颈", scales, [[0, 1.2, 1.5], [0, 1.45, 2.15], [0, 1.55, 2.6]], [.35, .25, .16]),
    lobe("冉遗前端完整而扁阔的蛇形头颅", scales, [0, 1.62, 2.8], [.7, .5, 1.1]), lobe("蛇首前方收窄的上颌长吻", scales, [0, 1.56, 3.22], [.5, .24, .5]), tapered("蛇首下方与颅底相连的细长下颌", fin, [[0, 1.43, 2.56], [0, 1.28, 3.39]], [.17, .085]),
    ...[-1, 1].map(side => lobe("蛇首两侧沿头面连接的纵长眼", dark, [side * .2183, 1.7434, 2.9424], [.075, .19, .085])),
    membrane("鱼尾柄后端相连的上半片分叉尾鳍", fin, [[0, 1.2, -1.96], [0, 2.25, -3], [0, 1.2, -2.7]]), membrane("鱼尾柄后端相连的下半片分叉尾鳍", fin, [[0, 1.2, -1.96], [0, 1.2, -2.7], [0, .2, -3]])];
  const dorsal: ModelPart[] = [];
  const tops = Array.from({ length: 6 }, (_, index) => body.vertices!.slice(index * 8, index * 8 + 8).reduce((a, b) => b.y > a.y ? b : a));
  for (let index = 0; index < 5; index++) { const a = tops[index]!, b = tops[index + 1]!; dorsal.push(membrane("鱼脊上根部逐段贴合真实鱼躯的背鳍", fin, [[a.x * .75, a.y - .02, a.z], [b.x * .75, b.y - .02, b.z], [b.x * .75, b.y + .55, b.z], [a.x * .75, a.y + .55, a.z]])); }
  parts.push(combineMeshes("冉遗鱼脊上连续相连的完整背鳍", fin, dorsal));
  for (const side of [-1, 1]) {
    for (const z of [-1.2, -.1, 1]) {
      const rootX = z < -1 ? .27 : z > .5 ? .34 : .42, ankle: Triple = [side * 1.05, .12, z + .45];
      parts.push(tapered("从鱼躯腹侧独立伸出并真实落地的步足", scales, [[side * rootX, 1, z], [side * .9, .5, z + .1], ankle], [.15, .11, .055]),
        membrane("冉遗每只步足末端展开的薄蹼掌", fin, [[ankle[0] - .1, .09, ankle[2]], [ankle[0] + .1, .09, ankle[2]], [ankle[0] + .2, .025, ankle[2] + .42], [ankle[0] - .2, .025, ankle[2] + .42]]));
      const toes: ModelPart[] = [];
      for (const toe of [-1, 0, 1]) toes.push(tapered("步足掌前方分开的细长足趾", scales, [[ankle[0] + toe * .07, .08, ankle[2]], [ankle[0] + toe * .18, .03, ankle[2] + .46]], [.025, .008]));
      parts.push(combineMeshes("单只步足的完整三趾", scales, toes));
    }
    parts.push(needle("蛇首上颌内向下伸出的成对长牙", ivory, [side * .14, 1.48, 3.22], [side * .13, 1.27, 3.28], .045));
  }
  return parts;
}

function paoxiao(): ModelPart[] {
  const fur = "#a0ac92", face = "#b8ad95";
  const parts: ModelPart[] = [lobe("狍鸮由胸腹至臀部相接的完整羊形躯干", fur, [0, 1.8, 0], [2.2, 2.6, 3.6]), lobe("羊形躯干前方高厚的胸肩", fur, [0, 2.1, 1.1], [2.5, 2.4, 1.8]),
    tapered("羊胸上举并接到人面头颅的粗颈", fur, [[0, 2.4, 1.2], [0, 2.9, 1.6]], [.48, .35]), lobe("狍鸮没有面部双眼而具有额颊的人首", face, [0, 3.2, 1.9], [1.1, 1.3, .9]),
    lobe("人面中央与额颊相连的高鼻梁", face, [0, 3.25, 2.28], [.22, .4, .3]), lobe("人面前方张口上方厚实的上颌", face, [0, 2.99, 2.22], [.8, .32, .45]),
    tapered("人面下方张开而与颅底连续相接的下颌", face, [[0, 2.9, 1.9], [0, 2.58, 2.4]], [.25, .18])];
  for (const side of [-1, 1]) {
    parts.push(tapered("从人面颞上方相连并卷曲的羊式角", ivory, [[side * .42, 3.5, 1.7], [side * .8, 3.65, 1.5], [side * 1.05, 3.3, 1.6], [side * .92, 3, 1.88], [side * .67, 3.04, 1.96]], [.15, .16, .13, .09, .015]),
      tapered("从张口上颌弯向下颌的完整虎式长牙", ivory, [[side * .27, 3, 2.1], [side * .3, 2.65, 2.3], [side * .2, 2.55, 2.4]], [.095, .06, .008]),
      lobe("狍鸮前肢腋下真实相连的完整大眼", ivory, [side * .9, 1.55, 1.38], [.35, .3, .18]), lobe("腋下大眼前方独立的深色圆瞳", dark, [side * .9, 1.55, 1.445], [.15, .17, .07]));
    for (const front of [false, true]) {
      const wrist: Triple = [side * .93, .25, front ? 1.7 : -1.2];
      parts.push(tapered("羊形躯干到肘腕完整相连的承重长肢", fur, [[side * .7, front ? 2.1 : 1.7, front ? 1.1 : -1.2], [side * 1.05, 1.1, front ? 1.3 : -1.5], wrist], [.32, .2, .12]), lobe("四肢末端具有分指结构的接地人式掌部", face, [wrist[0], .16, wrist[2] + .16], [.6, .32, .8]));
      const fingers: ModelPart[] = [];
      for (let finger = 0; finger < 4; finger++) fingers.push(tapered("人式接地掌前方真实分开的长爪指", face, [[wrist[0] + (finger - 1.5) * .12, .12, wrist[2] + .35], [wrist[0] + (finger - 1.5) * .13, .055, wrist[2] + .72]], [.06, .02]));
      parts.push(combineMeshes("单只接地人式掌前缘的完整四指", face, fingers), tapered("接地掌侧方与腕掌相连的独立拇爪", face, [[wrist[0] - side * .21, .18, wrist[2] + .15], [wrist[0] - side * .4, .07, wrist[2] + .38]], [.075, .02]));
    }
  }
  return parts;
}

export const mythicCreatureExpansionBatchSevenDesigns = [
  design("deerBirdFeilian", "飞廉", "动物", feilian, ["Feilian", "完整鹿躯四分蹄", "雀首与分枝角", "蛇式长尾与豹纹"], "奇幻"),
  design("birdHeadedXuangui", "旋龟", "动物", xuangui, ["Xuangui", "扁阔龟甲与腹甲", "鸟首长颈", "四爪足与虺尾"], "奇幻"),
  design("sixLeggedRanyiFish", "冉遗鱼", "动物", ranyiFish, ["Ranyi", "完整鱼躯背鳍与叉尾", "蛇首长颈", "六条支承步足"], "奇幻"),
  design("armpitEyedPaoxiao", "狍鸮", "动物", paoxiao, ["Paoxiao", "完整羊躯与人面", "前肢腋下双目", "虎齿与四个人式爪掌"], "奇幻"),
];
