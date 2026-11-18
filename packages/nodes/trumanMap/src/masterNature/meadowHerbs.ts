import { cap, combineMeshes, design, leaf, lobe, needle, petals, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { compoundLeaf, flatLeaf } from "./ediblePlants";
import { hollowPipe } from "./shapedFoods";

const green = "#92a17d";
const pale = "#c0c7a6";
const cream = "#d0ccb2";
const yellow = "#c7be94";

function dividedLeaf(root: Triple, angle: number, length: number): ModelPart {
  const a = angle * Math.PI / 180, tip: Triple = [root[0] + Math.cos(a) * length, root[1] + length * 0.38, root[2] + Math.sin(a) * length], pieces: ModelPart[] = [needle("丝裂叶共同的细长叶轴", green, root, tip, 0.0013)];
  for (let node = 0; node < 4; node++) for (const side of [-1, 1]) {
    const t = (node + 1) / 5, p: Triple = [root[0] + (tip[0] - root[0]) * t, root[1] + (tip[1] - root[1]) * t, root[2] + (tip[2] - root[2]) * t], b = a + side * 0.85, end: Triple = [p[0] + Math.cos(b) * length * (0.44 - t * 0.23), p[1] + length * 0.09, p[2] + Math.sin(b) * length * (0.44 - t * 0.23)]; pieces.push(needle("丝裂叶真实分出的二级叶轴", green, p, end, 0.00085));
    for (let split = 0; split < 3; split++) for (const edge of [-1, 1]) { const u = (split + 1) / 4, q: Triple = [p[0] + (end[0] - p[0]) * u, p[1] + (end[1] - p[1]) * u, p[2] + (end[2] - p[2]) * u], c = b + edge * 0.8; pieces.push(needle("末回真实分开的线状叶裂片", green, q, [q[0] + Math.cos(c) * length * 0.12, q[1] + length * 0.028, q[2] + Math.sin(c) * length * 0.12], 0.00055)); }
  }
  return combineMeshes("具有三级分叉而非一束放射刺的丝状复裂叶", green, pieces);
}

function cilantro(): ModelPart[] {
  const parts: ModelPart[] = [tapered("香菜由根颈起的细长抽薹茎", green, [[0, 0, 0], [0.006, 0.29, 0], [0, 0.57, 0]], [0.0045, 0.0032, 0.001])];
  for (let i = 0; i < 5; i++) { const a = i * 2.4, top: Triple = [Math.cos(a) * 0.06, 0.08 + i % 3 * 0.018, Math.sin(a) * 0.06]; parts.push(needle("香菜下部宽裂叶的独立长叶柄", green, [0, i * 0.008, 0], top, 0.0018), compoundLeaf(top, i * 137.5, 0.07, 1, true)); }
  for (let i = 0; i < 4; i++) parts.push(dividedLeaf([0.006 - i * 0.0015, 0.28 + i * 0.055, 0], i * 137.5, 0.085 - i * 0.006));
  for (let axis = 0; axis < 3; axis++) { const a = axis * 2.4, root: Triple = [0.005, 0.34 + axis * 0.06, 0], top: Triple = [Math.cos(a) * 0.095, 0.56 + axis * 0.045, Math.sin(a) * 0.095]; parts.push(tapered("香菜上部复伞形花序的独立枝轴", green, [root, top], [0.002, 0.001]));
    for (let ray = 0; ray < 5; ray++) { const b = ray * Math.PI * 2 / 5, end: Triple = [top[0] + Math.cos(b) * 0.032, top[1] + 0.025, top[2] + Math.sin(b) * 0.032], flowers: ModelPart[] = [needle("香菜复伞花序相接的伞辐", green, top, end, 0.0007)]; for (let i = 0; i < 5; i++) { const c = i * Math.PI * 2 / 5, p: Triple = [end[0] + Math.cos(c) * 0.006, end[1] + 0.004, end[2] + Math.sin(c) * 0.006]; flowers.push(needle("小伞内的独立花柄", green, end, p, 0.00045), petals(5, p, 0.001, 0.002, 80, cream)); } parts.push(combineMeshes("香菜白色小复伞与实际相连的花梗", cream, flowers)); }
  }
  return parts;
}

function dill(): ModelPart[] {
  const stem = hollowPipe("莳萝从基部贯通到顶端的中空细秆", [[0, 0, 0], [0.006, 0.42, 0], [0.018, 0.91, 0]], 0.005, 0.0032); stem.color = green; const parts: ModelPart[] = [stem];
  for (let node = 0; node < 5; node++) { const y = 0.08 + node * 0.128, x = y < 0.42 ? y / 0.42 * 0.006 : 0.006 + (y - 0.42) / 0.49 * 0.012, root: Triple = [x, y, 0], a = node * 2.4; parts.push(dividedLeaf(root, node * 137.5, 0.2 - node * 0.017)); const sheath = hollowPipe("莳萝叶基真正包围空心秆的裂口叶鞘", [[x, y - 0.018, 0], root], 0.0055, 0.0048, Math.PI * 1.65, a); sheath.color = pale; parts.push(sheath); }
  const top: Triple = [0.018, 0.91, 0], rays: ModelPart[] = [];
  for (let ray = 0; ray < 12; ray++) { const a = ray * Math.PI / 6, end: Triple = [top[0] + Math.cos(a) * 0.105, top[1] + 0.05 + ray % 2 * 0.009, Math.sin(a) * 0.105]; rays.push(needle("莳萝大复伞从同一点放射的长伞辐", green, top, end, 0.0013)); const flowers: ModelPart[] = [];
    for (let i = 0; i < 8; i++) { const b = i * Math.PI / 4, p: Triple = [end[0] + Math.cos(b) * 0.013, end[1] + 0.007, end[2] + Math.sin(b) * 0.013]; flowers.push(needle("莳萝末级小伞从同一点相连的花梗", green, end, p, 0.00045), petals(5, p, 0.0008, 0.0014, 76, yellow)); } parts.push(combineMeshes("莳萝一整朵黄色小伞形花序", yellow, flowers));
  }
  parts.push(combineMeshes("莳萝十二条相连的大伞辐", green, rays)); return parts;
}

function cudweed(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let stem = 0; stem < 3; stem++) { const a = stem * 2.4, end: Triple = [Math.cos(a) * 0.035, 0.22 + stem * 0.025, Math.sin(a) * 0.035]; parts.push(tapered("鼠曲草从地表簇生的细绵毛茎", pale, [[0, 0, 0], end], [0.0027, 0.001]));
    const leaves: ModelPart[] = [];
    for (let node = 0; node < 7; node++) { const t = 0.08 + node * 0.115, p: Triple = [end[0] * t, end[1] * t, end[2] * t], b = node * 2.4; const blade = flatLeaf("鼠曲草无柄且下延抱茎的匙状叶", p, [p[0] + Math.cos(b) * 0.041, p[1] + 0.012, p[2] + Math.sin(b) * 0.041], 0.009, "obovate"); blade.color = pale; leaves.push(blade, needle("匙叶基部真实沿茎下延的窄翼", pale, [p[0] - end[0] * 0.06, p[1] - end[1] * 0.06, p[2] - end[2] * 0.06], p, 0.0018)); } parts.push(combineMeshes("鼠曲草银灰色互生匙叶与下延叶基", pale, leaves));
    const rays: ModelPart[] = [];
    for (let head = 0; head < 6; head++) { const b = head * 2.4, p: Triple = [end[0] + Math.cos(b) * 0.012, end[1] + 0.008 + head % 2 * 0.003, end[2] + Math.sin(b) * 0.012]; rays.push(needle("鼠曲草顶生聚伞上每枚头状花序的短柄", pale, end, p, 0.0007)); parts.push(cap("鼠曲草细小头状花序的真正杯形总苞", yellow, p, 0.0018, 0.0035, 3)); const bracts: ModelPart[] = []; for (let i = 0; i < 7; i++) bracts.push(leaf("鼠曲草总苞边缘真实分离的纸质片", yellow, [p[0], p[1] + 0.001, p[2]], 0.0011, 0.0032, [25, i * 360 / 7, 0])); for (let i = 0; i < 5; i++) { const c = i * 2.4; bracts.push(needle("鼠曲草头部只有管状花而无舌状大瓣", yellow, [p[0] + Math.cos(c) * 0.0008, p[1] + 0.0017, p[2] + Math.sin(c) * 0.0008], [p[0] + Math.cos(c) * 0.0008, p[1] + 0.004, p[2] + Math.sin(c) * 0.0008], 0.0006)); } parts.push(combineMeshes("鼠曲草一枚小花头的纸质苞片与管花", yellow, bracts)); }
    parts.push(combineMeshes("鼠曲草紧凑而平顶的聚伞分枝", pale, rays));
  }
  return parts;
}

