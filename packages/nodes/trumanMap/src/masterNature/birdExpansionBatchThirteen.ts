import { combineMeshes, design, leaf, lobe, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { calibrated, foldedWings, head, tail } from "./birdExpansionBatchOne";
import { talonFeet } from "./birdExpansionBatchFive";

const feather = "#a4b19a";
const covert = "#839582";
const pale = "#cbd0b7";
const bare = "#b5ac8d";
const dark = "#596a5e";

// https://animaldiversity.org/accounts/Polemaetus_bellicosus/
function martialEagle(): ModelPart[] {
  const parts: ModelPart[] = [lobe("猛雕高而深重的草原猛禽胸躯", pale, [0, 0.405, -0.035], [0.365, 0.49, 0.435]), lobe("猛雕支承短厚头颅的粗羽颈", covert, [0, 0.619, 0.08], [0.18, 0.235, 0.19])];
  head(parts, [0, 0.754, 0.129], [0.158, 0.18, 0.19], covert);
  parts.push(tapered("猛雕重基而短钩的猛禽硬嘴", bare, [[0, 0.738, 0.198], [0, 0.72, 0.259], [0, 0.675, 0.265]], [0.027, 0.019, 0.0012]));
  parts.push(combineMeshes("猛雕贴在后枕而不形成长叉冠的短羽", covert, Array.from({ length: 5 }, (_, index) => leaf("猛雕低短后枕羽", covert, [(index - 2) * 0.009, 0.827, 0.082], 0.022, 0.042 + index % 2 * 0.009, [-58, (index - 2) * 8, 0]))));
  for (const side of [-1, 1]) {
    parts.push(membrane("猛雕外展宽大并略向上弓起的长翔翼", covert, [[side * 0.12, 0.52, 0.07], [side * 0.47, 0.67, 0.14], [side * 0.92, 0.64, -0.04], [side * 1.12, 0.5, -0.2], [side * 0.72, 0.32, -0.39], [side * 0.13, 0.26, -0.21]]));
    parts.push(combineMeshes("猛雕翼端真实分开的宽初级飞羽", covert, Array.from({ length: 11 }, (_, index) => leaf("猛雕长宽翔翼的指状飞羽", covert, [side * (0.41 + index * 0.061), 0.49 - index * 0.006, -0.03 - index * 0.014], 0.104, 0.32 - index * 0.01, [-112, -side * (index * 3.3 + 3), 0]))), lobe("猛雕覆盖整个长跗直到趾根的完整羽靴", pale, [side * 0.09, 0.141, 0.02], [0.105, 0.265, 0.11]));
  }
  tail(parts, [0, 0.245, -0.22], 0.22, 0.31, -104);
  talonFeet(parts, [0, 0.135, 0.035], 0.093, 0.022, 0.13);
  return parts;
}

function papuanEagle(): ModelPart[] {
  const parts: ModelPart[] = [lobe("新几内亚角雕收腰而长胸的森林猎禽躯", feather, [0, 0.42, -0.04], [0.29, 0.38, 0.36]), tapered("新几内亚角雕细于角雕的长羽颈", pale, [[0, 0.55, 0.075], [0, 0.674, 0.13]], [0.066, 0.043])];
  head(parts, [0, 0.729, 0.174], [0.142, 0.175, 0.184], pale);
  parts.push(tapered("新几内亚角雕厚基而外露的强弯嘴", bare, [[0, 0.711, 0.241], [0, 0.688, 0.3], [0, 0.65, 0.304]], [0.027, 0.018, 0.001]));
  parts.push(combineMeshes("新几内亚角雕低而完整的后枕冠", covert, Array.from({ length: 9 }, (_, index) => leaf("新几内亚角雕短宽后冠羽", covert, [(index - 4) * 0.007, 0.797, 0.124], 0.024, 0.086 - Math.abs(index - 4) * 0.005, [-42, (index - 4) * 5, 0]))));
  foldedWings(parts, [0, 0.485, -0.045], 0.3, 0.34);
  tail(parts, [0, 0.29, -0.19], 0.2, 0.36, -102);
  for (const side of [-1, 1]) parts.push(lobe("长裸跗上方仅大腿部分覆盖的短羽裤", pale, [side * 0.074, 0.3, 0.005], [0.085, 0.15, 0.095]));
  talonFeet(parts, [0, 0.265, 0.025], 0.083, 0.021, 0.124);
  return parts;
}

// https://peregrinefund.org/explore-raptors-species/eagles/crested-eagle
function crestedEagle(): ModelPart[] {
  const parts: ModelPart[] = [lobe("冠雕比角雕狭窄而细长的林栖躯", feather, [0, 0.365, -0.03], [0.265, 0.43, 0.36]), tapered("冠雕从窄肩伸出的修长羽颈", pale, [[0, 0.49, 0.075], [0, 0.639, 0.118]], [0.06, 0.036])];
  head(parts, [0, 0.69, 0.161], [0.128, 0.15, 0.166], pale);
  parts.push(tapered("冠雕明显窄于角雕巨嘴的下钩喙", bare, [[0, 0.674, 0.222], [0, 0.657, 0.271], [0, 0.623, 0.276]], [0.023, 0.015, 0.001]));
  parts.push(combineMeshes("冠雕汇聚到单一尖端而非角雕双叉的长冠", covert, Array.from({ length: 7 }, (_, index) => leaf("冠雕中央最高的单峰长羽", covert, [(index - 3) * 0.006, 0.751, 0.115], 0.023, 0.165 - Math.abs(index - 3) * 0.027, [-25, (index - 3) * 5, -(index - 3) * 2]))));
  foldedWings(parts, [0, 0.447, -0.035], 0.27, 0.33);
  tail(parts, [0, 0.215, -0.19], 0.18, 0.385, -102);
  for (const side of [-1, 1]) parts.push(lobe("冠雕与细足相接的羽腿", pale, [side * 0.066, 0.148, 0.015], [0.075, 0.18, 0.085]));
  talonFeet(parts, [0, 0.12, 0.028], 0.069, 0.016, 0.09);
  return parts;
}

// https://peregrinefund.org/explore-raptors-species/eagles/crested-serpent-eagle
function crestedSerpentEagle(): ModelPart[] {
  const parts: ModelPart[] = [lobe("凤头蛇雕粗短而宽胸的圆腹躯", feather, [0, 0.285, -0.025], [0.28, 0.34, 0.32]), lobe("蛇雕缩在宽肩里的粗短颈", feather, [0, 0.429, 0.075], [0.17, 0.21, 0.165])];
  head(parts, [0, 0.551, 0.126], [0.185, 0.17, 0.2], feather);
  parts.push(tapered("凤头蛇雕大头前短而强钩的嘴", bare, [[0, 0.533, 0.199], [0, 0.513, 0.253], [0, 0.479, 0.254]], [0.024, 0.016, 0.001]));
  for (const side of [-1, 1]) parts.push(lobe("蛇雕从眼部延到嘴基的大片裸面皮肤", bare, [side * 0.058, 0.547, 0.177], [0.014, 0.069, 0.071]));
  parts.push(combineMeshes("凤头蛇雕后脑短而圆的扇冠", covert, Array.from({ length: 13 }, (_, index) => leaf("蛇雕宽端短圆枕冠羽", covert, [(index - 6) * 0.007, 0.611, 0.082], 0.03, 0.083 - Math.abs(index - 6) * 0.004, [-56, (index - 6) * 8, 0]))));
  for (const side of [-1, 1]) {
    parts.push(membrane("蛇雕短宽而外缘圆钝的森林翼", covert, [[side * 0.09, 0.38, 0.065], [side * 0.32, 0.48, 0.115], [side * 0.52, 0.4, 0.03], [side * 0.62, 0.3, -0.105], [side * 0.39, 0.19, -0.265], [side * 0.09, 0.17, -0.16]]));
    parts.push(combineMeshes("蛇雕圆翼外缘密集而粗宽的飞羽", covert, Array.from({ length: 8 }, (_, index) => leaf("蛇雕短宽翼的指端羽", covert, [side * (0.21 + index * 0.045), 0.35 - index * 0.008, -0.021 - index * 0.011], 0.081, 0.23 - index * 0.008, [-114, -side * index * 4, 0]))));
  }
  tail(parts, [0, 0.18, -0.175], 0.17, 0.24, -104);
  talonFeet(parts, [0, 0.15, 0.02], 0.062, 0.012, 0.074);
  return parts;
}

function westernMarshHarrier(): ModelPart[] {
  const parts: ModelPart[] = [lobe("白头鹞低肩细腰的轻长躯", feather, [0, 0.22, -0.025], [0.19, 0.235, 0.3]), tapered("白头鹞细短而前伸的羽颈", pale, [[0, 0.3, 0.075], [0, 0.382, 0.117]], [0.033, 0.025])];
  head(parts, [0, 0.419, 0.147], [0.104, 0.119, 0.127], pale);
  parts.push(tapered("白头鹞较小而尖钩的嘴", bare, [[0, 0.404, 0.193], [0, 0.392, 0.235], [0, 0.368, 0.239]], [0.015, 0.01, 0.0008]));
  const disk: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 8; index++) { const angle = (-80 + index * 22) * Math.PI / 180; disk.push(leaf("鹞类颊后向下汇聚的浅面盘羽", pale, [side * (0.025 + Math.cos(angle) * 0.012), 0.417 + Math.sin(angle) * 0.038, 0.184 - Math.cos(angle) * 0.006], 0.015, 0.033, [Math.sin(angle) * 27, side * 70, side * Math.sin(angle) * 26])); }
  parts.push(combineMeshes("白头鹞眼后到颏下连成弧形的浅面盘", pale, disk));
  for (const side of [-1, 1]) {
    parts.push(membrane("白头鹞举成浅V形的长而窄翼", covert, [[side * 0.065, 0.29, 0.06], [side * 0.3, 0.4, 0.1], [side * 0.6, 0.49, -0.02], [side * 0.69, 0.46, -0.13], [side * 0.42, 0.27, -0.29], [side * 0.075, 0.15, -0.16]]));
    parts.push(combineMeshes("白头鹞上举长翼末端的分指羽", covert, Array.from({ length: 9 }, (_, index) => leaf("鹞翼外段相叠的狭长飞羽", covert, [side * (0.21 + index * 0.049), 0.28 + index * 0.017, -0.02 - index * 0.01], 0.062, 0.245 - index * 0.007, [-111, -side * index * 3.5, 0]))));
  }
  tail(parts, [0, 0.135, -0.155], 0.15, 0.205, -102);
  talonFeet(parts, [0, 0.13, 0.015], 0.047, 0.0085, 0.062);
  return parts;
}

