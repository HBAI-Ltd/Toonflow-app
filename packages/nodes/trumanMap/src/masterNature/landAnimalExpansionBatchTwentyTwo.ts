import { Vector3 } from "three";
import { combineMeshes, design, eyes, lobe, needle, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";
import { bodySurfacePoint } from "./landAnimalExpansionBatchEighteen";

const hide = "#a7b098";
const pale = "#c7cbaf";
const dark = "#81917b";

// https://www.ameghiniana.org.ar/index.php/ameghiniana/article/view/853
// https://doi.org/10.1016/j.cretres.2014.04.007
// 头部依据保留颅骨保守补齐，不将幼体另计主；巨大侧扁爪明确位于前手I、II指。
function megaraptor(): ModelPart[] {
  const parts: ModelPart[] = [body("大盗龙轻巧窄腰长胸而非巨盗龙深腹的完整躯", [[-1.02, 1.88, .23, .35], [-.4, 1.99, .41, .59], [.64, 2.02, .355, .5], [1.03, 2.09, .18, .31]], hide), tapered("大盗龙向前伸的长肌肉颈", hide, [[0, 2.21, .84], [0, 2.51, 1.21], [0, 2.57, 1.62]], [.22, .17, .11]), body("大盗龙低窄且前颌特别长直的尖吻颅", [[1.5, 2.58, .083, .12], [1.79, 2.6, .15, .2], [2.31, 2.53, .1, .12], [2.71, 2.505, .047, .053]], hide), body("大盗龙与长前吻等长而前端收窄的连续下颌", [[1.65, 2.43, .08, .09], [1.95, 2.395, .115, .085], [2.6, 2.436, .06, .04], [2.7, 2.45, .034, .026]], pale), ...eyes([0, 2.681, 1.85], .128, .035), pointed("大盗龙细长无帆且不拖地的平衡尾", hide, [[0, 1.85, -.92], [.035, 1.63, -1.87], [.12, 1.44, -3], [.27, 1.34, -4.04], [.4, 1.37, -4.88]], [.28, .205, .12, .05, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("大盗龙高髋细踝而非后足巨镰爪的跑行后肢", hide, [[side * .29, 1.92, -.43], [side * .5, 1.09, -.08], [side * .43, .36, -.44], [side * .425, .105, -.025]], [.23, .158, .068, .04]), lobe("大盗龙三趾窄后足的低掌", dark, [side * .425, .075, .085], [.23, .13, .36]), tapered("大盗龙具有大肌肉附着区的长强前臂", hide, [[side * .285, 2.11, .7], [side * .58, 1.61, .96], [side * .45, 1.44, 1.31]], [.115, .091, .058]), lobe("大盗龙长掌骨形成的窄长厚掌", hide, [side * .45, 1.405, 1.408], [.17, .165, .29]));
    for (let i = 0; i < 2; i++) {
      const x = side * (.412 + i * .082), z = 1.62 + i * .053, y = 1.38 - i * .034, factor = i ? .71 : 1;
      parts.push(tapered("大盗龙I、II主指中爪前细长且分离的指节", hide, [[x, 1.43, 1.48], [x, y, z]], [.037 - i * .007, .028 - i * .005]), part("大盗龙前手真实侧扁且下缘锋利的大弧爪", "extrude", pale, [x, y, z], [factor, factor, factor], [0, 90, 0], { depth: .037, profile: [{ x: .018, y: .044 }, { x: -.13, y: .009 }, { x: -.25, y: -.108 }, { x: -.292, y: -.273 }, { x: -.236, y: -.215 }, { x: -.192, y: -.116 }, { x: -.091, y: -.068 }, { x: .012, y: -.055 }] }));
    }
    parts.push(tapered("大盗龙两大指外侧保留而不等长的第三小指", hide, [[side * .515, 1.414, 1.456], [side * .57, 1.356, 1.591], [side * .578, 1.37, 1.638]], [.023, .015, .01]), pointed("大盗龙第三指约六厘米的细小末爪", pale, [[side * .578, 1.37, 1.633], [side * .58, 1.348, 1.69]], [.012, 0]));
    const toes: ModelPart[] = [];
    for (let i = 0; i < 3; i++) toes.push(tapered("大盗龙没有特化抬起第二镰趾的三枚长足趾", dark, [[side * .425 + (i - 1) * .061, .088, .18], [side * .425 + (i - 1) * .097, .043, .39 + (i === 1 ? .075 : 0)]], [.036, .023]), pointed("大盗龙普通兽脚类后足趾爪", pale, [[side * .425 + (i - 1) * .097, .047, .38 + (i === 1 ? .075 : 0)], [side * .425 + (i - 1) * .105, .023, .495 + (i === 1 ? .075 : 0)]], [.025, 0]));
    parts.push(combineMeshes("大盗龙具分离趾骨的完整三趾后足", dark, toes), pointed("大盗龙足内后侧的小悬趾", dark, [[side * .398, .19, -.014], [side * .325, .142, -.12]], [.019, 0]));
  }
  return parts;
}

// https://doi.org/10.1038/nature10906
// 丝羽在颈、上臂、骨盆、足和尾有直接印痕；连续覆盖区域按这些证据保守复原。
function yutyrannus(): ModelPart[] {
  const torso: [number, number, number, number][] = [[-1.1, 2, .25, .4], [-.4, 2.13, .5, .69], [.65, 2.2, .43, .6], [1.04, 2.35, .23, .35]];
  const neck: [number, number, number, number][] = [[.85, 2.52, .23, .28], [1.17, 2.9, .18, .25], [1.5, 3.09, .135, .19]];
  const tail: [number, number, number, number][] = [[-6.6, 1.3, .007, .007], [-5.2, 1.25, .055, .055], [-3.65, 1.45, .14, .14], [-2.2, 1.7, .22, .22], [-1, 2, .27, .27]];
  const parts: ModelPart[] = [body("羽王龙高髋而没有暴龙巨大桶形前胸的长躯", torso, hide), body("羽王龙较深且呈上举S形轮廓的颈", neck, hide), body("羽王龙长于头躯且无尾羽扇的肌肉尾", tail, hide), body("羽王龙短于暴龙且鼻部较低的细长颅", [[1.39, 3.1, .09, .15], [1.62, 3.13, .19, .245], [2.02, 3.065, .125, .15], [2.32, 3.032, .084, .086]], hide), lobe("羽王龙较轻的长下颌与厚颏", pale, [0, 2.897, 1.87], [.25, .17, .82]), ...eyes([0, 3.24, 1.7], .163, .045), part("羽王龙鼻中线具有低起伏轮廓的薄骨冠", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .045, profile: [{ x: -1.66, y: 3.25 }, { x: -1.74, y: 3.38 }, { x: -1.86, y: 3.402 }, { x: -1.94, y: 3.35 }, { x: -2.03, y: 3.365 }, { x: -2.16, y: 3.245 }, { x: -2.1, y: 3.14 }, { x: -1.8, y: 3.19 }] })];
  const plumage: ModelPart[] = [];
  for (const [sections, rows, columns, featherLength] of [[torso, 15, 24, .15], [neck, 6, 18, .18], [tail, 20, 12, .12]] as [[number, number, number, number][], number, number, number][]) {
    const first = sections[0]![0], last = sections[sections.length - 1]![0];
    for (let row = 0; row < rows; row++) for (let j = 0; j < columns; j++) {
      const z = first + (last - first) * (.03 + .94 * (row + (j % 2) * .38) / rows), angle = (j + row % 2 * .32) / columns * Math.PI * 2, root = bodySurfacePoint(sections, angle, z, -.004), normal = bodySurfacePoint(sections, angle, z, .01).sub(root).normalize(), direction = normal.multiplyScalar(.65).add(new Vector3(0, .08, -.62)).normalize(), tip = root.clone().addScaledVector(direction, featherLength * (.78 + (row * 7 + j * 11) % 9 * .035));
      plumage.push(needle("羽王龙贴合真实体表且顺向后斜的毫米级细丝羽", pale, root.toArray() as Triple, tip.toArray() as Triple, .0035));
    }
  }
  for (const side of [-1, 1]) {
    parts.push(tapered("羽王龙长股胫与低粗踝连接的强后肢", hide, [[side * .34, 2.055, -.43], [side * .58, 1.2, -.03], [side * .51, .4, -.5], [side * .49, .114, -.09]], [.255, .18, .073, .044]), lobe("羽王龙后足三趾的厚掌", dark, [side * .49, .084, .039], [.25, .145, .39]), tapered("羽王龙较长并有三指的前臂而非暴龙二指残臂", hide, [[side * .31, 2.3, .69], [side * .58, 1.89, .96], [side * .43, 1.7, 1.3]], [.092, .073, .043]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 3; i++) digits.push(pointed("羽王龙保留三枚完整抓握手指及弯爪", pale, [[side * .43 + (i - 1) * .043, 1.7, 1.293], [side * .435 + (i - 1) * .055, 1.596, 1.49], [side * .435 + (i - 1) * .054, 1.69, 1.544]], [.028, .018, 0]), pointed("羽王龙三枚普通而非伶盗龙式镰爪的长足趾", dark, [[side * .49 + (i - 1) * .067, .095, .17], [side * .49 + (i - 1) * .11, .031, .49 + (i === 1 ? .068 : 0)]], [.039, 0]));
    parts.push(combineMeshes("羽王龙完整三指手与三趾后足", pale, digits));
    for (let i = 0; i < 20; i++) {
      const t = i / 19, root: Triple = [side * (.329 + t * .21), 2.287 - t * .31, .72 + t * .21];
      plumage.push(needle("羽王龙上臂保存区的后向长丝羽", pale, root, [root[0] + side * .035, root[1] - .025, root[2] - .16], .0035));
    }
  }
  for (let i = 0; i < plumage.length; i += 50) parts.push(combineMeshes("羽王龙顺着颈躯尾臂且不膨成刺猬粗棘的丝羽层", pale, plumage.slice(i, i + 50)));
  return parts;
}

// https://doi.org/10.1111/1755-6724.13535
// 尾后段缺失以近亲补齐；肩棘以保守的后外展方向装配，不把推定方向当新状态计主。
function gigantspinosaurus(): ModelPart[] {
  const torso: [number, number, number, number][] = [[-.9, 1.02, .25, .4], [-.25, 1.08, .42, .58], [.65, 1.04, .39, .51], [.97, .97, .21, .3]];
  const parts: ModelPart[] = [body("巨棘龙高后髋与较低前肩的紧凑深躯", torso, hide), tapered("巨棘龙向前下伸的粗短颈", hide, [[0, 1.02, .79], [0, .93, 1.2], [0, .86, 1.55]], [.21, .15, .097]), body("巨棘龙相对剑龙更大且较深的植食颅", [[1.45, .86, .07, .115], [1.64, .85, .137, .18], [1.97, .79, .1, .115], [2.12, .78, .065, .065]], hide), lobe("巨棘龙前端短钝角质喙", pale, [0, .777, 2.105], [.15, .1, .115]), lobe("巨棘龙具发达下颌窗骨架的深下颌外廓", pale, [0, .681, 1.78], [.19, .12, .53]), ...eyes([0, .93, 1.68], .111, .027), pointed("巨棘龙低根长尾而不做甲龙尾锤", hide, [[0, .99, -.79], [.035, .78, -1.48], [.12, .62, -2.23], [.26, .55, -3.17]], [.23, .16, .08, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("巨棘龙股肱比大而后肢明显更长的承重后腿", hide, [[side * .29, 1.04, -.46], [side * .44, .56, -.31], [side * .39, .096, -.39]], [.16, .103, .053]), lobe("巨棘龙三趾宽后足", dark, [side * .39, .067, -.29], [.24, .11, .34]), tapered("巨棘龙肱骨短且肘低的粗壮前肢", hide, [[side * .27, .9, .6], [side * .42, .44, .65], [side * .38, .083, .77]], [.11, .071, .04]), lobe("巨棘龙短宽的承重前掌", dark, [side * .38, .058, .81], [.18, .095, .23]), pointed("巨棘龙从宽大贴身基底向后外弯的逗号形巨大肩棘", pale, [[side * .31, 1.12, .75], [side * .6, 1.1, .52], [side * .86, 1.14, -.05], [side * .99, 1.25, -.68]], [.15, .18, .112, 0]));
    const toes: ModelPart[] = [];
    for (let i = 0; i < 3; i++) toes.push(lobe("巨棘龙后足分离的三枚宽甲趾", pale, [side * .39 + (i - 1) * .065, .055, -.117], [.065, .077, .15]));
    for (let i = 0; i < 5; i++) toes.push(lobe(i < 3 ? "巨棘龙前掌内侧三枚低矮钝甲" : "巨棘龙前掌外侧缩短且无爪的指垫", i < 3 ? pale : hide, [side * (.38 + (i - 2) * .032), .047, i < 3 ? .91 : .891], i < 3 ? [.034, .06, .061] : [.029, .053, .051]));
    for (const color of [pale, hide]) parts.push(combineMeshes("巨棘龙前五后三区别且非每指均生爪的完整宽足", color, toes.filter(toe => toe.color === color)));
    for (let i = 0; i < 7; i++) {
      const z = -.73 + i * .25, p = bodySurfacePoint(torso, side > 0 ? 1.34 : Math.PI - 1.34, z, -.024), h = .18 + Math.sin(i / 6 * Math.PI) * .13;
      parts.push(part("巨棘龙双列排列且远小于肩棘的窄低背板", "extrude", pale, [p.x, p.y, p.z], [1, 1, 1], [0, 90, 0], { depth: .035, profile: [{ x: -.13, y: 0 }, { x: -.1, y: h * .55 }, { x: .025, y: h }, { x: .14, y: h * .6 }, { x: .13, y: -.035 }] }));
    }
  }
  return parts;
}

export const landAnimalExpansionBatchTwentyTwoDesigns: MasterNatureDesign[] = [
  design("megaraptor", "大盗龙", "动物", megaraptor, ["Megaraptor namunhuaiquii", "低窄长颅强长前臂两枚巨大侧扁手爪与很小第三爪"]),
  design("yutyrannus", "羽王龙", "动物", yutyrannus, ["Yutyrannus huali", "三指长前臂鼻中线波状冠及贴真实体表的细丝羽覆盖"]),
  design("gigantspinosaurus", "巨棘龙", "动物", gigantspinosaurus, ["Gigantspinosaurus sichuanensis", "巨刺龙", "低大头短前长后肢小双列背板及后外弯巨肩棘"]),
];
