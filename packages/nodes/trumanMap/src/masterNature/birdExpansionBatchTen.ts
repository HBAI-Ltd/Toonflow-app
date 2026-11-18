import { combineMeshes, design, leaf, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { calibrated, feet, foldedWings, head, tail } from "./birdExpansionBatchOne";

const feather = "#a6b49d";
const covert = "#849783";
const pale = "#cbd0b8";
const bare = "#b6ac8d";
const dark = "#596d61";

// https://australian.museum/learn/animals/birds/cape-barren-goose/
function capeBarrenGoose(): ModelPart[] {
  const parts: ModelPart[] = [lobe("澳洲灰雁宽胸深腹的高肩重躯", feather, [0, 0.33, -0.045], [0.37, 0.4, 0.57]), tapered("灰雁粗短而近直立的羽颈", feather, [[0, 0.45, 0.16], [0, 0.565, 0.195]], [0.076, 0.045])];
  head(parts, [0, 0.617, 0.235], [0.12, 0.135, 0.15]);
  parts.push(body("灰雁几乎隐在大蜡膜下的短三角嘴", [[0.287, 0.607, 0.022, 0.027], [0.328, 0.595, 0.016, 0.022], [0.354, 0.58, 0.002, 0.003]], dark));
  parts.push(body("从额头覆盖喙基大部分表面的凸起蜡膜", [[0.275, 0.629, 0.026, 0.022], [0.306, 0.628, 0.027, 0.025], [0.331, 0.61, 0.015, 0.016]], bare));
  foldedWings(parts, [0, 0.405, -0.05], 0.38, 0.43);
  tail(parts, [0, 0.245, -0.29], 0.2, 0.18, -103);
  feet(parts, [0, 0.23, 0.015], 0.091, 0.018, 0.108, { web: 0.53 });
  return parts;
}

// https://cincinnatizoo.org/animals-archive/spur-winged-goose/
function spurWingedGoose(): ModelPart[] {
  const parts: ModelPart[] = [lobe("距翅雁高腿上的长而沉重的鹅形躯", covert, [0, 0.405, -0.045], [0.4, 0.44, 0.62]), tapered("距翅雁前端向上伸出的长颈", pale, [[0, 0.54, 0.17], [0, 0.74, 0.215], [0, 0.855, 0.28]], [0.069, 0.043, 0.034])];
  head(parts, [0, 0.902, 0.31], [0.115, 0.14, 0.155], bare);
  parts.push(body("距翅雁前端略下曲的长深嘴", [[0.365, 0.883, 0.023, 0.028], [0.43, 0.867, 0.02, 0.026], [0.465, 0.845, 0.003, 0.005]], bare), lobe("前额与喙基相接的圆肉瘤", bare, [0, 0.948, 0.358], [0.055, 0.066, 0.058]));
  for (const side of [-1, 1]) {
    parts.push(lobe("稍离躯侧而露出腕骨距的厚翼臂", covert, [side * 0.225, 0.49, -0.055], [0.17, 0.19, 0.44]), membrane("距翅雁展开腕部到胸侧的连续羽面", covert, [[side * 0.15, 0.57, 0.135], [side * 0.285, 0.575, 0.14], [side * 0.31, 0.43, -0.22], [side * 0.16, 0.34, -0.25]]), needle("每侧腕部一枚朝前外方弯出的硬骨距", bare, [side * 0.279, 0.565, 0.126], [side * 0.358, 0.615, 0.183], 0.024));
    parts.push(combineMeshes("距翅雁宽翼后半部的真实飞羽", covert, Array.from({ length: 8 }, (_, index) => leaf("重型鹅翼相叠长飞羽", covert, [side * (0.21 + index * 0.012), 0.49 - index * 0.009, -0.055 - index * 0.012], 0.073, 0.35 - index * 0.008, [-109, side * (index * 2 - 6), 0]))));
  }
  tail(parts, [0, 0.285, -0.31], 0.2, 0.22, -104);
  feet(parts, [0, 0.275, 0.015], 0.102, 0.02, 0.13, { web: 0.92 });
  return parts;
}

// https://www.lpzoo.org/animals/swan-goose/
function swanGoose(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鸿雁低背而长腹的流线鹅躯", feather, [0, 0.325, -0.065], [0.32, 0.36, 0.62]), tapered("鸿雁长而狭窄并近直立的雁颈", pale, [[0, 0.43, 0.17], [0, 0.635, 0.185], [0, 0.805, 0.244], [0, 0.87, 0.29]], [0.065, 0.04, 0.031, 0.032])];
  head(parts, [0, 0.909, 0.32], [0.105, 0.115, 0.16], feather);
  parts.push(body("野生鸿雁没有家鹅额瘤的长楔形黑喙", [[0.378, 0.892, 0.02, 0.023], [0.446, 0.872, 0.019, 0.023], [0.48, 0.85, 0.002, 0.003]], dark));
  foldedWings(parts, [0, 0.39, -0.065], 0.33, 0.45);
  tail(parts, [0, 0.23, -0.335], 0.19, 0.19, -103);
  feet(parts, [0, 0.22, 0.005], 0.079, 0.015, 0.105, { web: 0.95 });
  return parts;
}

function knobBilledDuck(): ModelPart[] {
  const parts: ModelPart[] = [lobe("瘤鸭长腰而较高腿的重型栖鸭身躯", covert, [0, 0.275, -0.045], [0.295, 0.34, 0.49]), tapered("瘤鸭由前胸上举的鹅状长颈", pale, [[0, 0.38, 0.15], [0, 0.535, 0.193]], [0.057, 0.036])];
  head(parts, [0, 0.593, 0.231], [0.116, 0.13, 0.16], pale);
  parts.push(body("瘤鸭宽基略弯而无眼周肉疣的长嘴", [[0.289, 0.572, 0.023, 0.024], [0.357, 0.56, 0.025, 0.02], [0.388, 0.547, 0.008, 0.009]], dark), lobe("只在喙基上方隆起且侧扁的巨大软皮瘤", dark, [0, 0.624, 0.31], [0.048, 0.115, 0.117], [18, 0, 0]));
  foldedWings(parts, [0, 0.35, -0.05], 0.3, 0.4);
  tail(parts, [0, 0.19, -0.255], 0.17, 0.18, -104);
  feet(parts, [0, 0.175, 0.005], 0.073, 0.013, 0.09, { web: 0.91 });
  return parts;
}

// https://www.allaboutbirds.org/guide/King_Eider/id
function kingEider(): ModelPart[] {
  const parts: ModelPart[] = [lobe("王绒鸭低腹宽胸的重型潜鸭躯", covert, [0, 0.205, -0.035], [0.29, 0.285, 0.43]), lobe("王绒鸭几乎缩入肩前的极短厚颈", pale, [0, 0.29, 0.13], [0.145, 0.17, 0.15])];
  head(parts, [0, 0.383, 0.179], [0.145, 0.16, 0.177], pale);
  parts.push(body("王绒鸭大头前方显得短而厚的嘴", [[0.239, 0.355, 0.025, 0.024], [0.287, 0.344, 0.027, 0.024], [0.319, 0.326, 0.008, 0.01]], bare));
  const plate = polygon("王绒鸭额前向上隆起的侧扁鼻盾", bare, [[0.349, 0.224], [0.397, 0.224], [0.452, 0.243], [0.465, 0.27], [0.447, 0.287], [0.382, 0.29], [0.349, 0.269]], 0.049, [0.0245, 0, 0]);
  plate.rotation.z = 90;
  parts.push(plate);
  foldedWings(parts, [0, 0.258, -0.055], 0.29, 0.3);
  tail(parts, [0, 0.145, -0.225], 0.14, 0.1, -105);
  feet(parts, [0, 0.115, -0.045], 0.08, 0.014, 0.1, { web: 0.98 });
  return parts;
}

// https://www.nationalzoo.si.edu/animals/northern-shoveler
function northernShoveler(): ModelPart[] {
  const parts: ModelPart[] = [lobe("琵嘴鸭长而低伏的浅水游禽躯", feather, [0, 0.165, -0.025], [0.195, 0.225, 0.31]), tapered("琵嘴鸭较短而前曲的细颈", feather, [[0, 0.235, 0.075], [0, 0.31, 0.113]], [0.035, 0.026])];
  head(parts, [0, 0.347, 0.144], [0.094, 0.107, 0.127]);
  parts.push(body("琵嘴鸭向嘴端明显横向扩张的宽扁上铲", [[0.188, 0.328, 0.017, 0.009], [0.216, 0.321, 0.022, 0.009], [0.249, 0.314, 0.033, 0.008], [0.266, 0.312, 0.03, 0.006]], dark), body("与上铲之间留有过滤缝隙的宽下喙", [[0.19, 0.308, 0.016, 0.004], [0.222, 0.304, 0.023, 0.004], [0.263, 0.3, 0.029, 0.004]], bare));
  const lamellae: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 16; index++) { const t = index / 15; lamellae.push(tapered("嘴缘真实向下伸出的梳状过滤薄片", bare, [[side * (0.017 + t * 0.014), 0.319 - t * 0.012, 0.198 + t * 0.063], [side * (0.016 + t * 0.013), 0.307 - t * 0.007, 0.198 + t * 0.063]], [0.0012, 0.0005])); }
  for (let index = 0; index < lamellae.length; index += 16) parts.push(combineMeshes("铲嘴两侧真正分离的过滤梳片", bare, lamellae.slice(index, index + 16)));
  foldedWings(parts, [0, 0.214, -0.03], 0.2, 0.26);
  tail(parts, [0, 0.12, -0.155], 0.11, 0.12, -102);
  feet(parts, [0, 0.095, -0.01], 0.047, 0.007, 0.057, { web: 0.96 });
  return parts;
}

