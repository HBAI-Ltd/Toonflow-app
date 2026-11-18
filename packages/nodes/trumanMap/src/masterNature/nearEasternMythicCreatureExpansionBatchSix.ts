import { beam, combineMeshes, design, eyes, leaf, lobe, needle, part, tapered, type MasterNatureDesign, type ModelPart, type Triple } from "./shared";
import { flightFeather } from "./mythicCreatureExpansionBatchOne";
import { felinePaw } from "./nearEasternMythicCreatureExpansionBatchTwo";

// 英国博物馆提供的两类亚述守护生物完整解剖说明：
// https://artsandculture.google.com/story/5AURV-YASbv5Jg
// https://artsandculture.google.com/asset/stone-relief-from-the-south-west-palace-of-sennacherib-room-32/xwFZXkcse51nGg
// 原创全躯，不复制浮雕形状，不以相同姿态或换首动物工厂生成；米制采用固定场景尺度。

function urmahlullu(): ModelPart[] {
  const fur = "#afa17d", skin = "#c3b29a", hair = "#78735d", crown = "#c2b58b";
  const parts: ModelPart[] = [
    lobe("乌尔马卢鲁腰下完整的四足狮形胸腹", fur, [0, 1.65, -.2], [1.83, 1.92, 4.36]),
    lobe("四狮足前端上方宽阔的狮肩", fur, [0, 1.94, 1.15], [2.02, 2.28, 1.93]),
    lobe("后狮足上方完整的猫科骨盆", fur, [0, 1.64, -1.59], [1.91, 1.91, 1.74]),
    lobe("狮肩上方直接连生的人类腰腹", skin, [0, 2.61, 1.2], [1.14, .86, .94]),
    lobe("人形腰腹向上延伸的完整双肩胸躯", skin, [0, 3.4, 1.25], [1.47, 1.67, .9]),
    tapered("人胸上端接入人首的短颈", skin, [[0, 4.01, 1.25], [0, 4.52, 1.25]], [.23, .17]),
    lobe("神冠下完整的人类头颅", skin, [0, 4.84, 1.27], [.82, 1.03, .83]),
    lobe("围住后枕与两颊后的卷发", hair, [0, 4.98, 1.12], [.91, .94, .84]),
    lobe("人面中央独立的鼻梁", skin, [0, 4.84, 1.66], [.17, .29, .22]),
    ...eyes([0, 5, 1.57], .245, .095),
    part("头顶有真实厚度的圆形神冠帽", "cylinder", crown, [0, 5.39, 1.23], [.79, .45, .79]),
    tapered("从狮腰后方延伸并卷起的完整狮尾", fur, [[0, 1.73, -2.14], [.4, 1.2, -3.02], [1.1, .71, -3.71], [1.66, 1.15, -3.91]], [.14, .095, .06, .025]),
    lobe("完整狮尾末端的毛簇", hair, [1.66, 1.15, -3.91], [.36, .42, .75], [12, 23, 0]),
  ];
  const beard: ModelPart[] = [];
  for (let index = -2; index <= 2; index++) beard.push(tapered("从人类下颌垂到胸前的长卷须", hair, [[index * .105, 4.53, 1.56], [index * .13, 4.18, 1.65], [index * .1, 3.99, 1.53]], [.09, .075, .035]));
  parts.push(combineMeshes("完整人面下相接的长卷须列", hair, beard));
  for (const side of [-1, 1]) {
    parts.push(lobe("人首两侧接合的外耳", skin, [side * .34, 4.91, 1.28], [.2, .31, .16]),
      tapered("神冠两侧从帽体长出的反弯角", crown, [[side * .29, 5.31, 1.42], [side * .49, 5.5, 1.28], [side * .18, 5.68, 1.46]], [.095, .065, .009]),
      tapered("狮肩下真实承重的完整前腿", fur, [[side * .65, 1.96, 1.21], [side * .9, 1.03, 1.44], [side * .93, .32, 1.68]], [.33, .22, .13]),
      tapered("猫科骨盆到跗部反折的完整狮后腿", fur, [[side * .65, 1.64, -1.59], [side * .93, .91, -1.12], [side * .97, .33, -1.9]], [.41, .255, .135]),
      ...felinePaw(fur, side * .93, 1.83, .68), ...felinePaw(fur, side * .97, -1.74, .71),
      tapered("人肩经肘腕向前举起的完整双臂", skin, [[side * .54, 3.97, 1.25], [side * 1.05, 3.52, 1.7], [side * 1.4, 4.1, 2.05]], [.22, .15, .09]),
      lobe("举臂末端竖起的完整人掌", skin, [side * 1.43, 4.24, 2.08], [.28, .38, .18]));
    const digits: ModelPart[] = [];
    for (let index = 0; index < 4; index++) digits.push(tapered("人掌上端真正分开的四长指", skin, [[side * 1.43 + (index - 1.5) * .044, 4.3, 2.1], [side * 1.43 + (index - 1.5) * .05, 4.55 - Math.abs(index - 1.5) * .03, 2.16]], [.025, .014]));
    digits.push(tapered("掌侧向外分出的独立拇指", skin, [[side * 1.52, 4.24, 2.08], [side * 1.7, 4.35, 2.18]], [.039, .017]));
    parts.push(combineMeshes("一只举掌完整的五指", skin, digits));
  }
  return parts;
}

