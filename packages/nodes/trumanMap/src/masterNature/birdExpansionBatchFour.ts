import { combineMeshes, design, leaf, lobe, needle, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { feet, foldedWings, head, tail } from "./birdExpansionBatchOne";
import { broadToedFeet } from "./birdExpansionBatchThree";

const feather = "#a7b19a";
const covert = "#839481";
const pale = "#cdd0b8";
const bare = "#b4a88e";
const dark = "#5a6a5d";

// https://museum.toulouse-metropole.fr/decouverte-et-reconstitution-de-loiseau-geant-disparu/
// https://doi.org/10.1111/j.1475-4983.2012.01195.x
function gastornis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("加斯顿鸟紧凑深腹与强壮后肢上的宽躯", feather, [0, 0.89, -0.035], [0.85, 1.02, 1.08]), tapered("支撑巨大头部的短厚羽颈", feather, [[0, 1.18, 0.27], [0, 1.43, 0.37], [0, 1.62, 0.46]], [0.205, 0.17, 0.135])];
  head(parts, [0, 1.745, 0.58], [0.41, 0.43, 0.44]);
  parts.push(body("深高而不具猛禽下钩的宽头上喙", [[0.7, 1.79, 0.11, 0.17], [0.94, 1.79, 0.095, 0.19], [1.09, 1.71, 0.065, 0.1], [1.13, 1.66, 0.012, 0.025]], bare), body("厚而圆缓的完整下颌", [[0.71, 1.56, 0.1, 0.055], [0.94, 1.55, 0.083, 0.063], [1.1, 1.62, 0.028, 0.022]], pale));
  for (const side of [-1, 1]) parts.push(lobe("小而无飞羽扇的退化翼", covert, [side * 0.37, 1.04, 0.025], [0.115, 0.18, 0.23]));
  parts.push(combineMeshes("短尾部连续粗疏羽束", covert, Array.from({ length: 10 }, (_, index) => leaf("加斯顿鸟短尾羽", covert, [(index - 4.5) * 0.045, 0.88, -0.43], 0.07, 0.22 + index % 3 * 0.025, [-120, (index - 4.5) * 6, 0]))));
  broadToedFeet(parts, 0.62, 0.23, 0.059, 0.25);
  return parts;
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC4814122/
function sylviornis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("林巨鸡长而低的巨大地栖鸡形躯", feather, [0, 0.65, -0.025], [0.65, 0.75, 1.03]), tapered("林巨鸡从前胸上举的中等长度粗颈", feather, [[0, 0.86, 0.31], [0, 1.08, 0.39], [0, 1.22, 0.47]], [0.12, 0.095, 0.075])];
  head(parts, [0, 1.31, 0.55], [0.28, 0.23, 0.37]);
  parts.push(body("林巨鸡宽而高的前颌喙", [[0.68, 1.3, 0.071, 0.085], [0.83, 1.285, 0.063, 0.072], [0.94, 1.25, 0.012, 0.016]], bare), lobe("喙基上方而非额后羽冠的鼻前骨质隆突", bare, [0, 1.412, 0.72], [0.1, 0.15, 0.14]));
  for (const side of [-1, 1]) parts.push(lobe("林巨鸡短粗的退化翼臂", covert, [side * 0.28, 0.78, 0.02], [0.135, 0.22, 0.33]));
  tail(parts, [0, 0.59, -0.45], 0.25, 0.32, -104);
  feet(parts, [0, 0.43, 0.015], 0.16, 0.035, 0.22);
  return parts;
}

