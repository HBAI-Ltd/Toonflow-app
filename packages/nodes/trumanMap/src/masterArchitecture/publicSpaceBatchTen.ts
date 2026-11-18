import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, design, rail, colors } from "./structures";
import { halfDomeRoof, halfRoundWall } from "./spatialShells";
import { doorway } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchTwo";
import { bankedTrack, type TrackSample } from "./publicSpaceBatchFive";

const stone = "#b3b5a7", dark = "#52696c", wood = "#ac936b", white = "#d8dbcf";

export const publicSpaceBatchTenDesigns = [
  design("外环双向螺坡停车楼", "八米宽连续外环车坡连接三层真实停车盘，层间车坡在每个分流口变为平坡，内庭和楼梯井穿透楼板，独立停车白线围住内侧行车环道", helicalParkingGarage, "建筑", "现代"),
  design("斜台球幕环廊天文馆", "完整半球双层薄壳包围倾斜观众地台，双侧连续阶梯连接高低座席，圆厅外环形前厅由内外真实门洞接入，中央星幕投影头与阶席留出独立间隔", planetarium, "建筑", "现代"),
  design("分流双层轮渡客运楼", "下层汽车通道从岸后入口直达临水跳板，上层完整玻璃候船厅通过两侧独立人行桥分流登船，侧边实际楼梯穿过上层洞口，人车动线在岸楼内分层", ferryTerminal, "建筑", "现代"),
];

function circlePoints(radius: number, count = 28): [number, number][] { return Array.from({ length: count }, (_, index) => { const a = index * Math.PI * 2 / count; return [Math.cos(a) * radius, Math.sin(a) * radius]; }); }

function parkingRampHeight(angle: number): number {
  const turn = angle / (Math.PI * 2), level = Math.floor(turn), u = turn - level;
  // 每个层面口两侧各10.8度为平坡，使六米多宽的分流口与楼板实际齐平。
  return .3 + (level + Math.max(0, Math.min(1, (u - .03) / .94))) * 3.2;
}

function rampSamples(start: number, end: number, radius: number, lift: number, thickness: number): TrackSample[] {
  const angles = Array.from({ length: 49 }, (_, index) => start + (end - start) * index / 48);
  for (let turn = 0; turn <= 2; turn++) for (const offset of [-.03, .03]) {
    const angle = (turn + offset) * Math.PI * 2;
    if (angle > start && angle < end) angles.push(angle);
  }
  return angles.sort((a, b) => a - b).map(a => {
    const y = parkingRampHeight(a) + lift;
    return { x: Math.cos(a) * radius, z: Math.sin(a) * radius, nx: Math.cos(a), nz: Math.sin(a), bank: 0, height: y, base: y - thickness };
  });
}

