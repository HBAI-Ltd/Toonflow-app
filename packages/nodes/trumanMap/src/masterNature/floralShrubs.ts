import { cap, combineMeshes, design, leaf, lobe, needle, petals, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { compoundLeaf, flatLeaf } from "./ediblePlants";
import { branchCrown, crownLeaves } from "./woodyForms";
import { smallCorolla } from "./gardenPerennials";

const green = "#8b9d78";
const pale = "#c0c5a3";
const bark = "#a3a18b";
const white = "#d1cfb9";
const bloom = "#c0afb5";

function urnFlower(root: Triple, radius: number): ModelPart {
  const shell = sweptProfile("下垂花朵鼓腹而口缘收窄的真正花腔", white, [[radius * 0.5, 0], [radius, radius], [radius * 0.85, radius * 2], [radius * 0.42, radius * 2.5], [radius * 0.3, radius * 2.5], [radius * 0.7, radius * 2], [radius * 0.82, radius], [radius * 0.34, 0]], Math.PI * 2, 12); const p = combineMeshes("钟形花的封闭基部与开放花腔", white, [shell, lobe("与花梗相接的短小子房基部", white, [0, 0, 0], [radius * 1.25, radius * 0.8, radius * 1.25])]); p.position = { x: root[0], y: root[1], z: root[2] }; p.rotation.x = 180; return p;
}

function berry(root: Triple): ModelPart[] {
  const bumps: ModelPart[] = [];
  for (let i = 0; i < 26; i++) { const a = i * 2.4, y = -0.9 + i / 25 * 1.8, r = Math.sqrt(1 - y * y) * 0.011; bumps.push(lobe("草莓树果表面实际凸出的疣粒", "#b5a28e", [root[0] + Math.cos(a) * r, root[1] + y * 0.011, root[2] + Math.sin(a) * r], [0.0025, 0.0025, 0.0025])); }
  return [lobe("草莓树单枚近球形浆果", "#b5a28e", root, [0.028, 0.028, 0.028]), combineMeshes("每枚浆果完整而相连的疣状表面", "#b5a28e", bumps)];
}

function shrub(kind: number): ModelPart[] {
  const parts: ModelPart[] = [], height = [0.8, 0.55, 1.1, 1.25, 1.4, 1.3, 1.5, 2.4][kind]!, tips: Triple[] = [[-height * 0.28, height * 0.86, height * 0.1], [height * 0.3, height * 0.95, height * 0.08], [height * 0.04, height * 1.08, -height * 0.23]];
  if (kind === 5) for (const end of tips) parts.push(tapered("珍珠梅由地表分别抽出的木质基生枝", bark, [[end[0] * 0.08, 0, end[2] * 0.08], [end[0] * 0.5, end[1] * 0.5, end[2] * 0.5], end], [0.018, 0.013, 0.004]));
  else branchCrown(parts, height, tips);
  for (let axis = 0; axis < tips.length; axis++) {
    const root = tips[axis]!;
    if (kind === 0) {
      parts.push(crownLeaves(root, 0.095, "oval", 0.043)); const path: Triple[] = [root, [root[0] + 0.03, root[1] + 0.04, root[2] + 0.04], [root[0] + 0.07, root[1] - 0.045, root[2] + 0.12]]; parts.push(tapered("虾衣花顶端自然弯垂的花穗轴", green, path, [0.003, 0.0025, 0.001]));
      const bracts: ModelPart[] = []; for (let i = 0; i < 10; i++) { const t = i / 10, p: Triple = [path[1]![0] + (path[2]![0] - path[1]![0]) * t, path[1]![1] + (path[2]![1] - path[1]![1]) * t, path[1]![2] + (path[2]![2] - path[1]![2]) * t]; bracts.push(leaf("虾衣花交错相叠的弯曲虾壳状苞", bloom, p, 0.025 - t * 0.008, 0.033 - t * 0.012, [118, i % 2 ? 55 : -55, 0])); } parts.push(combineMeshes("虾衣花真实分节的弯叠苞片穗", bloom, bracts), smallCorolla(path[2]!, [0.4, -0.4, 1], 0.024, 0.004, white, true));
    } else if (kind === 1) {
      const leaves: ModelPart[] = []; for (let i = 0; i < 5; i++) { const a = i * 2.4; leaves.push(flatLeaf("虎刺梅集中在枝端的倒卵形肉质叶", root, [root[0] + Math.cos(a) * 0.075, root[1] + 0.025, root[2] + Math.sin(a) * 0.075], 0.04, "oval")); } parts.push(combineMeshes("虎刺梅枝端真实叶簇", green, leaves));
      const thorns: ModelPart[] = []; const start: Triple = [0, height * (0.45 + axis * 0.055), 0], mid: Triple = [root[0] * 0.58, root[1] - 0.24, root[2] * 0.58]; for (let i = 0; i < 8; i++) { const t = (i + 1) / 9, p: Triple = [start[0] + (mid[0] - start[0]) * t, start[1] + (mid[1] - start[1]) * t, start[2] + (mid[2] - start[2]) * t]; for (const side of [-1, 1]) thorns.push(needle("木质茎节处成对长出的托叶刺", bark, p, [p[0] + side * 0.023, p[1] + 0.015, p[2] + side * 0.008], 0.004)); } parts.push(combineMeshes("虎刺梅与木质枝相连的成对硬刺", bark, thorns));
      const flower: Triple = [root[0], root[1] + 0.055, root[2]]; parts.push(tapered("虎刺梅枝端叉状花柄", green, [root, flower], [0.002, 0.001]), cap("两片大苞片中央真正的小杯状花序", pale, flower, 0.0025, 0.004, 3)); for (const side of [-1, 1]) parts.push(lobe("虎刺梅每个花序只有一对的圆形大苞片", bloom, [flower[0] + side * 0.006, flower[1] + 0.001, flower[2]], [0.017, 0.003, 0.015]));
    } else if (kind === 2) {
      parts.push(crownLeaves(root, 0.09, "oval", 0.035));
      for (let i = 0; i < 3; i++) { const a = i * 2.4, flower: Triple = [root[0] + Math.cos(a) * 0.025, root[1] + 0.025, root[2] + Math.sin(a) * 0.025]; parts.push(tapered("鸳鸯茉莉叶腋单花短柄", green, [root, flower], [0.0018, 0.001]), smallCorolla(flower, [Math.cos(a), 0.35, Math.sin(a)], 0.017, 0.01, bloom)); }
    } else if (kind === 3) {
      const leaves: ModelPart[] = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; leaves.push(flatLeaf("栀子枝端成对或三轮生的厚革质叶", root, [root[0] + Math.cos(a) * 0.12, root[1] + 0.035, root[2] + Math.sin(a) * 0.12], 0.045, "oval")); } parts.push(combineMeshes("栀子的有光泽厚叶簇", green, leaves)); const flower: Triple = [root[0], root[1] + 0.055, root[2]]; parts.push(tapered("栀子单朵顶生花的短花梗", green, [root, flower], [0.003, 0.002]), cap("栀子六裂花冠下方的短真实花管", white, flower, 0.009, 0.014, 3), petals(6, [flower[0], flower[1] + 0.012, flower[2]], 0.024, 0.038, 72, white));
      const calyx: ModelPart[] = []; for (let i = 0; i < 6; i++) calyx.push(leaf("栀子花下部六片长条萼裂片", green, flower, 0.004, 0.022, [65, i * 60, 0])); parts.push(combineMeshes("真实包住花管的栀子花萼", green, calyx));
    } else if (kind === 4) {
      parts.push(crownLeaves(root, 0.07, "oval", 0.028)); const end: Triple = [root[0] + 0.035, root[1] - 0.27, root[2] + 0.02]; parts.push(tapered("金露花从枝端连续垂下的总状花序轴", green, [root, end], [0.0025, 0.001]));
      for (let i = 0; i < 6; i++) { const t = (i + 1) / 7, side = i % 2 ? -1 : 1, p: Triple = [root[0] + (end[0] - root[0]) * t, root[1] + (end[1] - root[1]) * t, root[2] + (end[2] - root[2]) * t], flower: Triple = [p[0] + side * 0.011, p[1], p[2] + 0.005]; parts.push(tapered("垂穗上每朵金露花独立的短花柄", green, [p, flower], [0.0011, 0.0007]), smallCorolla(flower, [side, 0.1, 0.4], 0.011, 0.0038, bloom)); }
      const fruits: ModelPart[] = []; for (let i = 0; i < 6; i++) { const y = root[1] - 0.02 - i * 0.025, t = (root[1] - y) / 0.18, origin: Triple = [root[0] - 0.03 * t, y, root[2] + 0.02 * t], p: Triple = [origin[0] + (i % 2 ? 0.008 : -0.008), y - 0.004, origin[2] + 0.005]; fruits.push(needle("果实仍与花果轴相连的短果梗", green, origin, p, 0.001), lobe("金露花同轴垂生的独立小浆果", pale, p, [0.011, 0.011, 0.011])); } parts.push(tapered("金露花旁侧完整的果序轴", green, [root, [root[0] - 0.03, root[1] - 0.18, root[2] + 0.02]], [0.002, 0.001]), combineMeshes("一整穗实际连接的金露花果实", pale, fruits));
    } else if (kind === 5) {
      for (let node = 0; node < 3; node++) { const t = 0.35 + node * 0.2, p: Triple = [root[0] * t, root[1] * t, root[2] * t]; parts.push(compoundLeaf(p, axis * 120 + node * 67, 0.28, 6)); }
      const tip: Triple = [root[0], root[1] + 0.22, root[2]]; parts.push(tapered("珍珠梅顶生圆锥花序的主轴", green, [root, tip], [0.004, 0.001])); const flowers: ModelPart[] = [];
      for (let i = 0; i < 24; i++) { const t = (i + 1) / 25, a = i * 2.4, r = (1 - t) * 0.1, p: Triple = [root[0] + Math.cos(a) * r, root[1] + 0.22 * t, root[2] + Math.sin(a) * r]; flowers.push(needle("圆锥花序的独立分枝花柄", green, [root[0], p[1], root[2]], p, 0.0016), lobe("珍珠梅由大量雄蕊构成的绒球状小花", white, p, [0.01, 0.01, 0.01])); } for (let i = 0; i < flowers.length; i += 24) parts.push(combineMeshes("珍珠梅花序上一整层真实小花", white, flowers.slice(i, i + 24)));
    } else {
      parts.push(crownLeaves(root, kind === 6 ? 0.12 : 0.095, "oval", kind === 6 ? 0.034 : 0.04));
      for (let raceme = 0; raceme < 2; raceme++) { const end: Triple = [root[0] + (raceme ? -0.025 : 0.025), root[1] - 0.18, root[2] + raceme * 0.025]; parts.push(tapered(kind === 6 ? "马醉木从枝顶垂下的细长花序轴" : "草莓树下垂的总状花序轴", green, [root, end], [0.002, 0.0009])); for (let i = 0; i < (kind === 6 ? 6 : 5); i++) { const t = (i + 1) / (kind === 6 ? 7 : 6), p: Triple = [root[0] + (end[0] - root[0]) * t, root[1] - 0.18 * t, root[2] + (end[2] - root[2]) * t]; parts.push(urnFlower(p, kind === 6 ? 0.0037 : 0.0045)); } }
      if (kind === 7) for (let i = 0; i < 2; i++) { const p: Triple = [root[0] + (i ? -0.035 : 0.035), root[1] - 0.06, root[2] - 0.025]; parts.push(tapered("草莓树成熟果实独立的悬垂果梗", green, [root, p], [0.002, 0.001]), ...berry(p)); }
    }
  }
  return parts;
}

const entries = [["justicia", "虾衣花", "Justicia brandegeeana"], ["crownOfThorns", "虎刺梅", "Euphorbia milii"], ["brunfelsia", "鸳鸯茉莉", "Brunfelsia pauciflora"], ["gardenia", "栀子", "Gardenia jasminoides"], ["duranta", "金露花", "Duranta erecta"], ["sorbaria", "珍珠梅", "Sorbaria sorbifolia"], ["pieris", "马醉木", "Pieris japonica"], ["arbutus", "草莓树", "Arbutus unedo"]];

export const floralShrubDesigns: MasterNatureDesign[] = entries.map(([key, name, taxon], i) => design(key!, name!, "植物", () => shrub(i), [taxon!, "具名灌木花序与叶序"]));
