import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, surface, transportColors, type TransportDefinition } from "./parts";
import { commercialChassis, commercialLights, commercialMirrors, commercialRoof, commercialRoofCap, commercialSeatRow } from "./everydayCommercialVehicleBatchOne";

function lowerOutline(front: number, rear: number, bottom: number, axlePositions: number[], wheelY: number, radius: number): [number, number][] {
  const points: [number, number][] = [[bottom, front]];
  for (const z of axlePositions) {
    points.push([bottom, z - radius]);
    if (Math.abs(wheelY - bottom) > 1e-8) points.push([wheelY, z - radius]);
    for (let index = 1; index <= 8; index++) { const angle = index * Math.PI / 8; points.push([wheelY + Math.sin(angle) * radius, z - Math.cos(angle) * radius]); }
    if (Math.abs(wheelY - bottom) > 1e-8) points.push([bottom, z + radius]);
  }
  return [...points, [bottom, rear]];
}

function sidePlate(name: string, x: number, outline: [number, number][], holes: [number, number][][], color: string): ModelPart {
  const value = polygon(name, color, outline, .055, [x + .0275, 0, 0], holes);
  value.rotation.z = 90;
  return value;
}

function sideGlass(x: number, holes: [number, number][][]): ModelPart[] {
  return holes.map(points => ({ ...sidePlate("与真正梯形窗孔相配的侧面玻璃", x, points, [], transportColors.glass), opacity: .32, roughness: .17 }));
}

function compactFloor(width: number, front: number, rear: number, y: number, axlePositions: number[], wheelY: number, radius: number, sideEntry?: [number, number]): ModelPart[] {
  const parts: ModelPart[] = [box("位于两侧车轮内缘之间的连续中央车内地板", [0, y, (front + rear) / 2], [width - .8, .16, rear - front], transportColors.dark)];
  for (const side of [-1, 1]) {
    const gaps: [number, number][] = axlePositions.map(z => [z - radius, z + radius]);
    if (side > 0 && sideEntry) gaps.push(sideEntry);
    gaps.push([rear, rear]);
    let start = front;
    for (const [lower, upper] of gaps.sort((a, b) => a[0] - b[0])) {
      if (lower > start) parts.push(box("轮拱之间连接中央板与侧壁的车内地板", [side * (width / 2 - .2), y, (start + lower) / 2], [.42, .16, lower - start], transportColors.dark));
      start = Math.max(start, upper);
    }
    for (const z of axlePositions) parts.push(box("在车轮上方实际接入侧壁的封闭轮罩顶", [side * (width / 2 - .2), wheelY + radius + .05, z], [.42, .1, radius * 2], transportColors.dark));
  }
  return parts;
}

function slantedWindshield(name: string, lower: Triple, upper: Triple, lowerWidth: number, upperWidth: number, sideX: number, color: string): ModelPart[] {
  return [{ ...surface(name, transportColors.glass, [[-lowerWidth / 2, lower[1], lower[2]], [lowerWidth / 2, lower[1], lower[2]], [upperWidth / 2, upper[1], upper[2]], [-upperWidth / 2, upper[1], upper[2]]], [0, 1, 2, 0, 2, 3]), opacity: .34, roughness: .17 }, ...[-1, 1].map(side => surface("从收窄风挡外沿真实接到固定侧围的窄A柱颊带", color, [[side * lowerWidth / 2, lower[1], lower[2]], [side * upperWidth / 2, upper[1], upper[2]], [side * sideX, upper[1], upper[2]], [side * sideX, lower[1], lower[2]]], [0, 1, 2, 0, 2, 3]))];
}

