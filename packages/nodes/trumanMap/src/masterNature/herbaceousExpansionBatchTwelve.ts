import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { combineMeshes, design, lobe, needle, part, petals, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { strip } from "./shapedFoods";
import { shellTube } from "./invertebrateExpansionBatchOne";
import { radialBlade } from "./herbaceousExpansionBatchOne";
import { archedGrassBlade } from "./herbaceousExpansionBatchThree";
import { thinLeaf } from "./herbaceousExpansionBatchSix";
import { axisPosition } from "./herbaceousExpansionBatchTen";

const green = "#85996f";
const pale = "#b1bc96";
const cream = "#d8d0b3";
const blue = "#a5adbe";
const pink = "#beaab8";
const ochre = "#bba485";

// 原创米制完整物种；花被、叶序和开口结构不同，不按花色及栽培品种扩主。
// https://plants.ces.ncsu.edu/plants/lilium-superbum/
// https://www.rhs.org.uk/plants/7383/fritillaria-imperialis/details
// https://www.rhs.org.uk/plants/114266/camassia-leichtlinii-baker-s-watson/details
// https://www.rhs.org.uk/plants/89862/allium-siculum/details
// https://pza.sanbi.org/chasmanthe-floribunda
// https://pza.sanbi.org/watsonia-borbonica
// https://pza.sanbi.org/dietes-grandiflora
// https://www.rhs.org.uk/plants/17398/sisyrinchium-striatum/details
// https://www.rhs.org.uk/plants/23945/phacelia-tanacetifolia/details

export function curvedTepal(name: string, color: string, root: Triple, heading: number, path: [number, number][], width: number, widths?: number[]): ModelPart {
  const value = strip(name, color, path.map(([r, y]): Triple => [0, y, r]), width, 0.0007);
  for (let row = 0; row < path.length; row++) for (let corner = 0; corner < 4; corner++) value.vertices![row * 4 + corner]!.x *= widths?.[row] ?? Math.max(0.03, Math.sin(row / (path.length - 1) * Math.PI));
  value.position = { x: root[0], y: root[1], z: root[2] }; value.rotation.y = 90 - heading; return value;
}

export function orientFlower(value: ModelPart, root: Triple, direction: Triple): ModelPart {
  const axis = new Vector3(...direction).normalize(), up = new Vector3(0, 1, 0).addScaledVector(axis, -axis.y);
  if (up.lengthSq() < 1e-8) up.set(0, 0, 1);
  up.normalize();
  const q = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3().crossVectors(axis, up), axis, up)), e = new Euler().setFromQuaternion(q);
  value.position = { x: root[0], y: root[1], z: root[2] }; value.rotation = { x: e.x * 180 / Math.PI, y: e.y * 180 / Math.PI, z: e.z * 180 / Math.PI }; return value;
}

function turksCapLily(): ModelPart[] {
  const parts: ModelPart[] = [tapered("美国卷丹有多轮狭叶的粗直单一花秆", pale, [[0, 0, 0], [0, 2.07, 0]], [0.012, 0.003])];
  for (let node = 0; node < 7; node++) {
    const leaves: ModelPart[] = [], y = 0.13 + node * 0.22;
    for (let leaf = 0; leaf < 7; leaf++) { const a = leaf * Math.PI * 2 / 7 + node * 0.3, span = 0.15 - node * 0.008; leaves.push(flatLeaf("美国卷丹同一节真正七枚轮生的狭椭圆叶", [0, y, 0], [Math.cos(a) * span, y + 0.027, Math.sin(a) * span], 0.026 - node * 0.0015, "oval", 0.0008)); }
    parts.push(combineMeshes("美国卷丹全部同高轮叶而非互生宽心叶的一轮", green, leaves));
  }
  for (let flower = 0; flower < 6; flower++) {
    const a = flower * 2.4, root: Triple = [Math.cos(a) * 0.23, 1.93 + flower % 3 * 0.062, Math.sin(a) * 0.23], petals: ModelPart[] = [], stamens: ModelPart[] = [], marks: ModelPart[] = [];
    parts.push(tapered("美国卷丹从顶簇展开后末端下垂的真实花梗", pale, [[0, 1.75 + flower % 3 * 0.08, 0], [root[0] * 0.88, root[1] + 0.04, root[2] * 0.88], root], [0.0035, 0.002, 0.001]));
    for (let petal = 0; petal < 6; petal++) {
      const heading = petal * 60, value = curvedTepal("美国卷丹六枚真正向后反卷成头巾轮廓的花被片", ochre, root, heading, [[0.001, 0], [0.013, -0.022], [0.029, -0.034], [0.045, -0.023], [0.05, -0.003], [0.041, 0.015], [0.026, 0.022]], 0.015);
      petals.push(value);
      const rotation = new Quaternion().setFromEuler(new Euler(0, value.rotation.y * Math.PI / 180, 0));
      for (const row of [2, 3]) { const left = value.vertices![row * 4 + 2]!, right = value.vertices![row * 4 + 3]!, p = new Vector3((left.x + right.x) / 2, (left.y + right.y) / 2, (left.z + right.z) / 2).applyQuaternion(rotation); marks.push(lobe("美国卷丹真实反卷花被表面相接的小紫斑", "#a18e94", [root[0] + p.x, root[1] + p.y, root[2] + p.z], [0.0015, 0.0014, 0.0015])); }
      const b = petal * Math.PI / 3, tip: Triple = [root[0] + Math.cos(b) * 0.015, root[1] - 0.056, root[2] + Math.sin(b) * 0.015]; stamens.push(needle("美国卷丹下垂花心六枚明显外伸的长雄蕊", cream, root, tip, 0.0009), lobe("美国卷丹长雄蕊末端独立的短长圆花药", "#b29c7d", tip, [0.003, 0.007, 0.003]));
    }
    parts.push(combineMeshes("美国卷丹保留曲率和六片间隙的完整反卷花被", ochre, petals), combineMeshes("美国卷丹花心下垂的完整雄蕊花药组", cream, stamens), combineMeshes("美国卷丹反卷花被真实表面上的分离斑纹", "#a18e94", marks));
  }
  return parts;
}

