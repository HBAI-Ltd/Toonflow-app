import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { waistStair } from "./publicSpaceBatchFourteen";
import { box, design, rail, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b8bbac", timber = "#a28b6b", metal = "#5f7575", roofColor = "#7b8b81", pale = "#cbc7b5";

export const everydayRetailBuildingSpaceBatchFiveDesigns: ArchitecturePrototype[] = [
  design("顶院分宅独梯五金商住店", "地面营业厅与后作间连续满铺，整片店屋上盖承住二层真正露天的顶院；两卧翼和后起居横厅围住上院，住户经店外西侧独立U梯及侧平台进入前露台，不穿营业厅。后作与后仓各有内外真门，私宅分室门、屋盖和楼板承托均实际连通", roofCourtHardwareShophouse, "建筑", "现代"),
];

function roofCourtHardwareShophouse(): ModelPart[] {
  const p: ModelPart[] = [
    box("营业厅后作间后仓共同满铺的完整落地基础", 0, .125, 0, 16, .25, 18, paving),
    box("店外私宅独梯与中平台下单独落地的窄侧基础", -9.9, .125, -5.9, 3.8, .25, 6.2, paving),
    box("完整店屋上盖承担顶院及三侧居室的整片楼面", 0, 3.875, 0, 16, .25, 18, paving),
    hardFloor("两侧卧翼与后起居横厅连续且不封顶院的U形厚屋盖", roofColor, [[-8.3, -7.3], [-2.7, -7.3], [-2.7, 2.7], [2.7, 2.7], [2.7, -7.3], [8.3, -7.3], [8.3, 9.3], [-8.3, 9.3]], .22, [0, 7.1, 0]),
    ...glazedWall("五金店前街宽人门与三座营业橱窗", [-8, -9], [8, -9], .25, 3.75, [[-6.4, .75, 1.8, 2.2], [.6, .75, 3.4, 2.2], [5.6, .75, 3.3, 2.2]], [[-3.5, .25, 2, 2.7]]),
    ...glazedWall("地面营业厅西壁真实高窗避开店外独梯", [-8, -9], [-8, 9], .25, 3.75, [[0, 2.65, 2.8, .65], [5.7, 2.65, 2.8, .65]]),
    ...glazedWall("营业厅东侧独立搬货门与后作高窗", [8, -9], [8, 9], .25, 3.75, [[-5.7, 1.1, 2.6, 1.7], [5.7, 2.65, 2.8, .65]], [[-1.8, .25, 1.3, 2.7]]),
    ...glazedWall("五金门市后作和后仓各自真正接入后巷的门", [-8, 9], [8, 9], .25, 3.75, [[-.7, 2.7, 2.7, .6]], [[-5, .25, 1.2, 2.6], [5, .25, 2.8, 2.9]]),
    ...glazedWall("公共营业厅进入后作与后仓的两道真实内门", [-8, 3], [8, 3], .25, 3.75, [], [[-5, .25, 1.2, 2.6], [5, .25, 1.6, 2.7]]),
    ...glazedWall("后作间与储物仓间真实保留互通门的纵隔壁", [-1, 3], [-1, 9], .25, 3.75, [], [[0, .25, 1.2, 2.6]]),
    ...glazedWall("顶院西前卧室的实际前露台入户门和窗", [-8, -7], [-3, -7], 4, 7.1, [[-1.65, 4.7, .95, 1.4]], [[0, 4, 1.2, 2.3]]),
    ...glazedWall("顶院东卧翼的实际前露台入户门和窗", [3, -7], [8, -7], 4, 7.1, [[1.65, 4.7, .95, 1.4]], [[0, 4, 1.2, 2.3]]),
    ...glazedWall("西卧翼两个独立房间直接面对顶院的真门", [-3, -7], [-3, 3], 4, 7.1, [], [[-2.4, 4, 1.05, 2.3], [2.8, 4, 1.05, 2.3]]),
    ...glazedWall("东卧翼面向顶院的独立真门", [3, -7], [3, 3], 4, 7.1, [[2.8, 5, 1.7, 1.2]], [[0, 4, 1.2, 2.3]]),
    ...glazedWall("后起居横厅正面与屋顶露院实际相通的真门", [-8, 3], [8, 3], 4, 7.1, [[-5, 4.9, 2.5, 1.3], [5, 4.9, 2.5, 1.3]], [[0, 4, 1.6, 2.3]]),
    ...glazedWall("后起居横厅完整承屋后壁的真实采光窗", [-8, 9], [8, 9], 4, 7.1, [[-5, 4.9, 2.6, 1.3], [0, 4.9, 2.6, 1.3], [5, 4.9, 2.6, 1.3]]),
    box("西卧翼前后两个房间之间真实接到屋盖的分隔壁", -5.5, 5.55, -2, 5, 3.1, .16, pale),
    waistStair("私宅店外U梯前跑从侧地坪上到半高平台", -10.8, .25, -7.8, 1.3, 12, 1.875 / 12, .3),
    box("店外独梯两跑真正相接的完整半高转向台", -10, 2.025, -3.6, 3.1, .2, 1.2, paving),
    waistStair("私宅店外U梯后跑折返至前露台侧落脚台", -9.2, 2.125, -4.2, 1.3, 12, 1.875 / 12, .3, true),
    box("独梯高端侧平台与上宅前露台实际同高接合", -8.975, 3.9, -8.4, 1.95, .2, 1.2, paving),
  ];
  for (const side of [-1, 1]) p.push(...glazedWall("上宅三侧屋体实际接住屋盖的连续带窗外壁", [side * 8, -7], [side * 8, 9], 4, 7.1, [[-5, 4.9, 2.1, 1.3], [1, 4.9, 2.1, 1.3], [6, 4.9, 2.1, 1.3]]));
  const structure: SolidBox[] = [], guards: SolidBox[] = [], furnishings: SolidBox[] = [], shelves: SolidBox[] = [];
  for (const x of [-7.75, 0, 7.75]) for (const z of [-8.75, 0, 8.75]) structure.push({ center: [x, 2, z], size: [.26, 3.5, .26] });
  for (const x of [-7.75, 0, 7.75]) structure.push({ center: [x, 3.625, 0], size: [.26, .25, 17.75] });
  for (const z of [-8.75, 0, 8.75]) structure.push({ center: [0, 3.625, z], size: [15.75, .25, .26] });
  for (const x of [-11.4, -8.6]) structure.push({ center: [x, 1.0875, -3.15], size: [.17, 1.675, .17] });
  structure.push({ center: [-9.8, 2.025, -8.8], size: [.18, 3.55, .18] });
  const edges: [number, number, number, number, number][] = [[-9.95, -9, 8, -9, 4], [-9.95, -9, -9.95, -7.8, 4], [-8.55, -7.8, -8, -7.8, 4], [8, -9, 8, -7, 4], [-11.55, -3, -8.45, -3, 2.125], [-11.55, -4.2, -11.55, -3, 2.125], [-8.45, -4.2, -8.45, -3, 2.125]];
  for (const [x0, z0, x1, z1, floor] of edges) {
    p.push(rail([x0, floor + 1.05, z0], [x1, floor + 1.05, z1], .06, metal));
    const count = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.7);
    for (let i = 0; i <= count; i++) guards.push({ center: [x0 + (x1 - x0) * i / count, floor + .525, z0 + (z1 - z0) * i / count], size: [.055, 1.05, .055] });
  }
  for (const [x, y, start, end] of [[-11.45, .25, -7.8, -4.2], [-10.15, .25, -7.8, -4.2], [-9.85, 2.125, -4.2, -7.8], [-8.55, 2.125, -4.2, -7.8]]) {
    p.push(rail([x!, y! + 1.05, start!], [x!, y! + 2.925, end!], .055, metal));
    for (const t of [0, .5, 1]) guards.push({ center: [x!, y! + .525 + 1.875 * t, start! + (end! - start!) * t], size: [.055, 1.05, .055] });
  }
  p.push(rail([-11.55, 3.175, -4.2], [-11.45, 3.175, -4.2], .055, metal), rail([-8.45, 3.175, -4.2], [-8.55, 3.175, -4.2], .055, metal));
  furnishings.push({ center: [.3, .78, -5.8], size: [3.3, 1.06, .9] }, { center: [.3, 1.35, -5.8], size: [3.45, .08, 1.02] }, { center: [-6.8, 1.04, 6.5], size: [1.6, .12, 1.6] });
  for (const x of [-7.4, -6.2]) for (const z of [5.9, 7.1]) furnishings.push({ center: [x, .615, z], size: [.12, .73, .12] });
  for (const [x, z, width, depth] of [[5.6, -4, 1.6, 2.2], [6.2, 6.2, .8, 2.1]]) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) shelves.push({ center: [x! + sx * (width! / 2 - .05), 1.15, z! + sz * (depth! / 2 - .05)], size: [.1, 1.8, .1] });
    for (const y of [.4, .9, 1.5, 2]) shelves.push({ center: [x!, y, z!], size: [width!, .08, depth!] });
  }
  for (const x of [5.2, 5.6, 6]) for (const y of [1, 1.6]) p.push(part("商品架上具有真实内孔的独立五金管材", "lathe", metal, [x, y, -4.9], [1, 1, 1], [90, 0, 0], { profile: [{ x: .04, y: 0 }, { x: .06, y: 0 }, { x: .06, y: 1.8 }, { x: .04, y: 1.8 }, { x: .04, y: 0 }] }));
  for (const [x, z] of [[-6.5, -4.6], [-6.5, .9], [6.2, -1.7]]) {
    furnishings.push({ center: [x!, 4.3, z!], size: [1.5, .2, 2.2] }, { center: [x!, 4.53, z!], size: [1.45, .26, 2.1] }, { center: [x!, 4.8, z! + 1.02], size: [1.6, 1.2, .14] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) furnishings.push({ center: [x! + sx * .59, 4.1, z! + sz * .9], size: [.13, .2, .13] });
  }
  furnishings.push({ center: [-4.7, 4.43, 7.2], size: [3.3, .3, .85] }, { center: [-4.7, 4.85, 7.59], size: [3.3, .85, .15] });
  for (const x of [-6, -3.4]) for (const z of [6.92, 7.48]) furnishings.push({ center: [x, 4.14, z], size: [.13, .28, .13] });
  furnishings.push({ center: [4.8, 4.92, 6.7], size: [2.2, .12, 1.2] });
  for (const x of [3.9, 5.7]) for (const z of [6.3, 7.1]) furnishings.push({ center: [x, 4.43, z], size: [.12, .86, .12] });
  p.push(boxesMesh("店屋上盖主梁接地柱及独梯平台的实际承托", metal, structure));
  for (let i = 0; i < guards.length; i += 20) p.push(boxesMesh("独梯和屋顶露台各自落在真实楼面的完整防护栏柱", metal, guards.slice(i, i + 20)));
  p.push(boxesMesh("五金展架与后仓开放货架的完整承板立脚", metal, shelves));
  for (let i = 0; i < furnishings.length; i += 20) p.push(boxesMesh("下店柜台后作台及上宅实际接地的床桌座完整构造", timber, furnishings.slice(i, i + 20)));
  return p;
}
