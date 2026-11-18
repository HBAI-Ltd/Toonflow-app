import type { ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, design, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b8bbac", timber = "#a98e68", roofColor = "#748b85", dark = "#536c69", cabinetColor = "#b4bcb2";

export const everydayDiningSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("四角厨核十字餐堂美食馆", "四座封闭厨房分别向十字公共餐堂开放交付口，厨房外侧的U形后勤廊从两端独立货门经背部横廊连续接通四厨；前街顾客从隔开的短门厅进入高天窗十字餐堂，低厨盖与高厅四面承墙真实闭合，各厨房均有独立后门", crossFoodHall, "建筑", "现代"),
];

function crossFoodHall(): ModelPart[] {
  const cross: [number, number][] = [[-11.3, -4.3], [-4.3, -4.3], [-4.3, -11.3], [4.3, -11.3], [4.3, -4.3], [11.3, -4.3], [11.3, 4.3], [4.3, 4.3], [4.3, 11.3], [-4.3, 11.3], [-4.3, 4.3], [-11.3, 4.3]];
  const parts: ModelPart[] = [
    box("十字餐堂四角厨核与U形后勤廊同标高的整栋落地楼面", 0, .1, 0, 26.8, .2, 26.8, paving),
    hardFloor("四角低厨房之间真正伸出四臂的整体高餐堂屋盖", roofColor, cross, .24, [0, 6, 0]),
    ...[-1, 1].map(side => box("独立外后勤廊沿整栋两侧贯通的完整低屋盖", side * 12, 3.81, 0, 2.8, .22, 26.8, roofColor)),
    box("后勤U廊背部横接四厨路径的真实低屋盖", 0, 3.81, 12, 22.4, .22, 2.8, roofColor),
    ...[-1, 1].map(side => box("顾客门厅两侧独立后勤廊前端完整低盖", side * 7.5, 3.81, -12, 7.4, .22, 2.8, roofColor)),
    box("顾客短门厅与高餐堂前端实际相接的完整低盖", 0, 3.81, -12, 8.4, .22, 2.8, timber),
    ...glazedWall("顾客前门真正位于隔开的入场短厅内", [-4, -13], [4, -13], .2, 3.7, [], [[0, .2, 3.2, 2.8]]),
    ...glazedWall("高十字餐堂前壁由低顾客门厅的实门独立进入", [-4, -11], [4, -11], .2, 6, [[0, 4.5, 5.5, 1]], [[0, .2, 3.2, 2.8]]),
    ...glazedWall("高十字餐堂后端真实高窗承墙与后勤横廊隔开", [-4, 11], [4, 11], .2, 6, [[0, 1, 5.2, 2.1], [0, 4.5, 5.5, 1]]),
    ...glazedWall("后勤U廊背面真实送货门与独立高采光窗", [-13, 13], [13, 13], .2, 3.7, [[-7.5, 1.4, 6, 1.4], [7.5, 1.4, 6, 1.4]], [[0, .2, 1.6, 2.6]]),
  ];
  const structure: SolidBox[] = [], furniture: SolidBox[] = [], counters: SolidBox[] = [];
  for (const side of [-1, 1]) {
    parts.push(...glazedWall("独立后勤侧廊面向室外的真实长窗承墙", [side * 13, -13], [side * 13, 13], .2, 3.7, [[-7.5, 1.4, 5.5, 1.4], [0, 1.4, 5.5, 1.4], [7.5, 1.4, 5.5, 1.4]]),
      ...glazedWall("十字餐堂侧臂端头与外后勤廊真正分隔的高窗墙", [side * 11, -4], [side * 11, 4], .2, 6, [[0, 1, 5.2, 2.1], [0, 4.5, 5.5, 1]]),
      ...glazedWall("顾客短门厅不与外后勤廊串行的实封侧墙", [side * 4, -13], [side * 4, -11], .2, 3.7, []));
    const frontStart = side < 0 ? -13 : 4, frontEnd = side < 0 ? -4 : 13;
    parts.push(...glazedWall("前街独立进入后勤U廊的实际窄货门", [frontStart, -13], [frontEnd, -13], .2, 3.7, [], [[side * 3.5, .2, 1.3, 2.6]]));
    for (const end of [-1, 1]) {
      const x = side * 7.5, z = end * 7.5, front = end < 0 ? -11 : 4, back = end < 0 ? -4 : 11;
      parts.push(box("每座厨房由外围后勤门墙及高餐堂界墙共同承托的低屋盖", x, 3.81, z, 7.4, .22, 7.4, roofColor),
        ...glazedWall("四座厨房分别从后勤侧廊进入的真实独立工作门", [side * 11, front], [side * 11, back], .2, 3.7, [], [[0, .2, 1.2, 2.6]]),
        ...glazedWall("厨房背面向前端或后端后勤横廊的真实内窗墙", [x - 3.5, end * 11], [x + 3.5, end * 11], .2, 3.7, [[0, 1.7, 4.2, 1.25]]),
        ...glazedWall("厨房沿十字餐堂长臂形成真实高天窗界墙", [side * 4, front], [side * 4, back], .2, 6, [[0, 4.5, 4.9, 1]]),
        ...glazedWall("厨房朝公共横餐堂的无玻璃真交付窗及高天窗", [x - 3.5, end * 4], [x + 3.5, end * 4], .2, 6, [[0, 4.5, 4.9, 1]], [[0, 1.3, 2.6, 1.1]]));
      counters.push({ center: [x, .71, end * 4], size: [2.6, 1.02, .7] }, { center: [x, .71, z], size: [3.3, 1.02, 1.1] });
      furniture.push({ center: [x, 1.26, end * 4], size: [2.8, .08, .9] }, { center: [x, 1.26, z], size: [3.4, .08, 1.2] });
      structure.push({ center: [side * 4, 3.1, end * 4], size: [.26, 5.8, .26] }, { center: [x, 3.56, z], size: [7.24, .28, .22] });
    }
  }
  for (const [x, z] of [[-7.5, -1.7], [-7.5, 1.7], [7.5, -1.7], [7.5, 1.7], [-2.2, -7.5], [2.2, -7.5], [-2.2, 7.5], [2.2, 7.5]]) {
    furniture.push({ center: [x!, 1, z!], size: [1.5, .1, 1.4] }, { center: [x!, .575, z!], size: [.18, .75, .8] });
    for (const side of [-1, 1]) furniture.push({ center: [x! + side * 1.22, .425, z!], size: [.55, .45, 1.8] }, { center: [x! + side * 1.47, .85, z!], size: [.11, .8, 1.8] });
  }
  for (const z of [-10.5, -4, 4, 10.5]) structure.push({ center: [0, 5.84, z], size: [8.25, .32, .24] });
  for (const x of [-10.5, 10.5]) structure.push({ center: [x, 5.84, 0], size: [.24, .32, 8.25] });
  parts.push(boxesMesh("四角厨核界柱与高十字餐堂实际接承的完整柱梁", dark, structure), boxesMesh("四厨真正落地的备餐柜与交付口下柜", cabinetColor, counters));
  for (let offset = 0; offset < furniture.length; offset += 20) parts.push(boxesMesh("各厨房交付实槛及餐堂避让中央十字通路的落地桌座", timber, furniture.slice(offset, offset + 20)));
  return parts;
}
