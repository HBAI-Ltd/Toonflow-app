import { combineMeshes, design, leaf, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";
import { bodySurfacePoint } from "./landAnimalExpansionBatchEighteen";

const hide = "#a8b198";
const pale = "#c9cdb1";
const dark = "#7c8c76";

// https://www.fao.org/4/AD347E/ad347e08.htm
// https://academic.oup.com/mspecies/article/doi/10.1644/836.1/2600878
// 家牦牛采用短颈短肢、无垂皮、连续背脊、裙毛和全毛尾，不把野牛加毛或野家/地域拆主。
function yak(): ModelPart[] {
  const torso: [number, number, number, number][] = [[-.91, .78, .22, .25], [-.56, .88, .4, .46], [.23, .95, .42, .52], [.65, 1.03, .32, .42], [.89, .98, .19, .29]];
  const skull: [number, number, number, number][] = [[1.01, .94, .13, .17], [1.17, .99, .22, .24], [1.46, .87, .145, .18], [1.67, .79, .08, .08]];
  const parts: ModelPart[] = [body("牦牛短肢上厚深而背线连续起伏的紧凑桶躯", torso, hide), tapered("牦牛从高胸向前下伸且不带奶牛垂皮的短粗颈", hide, [[0, .99, .72], [0, .91, 1.1]], [.25, .18]), body("牦牛额宽平而下部鼻面收窄的低长头颅", skull, hide), lobe("牦牛宽额下细而可动的上唇鼻端", pale, [0, .79, 1.7], [.18, .14, .13]), lobe("牦牛鼻面前方小而不夸成野牛大鼻盾的鼻镜", dark, [0, .801, 1.754], [.115, .071, .032]), lobe("牦牛与鼻面相接且没有下垂巨须的下颌", hide, [0, .699, 1.415], [.25, .16, .47]), tapered("牦牛从尾根即披长毛而非仅尾尖有毛束的全毛尾", hide, [[0, .78, -.86], [.04, .5, -1.1], [.08, .22, -1.12]], [.07, .08, .055])];
  for (const side of [-1, 1]) {
    const eye = bodySurfacePoint(skull, side > 0 ? .38 : Math.PI - .38, 1.25, .001), earRoot: Triple = [side * .14, 1.045, 1.12];
    parts.push(lobe("牦牛沿真实颅面嵌入的侧眼", dark, [eye.x, eye.y, eye.z], [.032, .032, .022]), leaf("牦牛小而横向展开且根部埋入宽额的小耳", hide, earRoot, .09, .17, [-8, side * 12, -side * 75]), pointed("牦牛先水平外展再向上后方弯的双曲角", pale, [[side * .12, 1.11, 1.16], [side * .34, 1.12, 1.1], [side * .47, 1.32, 1.05], [side * .43, 1.62, .94]], [.045, .04, .027, 0]));
    for (const front of [true, false]) {
      const z = front ? .57 : -.6, ankle: Triple = [side * .33, .1, front ? .65 : -.56];
      parts.push(tapered(front ? "牦牛短而结实的承重前臂及细腕" : "牦牛厚短股部经后折跗骨连接宽后蹄", hide, front ? [[side * .25, .9, z], [side * .34, .48, z + .01], ankle] : [[side * .25, .8, z], [side * .37, .47, z + .23], [side * .35, .23, z - .05], ankle], front ? [.09, .06, .031] : [.12, .07, .035, .03]));
      const hoofs: ModelPart[] = [];
      for (const toe of [-1, 1]) {
        const x = ankle[0] + toe * .045;
        hoofs.push(polygon("牦牛分开且底缘较硬的山地宽蹄瓣", dark, [[x - .036, ankle[2] - .063], [x - .041, ankle[2] + .102], [x - .027, ankle[2] + .163], [x + .027, ankle[2] + .163], [x + .041, ankle[2] + .102], [x + .036, ankle[2] - .063]], .101, [0, .018, 0]), lobe("牦牛蹄后不触地的小悬蹄", dark, [ankle[0] + side * (front ? .002 : .009) + toe * .022, .156, ankle[2] - (front ? .025 : .045)], [.032, .055, .05]));
      }
      parts.push(combineMeshes("牦牛两枚真实分离主蹄和两后辅蹄构成的完整足", dark, hoofs));
    }
  }
  const skirt: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 20; i++) {
    const z = -.79 + i * .077, p = bodySurfacePoint(torso, side > 0 ? -.28 : Math.PI + .28, z, -.007);
    skirt.push(leaf("牦牛从真实下肋面垂至腿侧的粗长裙毛", hide, [p.x, p.y, p.z], .072, .51 + i % 3 * .033, [180, side * 12, -side * 14]));
  }
  parts.push(combineMeshes("牦牛胸腹肋侧连续垂落而非棉球状的完整裙毛", hide, skirt));
  const tailHair: ModelPart[] = [];
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4, u = .08 + i / 13 * .83, t = u < .5 ? u * 2 : (u - .5) * 2, x = u < .5 ? .04 * t : .04 + .04 * t, y = u < .5 ? .78 - .28 * t : .5 - .28 * t, z = u < .5 ? -.86 - .24 * t : -1.1 - .02 * t;
    tailHair.push(leaf("牦牛沿尾干全长而非尾端单点生出的长毛", hide, [x + Math.cos(a) * .034, y, z + Math.sin(a) * .032], .035, .24 + (1 - u) * .1, [176, i * 137.5 % 360, 0]));
  }
  parts.push(combineMeshes("牦牛完全披毛且形近马尾的连续尾毛", hide, tailHair));
  return parts;
}

