import { part, type ModelPart, type Triple } from "../assetModelParts";
import { base, box, design, type ArchitecturePrototype } from "./structures";
import { halfRoundWall } from "./spatialShells";
import { polygon, sweptProfile } from "../masterNature/shared";
import { combineMeshes } from "../natureParts";
import { turn, stairFlight } from "./historicSpaceBatchSeven";
import { crossingVault } from "./historicSpaceBatchSix";

const stone = "#b2ae99", brick = "#aa8d71", sand = "#c0ac83";

// 完整原创椭圆空间，实际尺寸使用米；长构筑物采用分片基础，不放宽单部件尺度预算。
// https://colosseo.it/area/colosseo/
// https://www.mercatiditraiano.it/it/sede/area_archeologica/mercati_di_traiano
// https://whc.unesco.org/en/list/922
export const historicSpaceBatchNineDesigns: ArchitecturePrototype[] = [
  design("三层券廊连续席台椭圆竞技场", "三层真正开孔的外券廊环绕连续石席薄壳，放射承墙内另开环向通路，四条平场轴路接通沙场，八路看台阶和六段内楼梯分别连通高低层", completeAmphitheatre, "建筑", "欧式"),
  design("多层阶亭轴向长井", "长轴石阶穿过四座不同深度的多层阶亭，层层真孔和交错内阶使高低回廊互通，尽端圆井水面低于最下层行走面，侧岸与亭顶同高", steppedPavilionWell, "建筑", "异域"),
  design("三层半环市集后接高券厅", "山坡前的三层半环市集每层保留连续前廊与独立商室，两个端部内阶连通楼层，背面上街经真门接入更高的双跨交叉券大厅", hillsideMarket, "建筑", "欧式"),
];

