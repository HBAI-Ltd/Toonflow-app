import { part, type ModelPart } from "../assetModelParts";
import { cup, piercedPanel } from "../masterObjects/parts";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { slopePanel } from "./vernacularWorldBatchOne";
import { box, design, rail, type ArchitecturePrototype } from "./structures";

const stone = "#b4b9aa", pale = "#c9c8b4", dark = "#687f77", timber = "#a48b64", soft = "#c9cdb8", ceramic = "#d0d3c3";
type Point = [number, number];
type Opening = [number, number, number];

function rectangle(x: number, y: number, width: number, height: number): Point[] {
  return [[x - width / 2, y], [x + width / 2, y], [x + width / 2, y + height], [x - width / 2, y + height]];
}

function wall(name: string, axis: "xy" | "yz", offset: number, outline: Point[], windows: Point[][] = [], depth = 0.18, color = pale): ModelPart {
  const value = piercedPanel(name, [0, 0, 0], outline, windows, depth, color);
  value.vertices = value.indices!.map(index => { const p = value.vertices![index]!; return axis === "xy" ? { x: p.x, y: p.z, z: offset + depth / 2 - p.y } : { x: offset + p.y - depth / 2, y: p.z, z: p.x }; });
  delete value.indices; return value;
}

function doorOutline(left: number, right: number, bottom: number, top: number, doors: Opening[]): Point[] {
  const outline: Point[] = [[left, bottom]];
  for (const [x, width, height] of [...doors].sort((a, b) => a[0] - b[0])) outline.push([x - width / 2, bottom], [x - width / 2, bottom + height], [x + width / 2, bottom + height], [x + width / 2, bottom]);
  outline.push([right, bottom], [right, top], [left, top]); return outline;
}

function floor(name: string, outline: Point[], holes: Point[][], bottom: number, depth: number, color: string): ModelPart {
  const value = piercedPanel(name, [0, bottom, 0], outline, holes, depth, color);
  value.vertices = value.indices!.map(index => ({ ...value.vertices![index]! })); delete value.indices; return value;
}

function stair(name: string, x: number, z: number, bottom: number, count: number, rise: number, run: number, width: number, color = dark): ModelPart {
  const outline: Point[] = [[z, bottom - 0.18], [z + count * run, bottom + count * rise - 0.18], [z + count * run, bottom + count * rise]];
  for (let index = count - 1; index >= 0; index--) { outline.push([z + index * run, bottom + (index + 1) * rise]); if (index) outline.push([z + index * run, bottom + index * rise]); }
  return wall(name, "yz", x, outline, [], width, color);
}

export const everydayHospitalitySpaceBatchEightDesigns: ArchitecturePrototype[] = [
  design("双湿池厅夹干脊上寝浴宿楼", "两侧各有真实下沉池腔的单层湿厅夹住封闭中央干脊，前更衣横厅与干脊共同承住T形上寝层；低侧坡盖保留池厅整跨净空并在上寝窗下收头，真实斜天窗照入池岸，两段内阶穿过实际楼板井接休憩层，寝室门和池厅前后通路各自独立", twinPoolSleepHouse, "建筑", "现代"),
];