// https://ielc.libguides.com/sdzg/factsheets/extinctteratorn/behavior
function argentavis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("阿根廷巨鹰强大的长胸与深腹", covert, [0, 0.76, -0.065], [0.73, 0.8, 1.05]), tapered("巨翼鸟较长而前伸的粗颈", feather, [[0, 0.96, 0.3], [0, 1.16, 0.41], [0, 1.29, 0.53]], [0.105, 0.075, 0.056])];
  head(parts, [0, 1.37, 0.61], [0.21, 0.23, 0.31]);
  parts.push(tapered("长而宽口基部向末端弯下的喙", bare, [[0, 1.35, 0.73], [0, 1.345, 0.93], [0, 1.26, 1.01]], [0.067, 0.045, 0.002]));
  for (const side of [-1, 1]) {
    parts.push(membrane("巨翼鸟从肩到长腕部连续的巨大翼面", feather, [[side * 0.27, 1.0, 0.23], [side * 1.12, 1.3, 0.32], [side * 2.63, 1.31, -0.12], [side * 3.22, 1.15, -0.57], [side * 2.15, 0.81, -1.02], [side * 0.72, 0.57, -0.64], [side * 0.25, 0.57, -0.35]]));
    parts.push(combineMeshes("巨翼鸟内翼长而宽的次级飞羽", covert, Array.from({ length: 16 }, (_, index) => leaf("宽大内翼羽", covert, [side * (0.37 + index * 0.125), 0.94 + index * 0.021, -0.08 - index * 0.021], 0.2, 0.77 - index * 0.015, [-111, -side * index * 1.1, 0]))));
    parts.push(combineMeshes("巨翼末端分开的八枚长飞羽", covert, Array.from({ length: 8 }, (_, index) => leaf("长而指状分离的外初级飞羽", covert, [side * (2.42 + index * 0.093), 1.25 - index * 0.018, -0.19 - index * 0.035], 0.18, 0.71 - index * 0.05, [-104, -side * (20 + index * 7), 0]))));
  }
  tail(parts, [0, 0.5, -0.48], 0.32, 0.41, -112);
  feet(parts, [0, 0.45, 0.045], 0.15, 0.033, 0.18);
  return parts;
}

// https://www.nzbirdsonline.org.nz/species/haasts-eagle
function haastsEagle(): ModelPart[] {
  const parts: ModelPart[] = [lobe("哈斯特鹰短宽翼之间的强健胸躯", covert, [0, 0.43, -0.04], [0.45, 0.56, 0.69]), tapered("哈斯特鹰连入大头的粗羽颈", feather, [[0, 0.6, 0.18], [0, 0.76, 0.25]], [0.077, 0.057])];
  head(parts, [0, 0.815, 0.31], [0.18, 0.19, 0.23]);
  parts.push(tapered("约十三厘米长的粗基强钩喙", bare, [[0, 0.8, 0.39], [0, 0.79, 0.485], [0, 0.73, 0.52]], [0.035, 0.024, 0.0015]));
  for (const side of [-1, 1]) {
    parts.push(membrane("与巨翼鸟长窄轮廓不同的鹰形短宽翼", feather, [[side * 0.16, 0.57, 0.1], [side * 0.56, 0.71, 0.17], [side * 1.14, 0.72, -0.04], [side * 1.35, 0.58, -0.24], [side * 0.87, 0.34, -0.48], [side * 0.19, 0.32, -0.34]]));
    parts.push(combineMeshes("哈斯特鹰圆宽的次级飞羽", covert, Array.from({ length: 10 }, (_, index) => leaf("内翼宽羽", covert, [side * (0.2 + index * 0.078), 0.54 + index * 0.013, -0.04 - index * 0.008], 0.13, 0.4 - index * 0.006, [-120, -side * index * 2, 0]))));
    parts.push(combineMeshes("哈斯特鹰分离的七枚指状初级飞羽", covert, Array.from({ length: 7 }, (_, index) => leaf("外翼指羽", covert, [side * (0.97 + index * 0.056), 0.66 - index * 0.014, -0.09 - index * 0.012], 0.103, 0.34 - index * 0.023, [-110, -side * (index * 8 + 10), 0]))));
    parts.push(tapered("强健而有羽套的鹰腿", feather, [[side * 0.105, 0.3, 0.045], [side * 0.13, 0.15, 0.025]], [0.046, 0.033]), tapered("粗壮的裸跗蹠", bare, [[side * 0.13, 0.16, 0.025], [side * 0.13, 0.045, 0.055]], [0.026, 0.019]));
    const toeParts: ModelPart[] = [];
    for (const index of [-1, 0, 1]) {
      const tip: Triple = [side * 0.13 + index * 0.04, 0.035, 0.17 - Math.abs(index) * 0.018];
      toeParts.push(tapered("强粗而真正分离的猎捕足趾", bare, [[side * 0.13, 0.045, 0.055], [tip[0], 0.046, tip[2] - 0.05], tip], [0.018, 0.014, 0.01]), tapered("钩曲向下的长利爪", dark, [tip, [tip[0], 0.056, tip[2] + 0.026], [tip[0], 0.035, tip[2] + 0.057], [tip[0], 0.004, tip[2] + 0.065]], [0.012, 0.01, 0.005, 0.0008]));
    }
    toeParts.push(tapered("相向夹持猎物的后趾", bare, [[side * 0.13, 0.046, 0.055], [side * 0.13, 0.035, -0.035]], [0.017, 0.011]), tapered("真正向前卷入的后趾大爪", dark, [[side * 0.13, 0.035, -0.035], [side * 0.13, 0.068, -0.064], [side * 0.13, 0.044, -0.094], [side * 0.13, 0.004, -0.094]], [0.014, 0.01, 0.005, 0.0008]));
    parts.push(combineMeshes("完整的一足四趾与四枚曲爪", bare, toeParts));
  }
  tail(parts, [0, 0.29, -0.31], 0.25, 0.34, -103);
  return parts;
}

