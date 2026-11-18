import { part, type ModelPart, type Triple } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { waistStair } from "./publicSpaceBatchFourteen";
import { rectangularFlue } from "./spatialShells";
import { slopePanel } from "./vernacularWorldBatchOne";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";
import { packMeshes } from "./vernacularWorldBatchThirteen";
import { box, design, type ArchitecturePrototype } from "./structures";

const stone = "#b1b4a7", timber = "#9c8260", plaster = "#d2caba", roof = "#6d7d77", textile = "#9fa99c";

function centralPassageFamilyHouse(): ModelPart[] {
  const outline: [number, number][] = [[-8, -6], [8, -6], [8, 6], [-8, 6]], stairHole: [number, number][] = [[1.42, -.6], [4.28, -.6], [4.28, 3.4], [1.42, 3.4]];
  const parts: ModelPart[] = [
    box("独户宅外墙与前门廊共同落地的连续基础", 0, .11, 0, 17.2, .22, 13.2, stone),
    hardFloor("前后贯厅与四角公共房间连续相接的首层木地面", timber, outline, .08, [0, .22, 0]),
    hardFloor("上层中央私厅与三卧卫浴保留侧折返梯真实井口的楼板", timber, outline, .2, [0, 3.1, 0], [stairHole]),
    box("全部上层私室上方实际接入内外墙的平顶棚", 0, 6.13, 0, 16, .14, 12, plaster),
    box("前门廊与室内首层相平的完整落地石台", 0, .15, -6.85, 3.3, .3, 1.7, stone),
    box("前门廊外与石台相接的低踏步", 0, .075, -7.9, 1.7, .15, .5, stone),
    box("后花园门外与贯厅木地面相接的完整低踏台", 0, .15, 6.55, 1.8, .3, 1.1, stone),
  ];
  for (const [base, top] of [[.3, 3.1], [3.3, 6.3]]) {
    const upper = base! > 1;
    parts.push(
      ...glazedWall("前立面中央入口或私厅窗与两侧房间窗共同开在真实厚壁中", [-8, -6], [8, -6], base!, top!, upper ? [[-4.7, base! + .85, 2.4, 1.6], [0, base! + .85, 1.4, 1.6], [4.7, base! + .85, 2.4, 1.6]] : [[-4.7, 1.15, 2.8, 1.6], [4.7, 1.15, 2.8, 1.6]], upper ? [] : [[0, .3, 1.3, 2.2]]),
      ...glazedWall("后立面房间采光与中轴花园门或楼上厅窗真实贯通", [8, 6], [-8, 6], base!, top!, [[-4.7, base! + .85, 2.4, 1.6], [4.7, base! + .85, 2.4, 1.6], ...(upper ? [[0, base! + .85, 1.4, 1.6] as [number, number, number, number]] : [])], upper ? [] : [[0, .3, 1.1, 2.2]]),
      ...glazedWall("西侧前后独立房间分别透光的完整外承壁", [-8, 6], [-8, -6], base!, top!, [[-3, base! + .85, 2.6, 1.6], [3, base! + .85, 2.6, 1.6]]),
      ...glazedWall("东侧书房厨务或卧浴采光的完整外承壁", [8, -6], [8, 6], base!, top!, [[-3.7, base! + .85, 2.2, 1.6], [3.8, base! + (upper ? 1.7 : 1.05), 1.8, upper ? .75 : 1.35]]),
    );
  }
  parts.push(
    ...glazedWall("贯厅西壁分别进入客厅与后餐厅的两座真实内门", [-1.35, -6], [-1.35, 6], .3, 3.1, [], [[-3.6, .3, 1.1, 2.15], [3.7, .3, 1.1, 2.15]]),
    ...glazedWall("贯厅东壁分别进入书房侧梯和后厨务过厅的独立内门", [1.35, -6], [1.35, 6], .3, 3.1, [], [[-3.7, .3, 1, 2.15], [-1, .3, 1.15, 2.15], [4.4, .3, 1, 2.15]]),
    ...glazedWall("首层客厅与餐厅之间可直接传行而非穿越卧室的宽门分隔", [-8, 0], [-1.35, 0], .3, 3.1, [], [[0, .3, 1.8, 2.3]]),
    ...glazedWall("首层书房后壁将公共书房与侧梯厨务交通分开", [1.35, -1.8], [8, -1.8], .3, 3.1, []),
    ...glazedWall("侧折返梯与厨房之间真实可进出的整片防隔墙", [4.65, -1.8], [4.65, 6], .3, 3.1, [], [[2.3, .3, .95, 2.15]]),
    ...glazedWall("上层西侧中央私厅独立分接前后两间卧室", [-1.35, -6], [-1.35, 6], 3.3, 6.3, [], [[-3.6, 3.3, .9, 2.15], [3.7, 3.3, .9, 2.15]]),
    ...glazedWall("上层东侧私厅分别进入梯前分配廊与后卫浴前厅", [1.35, -6], [1.35, 6], 3.3, 6.3, [], [[-1.05, 3.3, 1.1, 2.15], [4.4, 3.3, .9, 2.15]]),
    ...glazedWall("楼上前后西卧室之间与下层横隔墙对齐的完整承墙", [-8, 0], [-1.35, 0], 3.3, 6.3, []),
    ...glazedWall("前东卧室经梯前横廊独立进入的真正私室门", [1.35, -1.8], [8, -1.8], 3.3, 6.3, [], [[2.1, 3.3, .9, 2.15]]),
    ...glazedWall("上层独用卫浴与梯后分配前厅分开的真实门壁", [4.65, -1.8], [4.65, 6], 3.3, 6.3, [], [[2.3, 3.3, .8, 2.1]]),
  );
  parts.push(
    waistStair("侧内梯下跑从地面沿独立梯厅升到完整换向台", 2.1, .3, -1.5, 1.2, 9, 1 / 6, .4),
    waistStair("侧内梯上跑换向后穿过真实梯井接入楼上私厅", 3.6, 1.8, 2.1, 1.2, 9, 1 / 6, .3, true),
    box("两跑侧内梯之间连续接合且保留转向净宽的换向台", 2.85, 1.7, 2.7, 2.7, .2, 1.2, stone),
    box("上跑末级真正跨回楼板孔边的短落脚台", 3.6, 3.2, -.7, 1.3, .2, .3, timber),
  );
  for (const x of [1.6, 4.1]) parts.push(box("换向台从首层木地面完整承起的独立短柱", x, .95, 2.7, .18, 1.3, .24, timber));
  const guards: ModelPart[] = [];
  for (const [x, z, base, reverse, run] of [[2.1, -1.5, .3, false, .4], [3.6, 2.1, 1.8, true, .3]] as [number, number, number, boolean, number][]) for (const side of [-1, 1]) {
    const direction = reverse ? -1 : 1, low: Triple = [x + side * .55, base + 1 / 6, z + direction * run / 2], high: Triple = [x + side * .55, base + 1.5, z + direction * run * 8.5];
    guards.push(meshBeam("住宅内梯随全部踏面升起的连续细扶手", [low[0], low[1] + .9, low[2]], [high[0], high[1] + .9, high[2]], .05, timber), meshBeam("内梯扶手下端实际落在首级踏面的短柱", low, [low[0], low[1] + .9, low[2]], .05, timber), meshBeam("内梯扶手上端实际落在末级踏面的短柱", high, [high[0], high[1] + .9, high[2]], .05, timber));
  }
  for (const [a, b] of [[[1.4, -.62], [1.4, 3.44]], [[1.4, 3.44], [4.3, 3.44]], [[4.3, 3.44], [4.3, -.62]], [[1.4, -.62], [2.95, -.62]]] as [[number, number], [number, number]][]) {
    guards.push(meshBeam("上层梯井周边避开末级出入口的连续护栏", [a[0], 4.3, a[1]], [b[0], 4.3, b[1]], .05, timber));
  }
  for (const [x, z] of [[1.4, -.62], [1.4, 3.44], [4.3, 3.44], [4.3, -.62], [2.95, -.62]]) guards.push(meshBeam("梯井护栏真正落在孔边完整楼板上的立柱", [x!, 3.3, z!], [x!, 4.3, z!], .05, timber));
  for (const y of [2.3, 2.8]) {
    guards.push(meshBeam("侧梯换向台后沿实际支在中台立柱上的连续防坠横栏", [1.55, y, 3.26], [4.15, y, 3.26], .05, timber));
    for (const x of [1.55, 4.15]) guards.push(meshBeam("侧梯中换台两侧保留上下跑入口的连续防坠横栏", [x, y, 2.13], [x, y, 3.26], .05, timber));
  }
  for (const x of [1.55, 2.4, 3.3, 4.15]) guards.push(meshBeam("侧梯中换台后护栏从一米八台面实际承起的独立立柱", [x, 1.8, 3.26], [x, 2.8, 3.26], .05, timber));
  for (const x of [1.55, 4.15]) guards.push(meshBeam("侧梯中换台侧栏前端实落台面且不封入阶口的立柱", [x, 1.8, 2.13], [x, 2.8, 2.13], .05, timber));
  parts.push(...packMeshes("侧内梯与真实上层梯井完整接承的木栏架", timber, guards));
  const roofFrames: ModelPart[] = [];
  for (const x of [-1.35, 1.35]) {
    roofFrames.push(meshBeam("中央贯厅两侧承墙顶上直接支承的屋架横系木", [x, 6.25, -6.1], [x, 6.25, 6.1], .18, timber), meshBeam("屋架从完整内承墙顶直接升至高脊的王柱", [x, 6.25, 0], [x, 8.1, 0], .15, timber));
    for (const side of [-1, 1]) roofFrames.push(meshBeam("从前后外墙头连续接到髋坡高脊的承屋斜椽", [x, 6.25, side * 6.1], [x, 8.1, 0], .17, timber));
  }
  parts.push(...packMeshes("两道内承墙支起整宅四坡屋盖的完整木屋架", timber, roofFrames),
    slopePanel("住宅面街长髋坡完整覆盖前部三间空间", [[-8.5, 6.2, -6.5], [8.5, 6.2, -6.5], [2, 8.24, 0], [-2, 8.24, 0]], .16, roof),
    slopePanel("住宅面后院长髋坡与前坡在真实高脊闭合", [[-8.5, 6.2, 6.5], [-2, 8.24, 0], [2, 8.24, 0], [8.5, 6.2, 6.5]], .16, roof),
    slopePanel("住宅西端三角髋坡实际闭合两侧长屋面", [[-8.5, 6.2, -6.5], [-2, 8.24, 0], [-8.5, 6.2, 6.5]], .16, roof),
    slopePanel("住宅东端三角髋坡实际闭合两侧长屋面", [[8.5, 6.2, -6.5], [8.5, 6.2, 6.5], [2, 8.24, 0]], .16, roof),
    slopePanel("入口低门廊屋盖后缘真正嵌入主宅前厚壁", [[-1.75, 3.1, -7.75], [1.75, 3.1, -7.75], [1.75, 3.42, -6.06], [-1.75, 3.42, -6.06]], .14, roof),
  );
  for (const x of [-1.4, 1.4]) parts.push(box("前门廊低屋盖从石台直接承起的完整木柱", x, 1.6, -7.5, .2, 2.6, .2, timber));
  parts.push(box("前门廊两柱顶与低坡壳实际相接的通长承檐枋", 0, 2.94, -7.5, 3.2, .18, .22, timber));
  const furniture: Record<string, ModelPart[]> = { [timber]: [], [plaster]: [], [stone]: [], [textile]: [] };
  const furnish = (name: string, color: string, x: number, y: number, z: number, w: number, h: number, d: number) => furniture[color]!.push(solidBox(name, x, y, z, w, h, d, color));
  for (const [x, z] of [[-4.8, -3.4], [-4.8, 3.1], [5.5, -3.7]]) {
    furnish("上层各独立卧室实际落在完整木楼面的床架", timber, x!, 3.5, z!, 1.8, .4, 2.1);
    furnish("卧室床架上完整贴合的织物床垫", plaster, x!, 3.76, z!, 1.76, .12, 2.06);
    furnish("三间卧室床后与地面相接的完整床头板", timber, x!, 3.92, z! + 1.05, 1.85, 1.24, .12);
  }
  for (const [x, z] of [[-7.35, -1.3], [-7.35, 5.2], [7.3, -2.7]]) furnish("上层卧室避开门窗而独立落地的衣柜", plaster, x!, 4.4, z!, .6, 2.2, 1.4);
  furnish("首层客厅完整落地的长沙发座", textile, -6.4, .52, -3.1, 1.1, .44, 3);
  furnish("客厅长沙发与座面相接的高软背", textile, -6.87, .94, -3.1, .16, .9, 3);
  furnish("客厅茶几自木地面承起的宽底座", timber, -4.6, .48, -3.1, 1.1, .36, 1.7);
  furnish("茶几宽底座上实际贴合的薄桌面", stone, -4.6, .69, -3.1, 1.25, .06, 1.9);
  furnish("首层独立书房后壁前接地的整面矮书柜", timber, 5.8, 1.2, -2.25, 3.1, 1.8, .55);
  furnish("书房中独立接地的宽桌脚", timber, 5.5, .67, -4, .55, .74, .8);
  furnish("书房宽脚上接合的完整书桌面", timber, 5.5, 1.08, -4, 2.1, .08, 1.1);
  furnish("后餐厅长桌真正落地的双宽脚之一", timber, -5.65, .67, 3.2, .3, .74, .85);
  furnish("后餐厅长桌真正落地的双宽脚之二", timber, -3.65, .67, 3.2, .3, .74, .85);
  furnish("两脚共承并保留四周通行的完整餐桌面", timber, -4.65, 1.08, 3.2, 3, .08, 1.2);
  for (const side of [-1, 1]) {
    furnish("餐桌两侧自地面承起的完整长凳脚", timber, -4.65, .49, 3.2 + side * 1.1, 2.2, .38, .35);
    furnish("长凳脚上实际相接的浅色凳面", textile, -4.65, .71, 3.2 + side * 1.1, 2.5, .06, .5);
  }
  furnish("后厨房沿东墙真实落地的长地柜", timber, 7.45, .72, 2.2, .7, .84, 5.2);
  furnish("长地柜上实际贴合的连续厨房操作台", stone, 7.45, 1.18, 2.2, .75, .08, 5.25);
  furnish("厨房后墙前真正落地并避开服务门的独立冰箱", plaster, 5.25, 1.23, 5.3, .8, 1.86, .8);
  furnish("楼上独立卫浴内实际落地的淋浴托盘", plaster, 6.9, 3.35, 4.9, 1.45, .1, 1.4);
  furnish("上层坐便器接地的完整短支座", plaster, 5.35, 3.5, 1.3, .44, .4, .5);
  furnish("坐便短支座上贴合的便座", plaster, 5.35, 3.74, 1.3, .6, .12, .75);
  furnish("坐便座后端相接的完整小水箱", plaster, 5.35, 4.03, 1.62, .56, .7, .18);
  furnish("上层卫浴避开门洞的落地洗手台柜", timber, 7.35, 3.72, -.8, .7, .84, .6);
  furnish("洗手台柜上真实贴合的浅色盆台", plaster, 7.35, 4.2, -.8, .75, .12, .65);
  for (const [color, pieces] of Object.entries(furniture)) parts.push(...packMeshes("独户宅公共起居书房餐厨和上层卧浴实际落地的固定家具", color, pieces));
  return parts;
}

