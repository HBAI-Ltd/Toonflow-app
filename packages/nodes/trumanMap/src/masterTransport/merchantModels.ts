import { part, type ModelPart } from "../assetModelParts";
import { ball, box, cylinder, shipHull, strut, transportColors, type TransportDefinition } from "./parts";

export function aftHouse(width: number, y: number, z: number): ModelPart[] {
  return [box("尾部居住上层建筑", [0, y + 1.2, z], [width * 0.8, 2.4, 2.2]), box("贯通驾驶室", [0, y + 2.6, z - 0.3], [width * 0.95, 0.8, 1.8], transportColors.trim), box("驾驶室前窗带", [0, y + 2.7, z - 1.22], [width * 0.85, 0.36, 0.035], transportColors.glass), box("后部排气烟囱", [0, y + 3.7, z + 0.5], [0.65, 1.4, 0.8], transportColors.dark)];
}
function openHold(position: [number, number, number], width: number, length: number): ModelPart[] {
  const [x, y, z] = position;
  return [box("开口货舱深色底", [x, y, z], [width, 0.06, length], transportColors.dark), ...[-1, 1].flatMap(side => [box("货舱纵向围板", [x + side * width / 2, y + 0.35, z], [0.1, 0.7, length]), box("货舱横向围板", [x, y + 0.35, z + side * length / 2], [width, 0.7, 0.1])])];
}
function marine(name: string, create: TransportDefinition["create"], tags: string[] = ["商用船舶"]): TransportDefinition { return { name, create, tags }; }

