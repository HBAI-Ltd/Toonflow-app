import { Euler, Quaternion, Vector3 } from "three";
import { combineMeshes, design, eyes, leaf, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";

const hide = "#a7b198";
const pale = "#c9cbb0";
const dark = "#7e907b";

// https://palass.org/sites/default/files/media/publications/palaeontology/volume_27/vol27_part4_pp867-874.pdf
// https://doi.org/10.1007/978-0-387-74903-6_7
// ACT: 脊柱材料不完整，躯干取保守的承重体形；不把长鼻长度和趾甲数当已证实特征。
function pyrotherium(): ModelPart[] {
  const parts: ModelPart[] = [lobe("焦兽宽深而不具象式高肩峰的承重躯", hide, [0, 1.06, -0.26], [1.63, 1.61, 2.72]), lobe("焦兽短颈后连接的厚前胸", hide, [0, 1.213, 0.667], [1.3, 1.33, 1.07]), tapered("焦兽短颈椎约束下的粗短头颈连接", hide, [[0, 1.39, 0.844], [0, 1.433, 1.216]], [0.392, 0.294]), lobe("焦兽大脑颅短而面部高深的厚头", hide, [0, 1.459, 1.511], [0.69, 0.78, 0.75]), lobe("焦兽支承前伸门齿的长窄下颌联合", pale, [0, 1.092, 1.715], [0.471, 0.307, 0.684]), tapered("焦兽开放鼻孔区推定的短柔鼻而非直接复制象鼻", hide, [[0, 1.637, 1.717], [0, 1.572, 1.902], [0, 1.392, 2.037], [0.035, 1.272, 2.044]], [0.138, 0.122, 0.079, 0.029]), ...eyes([0, 1.608, 1.635], 0.256, 0.052), tapered("焦兽保守复原的短厚尾根与渐细尾", hide, [[0, 1.041, -1.402], [0.042, 0.671, -1.657], [0.07, 0.397, -1.718]], [0.1, 0.064, 0.021])];
  for (const side of [-1, 1]) {
    parts.push(lobe("焦兽头后小外耳的软组织复原", dark, [side * 0.268, 1.666, 1.248], [0.123, 0.18, 0.109]), tapered("焦兽前肢强壮而短的肱桡骨外廓", hide, [[side * 0.446, 1.158, 0.671], [side * 0.572, 0.677, 0.607], [side * 0.587, 0.192, 0.806]], [0.251, 0.185, 0.116]), lobe("焦兽抬起腕部下连接的短宽前足垫", hide, [side * 0.587, 0.115, 0.837], [0.416, 0.228, 0.506]), tapered("焦兽股胫粗短且踝部放低的后肢", hide, [[side * 0.438, 1.045, -1.004], [side * 0.598, 0.618, -0.821], [side * 0.566, 0.15, -1.09]], [0.272, 0.2, 0.128]), lobe("焦兽与象直立柱足不同的长跟跖行后足", hide, [side * 0.566, 0.091, -0.985], [0.43, 0.179, 0.642]));
    for (const inner of [true, false]) {
      const x = side * (inner ? 0.093 : 0.224), start = inner ? 1.802 : 1.753;
      parts.push(tapered("焦兽上颌每侧两枚前伸门齿而非一枚犬齿", pale, [[x, 1.362, start], [x * 1.14, 1.195, start + 0.229], [x * 1.2, 1.028, start + 0.378]], [inner ? 0.048 : 0.059, inner ? 0.033 : 0.041, 0.002]));
    }
    parts.push(tapered("焦兽下颌每侧单枚斜上前伸并与上门齿咬合的长牙", pale, [[side * 0.157, 1.087, 1.866], [side * 0.198, 1.146, 2.08], [side * 0.228, 1.238, 2.234]], [0.056, 0.039, 0.002]));
  }
  return parts;
}

// https://doi.org/10.4202/app.00136.2014
// 始祖象完整骨架比例依据Larramendi的2.30米躯长、约0.70米肩高重建，不按现代象等比缩小。
function moeritherium(): ModelPart[] {
  const parts: ModelPart[] = [lobe("始祖象极长而低的狭桶躯", hide, [0, 0.434, -0.1], [0.73, 0.64, 1.59]), tapered("始祖象几乎水平而不抬高的短粗颈", hide, [[0, 0.514, 0.466], [0, 0.557, 0.748]], [0.206, 0.145]), lobe("始祖象脑颅长于面部而顶面很低的扁长头", hide, [0, 0.584, 0.966], [0.37, 0.327, 0.64]), lobe("始祖象没有现代象长鼻的厚前唇", pale, [0, 0.535, 1.251], [0.252, 0.192, 0.307]), lobe("始祖象长下颌与前端厚唇", hide, [0, 0.436, 1.114], [0.28, 0.157, 0.481]), ...eyes([0, 0.69, 1.032], 0.122, 0.028), tapered("始祖象与长躯相连的小短尾", hide, [[0, 0.454, -0.77], [0.025, 0.316, -0.956], [0.049, 0.207, -1.03]], [0.049, 0.031, 0.01])];
  for (const side of [-1, 1]) {
    parts.push(lobe("始祖象低头后方的小圆耳", dark, [side * 0.143, 0.692, 0.752], [0.071, 0.096, 0.061]), lobe("始祖象鼻吻前端的成对鼻孔", dark, [side * 0.069, 0.583, 1.374], [0.036, 0.022, 0.01]));
    for (const front of [true, false]) {
      const x = side * (front ? 0.258 : 0.265), z = front ? 0.472 : -0.563;
      parts.push(tapered("始祖象低长躯下侧展而短的分节肢", hide, [[x * 0.77, front ? 0.427 : 0.411, z], [x * 1.13, 0.235, z - (front ? 0.04 : -0.04)], [x, 0.076, z + 0.045]], [0.108, 0.078, 0.047]), lobe("始祖象跟部低而五趾展开的宽掌", hide, [x, 0.053, z + 0.073], [0.207, 0.104, 0.283]));
      const toes: ModelPart[] = [];
      for (let index = -2; index <= 2; index++) toes.push(lobe("始祖象足前缘五枚分别连接的小趾甲", dark, [x + index * 0.038, 0.037, z + 0.181 - Math.abs(index) * 0.015], [0.033, 0.049, 0.055]));
      parts.push(combineMeshes("始祖象五趾低足而非巨大圆柱象足", dark, toes));
    }
    parts.push(tapered("始祖象上颌前缘略扩大的第二门齿", pale, [[side * 0.077, 0.5, 1.278], [side * 0.094, 0.466, 1.376], [side * 0.096, 0.438, 1.395]], [0.024, 0.018, 0.001]), tapered("始祖象下颌与上门齿相对的短前伸门齿", pale, [[side * 0.065, 0.439, 1.277], [side * 0.075, 0.46, 1.386]], [0.02, 0.001]));
  }
  for (const value of parts) { value.position.z *= 0.95; value.scale.z *= 0.95; }
  return parts;
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC10049960/
// https://rid.unrn.edu.ar/bitstream/20.500.12049/3467/1/Libro%20de%20Resumenes%2033.as%20JAPV.pdf
function scelidotherium(): ModelPart[] {
  const parts: ModelPart[] = [lobe("细头地懒较窄且水平延长的低胸腹", hide, [0, 0.708, -0.174], [0.93, 0.88, 1.77]), lobe("细头地懒短宽股骨外侧的厚骨盆肌肉", hide, [0, 0.658, -0.652], [0.98, 0.86, 0.91]), tapered("细头地懒不高举成熊形的短粗前伸颈", hide, [[0, 0.817, 0.532], [0, 0.924, 0.968]], [0.219, 0.146]), lobe("细头地懒有小颊齿却极端狭长的管状头颅", pale, [0, 0.935, 1.283], [0.325, 0.302, 0.77]), lobe("细头地懒远伸到齿列前方的细长前颌与唇", hide, [0, 0.842, 1.608], [0.209, 0.178, 0.309]), ...eyes([0, 1.008, 1.276], 0.113, 0.032), tapered("细头地懒与水平腰躯连续的长粗尾", hide, [[0, 0.657, -0.892], [0.02, 0.397, -1.276], [0.053, 0.219, -1.668], [0.081, 0.149, -1.906]], [0.286, 0.209, 0.107, 0.037])];
  for (const side of [-1, 1]) {
    parts.push(lobe("细头地懒管状长颅后方的小圆耳", dark, [side * 0.132, 1.034, 0.99], [0.069, 0.102, 0.064]), tapered("细头地懒强壮短前臂的外廓", hide, [[side * 0.272, 0.79, 0.496], [side * 0.427, 0.421, 0.694], [side * 0.385, 0.17, 0.93]], [0.177, 0.143, 0.103]), lobe("细头地懒以外侧指骨支承而爪离地的内转前掌", hide, [side * 0.389, 0.127, 1.004], [0.282, 0.244, 0.381], [0, 0, side * 30]), tapered("细头地懒粗短股骨和外翻踝的后肢", hide, [[side * 0.291, 0.667, -0.604], [side * 0.468, 0.371, -0.427], [side * 0.445, 0.126, -0.614]], [0.229, 0.167, 0.103]), lobe("细头地懒后足外侧落地而不是平展熊掌", hide, [side * 0.449, 0.098, -0.452], [0.258, 0.178, 0.528], [0, 0, side * 27]));
    const foreDigits: ModelPart[] = [];
    for (let index = 0; index < 5; index++) foreDigits.push(tapered("细头地懒完整五指掌的各自短指骨", hide, [[side * 0.389 + (index - 2) * 0.037, 0.14, 1.011], [side * 0.394 + (index - 2) * 0.045, 0.106 + index * 0.016, 1.149 - Math.abs(index - 2) * 0.018]], [0.032, 0.02]));
    parts.push(combineMeshes("细头地懒包含不具爪I及IV指的完整前掌", hide, foreDigits));
    for (const index of [1, 2]) {
      const x = side * 0.394 + (index - 2) * 0.045;
      parts.push(tapered("细头地懒II和III指不侧扁且相对直的长爪", pale, [[x, 0.163 + index * 0.017, 1.129], [x, 0.219 + index * 0.02, 1.257], [x, 0.25 + index * 0.019, 1.302]], [0.031 + index * 0.003, 0.021, 0.001]));
    }
    parts.push(tapered("细头地懒内收并上抬而不着地的后足III趾大爪", pale, [[side * 0.408, 0.156, -0.293], [side * 0.361, 0.201, -0.115], [side * 0.306, 0.267, -0.07]], [0.046, 0.028, 0.0015]));
  }
  return parts;
}

function doedicurusCarapace(): ModelPart {
  const sections = [[-1.112, 0.29, 0.84], [-0.91, 0.62, 1.229], [-0.578, 0.789, 1.479], [-0.198, 0.856, 1.508], [0.176, 0.827, 1.41], [0.519, 0.716, 1.222], [0.792, 0.552, 0.996], [0.981, 0.348, 0.801]];
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], count = 13;
  for (let row = 0; row < sections.length; row++) {
    const [z, width, top] = sections[row]!;
    for (const inner of [false, true]) for (let index = 0; index < count; index++) { const angle = index / (count - 1) * Math.PI; vertices.push({ x: (width! - (inner ? 0.049 : 0)) * Math.cos(angle), y: 0.344 + (top! - 0.344 - (inner ? 0.056 : 0)) * Math.sin(angle), z: z! }); }
    if (!row) continue;
    for (const inner of [false, true]) for (let index = 0; index < count - 1; index++) { const a = (row - 1) * count * 2 + (inner ? count : 0) + index, b = a + 1, c = a + count * 2, d = c + 1; if (inner) indices.push(a, c, b, c, d, b); else indices.push(a, b, c, c, b, d); }
    for (const edge of [0, count - 1]) { const a = (row - 1) * count * 2 + edge, b = a + count * 2, c = a + count, d = b + count; if (!edge) indices.push(a, b, c, c, b, d); else indices.push(a, c, b, c, d, b); }
  }
  for (const row of [0, sections.length - 1]) for (let index = 0; index < count - 1; index++) { const a = row * count * 2 + index, b = a + 1, c = a + count, d = b + count; if (!row) indices.push(a, c, b, c, d, b); else indices.push(a, b, c, c, b, d); }
  return part("星尾兽后高前低且前口收窄的真实厚壁卵状甲壳", "mesh", hide, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC2825778/
function doedicurus(): ModelPart[] {
  const parts: ModelPart[] = [doedicurusCarapace(), lobe("星尾兽刚性甲壳内的低腹躯", hide, [0, 0.445, -0.07], [1.29, 0.58, 1.68]), tapered("星尾兽由收窄前甲口下方伸出的短颈", hide, [[0, 0.585, 0.774], [0, 0.499, 1.093]], [0.201, 0.137]), lobe("星尾兽长深且前额覆甲的低头颅", pale, [0, 0.508, 1.258], [0.416, 0.46, 0.573]), lobe("星尾兽颅前方短宽下垂的鼻吻", hide, [0, 0.391, 1.476], [0.307, 0.22, 0.281]), ...eyes([0, 0.607, 1.31], 0.154, 0.033), body("星尾兽长而僵直且远端横向膨大的融合骨管尾锤", [[-2.458, 0.198, 0.06, 0.061], [-2.351, 0.212, 0.268, 0.131], [-2.123, 0.239, 0.315, 0.14], [-1.858, 0.268, 0.242, 0.113], [-1.567, 0.299, 0.151, 0.096], [-1.378, 0.319, 0.117, 0.086]], pale), tapered("星尾兽甲壳与僵直尾管之间的短活动尾根", hide, [[0, 0.391, -0.955], [0, 0.353, -1.18], [0, 0.32, -1.408]], [0.15, 0.129, 0.109])];
  const sections = [[-0.91, 0.62, 1.229], [-0.578, 0.789, 1.479], [-0.198, 0.856, 1.508], [0.176, 0.827, 1.41], [0.519, 0.716, 1.222], [0.792, 0.552, 0.996]], plates: ModelPart[] = [];
  for (const [z, width, top] of sections) for (let index = 0; index < 10; index++) {
    const angle = (0.07 + index / 9 * 0.86) * Math.PI, x = width! * Math.cos(angle), y = 0.344 + (top! - 0.344) * Math.sin(angle), normal = new Vector3(Math.cos(angle) / width!, Math.sin(angle) / (top! - 0.344), z! < -0.5 ? -0.27 : z! > 0.4 ? 0.47 : 0.06).normalize(), rotation = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal));
    const tile = polygon("星尾兽紧嵌而不组成活动甲带的多孔皮骨板", pale, Array.from({ length: 6 }, (_, corner) => [Math.cos(corner * Math.PI / 3) * 0.103, Math.sin(corner * Math.PI / 3) * 0.103] as [number, number]), 0.024, [x - normal.x * 0.01, y - normal.y * 0.01, z! - normal.z * 0.01]);
    tile.rotation = { x: rotation.x * 180 / Math.PI, y: rotation.y * 180 / Math.PI, z: rotation.z * 180 / Math.PI };
    plates.push(tile);
  }
  for (let index = 0; index < plates.length; index += 20) parts.push(combineMeshes("星尾兽后高前低拱面上真实相接的六角骨甲片", pale, plates.slice(index, index + 20)));
  const headShield = polygon("星尾兽覆盖前额并在双眼上方留边的头盾", pale, [[-0.142, -0.18], [0.142, -0.18], [0.177, -0.01], [0.125, 0.177], [-0.125, 0.177], [-0.177, -0.01]], 0.034, [0, 0.658, 1.246]);
  headShield.rotation.x = 13;
  parts.push(headShield);
  for (let index = 0; index < 4; index++) parts.push(part("星尾兽只保留在尾基的完整活动骨环", "lathe", pale, [0, 0.377 - index * 0.014, -1.03 - index * 0.091], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.144 - index * 0.005, y: -0.029 }, { x: 0.144 - index * 0.005, y: 0.029 }, { x: 0.124 - index * 0.005, y: 0.029 }, { x: 0.124 - index * 0.005, y: -0.029 }, { x: 0.144 - index * 0.005, y: -0.029 }] }));
  for (const side of [-1, 1]) {
    parts.push(lobe("星尾兽头甲后的小外耳", dark, [side * 0.174, 0.619, 1.065], [0.064, 0.097, 0.069]));
    for (const front of [true, false]) {
      const x = side * (front ? 0.438 : 0.509), z = front ? 0.641 : -0.641;
      parts.push(tapered("星尾兽从刚甲下伸出且关节可弯的短强肢", hide, [[x * 0.76, front ? 0.504 : 0.519, z], [x * 1.08, 0.285, z - 0.073], [x, 0.104, z + 0.101]], [0.143, 0.116, 0.074]), lobe("星尾兽宽而稳定落地的足掌", hide, [x, 0.066, z + 0.147], [0.274, 0.129, 0.332]));
      parts.push(combineMeshes("星尾兽完整四枚钝蹄甲趾", dark, Array.from({ length: 4 }, (_, index) => lobe("星尾兽各自接足的钝甲趾", dark, [x + (index - 1.5) * 0.059, 0.049, z + 0.267 - Math.abs(index - 1.5) * 0.015], [0.052, 0.076, 0.098]))));
    }
    for (let index = 0; index < 3; index++) {
      const radius = index === 1 ? 0.093 : 0.064, z = -1.897 - index * 0.218, x = side * (index === 1 ? 0.308 : 0.257);
      parts.push(part("星尾兽尾锤侧面骨性凹盘的实体环缘不臆造长骨刺", "lathe", pale, [x, 0.239 - index * 0.009, z], [1, 1, 1], [0, 0, -side * 90], { profile: [{ x: radius * 0.61, y: -0.004 }, { x: radius, y: 0.009 }, { x: radius, y: 0.022 }, { x: radius * 0.69, y: 0.015 }, { x: radius * 0.61, y: -0.004 }] }));
    }
  }
  return parts;
}

