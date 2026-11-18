import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, surface, wheel, transportColors, type TransportDefinition } from "./parts";

type CarBody = { front: number; rear: number; cowl: number; width: number; bottom: number; radius: number; axles: [number, number]; track: number; tire: number; belt: number; frontTop: number; floorY: number; floorZ: number; floorLength: number; color: string; frameY?: number };
const quadFaces = [0, 1, 2, 0, 2, 3];

function glazing(name: string, points: Triple[]): ModelPart {
  return { ...surface(name, "#9cbec5", points, quadFaces), opacity: 0.56, roughness: 0.24 };
}

function bodyShell(value: CarBody): ModelPart[] {
  const { front, rear, cowl, width, bottom, radius, axles, track, tire, belt, frontTop, floorY, floorZ, floorLength, color } = value;
  const frameY = value.frameY ?? radius - 0.035;
  const archRadius = radius + 0.075, angle = Math.asin((bottom - radius) / archRadius);
  const lower = [...axles].sort((a, b) => b - a).flatMap(z => Array.from({ length: 9 }, (_, index) => {
    const a = angle + index / 8 * (Math.PI - angle * 2);
    return { x: z + Math.cos(a) * archRadius, y: index === 0 || index === 8 ? bottom : radius + Math.sin(a) * archRadius };
  }));
  const profile = [{ x: front, y: frontTop }, { x: cowl, y: belt }, { x: rear, y: belt }, { x: rear, y: bottom }, ...lower, { x: front, y: bottom }];
  const parts: ModelPart[] = [
    box("轮胎内侧保留开口轮拱的座舱地板", [0, floorY, floorZ], [track - tire - 0.1, 0.16, floorLength], transportColors.dark),
    box("前车头闭合薄立面", [0, (frontTop + bottom) / 2, front + 0.025], [width - 0.07, frontTop - bottom, 0.06], color),
    box("后尾门下方闭合薄立面", [0, (belt + bottom) / 2, rear - 0.025], [width - 0.07, belt - bottom, 0.06], color),
    box("车头柔性保险杠", [0, bottom + 0.12, front - 0.035], [width + 0.025, 0.18, 0.09], transportColors.dark),
    box("车尾柔性保险杠", [0, bottom + 0.12, rear + 0.035], [width + 0.025, 0.18, 0.09], transportColors.dark),
    box("车头下方进气格栅", [0, bottom + 0.29, front - 0.012], [width * 0.4, 0.16, 0.045], "#34434a"),
  ];
  for (const z of [floorZ - floorLength / 4, floorZ + floorLength / 4]) parts.push(box("地板与两侧车身门槛接合的承重横梁", [0, floorY, z], [width - 0.08, 0.1, 0.11], transportColors.dark));
  for (const side of [-1, 1]) {
    parts.push(part("下沿实际敞开的双轮拱整体侧围", "extrude", color, [side * (width / 2 - 0.025), 0, 0], [1, 1, 1], [0, -90, 0], { depth: 0.05, profile }), box("承载地板到前后桥的连续纵梁", [side * 0.45, frameY, (front + rear) / 2], [0.1, 0.11, rear - front - 0.24], transportColors.dark));
    for (const z of axles) parts.push(...wheel([side * track / 2, radius, z], radius, tire));
    parts.push(box("左右前照灯", [side * width * 0.335, frontTop - 0.13, front - 0.013], [width * 0.19, 0.12, 0.055], "#e9e2bb"), box("左右制动尾灯", [side * width * 0.37, belt - 0.16, rear + 0.012], [width * 0.13, 0.2, 0.055], "#b76c5f"));
  }
  for (const z of axles) parts.push(cylinder("连接两侧承重轮毂的车桥", [0, radius, z], [0.08, track, 0.08], transportColors.dark, [0, 0, 90]));
  return parts;
}