function crownImperial(): ModelPart[] {
  const parts: ModelPart[] = [tapered("皇冠贝母下部轮叶上部裸伸的粗直花秆", pale, [[0, 0, 0], [0, 1.075, 0]], [0.016, 0.004])];
  for (let node = 0; node < 5; node++) {
    const leaves: ModelPart[] = [], y = 0.05 + node * 0.11;
    for (let leaf = 0; leaf < 6; leaf++) { const a = leaf * Math.PI / 3 + node * 0.35; leaves.push(flatLeaf("皇冠贝母下部六枚同节轮生的宽披针叶", [0, y, 0], [Math.cos(a) * 0.16, y + 0.044, Math.sin(a) * 0.16], 0.028, "oval", 0.001)); }
    parts.push(combineMeshes("皇冠贝母只在下部连续出现的完整轮叶", green, leaves));
  }
  for (let flower = 0; flower < 7; flower++) {
    const a = flower * Math.PI * 2 / 7, top: Triple = [Math.cos(a) * 0.054, 1.04, Math.sin(a) * 0.054], root: Triple = [Math.cos(a) * 0.067, 1.015, Math.sin(a) * 0.067], stamens: ModelPart[] = [];
    parts.push(tapered("皇冠贝母顶叶冠下均匀伞出的弯垂花柄", pale, [[0, 1.02, 0], top, root], [0.0025, 0.0016, 0.001]), smallCorolla(root, [0, -1, 0], 0.052, 0.021, ochre, false, 6));
    for (let stamen = 0; stamen < 6; stamen++) { const b = stamen * Math.PI / 3, end: Triple = [root[0] + Math.cos(b) * 0.007, root[1] - 0.059, root[2] + Math.sin(b) * 0.007]; stamens.push(needle("皇冠贝母悬钟花里六枚真正下垂的细雄蕊", cream, root, end, 0.0008), lobe("皇冠贝母下垂雄蕊末端的分离花药", cream, end, [0.0025, 0.004, 0.0025])); }
    parts.push(combineMeshes("皇冠贝母大六裂悬钟中的完整下垂雄蕊组", cream, stamens));
  }
  const crown: ModelPart[] = [];
  for (let leaf = 0; leaf < 12; leaf++) crown.push(radialBlade("皇冠贝母明确高于所有垂钟的狭披针叶冠", green, [0, 1.075, 0], 0.013, 0.15 - leaf % 3 * 0.018, 33 + leaf % 3 * 15, leaf * 30));
  parts.push(combineMeshes("皇冠贝母顶部真实向上开展的绿色冠叶", green, crown));
  return parts;
}

