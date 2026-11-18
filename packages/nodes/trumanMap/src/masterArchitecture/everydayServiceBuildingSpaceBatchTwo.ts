import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { hardFloor } from "./vernacularWorldBatchSix";
import { stairFlight } from "./futureSpaceBatchSix";
import { glazedFace, rectangle } from "./everydayWorkplaceSpaceBatchOne";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";

const paving = "#bab9a9", asphalt = "#657273", wall = "#c9c5b3", steel = "#657c7e", wood = "#a48c69", dark = "#485d61";

export const everydayServiceBuildingSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("双庭接还分流汽车租赁服务站", "T形服务站房把两侧交接车庭分开，东侧还车道经后方横向通道转入西侧取车道，公共前门直接进入接待前厅，中央员工纵廊串联两侧实际开门的钥匙交接室与后勤室，侧边有独立承顶的连续步廊且不占车辆回转断面", rentalReturnStation, "建筑", "现代"),
  design("穿楼车口观训廊驾校服务楼", "两侧考务教室之间保留贯穿车辆口，二层封闭观训廊跨在车口上方并面向后练车庭，西翼双段实体梯经实际楼板梯井连接上层，两侧公众门和车口相互分开，所有上层楼面与屋盖由边墙和完整落地门架承托", drivingSchoolServiceBuilding, "建筑", "现代"),
  design("双阶席贯穿车道汽车拍卖馆", "中央车辆道从前门直通后门，两侧三阶竞价席由前后独立实体梯接入，前观众登记室连外侧人行通道；后方上层工作人员横廊与拍卖控制室由独立双跑梯进入，横廊在车辆上方保留净空，完整双坡与高采光带由落地柱承接", carAuctionBuilding, "建筑", "现代"),
];

function rentalReturnStation(): ModelPart[] {
  const footprint: [number, number][] = [[-6, -18], [6, -18], [6, -2], [10, -2], [10, 16], [-10, 16], [-10, -2], [-6, -2]], parts: ModelPart[] = [
    box("租赁服务站双车庭与后方连接道共用的完整落地场坪", 0, .1, 0, 66, .2, 62, asphalt), hardFloor("接待前厅中央纵廊和两侧交接房连续T形实体楼面", paving, footprint, .205, [0, 0, 0]), box("窄前厅实际由前侧墙承住的完整低厚屋盖", 0, 3.71, -10, 12.4, .22, 16.4, steel), box("后交接与员工房完整横向高厚屋盖", 0, 4.71, 7, 20.4, .22, 18.4, steel),
    ...glazedWall("接待前厅面向公共步道的真实主门及两侧橱窗", [-6, -18], [6, -18], .2, 3.6, [[-3.9, .7, 2.5, 2.3], [3.9, .7, 2.5, 2.3]], [[0, .2, 2.6, 2.7]]), ...[-1, 1].flatMap(side => glazedWall("窄接待前厅两侧完整实际开窗的承屋墙", [side * 6, -18], [side * 6, -2], .2, 3.6, [[-4.5, .7, 4, 2.3], [3.7, .7, 4, 2.3]])),
    ...glazedWall("窄前厅通向高后厅纵廊的真实内门与两翼外窗", [-10, -2], [10, -2], .2, 4.6, [[-8, .75, 2.5, 2.3], [8, .75, 2.5, 2.3], [0, 3.95, 7.5, .45]], [[0, .2, 2.4, 2.6]]), ...[-1, 1].flatMap(side => glazedWall(side < 0 ? "取车钥匙交接室面向西车庭的真实客户入口和高窗" : "还车核验室面向东车庭的真实客户入口和高窗", [side * 10, -2], [side * 10, 16], .2, 4.6, [[-6.5, 2.6, 2.4, 1.1], [5.2, 1, 4.4, 2.3]], [[-3, .2, 2.2, 2.6]])),
    ...glazedWall("后勤房与员工纵廊分别接向独立后步道的真实三门", [-10, 16], [10, 16], .2, 4.6, [[-3.6, 2.7, 2.2, .9], [3.6, 2.7, 2.2, .9]], [[-7, .2, 1.2, 2.5], [0, .2, 1.5, 2.5], [7, .2, 1.2, 2.5]]),
    ...[-1, 1].flatMap(side => glazedWall("员工中央纵廊真正通向前交接室和后勤室的长分门墙", [side * 2, -2], [side * 2, 16], .2, 4.6, [], [[-4.5, .2, 1.2, 2.5], [5, .2, 1.2, 2.5]])), ...[-1, 1].flatMap(side => glazedWall("交接室后方实际开门接通本侧后勤室的完整隔墙", [side < 0 ? -10 : 2, 8], [side < 0 ? -2 : 10, 8], .2, 4.6, [], [[0, .2, 1.2, 2.5]])),
    box("公共前门到场地外沿独立于车辆入口的连续人行铺面", 0, .1025, -24.5, 3.8, .205, 13, paving), box("后勤出口外侧避开后横向车道的连续步行平台", 0, .1025, 17.5, 21, .205, 3, paving),
    box("接待前厅内不挡中央通路的固定服务长台", -4.4, .735, -9, 1, 1.07, 5, wood), box("还车室内沿后隔墙布置的固定核验长台", 6.2, .735, 6.9, 5.6, 1.07, 1, wood), box("取车室内避开客户侧门的固定钥匙交接台", -6.2, .735, 6.9, 5.6, 1.07, 1, wood),
  ];
  for (const side of [-1, 1]) {
    parts.push(box("从各侧车庭实际接到交接室侧门的连续同高步廊", side * 12, .1025, 7, 4, .205, 18, paving), box("侧步廊从首端到后勤门完整连续的独立厚雨盖", side * 12, 3.4, 7, 4.2, .2, 18.4, steel));
    for (const z of [-.5, 7, 14.5]) parts.push(cylinder("侧廊外缘避开车道且从场坪实托雨盖的完整细柱", side * 13.6, 1.75, z, .18, 3.1, steel), box("从站房承墙一直接到侧廊柱顶的完整短横梁", side * 11.8, 3.24, z, 3.8, .12, .16, dark));
    for (const z of [-10, 0, 10]) parts.push(box("两侧车庭保持中部驶行带开敞的独立交接停靠边线", side * 23.5, .205, z, 6, .01, .08, paving));
  }
  const keyRack: SolidBox[] = [];
  for (const side of [-1, 1]) {
    keyRack.push({ center: [side * 9.45, 1.2, 12.4], size: [.18, 2, 4.6] });
    for (const z of [10.5, 11.5, 12.5, 13.5, 14.5]) keyRack.push({ center: [side * 9.15, 1.2, z], size: [.42, 2, .07] });
    for (const y of [.65, 1.35, 2.05]) keyRack.push({ center: [side * 9.15, y, 12.5], size: [.42, .07, 4.3] });
  }
  parts.push(boxesMesh("两侧后勤室内依墙而立的原生分格交接物架", wood, keyRack));
  return parts;
}

