import { Vector3 } from "three";
import { combineMeshes, design, leaf, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { calibrated, feet, foldedWings, head, tail } from "./birdExpansionBatchOne";
import { talonFeet } from "./birdExpansionBatchFive";

const feather = "#a7b49a";
const covert = "#829582";
const pale = "#ccd1b9";
const bare = "#b5ab8d";
const dark = "#586b5f";

export function curvedFeather(name: string, color: string, path: Triple[], widths: number[]): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let index = 0; index < path.length; index++) {
    const center = new Vector3(...path[index]!);
    const direction = new Vector3(...path[Math.min(index + 1, path.length - 1)]!).sub(new Vector3(...path[Math.max(0, index - 1)]!)).normalize();
    const widthAxis = new Vector3(1, 0, 0).addScaledVector(direction, -direction.x).normalize();
    const normal = new Vector3().crossVectors(widthAxis, direction).normalize();
    for (let corner = 0; corner < 4; corner++) { const angle = corner * Math.PI / 2; const point = center.clone().addScaledVector(widthAxis, Math.cos(angle) * widths[index]! * 0.5).addScaledVector(normal, Math.sin(angle) * 0.0008); vertices.push({ x: point.x, y: point.y, z: point.z }); }
    if (index) for (let corner = 0; corner < 4; corner++) { const a = (index - 1) * 4 + corner, b = index * 4 + corner, c = (index - 1) * 4 + (corner + 1) % 4, d = index * 4 + (corner + 1) % 4; indices.push(a, b, c, c, b, d); }
  }
  const first = vertices.length, last = first + 1, end = (path.length - 1) * 4;
  vertices.push({ x: path[0]![0], y: path[0]![1], z: path[0]![2] }, { x: path.at(-1)![0], y: path.at(-1)![1], z: path.at(-1)![2] });
  for (let corner = 0; corner < 4; corner++) indices.push(first, corner, (corner + 1) % 4, last, end + (corner + 1) % 4, end + corner);
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// https://avise-birds.bio.uci.edu/musophagiformes/musophagidae/corythaeola_cristata/index.html
function greatBlueTuraco(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大蓝蕉鹃厚重而直立的树栖长躯", feather, [0, 0.265, -0.025], [0.265, 0.34, 0.345]), tapered("大蓝蕉鹃撑起高冠大头的粗羽颈", feather, [[0, 0.37, 0.065], [0, 0.478, 0.119]], [0.062, 0.04])];
  head(parts, [0, 0.526, 0.158], [0.135, 0.14, 0.165]);
  parts.push(body("大蓝蕉鹃基部高厚而末端弯下的侧扁嘴", [[0.218, 0.512, 0.026, 0.035], [0.272, 0.5, 0.019, 0.029], [0.289, 0.47, 0.002, 0.003]], bare));
  parts.push(combineMeshes("大蓝蕉鹃高而宽的直立羽冠", covert, Array.from({ length: 13 }, (_, index) => leaf("大蓝蕉鹃宽端竖冠羽", covert, [(index - 6) * 0.004, 0.581, 0.125 - index % 2 * 0.007], 0.029, 0.132 + Math.sin(index / 12 * Math.PI) * 0.025, [-10 - index % 3 * 3, (index - 6) * 3, -(index - 6) * 2]))));
  foldedWings(parts, [0, 0.335, -0.03], 0.27, 0.3);
  tail(parts, [0, 0.16, -0.17], 0.22, 0.35, -100);
  talonFeet(parts, [0, 0.11, 0.015], 0.056, 0.0095, 0.052, true);
  return parts;
}

