import { combineMeshes, design, leaf, lobe, needle, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { calibrated, feet, foldedWings, head, tail } from "./birdExpansionBatchOne";
import { talonFeet } from "./birdExpansionBatchFive";

const feather = "#a6b19a";
const covert = "#849581";
const pale = "#cbd0b8";
const bare = "#b5ab8c";
const dark = "#596b5e";
const reconstruction = "灭绝鸟类骨学约束的简化软组织复原";

function runningPredatorFeet(parts: ModelPart[], hipHeight: number, gap: number, radius: number, length: number) {
  for (const side of [-1, 1]) {
    const ankle: Triple = [side * gap, radius * 1.2, 0.032];
    parts.push(tapered("骇鸟粗壮但保留跗间折角的承重腿", bare, [[side * gap * 0.83, hipHeight, 0.012], [side * gap, hipHeight * 0.53, -0.025], ankle], [radius * 1.5, radius, radius * 0.72]));
    const digits: ModelPart[] = [];
    for (let index = -1; index <= 1; index++) {
      const end: Triple = [ankle[0] + index * length * 0.35, radius * 0.72, ankle[2] + length * (index ? 0.83 : 1)];
      digits.push(tapered("骇鸟三枚承重而独立分开的前趾", bare, [ankle, [end[0], radius * 0.95, end[2] - length * 0.2], end], [radius * 0.58, radius * 0.38, radius * 0.26]), tapered("骇鸟末节真正曲下而非钝蹄的角质爪", dark, [end, [end[0], radius * 1.28, end[2] + length * 0.14], [end[0], radius * 0.75, end[2] + length * 0.28], [end[0], radius * 0.04, end[2] + length * 0.31]], [radius * 0.29, radius * 0.23, radius * 0.13, 0.0008]));
    }
    digits.push(tapered("骇鸟高置而缩短的后趾并非猛禽大后爪", bare, [ankle, [ankle[0] - side * length * 0.055, radius * 0.96, ankle[2] - length * 0.22]], [radius * 0.23, radius * 0.09]));
    parts.push(combineMeshes("骇鸟完整三前趾钩爪与退缩后趾", bare, digits));
  }
}

// https://www.floridamuseum.ufl.edu/florida-vertebrate-fossils/species/titanis-walleri/
function titanis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("泰坦鸟较狭长而高肩的奔走型胸躯", feather, [0, 0.765, -0.055], [0.48, 0.56, 0.66]), tapered("泰坦鸟前伸上举的强健弯颈", feather, [[0, 0.94, 0.205], [0, 1.115, 0.275], [0, 1.312, 0.412]], [0.118, 0.083, 0.066])];
  head(parts, [0, 1.366, 0.511], [0.2, 0.25, 0.375]);
  parts.push(body("泰坦鸟侧扁而上下高深的强钩嘴", [[0.646, 1.357, 0.047, 0.088], [0.749, 1.336, 0.045, 0.1], [0.817, 1.271, 0.027, 0.066], [0.802, 1.214, 0.002, 0.004]], bare), body("泰坦鸟不与上钩熔成一块的强下颌", [[0.64, 1.263, 0.035, 0.027], [0.749, 1.244, 0.031, 0.023], [0.782, 1.262, 0.003, 0.004]], bare));
  for (const side of [-1, 1]) {
    parts.push(lobe("按弱残翼解释而无虚构捕猎翼爪的短翼臂", covert, [side * 0.209, 0.86, -0.015], [0.11, 0.14, 0.225]));
    parts.push(combineMeshes("泰坦鸟小残翼边缘短羽", covert, Array.from({ length: 4 }, (_, index) => leaf("泰坦鸟不形成飞翼的短羽片", covert, [side * (0.2 + index * 0.008), 0.825, -0.04 - index * 0.017], 0.033, 0.12 - index * 0.008, [-112, side * index * 3, 0]))));
  }
  tail(parts, [0, 0.535, -0.325], 0.19, 0.16, -105);
  runningPredatorFeet(parts, 0.545, 0.128, 0.032, 0.19);
  return parts;
}

