import type { ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, design, type ArchitecturePrototype } from "./structures";

const paving = "#b7b6a4", wall = "#c4c2b0", steel = "#627c78", wood = "#a18a65", dark = "#52696b";

function splitTicketAdmissionBuilding(): ModelPart[] {
  const outline: [number, number][] = [[-14.24, -10.24], [-2.76, -10.24], [-2.76, -4.24], [8.76, -4.24], [8.76, -10.24], [14.24, -10.24], [14.24, 10.24], [-14.24, 10.24]];
  const parts: ModelPart[] = [
    box("门区票务内房候票前院和独立回程廊共同的完整落地场坪", 0, .1, 0, 32, .2, 24, paving),
    polygon("三边围前院的票务内房高入园厅与回程廊实际齐平地板", paving, outline, .1, [0, .2, 0]),
    box("完整票务和后勤内房由外墙内隔墙直接承住的低屋盖", -10.5, 3.8, 0, 7.5, .2, 20.5, steel),
    box("前院西侧候票小厅与主厅真正相接的低屋盖", -5, 3.8, -7, 4.4, .2, 6.4, steel),
    box("分流入园高厅由四周承墙和横梁接住的完整高屋盖", 1, 5.2, 3, 16.5, .2, 14.5, steel),
    box("沿东侧单独从园内贯通前场的窄回程廊完整低屋盖", 11.5, 3.6, 0, 5.5, .2, 20.5, steel),
    ...glazedWall("票务后勤内房临西侧的真实采光壁", [-14, -10], [-14, 10], .3, 3.7, [[-5, 1.2, 3.6, 1.5], [4.8, 1.2, 3.6, 1.5]]),
    ...glazedWall("前票务房和低候票厅各自采光的实际前墙", [-14, -10], [-3, -10], .3, 3.7, [[-2.1, 1.2, 3.3, 1.5], [3.5, 1.2, 2, 1.5]]),
    ...glazedWall("低候票厅从凹前院侧面真正进入的宽门", [-3, -10], [-3, -4], .3, 3.7, [], [[0, .3, 2.4, 2.5]]),
    ...glazedWall("低候票厅与主入口各自贯通高入园厅的双门立面", [-7, -4], [9, -4], .3, 5.1, [[0, 3.85, 5, .8]], [[-6, .3, 2.8, 2.5], [2, .3, 3.4, 2.8]]),
    ...glazedWall("低候票厅同完整售票工作房之间实际接低屋盖的隔墙", [-7, -10], [-7, -4], .3, 3.7, []),
    ...glazedWall("高厅西墙真售票开口及后勤内门和低顶上方高窗", [-7, -4], [-7, 10], .3, 5.1, [[-.5, 3.95, 10.5, .7]], [[-4.4, 1.1, 1.8, 1.1], [-1.6, 1.1, 1.8, 1.1], [4.1, .3, 1.4, 2.4]]),
    ...glazedWall("票务工作区后方服务房真正开门的完整隔墙", [-14, 4], [-7, 4], .3, 3.7, [], [[0, .3, 1.4, 2.4]]),
    ...glazedWall("票务后勤房由园内后场单独进入的真后门", [-14, 10], [-7, 10], .3, 3.7, [], [[0, .3, 1.6, 2.4]]),
    ...glazedWall("检票之后分别进入园区的两处实际宽门", [-7, 10], [9, 10], .3, 5.1, [[0, 3.85, 8, .8]], [[-4.5, .3, 2.5, 2.8], [3.8, .3, 3.2, 2.8]]),
    ...glazedWall("回程前廊面向凹前院的连续低承屋壁", [9, -10], [9, -4], .3, 3.5, []),
    ...glazedWall("入园厅同东侧回程廊整高隔开而不互相混流的连续壁", [9, -4], [9, 10], .3, 5.1, [[0, 3.9, 10, .7]]),
    ...glazedWall("回程廊朝外侧步道实际采光的完整外墙", [14, -10], [14, 10], .3, 3.5, [[-5, 1.3, 4, 1.4], [3.8, 1.3, 4, 1.4]]),
    ...glazedWall("园内返程进入独立回廊的真实后门", [9, 10], [14, 10], .3, 3.5, [], [[0, .3, 2.4, 2.5]]),
    ...glazedWall("回程廊直接回到前场且避开候票前院的实际出口", [9, -10], [14, -10], .3, 3.5, [], [[0, .3, 2.4, 2.5]]),
  ];
  const framing: SolidBox[] = [];
  for (const x of [-6.78, 8.78]) for (const z of [-3.7, 3.2, 9.7]) framing.push({ center: [x, 2.7, z], size: [.22, 4.8, .22] });
  for (const z of [-3.7, 3.2, 9.7]) framing.push({ center: [1, 4.97, z], size: [15.78, .26, .3] });
  for (const x of [-6.78, 8.78]) framing.push({ center: [x, 4.97, 3], size: [.25, .26, 13.4] });
  parts.push(boxesMesh("高厅真实落地柱和同屋盖相接的横纵承梁", steel, framing));
  const boundary: SolidBox[] = [];
  for (const [low, high] of [[-7, -5], [-3.8, -1], [.2, 4.6], [6.6, 9]] as const) {
    boundary.push({ center: [(low + high) / 2, .85, 3.2], size: [high - low, 1.1, .14] });
  }
  for (const x of [-5, -3.8, -1, .2, 4.6, 6.6]) boundary.push({ center: [x, .95, 3.2], size: [.18, 1.3, .55] });
  parts.push(boxesMesh("票务边界连续到两侧实墙而只留三条实际检票通口", dark, boundary));
  const readers: SolidBox[] = [-5, -1, 4.6].map(x => ({ center: [x, 1.62, 3.15], size: [.22, .08, .28] }));
  parts.push(boxesMesh("检票通口旁各自落在门柱上的真实验票读卡面", wood, readers));
  for (const z of [-1.4, 1.4]) parts.push(box("真正穿过售票开口下缘并向两侧伸出的售票石台", -7, 1.025, z, 1.1, .15, 2.1, wall));
  const furnishings: SolidBox[] = [
    { center: [-11.9, .75, -5.8], size: [1.8, .9, 3.5] },
    { center: [-11.9, 1.25, -5.8], size: [1.9, .1, 3.6] },
    { center: [-5.5, .7, -8.8], size: [2.2, .16, .65] },
    { center: [-6.25, .45, -8.8], size: [.12, .5, .55] },
    { center: [-4.75, .45, -8.8], size: [.12, .5, .55] },
    { center: [-11.9, .8, 7.7], size: [1.1, 1, 2.5] },
  ];
  parts.push(boxesMesh("票务操作桌候票低坐台和后勤柜均真实落到完整地板", wood, furnishings));
  return parts;
}

export const everydayParkServiceSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("凹庭分流票检公园门馆", "三边建筑围出开放候票前院，西侧完整票务内房通过真窗口服务转角候票厅；中后部高厅的连续票区边界只留三条入园通口，东侧整高隔离回程廊从园内直接返回前场，后勤后门另通工作房。票厅屋盖由整高落地柱和横梁接承，公共进出与内部服务路线实际分开", splitTicketAdmissionBuilding, "建筑", "现代"),
];
