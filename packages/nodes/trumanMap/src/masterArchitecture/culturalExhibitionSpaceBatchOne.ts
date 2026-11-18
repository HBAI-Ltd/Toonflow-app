import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchTwo";
import { box, design, rail, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b3b4a5", stone = "#b9ae97", pale = "#d0cbb9", steel = "#5b7478", glass = "#a1c5c2", earth = "#a08e72";
type Point = [number, number];

export const culturalExhibitionSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("错位串门长卷美术馆", "四间不等宽展室共用连续折线外壳，三座门逐间横移形成套间参观路线；外侧低服务脊通过四段真通廊回接各室，独立穿顶长窗和承梁保留两条完整通路", enfiladeMuseum, "建筑", "现代"),
  design("裂庭下沉地层展馆", "两岸可进入的展室承住屋顶公共坪，横桥从高坪进入长裂庭，三段连续下行石阶接到低位展道和两翼真门；室内天窗、屋顶栏口与前方上行石阶形成完整六米高差剖面", fissureMuseum, "建筑", "现代"),
];

function rectangle(left: number, right: number, front: number, back: number): Point[] {
  return [[left, front], [right, front], [right, back], [left, back]];
}

function enfiladeMuseum(): ModelPart[] {
  const rooms = [
    { left: -12, right: 6, front: -24, back: -12, light: -3 },
    { left: -8, right: 14, front: -12, back: 2, light: 3 },
    { left: -13, right: 7, front: 2, back: 15, light: -3 },
    { left: -4, right: 14, front: 15, back: 27, light: 5 },
  ];
  const p: ModelPart[] = [
    box("连贯服务回廊实际落地楼面", 18, .1, 1.5, 4, .2, 53, paving),
    box("低服务脊从前出口到后出口的完整屋盖", 18, 3.91, 1.5, 4.6, .22, 53.6, steel),
    hardFloor("连续折线实屋盖一次围住四座贯通天窗", steel, [[-12.3, -24.3], [6.3, -24.3], [6.3, -12.3], [14.3, -12.3], [14.3, 2.3], [7.3, 2.3], [7.3, 14.7], [14.3, 14.7], [14.3, 27.3], [-4.3, 27.3], [-4.3, 15.3], [-13.3, 15.3], [-13.3, 1.7], [-8.3, 1.7], [-8.3, -11.7], [-12.3, -11.7]], .3, [0, 7.4, 0], rooms.map(room => rectangle(room.light - 1.4, room.light + 1.4, room.front + 1.5, room.back - 1.5))),
    ...glazedWall("服务回廊内墙四座各自通向展室的真门", [16, -25], [16, 28], .2, 3.8, [], rooms.map(room => [(room.front + room.back) / 2 - 1.5, .2, 2.6, 3])),
    ...glazedWall("服务回廊外墙真实连续采光孔", [20, -25], [20, 28], .2, 3.8, [[-18, 1.1, 7, 1.9], [-5, 1.1, 8, 1.9], [8, 1.1, 8, 1.9], [20, 1.1, 7, 1.9]]),
    ...glazedWall("服务回廊前端独立对外入口", [16, -25], [20, -25], .2, 3.8, [], [[0, .2, 2, 3]]),
    ...glazedWall("服务回廊后端独立对外出口", [16, 28], [20, 28], .2, 3.8, [], [[0, .2, 2, 3]]),
    stairFlight("首室正门外单级石踏面", -3, 0, -24.55, 3.2, 1, .2, .55),
    stairFlight("服务脊前门外单级石踏面", 18, 0, -25.55, 2.2, 1, .2, .55),
    stairFlight("末室后门外单级石踏面", 5, 0, 27.55, 3.2, 1, .2, .55, true),
    stairFlight("服务脊后门外单级石踏面", 18, 0, 28.55, 2.2, 1, .2, .55, true),
  ];
  const beams: SolidBox[] = [];
  for (const room of rooms) {
    const middle = (room.front + room.back) / 2, length = room.back - room.front, width = room.right - room.left;
    p.push(
      box("与相邻套间在同标高实际接合的完整展室地板", (room.left + room.right) / 2, .1, middle, width, .2, length, paving),
      ...glazedWall("折线外壳西墙两座真实侧光窗", [room.left, room.front], [room.left, room.back], .2, 7.4, [[-length * .23, 2.1, length * .24, 3.4], [length * .23, 2.1, length * .24, 3.4]]),
      ...glazedWall("展室东墙通往独立服务支廊的实际内门", [room.right, room.front], [room.right, room.back], .2, 7.4, [], [[0, .2, 2.6, 3]]),
      part("嵌在穿顶孔内的独立透明天窗", "box", glass, [room.light, 7.65, middle], [2.8, .065, length - 3], [0, 0, 0], { opacity: .26, roughness: .2 }),
      box("展室到服务脊之间实际接合的短通廊地板", (room.right + 16) / 2, .1, middle, 16 - room.right, .2, 2.6, paving),
      box("短通廊接到两端承墙上的完整低屋盖", (room.right + 16) / 2, 3.91, middle, 16.24 - room.right, .22, 3.1, steel),
    );
    for (const side of [-1, 1]) {
      p.push(...glazedWall("回接支廊两侧真正开窗的薄围护", [room.right, middle + side * 1.3], [16, middle + side * 1.3], .2, 3.8, [[0, 1.1, (16 - room.right) * .72, 1.9]]));
      beams.push({ center: [room.light + side * 1.57, 7.08, middle], size: [.3, .64, length] });
    }
    p.push(box("不遮挡偏置串门参观线的独立落地展屏", room.left + 2.3, 1.85, middle, .18, 3.3, length * .4, pale));
  }
  p.push(boxesMesh("沿四座天窗两侧跨接端承墙的全部八根实梁", stone, beams));
  for (const [index, doorX] of [1, 3, 2].entries()) {
    const before = rooms[index]!, after = rooms[index + 1]!, left = Math.min(before.left, after.left), right = Math.max(before.right, after.right);
    p.push(...glazedWall("两展室错位肩墙及横移门位一次真实围合", [left, before.back], [right, before.back], .2, 7.4, [], [[doorX - (left + right) / 2, .2, 3.1, 3.8]]));
  }
  p.push(
    ...glazedWall("长卷美术馆第一展室实际前门", [-12, -24], [6, -24], .2, 7.4, [], [[0, .2, 3, 3.8]]),
    ...glazedWall("长卷美术馆最后展室实际后门", [-4, 27], [14, 27], .2, 7.4, [], [[0, .2, 3, 3.8]]),
  );
  return p;
}