function carAuctionBuilding(): ModelPart[] {
  const end: [number, number][] = [[-15, 0], [15, 0], [15, 6.03], [4.5, 6.8], [4.5, 7.8], [-4.5, 7.8], [-4.5, 6.8], [-15, 6.03]], parts: ModelPart[] = [
    box("拍卖馆和前后车辆等待庭共用的完整落地场坪", 0, .1, 0, 48, .2, 58, asphalt), box("车辆道竞价阶席与两侧人行通道共同的完整同高厅面", 0, .1025, 0, 30, .205, 42, paving), box("中央高采光带顶部真正连续的厚平屋盖", 0, 7.9, 0, 9.4, .2, 43, steel),
    part("西侧从低外墙升至中央采光带的完整厚坡屋面", "extrude", steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 43, profile: [{ x: -15.2, y: 6.0 }, { x: -4.5, y: 6.8 }, { x: -4.5, y: 7.0 }, { x: -15.2, y: 6.2 }] }), part("东侧从中央采光带降至低外墙的完整厚坡屋面", "extrude", steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 43, profile: [{ x: 4.5, y: 6.8 }, { x: 15.2, y: 6.0 }, { x: 15.2, y: 6.2 }, { x: 4.5, y: 7.0 }] }),
    ...glazedFace("竞价馆前端真实车辆门和独立观众门的完整异形立面", "xy", end, [rectangle(-8.5, 3.5, 7, 1.8), rectangle(8.5, 3.5, 7, 1.8), rectangle(0, 5.6, 7, 1.7)], [rectangle(0, .2, 6, 3.3), rectangle(-12.5, .2, 1.6, 2.6), rectangle(12.5, .2, 1.6, 2.6)], -21),
    ...glazedFace("竞价馆后端真实车辆出口与侧人门的完整异形立面", "xy", end, [rectangle(-9, 4.4, 7, 1.1), rectangle(9, 4.4, 7, 1.1), rectangle(0, 6.85, 7, .65)], [rectangle(0, .2, 6, 3.3), rectangle(-12.5, .2, 1.6, 2.6)], 21),
    ...[-1, 1].flatMap(side => glazedWall("竞价馆外侧通道上方连续开高窗并实际嵌入坡檐的完整承屋墙", [side * 15, -21], [side * 15, 21], .2, 6.03, [[-13, 3.5, 9, 1.6], [0, 3.5, 9, 1.6], [13, 3.5, 9, 1.6]])), ...[-1, 1].flatMap(side => glazedWall("双坡屋面之间真实竖立且开长窗的中央高采光壁", [side * 4.5, -21], [side * 4.5, 21], 6.8, 7.8, [[-13, 7.0, 10, .6], [0, 7.0, 10, .6], [13, 7.0, 10, .6]])),
    box("后上层工作人员横廊真正跨过车道的连续完整楼板", 0, 3.825, 16.7, 28, .25, 4.6, paving), box("横廊中央拍卖控制室完整的独立厚顶", 0, 6.75, 16.7, 9.2, .2, 4.8, steel), ...glazedWall("拍卖控制室朝向车辆和竞价席的真实宽观察窗", [-4.5, 14.4], [4.5, 14.4], 3.95, 6.65, [[0, 4.45, 7.4, 1.8]]), ...glazedWall("控制室后方实际开窗的完整围墙", [-4.5, 19], [4.5, 19], 3.95, 6.65, [[0, 4.6, 6, 1.5]]), ...glazedWall("工作人员从横廊实际进入控制室的侧门", [4.5, 14.4], [4.5, 19], 3.95, 6.65, [], [[0, 3.95, 1.2, 2.4]]), box("控制室西侧从横廊板真实升起的完整封墙", -4.5, 5.3, 16.7, .24, 2.7, 4.6, wall), box("控制室内面向前竞价席的固定拍卖工作长台", 0, 4.5, 15.4, 6.6, 1.1, .8, wood),
    stairFlight("东侧人行通道独立上接工作人员中平台的下跑实体梯", [12.5, .2, 6.8], 10, .1875, .3, 2), box("工作人员双跑梯中段实际承接两跑的完整平平台", 12.5, 1.95, 10.1, 2.4, .25, .6, paving), box("工作人员梯中平台下完整落到地面的真实支柱", 12.5, 1.0125, 10.1, .3, 1.625, .3, steel), stairFlight("工作人员上跑实体梯真正接近后方上层横廊", [12.5, 2.075, 10.4], 10, .1875, .3, 2, .18), box("工作人员梯高端真正接回横廊前缘的平落脚板", 12.5, 3.825, 13.95, 2.4, .25, 1.1, paving),
  ];
  const supports: SolidBox[] = [], benchLegs: SolidBox[] = [], benches: SolidBox[] = [];
  for (const side of [-1, 1]) {
    for (const z of [-19, -7, 7, 19]) supports.push({ center: [side * 4.5, 4, z], size: [.25, 7.6, .25] }, { center: [side * 14.75, 3.125, z], size: [.25, 5.85, .25] });
    for (let row = 0; row < 3; row++) {
      const x = side * (5.7 + row * 1.8), top = .65 + row * .45;
      parts.push(box("逐级独立落地且向中央车辆道展开的竞价阶席实体", x, (top + .2) / 2, 0, 1.8, top - .2, 22, paving));
      benches.push({ center: [x, top + .45, 0], size: [.45, .1, 20] }, { center: [x + side * .30, top + .70, 0], size: [.08, .25, 20] });
      for (const z of [-9, -3, 3, 9]) benchLegs.push({ center: [x, top + .20, z], size: [.17, .4, .2] }, { center: [x + side * .30, top + .4, z], size: [.08, .8, .18] });
    }
    for (const z of [-12.5, 12.5]) { const stair = stairFlight("观众从两端实际逐级登上竞价席的独立横梯", [side * 4.5, .2, z], 9, .15, .6, 3); stair.rotation.y = side < 0 ? 180 : 0; parts.push(stair); }
    parts.push(...glazedWall("观众登记室从前门实际接入外侧人行通道的后隔墙", [side < 0 ? -15 : 10.5, -15], [side < 0 ? -10.5 : 15, -15], .2, 3.2, [], [[0, .2, 1.5, 2.5]]), ...glazedWall("观众登记室面向中央区真实开服务窗的短侧隔墙", [side * 10.5, -21], [side * 10.5, -15], .2, 3.2, [[0, 1.05, 3.4, 1.5]]), box("登记窗口内真实依墙且不挡外侧入口的服务柜", side * 11, .725, -18, .8, 1.05, 3.6, wood), box("中央车辆道和前竞价席之间连续落地的低保护边台", side * 3.8, .35, 0, .18, .3, 23, steel));
    for (const z of [15, 18.4]) for (const x of [3.9, 13.6]) supports.push({ center: [side * x, 1.95, z], size: [.25, 3.5, .25] });
    for (const z of [15, 18.4]) supports.push({ center: [side * 8.75, 3.6, z], size: [10, .2, .25] });
    for (const z of [14.45, 18.95]) {
      const endX = side > 0 && z < 16 ? 11.15 : 13.8;
      parts.push(rail([side * 4.65, 5.0, z], [side * endX, 5.0, z], .05, steel));
      for (const x of [4.65, 9.2, endX]) supports.push({ center: [side * x, 4.475, z], size: [.05, 1.05, .05] });
    }
  }
  for (const z of [15, 18.4]) supports.push({ center: [0, 3.6, z], size: [8.05, .2, .25] });
  for (const x of [11.5, 13.5]) for (const [startZ, endZ, low, high] of [[6.8, 9.8, .2, 2.075], [10.4, 13.4, 2.075, 3.95]]) {
    parts.push(rail([x, low! + .95, startZ!], [x, high! + .95, endZ!], .045, steel));
    supports.push({ center: [x, low! + .475, startZ!], size: [.045, .95, .045] }, { center: [x, high! + .475, endZ!], size: [.045, .95, .045] });
  }
  for (let start = 0; start < supports.length; start += 20) parts.push(boxesMesh("高采光屋盖及后横廊每跨真实承载的完整柱梁", steel, supports.slice(start, start + 20)));
  for (let start = 0; start < benches.length; start += 20) parts.push(boxesMesh("六列竞价阶席固定长凳实际分开的坐面与靠背", wood, benches.slice(start, start + 20)));
  for (let start = 0; start < benchLegs.length; start += 20) parts.push(boxesMesh("逐列固定长凳真实落在相应阶面的独立承脚", steel, benchLegs.slice(start, start + 20)));
  return parts;
}