// https://doi.org/10.1590/S0031-10492003000400001
function paraphysornis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("副骇鸟短腰而极宽深的重型胸腹", feather, [0, 1, -0.075], [0.78, 0.95, 0.98]), tapered("副骇鸟承托巨颅的短粗而前弯的颈", feather, [[0, 1.18, 0.29], [0, 1.477, 0.435], [0, 1.674, 0.608]], [0.235, 0.16, 0.105])];
  head(parts, [0, 1.781, 0.737], [0.32, 0.38, 0.55]);
  parts.push(body("副骇鸟极厚根且强内钩的大深嘴", [[0.936, 1.767, 0.077, 0.131], [1.088, 1.73, 0.071, 0.151], [1.2, 1.63, 0.041, 0.102], [1.186, 1.522, 0.003, 0.006]], bare), body("副骇鸟独立而宽深的强下颌", [[0.928, 1.611, 0.061, 0.044], [1.094, 1.573, 0.052, 0.038], [1.151, 1.603, 0.004, 0.006]], bare));
  for (const side of [-1, 1]) {
    parts.push(lobe("副骇鸟在巨大胸侧几乎退缩的短翼", covert, [side * 0.337, 1.17, 0.005], [0.14, 0.17, 0.29]));
    parts.push(combineMeshes("副骇鸟残翼上短而圆的覆羽", covert, Array.from({ length: 4 }, (_, index) => leaf("副骇鸟小残翼覆羽片", covert, [side * (0.325 + index * 0.01), 1.12, -0.055 - index * 0.02], 0.047, 0.17 - index * 0.013, [-110, side * index * 3, 0]))));
  }
  tail(parts, [0, 0.715, -0.47], 0.28, 0.2, -106);
  runningPredatorFeet(parts, 0.665, 0.2, 0.048, 0.245);
  return parts;
}

// https://www.gfbs-home.de/fileadmin/user_upload/ode2mods/ode/ode15/ode15_0609/article.pdf
function palaelodus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("古红鹳比火烈鸟更深而紧凑的水禽躯", feather, [0, 0.335, -0.025], [0.23, 0.27, 0.37]), tapered("古红鹳较短而前上弯起的细颈", pale, [[0, 0.42, 0.12], [0, 0.56, 0.125], [0, 0.687, 0.208]], [0.042, 0.028, 0.023])];
  head(parts, [0, 0.724, 0.242], [0.085, 0.097, 0.126], pale);
  parts.push(body("古红鹳不具火烈鸟折角的浅直喙", [[0.288, 0.709, 0.012, 0.016], [0.34, 0.701, 0.01, 0.012], [0.366, 0.697, 0.001, 0.0015]], bare));
  foldedWings(parts, [0, 0.39, -0.03], 0.24, 0.3);
  tail(parts, [0, 0.24, -0.18], 0.13, 0.1, -107);
  feet(parts, [0, 0.235, 0.005], 0.059, 0.009, 0.09, { web: 0.82 });
  return parts;
}

// https://www.app.pan.pl/archive/published/app64/app006502019.html
function palaeotis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("古鸨前胸较窄而腰腹长的细型奔走躯", feather, [0, 0.37, -0.025], [0.235, 0.3, 0.355]), tapered("古鸨向前上举而不长成巨恐鸟的细颈", feather, [[0, 0.467, 0.1], [0, 0.6, 0.128], [0, 0.699, 0.208]], [0.047, 0.032, 0.025])];
  head(parts, [0, 0.735, 0.246], [0.087, 0.101, 0.141]);
  parts.push(body("古鸨小头前狭长而近直的尖喙", [[0.297, 0.72, 0.012, 0.015], [0.358, 0.711, 0.009, 0.011], [0.39, 0.704, 0.001, 0.0015]], bare));
  for (const side of [-1, 1]) {
    parts.push(lobe("古鸨仍保留但缩短的残翼臂", covert, [side * 0.107, 0.418, -0.025], [0.075, 0.11, 0.17]));
    parts.push(combineMeshes("古鸨残翼边缘的短覆羽", covert, Array.from({ length: 4 }, (_, index) => leaf("古鸨短而密的翼羽", covert, [side * (0.1 + index * 0.006), 0.393, -0.03 - index * 0.014], 0.029, 0.11 - index * 0.007, [-112, side * index * 3, 0]))));
  }
  tail(parts, [0, 0.265, -0.175], 0.1, 0.095, -104);
  feet(parts, [0, 0.26, 0.005], 0.06, 0.011, 0.075, { hindToe: false });
  return parts;
}

