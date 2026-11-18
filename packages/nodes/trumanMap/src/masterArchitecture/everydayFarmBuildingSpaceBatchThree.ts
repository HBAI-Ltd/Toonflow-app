import { part } from "../assetModelParts";
import type { ModelPart } from "../assetModelParts";
import { base, box, design } from "./structures";
import type { ArchitecturePrototype } from "./structures";
import { glazedFace, rectangle, wallYz } from "./everydayWorkplaceSpaceBatchOne";
import { xYWall } from "./futureSpaceBatchTen";
import { boxesMesh } from "./publicSpaceBatchEight";
import type { SolidBox } from "./publicSpaceBatchEight";

const concrete = "#adb3a8";
const wallColor = "#c1c7ba";
const roofColor = "#82958a";
const slatColor = "#a2b9aa";

// 分室保育、部分漏缝床及床下沟的类型依据：
// cfsph.iastate.edu/pdf/fad-prep-nahems-swine-industry-manual；
// business.qld.gov.au/industries/farms-fishing-forestry/agriculture/animal/industries/pigs/housing/guide/hygiene。
function nurseryPigHouse(): ModelPart[] {
  const high = .65, low = .2, parts: ModelPart[] = [base(35, 35, low), box("保育舍前侧净饲养走廊完整高位地坪", 0, .425, -5.5, 16, .45, 3, concrete), box("保育舍四室前部连续的完整干燥承地床面", 0, .425, -1, 16, .45, 6, concrete)];
  const slats: SolidBox[] = [], bearers: SolidBox[] = [];
  for (const center of [-6, -2, 2, 6]) {
    for (let row = 0; row < 18; row++) slats.push({ center: [center, .60, 2.055 + row * .11], size: [3.86, .10, .10] });
    for (const x of [center - 1.88, center, center + 1.88]) {
      bearers.push({ center: [x, .50, 3], size: [.12, .10, 2] });
      for (const z of [2.25, 3.55]) bearers.push({ center: [x, .35, z], size: [.12, .30, .14] });
    }
    parts.push(box("每间保育室漏缝床下面独立而真实下凹的集污沟底", center, .215, 3, 3.85, .03, 2, concrete));
  }
  for (let start = 0; start < slats.length; start += 20) parts.push(boxesMesh("四间保育室后段真实留一厘米间隙的完整承床条", slatColor, slats.slice(start, start + 20)));
  for (let start = 0; start < bearers.length; start += 20) parts.push(boxesMesh("漏缝床条下实际落到沟底基础的连续承梁和短支座", concrete, bearers.slice(start, start + 20)));
  for (const x of [-8, -4, 0, 4, 8]) parts.push(box("保育室之间从基础直承屋盖的完整气密隔墙", x, 2.125, 0, .16, 3.85, 8, wallColor));
  parts.push(xYWall("四间保育室分别接入前净廊的完整人员门墙", [[-8, high], [8, high], [8, 4.05], [-8, 4.05]], [-6, -2, 2, 6].map(x => rectangle(x, high, 1.2, 2.2)), -4, .16, wallColor));
  const rear: [number, number][] = [[-8, low], [8, low], [8, 4.05], [-8, 4.05]];
  const ports = [-6, -2, 2, 6].map(x => rectangle(x, .23, 2.5, .22));
  parts.push(xYWall("保育室后壁床下真实开出四道清沟口的完整围护", rear, [...ports, ...[-6, -2, 2, 6].map(x => rectangle(x, 2.5, 2.5, .8))], 4, .18, wallColor), box("四间温控保育室各隔墙共同接承的完整厚屋盖", 0, 4.15, 0, 16.5, .20, 8.4, roofColor));
  const front: [number, number][] = [[-8, high], [8, high], [8, 3.1], [-8, 3.1]], frontSide: [number, number][] = [[-7, high], [-4, high], [-4, 3.1], [-7, 3.1]];
  parts.push(...glazedFace("前净饲养廊独立入口与完整外侧采光窗墙", "xy", front, [rectangle(-5.3, 1.65, 3.5, 1.0), rectangle(5.3, 1.65, 3.5, 1.0)], [rectangle(0, high, 2.2, 2.2)], -7));
  for (const x of [-8, 8]) parts.push(wallYz("前净廊两端真实封合的完整低围护", frontSide, [], x, .18, wallColor));
  parts.push(box("前净廊低屋盖实际嵌接四室前壁并接承外窗墙", 0, 3.2, -5.5, 16.5, .20, 3.3, roofColor), part("前净廊由场坪直接接到高入口的完整实体缓坡", "extrude", concrete, [0, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -11, y: low }, { x: -7, y: low }, { x: -7, y: high }], depth: 3 }));
  parts.push(part("后清污廊背向保育室下降的完整单坡雨盖", "extrude", roofColor, [0, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: 4, y: 3.25 }, { x: 7, y: 2.85 }, { x: 7, y: 2.65 }, { x: 4, y: 3.05 }], depth: 16.5 }));
  parts.push(xYWall("后清污廊朝外独立开门的完整低围壁", [[-8, low], [8, low], [8, 2.65], [-8, 2.65]], [rectangle(0, low, 1.6, 2.15)], 7, .18, wallColor));
  for (const x of [-8, 8]) parts.push(wallYz("后清污廊两端按实际斜屋盖闭合的薄端墙", [[4, low], [7, low], [7, 2.65], [4, 3.05]], [], x, .18, wallColor));
  const supports: SolidBox[] = [];
  const rearTop = 3.05 - (6.8 - 4) * .4 / 3;
  for (const x of [-7.9, -4, 4, 7.9]) supports.push({ center: [x, (low + rearTop) / 2, 6.8], size: [.16, rearTop - low, .16] });
  parts.push(boxesMesh("后清污廊避开中央人员门的完整承盖竖柱", concrete, supports));
  return parts;
}

export const everydayFarmBuildingSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("前净廊后清污漏缝床保育舍", "前高净饲养廊分别进入四间完整保育室，前部干燥床与后段真漏缝床等高，漏缝下方可见独立沟底和落地承床梁；后低清污廊经四道真实床下清沟口服务各室，前后门与高低屋盖分别闭合，不包含动物或可分拆设备", nurseryPigHouse, "建筑", "现代"),
];
