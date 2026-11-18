import { combineMeshes, design, eyes, lobe, needle, part, tapered, type ModelPart, type Triple } from "./shared";
import { membrane } from "./animals";
import { flightFeather } from "./mythicCreatureExpansionBatchOne";

const dark = "#5c6e60", ivory = "#c8c9b4";

// 原创静态诠释，母题依据：帝江无面囊躯六足四翼，络新妇人蛛结合，狼人直立混合躯，Nuckelavee马背生长的人胸。
// https://ctext.org/shan-hai-jing/xi-shan-jing/zh
// https://archive.keiyou.jp/kawasaki_test/Viewer/IFViewer?archiveId=kawasaki_books&doi=0447544/01800000d4&p=2&tl=0
// https://museum.hautes-alpes.fr/app/uploads/2024/06/Dossier-pedagogique-nuit-corrige.pdf
// https://folklorescotland.com/nuckelavee/
// 固定各一完整主体，未引用现代影视造型；Nuckelavee采用中性完整表面，未加入血肉细节。

function dijiang(): ModelPart[] {
  const body = "#b58f7c", plume = "#c1b398";
  const parts: ModelPart[] = [lobe("帝江没有头颈和五官的完整浑圆囊躯", body, [0, 2.5, 0], [3.9, 3.6, 5.3])];
  for (const side of [-1, 1]) {
    for (const z of [-1.3, 0, 1.3]) parts.push(tapered("帝江囊躯下独立相连的屈曲承重腿", body, [[side * 1.1, 1.8, z], [side * 1.45, .95, z + .2], [side * 1.4, .15, z + .5]], [.3, .22, .12]),
      lobe("六条腿各自接地的宽圆足掌", body, [side * 1.4, .15, z + .61], [.8, .3, 1.1]));
    for (const front of [false, true]) {
      const shoulder: Triple = [side * 1.2, 2.7, front ? .9 : -.9], elbow: Triple = [side * 2.8, front ? 4.5 : 3.55, front ? 1.25 : -1.6], wrist: Triple = [side * (front ? 4.6 : 4.2), front ? 5.15 : 4.05, front ? 1.1 : -2.1];
      parts.push(tapered("囊躯侧面独立长出的完整肩肘腕翼骨", body, [shoulder, elbow, wrist], [.25, .16, .07]), membrane("帝江单翼由肩背连续接至翼腕的羽覆面", plume, [shoulder, elbow, wrist, [side * 2.8, front ? 3.7 : 3, front ? -.3 : -3], [side * 1.1, 2.4, front ? -.15 : -1.7]]));
      const feathers: ModelPart[] = [];
      for (let index = 0; index < 10; index++) {
        const t = index / 9, a = t < .5 ? shoulder : elbow, b = t < .5 ? elbow : wrist, f = t < .5 ? t * 2 : (t - .5) * 2, start = a.map((value, axis) => value + (b[axis]! - value) * f) as Triple;
        feathers.push(flightFeather("帝江羽翼上根部接入真实翼骨的长羽", plume, start, [start[0] + side * (.8 + t * .9), start[1] - .35, start[2] - 1.15 - t * .6], .5));
      }
      parts.push(combineMeshes("帝江单翼完整长飞羽列", plume, feathers));
    }
  }
  return parts;
}

