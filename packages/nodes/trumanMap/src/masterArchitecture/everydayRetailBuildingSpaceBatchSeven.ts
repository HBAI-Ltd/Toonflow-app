import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchTwo";
import { box, design, rail, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#bbc3b4", tile = "#bbc9c0", metal = "#5b7775", roofColor = "#78988e", pale = "#d0d6c8";

export const everydayRetailBuildingSpaceBatchSevenDesigns: ArchitecturePrototype[] = [
  design("围台低湿场鲜鱼店", "高前厅的C形顾客干台围住中央低冲洗工作场，两片实心坡地向真正纵排沟降坡，跨沟板在员工路线中实际搭接两侧地面；后处理横厅与偏置冷货尾间分门相连，前侧短阶只接干台，人员与冷货后门各自直接通巷", raisedDryDeckFishShop, "建筑", "现代"),
];

function raisedDryDeckFishShop(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("顾客前干台和左右观售翼连续满承重的C形高地坪", paving, [[-7, -7], [7, -7], [7, 4], [4.2, 4], [4.2, -4], [-4.2, -4], [-4.2, 4], [-7, 4]], .55, [0, 0, 0]),
    part("中央湿场左半实心坡地实际向排水沟降低", "extrude", tile, [0, 0, 2], [1, 1, 1], [0, 0, 0], { profile: [{ x: -4.2, y: 0 }, { x: -.2, y: 0 }, { x: -.2, y: .2 }, { x: -4.2, y: .3 }], depth: 12 }),
    part("中央湿场右半实心坡地实际向排水沟降低", "extrude", tile, [0, 0, 2], [1, 1, 1], [0, 0, 0], { profile: [{ x: .2, y: 0 }, { x: 4.2, y: 0 }, { x: 4.2, y: .3 }, { x: .2, y: .2 }], depth: 12 }),
    box("后处理横厅左侧完整同高工作地坪", -5.6, .15, 6, 2.8, .3, 4, tile),
    box("后处理横厅右侧完整同高工作地坪", 5.6, .15, 6, 2.8, .3, 4, tile),
    box("右后冷货尾间独立真实落地的完整地坪", 5, .15, 9.5, 4, .3, 3, paving),
    part("纵沟实心沟底实际从前湿场向后暗沟出口连续降低", "extrude", metal, [0, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -4, y: 0 }, { x: 8, y: 0 }, { x: 8, y: .08 }, { x: -4, y: .1 }], depth: .4 }),
    box("排水沟左侧与左坡地真实贴合的完整薄壁", -.175, .125, 2, .05, .15, 12, metal),
    box("排水沟右侧与右坡地真实贴合的完整薄壁", .175, .125, 2, .05, .15, 12, metal),
    box("员工前工作道真正跨过排水沟的短桥盖板", 0, .23, -.5, 1.6, .04, 1, metal),
    box("员工后处理通路真正跨沟且两端入坡地的盖板", 0, .23, 5.5, 1.6, .04, 1, metal),
    box("高售卖厅由两侧实柱梁与厚壁承住的完整屋盖", 0, 4.725, -1.5, 14.6, .25, 11.6, roofColor),
    box("后处理横厅独立低屋盖", 0, 4.125, 6, 14.6, .25, 4.6, roofColor),
    box("右后冷货尾间独立最低完整屋盖", 5, 3.525, 9.5, 4.6, .25, 3.6, roofColor),
    ...glazedWall("高售卖厅主街干台真入口和独立透光橱窗", [7, -7], [-7, -7], .1, 4.6, [[5.5, 1.1, 1.5, 2.5], [-1.6, 1.1, 5.6, 2.5], [-5.7, 1.1, 1.2, 2.5]], [[3.4, .55, 1.8, 2.8]]),
    ...glazedWall("干台左翼独立侧街入口及真实高窗", [-7, -7], [-7, 4], .1, 4.6, [[-3.2, 2.8, 2.4, .9], [3.5, 2.8, 2.1, .9]], [[1.5, .55, 1.4, 2.8]]),
    ...glazedWall("干台右翼完整承屋壁保留真实高窗", [7, 4], [7, -7], .1, 4.6, [[3, 2.8, 2.8, .9], [-2.8, 2.8, 2.8, .9]]),
    ...glazedWall("湿工作场员工门及纵沟真实穿墙口", [-7, 4], [7, 4], .1, 4, [[3.5, 2.6, 3, .8]], [[-2.5, .1, 1.4, 2.8], [0, 0, .3, .24]]),
    ...glazedWall("前高厅与后低屋盖之间实际收头的高窗壁", [-7, 4], [7, 4], 4, 4.6, [[-3.5, 4.12, 3, .3], [3.5, 4.12, 3, .3]]),
    ...glazedWall("后处理间西侧完整高窗承墙", [-7, 4], [-7, 8], .1, 4, [[0, 2.6, 2.5, .8]]),
    ...glazedWall("后处理间东侧完整高窗承墙", [7, 8], [7, 4], .1, 4, [[0, 2.6, 2.5, .8]]),
    ...glazedWall("后处理间员工门冷货内门及真实暗沟出口", [-7, 8], [7, 8], .1, 4, [[-.3, 2.7, 2.7, .65]], [[-5, .3, 1.2, 2.6], [5, .3, 1.6, 2.6], [0, 0, .3, .24]]),
    ...glazedWall("冷货尾间西端完整承屋壁", [3, 8], [3, 11], .3, 3.4, []),
    ...glazedWall("冷货尾间东端完整承屋壁", [7, 11], [7, 8], .3, 3.4, []),
    ...glazedWall("冷货尾间真正向后巷开通的宽收货门", [3, 11], [7, 11], .3, 3.4, [], [[0, .3, 2, 2.5]]),
    box("前干台入口短阶下面完整连续的落地踏前坪", -3.4, .1, -7.8, 2.6, .2, 1.6, paving),
    stairFlight("前街从低踏前坪真正升到顾客高干台的两级宽阶", -3.4, .2, -7.8, 2, 2, .175, .4),
    box("侧街干台短阶下面完整连续的落地踏前坪", -7.8, .1, 0, 1.6, .2, 2, paving),
    part("冷货尾门到后巷地面真实连续降低的短实坡", "extrude", paving, [5, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: 11, y: 0 }, { x: 13, y: 0 }, { x: 11, y: .3 }], depth: 2.4 }),
  ];
  const sideSteps = stairFlight("侧街两级短阶直接与干台侧门同高相接", 0, .2, 0, 1.6, 2, .175, .4);
  sideSteps.rotation.y = 90; sideSteps.position.x = -7.8; p.push(sideSteps);
  const structure: SolidBox[] = [], guards: SolidBox[] = [], beds: SolidBox[] = [], ice: SolidBox[] = [], rear: SolidBox[] = [];
  for (const x of [-6.8, -4.5, 4.5, 6.8]) for (const z of [-6.75, 3.75]) structure.push({ center: [x, 2.575, z], size: [.22, 4.05, .22] });
  for (const z of [-6.75, 3.75]) structure.push({ center: [0, 4.45, z], size: [13.8, .3, .22] });
  for (const x of [-4.5, 4.5]) structure.push({ center: [x, 4.45, -1.5], size: [.22, .3, 10.5] });
  for (const x of [-6.8, 6.8]) structure.push({ center: [x, 2.15, 7.8], size: [.22, 3.7, .22] });
  for (const z of [4.2, 7.8]) structure.push({ center: [0, 3.875, z], size: [13.8, .25, .22] });
  for (const [x0, z0, x1, z1] of [[-4.2, -4, -4.2, 3.9], [4.2, -4, 4.2, 3.9], [-4.2, -4, 4.2, -4]]) {
    p.push(rail([x0!, 1.55, z0!], [x1!, 1.55, z1!], .055, metal));
    const count = Math.ceil(Math.hypot(x1! - x0!, z1! - z0!) / 1.6);
    for (let i = 0; i <= count; i++) guards.push({ center: [x0! + (x1! - x0!) * i / count, 1.05, z0! + (z1! - z0!) * i / count], size: [.05, 1, .05] });
  }
  const wetHeight = (x: number) => .2 + (Math.abs(x) - .2) * .025;
  for (const x of [-3, 3]) for (const z of [-2.1, 1.5]) {
    beds.push({ center: [x, .95, z], size: [1.3, .06, 2.4] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const px = x + sx * .46, floor = wetHeight(px);
      beds.push({ center: [px, (.92 + floor) / 2, z + sz * .95], size: [.12, .92 - floor, .12] });
    }
    for (const side of [-1, 1]) beds.push({ center: [x + side * .625, 1.09, z], size: [.05, .28, 2.4] }, { center: [x, 1.09, z + side * 1.175], size: [1.3, .28, .05] });
    for (const dz of [-.75, 0, .75]) ice.push({ center: [x, 1.015, z + dz], size: [1.12, .07, .62] });
  }
  rear.push({ center: [-6.2, 1.05, 6.2], size: [.9, .1, 2.4] });
  for (const x of [-6.5, -5.9]) for (const z of [5.2, 7.2]) rear.push({ center: [x, .65, z], size: [.12, .7, .12] });
  for (const y of [.4, 1, 1.6, 2.2]) rear.push({ center: [6.1, y, 9.4], size: [.65, .08, 1.9] });
  for (const z of [8.5, 10.3]) rear.push({ center: [6.1, 1.3, z], size: [.65, 2, .08] });
  rear.push({ center: [0, .02, 8.35], size: [.5, .04, 1.1] }, { center: [0, .06, 8.35], size: [.4, .04, 1.1] }, { center: [0, .22, 8.35], size: [.4, .04, 1.1] });
  for (const x of [-.175, .175]) rear.push({ center: [x, .14, 8.35], size: [.05, .12, 1.1] });
  p.push(boxesMesh("售卖厅与后处理横厅实际落地接盖的全部柱梁", metal, structure));
  for (let i = 0; i < guards.length; i += 20) p.push(boxesMesh("干台临低湿场一侧真实落脚的连续防护立柱", metal, guards.slice(i, i + 20)));
  for (let i = 0; i < beds.length; i += 20) p.push(boxesMesh("顺真实坡地逐脚校准并有底有薄壁的开放售卖冰床", pale, beds.slice(i, i + 20)));
  p.push(boxesMesh("实际落在冰床底面上的分离冰板", "#dce2d6", ice), boxesMesh("后处理台与冷货间开放架的完整承托", pale, rear));
  return p;
}
