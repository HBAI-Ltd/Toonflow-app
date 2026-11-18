import { combineMeshes, design, leaf, lobe, needle, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { feet, foldedWings, head, tail } from "./birdExpansionBatchOne";

const feather = "#a3af96";
const covert = "#829280";
const pale = "#cbd0b8";
const bare = "#b4a68e";
const dark = "#59685c";

// https://nationalzoo.si.edu/animals/emu
// https://animals.sandiegozoo.org/animals/emu
function emu(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鸸鹋沉重而有下垂臀羽的卵形躯", feather, [0, 1.02, -0.03], [0.75, 0.95, 1.04]), tapered("鸸鹋有疏羽的长颈与上部裸颈", covert, [[0, 1.28, 0.25], [0, 1.52, 0.31], [0, 1.73, 0.42], [0, 1.83, 0.48]], [0.105, 0.07, 0.052, 0.045])];
  head(parts, [0, 1.88, 0.51], [0.17, 0.18, 0.21]);
  parts.push(body("鸸鹋不具骨盔的低平短喙", [[0.58, 1.85, 0.035, 0.025], [0.66, 1.84, 0.025, 0.018], [0.71, 1.835, 0.005, 0.006]], bare));
  for (const side of [-1, 1]) parts.push(lobe("藏在体羽内的极小退化翼", covert, [side * 0.32, 1.13, 0.03], [0.08, 0.15, 0.18]));
  const hairFeathers: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 14; index++) {
    const z = 0.28 - index * 0.045, y = 1.12 - Math.max(0, index - 5) * 0.015;
    for (const fork of [-1, 1]) hairFeathers.push(leaf("同毛囊发出的双轴披散体羽", feather, [side * 0.27, y, z], 0.018, 0.31 + index % 3 * 0.035, [145, side * (index % 3 * 12 + fork * 8), side * 6]));
  }
  for (let index = 0; index < hairFeathers.length; index += 28) parts.push(combineMeshes("完整双轴疏羽外缘", feather, hairFeathers.slice(index, index + 28)));
  feet(parts, [0, 0.84, 0.03], 0.19, 0.035, 0.23, { hindToe: false });
  return parts;
}

// https://www.nationalzoo.si.edu/animals/greater-rhea
function greaterRhea(): ModelPart[] {
  const parts: ModelPart[] = [lobe("美洲鸵宽腹而没有外露尾羽的卵形躯", feather, [0, 0.82, -0.015], [0.68, 0.77, 0.85]), tapered("美洲鸵从肩部连续有羽的细长颈", feather, [[0, 1.04, 0.22], [0, 1.29, 0.27], [0, 1.48, 0.35]], [0.075, 0.048, 0.039])];
  head(parts, [0, 1.555, 0.39], [0.15, 0.17, 0.2]);
  parts.push(body("美洲鸵宽基而低平的短喙", [[0.45, 1.53, 0.029, 0.023], [0.52, 1.52, 0.022, 0.016], [0.56, 1.515, 0.005, 0.005]], bare));
  for (const side of [-1, 1]) {
    parts.push(lobe("与鸸鹋小残翼不同的发达翼臂", pale, [side * 0.29, 0.99, 0.02], [0.22, 0.25, 0.56]), combineMeshes("大翼自然下垂的长软羽缘", pale, Array.from({ length: 17 }, (_, index) => leaf("可见分离边缘的美洲鸵长翼羽", pale, [side * (0.26 + index % 3 * 0.018), 0.99 - index % 3 * 0.01, 0.18 - index * 0.026], 0.042, 0.43 + index % 4 * 0.028, [145, side * (index * 3 - 20), side * 12]))));
  }
  feet(parts, [0, 0.64, 0.02], 0.17, 0.03, 0.21, { hindToe: false });
  return parts;
}

