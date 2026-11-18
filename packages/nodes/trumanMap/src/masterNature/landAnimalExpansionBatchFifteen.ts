import { combineMeshes, design, eyes, leaf, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#a9b29b";
const pale = "#c7caad";
const dark = "#82917b";

function triangularCanine(side: number): ModelPart {
  const vertices = [{ x: side * .126 - .027, y: .766, z: .849 }, { x: side * .126 + .027, y: .766, z: .849 }, { x: side * .126, y: .766, z: .922 }, { x: side * .137 - .019, y: .499, z: .914 }, { x: side * .137 + .019, y: .499, z: .914 }, { x: side * .137, y: .499, z: .969 }, { x: side * .142, y: .315, z: .943 }];
  const indices = [0, 2, 1];
  for (let i = 0; i < 3; i++) { const j = (i + 1) % 3; indices.push(i, j, i + 3, j, j + 3, i + 3, i + 3, j + 3, 6); }
  return part("袋剑齿兽具有纵向加劲棱而非扁猫刀片的三角截面犬齿", "mesh", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// https://peerj.com/articles/9346/
// 只作已知形态复原；不因剑齿外形推定与猫科相同的捕杀行为。
function thylacosmilus(): ModelPart[] {
  const parts: ModelPart[] = [body("袋剑齿兽短腰深胸且肩部厚实的非猫式躯", [[-.51, .54, .15, .22], [-.19, .58, .26, .31], [.34, .64, .26, .33], [.56, .65, .15, .2]], hide), lobe("袋剑齿兽有力的颈背稳定肌", hide, [0, .72, .4], [.43, .47, .49]), tapered("袋剑齿兽与颅在近水平线上衔接的粗短颈", hide, [[0, .74, .45], [0, .79, .64]], [.15, .12]), lobe("袋剑齿兽犬齿根上伸形成的隆顶颅及上颌", hide, [0, .815, .75], [.34, .4, .45]), lobe("袋剑齿兽狭短且不加猫式前门齿的面", pale, [0, .72, .943], [.235, .2, .23]), lobe("袋剑齿兽很深的下颌后段", hide, [0, .57, .776], [.27, .2, .38]), ...eyes([0, .876, .78], .133, .026), tapered("袋剑齿兽明显长于剑齿虎残短尾的肌肉尾", hide, [[0, .51, -.44], [.07, .31, -.77], [.17, .17, -1.1], [.23, .16, -1.29]], [.085, .062, .035, .012])];
  for (const side of [-1, 1]) {
    parts.push(lobe("袋剑齿兽颅后小圆外耳", hide, [side * .125, .922, .62], [.071, .1, .062]), triangularCanine(side), part("袋剑齿兽沿巨犬齿内侧向下延伸的下颌护缘", "extrude", hide, [side * .119, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .047, profile: [{ x: -.73, y: .632 }, { x: -.92, y: .604 }, { x: -.948, y: .352 }, { x: -.906, y: .282 }, { x: -.826, y: .327 }, { x: -.796, y: .49 }, { x: -.692, y: .535 }] }));
    for (const front of [true, false]) {
      const z = front ? .345 : -.335, ankle: Triple = [side * .21, .082, z + .054];
      parts.push(tapered(front ? "袋剑齿兽粗壮低腕而非长跑猫式前肢" : "袋剑齿兽较短的稳步承重后肢", hide, [[side * .18, front ? .625 : .52, z], [side * .255, .32, z - .036], ankle], front ? [.1, .076, .036] : [.11, .072, .034]), lobe("袋剑齿兽不把爪收进猫科趾鞘的宽掌", dark, [ankle[0], .052, ankle[2] + .055], [.15, .084, .21]));
      const digits: ModelPart[] = [];
      for (let i = 0; i < 4; i++) digits.push(pointed("袋剑齿兽外露而不作猫式可伸缩结构的趾爪", pale, [[ankle[0] + (i - 1.5) * .027, .05, ankle[2] + .118], [ankle[0] + (i - 1.5) * .035, .02, ankle[2] + .191]], [.012, 0]));
      if (front) digits.push(pointed("袋剑齿兽前掌内侧较高的拇爪", pale, [[ankle[0] - side * .058, .11, ankle[2] + .02], [ankle[0] - side * .082, .062, ankle[2] + .073]], [.014, 0]));
      parts.push(combineMeshes("袋剑齿兽完整宽掌及非收缩趾爪", pale, digits));
    }
  }
  return parts;
}

// https://digitalcollections.amnh.org/archive/Mesonyx-2URM1THJO4L.html
// 扁蹄形末节与奔跑足参照AMNH馆刊、Mesonychidae骨学；不将其归为现代犬科。
function mesonyx(): ModelPart[] {
  const parts: ModelPart[] = [body("中爪兽短腰且背部较刚直的奔跑躯", [[-.5, .58, .13, .19], [-.18, .62, .21, .27], [.34, .64, .2, .25], [.53, .65, .12, .17]], hide), tapered("中爪兽前伸而不高举的中长颈", hide, [[0, .71, .4], [0, .79, .68]], [.13, .099]), lobe("中爪兽低长颅和较宽颞部", hide, [0, .79, .816], [.25, .265, .47]), lobe("中爪兽较窄且前端圆钝的长吻", pale, [0, .724, 1.024], [.19, .14, .19]), lobe("中爪兽长下颌与厚而不尖的颏", hide, [0, .654, .862], [.2, .118, .42]), ...eyes([0, .865, .835], .092, .023), tapered("中爪兽连续长尾而非现代蹄兽的细绳尾", hide, [[0, .56, -.44], [.075, .4, -.78], [.18, .25, -1.045], [.245, .23, -1.22]], [.065, .054, .034, .01])];
  for (const side of [-1, 1]) {
    parts.push(leaf("中爪兽颅后小型直立外耳复原", hide, [side * .095, .88, .668], .076, .14, [-10, 0, -side * 15]), pointed("中爪兽颌前短而粗的锥形犬齿", pale, [[side * .077, .724, 1.0], [side * .083, .65, 1.03]], [.018, 0]));
    for (const front of [true, false]) {
      const z = front ? .345 : -.335, ankle: Triple = [side * .185, .163, z + .015];
      parts.push(tapered(front ? "中爪兽腕上较长且直立的前肢" : "中爪兽粗股和高跟的趾行后肢", hide, front ? [[side * .15, .63, z], [side * .205, .36, z - .018], ankle] : [[side * .16, .56, z], [side * .245, .34, z + .088], [side * .205, .18, z - .055], ankle], front ? [.065, .036, .024] : [.09, .049, .026, .024]));
      const digits: ModelPart[] = [];
      for (let i = 0; i < 4; i++) {
        const x = ankle[0] + (i - 1.5) * .036, length = i === 1 || i === 2 ? .125 : .102;
        digits.push(tapered("中爪兽四枚分离的短掌骨及趾节", hide, [[ankle[0] + (i - 1.5) * .016, .164, ankle[2]], [x, .069, ankle[2] + length * .6]], [.015, .013]), polygon("中爪兽每个趾端独立的扁平窄裂小蹄", dark, [[x - .017, ankle[2] + .052], [x - .021, ankle[2] + length], [x - .006, ankle[2] + length + .011], [x, ankle[2] + length + .003], [x + .006, ankle[2] + length + .011], [x + .021, ankle[2] + length], [x + .017, ankle[2] + .052]], .052, [0, .014, 0]));
      }
      parts.push(combineMeshes("中爪兽四趾各有独立小蹄而非狗爪或偶蹄", dark, digits));
    }
  }
  return parts;
}

// https://www.floridamuseum.ufl.edu/florida-vertebrate-fossils/species/amphicyon-longiramus/
function amphicyon(): ModelPart[] {
  const parts: ModelPart[] = [body("犬熊宽腰深腹且前胸特别强壮的慢行躯", [[-.66, .64, .19, .29], [-.25, .72, .33, .43], [.42, .79, .34, .44], [.67, .81, .2, .29]], hide), lobe("犬熊承托长巨颅的高肩肌群", hide, [0, .87, .43], [.64, .61, .65]), tapered("犬熊粗壮而向前平伸的颈", hide, [[0, .87, .53], [0, .9, .83]], [.2, .15]), lobe("犬熊明显长于熊而非短猫吻的巨颅后段", hide, [0, .92, 1.005], [.35, .38, .58]), lobe("犬熊长而深的独立前吻", pale, [0, .808, 1.28], [.265, .215, .35]), lobe("犬熊用于支撑宽臼齿列的长厚下颌", hide, [0, .73, 1.08], [.29, .16, .57]), ...eyes([0, 1.018, 1.01], .128, .028), tapered("犬熊长于现代熊短尾的粗根长尾", hide, [[0, .62, -.56], [.07, .37, -.9], [.19, .19, -1.25], [.285, .19, -1.5]], [.095, .079, .046, .017])];
  for (const side of [-1, 1]) {
    parts.push(lobe("犬熊颅后小而圆的外耳", hide, [side * .123, 1.062, .825], [.09, .13, .07]), pointed("犬熊上颌较短粗的刺状犬齿", pale, [[side * .105, .812, 1.263], [side * .114, .703, 1.292]], [.023, 0]));
    for (const front of [true, false]) {
      const z = front ? .435 : -.435, ankle: Triple = [side * .255, .14, z + .012];
      parts.push(tapered(front ? "犬熊宽关节且前臂粗重的承重前肢" : "犬熊较短而有宽跟关节的后肢", hide, [[side * .21, front ? .75 : .615, z], [side * .315, .37, z - .033], ankle], front ? [.122, .084, .05] : [.135, .085, .047]), lobe("犬熊从跟到掌都接地的长宽跖行足", dark, [ankle[0], .067, ankle[2] + .052], [.21, .115, .31]));
      const digits: ModelPart[] = [];
      for (let i = 0; i < 5; i++) digits.push(pointed("犬熊五枚相互分离且不缩入猫趾套的短爪", pale, [[ankle[0] + (i - 2) * .033, .063, ankle[2] + .155], [ankle[0] + (i - 2) * .041, .022, ankle[2] + .239 - Math.abs(i - 2) * .015]], [.016, 0]));
      parts.push(combineMeshes("犬熊宽跖行掌前缘的完整五趾爪列", pale, digits));
    }
  }
  return parts;
}

export const landAnimalExpansionBatchFifteenDesigns: MasterNatureDesign[] = [
  design("thylacosmilus", "袋剑齿兽", "动物", thylacosmilus, ["Thylacosmilus atrox", "三角截面巨犬齿深下颌护缘隆顶颅及非伸缩足爪"]),
  design("mesonyx", "中爪兽", "动物", mesonyx, ["Mesonyx", "短刚腰粗奔跑肢与四趾各自独立的扁窄裂小蹄"]),
  design("amphicyon", "犬熊", "动物", amphicyon, ["Amphicyon longiramus", "宽慢行躯长巨颅宽关节跖行掌与粗长尾"]),
];
