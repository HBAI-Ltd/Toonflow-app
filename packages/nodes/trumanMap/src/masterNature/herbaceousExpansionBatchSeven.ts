import { cap, combineMeshes, design, lobe, needle, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { radialBlade } from "./herbaceousExpansionBatchOne";

const green = "#859970";
const pale = "#b1bc96";
const cream = "#d8d1b6";
const pink = "#baa6b6";
const toothed: [number, number][] = [[0, 0], [-0.26, 0.08], [-0.48, 0.27], [-0.36, 0.32], [-0.5, 0.46], [-0.35, 0.52], [-0.37, 0.69], [-0.2, 0.72], [0, 1], [0.2, 0.72], [0.37, 0.69], [0.35, 0.52], [0.5, 0.46], [0.36, 0.32], [0.48, 0.27], [0.26, 0.08]];

// 原创林缘/草甸整株。参考形态信息，不包含照片、下载网格或天气/生长状态变体。
// https://plants.ces.ncsu.edu/plants/verbascum-thapsus/
// https://www.rhs.org.uk/plants/32871/filipendula-ulmaria/details
// https://www.rhs.org.uk/weeds/himalayan-balsam

function nettle(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let stalk = 0; stalk < 2; stalk++) {
    const x = (stalk - 0.5) * 0.1, height = 1.38 + stalk * 0.18;
    parts.push(part("异株荨麻有实际四棱截面的直立茎", "box", pale, [x, height / 2, 0], [0.009, height, 0.009]));
    for (let node = 0; node < 7; node++) {
      const y = 0.13 + node * 0.175, a = node % 2 * Math.PI / 2, leaves: ModelPart[] = [];
      for (const side of [-1, 1]) {
        const b = a + (side < 0 ? Math.PI : 0), root: Triple = [x + Math.cos(b) * 0.018, y + 0.008, Math.sin(b) * 0.018], span = 0.135 - node * 0.009;
        leaves.push(needle("异株荨麻对生叶的细叶柄", pale, [x, y, 0], root, 0.0014), flatLeaf("异株荨麻心基且粗锯齿的交互对生叶", root, [root[0] + Math.cos(b) * span, root[1] + 0.02, root[2] + Math.sin(b) * span], span * 0.58, toothed, 0.0007));
      }
      parts.push(combineMeshes("异株荨麻单节上真实相对的一对齿叶", green, leaves));
      if (node < 3) continue;
      const flowers: ModelPart[] = [];
      for (const side of [-1, 1]) {
        const end: Triple = [x + side * 0.075, y - 0.065, 0.018];
        flowers.push(tapered("异株荨麻叶腋抽出的细长下垂花序", pale, [[x, y, 0], [x + side * 0.04, y - 0.015, 0.01], end], [0.0011, 0.0007, 0.0004]));
        for (let i = 0; i < 8; i++) { const t = (i + 1) / 9; flowers.push(lobe("异株荨麻下垂细轴上的无瓣绿小花簇", pale, [x + (end[0] - x) * t, y - 0.065 * t, end[2] * t], [0.004, 0.005, 0.004])); }
      }
      parts.push(combineMeshes("异株荨麻与顶生花穗不同的叶腋细花串", pale, flowers));
    }
    const hairs: ModelPart[] = [];
    for (let i = 0; i < 28; i++) { const side = i % 2 ? -1 : 1, y = 0.08 + i * 0.043; hairs.push(needle("荨麻从真实方秆侧面长出的短刺毛", cream, [x + side * 0.0045, y, 0], [x + side * 0.008, y + 0.0025, 0], 0.00045)); }
    parts.push(combineMeshes("异株荨麻茎侧离散的短刺毛", cream, hairs));
  }
  return parts;
}

