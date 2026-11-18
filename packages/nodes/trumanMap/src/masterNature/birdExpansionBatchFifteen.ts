import { Euler, Quaternion, Vector3 } from "three";
import { combineMeshes, design, leaf, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { calibrated, feet, foldedWings, head, tail } from "./birdExpansionBatchOne";
import { curvedFeather } from "./birdExpansionBatchTwelve";

const feather = "#a7b29b";
const covert = "#839581";
const pale = "#ccd0b8";
const bare = "#b7ab8d";
const dark = "#596b5e";

// https://savingcranes.org/species/blue-crane/
function blueCrane(): ModelPart[] {
  const parts: ModelPart[] = [lobe("蓝鹤高肩而前宽后收的草原鹤躯", feather, [0, 0.625, -0.045], [0.35, 0.41, 0.62]), tapered("蓝鹤由厚肩渐收细的长羽颈", feather, [[0, 0.775, 0.175], [0, 1.018, 0.211], [0, 1.147, 0.288]], [0.067, 0.041, 0.034])];
  head(parts, [0, 1.185, 0.331], [0.15, 0.145, 0.184], feather);
  parts.push(lobe("蓝鹤后脑较宽而略鼓的蓬松头羽", feather, [0, 1.199, 0.289], [0.17, 0.122, 0.16]), body("蓝鹤短而基部厚的直尖嘴", [[0.399, 1.166, 0.018, 0.022], [0.47, 1.157, 0.01, 0.013], [0.503, 1.15, 0.001, 0.0015]], bare));
  foldedWings(parts, [0, 0.717, -0.055], 0.36, 0.46);
  for (const side of [-1, 1]) parts.push(combineMeshes("蓝鹤从折翼上长出并垂近地面的三级飞羽", covert, Array.from({ length: 7 }, (_, index) => { const x = side * (0.11 + index * 0.007); return curvedFeather("并非尾羽的蓝鹤特长弧垂三级羽", covert, [[x, 0.735, -0.115], [x + side * 0.018, 0.635, -0.3], [x + side * 0.035, 0.363, -0.49], [x + side * 0.034, 0.075 + index * 0.008, -0.58 + index * 0.01]], [0.018, 0.043, 0.042, 0.002]); })));
  tail(parts, [0, 0.465, -0.3], 0.17, 0.145, -105);
  feet(parts, [0, 0.465, 0.005], 0.087, 0.017, 0.15);
  return parts;
}

// https://savingcranes.org/news/resources/cranetivities-wonderous-wattled-cranes/
function wattledCrane(): ModelPart[] {
  const parts: ModelPart[] = [lobe("肉垂鹤高腿上窄背而深腹的巨大鹤躯", feather, [0, 0.865, -0.045], [0.41, 0.45, 0.71]), tapered("肉垂鹤细而很长的近直立羽颈", pale, [[0, 1.035, 0.225], [0, 1.367, 0.255], [0, 1.578, 0.354]], [0.072, 0.042, 0.034])];
  head(parts, [0, 1.628, 0.396], [0.13, 0.145, 0.181], pale);
  parts.push(body("肉垂鹤长而基部浅的直探喙", [[0.462, 1.607, 0.019, 0.022], [0.558, 1.6, 0.011, 0.014], [0.602, 1.59, 0.001, 0.002]], bare));
  for (const side of [-1, 1]) {
    parts.push(tapered("从喙后下颌根连续下垂的单侧肉垂根", bare, [[side * 0.023, 1.603, 0.43], [side * 0.032, 1.557, 0.448]], [0.012, 0.01]), lobe("肉垂鹤大部分被白羽覆住的长喉垂", pale, [side * 0.034, 1.485, 0.452], [0.035, 0.173, 0.043]));
  }
  foldedWings(parts, [0, 0.97, -0.055], 0.42, 0.55);
  tail(parts, [0, 0.675, -0.35], 0.2, 0.18, -106);
  feet(parts, [0, 0.67, 0.005], 0.105, 0.021, 0.185);
  return parts;
}

function demoiselleCrane(): ModelPart[] {
  const parts: ModelPart[] = [lobe("蓑羽鹤较细腰而前胸高的轻型鹤躯", feather, [0, 0.465, -0.025], [0.27, 0.32, 0.43]), tapered("蓑羽鹤细而完全有羽覆的长颈", covert, [[0, 0.58, 0.145], [0, 0.802, 0.191], [0, 0.905, 0.246]], [0.05, 0.029, 0.025])];
  head(parts, [0, 0.943, 0.282], [0.1, 0.108, 0.139], covert);
  parts.push(body("蓑羽鹤明显短于其他鹤的细直嘴", [[0.333, 0.929, 0.012, 0.014], [0.392, 0.925, 0.007, 0.008], [0.414, 0.922, 0.0008, 0.001]], bare));
  const ears: ModelPart[] = [], breast: ModelPart[] = [];
  for (const side of [-1, 1]) {
    for (let index = 0; index < 8; index++) ears.push(leaf("从眼后而非头顶长出的细白耳饰羽", pale, [side * (0.033 + index * 0.002), 0.952 - index * 0.003, 0.286 - index * 0.003], 0.012, 0.17 - index * 0.005, [-116, side * (index * 3 + 8), -side * 8]));
    for (let index = 0; index < 8; index++) breast.push(leaf("蓑羽鹤从前颈延到胸前的细长蓑羽", covert, [side * (0.007 + index * 0.005), 0.664 - index * 0.006, 0.175], 0.018, 0.205 + index % 3 * 0.017, [174, side * (index * 5 - 13), -side * 10]));
  }
  parts.push(combineMeshes("蓑羽鹤两侧向后披垂的白耳束", pale, ears), combineMeshes("蓑羽鹤前颈黑羽连续延长形成的长胸蓑", covert, breast));
  foldedWings(parts, [0, 0.535, -0.03], 0.28, 0.34);
  tail(parts, [0, 0.325, -0.21], 0.13, 0.12, -106);
  feet(parts, [0, 0.335, 0.005], 0.064, 0.012, 0.11);
  return parts;
}

// https://m.espacepourlavie.ca/en/biodome-fauna/southern-screamer
function southernScreamer(): ModelPart[] {
  const parts: ModelPart[] = [lobe("冠叫鸭宽大而短腰的厚胸水禽躯", feather, [0, 0.365, -0.03], [0.43, 0.47, 0.545]), tapered("冠叫鸭明显短粗而前抬的羽颈", feather, [[0, 0.51, 0.145], [0, 0.658, 0.193]], [0.085, 0.045])];
  head(parts, [0, 0.713, 0.23], [0.13, 0.15, 0.16]);
  parts.push(body("冠叫鸭头前短而浅钩的鸡状喙", [[0.288, 0.696, 0.019, 0.024], [0.335, 0.684, 0.015, 0.02], [0.352, 0.665, 0.001, 0.002]], bare));
  parts.push(combineMeshes("没有额角而在头后蓬起的短碎冠羽", covert, Array.from({ length: 11 }, (_, index) => leaf("冠叫鸭细窄后枕冠羽", covert, [(index - 5) * 0.006, 0.776, 0.183], 0.017, 0.087 - Math.abs(index - 5) * 0.006, [-52, (index - 5) * 8, 0]))));
  for (const side of [-1, 1]) {
    parts.push(lobe("冠叫鸭稍张离重胸的宽厚前翼", covert, [side * 0.226, 0.46, -0.055], [0.18, 0.2, 0.4]), membrane("冠叫鸭腕部到胸侧的真实羽面", covert, [[side * 0.15, 0.54, 0.12], [side * 0.31, 0.53, 0.12], [side * 0.32, 0.38, -0.2], [side * 0.14, 0.29, -0.235]]), needle("冠叫鸭翼腕第一枚长硬距", bare, [side * 0.29, 0.52, 0.12], [side * 0.369, 0.569, 0.174], 0.019), needle("冠叫鸭同侧翼腕第二枚较短硬距", bare, [side * 0.305, 0.49, 0.065], [side * 0.358, 0.512, 0.1], 0.014));
  }
  tail(parts, [0, 0.24, -0.26], 0.22, 0.18, -104);
  feet(parts, [0, 0.225, 0.015], 0.102, 0.02, 0.155, { web: 0.22 });
  return parts;
}

function crabPlover(): ModelPart[] {
  const parts: ModelPart[] = [lobe("蟹鸻高腿上短宽而深胸的涉禽躯", pale, [0, 0.265, -0.02], [0.19, 0.24, 0.285]), tapered("蟹鸻小头下直立而较粗的短颈", pale, [[0, 0.35, 0.09], [0, 0.431, 0.138]], [0.042, 0.029])];
  head(parts, [0, 0.47, 0.172], [0.111, 0.12, 0.148], pale);
  parts.push(body("蟹鸻用于击碎蟹壳的深基粗直匕首嘴", [[0.226, 0.453, 0.022, 0.029], [0.291, 0.441, 0.021, 0.025], [0.325, 0.428, 0.002, 0.003]], dark));
  foldedWings(parts, [0, 0.316, -0.025], 0.2, 0.245);
  tail(parts, [0, 0.19, -0.14], 0.105, 0.1, -105);
  feet(parts, [0, 0.185, 0.005], 0.048, 0.009, 0.064, { web: 0.5 });
  return parts;
}

// https://australian.museum/learn/animals/birds/beach-stone-curlew/
function beachStoneCurlew(): ModelPart[] {
  const parts: ModelPart[] = [lobe("巨石鸻驼肩而胸部沉重的短尾躯", feather, [0, 0.365, -0.025], [0.255, 0.31, 0.37]), tapered("巨石鸻缩在前肩而显得粗短的颈", pale, [[0, 0.47, 0.105], [0, 0.566, 0.154]], [0.055, 0.038])];
  head(parts, [0, 0.612, 0.202], [0.157, 0.158, 0.195], pale);
  parts.push(body("巨石鸻粗高而前端微上翘的巨大蟹食嘴", [[0.273, 0.59, 0.03, 0.038], [0.342, 0.588, 0.029, 0.034], [0.41, 0.598, 0.017, 0.023], [0.433, 0.611, 0.0015, 0.003]], bare));
  foldedWings(parts, [0, 0.435, -0.035], 0.26, 0.28);
  tail(parts, [0, 0.245, -0.19], 0.13, 0.105, -108);
  feet(parts, [0, 0.255, 0.01], 0.066, 0.014, 0.088, { hindToe: false });
  for (const side of [-1, 1]) parts.push(lobe("巨石鸻粗跗上实际膨大的踝骨节", bare, [side * 0.064, 0.147, -0.012], [0.039, 0.045, 0.041]));
  return parts;
}

// https://www.banhamzoo.co.uk/animals/giant-wood-rail
function giantWoodRail(): ModelPart[] {
  const parts: ModelPart[] = [lobe("巨水鸡高腿上水平而腰腹深长的林栖秧鸡躯", feather, [0, 0.275, -0.035], [0.235, 0.29, 0.39]), tapered("巨水鸡上举而有明确细颈的前躯", pale, [[0, 0.365, 0.12], [0, 0.492, 0.189]], [0.05, 0.032])];
  head(parts, [0, 0.537, 0.228], [0.103, 0.117, 0.144], pale);
  parts.push(body("巨水鸡厚根而稍下曲的长楔嘴", [[0.28, 0.52, 0.019, 0.023], [0.35, 0.506, 0.018, 0.018], [0.38, 0.49, 0.002, 0.003]], bare));
  foldedWings(parts, [0, 0.33, -0.04], 0.24, 0.27);
  tail(parts, [0, 0.195, -0.205], 0.12, 0.115, -95);
  feet(parts, [0, 0.18, 0.005], 0.061, 0.012, 0.102);
  return parts;
}

// https://www.nzbirdsonline.org.nz/species/bar-tailed-godwit
function barTailedGodwit(): ModelPart[] {
  const parts: ModelPart[] = [lobe("斑尾塍鹬丰满肩背与细后腰的长躯", feather, [0, 0.22, -0.025], [0.18, 0.215, 0.285]), tapered("塍鹬小头下上举但不很长的羽颈", feather, [[0, 0.29, 0.085], [0, 0.385, 0.137]], [0.032, 0.022])];
  head(parts, [0, 0.418, 0.166], [0.086, 0.094, 0.121]);
  parts.push(body("斑尾塍鹬向前逐渐上曲的细长上喙", [[0.21, 0.405, 0.009, 0.009], [0.286, 0.409, 0.007, 0.007], [0.375, 0.43, 0.001, 0.0015]], bare), body("斑尾塍鹬与上喙轴线一致的独立细下颌", [[0.21, 0.393, 0.007, 0.004], [0.286, 0.399, 0.005, 0.0035], [0.373, 0.424, 0.0008, 0.001]], bare));
  foldedWings(parts, [0, 0.266, -0.03], 0.19, 0.245);
  tail(parts, [0, 0.146, -0.15], 0.1, 0.092, -104);
  feet(parts, [0, 0.138, 0.005], 0.041, 0.007, 0.058);
  return parts;
}

// https://www.zoothailand.org/en/animal_view.php?c_id=&detail_id=291
function greyPeacockPheasant(): ModelPart[] {
  const parts: ModelPart[] = [lobe("灰孔雀雉窄肩深腹而轻巧的林栖鸡躯", feather, [0, 0.235, -0.025], [0.22, 0.28, 0.34]), tapered("孔雀雉上举的细羽颈", feather, [[0, 0.325, 0.105], [0, 0.427, 0.15]], [0.043, 0.027])];
  head(parts, [0, 0.465, 0.18], [0.083, 0.097, 0.117]);
  parts.push(tapered("灰孔雀雉较短而下曲的尖嘴", bare, [[0, 0.453, 0.223], [0, 0.444, 0.268], [0, 0.425, 0.272]], [0.012, 0.008, 0.0007]));
  parts.push(combineMeshes("灰孔雀雉后枕直立而略向前的细短冠", covert, Array.from({ length: 9 }, (_, index) => leaf("孔雀雉窄冠羽", covert, [(index - 4) * 0.0045, 0.507, 0.15], 0.012, 0.075 - Math.abs(index - 4) * 0.006, [8, (index - 4) * 5, 0]))));
  foldedWings(parts, [0, 0.29, -0.03], 0.23, 0.26);
  const fan: ModelPart[] = [], rings: ModelPart[] = [], eyespots: ModelPart[] = [];
  for (let index = 0; index < 14; index++) {
    const t = (index - 6.5) / 6.5;
    const path: Triple[] = [[t * 0.033, 0.18, -0.17], [t * 0.055, 0.3, -0.26], [t * 0.087, 0.41, -0.35], [t * 0.113, 0.47 - Math.abs(t) * 0.035, -0.44 + Math.abs(t) * 0.03]];
    fan.push(curvedFeather("孔雀雉由多根短宽圆尾羽组成的斜竖扇", covert, path, [0.02, 0.067, 0.071, 0.004]));
    const direction = new Vector3(...path[3]!).sub(new Vector3(...path[1]!)).normalize();
    const widthAxis = new Vector3(1, 0, 0).addScaledVector(direction, -direction.x).normalize();
    const normal = new Vector3().crossVectors(widthAxis, direction).normalize();
    const rotation = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal));
    const angles: Triple = [rotation.x, rotation.y, rotation.z].map(value => value * 180 / Math.PI) as Triple;
    for (const side of [-1, 1]) { const center = new Vector3(...path[2]!).addScaledVector(widthAxis, side * 0.017).addScaledVector(normal, 0.0013); rings.push(lobe("紧贴羽片每侧羽瓣的外眼斑羽域", bare, center.toArray() as Triple, [0.027, 0.0018, 0.034], angles)); center.addScaledVector(normal, 0.001); eyespots.push(lobe("实际跟随羽片法线而非悬浮世界坐标的内眼斑", dark, center.toArray() as Triple, [0.014, 0.0012, 0.019], angles)); }
  }
  parts.push(combineMeshes("灰孔雀雉短宽尾扇的分离曲羽", covert, fan), combineMeshes("贴合各尾羽双羽瓣的外眼斑", bare, rings), combineMeshes("贴合外眼斑的内羽域", dark, eyespots));
  feet(parts, [0, 0.14, 0.015], 0.055, 0.012, 0.07);
  for (const side of [-1, 1]) for (const y of [0.063, 0.098]) parts.push(needle("灰孔雀雉每侧跗后两枚真正分离的硬距", bare, [side * 0.053, y, 0.004], [side * 0.061, y + 0.01, -0.035], 0.009));
  return parts;
}