// https://tarpits.org/stories/meet-teratorn-largest-bird-found-la-brea-tar-pits
function merriamsTeratorn(): ModelPart[] {
  const parts: ModelPart[] = [lobe("梅里氏畸鸟宽肩而腹部收紧的巨型滑翔躯", feather, [0, 0.39, -0.04], [0.38, 0.43, 0.55]), tapered("畸鸟支承长颅嘴的短粗颈", feather, [[0, 0.54, 0.155], [0, 0.677, 0.23]], [0.072, 0.047])];
  head(parts, [0, 0.73, 0.292], [0.157, 0.18, 0.23]);
  parts.push(body("畸鸟较长而末端强下钩的捕食嘴", [[0.375, 0.707, 0.029, 0.039], [0.463, 0.695, 0.027, 0.042], [0.523, 0.652, 0.013, 0.027], [0.512, 0.619, 0.0015, 0.003]], bare));
  for (const side of [-1, 1]) {
    parts.push(membrane("畸鸟宽大而外端成指的三米级滑翔翼", covert, [[side * 0.13, 0.54, 0.075], [side * 0.61, 0.69, 0.13], [side * 1.41, 0.64, -0.08], [side * 1.81, 0.48, -0.31], [side * 0.96, 0.27, -0.48], [side * 0.135, 0.215, -0.26]]));
    parts.push(combineMeshes("畸鸟大翼外段分开的粗长飞羽", covert, Array.from({ length: 14 }, (_, index) => leaf("畸鸟宽飞羽末端真实分缘", covert, [side * (0.46 + index * 0.096), 0.49 - index * 0.005, -0.025 - index * 0.013], 0.126, 0.38 - index * 0.008, [-113, -side * (index * 2.5 + 4), 0]))));
  }
  tail(parts, [0, 0.235, -0.27], 0.24, 0.25, -105);
  feet(parts, [0, 0.22, 0.02], 0.09, 0.018, 0.12);
  return parts;
}

// https://doi.org/10.1093/zoolinnean/zlae086
function rodriguesSolitaire(): ModelPart[] {
  const parts: ModelPart[] = [lobe("罗德里格斯孤鸽较直立而肩部厚实的失飞鸽躯", feather, [0, 0.43, -0.03], [0.47, 0.54, 0.51]), tapered("孤鸽长于渡渡鸟而向前弯举的细颈", feather, [[0, 0.575, 0.13], [0, 0.747, 0.18], [0, 0.86, 0.254]], [0.08, 0.052, 0.035])];
  head(parts, [0, 0.91, 0.296], [0.128, 0.145, 0.179]);
  parts.push(body("孤鸽小头前较细长而微下钩的喙", [[0.36, 0.892, 0.018, 0.024], [0.426, 0.876, 0.015, 0.022], [0.451, 0.849, 0.0015, 0.003]], bare));
  for (const side of [-1, 1]) {
    parts.push(lobe("孤鸽仍能举起搏击的短厚翼臂", covert, [side * 0.207, 0.505, -0.01], [0.15, 0.17, 0.28]), lobe("孤鸽腕掌部真实骨瘤而不是尖骨距", bare, [side * 0.264, 0.546, 0.079], [0.05, 0.055, 0.051]));
    parts.push(combineMeshes("孤鸽短翼上宽短而退缩的覆羽", covert, Array.from({ length: 5 }, (_, index) => leaf("孤鸽残翼短羽", covert, [side * (0.19 + index * 0.011), 0.47 - index * 0.004, -0.035 - index * 0.016], 0.049, 0.17 - index * 0.008, [-111, side * index * 3, 0]))));
  }
  parts.push(lobe("孤鸽后端短而紧凑的圆尾覆羽簇", covert, [0, 0.285, -0.254], [0.15, 0.14, 0.13]));
  feet(parts, [0, 0.24, 0.005], 0.098, 0.021, 0.13);
  return parts;
}

