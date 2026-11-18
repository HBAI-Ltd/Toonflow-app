import { combineMeshes, design, eyes, leaf, lobe, needle, tapered, type MasterNatureDesign, type ModelPart, type Triple } from "./shared";
import { membrane } from "./animals";
import { flightFeather } from "./mythicCreatureExpansionBatchOne";
import { dorsalFin } from "./nearEasternMythicCreatureExpansionBatchFour";

// 独立完整主体，固定米制场景尺度；不从旧马、狮、人形工厂换首或加配件扩主。
// 羊鱼： https://www.metmuseum.org/art/collection/search/327048
// 帕祖祖： https://www.metmuseum.org/art/collection/search/327485
// https://www.britishmuseum.org/collection/object/W_1899-0418-5
// 库萨里库的反向人牛解剖： British Museum馆方说明，登记1888,0512,Bu.780。
// https://artsandculture.google.com/asset/white-calcite-marble-cylinder-seal-with-a-combat-scene/4gF91BFJZhRP1A

function goatFish(): ModelPart[] {
  const fur = "#b6b39b", horn = "#8b8b72", hoof = "#59665b", scale = "#88aaa0", fin = "#b8c6aa";
  const path: Triple[] = [[0, 1.42, -.13], [0, .81, -1.5], [-.8, .51, -2.81], [-2, .75, -2.61], [-2.21, 1.31, -1.7]];
  const tail = tapered("山羊前胸后方连续收细再回弯的完整鱼后体", scale, path, [.5, .45, .31, .16, .06]);
  const parts: ModelPart[] = [
    lobe("羊鱼短宽且有胸骨的山羊肩胸", fur, [0, 1.45, .45], [1.13, 1.48, 1.72]),
    tapered("由羊肩上举的短弧形山羊颈", fur, [[0, 1.72, .86], [0, 2.46, 1.14]], [.35, .21]),
    lobe("有额骨与狭颊的完整山羊头颅", fur, [0, 2.63, 1.38], [.64, .73, .94]),
    lobe("从羊面向前伸出的窄口鼻", fur, [0, 2.48, 1.81], [.44, .36, .65]),
    lobe("山羊前吻的鼻镜", hoof, [0, 2.54, 2.04], [.29, .17, .1]),
    ...eyes([0, 2.8, 1.63], .24, .1),
    tapered("山羊下颌下垂而不属于马鬃的长颏须", horn, [[0, 2.36, 1.71], [0, 1.87, 1.49]], [.14, .009]),
    tail, dorsalFin("沿真实鱼身网格连边长出的尾背鳍", fin, tail, path, .28),
    membrane("羊鱼尾柄上方张开的尾鳍叶", fin, [[-2.21, 1.31, -1.7], [-2.21, 2.26, -1.24], [-2.21, 2.08, -.68], [-2.21, 1.38, -1.12]]),
    membrane("羊鱼尾柄下方张开的尾鳍叶", fin, [[-2.21, 1.31, -1.7], [-2.21, 1.38, -1.12], [-2.21, .39, -.7], [-2.21, .25, -1.24]]),
  ];
  for (const side of [-1, 1]) {
    parts.push(tapered("山羊额部向后反弯的完整长角", horn, [[side * .2, 2.89, 1.18], [side * .35, 3.55, .81], [side * .32, 3.71, .16], [side * .2, 3.3, -.18]], [.105, .085, .055, .009]),
      leaf("山羊头侧向外伸出的狭长耳", fur, [side * .25, 2.8, 1.24], .23, .57, [6, side * 18, side * -66]),
      tapered("从山羊前胸经膝到系部的细前肢", fur, [[side * .33, 1.5, .69], [side * .43, .71, .88], [side * .43, .18, 1.15]], [.15, .09, .05]),
      lobe("羊前足分开的内侧半蹄", hoof, [side * .43 - .071, .1021, 1.23], [.135, .24, .37]),
      lobe("羊前足分开的外侧半蹄", hoof, [side * .43 + .071, .1021, 1.23], [.135, .24, .37]));
  }
  return parts;
}

