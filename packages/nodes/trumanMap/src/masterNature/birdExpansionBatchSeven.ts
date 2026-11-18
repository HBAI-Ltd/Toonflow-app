import { combineMeshes, design, leaf, lobe, needle, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { calibrated, feet, foldedWings, head, tail } from "./birdExpansionBatchOne";
import { talonFeet } from "./birdExpansionBatchFive";

const feather = "#a7b299";
const covert = "#819582";
const pale = "#cbd0b5";
const bare = "#b5a98d";
const dark = "#586a5d";

// https://www.parcs.canada.ca/pn-np/on/pukaskwa/nature/faune-wildlife/oiseaux-birds/faucon-falcon
function peregrineFalcon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("游隼紧凑流线的深胸躯", covert, [0, 0.235, -0.015], [0.19, 0.27, 0.3]), tapered("隼类连入圆头的短羽颈", covert, [[0, 0.33, 0.075], [0, 0.396, 0.12]], [0.041, 0.031])];
  head(parts, [0, 0.442, 0.145], [0.105, 0.115, 0.135]);
  parts.push(tapered("游隼粗基短钩嘴", bare, [[0, 0.43, 0.192], [0, 0.419, 0.238], [0, 0.386, 0.243]], [0.019, 0.013, 0.001]));
  for (const side of [-1, 1]) {
    parts.push(needle("上喙两侧真实向下突出的断颈齿", pale, [side * 0.012, 0.419, 0.218], [side * 0.013, 0.405, 0.22], 0.006), membrane("游隼没有鹰类指状翼尖的狭尖翼", covert, [[side * 0.07, 0.315, 0.065], [side * 0.26, 0.41, 0.13], [side * 0.54, 0.34, -0.09], [side * 0.6, 0.265, -0.3], [side * 0.27, 0.205, -0.24], [side * 0.075, 0.19, -0.12]]));
    parts.push(combineMeshes("收向同一尖端的狭长飞羽", covert, Array.from({ length: 8 }, (_, index) => leaf("游隼长尖初级飞羽", covert, [side * (0.12 + index * 0.054), 0.302 + Math.sin(index / 7 * Math.PI) * 0.055, -0.015 - index * 0.016], 0.041, 0.2 - index * 0.009, [-112, -side * (index * 3 + 5), 0]))));
  }
  tail(parts, [0, 0.14, -0.14], 0.11, 0.19, -102);
  talonFeet(parts, [0, 0.135, 0.015], 0.05, 0.01, 0.063);
  return parts;
}

// https://www.nzbirdsonline.org.nz/species/kea
function kea(): ModelPart[] {
  const parts: ModelPart[] = [lobe("啄羊鹦鹉前倾而有宽肩的强健胸躯", feather, [0, 0.2, -0.025], [0.2, 0.25, 0.26]), tapered("啄羊鹦鹉无长冠的粗短颈", feather, [[0, 0.29, 0.055], [0, 0.374, 0.09]], [0.052, 0.038])];
  head(parts, [0, 0.423, 0.12], [0.13, 0.14, 0.15]);
  parts.push(tapered("与巨厚凤头嘴不同的纤长弧曲上嘴", dark, [[0, 0.422, 0.173], [0, 0.416, 0.22], [0, 0.376, 0.249], [0, 0.335, 0.239]], [0.018, 0.015, 0.009, 0.001]), tapered("短而向上的独立下嘴", dark, [[0, 0.367, 0.169], [0, 0.348, 0.198], [0, 0.372, 0.214]], [0.017, 0.011, 0.002]));
  foldedWings(parts, [0, 0.254, -0.025], 0.205, 0.245);
  tail(parts, [0, 0.12, -0.12], 0.13, 0.2, -103);
  talonFeet(parts, [0, 0.1, 0.015], 0.05, 0.01, 0.053, true);
  return parts;
}

