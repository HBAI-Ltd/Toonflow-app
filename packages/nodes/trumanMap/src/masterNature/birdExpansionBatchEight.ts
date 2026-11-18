import { combineMeshes, design, leaf, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { calibrated, feet, foldedWings, head, tail } from "./birdExpansionBatchOne";
import { talonFeet } from "./birdExpansionBatchFive";

const feather = "#a8b39b";
const covert = "#839582";
const pale = "#cbd0b7";
const bare = "#b4a68d";
const dark = "#596a5d";

// https://animaldiversity.org/accounts/Jabiru_mycteria/
function jabiru(): ModelPart[] {
  const parts: ModelPart[] = [lobe("裸颈鹳宽大而深腹的白羽躯", pale, [0, 0.66, -0.035], [0.42, 0.48, 0.61]), tapered("裸颈鹳明显粗于其他涉禽的长裸颈", dark, [[0, 0.81, 0.185], [0, 1.01, 0.23], [0, 1.17, 0.3]], [0.105, 0.077, 0.055])];
  head(parts, [0, 1.235, 0.35], [0.15, 0.17, 0.2], dark);
  parts.push(body("裸颈鹳宽基并逐渐向上翘的粗长嘴", [[0.42, 1.213, 0.04, 0.051], [0.57, 1.213, 0.032, 0.045], [0.7, 1.238, 0.019, 0.024], [0.76, 1.264, 0.002, 0.003]], bare), lobe("喉颈基部与胸部相连的裸皮喉囊", "#b38b7b", [0, 0.88, 0.23], [0.17, 0.18, 0.14]));
  foldedWings(parts, [0, 0.73, -0.04], 0.43, 0.48);
  tail(parts, [0, 0.49, -0.28], 0.22, 0.21, -108);
  feet(parts, [0, 0.48, 0.015], 0.092, 0.017, 0.155);
  return parts;
}

// https://www.allaboutbirds.org/guide/Wood_Stork/id
function woodStork(): ModelPart[] {
  const parts: ModelPart[] = [lobe("林鹳橄榄球状的深胸横长躯", pale, [0, 0.65, -0.035], [0.34, 0.41, 0.54]), tapered("林鹳缩入肩前再抬起的裸颈", dark, [[0, 0.79, 0.15], [0, 0.92, 0.19], [0, 1.045, 0.27]], [0.055, 0.039, 0.032])];
  head(parts, [0, 1.09, 0.31], [0.11, 0.125, 0.155], dark);
  parts.push(tapered("林鹳厚基而连续下弯的长喙", bare, [[0, 1.076, 0.367], [0, 1.07, 0.47], [0, 1.033, 0.557], [0, 0.973, 0.59]], [0.031, 0.024, 0.014, 0.0015]));
  const scales: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 9; index++) scales.push(lobe("裸头表面确实隆起的粗糙角质鳞片", dark, [side * 0.043, 1.055 + index % 3 * 0.017, 0.28 + Math.floor(index / 3) * 0.022], [0.014, 0.021, 0.022]));
  parts.push(combineMeshes("左右裸头粗鳞区", dark, scales));
  foldedWings(parts, [0, 0.71, -0.035], 0.35, 0.44);
  tail(parts, [0, 0.5, -0.25], 0.18, 0.17, -111);
  feet(parts, [0, 0.49, 0.015], 0.073, 0.014, 0.125);
  return parts;
}

