import type { ModelPart, Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { boxBatch, hardPlan, profileBody } from "./everydayOutdoorSpaceBatchOne";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchSteps";
import { box, design, type ArchitecturePrototype } from "./structures";
import { meshBeam } from "./vernacularWorldBatchFive";

const paving = "#c5beac", stone = "#b1b8aa", steel = "#688180", timber = "#a88f6b", warning = "#d1bd82";

export const everydayTransitBuildingSpaceBatchEightDesigns: ArchitecturePrototype[] = [
  design("上候下到跨线铁路客站", "轨上完整出发候车厅通过两组开井长阶向中层侧站台分流，另一端两组独立阶井把到达旅客导入轨下横通廊；站房外长阶独立接入高位公共门，横通廊两侧门接回地面，三层实际楼面孔洞与绕孔梁架保持上下分流", splitLevelRailPassengerStation, "建筑", "现代"),
];

function splitLevelRailPassengerStation(): ModelPart[] {
  const departureHoles: [number, number][][] = [-1, 1].map((s): [number, number][] => [[s * 10 - 1.3, -13.8], [s * 10 + 1.3, -13.8], [s * 10 + 1.3, -5.4], [s * 10 - 1.3, -5.4]]);
  const arrivalHoles: [number, number][][] = [-1, 1].map((s): [number, number][] => [[s * 10 - 1.3, 7.7], [s * 10 + 1.3, 7.7], [s * 10 + 1.3, 16.1], [s * 10 - 1.3, 16.1]]);
  const parts: ModelPart[] = [
    box("跨线客站全部三层结构和公共入站长阶共用的完整落地基础", 0, .09, 0, 52, .18, 86, paving),
    box("轨下到达横通廊从双街口连续连接到独立下行阶的完整楼面", 0, .24, 15, 32, .12, 18, paving),
    hardPlan("到达横通廊屋面真正留空两座由站台下降的连续阶井", stone, [[-16, 6], [16, 6], [16, 24], [-16, 24]], .25, [0, 2.7, 0], arrivalHoles),
    hardPlan("轨上出发候车大厅真正保留两座上站台梯井的完整楼板", paving, [[-16, -22], [16, -22], [16, -2], [-16, -2]], .3, [0, 8.7, 0], departureHoles),
    box("完整轨上候车厅由外侧整高柱和屋梁接承的厚平屋盖", 0, 14.05, -12, 33, .3, 21, steel),
    box("站房外长阶高端直接接到公共门的完整高位侧前庭", -19, 8.85, -17.6, 6, .3, 7.2, paving),
    box("入站长阶低端直接连接公共基础的完整短前坪", -20, .24, -40.3, 6, .12, 4, paving),
    ...glazedWall("轨上出发厅前侧真正封合到高屋盖的完整宽窗墙", [-16, -22], [16, -22], 9, 13.9, [[-9, 10, 10, 2.6], [9, 10, 10, 2.6]]),
    ...glazedWall("轨上出发厅后侧面对站台的完整通透窗墙", [-16, -2], [16, -2], 9, 13.9, [[-9, 10, 10, 2.6], [9, 10, 10, 2.6]]),
    ...glazedWall("独立外长阶经高前庭真正进入出发厅的西公共门", [-16, -22], [-16, -2], 9, 13.9, [[1.5, 10, 10, 2.6]], [[-6, 9, 2.6, 3]]),
    ...glazedWall("出发厅东侧真正接到高屋盖的完整宽窗外墙", [16, -22], [16, -2], 9, 13.9, [[-5, 10, 6.5, 2.6], [5, 10, 6.5, 2.6]]),
    ...glazedWall("轨下到达横厅前端完整封合且保留大面采光窗", [-16, 6], [16, 6], .3, 2.7, [[-9, .85, 10, 1.4], [9, .85, 10, 1.4]]),
    ...glazedWall("轨下到达横厅后端完整封合且保留大面采光窗", [-16, 24], [16, 24], .3, 2.7, [[-9, .85, 10, 1.4], [9, .85, 10, 1.4]]),
  ];
  const sleepers: Triple[] = [], innerColumns: Triple[] = [], outerColumns: Triple[] = [], topColumns: Triple[] = [], platformBeams: Triple[] = [], trackBeams: Triple[] = [], upperLongBeams: Triple[] = [], upperRoofBeams: Triple[] = [], canopyPosts: Triple[] = [], canopyBeams: Triple[] = [], seats: Triple[] = [], seatFeet: Triple[] = [], porchColumns: Triple[] = [], porchBeams: Triple[] = [];
  const frameMembers: SolidBox[] = [], railGuards: ModelPart[] = [], exteriorGuards: ModelPart[] = [], wellGuards: SolidBox[] = [];
  for (const side of [-1, 1]) {
    const platform: [number, number][] = [[side < 0 ? -12 : 3.8, -40], [side < 0 ? -3.8 : 12, -40], [side < 0 ? -3.8 : 12, 40], [side < 0 ? -12 : 3.8, 40]];
    parts.push(hardPlan("中层高架侧站台保持独立到达阶井并贯通前后候车段", paving, platform, .3, [0, 4.5, 0], [arrivalHoles[side < 0 ? 0 : 1]!]), box("站厅之间真正贯通且由横梁直接承托的独立轨道承床", side * 2.25, 3.3, 0, 3.9, .4, 82, stone), box("站台临轨边缘从前到后连续设置的安全警示带", side * 4, 4.815, 0, .16, .03, 78, warning), ...glazedWall("轨下到达横厅从阶井外侧真实穿出的独立街口门", [side * 16, 6], [side * 16, 24], .3, 2.7, [[-5, .85, 5, 1.4]], [[3, .3, 2.6, 2.1]]), box("到达街口之外与室内同高的完整短平台", side * 17, .24, 18, 2, .12, 4), profileBody("到达街口平台外缘实际接回地面基础的低短缓坡", paving, [[0, 0], [2, 0], [2, .18], [0, .3]], 2.6, [side * 18, 0, 18], side > 0 ? 0 : 180));
    for (const edge of [-1, 1]) parts.push(profileBody("连续通过三层站房下方且保持标准轨距的完整工字钢轨", steel, [[-.07, 0], [.07, 0], [.07, .04], [.02, .04], [.02, .16], [.035, .16], [.035, .2], [-.035, .2], [-.035, .16], [-.02, .16], [-.02, .04], [-.07, .04]], 82, [side * 2.25 + edge * .7525, 3.6, 0]));
    for (let i = 0; i < 116; i++) sleepers.push([side * 2.25, 3.55, -40.25 + i * .7]);
    for (const z of [-36, -24, -4, 20, 36]) { innerColumns.push([side * 6.5, 2.19, z]); outerColumns.push([side * 11.6, 2.19, z]); }
    for (const z of [-20, -10, -3]) topColumns.push([side * 15.4, 6.89, z]);
    platformBeams.push([side * 6.5, 4.35, 0], [side * 11.6, 4.35, 0]);
    upperLongBeams.push([side * 15.4, 8.45, -12], [side * 8, 8.45, -12]);
    for (const [a, b] of [[-40, -23], [0, 40]]) parts.push(box("出发厅之外实际避开高站房的独立连续侧站棚", side * 7.9, 7.95, (a! + b!) / 2, 8.2, .3, b! - a!, steel));
    for (const z of [-37, -25, 2, 20, 38]) { canopyPosts.push([side * 11.6, 6.2, z]); canopyBeams.push([side * 7.9, 7.7, z]); }
    for (const [kind, low, start, rise] of [["出发", 4.8, -13.5, .175], ["到达", .3, 8, .1875]] as const) {
      for (let flight = 0; flight < 2; flight++) {
        const y = low + flight * rise * 12, z = start + flight * 4.5;
        parts.push(stairFlight(`${kind}客流与另一方向分开的连续十二级实阶`, side * 10, y, z, 2.2, 12, rise, .3));
        if (!flight) parts.push(box(`${kind}长阶中段与两段踏面准确齐平的完整休息平台`, side * 10, y + rise * 12 - .1, z + 4.05, 2.2, .2, .9, paving));
        for (const edge of [-1, 1]) {
          const x = side * 10 + edge * 1.1;
          railGuards.push(meshBeam(`${kind}长阶两侧随真实踏面升高的完整扶手`, [x, y + rise + 1, z + .15], [x, y + rise * 12 + 1, z + 3.45], .055, steel));
          for (const [run, height] of [[.15, rise], [3.45, rise * 12]]) railGuards.push(meshBeam(`${kind}扶手真正下接各处独立踏面的短立杆`, [x, y + height!, z + run!], [x, y + height! + 1, z + run!], .055, steel));
          if (!flight) railGuards.push(meshBeam(`${kind}相邻梯段扶手跨实际休息平台的完整接段`, [x, y + rise * 12 + 1, z + 3.45], [x, y + rise * 13 + 1, z + 4.65], .055, steel));
        }
      }
      const top = kind === "出发" ? 9 : 4.8;
      for (const edge of [-1, 1]) {
        const x = side * 10 + edge * 1.3;
        wellGuards.push({ center: [x, top + 1, start + 3.9], size: [.06, .06, 8.4] });
        for (const z of [start - .3, start + 3.9, start + 8.1]) wellGuards.push({ center: [x, top + .5, z], size: [.06, 1, .06] });
      }
      wellGuards.push({ center: [side * 10, top + 1, start - .3], size: [2.6, .06, .06] });
    }
    for (const z of [-30, 29]) { seats.push([side * 7.8, 5.21, z]); for (const dz of [-1.3, 1.3]) seatFeet.push([side * 7.8, 4.975, z + dz]); }
    wellGuards.push({ center: [side * 12, 5.85, 0], size: [.06, .06, 80] });
    for (const z of [-40, -30, -20, -10, 0, 10, 20, 30, 40]) wellGuards.push({ center: [side * 12, 5.325, z], size: [.06, 1.05, .06] });
    for (const z of [-40, 40]) wellGuards.push({ center: [side * 7.9, 5.85, z], size: [8.2, .06, .06] });
  }
  for (const z of [-36, -24, -4, 20, 36]) trackBeams.push([0, 2.9, z]);
  for (const z of [-20, -10, -3]) upperRoofBeams.push([0, 13.75, z]);
  for (const z of [-20, -3]) frameMembers.push({ center: [0, 8.45, z], size: [31.5, .5, .45] });
  for (const [a, b] of [[-16, -11.3], [-8.7, 8.7], [11.3, 16]]) frameMembers.push({ center: [(a! + b!) / 2, 8.45, -10], size: [b! - a!, .5, .45] });
  for (const z of [-20, -15]) { porchBeams.push([-19, 8.55, z]); for (const x of [-21.6, -16.4]) porchColumns.push([x, 4.29, z]); }
  wellGuards.push({ center: [-22, 10.05, -17.6], size: [.06, .06, 7.2] }, { center: [-19, 10.05, -14], size: [6, .06, .06] }, { center: [-21.75, 10.05, -21.2], size: [.5, .06, .06] }, { center: [-17.25, 10.05, -21.2], size: [2.5, .06, .06] });
  for (const [x, z] of [[-22, -21.2], [-22, -17.6], [-22, -14], [-16, -14], [-21.5, -21.2], [-18.5, -21.2]]) wellGuards.push({ center: [x!, 9.525, z!], size: [.06, 1.05, .06] });
  for (let flight = 0; flight < 4; flight++) {
    const y = .3 + flight * 2.175, z = -38.3 + flight * 4.5;
    parts.push(stairFlight("站房外从地面直接接入高出发厅的独立十二级实阶", -20, y, z, 3, 12, .18125, .3), box("高位入站长阶下面真实从基础填实到梯底的独立承台", -20, (.18 + y) / 2, z + 1.8, 3.2, y - .18, 3.6, stone));
    if (flight < 3) parts.push(box("高位入站长阶之间与前后踏面准确接平的实心休息台", -20, (.18 + y + 2.175) / 2, z + 4.05, 3.2, y + 2.175 - .18, .9, paving));
    for (const side of [-1, 1]) {
      const x = -20 + side * 1.5;
      exteriorGuards.push(meshBeam("外部公共长阶沿实际踏面准确升高的独立扶手", [x, y + .18125 + 1.05, z + .15], [x, y + 3.225, z + 3.45], .06, steel));
      for (const [run, height] of [[.15, .18125], [3.45, 2.175]]) exteriorGuards.push(meshBeam("外长阶扶手两端实际接到独立踏面的短立杆", [x, y + height!, z + run!], [x, y + height! + 1.05, z + run!], .06, steel));
      if (flight < 3) exteriorGuards.push(meshBeam("相邻外长阶的独立扶手经休息平台完整相接", [x, y + 3.225, z + 3.45], [x, y + 2.175 + .18125 + 1.05, z + 4.65], .06, steel));
    }
  }
  parts.push(
    boxesMesh("高出发厅楼板下面真正绕开两座长阶井的完整横梁", steel, frameMembers),
    ...boxBatch("连续高架双轨上实际独立承接工字钢轨的横枕", timber, sleepers, [2.5, .1, .2]),
    ...boxBatch("高架侧站台内缘完整接地的独立承重立柱", stone, innerColumns, [.4, 4.02, .6]),
    ...boxBatch("侧站台外缘完整接地并直接接住长梁的独立承柱", stone, outerColumns, [.35, 4.02, .45]),
    ...boxBatch("轨上候车大厅真正从基础升到高屋梁的整高边柱", steel, topColumns, [.4, 13.42, .45]),
    ...boxBatch("高架侧台下面避开到达井并由整列柱接承的长梁", steel, platformBeams, [.35, .3, 80]),
    ...boxBatch("独立双轨承床下面实际接到立柱的完整横向深梁", steel, trackBeams, [23.5, .4, .6]),
    ...boxBatch("高出发厅长边与梯井内侧真正接住横梁的连续纵梁", steel, upperLongBeams, [.4, .5, 20]),
    ...boxBatch("高出发厅整高边柱之间实际顶接厚屋盖的完整横梁", steel, upperRoofBeams, [31.5, .3, .4]),
    ...boxBatch("独立侧站棚在外缘实际落到站台的完整细柱", steel, canopyPosts, [.2, 2.8, .25]),
    ...boxBatch("侧站棚外柱向内真正接承雨盖的完整横向挑梁", steel, canopyBeams, [8.2, .2, .25]),
    ...boxBatch("中层候车区避开上行与下行井的固定长坐板", timber, seats, [.7, .12, 3.4]),
    ...boxBatch("全部固定长坐板真正从站台面接承的独立短脚", steel, seatFeet, [.45, .35, .12]),
    ...boxBatch("高出发厅外侧公共前庭下真正接地的独立整高柱", steel, porchColumns, [.3, 8.22, .4]),
    ...boxBatch("公共高前庭由四根落地柱实际接承的完整厚横梁", steel, porchBeams, [6, .3, .4]),
  );
  for (let offset = 0; offset < railGuards.length; offset += 16) parts.push(combineMeshes("两组分流客梯扶手与逐级立杆的完整安全栏架", steel, railGuards.slice(offset, offset + 16)));
  for (let offset = 0; offset < exteriorGuards.length; offset += 16) parts.push(combineMeshes("外部长阶扶手及踏面立杆保持真实接承的安全栏架", steel, exteriorGuards.slice(offset, offset + 16)));
  for (let offset = 0; offset < wellGuards.length; offset += 20) parts.push(boxesMesh("上下分流梯井开口边缘真正落到各层面的完整护栏", steel, wellGuards.slice(offset, offset + 20)));
  return parts;
}
