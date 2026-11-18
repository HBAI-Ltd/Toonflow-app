import type { ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchSteps";
import { box, design, rail, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b7b9a8", steel = "#657d77", wood = "#a48c67", earth = "#8f9e7e", dark = "#52686a";

function courtyardBridgeVisitorCenter(): ModelPart[] {
  const garden: [number, number][] = [[-4, -3.8], [4, -3.8], [4, 1.5], [-4, 1.5]];
  const upper: [number, number][] = [[8, -10.24], [14.24, -10.24], [14.24, 10.24], [-10, 10.24], [-10, 3], [8, 3]];
  const stairWell: [number, number][] = [[9.2, -.3], [13.2, -.3], [13.2, 3.8], [9.2, 3.8]];
  const lowRoof: [number, number][] = [[-14.24, -10.24], [8, -10.24], [8, -6], [-8, -6], [-8, 3], [-10, 3], [-10, 10.24], [-14.24, 10.24]];
  const parts: ModelPart[] = [
    box("游客中心完整落地前场与穿园廊共同场坪", 0, .1, 0, 32, .2, 24, paving),
    hardFloor("前厅两侧房翼与后部穿园廊同高且让出导览绿庭的完整地坪", paving, [[-14.24, -10.24], [14.24, -10.24], [14.24, 10.24], [-14.24, 10.24]], .1, [0, .2, 0], [garden]),
    box("开放导览庭内直接承在原场坪上的低位种植土", 0, .225, -1.15, 8, .05, 5.3, earth),
    hardFloor("前接待厅与西静展翼接合且避开上层横厅的完整低屋盖", steel, lowRoof, .2, [0, 3.7, 0]),
    hardFloor("东上廊接向后部完整跨庭展厅并真正挖出折返梯井的L形楼板", paving, upper, .2, [0, 3.7, 0], [stairWell]),
    hardFloor("上层长侧廊和后部横展厅共同的完整L形封闭屋盖", steel, upper, .2, [0, 7.2, 0]),
    ...glazedWall("前接待厅的公共主门和两侧真实采光窗", [-14, -10], [14, -10], .3, 3.7, [[-8.5, 1.2, 5, 1.6], [8.5, 1.2, 5, 1.6]], [[0, .3, 3.5, 2.7]]),
    ...glazedWall("前厅分别进入露天导览庭西静展翼和东梯厅的真实三门", [-14, -6], [14, -6], .3, 3.7, [], [[-11, .3, 1.8, 2.5], [0, .3, 6, 2.7], [11, .3, 2, 2.5]]),
    ...glazedWall("西静展房翼临步道的完整实际窗墙", [-14, -10], [-14, 10], .3, 3.7, [[-2.8, 1.2, 4.5, 1.7], [5.4, 1.2, 4.5, 1.7]]),
    ...glazedWall("西静展房从导览庭进入的宽门与向庭真实展窗", [-8, -6], [-8, 10], .3, 3.7, [[3, 1.2, 6, 1.7]], [[-4.5, .3, 2.1, 2.5]]),
    ...glazedWall("东侧接待梯厅从导览庭进入的真门与后部采光窗", [8, -6], [8, 10], .3, 3.7, [[4, 1.3, 3.3, 1.6]], [[-4, .3, 2, 2.5]]),
    ...glazedWall("东侧整长房翼避开内梯的低层真实外窗", [14, -10], [14, 10], .3, 3.7, [[-6.5, 1.2, 3.5, 1.6], [7, 1.2, 3.8, 1.6]]),
    ...glazedWall("西展房后端实际退出门与独立侧窗", [-14, 10], [-8, 10], .3, 3.7, [[-1.3, 1.2, 2.5, 1.7]], [[1.6, .3, 1.4, 2.5]]),
    ...glazedWall("东侧梯厅后端直接进入园内的真实低层门", [8, 10], [14, 10], .3, 3.7, [], [[0, .3, 1.8, 2.5]]),
    ...glazedWall("上层侧廊前端实际封合的完整窗墙", [8, -10], [14, -10], 3.9, 7.2, [[0, 4.8, 4.6, 1.8]]),
    ...glazedWall("上层侧廊外侧连续承屋且真实开三组窗的完整外壁", [14, -10], [14, 10], 3.9, 7.2, [[-6.5, 4.8, 4.6, 1.8], [0, 4.8, 4.6, 1.8], [6.5, 4.8, 4.6, 1.8]]),
    ...glazedWall("完整跨庭展厅与侧廊后端共同的真实长窗立面", [-10, 10], [14, 10], 3.9, 7.2, [[-8, 4.8, 5, 1.8], [0, 4.8, 5, 1.8], [8, 4.8, 5, 1.8]]),
    ...glazedWall("跨庭展厅西端真实采光并直接接承上层屋盖的外壁", [-10, 3], [-10, 10], 3.9, 7.2, [[0, 4.8, 5.4, 1.8]]),
    ...glazedWall("跨庭展厅朝开放导览庭的整幅实际长窗", [-10, 3], [8, 3], 3.9, 7.2, [[0, 4.6, 14, 2]]),
    ...glazedWall("东上廊面向绿庭与前低厅的实际高窗墙", [8, -10], [8, 3], 3.9, 7.2, [[-3, 4.8, 4.4, 1.8], [4.5, 4.8, 2.3, 1.8]]),
    stairFlight("东梯厅由地面真正上接中平台的首跑十级实阶", 10.1, .3, 0, 1.4, 10, .18, .3),
    stairFlight("从中平台折返并实际接上廊落脚台的第二跑十级实阶", 12.2, 2.1, 3, 1.4, 10, .18, .3, true),
    box("两跑实阶同标高接合的完整中间休息平台", 11.15, 2, 3.4, 3.5, .2, .8, paving),
    box("高端实阶与上廊楼板同高相接而不重复覆盖楼面的落脚平台", 12.2, 3.8, -.15, 1.8, .2, .3, paving),
  ];
  const structure: SolidBox[] = [];
  for (const x of [-9.7, 7.7]) for (const z of [3.3, 9.7]) structure.push({ center: [x, 1.93, z], size: [.3, 3.26, .3] });
  for (const z of [3.3, 9.7]) structure.push({ center: [-1, 3.56, z], size: [17.7, .28, .4] });
  for (const x of [-9.7, 7.7]) structure.push({ center: [x, 3.56, 6.5], size: [.4, .28, 6.4] });
  for (const x of [9.5, 12.8]) structure.push({ center: [x, 1.1, 3.6], size: [.15, 1.6, .15] });
  parts.push(boxesMesh("下层穿园廊两侧落地柱与真实承接横展厅楼板的纵横梁及梯平台柱", steel, structure));
  const wellGuards: SolidBox[] = [
    { center: [9.2, 4.425, 1.75], size: [.08, 1.05, 4.1] },
    { center: [13.2, 4.425, 1.75], size: [.08, 1.05, 4.1] },
    { center: [11.2, 4.425, 3.8], size: [4, 1.05, .08] },
    { center: [10.25, 4.425, -.3], size: [2.1, 1.05, .08] },
    { center: [13.15, 4.425, -.3], size: [.1, 1.05, .08] },
  ];
  parts.push(boxesMesh("真实梯井四周连续防护并只在高端落脚台保留通口的完整护壁", dark, wellGuards));
  const posts: SolidBox[] = [];
  for (const [center, low, start, end] of [[10.1, .3, 0, 3], [12.2, 2.1, 3, 0]] as const) for (const side of [-1, 1]) {
    const x = center + side * .66;
    parts.push({ ...rail([x, low + 1, start], [x, low + 2.8, end], .05, steel), name: "逐跑实际跟随踏级坡度并接到平台的完整扶手" });
    for (const high of [false, true]) posts.push({ center: [x, low + (high ? 1.8 : 0) + .5, high ? end : start], size: [.05, 1, .05] });
  }
  parts.push(boxesMesh("两跑楼梯扶手两端分别真实落在实阶或平台上的独立栏柱", steel, posts));
  const furnishings: SolidBox[] = [
    { center: [4.5, .8, -8.2], size: [4, 1, .9] },
    { center: [4.5, 1.35, -8.2], size: [4.1, .1, 1] },
    { center: [-11.5, .8, -.6], size: [1.4, 1, 3] },
    { center: [-11.5, 1.35, -.6], size: [1.5, .1, 3.1] },
    { center: [-11.5, .8, 6.8], size: [1.4, 1, 2.5] },
    { center: [-4.5, 4.35, 8.1], size: [2.5, .9, 1] },
    { center: [3.5, 4.35, 8.1], size: [2.5, .9, 1] },
  ];
  parts.push(boxesMesh("接待前台静展操作台和上层固定展台分别真实承在各层完整地板上", wood, furnishings));
  return parts;
}

export const everydayParkServiceSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("架廊跨庭游憩游客中心", "低前厅和西静展翼围出开放导览庭，东侧两跑实阶穿过真实梯井接入上层长侧廊，再通向完整封闭的跨庭横展厅；横厅由落地柱和纵横梁承住，下方公共穿园廊始终贯通前庭与园内。低展房与高展厅的入口和楼面真实连通，绿庭没有上盖，公共楼梯和高端落脚台不被楼板封堵", courtyardBridgeVisitorCenter, "建筑", "现代"),
];
