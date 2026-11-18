import { part, type ModelPart, type Triple } from "../assetModelParts";
import { boxBatch } from "./everydayOutdoorSpaceBatchOne";
import { glazedFace, rectangle } from "./everydayWorkplaceSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { box, design, rail, type ArchitecturePrototype } from "./structures";

const concrete = "#aab0a6", roofColor = "#798d88", metal = "#5e7376", timber = "#9f8868", paving = "#b8b6a6";

function railwaySideFreightBuilding(): ModelPart[] {
  const parts: ModelPart[] = [
    box("单侧铁路货栈及公路接货院共同落地场坪", 2, 0.1, 0, 38, 0.2, 42, paving),
    box("货栈西侧独立平行到发线的连续道床", -11.2, 0.25, 0, 3.9, 0.1, 38, "#8c958d"),
    ...boxBatch("铁路外侧到发线真正承托双钢轨的独立轨枕合批", timber, Array.from({ length: 16 }, (_, index): Triple => [-11.2, 0.325, -18 + index * 2.4]), [2.8, 0.08, 0.22]),
    ...[-1, 1].map(side => box("货栈外侧保持标准轨距的连续承载钢轨", -11.2 + side * 0.7525, 0.4125, 0, 0.07, 0.115, 38, metal)),
    box("铁路高侧台与穿仓大厅共用连续实心承地基座", -2.3, 0.815, 0, 14.6, 1.23, 24, concrete),
    box("单侧铁路货台与横向穿仓货路共同齐平的完整高地面", -2.3, 1.49, 0, 14.6, 0.12, 24, concrete),
    box("后端连通铁路侧台与独立人行出口的完整高位回廊", -2.3, 0.875, 13.1, 14.6, 1.35, 2.4, concrete),
    part("长货栈由四跨钢架承托的完整双坡薄屋面", "extrude", roofColor, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 24.8, profile: [{ x: -5.3, y: 6.2 }, { x: 0, y: 7.8 }, { x: 5.3, y: 6.2 }, { x: 5.3, y: 6.02 }, { x: 0, y: 7.62 }, { x: -5.3, y: 6.02 }] }),
    part("铁路侧台高于车身界限并接到货栈墙的连续外挑雨棚", "extrude", roofColor, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 25.2, profile: [{ x: -9.8, y: 5.1 }, { x: -4.8, y: 5.4 }, { x: -4.8, y: 5.25 }, { x: -9.8, y: 4.95 }] }),
    box("铁路侧棚外缘与完整柱列接合的连续承梁", -9.3, 5.0, 0, 0.16, 0.16, 24, metal),
    ...boxBatch("落在铁路侧台实面并真实托住棚梁的独立细柱合批", metal, [-11.4, -3.8, 3.8, 11.4].map((z): Triple => [-9.3, 3.285, z]), [0.18, 3.51, 0.18]),
    ...boxBatch("货栈门洞之间从地板接到双坡屋面的完整承重柱合批", metal, [-1, 1].flatMap(side => [-11.7, -3.9, 3.9, 11.7].map((z): Triple => [side * 4.8, 3.875, z])), [0.25, 4.69, 0.25]),
    ...boxBatch("四跨钢架柱端真实连接的横向拉结梁合批", metal, [-11.7, -3.9, 3.9, 11.7].map((z): Triple => [0, 5.97, z]), [9.6, 0.18, 0.18]),
    box("货运营业前厅低于仓坪且真实落地的独立地台", 1, 0.375, -16, 8, 0.35, 8, concrete),
    box("营业前厅围墙实际共同承托的完整低位平屋面", 1, 4.3, -16, 8.6, 0.3, 8.6, roofColor),
    stairFlight("低营业厅独立升入高货栈人行门的连续五级短阶", [0, 0.55, -14.4], 5, 0.2, 0.4, 1.4),
    box("营业厅短阶高端与仓库门槛真实相叠的落脚平台", 0, 1.45, -12.1, 1.6, 0.2, 0.8, concrete),
    stairFlight("街面真正接入营业厅正门的两级宽短阶", [1, 0.2, -20.8], 2, 0.175, 0.6, 2.4),
    box("营业厅避开入口和内部短阶的固定办货柜基体", 2.7, 1.06, -17.4, 1.2, 1.02, 3.2, timber),
    box("固定办货柜基体上真实搭接的连续柜面", 2.7, 1.6, -17.4, 1.4, 0.08, 3.4, timber),
    part("公路货院从地面真正接到后高位回廊的连续叉车缓坡", "extrude", concrete, [0, 0, 13.1], [1, 1, 1], [0, 0, 0], { depth: 2.2, profile: [{ x: 4.9, y: 0.2 }, { x: 20, y: 0.2 }, { x: 5, y: 1.55 }, { x: 4.9, y: 1.55 }] }),
  ];
  for (const z of [-11.7, -3.9, 3.9, 11.7]) for (const side of [-1, 1]) parts.push(rail([side * 5.3, 6.02, z], [0, 7.62, z], 0.18, metal));
  const sideOutline: [number, number][] = [[-12, 0.2], [12, 0.2], [12, 6.22], [-12, 6.22]], doors = [-8, 0, 8].map(z => rectangle(z, 1.54, 3.4, 3.2)), windows = [-8, 0, 8].map(z => rectangle(z, 5.6, 4.4, 0.4));
  for (const x of [-5, 5]) parts.push(...glazedFace("货栈两侧一一对应并可横向穿仓的真实三列货门与高窗", "yz", sideOutline, windows, doors, x));
  const gable: [number, number][] = [[-5, 0.2], [5, 0.2], [5, 6.14], [0, 7.65], [-5, 6.14]];
  parts.push(...glazedFace("货栈前端通向低营业厅内部短阶的真实人行门与山墙高窗", "xy", gable, [-2.7, 2.7].map(x => rectangle(x, 5.1, 1.6, 0.8)), [rectangle(0, 1.54, 1.4, 2.5)], -12), ...glazedFace("货栈后端真正通入高位回廊的独立人行出口", "xy", gable, [rectangle(-2, 3.0, 1.8, 1.3)], [rectangle(3.2, 1.54, 1.4, 2.5)], 12));
  const officeFront: [number, number][] = [[-3, 0.2], [5, 0.2], [5, 4.2], [-3, 4.2]];
  parts.push(...glazedFace("街面货运营业厅公众入口与两侧真实采光窗口", "xy", officeFront, [-1.6, 3.6].map(x => rectangle(x, 1.4, 1.4, 1.4)), [rectangle(1, 0.54, 1.6, 2.5)], -20));
  for (const x of [-3, 5]) parts.push(...glazedFace("低营业厅从基础接到平屋面的完整侧窗墙", "yz", [[-20, 0.2], [-12, 0.2], [-12, 4.2], [-20, 4.2]], [rectangle(-16, 1.4, 2.0, 1.4)], [], x));
  const bumpers: Triple[] = [];
  for (const z of [-8, 0, 8]) {
    parts.push(box("东侧公路宽货门前同高且真实接仓的独立接车台", 6.45, 0.875, z, 3.1, 1.35, 4.1, concrete), box("公路接车台边缘真实承托的短搭板", 8.03, 1.49, z, 0.45, 0.12, 3.2, metal), box("东侧独立接车台上方与墙接合的短雨棚", 6.5, 5.3, z, 3.4, 0.14, 4.4, roofColor));
    for (const edge of [-1, 1]) { bumpers.push([8.05, 1.13, z + edge * 1.75]); parts.push(rail([5, 4.95, z + edge * 1.8], [7.95, 5.23, z + edge * 1.8], 0.1, metal)); }
  }
  parts.push(...boxBatch("公路接车台正面真实搭接的独立防撞缓冲块合批", "#526663", bumpers, [0.15, 0.55, 0.18]));
  for (const x of [-7.5, 3.2]) { const stair = stairFlight("后高位回廊真实接回地面且避开装卸门的独立人行阶", [x, 0.2, 16.7], 7, 1.35 / 7, 0.35, 1.6); stair.rotation.y = 90; parts.push(stair); }
  for (const z of [12, 14.2]) parts.push(part("独立叉车缓坡边缘随坡连续升高的低护坎", "extrude", metal, [0, 0, z], [1, 1, 1], [0, 0, 0], { depth: 0.08, profile: [{ x: 4.9, y: 1.55 }, { x: 5, y: 1.55 }, { x: 20, y: 0.2 }, { x: 20, y: 0.4 }, { x: 5, y: 1.75 }, { x: 4.9, y: 1.75 }] }));
  return parts;
}

export const everydayFreightBuildingSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("铁路侧台穿仓货运营业楼", "铁路在货栈外侧以连续高侧台接入三列横向穿仓宽门，对面公路院经独立接车台完成铁路公路换装；低营业前厅通过实际内短阶连接高仓坪，后回廊与独立缓坡及人行阶保持全站货路和步行路线贯通", railwaySideFreightBuilding, "建筑", "现代"),
];
