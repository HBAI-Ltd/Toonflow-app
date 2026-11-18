import { combineMeshes, design, leaf, lobe, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { body } from "./fishForms";
import { calibrated, feet, foldedWings, head, tail } from "./birdExpansionBatchOne";
import { talonFeet } from "./birdExpansionBatchFive";

const feather = "#a5b19a";
const covert = "#849582";
const pale = "#cbd0b9";
const bare = "#b4aa8d";
const dark = "#596b5e";

// https://heronconservation.org/herons-of-the-world/list/goliath-heron/
function goliathHeron(): ModelPart[] {
  const parts: ModelPart[] = [lobe("巨鹭高腿之上的厚长胸腹", covert, [0, 0.79, -0.045], [0.37, 0.43, 0.65]), tapered("巨鹭长而粗壮且真正折回的S颈", feather, [[0, 0.91, 0.18], [0, 1.05, 0.035], [0, 1.34, 0.16], [0, 1.45, 0.355]], [0.095, 0.073, 0.05, 0.041])];
  head(parts, [0, 1.473, 0.418], [0.135, 0.15, 0.22]);
  parts.push(body("巨鹭高基部连续收尖的巨大直矛喙", [[0.497, 1.451, 0.025, 0.031], [0.62, 1.445, 0.018, 0.021], [0.749, 1.428, 0.0015, 0.002]], bare));
  foldedWings(parts, [0, 0.875, -0.055], 0.38, 0.52);
  const breast: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 7; index++) breast.push(leaf("巨鹭颈根胸前真正下披的长羽", pale, [side * (0.018 + index * 0.005), 0.94 - index * 0.009, 0.203], 0.027, 0.23 + index % 2 * 0.03, [171, side * (index * 5 - 15), -side * 9]));
  parts.push(combineMeshes("巨鹭厚折颈下方连续的前胸披羽", pale, breast));
  tail(parts, [0, 0.61, -0.31], 0.18, 0.17, -108);
  feet(parts, [0, 0.62, 0.01], 0.091, 0.019, 0.18);
  return parts;
}

// https://heronconservation.org/herons-of-the-world/list/eurasian-bittern/
function eurasianBittern(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大麻鳽厚胸而圆肩的矮壮长躯", feather, [0, 0.32, -0.035], [0.32, 0.4, 0.44]), tapered("大麻鳽隐在厚羽内而非苍鹭细裸线的粗颈", feather, [[0, 0.41, 0.105], [0, 0.52, 0.085], [0, 0.626, 0.18]], [0.112, 0.091, 0.05])];
  head(parts, [0, 0.661, 0.224], [0.125, 0.14, 0.18]);
  parts.push(body("大麻鳽头前宽基而坚硬的长矛嘴", [[0.289, 0.641, 0.02, 0.025], [0.384, 0.633, 0.013, 0.018], [0.435, 0.621, 0.0012, 0.002]], bare));
  const throat: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 12; index++) throat.push(leaf("大麻鳽下颌直到胸部的松长喉羽", feather, [side * (0.011 + index * 0.0055), 0.592 - index * 0.011, 0.186 - index * 0.001], 0.028, 0.15 + index % 3 * 0.018, [169 + index % 3 * 3, side * (index * 4 - 16), -side * 12]));
  parts.push(combineMeshes("能遮住颈胸分界的松厚喉羽盾", feather, throat));
  foldedWings(parts, [0, 0.407, -0.045], 0.33, 0.34);
  tail(parts, [0, 0.235, -0.21], 0.13, 0.1, -110);
  feet(parts, [0, 0.19, 0.03], 0.073, 0.013, 0.12);
  return parts;
}