// https://library.sandiegozoo.org/wp-content/uploads/2020/03/capuchinbird.pdf
function capuchinbird(): ModelPart[] {
  const parts: ModelPart[] = [lobe("裸颈伞鸟厚实短圆而非细腰的鸣禽躯", feather, [0, 0.21, -0.02], [0.22, 0.27, 0.26]), tapered("裸头下方从浓密披羽中露出的短裸颈", bare, [[0, 0.305, 0.065], [0, 0.373, 0.116]], [0.036, 0.029])];
  head(parts, [0, 0.411, 0.142], [0.116, 0.13, 0.147], bare);
  parts.push(body("裸颈伞鸟裸头前方粗厚而稍钩的嘴", [[0.195, 0.397, 0.022, 0.025], [0.247, 0.385, 0.018, 0.021], [0.266, 0.362, 0.002, 0.003]], dark));
  const mantle: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 12; index++) mantle.push(leaf("围绕裸颈向外蓬起的长颈肩羽", feather, [side * (0.019 + index * 0.005), 0.345 - index * 0.006, 0.071 - index * 0.005], 0.024, 0.14 + index % 3 * 0.014, [143 + index % 4 * 7, side * (index * 6 - 20), -side * 21]));
  parts.push(combineMeshes("不覆盖裸头的厚密修士披肩状颈羽", feather, mantle));
  foldedWings(parts, [0, 0.264, -0.03], 0.22, 0.245);
  tail(parts, [0, 0.135, -0.131], 0.14, 0.14, -102);
  feet(parts, [0, 0.09, 0.012], 0.048, 0.008, 0.051);
  return parts;
}

// https://animals.sandiegozoo.org/animals/cock-rock
function guiananCockOfTheRock(): ModelPart[] {
  const parts: ModelPart[] = [lobe("圭亚那动冠伞鸟短腰厚胸的紧凑躯", feather, [0, 0.147, -0.017], [0.158, 0.2, 0.198]), lobe("动冠伞鸟几乎缩入厚胸的短颈", feather, [0, 0.236, 0.057], [0.1, 0.135, 0.105])];
  head(parts, [0, 0.292, 0.104], [0.104, 0.11, 0.132]);
  parts.push(body("巨冠下方几乎被遮住的小短嘴", [[0.151, 0.282, 0.013, 0.014], [0.19, 0.273, 0.01, 0.01], [0.204, 0.267, 0.001, 0.002]], bare));
  const outline: [number, number][] = Array.from({ length: 15 }, (_, index) => { const angle = index / 14 * Math.PI; return [0.296 + Math.sin(angle) * 0.086, 0.104 - Math.cos(angle) * 0.082]; });
  const crest = polygon("动冠伞鸟沿额头直到嘴上方的完整半月扇冠", feather, outline, 0.023, [0.0115, 0, 0]);
  crest.rotation.z = 90;
  parts.push(crest);
  foldedWings(parts, [0, 0.195, -0.02], 0.16, 0.18);
  tail(parts, [0, 0.095, -0.105], 0.1, 0.095, -103);
  feet(parts, [0, 0.073, 0.012], 0.038, 0.0065, 0.038);
  return parts;
}

