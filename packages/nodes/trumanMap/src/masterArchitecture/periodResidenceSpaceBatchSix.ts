import type { ModelPart, Triple } from "../assetModelParts";
import { box, design } from "./structures";
import { slopePanel } from "./vernacularWorldBatchOne";
import { endGable } from "./vernacularWorldBatchTwo";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";
import { packMeshes } from "./vernacularWorldBatchThirteen";
import { lattice, periodWall } from "./periodResidenceSpaceBatchOne";

const brick = "#a28c77", plaster = "#c5bcaa", stone = "#a6a798", timber = "#8b7155", iron = "#677876", tile = "#667470";

// https://www.rth.org.uk/accessibility-guide
// https://www.rth.org.uk/building-regency-houses/structure
// 前井和服务层的类型参考；双梯平面、尺度、承墙和全部网格均为本地原创。
export const periodResidenceSpaceBatchSixDesigns = [
  design("下沉前井双梯分流砖宅", "前街跨井桥进入抬高主厅，独立下井石阶通往备餐与厨房层，后服务直梯由真实长洞接入餐厅；中部折返主梯连接前后卧室，厚共墙、上下层实门窗和穿板空烟道围成完整窄长住宅", areaDualStairTownhouse, "建筑", "欧式"),
];

function areaDualStairTownhouse(): ModelPart[] {
  const outline: [number, number][] = [[-4, -5], [4, -5], [4, 9], [-4, 9]], serviceHole: [number, number][] = [[2.3, 3], [3.7, 3], [3.7, 8.2], [2.3, 8.2]], mainHole: [number, number][] = [[-1.25, .2], [1.25, .2], [1.25, 3.85], [-1.25, 3.85]], flueHole: [number, number][] = [[-3.6, 8.1], [-2.8, 8.1], [-2.8, 8.9], [-3.6, 8.9]];
  const p: ModelPart[] = [box("前井下层厨房与外围挡土共同落地的完整石底", 0, .1, -.5, 10.6, .2, 23), box("前街在采光井外真正抬高的整段实体铺地", 0, 1.5, -10.5, 10.6, 2.6, 2, stone), hardFloor("主厅地板真实绕开后服务长梯洞和烟道的完整木楼面", timber, outline, .2, [0, 2.6, 0], [serviceHole, flueHole]), hardFloor("卧室层真实留出中央折返梯井和烟道的完整木楼面", timber, outline, .2, [0, 6, 0], [mainHole, flueHole])], walls: ModelPart[] = [], ground: ModelPart[] = [], inside: ModelPart[] = [], wood: ModelPart[] = [], metal: ModelPart[] = [], roofs: ModelPart[] = [], steps: ModelPart[] = [];
  for (const side of [-1, 1]) {
    ground.push(solidBox("前井两侧从低石底接到街面标高的完整挡土壁", side * 4.55, 1.5, -7.25, .3, 2.6, 4.5, stone), solidBox("住屋两面共墙外部真实包住低层的独立窄土岸", side * 4.65, 1.5, 2.1, 1.3, 2.6, 14.2, stone)); walls.push(solidBox("自厨房石坪连续承住主层卧层及屋盖的完整厚共墙", side * 4, 4.8, 2, .32, 9.2, 14, brick));
  }
  ground.push(solidBox("宅后与两侧低土岸实际闭合的完整挡土岸", 0, 1.5, 9.65, 10.6, 2.6, 1.3, stone));
  const basementWindows: [number, number, number, number][] = [[-.35, .85, 1.25, 1.1], [2.55, .85, 1.05, 1.1]], frontWindows: [number, number, number, number][] = [[-2.25, .9, 1.25, 1.8], [.15, .9, 1.25, 1.8]], upperWindows: [number, number, number, number][] = [[-2.55, .8, 1.15, 1.75], [0, .8, 1.15, 1.75], [2.55, .8, 1.15, 1.75]], rearWindows: [number, number, number, number][] = [[-2.15, 1, 1.2, 1.6], [.4, 1, 1.2, 1.6]];
  const rearUpperWindows: [number, number, number, number][] = [[-1.85, .8, 1.05, 1.75], [.6, .8, 1.05, 1.75], [2.7, .8, 1.05, 1.75]];
  walls.push(periodWall("前井底部真正连通下层备餐间且向井内采光的砖门窗墙", brick, 8, 2.4, .28, [0, .2, -5], [[-2.8, 1.05, 2.1]], basementWindows), periodWall("抬高主层在跨井桥末端真实开门的完整砖立面", brick, 8, 3.4, .28, [0, 2.8, -5], [[2.4, 1.2, 2.6]], frontWindows), periodWall("上层前卧室三扇真实朝街开洞的完整砖立面", brick, 8, 3.2, .28, [0, 6.2, -5], [], upperWindows), periodWall("主餐厅与独立服务梯平台后方完整封合的真窗后壁", brick, 8, 3.4, .28, [0, 2.8, 9], [], [...rearWindows, [2.9, 1, .9, 1.6]]), periodWall("后卧室向宅后实际开窗的完整高位砖外壁", brick, 8, 3.2, .28, [0, 6.2, 9], [], rearUpperWindows), solidBox("低厨房在后土岸以内实际封闭的完整承重后墙", 0, 1.4, 9, 8, 2.4, .28, brick));
  wood.push(...lattice([0, .2, -5], basementWindows), ...lattice([0, 2.8, -5], frontWindows), ...lattice([0, 6.2, -5], upperWindows), ...lattice([0, 2.8, 9], [...rearWindows, [2.9, 1, .9, 1.6]]), ...lattice([0, 6.2, 9], rearUpperWindows));
  inside.push(periodWall("低层前备餐间与后厨房之间真实保留通行门的厚承墙", plaster, 6.1, 2.4, .18, [-.95, .2, 1.1], [[-.7, 1, 2.05]]), periodWall("厨房通向独立后服务梯底厅的实际侧门隔墙", plaster, 14, 2.4, .16, [2.1, .2, 2], [[.5, .95, 2.05]], [], 90), periodWall("主层门厅与前客厅之间真实打开内门的完整纵壁", plaster, 4.2, 3.4, .16, [1.4, 2.8, -2.9], [[.3, 1.05, 2.4]], [], 90), periodWall("前客厅后边实际接入西侧绕行厅的完整内隔墙", plaster, 5.4, 3.4, .16, [-1.3, 2.8, -.8], [[-1.25, 1, 2.4]]), solidBox("折返主梯西侧从主层实际承到卧层的完整井壁", -1.4, 4.5, 2.2, .16, 3.4, 4, plaster), solidBox("主梯东侧与前入户廊实际分隔的完整低层井壁", 1.4, 4.5, 1.65, .16, 3.4, 2.9, plaster), solidBox("中央主梯后方与餐厅分开的完整承重横壁", 0, 4.5, 4.2, 2.8, 3.4, .16, plaster), periodWall("主餐厅由西侧同层绕行厅进入的实际独立门墙", plaster, 2.6, 3.4, .16, [-2.7, 2.8, 4.2], [[0, 1, 2.4]]), solidBox("后服务梯主层低端前缘实际阻挡误入梯洞的完整井壁", 3.05, 4.5, 3, 1.9, 3.4, .16, plaster), periodWall("服务直梯末端从完整落脚台真实进入主餐厅的后内门", plaster, 6, 3.4, .16, [2.1, 2.8, 6], [[2.48, .75, 2.25]], [], 90), periodWall("上层前卧室与中央梯厅之间独立的真实内门墙", plaster, 8, 3.2, .14, [0, 6.2, -.8], [[2.3, .95, 2.3]]), periodWall("上层后卧室与中央梯厅之间独立的真实内门墙", plaster, 8, 3.2, .14, [0, 6.2, 4.2], [[2.3, .95, 2.3]]));
  for (let i = 0; i < 15; i++) {
    const top = 2.8 - (i + 1) * 2.6 / 15;
    if (i < 14) steps.push(solidBox("街边下行到前井服务门的完整实体石踏级", -2.8, (.2 + top) / 2, -9.5 + (i + .5) * .28, 1.05, top - .2, .28, stone));
    wood.push(solidBox("厨房层后服务直梯独立穿过主层长洞的厚木踏板", 3, .2 + (i + 1) * 2.6 / 15 - .05, 3.1 + (i + .5) * .34, 1.2, .1, .34, timber));
  }
  wood.push(solidBox("后服务直梯最高踏面实际跨接主餐厅内门的完整落脚板", 3, 2.72, 8.5, 1.4, .16, .8, timber), solidBox("主入户跨井桥真实接到街坪与主层门槛的连续厚桥板", 2.4, 2.7, -7.25, 1.5, .2, 4.5, timber));
  for (const x of [2.43, 3.57]) wood.push(meshBeam("后服务直梯全部独立踏板下连续承托的斜木梯梁", [x, .2, 3.1], [x, 2.71, 8.2], .13, timber));
  for (const x of [1.73, 3.07]) wood.push(meshBeam("跨井入户桥在整段井口上实际承重的纵向木大梁", [x, 2.55, -9.65], [x, 2.55, -4.88], .3, timber));
  for (let i = 0; i < 10; i++) {
    wood.push(solidBox("主厅折返梯第一跑实际逐级接到中间平台的厚木踏板", -.66, 2.8 + (i + 1) * .17 - .06, .45 + i * .28, 1.1, .12, .28, timber), solidBox("主厅折返梯第二跑反向实际接到卧层厅的厚木踏板", .66, 4.5 + (i + 1) * .17 - .06, 2.97 - i * .28, 1.1, .12, .28, timber));
  }
  wood.push(solidBox("折返主梯两跑之间真正连续承接的完整半层平台", 0, 4.41, 3.47, 2.5, .18, .72, timber), solidBox("折返主梯从真洞前端实际接入上层厅的完整短平台", 0, 6.11, .2, 2.5, .18, .4, timber));
  wood.push(meshBeam("折返主梯半层平台下真正插入两侧承墙的横承木", [-1.4, 4.32, 3.5], [1.4, 4.32, 3.5], .18, timber));
  for (const x of [-1.15, -.17]) wood.push(meshBeam("主梯第一跑各厚踏板下真实连续的斜木承梁", [x, 2.84, .31], [x, 4.41, 3.11], .13, timber));
  for (const x of [.17, 1.15]) wood.push(meshBeam("主梯第二跑反向托住全部厚踏板的真实斜木承梁", [x, 4.54, 3.11], [x, 6.11, .31], .13, timber));
  for (const [x, y, z, endY, endZ] of [[-.12, 3.82, .45, 5.35, 2.97], [.12, 5.52, 2.97, 7.05, .45], [3.57, 1.223333333, 3.27, 3.65, 8.03], [-3.3, 3.476666667, -9.36, 1.05, -5.44]] as [number, number, number, number, number][]) {
    metal.push(meshBeam("主梯服务梯与下井阶实际连续连接上下栏柱的斜铁扶手", [x, y, z], [x, endY, endZ], .045, iron));
    for (const [height, depth] of [[y, z], [endY, endZ]]) metal.push(meshBeam("每根斜扶手两端真实落到相应踏面上的独立栏柱", [x, height! - .85, depth!], [x, height!, depth!], .045, iron));
  }
  const railing = (start: Triple, end: Triple, floor: number): void => {
    metal.push(meshBeam("前井桥和高层梯洞边缘实际连续的水平铁横栏", start, end, .045, iron));
    const count = Math.ceil(Math.hypot(end[0] - start[0], end[2] - start[2]) / .65);
    for (let i = 0; i <= count; i++) { const t = i / count, x = start[0] + (end[0] - start[0]) * t, z = start[2] + (end[2] - start[2]) * t; metal.push(meshBeam("沿井口桥边与梯厅真洞边缘独立落地的细铁栏柱", [x, floor, z], [x, start[1], z], .035, iron)); }
  };
  for (const x of [1.69, 3.11]) railing([x, 3.75, -9.5], [x, 3.75, -5.05], 2.8);
  railing([-4.4, 3.75, -9.5], [-3.36, 3.75, -9.5], 2.8); railing([-2.24, 3.75, -9.5], [1.69, 3.75, -9.5], 2.8); railing([3.11, 3.75, -9.5], [4.4, 3.75, -9.5], 2.8);
  for (const x of [-4.4, 4.4]) railing([x, 3.75, -9.5], [x, 3.75, -5.05], 2.8);
  for (const x of [-1.32, 1.32]) railing([x, 7.15, .35], [x, 7.15, 3.92], 6.2);
  railing([-1.32, 7.15, 3.92], [1.32, 7.15, 3.92], 6.2); railing([-1.2, 5.35, 3.8], [1.2, 5.35, 3.8], 4.5);
  for (const side of [-1, 1]) {
    walls.push(solidBox("厨房壁炉敞口两旁真正落在低石坪上的实砖腿", -3.2 + side * .44, .85, 8.5, .12, 1.3, .8, brick), solidBox("穿过两层真楼板洞的空心烟道两侧完整实砖壁", -3.2 + side * .34, 6.55, 8.5, .12, 10.1, .8, brick), solidBox("空心烟道前后真实闭合且不填实中央烟孔的长砖壁", -3.2, 6.55, 8.5 + side * .34, .56, 10.1, .12, brick));
  }
  walls.push(solidBox("敞口砖壁炉后侧与厨房后墙相接的完整低背壁", -3.2, .85, 8.85, 1, 1.3, .1, brick), hardFloor("壁炉敞口上方真实留烟孔并承接长烟道的完整砖石环", brick, [[-.5, -.4], [.5, -.4], [.5, .4], [-.5, .4]], .1, [-3.2, 1.4, 8.5], [[[-.28, -.28], [.28, -.28], [.28, .28], [-.28, .28]]]), hardFloor("烟道顶端真正保留中央开孔的完整石压顶环", stone, [[-.48, -.48], [.48, -.48], [.48, .48], [-.48, .48]], .12, [-3.2, 11.6, 8.5], [[[-.28, -.28], [.28, -.28], [.28, .28], [-.28, .28]]]));
  const roofY = (x: number): number => 11.56 - Math.abs(x) * 2 / 4, roofAt = (x: number, z: number): Triple => [x, roofY(x), z];
  for (const [x1, x2, z1, z2] of [[-4.35, 0, -5.3, 8.1], [-4.35, 0, 8.9, 9.3], [-4.35, -3.6, 8.1, 8.9], [-2.8, 0, 8.1, 8.9], [0, 4.35, -5.3, 9.3]]) roofs.push(slopePanel("完整窄宅双坡厚瓦屋面在烟道周边真实裁开并逐片闭合", [roofAt(x1!, z1!), roofAt(x2!, z1!), roofAt(x2!, z2!), roofAt(x1!, z2!)], .16, tile));
  for (const z of [-5, 9]) { const gable = endGable(0, 0, 8, 9.4, 2, brick); gable.position.z = z; p.push(gable); }
  for (const z of [-4.8, 2, 8.6]) {
    wood.push(meshBeam("两面共墙之间真正承住窄宅高屋盖的整根木横系梁", [-4, 9.3, z], [4, 9.3, z], .2, timber), meshBeam("完整木屋架中央由横系梁实际接到屋脊的短柱", [0, 9.4, z], [0, 11.4, z], .14, timber), meshBeam("完整屋架左斜木椽实际连住共墙和高脊木", [-4, 9.4, z], [0, 11.4, z], .14, timber), meshBeam("完整屋架右斜木椽实际连住共墙和高脊木", [4, 9.4, z], [0, 11.4, z], .14, timber));
  }
  wood.push(meshBeam("完整双坡宅屋盖之下真实连续的长屋脊木", [0, 11.4, -5.1], [0, 11.4, 9.1], .18, timber));
  wood.push(solidBox("低层前备餐间避开实门路线的完整长工作台", -.2, .65, -3.8, 2.4, .9, .8, timber), solidBox("后厨房沿承墙安放的完整低储物台柜", 1.55, .65, 5.4, .7, .9, 3.2, timber), solidBox("主餐厅避开服务入门和西侧厅门的完整落地木餐桌", -.2, 3.25, 6.3, 2.2, .9, 1.2, timber), solidBox("前客厅靠共墙安放的完整低木坐榻", -3.1, 3.05, -2.3, 1.1, .5, 2.2, timber));
  for (const z of [-2.4, 6.5]) wood.push(solidBox("上下真门之后卧室内落在完整楼板上的独立木卧台", -.6, 6.45, z, 1.8, .5, 2.2, timber), solidBox("卧室后墙前避开穿板烟道的完整落地木柜", 2.75, 7.15, z, .65, 1.9, 1.6, timber));
  p.push(...packMeshes("完整砖宅的厚共墙实际门窗与穿板空烟道", brick, walls), ...packMeshes("前井两侧及厨房层外围完整闭合的实石挡土岸", stone, ground), ...packMeshes("双层分流动线与前后居室之间真正可通行的全部隔壁", plaster, inside), ...packMeshes("主服务两梯厚踏板桥梁窗格家具及真实承屋木架", timber, wood), ...packMeshes("前井独立下行石阶全部保留的实体踏级", stone, steps), ...packMeshes("跨井桥采光井与所有内梯真实落地的细铁扶栏", iron, metal), ...packMeshes("在真实烟道孔四周分别闭合的完整厚瓦双坡屋盖", tile, roofs));
  return p;
}