// https://npolar.no/en/species/polar-bear/
// https://www.polarbearsinternational.org/polar-bears/polar-bear-facts/adaptations-characteristics/
// 较长躯颈、小狭长头、低肩线及宽前掌来自完整新体架，不给旧短吻高肩熊染白。
function polarBear(): ModelPart[] {
  const skull: [number, number, number, number][] = [[1.06, 1.095, .09, .12], [1.2, 1.12, .14, .15], [1.42, 1.055, .095, .085], [1.55, 1.025, .058, .05]];
  const parts: ModelPart[] = [body("北极熊无高肩峰且腰胸延长的低肩长躯", [[-.86, .72, .18, .27], [-.49, .83, .36, .45], [.24, .82, .345, .43], [.65, .85, .24, .31], [.76, .89, .15, .21]], pale), tapered("北极熊显著长于棕熊并向前平伸的粗肌肉颈", pale, [[0, .94, .57], [0, 1.08, .91], [0, 1.08, 1.15]], [.18, .14, .115]), body("北极熊相对长躯较小且鼻面狭长的低颅", skull, pale), lobe("北极熊长吻下缘没有垂皮的窄下颌", pale, [0, .954, 1.36], [.17, .11, .4]), lobe("北极熊长吻末端小而宽的黑色鼻镜", dark, [0, 1.036, 1.557], [.1, .067, .055]), tapered("北极熊较短且不伸长为犬尾的紧凑短尾", pale, [[0, .72, -.79], [.025, .65, -.88]], [.043, .02])];
  for (const side of [-1, 1]) {
    const eye = bodySurfacePoint(skull, side > 0 ? .32 : Math.PI - .32, 1.285, .001), ear = bodySurfacePoint(skull, side > 0 ? .95 : Math.PI - .95, 1.13, -.006);
    parts.push(lobe("北极熊嵌入长狭颅侧而不漂浮的细小眼", dark, [eye.x, eye.y, eye.z], [.024, .024, .0168]), lobe("北极熊短小厚毛圆耳而非大而薄的犬耳", pale, [ear.x, ear.y + .016, ear.z], [.06, .09, .045]));
    for (const front of [true, false]) {
      const z = front ? .48 : -.53, ankle: Triple = [side * (front ? .32 : .31), .085, front ? .59 : -.6];
      parts.push(tapered(front ? "北极熊连接特别宽前掌的粗直前臂" : "北极熊粗股经屈膝低踝连接较长后掌", pale, front ? [[side * .23, .82, z], [side * .35, .44, z], ankle] : [[side * .23, .72, z], [side * .37, .42, z + .13], ankle], front ? [.108, .073, .047] : [.129, .076, .043]), lobe("北极熊前宽后长而全足底接地的宽厚掌", pale, [ankle[0], .058, ankle[2] + .078], front ? [.29, .1, .36] : [.24, .1, .4]));
      const digits: ModelPart[] = [];
      for (let i = 0; i < 5; i++) {
        const x = ankle[0] + (i - 2) * (front ? .046 : .039), depth = ankle[2] + (front ? .211 : .229) - Math.abs(i - 2) * .012;
        digits.push(lobe("北极熊前后均五枚并有厚毛趾间隙的独立趾", pale, [x, .049, depth], front ? [.052, .064, .1] : [.045, .064, .098]), pointed("北极熊短强而非灰熊长掘爪的五枚曲爪", dark, [[x, .056, depth + .03], [x, .043, depth + .065], [x, .026, depth + .084]], [.012, .008, 0]));
      }
      for (const color of [pale, dark]) parts.push(combineMeshes("北极熊完整五枚宽肉趾及短强爪的前后足", color, digits.filter(toe => toe.color === color)));
    }
  }
  return parts;
}

