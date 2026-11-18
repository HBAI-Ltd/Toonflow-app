import { part, type ModelPart } from "../assetModelParts";
import { slab } from "./modernCommercialSpaceBatchOne";
import { doorway } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchTwo";
import { box, design, rail } from "./structures";

const stone = "#b5b9ae", wall = "#c6c5b5", roof = "#6d8785", timber = "#a18b6b", glass = "#a5c7c4";
type Point = [number, number];
type Opening = [number, number, number, number];

export const modernResidenceSpaceBatchOneDesigns = [design(
  "贯屋分段坡街错层住宅",
  "连续上行的中轴坡街穿过折线外墙围成的长宅，四米西层与五点八米东层分别接到坡街的平平台，后部短梯和跨街桥把两侧高程连通，前低后高的屋盖围出通天采光街",
  () => rampStreetResidence(), "建筑", "现代",
)];

export function glazedWall(name: string, start: Point, end: Point, bottom: number, top: number, openings: Opening[], doors: Opening[] = []): ModelPart[] {
  const dx = end[0] - start[0], dz = end[1] - start[1], length = Math.hypot(dx, dz), ux = dx / length, uz = dz / length;
  const outline: Point[] = [[-length / 2, bottom]];
  for (const [center, base, width, height] of doors.filter(value => value[1] <= bottom).sort((a, b) => a[0] - b[0])) outline.push([center - width / 2, bottom], [center - width / 2, base + height], [center + width / 2, base + height], [center + width / 2, bottom]);
  outline.push([length / 2, bottom], [length / 2, top], [-length / 2, top]);
  const value = slab(name, wall, outline, .24, [0, 0, 0], [...openings, ...doors.filter(value => value[1] > bottom)].map(([center, base, width, height]): Point[] => [[center - width / 2, base], [center + width / 2, base], [center + width / 2, base + height], [center - width / 2, base + height]]));
  // 沿墙长、向外厚度和高度组成正手性坐标，保留每面分离的硬边顶点。
  value.vertices = value.vertices!.map(({ x, y: thickness, z: height }) => ({ x: (start[0] + end[0]) / 2 + x * ux + thickness * uz, y: height, z: (start[1] + end[1]) / 2 + x * uz - thickness * ux }));
  return [value, ...openings.map(([center, base, width, height]) => part("实际贯通墙孔内的独立透明玻璃", "box", glass, [(start[0] + end[0]) / 2 + center * ux + .12 * uz, base + height / 2, (start[1] + end[1]) / 2 + center * uz - .12 * ux], [width, height, .035], [0, -Math.atan2(dz, dx) * 180 / Math.PI, 0], { opacity: .28, roughness: .22 }))];
}

function slopeBody(name: string, start: number, end: number, low: number, high: number): ModelPart {
  return part(name, "extrude", stone, [0, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 3.2, profile: [{ x: start, y: .2 }, { x: end, y: .2 }, { x: end, y: high }, { x: start, y: low }] });
}

function slopeGuard(name: string, x: number, start: number, end: number, low: number, high: number): ModelPart {
  return part(name, "extrude", roof, [x, 0, 0], [1, 1, 1], [0, -90, 0], { depth: .1, profile: [{ x: start, y: low }, { x: end, y: high }, { x: end, y: high + .95 }, { x: start, y: low + .95 }] });
}