function sorrel(): ModelPart[] {
  const parts: ModelPart[] = [tapered("酸模由根颈抽出的细红褐色花果秆", "#aea08b", [[0, 0, 0], [0.007, 0.43, 0], [0.012, 0.83, 0]], [0.006, 0.004, 0.0012])];
  for (let i = 0; i < 6; i++) { const a = i * 2.4, p: Triple = [Math.cos(a) * 0.045, 0.035 + i % 2 * 0.02, Math.sin(a) * 0.045]; parts.push(needle("酸模下部独立而细长的叶柄", green, [0, 0.003 + i * 0.005, 0], p, 0.0018), flatLeaf("酸模具有向下指耳状基裂的狭箭叶", p, [p[0] + Math.cos(a) * 0.1, p[1] + 0.025, p[2] + Math.sin(a) * 0.1], 0.035, "arrow")); }
  for (let i = 0; i < 3; i++) { const y = 0.19 + i * 0.105, x = 0.007 * y / 0.43, side = i % 2 ? -1 : 1; parts.push(flatLeaf("酸模上部无长柄且抱秆的小型箭叶", [x, y, 0], [x + side * 0.06, y + 0.025, 0.01], 0.024, "arrow")); }
  for (let branch = 0; branch < 5; branch++) { const a = branch * 2.4, root: Triple = [0.007 + branch * 0.0007, 0.46 + branch * 0.061, 0], tip: Triple = [root[0] + Math.cos(a) * (0.105 - branch * 0.012), root[1] + 0.13, Math.sin(a) * (0.105 - branch * 0.012)]; parts.push(needle("酸模上部无宽叶的稀疏圆锥果序侧轴", "#aea08b", root, tip, 0.0012)); const fruits: ModelPart[] = [];
    for (let node = 0; node < 5; node++) { const t = (node + 1) / 6, p: Triple = [root[0] + (tip[0] - root[0]) * t, root[1] + (tip[1] - root[1]) * t, tip[2] * t], fruit: Triple = [p[0] + Math.cos(a + node) * 0.005, p[1] + 0.002, p[2] + Math.sin(a + node) * 0.005]; fruits.push(needle("酸模三瓣翅果实际相接的细果柄", "#aea08b", p, fruit, 0.00045));
      for (let wing = 0; wing < 3; wing++) { const valve = polygon("酸模包住瘦果的三枚圆心形扩大内花被", "#b9ad99", [[0, -0.0011], [-0.0012, -0.0008], [-0.0017, 0.0004], [-0.0009, 0.0015], [0, 0.0017], [0.0009, 0.0015], [0.0017, 0.0004], [0.0012, -0.0008]], 0.00022, fruit); valve.rotation = { x: -90, y: 0, z: wing * 120 }; fruits.push(valve); }
    }
    parts.push(combineMeshes("酸模每一侧轴上真实三枚翅瓣的小果群", "#b9ad99", fruits));
  }
  return parts;
}

