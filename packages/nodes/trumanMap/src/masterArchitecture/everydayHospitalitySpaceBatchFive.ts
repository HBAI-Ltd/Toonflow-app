import { part, type ModelPart } from "../assetModelParts";
import { cup, piercedPanel } from "../masterObjects/parts";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";

const steel = "#617b77", panel = "#b8c2ad", timber = "#a08964", stone = "#afb4a7", soft = "#c8cab7";
type Point = [number, number];

function surface(name: string, axis: "xy" | "yz", offset: number, outline: Point[], holes: Point[][] = [], depth = 0.1, color = panel): ModelPart {
  const value = piercedPanel(name, [0, 0, 0], outline, holes, depth, color);
  value.vertices = value.indices!.map(index => { const p = value.vertices![index]!; return axis === "xy" ? { x: p.x, y: p.z, z: offset + depth / 2 - p.y } : { x: offset + p.y - depth / 2, y: p.z, z: p.x }; });
  delete value.indices; return value;
}

function rectangle(center: number, bottom: number, width: number, height: number): Point[] {
  return [[center - width / 2, bottom], [center + width / 2, bottom], [center + width / 2, bottom + height], [center - width / 2, bottom + height]];
}

function doorway(left: number, right: number, bottom: number, top: number, center: number, width: number, height: number): Point[] {
  return [[left, bottom], [center - width / 2, bottom], [center - width / 2, bottom + height], [center + width / 2, bottom + height], [center + width / 2, bottom], [right, bottom], [right, top], [left, top]];
}

export const everydayHospitalitySpaceBatchFiveDesigns: ArchitecturePrototype[] = [
  design("横叠箱房共享露台青年客舍", "下层三箱切去内长壁后合成一座接待备餐和公共湿室厅，保留的角柱端框通过真实转换梁支承两条横向上箱；上箱房门面对同一共享露台，侧外阶及实柱平台接入台面，端窗、门洞、上箱床位和公共湿室均有独立真实边界", transverseContainerLodge, "建筑", "现代"),
];