function wattledBrushturkey(): ModelPart[] {
  const parts: ModelPart[] = [lobe("肉垂冢雉深胸而侧扁的短身地栖躯", covert, [0, 0.225, -0.025], [0.235, 0.28, 0.33]), tapered("肉垂冢雉从肩前伸出的裸露细颈", bare, [[0, 0.32, 0.1], [0, 0.405, 0.14]], [0.03, 0.023])];
  head(parts, [0, 0.44, 0.17], [0.076, 0.091, 0.107], bare);
  parts.push(tapered("肉垂冢雉粗根短尖的硬嘴", bare, [[0, 0.43, 0.209], [0, 0.419, 0.258]], [0.013, 0.0008]), lobe("颈前下部而非颈侧的单块软肉垂", bare, [0, 0.325, 0.134], [0.057, 0.085, 0.052]));
  const comb = polygon("肉垂冢雉头顶真实侧扁软肉冠而非骨盔", bare, [[0.474, 0.131], [0.49, 0.107], [0.528, 0.121], [0.53, 0.149], [0.507, 0.177], [0.465, 0.181]], 0.018, [0.009, 0, 0]);
  comb.rotation.z = 90;
  parts.push(comb);
  foldedWings(parts, [0, 0.278, -0.03], 0.24, 0.26);
  parts.push(combineMeshes("肉垂冢雉沿身体纵向压扁的高尾扇", covert, Array.from({ length: 9 }, (_, index) => leaf("冢雉纵向尾面上的独立宽羽", covert, [0, 0.16, -0.15], 0.047, 0.31 - Math.abs(index - 4) * 0.008, [0, 90, 15 + index * 8.5]))));
  feet(parts, [0, 0.135, 0.012], 0.058, 0.013, 0.087);
  return parts;
}

