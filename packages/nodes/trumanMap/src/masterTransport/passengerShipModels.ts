import type { ModelPart } from "../assetModelParts";
import { ball, box, cylinder, shipHull, strut, transportColors, type TransportDefinition } from "./parts";

// 长舱分为两段，仅遵守单部件变换上限，不增加素材条目或模型面数级别。
function longDeck(name: string, width: number, height: number, length: number, y: number, z: number, color = transportColors.trim): ModelPart[] {
  return [-1, 1].map(side => box(name, [0, y, z + side * length / 4], [width, height, length / 2], color));
}

export const passengerShipModels: TransportDefinition[] = [
  { name: "飞桥式机动休闲游艇", tags: ["游艇", "上层露天驾驶台", "艉部泳台"], create: () => {
    const parts: ModelPart[] = [shipHull(4, 14, 1.3), box("前甲板日光垫", [0, 1.48, -3.7], [2.8, 0.22, 2.1], transportColors.signal), box("中部连续客舱", [0, 2, 0.2], [3.45, 1.4, 5.5], transportColors.trim), ball("倾斜前风挡", [0, 2.53, -2.1], [3.15, 0.88, 1.1], transportColors.glass), box("客舱顶露天飞桥底", [0, 2.81, 0.7], [3.55, 0.18, 4.4]), box("露天驾驶台仪表座", [0, 3.18, -0.7], [1.8, 0.6, 0.48]), box("飞桥后座坐垫", [0, 3.05, 2.15], [2.7, 0.25, 0.6], transportColors.signal), box("飞桥后座靠背", [0, 3.42, 2.4], [2.7, 0.55, 0.16], transportColors.trim), box("艉部下水泳台", [0, 0.95, 7.1], [3.8, 0.18, 1.1]), cylinder("驾驶舵轮", [0, 3.54, -0.82], [0.4, 0.05, 0.4], transportColors.dark, [55, 0, 0])];
    for (const side of [-1, 1]) {
      parts.push(box("客舱侧窗带", [side * 1.73, 2.3, 0.5], [0.03, 0.6, 3.5], transportColors.glass), strut("艏侧扶手", [side * 0.12, 2, -6.6], [side * 1.7, 2, -2.7], 0.035, transportColors.trim), strut("飞桥侧栏", [side * 1.55, 3.55, -0.5], [side * 1.55, 3.55, 2.4], 0.035, transportColors.trim), strut("艉通道侧栏", [side * 1.7, 1.9, 3.1], [side * 1.7, 1.9, 5.8], 0.035, transportColors.trim));
      for (const z of [-4.5, -2.7]) parts.push(strut("前侧扶手支柱", [side * (z < -3 ? 0.98 : 1.7), 1.3, z], [side * (z < -3 ? 0.98 : 1.7), 2, z], 0.03, transportColors.trim));
      for (const y of [1.45, 1.775, 2.1, 2.425, 2.75]) parts.push(box("艉至飞桥侧梯踏步", [side * 1.25, y, 4.5 - (y - 1.45) * 1.05], [0.5, 0.08, 0.43], transportColors.wood));
      for (const z of [-0.5, 2.4]) parts.push(strut("飞桥栏杆支柱", [side * 1.55, 2.9, z], [side * 1.55, 3.55, z], 0.035, transportColors.trim));
      for (const z of [3.1, 5.8]) parts.push(strut("艉侧栏杆支柱", [side * 1.7, 1.3, z], [side * 1.7, 1.9, z], 0.035, transportColors.trim));
      parts.push(strut("飞桥风挡弧架", [side * 1.4, 2.9, -1.3], [side * 1.4, 3.4, -0.7], 0.05), box("飞桥小风挡", [side * 0.7, 3.2, -1], [1.3, 0.5, 0.04], transportColors.glass, [30, 0, 0]));
    }
    return parts;
  } },
  { name: "多层观景甲板邮轮", tags: ["邮轮", "海上旅客运输", "救生艇甲板"], create: () => {
    const parts: ModelPart[] = [shipHull(31, 235, 9), ...longDeck("客舱下层舱体", 28, 7, 184, 12.5, 0), ...longDeck("观景客舱上层舱体", 25, 5.4, 170, 18.7, 1), ...longDeck("退台公共活动甲板", 21, 3.8, 148, 23.3, 3), ...longDeck("上层露天游步甲板", 21.5, 0.35, 150, 25.4, 3), box("前端全宽驾驶室", [0, 22.2, -78], [29, 3.4, 12]), box("驾驶室前方观察窗", [0, 22.5, -84.05], [26, 1.5, 0.12], transportColors.glass), box("上甲板泳池内衬", [0, 25.61, 12], [7, 0.2, 17], transportColors.glass), box("泳池左侧壁", [-3.65, 25.85, 12], [0.3, 0.5, 17.6]), box("泳池右侧壁", [3.65, 25.85, 12], [0.3, 0.5, 17.6]), ...[-1, 1].map(side => box("泳池端壁", [0, 25.85, 12 + side * 8.65], [7.6, 0.5, 0.3])), cylinder("后置排烟总管", [0, 28.4, 42], [6.8, 6.2, 6.8], transportColors.signal), ball("顶部卫星罩", [0, 28.2, -31], [5, 5, 5])];
    for (const side of [-1, 1]) {
      for (const [y, x, length] of [[11, 14.04, 176], [14.2, 14.04, 176], [18.1, 12.54, 162], [20.4, 12.54, 162], [23.6, 10.54, 138]]) for (const half of [-1, 1]) parts.push(box("连续海景窗带", [side * x!, y!, half * length! / 4 + 1], [0.1, 0.85, length! / 2], transportColors.glass));
      for (const z of [-53, -19, 15, 49]) parts.push(ball("舷侧封闭救生艇", [side * 15.1, 15.4, z], [3.2, 2.5, 9.8], transportColors.signal), strut("救生艇外悬吊架", [side * 13, 17, z], [side * 16, 17, z], 0.3));
      for (const z of [-25, 0, 25]) parts.push(box("露天躺椅组", [side * 6.8, 25.8, z], [1.8, 0.5, 4], transportColors.trim));
    }
    return parts;
  } },
];
