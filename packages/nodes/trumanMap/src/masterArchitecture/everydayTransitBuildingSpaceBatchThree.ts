import type { ModelPart, Triple } from "../assetModelParts";
import { boxBatch, hardPlan, profileBody } from "./everydayOutdoorSpaceBatchOne";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { doorway } from "./publicSpaceBatchOne";
import { box, design, type ArchitecturePrototype } from "./structures";

const paving = "#c7c0ad", asphalt = "#71817b", steel = "#667c7d", dark = "#465c60", wood = "#a68c69", pale = "#c6ccbf", white = "#d9ddc8";

export const everydayTransitBuildingSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("出发到达分流区域航站楼", "完整线性航站内前值机后候机与侧到达提取前接机四区分别由真墙门分开，值机行李带从低孔独立进入后勤，环形提取带另由后墙输入；空侧两条出发步行门和侧方到达门互不交叉，陆侧连续门廊接上直通落客车道", regionalAirTerminal, "建筑", "现代"),
];

function regionalAirTerminal(): ModelPart[] {
  const parts: ModelPart[] = [
    box("区域航站全部旅客厅机坪步道与落客路共用的完整场坪", 0, .08, 0, 86, .16, 72, asphalt),
    box("值机候机行李与接机四区连续同高的完整航站楼面", 0, .25, 0, 58, .18, 32, paving),
    box("值机与候机两大相连公共厅共同的完整高屋盖", -10, 5.9, 0, 38.5, .3, 32.5, steel),
    box("到达提取及前接机厅独立低翼的完整屋盖", 19.1, 4.4, 0, 20.3, .25, 32.5, steel),
    box("航站前完整接送步台直接连上全部公共出入口", 0, .25, -20, 64, .18, 8, paving),
    box("临街不封端的完整单向落客车道", 0, .18, -27, 80, .04, 6, asphalt),
    box("航站公共门前覆盖人行带且不侵占落客车道的完整雨檐", 0, 3.8, -19, 60, .2, 6, steel),
    ...glazedWall("值机大厅临街真正开出主次双门的完整通透前墙", [-29, -16], [9, -16], .34, 5.75, [[-16, 1.1, 4, 3], [1, 1.1, 12, 3]], [[-10, .34, 3.2, 3], [16, .34, 2.4, 2.8]]),
    ...glazedWall("候机大厅后侧真正分开的两道出发门和大面采光窗", [-29, 16], [9, 16], .34, 5.75, [[-16, 1.1, 4, 3], [-2, 1.1, 9, 3], [14.5, 1.1, 4, 3]], [[-10, .34, 3.2, 3], [7, .34, 3.2, 3]]),
    ...glazedWall("值机候机长西外墙的实际高窗与独立员工外门", [-29, -16], [-29, 16], .34, 5.75, [[-10, 1.3, 8, 2.8], [9, 1.3, 8, 2.8]], [[0, .34, 1.4, 2.5]]),
    ...glazedWall("出发区与到达低翼真正封合到屋盖的纵向分隔承墙", [9, -16], [9, 16], .34, 5.75, [[-10, 3.1, 4, .7]], [[-6, .34, 1.3, 2.5]]),
    ...glazedWall("值机与候机间保留旅客安检门整机带孔员工门及值机低孔", [-29, 0], [9, 0], .34, 5.75, [[-15, 1.6, 4, 2], [-4, 1.5, 5, 2]], [[6, .34, 2.2, 2.7], [15, .34, 1.3, 2.5], [-15, .34, 1.5, 1.05], [2, .34, 2.4, 1.9]]),
    ...glazedWall("接机厅向陆侧独立开出的出口与连续迎客窗", [9, -16], [29, -16], .34, 4.275, [[-6, 1.1, 4.5, 2], [6, 1.1, 4.5, 2]], [[1, .34, 2.8, 2.8]]),
    ...glazedWall("到达提取翼外侧的完整开窗墙及独立疏散门", [29, -16], [29, 16], .34, 4.275, [[-10, 1.1, 7, 2], [8, 1.1, 8, 2]], [[0, .34, 1.5, 2.6]]),
    ...glazedWall("空侧到达门与行李输入低孔分别贯穿的完整后墙", [9, 16], [29, 16], .34, 4.275, [[-6, 1.3, 4.8, 2], [2, 2.7, 4, 1]], [[7, .34, 2.4, 2.7], [1, .34, 1.8, 1.7]]),
    ...glazedWall("提取行李之后进入前接机厅的真实双通口分隔墙", [9, 0], [29, 0], .34, 4.275, [[0, 1.5, 5.5, 1.8]], [[-5, .34, 1.8, 2.7], [5, .34, 1.8, 2.7]]),
    doorway("旅客安检口内独立落地并保留真正穿行孔的门框", [-4, .34, .5], 2.2, 2.5, 1.4, 0, 2.2),
    profileBody("安检机上下贯通实际行李输送带的完整倒U检查机壳", steel, [[-1.1, 0], [-.8, 0], [-.8, .85], [.8, .85], [.8, 0], [1.1, 0], [1.1, 1.25], [-1.1, 1.25]], 3, [-8, .8, .5]),
    box("安检隧道内外连续相接且避开旅客穿行口的独立检查带", -8, .73, .5, 1.6, .14, 4.6, dark),
    hardPlan("值机柜后横带转向独立低孔的完整L形行李输送面", dark, [[-26, -5.6], [-7.5, -5.6], [-7.5, -4.4], [-24.4, -4.4], [-24.4, 4], [-25.6, 4], [-25.6, -4.4], [-26, -4.4]], .12, [0, .76, 0]),
    box("到达行李从后机坪通过专用低孔送到提取环上方的独立带", 20, 1.225, 14, 1.4, .15, 8, dark),
  ];
  const ellipse = (rx: number, rz: number): [number, number][] => Array.from({ length: 24 }, (_, i) => { const angle = i * Math.PI / 12; return [19 + Math.cos(angle) * rx, 8 + Math.sin(angle) * rz]; });
  parts.push(hardPlan("行李提取环下实际从楼面承起的连续空心环形机座", steel, ellipse(5.9, 3.1), .56, [0, .34, 0], [ellipse(4.85, 2.05)]), hardPlan("拥有真实中央安全岛孔的完整椭圆行李提取带", dark, ellipse(6, 3.2), .15, [0, .9, 0], [ellipse(4.8, 2)]), hardPlan("独立落地且低于提取带面的完整中央安全岛", pale, ellipse(4.8, 2), .65, [0, .34, 0]));
  const posts: Triple[] = [], lowPosts: Triple[] = [], beams: Triple[] = [], lowBeams: Triple[] = [], canopyPosts: Triple[] = [], benches: Triple[] = [], backs: Triple[] = [], benchFeet: Triple[] = [], counters: Triple[] = [], counterTops: Triple[] = [], luggageFeet: Triple[] = [], entryDashes: Triple[] = [], pathGuards: SolidBox[] = [];
  for (const z of [-14, -1.5, 14]) {
    for (const x of [-28.6, 8.6]) posts.push([x, 2.895, z]);
    beams.push([-10, 5.6, z]);
    for (const x of [9.4, 28.6]) lowPosts.push([x, 2.2175, z]);
    lowBeams.push([19, 4.175, z]);
  }
  for (const x of [-28, -14, 0, 14, 28]) canopyPosts.push([x, 2.02, -21]);
  for (const x of [-24, -17, -10]) { counters.push([x, .815, -8]); counterTops.push([x, 1.33, -8]); }
  for (const x of [-13, 2]) for (const z of [6, 11]) {
    benches.push([x, .76, z]); backs.push([x, 1.1, z + .34]);
    for (const offset of [-2.5, 2.5]) benchFeet.push([x + offset, .52, z]);
  }
  for (const x of [-24, -18, -12]) luggageFeet.push([x, .55, -5]);
  for (const z of [-2, 2]) luggageFeet.push([-25, .55, z]);
  for (const x of [-8.6, -7.4]) for (const z of [-1.1, 2.1]) luggageFeet.push([x, .55, z]);
  for (let i = 0; i < 22; i++) entryDashes.push([-37 + i * 3.5, .21, -27]);
  for (const x of [-20, -3, 26]) {
    parts.push(box("各自空侧门外与室内同高且直接通向机坪的完整步行台", x, .25, 23, 3.2, .18, 14, paving), profileBody("空侧步行台外端实际下降到机坪地面的短缓坡", paving, [[0, 0], [4, 0], [4, .16], [0, .34]], 3.2, [x, 0, 30], -90));
    for (const edge of [-1, 1]) {
      pathGuards.push({ center: [x + edge * 1.6, 1.315, 23], size: [.06, .05, 14] });
      for (const z of [17, 23, 29]) pathGuards.push({ center: [x + edge * 1.6, .815, z], size: [.06, .95, .06] });
    }
  }
  parts.push(
    ...boxBatch("出发主楼屋盖下面真正落到地面的完整边缘钢柱", steel, posts, [.35, 5.11, .4]),
    ...boxBatch("出发主楼由两侧落地柱直接接承的整跨屋梁", steel, beams, [37.6, .3, .35]),
    ...boxBatch("到达低翼内完整落地并避开门口的独立边柱", steel, lowPosts, [.3, 3.755, .35]),
    ...boxBatch("到达翼平屋盖下面直接承接外柱的完整横梁", steel, lowBeams, [19.5, .2, .3]),
    ...boxBatch("落客路边实际落到人行步台并接住雨檐的独立细柱", steel, canopyPosts, [.2, 3.36, .22]),
    ...boxBatch("三处值机柜真正落地并给两侧排队留出通路的柜体", pale, counters, [4.2, .95, 1.2]),
    ...boxBatch("值机柜台上实际接合柜体的完整宽台面", wood, counterTops, [4.35, .08, 1.35]),
    ...boxBatch("候机厅内不挡出发门路线的固定候机长坐板", wood, benches, [6, .12, .72]),
    ...boxBatch("候机坐板后侧直接接合的完整长靠背", wood, backs, [6, .68, .08]),
    ...boxBatch("各候机长凳真正由地面接到坐板的独立承脚", steel, benchFeet, [.12, .36, .5]),
    ...boxBatch("值机与检查输送带下面实际落地的独立承脚", steel, luggageFeet, [.16, .42, .4]),
    ...boxBatch("安检机壳双侧腿底实际落到楼面的独立长承座", steel, [[-8.95, .57, .5], [-7.05, .57, .5]], [.3, .46, 3]),
    ...boxBatch("到达后墙输入带在室内真正接地的承柱", steel, [[20, .745, 11], [20, .745, 15]], [.2, .81, .4]),
    ...boxBatch("输入带在室外机坪真正接地并接住带底的承柱", steel, [[20, .655, 17]], [.2, .99, .4]),
    ...boxBatch("落客车道前后贯通且不代替道路实体的独立断续白线", white, entryDashes, [1.8, .02, .08]),
  );
  for (let offset = 0; offset < pathGuards.length; offset += 20) parts.push(boxesMesh("空侧三条步行台沿临空边实际相接的安全栏杆", steel, pathGuards.slice(offset, offset + 20)));
  return parts;
}
