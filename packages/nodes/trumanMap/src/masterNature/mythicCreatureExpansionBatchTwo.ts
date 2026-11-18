import { combineMeshes, design, eyes, lobe, needle, part, tapered, type ModelPart, type Triple } from "./shared";
import { membrane } from "./animals";
import { flightFeather } from "./mythicCreatureExpansionBatchOne";

const pale = "#c3c8b8", feather = "#adbba8", dark = "#637468", hide = "#a3967c", skin = "#b7aa94";

// 只借用传统物种的解剖定义，模型为原创静态形体，不下载馆藏或影视模型。
// https://www.nga.gov/artworks/178899-roger-and-angelica-hippogriff
// https://www.metmuseum.org/art/collection/search/195356
// https://www.getty.edu/publications/romanmosaics/catalogue/1/index.html
// https://www.metmuseum.org/art/collection/search/722156

function hookedToes(parts: ModelPart[], foot: Triple) {
  for (const side of [-1, 0, 1]) parts.push(tapered("鹰足前伸再向下弯的独立爪趾", pale, [[foot[0] + side * .14, foot[1], foot[2]], [foot[0] + side * .19, .13, foot[2] + .45], [foot[0] + side * .2, .04, foot[2] + .58]], [.055, .034, .006]));
  parts.push(tapered("猛禽足后方抵地的独立拇趾", pale, [foot, [foot[0], .07, foot[2] - .35]], [.055, .008]));
}

function hippogriff(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鹰马狭长而完整的马形后胸腹", hide, [0, 1.7, -.35], [1.4, 1.75, 3.25]), lobe("连接翼根与鹰颈的厚羽胸", feather, [0, 2.2, 1], [1.4, 2, 1.8]),
    tapered("鹰马前胸上方的直立羽颈", feather, [[0, 2.5, 1.15], [0, 3.4, 1.6]], [.42, .27]), lobe("鹰马前半身猛禽头颅", feather, [0, 3.5, 1.8], [.75, .8, 1]),
    tapered("向下弯钩的坚硬上喙", pale, [[0, 3.45, 2.1], [0, 3.3, 2.62], [0, 3.04, 2.68]], [.2, .11, .007]), ...eyes([0, 3.6323, 2.0079], .2362, .095)];
  for (const side of [-1, 1]) {
    parts.push(tapered("鹰马有长鳞跗部的鹰形前腿", feather, [[side * .45, 2.15, 1], [side * .68, 1.15, 1.13], [side * .62, .23, 1.5]], [.22, .13, .08]),
      tapered("鹰马具有马膝和跗节的长后腿", hide, [[side * .5, 1.7, -1.35], [side * .64, .9, -1.7], [side * .63, .2, -1.15]], [.26, .13, .07]), part("鹰马后肢末端完整单蹄", "box", dark, [side * .63, .11, -1.05], [.3, .22, .46]));
    hookedToes(parts, [side * .62, .23, 1.5]);
    const shoulder: Triple = [side * .5, 2.6, .8], elbow: Triple = [side * 2.2, 3.9, .15], wrist: Triple = [side * 3.45, 4.1, -.2];
    parts.push(tapered("完整鹰翼从前胸肩部伸出并在腕部转折", feather, [shoulder, elbow, wrist], [.24, .15, .07]), membrane("鹰翼的连续羽覆肩面", feather, [shoulder, elbow, wrist, [side * 2.05, 3.1, -1.2], [side * .55, 2.4, -.55]]));
    const feathers: ModelPart[] = [];
    for (let index = 0; index < 11; index++) {
      const t = index / 10, a = t < .5 ? shoulder : elbow, b = t < .5 ? elbow : wrist, f = t < .5 ? t * 2 : (t - .5) * 2;
      const start = a.map((value, axis) => value + (b[axis]! - value) * f) as Triple;
      feathers.push(flightFeather("鹰马翼缘按前臂与翼腕连接的独立飞羽", feather, start, [start[0] + side * (1.1 + t * 1.45), start[1] - .45, start[2] - 1.5 - t * .7], .48));
    }
    parts.push(combineMeshes("鹰马单侧翼的完整重叠飞羽列", feather, feathers));
  }
  for (let index = 0; index < 5; index++) parts.push(tapered("马形后躯末端连续垂落的长尾毛束", dark, [[(index - 2) * .025, 1.8, -1.6], [(index - 2) * .045, 1.4, -2.35], [(index - 2) * .07, .6, -2.75]], [.07, .055, .009]));
  return parts;
}

