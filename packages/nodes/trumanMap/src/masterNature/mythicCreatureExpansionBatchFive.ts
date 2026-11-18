import { combineMeshes, design, eyes, lobe, needle, part, tapered, type ModelPart, type Triple } from "./shared";
import { membrane } from "./animals";
import { flightFeather } from "./mythicCreatureExpansionBatchOne";

const skin = "#a8b49a", dark = "#586e5b", pale = "#c0c6aa";

// 以下仅参考具名传统生物的整体解剖，非馆藏器物复刻；场景尺寸是原创设定。
// https://resources.metmuseum.org/resources/metpublications/pdf/Netsuke_The_Metropolitan_Museum_of_Art_Bulletin_v_38_no_2_Fall_1980.pdf
// https://jameelcentre.ashmolean.org/collection/921/per_page/50/offset/0/sort_by/place/category/other/start/993/end/2100/object/16212
// https://pop.culture.gouv.fr/notice/joconde/09020029360
// https://artmuseum.princeton.edu/art/stories-perspectives/collection-publications-centaurs-smile-fantastic-creatures

function kappa(): ModelPart[] {
  const shell = "#83977c";
  const parts: ModelPart[] = [lobe("河童直立而与四肢相接的完整躯干", skin, [0, .9, .12], [1.05, 1.45, .8]),
    part("背部隆起且有内外厚度的完整龟甲", "lathe", shell, [0, .92, -.05], [1, 1, 1.25], [-90, 0, 0], { profile: [{ x: 0, y: .7 }, { x: .4, y: .56 }, { x: .57, y: .29 }, { x: .6, y: .08 }, { x: .56, y: 0 }, { x: .49, y: .02 }, { x: .53, y: .19 }, { x: .4, y: .43 }, { x: 0, y: .6 }] }),
    tapered("河童头颅下方相连的短颈", skin, [[0, 1.4, .15], [0, 1.53, .2]], [.14, .13]),
    part("头顶中央真实内凹而周围有厚唇的皿形头颅", "lathe", skin, [0, 0, .18], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 1.43 }, { x: .2, y: 1.45 }, { x: .34, y: 1.62 }, { x: .38, y: 1.82 }, { x: .34, y: 2.05 }, { x: .28, y: 2.05 }, { x: .27, y: 1.97 }, { x: 0, y: 1.97 }] }),
    lobe("河童前额下连到头颅的猴形脸", skin, [0, 1.75, .52], [.65, .5, .22]), lobe("猴形脸前方短而宽的突出吻部", pale, [0, 1.62, .59], [.36, .2, .2]), ...eyes([0, 1.82, .595], .16, .06),
    tapered("贴合短吻下缘弧面的闭合口线", dark, [[-.1, 1.58, .642], [0, 1.57, .667], [.1, 1.58, .642]], [.009, .009, .009]), part("头皿凹底内保留的浅水面", "cylinder", "#9bb9ad", [0, 1.985, .18], [.5, .012, .5])];
  const hair: ModelPart[] = [];
  for (let index = 0; index < 12; index++) {
    const a = index * Math.PI / 6;
    hair.push(flightFeather("围住皿沿而不遮住凹腔的短发束", dark, [Math.sin(a) * .31, 2.01, .18 + Math.cos(a) * .31], [Math.sin(a) * .47, 2.03, .18 + Math.cos(a) * .47], .15));
  }
  parts.push(combineMeshes("头皿外侧完整环状短发", dark, hair));
  for (const side of [-1, 1]) {
    const ankle: Triple = [side * .4, .12, .45], palm: Triple = [side * .76, 1.03, .62];
    parts.push(tapered("河童由髋部经外展蛙膝到足踝的屈腿", skin, [[side * .26, .7, .1], [side * .62, .4, -.1], ankle], [.19, .13, .07]),
      membrane("蛙式足掌趾间真实展开的蹼", skin, [[ankle[0] - .16, .08, .42], [ankle[0] + .16, .08, .42], [ankle[0] + .28, .025, .98], [ankle[0] - .28, .025, .98]]),
      tapered("河童从肩部经肘部连向抬掌的完整手臂", skin, [[side * .4, 1.25, .15], [side * .62, .85, .25], [side * .74, 1, .6]], [.12, .085, .05]), lobe("与腕部连接而展开的蹼手掌", skin, palm, [.25, .2, .15]));
    for (const toe of [-1, 0, 1]) parts.push(tapered("蛙足由踝部前伸的分离长趾", skin, [[ankle[0] + toe * .11, .07, .45], [ankle[0] + toe * .23, .03, 1.05]], [.035, .015]));
    for (let finger = 0; finger < 4; finger++) parts.push(tapered("河童蹼手前缘各自分开的长指", skin, [[palm[0] + (finger - 1.5) * .052, 1.08, .62], [palm[0] + (finger - 1.5) * .069, 1.29, .65]], [.022, .009]));
    parts.push(membrane("蹼手指根之间连续的小片指蹼", skin, [[palm[0] - .08, 1.04, .63], [palm[0] + .08, 1.04, .63], [palm[0] + .1, 1.2, .64], [palm[0] - .1, 1.2, .64]]));
  }
  return parts;
}