export const birdExpansionBatchFifteenDesigns: MasterNatureDesign[] = [
  design("blueCrane", "蓝鹤", "动物", () => calibrated(blueCrane(), 0.95), ["Anthropoides paradiseus", "Grus paradisea", "鼓起头羽与拖地三级飞羽"]),
  design("wattledCrane", "肉垂鹤", "动物", wattledCrane, ["Bugeranus carunculatus", "Grus carunculata", "双羽覆喉垂与细长颈高腿"]),
  design("demoiselleCrane", "蓑羽鹤", "动物", demoiselleCrane, ["Anthropoides virgo", "Grus virgo", "眼后长白耳束与长胸蓑羽"]),
  design("southernScreamer", "冠叫鸭", "动物", southernScreamer, ["Chauna torquata", "短粗颈宽重躯和无额角枕冠", "四枚真实翼腕距"]),
  design("crabPlover", "蟹鸻", "动物", () => calibrated(crabPlover(), 0.72), ["Dromas ardeola", "深基蟹食粗嘴", "长跗部分蹼趾"]),
  design("beachStoneCurlew", "巨石鸻", "动物", () => calibrated(beachStoneCurlew(), 0.74), ["Esacus magnirostris", "Esacus neglectus", "巨头上翘大嘴与厚踝三趾足"]),
  design("giantWoodRail", "巨水鸡", "动物", () => calibrated(giantWoodRail(), 0.7), ["Aramides ypecaha", "深长水平秧鸡躯", "长颈楔嘴和地栖长趾"]),
  design("barTailedGodwit", "斑尾塍鹬", "动物", () => calibrated(barTailedGodwit(), 0.645), ["Limosa lapponica", "真正缓上曲的长细双颌", "丰满肩背细后腰"]),
  design("greyPeacockPheasant", "灰孔雀雉", "动物", greyPeacockPheasant, ["Polyplectron bicalcaratum", "短宽圆眼斑尾扇", "每跗成对硬距"]),
  design("wattledBrushturkey", "肉垂冢雉", "动物", () => calibrated(wattledBrushturkey(), 0.84), ["Aepypodius arfakianus", "软肉冠和前颈肉垂", "纵向侧扁高尾扇"]),
];