// https://www.pref.ishikawa.jp/sizen/toki/en/toki/index.html
function crestedIbis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("朱鹮略有高肩的白羽横长躯", pale, [0, 0.35, -0.025], [0.245, 0.3, 0.39]), tapered("朱鹮弯举的有羽细颈", pale, [[0, 0.45, 0.115], [0, 0.57, 0.15], [0, 0.67, 0.21]], [0.043, 0.031, 0.024])];
  head(parts, [0, 0.711, 0.245], [0.09, 0.1, 0.125], pale);
  parts.push(tapered("朱鹮纤长而连续下弯的探食嘴", bare, [[0, 0.7, 0.292], [0, 0.688, 0.37], [0, 0.653, 0.442], [0, 0.596, 0.48]], [0.012, 0.009, 0.005, 0.0008]));
  for (const side of [-1, 1]) parts.push(lobe("头部下前侧与眼周裸露的颊皮", "#b68d7c", [side * 0.036, 0.698, 0.275], [0.008, 0.05, 0.055]));
  parts.push(combineMeshes("后枕向下披垂的密集白色长冠羽", pale, Array.from({ length: 11 }, (_, index) => leaf("后枕独立披针长羽", pale, [(index - 5) * 0.0045, 0.749, 0.218], 0.015, 0.17 + index % 3 * 0.015, [-124, (index - 5) * 5, 0]))));
  foldedWings(parts, [0, 0.4, -0.025], 0.25, 0.34);
  tail(parts, [0, 0.26, -0.18], 0.12, 0.14, -111);
  feet(parts, [0, 0.245, 0.015], 0.056, 0.009, 0.078);
  return parts;
}

// https://www.fws.gov/species/great-curassow-crax-rubra
function greatCurassow(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大凤冠雉厚胸长腹的地栖躯", covert, [0, 0.34, -0.035], [0.32, 0.4, 0.52]), tapered("凤冠雉上举的长羽颈", covert, [[0, 0.46, 0.15], [0, 0.61, 0.21]], [0.052, 0.036])];
  head(parts, [0, 0.66, 0.25], [0.105, 0.12, 0.14], covert);
  parts.push(tapered("凤冠雉短厚下钩嘴", bare, [[0, 0.647, 0.3], [0, 0.635, 0.355], [0, 0.608, 0.359]], [0.018, 0.013, 0.001]), lobe("喙基上方圆球状的肉质鼻瘤", bare, [0, 0.682, 0.309], [0.045, 0.055, 0.047]));
  parts.push(combineMeshes("每根都卷曲而不是直尖叶的凤冠", covert, Array.from({ length: 8 }, (_, index) => { const x = (index - 3.5) * 0.006; return tapered("卷曲成弧的冠羽轴", covert, [[x, 0.708, 0.235], [x, 0.753, 0.225], [x, 0.773, 0.2], [x, 0.755, 0.18], [x, 0.731, 0.195]], [0.0034, 0.003, 0.0025, 0.002, 0.0012]); })));
  foldedWings(parts, [0, 0.41, -0.035], 0.33, 0.37);
  tail(parts, [0, 0.25, -0.24], 0.23, 0.34, -103);
  feet(parts, [0, 0.205, 0.015], 0.08, 0.015, 0.1);
  return parts;
}

function hornedGuan(): ModelPart[] {
  const parts: ModelPart[] = [lobe("角冠雉窄肩而长腹的林栖躯", covert, [0, 0.35, -0.035], [0.27, 0.34, 0.48]), tapered("角冠雉前举的细长羽颈", covert, [[0, 0.46, 0.135], [0, 0.62, 0.18]], [0.043, 0.031])];
  head(parts, [0, 0.666, 0.22], [0.095, 0.12, 0.135], covert);
  parts.push(tapered("角冠雉细长而微下曲的浅色喙", pale, [[0, 0.653, 0.267], [0, 0.64, 0.327], [0, 0.623, 0.337]], [0.014, 0.01, 0.001]), part("额顶真正圆柱状而非尖羽的裸角", "lathe", "#b48a79", [0, 0.711, 0.225], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.016, y: 0.003 }, { x: 0.014, y: 0.072 }, { x: 0.009, y: 0.087 }, { x: 0, y: 0.091 }] }));
  foldedWings(parts, [0, 0.405, -0.03], 0.28, 0.35);
  tail(parts, [0, 0.25, -0.22], 0.16, 0.39, -101);
  feet(parts, [0, 0.21, 0.015], 0.067, 0.012, 0.085);
  return parts;
}

