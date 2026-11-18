import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b1b7aa", timber = "#a48b68", steel = "#687e80", dark = "#4b5f61", roof = "#84968b", glass = "#91b4b5";

function darkPassageFilmProcessingHouse(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("接片前厅暗室和扫描翼共同地坪真正留出湿区下沉排液沟", paving, [[-15.6, -14.6], [15.6, -14.6], [15.6, 14.6], [-15.6, 14.6]], .20, [0, 0, 0], [[[-6.4, -1], [-5.4, -1], [-5.4, 7.5], [-6.4, 7.5]]]),
    box("湿处理排液沟低于操作地坪的连续真实槽底", -5.9, .03, 3.25, 1, .06, 8.5, dark),
    part("接片公共前厅从街面接入的主缓坡", "extrude", paving, [0, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 3.4, profile: [{ x: -17, y: 0 }, { x: -14.6, y: 0 }, { x: -14.6, y: .20 }] }),
    part("暗室后部独立挡光门接回后场的缓坡", "extrude", paving, [-11.5, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 2.0, profile: [{ x: 14.6, y: 0 }, { x: 17, y: 0 }, { x: 14.6, y: .20 }] }),
    part("扫描服务翼后勤工作门接回场地的独立缓坡", "extrude", paving, [2.5, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 2, profile: [{ x: 14.6, y: 0 }, { x: 17, y: 0 }, { x: 14.6, y: .20 }] }),
    part("东侧洁净整理工作间真实接地的侧门缓坡", "extrude", paving, [0, 0, 11.5], [1, 1, 1], [0, 0, 0], { depth: 2, profile: [{ x: 15.6, y: 0 }, { x: 18, y: 0 }, { x: 15.6, y: .20 }] }),
    box("公共接片前厅完整较低屋盖", 0, 4.01, -11, 30.6, .22, 6.6, roof),
    box("无窗湿处理暗室及两端挡光廊共同的完整高屋盖", -7, 5.01, 3, 16.6, .22, 22.6, roof),
    box("独立明室扫描及洁净整理翼完整低屋盖", 8.025, 4.01, 3, 14.55, .22, 22.6, roof),
    ...glazedWall("公共接片前厅完整临街门窗立面", [-15, -14], [15, -14], .20, 3.9, [[-9, 1.0, 6, 1.8], [9, 1.0, 6, 1.8]], [[0, .20, 2.8, 2.8]]),
    ...glazedWall("接片前厅西侧真正贯通的采光窗墙", [-15, -14], [-15, -8], .20, 3.9, [[0, 1.0, 3.8, 1.8]]),
    ...glazedWall("湿处理高暗室无窗完整西围护墙", [-15, -8], [-15, 14], .20, 4.9, []),
    ...glazedWall("接片前厅东侧完整采光围护墙", [15, -14], [15, -8], .20, 3.9, [[0, 1.0, 3.8, 1.8]]),
    ...glazedWall("扫描及整理翼真实外窗和独立工作人员门", [15, -8], [15, 14], .20, 3.9, [[-7, 1.1, 4, 1.6], [0, 1.1, 4, 1.6]], [[8.5, .20, 1.5, 2.5]]),
    ...glazedWall("暗室后场实际通门与整高无窗后壁", [-15, 14], [1, 14], .20, 4.9, [], [[-4.5, .20, 1.5, 2.6]]),
    ...glazedWall("明室后勤走廊的独立后门及整理间后窗", [1, 14], [15, 14], .20, 3.9, [[2.5, 1.1, 5.0, 1.6]], [[-5.5, .20, 1.5, 2.5]]),
    ...glazedWall("接片前厅与湿暗室之间连接首座挡光廊的真实门", [-15, -8], [1, -8], .20, 4.9, [], [[-4, .20, 1.5, 2.6]]),
    ...glazedWall("公共前厅分别接入明室扫描房和后勤走廊的真实通门", [1, -8], [15, -8], .20, 3.9, [], [[-5.5, .20, 1.5, 2.5], [0, .20, 1.8, 2.5]]),
    ...glazedWall("明暗两翼之间从地坪接到高低屋盖的整高不透光分隔墙", [1, -8], [1, 14], .20, 4.9, []),
    ...glazedWall("扫描翼洁净后勤长廊与前后工作房之间的真实通门墙", [4, -8], [4, 14], .20, 3.9, [], [[-5, .20, 1.4, 2.5], [6, .20, 1.4, 2.5]]),
    box("扫描前房与后部洁净整理房之间完整不透光隔墙", 9.5, 2.05, 5, 11, 3.7, .20, paving),
    box("前挡光廊第一折整高遮光墙连续接到西外壁", -11, 2.55, -5.6, 8, 4.7, .24, dark),
    box("前挡光廊第二折整高遮光墙连续接到明暗分隔壁", -3.5, 2.55, -3.2, 9, 4.7, .24, dark),
    box("后挡光廊内折整高遮光墙连续接到明暗分隔壁", -3.5, 2.55, 9, 9, 4.7, .24, dark),
    box("后挡光廊外折整高遮光墙连续接到西外壁", -11, 2.55, 11.5, 8, 4.7, .24, dark),
    box("接片前厅避开主门和左右工作门的落地接件台", -5.5, .75, -11.4, 3.5, 1.1, 1.1, timber),
    box("接片前厅东侧实际落地的客户等候长座", 10, .45, -11.4, 4, .5, .85, timber),
    box("扫描前房靠东墙且避开房门的整体操作台", 12.5, .7, -1.5, 2, 1, 6, timber),
    box("后部洁净整理间沿后墙实际落地的长工作台", 9.5, .7, 12.8, 6.4, 1, 1.5, timber),
  ];
  const channel: SolidBox[] = [], tanks: SolidBox[] = [], structure: SolidBox[] = [], drying: SolidBox[] = [], optical: SolidBox[] = [];
  for (const x of [-6.36, -5.44]) channel.push({ center: [x, .13, 3.25], size: [.08, .14, 8.5] });
  for (const z of [-.96, 7.46]) channel.push({ center: [-5.9, .13, z], size: [1, .14, .08] });
  p.push(boxesMesh("排液沟真正下凹槽底与侧壁连续封闭的薄衬组", dark, channel));
  for (const center of [0, 3.8, 7]) {
    const bars: SolidBox[] = [];
    for (let index = 0; index < 5; index++) bars.push({ center: [-5.9, .17, center + (index - 2) * .14], size: [1.24, .06, .08] });
    p.push(boxesMesh("跨过下凹排液沟且两端实际支在干地坪上的透空踏格", steel, bars));
  }
  for (const z of [0, 3, 6]) {
    tanks.push({ center: [-3.1, .56, z], size: [2.2, .12, 1.8] });
    for (const x of [-4.14, -2.06]) tanks.push({ center: [x, 1.06, z], size: [.12, 1, 1.8] });
    for (const end of [-1, 1]) tanks.push({ center: [-3.1, 1.06, z + end * .84], size: [2.2, 1, .12] });
    for (const x of [-4.0, -2.2]) for (const end of [-1, 1]) tanks.push({ center: [x, .365, z + end * .65], size: [.12, .33, .12] });
    p.push(box("实际位于开口处理槽内且低于槽沿的独立液面", -3.1, 1.32, z, 1.94, .02, 1.54, "#7c9390"));
    for (const end of [-1, 1]) {
      p.push(cylinder("处理槽上方实际横跨胶片行进方向的金属导辊", -3.1, 1.78, z + end * .65, .16, 1.9, steel, [0, 0, 90]));
      for (const x of [-4.1, -2.1]) optical.push({ center: [x, 1.64, z + end * .65], size: [.12, .44, .18] });
    }
  }
  p.push(boxesMesh("前两座处理槽真实开口壁底与落地支脚的连续组", steel, tanks.slice(0, 18)), boxesMesh("末座处理槽真实开口壁底与落地支脚的连续组", steel, tanks.slice(18)));
  for (const x of [-14.8, .9]) for (const z of [-7.6, -.5, 7.5, 13.6]) structure.push({ center: [x, 2.55, z], size: [.28, 4.7, .28] });
  for (const z of [-.5, 7.5]) structure.push({ center: [-7, 4.80, z], size: [16, .24, .22] });
  for (const z of [-11, -5.5, 3, 11]) structure.push({ center: [8, 3.80, z], size: [14.3, .24, .22] });
  structure.push({ center: [-7, 3.80, -11], size: [16.2, .24, .22] });
  p.push(boxesMesh("暗室整高承柱与明暗两翼屋盖横梁真实接回承墙的结构组", steel, structure));
  drying.push({ center: [-11.3, .26, 4.3], size: [2.4, .12, 1.8] }, { center: [-11.3, 3.04, 4.3], size: [2.4, .12, 1.8] }, { center: [-11.3, 1.65, 5.14], size: [2.4, 2.9, .12] });
  for (const x of [-12.44, -10.16]) drying.push({ center: [x, 1.65, 4.3], size: [.12, 2.9, 1.8] });
  for (const x of [-12, -11.3, -10.6]) drying.push({ center: [x, 2.85, 4.335], size: [.04, .06, 1.57] });
  p.push(boxesMesh("湿处理区里保持真实内部空腔的落地胶片干燥柜", dark, drying), part("干燥柜前方实际嵌入四边框的薄玻璃柜门", "box", glass, [-11.3, 1.65, 3.43], [2.22, 2.76, .035], [0, 0, 0], { opacity: .25, roughness: .2 }));
  for (const z of [-3.3, .3]) {
    optical.push({ center: [12.4, 1.51, z], size: [1.3, .66, 1.35] }, { center: [12.4, 1.88, z], size: [.9, .16, 1] }, { center: [11.55, 1.49, z], size: [.12, .62, .8] });
  }
  p.push(boxesMesh("处理槽导辊承座与明室扫描台真实落台的光学外壳组", dark, optical));
  return p;
}

export const everydayMediaWorkplaceSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("暗廊湿处理扫描制作楼", "公共接片前厅分别接入无窗湿处理高厅和独立明室扫描翼；湿厅前后两端均以整高双折挡光廊组织真正曲折通路，开口处理槽旁的下凹排液沟由透空踏格跨越，明室后勤长廊另接扫描房与洁净整理房，高低屋盖沿不透光分隔壁闭合整楼", darkPassageFilmProcessingHouse, "建筑", "现代"),
];