function bupleurum(): ModelPart[] {
  const parts: ModelPart[] = [tapered("柴胡没有膨大食用球茎的细直草茎", green, [[0, 0, 0], [0, 0.29, 0], [0.009, 0.65, 0]], [0.005, 0.003, 0.0009])];
  for (let i = 0; i < 10; i++) { const y = 0.024 + i * 0.044, x = Math.max(0, (y - 0.29) / 0.36) * 0.009, a = i * 2.4; parts.push(flatLeaf("柴胡互生且具纵脉的狭披针形单叶", [x, y, 0], [x + Math.cos(a) * 0.087, y + 0.03, Math.sin(a) * 0.087], 0.012)); }
  for (let branch = 0; branch < 3; branch++) { const a = branch * 2.4, root: Triple = [0.002, 0.38 + branch * 0.07, 0], top: Triple = [Math.cos(a) * (0.13 - branch * 0.02), 0.61 + branch * 0.054, Math.sin(a) * (0.13 - branch * 0.02)]; parts.push(needle("柴胡上部多次分叉后开展的细枝", green, root, top, 0.0017)); const bracts: ModelPart[] = []; for (let i = 0; i < 4; i++) bracts.push(leaf("柴胡伞序下方可见的叶状总苞片", pale, top, 0.004, 0.016, [65, i * 90, 0])); parts.push(combineMeshes("柴胡细伞辐根部的叶状总苞", pale, bracts));
    for (let ray = 0; ray < 5; ray++) { const b = ray * Math.PI * 2 / 5, end: Triple = [top[0] + Math.cos(b) * 0.034, top[1] + 0.025, top[2] + Math.sin(b) * 0.034], flowers: ModelPart[] = [needle("柴胡小复伞相连的细伞辐", green, top, end, 0.0008)]; for (let bract = 0; bract < 5; bract++) flowers.push(leaf("柴胡末级小伞花序下的五枚小总苞片", pale, end, 0.0015, 0.004, [75, bract * 72, 0])); for (let flower = 0; flower < 4; flower++) { const c = flower * Math.PI / 2, p: Triple = [end[0] + Math.cos(c) * 0.004, end[1] + 0.003, end[2] + Math.sin(c) * 0.004]; flowers.push(needle("柴胡小黄花与小伞中心相连的短梗", green, end, p, 0.0004), petals(5, p, 0.0007, 0.0013, 80, yellow)); } parts.push(combineMeshes("柴胡有显著小总苞的黄色复伞花序", yellow, flowers)); }
  }
  return parts;
}

export const meadowHerbDesigns: MasterNatureDesign[] = [
  design("coriander", "香菜", "植物", cilantro, ["Coriandrum sativum", "下宽裂上丝裂的异形叶与白复伞"]),
  design("dill", "莳萝", "植物", dill, ["Anethum graveolens", "空心秆裂口叶鞘与黄色大复伞"]),
  design("cudweed", "鼠曲草", "植物", cudweed, ["Pseudognaphalium affine", "下延匙叶与纸苞无舌状小花头"]),
  design("sorrel", "酸模", "植物", sorrel, ["Rumex acetosa", "狭箭叶与三枚翅状内花被"]),
  design("bupleurum", "柴胡", "植物", bupleurum, ["Bupleurum chinense", "纵脉狭单叶与显著小总苞复伞"]),
];