function pazuzu(): ModelPart[] {
  const hide = "#a4a58c", bone = "#c3bda1", wing = "#b8bea0", dark = "#696d57";
  const parts: ModelPart[] = [
    lobe("帕祖祖瘦窄并有胸骨形状的完整人形胸躯", hide, [0, 2.35, 0], [.98, 1.75, .67]),
    lobe("胸躯下接狭腹与髋部的完整骨盆", hide, [0, 1.63, -.03], [.85, .96, .7]),
    tapered("大妖首下方异常纤细而连续的颈", hide, [[0, 2.99, .02], [0, 3.47, .09]], [.16, .115]),
    lobe("犬狮混合的宽额妖首", hide, [0, 3.68, .15], [.97, .98, .9]),
    lobe("妖首前端凸起的宽短犬吻", hide, [0, 3.49, .57], [.64, .41, .57]),
    lobe("犬吻下方分离可见的下颌", hide, [0, 3.26, .54], [.58, .25, .59]),
    lobe("短犬吻前端的宽鼻镜", dark, [0, 3.6, .79], [.34, .23, .16]),
    ...eyes([0, 3.8, .49], .32, .18),
    tapered("由髋后伸出并回卷的完整蝎尾轴", hide, [[0, 1.65, -.31], [0, 1.14, -.91], [.4, .99, -1.5], [.83, 1.46, -1.9], [.73, 2.14, -1.84], [.25, 2.54, -1.5]], [.13, .14, .14, .12, .1, .06]),
    lobe("蝎尾卷端独立膨大的毒囊", dark, [.25, 2.52, -1.5], [.32, .33, .46]),
    needle("蝎尾毒囊末端向内钩的尖刺", bone, [.25, 2.54, -1.5], [.1, 2.34, -1.1], .14),
  ];
  const ribs: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 5; index++) ribs.push(tapered("瘦胸侧可见的弯曲肋弓", bone, [[side * .15, 2.77 - index * .13, .18], [side * .34, 2.74 - index * .13, .24], [side * .39, 2.63 - index * .13, .06]], [.027, .03, .025]));
  parts.push(combineMeshes("贴合完整人躯两侧的肋弓", bone, ribs));
  const beard: ModelPart[] = [];
  for (let index = -2; index <= 2; index++) beard.push(leaf("绕妖首下颌垂下的短须", dark, [index * .11, 3.31, .58], .18, .35, [169, index * 9, 0]));
  parts.push(combineMeshes("妖首下颌的连续短须圈", dark, beard));
  for (const [x, y, z] of [[0, 1.14, -.91], [.4, .99, -1.5], [.83, 1.46, -1.9], [.73, 2.14, -1.84]] as Triple[]) parts.push(lobe("弯蝎尾轴上真实相连的宽尾节", hide, [x, y, z], [.34, .32, .4]));
  for (const side of [-1, 1]) {
    parts.push(lobe("妖首额顶左右突起的眉骨瘤", hide, [side * .24, 3.99, .32], [.3, .25, .26]),
      tapered("妖额两侧短小后弯的角", bone, [[side * .28, 4.01, .01], [side * .38, 4.35, -.16], [side * .28, 4.46, -.31]], [.08, .055, .009]),
      tapered("人形骨盆下接鸟类跗段的承重腿", hide, [[side * .28, 1.65, 0], [side * .4, .86, .12], [side * .38, .17, .15]], [.205, .12, .06]));
    const wrist: Triple = side > 0 ? [.96, 3.84, .26] : [-.84, 1.75, .5];
    parts.push(tapered("从人肩到肘腕相接的独立双臂", hide, [[side * .37, 2.85, .02], side > 0 ? [.8, 3.3, .16] : [-.77, 2.26, .23], wrist], [.17, .125, .075]),
      lobe("伸臂末端有掌形的抓握手", hide, [wrist[0], wrist[1] + (side > 0 ? .13 : -.13), wrist[2]], [.24, .35, .17]));
    const digits: ModelPart[] = [], toes: ModelPart[] = [];
    for (let index = 0; index < 4; index++) {
      const x = wrist[0] + (index - 1.5) * .056, y = wrist[1] + (side > 0 ? .23 : -.23), z = wrist[2];
      digits.push(tapered("抓握人手前缘弯曲的长指", hide, [[x, y, z], [x, y + side * .17, z + .07], [x, y + side * .14, z + .17]], [.026, .022, .009]));
    }
    digits.push(tapered("掌侧独立伸出的弯拇指", hide, [[wrist[0] + side * .09, wrist[1] + side * .05, wrist[2]], [wrist[0] + side * .2, wrist[1] + side * .16, wrist[2] + .1]], [.038, .012]));
    parts.push(combineMeshes("双手之一的完整五指", hide, digits));
    for (let index = -1; index <= 1; index++) toes.push(tapered("鸟类鹰足向前分开的三趾", bone, [[side * .38, .17, .15], [side * .38 + index * .13, .045, .53], [side * .38 + index * .17, .009, .78]], [.045, .03, .008]));
    toes.push(tapered("鹰足向后抓地的独立拇趾", bone, [[side * .38, .17, .15], [side * .38, .04, -.16], [side * .38, .009, -.36]], [.043, .027, .008]));
    parts.push(combineMeshes("完整承重鹰足的三前一后趾", bone, toes));
    for (const upper of [true, false]) {
      const root: Triple = [side * (upper ? .32 : .28), upper ? 2.8 : 2.3, -.17], elbow: Triple = [side * 1.24, upper ? 3.44 : 2.21, upper ? -.41 : -.55], tip: Triple = [side * (upper ? 2.34 : 2.01), upper ? 3.69 : 1.5, upper ? -.55 : -.82];
      parts.push(tapered("由背部独立长出的四翼之一的连续翼骨", hide, [root, elbow, tip], [.16, .105, .05]),
        membrane("四翼之一沿翼骨连续相接的覆羽面", wing, [root, elbow, tip, [tip[0] * .98, tip[1] - .5, tip[2] - .55], [side * .7, upper ? 2.2 : 1.48, -.71]]));
      const feathers: ModelPart[] = [];
      for (let index = 0; index < 7; index++) {
        const progress = .08 + index / 6 * .86, a = progress < .5 ? root : elbow, b = progress < .5 ? elbow : tip, local = progress < .5 ? progress * 2 : progress * 2 - 1;
        const start = a.map((value, axis) => value + (b[axis]! - value) * local) as Triple;
        feathers.push(flightFeather("从真实翼骨内部长出的分列长羽", wing, start, [side * (1.04 + index * .31), upper ? 2.17 + index * .11 : 1.82 - index * .14, -1.3 - index * .07], .36));
      }
      parts.push(combineMeshes("四翼之一完整连接的飞羽列", wing, feathers));
    }
  }
  return parts;
}

