import { Quaternion, Vector3 } from "three";
import { combineMeshes, design, lobe, needle, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";
import { pointed } from "./insectForms";

const shell = "#9da88b";
const limb = "#a7af92";
const pale = "#c6c9ad";
const eye = "#465748";

// ACT: 微小动物以毫米书写局部网格、最后换算米；不放大个体或降低公共几何校验阈值。
function millimetres(parts: ModelPart[]): ModelPart[] {
  for (const item of parts) {
    for (const axis of ["x", "y", "z"] as const) {
      item.position[axis] *= 0.001;
      const target = item.scale[axis] * 0.001;
      item.scale[axis] = Math.max(0.001, target);
      if (target < 0.001) for (const vertex of item.vertices!) vertex[axis] *= target / 0.001;
    }
  }
  return parts;
}

function pairEyes(parts: ModelPart[], at: Triple, gap: number, size: number) {
  for (const side of [-1, 1]) parts.push(lobe("成对侧眼", eye, [side * gap + at[0], at[1], at[2]], [size, size, size]));
}

function antennae(parts: ModelPart[], at: Triple, reach: number, width: number) {
  for (const side of [-1, 1]) parts.push(pointed("折转触角", limb, [[at[0] + side * width, at[1], at[2]], [at[0] + side * reach * 0.6, at[1] + reach * 0.22, at[2] + reach * 0.25], [at[0] + side * reach, at[1] + reach * 0.12, at[2] + reach * 0.7]], [width, width * 0.6, width * 0.15]));
}

function walkingLegs(parts: ModelPart[], roots: Triple[], knees: Triple[], tips: Triple[], width: number) {
  roots.forEach((root, index) => parts.push(pointed("分节步足", limb, [root, knees[index]!, tips[index]!], [width, width * 0.7, width * 0.15])));
}

export function shellTube(name: string, path: Triple[], radii: number[], wall: number, color = pale): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [];
  const indices: number[] = [];
  for (let row = 0; row < path.length; row++) {
    const direction = new Vector3(...path[Math.min(row + 1, path.length - 1)]!).sub(new Vector3(...path[Math.max(0, row - 1)]!)).normalize();
    const orientation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction);
    for (const radius of [radii[row]!, radii[row]! - wall]) for (let sector = 0; sector < 8; sector++) {
      const angle = sector * Math.PI / 4;
      const vertex = new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius).applyQuaternion(orientation).add(new Vector3(...path[row]!));
      vertices.push({ x: vertex.x, y: vertex.y, z: vertex.z });
    }
    if (!row) continue;
    for (let sector = 0; sector < 8; sector++) {
      const next = (sector + 1) % 8, a = (row - 1) * 16 + sector, b = row * 16 + sector;
      const c = (row - 1) * 16 + next, d = row * 16 + next;
      indices.push(a, b, c, c, b, d, a + 8, c + 8, b + 8, c + 8, d + 8, b + 8);
    }
  }
  for (const [row, reverse] of [[0, false], [path.length - 1, true]] as const) for (let sector = 0; sector < 8; sector++) {
    const start = row * 16, a = start + sector, b = start + (sector + 1) % 8;
    const faces = [a, b, b + 8, a, b + 8, a + 8];
    if (reverse) for (let index = 0; index < faces.length; index += 3) [faces[index], faces[index + 1]] = [faces[index + 1]!, faces[index]!];
    indices.push(...faces);
  }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function sacredScarab(): ModelPart[] {
  const parts = [lobe("宽拱双鞘翅腹体", shell, [0, 6, -3], [20, 12, 22]), lobe("横宽前胸背板", shell, [0, 6, 9], [19, 10, 10]), polygon("扁阔掘土头盾", limb, [[-8, 12], [-7, 17], [-4, 20], [0, 21], [4, 20], [7, 17], [8, 12]], 1.8, [0, 4, 0])];
  const roots: Triple[] = [], knees: Triple[] = [], tips: Triple[] = [];
  for (const side of [-1, 1]) {
    for (let index = 0; index < 3; index++) { roots.push([side * 6, 4, 9 - index * 9]); knees.push([side * (index ? 15 : 12), 5, index ? 9 - index * 13 : 18]); tips.push([side * (index ? 21 : 18), 0.5, index ? 8 - index * 14 : 23]); }
    parts.push(pointed("扇形前胫节的宽扁掘土刃", limb, [[side * 12, 5, 18], [side * 17, 3, 21], [side * 18, 0.5, 23]], [2.6, 3.1, 1]));
    for (let tooth = 0; tooth < 4; tooth++) parts.push(needle("前胫节外侧独立掘土齿", pale, [side * (14 + tooth), 3, 19 + tooth], [side * (18 + tooth), 3, 19 + tooth], 1.2));
    for (let tooth = 0; tooth < 3; tooth++) parts.push(needle("头盾扇缘尖齿", limb, [side * (1 + tooth * 2), 5, 19 - tooth], [side * (1 + tooth * 2.5), 5, 22 - tooth], 1.2));
    parts.push(pointed("短柄叶片状触角", limb, [[side * 5, 5, 16], [side * 10, 6, 16], [side * 12, 6, 19]], [0.5, 0.35, 0.2]));
    for (let leaf = 0; leaf < 3; leaf++) parts.push(lobe("触角末端展开叶鳃片", pale, [side * 12, 6 + leaf * 0.6, 19], [2.5, 0.5, 3.2]));
  }
  walkingLegs(parts, roots, knees, tips, 0.9); pairEyes(parts, [0, 7, 14], 6, 1.5);
  parts.push(pointed("双鞘翅间的真实分界缝脊", limb, [[0, 11, 7], [0, 12, -3], [0, 9, -11]], [0.25, 0.22, 0.1]));
  return millimetres(parts);
}