function pegasus(): ModelPart[] {
  const body = "#c0c6b7", mane = "#a3b29f";
  const neck = tapered("高举而上段向前弯出的完整马颈", body, [[0, 1.95, .9], [0, 2.7, 1.4], [0, 3.1, 1.8]], [.38, .27, .19]);
  const parts: ModelPart[] = [lobe("飞马从肩胸至后腰完整相接的马躯", body, [0, 1.65, -.3], [1.35, 1.7, 3.3]), lobe("飞马翼根前方高耸的肩峰", body, [0, 1.95, .8], [1.3, 1.5, 1.5]),
    neck, lobe("飞马有眼眶与长面的头颅", body, [0, 3.1, 1.95], [.62, .76, 1.15]),
    lobe("略向下垂的宽圆马吻", body, [0, 2.8, 2.48], [.53, .45, .63]), ...eyes([0, 3.2068, 2.1637], .2243, .07)];
  for (const side of [-1, 1]) {
    const shoulder: Triple = [side * .45, 2.2, .65], elbow: Triple = [side * 2, 3.6, .45], wrist: Triple = [side * 3.7, 4.4, .4];
    parts.push(tapered("飞马前腿从肩肘到球节的完整支承", body, [[side * .45, 1.7, .85], [side * .52, .9, 1.12], [side * .51, .2, .98]], [.19, .11, .065]),
      tapered("飞马后腿由股部到反折跗部的完整支承", body, [[side * .47, 1.65, -1.35], [side * .61, .9, -1.7], [side * .6, .2, -1.13]], [.26, .13, .065]),
      part("前肢接地单蹄", "box", dark, [side * .51, .11, 1.07], [.28, .22, .43]), part("后肢接地单蹄", "box", dark, [side * .6, .11, -1.03], [.29, .22, .45]),
      flightFeather("飞马头顶向上舒展的长耳", mane, [side * .17, 3.32, 1.65], [side * .26, 3.92, 1.6], .18),
      tapered("飞马背部宽肩连接的羽翼骨架", body, [shoulder, elbow, wrist], [.24, .15, .07]),
      membrane("飞马肩背至翼腕连续的覆羽层", body, [[side * .45, 2.2, .65], [side * 2, 3.6, .45], [side * 3.7, 4.4, .4], [side * 2.2, 3, -1.25], [side * .45, 2, -.8]]));
    const feathers: ModelPart[] = [];
    for (let index = 0; index < 12; index++) {
      const t = index / 11, a = t < .5 ? shoulder : elbow, b = t < .5 ? elbow : wrist, f = t < .5 ? t * 2 : (t - .5) * 2;
      const start = a.map((value, axis) => value + (b[axis]! - value) * f) as Triple;
      feathers.push(flightFeather("从飞马翼骨实际长出的长飞羽", body, start, [start[0] + side * (1.3 + t * 1.5), start[1] - .55, start[2] - 1.6 - t * .8], .55));
    }
    parts.push(combineMeshes("飞马单侧完整羽翼外缘", body, feathers));
  }
  const back = Array.from({ length: 3 }, (_, index) => neck.vertices!.slice(index * 8, index * 8 + 8).reduce((a, b) => b.z < a.z ? b : a));
  for (let index = 0; index < 7; index++) {
    const t = index / 3, segment = Math.min(1, Math.floor(t)), f = t - segment, a = back[segment]!, b = back[segment + 1]!;
    const start: Triple = [a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f + .025];
    parts.push(flightFeather("沿真实颈后表面连接的马鬃束", mane, start, [start[0], start[1] + .1, start[2] - .35], .24), tapered("飞马尾根下垂的长毛束", mane, [[(index - 3) * .025, 1.8, -1.55], [(index - 3) * .045, 1.25, -2.4], [(index - 3) * .05, .4, -2.55]], [.065, .045, .007]));
  }
  return parts;
}

