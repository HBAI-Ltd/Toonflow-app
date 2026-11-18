import { part, type ModelPart } from "../assetModelParts";
import { bodyShell, cabin, captainSeats, bench, drivingControls, doorsAndMirrors, quadFaces } from "./everydayPassengerVehicleBatchOne";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

function fender(side: number, x: number, z: number, y: number, inner: number, outer: number): ModelPart {
  const profile = [
    ...Array.from({ length: 9 }, (_, index) => ({ x: Math.cos(index * Math.PI / 8) * outer, y: y + Math.sin(index * Math.PI / 8) * outer })),
    ...Array.from({ length: 9 }, (_, index) => ({ x: Math.cos((8 - index) * Math.PI / 8) * inner, y: y + Math.sin((8 - index) * Math.PI / 8) * inner })),
  ];
  return part("保留轮胎上方净空的外伸轮拱护边", "extrude", transportColors.dark, [side * x, 0, z], [1, 1, 1], [0, -90, 0], { depth: 0.09, profile });
}

function pickupLeafSpring(x: number, z: number): ModelPart {
  return part("双排皮卡车桥到梯形纵梁的弧形承载板簧", "extrude", "#56616a", [x, 0, z], [1, 1, 1], [0, -90, 0], { depth: 0.08, profile: [{ x: -0.5, y: 0.54 }, { x: -0.25, y: 0.46 }, { x: 0, y: 0.44 }, { x: 0.25, y: 0.46 }, { x: 0.5, y: 0.54 }, { x: 0.5, y: 0.51 }, { x: 0.25, y: 0.43 }, { x: 0, y: 0.41 }, { x: -0.25, y: 0.43 }, { x: -0.5, y: 0.51 }] });
}