function rampStreetResidence(): ModelPart[] {
  const west: Point[] = [[-13, -18], [-13, -4], [-10, -1], [-10, 14], [-7, 18], [-2, 18], [-2, -18]];
  const east: Point[] = [[2, -18], [13, -18], [13, 1], [10, 4], [10, 18], [2, 18]];
  const p: ModelPart[] = [
    box("住宅及两侧独立入户步道的共同场坪", 0, .1, 0, 31, .2, 42, stone),
    slab("折线西房连续落地生活层", timber, west, .2, [0, .2, 0]),
    slab("折线东房连续落地生活层", timber, east, .2, [0, .2, 0]),
    slab("接入坡街中平台的完整西侧四米楼面", timber, west, .22, [0, 3.78, 0]),
    slab("接入坡街高平台的完整东侧高楼面", timber, east, .22, [0, 5.58, 0]),
    slab("前低西屋盖沿折线承墙完整闭合", roof, [[-13.3, -18.3], [-13.3, -3.9], [-10.3, -.9], [-10.3, 12], [-1.8, 12], [-1.8, -18.3]], .22, [0, 7.4, 0]),
    slab("后部高房实际覆住回折短梯与跨街平台", roof, [[-10.3, 12], [-10.3, 14.1], [-7.1, 18.3], [-1.8, 18.3], [-1.8, 12]], .22, [0, 9.2, 0]),
    slab("完整东屋盖沿前后折墙封顶", roof, [[1.8, -18.3], [13.3, -18.3], [13.3, 1.1], [10.3, 4.1], [10.3, 18.3], [1.8, 18.3]], .22, [0, 9.2, 0]),
    slopeBody("从入户地坪连续升到西层平台的实体街坡", -18, 3, .4, 4),
    box("西层门口与坡街同标高的完整平平台", 0, 2.1, 5, 3.2, 3.8, 4, stone),
    slopeBody("中平台继续上升到东层平台的实体街坡", 7, 16, 4, 5.8),
    box("两侧高层之间可横行的坡街末端平平台", 0, 3, 17, 3.2, 5.6, 2, stone),
    box("坡街中平台越过侧缝接入西房真门的短桥", -1.9, 3.89, 5, .9, .22, 2, timber),
    box("坡街末平台越过侧缝接入东房真门的短桥", 1.9, 5.69, 17, .9, .22, 1.6, timber),
    box("西房后短梯接出的高位完整落脚台", -4.6, 5.69, 17.4, 5.2, .22, 1.2, timber),
    box("西房后高平台穿门接到坡街的完整短桥", -1.9, 5.69, 17.4, .9, .22, 1.2, timber),
    stairFlight("西房四米层真正上接后高平台的短梯", -4.5, 4, 12, 2, 12, .15, .4),
  ];
  const outerWalls: [Point, Point, number][] = [
    [[-13, -18], [-13, -4], 7.4], [[-13, -4], [-10, -1], 7.4], [[-10, -1], [-10, 12], 7.4], [[-10, 12], [-10, 14], 9.2], [[-10, 14], [-7, 18], 9.2],
    [[13, -18], [13, 1], 9.2], [[13, 1], [10, 4], 9.2], [[10, 4], [10, 18], 9.2],
  ];
  for (const [start, end, top] of outerWalls) {
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]), width = Math.min(3.8, length * .55), upper = start[0] < 0 && top === 7.4 ? 4 : 5.8;
    p.push(...glazedWall("随外廓转折且保留上下实际窗洞的连续承重壁", start, end, .4, top, [[0, 1.4, width, 1.4], [0, upper + .8, width, 1.4]]));
  }
  p.push(
    ...glazedWall("西房沿通天坡街的前段完整承屋壁", [-2, -18], [-2, 12], .4, 7.4, [[-9, 1.4, 3.8, 1.4], [1, 1.4, 3.8, 1.4], [-8, 4.8, 4, 1.5]], [[8, 4, 2, 2.4]]),
    ...glazedWall("西房后高室面对坡街的带门承屋壁", [-2, 12], [-2, 18], .4, 9.2, [[0, 1.4, 2.5, 1.4]], [[2, 5.8, 1.6, 2.4]]),
    ...glazedWall("东房沿通天坡街且真实接入末平台的完整承屋壁", [2, -18], [2, 18], .4, 9.2, [[-9, 1.4, 5, 1.6], [3, 1.4, 5, 1.6], [-7, 6.6, 5, 1.5]], [[17, 5.8, 1.6, 2.4]]),
    ...glazedWall("西房高低屋盖之间真实带窗的竖直收头壁", [-10, 12], [-2, 12], 7.4, 9.2, [[0, 7.65, 5.5, 1.25]]),
    ...glazedWall("西房后端沿高室完全封合的厚壁", [-7, 18], [-2, 18], .4, 9.2, [[0, 6.6, 2.8, 1.5]]),
    ...glazedWall("东房后端与高平台同层的封合厚壁", [2, 18], [10, 18], .4, 9.2, [[0, 1.4, 4, 1.5], [0, 6.6, 4, 1.5]]),
    ...glazedWall("西房前端有上下真实门窗的完整厚墙", [-13, -18], [-2, -18], .4, 7.4, [[0, 4.8, 5, 1.5]], [[0, .4, 2, 2.4]]),
    ...glazedWall("东房前端有上下真实门窗的完整厚墙", [2, -18], [13, -18], .4, 9.2, [[0, 6.6, 5, 1.5]], [[0, .4, 2, 2.4]]),
    doorway("西层睡房与后部短梯之间的实际分隔门", [-6, 4, 8.5], 8, 3.4, 1.6, 0, 2.4),
    doorway("东层起居与睡房之间的实际内门", [7, 5.8, 2], 10, 3.4, 1.6, 0, 2.4),
  );
  for (const x of [-1.48, 1.48]) p.push(slopeGuard("下段街坡边缘随坡升高的连续护壁", x, -18, 3, .4, 4), slopeGuard("上段街坡边缘随坡升高的连续护壁", x, 7, 16, 4, 5.8));
  p.push(box("西层平台另一侧实际落地的连续护壁", 1.48, 4.475, 5, .1, .95, 4, roof), box("末平台迎向后外场的真实低护壁", 0, 6.275, 17.95, 3.2, .95, .1, roof));
  for (const x of [-5.5, -3.5]) p.push(rail([x, 4.9, 12], [x, 6.7, 16.8], .06, roof), box("短梯扶手低端实际支在楼面的竖柱", x, 4.45, 12, .06, .9, .06, roof), box("短梯扶手高端实际支在高平台的竖柱", x, 6.25, 16.8, .06, .9, .06, roof));
  p.push(box("西层房间独立落在木楼面上的床座", -7.4, 4.22, 2, 2, .44, 2.5, timber), box("西层床座上真实贴合的软垫", -7.4, 4.5, 2, 1.95, .12, 2.45, "#d0c9b7"), box("东层临高窗独立坐台", 8.2, 6.05, 10, 1.2, .5, 5, timber));
  return p;
}
