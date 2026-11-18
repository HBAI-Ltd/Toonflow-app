import { part, type ModelPart, type Triple } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchTwo";
import { box, design, rail, type ArchitecturePrototype } from "./structures";
import { slopePanel } from "./vernacularWorldBatchOne";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b9b7a7", wall = "#d0c9b7", wood = "#a88b66", steel = "#627a7e", dark = "#4c5d60", glass = "#a5c7c4", counter = "#b0b6ac", sign = "#7c9b8c";
type Point = [number, number];

export const everydayCommercialSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("削角双入口社区便利店", "五边削角店壳让两条街的真实入口连到同一货架回路，背部独立补货室经真门接入；转角连续雨棚、通透冷藏柜和前侧收银带都在可进入的完整店体内", cornerConvenienceStore, "建筑", "现代"),
  design("前堂后厨侧工作巷面馆", "低位通透前堂接到后部高厨房，厨房用真实传餐孔和员工门与前堂连通，侧后有顶工作巷接独立厨门和送货入口，L形高低店壳保留清楚的就餐与工作路径", alleyNoodleRestaurant, "建筑", "现代"),
  design("斜街通高夹层咖啡馆", "收窄临街口的梯形店壳围住通高前堂和后部夹层，实体楼梯穿过夹层真实边井；斜街侧窗与双街入口连接地面用餐区，后吧台和夹层栏口保持独立通路", mezzanineCafe, "建筑", "现代"),
];

function rectangle(left: number, right: number, front: number, back: number): Point[] {
  return [[left, front], [right, front], [right, back], [left, back]];
}

function cornerConvenienceStore(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("削角商店完整五边形落地楼面", paving, [[-7, -6], [3, -6], [7, -2], [7, 6], [-7, 6]], .2, [0, 0, 0]),
    hardFloor("与转角薄墙实际接合的五边平屋盖", steel, [[-7.3, -6.3], [3.13, -6.3], [7.3, -2.13], [7.3, 6.3], [-7.3, 6.3]], .25, [0, 3.95, 0]),
    hardFloor("沿前街削角和侧入口连续折转的整体雨棚", sign, [[-7.3, -7.2], [3.5, -7.2], [8.2, -2.5], [8.2, 1], [6.7, 1], [6.7, -1.9], [2.9, -5.7], [-7.3, -5.7]], .13, [0, 3.08, 0]),
    ...glazedWall("便利店临街前墙真实通透橱窗", [-7, -6], [3, -6], .2, 3.95, [[0, .65, 8.2, 2.2]]),
    ...glazedWall("削角街口真正可通行的主入口", [3, -6], [7, -2], .2, 3.95, [[-1.9, 1, .8, 1.6], [1.9, 1, .8, 1.6]], [[0, .2, 2.2, 2.6]]),
    ...glazedWall("另一条街直接接入货架回路的侧入口", [7, -2], [7, 6], .2, 3.95, [[1.8, 1.3, 2.3, 1.5]], [[-2, .2, 1.8, 2.6]]),
    ...glazedWall("背部补货室向后巷独立出入的真门", [-7, 6], [7, 6], .2, 3.95, [[-3, 2.6, 4.8, .8]], [[4.8, .2, 1.3, 2.5]]),
    ...glazedWall("便利店西侧完整承墙的真实高窗", [-7, -6], [-7, 6], .2, 3.95, [[2.8, 2.7, 3.2, .7]]),
    ...glazedWall("后部补货室与营业间真实分隔门", [-7, 3], [7, 3], .2, 3.95, [], [[-4, .2, 1.2, 2.5]]),
    box("临前窗并让出入口的长收银柜体", -4.5, .72, -4.4, 3.8, 1.04, .8, counter),
    box("收银台面实际搭在柜体上", -4.5, 1.28, -4.4, 4, .08, .95, wood),
    box("收银工作带一端的短折柜体", -6.05, .72, -3.55, .7, 1.04, 1, counter),
    box("两街雨棚上方连续前招牌实体", -2, 3.54, -6.25, 9.9, .5, .14, sign),
  ];
  const shelves: SolidBox[] = [], coldFrames: SolidBox[] = [];
  for (const x of [-3.5, -.5, 2.5]) {
    for (const side of [-1, 1]) shelves.push({ center: [x + side * .42, 1.16, -1], size: [.07, 1.92, 3.2] });
    shelves.push({ center: [x, 1.16, -1], size: [.06, 1.92, 3.2] });
    for (const y of [.3, .85, 1.4, 1.95]) shelves.push({ center: [x, y, -1], size: [.9, .075, 3.2] });
  }
  for (const row of [{ x: .5, z: 3.65, width: 3.8 }, { x: -1, z: 5.3, width: 7 }]) {
    for (const y of [.35, 1, 1.65]) shelves.push({ center: [row.x, y, row.z], size: [row.width, .08, .65] });
    for (const side of [-1, 1]) shelves.push({ center: [row.x + side * (row.width / 2 - .1), 1, row.z], size: [.08, 1.6, .65] });
  }
  for (let index = 0; index < shelves.length; index += 20) p.push(boxesMesh("营业货架及独立后勤室的全部承架层板", wall, shelves.slice(index, index + 20)));

  const coolers = [{ x: -6.15, z: -.3, width: 1.2, depth: 4.5 }, { x: 1.9, z: 2.25, width: 5.8, depth: 1.2 }];
  for (const cooler of coolers) {
    const alongX = cooler.width > cooler.depth;
    coldFrames.push({ center: [cooler.x, .3, cooler.z], size: [cooler.width, .2, cooler.depth] }, { center: [cooler.x, 2.65, cooler.z], size: [cooler.width, .16, cooler.depth] });
    if (alongX) {
      coldFrames.push({ center: [cooler.x, 1.48, cooler.z + .54], size: [cooler.width, 2.24, .12] });
      for (const side of [-1, 1]) coldFrames.push({ center: [cooler.x + side * (cooler.width / 2 - .06), 1.48, cooler.z], size: [.12, 2.24, cooler.depth] });
      for (const y of [.8, 1.4, 2]) coldFrames.push({ center: [cooler.x, y, cooler.z], size: [cooler.width - .2, .06, cooler.depth - .14] });
      p.push(part("后列冷柜真实空腔前的透明门面", "box", glass, [cooler.x, 1.49, cooler.z - .58], [cooler.width - .2, 2.15, .035], [0, 0, 0], { opacity: .22, roughness: .16 }));
    } else {
      coldFrames.push({ center: [cooler.x - .54, 1.48, cooler.z], size: [.12, 2.24, cooler.depth] });
      for (const side of [-1, 1]) coldFrames.push({ center: [cooler.x, 1.48, cooler.z + side * (cooler.depth / 2 - .06)], size: [cooler.width, 2.24, .12] });
      for (const y of [.8, 1.4, 2]) coldFrames.push({ center: [cooler.x, y, cooler.z], size: [cooler.width - .14, .06, cooler.depth - .2] });
      p.push(part("侧列冷柜真实空腔前的透明门面", "box", glass, [cooler.x + .58, 1.49, cooler.z], [.035, 2.15, cooler.depth - .2], [0, 0, 0], { opacity: .22, roughness: .16 }));
    }
  }
  p.push(boxesMesh("两列L形冷藏柜全部真实壁板和内部层板", counter, coldFrames));
  return p;
}

