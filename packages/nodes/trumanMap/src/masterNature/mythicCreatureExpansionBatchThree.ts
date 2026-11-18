import { beam, combineMeshes, design, eyes, lobe, part, tapered, type ModelPart, type Triple } from "./shared";
import { membrane } from "./animals";
import { flightFeather } from "./mythicCreatureExpansionBatchOne";

const skin = "#a79e87", cloth = "#7b8b78", dark = "#5b665c", pale = "#c1c4ac";

// 传统形态依据；只构造原创静态生物，不复制任何馆藏图案、纹样或模型。
// https://www.getty.edu/vow/AATFullDisplay?subjectid=300303196
// https://collection-online.moa.ubc.ca/search/item?keywords=thunderbird

function cyclops(): ModelPart[] {
  const parts: ModelPart[] = [lobe("独眼巨人宽肩厚胸的完整躯干", skin, [0, 5, 0], [3.5, 4, 1.9]), lobe("与胸腹和双腿连成的宽骨盆", skin, [0, 3.5, 0], [2.6, 1.7, 1.8]),
    tapered("厚肩上方连接头颅的粗颈", skin, [[0, 6.1, .15], [0, 6.8, .25]], [.65, .45]), lobe("前额高大而下颌厚重的独眼颅", skin, [0, 7.25, .25], [1.8, 2.1, 1.8]),
    lobe("额头中央只有一枚的大眼球", pale, [0, 7.65, 1.01], [.65, .55, .28]), lobe("中央单眼前方深色圆瞳", dark, [0, 7.65, 1.135], [.26, .3, .1]),
    tapered("单眼上方连接额骨的完整粗眉弓", skin, [[-.75, 7.9, .86], [0, 8, 1.04], [.75, 7.9, .86]], [.12, .14, .12]),
    lobe("单眼下方高厚的鼻梁", skin, [0, 7.2, 1.08], [.4, .65, .5]), lobe("完整前突的下颌与下巴", skin, [0, 6.85, .7], [1.2, .6, 1]), beam("下颌前方闭合的嘴线", dark, [-.45, 6.88, 1.06], [.45, 6.88, 1.06], .06),
    lobe("沿后额连接的短发冠", dark, [0, 7.9, .15], [1.98, .8, 1.9]), part("覆盖骨盆与上腿的厚布围裙", "lathe", cloth, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.13, y: 4.1 }, { x: 1.42, y: 2.8 }, { x: 1.34, y: 2.8 }, { x: 1.05, y: 4.1 }, { x: 1.13, y: 4.1 }] })];
  for (const side of [-1, 1]) {
    parts.push(tapered("从骨盆到膝踝的巨大承重双腿", skin, [[side * .72, 3.65, 0], [side * .98, 2, .25], [side * .95, .4, .1]], [.58, .41, .25]), lobe("巨人真正接地的宽大足掌", skin, [side * .95, .25, .55], [1.1, .5, 1.8]),
      tapered("宽肩到垂下双手的完整上臂前臂", skin, [[side * 1.25, 6.1, 0], [side * 1.8, 4.8, .4], [side * 2, 3.7, .7]], [.48, .35, .21]), lobe("前臂末端连着的宽厚手掌", skin, [side * 2, 3.65, .72], [.7, 1, .6]),
      lobe("头颅两侧与颞区连接的外耳", skin, [side * .7, 7.05, .2], [.18, .4, .3]));
    for (let digit = 0; digit < 4; digit++) parts.push(tapered("巨掌前缘各自分离的长指", skin, [[side * 2 + (digit - 1.5) * .14, 3.5, .83], [side * 2 + (digit - 1.5) * .15, 3.02, .96]], [.085, .05]));
    parts.push(tapered("从掌侧弯出的独立拇指", skin, [[side * 1.76, 3.8, .73], [side * 1.55, 3.45, .97]], [.11, .06]));
    for (let toe = 0; toe < 5; toe++) parts.push(tapered("大足掌前缘真实分开的五趾", skin, [[side * .95 + (toe - 2) * .16, .2, 1], [side * .95 + (toe - 2) * .16, .08, 1.52 - Math.abs(toe - 1) * .04]], [.09, .025]));
  }
  return parts;
}