function trapJawAnt(): ModelPart[] {
  const parts = [lobe("长方而前缘凹入的捕颚头", shell, [0, 2.5, 4], [2.8, 2.6, 4.2]), tapered("低长胸与后胸", shell, [[0, 2, 2], [0, 1.8, -1.5]], [0.9, 0.6]), pointed("单节高锥形腹柄", limb, [[0, 1.8, -1.5], [0, 3.1, -2.5], [0, 1.8, -3.2]], [0.4, 0.45, 0.3]), lobe("腹柄之后的独立卵形腹", shell, [0, 1.9, -5.2], [2.6, 2.6, 4.5])];
  for (const side of [-1, 1]) {
    parts.push(pointed("从头前中央近处横向打开的长捕颚", limb, [[side * 0.35, 2, 5.7], [side * 2.1, 2, 6], [side * 3.6, 2, 5.8]], [0.3, 0.22, 0.14]));
    for (let tooth = 0; tooth < 3; tooth++) parts.push(needle("捕颚末端向内回钩的齿", pale, [side * (3.1 + tooth * 0.2), 2, 5.8], [side * (3.2 + tooth * 0.15), 2, 5.3 - tooth * 0.1], 0.17));
    parts.push(pointed("长基节再折回的膝状触角", limb, [[side * 0.5, 3, 5], [side * 2.8, 3.6, 6.8], [side * 4, 3, 9.5]], [0.12, 0.09, 0.03]));
  }
  const roots: Triple[] = [], knees: Triple[] = [], tips: Triple[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { roots.push([side * 0.65, 1.9, 1.4 - i]); knees.push([side * 3, 3, 3 - i * 3]); tips.push([side * 5, 0.15, 5 - i * 4.5]); }
  walkingLegs(parts, roots, knees, tips, 0.18); pairEyes(parts, [0, 3.2, 4.3], 1.15, 0.45);
  return millimetres(parts);
}

function thornTreehopper(): ModelPart[] {
  const parts = [lobe("树枝下低伏头腹", shell, [0, 2.4, 0], [3.5, 3.6, 9.5]), polygon("前胸连续延伸的高三角棘及后鞘", shell, [[-5, 0], [-3, 1.8], [-2.3, 4], [-1, 10], [0.5, 5], [2.7, 1.8], [7, -1], [-1, -0.5]], 1.2)];
  parts[1]!.vertices = parts[1]!.vertices!.map(vertex => ({ x: vertex.y - 0.6, y: vertex.z, z: vertex.x }));
  parts[1]!.position = { x: 0, y: 3.1, z: 0 };
  for (const side of [-1, 1]) parts.push(membrane("顺腹两侧合拢的真实前翅", pale, [[side * 0.8, 4.2, 2], [side * 2.2, 3, -1], [side * 1.2, 0.7, -5.5], [side * 0.7, 2.6, -3]]));
  const roots: Triple[] = [], knees: Triple[] = [], tips: Triple[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { roots.push([side * 1.1, 2.5, 2 - i * 2]); knees.push([side * 3, 1.5, 3 - i * 2.8]); tips.push([side * 4, 0.1, 4 - i * 3.8]); }
  walkingLegs(parts, roots, knees, tips, 0.2); pairEyes(parts, [0, 3.4, 3.4], 1.3, 0.7); antennae(parts, [0, 2.4, 3.9], 1.2, 0.07);
  return millimetres(parts);
}

function leafTreehopper(): ModelPart[] {
  const outline: Triple[] = [[0, 3.2, 4.5], [0, 8.6, 3], [0, 9.2, -0.5], [0, 7.5, -3.8], [0, 2.1, -7], [0, 2.9, -1]];
  const parts = [lobe("叶片角蝉短楔形本体", shell, [0, 2.5, -0.5], [3.2, 3, 8]), membrane("前胸向上延长的整片侧扁叶脊", shell, outline), pointed("沿侧扁前胸延长的支撑主脊", limb, [[0, 3.2, 4.5], [0, 8.6, 3], [0, 9.2, -0.5], [0, 7.5, -3.8], [0, 2.1, -7]], [0.2, 0.17, 0.15, 0.11, 0.03])];
  for (const side of [-1, 1]) {
    parts.push(membrane("贴腹合拢的长翼", pale, [[side * 0.7, 4, 2], [side * 1.9, 3, -1], [side * 1.2, 0.9, -5], [side * 0.6, 2.5, -6]]));
    for (let i = 0; i < 3; i++) parts.push(pointed("树叶角蝉三对细足", limb, [[side * 0.8, 2.3, 2 - i * 2], [side * 3, 1.8, 3 - i * 3], [side * 3.8, 0.1, 4 - i * 3.8]], [0.18, 0.13, 0.03]));
  }
  pairEyes(parts, [0, 3, 3.4], 1.3, 0.65); antennae(parts, [0, 2.3, 3.5], 1.1, 0.08);
  return millimetres(parts);
}

function heelwalker(): ModelPart[] {
  const parts = [lobe("无翅粗壮前胸", shell, [0, 4.5, 3.5], [4.5, 5, 7]), lobe("宽而下向的咀嚼头", shell, [0, 5, 9], [5.8, 5, 4.5])];
  for (let i = 0; i < 7; i++) parts.push(lobe("螳䗛独立可辨腹节", shell, [0, 3.4, -1 - i * 1.6], [5.5 - i * 0.35, 4.8 - i * 0.2, 2.5]));
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const root: Triple = [side * 1.6, 4, 5 - i * 3], knee: Triple = [side * (i ? 7 : 5), 5.5, i ? 3 - i * 5 : 10], heel: Triple = [side * 8.5, 0.4, i ? 4 - i * 7 : 12];
    parts.push(pointed(i ? "有承重跗垫的中后足" : "带刺但不折成镰刀的捕食前足", limb, [root, knee, heel], [0.65, 0.6, 0.18]), lobe("贴地行走的近端足垫", pale, heel, [0.9, 0.7, 1.8]), pointed("翘起而不落地的末跗节", limb, [heel, [heel[0] + side * 0.5, 1.5, heel[2] + 1.1]], [0.19, 0.07]));
    if (!i) for (let tooth = 0; tooth < 4; tooth++) parts.push(needle("前腿内缘捕食小刺", limb, [root[0] + (knee[0] - root[0]) * (tooth + 1) / 5, 4.6, 6 + tooth], [root[0] + (knee[0] - root[0]) * (tooth + 1) / 5 - side * 1, 4, 6 + tooth], 0.3));
  }
  pairEyes(parts, [0, 6.4, 9.5], 2, 1.1); antennae(parts, [0, 6.4, 10], 13, 0.2);
  return millimetres(parts);
}

function snowScorpionfly(): ModelPart[] {
  const parts = [lobe("短胸与无飞行翼的卵形腹", shell, [0, 1.8, -0.8], [1.6, 1.8, 3.1]), lobe("小型上位头", shell, [0, 2.7, 1.2], [1.2, 1.4, 1.2]), pointed("向下指的长喙口器", limb, [[0, 2.5, 1.6], [0, 1.4, 2.2], [0, 0.8, 2.4]], [0.3, 0.2, 0.07]), pointed("腹端弯曲的产卵器", limb, [[0, 1.8, -2], [0, 2.1, -3], [0, 1.2, -3.5]], [0.2, 0.15, 0.05])];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) parts.push(pointed("雪面步行与跳跃的细长足", limb, [[side * 0.5, 1.9, 0.8 - i * 0.65], [side * (1.2 + i * 0.45), 3.4, 1.6 - i * 2], [side * (2.6 + i * 0.4), 0.1, 2.2 - i * 3]], [0.13, 0.11, 0.03]));
    parts.push(lobe("雌体胸侧残存的短翅芽", pale, [side * 0.65, 2.5, 0.2], [0.35, 0.65, 0.5]));
  }
  pairEyes(parts, [0, 3, 1.4], 0.5, 0.55); antennae(parts, [0, 3, 1.5], 2.5, 0.07);
  return millimetres(parts);
}

