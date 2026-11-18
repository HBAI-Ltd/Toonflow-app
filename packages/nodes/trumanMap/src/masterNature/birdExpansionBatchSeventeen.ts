import { combineMeshes, design, leaf, lobe, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { calibrated, feet, foldedWings, head, tail } from "./birdExpansionBatchOne";
import { curvedFeather } from "./birdExpansionBatchTwelve";

const feather = "#a5b39a";
const covert = "#829481";
const pale = "#cbd0b8";
const bare = "#b4ab8d";
const dark = "#596b60";

// https://academy.allaboutbirds.org/ribbon-tailed-astrapia-the-three-foot-tail/
function ribbonTailedAstrapia(): ModelPart[] {
  const parts: ModelPart[] = [lobe("长尾风鸟小而直立的细胸躯", covert, [0, 0.19, -0.018], [0.155, 0.245, 0.235]), lobe("长尾风鸟撑起蓬头的短羽颈", covert, [0, 0.294, 0.058], [0.1, 0.145, 0.115])];
  head(parts, [0, 0.38, 0.098], [0.11, 0.13, 0.14], covert);
  parts.push(body("长尾风鸟蓬头下很短的硬嘴", [[0.149, 0.363, 0.014, 0.017], [0.193, 0.352, 0.01, 0.012], [0.205, 0.34, 0.001, 0.002]], bare), lobe("长尾风鸟嘴上方圆蓬而非尖冠的前额羽团", covert, [0, 0.417, 0.13], [0.09, 0.08, 0.089]));
  foldedWings(parts, [0, 0.247, -0.022], 0.16, 0.215);
  tail(parts, [0, 0.115, -0.118], 0.09, 0.115, -101);
  for (const side of [-1, 1]) parts.push(curvedFeather("长尾风鸟仅中央一对真正米级的白色绶带尾羽", pale, [[side * 0.012, 0.113, -0.12], [side * 0.023, 0.15, -0.4], [side * 0.041, 0.132, -0.73], [side * 0.058, 0.085, -1.055], [side * 0.05, 0.052, -1.28]], [0.011, 0.023, 0.027, 0.026, 0.003]));
  feet(parts, [0, 0.082, 0.012], 0.037, 0.0065, 0.043);
  return parts;
}

// https://collections.museumsvictoria.com.au/specimens/425390
function blackSicklebill(): ModelPart[] {
  const parts: ModelPart[] = [lobe("黑镰嘴风鸟长而窄的树栖胸躯", covert, [0, 0.265, -0.035], [0.2, 0.32, 0.32]), tapered("黑镰嘴风鸟前伸而细长的羽颈", covert, [[0, 0.36, 0.08], [0, 0.465, 0.132]], [0.038, 0.027])];
  head(parts, [0, 0.507, 0.171], [0.096, 0.112, 0.146], covert);
  parts.push(tapered("黑镰嘴风鸟远长于头并连续弯成镰刀的细喙", bare, [[0, 0.49, 0.224], [0, 0.468, 0.287], [0, 0.419, 0.333], [0, 0.374, 0.342]], [0.011, 0.008, 0.0045, 0.0007]));
  foldedWings(parts, [0, 0.329, -0.04], 0.21, 0.3);
  const breast: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 10; index++) breast.push(leaf("黑镰嘴风鸟胸侧向外拱出的长盾羽", feather, [side * (0.03 + index * 0.0045), 0.381 - index * 0.008, 0.101], 0.025, 0.16 + index % 3 * 0.015, [141 + index * 2.5, side * (18 + index * 6), -side * 25]));
  parts.push(combineMeshes("黑镰嘴风鸟胸侧而非翼上扩出的长弧盾羽", feather, breast));
  const train: ModelPart[] = [];
  for (let index = 0; index < 9; index++) { const t = (index - 4) / 4; train.push(curvedFeather("黑镰嘴风鸟中央最长的独立弧垂尾羽", covert, [[t * 0.019, 0.16, -0.165], [t * 0.033, 0.18, -0.37], [t * 0.044, 0.135, -0.62], [t * 0.052, 0.073, -0.84 + Math.abs(t) * 0.13]], [0.023, 0.053, 0.049, 0.003])); }
  parts.push(combineMeshes("黑镰嘴风鸟长达数倍小躯的宽阶尾", covert, train));
  feet(parts, [0, 0.117, 0.012], 0.047, 0.009, 0.056);
  return parts;
}

