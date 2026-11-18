import type { ModelPart, Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { boxBatch, hardPlan, profileBody } from "./everydayOutdoorSpaceBatchOne";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchSteps";
import { box, design, type ArchitecturePrototype } from "./structures";
import { meshBeam } from "./vernacularWorldBatchFive";

const concrete = "#b7b9ac", paving = "#c4bdab", steel = "#607778", dark = "#485d61", wood = "#a58c68", warning = "#cfbd81";

export const everydayTransitBuildingSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("贯街票厅双侧台高架城市客站", "地面横向公共通廊从两侧街区进入票厅，票区后两组连续三段长阶穿过真实楼板梯井接上高架侧站台；两条标准轨道从完整承床上贯通，站厅、站台、外侧屋盖由不同标高的梁柱直接承接", elevatedUrbanStation, "建筑", "现代"),
];

function elevatedUrbanStation(): ModelPart[] {
  const outline: [number, number][] = [[-12, -14], [12, -14], [12, 16], [-12, 16]], holes: [number, number][][] = [-1, 1].map((side): [number, number][] => [[side * 9.3 - 1.2, -1.8], [side * 9.3 + 1.2, -1.8], [side * 9.3 + 1.2, 11.1], [side * 9.3 - 1.2, 11.1]]);
  const parts: ModelPart[] = [
    box("高架站房与街区侧口共用的完整落地基础", 0, .09, 0, 40, .18, 74, concrete),
    box("下层站厅和公共横通廊连续同高的完整楼面", 0, .24, 1, 24, .12, 30, paving),
    hardPlan("下层站厅顶板真正留出两座连续上行的梯井", concrete, outline, .25, [0, 5.85, 0], holes),
    box("全站轨道和站台上方直接由外柱承托的完整厚屋盖", 0, 11.3, 0, 25.2, .25, 71, steel),
    box("两条轨道承床之间封合下方票厅的窄顶带", 0, 6.45, 0, .6, .4, 70, concrete),
    ...glazedWall("前厅外墙真正开出街面正门与两侧采光窗", [-12, -14], [12, -14], .3, 5.85, [[-6.4, 1.25, 7, 2.5], [6.4, 1.25, 7, 2.5]], [[0, .3, 3.6, 3.1]]),
    ...glazedWall("票厅后墙真实封合并保留独立疏散出口", [-12, 16], [12, 16], .3, 5.85, [[-5.5, 1.65, 6, 2], [5.5, 1.65, 6, 2]], [[0, .3, 2.4, 2.7]]),
  ];
  const sleepers: Triple[] = [], guardPosts: Triple[] = [], stairPosts: Triple[] = [], stairBeams: Triple[] = [], middleSupports: Triple[] = [], highSupports: Triple[] = [], seats: Triple[] = [], backs: Triple[] = [], legs: Triple[] = [], innerColumns: Triple[] = [], roofColumns: Triple[] = [], platformBeams: Triple[] = [], trackCrossBeams: Triple[] = [], roofCrossBeams: Triple[] = [];
  const handrails: ModelPart[] = [], ticketBarriers: SolidBox[] = [];
  for (const side of [-1, 1]) {
    const platform: [number, number][] = [[side < 0 ? -12 : 3.75, -35], [side < 0 ? -3.75 : 12, -35], [side < 0 ? -3.75 : 12, 35], [side < 0 ? -12 : 3.75, 35]];
    parts.push(
      hardPlan("保留完整上阶孔并贯通前后候车区的高架侧站台", paving, platform, .3, [0, 7.5, 0], [holes[side < 0 ? 0 : 1]!]),
      ...glazedWall("两街区之间的公共横通廊从侧墙实际宽门穿过", [side * 12, -14], [side * 12, 16], .3, 5.85, [[0, 1.4, 6, 2.4], [9, 1.4, 6, 2.4]], [[-10, .3, 4.4, 3.1]]),
      box("公共侧门外与站厅入口同标高的完整接街平台", side * 15, .24, -9, 6, .12, 5),
      profileBody("侧门平台外缘缓降到公共基础标高的真实坡口", paving, [[0, 0], [2, 0], [2, .18], [0, .3]], 4.4, [side * 18, 0, -9], side > 0 ? 0 : 180),
      box("高架双轨各自独立且贯通前后的承重道床", side * 2.25, 6.45, 0, 3.9, .4, 70, concrete),
      box("长侧站台临轨边缘连续安全警示带", side * 3.91, 7.815, 0, .2, .03, 68, warning),
      box("高架站台外沿连续防护的上水平栏杆", side * 12, 8.85, 0, .065, .065, 70, steel),
    );
    platformBeams.push([side * 11.4, 7.35, 0], [side * 6.5, 7.35, 0]);
    for (let flight = 0; flight < 3; flight++) {
      const z = -1.5 + flight * 4.5, y = .3 + flight * 2.5;
      parts.push(stairFlight("连接地面票厅与高架侧台的连续十二级实阶", side * 9.3, y, z, 2, 12, 2.5 / 12, .3));
      if (flight < 2) parts.push(box("两段长阶之间与踏面准确同高的完整休息平台", side * 9.3, y + 2.4, z + 4.05, 2, .2, .9, paving));
      stairBeams.push([side * 9.3, y - .1, z + 1.8]);
      if (flight) for (const offset of [.3, 3.3]) (flight === 1 ? middleSupports : highSupports).push([side * 9.3, flight === 1 ? 1.45 : 2.7, z + offset]);
      for (const edge of [-1, 1]) {
        const x = side * 9.3 + edge;
        handrails.push(meshBeam("随逐级踏面升高且由两端独立立杆承住的楼梯扶手", [x, y + 2.5 / 12 + .95, z + .15], [x, y + 3.45, z + 3.45], .05, steel));
        stairPosts.push([x, y + 2.5 / 12 + .475, z + .15], [x, y + 2.975, z + 3.45]);
        if (flight < 2) handrails.push(meshBeam("相邻梯段扶手在实际休息平台上的连续接段", [x, y + 3.45, z + 3.45], [x, y + 2.5 + 2.5 / 12 + .95, z + 4.65], .05, steel));
      }
    }
    for (const railSide of [-1, 1]) parts.push(profileBody("轮缘内侧保持标准轨距的完整工字钢轨", steel, [[-.07, 0], [.07, 0], [.07, .04], [.02, .04], [.02, .16], [.035, .16], [.035, .2], [-.035, .2], [-.035, .16], [-.02, .16], [-.02, .04], [-.07, .04]], 70, [side * 2.25 + railSide * .7525, 6.75, 0]));
    for (let i = 0; i < 100; i++) sleepers.push([side * 2.25, 6.7, -34.65 + i * .7]);
    for (const z of [-30, -20, -10, 0, 10, 20, 30]) guardPosts.push([side * 12, 8.325, z]);
    for (const z of [-26, 0, 26]) {
      innerColumns.push([side * 6.5, 3.69, z]); roofColumns.push([side * 11.4, 5.6775, z]);
    }
    for (const edge of [-1, 1]) {
      parts.push(box("真实梯井两侧平台面以上的连续防坠扶栏", side * 9.3 + edge * 1.2, 8.85, 4.7, .06, .06, 13, steel));
      for (const z of [-1.8, 2.5, 6.8, 11.1]) guardPosts.push([side * 9.3 + edge * 1.2, 8.325, z]);
    }
    parts.push(box("梯井低端临空边缘封闭且不堵下层起步的短护栏", side * 9.3, 8.85, -1.8, 2.4, .06, .06, steel));
    for (const z of [-35, 35]) parts.push(box("侧站台两端真正闭合的临空短扶栏", side * 7.875, 8.85, z, 8.25, .06, .06, steel));
    for (const z of [-24, 24]) {
      seats.push([side * 8.1, 8.21, z]); backs.push([side * 8.43, 8.56, z]);
      for (const offset of [-1.25, 1.25]) legs.push([side * 8.1, 7.975, z + offset]);
    }
  }
  for (const z of [-26, 0, 26]) { trackCrossBeams.push([0, 6, z]); roofCrossBeams.push([0, 11.075, z]); }
  for (const [a, b] of [[-12, -5.6], [-4.4, -.6], [.6, 4.4], [5.6, 12]]) ticketBarriers.push({ center: [(a! + b!) / 2, .85, -4], size: [b! - a!, 1.1, .14] });
  parts.push(box("避开横贯公共通路的售票服务长柜", 0, .9, -12, 7, 1.2, .75, wood), boxesMesh("公共横通廊之后保留三处真实检票通口的票区边界", dark, ticketBarriers), combineMeshes("两组上行长阶和休息平台直接相接的完整扶手", steel, handrails), ...boxBatch("两条高架承床上实际逐根承住工字钢轨的独立横枕", dark, sleepers, [2.5, .1, .2]), ...boxBatch("站台外边和梯井边真正下接地台的独立护栏立杆", steel, guardPosts, [.06, 1.05, .06]), ...boxBatch("楼梯扶手两端真正接到逐级踏面的独立立杆", steel, stairPosts, [.05, .95, .05]), ...boxBatch("六段实阶下面不穿出踏面的完整承重平梁", steel, stairBeams, [1.5, .2, 3.6]), ...boxBatch("中段梯梁下面真正落地的独立承柱", concrete, middleSupports, [.25, 2.3, .3]), ...boxBatch("高段梯梁下面真正落地的独立承柱", concrete, highSupports, [.25, 4.8, .3]), ...boxBatch("站台内侧长梁真正落到基础的完整承重立柱", concrete, innerColumns, [.45, 7.02, .65]), ...boxBatch("外侧屋盖和高架站台共用的整高落地钢柱", steel, roofColumns, [.35, 10.995, .45]), ...boxBatch("高架侧站台下面避开梯井且接住地台的完整长梁", steel, platformBeams, [.35, .3, 70]), ...boxBatch("双轨承床下面由两侧整高柱直接承住的横向深梁", steel, trackCrossBeams, [23.2, .5, .65]), ...boxBatch("屋盖下方直接接两侧整高柱的完整横向屋梁", steel, roofCrossBeams, [24.8, .2, .35]), ...boxBatch("高架候车区避开长阶的完整固定长坐板", wood, seats, [.7, .12, 3.2]), ...boxBatch("与固定坐板接合的独立候车长靠背", wood, backs, [.08, .6, 3.2]), ...boxBatch("每条候车长凳真正落到站台的独立承脚", steel, legs, [.45, .35, .12]));
  return parts;
}
