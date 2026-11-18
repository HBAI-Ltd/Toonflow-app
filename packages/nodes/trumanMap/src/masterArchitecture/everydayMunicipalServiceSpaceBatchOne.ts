import { part } from "../assetModelParts";
import type { ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design } from "./structures";
import type { ArchitecturePrototype } from "./structures";
import { glazedWall } from "./modernResidenceSpaceBatchOne";

const concrete = "#aaafa6";
const paving = "#b6ad97";
const wall = "#c6c5b5";
const roof = "#778c87";
const timber = "#a18b6b";
const dark = "#596c6d";

function fanFireStation(): ModelPart[] {
  const ray = (degrees: number, radius: number): [number, number] => [Math.sin(degrees * Math.PI / 180) * radius, 8 - Math.cos(degrees * Math.PI / 180) * radius];
  const angles = [-42, -14, 14, 42], outer = angles.map(angle => ray(angle, 22.5)), inner = angles.map(angle => ray(angle, 7.5)), edge = inner[3]![0];
  const outline: [number, number][] = [...outer, inner[3]!, [edge, 4], [14, 4], [14, 13], [-14, 13], [-14, 4], [-edge, 4], inner[0]!];
  const corridor: [number, number][] = [[inner[0]![0] - .28, inner[0]![1] - .12], inner[1]!, inner[2]!, [inner[3]![0] + .28, inner[3]![1] - .12], [edge + .28, 4.18], [-edge - .28, 4.18]];
  const p: ModelPart[] = [
    box("车厅后脊生活翼与出动车坪共同落地的完整基础", 0, .1, -1.5, 42, .2, 37, concrete),
    polygon("扇形车厅经后缓冲横廊连续接入生活翼的完整地面", paving, outline, .017, [0, .188, 0]),
    polygon("三条出动车厅后方连续净污缓冲通廊的低屋盖", roof, corridor, .22, [0, 3.78, 0]),
    box("后脊左侧公众接待及装备房的完整低屋盖", -9, 3.89, 8.5, 10.5, .22, 9.5, roof),
    box("后脊右侧生活值班房的完整低屋盖", 9, 3.89, 8.5, 10.5, .22, 9.5, roof),
    box("中央观察调度高厅实际由四壁承托的高屋盖", 0, 5.9, 8.5, 8.48, .24, 9.48, roof),
    part("前场消防车辆从场外接入同高出动坪的完整缓坡", "extrude", paving, [0, 0, -21], [1, 1, 1], [0, 90, 0], { depth: 34, profile: [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: -1, y: .2 }] }),
    part("后侧独立人行入口接到室外地面的低缓坡", "extrude", paving, [-11.5, 0, 17.6], [1, 1, 1], [0, -90, 0], { depth: 2.4, profile: [{ x: -.6, y: 0 }, { x: .6, y: 0 }, { x: -.6, y: .2 }] }),
  ];
  for (let bay = 0; bay < 3; bay++) {
    const a = angles[bay]!, b = angles[bay + 1]!, frontA = outer[bay]!, frontB = outer[bay + 1]!, rearA = inner[bay]!, rearB = inner[bay + 1]!;
    p.push(...glazedWall("扇开车厅朝前场真实敞通的高宽出动车口", frontA, frontB, .2, 5.8, [], [[0, .2, 5, 4.4]]));
    p.push(...glazedWall("各车厅真正通向后缓冲廊的独立人行门与观察孔", rearA, rearB, .2, 5.8, bay === 1 ? [[-.65, 1.25, 1.5, 1.6]] : [], [[bay === 1 ? 1 : 0, .2, bay === 1 ? .9 : 1.3, 2.4]]));
    p.push(polygon("每个扇开车辆厅由径墙和门楣共同承托的独立屋板", roof, [ray(bay === 0 ? a - 2 : a, 7), ray(bay === 0 ? a - 2 : a, 23), ray(bay === 2 ? b + 2 : b, 23), ray(bay === 2 ? b + 2 : b, 7)], .24, [0, 5.78, 0]));
  }
  for (let edgeIndex = 0; edgeIndex < 4; edgeIndex++) p.push(...glazedWall("从后缓冲廊径向延伸到车口的完整承屋分隔墙", inner[edgeIndex]!, outer[edgeIndex]!, .2, 5.8, []));
  p.push(
    ...glazedWall("缓冲通廊西侧实际闭合的完整短围护", inner[0]!, [-edge, 4], .2, 3.8, []),
    ...glazedWall("缓冲通廊东侧实际闭合的完整短围护", inner[3]!, [edge, 4], .2, 3.8, []),
    ...glazedWall("左生活翼前侧正对车厅缓冲廊的连续实墙", [-14, 4], [-edge, 4], .2, 3.8, [[0, 1.1, 4.5, 1.6]]),
    ...glazedWall("右生活翼前侧正对车厅缓冲廊的连续实墙", [edge, 4], [14, 4], .2, 3.8, [[0, 1.1, 4.5, 1.6]]),
    ...glazedWall("后脊西端完整采光外墙", [-14, 4], [-14, 13], .2, 3.8, [[0, 1.1, 4.8, 1.6]]),
    ...glazedWall("后脊东端完整采光外墙", [14, 4], [14, 13], .2, 3.8, [[0, 1.1, 4.8, 1.6]]),
    ...glazedWall("公众后入口独立进入接待房而不经过车辆道的后立面", [-14, 13], [-4, 13], .2, 3.8, [[2.5, 1.1, 2.5, 1.6]], [[-2.5, .2, 1.6, 2.4]]),
    ...glazedWall("生活值班房独立后出入口及采光窗的完整后立面", [4, 13], [14, 13], .2, 3.8, [[-2.5, 1.1, 2.5, 1.6]], [[2.5, .2, 1.6, 2.4]]),
    ...glazedWall("调度高厅经缓冲横廊观察中央车厅并真正开门的前壁", [-4, 4], [4, 4], .2, 5.8, [[-1.7, 1.15, 2.3, 1.8]], [[2.2, .2, 1.2, 2.4]]),
    ...glazedWall("中央调度高厅后侧独立人员门及高位采光的完整外墙", [-4, 13], [4, 13], .2, 5.8, [[-2.5, 3.8, 1.5, 1.15], [2.5, 3.8, 1.5, 1.15]], [[0, .2, 1.8, 2.4]]),
  );
  for (const side of [-1, 1]) {
    p.push(...glazedWall("调度高厅连向两翼人行横廊的真实侧门及高侧窗", [side * 4, 4], [side * 4, 13], .2, 5.8, [[0, 4.2, 5.5, 1]], [[-3.1, .2, 1.3, 2.4]]));
    const left = side < 0 ? -14 : 4, right = side < 0 ? -4 : 14;
    p.push(...glazedWall("后脊每个独立生活工作房面向人行横廊的真实内门", [left, 6.3], [right, 6.3], .2, 3.8, [], [[-2.5, .2, 1.1, 2.4], [2.5, .2, 1.1, 2.4]]), box("两间后脊生活房之间接地承屋的完整隔墙", side * 9, 2, 9.65, .2, 3.6, 6.7, wall));
  }
  p.push(
    box("调度工作台真正落到高厅地面的完整支座", 0, .525, 8, 1.1, .65, 1.2, dark),
    box("调度工作台上与支座相接的完整台面", 0, .9, 8, 3.2, .1, 1.4, timber),
    box("后公众接待房内避开出入口的落地服务台", -12.6, .7, 8.3, .8, 1, 2.4, timber),
    box("接待等候长座真实落地的低支座", -10.2, .375, 9.5, .45, .35, 2.2, dark),
    box("低支座上直接承住的完整等候长座面", -10.2, .6, 9.5, .7, .1, 2.4, timber),
    box("车厅后装备房实际落地的深储物柜", -6.5, 1.2, 11.9, 3.2, 2, .8, timber),
    box("值班生活房避开房门的完整低床架", 6.5, .375, 10, 2, .35, 3.2, timber),
    box("值班生活房与床架贴合的完整休息床面", 6.5, .625, 10, 2, .15, 3.2, "#aab7a3"),
    box("后勤备餐房沿侧墙真正落地且避开后门的工作地柜", 13.4, .65, 9.6, .8, .9, 3.4, timber),
    box("备餐工作地柜顶面直接贴合的完整操作台", 13.4, 1.14, 9.6, .85, .08, 3.5, concrete),
  );
  return p;
}

export const everydayMunicipalServiceSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("扇形车厅后脊消防站", "三条向外扇开的宽车辆厅以各自真实高车口直出前场，连续后缓冲横廊接入完整生活值班后脊，较高观察调度厅从两翼内门组织人行联系，公众与人员从后侧独立入口进入", fanFireStation, "建筑", "现代"),
];
