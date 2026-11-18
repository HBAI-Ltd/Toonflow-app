import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { cap, combineMeshes, design, leaf, lobe, needle, part, petals, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";

const green = "#8d9f79";
const pale = "#c1c8a7";
const cream = "#d4cfb5";
const bloom = "#c5b4b1";

export function smallCorolla(root: Triple, direction: Triple, length: number, radius: number, color: string, lips: boolean | "bearded" = false, lobes = 5, radialSegments = 16): ModelPart {
  const pieces: ModelPart[] = [sweptProfile("小型花冠实际贯通的合瓣花管", color, [[radius * 0.38, 0], [radius * 0.6, length * 0.68], [radius, length], [radius * 0.83, length], [radius * 0.45, length * 0.68], [radius * 0.25, 0]], Math.PI * 2, radialSegments)];
  const angles = lips === "bearded" ? [25, 70, 110, 155, 270] : lips ? [60, 120, 200, 270, 340] : Array.from({ length: lobes }, (_, i) => i * 360 / lobes);
  for (const angle of angles) {
    const a = angle * Math.PI / 180, size = lips === "bearded" ? angle === 270 ? 1.4 : 0.7 : lips && angle < 180 ? 0.7 : 1;
    const rotation = new Euler(65 * Math.PI / 180, Math.PI / 2 - a, 0, "YXZ").reorder("XYZ");
    pieces.push(leaf("与花管连成整体的花冠裂片", color, [Math.cos(a) * radius * 0.8, length * 0.94, Math.sin(a) * radius * 0.8], radius * 1.1 * size, radius * 1.7 * size, [rotation.x, rotation.y, rotation.z].map(value => value * 180 / Math.PI) as Triple));
  }
  const p = combineMeshes("一朵有花管与真实裂片的小型合瓣花", color, pieces), axis = new Vector3(...direction).normalize(), q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), axis);
  if (lips === "bearded") { const up = new Vector3(0, 1, 0).addScaledVector(axis, -axis.y).normalize(); if (up.lengthSq() > 0.1) q.setFromRotationMatrix(new Matrix4().makeBasis(new Vector3().crossVectors(axis, up), axis, up)); }
  const e = new Euler().setFromQuaternion(q); p.position = { x: root[0], y: root[1], z: root[2] }; p.rotation = { x: e.x * 180 / Math.PI, y: e.y * 180 / Math.PI, z: e.z * 180 / Math.PI }; return p;
}

function daisy(): ModelPart[] {
  const parts: ModelPart[] = [], leaves: ModelPart[] = [];
  for (let i = 0; i < 9; i++) { const a = i * 2.4; leaves.push(flatLeaf("雏菊贴近地面的匙状基生叶", [0, 0.003, 0], [Math.cos(a) * 0.065, 0.013 + i % 3 * 0.004, Math.sin(a) * 0.065], 0.021, "oval")); } parts.push(combineMeshes("雏菊无直立茎叶的基生叶莲座", green, leaves));
  for (let i = 0; i < 4; i++) { const a = i * 2.4, root: Triple = [Math.cos(a) * 0.025, 0.11 + i % 3 * 0.025, Math.sin(a) * 0.025]; parts.push(tapered("雏菊从基部单独抽出的无叶花葶", green, [[0, 0.003, 0], root], [0.0018, 0.001]), petals(18, root, 0.0038, 0.017, 88, cream), cap("头状花序中央隆起的管状花盘", pale, [root[0], root[1] + 0.001, root[2]], 0.007, 0.0055, 0)); const florets: ModelPart[] = []; for (let j = 0; j < 14; j++) { const b = j * 2.4, r = Math.sqrt(j / 14) * 0.006; florets.push(lobe("花盘上独立的小管状花", "#c4bd99", [root[0] + Math.cos(b) * r, root[1] + 0.005, root[2] + Math.sin(b) * r], [0.0018, 0.0015, 0.0018])); } parts.push(combineMeshes("雏菊中央真正凸起的小花盘面", "#c4bd99", florets)); }
  return parts;
}

