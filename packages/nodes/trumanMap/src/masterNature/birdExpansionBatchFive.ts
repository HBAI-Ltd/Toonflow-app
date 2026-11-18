import { combineMeshes, design, leaf, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { feet, foldedWings, head, tail } from "./birdExpansionBatchOne";

const feather = "#a6b299";
const covert = "#829582";
const pale = "#cbd0b7";
const bare = "#b2a98d";
const dark = "#596a5d";

export function talonFeet(parts: ModelPart[], hip: Triple, gap: number, radius: number, length: number, opposed = false) {
  for (const side of [-1, 1]) {
    const ankle: Triple = [hip[0] + side * gap, radius * 1.15, hip[2] + length * 0.08];
    parts.push(tapered("粗壮的承力跗蹠", bare, [[hip[0] + side * gap * 0.8, hip[1], hip[2]], [ankle[0], hip[1] * 0.55, hip[2] - length * 0.12], ankle], [radius * 1.2, radius, radius * 0.7]));
    const toes: ModelPart[] = [];
    const directions = opposed ? [[-1, 1], [1, 1], [-1, -1], [1, -1]] : [[-1, 1], [0, 1], [1, 1], [0, -1]];
    for (const [spread, direction] of directions as [number, number][]) {
      const end: Triple = [ankle[0] + spread * length * 0.35, radius * 0.82, ankle[2] + direction * length * (spread ? 0.85 : 1)];
      toes.push(tapered("分离而相向抓握的足趾", bare, [ankle, [end[0], radius * 1.1, end[2] - direction * length * 0.28], end], [radius * 0.65, radius * 0.48, radius * 0.35]), tapered("真正曲折向下的角质钩爪", dark, [end, [end[0], radius * 1.65, end[2] + direction * length * 0.2], [end[0], radius * 1.1, end[2] + direction * length * 0.44], [end[0], radius * 0.05, end[2] + direction * length * 0.52]], [radius * 0.42, radius * 0.32, radius * 0.18, 0.0007]));
    }
    parts.push(combineMeshes(opposed ? "两前两后的完整捕捞足" : "三前一后的完整猎捕足", bare, toes));
  }
}

// https://peregrinefund.org/explore-raptors-species/eagles/harpy-eagle
function harpyEagle(): ModelPart[] {
  const parts: ModelPart[] = [lobe("角雕特别宽厚而直立的胸腹", feather, [0, 0.44, -0.025], [0.42, 0.55, 0.47]), lobe("角雕有羽覆的粗短颈", pale, [0, 0.69, 0.085], [0.23, 0.27, 0.24])];
  head(parts, [0, 0.84, 0.145], [0.22, 0.23, 0.23], pale);
  parts.push(tapered("角雕粗深而内卷的钩嘴", bare, [[0, 0.825, 0.23], [0, 0.802, 0.3], [0, 0.75, 0.302]], [0.033, 0.022, 0.0015]));
  const disk: ModelPart[] = [], crest: ModelPart[] = [];
  for (const side of [-1, 1]) {
    for (let index = 0; index < 9; index++) { const angle = (-65 + index * 16) * Math.PI / 180; disk.push(leaf("可辨边缘的角雕面盘羽", pale, [side * 0.085, 0.842 + Math.sin(angle) * 0.045, 0.22 - Math.cos(angle) * 0.01], 0.027, 0.06, [Math.sin(angle) * 40, side * 80, 85 + Math.sin(angle) * 20])); }
    for (let index = 0; index < 5; index++) crest.push(leaf("两侧分开的后冠长羽", covert, [side * (0.025 + index * 0.01), 0.931, 0.09], 0.027, 0.13 + index % 2 * 0.015, [-18, side * 15, -side * (12 + index * 5)]));
    parts.push(lobe("前腿上厚实的羽毛套", pale, [side * 0.1, 0.23, 0.02], [0.1, 0.21, 0.105]));
  }
  parts.push(combineMeshes("头部两侧实际展开的羽毛面盘", pale, disk), combineMeshes("分叉而非单尖帽的后枕羽冠", covert, crest));
  foldedWings(parts, [0, 0.54, -0.025], 0.42, 0.43);
  tail(parts, [0, 0.265, -0.21], 0.25, 0.45, -105);
  talonFeet(parts, [0, 0.18, 0.04], 0.112, 0.024, 0.13);
  return parts;
}

// https://peregrinefund.org/explore-raptors-species/eagles/bateleur-eagle
function bateleur(): ModelPart[] {
  const parts: ModelPart[] = [lobe("短尾雕短躯而厚实的胸腹", covert, [0, 0.32, -0.025], [0.29, 0.38, 0.36]), lobe("短尾雕几乎贴入肩部的粗羽颈", covert, [0, 0.48, 0.065], [0.16, 0.21, 0.17])];
  head(parts, [0, 0.59, 0.11], [0.14, 0.155, 0.16], bare);
  parts.push(tapered("短尾雕短而粗钩的喙", bare, [[0, 0.573, 0.167], [0, 0.562, 0.22], [0, 0.52, 0.225]], [0.023, 0.017, 0.001]));
  for (const side of [-1, 1]) {
    parts.push(membrane("短尾雕长而后掠的低翼面", feather, [[side * 0.1, 0.43, 0.08], [side * 0.43, 0.52, 0.04], [side * 0.78, 0.47, -0.17], [side * 0.88, 0.39, -0.29], [side * 0.48, 0.25, -0.42], [side * 0.12, 0.25, -0.19]]));
    parts.push(combineMeshes("长翼向后收束的飞羽指端", covert, Array.from({ length: 9 }, (_, index) => leaf("狭长外翼羽", covert, [side * (0.33 + index * 0.053), 0.42 - index * 0.005, -0.07 - index * 0.015], 0.079, 0.28 - index * 0.009, [-115, -side * (index * 4 + 4), 0]))));
  }
  tail(parts, [0, 0.2, -0.17], 0.12, 0.065, -108);
  talonFeet(parts, [0, 0.18, 0.025], 0.065, 0.013, 0.075);
  return parts;
}

// https://www.allaboutbirds.org/guide/Osprey/overview
function osprey(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鹗狭长胸躯与较轻的腰部", feather, [0, 0.23, -0.025], [0.21, 0.28, 0.36]), tapered("鹗细长而前倾的颈", pale, [[0, 0.32, 0.105], [0, 0.43, 0.15]], [0.04, 0.03])];
  head(parts, [0, 0.48, 0.185], [0.11, 0.12, 0.14], pale);
  parts.push(tapered("鹗短而尖锐的下钩嘴", dark, [[0, 0.466, 0.235], [0, 0.453, 0.28], [0, 0.419, 0.286]], [0.019, 0.013, 0.001]));
  for (const side of [-1, 1]) {
    parts.push(membrane("鹗在腕部显著折角的狭长翼", covert, [[side * 0.075, 0.31, 0.09], [side * 0.32, 0.42, 0.2], [side * 0.53, 0.42, 0.12], [side * 0.8, 0.32, -0.09], [side * 0.84, 0.27, -0.19], [side * 0.46, 0.19, -0.26], [side * 0.11, 0.18, -0.15]]));
    parts.push(combineMeshes("弯折翼后缘连续的羽端", covert, Array.from({ length: 10 }, (_, index) => leaf("鹗翼外侧细长飞羽", covert, [side * (0.17 + index * 0.063), 0.31 + Math.sin(index / 9 * Math.PI) * 0.055, -0.015 - index * 0.012], 0.063, 0.23 - Math.abs(index - 4) * 0.01, [-112, -side * index * 3, 0]))));
  }
  tail(parts, [0, 0.15, -0.18], 0.13, 0.2, -105);
  talonFeet(parts, [0, 0.14, 0.018], 0.055, 0.011, 0.074, true);
  return parts;
}

// https://www.birdlife.org.za/red-data-book/red-list/bearded-vulture/
function beardedVulture(): ModelPart[] {
  const parts: ModelPart[] = [lobe("胡兀鹫有完整头颈羽的修长胸躯", feather, [0, 0.42, -0.035], [0.35, 0.47, 0.58]), tapered("胡兀鹫有羽覆的粗颈", pale, [[0, 0.58, 0.16], [0, 0.74, 0.22]], [0.065, 0.043])];
  head(parts, [0, 0.795, 0.27], [0.13, 0.16, 0.18], pale);
  parts.push(tapered("胡兀鹫长而末端内钩的喙", bare, [[0, 0.78, 0.335], [0, 0.76, 0.43], [0, 0.71, 0.438]], [0.026, 0.018, 0.001]));
  parts.push(combineMeshes("真正悬在喙下的刚毛胡须", dark, Array.from({ length: 7 }, (_, index) => tapered("喙下细长须状羽", dark, [[(index - 3) * 0.003, 0.745, 0.339], [(index - 3) * 0.004, 0.657 - index % 2 * 0.014, 0.355]], [0.0021, 0.0005]))));
  for (const side of [-1, 1]) {
    parts.push(membrane("胡兀鹫长而狭的滑翔翼", covert, [[side * 0.12, 0.57, 0.08], [side * 0.56, 0.7, 0.1], [side * 1.22, 0.71, -0.13], [side * 1.36, 0.61, -0.26], [side * 0.72, 0.44, -0.41], [side * 0.13, 0.37, -0.23]]));
    parts.push(combineMeshes("长翼外段相叠的飞羽", covert, Array.from({ length: 12 }, (_, index) => leaf("细长初级飞羽", covert, [side * (0.29 + index * 0.083), 0.56 + index * 0.007, -0.035 - index * 0.01], 0.09, 0.31 - index * 0.007, [-113, -side * (index * 2.5 + 5), 0]))));
  }
  parts.push(combineMeshes("中央最长而两边缩短的巨大楔形尾", covert, Array.from({ length: 9 }, (_, index) => leaf("胡兀鹫长楔尾羽", covert, [(index - 4) * 0.018, 0.27, -0.25], 0.06, 0.59 - Math.abs(index - 4) * 0.072, [-104, -(index - 4) * 5, 0]))));
  talonFeet(parts, [0, 0.26, 0.025], 0.075, 0.017, 0.095);
  return parts;
}

// https://www.nzbirdsonline.org.nz/species/southern-giant-petrel
function southernGiantPetrel(): ModelPart[] {
  const parts: ModelPart[] = [lobe("南巨鹱长而沉重的海鸟躯", feather, [0, 0.29, -0.025], [0.31, 0.35, 0.57]), tapered("巨鹱大头下方的短粗羽颈", feather, [[0, 0.4, 0.17], [0, 0.53, 0.22]], [0.066, 0.049])];
  head(parts, [0, 0.58, 0.285], [0.15, 0.16, 0.21]);
  parts.push(tapered("巨鹱厚基长喙与末端强钩", bare, [[0, 0.563, 0.365], [0, 0.56, 0.55], [0, 0.494, 0.586]], [0.04, 0.032, 0.002]));
  for (const side of [-1, 1]) parts.push(part("喙顶相连但各自贯通的管状鼻孔", "lathe", bare, [side * 0.016, 0.61, 0.445], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.009, y: -0.075 }, { x: 0.016, y: -0.075 }, { x: 0.016, y: 0.075 }, { x: 0.009, y: 0.075 }, { x: 0.009, y: -0.075 }] }));
  foldedWings(parts, [0, 0.35, -0.02], 0.32, 0.46);
  tail(parts, [0, 0.21, -0.28], 0.2, 0.2, -109);
  feet(parts, [0, 0.18, -0.065], 0.08, 0.014, 0.105, { web: 0.94, hindToe: false });
  return parts;
}