// https://australian.museum/learn/animals/birds/black-kite/
function blackKite(): ModelPart[] {
  const parts: ModelPart[] = [lobe("黑鸢瘦长而低胸的滑翔躯", covert, [0, 0.215, -0.025], [0.19, 0.24, 0.305]), tapered("黑鸢向前抬起的小头颈", feather, [[0, 0.295, 0.075], [0, 0.367, 0.125]], [0.033, 0.025])];
  head(parts, [0, 0.405, 0.158], [0.098, 0.11, 0.137]);
  parts.push(tapered("黑鸢细小而曲折下钩的喙", bare, [[0, 0.39, 0.207], [0, 0.377, 0.249], [0, 0.352, 0.25]], [0.015, 0.0095, 0.0008]));
  for (const side of [-1, 1]) {
    parts.push(membrane("黑鸢腕前凸且外段向后扫的长翼", covert, [[side * 0.06, 0.295, 0.06], [side * 0.33, 0.405, 0.13], [side * 0.65, 0.363, -0.035], [side * 0.76, 0.26, -0.2], [side * 0.37, 0.16, -0.29], [side * 0.07, 0.145, -0.16]]));
    parts.push(combineMeshes("黑鸢向后斜展的翼指羽", covert, Array.from({ length: 10 }, (_, index) => leaf("黑鸢有分指端的长翔羽", covert, [side * (0.23 + index * 0.049), 0.285 - index * 0.004, -0.03 - index * 0.013], 0.068, 0.26 - index * 0.006, [-116, -side * (index * 3 + 5), 0]))));
  }
  parts.push(combineMeshes("两侧最长而中央较短的真实浅叉尾", covert, Array.from({ length: 10 }, (_, index) => { const t = (index - 4.5) / 4.5; return leaf("黑鸢浅叉尾上的独立尾羽", covert, [t * 0.048, 0.133, -0.161], 0.045, 0.18 + Math.abs(t) * 0.067, [-101, -t * 12, 0]); })));
  talonFeet(parts, [0, 0.108, 0.012], 0.043, 0.0075, 0.047);
  return parts;
}

