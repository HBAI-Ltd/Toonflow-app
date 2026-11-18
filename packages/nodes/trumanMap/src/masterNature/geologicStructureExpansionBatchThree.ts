import { design } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { prism } from "./geologicStructureExpansionBatchOne";

type Point = [number, number];

function interlockingStylolite(): ModelPart[] {
  const heights = [5.8, 6.1, 5.7, 7.3, 5.8, 6.3, 4.9, 6.2, 5.8, 7.1, 5.6, 6.1, 5.7];
  const contact: Point[] = heights.map((y, index) => [-16 + index * 32 / (heights.length - 1), y]);
  const upper: Point[] = contact.map(([x, y]) => [x, y + 0.07]);
  return [prism("压力溶蚀界面下方真实上凸下凹的完整岩体", "#b3b69e", [[-16, 0], [16, 0], ...contact.slice().reverse()], 12), prism("互相咬合的齿状界面中连续而不敞空的薄残渣带", "#879486", [...contact, ...upper.slice().reverse()], 12), prism("与下方岩体互补咬合而不是锯齿贴片的上部岩体", "#c0baa0", [...upper, [16, 12], [-16, 12]], 12)];
}

function grabenValley(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let layer = 0; layer < 6; layer++) {
    const low = layer * 3, high = low + 3, leftLow = -8 - low * 2 / 9, leftHigh = -8 - high * 2 / 9;
    const color = layer % 2 ? "#b9ac8d" : "#9fa995";
    parts.push(prism("地堑左侧保持原层位的完整断块", color, [[-30, low], [leftLow, low], [leftHigh, high], [-30, high]], 45), prism("地堑右侧保持原层位的完整断块", color, [[-leftLow, low], [30, low], [30, high], [-leftHigh, high]], 45));
    // 中央断块原层序整体下降六米；仅截取共同露头底面以上的部分，不把侧块悬空。
    if (layer < 2) continue;
    const centerLow = low - 6, centerHigh = high - 6;
    const halfLow = 8 + centerLow * 2 / 9, halfHigh = 8 + centerHigh * 2 / 9;
    parts.push(prism("由两条向内倾断面共同夹持的下降中央岩层", color, [[-halfLow, centerLow], [halfLow, centerLow], [halfHigh, centerHigh], [-halfHigh, centerHigh]], 45));
  }
  return parts;
}

// https://glossary.slb.com/terms/s/stylolite
// https://www.usgs.gov/news/earthword-graben
// https://home.nps.gov/articles/cany-grabens.htm
export const geologicStructureExpansionBatchThreeDesigns: MasterNatureDesign[] = [
  design("interlockingStyloliteOutcrop", "缝合线岩壁", "岩石", interlockingStylolite, ["Stylolite", "压力溶蚀齿状咬合界面", "连续残渣薄缝", "大型接触露头段"]),
  design("faultBoundedGrabenValley", "地堑谷岩块", "岩石", grabenValley, ["Graben", "双侧向内倾断面", "中央完整断块下降", "大型构造露头段"]),
];