// https://www.nzbirdsonline.org.nz/species/south-island-goose
function southIslandGoose(): ModelPart[] {
  const parts: ModelPart[] = [lobe("南岛巨鹅沉重的地栖深胸与厚腹", feather, [0, 0.38, -0.025], [0.46, 0.48, 0.61]), tapered("巨鹅由前胸上举的粗长颈", feather, [[0, 0.51, 0.21], [0, 0.72, 0.25], [0, 0.86, 0.32]], [0.08, 0.054, 0.042])];
  head(parts, [0, 0.92, 0.36], [0.145, 0.155, 0.185]);
  parts.push(body("巨鹅适于剪食草叶的方截粗喙", [[0.425, 0.895, 0.035, 0.035], [0.5, 0.88, 0.035, 0.026], [0.54, 0.877, 0.025, 0.018]], bare));
  for (const side of [-1, 1]) parts.push(lobe("明显短缩而没有长初级飞羽的残翼", covert, [side * 0.19, 0.45, 0.015], [0.16, 0.18, 0.29]), needle("内侧第二趾演化出的粗短距", bare, [side * 0.06, 0.045, 0.087], [side * 0.013, 0.055, 0.13], 0.02));
  tail(parts, [0, 0.29, -0.28], 0.16, 0.09, -111);
  feet(parts, [0, 0.23, 0.025], 0.1, 0.023, 0.13, { web: 0.75 });
  return parts;
}

// https://datazone.darwinfoundation.org/en/checklist?species=5144
function flightlessCormorant(): ModelPart[] {
  const parts: ModelPart[] = [lobe("弱翅鸬鹚低而长的潜水重躯", covert, [0, 0.31, -0.025], [0.32, 0.36, 0.6]), tapered("弱翅鸬鹚从重躯前方上举的长颈", covert, [[0, 0.4, 0.2], [0, 0.62, 0.25], [0, 0.79, 0.32]], [0.053, 0.036, 0.029])];
  head(parts, [0, 0.83, 0.36], [0.105, 0.13, 0.17], covert);
  parts.push(tapered("长嘴末端向下弯曲的鱼钩尖", bare, [[0, 0.816, 0.425], [0, 0.813, 0.54], [0, 0.786, 0.552]], [0.019, 0.011, 0.001]));
  for (const side of [-1, 1]) {
    parts.push(lobe("与身体不成飞翼比例的短小前翼", covert, [side * 0.145, 0.41, 0.02], [0.1, 0.13, 0.2]), combineMeshes("短翅上松散而明显不构成翼面的残羽", covert, Array.from({ length: 6 }, (_, index) => leaf("残翼上细而参差的短羽", covert, [side * (0.14 + index * 0.007), 0.39 - index * 0.007, -0.035], 0.018, 0.12 + index % 2 * 0.04, [-120, -side * (10 + index * 6), 0]))));
    const ankle: Triple = [side * 0.095, 0.016, -0.11], footParts: ModelPart[] = [];
    parts.push(tapered("位于重心后方的强壮泳腿", bare, [[side * 0.083, 0.215, -0.11], [side * 0.105, 0.11, -0.15], ankle], [0.024, 0.02, 0.014]));
    const ends: Triple[] = [[ankle[0], 0.005, -0.2], [ankle[0] - 0.06, 0.005, -0.012], [ankle[0], 0.005, 0.02], [ankle[0] + 0.06, 0.005, -0.012]];
    for (const end of ends) footParts.push(tapered("四枚独立趾骨包括向后的第一趾", bare, [ankle, end], [0.009, 0.003]));
    parts.push(combineMeshes("四趾连续泳足骨架", bare, footParts), membrane("把后趾也连入的真正全蹼足", bare, ends));
  }
  tail(parts, [0, 0.23, -0.28], 0.17, 0.28, -106);
  return parts;
}