function jorogumo(): ModelPart[] {
  const chitin = "#7f9485", robe = "#9bac9a", human = "#bdaf98";
  const parts: ModelPart[] = [lobe("络新妇后方完整隆起的蜘蛛腹部", chitin, [0, 1.2, -.6], [2.8, 2.4, 3.8]), lobe("与腹部相接并承托八条腿的真实头胸部", chitin, [0, 1.15, 1], [1.8, 1.1, 1.8]),
    tapered("从蜘蛛头胸内部连续长出的着衣腰胸", robe, [[0, 1.4, 1.2], [0, 1.95, 1.2], [0, 2.55, 1.22]], [.28, .3, .31]), lobe("人蛛上躯完整的着衣肩胸", robe, [0, 2.25, 1.2], [1.05, 1.35, .6]),
    tapered("人形肩胸上相连的细颈", human, [[0, 2.72, 1.24], [0, 2.89, 1.28]], [.13, .115]), lobe("络新妇具有完整额颊与下颌的人首", human, [0, 3.15, 1.3], [.7, .85, .65]), ...eyes([0, 3.262, 1.5055], .168, .065),
    lobe("人首中央与面颊相接的鼻梁", human, [0, 3.15, 1.59], [.12, .2, .14]), tapered("沿人首下颌前缘闭合的细口线", dark, [[-.11, 3, 1.53], [0, 2.99, 1.575], [.11, 3, 1.53]], [.01, .01, .01]),
    lobe("与头皮相接而向后收束的完整发冠", dark, [0, 3.37, 1.24], [.75, .48, .7]), tapered("从发冠垂落到颈后的长发束", dark, [[0, 3.4, 1.1], [0, 3.1, .98], [0, 2.75, .93]], [.15, .13, .025])];
  const legLayout = [[.45, -1.1, -1.9, 1.8, 2, 2.9], [.8, .1, -.1, 2.1, 2.25, 3.5], [1.15, 1.6, 1.9, 2.15, 2.2, 3.4], [1.5, 2.8, 3.7, 1.8, 1.9, 2.75]];
  for (const side of [-1, 1]) {
    for (const [rootZ, jointZ, endZ, high, jointX, endX] of legLayout) parts.push(tapered("蛛胸侧面经高举膝节再落地的独立长肢", chitin, [[side * .5, 1.25, rootZ!], [side * jointX!, high!, jointZ!], [side * endX!, .045, endZ!]], [.16, .12, .015]));
    parts.push(tapered("蜘蛛头胸前缘各自弯下的螯肢", dark, [[side * .28, 1.1, 1.6], [side * .4, .9, 2], [side * .25, .7, 2.1]], [.1, .08, .01]),
      tapered("人形肩部连至抬掌的完整双臂", human, [[side * .4, 2.6, 1.2], [side * .8, 2.2, 1.45], [side * 1, 2.4, 1.8]], [.14, .1, .065]), lobe("人蛛上躯与腕部相连的手掌", human, [side * 1.02, 2.47, 1.83], [.21, .3, .13]));
    for (let finger = 0; finger < 4; finger++) parts.push(tapered("人形手掌各自分开的细长指", human, [[side * 1.02 + (finger - 1.5) * .04, 2.55, 1.83], [side * 1.03 + (finger - 1.5) * .042, 2.75, 1.84]], [.018, .008]));
    parts.push(tapered("从人掌侧方相连的独立拇指", human, [[side * .94, 2.48, 1.86], [side * .84, 2.61, 1.95]], [.024, .01]));
  }
  for (const x of [-.18, 0, .18]) parts.push(tapered("蜘蛛腹部后端相连的短纺器", chitin, [[x, 1.15, -2.05], [x * 1.3, 1.05, -2.48]], [.09, .018]));
  return parts;
}

