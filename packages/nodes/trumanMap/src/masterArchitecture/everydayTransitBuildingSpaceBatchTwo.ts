import type { ModelPart, Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { boxBatch, hardPlan, profileBody } from "./everydayOutdoorSpaceBatchOne";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, design, type ArchitecturePrototype } from "./structures";
import { meshBeam } from "./vernacularWorldBatchFive";

const paving = "#c4beac", asphalt = "#6f807b", steel = "#667f7c", wood = "#a48c69", white = "#dcdbc5", warning = "#cdbb80";

export const everydayTransitBuildingSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("穿街双翼直通公交客运厅", "始终贯穿两端街区的有顶公共步街夹在两座完整候车厅之间，乘客从街内真门进厅，再从外侧双门走向独立长站台；公交车沿两外侧平行车道直进直出，站厅后部各有带服务窗口和独立后门的售票工作间，车道与公共步街不交叉", throughStreetBusTerminal, "建筑", "现代"),
];

function throughStreetBusTerminal(): ModelPart[] {
  const parts: ModelPart[] = [
    box("双翼候车厅和两侧直通车道共用的完整落地站场", 0, .08, 0, 56, .16, 72, asphalt),
    box("不封闭前后街口的完整中央公共步街", 0, .26, 0, 6, .2, 60, paving),
    profileBody("前街口从外部站场连续上接公共步街的真实缓坡", paving, [[0, 0], [4, 0], [4, .36], [0, .16]], 6, [0, 0, -34], -90),
    profileBody("后街口从公共步街连续下接外部站场的真实缓坡", paving, [[0, 0], [4, 0], [4, .16], [0, .36]], 6, [0, 0, 30], -90),
    profileBody("中央步街上方独立连续并有真实厚度的脊顶雨盖", steel, [[-3.7, 0], [0, .5], [3.7, 0], [3.7, .2], [0, .7], [-3.7, .2]], 44, [0, 6.2, 0]),
    box("中央高脊雨盖下直接连接三榀承架的连续纵脊梁", 0, 6.6, 0, .18, .16, 44, steel),
  ];
  const highPosts: Triple[] = [], hallPosts: Triple[] = [], hallBeams: Triple[] = [], benches: Triple[] = [], backs: Triple[] = [], feet: Triple[] = [], counter: Triple[] = [], laneDashes: Triple[] = [], forecourts: Triple[] = [];
  const rafters: ModelPart[] = [], stops: SolidBox[] = [];
  for (const side of [-1, 1]) {
    const inner = side * 3, outer = side * 14, center = side * 8.5, low = side < 0 ? -14 : 3, high = side < 0 ? -3 : 14;
    parts.push(
      box("一侧候车大厅与后服务间连续同高的完整楼面", center, .26, 0, 11, .2, 40, paving),
      box("候车厅外侧与全部乘客门齐平的完整长登车站台", side * 15.25, .26, 0, 2.5, .2, 44, paving),
      box("候车大厅与外侧站台共用的连续悬挑低屋盖", side * 9.75, 4.5, 0, 13.9, .2, 40.4, steel),
      box("独立于公共步街并前后贯通的两线宽公交车道", side * 19.75, .18, 0, 6.5, .04, 64, asphalt),
      box("沿平齐登车站台外缘连续设置的安全警示带", side * 16.35, .375, 0, .15, .03, 43, warning),
      ...glazedWall("公共步街进入完整候车厅的两道实际宽门和独立窗", [inner, -20], [inner, 20], .36, 4.4, [[-15, 1, 4.5, 2.3], [0, 1, 9, 2.3], [16, 1.2, 4, 1.9]], [[-8, .36, 2.8, 2.8], [8, .36, 2.8, 2.8]]),
      ...glazedWall("候车厅向外侧登车长台真正开出的双门和采光窗", [outer, -20], [outer, 20], .36, 4.4, [[-15, 1, 4.5, 2.3], [0, 1, 9, 2.3], [16, 1.2, 4, 1.9]], [[-8, .36, 2.8, 2.8], [8, .36, 2.8, 2.8]]),
      ...glazedWall("每侧完整候车厅接向前公共庭的实际正门和两侧窗", [low, -20], [high, -20], .36, 4.4, [[-3.7, 1.1, 2.7, 2], [3.7, 1.1, 2.7, 2]], [[0, .36, 2.4, 2.8]]),
      ...glazedWall("后售票工作间独立通向后庭的真门与两侧外窗", [low, 20], [high, 20], .36, 4.4, [[-3.7, 1.2, 2.4, 1.7], [3.7, 1.2, 2.4, 1.7]], [[0, .36, 1.5, 2.6]]),
      ...glazedWall("候车区后部真正区分售票工作间的门和开放服务窗口", [low, 12], [high, 12], .36, 4.4, [], [[side * -2.8, .36, 1.3, 2.6], [side * 2.1, 1.1, 4, 1.25]]),
    );
    counter.push([center + side * 2.1, .73, 12.2]);
    for (const z of [-18, 0, 18]) {
      highPosts.push([side * 2.8, 3.2925, z]);
      hallPosts.push([side * 3.2, 2.23, z], [side * 13.8, 2.23, z]);
      hallBeams.push([side * 9.75, 4.25, z]);
      rafters.push(meshBeam("公共步街高雨顶真正从边柱向屋脊连续升起的斜椽", [side * 3.7, 6.18, z], [0, 6.68, z], .16, steel));
    }
    for (const z of [-14, 0]) {
      benches.push([center, .78, z]); backs.push([center, 1.12, z + .34]);
      for (const offset of [-2.5, 2.5]) feet.push([center + offset, .54, z]);
    }
    for (let i = 0; i < 18; i++) laneDashes.push([side * 19.75, .21, -29.75 + i * 3.5]);
    for (const z of [-9, 9]) {
      const bay = side * 18.125;
      for (const edge of [-1, 1]) stops.push({ center: [bay + edge * 1.35, .215, z], size: [.08, .03, 12] }, { center: [bay, .215, z + edge * 6], size: [2.7, .03, .08] });
    }
    const arrow: [number, number][] = [[-.12, -1.8], [.12, -1.8], [.12, .6], [.7, .6], [0, 1.7], [-.7, .6], [-.12, .6]];
    parts.push(hardPlan("不穿过公共步街且顺两侧相反方向贯通的车道箭头", white, arrow.map(([x, z]): [number, number] => [side * 21.4 + x, z * side]), .015, [0, .2, 0]));
    for (const end of [-1, 1]) forecourts.push([center, .26, end * 24]);
  }
  parts.push(
    combineMeshes("三榀公共步街脊顶斜椽保持真实角度并直接承屋", steel, rafters),
    boxesMesh("四个平行停靠位真实留出完整超车道的独立白线边界", white, stops),
    ...boxBatch("中央高雨盖真正从步街地坪升起的独立窄边柱", steel, highPosts, [.2, 5.865, .24]),
    ...boxBatch("候车厅低屋盖在内外墙内侧完整落地的独立钢柱", steel, hallPosts, [.22, 3.74, .26]),
    ...boxBatch("同时承住候车厅和悬挑登车棚的完整横向深梁", steel, hallBeams, [13.6, .3, .25]),
    ...boxBatch("两侧相反方向公交车道之间的真实断续分道线", white, laneDashes, [.08, .02, 1.9]),
    ...boxBatch("四排固定候车长凳在主门通道之间真实落位的坐板", wood, benches, [6, .12, .72]),
    ...boxBatch("固定候车长凳与坐板相接的完整长靠背", wood, backs, [6, .68, .08]),
    ...boxBatch("全部固定候车长凳从楼面到坐板的独立承脚", steel, feet, [.12, .36, .5]),
    ...boxBatch("后工作间服务窗口下方直接承住开放柜面的固定长台", wood, counter, [4, .74, .8]),
    ...boxBatch("直接接上中央步街且不重叠铺面的前后公共门庭", paving, forecourts, [11, .2, 8]),
  );
  return parts;
}
