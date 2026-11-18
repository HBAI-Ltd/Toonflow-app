import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, colors } from "./structures";
import { barrelRoof } from "./spatialShells";
import { doorway, standingPanel } from "./publicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#b9b9ac", dark = "#526b70", wood = "#ad946e";

export const publicSpaceBatchTwentyThreeDesigns = [
  design("双拱错廊政务服务厅", "前后错位的两条椭圆筒拱厅共同接入低谷天光廊，左厅四个真实受理窗口通向后台廊和四间独立办公室，右厅自助区直接接入两间独立洽谈室；两公共厅的前门与中廊后门实际贯通，屋面拱肋接到连续窗墙及中部实柱", twinVaultServiceHall, "建筑", "现代"),
];

function twinVaultServiceHall(): ModelPart[] {
  const outline: [number, number][] = [[-20, -24], [-2, -24], [-2, -12], [20, -12], [20, 20], [2, 20], [2, 16], [-20, 16]], light: [number, number][] = [[-1, -10], [1, -10], [1, 14], [-1, 14]];
  const p: ModelPart[] = [box("双厅错位外廓及主入口前场共同落地的完整场坪", 0, .15, -2, 48, .3, 52, stone), polygon("两厅与中廊连续接合的八点错边地面饰层", wood, outline, .005, [0, .3, 0]), polygon("中部低谷公共廊精确接到两侧筒拱外缘并留采光孔的实体屋面", dark, [[-1.8, -12], [1.8, -12], [1.8, 16], [-1.8, 16]], .3, [0, 4.7, 0], [light]), part("嵌入低谷屋面采光孔且错开饰面高度的透明长天窗", "box", colors.glass, [0, 5, 2], [2.1, .05, 24.1], [0, 0, 0], { opacity: .25 }), part("外部地面实际接到左侧主入口前场的连续低坡", "extrude", stone, [-11, 0, -30], [1, 1, 1], [0, -90, 0], { depth: 4.5, profile: [{ x: -2, y: 0 }, { x: 2, y: 0 }, { x: 2, y: .3 }, { x: -2, y: .02 }] })];
  const panes: SolidBox[] = [], partitions: SolidBox[] = [], furniture: SolidBox[] = [], benches: SolidBox[] = [], columns: SolidBox[] = [];
  const addTable = (x: number, z: number, width: number, depth: number, height = .82) => {
    furniture.push({ center: [x, .3 + height - .06, z], size: [width, .12, depth] });
    for (const side of [-1, 1]) furniture.push({ center: [x + side * (width / 2 - .25), .3 + (height - .12) / 2, z], size: [.12, height - .12, depth - .2] });
  };
  for (const [x, centerZ, length, ribs] of [[-11, -4, 40, [-18, -8, 2, 12]], [11, 4, 32, [-8, 0, 8, 16]]] as [number, number, number, number[]][]) {
    const roof = barrelRoof("完整覆盖错位公共大厅的椭圆筒拱薄壳", 9, .2, length + .4, [x, 4.7, centerZ], dark); roof.scale.y = .6; p.push(roof);
    for (const z of ribs) { const rib = barrelRoof("从两侧承墙连续跨过整厅的实际椭圆承重拱肋", 8.8, .2, .2, [x, 4.7, z], wood); rib.scale.y = .6; p.push(rib); }
    for (const z of [centerZ - length / 2, centerZ + length / 2]) {
      const isFront = z < centerZ, face: [number, number][] = isFront ? [[-9, .3], [-2, .3], [-2, 3.1], [2, 3.1], [2, .3], [9, .3], [9, 4.7], [-9, 4.7]] : [[-9, .3], [9, .3], [9, 4.7], [-9, 4.7]], windows = isFront ? [-5.75, 5.75] : [-6.75, -2.25, 2.25, 6.75], holes: [number, number][][] = [];
      for (const offset of windows) { const width = isFront ? 3.5 : 3.3; holes.push([[offset - width / 2, 1.2], [offset + width / 2, 1.2], [offset + width / 2, 3.6], [offset - width / 2, 3.6]]); panes.push({ center: [x + offset, 2.4, z], size: [width, 2.4, .05] }); }
      const lower = standingPanel("公共前门与两侧采光窗实际穿过的完整厅端下墙", stone, face, holes, z, .24); lower.position.x = x; p.push(lower);
      const glass = part("椭圆筒拱端部真正闭合到屋壳的完整高窗", "extrude", colors.glass, [x, 4.7, z], [1, .6, 1], [0, 0, 0], { depth: .08, profile: Array.from({ length: 13 }, (_, i) => ({ x: Math.cos(i * Math.PI / 12) * 9, y: Math.sin(i * Math.PI / 12) * 9 })), opacity: .24 }); p.push(glass);
    }
    const outerX = x < 0 ? -20 : 20, offsets = x < 0 ? [-15, -5, 5, 15] : [-11, -3.7, 3.7, 11], holes: [number, number][][] = [];
    for (const offset of offsets) { const width = x < 0 ? 6 : 4.4; holes.push([[offset - width / 2, 1.2], [offset + width / 2, 1.2], [offset + width / 2, 3.6], [offset - width / 2, 3.6]]); panes.push({ center: [outerX, 2.4, centerZ - offset], size: [.05, 2.4, width] }); }
    const outer = standingPanel("两错位长厅外侧连续实墙中的独立采光窗洞", stone, [[-length / 2, .3], [length / 2, .3], [length / 2, 4.7], [-length / 2, 4.7]], holes, 0, .24); outer.position.x = outerX; outer.position.z = centerZ; outer.rotation.y = 90; p.push(outer);
  }
  const leftFront = standingPanel("左厅前伸部分面向前场的实际侧窗墙", stone, [[-6, .3], [6, .3], [6, 4.7], [-6, 4.7]], [[[-4, 1.2], [4, 1.2], [4, 3.6], [-4, 3.6]]], 0, .24); leftFront.position.x = -2; leftFront.position.z = -18; leftFront.rotation.y = 90; p.push(leftFront); panes.push({ center: [-2, 2.4, -18], size: [.05, 2.4, 8] });
  const serviceHoles: [number, number][][] = [];
  for (const offset of [-6.75, -2.25, 2.25, 6.75]) { serviceHoles.push([[offset - 1.7, 1.1], [offset + 1.7, 1.1], [offset + 1.7, 2.6], [offset - 1.7, 2.6]]); furniture.push({ center: [-11 + offset, 1.1, 2.8], size: [3.4, .1, .8] }); }
  const serviceWall = standingPanel("真实四受理窗将公共候办厅与后台走廊分开的完整墙体", stone, [[-9, .3], [9, .3], [9, 4.7], [-9, 4.7]], serviceHoles, 3, .2); serviceWall.position.x = -11; p.push(serviceWall);
  const staffSide = standingPanel("后台侧墙在真实三米工作廊处开门并连续封闭办公室", stone, [[-6.5, .3], [4.4, .3], [4.4, 2.9], [5.6, 2.9], [5.6, .3], [6.5, .3], [6.5, 4.7], [-6.5, 4.7]], [], 0, .2); staffSide.position.x = -2; staffSide.position.z = 9.5; staffSide.rotation.y = 90; p.push(staffSide);
  for (const x of [-17.75, -13.25, -8.75, -4.25]) { p.push(doorway("四间后台办公室各自通向工作廊的真实房门", [x, .3, 6], 4.5, 4.4, 1.1, 0, 2.4)); addTable(x, 11, 2.8, 1.1); }
  for (const x of [-15.5, -11, -6.5]) partitions.push({ center: [x, 2.5, 11], size: [.2, 4.4, 10] });
  p.push(box("真正封闭后台办公室且让拱顶保持连续的平整吊顶", -11, 4.8, 11, 18, .2, 10, dark), box("右厅洽谈区实际封闭到筒拱之下的完整吊顶", 11, 4.8, 13, 18, .2, 14, dark), box("右侧独立洽谈房面向中廊和后院的连续侧墙", 2, 2.5, 13, .2, 4.4, 14, stone));
  for (const x of [6.5, 15.5]) { p.push(doorway("两间洽谈室各自面向右厅公共自助区的实际独立门", [x, .3, 6], 9, 4.4, 1.2, 0, 2.4)); addTable(x, 13, 3.2, 1.4); }
  partitions.push({ center: [11, 2.5, 13], size: [.2, 4.4, 14] });
  for (const z of [-12, 16]) p.push(doorway("中部天光公共廊前后实际贯通的宽门", [0, .3, z], 4, 4.4, 2.4, 0, 2.8));
  for (const side of [-1, 1]) for (const z of [-12, -5, 2]) columns.push({ center: [side * 2, 2.5, z], size: [.2, 4.4, .2] });
  for (const x of [-16, -6]) for (const z of [-17, -9, -1]) {
    benches.push({ center: [x, .69, z], size: [4, .12, .65] }, { center: [x, 1.125, z + .325], size: [4, .75, .08] });
    for (const side of [-1, 1]) benches.push({ center: [x + side * 1.5, .465, z], size: [.15, .33, .55] });
  }
  for (const x of [7, 15]) for (const z of [-6, 0]) addTable(x, z, 3.4, 1.2, 1.01);
  p.push(boxesMesh("两厅真正分室并与外墙和吊顶接合的完整办公室隔墙", stone, partitions), boxesMesh("低谷天光屋面及两侧拱脚实际落地的承重柱", dark, columns));
  for (let start = 0; start < furniture.length; start += 18) p.push(boxesMesh("受理窗口柜板及后台洽谈自助区实际落地的工作台", wood, furniture.slice(start, start + 18)));
  for (let start = 0; start < benches.length; start += 18) p.push(boxesMesh("公共候办区让开通行带的实际落地连排长座", "#92a195", benches.slice(start, start + 18)));
  for (let start = 0; start < panes.length; start += 18) { const glass = boxesMesh("完整公共厅真实侧窗和端窗中的独立透明窗板", colors.glass, panes.slice(start, start + 18)); glass.opacity = .24; p.push(glass); }
  return p;
}
