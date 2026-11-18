import { part, pitchedRoof, type ModelPart } from "./assetModelParts";
import { architectureBlock, architectureBox, architectureFoundation, architectureLink, architectureRound, createArchitecturePlan, type ArchitecturePlan } from "./architectureStructures";

export const housingPrograms = ["庭院住宅", "阶梯公寓", "围合宿舍", "花园联排", "临水宅院", "错层山居", "双塔住区", "内街住区", "立体院落", "连廊客舍"];
export const publicPrograms = ["庭院学舍", "城市图书馆", "社区剧院", "博物展馆", "议事市政厅", "综合体育馆", "疗养诊所", "巡回展览馆", "音乐礼堂", "公共浴场"];
export const commercialPrograms = ["拱廊集市", "步行街商铺", "旅客旅馆", "餐饮院落", "商贸会馆", "工艺集散馆", "综合商场", "仓储交易站", "庭院茶楼", "露台办公社"];

function civicLinks(plan: ArchitecturePlan, width: number): ModelPart[] {
  return plan.edges.flatMap(([a, b], index) => architectureLink(plan.nodes[a]!, plan.nodes[b]!, plan.massing % 3 === 2 && index % 2 === 0 ? 2.9 : 0, width, plan.massing % 3 === 1));
}

function portal(x: number, z: number, width: number, height: number, color: string): ModelPart[] {
  return [architectureBox("入口左柱", color, x - width / 2, height / 2, z, 0.28, height, 0.35), architectureBox("入口右柱", color, x + width / 2, height / 2, z, 0.28, height, 0.35), architectureBox("入口横额", color, x, height, z, width + 0.5, 0.3, 0.6)];
}

export function createHousingArchitecture(program: number, layout: number, massing: number): ModelPart[] {
  const plan = createArchitecturePlan(program, layout, massing, 1.05);
  if (program === 6) { plan.nodes[0]!.floors += 2; plan.nodes[3]!.floors += 2; }
  const parts = [architectureFoundation(plan), ...plan.nodes.flatMap((node, index) => architectureBlock(node, index, program === 9 || program === 0 ? "gable" : program === 1 || program === 8 ? "terrace" : "flat", "#c1b5a0")), ...civicLinks(plan, 1.25)];
  const first = plan.nodes[0]!;
  if (program === 0) parts.push(...portal(first.x, first.z + first.depth / 2 + 1.5, 2.4, 2.6, "#7b6b58"));
  else if (program === 1) for (let step = 0; step < 6; step++) parts.push(architectureBox("外部台阶", "#9b9e92", first.x + first.width / 2 + 0.6, 0.18 + step * 0.35, first.z - 1.2 + step * 0.55, 1.2, 0.36, 0.58));
  else if (program === 2) for (const node of plan.nodes) parts.push(architectureBox("宿舍公共阳台", "#7b8d87", node.x, 2.8, node.z + node.depth / 2 + 0.55, node.width * 0.8, 0.16, 1.1));
  else if (program === 3) for (const node of plan.nodes) { parts.push(architectureBox("入户门廊檐", "#7b8d87", node.x, 2.35, node.z + node.depth / 2 + 0.65, 2, 0.15, 1.3)); parts.push(architectureBox("前庭种植池", "#84916f", node.x + 1.2, 0.25, node.z + node.depth / 2 + 1.6, 1.2, 0.5, 0.8)); }
  else if (program === 4) { parts.push(architectureBox("宅院引水池", "#73989c", first.x, 0.15, first.z + first.depth / 2 + 3, first.width + 2, 0.08, 2)); parts.push(architectureBox("水边亲水平台", "#84765d", first.x, 0.3, first.z + first.depth / 2 + 1.5, first.width + 1, 0.16, 1)); }
  else if (program === 5) for (const node of plan.nodes.slice(0, 3)) parts.push(architectureBox("山居错层外台", "#9b9b87", node.x + node.width / 2 + 0.8, node.floors * 1.4, node.z, 1.6, 0.22, node.depth * 0.7));
  else if (program === 6) for (const node of [plan.nodes[0]!, plan.nodes[3]!]) parts.push(architectureRound("住区塔冠", "#778d8c", node.x, node.floors * 2.9 + 0.4, node.z, node.width * 0.72, 0.8));
  else if (program === 7) for (const node of plan.nodes.slice(0, 4)) parts.push(architectureBox("内街架空雨棚", "#7f8e85", node.x, 2.3, node.z + node.depth / 2 + 0.75, node.width + 0.3, 0.16, 1.5));
  else if (program === 8) parts.push(...architectureLink(plan.nodes[0]!, plan.nodes[4]!, 5.8, 1.4), ...architectureLink(plan.nodes[1]!, plan.nodes[5]!, 2.9, 1.4));
  else { parts.push(...portal(first.x, first.z + first.depth / 2 + 0.7, 2, 2.4, "#78624d")); const cap = pitchedRoof("客舍门楼屋顶", "#65747a", 3.2, 1.8, 2.6); cap.position.x = first.x; cap.position.z = first.z + first.depth / 2 + 0.7; parts.push(cap); }
  return parts;
}

