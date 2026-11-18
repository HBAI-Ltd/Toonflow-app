import { combineMeshes, design, eyes, leaf, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { pointed } from "./insectForms";
import { body } from "./fishForms";
import { membrane } from "./animals";

const plumage = "#a7b79c";
const pale = "#c5cbb1";
const dark = "#869983";
const bare = "#b2ad96";

function birdHead(parts: ModelPart[], root: Triple, size: Triple, largeEyes = false) {
  parts.push(lobe("具名鸟类的完整头颅", plumage, root, size), ...eyes([root[0], root[1] + size[1] * 0.1, root[2] + size[2] * 0.25], size[0] * 0.34, size[0] * (largeEyes ? 0.2 : 0.11)));
}

function wings(parts: ModelPart[], root: Triple, width: number, length: number) {
  for (const side of [-1, 1]) parts.push(lobe("收拢翅的肩臂与覆羽体积", dark, [root[0] + side * width * 0.35, root[1], root[2] - length * 0.16], [width * 0.72, length * 0.42, length]), leaf("沿躯侧向后相叠的初级飞羽端", pale, [root[0] + side * width * 0.35, root[1] - length * 0.08, root[2] - length * 0.35], width * 0.55, length * 0.62, [-90, 0, 0]));
}

function feet(parts: ModelPart[], hip: Triple, gap: number, thickness: number, backToe = true, webbed = false, thickJoint = false) {
  for (const side of [-1, 1]) { const ankle: Triple = [hip[0] + side * gap, thickness * 0.45, hip[2] + 0.02], joint: Triple = [ankle[0], hip[1] * 0.62, hip[2] - thickness * 2]; parts.push(tapered("鸟类腿部与跗蹠连续的两段承重轴", bare, [[hip[0] + side * gap * 0.65, hip[1], hip[2]], joint, ankle], [thickness, thickness * 0.72, thickness * 0.48])); if (thickJoint) parts.push(lobe("石鸻较粗的跗间关节", bare, joint, [thickness * 1.8, thickness * 1.9, thickness * 1.8]));
    const toes: ModelPart[] = []; for (let i = -1; i <= 1; i++) toes.push(pointed("真正分离的三枚前向足趾", bare, [ankle, [ankle[0] + i * thickness * 2, thickness * 0.24, ankle[2] + thickness * 3], [ankle[0] + i * thickness * 2.8, thickness * 0.12, ankle[2] + thickness * (i ? 4 : 5)]], [thickness * 0.32, thickness * 0.22, 0]));
    if (backToe) toes.push(pointed("后方独立承抓的后趾", bare, [ankle, [ankle[0] - side * thickness, thickness * 0.15, ankle[2] - thickness * 3]], [thickness * 0.26, 0])); parts.push(combineMeshes("一足全部相连的独立足趾", bare, toes));
    if (webbed) parts.push(membrane("剪嘴鸥足趾间实际相连的薄蹼", pale, [ankle, [ankle[0] - thickness * 2.7, thickness * 0.15, ankle[2] + thickness * 4], [ankle[0], thickness * 0.15, ankle[2] + thickness * 4.8], [ankle[0] + thickness * 2.7, thickness * 0.15, ankle[2] + thickness * 4]]));
  }
}

function tail(parts: ModelPart[], root: Triple, length: number, width: number) {
  const feathers: ModelPart[] = []; for (let i = 0; i < 5; i++) feathers.push(leaf("与尾综骨相连的实体尾羽", dark, [root[0] + (i - 2) * width * 0.12, root[1], root[2]], width * 0.34, length - Math.abs(i - 2) * length * 0.08, [-95, (i - 2) * 5, 0])); parts.push(combineMeshes("完整相叠的尾羽扇", dark, feathers));
}

function bird(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("非洲秃鹳厚重高腿上的大躯干", plumage, [0, 0.9, 0], [0.48, 0.68, 0.73]), tapered("非洲秃鹳裸露而粗短的颈", bare, [[0, 1.05, 0.16], [0, 1.38, 0.24], [0, 1.49, 0.29]], [0.105, 0.065, 0.06])); birdHead(parts, [0, 1.51, 0.31], [0.18, 0.22, 0.23]); parts.push(body("秃鹳粗厚而长的楔形喙", [[0.35, 1.48, 0.045, 0.042], [0.48, 1.46, 0.035, 0.03], [0.67, 1.43, 0.002, 0.002]], pale), lobe("前颈真正下垂的裸皮喉囊", bare, [0, 1.26, 0.27], [0.14, 0.31, 0.13])); wings(parts, [0, 0.99, 0], 0.44, 0.72); tail(parts, [0, 0.75, -0.3], 0.21, 0.17); feet(parts, [0, 0.73, 0.03], 0.085, 0.025);
  } else if (kind === 1) {
    parts.push(lobe("鹭鹤紧凑的地栖长腰躯", plumage, [0, 0.35, 0], [0.28, 0.39, 0.48]), tapered("鹭鹤上举的柔软短颈", plumage, [[0, 0.45, 0.13], [0, 0.62, 0.18]], [0.075, 0.05])); birdHead(parts, [0, 0.67, 0.2], [0.13, 0.15, 0.17]); parts.push(pointed("鹭鹤细而直的尖喙", bare, [[0, 0.658, 0.26], [0, 0.65, 0.39]], [0.017, 0]));
    for (const side of [-1, 1]) parts.push(leaf("遮盖鼻孔而非暴露圆洞的鼻盖", pale, [side * 0.008, 0.669, 0.28], 0.011, 0.02, [60, -side * 70, 0])); const crest: ModelPart[] = []; for (let i = 0; i < 8; i++) crest.push(leaf("鹭鹤可见的细长蓬松羽冠", pale, [(i - 3.5) * 0.004, 0.72, 0.18], 0.016, 0.13 + i % 2 * 0.02, [-25, i * 19 - 70, 0])); parts.push(combineMeshes("鹭鹤完整的后倾羽冠", pale, crest)); wings(parts, [0, 0.4, 0], 0.27, 0.38); tail(parts, [0, 0.28, -0.18], 0.2, 0.13); feet(parts, [0, 0.23, 0.03], 0.055, 0.017);
  } else if (kind === 2) {
    parts.push(lobe("红腿叫鹤长腿上的窄胸体", plumage, [0, 0.63, 0], [0.27, 0.4, 0.53]), tapered("叫鹤从胸部斜举的长颈", plumage, [[0, 0.74, 0.12], [0, 0.95, 0.24]], [0.065, 0.041])); birdHead(parts, [0, 1.0, 0.28], [0.12, 0.15, 0.16]); parts.push(pointed("叫鹤末端短钩的厚嘴", bare, [[0, 0.99, 0.33], [0, 0.985, 0.41], [0, 0.956, 0.421]], [0.02, 0.013, 0])); const crest: ModelPart[] = []; for (let i = 0; i < 8; i++) crest.push(pointed("叫鹤前额朝前直立的羽丝", pale, [[(i - 3.5) * 0.003, 1.056, 0.315], [(i - 3.5) * 0.006, 1.14 - i % 2 * 0.02, 0.36]], [0.0024, 0])); parts.push(combineMeshes("前额位置准确的叫鹤羽冠", pale, crest)); wings(parts, [0, 0.68, -0.015], 0.27, 0.41); tail(parts, [0, 0.55, -0.22], 0.36, 0.13); feet(parts, [0, 0.5, 0.025], 0.061, 0.017);
  } else if (kind === 3) {
    parts.push(lobe("船嘴鹭短颈而圆肩的矮壮躯", plumage, [0, 0.27, 0], [0.29, 0.33, 0.43]), lobe("缩在肩前的船嘴鹭颈", pale, [0, 0.38, 0.12], [0.2, 0.29, 0.2])); birdHead(parts, [0, 0.5, 0.18], [0.21, 0.22, 0.24], true); parts.push(body("船嘴鹭宽厚而扁平的舟形上喙", [[0.25, 0.466, 0.055, 0.018], [0.33, 0.466, 0.085, 0.024], [0.44, 0.46, 0.025, 0.005]], bare), body("与上喙匹配的扁宽下颌", [[0.25, 0.444, 0.052, 0.008], [0.33, 0.441, 0.082, 0.007], [0.438, 0.452, 0.023, 0.002]], pale)); const crest: ModelPart[] = []; for (let i = 0; i < 5; i++) crest.push(leaf("船嘴鹭头后倒伏的长冠羽", dark, [(i - 2) * 0.008, 0.565, 0.12], 0.024, 0.2, [-65, (i - 2) * 10, 0])); parts.push(combineMeshes("头后细长冠羽簇", dark, crest)); wings(parts, [0, 0.32, -0.01], 0.28, 0.35); tail(parts, [0, 0.2, -0.18], 0.13, 0.12); feet(parts, [0, 0.18, 0.025], 0.06, 0.016);
  } else if (kind === 4) {
    parts.push(lobe("剪嘴鸥长而低的海鸟躯", plumage, [0, 0.23, 0], [0.2, 0.25, 0.47])); birdHead(parts, [0, 0.36, 0.22], [0.14, 0.15, 0.17]); parts.push(body("剪嘴鸥较短的上颌刀片", [[0.27, 0.344, 0.008, 0.017], [0.34, 0.341, 0.005, 0.012], [0.39, 0.335, 0.001, 0.001]], bare), body("剪嘴鸥明显超出上颌的下颌刀片", [[0.27, 0.32, 0.008, 0.014], [0.37, 0.315, 0.005, 0.015], [0.46, 0.314, 0.001, 0.001]], pale)); wings(parts, [0, 0.26, -0.01], 0.2, 0.46); tail(parts, [0, 0.18, -0.2], 0.19, 0.11); feet(parts, [0, 0.14, 0.025], 0.045, 0.012, true, true);
  } else if (kind === 5) {
    parts.push(lobe("白腰杓鹬中等腿长上的斜长躯", plumage, [0, 0.3, 0], [0.23, 0.3, 0.43]), tapered("杓鹬前胸向上接头的细长颈", pale, [[0, 0.38, 0.11], [0, 0.55, 0.2]], [0.055, 0.03])); birdHead(parts, [0, 0.585, 0.225], [0.1, 0.12, 0.13]); parts.push(pointed("细长并连续向下弯曲的杓形嘴", bare, [[0, 0.579, 0.27], [0, 0.566, 0.34], [0, 0.526, 0.411], [0, 0.472, 0.455]], [0.009, 0.007, 0.004, 0])); wings(parts, [0, 0.34, -0.015], 0.22, 0.35); tail(parts, [0, 0.23, -0.18], 0.13, 0.1); feet(parts, [0, 0.23, 0.025], 0.055, 0.012);
  } else if (kind === 6) {
    parts.push(lobe("石鸻圆头高腿上的紧凑胸体", plumage, [0, 0.29, 0], [0.22, 0.28, 0.37]), tapered("石鸻较短的粗颈", plumage, [[0, 0.35, 0.1], [0, 0.455, 0.17]], [0.055, 0.044])); birdHead(parts, [0, 0.495, 0.185], [0.13, 0.15, 0.15], true); parts.push(pointed("石鸻较短而粗的直嘴", bare, [[0, 0.482, 0.235], [0, 0.475, 0.31]], [0.016, 0])); wings(parts, [0, 0.33, -0.01], 0.22, 0.32); tail(parts, [0, 0.23, -0.15], 0.17, 0.1); feet(parts, [0, 0.23, 0.025], 0.052, 0.014, false, false, true);
  } else if (kind === 7) {
    parts.push(lobe("大鸨与走禽不同的沉重宽胸和完整飞翼躯", plumage, [0, 0.57, 0], [0.5, 0.62, 0.87]), tapered("大鸨上举而较粗的长颈", pale, [[0, 0.72, 0.22], [0, 0.99, 0.3]], [0.13, 0.07])); birdHead(parts, [0, 1.055, 0.33], [0.17, 0.19, 0.21]); parts.push(pointed("大鸨短而略向下弯的喙", bare, [[0, 1.035, 0.405], [0, 1.02, 0.49]], [0.024, 0])); wings(parts, [0, 0.63, -0.01], 0.46, 0.71); tail(parts, [0, 0.48, -0.35], 0.22, 0.24); feet(parts, [0, 0.39, 0.025], 0.11, 0.034, false);
  } else if (kind === 8) {
    parts.push(lobe("普通夜鹰贴近地面的水平低胸长躯", plumage, [0, 0.085, -0.01], [0.12, 0.105, 0.28])); birdHead(parts, [0, 0.116, 0.116], [0.12, 0.1, 0.13], true); parts.push(polygon("夜鹰横宽而深裂的闭合嘴缘", dark, [[-0.047, 0.105], [0, 0.183], [0.047, 0.105], [0.02, 0.12], [0, 0.17], [-0.02, 0.12]], 0.0025, [0, 0.098, 0])); const bristles: ModelPart[] = []; for (const side of [-1, 1]) for (let i = 0; i < 5; i++) bristles.push(needle("普通夜鹰口角朝外的长须状羽轴", pale, [side * 0.038, 0.105, 0.13], [side * (0.057 + i * 0.002), 0.101 + i * 0.002, 0.16 + i * 0.004], 0.001)); parts.push(combineMeshes("嘴缘真实分离的口须", pale, bristles)); wings(parts, [0, 0.102, -0.015], 0.12, 0.27); tail(parts, [0, 0.075, -0.12], 0.16, 0.07); feet(parts, [0, 0.05, 0.025], 0.026, 0.006);
  } else {
    parts.push(lobe("大林鸱如树桩般直立而窄长的胸腹", plumage, [0, 0.23, 0], [0.18, 0.36, 0.2]), tapered("大林鸱宽颈直接连接大头", plumage, [[0, 0.35, 0.005], [0, 0.425, 0.055]], [0.07, 0.06])); birdHead(parts, [0, 0.445, 0.07], [0.17, 0.19, 0.16], true); parts.push(body("大林鸱左右张阔而嘴尖很短的上喙", [[0.095, 0.416, 0.065, 0.015], [0.135, 0.416, 0.048, 0.018], [0.174, 0.413, 0.004, 0.003]], bare), body("宽大嘴裂下方独立的下颌", [[0.095, 0.399, 0.062, 0.007], [0.135, 0.396, 0.048, 0.007], [0.173, 0.406, 0.003, 0.001]], dark)); wings(parts, [0, 0.26, -0.01], 0.18, 0.31); tail(parts, [0, 0.15, -0.075], 0.22, 0.1); feet(parts, [0, 0.11, 0.025], 0.035, 0.009);
  }
  const factor = [1, 0.7, 0.84, 0.64, 0.53, 0.7, 0.68, 0.9, 0.6, 1][kind]!;
  if (factor !== 1) for (const p of parts) for (const axis of ["x", "y", "z"] as const) { p.position[axis] *= factor; p.scale[axis] *= factor; }
  return parts;
}

const entries = [["marabou", "非洲秃鹳", "Leptoptilos crumenifer"], ["kagu", "鹭鹤", "Rhynochetos jubatus"], ["seriema", "红腿叫鹤", "Cariama cristata"], ["boatBilledHeron", "船嘴鹭", "Cochlearius cochlearius"], ["blackSkimmer", "剪嘴鸥", "Rynchops niger"], ["eurasianCurlew", "白腰杓鹬", "Numenius arquata"], ["stoneCurlew", "石鸻", "Burhinus oedicnemus"], ["greatBustard", "大鸨", "Otis tarda"], ["nightjar", "普通夜鹰", "Caprimulgus europaeus"], ["potoo", "大林鸱", "Nyctibius grandis"]];

export const avianFormDesigns: MasterNatureDesign[] = entries.map(([key, name, taxon], i) => design(key!, name!, "动物", () => bird(i), [taxon!, "具名鸟类诊断结构"]));
