import { Quaternion, Vector3 } from "three";
import { combineMeshes, design, eyes, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";
import { body } from "./fishForms";
import { pointed } from "./insectForms";
import { reptileLimb } from "./scaledReptiles";
import { hollowPipe } from "./shapedFoods";

const hide = "#abb19b";
const pale = "#c7caad";
const dark = "#819079";

// https://louisvillezoo.org/animalsandplants/lizard-philippine-sailfin/
function philippineSailfin(): ModelPart[] {
  const parts: ModelPart[] = [body("菲律宾帆蜥高胸窄腰的侧扁躯", [[-.16, .11, .041, .057], [-.06, .135, .068, .095], [.1, .14, .061, .087], [.2, .14, .032, .042]], hide), lobe("菲律宾帆蜥长而略呈三角的头", hide, [0, .164, .254], [.085, .075, .14]), lobe("菲律宾帆蜥下颌喉褶", pale, [0, .125, .223], [.064, .065, .09]), ...eyes([0, .185, .269], .032, .012), pointed("菲律宾帆蜥粗尾根至细长尾尖", hide, [[0, .105, -.14], [0, .088, -.27], [.015, .063, -.44], [.052, .03, -.66], [.085, .012, -.81]], [.042, .032, .022, .012, 0])];
  parts.push(part("菲律宾帆蜥位于粗尾基而非头后的高立帆", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .008, profile: [{ x: .12, y: .095 }, { x: .2, y: .185 }, { x: .29, y: .207 }, { x: .4, y: .169 }, { x: .56, y: .057 }, { x: .44, y: .047 }, { x: .27, y: .067 }, { x: .15, y: .077 }] }));
  for (const side of [-1, 1]) {
    reptileLimb(parts, [side * .045, .137, .12], [side * .12, .078, .075], [side * .15, .012, .16], .019);
    reptileLimb(parts, [side * .045, .115, -.12], [side * .14, .083, -.19], [side * .18, .012, -.115], .028);
    const fringes: ModelPart[] = [];
    for (let toe = 0; toe < 5; toe++) { const a = (toe / 4 - .5) * 1.9, length = .028 * (3.3 + Math.sin(toe / 4 * Math.PI) * 1.4); for (let i = 0; i < 4; i++) { const t = .35 + i * .14, p: Triple = [side * .18 + Math.sin(a) * length * t, .007 - t * .002, -.115 + Math.cos(a) * length * t]; fringes.push(pointed("菲律宾帆蜥后足趾缘的扁长游泳鳞", pale, [p, [p[0] + .005, p[1], p[2] + .006]], [.0024, 0])); } }
    parts.push(combineMeshes("菲律宾帆蜥后足完整趾缘鳞列", pale, fringes));
  }
  const crest: ModelPart[] = [];
  for (let i = 0; i < 16; i++) crest.push(pointed("菲律宾帆蜥头颈背部独立细齿冠", pale, [[0, .205 - i * .003, .254 - i * .028], [0, .231 - i * .003, .249 - i * .028]], [.006, 0]));
  parts.push(combineMeshes("菲律宾帆蜥与尾基高帆分开的背冠", pale, crest));
  return parts;
}

