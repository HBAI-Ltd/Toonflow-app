import { combineMeshes, design, leaf, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { calibrated, feet, foldedWings, head } from "./birdExpansionBatchOne";
import { talonFeet } from "./birdExpansionBatchFive";
import { curvedFeather } from "./birdExpansionBatchTwelve";

const feather = "#a5b39a";
const covert = "#829481";
const pale = "#ccd0b8";
const bare = "#b4ab8e";
const dark = "#596b60";

// https://parrots.org/encyclopedia/sulphur-crested-cockatoo/
function sulphurCrestedCockatoo(): ModelPart[] {
  const parts: ModelPart[] = [lobe("硫冠凤头鹦鹉直立而深胸的宽躯", pale, [0, 0.23, -0.025], [0.2, 0.29, 0.3]), lobe("硫冠凤头鹦鹉连接大头的短粗羽颈", pale, [0, 0.355, 0.07], [0.125, 0.185, 0.14])];
  head(parts, [0, 0.449, 0.124], [0.14, 0.16, 0.165], pale);
  parts.push(body("硫冠凤头鹦鹉高而紧凑的上喙钩", [[0.183, 0.432, 0.026, 0.035], [0.224, 0.424, 0.022, 0.032], [0.249, 0.396, 0.012, 0.021], [0.237, 0.375, 0.001, 0.002]], dark), body("硫冠凤头鹦鹉留有真实嘴缝的短下颌", [[0.179, 0.392, 0.02, 0.015], [0.218, 0.388, 0.016, 0.013], [0.233, 0.399, 0.002, 0.003]], bare));
  const crest: ModelPart[] = [];
  for (let index = 0; index < 11; index++) { const x = (index - 5) * 0.0027; crest.push(curvedFeather("硫冠凤头鹦鹉朝前弯曲的窄长冠羽", feather, [[x, 0.503, 0.094 - index % 2 * 0.006], [x * 1.15, 0.567 + index % 3 * 0.005, 0.132], [x * 1.2, 0.592 + index % 2 * 0.006, 0.192], [x, 0.576, 0.223 - Math.abs(index - 5) * 0.005]], [0.007, 0.015, 0.014, 0.0012])); }
  parts.push(combineMeshes("从后冠伸起再向额前弯的细长硫冠", feather, crest));
  foldedWings(parts, [0, 0.295, -0.035], 0.21, 0.265);
  parts.push(combineMeshes("硫冠凤头鹦鹉短宽且端部近齐平的方尾", pale, Array.from({ length: 9 }, (_, index) => { const x = (index - 4) * 0.014; return curvedFeather("硫冠凤头鹦鹉短方尾独立羽", pale, [[x * 0.6, 0.142, -0.15], [x, 0.112, -0.245], [x * 1.1, 0.071, -0.335 + Math.abs(index - 4) * 0.003]], [0.024, 0.035, 0.018]); })));
  talonFeet(parts, [0, 0.105, 0.018], 0.047, 0.01, 0.045, true);
  return parts;
}

// https://perthzoo.wa.gov.au/animal/Pink-Cockatoo
function pinkCockatoo(): ModelPart[] {
  const parts: ModelPart[] = [lobe("粉红凤头鹦鹉比硫冠更短腰而宽腹的躯体", feather, [0, 0.205, -0.024], [0.22, 0.265, 0.275]), lobe("粉红凤头鹦鹉缩入肩部的短颈", feather, [0, 0.317, 0.057], [0.135, 0.145, 0.143])];
  head(parts, [0, 0.397, 0.099], [0.142, 0.147, 0.158], pale);
  parts.push(body("粉红凤头鹦鹉较短而宽厚的角质上颌", [[0.158, 0.382, 0.027, 0.032], [0.198, 0.375, 0.022, 0.029], [0.214, 0.344, 0.011, 0.02], [0.204, 0.328, 0.001, 0.002]], bare), body("粉红凤头鹦鹉独立短下颌", [[0.155, 0.346, 0.02, 0.015], [0.187, 0.34, 0.014, 0.01], [0.204, 0.352, 0.002, 0.002]], bare));
  const fan: ModelPart[] = [];
  for (let index = 0; index < 15; index++) { const angle = (-62 + index * 8.5) * Math.PI / 180, x = (index % 3 - 1) * 0.006; fan.push(curvedFeather("粉红凤头鹦鹉展开成宽扇而非窄弧束的冠羽", pale, [[x, 0.449, 0.091], [x, 0.449 + Math.cos(angle) * 0.085, 0.091 + Math.sin(angle) * 0.085], [x, 0.449 + Math.cos(angle) * 0.158, 0.091 + Math.sin(angle) * 0.158]], [0.008, 0.022, 0.005])); }
  parts.push(combineMeshes("粉红凤头鹦鹉沿头顶前后展开的宽扇形羽冠", pale, fan));
  foldedWings(parts, [0, 0.261, -0.025], 0.23, 0.23);
  parts.push(combineMeshes("粉红凤头鹦鹉中短且宽圆的尾羽", pale, Array.from({ length: 9 }, (_, index) => { const t = index - 4; return curvedFeather("粉红凤头鹦鹉圆尾羽", pale, [[t * 0.008, 0.122, -0.136], [t * 0.014, 0.103, -0.222], [t * 0.017, 0.072, -0.291 + Math.abs(t) * 0.008]], [0.02, 0.032, 0.014]); })));
  talonFeet(parts, [0, 0.094, 0.018], 0.046, 0.009, 0.044, true);
  return parts;
}

// https://australian.museum/learn/animals/birds/gang-gang-cockatoo/
function gangGangCockatoo(): ModelPart[] {
  const parts: ModelPart[] = [lobe("红头凤头鹦鹉横厚胸和很短腰的紧凑躯", covert, [0, 0.178, -0.026], [0.205, 0.22, 0.267]), lobe("红头凤头鹦鹉几乎收在肩内的短粗颈", feather, [0, 0.273, 0.051], [0.136, 0.13, 0.142])];
  head(parts, [0, 0.339, 0.094], [0.138, 0.137, 0.15], feather);
  parts.push(body("红头凤头鹦鹉短粗而宽基的上颌", [[0.15, 0.325, 0.024, 0.03], [0.187, 0.319, 0.021, 0.027], [0.204, 0.292, 0.01, 0.02], [0.192, 0.278, 0.001, 0.002]], bare), body("红头凤头鹦鹉短下颌", [[0.148, 0.292, 0.017, 0.013], [0.177, 0.288, 0.013, 0.01], [0.194, 0.3, 0.002, 0.002]], bare));
  const curls: ModelPart[] = [];
  for (let index = 0; index < 11; index++) { const x = (index - 5) * 0.004; curls.push(tapered("红头凤头鹦鹉真正向前翻卷的细丝冠轴", feather, [[x, 0.39, 0.081], [x * 1.2, 0.432 + index % 2 * 0.008, 0.099], [x * 1.15, 0.443 + index % 2 * 0.007, 0.137], [x, 0.417, 0.159]], [0.0025, 0.0021, 0.0018, 0.0008])); }
  parts.push(combineMeshes("红头凤头鹦鹉与直冠不同的前卷丝状羽冠", feather, curls));
  foldedWings(parts, [0, 0.225, -0.027], 0.225, 0.225);
  parts.push(combineMeshes("红头凤头鹦鹉很短而端齐的宽方尾", covert, Array.from({ length: 9 }, (_, index) => { const t = index - 4; return curvedFeather("红头凤头鹦鹉短方尾羽", covert, [[t * 0.009, 0.105, -0.132], [t * 0.015, 0.092, -0.213], [t * 0.017, 0.069, -0.265 + Math.abs(t) * 0.002]], [0.022, 0.034, 0.02]); })));
  talonFeet(parts, [0, 0.079, 0.012], 0.047, 0.0085, 0.041, true);
  return parts;
}

// https://parrots.org/encyclopedia/cockatiel/
function cockatiel(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鸡尾鹦鹉纤窄而长腰的小躯", feather, [0, 0.135, -0.016], [0.105, 0.188, 0.19]), tapered("鸡尾鹦鹉没有厚肩掩埋的细长羽颈", feather, [[0, 0.203, 0.043], [0, 0.268, 0.074]], [0.025, 0.019])];
  head(parts, [0, 0.294, 0.09], [0.08, 0.09, 0.098], pale);
  parts.push(body("鸡尾鹦鹉很小的下弯短喙", [[0.126, 0.284, 0.012, 0.016], [0.15, 0.277, 0.01, 0.013], [0.157, 0.258, 0.001, 0.002]], bare), body("鸡尾鹦鹉短下颌", [[0.124, 0.263, 0.009, 0.008], [0.145, 0.263, 0.006, 0.006], [0.152, 0.269, 0.001, 0.001]], bare));
  parts.push(combineMeshes("鸡尾鹦鹉由细尖长羽组成的直立冠而非宽凤冠", pale, Array.from({ length: 9 }, (_, index) => { const x = (index - 4) * 0.002; return curvedFeather("鸡尾鹦鹉细尖竖冠羽", pale, [[x, 0.326, 0.077], [x, 0.385 - Math.abs(index - 4) * 0.006, 0.055], [x, 0.422 - Math.abs(index - 4) * 0.013, 0.039]], [0.004, 0.007, 0.0008]); })));
  foldedWings(parts, [0, 0.18, -0.019], 0.113, 0.181);
  parts.push(combineMeshes("鸡尾鹦鹉远超躯长的窄尖阶尾", covert, Array.from({ length: 9 }, (_, index) => { const t = index - 4, end = -0.343 + Math.abs(t) * 0.035; return curvedFeather("鸡尾鹦鹉逐级缩短的细尾羽", covert, [[t * 0.004, 0.088, -0.094], [t * 0.007, 0.068, (-0.094 + end) * 0.5], [t * 0.009, 0.035, end]], [0.012, 0.019, 0.001]); })));
  talonFeet(parts, [0, 0.063, 0.008], 0.026, 0.0055, 0.029, true);
  return parts;
}

// https://australian.museum/learn/animals/birds/red-tailed-black-cockatoo-calyptorhynchus-banksii/
function redTailedBlackCockatoo(): ModelPart[] {
  const parts: ModelPart[] = [lobe("红尾黑凤头鹦鹉沉厚而长胸的宽躯", covert, [0, 0.275, -0.027], [0.25, 0.345, 0.35]), lobe("红尾黑凤头鹦鹉连接重头的粗短颈", covert, [0, 0.43, 0.077], [0.17, 0.21, 0.175])];
  head(parts, [0, 0.536, 0.135], [0.165, 0.18, 0.188], covert);
  parts.push(body("红尾黑凤头鹦鹉宽高而尖端内卷的深钳喙", [[0.204, 0.521, 0.034, 0.046], [0.248, 0.511, 0.03, 0.044], [0.275, 0.476, 0.016, 0.029], [0.26, 0.451, 0.0015, 0.002]], dark), body("红尾黑凤头鹦鹉承受坚果的厚下颌", [[0.201, 0.468, 0.026, 0.02], [0.24, 0.464, 0.021, 0.018], [0.259, 0.48, 0.002, 0.003]], bare));
  parts.push(combineMeshes("红尾黑凤头鹦鹉短而蓬宽的后倾冠羽", covert, Array.from({ length: 13 }, (_, index) => { const t = index - 6; return leaf("红尾黑凤头鹦鹉宽端而非丝状的冠羽", covert, [t * 0.005, 0.596, 0.105 - index % 2 * 0.01], 0.023, 0.09 + (1 - Math.abs(t) / 6) * 0.026, [-29 - index % 3 * 6, t * 5, -t * 2.5]); })));
  foldedWings(parts, [0, 0.351, -0.037], 0.26, 0.33);
  parts.push(combineMeshes("红尾黑凤头鹦鹉不同于短方尾凤头的长宽尾", covert, Array.from({ length: 11 }, (_, index) => { const t = index - 5; return curvedFeather("红尾黑凤头鹦鹉宽而长的整枚尾羽", covert, [[t * 0.01, 0.165, -0.19], [t * 0.016, 0.121, -0.36], [t * 0.019, 0.065, -0.49 + Math.abs(t) * 0.009]], [0.028, 0.043, 0.018]); })));
  talonFeet(parts, [0, 0.12, 0.022], 0.06, 0.013, 0.061, true);
  return parts;
}

// https://parrots.org/encyclopedia/hawk-headed-parrot/
function hawkHeadedParrot(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鹰头鹦鹉短厚而腹部圆满的树栖躯", feather, [0, 0.184, -0.019], [0.185, 0.235, 0.245]), lobe("鹰头鹦鹉撑起圆头的短羽颈", feather, [0, 0.283, 0.059], [0.107, 0.125, 0.118])];
  head(parts, [0, 0.35, 0.101], [0.122, 0.13, 0.143], pale);
  parts.push(body("鹰头鹦鹉短而弯钩的深喙", [[0.151, 0.338, 0.022, 0.028], [0.19, 0.33, 0.018, 0.026], [0.206, 0.304, 0.009, 0.018], [0.195, 0.291, 0.001, 0.002]], dark), body("鹰头鹦鹉小下颌与上颌留缝", [[0.149, 0.306, 0.017, 0.013], [0.179, 0.3, 0.013, 0.011], [0.195, 0.312, 0.0015, 0.002]], bare));
  const ruff: ModelPart[] = [];
  for (let index = 0; index < 19; index++) { const angle = (-104 + index * 208 / 18) * Math.PI / 180; const root: Triple = [Math.sin(angle) * 0.038, 0.282 + Math.cos(angle) * 0.026, 0.049]; ruff.push(curvedFeather("鹰头鹦鹉从后颈及颈侧而非头顶发出的扇羽", covert, [root, [Math.sin(angle) * 0.108, 0.338 + Math.cos(angle) * 0.077, 0.008], [Math.sin(angle) * 0.164, 0.35 + Math.cos(angle) * 0.136, -0.027]], [0.008, 0.033, 0.013])); }
  parts.push(combineMeshes("鹰头鹦鹉从两颈侧绕过后枕的完整半环羽扇", covert, ruff));
  foldedWings(parts, [0, 0.235, -0.024], 0.195, 0.221);
  parts.push(combineMeshes("鹰头鹦鹉端部宽圆的短尾羽", feather, Array.from({ length: 9 }, (_, index) => { const t = index - 4; return curvedFeather("鹰头鹦鹉圆尾羽", feather, [[t * 0.007, 0.112, -0.125], [t * 0.013, 0.085, -0.212], [t * 0.016, 0.06, -0.287 + Math.abs(t) * 0.008]], [0.018, 0.031, 0.013]); })));
  talonFeet(parts, [0, 0.085, 0.013], 0.039, 0.008, 0.041, true);
  return parts;
}

// https://parrots.org/encyclopedia/vasa-parrot/
function greaterVasaParrot(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大黑鹦鹉长腰窄肩而下腹丰满的躯体", covert, [0, 0.225, -0.028], [0.205, 0.295, 0.305]), tapered("大黑鹦鹉明显外露并向前抬起的长羽颈", covert, [[0, 0.331, 0.065], [0, 0.416, 0.099], [0, 0.461, 0.134]], [0.047, 0.031, 0.026])];
  head(parts, [0, 0.493, 0.158], [0.108, 0.13, 0.158], covert);
  parts.push(body("大黑鹦鹉延长而不成金刚巨钳的上喙", [[0.214, 0.478, 0.022, 0.032], [0.254, 0.47, 0.019, 0.028], [0.278, 0.445, 0.01, 0.02], [0.267, 0.427, 0.001, 0.002]], bare), body("大黑鹦鹉较细长的独立下颌", [[0.211, 0.443, 0.016, 0.014], [0.246, 0.44, 0.012, 0.011], [0.266, 0.451, 0.002, 0.002]], bare));
  for (const side of [-1, 1]) parts.push(lobe("大黑鹦鹉仅眼周和嘴基裸露而非季节性整头脱羽", bare, [side * 0.039, 0.492, 0.191], [0.008, 0.026, 0.043]));
  foldedWings(parts, [0, 0.293, -0.036], 0.214, 0.289);
  parts.push(combineMeshes("大黑鹦鹉延长而端部宽圆的阶尾", covert, Array.from({ length: 9 }, (_, index) => { const t = index - 4; return curvedFeather("大黑鹦鹉长圆尾羽", covert, [[t * 0.009, 0.13, -0.158], [t * 0.015, 0.095, -0.286], [t * 0.018, 0.051, -0.405 + Math.abs(t) * 0.013]], [0.023, 0.036, 0.012]); })));
  talonFeet(parts, [0, 0.102, 0.016], 0.047, 0.009, 0.048, true);
  return parts;
}

// https://www.nparks.gov.sg/florafaunaweb/fauna/6/1/613
function roseRingedParakeet(): ModelPart[] {
  const parts: ModelPart[] = [lobe("红领绿鹦鹉细窄而长腰的轻型躯", feather, [0, 0.159, -0.02], [0.122, 0.205, 0.217]), tapered("红领绿鹦鹉头下可辨的细颈", feather, [[0, 0.228, 0.045], [0, 0.297, 0.078]], [0.029, 0.022])];
  head(parts, [0, 0.329, 0.102], [0.093, 0.101, 0.116], feather);
  parts.push(body("红领绿鹦鹉相对小头较深但并非金刚巨颌的短钩喙", [[0.145, 0.319, 0.019, 0.027], [0.177, 0.313, 0.016, 0.023], [0.19, 0.289, 0.008, 0.017], [0.181, 0.275, 0.001, 0.0015]], bare), body("红领绿鹦鹉小下颌", [[0.142, 0.287, 0.013, 0.01], [0.168, 0.284, 0.01, 0.009], [0.181, 0.295, 0.001, 0.002]], dark));
  foldedWings(parts, [0, 0.208, -0.023], 0.131, 0.209);
  const train: ModelPart[] = [];
  for (let index = 0; index < 10; index++) { const t = index - 4.5, distance = Math.abs(t), end = distance < 1 ? -0.446 : -0.365 + (distance - 1) * 0.039; train.push(curvedFeather("红领绿鹦鹉中央一对最长且细尖的尾羽", covert, [[t * 0.004, 0.099, -0.112], [t * 0.007, 0.075, (-0.112 + end) * 0.5], [t * 0.009, 0.035, end]], [0.011, 0.02, 0.001])); }
  parts.push(combineMeshes("红领绿鹦鹉长于小躯并逐级缩短的细尖尾", covert, train));
  talonFeet(parts, [0, 0.073, 0.008], 0.03, 0.006, 0.033, true);
  return parts;
}

// https://www.jstage.jst.go.jp/article/jyio2003/35/2/35_2_155/_article
function sickleBilledVanga(): ModelPart[] {
  const parts: ModelPart[] = [lobe("镰嘴鵙长而狭窄的水平腰躯", pale, [0, 0.193, -0.019], [0.164, 0.208, 0.278]), tapered("镰嘴鵙抬起小头的细长羽颈", pale, [[0, 0.27, 0.066], [0, 0.344, 0.106]], [0.032, 0.023])];
  head(parts, [0, 0.381, 0.137], [0.09, 0.106, 0.123], pale);
  parts.push(tapered("镰嘴鵙长于头的薄而连续弯曲的探缝镰嘴", bare, [[0, 0.369, 0.181], [0, 0.356, 0.249], [0, 0.321, 0.295], [0, 0.273, 0.313]], [0.009, 0.0062, 0.0037, 0.0006]));
  foldedWings(parts, [0, 0.243, -0.027], 0.171, 0.251);
  parts.push(combineMeshes("镰嘴鵙长而不具鹦鹉中央绶带的宽圆尾", covert, Array.from({ length: 9 }, (_, index) => { const t = index - 4; return curvedFeather("镰嘴鵙圆端尾羽", covert, [[t * 0.007, 0.125, -0.143], [t * 0.013, 0.105, -0.247], [t * 0.016, 0.072, -0.333 + Math.abs(t) * 0.008]], [0.019, 0.03, 0.013]); })));
  feet(parts, [0, 0.104, 0.012], 0.036, 0.007, 0.048);
  return parts;
}

// https://www.environnement.mg/wp-content/uploads/2025/08/3-FICHE-TECHNIQUE-COMPLETE-rechesse-biologique-TSinjoriake_A5_2.pdf
function lafresnayesVanga(): ModelPart[] {
  const parts: ModelPart[] = [lobe("拉氏鵙短腰而胸部结实的林栖躯", pale, [0, 0.161, -0.018], [0.153, 0.189, 0.212]), lobe("拉氏鵙宽头下缩短的粗羽颈", pale, [0, 0.242, 0.055], [0.098, 0.117, 0.11])];
  head(parts, [0, 0.307, 0.097], [0.116, 0.127, 0.14], covert);
  const upper = polygon("拉氏鵙侧扁而高厚的凿形楔上喙", bare, [[0.289, 0.147], [0.324, 0.153], [0.328, 0.197], [0.31, 0.23], [0.281, 0.243], [0.278, 0.208]], 0.022, [0.011, 0, 0]);
  const lower = polygon("拉氏鵙与上喙不完全相合而留实缝的薄下颌", bare, [[0.271, 0.146], [0.253, 0.162], [0.252, 0.207], [0.277, 0.237], [0.264, 0.204]], 0.018, [0.009, 0, 0]);
  upper.rotation.z = 90;
  lower.rotation.z = 90;
  parts.push(upper, lower);
  foldedWings(parts, [0, 0.207, -0.022], 0.163, 0.192);
  parts.push(combineMeshes("拉氏鵙宽圆而长度中等的尾羽", covert, Array.from({ length: 9 }, (_, index) => { const t = index - 4; return curvedFeather("拉氏鵙圆尾羽", covert, [[t * 0.006, 0.102, -0.117], [t * 0.011, 0.083, -0.2], [t * 0.013, 0.061, -0.264 + Math.abs(t) * 0.006]], [0.016, 0.027, 0.011]); })));
  feet(parts, [0, 0.075, 0.008], 0.031, 0.006, 0.037);
  return parts;
}

export const birdExpansionBatchEighteenDesigns: MasterNatureDesign[] = [
  design("sulphurCrestedCockatoo", "硫冠凤头鹦鹉", "动物", () => calibrated(sulphurCrestedCockatoo(), 0.85), ["Cacatua galerita", "前弯窄长冠和深胸方尾", "两前两后抓趾"]),
  design("pinkCockatoo", "粉红凤头鹦鹉", "动物", () => calibrated(pinkCockatoo(), 0.76), ["Lophochroa leadbeateri", "Cacatua leadbeateri", "Major Mitchell’s Cockatoo", "宽扇冠短腰和宽圆尾"]),
  design("gangGangCockatoo", "红头凤头鹦鹉", "动物", () => calibrated(gangGangCockatoo(), 0.76), ["Callocephalon fimbriatum", "前卷丝冠厚横胸与很短方尾"]),
  design("cockatiel", "鸡尾鹦鹉", "动物", () => calibrated(cockatiel(), 0.64), ["Nymphicus hollandicus", "玄凤鹦鹉", "细尖竖冠细躯和长尖阶尾", "不另计人工羽色变异"]),
  design("redTailedBlackCockatoo", "红尾黑凤头鹦鹉", "动物", () => calibrated(redTailedBlackCockatoo(), 0.75), ["Calyptorhynchus banksii", "重头深钳喙短蓬冠与长宽尾"]),
  design("hawkHeadedParrot", "鹰头鹦鹉", "动物", () => calibrated(hawkHeadedParrot(), 0.7), ["Deroptyus accipitrinus", "Red-fan Parrot", "后颈两侧半环羽扇而非头顶冠", "完整短厚树栖躯"]),
  design("greaterVasaParrot", "大黑鹦鹉", "动物", () => calibrated(greaterVasaParrot(), 0.73), ["Coracopsis vasa", "长颈小头细钩颌和长圆尾", "仅一个完整主体不另计繁殖脱羽状态"]),
  design("roseRingedParakeet", "红领绿鹦鹉", "动物", () => calibrated(roseRingedParakeet(), 0.64), ["Psittacula krameri", "Alexandrinus krameri", "环颈鹦鹉", "无冠细颈小躯与很长双中央尖尾"]),
  design("sickleBilledVanga", "镰嘴鵙", "动物", () => calibrated(sickleBilledVanga(), 0.54), ["Falculea palliata", "薄长下曲探缝喙细颈与长足", "三前一后鸣禽趾"]),
  design("lafresnayesVanga", "拉氏鵙", "动物", () => calibrated(lafresnayesVanga(), 0.48), ["Xenopirostris xenopirostris", "Vanga xenopirostris", "Lafresnaye’s Vanga", "侧扁高凿喙真嘴缝与短粗躯"]),
];