export function shortHoodCommercialCab(): ModelPart[] {
  const color = transportColors.body;
  const parts: ModelPart[] = [box("避开前轮后缘并连接车架支座的驾驶舱底板", [0, .78, -1.8], [2.05, .16, 1.6], transportColors.dark), commercialRoof("短头驾驶舱独立圆肩顶盖", 2.1, 1.8, 2.27, -1.85, color), box("风挡上沿实际接入驾驶舱顶盖的封闭前横梁", [0, 2.35, -2.57], [1.9, .28, .3], color), box("驾驶舱后方独立承力背板", [0, 1.52, -.99], [2.05, 1.65, .07], color), box("前伸发动机罩低位前围", [0, .97, -3.93], [1.9, .64, .12], color), surface("从车头向驾驶舱抬高的连续发动机罩", color, [[-.95, 1.26, -3.95], [.95, 1.26, -3.95], [1, 1.44, -2.75], [-1, 1.44, -2.75]], [0, 1, 2, 0, 2, 3]), ...slantedWindshield("短头驾驶室倾斜全幅前风挡", [0, 1.46, -2.76], [0, 2.21, -2.51], 1.96, 1.86, 1.02, color), box("发动机罩前方独立散热格栅", [0, .94, -4.005], [1.38, .39, .035], transportColors.dark), box("位于驾驶座前方的实际仪表台", [0, 1.39, -2.58], [1.9, .21, .34], transportColors.dark), commercialSeatRow("固定在驾驶舱地板上的双座", .86, -1.72, [-.53, .53], .46)];
  parts.push(commercialRoofCap(2.1, 2.27, -.99, color));
  for (const side of [-1, 1]) {
    const opening: [number, number][] = [[1.46, -2.63], [2.15, -2.4], [2.15, -1.1], [1.46, -1.1]];
    parts.push(sidePlate("短头驾驶室与机罩连成一体且真实避让前轮的侧壳", side * 1.02, [...lowerOutline(-3.99, -1, .65, [-3.13], .44, .52), [2.27, -1], [2.25, -2.5], [1.45, -2.77], [1.26, -3.99]], [opening], color), ...sideGlass(side * 1.025, [opening]), box("驾驶门外侧机械把手", [side * 1.075, 1.36, -1.23], [.035, .06, .23], transportColors.dark), box("驾驶舱底板连接主车架的竖向支座", [side * .55, .65, -1.8], [.22, .3, .45], transportColors.dark));
  }
  return parts;
}

