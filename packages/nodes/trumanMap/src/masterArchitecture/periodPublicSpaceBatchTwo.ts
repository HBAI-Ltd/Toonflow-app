import type { ModelPart } from "../assetModelParts";
import { base, box, design, type ArchitecturePrototype } from "./structures";
import { polygon } from "../masterNature/shared";
import { turn, stairFlight } from "./historicSpaceBatchSeven";
import { tiledRoof, openingWall, holesAt, roomWing, postSet } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#aaa997", plaster = "#bfb59d", wood = "#896d50", tiles = "#66766b";

export const periodPublicSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("穿堂高楼联双院镖局", "临街门厅通入开敞练场，中部穿堂高楼的三路通门通向后住院，高楼前外阶接到分室回廊，两旁工作房和卸镖廊各自面向练场", escortAgency, "建筑", "中式"),
  design("戏楼对厅双层观演会馆", "抬高戏楼与后方正厅隔庭对望，两侧开敞双层观演廊由落地柱接承，院内登阶与后横廊连接上层，戏楼侧门各自接到真实侧阶", theatreGuildhall, "建筑", "中式"),
  design("挑空回廊说书茶楼", "封闭高屋盖围合通高说书茶堂，上层环形回廊围绕中央挑空，侧向楼梯穿过真实楼板洞口，后门通到独立服务小院和厨房", storytellingTeahouse, "建筑", "中式"),
];

function escortAgency(): ModelPart[] {
  const p: ModelPart[] = [base(46, 64), box("前练场、穿堂和后住院共用的石铺地面", 0, .3, 0, 44, .24, 62, stone), openingWall("镖局临街门厅实际贯通的大通门", 18, 3.8, holesAt([0], 4, 3.2), [0, .42, -27]), openingWall("门厅后壁正对练场的真实通门", 18, 3.8, holesAt([0], 4, 3.2), [0, .42, -21]), tiledRoof("临街门厅完整灰瓦屋盖", 18, 6, 4.22, [0, -24]), ...turn(roomWing(18, 3, 1), -90, [-15, 0, -10]), ...turn(roomWing(24, 4, 1), 0, [0, 0, 26])];
  for (const s of [-1, 1]) {
    p.push(box("临街门厅两端完整封合的侧墙", s * 9, 2.32, -24, .3, 3.8, 6, plaster), box("门厅两侧与外围墙真正接合的前院围壁", s * 14.5, 1.92, -27, 11, 3, .3, plaster), box("前后两院连续闭合的外围长墙", s * 20, 1.92, 1.5, .3, 3, 57, plaster));
  }
  p.push(box("后住院实际封合的后围壁", 0, 1.92, 30, 40, 3, .3, plaster));
  const unloading = box("卸镖廊向院内下降的连续单坡雨檐", 15, 3.3, -10, 3.4, .18, 18, tiles); unloading.rotation.z = Math.atan2(.6, 3.4) * 180 / Math.PI;
  p.push(unloading, postSet("卸镖廊真正从石地接到低檐的木柱", [[13.3, -19], [13.3, -13], [13.3, -7], [13.3, -1]], 2.494), postSet("卸镖廊外侧真正接到高檐的木柱", [[16.7, -19], [16.7, -13], [16.7, -7], [16.7, -1]], 3.094));
  for (const z of [4, 11]) p.push(openingWall("穿堂底层三路实际对通的门墙", 30, 3.2, holesAt([-10, 0, 10], 4, 2.9), [0, .42, z]));
  for (const x of [-4, 4]) p.push(box("穿堂中央通道两侧承托高楼的实心隔壁", x, 2.02, 7.5, .3, 3.2, 7, plaster));
  p.push(box("穿堂高楼完整承重木楼板", 0, 3.745, 7.5, 30, .25, 7, wood), box("高楼正面外廊与上层房门等高的木楼面", 0, 3.745, 3, 30, .25, 2, wood), openingWall("高楼四间内房面向上层外廊的真门", 30, 3.4, holesAt([-11.25, -3.75, 3.75, 11.25], 1.2, 2.5), [0, 3.87, 4]), openingWall("高楼四间房后方真实透空的窗墙", 30, 3.4, holesAt([-11.25, -3.75, 3.75, 11.25], 1.6, 1.5, 1.1), [0, 3.87, 11]), ...turn([tiledRoof("穿堂高楼完整纵向长灰瓦屋盖", 7, 30, 7.27, [0, 0])], 90, [0, 0, 7.5]));
  for (const x of [-15, 15]) p.push(box("穿堂高楼从地面到顶完整接承的山墙", x, 3.845, 7.5, .3, 6.85, 7, plaster));
  for (const x of [-7.5, 0, 7.5]) p.push(box("高楼上层实际分隔住室的木石隔壁", x, 5.57, 7.5, .22, 3.4, 7, plaster));
  const eave = box("高楼外廊由内墙向外侧下降的雨檐", 0, 6.75, 3, 30.4, .18, Math.hypot(2, .6), tiles); eave.rotation.x = -Math.atan2(.6, 2) * 180 / Math.PI;
  p.push(eave, postSet("高楼外廊让开中部通门的整高承重柱列", [-15, -7.5, -2.2, 2.2, 7.5, 15].map(x => [x, 2]), 5.944), stairFlight("练场连续登到高楼上廊且下方保持通空的木阶", 20, 1.4, 3.45, .3, 0, [-6, .42, -4], -90, true));
  for (const [a, b] of [[-15, -6.85], [-5.15, 15]]) p.push(box("上层外廊实际让开登阶口的连续木扶手", (a! + b!) / 2, 4.87, 2, b! - a!, .08, .08, wood));
  return p;
}

