import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { box, design, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b8b9ad", wall = "#d1cfbf", pale = "#c5cebd", wood = "#a58f70", steel = "#687e7e", glass = "#a4c5bf";

export const everydayCommercialSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("丁字前厅独立咨询社区药房", "宽低公共前厅接向窄高后药库，前左真门咨询室和右侧配药柜把公共与工作路线分开；后药库通过独立员工门及真实配药口服务前厅，双柜夹道直接连到后巷门", communityPharmacy, "建筑", "现代"),
];

function communityPharmacy(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("低宽前厅与高窄药库相接的完整丁字楼面", paving, [[-8, -7], [8, -7], [8, -1], [4, -1], [4, 8], [-4, 8], [-4, -1], [-8, -1]], .2, [0, 0, 0]),
    box("药房公共前厅完整低位屋盖", 0, 3.825, -4, 16.6, .25, 6.6, steel),
    box("窄后药库完整高位屋盖", 0, 4.625, 3.5, 8.6, .25, 9.6, steel),
    ...glazedWall("药房街面真实主门和两侧营业橱窗", [-8, -7], [8, -7], .2, 3.7, [[-4.7, .75, 4.6, 2.1], [4.7, .75, 4.6, 2.1]], [[0, .2, 1.8, 2.6]]),
    ...glazedWall("公共前厅东侧独立对外出口", [8, -7], [8, -1], .2, 3.7, [[1.7, 1.2, 1.4, 1.5]], [[-1.2, .2, 1.2, 2.6]]),
    ...glazedWall("咨询室一侧外墙的真实高窗", [-8, -7], [-8, -1], .2, 3.7, [[1.2, 2.5, 2.6, .7]]),
    ...glazedWall("公共前厅西后肩与咨询室背面完整封墙", [-8, -1], [-4, -1], .2, 3.7, []),
    ...glazedWall("公共前厅东后肩完整承墙", [4, -1], [8, -1], .2, 3.7, []),
    ...glazedWall("后药库西侧实际高采光窗", [-4, -1], [-4, 8], .2, 4.5, [[0, 3.1, 5, .8]]),
    ...glazedWall("后药库东侧实际高采光窗", [4, -1], [4, 8], .2, 4.5, [[0, 3.1, 5, .8]]),
    ...glazedWall("后药库夹道尽端真实后巷补货门", [-4, 8], [4, 8], .2, 4.5, [[-2.6, 3.1, 1.5, .8], [2.6, 3.1, 1.5, .8]], [[0, .2, 1.3, 2.6]]),
    standingPanel("窄高药库正墙保留员工真门和贯通配药口", wall, [[-4, .2], [-2.85, .2], [-2.85, 2.8], [-1.75, 2.8], [-1.75, .2], [4, .2], [4, 4.5], [-4, 4.5]], [[[-.8, 1.25], [2.7, 1.25], [2.7, 2.3], [-.8, 2.3]]], -1, .24),
    ...glazedWall("公共前厅真实进入独立咨询室的内门", [-8, -4], [-3, -4], .2, 3.7, [], [[.3, .2, 1.1, 2.5]]),
    box("咨询室与配药工作通路之间完整侧隔墙", -3, 1.95, -2.5, .18, 3.5, 3, wall),
    box("配药柜真实落地柜身且让出西侧员工门", 1.6, .72, -2.0, 6, 1.04, .8, pale),
    box("配药柜上可用的连续台面", 1.6, 1.28, -2, 6.15, .08, .92, wood),
    box("贯通配药口下真正接入柜体的短台面", .95, 1.28, -1.35, 3.65, .08, .9, wood),
    box("咨询室内留出顾客门口的固定桌面", -6.8, .97, -2.4, .85, .08, 1.6, wood),
    part("咨询桌面上独立透明分隔板", "box", glass, [-6.8, 1.37, -2.4], [.035, .72, 1.5], [0, 0, 0], { opacity: .24, roughness: .2 }),
    box("街檐下清楚独立且不遮门的店头牌面", 0, 3.22, -7.2, 15.8, .5, .13, pale),
  ];
  const cabinets: SolidBox[] = [], fittings: SolidBox[] = [];
  for (const side of [-1, 1]) {
    cabinets.push({ center: [side * 3.3, 1.52, 3.5], size: [.1, 2.64, 6.8] });
    for (const z of [.2, 6.8]) cabinets.push({ center: [side * 2.95, 1.52, z], size: [.8, 2.64, .1] });
    for (const y of [.3, .8, 1.3, 1.8, 2.3, 2.8]) cabinets.push({ center: [side * 2.95, y, 3.5], size: [.8, .07, 6.8] });
    for (const z of [2.1, 4.7]) cabinets.push({ center: [side * 2.95, 1.52, z], size: [.8, 2.64, .075] });
  }
  for (let index = 0; index < cabinets.length; index += 20) p.push(boxesMesh("两侧配药柜全部真实承板层格保留中间工作道", pale, cabinets.slice(index, index + 20)));
  fittings.push({ center: [-6.8, .565, -2.4], size: [.15, .73, 1.2] });
  for (const x of [-7.55, -5.3]) fittings.push({ center: [x, .425, -2.4], size: [.6, .45, .65] }, { center: [x + (x < -6 ? -.3 : .3), .8, -2.4], size: [.1, .75, .65] });
  fittings.push({ center: [6.6, .45, -2.8], size: [.7, .5, 1.6] }, { center: [7, .9, -2.8], size: [.14, .9, 1.6] });
  for (const z of [-.8, 3.5, 7.8]) fittings.push({ center: [0, 4.275, z], size: [8.1, .45, .2] });
  fittings.push({ center: [0, 3.475, -6.8], size: [16.1, .45, .2] }, { center: [0, 3.475, -1.2], size: [16.1, .45, .2] });
  p.push(boxesMesh("药房咨询桌椅候位座和承墙顶梁全部实际连接", wood, fittings));
  return p;
}