function mullein(): ModelPart[] {
  const parts: ModelPart[] = [tapered("毛蕊花从粗叶莲座抽出的单一直立花秆", pale, [[0, 0, 0], [0, 1.83, 0]], [0.015, 0.004])];
  for (let i = 0; i < 8; i++) {
    const a = i * 2.4, blade = flatLeaf("毛蕊花宽而绒厚的基生倒披针叶", [0, 0.012, 0], [Math.cos(a) * 0.3, 0.07 + i % 3 * 0.025, Math.sin(a) * 0.3], 0.11, "obovate", 0.0022); blade.color = "#a8b193"; parts.push(blade);
  }
  for (let i = 0; i < 7; i++) { const y = 0.19 + i * 0.135, a = i * 2.4, blade = flatLeaf("毛蕊花沿花秆互生并逐渐变小的绒叶", [0, y, 0], [Math.cos(a) * (0.22 - i * 0.019), y + 0.025, Math.sin(a) * (0.22 - i * 0.019)], 0.085 - i * 0.007, "oval", 0.0015); blade.color = "#a8b193"; parts.push(blade); }
  const flowers: ModelPart[] = [];
  for (let i = 0; i < 30; i++) {
    const a = i * 2.4, y = 1.12 + i / 29 * 0.66, root: Triple = [Math.cos(a) * 0.009, y, Math.sin(a) * 0.009];
    flowers.push(needle("毛蕊花密花穗上单花与主轴的短连接", pale, [0, y, 0], root, 0.001), smallCorolla(root, [Math.cos(a), 0.15, Math.sin(a)], 0.007, 0.006, "#cbbf89", false, 5, 8));
  }
  for (let i = 0; i < flowers.length; i += 6) parts.push(combineMeshes("毛蕊花无分枝长轴上轮廓清楚的五裂黄花", "#cbbf89", flowers.slice(i, i + 6)));
  return parts;
}

function pokeweed(): ModelPart[] {
  const parts: ModelPart[] = [tapered("美洲商陆粗壮而肉质的直立主茎", "#a99f88", [[0, 0, 0], [0.01, 1.81, 0]], [0.027, 0.007])];
  for (let branch = 0; branch < 3; branch++) {
    const a = branch * 2.4, root: Triple = [0.004, 0.54 + branch * 0.23, 0], end: Triple = [Math.cos(a) * 0.37, 1.55 + branch * 0.11, Math.sin(a) * 0.37];
    parts.push(tapered("美洲商陆粗而斜展的肉质侧分茎", "#a99f88", [root, end], [0.014, 0.003]));
    for (let node = 0; node < 5; node++) {
      const t = 0.14 + node * 0.17, p: Triple = root.map((v, axis) => v + (end[axis]! - v) * t) as Triple, b = a + node * 2.4;
      parts.push(flatLeaf("美洲商陆全缘长卵形且沿侧茎互生的大叶", p, [p[0] + Math.cos(b) * 0.24, p[1] + 0.035, p[2] + Math.sin(b) * 0.24], 0.11, "oval", 0.0011));
    }
    const start: Triple = root.map((v, axis) => v + (end[axis]! - v) * 0.78) as Triple, tail: Triple = [start[0] + Math.cos(a) * 0.07, start[1] - 0.27, start[2] + Math.sin(a) * 0.07], fruits: ModelPart[] = [tapered("美洲商陆由分茎上垂下的细总状果轴", "#aa8f88", [start, tail], [0.0022, 0.0007])];
    for (let berry = 0; berry < 16; berry++) {
      const t = (berry + 1) / 17, b = berry * 2.4, axis: Triple = start.map((v, coordinate) => v + (tail[coordinate]! - v) * t) as Triple, p: Triple = [axis[0] + Math.cos(b) * 0.009, axis[1], axis[2] + Math.sin(b) * 0.009];
      fruits.push(needle("美洲商陆每枚浆果独立的细果柄", "#aa8f88", axis, p, 0.0007), lobe("美洲商陆略扁且深色的成熟浆果", "#8b8690", p, [0.014, 0.011, 0.014]));
    }
    parts.push(combineMeshes("美洲商陆末端下垂的独立深色浆果串", "#8b8690", fruits));
  }
  return parts;
}