// https://www.zoobeauval.com/en/zooparc/animals/rhinoceros-hornbill
function rhinocerosHornbill(): ModelPart[] {
  const parts: ModelPart[] = [lobe("马来犀鸟长胸细腰的林栖躯", covert, [0, 0.34, -0.035], [0.28, 0.43, 0.38]), tapered("马来犀鸟支承巨大喙盔的粗长羽颈", covert, [[0, 0.49, 0.07], [0, 0.65, 0.13]], [0.079, 0.053])];
  head(parts, [0, 0.717, 0.187], [0.155, 0.18, 0.21], covert);
  parts.push(body("马来犀鸟长而向下弯曲的巨大上喙", [[0.264, 0.701, 0.04, 0.054], [0.39, 0.69, 0.038, 0.06], [0.505, 0.642, 0.025, 0.039], [0.55, 0.591, 0.003, 0.005]], bare), body("马来犀鸟与上喙分开的较薄下颌", [[0.262, 0.64, 0.028, 0.018], [0.392, 0.622, 0.025, 0.016], [0.518, 0.599, 0.003, 0.003]], pale));
  parts.push(body("马来犀鸟由喙背连续拱起并在前端上翘的角盔", [[0.2, 0.79, 0.034, 0.061], [0.294, 0.804, 0.044, 0.075], [0.389, 0.832, 0.036, 0.063], [0.445, 0.886, 0.023, 0.046], [0.45, 0.929, 0.003, 0.007]], bare));
  foldedWings(parts, [0, 0.43, -0.045], 0.29, 0.39);
  parts.push(combineMeshes("马来犀鸟等长而宽阔的长白尾", pale, Array.from({ length: 8 }, (_, index) => leaf("马来犀鸟有分离羽缘的宽白尾羽", pale, [(index - 3.5) * 0.018, 0.18, -0.19], 0.065, 0.43 - Math.abs(index - 3.5) * 0.012, [-99, -(index - 3.5) * 3, 0]))));
  feet(parts, [0, 0.145, 0.02], 0.062, 0.013, 0.078);
  return parts;
}

// https://forestry.sarawak.gov.my/web/subpage/webpage_view/842
function bulwersPheasant(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鳞背鹇前胸丰满而后躯收窄的林栖鸡躯", covert, [0, 0.245, -0.025], [0.27, 0.32, 0.4]), tapered("鳞背鹇上举而不长出的粗羽颈", covert, [[0, 0.35, 0.105], [0, 0.455, 0.15]], [0.052, 0.033])];
  head(parts, [0, 0.499, 0.188], [0.09, 0.11, 0.129], covert);
  parts.push(tapered("鳞背鹇短而坚硬的微钩嘴", bare, [[0, 0.488, 0.235], [0, 0.478, 0.285], [0, 0.459, 0.288]], [0.014, 0.009, 0.0008]));
  for (const side of [-1, 1]) parts.push(lobe("鳞背鹇眼后垂下并遮住头侧的大肉垂", bare, [side * 0.042, 0.477, 0.196], [0.024, 0.117, 0.079]), lobe("肉垂外缘继续伸长的软皮末瓣", bare, [side * 0.057, 0.43, 0.187], [0.022, 0.073, 0.038]));
  foldedWings(parts, [0, 0.306, -0.035], 0.28, 0.3);
  const fan: ModelPart[] = [];
  for (let index = 0; index < 32; index++) { const t = (index - 15.5) / 15.5, length = 0.43 - Math.abs(t) * 0.075; fan.push(curvedFeather("鳞背鹇各自弯曲而不是平直扇片的白尾羽", pale, [[t * 0.032, 0.185, -0.185], [t * 0.11, 0.31, -0.27], [t * 0.2, 0.38, -0.42], [t * 0.255, 0.325, -0.185 - length]], [0.018, 0.043, 0.046, 0.003])); }
  for (let index = 0; index < fan.length; index += 16) parts.push(combineMeshes("鳞背鹇立起并向后弧垂的白色多羽尾扇", pale, fan.slice(index, index + 16)));
  feet(parts, [0, 0.145, 0.02], 0.062, 0.012, 0.08);
  return parts;
}