export const merchantModels: TransportDefinition[] = [
  marine("成品油运输船", () => {
    const parts: ModelPart[] = [shipHull(4.2, 16, 1.6), ...aftHouse(4.2, 1.6, 5.6), box("中央管线栈道", [0, 1.85, -1.6], [0.45, 0.15, 9.5], transportColors.dark)];
    for (const z of [-4.8, -2, 0.8]) for (const side of [-1, 1]) parts.push(cylinder("圆形货油舱检修口", [side * 0.95, 1.78, z], [0.65, 0.2, 0.65], transportColors.trim), strut("甲板货油输送管", [side * 0.95, 1.9, z], [0, 1.9, z], 0.07));
    parts.push(cylinder("装卸总管横向歧管", [0, 2.1, -0.5], [0.18, 4.5, 0.18], transportColors.signal, [0, 0, 90])); return parts;
  }),
  marine("散装矿砂运输船", () => [shipHull(4.8, 17.5, 1.8), ...aftHouse(4.8, 1.8, 6.1), ...[-4.5, -0.6, 3.3].flatMap(z => openHold([0, 1.85, z], 3.3, 3.3)), ...[-2.5, 1.5].flatMap(z => [cylinder("舱间货物起重支柱", [0, 3, z], [0.45, 2.4, 0.45], transportColors.signal), strut("起重吊臂", [0, 4.2, z], [2.2, 3.6, z - 1], 0.15), strut("吊货垂索", [2.2, 3.6, z - 1], [2.2, 2, z - 1], 0.025)])]),
  marine("木材甲板运输船", () => {
    const parts: ModelPart[] = [shipHull(4, 15, 1.5), ...aftHouse(4, 1.5, 5.3)];
    for (const x of [-1.1, -0.35, 0.4, 1.15]) for (const y of [1.9, 2.5]) parts.push(cylinder("捆扎长原木", [x, y, -1], [0.6, 8.8, 0.6], transportColors.wood, [90, 0, 0]));
    for (const side of [-1, 1]) for (const z of [-4.5, -1, 2.5]) parts.push(box("甲板护木立桩", [side * 1.7, 2.2, z], [0.14, 2, 0.14], transportColors.dark));
    parts.push(cylinder("偏置装木吊架座", [1.4, 2.8, 3.5], [0.45, 2.5, 0.45]), strut("装木吊架臂", [1.4, 4, 3.5], [-1.7, 4.6, 2], 0.18), strut("装木吊索", [-1.7, 4.6, 2], [-1.7, 2.3, 2], 0.025)); return parts;
  }),
  marine("牲畜通风甲板运输船", () => {
    const parts: ModelPart[] = [shipHull(4.3, 14, 1.6), ...aftHouse(4.3, 1.6, 4.9)];
    for (const y of [1.9, 3, 4.1]) { parts.push(box("通风畜栏甲板", [0, y, -1.3], [3.9, 0.12, 8.5], transportColors.trim)); for (const side of [-1, 1]) { parts.push(box("开放侧围横栏", [side * 1.85, y + 0.6, -1.3], [0.04, 0.04, 8.4], transportColors.dark)); for (const z of [-5.3, -3.3, -1.3, 0.7, 2.7]) parts.push(strut("通风甲板承重柱", [side * 1.85, y, z], [side * 1.85, y + 1.1, z], 0.06)); } }
    parts.push(box("畜栏总顶棚", [0, 5.2, -1.3], [4, 0.13, 8.7])); return parts;
  }),
  marine("全封闭汽车运输船", () => [shipHull(5.2, 16, 1.7), box("多层封闭滚装舱", [0, 3.1, 0], [4.9, 2.8, 13.1], transportColors.trim), box("货舱顶部驾驶室", [0, 5, -4.5], [4.75, 1, 1.8]), box("驾驶室前窗带", [0, 5.1, -5.42], [4.25, 0.4, 0.035], transportColors.glass), box("独立排气烟囱", [1.6, 5.1, 4.9], [0.65, 1.2, 0.8], transportColors.dark), box("尾部斜置滚装跳板", [1.6, 1.6, 7.5], [2.4, 0.18, 3.4], transportColors.dark, [20, -20, 0]), ...[2.2, 3.2, 4.2].map(y => box("封闭货舱通风条", [2.46, y, 0.5], [0.025, 0.16, 9], transportColors.body))]),
  marine("半潜式重大件运输船", () => [shipHull(6.1, 20, 1.1), box("超低位贯通货物甲板", [0, 1.15, 0.2], [5.7, 0.2, 14], transportColors.dark), box("前置艏楼", [0, 2.1, -7.4], [5, 2.1, 3.2]), box("艏楼高位驾驶台", [0, 3.6, -7.4], [5.4, 0.9, 1.9], transportColors.trim), ...[-1, 1].map(side => box("尾部独立浮力塔", [side * 2.25, 2.6, 8], [1.25, 3.2, 2.4], transportColors.body)), box("艏楼前窗", [0, 3.7, -8.4], [4.5, 0.4, 0.03], transportColors.glass)]),
  marine("后张紧管道铺设船", () => {
    const parts: ModelPart[] = [shipHull(5, 18, 1.7), ...aftHouse(5, 1.7, -5.5), box("中轴管道焊接棚", [0, 2.8, 0], [2.7, 2.1, 5], transportColors.trim), strut("待铺长输管", [0, 2.1, -0.8], [0, 1.3, 12.4], 0.25, transportColors.dark)];
    for (const side of [-1, 1]) { parts.push(strut("尾部铺管托架弦杆", [side * 0.65, 1.8, 5], [side * 0.65, 0.7, 12.5], 0.13)); for (const z of [5.5, 7.2, 8.9, 10.6, 12.3]) parts.push(strut("铺管架横向滚轮", [-0.65, 1.8 - (z - 5) * 0.15, z], [0.65, 1.8 - (z - 5) * 0.15, z], 0.11), strut("铺管架三角腹杆", [side * 0.65, 1.8 - (z - 5) * 0.15, z], [side * 0.65, 1.2 - (z - 5) * 0.15, z + 0.8], 0.065)); } return parts;
  }, ["海洋工程"]),
  marine("耙吸式挖泥运输船", () => [shipHull(5.1, 17, 1.8), ...aftHouse(5.1, 1.8, 5.8), ...openHold([0, 1.85, -0.8], 3.1, 7.5), ...[-1, 1].flatMap(side => [strut("侧置活动吸泥管", [side * 2.3, 2.1, -3.4], [side * 3.3, 0.4, 2], 0.3), box("底部耙吸泥头", [side * 3.3, 0.3, 2.5], [1.3, 0.4, 1.1], transportColors.dark), strut("吸泥管吊架", [side * 1.7, 1.9, -0.5], [side * 2.3, 4, -0.5], 0.15), strut("吸泥管起吊索", [side * 2.3, 4, -0.5], [side * 2.8, 1.2, -0.5], 0.025)])], ["海洋工程"]),
  marine("链斗式挖泥船", () => {
    const parts: ModelPart[] = [shipHull(4.6, 13, 1.3), ...aftHouse(4.6, 1.3, 4.1), ...[-1, 1].map(side => strut("中部链斗高架", [side * 1.2, 1.4, 0], [side * 0.75, 4.4, -1.2], 0.18)), box("斜向链斗导轨", [0, 2.1, -2], [0.65, 0.4, 6.7], transportColors.dark, [-36, 0, 0]), box("侧向排泥溜槽", [1.7, 2, 0.6], [3.4, 0.13, 0.9], transportColors.trim, [0, 0, -12])];
    for (let index = 0; index < 10; index++) parts.push(box("连续挖泥链斗", [0, 0.4 + index * 0.35, -4.3 + index * 0.48], [0.95, 0.36, 0.42], transportColors.signal, [-36, 0, 0])); return parts;
  }, ["海洋工程"]),
  marine("艉明轮蒸汽客船", () => {
    const parts: ModelPart[] = [shipHull(4.2, 13.5, 1.3), box("连续客舱下层", [0, 2, 0], [3.6, 1.35, 8.5], transportColors.trim), box("开放上层游步甲板", [0, 2.8, 0], [3.9, 0.15, 9]), box("上层客舱", [0, 3.6, -0.5], [2.7, 1.45, 6.3], transportColors.trim), ...[-1, 1].map(side => cylinder("双高蒸汽烟囱", [side * 0.75, 4.8, -2.5], [0.4, 3.2, 0.4], transportColors.dark)), cylinder("艉部明轮转轴", [0, 1.5, 6.8], [0.2, 3.6, 0.2], transportColors.dark, [0, 0, 90]), ...[-1, 1].map(side => cylinder("明轮侧支承盘", [side * 1.5, 1.5, 6.8], [2.2, 0.1, 2.2], transportColors.signal, [0, 0, 90]))];
    for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4; parts.push(box("明轮宽幅桨板", [0, 1.5 + Math.sin(angle) * 1.05, 6.8 + Math.cos(angle) * 1.05], [3.4, 0.24, 0.15], transportColors.wood, [-index * 45, 0, 0])); } return parts;
  }, ["历史", "蒸汽船"]),
  marine("艏门登陆艇", () => [shipHull(3.4, 9.5, 1.2), box("中部低位车辆舱", [0, 1.23, -0.4], [2.7, 0.1, 6.5], transportColors.dark), ...[-1, 1].map(side => box("高直侧舷", [side * 1.5, 1.6, 0], [0.25, 1.3, 7.8])), box("侧置后驾驶舱", [1, 2.1, 2.8], [1.05, 1.2, 1.4], transportColors.trim), box("前端放下登陆跳板", [0, 0.9, -5.2], [2.8, 0.15, 2.5], transportColors.body, [-24, 0, 0]), ...[-1, 1].map(side => strut("跳板牵引索", [side * 1.35, 2.1, -3.8], [side * 1.35, 0.5, -6.3], 0.025))], ["两栖登陆"]),
  marine("封闭式自由降落救生艇", () => [shipHull(2.3, 5.5, 1.2), ball("全封闭抗浪艇舱", [0, 1.15, 0], [2.1, 1.7, 4.5], transportColors.signal), ...[-1, 1].flatMap(side => [-1.2, -0.4, 0.4, 1.2].map(z => ball("密封舷窗", [side * 0.93, 1.5, z], [0.04, 0.3, 0.35], transportColors.glass))), box("顶部人员进出舱盖", [0, 2, 0], [0.7, 0.1, 0.8], transportColors.trim), cylinder("底部尾推进器", [0, 0.45, 2.7], [0.4, 0.5, 0.4], transportColors.dark, [90, 0, 0])], ["水面救援"]),
];