// https://zenodo.org/records/5088220
function broadBilledParrot(): ModelPart[] {
  const parts: ModelPart[] = [lobe("毛里求斯宽嘴鹦鹉较小躯体和深圆胸腹", feather, [0, 0.25, -0.025], [0.24, 0.32, 0.3]), lobe("巨大头颅下方短而粗的有羽颈", feather, [0, 0.402, 0.071], [0.15, 0.19, 0.155])];
  head(parts, [0, 0.535, 0.128], [0.23, 0.23, 0.235]);
  parts.push(body("宽嘴鹦鹉有巨大咬合基部的深宽上钩喙", [[0.214, 0.52, 0.051, 0.062], [0.28, 0.498, 0.045, 0.061], [0.31, 0.453, 0.023, 0.035], [0.295, 0.424, 0.002, 0.004]], bare), body("宽嘴鹦鹉宽而厚的独立下颌", [[0.213, 0.453, 0.035, 0.026], [0.264, 0.448, 0.029, 0.024], [0.286, 0.468, 0.005, 0.007]], bare));
  parts.push(combineMeshes("位于前额而不长成后披凤头的短羽冠", covert, Array.from({ length: 9 }, (_, index) => leaf("宽嘴鹦鹉短而宽的前额冠羽", covert, [(index - 4) * 0.008, 0.626, 0.172], 0.027, 0.083 - Math.abs(index - 4) * 0.006, [18, (index - 4) * 5, -(index - 4) * 4]))));
  foldedWings(parts, [0, 0.319, -0.03], 0.25, 0.27);
  parts.push(combineMeshes("中央两枚更长的宽嘴鹦鹉完整阶梯长尾", covert, Array.from({ length: 10 }, (_, index) => { const t = (index - 4.5) / 4.5; return leaf("宽嘴鹦鹉长而有分缘的阶尾羽", covert, [t * 0.033, 0.14, -0.14], 0.046, 0.355 - Math.abs(t) * 0.14, [-99, -t * 8, 0]); })));
  talonFeet(parts, [0, 0.11, 0.015], 0.058, 0.0115, 0.059, true);
  return parts;
}

// https://mapress.com/zootaxa/2015/f/z04032p514f.pdf
function lithornis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("石板鸟有发达飞翼而腰腹修长的古颚躯", feather, [0, 0.19, -0.025], [0.18, 0.235, 0.295]), tapered("石板鸟向前上举的中长细颈", feather, [[0, 0.27, 0.085], [0, 0.37, 0.127]], [0.035, 0.024])];
  head(parts, [0, 0.406, 0.16], [0.087, 0.098, 0.127]);
  parts.push(body("石板鸟不同于短嘴䳍类的狭长直探喙", [[0.206, 0.392, 0.011, 0.014], [0.266, 0.382, 0.008, 0.01], [0.303, 0.373, 0.001, 0.0015]], bare));
  for (const side of [-1, 1]) {
    parts.push(membrane("石板鸟能飞行而完整宽展的羽翼", covert, [[side * 0.06, 0.255, 0.05], [side * 0.2, 0.33, 0.09], [side * 0.4, 0.27, -0.03], [side * 0.465, 0.19, -0.14], [side * 0.25, 0.12, -0.22], [side * 0.065, 0.115, -0.135]]));
    parts.push(combineMeshes("石板鸟完整翼缘的飞羽", covert, Array.from({ length: 9 }, (_, index) => leaf("石板鸟宽飞翼上相叠的羽端", covert, [side * (0.15 + index * 0.034), 0.215 - index * 0.004, -0.03 - index * 0.01], 0.047, 0.18 - index * 0.006, [-115, -side * index * 3, 0]))));
  }
  tail(parts, [0, 0.12, -0.145], 0.13, 0.13, -104);
  talonFeet(parts, [0, 0.1, 0.012], 0.042, 0.0075, 0.057);
  return parts;
}