function alleyNoodleRestaurant(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("前堂与后厨房接合的完整L形地坪", paving, [[-7, -8], [7, -8], [7, 2], [2, 2], [2, 8], [-7, 8]], .2, [0, 0, 0]),
    box("厨房侧工作巷在同标高独立接通的地坪", 4.5, .1, 5, 5, .2, 6, paving),
    box("低前堂完整平屋盖", 0, 4.225, -3, 14.6, .25, 10.6, steel),
    hardFloor("后高厨房的屋盖真正留出排烟方管孔", steel, rectangle(-7.3, 2.3, 1.8, 8.3), .25, [0, 4.7, 0], [rectangle(-3.3, -2.7, 6.2, 6.8)]),
    slopePanel("独立侧工作巷由厨墙和外柱共同支承的单坡雨盖", [[1.9, 3.25, 1.9], [7.3, 2.95, 1.9], [7.3, 2.95, 8.3], [1.9, 3.25, 8.3]], .14, wood),
    ...glazedWall("面馆前街橱窗和实际就餐入口", [-7, -8], [7, -8], .2, 4.1, [[-4.4, .8, 3.6, 2.5], [3.5, .8, 4.8, 2.5]], [[-1, .2, 1.6, 2.7]]),
    ...glazedWall("前堂东侧实际侧门连接另一条街", [7, -8], [7, 2], .2, 4.1, [[-2.5, .8, 2.6, 2.5]], [[1, .2, 1.6, 2.7]]),
    ...glazedWall("前堂西墙在卡座上方实际开高窗", [-7, -8], [-7, 2], .2, 4.1, [[-2.5, 2.2, 2.7, 1], [2.2, 2.2, 2.7, 1]]),
    ...glazedWall("前堂后侧实际通入有顶工作巷的窄门", [2, 2], [7, 2], .2, 4.1, [], [[0, .2, 1.1, 2.4]]),
    ...glazedWall("厨房西外墙完整高窗", [-7, 2], [-7, 8], .2, 4.7, [[0, 2.6, 3.2, 1.2]]),
    ...glazedWall("厨房背面独立接向后巷的工作门", [-7, 8], [2, 8], .2, 4.7, [[2.6, 2.4, 1.8, 1.2]], [[-1.5, .2, 1.3, 2.5]]),
    ...glazedWall("厨房东侧真门接入送餐与进货工作巷", [2, 2], [2, 8], .2, 4.7, [[-1.9, 2.8, .9, 1]], [[0, .2, 1.1, 2.5]]),
    standingPanel("后厨朝前堂的真传餐孔与独立员工门", wall, [[-7, .2], [-5.3, .2], [-5.3, 2.6], [-4.1, 2.6], [-4.1, .2], [2, .2], [2, 4.7], [-7, 4.7]], [rectangle(-1.4, 1.3, 1.25, 2.5)], 2, .24),
    box("传餐孔下方实际与墙搭接的柜体", -.05, .75, 1.9, 2.9, 1.1, .75, counter),
    box("传餐口真正可放碗的贯墙台面", -.05, 1.34, 1.9, 3.1, .08, .9, wood),
    box("后厨落地操作柜与灶台", -3, .65, 6.5, 5.5, .9, 1.3, counter),
    box("灶柜上连续金属操作面", -3, 1.14, 6.5, 5.65, .08, 1.4, dark),
    box("前店檐下不堵门的窄店头牌面", 0, 3.7, -8.24, 13.8, .45, .12, wood),
  ];
  const seats: SolidBox[] = [], supports: SolidBox[] = [];
  for (const z of [-5.5, -1]) {
    seats.push({ center: [-6.1, .52, z], size: [.72, .64, 3.2] }, { center: [-6.5, 1.05, z], size: [.15, 1.1, 3.2] }, { center: [-4.75, 1.0, z], size: [1.8, .1, 1.4] });
    supports.push({ center: [-4.75, .575, z], size: [.16, .75, .8] });
    seats.push({ center: [2.4, 1, z], size: [1.4, .1, 1.8] });
    supports.push({ center: [2.4, .575, z], size: [.18, .75, .9] });
    for (const x of [1.1, 3.7]) seats.push({ center: [x, .475, z], size: [.55, .55, 2.1] }, { center: [x + (x < 2 ? -.3 : .3), .9, z], size: [.12, .85, 2.1] });
  }
  for (const z of [2.1, 5, 8]) supports.push({ center: [7.1, 1.515, z], size: [.16, 2.63, .16] });
  for (let index = 0; index < seats.length; index += 20) p.push(boxesMesh("面馆前堂保留横纵走道的全部卡座桌面", wood, seats.slice(index, index + 20)));
  p.push(boxesMesh("面馆所有桌脚和侧工作巷落地承柱", dark, supports));

  const low: Triple[] = [[-4.9, 2.6, 5.8], [-1.1, 2.6, 5.8], [-1.1, 2.6, 7.2], [-4.9, 2.6, 7.2]], high: Triple[] = [[-3.3, 3.2, 6.2], [-2.7, 3.2, 6.2], [-2.7, 3.2, 6.8], [-3.3, 3.2, 6.8]];
  for (let index = 0; index < 4; index++) p.push(slopePanel("灶台上方真实内外表面且上下贯通的集烟罩壁", [low[index]!, low[(index + 1) % 4]!, high[(index + 1) % 4]!, high[index]!], .04, counter));
  p.push(boxesMesh("从烟罩贯穿真实屋孔的四面空心排烟管", counter, [
    { center: [-3.275, 4.44, 6.5], size: [.05, 2.52, .6] }, { center: [-2.725, 4.44, 6.5], size: [.05, 2.52, .6] },
    { center: [-3, 4.44, 6.225], size: [.5, 2.52, .05] }, { center: [-3, 4.44, 6.775], size: [.5, 2.52, .05] },
  ]));
  return p;
}

