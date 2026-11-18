import { combineMeshes, design, eyes, leaf, lobe, tapered, type MasterNatureDesign, type ModelPart, type Triple } from "./shared";
import { membrane } from "./animals";
import { flightFeather } from "./mythicCreatureExpansionBatchOne";

// 依据古代混合解剖母题原创完整几何；一传说只做一个固定主体，不按头数或状态扩款。
// 斯库拉： https://www.metmuseum.org/art/collection/search/646262
// https://www.metmuseum.org/exhibitions/listings/2018/dangerous-beauty/exhibition-gallery
// 象首狮： https://asia.si.edu/explore-art-culture/collections/search/edanmdm%3Afsg_F1907.8/
// 奇美拉： https://www.getty.edu/cona/CONAIconographyRecord.aspx?iconid=901000661
// https://www.getty.edu/art/exhibitions/chimaera/english.html
// 米制尺寸为场景设定，不把古代器物的厘米尺寸冒充神话生物实测。

export function felinePaw(color: string, x: number, z: number, width: number): ModelPart[] {
  const toes: ModelPart[] = [];
  for (let index = 0; index < 4; index++) toes.push(lobe("承重狮掌前缘分开的圆趾", color, [x + (index - 1.5) * width * .21, .11, z + width * .37], [width * .28, .25, width * .49]));
  return [lobe("与腕部相接的厚实狮掌", color, [x, .18, z], [width, .39, width * 1.15]), combineMeshes("狮足四趾的接地前缘", color, toes)];
}

function gajasimha(): ModelPart[] {
  const hide = "#b3a582", ear = "#c0b395", dark = "#77684f", ivory = "#d5ccb1";
  const parts: ModelPart[] = [
    lobe("象首狮由腰腹相接的完整狮形躯干", hide, [0, 2.1, -.1], [1.98, 2.15, 4.6]),
    lobe("四足狮躯前部高耸的肩胸", hide, [0, 2.53, 1.27], [2.15, 2.7, 2.35]),
    lobe("狮躯后部覆盖股骨的骨盆", hide, [0, 2.05, -1.5], [2.02, 2.12, 1.92]),
    tapered("由狮肩接入象颅的粗短颈", hide, [[0, 2.85, 1.44], [0, 3.25, 2.08]], [.65, .57]),
    lobe("具有象额和颊部的完整象首", hide, [0, 3.39, 2.28], [1.83, 2.02, 1.79]),
    tapered("从鼻额连续下垂再向上回卷的长象鼻", hide, [[0, 3.44, 2.87], [0, 2.46, 3.48], [0, 1.22, 3.76], [0, .76, 4.21], [0, 1.42, 4.48]], [.35, .29, .22, .15, .065]),
    ...eyes([0, 3.76, 2.68], .59, .14),
    tapered("狮尾从完整后躯延伸并上扬", hide, [[0, 2.16, -2.06], [.35, 1.56, -3.05], [1.05, .94, -3.71], [1.72, 1.3, -3.89]], [.15, .105, .07, .025]),
    lobe("狮尾末端而非鱼尾的毛簇", dark, [1.72, 1.3, -3.89], [.42, .42, .75], [15, 24, 0]),
  ];
  const mane: ModelPart[] = [];
  for (let index = 0; index < 12; index++) {
    const angle = index * Math.PI * 2 / 12;
    mane.push(flightFeather("象首后狮颈分层鬃束", dark, [Math.sin(angle) * .5, 3.09 + Math.cos(angle) * .51, 1.8], [Math.sin(angle) * 1.04, 3.09 + Math.cos(angle) * 1.03, 1.16], .54));
  }
  parts.push(combineMeshes("象颈后方围合的完整狮鬃", dark, mane));
  for (const side of [-1, 1]) {
    parts.push(lobe("象首两侧向外张开的宽扇耳", ear, [side * .92, 3.47, 1.99], [1.44, 1.72, .29], [0, side * 27, side * -9]),
      tapered("从口角弯出并上举的完整象牙", ivory, [[side * .46, 2.94, 2.88], [side * .76, 2.44, 3.58], [side * .9, 2.76, 4.13]], [.16, .115, .009]),
      tapered("狮肩向下连肘腕的粗前腿", hide, [[side * .72, 2.58, 1.37], [side * .9, 1.3, 1.43], [side * .86, .35, 1.88]], [.37, .25, .15]),
      tapered("狮骨盆经膝跗反折的完整后腿", hide, [[side * .72, 2.03, -1.5], [side * 1.04, 1.14, -1.06], [side * .94, .34, -1.96]], [.45, .29, .15]),
      ...felinePaw(hide, side * .86, 2.03, .72), ...felinePaw(hide, side * .94, -1.78, .73));
  }
  return parts;
}