function largeCamas(): ModelPart[] {
  const parts: ModelPart[] = [tapered("大卡马夏高出基叶丛的单一硬直花葶", pale, [[0, 0, 0], [0, 1.27, 0]], [0.007, 0.0015])], leaves: ModelPart[] = [], flowers: ModelPart[] = [], stamens: ModelPart[] = [], pedicels: ModelPart[] = [];
  for (let leaf = 0; leaf < 10; leaf++) leaves.push(archedGrassBlade("大卡马夏基生且有真实沟脊的松弧长带叶", [0, 0.004, 0], leaf * 137.5, 0.29 + leaf % 3 * 0.025, 0.021, 0.39 + leaf % 3 * 0.05));
  parts.push(...leaves);
  for (let flower = 0; flower < 19; flower++) {
    const a = flower * 2.4, y = 0.65 + flower * 0.032, radius = 0.044 - flower * 0.0012, root: Triple = [Math.cos(a) * radius, y + 0.014, Math.sin(a) * radius];
    pedicels.push(needle("大卡马夏沿长花葶螺旋互生的单花细梗", pale, [0, y, 0], root, 0.001)); flowers.push(petals(6, root, 0.006, 0.018, 82, blue));
    for (let stamen = 0; stamen < 6; stamen++) { const b = stamen * Math.PI / 3, tip: Triple = [root[0] + Math.cos(b) * 0.006, root[1] + 0.011, root[2] + Math.sin(b) * 0.006]; stamens.push(needle("大卡马夏六星花中央真正独立的六根雄蕊", cream, root, tip, 0.0006), lobe("大卡马夏长雄蕊顶端的小花药", cream, tip, [0.0015, 0.002, 0.0015])); }
  }
  parts.push(combineMeshes("大卡马夏上疏下长且都相连的单花梗", pale, pedicels));
  for (let i = 0; i < flowers.length; i += 7) parts.push(combineMeshes("大卡马夏长疏总状花序中完整六星花", blue, flowers.slice(i, i + 7)));
  for (let i = 0; i < stamens.length; i += 48) parts.push(combineMeshes("大卡马夏六星花中全部独立细雄蕊花药", cream, stamens.slice(i, i + 48)));
  return parts;
}

function sicilianHoneyGarlic(): ModelPart[] {
  const parts: ModelPart[] = [tapered("西西里蜜蒜没有茎叶的高直立花葶", pale, [[0, 0, 0], [0, 1.18, 0]], [0.006, 0.002])], leaves: ModelPart[] = [], pedicels: ModelPart[] = [];
  for (let leaf = 0; leaf < 7; leaf++) leaves.push(archedGrassBlade("西西里蜜蒜基生且带真实棱沟的狭长叶", [0, 0.004, 0], leaf * 137.5, 0.3 + leaf % 3 * 0.035, 0.017, 0.32));
  parts.push(...leaves);
  for (let flower = 0; flower < 14; flower++) {
    const a = flower * 2.4, reach = 0.115 + flower % 3 * 0.027, top: Triple = [Math.cos(a) * reach * 0.85, 1.205 + flower % 2 * 0.01, Math.sin(a) * reach * 0.85], root: Triple = [Math.cos(a) * reach, 1.178 - flower % 3 * 0.01, Math.sin(a) * reach];
    pedicels.push(tapered("西西里蜜蒜长短不等并在末端弯垂的真实伞辐", pale, [[0, 1.18, 0], top, root], [0.0015, 0.001, 0.0006]));
    parts.push(smallCorolla(root, [Math.cos(a) * 0.15, -1, Math.sin(a) * 0.15], 0.019, 0.007, "#c8b6b6", false, 6));
  }
  for (let i = 0; i < pedicels.length; i += 10) parts.push(combineMeshes("西西里蜜蒜真正分离且长短不等的垂钟伞辐", pale, pedicels.slice(i, i + 10)));
  return parts;
}

function cobraLilyFlower(root: Triple, heading: number): ModelPart[] {
  const body: ModelPart[] = [shellTube("多花麒尾从细基部弯到膨大上部的真实中空花管", [[0, 0, 0], [0, 0.011, 0.0015], [0, 0.026, 0.004], [0, 0.039, 0.004]], [0.0013, 0.0017, 0.0031, 0.0034], 0.0005, ochre)], stamens: ModelPart[] = [], anthers: ModelPart[] = [];
  body.push(curvedTepal("多花麒尾显著长于其余五片的匙形背花被片", ochre, [0, 0.039, 0.007], 90, [[0, 0], [0.012, 0.008], [0.025, 0.005]], 0.0075, [0.3, 1, 0.65]));
  for (const angle of [30, 150, 210, 270, 330]) { const a = angle * Math.PI / 180; body.push(radialBlade("多花麒尾围绕长上片但保持较短的五枚花被片", ochre, [Math.cos(a) * 0.0032, 0.0385, 0.004 + Math.sin(a) * 0.0032], 0.0034, angle === 270 ? 0.01 : 0.013, 74, angle)); }
  // ACT: 亚毫米花丝复用两段低面实体，保留原弧线弯点和端药位置，免做不可见圆周细分。
  for (const side of [-1, 0, 1]) { const start: Triple = [side * 0.0006, 0.003, 0.002], elbow: Triple = [side * 0.0012, 0.037, 0.007], tip: Triple = [side * 0.0013, 0.059 + (side ? 0 : 0.001), 0.012]; stamens.push(needle("多花麒尾长背片下三枚弧蕊的基部细段", cream, start, elbow, 0.0012), needle("多花麒尾弯点至端药的连续外伸细段", cream, elbow, tip, 0.001)); anthers.push(lobe("多花麒尾三枚长雄蕊端部的独立紫花药", blue, tip, [0.0012, 0.004, 0.0012])); }
  const a = heading * Math.PI / 180, direction: Triple = [Math.cos(a), 0.25, Math.sin(a)];
  return [orientFlower(combineMeshes("多花麒尾保留真实内腔及不等长六被的完整花", ochre, body), root, direction), orientFlower(combineMeshes("多花麒尾背花被片下完整弧伸的三雄蕊", cream, stamens), root, direction), orientFlower(combineMeshes("多花麒尾三枚独立末端紫花药", blue, anthers), root, direction)];
}

