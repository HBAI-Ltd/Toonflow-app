import { beam, crystal, part, pitchedRoof, ring, type ModelPart } from "./assetModelParts";
import { architectureBox, architectureFoundation, architectureLink, architectureRound, createArchitecturePlan } from "./architectureStructures";

export const gardenPrograms = ["连廊庭园", "临水榭群", "重檐亭苑", "攀藤廊架", "山门台院", "观景台园", "露天剧场", "穹顶温室园", "禅修庭院", "喷泉广场亭廊"];
export const speculativePrograms = ["悬挑研究站", "环塔观测城", "巨柱神殿", "水晶议会厅", "多舱太空港", "齿轮塔工坊", "菌冠聚落", "浮桥圣所", "折线能源站", "空中花园塔"];

export function createGardenArchitecture(program: number, layout: number, massing: number): ModelPart[] {
  const plan = createArchitecturePlan(program, layout, massing, 0.86);
  const parts: ModelPart[] = [architectureFoundation(plan)];
  for (const [index, node] of plan.nodes.entries()) {
    const width = node.width * 0.78, depth = node.depth * 0.7, height = 2 + node.floors * 0.27;
    parts.push(architectureBox("亭榭基础石台", "#a7ac96", node.x, 0.13, node.z, width + 0.5, 0.26, depth + 0.5));
    if (program === 6) {
      for (let tier = 0; tier < 3; tier++) parts.push(architectureBox("剧场层叠看台", "#a2a48d", node.x, 0.4 + tier * (0.25 + node.floors * 0.055), node.z - depth * 0.25 + tier * 0.55, width, 0.25, 0.6));
      continue;
    }
    // 前后各两根承檐柱：屋顶有完整的四点承托（原先只有前排两根）
    for (const side of [-1, 1]) for (const back of [-1, 1]) parts.push(architectureRound("亭榭承檐柱", "#8b785d", node.x + side * width * 0.4, height / 2 + 0.2, node.z + back * depth * 0.3, 0.17, height));
    if (program === 3) {
      for (let bar = 0; bar < 3; bar++) parts.push(architectureBox("廊架木格梁", "#8b785d", node.x, height + 0.27, node.z - depth * 0.35 + bar * depth * 0.35, width + 0.7, 0.16, 0.12));
    } else if (program === 7) {
      parts.push(part("温室曲线玻璃顶", "lathe", "#88a8a4", [node.x, height + 0.1, node.z], [1, 1, 1], [0, 0, 0], { opacity: 0.38, roughness: 0.16, profile: [{ x: 0, y: width * 0.4 }, { x: width * 0.22, y: width * 0.33 }, { x: width * 0.5, y: 0.1 }, { x: width * 0.52, y: 0 }] }));
    } else {
      const tiers = program === 2 ? 2 + massing % 2 : 1;
      for (let tier = 0; tier < tiers; tier++) {
        const cap = pitchedRoof("亭榭层叠檐顶", program === 5 ? "#7d908c" : "#657b76", width + 0.9 - tier * 0.45, depth + 0.8 - tier * 0.35, height + 0.25 + tier * 0.45, program === 2 || program === 8);
        cap.position.x = node.x; cap.position.z = node.z; parts.push(cap);
      }
    }
    if (program === 8 || program === 0) parts.push(architectureBox("半开敞亭墙", "#b1ad94", node.x, 0.9, node.z - depth * 0.35, width * 0.75, 1.4, 0.16));
    else if (program === 5 && index % 2 === 0) parts.push(architectureBox("眺望台护栏", "#7a8b7a", node.x, 0.85, node.z + depth / 2, width, 0.7, 0.1));
  }
  for (const [a, b] of plan.edges) parts.push(...architectureLink(plan.nodes[a]!, plan.nodes[b]!, program === 1 ? 0.55 : 0, 1.05, program === 0 || massing % 3 === 1 && program !== 6));
  const first = plan.nodes[0]!;
  if (program === 1) parts.push(architectureBox("水榭前池", "#789f9c", first.x, 0.16, first.z + 3.2, 5, 0.05, 2.8));
  else if (program === 4) { for (const side of [-1, 1]) parts.push(architectureBox("山门石塔柱", "#9d9e85", first.x + side * 1.25, 2.3, first.z + 2, 0.45, 4.6, 0.55)); parts.push(architectureBox("山门横梁", "#7e8c78", first.x, 4.5, first.z + 2, 3.7, 0.25, 0.8)); }
  else if (program === 6) parts.push(architectureBox("露天演出舞台", "#a6ad91", first.x, 0.5, first.z - 3.2, 5.5, 1, 3.2));
  else if (program === 7) for (const node of plan.nodes.slice(0, 3)) parts.push(part("室内植物树冠", "sphere", "#7c956a", [node.x, 1.5, node.z], [1.4, 1.6, 1.2]));
  else if (program === 9) { const basin = ring("广场喷泉池壁", "#9ea791", 2, 0.18, 0.45, 0.9); basin.position.x = first.x; basin.position.z = first.z + 3.5; parts.push(basin, architectureRound("广场喷泉中心柱", "#aeb59d", first.x, 1.1, first.z + 3.5, 0.32, 2.2), architectureRound("广场喷泉水面", "#7a9fa2", first.x, 0.6, first.z + 3.5, 3.6, 0.03)); }
  return parts;
}

