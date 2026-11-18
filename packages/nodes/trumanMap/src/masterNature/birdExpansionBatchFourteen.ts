import { combineMeshes, design, leaf, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { calibrated, feet, foldedWings, head, tail } from "./birdExpansionBatchOne";
import { talonFeet } from "./birdExpansionBatchFive";
import { curvedFeather } from "./birdExpansionBatchTwelve";

const feather = "#a6b39b";
const covert = "#829482";
const pale = "#ccd0b8";
const bare = "#b6aa8b";
const dark = "#586b60";

// https://australian.museum/learn/animals/birds/channel-billed-cuckoo/
function channelBilledCuckoo(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大嘴鹃宽前胸而长后腰的树栖躯", feather, [0, 0.255, -0.035], [0.215, 0.29, 0.335]), tapered("大嘴鹃支持巨头嘴的粗羽颈", feather, [[0, 0.35, 0.075], [0, 0.453, 0.133]], [0.05, 0.036])];
  head(parts, [0, 0.497, 0.176], [0.12, 0.135, 0.175]);
  parts.push(body("大嘴鹃没有角盔但非常高厚而弯下的巨大嘴", [[0.239, 0.479, 0.028, 0.04], [0.31, 0.471, 0.028, 0.044], [0.365, 0.44, 0.019, 0.032], [0.383, 0.405, 0.0015, 0.003]], bare), body("巨嘴下方较薄且真实分开的下颌", [[0.239, 0.432, 0.021, 0.015], [0.307, 0.421, 0.02, 0.014], [0.365, 0.412, 0.002, 0.003]], pale));
  for (const side of [-1, 1]) {
    parts.push(membrane("大嘴鹃与长尾组成十字轮廓的窄长翼", covert, [[side * 0.07, 0.34, 0.065], [side * 0.3, 0.41, 0.085], [side * 0.56, 0.35, -0.055], [side * 0.66, 0.26, -0.19], [side * 0.3, 0.17, -0.245], [side * 0.075, 0.16, -0.16]]));
    parts.push(combineMeshes("大嘴鹃长翼后缘狭窄的飞羽", covert, Array.from({ length: 8 }, (_, index) => leaf("大嘴鹃收尖长翼的飞羽", covert, [side * (0.15 + index * 0.066), 0.29 - index * 0.004, -0.03 - index * 0.012], 0.049, 0.22 - index * 0.008, [-114, -side * index * 2.5, 0]))));
  }
  tail(parts, [0, 0.158, -0.175], 0.14, 0.3, -101);
  talonFeet(parts, [0, 0.115, 0.017], 0.046, 0.0085, 0.055, true);
  return parts;
}

function coralBilledGroundCuckoo(): ModelPart[] {
  const parts: ModelPart[] = [lobe("珊瑚嘴地鹃高腿上前低后长的地栖躯", feather, [0, 0.255, -0.04], [0.22, 0.27, 0.36]), tapered("地鹃由窄肩前端抬起的长细颈", feather, [[0, 0.325, 0.09], [0, 0.452, 0.147]], [0.041, 0.029])];
  head(parts, [0, 0.492, 0.182], [0.103, 0.115, 0.145]);
  parts.push(body("珊瑚嘴地鹃宽根而平直强壮的硬嘴", [[0.234, 0.477, 0.02, 0.024], [0.305, 0.463, 0.019, 0.02], [0.332, 0.445, 0.002, 0.003]], bare));
  foldedWings(parts, [0, 0.31, -0.045], 0.23, 0.28);
  const train: ModelPart[] = [];
  for (let index = 0; index < 8; index++) { const t = (index - 3.5) / 3.5; train.push(curvedFeather("地鹃各自有厚度的宽圆长尾羽", covert, [[t * 0.014, 0.17, -0.19], [t * 0.035, 0.2, -0.34], [t * 0.05, 0.145, -0.55 + Math.abs(t) * 0.052]], [0.024, 0.058, 0.007])); }
  parts.push(combineMeshes("地鹃高于地面而向后弧垂的宽阶尾", covert, train));
  talonFeet(parts, [0, 0.16, 0.015], 0.054, 0.011, 0.072, true);
  return parts;
}

// https://mns2.skin-web.org/en/document/coucal-goliath-goliath-coucal/6238e682445a3d67afb948d3
function goliathCoucal(): ModelPart[] {
  const parts: ModelPart[] = [lobe("巨鸦鹃极深宽而近水平的重型胸腹", feather, [0, 0.265, -0.045], [0.32, 0.34, 0.42]), tapered("巨鸦鹃从深胸抬起的粗短羽颈", feather, [[0, 0.38, 0.105], [0, 0.49, 0.16]], [0.069, 0.043])];
  head(parts, [0, 0.537, 0.204], [0.13, 0.14, 0.17]);
  parts.push(body("巨鸦鹃深基上拱而末端下曲的强壮喙", [[0.266, 0.519, 0.025, 0.033], [0.332, 0.504, 0.023, 0.033], [0.363, 0.47, 0.0015, 0.003]], bare));
  foldedWings(parts, [0, 0.336, -0.05], 0.33, 0.31);
  const longTail: ModelPart[] = [];
  for (let index = 0; index < 10; index++) { const t = (index - 4.5) / 4.5; longTail.push(curvedFeather("巨鸦鹃粗羽轴的宽长尾羽", covert, [[t * 0.019, 0.18, -0.221], [t * 0.04, 0.21, -0.39], [t * 0.055, 0.14, -0.61 + Math.abs(t) * 0.065]], [0.026, 0.07, 0.008])); }
  parts.push(combineMeshes("巨鸦鹃宽而松垂的完整长阶尾", covert, longTail));
  talonFeet(parts, [0, 0.155, 0.015], 0.072, 0.014, 0.092, true);
  return parts;
}

// https://sta.uwi.edu/fst/lifesciences/sites/default/files/lifesciences/documents/ogatt/Crotophaga_major%20-%20Greater%20Ani.pdf
function greaterAni(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大犀鹃窄肩而有长后腰的轻躯", covert, [0, 0.185, -0.025], [0.145, 0.23, 0.24]), tapered("大犀鹃上举的细羽颈", covert, [[0, 0.265, 0.06], [0, 0.337, 0.099]], [0.03, 0.023])];
  head(parts, [0, 0.377, 0.134], [0.098, 0.12, 0.132], covert);
  parts.push(body("大犀鹃基部高拱有犀状脊但没有独立角盔的扁嘴", [[0.181, 0.366, 0.012, 0.029], [0.215, 0.378, 0.014, 0.046], [0.253, 0.36, 0.012, 0.036], [0.279, 0.323, 0.001, 0.002]], dark), body("大犀鹃扁高嘴下方的短下颌", [[0.18, 0.329, 0.011, 0.012], [0.231, 0.324, 0.01, 0.013], [0.267, 0.322, 0.001, 0.002]], dark));
  foldedWings(parts, [0, 0.235, -0.03], 0.15, 0.24);
  tail(parts, [0, 0.115, -0.125], 0.13, 0.295, -100);
  talonFeet(parts, [0, 0.083, 0.01], 0.034, 0.006, 0.047, true);
  return parts;
}

// https://the-eis.com/elibrary/sites/default/files/downloads/literature/The%20Birds%20of%20South%20Africa_Ethipian%20Region%20Vol%20V%20p%201.pdf
function thickBilledRaven(): ModelPart[] {
  const parts: ModelPart[] = [lobe("厚嘴渡鸦宽胸而颈肩粗重的鸦躯", covert, [0, 0.24, -0.025], [0.245, 0.315, 0.34]), lobe("厚嘴渡鸦上举的粗短羽颈", covert, [0, 0.386, 0.075], [0.16, 0.205, 0.17])];
  head(parts, [0, 0.497, 0.132], [0.14, 0.15, 0.17], covert);
  parts.push(body("厚嘴渡鸦侧扁但上下极深的高弧巨嘴", [[0.193, 0.476, 0.025, 0.037], [0.246, 0.478, 0.024, 0.043], [0.303, 0.453, 0.018, 0.032], [0.329, 0.42, 0.002, 0.003]], bare), body("厚嘴渡鸦嘴底独立深厚的下颌", [[0.192, 0.432, 0.022, 0.018], [0.25, 0.424, 0.02, 0.019], [0.314, 0.418, 0.002, 0.003]], bare));
  parts.push(combineMeshes("厚嘴渡鸦前喉向下披的圆端粗羽束", covert, Array.from({ length: 15 }, (_, index) => leaf("厚嘴渡鸦喉部蓬松的宽短羽", covert, [(index % 5 - 2) * 0.012, 0.424 - Math.floor(index / 5) * 0.019, 0.129 + Math.floor(index / 5) * 0.006], 0.022, 0.073 + index % 3 * 0.009, [164, (index % 5 - 2) * 11, 0]))));
  foldedWings(parts, [0, 0.306, -0.03], 0.25, 0.31);
  tail(parts, [0, 0.15, -0.175], 0.17, 0.26, -102);
  feet(parts, [0, 0.12, 0.015], 0.06, 0.012, 0.082);
  return parts;
}

// https://britishwildlifecentre.co.uk/planyourvisit/animals/chough/
function redBilledChough(): ModelPart[] {
  const parts: ModelPart[] = [lobe("红嘴山鸦细长而前胸丰满的山地鸦躯", covert, [0, 0.19, -0.02], [0.14, 0.23, 0.265]), tapered("红嘴山鸦小头下方的细羽颈", covert, [[0, 0.273, 0.06], [0, 0.345, 0.098]], [0.029, 0.022])];
  head(parts, [0, 0.383, 0.128], [0.087, 0.101, 0.121], covert);
  parts.push(tapered("红嘴山鸦长细并连续下弯的探土嘴", bare, [[0, 0.369, 0.172], [0, 0.36, 0.212], [0, 0.335, 0.251], [0, 0.316, 0.257]], [0.01, 0.007, 0.0035, 0.0007]));
  for (const side of [-1, 1]) {
    parts.push(membrane("红嘴山鸦外段张成宽指的宽翔翼", covert, [[side * 0.05, 0.265, 0.05], [side * 0.23, 0.34, 0.09], [side * 0.45, 0.29, -0.02], [side * 0.53, 0.2, -0.135], [side * 0.29, 0.13, -0.205], [side * 0.05, 0.115, -0.13]]));
    parts.push(combineMeshes("山鸦宽翼外侧分开的指羽", covert, Array.from({ length: 7 }, (_, index) => leaf("山鸦飞翼相叠宽羽端", covert, [side * (0.2 + index * 0.046), 0.22 - index * 0.004, -0.02 - index * 0.013], 0.055, 0.2 - index * 0.007, [-114, -side * index * 4.5, 0]))));
  }
  tail(parts, [0, 0.12, -0.13], 0.12, 0.185, -103);
  feet(parts, [0, 0.092, 0.01], 0.037, 0.0075, 0.058);
  return parts;
}

// https://www.tobiaslab.net/wp-content/uploads/2020/04/SeddonTobias-2007-Population-size-and-habitat-associations-of-the-long-tailed-ground-roller.-BCI.pdf
function longTailedGroundRoller(): ModelPart[] {
  const parts: ModelPart[] = [lobe("长尾地佛法僧大头下方丰满而短腰的地栖躯", feather, [0, 0.17, -0.02], [0.17, 0.23, 0.25]), tapered("长尾地佛法僧上举的极短粗颈", feather, [[0, 0.25, 0.065], [0, 0.31, 0.104]], [0.038, 0.03])];
  head(parts, [0, 0.35, 0.14], [0.119, 0.124, 0.159]);
  parts.push(body("长尾地佛法僧粗基而稍下曲的黑色长嘴", [[0.198, 0.331, 0.019, 0.024], [0.249, 0.316, 0.015, 0.019], [0.274, 0.295, 0.0015, 0.002]], dark));
  foldedWings(parts, [0, 0.217, -0.025], 0.18, 0.2);
  parts.push(combineMeshes("远长于短腰躯体的狭长阶梯尾", covert, Array.from({ length: 8 }, (_, index) => { const t = (index - 3.5) / 3.5; return leaf("长尾地佛法僧各自分离的长硬尾羽", covert, [t * 0.018, 0.105, -0.125], 0.032, 0.29 - Math.abs(t) * 0.065, [-97, -t * 6, 0]); })));
  feet(parts, [0, 0.087, 0.012], 0.045, 0.009, 0.061);
  return parts;
}

// https://zoobarcelona.cat/en/animals/whitenaped-pheasant-pigeon
function pheasantPigeon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("雉鸠长腿上深胸而向后渐窄的地栖体", feather, [0, 0.225, -0.035], [0.24, 0.28, 0.315]), tapered("雉鸠撑起小头的明显长羽颈", feather, [[0, 0.315, 0.09], [0, 0.407, 0.132]], [0.047, 0.029])];
  head(parts, [0, 0.447, 0.167], [0.09, 0.105, 0.125]);
  parts.push(body("雉鸠比城市鸽稍长的平直尖嘴", [[0.212, 0.433, 0.012, 0.015], [0.261, 0.422, 0.01, 0.011], [0.278, 0.414, 0.001, 0.0015]], bare));
  foldedWings(parts, [0, 0.285, -0.04], 0.25, 0.25);
  tail(parts, [0, 0.15, -0.17], 0.2, 0.23, -104);
  feet(parts, [0, 0.14, 0.01], 0.059, 0.012, 0.082);
  return parts;
}

