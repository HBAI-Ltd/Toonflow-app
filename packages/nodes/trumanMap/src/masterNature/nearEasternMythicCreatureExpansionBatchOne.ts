import { combineMeshes, design, eyes, leaf, lobe, tapered, type MasterNatureDesign, type ModelPart, type Triple } from "./shared";
import { membrane } from "./animals";
import { flightFeather } from "./mythicCreatureExpansionBatchOne";

// 传统完整解剖的原创场景造型，不复制馆藏模型，不按颜色、姿态或材质增加主素材。
// 安祖的狮首与鹰躯： https://www.metmuseum.org/art/collection/search/326897
// 希波坎普的马前躯、双前腿与鱼尾： https://www.getty.edu/publications/ambers/objects/29/
// https://collections.lacma.org/object/62843
// 神话没有可实测体长；以下米制为固定场景设定尺度。

function anzu(): ModelPart[] {
  const feathers = "#a99a75", flight = "#c3b48d", mane = "#8a775a", lion = "#c3a57c", horn = "#d4c6a3", dark = "#574f43";
  const parts: ModelPart[] = [
    lobe("安祖由胸骨连接骨盆的完整猛禽鸟躯", feathers, [0, 2.4, -.35], [1.8, 2.4, 3.4]),
    lobe("双翼根部之间向前突出的鸟类胸肌", flight, [0, 2.7, .55], [1.8, 2.25, 1.7]),
    tapered("鸟胸上生的短粗狮颈", lion, [[0, 2.95, .7], [0, 3.65, 1.05]], [.56, .45]),
    lobe("具有狮额和颧骨的宽头颅", lion, [0, 3.95, 1.25], [1.43, 1.35, 1.4]),
    lobe("狮口两侧分立的左吻垫", lion, [-.26, 3.73, 1.85], [.7, .56, .79]),
    lobe("狮口两侧分立的右吻垫", lion, [.26, 3.73, 1.85], [.7, .56, .79]),
    lobe("吻垫前端的宽鼻镜", dark, [0, 3.86, 2.15], [.44, .24, .26]),
    lobe("上吻下方独立可见的狮下颌", lion, [0, 3.46, 1.76], [.85, .31, .85]),
    ...eyes([0, 4.12, 1.69], .48, .16),
    tapered("由鸟骨盆接出的尾羽根部", feathers, [[0, 2.25, -1.35], [0, 1.75, -2.15]], [.48, .22]),
  ];
  const ruff: ModelPart[] = [];
  for (let index = 0; index < 14; index++) {
    const angle = index * Math.PI * 2 / 14;
    ruff.push(flightFeather("环绕狮颈的层叠鬃束", mane, [Math.sin(angle) * .32, 3.8 + Math.cos(angle) * .34, .99], [Math.sin(angle) * .96, 3.8 + Math.cos(angle) * .97, .6], .46));
  }
  parts.push(combineMeshes("狮首后围合的一整圈鬃领", mane, ruff));
  const tail: ModelPart[] = [];
  for (let index = -3; index <= 3; index++) tail.push(flightFeather("鸟尾完整的分列舵羽", flight, [index * .065, 1.97, -1.88], [index * .31, 1.16 + Math.abs(index) * .09, -3.8 + Math.abs(index) * .18], .49));
  parts.push(combineMeshes("从尾根相接展开的七片鸟尾舵羽", flight, tail));
  for (const side of [-1, 1]) {
    parts.push(lobe("狮颅上方的圆短外耳", lion, [side * .59, 4.42, 1.12], [.48, .53, .35]),
      lobe("圆耳前面的凹色耳内", mane, [side * .59, 4.45, 1.25], [.3, .31, .08]),
      tapered("鸟腹下方与骨盆相连的羽股", feathers, [[side * .52, 2.1, -.42], [side * .75, 1.2, -.05]], [.34, .23]),
      tapered("反折跗关节下的裸露鹰跗段", lion, [[side * .75, 1.2, -.05], [side * .66, .26, .16]], [.18, .095]));
    const claws: ModelPart[] = [];
    for (let toe = -1; toe <= 1; toe++) claws.push(tapered("安祖前伸趾节末端的钩爪", horn, [[side * .66, .26, .16], [side * .66 + toe * .22, .12, .65], [side * .66 + toe * .27, .045, .92]], [.085, .065, .009]));
    claws.push(tapered("猛禽独立后抓的拇趾", horn, [[side * .66, .26, .16], [side * .66, .11, -.29], [side * .66, .045, -.52]], [.08, .05, .008]));
    parts.push(combineMeshes("一只承重鹰足上分开的三前趾与一后趾", horn, claws));
    const shoulder: Triple = [side * .62, 3.05, .4], elbow: Triple = [side * 2.15, 3.95, .22], wrist: Triple = [side * 3.8, 4.2, -.16];
    parts.push(tapered("鸟躯肩胛直接连出的双段翼臂", feathers, [shoulder, elbow, wrist], [.29, .2, .095]),
      membrane("羽翼骨架后方完整连续的覆羽面", feathers, [shoulder, elbow, wrist, [side * 4, 3.76, -1.16], [side * 2.2, 2.9, -1.8], [side * .62, 2.6, -.75]]));
    const quills: ModelPart[] = [];
    for (let index = 0; index < 12; index++) {
      const progress = .08 + index / 11 * .88, a = progress < .5 ? shoulder : elbow, b = progress < .5 ? elbow : wrist, local = progress < .5 ? progress * 2 : progress * 2 - 1;
      const root = a.map((value, axis) => value + (b[axis]! - value) * local) as Triple;
      const end: Triple = [side * (1.8 + index * .34), 2.7 + index * .11, -1.84 + index * .065];
      quills.push(flightFeather("翼臂后缘错落分开的长飞羽", flight, root, end, .49));
    }
    parts.push(combineMeshes("沿完整翼臂生长的十二片长飞羽", flight, quills));
  }
  return parts;
}

