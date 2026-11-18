import type { ModelPart, Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { waistStair } from "./publicSpaceBatchFourteen";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";
import { box, design } from "./structures";

const stone = "#b2b6a7", timber = "#a08a69", pale = "#d3caba", roof = "#6b827e", fabric = "#9aa99c";

function internalStairApartment(): ModelPart[] {
  const floor: [number, number][] = [[-8, -6], [8, -6], [8, 6], [-8, 6]], hole: [number, number][] = [[-1.5, -1.6], [1.5, -1.6], [1.5, 1.4], [-1.5, 1.4]];
  const p: ModelPart[] = [box("对门公寓及中央门厅共同落地的完整厚基础", 0, .11, 0, 16.8, .22, 12.8, stone), hardFloor("中央门厅与两户完整生活空间相连的首层木地面", timber, floor, .08, [0, .22, 0]), hardFloor("中央折返共梯真实开井的整片上层住宅楼板", timber, floor, .2, [0, 3.1, 0], [hole]), box("门厅与两侧住宅完整共同封合的平屋盖", 0, 6.2, 0, 16.8, .2, 12.8, roof), box("中央入户门外与低门厅地面相接的完整踏台", 0, .15, -6.35, 2, .3, 1.1, stone)];
  const furniture: Record<string, ModelPart[]> = { [timber]: [], [pale]: [], [stone]: [], [fabric]: [] }, guards: ModelPart[] = [];
  const furnish = (name: string, color: string, x: number, y: number, z: number, w: number, h: number, d: number) => furniture[color]!.push(solidBox(name, x, y, z, w, h, d, color));
  for (const side of [-1, 1]) p.push(...glazedWall("中央公共门厅通往每层独立住宅的分户实门承壁", [side * 2, -6], [side * 2, 6], .3, 6.1, [], [[-3.5, .3, 1, 2.15], [-3.5, 3.3, 1, 2.15]]));
  for (const y of [.3, 3.3]) {
    p.push(...glazedWall("前立面两户采光与中央公共入口或窗的完整实墙", [-8, -6], [8, -6], y, y + 2.8, y < 1 ? [[-5, y + .85, 3.5, 1.6], [5, y + .85, 3.5, 1.6]] : [[-5, y + .85, 3.5, 1.6], [5, y + .85, 3.5, 1.6], [0, y + .85, 2.6, 1.6]], y < 1 ? [[0, y, 1.4, 2.2]] : []), ...glazedWall("后卧室独用卫浴与公共后厅各自采光的后实墙", [8, 6], [-8, 6], y, y + 2.8, [[6.2, y + .85, 2.4, 1.6], [3.2, y + 1.7, 1.1, .75], [0, y + .85, 2.4, 1.6], [-3.2, y + 1.7, 1.1, .75], [-6.2, y + .85, 2.4, 1.6]]));
    for (const side of [-1, 1]) {
      p.push(...glazedWall("两侧住宅前起居与后卧各自透光的完整端墙", side < 0 ? [-8, 6] : [8, -6], side < 0 ? [-8, -6] : [8, 6], y, y + 2.8, [[-3, y + .85, 2.6, 1.6], [3, y + .85, 2.6, 1.6]]));
      const from = side < 0 ? -8 : 2, to = side < 0 ? -2 : 8, bedX = side * 6.2, serviceX = side * 3.2;
      p.push(...glazedWall("各户前起居厅分别通往卧室与后厨的真实内门", [from, 0], [to, 0], y, y + 2.8, [], [[bedX - (from + to) / 2, y, .85, 2.1], [serviceX - (from + to) / 2, y, .85, 2.1]]), ...glazedWall("各户外侧卧室与内侧厨卫之间的完整纵隔墙", [side * 4.4, 0], [side * 4.4, 6], y, y + 2.8, []), ...glazedWall("各户后厨进入独用卫浴的真实门及横隔墙", side < 0 ? [-4.4, 3] : [2, 3], side < 0 ? [-2, 3] : [4.4, 3], y, y + 2.8, [], [[0, y, .8, 2.1]]));
      furnish("每户外侧卧室内实际落地的独立床架", timber, bedX, y + .2, 3.3, 1.6, .4, 2.1); furnish("独立床架上贴合的完整织物床垫", pale, bedX, y + .46, 3.3, 1.56, .12, 2.06); furnish("床架后端实际落地的完整床头板", timber, bedX, y + .62, 4.35, 1.65, 1.24, .12);
      furnish("每户前起居厅真正接地的长沙发座", fabric, side * 6.7, y + .22, -3, 1.1, .44, 2.4); furnish("长沙发后沿与坐面实际相接的软靠背", fabric, side * 7.18, y + .64, -3, .16, .9, 2.4); furnish("前起居厅餐桌落到木楼面上的完整宽脚", timber, side * 4.5, y + .37, -1.7, .5, .74, .6); furnish("餐桌宽脚上贴合的完整桌面", stone, side * 4.5, y + .78, -1.7, 1.5, .08, .9);
      furnish("每户后厨沿内侧分户墙落地的长地柜", timber, side * 2.55, y + .42, 1.4, .65, .84, 2.3); furnish("后厨长地柜上完整贴合的操作台", stone, side * 2.55, y + .88, 1.4, .7, .08, 2.35); furnish("各户厨房远离门洞的完整冰箱", pale, side * 3.85, y + .93, 1.9, .6, 1.86, .65);
      furnish("独用卫浴后外角实际接地的坐便支座", pale, side * 3.8, y + .2, 5.2, .42, .4, .5); furnish("坐便支座上贴合的完整坐便座体", pale, side * 3.8, y + .44, 5.2, .58, .12, .7); furnish("坐便座后沿相接的完整小水箱", pale, side * 3.8, y + .73, 5.5, .55, .7, .18); furnish("每户卫浴后内角完整落地的淋浴托盘", pale, side * 2.7, y + .05, 5.25, .9, .1, 1); furnish("每户卫浴近门处真正落地的洗手柜", timber, side * 3.8, y + .42, 3.65, .55, .84, .55); furnish("洗手柜上实际贴合的浅色盆台", pale, side * 3.8, y + .9, 3.65, .6, .12, .6);
    }
  }
  p.push(waistStair("从中央首层门厅走向后部换台的九级共梯", -.8, .3, -2.5, 1.2, 9, 1 / 6, .3), waistStair("中央共梯换向后穿井接上层门厅的九级共梯", .8, 1.8, 1.1, 1.2, 9, 1 / 6, .3, true), box("中央折返共梯两跑之间真实接合的换向台", 0, 1.7, .65, 3, .2, .9, stone));
  for (const x of [-1.3, 1.3]) p.push(box("换向台下真正从首层木地面承起的独立立柱", x, .95, .65, .2, 1.3, .3, roof));
  for (const [x, z, base, reverse] of [[-.8, -2.5, .3, false], [.8, 1.1, 1.8, true]] as [number, number, number, boolean][]) for (const side of [-1, 1]) {
    const direction = reverse ? -1 : 1, low: Triple = [x + side * .55, base + 1 / 6, z + direction * .15], high: Triple = [x + side * .55, base + 1.5, z + direction * 2.55];
    guards.push(meshBeam("共梯扶手顺九级阶程连续抬升", [low[0], low[1] + .9, low[2]], [high[0], high[1] + .9, high[2]], .05, roof), meshBeam("共梯扶手低端实落首级踏面的竖柱", low, [low[0], low[1] + .9, low[2]], .05, roof), meshBeam("共梯扶手高端实落末级踏面的竖柱", high, [high[0], high[1] + .9, high[2]], .05, roof));
  }
  guards.push(meshBeam("共梯换向平台后边保留到上层孔边净距的完整栏", [-1.46, 2.8, 1.04], [1.46, 2.8, 1.04], .05, roof));
  for (const x of [-1.46, 1.46]) guards.push(meshBeam("换向平台侧边避开梯口的完整短栏", [x, 2.8, .25], [x, 2.8, 1.04], .05, roof), meshBeam("换向平台后栏实际接台面的立柱", [x, 1.8, 1.04], [x, 2.8, 1.04], .05, roof), meshBeam("换向平台侧栏前端实际接台面的立柱", [x, 1.8, .25], [x, 2.8, .25], .05, roof));
  for (const [a, b] of [[[-1.54, -1.64], [-1.54, 1.44]], [[-1.54, 1.44], [1.54, 1.44]], [[1.54, 1.44], [1.54, -1.64]], [[-1.54, -1.64], [.2, -1.64]], [[1.4, -1.64], [1.54, -1.64]]] as [[number, number], [number, number]][]) {
    guards.push(meshBeam("上层门厅绕真实楼梯井并避开到达口的护栏", [a[0], 4.3, a[1]], [b[0], 4.3, b[1]], .05, roof));
    for (const [x, z] of [a, b]) guards.push(meshBeam("楼梯井护栏下端真正支在完整上层楼板的短柱", [x, 3.3, z], [x, 4.3, z], .05, roof));
  }
  for (let first = 0; first < guards.length; first += 16) p.push(combineMeshes("中央共梯及上层门厅真实接承的完整安全栏架", roof, guards.slice(first, first + 16)));
  for (const [color, pieces] of Object.entries(furniture)) for (let first = 0; first < pieces.length; first += 16) p.push(combineMeshes("四户完整起居卧厨卫内各自落地的固定家具", color, pieces.slice(first, first + 16)));
  return p;
}

export const everydayResidenceSpaceBatchSevenDesigns = [
  design("中楼梯对门两层小公寓", "中央封闭门厅和折返共梯把每层左右两户连接起来，后公共厅与前门厅分别真实采光，各户前起居厅经两座内门进入后外侧卧室和后内侧厨卫带，完整上下楼板、顶盖与真实门窗保留四户独立生活空间", internalStairApartment, "建筑", "现代"),
];
