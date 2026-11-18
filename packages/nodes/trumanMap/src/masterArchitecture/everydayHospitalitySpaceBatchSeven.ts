import { type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { cup, piercedPanel } from "../masterObjects/parts";
import { clothPanel } from "../masterObjects/furnitureExpansionBatchNine";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";

const timber = "#a18a65", dark = "#60786e", canvas = "#b4baa0", pale = "#d0cdb5", stone = "#aeb4a6", soft = "#c4cbb4";
type Point = [number, number];

function wall(name: string, axis: "xy" | "yz", offset: number, outline: Point[], holes: Point[][] = [], depth = 0.05, color = pale): ModelPart {
  const value = piercedPanel(name, [0, 0, 0], outline, holes, depth, color);
  value.vertices = value.indices!.map(index => { const p = value.vertices![index]!; return axis === "xy" ? { x: p.x, y: p.z, z: offset + depth / 2 - p.y } : { x: offset + p.y - depth / 2, y: p.z, z: p.x }; });
  delete value.indices; return value;
}

function rectangle(x: number, y: number, width: number, height: number): Point[] {
  return [[x - width / 2, y], [x + width / 2, y], [x + width / 2, y + height], [x - width / 2, y + height]];
}

function ridgeHeight(z: number): number {
  const stations: Point[] = [[-6.25, 5.7], [-3.6, 4.95], [0, 4.55], [3.6, 4.8], [6.25, 5.3]];
  for (let index = 1; index < stations.length; index++) { const a = stations[index - 1]!, b = stations[index]!; if (z <= b[0]) return a[1] + (b[1] - a[1]) * (z - a[0]) / (b[0] - a[0]); }
  return stations[stations.length - 1]![1];
}

function gableOutline(z: number, doorX?: number, doorWidth = 1.2): Point[] {
  const outline: Point[] = [[-3, 0.7]];
  if (doorX !== undefined) outline.push([doorX - doorWidth / 2, 0.7], [doorX - doorWidth / 2, 2.85], [doorX + doorWidth / 2, 2.85], [doorX + doorWidth / 2, 0.7]);
  outline.push([3, 0.7], [3, 3], [0, ridgeHeight(z) - 0.25], [-3, 3]); return outline;
}

export const everydayHospitalitySpaceBatchSevenDesigns: ArchitecturePrototype[] = [
  design("双峰索脊侧撑整台帐宿", "两根外置端桅支起两端高而中间下凹的连续脊索，侧边落地撑杆与外锚索共同张住宽外雨篷；整片高木台上是有盖前廊和直壁封闭卧居，独立内帐顶由真实短吊带接到外脊，后湿室经真门进入，全部台梁桩脚和高低门路实际相接", doublePeakSafariLodge, "建筑", "现代"),
];

function doublePeakSafariLodge(): ModelPart[] {
  const mastHoles = [-6.25, 6.25].map(z => Array.from({ length: 8 }, (_, index): Point => [Math.cos(index * Math.PI / 4) * 0.125, z + Math.sin(index * Math.PI / 4) * 0.125]));
  const deck = piercedPanel("高木台真实给前后端桅留出贯穿孔而不是用实板填住桅脚", [0, 0.55, 0], [[-4.1, -6.55], [4.1, -6.55], [4.1, 6.55], [-4.1, 6.55]], mastHoles, 0.15, timber);
  deck.vertices = deck.indices!.map(index => ({ ...deck.vertices![index]! })); delete deck.indices;
  const parts: ModelPart[] = [box("固定帐宿平台登阶与全部锚脚共用的真实落地场地", 0, 0.1, 0, 12.2, 0.2, 18.4, stone), deck];
  const frame: SolidBox[] = [], furniture: SolidBox[] = [], bedding: SolidBox[] = [], guards: SolidBox[] = [], glazing: SolidBox[] = [], outerPanels: ModelPart[] = [], innerPanels: ModelPart[] = [];
  const stations = [-6.25, -3.6, 0, 3.6, 6.25];
  for (const x of [-3.9, 3.9]) {
    frame.push({ center: [x, 0.49, 0], size: [0.18, 0.18, 13.1] });
    for (const z of [-6, -3, 0, 3, 6]) frame.push({ center: [x, 0.315, z], size: [0.2, 0.23, 0.2] });
  }
  for (const z of [-6, -3, 0, 3, 6]) frame.push({ center: [0, 0.5, z], size: [8.05, 0.16, 0.16] });
  for (const z of [-6.25, 6.25]) {
    const top = ridgeHeight(z);
    parts.push(cylinder("独立端桅从共同地坪穿过真实木台孔并实际顶住高脊索", 0, (0.2 + top) / 2, z, 0.18, top - 0.2, dark));
    for (const side of [-1, 1]) {
      const end: Triple = [side * 1.25, 0.26, Math.sign(z) * 8.8];
      parts.push(rail([0, top, z], end, 0.025, dark));
      frame.push({ center: [end[0], 0.24, end[2]], size: [0.16, 0.28, 0.16] });
    }
  }
  for (let index = 1; index < stations.length; index++) parts.push(rail([0, ridgeHeight(stations[index - 1]!), stations[index - 1]!], [0, ridgeHeight(stations[index]!), stations[index]!], 0.04, dark));
  const outerPoint = (side: number, row: number, z: number): Triple => [side * row * 2, row === 0 ? ridgeHeight(z) : row === 1 ? (ridgeHeight(z) + 2.95) / 2 - 0.18 : 2.95, z];
  for (const side of [-1, 1]) {
    for (let station = 1; station < stations.length; station++) for (let row = 0; row < 2; row++) outerPanels.push(clothPanel("脊索向侧撑之间保留轻微垂度的独立厚雨布片", [outerPoint(side, row, stations[station - 1]!), outerPoint(side, row + 1, stations[station - 1]!), outerPoint(side, row + 1, stations[station]!), outerPoint(side, row, stations[station]!)], canvas, 0.035));
    for (const z of [-6.1, 0, 6.1]) {
      frame.push({ center: [side * 3.98, 1.815, z], size: [0.08, 2.23, 0.08] });
      parts.push(rail([side * 4, 2.95, z], [side * 5.75, 0.26, z + (z === 0 ? 0 : Math.sign(z) * 0.3)], 0.025, dark));
      frame.push({ center: [side * 5.75, 0.24, z + (z === 0 ? 0 : Math.sign(z) * 0.3)], size: [0.16, 0.28, 0.16] });
    }
    parts.push(rail([side * 4, 2.95, -6.25], [side * 4, 2.95, 6.25], 0.055, dark));
    const roomStations = [-3.6, 0, 3.6, 5.4];
    for (let index = 1; index < roomStations.length; index++) {
      const a = roomStations[index - 1]!, b = roomStations[index]!;
      innerPanels.push(clothPanel("独立内帐与外雨篷之间实际保留通气层的薄坡顶", [[0, ridgeHeight(a) - 0.25, a], [side * 3, 3, a], [side * 3, 3, b], [0, ridgeHeight(b) - 0.25, b]], pale, 0.025));
    }
    parts.push(wall("内帐直立侧壁真正留出独立采光网窗而不落成三角睡帐", "yz", side * 3, [[-3.6, 0.7], [5.4, 0.7], [5.4, 3], [-3.6, 3]], [rectangle(-1.5, 1.35, 1.6, 1.2), rectangle(3.9, 1.6, 1.25, 0.95)]));
    for (const [z, bottom, width, height] of [[-1.5, 1.35, 1.6, 1.2], [3.9, 1.6, 1.25, 0.95]]) glazing.push({ center: [side * 3, bottom! + height! / 2, z!], size: [0.018, height!, width!] });
  }
  for (const z of [-3.6, 0, 3.6, 5.4]) parts.push(rail([0, ridgeHeight(z), z], [0, ridgeHeight(z) - 0.27, z], 0.04, dark));
  parts.push(combineMeshes("端高双峰中央下凹且向两侧撑桅张开的完整外雨篷", canvas, outerPanels), combineMeshes("实际封合内帐房室且在外雨篷下保留通气层的独立内屋盖", pale, innerPanels), wall("有盖前廊进入独立卧居的真实高门和两侧网窗前帐面", "xy", -3.6, gableOutline(-3.6, 0), [-1.8, 1.8].map(x => rectangle(x, 1.3, 1.1, 1.25))), wall("后湿室完整封到内帐屋脊并保留独立高采光网窗的后帐面", "xy", 5.4, gableOutline(5.4), [rectangle(0, 3.35, 1.4, 0.85)]), wall("后部独立湿室真正开门并一直封到内帐顶的完整隔面", "xy", 2.6, gableOutline(2.6, 1.3, 0.9), [], 0.1));
  for (const x of [-1.8, 1.8]) glazing.push({ center: [x, 1.925, -3.6], size: [1.1, 1.25, 0.018] });
  glazing.push({ center: [0, 3.775, 5.4], size: [1.4, 0.85, 0.018] });
  furniture.push({ center: [-0.95, 0.9, 0.15], size: [1.6, 0.4, 2.1] }, { center: [-0.95, 1.25, 1.23], size: [1.68, 1.1, 0.12] }, { center: [-1.4, 0.925, -4.8], size: [1.4, 0.45, 0.65] }, { center: [1.4, 0.925, -4.8], size: [1.4, 0.45, 0.65] }, { center: [-1.7, 1.12, 3.3], size: [1.2, 0.84, 0.65] });
  bedding.push({ center: [-0.95, 1.17, 0.15], size: [1.56, 0.14, 2.06] }, { center: [-0.95, 1.29, 0.93], size: [1.1, 0.1, 0.4] });
  parts.push(cylinder("湿室内实际落在高木台面的独立坐便承座", 1.6, 0.9, 4.5, 0.38, 0.4, pale), { ...cup("坐便承座上开放内腔且有底的独立碗体", [1.6, 1.07, 4.5], 0.24, 0.18, pale), scale: { x: 1, y: 1, z: 1.25 } }, { ...cup("湿室落地盥洗浅柜上真正接合的洗手盆", [-1.7, 1.52, 3.3], 0.35, 0.14, pale), scale: { x: 1, y: 1, z: 0.8 } });
  for (let step = 0; step < 3; step++) parts.push(box("前桅侧面登台且高端直接接到连续木台的独立宽踏步", -2.3, 0.2 + (step + 1) * 0.5 / 6, -7.6 + step * 0.35 + (step === 2 ? 0.0875 : 0), 1.8, (step + 1) * 0.5 / 3, step === 2 ? 0.525 : 0.35, timber));
  for (const x of [-4, 4]) {
    for (const z of [-6.4, -3.7, 5.5, 6.4]) guards.push({ center: [x, 1.2, z], size: [0.055, 1, 0.055] });
    for (const [a, b] of [[-6.4, -3.7], [5.5, 6.4]]) for (const y of [1.2, 1.7]) guards.push({ center: [x, y, (a! + b!) / 2], size: [0.055, 0.055, b! - a!] });
  }
  for (let start = 0; start < frame.length; start += 18) parts.push(boxesMesh("高木台落地桩脚纵横底梁端锚脚和雨篷侧撑桅的实际结构", dark, frame.slice(start, start + 18)));
  parts.push(boxesMesh("前后木台外缘真实接到台面的护栏柱与横档", dark, guards), boxesMesh("独立卧居床架床头前廊双座及后湿室落地浅柜", timber, furniture), boxesMesh("室内完整床架上的独立薄褥和软枕", soft, bedding), { ...boxesMesh("侧窗前窗及后高窗中真实封边的透光网片", "#a5c4b6", glazing), opacity: 0.25, roughness: 0.8 });
  return parts;
}
