import type { ModelPart, Triple } from "../assetModelParts";
import { boxBatch } from "./everydayOutdoorSpaceBatchOne";
import { glazedFace, rectangle } from "./everydayWorkplaceSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { xYWall } from "./futureSpaceBatchTen";
import { box, design, type ArchitecturePrototype } from "./structures";

const concrete = "#a4aa9f", paving = "#b7b4a2", metal = "#60777a", brick = "#a69c87", timber = "#9b8160", roofColor = "#7d8e86";

function coalMerchantRailYard(): ModelPart[] {
  const parts: ModelPart[] = [
    box("低位装售车院与高铁路栈共同落地的完整场坪", 0, 0.1, 0, 44, 0.2, 36, paving),
    ...boxBatch("三座独立分仓在厚墙之间真实落地的完整仓底合批", "#68766b", [-8, 0, 8].map((x): Triple => [x, 0.25, 5]), [7.6, 0.1, 6]),
    ...boxBatch("高铁路栈下方连续承载并真正分成三仓的四道重墙合批", concrete, [-12, -4, 4, 12].map((x): Triple => [x, 2, 5]), [0.4, 3.6, 6.5]),
    box("三分仓后部从场坪接到高栈承梁的完整厚背墙", 0, 2, 8.2, 24.4, 3.6, 0.4, concrete),
    ...[-1, 1].map(side => box("高铁路栈两端真实接到外部高岸线的完整承地桥台", side * 16.5, 2, 6, 9, 3.6, 4.6, brick)),
    ...boxBatch("分仓重墙顶实际接承双轨主梁和两条检修廊的连续横帽梁合批", metal, [-12, -4, 4, 12].map((x): Triple => [x, 3.78, 6]), [0.5, 0.24, 4.6]),
    ...[-1, 1].map(side => box("沿每根钢轨全长连续承重且不封两轨间落料槽的独立纵梁", 0, 3.82, 6 + side * 0.7525, 42, 0.36, 0.24, metal)),
    ...boxBatch("开敞落料轨栈两纵梁之间保持轨距的窄横枕梁合批", timber, Array.from({ length: 16 }, (_, index): Triple => [-19.5 + index * 2.6, 3.95, 6]), [0.22, 0.1, 2.8]),
    ...[-1, 1].map(side => box("高轨接岸桥台上与主纵梁全长相叠的完整标准轨距钢轨", 0, 4.055, 6 + side * 0.7525, 42, 0.13, 0.07, metal)),
    ...[4, 8].flatMap(z => [box("落料轨栈外侧由帽梁和长托梁实际承托的完整检修步廊", 0, 3.94, z, 42, 0.12, 0.65, metal), box("检修步廊下方与帽梁实际相叠的连续纵向托梁", 0, 3.8, z, 42, 0.24, 0.16, metal)]),
    box("煤商独立公众营业室的完整低位落地地台", 16, 0.35, -10, 8, 0.3, 8, concrete),
    box("公众营业室四侧窗墙真实共同承托的完整薄平屋盖", 16, 3.7, -10, 8.6, 0.2, 8.6, roofColor),
    stairFlight("公众从前街直接进入营业室的独立两级短阶", [16, 0.2, -14.8], 2, 0.15, 0.5, 2.2),
    box("营业后门与低装运车院真实接合的短落脚台", 13.5, 0.425, -5.95, 1.6, 0.15, 0.5, concrete),
    box("营业厅避开公众入口与后场门的固定装售柜基体", 18, 1.01, -10, 1.2, 1.02, 3.4, timber),
    box("装售柜基体上实际搭接的完整柜面", 18, 1.56, -10, 1.4, 0.1, 3.6, timber),
  ];
  parts.push(xYWall("三座低装运仓分别真正开通至车院的完整厚前壁", [[-12.2, 0.2], [12.2, 0.2], [12.2, 3.8], [-12.2, 3.8]], [-8, 0, 8].map(x => rectangle(x, 0.29, 3.2, 2.1)), 2, 0.4, concrete));
  const guardPosts: Triple[] = [];
  for (const [z, ranges, posts] of [[3.7, [[-21, 17.5], [19.5, 21]], [-20.8, -12, -4, 4, 12, 17.5, 19.5, 20.8]], [8.3, [[-21, -19.5], [-17.5, 21]], [-20.8, -19.5, -17.5, -12, -4, 4, 12, 20.8]]] as [number, [number, number][], number[]][]) {
    for (const x of posts) guardPosts.push([x, 4.54, z]);
    for (const [a, b] of ranges) for (const y of [4.6, 5.1]) parts.push(box("检修廊外缘真实为人员阶道留开口的连续防护横栏", (a + b) / 2, y, z, b - a, 0.08, 0.08, metal));
  }
  parts.push(...boxBatch("从实际步廊面接起并承托上下横栏的完整护栏柱合批", metal, guardPosts, [0.08, 1.12, 0.08]));
  for (const side of [-1, 1]) {
    const x = side * 18.5, startZ = side > 0 ? -3 : 15, midZ = side > 0 ? 0.3 : 11.7, upperZ = side > 0 ? 0.6 : 11.4, topZ = side > 0 ? 3.95 : 8.05;
    const lower = stairFlight("低装运车院真实接入轨栈检修廊的下跑独立人员阶", [x, 0.2, startZ], 10, 0.19, 0.3, 1.4), upper = stairFlight("转接平台到高检修廊且保留阶下净空的上跑人员阶", [x, 2.1, upperZ], 10, 0.19, 0.3, 1.4, 0.18);
    if (side < 0) { lower.rotation.y = 90; upper.rotation.y = 90; }
    parts.push(lower, upper, box("两跑人员阶真正连续相叠的中间休息平台", x, 2.0, midZ, 1.6, 0.2, 0.8, metal), box("上跑阶体与高检修步廊真正相叠的完整落脚台", x, 3.9, topZ, 1.6, 0.2, 0.8, metal));
    for (const edge of [-1, 1]) parts.push(box("中间休息平台避开阶道并真实落到场坪的独立承柱", x + edge * 0.6, 1.06, midZ, 0.16, 1.72, 0.16, metal));
  }
  const officeOutline: [number, number][] = [[12, 0.2], [20, 0.2], [20, 3.65], [12, 3.65]];
  parts.push(...glazedFace("公众营业室面向前街的真实入口与左右独立采光窗", "xy", officeOutline, [13.5, 18.5].map(x => rectangle(x, 1.3, 1.6, 1.2)), [rectangle(16, 0.49, 1.6, 2.5)], -14), ...glazedFace("营业室面向装运院的独立职员后门及观察窗", "xy", officeOutline, [rectangle(18, 1.4, 2, 1.2)], [rectangle(13.5, 0.49, 1.2, 2.3)], -6));
  for (const x of [12, 20]) parts.push(...glazedFace("公众营业室完整封合且真实开窗的侧壁", "yz", [[-14, 0.2], [-6, 0.2], [-6, 3.65], [-14, 3.65]], [rectangle(-10, 1.3, 2.4, 1.2)], [], x));
  const backStep = stairFlight("职员从营业后门独立接入装运院的两级短阶", [13.5, 0.2, -4.9], 2, 0.15, 0.5, 1.6); backStep.rotation.y = 90; parts.push(backStep);
  return parts;
}

export const everydayFreightBuildingSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("铁路高栈分仓煤商装售院", "高位铁路通过两端完整接岸桥台跨过三座厚壁分仓，两轨间与窄枕梁之间保持真实落料空槽，低位车院分别进入各分仓取运；公众装售营业室与货车路径分开，前后独立两跑人员阶经真实护栏开口接上轨侧检修廊", coalMerchantRailYard, "建筑", "现代"),
];