function thunderbird(): ModelPart[] {
  const cover = "#839687", wing = "#a8b8a2";
  const parts: ModelPart[] = [lobe("雷鸟阔肩而短深的完整胸腹", cover, [0, 2.7, -.2], [2.9, 3.3, 3.8]), tapered("宽胸上向前上方连接的大颈", cover, [[0, 3.6, .8], [0, 4.2, 1.2]], [.62, .5]),
    lobe("雷鸟额部宽大且具有厚枕的头颅", cover, [0, 4.6, 1.3], [1.85, 1.9, 1.6]), tapered("极深弯曲并下扣的巨大上喙", pale, [[0, 4.5, 1.5], [0, 4.3, 2.6], [0, 3.4, 2.9]], [.48, .3, .025]),
    tapered("上喙下保留开口缝的独立下喙", pale, [[0, 3.6, 1.6], [0, 3.5, 2.4]], [.3, .13]), ...eyes([0, 4.8781, 1.7084], .5301, .16),
    part("雷鸟头顶相连的高立鳍形冠", "extrude", wing, [0, 5, .8], [1, 1, 1], [0, 90, 0], { depth: .35, profile: [{ x: -.2, y: 0 }, { x: .2, y: 0 }, { x: .35, y: 1.2 }, { x: 0, y: 1.65 }, { x: -.35, y: 1.2 }] })];
  for (const side of [-1, 1]) {
    const ankle: Triple = [side * .95, .3, .35];
    parts.push(tapered("雷鸟短粗股部至鳞跗足踝的完整承重腿", cover, [[side * .7, 1.9, .1], [side * 1.05, 1.1, -.1], ankle], [.34, .22, .12]));
    for (const toe of [-1, 0, 1]) parts.push(tapered("强爪足前伸而末端弯下的分离趾", pale, [[ankle[0] + toe * .21, .27, .35], [ankle[0] + toe * .35, .14, 1], [ankle[0] + toe * .4, .045, 1.3]], [.11, .07, .012]));
    parts.push(tapered("强爪足向后抵地的拇趾", pale, [ankle, [ankle[0], .08, -.35]], [.095, .015]));
    const shoulder: Triple = [side * .9, 3.4, .4], elbow: Triple = [side * 3, 4.1, .8], wrist: Triple = [side * 5.4, 4.15, .4];
    parts.push(tapered("阔翼的肩肘腕连续骨架", cover, [shoulder, elbow, wrist], [.32, .22, .09]), membrane("肩背至翼腕之间连续展开的羽覆面", wing, [shoulder, elbow, wrist, [side * 3.5, 3, -1.6], [side * .9, 2.8, -.7]]));
    const feathers: ModelPart[] = [];
    for (let index = 0; index < 13; index++) {
      const t = index / 12, a = t < .5 ? shoulder : elbow, b = t < .5 ? elbow : wrist, f = t < .5 ? t * 2 : (t - .5) * 2, start = a.map((value, axis) => value + (b[axis]! - value) * f) as Triple;
      feathers.push(flightFeather("阔翼上根部接到实际翼骨的长飞羽", wing, start, [start[0] + side * (1.25 + t * 1.55), start[1] - .55, start[2] - 1.8 - t * .8], .65));
    }
    parts.push(combineMeshes("雷鸟单侧阔翼完整飞羽列", wing, feathers));
  }
  const tail: ModelPart[] = [];
  for (let index = 0; index < 7; index++) tail.push(flightFeather("雷鸟后躯向下后方伸出的长扇尾羽", wing, [(index - 3) * .1, 2, -1.4], [(index - 3) * .52, .85, -4.8 + Math.abs(index - 3) * .18], .6));
  parts.push(combineMeshes("雷鸟中央成扇形的整列尾羽", wing, tail));
  return parts;
}

export const mythicCreatureExpansionBatchThreeDesigns = [
  design("mythicCyclops", "独眼巨人", "动物", cyclops, ["Cyclops", "宽肩厚躯与完整双足", "额头中央单眼", "设定高度约8米"], "奇幻"),
  design("legendaryThunderbird", "雷鸟", "动物", thunderbird, ["Thunderbird", "巨大弯喙与鳍形额冠", "阔翼短躯", "强爪足与长扇尾"], "奇幻"),
];