function werewolf(): ModelPart[] {
  const fur = "#929d8c", light = "#b3b6a0";
  const neck = tapered("狼人肩背前倾而接到犬颅的粗颈", fur, [[0, 2.65, .05], [0, 2.9, .35]], [.3, .23]);
  const parts: ModelPart[] = [lobe("狼人人形肩带下完整而深长的胸腹", fur, [0, 2, 0], [1.5, 1.9, 1]), lobe("收窄腰腹与双腿相接的狼形骨盆", fur, [0, 1.3, -.1], [.95, .8, .8]),
    lobe("前倾头颈后高耸而连续的厚肩背", fur, [0, 2.5, -.15], [1.7, 1, 1.1]), neck, lobe("狼人长额面与强颌相接的完整犬颅", fur, [0, 3.13, .48], [.86, 1, 1.1]),
    lobe("犬颅前方连续伸出的长吻与上颌", light, [0, 3, .97], [.56, .45, .85]), lobe("长吻末端相连的独立深色鼻头", dark, [0, 3.05, 1.27], [.35, .25, .17]), ...eyes([0, 3.302, .724], .253, .085),
    tapered("狼人张口下方与颅底相连的下颌", fur, [[0, 2.85, .55], [0, 2.7, 1.22]], [.2, .12]),
    tapered("由骨盆后部连续伸出的浓毛长尾", fur, [[0, 1.4, -.39], [.4, 1.12, -1.2], [.8, .8, -1.65]], [.19, .14, .015])];
  const claws: ModelPart[] = [], teeth: ModelPart[] = [], ruff: ModelPart[] = [];
  const collar = neck.vertices!.slice(0, 8);
  for (let index = 0; index < 8; index++) {
    const p = collar[index]!;
    ruff.push(flightFeather("从实际颈根截环向外垂落的粗毛束", fur, [p.x, p.y, p.z], [p.x * 1.5, 2.65 + (p.y - 2.65) * 1.5 - .28, p.z - .18], .28));
  }
  for (const side of [-1, 1]) {
    parts.push(flightFeather("狼人犬颅上真实相连的长尖耳", fur, [side * .15, 3.35, .35], [side * .4, 4.12, .28], .26),
      tapered("由狼形骨盆经膝跗关节到趾掌的完整趾行腿", fur, [[side * .3, 1.45, -.05], [side * .48, .8, .18], [side * .42, .45, -.26], [side * .44, .1, .45]], [.25, .16, .09, .08]),
      lobe("狼式下肢末端真正接地的前足掌", fur, [side * .44, .11, .51], [.5, .22, .6]), tapered("人形肩带向下连接肘腕的长双臂", fur, [[side * .6, 2.6, -.02], [side * 1, 1.95, .35], [side * 1.05, 1.25, .7]], [.23, .17, .1]),
      lobe("长臂末端具有分指结构的完整爪掌", fur, [side * 1.05, 1.1, .72], [.36, .5, .25]));
    const toes: ModelPart[] = [];
    for (let toe = 0; toe < 4; toe++) {
      toes.push(lobe("狼人接地足掌前方的分离四趾", fur, [side * .44 + (toe - 1.5) * .09, .09, .72], [.12, .18, .26]));
      claws.push(needle("狼足分趾末端向前弯出的硬爪", ivory, [side * .44 + (toe - 1.5) * .09, .08, .79], [side * .44 + (toe - 1.5) * .09, .04, .96], .035));
      const x = side * 1.05 + (toe - 1.5) * .07;
      parts.push(tapered("狼人长掌前缘分节而各自分离的弯指", fur, [[x, 1.02, .75], [x, .7, .9], [x, .65, .98]], [.035, .025, .012]));
      claws.push(needle("人形长指末端相连的弯爪", ivory, [x, .65, .98], [x, .6, 1.07], .025));
    }
    parts.push(combineMeshes("狼人单只足掌前方的完整分趾", fur, toes), tapered("狼人手掌侧面弯出的对握拇指", fur, [[side * .91, 1.18, .75], [side * .78, .91, .97]], [.05, .02]));
    claws.push(needle("对握拇指末端相连的独立尖爪", ivory, [side * .78, .91, .97], [side * .76, .79, 1.05], .028));
    teeth.push(needle("犬吻上颌向下伸出的长犬齿", ivory, [side * .16, 2.88, 1.1], [side * .145, 2.7, 1.15], .055));
  }
  parts.push(combineMeshes("狼人颈根完整的粗毛领", fur, ruff), combineMeshes("狼人双掌和双足上相连的尖爪", ivory, claws), combineMeshes("狼人张口内成对的上颌犬齿", ivory, teeth));
  return parts;
}

