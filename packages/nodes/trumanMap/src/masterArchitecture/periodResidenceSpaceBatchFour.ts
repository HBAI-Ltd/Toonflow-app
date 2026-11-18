import { part, type ModelPart, type Triple } from "../assetModelParts";
import { tapered } from "../masterNature/shared";
import { box, design } from "./structures";
import { barrelRoof } from "./spatialShells";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";
import { packMeshes } from "./vernacularWorldBatchThirteen";
import { lattice, periodWall } from "./periodResidenceSpaceBatchOne";

const stone = "#aaa18b", earth = "#ad9875", timber = "#8c7250", pale = "#bcad8d";

// https://www.ihchina.cn/project_details/14686/
// https://pubs.cstam.org.cn/article/id/63e332f4ca140b1d2d756a89
// 独立平地砖石砌券类型；米制尺度、顶点、门窗构造和屋台交通均为原创。
export const periodResidenceSpaceBatchFourDesigns = [
  design("平顶晒台三券石箍窑宅", "人工砌起的窑腿和三道完整筒券围成地上空居室，拱肩封填与覆土层托住可登晒台，前窑脸中的木拱窗和中心实门分别贯通，侧外石阶经平台进入护墙真实缺口，后窗为各室采光", freestandingStoneYaodong, "建筑", "中式"),
];

