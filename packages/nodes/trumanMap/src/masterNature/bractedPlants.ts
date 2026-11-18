import { combineMeshes, design, leaf, lobe, petals, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";

const green = "#8ba078";
const pale = "#bcc4a3";
const bract = "#c7b5b6";
const white = "#d5d2bd";

function bromeliad(kind: number): ModelPart[] {
  const parts: ModelPart[] = [], foliage: ModelPart[] = [];
  for (let i = 0; i < 13; i++) { const a = i * 137.5; foliage.push(leaf("基部相互叠压围成筒的带状凤梨叶", green, [0, 0.002 + i % 3 * 0.008, 0], kind ? 0.046 : 0.075, kind ? 0.39 : 0.45, [50 + i % 3 * 9, -a, 0])); }
  parts.push(combineMeshes("凤梨完整的基生叶筒", green, foliage), tapered("从叶筒中心连续伸出的花序柄", pale, [[0, 0, 0], [0, kind ? 0.55 : 0.48, 0]], [0.012, 0.005]));
  if (kind === 0) {
    for (let tier = 0; tier < 3; tier++) { const pieces: ModelPart[] = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + tier * 0.45, r = 0.015 - tier * 0.003; pieces.push(leaf("光萼荷圆锥花序周围坚挺的尖苞片", bract, [Math.cos(a) * r, 0.38 + tier * 0.04, Math.sin(a) * r], 0.032 - tier * 0.004, 0.11 - tier * 0.018, [38, 90 - a * 180 / Math.PI, 0])); } parts.push(combineMeshes("花序一层真实相叠的尖苞片", bract, pieces)); }
    for (let i = 0; i < 5; i++) { const a = i * 2.4, root: Triple = [Math.cos(a) * 0.024, 0.405 + i % 3 * 0.035, Math.sin(a) * 0.024]; parts.push(tapered("苞片之间露出的短蓝紫色花管", "#a9b2bd", [root, [root[0], root[1] + 0.022, root[2]]], [0.003, 0.002]), petals(3, [root[0], root[1] + 0.019, root[2]], 0.005, 0.009, 70, "#b2bac8")); }
  } else {
    const bracts: ModelPart[] = [];
    for (let i = 0; i < 18; i++) { const side = i % 2 ? -1 : 1, y = 0.27 + i * 0.016, length = 0.076 - i * 0.0025; bracts.push(leaf("莺歌凤梨同一平面上两列相叠的舟状苞", bract, [0, y, 0], 0.033, length, [0, 0, -side * 32])); } parts.push(combineMeshes("明显侧扁且两列交错的剑状花穗", bract, bracts));
    for (let i = 0; i < 4; i++) { const side = i % 2 ? -1 : 1, y = 0.34 + i * 0.05, root: Triple = [side * 0.025, y, 0]; parts.push(tapered("从扁花穗侧缘真正伸出的单花管", white, [[0, y - 0.014, 0], root, [side * 0.041, y + 0.01, 0]], [0.003, 0.0025, 0.0015]), petals(3, [side * 0.04, y + 0.01, 0], 0.004, 0.008, 70, white)); }
  }
  return parts;
}

function peaceLily(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 9; i++) { const a = i * 2.4, joint: Triple = [Math.cos(a) * 0.045, 0.22 + i % 3 * 0.035, Math.sin(a) * 0.045], end: Triple = [Math.cos(a) * 0.23, 0.36 + i % 3 * 0.04, Math.sin(a) * 0.23]; parts.push(tapered("白掌从地表到叶基连续的长叶柄", green, [[0, 0, 0], joint], [0.0045, 0.003]), flatLeaf("白掌全缘而中部宽的披针形叶", joint, end, 0.09, "oval")); }
  for (const side of [-1, 1]) { const root: Triple = [side * 0.035, 0.43 + (side > 0 ? 0.07 : 0), 0.015]; parts.push(tapered("白掌与叶丛相连的直立花葶", pale, [[0, 0, 0], root], [0.005, 0.003]));
    const spathe = sweptProfile("白掌单侧卷拢且留有真实开口的佛焰苞", white, [[0.014, 0], [0.038, 0.038], [0.029, 0.115], [0.009, 0.15], [0.008, 0.146], [0.027, 0.113], [0.036, 0.038], [0.012, 0]], Math.PI * 1.24, 20); spathe.position = { x: root[0], y: root[1], z: root[2] }; spathe.rotation.y = -90; parts.push(spathe, tapered("佛焰苞前独立的直立肉穗花序轴", pale, [[root[0], root[1] + 0.012, root[2] + 0.016], [root[0], root[1] + 0.085, root[2] + 0.015]], [0.008, 0.005]));
    const florets: ModelPart[] = []; for (let i = 0; i < 28; i++) { const a = i * 2.4, y = root[1] + 0.018 + i % 7 * 0.01; florets.push(lobe("肉穗轴表面实际凸起的小花", white, [root[0] + Math.cos(a) * 0.006, y, root[2] + 0.016 + Math.sin(a) * 0.006], [0.004, 0.004, 0.004])); } parts.push(combineMeshes("白掌肉穗表面完整的小花层", white, florets));
  }
  return parts;
}

export const bractedPlantDesigns: MasterNatureDesign[] = [
  design("aechmea", "粉苞凤梨", "植物", () => bromeliad(0), ["Aechmea fasciata", "美叶光萼荷", "立体尖苞花序"]),
  design("vriesea", "莺歌凤梨", "植物", () => bromeliad(1), ["Lutheria splendens", "Vriesea splendens", "两列扁平花穗"]),
  design("peaceLily", "白掌", "植物", peaceLily, ["Spathiphyllum wallisii", "单侧佛焰苞与独立肉穗"]),
];
