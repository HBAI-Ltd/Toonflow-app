import type { ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchSteps";
import { box, design, rail, type ArchitecturePrototype } from "./structures";
import { slopePanel } from "./vernacularWorldBatchOne";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b6baac", timber = "#a88d68", roofColor = "#718783", dark = "#526a69", glass = "#a4c8c1", counterColor = "#b4bcb2";

export const everydayDiningSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("中缝登阶双台地餐厅", "前后错位的两座餐堂分别落在低台与高一点五米的实体台地，中间有顶采光阶廊从前门分流到两堂；后横厨低备餐和高出餐各有真实传餐口，独立工作阶跨过厨房高差，连续承墙与高低屋盖围合完整错台餐厅", steppedDiningHouse, "建筑", "现代"),
  design("折角柱廊上厅露台餐楼", "面向前街和侧街的开放公共柱廊承住整幅上层，西端顾客梯和后厨工作梯分别穿过真实长楼板井；L形封闭上餐厅围住后侧露台，两道露台门连接室内外用餐面，地层厨房通过独立门与工作梯接入上层", arcadeTerraceRestaurant, "建筑", "现代"),
];

function steppedDiningHouse(): ModelPart[] {
  const parts: ModelPart[] = [
    box("低餐堂阶廊与后厨房低侧共同的落地基础", -.1, .1, 2, 18.8, .2, 22.8, paving),
    box("东高餐堂从地面起立而没有悬空的实体高台", 5.25, .85, 4, 8.1, 1.7, 18.6, paving),
    box("中央客阶高端接入东堂的实心纵向落脚廊", 0, .95, 3.5, 2.4, 1.5, 9, paving),
    box("后厨东侧与高餐堂同标高的完整实心高台", .6, .95, 10.5, 1.2, 1.5, 5, paving),
    box("西低餐堂完整平屋盖", -5.325, 4.11, -.5, 8.55, .22, 17.6, roofColor),
    box("东高餐堂完整平屋盖", 5.325, 5.61, 1.5, 8.55, .22, 13.6, roofColor),
    box("后横厨低备餐区和高出餐区共用的完整高屋盖", 0, 5.91, 10.5, 19.2, .22, 5.7, roofColor),
    { ...slopePanel("将两堂不同屋缘真正连在一起的斜玻璃采光顶", [[-1.2, 4, -9.3], [1.2, 5.5, -9.3], [1.2, 5.5, 8.25], [-1.2, 4, 8.25]], .08, glass), opacity: .3, roughness: .2 },
    stairFlight("从前低门厅实际升一点五米到东堂落脚廊的客阶", 0, .2, -4, 1.9, 10, .15, .3),
    standingPanel("采光阶廊前门两侧真实立起并贴合斜顶的端墙", paving, [[-1.2, .2], [-.9, .2], [-.9, 2.85], [.9, 2.85], [.9, .2], [1.2, .2], [1.2, 5.5], [-1.2, 4]], [], -9, .2),
    ...glazedWall("西堂前街完整实窗承墙", [-9, -9], [-1.2, -9], .2, 4, [[0, 1.05, 5.6, 1.8]]),
    ...glazedWall("西堂外侧连续采光与承屋实墙", [-9, -9], [-9, 8], .2, 4, [[-4.4, 1.05, 5.1, 1.8], [4.3, 1.05, 5.1, 1.8]]),
    ...glazedWall("从低门厅先进入西餐堂的真实侧门", [-1.2, -9], [-1.2, 8], .2, 4, [[3.2, 2.6, 4.7, .9]], [[-5.5, .2, 1.5, 2.6]]),
    ...glazedWall("阶廊伸出高餐堂之前独立封合的通高侧窗墙", [1.2, -9], [1.2, -5], .2, 5.5, [[0, 1, 2.6, 3.7]]),
    ...glazedWall("登完客阶后从高落脚廊进入东餐堂的真实门", [1.2, -5], [1.2, 8], 1.7, 5.5, [[4.5, 3.3, 2.3, 1.2]], [[-.5, 1.7, 1.5, 2.6]]),
    ...glazedWall("东高餐堂前部真实窗墙落在高台上", [1.2, -5], [9, -5], 1.7, 5.5, [[0, 2.6, 5.5, 1.85]]),
    ...glazedWall("东高餐堂外侧两段真长窗与连续承屋墙", [9, -5], [9, 8], 1.7, 5.5, [[-3.6, 2.6, 3.9, 1.85], [3.6, 2.6, 3.9, 1.85]]),
    ...glazedWall("后横厨西端从低基础连续承到高屋盖的实窗墙", [-9, 8], [-9, 13], .2, 5.8, [[0, 3.8, 2.9, 1.2]]),
    ...glazedWall("后横厨东端真正由高台承住的实窗墙", [9, 8], [9, 13], 1.7, 5.8, [[0, 3.8, 2.9, 1.2]]),
    ...glazedWall("低备餐区独立后巷门和真实高窗", [-9, 13], [0, 13], .2, 5.8, [[1.9, 3.6, 3.8, 1.4]], [[-1.5, .2, 1.4, 2.6]]),
    ...glazedWall("高出餐区背墙真实高窗", [0, 13], [9, 13], 1.7, 5.8, [[0, 3.4, 5.8, 1.5]]),
    ...glazedWall("低厨房向西堂交付餐食的真正无玻璃传餐口", [-9, 8], [-1.2, 8], .2, 5.8, [[0, 4.6, 4.2, .7]], [[0, 1.3, 2.5, 1.1]]),
    ...glazedWall("高厨房向东堂交付餐食的真正无玻璃传餐口", [1.2, 8], [9, 8], 1.7, 5.8, [], [[0, 2.8, 2.5, 1.1]]),
    ...glazedWall("客阶廊末端与后横厨房真实隔开的封闭窗墙", [-1.2, 8], [1.2, 8], 1.7, 5.8, [[0, 4.4, 1.5, .9]]),
  ];
  const workStair = stairFlight("后横厨独立连通高低工作地面的实体工作阶", 0, .2, 0, 1.6, 10, .15, .3);
  workStair.vertices = workStair.vertices!.map(v => ({ x: -3 + v.z, y: v.y, z: 10.5 - v.x }));
  parts.push(workStair);
  const furniture: SolidBox[] = [], structure: SolidBox[] = [], cabinets: SolidBox[] = [], brackets: SolidBox[] = [];
  for (const [x, floor, positions] of [[-5.1, .2, [-5.5, -1, 3.5]], [5.1, 1.7, [-1.8, 2.5, 6]]] as const) {
    for (const z of positions) {
      furniture.push({ center: [x, floor + .8, z], size: [1.5, .1, 1.4] }, { center: [x, floor + .375, z], size: [.18, .75, .8] });
      for (const side of [-1, 1]) furniture.push({ center: [x + side * 1.22, floor + .225, z], size: [.55, .45, 1.8] }, { center: [x + side * 1.47, floor + .65, z], size: [.11, .8, 1.8] });
    }
    cabinets.push({ center: [x, floor + .51, 8], size: [2.5, 1.02, .7] });
    furniture.push({ center: [x, floor + 1.06, 8], size: [2.7, .08, .9] });
    for (const z of [-1, 5.7]) structure.push({ center: [x + .12, floor + 3.68, z], size: [8.04, .24, .22] });
  }
  for (const x of [-.88, 1.1]) {
    parts.push(rail([x, 1.25, -4], [x, 2.75, -1], .055, dark));
    for (let i = 0; i < 3; i++) brackets.push({ center: [x < 0 ? -.92 : 1.15, 1.25 + i * .75, -4 + i * 1.5], size: [x < 0 ? .08 : .1, .07, .07] });
  }
  for (const z of [9.76, 11.24]) {
    parts.push(rail([-3, 1.25, z], [0, 2.75, z], .055, dark));
    for (let i = 0; i < 3; i++) brackets.push({ center: [-3 + i * 1.5, .725 + i * .75, z], size: [.06, 1.05, .06] });
  }
  cabinets.push({ center: [-6.7, .71, 11.6], size: [3.4, 1.02, .9] }, { center: [5.8, 2.21, 11.6], size: [4.1, 1.02, .9] });
  furniture.push({ center: [-6.7, 1.26, 11.6], size: [3.5, .08, 1] }, { center: [5.8, 2.76, 11.6], size: [4.2, .08, 1] });
  structure.push({ center: [.12, 5.64, 10.5], size: [18.24, .32, .24] });
  parts.push(boxesMesh("两台地餐堂与后横厨真实承住屋盖的长跨梁", dark, structure), boxesMesh("各自落在高低工作面上的传餐柜与备餐柜", counterColor, cabinets), boxesMesh("客阶扶手实际接到两侧实墙与工作阶上的固定件", dark, brackets));
  for (let offset = 0; offset < furniture.length; offset += 20) parts.push(boxesMesh("不同标高餐堂的全部落地桌座与真实柜台面", timber, furniture.slice(offset, offset + 20)));
  return parts;
}