function blueCappedMotmot(): ModelPart[] {
  const parts: ModelPart[] = [lobe("翠鴗长胸小足的树栖躯", feather, [0, 0.17, -0.015], [0.13, 0.2, 0.23]), tapered("翠鴗小头下方的短粗颈", feather, [[0, 0.245, 0.062], [0, 0.32, 0.09]], [0.035, 0.027])];
  head(parts, [0, 0.36, 0.12], [0.11, 0.12, 0.14]);
  parts.push(tapered("翠鴗厚基而略下曲的较长喙", bare, [[0, 0.347, 0.171], [0, 0.34, 0.237], [0, 0.321, 0.265]], [0.017, 0.011, 0.0008]));
  foldedWings(parts, [0, 0.22, -0.025], 0.135, 0.2);
  tail(parts, [0, 0.12, -0.1], 0.075, 0.11, -101);
  const shafts: ModelPart[] = [], rackets: ModelPart[] = [];
  for (const side of [-1, 1]) {
    shafts.push(tapered("中央尾羽梳去羽片后裸露的长羽轴", covert, [[side * 0.007, 0.12, -0.1], [side * 0.011, 0.105, -0.24], [side * 0.014, 0.095, -0.32]], [0.0023, 0.0018, 0.0013]));
    rackets.push(leaf("裸轴末端真正恢复宽羽片的球拍状尾端", covert, [side * 0.014, 0.095, -0.315], 0.032, 0.075, [-100, -side * 3, 0]));
  }
  parts.push(combineMeshes("两枚中央尾羽的连续裸轴", covert, shafts), combineMeshes("两枚独立而宽阔的球拍尾端", covert, rackets));
  feet(parts, [0, 0.085, 0.005], 0.03, 0.005, 0.038);
  return parts;
}

// https://www.audubon.org/field-guide/bird/red-billed-tropicbird
function redBilledTropicbird(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鹲长而纤细的空中游禽躯", pale, [0, 0.18, -0.025], [0.17, 0.2, 0.32]), tapered("鹲肩前短而细的颈", pale, [[0, 0.24, 0.09], [0, 0.3, 0.145]], [0.035, 0.026])];
  head(parts, [0, 0.337, 0.19], [0.095, 0.11, 0.145], pale);
  parts.push(tapered("鹲细直且无管鼻的矛形长喙", bare, [[0, 0.327, 0.243], [0, 0.322, 0.326], [0, 0.318, 0.377]], [0.017, 0.01, 0.0008]));
  for (const side of [-1, 1]) {
    parts.push(membrane("鹲长而尖的海上飞翼", pale, [[side * 0.06, 0.24, 0.07], [side * 0.24, 0.34, 0.095], [side * 0.49, 0.28, -0.08], [side * 0.56, 0.2, -0.22], [side * 0.29, 0.15, -0.22], [side * 0.065, 0.13, -0.11]]));
    parts.push(combineMeshes("鹲狭翼后缘叠置的飞羽", pale, Array.from({ length: 8 }, (_, index) => leaf("收尖海鸟翼羽", pale, [side * (0.1 + index * 0.051), 0.24 + Math.sin(index / 7 * Math.PI) * 0.05, -0.01 - index * 0.01], 0.043, 0.16 - index * 0.006, [-116, -side * index * 3, 0]))));
  }
  tail(parts, [0, 0.12, -0.16], 0.07, 0.11, -97);
  parts.push(combineMeshes("两枚连续而非独立漂浮的长丝状中央尾羽", pale, [-1, 1].map(side => leaf("鹲的长中央尾羽", pale, [side * 0.005, 0.12, -0.16], 0.009, 0.55, [-92, -side * 1.5, 0]))));
  const gap = 0.032, radius = 0.0045, toeLength = 0.036, z = -0.025 + toeLength * 0.1;
  feet(parts, [0, 0.075, -0.025], gap, radius, toeLength);
  for (const side of [-1, 1]) parts.push(membrane("把后趾一同连入的四趾全蹼", bare, [[side * gap - side * toeLength * 0.16, radius * 0.23, z - toeLength * 0.44], [side * gap - toeLength * 0.43, radius * 0.28, z + toeLength * 0.85], [side * gap, radius * 0.28, z + toeLength], [side * gap + toeLength * 0.43, radius * 0.28, z + toeLength * 0.85]]));
  return parts;
}