export function createSpeculativeArchitecture(program: number, layout: number, massing: number): ModelPart[] {
  const plan = createArchitecturePlan(program, layout, massing, 1.3);
  const parts: ModelPart[] = [architectureFoundation(plan)];
  for (const [index, node] of plan.nodes.entries()) {
    const height = 3 + node.floors * 1.6, lift = 1.6 + node.floors * 0.4;
    if (program === 2) {
      parts.push(architectureRound("神殿独立巨柱", "#a6a58e", node.x, height / 2, node.z, node.width * 0.45, height));
      parts.push(architectureBox("巨柱柱头承盘", "#b7b39c", node.x, height + 0.2, node.z, node.width * 0.85, 0.4, node.depth * 0.7));
      parts.push(architectureBox("神殿地面台座", "#9a9f87", node.x, 0.2, node.z, node.width, 0.4, node.depth));
    } else if (program === 3) {
      parts.push(architectureRound("水晶议厅基坛", "#8a9a9b", node.x, 0.28, node.z, node.width + 0.7, 0.56));
      parts.push(crystal("可居住晶体议厅", "#91aab4", [node.x, 0.56 + height * 0.7, node.z], [node.width, height, node.depth], { roughness: 0.25, opacity: 0.85 }));
      parts.push(architectureBox("晶体议厅入口桥", "#758d92", node.x, 0.7, node.z + node.depth * 0.38, node.width * 0.4, 0.3, node.depth * 0.4));
    } else if (program === 6) {
      parts.push(architectureRound("菌冠居所立柱", "#b1a58b", node.x, height / 2, node.z, node.width * 0.35, height));
      parts.push(part("菌冠居所屋壳", "lathe", "#9f9b86", [node.x, height, node.z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 1.5 }, { x: node.width * 0.3, y: 1.2 }, { x: node.width * 0.7, y: 0.25 }, { x: node.width * 0.76, y: 0 }, { x: node.width * 0.45, y: -0.15 }, { x: 0, y: 0.4 }] }));
      parts.push(architectureBox("菌冠居所窄门", "#627f7c", node.x, 1.3, node.z + node.width * 0.18, 0.7, 2.6, 0.12));
    } else if (program === 1 || program === 5) {
      parts.push(architectureRound("独立观测塔体", "#8f9f9e", node.x, height / 2, node.z, node.width * 0.72, height));
      const walk = ring("塔体外环平台", "#728d95", node.width * 0.62, 0.24, height * 0.65, 0.22); walk.position.x = node.x; walk.position.z = node.z; parts.push(walk);
      parts.push(architectureBox("塔体观测舱", "#73959d", node.x, height + 0.8, node.z, node.width * 0.8, 1.6, node.depth * 0.65));
    } else {
      parts.push(architectureRound("悬挑承重核心", "#7f9697", node.x, (lift + height * 0.25) / 2, node.z, node.width * 0.25, lift + height * 0.25));
      parts.push(architectureBox("高架房舱平台", "#778f94", node.x, lift, node.z, node.width + 1, 0.3, node.depth + 1));
      if (program === 4) parts.push(part("太空港横置舱体", "capsule", "#97adb0", [node.x, lift + 1.4, node.z], [node.width, node.depth + node.floors * 0.5, 2.5], [90, 0, 0]));
      else if (program === 8) parts.push(part("折线能源楼体", "extrude", "#8fa5a3", [node.x, lift + 0.15, node.z], [1, 1, 1], [0, 0, 0], { depth: node.depth, profile: [{ x: -node.width / 2, y: 0 }, { x: node.width / 2, y: 0 }, { x: node.width * 0.35, y: height * 0.55 }, { x: node.width * 0.6, y: height }, { x: -node.width * 0.15, y: height }, { x: -node.width * 0.45, y: height * 0.45 }] }));
      else parts.push(architectureBox("悬挑居住舱", "#93aaa7", node.x + (index % 2 ? 0.7 : -0.7), lift + height * 0.3, node.z, node.width + 0.6, height * 0.55, node.depth));
      parts.push(architectureBox("房舱前部玻璃带", "#6b97a3", node.x, lift + height * 0.32, node.z + node.depth / 2 + 0.04, node.width * 0.7, Math.max(1, height * 0.3), 0.06));
      if (program === 9) parts.push(architectureBox("空中花园种植台", "#7d9775", node.x, lift + height * 0.6, node.z, node.width + 1.3, 0.4, node.depth + 0.5));
    }
  }
  const level = program === 2 ? 4.2 : program === 6 ? 2.4 : 1.8 + massing % 3 * 0.7;
  for (const [a, b] of plan.edges) parts.push(...architectureLink(plan.nodes[a]!, plan.nodes[b]!, level, program === 7 ? 1 : 1.4, program === 0 && massing % 2 === 1));
  const first = plan.nodes[0]!;
  if (program === 5) for (const node of [plan.nodes[0]!, plan.nodes[3]!]) { const y = 2 + node.floors * 0.6; parts.push(part("工坊传动轮", "cylinder", "#ac9467", [node.x, y, node.z + node.width * 0.4], [1.9, 0.18, 1.9], [90, 0, 0])); for (let tooth = 0; tooth < 8; tooth++) { const angle = tooth * Math.PI / 4; parts.push(part("工坊传动齿", "box", "#ac9467", [node.x + Math.cos(angle), y + Math.sin(angle), node.z + node.width * 0.4], [0.26, 0.35, 0.2], [0, 0, tooth * 45 - 90])); } }
  else if (program === 2) parts.push(architectureBox("神殿中央承檐梁", "#a6af96", first.x, 4.4, first.z, first.width + 2.5, 0.4, first.depth + 2));
  else if (program === 4) { parts.push(architectureRound("港口降落圆台", "#7c979a", first.x, 0.22, first.z + first.depth / 2 + 4, 5, 0.44)); parts.push(architectureBox("太空港信号桅", "#6c888f", first.x + 3, 4, first.z + 4, 0.2, 8, 0.2)); }
  else if (program === 7) for (const node of plan.nodes.slice(0, 3)) parts.push(beam("圣所斜置水晶撑", "#95acaf", [node.x - 1, 0.45, node.z], [node.x, 2.4, node.z], 0.45));
  return parts;
}