// https://kzncranefoundation.org.za/about-south-african-cranes/grey-crowned-cranes/
function greyCrownedCrane(): ModelPart[] {
  const parts: ModelPart[] = [lobe("灰冠鹤长腿上的高肩窄腹", feather, [0, 0.52, -0.025], [0.27, 0.32, 0.4]), tapered("冠鹤从前胸弯举的细长羽颈", feather, [[0, 0.61, 0.14], [0, 0.79, 0.18], [0, 0.94, 0.23]], [0.046, 0.031, 0.025])];
  head(parts, [0, 0.98, 0.26], [0.095, 0.1, 0.12], covert);
  parts.push(tapered("冠鹤较短的直锥喙", bare, [[0, 0.966, 0.3], [0, 0.954, 0.403]], [0.012, 0.001]), lobe("前喉下方真正悬垂的裸皮囊", "#b48c7a", [0, 0.885, 0.259], [0.038, 0.075, 0.03]));
  const crown: ModelPart[] = [];
  for (let index = 0; index < 28; index++) {
    const angle = index * Math.PI * 2 / 28, lean = 0.7 + index % 3 * 0.1;
    crown.push(needle("从后冠放射而出的无羽片硬羽轴", pale, [Math.cos(angle) * 0.02, 1.019, 0.23 + Math.sin(angle) * 0.02], [Math.cos(angle) * 0.115 * lean, 1.105 + index % 3 * 0.012, 0.23 + Math.sin(angle) * 0.1], 0.0025));
  }
  parts.push(combineMeshes("真实放射状稻草冠而非实心扇片", pale, crown));
  foldedWings(parts, [0, 0.57, -0.025], 0.28, 0.34);
  tail(parts, [0, 0.42, -0.18], 0.14, 0.17);
  feet(parts, [0, 0.4, 0.015], 0.061, 0.011, 0.095);
  return parts;
}

function saddleBilledStork(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鞍嘴鹳很高腿上的大而厚实的鹳躯", pale, [0, 0.75, -0.035], [0.4, 0.45, 0.58]), tapered("鞍嘴鹳长而前举的粗直颈", covert, [[0, 0.87, 0.18], [0, 1.13, 0.23], [0, 1.3, 0.31]], [0.067, 0.047, 0.036])];
  head(parts, [0, 1.36, 0.35], [0.135, 0.16, 0.18], covert);
  parts.push(body("鞍嘴鹳粗高而长直的楔形大喙", [[0.41, 1.342, 0.032, 0.047], [0.57, 1.332, 0.027, 0.039], [0.72, 1.318, 0.014, 0.022], [0.8, 1.303, 0.0015, 0.002]], bare), lobe("位于喙基上方横宽鞍形的额盾", pale, [0, 1.414, 0.435], [0.085, 0.042, 0.085]));
  for (const side of [-1, 1]) parts.push(lobe("喙基左右短而下垂的肉质小须", bare, [side * 0.03, 1.292, 0.413], [0.018, 0.051, 0.02]));
  foldedWings(parts, [0, 0.82, -0.035], 0.42, 0.48);
  tail(parts, [0, 0.58, -0.26], 0.22, 0.22);
  feet(parts, [0, 0.56, 0.025], 0.09, 0.017, 0.15);
  return parts;
}

// https://animaldiversity.org/accounts/Probosciger_aterrimus/
function palmCockatoo(): ModelPart[] {
  const parts: ModelPart[] = [lobe("棕榈凤头鹦鹉宽肩而直立的胸躯", covert, [0, 0.265, -0.025], [0.21, 0.3, 0.26]), lobe("连接大头与宽胸的短厚颈", covert, [0, 0.402, 0.04], [0.145, 0.18, 0.15])];
  head(parts, [0, 0.48, 0.085], [0.15, 0.17, 0.16], covert);
  parts.push(tapered("非常粗大且向下内卷的上颌", dark, [[0, 0.49, 0.145], [0, 0.491, 0.202], [0, 0.451, 0.23], [0, 0.405, 0.205]], [0.037, 0.03, 0.019, 0.001]), tapered("与上嘴始终保留实际间隙的短粗下颌", dark, [[0, 0.417, 0.141], [0, 0.4, 0.173], [0, 0.433, 0.187]], [0.025, 0.02, 0.003]), lobe("露于实际嘴隙中的舌端", "#ae897b", [0, 0.434, 0.177], [0.022, 0.013, 0.027]));
  for (const side of [-1, 1]) parts.push(lobe("贴合头部的裸露颊皮区", "#b78b7c", [side * 0.063, 0.455, 0.115], [0.008, 0.061, 0.063]));
  parts.push(combineMeshes("头顶向后放射的十五厘米长冠羽", covert, Array.from({ length: 11 }, (_, index) => leaf("细长而分开的凤头冠羽", covert, [(index - 5) * 0.005, 0.538, 0.05], 0.015, 0.12 + index % 3 * 0.015, [-15 - Math.abs(index - 5) * 4, (index - 5) * 8, (index - 5) * 5]))));
  foldedWings(parts, [0, 0.325, -0.02], 0.21, 0.24);
  tail(parts, [0, 0.16, -0.12], 0.14, 0.24, -104);
  for (const side of [-1, 1]) {
    const ankle: Triple = [side * 0.051, 0.029, 0.01];
    parts.push(tapered("短粗裸露跗蹠", bare, [[side * 0.043, 0.12, -0.005], ankle], [0.013, 0.009]));
    parts.push(combineMeshes("两前两后的鹦鹉对趾抓足", bare, [-1, 1].flatMap(end => [-1, 1].map(spread => tapered("对向夹握的足趾", bare, [ankle, [ankle[0] + spread * 0.017, 0.009, ankle[2] + end * 0.045], [ankle[0] + spread * 0.02, 0.003, ankle[2] + end * 0.05]], [0.006, 0.004, 0.001])))));
  }
  return parts;
}

