import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { boxBatch } from "./everydayOutdoorSpaceBatchOne";
import { glazedFace, rectangle } from "./everydayWorkplaceSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { box, design, rail, type ArchitecturePrototype } from "./structures";

const concrete = "#aab0a6", paving = "#b4b4a8", roofColor = "#81938e", metal = "#63797a", timber = "#a18c6e";

function splitStreetFreightAgency(): ModelPart[] {
  const stairHole: [number, number][] = [[-7.4, -8], [-5, -8], [-5, -0.85], [-7.4, -0.85]];
  const lowerColumns: Triple[] = [-8.7, -2.85, 2.85, 8.7].flatMap(x => [-8.7, -0.3, 7.7].map(z => [x, 3.265, z] as Triple));
  const upperColumns: Triple[] = [-8.7, -2.85, 2.85, 8.7].flatMap(x => [-8.7, -0.3].map(z => [x, 7.27, z] as Triple));
  const parts: ModelPart[] = [
    box("高街承岸与低街货运院共同落地的完整场坪", 0, 0.1, 0, 46, 0.2, 42, paving),
    box("前半幅公众营业楼直接平接高街的完整实心承岸台", 0, 2.8, -13.55, 24, 5.2, 9.1, concrete),
    box("低街货仓与独立接车台真正接地的连续仓底基座", 0, 0.73, -0.5, 18, 1.06, 17, concrete),
    box("下层接车仓内部连续同高的完整重地面", 0, 1.325, -0.5, 18, 0.15, 17, concrete),
    polygon("仅覆盖前半货仓并为内人行阶真正留井的营业厅楼板", concrete, [[-9, -9], [9, -9], [9, 0], [-9, 0]], 0.24, [0, 5.16, 0], [stairHole]),
    box("前半公众营业厅完整围墙和上柱承托的平屋盖", 0, 9.25, -4.5, 18.8, 0.3, 9.8, roofColor),
    box("后半单层接车仓与前上楼板边缘真实搭接的低屋盖", 0, 5.25, 4.15, 18.7, 0.24, 8.5, roofColor),
    ...boxBatch("下层货仓避开三装卸门并由地坪直承楼板屋盖的柱网合批", concrete, lowerColumns, [0.28, 3.79, 0.28]),
    ...boxBatch("前半公众厅上下真实对位接入屋盖的上层柱网合批", concrete, upperColumns, [0.26, 3.8, 0.26]),
    ...boxBatch("下层三列柱顶真实叠入上楼板及后低屋盖的横向承梁合批", metal, [-8.7, -0.3, 7.7].map((z): Triple => [0, 5.08, z]), [17.5, 0.22, 0.28]),
    ...boxBatch("下层中间两列柱之间接承楼板与低屋盖的连续纵向承梁合批", metal, [-2.85, 2.85].map((x): Triple => [x, 5.08, -0.5]), [0.2, 0.22, 16.8]),
    ...boxBatch("高营业厅前后柱列共同承托完整平屋盖的实际横梁合批", metal, [-8.7, -0.3].map((z): Triple => [0, 9.07, z]), [17.5, 0.2, 0.24]),
    stairFlight("仓内前区由下货仓升到中平台的真实薄底第一跑人行阶", [-6.2, 1.4, -7.8], 10, 0.2, 0.3, 1.8, 0.18),
    box("两跑内人行阶之间真正承接踏步的完整休息平台", -6.2, 3.3, -4.45, 2.2, 0.2, 1, concrete),
    stairFlight("内人行阶穿过真实楼板井后进入高营业厅的第二跑", [-6.2, 3.4, -4.05], 10, 0.2, 0.3, 1.8, 0.18),
    box("上跑终点与营业厅楼板同高相叠且不封梯井的落脚台", -6.2, 5.28, -0.65, 2.4, 0.24, 1.0, concrete),
    box("梯间休息平台下方真正接回低仓地面的短承柱", -6.2, 2.325, -4.45, 0.24, 1.89, 0.24, concrete),
    box("上层营业厅让开高街门和阶井出口的固定办货柜基体", 3.4, 5.93, -3, 4.0, 1.1, 0.85, timber),
    box("固定办货柜上实际搭接的薄交寄柜面", 3.4, 6.51, -3, 4.2, 0.1, 1.05, timber),
    part("低街侧院仅接下层货仓且在高端保留同高平鼻的叉车缓坡", "extrude", concrete, [0, 0, 2.8], [1, 1, 1], [0, 0, 0], { depth: 3, profile: [{ x: 8.9, y: 0.18 }, { x: 22, y: 0.18 }, { x: 22, y: 0.2 }, { x: 9, y: 1.4 }, { x: 8.9, y: 1.4 }] }),
  ];
  for (const z of [1.3, 4.3]) parts.push(part("低街叉车坡边缘真正随坡连续且不封上下出口的低护坎", "extrude", metal, [0, 0, z], [1, 1, 1], [0, 0, 0], { depth: 0.08, profile: [{ x: 8.9, y: 1.4 }, { x: 9, y: 1.4 }, { x: 22, y: 0.2 }, { x: 22, y: 0.4 }, { x: 9, y: 1.6 }, { x: 8.9, y: 1.6 }] }));
  for (const x of [-7.1, -5.3]) {
    parts.push(rail([x, 2.5, -7.8], [x, 4.5, -4.8], 0.075, metal), rail([x, 4.5, -4.8], [x, 4.5, -4.05], 0.075, metal), rail([x, 4.5, -4.05], [x, 6.5, -1.05], 0.075, metal));
  }
  const stairPosts: Triple[] = [];
  for (const x of [-7.1, -5.3]) for (const [z, top] of [[-7.65, 1.6], [-4.95, 3.4], [-3.9, 3.6], [-1.2, 5.4]]) stairPosts.push([x, top! + 0.48, z!]);
  parts.push(...boxBatch("两跑内人行阶真实插入踏面并接到斜扶手的独立短柱合批", metal, stairPosts, [0.07, 1.04, 0.07]));
  const holePosts: Triple[] = [-7.4, -5].flatMap(x => [-8, -4.45, -0.9].map(z => [x, 5.9, z] as Triple));
  parts.push(...boxBatch("营业厅真实楼板井两边落在板缘的独立护栏柱合批", metal, holePosts, [0.08, 1.08, 0.08]));
  for (const y of [5.95, 6.42]) parts.push(box("楼板井左长侧不侵入梯道的连续防坠扶栏", -7.4, y, -4.45, 0.08, 0.08, 7.1, metal), box("楼板井右长侧不侵入梯道的连续防坠扶栏", -5, y, -4.45, 0.08, 0.08, 7.1, metal), box("梯井前端封合而上跑出口保持开放的短护栏", -6.2, y, -8, 2.4, 0.08, 0.08, metal));
  const lowerOutline: [number, number][] = [[-9, 0.2], [9, 0.2], [9, 5.2], [-9, 5.2]];
  parts.push(...glazedFace("下层后货院三接车宽门与各门上方真实高窗的连续外壁", "xy", lowerOutline, [-5.7, 0, 5.7].map(x => rectangle(x, 4.86, 3.1, 0.2)), [-5.7, 0, 5.7].map(x => rectangle(x, 1.39, 3.4, 3.3)), 8));
  parts.push(box("高街承岸背后真实封合并接承上层公众厅的下仓前墙", 0, 2.7, -9, 18, 5, 0.18, concrete));
  const lowerSide: [number, number][] = [[-9, 0.2], [8, 0.2], [8, 5.2], [-9, 5.2]];
  parts.push(...glazedFace("下层西外壁保留真实高窗且避开内人行阶的连续围墙", "yz", lowerSide, [-5.4, 1, 5.8].map(z => rectangle(z, 2.5, 2.0, 1.7)), [], -9), ...glazedFace("下层东侧独立叉车缓坡门与前后分开的采光窗口", "yz", lowerSide, [-5.8, 6.3].map(z => rectangle(z, 2.5, 2.0, 1.7)), [rectangle(2.8, 1.39, 3, 3.3)], 9));
  const upperOutline: [number, number][] = [[-9, 5.16], [9, 5.16], [9, 9.15], [-9, 9.15]];
  parts.push(...glazedFace("上层高街公众直接平层进入办货厅的真实入口及采光窗", "xy", upperOutline, [-6, -2.5, 6].map(x => rectangle(x, 6.5, 2.0, 1.5)), [rectangle(1.5, 5.39, 2.4, 2.8)], -9), ...glazedFace("高营业厅面向低货院但不把后屋面当通路的完整窗墙", "xy", upperOutline, [-6.2, -2, 2.5, 6.3].map(x => rectangle(x, 6.5, 2.0, 1.5)), [], 0));
  for (const x of [-9, 9]) parts.push(...glazedFace("上层半幅公众营业厅真正封合并与柱网接合的侧窗墙", "yz", [[-9, 5.16], [0, 5.16], [0, 9.15], [-9, 9.15]], [-6.4, -2.6].map(z => rectangle(z, 6.5, 2.1, 1.5)), [], x));
  const bumpers: Triple[] = [];
  for (const x of [-5.7, 0, 5.7]) {
    parts.push(box("下层货仓各自真正同高接出的独立后街接车月台", x, 0.8, 9.3, 4.2, 1.2, 2.8, concrete), box("独立接车月台边缘实际叠接的短装卸搭板", x, 1.34, 10.65, 3.2, 0.12, 0.45, metal), box("后街三月台上方与仓墙真实接合的独立短雨棚", x, 4.95, 9.3, 4.6, 0.14, 3.2, roofColor));
    for (const side of [-1, 1]) { bumpers.push([x + side * 1.75, 1.05, 10.74]); parts.push(rail([x + side * 1.8, 4.75, 8], [x + side * 1.8, 4.91, 10.6], 0.1, metal)); }
  }
  parts.push(...boxBatch("三个后街月台正面真实搭接的独立防撞缓冲块合批", "#536864", bumpers, [0.18, 0.55, 0.18]));
  const streetPosts: Triple[] = [-12, 12].flatMap(x => [-17.7, -13.8, -9.05].map(z => [x, 5.92, z] as Triple));
  for (const x of [-9.05, 9.05]) streetPosts.push([x, 5.92, -9.05]);
  parts.push(...boxBatch("高街承岸两侧实际落在实心岸台边缘的防坠栏柱合批", metal, streetPosts, [0.1, 1.08, 0.1]));
  for (const side of [-1, 1]) for (const y of [5.98, 6.42]) parts.push(box("高街承岸外侧不封公众前入口的连续防坠横栏", side * 12, y, -13.55, 0.1, 0.08, 9.1, metal), box("承岸后缘真正接回营业楼侧墙的短防坠回栏", side * 10.5, y, -9.05, 3, 0.08, 0.08, metal));
  return parts;
}

export const everydayFreightBuildingSpaceBatchFiveDesigns: ArchitecturePrototype[] = [
  design("双街错层托运营业站", "实心高街承岸直接平层进入仅覆盖前半仓区的公众办货厅，低街货院服务下层三个独立接车月台；两跑薄底内阶穿过真实楼板井连接人员路线，侧面长缓坡只接下货仓，完整分离高街公众与低街装卸并由连续柱梁承托半幅上楼和后低屋面", splitStreetFreightAgency, "建筑", "现代"),
];