// https://blog.wcs.org/photo/2018/11/30/seeing-more-imaging-technology-maleo/
function maleo(): ModelPart[] {
  const parts: ModelPart[] = [lobe("苏拉冢雉深腹而直立的地栖躯", feather, [0, 0.25, -0.025], [0.25, 0.31, 0.35]), tapered("冢雉前胸有裸皮的短粗颈", bare, [[0, 0.36, 0.12], [0, 0.47, 0.16]], [0.036, 0.025])];
  head(parts, [0, 0.51, 0.19], [0.087, 0.1, 0.115], bare);
  parts.push(tapered("苏拉冢雉厚基短嘴", bare, [[0, 0.5, 0.232], [0, 0.488, 0.289]], [0.017, 0.001]), lobe("头顶向后隆起的圆骨盔而非尖刺", dark, [0, 0.574, 0.175], [0.075, 0.095, 0.104]));
  foldedWings(parts, [0, 0.3, -0.025], 0.26, 0.29);
  tail(parts, [0, 0.19, -0.165], 0.13, 0.12, -106);
  feet(parts, [0, 0.155, 0.015], 0.065, 0.017, 0.115);
  return parts;
}

// https://animals.sandiegozoo.org/animals/australian-brush-turkey-0
function australianBrushTurkey(): ModelPart[] {
  const parts: ModelPart[] = [lobe("丛冢雉长腹而侧扁的地栖躯", covert, [0, 0.3, -0.03], [0.33, 0.36, 0.47]), tapered("丛冢雉向上伸出的长裸颈", "#b28e7e", [[0, 0.41, 0.14], [0, 0.56, 0.18], [0, 0.64, 0.21]], [0.038, 0.027, 0.021])];
  head(parts, [0, 0.675, 0.23], [0.08, 0.09, 0.11], "#b28e7e");
  parts.push(tapered("丛冢雉尖短的硬喙", bare, [[0, 0.664, 0.27], [0, 0.655, 0.327]], [0.013, 0.001]), lobe("裸颈下部横向围起的软肉领", bare, [0, 0.548, 0.188], [0.1, 0.072, 0.09]));
  foldedWings(parts, [0, 0.355, -0.035], 0.34, 0.34);
  parts.push(combineMeshes("沿身体纵向侧扁直立而非横向开屏的尾扇", covert, Array.from({ length: 11 }, (_, index) => leaf("侧扁尾面上的长尾羽", covert, [0, 0.24, -0.19], 0.045, 0.38 - Math.abs(index - 5) * 0.009, [0, 90, 12 + index * 8]))));
  feet(parts, [0, 0.19, 0.005], 0.077, 0.018, 0.13);
  return parts;
}

// https://cms.zsl.org/sites/default/files/2023-02/ZSL%20National%20Red%20List%20of%20Nepal%E2%80%99s%20Birds%20Volume%202%202016.pdf
function ibisbill(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鹮嘴鹬短腿上的圆肩矮身", feather, [0, 0.18, -0.025], [0.17, 0.21, 0.28]), lobe("与肩部直接相连的短粗颈", pale, [0, 0.27, 0.07], [0.1, 0.15, 0.11])];
  head(parts, [0, 0.34, 0.12], [0.095, 0.1, 0.115], covert);
  parts.push(tapered("远长于头部且连续向下弯的细探嘴", bare, [[0, 0.33, 0.161], [0, 0.319, 0.225], [0, 0.282, 0.288], [0, 0.229, 0.323]], [0.01, 0.0075, 0.0045, 0.0007]));
  foldedWings(parts, [0, 0.22, -0.025], 0.18, 0.23);
  tail(parts, [0, 0.13, -0.14], 0.1, 0.11, -107);
  feet(parts, [0, 0.1, 0.005], 0.045, 0.0065, 0.052, { hindToe: false });
  return parts;
}

