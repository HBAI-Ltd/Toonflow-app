import { part, type ModelPart } from "../assetModelParts";
import { fuselage } from "./aircraftModels";
import { ball, box, crawler, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

export const subseaWorkModels: TransportDefinition[] = [
  { name: "鱼雷形自主测绘潜航器", theme: "科幻", tags: ["AUV", "自主潜航器", "侧扫声呐", "海洋测绘"], create: () => {
    const parts: ModelPart[] = [fuselage(4.4, 0.58, 0.66), ball("前端透声整流罩", [0, 0.66, -1.9], [0.45, 0.45, 0.58], transportColors.dark), cylinder("尾端推进电机轴", [0, 0.66, 2.18], [0.12, 0.45, 0.12], transportColors.dark, [90, 0, 0]), part("贯通式推进护桨筒", "lathe", transportColors.body, [0, 0.66, 2.22], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.22, y: -0.2 }, { x: 0.25, y: -0.2 }, { x: 0.25, y: 0.2 }, { x: 0.22, y: 0.2 }, { x: 0.22, y: -0.2 }] }), strut("上部通信天线", [0, 0.87, 1.08], [0, 1.25, 1.08], 0.025)];
    for (const side of [-1, 1]) parts.push(box("纵向侧扫声呐阵面", [side * 0.29, 0.6, -0.32], [0.025, 0.12, 1.4], transportColors.dark), surface("尾部水平操纵舵", transportColors.signal, [[0, 0, -0.45], [side * 0.66, 0, 0.1], [side * 0.58, 0, 0.42], [0, 0, 0.25]], [0, 1, 2, 0, 2, 3], [0, 0.66, 1.45]), surface("尾部上下操纵舵", transportColors.signal, [[0, 0, -0.4], [0, side * 0.65, 0.1], [0, side * 0.58, 0.42], [0, 0, 0.25]], [0, 1, 2, 0, 2, 3], [0, 0.66, 1.45]));
    for (const angle of [0, 120, 240]) { const radians = angle * Math.PI / 180; parts.push(box("尾端螺旋推进桨叶", [Math.sin(radians) * 0.1, 0.66 + Math.cos(radians) * 0.1, 2.23], [0.055, 0.2, 0.025], transportColors.dark, [14, 0, -angle])); }
    return parts;
  } },
  { name: "履带式海底结核集矿机器人", theme: "科幻", tags: ["海底采矿", "集矿头", "矿浆输送"], create: () => {
    const parts: ModelPart[] = [...crawler(4.6, 3.6), box("压力补偿密封主机座", [0, 1.15, 0], [3.4, 0.6, 4.2]), cylinder("后置矿浆分离筒", [0, 2.05, 0.8], [1.6, 1.5, 1.6]), box("集矿头上盖", [0, 0.49, -3.1], [4.3, 0.15, 0.9], transportColors.signal), box("集矿头后吸入通道", [0, 0.4, -2.68], [4.3, 0.35, 0.14], transportColors.dark), ...[-1, 1].map(side => box("集矿头侧封板", [side * 2.1, 0.3, -3.1], [0.1, 0.45, 0.9], transportColors.signal)), part("集矿头至分离筒矿浆软管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.15, path: [{ x: 0, y: 0.5, z: -2.7 }, { x: 0, y: 0.9, z: -2.1 }, { x: 0, y: 1.7, z: -0.6 }, { x: 0, y: 2, z: 0.6 }] }), cylinder("垂向输送管接头", [0, 3.05, 0.8], [0.38, 0.55, 0.38], transportColors.trim)];
    for (const side of [-1, 1]) parts.push(strut("集矿头铰接升降臂", [side * 1.7, 1.25, -1.6], [side * 1.9, 0.4, -3.1], 0.16), strut("升降液压缸筒", [side * 1.4, 1.4, -0.9], [side * 1.7, 0.9, -2], 0.16, transportColors.signal), strut("升降液压活塞杆", [side * 1.7, 0.9, -2], [side * 1.9, 0.4, -3.1], 0.07), cylinder("两侧耐压电池仓", [side * 1.2, 1.7, 0.5], [0.6, 2.7, 0.6], transportColors.body, [90, 0, 0]), ball("前方水下照明灯", [side * 1.35, 1.65, -1.55], [0.25, 0.25, 0.17], transportColors.trim));
    for (let index = 0; index < 10; index++) parts.push(strut("下缘分距集矿导齿", [-1.9 + index * 0.42, 0.12, -3.64], [-1.9 + index * 0.42, 0.25, -2.9], 0.055));
    parts.push(strut("前部探测器短桅", [0, 1.45, -1.3], [0, 2.25, -1.4], 0.08), box("多波束前视声呐", [0, 2.25, -1.47], [0.7, 0.18, 0.2], transportColors.dark));
    return parts;
  } },
  { name: "锚泊式海洋气象观测浮标", itemType: "设施", tags: ["气象浮标", "海温", "风向", "锚泊"], create: () => {
    const parts: ModelPart[] = [part("圆盘水线浮体", "lathe", transportColors.signal, [0, 0.42, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: -0.32 }, { x: 1.25, y: -0.32 }, { x: 1.45, y: -0.08 }, { x: 1.45, y: 0.2 }, { x: 1.15, y: 0.38 }, { x: 0, y: 0.38 }] }), cylinder("水下配重龙骨", [0, -0.55, 0], [0.17, 1.6, 0.17], transportColors.dark), cylinder("深部配重块", [0, -1.4, 0], [0.75, 0.3, 0.75], transportColors.dark), part("系泊链闭合连接环", "torus", transportColors.dark, [0, -1.66, 0], [0.2, 0.24, 0.07]), cylinder("平台传感器主桅", [0, 2.16, 0], [0.07, 2.9, 0.07]), cylinder("桅顶信号灯", [0, 3.68, 0], [0.17, 0.2, 0.17], transportColors.trim), box("封闭数据采集匣", [0, 1.2, 0], [0.5, 0.6, 0.4]), strut("风向仪横向支臂", [0, 3.3, 0], [0.6, 3.3, 0], 0.035), strut("风向仪转轴", [0.6, 3.3, 0], [0.6, 3.58, 0], 0.025), strut("指向风标杆", [0.6, 3.54, -0.24], [0.6, 3.54, 0.24], 0.018), surface("风标尾翼", transportColors.dark, [[0, 0, 0], [0, 0.12, 0.18], [0, -0.12, 0.18]], [0, 1, 2], [0.6, 3.54, 0.15])];
    for (const side of [-1, 1]) parts.push(box("倾斜太阳能板", [side * 0.56, 1.53, 0], [0.68, 0.035, 0.92], transportColors.dark, [0, 0, -side * 25]), strut("太阳能板撑杆", [side * 0.55, 0.8, 0], [side * 0.55, 1.53, 0], 0.045));
    for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3, x = Math.cos(angle) * 0.24, z = Math.sin(angle) * 0.24; parts.push(strut("三杯风速仪支杆", [-0.3, 3.49, 0], [-0.3 + x, 3.49, z], 0.014), part("同切向开放的半球风杯", "lathe", transportColors.dark, [-0.3 + x, 3.49, z], [1, 1, 1], [90, 0, index * 120], { profile: [{ x: 0, y: -0.05 }, { x: 0.035, y: -0.035 }, { x: 0.05, y: 0 }, { x: 0.043, y: 0 }, { x: 0.03, y: -0.03 }, { x: 0, y: -0.043 }] })); }
    parts.push(strut("风速仪安装臂", [0, 3.35, 0], [-0.3, 3.35, 0], 0.03), strut("风速仪竖轴", [-0.3, 3.35, 0], [-0.3, 3.49, 0], 0.02));
    return parts;
  } },
];