function himalayanBalsam(): ModelPart[] {
  const parts: ModelPart[] = [tapered("腺凤仙膨节而肉质的高直立茎", pale, [[0, 0, 0], [0, 2.08, 0]], [0.018, 0.004])];
  for (let node = 0; node < 7; node++) {
    const y = 0.18 + node * 0.245, leaves: ModelPart[] = [];
    parts.push(lobe("腺凤仙肉质主茎明显膨大的节", pale, [0, y, 0], [0.038 - node * 0.002, 0.025, 0.038 - node * 0.002]));
    for (let blade = 0; blade < 3; blade++) { const a = blade * Math.PI * 2 / 3 + node * 0.4, root: Triple = [Math.cos(a) * 0.025, y + 0.012, Math.sin(a) * 0.025], span = 0.17 - node * 0.01; leaves.push(needle("腺凤仙三轮生叶各自的短叶柄", pale, [0, y, 0], root, 0.0018), flatLeaf("腺凤仙近轮生且具粗尖齿的长披针叶", root, [root[0] + Math.cos(a) * span, root[1] + 0.02, root[2] + Math.sin(a) * span], span * 0.35, toothed, 0.0009)); }
    parts.push(combineMeshes("腺凤仙与普通五叶基生凤仙不同的三叶茎节", green, leaves));
  }
  for (let flower = 0; flower < 8; flower++) {
    const a = flower * 2.4, y = 1.22 + flower * 0.09, root: Triple = [Math.cos(a) * 0.11, y - 0.03, Math.sin(a) * 0.11];
    parts.push(tapered("腺凤仙叶腋上弯后垂下的细花柄", pale, [[0, y, 0], [root[0] * 0.7, y + 0.04, root[2] * 0.7], root], [0.002, 0.0014, 0.0007]));
    const pouch = cap("腺凤仙形成真实空腔而非实心球的下萼囊", pink, [0, 0, 0], 0.018, 0.036, 3);
    pouch.position = { x: root[0], y: root[1], z: root[2] }; pouch.rotation = { x: 90, y: 0, z: 0 };
    parts.push(pouch, radialBlade("腺凤仙囊口上方独立的宽圆旗瓣", pink, root, 0.033, 0.036, 50, 90), tapered("腺凤仙囊萼后部真正弯曲的短花距", pink, [[root[0], root[1], root[2] + 0.00216], [root[0] + 0.008, root[1] - 0.018, root[2] - 0.032], [root[0] + 0.014, root[1] - 0.012, root[2] - 0.039]], [0.006, 0.003, 0.001]));
    const lips = [-1, 1].map(side => radialBlade("腺凤仙囊口外展开的成对宽翼唇瓣", pink, root, 0.02, 0.033, 116, 90 + side * 50));
    parts.push(combineMeshes("腺凤仙真实分开的两侧宽翼唇瓣", pink, lips));
  }
  return parts;
}

function tallVerbena(): ModelPart[] {
  const parts: ModelPart[] = [part("柳叶马鞭草长而细的四棱中心秆", "box", pale, [0, 0.79, 0], [0.009, 1.58, 0.009])];
  for (let node = 0; node < 5; node++) {
    const y = 0.13 + node * 0.17, a = node % 2 * Math.PI / 2;
    for (const side of [-1, 1]) parts.push(flatLeaf("柳叶马鞭草下部成对而不形成宽叶莲座的狭柳叶", [0, y, 0], [Math.cos(a) * side * 0.12, y + 0.015, Math.sin(a) * side * 0.12], 0.018, "oval", 0.0006));
  }
  for (let branch = 0; branch < 6; branch++) {
    const a = branch * 2.4, hub: Triple = [Math.cos(a) * 0.26, 1.59 + branch % 3 * 0.035, Math.sin(a) * 0.26];
    parts.push(tapered("柳叶马鞭草高处向外疏分叉的几乎无叶长轴", pale, [[0, 1.02 + branch % 3 * 0.11, 0], hub], [0.003, 0.0012]));
    const flowers: ModelPart[] = [];
    for (let flower = 0; flower < 12; flower++) {
      const b = flower * 2.4, radius = Math.sqrt(flower / 12) * 0.018, p: Triple = [hub[0] + Math.cos(b) * radius, hub[1] + (1 - radius / 0.025) * 0.005, hub[2] + Math.sin(b) * radius];
      flowers.push(needle("柳叶马鞭草扁球形聚伞花头中的极短花柄", pale, hub, p, 0.001), smallCorolla(p, [0, 1, 0], 0.005, 0.002, "#aba0b7", false, 5, 8));
    }
    for (let i = 0; i < flowers.length; i += 6) parts.push(combineMeshes("柳叶马鞭草长裸轴顶端扁平而非长穗的紫花小伞", "#aba0b7", flowers.slice(i, i + 6)));
  }
  return parts;
}

