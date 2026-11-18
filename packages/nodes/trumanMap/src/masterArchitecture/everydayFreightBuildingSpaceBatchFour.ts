import { part, type ModelPart, type Triple } from "../assetModelParts";
import { boxBatch } from "./everydayOutdoorSpaceBatchOne";
import { glazedFace, rectangle } from "./everydayWorkplaceSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { verticalPanel } from "./historicSpaceBatchNine";
import { box, design, type ArchitecturePrototype } from "./structures";

const concrete = "#a9b0a4", paving = "#bbb5a0", metal = "#71867d", roofColor = "#82958a", timber = "#9b8465";

function fence(name: string, a: [number, number], b: [number, number], low = 0.18): ModelPart {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]), openings = [[0.12, 0.59], [0.7, 1.16], [1.27, 1.47]].map(([bottom, top]): [number, number][] => [[-length / 2 + 0.12, low + bottom!], [length / 2 - 0.12, low + bottom!], [length / 2 - 0.12, low + top!], [-length / 2 + 0.12, low + top!]]);
  return verticalPanel(name, [[-length / 2, low], [length / 2, low], [length / 2, low + 1.57], [-length / 2, low + 1.57]], openings, 0.1, [(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2], -Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, metal);
}

function livestockRailInspectionStation(): ModelPart[] {
  const parts: ModelPart[] = [
    box("装运坡三待检栏和独立检疫营业楼共同落地的完整站坪", 0, 0.1, 0, 46, 0.2, 38, paving),
    box("站场外西侧单独平行贯通的铁路到发线道床", -16, 0.25, 0, 3.9, 0.1, 36, "#8d998b"),
    ...boxBatch("牲畜交接站单独到发线真正承托钢轨的轨枕合批", timber, Array.from({ length: 16 }, (_, index): Triple => [-16, 0.325, -17.25 + index * 2.3]), [2.8, 0.08, 0.22]),
    ...[-1, 1].map(side => box("单独外侧铁路保持标准轨距的连续到发钢轨", -16 + side * 0.7525, 0.4125, 0, 0.07, 0.115, 36, metal)),
    box("铁路车门前真实落地且与装运坡同高的短交接侧台", -12.95, 0.875, 0, 2.9, 1.35, 3.4, concrete),
    part("铁路高台经高端平鼻连续降到低检疫站坪的实心赶畜缓坡", "extrude", concrete, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 2, profile: [{ x: -11.6, y: 0.18 }, { x: -3, y: 0.18 }, { x: -3, y: 0.2 }, { x: -11.5, y: 1.55 }, { x: -11.6, y: 1.55 }] }),
    ...boxBatch("赶畜缓坡面实际咬入坡体的密排低防滑横踏条合批", timber, Array.from({ length: 27 }, (_, index): Triple => { const x = -11.3 + index * 0.31; return [x, 1.56 - (x + 11.5) * 1.35 / 8.5, 0]; }), [0.08, 0.04, 1.8]),
    box("检疫营业室完整低基座与抬高的人行工作地面", 2, 0.575, -5.5, 8, 0.75, 6, concrete),
    box("检疫营业室四面围墙实际承托的完整平屋盖", 2, 4.35, -5.5, 8.6, 0.2, 6.6, roofColor),
    box("人畜分流且沿单列检查道连续展开的高位人员观察廊", 1.85, 0.88, -1.2, 6.7, 0.14, 1.0, concrete),
    box("检疫室后门与观察廊真正同高相叠的独立连桥", 2.5, 0.88, -2.1, 1.4, 0.14, 1.0, concrete),
    ...boxBatch("高位人员观察廊从站坪实际接到廊板的独立短柱合批", metal, [-1.2, 1.85, 4.9].map((x): Triple => [x, 0.515, -1.2]), [0.2, 0.63, 0.2]),
    stairFlight("公众从前站坪直接进入检疫营业室的独立五级短阶", [2, 0.2, -9.9], 5, 0.15, 0.3, 2.2),
    box("营业检疫室内避开公众和观察廊通路的固定业务柜基体", 4.25, 1.45, -5.6, 1.1, 1.0, 2.5, timber),
    box("固定业务柜基体上真实搭接的连续柜面", 4.25, 1.99, -5.6, 1.3, 0.1, 2.7, timber),
    box("单列检查道与平行人员廊共同覆盖的完整低雨棚", 1.5, 3.5, -0.05, 7.8, 0.12, 3.9, roofColor),
    ...boxBatch("检查道雨棚真正避开人畜路线且落地的独立细柱合批", metal, [-1.8, 4.8].flatMap(x => [-1.85, 1.7].map((z): Triple => [x, 1.83, z])), [0.14, 3.3, 0.14]),
    ...boxBatch("检查雨棚两列立柱之间实际承托屋面的完整横梁合批", metal, [-1.8, 4.8].map((x): Triple => [x, 3.44, -0.075]), [0.18, 0.16, 3.55]),
  ];
  for (const z of [-1, 1]) parts.push(part("赶畜长坡边缘真正随坡连续且不阻上下口的实体护壁", "extrude", metal, [0, 0, z], [1, 1, 1], [0, 0, 0], { depth: 0.08, profile: [{ x: -11.6, y: 1.53 }, { x: -11.5, y: 1.53 }, { x: -3, y: 0.18 }, { x: -2.9, y: 0.18 }, { x: -2.9, y: 1.6 }, { x: -3, y: 1.6 }, { x: -11.5, y: 2.95 }, { x: -11.6, y: 2.95 }] }));
  for (const side of [-1, 1]) parts.push(fence("高装运台外侧实际围护且不封车门的独立栏段", [-14.4, side * 1.7], [-12.5, side * 1.7], 1.53), fence("高装运台实际收窄接入缓坡的完整漏斗导栏", [-12.5, side * 1.7], [-11.5, side * 1.0], 1.53), fence("铁路车门实际留出一米八装运开口的高台端栏", [-14.4, side * 0.9], [-14.4, side * 1.7], 1.53), fence("缓坡低端真正收窄接入单列检查道的漏斗导栏", [-3, side * 1], [-2, side * 0.6]));
  for (const side of [-1, 1]) for (let section = 0; section < 3; section++) parts.push(fence("低端单列检查道与人员廊独立分隔的连续透空侧栏", [-2 + section * 6.8 / 3, side * 0.6], [-2 + (section + 1) * 6.8 / 3, side * 0.6]));
  for (let pen = 0; pen < 3; pen++) {
    const x = 0.5 + pen * 6, center = x + 3;
    parts.push(fence("三待检栏各自真实留出宽入口的前栏左段", [x, 2], [center - 0.75, 2]), fence("三待检栏各自真实留出宽入口的前栏右段", [center + 0.75, 2], [x + 6, 2]));
  }
  for (let section = 0; section < 6; section++) parts.push(fence("三待检栏共同连续封合并独立接地的完整后围栏", [0.5 + section * 3, 9.5], [3.5 + section * 3, 9.5]));
  for (const x of [0.5, 6.5, 12.5, 18.5]) for (let section = 0; section < 3; section++) parts.push(fence("三栏之间及外侧真正封合并避免串栏的独立隔栏", [x, 2 + section * 2.5], [x, 4.5 + section * 2.5]));
  for (let section = 0; section < 6; section++) parts.push(fence("检查道尾端接往三待检栏与公路口的连续分流巷南栏", [4.8 + section * 15.7 / 6, -0.6], [4.8 + (section + 1) * 15.7 / 6, -0.6]));
  parts.push(fence("三待检栏外接全宽公路出口且封合侧隙的分流巷北栏", [18.5, 2], [20.5, 2]));
  const posts: Triple[] = [];
  for (const x of [-1.4, 1.85, 5.1]) posts.push([x, 1.49, -0.72]);
  for (const x of [-1.4, 1.55, 3.45, 5.1]) posts.push([x, 1.49, -1.68]);
  parts.push(...boxBatch("观察廊护栏实际从廊板接起的独立短柱合批", metal, posts, [0.08, 1.12, 0.08]));
  for (const y of [1.45, 2.05]) parts.push(box("观察廊面向检查道但不混入赶畜路线的连续护栏", 1.85, y, -0.72, 6.7, 0.08, 0.08, metal), box("观察廊朝检疫室一侧为连桥门口留净的左护栏", 0.05, y, -1.68, 3.1, 0.08, 0.08, metal), box("观察廊朝检疫室一侧为连桥门口留净的右护栏", 4.3, y, -1.68, 1.8, 0.08, 0.08, metal));
  const office: [number, number][] = [[-2, 0.2], [6, 0.2], [6, 4.3], [-2, 4.3]];
  parts.push(...glazedFace("铁路牲畜交接站面向公众的独立营业入口及真实窗洞", "xy", office, [-0.5, 4.5].map(x => rectangle(x, 1.8, 1.5, 1.3)), [rectangle(2, 0.94, 1.6, 2.5)], -8.5), ...glazedFace("检疫营业室单独通向高观察廊的真实职员出口", "xy", office, [-0.5, 5].map(x => rectangle(x, 1.8, 1.2, 1.3)), [rectangle(2.5, 0.94, 1.4, 2.4)], -2.5));
  for (const x of [-2, 6]) parts.push(...glazedFace("铁路牲畜交接站营业室真正封合的完整侧窗墙", "yz", [[-8.5, 0.2], [-2.5, 0.2], [-2.5, 4.3], [-8.5, 4.3]], [rectangle(-5.5, 1.8, 2.2, 1.3)], [], x));
  return parts;
}

export const everydayFreightBuildingSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("铁路牲畜检疫交接站", "铁路高侧台经过防滑缓坡与单列检查道进入三座各自开门的完整待检栏，检查道尾部接向独立公路出口；检疫营业室通过真实连桥接入平行高位观察廊，人员路线避开赶畜巷，构成完整轨公活畜交接站且不包含动物模型", livestockRailInspectionStation, "建筑", "现代"),
];