function vulturineGuineafowl(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鹫珠鸡长而圆满的低肩躯", covert, [0, 0.25, -0.03], [0.25, 0.3, 0.37]), tapered("不具骨盔且明显裸露的鹫形长颈", bare, [[0, 0.37, 0.105], [0, 0.53, 0.16], [0, 0.6, 0.19]], [0.035, 0.022, 0.019])];
  head(parts, [0, 0.626, 0.21], [0.07, 0.075, 0.09], bare);
  parts.push(tapered("鹫珠鸡短而略下曲的硬嘴", bare, [[0, 0.617, 0.243], [0, 0.607, 0.291], [0, 0.592, 0.294]], [0.012, 0.008, 0.0007]));
  const mantle: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 11; index++) mantle.push(leaf("由颈根向胸前披垂的长披针羽", pale, [side * (0.02 + index * 0.0055), 0.44 - index * 0.006, 0.105], 0.014, 0.2 + index % 3 * 0.018, [155, side * (index * 7 - 20), -side * 10]));
  parts.push(combineMeshes("与短圆背羽不同的细长披肩羽束", pale, mantle));
  foldedWings(parts, [0, 0.3, -0.04], 0.25, 0.3);
  tail(parts, [0, 0.2, -0.18], 0.12, 0.23, -96);
  feet(parts, [0, 0.15, 0.015], 0.056, 0.0085, 0.068);
  return parts;
}

