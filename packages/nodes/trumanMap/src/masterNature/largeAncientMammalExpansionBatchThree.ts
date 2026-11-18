import { combineMeshes, design, eyes, leaf, lobe, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { body } from "./fishForms";

const hide = "#a7b198";
const pale = "#c9cbb0";
const dark = "#7e907b";

// https://app.pan.pl/archive/published/app61/app001362014.pdf
// https://fi.nm.cz/wp-content/uploads/2017/12/17_Al-Kindi_new-DOI.pdf
function barytherium(): ModelPart[] {
  const parts: ModelPart[] = [lobe("重兽低圆背而肩胯近等高的深重躯", hide, [0, 1.215, -0.26], [1.61, 1.71, 2.79]), tapered("重兽前胸到头部之间仍可辨的短粗颈", hide, [[0, 1.463, 0.76], [0, 1.67, 1.239]], [0.404, 0.302]), lobe("重兽无现代象高颅顶的长深头颅", hide, [0, 1.731, 1.591], [0.754, 0.753, 0.853]), lobe("重兽承托两对下门齿的厚长下颌联合", pale, [0, 1.406, 1.887], [0.548, 0.32, 0.624]), tapered("重兽吻部推定的短柔鼻和厚上唇", hide, [[0, 1.918, 1.88], [0, 1.848, 2.079], [0, 1.645, 2.166], [0.04, 1.557, 2.12]], [0.159, 0.145, 0.095, 0.038]), ...eyes([0, 1.881, 1.712], 0.28, 0.055), tapered("重兽较短且渐细的尾", hide, [[0, 1.207, -1.445], [0.062, 0.77, -1.724], [0.095, 0.434, -1.799]], [0.085, 0.051, 0.017])];
  for (const side of [-1, 1]) {
    parts.push(lobe("重兽头颅后方保守复原的小圆外耳", dark, [side * 0.296, 1.927, 1.26], [0.148, 0.247, 0.135]));
    for (const front of [true, false]) {
      const x = side * (front ? 0.509 : 0.515), z = front ? 0.697 : -1.052;
      parts.push(tapered("重兽粗壮且肘膝可辨的承重四肢", hide, [[x * 0.77, front ? 1.243 : 1.145, z], [x * 1.07, front ? 0.69 : 0.613, z + (front ? -0.079 : 0.159)], [x, 0.16, z + (front ? 0.138 : -0.107)]], [front ? 0.249 : 0.264, 0.174, 0.113]), lobe("重兽低宽而非现代象高柱状的完整掌垫", hide, [x, 0.104, z + (front ? 0.173 : -0.028)], [0.39, 0.207, front ? 0.45 : 0.542]));
      const nails: ModelPart[] = [];
      for (let index = -2; index <= 2; index++) nails.push(lobe("重兽足垫前缘分别连接的五枚短甲", dark, [x + index * 0.072, 0.073, z + (front ? 0.333 : 0.183) - Math.abs(index) * 0.02], [0.063, 0.101, 0.105]));
      parts.push(combineMeshes("重兽完整五趾低足的甲缘", dark, nails));
    }
    parts.push(tapered("重兽上颌中央门齿向前外侧弯出的短长牙", pale, [[side * 0.101, 1.642, 1.982], [side * 0.169, 1.576, 2.195], [side * 0.205, 1.591, 2.309]], [0.05, 0.036, 0.002]), tapered("重兽上颌侧门齿向两侧展开而非平行象牙", pale, [[side * 0.239, 1.637, 1.904], [side * 0.444, 1.66, 2.039], [side * 0.571, 1.73, 2.095]], [0.059, 0.04, 0.002]));
    for (const inner of [true, false]) { const x = side * (inner ? 0.091 : 0.207); parts.push(tapered("重兽每侧两枚相邻接触咬合的下门齿长牙", pale, [[x, 1.427, 1.999], [x * 1.17, 1.496, 2.198], [x * 1.22, 1.578, inner ? 2.32 : 2.29]], [inner ? 0.057 : 0.043, inner ? 0.038 : 0.028, 0.002])); }
  }
  return parts;
}

// https://doi.org/10.5479/si.00810266.83.99
// https://db.kahaku.go.jp/exh/detail?cls=col_z1_01&pkey=1759892
// ACT: 承重姿态按Domning关节重建，保留略外展肘及较外展膝，不采用腕背着地的旧蛙式装架。
function paleoparadoxia(): ModelPart[] {
  const parts: ModelPart[] = [body("古异兽前后收束而胸腰长拱的束柱类躯", [[-0.68, 0.504, 0.216, 0.26], [-0.37, 0.563, 0.383, 0.354], [0.067, 0.594, 0.369, 0.378], [0.403, 0.564, 0.24, 0.288]], hide), tapered("古异兽较收束而前探的低颈", hide, [[0, 0.608, 0.324], [0, 0.559, 0.717]], [0.201, 0.14]), body("古异兽后脑宽而颌面窄长的低平头", [[0.651, 0.598, 0.169, 0.145], [0.863, 0.596, 0.185, 0.166], [1.101, 0.552, 0.138, 0.124], [1.223, 0.512, 0.081, 0.069]], hide), lobe("古异兽颏部向前下转且不具海豹兽球形后牙囊的长下颌", pale, [0, 0.398, 0.984], [0.31, 0.18, 0.596]), ...eyes([0, 0.704, 0.841], 0.147, 0.03), tapered("古异兽与下斜骨盆连接的短尾", hide, [[0, 0.46, -0.664], [0.035, 0.304, -0.88], [0.056, 0.201, -0.972]], [0.053, 0.032, 0.01])];
  for (const side of [-1, 1]) {
    parts.push(tapered("古异兽略外展肘下向前的前臂承重链", hide, [[side * 0.225, 0.563, 0.275], [side * 0.381, 0.34, 0.296], [side * 0.358, 0.123, 0.509]], [0.108, 0.085, 0.051]), tapered("古异兽明显外展的股部和前收后踝", hide, [[side * 0.217, 0.495, -0.439], [side * 0.431, 0.323, -0.312], [side * 0.386, 0.112, -0.58]], [0.132, 0.089, 0.051]));
    for (const front of [true, false]) {
      const x = side * (front ? 0.358 : 0.386), z = front ? 0.509 : -0.58;
      parts.push(lobe("古异兽腕踝抬起而指趾远端承重的掌部", hide, [x, 0.092, z + 0.062], [0.217, 0.147, 0.242]));
      const digits: ModelPart[] = [], nails: ModelPart[] = [];
      for (let index = 0; index < 4; index++) {
        const toeX = x + (index - 1.5) * 0.047 + (front ? side * 0.032 : 0), end = z + 0.172 - Math.abs(index - 1.5) * 0.013;
        digits.push(tapered("古异兽四根功能趾由腕向前外侧或正前分开", hide, [[x + (index - 1.5) * 0.019, 0.101, z + 0.032], [toeX, 0.039, end]], [0.025, 0.017]));
        nails.push(lobe("古异兽趾端接地的小钝甲", dark, [toeX, 0.033, end + 0.016], [0.038, 0.049, 0.067]));
      }
      parts.push(combineMeshes("古异兽完整四功能指趾掌", hide, digits), combineMeshes("古异兽功能趾各自连接的甲端", dark, nails));
    }
    parts.push(lobe("古异兽位于长面后段上侧的鼻孔缘", dark, [side * 0.041, 0.691, 0.997], [0.032, 0.017, 0.038]), tapered("古异兽下颌前方斜上伸的短门齿", pale, [[side * 0.055, 0.412, 1.178], [side * 0.064, 0.457, 1.332]], [0.022, 0.001]), tapered("古异兽嘴侧前探并与门齿分开的犬齿", pale, [[side * 0.112, 0.468, 1.133], [side * 0.137, 0.496, 1.278]], [0.025, 0.001]));
  }
  return parts;
}

// https://palass.org/sites/default/files/media/publications/newsletters/number_53/number53.pdf
// https://research.amnh.org/paleontology/perissodactyl/evolution/groups/palaeotheriidae
function palaeotherium(): ModelPart[] {
  const parts: ModelPart[] = [lobe("古兽前高后低且后腰收束的厚马样长躯", hide, [0, 1.066, -0.148], [0.797, 0.95, 1.976], [-7, 0, 0]), lobe("古兽长前肢上方较高的强壮前肩", hide, [0, 1.268, 0.522], [0.748, 1.01, 0.846]), tapered("古兽完整骨架证实的长斜举颈而非旧貘式短颈", hide, [[0, 1.391, 0.578], [0, 1.702, 0.856], [0, 1.925, 1.152]], [0.249, 0.181, 0.129]), lobe("古兽细长面部和较高后脑的厚头颅", hide, [0, 1.943, 1.416], [0.42, 0.478, 0.773]), lobe("古兽深窄的长下颌", pale, [0, 1.731, 1.535], [0.307, 0.216, 0.632]), tapered("古兽缩短鼻骨处推定的短柔吻而非长象鼻", hide, [[0, 1.994, 1.646], [0, 1.919, 1.802], [0.023, 1.777, 1.817]], [0.084, 0.072, 0.025]), ...eyes([0, 2.039, 1.479], 0.153, 0.036), tapered("古兽较小而后垂的短尾", hide, [[0, 1.051, -0.979], [0.038, 0.662, -1.174], [0.066, 0.421, -1.202]], [0.048, 0.029, 0.01])];
  for (const side of [-1, 1]) {
    parts.push(leaf("古兽长头颅后方的圆长耳", pale, [side * 0.151, 2.09, 1.151], 0.127, 0.238, [-19, side * 17, -side * 19]));
    for (const front of [true, false]) {
      const x = side * (front ? 0.28 : 0.261), z = front ? 0.577 : -0.684;
      parts.push(tapered("古兽前长后短并保留长掌跖的分节腿", hide, [[x * 0.77, front ? 1.144 : 0.977, z], [x * 1.12, front ? 0.66 : 0.59, z + (front ? -0.076 : 0.115)], [x, 0.126, z + (front ? 0.103 : -0.126)]], [front ? 0.153 : 0.177, 0.087, 0.051]));
      const toes: ModelPart[] = [], hoof: ModelPart[] = [], rootZ = z + (front ? 0.103 : -0.126);
      for (let index = -1; index <= 1; index++) {
        const toeX = x + index * 0.065, endZ = rootZ + (index ? 0.123 : 0.169);
        toes.push(tapered("古兽三根主指趾各自伸到地面而非马的悬空副趾", hide, [[x + index * 0.024, 0.13, rootZ], [toeX, 0.052, endZ]], [index ? 0.036 : 0.044, index ? 0.027 : 0.034]));
        hoof.push(lobe("古兽三趾分别承重的独立短蹄甲", dark, [toeX, 0.041, endZ + 0.016], [index ? 0.058 : 0.076, 0.079, index ? 0.109 : 0.145]));
      }
      parts.push(combineMeshes("古兽完整三主趾足的指骨", hide, toes), combineMeshes("古兽三主趾均落地的蹄壳", dark, hoof));
    }
  }
  return parts;
}

// https://repository.si.edu/bitstreams/8903b7bb-7149-448b-bab6-00442daa1e44/download
// Aepycamelus altus的孤立跟骨不能承载完整体命名；实际完整材料按giraffinus处理，不再拆旧名。
function aepycamelus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("高足驼无额外驼峰而前高后低的窄深躯", hide, [0, 1.764, -0.161], [0.646, 0.831, 1.986], [-7, 0, 0]), lobe("高足驼颈根下窄而高的前胸", hide, [0, 1.955, 0.501], [0.567, 0.839, 0.729]), tapered("高足驼由强烈延长颈椎组成的细长S形颈", hide, [[0, 2.027, 0.588], [0, 2.401, 0.859], [0, 2.943, 1.061], [0, 3.221, 1.368]], [0.199, 0.153, 0.105, 0.082]), lobe("高足驼长掌跖之上相对很小且无骨角的骆驼形颅", hide, [0, 3.298, 1.577], [0.318, 0.377, 0.618]), lobe("高足驼高鼻面前方分开的厚上唇", pale, [0, 3.163, 1.827], [0.226, 0.213, 0.319]), lobe("高足驼长而细的下颌", hide, [0, 3.106, 1.616], [0.242, 0.159, 0.533]), ...eyes([0, 3.379, 1.611], 0.119, 0.033), tapered("高足驼后垂细尾与小尾端毛束", hide, [[0, 1.725, -1.023], [0.052, 1.229, -1.261], [0.093, 0.912, -1.32]], [0.048, 0.03, 0.011]), lobe("高足驼尾端独立的小毛束", dark, [0.093, 0.895, -1.32], [0.067, 0.184, 0.074])];
  for (const side of [-1, 1]) {
    parts.push(leaf("高足驼颅后小而直立的尖长耳", pale, [side * 0.107, 3.427, 1.339], 0.092, 0.197, [-15, side * 14, -side * 12]));
    for (const front of [true, false]) {
      const x = side * (front ? 0.247 : 0.231), z = front ? 0.588 : -0.663;
      parts.push(tapered("高足驼远长于颅底的掌跖长段与高肘膝细腿", hide, [[x * 0.76, front ? 1.925 : 1.733, z], [x * 1.07, front ? 1.176 : 1.085, z + (front ? -0.078 : 0.153)], [x, 0.327, z + (front ? 0.08 : -0.133)], [x, 0.115, z + (front ? 0.138 : -0.083)]], [0.103, 0.071, 0.039, 0.036]));
      const rootZ = z + (front ? 0.138 : -0.083), pads: ModelPart[] = [], nails: ModelPart[] = [];
      for (const toe of [-1, 1]) {
        pads.push(lobe("高足驼两趾下分别扩展而相接的低软垫", hide, [x + toe * 0.047, 0.048, rootZ + 0.073], [0.096, 0.092, 0.205], [0, toe * 13, 0]));
        nails.push(lobe("高足驼软垫前缘两枚小趾甲而非偶蹄硬壳", dark, [x + toe * 0.067, 0.064, rootZ + 0.16], [0.05, 0.067, 0.066], [0, toe * 13, 0]));
      }
      parts.push(combineMeshes("高足驼具有骆驼式低软垫的完整双趾足", hide, pads), combineMeshes("高足驼两枚分别接趾的小甲端", dark, nails));
    }
  }
  return parts;
}

