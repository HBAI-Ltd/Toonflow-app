import { combineMeshes, design, eyes, leaf, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#aab39c";
const pale = "#c7cbae";
const dark = "#80917d";

// https://www.nhm.ac.uk/discover/dino-directory/gallimimus.html
function gallimimus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("似鸡龙轻巧窄胸而非鸵鸟无尾的奔跑躯", hide, [0, 1.79, -.1], [.58, .88, 1.25], [-12, 0, 0]), tapered("似鸡龙前举后弯的长细颈", hide, [[0, 1.97, .36], [0, 2.29, .73], [0, 2.83, .77], [0, 3.12, 1.12]], [.16, .115, .08, .061]), lobe("似鸡龙大眼小颅", hide, [0, 3.14, 1.3], [.23, .25, .43]), lobe("似鸡龙无齿而前端扁平的长喙", pale, [0, 3.06, 1.55], [.2, .11, .38]), ...eyes([0, 3.2, 1.32], .085, .042), pointed("似鸡龙骨质长平衡尾而非鸟类尾羽", hide, [[0, 1.76, -.62], [.04, 1.56, -1.38], [.13, 1.35, -2.31], [.28, 1.23, -3.27], [.42, 1.25, -3.9]], [.23, .17, .1, .041, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("似鸡龙股短胫跗长的奔跑后肢", hide, [[side * .23, 1.71, -.29], [side * .43, 1.16, .08], [side * .36, .45, -.34], [side * .34, .11, .02]], [.16, .12, .047, .029]), lobe("似鸡龙仅三前趾的窄后足掌", dark, [side * .34, .08, .12], [.16, .12, .3]), tapered("似鸡龙保留长前臂而非鸟翅骨的三指手", hide, [[side * .24, 1.98, .34], [side * .47, 1.67, .64], [side * .35, 1.56, 1.0]], [.06, .047, .032]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 3; i++) {
      digits.push(pointed("似鸡龙三枚细长且无镰爪的后趾", dark, [[side * .34 + (i - 1) * .041, .085, .2], [side * .34 + (i - 1) * .09, .032, .52 + (i === 1 ? .07 : 0)]], [.025, 0]), pointed("似鸡龙真正从掌腕分出的长手指", pale, [[side * .35 + (i - 1) * .035, 1.56, .99], [side * .35 + (i - 1) * .047, 1.47, 1.24], [side * .35 + (i - 1) * .046, 1.52, 1.29]], [.021, .012, 0]));
    }
    parts.push(combineMeshes("似鸡龙三指前手与三趾后足的完整结构", pale, digits));
    const feathers: ModelPart[] = [];
    for (let i = 0; i < 8; i++) feathers.push(leaf("依据近亲复原的似鸡龙短臂羽", pale, [side * (.27 + i * .009), 1.86 - i * .028, .5 + i * .05], .047, .24, [155, side * 20, -side * 35]));
    parts.push(combineMeshes("似鸡龙附着长前臂的短羽列简化", pale, feathers));
  }
  return parts;
}

// https://onlinelibrary.wiley.com/doi/full/10.1111/pala.12257
function psittacosaurus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鹦鹉嘴龙前肢短小的直立深腹躯", hide, [0, .57, -.025], [.43, .65, .76], [8, 0, 0]), tapered("鹦鹉嘴龙承托高圆颅的短颈", hide, [[0, .75, .19], [0, .88, .32]], [.11, .09]), lobe("鹦鹉嘴龙圆而高的宽颅", hide, [0, .94, .42], [.3, .34, .36]), ...eyes([0, 1.0, .47], .111, .033), part("鹦鹉嘴龙真正下钩的短鹦鹉状上喙", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .13, profile: [{ x: -.48, y: 1.02 }, { x: -.64, y: .97 }, { x: -.65, y: .83 }, { x: -.59, y: .89 }, { x: -.48, y: .91 }] }), lobe("鹦鹉嘴龙喙下短厚颏", pale, [0, .84, .53], [.18, .1, .16]), pointed("鹦鹉嘴龙尾部不拖地的连续尾轴", hide, [[0, .49, -.31], [.015, .46, -.45], [.04, .34, -.8], [.1, .2, -1.35]], [.12, .11, .08, 0])];
  for (const side of [-1, 1]) {
    parts.push(pointed("鹦鹉嘴龙颊后两侧横向伸出的颧角", pale, [[side * .107, .877, .36], [side * .203, .86, .34]], [.045, 0]), tapered("鹦鹉嘴龙用于双足站立的粗股细踝", hide, [[side * .135, .53, -.17], [side * .235, .27, -.025], [side * .19, .068, -.095]], [.105, .073, .03]), lobe("鹦鹉嘴龙接地的窄长后掌", dark, [side * .19, .05, -.013], [.11, .075, .21]), tapered("鹦鹉嘴龙不触地的短小前臂", hide, [[side * .14, .7, .18], [side * .23, .55, .25], [side * .18, .49, .37]], [.04, .03, .018]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 3; i++) digits.push(pointed("鹦鹉嘴龙后足三枚主趾", pale, [[side * .19 + (i - 1) * .03, .052, .06], [side * .19 + (i - 1) * .044, .017, .21]], [.018, 0]));
    for (let i = 0; i < 4; i++) digits.push(pointed("鹦鹉嘴龙短前掌四枚小指", pale, [[side * .18 + (i - 1.5) * .012, .49, .36], [side * .18 + (i - 1.5) * .017, .45, .44]], [.007, 0]));
    parts.push(combineMeshes("鹦鹉嘴龙前短手后足的完整指趾", pale, digits));
  }
  const bristles: ModelPart[] = [];
  for (let i = 0; i < 18; i++) { const z = -.43 - i * .019, t = (-z - .45) / .35, y = .46 - t * .12 + (.11 - t * .03) * .9; bristles.push(pointed("鹦鹉嘴龙近尾背中线上真实毫米级基部鬃毛", dark, [[(i % 3 - 1) * .0015, y, z], [(i % 3 - 1) * .002, y + .16, z - .028]], [.0008, .0003])); }
  parts.push(combineMeshes("鹦鹉嘴龙仅近尾背部而非全身覆盖的长鬃列", dark, bristles));
  return parts;
}

// https://pubs.geoscienceworld.org/csp/cjes/article/4/1/171/53454/THE-THICK-HEADED-CERATOPSIAN-DINOSAUR
function pachyrhinosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("厚鼻龙宽腹低肩而不带背甲的四足躯", [[-1.37, 1.15, .44, .57], [-.58, 1.31, .75, .85], [.65, 1.37, .78, .85], [1.29, 1.3, .45, .6]], hide), tapered("厚鼻龙粗短颈和低垂大头的连接", hide, [[0, 1.3, .99], [0, 1.21, 1.55]], [.39, .31]), lobe("厚鼻龙深宽的短鼻颅体", hide, [0, 1.17, 1.97], [.84, .76, 1.03]), lobe("厚鼻龙前端无长角的短喙", pale, [0, .99, 2.42], [.35, .29, .35]), ...eyes([0, 1.4, 1.98], .31, .044), polygon("厚鼻龙鼻额部大面积扁平粗厚骨瘤", pale, [[-.22, 1.83], [-.3, 1.97], [-.25, 2.25], [-.09, 2.34], [.1, 2.34], [.25, 2.25], [.3, 1.97], [.22, 1.83]], .2, [0, 1.41, 0]), pointed("厚鼻龙后躯延伸的粗根短尖尾", hide, [[0, 1.13, -1.25], [.07, .88, -1.99], [.18, .67, -2.73], [.31, .59, -3.37]], [.31, .22, .11, 0])];
  const frill = polygon("厚鼻龙骨窗有连续皮面覆盖的完整长颈盾", pale, [[-.43, -.85], [-.86, -1.37], [-.94, -1.95], [-.66, -2.43], [0, -2.58], [.66, -2.43], [.94, -1.95], [.86, -1.37], [.43, -.85]], .085, [0, 0, 1.33]);
  frill.rotation.x = 90; parts.push(frill);
  for (const side of [-1, 1]) {
    parts.push(pointed("厚鼻龙颈盾后缘向内弯曲的骨角", pale, [[side * .61, 2.37, 1.34], [side * .49, 2.72, 1.55], [side * .3, 2.76, 1.62]], [.11, .065, 0]));
    for (const front of [true, false]) {
      const z = front ? .91 : -.91, ankle: Triple = [side * .56, .13, z + .09];
      parts.push(tapered("厚鼻龙短股粗踝的四足支承肢", hide, [[side * .43, 1.17, z], [side * .64, .61, z - .08], ankle], [.23, .17, .09]), lobe("厚鼻龙低而宽的承重足", dark, [ankle[0], .105, ankle[2] + .05], [.34, .18, .42]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < (front ? 5 : 4); i++) {
        const hoof = !front || i < 3;
        toes.push(lobe(hoof ? "厚鼻龙前内三和后四枚宽钝蹄甲" : "厚鼻龙前掌外二指缩短而无爪的肉垫", hoof ? pale : hide, [ankle[0] + side * (i - (front ? 2 : 1.5)) * (front ? .054 : .068), .085, ankle[2] + (hoof ? .22 : .173)], hoof ? [.065, .09, .13] : [.049, .077, .1]));
      }
      for (const color of [hide, pale]) { const pieces = toes.filter(toe => toe.color === color); if (pieces.length) parts.push(combineMeshes("厚鼻龙前五指后四趾且外前指无爪的完整足端", color, pieces)); }
    }
  }
  return parts;
}

