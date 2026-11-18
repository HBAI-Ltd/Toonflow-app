import { bodyShell, cabin, captainSeats, bench, drivingControls, doorsAndMirrors, quadFaces } from "./everydayPassengerVehicleBatchOne";
import { box, strut, surface, transportColors, type TransportDefinition } from "./parts";

export const everydayPassengerVehicleBatchFour: TransportDefinition[] = [
  { name: "四门五座独立后备厢家用轿车", theme: "现代", tags: ["汽车", "影视", "生活常见", "三厢家用轿车", "四门五座完整车室", "前机舱与独立闭合后备厢"], create: () => {
    const color = "#a6b2b7", parts = bodyShell({ front: -2.38, rear: 2.32, cowl: -1.0, width: 1.82, bottom: 0.25, radius: 0.34, axles: [-1.4, 1.4], track: 1.58, tire: 0.225, belt: 0.98, frontTop: 0.85, floorY: 0.35, floorZ: 0, floorLength: 2.2, color });
    cabin(parts, { belt: 0.98, roofY: 1.49, sideX: 0.85, roofX: 0.69, posts: [[-1.0, -0.48], [0.15, 0.15], [1.18, 0.85]], color, sillStart: -1.0, sillEnd: 1.18 });
    parts.push(surface("三厢轿车由车头延至前挡风玻璃的独立机舱盖", color, [[-0.885, 0.85, -2.38], [0.885, 0.85, -2.38], [0.885, 0.98, -1.0], [-0.885, 0.98, -1.0]], quadFaces), surface("后风挡以后的完整独立后备厢盖", color, [[-0.885, 0.98, 1.18], [0.885, 0.98, 1.18], [0.885, 0.98, 2.32], [-0.885, 0.98, 2.32]], quadFaces), box("从后排地板叠合延伸的后备厢承载底板", [0, 0.49, 1.65], [1.24, 0.14, 1.2], transportColors.dark), box("纵梁到后备厢底板的真实短横支座", [0, 0.405, 2.05], [1.24, 0.16, 0.14], transportColors.dark), box("后座靠背之后分隔后备厢的完整薄隔板", [0, 0.735, 1.075], [1.26, 0.51, 0.045], "#626f76"), box("从后座背后接到后挡风玻璃下缘的置物台", [0, 0.965, 1.015], [1.77, 0.04, 0.33], "#626f76"), box("后备厢开启把手", [0, 0.85, 2.341], [0.25, 0.045, 0.035], transportColors.trim));
    captainSeats(parts, -0.23, 0.35, 0.52, 0.43);
    bench(parts, 0.55, 0.5, 0.43, 1.23);
    drivingControls(parts, -0.94, 0.84, 1.76, -0.35);
    doorsAndMirrors(parts, 1.82, 0.98, [-0.13, 0.9], -0.91);
    for (const side of [-1, 1]) parts.push(strut("前后侧门在B柱下方各自闭合的门缝", [side * 0.912, 0.32, 0.15], [side * 0.912, 0.98, 0.15], 0.014), strut("后侧门沿后轮拱上方闭合的门缝", [side * 0.912, 0.73, 1.13], [side * 0.912, 0.98, 1.13], 0.014));
    return parts;
  } },
  { name: "短鼻竖尾高顶四座轻型家用车", theme: "现代", tags: ["汽车", "影视", "生活常见", "高顶轻型家用车", "前置横向动力短鼻车身", "双排四独立座与双侧滑门"], create: () => {
    const color = "#b8bcae", parts = bodyShell({ front: -1.7, rear: 1.7, cowl: -1.2, width: 1.48, bottom: 0.25, radius: 0.285, axles: [-1.08, 1.1], track: 1.3, tire: 0.19, belt: 1.18, frontTop: 0.98, floorY: 0.49, floorZ: -0.175, floorLength: 2.05, frameY: 0.37, color });
    cabin(parts, { belt: 1.18, roofY: 1.79, sideX: 0.69, roofX: 0.6, posts: [[-1.2, -0.92], [-0.15, -0.15], [0.82, 0.82], [1.6, 1.46]], color, sillStart: -1.2, sillEnd: 1.6 });
    parts.push(surface("高顶轻型车前置横向机舱的短上盖", color, [[-0.715, 0.98, -1.7], [0.715, 0.98, -1.7], [0.715, 1.18, -1.2], [-0.715, 1.18, -1.2]], quadFaces), box("前轴前方的紧凑横置动力机壳", [0, 0.63, -1.45], [0.85, 0.36, 0.38], "#69797b"), box("与后排脚部地板叠合的小型行李舱底板", [0, 0.61, 1.17], [0.98, 0.16, 0.9], transportColors.dark), box("纵梁承托短后舱底板的真实横支座", [0, 0.445, 1.45], [0.98, 0.22, 0.12], transportColors.dark), box("连接近直立尾门玻璃的后部金属横框", [0, 1.18, 1.65], [1.4, 0.07, 0.1], color), box("近直立尾门外开把手", [0, 1.04, 1.721], [0.23, 0.045, 0.035], transportColors.trim));
    for (const side of [-1, 1]) parts.push(box("发动机实际落在纵梁上的短橡胶承座", [side * 0.4, 0.445, -1.45], [0.18, 0.1, 0.13], transportColors.dark), box("短车身后侧滑门实际外露滑轨", [side * 0.75, 1.05, 0.65], [0.035, 0.03, 1.35], transportColors.dark), strut("前门与滑门之间的独立竖向门缝", [side * 0.742, 0.3, -0.15], [side * 0.742, 1.18, -0.15], 0.014), strut("按后轮拱高度收口的滑门后缘", [side * 0.742, 0.55, 0.82], [side * 0.742, 1.18, 0.82], 0.014));
    captainSeats(parts, -0.58, 0.3, 0.68, 0.57);
    captainSeats(parts, 0.42, 0.3, 0.68, 0.57);
    drivingControls(parts, -1.16, 1.0, 1.42, -0.3);
    doorsAndMirrors(parts, 1.48, 1.18, [-0.55, 0.55], -1.12);
    return parts;
  } },
];