// https://animaldiversity.org/accounts/Pteridophora_alberti/
function kingOfSaxonyBirdOfParadise(): ModelPart[] {
  const parts: ModelPart[] = [lobe("萨克森王风鸟短而轻巧的林栖躯", feather, [0, 0.145, -0.015], [0.12, 0.18, 0.19]), lobe("萨克森王风鸟不明显外露的短羽颈", covert, [0, 0.225, 0.05], [0.077, 0.115, 0.09])];
  head(parts, [0, 0.293, 0.082], [0.082, 0.096, 0.105], covert);
  parts.push(body("萨克森王风鸟短窄的微曲嘴", [[0.12, 0.28, 0.009, 0.011], [0.154, 0.269, 0.007, 0.008], [0.164, 0.259, 0.001, 0.0015]], bare));
  foldedWings(parts, [0, 0.189, -0.02], 0.13, 0.165);
  for (const side of [-1, 1]) {
    const shaft: Triple[] = Array.from({ length: 9 }, (_, index) => { const t = index / 8; return [side * (0.022 + t * 0.108), 0.322 + t * 0.25 - t * t * 0.13, 0.069 - t * 0.805]; });
    parts.push(tapered("眼后发出而非额角的半米长冠羽轴", covert, shaft, shaft.map((_, index) => 0.0015 - index * 0.0001)));
    const flags: ModelPart[] = [];
    for (let index = 0; index < 44; index++) { const t = 0.04 + index / 43 * 0.96; flags.push(leaf("冠羽轴一侧真正串联的独立旗片", pale, [side * (0.022 + t * 0.108), 0.322 + t * 0.25 - t * t * 0.13, 0.069 - t * 0.805], 0.0185, 0.022, [-95, side * 40, -side * 90])); }
    parts.push(combineMeshes("萨克森王风鸟单侧长冠轴上的四十四片小旗", pale, flags));
  }
  tail(parts, [0, 0.092, -0.1], 0.085, 0.1, -104);
  feet(parts, [0, 0.07, 0.008], 0.027, 0.005, 0.033);
  return parts;
}

// https://australian.museum/about/history/exhibitions/birds-of-paradise/twelve-wired-bird-of-paradise/
function twelveWiredBirdOfParadise(): ModelPart[] {
  const parts: ModelPart[] = [lobe("十二线风鸟窄肩而丰满腹部的短躯", feather, [0, 0.172, -0.018], [0.155, 0.235, 0.23]), tapered("十二线风鸟前抬的短羽颈", covert, [[0, 0.258, 0.064], [0, 0.322, 0.101]], [0.031, 0.022])];
  head(parts, [0, 0.355, 0.132], [0.084, 0.1, 0.117], covert);
  parts.push(body("十二线风鸟细长而平直的暗色嘴", [[0.174, 0.339, 0.01, 0.012], [0.22, 0.327, 0.008, 0.009], [0.239, 0.318, 0.001, 0.0015]], bare));
  foldedWings(parts, [0, 0.223, -0.025], 0.16, 0.205);
  for (const side of [-1, 1]) {
    parts.push(combineMeshes("从腹侧而非尾综骨发出的长蓬侧羽", pale, Array.from({ length: 10 }, (_, index) => leaf("十二线风鸟腹侧长蓬松羽片", pale, [side * (0.042 + index * 0.003), 0.183 - index * 0.005, -0.015 - index * 0.004], 0.021, 0.13 + index % 3 * 0.012, [-117 - index * 2, side * (index * 5 + 15), -side * 14]))));
    const wires: ModelPart[] = [];
    for (let index = 0; index < 6; index++) wires.push(tapered("十二线风鸟一侧六根真实裸露线状肋羽轴", covert, [[side * 0.066, 0.16 - index * 0.006, -0.035], [side * (0.123 + index * 0.005), 0.13 + index * 0.009, -0.12], [side * (0.17 + index * 0.005), 0.176 + index * 0.012, -0.215], [side * (0.185 + index * 0.006), 0.247 + index * 0.01, -0.245]], [0.0014, 0.0011, 0.0008, 0.0005]));
    parts.push(combineMeshes("十二线风鸟左右各六条弯曲长线", covert, wires));
  }
  tail(parts, [0, 0.104, -0.12], 0.1, 0.125, -103);
  feet(parts, [0, 0.077, 0.01], 0.035, 0.0065, 0.043);
  return parts;
}

