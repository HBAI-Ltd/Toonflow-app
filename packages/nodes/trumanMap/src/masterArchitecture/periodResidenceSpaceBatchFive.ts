import type { ModelPart, Triple } from "../assetModelParts";
import { tapered } from "../masterNature/shared";
import { box, design } from "./structures";
import { slopePanel } from "./vernacularWorldBatchOne";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";
import { packMeshes } from "./vernacularWorldBatchThirteen";
import { lattice, periodWall } from "./periodResidenceSpaceBatchOne";

const bamboo = "#b39d70", timber = "#8c7652", stone = "#aaa895", roofColor = "#8f9870";

// https://www.neac.gov.cn/seac/ztzl/daiz/fsxg.shtml
// https://cnwec.muc.edu.cn/info/1025/3466.htm
// 完整通柱梁格、裸露晒台与侧廊的米制原创构造；不复制旧半干栏的前廊/后石台组合。
export const periodResidenceSpaceBatchFiveDesigns = [
  design("通柱梁格前晒台侧廊竹楼", "整片架空楼面由通柱和双向梁格支承，宽无遮顶前晒台经侧长廊进入前客厅，后寝区由实际木隔门分开，四坡主盖与侧廊低坡相接，底层各柱间保留完整农作畜空，独立前梯接进晒台栏口", fullStiltTerraceResidence, "建筑", "中式"),
];

