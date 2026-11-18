import { combineMeshes, design, eyes, leaf, lobe, needle, tapered, type MasterNatureDesign, type ModelPart, type Triple } from "./shared";
import { membrane } from "./animals";
import { flightFeather } from "./mythicCreatureExpansionBatchOne";

// 只取传统全身解剖母题原创几何，不复制馆藏器形或附带骑乘者。
// 海半人马： https://www.metmuseum.org/art/collection/search/200554
// 刻托斯： https://www.metmuseum.org/art/collection/search/258449
// 神话无实测体长；米制为固定场景设定，不另扩尺寸、头数或姿态。

export function dorsalFin(name: string, color: string, body: ModelPart, path: Triple[], height: number): ModelPart {
  const pieces: ModelPart[] = [];
  for (let index = 0; index < path.length - 1; index++) {
    let ridge = 0;
    for (let radial = 1; radial < 8; radial++) if (body.vertices![index * 8 + radial]!.y + body.vertices![(index + 1) * 8 + radial]!.y > body.vertices![index * 8 + ridge]!.y + body.vertices![(index + 1) * 8 + ridge]!.y) ridge = radial;
    const a = body.vertices![index * 8 + ridge]!, b = body.vertices![(index + 1) * 8 + ridge]!;
    const centerA = path[index]!, centerB = path[index + 1]!;
    const direction = [a.x - centerA[0] + b.x - centerB[0], a.y - centerA[1] + b.y - centerB[1], a.z - centerA[2] + b.z - centerB[2]] as Triple;
    const size = Math.hypot(...direction), offset = direction.map(value => value / size * height) as Triple;
    pieces.push(membrane(name, color, [[a.x, a.y, a.z], [b.x, b.y, b.z], [b.x + offset[0] * .8, b.y + offset[1] * .8, b.z + offset[2] * .8], [a.x + offset[0], a.y + offset[1], a.z + offset[2]]]));
  }
  return combineMeshes(name, color, pieces);
}

function ichthyocentaur(): ModelPart[] {
  const skin = "#c3b19a", horse = "#b3b69e", scales = "#7faaa2", fins = "#aec7af", hair = "#797563", hoof = "#58665b";
  const path: Triple[] = [[0, 1.7, -.18], [0, 1.12, -1.7], [-.8, .61, -3.05], [-2.21, .75, -3.4], [-2.8, 1.42, -2.61], [-2.5, 2.1, -1.6]];
  const tail = tapered("海半人马由马胸后方延长的连续鳞蛇鱼体", scales, path, [.64, .6, .44, .28, .14, .07]);
  const parts: ModelPart[] = [
    lobe("人躯下方保留完整双马腿的马肩前胸", horse, [0, 1.74, .72], [1.53, 1.81, 2.43]),
    lobe("从马肩上部直接接出的人类骨盆和腰", skin, [0, 2.66, 1], [1.04, .86, .86]),
    lobe("与骨盆连续相接的人类上半胸躯", skin, [0, 3.48, 1.06], [1.34, 1.51, .86]),
    tapered("人胸上方接入头颅的短颈", skin, [[0, 4.02, 1.06], [0, 4.55, 1.08]], [.23, .16]),
    lobe("海半人马独立完整的人首", skin, [0, 4.87, 1.1], [.76, .93, .77]),
    lobe("包住后枕而保留额面的卷发冠", hair, [0, 4.99, .98], [.84, .93, .8]),
    lobe("人首前面的鼻梁和鼻端", skin, [0, 4.85, 1.46], [.16, .26, .22]),
    ...eyes([0, 5.01, 1.39], .23, .09), tail,
    dorsalFin("从后体真实网格连边长出的完整背鳍", fins, tail, path, .4),
    membrane("海尾端向上张开的鱼鳍叶", fins, [[-2.5, 2.1, -1.6], [-2.5, 3.13, -1.11], [-2.5, 3.07, -.59], [-2.5, 2.22, -.97]]),
    membrane("海尾端向下张开的鱼鳍叶", fins, [[-2.5, 2.1, -1.6], [-2.5, 2.22, -.97], [-2.5, 1.18, -.52], [-2.5, .99, -1.1]]),
  ];
  const beard: ModelPart[] = [];
  for (let index = -2; index <= 2; index++) beard.push(leaf("从人下颌生长的短卷胡须", hair, [index * .095, 4.66, 1.33], .18, .46, [166, index * 7, 0]));
  parts.push(combineMeshes("沿人类下颌相接的整片短须", hair, beard));
  for (const side of [-1, 1]) {
    parts.push(tapered("从人肩经肘部伸出的完整人臂", skin, [[side * .49, 3.99, 1.05], [side * 1.1, 3.46, 1.36], [side * 1.64, 3.7, 1.8]], [.22, .16, .105]),
      lobe("伸臂末端有掌形的人手", skin, [side * 1.77, 3.74, 1.88], [.39, .25, .21], [0, side * -31, side * -18]),
      tapered("马胸下方经膝与系部承重的双马前肢", horse, [[side * .49, 1.8, 1.25], [side * .57, .91, 1.55], [side * .6, .27, 1.77]], [.22, .13, .085]),
      lobe("马前肢接地的完整角质马蹄", hoof, [side * .6, .1361, 1.89], [.35, .32, .49]));
    const fingers: ModelPart[] = [];
    for (let index = 0; index < 4; index++) fingers.push(tapered("人掌前缘分开的手指", skin, [[side * 1.87, 3.68 + index * .047, 1.9], [side * 2.09, 3.68 + index * .045, 2.03]], [.028, .016]));
    fingers.push(tapered("人手上方侧伸的拇指", skin, [[side * 1.72, 3.84, 1.88], [side * 1.81, 4.01, 1.98]], [.043, .019]));
    parts.push(combineMeshes("一只人手完整相接的独立五指", skin, fingers));
  }
  return parts;
}