// https://www.nationalzoo.com.au/shingleback-skink
function shingleback(): ModelPart[] {
  const parts: ModelPart[] = [body("短尾蓝舌蜥肥厚短圆而非光滑细长的躯", [[-.12, .051, .025, .031], [-.075, .056, .051, .04], [.065, .058, .047, .04], [.115, .055, .033, .032]], hide), lobe("短尾蓝舌蜥宽楔形大头", hide, [0, .057, .145], [.092, .068, .12]), lobe("短尾蓝舌蜥外形近似头颅的短钝尾", hide, [0, .048, -.165], [.081, .064, .115]), ...eyes([0, .077, .159], .035, .009), lobe("短尾蓝舌蜥宽阔下颌", pale, [0, .035, .157], [.078, .025, .095])];
  for (const side of [-1, 1]) { reptileLimb(parts, [side * .033, .05, .078], [side * .072, .026, .053], [side * .078, .006, .086], .009); reptileLimb(parts, [side * .032, .046, -.079], [side * .073, .025, -.108], [side * .082, .006, -.072], .011); }
  const scales: ModelPart[] = [];
  for (let row = 0; row < 10; row++) for (let col = 0; col < 7; col++) {
    const z = -.19 + row * .036, a = col / 6 * Math.PI, width = z < -.12 ? .033 : z > .105 ? .034 : .044, y = z < -.12 ? .049 : .058;
    const p: Triple = [Math.cos(a) * width, y + Math.sin(a) * .032, z];
    scales.push(pointed("短尾蓝舌蜥向后覆叠的高凸松果状鳞", pale, [p, [p[0] * 1.12, p[1] + .008, z - .019]], [.012, 0]));
  }
  for (let i = 0; i < scales.length; i += 28) parts.push(combineMeshes("短尾蓝舌蜥实际覆盖躯背和钝尾的粗鳞", pale, scales.slice(i, i + 28)));
  return parts;
}

// https://auth1.dpr.ncparks.gov/reptiles/view.php?sciName=Ophisaurus+ventralis
function easternGlassLizard(): ModelPart[] {
  const path: Triple[] = [[0, .023, .245], [0, .023, .18], [.005, .022, .1], [.02, .022, .02], [.015, .02, -.06], [-.015, .019, -.14], [-.025, .018, -.22], [-.01, .017, -.3], [.03, .016, -.38], [.075, .014, -.46], [.105, .012, -.54], [.11, .009, -.62], [.105, .007, -.7]];
  const radii = [.014, .018, .019, .02, .019, .018, .017, .016, .014, .012, .009, .006, .0015];
  const section: [number, number][] = [[.85, 0], [.97, .14], [.9, .5], [.5, .86], [0, 1], [-.5, .86], [-.9, .5], [-.97, .14], [-.85, 0], [-.97, -.14], [-.8, -.5], [0, -.7], [.8, -.5], [.97, -.14]];
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  path.forEach((root, row) => {
    const tangent = new Vector3(...path[Math.min(row + 1, path.length - 1)]!).sub(new Vector3(...path[Math.max(0, row - 1)]!)).normalize(), q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), tangent);
    for (const [x, y] of section) { const p = new Vector3(x * radii[row]!, y * radii[row]!, 0).applyQuaternion(q).add(new Vector3(...root)); vertices.push({ x: p.x, y: p.y, z: p.z }); }
    if (row) for (let col = 0; col < section.length; col++) { const a = (row - 1) * section.length + col, b = (row - 1) * section.length + (col + 1) % section.length, c = row * section.length + col, d = row * section.length + (col + 1) % section.length; indices.push(a, b, c, b, d, c); }
  });
  const first = vertices.length, last = first + 1; vertices.push({ x: path[0]![0], y: path[0]![1], z: path[0]![2] }, { x: path.at(-1)![0], y: path.at(-1)![1], z: path.at(-1)![2] });
  for (let col = 0; col < section.length; col++) indices.push(first, (col + 1) % section.length, col, last, (path.length - 1) * section.length + col, (path.length - 1) * section.length + (col + 1) % section.length);
  const parts: ModelPart[] = [part("东部玻璃蜥真正具有两侧凹入纵沟的无足长体", "mesh", hide, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), lobe("东部玻璃蜥狭长有颞部的小头", pale, [0, .025, .264], [.033, .029, .058]), ...eyes([0, .033, .275], .011, .005)];
  for (const side of [-1, 1]) {
    const ear = hollowPipe("东部玻璃蜥区别于蛇的真正外耳孔", [[side * .011, .024, .248], [side * .0175, .024, .248]], .0035, .0022); ear.color = dark;
    parts.push(ear, pointed("东部玻璃蜥覆盖眼球上缘的可动眼睑外廓", hide, [[side * .011, .037, .274], [side * .011, .036, .28]], [.0048, 0]));
  }
  return parts;
}

