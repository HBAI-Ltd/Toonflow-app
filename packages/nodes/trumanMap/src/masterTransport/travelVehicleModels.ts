import { part, type ModelPart } from "../assetModelParts";
import { axles, box, cab, chassis, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";

function livingShell(width: number, length: number, floor: number): ModelPart[] {
  const height = 2, parts = [box("居住厢地板", [0, floor, 0], [width, 0.15, length], transportColors.wood), box("居住厢顶板", [0, floor + height, 0], [width + 0.08, 0.14, length + 0.08], transportColors.trim)];
  for (const side of [-1, 1]) {
    parts.push(box("窗下连续厢壁", [side * width / 2, floor + 0.43, 0], [0.09, 0.8, length]), box("窗上连续厢壁", [side * width / 2, floor + 1.82, 0], [0.09, 0.3, length]));
    for (let index = 0; index < 4; index++) parts.push(box("厢壁承重窗柱", [side * width / 2, floor + 1.25, (index - 1.5) * length / 3], [0.1, 1, 0.13]));
    for (const bay of [-1, 0, 1]) parts.push(part("居住厢透明侧窗", "box", transportColors.glass, [side * width / 2, floor + 1.25, bay * length / 3], [0.04, 0.85, length / 3 - 0.13], [0, 0, 0], { opacity: 0.45 }));
  }
  for (const end of [-1, 1]) parts.push(box("居住厢封闭端墙", [0, floor + 1, end * length / 2], [width, 2, 0.1]));
  parts.push(box("侧门封板", [width / 2 + 0.025, floor + 0.9, -length * 0.25], [0.07, 1.8, 0.65], transportColors.trim), box("侧门把手", [width / 2 + 0.08, floor + 0.9, -length * 0.3], [0.04, 0.05, 0.15], transportColors.dark), box("后置固定铺位", [0, floor + 0.3, length * 0.28], [width * 0.8, 0.45, 1.25], transportColors.wood), box("铺位软床垫", [0, floor + 0.57, length * 0.28], [width * 0.79, 0.12, 1.23], transportColors.trim), box("窄体厨房储物台", [-width * 0.28, floor + 0.5, -length * 0.08], [width * 0.35, 0.9, 1.1], transportColors.body), box("厨房台面", [-width * 0.28, floor + 0.98, -length * 0.08], [width * 0.38, 0.07, 1.2], transportColors.trim));
  return parts;
}

export const travelVehicleModels: TransportDefinition[] = [
  { name: "自行式露营房车", theme: "现代", tags: ["房车", "露营车", "旅行居住", "独立驾驶室", "固定铺位"], create: () => {
    const shell = livingShell(2.3, 5.4, 1.1); for (const value of shell) value.position.z += 0.6;
    const parts = [...chassis(2.25, 6.8, 0.43, [-2.8, 2]), ...cab([0, 1.02, -2.85], [2.1, 1.8, 1.5]), ...shell, box("驾驶舱下部承载体", [0, 0.86, -2.85], [1.9, 0.35, 1.4], transportColors.dark), ...[-1, 1].map(side => box("居住厢底部承载纵梁", [side * 0.8, 0.9, 0.6], [0.15, 0.4, 5.4], transportColors.dark)), box("驾驶舱上方卧铺延伸厢", [0, 2.9, -2.4], [2.25, 0.6, 2.2], transportColors.body), box("卧铺前端窄窗", [0, 2.95, -3.52], [1.6, 0.22, 0.035], transportColors.glass), box("车尾固定踏步", [0, 0.75, 3.48], [1.6, 0.15, 0.35], transportColors.dark), box("车侧上门踏步", [1.3, 0.76, -0.75], [0.45, 0.16, 0.7], transportColors.dark)];
    for (const z of [-1, -0.5]) parts.push(strut("居住厢纵梁接入侧门踏步底部的实际斜托", [0.82, 0.84, z], [1.3, 0.72, z], 0.08, transportColors.dark));
    return parts;
  } },
  { name: "拖挂式野营居住厢", theme: "现代", tags: ["拖挂房车", "露营拖车", "旅居拖厢", "前端A形牵引架", "驻车导轮"], create: () => {
    const parts = [...axles(2, [-0.6, 0.6], 0.32), box("拖厢承力底框", [0, 0.68, 0], [2.15, 0.2, 4.5], transportColors.dark), ...livingShell(2.2, 4.4, 0.85), ...[-1, 1].map(side => strut("A形牵引架侧梁", [side * 0.9, 0.65, -1.8], [0, 0.65, -3.3], 0.1, transportColors.dark)), cylinder("前端球头牵引扣", [0, 0.65, -3.4], [0.15, 0.28, 0.15], transportColors.trim, [90, 0, 0]), strut("驻车导轮伸缩杆", [0.23, 0.7, -2.8], [0.23, 0.13, -2.8], 0.055), ...wheel([0.23, 0.12, -2.8], 0.12, 0.065), box("车尾横向保险杠", [0, 0.63, 2.35], [2.2, 0.13, 0.15], transportColors.dark)];
    return parts;
  } },
  { name: "拖挂式餐饮售卖车", theme: "现代", tags: ["餐车", "流动餐车", "餐饮摊售", "向外翻起服务窗", "灶台排风罩"], create: () => {
    const parts: ModelPart[] = [...axles(1.8, [0.3], 0.3), box("餐车承托底盘", [0, 0.65, 0], [2, 0.2, 3.7], transportColors.dark), box("餐车室内地板", [0, 0.82, 0], [1.9, 0.15, 3.5], transportColors.wood), box("完整左侧厢壁", [-0.96, 1.8, 0], [0.09, 2, 3.5], transportColors.body), box("售卖窗下厢壁", [0.96, 1.2, 0], [0.09, 0.8, 3.5], transportColors.signal), box("服务窗上门楣", [0.96, 2.65, 0], [0.09, 0.3, 3.5], transportColors.body), ...[-1, 1].map(end => box("售卖车前后墙", [0, 1.8, end * 1.75], [1.95, 2, 0.1], transportColors.body)), box("厢顶平屋盖", [0, 2.86, 0], [2.1, 0.15, 3.75], transportColors.trim), box("向外伸出的售卖窗台", [1.15, 1.58, 0], [0.6, 0.1, 2.8], transportColors.trim), box("翻起的售卖遮雨窗板", [1.37, 2.72, 0], [1.1, 0.07, 2.9], transportColors.signal, [0, 0, -12]), box("室内连续不锈钢操作台", [-0.48, 1.3, 0], [0.7, 0.9, 2.9], transportColors.trim), box("室内灶面", [-0.48, 1.8, 0.6], [0.65, 0.06, 0.9], transportColors.dark), box("灶台上方集烟罩", [-0.5, 2.5, 0.6], [0.8, 0.3, 1.1], transportColors.body), cylinder("贯顶排烟短管", [-0.5, 2.9, 0.6], [0.25, 0.7, 0.25], transportColors.dark), ...[-1, 1].map(side => strut("餐车牵引双斜梁", [side * 0.75, 0.6, -1.5], [0, 0.6, -2.7], 0.09)), cylinder("前端牵引连接扣", [0, 0.6, -2.82], [0.13, 0.3, 0.13], transportColors.trim, [90, 0, 0]), strut("前部驻车支腿", [0, 0.6, -2.4], [0, 0.06, -2.4], 0.055)];
    for (const end of [-1, 1]) parts.push(strut("售卖窗翻盖撑杆", [1, 1.9, end * 1.25], [1.75, 2.6, end * 1.25], 0.018), cylinder("灶面圆形炉圈", [-0.48, 1.84, 0.6 + end * 0.22], [0.22, 0.025, 0.22], transportColors.trim)); return parts;
  } },
];
