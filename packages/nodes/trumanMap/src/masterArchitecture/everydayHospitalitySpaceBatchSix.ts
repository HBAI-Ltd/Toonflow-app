import { part, type ModelPart, type Triple } from "../assetModelParts";
import { cup, piercedPanel } from "../masterObjects/parts";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";

const timber = "#a98a62", dark = "#637a72", pale = "#c8c5ae", stone = "#adb2a4", soft = "#c6cbb7";
type Point = [number, number];

function face(name: string, offset: number, outline: Point[], holes: Point[][] = [], depth = 0.12, color = timber): ModelPart {
  const value = piercedPanel(name, [0, 0, 0], outline, holes, depth, color);
  value.vertices = value.indices!.map(index => { const p = value.vertices![index]!; return { x: p.x, y: p.z, z: offset + depth / 2 - p.y }; });
  delete value.indices; return value;
}

function rectangle(x: number, y: number, width: number, height: number): Point[] {
  return [[x - width / 2, y], [x + width / 2, y], [x + width / 2, y + height], [x - width / 2, y + height]];
}

function ovalShell(name: string, z: number, length: number, outerX: number, outerY: number, innerX: number, innerY: number, color: string): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  const point = (a: number, rx: number, ry: number, end: number): Triple => [Math.cos(a) * rx, 2.8 + Math.sin(a) * ry, z + end * length / 2];
  const addQuad = (corners: Triple[], reverse = false) => { const start = vertices.length; for (const [x, y, z] of corners) vertices.push({ x, y, z }); indices.push(...(reverse ? [start, start + 2, start + 1, start, start + 3, start + 2] : [start, start + 1, start + 2, start, start + 2, start + 3])); };
  for (let index = 0; index < 24; index++) {
    const a = index * Math.PI / 12, b = (index + 1) * Math.PI / 12;
    addQuad([point(a, outerX, outerY, -1), point(b, outerX, outerY, -1), point(b, outerX, outerY, 1), point(a, outerX, outerY, 1)]);
    addQuad([point(a, innerX, innerY, -1), point(b, innerX, innerY, -1), point(b, innerX, innerY, 1), point(a, innerX, innerY, 1)], true);
    for (const end of [-1, 1]) addQuad([point(a, outerX, outerY, end), point(a, innerX, innerY, end), point(b, innerX, innerY, end), point(b, outerX, outerY, end)], end > 0);
  }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function endOutline(doorX?: number, doorWidth = 1.05): Point[] {
  const start = Math.asin((1.1 - 2.8) / 2.34), width = Math.cos(start) * 2.74;
  const outline: Point[] = [[-width, 1.1]];
  if (doorX !== undefined) outline.push([doorX - doorWidth / 2, 1.1], [doorX - doorWidth / 2, 3.25], [doorX + doorWidth / 2, 3.25], [doorX + doorWidth / 2, 1.1]);
  outline.push([width, 1.1]);
  for (let index = 1; index < 24; index++) { const a = start + index / 24 * (Math.PI - 2 * start); outline.push([Math.cos(a) * 2.74, 2.8 + Math.sin(a) * 2.34]); }
  return outline;
}

export const everydayHospitalitySpaceBatchSixDesigns: ArchitecturePrototype[] = [
  design("鞍座双箍全筒壳前廊客舍", "整圈椭圆筒壳连续构成屋顶侧壁和底弧，两座真实凹鞍与双金属箍圈共同承住壳体；水平内楼面切入下弧并由纵梁托住，前门窗面退在端口之后形成筒内有盖前廊，低外阶接入卧居空间，后独立湿室的真门和端窗与壳内边界准确闭合", saddleBarrelGuesthouse, "建筑", "现代"),
];