export function createPublicArchitecture(program: number, layout: number, massing: number): ModelPart[] {
  const plan = createArchitecturePlan(program, layout, massing, 1.28);
  plan.nodes[0]!.width += 2.4; plan.nodes[0]!.depth += 1.8;
  const parts = [architectureFoundation(plan), ...plan.nodes.flatMap((node, index) => architectureBlock(node, index, program === 3 || program === 9 ? "dome" : program === 2 || program === 8 ? "gable" : "flat", "#b6b8ac", 3.2)), ...civicLinks(plan, 1.8)];
  const first = plan.nodes[0]!, front = first.z + first.depth / 2;
  if (program === 0) { for (let index = 0; index < 4; index++) parts.push(architectureBox("教学入口列柱", "#8e9c95", first.x - 2.1 + index * 1.4, 1.6, front + 0.8, 0.3, 3.2, 0.3)); parts.push(architectureBox("校舍入口檐", "#788d89", first.x, 3.3, front + 0.8, 6, 0.2, 1.6)); }
  else if (program === 1) { parts.push(architectureBox("图书馆公共阅览玻璃厅", "#7b9ca3", first.x, 2.2, front + 1.2, 5.4, 4.4, 2.4)); parts.push(architectureBox("阅览厅遮阳顶", "#7d918c", first.x, 4.5, front + 1.2, 5.8, 0.18, 2.8)); }
  else if (program === 2) { parts.push(architectureBox("剧院舞台盒体", "#8c7d79", first.x, first.floors * 1.6 + 1.5, first.z - first.depth / 2 - 1.4, 4.5, first.floors * 3.2 + 3, 2.8)); parts.push(architectureBox("剧院前场台阶", "#9f9f91", first.x, 0.25, front + 1, 6, 0.5, 2)); }
  else if (program === 3) { for (const side of [-1, 1]) parts.push(architectureRound("展馆入口圆柱", "#a8aca0", first.x + side * 2, 2.1, front + 1, 0.42, 4.2)); parts.push(architectureBox("博物馆正门上梁", "#8e9e9a", first.x, 4.3, front + 1, 5.2, 0.3, 1.8)); }
  else if (program === 4) { parts.push(...portal(first.x, front + 1.2, 4.2, 4.6, "#969c90")); parts.push(architectureBox("议事厅塔钟框", "#7b8a86", first.x, first.floors * 3.2 + 1.2, first.z, 2, 2.4, 2)); }
  else if (program === 5) { parts.push(part("体育馆大跨屋盖", "capsule", "#81938f", [first.x, first.floors * 3.2 + 0.4, first.z], [first.width + 1, 1.3, first.depth + 2])); for (const side of [-1, 1]) parts.push(architectureBox("体育馆入口通道", "#9fa994", first.x + side * (first.width / 2 + 0.8), 1.5, first.z, 1.6, 3, 3)); }
  else if (program === 6) { parts.push(architectureBox("诊所门前救护棚", "#8ca9a5", first.x, 2.8, front + 1.5, 5.5, 0.2, 3)); parts.push(...portal(first.x, front + 2.5, 4.5, 2.7, "#a7b5aa")); }
  else if (program === 7) for (const node of plan.nodes.slice(0, 3)) parts.push(architectureBox("临时展厅连接舱", "#6c8c92", node.x + node.width / 2 + 1.1, 1.5, node.z, 2.2, 3, node.depth * 0.6));
  else if (program === 8) { parts.push(architectureBox("音乐厅声学前厅", "#978675", first.x, 2.7, front + 1.5, 5.5, 5.4, 3)); for (let index = 0; index < 3; index++) parts.push(architectureBox("音乐厅屋面声学鳍", "#6e8589", first.x - 1.5 + index * 1.5, first.floors * 3.2 + 0.8, first.z, 0.16, 1.4, first.depth * 0.8)); }
  else { parts.push(architectureRound("公共浴场前池", "#7ca0a4", first.x, 0.18, front + 2.2, 3.8, 0.12)); parts.push(architectureRound("浴场中央圆台", "#a8b3a4", first.x, 0.15, first.z, 1.6, 0.3)); }
  return parts;
}