function pygmyMoleCricket(): ModelPart[] {
  const parts = [lobe("蚤蝼短圆前胸", shell, [0, 1.6, 1.5], [2.7, 2.4, 2.7]), lobe("短鞘覆盖的椭圆腹", shell, [0, 1.5, -1.4], [2.6, 2.2, 4]), lobe("半包于前胸的小头", limb, [0, 1.5, 3], [2, 2.2, 1.6])];
  for (const side of [-1, 1]) {
    parts.push(pointed("前端短粗的掘土前足", limb, [[side * 0.9, 1.4, 2], [side * 2.3, 1, 3], [side * 2.5, 0.2, 3.8]], [0.4, 0.45, 0.13]), pointed("中间细步足", limb, [[side * 1, 1.4, 0.5], [side * 2.3, 1.8, -0.2], [side * 3.8, 0.15, -0.7]], [0.18, 0.13, 0.03]), pointed("极膨大的跳跃后股节", shell, [[side * 1, 1.5, -0.5], [side * 3, 2.6, -2.4], [side * 3.2, 1.3, -3.2]], [0.55, 1, 0.3]), pointed("后胫节反折到腹部前方", limb, [[side * 3.2, 1.3, -3.2], [side * 4, 0.3, 0.6], [side * 4.2, 0.15, 1]], [0.2, 0.13, 0.03]));
    const plates: ModelPart[] = [];
    for (let i = 0; i < 4; i++) plates.push(membrane("后胫末端的独立游泳板", pale, [[side * 3.8, 0.6, -0.3 + i * 0.3], [side * 5, 0.7, -0.8 + i * 0.4], [side * 4.8, 0.65, -0.4 + i * 0.4], [side * 3.9, 0.5, i * 0.3]]));
    parts.push(combineMeshes("蚤蝼末端展开的四片泳板", pale, plates), pointed("腹末触须", limb, [[side * 0.6, 1.3, -3], [side * 1.3, 1.3, -4.8]], [0.15, 0.03]));
  }
  pairEyes(parts, [0, 2.1, 3.1], 0.85, 0.55); antennae(parts, [0, 2.1, 3.4], 2, 0.09);
  return millimetres(parts);
}

