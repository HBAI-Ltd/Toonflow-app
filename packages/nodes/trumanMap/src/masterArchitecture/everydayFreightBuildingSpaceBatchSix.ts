import { part, type ModelPart, type Triple } from "../assetModelParts";
import { boxBatch } from "./everydayOutdoorSpaceBatchOne";
import { glazedFace, rectangle } from "./everydayWorkplaceSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { box, design, rail, type ArchitecturePrototype } from "./structures";

const concrete = "#a7afa5", asphalt = "#7f8e85", metal = "#657e7b", roofColor = "#82988b", timber = "#a28b6b", white = "#d0d1b9";

function railRoadContainerTerminal(): ModelPart[] {
  const parts: ModelPart[] = [
    box("铁路换装带进出车路及独立办货步道共同落地的完整站坪", 1, 0.1, 0, 66, 0.2, 90, asphalt),
    box("转运门架内侧独立贯通铁路的完整低道床", -13.5, 0.25, 0, 4, 0.1, 90, "#929c8b"),
    ...boxBatch("公铁提货场铁路真正承托标准轨双钢轨的密排轨枕合批", timber, Array.from({ length: 40 }, (_, i): Triple => [-13.5, 0.325, -42.9 + i * 2.2]), [2.8, 0.08, 0.22]),
    ...[-1, 1].map(side => box("公铁换装工作带保持标准轨距的连续到发钢轨", -13.5 + side * 0.7525, 0.4125, 0, 0.07, 0.115, 88, metal)),
    ...[-20, 8].flatMap(x => [box("场桥长行走轨独立于到发线并真实落地的连续承轨梁", x, 0.27, 0, 0.8, 0.14, 58, concrete), box("场桥低位连续行走钢轨由完整承轨梁接承", x, 0.39, 0, 0.12, 0.12, 58, metal)]),
    box("两路检查车道之间不占车行净宽的完整低中央岛", 8.3, 0.31, -29, 3.4, 0.22, 8, concrete),
    box("检查中央岛上真正接地的独立门卫亭地板", 8.3, 0.47, -29, 3.1, 0.12, 4.6, concrete),
    box("双路检查棚完整柱网和门卫亭外壁共同托住的连续雨盖", 8.25, 5.9, -29, 18.1, 0.2, 7.6, roofColor),
    ...boxBatch("双检查车道外侧及中央分隔带避开车路的完整棚柱合批", metal, [-0.6, 8.3, 17.1].flatMap(x => [-32.5, -25.5].map((z): Triple => [x, 3.0, z])), [0.2, 5.64, 0.2]),
    ...boxBatch("检查棚前后柱列共同接承完整屋盖的连续横梁合批", metal, [-32.5, -25.5].map((z): Triple => [8.25, 5.78, z]), [17.9, 0.18, 0.22]),
    box("公众营业楼独立于进出车道且真实接地的完整低地台", 24, 0.325, -20, 10, 0.25, 12, concrete),
    box("公众营业楼完整四面窗墙实际承托的连续平屋盖", 24, 4.23, -20, 10.6, 0.2, 12.6, roofColor),
    box("营业楼西侧从站外公众入口通向检查亭的连续独立人行步道", 18.1, 0.265, -14, 1.8, 0.13, 42, concrete),
    box("营业楼前门从高地台连续接回独立人行步道的短落脚台", 18.7, 0.39, -21.5, 1.2, 0.12, 2, concrete),
    box("低街出口车道和独立公众步道之间实际落地的长防撞分隔坎", 16.8, 0.47, -6, 0.22, 0.54, 46, concrete),
    box("站外公众步道尾端与检查中央岛真正衔接的横向行人地带", 13.25, 0.2075, -34.5, 11.5, 0.015, 1.4, white),
    stairFlight("站外横向行人地带接入中央检查岛的真实两级低短阶", [8.3, 0.2, -33.9], 2, 0.11, 0.5, 1.6),
    stairFlight("站外行人地带接上独立办货步道的真实一级低短阶", [18.1, 0.2, -35.6], 1, 0.13, 0.75, 1.8),
    box("中央岛面真正平接门卫亭门槛的一低级踏台", 9, 0.475, -26.5, 1.1, 0.11, 0.6, concrete),
    box("办货营业厅避开侧门和柜前通道的固定交接柜基体", 25.8, 0.99, -19.5, 0.9, 1.1, 5.2, timber),
    box("固定交接柜基体上实际搭接的连续办货柜面", 25.8, 1.59, -19.5, 1.1, 0.1, 5.4, timber),
  ];
  for (const x of [-20, 8]) {
    parts.push(box("场桥同侧两端轮组之间真正接合的低位纵向承梁", x, 1.19, 0, 0.5, 0.28, 8, metal));
    for (const z of [-3, 3]) {
      parts.push(box("门架每一独立支腿下方真正咬入轮组的完整承重台车", x, 1.0, z, 0.62, 0.42, 2.2, metal), box("四立腿由同侧台车真实接到跨场上主梁的完整承重柱", x, 6.79, z, 0.4, 11.2, 0.42, metal));
      for (const end of [-1, 1]) parts.push(part("场桥独立钢轮真实落在连续行走轨且嵌入台车", "cylinder", "#4d6565", [x, 0.8, z + end * 0.75], [0.7, 0.24, 0.7], [0, 0, 90]));
    }
    parts.push(rail([x, 1.25, -3], [x, 12.32, 3], 0.16, metal), box("门架同侧两高腿之间真正合拢的顶部纵向系梁", x, 12.58, 0, 0.36, 0.3, 6.5, metal));
  }
  for (const z of [-3, 3]) parts.push(box("跨过铁路中间换装带与公路接车带的完整高位主梁", -6, 12.6, z, 29, 0.65, 0.58, metal), box("横移起升小车在双主梁顶面真正连续承托的运行钢轨", -6, 12.975, z, 28.8, 0.1, 0.12, "#506b69"));
  parts.push(box("沿跨场双梁横移且与四运行轮真实咬合的完整小车床", -5, 13.2, 0, 4.8, 0.3, 6.6, roofColor));
  for (const x of [-6.5, -3.5]) for (const z of [-3, 3]) parts.push(part("起升小车四钢轮真正接合主梁运行轨与小车床", "cylinder", "#4b6462", [x, 13.25, z], [0.5, 0.18, 0.5], [90, 0, 0]));
  for (const x of [-5.9, -4.1]) for (const z of [-2.5, 2.5]) parts.push(rail([x, 13.08, z], [x, 6.17, z], 0.055, "#4d6462"));
  for (const x of [-6.2, -3.8]) parts.push(box("空吊具由四提升索真正接住的长向封合边梁", x, 6.1, 0, 0.22, 0.3, 6.4, metal));
  for (const z of [-2.5, 2.5]) parts.push(box("空吊具两长梁之间真正接合提升索的完整横梁", -5, 6.1, z, 2.6, 0.3, 0.24, metal));
  for (const x of [-6.2, -3.8]) for (const z of [-3, 3]) parts.push(box("空吊具四角实际连接框梁的低位旋锁端座", x, 5.87, z, 0.32, 0.22, 0.32, "#506a67"));
  const kioskFront: [number, number][] = [[6.75, 0.41], [9.85, 0.41], [9.85, 3.65], [6.75, 3.65]];
  parts.push(...glazedFace("检查中央亭朝场内真正开门并与岛面平接的完整前壁", "xy", kioskFront, [rectangle(7.4, 1.65, 0.7, 1.2)], [rectangle(9, 0.52, 1.1, 2.3)], -26.7), ...glazedFace("检查中央亭朝站外真正开窗的完整后壁", "xy", kioskFront, [rectangle(8.3, 1.65, 1.8, 1.2)], [], -31.3));
  for (const x of [6.75, 9.85]) parts.push(...glazedFace("检查中央亭面向独立进出车道的真实观察窗墙", "yz", [[-31.3, 0.41], [-26.7, 0.41], [-26.7, 3.65], [-31.3, 3.65]], [rectangle(-29, 1.5, 2.5, 1.3)], [], x));
  parts.push(box("中央检查亭四围壁共同接承的真实低平屋面", 8.3, 3.73, -29, 3.3, 0.2, 4.8, roofColor));
  const officeFront: [number, number][] = [[19, 0.2], [29, 0.2], [29, 4.16], [19, 4.16]];
  for (const z of [-26, -14]) parts.push(...glazedFace("公铁提货营业楼面向站外和作业院的完整真实窗墙", "xy", officeFront, [21.2, 25.5, 27.5].map(x => rectangle(x, 1.6, 1.4, 1.5)), [], z));
  const officeSide: [number, number][] = [[-26, 0.2], [-14, 0.2], [-14, 4.16], [-26, 4.16]];
  parts.push(...glazedFace("营业楼面向隔离公众步道真正开门且独立采光的西壁", "yz", officeSide, [-24.5, -17].map(z => rectangle(z, 1.6, 1.5, 1.5)), [rectangle(-21.5, 0.44, 1.6, 2.7)], 19), ...glazedFace("营业楼背离大车道路且实际封合的连续东窗墙", "yz", officeSide, [-23.5, -19.5, -15.8].map(z => rectangle(z, 1.6, 1.8, 1.5)), [], 29));
  const shortSteps = stairFlight("公众步道经一真实低踏级接上营业楼门口落脚台", [18, 0.33, -21.5], 1, 0.12, 0.75, 1.6); shortSteps.rotation.y = 0; parts.push(shortSteps);
  parts.push(...boxBatch("完整提货场两路车辆在检查棚前真正分开的连续导向线合批", white, [0.15, 4.85, 11.65, 16.35].map((x): Triple => [x, 0.2075, 0]), [0.08, 0.015, 63]), ...boxBatch("两路检查棚入口分别对应的独立停车横线合批", white, [2.5, 14].map((x): Triple => [x, 0.2075, -33.4]), [4.4, 0.015, 0.12]));
  parts.push(box("铁路西界避开到发线与场桥车轮的完整低围护基座", -25, 0.55, 0, 0.25, 0.7, 81, concrete), box("后场围界为贯通铁路真正留出净口的西段界坎", -20.75, 0.55, 43, 10.5, 0.7, 0.25, concrete), box("后场围界保留完整大车转弯宽度的东段独立界坎", 8.25, 0.55, 43, 39.5, 0.7, 0.25, concrete));
  return parts;
}

export const everydayFreightBuildingSpaceBatchSixDesigns: ArchitecturePrototype[] = [
  design("公铁集装箱检封提货站", "完整露天转运场把独立铁路和公路接车带共同置于双梁行走门架之下，前端两路检查车道由中央岛分开，外围独立办货楼经隔离公众步道联系检查区，后端保留车辆换向空间；门架轮轨柱梁与空吊具形成真实受力链且不包含车辆或堆箱模型", railRoadContainerTerminal, "建筑", "现代"),
];