function meadowsweet(): ModelPart[] {
  const parts: ModelPart[] = [tapered("榆叶蚊子草的直立高草茎", pale, [[0, 0, 0], [0, 1.63, 0]], [0.009, 0.002])];
  for (let node = 0; node < 6; node++) {
    const a = node * 2.4, y = 0.12 + node * 0.19, end: Triple = [Math.cos(a) * 0.23, y + 0.04, Math.sin(a) * 0.23], pieces: ModelPart[] = [needle("蚊子草不等羽状复叶的共同叶柄", pale, [0, y, 0], end, 0.002)];
    for (let leaf = 0; leaf < 3; leaf++) for (const side of [-1, 1]) {
      const t = 0.19 + leaf * 0.23, root: Triple = [end[0] * t, y + 0.04 * t, end[2] * t], b = a + side * 1.13;
      pieces.push(flatLeaf("蚊子草沿叶轴成对的粗齿侧小叶", root, [root[0] + Math.cos(b) * 0.065, root[1] + 0.013, root[2] + Math.sin(b) * 0.065], 0.041, toothed, 0.0007));
      const p: Triple = [end[0] * (t + 0.08), y + 0.04 * (t + 0.08), end[2] * (t + 0.08)];
      pieces.push(flatLeaf("蚊子草大侧小叶之间真实较小的间生小叶", p, [p[0] + Math.cos(b) * 0.018, p[1] + 0.004, p[2] + Math.sin(b) * 0.018], 0.01, "oval", 0.0005));
    }
    pieces.push(flatLeaf("蚊子草远大于侧叶而三裂的终端小叶", end, [end[0] + Math.cos(a) * 0.085, end[1] + 0.012, end[2] + Math.sin(a) * 0.085], 0.08, "palm", 0.0008));
    parts.push(combineMeshes("榆叶蚊子草有大终端裂叶及间生小叶的复叶", green, pieces));
  }
  for (let branch = 0; branch < 8; branch++) {
    const a = branch * 2.4, hub: Triple = [Math.cos(a) * 0.2, 1.51 + branch % 3 * 0.07, Math.sin(a) * 0.2], pieces: ModelPart[] = [needle("蚊子草奶白花云的真实分枝", pale, [0, 1.2 + branch % 3 * 0.1, 0], hub, 0.0025)];
    for (let flower = 0; flower < 7; flower++) {
      const b = flower * 2.4, p: Triple = [hub[0] + Math.cos(b) * 0.025, hub[1] + flower % 2 * 0.009, hub[2] + Math.sin(b) * 0.025];
      pieces.push(needle("蚊子草小白花接到分枝上的短柄", pale, hub, p, 0.001));
      for (let petal = 0; petal < 5; petal++) pieces.push(radialBlade("蚊子草奶白小花的五枚离生花瓣", cream, p, 0.0018, 0.0034, 76, petal * 72));
    }
    parts.push(combineMeshes("榆叶蚊子草枝顶开放疏松的五瓣奶白花云", cream, pieces));
  }
  return parts;
}