// https://www.dnr.sc.gov/swap/supplemental/birds/swallowtailedkite2015.pdf
function swallowTailedKite(): ModelPart[] {
  const parts: ModelPart[] = [lobe("燕尾鸢轻巧而特别狭腰的小胸躯", pale, [0, 0.19, -0.015], [0.142, 0.2, 0.245]), tapered("燕尾鸢小头前方的短羽颈", pale, [[0, 0.255, 0.066], [0, 0.318, 0.098]], [0.026, 0.019])];
  head(parts, [0, 0.347, 0.122], [0.084, 0.094, 0.112], pale);
  parts.push(tapered("燕尾鸢很短而细钩的嘴", dark, [[0, 0.335, 0.163], [0, 0.324, 0.195], [0, 0.307, 0.196]], [0.011, 0.0075, 0.0006]));
  for (const side of [-1, 1]) {
    parts.push(membrane("燕尾鸢无宽分指端的镰状尖长翼", covert, [[side * 0.045, 0.255, 0.05], [side * 0.27, 0.34, 0.115], [side * 0.5, 0.32, 0.01], [side * 0.65, 0.22, -0.173], [side * 0.35, 0.145, -0.205], [side * 0.05, 0.125, -0.12]]));
    parts.push(combineMeshes("燕尾鸢尖翼后缘连续收束的狭羽", covert, Array.from({ length: 8 }, (_, index) => leaf("燕尾鸢贴合尖翼而不张成鹰指的飞羽", covert, [side * (0.13 + index * 0.055), 0.233 - index * 0.002, -0.02 - index * 0.011], 0.047, 0.18 - index * 0.007, [-112, -side * index * 1.8, 0]))));
    parts.push(combineMeshes("燕尾鸢一侧向外分开的长剪尾叶", covert, Array.from({ length: 5 }, (_, index) => leaf("形成深V形缺口的独立燕尾羽", covert, [side * (0.009 + index * 0.006), 0.12, -0.12], 0.037, 0.19 + index * 0.028, [-98, -side * (12 + index * 3), 0]))));
  }
  talonFeet(parts, [0, 0.09, 0.01], 0.033, 0.0055, 0.035);
  return parts;
}

