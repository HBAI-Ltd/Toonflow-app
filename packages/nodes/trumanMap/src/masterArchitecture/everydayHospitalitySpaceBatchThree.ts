import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { tapered } from "../masterNature/shared";
import { cup, piercedPanel } from "../masterObjects/parts";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";

const bark = "#856b4b", timber = "#a08760", wall = "#bdc0ab", roof = "#647e70", metal = "#566c68";
type Point = [number, number];

function wallSurface(name: string, axis: "xy" | "yz", offset: number, outline: Point[], holes: Point[][] = [], thickness = 0.16, color = wall): ModelPart {
  const value = piercedPanel(name, [0, 0, 0], outline, holes, thickness, color);
  value.vertices = value.indices!.map(index => { const point = value.vertices![index]!; return axis === "xy" ? { x: point.x, y: point.z, z: offset + thickness / 2 - point.y } : { x: offset + point.y - thickness / 2, y: point.z, z: point.x }; });
  delete value.indices;
  return value;
}

function opening(center: number, bottom: number, width: number, height: number): Point[] {
  return [[center - width / 2, bottom], [center + width / 2, bottom], [center + width / 2, bottom + height], [center - width / 2, bottom + height]];
}

function glassPane(axis: "xy" | "yz", offset: number, center: number, bottom: number, width: number, height: number): ModelPart {
  return part("树屋实木窗洞内独立接框的薄玻璃", "box", "#a2c4bb", axis === "xy" ? [center, bottom + height / 2, offset] : [offset, bottom + height / 2, center], axis === "xy" ? [width, height, 0.03] : [0.03, height, width], [0, 0, 0], { opacity: 0.28, roughness: 0.22 });
}

export const everydayHospitalitySpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("双树夹梁环台封室树屋客舍", "两棵分叉树干上的环抱节点、成对夹梁和膝撑实际承托穿双树孔的完整高平台，封闭卧室与套内湿室位于两树之间，外围观景廊保留绕树净路，长梯接入前栏口；树孔、房门、套内门和坡盖均有真实边界", twinTreeGuesthouse, "建筑", "现代"),
];

