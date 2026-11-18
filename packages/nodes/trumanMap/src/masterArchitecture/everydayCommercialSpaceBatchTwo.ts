import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { box, design, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b8b7a8", wall = "#d1cab8", wood = "#a48c6b", steel = "#60767b", pale = "#d7d3c3", dark = "#47585c";
type Point = [number, number];

export const everydayCommercialSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("前庭双侧配套街区照相馆", "U形完整店壳的两座低翼分别容纳接待和化妆更衣，露天前庭通过三座真实门进入后部高棚；圆弧地墙背景在棚内留下左右工作通路，后巷门与配套室内门都实际连通", courtyardPhotoStudio, "建筑", "现代"),
];

function rectangle(left: number, right: number, front: number, back: number): Point[] {
  return [[left, front], [right, front], [right, back], [left, back]];
}

function courtyardPhotoStudio(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("照相馆前双翼与后高棚为连续U形落地楼面", paving, [[-8, -10], [-2, -10], [-2, -2], [2, -2], [2, -10], [8, -10], [8, 10], [-8, 10]], .2, [0, 0, 0]),
    box("中央前庭低于店内门槛的完整露天地坪", 0, .05, -6, 4, .1, 8, paving),
    hardFloor("西侧接待翼独立低屋盖", steel, rectangle(-8.3, -1.75, -10.3, -1.8), .25, [0, 3.9, 0]),
    hardFloor("东侧化妆更衣翼独立低屋盖", steel, rectangle(1.75, 8.3, -10.3, -1.8), .25, [0, 3.9, 0]),
    box("后高棚完整大跨度屋盖不封闭前庭", 0, 6.325, 4, 16.6, .25, 12.6, steel),
    box("前双翼之间实际搭接的短入口雨棚", 0, 3.175, -10, 4.6, .15, 1.6, wood),
    ...glazedWall("接待翼前街真实展示橱窗", [-8, -10], [-2, -10], .2, 3.9, [[0, .75, 4.6, 2.25]]),
    ...glazedWall("化妆翼前街实际采光橱窗", [2, -10], [8, -10], .2, 3.9, [[0, .75, 4.6, 2.25]]),
    ...glazedWall("西接待翼朝前庭的真实顾客入口", [-2, -10], [-2, -2], .2, 3.9, [[2.2, 1.2, 1.8, 1.6]], [[-1, .2, 1.5, 2.6]]),
    ...glazedWall("东化妆翼朝前庭的实际独立入口", [2, -10], [2, -2], .2, 3.9, [[2.5, 1.6, 1.5, 1.2]], [[-1, .2, 1.5, 2.6]]),
    ...glazedWall("西翼低段完整承墙实际开高窗", [-8, -10], [-8, -2], .2, 3.9, [[0, 2.7, 4.8, .7]]),
    ...glazedWall("东翼低段完整承墙实际开高窗", [8, -10], [8, -2], .2, 3.9, [[0, 2.7, 4.8, .7]]),
    ...glazedWall("高棚西侧封闭隔光承墙", [-8, -2], [-8, 10], .2, 6.2, []),
    ...glazedWall("高棚东侧封闭隔光承墙", [8, -2], [8, 10], .2, 6.2, []),
    ...glazedWall("高后棚正墙三座真实内外入口", [-8, -2], [8, -2], .2, 6.2, [], [[-5, .2, 1.2, 2.6], [0, .2, 2.6, 3], [5, .2, 1.2, 2.6]]),
    ...glazedWall("后棚背墙实际接入布景侧通路的后巷工作门", [-8, 10], [8, 10], .2, 6.2, [], [[6.9, .2, 1.2, 2.7]]),
    standingPanel("化妆与更衣两区之间真实开门的内隔墙", wall, [[2, .2], [2.9, .2], [2.9, 2.6], [4.1, 2.6], [4.1, .2], [8, .2], [8, 3.9], [2, 3.9]], [], -4.8, .16),
    box("接待室前侧落地等候座台", -6, .45, -8.6, 2.5, .5, 1, wood),
    box("接待室工作柜不封堵前庭与后棚门", -6.4, .73, -5.5, 1, 1.06, 2.8, wood),
    box("化妆区右侧连续落地操作柜", 6.7, .68, -7.3, 1, .96, 3.2, wood),
    part("化妆柜上实际独立反射镜面", "box", "#a9b5b2", [7.205, 1.785, -7.3], [.035, 1.25, 2.9], [0, 0, 0], { metalness: .92, roughness: .08 }),
    box("更衣区远离真实通门的独立坐台", 6.5, .45, -3.4, 1.6, .5, .7, wood),
    box("前街独立店头窄牌面", -5, 3.5, -10.18, 5.8, .5, .12, wood),
  ];
  const profile: { x: number; y: number }[] = [{ x: 3.7, y: .08 }];
  for (let index = 0; index <= 8; index++) { const angle = -Math.PI / 2 + index * Math.PI / 16; profile.push({ x: 6.6 + Math.cos(angle) * 1.52, y: 1.6 + Math.sin(angle) * 1.52 }); }
  profile.push({ x: 8.12, y: 4.8 }, { x: 8, y: 4.8 }, { x: 8, y: 1.6 });
  for (let index = 1; index <= 8; index++) { const angle = -index * Math.PI / 16; profile.push({ x: 6.6 + Math.cos(angle) * 1.4, y: 1.6 + Math.sin(angle) * 1.4 }); }
  profile.push({ x: 3.7, y: .2 });
  p.push(part("地面圆弧连续过渡到直立背墙的真实薄背景壳", "extrude", pale, [0, .12, 0], [1, 1, 1], [0, -90, 0], { profile, depth: 12 }));

  const structure: SolidBox[] = [];
  for (const x of [-7.8, 7.8]) for (const z of [-1.8, 4, 9.8]) structure.push({ center: [x, 3.2, z], size: [.24, 6, .24] });
  for (const z of [-1.8, 4, 9.8]) structure.push({ center: [0, 5.95, z], size: [15.8, .5, .24] });
  for (const x of [-5, 0, 5]) structure.push({ center: [x, 5.63, 4], size: [.1, .14, 11.8] });
  for (const x of [-7.8, -2.05, 2.05, 7.8]) structure.push({ center: [x, 3.72, -6], size: [.22, .36, 8] });
  for (const z of [-8.77, -5.83]) structure.push({ center: [7.205, 1.785, z], size: [.07, 1.31, .08] });
  for (const y of [1.17, 2.4]) structure.push({ center: [7.205, y, -7.3], size: [.07, .08, 3.02] });
  p.push(boxesMesh("高棚承墙内柱跨梁及固定吊灯网格全部实际相接", dark, structure));
  return p;
}