export function createCommercialArchitecture(program: number, layout: number, massing: number): ModelPart[] {
  const plan = createArchitecturePlan(program, layout, massing, 1.17);
  const parts = [architectureFoundation(plan), ...plan.nodes.flatMap((node, index) => architectureBlock(node, index, program === 4 || program === 8 ? "gable" : program === 9 ? "terrace" : "flat", "#b4ad98", 3.1)), ...civicLinks(plan, 2)];
  for (const [index, node] of plan.nodes.entries()) {
    const front = node.z + node.depth / 2;
    if (program === 0) parts.push(architectureBox("集市拱廊顶", "#8d8069", node.x, 2.5, front + 0.8, node.width + 0.4, 0.18, 1.6));
    else if (program === 1) parts.push(architectureBox("商铺橱窗前厅", "#6e969e", node.x, 1.35, front + 0.5, node.width * 0.8, 2.7, 1));
    else if (program === 2) parts.push(architectureBox("旅馆挑出客房", "#82978e", node.x, 3.1 * Math.min(node.floors, 2), front + 0.6, node.width * 0.7, 2.2, 1.2));
    else if (program === 3) { parts.push(architectureBox("餐饮临街檐廊", "#a18b6b", node.x, 2.4, front + 1, node.width, 0.16, 2)); if (index % 2 === 0) parts.push(architectureRound("餐饮排风筒", "#7a8988", node.x, node.floors * 3.1 + 1, node.z, 0.45, 2)); }
    else if (program === 4) parts.push(architectureBox("会馆阶前台", "#9b9f8d", node.x, 0.3, front + 0.8, node.width + 0.4, 0.6, 1.6));
    else if (program === 5) parts.push(architectureBox("工艺展示外廊", "#8e9b8c", node.x + node.width / 2 + 0.8, 1.2, node.z, 1.6, 2.4, node.depth));
    else if (program === 6) parts.push(architectureBox("商场挑出扶梯厅", "#75989a", node.x, 2.7, front + 1.2, node.width * 0.85, 5.4, 2.4));
    else if (program === 7) parts.push(architectureBox("交易库装卸月台", "#929889", node.x, 0.55, front + 1, node.width, 1.1, 2));
    else if (program === 8) parts.push(architectureBox("茶楼观景阳台", "#8c816b", node.x, 3.2, front + 0.9, node.width + 0.3, 0.18, 1.8));
    else parts.push(architectureBox("办公社退台花槽", "#7f9779", node.x - node.width * 0.25, node.floors * 3.1 + 0.35, node.z + node.depth * 0.3, node.width * 0.4, 0.5, 0.7));
  }
  return parts;
}
