import { part, type ModelPart, type Triple } from "../assetModelParts";
import { boxBatch } from "./everydayOutdoorSpaceBatchOne";
import { glazedFace, rectangle } from "./everydayWorkplaceSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { box, design, rail, type ArchitecturePrototype } from "./structures";

const concrete = "#aab1a8", paving = "#b7b8aa", metal = "#60777b", roofColor = "#7e938d", timber = "#9f896c";

function doubleDockCrossStreetTerminal(): ModelPart[] {
  const parts: ModelPart[] = [
    box("两侧货车道路与前营业街后转运场共用的完整落地场坪", 0, 0.1, 0, 50, 0.2, 56, paving),
    box("两翼分货房与中街及外月台共同连续落地的实心高基座", 0, 0.715, 0, 22, 1.03, 28, concrete),
    box("相向货翼通过高位分货中街真正齐平贯通的完整地面", 0, 1.29, 0, 22, 0.12, 28, concrete),
    box("中街高窗带与两列高柱真正承托的完整高屋盖", 0, 7.1, 0, 4.8, 0.2, 28.6, roofColor),
    ...boxBatch("分货中街两侧从实地面真实接入高屋盖的完整柱列合批", metal, [-1, 1].flatMap(side => [-13.7, -4.5, 4.5, 13.7].map((z): Triple => [side * 2, 4.19, z])), [0.25, 5.72, 0.25]),
    ...boxBatch("分货翼外墙与斜屋架真实接合的低檐柱列合批", metal, [-1, 1].flatMap(side => [-13.7, -4.5, 4.5, 13.7].map((z): Triple => [side * 8, 3.39, z])), [0.25, 4.12, 0.25]),
    ...boxBatch("高柱之间实际承托中街平屋盖的连续横向系梁合批", metal, [-13.7, -4.5, 4.5, 13.7].map((z): Triple => [0, 6.93, z]), [4, 0.16, 0.18]),
    ...boxBatch("两外月台避开装卸门的完整外檐承重细柱合批", metal, [-1, 1].flatMap(side => [-13.7, -4.5, 4.5, 13.7].map((z): Triple => [side * 10.8, 3.04, z])), [0.18, 3.42, 0.18]),
    box("前端营业厅独立于两侧货车月台的低位落地地台", 0, 0.375, -17.5, 12, 0.35, 7, concrete),
    box("前端营业厅围墙实际承托的完整低平屋盖", 0, 4.3, -17.5, 12.6, 0.3, 7.6, roofColor),
    stairFlight("营业厅由低地面进入高位分货中街的真实内部短阶", [0, 0.55, -16.7], 4, 0.2, 0.4, 1.8),
    box("营业厅内短阶真正叠接分货中街门槛的完整落脚台", 0, 1.25, -14.55, 2.0, 0.2, 1.5, concrete),
    stairFlight("街面真正接入独立营业入口的两级宽短阶", [0, 0.2, -21.9], 2, 0.175, 0.6, 2.8),
    box("营业厅避开贯通步行线的固定快运办事柜基体", -3.5, 1.06, -18.5, 2.0, 1.02, 1.1, timber),
    box("快运办事柜基体上实际搭接的薄柜面", -3.5, 1.6, -18.5, 2.2, 0.08, 1.3, timber),
    part("分货中街尾端真实接回后场的连续叉车长缓坡", "extrude", concrete, [0, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 3, profile: [{ x: 13.9, y: 0.2 }, { x: 26, y: 0.2 }, { x: 14, y: 1.35 }, { x: 13.9, y: 1.35 }] }),
  ];
  const bayCenters = [-9.3, 0, 9.3], doors = bayCenters.map(z => rectangle(z, 1.34, 4, 3.3)), bumpers: Triple[] = [];
  for (const side of [-1, 1]) {
    parts.push(part("低分货翼从中街高墙向外月台缓降的完整封厚屋面", "extrude", roofColor, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 28.4, profile: [{ x: side * 2, y: 5.8 }, { x: side * 8.2, y: 5.5 }, { x: side * 8.2, y: 5.34 }, { x: side * 2, y: 5.64 }] }), ...glazedFace("相向分货房经真实宽门接入中街并保留连续高窗带的内墙", "yz", [[-14, 0.2], [14, 0.2], [14, 7.05], [-14, 7.05]], bayCenters.map(z => rectangle(z, 5.95, 4.3, 0.8)), doors, side * 2), ...glazedFace("分货翼外月台与各分货房一一对应的真实装卸门及高窗", "yz", [[-14, 0.2], [14, 0.2], [14, 5.5], [-14, 5.5]], bayCenters.map(z => rectangle(z, 4.95, 4.3, 0.35)), doors, side * 8), box("两侧连续外月台在货门上方真正接到墙面的低位雨棚", side * 9.55, 4.78, 0, 3.3, 0.12, 28.5, roofColor), box("外月台雨棚与细柱真实相叠的连续外缘承梁", side * 10.8, 4.7, 0, 0.16, 0.16, 28, metal));
    for (const z of [-13.7, -4.5, 4.5, 13.7]) parts.push(rail([side * 2, 5.64, z], [side * 8.2, 5.34, z], 0.16, metal));
    for (const z of [-4.5, 4.5]) parts.push(...glazedFace("独立分货房之间随低屋坡封合且不侵入中街的完整隔墙", "xy", [[side * 2, 0.2], [side * 8, 0.2], [side * 8, 5.48], [side * 2, 5.77]], [], [], z));
    for (const z of bayCenters) {
      parts.push(box("两外月台正对各分货房门且真实支承于高台的装车搭板", side * 11.05, 1.29, z, 0.55, 0.12, 3.6, metal));
      for (const edge of [-1, 1]) bumpers.push([side * 11.05, 0.94, z + edge * 1.8]);
    }
    const stair = stairFlight("后侧人员出口独立避开叉车长坡的六级人行阶", [side * 5.5, 0.2, 17], 6, 1.15 / 6, 0.35, 1.8); stair.rotation.y = 90;
    parts.push(stair, box("后人行短阶高端真实叠入分货房门槛的落地平台", side * 5.5, 0.775, 14.5, 1.8, 1.15, 1.2, concrete), part("分货中街后叉车坡侧沿随坡连续且不封高端出口的护坎", "extrude", metal, [side * 1.5, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 0.08, profile: [{ x: 13.9, y: 1.35 }, { x: 14, y: 1.35 }, { x: 26, y: 0.2 }, { x: 26, y: 0.4 }, { x: 14, y: 1.55 }, { x: 13.9, y: 1.55 }] }));
  }
  parts.push(...boxBatch("两侧月台固定于真实承台正面的独立防撞缓冲块合批", "#526763", bumpers, [0.15, 0.55, 0.18]));
  const endOutline: [number, number][] = [[-8, 0.2], [8, 0.2], [8, 5.5], [2.2, 5.78], [2.2, 7.08], [-2.2, 7.08], [-2.2, 5.78], [-8, 5.5]];
  parts.push(...glazedFace("营业前厅经独立步门进入中街并可观察两货翼的完整前壁", "xy", endOutline, [...[-4.8, 4.8].map(x => rectangle(x, 2.6, 1.6, 1.2)), rectangle(0, 5.95, 2.4, 0.7)], [rectangle(0, 1.34, 1.8, 2.6)], -14), ...glazedFace("后场叉车宽出口与两翼独立人行门均真正贯通的完整后壁", "xy", endOutline, [...[-3.1, 3.1].map(x => rectangle(x, 3.15, 1.3, 1.4)), rectangle(0, 5.95, 2.4, 0.7)], [rectangle(0, 1.34, 3.2, 3.6), ...[-5.5, 5.5].map(x => rectangle(x, 1.34, 1.4, 2.5))], 14));
  parts.push(...glazedFace("独立营业前厅面向街道的真实公众入口及采光窗", "xy", [[-6, 0.2], [6, 0.2], [6, 4.2], [-6, 4.2]], [-3.8, 3.8].map(x => rectangle(x, 1.4, 1.6, 1.5)), [rectangle(0, 0.54, 2.2, 2.7)], -21));
  for (const x of [-6, 6]) parts.push(...glazedFace("低营业厅完整封合并真实开窗的侧墙", "yz", [[-21, 0.2], [-14, 0.2], [-14, 4.2], [-21, 4.2]], [rectangle(-17.5, 1.4, 2.2, 1.5)], [], x));
  return parts;
}

export const everydayFreightBuildingSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("双侧月台中街快运转运站", "两座低分货翼分成六个独立分货房，外门对接两侧货车月台而内门通向高窗覆盖的贯通分货中街；端部低营业厅由内短阶接入中街，后端叉车缓坡和两处独立人行阶分别离站，形成完整双向零担转运空间", doubleDockCrossStreetTerminal, "建筑", "现代"),
];