function twinPoolSleepHouse(): ModelPart[] {
  const outside: Point[] = [[-12.5, -15.5], [12.5, -15.5], [12.5, 13], [-12.5, 13]], poolHoles = [-1, 1].map(side => rectangle(side * 7.9, -2.2, 6.2, 10.8));
  const upperOutline: Point[] = [[-12.5, -15.5], [12.5, -15.5], [12.5, -5], [4, -5], [4, 13], [-4, 13], [-4, -5], [-12.5, -5]], stairHole: Point[] = [[-10.8, -13.7], [-8.8, -13.7], [-8.8, -7.2], [-10.8, -7.2]];
  const parts: ModelPart[] = [box("完整浴宿楼池厅前更衣入口与后出口共同落地铺坪", 0, 0.1, -1, 28.2, 0.2, 36.6, stone), floor("两侧真实挖空下沉池腔并与更衣干脊连续齐平的厚地台", outside, poolHoles, 0.2, 0.9, stone), floor("前休憩横厅和中央六寝室共同构成T形且实际留出内梯井的完整上层板", upperOutline, [stairHole], 4.3, 0.2, timber), box("前休憩横厅上方由两层外墙与内承墙实际接住的完整平盖", 0, 7.6, -10.25, 25.4, 0.2, 10.8, dark), box("中央上寝干脊由侧承墙和分室墙实际支承的独立长平盖", 0, 7.6, 4, 8.35, 0.2, 18.4, dark)];
  const lining: SolidBox[] = [], partitions: SolidBox[] = [], furniture: SolidBox[] = [], bedding: SolidBox[] = [], fittings: SolidBox[] = [], frame: SolidBox[] = [], guards: SolidBox[] = [], glazing: SolidBox[] = [];
  const pane = (axis: "xy" | "yz", offset: number, x: number, bottom: number, width: number, height: number) => glazing.push({ center: axis === "xy" ? [x, bottom + height / 2, offset] : [offset, bottom + height / 2, x], size: axis === "xy" ? [width, height, 0.035] : [0.035, height, width] });
  const frontWindows = [-8, 8].map(x => rectangle(x, 2, 4.4, 1.35));
  parts.push(wall("临街更衣前厅与上休憩层真实分开采光并保留主门的完整前立面", "xy", -15.5, doorOutline(-12.5, 12.5, 1.1, 7.5, [[0, 2.6, 2.5]]), [...frontWindows, ...[-8, 0, 8].map(x => rectangle(x, 5.3, 4.4, 1.45))]), wall("更衣横厅向两侧湿池厅和中央干脊分别开门的完整后承壁", "xy", -5, doorOutline(-12.5, 12.5, 1.1, 4.3, [[-7.9, 1.5, 2.4], [0, 2, 2.4], [7.9, 1.5, 2.4]])), wall("上休憩横厅与中央寝廊相接并在低池厅屋盖上方完整封合的后壁", "xy", -5, doorOutline(-12.5, 12.5, 4.5, 7.5, [[0, 2.05, 2.3]])));
  for (const x of [-8, 8]) pane("xy", -15.5, x, 2, 4.4, 1.35);
  for (const x of [-8, 0, 8]) pane("xy", -15.5, x, 5.3, 4.4, 1.45);
  for (const side of [-1, 1]) {
    const x = side * 7.9;
    parts.push(box("各下沉池腔低于池岸的完整封水陶瓷底", x, 0.25, 3.2, 6.2, 0.1, 10.8, ceramic), part("池岸以下且真正位于空腔内的静态浴水面", "box", "#82a9a4", [x, 0.94, 3.2], [6.08, 0.025, 10.68], [0, 0, 0], { opacity: 0.62, roughness: 0.17 }));
    for (const edge of [-1, 1]) lining.push({ center: [x + edge * 3.07, 0.7, 3.2], size: [0.06, 0.8, 10.8] }, { center: [x, 0.7, 3.2 + edge * 5.37], size: [6.08, 0.8, 0.06] });
    for (let step = 0; step < 4; step++) lining.push({ center: [x, 0.3 + (0.8 - step * 0.2) / 2, -2.025 + step * 0.35], size: [1.3, 0.8 - step * 0.2, 0.35] });
    parts.push(wall("湿池厅外侧由地台接到低坡檐并实际开高窗的完整外墙", "yz", side * 12.5, [[-5, 1.1], [13, 1.1], [13, 4.2], [-5, 4.2]], [-1.5, 4, 9.5].map(z => rectangle(z, 2.4, 2.4, 1.2))), wall("前部更衣和上休憩两层各自实际开窗的完整侧立面", "yz", side * 12.5, [[-15.5, 1.1], [-5, 1.1], [-5, 7.5], [-15.5, 7.5]], [rectangle(-10.25, 2, 4.5, 1.35), rectangle(-10.25, 5.3, 4.5, 1.45)]), wall("中央首层干脊在两端真实开门接入湿池岸的完整隔湿侧承墙", "yz", side * 4, doorOutline(-5, 13, 1.1, 4.3, [[-3.5, 1.3, 2.3], [10.5, 1.3, 2.3]])), wall("上寝窗高出低池厅坡盖而真正朝外采光的完整干脊侧墙", "yz", side * 4, [[-5, 4.5], [13, 4.5], [13, 7.5], [-5, 7.5]], [-2, 4, 10].map(z => rectangle(z, 5.3, 2.8, 1.35))), wall("中央上寝层各独立房间实际开向公共窄廊的门壁", "yz", side * 1.05, doorOutline(-5, 13, 4.5, 7.5, [-3.5, 2.5, 8.5].map(z => [z, 1, 2.3] as Opening)), [], 0.12));
    for (const z of [-1.5, 4, 9.5]) pane("yz", side * 12.5, z, 2.4, 2.4, 1.2);
    pane("yz", side * 12.5, -10.25, 2, 4.5, 1.35); pane("yz", side * 12.5, -10.25, 5.3, 4.5, 1.45);
    for (const z of [-2, 4, 10]) pane("yz", side * 4, z, 5.3, 2.8, 1.35);
    const roofY = (rx: number) => 5 - (rx - 4) * 0.8 / 8.5;
    for (const [a, b, transparent] of [[3.95, 7, false], [7, 8, true], [8, 12.7, false]] as const) {
      const piece = slopePanel("低湿池厅真正开长条斜天窗并接到中央干脊下方的独立坡片", [[side * a, roofY(a), -5.15], [side * b, roofY(b), -5.15], [side * b, roofY(b), 13.15], [side * a, roofY(a), 13.15]], transparent ? 0.09 : 0.18, transparent ? "#9bbfb1" : dark);
      if (transparent) { piece.opacity = 0.28; piece.roughness = 0.2; } parts.push(piece);
    }
    for (const z of [-4.8, 4, 12.8]) parts.push(rail([side * 4, 4.85, z], [side * 12.5, 4.05, z], 0.22, dark));
    for (const rx of [7, 8]) parts.push(rail([side * rx, roofY(rx) - 0.02, -5.15], [side * rx, roofY(rx) - 0.02, 13.15], 0.08, dark));
    const backLeft = Math.min(side * 4, side * 12.5), backRight = Math.max(side * 4, side * 12.5), backOutline = doorOutline(backLeft, backRight, 1.1, 4.2, [[x, 1.2, 2.3]]);
    backOutline[backOutline.length - 2] = [backRight, side < 0 ? 5 : 4.2]; backOutline[backOutline.length - 1] = [backLeft, side < 0 ? 4.2 : 5];
    parts.push(wall("池厅后端真实让出后门并准确收合低斜屋盖的完整异形壁", "xy", 13, backOutline, [rectangle(x, 3.5, 2.2, 0.6)])); pane("xy", 13, x, 3.5, 2.2, 0.6);
    for (const z of [1, 7]) partitions.push({ center: [side * 2.525, 6, z], size: [2.95, 3, 0.12] });
    for (const z of [-0.3, 5.7, 11.7]) {
      furniture.push({ center: [side * 2.55, 4.7, z], size: [1.35, 0.4, 2.05] }, { center: [side * 2.55, 5.05, z + 1.04], size: [1.43, 1.1, 0.12] });
      bedding.push({ center: [side * 2.55, 4.97, z], size: [1.31, 0.14, 2.01] }, { center: [side * 2.55, 5.09, z + 0.78], size: [0.95, 0.1, 0.38] });
    }
    furniture.push({ center: [side * 5.5, 2.2, -12], size: [3.6, 2.2, 0.7] }, { center: [side * 5.5, 1.325, -8], size: [3.5, 0.45, 0.7] }, { center: [side * 5.5, 4.725, -10], size: [3.7, 0.45, 1.3] });
  }
  parts.push(wall("中央干脊下层后门与上层寝廊端窗实际独立开通的完整后墙", "xy", 13, doorOutline(-4, 4, 1.1, 7.5, [[0, 1.2, 2.3]]), [rectangle(0, 5.3, 1.5, 1.4)])); pane("xy", 13, 0, 5.3, 1.5, 1.4);
  parts.push(stair("更衣前厅侧内梯井中第一段真正连续承重的十级薄腰阶", -9.8, -13.6, 1.1, 10, 0.17, 0.32, 1.7), stair("同一真实楼板井中第二段接到上休憩层的十级薄腰阶", -9.8, -10.4, 2.8, 10, 0.17, 0.32, 1.7));
  for (const x of [-10.8, -8.8]) {
    for (const z of [-13.7, -10.4, -7.2]) guards.push({ center: [x, 5.025, z], size: [0.06, 1.05, 0.06] });
    for (const y of [5, 5.55]) guards.push({ center: [x, y, -10.45], size: [0.06, 0.06, 6.5] });
  }
  for (const y of [5, 5.55]) guards.push({ center: [-9.8, y, -13.7], size: [2, 0.06, 0.06] });
  for (const x of [-10.68, -8.92]) parts.push(rail([x, 2.13, -13.6], [x, 5.53, -7.2], 0.055, dark));
  parts.push(stair("临街场坪真正连续升到更衣厅高地台的五级宽入场阶", 0, -17.5, 0.2, 5, 0.18, 0.4, 3.4, stone));
  for (const x of [-7.9, 0, 7.9]) {
    const exit = stair("各自后门从高池岸和干脊实际下到后场的五级短阶", x, -15, 0.2, 5, 0.18, 0.4, 1.5, stone);
    exit.vertices = exit.vertices!.map(p => ({ x: p.x, y: p.y, z: -p.z }));
    for (let index = 0; index < exit.vertices.length; index += 3) [exit.vertices[index + 1], exit.vertices[index + 2]] = [exit.vertices[index + 2]!, exit.vertices[index + 1]!]; parts.push(exit);
  }
  for (const x of [-12.35, -7.4, 4.8, 12.35]) frame.push({ center: [x, 2.7, -5], size: [0.2, 3.2, 0.2] });
  frame.push({ center: [0, 4.25, -5], size: [25, 0.18, 0.24] });
  for (const x of [-12.35, -7.4, 4.8, 12.35]) frame.push({ center: [x, 2.7, -15.35], size: [0.2, 3.2, 0.2] });
  frame.push({ center: [0, 4.25, -15.35], size: [25, 0.18, 0.24] });
  furniture.push({ center: [2.9, 1.7, -13.2], size: [1.8, 1.2, 0.8] }, { center: [2.9, 2.35, -13.2], size: [1.9, 0.1, 0.9] }, { center: [2.6, 1.52, 0], size: [0.8, 0.84, 2.6] });
  for (const z of [-0.7, 0.7]) parts.push({ ...cup("中央干脊落地盥洗台上保留完整浅内腔的独立洗手盆", [2.6, 1.92, z], 0.3, 0.15, ceramic), scale: { x: 1, y: 1, z: 0.8 } });
  for (let start = 0; start < lining.length; start += 18) parts.push(boxesMesh("真实下沉池底上连续接合的完整内衬与分级入水实踏面", ceramic, lining.slice(start, start + 18)));
  parts.push(boxesMesh("中央上寝区各自从完整层板承到平屋盖的实分室墙", pale, partitions), boxesMesh("前更衣横厅上下连续且实际承起T形上层板的内柱和横梁", dark, frame), boxesMesh("内梯井周围真正留出高端到达口的独立护栏柱和横档", dark, guards));
  for (let start = 0; start < furniture.length; start += 18) parts.push(boxesMesh("各独立寝室真实落地床架和更衣休憩盥洗柜台", timber, furniture.slice(start, start + 18)));
  parts.push(boxesMesh("六寝室床板上分别实际贴合的薄软褥和枕", soft, bedding));
  for (let start = 0; start < glazing.length; start += 18) parts.push({ ...boxesMesh("上下分层及池厅实际窗孔中逐一嵌合的独立透明窗板", "#a0beb2", glazing.slice(start, start + 18)), opacity: 0.25, roughness: 0.2 });
  return parts;
}