function mezzanineCafe(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("沿斜街收分的咖啡馆完整梯形地面", paving, [[-6, -7], [3, -7], [7, 7], [-6, 7]], .2, [0, 0, 0]),
    hardFloor("后夹层真实避开前上行楼梯的边井楼板", wood, [[-6, 1], [-5.7, 1], [-5.7, 2.8], [-3.3, 2.8], [-3.3, 1], [37 / 7, 1], [7, 7], [-6, 7]], .25, [0, 2.95, 0]),
    hardFloor("闭合斜街外壳且与承墙相接的平屋盖", steel, [[-6.3, -7.3], [3.22, -7.3], [7.35, 7.3], [-6.3, 7.3]], .25, [0, 6.4, 0]),
    ...glazedWall("咖啡馆通高前堂真正的临街门与高窗", [-6, -7], [3, -7], .2, 6.4, [[-2.8, .8, 2.6, 4.2], [2.8, .8, 2.6, 4.2]], [[0, .2, 1.6, 2.7]]),
    ...glazedWall("斜街立面真实侧门及上下层独立窗孔", [3, -7], [7, 7], .2, 6.4, [[-4.3, .7, 3.5, 4.4], [3.8, 3.8, 4.2, 1.8]], [[0, .2, 1.5, 2.6]]),
    ...glazedWall("咖啡馆后墙夹层真窗与吧后工作门", [-6, 7], [7, 7], .2, 6.4, [[1.9, 3.8, 6.4, 1.8]], [[-1, .2, 1.1, 2.5]]),
    ...glazedWall("沿楼梯外侧完整承墙的真实高采光口", [-6, -7], [-6, 7], .2, 6.4, [[-2.8, 4.5, 3.2, 1.1], [3.2, 4.5, 3.2, 1.1]]),
    stairFlight("从通高前堂实际穿过夹层边井的实体内阶", -4.5, .2, -3.7, 2, 12, .25, .5),
    box("内阶高端真正接入夹层边井后缘的短平台", -4.5, 3.075, 2.55, 2, .25, .5, wood),
    box("夹层下后吧台留出背后员工通路的柜体", .8, .75, 4.8, 5.4, 1.1, .8, counter),
    box("后吧柜上的连续木台面", .8, 1.34, 4.8, 5.6, .08, .95, wood),
    box("后吧短边回转柜实际接合长柜", 3.05, .75, 4, .9, 1.1, 1.2, counter),
    box("咖啡馆前高窗之上独立窄招牌", -1.5, 5.65, -7.18, 8.8, .5, .12, wood),
  ];
  const structure: SolidBox[] = [
    { center: [1, 2.75, 1], size: [8.6, .4, .3] }, { center: [-4.5, 2.75, 2.8], size: [2.9, .4, .3] },
    { center: [-3.1, 1.575, 1], size: [.22, 2.75, .22] }, { center: [5.05, 1.575, 1], size: [.22, 2.75, .22] },
    { center: [-5.85, 1.575, 2.8], size: [.22, 2.75, .22] },
    { center: [-1.5, 6.1, -6.6], size: [9.2, .6, .3] }, { center: [-.5, 6.1, 0], size: [11.2, .6, .3] }, { center: [.5, 6.1, 6.6], size: [13.2, .6, .3] },
  ];
  p.push(boxesMesh("夹层跨梁接地承柱和完整跨屋横梁", steel, structure));
  const posts: SolidBox[] = [], furniture: SolidBox[] = [];
  for (const side of [-1, 1]) {
    p.push(rail([-4.5 + side * .97, 1.2, -3.7], [-4.5 + side * .97, 4.2, 2.3], .065, steel));
    for (let index = 0; index <= 6; index++) posts.push({ center: [-4.5 + side * .97, .725 + index * .5, -3.7 + index], size: [.06, 1.05, .06] });
  }
  for (const [x0, z0, x1, z1] of [[-3.25, 1.05, 37 / 7, 1.05], [-3.25, 1.05, -3.25, 2.8], [-5.75, 1, -5.75, 2.8]]) {
    p.push(rail([x0!, 4.25, z0!], [x1!, 4.25, z1!], .065, steel));
    const count = Math.max(1, Math.ceil(Math.hypot(x1! - x0!, z1! - z0!) / 1.8));
    for (let index = 0; index <= count; index++) posts.push({ center: [x0! + (x1! - x0!) * index / count, 3.725, z0! + (z1! - z0!) * index / count], size: [.06, 1.05, .06] });
  }
  for (let index = 0; index < posts.length; index += 20) p.push(boxesMesh("内阶和夹层临空处全部实际接地的栏杆立柱", steel, posts.slice(index, index + 20)));
  for (const [x, y, z] of [[1.6, .2, -4.5], [2.6, .2, -1.6], [-.5, 3.2, 4.7], [3.2, 3.2, 4.7]]) {
    furniture.push({ center: [x!, y! + .75, z!], size: [1.25, .09, .9] }, { center: [x!, y! + .3525, z!], size: [.16, .705, .5] });
    for (const side of [-1, 1]) furniture.push({ center: [x!, y! + .225, z! + side * .95], size: [.65, .45, .6] }, { center: [x!, y! + .6, z! + side * 1.2], size: [.65, .75, .1] });
  }
  for (let index = 0; index < furniture.length; index += 20) p.push(boxesMesh("上下层保留门口及上阶走道的全部桌椅", wood, furniture.slice(index, index + 20)));
  return p;
}
