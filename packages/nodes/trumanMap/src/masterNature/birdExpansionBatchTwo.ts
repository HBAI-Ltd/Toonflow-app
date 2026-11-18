import { combineMeshes, design, leaf, lobe, needle, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { calibrated, feet, foldedWings, head, tail } from "./birdExpansionBatchOne";
import { Euler, Vector3 } from "three";

const feather = "#a3b399";
const covert = "#829683";
const pale = "#cbd0b5";
const bare = "#b3aa91";
const dark = "#596b5d";

// https://www.honoluluzoo.org/grey-winged-trumpeter/
function greyWingedTrumpeter(): ModelPart[] {
  const parts: ModelPart[] = [lobe("喇叭鸟拱背而窄臀的躯体", feather, [0, 0.29, -0.01], [0.23, 0.31, 0.32]), tapered("喇叭鸟高而纤细的弯曲羽颈", covert, [[0, 0.36, 0.1], [0, 0.47, 0.12], [0, 0.54, 0.16]], [0.038, 0.025, 0.025])];
  head(parts, [0, 0.565, 0.18], [0.075, 0.09, 0.105], covert);
  parts.push(tapered("喇叭鸟短而向下弯的锥喙", bare, [[0, 0.556, 0.22], [0, 0.548, 0.262], [0, 0.53, 0.269]], [0.014, 0.008, 0.001]));
  for (const side of [-1, 1]) {
    parts.push(lobe("自然稍离身体且强烈拱起的肩翼", pale, [side * 0.105, 0.37, -0.025], [0.115, 0.17, 0.28], [0, 0, side * -14]), membrane("拱肩到后腹连续的半张翼面", pale, [[side * 0.065, 0.4, 0.06], [side * 0.18, 0.36, 0.02], [side * 0.17, 0.25, -0.17], [side * 0.065, 0.21, -0.16]]));
    parts.push(combineMeshes("拱翼后缘的低垂飞羽", pale, Array.from({ length: 6 }, (_, index) => leaf("向后下方收束的完整飞羽", pale, [side * (0.09 + index * 0.013), 0.32 - index * 0.006, -0.04], 0.034, 0.21 - index * 0.01, [-135, side * index * 3, 0]))));
  }
  tail(parts, [0, 0.23, -0.14], 0.075, 0.055, -113);
  feet(parts, [0, 0.21, 0.005], 0.048, 0.009, 0.066);
  return parts;
}

function whiteBreastedMesite(): ModelPart[] {
  const parts: ModelPart[] = [lobe("拟鹑侧扁而前倾的长胸躯", feather, [0, 0.11, -0.005], [0.095, 0.13, 0.19]), tapered("拟鹑由前胸斜举的细短颈", pale, [[0, 0.15, 0.055], [0, 0.195, 0.08]], [0.025, 0.018])];
  head(parts, [0, 0.219, 0.1], [0.056, 0.061, 0.075]);
  parts.push(tapered("拟鹑窄而轻度下弯的短喙", bare, [[0, 0.211, 0.128], [0, 0.206, 0.155], [0, 0.195, 0.169]], [0.007, 0.005, 0.0007]));
  foldedWings(parts, [0, 0.143, -0.012], 0.1, 0.155);
  parts.push(combineMeshes("拟鹑水平展开而非雉形长尾的宽软尾", covert, Array.from({ length: 7 }, (_, index) => leaf("宽软圆端尾羽", covert, [(index - 3) * 0.007, 0.09, -0.085], 0.028, 0.12 - Math.abs(index - 3) * 0.008, [-97, (index - 3) * 7, 0]))));
  feet(parts, [0, 0.075, 0.005], 0.027, 0.0045, 0.036);
  return parts;
}

// 三趾鹑无后趾，不将鹑与三趾鹑只按斑纹区分。
// https://www.environment.nsw.gov.au/sites/default/files/2024-09/sc-black-breasted-button-quail-turnix-melanogaster-review-report.pdf
function barredButtonquail(): ModelPart[] {
  const parts: ModelPart[] = [lobe("三趾鹑几乎无外露尾的团状地栖躯", feather, [0, 0.071, -0.005], [0.08, 0.1, 0.125]), lobe("羽颈直接贴入肩前而非细长脖子", pale, [0, 0.115, 0.037], [0.057, 0.065, 0.055])];
  head(parts, [0, 0.143, 0.054], [0.055, 0.057, 0.062]);
  parts.push(body("三趾鹑高鼻盖下的短锥嘴", [[0.075, 0.136, 0.008, 0.012], [0.099, 0.132, 0.005, 0.007], [0.114, 0.126, 0.001, 0.001]], bare));
  foldedWings(parts, [0, 0.095, -0.005], 0.083, 0.09);
  parts.push(combineMeshes("藏于腰部覆羽下的极短软尾", covert, [-1, 0, 1].map(side => leaf("短软尾羽", covert, [side * 0.008, 0.066, -0.057], 0.018, 0.022, [-115, side * 5, 0]))));
  feet(parts, [0, 0.044, 0.005], 0.024, 0.0036, 0.034, { hindToe: false });
  return parts;
}

// https://birds-europe.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/taxon.php?epi=207&id=130696
function blackBelliedSandgrouse(): ModelPart[] {
  const parts: ModelPart[] = [lobe("沙鸡适于远飞的坚实梭形胸腹", feather, [0, 0.14, -0.015], [0.17, 0.2, 0.26]), lobe("小头下方粗短而圆满的颈基", feather, [0, 0.218, 0.09], [0.095, 0.135, 0.105])];
  head(parts, [0, 0.277, 0.13], [0.075, 0.08, 0.09]);
  parts.push(tapered("沙鸡细短而坚硬的锥状嘴", bare, [[0, 0.266, 0.164], [0, 0.26, 0.204]], [0.011, 0.001]));
  for (const side of [-1, 1]) {
    parts.push(lobe("沙鸡长尖翼根覆羽", covert, [side * 0.061, 0.18, -0.012], [0.105, 0.1, 0.245]), combineMeshes("长尖翼最外侧逐渐收尖的飞羽", covert, Array.from({ length: 7 }, (_, index) => leaf("沙鸡狭长初级飞羽", covert, [side * (0.047 + index * 0.006), 0.18 - index * 0.003, -0.01], 0.027, 0.27 - index * 0.017, [-103, side * index * 2, 0]))));
    parts.push(lobe("跗蹠上部可见的羽毛短套", pale, [side * 0.043, 0.056, 0.012], [0.032, 0.067, 0.033]));
  }
  tail(parts, [0, 0.102, -0.12], 0.105, 0.085, -100);
  feet(parts, [0, 0.075, 0.01], 0.043, 0.0055, 0.035);
  return parts;
}

// https://avise-birds.bio.uci.edu/piciformes/ramphastidae/lybius_dubius/index.html
function beardedBarbet(): ModelPart[] {
  const parts: ModelPart[] = [lobe("须拟啄木鸟短颈而膨大的前胸", feather, [0, 0.115, -0.006], [0.12, 0.16, 0.17])];
  head(parts, [0, 0.223, 0.055], [0.11, 0.115, 0.12]);
  parts.push(body("拟啄木鸟基部极高而粗壮的重喙", [[0.1, 0.215, 0.027, 0.036], [0.148, 0.212, 0.025, 0.027], [0.184, 0.2, 0.001, 0.001]], pale));
  const bristles: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 7; index++) bristles.push(tapered("喙根真正离开轮廓的须状羽轴", covert, [[side * 0.028, 0.205 + index * 0.005, 0.104], [side * (0.043 + index * 0.002), 0.182 + index * 0.006, 0.137]], [0.0016, 0.0005]));
  parts.push(combineMeshes("喙根两侧密集而独立的刚毛须", covert, bristles));
  foldedWings(parts, [0, 0.16, -0.018], 0.12, 0.15);
  tail(parts, [0, 0.08, -0.07], 0.075, 0.09, -111);
  for (const side of [-1, 1]) {
    const ankle: Triple = [side * 0.032, 0.018, 0.01];
    parts.push(tapered("拟啄木鸟短粗跗蹠", bare, [[side * 0.027, 0.067, -0.005], ankle], [0.0055, 0.004]));
    const toes = [-1, 1].flatMap(end => [-1, 1].map(spread => tapered("真正两前两后的对趾足", bare, [ankle, [ankle[0] + spread * 0.009, 0.005, ankle[2] + end * 0.028], [ankle[0] + spread * 0.012, 0.002, ankle[2] + end * 0.035]], [0.003, 0.002, 0.0006])));
    parts.push(combineMeshes("两前两后独立抓趾", bare, toes));
  }
  return parts;
}

