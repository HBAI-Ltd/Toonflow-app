import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { stairFlight } from "./futureSpaceBatchSix";
import { glazedFace, rectangle } from "./everydayWorkplaceSpaceBatchOne";
import { base, box, design, type ArchitecturePrototype } from "./structures";

const concrete = "#a4aaa4", roofColor = "#87918c", dark = "#59676a", timber = "#9c896f";

export const everydayWorkplaceSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("贯穿双道客车维保车间", "两条长车辆道从前门一直通到后门，中央及两外侧独立检修步台由各自实体梯进入，侧边两层办公区从步台末端人行门接入车间而不侵占车辆净空", () => {
    const roofY = (z: number) => 9.75 - z * 1.5 / 53, parts: ModelPart[] = [base(79, 79, 0.2), box("长客车维保车间完整连续车辆地坪", 0, 0.35, 0, 32, 0.3, 52, concrete)];
    const central: [number, number][] = [[-3, -24], [-1.4, -24], [-1.4, -19.5], [1.4, -19.5], [1.4, -24], [3, -24], [3, 24], [-3, 24]];
    parts.push(polygon("中央检修岛给独立楼梯留真实槽口的落地基座", concrete, central, 1.8, [0, 0.5, 0]), polygon("中央独立检修岛完整高位步台", concrete, central, 0.3, [0, 2.3, 0]));
    for (const side of [-1, 1]) parts.push(box("两外侧检修步台完整落地基座", side * 14.75, 1.4, 0, 2.5, 1.8, 48, concrete), box("两外侧检修步台完整高位行走面", side * 14.75, 2.45, 0, 2.5, 0.3, 48, concrete), box("中央检修岛面向车辆道的连续低护壁", side * 3, 3.1, 0, 0.08, 1, 48, dark), box("外侧检修步台面向车辆道的连续低护壁", side * 13.5, 3.1, 0, 0.08, 1, 48, dark));
    for (let flight = 0; flight < 2; flight++) parts.push(stairFlight("中央检修岛槽口内真实上行的实体梯段", [0, 0.5 + flight * 1.05, -24 + flight * 2.1], 7, 0.15, 0.3, 2.4));
    parts.push(box("中央检修岛楼梯上端实际接回步台的落脚台", 0, 2.45, -19.3, 2.8, 0.3, 1), box("中央检修岛上跑楼梯下方的落地支座", 0, 1.025, -20.8, 0.4, 1.05, 0.4, concrete));
    for (const side of [-1, 1]) {
      const x = side * 14.75;
      for (let flight = 0; flight < 2; flight++) parts.push(stairFlight("两外侧检修步台穿实际高门的实体前梯", [x, 0.5 + flight * 1.05, -28.2 + flight * 2.1], 7, 0.15, 0.3, 2.4));
      parts.push(box("外侧检修前梯低段实际接回场坪的基座", x, 0.35, -27.15, 2.6, 0.3, 2.1, concrete), box("外侧检修前梯上跑下方的落地支座", x, 1.025, -25, 0.4, 1.05, 0.4, concrete));
    }
    const frontDoors = [-8.25, 8.25].map(x => rectangle(x, 0.5, 7, 5)); frontDoors.push(rectangle(0, 0.5, 2, 2.5), rectangle(-14.75, 0.5, 1.7, 4.2), rectangle(14.75, 0.5, 1.7, 4.2));
    parts.push(...glazedFace("客车维保车间前端车辆道和步台梯实际门户", "xy", [[-16, 0.2], [16, 0.2], [16, roofY(-26)], [-16, roofY(-26)]], [-10, 0, 10].map(x => rectangle(x, 6.3, 6, 1.2)), frontDoors, -26), ...glazedFace("客车维保车间后端实际贯穿车辆道和人行出口", "xy", [[-16, 0.2], [16, 0.2], [16, roofY(26)], [-16, roofY(26)]], [-10, 0, 10].map(x => rectangle(x, 6.2, 6, 1.2)), [...[-8.25, 8.25].map(x => rectangle(x, 0.5, 7, 5)), rectangle(0, 0.5, 2, 2.5)], 26));
    const sideOutline: [number, number][] = [[-26, 0.2], [26, 0.2], [26, roofY(26)], [-26, roofY(-26)]];
    parts.push(...glazedFace("客车维保车间西侧完整高窗薄外墙", "yz", sideOutline, [-19, -5, 9, 23].map(z => rectangle(z, 6.5, 6, 1.4)), [], -16), ...glazedFace("步台后端实际通向办公区的人行门及观察窗", "yz", sideOutline, [...[-19, -5].map(z => rectangle(z, 6.5, 6, 1.4)), ...[9, 23].map(z => rectangle(z, 7.6, 6, 0.9)), rectangle(16, 4.7, 4, 1.4)], [rectangle(25, 0.5, 1.2, 2.3)], 16));
    parts.push(part("客车维保车间完整缓降厚屋盖", "extrude", roofColor, [0, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -26.5, y: 10.5 }, { x: 26.5, y: 9 }, { x: 26.5, y: 8.75 }, { x: -26.5, y: 10.25 }], depth: 33 }));
    for (const z of [-16, -2, 12, 24]) {
      const top = roofY(z) - 0.25;
      for (const x of [-16, 0, 16]) parts.push(box("长车间钢屋架完整落地承重柱", x, (0.5 + top) / 2, z, 0.4, top - 0.5, 0.4, dark));
      for (const x of [-8, 8]) parts.push(box("客车道上方高于车顶的完整跨间屋架梁", x, top, z, 16, 0.35, 0.35, dark));
    }
    parts.push(box("侧边办公区首层完整地面", 20, 0.35, 16, 8, 0.3, 20, concrete), polygon("侧边办公区二层实际保留梯井的楼板", concrete, [[16, 6], [24, 6], [24, 26], [16, 26]], 0.25, [0, 3.55, 0], [[[18.1, 8.2], [20.9, 8.2], [20.9, 14.2], [18.1, 14.2]]]), box("侧边办公区完整平屋盖", 20, 7.2, 16, 8.4, 0.3, 20.4, roofColor));
    const office: [number, number][] = [[16, 0.2], [24, 0.2], [24, 7.05], [16, 7.05]];
    parts.push(...glazedFace("维保办公区前侧实际主入口及两层窗洞", "xy", office, [rectangle(17.8, 1.4, 1.7, 1.3), rectangle(22.2, 1.4, 1.7, 1.3), rectangle(18, 4.7, 2.2, 1.4), rectangle(22, 4.7, 2.2, 1.4)], [rectangle(20, 0.5, 2.2, 2.4)], 6), ...glazedFace("维保办公区后侧完整两层窗墙", "xy", office, [rectangle(20, 1.4, 4.4, 1.3), rectangle(20, 4.7, 4.4, 1.4)], [], 26), ...glazedFace("维保办公区东侧完整开窗薄墙", "yz", [[6, 0.2], [26, 0.2], [26, 7.05], [6, 7.05]], [1.4, 4.7].flatMap(y => [9, 17, 23].map(z => rectangle(z, y, 2.6, y === 1.4 ? 1.3 : 1.4))), [], 24));
    for (const x of [16.2, 23.8]) for (const z of [6.2, 25.8]) parts.push(box("侧边办公区接到屋盖的完整落地细柱", x, 3.625, z, 0.25, 6.85, 0.25, concrete));
    for (let flight = 0; flight < 2; flight++) parts.push(stairFlight("维保办公区真正贯穿楼板梯井的实体梯段", [19.5, 0.5 + flight * 1.65, 8.5 + flight * 2.7], 10, 0.165, 0.27, 2.4));
    parts.push(box("维保办公区楼梯上端实际落脚的二层连接台", 19.5, 3.675, 14.4, 2.8, 0.25, 1, concrete), box("维保办公区地面独立接待工作台", 22.2, 1, 12, 1, 1.1, 3, timber), stairFlight("场坪接入办公前厅正门的两级短梯", [20, 0.2, 4.6], 2, 0.15, 0.7, 3));
    for (const x of [-8.25, 8.25]) {
      parts.push(part("前场平顺驶入贯通客车道的完整短坡", "extrude", concrete, [x, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -30, y: 0.2 }, { x: -26, y: 0.2 }, { x: -26, y: 0.5 }], depth: 7.5 }), part("贯通客车道后端驶回场坪的完整短坡", "extrude", concrete, [x, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: 26, y: 0.2 }, { x: 30, y: 0.2 }, { x: 26, y: 0.5 }], depth: 7.5 }));
    }
    parts.push(stairFlight("场坪实际接入中央检修岛前入口的两级短梯", [0, 0.2, -27.4], 2, 0.15, 0.7, 2.6));
    const rear = stairFlight("中央检修岛后人行门实际接回场坪的短梯", [0, 0.2, 27.4], 2, 0.15, 0.7, 2.6); rear.rotation.y = 90; parts.push(rear);
    return parts;
  }, "建筑", "现代"),
];