function greatSkua(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大贼鸥粗壮而短宽的海鸟躯", covert, [0, 0.24, -0.025], [0.23, 0.28, 0.35]), lobe("贼鸥粗厚的短羽颈", covert, [0, 0.354, 0.09], [0.12, 0.15, 0.12])];
  head(parts, [0, 0.423, 0.145], [0.12, 0.13, 0.155], covert);
  parts.push(tapered("贼鸥头前粗强而明显钩下的嘴", bare, [[0, 0.407, 0.204], [0, 0.394, 0.272], [0, 0.355, 0.281]], [0.024, 0.017, 0.001]));
  for (const side of [-1, 1]) {
    parts.push(membrane("贼鸥宽而略圆的强健海上飞翼", covert, [[side * 0.08, 0.31, 0.06], [side * 0.3, 0.41, 0.11], [side * 0.59, 0.36, -0.06], [side * 0.68, 0.28, -0.16], [side * 0.51, 0.19, -0.29], [side * 0.1, 0.17, -0.17]]));
    parts.push(combineMeshes("宽翼端和后缘的飞羽", covert, Array.from({ length: 9 }, (_, index) => leaf("贼鸥强翼的宽羽", covert, [side * (0.11 + index * 0.059), 0.29 + Math.sin(index / 8 * Math.PI) * 0.055, -0.015 - index * 0.012], 0.064, 0.24 - index * 0.008, [-115, -side * index * 3, 0]))));
  }
  tail(parts, [0, 0.15, -0.17], 0.13, 0.12, -108);
  feet(parts, [0, 0.14, 0.005], 0.06, 0.009, 0.077, { web: 0.92 });
  return parts;
}

function cuckooRoller(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鹃䴕长而圆满的树栖身躯", feather, [0, 0.2, -0.025], [0.15, 0.23, 0.29]), lobe("鹃䴕短而不突出的羽颈", feather, [0, 0.316, 0.065], [0.11, 0.14, 0.12])];
  head(parts, [0, 0.389, 0.1], [0.135, 0.14, 0.17]);
  parts.push(body("大头前部深基而渐收尖的宽嘴", [[0.16, 0.372, 0.024, 0.031], [0.222, 0.367, 0.019, 0.025], [0.269, 0.348, 0.003, 0.004]], bare));
  foldedWings(parts, [0, 0.26, -0.025], 0.16, 0.25);
  tail(parts, [0, 0.13, -0.14], 0.11, 0.18, -103);
  talonFeet(parts, [0, 0.095, 0.005], 0.037, 0.006, 0.039, true);
  return parts;
}

export const birdExpansionBatchEightDesigns: MasterNatureDesign[] = [
  design("jabiru", "裸颈鹳", "动物", jabiru, ["Jabiru mycteria", "上翘粗长嘴", "粗裸颈基部喉囊"]),
  design("woodStork", "林鹳", "动物", woodStork, ["Mycteria americana", "裸头粗鳞面", "厚基下弯长喙"]),
  design("crestedIbis", "朱鹮", "动物", crestedIbis, ["Nipponia nippon", "后枕长白冠羽", "有羽细颈与弯探嘴"]),
  design("greatCurassow", "大凤冠雉", "动物", greatCurassow, ["Crax rubra", "真卷曲冠羽", "鼻瘤与长圆尾"]),
  design("hornedGuan", "角冠雉", "动物", () => calibrated(hornedGuan(), 0.9), ["Oreophasis derbianus", "额顶裸圆柱角", "窄肩长尾"]),
  design("maleo", "苏拉冢雉", "动物", maleo, ["Macrocephalon maleo", "圆骨盔", "掘土强足"]),
  design("australianBrushTurkey", "澳洲丛冢雉", "动物", australianBrushTurkey, ["Alectura lathami", "侧扁直立纵向尾扇", "裸颈肉领"]),
  design("ibisbill", "鹮嘴鹬", "动物", () => calibrated(ibisbill(), 0.7), ["Ibidorhyncha struthersii", "短腿圆肩", "长弯细嘴"]),
  design("greatSkua", "大贼鸥", "动物", greatSkua, ["Stercorarius skua", "Catharacta skua", "粗强钩喙与宽海翼"]),
  design("cuckooRoller", "鹃䴕", "动物", () => calibrated(cuckooRoller(), 0.8), ["Leptosomus discolor", "大头短颈长躯", "对趾树栖足"]),
];