function cabin(parts: ModelPart[], value: { belt: number; roofY: number; sideX: number; roofX: number; posts: [number, number][]; color: string; sillStart: number; sillEnd: number }) {
  const { belt, roofY, sideX, roofX, posts, color, sillStart, sillEnd } = value;
  const point = (side: number, z: number, y: number): Triple => [side * (sideX + (roofX - sideX) * (y - belt) / (roofY - belt)), y, z];
  const first = posts[0]!, last = posts[posts.length - 1]!;
  parts.push(surface("有真实座舱空腔的薄顶盖", color, [[-roofX, roofY, first[1]], [roofX, roofY, first[1]], [roofX, roofY, last[1]], [-roofX, roofY, last[1]]], quadFaces), glazing("连接两根A柱的前倾风挡", [[-sideX + 0.02, belt, first[0]], [sideX - 0.02, belt, first[0]], [roofX - 0.02, roofY, first[1]], [-roofX + 0.02, roofY, first[1]]]), glazing("连接末端立柱的后尾门风挡", [[sideX - 0.02, belt, last[0]], [-sideX + 0.02, belt, last[0]], [-roofX + 0.02, roofY, last[1]], [roofX - 0.02, roofY, last[1]]]));
  for (const side of [-1, 1]) {
    parts.push(box("侧围与窗框之间连续腰线承梁", [side * (sideX + 0.025), belt, (sillStart + sillEnd) / 2], [0.085, 0.065, sillEnd - sillStart + 0.04], color));
    parts.push(box("玻璃上沿搭接薄顶盖的连续车顶侧梁", [side * roofX, roofY - 0.015, (first[1] + last[1]) / 2], [0.055, 0.055, last[1] - first[1] + 0.055], color));
    for (const [baseZ, roofZ] of posts) parts.push(strut("真正从腰线连接顶盖的车门窗柱", [side * sideX, belt, baseZ], [side * roofX, roofY, roofZ], 0.055, color));
    for (let index = 0; index < posts.length - 1; index++) {
      const a = posts[index]!, b = posts[index + 1]!, inset = 0.025, low = inset / (roofY - belt), high = 1 - low;
      const zAt = (post: [number, number], fraction: number) => post[0] + (post[1] - post[0]) * fraction;
      parts.push(glazing("按独立门框分隔并实际搭接窗柱的侧窗玻璃", [point(side, zAt(a, low), belt + inset), point(side, zAt(b, low), belt + inset), point(side, zAt(b, high), roofY - inset), point(side, zAt(a, high), roofY - inset)]));
    }
  }
}

function captainSeats(parts: ModelPart[], z: number, x: number, cushionY: number, floorTop: number) {
  for (const side of [-1, 1]) parts.push(box("独立前向乘员座垫", [side * x, cushionY, z], [0.5, 0.14, 0.46], "#526067"), box("由车厢地板实际承托的座椅底架", [side * x, (floorTop + cushionY - 0.055) / 2, z], [0.34, cushionY - 0.055 - floorTop + 0.025, 0.32], transportColors.dark), box("座垫后缘接合的独立乘员靠背", [side * x, cushionY + 0.27, z + 0.2], [0.49, 0.52, 0.11], "#526067"), box("连接靠背上沿的乘员头枕", [side * x, cushionY + 0.61, z + 0.2], [0.27, 0.18, 0.12], "#526067"));
}

function bench(parts: ModelPart[], z: number, cushionY: number, floorTop: number, width: number) {
  parts.push(box("横贯后排的三人座垫", [0, cushionY, z], [width, 0.14, 0.46], "#526067"), box("与地板实际接合的后排连续座架", [0, (floorTop + cushionY - 0.055) / 2, z], [width - 0.15, cushionY - 0.055 - floorTop + 0.025, 0.3], transportColors.dark), box("后排连续承载靠背", [0, cushionY + 0.27, z + 0.2], [width, 0.52, 0.11], "#526067"));
  for (const x of [-width * 0.32, 0, width * 0.32]) parts.push(box("后排座位独立头枕", [x, cushionY + 0.61, z + 0.2], [0.23, 0.18, 0.12], "#526067"));
}

