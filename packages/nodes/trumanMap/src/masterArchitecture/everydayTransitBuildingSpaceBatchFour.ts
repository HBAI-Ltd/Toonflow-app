import type { ModelPart, Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { boxBatch, profileBody } from "./everydayOutdoorSpaceBatchOne";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchSteps";
import { barrelRoof } from "./spatialShells";
import { box, design, type ArchitecturePrototype } from "./structures";
import { meshBeam } from "./vernacularWorldBatchFive";

const paving = "#c0b9a5", stone = "#b0b3a6", steel = "#637b7c", dark = "#465b5e", timber = "#a48a63", warning = "#d0bf88", roof = "#81958c";

export const everydayTransitBuildingSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("端厅连梳台尽端铁路总站", "前置完整售票大厅经五道真门接上不跨铁路的公共横廊，五根长站台由横廊直接梳状伸出，四条标准轨道在横廊之前各自实止挡；宽跨列车拱棚由独立拱肋边柱承托，前门实阶和独立低坡分别连到同一站厅地台", terminusRailwayStation, "建筑", "现代"),
];

function terminusRailwayStation(): ModelPart[] {
  const parts: ModelPart[] = [
    box("尽端客站前庭站房列车棚共同的完整落地基础", 0, .09, 0, 56, .18, 100, paving),
    box("前置售票大厅与各月台同高的完整实体地台", 0, .69, -26, 46, 1.02, 16, paving),
    box("前置售票站房由完整承墙围合的厚平屋盖", 0, 7.85, -26, 46.5, .3, 16.5, steel),
    box("轨道止挡之后真正横贯全部站台根部的完整公共横廊", 0, .69, -16, 44, 1.02, 4, paving),
    barrelRoof("从共用横廊覆盖到开放进轨端的完整厚列车拱棚", 22, .25, 58, [0, 6.3, 11], roof),
    ...glazedWall("前置票厅开出中央主门低坡侧门和两侧真窗的完整临街墙", [-23, -34], [23, -34], 1.2, 7.7, [[-9, 2.4, 8, 2.6], [10, 2.4, 8, 2.6]], [[0, 1.2, 5, 3.8], [-17, 1.2, 2.4, 3.2], [20, 1.2, 1.4, 3]]),
    ...glazedWall("售票大厅真正独立进入五根梳状站台的五道检票门", [-23, -18], [23, -18], 1.2, 7.7, [], [-19, -9.55, 0, 9.55, 19].map((x): [number, number, number, number] => [x, 1.2, 3.2, 3.6])),
    stairFlight("前广场真正上接票厅主门完整地台的六级宽阶", 0, .18, -36.1, 6, 6, .17, .35),
    profileBody("低坡侧门从前广场以一比十二实际升到票厅地台的连续实坡", paving, [[0, 0], [12.24, 0], [12.24, 1.2], [0, .18]], 2.4, [-17, 0, -46.24], -90),
  ];
  const trackCenters = [-14.3, -4.8, 4.8, 14.3], platformEdges: [number, number][] = [[-22, -15.85], [-12.75, -6.35], [-3.25, 3.25], [6.35, 12.75], [15.85, 22]];
  const sleepers: Triple[] = [], warningBands: Triple[] = [], roofPosts: Triple[] = [], headPosts: Triple[] = [], headBeams: Triple[] = [], bufferHeads: Triple[] = [], bufferPosts: Triple[] = [], seats: Triple[] = [], backs: Triple[] = [], feet: Triple[] = [], ticketCounters: Triple[] = [];
  const bufferBraces: ModelPart[] = [], entryGuards: ModelPart[] = [];
  for (const [left, right] of platformEdges) {
    const center = (left + right) / 2;
    parts.push(box("从公共横廊直接伸出的完整长梳状客运站台", center, .69, 11, right - left, 1.02, 50, paving));
    for (const z of [-4, 16]) {
      seats.push([center, 1.61, z]); backs.push([center + .33, 1.935, z]);
      for (const offset of [-1.25, 1.25]) feet.push([center, 1.375, z + offset]);
    }
  }
  for (const x of trackCenters) {
    parts.push(box("尽端站轨道各自从止挡后贯通到外部的连续道床", x, .255, 16, 3.5, .15, 58));
    for (const edge of [-1, 1]) parts.push(profileBody("内侧保持标准轨距且在公共横廊之前实际终止的工字钢轨", steel, [[-.07, 0], [.07, 0], [.07, .04], [.02, .04], [.02, .16], [.035, .16], [.035, .2], [-.035, .2], [-.035, .16], [-.02, .16], [-.02, .04], [-.07, .04]], 58, [x + edge * .7525, .45, 16]));
    for (let i = 0; i < 78; i++) sleepers.push([x, .39, -12.6 + i * .74]);
    bufferHeads.push([x, 1.7, -11.5]);
    for (const edge of [-1, 1]) {
      bufferPosts.push([x + edge * .9, .865, -11.5]);
      bufferBraces.push(meshBeam("轨道尽端止挡头实际向后锚入道床的独立斜撑", [x + edge * .9, .45, -12.9], [x + edge * .9, 1.65, -11.6], .16, steel));
    }
  }
  for (const x of [-16, -12.55, -6.55, -3.05, 3.05, 6.55, 12.55, 16]) warningBands.push([x, 1.215, 11]);
  for (const side of [-1, 1]) {
    parts.push(...glazedWall("售票大厅两侧真正封合并保留独立侧门的承重窗墙", [side * 23, -34], [side * 23, -18], 1.2, 7.7, [[-4.5, 2.4, 4, 2.6], [4.5, 2.4, 4, 2.6]], [[0, 1.2, 1.6, 3]]), ...glazedWall("列车大棚侧边直接承到拱脚的连续高窗外墙", [side * 22, -18], [side * 22, 40], 1.2, 6.3, [[-20, 2, 12, 3], [0, 2, 16, 3], [20, 2, 12, 3]]));
    for (const z of [-15, 0, 15, 30, 39]) roofPosts.push([side * 21.91, 3.24, z]);
    for (const z of [-32, -28, -20]) headPosts.push([side * 22.6, 4.375, z]);
    ticketCounters.push([side * 18, 1.775, -26]);
    const steps: [number, number][] = [[0, 0], [2.1, 0], [2.1, 1.2]];
    for (let i = 5; i >= 0; i--) { steps.push([i * .35, .18 + (i + 1) * .17]); if (i) steps.push([i * .35, .18 + i * .17]); }
    parts.push(profileBody("票厅侧面疏散门外真正从前庭接上高地台的六级短阶", paving, steps, 2.4, [side * 25.1, 0, -26], side > 0 ? 180 : 0));
    entryGuards.push(meshBeam("低坡入口两侧与坡面同坡向的连续安全扶手", [-17 + side * 1.2, 1.13, -46.24], [-17 + side * 1.2, 2.15, -34], .06, steel));
    for (const t of [0, 1 / 3, 2 / 3, 1]) entryGuards.push(meshBeam("低坡扶手真正下接各处实际坡面的独立短立杆", [-17 + side * 1.2, .18 + t * 1.02, -46.24 + t * 12.24], [-17 + side * 1.2, 1.13 + t * 1.02, -46.24 + t * 12.24], .06, steel));
  }
  for (const z of [-15, 0, 15, 30, 39]) parts.push(barrelRoof("完全接触大拱棚内表面并由两端边柱直接承住的独立钢拱肋", 21.82, .18, .3, [0, 6.3, z], steel));
  for (const z of [-32, -28, -20]) headBeams.push([0, 7.55, z]);
  parts.push(
    combineMeshes("四条尽端钢轨止挡的真实后撑保持全部独立连接", steel, bufferBraces),
    combineMeshes("低坡侧门两侧全部连续接承的真实安全栏架", steel, entryGuards),
    ...boxBatch("四条铁路线下实际逐根接承钢轨的独立枕木", timber, sleepers, [2.5, .12, .22]),
    ...boxBatch("五根站台全部临轨边缘各自连续的安全警示条", warning, warningBands, [.15, .03, 48]),
    ...boxBatch("完整大拱肋两端真正落到基础并接到拱脚的整高边柱", steel, roofPosts, [.28, 6.12, .35]),
    ...boxBatch("票厅横梁下真正从高地台完整升起的独立边柱", stone, headPosts, [.4, 6.35, .45]),
    ...boxBatch("票厅两边实落地柱之间直接顶接平屋盖的完整长梁", steel, headBeams, [45.6, .3, .4]),
    ...boxBatch("各条轨道在横廊之前独立设置的实际止挡横头", dark, bufferHeads, [2.6, .3, .4]),
    ...boxBatch("止挡横头下面真正嵌入连续道床的独立承柱", steel, bufferPosts, [.2, 1.37, .3]),
    ...boxBatch("梳状站台内让出两侧通行区的固定候车长坐板", timber, seats, [.7, .12, 3.2]),
    ...boxBatch("固定坐板后侧直接接合的完整长靠背", timber, backs, [.08, .65, 3.2]),
    ...boxBatch("所有站台长凳真正从站台面接到坐板的独立承脚", steel, feet, [.45, .35, .12]),
    ...boxBatch("售票大厅两侧避开中央与侧门通路的完整服务长柜", timber, ticketCounters, [.85, 1.15, 6]),
  );
  return parts;
}