// https://peregrinefund.org/explore-raptors-species/kites/snail-kite
function snailKite(): ModelPart[] {
  const parts: ModelPart[] = [lobe("食螺鸢圆胸而细腰的中型沼泽猎禽躯", covert, [0, 0.21, -0.02], [0.18, 0.245, 0.29]), tapered("食螺鸢前抬的小头细颈", covert, [[0, 0.294, 0.075], [0, 0.366, 0.115]], [0.032, 0.024])];
  head(parts, [0, 0.404, 0.147], [0.097, 0.11, 0.127], covert);
  parts.push(tapered("食螺鸢专门探入螺壳而纤长深弯的真钩喙", bare, [[0, 0.389, 0.193], [0, 0.371, 0.231], [0, 0.337, 0.239], [0, 0.317, 0.221]], [0.014, 0.01, 0.006, 0.0007]));
  foldedWings(parts, [0, 0.266, -0.025], 0.19, 0.275);
  tail(parts, [0, 0.13, -0.15], 0.14, 0.24, -103);
  talonFeet(parts, [0, 0.115, 0.015], 0.047, 0.0085, 0.073);
  return parts;
}

// https://peregrinefund.org/explore-raptors-species/kites/hook-billed-kite
function hookBilledKite(): ModelPart[] {
  const parts: ModelPart[] = [lobe("钩嘴鸢丰满胸部与狭后腰的短躯", feather, [0, 0.215, -0.02], [0.195, 0.25, 0.27]), lobe("钩嘴鸢撑起大头的粗短颈", feather, [0, 0.327, 0.075], [0.12, 0.16, 0.125])];
  head(parts, [0, 0.426, 0.121], [0.124, 0.15, 0.157]);
  parts.push(body("钩嘴鸢上下很深并在前端强烈卷下的重喙", [[0.178, 0.411, 0.021, 0.034], [0.222, 0.401, 0.02, 0.04], [0.251, 0.368, 0.013, 0.027], [0.245, 0.337, 0.001, 0.002]], bare), body("与大上钩分开而更短的厚下颌", [[0.175, 0.369, 0.015, 0.015], [0.216, 0.365, 0.009, 0.01], [0.229, 0.376, 0.001, 0.002]], bare));
  foldedWings(parts, [0, 0.278, -0.025], 0.2, 0.27);
  tail(parts, [0, 0.135, -0.14], 0.14, 0.24, -103);
  talonFeet(parts, [0, 0.12, 0.015], 0.048, 0.009, 0.064);
  return parts;
}