function forcepsDipluran(): ModelPart[] {
  const parts = [lobe("无眼而无翅的双尾头部", shell, [0, 1.8, 8.7], [3.6, 2.8, 4]), tapered("细长胸部", shell, [[0, 1.5, 6.8], [0, 1.3, 2.4]], [1.2, 1])];
  for (let i = 0; i < 8; i++) parts.push(lobe("裸露的铗尾虫腹环节", shell, [0, 1.2, 1.5 - i * 1.8], [3.1 - i * 0.15, 2.1, 2.6]));
  for (const side of [-1, 1]) {
    parts.push(pointed("粗壮分节末端铗须", limb, [[side * 0.65, 1.2, -11], [side * 2.7, 1.2, -13], [side * 1.1, 1.2, -15]], [0.7, 0.55, 0.1]));
    for (let tooth = 0; tooth < 3; tooth++) parts.push(needle("尾铗内侧夹持齿", pale, [side * (1.6 + tooth * 0.3), 1.2, -12.5 - tooth * 0.5], [side * (1 + tooth * 0.15), 1.2, -12.5 - tooth * 0.5], 0.23));
    for (let i = 0; i < 3; i++) parts.push(pointed("胸部三对短步足", limb, [[side * 0.8, 1.4, 6 - i * 1.6], [side * 3, 1.7, 6.8 - i * 2.5], [side * 4.6, 0.15, 7.5 - i * 3]], [0.22, 0.16, 0.04]));
  }
  antennae(parts, [0, 2.2, 10], 8, 0.14);
  return millimetres(parts);
}

function daphnia(): ModelPart[] {
  const parts = [lobe("壳内可见的躯干", shell, [0, 0.9, -0.1], [0.35, 1.3, 1.5]), lobe("头盾前端独眼头", pale, [0, 1.35, 0.9], [0.55, 0.8, 0.9]), lobe("头内中央融合复眼", eye, [0, 1.48, 1.12], [0.3, 0.3, 0.3]), pointed("后缘尖长壳刺", pale, [[0, 1.2, -0.9], [0, 1.3, -1.6]], [0.06, 0.01])];
  for (const side of [-1, 1]) {
    const valve = membrane("两侧分离的半透明卵圆甲壳瓣", pale, [[side * 0.28, 0.45, 0.9], [side * 0.33, 1.55, 0.6], [side * 0.28, 1.85, -0.15], [side * 0.27, 1.4, -0.95], [side * 0.22, 0.3, -0.7], [side * 0.2, 0.2, 0.2]]); valve.opacity = 0.42; parts.push(valve);
    parts.push(pointed("用于游泳的第二触角粗基节", limb, [[side * 0.14, 1.25, 0.65], [side * 0.75, 1.7, 0.55]], [0.09, 0.06]));
    for (const branch of [-1, 1]) {
      const top: Triple = [side * 1.2, 1.6 + branch * 0.25, 0.35 + branch * 0.45];
      parts.push(pointed("第二触角分叉泳枝", limb, [[side * 0.75, 1.7, 0.55], top], [0.05, 0.015]));
      const bristles: ModelPart[] = [];
      for (let i = 0; i < 5; i++) bristles.push(needle("分叉触角末端泳刚毛", pale, top, [side * (1.55 + i * 0.05), top[1] + (i - 2) * 0.12, top[2] + (i - 2) * 0.12], 0.025));
      parts.push(combineMeshes("一支泳触角上的完整刚毛扇", pale, bristles));
    }
    for (let i = 0; i < 5; i++) parts.push(membrane("甲壳内胸部滤食片足", limb, [[side * 0.06, 1.25 - i * 0.14, 0.45 - i * 0.2], [side * 0.18, 0.75 - i * 0.08, 0.5 - i * 0.2], [side * 0.22, 0.55 - i * 0.06, 0.22 - i * 0.2]]));
  }
  parts.push(pointed("弯折的无足后腹及双尾爪", shell, [[0, 0.65, -0.5], [0, 0.35, -0.7], [0, 0.42, -0.2]], [0.08, 0.07, 0.03]));
  return millimetres(parts);
}