function commonScimitarbill(): ModelPart[] {
  const parts: ModelPart[] = [lobe("林戴胜细而近水平的长胸躯", covert, [0, 0.11, -0.015], [0.07, 0.1, 0.15]), tapered("林戴胜无羽冠的小头细颈", covert, [[0, 0.15, 0.04], [0, 0.207, 0.065]], [0.022, 0.016])];
  head(parts, [0, 0.222, 0.084], [0.054, 0.06, 0.067], covert);
  parts.push(tapered("林戴胜细而明显镰曲的黑色喙", dark, [[0, 0.213, 0.108], [0, 0.215, 0.14], [0, 0.198, 0.178], [0, 0.169, 0.198]], [0.006, 0.005, 0.003, 0.0006]));
  foldedWings(parts, [0, 0.142, -0.013], 0.072, 0.145);
  parts.push(combineMeshes("长而分级收束的尾羽", covert, Array.from({ length: 7 }, (_, index) => leaf("逐级长短的完整尾羽", covert, [(index - 3) * 0.0045, 0.082, -0.075], 0.019, 0.18 - Math.abs(index - 3) * 0.025, [-99, (index - 3) * 4, 0]))));
  feet(parts, [0, 0.06, 0.006], 0.022, 0.0038, 0.032);
  return parts;
}