function nue(): ModelPart[] {
  const fur = "#9b9d83", face = "#b9b29a", tiger = "#b9a17a";
  const parts: ModelPart[] = [lobe("鵺由宽腰至胸部完整相接的狸形躯干", fur, [0, 1.3, -.3], [1.9, 1.9, 3.3]), lobe("狸躯前部高厚的肩胸", fur, [0, 1.65, .85], [1.65, 1.7, 1.65]),
    tapered("狸形肩胸向前上接到猴颅的短颈", fur, [[0, 1.85, .9], [0, 2.12, 1.46]], [.41, .28]), lobe("鵺完整的猴形头颅与颊部", fur, [0, 2.3, 1.61], [1.05, 1.15, .92]),
    lobe("猴颅前方收窄而向下连颌的脸盘", face, [0, 2.25, 1.93], [.7, .85, .31]), lobe("猴形面中央宽短的鼻口部", face, [0, 2.1, 2.06], [.43, .32, .25]), ...eyes([0, 2.41, 2.01], .175, .075),
    tapered("猴形吻部前方贴合颌面的闭合嘴线", dark, [[-.12, 2.03, 2.132], [0, 2.02, 2.165], [.12, 2.03, 2.132]], [.012, .012, .012]),
    tapered("从狸躯臀部延出的完整蛇形长尾", fur, [[0, 1.35, -1.6], [-.55, 1.05, -2.4], [-1.4, 1.45, -2.85], [-1.6, 2.1, -2.55], [-1.3, 2.43, -2.1]], [.19, .15, .12, .1, .075]),
    lobe("蛇尾末端拥有独立颌部的蛇首", fur, [-1.25, 2.47, -1.97], [.4, .3, .65]), ...eyes([-1.25, 2.545, -1.87], .112, .04)];
  for (const side of [-1, 1]) {
    parts.push(lobe("与猴颅颞部相接的圆形外耳", fur, [side * .43, 2.35, 1.56], [.28, .4, .16]));
    for (const front of [false, true]) {
      const root: Triple = [side * .56, front ? 1.55 : 1.28, front ? .9 : -1.25], knee: Triple = [side * .8, .7, front ? .95 : -1.5], ankle: Triple = [side * .7, .2, front ? 1.1 : -1.03];
      parts.push(tapered("鵺狸躯下独立承重的完整虎形腿", tiger, [root, knee, ankle], [.28, .17, .09]), lobe("虎腿末端与腕踝相连的宽厚猫科掌", tiger, [ankle[0], .13, ankle[2] + .13], [.55, .28, .7]));
      const toes: ModelPart[] = [];
      for (let toe = 0; toe < 4; toe++) toes.push(lobe("虎掌前方真实分开的四枚圆趾", tiger, [ankle[0] + (toe - 1.5) * .1, .09, ankle[2] + .36], [.14, .18, .3]));
      parts.push(combineMeshes("单只虎足前缘的完整分趾", tiger, toes));
      for (const t of [.25, .66]) {
        const start = knee.map((value, axis) => value + (ankle[axis]! - value) * (t - .055)) as Triple, end = knee.map((value, axis) => value + (ankle[axis]! - value) * (t + .055)) as Triple;
        parts.push(tapered("虎足下腿表面连接的深色横纹", dark, [start, end], [.17 + (.09 - .17) * (t - .055) + .008, .17 + (.09 - .17) * (t + .055) + .008]));
      }
    }
  }
  return parts;
}

