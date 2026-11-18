import { combineMeshes, design, leaf, lobe, needle, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { fourFeet, head } from "./mammalForms";
import { membrane } from "./animals";
import { pointed } from "./insectForms";

const fur = "#a9b399";
const pale = "#c7cbb0";
const dark = "#8b9985";

function claws(parts: ModelPart[], roots: Triple[], spread: number, thickness: number, frontDigits = 5, rearDigits = frontDigits) {
  const pieces: ModelPart[] = [];
  roots.forEach((root, end) => { for (const side of [-1, 1]) { const count = end ? rearDigits : frontDigits, z = root[2] + thickness * (end ? -0.3 : 0.4); for (let i = 0; i < count; i++) { const x = root[0] + side * spread + (i - (count - 1) / 2) * thickness * 0.3; pieces.push(pointed("具名兽类实际从趾端伸出的爪", pale, [[x, thickness * 0.4, z + thickness * 0.7], [x, thickness * 0.22, z + thickness * 1.6], [x, thickness * 0.08, z + thickness * 1.9]], [thickness * 0.12, thickness * 0.07, 0])); } } });
  parts.push(combineMeshes("四足上完整而非随机散落的趾爪", pale, pieces));
}

function giantPanda(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大熊猫粗短腰部与宽圆胸腹", pale, [0, 0.54, 0], [0.67, 0.74, 1.12]), lobe("大熊猫深厚肩带与粗短颈", dark, [0, 0.66, 0.34], [0.6, 0.64, 0.53])]; head(parts, [0, 0.78, 0.58], [0.48, 0.49, 0.47], 0.045); fourFeet(parts, [0, 0.57, 0.32], [0, 0.49, -0.32], 0.25, 0.1);
  for (const side of [-1, 1]) { parts.push(lobe("大熊猫宽颅两侧发达的咬肌颊", pale, [side * 0.15, 0.72, 0.62], [0.22, 0.28, 0.23]), tapered("大熊猫腕部桡侧籽骨形成的独立伪拇指", dark, [[side * 0.21, 0.057, 0.39], [side * 0.18, 0.059, 0.425], [side * 0.2, 0.064, 0.447]], [0.02, 0.014, 0.008])); }
  claws(parts, [[0, 0.57, 0.32], [0, 0.49, -0.32]], 0.25, 0.1); parts.push(lobe("大熊猫不能当成长熊尾的短圆尾", pale, [0, 0.51, -0.49], [0.12, 0.14, 0.15])); return parts;
}

function fennec(): ModelPart[] {
  const parts: ModelPart[] = [lobe("耳廓狐不到半米的轻小低躯", fur, [0, 0.126, 0], [0.12, 0.145, 0.3]), tapered("耳廓狐短颈与大头之间的真实连接", fur, [[0, 0.16, 0.08], [0, 0.2, 0.15]], [0.036, 0.027])]; head(parts, [0, 0.205, 0.16], [0.094, 0.105, 0.116], 0.035, "none"); fourFeet(parts, [0, 0.125, 0.075], [0, 0.12, -0.082], 0.043, 0.016);
  for (const side of [-1, 1]) { parts.push(leaf("耳廓狐相对头部特别巨大的宽三角耳廓", pale, [side * 0.026, 0.239, 0.15], 0.066, 0.115, [-5, side * 16, -side * 16]), lobe("耳廓狐耳底真正相接的厚软骨基部", fur, [side * 0.03, 0.245, 0.15], [0.044, 0.043, 0.025]), lobe("耳廓狐足底覆毛形成的厚软足垫", pale, [side * 0.043, 0.009, 0.086], [0.035, 0.013, 0.047])); }
  parts.push(tapered("耳廓狐蓬松而长于短腿的地面尾", pale, [[0, 0.125, -0.13], [0.05, 0.07, -0.24], [0.095, 0.025, -0.34]], [0.031, 0.048, 0.009])); return parts;
}

function manedWolf(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鬣狼高腿上悬起的短而狭胸腹", fur, [0, 0.93, 0], [0.39, 0.44, 0.98]), tapered("鬣狼细长斜举的颈而非厚熊肩", fur, [[0, 0.99, 0.3], [0, 1.21, 0.48]], [0.13, 0.073])]; head(parts, [0, 1.25, 0.56], [0.2, 0.23, 0.31], 0.13, "none"); fourFeet(parts, [0, 0.94, 0.28], [0, 0.88, -0.29], 0.13, 0.039);
  const mane: ModelPart[] = [];
  for (let i = 0; i < 10; i++) { const t = i / 9, root: Triple = [0, 1.25 - t * 0.15, 0.44 - t * 0.62]; mane.push(leaf("鬣狼从后颈延伸到肩背的狭长鬃毛", dark, root, 0.026, 0.12 - t * 0.035, [-10, i * 13, 0])); } parts.push(combineMeshes("鬣狼连续可辨的直立颈背鬣", dark, mane));
  for (const side of [-1, 1]) parts.push(leaf("鬣狼很大且保持尖直轮廓的外耳", pale, [side * 0.07, 1.32, 0.5], 0.095, 0.19, [-8, side * 12, -side * 12]));
  parts.push(tapered("鬣狼较短而有鬃毛体积的下垂尾", pale, [[0, 0.95, -0.42], [0.06, 0.72, -0.64], [0.1, 0.55, -0.76]], [0.045, 0.065, 0.015])); return parts;
}

function bushDog(): ModelPart[] {
  const parts: ModelPart[] = [lobe("薮犬长桶形躯干与特别短的四肢比例", fur, [0, 0.23, 0], [0.32, 0.33, 0.7]), lobe("薮犬粗颈和宽短前肩", fur, [0, 0.29, 0.23], [0.28, 0.31, 0.28])]; head(parts, [0, 0.32, 0.36], [0.24, 0.23, 0.28], 0.035); fourFeet(parts, [0, 0.22, 0.2], [0, 0.22, -0.22], 0.11, 0.047);
  for (const side of [-1, 1]) for (const z of [0.22, -0.23]) parts.push(membrane("薮犬每只足掌前趾间真实相连的泳蹼", pale, [[side * 0.11 - 0.025, 0.018, z], [side * 0.11 + 0.025, 0.018, z], [side * 0.11 + 0.034, 0.012, z + 0.068], [side * 0.11 - 0.034, 0.012, z + 0.068]]));
  parts.push(tapered("薮犬不成大蓬扫帚形的粗短尾", fur, [[0, 0.24, -0.3], [0.03, 0.15, -0.47]], [0.045, 0.02])); return parts;
}

function aardwolf(): ModelPart[] {
  const parts: ModelPart[] = [tapered("土狼轻窄且前高后低的真实躯干轮廓", fur, [[0, 0.34, -0.29], [0, 0.39, 0], [0, 0.44, 0.24]], [0.1, 0.14, 0.12]), tapered("土狼细颈与狭长头之间的连接", fur, [[0, 0.44, 0.22], [0, 0.54, 0.34]], [0.087, 0.053])]; head(parts, [0, 0.56, 0.39], [0.15, 0.18, 0.23], 0.075, "none"); fourFeet(parts, [0, 0.42, 0.18], [0, 0.33, -0.19], 0.087, 0.027); claws(parts, [[0, 0.42, 0.18], [0, 0.33, -0.19]], 0.087, 0.027, 5, 4);
  const mane: ModelPart[] = []; for (let i = 0; i < 12; i++) mane.push(leaf("土狼由后头到尾根的长直立背鬃", pale, [0, 0.55 - i * 0.0095, 0.3 - i * 0.047], 0.023, 0.12 + i % 3 * 0.012, [-18, i * 7, 0])); parts.push(combineMeshes("土狼真正有体积的长背鬃而非色带", pale, mane)); for (const side of [-1, 1]) parts.push(leaf("土狼头顶长而宽的尖耳", pale, [side * 0.05, 0.62, 0.36], 0.064, 0.12, [-5, side * 20, -side * 12])); parts.push(tapered("土狼短而较蓬的下垂尾", pale, [[0, 0.35, -0.28], [0.03, 0.22, -0.45], [0.05, 0.14, -0.49]], [0.035, 0.049, 0.012])); return parts;
}

function wolverine(): ModelPart[] {
  const parts: ModelPart[] = [lobe("貂熊重心较低而粗腰的长躯", fur, [0, 0.35, 0], [0.43, 0.47, 0.8]), lobe("貂熊高肩上的厚斜方肌与粗颈", fur, [0, 0.45, 0.26], [0.42, 0.39, 0.44])]; head(parts, [0, 0.43, 0.43], [0.27, 0.28, 0.31], 0.07); fourFeet(parts, [0, 0.35, 0.23], [0, 0.29, -0.24], 0.15, 0.062); claws(parts, [[0, 0.35, 0.23], [0, 0.29, -0.24]], 0.15, 0.062);
  parts.push(tapered("貂熊臀后实际蓬松而非熊短尾的长尾", pale, [[0, 0.35, -0.34], [0.05, 0.22, -0.51], [0.08, 0.16, -0.62]], [0.055, 0.079, 0.024])); return parts;
}

function dwarfMongoose(): ModelPart[] {
  const parts: ModelPart[] = [lobe("侏獴没有长前胸直立姿态的狭长水平躯", fur, [0, 0.074, 0], [0.075, 0.087, 0.22]), tapered("侏獴低而连贯的细颈", fur, [[0, 0.084, 0.07], [0, 0.105, 0.12]], [0.024, 0.019])]; head(parts, [0, 0.107, 0.126], [0.056, 0.06, 0.068], 0.026); fourFeet(parts, [0, 0.07, 0.065], [0, 0.067, -0.065], 0.026, 0.01); claws(parts, [[0, 0.07, 0.065], [0, 0.067, -0.065]], 0.026, 0.01); parts.push(tapered("侏獴锥形长尾与细腰相连而不成狐尾", pale, [[0, 0.071, -0.09], [0.035, 0.027, -0.19], [0.075, 0.016, -0.27]], [0.017, 0.015, 0.003])); return parts;
}

function genet(): ModelPart[] {
  const parts: ModelPart[] = [lobe("小斑獛细腰而可弯曲的长背躯", fur, [0, 0.235, 0], [0.18, 0.2, 0.52]), lobe("小斑獛圆隆但窄小的后胯", fur, [0, 0.25, -0.16], [0.2, 0.24, 0.26]), tapered("小斑獛柔软细颈", fur, [[0, 0.26, 0.17], [0, 0.29, 0.25]], [0.055, 0.036])]; head(parts, [0, 0.3, 0.29], [0.12, 0.14, 0.17], 0.065, "none"); fourFeet(parts, [0, 0.22, 0.15], [0, 0.23, -0.16], 0.066, 0.026); for (const side of [-1, 1]) parts.push(lobe("小斑獛头顶很大且直立的圆角外耳", pale, [side * 0.04, 0.36, 0.265], [0.055, 0.085, 0.024])); parts.push(tapered("小斑獛至少等于头躯长的柔软环尾骨架", pale, [[0, 0.25, -0.23], [0.09, 0.12, -0.48], [0.17, 0.045, -0.72], [0.28, 0.06, -0.8]], [0.035, 0.041, 0.026, 0.009])); return parts;
}

function africanCivet(): ModelPart[] {
  const parts: ModelPart[] = [tapered("非洲灵猫大后躯与低头位相连的躯干", fur, [[0, 0.36, -0.3], [0, 0.32, 0], [0, 0.28, 0.29]], [0.19, 0.17, 0.12]), lobe("非洲灵猫特征性粗大的后胯", fur, [0, 0.35, -0.21], [0.38, 0.44, 0.38]), tapered("非洲灵猫向前下探的粗短颈", fur, [[0, 0.3, 0.25], [0, 0.28, 0.37]], [0.095, 0.065])]; head(parts, [0, 0.28, 0.43], [0.19, 0.2, 0.26], 0.08); fourFeet(parts, [0, 0.27, 0.2], [0, 0.3, -0.21], 0.12, 0.042); claws(parts, [[0, 0.27, 0.2], [0, 0.3, -0.21]], 0.12, 0.042);
  const mane: ModelPart[] = []; for (let i = 0; i < 12; i++) { const t = i / 11; mane.push(leaf("非洲灵猫沿背部生出的连续短脊鬣", dark, [0, 0.4 + t * 0.1, 0.27 - t * 0.56], 0.036, 0.068 + t * 0.014, [-10, 0, 0])); } parts.push(combineMeshes("非洲灵猫有明确高度的真脊鬣", dark, mane), tapered("非洲灵猫粗根而收尖的中长尾", pale, [[0, 0.36, -0.33], [0.1, 0.2, -0.59], [0.19, 0.08, -0.8]], [0.06, 0.048, 0.013])); return parts;
}

export const carnivoreFormDesigns: MasterNatureDesign[] = [
  design("giantPanda", "大熊猫", "动物", giantPanda, ["Ailuropoda melanoleuca", "宽颅咬肌与腕部伪拇指"]),
  design("fennec", "耳廓狐", "动物", fennec, ["Vulpes zerda", "巨耳与覆毛足垫"]),
  design("manedWolf", "鬣狼", "动物", manedWolf, ["Chrysocyon brachyurus", "极长肢短胸躯与后颈背鬣"]),
  design("bushDog", "薮犬", "动物", bushDog, ["Speothos venaticus", "短肢长桶躯与蹼足"]),
  design("aardwolf", "土狼", "动物", aardwolf, ["Proteles cristata", "狭头长耳背鬃与前五后四趾"]),
  design("wolverine", "貂熊", "动物", wolverine, ["Gulo gulo", "粗肩大足与五趾长弯爪"]),
  design("dwarfMongoose", "侏獴", "动物", dwarfMongoose, ["Helogale parvula", "细长水平躯与尖锥长尾"]),
  design("genet", "小斑獛", "动物", genet, ["Genetta genetta", "狭腰圆角大耳与等身长尾"]),
  design("africanCivet", "非洲灵猫", "动物", africanCivet, ["Civettictis civetta", "大后躯低头位与真实背脊鬣"]),
];