function ugallu(): ModelPart[] {
  const skin = "#b2aa8d", mane = "#898168", pale = "#cfc6a5", cloth = "#a4a28c", dark = "#626653";
  const parts: ModelPart[] = [
    lobe("乌伽卢拥有双肩和胸肌的完整人形上躯", skin, [0, 2.43, 0], [1.53, 1.93, .98]),
    lobe("人形胸腹下接双腿的完整髋盆", skin, [0, 1.66, 0], [1.22, 1.12, .96]),
    tapered("人肩向上连接狮首的粗颈", skin, [[0, 3.11, .03], [0, 3.8, .13]], [.33, .26]),
    lobe("上方为狮额颧骨而非人面的大狮首", skin, [0, 3.98, .18], [1.3, 1.25, 1.21]),
    lobe("狮首前端左侧独立的宽吻垫", skin, [-.21, 3.76, .72], [.59, .47, .65]),
    lobe("狮首前端右侧独立的宽吻垫", skin, [.21, 3.76, .72], [.59, .47, .65]),
    lobe("吻垫前方的宽狮鼻", dark, [0, 3.87, .98], [.34, .22, .16]),
    lobe("狮上吻下方分离可见的下颌", skin, [0, 3.49, .65], [.76, .25, .73]),
    ...eyes([0, 4.17, .64], .43, .15),
    tapered("腰围下端向外展开的短围裙", cloth, [[0, 1.91, 0], [0, 1.36, 0]], [.5, .61]),
  ];
  const ruff: ModelPart[] = [];
  for (let index = 0; index < 12; index++) {
    const angle = index * Math.PI * 2 / 12;
    ruff.push(flightFeather("从狮首实体内接出的短鬃束", mane, [Math.sin(angle) * .22, 3.98 + Math.cos(angle) * .23, -.1], [Math.sin(angle) * .71, 3.98 + Math.cos(angle) * .73, -.29], .37));
  }
  parts.push(combineMeshes("绕狮首后部围合的完整狮鬃", mane, ruff));
  for (const side of [-1, 1]) {
    parts.push(lobe("狮首上方分开的圆形外耳", skin, [side * .48, 4.41, .07], [.38, .43, .28]),
      tapered("人形大腿向下转为鸟类长跗部", skin, [[side * .38, 1.67, 0], [side * .53, .83, .1], [side * .49, .21, .12]], [.28, .18, .07]));
    const toes: ModelPart[] = [];
    for (let index = -1; index <= 1; index++) toes.push(tapered("鹰足向前分开的长趾及尖爪", pale, [[side * .49, .21, .12], [side * .49 + index * .16, .05, .63], [side * .49 + index * .21, .009, .92]], [.056, .035, .008]));
    toes.push(tapered("鹰足向后抓地的独立拇趾", pale, [[side * .49, .21, .12], [side * .49, .045, -.25], [side * .49, .009, -.43]], [.052, .032, .008]));
    parts.push(combineMeshes("双鹰足之一完整相接的四趾", pale, toes));
    const wrist: Triple = side > 0 ? [1.22, 3.6, .45] : [-1.17, 2.3, .48];
    parts.push(tapered("狮首人躯下双肩发出的独立人臂", skin, [[side * .54, 3, .03], side > 0 ? [1.03, 3.16, .25] : [-.95, 2.55, .25], wrist], [.24, .17, .1]),
      lobe("握持兵器而与腕部接合的完整手掌", skin, [wrist[0], wrist[1] + (side > 0 ? .1 : 0), wrist[2]], [.29, .36, .22]));
  }
  parts.push(tapered("举起的短匕首与手掌相握的柄", mane, [[1.22, 3.55, .45], [1.22, 4.02, .45]], [.055, .055]),
    beam("匕首柄上清楚可见的短横护手", dark, [1.04, 4, .45], [1.4, 4, .45], .07),
    needle("从护手上方伸出的完整直匕首刃", pale, [1.22, 4.02, .45], [1.22, 4.9, .45], .22),
    tapered("另一只手握住的长节杖柄", mane, [[-1.17, 2.18, .48], [-1.17, 3.51, .48]], [.055, .055]),
    lobe("节杖上端接合的圆形杖首", dark, [-1.17, 3.52, .48], [.43, .43, .43]));
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) teeth.push(needle("狮吻下方露出的独立犬齿", pale, [side * .25, 3.64, .84], [side * .25, 3.46, .84], .09));
  parts.push(combineMeshes("狮口前缘接合的两枚犬齿", pale, teeth));
  return parts;
}

export const nearEasternMythicCreatureExpansionBatchSixDesigns: MasterNatureDesign[] = [
  design("urmahlulluLionLowerBody", "乌尔马卢鲁狮身人", "动物", urmahlullu, ["Urmahlullu", "亚述守护生物", "人首人上躯与完整双臂", "狮胸腹四猫科足与毛尾"], "奇幻"),
  design("ugalluLionHeadedEagleFeet", "乌伽卢狮首鹰足人", "动物", ugallu, ["Ugallu", "亚述守护生物", "狮首完整人躯与双臂", "双鹰足长趾与匕首节杖"], "奇幻"),
];