// https://www.allaboutbirds.org/guide/Greater_Sage-Grouse/id
function greaterSageGrouse(): ModelPart[] {
  const parts: ModelPart[] = [lobe("艾草松鸡鼓大的前胸与圆腹", feather, [0, 0.245, -0.02], [0.31, 0.31, 0.4]), lobe("白胸羽蓬松外张的整体体积", pale, [0, 0.37, 0.12], [0.3, 0.28, 0.24])];
  head(parts, [0, 0.507, 0.17], [0.085, 0.1, 0.11], covert);
  parts.push(tapered("小头前方的短锥喙", bare, [[0, 0.496, 0.21], [0, 0.49, 0.258]], [0.013, 0.001]));
  for (const side of [-1, 1]) parts.push(lobe("胸前由周围羽毛包围的真实裸皮气囊", "#b8b08c", [side * 0.083, 0.35, 0.226], [0.115, 0.145, 0.1]), lobe("胸囊外下方自然下垂的短翼", covert, [side * 0.14, 0.247, -0.04], [0.12, 0.18, 0.3]));
  parts.push(combineMeshes("每枚都为尖端的放射星芒尾扇", covert, Array.from({ length: 17 }, (_, index) => leaf("艾草松鸡细长尖尾羽", covert, [0, 0.235, -0.185], 0.025, 0.45 - Math.abs(index - 8) * 0.009, [-10, 0, -70 + index * 8.75]))));
  feet(parts, [0, 0.14, 0.005], 0.065, 0.012, 0.085);
  return parts;
}

