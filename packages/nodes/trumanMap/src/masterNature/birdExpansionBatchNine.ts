import { combineMeshes, design, leaf, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { calibrated, feet, foldedWings, head, tail } from "./birdExpansionBatchOne";
import { talonFeet } from "./birdExpansionBatchFive";

const feather = "#a5b29a";
const covert = "#829582";
const pale = "#ccd0b9";
const bare = "#b3aa8c";
const dark = "#596b60";

// https://www.mnhn.fr/en/the-hyacinth-macaw
function hyacinthMacaw(): ModelPart[] {
  const parts: ModelPart[] = [lobe("紫蓝金刚长而直立的厚胸躯", covert, [0, 0.35, -0.035], [0.24, 0.43, 0.34]), lobe("金刚头部下方没有凤头冠的粗羽颈", covert, [0, 0.535, 0.065], [0.16, 0.22, 0.17])];
  head(parts, [0, 0.647, 0.103], [0.19, 0.21, 0.21], covert);
  parts.push(body("金刚极深厚的上颌与前端向内卷下的硬钩", [[0.17, 0.644, 0.044, 0.063], [0.23, 0.642, 0.041, 0.064], [0.277, 0.614, 0.026, 0.047], [0.282, 0.567, 0.009, 0.021], [0.26, 0.552, 0.0015, 0.002]], dark), body("与上喙钩端之间保留空隙的下颌", [[0.17, 0.578, 0.031, 0.024], [0.222, 0.576, 0.026, 0.022], [0.253, 0.587, 0.009, 0.009]], bare));
  for (const side of [-1, 1]) parts.push(lobe("下颌基部真实裸露的皮肤区", bare, [side * 0.04, 0.584, 0.174], [0.012, 0.037, 0.054]));
  foldedWings(parts, [0, 0.41, -0.04], 0.25, 0.39);
  parts.push(combineMeshes("中央两根明显延长并逐渐收尖的金刚尾", covert, Array.from({ length: 9 }, (_, index) => leaf("金刚细长而尖端的阶梯尾羽", covert, [(index - 4) * 0.01, 0.18, -0.175], 0.043, 0.57 - Math.abs(index - 4) * 0.063, [-98, -(index - 4) * 3.5, 0]))));
  talonFeet(parts, [0, 0.145, 0.025], 0.063, 0.013, 0.065, true);
  return parts;
}

// https://parrots.org/encyclopedia/pesquets-parrot/
function pesquetsParrot(): ModelPart[] {
  const parts: ModelPart[] = [lobe("彼氏鹦鹉窄肩而腹部丰满的长躯", covert, [0, 0.202, -0.025], [0.155, 0.25, 0.235]), tapered("彼氏鹦鹉向前抬头的有羽颈根", covert, [[0, 0.29, 0.05], [0, 0.35, 0.095]], [0.045, 0.032])];
  head(parts, [0, 0.391, 0.12], [0.091, 0.112, 0.133], dark);
  parts.push(tapered("裸脸前方纤长而突然向下弯的鹫状上喙", dark, [[0, 0.39, 0.17], [0, 0.38, 0.222], [0, 0.347, 0.235], [0, 0.335, 0.224]], [0.022, 0.017, 0.01, 0.001]), body("裸脸鹦鹉较短的下颌", [[0.163, 0.354, 0.016, 0.012], [0.207, 0.354, 0.009, 0.008], [0.22, 0.363, 0.001, 0.002]], bare));
  parts.push(combineMeshes("裸脸后面而非覆盖面部的短后枕羽缘", covert, Array.from({ length: 9 }, (_, index) => leaf("后枕羽和裸脸相交的清晰羽缘", covert, [(index - 4) * 0.006, 0.417, 0.087], 0.014, 0.052 + index % 2 * 0.008, [-135, (index - 4) * 5, 0]))));
  foldedWings(parts, [0, 0.256, -0.035], 0.16, 0.27);
  tail(parts, [0, 0.115, -0.13], 0.12, 0.16, -101);
  talonFeet(parts, [0, 0.09, 0.015], 0.041, 0.008, 0.037, true);
  return parts;
}

// https://www.zoonewengland.org/franklin-park-zoo/animals/birds/steller-s-sea-eagle/
function stellersSeaEagle(): ModelPart[] {
  const parts: ModelPart[] = [lobe("虎头海雕特别宽深而沉重的胸腹", covert, [0, 0.445, -0.04], [0.46, 0.61, 0.51]), lobe("虎头海雕撑起巨大颅喙的短粗颈", covert, [0, 0.695, 0.1], [0.25, 0.29, 0.27])];
  head(parts, [0, 0.855, 0.17], [0.245, 0.235, 0.265], covert);
  parts.push(body("虎头海雕显著高拱且大于其他鹰的深厚巨喙", [[0.264, 0.851, 0.048, 0.059], [0.335, 0.852, 0.043, 0.064], [0.388, 0.826, 0.029, 0.048], [0.397, 0.777, 0.013, 0.029], [0.377, 0.752, 0.0015, 0.002]], bare), body("海雕巨喙下缘独立的厚下颌", [[0.259, 0.784, 0.035, 0.023], [0.329, 0.784, 0.027, 0.02], [0.365, 0.796, 0.005, 0.006]], bare));
  foldedWings(parts, [0, 0.55, -0.045], 0.47, 0.48);
  parts.push(combineMeshes("海雕宽阔中央最长的楔尾", pale, Array.from({ length: 9 }, (_, index) => leaf("海雕宽白尾羽的真实分缘", pale, [(index - 4) * 0.025, 0.26, -0.245], 0.079, 0.37 - Math.abs(index - 4) * 0.035, [-104, -(index - 4) * 4.5, 0]))));
  talonFeet(parts, [0, 0.21, 0.045], 0.118, 0.027, 0.14);
  const scales: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 7; index++) scales.push(lobe("海雕裸跗前侧实际隆起的宽鳞甲", bare, [side * 0.115, 0.034 + index * 0.021, 0.057], [0.046, 0.018, 0.015]));
  parts.push(combineMeshes("不覆盖到鹰爪的裸跗盾鳞列", bare, scales));
  return parts;
}

