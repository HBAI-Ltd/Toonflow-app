import type { ModelPart, Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { waistStair } from "./publicSpaceBatchFourteen";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";
import { box, design } from "./structures";

const stone = "#b4b8ab", timber = "#a48c6b", pale = "#d2caba", steel = "#6c8581", fabric = "#9caaa0";

function interlockingMaisonettes(): ModelPart[] {
  const aHole: [number, number][] = [[-3.9, -2.65], [1.5, -2.65], [1.5, -1.35], [-3.9, -1.35]], bHole: [number, number][] = [[-1.5, 1.35], [3.9, 1.35], [3.9, 2.65], [-1.5, 2.65]];
  const p: ModelPart[] = [box("交错复式与中廊外阶共同落地的完整基础", -1, .11, 0, 14.8, .22, 15.6, stone), box("下跃户前通高厅经后寝厨卫连续相接的完整低地面", 0, .26, 0, 10, .08, 14, timber), box("只在中层出现且贯通两端入口的公共廊楼板", 0, 3.2, 0, 10, .2, 2, stone), box("上跃户在后半体内独立完整的中层起居楼板", 0, 3.2, 4, 10, .2, 6, timber), hardFloor("下跃户入门私廊保留向下进入通高前厅的真实阶井", timber, [[-5, -2.8], [5, -2.8], [5, -1], [-5, -1]], .2, [0, 3.1, 0], [aHole]), hardFloor("上跃户前寝区越过中廊并保留后厅上行私梯井的完整楼面", timber, [[-5, -7], [5, -7], [5, 2.8], [-5, 2.8]], .2, [0, 6.1, 0], [bHole]), box("两个互嵌复式完整封合并覆盖双通高厅的平屋盖", 0, 9.2, 0, 10.8, .2, 14.8, steel), box("中层公共廊外端真正接住外阶与门洞的完整平台", -6.15, 3.2, .15, 2.4, .2, 1.7, stone)];
  p.push(
    ...glazedWall("下跃户通高前厅在完整前壁中真实开出的两层大窗", [-5, -7], [5, -7], .3, 6.1, [[-2.5, 1.1, 3.8, 4.6], [2.5, 1.1, 3.8, 4.6]]),
    ...glazedWall("上跃户前部双寝区各自采光的完整上前壁", [-5, -7], [5, -7], 6.3, 9.1, [[-2.5, 7.15, 3.5, 1.6], [2.5, 7.15, 3.5, 1.6]]),
    ...glazedWall("后立面下层寝卫和上跃户通高后厅分别真实采光", [5, 7], [-5, 7], .3, 9.1, [[2.5, 1.1, 3, 1.6], [-2.5, 1.8, 2, .75], [2.5, 4.15, 3.8, 4.55], [-2.5, 4.15, 3.8, 4.55]]),
    ...glazedWall("中层公共廊通往下跃户私廊的完整分户门墙", [-5, -1], [5, -1], 3.3, 6.1, [], [[3.2, 3.3, 1, 2.15]]),
    ...glazedWall("中层公共廊通往上跃户中厅的完整分户门墙", [5, 1], [-5, 1], 3.3, 6.1, [], [[3.2, 3.3, 1, 2.15]]),
    ...glazedWall("下跃户前厅经低过厅进入后卧和后厨的真实内门", [-5, 1], [5, 1], .3, 3.1, [], [[-2.5, .3, .9, 2.1], [2, .3, 1, 2.1]]),
    ...glazedWall("下跃户后卧室与厨卫之间完整承托中厅的分隔", [0, 1], [0, 7], .3, 3.1, []),
    ...glazedWall("下跃户后厨进入独用卫浴的真实门及隔墙", [0, 4], [5, 4], .3, 3.1, [], [[-1.3, .3, .85, 2.1]]),
    ...glazedWall("上跃户私桥分别进入两卧及卫浴的真实上层门墙", [-5, -1], [5, -1], 6.3, 9.1, [], [[-2.7, 6.3, .9, 2.1], [.9, 6.3, .85, 2.1], [3.5, 6.3, .8, 2.1]]),
    ...glazedWall("上跃户左右独立卧室之间完整的分隔墙", [0, -7], [0, -1], 6.3, 9.1, []),
    ...glazedWall("上跃户后角卫浴与右卧室之间的纵向完整分隔", [2, -3.5], [2, -1], 6.3, 9.1, []),
    ...glazedWall("上跃户后角卫浴与右卧前寝区之间的横向完整分隔", [2, -3.5], [5, -3.5], 6.3, 9.1, []),
  );
  for (const side of [-1, 1]) {
    const x = side * 5, ends = (from: number, to: number): [[number, number], [number, number]] => side < 0 ? [[x, to], [x, from]] : [[x, from], [x, to]];
    p.push(...glazedWall("前半下跃通高厅和上跃寝区各自透光的整高端壁", ...ends(-7, -1), .3, 9.1, [[0, 1.1, 3.4, 4.6], [side < 0 ? 0 : -1, 7.15, side < 0 ? 3.2 : 2, 1.6], ...(side > 0 ? [[1.8, 8, 1.3, .75] as [number, number, number, number]] : [])]), ...glazedWall("后半下跃寝厨和上跃通高厅各自透光的整高端壁", ...ends(1, 7), .3, 9.1, [[0, 1.3, 3, 1.4], [0, 4.4, 3.6, 4.2]]), ...glazedWall("上下私层与公共中廊在外端分离的完整窗门壁", ...ends(-1, 1), .3, 9.1, [[0, 1.1, 1.2, 1.5], [0, 7.15, 1.2, 1.6], ...(side > 0 ? [[0, 4.15, 1.2, 1.6] as [number, number, number, number]] : [])], side < 0 ? [[0, 3.3, 1.2, 2.15]] : []));
  }
  const aStair = waistStair("下跃户从前厅沿私井完整上接入户私廊的十八级实阶", 0, 0, 0, 1.2, 18, 1 / 6, .3), bStair = waistStair("上跃户从后中厅沿私井完整上接跨廊私桥的十八级实阶", 0, 0, 0, 1.2, 18, 1 / 6, .3), outer = waistStair("地面沿西端独立接到唯一公共中层廊的十八级共阶", -6.6, .3, -6.1, 1.2, 18, 1 / 6, .3);
  aStair.position = { x: -3.9, y: .3, z: -2 }; aStair.rotation.y = 90; bStair.position = { x: 3.9, y: 3.3, z: 2 }; bStair.rotation.y = -90; p.push(aStair, bStair, outer);
  const frames: ModelPart[] = [];
  for (const [z, base, center, width] of [[-2.72, .3, 3.03, .14], [-.9, .3, 3.03, .14], [2.72, 3.3, 6.03, .14]]) {
    frames.push(meshBeam("中廊及两户私廊前缘实际接板并连接细承柱的完整横梁", [-4.94, center!, z!], [4.94, center!, z!], width!, steel));
    for (const x of [-4.8, 0, 4.8]) frames.push(meshBeam("各廊前梁下端真实落在所属完整生活地面的细承柱", [x, base!, z!], [x, center! - width! / 2, z!], width!, steel));
  }
  frames.push(meshBeam("公共中廊后缘实际嵌入下跃户分隔承墙的连续梁", [-5.08, 3.03, .9], [5.08, 3.03, .9], .14, steel));
  for (const x of [-7.2, -5.2]) for (const z of [-.6, .85]) frames.push(meshBeam("公共中廊外平台四角真实接地并顶住平台底的承柱", [x, .22, z], [x, 3.1, z], .2, steel));
  for (const z of [-.6, .85]) frames.push(meshBeam("公共中廊外平台底部连接角柱的完整横梁", [-7.3, 3, z], [-5.1, 3, z], .2, steel));
  for (let first = 0; first < frames.length; first += 16) p.push(combineMeshes("中廊互嵌私廊及外平台真实相接的完整梁柱体系", steel, frames.slice(first, first + 16)));
  const guards: ModelPart[] = [];
  const guard = (name: string, a: Triple, b: Triple, bottom: number) => { guards.push(meshBeam(name, a, b, .05, steel)); const count = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[2] - a[2]) / 2.4)); for (let i = 0; i <= count; i++) { const x = a[0] + (b[0] - a[0]) * i / count, z = a[2] + (b[2] - a[2]) * i / count; guards.push(meshBeam("私廊与平台护栏底端实落所属楼板的竖柱", [x, bottom, z], [x, a[1], z], .05, steel)); } };
  guard("下跃户私廊前沿临通高厅的完整护栏", [-4.94, 4.3, -2.72], [4.94, 4.3, -2.72], 3.3); guard("下跃户私阶井靠分户墙一侧的完整防落护栏", [-3.94, 4.3, -1.31], [1.5, 4.3, -1.31], 3.3); guard("下跃户私阶低端上方楼面真正封边的短护栏", [-3.94, 4.3, -2.72], [-3.94, 4.3, -1.31], 3.3);
  guard("上跃户私桥后沿临通高后厅的完整护栏", [-4.94, 7.3, 2.72], [4.94, 7.3, 2.72], 6.3); guard("上跃户私阶井面向跨廊走道的完整防落护栏", [-1.5, 7.3, 1.31], [3.94, 7.3, 1.31], 6.3); guard("上跃户私阶低端上方楼面真正封边的短护栏", [3.94, 7.3, 1.31], [3.94, 7.3, 2.72], 6.3);
  for (const [x, y, z, direction] of [[-3.9, .3, -2, 1], [3.9, 3.3, 2, -1]]) for (const side of [-1, 1]) {
    const a: Triple = [x! + direction! * .15, y! + 1 / 6, z! + side * .55], b: Triple = [x! + direction! * 5.25, y! + 3, z! + side * .55];
    guards.push(meshBeam("两户各自沿完整私阶程升高的连续扶手", [a[0], a[1] + .9, a[2]], [b[0], b[1] + .9, b[2]], .05, steel), meshBeam("私阶扶手低端真实落在首级踏面的短柱", a, [a[0], a[1] + .9, a[2]], .05, steel), meshBeam("私阶扶手高端真实落在末级踏面的短柱", b, [b[0], b[1] + .9, b[2]], .05, steel));
  }
  for (const side of [-1, 1]) {
    const x = -6.6 + side * .55; guards.push(meshBeam("公共外阶顺十八级程抬升的完整扶手", [x, .3 + 1 / 6 + .9, -5.95], [x, 4.2, -.85], .05, steel), meshBeam("公共外阶扶手首端实落首级踏面的立柱", [x, .3 + 1 / 6, -5.95], [x, .3 + 1 / 6 + .9, -5.95], .05, steel), meshBeam("公共外阶扶手末端实落末级踏面的立柱", [x, 3.3, -.85], [x, 4.2, -.85], .05, steel));
  }
  guard("公共中廊外平台后缘接到门侧外壁的护栏", [-7.3, 4.3, .95], [-5.1, 4.3, .95], 3.3); guard("公共中廊外平台西缘连续相接的护栏", [-7.3, 4.3, -.65], [-7.3, 4.3, .95], 3.3); guard("外平台前缘只为完整共阶留口的短护栏", [-6, 4.3, -.65], [-5.1, 4.3, -.65], 3.3);
  for (let first = 0; first < guards.length; first += 16) p.push(combineMeshes("两私阶井通高边缘和公共共阶真实接板的完整栏架", steel, guards.slice(first, first + 16)));
  const furniture: Record<string, ModelPart[]> = { [timber]: [], [pale]: [], [stone]: [], [fabric]: [] }, furnish = (name: string, color: string, x: number, y: number, z: number, w: number, h: number, d: number) => furniture[color]!.push(solidBox(name, x, y, z, w, h, d, color));
  for (const [x, y, z] of [[-2.6, .3, 4.5], [-2.6, 6.3, -4.6], [2.6, 6.3, -5.1]]) { furnish("两户各独立寝室真正落地的完整床架", timber, x!, y! + .2, z!, 1.7, .4, 2.1); furnish("独立床架上贴合的完整织物床垫", pale, x!, y! + .46, z!, 1.66, .12, 2.06); furnish("独立卧床后端实际落地的完整床头", timber, x!, y! + .62, z! + 1.05, 1.75, 1.24, .12); }
  for (const [x, y, z] of [[2, .3, -4.7], [1.8, 3.3, 5.8]]) { furnish("两通高厅各自完整接地的长沙发座", fabric, x!, y! + .22, z!, 3, .44, 1.1); furnish("长沙发后沿与座面真实相接的软靠背", fabric, x!, y! + .64, z! + .47, 3, .9, .16); furnish("通高厅低茶几真正落地的宽底脚", timber, x!, y! + .18, z! - 1.5, 1.4, .36, .75); furnish("低茶几宽底脚上贴合的完整桌面", stone, x!, y! + .39, z! - 1.5, 1.6, .06, .9); }
  for (const [x, y, z] of [[4.6, .3, 2.6], [-4.6, 3.3, 4.8]]) { furnish("各户独用厨房真正接地的完整长地柜", timber, x!, y! + .42, z!, .65, .84, 2.4); furnish("厨房长地柜上完整贴合的连续台面", stone, x!, y! + .88, z!, .7, .08, 2.45); }
  furnish("下跃户厨房不堵门的完整冰箱", pale, 1, 1.23, 2.5, .65, 1.86, .7); furnish("上跃户后厅厨房不堵私阶的完整冰箱", pale, -3.9, 4.23, 3.9, .65, 1.86, .7);
  for (const [y, showerX, showerZ, toiletX, toiletZ, sinkX, sinkZ] of [[.3, 3, 5.8, 2, 5.9, 4, 5], [6.3, 4.1, -2.6, 2.65, -1.65, 4.3, -1.6]]) { furnish("两户独用卫浴后侧接地的淋浴托盘", pale, showerX!, y! + .05, showerZ!, 1.2, .1, 1.05); furnish("独用卫浴侧边实际接地的坐便支座", pale, toiletX!, y! + .2, toiletZ!, .42, .4, .5); furnish("坐便支座上贴合的完整便座", pale, toiletX!, y! + .44, toiletZ!, .58, .12, .7); furnish("坐便座后沿相接的完整小水箱", pale, toiletX!, y! + .73, toiletZ! + .3, .55, .7, .18); furnish("两户卫浴近门处实际接地的洗手台柜", timber, sinkX!, y! + .42, sinkZ!, .6, .84, .55); furnish("洗手台柜上贴合的浅色盆台", pale, sinkX!, y! + .9, sinkZ!, .65, .12, .6); }
  for (const [color, pieces] of Object.entries(furniture)) for (let first = 0; first < pieces.length; first += 16) p.push(combineMeshes("互嵌两户各自完整卧厨卫厅内实际落地的家具", color, pieces.slice(first, first + 16)));
  return p;
}

export const everydayResidenceSpaceBatchEightDesigns = [
  design("中廊交错跃层复式公寓", "公共中层廊从独立外阶入户，下跃户经真实私阶井进入前通高厅和后低寝厨卫，上跃户由后中层通高厅经另一私阶井上接跨廊私桥和前寝区；两户上下互嵌但门、梯、卧卫各自独立，完整梁柱、护栏与外窗保留真实生活空间", interlockingMaisonettes, "建筑", "现代"),
];