// https://nationalzoo.si.edu/animals/king-vulture
function kingVulture(): ModelPart[] {
  const parts: ModelPart[] = [lobe("王鹫圆满而宽大的胸腹", pale, [0, 0.365, -0.035], [0.37, 0.43, 0.48]), tapered("从肩羽中伸出的裸露短颈", bare, [[0, 0.49, 0.12], [0, 0.65, 0.17]], [0.065, 0.038])];
  head(parts, [0, 0.71, 0.215], [0.12, 0.14, 0.155], bare);
  parts.push(tapered("王鹫深高且强钩曲的嘴", bare, [[0, 0.69, 0.273], [0, 0.673, 0.344], [0, 0.62, 0.358]], [0.032, 0.022, 0.0015]), lobe("鼻孔上方明确隆起的肉质垂冠", "#baab84", [0, 0.718, 0.292], [0.035, 0.066, 0.051]));
  const collar = Array.from({ length: 12 }, (_, index) => { const angle = index * Math.PI * 2 / 12; return lobe("短而蓬松的深色颈领羽束", covert, [Math.cos(angle) * 0.064, 0.54, 0.13 + Math.sin(angle) * 0.058], [0.048, 0.06, 0.045]); });
  parts.push(combineMeshes("在裸颈下方完整环绕的短羽领", covert, collar));
  foldedWings(parts, [0, 0.43, -0.025], 0.38, 0.37);
  tail(parts, [0, 0.245, -0.23], 0.18, 0.14, -112);
  feet(parts, [0, 0.225, 0.015], 0.08, 0.017, 0.105);
  return parts;
}

export const birdExpansionBatchFourDesigns: MasterNatureDesign[] = [
  design("gastornisLaurenti", "加斯顿鸟", "动物", gastornis, ["Gastornis laurenti", "灭绝鸟类简化形态复原", "大深喙与钝趾甲"]),
  design("sylviornis", "林巨鸡", "动物", sylviornis, ["Sylviornis neocaledoniae", "灭绝鸟类简化形态复原", "长低躯与喙前骨隆"]),
  design("argentavis", "阿根廷巨鹰", "动物", argentavis, ["Argentavis magnificens", "灭绝鸟类简化形态复原", "极大连续滑翔翼"]),
  design("haastsEagle", "哈斯特鹰", "动物", haastsEagle, ["Aquila moorei", "Hieraaetus moorei", "Harpagornis moorei", "灭绝鸟类简化形态复原", "强粗四趾曲爪"]),
  design("southIslandGoose", "南岛巨鹅", "动物", southIslandGoose, ["Cnemiornis calcitrans", "灭绝鸟类简化形态复原", "方截喙与短残翼"]),
  design("flightlessCormorant", "弱翅鸬鹚", "动物", flightlessCormorant, ["Phalacrocorax harrisi", "Nannopterum harrisi", "短残翼与强泳腿", "四趾全蹼"]),
  design("greyCrownedCrane", "灰冠鹤", "动物", greyCrownedCrane, ["Balearica regulorum", "放射硬羽冠", "细颈裸喉囊"]),
  design("saddleBilledStork", "鞍嘴鹳", "动物", saddleBilledStork, ["Ephippiorhynchus senegalensis", "高腿长楔喙", "鞍形额盾"]),
  design("palmCockatoo", "棕榈凤头鹦鹉", "动物", palmCockatoo, ["Probosciger aterrimus", "粗大钩嘴保留嘴隙", "长冠与对趾足"]),
  design("kingVulture", "王鹫", "动物", kingVulture, ["Sarcoramphus papa", "鼻上肉质垂冠", "裸颈与短羽领"]),
];
