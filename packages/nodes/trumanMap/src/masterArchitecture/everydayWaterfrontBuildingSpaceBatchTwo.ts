import { part, type ModelPart } from "../assetModelParts";
import { combineMeshes, polygon } from "../masterNature/shared";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { slopePanel } from "./vernacularWorldBatchOne";
import { box, design, pipe, rail, type ArchitecturePrototype } from "./structures";

const paving = "#afb5a9", wall = "#c9c9b7", roof = "#63807d", steel = "#5a7074", wood = "#a48e69";

export const everydayWaterfrontBuildingSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("返洗分流滨水桨具租还服务楼", "L形完整服务楼由岸侧透明接待厅和高位横存库相接，临水返还门进入有真实下沉排水沟的双向坡洗地坪，经后宽门送入器材库，干取具通道从另一座宽门直接出场；接待入口通过独立侧门进入干区，两条湿干工作路线由实墙分开，横存架与单坡大屋盖均由落地支承接实", watersportRentalServiceBuilding, "建筑", "现代"),
];

function watersportRentalServiceBuilding(): ModelPart[] {
  const outer: [number, number][] = [[-10, -9], [0, -9], [0, 2], [9, 2], [9, 9], [-10, 9]];
  const wet: [number, number][] = [[-9.7, -8.7], [-5.05, -8.7], [-5.05, -.7], [-9.7, -.7]];
  const p: ModelPart[] = [
    box("L形服务楼及独立前场短坡共用落地场坪", 0, .1, -.5, 23, .2, 25, paving),
    polygon("干取具通道横存库与接待厅完整楼面为湿洗地坪真实留空", paving, outer, .2, [0, .2, 0], [wet]),
    part("湿洗地坪西半边实际填实并坡向中央排水沟", "extrude", paving, [0, 0, -4.7], [1, 1, 1], [0, 0, 0], { depth: 8, profile: [{ x: -9.7, y: .2 }, { x: -7.65, y: .2 }, { x: -7.65, y: .29 }, { x: -9.7, y: .4 }] }),
    part("湿洗地坪东半边实际填实并反坡向同一条低沟", "extrude", paving, [0, 0, -4.7], [1, 1, 1], [0, 0, 0], { depth: 8, profile: [{ x: -7.35, y: .2 }, { x: -5.05, y: .2 }, { x: -5.05, y: .4 }, { x: -7.35, y: .29 }] }),
    ...glazedWall("临水立面上分开湿返还和干取具的两座实际宽门", [0, -9], [-10, -9], .4, 4.2, [], [[-2.5, .4, 3.8, 3.1], [2.5, .4, 3.8, 3.1]]),
    ...glazedWall("横存库岸后独立工作门对准东侧实际通行空隙", [-10, 9], [0, 9], .4, 4.2, [], [[3.9, .4, 1.4, 2.5]]),
    ...glazedWall("返洗翼西侧具有真实高窗的连续承墙", [-10, -9], [-10, 9], .4, 4.2, [[-4, 2.65, 4, 1], [5.4, 2.65, 3.2, 1]]),
    ...glazedWall("干取具通道朝露天前庭的实际高窗承墙", [0, 2], [0, -9], .4, 5, [[0, 2.7, 7.5, 1.2]]),
    ...glazedWall("岸侧接待厅与横存库之间实际贯通的独立侧门", [0, 2], [0, 9], .4, 5, [], [[0, .4, 2.2, 2.7]]),
    ...glazedWall("湿返还和干取具两条长通道之间完整实隔墙", [-5, -9], [-5, -.5], .4, 4.6, []),
    ...glazedWall("返洗区与取具区各自真实开门进入后部横存库", [-10, -.5], [0, -.5], .4, 4.2, [], [[-2.5, .4, 2.6, 3.1], [2.5, .4, 2.6, 3.1]]),
    ...glazedWall("岸侧接待厅朝前庭的真实顾客入口与独立展示窗", [9, 2], [0, 2], .4, 3.4, [[1.6, 1.1, 3.2, 1.8]], [[-2, .4, 2, 2.5]]),
    ...glazedWall("低接待翼东侧完整透明采光立面", [9, 9], [9, 2], .4, 3.4, [[0, 1.1, 5.5, 1.8]]),
    ...glazedWall("低接待翼岸后实际开窗的完整承墙", [0, 9], [9, 9], .4, 3.4, [[1, 1.2, 4, 1.5]]),
    box("低接待厅四面承墙共同接实的完整平屋盖", 4.5, 3.5, 5.5, 9.5, .2, 7.6, roof),
    slopePanel("高横存与返洗翼从西墙到东墙连续上升的完整单坡屋盖", [[-10.3, 4.336, -9.3], [.3, 5.184, -9.3], [.3, 5.184, 9.3], [-10.3, 4.336, 9.3]], .16, roof),
  ];
  for (const z of [-9, -.5, 9]) p.push(standingPanel("沿单坡屋盖真实封合主翼端墙和内隔墙的三角顶墙", wall, [[-10, 4.2], [0, 4.2], [0, 5]], [], z, .24));
  for (const x of [-7.5, -2.5]) p.push(part("两座临水宽门各自接到前场的填实短缓坡", "extrude", paving, [x, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 4.2, profile: [{ x: -11, y: .2 }, { x: -9, y: .2 }, { x: -9, y: .4 }] }));
  p.push(part("岸侧接待入口独立接入前庭的填实短缓坡", "extrude", paving, [6.5, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 2.5, profile: [{ x: 0, y: .2 }, { x: 2, y: .2 }, { x: 2, y: .4 }] }));
  const grates: ModelPart[] = [];
  for (let panel = 0; panel < 4; panel++) {
    const start = -8.6 + panel * 1.95;
    const slots: [number, number][][] = Array.from({ length: 9 }, (_, index) => {
      const z = start + .12 + index * .2;
      return [[-7.59, z], [-7.41, z], [-7.41, z + .12], [-7.59, z + .12]];
    });
    grates.push(polygon("低沟中真实开孔并将两端压在坡地坪边缘的排水箅板", steel, [[-7.68, start], [-7.32, start], [-7.32, start + 1.9], [-7.68, start + 1.9]], .04, [0, .26, 0], slots));
  }
  p.push(combineMeshes("四块保留全部排水孔与沟下空腔的独立支承箅板", steel, grates));
  const structure: SolidBox[] = [];
  for (const x of [-9.8, -.2]) for (const z of [-8.5, .2, 8.5]) {
    const top = 4.2 + .08 * (x + 10) - .1;
    // 湿坪侧前柱底略嵌入连续承脚地坪；其余柱脚实际落在齐平干地坪上。
    const foot = x < -9 && z < -.7 ? .388 : .4;
    structure.push({ center: [x, (foot + top) / 2, z], size: [.18, top - foot, .18] });
  }
  p.push(boxesMesh("高单坡屋盖下逐榀接地并对准跨梁的立柱", steel, structure));
  for (const z of [-8.5, .2, 8.5]) p.push({ ...rail([-9.9, 4.15, z], [-.1, 4.934, z], .18, steel), name: "连续接在落地立柱与单坡屋盖之间的真实斜跨梁" });
  const racks: SolidBox[] = [];
  for (const z of [2.5, 7.4]) {
    for (const x of [-8.8, -5.6, -2.4]) {
      racks.push({ center: [x, 1.9, z], size: [.12, 3, .12] });
      for (const y of [1.05, 1.95, 2.85]) racks.push({ center: [x, y, z], size: [.13, .12, 1.5] });
    }
    for (const y of [1.05, 1.95, 2.85]) racks.push({ center: [-5.6, y, z], size: [7.2, .12, .12] });
  }
  for (let start = 0; start < racks.length; start += 18) p.push(boxesMesh("避开两门中央搬运通道且实接立柱的三层长器材横存架", steel, racks.slice(start, start + 18)));
  for (const z of [-6.4, -3.4]) p.push(pipe("洗具位实际接在坡地坪内的供水立管", [-9.72, .38, z], [-9.72, 2.1, z], .07), pipe("从供水立管伸向湿洗坪的短清洗出水臂", [-9.72, 2.1, z], [-9.22, 2.1, z], .07));
  p.push(box("接待厅不遮挡库侧真门的落地租还柜台", 3.6, .8, 7.6, 5.2, .8, .8, wood), box("实际支在租还柜台上的完整台面", 3.6, 1.25, 7.6, 5.4, .1, 1, wood), box("接待厅靠东外墙的独立等候坐台", 8.1, .65, 5.3, .8, .5, 3.5, wood));
  return p;
}