function valerian(): ModelPart[] {
  const parts: ModelPart[] = [tapered("缬草直立而上端分枝的细长主茎", pale, [[0, 0, 0], [0, 1.54, 0]], [0.009, 0.002])];
  for (let node = 0; node < 5; node++) for (const side of [-1, 1]) {
    const a = node % 2 * Math.PI / 2 + (side < 0 ? Math.PI : 0), y = 0.13 + node * 0.2, end: Triple = [Math.cos(a) * 0.22, y + 0.03, Math.sin(a) * 0.22], pieces: ModelPart[] = [needle("缬草对生羽状复叶的共同叶轴", pale, [0, y, 0], end, 0.002)];
    for (let leaf = 0; leaf < 5; leaf++) for (const edge of [-1, 1]) { const t = 0.16 + leaf * 0.16, root: Triple = [end[0] * t, y + 0.03 * t, end[2] * t], b = a + edge * 1.2; pieces.push(flatLeaf("缬草羽状叶上成对分离的狭披针小叶", root, [root[0] + Math.cos(b) * 0.072, root[1] + 0.012, root[2] + Math.sin(b) * 0.072], 0.018, "oval", 0.0006)); }
    pieces.push(flatLeaf("缬草奇数复叶远端独立的顶生小叶", end, [end[0] + Math.cos(a) * 0.067, end[1] + 0.01, end[2] + Math.sin(a) * 0.067], 0.018, "oval", 0.0006));
    parts.push(combineMeshes("缬草一片对生而有独立终端小叶的羽状复叶", green, pieces));
  }
  for (let branch = 0; branch < 9; branch++) {
    const a = branch * 2.4, hub: Triple = [Math.cos(a) * 0.22, 1.48 + branch % 3 * 0.033, Math.sin(a) * 0.22], flowers: ModelPart[] = [needle("缬草近乎平顶的聚伞花序主分枝", pale, [0, 1.15 + branch % 3 * 0.08, 0], hub, 0.0025)];
    for (let flower = 0; flower < 3; flower++) {
      const b = flower * Math.PI * 2 / 3, root: Triple = [hub[0] + Math.cos(b) * 0.012, hub[1] + 0.006, hub[2] + Math.sin(b) * 0.012];
      flowers.push(needle("缬草五裂筒状小花的短花柄", pale, hub, root, 0.001), smallCorolla(root, [0, 1, 0], 0.005, 0.0018, "#d0c5bf", false, 5, 8));
    }
    parts.push(combineMeshes("缬草平顶分枝上真正开口的五裂短花管", "#d0c5bf", flowers));
  }
  return parts;
}

function elecampane(): ModelPart[] {
  const parts: ModelPart[] = [tapered("土木香越过大叶丛的粗直高花茎", pale, [[0, 0, 0], [0, 1.92, 0]], [0.019, 0.003])];
  for (let i = 0; i < 6; i++) { const a = i * 2.4, root: Triple = [Math.cos(a) * 0.07, 0.1, Math.sin(a) * 0.07]; parts.push(needle("土木香大型基生叶的粗短柄", pale, [0, 0.01, 0], root, 0.006), flatLeaf("土木香宽长而近全缘的巨大基生叶", root, [root[0] + Math.cos(a) * 0.47, root[1] + 0.13, root[2] + Math.sin(a) * 0.47], 0.21, "oval", 0.002)); }
  for (let i = 0; i < 5; i++) { const a = i * 2.4, y = 0.39 + i * 0.23; parts.push(flatLeaf("土木香沿茎向上渐小的宽抱茎叶", [0, y, 0], [Math.cos(a) * (0.3 - i * 0.033), y + 0.035, Math.sin(a) * (0.3 - i * 0.033)], 0.16 - i * 0.017, "heart", 0.0014)); }
  for (let branch = 0; branch < 5; branch++) {
    const a = branch * 2.4, root: Triple = [Math.cos(a) * 0.2, 1.74 + branch % 3 * 0.1, Math.sin(a) * 0.2], rays: ModelPart[] = [], disk: ModelPart[] = [];
    parts.push(tapered("土木香分枝花头下的承托花梗", pale, [[0, 1.35 + branch % 3 * 0.12, 0], root], [0.005, 0.0015]));
    for (let ray = 0; ray < 36; ray++) rays.push(radialBlade("土木香头状花序边缘极狭而长的舌状小花", "#c7b881", root, 0.0021, 0.043, 87, ray * 10));
    for (let flower = 0; flower < 17; flower++) { const b = flower * 2.4, radius = Math.sqrt(flower / 17) * 0.012; disk.push(lobe("土木香中央凸起而细密的管状花盘", "#bcb18d", [root[0] + Math.cos(b) * radius, root[1] + 0.004, root[2] + Math.sin(b) * radius], [0.003, 0.005, 0.003])); }
    parts.push(combineMeshes("土木香真实窄条舌状花组成的放射花环", "#c7b881", rays), combineMeshes("土木香与狭长舌花分开的中央管花盘", "#bcb18d", disk));
  }
  return parts;
}

