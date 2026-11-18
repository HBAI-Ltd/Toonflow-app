import type { ModelPart, Triple } from "../assetModelParts";
import { glazedFace, rectangle } from "./everydayWorkplaceSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { hardFloor } from "./vernacularWorldBatchSix";
import { box, design, rail, type ArchitecturePrototype } from "./structures";

const asphalt = "#657273", paving = "#bab9a9", steel = "#657c7e", dark = "#485d61", timber = "#9b8666";

export const everydayServiceBuildingSpaceBatchFiveDesigns: ArchitecturePrototype[] = [
  design("背撑转角双街电影外景立面场", "一整座固定外景设施由转角相接的两条真门窗街面和背后的连续L形技术步廊组成；各外景立面后方完全敞开，独立背撑从高位骨架落到远端锚座，局部返檐只遮相机视线而不伪造整间房，双跑实梯通到维护步廊且不穿背撑，街面演员门与后场工作路线分开", exteriorStreetFilmSet, "设施", "现代"),
];

function exteriorStreetFilmSet(): ModelPart[] {
  const street: [number, number][] = [[-20, -27], [-16, -27], [-16, -4], [20, -4], [20, 0], [-20, 0]], catwalk: [number, number][] = [[-22.5, -27], [-20.25, -27], [-20.25, .25], [20, .25], [20, 2.5], [-22.5, 2.5]], outline: [number, number][] = [[-20, 0], [20, 0], [20, 9.1], [10, 9.1], [10, 9.8], [0, 9.8], [0, 8.6], [-10, 8.6], [-10, 9.3], [-20, 9.3]], parts: ModelPart[] = [
    box("两条外景街面与敞开技术后场共同落地的完整片场基础", -4, .1, -9, 60, .2, 46, asphalt), hardFloor("转角相接且不重复叠面的连续L形演员人行街面", paving, street, .205, [0, 0, 0]), hardFloor("背后真正连续并在转角相通的完整L形技术维护步廊", steel, catwalk, .25, [0, 4, 0]),
    ...glazedFace("四段高低店面合成且每座演员门真实贯通的完整外景正立面", "xy", outline, [...[-18, -12, -8, -2, 2, 8, 12, 18].map(x => rectangle(x, .65, 1.9, 2.4)), ...[-15, -5, 5, 15].map(x => rectangle(x, 5.3, 5.8, 2.4))], [-15, -5, 5, 15].map(x => rectangle(x, .2, 2.3, 3.1)), 0),
    ...glazedFace("转角侧街背面敞开而门窗真正穿透的完整长外景立面", "yz", [[-27, 0], [0, 0], [0, 9.2], [-27, 9.2]], [...[-25.3, -19.7, -16.3, -10.7, -7.3, -1.7].map(z => rectangle(z, .65, 1.45, 2.4)), ...[-22.5, -13.5, -4.5].map(z => rectangle(z, 5.3, 5.2, 2.4))], [-22.5, -13.5, -4.5].map(z => rectangle(z, .2, 2.1, 3.1)), -20),
    box("双跑后场梯的中间平台真正平接两跑梯段", 18.5, 2.1, 7.4, 2.2, .25, .6, steel), box("中间平台从基础真正升到板底的独立承柱", 18.5, 1.0875, 7.4, .25, 1.775, .25, dark), box("后场实梯高端真正平接L形步廊的完整落脚平台", 18.5, 4.125, 3.15, 2.2, .25, 1.3, steel), box("梯顶接廊平台下实际落地的完整承柱", 18.5, 2.1, 3.15, .25, 3.8, .25, dark),
  ], frames: SolidBox[] = [], anchors: SolidBox[] = [], cornices: SolidBox[] = [], balusters: SolidBox[] = [];
  const lower = stairFlight("后场从地面朝维护廊上行的下跑实体梯", [18.5, .2, 11], 11, 2.025 / 11, .3, 1.8), upper = stairFlight("后场从中间平台实际接上维护廊的上跑实体梯", [18.5, 2.225, 7.1], 11, 2.025 / 11, .3, 1.8, .18); lower.rotation.y = 90; upper.rotation.y = 90; parts.push(lower, upper);
  for (const [x, height] of [[-19.85, 9.3], [-10, 9.3], [0, 9.8], [10, 9.8], [19.85, 9.1]]) {
    frames.push({ center: [x!, (height! + .2) / 2, .15], size: [.2, height! - .2, .2] }, { center: [x!, 2.1, 2.35], size: [.2, 3.8, .2] }, { center: [x!, 3.925, 1.35], size: [.18, .15, 2.3] });
    anchors.push({ center: [x!, .3, 10.5], size: [.8, .2, 1.1] }); parts.push(rail([x!, height! - .3, .15], [x!, .3, 10.5], .15, dark));
  }
  for (const z of [-26.85, -18, -9, -.15]) {
    frames.push({ center: [-20.15, 4.7, z], size: [.2, 9, .2] }, { center: [-22.35, 2.1, z], size: [.2, 3.8, .2] }, { center: [-21.35, 3.925, z], size: [2.3, .15, .18] });
    anchors.push({ center: [-30.5, .3, z], size: [1.1, .2, .8] }); parts.push(rail([-20.15, 8.9, z], [-30.5, .3, z], .15, dark));
  }
  frames.push({ center: [-22.35, 2.1, 2.35], size: [.2, 3.8, .2] }, { center: [-21.1, 3.925, 2.35], size: [2.5, .15, .18] }, { center: [-22.35, 3.925, 1.1], size: [.18, .15, 2.5] });
  for (const [left, right, height] of [[-20, -10, 9.3], [-10, 0, 8.6], [0, 10, 9.8], [10, 20, 9.1]]) {
    const middle = (left! + right!) / 2;
    cornices.push({ center: [middle, height! - .2, -.15], size: [10.15, .2, .42] }, { center: [middle, 4.1, -.14], size: [10, .25, .36] }, { center: [middle, height! - .25, .9], size: [10, .15, 1.8] });
    for (const end of [left!, right!]) frames.push({ center: [end, height! - .35, 1], size: [.15, .2, 2] });
  }
  for (const z of [-22.5, -13.5, -4.5]) {
    cornices.push({ center: [-19.85, 9, z], size: [.42, .2, 9.15] }, { center: [-19.86, 4.1, z], size: [.36, .25, 9] }, { center: [-20.9, 8.95, z], size: [1.8, .15, 9] });
    for (const end of [z - 4.5, z + 4.5]) frames.push({ center: [-21.1, 8.85, end], size: [2, .2, .15] });
  }
  const rails: [Triple, Triple][] = [
    [[-22.4, 5.35, 2.4], [17.3, 5.35, 2.4]], [[19.7, 5.35, 2.4], [19.9, 5.35, 2.4]], [[-22.4, 5.35, -26.9], [-22.4, 5.35, 2.4]], [[-22.4, 5.35, -26.9], [-20.3, 5.35, -26.9]], [[19.9, 5.35, .35], [19.9, 5.35, 2.4]],
  ];
  for (const [a, b] of rails) {
    parts.push(rail(a, b, .045, steel));
    const count = Math.ceil(Math.hypot(b[0] - a[0], b[2] - a[2]) / 4);
    for (let i = 0; i <= count; i++) balusters.push({ center: [a[0] + (b[0] - a[0]) * i / count, 4.8, a[2] + (b[2] - a[2]) * i / count], size: [.045, 1.1, .045] });
  }
  for (const x of [17.5, 19.5]) {
    for (const [za, zb, ya, yb] of [[11, 7.7, .2, 2.225], [7.1, 3.8, 2.225, 4.25]]) {
      parts.push(rail([x, ya! + .95, za!], [x, yb! + .95, zb!], .045, steel));
      balusters.push({ center: [x, ya! + .475, za!], size: [.045, .95, .045] }, { center: [x, yb! + .475, zb!], size: [.045, .95, .045] });
    }
    parts.push(rail([x, 3.175, 7.7], [x, 3.175, 7.1], .045, steel), rail([x, 5.2, 3.8], [x, 5.2, 2.5], .045, steel));
    balusters.push({ center: [x, 4.8, 2.5], size: [.045, 1.1, .045] });
  }
  for (const [group, name, color] of [[frames, "各外景立面骨架和连续维护廊真正接地的完整承柱横梁", dark], [anchors, "高位背撑真实落到基础上的完整独立锚座", paving], [cornices, "各街面与返檐实际连到承架的固定店面檐带", timber], [balusters, "维护廊与后场梯全部实际接到步面的独立栏杆竖柱", steel]] as const) for (let start = 0; start < group.length; start += 20) parts.push(boxesMesh(name, color, group.slice(start, start + 20)));
  return parts;
}