// https://peregrinefund.org/explore-raptors-species/hawks/crane-hawk
function craneHawk(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鹤鹰立在长足上的狭长胸躯", covert, [0, 0.325, -0.025], [0.18, 0.275, 0.305]), tapered("鹤鹰由窄肩向前伸出的细羽颈", covert, [[0, 0.425, 0.075], [0, 0.511, 0.119]], [0.033, 0.023])];
  head(parts, [0, 0.548, 0.15], [0.095, 0.108, 0.129], covert);
  parts.push(tapered("鹤鹰细短的钩嘴而非大雕深喙", bare, [[0, 0.534, 0.197], [0, 0.522, 0.235], [0, 0.497, 0.238]], [0.014, 0.009, 0.0007]));
  foldedWings(parts, [0, 0.385, -0.035], 0.19, 0.28);
  tail(parts, [0, 0.225, -0.155], 0.145, 0.32, -102);
  talonFeet(parts, [0, 0.225, 0.015], 0.05, 0.01, 0.094);
  for (const side of [-1, 1]) parts.push(lobe("长跗中段真实突出而非额外假关节的踝骨节", bare, [side * 0.048, 0.125, 0.003], [0.029, 0.035, 0.03]));
  return parts;
}

export const birdExpansionBatchThirteenDesigns: MasterNatureDesign[] = [
  design("martialEagle", "猛雕", "动物", martialEagle, ["Polemaetus bellicosus", "深重胸躯宽长翔翼", "真正羽覆长跗与强爪"]),
  design("papuanEagle", "新几内亚角雕", "动物", papuanEagle, ["Harpyopsis novaeguineae", "长裸跗和狭肩长颈", "宽短翼与长圆尾"]),
  design("crestedEagle", "冠雕", "动物", crestedEagle, ["Morphnus guianensis", "单尖长冠窄肩细躯", "羽腿与长尾"]),
  design("crestedSerpentEagle", "凤头蛇雕", "动物", crestedSerpentEagle, ["Spilornis cheela", "大头裸面短圆冠", "短宽圆翼与裸跗"]),
  design("westernMarshHarrier", "白头鹞", "动物", westernMarshHarrier, ["Circus aeruginosus", "浅面盘细长腿", "V形长翼和长尾"]),
  design("blackKite", "黑鸢", "动物", blackKite, ["Milvus migrans", "真实中央短两侧长的浅叉尾", "前凸腕长翔翼弱足"]),
  design("swallowTailedKite", "燕尾鸢", "动物", swallowTailedKite, ["Elanoides forficatus", "深V剪尾和镰状尖翼", "小头轻腰短弱足"]),
  design("snailKite", "食螺鸢", "动物", () => calibrated(snailKite(), 0.76), ["Rostrhamus sociabilis", "长细深曲的螺钩喙", "细腰长趾沼泽猎禽"]),
  design("hookBilledKite", "钩嘴鸢", "动物", () => calibrated(hookBilledKite(), 0.8), ["Chondrohierax uncinatus", "真正高深而强钩的重嘴", "粗短颈大头栖禽躯"]),
  design("craneHawk", "鹤鹰", "动物", () => calibrated(craneHawk(), 0.76), ["Geranospiza caerulescens", "极长跗与分离长趾", "窄胸小头长尾"]),
];
