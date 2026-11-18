import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { halfRoundFloor, halfRoundWall } from "./spatialShells";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#bbb8a7", wall = "#d0c9b8", wood = "#a48c6c", steel = "#687f7e", dark = "#4d5c60", basin = "#d9d9cb", glass = "#a5c6c2";

export const everydayCommercialSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("侧湾湿干分区街区理发店", "狭长高主店沿一侧布置理发带，中央通道贯通前后真门；后右低半圆洗护附湾经独立内门接入，半圆高窗和高低屋盖共同围合真实干湿分区店体", sideBayHairSalon, "建筑", "现代"),
];

function sideBayHairSalon(): ModelPart[] {
  const outline: [number, number][] = [[-4, -8], [4, -8], [4, 1]];
  for (let index = 1; index <= 12; index++) { const angle = -Math.PI / 2 + index * Math.PI / 12; outline.push([4 + Math.cos(angle) * 3, 4 + Math.sin(angle) * 3]); }
  outline.push([4, 8], [-4, 8]);
  const p: ModelPart[] = [
    hardFloor("主店与半圆洗护湾一次接合的完整落地地板", paving, outline, .2, [0, 0, 0]),
    box("狭长主店由两侧承墙实际支起的完整高屋盖", 0, 4.125, 0, 8.6, .25, 16.6, steel),
    ...glazedWall("理发店临街真实主门和双橱窗", [-4, -8], [4, -8], .2, 4, [[-2.5, .7, 2.2, 2.5], [2.5, .7, 2.2, 2.5]], [[0, .2, 1.5, 2.6]]),
    ...glazedWall("主店背墙真实工作门与两侧高窗", [-4, 8], [4, 8], .2, 4, [[-2.4, 2.5, 1.8, .7], [2.4, 2.5, 1.8, .7]], [[0, .2, 1.1, 2.5]]),
    ...glazedWall("理发操作带背后完整承墙上的高侧窗", [-4, -8], [-4, 8], .2, 4, [[-4.7, 2.8, 2.6, .7], [0, 2.8, 2.6, .7], [4.7, 2.8, 2.6, .7]]),
    ...glazedWall("主店东墙保持真实内门进入低洗护湾", [4, -8], [4, 8], .2, 4, [[-5, 2.4, 3.2, .8]], [[4, .2, 1.8, 2.6]]),
    halfRoundWall("低洗护湾真实半圆实体窗下围壁", 3, .18, 1.5, [4, .2, 4], 90, wall),
    halfRoundWall("洗护湾高窗上方连续半圆承屋壁", 3, .18, .7, [4, 2.5, 4], 90, wall),
    box("店头橱窗上方不堵门的独立窄牌面", 0, 3.53, -8.18, 7.8, .5, .12, wood),
    box("前侧等候座实际落在主店地面上", 3, .45, -5.1, .7, .5, 2.4, wood),
    box("等候座背板与座体真实搭接", 3.4, .9, -5.1, .15, .9, 2.4, wood),
    box("后门侧独立洗护用品柜体", 3.25, 1, 7.2, .85, 1.6, 1.1, wood),
  ];
  const roof = halfRoundFloor("洗护湾与曲壁同心的独立半圆低屋盖", 3.3, .2, [4, 3.2, 4], 90, steel);
  roof.vertices = roof.indices!.map(index => ({ ...roof.vertices![index]! })); roof.indices = roof.vertices.map((_, index) => index); p.push(roof);
  const window = halfRoundWall("半圆高窗真实透明曲壳不以色块贴墙", 2.99, .04, .8, [4, 1.7, 4], 90, glass); window.opacity = .25; window.roughness = .2; p.push(window);

  const frames: SolidBox[] = [], seats: SolidBox[] = [], tops: SolidBox[] = [];
  for (let index = 0; index <= 6; index++) {
    const angle = -Math.PI / 2 + index * Math.PI / 6;
    frames.push({ center: [4 + Math.cos(angle) * 2.99, 2.1, 4 + Math.sin(angle) * 2.99], size: [.065, .8, .065] });
  }
  for (const z of [-7.6, -2.5, 2.5, 7.6]) frames.push({ center: [0, 3.75, z], size: [8.1, .5, .2] });
  for (const z of [-5, -1, 3]) {
    tops.push({ center: [-3.45, .72, z], size: [.85, 1.04, 1.35] }, { center: [-3.42, 1.28, z], size: [.95, .08, 1.45] });
    p.push(part("理发台上方独立反射镜板", "box", "#b1bfbb", [-3.7525, 2.03, z], [.035, 1.25, 1.1], [0, 0, 0], { metalness: .92, roughness: .07 }), cylinder("操作椅接地圆承座", -2, .25, z, .68, .1, dark), cylinder("圆座上真实连接座面的短立柱", -2, .45, z, .14, .3, steel));
    seats.push({ center: [-2, .67, z], size: [.7, .14, .7] }, { center: [-1.62, 1, z], size: [.12, .8, .7] });
    for (const side of [-1, 1]) seats.push({ center: [-2, .83, z + side * .37], size: [.7, .22, .08] });
  }
  for (const z of [2.5, 5.5]) {
    seats.push({ center: [5.1, .65, z], size: [.75, .9, .7] }, { center: [5.58, 1.08, z], size: [.26, .8, .7] });
    p.push(cylinder("洗护盆在圆湾内独立落地的承座", 6, .525, z, .24, .65, steel), part("洗护盆真实凹口和连续内外壁", "lathe", basin, [6, .85, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .12, y: 0 }, { x: .27, y: .12 }, { x: .35, y: .31 }, { x: .34, y: .35 }, { x: .31, y: .35 }, { x: .24, y: .16 }, { x: .1, y: .05 }, { x: 0, y: .05 }] }));
  }
  p.push(boxesMesh("弧窗实体竖框和主店屋盖下全部真实跨梁", steel, frames), boxesMesh("理发带所有接地柜体与连续台面", wood, tops), boxesMesh("主店操作椅与半圆洗护湾座体全部真实接合", dark, seats));
  return p;
}