// https://heronconservation.org/herons-of-the-world/list/agami-heron/
function agamiHeron(): ModelPart[] {
  const parts: ModelPart[] = [lobe("栗腹鹭短腿上狭长而低肩的林栖躯", covert, [0, 0.3, -0.035], [0.205, 0.29, 0.38]), tapered("栗腹鹭缩在胸前再前伸的极细长颈", feather, [[0, 0.375, 0.09], [0, 0.422, -0.01], [0, 0.578, 0.065], [0, 0.62, 0.189]], [0.049, 0.035, 0.023, 0.02])];
  head(parts, [0, 0.633, 0.229], [0.083, 0.09, 0.13]);
  parts.push(body("栗腹鹭长于头部的窄长西洋剑状喙", [[0.277, 0.62, 0.0125, 0.014], [0.34, 0.617, 0.009, 0.01], [0.425, 0.611, 0.0009, 0.0012]], bare));
  parts.push(combineMeshes("栗腹鹭后枕向后悬出的细白披羽", pale, Array.from({ length: 9 }, (_, index) => leaf("栗腹鹭细长后脑羽", pale, [(index - 4) * 0.004, 0.661, 0.2], 0.013, 0.18 + index % 2 * 0.018, [-70, (index - 4) * 5, 0]))));
  foldedWings(parts, [0, 0.355, -0.04], 0.21, 0.31);
  tail(parts, [0, 0.22, -0.195], 0.11, 0.1, -108);
  feet(parts, [0, 0.18, 0.015], 0.053, 0.009, 0.085);
  return parts;
}

// https://nationalzoo.si.edu/animals/black-crowned-night-heron
function blackCrownedNightHeron(): ModelPart[] {
  const parts: ModelPart[] = [lobe("夜鹭宽肩拱背而圆腹的紧凑躯", covert, [0, 0.285, -0.025], [0.28, 0.33, 0.36]), lobe("夜鹭藏在前胸而不外伸的粗短颈", pale, [0, 0.38, 0.09], [0.19, 0.28, 0.18])];
  head(parts, [0, 0.503, 0.149], [0.16, 0.17, 0.195], pale);
  parts.push(lobe("夜鹭扁平而向后连续到背部的顶冠", covert, [0, 0.558, 0.125], [0.148, 0.061, 0.179]), body("夜鹭比日鹭厚短的粗锥状喙", [[0.22, 0.482, 0.025, 0.028], [0.302, 0.468, 0.018, 0.022], [0.346, 0.452, 0.0015, 0.002]], bare));
  parts.push(combineMeshes("夜鹭头后真正分离的三根细白长羽", pale, Array.from({ length: 3 }, (_, index) => tapered("夜鹭细长而非宽叶的后枕饰羽", pale, [[(index - 1) * 0.009, 0.546, 0.08], [(index - 1) * 0.012, 0.487 - index % 2 * 0.016, -0.095]], [0.0022, 0.0005]))));
  foldedWings(parts, [0, 0.355, -0.035], 0.29, 0.28);
  tail(parts, [0, 0.205, -0.18], 0.13, 0.095, -109);
  feet(parts, [0, 0.175, 0.025], 0.065, 0.011, 0.09);
  return parts;
}

// https://www.wcs.org/our-work/species/giant-ibis
function giantIbis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("巨鹮高肩而前胸深重的长躯", covert, [0, 0.53, -0.045], [0.36, 0.43, 0.55]), tapered("巨鹮粗羽颈向上延伸到有鳞裸颈", covert, [[0, 0.66, 0.16], [0, 0.79, 0.22]], [0.073, 0.045]), tapered("巨鹮前部没有披鬃的短裸颈", bare, [[0, 0.775, 0.211], [0, 0.9, 0.279]], [0.047, 0.034])];
  head(parts, [0, 0.943, 0.32], [0.118, 0.13, 0.17], bare);
  parts.push(tapered("巨鹮厚基并长而缓慢下曲的重探嘴", bare, [[0, 0.929, 0.382], [0, 0.911, 0.5], [0, 0.863, 0.613], [0, 0.789, 0.673]], [0.027, 0.021, 0.012, 0.001]));
  const scales: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 8; index++) scales.push(lobe("巨鹮裸颈两侧低而横长的真实鳞褶", bare, [side * 0.034, 0.815 + index * 0.016, 0.245 + index * 0.007], [0.01, 0.007, 0.035]));
  parts.push(combineMeshes("沿裸颈排列的低横鳞褶而非后枕长鬃", bare, scales));
  foldedWings(parts, [0, 0.61, -0.05], 0.37, 0.44);
  tail(parts, [0, 0.37, -0.265], 0.17, 0.16, -108);
  feet(parts, [0, 0.365, 0.025], 0.083, 0.015, 0.13);
  return parts;
}

