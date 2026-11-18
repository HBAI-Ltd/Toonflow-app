import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { rectangularFlue } from "./spatialShells";
import { box, design, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b7b5a5", steel = "#687d75", wood = "#a48b65", ceramic = "#d3d5c5", brick = "#a99478", dark = "#586d6b";

function campgroundCookingWashHouse(): ModelPart[] {
  const flueHole: [number, number][] = [[-9.42, 4.18], [-8.58, 4.18], [-8.58, 4.82], [-9.42, 4.82]];
  const wetRoof: [number, number][] = [[1.76, -.24], [12.24, -.24], [12.24, 4.24], [4.24, 4.24], [4.24, 10.24], [1.76, 10.24]];
  const parts: ModelPart[] = [
    box("公园营地公共炊洗楼和露天晾晒院的完整落地场坪", 0, .1, 0, 28, .2, 24, paving),
    box("就餐穿廊炊事房湿洗前室与后勤带同标高的完整地板", 0, .25, 0, 24.48, .1, 20.48, paving),
    box("前公共就餐厅和两侧横穿门实际由外墙接承的完整低屋盖", 0, 3.8, -5.12, 24.48, .2, 10.24, steel),
    hardFloor("高炊事翼与后备餐带的完整屋盖真正为中空烟管留孔", steel, [[-12.24, -.24], [2.24, -.24], [2.24, 10.24], [-12.24, 10.24]], .2, [0, 4.2, 0], [flueHole]),
    hardFloor("湿洗前室与后勤窄带接合并让出露天晾晒院的L形低屋盖", steel, wetRoof, .2, [0, 3.4, 0]),
    ...glazedWall("公共就餐前厅真实主门与两侧采光立面", [-12, -10], [12, -10], .3, 3.7, [[-7.5, 1.3, 5, 1.5], [7.5, 1.3, 5, 1.5]], [[0, .3, 3.2, 2.6]]),
    ...glazedWall("就餐厅西端可横穿雨廊的实际侧门与前窗", [-12, -10], [-12, 0], .3, 3.7, [[-3, 1.3, 3, 1.5]], [[3.5, .3, 2.4, 2.6]]),
    ...glazedWall("就餐厅东端与另一侧对齐的横穿真门和采光窗", [12, -10], [12, 0], .3, 3.7, [[-3, 1.3, 3, 1.5]], [[3.5, .3, 2.4, 2.6]]),
    ...glazedWall("炊事房从就餐穿廊进出的真门和独立传餐墙口", [-12, 0], [2, 0], .3, 4.2, [], [[-4, .3, 1.8, 2.6], [3, 1.15, 3, 1.1]]),
    ...glazedWall("湿洗前室从公共穿廊进入的独立实际门窗", [2, 0], [12, 0], .3, 3.7, [[3, 1.4, 2, 1.3]], [[0, .3, 1.8, 2.5]]),
    ...glazedWall("炊事翼外侧避开炉台且真正为后备餐间采光的窗墙", [-12, 0], [-12, 10], .3, 4.2, [[-2.5, 2.4, 3, .8], [3.5, 1.6, 1.4, 1.5]]),
    ...glazedWall("炊事与后备餐带之间保留连续服务内门的实墙", [-12, 8], [2, 8], .3, 4.2, [], [[0, .3, 1.4, 2.5]]),
    ...glazedWall("后备餐带直接从后场进入的独立后勤真门", [-12, 10], [2, 10], .3, 4.2, [], [[0, .3, 1.6, 2.5]]),
    ...glazedWall("炊事高翼与湿洗区隔开的完整墙及后勤互通真门", [2, 0], [2, 10], .3, 4.2, [], [[4, .3, 1.2, 2.5]]),
    ...glazedWall("湿洗前室朝场地的独立高窗外墙", [12, 0], [12, 4], .3, 3.4, [[0, 1.7, 2.6, 1]]),
    ...glazedWall("湿洗前室分别进入后勤窄带和露天晾晒院的真实双门", [2, 4], [12, 4], .3, 3.4, [], [[-4, .3, 1.2, 2.5], [1, .3, 2.5, 2.5]]),
    ...glazedWall("后勤设备带面向晾晒院的连续承屋高窗壁", [4, 4], [4, 10], .3, 3.4, [[0, 2.3, 3, .65]]),
    ...glazedWall("后勤窄带从后场单独进出的实际末端门", [2, 10], [4, 10], .3, 3.4, [], [[0, .3, 1.2, 2.5]]),
    box("露天晾晒院后侧步行出口左边实际落地的低围壁", 5.5, .85, 10, 3, 1.1, .24, paving),
    box("露天晾晒院后侧步行出口右边实际落地的低围壁", 10.5, .85, 10, 3, 1.1, .24, paving),
    box("露天晾晒院东边不抬成有顶房间的完整低围壁", 12, .85, 7, .24, 1.1, 6, paving),
    box("炊事传餐墙口下缘真实穿过墙身的连续操作台", -2, 1.075, 0, 3.3, .15, 1.1, ceramic),
    box("共享炉膛下方与炊事地板相接的完整实厚炉底", -9, .36, 4, 4, .12, 1.6, brick),
    ...glazedWall("共享炉台前壁真正开出两处通进炉膛的火口", [-11, 3.2], [-7, 3.2], .42, 1.22, [], [[-1, .55, 1.1, .4], [1, .55, 1.1, .4]]),
    box("共享炉膛完整耐热后壁", -9, .82, 4.74, 4, .8, .12, brick),
    box("共享炉膛左侧实际闭合的耐热侧壁", -10.94, .82, 4, .12, .8, 1.6, brick),
    box("共享炉膛右侧实际闭合的耐热侧壁", -7.06, .82, 4, .12, .8, 1.6, brick),
  ];
  const stoveOpenings = [-10, -8].map(x => Array.from({ length: 8 }, (_, i): [number, number] => [x + Math.cos(i * Math.PI / 4) * .25, 3.85 + Math.sin(i * Math.PI / 4) * .25]));
  stoveOpenings.push([[-9.34, 4.26], [-8.66, 4.26], [-8.66, 4.74], [-9.34, 4.74]]);
  parts.push(hardFloor("共享炉台两只真实敞口锅眼和后方连通烟管的实际炉盖", brick, [[-11, 3.2], [-7, 3.2], [-7, 4.8], [-11, 4.8]], .1, [0, 1.22, 0], stoveOpenings), rectangularFlue("从实际炉膛一直穿过屋盖到屋外且内腔相通的厚壁烟道", .8, .6, 4.18, .06, [-9, 1.22, 4.5], brick));
  parts.push(hardFloor("屋盖通孔周边同时接在屋面和烟管壁上的完整烟道泛水圈", brick, [[-9.6, 4], [-8.4, 4], [-8.4, 5], [-9.6, 5]], .08, [0, 4.38, 0], [stoveOpenings[2]!]));
  const basinHoles = [1.4, 2.65].map(z => Array.from({ length: 8 }, (_, i): [number, number] => [10.9 + Math.cos(i * Math.PI / 4) * .32, z + Math.sin(i * Math.PI / 4) * .32]));
  parts.push(hardFloor("湿洗前室台面两处真实贯通的洗涤盆安装孔", ceramic, [[10.1, .5], [11.7, .5], [11.7, 3.5], [10.1, 3.5]], .12, [0, 1, 0], basinHoles));
  for (const z of [1.4, 2.65]) parts.push(part("敞口洗涤盆内壁和低位排水孔连接而不以实心盘代替凹腔", "lathe", ceramic, [10.9, 1.12, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: .12, y: -.32 }, { x: .35, y: -.06 }, { x: .36, y: 0 }, { x: .29, y: 0 }, { x: .27, y: -.05 }, { x: .09, y: -.27 }, { x: .04, y: -.29 }, { x: .04, y: -.32 }, { x: .12, y: -.32 }] }));
  const fittings: SolidBox[] = [];
  for (const z of [1.4, 2.65]) fittings.push({ center: [11.45, 1.245, z], size: [.05, .25, .05] }, { center: [11.2, 1.37, z], size: [.55, .05, .05] });
  for (const z of [.7, 3.3]) fittings.push({ center: [10.9, .65, z], size: [1.4, .7, .1] });
  for (const z of [6.2, 7.4, 8.6]) {
    for (const x of [5, 11]) fittings.push({ center: [x, 1.4, z], size: [.06, 2.2, .06] });
    fittings.push({ center: [8, 2.47, z], size: [6, .06, .06] });
  }
  parts.push(boxesMesh("洗涤盆台面实际落地端架相接的龙头及露天晾晒架完整立杆横杆", dark, fittings));
  const tables: SolidBox[] = [];
  for (const x of [-6, 6]) {
    tables.push({ center: [x, 1.025, -6], size: [4, .1, 1.2] });
    for (const offset of [-1.4, 1.4]) tables.push({ center: [x + offset, .65, -6], size: [.12, .7, .9] });
    for (const z of [-7.3, -4.7]) {
      tables.push({ center: [x, .72, z], size: [4, .12, .5] });
      for (const offset of [-1.4, 1.4]) tables.push({ center: [x + offset, .48, z], size: [.12, .36, .45] });
    }
  }
  parts.push(boxesMesh("公共就餐厅固定共享餐桌与两侧坐凳均独立落在完整地板上", wood, tables));
  parts.push(boxesMesh("公共就餐屋盖中跨实际由两侧落地柱和完整横梁接承", steel, [{ center: [-10, 1.95, -5], size: [.24, 3.3, .24] }, { center: [10, 1.95, -5], size: [.24, 3.3, .24] }, { center: [0, 3.55, -5], size: [20.24, .3, .3] }]));
  return parts;
}

export const everydayParkServiceSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("穿廊分炊洗营地公共服务馆", "前公共就餐厅的两侧真门对齐横穿通廊，后部高炊事房与低湿洗前室各自从通廊进入；炊事炉膛锅眼烟管和穿屋盖孔真实相通，湿洗台有敞口盆腔，独立后门进入备餐与设备带，湿洗前室另通没有屋盖的晾晒院。高低承墙和落地柱梁直接接住全部屋盖，餐桌炊台和晾晒架均有实际承托", campgroundCookingWashHouse, "建筑", "现代"),
];