// https://cites.org/sites/default/files/eng/cop/18/prop/060319/E-CoP18-Prop-32.pdf
function spiderTailedViper(): ModelPart[] {
  const path: Triple[] = [[0, .033, .18], [-.04, .031, .1], [-.12, .027, .035], [-.12, .026, -.055], [-.04, .026, -.11], [.075, .026, -.09], [.13, .025, -.015], [.09, .023, .062], [.03, .022, .015], [.045, .022, -.045], [.09, .026, -.055]];
  const parts: ModelPart[] = [tapered("蛛尾角蝰短粗而连续盘伏的实心躯", hide, path, [.019, .028, .033, .034, .034, .032, .028, .024, .019, .014, .009]), polygon("蛛尾角蝰宽扁短吻三角头", hide, [[-.02, .16], [-.036, .181], [-.027, .217], [0, .234], [.027, .217], [.036, .181], [.02, .16]], .024, [0, .021, 0]), ...eyes([0, .045, .201], .026, .007), lobe("蛛尾角蝰短尾末端真实卵形瘤体", pale, [.1, .029, -.052], [.025, .017, .038])];
  const appendages: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(pointed("蛛尾角蝰眼上单独直立的角状鳞", pale, [[side * .025, .047, .196], [side * .027, .066, .19]], [.006, 0]));
    for (let i = 0; i < 5; i++) appendages.push(pointed("蛛尾角蝰尾端向两侧延伸的蛛足状长鳞", pale, [[.09 + side * .008, .028, -.067 + i * .006], [.09 + side * (.02 + Math.sin(i / 4 * Math.PI) * .007), .027, -.072 + i * .009], [.09 + side * .027, .018, -.082 + i * .011]], [.0022, .0012, 0]));
  }
  parts.push(combineMeshes("蛛尾角蝰围绕卵形尾端的完整长鳞附肢", pale, appendages));
  return parts;
}

// https://reptile-database.reptarium.cz/Phrynocephalus/mystaceus
function secretToadhead(): ModelPart[] {
  const parts: ModelPart[] = [body("大耳沙蜥低伏扁圆的沙地躯", [[-.06, .026, .018, .016], [0, .032, .037, .023], [.052, .032, .026, .018]], hide), lobe("大耳沙蜥前端截短而顶面扁的宽头", hide, [0, .035, .074], [.065, .037, .057]), lobe("大耳沙蜥短而厚的下颌", pale, [0, .021, .084], [.057, .016, .04]), ...eyes([0, .05, .085], .021, .008), pointed("大耳沙蜥后部渐尖且末段卷举的长尾", hide, [[0, .028, -.055], [.012, .019, -.12], [.037, .015, -.19], [.053, .046, -.21], [.045, .068, -.197]], [.017, .013, .006, .003, 0])];
  for (const side of [-1, 1]) {
    reptileLimb(parts, [side * .023, .029, .037], [side * .057, .016, .011], [side * .064, .004, .04], .0065);
    reptileLimb(parts, [side * .022, .027, -.037], [side * .065, .02, -.065], [side * .073, .004, -.03], .009);
    const flap = polygon("大耳沙蜥从口角向外展开而非环颈的扇形皮褶", pale, [[side * .025, .065], [side * .049, .055], [side * .067, .064], [side * .071, .079], [side * .061, .095], [side * .037, .098], [side * .027, .084]], .002, [0, .022, 0]);
    parts.push(flap);
    const fringes: ModelPart[] = [];
    for (let i = 0; i < 8; i++) { const a = -1.1 + i * .32, root: Triple = [side * (.046 + Math.cos(a) * .019), .024, .077 + Math.sin(a) * .017]; fringes.push(pointed("大耳沙蜥口角扇缘真正分离的流苏鳞", pale, [root, [root[0] + side * .006, .022, root[2] + Math.sin(a) * .006]], [.0018, 0])); }
    parts.push(combineMeshes("大耳沙蜥扇状口角皮褶边缘流苏", pale, fringes));
  }
  return parts;
}