// https://www.londonzoo.org/whats-here/animals/victoria-crowned-pigeon
function victoriaCrownedPigeon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("凤冠鸠低肩而特别宽厚的地栖胸腹", feather, [0, 0.29, -0.025], [0.32, 0.35, 0.43]), tapered("凤冠鸠细上举而前倾的短羽颈", feather, [[0, 0.4, 0.11], [0, 0.5, 0.15]], [0.05, 0.031])];
  head(parts, [0, 0.548, 0.185], [0.105, 0.12, 0.135]);
  parts.push(tapered("凤冠鸠细短的鸠形嘴", bare, [[0, 0.536, 0.236], [0, 0.53, 0.307]], [0.012, 0.0008]), lobe("喙基圆隆的蜡膜", pale, [0, 0.545, 0.241], [0.024, 0.023, 0.027]));
  const shafts: ModelPart[] = [], crests: ModelPart[] = [];
  for (let index = 0; index < 17; index++) {
    const angle = (index - 8) * Math.PI / 25, end: Triple = [Math.sin(angle) * 0.14, 0.617 + Math.cos(angle) * 0.16, 0.166];
    shafts.push(tapered("扇冠内真正分开的纤细羽轴", covert, [[(index - 8) * 0.0018, 0.597, 0.165], end], [0.002, 0.001]));
    for (const side of [-1, 1]) crests.push(leaf("羽轴末梢向两侧分出的蕾丝冠羽片", pale, end, 0.013, 0.027, [0, 0, -side * 48 + (index - 8) * 4]));
  }
  parts.push(combineMeshes("可透过间隙观察的完整扇状羽轴", covert, shafts), combineMeshes("各轴顶端双分枝的蕾丝冠", pale, crests));
  foldedWings(parts, [0, 0.35, -0.03], 0.32, 0.33);
  tail(parts, [0, 0.2, -0.19], 0.21, 0.22, -103);
  feet(parts, [0, 0.17, 0.005], 0.076, 0.012, 0.09);
  return parts;
}

// https://www.allaboutbirds.org/guide/crested_caracara/id
function crestedCaracara(): ModelPart[] {
  const parts: ModelPart[] = [lobe("卡拉鹰长腿之上的长胸而窄腰躯", covert, [0, 0.34, -0.025], [0.22, 0.29, 0.34]), tapered("卡拉鹰从前胸上举的长颈", pale, [[0, 0.42, 0.1], [0, 0.55, 0.14]], [0.042, 0.03])];
  head(parts, [0, 0.59, 0.185], [0.115, 0.095, 0.15], bare);
  parts.push(lobe("头顶近水平的低平冠帽体积", covert, [0, 0.632, 0.165], [0.112, 0.032, 0.135]), tapered("卡拉鹰厚而强钩的大嘴", bare, [[0, 0.578, 0.24], [0, 0.564, 0.305], [0, 0.524, 0.312]], [0.023, 0.017, 0.001]));
  parts.push(combineMeshes("低平冠帽后方横向披散的短冠羽", covert, Array.from({ length: 7 }, (_, index) => leaf("向后披散而非直立头角的冠羽", covert, [(index - 3) * 0.007, 0.628, 0.12], 0.019, 0.063 + index % 2 * 0.01, [-74, (index - 3) * 9, 0]))));
  foldedWings(parts, [0, 0.39, -0.025], 0.23, 0.3);
  tail(parts, [0, 0.24, -0.16], 0.14, 0.23, -105);
  talonFeet(parts, [0, 0.24, 0.015], 0.054, 0.01, 0.067);
  return parts;
}

export const birdExpansionBatchSevenDesigns: MasterNatureDesign[] = [
  design("peregrineFalcon", "游隼", "动物", peregrineFalcon, ["Falco peregrinus", "狭尖无指翼", "上喙真实断颈齿"]),
  design("kea", "啄羊鹦鹉", "动物", () => calibrated(kea(), 0.8), ["Nestor notabilis", "无冠纤长弧嘴", "强翼与对趾足"]),
  design("blueCappedMotmot", "蓝顶翠鴗", "动物", () => calibrated(blueCappedMotmot(), 0.7), ["Momotus coeruliceps", "裸轴球拍尾端", "厚基微弯长嘴"]),
  design("redBilledTropicbird", "红嘴鹲", "动物", () => calibrated(redBilledTropicbird(), 0.95), ["Phaethon aethereus", "尖翼与双长尾丝", "四趾全蹼"]),
  design("victoriaCrownedPigeon", "凤冠鸠", "动物", () => calibrated(victoriaCrownedPigeon(), 0.94), ["Goura victoria", "宽大地栖鸠躯", "透空蕾丝扇冠"]),
  design("crestedCaracara", "凤头卡拉鹰", "动物", () => calibrated(crestedCaracara(), 0.83), ["Caracara plancus", "Caracara cheriway", "长腿平头低冠帽"]),
];