function cyclops(): ModelPart[] {
  const parts = [lobe("剑水蚤宽前体", shell, [0, 0.35, 0.45], [0.65, 0.5, 1.3]), lobe("前额单个中央眼点", eye, [0, 0.53, 0.93], [0.1, 0.1, 0.1])];
  for (let i = 0; i < 5; i++) parts.push(lobe("逐节收细的尾腹节", limb, [0, 0.25, -0.15 - i * 0.18], [0.4 - i * 0.055, 0.28 - i * 0.025, 0.24]));
  for (const side of [-1, 1]) {
    parts.push(pointed("横伸的长第一触角", limb, [[side * 0.18, 0.4, 0.8], [side * 0.8, 0.45, 0.6], [side * 1.2, 0.4, 0.3]], [0.07, 0.04, 0.015]), lobe("附于腹前两侧的独立卵囊", pale, [side * 0.4, 0.26, -0.55], [0.4, 0.35, 0.7]), pointed("尾端成对叉枝", limb, [[side * 0.06, 0.25, -0.9], [side * 0.14, 0.23, -1.1]], [0.04, 0.02]));
    for (let i = 0; i < 4; i++) parts.push(pointed("胸下双肢游泳足", limb, [[side * 0.18, 0.3, 0.6 - i * 0.18], [side * 0.45, 0.14, 0.43 - i * 0.22], [side * 0.65, 0.07, 0.3 - i * 0.22]], [0.05, 0.035, 0.015]));
    const hairs: ModelPart[] = [];
    for (let i = 0; i < 4; i++) hairs.push(needle("尾叉末端长刚毛", pale, [side * 0.14, 0.23, -1.1], [side * (0.12 + i * 0.09), 0.19, -1.5 - i % 2 * 0.15], 0.025));
    parts.push(combineMeshes("尾叉完整刚毛组", pale, hairs));
  }
  return millimetres(parts);
}

function hydra(): ModelPart[] {
  const parts = [lobe("贴附水底的基盘", shell, [0, 0.12, 0], [1.6, 0.24, 1.6]), tapered("由基盘到口锥的柔软体柱", shell, [[0, 0.2, 0], [0.2, 3, 0], [0, 7, 0.2], [0, 8.5, 0.2]], [0.45, 0.6, 0.5, 0.25]), lobe("触手中央的口锥", pale, [0, 8.2, 0.2], [0.8, 1.1, 0.8])];
  for (let index = 0; index < 7; index++) {
    const angle = index * Math.PI * 2 / 7;
    parts.push(pointed("围绕口锥独立伸展的捕食触手", limb, [[Math.cos(angle) * 0.3, 7.8, 0.2 + Math.sin(angle) * 0.3], [Math.cos(angle) * 3, 10.8, 0.2 + Math.sin(angle) * 3], [Math.cos(angle) * 6, 11.4 - index % 2, 0.2 + Math.sin(angle) * 6], [Math.cos(angle) * 7, 9.5, 0.2 + Math.sin(angle) * 7]], [0.13, 0.1, 0.06, 0.015]));
  }
  return millimetres(parts);
}

function cristatella(): ModelPart[] {
  const parts = [lobe("具运动底面的蠕虫形胶质群体", shell, [0, 1.1, 0], [6, 2.3, 24]), lobe("连续贴地的腹面爬行底足", limb, [0, 0.35, 0], [5.2, 0.7, 24])];
  for (let zooid = 0; zooid < 8; zooid++) {
    const root: Triple = [zooid % 2 ? 1.4 : -1.4, 1.9, -9 + Math.floor(zooid / 2) * 6];
    const tentacles: ModelPart[] = [];
    for (let i = 0; i < 36; i++) {
      const angle = (-145 + i * 290 / 35) * Math.PI / 180;
      const p: Triple = [root[0] + Math.sin(angle) * 0.8, 2.5, root[2] + Math.cos(angle) * 0.8];
      tentacles.push(needle("马蹄形触手冠上分离的触手", pale, p, [root[0] + Math.sin(angle) * 1.9, 5.2, root[2] + Math.cos(angle) * 1.9], 0.07));
    }
    parts.push(tapered("从同一群体伸出的管状个虫", limb, [root, [root[0], 2.6, root[2]]], [0.4, 0.35]), combineMeshes("一个个虫完整的马蹄形触手冠", pale, tentacles));
  }
  return millimetres(parts);
}

function hammerheadFlatworm(): ModelPart[] {
  const body = tapered("扁而连续弯曲的陆生涡虫体", shell, [[0, 0.8, 58], [1, 0.8, 42], [6, 0.8, 15], [2, 0.8, -15], [-7, 0.8, -40], [-3, 0.8, -65], [0, 0.8, -75]], [1.5, 1.7, 2, 1.9, 1.5, 0.9, 0.1]);
  body.vertices = body.vertices!.map(vertex => ({ ...vertex, y: 0.8 + (vertex.y - 0.8) * 0.35 }));
  const head = polygon("两端反卷的槌头状半月头", limb, [[0, 63], [-4, 62], [-5.5, 60], [-5, 57], [-3.8, 58.5], [-3.2, 60], [0, 60.5], [3.2, 60], [3.8, 58.5], [5, 57], [5.5, 60], [4, 62]], 1.3);
  return millimetres([body, head]);
}

function horsehairWorm(): ModelPart[] {
  const path: Triple[] = Array.from({ length: 40 }, (_, index) => {
    const t = index / 39 * Math.PI * 3;
    return [Math.sin(t) * (21 + index * 0.3), 0.5 + Math.pow(Math.sin(t / 2), 2) * 2.4, Math.sin(t * 2) * 15 + index * 0.8];
  });
  return millimetres([tapered("无附肢的细长线形连续躯体", shell, path, path.map((_, i) => i === 0 || i === path.length - 1 ? 0.16 : 0.28))]);
}