function freestandingStoneYaodong(): ModelPart[] {
  const p: ModelPart[] = [box("独立石箍窑宅前坪底屋及外登阶共用的完整石基", .4, .1, 0, 16, .2, 13), box("三券和拱肩封填上方真实连续的平顶覆土晒台", 0, 4.3, 0, 12.6, .2, 8)], walls: ModelPart[] = [], wood: ModelPart[] = [], steps: ModelPart[] = [];
  for (const x of [-4.2, 0, 4.2]) {
    for (const side of [-1, 1]) walls.push(solidBox("三连券各自实际从地坪砌到起拱线的厚窑腿", x + side * 1.95, .95, 0, .3, 1.5, 8, stone));
    p.push(barrelRoof("实际压在两侧窑腿之上的完整厚石筒券", 1.8, .3, 8, [x, 1.7, 0], stone));
    const fill = [{ x: -2.1, y: 1.7 }, { x: -2.1, y: 4.2 }, { x: 2.1, y: 4.2 }, { x: 2.1, y: 1.7 }, ...Array.from({ length: 11 }, (_, i) => { const a = (i + 1) * Math.PI / 12; return { x: Math.cos(a) * 2.1, y: 1.7 + Math.sin(a) * 2.1 }; })];
    p.push(part("石券外弧之上真实封填到平晒台底的实土拱肩", "extrude", earth, [x, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 8, profile: fill }));
    const opening: [number, number][] = [[-2.1, 0], [-2.1, 4], [2.1, 4], [2.1, 0], [1.5, 0], [1.5, 1.5], ...Array.from({ length: 12 }, (_, i) => { const a = (i + 1) * Math.PI / 12; return [Math.cos(a) * 1.5, 1.5 + Math.sin(a) * 1.5] as [number, number]; }), [-1.5, 0]], face = hardFloor("退在外券之内且真正留出木拱门窗大口的完整石窑脸", stone, opening, .22, [x, .2, -3.69]); face.rotation.x = -90; walls.push(face);
    const rearWindows: [number, number, number, number][] = [[0, 1.1, 1.1, 1.2]];
    walls.push(periodWall("每个独立拱室后部真正封合且有贯通小窗的完整石壁", stone, 4.2, 4, .24, [x, .2, 3.88], [], rearWindows)); wood.push(...lattice([x, .2, 3.88], rearWindows));
    const archAt = (offset: number): number => 1.7 + Math.sqrt(Math.max(0, 2.25 - offset ** 2));
    for (const side of [-1, 1]) {
      walls.push(solidBox("窑脸中心门两侧真实落地的低窗槛石墙", x + side * 1.01, .475, -3.8, .98, .55, .18, stone));
      wood.push(meshBeam("中心门与两侧拱窗之间完整接到顶拱的高木门梃", [x + side * .52, .2, -3.8], [x + side * .52, archAt(.52), -3.8], .085, timber), meshBeam("大拱口外侧真实从地坪接到起拱线的木窗框", [x + side * 1.5, .2, -3.8], [x + side * 1.5, 1.7, -3.8], .075, timber), meshBeam("旁窗低石槛之上实际横接门梃和外框的木窗台", [x + side * .52, .75, -3.8], [x + side * 1.5, .75, -3.8], .065, timber), meshBeam("两旁拱窗真正连接所有竖栅的中横木档", [x + side * .52, 1.5, -3.8], [x + side * 1.5, 1.5, -3.8], .045, timber));
      for (const offset of [.85, 1.18]) wood.push(meshBeam("旁拱窗中真正止在弧顶木框处的独立竖栅", [x + side * offset, .75, -3.8], [x + side * offset, archAt(offset), -3.8], .04, timber));
    }
    const path: Triple[] = Array.from({ length: 13 }, (_, i) => { const a = i * Math.PI / 12; return [x + Math.cos(a) * 1.5, 1.7 + Math.sin(a) * 1.5, -3.8]; }); wood.push(tapered("窑脸大拱口内实际首尾接到竖框的连续木弧框", timber, path, Array(13).fill(.035)), meshBeam("中心实门口上方真正接在两根门梃上的木门楣", [x - .52, 2.3, -3.8], [x + .52, 2.3, -3.8], .085, timber));
    for (const offset of [-.26, 0, .26]) wood.push(meshBeam("中心门头上方扇形高窗真实止于弧框的木细栅", [x + offset, 2.3, -3.8], [x + offset, archAt(offset), -3.8], .04, timber));
  }
  walls.push(solidBox("平顶晒台西边真实接在覆土屋台上的完整低石护墙", -6.2, 4.75, 0, .2, .7, 8, stone), solidBox("平顶晒台前边真实连续封护高台边缘的低石墙", 0, 4.75, -3.9, 12.6, .7, .2, stone), solidBox("平顶晒台后边真实连续封护高台边缘的低石墙", 0, 4.75, 3.9, 12.6, .7, .2, stone), solidBox("东侧晒台低石墙在外阶入台处真正留出的长侧段", 6.2, 4.75, -.5, .2, .7, 7, stone));
  for (let i = 0; i < 20; i++) { const height = (i + 1) * .2; steps.push(solidBox("外侧从共同石坪逐级升至平顶晒台的完整实体石阶", 7.1, .2 + height / 2, -4 + (i + .5) * .35, 1.1, height, .35, stone)); }
  p.push(box("外登阶最高一级与晒台护墙缺口之间真实相接的平台", 6.95, 4.3, 3.5, 1.5, .2, 1, stone));
  wood.push(meshBeam("外石阶临外缘实际由低到高接续的完整木扶手", [7.62, 1.25, -3.825], [7.62, 5.25, 3.175], .055, timber), meshBeam("外阶高平台外边实际接续斜扶手的平木横栏", [7.62, 5.25, 3.175], [7.62, 5.25, 3.9], .055, timber), meshBeam("外阶高平台后缘真正接向晒台护墙的木横栏", [6.35, 5.25, 3.9], [7.62, 5.25, 3.9], .055, timber));
  for (const i of [0, 5, 10, 15, 20]) { const y = .2 + (i + 1) * .2, z = -4 + (i + .5) * .35; wood.push(meshBeam("外阶扶手实际落在对应石踏面的独立木栏柱", [7.62, y, z], [7.62, y + .85, z], .055, timber)); }
  for (const x of [6.35, 7.62]) wood.push(meshBeam("外阶高平台后缘扶栏真正落到平台面的竖木柱", [x, 4.4, 3.9], [x, 5.25, 3.9], .055, timber));
  p.push(box("左拱室后部真正落在石地坪上的完整石卧台", -4.2, .45, 2.3, 2.6, .5, 2.1, pale), box("右拱室避开门口的完整低石工作台", 5.1, .6, 1.8, 1.1, .8, 1.8, stone), box("中拱室侧边真正自地面承托的完整木桌台", -.95, .65, 1.6, 1.1, .9, 1.2, timber), ...packMeshes("三券石箍窑宅所有承拱窑腿真门窗石脸及平台护墙", stone, walls), ...packMeshes("每道石券前窑脸的完整木拱框门梃与真实窗栅", timber, wood), ...packMeshes("完整接上平顶晒台的所有独立实石踏阶", stone, steps));
  return p;
}
