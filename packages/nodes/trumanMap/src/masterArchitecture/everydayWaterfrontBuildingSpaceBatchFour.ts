import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, design, type ArchitecturePrototype } from "./structures";

const paving = "#b4b9aa", wall = "#c9c9b6", roof = "#6e8782", steel = "#5e7679", wood = "#a18b68";

export const everydayWaterfrontBuildingSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("中核双廊游船候乘服务楼", "岸后宽厅向临水双门收成两片斜臂，中央完整售票后勤内房通过真实服务窗口朝左候乘廊营业，独立员工后廊直通岸后专门入口；左右到发廊由中央内房和前隔墙持续分开，各自真实连通岸后门与临水门，完整屋盖由外墙中央实核及落地跨梁接实，不含车辆跳板和船舶", tourBoatPassengerServiceBuilding, "建筑", "现代"),
];

function tourBoatPassengerServiceBuilding(): ModelPart[] {
  const outline: [number, number][] = [[-12, 10], [12, 10], [12, 3], [10, -3], [8, -10], [-8, -10], [-10, -3], [-12, 3]];
  const roofOutline: [number, number][] = [[-12.3, 10.3], [12.3, 10.3], [12.3, 2.95], [10.3, -3.1], [8.2, -10.3], [-8.2, -10.3], [-10.3, -3.1], [-12.3, 2.95]];
  const p: ModelPart[] = [
    box("整个候乘服务楼与前后独立坡门共同的落地场坪", 0, .1, 0, 29, .2, 28, paving),
    polygon("左候乘右到达及中央售票员工内房连续齐平的完整楼面", paving, outline, .2, [0, .2, 0]),
    polygon("双斜臂候乘楼由完整承墙共同接实的八边大屋盖", roof, roofOutline, .2, [0, 4.2, 0]),
    ...glazedWall("岸后左右客流门与中央员工门各自真正贯通的完整立面", [-12, 10], [12, 10], .4, 4.2, [[-10.2, 1.25, 2, 1.8], [-3, 1.25, 2, 1.8], [3, 1.25, 2, 1.8], [10.2, 1.25, 2, 1.8]], [[-6.5, .4, 3, 2.7], [0, .4, 1.4, 2.5], [6.5, .4, 3, 2.7]]),
    ...glazedWall("临水立面上各自接到两条独立客廊的真到发门", [8, -10], [-8, -10], .4, 4.2, [[-2, 1.3, 2, 1.8], [2, 1.3, 2, 1.8]], [[-5.2, .4, 2.6, 2.7], [5.2, .4, 2.6, 2.7]]),
    ...glazedWall("中央售票房朝候乘廊的两处真实敞开营业窗口", [-3, -2.5], [-3, 6.2], .4, 4.2, [], [[.15, 1.1, 1.5, 1.05], [2.75, 1.1, 1.5, 1.05]]),
    ...glazedWall("售票后勤内房朝到达廊保持独立的完整高窗壁", [3, -2.5], [3, 6.2], .4, 4.2, [[0, 2.8, 5.7, .7]]),
    ...glazedWall("中央内房前端完整隔开两臂的实体承墙", [-3, -2.5], [3, -2.5], .4, 4.2, []),
    ...glazedWall("中央售票后勤房真正进入员工后廊的内门", [-3, 6.2], [3, 6.2], .4, 4.2, [], [[0, .4, 1.3, 2.5]]),
    box("临水两道门之间始终不互穿的整高实隔墙", 0, 2.3, -6.25, .18, 3.8, 7.5, wall),
    box("员工后廊与左候乘厅之间真实接墙的连续分隔壁", -1.2, 2.3, 8.1, .16, 3.8, 3.8, wall),
    box("员工后廊与右到达厅之间真实接墙的连续分隔壁", 1.2, 2.3, 8.1, .16, 3.8, 3.8, wall),
    box("售票服务窗内侧实际落地支承长柜", -2.25, .75, 3.3, 1.1, .7, 5.4, wood),
    box("中央内房内不遮挡员工通道的落地后勤柜", 2.15, 1.3, 1.5, 1.1, 1.8, 4.5, wood),
  ];
  for (const side of [-1, 1]) {
    const points: [number, number][] = [[side * 12, 10], [side * 12, 3], [side * 10, -3], [side * 8, -10]];
    if (side < 0) points.reverse();
    for (let index = 0; index < points.length - 1; index++) {
      const a = points[index]!, b = points[index + 1]!, length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      p.push(...glazedWall("两条独立斜臂沿真实折角逐段接合的外侧采光承墙", a, b, .4, 4.2, [[0, 1.2, length - 1.3, 1.85]]));
    }
    p.push(part("每道临水客流门前独立接平前场的实心缓坡", "extrude", paving, [side * 5.2, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 3, profile: [{ x: -12, y: .2 }, { x: -10, y: .2 }, { x: -10, y: .4 }] }), part("每道岸后客流门前独立接平陆场的实心缓坡", "extrude", paving, [side * 6.5, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 3.4, profile: [{ x: 10, y: .2 }, { x: 12, y: .2 }, { x: 10, y: .4 }] }));
  }
  p.push(part("员工专门入口前单独接平的实心短缓坡", "extrude", paving, [0, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 1.8, profile: [{ x: 10, y: .2 }, { x: 12, y: .2 }, { x: 10, y: .4 }] }));
  for (const z of [2, 4.6]) p.push(box("实际穿过敞开售票窗口下缘并由柜体接住的营业台面", -2.75, 1.16, z, 1.5, .12, 1.5, wood));
  const structure: SolidBox[] = [];
  for (const [z, x] of [[-2.9, 9.8], [6, 11.8]]) {
    for (const side of [-1, 1]) structure.push({ center: [side * x!, 2.15, z!], size: [.2, 3.5, .2] });
    structure.push({ center: [0, 4.05, z!], size: [x! * 2 + .4, .3, .24] });
  }
  p.push(boxesMesh("两斜臂各侧落地柱与中央内房共同承住的完整横跨屋梁", steel, structure));
  const seats: SolidBox[] = [];
  for (const z of [-1, 2.5, 6]) seats.push({ center: [-9, .65, z], size: [1.1, .5, 2.2] }, { center: [-9.45, 1.15, z], size: [.12, .7, 2.2] });
  p.push(boxesMesh("避开售票窗口和连续候乘通路且实际落地的候乘长坐台", wood, seats));
  return p;
}