function ellipse(rx: number, rz: number): [number, number][] { return Array.from({ length: 48 }, (_, i) => [Math.cos(i * Math.PI / 24) * rx, Math.sin(i * Math.PI / 24) * rz]); }
export function windowHole(center: number, bottom: number, width: number, height: number): [number, number][] {
  const radius = width / 2, spring = bottom + height - radius, hole: [number, number][] = [[center - radius, bottom], [center - radius, spring]];
  for (let i = 1; i <= 8; i++) { const a = Math.PI - i * Math.PI / 8; hole.push([center + Math.cos(a) * radius, spring + Math.sin(a) * radius]); }
  hole.push([center + radius, bottom]); return hole;
}
export function verticalPanel(name: string, outline: [number, number][], holes: [number, number][][], depth: number, position: Triple, yaw: number, color = stone): ModelPart {
  const value = polygon(name, color, outline, depth, [0, 0, 0], holes); value.rotation.x = -90; value.position.z = depth / 2;
  return turn([value], yaw, position)[0]!;
}
function facadePanel(a: [number, number], b: [number, number], floor: number): ModelPart {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]), width = length / 3 - 1.1, holes = [-1, 0, 1].map(i => windowHole(i * length / 3, .035, width, 7.4));
  return verticalPanel("三层外环券廊上具有完整边壁的真实拱孔立面", [[-length / 2, 0], [length / 2, 0], [length / 2, 8.5], [-length / 2, 8.5]], holes, .7, [(a[0] + b[0]) / 2, floor, (a[1] + b[1]) / 2], -Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI);
}
function seatingSector(start: number): ModelPart {
  const profile: [number, number][] = [[45, .62]];
  for (let row = 0; row < 36; row++) profile.push([45 + row * 43 / 36, .42 + (row + 1) * .7], [45 + (row + 1) * 43 / 36, .42 + (row + 1) * .7]);
  profile.push([88, 25.12]);
  const value = sweptProfile("连续阶席与下方斜承壳保留同一真实断面的整扇看台", stone, profile, 27 * Math.PI / 180, 4), angle = start * Math.PI / 180;
  for (const v of value.vertices!) {
    const radius = Math.hypot(v.x, v.z), x = v.x * Math.cos(angle) - v.z * Math.sin(angle), z = v.x * Math.sin(angle) + v.z * Math.cos(angle), t = (radius - 45) / 43;
    v.x = x; v.z = z * (29 + t * 40) / radius;
  }
  return value;
}
function radialSupport(angle: number): ModelPart {
  const a = angle * Math.PI / 180, start: [number, number] = [Math.cos(a) * 50, Math.sin(a) * 34], end: [number, number] = [Math.cos(a) * 89, Math.sin(a) * 70], length = Math.hypot(end[0] - start[0], end[1] - start[1]), holes = [windowHole(length * .4, .035, 4, 5.8), windowHole(length * .85, .035, 4, 6.5), windowHole(length * .85, 8.535, 4, 5), windowHole(length * .93, 17.035, 3.4, 5)];
  return verticalPanel("斜承席台并真实开孔让环廊连续通过的放射厚石墙", [[0, 0], [length, 0], [length, 25.2], [0, 3.2]], holes, .9, [start[0], .42, start[1]], -Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI, brick);
}
function amphitheatreFloor(name: string, innerRx: number, innerRz: number, y: number, stairsX: number): ModelPart {
  const holes = [ellipse(innerRx, innerRz)];
  for (const s of [-1, 1]) holes.push([[s * stairsX - .9, -7.2], [s * stairsX + .9, -7.2], [s * stairsX + .9, 7.2], [s * stairsX - .9, 7.2]]);
  return polygon(name, stone, ellipse(95, 77), .3, [0, y, 0], holes);
}
function completeAmphitheatre(): ModelPart[] {
  const p: ModelPart[] = [];
  for (const x of [-48.5, 48.5]) for (const z of [-41, 41]) p.push(box("完整大型竞技场分片承地基础", x, .09, z, 97, .18, 82, stone));
  p.push(part("椭圆竞技沙场完整地面", "cylinder", sand, [0, .37, 0], [86, .1, 54]), polygon("沙场外围与所有内廊共用的真正环状地坪", stone, ellipse(95, 77), .24, [0, .18, 0], [ellipse(43, 27)]), amphitheatreFloor("第一高环廊保留两处上楼真阶孔的连续石楼板", 78, 61, 8.62, 88.5), amphitheatreFloor("第二高环廊保留两处上楼真阶孔的连续石楼板", 87.5, 68.5, 17.12, 91), amphitheatreFloor("最高环廊接平看台且保留真阶孔的连续石楼板", 87.5, 68.5, 25.32, 88.5), polygon("三层券廊顶部与外壁相接的完整高护墙", stone, ellipse(95, 77), 4.5, [0, 25.92, 0], [ellipse(93.8, 75.8)]));
  for (let sector = 0; sector < 12; sector++) {
    const pieces: ModelPart[] = [];
    for (let panel = 0; panel < 2; panel++) {
      const angle = (sector * 30 + panel * 15 - 7.5) * Math.PI / 180, next = angle + Math.PI / 12, a: [number, number] = [Math.cos(angle) * 95, Math.sin(angle) * 77], b: [number, number] = [Math.cos(next) * 95, Math.sin(next) * 77];
      for (let level = 0; level < 3; level++) pieces.push(facadePanel(a, b, .42 + level * 8.5));
    }
    p.push(combineMeshes("保持三层全拱孔的外立面相邻两跨", stone, pieces), seatingSector(sector * 30 + 1.5), radialSupport(sector * 30 + 15));
    if (sector % 3 !== 0) {
      const a = sector * Math.PI / 6, dx = Math.cos(a) * 43, dz = Math.sin(a) * 40, length = Math.hypot(dx, dz);
      p.push(stairFlight("席台扇区之间真正逐级接平的放射看台石阶", 72, 1.2, 25.2, length / 72, 0, [Math.cos(a) * 45, .42, Math.sin(a) * 29], -Math.atan2(dz, dx) * 180 / Math.PI, true));
    }
  }
  for (const s of [-1, 1]) p.push(stairFlight("外围内廊从地面到第一高环廊的完整石楼梯", 36, 1.6, 8.5, .4, 0, [s * 88.5, .42, -7.2], -90, true), stairFlight("外围内廊折返接到第二高环廊的完整石楼梯", 36, 1.6, 8.5, .4, 0, [s * 91, 8.92, 7.2], 90, true), stairFlight("外围内廊再升到最高看台层的完整石楼梯", 36, 1.6, 8.2, .4, 0, [s * 88.5, 17.42, -7.2], -90, true));
  return p;
}