// https://animals.sandiegozoo.org/animals/hornbill
function southernGroundHornbill(): ModelPart[] {
  const parts: ModelPart[] = [lobe("地犀鸟高腿上的厚重地栖胸躯", covert, [0, 0.48, -0.015], [0.33, 0.44, 0.53]), tapered("地犀鸟短粗的前举颈", covert, [[0, 0.61, 0.16], [0, 0.79, 0.21]], [0.075, 0.047])];
  head(parts, [0, 0.86, 0.26], [0.16, 0.18, 0.21], covert);
  parts.push(tapered("地犀鸟粗长下弯而非高骨盔的大喙", dark, [[0, 0.84, 0.33], [0, 0.83, 0.47], [0, 0.78, 0.59], [0, 0.72, 0.63]], [0.052, 0.041, 0.025, 0.003]), lobe("下颌与前颈连续的裸皮喉囊", "#b78b79", [0, 0.715, 0.257], [0.12, 0.17, 0.07]));
  const lashes: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 5; index++) lashes.push(needle("眼上真正离开眼缘的长睫羽", dark, [side * 0.063, 0.89, 0.295 + index * 0.004], [side * 0.08, 0.918 + index % 2 * 0.006, 0.3 + index * 0.005], 0.002));
  parts.push(combineMeshes("两眼上方独立睫毛羽", dark, lashes));
  foldedWings(parts, [0, 0.55, -0.02], 0.34, 0.43);
  tail(parts, [0, 0.37, -0.24], 0.18, 0.27, -104);
  feet(parts, [0, 0.31, 0.02], 0.082, 0.018, 0.12);
  return parts;
}

// https://animals.sandiegozoo.org/animals/andean-condor
function andeanCondor(): ModelPart[] {
  const parts: ModelPart[] = [lobe("神鹫深胸而短尾的巨大躯", covert, [0, 0.5, -0.04], [0.47, 0.57, 0.64]), tapered("神鹫高于羽领的裸露颈", bare, [[0, 0.68, 0.17], [0, 0.84, 0.22]], [0.061, 0.038])];
  head(parts, [0, 0.89, 0.26], [0.12, 0.15, 0.16], bare);
  parts.push(tapered("神鹫厚基与尖锐下钩的嘴", pale, [[0, 0.87, 0.31], [0, 0.85, 0.4], [0, 0.797, 0.42]], [0.032, 0.022, 0.0015]), lobe("雄神鹫冠顶而非头后羽冠的肉质冠", bare, [0, 0.98, 0.26], [0.027, 0.12, 0.15]), lobe("神鹫裸颈前侧下垂肉垂", bare, [0, 0.797, 0.254], [0.055, 0.14, 0.04]));
  parts.push(combineMeshes("环绕裸颈的蓬松白色羽领", pale, Array.from({ length: 15 }, (_, index) => { const angle = index * Math.PI * 2 / 15; return lobe("羽领中的实体羽簇", pale, [Math.cos(angle) * 0.073, 0.721 + Math.sin(angle) * 0.014, 0.175 + Math.sin(angle) * 0.057], [0.048, 0.065, 0.045]); })));
  for (const side of [-1, 1]) {
    parts.push(membrane("肩部到腕部完整连续的宽大神鹫翼", covert, [[side * 0.17, 0.63, 0.1], [side * 0.66, 0.77, 0.13], [side * 1.26, 0.79, -0.04], [side * 1.43, 0.68, -0.2], [side * 1.02, 0.54, -0.44], [side * 0.45, 0.43, -0.35], [side * 0.15, 0.43, -0.24]]));
    parts.push(combineMeshes("神鹫宽翼尾缘相叠的次级飞羽", covert, Array.from({ length: 12 }, (_, index) => leaf("中翼次级飞羽", covert, [side * (0.24 + index * 0.075), 0.58 + index * 0.012, -0.05 - index * 0.008], 0.115, 0.42 - index * 0.009, [-110, -side * index * 2, 0]))));
    parts.push(combineMeshes("翼端清晰分开的宽指状初级飞羽", covert, Array.from({ length: 7 }, (_, index) => leaf("扇开而非一块三角片的指状翼尖", covert, [side * (1.04 + index * 0.057), 0.74 - index * 0.009, -0.09 - index * 0.008], 0.105, 0.39 - index * 0.025, [-103, -side * (index * 7 + 10), 0]))));
  }
  tail(parts, [0, 0.31, -0.27], 0.22, 0.24, -110);
  feet(parts, [0, 0.29, 0.025], 0.09, 0.022, 0.115);
  return parts;
}