function transverseContainerLodge(): ModelPart[] {
  const base = piercedPanel("箱厅前后场地实际给整片箱内地板留出嵌入口的落地铺坪", [0, 0, 0], [[-6.15, -6.5], [4.45, -6.5], [4.45, 3.6], [-6.15, 3.6]], [[[-3.66, -3.03], [3.66, -3.03], [3.66, 3.03], [-3.66, 3.03]]], 0.2, stone);
  base.vertices = base.indices!.map(index => ({ ...base.vertices![index]! })); delete base.indices;
  const deck = piercedPanel("两横箱共享完整露台及侧登阶平台的连续高地板", [0, 3, 0], [[-4, -3.9], [4, -3.9], [4, 3.9], [-4, 3.9], [-4, 1.1], [-5.7, 1.1], [-5.7, -1.1], [-4, -1.1]], [], 0.1, steel);
  deck.vertices = deck.indices!.map(index => ({ ...deck.vertices![index]! })); delete deck.indices;
  const parts: ModelPart[] = [base, box("三箱切壁合厅后真正连续且与外铺坪齐平的完整底地板", 0, 0.1, 0, 7.32, 0.2, 6.06, timber), deck];
  const frames: SolidBox[] = [], glass: SolidBox[] = [], furniture: SolidBox[] = [], bedding: SolidBox[] = [], guards: SolidBox[] = [];
  const addPane = (axis: "xy" | "yz", offset: number, center: number, bottom: number, width: number, height: number) => glass.push({ center: axis === "xy" ? [center, bottom + height / 2, offset] : [offset, bottom + height / 2, center], size: axis === "xy" ? [width, height, 0.03] : [0.03, height, width] });
  for (const x of [-3.66, -1.22, 1.22, 3.66]) for (const z of [-3.03, 3.03]) frames.push({ center: [x, 1.46, z], size: [0.14, 2.52, 0.14] });
  for (const z of [-3.03, 3.03]) frames.push({ center: [0, 2.82, z], size: [8, 0.2, 0.22] });
  for (const x of [-3.03, 3.03]) frames.push({ center: [x, 2.92, 0], size: [0.2, 0.16, 7.8] });
  for (const z of [-1, 1]) frames.push({ center: [-5.55, 1.525, z], size: [0.16, 2.65, 0.16] }, { center: [-4.6, 2.95, z], size: [2.2, 0.2, 0.14] });
  parts.push(surface("三箱共享前壁真正让出接待主门和两侧采光窗", "xy", -3.03, doorway(-3.66, 3.66, 0.2, 3, 0, 1.4, 2.2), [-2.44, 2.44].map(x => rectangle(x, 1, 1.6, 1.25))));
  for (const x of [-2.44, 2.44]) addPane("xy", -3.03, x, 1, 1.6, 1.25);
  parts.push(surface("合厅后壁实际保留后门及备餐区和湿室的独立窗", "xy", 3.03, doorway(-3.66, 3.66, 0.2, 3, 0, 1, 2.2), [rectangle(-2.44, 1, 1.6, 1.25), rectangle(2.44, 1.95, 1.1, 0.6)])); addPane("xy", 3.03, -2.44, 1, 1.6, 1.25); addPane("xy", 3.03, 2.44, 1.95, 1.1, 0.6);
  for (const x of [-3.66, 3.66]) {
    parts.push(surface("下层合厅不保留内侧箱壁而仅在外边封合的真窗侧墙", "yz", x, [[-3.03, 0.2], [3.03, 0.2], [3.03, 3], [-3.03, 3]], [rectangle(-1.3, 1, 2.6, 1.3), rectangle(2, 1.95, 1.3, 0.6)])); addPane("yz", x, -1.3, 1, 2.6, 1.3); addPane("yz", x, 2, 1.95, 1.3, 0.6);
  }
  for (const side of [-1, 1]) {
    const z = side * 1.81, inner = side * 0.59, outer = side * 3.03;
    parts.push(box("各上箱独立角框与实壁共同接住的完整薄顶板", 0, 5.66, z, 6.22, 0.12, 2.56, steel), surface("两横箱各自真实开门面对共享中央露台的长侧壁", "xy", inner, doorway(-3.03, 3.03, 3.1, 5.6, 0, 0.9, 2.1)), surface("上箱外侧与两张横床对应的独立真实采光窗墙", "xy", outer, [[-3.03, 3.1], [3.03, 3.1], [3.03, 5.6], [-3.03, 5.6]], [-1.6, 1.6].map(x => rectangle(x, 4, 1.4, 1))));
    for (const x of [-1.6, 1.6]) addPane("xy", outer, x, 4, 1.4, 1);
    for (const x of [-3.03, 3.03]) {
      parts.push(surface("横箱两短端保持完整角柱接承并真实开窗的封壁", "yz", x, [[z - 1.22, 3.1], [z + 1.22, 3.1], [z + 1.22, 5.6], [z - 1.22, 5.6]], [rectangle(z, 3.9, 1.1, 1.2)])); addPane("yz", x, z, 3.9, 1.1, 1.2);
      for (const edge of [-1, 1]) frames.push({ center: [x, 4.36, z + edge * 1.22], size: [0.12, 2.72, 0.12] });
    }
    for (const x of [-1.6, 1.6]) {
      furniture.push({ center: [x, 3.3, z], size: [2.05, 0.4, 1.5] }, { center: [Math.sign(x) * 2.65, 3.7, z], size: [0.12, 1.2, 1.55] });
      bedding.push({ center: [x, 3.57, z], size: [2.01, 0.14, 1.46] }, { center: [Math.sign(x) * 2.3, 3.69, z], size: [0.4, 0.1, 1.05] });
    }
  }
  parts.push(surface("公共湿室从接待合厅真正独立进门的前隔壁", "xy", 0.8, doorway(1.4, 3.66, 0.2, 2.9, 2.5, 0.85, 2.1), [], 0.12), surface("公共湿室与备餐后过道实际分开的完整短侧壁", "yz", 1.4, [[0.8, 0.2], [3.03, 0.2], [3.03, 2.9], [0.8, 2.9]], [], 0.12), box("公共湿室低隔壁实际接到上方主楼板的短吊顶", 2.53, 2.95, 1.915, 2.26, 0.1, 2.23, panel), cylinder("公共湿室内从箱厅地板实际承起的坐便短座", 2.9, 0.4, 2.3, 0.38, 0.4, panel), { ...cup("公共坐便短座上真正保留开放内腔的独立碗体", [2.9, 0.57, 2.3], 0.24, 0.18, panel), scale: { x: 1, y: 1, z: 1.25 } }, box("公共湿室近门侧实际落地的浅洗手柜", 1.9, 0.62, 1.4, 0.65, 0.84, 0.6, timber), { ...cup("公共洗手柜上实际接合的开放浅盆", [1.9, 1.02, 1.4], 0.28, 0.14, panel), scale: { x: 1, y: 1, z: 0.9 } });
  furniture.push({ center: [-2.3, 0.75, -2], size: [1.7, 1.1, 0.7] }, { center: [-2.3, 1.35, -2], size: [1.8, 0.1, 0.8] }, { center: [-2.3, 0.7, 2.3], size: [2.4, 1, 0.8] }, { center: [-2.3, 1.24, 2.3], size: [2.5, 0.08, 0.85] }, { center: [2.5, 0.425, -1.1], size: [1.5, 0.45, 0.8] });
  const stair: Point[] = [[-5.9, 0.02], [-1.1, 2.92], [-1.1, 3.1]];
  for (let step = 15; step >= 0; step--) { stair.push([-5.9 + step * 0.3, 0.2 + (step + 1) * 2.9 / 16]); if (step) stair.push([-5.9 + step * 0.3, 0.2 + step * 2.9 / 16]); }
  parts.push(surface("外登阶从公共场地实际接上侧平台及共享露台的完整薄腰梯", "yz", -4.85, stair, [], 1.4, steel));
  const guardPositions = new Set<string>();
  const addGuard = (start: Point, end: Point) => {
    const dx = end[0] - start[0], dz = end[1] - start[1], count = Math.ceil(Math.hypot(dx, dz) / 1.3);
    for (const y of [3.6, 4.2]) guards.push({ center: [(start[0] + end[0]) / 2, y, (start[1] + end[1]) / 2], size: [Math.max(0.055, Math.abs(dx)), 0.055, Math.max(0.055, Math.abs(dz))] });
    for (let step = 0; step <= count; step++) { const x = start[0] + dx * step / count, z = start[1] + dz * step / count, key = x.toFixed(4) + "," + z.toFixed(4); if (guardPositions.has(key)) continue; guardPositions.add(key); guards.push({ center: [x, 3.65, z], size: [0.055, 1.1, 0.055] }); }
  };
  for (const [start, end] of [[[-3.95, -3.85], [3.95, -3.85]], [[3.95, -3.85], [3.95, 3.85]], [[3.95, 3.85], [-3.95, 3.85]], [[-3.95, -3.85], [-3.95, -0.65]], [[-3.95, 0.65], [-3.95, 3.85]], [[-5.65, -1.05], [-5.65, 1.05]], [[-5.65, 1.05], [-4.05, 1.05]]] as [Point, Point][]) addGuard(start, end);
  for (const x of [-5.58, -4.12]) {
    parts.push(rail([x, 1.25, -5.9], [x, 4.15, -1.1], 0.055, steel));
    for (const t of [0, 0.5, 1]) guards.push({ center: [x, 0.2 + t * 2.9 + 0.525, -5.9 + t * 4.8], size: [0.055, 1.05, 0.055] });
  }
  for (let start = 0; start < frames.length; start += 18) parts.push(boxesMesh("切壁合厅后实际承托上横箱与露台的角柱端框转换梁和侧平台支承", steel, frames.slice(start, start + 18)));
  for (let start = 0; start < guards.length; start += 18) parts.push(boxesMesh("共享露台和外登阶实际连接本踏面的完整护栏横档与独立立柱", steel, guards.slice(start, start + 18)));
  for (let start = 0; start < glass.length; start += 18) parts.push({ ...boxesMesh("各箱房和底厅真实窗孔内独立接合的透明窗片", "#a1c5bd", glass.slice(start, start + 18)), opacity: 0.28, roughness: 0.22 });
  parts.push(boxesMesh("各横箱完整落地床架床头与底层接待备餐座台", timber, furniture), boxesMesh("各上箱独立承睡床板上实际贴合的软垫与薄枕", soft, bedding));
  return parts;
}