// https://www.reptilepark.com.au/about/meet-our-animals/topknot-pigeon
function topknotPigeon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("凤头鸠宽肩圆腹的重型林栖鸠躯", feather, [0, 0.2, -0.02], [0.235, 0.28, 0.285]), tapered("凤头鸠前胸上短而粗的羽颈", feather, [[0, 0.295, 0.073], [0, 0.365, 0.109]], [0.045, 0.032])];
  head(parts, [0, 0.405, 0.144], [0.11, 0.119, 0.143]);
  parts.push(body("凤头鸠小而窄的下曲嘴", [[0.196, 0.389, 0.012, 0.014], [0.236, 0.38, 0.009, 0.011], [0.25, 0.365, 0.001, 0.002]], bare));
  for (const side of [-1, 1]) parts.push(lobe("凤头鸠喙基两侧实际隆起的蜡膜结节", bare, [side * 0.011, 0.399, 0.197], [0.017, 0.024, 0.024]));
  const forelock: ModelPart[] = [], nape: ModelPart[] = [];
  for (let index = 0; index < 11; index++) { const x = (index - 5) * 0.005; forelock.push(leaf("凤头鸠额部向后覆盖的宽前冠羽", feather, [x, 0.446, 0.173], 0.019, 0.098 - Math.abs(index - 5) * 0.005, [-61, (index - 5) * 4, 0])); nape.push(leaf("凤头鸠独立于前冠的后枕向后披羽", covert, [x, 0.444, 0.11], 0.022, 0.137 - Math.abs(index - 5) * 0.005, [-92, (index - 5) * 5, 0])); }
  parts.push(combineMeshes("凤头鸠前额真实蓬起并向后梳的前冠", feather, forelock), combineMeshes("凤头鸠较长的第二层后枕披冠", covert, nape));
  foldedWings(parts, [0, 0.253, -0.025], 0.24, 0.23);
  tail(parts, [0, 0.12, -0.14], 0.15, 0.16, -103);
  feet(parts, [0, 0.09, 0.012], 0.05, 0.009, 0.058);
  return parts;
}