// https://resourcelibrary.clevelandmetroparks.com/api/assets/documents/e8167e90-08aa-4982-a260-b9af2ae6a52f
function ladyAmherstsPheasant(): ModelPart[] {
  const parts: ModelPart[] = [lobe("白腹锦鸡短而轻巧的狭长胸腹", feather, [0, 0.225, -0.025], [0.205, 0.27, 0.365]), tapered("白腹锦鸡直立细颈连接小头", feather, [[0, 0.31, 0.11], [0, 0.438, 0.155]], [0.046, 0.025])];
  head(parts, [0, 0.474, 0.181], [0.078, 0.09, 0.108]);
  parts.push(tapered("白腹锦鸡前端细尖的短硬喙", bare, [[0, 0.465, 0.221], [0, 0.455, 0.266]], [0.011, 0.0008]));
  const cape: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 11; index++) cape.push(leaf("白腹锦鸡从枕后向外包下的宽颈披羽", pale, [side * (0.012 + index * 0.0035), 0.48 - index * 0.005, 0.144 - index * 0.003], 0.036, 0.13 + index % 3 * 0.014, [-126 - index * 3.5, side * (index * 7 + 5), -side * 15]));
  parts.push(combineMeshes("白腹锦鸡真正多枚羽片叠合的颈披肩", pale, cape), combineMeshes("小头上向后卧倒的短枕冠", covert, Array.from({ length: 5 }, (_, index) => leaf("锦鸡后枕细冠羽", covert, [(index - 2) * 0.004, 0.51, 0.15], 0.013, 0.081 - Math.abs(index - 2) * 0.007, [-60, (index - 2) * 7, 0]))));
  foldedWings(parts, [0, 0.278, -0.03], 0.21, 0.27);
  const tailFeathers: ModelPart[] = [];
  for (let index = 0; index < 12; index++) { const t = (index - 5.5) / 5.5, length = 0.8 - Math.abs(t) * 0.16; tailFeathers.push(curvedFeather("白腹锦鸡长于身体的独立弧形尾羽", pale, [[t * 0.014, 0.155, -0.17], [t * 0.03, 0.17, -0.4], [t * 0.04, 0.12, -0.7], [t * 0.05, 0.075, -0.17 - length]], [0.016, 0.045, 0.041, 0.002])); }
  parts.push(combineMeshes("中央最长且自然弧垂的锦鸡长尾束", pale, tailFeathers));
  feet(parts, [0, 0.13, 0.012], 0.052, 0.01, 0.066);
  return parts;
}

function blueEaredPheasant(): ModelPart[] {
  const parts: ModelPart[] = [lobe("蓝马鸡深胸而腹部饱满的高背地栖躯", feather, [0, 0.29, -0.025], [0.31, 0.35, 0.42]), tapered("蓝马鸡前端上举的厚羽颈", feather, [[0, 0.39, 0.115], [0, 0.525, 0.17]], [0.061, 0.039])];
  head(parts, [0, 0.572, 0.213], [0.104, 0.125, 0.145]);
  parts.push(body("蓝马鸡长于锦鸡的下曲掘食嘴", [[0.266, 0.556, 0.019, 0.023], [0.316, 0.54, 0.014, 0.019], [0.337, 0.519, 0.0015, 0.002]], bare));
  const ears: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 6; index++) ears.push(leaf("从眼下向后上方伸出的独立长白耳羽", pale, [side * (0.037 + index * 0.003), 0.55 + index * 0.004, 0.218 - index * 0.004], 0.018, 0.15 - index * 0.005, [-55, side * (index * 4 + 16), -side * 13]));
  parts.push(combineMeshes("蓝马鸡沿头两侧向后上卷的长白耳束", pale, ears));
  foldedWings(parts, [0, 0.36, -0.03], 0.32, 0.31);
  const train: ModelPart[] = [];
  for (let index = 0; index < 18; index++) { const t = (index - 8.5) / 8.5; train.push(curvedFeather("蓝马鸡宽而蓬松并在后端分缘的长尾羽", covert, [[t * 0.03, 0.2, -0.185], [t * 0.058, 0.285, -0.36], [t * 0.075, 0.27, -0.58], [t * 0.09, 0.19 + Math.abs(t) * 0.025, -0.725 + Math.abs(t) * 0.07]], [0.025, 0.06, 0.06, 0.003])); }
  parts.push(combineMeshes("蓝马鸡高拱后垂而非平直硬针的长尾", covert, train));
  feet(parts, [0, 0.17, 0.012], 0.075, 0.016, 0.1);
  return parts;
}