function greatGrebe(): ModelPart[] {
  const parts: ModelPart[] = [lobe("巨䴙䴘无长外露尾的深腹长舟体", covert, [0, 0.185, -0.045], [0.235, 0.25, 0.43]), tapered("巨䴙䴘较厚并前倾折起的长颈", feather, [[0, 0.242, 0.115], [0, 0.375, 0.16], [0, 0.49, 0.24]], [0.047, 0.033, 0.026])];
  head(parts, [0, 0.523, 0.282], [0.107, 0.12, 0.15], covert);
  parts.push(body("巨䴙䴘头前粗基而锐尖的匕首嘴", [[0.336, 0.507, 0.016, 0.019], [0.402, 0.499, 0.01, 0.012], [0.438, 0.492, 0.001, 0.0015]], bare));
  const crest: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 5; index++) crest.push(leaf("巨䴙䴘枕后向后稍外伸的短冠羽", covert, [side * (0.017 + index * 0.003), 0.562, 0.248], 0.014, 0.078 - index * 0.003, [-51, side * (20 + index * 5), 0]));
  parts.push(combineMeshes("巨䴙䴘短冠而非西䴙䴘平滑细颅", covert, crest));
  foldedWings(parts, [0, 0.235, -0.045], 0.24, 0.29);
  parts.push(lobe("巨䴙䴘由短绒羽遮住尾综骨的圆后端", covert, [0, 0.174, -0.22], [0.14, 0.15, 0.12]));
  feet(parts, [0, 0.11, -0.175], 0.079, 0.011, 0.09, { lobed: true, hindToe: false });
  return parts;
}

// https://wdfw.wa.gov/species-habitats/species/aechmophorus-occidentalis
function westernGrebe(): ModelPart[] {
  const parts: ModelPart[] = [lobe("西䴙䴘低而狭窄的长潜泳躯", covert, [0, 0.17, -0.055], [0.19, 0.215, 0.42]), tapered("西䴙䴘远长于头部而细如蛇的羽颈", pale, [[0, 0.222, 0.115], [0, 0.365, 0.143], [0, 0.534, 0.208]], [0.034, 0.021, 0.02])];
  head(parts, [0, 0.564, 0.245], [0.088, 0.096, 0.144], pale);
  parts.push(body("西䴙䴘与细长头轴一致的窄矛嘴", [[0.297, 0.552, 0.011, 0.013], [0.351, 0.55, 0.008, 0.009], [0.387, 0.546, 0.0008, 0.0012]], bare), lobe("西䴙䴘后脑略有尖峰而无双侧冠羽的顶面", covert, [0, 0.6, 0.223], [0.084, 0.032, 0.1]));
  foldedWings(parts, [0, 0.212, -0.06], 0.2, 0.29);
  parts.push(lobe("西䴙䴘后端圆钝的无尾绒羽区", covert, [0, 0.157, -0.227], [0.113, 0.12, 0.115]));
  feet(parts, [0, 0.1, -0.185], 0.074, 0.009, 0.087, { lobed: true, hindToe: false });
  return parts;
}