// https://nhmu.utah.edu/articles/meet-father-cat-who-stalked-ancient-west
// https://ajsonline.org/api/v1/articles/60962-notes-on-the-bridger-eocene-carnivora.pdf
function patriofelis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("爱国兽低长腰腹和相对宽厚的胸躯", hide, [0, 0.46, -0.113], [0.655, 0.609, 1.297]), lobe("爱国兽短强前肢上方发达的厚肩", hide, [0, 0.509, 0.378], [0.624, 0.627, 0.625]), tapered("爱国兽连接深短头颅的短粗颈", hide, [[0, 0.568, 0.48], [0, 0.666, 0.762]], [0.171, 0.135]), lobe("爱国兽颧弓宽展而吻短的深厚头颅", hide, [0, 0.696, 0.935], [0.418, 0.434, 0.527]), lobe("爱国兽短而宽的上吻与唇", pale, [0, 0.602, 1.138], [0.296, 0.203, 0.269]), lobe("爱国兽低位深下颌与发达后颌支", hide, [0, 0.47, 1.002], [0.311, 0.197, 0.503]), ...eyes([0, 0.791, 0.977], 0.151, 0.035), tapered("爱国兽长低腰后连续延伸而非猫的细鞭尾", hide, [[0, 0.448, -0.658], [0.046, 0.333, -0.976], [0.101, 0.215, -1.358], [0.167, 0.143, -1.65]], [0.114, 0.09, 0.055, 0.021])];
  for (const side of [-1, 1]) {
    parts.push(lobe("爱国兽深颅后方的小圆耳", dark, [side * 0.162, 0.837, 0.746], [0.079, 0.103, 0.067]), lobe("爱国兽鼻唇正前方的短宽鼻端", dark, [side * 0.059, 0.636, 1.242], [0.099, 0.054, 0.021]));
    for (const front of [true, false]) {
      const x = side * (front ? 0.244 : 0.253), z = front ? 0.439 : -0.474;
      parts.push(tapered("爱国兽约等长而短厚的肱前臂或股胫骨段", hide, [[x * 0.74, front ? 0.489 : 0.451, z], [x * 1.12, 0.271, z + (front ? -0.057 : 0.089)], [x, 0.088, z + (front ? 0.093 : -0.08)]], [front ? 0.119 : 0.137, 0.088, 0.053]), lobe("爱国兽整个跟掌接地而非猫式高跗趾行的宽足", hide, [x, 0.061, z + (front ? 0.126 : -0.023)], [0.244, 0.12, 0.35]));
      const digits: ModelPart[] = [], claws: ModelPart[] = [], rootZ = z + (front ? 0.093 : -0.08);
      for (let index = -2; index <= 2; index++) {
        const toeX = x + index * 0.047, endZ = rootZ + 0.198 - Math.abs(index) * 0.025;
        digits.push(tapered("爱国兽足掌前侧五根分别连接的短粗指趾", hide, [[x + index * 0.017, 0.07, rootZ + 0.028], [toeX, 0.043, endZ]], [0.026, 0.017]));
        claws.push(tapered("爱国兽不假设猫式收缩鞘的外露短爪", pale, [[toeX, 0.044, endZ], [toeX, 0.055, endZ + 0.038], [toeX, 0.021, endZ + 0.064]], [0.016, 0.01, 0.001]));
      }
      parts.push(combineMeshes("爱国兽完整五指趾跖行掌", hide, digits), combineMeshes("爱国兽五指分别真实接掌的角质爪", pale, claws));
    }
    parts.push(tapered("爱国兽口侧短上犬齿而非剑齿虎加长牙", pale, [[side * 0.104, 0.596, 1.126], [side * 0.111, 0.491, 1.159], [side * 0.109, 0.469, 1.154]], [0.023, 0.014, 0.001]), tapered("爱国兽下犬齿与上牙分开接下颌", pale, [[side * 0.086, 0.491, 1.13], [side * 0.093, 0.561, 1.16]], [0.017, 0.001]));
  }
  return parts;
}

