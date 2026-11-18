import { beam, combineMeshes, design, eyes, leaf, lobe, needle, tapered, type ModelPart, type Triple } from "./shared";
import { membrane } from "./animals";

const scale = "#7e9c87", wing = "#a0b49b", pale = "#c9c7aa", dark = "#596c61", feather = "#b6bba4", fur = "#a89675";

// 形态参照公开馆藏中的传统解剖母题，仅原创静态网格，不复制馆藏模型或图片。
// https://resources.metmuseum.org/resources/metpublications/pdf/A_Noble_Imposture_The_Metropolitan_Museum_Journal_v_32_1997.pdf
// https://www.metmuseum.org/art/collection/search/323574
// 神话生物无统一实测尺寸；下面以米为单位采用固定的场景设定尺度，不扩颜色/体型/头数条目。

function talons(parts: ModelPart[], foot: Triple, spread: number, length: number, color = pale) {
  for (const toe of [-1, 0, 1]) parts.push(tapered("足端分离可见的弯曲趾爪", color, [[foot[0] + toe * spread, foot[1], foot[2]], [foot[0] + toe * spread * 1.2, foot[1] * .6, foot[2] + length * .7], [foot[0] + toe * spread * 1.3, .045, foot[2] + length]], [.085, .045, .008]));
}

export function flightFeather(name: string, color: string, start: Triple, end: Triple, width: number): ModelPart {
  const frame = beam(name, color, start, end, width), length = Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
  return leaf(name, color, start, width, length, [frame.rotation.x, frame.rotation.y, frame.rotation.z]);
}

function westernDragon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("四足真龙宽深胸腹", scale, [0, 2.9, -.15], [3.1, 2.9, 5.6]), lobe("真龙肩胛肌群与上胸", scale, [0, 3.35, 1.5], [2.8, 2.6, 2.3]),
    tapered("从肩胸上举并前弯的粗长颈", scale, [[0, 3.4, 1.8], [0, 4.8, 2.7], [0, 5.7, 4.1]], [.9, .65, .44]), lobe("后额与两颊分明的角龙头颅", scale, [0, 5.95, 4.35], [1.35, 1.3, 2]),
    tapered("从头颅伸出的楔形上吻", scale, [[0, 5.9, 4.7], [0, 5.7, 6]], [.5, .23]), tapered("上吻之下保留张口缝的下颌", dark, [[0, 5.42, 4.55], [0, 5.35, 5.9]], [.37, .16]),
    ...eyes([0, 6.1736, 4.8056], .3893, .16), tapered("由粗尾根经弧线收细的平衡长尾", scale, [[0, 2.8, -2.1], [0, 2.3, -4.2], [1.4, 1.7, -6.4], [2.8, 1.1, -8.1]], [.77, .52, .23, .025])];
  for (const side of [-1, 1]) {
    parts.push(tapered("龙额向后上方收尖的角", pale, [[side * .44, 6.3, 3.9], [side * .62, 7.1, 3.6], [side * .8, 7.5, 3.1]], [.17, .11, .01]),
      tapered("前肩经肘腕承重的前肢", scale, [[side * 1, 3, 1.4], [side * 1.65, 1.6, 1.65], [side * 1.5, .35, 2.15]], [.4, .28, .18]), lobe("前足接地宽掌", dark, [side * 1.5, .16, 2.35], [.82, .32, 1.05]),
      tapered("粗大股部与反折踝部连接的后肢", scale, [[side * 1, 2.6, -1.6], [side * 1.75, 1.35, -1.05], [side * 1.8, .32, -2]], [.58, .36, .18]), lobe("后足承重趾掌", dark, [side * 1.8, .16, -1.75], [.9, .32, 1.25]));
    talons(parts, [side * 1.5, .24, 2.55], .22, .6); talons(parts, [side * 1.8, .24, -1.45], .24, .6);
    const shoulder: Triple = [side * .95, 3.75, .8], elbow: Triple = [side * 3.1, 5, .4], wrist: Triple = [side * 5.4, 5.8, 1.1];
    const fingers: Triple[] = [[side * 9.2, 5.25, -.15], [side * 7.6, 3.9, -2.3], [side * 4.9, 3.05, -3.5], [side * 2.2, 2.9, -2.8], [side * .9, 2.6, -1.6]];
    parts.push(tapered("肩部独立长出的翼肱骨与桡骨", scale, [shoulder, elbow, wrist], [.33, .22, .13]), membrane("翼臂到腹侧的根部翼膜", wing, [shoulder, elbow, wrist, fingers[4]!]));
    for (let index = 0; index < fingers.length - 1; index++) parts.push(membrane("张开指骨之间完整相接的蝠形翼膜", wing, [wrist, fingers[index]!, fingers[index + 1]!]), tapered("从翼腕放射至膜缘的细长指骨", pale, [wrist, fingers[index]!], [.095, .015]));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 5; index++) teeth.push(needle("张口缘向下的独立尖齿", pale, [side * (.33 - index * .035), 5.7, 4.8 + index * .21], [side * (.3 - index * .03), 5.4, 4.85 + index * .21], .11));
  parts.push(combineMeshes("真龙上颌两侧的完整齿列", pale, teeth));
  for (let index = 0; index < 7; index++) parts.push(needle("沿颈背尾脊逐渐缩短的独立骨棘", pale, [0, 4.25 - index * .28, 1.4 - index * .85], [0, 4.9 - index * .33, 1.15 - index * .85], .28 - index * .02));
  return parts;
}

