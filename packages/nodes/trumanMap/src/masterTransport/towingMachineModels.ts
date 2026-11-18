import { part, type ModelPart } from "../assetModelParts";
import { axles, box, cab, chassis, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

export const towingMachineModels: TransportDefinition[] = [
  { name: "后大轮农业牵引拖拉机", theme: "现代", tags: ["农业", "农机", "拖拉机", "三点后悬挂", "动力输出轴", "大后轮"], create: () => {
    const parts = [...axles(1.8, [-1.2], 0.48), ...axles(1.85, [1.1], 0.82), box("承重变速主机架", [0, 0.95, 0], [0.85, 0.4, 3.6], transportColors.dark), box("前伸发动机罩", [0, 1.45, -0.9], [1.15, 0.9, 2]), box("前端散热进气格栅", [0, 1.45, -1.92], [0.98, 0.65, 0.04], transportColors.dark), ...cab([0, 1.25, 0.6], [1.45, 1.65, 1.6]), cylinder("发动机独立排气管", [0.58, 2.2, -0.65], [0.09, 1.3, 0.09], transportColors.dark), cylinder("后部中央动力输出短轴", [0, 0.82, 1.8], [0.11, 0.4, 0.11], transportColors.trim, [90, 0, 0]), strut("上部可调悬挂拉杆", [0, 1.4, 1.4], [0, 1.18, 2.05], 0.055)];
    for (const side of [-1, 1]) parts.push(box("后轮上方弧翼子板顶", [side * 0.94, 1.73, 1.05], [0.55, 0.08, 1.8]), strut("后部下悬挂牵引臂", [side * 0.4, 0.7, 1.2], [side * 0.6, 0.65, 2.1], 0.075), strut("下悬臂提升短拉杆", [side * 0.4, 1.25, 1.1], [side * 0.55, 0.66, 1.8], 0.045), box("入驾驶舱踏步", [side * 0.82, 0.8, 0], [0.3, 0.1, 0.6], transportColors.dark));
    for (let index = 0; index < 4; index++) parts.push(box("前格栅分隔窄条", [(index - 1.5) * 0.22, 1.45, -1.95], [0.025, 0.64, 0.025], transportColors.trim));
    return parts;
  } },
  { name: "双轮手扶牵引拖拉机", theme: "现代", tags: ["农业", "农机", "手扶拖拉机", "步行操纵", "双侧长扶把", "牵引联结座"], create: () => {
    const parts = [...axles(0.82, [0], 0.32), box("前置卧式发动机", [0, 0.7, -0.36], [0.46, 0.45, 0.65]), box("上置柴油箱", [0, 0.98, -0.4], [0.42, 0.17, 0.4], transportColors.signal), box("后置传动主箱", [0, 0.6, 0.15], [0.3, 0.4, 0.5], transportColors.dark), cylinder("外侧发动机飞轮罩", [-0.27, 0.68, -0.42], [0.42, 0.13, 0.42], transportColors.dark, [0, 0, 90]), strut("机体纵向前托架", [0, 0.4, -0.8], [0, 0.4, 0.35], 0.09), strut("后部可调驻车支撑", [0, 0.55, 0.2], [0, 0.06, 0.5], 0.05), cylinder("侧置发动机排烟短管", [0.22, 0.95, -0.3], [0.05, 0.45, 0.05], transportColors.dark), box("尾部农具联结叉座", [0, 0.45, 0.58], [0.28, 0.22, 0.25], transportColors.trim)];
    for (const side of [-1, 1]) parts.push(strut("长扶把上升杆", [side * 0.15, 0.68, 0.22], [side * 0.33, 1.12, 1.25], 0.035), strut("横向手柄握把", [side * 0.33, 1.12, 1.25], [side * 0.48, 1.12, 1.25], 0.04, transportColors.dark), strut("扶把手动离合短柄", [side * 0.37, 1.13, 1.25], [side * 0.43, 1.07, 1.13], 0.018));
    return parts;
  } },
  { name: "倾斜平板车辆清障车", theme: "现代", tags: ["道路救援", "清障车", "平板拖车", "液压倾斜载车台", "卷扬牵引"], create: () => {
    const parts = [...chassis(2.3, 8.1, 0.46, [-2.85, 1.5, 2.55]), ...cab([0, 1.02, -2.65], [2.1, 1.8, 1.9]), box("整片倾斜载车平板", [0, 1.4, 1], [2.35, 0.15, 5.8], transportColors.trim, [13, 0, 0]), cylinder("驾驶舱后牵引绞盘", [0, 2.05, -1.45], [0.45, 1.2, 0.45], transportColors.dark, [0, 0, 90]), box("绞盘防护横梁", [0, 2.4, -1.5], [2.2, 0.08, 0.12]), strut("绞盘牵引钢缆", [0, 2.05, -1.45], [0, 1.25, 2.4], 0.018), box("尾端装卸过渡跳板", [0, 0.455, 4.6], [2.3, 0.1, 1.8], transportColors.dark, [26, 0, 0])];
    for (const side of [-1, 1]) parts.push(strut("平板升降液压缸", [side * 0.65, 0.9, 0.2], [side * 0.65, 1.75, -0.5], 0.1), box("平板外缘连续护轨", [side * 1.1, 1.58, 1], [0.07, 0.12, 5.7], transportColors.body, [13, 0, 0]), box("车身侧面工具箱", [side * 0.96, 0.9, 0.1], [0.35, 0.5, 1.4]), cylinder("驾驶舱顶救援警示灯", [side * 0.5, 2.95, -2.65], [0.22, 0.17, 0.22], transportColors.signal));
    return parts;
  } },
  { name: "后托臂道路清障车", theme: "现代", tags: ["道路救援", "清障车", "伸缩托臂", "车轮托叉", "独立卷扬吊臂"], create: () => {
    const parts: ModelPart[] = [...chassis(2.4, 6.7, 0.48, [-2.3, 1.25, 2.15]), ...cab([0, 1.06, -2.2], [2.2, 1.85, 1.9]), box("中部双侧工具舱底", [0, 1, 0.7], [2.1, 0.3, 3.2], transportColors.dark), ...[-1, 1].map(side => box("托臂车封闭器材侧箱", [side * 0.8, 1.6, 0.5], [0.55, 1, 3.1])), strut("上方固定主吊臂", [0, 1.65, -0.3], [0, 3.7, 1.7], 0.24), strut("吊臂尾端外伸梁", [0, 3.7, 1.7], [0, 3.7, 2.9], 0.18), strut("吊臂起升作动缸", [0, 1.4, 0.6], [0, 2.8, 0.85], 0.13), cylinder("救援钢缆卷扬鼓", [0, 2.2, 0.2], [0.6, 1.1, 0.6], transportColors.dark, [0, 0, 90]), strut("卷扬至臂端出缆", [0, 2.4, 0.2], [0, 3.8, 2.9], 0.024), strut("臂端垂直起吊短缆", [0, 3.8, 2.9], [0, 2.8, 2.9], 0.024), part("臂端开放吊钩", "tube", transportColors.trim, [0, 2.8, 2.9], [1, 1, 1], [0, 0, 0], { radius: 0.035, path: [{ x: 0, y: 0, z: 0 }, { x: 0.1, y: -0.15, z: 0 }, { x: 0.03, y: -0.28, z: 0 }, { x: -0.12, y: -0.24, z: 0 }, { x: -0.13, y: -0.12, z: 0 }] }), box("底部低位伸缩托臂", [0, 0.65, 3.05], [0.32, 0.25, 2.3], transportColors.dark), box("托臂车轮横向承梁", [0, 0.7, 4.15], [2.2, 0.18, 0.2], transportColors.trim)];
    for (const side of [-1, 1]) parts.push(box("托轮叉外侧承托短梁", [side * 0.85, 0.72, 4.5], [0.13, 0.15, 0.9], transportColors.body), box("托轮叉内侧承托短梁", [side * 0.5, 0.72, 4.5], [0.13, 0.15, 0.9], transportColors.body), box("托轮叉外端止挡", [side * 0.67, 0.83, 4.92], [0.5, 0.28, 0.08], transportColors.trim));
    return parts;
  } },
];
