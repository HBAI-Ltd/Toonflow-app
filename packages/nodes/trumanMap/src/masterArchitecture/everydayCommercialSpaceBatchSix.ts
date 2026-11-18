import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, design, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b8b9ad", wall = "#d0cbb9", steel = "#637b7d", pale = "#c7cdbd", wood = "#a18b69", glass = "#a2c7c2", sign = "#879e8a";

export const everydayCommercialSpaceBatchSixDesigns: ArchitecturePrototype[] = [
  design("削角双门高侧光社区超市", "六边削角店壳的前街入口与收银出口分开，高中央屋跨由真实列柱和横梁承托，低侧屋面沿削角闭合；六排营业货架经前后横道围行，独立补货室及后巷中通道避开冷柜和储架", clerestorySupermarket, "建筑", "现代"),
];

function clerestorySupermarket(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("超市营业与补货区共同的六边削角落地楼面", paving, [[-16, -16], [-11, -20], [11, -20], [16, -16], [16, 18], [-16, 18]], .3, [0, 0, 0]),
    hardFloor("低西屋面真实顺着前街削角闭合", steel, [[-16.3, -16.1], [-11.1, -20.3], [-4, -20.3], [-4, 18.3], [-16.3, 18.3]], .25, [0, 4.8, 0]),
    hardFloor("低东屋面真实顺着前街削角闭合", steel, [[4, -20.3], [11.1, -20.3], [16.3, -16.1], [16.3, 18.3], [4, 18.3]], .25, [0, 4.8, 0]),
    box("高位中央完整轻屋盖实际跨在内柱列上", 0, 6.125, -1, 8.6, .25, 38.6, sign),
    ...glazedWall("前街真正分开的进店入口与收银出口", [-11, -20], [11, -20], .3, 4.8, [[-9, .9, 2.2, 2.6], [0, .9, 6, 2.6], [9, .9, 2.2, 2.6]], [[-6, .3, 2.2, 3], [6, .3, 2.2, 3]]),
    ...glazedWall("西削角街面实际开通的完整展示窗", [-16, -16], [-11, -20], .3, 4.8, [[0, .9, 4.8, 2.6]]),
    ...glazedWall("东削角街面实际开通的完整展示窗", [11, -20], [16, -16], .3, 4.8, [[0, .9, 4.8, 2.6]]),
    ...glazedWall("超市西外承墙具有实际贯通高侧窗", [-16, -16], [-16, 18], .3, 4.8, [[-11, 2.6, 6.2, 1], [0, 2.6, 6.2, 1], [11, 2.6, 6.2, 1]]),
    ...glazedWall("超市东外承墙具有实际贯通高侧窗", [16, 18], [16, -16], .3, 4.8, [[-11, 2.6, 6.2, 1], [0, 2.6, 6.2, 1], [11, 2.6, 6.2, 1]]),
    ...glazedWall("独立后补货室实际通向后巷的宽门", [-16, 18], [16, 18], .3, 4.8, [[-10, 2.6, 5, 1], [10, 2.6, 5, 1]], [[0, .3, 2.4, 3]]),
    ...glazedWall("后补货条带通过两端真实内门接入营业间", [-16, 12], [16, 12], .3, 4.8, [], [[-10, .3, 1.5, 2.6], [10, .3, 1.5, 2.6]]),
    box("中央高屋跨前端实际封合的高墙头", 0, 5.4, -20, 8, 1.2, .24, wall),
    box("中央高屋跨后端实际封合的高墙头", 0, 5.4, 18, 8, 1.2, .24, wall),
    box("店头高墙之前连续且避开门口的实体牌面", 0, 4.1, -20.25, 21.8, .6, .14, sign),
  ];
  const structure: SolidBox[] = [], shelves: SolidBox[] = [], checkout: SolidBox[] = [], cold: SolidBox[] = [];
  for (const side of [-1, 1]) {
    p.push(part("高低屋面之间真正连续透光的高侧窗带", "box", glass, [side * 4, 5.4, -1], [.055, 1.2, 38.6], [0, 0, 0], { opacity: .25, roughness: .2 }));
    for (const z of [-15, -4, 7, 17]) {
      structure.push({ center: [side * 4, 3.15, z], size: [.24, 5.7, .24] }, { center: [side * 10, 4.55, z], size: [12.1, .5, .24] });
    }
  }
  for (const z of [-15, -4, 7, 17]) structure.push({ center: [0, 5.75, z], size: [8.3, .5, .25] });
  for (const z of [-20, 18]) for (const side of [-1, 1]) structure.push({ center: [side * 4, 5.4, z], size: [.12, 1.2, .24] });
  for (let index = 0; index < structure.length; index += 20) p.push(boxesMesh("高中央屋跨真实落地列柱与全部侧跨横梁", steel, structure.slice(index, index + 20)));

  for (const x of [-10, -6, -2, 2, 6, 10]) {
    for (const end of [-1, 1]) shelves.push({ center: [x, 1.25, end * 8.92], size: [1.2, 1.9, .16] });
    shelves.push({ center: [x, 1.25, 0], size: [.08, 1.9, 18] });
    for (const y of [.4, .95, 1.5, 2.05]) shelves.push({ center: [x, y, 0], size: [1.2, .08, 18] });
  }
  for (const x of [-8, 8]) for (const z of [14, 16.5]) {
    for (const y of [.4, 1.05, 1.7]) shelves.push({ center: [x, y, z], size: [10, .08, .7] });
    for (const side of [-1, 1]) shelves.push({ center: [x + side * 4.85, 1.05, z], size: [.08, 1.5, .7] });
  }
  for (let index = 0; index < shelves.length; index += 20) p.push(boxesMesh("六排完整营业货架与后补货架全部真实板格", pale, shelves.slice(index, index + 20)));

  for (const x of [1.1, 4.1, 7.1]) {
    checkout.push({ center: [x, .8, -15.2], size: [1.2, 1, 3.2] }, { center: [x, 1.34, -15.2], size: [1.35, .08, 3.35] }, { center: [x + .2, 1.55, -16.25], size: [.35, .35, .35] });
  }
  p.push(boxesMesh("前街出口之前三条各自留通行口的收银台", wood, checkout));

  cold.push({ center: [0, .4, 10.8], size: [12, .2, 1.1] }, { center: [0, 2.5, 10.8], size: [12, .16, 1.1] }, { center: [0, 1.45, 11.3], size: [12, 2.1, .1] });
  for (const x of [-5.95, -4, -2, 0, 2, 4, 5.95]) cold.push({ center: [x, 1.45, 10.8], size: [.1, 2.1, 1.1] });
  for (const y of [.9, 1.5, 2.1]) cold.push({ center: [0, y, 10.8], size: [11.8, .06, 1] });
  p.push(boxesMesh("不挡后工作门的真实空腔冷藏列柜", pale, cold), part("冷藏列柜空腔前的独立透明门带", "box", glass, [0, 1.45, 10.27], [11.8, 2.0, .035], [0, 0, 0], { opacity: .23, roughness: .18 }));
  return p;
}