function wallacesStandardwing(): ModelPart[] {
  const parts: ModelPart[] = [lobe("缨饰风鸟小而圆胸的林栖躯", feather, [0, 0.145, -0.015], [0.128, 0.19, 0.205]), tapered("缨饰风鸟上举的短羽颈", feather, [[0, 0.21, 0.057], [0, 0.275, 0.093]], [0.029, 0.021])];
  head(parts, [0, 0.307, 0.121], [0.08, 0.092, 0.114]);
  parts.push(body("缨饰风鸟较短而微下曲的嘴", [[0.162, 0.294, 0.01, 0.012], [0.201, 0.283, 0.008, 0.009], [0.213, 0.273, 0.001, 0.0015]], bare));
  foldedWings(parts, [0, 0.194, -0.02], 0.13, 0.18);
  for (const side of [-1, 1]) for (let index = 0; index < 2; index++) {
    const tip: Triple = [side * (0.137 + index * 0.036), 0.444 + index * 0.027, -0.105 - index * 0.025];
    parts.push(tapered("缨饰风鸟从翼上而非头尾发出的独立白长羽轴", pale, [[side * 0.072, 0.223, 0.022], [side * (0.115 + index * 0.018), 0.352 + index * 0.012, -0.035], tip], [0.0018, 0.0012, 0.0008]), leaf("缨饰风鸟白长轴末端真正扩展的旗羽片", pale, tip, 0.031, 0.115 - index * 0.01, [-126, side * (index * 12 + 8), -side * 11]));
  }
  tail(parts, [0, 0.095, -0.112], 0.09, 0.1, -103);
  feet(parts, [0, 0.069, 0.009], 0.031, 0.0055, 0.037);
  return parts;
}

// https://biodiversitysg.nparks.gov.sg/our-biodiversity/birds/other-birds/greater-racket-tailed-drongo/
function greaterRacketTailedDrongo(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大盘尾细腰而胸部高举的林栖鸦状躯", covert, [0, 0.17, -0.018], [0.13, 0.205, 0.23]), tapered("大盘尾撑起冠头的细短羽颈", covert, [[0, 0.245, 0.06], [0, 0.309, 0.098]], [0.027, 0.021])];
  head(parts, [0, 0.343, 0.127], [0.088, 0.103, 0.118], covert);
  parts.push(tapered("大盘尾粗根而末端钩曲的小嘴", bare, [[0, 0.327, 0.17], [0, 0.316, 0.211], [0, 0.295, 0.214]], [0.013, 0.008, 0.0007]));
  const curls: ModelPart[] = [];
  for (let index = 0; index < 8; index++) { const x = (index - 3.5) * 0.004; curls.push(tapered("从额前发出并向后卷曲的真实冠羽轴", covert, [[x, 0.375, 0.149], [x, 0.418, 0.163], [x, 0.439, 0.142], [x, 0.417, 0.124]], [0.0024, 0.0021, 0.0017, 0.0007])); }
  parts.push(combineMeshes("大盘尾真实向后弯卷的前额羽冠", covert, curls));
  foldedWings(parts, [0, 0.218, -0.024], 0.14, 0.215);
  tail(parts, [0, 0.105, -0.125], 0.11, 0.14, -103);
  for (const side of [-1, 1]) {
    parts.push(tapered("大盘尾不附连续宽羽片的长裸羽轴", covert, [[side * 0.023, 0.102, -0.126], [side * 0.037, 0.108, -0.25], [side * 0.062, 0.08, -0.4], [side * 0.078, 0.055, -0.46]], [0.0018, 0.0015, 0.001, 0.0007]));
    parts.push(curvedFeather("长裸轴末端扭转而扩成球拍的独立羽瓣", covert, [[side * 0.078, 0.055, -0.46], [side * 0.092, 0.05, -0.492], [side * 0.105, 0.07, -0.535]], [0.005, 0.04, 0.004]));
  }
  feet(parts, [0, 0.077, 0.01], 0.032, 0.006, 0.042);
  return parts;
}