function medusa(): ModelPart[] {
  const robe = "#879f92", snake = "#738d75";
  const parts: ModelPart[] = [lobe("蛇发女怪完整着衣的肩胸", robe, [0, 2.12, 0], [.85, 1.05, .5]),
    part("下摆有内外壁厚的长袍", "lathe", robe, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .6, y: .6 }, { x: .45, y: 1.3 }, { x: .35, y: 1.9 }, { x: .36, y: 2.4 }, { x: .27, y: 2.55 }, { x: .21, y: 2.5 }, { x: .28, y: 1.9 }, { x: .39, y: 1.3 }, { x: .54, y: .6 }, { x: .6, y: .6 }] }),
    tapered("衣领之上连接头颅的颈", skin, [[0, 2.5, .02], [0, 2.75, .06]], [.13, .12]), lobe("蛇发女怪完整人形头颅", skin, [0, 2.98, .08], [.65, .78, .62]), ...eyes([0, 3.0772, .2826], .1539, .06),
    lobe("面部前突的鼻梁", skin, [0, 2.95, .39], [.12, .2, .16]), tapered("沿真实下颌前缘贴合的闭合嘴线", dark, [[-.1, 2.79, .26], [0, 2.79, .3437], [.1, 2.79, .26]], [.009, .009, .009])];
  for (const side of [-1, 1]) {
    parts.push(tapered("长袍下实际接到足踝的人形腿", skin, [[side * .2, 1.8, 0], [side * .22, .9, .02], [side * .24, .22, .12]], [.17, .12, .085]), lobe("长袍外露出且接地的双足", skin, [side * .24, .12, .25], [.31, .24, .65]),
      tapered("肩膀至抬掌姿态的上臂前臂", skin, [[side * .35, 2.4, .02], [side * .62, 1.98, .08], [side * .83, 2.22, .3]], [.14, .11, .065]), lobe("抬起而未脱离腕部的手掌", skin, [side * .85, 2.29, .33], [.18, .27, .11]));
    for (let finger = 0; finger < 4; finger++) parts.push(tapered("手掌末端分离的细长指", skin, [[side * .85 + (finger - 1.5) * .038, 2.34, .34], [side * .87 + (finger - 1.5) * .04, 2.54, .34]], [.018, .008]));
  }
  for (let index = 0; index < 12; index++) {
    const a = index * Math.PI / 6, c = Math.cos(a), s = Math.sin(a), end: Triple = [c * 1.03, 3.55 + index % 2 * .14, s * .73 + .1];
    parts.push(tapered("从头皮相连并向外弯起的独立蛇发", snake, [[c * .16, 3.15, s * .13 + .03], [c * .46, 3.5, s * .4], [c * .85, 3.78 + index % 3 * .07, s * .6], end], [.055, .055, .045, .033]),
      lobe("蛇发末端完整的小蛇头", snake, end, [.13, .11, .2], [0, 90 - a * 180 / Math.PI, 0]));
    const yaw = Math.PI / 2 - a;
    for (const side of [-1, 1]) parts.push(lobe("蛇发小头上独立的侧眼", dark, [end[0] + side * .0352 * Math.cos(yaw) + .0459 * Math.sin(yaw), end[1] + .0207, end[2] + .0459 * Math.cos(yaw) - side * .0352 * Math.sin(yaw)], [.025, .025, .025]));
  }
  return parts;
}