function poppy(): ModelPart[] {
  const parts: ModelPart[] = [tapered("虞美人细而有毛的直立分枝茎", green, [[0, 0, 0], [0, 0.38, 0], [0.015, 0.69, 0]], [0.005, 0.0035, 0.0018])];
  const stem = parts[0]!, hairs: ModelPart[] = [];
  for (let i = 8; i < 24; i++) { const p = stem.vertices![i]!, centre: Triple = i < 16 ? [0, 0.38, 0] : [0.015, 0.69, 0], d = new Vector3(p.x - centre[0], p.y - centre[1], p.z - centre[2]).normalize().multiplyScalar(0.0013); hairs.push(needle("从真实茎表面伸出的稀短硬毛", pale, [p.x, p.y, p.z], [p.x + d.x, p.y + d.y, p.z + d.z], 0.00022)); } parts.push(combineMeshes("虞美人实际相连的毫米级茎毛", pale, hairs));
  for (let i = 0; i < 6; i++) { const y = 0.04 + i * 0.075, a = i * 2.4, x = y <= 0.38 ? 0 : 0.015 * (y - 0.38) / 0.31; parts.push(flatLeaf("虞美人有明显深羽裂的互生叶", [x, y, 0], [x + Math.cos(a) * 0.17, y + 0.045, Math.sin(a) * 0.17], 0.078, "lobed")); }
  const root: Triple = [0.015, 0.69, 0], petalsAndRidges: ModelPart[] = [];
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; petalsAndRidges.push(leaf("虞美人四片宽大而薄的杯状花瓣", bloom, [root[0] + Math.cos(a) * 0.006, root[1], Math.sin(a) * 0.006], 0.058, 0.063, [43, 90 - i * 90, 0])); } parts.push(combineMeshes("虞美人四瓣合成而非重瓣花的花杯", bloom, petalsAndRidges), lobe("花杯中央独立的子房", pale, [root[0], root[1] + 0.012, 0], [0.019, 0.025, 0.019]), cap("子房顶端扁平的辐射柱头盘", pale, [root[0], root[1] + 0.021, 0], 0.011, 0.002, 2));
  const stamens: ModelPart[] = []; for (let i = 0; i < 24; i++) { const a = i * 2.4, p: Triple = [root[0] + Math.cos(a) * 0.014, root[1] + 0.018 + i % 3 * 0.003, Math.sin(a) * 0.014]; stamens.push(needle("子房周围一圈分离的细雄蕊", pale, [root[0] + Math.cos(a) * 0.01, root[1], Math.sin(a) * 0.01], p, 0.001), lobe("雄蕊末端的短花药", "#9a9d8a", p, [0.003, 0.004, 0.003])); } for (let i = 0; i < stamens.length; i += 24) parts.push(combineMeshes("花杯内完整的雄蕊花药环", "#9a9d8a", stamens.slice(i, i + 24)));
  const bud: Triple = [-0.07, 0.5, 0.025]; parts.push(tapered("虞美人开花前自然弯垂的花梗分枝", green, [[0, 0.3, 0], [-0.07, 0.59, 0.025], bud], [0.0025, 0.002, 0.0015])); for (const side of [-1, 1]) parts.push(leaf("花蕾外部仍未脱落的两片覆毛萼片", pale, [bud[0] + side * 0.004, bud[1], bud[2]], 0.022, 0.032, [165, side * 90, 0]));
  return parts;
}

function lambsEar(): ModelPart[] {
  const parts: ModelPart[] = [part("绵毛水苏有真实四角截面的方形秆", "box", pale, [0, 0.24, 0], [0.007, 0.48, 0.007])], foliage: ModelPart[] = [], hairs: ModelPart[] = [];
  for (let node = 0; node < 6; node++) for (const side of [-1, 1]) { const a = (node % 2 ? Math.PI / 2 : 0) + (side < 0 ? Math.PI : 0), y = 0.014 + node * 0.055, root: Triple = [0, y, 0], end: Triple = [Math.cos(a) * (0.13 - node * 0.012), y + 0.02, Math.sin(a) * (0.13 - node * 0.012)], width = 0.055 - node * 0.004; const p = flatLeaf("绵毛水苏厚而宽的对生绒叶", root, end, width, "oval"); foliage.push(p);
    const dx = end[0] - root[0], dy = end[1] - root[1], dz = end[2] - root[2], length = Math.hypot(dx, dy, dz), horizontal = Math.hypot(dx, dz), up: Triple = [-dy * dx / (length * horizontal), horizontal / length, -dy * dz / (length * horizontal)];
    for (let i = p.vertices!.length / 2; i < p.vertices!.length; i += 2) { const v = p.vertices![i]!, start: Triple = [root[0] + v.x, root[1] + v.y, root[2] + v.z]; hairs.push(needle("真正由叶面长出的毫米级柔短毛", cream, start, [start[0] + up[0] * 0.0012, start[1] + up[1] * 0.0012, start[2] + up[2] * 0.0012], 0.00022)); }
  }
  parts.push(combineMeshes("基部到花轴连续交互对生的绒叶", pale, foliage), combineMeshes("绵毛水苏叶面细短而非粗刺的绒毛", cream, hairs));
  for (let tier = 0; tier < 3; tier++) for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + tier * 0.3, root: Triple = [Math.cos(a) * 0.003, 0.34 + tier * 0.046, Math.sin(a) * 0.003]; parts.push(smallCorolla(root, [Math.cos(a), 0.3, Math.sin(a)], 0.015, 0.0045, bloom, true)); }
  return parts;
}

export const gardenPerennialDesigns: MasterNatureDesign[] = [
  design("bellis", "雏菊", "植物", daisy, ["Bellis perennis", "无叶花葶与基生莲座"]),
  design("papaver", "虞美人", "植物", poppy, ["Papaver rhoeas", "独立四瓣与盘状柱头"]),
  design("stachys", "绵毛水苏", "植物", lambsEar, ["Stachys byzantina", "对生绒叶与轮伞花序"]),
];