// https://iucnhornbills.org/helmeted-hornbill/
function helmetedHornbill(): ModelPart[] {
  const parts: ModelPart[] = [lobe("盔犀鸟宽胸与高肩的树栖躯", covert, [0, 0.36, -0.025], [0.3, 0.39, 0.47]), tapered("盔犀鸟明显裸露而粗大的颈", "#b49684", [[0, 0.45, 0.14], [0, 0.62, 0.17]], [0.072, 0.06])];
  head(parts, [0, 0.68, 0.22], [0.16, 0.19, 0.21]);
  parts.push(body("相对短的下弯上喙", [[0.28, 0.655, 0.045, 0.038], [0.4, 0.64, 0.031, 0.028], [0.46, 0.6, 0.002, 0.003]], pale), body("前部高而平截的实心角质盔突", [[0.19, 0.765, 0.053, 0.074], [0.31, 0.765, 0.056, 0.076], [0.359, 0.755, 0.052, 0.066]], bare));
  foldedWings(parts, [0, 0.42, -0.02], 0.3, 0.37);
  tail(parts, [0, 0.25, -0.21], 0.19, 0.32, -98);
  parts.push(combineMeshes("比周围尾羽明显长出的两枚中央尾羽", pale, [-1, 1].map(side => leaf("盔犀鸟延长的中央尾羽", pale, [side * 0.018, 0.25, -0.21], 0.07, 0.77, [-98, side * 2, 0]))));
  feet(parts, [0, 0.18, 0.015], 0.07, 0.015, 0.095);
  return parts;
}

// https://www.gardensbythebay.com.sg/en/learn-with-us/explore-resources/whats-visiting/asian-openbill.html
function asianOpenbill(): ModelPart[] {
  const parts: ModelPart[] = [lobe("钳嘴鹳高腿上的短宽涉禽躯", pale, [0, 0.365, -0.015], [0.235, 0.29, 0.37]), tapered("钳嘴鹳不折回肩后的上举颈", pale, [[0, 0.46, 0.12], [0, 0.62, 0.16], [0, 0.7, 0.21]], [0.046, 0.033, 0.025])];
  head(parts, [0, 0.74, 0.235], [0.095, 0.11, 0.13]);
  parts.push(tapered("上喙长轴与末端下曲尖", bare, [[0, 0.729, 0.278], [0, 0.726, 0.36], [0, 0.71, 0.43], [0, 0.685, 0.477]], [0.017, 0.014, 0.009, 0.001]), tapered("中段向下弧曲形成真实贯通钳嘴空隙的下颌", bare, [[0, 0.704, 0.278], [0, 0.67, 0.35], [0, 0.662, 0.419], [0, 0.684, 0.476]], [0.014, 0.011, 0.007, 0.001]));
  foldedWings(parts, [0, 0.408, -0.02], 0.24, 0.3);
  parts.push(combineMeshes("中央略分叉的鹳形短尾", covert, [-1, 1].map(side => leaf("分叉尾羽叶", covert, [side * 0.028, 0.27, -0.15], 0.075, 0.13, [-108, -side * 12, 0]))));
  feet(parts, [0, 0.255, 0.02], 0.052, 0.0095, 0.085);
  return parts;
}

// https://visit.museum.wa.gov.au/learn/news-stories/have-egg-will-travel
function elephantBird(): ModelPart[] {
  const parts: ModelPart[] = [lobe("象鸟异常宽大而前重的桶形腹躯", feather, [0, 1.29, -0.045], [1.2, 1.65, 1.6]), tapered("象鸟粗壮并逐渐收细的长颈", feather, [[0, 1.72, 0.39], [0, 2.08, 0.47], [0, 2.4, 0.56], [0, 2.56, 0.64]], [0.23, 0.16, 0.105, 0.085])];
  head(parts, [0, 2.64, 0.7], [0.29, 0.3, 0.36]);
  parts.push(body("象鸟短而坚实的平缓锥喙", [[0.83, 2.59, 0.066, 0.062], [0.98, 2.57, 0.04, 0.044], [1.06, 2.55, 0.006, 0.007]], bare));
  for (const side of [-1, 1]) parts.push(lobe("藏在巨大躯侧的退化残翼", covert, [side * 0.52, 1.45, 0.03], [0.13, 0.22, 0.25]));
  const bodyFeathers = Array.from({ length: 22 }, (_, index) => { const side = index % 2 ? -1 : 1, row = Math.floor(index / 2); return leaf("象鸟躯侧疏松的低垂羽束", feather, [side * 0.48, 1.47 - row % 3 * 0.06, 0.35 - row * 0.067], 0.075, 0.43 + row % 3 * 0.04, [145, side * row * 5, 0]); });
  parts.push(combineMeshes("完整而不增加躯体数量的象鸟羽缘", feather, bodyFeathers));
  feet(parts, [0, 0.95, 0.035], 0.29, 0.075, 0.36, { hindToe: false });
  return parts;
}