function chimera(): ModelPart[] {
  const fur = "#b69e77", mane = "#8b785a", goat = "#c2b69b", snake = "#839b83", horn = "#cfc6ac", dark = "#574e40";
  const parts: ModelPart[] = [
    lobe("奇美拉连接前胸和后骨盆的完整狮腹", fur, [0, 1.7, -.05], [1.65, 1.85, 4.02]),
    lobe("前足上方的狮肩肌群", fur, [0, 2.04, 1.21], [1.84, 2.2, 1.9]),
    lobe("狮后腿上方的骨盆和腰肌", fur, [0, 1.77, -1.35], [1.78, 1.89, 1.67]),
    tapered("主狮首由前胸生出的粗颈", fur, [[0, 2.2, 1.34], [0, 2.76, 2.06]], [.53, .43]),
    lobe("奇美拉前端的狮颅", fur, [0, 2.98, 2.31], [1.29, 1.24, 1.3]),
    lobe("张口上方的宽狮吻", fur, [0, 2.79, 2.91], [.95, .57, .88]),
    lobe("上吻前端的狮鼻", dark, [0, 2.92, 3.23], [.37, .23, .23]),
    lobe("保留口缝的厚狮下颌", fur, [0, 2.41, 2.88], [.82, .24, .89]),
    ...eyes([0, 3.18, 2.7], .43, .14),
    tapered("从狮背中段连生而非外放的山羊长颈", goat, [[0, 2.25, -.13], [0, 3.37, -.37], [0, 4.02, -.78]], [.43, .28, .2]),
    lobe("背生山羊的狭长头颅", goat, [0, 4.13, -1.02], [.64, .81, 1.04]),
    tapered("山羊颅向后方伸出的窄吻", goat, [[0, 4.17, -1.27], [0, 4.02, -1.73]], [.22, .16]),
    tapered("山羊下颌垂下的独立颏须", mane, [[0, 3.94, -1.56], [0, 3.5, -1.39]], [.16, .009]),
    ...eyes([0, 4.31, -1.34], .25, .1),
    tapered("狮尾根转为向外盘起的完整蛇身", snake, [[0, 1.8, -1.71], [.37, 1.21, -2.83], [1.5, 1.5, -3.34], [1.71, 2.41, -2.87], [1.4, 3, -3.13], [1.4, 3.05, -3.76]], [.19, .17, .14, .12, .105, .08]),
    lobe("蛇尾末端朝外警戒的独立蛇颅", snake, [1.4, 3.08, -3.96], [.49, .43, .74]),
    lobe("蛇颅下方保留的窄下颌", goat, [1.4, 2.95, -4], [.43, .14, .62]),
    ...eyes([1.4, 3.18, -4.08], .17, .07),
  ];
  const ruff: ModelPart[] = [];
  for (let index = 0; index < 12; index++) {
    const angle = index * Math.PI * 2 / 12;
    ruff.push(flightFeather("围绕前狮颈的鬃毛尖束", mane, [Math.sin(angle) * .3, 2.88 + Math.cos(angle) * .31, 2.03], [Math.sin(angle) * .87, 2.88 + Math.cos(angle) * .88, 1.52], .41));
  }
  parts.push(combineMeshes("前狮首后环状相连的完整鬃领", mane, ruff));
  for (const side of [-1, 1]) {
    parts.push(lobe("主狮颅两侧的短圆外耳", fur, [side * .49, 3.42, 2.15], [.37, .45, .27]),
      leaf("背生山羊的侧向长耳", goat, [side * .25, 4.22, -.83], .28, .65, [8, side * 16, side * -62]),
      tapered("山羊额上向后弧伸的长角", horn, [[side * .2, 4.44, -.91], [side * .35, 5.03, -.58], [side * .43, 5.32, -.07]], [.105, .075, .009]),
      tapered("狮形前肢从肩部到接地腕部", fur, [[side * .59, 2.05, 1.2], [side * .79, 1.03, 1.23], [side * .89, .31, 1.66]], [.3, .2, .12]),
      tapered("狮形后肢的股部与反折跗段", fur, [[side * .59, 1.75, -1.29], [side * .89, .93, -.91], [side * .91, .32, -1.7]], [.37, .23, .125]),
      ...felinePaw(fur, side * .89, 1.79, .62), ...felinePaw(fur, side * .91, -1.55, .65));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) teeth.push(tapered("张开狮口前缘的上犬齿", horn, [[side * .29, 2.64, 3.04], [side * .29, 2.47, 3.04]], [.065, .009]));
  parts.push(combineMeshes("前狮口两侧的独立犬齿", horn, teeth));
  return parts;
}