function wyvern(): ModelPart[] {
  const hide = "#9d9578", membraneColor = "#beb390";
  const parts: ModelPart[] = [lobe("双足飞龙前倾而不具前步足的窄胸腹", hide, [0, 3.4, -.25], [2, 2.5, 3.8]),
    tapered("前倾胸骨上接长S形颈", hide, [[0, 3.8, 1], [0, 4.5, 2.1], [0, 5.8, 2.9], [0, 6.05, 4.1]], [.64, .52, .34, .22]),
    lobe("双足飞龙窄长的后颅", hide, [0, 6.1, 4.1], [.9, .86, 1.4]), tapered("狭长且前端下钩的吻", hide, [[0, 6.15, 4.55], [0, 5.9, 5.7], [0, 5.65, 5.8]], [.25, .17, .025]),
    tapered("窄吻下的独立下颌", pale, [[0, 5.75, 4.3], [0, 5.6, 5.55]], [.2, .05]), ...eyes([0, 6.2599, 4.3351], .3009, .12),
    tapered("双足姿态后方的粗根反曲平衡尾", hide, [[0, 3.15, -1.7], [0, 2.2, -3.8], [-1, 1.45, -5.9], [-.4, 2.1, -7]], [.56, .36, .14, .012])];
  for (const side of [-1, 1]) {
    parts.push(tapered("宽骨盆下仅有的一对反折承重后腿", hide, [[side * .65, 3.1, -1.2], [side * 1.1, 1.75, -.3], [side * 1, .32, -1.1]], [.47, .29, .14]), lobe("双足飞龙接地的长趾掌", dark, [side * 1, .16, -.65], [.82, .32, 1.4]));
    talons(parts, [side * 1, .22, -.35], .22, .7);
    parts.push(tapered("后伸短眉角", pale, [[side * .25, 6.35, 3.8], [side * .45, 6.9, 3.1]], [.13, .012]));
    const shoulder: Triple = [side * .65, 4.05, .9], elbow: Triple = [side * 2.5, 5.15, 1.8], wrist: Triple = [side * 4.2, 5.8, 2.7];
    const tips: Triple[] = [[side * 7.9, 5.35, 1.8], [side * 6.7, 3.5, -.6], [side * 4.8, 2.8, -2.6], [side * 2.1, 2.5, -2.4], [side * .65, 2.8, -1.3]];
    parts.push(tapered("与前肢同源的长翼上臂和前臂", hide, [shoulder, elbow, wrist], [.3, .2, .115]), membrane("长翼前肢内侧连到腰部的翼膜", membraneColor, [shoulder, elbow, wrist, tips[4]!]),
      tapered("翼腕前上方露出的独立拇爪", pale, [wrist, [side * 4.5, 6.15, 3.2], [side * 4.6, 5.95, 3.4]], [.13, .07, .008]));
    for (let index = 0; index < tips.length - 1; index++) parts.push(membrane("长指间相接的狭长翼膜", membraneColor, [wrist, tips[index]!, tips[index + 1]!]), tapered("支起前肢翼膜的放射长指", hide, [wrist, tips[index]!], [.08, .012]));
  }
  return parts;
}