// https://comptes-rendus.academie-sciences.fr/biologies/articles/10.1016/j.crvi.2007.10.003/
function toothBilledPigeon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("齿嘴鸽宽胸短腰而厚腹的地栖鸽躯", feather, [0, 0.17, -0.015], [0.2, 0.235, 0.25]), tapered("齿嘴鸽撑起大头的粗短羽颈", feather, [[0, 0.25, 0.06], [0, 0.309, 0.096]], [0.038, 0.029])];
  head(parts, [0, 0.35, 0.128], [0.111, 0.121, 0.136]);
  parts.push(body("齿嘴鸽像鹦鹉但属于鸽类的高拱上钩喙", [[0.178, 0.337, 0.02, 0.026], [0.212, 0.322, 0.019, 0.03], [0.232, 0.293, 0.01, 0.02], [0.221, 0.277, 0.001, 0.002]], bare));
  for (const side of [-1, 1]) {
    const lowerBill = polygon("齿嘴鸽单侧下颌三处真实角质齿状突和齿间凹口", bare, [[0.305, 0.171], [0.302, 0.188], [0.311, 0.197], [0.299, 0.202], [0.307, 0.211], [0.295, 0.216], [0.302, 0.228], [0.291, 0.237], [0.278, 0.226], [0.275, 0.199], [0.282, 0.171]], 0.005, [side * 0.012 + 0.0025, 0, 0]);
    lowerBill.rotation.z = 90;
    parts.push(lowerBill);
  }
  parts.push(body("齿嘴鸽连接两侧齿缘但不填满口腔的薄下颌底", [[0.172, 0.281, 0.013, 0.006], [0.2, 0.281, 0.014, 0.006], [0.225, 0.282, 0.009, 0.004]], bare));
  foldedWings(parts, [0, 0.22, -0.02], 0.21, 0.21);
  tail(parts, [0, 0.11, -0.121], 0.115, 0.1, -104);
  feet(parts, [0, 0.09, 0.01], 0.047, 0.0095, 0.056);
  return parts;
}