// https://www.nationalzoo.si.edu/animals/kori-bustard
function koriBustard(): ModelPart[] {
  const parts: ModelPart[] = [lobe("灰颈鸨低长而极宽厚的负重胸腹", feather, [0, 0.62, -0.085], [0.52, 0.55, 0.82]), tapered("灰颈鸨由重躯前方伸出再向上弯的长颈", pale, [[0, 0.77, 0.25], [0, 0.948, 0.295], [0, 1.122, 0.36]], [0.113, 0.078, 0.05])];
  head(parts, [0, 1.161, 0.415], [0.145, 0.15, 0.2]);
  parts.push(body("灰颈鸨长而侧扁的下曲硬嘴", [[0.488, 1.142, 0.022, 0.026], [0.572, 1.125, 0.017, 0.02], [0.604, 1.103, 0.002, 0.003]], bare));
  parts.push(combineMeshes("灰颈鸨后枕向后横展的短扇冠", covert, Array.from({ length: 11 }, (_, index) => leaf("灰颈鸨真正分离的枕冠羽", covert, [(index - 5) * 0.007, 1.21, 0.355], 0.022, 0.14 - Math.abs(index - 5) * 0.008, [-63, (index - 5) * 7, 0]))));
  foldedWings(parts, [0, 0.73, -0.105], 0.53, 0.64);
  tail(parts, [0, 0.42, -0.425], 0.29, 0.27, -102);
  feet(parts, [0, 0.425, 0.01], 0.128, 0.029, 0.16, { hindToe: false });
  return parts;
}

// https://www.adfg.alaska.gov/static/home/library/owls/pdfs/alaska-owlmanac.pdf
function greatGrayOwl(): ModelPart[] {
  const parts: ModelPart[] = [lobe("乌林鸮窄胸而长腰的厚软羽躯", covert, [0, 0.335, -0.025], [0.28, 0.44, 0.29]), lobe("乌林鸮几乎无颈界线的特大无耳簇圆头", feather, [0, 0.625, 0.065], [0.34, 0.315, 0.235])];
  for (const side of [-1, 1]) {
    parts.push(lobe("乌林鸮真实凹浅而宽大的正向面盘", pale, [side * 0.076, 0.635, 0.157], [0.17, 0.235, 0.045]), lobe("与面盘相比显得很小的正面眼", dark, [side * 0.062, 0.655, 0.183], [0.038, 0.038, 0.018]));
    const rims: ModelPart[] = [];
    for (let ring = 0; ring < 2; ring++) for (let index = 0; index < 17; index++) { const angle = index / 17 * Math.PI * 2; rims.push(leaf("围绕眼部逐层相叠而非机械圆环的短面羽", feather, [side * 0.076 + Math.cos(angle) * (0.055 + ring * 0.017), 0.635 + Math.sin(angle) * (0.075 + ring * 0.022), 0.179 - ring * 0.005], 0.012, 0.027, [0, 0, angle * 180 / Math.PI - 90])); }
    parts.push(combineMeshes("乌林鸮大圆面盘实际成圈排列的短羽缘", feather, rims), lobe("乌林鸮覆盖跗蹠的松软羽靴", pale, [side * 0.066, 0.102, 0.016], [0.071, 0.14, 0.08]));
  }
  parts.push(tapered("乌林鸮藏在面盘中线下方的小弯嘴", bare, [[0, 0.637, 0.183], [0, 0.606, 0.214], [0, 0.58, 0.196]], [0.015, 0.01, 0.001]));
  foldedWings(parts, [0, 0.42, -0.025], 0.29, 0.34);
  tail(parts, [0, 0.185, -0.145], 0.19, 0.34, -101);
  talonFeet(parts, [0, 0.088, 0.022], 0.065, 0.011, 0.061, true);
  return parts;
}