function wellPavilion(z: number, low: number, stories: number): ModelPart[] {
  const step = (15.18 - low) / stories, p: ModelPart[] = [box("各阶亭最低行走面下实际承地的厚石基", 0, (low - .35 + .18) / 2, z, 12, low - .53, 6, brick)];
  for (let level = 0; level < stories; level++) {
    const floor = low + level * step, height = step - .35, holes: [number, number][][] = [];
    if (level > 0) { const x = (level - 1) % 2 === 0 ? -4.4 : 4.4; holes.push([[x - .6, -2.2], [x + .6, -2.2], [x + .6, 2.2], [x - .6, 2.2]]); }
    p.push(polygon("多层阶亭真正保留升降孔的横跨石楼板", stone, [[-6, -3], [6, -3], [6, 3], [-6, 3]], .35, [0, floor - .35, z], holes));
    const openings: [number, number][][] = [-4, 0, 4].map(x => [[x - 1.5, .035], [x + 1.5, .035], [x + 1.5, height - .45], [x - 1.5, height - .45]]);
    for (const s of [-1, 1]) p.push(verticalPanel("阶亭四石墩与连续石梁共同形成的三路真开口", [[-6, 0], [6, 0], [6, height], [-6, height]], openings, .6, [0, floor, z + s * 2.6], 0));
    if (level < stories - 1) p.push(stairFlight("阶亭内部在上下层真阶孔间交错的实石楼梯", 18, 1, step, 4.4 / 18, 0, [level % 2 === 0 ? -4.4 : 4.4, floor, z + (level % 2 === 0 ? -2.2 : 2.2)], level % 2 === 0 ? -90 : 90, true));
  }
  p.push(box("每座阶亭与两侧高岸同高的完整石亭顶", 0, 15.005, z, 12.6, .35, 6.6));
  return p;
}
function steppedPavilionWell(): ModelPart[] {
  const p: ModelPart[] = [base(38, 100), box("长井入口前完整最高石铺台地", 0, 7.68, -44, 36, 15, 10, brick), box("圆井后方连接两侧岸体的完整高石壁", 0, 7.68, 43, 36, 15, 4, brick)];
  for (const s of [-1, 1]) p.push(box("轴向长井外侧从深井底升起的完整石岸体", s * 12, 7.68, -4, 12, 15, 90, brick));
  for (const [z, low, stories] of [[-27, 11.8, 1], [-8, 7.8, 2], [10, 4.2, 3], [25, 1.2, 4]]) p.push(...wellPavilion(z!, low!, stories!));
  for (const [z, end, low, high, count] of [[-30, -39, 11.8, 15.18, 16], [-11, -24, 7.8, 11.8, 18], [7, -5, 4.2, 7.8, 18], [22, 13, 1.2, 4.2, 15]]) p.push(stairFlight("沿长井主轴逐段准确接到阶亭面的完整石阶", count!, 4, high! - low!, (z! - end!) / count!, low! - .18, [0, .18, z!], 90));
  p.push(polygon("尽端圆井在行走面以下实际封水的完整井圈", stone, ellipse(5.5, 5.5), 1.02, [0, .18, 34], [ellipse(4.8, 4.8)]), halfRoundWall("尽端圆井上部朝阶亭真正开门的高厚井壁", 5.5, .7, 13.98, [0, 1.2, 34], 72, brick, 324 * Math.PI / 180), part("长井尽端低于所有行走面的独立静态水面", "cylinder", "#7e9da0", [0, .7, 34], [9.4, .03, 9.4], [0, 0, 0], { opacity: .72, roughness: .23 }), box("最下阶亭跨到圆井口的短实石平台", 0, 1.025, 29, 3, .35, 2));
  return p;
}