function chasmanthe(): ModelPart[] {
  const parts: ModelPart[] = [], fan: ModelPart[] = [], bodies: ModelPart[] = [], stamens: ModelPart[] = [], anthers: ModelPart[] = [], pedicels: ModelPart[] = [];
  for (let leaf = 0; leaf < 9; leaf++) fan.push(flatLeaf("多花麒尾两列套叠成扇且有真实中脉的剑叶", [0, 0.006, 0], [(leaf % 2 ? -1 : 1) * (0.08 + Math.floor(leaf / 2) * 0.032), 0.69 - Math.floor(leaf / 2) * 0.058, leaf % 2 * 0.008], 0.031, [[0, 0], [-0.5, 0.16], [-0.42, 0.79], [0, 1], [0.42, 0.79], [0.5, 0.16]], 0.001));
  parts.push(combineMeshes("多花麒尾完整两列剑叶扇", green, fan));
  const paths: Triple[][] = [[[0, 0, 0], [0, 1.13, 0]], [[0, 0.58, 0], [0.15, 0.99, 0.025]], [[0, 0.72, 0], [-0.12, 1.04, 0.03]]];
  paths.forEach((path, branch) => {
    parts.push(tapered("多花麒尾组成金字塔轮廓的直立分枝穗轴", pale, path, [branch ? 0.0025 : 0.006, 0.0007]));
    const count = branch ? 10 : 32;
    for (let flower = 0; flower < count; flower++) {
      const t = branch ? 0.3 + flower / (count - 1) * 0.66 : 0.52 + flower / (count - 1) * 0.45, base = axisPosition(path, t), heading = flower % 2 ? 180 : 0, a = heading * Math.PI / 180, root: Triple = [base[0] + Math.cos(a) * 0.005, base[1] + 0.002, base[2]];
      pedicels.push(needle("多花麒尾穗轴两侧交错排列花的短柄", pale, base, root, 0.0008));
      const flowerParts = cobraLilyFlower(root, heading); bodies.push(flowerParts[0]!); stamens.push(flowerParts[1]!); anthers.push(flowerParts[2]!);
    }
  });
  parts.push(combineMeshes("多花麒尾全部相连的两列短花梗", pale, pedicels));
  for (let i = 0; i < bodies.length; i += 4) parts.push(combineMeshes("多花麒尾保留单长背片和真内腔的两列橙花", ochre, bodies.slice(i, i + 4)));
  for (let i = 0; i < stamens.length; i += 5) parts.push(combineMeshes("多花麒尾所有花中真正弧伸的三雄蕊组", cream, stamens.slice(i, i + 5)));
  for (let i = 0; i < anthers.length; i += 12) parts.push(combineMeshes("多花麒尾弧伸三蕊末端分离紫花药组", blue, anthers.slice(i, i + 12)));
  return parts;
}

function watsoniaFlower(root: Triple, heading: number): ModelPart[] {
  const body: ModelPart[] = [sweptProfile("波旁沃森鸢尾真开口而由窄基扩成宽口的长花管", pink, [[0.0015, 0], [0.0032, 0.023], [0.008, 0.037], [0.0073, 0.037], [0.0025, 0.023], [0.0009, 0]], Math.PI * 2, 16)], stamens: ModelPart[] = [];
  for (const angle of [30, 90, 150, 210, 270, 330]) { const a = angle * Math.PI / 180, upper = angle < 180; body.push(radialBlade("波旁沃森鸢尾上三片较宽下三片较窄的两侧对称花被", pink, [Math.cos(a) * 0.0076, 0.0358, Math.sin(a) * 0.0076], upper ? 0.01 : 0.007, upper ? 0.016 : 0.012, upper ? 65 : 78, angle)); }
  for (const side of [-1, 0, 1]) { const elbow: Triple = [side * 0.0015, 0.036, 0.003], tip: Triple = [side * 0.002, 0.05, 0.006]; stamens.push(needle("波旁沃森鸢尾上花被下三雄蕊的细长基段", cream, [side * 0.001, 0.004, 0], elbow, 0.0009), needle("波旁沃森鸢尾沿真实弯点伸出的花蕊端段", cream, elbow, tip, 0.0008), lobe("波旁沃森鸢尾三枚短花药", cream, tip, [0.0015, 0.004, 0.0015])); }
  const a = heading * Math.PI / 180, direction: Triple = [Math.cos(a), 0.32, Math.sin(a)];
  return [orientFlower(combineMeshes("波旁沃森鸢尾长漏斗及不等六片的完整粉花", pink, body), root, direction), orientFlower(combineMeshes("波旁沃森鸢尾弧伸三雄蕊与端药", cream, stamens), root, direction)];
}

