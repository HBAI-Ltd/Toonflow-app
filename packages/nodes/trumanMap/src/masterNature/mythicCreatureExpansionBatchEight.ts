import { combineMeshes, design, eyes, lobe, needle, part, tapered, type ModelPart, type Triple } from "./shared";
import { membrane } from "./animals";
import { flightFeather } from "./mythicCreatureExpansionBatchOne";

const dark = "#5c7261", pale = "#c0c2a8";

// 原创完整形体，仅取传统母题，不复制馆藏图案、纹章或现代角色。
// https://ctext.org/text.pl?if=en&node=84019&show=parallel
// https://glasscollection.cmog.org/objects/6602/fragment-with-senmurv
// https://www.enfield.gov.uk/file/PDFs/email/01794-3-1.pdf
// https://www.telelib.com/words/authors/M/MaloryThomas/prose/lemortedarthur/lemortedarthur912.html

function zhuyin(): ModelPart[] {
  const scale = "#b0907c", face = "#c0ae94";
  const parts: ModelPart[] = [tapered("烛阴从尾尖经盘曲腹部到高举颈端的完整无足蛇躯", scale, [[-8, 1, -5], [-5, 1, -6.5], [-1, 1.15, -5.5], [3, 1.25, -3.5], [4.5, 1.4, .3], [3.2, 1.6, 3.2], [-.3, 2, 4.4], [-3, 2.7, 3.4], [-3.8, 4, 1.3], [-3.4, 6, 0], [-2, 7.2, 0], [-1.3, 8.2, 1]], [.04, .4, .75, 1, 1.1, 1.1, 1, .9, .85, .7, .65, .55]),
    lobe("蛇颈末端直接相接而具额颊下颌的完整人首", face, [-1.3, 9.1, 1.1], [1.8, 2.4, 1.55]), ...eyes([-1.3, 9.4538, 1.5422], .4599, .15),
    lobe("烛阴人首面部中央相连的高鼻梁", face, [-1.3, 9.1, 1.8], [.3, .55, .3]), tapered("沿人首下颌前缘闭合的细口线", dark, [[-1.6, 8.65, 1.618], [-1.3, 8.61, 1.759], [-1, 8.65, 1.618]], [.018, .018, .018])];
  for (const side of [-1, 1]) parts.push(lobe("人首两侧与颞部相连的完整外耳", face, [-1.3 + side * .72, 9, 1], [.25, .55, .3]));
  return parts;
}

function senmurv(): ModelPart[] {
  const fur = "#a4ab91", plume = "#b4bba0";
  const parts: ModelPart[] = [lobe("森穆尔夫承托犬首羽翼和双前肢的完整胸腹", fur, [0, 1.9, .4], [1.85, 2.2, 2.6]),
    tapered("胸腹后方连续弯下并盘曲回升的蛇式后躯", fur, [[0, 1.8, -.4], [0, 1.1, -1.8], [1.3, .35, -3], [2.4, .35, -2.8], [2.6, 1.2, -1.8], [1.8, 1.5, -1.2]], [.65, .55, .35, .22, .13, .13]),
    tapered("胸肩上方前弯并接到犬颅的粗颈", fur, [[0, 2.6, .9], [0, 2.9, 1.35]], [.4, .3]), lobe("森穆尔夫完整的尖耳犬形头颅", fur, [0, 3.25, 1.7], [1, 1.1, 1.1]),
    lobe("犬首前方相接的长吻和上颌", plume, [0, 3.15, 2.25], [.7, .45, .8]), lobe("犬吻前端独立而相连的鼻头", dark, [0, 3.17, 2.55], [.4, .25, .18]), ...eyes([0, 3.4499, 1.9272], .2999, .09),
    tapered("犬首张口下方完整相连的下颌", fur, [[0, 2.99, 1.8], [0, 2.8, 2.55]], [.2, .1])];
  const claws: ModelPart[] = [], tail: ModelPart[] = [];
  for (const side of [-1, 1]) {
    const shoulder: Triple = [side * .65, 2.2, .15], elbow: Triple = [side * 2, 3.5, -.3], wrist: Triple = [side * 3.2, 4.1, -.7];
    parts.push(flightFeather("犬颅上真实相连的直立尖耳", fur, [side * .15, 3.52, 1.55], [side * .38, 4.2, 1.4], .25), tapered("森穆尔夫唯一的一对狮形承重前腿", fur, [[side * .6, 1.9, .85], [side * .83, 1.05, .85], [side * .77, .25, 1.45]], [.3, .2, .11]),
      lobe("狮形前腿末端接地的宽厚足掌", fur, [side * .77, .14, 1.6], [.65, .28, .85]), tapered("由胸背独立伸出的完整肩肘腕翼骨", fur, [shoulder, elbow, wrist], [.21, .14, .055]),
      membrane("胸背到翼腕连续相接的羽覆面", plume, [shoulder, elbow, wrist, [side * 1.9, 2.55, -1.6], [side * .6, 1.85, -.8]]));
    const toes: ModelPart[] = [], feathers: ModelPart[] = [];
    for (let toe = 0; toe < 4; toe++) {
      toes.push(lobe("狮形掌前缘各自分开的厚圆趾", fur, [side * .77 + (toe - 1.5) * .13, .11, 1.9], [.17, .22, .36]));
      claws.push(needle("圆趾前方相连的独立硬爪", pale, [side * .77 + (toe - 1.5) * .13, .09, 2.02], [side * .77 + (toe - 1.5) * .14, .045, 2.18], .04));
    }
    for (let index = 0; index < 10; index++) {
      const t = index / 9, a = t < .5 ? shoulder : elbow, b = t < .5 ? elbow : wrist, f = t < .5 ? t * 2 : (t - .5) * 2, start = a.map((value, axis) => value + (b[axis]! - value) * f) as Triple;
      feathers.push(flightFeather("森穆尔夫长羽根部连续连接真实翼骨", plume, start, [start[0] + side * (1 + t), start[1] - .3, start[2] - 1.5 - t * .6], .48));
    }
    parts.push(combineMeshes("森穆尔夫单只狮掌完整分趾", fur, toes), combineMeshes("森穆尔夫单侧完整长飞羽列", plume, feathers));
  }
  for (let index = 0; index < 5; index++) tail.push(flightFeather("从盘曲后躯末端相连的大尾羽", plume, [1.8 + (index - 2) * .025, 1.5, -1.2], [1.8 + (index - 2) * .55, 2.1 + (2 - Math.abs(index - 2)) * .35, -3.2 - (2 - Math.abs(index - 2)) * .25], .5));
  parts.push(combineMeshes("双前足上完整相连的爪列", pale, claws), combineMeshes("盘曲后躯末端完整舒展的大尾", plume, tail));
  return parts;
}