function waterBear(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let segment = 0; segment < 5; segment++) parts.push(lobe("水熊虫桶状体的连续体褶", shell, [0, 0.23, 0.35 - segment * 0.17], [0.38 - Math.abs(segment - 2) * 0.025, 0.36, 0.29]));
  for (const side of [-1, 1]) for (let pair = 0; pair < 4; pair++) {
    const root: Triple = [side * 0.13, 0.18, 0.28 - pair * 0.19];
    const foot: Triple = [side * (pair === 3 ? 0.22 : 0.28), 0.045, root[2] - (pair === 3 ? 0.12 : 0)];
    parts.push(tapered("不分节的短钝叶足", limb, [root, foot], [0.07, 0.04]));
    for (const claw of [-1, 1]) parts.push(pointed("足末独立弯曲抓握爪", pale, [[foot[0], foot[1], foot[2] + claw * 0.025], [foot[0] + side * 0.05, 0.025, foot[2] + claw * 0.04], [foot[0] + side * 0.06, 0.07, foot[2] + claw * 0.04]], [0.02, 0.014, 0.005]));
  }
  parts.push(shellTube("前端真正开口的圆形口管", [[0, 0.24, 0.43], [0, 0.24, 0.55]], [0.055, 0.065], 0.018));
  for (const side of [-1, 1]) parts.push(pointed("口管外侧感觉乳突", limb, [[side * 0.05, 0.27, 0.45], [side * 0.1, 0.32, 0.5]], [0.025, 0.009]));
  return millimetres(parts);
}

function fourAxisSnail(): ModelPart[] {
  const path: Triple[] = [];
  for (let index = 0; index < 12; index++) { const t = index / 11 * Math.PI * 3.1, radius = 0.12 + index * 0.035; path.push([Math.cos(t) * radius, 0.5 + index * 0.04, Math.sin(t) * radius]); }
  const arcs: [Triple, Triple, number][] = [[[0, 0, 1], [0.48, 0, 0], Math.PI * 1.65], [[1, 0, 0], [0, 0.46, 0], Math.PI * 1.7], [[0, 1, 0], [0.5, 0, 0], Math.PI * 1.4]];
  for (const [axis, radial, sweep] of arcs) {
    const start = new Vector3(...path.at(-1)!);
    const radius = new Vector3(...radial), center = start.clone().sub(radius);
    for (let index = 1; index <= 6; index++) {
      const point = radius.clone().applyAxisAngle(new Vector3(...axis), sweep * index / 6).add(center);
      path.push([point.x, point.y, point.z]);
    }
  }
  const parts = [shellTube("具有四个盘绕轴并多次离合的连续壳管", path, path.map((_, i) => 0.065 + i * 0.0024), 0.024), lobe("从末端壳口伸出的腹足", limb, [path.at(-1)![0], 0.15, path.at(-1)![2]], [0.6, 0.28, 1])];
  const end = path.at(-1)!;
  parts.push(tapered("将壳口内软体连续接到腹足的短颈", limb, [end, [end[0], 0.18, end[2] + 0.12]], [0.09, 0.11]));
  for (const side of [-1, 1]) parts.push(pointed("壳口前小型触角", limb, [[end[0] + side * 0.15, 0.2, end[2] + 0.3], [end[0] + side * 0.35, 0.6, end[2] + 0.65]], [0.025, 0.01]));
  return millimetres(parts);
}

function hairySnail(): ModelPart[] {
  const path: Triple[] = [];
  for (let index = 0; index < 30; index++) { const t = index / 29 * Math.PI * 6, radius = 0.1 + index * 0.12; path.push([Math.cos(t) * radius, 2.6 + index * 0.055, Math.sin(t) * radius]); }
  const radii = path.map((_, i) => 0.13 + i * 0.035);
  const parts = [shellTube("低圆锥形带真实壳口的连续蜗壳", path, radii, 0.08), lobe("接地伸展的软腹足", limb, [0, 0.65, 2], [4, 1.3, 12]), lobe("腹足前端软头", limb, [0, 1.3, 6.3], [3, 1.7, 3]), lobe("壳口下连接内脏团与腹足的外套", limb, [2.4, 2.1, 0], [3.5, 4.5, 4])];
  const hairs: ModelPart[] = [];
  for (let index = 0; index < 50; index++) {
    const row = 15 + index % 15, a = index * 2.4, root = path[row]!, r = radii[row]!;
    const p: Triple = [root[0] + Math.cos(a) * r * 0.7, root[1] + r * 0.7, root[2] + Math.sin(a) * r * 0.7];
    hairs.push(needle("蜗壳表面真实伸出的硬毛", pale, p, [p[0] + Math.cos(a) * 0.6, p[1] + 0.7, p[2] + Math.sin(a) * 0.6], 0.06));
  }
  parts.push(combineMeshes("完整蜗壳硬毛层", pale, hairs));
  for (const side of [-1, 1]) {
    parts.push(pointed("上方长眼柄", limb, [[side * 0.8, 1.6, 6.5], [side * 1.8, 4.1, 8]], [0.15, 0.06]), lobe("长眼柄末端眼点", eye, [side * 1.8, 4.1, 8], [0.24, 0.24, 0.24]), pointed("下方短触角", limb, [[side * 0.8, 1.2, 7], [side * 2, 1.7, 8.4]], [0.11, 0.03]));
  }
  return millimetres(parts);
}