// https://www.allaboutbirds.org/news/in-the-aerie-of-the-philippine-eagle/
function philippineEagle(): ModelPart[] {
  const parts: ModelPart[] = [lobe("食猿雕较狭长而直立的林栖胸躯", feather, [0, 0.43, -0.045], [0.36, 0.56, 0.44]), tapered("食猿雕撑起狭深头颅的长羽颈", pale, [[0, 0.59, 0.08], [0, 0.765, 0.15]], [0.1, 0.062])];
  head(parts, [0, 0.84, 0.2], [0.17, 0.23, 0.22], pale);
  parts.push(body("食猿雕侧向狭窄但上下很深的高拱喙", [[0.275, 0.834, 0.029, 0.046], [0.331, 0.83, 0.025, 0.048], [0.36, 0.792, 0.013, 0.027], [0.348, 0.767, 0.001, 0.002]], dark));
  const mane: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 7; index++) mane.push(leaf("沿头后向外披散而非圆面盘的长鬃羽", pale, [side * (0.024 + index * 0.005), 0.91 - index * 0.013, 0.145], 0.026, 0.2 + index % 3 * 0.018, [-61 - index * 12, side * (16 + index * 9), -side * 11]));
  parts.push(combineMeshes("食猿雕从后枕直到颈侧的放射披鬃", pale, mane));
  foldedWings(parts, [0, 0.54, -0.035], 0.37, 0.39);
  tail(parts, [0, 0.255, -0.235], 0.22, 0.47, -101);
  for (const side of [-1, 1]) parts.push(lobe("食猿雕厚羽覆腿与裸脚的分界", pale, [side * 0.088, 0.235, 0.015], [0.11, 0.23, 0.12]));
  talonFeet(parts, [0, 0.16, 0.035], 0.097, 0.024, 0.13);
  return parts;
}

