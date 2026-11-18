import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { wallYz } from "./everydayWorkplaceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, design, rail, type ArchitecturePrototype } from "./structures";

const paving = "#b2b7a9", steel = "#5a7578", roof = "#718982", wood = "#a38c66";

export const everydayWaterfrontBuildingSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("堤顶堤脚双入骑行驿站楼", "堤脚修理与停推车层、堤顶休憩接待层组成真实双层完整服务楼，西侧两段十八米填实缓坡通过大折返台连接外侧高走廊，最后穿过前观景廊进入上层；两层另有独立内楼梯穿过真实梯井，岸后高地台与上层门平接，低层宽门和坡廊各自独立，坡栏与平台均有实际支承", riversideCycleServiceBuilding, "建筑", "现代"),
];

function riversideCycleServiceBuilding(): ModelPart[] {
  const hole: [number, number][] = [[4.8, -1.5], [7.7, -1.5], [7.7, 2.1], [4.8, 2.1]];
  const p: ModelPart[] = [
    box("堤脚驿站外坡与高低入口共同落地的完整场坪", -1.5, .1, -3, 25, .2, 32, paving),
    box("下层修理与推车空间完整室内地坪", 2, .3, 0, 12, .2, 12, paving),
    polygon("完整上层休憩楼面为独立折返梯真实留出梯井", paving, [[-4, -6], [8, -6], [8, 6], [-4, 6]], .25, [0, 3.15, 0], [hole]),
    box("驿站上下两层承墙共同接实的完整遮阳平屋盖", 2, 6.5, 0, 12.6, .2, 12.6, roof),
    box("岸后堤顶入口真实接平上层楼面的实心高地台", 2, 1.8, 8, 12.4, 3.2, 4, paving),
    box("两段外坡之间具有真实转弯宽度的实心折返平台", -8.7, 1, 5.5, 6.4, 1.6, 3, paving),
    box("外坡高端转向高走廊的完整实心落脚平台", -4.75, 1.8, -15, 7.1, 3.2, 2, paving),
    box("由独立柱梁承托并平接前廊的上层长走道", -2.6, 3.3, -11, 2.8, .2, 6, paving),
    box("外高走道实际接入二层入口的完整前观景廊", 2, 3.3, -7.1, 12.2, .2, 2.2, paving),
    box("室内第一跑和第二跑之间实际连接的折返落脚台", 6.35, 1.8, 1.4, 2.8, .2, .8, paving),
    ...glazedWall("下层临堤脚前场可推车进入的真实宽门", [8, -6], [-4, -6], .4, 3.15, [[-4, 1.2, 2.2, 1.25]], [[2, .4, 2.8, 2.4]]),
    ...glazedWall("下层完整靠堤后墙保留修理作业空间", [-4, 6], [8, 6], .4, 3.15, []),
    ...glazedWall("下层西侧独立实际采光窗", [-4, -6], [-4, 6], .4, 3.15, [[1, 1.4, 5, 1.2]]),
    ...glazedWall("下层面向侧场地的独立工作出口", [8, 6], [8, -6], .4, 3.15, [[-3.8, 1.4, 2.8, 1.2]], [[3.5, .4, 1.8, 2.4]]),
    ...glazedWall("二层前廊的推行入口与休憩厅外门分别实际贯通", [-4, -6], [8, -6], 3.4, 6.4, [[0, 4.2, 2.5, 1.55]], [[-4.6, 3.4, 1.8, 2.5], [2.6, 3.4, 1.8, 2.5]]),
    ...glazedWall("堤顶高地台真实接入二层休憩接待厅的后门", [-4, 6], [8, 6], 3.4, 6.4, [[-3.7, 4.3, 2.6, 1.5]], [[0, 3.4, 2.2, 2.5]]),
    ...glazedWall("二层西侧长廊真实观察窗", [-4, -6], [-4, 6], 3.4, 6.4, [[0, 4.2, 9.5, 1.55]]),
    ...glazedWall("二层东侧实际贯通的休憩采光窗", [8, 6], [8, -6], 3.4, 6.4, [[0, 4.2, 9.5, 1.55]]),
  ];
  for (const [x, start, end, low, high] of [[-10.5, -14, 4, .2, 1.8], [-6.9, 4, -14, 1.8, 3.4]]) {
    const profile = [{ x: start!, y: .2 }, { x: end!, y: .2 }, { x: end!, y: high! }];
    if (low! > .2) profile.push({ x: start!, y: low! });
    p.push(part("从场坪填实到连续骑行坡面而非悬空斜板的十八米长缓坡", "extrude", paving, [x!, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 2.8, profile }));
    for (const side of [-1, 1]) p.push(wallYz("全部沿真实外坡边缘落脚并随坡升高的实心护栏", [[start!, low!], [end!, high!], [end!, high! + 1], [start!, low! + 1]], [], x! + side * 1.32, .08, steel));
  }
  for (const [x, y, z, reverse] of [[5.5, .4, -1.5, false], [7.1, 1.9, 1, true]] as const) {
    const flight = stairFlight("独立内梯井中两跑相接的十级有腰板人行梯", [x, y, z], 10, .15, .25, 1.1, .16);
    if (reverse) flight.rotation.y = 90;
    p.push(flight);
    for (const side of [-1, 1]) p.push({ ...rail([x + side * .49, y + 1, z], [x + side * .49, y + 2.5, z + (reverse ? -2.5 : 2.5)], .05, steel), name: "真实站在内梯踏板实宽之内的连续斜扶手" });
  }
  p.push(part("下层宽门前填实接平室内地坪的推车短缓坡", "extrude", paving, [0, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 3.2, profile: [{ x: -8, y: .2 }, { x: -6, y: .2 }, { x: -6, y: .4 }] }), part("下层侧工作门接平外场的独立推车短缓坡", "extrude", paving, [0, 0, -3.5], [1, 1, 1], [0, 0, 0], { depth: 2.1, profile: [{ x: 8, y: .2 }, { x: 10, y: .2 }, { x: 8, y: .4 }] }));
  const support: SolidBox[] = [];
  for (const x of [-3.7, -1.5]) for (const z of [-12.5, -9.5]) support.push({ center: [x, 1.7, z], size: [.22, 3, .22] });
  for (const z of [-12.5, -9.5]) support.push({ center: [-2.6, 3.1, z], size: [3, .2, .24] });
  for (const x of [-3.8, 7.8]) support.push({ center: [x, 1.7, -7.8], size: [.24, 3, .24] });
  for (const z of [-7.8, -6.05]) support.push({ center: [2, 3.05, z], size: [12.2, .3, .22] });
  for (const x of [5.05, 7.65]) support.push({ center: [x, 1.05, 1.7], size: [.12, 1.3, .12] });
  for (const x of [-3.85, 7.85]) for (const z of [-5.8, 5.8]) support.push({ center: [x, 1.775, z], size: [.2, 2.75, .2] });
  p.push(boxesMesh("高走廊前观景廊及内梯平台的实际落地柱和接实梁", steel, support));
  const guards: SolidBox[] = [
    { center: [-8.7, 2.3, 6.95], size: [6.4, 1, .1] }, { center: [-11.85, 2.3, 5.5], size: [.1, 1, 3] }, { center: [-5.55, 2.3, 5.5], size: [.1, 1, 3] },
    { center: [-4.75, 3.9, -15.95], size: [7.1, 1, .1] }, { center: [-8.25, 3.9, -15], size: [.1, 1, 2] }, { center: [-1.25, 3.9, -15], size: [.1, 1, 2] }, { center: [-4.75, 3.9, -14.05], size: [1.5, 1, .1] },
    { center: [-3.95, 3.9, -11.1], size: [.1, 1, 5.8] }, { center: [-1.25, 3.9, -11.1], size: [.1, 1, 5.8] },
    { center: [3.45, 3.9, -8.15], size: [9.3, 1, .1] }, { center: [-4.05, 3.9, -7.1], size: [.1, 1, 2.2] }, { center: [8.05, 3.9, -7.1], size: [.1, 1, 2.2] },
    { center: [-4.15, 3.9, 8], size: [.1, 1, 4] }, { center: [8.15, 3.9, 8], size: [.1, 1, 4] },
    { center: [4.75, 3.9, .3], size: [.1, 1, 3.6] }, { center: [7.85, 3.9, .3], size: [.1, 1, 3.6] }, { center: [6.3, 3.9, 2.15], size: [3.2, 1, .1] }, { center: [5.675, 3.9, -1.55], size: [1.75, 1, .1] },
    { center: [6.35, 2.4, 1.75], size: [2.8, 1, .1] }, { center: [4.99, 2.4, 1.4], size: [.08, 1, .8] }, { center: [7.71, 2.4, 1.4], size: [.08, 1, .8] },
  ];
  p.push(boxesMesh("只围住真实落脚边缘并保留全部外坡内梯接入口的实体护栏", steel, guards));
  const posts: SolidBox[] = [];
  for (const [x, y, z, reverse] of [[5.5, .4, -1.5, false], [7.1, 1.9, 1, true]] as const) for (const side of [-1, 1]) for (const end of [0, 1]) posts.push({ center: [x + side * .49, y + end * 1.5 + .5, z + (reverse ? -2.5 : 2.5) * end], size: [.05, 1, .05] });
  p.push(boxesMesh("两跑内梯扶手端部各自真实立在踏板和平台上的细立柱", steel, posts));
  const fittings: SolidBox[] = [{ center: [-2.5, 1.05, 2.5], size: [2.2, .12, 2.4] }, { center: [-3.54, 1.85, 2.5], size: [.12, 1.5, 2.6] }, { center: [-3.25, 3.7, 2], size: [.9, .6, 4] }, { center: [2, 3.9, .5], size: [.7, 1, .7] }, { center: [2, 4.45, .5], size: [2.6, .1, 2] }];
  for (const x of [-3.3, -1.7]) for (const z of [1.55, 3.45]) fittings.push({ center: [x, .695, z], size: [.12, .59, .12] });
  p.push(boxesMesh("下层修理台实腿工具背板及上层实际落地休憩坐台桌面", wood, fittings));
  for (const x of [0, 2, 4]) p.push(rail([x, .4, 3.8], [x, 1.15, 3.8], .07, steel), rail([x + .7, .4, 3.8], [x + .7, 1.15, 3.8], .07, steel), rail([x, 1.15, 3.8], [x + .7, 1.15, 3.8], .07, steel));
  return p;
}