function centralHearthKneeWallHouse(): ModelPart[] {
  const outline: [number, number][] = [[-6, -5], [6, -5], [6, 5], [-6, 5]], core: [number, number][] = [[-.75, -1.25], [.75, -1.25], [.75, .25], [-.75, .25]], stairHole: [number, number][] = [[-1.42, 1.5], [1.42, 1.5], [1.42, 4.9], [-1.42, 4.9]];
  const roofY = (x: number) => 7.6 - Math.abs(x) * 4.1 / 6.4;
  const parts: ModelPart[] = [
    box("炉芯半层宅全部厚壁和入户踏台共同落地的石基础", 0, .11, 0, 12.8, .22, 10.8, stone),
    hardFloor("前公共厅绕中央炉芯接入后睡厨卫的完整首层木地板", timber, outline, .08, [0, .22, 0]),
    hardFloor("整屋坡下卧室与中央分室廊共同保留炉芯和折返梯真洞的楼板", timber, outline, .2, [0, 2.9, 0], [core, stairHole]),
    hardFloor("首层顶棚真实避开贯通炉芯和后折返梯井", plaster, outline, .06, [0, 2.84, 0], [core, stairHole]),
    box("中央前门外与木地面实际相平的完整石踏台", 0, .15, -5.55, 1.8, .3, 1.1, stone),
    box("前踏台外侧自地面连续接起的低一级入户步", 0, .075, -6.3, 1.4, .15, .4, stone),
    box("厨房侧门外真正接入室内地面的落地低石台", 6.55, .15, .9, 1.1, .3, 1.5, stone),
    box("中央炉芯火口前方实际落在地板上的不燃宽石床", 0, .35, -.6, 2, .1, 2, stone),
    rectangularFlue("中央厚砖炉芯从真实火室口穿越楼板和屋面洞的完整空烟道", 1.5, 1.5, 6.2, .24, [0, 2.1, -.5], "#a88c72"),
    box("中央火室后端从炉床接到空烟道底的完整厚砖背壁", 0, 1.2, .13, 1.5, 1.8, .24, "#a88c72"),
    box("真实敞开炉口上方接入烟道前壁的完整砖楣", 0, 1.95, -1.13, 1.5, .3, .24, "#a88c72"),
  ];
  for (const side of [-1, 1]) parts.push(box("两侧炉腿从不燃炉床连续托起贯通砖烟道", side * .63, 1.2, -.5, .24, 1.8, 1.5, "#a88c72"));
  parts.push(
    ...glazedWall("半层宅面街前厅的中央实门与两侧起居餐窗", [-6, -5], [6, -5], .3, 3.65, [[-3.7, 1.15, 2.3, 1.5], [3.7, 1.15, 2.3, 1.5]], [[0, .3, 1.15, 2.2]]),
    ...glazedWall("后卧室卫浴与梯间均有真实采光孔的完整后壁", [6, 5], [-6, 5], .3, 3.65, [[-3.5, 1.9, 1.3, .75], [0, 2.1, 1.2, .65], [3.6, 1.15, 2.1, 1.5]]),
    ...glazedWall("低宅西侧从前客厅连续封合到后主卧的真实窗壁", [-6, 5], [-6, -5], .3, 3.65, [[-2.8, 1.15, 2.1, 1.5], [2.8, 1.15, 2.1, 1.5]]),
    ...glazedWall("低宅东侧厨房的独立服务门避开公共前门", [6, -5], [6, 5], .3, 3.65, [[-2.8, 1.15, 2.1, 1.5]], [[.9, .3, .9, 2.15]]),
    ...glazedWall("首层后主卧从公共厅独立进出的真实私室门", [-6, .9], [-1.8, .9], .3, 2.9, [], [[-.4, .3, .85, 2.1]]),
    ...glazedWall("后主卧与内折返梯之间真正支承阁层的完整分隔", [-1.8, .9], [-1.8, 5], .3, 2.9, []),
    ...glazedWall("厨房前门独立连接起居餐厅而不穿越后主卧", [1.8, -.9], [6, -.9], .3, 2.9, [], [[.3, .3, .9, 2.1]]),
    ...glazedWall("后厨房与中心折返梯之间连续承住阁板的实墙", [1.8, -.9], [1.8, 5], .3, 2.9, []),
    ...glazedWall("后卫浴从厨房服务带独立进入的真门和完整隔壁", [1.8, 3], [6, 3], .3, 2.9, [], [[-.5, .3, .8, 2.1]]),
  );
  const windows: [number, number, number, number][] = [[-3, 4.1, 1, 1.05], [3, 4.1, 1, 1.05]];
  for (const end of [-1, 1]) {
    const gable = hardFloor("真正包住坡下卧室并保留两座上层窗孔的连续高山墙", plaster, [[-6, 3.65], [6, 3.65], [0, 7.5]], .24, [0, 0, end < 0 ? -5 : 5.24], windows.map(([x, y, width, height]): [number, number][] => [[x - width / 2, y], [x + width / 2, y], [x + width / 2, y + height], [x - width / 2, y + height]]));
    gable.rotation.x = -90; parts.push(gable);
    for (const [x, y, width, height] of windows) parts.push(part("高山墙真实采光孔内独立贴合的透明玻璃", "box", "#a4c4bf", [x, y + height / 2, end * 5.12], [width, height, .035], [0, 0, 0], { opacity: .28, roughness: .2 }));
  }
  for (const side of [-1, 1]) {
    parts.push(box("坡下卧室外缘将低檐储藏与可居睡区分开的真实膝墙", side * 4.6, (3.1 + roofY(4.6) - .16) / 2, 0, .12, roofY(4.6) - .16 - 3.1, 10, plaster),
      ...glazedWall("两间坡下私室经中央炉芯后分配廊各自独立入户", [side * 1.8, -5], [side * 1.8, 5], 3.1, roofY(1.8) - .16, [], [[1.1, 3.1, .85, 2.1]]));
    for (const [from, to] of [[-5.4, -1.25], [.25, 5.4]]) parts.push(slopePanel("中央烟道前后完整连到高脊的真实双坡屋面", [[side * 6.4, 3.5, from!], [0, 7.6, from!], [0, 7.6, to!], [side * 6.4, 3.5, to!]], .16, roof));
    parts.push(slopePanel("中央烟道两侧准确止于砖壁外缘而不封烟口的屋坡", [[side * 6.4, 3.5, -1.25], [side * .75, roofY(.75), -1.25], [side * .75, roofY(.75), .25], [side * 6.4, 3.5, .25]], .16, roof));
  }
  parts.push(
    waistStair("炉芯后侧折返内梯下跑从公共厅落地起步", -.8, .3, 1.2, 1.2, 8, .175, .3),
    waistStair("后侧折返内梯上跑经真实长井接入坡下分配廊", .8, 1.7, 3.6, 1.2, 8, .175, .2625, true),
    box("两跑半层内梯之间与阶板实际接合的完整后换向台", 0, 1.6, 4.2, 2.8, .2, 1.2, timber),
    box("半层内梯末级与上层木楼板孔边真实搭接的落脚台", .8, 3, 1.4, 1.3, .2, .4, timber),
  );
  for (const x of [-1.25, 1.25]) parts.push(box("后换向台真正从首层木地面承起的独立支柱", x, .9, 4.1, .18, 1.2, .24, timber));
  const framing: ModelPart[] = [], guards: ModelPart[] = [];
  for (const z of [-4.2, 1.4, 4.2]) {
    for (const side of [-1, 1]) framing.push(meshBeam("从完整低外墙越过真实膝墙升到高脊的全长斜椽", [side * 6, 3.66, z], [0, 7.45, z], .18, timber));
    framing.push(meshBeam("两侧斜椽之间真实交接而保留坡下室净高的横领梁", [-2.3, 5.98, z], [2.3, 5.98, z], .16, timber));
  }
  for (const side of [-1, 1]) framing.push(meshBeam("完整低侧墙头贯通并接住每榀斜椽的木檐承枋", [side * 6, 3.6, -5], [side * 6, 3.6, 5], .18, timber), meshBeam("每道真实膝墙顶端纵向接住三榀斜椽的承檩", [side * 4.6, roofY(4.6) - .15, -5], [side * 4.6, roofY(4.6) - .15, 5], .16, timber));
  for (const [from, to] of [[-5.2, -1.25], [.25, 5.2]]) framing.push(meshBeam("两端山墙共同承住并准确避开烟道穿口的高脊木", [0, 7.45, from!], [0, 7.45, to!], .18, timber));
  parts.push(...packMeshes("半层宅低侧墙膝墙高山面共同承托的完整陡坡木屋架", timber, framing));
  for (const [x, z, base, reverse, run] of [[-.8, 1.2, .3, false, .3], [.8, 3.6, 1.7, true, .2625]] as [number, number, number, boolean, number][]) for (const side of [-1, 1]) {
    const direction = reverse ? -1 : 1, low: Triple = [x + side * .55, base + .175, z + direction * run / 2], high: Triple = [x + side * .55, base + 1.4, z + direction * run * 7.5];
    guards.push(meshBeam("半层宅折返内梯随真实踏面连续升起的扶手", [low[0], low[1] + .9, low[2]], [high[0], high[1] + .9, high[2]], .05, timber), meshBeam("内梯扶手首端从低踏面实际承起的短柱", low, [low[0], low[1] + .9, low[2]], .05, timber), meshBeam("内梯扶手末端从高踏面实际承起的短柱", high, [high[0], high[1] + .9, high[2]], .05, timber));
  }
  for (const [a, b] of [[[-1.45, 1.48], [-1.45, 4.94]], [[-1.45, 4.94], [1.45, 4.94]], [[1.45, 4.94], [1.45, 1.48]], [[-1.45, 1.48], [.15, 1.48]]] as [[number, number], [number, number]][]) guards.push(meshBeam("中央分室廊绕真实上层梯井且避开到达口的细护栏", [a[0], 4.1, a[1]], [b[0], 4.1, b[1]], .05, timber));
  for (const [x, z] of [[-1.45, 1.48], [-1.45, 4.94], [1.45, 4.94], [1.45, 1.48], [.15, 1.48]]) guards.push(meshBeam("坡下分室廊井边护栏实际落在完整木楼板上的立柱", [x!, 3.1, z!], [x!, 4.1, z!], .05, timber));
  for (const y of [2.2, 2.7]) {
    guards.push(meshBeam("半层中换台后沿实落台面立柱上的连续防坠横栏", [-1.35, y, 4.76], [1.35, y, 4.76], .05, timber));
    for (const side of [-1, 1]) guards.push(meshBeam("半层中换台两侧避开上下跑入口的连续防坠横栏", [side * 1.35, y, 3.63], [side * 1.35, y, 4.76], .05, timber));
  }
  for (const x of [-1.35, -.45, .45, 1.35]) guards.push(meshBeam("中换台后护栏从一米七台面真实落脚的独立立柱", [x, 1.7, 4.76], [x, 2.7, 4.76], .05, timber));
  for (const side of [-1, 1]) guards.push(meshBeam("中换台侧护栏前端实落台面且不封换跑口的独立立柱", [side * 1.35, 1.7, 3.63], [side * 1.35, 2.7, 3.63], .05, timber));
  parts.push(...packMeshes("中央炉芯后侧真实折返内梯与上井口的完整安全栏", timber, guards));
  const furniture: Record<string, ModelPart[]> = { [timber]: [], [plaster]: [], [stone]: [], [textile]: [] };
  const furnish = (name: string, color: string, x: number, y: number, z: number, w: number, h: number, d: number) => furniture[color]!.push(solidBox(name, x, y, z, w, h, d, color));
  for (const side of [-1, 1]) {
    furnish("坡下两侧独立卧室真正落在上层木楼面的床架", timber, side * 3.15, 3.3, -2.8, 1.6, .4, 2.1);
    furnish("独立坡下卧床上实际贴合的完整织物床垫", plaster, side * 3.15, 3.56, -2.8, 1.56, .12, 2.06);
    furnish("两间坡下卧床后真正接地的床头板", timber, side * 3.15, 3.72, -3.85, 1.65, 1.24, .12);
    furnish("坡下卧室高净空内侧真正落地的完整长衣柜", plaster, side * 2.45, 4, 3.9, .6, 1.8, 1.4);
    furnish("两间坡下卧室后端书桌实际落地的宽脚", timber, side * 3.2, 3.47, 1, .5, .74, .6);
    furnish("坡下书桌宽脚上真正相接的薄桌面", timber, side * 3.2, 3.88, 1, 1.4, .08, .8);
  }
  furnish("首层后主卧独立落地的双人床架", timber, -4.1, .5, 3.2, 1.8, .4, 2.1);
  furnish("主卧床架上实际贴合的织物床垫", plaster, -4.1, .76, 3.2, 1.76, .12, 2.06);
  furnish("首层主卧床后真正落地的完整床头板", timber, -4.1, .92, 4.25, 1.85, 1.24, .12);
  furnish("前客厅朝向中央真实火口的完整落地沙发座", textile, -3.3, .52, -2.4, 2.9, .44, 1.1);
  furnish("前客厅沙发座后缘相接的软靠背", textile, -3.3, .94, -2.87, 2.9, .9, .16);
  furnish("起居低茶几自木地面承起的完整宽底座", timber, -3.3, .48, -1, 1.4, .36, .65);
  furnish("低茶几宽底座上实际贴合的薄桌面", stone, -3.3, .69, -1, 1.6, .06, .8);
  furnish("前餐区避开中轴前门的宽桌脚", timber, 3.5, .67, -3.1, .6, .74, .8);
  furnish("前餐区宽桌脚上真实接合的完整桌面", timber, 3.5, 1.08, -3.1, 2.1, .08, 1.2);
  for (const side of [-1, 1]) {
    furnish("前餐桌两侧独立落地的长凳脚", timber, 3.5, .49, -3.1 + side * 1.05, 1.5, .38, .35);
    furnish("独立长凳脚上真正相接的软凳面", textile, 3.5, .71, -3.1 + side * 1.05, 1.8, .06, .5);
  }
  furnish("厨房后卫浴隔壁前避开侧门的完整落地长地柜", timber, 4.35, .72, 2.55, 2.6, .84, .65);
  furnish("厨房长地柜上实际贴合的连续操作台面", stone, 4.35, 1.18, 2.55, 2.65, .08, .7);
  furnish("后厨房近内侧墙真正落地的完整冰箱", plaster, 2.35, 1.23, 1.25, .75, 1.86, .8);
  furnish("后卫浴外角与地面相接的完整淋浴托盘", plaster, 5.1, .35, 4.25, 1.2, .1, 1.2);
  furnish("后卫浴坐便器真正落地的独立支座", plaster, 2.5, .5, 4.1, .44, .4, .5);
  furnish("坐便器支座上完整相接的座体", plaster, 2.5, .74, 4.1, .6, .12, .75);
  furnish("坐便器座后实际贴合的小水箱", plaster, 2.5, 1.03, 4.42, .56, .7, .18);
  furnish("后卫浴近门处独立落地的洗手柜", timber, 5.35, .72, 3.4, .6, .84, .55);
  furnish("洗手柜上完整相接的浅色盆台", plaster, 5.35, 1.2, 3.4, .65, .12, .6);
  for (const [color, pieces] of Object.entries(furniture)) parts.push(...packMeshes("半层宅完整公共厅后主卧厨卫与坡下私室各自接地的固定家具", color, pieces));
  return parts;
}

export const suburbanResidenceSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("前后贯厅侧折返梯四角分室独户宅", "面街门廊进入贯通后花园的中央厅，首层客厅书房与后餐厨各有独立门并保留厨务服务交通；侧折返内梯穿过真实楼板井到达中央私厅，上层三间独立卧室与后卫浴组成完整家庭宅，内外承墙与木屋架共同支起闭合四坡屋盖", centralPassageFamilyHouse, "建筑", "欧式"),
  design("中央炉芯回廊膝墙半层家庭宅", "低层前公共厅绕真实中央火室连接后主卧与独立厨房卫浴，炉芯后的折返梯经实际楼板井进入中央分室廊，坡下左右卧室分别以真实膝墙划开低檐储藏；陡坡木屋架与山墙共同围住整屋半层，空烟道精确穿过真实楼板与屋面洞而不占用门路", centralHearthKneeWallHouse, "建筑", "欧式"),
];