// https://www.nzbirdsonline.org.nz/species/south-island-giant-moa
function southIslandGiantMoa(): ModelPart[] {
  const parts: ModelPart[] = [lobe("巨恐鸟相对纤细而有高髋的躯体", feather, [0, 1.48, -0.035], [0.87, 1.08, 1.23]), tapered("巨恐鸟有多节弯曲的异常长颈", feather, [[0, 1.78, 0.33], [0, 2.08, 0.42], [0, 2.48, 0.48], [0, 2.84, 0.63], [0, 3.12, 0.78]], [0.145, 0.108, 0.08, 0.063, 0.051])];
  head(parts, [0, 3.22, 0.84], [0.255, 0.2, 0.32]);
  parts.push(body("巨恐鸟横宽扁平且微下曲的喙", [[0.96, 3.18, 0.07, 0.034], [1.08, 3.17, 0.055, 0.024], [1.15, 3.14, 0.012, 0.006]], bare));
  const mantle = Array.from({ length: 20 }, (_, index) => { const side = index % 2 ? -1 : 1, row = Math.floor(index / 2); return leaf("不具有前肢翼面的恐鸟粗疏体羽", covert, [side * 0.34, 1.59 - row % 3 * 0.045, 0.3 - row * 0.07], 0.055, 0.33 + row % 3 * 0.035, [147, side * row * 3, 0]); });
  parts.push(combineMeshes("无翼躯体上的完整羽缘", covert, mantle));
  feet(parts, [0, 1.16, 0.035], 0.23, 0.056, 0.33, { hindToe: false });
  return parts;
}

export function broadToedFeet(parts: ModelPart[], hipHeight: number, gap: number, thickness: number, toeLength: number) {
  for (const side of [-1, 1]) {
    const ankle: Triple = [side * gap, thickness * 0.7, 0.045];
    parts.push(tapered("巨鸟粗壮下肢与宽大的跗蹠", bare, [[side * gap * 0.82, hipHeight, 0.02], [side * gap, hipHeight * 0.56, -0.1], ankle], [thickness * 1.45, thickness, thickness * 0.82]));
    const toes: ModelPart[] = [];
    for (let index = -1; index <= 1; index++) {
      const end: Triple = [ankle[0] + index * toeLength * 0.39, thickness * 0.34, ankle[2] + toeLength * (index ? 0.83 : 1)];
      toes.push(tapered("三枚粗短而宽的承重足趾", bare, [ankle, [end[0] * 0.6 + ankle[0] * 0.4, end[1] * 1.15, end[2] - toeLength * 0.22], end], [thickness * 0.68, thickness * 0.48, thickness * 0.4]), lobe("趾端钝宽的蹄状角质甲而非猛禽钩爪", dark, [end[0], end[1] * 0.76, end[2] + thickness * 0.22], [thickness * 1.05, thickness * 0.65, thickness * 1.18]));
    }
    parts.push(combineMeshes("完整的三趾宽足与蹄状趾甲", bare, toes));
  }
}

// https://australian.museum/learn/australia-over-time/extinct-animals/dromornis-stirtoni/
function stirtonsThunderbird(): ModelPart[] {
  const parts: ModelPart[] = [lobe("史氏雷鸟非常厚重的深腹宽髋躯", feather, [0, 1.32, -0.045], [1.3, 1.6, 1.62]), tapered("雷鸟支撑巨型深喙头部的短粗颈", feather, [[0, 1.77, 0.39], [0, 2.14, 0.51], [0, 2.48, 0.67]], [0.265, 0.22, 0.16])];
  head(parts, [0, 2.69, 0.79], [0.47, 0.5, 0.5]);
  parts.push(body("雷鸟高而侧扁的巨大上颌", [[0.94, 2.73, 0.13, 0.238], [1.19, 2.72, 0.13, 0.26], [1.4, 2.67, 0.085, 0.19], [1.49, 2.58, 0.008, 0.06]], bare), body("与深上喙相配的厚重下颌", [[0.97, 2.46, 0.12, 0.07], [1.22, 2.44, 0.1, 0.075], [1.45, 2.49, 0.02, 0.022]], pale));
  for (const side of [-1, 1]) parts.push(lobe("雷鸟躯侧短而退化的残翼", covert, [side * 0.57, 1.5, 0.03], [0.15, 0.23, 0.31]));
  parts.push(combineMeshes("雷鸟后腹的短羽束", covert, Array.from({ length: 12 }, (_, index) => leaf("厚躯后缘短羽", covert, [(index - 5.5) * 0.054, 1.36, -0.6], 0.09, 0.3 + index % 3 * 0.03, [151, (index - 5.5) * 4, 0]))));
  broadToedFeet(parts, 0.94, 0.3, 0.092, 0.32);
  return parts;
}

