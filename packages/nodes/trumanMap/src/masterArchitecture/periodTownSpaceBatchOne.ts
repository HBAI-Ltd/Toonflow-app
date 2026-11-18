import { part, beam, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { base, box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { verticalPanel, windowHole } from "./historicSpaceBatchNine";
import { stairFlight } from "./historicSpaceBatchSeven";
import { openingWall, holesAt } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#b5af99", plaster = "#c4b99d", wood = "#8d7253", iron = "#626b65", roofColor = "#797568";

// 原创年代影视银行布景：高公众厅、纵向柜后夹廊、侧置厚库和低后勤翼组成完整不对称平面。
// 只参考独立银行厅/柜笼/侧库的类型，不复刻某一馆藏图纸：https://tile.loc.gov/storage-services/master/pnp/habshaer/pa/pa3500/pa3505/data/pa3505cap.pdf
export const periodTownSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("侧库夹廊前高厅年代银行", "公众从前柱廊进入高营业厅，侧向服务窗后的纵夹廊通到偏置厚壁金库和低后勤翼；金库门真实开启，后勤横廊、两间办公室与独立后门连通，三种不同高度的完整屋盖分别有实墙承托", periodTownBank, "建筑", "欧式"),
];

function periodTownBank(): ModelPart[] {
  const footprint: [number, number][] = [[-8, -10], [8, -10], [8, 1], [13, 1], [13, 9], [8, 9], [8, 13], [-8, 13]];
  const p: ModelPart[] = [base(32, 29), polygon("营业厅后勤翼与右侧突出金库共同的完整折角地坪", stone, footprint, .24, [0, .18, 0]), openingWall("公众高厅正面真正贯通的中央大门与两侧拱窗", 16, 6.1, [...holesAt([0], 2.8, 3.2), ...[-4.7, 4.7].map(x => windowHole(x, 1.1, 2.5, 3.1))], [0, .42, -10], 0, stone), openingWall("高厅左侧真正留出采光窗和后侧疏散门的完整外墙", 15, 6.1, [...holesAt([-5.7], 1.3, 2.8), ...[-2, 2.5, 5.5].map(x => windowHole(x, 1.5, 2, 2.8))], [-8, .42, -2.5], 90, plaster), openingWall("柜后纵夹廊外侧通向侧库的真门与屋盖下高窗", 15, 6.1, [...holesAt([-5.5], 1.3, 2.7), ...holesAt([-4, 0, 4.5], 1.6, 1.3, 4.4)], [8, .42, -2.5], 90, plaster), openingWall("高营业厅通往低后勤横廊的两条真实独立门道", 16, 6.1, [...holesAt([-5.3, 6.2], 1.4, 2.7), ...holesAt([-4, 1, 6], 1.7, 1.2, 4.6)], [0, .42, 5], 0, plaster), part("高营业厅由四周完整外墙接承的封闭双坡阁顶", "extrude", roofColor, [0, 6.72, -2.5], [1, 1, 1], [0, 0, 0], { depth: 15.6, profile: [{ x: -8.3, y: 0 }, { x: 0, y: 2 }, { x: 8.3, y: 0 }, { x: 8.3, y: -.2 }, { x: -8.3, y: -.2 }] }), box("高厅正面实际嵌入外壁顶端的连续檐口石梁", 0, 6.43, -10.12, 16.6, .22, .65, stone), openingWall("低后勤翼背面实际开通的独立职员出口与办公窗", 16, 3.3, [...holesAt([6.2], 1.4, 2.7), ...holesAt([-5, .5], 2, 1.5, 1.15)], [0, .42, 13], 0, plaster), openingWall("低后勤翼左侧独立办公室的真实透光窗壁", 8, 3.3, holesAt([.7], 2.2, 1.5, 1.15), [-8, .42, 9], 90, plaster), openingWall("侧库之后独立通向后勤横廊的真实外门", 4, 3.3, holesAt([0], 1.3, 2.6), [8, .42, 11], 90, plaster), part("低后勤办公翼由外墙及分间壁接承的完整低双坡阁顶", "extrude", roofColor, [0, 3.92, 9], [1, 1, 1], [0, 0, 0], { depth: 8.6, profile: [{ x: -8.3, y: 0 }, { x: 0, y: 1.1 }, { x: 8.3, y: 0 }, { x: 8.3, y: -.2 }, { x: -8.3, y: -.2 }] }), openingWall("后勤横廊与两间办公室之间实际分开的门洞", 16, 3.3, holesAt([-4.3, 4.6], 1.25, 2.55), [0, .42, 7.2], 0, plaster), box("后勤办公室从横廊后缘实际接到外墙和阁顶的实隔壁", 0, 2.07, 10.1, .25, 3.3, 5.8, plaster), verticalPanel("右侧厚库与柜后夹廊之间有真实通门的半米厚库壁", [[-4, 0], [4, 0], [4, 3.7], [-4, 3.7]], holesAt([2], 1.3, 2.7), .5, [8, .42, 5], 90, stone), box("侧置金库最外侧由完整地坪承托的厚承重墙", 13, 2.27, 5, .5, 3.7, 8, stone), box("侧置金库前端实际闭合左右厚壁的完整横墙", 10.5, 2.27, 1, 5.5, 3.7, .5, stone), box("侧置金库后端实际闭合左右厚壁的完整横墙", 10.5, 2.27, 9, 5.5, 3.7, .5, stone), box("偏置金库由四面完整厚壁接承的厚石平盖", 10.5, 4.295, 5, 5.6, .35, 8.6, stone), box("金库内真正落在厚地坪上的连续低存箱石台", 10.7, .64, 5, 2.5, .44, 4, stone), openingWall("公众与纵向职员夹廊之间实际开通交付窗和职员门的木柜笼", 12, 3.05, [...holesAt([-5], 1.2, 2.6), ...holesAt([-2.4, .5, 3.4], 1.55, 1.3, 1.1)], [4.5, .42, -1], 90, wood), box("正门柱廊实际抬高并与门前厅面同高的完整石踏台", 0, .3, -10.8, 6.8, .24, 2.8, stone), box("门前两柱及高厅前壁共同承接的完整短石雨盖", 0, 3.55, -10.85, 6.6, .26, 2.7, stone), stairFlight("街面真正登上银行前柱廊并接到门前踏台的短宽阶", 2, 3, .24, .28, 0, [0, .18, -12.76], -90), box("左后经理室独立落地的完整卷宗案柜基体", -4, .9, 10.3, 3.4, .96, 1.2, wood), box("经理案柜基体上实际搭接的宽写字台面", -4, 1.43, 10.3, 3.6, .1, 1.4, wood), box("右后职员账房独立落地并避开门道的长账柜", 4, 1, 11.7, 5, 1.16, .9, wood)];
  for (const side of [-1, 1]) p.push(box("正面银行外墙与顶檐共同连接的完整石壁柱", side * 7.6, 3.47, -10.12, .5, 6.1, .55, stone), cylinder("前柱廊真正由踏台接到雨盖底面的承重圆石柱", side * 2.7, 1.92, -11.8, .35, 3, stone));
  const bars: SolidBox[] = [];
  for (const local of [-2.4, .5, 3.4]) {
    const z = -1 - local;
    p.push(box("三个独立交付窗口下方实际嵌入木壁的宽柜板", 4.5, 1.52, z, .9, .08, 1.75, wood));
    for (const offset of [-.55, 0, .55]) bars.push({ center: [4.5, 2.17, z + offset], size: [.035, 1.3, .035] });
  }
  p.push(boxesMesh("三个柜窗真正由柜板接到上窗框的完整钢格栅", iron, bars));
  const door = box("金库真实门口内向柜后夹廊开启六十度的独立厚铁门", 7.4370835, 1.805, 2.675, .16, 2.7, 1.3, iron); door.rotation.y = -60;
  p.push(door, ...[.95, 2.65].map(y => cylinder("厚铁库门与石门框实际共用的短竖铰轴", 8, y, 2.35, .08, .22, iron)), beam("实接厚库门正面而不悬空的短门锁轴", iron, [7.4370835, 1.8, 2.675], [7.5470835, 1.8, 2.8655256], .075), cylinder("短锁轴末端实际接承的完整锁柄圆毂", 7.5470835, 1.8, 2.8655256, .14, .08, iron, [0, -60, -90]));
  return p;
}