function pinkWatsonia(): ModelPart[] {
  const parts: ModelPart[] = [], leaves: ModelPart[] = [], flowers: ModelPart[] = [], stamens: ModelPart[] = [], pedicels: ModelPart[] = [], bracts: ModelPart[] = [];
  for (let leaf = 0; leaf < 7; leaf++) { const side = leaf % 2 ? -1 : 1; leaves.push(flatLeaf("波旁沃森鸢尾同一球茎上两列成扇的宽长剑叶", [0, 0.006, 0], [side * (0.1 + Math.floor(leaf / 2) * 0.06), 1.13 - Math.floor(leaf / 2) * 0.09, leaf % 2 * 0.01], 0.035, [[0, 0], [-0.5, 0.12], [-0.45, 0.84], [0, 1], [0.45, 0.84], [0.5, 0.12]], 0.0012)); }
  parts.push(combineMeshes("波旁沃森鸢尾完整高剑叶扇", green, leaves));
  const paths: Triple[][] = [[[0, 0, 0], [0, 1.89, 0]], [[0, 0.87, 0], [0.18, 1.61, 0.02]], [[0, 1.08, 0], [-0.16, 1.75, 0.025]]];
  paths.forEach((path, branch) => {
    parts.push(tapered("波旁沃森鸢尾主穗及侧穗的独立高花轴", pale, path, [branch ? 0.003 : 0.008, 0.0008]));
    const count = branch ? 8 : 20;
    for (let flower = 0; flower < count; flower++) {
      const t = branch ? 0.28 + flower / (count - 1) * 0.67 : 0.54 + flower / (count - 1) * 0.43, base = axisPosition(path, t), heading = flower % 2 ? 185 : 5, a = heading * Math.PI / 180, root: Triple = [base[0] + Math.cos(a) * 0.007, base[1] + 0.003, base[2] + Math.sin(a) * 0.007], pieces = watsoniaFlower(root, heading);
      flowers.push(pieces[0]!); stamens.push(pieces[1]!); pedicels.push(needle("波旁沃森鸢尾长穗上两侧交替单花的短柄", pale, base, root, 0.001)); bracts.push(radialBlade("波旁沃森鸢尾长花管背后真正相连的狭苞叶", green, [base[0], base[1] - 0.006, base[2]], 0.0055, 0.025, 20, heading + 180));
    }
  });
  parts.push(combineMeshes("波旁沃森鸢尾各花与穗轴实际相连的短柄", pale, pedicels), combineMeshes("波旁沃森鸢尾长穗全部细苞片", green, bracts));
  for (let i = 0; i < flowers.length; i += 3) parts.push(combineMeshes("波旁沃森鸢尾真实长漏斗双侧对称六被花组", pink, flowers.slice(i, i + 3)));
  for (let i = 0; i < stamens.length; i += 6) parts.push(combineMeshes("波旁沃森鸢尾各花上部的三细蕊组", cream, stamens.slice(i, i + 6)));
  return parts;
}

function largeWildIris(): ModelPart[] {
  const parts: ModelPart[] = [tapered("大花野鸢尾沿地表缓慢扩展的短粗根茎", pale, [[-0.09, 0.01, 0], [0.09, 0.01, 0]], [0.013, 0.01])], leaves: ModelPart[] = [];
  for (let fan = 0; fan < 3; fan++) for (let leaf = 0; leaf < 7; leaf++) { const x = (fan - 1) * 0.09, side = leaf % 2 ? -1 : 1; leaves.push(flatLeaf("大花野鸢尾从同一根茎连续抽出的两列细剑叶扇", [x, 0.012, 0], [x + side * (0.06 + Math.floor(leaf / 2) * 0.046), 0.91 - Math.floor(leaf / 2) * 0.082, fan * 0.012], 0.019, [[0, 0], [-0.5, 0.18], [-0.43, 0.81], [0, 1], [0.43, 0.81], [0.5, 0.18]], 0.001)); }
  parts.push(combineMeshes("大花野鸢尾全部根生狭剑叶扇", green, leaves));
  for (let stem = 0; stem < 3; stem++) {
    const x = (stem - 1) * 0.07, top: Triple = [x, 1.01 + stem * 0.035, 0.025];
    parts.push(tapered("大花野鸢尾高出叶扇并可接连开花的细长花茎", pale, [[x, 0.012, 0], top], [0.004, 0.0012]));
    for (const side of [-1, 1]) {
      const root: Triple = [x + side * 0.055, top[1] + 0.012, 0.025], outer: ModelPart[] = [], styles: ModelPart[] = [], guides: ModelPart[] = [];
      parts.push(needle("大花野鸢尾分枝末端单花的短花梗", pale, top, root, 0.0013));
      for (let petal = 0; petal < 3; petal++) {
        const heading = petal * 120 + stem * 20, a = heading * Math.PI / 180;
        outer.push(curvedTepal("大花野鸢尾三片大而近水平的白色外花被片", cream, root, heading, [[0, 0], [0.012, 0.003], [0.035, 0.001], [0.048, -0.008]], 0.031, [0.2, 0.7, 1, 0.73]), radialBlade("大花野鸢尾轮间三片较小上举的白内花被片", cream, root, 0.012, 0.026, 48, heading + 60));
        const guide: Triple = [root[0] + Math.cos(a) * 0.016, root[1] + 0.0033, root[2] + Math.sin(a) * 0.016]; guides.push(lobe("大花野鸢尾白外片真实表面相接的黄色蜜标", ochre, guide, [0.005, 0.001, 0.011], [0, 90 - heading, 0]));
        const end: Triple = [root[0] + Math.cos(a) * 0.021, root[1] + 0.021, root[2] + Math.sin(a) * 0.021]; styles.push(needle("大花野鸢尾三枚紫色瓣化花柱分枝的共同细基部", pink, root, end, 0.0018));
        for (const fork of [-1, 1]) styles.push(radialBlade("大花野鸢尾每枚瓣化花柱末端真正分开的两枚紫瓣", pink, end, 0.008, 0.012, 58, heading + fork * 26));
      }
      parts.push(combineMeshes("大花野鸢尾大外三片小内三片组成的完整白花", cream, outer), combineMeshes("大花野鸢尾三分叉紫色瓣化花柱", pink, styles), combineMeshes("大花野鸢尾外三片上独立的黄蜜标", ochre, guides));
    }
  }
  return parts;
}

