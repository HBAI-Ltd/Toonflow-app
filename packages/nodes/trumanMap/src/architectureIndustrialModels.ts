import { beam, part, ring, type ModelPart } from "./assetModelParts";
import { architectureBlock, architectureBox, architectureFoundation, architectureLink, architectureRound, createArchitecturePlan } from "./architectureStructures";

export const industrialPrograms = ["多跨制造车间", "蒸汽动力厂", "水处理站", "农产加工厂", "吊装厂房", "筒仓物流场", "实验制造园", "冷链转运库", "电力变配站", "矿石分选场"];
export const transitPrograms = ["架空列车站", "跨河廊桥", "多跨公路桥", "综合换乘枢纽", "航站候机楼", "码头客运站", "山地缆车站", "立体停车楼", "货运装卸站", "步行连桥网"];

export function createIndustrialArchitecture(program: number, layout: number, massing: number): ModelPart[] {
  const plan = createArchitecturePlan(program, layout, massing, 1.3);
  const parts: ModelPart[] = [architectureFoundation(plan)];
  for (const [index, node] of plan.nodes.entries()) {
    if (program === 5) {
      const height = 3.4 + node.floors * 1.7;
      parts.push(architectureRound("独立粮食筒仓", "#a6aaa0", node.x, height / 2, node.z, node.width, height));
      parts.push(part("筒仓锥形仓顶", "cone", "#6c8586", [node.x, height + 0.65, node.z], [node.width + 0.3, 1.3, node.width + 0.3]));
      parts.push(architectureBox("仓底装运口", "#687b7b", node.x, 1.1, node.z + node.width / 2, 1, 2.2, 0.7));
    } else parts.push(...architectureBlock(node, index, program === 0 || program === 3 || program === 9 ? "gable" : "flat", "#9ca89f", 2.6));
  }
  for (const [a, b] of plan.edges) {
    const start = plan.nodes[a]!, end = plan.nodes[b]!, y = 1.8 + massing % 3 * 0.45;
    if (program === 7 || program === 6) parts.push(...architectureLink(start, end, 0, 1.8, massing % 2 === 1));
    else parts.push(part("车间间工艺管路", "tube", "#788a89", [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.09, path: [{ x: start.x, y: y + 0.8, z: start.z }, { x: start.x, y, z: (start.z + end.z) / 2 }, { x: end.x, y, z: (start.z + end.z) / 2 }, { x: end.x, y: y + 0.8, z: end.z }].filter((point, index, points) => !index || Math.hypot(point.x - points[index - 1]!.x, point.y - points[index - 1]!.y, point.z - points[index - 1]!.z) >= 1e-5) }));
  }
  const first = plan.nodes[0]!;
  if (program === 0) for (const node of plan.nodes.slice(0, 3)) parts.push(architectureBox("车间屋顶采光天窗", "#73959c", node.x, node.floors * 2.6 + 0.8, node.z, node.width * 0.5, 0.4, node.depth * 0.8));
  else if (program === 1) for (const node of plan.nodes.slice(0, 3)) { parts.push(architectureRound("锅炉厂烟囱", "#8a7764", node.x + node.width / 2 + 0.8, 4 + node.floors * 0.8, node.z - 1, 0.75, 8 + node.floors * 1.6)); parts.push(architectureRound("外置蒸汽锅炉", "#a48663", node.x + node.width / 2 + 1, 1.8, node.z + 1.3, 1.3, 3.6)); }
  else if (program === 2) for (const node of plan.nodes.slice(0, 3)) { const tank = ring("露天沉淀池壁", "#8a9b93", 2.2, 0.2, 0.65, 1.3); tank.position.x = node.x + node.width / 2 + 2.5; tank.position.z = node.z; parts.push(tank, architectureRound("沉淀池水面", "#709b9e", tank.position.x, 0.85, tank.position.z, 3.9, 0.05)); }
  else if (program === 3) { for (const side of [-1, 1]) { parts.push(architectureRound("原料储料罐", "#c2b48e", first.x + side * 2.6, 2.8, first.z - first.depth / 2 - 2, 1.65, 5.6)); parts.push(part("储料罐锥顶", "cone", "#8e9d8b", [first.x + side * 2.6, 6.1, first.z - first.depth / 2 - 2], [1.9, 1, 1.9])); } }
  else if (program === 4) { const z = first.z + first.depth / 2 + 2; for (const side of [-1, 1]) parts.push(architectureBox("吊装门架立柱", "#81938f", first.x + side * 3.2, 3.5, z, 0.35, 7, 0.4)); parts.push(architectureBox("吊装门架主梁", "#889a91", first.x, 7.1, z, 7, 0.45, 0.65), architectureBox("门架吊钩小车", "#b6a16f", first.x + massing % 3 - 1, 6.6, z, 0.8, 0.6, 0.8)); }
  else if (program === 5) { for (const node of plan.nodes.slice(0, 3)) parts.push(architectureBox("仓顶输粮桥", "#6e8586", node.x, 3.4 + node.floors * 1.7 + 0.3, node.z, 1, 0.18, node.depth + 2)); }
  else if (program === 6) { parts.push(architectureBox("洁净实验入口舱", "#7a9e9e", first.x, 2.1, first.z + first.depth / 2 + 1.2, 3.6, 4.2, 2.4)); parts.push(architectureBox("实验楼通风机房", "#6c8389", first.x, first.floors * 2.6 + 0.7, first.z, 2.6, 1.4, 2.2)); }
  else if (program === 7) for (const node of plan.nodes.slice(0, 4)) parts.push(architectureBox("保温装卸门斗", "#c0c8bd", node.x, 1.7, node.z + node.depth / 2 + 1, 2.5, 3.4, 2));
  else if (program === 8) for (const node of plan.nodes.slice(0, 3)) { parts.push(architectureBox("外置变压器", "#6d8b84", node.x + node.width / 2 + 1.3, 1.3, node.z, 1.8, 2.6, 2)); for (const x of [-0.45, 0.45]) parts.push(architectureRound("高压绝缘柱", "#b2a18a", node.x + node.width / 2 + 1.3 + x, 3, node.z, 0.22, 0.8)); }
  else { parts.push(architectureBox("分选高架平台", "#83988d", first.x, first.floors * 2.6 + 0.3, first.z, first.width + 2, 0.3, first.depth + 2)); for (const side of [-1, 1]) parts.push(beam("矿料斜输送槽", "#758b86", [first.x + side * 1.5, 0.4, first.z + first.depth / 2 + 4], [first.x + side * 1.5, first.floors * 2.6 + 0.4, first.z], 0.8, 0.2)); }
  return parts;
}