function pillWoodlouse(): ModelPart[] {
  const parts = [lobe("鼠妇前端头节", shell, [0, 2.9, 7], [5.1, 3.4, 4.2])];
  for (let i = 0; i < 7; i++) {
    const z = 5 - i * 1.6, width = 7.8 - Math.abs(i - 2) * 0.5;
    parts.push(lobe("七块拱起但分离的胸背甲板", shell, [0, 3.1, z], [width, 5, 2.9]));
    for (const side of [-1, 1]) parts.push(pointed("胸部每节一对承重步足", limb, [[side * width * 0.35, 2.1, z], [side * width * 0.55, 1.6, z - 0.5], [side * width * 0.68, 0.12, z - 0.9]], [0.27, 0.2, 0.06]));
  }
  for (let i = 0; i < 5; i++) parts.push(lobe("收于胸甲之后的短腹甲", limb, [0, 2.3, -6 - i * 0.5], [5.4 - i * 0.65, 3.3 - i * 0.35, 1.3]));
  antennae(parts, [0, 3.1, 8], 4.8, 0.22); pairEyes(parts, [0, 3.9, 7], 2.1, 0.7);
  for (const side of [-1, 1]) parts.push(lobe("与尾端齐平而不外伸的截短尾肢", limb, [side * 0.8, 1.5, -8], [1.1, 1.1, 1.2]));
  return millimetres(parts);
}

function pelicanSpider(): ModelPart[] {
  const parts = [lobe("古蛛腹部", shell, [0, 2.2, -1.2], [2.3, 2.7, 3]), lobe("腿着生的前胸下盘", shell, [0, 2.3, 1], [1.9, 1.8, 2.2]), tapered("向上延长而不等同普通胸甲的细颈", limb, [[0, 2.5, 1], [0, 4.6, 1.4], [0, 6.1, 1.9]], [0.65, 0.4, 0.38]), lobe("细颈顶端的隆起头", shell, [0, 6.2, 2], [1.4, 1.3, 1.6])];
  for (const side of [-1, 1]) {
    parts.push(pointed("从高位头端向前下延伸的长螯肢", limb, [[side * 0.35, 6, 2.4], [side * 0.5, 3.8, 3.7], [side * 0.25, 2.8, 4.3]], [0.3, 0.22, 0.05]), pointed("螯肢末端回钩毒牙", pale, [[side * 0.25, 2.8, 4.3], [side * 0.12, 3.2, 4.2]], [0.1, 0.02]));
    for (let leg = 0; leg < 4; leg++) parts.push(pointed("古蛛四对长步足", limb, [[side * 0.65, 2.6, 1.8 - leg * 0.65], [side * (4 + leg % 2), 4.2, 5 - leg * 3], [side * (6 + leg % 2), 0.1, 7 - leg * 4.2]], [0.15, 0.12, 0.025]));
  }
  pairEyes(parts, [0, 6.7, 2.4], 0.35, 0.19);
  return millimetres(parts);
}

function spinyOrbWeaver(): ModelPart[] {
  const parts = [lobe("六棘腹蛛横宽而扁的硬腹盾", shell, [0, 3.1, -1.5], [11, 3.3, 6.7]), lobe("腹盾前的小型头胸部", limb, [0, 2.6, 2.4], [3.8, 3, 3.5])];
  for (const side of [-1, 1]) {
    parts.push(pointed("腹盾前侧向外的第一棘", limb, [[side * 3.2, 3.2, 0.8], [side * 6.7, 3.4, 2.7]], [1.1, 0.04]), pointed("腹盾最外侧长横棘", limb, [[side * 4, 3.2, -1.1], [side * 8.4, 3.6, -1.8]], [1.2, 0.04]), pointed("腹盾后侧成对尾棘", limb, [[side * 3.3, 3.2, -3.4], [side * 5.4, 3.3, -6.2]], [0.95, 0.04]));
    for (let leg = 0; leg < 4; leg++) parts.push(pointed("前胸四对折曲细足", limb, [[side * 1.1, 2.5, 3 - leg * 0.7], [side * (3.5 + leg % 2), 3.8, 6 - leg * 2], [side * (5.5 + leg % 2), 0.1, 7 - leg * 2.8]], [0.23, 0.18, 0.03]));
    parts.push(pointed("前端成对短螯肢", limb, [[side * 0.5, 2.3, 3.8], [side * 0.5, 1.7, 4.5]], [0.25, 0.06]));
  }
  pairEyes(parts, [0, 3.5, 3.5], 0.65, 0.35);
  return millimetres(parts);
}

function netCastingSpider(): ModelPart[] {
  const parts = [tapered("网投蛛细杆状腹体", shell, [[0, 6, -10], [0, 6, -3], [0, 6.5, 1]], [0.55, 1.7, 1.15]), lobe("前端窄长头胸", limb, [0, 6.5, 4], [3.1, 3, 6])];
  for (const side of [-1, 1]) {
    parts.push(lobe("朝前的异常巨大的成对主眼", eye, [side * 0.85, 7.4, 6.4], [1.6, 1.6, 1.6]), pointed("眼下向内的小型螯肢", limb, [[side * 0.6, 6.3, 6.2], [side * 0.7, 4.8, 7.5]], [0.4, 0.12]));
    for (let leg = 0; leg < 4; leg++) {
      const root: Triple = [side * 1.1, 6.2, 5 - leg];
      const knee: Triple = [side * (leg < 2 ? 8 : 11), 11, leg < 2 ? 17 - leg * 3 : -9 - leg * 2];
      const tip: Triple = [side * (leg < 2 ? 13 : 18), 0.12, leg < 2 ? 28 - leg * 6 : -18 - leg * 3];
      parts.push(pointed("极细长并具有明显膝折的四对步足", limb, [root, knee, tip], [0.3, 0.23, 0.035]));
    }
  }
  return millimetres(parts);
}