function tarasque(): ModelPart[] {
  const shell = "#84947e", hide = "#a4ab8d", mane = "#667e68";
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const [y, rx, rz] of [[1.15, 1.7, 2.8], [1.8, 1.9, 3], [2.6, 1.1, 1.65]]) for (let index = 0; index < 8; index++) { const a = index * Math.PI / 4; vertices.push({ x: Math.cos(a) * rx!, y: y!, z: Math.sin(a) * rz! }); }
  for (let row = 0; row < 2; row++) for (let index = 0; index < 8; index++) { const a = row * 8 + index, c = row * 8 + (index + 1) % 8, b = a + 8, d = c + 8; indices.push(a, b, c, c, b, d); }
  vertices.push({ x: 0, y: 2.95, z: 0 }, { x: 0, y: 1.15, z: 0 });
  for (let index = 0; index < 8; index++) indices.push(16 + index, 24, 16 + (index + 1) % 8, 25, index, (index + 1) % 8);
  const neck = tapered("龟甲前端向外接到狮首的完整粗颈", hide, [[0, 1.6, 2.2], [0, 2, 3.1], [0, 2.12, 3.35]], [.75, .6, .45]);
  const parts: ModelPart[] = [part("塔拉斯克前后连成且背部隆起的完整龟甲", "mesh", shell, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }),
    lobe("龟甲下覆盖六肢根部的连续腹甲", hide, [0, 1.1, 0], [3.7, .9, 5.7]), neck, lobe("塔拉斯克具有狮额与颊部的完整头颅", hide, [0, 2.2, 3.55], [1.4, 1.3, 1.4]),
    lobe("狮首前方宽厚而分明的鼻吻", hide, [0, 2, 4.05], [1, .65, 1]), lobe("狮吻末端独立的鼻盘", dark, [0, 2.06, 4.39], [.5, .25, .16]), ...eyes([0, 2.4, 3.9], .4, .11),
    tapered("狮首张口下方相连的厚实下颌", hide, [[0, 1.83, 3.55], [0, 1.6, 4.16]], [.3, .2]),
    tapered("从龟甲后部连续伸出的爬行类长尾", hide, [[0, 1.5, -2.5], [-.3, 1.4, -3.5], [1, 1.7, -4.5], [1.5, 2, -5.2]], [.38, .3, .15, .01])];
  const spines: ModelPart[] = [], locks: ModelPart[] = [];
  for (const z of [-2.2, -1.4, -.6, .3, 1.2, 2.1]) {
    const d = Math.abs(z), y = d <= 1.65 ? 2.95 - d * .35 / 1.65 : 2.6 - (d - 1.65) * .8 / 1.35;
    spines.push(needle("从真实背甲中脊长出的独立尖棘", shell, [0, y - .04, z], [0, y + .8, z - .25], .3));
  }
  for (let index = 0; index < 8; index++) {
    const a = index * Math.PI / 4;
    spines.push(needle("背甲侧缘按甲面连接的外展尖棘", shell, [Math.cos(a) * 1.88, 1.79, Math.sin(a) * 2.98], [Math.cos(a) * 2.5, 2.3, Math.sin(a) * 3.6], .26));
  }
  const collar = neck.vertices!.slice(8, 16);
  for (let index = 0; index < 12; index++) {
    const t = index / 12 * 8, a = collar[Math.floor(t)]!, b = collar[(Math.floor(t) + 1) % 8]!, f = t - Math.floor(t), start: Triple = [a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f];
    locks.push(flightFeather("狮颈上沿真实颈截环连接的粗鬃", mane, start, [start[0] * 1.4, 2 + (start[1] - 2) * 1.4, start[2] - .5], .42));
  }
  parts.push(combineMeshes("塔拉斯克背甲完整刺脊与侧棘", shell, spines), combineMeshes("塔拉斯克狮颈周围完整粗鬃", mane, locks));
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(lobe("与狮首颞区相连的圆形双耳", hide, [side * .48, 2.6, 3.32], [.32, .4, .23]));
    for (const z of [-1.7, 0, 1.7]) {
      const ankle: Triple = [side * 2, .2, z + .45];
      parts.push(tapered("龟甲腹部到外展关节再落地的完整承重腿", hide, [[side * 1.1, 1.3, z], [side * 1.8, .65, z + .15], ankle], [.32, .25, .14]), lobe("六条承重腿各自接地的宽厚爪掌", hide, [ankle[0], .14, ankle[2] + .12], [.75, .28, .8]));
      const claws: ModelPart[] = [];
      for (let toe = 0; toe < 3; toe++) claws.push(needle("六足掌前缘分开的长爪", pale, [ankle[0] + (toe - 1) * .19, .1, ankle[2] + .3], [ankle[0] + (toe - 1) * .22, .045, ankle[2] + .6], .08));
      parts.push(combineMeshes("单个甲兽足掌的分离爪列", pale, claws));
    }
    for (let index = 0; index < 4; index++) teeth.push(needle("狮吻上颌中向下伸出的锐齿", pale, [side * (.16 + index * .065), 1.9, 3.85 + index * .11], [side * (.16 + index * .065), 1.65, 3.88 + index * .11], .065));
  }
  parts.push(combineMeshes("狮首张口内完整相连的上颌齿列", pale, teeth));
  return parts;
}

