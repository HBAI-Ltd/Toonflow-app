import { part, pitchedRoof, type ModelPart } from "./assetModelParts";

export type ArchitectureNode = { x: number; z: number; floors: number; width: number; depth: number };
export type ArchitecturePlan = { nodes: ArchitectureNode[]; edges: [number, number][]; program: number; layout: number; massing: number };

export const architectureLayoutNames = ["线性六翼", "折角院街", "横街支院", "开口围院", "双翼横联", "六角环院", "折线阶街", "双院联组", "放射内庭", "错列环街"];
const layouts: [number, number][][] = [
  [[-15, 0], [-9, 0], [-3, 0], [3, 0], [9, 0], [15, 0]],
  [[-9, -6], [-3, -6], [3, -6], [3, 0], [3, 6], [3, 12]],
  [[-12, -6], [-6, -6], [0, -6], [6, -6], [0, 0], [0, 6]],
  [[-9, -6], [-9, 0], [-9, 6], [0, 6], [9, 6], [9, 0]],
  [[-9, -6], [-9, 0], [-9, 6], [0, 0], [9, 0], [9, 6]],
  [[0, -9], [8, -5], [8, 5], [0, 9], [-8, 5], [-8, -5]],
  [[-12, -6], [-6, -6], [0, 0], [6, 0], [6, 6], [12, 6]],
  [[-9, -6], [-9, 6], [-3, 0], [3, 0], [9, -6], [9, 6]],
  [[0, 0], [-12, 6], [-6, 12], [0, 14], [6, 12], [12, 6]],
  [[-9, -8], [-1, -8], [8, -3], [8, 6], [0, 9], [-9, 3]],
];
const connections: [number, number][][] = [
  [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]],
  [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], [[0, 2], [1, 2], [2, 3], [3, 4], [3, 5]],
  [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]],
];

export function createArchitecturePlan(program: number, layout: number, massing: number, spacing = 1): ArchitecturePlan {
  const nodes = layouts[layout]!.map(([x, z], index) => ({
    x: x * spacing, z: z * spacing,
    floors: 1 + (massing + index * 2) % 4 + (index === 0 ? Math.floor(massing / 4) : 0),
    width: 3.5 + program % 3 * 0.55 + (index === 0 ? 0.8 : 0),
    depth: 4.2 + Math.floor(program / 3) * 0.5 + (index % 3 === 0 ? 0.5 : 0),
  }));
  return { nodes, edges: connections[layout]!.map(([a, b]) => [a, b]), program, layout, massing };
}

export function architectureBox(name: string, color: string, x: number, y: number, z: number, width: number, height: number, depth: number): ModelPart {
  return part(name, "box", color, [x, y, z], [width, height, depth]);
}

export function architectureRound(name: string, color: string, x: number, y: number, z: number, diameter: number, height: number): ModelPart {
  return part(name, "cylinder", color, [x, y, z], [diameter, height, diameter]);
}

export function architectureBlock(node: ArchitectureNode, index: number, roof: "flat" | "gable" | "dome" | "terrace", color = "#b5b2a3", floorHeight = 2.9): ModelPart[] {
  const { x, z, width, depth, floors } = node;
  const height = floors * floorHeight;
  const parts = [architectureBox(`楼翼${index}主体`, color, x, height / 2, z, width, height, depth)];
  for (let floor = 1; floor < floors; floor++) parts.push(architectureBox("可见楼层檐带", "#858d87", x, floor * floorHeight, z, width + 0.12, 0.12, depth + 0.12));
  parts.push(architectureBox("纵向采光窗带", "#698894", x, height * 0.56, z + depth / 2 + 0.03, width * 0.65, height * 0.65, 0.05));
  if (roof === "gable") {
    const cap = pitchedRoof("双坡屋盖", "#626c70", width + 0.45, depth + 0.4, height + 0.13); cap.position.x = x; cap.position.z = z;
    // 默认坡高只有 .65m，抬到约 .3 倍跨度，成为像样的坡屋顶
    const rise = Math.max(1, width * 0.3 / 0.65);
    cap.profile = cap.profile!.map(point => ({ x: point.x, y: point.y * rise }));
    parts.push(cap);
  }
  else if (roof === "dome") parts.push(part("穹形屋盖", "lathe", "#a6ada3", [x, height, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: width * 0.35 }, { x: width * 0.2, y: width * 0.3 }, { x: width * 0.44, y: width * 0.12 }, { x: width * 0.52, y: 0 }] }));
  else {
    parts.push(architectureBox("平顶压檐", "#7c8889", x, height + 0.1, z, width + 0.25, 0.2, depth + 0.25));
    if (roof === "terrace") parts.push(architectureBox("退台上层房间", color, x - width * 0.12, height + floorHeight * 0.4, z - depth * 0.12, width * 0.62, floorHeight * 0.8, depth * 0.62));
  }
  return parts;
}

export function architectureLink(a: ArchitectureNode, b: ArchitectureNode, elevation: number, width: number, covered = false): ModelPart[] {
  const dx = b.x - a.x, dz = b.z - a.z, length = Math.hypot(dx, dz);
  const directionX = dx / length, directionZ = dz / length;
  const offsetA = Math.min(a.width, a.depth) * 0.43, offsetB = Math.min(b.width, b.depth) * 0.43;
  const start: [number, number, number] = [a.x + directionX * offsetA, elevation + 0.12, a.z + directionZ * offsetA];
  const end: [number, number, number] = [b.x - directionX * offsetB, elevation + 0.12, b.z - directionZ * offsetB];
  const yaw = Math.atan2(dx, dz) * 180 / Math.PI;
  const parts = [part("水平连桥桥面", "box", "#8f998f", [(start[0] + end[0]) / 2, elevation + 0.12, (start[2] + end[2]) / 2], [width, 0.2, Math.max(0.5, length - offsetA - offsetB)], [0, yaw, 0])];
  if (covered) parts.push(part("连桥遮盖", "box", "#687b7c", [(start[0] + end[0]) / 2, elevation + 2.2, (start[2] + end[2]) / 2], [width + 0.25, 0.14, Math.max(0.5, length - offsetA - offsetB)], [0, yaw, 0]));
  return parts;
}

export function architectureFoundation(plan: ArchitecturePlan): ModelPart {
  const xs = plan.nodes.map(node => node.x), zs = plan.nodes.map(node => node.z);
  const minX = Math.min(...xs) - 4, maxX = Math.max(...xs) + 4, minZ = Math.min(...zs) - 4, maxZ = Math.max(...zs) + 4;
  return architectureBox("地面基础台", "#a2a698", (minX + maxX) / 2, 0.06, (minZ + maxZ) / 2, maxX - minX, 0.12, maxZ - minZ);
}
