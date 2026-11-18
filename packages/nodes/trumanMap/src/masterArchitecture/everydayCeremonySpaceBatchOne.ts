import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchSteps";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#bcb7a5", wall = "#d0c7b4", wood = "#aa8d66", steel = "#687d7c", glass = "#adc8c0", warm = "#c4b89a";
type Point = [number, number];

export const everydayCeremonySpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("折肘双厅回廊婚礼宴会楼", "前左仪式厅经横向转场厅折向后右宴会厅，前接待廊、西回廊和后公共廊连成客流回路；最东侧独立工作脊接后厨与后巷，真实舞台阶、侧后勤门和宽跨屋架围合完整婚宴楼", weddingBanquetHouse, "建筑", "现代"),
];

function rectangle(left: number, right: number, front: number, back: number): Point[] {
  return [[left, front], [right, front], [right, back], [left, back]];
}

function weddingBanquetHouse(): ModelPart[] {
  const p: ModelPart[] = [
    box("前接待廊完整落地楼面", -6, .15, -26, 26, .3, 6, paving),
    box("前左仪式厅完整落地楼面", -6, .15, -14, 18, .3, 18, paving),
    box("仪式厅与宴会厅之间真正连续的宽转场横厅", 2, .15, -2, 42, .3, 6, paving),
    box("后右宴会厅完整落地楼面", 10, .15, 12, 26, .3, 22, paving),
    box("宴会厅西侧公共回廊实际接通前后廊", -5, .15, 12, 4, .3, 22, paving),
    box("宴会厅后公共廊完整落地楼面", 8, .15, 26, 30, .3, 6, paving),
    box("东侧独立工作脊完整落地楼面", 26, .15, 12, 6, .3, 34, paving),
    box("后厨与工作脊同标高的完整落地楼面", 18, .15, 33, 22, .3, 8, paving),
    box("前接待廊完整低位屋盖", -6, 3.925, -26, 26.6, .25, 6.6, steel),
    hardFloor("转场横厅西回廊与后公共廊一次闭合的C形屋盖", steel, [[-19.3, -5.3], [23.15, -5.3], [23.15, 1.15], [-2.85, 1.15], [-2.85, 22.85], [23.15, 22.85], [23.15, 29.15], [-7.15, 29.15], [-7.15, 1.15], [-19.3, 1.15]], .25, [0, 3.8, 0]),
    hardFloor("侧工作脊与后厨连续接合的L形完整低屋盖", steel, [[22.85, -5.3], [29.3, -5.3], [29.3, 37.3], [6.85, 37.3], [6.85, 28.85], [22.85, 28.85]], .25, [0, 4.2, 0]),
    hardFloor("仪式厅高屋盖真正挖出独立长天窗", warm, rectangle(-15.3, 3.3, -23.3, -4.8), .3, [0, 6.2, 0], [rectangle(-8.8, -3.2, -19, -10.5)]),
    part("仪式厅贯通屋孔中独立透光天窗", "box", glass, [-6, 6.46, -14.75], [5.6, .065, 8.5], [0, 0, 0], { opacity: .25, roughness: .2 }),
    box("宴会厅完整无柱高屋盖", 10, 7.35, 12, 26.6, .3, 22.6, warm),
    ...glazedWall("前接待廊对外实际主门与迎宾窗", [-19, -29], [7, -29], .3, 3.8, [[-8, 1, 4.4, 2.1], [8, 1, 4.4, 2.1]], [[0, .3, 3, 3]]),
    ...glazedWall("前接待廊西端独立采光窗墙", [-19, -29], [-19, -23], .3, 3.8, [[0, 1, 3.5, 2.1]]),
    ...glazedWall("前接待廊东端独立采光窗墙", [7, -23], [7, -29], .3, 3.8, [[0, 1, 3.5, 2.1]]),
    ...glazedWall("前接待廊后西肩实际封墙", [-19, -23], [-15, -23], .3, 3.8, []),
    ...glazedWall("前接待廊后东肩实际封墙", [3, -23], [7, -23], .3, 3.8, []),
    ...glazedWall("仪式厅从前接待廊实际入场的主门", [-15, -23], [3, -23], .3, 6.2, [], [[0, .3, 3, 3.2]]),
    ...glazedWall("仪式厅西承墙上真实高侧窗", [-15, -23], [-15, -5], .3, 6.2, [[-4.5, 2.4, 4.2, 2.1], [4.5, 2.4, 4.2, 2.1]]),
    ...glazedWall("仪式厅东承墙上真实高侧窗", [3, -5], [3, -23], .3, 6.2, [[-4.5, 2.4, 4.2, 2.1], [4.5, 2.4, 4.2, 2.1]]),
    ...glazedWall("仪式台两侧分开接入转场厅的实际出口", [-15, -5], [3, -5], .3, 6.2, [], [[-6, .3, 1.5, 2.8], [6, .3, 1.5, 2.8]]),
    ...glazedWall("横向转场厅前西外肩完整围护", [-19, -5], [-15, -5], .3, 3.8, []),
    ...glazedWall("横向转场厅前东侧真实庭门与采光窗", [3, -5], [23, -5], .3, 3.8, [[-6.3, 1, 3.6, 2.1], [6.3, 1, 3.6, 2.1]], [[-3, .3, 2, 2.9]]),
    ...glazedWall("转场厅西端实际开窗外墙", [-19, -5], [-19, 1], .3, 3.8, [[0, 1, 3.5, 2.1]]),
    ...glazedWall("横厅后侧接到西回廊前的完整封墙", [-19, 1], [-7, 1], .3, 3.8, [[0, 1, 8.5, 2.1]]),
    ...glazedWall("西公共回廊与后廊外缘的连续采光承墙", [-7, 1], [-7, 29], .3, 3.8, [[-9.5, 1, 4.8, 2.1], [-.5, 1, 4.8, 2.1]], [[11, .3, 1.6, 2.9]]),
    ...glazedWall("宴会厅从横向转场厅实际进入的宽门", [-3, 1], [23, 1], .3, 7.2, [], [[0, .3, 3, 3.2]]),
    ...glazedWall("宴会厅实际通入后公共廊的宽门", [-3, 23], [23, 23], .3, 7.2, [], [[0, .3, 3, 3.2]]),
    ...glazedWall("宴会厅西侧两座真实公共回廊门与高窗", [-3, 1], [-3, 23], .3, 7.2, [[-5.5, 4.5, 5, 1.5], [5.5, 4.5, 5, 1.5]], [[-5, .3, 1.6, 2.9], [6, .3, 1.6, 2.9]]),
    ...glazedWall("宴会厅东侧与独立工作脊相接的两座真门", [23, 1], [23, 23], .3, 7.2, [[-5.5, 4.8, 5, 1.2], [5.5, 4.8, 5, 1.2]], [[-4, .3, 1.4, 2.9], [6, .3, 1.4, 2.9]]),
    ...glazedWall("后公共廊避开后厨的独立对外出口", [-7, 29], [7, 29], .3, 3.8, [[-4.4, 1, 2.8, 2.1]], [[0, .3, 2, 2.9]]),
    ...glazedWall("工作脊前端独立员工入口", [23, -5], [29, -5], .3, 4.2, [], [[0, .3, 1.4, 2.9]]),
    ...glazedWall("工作脊朝横厅与后廊的完整门墙", [23, -5], [23, 1], .3, 4.2, [], [[0, .3, 1.2, 2.9]]),
    ...glazedWall("工作脊与后公共廊之间的受控真门", [23, 23], [23, 29], .3, 4.2, [], [[0, .3, 1.2, 2.9]]),
    ...glazedWall("工作脊及后厨的完整东外高窗墙", [29, 37], [29, -5], .3, 4.2, [[-14, 2.6, 5, 1], [-4, 2.6, 5, 1], [7, 2.6, 5, 1], [16, 2.6, 4, 1]]),
    ...glazedWall("后厨西侧独立高采光外墙", [7, 29], [7, 37], .3, 4.2, [[0, 2.6, 5.5, 1]]),
    ...glazedWall("后厨尽端向后巷真正开出的补货门", [7, 37], [29, 37], .3, 4.2, [[-5, 2.6, 6, 1]], [[8, .3, 2, 2.9]]),
    standingPanel("后厨朝公共廊及工作脊的独立真门和配餐孔", wall, [[7, .3], [12.4, .3], [12.4, 2.9], [13.6, 2.9], [13.6, .3], [25.3, .3], [25.3, 3.2], [26.7, 3.2], [26.7, .3], [29, .3], [29, 4.2], [7, 4.2]], [rectangle(8, 11, 1.2, 2.2)], 29, .24),
    box("仪式厅真实抬高且两边留通路的主礼台", -6, .525, -8, 7, .45, 3, wood),
    stairFlight("前中轴实际接上主礼台的三阶石步", -6, .3, -10.55, 2.8, 3, .15, .35),
  ];
  const beams: SolidBox[] = [], ceremonySeats: SolidBox[] = [], banquetSeats: SolidBox[] = [], fittings: SolidBox[] = [];
  for (const z of [-21, -14, -6.5]) beams.push({ center: [-6, 5.85, z], size: [18.1, .7, .3] });
  for (const z of [3, 11, 21]) beams.push({ center: [10, 6.75, z], size: [26.1, .9, .3] });
  for (const z of [-28.7, -23.2]) beams.push({ center: [-6, 3.55, z], size: [26.1, .5, .25] });
  for (const z of [-4.7, .7]) beams.push({ center: [2, 3.55, z], size: [42.1, .5, .25] });
  for (const z of [23.2, 28.7]) beams.push({ center: [8, 3.55, z], size: [30.1, .5, .25] });
  for (const z of [29.2, 36.7]) beams.push({ center: [18, 3.95, z], size: [22.1, .5, .25] });
  for (const x of [-17, -2, 5]) for (const z of [-28.7, -23.2]) beams.push({ center: [x, 2.05, z], size: [.22, 3.5, .22] });
  for (const x of [-17, -4, 7, 18]) for (const z of [-4.7, .7]) beams.push({ center: [x, 2.05, z], size: [.22, 3.5, .22] });
  for (const x of [-6.7, 5, 16, 21]) for (const z of [23.2, 28.7]) beams.push({ center: [x, 2.05, z], size: [.22, 3.5, .22] });
  for (const x of [18.5, 28]) for (const z of [29.2, 36.7]) beams.push({ center: [x, 2.25, z], size: [.22, 3.9, .22] });
  for (let index = 0; index < beams.length; index += 20) p.push(boxesMesh("双厅及接待工作翼实际搭入承墙的全部跨屋梁", steel, beams.slice(index, index + 20)));

  for (const x of [-10.5, -1.5]) for (let row = 0; row < 6; row++) {
    const z = -20 + row * 1.4;
    ceremonySeats.push({ center: [x, .53, z], size: [5.2, .46, .55] }, { center: [x, .96, z - .3], size: [5.2, .85, .08] });
  }
  for (let index = 0; index < ceremonySeats.length; index += 20) p.push(boxesMesh("仪式厅让出中轴及主礼台两边通道的全部固定座", wood, ceremonySeats.slice(index, index + 20)));
  for (const x of [4, 15]) for (const z of [5, 10, 15, 20]) {
    p.push(cylinder("宴会圆桌从楼面接起的独立圆承座", x, .625, z, .24, .65, steel), cylinder("实际承在圆柱上的宴会圆桌面", x, 1, z, 2.2, .1, warm));
    for (const side of [-1, 1]) {
      banquetSeats.push({ center: [x + side * 1.6, .525, z], size: [.55, .45, .55] }, { center: [x + side * 1.9, .95, z], size: [.08, .8, .55] }, { center: [x, .525, z + side * 1.6], size: [.55, .45, .55] }, { center: [x, .95, z + side * 1.9], size: [.55, .8, .08] });
    }
  }
  for (let index = 0; index < banquetSeats.length; index += 20) p.push(boxesMesh("宴会圆桌四旁实际接地且保持横纵通道的座体", wood, banquetSeats.slice(index, index + 20)));
  fittings.push({ center: [-15, .85, -26], size: [3, 1.1, .75] }, { center: [3.8, .55, -26.5], size: [2.6, .5, .75] }, { center: [3.8, 1.02, -26.85], size: [2.6, .9, .08] }, { center: [9.5, .75, 28.8], size: [3.1, .9, .8] }, { center: [9.5, 1.24, 28.8], size: [3.3, .08, .95] });
  for (const z of [31.5, 34.7]) {
    fittings.push({ center: [15, 1.1, z], size: [7, .1, 1.3] });
    for (const x of [12, 18]) fittings.push({ center: [x, .675, z], size: [.14, .75, 1.1] });
  }
  p.push(boxesMesh("接待台等候座配餐柜及后厨工作台真实相接的全部构件", wood, fittings));
  return p;
}
