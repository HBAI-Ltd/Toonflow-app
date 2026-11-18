import { combineMeshes, design, eyes, leaf, lobe, tapered, type MasterNatureDesign, type ModelPart, type Triple } from "./shared";
import { membrane } from "./animals";
import { flightFeather } from "./mythicCreatureExpansionBatchOne";

// 完整解剖母题的原创场景模型；米制为固定设定尺度，没有同形放大或配色条目。
// 九合神兽： https://www.metmuseum.org/art/collection/search/73296
// https://www.indiaboardgamesarchive.in/omekas/s/ancientindianboardgames/item/5
// 蛇颈豹： https://www.ashmolean.org/two-dog-palette
// Serpopard是现代描述性名称，不冒称古埃及传下的专名。
// 马鸡兽： https://www.theacropolismuseum.gr/en/statue-rider-hippalektryon

function navagunjara(): ModelPart[] {
  const lion = "#b7a17b", bull = "#a9a28b", peacock = "#719d96", rooster = "#b7a27d", red = "#b27968", skin = "#c7b19a", grey = "#a5a995", tiger = "#b6a06f", deer = "#b9ad8d", snake = "#8fa387", dark = "#596357";
  const parts: ModelPart[] = [
    lobe("九合神兽中段完整的狮形腰腹", lion, [0, 2.19, -.14], [1.77, 1.95, 3.69]),
    lobe("狮腰前部接出的牛肩胸", bull, [0, 2.48, .83], [1.7, 2.02, 1.65]),
    lobe("从牛肩背隆起的独立牛峰", bull, [0, 3.09, .54], [1.18, 1.56, 1.53]),
    tapered("由牛前胸伸出的孔雀长颈", peacock, [[0, 2.7, 1.15], [0, 3.67, 1.6], [0, 4.68, 1.68]], [.34, .25, .17]),
    lobe("孔雀颈顶连生的完整雄鸡头颅", rooster, [0, 4.92, 1.86], [.64, .72, .82]),
    tapered("鸡首前伸的角质短尖喙", "#c9b989", [[0, 4.88, 2.13], [0, 4.8, 2.64]], [.17, .008]),
    ...eyes([0, 5.02, 2.04], .22, .1),
    tapered("右前位置完整的象腿柱", grey, [[.59, 2.4, 1.04], [.7, 1.18, 1.24], [.72, .28, 1.48]], [.32, .29, .25]),
    lobe("象腿下方宽圆接地的象足", grey, [.72, .17, 1.51], [.8, .4, .95]),
    tapered("左后位置带膝跗转折的虎腿", tiger, [[-.6, 2.03, -1.2], [-.88, 1.05, -.8], [-.85, .31, -1.43]], [.33, .22, .12]),
    lobe("虎腿下方有趾掌形状的宽足", tiger, [-.85, .17, -1.27], [.65, .4, .83]),
    tapered("右后位置细长的鹿腿及系部", deer, [[.58, 2.04, -1.21], [.82, 1.1, -.83], [.76, .21, -1.42]], [.19, .12, .055]),
    lobe("鹿足内侧真正分开的半蹄", dark, [.698, .085, -1.35], [.135, .2, .33]),
    lobe("鹿足外侧真正分开的半蹄", dark, [.822, .085, -1.35], [.135, .2, .33]),
    tapered("第四前肢为向上举起的完整人臂", skin, [[-.58, 2.54, .99], [-1.1, 2.83, 1.43], [-1.3, 3.57, 1.8]], [.205, .14, .085]),
    lobe("人臂末端向外展开的手掌", skin, [-1.3, 3.7, 1.85], [.28, .35, .135]),
    tapered("狮腰后方接出的独立蛇尾", snake, [[0, 2.21, -1.63], [0, 2.65, -2.47], [1.04, 2.98, -2.99], [1.61, 3.64, -2.31], [1.29, 3.93, -1.79]], [.18, .16, .13, .095, .065]),
    lobe("蛇尾卷端完整的蛇首", snake, [1.29, 3.96, -1.64], [.37, .32, .57]),
    ...eyes([1.29, 4.03, -1.48], .12, .055),
  ];
  const comb: ModelPart[] = [];
  for (let index = 0; index < 5; index++) comb.push(lobe("雄鸡头顶有缺口的红色冠瓣", red, [0, 5.23 + Math.sin(index / 4 * Math.PI) * .18, 1.63 + index * .13], [.18, .36, .24]));
  parts.push(combineMeshes("沿雄鸡头顶真正相接的鸡冠", red, comb));
  for (const side of [-1, 1]) parts.push(lobe("鸡喙下方左右下垂的肉垂", red, [side * .09, 4.63, 2.05], [.2, .42, .23]));
  const fingers: ModelPart[] = [];
  for (let index = 0; index < 4; index++) fingers.push(tapered("人掌上端分开的手指", skin, [[-1.4 + index * .067, 3.8, 1.85], [-1.41 + index * .071, 4.04 - Math.abs(index - 1.5) * .035, 1.88]], [.031, .018]));
  fingers.push(tapered("向侧方展开而非第五长指的拇指", skin, [[-1.42, 3.68, 1.85], [-1.6, 3.8, 1.91]], [.045, .02]));
  parts.push(combineMeshes("完整人手的五根独立手指", skin, fingers));
  const toes: ModelPart[] = [];
  for (let index = 0; index < 3; index++) toes.push(lobe("象足前缘单独可见的趾甲", "#d2c8ac", [.46 + index * .25, .13, 1.87], [.17, .19, .08]));
  parts.push(combineMeshes("象足前缘的趾甲列", "#d2c8ac", toes));
  const tigerToes: ModelPart[] = [];
  for (let index = 0; index < 4; index++) tigerToes.push(lobe("虎足前缘分开的肉趾", tiger, [-1.07 + index * .145, .11, -1.02], [.19, .26, .37]));
  parts.push(combineMeshes("与虎掌相接的完整四趾", tiger, tigerToes));
  return parts;
}