function easternDragon(): ModelPart[] {
  const jade = "#85a99c", mane = "#b4b99a";
  const body = tapered("东方龙由尾尖到高颈连成一体的长蛇形躯干", jade, [[-5, .8, -6.5], [-2.7, 1.05, -5.1], [1, 1.7, -3.4], [2.2, 2.3, -.4], [1.2, 2.8, 1.9], [-.9, 3.7, 3.5], [-1.1, 5.15, 4.25]], [.025, .25, .55, .65, .6, .43, .32]);
  const parts: ModelPart[] = [body,
    lobe("高额长鼻的龙首后颅", jade, [-1.1, 5.35, 4.45], [1.15, 1.05, 1.4]), lobe("龙首宽短前吻与鼻翼", jade, [-1.1, 5.1, 5.2], [.95, .5, 1.2]),
    tapered("长吻下独立伸出的龙颌", mane, [[-1.1, 4.9, 4.7], [-1.1, 4.77, 5.65]], [.32, .18]), ...eyes([-1.1, 5.517, 4.7841], .3341, .14)];
  for (const side of [-1, 1]) {
    parts.push(tapered("从龙额上伸再向后分叉的主角", pale, [[-1.1 + side * .38, 5.7, 4.1], [-1.1 + side * .53, 6.45, 3.8], [-1.1 + side * .63, 6.65, 3.15]], [.12, .08, .01]),
      tapered("鹿状龙角独立叉枝", pale, [[-1.1 + side * .5, 6.25, 3.9], [-1.1 + side * .95, 6.55, 3.7]], [.07, .008]),
      tapered("鼻翼两侧向外弯出的龙须", mane, [[-1.1 + side * .37, 5.13, 5.48], [-1.1 + side * 1.1, 4.95, 5.9], [-1.1 + side * 1.65, 5.18, 5.95]], [.045, .026, .007]),
      flightFeather("龙首向后外方舒展的长耳", mane, [-1.1 + side * .4, 5.4, 4.05], [-1.1 + side * 1.15, 5.9, 3.7], .4));
  }
  for (const [x, y, z, forward] of [[1.55, 2.4, .8, true], [.5, 1.7, -3.5, false]] as const) for (const side of [-1, 1]) {
    const foot: Triple = [x + side * 1.65, .22, z + (forward ? .9 : -.1)];
    parts.push(tapered("长身左右分出的短曲承重龙肢", jade, [[x + side * .38, y, z], [x + side * 1.25, y * .55, z + .1], foot], [.24, .17, .1]), lobe("龙掌贴地的分趾根部", mane, [foot[0], .15, foot[2] + .12], [.58, .3, .75]));
    talons(parts, foot, .16, .5);
  }
  const ridge = Array.from({ length: 7 }, (_, index) => body.vertices!.slice(index * 8, index * 8 + 8).reduce((highest, vertex) => vertex.y > highest.y ? vertex : highest));
  for (let index = 1; index < ridge.length - 1; index++) for (const t of [0, .5]) {
    const a = ridge[index]!, b = ridge[index + 1]!, root: Triple = [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - .025, a.z + (b.z - a.z) * t];
    parts.push(leaf("从躯干真实脊顶长出的独立鬃鳍", mane, root, .45, .7, [0, 85, -12]));
  }
  return parts;
}

