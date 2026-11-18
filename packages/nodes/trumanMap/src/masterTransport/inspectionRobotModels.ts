import type { ModelPart } from "../assetModelParts";
import { ball, box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";

export const inspectionRobotModels: TransportDefinition[] = [
  { name: "双足仿人行走机器人", theme: "科幻", tags: ["机器人", "人形机器人", "双足步行", "髋膝踝关节", "独立手臂", "平足支撑"], create: () => {
    const parts = [box("上身承力电池躯干", [0, 1.25, 0], [0.4, 0.46, 0.23]), box("骨盆横向承力框", [0, 0.92, 0], [0.36, 0.18, 0.23], transportColors.dark), cylinder("颈部转动短轴", [0, 1.54, 0], [0.08, 0.12, 0.08]), box("多传感器头部", [0, 1.67, -0.01], [0.24, 0.2, 0.2], transportColors.trim), box("头部前方视觉窗", [0, 1.68, -0.116], [0.2, 0.065, 0.02], transportColors.glass)];
    for (const side of [-1, 1]) {
      const x = side * 0.13;
      parts.push(cylinder("双足髋部横轴关节", [x, 0.92, 0], [0.14, 0.12, 0.14], transportColors.dark, [0, 0, 90]), strut("双足大腿承力段", [x, 0.9, 0], [x, 0.56, -0.07], 0.095), cylinder("可前后弯曲的膝关节", [x, 0.55, -0.07], [0.13, 0.13, 0.13], transportColors.signal, [0, 0, 90]), strut("双足小腿承力段", [x, 0.54, -0.07], [x, 0.14, 0.01], 0.08), cylinder("脚踝俯仰关节", [x, 0.14, 0.01], [0.1, 0.1, 0.1], transportColors.dark, [0, 0, 90]), box("完整平底脚掌", [x, 0.055, -0.065], [0.16, 0.11, 0.3], transportColors.dark), ball("肩关节球形包络", [side * 0.25, 1.4, 0], [0.14, 0.14, 0.14], transportColors.dark), strut("独立上臂", [side * 0.25, 1.4, 0], [side * 0.31, 1.12, -0.04], 0.07), cylinder("手臂肘部关节", [side * 0.31, 1.12, -0.04], [0.1, 0.09, 0.1], transportColors.signal, [0, 0, 90]), strut("手臂前臂", [side * 0.31, 1.12, -0.04], [side * 0.33, 0.91, -0.12], 0.065), box("末端机械手掌", [side * 0.33, 0.85, -0.12], [0.09, 0.12, 0.045], transportColors.trim));
      for (const finger of [-1, 1]) parts.push(box("机械手相向夹指", [side * 0.33 + finger * 0.026, 0.76, -0.125], [0.022, 0.1, 0.035], transportColors.dark));
    }
    return parts;
  } },
  { name: "伸缩双货叉轨道穿梭车", theme: "现代", tags: ["仓储机器人", "穿梭车", "横向伸缩货叉", "货架通道", "双向取放"], create: () => {
    const parts = [box("低位双向行走车架", [0, 0.25, 0], [1.15, 0.28, 1.6], transportColors.dark), box("电池及控制承载台", [0, 0.44, 0], [1.12, 0.12, 1.55]), ...[-1, 1].flatMap(side => [-0.57, 0.57].flatMap(z => wheel([side * 0.57, 0.13, z], 0.13, 0.075))), box("车头防撞缓冲条", [0, 0.3, -0.84], [1.08, 0.12, 0.08], transportColors.signal), box("通道定位测距窗", [0, 0.43, -0.8], [0.2, 0.06, 0.025], transportColors.glass), ...[-1, 1].map(z => box("双货叉横向同步导轨", [0, 0.54, z * 0.5], [1.1, 0.09, 0.22], transportColors.body))];
    for (const z of [-0.5, 0.5]) {
      parts.push(box("货叉外层固定滑槽底", [0, 0.6, z], [1.12, 0.065, 0.2], transportColors.dark), box("货叉中段伸出滑板", [0.42, 0.66, z], [1.08, 0.055, 0.15], transportColors.body), box("货叉前段再次伸出薄板", [0.84, 0.715, z], [1.05, 0.055, 0.11], transportColors.trim), box("伸出叉尖货物拨挡", [1.35, 0.79, z], [0.05, 0.18, 0.12], transportColors.signal));
    }
    return parts;
  } },
  { name: "磁吸履带钢壁巡检机器人", theme: "现代", tags: ["巡检机器人", "磁吸附", "钢壁爬行", "连续磁履带", "摆头检测相机"], create: () => {
    const parts: ModelPart[] = [box("桥接双履带电子舱", [0, 0.23, 0], [0.43, 0.2, 0.62]), cylinder("检测头方位回转座", [0, 0.37, -0.15], [0.2, 0.08, 0.2], transportColors.dark), ...[-1, 1].map(side => strut("摆头检测相机支架", [side * 0.1, 0.39, -0.15], [side * 0.1, 0.53, -0.15], 0.025)), box("可俯仰近壁检测相机", [0, 0.52, -0.17], [0.18, 0.12, 0.2], transportColors.dark), cylinder("壁面相机前镜片", [0, 0.52, -0.28], [0.09, 0.025, 0.09], transportColors.glass, [90, 0, 0]), strut("检测头前伸测厚臂", [0, 0.2, -0.3], [0, 0.07, -0.58], 0.035), cylinder("底部贴壁测厚探头", [0, 0.045, -0.58], [0.07, 0.055, 0.07], transportColors.trim)];
    for (const side of [-1, 1]) {
      const x = side * 0.29;
      parts.push(box("磁履带上方回程带", [x, 0.31, 0], [0.19, 0.055, 0.74], transportColors.dark), box("磁履带贴壁接触带", [x, 0.04, 0], [0.19, 0.055, 0.74], transportColors.dark));
      for (const z of [-0.32, 0.32]) parts.push(...wheel([x, 0.175, z], 0.145, 0.16));
      for (let index = 0; index < 6; index++) parts.push(box("接触带独立永磁钢块", [x, 0.015, (index - 2.5) * 0.12], [0.16, 0.03, 0.08], transportColors.trim));
    }
    return parts;
  } },
];
