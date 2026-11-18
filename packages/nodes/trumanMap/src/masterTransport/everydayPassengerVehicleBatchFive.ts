import { bodyShell, cabin, captainSeats, drivingControls, doorsAndMirrors, glazing, quadFaces } from "./everydayPassengerVehicleBatchOne";
import { box, strut, surface, transportColors, type TransportDefinition } from "./parts";

export const everydayPassengerVehicleBatchFive: TransportDefinition[] = [
  { name: "双座超短轴直尾城市微型汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "双座微型城市汽车", "超短轴三门车身", "后置紧凑动力与分隔行李台"], create: () => {
    const color = "#b4b9b5", parts = bodyShell({ front: -1.32, rear: 1.32, cowl: -0.84, width: 1.58, bottom: 0.22, radius: 0.28, axles: [-0.86, 0.86], track: 1.35, tire: 0.175, belt: 0.93, frontTop: 0.84, floorY: 0.39, floorZ: 0, floorLength: 1.24, frameY: 0.28, color });
    cabin(parts, { belt: 0.93, roofY: 1.48, sideX: 0.72, roofX: 0.56, posts: [[-0.84, -0.5], [0.6, 0.6], [1.1, 0.72]], color, sillStart: -0.84, sillEnd: 1.1 });
    parts.push(surface("单排微型车的超短前部上盖", color, [[-0.765, 0.84, -1.32], [0.765, 0.84, -1.32], [0.765, 0.93, -0.84], [-0.765, 0.93, -0.84]], quadFaces), surface("竖尾后挡风玻璃下沿的小型闭合台面", color, [[-0.765, 0.93, 1.1], [0.765, 0.93, 1.1], [0.765, 0.93, 1.32], [-0.765, 0.93, 1.32]], quadFaces), box("后车桥中央的紧凑横向后置动力机壳", [0, 0.37, 0.9], [0.62, 0.22, 0.4], "#6b7d81"), box("座椅后方与低位动力舱分开的行李台", [0, 0.68, 0.9], [1.0, 0.12, 0.7], transportColors.dark), box("在动力机壳前方连接高低地板的实体台阶", [0, 0.54, 0.58], [1.0, 0.2, 0.16], transportColors.dark), box("动力机壳后方从纵梁承托高位行李台的横架", [0, 0.46, 1.17], [0.95, 0.35, 0.1], transportColors.dark), box("微型车后舱开启把手", [0, 0.79, 1.341], [0.22, 0.045, 0.035], transportColors.trim));
    captainSeats(parts, -0.05, 0.29, 0.55, 0.47);
    drivingControls(parts, -0.78, 0.8, 1.52, -0.29);
    doorsAndMirrors(parts, 1.58, 0.93, [0.42], -0.75);
    for (const side of [-1, 1]) parts.push(strut("单排长侧门后缘到短车身的独立门缝", [side * 0.792, 0.55, 0.6], [side * 0.792, 0.93, 0.6], 0.014));
    return parts;
  } },
  { name: "拱顶中置动力双座宽体跑车", theme: "现代", tags: ["汽车", "影视", "生活常见", "现代中置双座跑车", "低位后倾座舱与宽体轮肩", "透明后机舱盖和独立承载发动机床"], create: () => {
    const color = "#9daeb5", parts = bodyShell({ front: -2.2, rear: 2.25, cowl: -0.7, width: 2.0, bottom: 0.18, radius: 0.33, axles: [-1.38, 1.38], track: 1.76, tire: 0.27, belt: 0.83, frontTop: 0.68, floorY: 0.19, floorZ: -0.12, floorLength: 1.65, frameY: 0.3, color });
    cabin(parts, { belt: 0.83, roofY: 1.27, sideX: 0.81, roofX: 0.62, posts: [[-0.7, -0.22], [0.77, 0.39]], color, sillStart: -0.7, sillEnd: 0.77 });
    parts.push(surface("宽体跑车低鼻抬升至座舱的完整前盖", color, [[-0.975, 0.68, -2.2], [0.975, 0.68, -2.2], [0.975, 0.83, -0.7], [-0.975, 0.83, -0.7]], quadFaces), box("低座舱与较高发动机床之间的封闭防火隔墙", [0, 0.49, 0.77], [1.64, 0.68, 0.16], "#5b6a70"), box("高于后车桥并在轮胎内侧的中置动力机床", [0, 0.47, 1.435], [1.35, 0.12, 1.23], transportColors.dark), box("连续纵梁到后发动机床的真实承载横架", [0, 0.39, 1.95], [1.35, 0.16, 0.14], transportColors.dark), box("独立落在发动机床上的中置动力缸体", [0, 0.67, 1.35], [0.85, 0.24, 0.9], "#6d7d85"), box("中置动力上部一体进气稳压壳", [0, 0.82, 1.35], [0.58, 0.08, 0.74], "#455961"), glazing("可透视中置动力机壳的独立水平后机盖", [[-0.65, 0.88, 0.85], [0.65, 0.88, 0.85], [0.65, 0.88, 1.9], [-0.65, 0.88, 1.9]]), box("承接座舱隔墙与后机盖的前端金属框", [0, 0.85, 0.82], [1.38, 0.1, 0.1], color), surface("透明机盖后方收向尾部的闭合甲板", color, [[-0.66, 0.88, 1.9], [0.66, 0.88, 1.9], [0.975, 0.83, 2.25], [-0.975, 0.83, 2.25]], quadFaces));
    for (const z of [1.05, 1.65]) parts.push(box("从完整机床承托中置缸体的实际横向机脚", [0, 0.545, z], [0.9, 0.06, 0.1], transportColors.dark));
    for (const side of [-1, 1]) {
      parts.push(surface("窄座舱门槛接到宽后轮肩的完整水平围边", color, [[side * 0.81, 0.83, -0.7], [side * 0.975, 0.83, -0.7], [side * 0.975, 0.83, 0.85], [side * 0.81, 0.83, 0.85]], quadFaces), surface("后机舱玻璃外侧接到轮拱侧围的金属肩板", color, [[side * 0.66, 0.83, 0.85], [side * 0.975, 0.83, 0.85], [side * 0.975, 0.83, 1.9], [side * 0.66, 0.83, 1.9]], quadFaces), box("玻璃机盖实际落在金属肩板上的连续侧框", [side * 0.66, 0.87, 1.375], [0.06, 0.07, 1.1], color), box("双座低位乘员座垫", [side * 0.34, 0.34, -0.1], [0.48, 0.12, 0.51], "#4a5e69"), box("低位座垫实际承托在座舱地板的底架", [side * 0.34, 0.285, -0.1], [0.34, 0.06, 0.34], transportColors.dark), box("后倾以留出低矮座舱头部空间的乘员靠背", [side * 0.34, 0.6, 0.13], [0.47, 0.54, 0.1], "#4a5e69", [14, 0, 0]), box("与后倾靠背实际搭接的独立头枕", [side * 0.34, 0.94, 0.195], [0.27, 0.17, 0.12], "#4a5e69", [14, 0, 0]));
      for (const z of [1.05, 1.3, 1.55]) parts.push(box("后机舱肩板上的独立散热格栅开口罩", [side * 0.82, 0.845, z], [0.18, 0.02, 0.06], transportColors.dark));
    }
    drivingControls(parts, -0.64, 0.73, 1.94, -0.34);
    doorsAndMirrors(parts, 2.0, 0.83, [0.53], -0.61);
    return parts;
  } },
];