function twinTreeGuesthouse(): ModelPart[] {
  const trees: Point[] = [[-3.1, 1], [3.1, -1.2]], eave = 6.18 - 2 * 1.1 / 2.25;
  const parts: ModelPart[] = [tapered("从地面生起并穿过平台左树孔的完整承力树干", bark, [[-3.1, 0, 1], [-3.1, 3.2, 1], [-3.25, 6.3, 1.05], [-3.1, 9, 1.1]], [0.4, 0.3, 0.2, 0.08]), tapered("从地面生起并穿过平台右树孔的独立分叉树干", bark, [[3.1, 0, -1.2], [3.1, 3.4, -1.2], [3.25, 6.5, -1.35], [3.2, 8.8, -1.3]], [0.36, 0.28, 0.19, 0.07])];
  const branches: Triple[][] = [[[-3.2, 4.2, 1], [-4.8, 6.2, -0.4], [-5.4, 7.8, -0.7]], [[-3.25, 5, 1.03], [-4.8, 6.7, 2.5], [-5.1, 8.1, 2.8]], [[3.18, 4.4, -1.28], [4.6, 6.3, -3], [5.1, 7.8, -3.5]], [[3.24, 5.6, -1.32], [4.7, 7, 0.4], [5.2, 8.1, 0.8]]];
  for (const branch of branches) parts.push(tapered("从主干实际分出且在木屋侧面外展开的承冠树枝", bark, branch, [0.24, 0.16, 0.07]));
  const crowns: [Triple, Triple][] = [[[-3.25, 8.7, 1.2], [3.8, 2.3, 3.8]], [[-5.25, 8.2, -0.6], [3.2, 2.3, 3.2]], [[-5.05, 8.7, 2.6], [3.4, 2.2, 3.2]], [[3.3, 8.7, -1.4], [3.8, 2.4, 3.8]], [[5.2, 8.2, -3.4], [3, 2.2, 3]], [[5.2, 8.6, 0.8], [3.4, 2.2, 3.4]]];
  for (const [position, size] of crowns) parts.push(part("枝端实际进入且高于屋盖的分团树冠", "sphere", "#819468", position, size));
  for (const [x, z] of trees) for (const y of [1.4, 2.35]) parts.push(ring("内壁抱住真实树干而外侧承接夹梁膝撑的独立金属环座", metal, 0.45, 0.19, y, 0.24, { position: { x, y, z } }));
  for (const offset of [-0.3, 0.3]) parts.push(rail([-3.1, 2.35, 1 + offset], [3.1, 2.35, -1.2 + offset], 0.24, timber));
  for (const [x, z] of trees) for (const end of [-3.3, 3.3]) parts.push(rail([x, 1.4, z], [Math.sign(x) * 4, 2.45, end], 0.18, timber));
  const holes = trees.map(([x, z]) => Array.from({ length: 8 }, (_, index): Point => { const a = index * Math.PI / 4; return [x + Math.cos(a) * 0.5, z + Math.sin(a) * 0.5]; }));
  const deck = piercedPanel("围绕双树真实留孔且由夹梁膝撑承起的完整观景平台", [0, 2.45, 0], [[-4.5, -4], [4.5, -4], [4.5, 4.2], [-4.5, 4.2]], holes, 0.2, timber);
  deck.vertices = deck.indices!.map(index => ({ ...deck.vertices![index]! })); delete deck.indices; parts.push(deck);
  parts.push(part("两树之间封闭客舍完整厚双坡屋盖", "extrude", roof, [0, 0, 0.9], [1, 1, 1], [0, 0, 0], { depth: 5.2, profile: [{ x: -2.05, y: 5.25 }, { x: 0.2, y: 6.35 }, { x: 2.45, y: 5.25 }, { x: 2.45, y: 5.08 }, { x: 0.2, y: 6.18 }, { x: -2.05, y: 5.08 }] }));
  parts.push(wallSurface("由平台前廊真正进入卧室的带窗山墙", "xy", -1.4, [[-1.8, 2.65], [-0.5, 2.65], [-0.5, 4.85], [0.5, 4.85], [0.5, 2.65], [2.2, 2.65], [2.2, eave], [0.2, 6.18], [-1.8, eave]], [opening(-1.1, 3.45, 0.8, 1.2), opening(1.4, 3.45, 1, 1.2)]), glassPane("xy", -1.4, -1.1, 3.45, 0.8, 1.2), glassPane("xy", -1.4, 1.4, 3.45, 1, 1.2), wallSurface("树屋后卧区与湿室真实开窗并连续接承屋盖的完整山墙", "xy", 3.2, [[-1.8, 2.65], [2.2, 2.65], [2.2, eave], [0.2, 6.18], [-1.8, eave]], [opening(-0.7, 3.45, 1.6, 1.2), opening(1.45, 4.45, 0.8, 0.45)]), glassPane("xy", 3.2, -0.7, 3.45, 1.6, 1.2), glassPane("xy", 3.2, 1.45, 4.45, 0.8, 0.45));
  parts.push(wallSurface("卧室左侧与外围绕树廊实际分隔的独立开窗板壁", "yz", -1.8, [[-1.4, 2.65], [3.2, 2.65], [3.2, eave], [-1.4, eave]], [opening(0.5, 3.45, 2.4, 1.2)]), glassPane("yz", -1.8, 0.5, 3.45, 2.4, 1.2), wallSurface("树屋右侧床区与湿室各有真实窗孔的完整承檐壁", "yz", 2.2, [[-1.4, 2.65], [3.2, 2.65], [3.2, eave], [-1.4, eave]], [opening(0, 3.45, 1.5, 1.2), opening(2.4, 4.45, 0.8, 0.45)]), glassPane("yz", 2.2, 0, 3.45, 1.5, 1.2), glassPane("yz", 2.2, 2.4, 4.45, 0.8, 0.45));
  parts.push(wallSurface("紧凑套内湿室从床侧真实穿门进入的内壁", "yz", 0.9, [[1.4, 2.65], [1.9, 2.65], [1.9, 4.7], [2.65, 4.7], [2.65, 2.65], [3.2, 2.65], [3.2, 5.15], [1.4, 5.15]], [], 0.12), box("套内湿室与床前区之间完整封合的短隔壁", 1.55, 3.9, 1.4, 1.3, 2.5, 0.12, wall), box("湿室低隔壁实际接住而让开主坡盖的独立小吊顶", 1.55, 5.15, 2.3, 1.3, 0.1, 1.8, wall), cylinder("湿室内从平台房地面真正承起的坐便短座", 1.6, 2.85, 2.85, 0.32, 0.4, wall), { ...cup("坐便短座上保留开放内腔的独立瓷碗", [1.6, 3.02, 2.85], 0.2, 0.18, wall), scale: { x: 1, y: 1, z: 1.1 } }, box("湿室前端实际贴住房地面的浅洗手台柜", 1.65, 3.07, 1.72, 0.6, 0.84, 0.45, timber), { ...cup("湿室洗手柜上真正接合的开放浅盆", [1.65, 3.47, 1.72], 0.23, 0.13, wall), scale: { x: 1, y: 1, z: 0.8 } });
  parts.push(boxesMesh("卧室实际落在完整平台面上的双人床架和床头", timber, [{ center: [-0.65, 2.85, 1.2], size: [1.6, 0.4, 2.1] }, { center: [-0.65, 3.25, 2.2], size: [1.7, 1.2, 0.12] }]), box("实际贴合木床架的独立织物床垫", -0.65, 3.12, 1.2, 1.56, 0.14, 2.06, "#c8c9b6"), box("前门旁避开开门路线且真实落地的短行李柜", 1.45, 3.15, -0.65, 1, 1, 0.8, timber));
  const stair: Point[] = [[-8.48, 0], [-4, 2.47], [-4, 2.65]];
  for (let step = 15; step >= 0; step--) { stair.push([-8.48 + step * 0.28, (step + 1) * 2.65 / 16]); if (step) stair.push([-8.48 + step * 0.28, step * 2.65 / 16]); }
  parts.push(wallSurface("地面长梯以连续薄梯腰实接到平台前栏口的完整登楼阶", "yz", -3.1, stair, [], 1.5, timber));
  const posts: SolidBox[] = [], positions = new Set<string>();
  const addGuard = (start: Point, end: Point) => {
    for (const y of [3.15, 3.75]) parts.push(rail([start[0], y, start[1]], [end[0], y, end[1]], 0.055, metal));
    const count = Math.ceil(Math.hypot(end[0] - start[0], end[1] - start[1]) / 1.3);
    for (let step = 0; step <= count; step++) { const x = start[0] + (end[0] - start[0]) * step / count, z = start[1] + (end[1] - start[1]) * step / count, key = x.toFixed(4) + "," + z.toFixed(4); if (positions.has(key)) continue; positions.add(key); posts.push({ center: [x, 3.2, z], size: [0.055, 1.1, 0.055] }); }
  };
  for (const [start, end] of [[[-4.4, -3.9], [-3.95, -3.9]], [[-2.25, -3.9], [4.4, -3.9]], [[-4.4, -3.9], [-4.4, 4.1]], [[4.4, -3.9], [4.4, 4.1]], [[-4.4, 4.1], [4.4, 4.1]]] as [Point, Point][]) addGuard(start, end);
  for (const [x, z] of trees) {
    for (const y of [3.15, 3.75]) parts.push(ring("树孔四周真实绕开树干的独立环形防坠横栏", metal, 0.55, 0.035, y, 0.05, { position: { x, y, z } }));
    for (let step = 0; step < 4; step++) { const angle = step * Math.PI / 2; posts.push({ center: [x + Math.cos(angle) * 0.55, 3.2, z + Math.sin(angle) * 0.55], size: [0.045, 1.1, 0.045] }); }
  }
  for (const x of [-3.88, -2.32]) {
    parts.push(rail([x, 0.95, -8.48], [x, 3.6, -4], 0.055, metal));
    parts.push(rail([x, 3.6, -4], [x < -3.1 ? -3.95 : -2.25, 3.75, -3.9], 0.055, metal));
    for (const t of [0, 0.5, 1]) posts.push({ center: [x, t * 2.65 + 0.475, -8.48 + t * 4.48], size: [0.055, 0.95, 0.055] });
  }
  for (let start = 0; start < posts.length; start += 18) parts.push(boxesMesh("平台树孔及登楼长梯各自实际接到本踏面的独立护栏柱", metal, posts.slice(start, start + 18)));
  return parts;
}