function theatreGuildhall(): ModelPart[] {
  const p: ModelPart[] = [base(50, 62), box("戏楼、观演庭院和后厅共同的石铺地面", 0, .3, 0, 48, .24, 60, stone), box("戏楼高出观演庭院的完整舞台石台", 0, 1.02, -18, 20, 1.2, 10, stone), openingWall("后台通向两侧候场间的真实双门隔壁", 20, 6, holesAt([-5, 5], 1.4, 2.8), [0, 1.62, -20]), openingWall("戏楼背面实际透空的高位采光窗墙", 20, 6, holesAt([-6, 0, 6], 2, 1.8, 3), [0, 1.62, -23]), tiledRoof("完整遮护舞台与后台的高灰瓦屋盖", 20, 10, 7.62, [0, -18]), postSet("台口两侧实际承接前檐大梁的木柱", [-9, -6, 6, 9].map(x => [x, -13]), 5.76, 1.62), box("戏楼台口上方完整接承屋盖的长木梁", 0, 7.5, -13, 20, .24, .3, wood)];
  for (const s of [-1, 1]) p.push(openingWall("戏楼侧壁正对登台短阶的真实候场侧门", 10, 6, holesAt([0], 1.8, 2.8), [s * 10, 1.62, -18], 90), stairFlight("庭院侧路真正登上戏楼侧门的短石阶", 6, 1.6, 1.2, .4, 0, [s * 12.4, .42, -18], s < 0 ? 0 : 180));
  p.push(box("后厅完整抬高的石地台", 0, .66, 20, 24, .48, 10, stone), openingWall("面对戏楼的正厅三路真实敞门", 24, 4.2, holesAt([-8, 0, 8], 4, 3.3), [0, .9, 15]), openingWall("正厅背后真实透空的采光窗墙", 24, 4.2, holesAt([-8, 0, 8], 2, 1.7, 1.2), [0, .9, 25]), tiledRoof("正厅由外围厚壁接承的完整灰瓦屋盖", 24, 10, 5.1, [0, 20]), stairFlight("观演庭院真正接到正厅地面的中轴宽石阶", 3, 8, .48, .4, 0, [0, .42, 13.8], -90));
  for (const s of [-1, 1]) p.push(box("正厅两端实际封合的完整山墙", s * 12, 3, 20, .3, 4.2, 10, plaster));
  for (const s of [-1, 1]) {
    p.push(box("开敞观演长廊由整高柱列接承的木楼板", s * 17, 3.695, 1, 6, .25, 28, wood), openingWall("观演长廊外侧上下两层真实采光窗墙", 28, 6.8, [...holesAt([-11.2, -5.6, 0, 5.6, 11.2], 2.2, 1.6, 1.1), ...holesAt([-11.2, -5.6, 0, 5.6, 11.2], 2.2, 1.6, 4.5)], [s * 20, .42, 1], 90), tiledRoof("观演长廊完整纵向灰瓦屋盖", 6, 28, 7.22, [s * 17, 1]), postSet("观演廊两排从地面真正接到屋盖的整高木柱", [-13, -6, 1, 8, 15].flatMap(z => [[s * 14, z], [s * 20, z]] as [number, number][]), 6.8));
    for (const z of [-13, 15]) p.push(openingWall("观演长廊端部上下真门窗完整封合的山墙", 6, 6.8, [...holesAt([0], 1.6, 2.7), ...holesAt([0], 2.4, 1.6, 4.5)], [s * 17, .42, z]));
    const spans = s < 0 ? [[-13, 5.1], [6.9, 12], [14, 15]] : [[-13, 12], [14, 15]];
    for (const [a, b] of spans) p.push(box("观演上廊朝庭侧让开楼梯和后横廊入口的木护栏", s * 14, 4.32, (a! + b!) / 2, .1, 1, b! - a!, wood));
  }
  p.push(stairFlight("观演庭院通向左侧上层长廊的透空斜底木阶", 20, 1.4, 3.4, .35, 0, [-7, .42, 6], 180, true), box("连接两侧上廊的后方高位木横廊楼板", 0, 3.695, 13, 34, .25, 2, wood), postSet("后横廊两排真正落地并接到屋盖的承重木柱", [-15, -9, -3, 3, 9, 15].flatMap(x => [[x, 12.1], [x, 13.9]] as [number, number][]), 6), ...turn([tiledRoof("后横廊沿东西延伸的窄跨灰瓦整盖", 2, 34, 6.42, [0, 0])], 90, [0, 0, 13]));
  for (const z of [12, 14]) p.push(box("后横廊两侧完整木扶栏", 0, 4.32, z, 28, 1, .1, wood));
  return p;
}