function serpopard(): ModelPart[] {
  const hide = "#b8aa83", pale = "#cfc2a0", dark = "#6f6953";
  const parts: ModelPart[] = [
    lobe("蛇颈豹完整而纤长的猫科胸腹", hide, [0, 1.27, -.05], [.97, 1.24, 2.87]),
    lobe("长颈下方的猫科肩胛胸部", hide, [0, 1.45, .87], [1.02, 1.3, 1.05]),
    lobe("后足上方的猫科骨盆", hide, [0, 1.25, -1], [1.02, 1.2, .98]),
    tapered("从猫肩连续伸出并多次回弯的超长蛇样颈", hide, [[0, 1.59, 1.04], [0, 2.51, 1.83], [-.52, 3.31, 1.17], [-1.12, 4.43, 1.52], [-.9, 5.09, 2.42]], [.3, .25, .215, .18, .15]),
    lobe("长蛇样颈顶端的猫科头颅", hide, [-.9, 5.24, 2.61], [.71, .7, .99]),
    lobe("猫额前方完整的短吻垫", pale, [-.9, 5.12, 3.02], [.57, .35, .59]),
    lobe("短吻前端的鼻镜", dark, [-.9, 5.2, 3.24], [.24, .15, .15]),
    lobe("短吻下方的独立下颌", hide, [-.9, 4.96, 2.98], [.46, .16, .58]),
    ...eyes([-.9, 5.39, 2.89], .25, .105),
    tapered("从后躯延长并卷起的细猫尾", hide, [[0, 1.33, -1.21], [-.29, 1.02, -1.96], [-.63, 1.67, -2.42], [-.23, 2.24, -2.14]], [.105, .075, .05, .009]),
  ];
  for (const side of [-1, 1]) {
    parts.push(lobe("猫颅上方的圆短外耳", hide, [-.9 + side * .28, 5.49, 2.42], [.28, .36, .21]),
      tapered("肩下经肘腕承重的猫前肢", hide, [[side * .33, 1.4, .84], [side * .43, .7, .93], [side * .44, .19, 1.12]], [.16, .11, .065]),
      tapered("猫骨盆下方反折的后腿", hide, [[side * .33, 1.24, -.96], [side * .48, .69, -.62], [side * .46, .2, -1.13]], [.22, .13, .065]),
      lobe("蛇颈豹前足接地的圆趾掌", hide, [side * .44, .0935, 1.22], [.35, .22, .5]),
      lobe("蛇颈豹后足接地的圆趾掌", hide, [side * .46, .0935, -1.03], [.37, .22, .51]));
  }
  return parts;
}