// https://animaldiversity.org/accounts/Bubo_blakistoni/
function blakistonsFishOwl(): ModelPart[] {
  const parts: ModelPart[] = [lobe("毛腿渔鸮很宽而深重的捕鱼型胸躯", feather, [0, 0.31, -0.02], [0.38, 0.43, 0.35]), lobe("毛腿渔鸮宽而略扁且不形成特大圆面盘的头", feather, [0, 0.566, 0.063], [0.29, 0.25, 0.235])];
  for (const side of [-1, 1]) {
    parts.push(lobe("毛腿渔鸮松散而不成完整圆环的颊羽", pale, [side * 0.073, 0.557, 0.15], [0.12, 0.15, 0.045]), lobe("毛腿渔鸮较大的正向眼睛", dark, [side * 0.061, 0.584, 0.177], [0.046, 0.046, 0.021]), lobe("毛腿渔鸮仅遮到跗端的真实羽靴", pale, [side * 0.085, 0.124, 0.005], [0.092, 0.165, 0.102]));
    parts.push(combineMeshes("渔鸮宽厚而向外斜张的耳羽簇", covert, Array.from({ length: 5 }, (_, index) => leaf("渔鸮耳羽中完整宽羽片", covert, [side * (0.078 + index * 0.006), 0.653, 0.025], 0.039, 0.135 - index * 0.008, [-18, side * 12, -side * (18 + index * 4)]))));
  }
  parts.push(tapered("渔鸮明显露在面羽外的长而强弯嘴", bare, [[0, 0.562, 0.166], [0, 0.528, 0.224], [0, 0.486, 0.219], [0, 0.475, 0.201]], [0.025, 0.017, 0.009, 0.001]));
  foldedWings(parts, [0, 0.4, -0.025], 0.39, 0.34);
  tail(parts, [0, 0.185, -0.17], 0.2, 0.2, -104);
  talonFeet(parts, [0, 0.118, 0.027], 0.087, 0.022, 0.11, true);
  const scales: ModelPart[] = [];
  for (const side of [-1, 1]) for (let toe = -1; toe <= 1; toe += 2) for (let index = 0; index < 4; index++) scales.push(lobe("裸露捕鱼趾上凸起的真实硬鳞", bare, [side * 0.087 + toe * (0.01 + index * 0.0065), 0.025, 0.049 + index * 0.016], [0.016, 0.007, 0.011]));
  parts.push(combineMeshes("与羽靴相接但不被羽毛覆盖的粗鳞趾背", bare, scales));
  return parts;
}

export const birdExpansionBatchElevenDesigns: MasterNatureDesign[] = [
  design("goliathHeron", "巨鹭", "动物", () => calibrated(goliathHeron(), 0.97), ["Ardea goliath", "粗壮长折颈与巨矛喙", "高腿厚胸披羽"]),
  design("eurasianBittern", "大麻鳽", "动物", eurasianBittern, ["Botaurus stellaris", "厚颈与松长喉羽盾", "矮壮短腿麻鳽躯"]),
  design("agamiHeron", "栗腹鹭", "动物", () => calibrated(agamiHeron(), 0.95), ["Agamia agami", "细长折颈与长剑嘴", "短腿和细白枕羽"]),
  design("blackCrownedNightHeron", "夜鹭", "动物", blackCrownedNightHeron, ["Nycticorax nycticorax", "宽肩短颈大头", "粗嘴和细后枕饰羽"]),
  design("giantIbis", "巨鹮", "动物", () => calibrated(giantIbis(), 0.9), ["Thaumatibis gigantea", "Pseudibis gigantea", "有鳞裸颈长缓弯重喙"]),
  design("greatGrebe", "巨䴙䴘", "动物", greatGrebe, ["Podiceps major", "重长舟躯粗颈短枕冠", "后位独立趾瓣足"]),
  design("westernGrebe", "西䴙䴘", "动物", westernGrebe, ["Aechmophorus occidentalis", "细长蛇颈和无双冠的窄头", "无外露长尾及趾瓣足"]),
  design("koriBustard", "灰颈鸨", "动物", koriBustard, ["Ardeotis kori", "柯利鸨", "低长重躯与长曲颈枕冠"]),
  design("greatGrayOwl", "乌林鸮", "动物", greatGrayOwl, ["Strix nebulosa", "特大无耳簇圆面盘与小眼", "长躯长尾羽靴"]),
  design("blakistonsFishOwl", "毛腿渔鸮", "动物", () => calibrated(blakistonsFishOwl(), 0.91), ["Ketupa blakistoni", "Bubo blakistoni", "重胸长钩喙斜耳簇及粗鳞裸趾"]),
];