// https://www.birdlife.org.za/red-data-book/red-list/crowned-eagle/
function crownedEagle(): ModelPart[] {
  const parts: ModelPart[] = [lobe("冕雕高而较窄的胸躯和收紧的腰部", feather, [0, 0.36, -0.03], [0.285, 0.46, 0.35]), tapered("冕雕长羽颈接入较窄的头部", feather, [[0, 0.49, 0.075], [0, 0.63, 0.125]], [0.065, 0.043])];
  head(parts, [0, 0.695, 0.166], [0.135, 0.16, 0.165]);
  parts.push(tapered("冕雕短厚而骤然钩下的硬嘴", bare, [[0, 0.682, 0.228], [0, 0.665, 0.278], [0, 0.628, 0.278]], [0.026, 0.018, 0.001]));
  const crests: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 4; index++) crests.push(leaf("冕雕两侧向后竖起的短尖冠羽", covert, [side * (0.012 + index * 0.008), 0.757, 0.125], 0.021, 0.108 + index % 2 * 0.018, [-30, side * 20, -side * (8 + index * 5)]));
  parts.push(combineMeshes("与后披长鬃不同的冕雕双峰短冠", covert, crests));
  for (const side of [-1, 1]) {
    parts.push(membrane("冕雕短而宽圆的森林翼", covert, [[side * 0.09, 0.46, 0.06], [side * 0.34, 0.56, 0.13], [side * 0.65, 0.5, 0.035], [side * 0.79, 0.39, -0.115], [side * 0.55, 0.25, -0.29], [side * 0.1, 0.24, -0.17]]));
    parts.push(combineMeshes("冕雕圆翼外缘分开的粗飞羽", covert, Array.from({ length: 9 }, (_, index) => leaf("冕雕短宽翼外段飞羽", covert, [side * (0.28 + index * 0.051), 0.43 - index * 0.009, -0.025 - index * 0.012], 0.087, 0.24 - index * 0.006, [-114, -side * index * 4, 0]))), lobe("冕雕伸到跗下段的厚实羽腿", feather, [side * 0.077, 0.167, 0.01], [0.095, 0.21, 0.1]));
  }
  tail(parts, [0, 0.22, -0.2], 0.2, 0.42, -103);
  talonFeet(parts, [0, 0.115, 0.03], 0.086, 0.02, 0.12);
  return parts;
}

function egyptianVulture(): ModelPart[] {
  const parts: ModelPart[] = [lobe("白兀鹫轻而狭长的白羽躯", pale, [0, 0.28, -0.035], [0.235, 0.32, 0.38]), tapered("白兀鹫完整羽覆的细颈", pale, [[0, 0.38, 0.1], [0, 0.51, 0.155]], [0.055, 0.032])];
  head(parts, [0, 0.566, 0.195], [0.102, 0.12, 0.145], bare);
  parts.push(tapered("白兀鹫比大型裸颈鹫明显细长的探食嘴", dark, [[0, 0.552, 0.248], [0, 0.535, 0.323], [0, 0.505, 0.337]], [0.017, 0.012, 0.001]));
  const ruff: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 9; index++) ruff.push(leaf("裸脸后缘向外披开的披针状白羽", pale, [side * (0.019 + index * 0.0035), 0.597 - index * 0.014, 0.151], 0.021, 0.09 + index % 3 * 0.018, [-60 - index * 10, side * 33, -side * 18]));
  parts.push(combineMeshes("延伸到后颈而非环绕成一圈的蓬白披羽", pale, ruff));
  foldedWings(parts, [0, 0.35, -0.035], 0.24, 0.32);
  parts.push(combineMeshes("白兀鹫中央伸长的尖楔尾", pale, Array.from({ length: 7 }, (_, index) => leaf("白兀鹫楔形白尾羽", pale, [(index - 3) * 0.018, 0.18, -0.195], 0.057, 0.27 - Math.abs(index - 3) * 0.036, [-102, -(index - 3) * 5, 0]))));
  feet(parts, [0, 0.16, 0.025], 0.058, 0.012, 0.08);
  return parts;
}

// https://peregrinefund.org/explore-raptors-species/vultures/lappet-faced-vulture
function lappetFacedVulture(): ModelPart[] {
  const parts: ModelPart[] = [lobe("皱脸兀鹫高肩深胸的巨大直立躯", covert, [0, 0.43, -0.04], [0.45, 0.57, 0.5]), tapered("皱脸兀鹫明显细于重胸的长裸颈", bare, [[0, 0.63, 0.11], [0, 0.78, 0.13], [0, 0.9, 0.22]], [0.063, 0.041, 0.043])];
  head(parts, [0, 0.967, 0.272], [0.16, 0.18, 0.21], bare);
  parts.push(body("皱脸兀鹫宽基上拱并深深内钩的重嘴", [[0.345, 0.952, 0.037, 0.044], [0.405, 0.946, 0.033, 0.049], [0.448, 0.91, 0.018, 0.032], [0.44, 0.874, 0.002, 0.003]], dark));
  const skin: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 4; index++) skin.push(tapered("耳后软皮向下折叠的连续肉褶", bare, [[side * 0.052, 1.008 - index * 0.031, 0.251 - index * 0.012], [side * (0.095 - index * 0.008), 0.975 - index * 0.033, 0.24 - index * 0.014], [side * (0.059 - index * 0.007), 0.94 - index * 0.034, 0.225 - index * 0.014]], [0.01, 0.013, 0.006]));
  parts.push(combineMeshes("头两侧真实起伏而非贴色的耳后肉褶", bare, skin));
  parts.push(combineMeshes("在长裸颈基部疏立的短羽领", pale, Array.from({ length: 14 }, (_, index) => { const angle = index / 14 * Math.PI * 2; return leaf("颈基部短而向外竖起的领羽", pale, [Math.cos(angle) * 0.066, 0.645, 0.11 + Math.sin(angle) * 0.063], 0.041, 0.115, [Math.sin(angle) * 35, -index / 14 * 360, -Math.cos(angle) * 42]); })));
  foldedWings(parts, [0, 0.55, -0.045], 0.46, 0.46);
  tail(parts, [0, 0.26, -0.25], 0.25, 0.24, -105);
  feet(parts, [0, 0.19, 0.035], 0.108, 0.024, 0.16);
  return parts;
}