// https://www.saczoo.org/himalayan-monal
function himalayanMonal(): ModelPart[] {
  const parts: ModelPart[] = [lobe("棕尾虹雉厚重圆腹与前高后低的背线", feather, [0, 0.255, -0.025], [0.285, 0.335, 0.385]), tapered("虹雉撑起小头的粗羽颈", feather, [[0, 0.36, 0.11], [0, 0.47, 0.16]], [0.055, 0.032])];
  head(parts, [0, 0.511, 0.195], [0.09, 0.105, 0.125]);
  parts.push(tapered("虹雉用于翻土的长基部强下弯嘴", bare, [[0, 0.5, 0.24], [0, 0.48, 0.295], [0, 0.442, 0.315]], [0.019, 0.014, 0.001]));
  const shafts: ModelPart[] = [], tips: ModelPart[] = [];
  for (let index = 0; index < 7; index++) { const x = (index - 3) * 0.006, y = 0.65 + index % 2 * 0.012, z = 0.147 - Math.abs(index - 3) * 0.004; shafts.push(tapered("虹雉冠羽长而裸露的真实羽轴", covert, [[x * 0.4, 0.553, 0.171], [x, y, z]], [0.0018, 0.0008])); tips.push(leaf("虹雉长羽轴末端真正扩大的匙形羽片", covert, [x, y - 0.005, z], 0.019, 0.039, [-22, (index - 3) * 9, 0])); }
  parts.push(combineMeshes("虹雉长冠羽的分离细轴", covert, shafts), combineMeshes("虹雉匙形冠羽端片", covert, tips));
  foldedWings(parts, [0, 0.32, -0.03], 0.29, 0.29);
  tail(parts, [0, 0.18, -0.185], 0.21, 0.19, -103);
  feet(parts, [0, 0.155, 0.015], 0.068, 0.015, 0.1);
  return parts;
}

// https://dnpwc.gov.np/media/publication/Pheasant_Conservation_Action_Plan_2019_tvXkz80.pdf
function satyrTragopan(): ModelPart[] {
  const parts: ModelPart[] = [lobe("红胸角雉近圆而有深腹的厚重鸡躯", feather, [0, 0.235, -0.025], [0.28, 0.32, 0.35]), tapered("角雉由圆肩前方上举的短粗颈", feather, [[0, 0.335, 0.09], [0, 0.425, 0.13]], [0.052, 0.034])];
  head(parts, [0, 0.469, 0.161], [0.1, 0.118, 0.132], dark);
  parts.push(tapered("角雉较短而强下曲的硬嘴", bare, [[0, 0.455, 0.21], [0, 0.442, 0.256], [0, 0.421, 0.257]], [0.016, 0.011, 0.0008]));
  for (const side of [-1, 1]) parts.push(tapered("角雉两侧从裸皮后方竖出的软质短角", bare, [[side * 0.035, 0.507, 0.142], [side * 0.047, 0.55, 0.13], [side * 0.041, 0.576, 0.135]], [0.009, 0.006, 0.0008]));
  const bib = polygon("角雉由喉根连续悬垂而非贴在腹上的软皮喉兜", bare, [[-0.025, -0.427], [0.025, -0.427], [0.057, -0.39], [0.06, -0.3], [0.042, -0.265], [0, -0.25], [-0.042, -0.265], [-0.06, -0.3], [-0.057, -0.39]], 0.0035, [0, 0, 0.164]);
  bib.rotation.x = 90;
  parts.push(bib);
  foldedWings(parts, [0, 0.3, -0.03], 0.29, 0.27);
  tail(parts, [0, 0.16, -0.168], 0.17, 0.24, -105);
  feet(parts, [0, 0.14, 0.015], 0.066, 0.012, 0.081);
  return parts;
}