function featheredSerpent(): ModelPart[] {
  const green = "#8ca292", plume = "#86ac90";
  const body = tapered("羽蛇从尾尖至昂首颈部连成的盘曲蛇躯", green, [[-5, .4, -3.5], [-3, .55, -4.2], [0, .6, -3.5], [2.5, .65, -1.2], [2.4, 1.3, 1], [.4, 2.4, 2.4], [-1.4, 3.5, 2.2], [-1.5, 3.7, 2.55]], [.025, .25, .5, .6, .65, .6, .4, .36]);
  const parts: ModelPart[] = [body, lobe("羽蛇宽额而前突的蛇首", green, [-1.8, 4.05, 3.05], [1, .85, 1.3]), lobe("羽蛇张口上方的宽厚鼻吻", green, [-1.8, 3.9, 3.75], [.75, .45, 1]),
    tapered("宽头下向前张开的独立下颌", pale, [[-1.8, 3.65, 2.8], [-1.8, 3.4, 3.7]], [.28, .18]), ...eyes([-1.8, 4.1863, 3.3226], .3181, .12), tapered("下颌前伸的细长蛇舌", dark, [[-1.8, 3.38, 3.85], [-1.8, 3.3, 4.5]], [.04, .018]),
    ...[-1, 1].map(side => needle("羽蛇舌尖自然分叉的两端", dark, [-1.8, 3.3, 4.5], [-1.8 + side * .13, 3.35, 4.75], .025))];
  for (const side of [-1, 1]) parts.push(tapered("宽上颌内向下弯曲的完整蛇牙", pale, [[-1.8 + side * .24, 3.85, 3.98], [-1.8 + side * .25, 3.53, 4.08], [-1.8 + side * .19, 3.39, 4.06]], [.075, .04, .006]));
  const plumes: ModelPart[] = [];
  const collar = body.vertices!.slice(7 * 8, 8 * 8);
  for (let index = 0; index < 12; index++) {
    const position = index / 12 * 8, n = Math.floor(position), f = position - n, a = collar[n]!, b = collar[(n + 1) % 8]!;
    const dx = a.x + (b.x - a.x) * f + 1.5, dy = a.y + (b.y - a.y) * f - 3.7, dz = a.z + (b.z - a.z) * f - 2.55, length = Math.hypot(dx, dy, dz);
    plumes.push(flightFeather("从实际颈圈表面向后舒展的长羽冠", plume, [-1.5 + dx * .9, 3.7 + dy * .9, 2.55 + dz * .9], [-1.5 + dx / length * 1.55, 3.7 + dy / length * 1.55, 2.1 + dz / length * 1.55], .34));
  }
  for (let index = 1; index < 7; index++) {
    const ring = body.vertices!.slice(index * 8, index * 8 + 8), high = ring.reduce((a, b) => b.y > a.y ? b : a);
    for (const side of [-1, 1]) plumes.push(flightFeather("从真实蛇躯上缘长出的侧向羽列", plume, [high.x, high.y - .03, high.z], [high.x + side * .75, high.y + .45, high.z - .55], .3));
  }
  parts.push(combineMeshes("羽蛇完整颈冠与沿背羽列", plume, plumes));
  return parts;
}

export const mythicCreatureExpansionBatchTwoDesigns = [
  design("traditionalHippogriff", "鹰马", "动物", hippogriff, ["Hippogriff", "鹰首羽翼与鹰形前足", "马形后躯与单蹄后足", "长尾鬃"], "奇幻"),
  design("mythicPegasus", "飞马", "动物", pegasus, ["Pegasus", "完整四蹄马身", "肩背羽翼", "长颈与长鬃"], "奇幻"),
  design("snakeHairedMedusa", "蛇发女怪", "动物", medusa, ["Medusa", "人形双足与长袍", "相连的独立蛇发", "静态生物造型"], "奇幻"),
  design("plumedQuetzalcoatl", "羽蛇", "动物", featheredSerpent, ["Quetzalcoatl", "盘曲无足蛇躯", "颈冠与沿背长羽", "宽首开口双牙"], "奇幻"),
];