// https://www.nparks.gov.sg/florafaunaweb/fauna/1/2/1236
function malayanHornedFrog(): ModelPart[] {
  const parts: ModelPart[] = [lobe("马来长鼻角蟾背腹压扁而非圆球的躯", hide, [0, .036, -.015], [.11, .053, .115]), polygon("马来长鼻角蟾叶状扁头与前伸尖吻", pale, [[-.035, .006], [-.063, .04], [-.044, .068], [-.015, .083], [0, .113], [.015, .083], [.044, .068], [.063, .04], [.035, .006]], .022, [0, .031, 0]), ...eyes([0, .056, .053], .039, .013)];
  for (const side of [-1, 1]) {
    parts.push(pointed("马来长鼻角蟾眼睑上方向前伸出的三角皮瓣", hide, [[side * .035, .058, .047], [side * .044, .081, .066]], [.019, 0]), tapered("马来长鼻角蟾短细前肢", hide, [[side * .039, .034, .014], [side * .065, .018, .002], [side * .073, .006, .045]], [.01, .008, .004]), tapered("马来长鼻角蟾窄长折叠后肢", hide, [[side * .035, .033, -.034], [side * .078, .025, -.078], [side * .091, .006, -.008]], [.019, .013, .006]));
    const toes: ModelPart[] = [];
    for (const front of [true, false]) { const p: Triple = [side * (front ? .073 : .091), .006, front ? .045 : -.008]; for (let i = 0; i < (front ? 4 : 5); i++) toes.push(pointed("马来长鼻角蟾细而无圆吸盘的独立趾", pale, [p, [p[0] + (i - 2) * .006, .002, p[2] + .022 + Math.sin(i) * .004]], [.0024, 0])); }
    parts.push(combineMeshes("马来长鼻角蟾前后足完整细趾", pale, toes));
  }
  const ridges: ModelPart[] = [];
  for (const side of [-1, 1]) for (const row of [1, 2]) ridges.push(pointed("马来长鼻角蟾叶脉状纵向背褶", pale, [[side * row * .017, .051 - row * .003, -.058], [side * row * .017, .061 - row * .003, -.012], [side * row * .017, .052 - row * .003, .025]], [.002, .002, 0]));
  parts.push(combineMeshes("马来长鼻角蟾真实隆起的背部纵脊", pale, ridges));
  return parts;
}

