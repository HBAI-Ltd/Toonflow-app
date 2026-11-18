import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { stairFlight } from "./futureSpaceBatchSix";
import { xYWall } from "./futureSpaceBatchTen";
import { glazedFace, rectangle, wallYz } from "./everydayWorkplaceSpaceBatchOne";
import { base, box, design, pipe, rail, type ArchitecturePrototype } from "./structures";

const wallColor = "#b9b9af", concrete = "#a4aaa4", roofColor = "#87918c", glassColor = "#9ab9bc", dark = "#59676a";

export const everydayWorkplaceSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("双跨北光加工车间", "不等高的两跨车间由可通设备的真实门口连通，低跨连续锯齿屋面及竖向高窗提供天光，高跨保留门式钢架和运行梁，前侧独立管理夹层由实体楼梯进入", () => {
    const parts: ModelPart[] = [base(85, 85, 0.25), box("双跨加工车间完整连续地坪", 0, 0.4, 2, 56, 0.3, 56, concrete)];
    for (let bay = 0; bay < 4; bay++) {
      const a = -26 + bay * 14, b = a + 14;
      parts.push(part("低跨连续锯齿单元的真实封厚斜屋面", "extrude", roofColor, [-17, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: a, y: 7.5 }, { x: b, y: 9.5 }, { x: b, y: 9.28 }, { x: a, y: 7.28 }], depth: 22.8 }));
      if (bay < 3) parts.push(part("相邻锯齿屋面间完整竖向采光窗", "box", glassColor, [-17, 8.5, b], [22, 2, 0.06], [0, 0, 0], { opacity: 0.28, roughness: 0.2 }), box("锯齿高窗上边实际连接斜屋面的承梁", -17, 9.4, b, 22, 0.2, 0.22, dark), box("锯齿高窗下边实际连接下段斜屋面的承梁", -17, 7.5, b, 22, 0.2, 0.22, dark), box("锯齿高窗中部上下相接的竖框", -17, 8.5, b, 0.12, 2, 0.12, dark));
    }
    parts.push(part("高跨覆盖整条装配净空的完整双坡屋盖", "extrude", roofColor, [0, 0, 2], [1, 1, 1], [0, 0, 0], { profile: [{ x: -6.4, y: 11.5 }, { x: 11, y: 14.5 }, { x: 28.4, y: 11.5 }, { x: 28.4, y: 11.25 }, { x: 11, y: 14.25 }, { x: -6.4, y: 11.25 }], depth: 57 }));
    const shared: [number, number][] = [[-26, 0.25], [30, 0.25], [30, 11.5], [-26, 11.5]];
    parts.push(...glazedFace("两跨之间实际开通设备通门和上部高窗的整墙", "yz", shared, [-19, -5, 9, 23].map(z => rectangle(z, 9.8, 5.5, 1.2)), [-12, 12].map(z => rectangle(z, 0.55, 5.5, 4.5)), -6));
    const west: [number, number][] = [[-26, 0.25], [30, 0.25], [30, 9.5], [16, 7.5], [16, 9.5], [2, 7.5], [2, 9.5], [-12, 7.5], [-12, 9.5], [-26, 7.5]];
    parts.push(...glazedFace("低跨西侧与锯齿屋缘同形的完整开窗薄墙", "yz", west, [-19, -5, 9, 23].map(z => rectangle(z, 4.8, 6, 1.4)), [], -28), ...glazedFace("高跨东侧完整高窗薄墙", "yz", shared, [-19, -5, 9, 23].map(z => rectangle(z, 8.8, 6, 1.5)), [], 28));
    parts.push(...glazedFace("低跨前厅实际步行入口及管理层窗洞", "xy", [[-28, 0.25], [-6, 0.25], [-6, 7.5], [-28, 7.5]], [-24, -17, -10].map(x => rectangle(x, 4.85, 3, 1.4)), [rectangle(-17, 0.55, 1.8, 2.4)], -26), ...glazedFace("低跨后端实际设备门和高窗", "xy", [[-28, 0.25], [-6, 0.25], [-6, 9.5], [-28, 9.5]], [rectangle(-17, 7.4, 12, 1.1)], [rectangle(-17, 0.55, 7, 5)], 30));
    const gable: [number, number][] = [[-6, 0.25], [28, 0.25], [28, 11.5], [11, 14.5], [-6, 11.5]];
    for (const z of [-26, 30]) parts.push(...glazedFace("高跨前后实际开通大件装配门的完整山墙", "xy", gable, [rectangle(11, 9, 8, 2)], [rectangle(11, 0.55, 8, 6)], z));
    for (const z of [-23, -7, 9, 27]) parts.push(...[-6, 28].map(x => box("高跨门式钢架完整落地立柱", x, 6.025, z, 0.45, 10.95, 0.45, dark)), rail([-6, 11.25, z], [11, 14.25, z], 0.5, dark), rail([11, 14.25, z], [28, 11.25, z], 0.5, dark), box("高跨钢门架上部横向系梁", 11, 10.5, z, 34, 0.35, 0.35, dark));
    parts.push(...[-6, 28].map(x => box("高跨沿完整门架柱连续支承的运行梁", x, 8.2, 2, 0.35, 0.35, 54, dark)), box("跨接两侧运行梁的完整车间横梁", 11, 8, 13, 34, 0.4, 0.4, dark));
    parts.push(box("低跨前侧管理夹层完整楼板", -17, 3.85, -21.5, 20, 0.3, 9, concrete), box("管理夹层独立完整平顶", -17, 7.1, -21.5, 20.4, 0.3, 9.4, roofColor));
    for (const x of [-26, -8]) for (const z of [-25, -18]) parts.push(box("管理夹层接回车间地坪的完整细柱", x, 2.125, z, 0.25, 3.15, 0.25, concrete));
    parts.push(...glazedFace("管理夹层朝向车间实际开门的完整薄窗墙", "xy", [[-27, 4], [-7, 4], [-7, 6.95], [-27, 6.95]], [-20, -13].map(x => rectangle(x, 4.85, 3.5, 1.4)), [rectangle(-25.5, 4, 1.3, 2.3)], -17), wallYz("管理夹层西侧完整薄围护", [[-26, 4], [-17, 4], [-17, 6.95], [-26, 6.95]], [], -27, 0.12, wallColor), wallYz("管理夹层东侧完整薄围护", [[-26, 4], [-17, 4], [-17, 6.95], [-26, 6.95]], [], -7, 0.12, wallColor));
    for (let flight = 0; flight < 2; flight++) { const stairs = stairFlight("从车间地坪实际接入管理夹层正门的实体楼梯", [-25.5, 0.55 + flight * 1.725, -11.4 - flight * 2.8], 10, 0.1725, 0.28, 2.4); stairs.rotation.y = 90; parts.push(stairs); }
    for (const [x, width] of [[11, 8.5], [-17, 7.5]]) parts.push(part("后场平顺接入装配车辆门的完整宽短坡", "extrude", concrete, [x!, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: 30, y: 0.25 }, { x: 34, y: 0.25 }, { x: 30, y: 0.55 }], depth: width! }));
    parts.push(part("前场接入高跨大件装配门的完整宽短坡", "extrude", concrete, [11, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -30, y: 0.25 }, { x: -26, y: 0.25 }, { x: -26, y: 0.55 }], depth: 8.5 }), stairFlight("前场接入低跨管理前厅的两级短梯", [-17, 0.25, -27.4], 2, 0.15, 0.7, 2.4));
    return parts;
  }, "建筑", "现代"),
  design("三层货梯仓储楼", "三层重楼板仓库在正面连接独立开孔货梯塔，装卸前廊与低位货台接到各自入口，侧面坡道通入首层，后侧连续人行梯井实际串联三层仓储空间", () => {
    const parts: ModelPart[] = [base(73, 79, 0.25), box("多层仓库地面以下连续落地地基", 0, 0.525, 0, 36, 0.55, 40, concrete)], floors = [1.3, 6.1, 10.9], shaft: [number, number][] = [[-14.6, 7.1], [-11.4, 7.1], [-11.4, 14.4], [-14.6, 14.4]];
    for (let level = 0; level < 3; level++) {
      const top = floors[level]!;
      parts.push(polygon("仓储重楼板及后侧实际贯通的人行梯井", concrete, [[-18, -20], [18, -20], [18, 20], [-18, 20]], 0.5, [0, top - 0.5, 0], level ? [shaft] : []));
      if (level < 2) for (let flight = 0; flight < 2; flight++) parts.push(stairFlight("仓储楼后侧同井连续向上的人行实体梯段", [-13, top + flight * 2.4, 7.4 + flight * 3.36], 12, 0.2, 0.28, 2.4));
      if (level) parts.push(box("仓储人行楼梯上端实际接入库层的落脚台", -13, top - 0.25, 14.6, 3.2, 0.5, 1, concrete));
      if (level === 1) parts.push(box("仓储楼中层接入下一跑人行梯的实际起步台", -13, top - 0.25, 7.05, 3.2, 0.5, 1.1, concrete));
    }
    for (const x of [-15, 0, 15]) for (const z of [-17, 0, 17]) parts.push(box("多层仓储楼连续托住各重板的完整方柱", x, 8.4, z, 0.7, 14.2, 0.7, concrete));
    const frontWindows = floors.flatMap(top => [-12, -4, 4, 12].map(x => rectangle(x, top + 3.4, 4, 0.8))), sideWindows = floors.flatMap(top => [-15, -5, 5, 15].map(z => rectangle(z, top + 3.4, 4.5, 0.8))), frontDoors = floors.map(top => rectangle(12, top, 4.6, 3.3)); frontDoors.push(rectangle(-9, 1.3, 6, 3.3), rectangle(3.5, 1.3, 1.3, 2.4));
    const front: [number, number][] = [[-18, 0.25], [18, 0.25], [18, 15.5], [-18, 15.5]], side: [number, number][] = [[-20, 0.25], [20, 0.25], [20, 15.5], [-20, 15.5]];
    parts.push(...glazedFace("三层仓储楼各层实际货梯门及首层独立装卸入口", "xy", front, frontWindows, frontDoors, -20), ...glazedFace("三层仓储楼后端高窗及首层人行出口", "xy", front, frontWindows, [rectangle(-12.5, 1.3, 1.3, 2.4)], 20), ...glazedFace("多层仓储楼侧面实际叉车坡道入口和高窗", "yz", side, sideWindows, [rectangle(-8, 1.3, 6, 3.3)], -18), ...glazedFace("多层仓储楼东侧完整开窗薄墙", "yz", side, sideWindows, [], 18), box("多层仓储楼完整平屋盖", 0, 15.65, 0, 37, 0.3, 41, roofColor));
    for (const x of [-3.6, 3.6]) for (const z of [-3.6, 3.6]) parts.push(box("独立外置货梯塔从场坪到顶盖的完整导向立柱", 12 + x, 7.875, -24 + z, 0.3, 15.25, 0.3, dark));
    for (const top of floors) parts.push(polygon("仓库各层接到货梯的实际开孔装卸环台", concrete, [[8, -28], [16, -28], [16, -20], [8, -20]], 0.4, [0, top - 0.4, 0], [[[9.4, -26.6], [14.6, -26.6], [14.6, -21.4], [9.4, -21.4]]]));
    parts.push(box("外置货梯塔完整顶部承索盖", 12, 15.65, -24, 8.4, 0.3, 8.4, roofColor), box("货梯塔首层实际位于井孔内的独立载货平台", 12, 1.1, -24, 5, 0.4, 5, dark), ...[-1, 1].map(side => pipe("货梯顶盖实际承接载货台边缘的双侧起吊索", [12 + side * 2.4, 15.5, -24], [12 + side * 2.4, 1.3, -24], 0.08)), box("首层正面卸货前廊完整落地地台", -5, 0.775, -21, 26, 1.05, 2, concrete), box("前廊接向卡车尾门的完整低位货台", -9, 0.775, -25, 7, 1.05, 6, concrete), box("外置货梯前方独立卡车卸货平台", 12, 0.775, -31, 8, 1.05, 6, concrete));
    parts.push(part("场坪连续升入仓库侧叉车门的完整实体坡道", "extrude", concrete, [0, 0, -8], [1, 1, 1], [0, 0, 0], { profile: [{ x: -28, y: 0.25 }, { x: -18, y: 0.25 }, { x: -18, y: 1.3 }], depth: 5.5 }), stairFlight("场坪实际接入首层卸货前廊的人行短梯", [3.5, 0.25, -23.8], 6, 0.175, 0.3, 2));
    const rear = stairFlight("仓储楼后人行门实际接回场坪的短梯", [-12.5, 0.25, 21.8], 6, 0.175, 0.3, 2); rear.rotation.y = 90; parts.push(rear);
    return parts;
  }, "建筑", "现代"),
  design("回廊围场仓院", "三面仓房围出可驶入的开敞货场，等高装卸回廊和低檐雨棚沿内院连续布置，中央实体长坡接到仓房门口，北仓与两侧仓房通过实际门洞相通", () => {
    const parts: ModelPart[] = [base(91, 91, 0.25), box("北仓连续高位地坪及落地基座", 0, 0.775, 23, 60, 1.05, 14, concrete), ...[-1, 1].map(side => box("两侧长仓连续高位地坪及落地基座", side * 23, 0.775, -7, 14, 1.05, 46, concrete))];
    const veranda: [number, number][] = [[-16, -28], [-12, -28], [-12, 12], [12, 12], [12, -28], [16, -28], [16, 16], [-16, 16]];
    parts.push(polygon("环接三仓门口的完整U形装卸回廊", concrete, veranda, 0.3, [0, 1, 0]), polygon("装卸回廊上方连续低檐雨棚", roofColor, veranda, 0.2, [0, 4.8, 0]));
    for (const side of [-1, 1]) for (const z of [-26, -8, 10]) parts.push(box("装卸回廊边缘从场坪接到雨棚的完整细柱", side * 12, 2.525, z, 0.3, 4.55, 0.3, dark));
    for (const x of [-8, 8]) parts.push(box("北侧装卸回廊从场坪接到雨棚的完整细柱", x, 2.525, 12, 0.3, 4.55, 0.3, dark));
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? -30 : 16, x1 = side < 0 ? -16 : 30, y0 = side < 0 ? 7.6 : 8, y1 = side < 0 ? 8 : 7.6;
      parts.push(part("侧长仓背向货场缓降的完整单坡屋盖", "extrude", roofColor, [0, 0, -7.2], [1, 1, 1], [0, 0, 0], { profile: [{ x: x0, y: y0 }, { x: x1, y: y1 }, { x: x1, y: y1 - 0.22 }, { x: x0, y: y0 - 0.22 }], depth: 46.4 }));
      parts.push(...glazedFace("侧仓面向内院实际开通装卸口及高窗的薄墙", "yz", [[-30, 0.25], [16, 0.25], [16, 8], [-30, 8]], [-23, -8, 7].map(z => rectangle(z, 6, 6, 1.2)), [-20, -4, 12].map(z => rectangle(z, 1.3, 5, 3.2)), side * 16), ...glazedFace("侧仓背向内院完整开窗的外侧薄墙", "yz", [[-30, 0.25], [16, 0.25], [16, 7.6], [-30, 7.6]], [-23, -8, 7].map(z => rectangle(z, 5.5, 6, 1.1)), [], side * 30), ...glazedFace("侧仓面向前场实际开通车辆装卸门的端墙", "xy", [[x0, 0.25], [x1, 0.25], [x1, y1], [x0, y0]], [rectangle(side * 23, 6.1, 7, 0.9)], [rectangle(side * 23, 1.3, 6, 4)], -30));
      for (const z of [-27, -10, 7]) {
        parts.push(box("长仓外侧屋架完整落地立柱", side * 30, 4.34, z, 0.35, 6.08, 0.35, dark), box("长仓院侧屋架完整落地立柱", side * 16, 4.54, z, 0.35, 6.48, 0.35, dark), rail([side * 30, 7.38, z], [side * 16, 7.78, z], 0.35, dark));
      }
      parts.push(box("侧仓前车辆门外完整落地装卸台", side * 23, 0.775, -32, 6.5, 1.05, 4, concrete));
    }
    parts.push(part("北仓高于两侧仓房并向外后倾的完整单坡屋盖", "extrude", roofColor, [0, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: 16, y: 8.8 }, { x: 30.4, y: 8 }, { x: 30.4, y: 7.78 }, { x: 16, y: 8.58 }], depth: 60.8 }));
    const northDoors = [-10, 0, 10].map(x => rectangle(x, 1.3, 4, 3.2)); northDoors.push(rectangle(-23, 1.3, 3, 3.2), rectangle(23, 1.3, 3, 3.2));
    parts.push(...glazedFace("北仓回廊装卸口及连接两侧仓房的真实门洞", "xy", [[-30, 0.25], [30, 0.25], [30, 8.8], [-30, 8.8]], [-20, -10, 0, 10, 20].map(x => rectangle(x, 6.3, 6, 1.2)), northDoors, 16), ...glazedFace("北仓后侧完整高窗及人行出口", "xy", [[-30, 0.25], [30, 0.25], [30, 8], [-30, 8]], [-20, -10, 0, 10, 20].map(x => rectangle(x, 5.7, 6, 1.1)), [rectangle(0, 1.3, 1.3, 2.4)], 30));
    for (const x of [-30, 30]) parts.push(...glazedFace("北仓露出侧翼上方的完整端侧窗墙", "yz", [[16, 0.25], [30, 0.25], [30, 8], [16, 8.8]], [rectangle(23, 6, 6, 1)], [], x));
    for (const x of [-27, -18, -6, 6, 18, 27]) parts.push(box("北仓靠回廊屋架完整落地立柱", x, 4.94, 16, 0.35, 7.28, 0.35, dark), box("北仓后檐屋架完整落地立柱", x, 4.54, 30, 0.35, 6.48, 0.35, dark), rail([x, 8.58, 16], [x, 7.78, 30], 0.35, dark));
    parts.push(part("中央货场平顺接入装卸回廊的完整实体长坡", "extrude", concrete, [0, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -4, y: 0.25 }, { x: 12, y: 0.25 }, { x: 12, y: 1.3 }], depth: 4 }));
    const rear = stairFlight("北仓后人行门实际接回场坪的短梯", [0, 0.25, 31.8], 6, 0.175, 0.3, 2); rear.rotation.y = 90; parts.push(rear);
    return parts;
  }, "建筑", "现代"),
  design("夹层天井设计事务所", "普通设计办公大厅围住真实敞天小庭院，西侧和后侧局部会议夹层由独立实体梯接入，会议室与小办公室保留实际门口，开放工作桌与接待前厅位于下层", () => {
    const parts: ModelPart[] = [base(55, 49, 0.2)], court: [number, number][] = [[-2, -4], [6, -4], [6, 6], [-2, 6]], mezzanine: [number, number][] = [[-15, -13], [-5, -13], [-5, 8], [15, 8], [15, 13], [-15, 13]];
    parts.push(polygon("围绕真实天井的完整底层办公大厅地面", concrete, [[-16, -14], [16, -14], [16, 14], [-16, 14]], 0.25, [0, 0.2, 0], [court]), box("敞天小庭院独立下沉铺装地面", 2, 0.25, 1, 8, 0.1, 10, concrete), polygon("西侧与后侧连续相接的局部会议夹层", concrete, mezzanine, 0.25, [0, 3.05, 0]), polygon("保留相同敞天天井的完整平屋盖", roofColor, [[-16.4, -14.4], [16.4, -14.4], [16.4, 14.4], [-16.4, 14.4]], 0.3, [0, 6.45, 0], [court]));
    for (const [x, z] of [[-14.7, -12.7], [-5.3, -12.7], [-14.7, 7.7], [-5.3, 7.7], [-14.7, 12.7], [-5.3, 12.7], [7, 8.3], [14.7, 8.3]]) parts.push(box("会议夹层从大厅地面接起的完整细柱", x!, 1.75, z!, 0.25, 2.6, 0.25, concrete));
    for (const [a, b] of [[-13, -10.4], [-7.6, 8]]) parts.push(part("夹层侧缘给楼梯留真实入口的透光护壁", "box", glassColor, [-5, 3.8, (a! + b!) / 2], [0.08, 1, b! - a!], [0, 0, 0], { opacity: 0.24, roughness: 0.2 }));
    parts.push(part("后侧会议廊面向大厅的连续透光低护壁", "box", glassColor, [5, 3.8, 8], [20, 1, 0.08], [0, 0, 0], { opacity: 0.24, roughness: 0.2 }), part("夹层西缘与楼板相接的完整低护壁", "box", glassColor, [-15, 3.8, 0], [0.08, 1, 26], [0, 0, 0], { opacity: 0.24, roughness: 0.2 }), part("夹层前缘与楼板相接的完整低护壁", "box", glassColor, [-10, 3.8, -13], [10, 1, 0.08], [0, 0, 0], { opacity: 0.24, roughness: 0.2 }), part("夹层右端与楼板相接的完整低护壁", "box", glassColor, [15, 3.8, 10.5], [0.08, 1, 5], [0, 0, 0], { opacity: 0.24, roughness: 0.2 }));
    for (const [a, b] of [[-15, 7], [14, 15]]) parts.push(part("避开小办公室后墙的夹层背缘低护壁", "box", glassColor, [(a! + b!) / 2, 3.8, 13], [b! - a!, 1, 0.08], [0, 0, 0], { opacity: 0.24, roughness: 0.2 }));
    const courtyardX: [number, number][] = [[-2, 0.45], [6, 0.45], [6, 6.45], [-2, 6.45]], courtyardZ: [number, number][] = [[-4, 0.45], [6, 0.45], [6, 6.45], [-4, 6.45]];
    parts.push(...glazedFace("天井南面实际保留庭院门的完整薄窗墙", "xy", courtyardX, [rectangle(-0.5, 0.9, 1.5, 4.8), rectangle(4.5, 0.9, 1.5, 4.8), rectangle(2, 3.1, 1.6, 2.65)], [rectangle(2, 0.45, 1.6, 2.4)], -4), ...glazedFace("天井北面完整通高薄窗墙", "xy", courtyardX, [rectangle(2, 0.8, 6.6, 5.3)], [], 6), ...glazedFace("天井西面实际保留庭院门的完整薄窗墙", "yz", courtyardZ, [rectangle(-2, 0.9, 2.5, 4.8), rectangle(4, 0.9, 2.5, 4.8), rectangle(1, 3.1, 1.6, 2.65)], [rectangle(1, 0.45, 1.6, 2.4)], -2), ...glazedFace("天井东面完整通高薄窗墙", "yz", courtyardZ, [rectangle(1, 0.8, 8.6, 5.3)], [], 6), box("天井南门内与大厅同高的一步门槛", 2, 0.375, -3.7, 2, 0.15, 0.6, concrete), box("天井西门内与大厅同高的一步门槛", -1.7, 0.375, 1, 0.6, 0.15, 2, concrete));
    const frontWindows: [number, number][][] = [rectangle(-12, 1.2, 3.2, 1.4), rectangle(-7, 1.2, 3.2, 1.4), rectangle(-12, 4.1, 3.2, 1.4), rectangle(-7, 4.1, 3.2, 1.4), rectangle(-2, 1.2, 3.4, 4.4), rectangle(4, 1.2, 3, 4.4), rectangle(12, 1.2, 4, 4.4), rectangle(8, 3.1, 2.6, 2.6)], backWindows = [1.2, 4.1].flatMap(y => [-11, -3, 5, 12].map(x => rectangle(x, y, 4, 1.4)));
    parts.push(...glazedFace("事务所前厅实际入口及高低两排窗洞", "xy", [[-16, 0.2], [16, 0.2], [16, 6.45], [-16, 6.45]], frontWindows, [rectangle(8, 0.45, 2.6, 2.4)], -14), ...glazedFace("事务所背侧对应夹层的完整开窗薄墙", "xy", [[-16, 0.2], [16, 0.2], [16, 6.45], [-16, 6.45]], backWindows, [], 14), ...glazedFace("事务所西侧对应夹层的两排窗洞薄墙", "yz", [[-14, 0.2], [14, 0.2], [14, 6.45], [-14, 6.45]], [1.2, 4.1].flatMap(y => [-10, -3, 4, 11].map(z => rectangle(z, y, 3.2, 1.4))), [], -16), ...glazedFace("事务所东侧工作大厅完整高窗薄墙", "yz", [[-14, 0.2], [14, 0.2], [14, 6.45], [-14, 6.45]], [...[-10, -3, 4].map(z => rectangle(z, 1, 3.6, 4.6)), rectangle(11, 1.2, 3.2, 1.4), rectangle(11, 4.1, 3.2, 1.4)], [], 16));
    for (const x of [-15.8, 15.8]) for (const z of [-13.8, 13.8]) parts.push(box("事务所四角贯通接屋盖的完整细柱", x, 3.325, z, 0.25, 6.25, 0.25, concrete));
    for (const x of [-2, 6]) for (const z of [-4, 6]) parts.push(box("天井四角接到屋盖内缘的完整细柱", x, 3.45, z, 0.2, 6, 0.2, concrete));
    const room = (x0: number, x1: number, z0: number, z1: number, doorX: number) => {
      parts.push(xYWall("夹层会议或办公房真实开门的前薄隔墙", [[x0, 3.3], [x1, 3.3], [x1, 6.05], [x0, 6.05]], [rectangle(doorX, 3.3, 1.2, 2.3)], z0, 0.12, wallColor), part("夹层房间完整透光后薄隔墙", "box", glassColor, [(x0 + x1) / 2, 4.675, z1], [x1 - x0, 2.75, 0.08], [0, 0, 0], { opacity: 0.24, roughness: 0.2 }), ...[x0, x1].map(x => part("夹层房间完整透光侧薄隔墙", "box", glassColor, [x, 4.675, (z0 + z1) / 2], [0.08, 2.75, z1 - z0], [0, 0, 0], { opacity: 0.24, roughness: 0.2 })), box("夹层房间四壁实际承托的独立完整顶板", (x0 + x1) / 2, 6.125, (z0 + z1) / 2, x1 - x0, 0.15, z1 - z0, roofColor));
    };
    room(-14, -6, 5, 12, -10); room(7, 14, 10, 13, 10.5);
    for (let flight = 0; flight < 2; flight++) { const stairs = stairFlight("从工作大厅实际接入局部夹层的实体楼梯", [0.5 - flight * 2.75, 0.45 + flight * 1.425, -9], 10, 0.1425, 0.275, 2.4); stairs.rotation.y = 180; parts.push(stairs); }
    for (const z of [-9.9, -8.1]) parts.push(box("夹层上跑楼梯从大厅地面接起的完整承托细柱", -3.6, 1.1625, z, 0.25, 1.425, 0.25, concrete));
    for (const z of [-8, 8]) { parts.push(box("开放设计大厅完整长工作桌面", 9, 1.15, z, 6, 0.1, 1.4, concrete)); for (const x of [6.3, 11.7]) for (const side of [-1, 1]) parts.push(box("工作桌面实际接到大厅地面的完整桌脚", x, 0.775, z + side * 0.5, 0.1, 0.65, 0.1, dark)); }
    parts.push(box("事务所前厅独立接待工作台", 11, 1, -11, 3, 1.1, 1.1, concrete), stairFlight("场坪实际接入事务所前厅的两级短梯", [8, 0.2, -15.4], 2, 0.125, 0.7, 3.2));
    return parts;
  }, "建筑", "现代"),
];