function arcadeTerraceRestaurant(): ModelPart[] {
  const parts: ModelPart[] = [
    box("餐楼实体房体与前街侧街开放柱廊共用的落地楼面", 0, .1, 0, 19, .2, 17, paving),
    hardFloor("上餐厅与露台同一楼板实际挖开客梯和工作梯两座长井", paving, [[-9, -8], [9, -8], [9, 8], [-9, 8]], .25, [0, 3.75, 0], [[[-7.7, -3.2], [-5.3, -3.2], [-5.3, 4.2], [-7.7, 4.2]], [[2.3, .4], [4.7, .4], [4.7, 7.25], [2.3, 7.25]]]),
    hardFloor("只覆盖L形封闭上餐厅并让后侧露台真正露天的屋盖", roofColor, [[-9.3, -8.3], [9.3, -8.3], [9.3, -1.8], [-2.6, -1.8], [-2.6, 8.3], [-9.3, 8.3]], .22, [0, 7.4, 0]),
    stairFlight("顾客梯下跑实际从柱廊门厅上升至中段", -6.5, .2, -3, 2, 10, .19, .35),
    stairFlight("顾客梯上跑实际穿过楼板井并接到上餐厅", -6.5, 2.1, .5, 2, 10, .19, .35),
    box("顾客梯顶跨接井口后缘而没有封住上行净空的落脚板", -6.5, 3.875, 4.3, 2.4, .25, .6, paving),
    stairFlight("厨房独立工作梯下跑", 3.5, .2, .5, 1.8, 10, .19, .35),
    stairFlight("厨房独立工作梯上跑实际穿板通到露台", 3.5, 2.1, 4, 1.8, 10, .19, .35),
    box("工作梯高端连到露台侧向出口的真实落脚板", 3.5, 3.875, 7.6, 2.4, .25, .8, paving),
    ...glazedWall("柱廊后方真实进入顾客梯厅的独立宽门", [-9, -4], [-3, -4], .2, 3.75, [], [[-.5, .2, 2, 2.7]]),
    ...glazedWall("地层厨房面对前街柱廊的员工门与真正开放交付口", [-3, -4], [5.5, -4], .2, 3.75, [], [[-.25, .2, 1.2, 2.6], [-2.55, 1.2, 1.3, 1.1]]),
    ...glazedWall("地层厨房与侧街公共柱廊之间实际窗墙", [5.5, -4], [5.5, 8], .2, 3.75, [[-2.3, 1.4, 3.4, 1.3], [3.3, 1.4, 3.4, 1.3]]),
    ...glazedWall("顾客梯厅外墙真正封合到上层楼板", [-9, -4], [-9, 8], .2, 3.75, [[-3.5, 1.2, 3.3, 1.5], [3.7, 1.2, 3.3, 1.5]]),
    ...glazedWall("顾客梯厅与独立厨房之间真实保留员工工作门的分隔墙", [-3, -4], [-3, 8], .2, 3.75, [], [[4.1, .2, 1.1, 2.5]]),
    ...glazedWall("地层后墙独立送货门真正连到厨房而不穿顾客梯", [-9, 8], [5.5, 8], .2, 3.75, [[-3.8, 1.4, 3, 1.3]], [[1.75, .2, 1.1, 2.6]]),
    ...glazedWall("上餐厅临前街由整幅楼板承托的真实长窗立面", [-9, -8], [9, -8], 4, 7.4, [[-5.8, 4.8, 4.1, 1.8], [0, 4.8, 4.1, 1.8], [5.8, 4.8, 4.1, 1.8]]),
    ...glazedWall("上餐厅西侧完整真实长窗承屋墙", [-9, -8], [-9, 8], 4, 7.4, [[-4.8, 4.8, 4, 1.8], [4.8, 4.8, 4, 1.8]]),
    ...glazedWall("上餐厅前翼东端真正闭合的窗墙", [9, -8], [9, -2], 4, 7.4, [[0, 4.8, 3.9, 1.8]]),
    ...glazedWall("上餐厅西翼后端真正闭合的窗墙", [-9, 8], [-3, 8], 4, 7.4, [[0, 4.8, 3.9, 1.8]]),
    ...glazedWall("封闭上餐厅前翼经两道实门连到露天餐台", [-3, -2], [9, -2], 4, 7.4, [[-1.2, 4.8, 2.4, 1.8]], [[-3.3, 4, 1.6, 2.6], [3.3, 4, 1.6, 2.6]]),
    ...glazedWall("封闭上餐厅西翼朝露台的实际门和独立长窗", [-3, -2], [-3, 8], 4, 7.4, [[2.8, 4.8, 2.4, 1.8]], [[-1, 4, 1.6, 2.6]]),
  ];
  const structure: SolidBox[] = [], posts: SolidBox[] = [], furniture: SolidBox[] = [], cabinets: SolidBox[] = [];
  for (const [x, z] of [[-8.5, -7.5], [-2, -7.5], [4.5, -7.5], [8.5, -7.5], [8.5, -1], [8.5, 5.8]]) structure.push({ center: [x!, 1.975, z!], size: [.28, 3.55, .28] });
  structure.push({ center: [0, 3.6, -7.5], size: [18, .3, .3] }, { center: [8.5, 3.6, .25], size: [.3, .3, 15.5] }, { center: [-5.88, 3.6, 4.4], size: [6.24, .3, .3] }, { center: [3.5, 3.6, 7.85], size: [2.8, .3, .3] });
  for (const z of [-7.5, -2.3]) structure.push({ center: [.12, 7.24, z], size: [18.36, .32, .24] });
  for (const z of [2.5, 7.7]) structure.push({ center: [-5.88, 7.24, z], size: [6.24, .32, .24] });
  for (const [left, right, front, back] of [[-7.7, -5.3, -3.2, 4.2], [2.3, 4.7, .4, 7.25]]) {
    for (const x of [left!, right!]) {
      parts.push(rail([x, 5.08, front!], [x, 5.08, back!], .06, dark));
      for (let index = 0; index < 4; index++) posts.push({ center: [x, 4.54, front! + (back! - front!) * index / 3], size: [.06, 1.08, .06] });
    }
    parts.push(rail([left!, 5.08, front!], [right!, 5.08, front!], .06, dark));
  }
  for (const [center, start, halfWidth] of [[-6.5, -3, .92], [3.5, .5, .82]]) for (const side of [-1, 1]) {
    const x = center! + side * halfWidth!;
    parts.push(rail([x, 1.39, start!], [x, 5, start! + 6.65], .055, dark));
    posts.push({ center: [x, .89, start!], size: [.06, 1, .06] }, { center: [x, 4.5, start! + 6.65], size: [.06, 1, .06] });
  }
  for (const [a, b] of [[[9, -2], [9, 8]], [[-3, 8], [9, 8]]]) {
    parts.push(rail([a![0]!, 5.08, a![1]!], [b![0]!, 5.08, b![1]!], .06, dark));
    for (let i = 0; i <= 4; i++) posts.push({ center: [a![0]! + (b![0]! - a![0]!) * i / 4, 4.54, a![1]! + (b![1]! - a![1]!) * i / 4], size: [.06, 1.08, .06] });
  }
  for (const [x, z] of [[-6, -5.7], [0, -5.7], [6, -5.7], [-6, 6], [-.1, 2], [6.8, 2.5], [-.1, 6]]) {
    furniture.push({ center: [x!, 4.8, z!], size: [1.5, .1, 1.4] }, { center: [x!, 4.375, z!], size: [.18, .75, .8] });
    for (const side of [-1, 1]) furniture.push({ center: [x! + side * 1.22, 4.225, z!], size: [.55, .45, 1.8] }, { center: [x! + side * 1.47, 4.65, z!], size: [.11, .8, 1.8] });
  }
  cabinets.push({ center: [-1.3, .67, -4], size: [1.3, .94, .7] }, { center: [-.9, .71, 4.8], size: [2.8, 1.02, 1.1] });
  furniture.push({ center: [-1.3, 1.16, -4], size: [1.45, .08, .9] }, { center: [-.9, 1.26, 4.8], size: [2.9, .08, 1.2] });
  parts.push(boxesMesh("开放双街柱廊与上下餐厅各自真实承重的柱梁", dark, structure), boxesMesh("地层交付口与厨房独立操作柜", counterColor, cabinets));
  for (let offset = 0; offset < posts.length; offset += 20) parts.push(boxesMesh("两座梯井和露台外缘实际落在楼板上的护栏立柱", dark, posts.slice(offset, offset + 20)));
  for (let offset = 0; offset < furniture.length; offset += 20) parts.push(boxesMesh("上层室内与露台餐桌座台保留双梯和门口通路", timber, furniture.slice(offset, offset + 20)));
  return parts;
}