function nuckelavee(): ModelPart[] {
  const surface = "#a99f8a", inner = "#b8b49a";
  const parts: ModelPart[] = [lobe("Nuckelavee从肩胸至臀部完整连成的马躯", surface, [0, 1.7, 0], [1.8, 2, 4.3]), lobe("马颈下与前肢相接的完整高肩胸", surface, [0, 2, 1.35], [1.7, 1.8, 1.5]),
    tapered("在马躯前端保留的完整马颈", surface, [[0, 2.2, 1.4], [0, 2.8, 1.85], [0, 3.1, 2.2]], [.4, .32, .25]), lobe("马颈末端具有额部和长面的完整马首", surface, [0, 3.15, 2.4], [.8, .9, 1.2]),
    lobe("马首前方宽大而向下垂的长吻", surface, [0, 2.9, 2.95], [.65, .5, .75]), lobe("马首额部中央的单枚完整大眼", inner, [0, 3.42, 2.79], [.3, .28, .18]), lobe("中央单眼前方的深色圆瞳", dark, [0, 3.42, 2.85], [.13, .15, .07]),
    tapered("从马背中段内部向上连续长出的人形腰胸", surface, [[0, 2.1, -.3], [0, 3, -.3], [0, 4.3, -.15]], [.48, .5, .64]), lobe("与马背腰干融为一体的宽大人胸肩带", surface, [0, 3.8, -.15], [2.1, 2.4, 1.05]),
    tapered("人形肩胸向上承托头颅的粗颈", surface, [[0, 4.5, -.1], [0, 4.95, 0]], [.28, .3]), lobe("马背人躯上完整而硕大的人形头颅", surface, [0, 5.35, -.05], [1.35, 1.45, 1.1]), ...eyes([0, 5.52, .309], .3305, .09),
    lobe("巨大人首中央突起的宽鼻", surface, [0, 5.29, .43], [.26, .4, .24]), tapered("巨大人首下颌前缘闭合的嘴线", dark, [[-.22, 5.08, .3], [0, 5.03, .41], [.22, 5.08, .3]], [.018, .018, .018]),
    tapered("马躯后端连续垂落的长尾", surface, [[0, 1.7, -1.9], [.25, 1.1, -2.5], [.4, .6, -2.7]], [.14, .1, .015])];
  for (const side of [-1, 1]) {
    parts.push(flightFeather("完整马首头顶相连的长耳", surface, [side * .16, 3.36, 2.25], [side * .4, 3.95, 2.15], .2),
      tapered("人胸肩部直到近地手掌的连续超长双臂", surface, [[side * .8, 4.45, -.1], [side * 1.4, 2.6, .35], [side * 1.3, .65, .85]], [.27, .21, .12]), lobe("长臂末端近地但与腕部相连的人掌", surface, [side * 1.3, .5, .85], [.5, .65, .3]));
    for (let finger = 0; finger < 4; finger++) parts.push(tapered("巨大人掌各自分离并弯向地面的长指", surface, [[side * 1.3 + (finger - 1.5) * .095, .34, .91], [side * 1.3 + (finger - 1.5) * .1, .12, 1.02]], [.045, .018]));
    parts.push(tapered("巨大人掌侧面真实相连的独立拇指", surface, [[side * 1.1, .58, .87], [side * .91, .32, 1.01]], [.06, .025]));
    for (const front of [false, true]) {
      const knee: Triple = [side * (front ? .65 : .75), front ? .9 : .85, front ? 1.55 : -1.1], ankle: Triple = [side * (front ? .62 : .68), .2, front ? 1.35 : -1.25];
      parts.push(tapered("完整马躯下经膝跗落地的独立长腿", surface, front ? [[side * .55, 1.7, 1.35], knee, ankle] : [[side * .55, 1.6, -1.5], knee, [side * .7, .6, -1.65], ankle], front ? [.25, .14, .075] : [.31, .18, .12, .075]),
        part("四条马腿各自接地的完整单蹄", "box", dark, [ankle[0], .2, ankle[2] + .13], [.34, .4, .5]));
      const root: Triple = [ankle[0], .38, ankle[2]];
      parts.push(flightFeather("马肢下段从骨架相连的侧向鳍叶", inner, root, [root[0] + side * .45, .28, root[2] - .15], .32));
    }
  }
  return parts;
}

export const mythicCreatureExpansionBatchSixDesigns = [
  design("facelessDijiang", "帝江", "动物", dijiang, ["Dijiang", "无面囊躯", "六条承重足", "四片骨架羽翼"], "奇幻"),
  design("spiderWomanJorogumo", "络新妇", "动物", jorogumo, ["Jorogumo", "连续人形肩臂与蜘蛛头胸腹", "八条分节步足", "腹部纺器"], "奇幻"),
  design("bipedalWerewolf", "狼人", "动物", werewolf, ["Werewolf", "人形肩臂与五指爪掌", "趾行狼腿", "犬颅尖耳与长尾"], "奇幻"),
  design("orcadianNuckelavee", "努克拉维", "动物", nuckelavee, ["Nuckelavee", "完整马颈马首与四蹄", "从马背中段相连的人胸", "近地长臂与马肢侧鳍"], "奇幻"),
];
