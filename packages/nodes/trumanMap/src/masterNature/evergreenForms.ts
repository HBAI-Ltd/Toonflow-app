import { Quaternion, Vector3 } from "three";
import { combineMeshes, design, leaf, lobe, needle, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { branchCrown } from "./woodyForms";

const green = "#819772";
const pale = "#b4c1a0";
const wood = "#a49f87";

function yewAril(root: Triple): ModelPart[] {
  const p = sweptProfile("红豆杉杯状假种皮的真实开放上口", "#b6a28d", [[0.0035, 0], [0.0056, 0.0021], [0.0063, 0.0063], [0.0049, 0.0105], [0.0035, 0.0105], [0.0042, 0.0063], [0.0035, 0.0028], [0.0021, 0]], Math.PI * 2, 12); p.position = { x: root[0], y: root[1], z: root[2] };
  return [p, lobe("红豆杉从假种皮口露出的单枚种子", "#6f806c", [root[0], root[1] + 0.0049, root[2]], [0.008, 0.014, 0.008])];
}

function needleTwig(root: Triple, end: Triple, spiral: boolean): ModelPart[] {
  const parts: ModelPart[] = [tapered("常绿树真正相连的细木质枝", wood, [root, end], [0.005, 0.0016])], foliage: ModelPart[] = [], d: Triple = [end[0] - root[0], end[1] - root[1], end[2] - root[2]], h = Math.hypot(d[0], d[2]);
  const across: Triple = [-d[2] / h, 0, d[0] / h], q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...d).normalize());
  if (spiral) {
    for (let i = 0; i < 10; i++) { const t = (i + 1) / 12, a = i * 2.4, origin: Triple = [root[0] + d[0] * t, root[1] + d[1] * t, root[2] + d[2] * t], offset = new Vector3(Math.cos(a) * 0.1, 0.022, Math.sin(a) * 0.1).applyQuaternion(q); foliage.push(flatLeaf("罗汉松螺旋排列而中脉明显的长线状叶", origin, [origin[0] + offset.x, origin[1] + offset.y, origin[2] + offset.z], 0.012, "oval")); }
  } else {
    for (let i = 0; i < 14; i++) for (const side of [-1, 1]) { const t = (i + 1) / 16, origin: Triple = [root[0] + d[0] * t, root[1] + d[1] * t, root[2] + d[2] * t]; foliage.push(flatLeaf("红豆杉在枝两侧近同一平面展开的扁针叶", origin, [origin[0] + across[0] * side * 0.028, origin[1] + 0.004, origin[2] + across[2] * side * 0.028], 0.0037, "oval")); }
  }
  parts.push(combineMeshes(spiral ? "罗汉松完整螺旋长叶枝" : "红豆杉完整二列扁针叶枝", green, foliage)); return parts;
}

function conifer(kind: number): ModelPart[] {
  const parts: ModelPart[] = [], height = kind ? 3.2 : 2.6, tips: Triple[] = [[-height * 0.28, height * 0.68, 0.1], [height * 0.3, height * 0.78, 0], [0.05, height * 0.88, -height * 0.22], [0.1, height * 1.04, height * 0.13]];
  branchCrown(parts, height, tips);
  for (let branch = 0; branch < tips.length; branch++) { const p = tips[branch]!;
    for (let i = 0; i < 3; i++) { const a = branch * 2.4 + i * 1.1, end: Triple = [p[0] + Math.cos(a) * 0.28, p[1] + 0.035 + i * 0.025, p[2] + Math.sin(a) * 0.28]; parts.push(...needleTwig(p, end, kind === 1)); }
    const fruit: Triple = [p[0] + 0.025, p[1] - 0.026, p[2] + 0.015]; parts.push(tapered("由结果枝伸出的短种托柄", green, [p, fruit], [0.002, 0.001]));
    if (kind === 0) parts.push(...yewAril(fruit));
    else parts.push(lobe("罗汉松种子下面膨大的肉质种托", "#b2a58d", [fruit[0], fruit[1] + 0.001, fruit[2]], [0.012, 0.019, 0.012]), lobe("罗汉松位于种托顶端的独立裸种", pale, [fruit[0], fruit[1] + 0.012, fruit[2]], [0.012, 0.013, 0.012]));
  }
  return parts;
}

