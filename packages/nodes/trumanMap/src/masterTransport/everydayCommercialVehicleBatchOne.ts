import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { combineMeshes } from "../natureParts";
import { rod } from "../masterObjects/parts";
import { box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";

export function commercialChassis(width: number, length: number, radius: number, axlePositions: number[], centerZ = 0): ModelPart[] {
  const parts: ModelPart[] = [-1, 1].map(side => box("实际贯通前后悬架的车底纵向承梁", [side * width * .27, radius + .04, centerZ], [.14, .24, length], transportColors.dark));
  for (const z of [centerZ - length * .22, centerZ + length * .22]) parts.push(box("由底纵梁实际接向左右车身侧壁的横向承梁", [0, radius + .04, z], [width * .98, .2, .16], transportColors.dark));
  for (const z of axlePositions) {
    parts.push(cylinder("连接两侧车轮的真实横向车桥", [0, radius, z], [.12, width - .1, .12], transportColors.dark, [0, 0, 90]));
    for (const side of [-1, 1]) parts.push(...wheel([side * (width / 2 - .2), radius, z], radius, .28), box("车桥接入纵梁的独立悬架承座", [side * width * .27, radius + .02, z], [.22, .16, .62], transportColors.dark));
  }
  return parts;
}

export function commercialSideSkin(name: string, x: number, startZ: number, endZ: number, bottom: number, top: number, axlePositions: number[], wheelY: number, archRadius: number, openings: [number, number, number, number][], color: string): ModelPart {
  const outline: [number, number][] = [[bottom, startZ]];
  for (const z of [...axlePositions].sort((a, b) => a - b)) {
    if (z - archRadius <= startZ || z + archRadius >= endZ) continue;
    outline.push([bottom, z - archRadius], [wheelY, z - archRadius]);
    for (let index = 1; index <= 8; index++) { const angle = index * Math.PI / 8; outline.push([wheelY + Math.sin(angle) * archRadius, z - Math.cos(angle) * archRadius]); }
    outline.push([bottom, z + archRadius]);
  }
  outline.push([bottom, endZ], [top - .14, endZ], [top, endZ - .18], [top, startZ + .18], [top - .14, startZ]);
  const holes = openings.map(([lower, upper, front, rear]): [number, number][] => [[lower, front], [upper, front], [upper, rear], [lower, rear]]);
  const value = polygon(name, color, outline, .065, [x + .0325, 0, 0], holes);
  value.rotation.z = 90;
  return value;
}

export function commercialRoof(name: string, width: number, length: number, y: number, z = 0, color = transportColors.trim): ModelPart {
  return part(name, "extrude", color, [0, y, z], [1, 1, 1], [0, 0, 0], { depth: length, profile: [{ x: -width / 2, y: 0 }, { x: -width / 2 + .12, y: .17 }, { x: -width * .32, y: .23 }, { x: width * .32, y: .23 }, { x: width / 2 - .12, y: .17 }, { x: width / 2, y: 0 }, { x: width / 2 - .07, y: -.045 }, { x: width * .3, y: .145 }, { x: -width * .3, y: .145 }, { x: -width / 2 + .07, y: -.045 }] });
}

export function commercialRoofCap(width: number, y: number, z: number, color: string): ModelPart {
  return part("在端窗楣上方按原圆肩顶形闭合而不遮挡玻璃的端顶封口", "extrude", color, [0, y, z], [1, 1, 1], [0, 0, 0], { depth: .08, profile: [{ x: -width / 2, y: 0 }, { x: -width / 2 + .12, y: .17 }, { x: -width * .32, y: .23 }, { x: width * .32, y: .23 }, { x: width / 2 - .12, y: .17 }, { x: width / 2, y: 0 }] });
}

export function commercialSeatRow(name: string, floorY: number, z: number, xs: number[], seatWidth = .4): ModelPart {
  const pieces: ModelPart[] = [];
  for (const x of xs) {
    pieces.push(polygon("座垫", transportColors.dark, [[-seatWidth / 2, -.24], [seatWidth / 2, -.24], [seatWidth / 2, .24], [-seatWidth / 2, .24]], .12, [x, floorY + .36, z]), polygon("实际落地座脚", transportColors.dark, [[-.055, -.13], [.055, -.13], [.055, .13], [-.055, .13]], .36, [x, floorY, z]), polygon("接入坐垫的独立靠背", transportColors.dark, [[-seatWidth / 2, -.045], [seatWidth / 2, -.045], [seatWidth / 2, .045], [-seatWidth / 2, .045]], .58, [x, floorY + .45, z + .23]));
  }
  return combineMeshes(name, transportColors.dark, pieces);
}

export function commercialMirrors(width: number, y: number, z: number): ModelPart[] {
  return [-1, 1].flatMap(side => [strut("从车身接向外侧后视镜的独立承臂", [side * width / 2, y + .1, z + .14], [side * (width / 2 + .3), y, z], .045, transportColors.dark), box("实际接在承臂端部的道路后视镜", [side * (width / 2 + .3), y - .11, z], [.13, .36, .2], transportColors.dark), box("后视镜反射面", [side * (width / 2 + .3), y - .11, z + .105], [.11, .3, .025], transportColors.glass)]);
}

export function commercialLights(width: number, frontZ: number, rearZ: number, y: number): ModelPart[] {
  return [-1, 1].flatMap(side => [box("前端道路照明灯组", [side * width * .34, y, frontZ], [width * .16, .16, .055], "#ddd9bd"), box("后端制动与方向灯组", [side * width * .38, y, rearZ], [.15, .33, .055], "#b96953")]);
}

function frontSkin(name: string, width: number, bottom: number, top: number, z: number, holes: [number, number, number, number][], color: string): ModelPart {
  const value = polygon(name, color, [[-width / 2, -bottom], [width / 2, -bottom], [width / 2, -top + .15], [width / 2 - .17, -top], [-width / 2 + .17, -top], [-width / 2, -top + .15]], .065, [0, 0, z - .0325], holes.map(([x1, x2, lower, upper]) => [[x1, -lower], [x2, -lower], [x2, -upper], [x1, -upper]]));
  value.rotation.x = 90;
  return value;
}

function sideGlazing(x: number, openings: [number, number, number, number][]): ModelPart[] {
  return openings.map(([lower, upper, front, rear]) => ({ ...box("装在实际侧窗或车门开孔中的透明玻璃", [x, (lower + upper) / 2, (front + rear) / 2], [.025, upper - lower - .025, rear - front - .025], transportColors.glass), opacity: .34, roughness: .17 }));
}

function lowerBusFloor(width: number, length: number, floorY: number, axlePositions: number[], archRadius: number, entry?: { startZ: number; endZ: number; innerX: number }): ModelPart[] {
  const half = (width - .95) / 2;
  const parts: ModelPart[] = [entry ? polygon("为前门下降台阶真正切掉右边入口的中央通行地板", transportColors.dark, [[-half, -length / 2], [half, -length / 2], [half, entry.startZ], [entry.innerX, entry.startZ], [entry.innerX, entry.endZ], [half, entry.endZ], [half, length / 2], [-half, length / 2]], .12, [0, floorY - .06, 0]) : box("前后连通且避开两侧车轮的中央通行地板", [0, floorY, 0], [width - .95, .12, length], transportColors.dark)];
  for (const side of [-1, 1]) {
    let startZ = -length / 2;
    const gaps: [number, number][] = axlePositions.map(z => [z - archRadius, z + archRadius]);
    if (entry && side > 0) gaps.push([entry.startZ, entry.endZ]);
    gaps.push([length / 2, length / 2]);
    for (const [front, rear] of gaps.sort((a, b) => a[0] - b[0])) {
      const endZ = Math.min(length / 2, front);
      if (endZ > startZ) parts.push(box("车轮间与中央通行板相接的侧地板", [side * (width / 2 - .24), floorY, (startZ + endZ) / 2], [.5, .12, endZ - startZ], transportColors.dark));
      startZ = Math.max(startZ, rear);
    }
    for (const z of axlePositions) parts.push(box("车轮正上方的独立封闭轮罩顶板", [side * (width / 2 - .24), archRadius * 2 + .08, z], [.5, .12, archRadius * 2], transportColors.dark));
  }
  return parts;
}

// 独立完整车身布局：上下客舱、架高行李舱、机场宽体平层及长机罩校车，不以涂装或座位数扩主。
// https://www.alexander-dennis.com/the-all-new-enviro400-designed-by-the-industry-for-the-industry/
// https://www.cobus-industries.com/produkte/cobus-3000/
// https://thomasbuiltbuses.com/school-buses/evolved-saf-t-liner-c2/
export const everydayCommercialVehicleBatchOne: TransportDefinition[] = [
  { name: "内置登楼梯双层城市巴士", theme: "现代", tags: ["汽车", "影视", "生活常见", "双层公交车", "上下独立可通行客舱", "真实楼梯孔与台阶", "完整城市双层客车"], create: () => {
    const width = 2.48, length = 10.6, axlePositions = [-3.5, 3.2];
    const parts: ModelPart[] = [...commercialChassis(width, length, .49, axlePositions), ...lowerBusFloor(width, length, .57, axlePositions, .57), commercialRoof("承接双层立柱的浅弧连续车顶", width, length, 3.94), ...commercialLights(width, -5.34, 5.34, .93), ...commercialMirrors(width, 2.14, -5.1)];
    parts.push(commercialRoofCap(width, 3.94, -5.3, transportColors.trim), commercialRoofCap(width, 3.94, 5.3, transportColors.trim));
    const upperFloor = polygon("在右前方真正留出登楼梯孔并连接侧壁的上层楼板", transportColors.dark, [[-1.195, -5.25], [1.195, -5.25], [1.195, 5.25], [-1.195, 5.25]], .13, [0, 2.23, 0], [[[.22, -4.25], [1.12, -4.25], [1.12, -2.33], [.22, -2.33]]]);
    parts.push(upperFloor);
    for (const side of [-1, 1]) {
      const openings: [number, number, number, number][] = [[1.18, 2.07, -5.08, -4.25], ...[-3.68, -2.5, -1.32, 2, 3.18, 4.36].map(z => [1.18, 2.07, z - .47, z + .47] as [number, number, number, number]), ...[-4.5, -3.2, -1.9, -.6, .7, 2, 3.3, 4.6].map(z => [2.65, 3.74, z - .52, z + .52] as [number, number, number, number])];
      if (side > 0) { openings[0] = [.62, 2.08, -5.08, -4.25]; openings.push([.62, 2.08, .3, 1.3]); } else openings.push([1.18, 2.07, .4, 1.35]);
      parts.push(commercialSideSkin("上下层实墙与两排真正开孔侧窗的双层巴士侧壳", side * 1.22, -5.3, 5.3, .43, 3.94, axlePositions, .49, .57, openings, transportColors.body), ...sideGlazing(side * 1.225, openings));
    }
    for (const end of [-1, 1]) parts.push(frontSkin("上下两块风挡分开的完整双层车端壳", width, .5, 3.94, end * 5.3, [[-1.08, 1.08, 1.22, 2.07], [-1.08, 1.08, 2.64, 3.73]], transportColors.body), { ...box("下层车端全幅玻璃", [0, 1.645, end * 5.3], [2.14, .82, .025], transportColors.glass), opacity: .34 }, { ...box("上层乘员正前方独立玻璃", [0, 3.185, end * 5.3], [2.14, 1.06, .025], transportColors.glass), opacity: .34 });
    for (let index = 0; index < 10; index++) parts.push(box("从下层走到上层梯口的独立登楼踏步", [.67, .65 + index * .177, -4.14 + index * .19], [.85, .16, .22], transportColors.dark));
    for (const x of [.27, 1.07]) parts.push(strut("实际承接各级楼梯踏步的斜向梯梁", [x, .55, -4.23], [x, 2.22, -2.24], .11, transportColors.dark));
    for (const z of [-1.6, -.65, 1.85, 4.4]) parts.push(commercialSeatRow("下层双侧成组座位与落地椅脚", .63, z, [-.9, -.48, .48, .9], .38));
    for (const z of [-4.55, -3.62, -1.5, -.55, .4, 1.35, 2.3, 3.25, 4.2]) parts.push(commercialSeatRow("上层保留中央走道和登楼口的成组座位", 2.36, z, z === -3.62 ? [-.9, -.48] : [-.9, -.48, .48, .9], .38));
    parts.push(box("司机前方实际安装的仪表台", [-.6, 1.26, -4.94], [.95, .22, .42], transportColors.dark), commercialSeatRow("靠近前风挡的独立驾驶座", .63, -4.55, [-.62], .44), box("车尾发动机通风检修盖", [0, .99, 5.345], [1.75, .48, .05], transportColors.dark));
    return parts;
  } },
  { name: "下置贯通行李舱高地板长途客车", theme: "现代", tags: ["汽车", "影视", "生活常见", "长途大巴", "高架乘客地板", "下置行李舱", "下沉驾驶位与阶梯登车"], create: () => {
    const width = 2.55, length = 12.2, axlePositions = [-3.85, 3.6, 4.85];
    const parts: ModelPart[] = [...commercialChassis(width, length, .49, axlePositions), commercialRoof("长途大巴连续圆肩车顶", width, length, 3.43), box("实际连接侧壁且高于行李舱的完整乘客地板", [0, 1.52, .7], [2.45, .16, 10.7], transportColors.dark), box("给右侧登车梯留空且落在纵梁上的司机地板", [-.65, .74, -5.35], [1, .2, 1.4], transportColors.dark), ...commercialLights(width, -6.14, 6.14, 1), ...commercialMirrors(width, 2.47, -5.95)];
    parts.push(commercialRoofCap(width, 3.43, -6.1, transportColors.trim), commercialRoofCap(width, 3.43, 6.1, transportColors.trim));
    for (const side of [-1, 1]) {
      const openings: [number, number, number, number][] = [[1.6, 2.93, -5.86, -4.76], ...[-4, -2.7, -1.4, -.1, 1.2, 2.5, 3.8, 5.1].map(z => [2.01, 3.23, z - .54, z + .54] as [number, number, number, number])];
      if (side > 0) openings[0] = [.35, 2.93, -5.86, -4.76];
      parts.push(commercialSideSkin("高架客室侧窗下保留行李厢的完整长途车侧壳", side * 1.25, -6.1, 6.1, .3, 3.43, axlePositions, .49, .57, openings, transportColors.body), ...sideGlazing(side * 1.255, openings));
      for (const z of [-2.5, -.9, .7, 2.3]) parts.push(box("严格位于前后轮拱之间的下置行李厢门", [side * 1.29, .98, z], [.05, .82, 1.4], transportColors.trim), box("行李舱门内嵌的低位操作把手", [side * 1.323, 1.09, z], [.025, .065, .27], transportColors.dark));
    }
    parts.push(frontSkin("高地板大巴真正留有全景风挡孔的前围", width, .5, 3.43, -6.1, [[-1.13, 1.13, 1.43, 3.17]], transportColors.body), { ...box("从司机位延伸到高架乘员层的全景风挡", [0, 2.3, -6.1], [2.22, 1.7, .03], transportColors.glass), opacity: .3 }, box("长途大巴完整后围", [0, 1.92, 6.07], [2.5, 3.05, .11], transportColors.body), box("后置动力室横向通风格栅", [0, 1.07, 6.14], [2.05, .7, .05], transportColors.dark), box("车尾乘员应急窗", [0, 2.7, 6.14], [2.1, 1, .03], transportColors.glass));
    for (const z of [-3.65, -2.72, -1.79, -.86, .07, 1, 1.93, 2.86, 3.79, 4.72, 5.65]) parts.push(commercialSeatRow("保留中央纵向走道的长途座椅排", 1.6, z, [-.94, -.48, .48, .94], .42));
    for (let index = 0; index < 6; index++) parts.push(box("从低位前客门通往架高客室的实体登车台阶", [.76, .225 + index * .25, -5.85 + index * .22], [.85, .25, .25], transportColors.dark));
    parts.push(commercialSeatRow("下沉驾驶区的独立司机座", .84, -5.15, [-.65], .45), box("位于风挡下方的驾驶仪表台", [-.55, 1.5, -5.83], [1.2, .22, .4], transportColors.dark), box("乘客层正下方连续行李舱底板", [0, .67, -.4], [2.2, .12, 5.5], transportColors.dark));
    return parts;
  } },
  { name: "双侧大门宽体低地板机场摆渡巴士", theme: "现代", tags: ["汽车", "影视", "生活常见", "机场摆渡车", "宽体机坪巴士", "六扇双侧乘客门", "低平中央站立区", "门式低位车桥"], create: () => {
    const width = 3, length = 13.2, axlePositions = [-4.8, 4.8];
    const parts: ModelPart[] = [commercialRoof("宽体机场巴士平展圆肩车顶", width, length, 2.98), ...lowerBusFloor(width, length, .35, axlePositions, .52), ...commercialMirrors(width, 2.15, -6.42), ...commercialLights(width, -6.64, 6.64, .85)];
    parts.push(commercialRoofCap(width, 2.98, -6.6, transportColors.trim), commercialRoofCap(width, 2.98, 6.6, transportColors.trim));
    for (const side of [-1, 1]) parts.push(box("低于平层乘客地板的实际贯通底梁", [side * .9, .22, 0], [.18, .14, 12.9], transportColors.dark));
    for (const z of axlePositions) {
      parts.push(cylinder("从乘员地板下通过的下沉式门桥中央轴", [0, .15, z], [.1, 2.45, .1], transportColors.dark, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(...wheel([side * 1.27, .45, z], .45, .28), box("实际连接低轴与高轮心的门桥端部齿轮箱", [side * 1.08, .33, z], [.22, .47, .4], transportColors.dark), cylinder("门桥齿箱上端接向车轮的独立短轴", [side * 1.2, .45, z], [.1, .5, .1], transportColors.trim, [0, 0, 90]));
    }
    for (const side of [-1, 1]) {
      const openings: [number, number, number, number][] = [[.43, 2.65, -3.95, -2.35], [.43, 2.65, -.8, .8], [.43, 2.65, 2.35, 3.95], [1.36, 2.67, -6.3, -4.12], [1.36, 2.67, -2.2, -.95], [1.36, 2.67, .95, 2.2], [1.36, 2.67, 4.12, 6.28]];
      parts.push(commercialSideSkin("六扇大门与真实轮拱开孔的宽体巴士侧壳", side * 1.47, -6.6, 6.6, .3, 2.98, axlePositions, .45, .52, openings, transportColors.trim), ...sideGlazing(side * 1.475, openings));
      for (const z of [-3.15, 0, 3.15]) parts.push(box("每组双开客门中央的真实门框竖边", [side * 1.49, 1.54, z], [.045, 2.2, .045], transportColors.dark));
      for (const z of [-4.8, 4.8]) parts.push(box("实际坐落在轮罩顶板上的侧置短长椅", [side * 1.17, 1.25, z], [.48, .14, 1.2], transportColors.dark));
    }
    for (const end of [-1, 1]) parts.push(frontSkin("宽体平层机场巴士的整幅车端围板", width, .35, 2.98, end * 6.6, [[-1.35, 1.35, 1.3, 2.73]], transportColors.trim), { ...box("宽体驾驶端和后端全幅玻璃", [0, 2.01, end * 6.6], [2.66, 1.39, .03], transportColors.glass), opacity: .34 });
    parts.push(box("分隔独立驾驶室与乘客站立区的后隔板", [0, 1.47, -4.02], [2.85, 2.25, .08], transportColors.body), box("驾驶舱高于前桥的独立地板", [0, .95, -5.35], [2.65, .12, 2.45], transportColors.dark), commercialSeatRow("机场驾驶室单独安装的司机座", 1.01, -5.3, [-.7], .46), box("宽体司机前方仪表台", [-.65, 1.55, -6.1], [1.35, .2, .43], transportColors.dark));
    for (const side of [-1, 1]) {
      for (const z of [-1.55, 1.55, 4.1]) parts.push(rod("实际连接低地板与顶梁的站立扶手杆", [side * .8, .41, z], [side * .8, 2.82, z], .035, transportColors.dark));
      parts.push(rod("贯通乘客站立区的高位纵向扶手", [side * .8, 2.62, -2.1], [side * .8, 2.62, 4.5], .035, transportColors.dark));
    }
    return parts;
  } },
  { name: "前伸长机罩高窗顶学童校车", theme: "现代", tags: ["汽车", "影视", "生活常见", "长头校车", "前置发动机凸出机罩", "独立乘员箱体", "前门实体台阶", "完整学童通勤车"], create: () => {
    const width = 2.45, axlePositions = [-3.9, 3.3], color = "#c7ab61";
    const parts: ModelPart[] = [...commercialChassis(width, 10.8, .48, axlePositions), ...lowerBusFloor(width, 10.8, .94, axlePositions, .56, { startZ: -3.38, endZ: -2.48, innerX: .43 }), commercialRoof("独立后部校车厢的连续弧顶", width, 8.9, 2.98, .85, color), ...commercialMirrors(width, 2.3, -3.5), ...commercialLights(width, -5.47, 5.35, 1.05)];
    parts.push(commercialRoofCap(width, 2.98, -3.6, color), commercialRoofCap(width, 2.98, 5.3, color));
    const hood = polygon("从低位进气口向驾驶室升高的前伸发动机罩", color, [[.72, -5.4], [1.38, -5.4], [1.61, -3.55], [.72, -3.55]], 1.86, [.93, 0, 0]);
    hood.rotation.z = 90;
    parts.push(hood, box("长机罩前端独立发动机进气格栅", [0, 1.08, -5.435], [1.6, .56, .05], transportColors.dark), box("前伸发动机舱下方宽防撞保险杠", [0, .65, -5.49], [2.25, .2, .14], transportColors.dark));
    for (const side of [-1, 1]) {
      const openings: [number, number, number, number][] = [-2.85, -1.85, -.85, .15, 1.15, 2.15, 3.15, 4.15].map(z => [1.76, 2.72, z - .39, z + .39]);
      if (side > 0) openings[0] = [.65, 2.72, -3.28, -2.43];
      parts.push(commercialSideSkin("高腰线独立乘员箱体的校车侧壁与真实后轮拱", side * 1.2, -3.6, 5.3, .6, 2.98, [3.3], .48, .56, openings, color), ...sideGlazing(side * 1.205, openings));
      for (const y of [1.22, 1.48]) parts.push(box("直接贴合车身侧壁的通长防擦筋", [side * 1.245, y, .85], [.065, .065, 8.85], transportColors.dark));
      const fenderProfile = Array.from({ length: 9 }, (_, index) => { const angle = index * Math.PI / 8; return { x: Math.cos(angle) * .65, y: Math.sin(angle) * .65 }; });
      fenderProfile.push(...Array.from({ length: 9 }, (_, index) => { const angle = (8 - index) * Math.PI / 8; return { x: Math.cos(angle) * .58, y: Math.sin(angle) * .58 }; }));
      parts.push(part("长机罩两侧独立于箱体的完整前轮弧形翼子板", "extrude", color, [side * 1.05, .48, -3.9], [1, 1, 1], [0, 90, 0], { depth: .52, profile: fenderProfile }));
    }
    parts.push(frontSkin("位于长机罩后方而非车头前端的校车驾驶室围板", width, .85, 2.98, -3.6, [[-1.07, 1.07, 1.8, 2.75]], color), { ...box("长机罩后部驾驶室全幅前风挡", [0, 2.275, -3.63], [2.1, .9, .035], transportColors.glass), opacity: .32 }, box("实际接入弧顶端封口并带应急门的完整校车后围", [0, 1.78, 5.28], [2.4, 2.42, .11], color), box("后围中间独立应急门板", [0, 1.62, 5.35], [1.08, 1.98, .05], transportColors.trim), box("应急门上的独立观察玻璃", [0, 2.03, 5.385], [.9, .8, .025], transportColors.glass));
    for (const z of [-1.95, -.95, .05, 1.05, 2.05, 4.05, 4.85]) parts.push(commercialSeatRow("高靠背双侧学童成组座椅与中央通行道", 1, z, [-.91, -.49, .49, .91], .4));
    for (let index = 0; index < 4; index++) parts.push(box("前方客门口的实际上下车台阶", [.82, .25 + index * .2, -3.25 + index * .22], [.75, .2, .25], transportColors.dark));
    parts.push(commercialSeatRow("长头驾驶舱内的独立司机座", 1, -2.93, [-.65], .44), box("机罩后端的驾驶仪表台", [-.5, 1.62, -3.35], [1.1, .22, .35], transportColors.dark));
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(cylinder("校车车厢顶端成对的警示灯", [side * .9, 2.83, end < 0 ? -3.65 : 5.35], [.15, .035, .15], "#b96953", [90, 0, 0]));
    return parts;
  } },
];