// 本批是四种独立完整车身，不注册相同一体厢货改警灯/颜色/长短/医疗内装的版本。
// https://www.fordpro.com/en-us/tools/orders/ordering-production/transit-body-decoder/
// https://www.utilimaster.com/walk-in-van/
// https://www.demers-ambulances.com/us/ambulances/by-type/
export const everydayCommercialVehicleBatchTwo: TransportDefinition[] = [
  { name: "短机罩高顶一体式封闭厢货汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "高顶厢式货车", "一体承载厢货", "侧滑门", "双开后货门"], create: () => {
    const width = 2.04, axlePositions = [-1.9, 1.85], color = transportColors.trim;
    const parts: ModelPart[] = [...commercialChassis(width, 6, .37, axlePositions), ...compactFloor(width, -3, 3, .61, axlePositions, .37, .45), commercialRoof("从驾驶室上方向后连续延伸的高顶厢货车顶", width, 4.2, 2.47, .9, color), ...commercialLights(width, -3.045, 3.045, .85), ...commercialMirrors(width, 1.85, -1.7), surface("短机罩厢货的倾斜发动机上盖", color, [[-1, 1.09, -3], [1, 1.09, -3], [1, 1.34, -2.04], [-1, 1.34, -2.04]], [0, 1, 2, 0, 2, 3]), ...slantedWindshield("高顶一体厢货下斜至短机罩的前风挡", [0, 1.35, -2.04], [0, 2.34, -1.5], 1.94, 1.78, 1, color), surface("前风挡上沿与高顶之间封闭的驾驶室顶盖过渡", color, [[-.89, 2.34, -1.5], [.89, 2.34, -1.5], [.97, 2.58, -1.12], [-.97, 2.58, -1.12]], [0, 1, 2, 0, 2, 3]), box("短机罩前端完整围板", [0, .77, -2.99], [2, .64, .09], color), box("前端独立下格栅", [0, .65, -3.05], [1.27, .23, .04], transportColors.dark), box("隔开驾驶区与完整后货舱的承力隔板", [0, 1.59, -.67], [1.94, 1.85, .07], color), commercialSeatRow("高顶厢货前排驾驶与副驾驶座", .69, -1.11, [-.5, .5], .44)];
    parts.push(part("把前过渡顶板真实接入弧形厢顶的随形封闭上口", "extrude", color, [0, 0, -1.14], [1, 1, 1], [0, 0, 0], { depth: .1, profile: [{ x: -.942, y: 2.575 }, { x: -.9, y: 2.64 }, { x: -.6528, y: 2.7 }, { x: .6528, y: 2.7 }, { x: .9, y: 2.64 }, { x: .942, y: 2.575 }] }), commercialRoofCap(width, 2.47, 3, color));
    for (const side of [-1, 1]) {
      const holes: [number, number][][] = [[[1.44, -1.91], [2.24, -1.48], [2.37, -.8], [1.44, -.8]]];
      parts.push(sidePlate("一体车身连续轮拱侧壳与梯形驾驶侧窗", side * 1.0, [...lowerOutline(-3, 3, .37, axlePositions, .37, .45), [2.5, 3], [2.58, 2.8], [2.58, -1.12], [2.34, -1.5], [1.34, -2.04], [1.09, -3]], holes, color), ...sideGlass(side * 1.005, holes), box("一体车身驾驶门外侧把手", [side * 1.048, 1.29, -.91], [.035, .055, .2], transportColors.dark));
    }
    for (const z of [-.48, 1.05]) parts.push(box("右侧货门闭合边缘的独立细窄门缝", [1.032, 1.53, z], [.02, 1.66, .018], transportColors.dark));
    parts.push(box("侧滑货门外侧平置导轨", [1.045, 2.28, .53], [.035, .035, 2.2], transportColors.dark), box("侧滑门实际操作把手", [1.063, 1.43, .82], [.035, .07, .24], transportColors.dark));
    for (const side of [-1, 1]) parts.push(box("各自独立封闭的后部双开货门", [side * .49, 1.6, 2.995], [.96, 1.98, .075], color), box("后货门固定式铰链", [side * .94, 1.65, 3.05], [.055, .82, .045], transportColors.dark), box("后货门独立竖向锁柄", [side * .13, 1.56, 3.05], [.055, .4, .04], transportColors.dark));
    return parts;
  } },
  { name: "前桥下卧发动机平头微型面包客车", theme: "现代", tags: ["汽车", "影视", "生活常见", "平头面包车", "微型客车", "侧滑门客运", "前排下卧式动力布局"], create: () => {
    const width = 1.65, axlePositions = [-1.3, 1.25], color = "#9caeb2";
    const parts: ModelPart[] = [...commercialChassis(width, 4.2, .28, axlePositions), ...compactFloor(width, -2.1, 2.1, .5, axlePositions, .28, .35), commercialRoof("平头面包车低矮连续圆肩车顶", width, 3.72, 1.77, .21, color), ...slantedWindshield("从前围倾斜接入车顶的平头面包车风挡", [0, 1.04, -2.1], [0, 1.7, -1.77], 1.52, 1.45, .8, color), box("几乎位于前桥正上方的短前围", [0, .76, -2.075], [1.6, .52, .08], color), box("前围下方独立散热入口", [0, .64, -2.125], [1.12, .19, .035], transportColors.dark), box("前排坐垫下方实际卧置的封闭动力室", [0, .56, -1.1], [.95, .22, .8], transportColors.dark), commercialSeatRow("实际坐落在下卧发动机罩上的前排座位", .67, -1.12, [-.4, .4], .34), commercialSeatRow("微型客车中央双人乘员座", .58, .02, [-.35, .35], .36), commercialSeatRow("平头面包车后排固定双座", .58, 1.25, [-.35, .35], .36), ...commercialLights(width, -2.13, 2.13, .73), ...commercialMirrors(width, 1.48, -1.68)];
    parts.push(commercialRoofCap(width, 1.77, 2.08, color));
    for (const side of [-1, 1]) {
      const holes: [number, number][][] = [[[1.08, -1.99], [1.65, -1.7], [1.68, -.87], [1.08, -.87]], [[1.08, -.72], [1.68, -.72], [1.68, .55], [1.08, .55]], [[1.08, .7], [1.68, .7], [1.68, 1.92], [1.08, 1.92]]];
      parts.push(sidePlate("两处轮拱与三组客窗真实开孔的面包车侧围", side * .8, [...lowerOutline(-2.1, 2.1, .34, axlePositions, .28, .35), [1.76, 2.1], [1.84, 1.93], [1.84, -1.63], [1.7, -1.77], [1.04, -2.1]], holes, color), ...sideGlass(side * .805, holes), box("微型客车侧滑门的外部操作把手", [side * .846, .98, .4], [.03, .055, .18], transportColors.dark), box("侧滑门外侧闭合边缘的窄缝", [side * .833, 1.13, .64], [.018, 1.25, .015], transportColors.dark));
    }
    parts.push(box("后掀门下部实体尾门", [0, .91, 2.08], [1.6, .85, .07], color), { ...box("真正位于尾门框中的后观察玻璃", [0, 1.46, 2.08], [1.42, .63, .03], transportColors.glass), opacity: .32 }, box("后掀尾门顶部横向门框", [0, 1.82, 2.08], [1.6, .1, .07], color), box("后掀门实际扣合的锁柄", [0, 1.02, 2.13], [.25, .055, .04], transportColors.dark), box("前排座位前方小型仪表台", [0, 1.0, -1.83], [1.4, .15, .31], transportColors.dark), box("风挡顶部与连续厢顶真正相接的封闭前横框", [0, 1.82, -1.7], [1.5, .24, .2], color));
    for (const side of [-1, 1]) parts.push(box("尾门观察窗外侧独立门柱", [side * .765, 1.47, 2.08], [.07, .72, .07], color));
    return parts;
  } },
  { name: "中置通行道高厢步入式配送汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "步入式配送车", "walk in van", "驾驶货舱贯通", "侧门低台阶"], create: () => {
    const width = 2.36, axlePositions = [-2.6, 2.4], color = transportColors.trim;
    const parts: ModelPart[] = [...commercialChassis(width, 7.4, .39, axlePositions), ...compactFloor(width, -3.7, 3.7, .55, axlePositions, .39, .47, [-1.98, -1.03]), commercialRoof("允许人员从驾驶区站立进入货厢的连续高顶", width, 6.33, 2.91, .52, color), ...slantedWindshield("步入式配送车直立驾驶端全幅风挡", [0, 1.4, -2.8], [0, 2.64, -2.66], 2.2, 2.12, 1.155, color), surface("步入配送车风挡前方的短发动机上盖", color, [[-1.08, 1.14, -3.7], [1.08, 1.14, -3.7], [1.1, 1.4, -2.8], [-1.1, 1.4, -2.8]], [0, 1, 2, 0, 2, 3]), box("低短前机舱端面", [0, .81, -3.67], [2.28, .66, .09], color), box("配送车前端横向散热格栅", [0, .82, -3.73], [1.7, .36, .035], transportColors.dark), commercialSeatRow("贯通货厢一侧的独立司机座", .63, -1.56, [-.59], .45), box("不横挡驾驶区到货舱走道的短仪表台", [-.57, 1.25, -2.35], [1.08, .21, .4], transportColors.dark), ...commercialLights(width, -3.74, 3.74, .88), ...commercialMirrors(width, 2.06, -2.6)];
    for (const side of [-1, 1]) {
      const holes: [number, number][][] = [[[1.43, -2.65], [2.62, -2.51], [2.66, -2.09], [1.43, -2.09]]];
      if (side > 0) holes.push([[.29, -1.98], [2.7, -1.98], [2.7, -1.03], [.29, -1.03]]);
      else holes.push([[1.4, -1.94], [2.67, -1.94], [2.67, -1.03], [1.4, -1.03]]);
      parts.push(sidePlate("允许完整站立通行的步入配送车承力侧围", side * 1.155, [...lowerOutline(-3.7, 3.7, .22, axlePositions, .39, .47), [2.9, 3.7], [3.02, 3.55], [3.02, -2.55], [2.64, -2.66], [1.4, -2.8], [1.14, -3.7]], holes, color), ...sideGlass(side * 1.16, holes));
      for (const y of [1.01, 1.82]) parts.push(box("固定在内侧而不堵住中间走道的长货架板", [side * .91, y, 1.4], [.42, .08, 3.75], transportColors.dark));
      for (const z of [-.4, 1.2, 3.1]) parts.push(box("从车内地板真正承托货架的落地立柱", [side * .94, 1.46, z], [.065, 1.66, .065], transportColors.dark));
    }
    for (const [index, x] of [1.2, .99, .79].entries()) parts.push(box("右前门从外侧逐级进入车内走道的实体台阶", [x, [.2, .4, .55][index]!, -1.5], [.3, .2, .85], transportColors.dark));
    parts.push(box("完整接到车顶且连接左右侧壁的配送厢后卷门", [0, 1.72, 3.68], [2.28, 2.44, .09], color), commercialRoofCap(width, 2.91, 3.68, color), box("直立前风挡上沿实际连入高厢顶的封闭横框", [0, 2.85, -2.55], [2.22, .42, .2], color));
    for (const y of [.8, 1.15, 1.5, 1.85, 2.2, 2.55]) parts.push(box("后卷门横向连接片的实际窄接缝", [0, y, 3.735], [2.17, .018, .018], transportColors.dark));
    return parts;
  } },
  { name: "独立驾驶舱宽体医疗方舱救护汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "方舱救护车", "独立医疗舱体", "完整急救车辆", "非普通厢货换灯"], create: () => {
    const axlePositions = [-3.13, 2.45], color = transportColors.trim;
    const parts: ModelPart[] = [...commercialChassis(2.35, 8.1, .44, axlePositions), ...shortHoodCommercialCab(), commercialRoof("与低驾驶舱真正分开的宽体医疗箱顶", 2.35, 4.85, 3.1, 1.65, color), box("架在车架承座上并高于轮胎的医疗舱地板", [0, 1.02, 1.65], [2.25, .14, 4.85], transportColors.dark), ...commercialLights(2.35, -4.02, 4.115, .94), ...commercialMirrors(2.08, 1.96, -2.5), box("驾驶舱与宽体医疗箱之间独立前隔壁", [0, 2.08, -.77], [2.3, 2.15, .08], color), box("患者担架下方固定的中央纵向承托基座", [0, 1.39, 1.95], [.48, .6, 2.25], transportColors.dark), box("用于识别医疗空间的完整窄担架床垫", [0, 1.76, 1.95], [.68, .15, 2.3], "#b6c4bb"), box("担架两侧人员通道外的固定医疗柜", [-.87, 1.64, .45], [.4, 1.1, 1.65], color), box("医护人员侧长椅的真实落地底座", [.88, 1.35, 2.1], [.25, .52, 1.8], transportColors.dark), box("接在底座顶端的侧长座垫", [.88, 1.68, 2.1], [.43, .14, 1.9], transportColors.dark)];
    for (const side of [-1, 1]) {
      const holes: [number, number][][] = side > 0 ? [[[1.08, -.48], [2.78, -.48], [2.78, .5], [1.08, .5]], [[2.0, 1.0], [2.78, 1.0], [2.78, 2.0], [2.0, 2.0]]] : [[[2.05, .3], [2.78, .3], [2.78, 1.5], [2.05, 1.5]]];
      parts.push(sidePlate("独立宽体医疗舱带真实后轮拱的完整侧壳", side * 1.15, [...lowerOutline(-.77, 4.08, .65, [2.45], .44, .52), [3.1, 4.08], [3.16, 3.96], [3.16, -.65], [3.1, -.77]], holes, color), ...sideGlass(side * 1.155, holes));
      for (const z of [0, 3.5]) parts.push(box("医疗舱地板接向底纵梁的实际竖向车身承座", [side * .62, .79, z], [.25, .4, .5], transportColors.dark));
      parts.push(box("独立医疗箱外壁的侧设备舱门", [side * 1.19, 1.48, 3.18], [.04, 1.35, 1.25], color), box("设备舱机械把手", [side * 1.22, 1.55, 3.65], [.025, .1, .11], transportColors.dark));
      for (const z of [-.25, 3.7]) parts.push(box("医疗方舱前后角侧壁上真实外露的警示灯壳", [side * 1.175, 2.96, z], [.1, .18, .28], "#b96953"));
    }
    for (const side of [-1, 1]) {
      parts.push(box("患者后装门下部独立实体门板", [side * .56, 1.63, 4.08], [1.07, 1.08, .07], color), { ...box("后装患者门中间真正透光的观察玻璃", [side * .56, 2.51, 4.08], [.88, .7, .025], transportColors.glass), opacity: .32 }, box("患者后门顶端承力边框", [side * .56, 2.95, 4.08], [1.08, .22, .07], color));
    }
    for (const x of [-1.13, 0, 1.13]) parts.push(box("后患者门玻璃间实际接到上下门板的门框", [x, 2.51, 4.08], [.07, .9, .07], color));
    for (const [index, x] of [1.52, 1.39, 1.24].entries()) parts.push(box("医疗侧门完全位于舱外并逐级接地板的实体台阶", [x, .425 + index * .25, .02], [.34, .25, .9], transportColors.dark));
    parts.push(box("后装担架门外侧低位承踏板", [0, .79, 4.2], [1.9, .14, .4], transportColors.dark), box("驾驶舱顶与警示横条之间实际相接的灯条承座", [0, 2.53, -1.8], [1.2, .1, .12], transportColors.dark), cylinder("驾驶舱顶独立急救警示灯横条", [0, 2.64, -1.8], [.18, 1.45, .18], "#b96953", [0, 0, 90]));
    return parts;
  } },
];