function fullStiltTerraceResidence(): ModelPart[] {
  const p: ModelPart[] = [box("全干栏通柱石础与前梯共同落地的完整低石坪", -1, .06, -.8, 13.8, .12, 19.6), box("通柱梁格之上贯通前晒台侧廊和居室的完整架空竹木楼板", -1, 2.6, 1.5, 11, .2, 13, bamboo)], wood: ModelPart[] = [], feet: ModelPart[] = [], walls: ModelPart[] = [], roof: ModelPart[] = [];
  for (const x of [-6.3, -4.5, 0, 4.5]) for (const z of [-4.7, 0, 4, 8]) {
    const top = z < 0 ? 2.45 : x < -6 ? 4.95 : x === 0 && z === 4 ? 7.4 : x === 0 ? 5.6 : 5.4;
    feet.push(solidBox("每根通柱下真正独立落在公共石坪上的低石础", x, .16, z, .5, .08, .5, stone)); wood.push(tapered("从独立石础贯过楼板并实际接到相应承梁的完整通木柱", timber, [[x, .2, z], [x, top, z]], [.12, .105]));
  }
  for (const x of [-6.3, -4.5, 0, 4.5]) wood.push(meshBeam("所有柱列楼面处实际连续的完整纵向大承梁", [x, 2.45, -4.9], [x, 2.45, 8.1], .24, timber));
  for (const z of [-4.7, 0, 4, 8]) wood.push(meshBeam("与纵梁互相咬接而实际托住整片楼面的横承梁", [-6.5, 2.45, z], [4.5, 2.45, z], .24, timber));
  for (const z of [-4.7, 8]) for (const [a, b] of [[-6.3, -4.5], [-4.5, 0], [0, 4.5]]) wood.push(meshBeam("底部通柱之间真正斜接到承梁节点的横向稳定撑", [a!, .55, z], [b!, 2.4, z], .12, timber));
  for (const x of [-6.3, 4.5]) for (const z of [0, 4]) wood.push(meshBeam("底层长柱沿进深方向实际抵住梁格的斜撑", [x, .55, z], [x, 2.4, z + 4], .12, timber));
  const frontWindows: [number, number, number, number][] = [[-1, 1, 1.1, 1.05], [2.5, 1, 1.3, 1.05]], rearWindows: [number, number, number, number][] = [[-2.5, 1, 1.2, .85], [2.5, 1, 1.2, .85]];
  walls.push(periodWall("前客厅从大晒台真实进入且避开通柱的木门窗墙", bamboo, 9, 2.7, .08, [0, 2.7, 0], [[-3, 1.05, 2.2]], frontWindows), periodWall("后寝区向屋后真实开小窗的完整竹木板壁", bamboo, 9, 2.7, .08, [0, 2.7, 8], [], rearWindows), periodWall("侧长廊实际进入前客厅而在后寝区仅留窗的竹木隔壁", bamboo, 8, 2.7, .08, [-4.5, 2.7, 4], [[-2.5, 1, 2.2]], [[2, 1, 1.2, .85]], 90), periodWall("居室右侧真实保留通风小窗的完整竹木外壁", bamboo, 8, 2.7, .08, [4.5, 2.7, 4], [], [[-2, 1, 1.2, 1.05], [2, 1, 1.2, 1.05]], 90), periodWall("前客厅进入后寝区真正保留独立木门的分隔壁", bamboo, 9, 2.7, .08, [0, 2.7, 4], [[-2.3, .95, 2.1]])); wood.push(...lattice([0, 2.7, 0], frontWindows), ...lattice([0, 2.7, 8], rearWindows));
  for (const z of [0, 8]) { const cap = hardFloor("竹木端壁上真实与低髋屋面相合的完整顶端封板", bamboo, [[-4.5, 5.4], [4.5, 5.4], [4, 5.6], [-4, 5.6]], .08, [0, 0, z + .04]); cap.rotation.x = -90; walls.push(cap); }
  const front: Triple = [0, 7.56, 2], back: Triple = [0, 7.56, 6], leftFront: Triple = [-4.95, 5.36, -.45], rightFront: Triple = [4.95, 5.36, -.45], leftBack: Triple = [-4.95, 5.36, 8.45], rightBack: Triple = [4.95, 5.36, 8.45], hipX = 4.95 * 2 / 2.45, hipY = 7.56 - hipX * 2.2 / 4.95;
  roof.push(slopePanel("全干栏居屋前端完整下收的厚植物髋坡", [leftFront, rightFront, front], .16, roofColor), slopePanel("全干栏居屋后端完整下收的厚植物髋坡", [rightBack, leftBack, back], .16, roofColor), slopePanel("居屋右侧由低檐连续接入短长脊的完整厚坡", [rightFront, rightBack, back, front], .16, roofColor), slopePanel("居屋左侧主坡在接入侧廊处真实裁到板墙线的完整厚屋片", [[-4.5, 5.56, 0], [-hipX, hipY, 0], front, back, [-hipX, hipY, 8], [-4.5, 5.56, 8]], .16, roofColor), slopePanel("左主坡前端在廊盖以外保留的完整三角挑檐", [leftFront, [-4.95, 5.36, 0], [-hipX, hipY, 0]], .16, roofColor), slopePanel("左主坡后端在廊盖以外保留的完整三角挑檐", [leftBack, [-hipX, hipY, 8], [-4.95, 5.36, 8]], .16, roofColor), slopePanel("侧长廊低盖真正从独立柱圈接入已裁主坡的完整植物坡", [[-6.5, 5.05, 0], [-4.5, 5.56, 0], [-4.5, 5.56, 8], [-6.5, 5.05, 8]], .12, roofColor));
  for (const z of [0, 8]) { const flashing = hardFloor("主坡与侧廊折檐接缝两端真正封合的竖向屋片", roofColor, [[-4.95, 5.36], [-4.5, 5.56], [-4.95, 5.44525]], .05, [0, 0, z + .025]); flashing.rotation.x = -90; roof.push(flashing); }
  wood.push(meshBeam("居屋中央通柱实际接住的完整短长脊木", [0, 7.4, 2], [0, 7.4, 6], .2, timber), meshBeam("侧廊全部通柱顶端连续相接的完整低檐枋", [-6.3, 4.95, 0], [-6.3, 4.95, 8], .16, timber));
  for (const z of [0, 4, 8]) wood.push(meshBeam("客厅后寝分区各排通柱之间实际相接的横向承枋", [-4.5, 5.32, z], [4.5, 5.32, z], .16, timber));
  const usedPosts = new Set<string>(), addRailing = (start: [number, number], end: [number, number]) => {
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]), count = Math.ceil(length / 1.1);
    wood.push(meshBeam("晒台和侧廊外缘实际连续接到栏柱的完整木横栏", [start[0], 3.65, start[1]], [end[0], 3.65, end[1]], .06, timber), meshBeam("晒台和侧廊地面边缘实际连接的低挡脚竹枋", [start[0], 2.8, start[1]], [end[0], 2.8, end[1]], .14, timber));
    for (let i = 0; i <= count; i++) { const t = i / count, x = start[0] + (end[0] - start[0]) * t, z = start[1] + (end[1] - start[1]) * t, key = `${x.toFixed(3)},${z.toFixed(3)}`; if (usedPosts.has(key)) continue; usedPosts.add(key); wood.push(meshBeam("晒台侧廊每根真实落在高木楼板上的独立竖栏", [x, 2.7, z], [x, 3.7, z], .06, timber)); }
  };
  for (const [a, b] of [[[-6.45, -4.95], [-6.1, -4.95]], [[-4.9, -4.95], [4.45, -4.95]], [[-6.45, -4.95], [-6.45, 7.95]], [[4.45, -4.95], [4.45, 0]], [[-6.45, 7.95], [-4.5, 7.95]]] as [[number, number], [number, number]][]) addRailing(a, b);
  for (let i = 0; i < 15; i++) wood.push(solidBox("由地坪实际接进前晒台栏口的独立厚木梯踏板", -5.5, .2 + (i + 1) * 2.5 / 15 - .05, -9.2 + (i + .5) * .28, 1.1, .1, .28, timber));
  for (const x of [-6, -5]) {
    feet.push(solidBox("前登楼梯斜梁下真正落在公共石坪上的独立低石脚", x, .17, -9.2, .35, .1, .35, stone));
    wood.push(meshBeam("前登楼梯全部独立踏板下真正连续的斜木承梁", [x, .2, -9.2], [x, 2.62, -5], .14, timber), meshBeam("前登楼梯实际连到上下踏板木栏柱的斜扶手", [x, 1.216666667, -9.06], [x, 3.55, -5.14], .055, timber));
    for (const i of [0, 7, 14]) { const y = .2 + (i + 1) * 2.5 / 15, z = -9.2 + (i + .5) * .28; wood.push(meshBeam("登楼梯两边真正立在对应木踏板上的独立栏柱", [x, y, z], [x, y + .85, z], .055, timber)); }
    wood.push(meshBeam("登楼梯最高扶手实际接入前晒台栏口的短转接木档", [x, 3.55, -5.14], [x + (x < -5.5 ? -.1 : .1), 3.65, -4.95], .055, timber));
  }
  p.push(box("后寝区左侧避开私室门的完整落地木卧台", -1.8, 2.92, 6.4, 2, .44, 2.2, bamboo), box("后寝区右侧真实落在连续竹木楼面上的完整卧台", 2, 2.92, 6.4, 2, .44, 2.2, bamboo), ...packMeshes("整座全干栏住宅每根通柱下独立落地的真实石础", stone, feet), ...packMeshes("完整通柱双向楼梁斜撑窗格及晒台前梯的全部实际木构", timber, wood), ...packMeshes("前厅后寝和侧廊之间所有实际竹木门窗围壁", bamboo, walls), ...packMeshes("真实裁接主髋坡侧廊低盖与两端封边的完整植物屋壳", roofColor, roof));
  return p;
}