function saddleBarrelGuesthouse(): ModelPart[] {
  const parts: ModelPart[] = [box("双鞍桶壳与前登阶共同落在地面的完整铺坪", 0, 0.1, -0.65, 6.6, 0.2, 11.8, stone), ovalShell("前后通透而侧壁屋盖底弧连续相接的完整椭圆筒壳", 0, 9, 2.8, 2.4, 2.68, 2.28, timber), box("从前廊连续进入卧居与后湿室并切入下弧的完整水平内地板", 0, 1.025, -0.1, 3.64, 0.15, 8.8, timber)];
  const frame: SolidBox[] = [], furniture: SolidBox[] = [], bedding: SolidBox[] = [], glass: SolidBox[] = [], guards: SolidBox[] = [];
  for (const z of [-2.65, 2.65]) {
    const saddle: Point[] = [[-2.15, 0.2], [2.15, 0.2]];
    for (let index = 0; index <= 16; index++) { const x = 2.15 - index * 4.3 / 16; saddle.push([x, 2.86 - 2.4 * Math.sqrt(1 - (x / 2.8) ** 2)]); }
    parts.push(face("真实从铺坪托到桶壳底弧并嵌住箍圈的凹鞍座", z, saddle, [], 0.5, stone), ovalShell("完整围住桶壳并与凹鞍及底框实际接合的独立金属箍圈", z, 0.1, 2.86, 2.46, 2.775, 2.375, dark));
    frame.push({ center: [0, 1.0, z], size: [3.58, 0.16, 0.2] });
  }
  for (const x of [-1.62, 1.62]) frame.push({ center: [x, 0.97, -0.1], size: [0.16, 0.18, 8.8] });
  const frontWindows = [-1.4, 1.4].map(x => rectangle(x, 3.45, 0.9, 1.05));
  parts.push(face("从桶口退后形成有盖前廊且真实留出门窗的完整前端面", -3.1, endOutline(0), frontWindows, 0.12, pale), face("后湿室真正封合到椭圆筒壳且保留高采光窗的完整后端面", 4.25, endOutline(), [rectangle(0, 3.7, 1.3, 0.8)], 0.12, pale), face("卧居与后湿室之间保持门口及完整椭圆收头的实隔面", 2.1, endOutline(0.8, 0.85), [], 0.12, pale));
  for (const x of [-1.4, 1.4]) glass.push({ center: [x, 3.975, -3.1], size: [0.9, 1.05, 0.035] });
  glass.push({ center: [0, 4.1, 4.25], size: [1.3, 0.8, 0.035] });
  furniture.push({ center: [-0.35, 1.3, 0.15], size: [1.55, 0.4, 2.1] }, { center: [-0.35, 1.65, 1.23], size: [1.63, 1.1, 0.12] }, { center: [-1.22, 1.325, -2.2], size: [0.7, 0.45, 1.05] }, { center: [1.22, 1.325, -2.2], size: [0.7, 0.45, 1.05] }, { center: [-0.95, 1.52, 2.8], size: [0.65, 0.84, 0.7] });
  bedding.push({ center: [-0.35, 1.57, 0.15], size: [1.51, 0.14, 2.06] }, { center: [-0.35, 1.69, 0.93], size: [1.1, 0.1, 0.4] });
  parts.push(cylinder("后湿室实际落在水平内地板上的坐便承座", 0.62, 1.3, 3.55, 0.38, 0.4, pale), { ...cup("坐便承座上保留开放内腔的独立碗体", [0.62, 1.47, 3.55], 0.24, 0.18, pale), scale: { x: 1, y: 1, z: 1.25 } }, { ...cup("湿室落地浅柜上实际承接的开放洗手盆", [-0.95, 1.92, 2.8], 0.28, 0.14, pale), scale: { x: 1, y: 1, z: 0.9 } });
  const stair: Point[] = [[-6, 0.2], [-4.5, 0.2], [-4.5, 1.1]];
  for (let step = 3; step >= 0; step--) { stair.push([-6 + step * 0.375, 0.2 + (step + 1) * 0.225]); if (step) stair.push([-6 + step * 0.375, 0.2 + step * 0.225]); }
  const entrySteps = face("从公共铺坪连续登到筒内前廊地板的四级实体宽阶", 0, stair, [], 1.6, stone);
  entrySteps.vertices = entrySteps.vertices!.map(p => ({ x: p.z, y: p.y, z: p.x }));
  for (let index = 0; index < entrySteps.vertices.length; index += 3) [entrySteps.vertices[index + 1], entrySteps.vertices[index + 2]] = [entrySteps.vertices[index + 2]!, entrySteps.vertices[index + 1]!];
  parts.push(entrySteps);
  for (const side of [-1, 1]) {
    guards.push({ center: [side * 1.7, 1.575, -4.4], size: [0.055, 0.95, 0.055] }, { center: [side * 1.7, 1.575, -3.2], size: [0.055, 0.95, 0.055] });
    for (const y of [1.55, 2.05]) guards.push({ center: [side * 1.7, y, -3.8], size: [0.055, 0.055, 1.25] });
    parts.push(rail([side * 0.86, 1.2, -6], [side * 0.86, 2.1, -4.5], 0.055, dark));
    for (const t of [0, 1]) guards.push({ center: [side * 0.86, 0.2 + t * 0.9 + 0.5, -6 + t * 1.5], size: [0.055, 1, 0.055] });
  }
  parts.push(boxesMesh("水平内楼面下与筒壳及鞍座实际交叠的纵底梁和横枕", dark, frame), boxesMesh("前廊与短外阶扶手实际接在对应平台的独立立柱横档", dark, guards), boxesMesh("卧居床架床头前窗双座与湿室独立浅柜", timber, furniture), boxesMesh("完整床架上实际承睡的软垫和后枕", soft, bedding), { ...boxesMesh("前端真窗孔与后湿室高窗中独立嵌合的透明窗片", "#a2c5bb", glass), opacity: 0.28, roughness: 0.22 });
  return parts;
}