function coilSpring(x: number, z: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], radius = 0.065, height = 0.165, turns = Math.PI * 6, slope = height / (radius * turns), norm = Math.hypot(1, slope);
  for (let step = 0; step <= 24; step++) {
    const a = step / 24 * turns, c = Math.cos(a), s = Math.sin(a);
    for (let edge = 0; edge < 6; edge++) {
      const b = edge * Math.PI / 3, u = Math.cos(b) * 0.014, v = Math.sin(b) * 0.014;
      vertices.push({ x: radius * c + u * c + v * slope * s / norm, y: 0.465 + height * step / 24 + v / norm, z: radius * s + u * s - v * slope * c / norm });
      if (step < 24) { const p = step * 6 + edge, q = step * 6 + (edge + 1) % 6; indices.push(p, q, p + 6, q, q + 6, p + 6); }
    }
  }
  vertices.push({ x: radius, y: 0.465, z: 0 }, { x: radius, y: 0.465 + height, z: 0 });
  for (let edge = 0; edge < 6; edge++) indices.push(150, (edge + 1) % 6, edge, 151, 144 + edge, 144 + (edge + 1) % 6);
  return part("连接刚性桥弹簧下座与车架下翼缘的封闭螺旋弹簧", "mesh", "#626f72", [x, 0, z], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const everydayPassengerVehicleBatchTwo: TransportDefinition[] = [
  { name: "高肩斜尾五座城市跨界SUV", theme: "现代", tags: ["汽车", "影视", "生活常见", "SUV", "承载车身城市跨界车", "两排五座和高位行李厢"], create: () => {
    const color = "#a7b3b4", parts = bodyShell({ front: -2.2, rear: 2.2, cowl: -1.03, width: 1.87, bottom: 0.3, radius: 0.365, axles: [-1.35, 1.35], track: 1.6, tire: 0.235, belt: 1.1, frontTop: 0.99, floorY: 0.48, floorZ: -0.05, floorLength: 2.3, frameY: 0.395, color });
    cabin(parts, { belt: 1.1, roofY: 1.72, sideX: 0.86, roofX: 0.71, posts: [[-1.03, -0.52], [0.2, 0.2], [1.1, 1.0], [2.08, 1.65]], color, sillStart: -1.03, sillEnd: 2.08 });
    parts.push(surface("跨界SUV高肩短前舱上盖", color, [[-0.91, 0.99, -2.2], [0.91, 0.99, -2.2], [0.91, 1.1, -1.03], [-0.91, 1.1, -1.03]], quadFaces), box("后排地板实际叠合的抬高行李舱地板", [0, 0.58, 1.535], [1.25, 0.22, 1.07], transportColors.dark), box("连续纵梁到抬高载物地板的实际后支座", [0, 0.465, 1.95], [1.25, 0.12, 0.14], transportColors.dark), box("腰线下方与斜尾门接合的后横框", [0, 1.1, 2.14], [1.74, 0.075, 0.12], color), box("SUV尾门开启把手", [0, 0.96, 2.221], [0.25, 0.045, 0.035], transportColors.trim), box("连接纵梁的车底防护板", [0, 0.35, 0], [1.18, 0.05, 2.05], "#4e5c62"));
    for (const side of [-1, 1]) for (const z of [-1.35, 1.35]) parts.push(fender(side, 0.937, z, 0.365, 0.425, 0.47));
    captainSeats(parts, -0.2, 0.36, 0.67, 0.56);
    bench(parts, 0.75, 0.67, 0.56, 1.24);
    drivingControls(parts, -0.95, 0.96, 1.81, -0.36);
    doorsAndMirrors(parts, 1.87, 1.1, [-0.1, 0.8], -0.94);
    return parts;
  } },
  { name: "梯形车架双刚性桥方正越野车", theme: "现代", tags: ["汽车", "影视", "生活常见", "越野SUV", "独立梯形车架", "双刚性驱动桥与螺旋弹簧"], create: () => {
    const color = "#a6ac9a", parts = bodyShell({ front: -2.3, rear: 2.15, cowl: -0.78, width: 1.96, bottom: 0.43, radius: 0.43, axles: [-1.4, 1.4], track: 1.69, tire: 0.28, belt: 1.23, frontTop: 1.16, floorY: 0.86, floorZ: 0, floorLength: 2.4, frameY: 0.66, color });
    cabin(parts, { belt: 1.23, roofY: 1.97, sideX: 0.925, roofX: 0.82, posts: [[-0.78, -0.7], [0.22, 0.22], [1.12, 1.12], [2.07, 2.01]], color, sillStart: -0.78, sillEnd: 2.07 });
    parts.push(surface("方正越野车水平长机罩", color, [[-0.955, 1.16, -2.3], [0.955, 1.16, -2.3], [0.955, 1.23, -0.78], [-0.955, 1.23, -0.78]], quadFaces), box("与两排乘员地板叠合的方正后舱底板", [0, 0.9, 1.51], [1.3, 0.2, 1.06], transportColors.dark), box("纵梁支承后载物地板的短横架", [0, 0.76, 1.95], [1.3, 0.2, 0.14], transportColors.dark), box("连接近直立后窗的金属尾门上框", [0, 1.23, 2.11], [1.86, 0.075, 0.1], color), cylinder("独立梯形车架下方的中央传动轴", [0, 0.43, 0], [0.075, 2.8, 0.075], transportColors.dark, [90, 0, 0]), box("纵梁之间承接分动箱的横梁", [0, 0.66, 0.1], [1.0, 0.11, 0.18], transportColors.dark), box("固定在车架横梁上的分动箱", [0, 0.56, 0.1], [0.25, 0.24, 0.36], "#6d7b7d"), cylinder("竖挂在尾门承架的全尺寸备胎", [0, 1.08, 2.39], [0.8, 0.24, 0.8], transportColors.dark, [90, 0, 0]), cylinder("后备胎外露轮毂", [0, 1.08, 2.515], [0.33, 0.035, 0.33], transportColors.trim, [90, 0, 0]));
    for (const side of [-1, 1]) {
      parts.push(strut("尾门到外置备胎轮毂的固定承架", [side * 0.25, 1.05, 2.13], [0, 1.08, 2.39], 0.055), box("实际接到门槛侧围的越野车上车踏步", [side * 0.98, 0.58, 0.05], [0.23, 0.09, 1.65], "#526065"));
      for (const z of [-0.5, 0.7]) parts.push(box("高位车身地板到独立纵梁的短车身支座", [side * 0.45, 0.765, z], [0.16, 0.14, 0.16], transportColors.dark));
      for (const z of [-1.4, 1.4]) {
        parts.push(fender(side, 1.0, z, 0.43, 0.49, 0.545), coilSpring(side * 0.45, z));
      }
    }
    for (const z of [-1.4, 1.4]) parts.push(part("刚性驱动桥中央差速器壳", "sphere", "#59696b", [0, 0.43, z], [0.25, 0.25, 0.3]));
    captainSeats(parts, -0.18, 0.38, 1.03, 0.94);
    bench(parts, 0.72, 1.03, 0.94, 1.3);
    drivingControls(parts, -0.76, 1.13, 1.9, -0.38);
    doorsAndMirrors(parts, 1.96, 1.23, [-0.03, 0.88], -0.72);
    return parts;
  } },
  { name: "双排四门开放货斗日用皮卡", theme: "现代", tags: ["汽车", "影视", "生活常见", "双排皮卡", "两排五座与独立开放货斗", "后货斗内侧真实凸起轮罩"], create: () => {
    const color = "#b2b9b7", parts = bodyShell({ front: -2.7, rear: 2.7, cowl: -1.1, width: 1.98, bottom: 0.3, radius: 0.39, axles: [-1.6, 1.75], track: 1.72, tire: 0.25, belt: 1.2, frontTop: 1.13, floorY: 0.63, floorZ: -0.2, floorLength: 2.3, frameY: 0.53, color });
    cabin(parts, { belt: 1.2, roofY: 1.82, sideX: 0.93, roofX: 0.78, posts: [[-1.1, -0.65], [-0.08, -0.08], [0.95, 0.95]], color, sillStart: -1.1, sillEnd: 0.95 });
    parts.push(surface("独立长前舱与双排驾驶室相接的机罩", color, [[-0.965, 1.13, -2.7], [0.965, 1.13, -2.7], [0.965, 1.2, -1.1], [-0.965, 1.2, -1.1]], quadFaces), box("双排驾驶室后窗下方的完整隔墙", [0, 0.875, 0.95], [1.87, 0.65, 0.08], color), box("货斗与驾驶舱分离的前挡板", [0, 0.97, 1.06], [1.88, 0.46, 0.06], color), box("避开两侧轮胎包络的货斗中央底板", [0, 0.74, 1.85], [1.32, 0.1, 1.6], "#5b676c"), box("轮罩前方贯通全宽的货斗底板", [0, 0.74, 1.135], [1.84, 0.1, 0.17], "#5b676c"), box("轮罩后方贯通全宽的货斗底板", [0, 0.74, 2.465], [1.84, 0.1, 0.37], "#5b676c"), box("后货斗尾板外把手", [0, 1.06, 2.722], [0.27, 0.055, 0.04], transportColors.dark));
    for (const z of [1.15, 2.35]) parts.push(box("梯形车架到独立货斗底板的承重横支座", [0, 0.62, z], [1.36, 0.2, 0.13], transportColors.dark));
    for (const side of [-1, 1]) {
      for (const z of [-1.6, 1.75]) parts.push(pickupLeafSpring(side * 0.45, z));
      parts.push(box("货斗内轮罩的竖直内侧壁", [side * 0.68, 0.87, 1.75], [0.04, 0.26, 1.04], color), box("高于轮胎上缘的货斗轮罩顶面", [side * 0.81, 1.0, 1.75], [0.3, 0.05, 1.05], color));
      for (const z of [1.235, 2.265]) parts.push(box("连接轮罩顶面与货斗地板的轮罩封端", [side * 0.81, 0.875, z], [0.3, 0.25, 0.04], color));
      parts.push(strut("前后车门之间连接腰线的门缝", [side * 0.992, 0.39, -0.08], [side * 0.992, 1.2, -0.08], 0.014));
    }
    captainSeats(parts, -0.52, 0.39, 0.8, 0.71);
    bench(parts, 0.4, 0.8, 0.71, 1.3);
    drivingControls(parts, -1.1, 1.04, 1.92, -0.39);
    doorsAndMirrors(parts, 1.98, 1.2, [-0.45, 0.58], -1.03);
    return parts;
  } },
];