function scylla(): ModelPart[] {
  const skin = "#c6b4a0", hair = "#786b5b", hide = "#9b967c", scales = "#7caaa3", fins = "#acc4aa", dark = "#4e5c53";
  const parts: ModelPart[] = [
    lobe("斯库拉鱼尾分叉之上的宽腰连接体", scales, [0, 3.05, 0], [1.72, 1.12, 1.37]),
    lobe("从腰部长出的完整女性上半躯干", skin, [0, 4.12, -.05], [1.24, 1.81, .86]),
    tapered("肩胸上方连通头颅的颈部", skin, [[0, 4.77, -.03], [0, 5.17, -.01]], [.18, .14]),
    lobe("面向前方的人类头颅", skin, [0, 5.51, .04], [.69, .89, .73]),
    lobe("包围后脑而保留面部的完整发冠", hair, [0, 5.58, -.14], [.76, .87, .76]),
    lobe("面部中央独立的鼻梁", skin, [0, 5.49, .37], [.14, .24, .19]),
    ...eyes([0, 5.61, .31], .215, .09),
  ];
  const locks: ModelPart[] = [];
  for (let index = -2; index <= 2; index++) locks.push(tapered("由后脑垂到肩背的弯发束", hair, [[index * .12, 5.77, -.37], [index * .18, 5.19, -.45], [index * .23, 4.73, -.24]], [.095, .09, .035]));
  parts.push(combineMeshes("与头顶相接的完整后垂发束", hair, locks));
  for (const side of [-1, 1]) {
    parts.push(tapered("人类肩头经肘部向外举起的双臂", skin, [[side * .46, 4.64, -.04], [side * 1.15, 4.72, .06], [side * 1.6, 5.38, .19]], [.205, .145, .1]),
      lobe("双臂末端完整的人手", skin, [side * 1.63, 5.51, .19], [.25, .4, .16], [0, 0, side * -15]),
      tapered("由同一腰腹分出的粗长海鱼尾", scales, [[side * .45, 2.98, -.13], [side * 1.18, 1.91, -.43], [side * 2.33, .69, -.27], [side * 3.16, .5, .58], [side * 3.43, 1.02, 1.44], [side * 2.92, 1.63, 2.18]], [.57, .55, .4, .28, .17, .07]),
      membrane("分叉鱼尾末端上展开的尾鳍叶", fins, [[side * 2.92, 1.63, 2.18], [side * 2.48, 2.61, 2.74], [side * 2.37, 2.43, 3.33], [side * 2.72, 1.68, 2.72]]),
      membrane("分叉鱼尾末端下展开的尾鳍叶", fins, [[side * 2.92, 1.63, 2.18], [side * 2.72, 1.68, 2.72], [side * 3.13, .69, 3.22], [side * 3.3, .68, 2.58]]));
  }
  const skirt: ModelPart[] = [];
  for (let index = 0; index < 9; index++) {
    const angle = index * Math.PI * 2 / 9;
    skirt.push(flightFeather("从腰侧覆向鱼尾根部的薄鳍裙叶", fins, [Math.sin(angle) * .46, 3.32, Math.cos(angle) * .4], [Math.sin(angle) * .98, 2.51, Math.cos(angle) * .85], .39));
  }
  parts.push(combineMeshes("连接人躯与鱼尾的围合鳍裙", fins, skirt));
  for (const side of [-1, 0, 1]) {
    const front = side === 0 ? .35 : 0;
    const root: Triple = [side * .61, 3.04, .51], head: Triple = [side * 1.17, 3.52, 1.54 + front];
    parts.push(lobe("从共同腰部连生的犬类肩胸前躯", hide, root, [.67, .79, 1.08]),
      tapered("腰侧犬前躯向外伸展的独立犬颈", hide, [[root[0], 3.22, .74], [head[0], 3.51, head[2] - .19]], [.28, .2]),
      lobe("犬颈前端有颅额的完整犬首", hide, head, [.62, .67, .84]),
      lobe("犬首前方独立延伸的长吻", hide, [head[0], 3.4, head[2] + .43], [.42, .37, .62]),
      lobe("犬长吻末端的鼻镜", dark, [head[0], 3.46, head[2] + .66], [.22, .18, .15]),
      ...eyes([head[0], 3.66, head[2] + .23], .21, .09));
    for (const flank of [-1, 1]) parts.push(leaf("犬颅上方左右分开的尖耳", hide, [head[0] + flank * .21, 3.72, head[2] - .1], .23, .42, [8, flank * 20, flank * -13]),
      tapered("犬肩前躯伸出的游泳前肢", hide, [[root[0] + flank * .22, 2.94, .79], [root[0] + flank * .3, 2.35, 1.12 + front], [root[0] + flank * .3, 1.89, 1.4 + front]], [.12, .085, .055]),
      lobe("犬前肢末端分明的前掌", hide, [root[0] + flank * .3, 1.83, 1.49 + front], [.22, .22, .37]));
  }
  return parts;
}

export const nearEasternMythicCreatureExpansionBatchTwoDesigns: MasterNatureDesign[] = [
  design("gajasimhaElephantLion", "迦阇辛哈象首狮", "动物", gajasimha, ["Gajasimha", "南亚神话", "完整长象鼻与弯象牙", "狮形四足躯干与尾簇"], "奇幻"),
  design("lycianCompositeChimera", "吕基亚奇美拉", "动物", chimera, ["Chimera", "狮主躯与四足", "背生山羊颈头", "蛇首长尾"], "奇幻"),
  design("scyllaHoundFishBody", "斯库拉海妖", "动物", scylla, ["Scylla", "古典海洋神话", "人类上躯与腰生犬前躯", "双分叉鱼尾与鳍裙"], "奇幻"),
];