// https://doi.org/10.1111/j.1558-5646.1986.tb00506.x
function magellanicSteamerDuck(): ModelPart[] {
  const parts: ModelPart[] = [lobe("麦哲伦船鸭特别长而深重的低位船形体", feather, [0, 0.25, -0.055], [0.39, 0.37, 0.62]), tapered("船鸭撑起大头的粗前颈", feather, [[0, 0.345, 0.2], [0, 0.45, 0.255]], [0.074, 0.056])];
  head(parts, [0, 0.504, 0.32], [0.17, 0.18, 0.22]);
  parts.push(body("船鸭头前深基而宽钝的沉重嘴", [[0.4, 0.478, 0.035, 0.031], [0.465, 0.457, 0.037, 0.026], [0.5, 0.441, 0.012, 0.012]], bare));
  for (const side of [-1, 1]) {
    parts.push(lobe("船鸭相对重躯明显缩小的硬厚桨翼", covert, [side * 0.168, 0.297, -0.065], [0.15, 0.14, 0.27]), lobe("短翼腕处坚实的承力骨节", bare, [side * 0.215, 0.329, 0.016], [0.044, 0.046, 0.049]));
    parts.push(combineMeshes("船鸭短厚泳翼上的紧密短飞羽", covert, Array.from({ length: 6 }, (_, index) => leaf("短泳翼不延伸为正常长飞翼的羽端", covert, [side * (0.16 + index * 0.011), 0.283 - index * 0.006, -0.057 - index * 0.01], 0.045, 0.18 - index * 0.006, [-111, side * index * 2, 0]))));
  }
  tail(parts, [0, 0.16, -0.325], 0.2, 0.17, -105);
  feet(parts, [0, 0.145, -0.095], 0.105, 0.021, 0.14, { web: 0.99 });
  return parts;
}

