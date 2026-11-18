import { ring, type ModelPart } from "../assetModelParts";
import { combineMeshes, sweptProfile } from "../masterNature/shared";
import { hardPlan, profileBody } from "./everydayOutdoorSpaceBatchOne";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { standingPanel } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchSteps";
import { box, cylinder, design, pipe, type ArchitecturePrototype } from "./structures";
import { meshBeam } from "./vernacularWorldBatchFive";

const paving = "#c5bca7", stone = "#afb2a3", steel = "#667c7b", dark = "#455a5d", glass = "#a4c5c2", roof = "#87998d", timber = "#a58a64";

export const everydayTransitBuildingSpaceBatchSevenDesigns: ArchitecturePrototype[] = [
  design("阶梯月台山坡缆索铁路站", "一条实际倾斜标准轨道进入坡屋站房，两侧连续小踏步月台升到完整高端横厅，斜窗和侧承墙跟随同一坡度；独立曳引机房通过对位带孔和楼面槽容纳主索及驱动轮，前端短阶与后端连续长阶各自接回公共地面，不含缆索铁路车辆", inclinedFunicularStation, "建筑", "现代"),
];

function inclinedFunicularStation(): ModelPart[] {
  const floorAt = (z: number) => 1.2 + (z + 18) * .4;
  const hallOutline: [number, number][] = [[-6, 6], [-.3, 6], [-.3, 8.2], [.3, 8.2], [.3, 6], [6, 6], [6, 16], [-6, 16]];
  const parts: ModelPart[] = [
    box("斜轨站房前后入口和公共长阶共用的完整落地基础", 0, .09, 9, 20, .18, 72, paving),
    profileBody("单条斜轨从低端到高端连续上升的完整承重道床", stone, [[-18, .18], [5, .18], [5, 9.53], [-18, .33]], 3.2, [0, 0, 0], -90),
    profileBody("与斜轨月台同坡且完整封厚的连续站房坡屋盖", roof, [[-18, 5.2], [6, 14.8], [6, 15.1], [-18, 5.5]], 12.8, [0, 0, 0], -90),
    hardPlan("高端站厅承台从前缘真正留出主索穿楼面槽的完整实体", stone, hallOutline, 10.62, [0, .18, 0]),
    box("高端公共横厅和完整驱动机房共用的厚平屋盖", 0, 14.95, 11, 12.8, .3, 10.5, roof),
    ...glazedWall("低端站房分别让出低位列车入口和高位旅客门的完整端墙", [-6, -18], [6, -18], .18, 5.2, [], [[0, .18, 3.4, 4.6], [-3.8, 1.2, 2, 2.8], [3.8, 1.2, 2, 2.8]]),
    ...glazedWall("高端横厅前墙实际对位两侧月台门和低位主索孔", [-6, 6], [6, 6], .18, 14.8, [], [[-3.8, 10.8, 2.4, 3], [3.8, 10.8, 2.4, 3], [0, 9.8, .6, 1]]),
    ...glazedWall("后端公共长阶准确进入高位横厅的实际主门和双窗", [-6, 16], [6, 16], 10.8, 14.8, [[-4.2, 11.7, 2.6, 2], [4.2, 11.7, 2.6, 2]], [[0, 10.8, 3, 2.8]]),
  ];
  const sleepers: SolidBox[] = [], footRails: ModelPart[] = [], transverseFrames: ModelPart[] = [], machineSpokes: ModelPart[] = [], machineGuards: SolidBox[] = [];
  for (const side of [-1, 1]) {
    parts.push(profileBody("阶梯月台下方逐段实承踏面的完整斜坡基础", stone, [[-18, .18], [6, .18], [6, 10.8], [-18, 1.2]], 4.4, [side * 3.8, 0, 0], -90), stairFlight("低端公共地面真正接到站房旅客门的六级短阶", side * 3.8, .18, -20.1, 2, 6, .17, .35));
    for (let flight = 0; flight < 8; flight++) parts.push(stairFlight("沿斜轨逐级上行且完整接到横厅的八级站台实阶", side * 3.8, 1.2 + flight * 1.2, -18 + flight * 3, 4.4, 8, .15, .375));
    const windows: [number, number][][] = [[-16.5, -12], [-10.5, -6], [-4.5, 0], [1.5, 5]].map(([a, b]): [number, number][] => [[a!, floorAt(a!) + 1.2], [b!, floorAt(b!) + 1.2], [b!, floorAt(b!) + 3.1], [a!, floorAt(a!) + 3.1]]);
    const sideWall = standingPanel("斜月台外侧跟随踏面与坡屋面完整封合的厚承墙", stone, [[-18, 1.2], [6, 10.8], [6, 14.8], [-18, 5.2]], windows, 0, .24); sideWall.rotation.y = -90; sideWall.position.x = side * 6; parts.push(sideWall);
    for (const window of windows) { const pane = standingPanel("与斜站台真实墙孔逐角对齐的独立透明斜窗", glass, window, [], 0, .035); pane.rotation.y = -90; pane.position.x = side * 6; pane.opacity = .25; pane.roughness = .2; parts.push(pane); }
    parts.push(...glazedWall("高端横厅两侧真正由地台升到平屋盖的完整高窗外墙", [side * 6, 6], [side * 6, 16], 10.8, 14.8, [[0, 11.8, 7, 1.9]]));
    const rail = profileBody("内侧维持标准轨距且整段沿同一斜度上升的完整工字钢轨", steel, [[-.07, 0], [.07, 0], [.07, .04], [.02, .04], [.02, .16], [.035, .16], [.035, .2], [-.035, .2], [-.035, .16], [-.02, .16], [-.02, .04], [-.07, .04]], 23, [side * .7525, .45, -6.5]);
    for (const p of rail.vertices!) p.y += (p.z + 11.5) * .4;
    parts.push(rail);
    for (const z of [-16, -8, 0, 5]) {
      const top = floorAt(z) + 3.8;
      transverseFrames.push(meshBeam("斜站房侧承墙内真正从基础升起的独立承重柱", [side * 5.75, .18, z], [side * 5.75, top, z], .25, steel));
    }
    for (const z of [7, 14.5]) transverseFrames.push(meshBeam("高端横厅两侧从地台完整接到屋梁的短柱", [side * 5.75, 10.8, z], [side * 5.75, 14.5, z], .25, steel));
  }
  for (let i = 0; i < 38; i++) sleepers.push({ center: [0, .39, -17.7 + i * .6], size: [2.5, .12, .2] });
  for (let offset = 0; offset < sleepers.length; offset += 20) {
    const ties = boxesMesh("斜承床上每根上下表面均同坡且真实接承钢轨的独立枕木", timber, sleepers.slice(offset, offset + 20));
    for (const p of ties.vertices!) p.y += (p.z + 18) * .4;
    parts.push(ties);
  }
  for (const z of [-16, -8, 0, 5]) transverseFrames.push(meshBeam("两侧整高边柱之间实际贴接斜屋盖底面的完整横梁", [-5.85, floorAt(z) + 3.875, z], [5.85, floorAt(z) + 3.875, z], .25, steel));
  for (const z of [7, 14.5]) transverseFrames.push(meshBeam("高端公共横厅直接顶接平屋盖的整跨屋梁", [-5.85, 14.65, z], [5.85, 14.65, z], .3, steel));
  const gradient = .4, cableRadius = 1.24, wheelZ = 8.4, normal = Math.hypot(1, gradient), wheelY = .52 + (wheelZ + 18) * gradient + cableRadius * normal, tangentZ = wheelZ + cableRadius * gradient / normal, tangentY = wheelY - cableRadius / normal;
  const wheel = ring("位于封闭机房内并与主索切线对位的完整曳引槽轮", steel, 1.2, .18, wheelY, .25); wheel.position.z = wheelZ; wheel.rotation.z = 90;
  const wrap = sweptProfile("主索从斜道切线连续绕过曳引轮的实际半周缆索", dark, Array.from({ length: 8 }, (_, i): [number, number] => [cableRadius + Math.cos(i * Math.PI / 4) * .04, Math.sin(i * Math.PI / 4) * .04]), Math.PI, 16), c = -1 / normal, s = gradient / normal;
  wrap.vertices = wrap.vertices!.map(p => ({ x: p.y, y: wheelY + c * p.x + s * p.z, z: wheelZ + s * p.x - c * p.z }));
  parts.push(wheel, wrap, pipe("斜道中央主索真正穿端墙低孔和楼面槽接到曳引轮切点", [0, .52, -18], [0, tangentY, tangentZ], .08), cylinder("主曳引轮两边实际进入轴承座的完整横向驱动轴", 0, wheelY, wheelZ, .22, 1.8, steel, [0, 0, 90]), box("驱动轴右侧实际落在支座上的完整齿轮电机箱", 1.2, wheelY, wheelZ, 1.1, 1, 1.2, dark), box("电机箱底部从高端楼面完整升起的独立实承座", 1.2, (10.8 + wheelY - .5) / 2, wheelZ, 1.1, wheelY - .5 - 10.8, 1.2, stone), box("回程索进入机房上方独立转向护罩的完整壳体", .2, wheelY + 1, wheelZ - .5, 1.3, .6, .9, dark), box("转向护罩侧边从地台完整接到罩底的独立承柱", .7, (10.8 + wheelY + .7) / 2, wheelZ - .5, .2, wheelY + .7 - 10.8, .3, steel));
  parts.push(box("列车在高端横厅前真实停止且不封住下方主索的止挡横头", 0, 10.45, 4, 2.5, .3, .35, dark));
  for (const side of [-1, 1]) {
    parts.push(box("高端轨道止挡横头下实际嵌入斜承床的独立钢脚", side * .95, 9.65, 4, .18, 1.3, .25, steel));
    transverseFrames.push(meshBeam("尽端止挡由后部斜承床实际接回横头的完整后撑", [side * .95, 9.53, 5], [side * .95, 10.4, 4], .14, steel));
  }
  parts.push(cylinder("主轴与全部轮辐之间实际压合的完整曳引轮厚毂", 0, wheelY, wheelZ, .5, .35, steel, [0, 0, 90]));
  for (const side of [-1, 1]) {
    const bearing = ring("驱动轴两端真实包住轴身的中空环形轴承壳", steel, .23, .12, wheelY, .4); bearing.position.x = side * .7; bearing.position.z = wheelZ; bearing.rotation.z = 90;
    parts.push(bearing, box("曳引轮轴承壳从高端楼面完整升起的独立实承轴座", side * .7, (10.8 + wheelY - .2) / 2, wheelZ, .4, wheelY - .2 - 10.8, .7, stone));
  }
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    machineSpokes.push(meshBeam("曳引轮主轴真实连接完整槽圈的径向轮辐", [0, wheelY + Math.cos(a) * .12, wheelZ + Math.sin(a) * .12], [0, wheelY + Math.cos(a) * 1.02, wheelZ + Math.sin(a) * 1.02], .1, steel));
  }
  for (const side of [-1, 1]) {
    machineGuards.push({ center: [side * 2, 11.85, 8.5], size: [.06, .06, 5] });
    for (const z of [6, 8.5, 11]) machineGuards.push({ center: [side * 2, 11.325, z], size: [.06, 1.05, .06] });
  }
  machineGuards.push({ center: [0, 11.85, 11], size: [4, .06, .06] });
  for (const x of [-2, 0, 2]) machineGuards.push({ center: [x, 11.325, 11], size: [.06, 1.05, .06] });
  for (let flight = 0; flight < 6; flight++) {
    const y = .18 + flight * 1.77, z = 41.6 - flight * 4.4;
    parts.push(stairFlight("后端公共入口从地面完整上接高横厅的十二级长阶", 0, y, z, 3, 12, .1475, .3, true));
    if (flight) parts.push(box("高段长阶下面不悬空的完整填实承台", 0, (.18 + y) / 2, z - 1.8, 3.1, y - .18, 3.6, stone));
    if (flight < 5) parts.push(box("相邻公共长阶之间与全部踏面同高的实心休息平台", 0, (.18 + y + 1.77) / 2, z - 4, 3.1, y + 1.77 - .18, .8, paving));
    for (const side of [-1, 1]) {
      const x = side * 1.5;
      footRails.push(meshBeam("高端长阶每段随踏面准确升高的连续安全扶手", [x, y + .1475 + 1.05, z - .15], [x, y + 2.82, z - 3.45], .06, steel));
      for (const [run, lift] of [[.15, .1475], [3.45, 1.77]]) footRails.push(meshBeam("公共长阶扶手两端真正接到逐级踏面的独立立杆", [x, y + lift!, z - run!], [x, y + lift! + 1.05, z - run!], .06, steel));
      if (flight < 5) footRails.push(meshBeam("两段长阶扶手经实际休息平台连续相接的短转接段", [x, y + 2.82, z - 3.45], [x, y + 1.77 + .1475 + 1.05, z - 4.55], .06, steel));
    }
  }
  parts.push(boxesMesh("封闭驱动机房与公共横厅之间真正落地的安全隔栏", steel, machineGuards), combineMeshes("主曳引轮全部轮辐与轴心槽圈实际接合", steel, machineSpokes));
  for (let offset = 0; offset < transverseFrames.length; offset += 16) parts.push(combineMeshes("斜候车站房及高横厅全部真实接承屋面的梁柱架", steel, transverseFrames.slice(offset, offset + 16)));
  for (let offset = 0; offset < footRails.length; offset += 16) parts.push(combineMeshes("后公共长阶全部扶手与逐级立杆保持连续端接", steel, footRails.slice(offset, offset + 16)));
  return parts;
}