// https://home.nps.gov/band/learn/nature/vulture.htm
function turkeyVulture(): ModelPart[] {
  const parts: ModelPart[] = [lobe("红头美洲鹫低肩而后端收窄的轻长躯", covert, [0, 0.31, -0.055], [0.26, 0.33, 0.43]), tapered("小裸头下方向前弯起的细裸颈", bare, [[0, 0.433, 0.1], [0, 0.549, 0.145], [0, 0.625, 0.184]], [0.04, 0.028, 0.027])];
  head(parts, [0, 0.66, 0.198], [0.093, 0.105, 0.125], bare);
  const upperBill = polygon("美洲鹫具有横向完全贯穿鼻孔的连续鼻桥", pale, [[0.688, 0.237], [0.686, 0.278], [0.674, 0.319], [0.652, 0.34], [0.62, 0.338], [0.613, 0.325], [0.64, 0.313], [0.644, 0.264], [0.643, 0.237]], 0.029, [0.0145, 0, 0], [Array.from({ length: 10 }, (_, index) => { const angle = index / 10 * Math.PI * 2; return [0.665 + Math.cos(angle) * 0.009, 0.276 + Math.sin(angle) * 0.017] as [number, number]; })]);
  upperBill.rotation.z = 90;
  parts.push(upperBill, body("美洲鹫鼻桥下独立而较短的下颌", [[0.237, 0.633, 0.013, 0.01], [0.29, 0.632, 0.01, 0.01], [0.315, 0.642, 0.002, 0.002]], bare));
  for (const side of [-1, 1]) {
    parts.push(membrane("美洲鹫由肩向外上扬成浅V形的长翼", covert, [[side * 0.09, 0.4, 0.07], [side * 0.41, 0.53, 0.11], [side * 0.82, 0.66, -0.04], [side * 0.97, 0.66, -0.18], [side * 0.64, 0.43, -0.37], [side * 0.1, 0.24, -0.24]]));
    parts.push(combineMeshes("美洲鹫浅V翼外端分离的长初级羽", covert, Array.from({ length: 11 }, (_, index) => leaf("美洲鹫伸出翼缘的细长指羽", covert, [side * (0.3 + index * 0.058), 0.41 + index * 0.022, -0.06 - index * 0.009], 0.075, 0.29 - index * 0.007, [-112, -side * (index * 3.3 + 3), 0]))));
  }
  tail(parts, [0, 0.185, -0.245], 0.18, 0.31, -101);
  feet(parts, [0, 0.17, 0.015], 0.063, 0.011, 0.092);
  return parts;
}

// https://animaldiversity.org/accounts/Afropavo_congensis/
function congoPeafowl(): ModelPart[] {
  const parts: ModelPart[] = [lobe("刚果孔雀厚胸短腹的紧凑林栖鸡躯", covert, [0, 0.29, -0.02], [0.26, 0.33, 0.41]), tapered("刚果孔雀上举而较短的有羽颈", covert, [[0, 0.4, 0.13], [0, 0.535, 0.17]], [0.055, 0.034])];
  head(parts, [0, 0.585, 0.206], [0.095, 0.11, 0.128], covert);
  parts.push(body("刚果孔雀小而短厚的尖嘴", [[0.253, 0.574, 0.017, 0.021], [0.308, 0.563, 0.001, 0.002]], bare), lobe("头前下方向喉部延展的裸露喉区", bare, [0, 0.525, 0.207], [0.051, 0.092, 0.043]));
  const crest: ModelPart[] = [];
  for (let index = 0; index < 11; index++) crest.push(tapered("刚果孔雀没有末端眼斑的细长白冠轴", pale, [[(index - 5) * 0.003, 0.628, 0.185], [(index - 5) * 0.006, 0.724 + index % 2 * 0.015, 0.16 - Math.abs(index - 5) * 0.001]], [0.0019, 0.0005]));
  parts.push(combineMeshes("头顶一束细白羽轴而非印度孔雀球拍冠", pale, crest));
  foldedWings(parts, [0, 0.35, -0.025], 0.27, 0.3);
  tail(parts, [0, 0.22, -0.185], 0.19, 0.225, -104);
  feet(parts, [0, 0.18, 0.02], 0.065, 0.011, 0.08);
  return parts;
}