function greatBurnet(): ModelPart[] {
  const parts: ModelPart[] = [tapered("地榆细长而上部分枝的直立草茎", pale, [[0, 0, 0], [0, 1.45, 0]], [0.006, 0.0014])];
  const scallop: [number, number][] = [[0, 0], [-0.3, 0.12], [-0.47, 0.33], [-0.37, 0.39], [-0.5, 0.55], [-0.38, 0.62], [-0.35, 0.83], [0, 1], [0.35, 0.83], [0.38, 0.62], [0.5, 0.55], [0.37, 0.39], [0.47, 0.33], [0.3, 0.12]];
  for (let leaf = 0; leaf < 5; leaf++) {
    const a = leaf * 2.4, y = 0.06 + leaf * 0.18, end: Triple = [Math.cos(a) * 0.23, y + 0.06, Math.sin(a) * 0.23], pieces: ModelPart[] = [needle("地榆奇数羽状复叶的共同细轴", pale, [0, y, 0], end, 0.0017)];
    for (let node = 0; node < 4; node++) for (const side of [-1, 1]) { const t = 0.15 + node * 0.2, root: Triple = [end[0] * t, y + 0.06 * t, end[2] * t], b = a + side * 1.2; pieces.push(flatLeaf("地榆边缘明显钝齿的成对卵圆小叶", root, [root[0] + Math.cos(b) * 0.05, root[1] + 0.008, root[2] + Math.sin(b) * 0.05], 0.032, scallop, 0.0007)); }
    pieces.push(flatLeaf("地榆复叶末端独立的卵圆顶生小叶", end, [end[0] + Math.cos(a) * 0.045, end[1] + 0.01, end[2] + Math.sin(a) * 0.045], 0.031, scallop, 0.0007));
    parts.push(combineMeshes("地榆一片有钝齿卵圆小叶的奇数羽状叶", green, pieces));
  }
  for (let flower = 0; flower < 8; flower++) {
    const a = flower * 2.4, root: Triple = [Math.cos(a) * 0.22, 1.29 + flower % 3 * 0.065, Math.sin(a) * 0.22];
    parts.push(tapered("地榆近裸分枝长花柄支撑的单个卵形穗", pale, [[0, 0.91 + flower % 3 * 0.12, 0], root], [0.0022, 0.0008]));
    const florets: ModelPart[] = [lobe("地榆卵形密花头内连接各花的长圆花托", "#9d8c96", [root[0], root[1] + 0.013, root[2]], [0.014, 0.028, 0.014])];
    for (let i = 0; i < 23; i++) { const t = i / 22, b = i * 2.4, radius = Math.sin(t * Math.PI) * 0.008; florets.push(lobe("地榆卵圆花穗表面独立的无瓣暗红小花", "#9d8c96", [root[0] + Math.cos(b) * radius, root[1] + t * 0.026, root[2] + Math.sin(b) * radius], [0.005, 0.005, 0.005])); }
    parts.push(combineMeshes("地榆细长花柄顶端由无瓣小花组成的暗红穗头", "#9d8c96", florets));
  }
  return parts;
}