function drivingControls(parts: ModelPart[], dashZ: number, dashY: number, width: number, driverX: number) {
  const wheelY = dashY + 0.07, wheelZ = dashZ + 0.37;
  parts.push(box("座舱前部仪表台", [0, dashY, dashZ], [width, 0.18, 0.3], "#3c4b53"), strut("仪表台到方向盘中心的转向柱", [driverX, dashY - 0.03, dashZ], [driverX, wheelY, wheelZ], 0.035), ring("实际承接转向柱的方向盘环", "#34434a", 0.15, 0.023, 0, 0.025, { position: { x: driverX, y: wheelY, z: wheelZ }, rotation: { x: 74.9, y: 0, z: 0 } }), strut("方向盘中心连到外环的横辐", [driverX - 0.14, wheelY, wheelZ], [driverX + 0.14, wheelY, wheelZ], 0.025));
}

function doorsAndMirrors(parts: ModelPart[], width: number, belt: number, doorZ: number[], mirrorZ: number) {
  for (const side of [-1, 1]) {
    for (const z of doorZ) parts.push(box("车门独立外拉把手", [side * (width / 2 + 0.015), belt - 0.11, z], [0.035, 0.045, 0.16], transportColors.trim));
    parts.push(strut("门侧后视镜实际短支臂", [side * (width / 2 - 0.02), belt + 0.035, mirrorZ], [side * (width / 2 + 0.055), belt + 0.07, mirrorZ], 0.045), box("驾驶员两侧后视镜壳", [side * (width / 2 + 0.075), belt + 0.07, mirrorZ], [0.1, 0.105, 0.21], transportColors.dark));
  }
}

