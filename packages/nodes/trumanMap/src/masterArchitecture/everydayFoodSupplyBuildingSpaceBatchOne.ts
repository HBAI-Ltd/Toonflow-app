import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { wallYz } from "./everydayWorkplaceSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { rectangularFlue } from "./spatialShells";
import { box, design, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#babdae", wall = "#d0cec0", roof = "#718987", steel = "#718285", pale = "#c8cdbc", glass = "#a2c2be";

function rectangle(x0: number, x1: number, z0: number, z1: number): [number, number][] { return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; }

function workBench(x: number, z: number, width: number, depth: number): SolidBox[] {
  return [{ center: [x, 1.14, z], size: [width, .08, depth] }, ...[-1, 1].flatMap(sx => [-1, 1].map(sz => ({ center: [x + sx * (width / 2 - .12), .70, z + sz * (depth / 2 - .12)] as [number, number, number], size: [.08, .80, .08] as [number, number, number] })))];
}

function centralMealSupplyBuilding(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("原料西翼高热厨净餐东翼及南洗消翼共同闭合的完整落地楼面", paving, [[-15, -8], [-4, -8], [-4, -10], [4, -10], [4, -14], [14, -14], [14, -4], [18, -4], [18, 2], [14, 2], [14, 8], [4, 8], [4, 6], [-4, 6], [-4, 8], [-15, 8]], .30, [0, 0, 0]),
    box("收料西翼由外墙和热厨分界墙承托的低屋盖", -9.5, 4.01, 0, 11.6, .22, 16.6, roof),
    hardFloor("高热厨完整屋盖真正挖出两根排烟方孔", roof, rectangle(-4.15, 4.15, -10.3, 6.3), .25, [0, 5.80, 0], [rectangle(-2, -1.2, -.4, .4), rectangle(1.2, 2, -.4, .4)]),
    box("净餐包装翼独立封合并接在四面承墙上的完整屋盖", 9, 4.51, 0, 10.6, .22, 16.6, roof),
    box("污餐具回收洗消南翼独立低屋盖", 9, 3.51, -11, 10.6, .22, 6.6, pale),
    box("东侧两道卫生前室独立矮屋盖", 16, 3.31, -1, 4.6, .22, 6.6, pale),
    ...glazedWall("西翼面向原料收货台的真实宽门", [-15, -8], [-4, -8], .3, 3.9, [[2.2, 2.6, 3.1, .8]], [[-2.5, .3, 3, 3]]),
    ...glazedWall("西翼后墙真实高窗与独立安全出口", [-15, 8], [-4, 8], .3, 3.9, [[-2, 2.6, 4.8, .8]], [[4, .3, 1.25, 2.5]]),
    ...glazedWall("原料冷藏侧完整外墙实际开高窗", [-15, -8], [-15, 8], .3, 3.9, [[-4.5, 2.6, 3, .8], [3.5, 2.6, 4.2, .8]]),
    ...glazedWall("高热厨西界隔墙保留原料转入门和屋盖以上高窗", [-4, -10], [-4, 6], .3, 5.8, [[2, 4.35, 8, .95]], [[2, .3, 2.1, 2.7]]),
    ...glazedWall("高热厨前墙的独立厨工入口和高采光孔", [-4, -10], [4, -10], .3, 5.8, [[0, 4.35, 4.5, .95]], [[0, .3, 1.4, 2.5]]),
    ...glazedWall("高热厨后墙完整封合并向外高采光", [-4, 6], [4, 6], .3, 5.8, [[0, 4.35, 5.6, .95]]),
    wallYz("热厨与净包装之间无人员穿越的隔墙及真实熟食传递窗", [[-10, .3], [6, .3], [6, 5.8], [-10, 5.8]], [rectangle(-1.5, 1.5, 1.10, 2.4), rectangle(-4, 4, 4.35, 5.3)], 4, .24, wall),
    part("热厨东上方真实高侧窗内独立透光玻璃", "box", glass, [4, 4.825, 0], [.035, .95, 8], [0, 0, 0], { opacity: .28, roughness: .22 }),
    ...glazedWall("西翼超过热厨后墙的短外侧封壁", [-4, 6], [-4, 8], .3, 3.9, []),
    ...glazedWall("包装翼超过热厨后墙的短外侧封壁", [4, 6], [4, 8], .3, 4.4, []),
    ...glazedWall("净餐北出货门真正接向独立装车廊", [4, 8], [14, 8], .3, 4.4, [[-3.5, 2.8, 1.5, 1]], [[0, .3, 3.2, 3.1]]),
    ...glazedWall("净包装东墙的卫生前室工作门和外侧高窗", [14, -8], [14, 8], .3, 4.4, [[5.3, 2.9, 3, 1]], [[1, .3, 1.3, 2.5]]),
    standingPanel("污回收与净包装之间只有贯穿洁净传递孔的完整分界墙", wall, rectangle(4, 14, .3, 4.4), [rectangle(6.6, 9.4, 1.1, 2.35)], -8, .24),
    ...glazedWall("污回收南门与净餐北出货门朝向完全分开", [4, -14], [14, -14], .3, 3.4, [[-3, 2.35, 2, .7]], [[2, .3, 2.3, 2.7]]),
    ...glazedWall("洗消南翼西外承墙保留上部排湿窗", [4, -14], [4, -10], .3, 3.4, [[0, 2.4, 2.2, .65]]),
    ...glazedWall("洗消南翼东外承墙独立排湿高窗", [14, -14], [14, -8], .3, 3.4, [[0, 2.4, 3.5, .65]]),
    ...glazedWall("东侧前室正入口不与南北货口混行", [18, -4], [18, 2], .3, 3.2, [], [[-1, .3, 1.4, 2.5]]),
    ...glazedWall("卫生前室前端闭合侧墙", [14, -4], [18, -4], .3, 3.2, [[0, 2, 2.4, .75]]),
    ...glazedWall("卫生前室后端闭合侧墙", [14, 2], [18, 2], .3, 3.2, [[0, 2, 2.4, .75]]),
    ...glazedWall("卫生前室内两道错位门之间的完整短隔墙", [14, -1], [18, -1], .3, 3.2, [], [[.5, .3, 1.1, 2.4]]),
    ...glazedWall("原料冷藏间侧墙真实连通初加工工作道", [-10, -4], [-10, 8], .3, 3.2, [], [[-.5, .3, 1.3, 2.5]]),
    ...glazedWall("收货验料前带通入独立冷藏间的真门", [-15, -4], [-10, -4], .3, 3.2, [], [[0, .3, 1.5, 2.5]]),
    box("原料冷藏间独立低保温顶与分隔壁真正相接", -12.5, 3.29, 2, 5, .18, 12, pale),
    box("北净餐装车廊同层接地货台", 9, .15, 10, 7.2, .3, 4, paving),
    box("原料南收货口独立同层接地验收台", -12, .15, -10, 4.5, .3, 4, paving),
    box("污餐具南回收口独立同层接地小货台", 11, .15, -15.5, 4.5, .3, 3, paving),
    box("卫生前室外侧步行入口完整落地小坪", 19, .15, -2, 2, .3, 2, paving),
    box("高热厨独立厨工门外接地小坪", 0, .15, -11, 2.4, .3, 2, paving),
  ];
  const structure: SolidBox[] = [], furniture: SolidBox[] = [], coldShelves: SolidBox[] = [];
  for (const x of [-4, 4]) for (const z of [-9.5, -2.5, 5.5]) structure.push({ center: [x, 3.05, z], size: [.24, 5.5, .24] });
  for (const z of [-9.5, -2.5, 5.5]) structure.push({ center: [0, 5.65, z], size: [8.24, .30, .24] });
  for (const z of [-7.5, .0, 7.5]) {
    structure.push({ center: [-9.5, 3.75, z], size: [11, .30, .24] }, { center: [9, 4.25, z], size: [10, .30, .24] });
  }
  for (const x of [5.6, 12.4]) structure.push({ center: [x, 1.95, 11.6], size: [.20, 3.30, .20] }, { center: [x, 3.5, 9.8], size: [.18, .30, 4] });
  structure.push({ center: [9, 3.5, 11.6], size: [7.2, .30, .18] });
  p.push(box("北净餐装车雨棚真实搭在墙与两外柱梁上", 9, 3.75, 10, 7.6, .20, 4.4, roof));
  for (const [x, z, width, depth] of [[-6.7, -6, 3, 1.1], [-7.2, 1, 1.6, 5], [-1.6, 0, 1.5, 2.2], [1.6, 0, 1.5, 2.2], [7, .5, 1.4, 5], [11, 2, 1.4, 4], [5.1, -11, 1.3, 4]]) furniture.push(...workBench(x!, z!, width!, depth!));
  furniture.push({ center: [8, 1.06, -8], size: [3, .08, .7] }, { center: [4, 1.06, 0], size: [.7, .08, 3.2] }, { center: [17.2, .54, .25], size: [.55, .48, 2] });
  for (const z of [-1.5, 4.7]) {
    for (const y of [.38, .95, 1.52, 2.09, 2.66]) coldShelves.push({ center: [-14.25, y, z], size: [.85, .08, 4.4] });
    for (const dz of [-2.1, 2.1]) coldShelves.push({ center: [-14.25, 1.5, z + dz], size: [.85, 2.4, .09] });
  }
  for (const [name, color, pieces] of [["完整热厨低翼承梁及北出餐雨棚承架", steel, structure], ["分流工作区全部落地案台腿板及传递孔实槛", steel, furniture], ["冷藏间靠外墙而不阻挡双门的独立层架", pale, coldShelves]] as [string, string, SolidBox[]][]) for (let start = 0; start < pieces.length; start += 20) p.push(boxesMesh(name, color, pieces.slice(start, start + 20)));
  for (const x of [-1.6, 1.6]) {
    p.push(rectangularFlue("热厨案台上方真正敞底的薄壁排烟罩", 1.9, 2.5, .35, .08, [x, 2.8, 0], steel), hardFloor("排烟罩顶板真正留出竖烟道孔", steel, rectangle(x - .95, x + .95, -1.25, 1.25), .10, [0, 3.15, 0], [rectangle(x - .4, x + .4, -.4, .4)]), rectangularFlue("连续穿过真屋面孔且上下贯通的独立方烟管", .8, .8, 3.65, .065, [x, 3.15, 0], steel));
    for (const sz of [-1, 1]) p.push(box("屋梁承接烟罩顶板的实际细吊杆", x + .72, 4.525, sz * 1.03, .035, 2.55, .035, steel));
  }
  for (const [x, z0, z1, width] of [[-12, -14, -12, 4.4], [11, -19, -17, 4.4], [0, -14, -12, 2.4]]) p.push(part("室外地面连续升到独立低入口台的真实实楔短坡", "extrude", paving, [x!, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: z0!, y: 0 }, { x: z1!, y: 0 }, { x: z1!, y: .3 }], depth: width! }));
  p.push(part("净餐装车廊北端连续接回室外场地的真实短坡", "extrude", paving, [9, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: 12, y: 0 }, { x: 14, y: 0 }, { x: 12, y: .3 }], depth: 7.2 }), part("卫生前室东步行坪外侧独立短坡", "extrude", paving, [0, 0, -2], [1, 1, 1], [0, 0, 0], { profile: [{ x: 20, y: 0 }, { x: 22, y: 0 }, { x: 20, y: .3 }], depth: 2 }), part("西翼后安全门槛连续接回室外场地的独立短坡", "extrude", paving, [-5.5, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: 8, y: 0 }, { x: 10, y: 0 }, { x: 8, y: .3 }], depth: 1.5 }));
  return p;
}

export const everydayFoodSupplyBuildingSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("分翼流向中央配餐服务楼", "西端收料冷藏和初加工经真工作门进入中段高热厨，熟食由贯墙孔送往东净包装并从北装车廊输出；南污餐具回收洗消翼只有独立洁净传递口，东侧错门卫生前室分开人货进路。五种高低体量、真实排烟孔和接地梁柱构成完整中央配餐建筑，无顾客餐堂", centralMealSupplyBuilding, "建筑", "现代"),
];
