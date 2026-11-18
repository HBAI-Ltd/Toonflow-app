import { cap, combineMeshes, design, leaf, lobe, needle, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { hollowPipe } from "./shapedFoods";
import { smallCorolla } from "./gardenPerennials";
import { stemPoint } from "./springShrubs";

const green = "#92a17c";
const pale = "#bdc6a4";
const cream = "#d0cbb1";
const bloom = "#beb2bc";
const serrate: [number, number][] = [[0, 0], [-0.2, -0.03], [-0.5, 0.12], [-0.43, 0.22], [-0.56, 0.3], [-0.42, 0.36], [-0.53, 0.46], [-0.36, 0.52], [-0.44, 0.64], [-0.25, 0.67], [-0.28, 0.8], [0, 1], [0.28, 0.8], [0.25, 0.67], [0.44, 0.64], [0.36, 0.52], [0.53, 0.46], [0.42, 0.36], [0.56, 0.3], [0.43, 0.22], [0.5, 0.12], [0.2, -0.03]];

function rayFloret(root: Triple, angle: number, length: number, width: number, teeth: number, color: string): ModelPart {
  const outline: [number, number][] = [[0, 0], [-width * 0.27, length * 0.17], [-width * 0.5, length * 0.7], [-width * 0.47, length * 0.94]];
  for (let i = 0; i <= teeth * 2; i++) outline.push([(i / (teeth * 2) - 0.5) * width * 0.94, length * (i % 2 ? 0.94 : 1)]);
  outline.push([width * 0.5, length * 0.7], [width * 0.27, length * 0.17]); const p = polygon("舌状小花末端真正分开的细裂齿", color, outline, 0.0004, root); p.rotation.y = angle; p.vertices = p.vertices!.map(v => ({ ...v, y: v.y + Math.sin(v.z / length * Math.PI) * length * 0.11 })); return p;
}

function perilla(): ModelPart[] {
  const parts: ModelPart[] = [part("紫苏真正四棱而非贴线的直立主秆", "box", green, [0, 0.35, 0], [0.01, 0.7, 0.01])];
  for (let node = 0; node < 6; node++) for (const side of [-1, 1]) { const a = node % 2 * Math.PI / 2 + (side < 0 ? Math.PI : 0), y = 0.07 + node * 0.075, p: Triple = [Math.cos(a) * 0.03, y + 0.009, Math.sin(a) * 0.03]; parts.push(needle("紫苏对生宽叶有真实长度的叶柄", green, [0, y, 0], p, 0.002), flatLeaf("紫苏具有实际粗锯齿的心状宽卵叶", p, [p[0] + Math.cos(a) * (0.12 - node * 0.008), p[1] + 0.035, p[2] + Math.sin(a) * (0.12 - node * 0.008)], 0.095 - node * 0.005, serrate)); }
  for (let axis = 0; axis < 3; axis++) { const a = axis * 2.4, root: Triple = [0, 0.46 + axis * 0.03, 0], end: Triple = [Math.cos(a) * 0.055, 0.72 + axis * 0.025, Math.sin(a) * 0.055]; parts.push(tapered("紫苏从上部叶腋抽出的细花序轴", green, [root, end], [0.002, 0.0007]));
    for (let tier = 0; tier < 5; tier++) { const t = 0.3 + tier * 0.14, p: Triple = [end[0] * t, root[1] + (end[1] - root[1]) * t, end[2] * t]; for (const side of [-1, 1]) { const b = a + side * Math.PI / 2; parts.push(smallCorolla(p, [Math.cos(b), 0.2, Math.sin(b)], 0.0035, 0.0012, cream, true)); } }
  }
  return parts;
}

function alfalfa(): ModelPart[] {
  const parts: ModelPart[] = [], blade: [number, number][] = [[0, 0], [-0.22, 0.13], [-0.42, 0.43], [-0.48, 0.7], [-0.36, 0.73], [-0.46, 0.84], [-0.3, 0.85], [-0.29, 0.96], [-0.08, 0.93], [0, 1], [0.08, 0.93], [0.29, 0.96], [0.3, 0.85], [0.46, 0.84], [0.36, 0.73], [0.48, 0.7], [0.42, 0.43], [0.22, 0.13]];
  for (let branch = 0; branch < 3; branch++) { const a = branch * 2.4, end: Triple = [Math.cos(a) * 0.095, 0.4 + branch * 0.055, Math.sin(a) * 0.095]; parts.push(tapered("苜蓿从根颈抽出的柔细分枝茎", green, [[0, 0, 0], end], [0.0035, 0.001]));
    for (let node = 0; node < 6; node++) { const t = 0.12 + node * 0.13, root: Triple = [end[0] * t, end[1] * t, end[2] * t], b = a + node * 2.4, p: Triple = [root[0] + Math.cos(b) * 0.012, root[1] + 0.004, root[2] + Math.sin(b) * 0.012], leaves: ModelPart[] = [needle("苜蓿互生三出叶的总叶柄", green, root, p, 0.001)];
      for (let leaflet = 0; leaflet < 3; leaflet++) { const c = b + (leaflet - 1) * 0.9, start: Triple = leaflet === 1 ? [p[0] + Math.cos(b) * 0.004, p[1] + 0.001, p[2] + Math.sin(b) * 0.004] : p; if (leaflet === 1) leaves.push(needle("苜蓿顶生小叶比侧叶长的独立短柄", green, p, start, 0.0006)); leaves.push(flatLeaf("苜蓿仅上部具细齿且有顶端齿尖的倒卵小叶", start, [start[0] + Math.cos(c) * 0.022, start[1] + 0.006, start[2] + Math.sin(c) * 0.022], 0.0085, blade, 0.00035)); }
      parts.push(combineMeshes("苜蓿一片毫米尺度的完整三出细齿复叶", green, leaves));
    }
    const root: Triple = [end[0] * 0.78, end[1] * 0.78, end[2] * 0.78], top: Triple = [root[0] + Math.cos(a) * 0.02, root[1] + 0.075, root[2] + Math.sin(a) * 0.02]; parts.push(tapered("苜蓿叶腋总梗末端的短总状花序轴", pale, [root, top], [0.0013, 0.0005]));
    for (let flower = 0; flower < 6; flower++) { const t = 0.5 + flower * 0.08, q: Triple = [root[0] + (top[0] - root[0]) * t, root[1] + (top[1] - root[1]) * t, root[2] + (top[2] - root[2]) * t], b = flower * 2.4, p: Triple = [q[0] + Math.cos(b) * 0.0025, q[1], q[2] + Math.sin(b) * 0.0025], pieces: ModelPart[] = [needle("苜蓿小蝶形花各自相连的短梗", green, q, p, 0.0005), leaf("苜蓿长于翼瓣的独立长圆形旗瓣", bloom, p, 0.0038, 0.0085, [50, 90 - b * 180 / Math.PI, 0]), lobe("苜蓿下部钝头合拢的短龙骨瓣", bloom, [p[0] + Math.cos(b) * 0.003, p[1] + 0.001, p[2] + Math.sin(b) * 0.003], [0.003, 0.003, 0.005])]; for (const side of [-1, 1]) pieces.push(leaf("苜蓿夹住龙骨瓣的一对狭翼瓣", bloom, p, 0.0019, 0.006, [76, 90 - b * 180 / Math.PI + side * 18, 0])); parts.push(combineMeshes("苜蓿总状花序上一朵独立蝶形小花", bloom, pieces)); }
    for (let fruit = 0; fruit < 2; fruit++) { const node: Triple = [end[0] * (0.5 + fruit * 0.12), end[1] * (0.5 + fruit * 0.12), end[2] * (0.5 + fruit * 0.12)], p: Triple = [node[0] + 0.015, node[1] + 0.017, node[2]], path: Triple[] = Array.from({ length: 25 }, (_, i) => { const t = i / 24, b = t * Math.PI * 5.6; return [p[0] + Math.cos(b) * 0.0027, p[1] + t * 0.0035, p[2] + Math.sin(b) * 0.0027]; }); parts.push(combineMeshes("苜蓿一枚保持真实毫米尺度的完整螺旋果荚", pale, [needle("苜蓿螺旋果荚真实相连的小果柄", pale, node, path[0]!, 0.00065), tapered("苜蓿真正连续紧卷近三圈的六毫米螺旋荚", pale, path, path.map(() => 0.00085))])); }
  }
  return parts;
}

function chicory(): ModelPart[] {
  const parts: ModelPart[] = [tapered("菊苣粗硬且上部明显分叉的主草茎", pale, [[0, 0, 0], [0.006, 0.43, 0], [0, 0.94, 0]], [0.007, 0.0045, 0.001])];
  for (let i = 0; i < 6; i++) { const a = i * 2.4; parts.push(flatLeaf("菊苣基生莲座具有深羽裂的大叶", [0, 0.003, 0], [Math.cos(a) * 0.2, 0.017 + i % 2 * 0.012, Math.sin(a) * 0.2], 0.065, "lobed")); }
  for (let branch = 0; branch < 3; branch++) { const a = branch * 2.4, path: Triple[] = [[0.006, 0.32 + branch * 0.13, 0], [Math.cos(a) * 0.18, 0.64 + branch * 0.1, Math.sin(a) * 0.18], [Math.cos(a) * 0.26, 0.84 + branch * 0.1, Math.sin(a) * 0.26]]; parts.push(tapered("菊苣向外斜生的硬直分叉花枝", pale, path, [0.003, 0.002, 0.0008]));
    for (let node = 0; node < 3; node++) { const p = stemPoint(path, 0.27 + node * 0.3); parts.push(flatLeaf("菊苣茎生无柄抱茎的短小披针叶", p, [p[0] + Math.cos(a + 1) * 0.047, p[1] + 0.016, p[2] + Math.sin(a + 1) * 0.047], 0.019), cap("菊苣所有小花共同着生的总苞", green, p, 0.006, 0.008, 4)); const rays: ModelPart[] = []; for (let i = 0; i < 14; i++) rays.push(rayFloret([p[0], p[1] + 0.007, p[2]], i * 360 / 14, 0.016, 0.0042, 5, bloom)); for (let i = 0; i < rays.length; i += 8) parts.push(combineMeshes("菊苣没有中央管花盘的全舌状花序", bloom, rays.slice(i, i + 8))); }
  }
  return parts;
}

function henbane(): ModelPart[] {
  const path: Triple[] = [[0, 0, 0], [0, 0.31, 0], [0.025, 0.61, 0], [0.1, 0.7, 0.04], [0.135, 0.67, 0.08]], parts: ModelPart[] = [tapered("天仙子上部连续卷成蝎尾状的草茎", pale, path, [0.007, 0.005, 0.003, 0.0015, 0.0007])];
  for (let node = 0; node < 9; node++) { const p = stemPoint(path, 0.06 + node * 0.1), a = node * 2.4; parts.push(flatLeaf("天仙子具有粗大裂齿且抱茎的宽叶", p, [p[0] + Math.cos(a) * (0.13 - node * 0.008), p[1] + 0.025, p[2] + Math.sin(a) * (0.13 - node * 0.008)], 0.08 - node * 0.005, "lobed")); }
  for (let i = 0; i < 6; i++) { const p = stemPoint(path, 0.35 + i * 0.105), root: Triple = [p[0] + 0.009, p[1] + 0.002, p[2] + 0.008]; parts.push(needle("天仙子单侧花与叶腋相接的短梗", pale, p, root, 0.0013), smallCorolla(root, [0.6, 0.35, 0.75], 0.022, 0.0075, cream)); const calyx: ModelPart[] = []; for (let tooth = 0; tooth < 5; tooth++) calyx.push(leaf("天仙子增大的杯萼口五枚长尖齿", green, root, 0.004, 0.014, [30, tooth * 72, 0])); parts.push(combineMeshes("天仙子花基部确实尖齿开放的花萼", green, calyx)); }
  return parts;
}

function gerbera(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 9; i++) { const a = i * 2.4; parts.push(flatLeaf("非洲菊贴近地面且具有深裂缘的长柄基生叶", [0, 0.004, 0], [Math.cos(a) * 0.23, 0.04 + i % 3 * 0.016, Math.sin(a) * 0.23], 0.09, "lobed")); }
  for (let flower = 0; flower < 3; flower++) { const a = flower * 2.4, root: Triple = [Math.cos(a) * 0.06, 0.36 + flower * 0.04, Math.sin(a) * 0.06], stem = hollowPipe("非洲菊不带茎叶的真正中空长花葶", [[0, 0.002, 0], [root[0] * 0.5, root[1] * 0.58, root[2] * 0.5], root], 0.004, 0.0027); stem.color = pale; parts.push(stem, cap("非洲菊大花头下面实际收拢的多层总苞", green, root, 0.018, 0.013, 4));
    for (let ring = 0; ring < 2; ring++) { const rays: ModelPart[] = []; for (let i = 0; i < (ring ? 16 : 24); i++) rays.push(rayFloret([root[0], root[1] + 0.01 + ring * 0.001, root[2]], i * 360 / (ring ? 16 : 24) + ring * 9, ring ? 0.026 : 0.047, ring ? 0.0035 : 0.005, 3, bloom)); for (let i = 0; i < rays.length; i += 12) parts.push(combineMeshes("非洲菊长短两圈真实带三裂齿的舌状花", bloom, rays.slice(i, i + 12))); }
    const disk: ModelPart[] = []; for (let i = 0; i < 25; i++) { const b = i * 2.4, r = Math.sqrt(i / 25) * 0.011; disk.push(lobe("非洲菊中央小而独立的管状花顶部", "#b5ae91", [root[0] + Math.cos(b) * r, root[1] + 0.012 + (1 - r / 0.011) * 0.003, root[2] + Math.sin(b) * r], [0.002, 0.0025, 0.002])); } parts.push(combineMeshes("非洲菊与长舌状花分离的细密中央管花盘", "#b5ae91", disk));
  }
  return parts;
}

