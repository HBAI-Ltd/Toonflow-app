import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { slopePanel } from "./vernacularWorldBatchOne";
import { box, design, rail, type ArchitecturePrototype } from "./structures";

const paving = "#b5b6a6", wall = "#d0c9b4", steel = "#5d7779", wood = "#a58c68", pale = "#d8ded2", rescue = "#ab6d55";

export const everydayWaterfrontBuildingSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("双翼穿廊急救瞭望海滩服务楼", "左右低翼围出贯通沙滩与岸后步道的有顶公共通廊，西翼两端宽门与内门对齐形成可担架穿行的急救路线，东翼独立更衣间和装备间通过侧廊进入；海向高瞭望室由三跑折返梯从真实低屋盖梯井进入，横梁和落地柱承住高楼面，观察窗与楼梯入口分开", beachLifeguardServiceBuilding, "建筑", "现代"),
];

function beachLifeguardServiceBuilding(): ModelPart[] {
  const stairHole: [number, number][] = [[3, -6.6], [7.7, -6.6], [7.7, -2], [3, -2]];
  const p: ModelPart[] = [
    box("服务楼与两端担架坡道共用的完整落地场坪", 0, .1, 0, 21, .2, 18, paving),
    box("两翼服务用房与中央公共穿廊连续齐平的室内地坪", 0, .25, 0, 17, .1, 14, paving),
    slopePanel("沙滩侧宽门前实际接平急救室地坪的短缓坡", [[-6.7, .2, -8.5], [-3.8, .2, -8.5], [-3.8, .3, -7], [-6.7, .3, -7]], .1, paving),
    slopePanel("岸后急救交接宽门前实际接平的短缓坡", [[-6.7, .3, 7], [-3.8, .3, 7], [-3.8, .2, 8.5], [-6.7, .2, 8.5]], .1, paving),
    box("西急救翼承接完整围墙的低屋盖", -5.25, 3.6, 0, 7.1, .2, 14.6, steel),
    polygon("东服务翼屋盖为三跑楼梯真实留出贯通大梯井", steel, [[1.8, -7.3], [8.8, -7.3], [8.8, 7.3], [1.8, 7.3]], .2, [0, 3.5, 0], [stairHole]),
    box("连接两翼并始终保持下方可穿行的中央遮蔽廊盖", 0, 3.6, 0, 4.4, .2, 14.6, steel),
    ...glazedWall("急救翼朝沙滩的实际担架宽门", [-2, -7], [-8.5, -7], .3, 3.5, [], [[0, .3, 2.4, 2.5]]),
    ...glazedWall("急救翼朝岸后的实际转送宽门", [-8.5, 7], [-2, 7], .3, 3.5, [], [[0, .3, 2.4, 2.5]]),
    ...glazedWall("急救翼外侧真实采光墙孔", [-8.5, -7], [-8.5, 7], .3, 3.5, [[-3.4, 1.5, 2.5, 1.2], [3.5, 1.5, 2.5, 1.2]]),
    ...glazedWall("急救翼朝公共通廊的独立内门", [-2, -7], [-2, 7], .3, 3.5, [], [[-3.5, .3, 1.8, 2.4], [3.5, .3, 1.5, 2.4]]),
    ...glazedWall("急救与后部交接区之间保持担架路线对齐的内门", [-8.5, .7], [-2, .7], .3, 3.5, [], [[0, .3, 2.4, 2.5]]),
    ...glazedWall("东翼临沙滩通向独立楼梯的真实入口", [8.5, -7], [2, -7], .3, 3.5, [], [[-1.65, .3, 1.6, 2.4]]),
    ...glazedWall("东翼岸后通向更衣侧廊的真实入口", [2, 7], [8.5, 7], .3, 3.5, [], [[-2.05, .3, 1.4, 2.4]]),
    ...glazedWall("东更衣翼具有独立高窗的外侧承墙", [8.5, 7], [8.5, -7], .3, 3.5, [[-5, 2.6, 2.2, .55], [-1.7, 2.6, 2.2, .55]]),
    ...glazedWall("东更衣翼从中央公共通廊进入的实际侧门", [2, -7], [2, 7], .3, 3.5, [], [[4, .3, 1.6, 2.4]]),
    ...glazedWall("楼梯与后部更衣区之间真正开门的隔墙", [2, .5], [8.5, .5], .3, 3.5, [], [[-2.05, .3, 1.4, 2.4]]),
    ...glazedWall("两间私密更衣室各自接入连续侧廊的真门", [4.6, .5], [4.6, 7], .3, 3.5, [], [[-1.75, .3, 1.1, 2.25], [1.5, .3, 1.1, 2.25]]),
    box("独立分隔两间更衣室而不封堵侧廊的实墙", 6.55, 1.9, 3.75, 3.9, 3.2, .14, wall),
    box("高瞭望室完整承重楼板", 0, 5.875, -4.05, 6.2, .25, 5.5, paving),
    box("末跑楼梯与瞭望室真侧门同标高的上端落脚台", 3.5, 5.875, -2.25, 2, .25, 1.5, paving),
    box("第一跑与折返第二跑之间实际接合的中平台", 6.1, 2.1, -2.6, 2.8, .2, .8, paving),
    box("第二跑与第三跑之间实际接合的后平台", 4.5, 4, -6.4, 2.8, .2, .8, paving),
    ...glazedWall("高瞭望室面海整幅真实观察窗", [-2.8, -6.5], [2.8, -6.5], 6, 8.7, [[0, 6.75, 4.8, 1.55]]),
    ...glazedWall("高瞭望室岸后真实观察窗", [-2.8, -1.5], [2.8, -1.5], 6, 8.7, [[-.6, 6.85, 3.6, 1.4]]),
    ...glazedWall("高瞭望室西侧实际贯通的侧向观察窗", [-2.8, -6.5], [-2.8, -1.5], 6, 8.7, [[0, 6.75, 4.1, 1.55]]),
    ...glazedWall("高瞭望室东侧窗与梯台入口各自独立", [2.8, -6.5], [2.8, -1.5], 6, 8.7, [[-1.1, 6.75, 1.65, 1.55]], [[1.7, 6, 1.2, 2.25]]),
    box("高瞭望室由四周真实墙顶承住的完整外挑遮阳屋盖", 0, 8.8, -4.05, 6.7, .2, 6, steel),
  ];
  for (const [x, y, z, reverse] of [[6.9, .3, -6, false], [5.3, 2.2, -3, true], [3.7, 4.1, -6, false]] as const) {
    const flight = stairFlight("独立梯井内实际相接而留有梯下净空的十级腰板梯", [x, y, z], 10, .19, .3, 1.2, .18);
    if (reverse) flight.rotation.y = 90;
    p.push(flight);
    for (const side of [-1, 1]) {
      const end = z + (reverse ? -3 : 3);
      p.push({ ...rail([x + side * .55, y + 1, z], [x + side * .55, y + 2.9, end], .055, steel), name: "随每跑楼梯坡度连续升高的独立扶手" });
    }
  }
  const structure: SolidBox[] = [];
  for (const x of [-2.65, 2.65]) for (const z of [-6.25, -1.75]) structure.push({ center: [x, 3.025, z], size: [.28, 5.45, .28] });
  for (const z of [-6.25, -1.75]) structure.push({ center: [0, 5.65, z], size: [5.9, .3, .3] });
  for (const x of [-2.65, 2.65]) structure.push({ center: [x, 5.65, -4], size: [.3, .3, 4.8] });
  for (const x of [4.8, 7.4]) structure.push({ center: [x, 1.15, -2.3], size: [.14, 1.7, .14] });
  for (const x of [3.2, 5.8]) structure.push({ center: [x, 2.1, -6.7], size: [.14, 3.6, .14] });
  structure.push({ center: [4.4, 3.025, -1.65], size: [.16, 5.45, .16] });
  p.push(boxesMesh("从两翼地坪连续接高瞭望楼板的落地柱与实际相交横梁", steel, structure));
  const guards: SolidBox[] = [];
  for (const [x, y, z, reverse] of [[6.9, .3, -6, false], [5.3, 2.2, -3, true], [3.7, 4.1, -6, false]] as const) for (const side of [-1, 1]) for (const end of [0, 1]) guards.push({ center: [x + side * .55, y + end * 1.9 + .5, z + (reverse ? -3 : 3) * end], size: [.055, 1, .055] });
  guards.push({ center: [3.5, 6.5, -1.53], size: [2, 1, .055] }, { center: [4.47, 6.5, -2.25], size: [.055, 1, 1.5] }, { center: [6.1, 2.7, -2.23], size: [2.8, 1, .055] }, { center: [4.5, 4.6, -6.77], size: [2.8, 1, .055] });
  p.push(boxesMesh("梯段和折返平台保留实际通行缺口的独立护栏", steel, guards));
  const fittings: SolidBox[] = [
    { center: [-7.5, .7, 4.8], size: [1.2, .8, 2.6] }, { center: [-7.45, 1.15, 4.8], size: [1.3, .1, 2.7] },
    { center: [7.6, .55, 1.85], size: [1.15, .5, 1.3] }, { center: [7.6, .55, 5.35], size: [1.15, .5, 1.3] },
    { center: [0, 6.45, -5.6], size: [3.4, .9, .6] }, { center: [-.25, 6.95, -5.6], size: [3.9, .1, .8] },
  ];
  p.push(boxesMesh("避开担架通道的急救交接台更衣坐台和上层瞭望工作台", wood, fittings));
  const bed: SolidBox[] = [{ center: [-7, .84, -2.7], size: [1.1, .08, 2.25] }];
  for (const x of [-7.43, -6.57]) for (const z of [-3.6, -1.8]) bed.push({ center: [x, .55, z], size: [.08, .5, .08] });
  p.push(boxesMesh("急救室内由四条真实落地腿支住的独立处理台", steel, bed), box("处理台支承框架上的独立浅色软垫", -7, .94, -2.7, 1.02, .12, 2.16, pale), box("面海急救翼门旁完整服务标识牌", -3, 2.25, -7.14, 1.1, 1.1, .08, pale), box("服务标识上的短横急救十字", -3, 2.25, -7.19, .7, .16, .04, rescue), box("服务标识上的短竖急救十字", -3, 2.25, -7.19, .16, .7, .04, rescue));
  return p;
}