function paleYellowEyedGrass(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let shoot = 0; shoot < 3; shoot++) {
    const x = (shoot - 1) * 0.045, height = 0.74 + shoot * 0.023, leaves: ModelPart[] = [];
    for (let leaf = 0; leaf < 7; leaf++) { const side = leaf % 2 ? -1 : 1; leaves.push(flatLeaf("条纹庭菖蒲从短根茎成扇抽出的灰绿狭剑叶", [x, 0.004, 0], [x + side * (0.035 + Math.floor(leaf / 2) * 0.032), 0.42 - Math.floor(leaf / 2) * 0.04, 0.005], 0.017, [[0, 0], [-0.5, 0.15], [-0.43, 0.8], [0, 1], [0.43, 0.8], [0.5, 0.15]], 0.0008)); }
    parts.push(combineMeshes("条纹庭菖蒲完整两列狭剑叶扇", "#91a28a", leaves), part("条纹庭菖蒲带狭翼的真实扁花茎", "box", pale, [x, height / 2, 0], [0.009, height, 0.003]));
    for (let node = 0; node < 5; node++) {
      const y = 0.3 + node * 0.103, flowers: ModelPart[] = [], organs: ModelPart[] = [], pedicels: ModelPart[] = [];
      for (let flower = 0; flower < 3; flower++) { const a = flower * Math.PI * 2 / 3 + node, root: Triple = [x + Math.cos(a) * 0.011, y + 0.006, Math.sin(a) * 0.011]; pedicels.push(needle("条纹庭菖蒲高茎各层小花簇的独立短柄", pale, [x, y, 0], root, 0.0007)); flowers.push(petals(6, root, 0.0034, 0.008, 83, cream)); organs.push(needle("条纹庭菖蒲小六被花中央短合生雄蕊柱", ochre, root, [root[0], root[1] + 0.0045, root[2]], 0.0014)); for (let anther = 0; anther < 3; anther++) { const b = anther * Math.PI * 2 / 3; organs.push(lobe("条纹庭菖蒲合蕊柱顶端独立的三枚短花药", ochre, [root[0] + Math.cos(b) * 0.0012, root[1] + 0.0045, root[2] + Math.sin(b) * 0.0012], [0.0013, 0.0016, 0.0013])); } }
      parts.push(combineMeshes("条纹庭菖蒲高穗多层簇生的完整六被小星花", cream, flowers), combineMeshes("条纹庭菖蒲各小花中央的短三蕊黄眼", ochre, organs), combineMeshes("条纹庭菖蒲各层星花实际相连的短梗", pale, pedicels));
    }
  }
  return parts;
}