function bluebeard(): ModelPart[] {
  const parts: ModelPart[] = [part("兰香草基部有实际四棱的直立茎", "box", green, [0, 0.29, 0], [0.009, 0.58, 0.009])];
  for (let branch = 0; branch < 3; branch++) { const a = branch * 2.4, root: Triple = [0, 0.18 + branch * 0.1, 0], end: Triple = [Math.cos(a) * 0.18, 0.63 + branch * 0.05, Math.sin(a) * 0.18]; parts.push(tapered("兰香草上部实际分叉的细支茎", pale, [root, end], [0.003, 0.001]));
    for (let node = 0; node < 4; node++) { const t = 0.18 + node * 0.21, p: Triple = [end[0] * t, root[1] + (end[1] - root[1]) * t, end[2] * t]; for (const side of [-1, 1]) { const b = a + side * 1.2; parts.push(flatLeaf("兰香草沿支茎对生的粗锯齿卵叶", p, [p[0] + Math.cos(b) * 0.055, p[1] + 0.016, p[2] + Math.sin(b) * 0.055], 0.027, serrate)); if (node < 1) continue; const flower: Triple = [p[0] + Math.cos(b) * 0.007, p[1] + 0.005, p[2] + Math.sin(b) * 0.007]; parts.push(smallCorolla(flower, [Math.cos(b), 0.5, Math.sin(b)], 0.009, 0.003, bloom, "bearded")); const organs: ModelPart[] = []; for (let stamen = 0; stamen < 4; stamen++) organs.push(needle("兰香草超出花冠的四枚长雄蕊", cream, flower, [flower[0] + Math.cos(b) * 0.019 + (stamen - 1.5) * 0.001, flower[1] + 0.013, flower[2] + Math.sin(b) * 0.019], 0.00045)); for (let fringe = 0; fringe < 7; fringe++) organs.push(needle("兰香草下唇真实分立的须状裂缘", bloom, [flower[0] + Math.cos(b) * 0.008, flower[1] + 0.001, flower[2] + Math.sin(b) * 0.008], [flower[0] + Math.cos(b) * 0.011 - Math.sin(b) * (fringe - 3) * 0.001, flower[1] - 0.002, flower[2] + Math.sin(b) * 0.011 + Math.cos(b) * (fringe - 3) * 0.001], 0.0004)); parts.push(combineMeshes("兰香草花喉外真正的四蕊与流苏下唇", bloom, organs)); } }
  }
  return parts;
}

export const fieldFlowerDesigns: MasterNatureDesign[] = [
  design("perilla", "紫苏", "植物", perilla, ["Perilla frutescens", "四棱茎粗锯齿对生叶与双唇小花"]),
  design("alfalfa", "苜蓿", "植物", alfalfa, ["Medicago sativa", "三出细齿小叶蝶形总状花与真螺旋荚"]),
  design("chicory", "菊苣", "植物", chicory, ["Cichorium intybus", "基生羽裂叶与全舌状五齿花序"]),
  design("henbane", "天仙子", "植物", henbane, ["Hyoscyamus niger", "抱茎齿叶与卷曲单侧花序"]),
  design("gerbera", "非洲菊", "植物", gerbera, ["Gerbera jamesonii", "中空长花葶与三齿长短舌状花环"]),
  design("caryopteris", "兰香草", "植物", bluebeard, ["Caryopteris incana", "对生叶腋聚伞与四蕊流苏下唇"]),
];