function coatRosette(sections: [number, number, number, number][], angle: number, z: number, angularRadius: number, lengthRadius: number, broken = false): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  if (!broken) {
    for (const depth of [-.0007, .0012]) for (const radius of [1, .52]) for (let i = 0; i < 8; i++) {
      const turn = i * Math.PI / 4, irregularity = 1 + Math.sin(i * 1.7) * .11, p = bodySurfacePoint(sections, angle + Math.cos(turn) * angularRadius * radius * irregularity, z + Math.sin(turn) * lengthRadius * radius, depth);
      vertices.push({ x: p.x, y: p.y, z: p.z });
    }
    for (let i = 0; i < 8; i++) { const j = (i + 1) % 8; indices.push(i, i + 8, j, j, i + 8, j + 8, i + 16, j + 16, i + 24, j + 16, j + 24, i + 24, i, j, i + 16, j, j + 16, i + 16, i + 8, i + 24, j + 8, j + 8, i + 24, j + 24); }
    return part("沿真实毛面且中心中空的不规则玫瑰斑", "mesh", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
  }
  for (let sector = 0; sector < 8; sector++) {
    if (sector === 5) continue;
    const offset = vertices.length;
    for (const depth of [-.0007, .0012]) for (const [step, radius] of [[sector, 1], [sector + .89, 1], [sector + .89, .52], [sector, .52]]) {
      const turn = step! * Math.PI / 4, irregularity = 1 + Math.sin(step! * 1.7) * .11, p = bodySurfacePoint(sections, angle + Math.cos(turn) * angularRadius * radius! * irregularity, z + Math.sin(turn) * lengthRadius * radius!, depth);
      vertices.push({ x: p.x, y: p.y, z: p.z });
    }
    indices.push(...[0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 4, 1, 5, 4, 1, 2, 5, 2, 6, 5, 2, 3, 6, 3, 7, 6, 3, 0, 7, 0, 4, 7].map(index => index + offset));
  }
  return part("沿真实毛面具有缺口的不规则玫瑰斑边框", "mesh", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function coatDot(sections: [number, number, number, number][], angle: number, z: number, angularRadius: number, lengthRadius: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const offset of [-.0007, .0012]) {
    const center = bodySurfacePoint(sections, angle, z, offset); vertices.push({ x: center.x, y: center.y, z: center.z });
    for (let i = 0; i < 8; i++) { const turn = i * Math.PI / 4, p = bodySurfacePoint(sections, angle + Math.cos(turn) * angularRadius, z + Math.sin(turn) * lengthRadius, offset); vertices.push({ x: p.x, y: p.y, z: p.z }); }
  }
  for (let i = 0; i < 8; i++) { const a = i + 1, b = (i + 1) % 8 + 1; indices.push(0, b, a, 9, a + 9, b + 9, a, b, a + 9, b, b + 9, a + 9); }
  return part("嵌入真实毛面的闭合实心斑点", "mesh", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// https://animals.sandiegozoo.org/animals/leopard
// 单独的紧凑攀援躯与头足结构；普通豹的地域、黑化、性别及斑纹个体不另计主。
function leopard(): ModelPart[] {
  const torso: [number, number, number, number][] = [[-.64, .435, .11, .15], [-.38, .51, .21, .255], [.2, .53, .24, .3], [.54, .56, .18, .245], [.68, .61, .1, .135]];
  const skull: [number, number, number, number][] = [[.72, .755, .06, .08], [.82, .785, .12, .13], [.96, .75, .088, .083], [1.075, .723, .05, .042]];
  const parts: ModelPart[] = [body("普通豹较紧凑且前胸肌肉发达的长腰攀援躯", torso, hide), tapered("普通豹较短粗而不作美洲狮长颈的肩颈", hide, [[0, .63, .55], [0, .727, .78]], [.139, .09]), body("普通豹额圆而颧部不膨成美洲豹巨头的短圆颅", skull, hide), lobe("普通豹短厚下颌与较小的圆颏", pale, [0, .665, .929], [.18, .105, .3]), lobe("普通豹前吻鼻端的小宽鼻镜", dark, [0, .735, 1.087], [.072, .046, .033]), tapered("普通豹用于树枝平衡且不作雪豹厚筒毛尾的长尾", hide, [[0, .46, -.59], [.08, .32, -.96], [.21, .26, -1.3], [.32, .32, -1.52]], [.036, .031, .024, .014]), lobe("普通豹钝圆而不膨大的长尾末端", pale, [.32, .32, -1.526], [.035, .036, .047])];
  for (const side of [-1, 1]) {
    const eye = bodySurfacePoint(skull, side > 0 ? .36 : Math.PI - .36, .889, .001), ear = bodySurfacePoint(skull, side > 0 ? 1.02 : Math.PI - 1.02, .79, -.004);
    parts.push(lobe("普通豹沿真实短圆头侧嵌入的眼", dark, [eye.x, eye.y, eye.z], [.027, .027, .019]), lobe("普通豹贴在圆颅后上方的短圆耳", hide, [ear.x, ear.y + .022, ear.z], [.075, .1, .048]), lobe("普通豹短圆耳内部的浅短毛面", pale, [ear.x, ear.y + .028, ear.z + .018], [.046, .06, .013]), lobe("普通豹短吻两侧紧凑且真实接颅的须垫", pale, [side * .045, .728, 1.037], [.091, .083, .089]));
    for (const front of [true, false]) {
      const z = front ? .44 : -.43, ankle: Triple = [side * (front ? .205 : .211), front ? .064 : .088, z + .049];
      parts.push(tapered(front ? "普通豹适合拉起猎物的强前臂与宽腕" : "普通豹粗股与曲后跟而非猎豹极长跗部的后肢", hide, front ? [[side * .152, .56, z], [side * .23, .32, z - .026], ankle] : [[side * .14, .46, z], [side * .254, .28, z + .126], [side * .228, .134, z - .029], ankle], front ? [.075, .052, .029] : [.09, .054, .029, .025]), lobe("普通豹明显宽于腕骨的攀援肉足掌", hide, [ankle[0], .05, ankle[2] + .052], front ? [.143, .084, .205] : [.127, .084, .188]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 4; i++) toes.push(lobe("普通豹四枚短圆肉趾且长爪缩于趾鞘", hide, [ankle[0] + (i - 1.5) * (front ? .029 : .026), .039, ankle[2] + .131 + (i === 1 || i === 2 ? .012 : 0)], [.034, .055, .076]));
      if (front) toes.push(lobe("普通豹前足内侧不承重的第五悬拇趾", hide, [ankle[0] - side * .039, .121, ankle[2] - .013], [.031, .047, .043]));
      parts.push(combineMeshes("普通豹完整前五后四的柔掌短肉趾足", hide, toes));
    }
  }
  const spots: ModelPart[] = [];
  for (const side of [-1, 1]) for (const angle of [-.35, .28, .96]) for (let i = 0; i < 6; i++) spots.push(coatRosette(torso, side > 0 ? angle : Math.PI - angle, -.53 + i * .2 + (angle > .3 ? .025 : 0), .16, .029));
  for (let i = 0; i < spots.length; i += 12) parts.push(combineMeshes("普通豹贴合独立躯体且环内无中心点的完整玫瑰斑", dark, spots.slice(i, i + 12)));
  const faceSpots: ModelPart[] = [];
  for (const side of [-1, 1]) for (const angle of [.13, .85]) for (let i = 0; i < 4; i++) faceSpots.push(coatDot(skull, side > 0 ? angle : Math.PI - angle, .767 + i * .078, .052, .006));
  parts.push(combineMeshes("普通豹实际颅面上的细小实心面斑", dark, faceSpots));
  return parts;
}

// https://animals.sandiegozoo.org/animals/jaguar
// 新的宽厚短躯、巨颧颌颅、短粗四肢与短尾；玫瑰斑中的点是辅助，不拿豹换斑凑主。
function jaguar(): ModelPart[] {
  const torso: [number, number, number, number][] = [[-.62, .43, .17, .18], [-.38, .51, .28, .3], [.23, .55, .32, .34], [.6, .58, .28, .3], [.78, .61, .16, .17]];
  const skull: [number, number, number, number][] = [[.76, .76, .105, .13], [.92, .8, .17, .18], [1.06, .75, .145, .125], [1.2, .71, .095, .075]];
  const parts: ModelPart[] = [body("美洲豹宽深胸腹与较短腰背的厚肌肉躯", torso, hide), tapered("美洲豹支撑巨颌颅而短粗的强颈", hide, [[0, .67, .61], [0, .758, .861]], [.19, .14]), body("美洲豹后颞区宽深且颧颌肌发达的巨大方圆颅", skull, hide), lobe("美洲豹深厚咬肌下连续而宽阔的强下颌", pale, [0, .631, 1.016], [.27, .153, .39]), lobe("美洲豹钝宽前吻中央较大的鼻镜", dark, [0, .732, 1.222], [.132, .072, .045]), tapered("美洲豹明显短于普通豹而根部粗厚的低长尾", hide, [[0, .43, -.55], [.08, .27, -.82], [.21, .18, -1.13], [.27, .24, -1.27]], [.047, .037, .027, .016]), lobe("美洲豹不带狮式尾簇的短圆尾端", dark, [.27, .24, -1.277], [.043, .044, .06])];
  for (const side of [-1, 1]) {
    const eye = bodySurfacePoint(skull, side > 0 ? .36 : Math.PI - .36, 1.0, .001), ear = bodySurfacePoint(skull, side > 0 ? 1.0 : Math.PI - 1.0, .865, -.006);
    parts.push(lobe("美洲豹嵌入真实宽颧额面的侧前眼", dark, [eye.x, eye.y, eye.z], [.032, .032, .022]), lobe("美洲豹巨圆头后部短而圆钝的耳", hide, [ear.x, ear.y + .021, ear.z], [.091, .109, .053]), lobe("美洲豹短圆耳内部较浅的耳毛面", pale, [ear.x, ear.y + .027, ear.z + .02], [.056, .065, .017]), lobe("美洲豹颧颌前端宽厚而不成为扁鸭嘴的须垫", pale, [side * .062, .716, 1.17], [.134, .113, .137]));
    for (const front of [true, false]) {
      const z = front ? .5 : -.4, ankle: Triple = [side * (front ? .268 : .263), front ? .073 : .099, z + .049];
      parts.push(tapered(front ? "美洲豹粗短且连接厚腕的压制猎物前肢" : "美洲豹短而粗壮的股胫与较低跗部后腿", hide, front ? [[side * .22, .56, z], [side * .3, .32, z - .017], ankle] : [[side * .2, .455, z], [side * .32, .281, z + .143], [side * .29, .151, z - .031], ankle], front ? [.118, .073, .039] : [.14, .08, .039, .032]), lobe("美洲豹强壮四肢末端宽厚的大肉足掌", hide, [ankle[0], .059, ankle[2] + .063], front ? [.205, .1, .25] : [.18, .1, .231]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 4; i++) toes.push(lobe("美洲豹四枚粗壮而爪收于鞘的肉趾", hide, [ankle[0] + (i - 1.5) * (front ? .04 : .035), .046, ankle[2] + .163 + (i === 1 || i === 2 ? .016 : 0)], [.047, .069, .096]));
      if (front) toes.push(lobe("美洲豹前足内侧较高的第五悬拇趾", hide, [ankle[0] - side * .056, .143, ankle[2] - .016], [.042, .056, .052]));
      parts.push(combineMeshes("美洲豹前五后四且与细长豹足不同的粗肉趾掌", hide, toes));
    }
  }
  const rosettes: ModelPart[] = [], centers: ModelPart[] = [];
  for (const side of [-1, 1]) for (const angle of [-.38, .27, .96]) for (let i = 0; i < 6; i++) {
    const a = side > 0 ? angle : Math.PI - angle, z = -.49 + i * .216 + (angle > .5 ? .023 : 0);
    rosettes.push(coatRosette(torso, a, z, .19, .043, true));
    if (i % 3 !== 1) centers.push(coatDot(torso, a, z, .039, .008));
  }
  for (let i = 0; i < rosettes.length; i += 8) parts.push(combineMeshes("美洲豹顺随真实厚躯曲面的缺口大玫瑰斑", dark, rosettes.slice(i, i + 8)));
  parts.push(combineMeshes("美洲豹多数大环斑内部独立的中心小点", dark, centers));
  const faceSpots: ModelPart[] = [];
  for (const side of [-1, 1]) for (const angle of [.13, .9]) for (let i = 0; i < 4; i++) faceSpots.push(coatDot(skull, side > 0 ? angle : Math.PI - angle, .823 + i * .105, .055, .009));
  parts.push(combineMeshes("美洲豹宽大颧颌头部真实毛面上的细斑", dark, faceSpots));
  return parts;
}

export const landAnimalExpansionBatchThirtyDesigns: MasterNatureDesign[] = [
  design("yak", "牦牛", "动物", yak, ["Bos grunniens", "短颈短肢连续背脊无垂皮裙毛全毛尾双曲角及宽山地分蹄"]),
  design("polarBear", "北极熊", "动物", polarBear, ["Ursus maritimus", "低肩长躯长颈小狭颅宽前长后跖行五趾掌及短强爪"]),
  design("leopard", "普通豹", "动物", leopard, ["Panthera pardus", "金钱豹", "花豹", "紧凑强前躯短圆颅攀援宽柔掌细长平衡尾及无中心点玫瑰斑"]),
  design("jaguar", "美洲豹", "动物", jaguar, ["Panthera onca", "短宽深胸巨颧颌颅短粗肢大肉掌较短尾及带中心点的缺口大玫瑰斑"]),
];