function italianBugloss(): ModelPart[] {
  const parts: ModelPart[] = [tapered("意大利牛舌草由大基叶丛抽出的高草秆", pale, [[0, 0, 0], [0, 1.4, 0]], [0.01, 0.0018])], flowers: ModelPart[] = [], scales: ModelPart[] = [], pedicels: ModelPart[] = [];
  for (let leaf = 0; leaf < 6; leaf++) { const a = leaf * 2.4; parts.push(flatLeaf("意大利牛舌草基生的长椭圆至披针形大叶", [0, 0.004, 0], [Math.cos(a) * 0.26, 0.085, Math.sin(a) * 0.26], 0.047, "oval", 0.0009)); }
  for (let leaf = 0; leaf < 9; leaf++) { const a = leaf * 2.4, y = 0.1 + leaf * 0.116, span = 0.18 - leaf * 0.009; parts.push(flatLeaf("意大利牛舌草沿高茎互生且近无柄的狭叶", [0, y, 0], [Math.cos(a) * span, y + 0.026, Math.sin(a) * span], 0.033 - leaf * 0.0015, "oval", 0.0008)); }
  for (let branch = 0; branch < 4; branch++) {
    const a = branch * 2.4, path: Triple[] = [[0, 0.87 + branch % 2 * 0.14, 0], [Math.cos(a) * 0.19, 1.26 + branch * 0.041, Math.sin(a) * 0.19], [Math.cos(a) * 0.24, 1.29 + branch * 0.041, Math.sin(a) * 0.24], [Math.cos(a) * 0.26, 1.255 + branch * 0.041, Math.sin(a) * 0.26]];
    parts.push(tapered("意大利牛舌草顶端分枝后略弯的短花序轴", pale, path, [0.003, 0.0016, 0.0008, 0.0005]));
    for (let flower = 0; flower < 9; flower++) {
      const base = axisPosition(path, 0.4 + flower * 0.071), b = a + (flower % 2 ? 1.1 : -1.1), root: Triple = [base[0] + Math.cos(b) * 0.012, base[1] + 0.006, base[2] + Math.sin(b) * 0.012], direction: Triple = [Math.cos(b), 0.7, Math.sin(b)], body = smallCorolla([0, 0, 0], [0, 1, 0], 0.006, 0.0035, blue, false, 5, 8), appendages: ModelPart[] = [];
      pedicels.push(needle("意大利牛舌草每朵五瓣蓝花的真实短花梗", pale, base, root, 0.0008)); flowers.push(orientFlower(body, root, direction));
      for (let scale = 0; scale < 5; scale++) { const c = scale * Math.PI * 0.4; appendages.push(lobe("意大利牛舌草花喉中真实突出的五枚浅色附属体", cream, [Math.cos(c) * 0.0027, 0.006, Math.sin(c) * 0.0027], [0.0018, 0.0017, 0.0018])); }
      scales.push(orientFlower(combineMeshes("意大利牛舌草短蓝花管内的完整五喉鳞", cream, appendages), root, direction));
    }
  }
  parts.push(combineMeshes("意大利牛舌草全部单花与分枝轴相连的短柄", pale, pedicels));
  for (let i = 0; i < flowers.length; i += 4) parts.push(combineMeshes("意大利牛舌草短合管和五裂蓝瓣的完整小花", blue, flowers.slice(i, i + 4)));
  for (let i = 0; i < scales.length; i += 8) parts.push(combineMeshes("意大利牛舌草各蓝花花喉中真实凸出的五鳞", cream, scales.slice(i, i + 8)));
  return parts;
}

