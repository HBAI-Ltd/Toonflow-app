import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { boxBatch, profileBody } from "./everydayOutdoorSpaceBatchOne";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchSteps";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { meshBeam } from "./vernacularWorldBatchFive";

const paving = "#c5beaa", steel = "#6a817f", pale = "#bcc5b7", dark = "#43595c", timber = "#a28c68", stone = "#adb2a4";

export const everydayTransitBuildingSpaceBatchSixDesigns: ArchitecturePrototype[] = [
  design("双浮箱候船水上巴士浮站", "双密闭分舱浮箱经横梁承住完整候船甲板，封闭候船厅与独立售票室从真门窗进入，两侧泊位真实让出登船口并带防撞护舷；四组导向桩滑套约束浮台，双端实际接平的铰接岸桥和岸头长阶连接公共岸台", floatingWaterBusStation, "建筑", "现代"),
];

function floatingWaterBusStation(): ModelPart[] {
  const parts: ModelPart[] = [
    box("双浮箱承梁上方贯通候船房两侧泊位的完整甲板", 0, 2.075, 0, 14, .25, 28, paving),
    box("候船室及外侧遮雨步廊共用的完整厚屋盖", 0, 5.7, 0, 12, .3, 16.6, steel),
    box("铰桥岸端与公共入口长阶直接相接的完整高岸承台", 0, 1.5, -38.5, 8, 3, 5, stone),
    profileBody("两端顶面准确接平岸台和浮台的完整薄壁铰接岸桥", steel, [[-36, 2.8], [-14, 2], [-14, 2.2], [-36, 3]], 3, [0, 0, 0], -90),
    cylinder("高岸端实承在双铰座中的完整横向岸桥销轴", 0, 2.9, -36, .18, 3.6, steel, [0, 0, 90]),
    cylinder("浮台端实承在双铰座中的完整横向岸桥销轴", 0, 2.1, -14, .18, 3.6, steel, [0, 0, 90]),
    ...glazedWall("接岸桥后真正进入候船厅的完整前墙与主门", [-5, -8], [5, -8], 2.2, 5.55, [[-3.4, 3, 2.2, 1.8], [3.4, 3, 2.2, 1.8]], [[0, 2.2, 2.6, 2.6]]),
    ...glazedWall("候船厅接向后甲板公共通路的真门及两侧大窗", [-5, 8], [5, 8], 2.2, 5.55, [[-3.4, 3, 2.2, 1.8], [3.4, 3, 2.2, 1.8]], [[0, 2.2, 2.6, 2.6]]),
    ...glazedWall("独立售票小室向中央通路真正开门的完整隔墙", [-1.5, -8], [-1.5, -2], 2.2, 5.55, [], [[0, 2.2, 1.2, 2.4]]),
    ...glazedWall("售票小室面向候船厅的实际开放服务窗口", [-5, -2], [-1.5, -2], 2.2, 5.55, [], [[0, 3, 2.4, 1.1]]),
    box("开放售票窗口下实际接到地面的完整柜台", -3.25, 2.6, -2, 2.4, .8, .7, timber),
  ];
  const crossBeams: Triple[] = [], bulkheads: SolidBox[] = [], guardMembers: SolidBox[] = [], roomPosts: Triple[] = [], roofBeams: Triple[] = [], seats: Triple[] = [], feet: Triple[] = [], hingeBlocks: Triple[] = [], footSupports: Triple[] = [], highStepBeams: Triple[] = [];
  const bridgeMembers: ModelPart[] = [], fenderStraps: ModelPart[] = [], stepGuards: ModelPart[] = [];
  for (const side of [-1, 1]) {
    const x = side * 4.5;
    parts.push(box("每侧密闭浮箱真正封水的完整薄底板", x, .05, 0, 3.2, .1, 28, steel), box("每侧浮箱和全部隔舱共用的完整薄顶盖", x, 1.55, 0, 3.2, .1, 28, steel));
    for (const edge of [-1, 1]) parts.push(box("浮箱两边从底到顶连续封合的完整长壁", x + edge * 1.55, .8, 0, .1, 1.4, 28, pale), box("浮箱首尾真正闭合端面的独立端壁", x, .8, edge * 13.95, 3, 1.4, .1, pale));
    for (const z of [-7, 0, 7]) bulkheads.push({ center: [x, .8, z], size: [3, 1.4, .1] });
    parts.push(...glazedWall("候船厅分别通向两侧泊位的实际登船门和完整侧窗", [side * 5, -8], [side * 5, 8], 2.2, 5.55, [[-5.2, 3, 3.6, 1.8], [5.2, 3, 3.6, 1.8]], [[0, 2.2, 2.4, 2.6]]));
    for (const z of [-7.5, -2.5, 7.5]) roomPosts.push([side * 4.8, 3.8, z]);
    for (const z of [-10, 10]) {
      parts.push(cylinder("浮站侧方真实贯穿滑套的独立高位导向桩", side * 8.5, 3.5, z, .35, 7, steel));
      const collar = ring("浮台沿导向桩上下移动的真实中空定位滑套", steel, .36, .12, 2.1, .4); collar.position.x = side * 8.5; collar.position.z = z; parts.push(collar);
      bridgeMembers.push(meshBeam("浮台边缘与导向滑套外壁实际搭接的短定位臂", [side * 7, 2.1, z], [side * 8.2, 2.1, z], .18, steel));
    }
    for (const z of [-8, 0, 8]) {
      parts.push(part("沿泊位外侧真实悬挂的独立防撞橡胶护舷", "torus", dark, [side * 7.15, 1.7, z], [.65, .65, .25], [0, 90, 0]));
      fenderStraps.push(meshBeam("每个防撞护舷真实接回甲板边缘的短吊带", [side * 6.95, 2.2, z], [side * 7.15, 2, z], .035, dark));
    }
    for (const [a, b] of [[-14, -2], [2, 14]]) {
      guardMembers.push({ center: [side * 7, 3.25, (a! + b!) / 2], size: [.06, .06, b! - a!] });
      for (const z of [a!, (a! + b!) / 2, b!]) guardMembers.push({ center: [side * 7, 2.725, z], size: [.06, 1.05, .06] });
    }
    guardMembers.push({ center: [side * 4.25, 3.25, -14], size: [5.5, .06, .06] });
    for (const x of [side * 1.5, side * 4.25]) guardMembers.push({ center: [x, 2.725, -14], size: [.06, 1.05, .06] });
    bridgeMembers.push(meshBeam("铰接过桥底面实际贴承薄桥板的独立纵向钢梁", [side * 1.3, 2.75, -36], [side * 1.3, 1.95, -14], .14, steel), meshBeam("完整铰接岸桥两侧随桥面准确下降的连续扶手", [side * 1.5, 4.05, -36], [side * 1.5, 3.25, -14], .06, steel));
    for (const t of [0, .25, .5, .75, 1]) bridgeMembers.push(meshBeam("岸桥扶手从各处实际斜桥面升起的独立短立杆", [side * 1.5, 3 - t * .8, -36 + t * 22], [side * 1.5, 4.05 - t * .8, -36 + t * 22], .06, steel));
    hingeBlocks.push([side * 1.65, 2.9, -36], [side * 1.65, 2.1, -14]);
    guardMembers.push({ center: [side * 4, 4.05, -38.5], size: [.06, .06, 5] }, { center: [side * 3, 4.05, -41], size: [2, .06, .06] }, { center: [side * 2.75, 4.05, -36], size: [2.5, .06, .06] });
    for (const z of [-41, -38.5, -36]) guardMembers.push({ center: [side * 4, 3.525, z], size: [.06, 1.05, .06] });
    for (const [x, z] of [[side * 2, -41], [side * 1.5, -36]]) guardMembers.push({ center: [x!, 3.525, z!], size: [.06, 1.05, .06] });
    seats.push([side * 3.8, 2.61, 4.5]);
    for (const z of [3.1, 5.9]) feet.push([side * 3.8, 2.375, z]);
  }
  for (const z of [-12, -6, 0, 6, 12]) crossBeams.push([0, 1.775, z]);
  for (const z of [-7.5, -2.5, 7.5]) roofBeams.push([0, 5.45, z]);
  guardMembers.push({ center: [0, 3.25, 14], size: [14, .06, .06] });
  for (const x of [-7, -3.5, 0, 3.5, 7]) guardMembers.push({ center: [x, 2.725, 14], size: [.06, 1.05, .06] });
  for (let flight = 0; flight < 2; flight++) {
    const y = flight * 1.5, z = -47.8 + flight * 3.8;
    parts.push(stairFlight("从岸后地面真实连续升到高岸候行台的十级实阶", 0, y, z, 4, 10, .15, .3));
    if (!flight) parts.push(box("岸头两段长阶之间与踏面准确齐平的完整休息平台", 0, 1.4, -44.4, 4, .2, .8, paving));
    for (const side of [-1, 1]) {
      stepGuards.push(meshBeam("高岸公共长阶沿逐级踏面上升的完整安全扶手", [side * 2, y + 1.2, z + .15], [side * 2, y + 2.55, z + 2.85], .06, steel));
      for (const [run, lift] of [[.15, .15], [2.85, 1.5]]) stepGuards.push(meshBeam("高岸长阶扶手两端真正接到独立踏面的完整短立杆", [side * 2, y + lift!, z + run!], [side * 2, y + lift! + 1.05, z + run!], .06, steel));
      if (!flight) stepGuards.push(meshBeam("高岸相邻梯段扶手跨休息平台实际连成的转接段", [side * 2, y + 2.55, z + 2.85], [side * 2, y + 2.7, z + 3.95], .06, steel));
    }
  }
  highStepBeams.push([0, 1.4, -42.5]); footSupports.push([0, .65, -44.4], [0, .65, -42.5]);
  parts.push(
    boxesMesh("两侧浮箱内部保持真实封闭隔舱的完整横隔壁", pale, bulkheads),
    ...boxBatch("两浮箱顶盖之间直接接承完整候船甲板的独立横梁", steel, crossBeams, [12.5, .35, .3]),
    ...boxBatch("候船室屋梁下面真正从甲板起立的独立细钢柱", steel, roomPosts, [.2, 3.2, .24]),
    ...boxBatch("候船室边柱之间实际顶接屋盖的完整横梁", steel, roofBeams, [10, .2, .25]),
    ...boxBatch("岸台与浮台铰轴两端实际固定的完整承座", steel, hingeBlocks, [.3, .4, .6]),
    ...boxBatch("候船室内避开前后门及侧泊位门的固定长坐板", timber, seats, [.7, .12, 3.5]),
    ...boxBatch("候船长坐板下面真实落到甲板的独立承脚", steel, feet, [.45, .35, .12]),
    ...boxBatch("高岸长阶的中平台和高段梁下真正接地的承柱", stone, footSupports, [.45, 1.3, .5]),
    ...boxBatch("岸头高段实阶底部不侵入踏面的完整承梁", steel, highStepBeams, [3.4, .2, 3]),
    combineMeshes("各泊位防撞护舷的独立甲板吊带", dark, fenderStraps),
    combineMeshes("岸头两段实阶的扶手与逐级踏面立杆完整连接", steel, stepGuards),
  );
  for (let offset = 0; offset < bridgeMembers.length; offset += 16) parts.push(combineMeshes("定位臂岸桥底梁和全部斜扶手保持实际端点连接", steel, bridgeMembers.slice(offset, offset + 16)));
  for (let offset = 0; offset < guardMembers.length; offset += 20) parts.push(boxesMesh("浮站甲板四周保留接岸口与双侧真实登船口的完整护栏", steel, guardMembers.slice(offset, offset + 20)));
  return parts;
}