// https://birds-europe.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/nsr_taxon.php?cat=TAB_DESCRIPTION&id=130835
function whiteThroatedDipper(): ModelPart[] {
  const parts: ModelPart[] = [lobe("河乌肥圆胸腹与无细颈的流线身", covert, [0, 0.071, -0.006], [0.082, 0.095, 0.11]), lobe("向头部上方收束的短厚颈", pale, [0, 0.114, 0.035], [0.058, 0.07, 0.062])];
  head(parts, [0, 0.147, 0.045], [0.058, 0.061, 0.065], covert);
  parts.push(tapered("河乌细直尖嘴而非雀形锥嘴", dark, [[0, 0.14, 0.07], [0, 0.137, 0.108]], [0.007, 0.0007]));
  foldedWings(parts, [0, 0.094, -0.01], 0.082, 0.084);
  tail(parts, [0, 0.065, -0.05], 0.043, 0.033, -65);
  feet(parts, [0, 0.043, 0.005], 0.025, 0.0048, 0.034);
  return parts;
}

// https://www.allaboutbirds.org/guide/limpkin
function limpkin(): ModelPart[] {
  const parts: ModelPart[] = [lobe("秧鹤高腿上的横长前重躯", feather, [0, 0.36, -0.015], [0.2, 0.28, 0.36]), tapered("秧鹤前伸再上举的长颈", feather, [[0, 0.43, 0.1], [0, 0.54, 0.15], [0, 0.65, 0.2]], [0.048, 0.032, 0.025])];
  head(parts, [0, 0.68, 0.22], [0.085, 0.1, 0.12]);
  parts.push(tapered("秧鹤向右扭曲且下弯的上颌", bare, [[0, 0.67, 0.265], [0, 0.67, 0.34], [0.005, 0.66, 0.4], [0.013, 0.643, 0.432]], [0.012, 0.009, 0.006, 0.0008]), tapered("与上颌端前保持真实镊形间隙的下颌", pale, [[0, 0.65, 0.265], [0, 0.646, 0.34], [0.005, 0.639, 0.4], [0.013, 0.641, 0.429]], [0.01, 0.006, 0.003, 0.0007]));
  foldedWings(parts, [0, 0.405, -0.025], 0.215, 0.3);
  tail(parts, [0, 0.28, -0.16], 0.11, 0.125);
  feet(parts, [0, 0.255, 0.01], 0.052, 0.01, 0.09);
  return parts;
}

// https://forestry.sarawak.gov.my/web/subpage/webpage_view/841
function greatArgus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大眼斑雉窄长的地栖胸躯", feather, [0, 0.24, 0], [0.23, 0.31, 0.37]), tapered("大眼斑雉有裸皮的纤细长颈", "#9eb3aa", [[0, 0.34, 0.13], [0, 0.46, 0.18]], [0.038, 0.023])];
  head(parts, [0, 0.492, 0.2], [0.075, 0.085, 0.09], "#9eb3aa");
  parts.push(tapered("短硬而末端收尖的雉喙", bare, [[0, 0.482, 0.234], [0, 0.475, 0.286]], [0.013, 0.0008]), combineMeshes("头顶短而直立的细冠羽", covert, Array.from({ length: 5 }, (_, index) => leaf("短冠羽", covert, [(index - 2) * 0.005, 0.527, 0.18], 0.012, 0.04 + index % 2 * 0.01, [-18, index * 15, 0]))));
  for (const side of [-1, 1]) {
    parts.push(lobe("侧面厚实的翼臂及覆羽", covert, [side * 0.09, 0.29, 0.005], [0.12, 0.15, 0.29]));
    const flightFeathers: ModelPart[] = [], eyespots: ModelPart[] = [];
    for (let index = 0; index < 9; index++) {
      const root: Triple = [side * (0.07 + index * 0.009), 0.29 - index * 0.006, -0.02 - index * 0.012];
      const length = 0.43 + index * 0.035, rotation: Triple = [-100, -side * index * 3, 0];
      flightFeathers.push(leaf("眼斑雉特化的宽长次级飞羽", feather, root, 0.064, length, rotation));
      for (const fraction of [0.53, 0.68, 0.82]) {
        const relief = 0.064 * (0.14 - (fraction - 0.48) / 0.52 * 0.08) + 0.001;
        const point = new Vector3(0, length * fraction, relief).applyEuler(new Euler(...rotation.map(value => value * Math.PI / 180) as Triple)).add(new Vector3(...root));
        eyespots.push(lobe("紧贴同一飞羽面且随之倾转的眼形羽域", "#b8b28d", point.toArray() as Triple, [0.027, 0.042, 0.003], rotation));
      }
    }
    parts.push(combineMeshes("明显超出躯体的巨大次级飞羽而非孔雀尾屏", feather, flightFeathers));
    parts.push(combineMeshes("整侧飞羽眼斑区", "#b8b28d", eyespots));
  }
  parts.push(combineMeshes("尾部两枚特别延长的中央尾羽", covert, [-1, 1].map(side => leaf("长中央尾羽", covert, [side * 0.016, 0.2, -0.16], 0.054, 0.95, [-96, side * 3, 0]))));
  tail(parts, [0, 0.2, -0.15], 0.16, 0.3, -98);
  feet(parts, [0, 0.16, 0.02], 0.06, 0.01, 0.075);
  return parts;
}