function storytellingTeahouse(): ModelPart[] {
  const p: ModelPart[] = [base(34, 64), box("茶堂、后勤院与厨房共用的石铺地坪", 0, .3, 4, 32, .24, 54, stone), openingWall("茶楼临街大门及上下真实采光窗墙", 24, 6.8, [...holesAt([0], 4, 3), ...holesAt([-8, 8], 2, 1.5, 1.1), ...holesAt([-8, 0, 8], 2, 1.7, 4.2)], [0, .42, -16]), openingWall("茶堂后壁通向服务小院的真实后门和双层窗", 24, 6.8, [...holesAt([0], 2.4, 2.8), ...holesAt([-8, 8], 2, 1.5, 1.1), ...holesAt([-8, 0, 8], 2, 1.7, 4.2)], [0, .42, 10]), tiledRoof("完整封合通高说书茶堂的高灰瓦屋盖", 24, 26, 7.22, [0, -3]), polygon("围绕通高茶堂并真实让开左侧登阶的环形木楼板", wood, [[-12, -16], [12, -16], [12, 10], [-12, 10]], .25, [0, 3.57, 0], [[[-6, -11], [6, -11], [6, 5], [-6, 5]], [[-9.85, -10.1], [-8.15, -10.1], [-8.15, -4], [-9.85, -4]]]), postSet("通高茶堂内真正承托环廊和屋盖的双列木柱", [-11, -3, 5].flatMap(z => [[-6, z], [6, z]] as [number, number][]), 6.8), stairFlight("侧廊登阶从真实木楼板洞口升到上层回廊", 20, 1.4, 3.4, .3, 0, [-9, .42, -10], -90, true), box("室内说书台真实抬高的完整木台", 0, .72, 3.5, 6, .6, 3, wood), stairFlight("茶堂登上室内说书台的连续短木阶", 4, 2.5, .6, .3, 0, [0, .42, .8], -90), box("说书台上真实落地的小讲案", 0, 1.47, 3.8, 1.8, .9, .7, wood)];
  for (const s of [-1, 1]) p.push(openingWall("茶楼完整封合且上下两层真实透光的侧墙", 26, 6.8, [...holesAt([-9, -1, 7], 2, 1.6, 1.1), ...holesAt([-9, -1, 7], 2, 1.6, 4.5)], [s * 12, .42, -3], 90), box("上层挑空回廊两侧完整木护栏", s * 6, 4.32, -3, .1, 1, 16, wood), box("后勤小院两侧真正闭合的围墙", s * 10, 1.82, 16, .3, 2.8, 12, plaster), box("后厨两侧实际封合的厚壁", s * 7, 2.12, 25, .3, 3.4, 6, plaster));
  for (const z of [-11, 5]) p.push(box("上层回廊前后完整围护挑空边缘的木栏", 0, 4.32, z, 12, 1, .1, wood));
  for (const x of [-9.85, -8.15]) p.push(box("上层木楼板真实阶孔两侧的连续护栏", x, 4.32, -7.05, .08, 1, 6.1, wood));
  p.push(box("上层回廊靠登阶低端的楼板洞口木护栏", -9, 4.32, -10.1, 1.7, 1, .08, wood));
  for (const s of [-1, 1]) p.push(box("后厨侧壁与服务院围墙之间真正封合的短墙", s * 8.5, 1.82, 22, 3, 2.8, .3, plaster));
  p.push(openingWall("后院厨房面向服务院的真实双门", 14, 3.4, holesAt([-3.5, 3.5], 1.2, 2.5), [0, .42, 22]), openingWall("厨房后壁实际透光的双排气窗", 14, 3.4, holesAt([-3.5, 3.5], 2, 1.3, 1.6), [0, .42, 28]), tiledRoof("独立后院厨房的完整低灰瓦屋盖", 14, 6, 3.82, [0, 25]));
  const tables: SolidBox[] = [];
  for (const x of [-3.5, 3.5]) for (const z of [-8, -3]) {
    tables.push({ center: [x, 1.17, z], size: [1.7, .1, .9] });
    for (const dx of [-.72, .72]) for (const dz of [-.32, .32]) tables.push({ center: [x + dx, .77, z + dz], size: [.08, .7, .08] });
  }
  p.push(boxesMesh("茶堂内四张真实有桌面和落地桌腿的茶桌", wood, tables));
  return p;
}