// 形态依据：各文献的实体结构，未下载或复用第三方模型。
// https://mississippientomologicalmuseum.org.msstate.edu/Researchtaxapages/Formicidaepages/genericpages/Odontomachus_bauri.html
// https://ask.ifas.ufl.edu/publication/IN332
// https://pmc.ncbi.nlm.nih.gov/articles/PMC11515392/
// https://lacewings.myspecies.info/taxonomy/term/131/
// https://pmc.ncbi.nlm.nih.gov/articles/PMC4108089/
// https://link.springer.com/article/10.1186/s12983-015-0112-2
// https://extension.psu.edu/hammerhead-flatworms-and-other-land-planaria-of-eastern-north-america
// https://www.amnh.org/explore/ology/ology-cards/364-tardigrade
// https://pmc.ncbi.nlm.nih.gov/articles/PMC2429931/
// https://bmig.org.uk/index.php/species/armadillidium-vulgare
// https://www.si.edu/newsdesk/releases/scientists-discover-18-new-spider-hunting-pelican-spiders-madagascar
// https://ask.ifas.ufl.edu/publication/IN324
// https://australian.museum/learn/animals/spiders/net-casting-spiders/
export const invertebrateExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("sacredScarab", "圣甲虫", "动物", sacredScarab, ["Scarabaeus sacer", "头盾扇齿", "叶鳃状触角"]),
  design("bauriTrapJawAnt", "鲍氏琴颚蚁", "动物", trapJawAnt, ["Odontomachus bauri", "横向捕颚", "高锥腹柄"]),
  design("thornTreehopper", "粗角刺角蝉", "动物", thornTreehopper, ["Umbonia crassicornis", "高背棘前胸"]),
  design("leafTreehopper", "叶片角蝉", "动物", leafTreehopper, ["Membracis foliata", "侧扁叶形前胸"]),
  design("zephyraHeelwalker", "螳䗛", "动物", heelwalker, ["Mantophasma zephyra", "无翅", "上翘末跗节"]),
  design("snowScorpionfly", "雪蝎蛉", "动物", snowScorpionfly, ["Boreus hyemalis", "短翅芽", "下向长喙"]),
  design("pygmyMoleCricket", "花斑蚤蝼", "动物", pygmyMoleCricket, ["Tridactylus variegatus", "后足跳跃股节", "胫末泳板"]),
  design("forcepsDipluran", "铗尾虫", "动物", forcepsDipluran, ["Japyx solifugus", "无眼双尾", "腹端铗须"]),
  design("largeWaterFlea", "大型溞", "动物", daphnia, ["Daphnia magna", "分枝泳触角", "半透明甲壳"]),
  design("cyclopsStrenuus", "剑水蚤", "动物", cyclops, ["Cyclops strenuus", "中央独眼", "尾叉"]),
  design("commonHydra", "普通水螅", "动物", hydra, ["Hydra vulgaris", "基盘", "捕食触手"]),
  design("creepingBryozoan", "冠苔虫群体", "动物", cristatella, ["Cristatella mucedo", "蠕虫形群体", "马蹄形触手冠"]),
  design("hammerheadLandFlatworm", "槌头笄蛭", "动物", hammerheadFlatworm, ["Bipalium kewense", "半月头", "扁平陆生涡虫"]),
  design("horsehairWorm", "铁线虫", "动物", horsehairWorm, ["Gordius aquaticus", "细线状无附肢躯体"]),
  design("predatoryWaterBear", "水熊虫", "动物", waterBear, ["Milnesium tardigradum", "四对叶足", "开口口管"]),
  design("fourAxisLandSnail", "四轴旋壳蜗牛", "动物", fourAxisSnail, ["Opisthostoma vermiculum", "四轴离合盘绕", "贯通壳口"]),
  design("hairyLandSnail", "毛被蜗牛", "动物", hairySnail, ["Trochulus hispidus", "壳表硬毛", "低圆锥壳"]),
  design("commonPillWoodlouse", "普通球鼠妇", "动物", pillWoodlouse, ["Armadillidium vulgare", "七对步足", "截短尾肢"]),
  design("workmanPelicanSpider", "长颈古蛛", "动物", pelicanSpider, ["Eriauchenius workmani", "高颈", "长螯肢"]),
  design("sixSpineOrbWeaver", "六棘腹蛛", "动物", spinyOrbWeaver, ["Gasteracantha cancriformis", "横宽硬腹盾", "六棘"]),
  design("rufousNetCastingSpider", "棕网投蛛", "动物", netCastingSpider, ["Asianopis subrufa", "巨眼", "杆状腹体"]),
];