// 各车显式定义完整车身、窗柱、座舱与尾舱，不从同一车体的颜色或状态生成主项。
export const everydayPassengerVehicleBatchOne: TransportDefinition[] = [
  { name: "短尾五门两厢城市家用车", theme: "现代", tags: ["汽车", "影视", "生活常见", "两厢掀背乘用车", "前后两排五座", "连通后窗的斜尾门"], create: () => {
    const color = "#9caeb6", parts = bodyShell({ front: -2.1, rear: 2.05, cowl: -0.85, width: 1.8, bottom: 0.25, radius: 0.33, axles: [-1.25, 1.25], track: 1.56, tire: 0.22, belt: 0.94, frontTop: 0.88, floorY: 0.35, floorZ: 0, floorLength: 2.1, color });
    cabin(parts, { belt: 0.94, roofY: 1.53, sideX: 0.82, roofX: 0.65, posts: [[-0.85, -0.4], [0.25, 0.25], [1.95, 0.95]], color, sillStart: -0.85, sillEnd: 1.95 });
    parts.push(surface("短引擎舱倾斜上盖", color, [[-0.875, 0.88, -2.1], [0.875, 0.88, -2.1], [0.875, 0.94, -0.85], [-0.875, 0.94, -0.85]], quadFaces), box("连接斜尾窗与低尾门的横向钣金", [0, 0.935, 1.99], [1.64, 0.07, 0.1], color), box("后尾门开启把手", [0, 0.81, 2.071], [0.23, 0.045, 0.035], transportColors.trim), box("与乘员地板实际叠合的低位行李厢地板", [0, 0.48, 1.48], [1.24, 0.12, 0.96], transportColors.dark), box("纵梁实际承托行李厢底板的横支座", [0, 0.4, 1.7], [1.24, 0.12, 0.14], transportColors.dark));
    captainSeats(parts, -0.15, 0.34, 0.53, 0.43);
    bench(parts, 0.75, 0.53, 0.43, 1.2);
    drivingControls(parts, -0.82, 0.81, 1.74, -0.34);
    doorsAndMirrors(parts, 1.8, 0.94, [-0.12, 1.0], -0.77);
    return parts;
  } },
  { name: "长顶三窗列家用旅行车", theme: "现代", tags: ["汽车", "影视", "生活常见", "旅行车", "两排五座与长后货舱", "独立D柱和直立尾门"], create: () => {
    const color = "#a7b2a5", parts = bodyShell({ front: -2.35, rear: 2.35, cowl: -0.95, width: 1.85, bottom: 0.26, radius: 0.34, axles: [-1.4, 1.45], track: 1.6, tire: 0.23, belt: 0.98, frontTop: 0.89, floorY: 0.36, floorZ: -0.1, floorLength: 2.2, color });
    cabin(parts, { belt: 0.98, roofY: 1.55, sideX: 0.845, roofX: 0.69, posts: [[-0.95, -0.5], [0.2, 0.2], [1.0, 1.0], [2.27, 2.05]], color, sillStart: -0.95, sillEnd: 2.27 });
    parts.push(surface("旅行车独立长引擎舱上盖", color, [[-0.9, 0.89, -2.35], [0.9, 0.89, -2.35], [0.9, 0.98, -0.95], [-0.9, 0.98, -0.95]], quadFaces), box("近直立尾窗下沿的尾门横框", [0, 0.98, 2.3], [1.7, 0.07, 0.1], color), box("旅行车尾门外把手", [0, 0.84, 2.371], [0.24, 0.045, 0.035], transportColors.trim), box("后排以后的贯通长载物舱底板", [0, 0.55, 1.65], [1.25, 0.16, 1.2], transportColors.dark), box("纵梁实际承托旅行车后舱地板的横支座", [0, 0.425, 2.0], [1.25, 0.15, 0.14], transportColors.dark));
    parts.push(box("乘员地板到较高行李厢地板的实体过渡台阶", [0, 0.45, 1.025], [1.25, 0.1, 0.2], transportColors.dark));
    captainSeats(parts, -0.2, 0.35, 0.56, 0.44);
    bench(parts, 0.65, 0.56, 0.44, 1.23);
    drivingControls(parts, -0.93, 0.85, 1.79, -0.35);
    doorsAndMirrors(parts, 1.85, 0.98, [-0.15, 0.78], -0.86);
    return parts;
  } },
  { name: "三排双滑门七座家用MPV", theme: "现代", tags: ["汽车", "影视", "生活常见", "MPV", "家庭多用途乘用车", "二加二加三乘员布局", "双侧长滑门与低位上下车地板"], create: () => {
    const color = "#b7b7ac", parts = bodyShell({ front: -2.55, rear: 2.45, cowl: -1.75, width: 1.94, bottom: 0.3, radius: 0.36, axles: [-1.65, 1.65], track: 1.7, tire: 0.24, belt: 1.13, frontTop: 1.02, floorY: 0.5, floorZ: 0.1, floorLength: 2.8, frameY: 0.4, color });
    cabin(parts, { belt: 1.13, roofY: 1.85, sideX: 0.92, roofX: 0.75, posts: [[-1.75, -1.1], [-0.6, -0.6], [1.1, 1.1], [2.35, 2.05]], color, sillStart: -1.75, sillEnd: 2.35 });
    parts.push(surface("MPV短前舱与前倾风挡下缘的上盖", color, [[-0.945, 1.02, -2.55], [0.945, 1.02, -2.55], [0.945, 1.13, -1.75], [-0.945, 1.13, -1.75]], quadFaces), box("向前叠合中地板的末排座后行李舱地板", [0, 0.6, 1.9], [1.32, 0.16, 0.9], transportColors.dark), box("纵梁实际承托MPV后舱地板的横支座", [0, 0.455, 2.1], [1.32, 0.17, 0.14], transportColors.dark), box("尾门玻璃下缘金属横框", [0, 1.13, 2.4], [1.83, 0.07, 0.1], color), box("家用MPV后尾门开启把手", [0, 0.95, 2.471], [0.26, 0.05, 0.035], transportColors.trim));
    for (const side of [-1, 1]) parts.push(box("家用长滑门外侧真实连续滑轨", [side * 0.98, 1.01, 0.55], [0.035, 0.035, 1.65], transportColors.dark), strut("前门与滑门的独立下部门缝", [side * 0.972, 0.38, -0.6], [side * 0.972, 1.13, -0.6], 0.014), strut("滑门尾端与后侧围的独立门缝", [side * 0.972, 0.43, 1.1], [side * 0.972, 1.13, 1.1], 0.014));
    captainSeats(parts, -0.75, 0.42, 0.7, 0.58);
    captainSeats(parts, 0.25, 0.42, 0.7, 0.58);
    bench(parts, 1.15, 0.7, 0.58, 1.34);
    drivingControls(parts, -1.65, 1.03, 1.88, -0.42);
    doorsAndMirrors(parts, 1.94, 1.13, [-1.2, 0.25], -1.57);
    return parts;
  } },
];

export { bodyShell, cabin, captainSeats, bench, drivingControls, doorsAndMirrors, glazing, quadFaces };