// https://doi.org/10.7203/sjp.24118
// https://orbi.uliege.be/handle/2268/310490
function brachyodus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("短齿兽高腿上的深胸长腹而非河马贴地桶躯", hide, [0, 1.189, -0.17], [1.06, 1.16, 2.18]), tapered("短齿兽颈椎支持的斜上长颈而非低垂河马颈", hide, [[0, 1.445, 0.615], [0, 1.821, 0.942], [0, 2.067, 1.247]], [0.326, 0.249, 0.184]), lobe("短齿兽脑颅后倾而颌面延长的深大头颅", hide, [0, 2.059, 1.557], [0.563, 0.625, 0.969]), lobe("短齿兽前端狭深而非河马扁宽鼻盘的长吻", pale, [0, 1.857, 1.961], [0.364, 0.339, 0.427]), lobe("短齿兽向下扩大的颌支和长下颌", hide, [0, 1.709, 1.654], [0.455, 0.296, 0.822]), ...eyes([0, 2.202, 1.548], 0.203, 0.044), tapered("短齿兽骶骨约束的细尾而非河马肌肉扁尾", hide, [[0, 1.176, -1.093], [0.07, 0.741, -1.428], [0.129, 0.394, -1.528]], [0.056, 0.036, 0.012]), lobe("短齿兽尾末端小毛簇", dark, [0.129, 0.376, -1.528], [0.067, 0.174, 0.073])];
  for (const side of [-1, 1]) {
    parts.push(leaf("短齿兽颅后侧而非眼旁高耳丘的长圆耳", pale, [side * 0.209, 2.221, 1.244], 0.168, 0.245, [-19, side * 16, -side * 42]), lobe("短齿兽鼻吻两侧的鼻孔", dark, [side * 0.113, 1.928, 2.126], [0.045, 0.029, 0.014]));
    for (const front of [true, false]) {
      const x = side * (front ? 0.325 : 0.338), z = front ? 0.614 : -0.807;
      parts.push(tapered("短齿兽中长而并非河马短柱的分节肢", hide, [[x * 0.75, front ? 1.181 : 1.09, z], [x * 1.1, front ? 0.645 : 0.62, z + (front ? -0.084 : 0.139)], [x, 0.126, z + (front ? 0.141 : -0.107)]], [front ? 0.175 : 0.188, 0.105, 0.064]));
      const toes: ModelPart[] = [], nails: ModelPart[] = [], rootZ = z + (front ? 0.141 : -0.107);
      for (let index = 0; index < 4; index++) {
        const t = index - 1.5, main = index === 1 || index === 2, toeX = x + t * 0.051, endZ = rootZ + (main ? 0.188 : 0.121);
        toes.push(tapered("短齿兽四枚分别连接的承重指趾", hide, [[x + t * 0.019, 0.128, rootZ], [toeX, 0.058, endZ]], [main ? 0.041 : 0.029, main ? 0.03 : 0.019]));
        nails.push(lobe("短齿兽中央大双蹄和两侧较小的独立小蹄", dark, [toeX, 0.044, endZ + 0.016], [main ? 0.059 : 0.039, main ? 0.082 : 0.056, main ? 0.121 : 0.079]));
      }
      parts.push(combineMeshes("短齿兽非偶蹄模板拼块的完整四指趾掌", hide, toes), combineMeshes("短齿兽四趾各自真实连接的小蹄甲", dark, nails));
    }
  }
  return parts;
}

