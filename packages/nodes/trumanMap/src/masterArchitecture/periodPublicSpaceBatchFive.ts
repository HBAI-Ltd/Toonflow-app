import type { ModelPart } from "../assetModelParts";
import { base, box, design, type ArchitecturePrototype } from "./structures";
import { barrelRoof } from "./spatialShells";
import { verticalPanel } from "./historicSpaceBatchNine";
import { tiledRoof, openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";

const stone = "#aaa997", plaster = "#bfb59d", wood = "#896d50", brick = "#b18b76";

export const periodPublicSpaceBatchFiveDesigns: ArchitecturePrototype[] = [
  design("石券后三库开庭票号", "前方公共交款横厅与两侧低记账房围住开敞作业庭，后方三座独立押银库各由厚侧墙、真实筒券和拱形端壁围合，窄库门与背后高窗真正贯通", vaultedTreasuryExchange, "建筑", "中式"),
];

function vaultedTreasuryExchange(): ModelPart[] {
  const p: ModelPart[] = [base(38, 44), box("营业厅、记账间、作业庭与石券押库共同的石铺地坪", 0, .3, 0, 36, .24, 42, stone), openingWall("前方营业交款横厅真正贯通的主门与侧窗", 24, 4.2, [...holesAt([0], 3, 3), ...holesAt([-8, 8], 2.4, 1.6, 1.3)], [0, .42, -18], 0, brick), openingWall("营业厅两端真正通向后作业庭的职员双门", 24, 4.2, [...holesAt([-8, 8], 1.5, 2.8), ...holesAt([0], 2.4, 1.6, 1.3)], [0, .42, -10], 0, brick), tiledRoof("公共交款横厅沿长边延伸的完整低跨灰瓦盖", 24, 8, 4.62, [0, -14]), box("交款厅中央低木柜两边保留真正通行侧路", 0, 1.07, -12, 10, 1.3, .9, wood), postSet("公共交款厅内真正接承封闭屋顶的木柱", [[-7, -14], [7, -14]], 4.2)];
  for (const s of [-1, 1]) {
    p.push(openingWall("交款横厅两端实际透光的砖窗侧壁", 8, 4.2, holesAt([0], 2, 1.6, 1.3), [s * 12, .42, -14], 90, brick), box("票号完整连接前厅与后库的外围长墙", s * 16, 1.92, -.5, .3, 3, 35, plaster), box("前厅两端真正接到外围长墙的临街短壁", s * 14, 1.92, -18, 4, 3, .3, plaster), box("石券押库背后真正接到外围长墙的封合短壁", s * 12.95, 1.92, 17, 6.1, 3, .3, plaster), openingWall("两侧低记账房面对作业庭的真实门窗", 9, 3.4, [...holesAt([0], 1.3, 2.6), ...holesAt([-2.7, 2.7], 1.2, 1.2, 1.3)], [s * 9, .42, -3.5], 90), openingWall("记账房外侧真正透光的完整窗墙", 9, 3.4, holesAt([-2.5, 2.5], 1.6, 1.5, 1.2), [s * 15, .42, -3.5], 90), tiledRoof("作业庭两侧记账房各自完整封合的低灰瓦盖", 6, 9, 3.82, [s * 12, -3.5]));
    for (const z of [-8, 1]) p.push(box("记账低房两端真正封合的完整厚壁", s * 12, 2.12, z, 6, 3.4, .3, plaster));
  }
  const end: [number, number][] = [[-2.9, 0], [2.9, 0], [2.9, 2]];
  for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 12; end.push([Math.cos(a) * 2.9, 2 + Math.sin(a) * 2.9]); }
  for (const x of [-7, 0, 7]) {
    p.push(barrelRoof("押银库由厚直壁真正接承的完整纵向石筒券", 2.6, .3, 14, [x, 2.42, 10], stone), verticalPanel("石券押库前端真正依拱形封合且让出窄库门的厚端壁", end, holesAt([0], 1.4, 2.5), .45, [x, .42, 3], 0, stone), verticalPanel("石券押库后端真正依拱形封合且让出高窗的厚端壁", end, holesAt([0], .8, .8, 2.9), .45, [x, .42, 17], 0, stone), box("押银库内部真正独立落地的低石存箱台", x, .67, 11.5, 2.6, .5, 5, stone));
    for (const s of [-1, 1]) p.push(box("押银库从石地真正接到筒券起拱线的厚承重直壁", x + s * 2.75, 1.42, 10, .3, 2, 14, stone));
  }
  return p;
}
