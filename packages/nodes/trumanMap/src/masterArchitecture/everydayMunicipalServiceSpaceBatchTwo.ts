import { part } from "../assetModelParts";
import type { ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design } from "./structures";
import type { ArchitecturePrototype } from "./structures";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { boxesMesh } from "./publicSpaceBatchEight";
import type { SolidBox } from "./publicSpaceBatchEight";

const concrete = "#aaafa6";
const paving = "#b6ad97";
const wall = "#c6c5b5";
const roof = "#778c87";
const timber = "#a18b6b";
const dark = "#596c6d";

function centralDispatchPoliceStation(): ModelPart[] {
  const floor = .2, upper = 3.5;
  const shaft: [number, number][] = [[-15.45, 7.1], [-12.55, 7.1], [-12.55, 13.4], [-15.45, 13.4]];
  const p: ModelPart[] = [
    box("接待调度工作带和贯通车廊共用的完整落地基础", 0, .1, 1, 38, .2, 36, concrete),
    box("整楼各带之间同标高连续相通的室内地面饰层", 0, .1965, 1, 32, .017, 30, paving),
    polygon("左双层工作带真正留出独立长梯井的完整上层楼板", paving, [[-16, -5], [-6, -5], [-6, 16], [-16, 16]], .25, [0, upper - .25, 0], [shaft]),
    box("后方简报工作层与左工作带同高相接的完整楼板", 0, upper - .125, 13, 12, .25, 6, paving),
    box("通高调度厅西侧真正接回工作带的上层观察廊楼面", -4.65, upper - .1, 2.6, 2.9, .2, 14.8, paving),
    box("前方公众接待厅低屋盖在观察廊前缘真正收头", -5, 3.9, -9.62, 22.48, .24, 9.24, roof),
    box("左工作带接在两层门窗外墙上的完整平屋盖", -11, 6.9, 5.5, 10.48, .24, 21.48, roof),
    box("后简报工作房与左工作带同高的完整屋盖", 0, 6.9, 13, 12.48, .24, 6.48, roof),
    box("中央通高调度厅由四面高壁承住的独立高屋盖", 0, 7.5, 2.5, 12.48, .24, 15.48, roof),
    box("受控车辆从首门直穿尾门的完整较低车廊屋盖", 11, 5.1, 1, 10.5, .24, 30.5, roof),
    part("前场接入贯通车辆廊同高地面的完整低缓坡", "extrude", paving, [11, 0, -18], [1, 1, 1], [0, 90, 0], { depth: 5.5, profile: [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: -1, y: .2 }] }),
    part("贯通车辆廊驶离后场的完整低缓坡", "extrude", paving, [11, 0, 20], [1, 1, 1], [0, -90, 0], { depth: 5.5, profile: [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: -1, y: .2 }] }),
    part("公共接待入口独立避开车廊的室外低缓坡", "extrude", paving, [-5, 0, -18], [1, 1, 1], [0, 90, 0], { depth: 3.6, profile: [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: -1, y: .2 }] }),
  ];
  p.push(
    ...glazedWall("公共接待厅面向街道的独立主门和真实侧窗", [-16, -14], [6, -14], floor, 3.8, [[-7.2, 1.1, 4.4, 1.6], [7.2, 1.1, 4.4, 1.6]], [[0, floor, 3.2, 2.6]]),
    ...glazedWall("接待厅西侧封合且有真实采光孔的短外壁", [-16, -14], [-16, -5], floor, 3.8, [[0, 1.1, 4.6, 1.6]]),
    ...glazedWall("接待厅后方分别接工作廊与通高中枢的实际双门墙", [-16, -5], [6, -5], floor, 3.8, [], [[-3, floor, 1.4, 2.4], [5, floor, 1.8, 2.4]]),
    ...glazedWall("通高中枢在低接待屋面之上完整闭合的前高侧窗墙", [-6, -5], [6, -5], 3.8, 7.4, [[0, 4.8, 7.2, 1.6]]),
    ...glazedWall("前接待厅和受控车廊之间连续隔开的完整实墙", [6, -14], [6, -5], floor, 5, []),
    ...glazedWall("车辆廊首端真正敞通的宽高车辆入口", [6, -14], [16, -14], floor, 5, [], [[0, floor, 4.5, 4.1]]),
    ...glazedWall("车辆廊尾端真正敞通的独立驶离出口", [6, 16], [16, 16], floor, 5, [], [[0, floor, 4.5, 4.1]]),
    ...glazedWall("贯通车廊远侧由高窗采光且不侵入车辆净空的外墙", [16, -14], [16, 16], floor, 5, [[-10, 3.5, 4.2, .9], [-3.3, 3.5, 4.2, .9], [3.3, 3.5, 4.2, .9], [10, 3.5, 4.2, .9]]),
    ...glazedWall("通高中枢与侧车辆廊之间真正开人员侧门的高隔壁", [6, -5], [6, 10], floor, 7.4, [[0, 5.6, 9.5, 1.1]], [[-.5, floor, 1.2, 2.4]]),
    ...glazedWall("后办案工作区与侧车廊独立接通且上层高位采光的墙", [6, 10], [6, 16], floor, 6.8, [[0, 5.4, 3.2, 1]], [[0, floor, 1.2, 2.4]]),
    ...glazedWall("通高中枢西侧分层接入工作廊和观察廊的真门窗墙", [-6, -5], [-6, 10], floor, 7.4, [[3.5, 4.3, 3, 1.4]], [[-2.5, floor, 1.2, 2.4], [-2.5, upper, 1.2, 2.4]]),
    ...glazedWall("调度厅后端分别接下层办案廊和上层观察廊出口的高壁", [-6, 10], [6, 10], floor, 7.4, [[0, 4.3, 6, 1.5]], [[0, floor, 1.4, 2.4], [-4.7, upper, 1.2, 2.4]]),
    ...glazedWall("后工作层与左工作廊之间真实上下分层开门的隔墙", [-6, 10], [-6, 16], floor, 6.8, [], [[0, floor, 1.1, 2.4], [0, upper, 1.1, 2.4]]),
    ...glazedWall("后办案区的独立地面出口和上简报室的真实采光窗墙", [-6, 16], [6, 16], floor, 6.8, [[-3.6, 2.2, 1.7, .6], [3.6, 2.2, 1.7, .6], [-3.6, 4.3, 2.5, 1.5], [3.6, 4.3, 2.5, 1.5]], [[0, floor, 1.4, 2.4]]),
    ...glazedWall("左双层工作带完整西外墙的独立两层采光窗", [-16, -5], [-16, 16], floor, 6.8, [-1.5, 4, 12].flatMap(z => [[z - 5.5, 1.1, 2.8, 1.6], [z - 5.5, 4.3, 2.8, 1.6]] as [number, number, number, number][])),
    ...glazedWall("工作带上层在低接待厅屋面之后完整封合的前窗墙", [-16, -5], [-6, -5], upper, 6.8, [[-2.5, 4.3, 2.3, 1.5], [2.5, 4.3, 2.3, 1.5]]),
    ...glazedWall("左双层工作带后端接地承屋的完整两层后窗墙", [-16, 16], [-6, 16], floor, 6.8, [[0, 1.1, 4.2, 1.6], [0, 4.3, 4.2, 1.6]]),
    ...glazedWall("两层独立办公室及梯室分别通向工作走廊的真实门口", [-10, -5], [-10, 16], floor, 6.8, [], [-1.5, 4, 7].flatMap(z => [[z - 5.5, floor, 1.1, 2.4], [z - 5.5, upper, 1.1, 2.4]] as [number, number, number, number][])),
  );
  for (const z of [2, 6]) p.push(box("工作带上下独立房间之间贯通承屋的完整隔墙", -13, 3.5, z, 6, 6.6, .18, wall));
  for (const side of [-1, 1]) p.push(...glazedWall("后双办案室由中央受控短廊分别进入的真实独立内门", [side, 10], [side, 16], floor, 3.5, [], [[0, floor, 1.1, 2.4]]));
  const lowerStair = stairFlight("从独立梯室低端实际向上进入长梯井的第一跑实体梯", [-14, floor, 7.3], 10, .165, .3, 2.3);
  const upperStair = stairFlight("穿过真实长梯井接到上层落脚台的第二跑厚腰梯", [-14, 1.85, 10.29], 10, .165, .3, 2.3, .18);
  lowerStair.color = concrete; upperStair.color = concrete;
  p.push(lowerStair, upperStair, box("上层长梯井高端真正接回完整楼板的宽落脚台", -14, upper - .125, 13.69, 2.9, .25, .82, paving));
  for (const z of [-3.8, 2.6, 9.2]) p.push(box("观察廊悬边下从地面实际接到廊底的承重细柱", -3.3, 1.76, z, .2, 3.12, .2, concrete));
  const guards: SolidBox[] = [
    { center: [-15.45, 4.55, 10.25], size: [.07, .07, 6.3] },
    { center: [-12.55, 4.55, 10.25], size: [.07, .07, 6.3] },
    { center: [-14, 4.55, 7.1], size: [2.9, .07, .07] },
    { center: [-3.2, 4.55, 2.6], size: [.07, .07, 14.8] },
    { center: [-4.65, 4.55, -4.8], size: [2.9, .07, .07] },
  ];
  for (const x of [-15.45, -12.55]) for (const z of [7.1, 10.25, 13.4]) guards.push({ center: [x, 4.025, z], size: [.07, 1.05, .07] });
  for (const z of [-4.8, 0, 5, 10]) guards.push({ center: [-3.2, 4.025, z], size: [.07, 1.05, .07] });
  guards.push({ center: [-6.1, 4.025, -4.8], size: [.07, 1.05, .07] });
  p.push(boxesMesh("长梯洞与通高观察廊边缘实际连续且让开高端出口的护栏", dark, guards));
  const furnishings: SolidBox[] = [
    { center: [-12, .7, -8.7], size: [4.2, 1, 1] },
    { center: [-1.6, .375, -11], size: [4, .35, .5] },
    { center: [-1.6, .6, -11], size: [4.2, .1, .75] },
    { center: [-.8, .65, 1.8], size: [2.2, .9, 1.1] },
    { center: [2.1, .65, 4.8], size: [2.2, .9, 1.1] },
    { center: [-3.6, .45, 14.5], size: [4, .5, .7] },
    { center: [3.6, .45, 14.5], size: [4, .5, .7] },
    { center: [0, 3.875, 13.6], size: [.6, .75, 1] },
    { center: [0, 4.3, 13.6], size: [4.6, .1, 1.3] },
  ];
  for (const y of [.2, upper]) for (const z of [-1.5, 4]) furnishings.push({ center: [-13, y + .4, z], size: [.6, .8, .8] }, { center: [-13, y + .85, z], size: [2.4, .1, 1] });
  p.push(boxesMesh("接待操作等候办案与上下独立工作房实际落地承接的完整桌台", timber, furnishings));
  return p;
}

export const everydayMunicipalServiceSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("通高中枢侧车廊警务楼", "前公共接待厅接入通高观察调度中枢，左双层工作带经真实长梯井与有柱观察廊连接后简报层，右侧宽车辆廊由首尾高门独立贯通并以侧门接入后受控办案双室", centralDispatchPoliceStation, "建筑", "现代"),
];