// https://buffalozoo.org/animal/mandarin-duck/
function mandarinDuck(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鸳鸯短圆而有深胸的栖鸭躯", feather, [0, 0.15, -0.02], [0.19, 0.215, 0.265]), tapered("鸳鸯短而向前弯的羽颈", feather, [[0, 0.215, 0.07], [0, 0.28, 0.104]], [0.038, 0.028])];
  head(parts, [0, 0.318, 0.137], [0.094, 0.105, 0.12]);
  parts.push(body("鸳鸯窄而短的浅扁嘴", [[0.18, 0.302, 0.014, 0.012], [0.225, 0.291, 0.014, 0.008], [0.24, 0.287, 0.004, 0.004]], bare));
  const cheek: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 8; index++) cheek.push(leaf("鸳鸯颊侧向后披开的长扇羽", bare, [side * 0.032, 0.321 - index * 0.006, 0.157 - index * 0.003], 0.016, 0.081 + index % 2 * 0.013, [-112 - index * 5, side * (25 + index * 3), -side * 12]));
  parts.push(combineMeshes("两颊独立于后脑冠羽的宽蓬扇羽", bare, cheek), combineMeshes("鸳鸯后枕向后伸出的羽冠", covert, Array.from({ length: 7 }, (_, index) => leaf("鸳鸯后脑细长冠羽", covert, [(index - 3) * 0.005, 0.352, 0.106], 0.02, 0.112 - Math.abs(index - 3) * 0.008, [-64, (index - 3) * 6, 0]))));
  foldedWings(parts, [0, 0.191, -0.025], 0.19, 0.21);
  for (const side of [-1, 1]) {
    const sail = polygon("鸳鸯第十二次级羽内侧羽片上竖成帆", bare, [[0.182, -0.07], [0.252, -0.103], [0.319, -0.19], [0.297, -0.224], [0.205, -0.157]], 0.0025, [side * 0.067 + 0.00125, 0, 0]);
    sail.rotation.z = 90;
    parts.push(sail);
  }
  tail(parts, [0, 0.105, -0.132], 0.115, 0.108, -101);
  feet(parts, [0, 0.08, -0.005], 0.045, 0.0075, 0.05, { web: 0.93 });
  return parts;
}