// https://amphibiansoftheworld.amnh.org/Amphibia/Anura/Brevicipitidae/Breviceps/Breviceps-macrops
function desertRainFrog(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大眼沙蛙接近球形且头躯无细腰的身体", hide, [0, .027, 0], [.049, .049, .054]), lobe("大眼沙蛙短而平的宽面", pale, [0, .03, .018], [.04, .031, .023]), ...eyes([0, .041, .028], .0165, .009), lobe("大眼沙蛙不向外延长的短吻", hide, [0, .031, .033], [.018, .011, .006])];
  for (const side of [-1, 1]) {
    parts.push(tapered("大眼沙蛙仅从腹侧露出的极短前臂", hide, [[side * .016, .022, .012], [side * .025, .014, .014], [side * .024, .006, .025]], [.006, .0045, .0025]), tapered("大眼沙蛙紧贴球躯的屈曲短后肢", hide, [[side * .017, .023, -.014], [side * .032, .015, -.02], [side * .029, .005, -.003]], [.009, .006, .003]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 4; i++) digits.push(pointed("大眼沙蛙前足四枚无吸盘的短指", pale, [[side * .024, .006, .025], [side * .024 + (i - 1.5) * .0028, .002, .035 + Math.sin(i) * .002]], [.0017, 0]));
    const foot: Triple[] = [[side * .029, .005, -.003]];
    for (let i = 0; i < 5; i++) { const tip: Triple = [side * .029 + (i - 2) * .003, .002, .013 + Math.sin(i / 4 * Math.PI) * .005]; foot.push(tip); digits.push(pointed("大眼沙蛙后足五趾", pale, [[side * .029, .005, -.003], tip], [.0017, 0])); }
    parts.push(combineMeshes("大眼沙蛙完整的短指趾列", pale, digits), membrane("大眼沙蛙后趾间的真实宽蹼", pale, foot), lobe("大眼沙蛙后足内侧铲状跖突", pale, [side * .024, .004, 0], [.005, .004, .008]));
  }
  return parts;
}

// https://pubmed.ncbi.nlm.nih.gov/30119588/ 与 https://aquarium.org/animals/broad-footed-salamanders/
function broadFootedSalamander(): ModelPart[] {
  const parts: ModelPart[] = [body("宽足弹舌螈细长且没有外鳃的躯", [[-.031, .016, .007, .006], [0, .018, .01, .008], [.031, .019, .009, .007]], hide), lobe("宽足弹舌螈短而阔的低平头", pale, [0, .021, .041], [.027, .018, .027]), ...eyes([0, .028, .047], .009, .005), pointed("宽足弹舌螈由粗根延伸的圆锥尾", hide, [[0, .016, -.027], [.006, .013, -.05], [.01, .009, -.079], [.012, .007, -.103]], [.0075, .006, .003, 0])];
  for (const side of [-1, 1]) for (const front of [true, false]) {
    const root: Triple = [side * .007, .017, front ? .02 : -.021], ankle: Triple = [side * .023, .005, front ? .026 : -.014];
    parts.push(tapered("宽足弹舌螈支撑宽掌的细短四肢", hide, [root, [side * .02, .012, front ? .012 : -.03], ankle], [.0032, .0026, .0018]));
    const digits = front ? 4 : 5, outline: [number, number][] = [[ankle[0] - .004, ankle[2] - .003]];
    for (let i = 0; i < digits; i++) { const a = -.95 + i / (digits - 1) * 1.9; outline.push([ankle[0] + Math.sin(a) * .012, ankle[2] + Math.cos(a) * .014]); }
    outline.push([ankle[0] + .004, ankle[2] - .003]);
    parts.push(polygon("宽足弹舌螈趾完全包在蹼内的扁宽掌盘", pale, outline, .0015, [0, .003, 0]));
    const embedded: ModelPart[] = [];
    for (let i = 0; i < digits; i++) { const a = -.95 + i / (digits - 1) * 1.9; embedded.push(pointed("宽足弹舌螈蹼掌内隐约隆起而不游离的趾", pale, [ankle, [ankle[0] + Math.sin(a) * .01, .0047, ankle[2] + Math.cos(a) * .012]], [.0014, 0])); }
    parts.push(combineMeshes("宽足弹舌螈整掌内相连的趾骨隆缘", pale, embedded));
  }
  // 成体按馆方7–12厘米头尾长校准，宽蹼和所有指骨随主体等比缩放。
  for (const value of parts) for (const axis of ["x", "y", "z"] as const) { value.position[axis] *= .72; value.scale[axis] *= .72; }
  return parts;
}

export const landAnimalExpansionBatchTwoDesigns: MasterNatureDesign[] = [
  design("philippineSailfin", "菲律宾帆蜥", "动物", philippineSailfin, ["Hydrosaurus pustulatus", "粗尾基高帆与后趾缘鳞"]),
  design("shinglebackSkink", "短尾蓝舌蜥", "动物", shingleback, ["Tiliqua rugosa", "松果状粗鳞与拟头短钝尾"]),
  design("easternGlassLizard", "东部玻璃蜥", "动物", easternGlassLizard, ["Ophisaurus ventralis", "无足真耳孔活动眼睑与体侧纵沟"]),
  design("spiderTailedViper", "蛛尾角蝰", "动物", spiderTailedViper, ["Pseudocerastes urarachnoides", "短尾瘤体与蛛足状长鳞附肢"]),
  design("secretToadheadAgama", "大耳沙蜥", "动物", secretToadhead, ["Phrynocephalus mystaceus", "口角成对扇形皮褶及鳞流苏"]),
  design("malayanHornedFrog", "马来长鼻角蟾", "动物", malayanHornedFrog, ["Pelobatrachus nasutus", "Megophrys nasuta", "扁叶状头尖鼻及眼睑皮瓣"]),
  design("desertRainFrog", "大眼沙蛙", "动物", desertRainFrog, ["Breviceps macrops", "球躯大眼短四肢与后蹼掌"]),
  design("broadFootedSalamander", "宽足弹舌螈", "动物", broadFootedSalamander, ["Bolitoglossa platydactyla", "无外鳃圆尾与完全蹼化宽掌"]),
];