function fissureMuseum(): ModelPart[] {
  const p: ModelPart[] = [
    box("裂庭展馆两岸及前方石阶共同落地基坪", -1, .15, -5, 47, .3, 66, earth),
    box("开敞裂庭不被上层楼板覆盖的连续低展道", 0, .4, 1, 10, .2, 42, paving),
    box("西岸下层可进入展厅的实际楼面", -13, .4, 1, 16, .2, 42, paving),
    box("东岸短翼下层可进入展厅的实际楼面", 12, .4, -6.5, 14, .2, 29, paving),
    hardFloor("西岸展厅兼公共坪的屋盖保留两座真实天窗", stone, rectangle(-21.3, -4.7, -20.3, 22.3), .3, [0, 6.2, 0], [rectangle(-18.1, -14.5, -10, -2), rectangle(-18.1, -14.5, 6, 14)]),
    hardFloor("东岸短厅兼观望台的屋盖真实开天窗", stone, rectangle(4.7, 19.3, -21.3, 8.3), .3, [0, 6.2, 0], [rectangle(13.3, 16.9, -12, -2)]),
    ...glazedWall("西岸厚展室朝裂庭的两个实际通门与侧光孔", [-5, -20], [-5, 22], .5, 6.2, [[-14, 2.1, 5, 2.5], [5, 2.1, 4, 2.5]], [[-3, .5, 2.5, 3.2], [14, .5, 2.5, 3.2]]),
    ...glazedWall("东岸短展室朝裂庭的两座真实入口", [5, -21], [5, 8], .5, 6.2, [[-9, 2.1, 5, 2.5]], [[.5, .5, 2.5, 3.2], [9.5, .5, 2.5, 3.2]]),
    ...glazedWall("西翼外墙中真正贯通的高侧窗", [-21, -20], [-21, 22], .5, 6.2, [[-13, 3.4, 6.5, 1.7], [0, 3.4, 6.5, 1.7], [13, 3.4, 6.5, 1.7]]),
    ...glazedWall("东翼外墙中真正贯通的高侧窗", [19, -21], [19, 8], .5, 6.2, [[-8, 3.4, 6, 1.7], [6.5, 3.4, 6, 1.7]]),
    ...glazedWall("西岸展厅前端独立地层入口", [-21, -20], [-5, -20], .5, 6.2, [], [[2, .5, 2.6, 3.2]]),
    ...glazedWall("西岸展厅后端独立对外出口", [-21, 22], [-5, 22], .5, 6.2, [], [[0, .5, 2.6, 3.2]]),
    ...glazedWall("东岸短展厅前端真实对外门", [5, -21], [19, -21], .5, 6.2, [], [[0, .5, 2.6, 3.2]]),
    ...glazedWall("东岸短展厅后端真实对外门", [5, 8], [19, 8], .5, 6.2, [], [[0, .5, 2.6, 3.2]]),
    box("高位入口横桥实际承在两岸墙头及公共坪上", 0, 6.35, -17, 10.5, .3, 4, steel),
    box("横桥背侧接到第一下行踏步的高位平台", 0, 6.35, -14.5, 3.2, .3, 1, stone),
    box("高平台下留出两边步行净空的落地石支墩", 0, 3.25, -14.5, 3.2, 5.9, 1, stone),
    box("下行石阶第二休息台的真实落地石体", 0, 1.4, -2.5, 3.2, 2.2, 1, stone),
    box("下行石阶第一休息台的真实落地石体", 0, 2.4, -8.5, 3.2, 4.2, 1, stone),
  ];
  for (const [x, z, length] of [[-16.3, -6, 8], [-16.3, 10, 8], [15.1, -7, 10]]) p.push(part("实际填入屋顶贯通孔内的独立透光玻璃", "box", glass, [x!, 6.46, z!], [3.6, .065, length!], [0, 0, 0], { opacity: .25, roughness: .22 }));

  const posts: SolidBox[] = [], lintels: SolidBox[] = [];
  for (let flight = 0; flight < 3; flight++) {
    const low = .5 + flight * 2, startZ = 3 - flight * 6;
    p.push(stairFlight("由裂庭低展道逐段连续登到入口横桥的实体石阶", 0, low, startZ, 3, 10, .2, .5, true));
    if (flight) p.push(box("上段石阶下真实落地而非悬空的连续承台", 0, (.3 + low) / 2, startZ - 2.5, 3, low - .3, 5, stone));
    for (const side of [-1, 1]) {
      p.push(rail([side * 1.46, low + 1, startZ], [side * 1.46, low + 3, startZ - 5], .07, steel));
      for (let index = 0; index <= 5; index++) posts.push({ center: [side * 1.46, low + .55 + index * .4, startZ - index], size: [.065, 1.1, .065] });
    }
  }

  const rise = 6.2 / 30;
  for (let flight = 0; flight < 3; flight++) {
    const low = .3 + flight * 10 * rise, startZ = -35.8 + flight * 5.3;
    p.push(stairFlight("前场实际逐段升至西岸屋顶公共坪的宽石阶", -15, low, startZ, 4.8, 10, rise, .42));
    if (flight) p.push(box("上行石阶下接到场坪的实心石承台", -15, (.3 + low) / 2, startZ + 2.1, 4.8, low - .3, 4.2, stone));
    const top = low + 10 * rise;
    p.push(box("上行石阶之间真实接合的宽休息台石体", -15, (.3 + top) / 2, startZ + 4.75, 4.8, top - .3, 1.1, stone));
    for (const side of [-1, 1]) {
      p.push(rail([-15 + side * 2.36, low + 1, startZ], [-15 + side * 2.36, top + 1, startZ + 4.2], .07, steel));
      for (let index = 0; index <= 3; index++) posts.push({ center: [-15 + side * 2.36, low + .55 + index * 10 * rise / 3, startZ + index * 1.4], size: [.07, 1.1, .07] });
    }
  }
  p.push(box("前宽阶末端与西岸屋顶相接的公共平台", -15, 6.35, -20.3, 4.8, .3, 1.4, stone));

  const guards: [number, number, number, number][] = [
    [-21, -20, -21, 22], [-21, 22, -5, 22], [-5, -20, -5, -19], [-5, -15, -5, 22],
    [5, -21, 19, -21], [19, -21, 19, 8], [19, 8, 5, 8], [5, -21, 5, -19], [5, -15, 5, 8],
    [-21, -20, -17.5, -20], [-12.5, -20, -5, -20], [-5, -18.85, 5, -18.85], [-5, -15.15, -1.7, -15.15], [1.7, -15.15, 5, -15.15],
  ];
  for (const [x0, z0, x1, z1] of guards) {
    p.push(rail([x0, 7.55, z0], [x1, 7.55, z1], .07, steel));
    const count = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 3));
    for (let index = 0; index <= count; index++) posts.push({ center: [x0 + (x1 - x0) * index / count, 7.025, z0 + (z1 - z0) * index / count], size: [.07, 1.05, .07] });
  }
  for (let index = 0; index < posts.length; index += 20) p.push(boxesMesh("不删除任何落地连接的屋顶桥边与石阶护栏立杆", steel, posts.slice(index, index + 20)));
  for (const [left, right, front, back] of [[-21, -5, -20, 22], [5, 19, -21, 8]]) {
    for (const z of [front!, back!]) lintels.push({ center: [(left! + right!) / 2, 5.9, z], size: [right! - left!, .6, .42] });
    for (const x of [left!, right!]) lintels.push({ center: [x, 5.9, (front! + back!) / 2], size: [.42, .6, back! - front!] });
  }
  for (const z of [-16, 0, 18]) lintels.push({ center: [-13, 5.8, z], size: [16, .8, .42] });
  for (const z of [-17, 3]) lintels.push({ center: [12, 5.8, z], size: [14, .8, .42] });
  for (const z of [-18.5, -15.5]) lintels.push({ center: [0, 5.85, z], size: [10.6, .7, .2] });
  p.push(boxesMesh("两岸承墙顶部实际连成闭环的全部屋顶承梁", stone, lintels));
  for (const side of [-1, 1]) {
    p.push(box("低位裂庭展道两旁不堵住门位的落地坐台", side * 3.5, .7, 18.5, 1.1, .4, 4.5, stone));
    for (const z of side < 0 ? [-18, 7] : [-19, 5]) p.push(box("两岸展室内与侧墙接合的厚剖面陈列肋", side < 0 ? -20.1 : 18.2, 2.8, z, 1.8, 4.6, .6, earth));
  }
  return p;
}