function marketFloor(y: number, stairsX = 0): ModelPart {
  const outline: [number, number][] = [];
  for (let i = 0; i <= 24; i++) outline.push([Math.cos(i * Math.PI / 24) * 34, Math.sin(i * Math.PI / 24) * 34]);
  for (let i = 24; i >= 0; i--) outline.push([Math.cos(i * Math.PI / 24) * 22, Math.sin(i * Math.PI / 24) * 22]);
  const holes: [number, number][][] = stairsX ? [-1, 1].map(s => [[s * stairsX - .6, 1], [s * stairsX + .6, 1], [s * stairsX + .6, 8.2], [s * stairsX - .6, 8.2]]) : [];
  return polygon("半环市集每层连续贯通且保留真实阶孔的石楼板", stone, outline, .3, [0, y - .3, 0], holes);
}
function marketOpening(radius: number, a: number, b: number, floor: number, doors: boolean): ModelPart {
  const start: [number, number] = [Math.cos(a) * radius, Math.sin(a) * radius], end: [number, number] = [Math.cos(b) * radius, Math.sin(b) * radius], length = Math.hypot(end[0] - start[0], end[1] - start[1]), openings = doors ? [windowHole(0, .035, 3, 3.7)] : [-1, 1].map(s => windowHole(s * length / 4, .035, 2.8, 3.8));
  return verticalPanel(doors ? "半环后铺各自朝前廊的独立拱门" : "半环前廊朝共同前庭的真实双拱孔", [[-length / 2, 0], [length / 2, 0], [length / 2, 4.3], [-length / 2, 4.3]], openings, .6, [(start[0] + end[0]) / 2, floor, (start[1] + end[1]) / 2], -Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI, brick);
}
function marketHallCap(position: Triple, yaw: number): ModelPart {
  const outline: [number, number][] = Array.from({ length: 11 }, (_, i) => { const x = -6 + i * 1.2; return [x, Math.sqrt(Math.max(0, 36 - x * x)) + (i > 0 && i < 10 ? .05 : 0)]; }), holes = [-3, 0, 3].map(x => windowHole(x, .8, 1.2, x === 0 ? 3.5 : 2.6));
  return verticalPanel("后高厅沿交叉券轮廓闭合且保留真高窗的端石壁", outline, holes, .65, position, yaw, brick);
}
function hillsideMarket(): ModelPart[] {
  const court: [number, number][] = Array.from({ length: 25 }, (_, i) => [Math.cos(i * Math.PI / 24) * 22, Math.sin(i * Math.PI / 24) * 22]), hill: [number, number][] = [[-40, 0], [-34, 0]];
  for (let i = 1; i <= 24; i++) hill.push([Math.cos(Math.PI - i * Math.PI / 24) * 34, Math.sin(i * Math.PI / 24) * 34]);
  hill.push([40, 0], [40, 62], [-40, 62]);
  const p: ModelPart[] = [box("半环市集与后厅整体承地基础", 0, .09, 14, 84, .18, 96), box("半环前方连接外街的完整低石铺台", 0, .3, -7, 76, .24, 14), polygon("三层半环所共同面向的完整半圆石庭", stone, court, .24, [0, .18, 0]), polygon("半环后壁以外真正托起后厅和上街的高岸体", brick, hill, 9.44, [0, .18, 0]), marketFloor(.42), marketFloor(5.02, 23.8), marketFloor(9.62, 29), marketFloor(14.22), halfRoundWall("半环市集在上街以下连续挡土的外后壁", 34, .8, 9.2, [0, .42, 0], 0, brick), halfRoundWall("上街门洞左方连续半环后壁", 34, .8, 4.3, [0, 9.62, 0], 0, brick, 87.5 * Math.PI / 180), halfRoundWall("上街门洞右方连续半环后壁", 34, .8, 4.3, [0, 9.62, 0], -92.5, brick, 87.5 * Math.PI / 180), halfRoundWall("从市集上层通向后厅的真门上方厚石壁", 34, .8, 1.3, [0, 12.62, 0], -87.5, brick, 5 * Math.PI / 180)];
  for (let bay = 0; bay < 8; bay++) {
    const a = bay * Math.PI / 8, b = (bay + 1) * Math.PI / 8, front: ModelPart[] = [], shops: ModelPart[] = [];
    for (let level = 0; level < 3; level++) { front.push(marketOpening(22, a, b, .42 + level * 4.6, false)); shops.push(marketOpening(26, a, b, .42 + level * 4.6, true)); }
    p.push(combineMeshes("保持三层全开孔的半环前廊整跨", brick, front), combineMeshes("保持三层各自门道的半环后铺整跨", brick, shops));
  }
  for (let i = 0; i <= 8; i++) {
    const angle = i * Math.PI / 8, value = box("后铺之间由低到高贯通三层的真实径向厚壁", Math.cos(angle) * 30, 7.17, Math.sin(angle) * 30, 8, 13.5, .6, brick); value.rotation.y = -angle * 180 / Math.PI; p.push(value);
  }
  for (const s of [-1, 1]) p.push(stairFlight("端部前廊从低层接到中层真孔的石楼梯", 20, 1, 4.6, .36, 0, [s * 23.8, .42, 1], -90, true), stairFlight("端部商室折返接到最高通廊真孔的石楼梯", 20, 1, 4.6, .36, 0, [s * 29, 5.02, 8.2], 90, true));
  p.push(box("市集后街与高券厅共用的连续高石地面", 0, 9.47, 46, 12, .3, 24), crossingVault([0, 17.62, 40], 6, 6), crossingVault([0, 17.62, 52], 6, 6));
  for (const z of [34, 58]) {
    p.push(verticalPanel("后高厅前后带真正中央大门的完整厚石下壁", [[-6, 0], [6, 0], [6, 8], [-6, 8]], [windowHole(0, .035, 3, 4)], .8, [0, 9.62, z], 0, brick), marketHallCap([0, 17.62, z], 0));
  }
  for (const s of [-1, 1]) {
    p.push(box("后高厅长边由地面实际升到券顶春线的厚壁", s * 6, 13.62, 46, .8, 8, 24, brick));
    for (const z of [40, 52]) p.push(marketHallCap([s * 6, 17.62, z], 90));
  }
  return p;
}
