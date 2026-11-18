import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { barrelRoof } from "./spatialShells";
import { box, design, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#beb7a3", wall = "#d0c7b2", wood = "#a8875f", steel = "#6b7e7b", glass = "#acc7be", brick = "#af9276", dark = "#506064";

export const everydayCommercialSpaceBatchFiveDesigns: ArchitecturePrototype[] = [
  design("前拱橱窗后作坊街区烘焙店", "宽低扁拱零售堂接入偏置高作坊，前街弧顶门窗与后巷补货门真实贯通；配包取货口和员工门分开，前厅柜台不堵工作通路，店内砌筑炉口及排烟方管保持真实空腔", bakeryWorkshopShop, "建筑", "现代"),
];

function bakeryWorkshopShop(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("前宽后偏置的烘焙店完整落地楼面", paving, [[-5.24, -9], [5.24, -9], [5.24, 9], [-4, 9], [-4, -2], [-5.24, -2]], .2, [0, 0, 0]),
    hardFloor("高后坊屋盖真实挖出砌筑炉的排烟孔", steel, [[-4.3, -2.3], [5.54, -2.3], [5.54, 9.3], [-4.3, 9.3]], .25, [0, 4.4, 0], [[[2.7, 5.7], [3.3, 5.7], [3.3, 6.3], [2.7, 6.3]]]),
    ...glazedWall("零售堂西侧承拱墙的真实侧窗", [-5.24, -9], [-5.24, -2], .2, 2.8, [[0, .8, 4.8, 1.6]]),
    ...glazedWall("零售堂东侧向内加厚承拱的真实侧窗", [5.24, -2], [5.24, -9], .2, 2.8, [[0, .8, 4.8, 1.6]]),
    ...glazedWall("后坊西外墙真正贯通的高采光窗", [-4, -2], [-4, 9], .2, 4.4, [[0, 2.9, 6.2, .9]]),
    ...glazedWall("后坊东外墙真正贯通的高采光窗", [5.24, 9], [5.24, -2], .2, 4.4, [[0, 2.9, 6.2, .9]]),
    ...glazedWall("烘焙后坊尽端真实后巷补货入口", [-4, 9], [5.24, 9], .2, 4.4, [[-2.9, 2.9, 1.9, .9], [2.9, 2.9, 1.9, .9]], [[-.62, .2, 1.4, 2.7]]),
    standingPanel("前店与后坊共用高隔墙的员工门和贯通取货口", wall, [[-5.24, .2], [2.65, .2], [2.65, 2.9], [3.95, 2.9], [3.95, .2], [5.24, .2], [5.24, 4.4], [-5.24, 4.4]], [[[-3.4, 1.2], [1.6, 1.2], [1.6, 2.4], [-3.4, 2.4]]], -2, .24),
    box("前厅取货柜体让出东侧工作门和主客动线", -1, .7, -3.05, 5.6, 1, .9, wood),
    box("前厅柜体上的连续实际台面", -1, 1.24, -3.05, 5.8, .08, 1.04, paving),
    box("真实贯墙取货口下的短承台", -.9, 1.24, -2.35, 5.15, .08, .95, wood),
    box("后坊靠西侧落地长备面柜", -2.9, .65, 2, 1.3, .9, 3, paving),
    box("落地柜上实际接合的备面台面", -2.9, 1.14, 2, 1.4, .08, 3.1, wood),
  ];
  const canopy = barrelRoof("零售前堂真实内外表面的扁拱薄屋壳", 5, .18, 7.5, [0, 2.8, -5.5], steel); canopy.scale.y = .25; p.push(canopy);
  const front: [number, number][] = [[-5.24, .2], [-.9, .2], [-.9, 2.8], [.9, 2.8], [.9, .2], [5.24, .2], [5.24, 2.8], [5, 2.8]];
  for (let index = 1; index <= 12; index++) { const angle = index * Math.PI / 12; front.push([Math.cos(angle) * 5, 2.8 + Math.sin(angle) * 1.25]); }
  front.push([-5.24, 2.8]);
  p.push(standingPanel("扁拱街面实际贴合屋弧的门窗前墙", wall, front, [[[-4.2, .7], [-1.4, .7], [-1.4, 2.4], [-4.2, 2.4]], [[1.4, .7], [4.2, .7], [4.2, 2.4], [1.4, 2.4]]], -9, .24));
  for (const x of [-2.8, 2.8]) p.push(part("街面前墙真实窗孔内的独立透光玻璃", "box", glass, [x, 1.55, -9], [2.8, 1.7, .04], [0, 0, 0], { opacity: .25, roughness: .2 }));

  const structure: SolidBox[] = [];
  for (const x of [-5.12, 5.12]) structure.push({ center: [x, 2.725, -5.5], size: [.24, .15, 7.1] });
  for (const z of [-1.8, 3.5, 8.8]) structure.push({ center: [.62, 4.15, z], size: [9.25, .5, .24] });
  for (const z of [4.9, 7.4]) for (const y of [.35, .85, 1.35, 1.85]) structure.push({ center: [-3.1, y, z], size: [1.2, .07, .75] });
  for (const z of [4.9, 7.4]) for (const x of [-3.65, -2.55]) structure.push({ center: [x, 1.05, z], size: [.075, 1.7, .75] });
  p.push(boxesMesh("前堂承拱长梁后坊跨梁及全部接地醒发架", wood, structure));

  p.push(box("后坊砌筑烤炉厚实落地炉床", 3, .45, 6.1, 2.4, .5, 1.8, brick));
  for (const x of [1.9, 4.1]) p.push(box("炉床上真正围出烤室的厚侧壁", x, 1.45, 6.1, .2, 1.5, 1.8, brick));
  p.push(box("烤室后侧真正封合的厚炉墙", 3, 1.45, 6.9, 2.4, 1.5, .2, brick));
  const mouth: [number, number][] = [[2.25, .7], [3.75, .7], [3.75, 1.25]];
  for (let index = 1; index <= 8; index++) { const angle = index * Math.PI / 8; mouth.push([3 + Math.cos(angle) * .75, 1.25 + Math.sin(angle) * .75]); }
  p.push(standingPanel("真实半圆炉口贯穿厚前壁而非黑色贴片", brick, [[1.8, .2], [4.2, .2], [4.2, 2.4], [1.8, 2.4]], [mouth], 5.2, .2), hardFloor("炉室厚顶实际挖出贯通排烟方孔", brick, [[1.8, 5.2], [4.2, 5.2], [4.2, 7], [1.8, 7]], .2, [0, 2.2, 0], [[[2.7, 5.7], [3.3, 5.7], [3.3, 6.3], [2.7, 6.3]]]));

  p.push(boxesMesh("从炉室厚顶连续穿过屋面保留内膛的四面烟管", dark, [
    { center: [2.725, 3.85, 6], size: [.05, 3.3, .6] }, { center: [3.275, 3.85, 6], size: [.05, 3.3, .6] },
    { center: [3, 3.85, 5.725], size: [.5, 3.3, .05] }, { center: [3, 3.85, 6.275], size: [.5, 3.3, .05] },
  ]));
  return p;
}