function kusarikku(): ModelPart[] {
  const skin = "#bdb19a", bull = "#a6a58b", hair = "#78735f", hoof = "#596256", horn = "#c7c1a3";
  const parts: ModelPart[] = [
    lobe("库萨里库宽厚而直立的完整牛臀下身", bull, [0, 1.92, 0], [1.78, 1.54, 1.31]),
    lobe("从牛臀向上直接接出的人类腰腹", skin, [0, 2.68, .12], [1.29, .97, .85]),
    lobe("具有人类肩胸而不是牛胸的上半躯", skin, [0, 3.35, .15], [1.62, 1.61, .95]),
    tapered("人胸上方连接人首的短颈", skin, [[0, 3.97, .15], [0, 4.43, .15]], [.24, .18]),
    lobe("牛角之间保留完整人面的人类头颅", skin, [0, 4.78, .17], [.87, 1.07, .85]),
    lobe("人额之后与双耳之间的卷发冠", hair, [0, 4.94, .03], [.95, .94, .88]),
    lobe("人脸前方清楚的鼻梁", skin, [0, 4.78, .57], [.18, .32, .24]),
    ...eyes([0, 4.95, .49], .255, .1),
    tapered("从牛臀后方垂下的完整牛尾", bull, [[0, 2.09, -.48], [.35, 1.55, -.94], [.61, .95, -1.16], [.4, .55, -.91]], [.1, .075, .055, .035]),
    lobe("牛尾末端的窄长毛簇", hair, [.4, .55, -.91], [.29, .44, .39]),
  ];
  const beard: ModelPart[] = [];
  for (let index = -2; index <= 2; index++) beard.push(tapered("从人类下颌向胸前垂下的卷须束", hair, [[index * .105, 4.47, .45], [index * .13, 4.13, .55], [index * .09, 3.93, .47]], [.095, .08, .035]));
  parts.push(combineMeshes("完整人面下方连续的长胡须", hair, beard));
  for (const side of [-1, 1]) {
    parts.push(tapered("人首两侧向外上弯的牛角", horn, [[side * .33, 5.14, .1], [side * .68, 5.48, .03], [side * .73, 5.87, .18]], [.13, .09, .009]),
      leaf("人首两侧伸出的宽牛耳", bull, [side * .33, 4.99, .06], .33, .62, [0, side * 18, side * -74]),
      lobe("牛臀两侧下接股骨的肌肉", bull, [side * .57, 1.8, -.05], [.96, 1.49, 1.06]),
      tapered("牛后肢经膝跗和系部的完整承重链", bull, [[side * .57, 1.93, 0], [side * .85, 1.23, .5], [side * .73, .65, -.22], [side * .77, .23, .1]], [.37, .265, .17, .09]),
      lobe("牛足真正分开的内侧半蹄", hoof, [side * .77 - .1, .1361, .26], [.18, .32, .47]),
      lobe("牛足真正分开的外侧半蹄", hoof, [side * .77 + .1, .1361, .26], [.18, .32, .47]),
      tapered("人肩下方经肘腕伸出的完整人臂", skin, [[side * .59, 3.85, .15], [side * 1.18, 3.4, .46], [side * 1.7, 3.61, .92]], [.25, .18, .11]),
      lobe("人臂末端完整的抓握手掌", skin, [side * 1.83, 3.66, 1.01], [.4, .31, .22], [0, side * -29, side * -13]));
    const fingers: ModelPart[] = [];
    for (let index = 0; index < 4; index++) fingers.push(tapered("人手前缘弯向前方的长指", skin, [[side * 1.94, 3.57 + index * .06, 1.04], [side * 2.15, 3.57 + index * .057, 1.21], [side * 2.13, 3.54 + index * .057, 1.3]], [.032, .026, .016]));
    fingers.push(tapered("与四长指分开的拇指", skin, [[side * 1.77, 3.78, 1], [side * 1.87, 3.98, 1.1]], [.045, .02]));
    parts.push(combineMeshes("一只人手完整相接的五指", skin, fingers));
  }
  return parts;
}

export const nearEasternMythicCreatureExpansionBatchFiveDesigns: MasterNatureDesign[] = [
  design("eaGoatFishComposite", "埃阿羊鱼神兽", "动物", goatFish, ["Goat-fish", "Ea", "美索不达米亚神话", "完整山羊胸颈双分蹄", "后弯长角颏须与鱼后体"], "奇幻"),
  design("pazuzuFourWingDemon", "帕祖祖四翼风魔", "动物", pazuzu, ["Pazuzu", "美索不达米亚神话", "犬狮首瘦人躯双臂", "双鹰足四羽翼与弯蝎尾"], "奇幻"),
  design("kusarikkuHumanBullLowerBody", "库萨里库牛身人", "动物", kusarikku, ["Kusarikku", "美索不达米亚神话", "完整人首人胸与双臂", "牛角牛耳牛臀双后腿分蹄"], "奇幻"),
];