// https://www.nhm.ac.uk/discover/dino-directory/concavenator.html
function concavenator(): ModelPart[] {
  const parts: ModelPart[] = [body("昆卡猎龙高髋窄胸的敏捷肉食躯", [[-1.03, 1.55, .23, .35], [-.4, 1.65, .4, .58], [.53, 1.78, .35, .51], [1.03, 1.91, .18, .3]], hide), tapered("昆卡猎龙前举且成S形的短颈", hide, [[0, 1.99, .89], [0, 2.28, 1.14], [0, 2.32, 1.4]], [.23, .18, .14]), lobe("昆卡猎龙长而较低的肉食颅", hide, [0, 2.34, 1.67], [.34, .41, .77]), lobe("昆卡猎龙前颌与短宽鼻端", pale, [0, 2.25, 1.99], [.29, .25, .27]), lobe("昆卡猎龙细长下颌", hide, [0, 2.1, 1.75], [.26, .16, .63]), ...eyes([0, 2.45, 1.67], .13, .042), pointed("昆卡猎龙长而不拖地的平衡尾", hide, [[0, 1.54, -.93], [.04, 1.39, -1.73], [.13, 1.2, -2.58], [.27, 1.1, -3.43], [.38, 1.15, -4.1]], [.26, .19, .11, .045, 0]), part("昆卡猎龙近髋两枚高神经棘形成的局部隆脊", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .11, profile: [{ x: -.18, y: 2.2 }, { x: .24, y: 2.76 }, { x: .43, y: 2.69 }, { x: .64, y: 2.84 }, { x: .92, y: 1.86 }, { x: .46, y: 2.1 }] })];
  for (const side of [-1, 1]) {
    parts.push(tapered("昆卡猎龙强壮屈曲后肢与细长跗部", hide, [[side * .29, 1.62, -.4], [side * .49, .96, -.06], [side * .43, .31, -.4], [side * .42, .09, -.04]], [.21, .145, .061, .038]), lobe("昆卡猎龙三趾窄后掌", dark, [side * .42, .065, .07], [.2, .11, .32]), tapered("昆卡猎龙较长且掌面向内的前臂", hide, [[side * .26, 1.86, .71], [side * .47, 1.55, .98], [side * .35, 1.42, 1.26]], [.071, .056, .034]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 3; i++) digits.push(pointed("昆卡猎龙前手三枚抓握弯指", pale, [[side * .35 + (i - 1) * .031, 1.42, 1.25], [side * .35 + (i - 1) * .042, 1.34, 1.43], [side * .35 + (i - 1) * .04, 1.42, 1.48]], [.022, .014, 0]), pointed("昆卡猎龙后足三枚长爪趾", dark, [[side * .42 + (i - 1) * .052, .07, .18], [side * .42 + (i - 1) * .087, .029, .44 + (i === 1 ? .06 : 0)]], [.029, 0]));
    parts.push(combineMeshes("昆卡猎龙独立的三指手与三趾足", pale, digits));
  }
  return parts;
}

export const landAnimalExpansionBatchSixDesigns: MasterNatureDesign[] = [
  design("gallimimus", "似鸡龙", "动物", gallimimus, ["Gallimimus bullatus", "细长颈无齿扁喙三指手与长跗奔跑足"]),
  design("psittacosaurus", "鹦鹉嘴龙", "动物", psittacosaurus, ["Psittacosaurus", "下钩鹦喙颧角与近尾背鬃"]),
  design("pachyrhinosaurus", "厚鼻龙", "动物", pachyrhinosaurus, ["Pachyrhinosaurus", "鼻额粗厚骨瘤与有完整皮面覆盖的长颈盾"]),
  design("concavenator", "昆卡猎龙", "动物", concavenator, ["Concavenator corcovatus", "近髋双椎局部隆脊与三指抓握前臂"]),
];
