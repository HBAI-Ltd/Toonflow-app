import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { helicalFlight } from "../masterTransport/parts";
import { stairFlight } from "./futureSpaceBatchSix";
import { glazedFace, rectangle } from "./everydayWorkplaceSpaceBatchOne";
import { base, box, design, type ArchitecturePrototype } from "./structures";

const concrete = "#a4aaa4", roofColor = "#87918c", roadColor = "#788485", dark = "#59676a";

export const everydayWorkplaceSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("半环坡道双层物流库", "前院半环宽坡把首层左门接到二层右门，二层库板在坡道终点真实开缺口并由门槛接回，弧形承梁和双侧护壁随坡连续，后场车辆门服务首层贯通通道", () => {
    const parts: ModelPart[] = [base(99, 99, 0.2), box("双层物流库完整连续落地地基", 0, 0.4, 0, 48, 0.4, 50, concrete)], stairHole: [number, number][] = [[-15.6, 8], [-12.4, 8], [-12.4, 17], [-15.6, 17]];
    parts.push(box("物流库首层完整重地坪", 0, 0.9, 0, 48, 0.6, 50, concrete), polygon("二层坡道入口及人行梯井实际让空的完整重楼板", concrete, [[-24, -25], [12.8, -25], [12.8, -23], [21.2, -23], [21.2, -25], [24, -25], [24, 25], [-24, 25]], 0.6, [0, 6.6, 0], [stairHole]), box("半环上行坡终点实际接入二层库板的门槛", 17, 6.9, -23.15, 8.4, 0.6, 0.9, concrete), box("双层物流库完整平屋盖", 0, 13.2, 0, 49, 0.3, 51, roofColor));
    const ramp = helicalFlight([0, 1, -23.5], 13, 21, 6, 0.5, 1, 0.4); ramp.name = "首层左前门连续回转到二层右前门的完整宽坡道"; ramp.color = roadColor; ramp.rotation.y = 180; parts.push(ramp);
    for (const [inner, outer] of [[13, 13.2], [20.8, 21]]) { const guard = helicalFlight([0, 1.7, -23.5], inner!, outer!, 6, 0.5, 1, 1); guard.name = "半环货车坡道连续随坡上升的真实低护壁"; guard.color = concrete; guard.rotation.y = 180; parts.push(guard); }
    for (const [inner, outer] of [[13.2, 14], [20, 20.8]]) { const beam = helicalFlight([0, 0.4, -23.5], inner!, outer!, 6, 0.5, 1, 0.8); beam.name = "半环宽坡下方连续随坡抬升的封厚承梁"; beam.color = dark; beam.rotation.y = 180; parts.push(beam); }
    for (const a of [Math.PI / 6, Math.PI / 2, Math.PI * 5 / 6]) for (const radius of [13.6, 20.4]) { const top = 6 * a / Math.PI + 0.1; parts.push(box("弧形承梁下方实际落到场坪的完整方墩", -Math.cos(a) * radius, (0.2 + top) / 2, -23.5 - Math.sin(a) * radius, 0.6, top - 0.2, 0.6, concrete)); }
    for (const x of [-20, -7, 7, 20]) for (const z of [-20, 0, 20]) parts.push(box("双层物流库避开车辆通道的连续重柱", x, 7.125, z, 0.8, 11.85, 0.8, concrete));
    const front: [number, number][] = [[-24, 0.2], [24, 0.2], [24, 13.05], [-24, 13.05]], side: [number, number][] = [[-25, 0.2], [25, 0.2], [25, 13.05], [-25, 13.05]], frontWindows = [...[-17, 0, 17].map(x => rectangle(x, 6, 6, 0.4)), ...[-17, 0].map(x => rectangle(x, 9.5, 6, 1.4))];
    parts.push(...glazedFace("物流库正面对应半环坡起终点的真实车辆门户", "xy", front, frontWindows, [rectangle(-17, 1.2, 8.4, 4.6), rectangle(0, 1.2, 8, 4.6), rectangle(17, 1.2, 8.4, 4.6), rectangle(17, 6.8, 8.4, 5.5)], -25), ...glazedFace("双层物流库后场首层真实车辆门与独立人行门", "xy", front, [6, 10.2].flatMap(y => [-17, 0, 17].map(x => rectangle(x, y, 6, y === 6 ? 0.4 : 1.5))), [rectangle(0, 1.2, 8, 4.6), rectangle(-12, 1.2, 1.3, 2.4)], 25));
    for (const x of [-24, 24]) parts.push(...glazedFace("双层物流库对应两层库区的完整高窗薄侧墙", "yz", side, [4.2, 10.2].flatMap(y => [-18, -6, 6, 18].map(z => rectangle(z, y, 6, 1.5))), [], x));
    for (let flight = 0; flight < 3; flight++) parts.push(stairFlight("独立人行梯井内连续接到二层的实体梯段", [-14, 1.2 + flight * 2, 8.3 + flight * 2.8], 10, 0.2, 0.28, 2.4));
    parts.push(box("人行楼梯上端实际接入二层库面的落脚台", -14, 6.9, 17.2, 3.2, 0.6, 1.2, concrete), box("人行楼梯中跑下方完整承托细柱", -14, 2.2, 12.5, 0.35, 2, 0.35, concrete), box("人行楼梯上跑下方完整承托细柱", -14, 3.2, 15.3, 0.35, 4, 0.35, concrete));
    parts.push(part("前院短距接入首层叉车门的完整实体坡道", "extrude", concrete, [0, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -34, y: 0.2 }, { x: -25, y: 0.2 }, { x: -25, y: 1.2 }], depth: 8 }), part("后场大车实际驶入首层通道的完整宽坡道", "extrude", concrete, [0, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: 25, y: 0.2 }, { x: 34, y: 0.2 }, { x: 25, y: 1.2 }], depth: 8.5 }));
    const rear = stairFlight("后场实际接入独立人行门的五级短梯", [-12, 0.2, 26.75], 5, 0.2, 0.35, 2); rear.rotation.y = 90; parts.push(rear);
    return parts;
  }, "建筑", "现代"),
];