export const birdExpansionBatchFourteenDesigns: MasterNatureDesign[] = [
  design("channelBilledCuckoo", "大嘴鹃", "动物", () => calibrated(channelBilledCuckoo(), 0.75), ["Scythrops novaehollandiae", "无角盔的巨大弯嘴", "十字翼长尾与对趾足"]),
  design("coralBilledGroundCuckoo", "珊瑚嘴地鹃", "动物", () => calibrated(coralBilledGroundCuckoo(), 0.83), ["Carpococcyx renauldi", "长腿长颈地栖躯", "宽圆弧垂阶尾"]),
  design("goliathCoucal", "巨鸦鹃", "动物", () => calibrated(goliathCoucal(), 0.7), ["Centropus goliath", "粗颈深宽重躯", "强弯喙与宽长软尾"]),
  design("greaterAni", "大犀鹃", "动物", () => calibrated(greaterAni(), 0.68), ["Crotophaga major", "扁高犀脊嘴与独立下颌", "窄腰长尾对趾足"]),
  design("thickBilledRaven", "厚嘴渡鸦", "动物", () => calibrated(thickBilledRaven(), 0.85), ["Corvus crassirostris", "侧扁高弧巨喙", "重颈圆端喉羽"]),
  design("redBilledChough", "红嘴山鸦", "动物", () => calibrated(redBilledChough(), 0.75), ["Pyrrhocorax pyrrhocorax", "长细曲探嘴", "宽指翔翼细长鸦躯"]),
  design("longTailedGroundRoller", "长尾地佛法僧", "动物", () => calibrated(longTailedGroundRoller(), 0.68), ["Uratelornis chimaera", "大头短腰长阶尾", "强趾地栖足"]),
  design("pheasantPigeon", "雉鸠", "动物", () => calibrated(pheasantPigeon(), 0.72), ["Otidiphaps nobilis", "地栖长腿和长尾", "小头长颈深胸鸽躯"]),
  design("topknotPigeon", "凤头鸠", "动物", () => calibrated(topknotPigeon(), 0.8), ["Lopholaimus antarcticus", "两层向后梳的宽前冠和长枕冠", "喙基双蜡膜结节"]),
  design("toothBilledPigeon", "齿嘴鸽", "动物", () => calibrated(toothBilledPigeon(), 0.8), ["Didunculus strigirostris", "高拱上钩和三处角质下颌齿突", "厚腹短尾地栖鸽躯"]),
];
