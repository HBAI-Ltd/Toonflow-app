import { combineMeshes, design, leaf, lobe, needle, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { body } from "./fishForms";
import { feet, foldedWings, head, tail } from "./birdExpansionBatchOne";

const feather = "#a7b29a";
const covert = "#849582";
const pale = "#cbd0b7";
const bare = "#b4a78d";

// https://www.nzbirdsonline.org.nz/species/south-island-adzebill
function southIslandAdzebill(): ModelPart[] {
  const parts: ModelPart[] = [lobe("巨秧鸡前重而短翼的桶形地栖躯", feather, [0, 0.42, -0.025], [0.41, 0.47, 0.57]), tapered("支撑重型凿嘴的大颈部", feather, [[0, 0.57, 0.17], [0, 0.74, 0.23], [0, 0.85, 0.31]], [0.087, 0.065, 0.052])];
  head(parts, [0, 0.92, 0.38], [0.18, 0.19, 0.25]);
  parts.push(body("巨秧鸡长而侧扁的重型凿嘴", [[0.47, 0.906, 0.044, 0.061], [0.61, 0.895, 0.041, 0.057], [0.76, 0.864, 0.025, 0.035], [0.82, 0.824, 0.004, 0.008]], bare));
  for (const side of [-1, 1]) parts.push(lobe("前肢中短小而无发达飞羽的残翼", covert, [side * 0.175, 0.5, -0.005], [0.125, 0.19, 0.3]));
  tail(parts, [0, 0.3, -0.26], 0.18, 0.13, -111);
  feet(parts, [0, 0.27, 0.015], 0.1, 0.026, 0.17);
  return parts;
}

// https://www.nzbirdsonline.org.nz/species/south-island-takahe
function southIslandTakahe(): ModelPart[] {
  const parts: ModelPart[] = [lobe("南岛秧鸡非常厚重的卵形低腹躯", covert, [0, 0.26, -0.035], [0.34, 0.36, 0.4]), lobe("与卵体前端连续的短厚羽颈", covert, [0, 0.385, 0.105], [0.15, 0.2, 0.17])];
  head(parts, [0, 0.478, 0.16], [0.12, 0.13, 0.15], covert);
  parts.push(body("南岛秧鸡极深而短粗的楔嘴", [[0.211, 0.46, 0.027, 0.047], [0.281, 0.447, 0.025, 0.041], [0.329, 0.432, 0.003, 0.006]], "#b68b7a"), lobe("在额部明显上延的真实硬额盾", "#b68b7a", [0, 0.526, 0.19], [0.056, 0.077, 0.027]));
  for (const side of [-1, 1]) parts.push(lobe("藏于厚覆羽内而不具飞羽扇的短翼", feather, [side * 0.14, 0.303, -0.03], [0.135, 0.18, 0.28]));
  parts.push(combineMeshes("很短并藏在腰羽下的尾部", feather, [-1, 0, 1].map(side => leaf("短软尾羽", feather, [side * 0.018, 0.18, -0.205], 0.048, 0.055, [-104, -side * 8, 0]))));
  feet(parts, [0, 0.15, 0.005], 0.075, 0.018, 0.12);
  return parts;
}

// https://www.nhm.ac.uk/discover/worlds-collide-great-auk.html
function greatAuk(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大海雀直立而前腹饱满的游禽躯", covert, [0, 0.345, -0.015], [0.27, 0.43, 0.32]), tapered("海雀从肩部收细上举的短颈", covert, [[0, 0.46, 0.055], [0, 0.59, 0.09]], [0.058, 0.04])];
  head(parts, [0, 0.66, 0.13], [0.13, 0.15, 0.17], covert);
  parts.push(body("大海雀深扁上喙上真正起伏的竖向刻槽", [[0.19, 0.651, 0.018, 0.039], [0.22, 0.656, 0.021, 0.048], [0.229, 0.654, 0.017, 0.041], [0.241, 0.653, 0.021, 0.047], [0.25, 0.65, 0.017, 0.04], [0.262, 0.647, 0.02, 0.045], [0.273, 0.644, 0.016, 0.038], [0.286, 0.64, 0.018, 0.041], [0.298, 0.636, 0.014, 0.033], [0.311, 0.63, 0.013, 0.026], [0.33, 0.618, 0.001, 0.004]], bare), body("下喙与上喙之间的真实嘴缝", [[0.19, 0.6, 0.016, 0.012], [0.23, 0.595, 0.017, 0.015], [0.239, 0.596, 0.014, 0.011], [0.252, 0.597, 0.017, 0.014], [0.265, 0.599, 0.013, 0.011], [0.278, 0.602, 0.014, 0.012], [0.291, 0.606, 0.011, 0.009], [0.308, 0.61, 0.008, 0.006], [0.329, 0.616, 0.001, 0.001]], bare));
  for (const side of [-1, 1]) parts.push(part("仍有鸟翼折角而短小的海雀游翼", "extrude", covert, [side * 0.125, 0.475, -0.015], [1, 1, 1], [0, 90, side * 8], { depth: 0.018, profile: [{ x: 0, y: 0 }, { x: 0.058, y: -0.025 }, { x: 0.085, y: -0.19 }, { x: 0.045, y: -0.255 }, { x: 0, y: -0.13 }, { x: -0.014, y: -0.026 }] }));
  tail(parts, [0, 0.18, -0.125], 0.1, 0.12, -132);
  feet(parts, [0, 0.17, -0.025], 0.075, 0.013, 0.095, { web: 0.93, hindToe: false });
  return parts;
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC2526106/
function icadyptes(): ModelPart[] {
  const parts: ModelPart[] = [lobe("伊卡企鹅修长而厚实的直立游泳躯", feather, [0, 0.7, -0.025], [0.51, 1.04, 0.53]), tapered("伊卡企鹅粗壮而明显上举的颈", feather, [[0, 1.01, 0.08], [0, 1.23, 0.15], [0, 1.36, 0.23]], [0.12, 0.077, 0.062])];
  head(parts, [0, 1.435, 0.3], [0.17, 0.19, 0.25]);
  parts.push(body("伊卡企鹅超长而细尖的矛状喙", [[0.39, 1.42, 0.036, 0.033], [0.54, 1.418, 0.029, 0.026], [0.73, 1.413, 0.017, 0.016], [0.9, 1.407, 0.0015, 0.0015]], bare));
  for (const side of [-1, 1]) parts.push(part("强直且翼尖骤收的真实鳍翼", "extrude", covert, [side * 0.23, 1.035, 0.005], [1, 1, 1], [0, 90, side * 12], { depth: 0.038, profile: [{ x: 0, y: 0 }, { x: 0.082, y: -0.025 }, { x: 0.14, y: -0.44 }, { x: 0.106, y: -0.58 }, { x: 0.07, y: -0.6 }, { x: 0.015, y: -0.41 }, { x: -0.025, y: -0.055 }] }));
  tail(parts, [0, 0.27, -0.23], 0.15, 0.19, -134);
  feet(parts, [0, 0.3, -0.025], 0.115, 0.022, 0.16, { web: 0.94, hindToe: false });
  return parts;
}

// https://repository.si.edu/bitstream/handle/10088/4566/Presbyornis.pdf
function presbyornis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("筛嘴古鸭高腿上的纤小涉禽躯", feather, [0, 0.53, -0.015], [0.21, 0.26, 0.32]), tapered("连接小躯与鸭形头的细长颈", feather, [[0, 0.62, 0.105], [0, 0.79, 0.13], [0, 0.94, 0.19]], [0.036, 0.025, 0.02])];
  head(parts, [0, 0.986, 0.23], [0.09, 0.1, 0.14]);
  parts.push(body("古鸭宽而扁平的上嘴", [[0.28, 0.972, 0.023, 0.013], [0.354, 0.969, 0.031, 0.011], [0.398, 0.963, 0.016, 0.006]], bare), body("有真实开缝的下嘴筛缘", [[0.28, 0.949, 0.022, 0.006], [0.354, 0.947, 0.029, 0.006], [0.397, 0.955, 0.015, 0.002]], bare));
  const lamellae: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 11; index++) lamellae.push(needle("嘴缘间独立成列的角质滤片", pale, [side * (0.024 + Math.sin(index / 10 * Math.PI) * 0.005), 0.961, 0.288 + index * 0.008], [side * (0.022 + Math.sin(index / 10 * Math.PI) * 0.004), 0.952, 0.29 + index * 0.008], 0.0016));
  parts.push(combineMeshes("左右两列有间隙的真实筛嘴滤片", pale, lamellae));
  foldedWings(parts, [0, 0.57, -0.02], 0.22, 0.27);
  tail(parts, [0, 0.43, -0.14], 0.11, 0.105, -110);
  feet(parts, [0, 0.43, 0.015], 0.051, 0.009, 0.08, { web: 0.9 });
  return parts;
}

export const birdExpansionBatchSixDesigns: MasterNatureDesign[] = [
  design("southIslandAdzebill", "南岛巨秧鸡", "动物", southIslandAdzebill, ["Aptornis defossor", "灭绝鸟类简化形态复原", "重型凿嘴与粗壮四趾"]),
  design("southIslandTakahe", "南岛秧鸡（Takahē）", "动物", southIslandTakahe, ["Porphyrio hochstetteri", "深短楔嘴与硬额盾", "厚卵躯短残翼"]),
  design("greatAuk", "大海雀", "动物", greatAuk, ["Pinguinus impennis", "灭绝鸟类简化形态复原", "深扁刻槽喙与短游翼"]),
  design("icadyptes", "伊卡企鹅", "动物", icadyptes, ["Icadyptes salasi", "灭绝鸟类简化形态复原", "超长矛喙与强直鳍翼"]),
  design("presbyornis", "筛嘴古鸭", "动物", presbyornis, ["Presbyornis pervetus", "灭绝鸟类简化形态复原", "高腿细颈与鸭形筛嘴"]),
];