function hippalectryon(): ModelPart[] {
  const horse = "#b6b59b", feather = "#a4b395", longFeather = "#8d9f84", mane = "#747b62", hoof = "#5a6554", claw = "#c9bc97";
  const neck = tapered("由马前胸上举的完整弧形马颈", horse, [[0, 2.15, 1.16], [0, 3.08, 1.75], [0, 3.75, 1.83]], [.47, .34, .24]);
  const parts: ModelPart[] = [
    lobe("马鸡兽前端保留的完整马肩胸", horse, [0, 1.96, .69], [1.43, 1.86, 1.98]),
    lobe("与马肩直接接合的宽鸟类后躯", feather, [0, 1.88, -.9], [1.62, 1.86, 2.48]),
    neck,
    lobe("高马颈前端长额的马首", horse, [0, 3.98, 2.08], [.78, .86, 1.14], [13, 0, 0]),
    tapered("马首完整向前下垂的长吻", horse, [[0, 3.96, 2.3], [0, 3.63, 2.95]], [.27, .23]),
    lobe("长吻末端的圆厚马鼻", horse, [0, 3.63, 2.98], [.58, .46, .57]),
    ...eyes([0, 4.13, 2.38], .28, .11),
    tapered("鸟后躯上方连成一体的尾羽根部", feather, [[0, 2.21, -1.66], [0, 2.66, -2.17]], [.36, .23]),
  ];
  const crest: ModelPart[] = [];
  const back = [0, 1, 2].map(index => neck.vertices!.slice(index * 8, index * 8 + 8).reduce((lowest, vertex) => vertex.z < lowest.z ? vertex : lowest));
  for (let index = 0; index < 8; index++) {
    const progress = .04 + index / 7 * .92, segment = progress < .5 ? 0 : 1, local = progress < .5 ? progress * 2 : progress * 2 - 1, a = back[segment]!, b = back[segment + 1]!;
    crest.push(leaf("顺马颈真实背缘排列的短鬃", mane, [a.x + (b.x - a.x) * local, a.y + (b.y - a.y) * local, a.z + (b.z - a.z) * local], .22, .43, [-31, 0, 0]));
  }
  parts.push(combineMeshes("从肩部到马枕连续生长的短鬃", mane, crest));
  const sickles: ModelPart[] = [], shafts: ModelPart[] = [];
  for (let index = -3; index <= 3; index++) {
    const root: Triple = [index * .047, 2.52, -1.99], arch: Triple = [index * .13, 3.88 - Math.abs(index) * .12, -2.75], tip: Triple = [index * .25, 2.52 - Math.abs(index) * .08, -4.35 + Math.abs(index) * .14];
    shafts.push(tapered("公鸡尾羽由上拱到后垂的连续羽轴", longFeather, [root, arch, tip], [.032, .025, .009]));
    sickles.push(flightFeather("从尾根向上拱起的宽镰羽基段", longFeather, root, arch, .47), flightFeather("镰羽顶端向后下方延长的羽片", longFeather, arch, tip, .4));
  }
  parts.push(combineMeshes("完整公鸡尾的长镰形尾羽", longFeather, sickles), combineMeshes("连接拱顶与垂尾的真实羽轴", longFeather, shafts));
  for (const side of [-1, 1]) {
    parts.push(leaf("马首上方分开的直立长耳", horse, [side * .24, 4.29, 1.86], .25, .56, [-8, side * 18, side * -15]),
      tapered("马肩下的前膝及前系部", horse, [[side * .46, 1.94, .9], [side * .53, .89, 1.11], [side * .53, .28, 1.43]], [.21, .13, .085]),
      lobe("前马腿接地的完整角质蹄", hoof, [side * .53, .1361, 1.53], [.34, .32, .47]),
      tapered("鸟后躯下有反折跗部的完整鸡后腿", feather, [[side * .47, 1.64, -1.01], [side * .61, 1.09, -.65], [side * .62, .21, -1.27]], [.24, .14, .07]));
    const toes: ModelPart[] = [];
    for (let index = -1; index <= 1; index++) toes.push(tapered("鸡后足前方分开的长趾与尖爪", claw, [[side * .62, .21, -1.27], [side * .62 + index * .15, .05, -.87], [side * .62 + index * .2, .009, -.62]], [.052, .035, .008]));
    toes.push(tapered("鸡后足向后分出的拇趾", claw, [[side * .62, .21, -1.27], [side * .62, .045, -1.58], [side * .62, .009, -1.72]], [.05, .03, .008]));
    parts.push(combineMeshes("一只鸟后足的三前一后分趾", claw, toes));
    const root: Triple = [side * .62, 2.44, -.35], elbow: Triple = [side * 1.65, 3.08, -.84], wrist: Triple = [side * 2.57, 2.87, -1.39];
    parts.push(tapered("直接从鸟后躯肩侧接出的翅骨", feather, [root, elbow, wrist], [.22, .13, .06]),
      membrane("完整鸟翼骨架内侧的覆羽面", feather, [root, elbow, wrist, [side * 2.48, 2.38, -2.4], [side * 1.14, 1.97, -1.81], [side * .56, 1.99, -.81]]));
    const quills: ModelPart[] = [];
    for (let index = 0; index < 8; index++) {
      const progress = .08 + index / 7 * .88, a = progress < .5 ? root : elbow, b = progress < .5 ? elbow : wrist, local = progress < .5 ? progress * 2 : progress * 2 - 1;
      const start = a.map((value, axis) => value + (b[axis]! - value) * local) as Triple;
      quills.push(flightFeather("鸟翼后缘伸出的独立长飞羽", longFeather, start, [side * (1.46 + index * .29), 1.92 + index * .07, -2.56 - index * .035], .43));
    }
    parts.push(combineMeshes("公鸡双翼的一侧完整飞羽列", longFeather, quills));
  }
  return parts;
}

export const nearEasternMythicCreatureExpansionBatchThreeDesigns: MasterNatureDesign[] = [
  design("navagunjaraNinePartBody", "纳瓦贡加拉九合神兽", "动物", navagunjara, ["Navagunjara", "南亚神话", "鸡首孔雀颈牛峰狮腰蛇尾", "人手与象虎鹿三种承重足"], "奇幻"),
  design("predynasticSerpopard", "古埃及蛇颈豹", "动物", serpopard, ["Serpopard", "古埃及混合生物", "猫科四足与长卷尾", "连续回弯的超长蛇样颈"], "奇幻"),
  design("hippalectryonHorseRooster", "希帕勒克特律翁马鸡兽", "动物", hippalectryon, ["Hippalectryon", "古希腊混合生物", "马前胸双前蹄", "鸟后身双鸟足羽翼与鸡尾"], "奇幻"),
];