// https://australian.museum/about/history/exhibitions/birds-of-paradise/western-parotia/
function westernParotia(): ModelPart[] {
  const parts: ModelPart[] = [lobe("西六线风鸟短而深胸的舞场地栖躯", covert, [0, 0.17, -0.018], [0.16, 0.22, 0.235]), lobe("西六线风鸟稍上举的短粗羽颈", covert, [0, 0.265, 0.06], [0.1, 0.145, 0.115])];
  head(parts, [0, 0.351, 0.101], [0.105, 0.12, 0.13], covert);
  parts.push(body("西六线风鸟小而直尖的暗色嘴", [[0.148, 0.334, 0.012, 0.014], [0.19, 0.325, 0.008, 0.01], [0.206, 0.315, 0.001, 0.0015]], bare), lobe("西六线风鸟贴在前胸的宽盾状覆羽", feather, [0, 0.267, 0.13], [0.131, 0.118, 0.039]));
  foldedWings(parts, [0, 0.217, -0.024], 0.17, 0.2);
  const skirt: ModelPart[] = [];
  for (const side of [-1, 1]) {
    for (let index = 0; index < 9; index++) skirt.push(leaf("从腹侧伸起再向外下垂的独立裙羽", covert, [side * (0.044 + index * 0.0025), 0.18 - index * 0.005, -0.014 - index * 0.006], 0.032, 0.16 - index * 0.004, [149 + index * 2, side * (index * 7 + 8), -side * 40]));
    for (let index = 0; index < 3; index++) { const end: Triple = [side * (0.082 + index * 0.022), 0.471 + index * 0.02, -0.014 - index * 0.015]; parts.push(tapered("西六线风鸟眼后单侧三根细裸冠羽轴", covert, [[side * 0.036, 0.389, 0.081], [side * (0.059 + index * 0.01), 0.455 + index * 0.012, 0.046], end], [0.0014, 0.001, 0.0006]), leaf("西六线风鸟每条冠轴末端小匙状羽片", pale, end, 0.012, 0.025, [-40, side * (index * 20 + 20), -side * 15])); }
  }
  parts.push(combineMeshes("西六线风鸟腹侧围成环而非翼面变大的裙羽", covert, skirt));
  tail(parts, [0, 0.105, -0.125], 0.105, 0.115, -103);
  feet(parts, [0, 0.077, 0.01], 0.038, 0.007, 0.048);
  return parts;
}

function magnificentRiflebird(): ModelPart[] {
  const parts: ModelPart[] = [lobe("辉风鸟较长腰而胸部丰满的林栖躯", covert, [0, 0.18, -0.025], [0.16, 0.225, 0.255]), tapered("辉风鸟撑起细头颅的短羽颈", covert, [[0, 0.264, 0.067], [0, 0.337, 0.106]], [0.03, 0.021])];
  head(parts, [0, 0.37, 0.137], [0.083, 0.098, 0.123], covert);
  parts.push(tapered("辉风鸟细长而连续向下弯曲的探食嘴", bare, [[0, 0.356, 0.182], [0, 0.343, 0.225], [0, 0.313, 0.257], [0, 0.294, 0.261]], [0.009, 0.0065, 0.0034, 0.0006]));
  for (const side of [-1, 1]) {
    parts.push(membrane("辉风鸟上举后成为宽圆帘面而非尖翔翼的长翼", covert, [[side * 0.055, 0.245, 0.04], [side * 0.14, 0.43, 0.063], [side * 0.23, 0.558, -0.018], [side * 0.345, 0.511, -0.12], [side * 0.4, 0.39, -0.21], [side * 0.22, 0.23, -0.26], [side * 0.06, 0.13, -0.13]]));
    parts.push(combineMeshes("辉风鸟圆翼后缘的密叠宽羽", covert, Array.from({ length: 10 }, (_, index) => leaf("辉风鸟圆弧翼帘的宽长羽片", covert, [side * (0.13 + index * 0.025), 0.39 + Math.sin(index / 9 * Math.PI) * 0.05, -0.035 - index * 0.012], 0.052, 0.19 - index * 0.004, [-122, -side * index * 3, 0]))));
  }
  tail(parts, [0, 0.105, -0.14], 0.12, 0.15, -102);
  feet(parts, [0, 0.08, 0.009], 0.034, 0.006, 0.044);
  return parts;
}

// https://doi.org/10.5962/p.322632
function curlCrestedManucode(): ModelPart[] {
  const parts: ModelPart[] = [lobe("卷冠风鸟粗胸而厚肩的鸦状林栖躯", feather, [0, 0.205, -0.02], [0.2, 0.265, 0.285]), tapered("卷冠风鸟比长尾风鸟更粗短的颈", feather, [[0, 0.305, 0.074], [0, 0.388, 0.119]], [0.045, 0.03])];
  head(parts, [0, 0.429, 0.157], [0.112, 0.124, 0.145]);
  parts.push(body("卷冠风鸟粗基而微曲的黑色直嘴", [[0.21, 0.412, 0.018, 0.021], [0.26, 0.4, 0.015, 0.017], [0.282, 0.381, 0.0015, 0.002]], bare));
  const curls: ModelPart[] = [];
  for (let index = 0; index < 24; index++) { const angle = index / 12 * Math.PI * 2, row = Math.floor(index / 12), x = Math.cos(angle) * (0.028 + row * 0.013), z = 0.14 + Math.sin(angle) * 0.035, y = 0.478 - row * 0.045; curls.push(tapered("卷冠风鸟头顶到侧颈真实反卷的短羽轴", covert, [[x, y, z], [x * 1.15, y + 0.021, z - 0.005], [x * 1.1, y + 0.027, z - 0.019], [x * 0.95, y + 0.012, z - 0.025]], [0.0024, 0.0022, 0.0017, 0.0008])); }
  for (let index = 0; index < curls.length; index += 12) parts.push(combineMeshes("卷冠风鸟密集卷曲而非几根直尖冠羽的头颈毛被", covert, curls.slice(index, index + 12)));
  foldedWings(parts, [0, 0.262, -0.025], 0.21, 0.245);
  tail(parts, [0, 0.13, -0.145], 0.15, 0.18, -103);
  feet(parts, [0, 0.095, 0.01], 0.046, 0.009, 0.057);
  return parts;
}