function longLeafWhorlflower(): ModelPart[] {
  const parts: ModelPart[] = [tapered("长叶刺参基生叶丛中心抽出的花茎", pale, [[0, 0, 0], [0, 0.93, 0]], [0.009, 0.0015])];
  const spiny: [number, number][] = [[0, 0], [-0.23, 0.1], [-0.52, 0.23], [-0.27, 0.28], [-0.55, 0.44], [-0.26, 0.5], [-0.45, 0.66], [-0.19, 0.7], [0, 1], [0.19, 0.7], [0.45, 0.66], [0.26, 0.5], [0.55, 0.44], [0.27, 0.28], [0.52, 0.23], [0.23, 0.1]];
  for (let i = 0; i < 9; i++) { const a = i * 2.4; parts.push(flatLeaf("长叶刺参边缘真正深尖刺齿的基生长叶", [0, 0.005, 0], [Math.cos(a) * 0.31, 0.07 + i % 3 * 0.023, Math.sin(a) * 0.31], 0.053, spiny, 0.0011)); }
  for (let tier = 0; tier < 4; tier++) {
    const y = 0.43 + tier * 0.145, bracts: ModelPart[] = [];
    for (let i = 0; i < 6; i++) bracts.push(radialBlade("长叶刺参各花轮下展开的独立尖苞叶", pale, [0, y, 0], 0.007, 0.052 - tier * 0.006, 98, i * 60 + tier * 17));
    parts.push(combineMeshes("长叶刺参沿花茎分层而非单头的尖苞轮", pale, bracts));
    const flowers: ModelPart[] = [];
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + tier * 0.3, root: Triple = [Math.cos(a) * 0.008, y + 0.015, Math.sin(a) * 0.008]; flowers.push(needle("长叶刺参花轮上接至筒花基部的短花梗", pale, [0, y + 0.015, 0], root, 0.001), smallCorolla(root, [Math.cos(a) * 0.8, 0.4, Math.sin(a) * 0.8], 0.026, 0.0055, pink, true, 5, 8)); }
    for (let i = 0; i < flowers.length; i += 6) parts.push(combineMeshes("长叶刺参各尖苞轮上离生的粉色长筒唇花", pink, flowers.slice(i, i + 6)));
  }
  return parts;
}

export const herbaceousExpansionBatchSevenDesigns: MasterNatureDesign[] = [
  design("stingingNettlePlant", "异株荨麻", "植物", nettle, ["Urtica dioica", "四棱高秆对生粗齿叶与腋生下垂绿花串及真实刺毛"]),
  design("commonMulleinPlant", "毛蕊花", "植物", mullein, ["Verbascum thapsus", "灰绒宽叶莲座与单一直立密黄花轴"]),
  design("americanPokeweedPlant", "美洲商陆", "植物", pokeweed, ["Phytolacca americana", "粗肉质分茎全缘大叶及下垂浆果串"]),
  design("himalayanBalsamPlant", "腺凤仙", "植物", himalayanBalsam, ["Impatiens glandulifera", "膨节高茎三轮生狭齿叶和具真囊腔短距的垂花"]),
  design("tallVerbenaPlant", "柳叶马鞭草", "植物", tallVerbena, ["Verbena bonariensis", "狭对生柳叶长裸分叉秆和扁球状紫色聚伞小花头"]),
  design("meadowsweetPlant", "榆叶蚊子草", "植物", meadowsweet, ["Filipendula ulmaria", "大小不等羽状小叶与大终端裂叶及开放奶白花云"]),
  design("commonValerianPlant", "缬草", "植物", valerian, ["Valeriana officinalis", "对生奇数羽状叶和近乎平顶的五裂短管花序"]),
  design("elecampanePlant", "土木香", "植物", elecampane, ["Inula helenium", "巨大基生叶与多朵细长舌花环黄花头"]),
  design("greatBurnetPlant", "地榆", "植物", greatBurnet, ["Sanguisorba officinalis", "钝齿卵小叶羽状叶和长裸分枝顶端的暗红卵穗"]),
  design("longLeafWhorlflowerPlant", "长叶刺参", "植物", longLeafWhorlflower, ["Morina longifolia", "真实尖齿长叶莲座及分层尖苞轮上的唇形筒花"]),
];