export function createTransitArchitecture(program: number, layout: number, massing: number): ModelPart[] {
  const plan = createArchitecturePlan(program, layout, massing, 1.45);
  const elevation = 1.2 + Math.floor(massing / 4) * 0.6;
  const parts: ModelPart[] = [architectureFoundation(plan)];
  for (const [index, node] of plan.nodes.entries()) {
    parts.push(architectureBox("节点站台桥面", "#a6b0a2", node.x, elevation, node.z, node.width + 1, 0.3, node.depth + 0.8));
    for (const side of [-1, 1]) parts.push(architectureBox("桥台承重柱", "#8a9d95", node.x + side * node.width * 0.35, elevation / 2, node.z, 0.42, elevation, 0.65));
    if (program !== 2 && program !== 7) parts.push(architectureBox("站台独立顶棚", "#718f90", node.x, elevation + 2.6 + node.floors * 0.2, node.z, node.width + 1.4, 0.16, node.depth + 1.1));
    if (program === 1 || program === 9) for (const side of [-1, 1]) parts.push(architectureBox("廊桥檐柱", "#8d9481", node.x + side * node.width * 0.4, elevation + 1.35, node.z + node.depth * 0.3, 0.18, 2.7, 0.18));
    else parts.push(architectureBox("节点候车岗亭", "#86a09b", node.x, elevation + 1.3 + node.floors * 0.12, node.z - node.depth * 0.22, 1.4, 2.3 + node.floors * 0.24, 1.4));
    if (index === 0) parts.push(architectureBox("交通节点高位标塔", "#718d90", node.x + node.width / 2, elevation + 2.4 + node.floors * 0.45, node.z, 0.5, 4.8 + node.floors * 0.9, 0.55));
  }
  for (const [a, b] of plan.edges) parts.push(...architectureLink(plan.nodes[a]!, plan.nodes[b]!, elevation, program === 2 ? 3.2 : 1.8, program === 1));
  const first = plan.nodes[0]!;
  if (program === 0) for (const side of [-1, 1]) parts.push(architectureBox("站前列车导轨", "#697d81", first.x + side * 1.1, elevation + 0.22, first.z, 0.13, 0.15, first.depth + 6));
  else if (program === 1) parts.push(architectureBox("廊桥入口厅", "#a5997d", first.x, elevation + 1.8, first.z - first.depth / 2 - 0.8, 3.6, 3.4, 1.6));
  else if (program === 2) for (const node of plan.nodes) for (const side of [-1, 1]) parts.push(architectureBox("公路桥防撞栏", "#7c9490", node.x + side * (node.width / 2 + 0.3), elevation + 0.5, node.z, 0.18, 0.7, node.depth + 0.8));
  else if (program === 3) parts.push(...architectureBlock({ ...first, x: first.x + 5, width: 4, depth: 5 }, 6, "terrace", "#a5b2a4", 2.8));
  else if (program === 4) { parts.push(architectureBox("航站登机厅", "#82a4ab", first.x, elevation + 2, first.z + first.depth / 2 + 2.5, 5, 4, 5)); parts.push(architectureBox("空侧登机桥", "#788d91", first.x + 4, elevation + 1.5, first.z + first.depth / 2 + 2.5, 4.5, 2.1, 1.5)); }
  else if (program === 5) { parts.push(architectureBox("港池水面", "#7b9da0", first.x, 0.16, first.z + first.depth / 2 + 4, 6, 0.06, 4)); for (const side of [-1, 1]) parts.push(architectureRound("码头系泊柱", "#7a8782", first.x + side * 2.4, 0.8, first.z + first.depth / 2 + 2, 0.35, 1.6)); }
  else if (program === 6) { parts.push(architectureBox("缆车主站塔", "#7d9291", first.x, elevation + 3.4, first.z - 2, 1.2, 6.8, 1.5)); parts.push(part("缆车回转轮", "torus", "#71858a", [first.x, elevation + 6.6, first.z - 2], [2.4, 2.4, 0.4], [90, 0, 0])); }
  else if (program === 7) { parts.push(...architectureBlock({ ...first, width: 5, depth: 7 }, 6, "flat", "#9da99a", 2.4)); for (let level = 0; level < 3; level++) parts.push(part("停车楼折返坡道", "box", "#869a90", [first.x + 4, 1.3 + level * 2.2, first.z], [2.4, 0.18, 6.6], [level % 2 ? -20 : 20, 0, 0])); }
  else if (program === 8) { parts.push(architectureBox("货运仓库", "#879c93", first.x + 5, 2.5, first.z, 4, 5, 6)); parts.push(architectureBox("货运装卸平台", "#a9b09a", first.x + 5, 0.6, first.z + 3.7, 4, 1.2, 1.4)); }
  else parts.push(...architectureLink(plan.nodes[0]!, plan.nodes[4]!, elevation + 2.6, 1.3), ...architectureLink(plan.nodes[1]!, plan.nodes[5]!, elevation + 2.6, 1.3));
  return parts;
}