function drivingSchoolServiceBuilding(): ModelPart[] {
  const upper: [number, number][] = [[-15, -12], [-4.5, -12], [-4.5, -1], [4.5, -1], [4.5, -12], [15, -12], [15, 8], [-15, 8]], hole: [number, number][] = [[-13.6, -10.2], [-11.2, -10.2], [-11.2, -3.2], [-13.6, -3.2]], parts: ModelPart[] = [
    box("驾校站楼前庭与后训练庭连为一体的完整落地场坪", 0, .1, 0, 52, .2, 66, asphalt), box("西侧考务与楼梯厅真正连续落地的首层楼面", -9.75, .1025, -2, 10.5, .205, 20, paving), box("东侧教室与候考厅真正连续落地的首层楼面", 9.75, .1025, -2, 10.5, .205, 20, paving), hardFloor("上层两翼与跨车口观训廊连为一体且真正留梯井的U形楼面", paving, upper, .25, [0, 3.8, 0], [hole]), hardFloor("两翼与跨口观训廊逐边闭合的完整U形厚屋盖", steel, upper, .25, [0, 7.1, 0]),
    ...[-1, 1].flatMap(side => glazedWall("两侧考务教室前立面实际分开的人行门和上下窗", [side < 0 ? -15 : 4.5, -12], [side < 0 ? -4.5 : 15, -12], .2, 7.1, [[-3.5, 1, 2.2, 2.1], [3.5, 1, 2.2, 2.1], [0, 4.6, 7.8, 1.9]], [[0, .2, 1.8, 2.6]])),
    ...[-1, 1].flatMap(side => glazedWall("考务教学翼完整外承墙的两层真实窗洞", [side * 15, -12], [side * 15, 8], .2, 7.1, [[-6, 1.1, 4, 1.9], [4.5, 1.1, 5, 1.9], [-6, 4.6, 4, 1.9], [4.5, 4.6, 5, 1.9]])),
    ...[-1, 1].flatMap(side => glazedWall("面向中央车庭的两层前翼真实采光承墙", [side * 4.5, -12], [side * 4.5, -1], .2, 7.1, [[-2.5, 1.1, 3.5, 1.9], [2.5, 1.1, 3.5, 1.9], [-2.5, 4.6, 3.5, 1.9], [2.5, 4.6, 3.5, 1.9]])), ...[-1, 1].flatMap(side => glazedWall("跨口观训廊下方避开车道的完整侧承墙", [side * 4.5, -1], [side * 4.5, 8], .2, 3.8, [[0, 1.1, 4.5, 1.9]])),
    ...glazedWall("上层观训廊在通高前庭上方真正开窗的前立面", [-4.5, -1], [4.5, -1], 4.05, 7.1, [[0, 4.6, 6.8, 1.9]]), ...glazedWall("面向训练庭的完整后立面真实保留车口人门和观训高窗", [-15, 8], [15, 8], .2, 7.1, [[-10, 4.6, 7.5, 1.9], [0, 4.6, 7.5, 1.9], [10, 4.6, 7.5, 1.9]], [[-9.75, .2, 1.6, 2.6], [0, .2, 8.6, 3.3], [9.75, .2, 1.6, 2.6]]),
    ...[-1, 1].flatMap(side => glazedWall("二层前翼真实开门接到后观训廊的分室墙", [side < 0 ? -15 : 4.5, -1], [side < 0 ? -4.5 : 15, -1], 4.05, 7.1, [], [[0, 4.05, 1.4, 2.5]])),
    stairFlight("西翼首层真实向梯井内上行的下跑实体梯", [-12.4, .2, -10], 11, .175, .27, 2), box("双跑楼梯之间与两段梯体实接的中间平平台", -12.4, 2, -6.73, 2.4, .25, .6, paving), box("中间平平台下真实落到首层地面的承重短柱", -12.4, 1.0375, -6.73, .3, 1.675, .3, steel), stairFlight("真正穿过二层梯井并上接观训楼面的上跑实体梯", [-12.4, 2.125, -6.43], 11, .175, .27, 2, .18), box("梯井高端真正跨接楼梯与二层楼面的落脚平台", -12.4, 3.925, -3.3, 2.4, .25, .6, paving),
    box("西翼地面考务接待区避开楼梯和主门的固定服务柜", -6.4, .735, -7.2, 1, 1.07, 4.8, wood), box("东翼候考厅沿外墙布置且保留前后门走道的固定长座", 13.7, .46, -5, .8, .52, 8, wood), box("二层观训廊面向后庭且不挡前翼门口的连续观察台", 0, 4.6, 6.8, 22, 1.1, .75, wood),
    box("西侧公共门与车道分开的真实前人行接道", -9.75, .1025, -17, 3, .205, 10, paving), box("东侧公共门与车道分开的真实前人行接道", 9.75, .1025, -17, 3, .205, 10, paving),
  ];
  for (const z of [-.5, 7.5]) {
    for (const x of [-4.7, 4.7]) parts.push(box("车口两侧从地面完整升到上层楼板的承重边柱", x, 1.9, z, .28, 3.4, .28, steel));
    parts.push(box("跨过车辆净空且直接托住观训廊楼板的门架横梁", 0, 3.65, z, 9.7, .3, .3, dark));
  }
  for (const x of [-14.7, -4.7, 4.7, 14.7]) for (const z of [-11.7, 7.7]) parts.push(box("两层教学翼从落地楼面实接屋盖的完整细柱", x, 3.65, z, .25, 6.9, .25, steel));
  const fixtures: SolidBox[] = [], posts: SolidBox[] = [];
  for (const side of [-1, 1]) {
    for (const [startZ, endZ, low, high] of [[-10, -7.03, .2, 2.125], [-6.43, -3.46, 2.125, 4.05]]) {
      parts.push(rail([-12.4 + side, low! + .95, startZ!], [-12.4 + side, high! + .95, endZ!], .045, steel));
      posts.push({ center: [-12.4 + side, low! + .475, startZ!], size: [.045, .95, .045] }, { center: [-12.4 + side, high! + .475, endZ!], size: [.045, .95, .045] });
    }
    for (const z of [15, 21, 27]) fixtures.push({ center: [side * 11.5, .205, z], size: [7, .01, .075] }, { center: [side * 15, .205, z - 2.7], size: [.075, .01, 5.5] });
  }
  parts.push(boxesMesh("两跑楼梯扶手两端真实接到踏面的独立栏杆立柱", steel, posts), boxesMesh("后训练庭避开主车行线的原生训练停车标线", paving, fixtures));
  return parts;
}