function westernCapercaillie(): ModelPart[] {
  const parts: ModelPart[] = [lobe("西方松鸡高胸而厚实的巨型林栖鸡躯", covert, [0, 0.29, -0.025], [0.34, 0.39, 0.45]), tapered("松鸡前胸上举的粗壮羽颈", covert, [[0, 0.4, 0.13], [0, 0.55, 0.18]], [0.068, 0.045])];
  head(parts, [0, 0.61, 0.22], [0.12, 0.14, 0.15], covert);
  parts.push(tapered("西方松鸡粗短且强弯的硬喙", pale, [[0, 0.596, 0.272], [0, 0.584, 0.333], [0, 0.55, 0.335]], [0.024, 0.017, 0.001]), combineMeshes("下颌到前胸倒披的喉羽髯", dark, Array.from({ length: 7 }, (_, index) => leaf("粗长前喉羽", dark, [(index - 3) * 0.01, 0.55, 0.23], 0.025, 0.14 + index % 2 * 0.02, [160, (index - 3) * 9, 0]))));
  foldedWings(parts, [0, 0.36, -0.035], 0.34, 0.34);
  parts.push(combineMeshes("没有琴形外弯羽的宽圆尾屏", covert, Array.from({ length: 15 }, (_, index) => leaf("松鸡宽而圆端的尾羽", covert, [0, 0.23, -0.22], 0.075, 0.41 - Math.abs(index - 7) * 0.009, [-15, 0, -64 + index * 9.14]))));
  for (const side of [-1, 1]) parts.push(lobe("覆盖跗蹠的厚实羽毛足套", pale, [side * 0.08, 0.095, 0.015], [0.065, 0.15, 0.075]));
  feet(parts, [0, 0.16, 0.015], 0.08, 0.013, 0.082);
  return parts;
}