function ketos(): ModelPart[] {
  const scale = "#8fa99a", pale = "#c7c5a3", fin = "#acc0a0", horn = "#d6caab", dark = "#606855";
  const path: Triple[] = [[0, 2.86, 1.9], [0, 2.15, .7], [0, 1.2, -.7], [-.5, .8, -2.7], [-1.81, .72, -4], [-3, 1.3, -4.36], [-3.35, 2.05, -3.5]];
  const body = tapered("刻托斯由窄颈膨腹再盘转收细的完整海蛇躯", scale, path, [.47, .81, 1.01, .76, .45, .25, .08]);
  const parts: ModelPart[] = [body,
    lobe("刻托斯海蛇颈前端宽大的狮样颅额", scale, [0, 3.45, 2.3], [1.78, 1.72, 2.04]),
    tapered("由颅额向前延长并下弯的上长吻", scale, [[0, 3.55, 2.7], [0, 3.25, 4.45]], [.48, .28]),
    tapered("长吻下方独立张开的厚下颌", pale, [[0, 3, 2.62], [0, 2.4, 4.35]], [.38, .16]),
    lobe("长吻前端宽鼻背与鼻端", scale, [0, 3.28, 4.35], [.72, .54, .58]),
    ...eyes([0, 3.79, 2.91], .64, .23),
    tapered("宽颅下颌后方垂下的山羊状颏须", dark, [[0, 2.89, 2.71], [0, 2.4, 2.55], [0, 2.21, 2.32]], [.18, .11, .009]),
    dorsalFin("从海蛇体真实背部边线生出的长背鳍", fin, body, path, .44),
    membrane("海蛇尾柄端向上展开的尾鳍", fin, [[-3.35, 2.05, -3.5], [-3.35, 3.24, -2.89], [-3.35, 3.04, -2.19], [-3.35, 2.13, -2.81]]),
    membrane("海蛇尾柄端向下展开的尾鳍", fin, [[-3.35, 2.05, -3.5], [-3.35, 2.13, -2.81], [-3.35, .9, -2.19], [-3.35, .73, -2.91]]),
  ];
  for (const side of [-1, 1]) {
    parts.push(flightFeather("狮样颅后方压向后背的长毛耳", scale, [side * .55, 3.98, 1.91], [side * 1.03, 4.27, .57], .54),
      lobe("长鼻前端独立的鼻孔", dark, [side * .19, 3.4, 4.57], [.13, .12, .07]),
      membrane("膨腹前侧伸出的单片鳍肢", fin, [[side * .55, 1.81, .35], [side * 2.43, .97, .7], [side * 2.61, .53, -.31], [side * .68, 1.32, -.59]]),
      tapered("鳍肢前缘从腹侧连到远端的硬鳍条", scale, [[side * .55, 1.81, .35], [side * 2.43, .97, .7], [side * 2.61, .53, -.31]], [.09, .065, .009]));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 8; index++) {
    const progress = .12 + index / 7 * .82, upperRadius = .48 - .2 * progress, lowerRadius = .38 - .22 * progress;
    const upper: Triple = [side * upperRadius * .55, 3.55 - .3 * progress - upperRadius * .55, 2.7 + 1.75 * progress];
    const lower: Triple = [side * lowerRadius * .55, 3 - .6 * progress + lowerRadius * .55, 2.62 + 1.73 * progress];
    teeth.push(needle("上长吻内侧向下的尖齿", horn, upper, [upper[0], upper[1] - .25, upper[2] + .025], .1), needle("下颌内侧向上的尖齿", horn, lower, [lower[0], lower[1] + .16, lower[2] + .02], .085));
  }
  parts.push(combineMeshes("与上下长颌实体相接的完整四列齿列", horn, teeth));
  return parts;
}

export const nearEasternMythicCreatureExpansionBatchFourDesigns: MasterNatureDesign[] = [
  design("ichthyocentaurEquineForelegs", "伊克堤俄肯陶洛斯海半人马", "动物", ichthyocentaur, ["Ichthyocentaur", "古典海洋神话", "人上躯与完整双马前肢", "连续鳞蛇后身与海尾鳍"], "奇幻"),
  design("archaicKetosSeaMonster", "刻托斯海怪", "动物", ketos, ["Ketos", "Cetus", "古典海洋神话", "狮样颅额长齿吻", "膨腹长海蛇体与双鳍肢"], "奇幻"),
];