// https://resourcelibrary.clevelandmetroparks.com/animals/67
function easternCrestedGuineafowl(): ModelPart[] {
  const parts: ModelPart[] = [lobe("东非冠珠鸡圆肩而紧凑的短尾地栖躯", covert, [0, 0.225, -0.025], [0.25, 0.29, 0.35]), tapered("冠珠鸡从厚肩伸出的细裸颈", bare, [[0, 0.325, 0.105], [0, 0.42, 0.14]], [0.032, 0.021])];
  head(parts, [0, 0.451, 0.169], [0.074, 0.085, 0.106], bare);
  parts.push(tapered("冠珠鸡没有骨盔基部的短尖嘴", bare, [[0, 0.443, 0.208], [0, 0.433, 0.253]], [0.011, 0.0008]));
  const curls: ModelPart[] = [];
  for (let index = 0; index < 12; index++) { const x = (index % 4 - 1.5) * 0.011, z = 0.14 + Math.floor(index / 4) * 0.015; curls.push(tapered("冠珠鸡头顶真实卷曲的短冠羽轴", covert, [[x, 0.483, z], [x - 0.004, 0.522, z], [x + 0.009, 0.53, z - 0.013], [x + 0.011, 0.507, z - 0.021]], [0.0031, 0.0028, 0.0023, 0.001])); }
  parts.push(combineMeshes("东非冠珠鸡没有硬骨而全部卷曲成团的羽冠", covert, curls));
  foldedWings(parts, [0, 0.28, -0.03], 0.26, 0.28);
  tail(parts, [0, 0.16, -0.168], 0.13, 0.13, -104);
  feet(parts, [0, 0.14, 0.015], 0.061, 0.011, 0.08);
  return parts;
}

export const birdExpansionBatchTwelveDesigns: MasterNatureDesign[] = [
  design("greatBlueTuraco", "大蓝蕉鹃", "动物", () => calibrated(greatBlueTuraco(), 0.92), ["Corythaeola cristata", "高宽竖冠深喙长尾", "对趾树栖足"]),
  design("capuchinbird", "裸颈伞鸟", "动物", () => calibrated(capuchinbird(), 0.74), ["Perissocephalus tricolor", "裸头重嘴厚披肩羽", "短圆粗壮鸣禽躯"]),
  design("guiananCockOfTheRock", "圭亚那动冠伞鸟", "动物", () => calibrated(guiananCockOfTheRock(), 0.78), ["Rupicola rupicola", "覆盖到嘴上的半月扇冠", "短圆紧凑身躯"]),
  design("rhinocerosHornbill", "马来犀鸟", "动物", rhinocerosHornbill, ["Buceros rhinoceros", "前端向上翘的角盔", "大弯喙与等长宽尾"]),
  design("bulwersPheasant", "鳞背鹇", "动物", () => calibrated(bulwersPheasant(), 0.85), ["Lophura bulweri", "大头侧肉垂", "三十二枚真实弯曲白尾羽"]),
  design("ladyAmherstsPheasant", "白腹锦鸡", "动物", () => calibrated(ladyAmherstsPheasant(), 0.98), ["Chrysolophus amherstiae", "多羽叠合颈披肩", "细长弧垂尾束"]),
  design("blueEaredPheasant", "蓝马鸡", "动物", () => calibrated(blueEaredPheasant(), 0.91), ["Crossoptilon auritum", "后上卷白耳束", "高拱宽松长尾"]),
  design("himalayanMonal", "棕尾虹雉", "动物", himalayanMonal, ["Lophophorus impejanus", "长曲掘食嘴强足", "真羽轴匙形冠羽"]),
  design("satyrTragopan", "红胸角雉", "动物", satyrTragopan, ["Tragopan satyra", "双软角与悬垂喉兜", "圆肩深腹短尾"]),
  design("easternCrestedGuineafowl", "东非冠珠鸡", "动物", () => calibrated(easternCrestedGuineafowl(), 0.9), ["Guttera pucherani", "真实卷曲软羽冠", "裸细颈短尾地栖躯"]),
];