export const largeAncientMammalExpansionBatchThreeDesigns: MasterNatureDesign[] = [
  design("barytherium", "重兽", "动物", barytherium, ["Barytherium grave", "上两对下两对共八枚短门齿与低宽五趾足", "无现代象高顶头的短鼻深重躯", "骨学约束的完整软组织简化复原"]),
  design("paleoparadoxia", "古异兽", "动物", paleoparadoxia, ["Paleoparadoxia tabatai", "Palaeoparadoxia tabatai", "古奇兽", "拱胸腰下斜骨盆低长颌与远端支承的四功能趾", "骨学约束的完整软组织简化复原"]),
  design("palaeotherium", "古兽", "动物", palaeotherium, ["Palaeotherium magnum", "长斜颈高前肢斜背三主趾均承重", "缩鼻骨对应短柔吻的推定复原", "骨学约束的完整软组织简化复原"]),
  design("aepycamelus", "高足驼", "动物", aepycamelus, ["Aepycamelus giraffinus", "Alticamelus giraffinus", "极长颈椎及长于颅底的掌跖骨", "小颅无骨角无额外驼峰的细高躯及双趾软垫", "骨学约束的完整软组织简化复原"]),
  design("patriofelis", "爱国兽", "动物", patriofelis, ["Patriofelis ulta", "深短宽颅短强前臂低长腰及粗长尾", "前后五指趾宽掌全跖行与外露短爪", "骨学约束的完整软组织简化复原"]),
];