function enfield(): ModelPart[] {
  const hide = "#a49f83", light = "#c2bba1", fur = "#8b9c87";
  const parts: ModelPart[] = [lobe("恩菲尔德兽前方深而狭长的猎犬胸", hide, [0, 1.7, .5], [1.2, 2.2, 2.1]), lobe("猎犬胸后方连续相接的狮形腰腹", hide, [0, 1.5, -.8], [1.35, 1.6, 3]), lobe("狮腰后方厚实而与狼后肢相接的臀部", fur, [0, 1.45, -1.75], [1.2, 1.4, 1.3]),
    tapered("猎犬胸前上举并接到狐首的细长颈", hide, [[0, 2.2, .95], [0, 2.65, 1.35]], [.26, .2]), lobe("恩菲尔德兽完整的尖额狐形头颅", hide, [0, 2.85, 1.55], [.65, .75, .85]),
    tapered("狐首前方连续收尖的长吻", light, [[0, 2.78, 1.82], [0, 2.6, 2.5]], [.22, .015]), lobe("尖狐吻末端的小鼻头", dark, [0, 2.6, 2.5], [.16, .13, .13]), ...eyes([0, 2.9776, 1.7456], .1871, .07),
    tapered("长狐吻下与颅底相连的细下颌", light, [[0, 2.55, 1.7], [0, 2.43, 2.38]], [.11, .04]), tapered("狼形臀部连续伸出并收尖的浓毛长尾", fur, [[0, 1.5, -2.05], [-.1, .9, -2.9], [-.5, .5, -3.4], [-.8, .7, -3.7]], [.15, .25, .18, .015])];
  const rearClaws: ModelPart[] = [];
  for (const side of [-1, 1]) {
    const front: Triple = [side * .55, .15, 1.35];
    parts.push(flightFeather("狐首头顶向上舒展的真实尖耳", hide, [side * .14, 3, 1.4], [side * .36, 3.6, 1.2], .28),
      tapered("猎犬胸下方连接长鳞跗的鹰形前腿", hide, [[side * .4, 1.7, 1], [side * .6, .9, 1.12], front], [.18, .11, .06]),
      tapered("完整狼式后肢由臀部经膝跗到接地掌", fur, [[side * .45, 1.5, -1.65], [side * .68, .8, -1.3], [side * .6, .45, -1.9], [side * .63, .14, -1.5]], [.26, .14, .09, .07]), lobe("狼后腿末端完整接地的趾掌", fur, [side * .63, .14, -1.37], [.45, .28, .7]));
    for (const toe of [-1, 0, 1]) parts.push(tapered("鹰形前足各自向前弯下的独立爪趾", pale, [[front[0] + toe * .08, .14, 1.35], [front[0] + toe * .17, .06, 1.85], [front[0] + toe * .19, .03, 2.02]], [.05, .03, .006]));
    parts.push(tapered("鹰形前足向后抵地的独立拇趾", pale, [front, [front[0], .045, 1.02]], [.045, .007]));
    for (let toe = 0; toe < 4; toe++) rearClaws.push(needle("狼形后足各自分开的短硬爪", pale, [side * .63 + (toe - 1.5) * .08, .09, -1.17], [side * .63 + (toe - 1.5) * .085, .045, -.98], .035));
  }
  parts.push(combineMeshes("恩菲尔德兽双狼足前缘完整爪列", pale, rearClaws));
  return parts;
}