// https://tidsskrift.dk/Wildfowl/article/download/154509/197082/341259
function torrentDuck(): ModelPart[] {
  const parts: ModelPart[] = [lobe("湍鸭狭而修长的低腰流线躯", feather, [0, 0.155, -0.025], [0.16, 0.2, 0.32]), tapered("湍鸭从窄躯前方抬起的细短颈", pale, [[0, 0.218, 0.095], [0, 0.29, 0.137]], [0.029, 0.022])];
  head(parts, [0, 0.325, 0.172], [0.087, 0.098, 0.123], pale);
  parts.push(body("湍鸭没有秋沙鸭锯齿的细长浅扁嘴", [[0.216, 0.31, 0.012, 0.013], [0.27, 0.297, 0.013, 0.011], [0.293, 0.29, 0.003, 0.003]], bare));
  for (const side of [-1, 1]) {
    parts.push(lobe("湍鸭贴在窄躯两侧的紧凑强翼", covert, [side * 0.071, 0.196, -0.03], [0.075, 0.11, 0.247]), needle("每侧翼腕快速收尖的坚硬小骨距", bare, [side * 0.099, 0.224, 0.067], [side * 0.134, 0.243, 0.105], 0.013));
    parts.push(combineMeshes("湍鸭流线翼后段短而强的飞羽", covert, Array.from({ length: 6 }, (_, index) => leaf("湍鸭紧密的翼尖羽", covert, [side * (0.065 + index * 0.006), 0.184 - index * 0.004, -0.031 - index * 0.01], 0.036, 0.21 - index * 0.009, [-109, side * index * 2, 0]))));
  }
  parts.push(combineMeshes("湍鸭在激流中支撑的狭长硬尾束", covert, Array.from({ length: 7 }, (_, index) => leaf("湍鸭有硬羽轴的尖尾羽", covert, [(index - 3) * 0.009, 0.1, -0.164], 0.028, 0.205 - Math.abs(index - 3) * 0.018, [-99, -(index - 3) * 4, 0]))));
  feet(parts, [0, 0.082, -0.035], 0.049, 0.01, 0.088, { web: 0.95 });
  return parts;
}