// https://animaldiversity.org/accounts/Cairina_moschata/
function muscovyDuck(): ModelPart[] {
  const parts: ModelPart[] = [lobe("疣鼻栖鸭宽大低腹而有厚前胸的重躯", feather, [0, 0.21, -0.03], [0.34, 0.3, 0.47]), tapered("栖鸭肩部上举的粗羽颈", feather, [[0, 0.3, 0.14], [0, 0.44, 0.18]], [0.065, 0.044])];
  head(parts, [0, 0.495, 0.22], [0.135, 0.14, 0.17]);
  parts.push(body("高基部向前压扁的宽鸭嘴", [[0.275, 0.476, 0.035, 0.019], [0.365, 0.465, 0.04, 0.014], [0.4, 0.458, 0.021, 0.009]], bare));
  const caruncles: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 11; index++) { const angle = index * Math.PI * 2 / 11; caruncles.push(lobe("在眼周喙基真实起伏的肉瘤", "#b48c7a", [side * (0.048 + index % 3 * 0.003), 0.498 + Math.sin(angle) * 0.026, 0.258 + Math.cos(angle) * 0.028], [0.019, 0.019 + index % 2 * 0.006, 0.022])); }
  caruncles.push(lobe("喙根上方突起的鼻疣", "#b48c7a", [0, 0.507, 0.281], [0.035, 0.045, 0.039]));
  parts.push(combineMeshes("围眼面部与鼻基连续的实质肉瘤区", "#b48c7a", caruncles));
  foldedWings(parts, [0, 0.26, -0.035], 0.35, 0.38);
  tail(parts, [0, 0.17, -0.22], 0.19, 0.18, -100);
  feet(parts, [0, 0.135, -0.025], 0.081, 0.013, 0.087, { web: 0.88 });
  return parts;
}

function greatTinamou(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大䳍无外露尾羽的近卵形地栖躯", feather, [0, 0.22, -0.025], [0.27, 0.3, 0.33]), tapered("大䳍从低肩前举的细短颈", feather, [[0, 0.32, 0.09], [0, 0.42, 0.135]], [0.041, 0.027])];
  head(parts, [0, 0.458, 0.17], [0.08, 0.085, 0.105]);
  parts.push(tapered("大䳍细长而略向下弯的嘴", bare, [[0, 0.448, 0.211], [0, 0.443, 0.27], [0, 0.425, 0.286]], [0.011, 0.007, 0.0007]));
  for (const side of [-1, 1]) parts.push(lobe("贴合圆腹的短小圆翼", covert, [side * 0.107, 0.26, -0.03], [0.12, 0.15, 0.24]), combineMeshes("藏在覆羽中的短圆翼缘", covert, Array.from({ length: 6 }, (_, index) => leaf("短圆侧翼羽", covert, [side * (0.1 + index * 0.008), 0.25 - index * 0.006, -0.04], 0.032, 0.12 - index * 0.008, [-120, -side * index * 3, 0]))));
  feet(parts, [0, 0.13, 0.005], 0.056, 0.01, 0.067);
  return parts;
}

export const birdExpansionBatchFiveDesigns: MasterNatureDesign[] = [
  design("harpyEagle", "角雕", "动物", harpyEagle, ["Harpia harpyja", "羽毛面盘与分叉冠", "粗腿巨曲爪"]),
  design("bateleur", "短尾雕", "动物", bateleur, ["Terathopius ecaudatus", "极短尾与长后掠翼", "厚胸裸脸"]),
  design("osprey", "鹗", "动物", osprey, ["Pandion haliaetus", "腕折狭翼", "两前两后捕捞趾"]),
  design("beardedVulture", "胡兀鹫", "动物", beardedVulture, ["Gypaetus barbatus", "有羽颈与喙下须", "长楔形尾"]),
  design("southernGiantPetrel", "南巨鹱", "动物", southernGiantPetrel, ["Macronectes giganteus", "双孔真实贯通管鼻", "厚基强钩喙"]),
  design("vulturineGuineafowl", "鹫珠鸡", "动物", vulturineGuineafowl, ["Acryllium vulturinum", "无骨盔裸长颈", "长披针胸羽"]),
  design("greaterSageGrouse", "大艾草松鸡", "动物", greaterSageGrouse, ["Centrocercus urophasianus", "双胸囊与白胸羽围", "尖羽星芒尾"]),
  design("westernCapercaillie", "西方松鸡", "动物", westernCapercaillie, ["Tetrao urogallus", "圆羽尾扇与前喉髯", "厚羽足套"]),
  design("muscovyDuck", "疣鼻栖鸭", "动物", muscovyDuck, ["Cairina moschata", "眼周鼻疣肉瘤", "宽重胸躯与强趾"]),
  design("greatTinamou", "大䳍", "动物", greatTinamou, ["Tinamus major", "卵形地栖体", "短圆翼无外露尾"]),
];
