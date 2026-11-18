import { combineMeshes, design, leaf, needle, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { compoundLeaf, flatLeaf } from "./ediblePlants";
import { hollowPipe } from "./shapedFoods";

const green = "#899c77";
const pale = "#bdc5a4";
const wood = "#a29e88";
const flower = "#b8aeb9";

function falseIndigo(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let axis = 0; axis < 3; axis++) { const a = axis * 2.4, end: Triple = [Math.cos(a) * 0.25, 1.25 + axis * 0.15, Math.sin(a) * 0.25]; parts.push(tapered("紫穗槐由地表斜举的木质枝", wood, [[end[0] * 0.08, 0, end[2] * 0.08], [end[0] * 0.5, end[1] * 0.5, end[2] * 0.5], end], [0.021, 0.014, 0.004]));
    for (let node = 0; node < 3; node++) { const t = 0.35 + node * 0.2, factor = t <= 0.5 ? 0.08 + t * 0.84 : t, root: Triple = [end[0] * factor, end[1] * t, end[2] * factor]; parts.push(compoundLeaf(root, axis * 120 + node * 63, 0.31, 10)); }
    for (const side of [-1, 1]) { const root: Triple = [end[0] + side * 0.025, end[1] + 0.035, end[2]], tip: Triple = [root[0] + side * 0.018, root[1] + 0.15, root[2]]; parts.push(tapered("紫穗槐顶端相连的细长穗状花序轴", green, [end, root, tip], [0.003, 0.0025, 0.001])); const petals: ModelPart[] = [], stamens: ModelPart[] = [];
      for (let i = 0; i < 12; i++) { const t = (i + 0.5) / 12, angle = i * 2.4, p: Triple = [root[0] + (tip[0] - root[0]) * t + Math.cos(angle) * 0.002, root[1] + 0.15 * t, root[2] + Math.sin(angle) * 0.002]; petals.push(leaf("紫穗槐每朵花唯一的一枚旗瓣", flower, p, 0.004, 0.006, [55, 90 - angle * 180 / Math.PI, 0])); for (let j = 0; j < 10; j++) { const b = angle + (j - 4.5) * 0.12; stamens.push(needle("伸出单瓣花口的长雄蕊", pale, p, [p[0] + Math.cos(b) * 0.006, p[1] + 0.006, p[2] + Math.sin(b) * 0.006], 0.00065)); } }
      parts.push(combineMeshes("每条紫穗上独立单瓣花的完整旗瓣列", flower, petals)); for (let i = 0; i < stamens.length; i += 60) parts.push(combineMeshes("紫穗槐每花十枚真实分离的雄蕊刷", pale, stamens.slice(i, i + 60)));
    }
  }
  return parts;
}

function babyRubberPlant(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let axis = 0; axis < 3; axis++) { const a = axis * 2.4, end: Triple = [Math.cos(a) * 0.045, 0.22 + axis * 0.025, Math.sin(a) * 0.045]; parts.push(tapered("豆瓣绿由基部抽出的肥厚肉质茎", green, [[0, 0, 0], end], [0.009, 0.004])); const leaves: ModelPart[] = [];
    for (let node = 0; node < 6; node++) { const t = 0.2 + node * 0.13, angle = a + node * 2.4, root: Triple = [end[0] * t, end[1] * t, end[2] * t], leafBase: Triple = [root[0] + Math.cos(angle) * 0.009, root[1] + 0.003, root[2] + Math.sin(angle) * 0.009]; leaves.push(needle("豆瓣绿叶片基部很短的叶柄", pale, root, leafBase, 0.002), flatLeaf("豆瓣绿宽而钝圆的厚倒卵形叶", leafBase, [leafBase[0] + Math.cos(angle) * 0.069, leafBase[1] + 0.018, leafBase[2] + Math.sin(angle) * 0.069], 0.044, "obovate")); } parts.push(combineMeshes("豆瓣绿完整互生肉质叶列", green, leaves));
    const base: Triple = [end[0], end[1] - 0.015, end[2]], tip: Triple = [end[0] + Math.cos(a) * 0.038, end[1] + 0.07, end[2] + Math.sin(a) * 0.038]; parts.push(tapered("豆瓣绿顶端不具显眼花瓣的鼠尾状肉穗", pale, [base, [base[0], base[1] + 0.025, base[2]], tip], [0.002, 0.002, 0.0008]));
  }
  return parts;
}

function pothos(): ModelPart[] {
  const path: Triple[] = [[0, 0.015, 0], [0.35, 0.025, 0.06], [0.75, 0.018, -0.01], [1.18, 0.026, 0.06]], parts: ModelPart[] = [tapered("绿萝贴近基底而非无支撑竖起的肉质藤茎", green, path, [0.007, 0.006, 0.0055, 0.003])];
  for (let node = 0; node < 8; node++) { const t = (node + 0.5) / 8 * 3, section = Math.floor(t), u = t - section, a = path[section]!, b = path[section + 1]!, root: Triple = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u], side = node % 2 ? 1 : -1, petiole: Triple = [root[0] + 0.015, root[1] + 0.04, root[2] + side * 0.045]; parts.push(tapered("绿萝由茎节斜举的带鞘长叶柄", pale, [root, petiole], [0.0038, 0.002]), flatLeaf("绿萝互生而完整不另拆生长期的心形叶", petiole, [petiole[0] + 0.05, petiole[1] + 0.04, petiole[2] + side * 0.15], 0.125, "heart"), tapered("由地表茎节长向基底的可见气生根", wood, [root, [root[0] + 0.012, 0.005, root[2] + 0.01], [root[0] + 0.025, 0.001, root[2] + 0.018]], [0.0025, 0.0012, 0.0005])); const sheathEnd: Triple = [root[0] + (petiole[0] - root[0]) * 0.75, root[1] + (petiole[1] - root[1]) * 0.75, root[2] + (petiole[2] - root[2]) * 0.75], sheath = hollowPipe("绿萝沿叶柄有实际纵向开口的膜质叶鞘", [root, sheathEnd], 0.0045, 0.004, Math.PI * 1.4); sheath.color = green; parts.push(sheath); }
  return parts;
}

export const foliageFormDesigns: MasterNatureDesign[] = [
  design("amorpha", "紫穗槐", "植物", falseIndigo, ["Amorpha fruticosa", "单瓣花与奇数羽状复叶"]),
  design("peperomia", "豆瓣绿", "植物", babyRubberPlant, ["Peperomia obtusifolia", "钝圆厚叶与无瓣肉穗"]),
  design("pothos", "绿萝", "植物", pothos, ["Epipremnum aureum", "带鞘叶柄与贴地藤茎"]),
];