function hippocamp(): ModelPart[] {
  const hide = "#b9c5b2", mane = "#798d83", scales = "#7faaa0", fins = "#aac8b1", hoof = "#596a63";
  const tailPath: Triple[] = [[0, 1.95, -.2], [0, 1.52, -1.55], [.5, .79, -2.8], [1.85, .55, -3.7], [2.9, .97, -3.38], [3.08, 1.7, -2.53]];
  const neck = tapered("马肩接入高举弧形颈部", hide, [[0, 2.3, .77], [0, 3.1, 1.1], [0, 3.95, 1.32]], [.57, .46, .29]);
  const parts: ModelPart[] = [
    lobe("希波坎普保留肩胛与胸肌的马前躯", hide, [0, 2.05, .35], [1.46, 1.8, 2.04]),
    neck,
    lobe("两耳下方的长额马颅", hide, [0, 4.08, 1.56], [.76, .93, 1.03], [17, 0, 0]),
    tapered("从眼眶前方延长的完整马吻", hide, [[0, 4.02, 1.73], [0, 3.69, 2.47]], [.3, .27]),
    lobe("马鼻圆厚的口鼻端", hide, [0, 3.67, 2.49], [.66, .53, .65]),
    lobe("长吻下方分明的下颌骨", hide, [0, 3.71, 2.02], [.57, .44, .97], [15, 0, 0]),
    ...eyes([0, 4.18, 1.86], .275, .115),
    tapered("由马胸后方连续过渡而无后步足的粗根鱼尾", scales, tailPath, [.66, .61, .47, .3, .17, .075]),
  ];
  const crest: ModelPart[] = [];
  const back = [0, 1, 2].map(index => neck.vertices!.slice(index * 8, index * 8 + 8).reduce((lowest, vertex) => vertex.z < lowest.z ? vertex : lowest));
  for (let index = 0; index < 9; index++) {
    const progress = .04 + index / 8 * .92, segment = progress < .5 ? 0 : 1, local = progress < .5 ? progress * 2 : progress * 2 - 1, a = back[segment]!, b = back[segment + 1]!;
    crest.push(leaf("顺着马颈真实背缘生长的短鬃束", mane, [a.x + (b.x - a.x) * local, a.y + (b.y - a.y) * local, a.z + (b.z - a.z) * local], .24, .49, [-34, 0, 0]));
  }
  parts.push(combineMeshes("从肩到枕部连续相接的完整马鬃", mane, crest));
  for (const side of [-1, 1]) {
    parts.push(leaf("马头上两只独立尖长耳", hide, [side * .22, 4.38, 1.32], .29, .63, [-8, side * 18, side * -13]),
      lobe("马吻两侧独立的鼻孔", hoof, [side * .24, 3.78, 2.69], [.14, .15, .07]),
      tapered("马肩下垂至前膝的完整前臂", hide, [[side * .49, 2.1, .75], [side * .56, 1.08, 1.05], [side * .6, .35, 1.38]], [.23, .15, .095]),
      lobe("马前腿接地且具有冠缘的实心蹄", hoof, [side * .6, .15, 1.48], [.35, .35, .49]),
      membrane("马鱼过渡腰侧的胸鳍", fins, [[side * .43, 1.88, -.6], [side * 1.12, 1.34, -1.13], [side * .98, 1.12, -1.72], [side * .31, 1.35, -1.33]]),
      tapered("侧胸鳍前缘的硬鳍条", scales, [[side * .43, 1.88, -.6], [side * 1.12, 1.34, -1.13], [side * .98, 1.12, -1.72]], [.055, .035, .009]));
  }
  const heights = [.66, .61, .47, .3, .17, .075];
  for (let index = 0; index < tailPath.length - 2; index++) {
    const a = tailPath[index]!, b = tailPath[index + 1]!;
    const rootA: Triple = [a[0], a[1] + heights[index]! * .8, a[2]], rootB: Triple = [b[0], b[1] + heights[index + 1]! * .8, b[2]];
    const tipA: Triple = [rootA[0], rootA[1] + .46 - index * .055, rootA[2]], tipB: Triple = [rootB[0], rootB[1] + .4 - index * .055, rootB[2]];
    parts.push(membrane("沿尾背连续相接的薄背鳍", fins, [rootA, rootB, tipB, tipA]), tapered("背鳍中部显露的支撑鳍条", scales, [rootA, tipA], [.03, .008]));
  }
  const tailEnd = tailPath.at(-1)!;
  parts.push(membrane("尾柄上方展开的上叶鱼尾鳍", fins, [tailEnd, [3.08, 2.89, -1.91], [3.08, 2.74, -1.35], [3.08, 1.89, -1.85]]),
    membrane("尾柄下方展开的下叶鱼尾鳍", fins, [tailEnd, [3.08, 1.89, -1.85], [3.08, .93, -1.18], [3.08, .71, -1.87]]));
  const rays: ModelPart[] = [];
  for (const end of [[3.08, 2.89, -1.91], [3.08, 2.74, -1.35], [3.08, .93, -1.18], [3.08, .71, -1.87]] as Triple[]) rays.push(tapered("从尾柄放射到鳍尖的鳍条", scales, [tailEnd, end], [.028, .008]));
  parts.push(combineMeshes("上下尾鳍相连的完整放射鳍条", scales, rays));
  return parts;
}

export const nearEasternMythicCreatureExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("anzuLionHeadedEagle", "安祖狮首鹰", "动物", anzu, ["Anzu", "Imdugud", "美索不达米亚神话", "狮首完整鹰躯", "双鹰足与分列羽翼"], "奇幻"),
  design("hippocampHorseFish", "希波坎普马鱼", "动物", hippocamp, ["Hippocamp", "古典海洋神话", "马首高颈与双前蹄", "连续鱼尾与尾鳍"], "奇幻"),
];