// 头部采用2024年新颅骨研究的高上颌、宽口缘轮廓，不沿用旧式尖细鸸鹋嘴。
// https://doi.org/10.1080/08912963.2024.2308212
function newtonsGiantBird(): ModelPart[] {
  const parts: ModelPart[] = [lobe("牛顿巨鸟短腿之上的宽阔重躯", feather, [0, 0.99, -0.045], [1.02, 1.15, 1.28]), tapered("牛顿巨鸟较短而粗壮的前举颈", feather, [[0, 1.31, 0.32], [0, 1.63, 0.4], [0, 1.93, 0.51]], [0.18, 0.13, 0.105])];
  head(parts, [0, 2.03, 0.61], [0.36, 0.35, 0.4]);
  parts.push(body("牛顿巨鸟高而宽的鹅形上喙", [[0.75, 2.025, 0.118, 0.122], [0.91, 2.02, 0.11, 0.105], [1.01, 1.974, 0.052, 0.052], [1.05, 1.94, 0.009, 0.012]], bare), body("牛顿巨鸟深而宽的完整下颌", [[0.74, 1.876, 0.108, 0.055], [0.9, 1.87, 0.095, 0.055], [1.035, 1.914, 0.022, 0.016]], pale));
  for (const side of [-1, 1]) parts.push(lobe("很小且不具展开飞羽的退化前翼", covert, [side * 0.44, 1.13, 0.03], [0.12, 0.18, 0.22]));
  parts.push(combineMeshes("巨鸟腰后连贯的短羽束", covert, Array.from({ length: 10 }, (_, index) => leaf("腰后粗短体羽", covert, [(index - 4.5) * 0.048, 1.02, -0.48], 0.078, 0.23 + index % 3 * 0.03, [148, (index - 4.5) * 5, 0]))));
  broadToedFeet(parts, 0.67, 0.25, 0.069, 0.265);
  return parts;
}

export const birdExpansionBatchThreeDesigns: MasterNatureDesign[] = [
  design("emu", "鸸鹋", "动物", emu, ["Dromaius novaehollandiae", "双轴疏松羽", "微小残翼与三前趾"]),
  design("greaterRhea", "大美洲鸵", "动物", greaterRhea, ["Rhea americana", "发达长翼无尾羽", "有羽长颈与三前趾"]),
  design("southernGroundHornbill", "南方地犀鸟", "动物", southernGroundHornbill, ["Bucorvus leadbeateri", "裸喉囊与长睫羽", "地栖大喙"]),
  design("andeanCondor", "安第斯神鹫", "动物", andeanCondor, ["Vultur gryphus", "肉冠裸颈与羽领", "宽大指状翼尖"]),
  design("helmetedHornbill", "盔犀鸟", "动物", helmetedHornbill, ["Rhinoplax vigil", "高实心角质盔突", "两枚延长中央尾羽"]),
  design("asianOpenbill", "钳嘴鹳", "动物", asianOpenbill, ["Anastomus oscitans", "闭嘴仍保留的真实钳形空隙", "长腿涉禽"]),
  design("elephantBird", "大象鸟", "动物", elephantBird, ["Aepyornis maximus", "灭绝鸟类简化形态复原", "宽重腹躯与粗足"]),
  design("southIslandGiantMoa", "南岛巨恐鸟", "动物", southIslandGiantMoa, ["Dinornis robustus", "灭绝鸟类简化形态复原", "无翼长颈扁平喙"]),
  design("stirtonsThunderbird", "史氏雷鸟", "动物", stirtonsThunderbird, ["Dromornis stirtoni", "灭绝鸟类简化形态复原", "巨大深喙与蹄状趾"]),
  design("newtonsGiantBird", "牛顿巨鸟", "动物", newtonsGiantBird, ["Genyornis newtoni", "灭绝鸟类简化形态复原", "高宽上颌与粗短足"]),
];