function griffin(): ModelPart[] {
  const parts: ModelPart[] = [lobe("狮鹫后腰至前胸一体的狮形主躯", fur, [0, 1.7, -.2], [1.55, 1.8, 3.7]), lobe("覆盖羽颈下方的高耸肩胸", feather, [0, 2.1, 1.15], [1.6, 2, 1.65]),
    tapered("从肩部上举的完整鹰颈", feather, [[0, 2.25, 1.15], [0, 3.3, 1.55]], [.53, .31]), lobe("狮鹫大型猛禽头颅", feather, [0, 3.45, 1.75], [.85, .85, 1.1]),
    tapered("具有下钩尖端的完整鹰喙", pale, [[0, 3.4, 2.05], [0, 3.25, 2.7], [0, 2.95, 2.75]], [.24, .13, .007]), ...eyes([0, 3.5649, 2.0152], .2652, .105),
    tapered("狮鹫狮形后躯末端的长尾", fur, [[0, 1.7, -1.7], [.2, 1.25, -2.7], [.55, .8, -3.5]], [.14, .075, .03]), lobe("狮尾末端独立毛簇", dark, [.55, .8, -3.5], [.35, .35, .7])];
  for (const side of [-1, 1]) {
    parts.push(tapered("肩下有鳞跗段的猛禽前肢", feather, [[side * .53, 2.1, 1.15], [side * .78, 1.15, 1.1], [side * .72, .22, 1.45]], [.23, .16, .08]),
      tapered("狮形骨盆到跗关节的弯曲后腿", fur, [[side * .52, 1.65, -1.25], [side * .8, .85, -.85], [side * .78, .23, -1.4]], [.34, .21, .11]), lobe("狮鹫后足接地的厚趾掌", dark, [side * .78, .14, -1.22], [.48, .28, .7]));
    talons(parts, [side * .72, .22, 1.45], .17, .6); talons(parts, [side * .78, .22, -1.05], .13, .38);
    const shoulder: Triple = [side * .55, 2.5, .75], elbow: Triple = [side * 2.25, 3.9, .25], wrist: Triple = [side * 3.7, 4.15, -.15];
    parts.push(tapered("猛禽前足向后抓地的独立拇趾", pale, [[side * .72, .23, 1.45], [side * .72, .07, 1.05]], [.065, .008]),
      tapered("有肱部和腕部转折的完整羽翼骨架", feather, [shoulder, elbow, wrist], [.25, .16, .07]),
      membrane("肩至翼腕间的羽毛覆面", feather, [[side * .55, 2.5, .75], [side * 2.25, 3.9, .25], [side * 3.7, 4.15, -.15], [side * 2.1, 3.1, -1.3], [side * .6, 2.3, -.6]]));
    const feathers: ModelPart[] = [];
    for (let index = 0; index < 10; index++) {
      const t = index / 9, a = t < .5 ? shoulder : elbow, b = t < .5 ? elbow : wrist, f = t < .5 ? t * 2 : (t - .5) * 2;
      const start = a.map((value, axis) => value + (b[axis]! - value) * f) as Triple;
      feathers.push(flightFeather("沿翼腕与前臂相接的长飞羽", feather, start, [start[0] + side * (1.15 + t * 1.2), start[1] - .45, start[2] - 1.5 - t * .7], .55));
    }
    parts.push(combineMeshes("狮鹫左或右翼完整飞羽列", feather, feathers));
    for (let index = 0; index < 5; index++) parts.push(leaf("鹰颈下分层垂挂的羽领", feather, [side * .42, 2.4 + index * .12, 1.35], .34, .6, [150, side * 30, side * 15]));
  }
  return parts;
}

export const mythicCreatureExpansionBatchOneDesigns = [
  design("westernSixLimbDragon", "西方六肢真龙", "动物", westernDragon, ["神话生物", "四步足与独立双翼", "角首长颈", "设定尺度约14米长"], "奇幻"),
  design("heraldicWyvern", "双足飞龙", "动物", wyvern, ["Wyvern", "神话生物", "前肢为长指膜翼", "双后足反折承重"], "奇幻"),
  design("easternLongDragon", "东方长身四足龙", "动物", easternDragon, ["神话生物", "长蛇形躯干", "分叉角与长须", "四短曲肢"], "奇幻"),
  design("mythicGriffin", "狮鹫", "动物", griffin, ["Griffin", "鹰首双羽翼", "猛禽前爪", "狮形后躯与尾簇"], "奇幻"),
];