// https://www.pretoriazoo.org/animals/northern-bald-ibis/
function northernBaldIbis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("隐鹮有宽肩的横长躯", covert, [0, 0.29, -0.02], [0.26, 0.32, 0.4]), tapered("隐鹮弯曲上举的羽颈", covert, [[0, 0.36, 0.14], [0, 0.47, 0.19], [0, 0.52, 0.24]], [0.065, 0.041, 0.029])];
  head(parts, [0, 0.555, 0.26], [0.095, 0.11, 0.12], "#ba9d8b");
  parts.push(tapered("隐鹮从裸头连续向下弯的长嘴", bare, [[0, 0.545, 0.305], [0, 0.54, 0.38], [0, 0.505, 0.45], [0, 0.452, 0.5]], [0.017, 0.013, 0.008, 0.001]));
  const mane: ModelPart[] = [];
  for (let index = 0; index < 11; index++) {
    const angle = (index - 5) * Math.PI / 11;
    mane.push(leaf("后枕向外披散的独立鬃状羽", covert, [Math.sin(angle) * 0.034, 0.575 - Math.abs(index - 5) * 0.006, 0.223], 0.022, 0.14 + index % 2 * 0.028, [-145 + Math.abs(index - 5) * 8, (index - 5) * 8, (index - 5) * 4]));
  }
  parts.push(combineMeshes("裸头后方真实蓬松鬃羽而非头部贴色", covert, mane));
  foldedWings(parts, [0, 0.34, -0.02], 0.26, 0.35);
  tail(parts, [0, 0.23, -0.18], 0.13, 0.16);
  feet(parts, [0, 0.2, 0.025], 0.06, 0.01, 0.085);
  return parts;
}

export const birdExpansionBatchTwoDesigns: MasterNatureDesign[] = [
  design("greyWingedTrumpeter", "灰翅喇叭鸟", "动物", () => calibrated(greyWingedTrumpeter(), 0.85), ["Psophia crepitans", "拱肩半离身翼", "长颈短尾"]),
  design("whiteBreastedMesite", "白胸拟鹑", "动物", () => calibrated(whiteBreastedMesite(), 0.83), ["Mesitornis variegatus", "细颈宽软尾", "地栖拟鹑体型"]),
  design("barredButtonquail", "棕三趾鹑", "动物", () => calibrated(barredButtonquail(), 0.82), ["Turnix suscitator", "真正无后趾", "短软尾无细颈"]),
  design("blackBelliedSandgrouse", "黑腹沙鸡", "动物", () => calibrated(blackBelliedSandgrouse(), 0.73), ["Pterocles orientalis", "长尖翼短尾", "羽跗裸趾"]),
  design("beardedBarbet", "须拟啄木鸟", "动物", () => calibrated(beardedBarbet(), 0.74), ["Pogonornis dubius", "Lybius dubius", "重喙刚毛须", "两前两后对趾"]),
  design("commonScimitarbill", "黑林戴胜", "动物", () => calibrated(commonScimitarbill(), 0.66), ["Rhinopomastus cyanomelas", "无冠镰曲嘴", "长阶尾"]),
  design("whiteThroatedDipper", "河乌", "动物", () => calibrated(whiteThroatedDipper(), 0.9), ["Cinclus cinclus", "短厚颈短翘尾", "强爪溪流潜禽"]),
  design("limpkin", "秧鹤", "动物", () => calibrated(limpkin(), 0.88), ["Aramus guarauna", "右扭的镊形喙隙", "长腿涉禽"]),
  design("greatArgus", "大眼斑雉", "动物", () => calibrated(greatArgus(), 0.86), ["Argusianus argus", "巨大次级飞羽", "长中央尾羽"]),
  design("northernBaldIbis", "隐鹮", "动物", () => calibrated(northernBaldIbis(), 0.88), ["Geronticus eremita", "裸头长弧喙", "后枕鬃羽"]),
];