// https://www.nature.com/articles/s41586-018-0053-y
function ichthyornis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鱼鸟短胸而水平修长的小型海鸟躯", feather, [0, 0.12, -0.02], [0.12, 0.15, 0.22]), tapered("鱼鸟小而前伸的短羽颈", feather, [[0, 0.173, 0.065], [0, 0.239, 0.106]], [0.025, 0.018])];
  head(parts, [0, 0.268, 0.137], [0.075, 0.082, 0.115]);
  parts.push(body("鱼鸟长颌后段容纳牙齿而前端小角质喙无齿", [[0.179, 0.254, 0.011, 0.012], [0.235, 0.25, 0.009, 0.009], [0.263, 0.246, 0.004, 0.004]], bare), body("鱼鸟与上颌分开的具齿细下颌", [[0.178, 0.233, 0.009, 0.004], [0.232, 0.232, 0.007, 0.0035], [0.261, 0.24, 0.003, 0.002]], bare));
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 12; index++) { const z = 0.183 + index * 0.0047; teeth.push(needle("鱼鸟上颌后段小而尖的真实牙", pale, [side * 0.0083, 0.242, z], [side * 0.008, 0.2402, z + 0.0004], 0.0013), needle("鱼鸟下颌小牙和无齿端喙之间的分界", pale, [side * 0.0068, 0.236, z], [side * 0.0065, 0.2378, z + 0.0003], 0.0012)); }
  parts.push(combineMeshes("鱼鸟只在颌后段排列而不覆盖喙尖的双颌牙列", pale, teeth));
  for (const side of [-1, 1]) {
    parts.push(membrane("鱼鸟窄而尖的近现代海鸟飞翼", covert, [[side * 0.04, 0.17, 0.04], [side * 0.135, 0.225, 0.07], [side * 0.285, 0.19, -0.035], [side * 0.34, 0.13, -0.13], [side * 0.14, 0.09, -0.155], [side * 0.043, 0.075, -0.095]]));
    parts.push(combineMeshes("鱼鸟尖翼后缘的狭羽", covert, Array.from({ length: 7 }, (_, index) => leaf("鱼鸟小海鸟式翼缘飞羽", covert, [side * (0.082 + index * 0.034), 0.145 - index * 0.004, -0.02 - index * 0.01], 0.029, 0.125 - index * 0.007, [-113, -side * index * 2, 0]))));
  }
  tail(parts, [0, 0.075, -0.12], 0.08, 0.06, -102);
  feet(parts, [0, 0.065, -0.035], 0.033, 0.0055, 0.041, { web: 0.93 });
  return parts;
}