function parkingLines(height: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let index = 0; index < 28; index++) {
    const a = (index + .5) * Math.PI / 14, start = vertices.length;
    for (const [r, offset] of [[11.5, -.025], [16.5, -.025], [16.5, .025], [11.5, .025]]) vertices.push({ x: Math.cos(a) * r! - Math.sin(a) * offset!, y: height, z: Math.sin(a) * r! + Math.cos(a) * offset! });
    indices.push(start, start + 2, start + 1, start, start + 3, start + 2);
  }
  return part("停车盘上真实径向车位分界线", "mesh", white, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function helicalParkingGarage(): ModelPart[] {
  const stairHole: [number, number][] = [[7.2, -4.2], [9.2, -4.2], [9.2, 3.4], [7.2, 3.4]];
  const p: ModelPart[] = [cylinder("三层停车盘与螺坡共同落地场坪", 0, .1, 0, 56, .2, stone), box("双向车坡在首层的实际切向入口", 22, .25, -5, 8, .1, 10, stone)];
  for (let level = 0; level < 3; level++) {
    const y = .3 + level * 3.2;
    p.push(polygon("中央庭院与独立楼梯井同时穿透的完整停车盘", stone, circlePoints(18.05, 64), .205, [0, y - .2, 0], [circlePoints(7), ...(level ? [stairHole] : [])]), halfRoundWall("每层停车盘内庭边缘完整低护墙", 7.1, .12, 1, [0, y, 0], 0, dark, Math.PI * 2), halfRoundWall("停车盘外护墙为平坡分流口留出实际缺口", 18, .13, 1, [0, y, 0], -.2 * 180 / Math.PI, dark, Math.PI * 2 - .4), parkingLines(y + .012));
    if (!level) continue;
    for (let flight = 0; flight < 3; flight++) p.push(stairFlight("穿过停车盘真实楼梯井的连续步行阶梯", 8.2, y - 3.2 + flight * 3.2 / 3, -4 + flight * 2.4, 1.8, 8, 3.2 / 24, .3));
    p.push(box("停车层步行阶梯的真实高端平台", 8.2, y - .1, 3.45, 2, .2, .5, stone));
  }
  for (let section = 0; section < 4; section++) {
    const start = section * Math.PI, end = start + Math.PI;
    p.push({ ...bankedTrack("层间净空三米的连续双向实体螺旋车坡", rampSamples(start, end, 18, 0, .2), 8), color: stone }, { ...bankedTrack("沿螺旋外缘连续抬高的实体防护矮墙", rampSamples(start, end, 25.85, 1, 1), .15), color: dark }, { ...bankedTrack("随连续车坡升高的双向分道中心线", rampSamples(start, end, 21.96, .012, .002), .08), color: white });
    const innerStart = start + (section % 2 ? 0 : .2), innerEnd = end - (section % 2 ? .2 : 0);
    p.push({ ...bankedTrack("螺坡内侧在层面交接口收头的防护矮墙", rampSamples(innerStart, innerEnd, 18, 1, 1), .13), color: dark });
  }
  for (const radius of [7.5, 17.2]) for (let index = 0; index < 8; index++) {
    const a = (index + .5) * Math.PI / 4; p.push(cylinder("避让车坡与楼梯井的全高停车盘承重柱", Math.cos(a) * radius, 3.4, Math.sin(a) * radius, .35, 6.2, dark));
  }
  return p;
}

function planetarium(): ModelPart[] {
  const p: ModelPart[] = [cylinder("球幕厅与外环前厅共同落地地台", 0, .1, 0, 30, .2, stone), halfRoundWall("环形前厅外墙在正面保留入口弦口", 14, .25, 4.3, [0, .2, 0], -105, stone, Math.PI * 11 / 6), halfRoundWall("球幕暗厅内墙在正面保留真实观众门口", 10, .25, 4.3, [0, .2, 0], -105, dark, Math.PI * 11 / 6), doorway("从室外进入环形前厅的实际正门", [0, .2, 14 * Math.cos(Math.PI / 12)], 7.26, 4.3, 3.2, 0, 2.8), doorway("由环前厅进入球幕暗厅的实际门洞", [0, .2, 10 * Math.cos(Math.PI / 12)], 5.18, 4.3, 2.2, 0, 2.6)];
  p.push(halfRoundWall("完整环形前厅屋面中部为球幕留出通高空间", 14.25, 4.3, .2, [0, 4.5, 0], 0, dark, Math.PI * 2));
  for (const yaw of [0, 180]) p.push(halfDomeRoof("球幕厅外层完整隔光半球薄壳", 10.4, .2, [0, 4.5, 0], yaw, dark), halfDomeRoof("球幕厅朝向观众的独立浅色半球内幕", 10, .08, [0, 4.5, 0], yaw, "#c8cdc3"));
  p.push(part("与两侧阶梯同坡向的完整倾斜观众地台", "extrude", wood, [0, .2, 0], [1, 1, 1], [0, 90, 0], { depth: 11.6, profile: [{ x: -7, y: 0 }, { x: 7, y: 0 }, { x: 7, y: 3.1 }, { x: -7, y: .1 }] }));
  for (const x of [-6.3, 6.3]) for (let flight = 0; flight < 2; flight++) p.push(stairFlight("连接倾斜座席高低两端的连续侧阶梯", x, .3 + flight * 1.5, 7 - flight * 7, .8, 12, .125, 7 / 12, true));
  for (const z of [-5.5, -3.5, -1.5, 1.5, 3.5, 5.5]) {
    const floor = .3 + (7 - z) / 14 * 3;
    p.push(box("沿倾斜地台抬高的连续观众座台", 0, floor + .35, z, 11, .2, .65, "#8b998f"), part("球幕观众后仰座背", "box", "#8b998f", [0, floor + .7, z - .35], [11, .6, .12], [-15, 0, 0]));
  }
  p.push(cylinder("观众前后排之间独立星幕投影台座", 0, 2.5, 0, .45, 1.4, dark), ...[-1, 1].map(side => part("与观众动线分开的双球星幕投影头", "sphere", dark, [side * .55, 3.2, 0], [.8, .8, .8], [0, 0, 0])));
  return p;
}

function ferryTerminal(): ModelPart[] {
  const hallFloor: [number, number][] = [[-20, -5], [20, -5], [20, 18], [-20, 18]], stairHole: [number, number][] = [[14.4, 3.3], [16.6, 3.3], [16.6, 11.2], [14.4, 11.2]];
  const backProfile = [[-20, 0], [-16.6, 0], [-16.6, 2.5], [-14.4, 2.5], [-14.4, 0], [-4.5, 0], [-4.5, 3.4], [4.5, 3.4], [4.5, 0], [14.4, 0], [14.4, 2.5], [16.6, 2.5], [16.6, 0], [20, 0], [20, 3.5], [-20, 3.5]];
  const p: ModelPart[] = [box("轮渡岸楼整体实心岸基", 0, 1.1, 6.5, 44, 2.2, 27), box("下层汽车候渡与直通车道整片地面", 0, 2.35, 6.5, 40, .3, 23, stone), polygon("上层完整候船厅保留侧边实际楼梯井", stone, hallFloor, .25, [0, 6, 0], [stairHole]), box("人车分流岸楼完整悬挑屋盖", 0, 10.25, 6.5, 41, .3, 24, dark), part("岸后车行宽门与两侧步行窄门实际分开的入口墙", "extrude", stone, [0, 2.5, 18], [1, 1, 1], [0, 0, 0], { depth: .24, profile: backProfile.map(([x, y]) => ({ x: x!, y: y! })) }), doorway("临水汽车通道出口实际贯通", [0, 2.5, -5], 40, 3.5, 9, 0, 3.4)];
  for (const side of [-1, 1]) {
    p.push(box("下层候渡车道两侧承重外墙", side * 20, 4.25, 6.5, .3, 3.5, 23, stone), part("上层候船厅透明纵向围护", "box", colors.glass, [side * 20, 8.175, 6.5], [.05, 3.85, 23], [0, 0, 0], { opacity: .24 }), doorway("上层候船厅分别通往两侧人行桥的门", [side * 12, 6.25, -5], 16, 3.85, 2.6, 0, 2.7), box("与汽车跳板分开的高位人行登船桥", side * 12, 6.125, -13, 2.6, .25, 16, wood));
    for (const edge of [-1, 1]) p.push(rail([side * 12 + edge * 1.3, 7.35, -5], [side * 12 + edge * 1.3, 7.35, -21], .07, dark));
    for (const z of [-6, -13, -20]) for (const edge of [-1, 1]) p.push(rail([side * 12 + edge * 1.3, 6.25, z], [side * 12 + edge * 1.3, 7.35, z], .06, dark));
    for (const z of [-4, 7, 17]) p.push(cylinder("岸楼候船层边缘承重柱", side * 19.6, 8.175, z, .25, 3.85, dark));
    for (const z of [-8, -19]) p.push(box("人行桥下独立落地支承墩", side * 12, 3.025, z, .6, 6.05, .6, dark));
  }
  p.push(box("上层临水门之间的完整实体短墙", 0, 8.175, -5, 8, 3.85, .24, stone), part("上层候船厅岸后完整透明封窗", "box", colors.glass, [0, 8.175, 18], [40, 3.85, .05], [0, 0, 0], { opacity: .24 }), box("临水汽车直通跳板实际接到岸楼", 0, 2.35, -12, 8, .3, 14, stone));
  for (const x of [-15.5, 15.5]) p.push(box("岸后步行门从岸基进入地台的半高踏步", x, 2.275, 18.35, 2.2, .15, .7, stone));
  for (const x of [-3.9, 0, 3.9]) p.push(box("汽车直通跳板左右低防护与中央分道", x, 2.75, -12, .12, .5, 14, dark));
  for (let flight = 0; flight < 3; flight++) p.push(stairFlight("从下层穿过上层楼板真洞口的候船阶梯", 15.5, 2.5 + flight * 1.25, 3.5 + flight * 2.5, 2, 8, 3.75 / 24, 2.5 / 8));
  p.push(box("候船阶梯高端实际连接上层的落脚平台", 15.5, 6.125, 11.25, 2.2, .25, .5, stone));
  for (const z of [0, 5, 10]) for (const x of [-10, 0, 10]) p.push(box("候船厅内部留出前后通廊的连续候船长座", x, 6.7, z, 6, .45, .75, wood));
  return p;
}