// https://library.dbca.wa.gov.au/FullTextFiles/060430.pdf
function pinkEaredDuck(): ModelPart[] {
  const parts: ModelPart[] = [lobe("粉耳鸭低胸短腰而圆满的身体", feather, [0, 0.13, -0.015], [0.155, 0.19, 0.255]), tapered("粉耳鸭细短颈撑起相对较大的头", feather, [[0, 0.19, 0.07], [0, 0.265, 0.11]], [0.026, 0.021])];
  head(parts, [0, 0.3, 0.145], [0.103, 0.113, 0.132]);
  parts.push(body("粉耳鸭向末端扩成方铲的大宽嘴", [[0.191, 0.279, 0.017, 0.01], [0.222, 0.268, 0.026, 0.01], [0.268, 0.26, 0.034, 0.009], [0.282, 0.26, 0.03, 0.006]], dark), body("粉耳鸭方铲下方独立的平薄下喙", [[0.192, 0.257, 0.017, 0.004], [0.233, 0.247, 0.028, 0.004], [0.281, 0.249, 0.029, 0.004]], bare));
  for (const side of [-1, 1]) parts.push(membrane("喙侧向下悬垂并包围过滤腔的真实柔软瓣", bare, [[side * 0.019, 0.277, 0.201], [side * 0.03, 0.265, 0.24], [side * 0.034, 0.258, 0.28], [side * 0.034, 0.231, 0.273], [side * 0.025, 0.235, 0.228], [side * 0.018, 0.247, 0.201]]));
  foldedWings(parts, [0, 0.171, -0.02], 0.16, 0.21);
  tail(parts, [0, 0.09, -0.12], 0.09, 0.085, -102);
  feet(parts, [0, 0.075, -0.015], 0.041, 0.006, 0.048, { web: 0.96 });
  return parts;
}

export const birdExpansionBatchTenDesigns: MasterNatureDesign[] = [
  design("capeBarrenGoose", "澳洲灰雁", "动物", capeBarrenGoose, ["Cereopsis novaehollandiae", "重胸小头短三角嘴", "厚蜡膜与部分蹼趾"]),
  design("spurWingedGoose", "距翅雁", "动物", spurWingedGoose, ["Plectropterus gambensis", "翼腕硬骨距", "长腿长颈与额瘤"]),
  design("swanGoose", "鸿雁", "动物", () => calibrated(swanGoose(), 0.91), ["Anser cygnoides", "长直细颈与长楔嘴", "野生无额瘤雁体"]),
  design("knobBilledDuck", "瘤鸭", "动物", () => calibrated(knobBilledDuck(), 0.9), ["Sarkidiornis melanotos", "喙基侧扁皮瘤", "长腰高腿栖鸭"]),
  design("kingEider", "王绒鸭", "动物", () => calibrated(kingEider(), 0.9), ["Somateria spectabilis", "侧扁高鼻盾", "短颈重型潜鸭"]),
  design("northernShoveler", "琵嘴鸭", "动物", () => calibrated(northernShoveler(), 0.88), ["Spatula clypeata", "Anas clypeata", "真宽铲嘴和过滤梳片"]),
  design("magellanicSteamerDuck", "麦哲伦船鸭", "动物", () => calibrated(magellanicSteamerDuck(), 0.83), ["Tachyeres pteneres", "重躯短厚桨翼", "大蹼后位足"]),
  design("mandarinDuck", "鸳鸯", "动物", mandarinDuck, ["Aix galericulata", "次级羽真实竖帆", "颊扇羽和后枕冠"]),
  design("torrentDuck", "湍鸭", "动物", () => calibrated(torrentDuck(), 0.67), ["Merganetta armata", "翼腕小骨距与狭长硬尾", "长低躯强蹼足"]),
  design("pinkEaredDuck", "粉耳鸭", "动物", () => calibrated(pinkEaredDuck(), 0.77), ["Malacorhynchus membranaceus", "方铲嘴侧悬垂软瓣", "短腰大头滤食鸭"]),
];