export const largeAncientMammalExpansionBatchTwoDesigns: MasterNatureDesign[] = [
  design("pyrotherium", "焦兽", "动物", pyrotherium, ["Pyrotherium romeroi", "Pyrotherium romeri", "上两对下一对共六枚前伸门齿长牙", "粗重肢和长跟跖行后足", "骨学约束的完整软组织简化复原"]),
  design("moeritherium", "始祖象", "动物", moeritherium, ["Moeritherium lyonsi", "极低长躯扁长颅无象式长鼻五趾短足", "并非现代象缩小版", "骨学约束的完整软组织简化复原"]),
  design("scelidotherium", "细头地懒", "动物", scelidotherium, ["Scelidotherium leptocephalum", "狭长管颅低长躯短股与足外侧承重", "前掌II及III指爪与后足单III趾大爪", "骨学约束的完整软组织简化复原"]),
  design("doedicurus", "星尾兽", "动物", doedicurus, ["Doedicurus clavicaudatus", "后高卵甲前口收束头盾与长僵直横宽尾锤", "保留尾锤骨性凹盘不把未保存角刺当骨骼", "骨学约束的完整软组织简化复原"]),
  design("brachyodus", "短齿兽", "动物", brachyodus, ["Brachyodus onoideus", "斜上长颈长深颅高腿四趾与细尾", "按2022颈椎与骶骨论文区别低颈河马式旧复原", "骨学约束的完整软组织简化复原"]),
];