function casuarina(): ModelPart[] {
  const parts: ModelPart[] = [], tips: Triple[] = [[-1.1, 3.6, 0], [0.95, 4.1, 0.3], [0.1, 4.6, -0.8], [0.2, 5.2, 0.6]], nodes: ModelPart[] = [], teeth: ModelPart[] = [], connections: ModelPart[] = [];
  branchCrown(parts, 4.7, tips);
  for (let axis = 0; axis < tips.length; axis++) { const root = tips[axis]!;
    for (let i = 0; i < 5; i++) { const a = axis * 2.4 + i * 0.9, start: Triple = [root[0] + Math.cos(a) * 0.12, root[1] + i * 0.012, root[2] + Math.sin(a) * 0.12], path: Triple[] = Array.from({ length: 13 }, (_, row) => { const t = row / 12; return [start[0] + Math.cos(a) * Math.sin(t * Math.PI * 0.8) * 0.2, start[1] - t * (0.6 + i % 2 * 0.12), start[2] + Math.sin(a) * Math.sin(t * Math.PI * 0.8) * 0.2]; }); connections.push(needle("主枝到每条下垂光合枝的短分枝", wood, root, start, 0.006)); parts.push(tapered("木麻黄代替叶片进行光合的细分节绿枝", green, path, path.map((_, row) => 0.0017 - row * 0.00008)));
      for (let row = 2; row < 12; row += 2) { const p = path[row]!; nodes.push(lobe("木麻黄节上轻微膨起的合生叶鞘", pale, p, [0.004, 0.0015, 0.004])); if (row === 4 || row === 8) for (let j = 0; j < 6; j++) { const angle = j * Math.PI / 3; teeth.push(needle("枝节鞘缘一轮微小的鳞叶齿", pale, [p[0] + Math.cos(angle) * 0.0012, p[1], p[2] + Math.sin(angle) * 0.0012], [p[0] + Math.cos(angle) * 0.002, p[1] + 0.0018, p[2] + Math.sin(angle) * 0.002], 0.0004)); } }
    }
    const cone: Triple = [root[0] - 0.04, root[1] - 0.025, root[2]]; parts.push(tapered("木麻黄木质小果序的短柄", wood, [root, cone], [0.003, 0.0015]), lobe("木麻黄小型近卵形木质果序", wood, cone, [0.023, 0.028, 0.023])); const valves: ModelPart[] = []; for (let i = 0; i < 18; i++) { const a = i * 2.4, y = -0.8 + i / 17 * 1.6, r = Math.sqrt(1 - y * y) * 0.0075; valves.push(leaf("果序上分离而张口的木质苞鳞", pale, [cone[0] + Math.cos(a) * r, cone[1] + y * 0.008, cone[2] + Math.sin(a) * r], 0.0035, 0.0065, [55, 90 - a * 180 / Math.PI, 0])); } parts.push(combineMeshes("木麻黄整枚木质果序的开口苞鳞", pale, valves));
  }
  parts.push(combineMeshes("全部与主枝真实连接的短分枝", wood, connections)); for (let i = 0; i < nodes.length; i += 36) parts.push(combineMeshes("木麻黄一整组分节绿枝上的叶鞘", pale, nodes.slice(i, i + 36))); for (let i = 0; i < teeth.length; i += 60) parts.push(combineMeshes("木麻黄若干枝节上完整的鳞叶轮", pale, teeth.slice(i, i + 60)));
  return parts;
}

export const evergreenFormDesigns: MasterNatureDesign[] = [
  design("taxus", "红豆杉", "植物", () => conifer(0), ["Taxus baccata", "二列扁针叶与开放假种皮"]),
  design("podocarpus", "罗汉松", "植物", () => conifer(1), ["Podocarpus macrophyllus", "螺旋长叶与两段种托"]),
  design("casuarina", "木麻黄", "植物", casuarina, ["Casuarina equisetifolia", "分节光合枝与鳞叶鞘"]),
];