// https://www.ivpp.ac.cn/sourcedb/zw/rck/jcqn/202209/P020120604487246117190.pdf
function sapeornis(): ModelPart[] {
  const parts: ModelPart[] = [lobe("朝阳会鸟短腰而胸部宽厚的基干鸟躯", feather, [0, 0.13, -0.02], [0.143, 0.18, 0.22]), tapered("会鸟短而上举的羽颈", feather, [[0, 0.187, 0.061], [0, 0.255, 0.1]], [0.028, 0.021])];
  head(parts, [0, 0.287, 0.128], [0.084, 0.092, 0.113]);
  parts.push(body("会鸟适于取食种子的短厚上颌", [[0.169, 0.274, 0.013, 0.016], [0.209, 0.266, 0.012, 0.013], [0.224, 0.259, 0.003, 0.004]], bare), body("会鸟与上颌分离的较细下颌", [[0.168, 0.247, 0.008, 0.005], [0.205, 0.243, 0.006, 0.004], [0.222, 0.251, 0.002, 0.002]], bare));
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) {
    for (let index = 0; index < 7; index++) teeth.push(needle("会鸟上颌较粗而非食鱼细针的真实牙", pale, [side * 0.009, 0.258 - index * 0.0006, 0.175 + index * 0.006], [side * 0.0088, 0.249 - index * 0.0006, 0.177 + index * 0.006], 0.0027));
    for (let index = 0; index < 2; index++) teeth.push(needle("会鸟具齿个体保留的两枚小下颌牙", pale, [side * 0.006, 0.249, 0.176 + index * 0.009], [side * 0.0057, 0.254, 0.177 + index * 0.009], 0.0016));
  }
  parts.push(combineMeshes("会鸟并未把上下颌全部无齿化的种子食性齿列", pale, teeth));
  for (const side of [-1, 1]) {
    parts.push(membrane("会鸟与小躯相比十分宽大的原始飞翼", covert, [[side * 0.045, 0.19, 0.04], [side * 0.19, 0.27, 0.09], [side * 0.39, 0.24, -0.03], [side * 0.47, 0.16, -0.15], [side * 0.24, 0.085, -0.23], [side * 0.05, 0.075, -0.13]]));
    parts.push(combineMeshes("会鸟宽飞翼的相叠长飞羽", covert, Array.from({ length: 10 }, (_, index) => leaf("会鸟宽翼真实分缘羽片", covert, [side * (0.12 + index * 0.035), 0.18 - index * 0.004, -0.02 - index * 0.011], 0.045, 0.18 - index * 0.005, [-114, -side * index * 2.5, 0]))));
    parts.push(tapered("会鸟在翼前缘仍游离的第一手指", bare, [[side * 0.135, 0.234, 0.075], [side * 0.166, 0.251, 0.106]], [0.004, 0.0028]), tapered("会鸟第一手指端真实弯曲的小爪", dark, [[side * 0.166, 0.251, 0.106], [side * 0.18, 0.247, 0.12], [side * 0.182, 0.235, 0.122]], [0.0029, 0.0018, 0.0005]));
    parts.push(combineMeshes("会鸟腿侧保留的长羽片而非裸腿", feather, Array.from({ length: 4 }, (_, index) => leaf("会鸟后肢外围的分离长羽", feather, [side * 0.037, 0.095 - index * 0.008, -0.012], 0.018, 0.1 - index * 0.009, [-140, side * (index * 6 + 10), 0]))));
  }
  tail(parts, [0, 0.08, -0.12], 0.09, 0.11, -102);
  talonFeet(parts, [0, 0.065, 0.005], 0.032, 0.005, 0.037);
  return parts;
}

export const birdExpansionBatchSixteenDesigns: MasterNatureDesign[] = [
  design("titanis", "泰坦鸟", "动物", titanis, ["Titanis walleri", reconstruction, "约一点五米高的弱残翼奔走骇鸟"]),
  design("paraphysornis", "副骇鸟", "动物", paraphysornis, ["Paraphysornis brasiliensis", reconstruction, "宽深重躯短粗颈巨钩嘴"]),
  design("palaelodus", "古红鹳", "动物", palaelodus, ["Palaelodus ambiguus", reconstruction, "高腿蹼足与无折角直喙"]),
  design("palaeotis", "古鸨", "动物", palaeotis, ["Palaeotis weigelti", "Palaeogrus geiseltalensis", reconstruction, "细长奔走躯与短残翼"]),
  design("merriamsTeratorn", "梅里氏畸鸟", "动物", merriamsTeratorn, ["Teratornis merriami", reconstruction, "宽展巨翔翼与长头钩喙"]),
  design("rodriguesSolitaire", "罗德里格斯孤鸽", "动物", rodriguesSolitaire, ["Pezophaps solitaria", reconstruction, "细长颈小头与腕掌骨瘤"]),
  design("broadBilledParrot", "毛里求斯宽嘴鹦鹉", "动物", () => calibrated(broadBilledParrot(), 0.8), ["Lophopsittacus mauritianus", reconstruction, "巨大头颅深宽嘴与额冠长阶尾"]),
  design("lithornis", "石板鸟", "动物", () => calibrated(lithornis(), 0.78), ["Lithornis vulturinus", "Promusophaga", reconstruction, "发达飞翼长直嘴和栖枝长后趾"]),
  design("ichthyornis", "鱼鸟", "动物", () => calibrated(ichthyornis(), 0.64), ["Ichthyornis dispar", reconstruction, "只限颌尖的无齿角质喙与后段双颌小牙"]),
  design("sapeornis", "朝阳会鸟", "动物", sapeornis, ["Sapeornis chaoyangensis", reconstruction, "宽长飞翼游离爪指与具齿种子食性颌"]),
];