// https://www.wildlifemadagascar.org/animals/helmet-vanga/
function helmetVanga(): ModelPart[] {
  const parts: ModelPart[] = [lobe("盔嘴鵙小而短腰的林栖胸躯", feather, [0, 0.145, -0.017], [0.147, 0.195, 0.225]), lobe("盔嘴鵙支承巨大头嘴的短粗颈", feather, [0, 0.232, 0.057], [0.105, 0.135, 0.114])];
  head(parts, [0, 0.317, 0.103], [0.113, 0.132, 0.137]);
  parts.push(body("盔嘴鵙约五厘米长并有巨大高拱顶面的盔状上喙", [[0.153, 0.309, 0.027, 0.036], [0.188, 0.316, 0.03, 0.044], [0.226, 0.297, 0.024, 0.034], [0.25, 0.265, 0.002, 0.004]], bare), body("盔嘴鵙与高拱上喙分开的短下颌", [[0.153, 0.267, 0.019, 0.014], [0.203, 0.258, 0.017, 0.012], [0.238, 0.267, 0.003, 0.003]], bare));
  foldedWings(parts, [0, 0.193, -0.022], 0.15, 0.185);
  tail(parts, [0, 0.095, -0.115], 0.095, 0.105, -103);
  feet(parts, [0, 0.068, 0.008], 0.035, 0.0065, 0.041);
  return parts;
}

export const birdExpansionBatchSeventeenDesigns: MasterNatureDesign[] = [
  design("ribbonTailedAstrapia", "长尾风鸟", "动物", () => calibrated(ribbonTailedAstrapia(), 0.8), ["Astrapia mayeri", "小躯与一对米级白绶带尾羽", "圆蓬前额"]),
  design("blackSicklebill", "黑镰嘴风鸟", "动物", () => calibrated(blackSicklebill(), 0.9), ["Epimachus fastosus", "长镰喙胸侧盾羽和长阶尾"]),
  design("kingOfSaxonyBirdOfParadise", "萨克森王风鸟", "动物", () => calibrated(kingOfSaxonyBirdOfParadise(), 0.61), ["Pteridophora alberti", "眼后双长冠羽轴各四十四片旗片", "完整小型林栖鸟躯"]),
  design("twelveWiredBirdOfParadise", "十二线风鸟", "动物", () => calibrated(twelveWiredBirdOfParadise(), 0.75), ["Seleucidis melanoleucus", "Seleucidis melanoleuca", "腹侧左右各六条裸长羽轴"]),
  design("wallacesStandardwing", "缨饰风鸟", "动物", () => calibrated(wallacesStandardwing(), 0.66), ["Semioptera wallacii", "翼上四条长白轴旗羽", "短躯小头完整足趾"]),
  design("greaterRacketTailedDrongo", "大盘尾", "动物", () => calibrated(greaterRacketTailedDrongo(), 0.8), ["Dicrurus paradiseus", "前额卷冠与两条长裸尾轴", "末端扭转球拍羽瓣"]),
  design("westernParotia", "西六线风鸟", "动物", () => calibrated(westernParotia(), 0.76), ["Parotia sefilata", "眼后各三根匙端线羽", "真实腹侧裙羽和胸盾"]),
  design("magnificentRiflebird", "辉风鸟", "动物", () => calibrated(magnificentRiflebird(), 0.62), ["Ptiloris magnificus", "长细曲喙和圆弧宽羽翼帘", "林栖小躯完整趾足"]),
  design("curlCrestedManucode", "卷冠风鸟", "动物", () => calibrated(curlCrestedManucode(), 0.71), ["Manucodia comrii", "粗颈鸦躯与头颈反卷短羽", "宽圆短尾"]),
  design("helmetVanga", "盔嘴鵙", "动物", () => calibrated(helmetVanga(), 0.65), ["Euryceros prevostii", "高拱巨嘴与独立下颌", "大头短腰林栖鵙躯"]),
];