function lacyPhacelia(): ModelPart[] {
  const parts: ModelPart[] = [tapered("菊叶蜜蜂花自基部至顶簇的细直草茎", pale, [[0, 0, 0], [0, 0.94, 0]], [0.007, 0.0012])], flowers: ModelPart[] = [], stamens: ModelPart[] = [], pedicels: ModelPart[] = [];
  for (let leaf = 0; leaf < 7; leaf++) {
    const a = leaf * 2.4, y = 0.06 + leaf * 0.08, end: Triple = [Math.cos(a) * 0.15, y + 0.035, Math.sin(a) * 0.15], pieces: ModelPart[] = [needle("菊叶蜜蜂花深分叶中真正分立的主叶轴", pale, [0, y, 0], end, 0.0018)];
    for (let node = 0; node < 3; node++) for (const side of [-1, 1]) { const t = 0.2 + node * 0.27, root: Triple = [end[0] * t, y + 0.035 * t, end[2] * t], b = a + side * 1.12; pieces.push(thinLeaf(flatLeaf("菊叶蜜蜂花羽状侧叶又深裂的真实小羽片", root, [root[0] + Math.cos(b) * 0.053, root[1] + 0.009, root[2] + Math.sin(b) * 0.053], 0.022, "lobed", 0.0006))); }
    pieces.push(thinLeaf(flatLeaf("菊叶蜜蜂花深分复叶主轴顶端的最后小羽", end, [end[0] + Math.cos(a) * 0.041, end[1] + 0.009, end[2] + Math.sin(a) * 0.041], 0.018, "lobed", 0.0006)));
    parts.push(combineMeshes("菊叶蜜蜂花全部连轴而非叶片花色变体的深分叶", green, pieces));
  }
  for (let branch = 0; branch < 4; branch++) {
    const a = branch * 2.4, centre: Triple = [Math.cos(a) * 0.08, 0.955 + branch * 0.023, Math.sin(a) * 0.08], path: Triple[] = [[0, 0.67 + branch * 0.055, 0]];
    for (let point = 0; point < 11; point++) { const t = point / 10, angle = -Math.PI / 2 + t * Math.PI * 1.5, radius = 0.043 * (1 - t * 0.48); path.push([centre[0] + Math.cos(a) * Math.cos(angle) * radius, centre[1] + Math.sin(angle) * radius, centre[2] + Math.sin(a) * Math.cos(angle) * radius]); }
    parts.push(tapered("菊叶蜜蜂花连续卷成蝎尾而非直穗的完整花序轴", pale, path, path.map((_, index) => 0.0026 - index / (path.length - 1) * 0.002)));
    for (let flower = 0; flower < 9; flower++) {
      const base = path[flower + 1]!, t = flower / 10, angle = -Math.PI / 2 + t * Math.PI * 1.5, direction: Triple = [Math.cos(a) * Math.cos(angle), Math.sin(angle), Math.sin(a) * Math.cos(angle)], root: Triple = base.map((v, axis) => v + direction[axis]! * 0.0035) as Triple, organs: ModelPart[] = [];
      pedicels.push(needle("菊叶蜜蜂花从卷轴实际伸出的短单花梗", pale, base, root, 0.0007)); flowers.push(orientFlower(smallCorolla([0, 0, 0], [0, 1, 0], 0.0045, 0.0032, blue, false, 5, 8), root, direction));
      for (let stamen = 0; stamen < 5; stamen++) { const b = stamen * Math.PI * 0.4, end: Triple = [Math.cos(b) * 0.0032, 0.016, Math.sin(b) * 0.0032]; organs.push(needle("菊叶蜜蜂花明显长于五瓣花冠的五枚长雄蕊", cream, [Math.cos(b) * 0.0012, 0.0005, Math.sin(b) * 0.0012], end, 0.0005), lobe("菊叶蜜蜂花外伸长蕊末端独立的小花药", cream, end, [0.0013, 0.0016, 0.0013])); }
      stamens.push(orientFlower(combineMeshes("菊叶蜜蜂花外露五根长细雄蕊和端药", cream, organs), root, direction));
    }
    const bud = path.at(-1)!; parts.push(lobe("菊叶蜜蜂花卷序最内端尚未开放的短花蕾", pale, bud, [0.005, 0.006, 0.005]));
  }
  parts.push(combineMeshes("菊叶蜜蜂花卷轴上全部实际相连的小花梗", pale, pedicels));
  for (let i = 0; i < flowers.length; i += 4) parts.push(combineMeshes("菊叶蜜蜂花朝卷轴外侧开放的五裂小蓝花", blue, flowers.slice(i, i + 4)));
  for (let i = 0; i < stamens.length; i += 5) parts.push(combineMeshes("菊叶蜜蜂花随卷序方向伸展的完整长蕊组", cream, stamens.slice(i, i + 5)));
  return parts;
}

export const herbaceousExpansionBatchTwelveDesigns: MasterNatureDesign[] = [
  design("turksCapLilyPlant", "美国卷丹", "植物", turksCapLily, ["Lilium superbum", "真正轮生狭叶与六被强反卷斑花及长垂雄蕊"]),
  design("crownImperialPlant", "皇冠贝母", "植物", crownImperial, ["Fritillaria imperialis", "下部轮叶顶冠叶及冠下一整圈六裂垂钟"]),
  design("largeCamasPlant", "大卡马夏", "植物", largeCamas, ["Camassia leichtlinii", "真实沟状基叶与高长疏穗六离片星花"]),
  design("sicilianHoneyGarlicPlant", "西西里蜜蒜", "植物", sicilianHoneyGarlic, ["Allium siculum", "Nectaroscordum siculum", "棱沟基叶和不等长伞辐末端的六裂垂钟"]),
  design("chasmantheFloribundaPlant", "多花麒尾", "植物", chasmanthe, ["Chasmanthe floribunda", "真实原尺寸剑扇叶金字塔两列穗与单长匙背片弧筒花"]),
  design("pinkWatsoniaPlant", "波旁沃森鸢尾", "植物", pinkWatsonia, ["Watsonia borbonica", "高剑叶扇分枝花穗及上三宽下三窄的长漏斗六被花"]),
  design("largeWildIrisPlant", "大花野鸢尾", "植物", largeWildIris, ["Dietes grandiflora", "根茎剑扇叶三大外片三小内片和三分叉紫色瓣化花柱"]),
  design("paleYellowEyedGrassPlant", "条纹庭菖蒲", "植物", paleYellowEyedGrass, ["Sisyrinchium striatum", "真实原尺寸两列狭剑叶扁花茎多层六被小花簇与短三蕊黄眼"]),
  design("italianBuglossPlant", "意大利牛舌草", "植物", italianBugloss, ["Anchusa azurea", "Anchusa italica", "长披针基叶高分枝序及短五瓣蓝花内真实五喉鳞"]),
  design("lacyPhaceliaPlant", "菊叶蜜蜂花", "植物", lacyPhacelia, ["Phacelia tanacetifolia", "深分羽叶真蝎尾卷序及明显外伸的五根长雄蕊"]),
];
