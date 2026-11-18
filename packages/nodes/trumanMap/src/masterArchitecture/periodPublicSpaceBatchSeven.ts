import { beam, type ModelPart } from "../assetModelParts";
import { base, box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { polygon } from "../masterNature/shared";
import { stairFlight } from "./historicSpaceBatchSeven";
import { halfRoundWall } from "./spatialShells";
import { openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#bbb8a8", plaster = "#c6beaa", wood = "#8b7258", iron = "#65706f";

export const periodPublicSpaceBatchSevenDesigns: ArchitecturePrototype[] = [
  design("分叉大阶U廊乐队舞厅", "前厅中央大阶经半高平台分叉到左右上廊，后方封闭高厅内有平整圆舞池与半圆乐队台，U形包厢走廊围绕通高舞池，连续承柱、横梁和侧疏散门组成完整歌舞空间", periodBallroom, "建筑", "欧式"),
];

function periodBallroom(): ModelPart[] {
  const p: ModelPart[] = [base(40, 54), box("前厅、分叉大阶和高舞厅共用的完整石铺地坪", 0, .3, 0, 38, .24, 50, stone), openingWall("舞厅入口前楼实际贯通的大门与双层采光窗", 30, 7.6, [...holesAt([0], 4, 3.5), ...[1.2, 5].flatMap(y => holesAt([-10, 10], 2.4, 2, y))], [0, .42, -20]), openingWall("前厅与舞厅之间实际贯通的地面正门和上层双侧门", 30, 8.4, [...holesAt([0], 5, 3.5), ...holesAt([-12.5, 12.5], 2, 2.8, 4.235), ...holesAt([0], 4, 2, 5.3)], [0, .42, -10]), box("入口前楼由完整高墙接承的平屋盖", 0, 8.145, -15, 30.6, .25, 10.6, plaster), box("高舞厅连续柱梁真正承托的完整平屋盖", 0, 8.945, 3, 30.6, .25, 26.6, plaster), polygon("舞池两侧与后方连续接通且保持前侧开口的U形上廊楼板", wood, [[-15, -10], [-10, -10], [-10, 12], [10, 12], [10, -10], [15, -10], [15, 16], [-15, 16]], .25, [0, 4.37, 0]), cylinder("高舞厅中央真实贴合石地面的平整圆木舞池", 0, .44, -1, 14, .04, wood), stairFlight("前厅中轴真实登上半高分叉平台的宽木阶", 12, 3, 2.1, .35, 0, [0, .42, -19.2], -90, true), box("分叉大阶两侧上行支路共同接入的真实半高平台", 0, 2.42, -13.5, 6, .2, 3, wood), postSet("半高转向平台下方真正落地的四根木撑", [[-2.5, -14.7], [2.5, -14.7], [-2.5, -12.3], [2.5, -12.3]], 1.9), box("分叉平台后沿真实防护临空边的木栏", 0, 3.02, -12, 6, 1, .1, wood), box("舞厅正门前有完整承柱的短平雨盖", 0, 4.745, -21.2, 12, .25, 2.4, plaster), postSet("入口雨盖两端由石地真正接到檐底的完整木柱", [[-5, -22.2], [5, -22.2]], 4.2)];
  for (const s of [-1, 1]) {
    p.push(openingWall("前厅两侧真正透光的上下窗外壁", 10, 7.6, [1.2, 5].flatMap(y => holesAt([-2.5, 2.5], 1.8, 2, y)), [s * 15, .42, -15], 90), box("前厅两侧实际接到分叉阶顶与舞厅上廊的高木楼面", s * 12.15, 4.495, -15, 5.7, .25, 10, wood), stairFlight("半高转向平台向左右上廊实际连续上行的宽分叉木阶", 14, 2.4, 2.1, .45, 0, [s * 3, 2.52, -13.5], s < 0 ? 180 : 0, true), postSet("前厅两侧真正承托上层走廊和前楼屋盖的整高木柱", [[s * 9.3, -19], [s * 9.3, -11]], 7.6), openingWall("高舞厅两侧让出真实疏散门与上层采光窗的外墙", 26, 8.4, [...holesAt([9, -5], 1.6, 2.8), ...holesAt([-8, 0, 8], 2.8, 2, 5)], [s * 15, .42, 3], 90), box("舞厅上层侧廊朝向通高舞池的完整木护栏", s * 10, 5.12, 1, .1, 1, 22, wood));
    for (const [a, b] of [[-20, -14.7], [-12.3, -10]]) p.push(box("前厅上廊让开分叉阶顶入口的内缘木护栏", s * 9.3, 5.12, (a! + b!) / 2, .1, 1, b! - a!, wood));
    p.push(box("大阶转向平台前沿让开中间登阶口的短木护栏", s * 2.25, 3.02, -15, 1.5, 1, .1, wood));
  }
  p.push(openingWall("舞厅后部真正开通地面服务门与上层窗的完整后壁", 30, 8.4, [...holesAt([-11, 11], 1.5, 2.7), ...holesAt([-10, 0, 10], 2.8, 2, 5)], [0, .42, 16]), box("U形上廊后侧连续围护舞池挑空边缘的完整木栏", 0, 5.12, 12, 20, 1, .1, wood), postSet("高舞厅内真正承托上廊楼面与平屋盖的连续整高木柱", [-7, 0, 7, 14].flatMap(z => [[-10, z], [10, z]] as [number, number][]).concat([[-5, 14], [0, 14], [5, 14]]), 8.4));
  for (const z of [-7, 0, 7, 14]) p.push(box("舞厅屋盖下实际连接两排承柱与外墙的连续厚横梁", 0, 8.52, z, 30, .6, .35, iron));
  const stage: [number, number][] = [[-6, 0], [6, 0]];
  for (let i = 1; i < 16; i++) { const a = i * Math.PI / 16; stage.push([Math.cos(a) * 6, Math.sin(a) * 6]); }
  p.push(polygon("舞池后方真实抬起且底部落地的半圆乐队台", wood, stage, .8, [0, .42, 7]), halfRoundWall("乐队台后方真正围合半圆背景且接到后廊底的木背壁", 6, .15, 3.15, [0, 1.22, 7], 0, wood), stairFlight("舞池后方真正接到乐队台面的短宽木阶", 4, 3, .8, .3, 0, [0, .42, 5.8], -90));
  const balusters: SolidBox[] = [];
  for (const s of [-1, 1]) {
    p.push(beam("中轴下段大阶两侧真正随阶上升的木扶手", wood, [s * 1.5, 1.42, -19.2], [s * 1.5, 3.52, -15], .08));
    for (const t of [0, .5, 1]) balusters.push({ center: [s * 1.5, .92 + 2.1 * t, -19.2 + 4.2 * t], size: [.1, 1, .1] });
    for (const side of [-1, 1]) {
      const z = -13.5 + side * 1.2;
      p.push(beam("左右分叉阶两侧真正连续连接平台与上廊的斜木扶手", wood, [s * 3, 3.52, z], [s * 9.3, 5.62, z], .08));
      for (const t of [0, .5, 1]) balusters.push({ center: [s * (3 + 6.3 * t), 3.02 + 2.1 * t, z], size: [.1, 1, .1] });
    }
    for (const z of [-6, 0, 6]) p.push(cylinder("舞池两侧上廊下真实平整的圆桌桌面", s * 12.3, 1.17, z, 1.3, .1, wood), cylinder("侧廊圆桌桌面下真正落地的独立细木承足", s * 12.3, .77, z, .12, .7, wood));
  }
  p.push(boxesMesh("分叉大阶各段扶手下实际接到踏面的完整立杆", wood, balusters));
  return p;
}