// https://www.torontozoo.com/animals/Nicobar%20pigeon
function nicobarPigeon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("绿蓑鸠厚实低胸与宽圆地栖腹躯", covert, [0, 0.18, -0.015], [0.2, 0.24, 0.28]), tapered("蓑鸠由厚胸前伸再抬起的细羽颈", feather, [[0, 0.26, 0.075], [0, 0.332, 0.108]], [0.043, 0.029])];
  head(parts, [0, 0.37, 0.14], [0.09, 0.105, 0.12]);
  parts.push(body("蓑鸠纤短而基部有软蜡膜的嘴", [[0.184, 0.361, 0.012, 0.014], [0.229, 0.349, 0.008, 0.008], [0.239, 0.339, 0.001, 0.001]], bare), lobe("蓑鸠喙基上方的轻微蜡膜膨起", bare, [0, 0.37, 0.184], [0.026, 0.026, 0.039]));
  const hackles: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 12; index++) hackles.push(leaf("由颈侧向外下垂的真实狭长蓑羽", feather, [side * (0.018 + index * 0.0032), 0.327 - index * 0.005, 0.086 - index * 0.002], 0.014, 0.125 + index % 4 * 0.013, [148 + index % 3 * 4, side * (index * 6 - 24), -side * 18]));
  parts.push(combineMeshes("围在颈肩上而非延伸成长尾的披针蓑羽", feather, hackles));
  foldedWings(parts, [0, 0.23, -0.025], 0.2, 0.23);
  parts.push(combineMeshes("蓑鸠极短而方截的白尾", pale, Array.from({ length: 7 }, (_, index) => leaf("蓑鸠短白尾羽", pale, [(index - 3) * 0.012, 0.12, -0.125], 0.032, 0.075, [-103, -(index - 3) * 3, 0]))));
  feet(parts, [0, 0.09, 0.01], 0.049, 0.01, 0.056);
  return parts;
}

export const birdExpansionBatchNineDesigns: MasterNatureDesign[] = [
  design("hyacinthMacaw", "紫蓝金刚鹦鹉", "动物", hyacinthMacaw, ["Anodorhynchus hyacinthinus", "深厚巨喙与长阶尾", "对趾抓握足"]),
  design("pesquetsParrot", "彼氏鹦鹉", "动物", () => calibrated(pesquetsParrot(), 0.85), ["Psittrichas fulgidus", "裸脸鹫状细钩嘴", "短截尾与有羽颈根"]),
  design("stellersSeaEagle", "虎头海雕", "动物", stellersSeaEagle, ["Haliaeetus pelagicus", "高拱深厚巨喙", "重胸裸鳞跗与宽楔尾"]),
  design("philippineEagle", "食猿雕", "动物", philippineEagle, ["Pithecophaga jefferyi", "后枕放射披鬃", "狭深喙和长尾"]),
  design("crownedEagle", "冕雕", "动物", crownedEagle, ["Stephanoaetus coronatus", "双峰短冠与窄胸", "短宽圆翼和长尾"]),
  design("egyptianVulture", "白兀鹫", "动物", () => calibrated(egyptianVulture(), 0.85), ["Neophron percnopterus", "细长喙裸脸", "白披羽和尖楔尾"]),
  design("lappetFacedVulture", "皱脸兀鹫", "动物", lappetFacedVulture, ["Torgos tracheliotos", "真实耳后软皮褶", "裸长颈重胸"]),
  design("turkeyVulture", "红头美洲鹫", "动物", turkeyVulture, ["Cathartes aura", "真正贯穿鼻桥", "浅V长翼弱足长尾"]),
  design("congoPeafowl", "刚果孔雀", "动物", congoPeafowl, ["Afropavo congensis", "无眼斑长列羽的短体孔雀", "细白冠轴和短尾"]),
  design("nicobarPigeon", "绿蓑鸠", "动物", () => calibrated(nicobarPigeon(), 0.81), ["Caloenas nicobarica", "披针长颈蓑羽", "重腹强足极短方尾"]),
];
