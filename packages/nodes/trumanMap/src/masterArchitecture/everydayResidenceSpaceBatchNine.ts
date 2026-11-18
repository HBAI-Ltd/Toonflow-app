import type { ModelPart, Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { waistStair } from "./publicSpaceBatchFourteen";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";
import { box, design } from "./structures";

const stone = "#b3b7aa", timber = "#a18b6b", pale = "#d2cbbb", steel = "#6c8580", fabric = "#9ca99c";

function sideCourtBridgeHouse(): ModelPart[] {
  const leftHole: [number, number][] = [[-6.65, 1.5], [-3.65, 1.5], [-3.65, 5.2], [-6.65, 5.2]], rightHole: [number, number][] = [[6.3, -.5], [7.6, -.5], [7.6, 4.3], [6.3, 4.3]];
  const p: ModelPart[] = [box("双首层住宅与侧院所有坡台共同落地的完整基础", 1, .11, 0, 17.2, .22, 13.6, stone), box("低首层起居翼连续落地的完整木地面", -4, .26, 0, 6, .08, 12, timber), box("侧院低地面与低首层侧门平齐的完整院坪", 1, .26, 1.3, 4, .08, 9.6, stone), box("抬高首层右居翼下方真实承地的整块高台体", 6, .96, 2, 6, 1.48, 8, stone), box("抬高首层门前横台真实承地的完整高台体", 5.25, .96, -2.7, 7.5, 1.48, 1.4, stone), box("高首层餐厨翼实际落在高台上的完整木地面", 6, 1.75, 2, 6, .1, 8, timber), box("两趟侧院坡道上端真正接入高首层的完整前台面", 5.25, 1.75, -2.7, 7.5, .1, 1.4, stone), hardFloor("低首层翼上寝楼板为折返私梯真正开出的完整井口", timber, [[-7, -6], [-1, -6], [-1, 6], [-7, 6]], .2, [0, 4.2, 0], [leftHole]), hardFloor("高首层翼上寝楼板为连续私梯真正开出的完整井口", timber, [[3, -2], [9, -2], [9, 6], [3, 6]], .2, [0, 4.2, 0], [rightHole]), box("跨过整片侧院并真正接入两翼寝层的完整院桥板", 1, 4.3, 3, 4.2, .2, 2.5, timber), box("低首层居翼完整闭合的平屋盖", -4, 7.5, 0, 6.6, .2, 12.6, steel), box("高首层居翼完整闭合的平屋盖", 6, 7.5, 2, 6.6, .2, 8.6, steel), box("完整封合两端院桥门廊的平屋盖", 1, 7.5, 3, 4.6, .2, 2.8, steel), box("低首层前门外真正接地的入户踏台", -2.3, .15, -6.35, 1.8, .3, 1.1, stone), box("侧院两趟坡道后端真正接地的完整转弯平台", 1, .575, 5.45, 3.6, .75, 1.3, stone)];
  const ramp = (name: string, x: number, from: number, to: number, low: number, high: number): ModelPart => {
    const value = hardFloor(name, stone, [[from, .2], [to, .2], [to, high], [from, low]], 1.3, [0, 0, 0]); value.vertices = value.vertices!.map(v => ({ x: x + v.y, y: v.z, z: v.x })); return value;
  };
  p.push(ramp("侧院西趟由低首层地面升到后平台的实承缓坡", -.8, -2, 4.8, .3, .95), ramp("侧院东趟从后平台折返升到高首层的实承缓坡", 1.5, 4.8, -2, .95, 1.8));
  p.push(
    ...glazedWall("低首层前立面真正入户并为高起居厅采光的完整墙", [-7, -6], [-1, -6], .3, 4.2, [[-1.2, 1.1, 2.7, 2.6]], [[1.7, .3, 1.1, 2.2]]),
    ...glazedWall("左上独立寝室朝前直接采光的完整前壁", [-7, -6], [-1, -6], 4.4, 7.4, [[0, 5.25, 3.5, 1.7]]),
    ...glazedWall("低首层外侧高厅与上寝各自真实透光的完整长壁", [-7, 6], [-7, -6], .3, 7.4, [[3, 1.1, 3, 2.6], [-3.5, 2.5, 2.2, 1.2], [3, 5.25, 3, 1.7], [-3.5, 5.25, 2.2, 1.7]]),
    ...glazedWall("低首层面对侧院的实际侧门及前厅卫浴采光壁", [-1, -6], [-1, 6], .3, 4.2, [[-4.1, 1.1, 1.4, 2.6], [4.5, 2.8, 1, .75]], [[-2.6, .3, 1.1, 2.2]]),
    ...glazedWall("左上寝层面对侧院并真正接入院桥的门窗墙", [-1, -6], [-1, 6], 4.4, 7.4, [[-3, 5.25, 3, 1.7]], [[3, 4.4, 1.2, 2.15]]),
    ...glazedWall("左居翼完整封住私梯厅与低卫浴的后壁", [-1, 6], [-7, 6], .3, 7.4, [[1.3, 2.8, 1.2, .75], [-1.3, 5.25, 2.4, 1.7]]),
    ...glazedWall("高首层正对抬高前台面的真实入户门窗", [3, -2], [9, -2], 1.8, 4.2, [[1.65, 2.65, 1.4, 1.2]], [[-.8, 1.8, 1.1, 2.1]]),
    ...glazedWall("右上独立寝室与私梯侧室分别透光的前壁", [3, -2], [9, -2], 4.4, 7.4, [[-1.5, 5.25, 1.8, 1.7], [1, 5.25, 1.4, 1.7]]),
    ...glazedWall("高首层餐厨与上层寝卫各自透光的东外壁", [9, -2], [9, 6], 1.8, 7.4, [[-2, 2.65, 1.8, 1.2], [2.2, 2.65, 2, 1.2], [-1.5, 5.25, 2.5, 1.7], [2.5, 5.25, 1.4, 1.7]]),
    ...glazedWall("高首层沿侧院完整收边并保留餐厅采光的西外壁", [3, 6], [3, -2], 1.8, 4.2, [[1, 2.65, 3, 1.2]]),
    ...glazedWall("右上寝层沿侧院真正接入院桥的完整门窗壁", [3, 6], [3, -2], 4.4, 7.4, [[2.5, 5.25, 1.8, 1.7]], [[-1, 4.4, 1.2, 2.15]]),
    ...glazedWall("右居翼后餐区和上卫浴厅各自采光的完整后壁", [9, 6], [3, 6], 1.8, 7.4, [[0, 2.65, 3.5, 1.2], [1.8, 6.1, 1, .8], [-1, 5.25, 1.8, 1.7]]),
    ...glazedWall("院桥面向前侧院真正透光的完整轻墙", [-1.1, 2], [3.1, 2], 4.4, 7.4, [[0, 5.25, 3.2, 1.7]]),
    ...glazedWall("院桥面向后侧院真正透光的完整轻墙", [3.1, 4], [-1.1, 4], 4.4, 7.4, [[0, 5.25, 3.2, 1.7]]),
    ...glazedWall("左上独立卧室通往私梯厅的真实内门", [-7, 0], [-1, 0], 4.4, 7.4, [], [[1.5, 4.4, .9, 2.1]]),
    ...glazedWall("低首层后侧卫浴朝前厅打开的真实内门", [-3.5, 3.2], [-1, 3.2], .3, 4.2, [], [[-.5, .3, .8, 2.1]]),
    ...glazedWall("低首层后侧卫浴与左私梯区之间的完整隔墙", [-3.5, 3.2], [-3.5, 6], .3, 4.2, []),
    ...glazedWall("右上寝室从院桥私厅独立进入的真实内门", [3, 1.5], [6, 1.5], 4.4, 7.4, [], [[0, 4.4, .85, 2.1]]),
    ...glazedWall("右上寝室避开私梯井的完整侧隔墙", [6, -2], [6, 1.5], 4.4, 7.4, []),
    ...glazedWall("右上卫浴面向院桥私厅的真实独立门", [3, 4], [5, 4], 4.4, 7.4, [], [[-.4, 4.4, .75, 2.1]]),
    ...glazedWall("右上卫浴侧面保留到私梯井通路的完整隔墙", [5, 4], [5, 6], 4.4, 7.4, []),
  );
  p.push(waistStair("低首层私梯由后起居厅进入中换台的十二级实阶", -5.9, .3, .5, 1.2, 12, 4.1 / 24, .28), waistStair("低首层私梯换向后穿井到达上寝层的十二级实阶", -4.4, 2.35, 4.86, 1.2, 12, 4.1 / 24, .28, true), box("左翼私梯两跑之间完整实接的换向平台", -5.15, 2.25, 4.36, 3, .2, 1), waistStair("高首层沿东侧真实穿井进入上寝层的十六级实阶", 6.95, 1.8, -.5, 1.2, 16, 2.6 / 16, .3));
  const frames: ModelPart[] = [];
  for (const x of [-6.4, -3.9]) frames.push(meshBeam("左私梯换台下端真正落在低首层木地面的承柱", [x, .3, 4.36], [x, 2.15, 4.36], .2, steel));
  for (const z of [2, 4]) frames.push(meshBeam("院桥底部两端实际接入两翼楼板承壁的连续主梁", [-1.12, 4.05, z], [3.12, 4.05, z], .3, steel));
  p.push(combineMeshes("两翼私梯换台与院桥全部真实承托的梁柱体系", steel, frames));
  const guards: ModelPart[] = [], guard = (name: string, a: Triple, b: Triple, footA: number, footB = footA) => { guards.push(meshBeam(name, a, b, .05, steel)); const count = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[2] - a[2]) / 2)); for (let i = 0; i <= count; i++) { const t = i / count, x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t; guards.push(meshBeam("坡道平台和梯井护栏底端真实接入脚下承台的竖柱", [x, footA + (footB - footA) * t, z], [x, a[1] + (b[1] - a[1]) * t, z], .05, steel)); } };
  for (const x of [-.74, .44]) guard("侧院西趟实体坡道随坡升高的完整护栏", [x, 1.3, -2], [x, 1.95, 4.8], .3, .95);
  for (const x of [1.56, 2.74]) guard("侧院东趟实体坡道随坡升高的完整护栏", [x, 1.95, 4.8], [x, 2.8, -2], .95, 1.8);
  guard("两趟坡道转弯台后缘真正封边的护栏", [-.74, 1.95, 6.05], [2.74, 1.95, 6.05], .95); for (const x of [-.74, 2.74]) guard("两趟坡道转弯台左右端真正封边的短护栏", [x, 1.95, 4.8], [x, 1.95, 6.05], .95); guard("转弯台前缘只为两条实体坡道留口的护栏", [.5, 1.95, 4.84], [1.5, 1.95, 4.84], .95);
  guard("高首层前平台外沿完整相接的护栏", [1.56, 2.8, -3.35], [8.94, 2.8, -3.35], 1.8); for (const x of [1.56, 8.94]) guard("高首层前平台侧缘保留真实入户通路的护栏", [x, 2.8, -3.35], [x, 2.8, -2], 1.8);
  for (const [a, b] of [[[-6.69, 1.46], [-6.69, 5.24]], [[-6.69, 5.24], [-3.61, 5.24]], [[-3.61, 5.24], [-3.61, 1.46]], [[-6.69, 1.46], [-5, 1.46]], [[-3.8, 1.46], [-3.61, 1.46]], [[6.26, -.54], [7.64, -.54]], [[6.26, -.54], [6.26, 4.3]], [[7.64, -.54], [7.64, 4.3]]] as [[number, number], [number, number]][]) guard("上寝层护栏围住私梯真井并保留实际到达口", [a[0], 5.4, a[1]], [b[0], 5.4, b[1]], 4.4);
  for (const [x, z, base, count, rise, run, reverse] of [[-5.9, .5, .3, 12, 4.1 / 24, .28, false], [-4.4, 4.86, 2.35, 12, 4.1 / 24, .28, true], [6.95, -.5, 1.8, 16, 2.6 / 16, .3, false]] as [number, number, number, number, number, number, boolean][]) for (const side of [-1, 1]) {
    const direction = reverse ? -1 : 1, px = x + side * .55, start = z + direction * run / 2, end = z + direction * run * (count - .5), low = base + rise, high = base + count * rise;
    guards.push(meshBeam("双首层私梯沿完整阶程抬升的连续扶手", [px, low + .9, start], [px, high + .9, end], .05, steel), meshBeam("私梯扶手低端实落首级踏面的短柱", [px, low, start], [px, low + .9, start], .05, steel), meshBeam("私梯扶手高端实落末级踏面的短柱", [px, high, end], [px, high + .9, end], .05, steel));
  }
  guard("左私梯换向平台后缘实接台面的完整护栏", [-6.6, 3.35, 4.81], [-3.7, 3.35, 4.81], 2.35);
  for (const x of [-6.6, -3.7]) guard("左私梯换向平台侧面保留两跑梯口的短护栏", [x, 3.35, 3.9], [x, 3.35, 4.81], 2.35);
  for (let first = 0; first < guards.length; first += 16) p.push(combineMeshes("侧院坡台双首层入口与上寝私梯全部实际接板的栏架", steel, guards.slice(first, first + 16)));
  const furniture: Record<string, ModelPart[]> = { [timber]: [], [pale]: [], [fabric]: [], [stone]: [] }, furnish = (name: string, color: string, x: number, y: number, z: number, w: number, h: number, d: number) => furniture[color]!.push(solidBox(name, x, y, z, w, h, d, color));
  for (const [x, z] of [[-4.4, -3], [4.5, -.3]]) { furnish("两居翼上层独立寝室内真实落地的完整床架", timber, x!, 4.6, z!, 1.6, .4, 2.1); furnish("独立床架上贴合的完整织物床垫", pale, x!, 4.86, z!, 1.56, .12, 2.06); furnish("床架后端真正落在寝室楼板上的床头板", timber, x!, 5.02, z! + 1.05, 1.65, 1.24, .12); }
  for (const [x, y, z] of [[-4.2, .3, -3.2], [4.7, 1.8, 4.8]]) { furnish("双首层起居区各自真正落地的长沙发座", fabric, x!, y! + .22, z!, 2.8, .44, 1.1); furnish("长沙发后沿与坐面真实相接的软靠背", fabric, x!, y! + .64, z! + .47, 2.8, .9, .16); furnish("起居低茶几真正落地的完整宽脚", timber, x!, y! + .18, z! - 1.45, 1.3, .36, .75); furnish("低茶几宽脚上贴合的薄桌面", stone, x!, y! + .39, z! - 1.45, 1.5, .06, .9); }
  furnish("高首层东墙前真正落地的厨房长地柜", timber, 8.55, 2.22, 4.2, .65, .84, 2.8); furnish("厨房长地柜上真实贴合的完整台面", stone, 8.55, 2.68, 4.2, .7, .08, 2.85); furnish("高首层入口餐区自地面承起的完整桌脚", timber, 4.6, 2.17, .4, .5, .74, .7); furnish("入口餐桌宽脚上真实贴合的完整桌面", stone, 4.6, 2.58, .4, 1.8, .08, 1.1); furnish("左上寝室前隔墙前避开门窗的完整衣柜", pale, -5.2, 5.5, -.6, 2.4, 2.2, .6);
  for (const [y, sx, sz, tx, tz, bx, bz] of [[.3, -1.8, 5.2, -2.95, 4.6, -1.7, 3.8], [4.4, 4.35, 5.25, 3.4, 5.2, 4.35, 4.4]]) { furnish("上下独用卫浴内真正落地的淋浴托盘", pale, sx!, y! + .05, sz!, y! < 1 ? 1 : .9, .1, 1); furnish("独用卫浴侧边实际接地的坐便支座", pale, tx!, y! + .2, tz!, .42, .4, .5); furnish("坐便支座上贴合的完整坐便座体", pale, tx!, y! + .44, tz!, .55, .12, .7); furnish("坐便器后沿真实接合的完整小水箱", pale, tx!, y! + .73, tz! + .3, .52, .7, .18); furnish("独用卫浴近门处真正落地的洗手台柜", timber, bx!, y! + .42, bz!, .5, .84, .5); furnish("洗手台柜上真实贴合的浅盆台", pale, bx!, y! + .9, bz!, .55, .12, .55); }
  for (const [color, pieces] of Object.entries(furniture)) for (let first = 0; first < pieces.length; first += 16) p.push(combineMeshes("双首层寝厅厨卫内各自真实接地的完整固定家具", color, pieces.slice(first, first + 16)));
  return p;
}

export const everydayResidenceSpaceBatchNineDesigns = [
  design("侧院双首层桥接住宅", "低首层起居翼与抬高首层餐厨翼围住可穿行侧院，两趟实承缓坡连接两处真实入户地坪，各翼私梯分别接到同标高上寝层并由完整梁承院桥互通，桥下保留坡道净空，真实门窗、私梯井和坡台栏架组成完整住宅", sideCourtBridgeHouse, "建筑", "现代"),
];
