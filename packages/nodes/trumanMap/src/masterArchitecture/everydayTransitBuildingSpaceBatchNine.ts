import type { ModelPart, Triple } from "../assetModelParts";
import { boxBatch, hardPlan, profileBody } from "./everydayOutdoorSpaceBatchOne";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { doorway } from "./publicSpaceBatchOne";
import { box, design, type ArchitecturePrototype } from "./structures";

const paving = "#c8c1af", steel = "#68817e", timber = "#a68c68", white = "#d9dcca";

export const everydayTransitBuildingSpaceBatchNineDesigns: ArchitecturePrototype[] = [
  design("中脊双向客运联检楼", "两条方向相反的完整旅客长厅由中央封闭职员通廊隔开，各厅的真实查验通口、带开放服务窗口的独立查验亭和行李复核分区依次相接；中央通廊经真门通向前后独立服务间，四个公共门由连续前后庭与街面缓坡接入", passengerInspectionTerminal, "建筑", "现代"),
];

function passengerInspectionTerminal(): ModelPart[] {
  const parts: ModelPart[] = [
    box("双向旅客厅职员中廊前后门庭共同的完整落地基础", 0, .09, 0, 42, .18, 56, paving),
    box("左右公共长厅和中央封闭职员通廊同高的完整地面", 0, .24, 0, 34, .12, 44, paving),
    box("中央职员通廊和前后服务间共同的完整低屋盖", 0, 4.65, 0, 6.5, .25, 44.5, steel),
    ...glazedWall("中廊前方独立进入职员前室的实际窄门", [-3, -22], [3, -22], .3, 4.525, [], [[0, .3, 1.6, 2.6]]),
    ...glazedWall("中廊后方独立进入复核服务室的实际窄门", [-3, 22], [3, 22], .3, 4.525, [], [[0, .3, 1.6, 2.6]]),
    ...glazedWall("前服务室与职员中廊之间真正可进入的分隔门", [-3, -12], [3, -12], .3, 4.525, [[-1.8, 1.4, 1.4, 1.5]], [[0, .3, 1.4, 2.5]]),
    ...glazedWall("后复核室与职员中廊之间真正可进入的分隔门", [-3, 12], [3, 12], .3, 4.525, [[1.8, 1.4, 1.4, 1.5]], [[0, .3, 1.4, 2.5]]),
  ];
  const hallPosts: Triple[] = [], hallBeams: Triple[] = [], corePosts: Triple[] = [], coreBeams: Triple[] = [], porchPosts: Triple[] = [], canopies: Triple[] = [], counterBoards: Triple[] = [], counterFeet: Triple[] = [], inspectionTables: Triple[] = [], inspectionFeet: Triple[] = [], benches: Triple[] = [], benchFeet: Triple[] = [], barriers: SolidBox[] = [];
  for (const side of [-1, 1]) {
    const x = side * 10, low = side < 0 ? -17 : 3, high = side < 0 ? -3 : 17, direction = side < 0 ? 1 : -1, row = side < 0 ? 3 : -3, partitionZ = side < 0 ? -4 : -10, tableZ = side < 0 ? -9 : -15;
    parts.push(
      box("一侧旅客长厅由内外承墙完整覆盖的独立高屋盖", x, 5.95, 0, 14.5, .3, 44.5, steel),
      ...glazedWall("前公共门庭实际进入独立旅客长厅的宽门与采光窗", [low, -22], [high, -22], .3, 5.8, [[-4.8, 1.4, 2.8, 2.7], [4.8, 1.4, 2.8, 2.7]], [[0, .3, 3, 3.2]]),
      ...glazedWall("后公共门庭实际进入同一旅客长厅的独立宽门与窗", [low, 22], [high, 22], .3, 5.8, [[-4.8, 1.4, 2.8, 2.7], [4.8, 1.4, 2.8, 2.7]], [[0, .3, 3, 3.2]]),
      ...glazedWall("公共长厅外侧由整高窗间壁接承屋盖的完整采光墙", [side * 17, side < 0 ? -22 : 22], [side * 17, side < 0 ? 22 : -22], .3, 5.8, [-15, -5, 5, 15].map((z): [number, number, number, number] => [side < 0 ? z : -z, 1.3, 6, 2.7])),
      ...glazedWall("公共厅与封闭职员脊廊之间带真实内门和观察窗的长隔墙", [side * 3, -22], [side * 3, 22], .3, 5.8, [-15, -5, 5, 15].map((z): [number, number, number, number] => [z, 1.1, 4, 2]), [[side < 0 ? -10 : -9, .3, 1.3, 2.5], [10, .3, 1.3, 2.5]]),
      ...glazedWall("行李复核分区实际让出两条独立旅客路线的完整内墙", [low, partitionZ], [high, partitionZ], .3, 5.8, [[0, 1.4, 3, 2]], [[-3, .3, 2, 2.8], [3, .3, 2, 2.8]]),
      box("完整查验亭由四面独立墙体接承的小屋盖", x, 3.1, row, 3.5, .2, 4.3, steel),
      ...glazedWall("查验亭朝来向公共排队区的完整观察窗", [x - 1.6, row + direction * 2], [x + 1.6, row + direction * 2], .3, 3, [[0, 1.3, 2, 1.2]]),
      ...glazedWall("独立查验亭背侧实际进入室内的职员小门", [x - 1.6, row - direction * 2], [x + 1.6, row - direction * 2], .3, 3, [], [[0, .3, .85, 2.1]]),
    );
    for (const edge of [-1, 1]) {
      const lane = x + edge * 3;
      parts.push(...glazedWall("独立查验亭两侧面向旅客的实际开放服务窗口", [x + edge * 1.6, row - 2], [x + edge * 1.6, row + 2], .3, 3, [], [[0, 1.1, 1.6, 1.2]]), doorway("排队路线真正穿过的独立查验通口", [lane, .3, row + direction * 3], 2.4, 2.4, 1.4, 0, 2.2));
      counterBoards.push([x + edge * 1.95, 1.04, row]); counterFeet.push([x + edge * 2.2, .64, row]);
      const arrow: [number, number][] = [[-.12, -1.5], [.12, -1.5], [.12, .4], [.65, .4], [0, 1.5], [-.65, .4], [-.12, .4]];
      for (const z of [-18, 16]) parts.push(hardPlan("反向公共路线实际铺在地面上的独立指向标记", white, arrow.map(([a, b]): [number, number] => [lane + a, z - direction * b]), .012, [0, .3, 0]));
    }
    for (const [a, b] of [[low, x - 4.2], [x - 1.8, x + 1.8], [x + 4.2, high]]) barriers.push({ center: [(a! + b!) / 2, .8, row + direction * 3], size: [b! - a!, 1, .12] });
    for (const z of [-20, -8, 8, 20]) { hallPosts.push([side * 16.7, 2.9, z], [side * 3.3, 2.9, z]); hallBeams.push([x, 5.65, z]); }
    for (const end of [-1, 1]) {
      canopies.push([x, 3.8, end * 23.5]);
      for (const edge of [-1, 1]) porchPosts.push([x + edge * 3, 2, end * 24.5]);
    }
    inspectionTables.push([x, 1.18, tableZ]);
    for (const edge of [-1, 1]) inspectionFeet.push([x + edge * 1.3, .71, tableZ]);
    for (const z of [-18, 15]) { benches.push([side * 15.8, .71, z]); for (const offset of [-1.4, 1.4]) benchFeet.push([side * 15.8, .475, z + offset]); }
  }
  for (const z of [-20, 0, 20]) { coreBeams.push([0, 4.425, z]); for (const x of [-2.7, 2.7]) corePosts.push([x, 2.3125, z]); }
  for (const end of [-1, 1]) parts.push(box("全部公共门和职员门外与室内同高的完整连续门庭", 0, .24, end * 24, 34, .12, 4), profileBody("公共门庭外缘准确接回街面基础的连续低缓坡", paving, end < 0 ? [[0, 0], [2, 0], [2, .3], [0, .18]] : [[0, 0], [2, 0], [2, .18], [0, .3]], 34, [0, 0, end < 0 ? -28 : 26], -90));
  parts.push(
    boxesMesh("各厅查验通口之外实际限定两条队列的完整低隔栏", steel, barriers),
    ...boxBatch("左右高厅屋梁下真正从公共地面起立的完整钢柱", steel, hallPosts, [.25, 5.2, .3]),
    ...boxBatch("公共高厅内外两列柱之间直接顶接屋盖的完整横梁", steel, hallBeams, [13.8, .3, .3]),
    ...boxBatch("中央低屋盖下从职员通廊地面完整起立的独立细柱", steel, corePosts, [.2, 4.025, .25]),
    ...boxBatch("职员中廊边柱之间实际接承低屋盖的完整短横梁", steel, coreBeams, [5.6, .2, .25]),
    ...boxBatch("四个公共门庭外真正由细柱实承的完整入厅雨檐", steel, canopies, [7, .2, 3]),
    ...boxBatch("公共门庭雨檐下面避开主门通路的完整落地细柱", steel, porchPosts, [.2, 3.4, .24]),
    ...boxBatch("开放服务窗口下面实际搭接查验亭墙体的独立台面", timber, counterBoards, [.7, .12, 1.6]),
    ...boxBatch("查验窗口台面外侧真正接到地面的独立承脚", steel, counterFeet, [.1, .68, 1.2]),
    ...boxBatch("复核分区内避开两条公共通路的完整行李查看台面", paving, inspectionTables, [3.2, .12, 1.4]),
    ...boxBatch("每张行李查看台真正落地且直接接到台底的独立承脚", steel, inspectionFeet, [.15, .82, 1.2]),
    ...boxBatch("公共长厅外侧避开查验通口的固定等候长坐板", timber, benches, [.7, .12, 3.5]),
    ...boxBatch("固定等候长凳真正从公共地面接到坐板的独立短脚", steel, benchFeet, [.45, .35, .12]),
  );
  return parts;
}