function siren(): ModelPart[] {
  const plumage = "#8eaa99", feather = "#b3c1ab", human = "#bcae96";
  const parts: ModelPart[] = [lobe("塞壬从鸟胸到腹部完整相接的羽躯", plumage, [0, 1.4, -.1], [1.5, 1.9, 2.3]),
    tapered("鸟躯前部上举并连接人首的羽颈", plumage, [[0, 2, .5], [0, 2.5, .75]], [.25, .16]), lobe("塞壬具有完整人类额颊与下颌的人首", human, [0, 2.85, .82], [.6, .75, .58]), ...eyes([0, 2.957, .993], .148, .058),
    lobe("人首脸部中央相连的鼻梁", human, [0, 2.86, 1.08], [.1, .17, .14]), tapered("贴合人首下颌前缘的细口线", dark, [[-.1, 2.71, 1.028], [0, 2.69, 1.067], [.1, 2.71, 1.028]], [.01, .01, .01])];
  for (const side of [-1, 1]) {
    const shoulder: Triple = [side * .45, 1.85, .2], elbow: Triple = [side * 1.45, 2.6, 0], wrist: Triple = [side * 2.8, 2.9, -.2], ankle: Triple = [side * .45, .18, .2];
    parts.push(tapered("鸟腹下从股部经跗节落地的完整鸟腿", plumage, [[side * .35, 1.2, .1], [side * .5, .6, -.1], ankle], [.15, .1, .055]),
      tapered("由鸟胸侧面伸出的完整肩肘腕翼骨", plumage, [shoulder, elbow, wrist], [.17, .12, .045]), membrane("鸟躯至翼腕相连的连续覆羽面", feather, [shoulder, elbow, wrist, [side * 1.8, 1.9, -1.05], [side * .4, 1.5, -.8]]));
    for (const toe of [-1, 0, 1]) parts.push(tapered("塞壬鸟足前方各自分开的长趾爪", pale, [[ankle[0] + toe * .08, .14, .2], [ankle[0] + toe * .16, .055, .65], [ankle[0] + toe * .18, .025, .8]], [.045, .027, .006]));
    parts.push(tapered("鸟足后方抵地的独立拇趾", pale, [ankle, [ankle[0], .045, -.2]], [.04, .007]));
    const feathers: ModelPart[] = [];
    for (let index = 0; index < 11; index++) {
      const t = index / 10, a = t < .5 ? shoulder : elbow, b = t < .5 ? elbow : wrist, f = t < .5 ? t * 2 : (t - .5) * 2, start = a.map((value, axis) => value + (b[axis]! - value) * f) as Triple;
      feathers.push(flightFeather("塞壬由实际翼骨长出的长飞羽", feather, start, [start[0] + side * (.8 + t), start[1] - .2, start[2] - 1.3 - t * .6], .38));
    }
    parts.push(combineMeshes("塞壬单侧完整的长羽翼缘", feather, feathers));
  }
  const tail: ModelPart[] = [], hair: ModelPart[] = [];
  for (let index = 0; index < 5; index++) tail.push(flightFeather("塞壬鸟躯末端相连的长扇尾羽", feather, [(index - 2) * .05, 1, -.94], [(index - 2) * .43, .5, -2.8 + Math.abs(index - 2) * .1], .4));
  for (const side of [-1, 1]) for (let index = 0; index < 3; index++) hair.push(tapered("从人首侧后头皮垂落的长发束", dark, [[side * (.14 + index * .01), 3, .73 - index * .025], [side * (.25 + index * .025), 2.76, .6 - index * .03], [side * (.25 + index * .04), 2.45, .5 - index * .04]], [.055, .045, .008]));
  parts.push(combineMeshes("塞壬完整的长扇尾", feather, tail), combineMeshes("塞壬人首两侧相连的长发", dark, hair));
  return parts;
}

export const mythicCreatureExpansionBatchFiveDesigns = [
  design("folkloricKappa", "河童", "动物", kappa, ["Kappa", "直立龟甲躯干", "蛙腿与蹼手蹼足", "头顶真实凹皿"], "奇幻"),
  design("japaneseNue", "鵺", "动物", nue, ["Nue", "猴首与狸形胸腹", "完整虎足", "蛇形长尾"], "奇幻"),
  design("provencalTarasque", "塔拉斯克", "动物", tarasque, ["Tarasque", "龟甲刺背与六条承重腿", "狮首与粗鬃", "爬行类长尾"], "奇幻"),
  design("greekBirdSiren", "古希腊塞壬", "动物", siren, ["Siren", "人首与完整鸟胸鸟躯", "骨架羽翼", "鸟足与长尾羽"], "奇幻"),
];