function questingBeast(): ModelPart[] {
  const coat = "#b4a78a", mane = "#a6ac92", scales = "#94aa91";
  const parts: ModelPart[] = [lobe("寻兽完整而狭长的豹形胸腹", coat, [0, 1.75, -.1], [1.6, 2, 3.6]), lobe("豹形后腰连接的厚实狮式臀股", coat, [0, 1.65, -1.35], [1.9, 1.9, 1.6]),
    tapered("豹胸前端连续上举并前弯的蛇形长颈", scales, [[0, 2.1, 1.15], [0, 3.1, 1.65], [.25, 4.1, 1.9], [.6, 4.6, 2.6]], [.42, .32, .24, .16]), lobe("长颈末端完整而扁阔的蛇首", scales, [.6, 4.72, 2.85], [.75, .55, 1.1]),
    lobe("蛇首前方收窄的独立上颌", scales, [.6, 4.63, 3.3], [.55, .23, .5]), tapered("蛇首张口下方完整相连的下颌", mane, [[.6, 4.53, 2.6], [.6, 4.3, 3.5]], [.17, .08]), ...eyes([.6, 4.839, 3.0331], .2289, .075),
    tapered("狮式后臀连续伸出的长尾干", coat, [[0, 1.65, -1.8], [.6, 1.3, -2.8], [1.1, 1.6, -3.4]], [.13, .075, .03]), lobe("长尾干末端相连的狮式尾簇", dark, [1.1, 1.6, -3.4], [.35, .35, .5])];
  for (const side of [-1, 1]) {
    parts.push(tapered("豹肩经长前臂连接鹿蹄球节的完整前腿", coat, [[side * .55, 1.8, 1.1], [side * .68, .85, 1.25], [side * .6, .2, 1.4]], [.22, .12, .06]),
      tapered("狮式臀股经膝跗连接鹿蹄的完整后腿", coat, [[side * .6, 1.6, -1.35], [side * .82, .95, -1], [side * .72, .55, -1.6], [side * .68, .2, -1.2]], [.32, .18, .09, .06]),
      needle("寻兽蛇颅上颌内下伸的长牙", pale, [.6 + side * .16, 4.54, 3.26], [.6 + side * .14, 4.32, 3.3], .045));
    for (const front of [false, true]) for (const toe of [-1, 1]) parts.push(part("寻兽四腿末端分离可见的鹿式双瓣蹄", "box", dark, [side * (front ? .6 : .68) + toe * .07, .1, front ? 1.47 : -1.13], [.12, .2, .35]));
  }
  const spots: ModelPart[] = [];
  for (const side of [-1, 1]) for (const [x, y, z] of [[.677, 1.75, -.8], [.677, 1.75, .3], [.601, 2, -.25], [.601, 1.5, -.25]]) spots.push(lobe("豹形胸腹真实表面连接的深色斑块", dark, [side * x!, y!, z!], [.055, .15, .24]));
  parts.push(combineMeshes("寻兽豹形胸腹两侧完整斑纹", dark, spots));
  return parts;
}

export const mythicCreatureExpansionBatchEightDesigns = [
  design("humanFacedZhuyin", "烛阴", "动物", zhuyin, ["Zhuyin", "人首直连无足长蛇躯", "完整盘曲蛇腹", "高举颈端"], "奇幻"),
  design("dogWingedSenmurv", "森穆尔夫", "动物", senmurv, ["Senmurv", "犬首与双狮形前肢", "骨架羽翼", "盘曲蛇式后躯与大尾"], "奇幻"),
  design("heraldicEnfieldBeast", "恩菲尔德兽", "动物", enfield, ["Enfield", "狐首猎犬胸与狮腰腹", "鹰形前肢足爪", "狼式后肢与尾"], "奇幻"),
  design("arthurianQuestingBeast", "亚瑟寻兽", "动物", questingBeast, ["Questing Beast", "蛇首长颈与豹胸腹", "狮臀长尾", "四鹿式分蹄"], "奇幻"),
];
