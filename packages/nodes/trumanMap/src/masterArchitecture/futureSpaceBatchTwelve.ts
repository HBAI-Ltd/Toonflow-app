import { part, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes, polygon } from "../masterNature/shared";
import { triangleShell } from "./futureSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { xYWall } from "./futureSpaceBatchTen";
import { base, box, colors, design, pipe, rail, type ArchitecturePrototype } from "./structures";

const steel = "#798c90", pale = "#b1b8ae", dark = "#47595f", stone = "#a3967e";

function spindleResidence(top: number): ModelPart[] {
  const outline: [number, number][] = [[-20, 0], [-14, -6], [14, -6], [20, 0], [14, 6], [-14, 6]], parts: ModelPart[] = [polygon("梭形寝翼完整水平居住层", steel, outline, 0.4, [0, top - 0.4, 0])];
  const wallTop = top + 5.6, left: Triple = [-14, top + 7.2, 0], right: Triple = [14, top + 7.2, 0], frontLeft: Triple = [-14, wallTop, -6], frontRight: Triple = [14, wallTop, -6], backLeft: Triple = [-14, wallTop, 6], backRight: Triple = [14, wallTop, 6], noseLeft: Triple = [-20, wallTop, 0], noseRight: Triple = [20, wallTop, 0];
  parts.push(combineMeshes("封合两端尖舱和中部高脊的完整梭形薄屋盖", pale, [triangleShell("梭形屋盖端片", noseLeft, backLeft, left, 0.2, pale), triangleShell("梭形屋盖端片", noseLeft, left, frontLeft, 0.2, pale), triangleShell("梭形屋盖长坡", frontLeft, left, right, 0.2, pale), triangleShell("梭形屋盖长坡", frontLeft, right, frontRight, 0.2, pale), triangleShell("梭形屋盖长坡", backLeft, backRight, right, 0.2, pale), triangleShell("梭形屋盖长坡", backLeft, right, left, 0.2, pale), triangleShell("梭形屋盖端片", noseRight, right, backRight, 0.2, pale), triangleShell("梭形屋盖端片", noseRight, frontRight, right, 0.2, pale)]));
  for (let edge = 0; edge < outline.length; edge++) {
    const a = outline[edge]!, b = outline[(edge + 1) % outline.length]!, dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
    if (edge === 1) {
      const profile = [{ x: -14, y: top }, { x: -14, y: wallTop }, { x: 14, y: wallTop }, { x: 14, y: top }, { x: 2, y: top }, { x: 2, y: top + 4.2 }, { x: -2, y: top + 4.2 }, { x: -2, y: top }];
      parts.push(part("朝向中央街且真实保留大门的寝翼长墙", "extrude", pale, [0, 0, -6], [1, 1, 1], [0, 0, 0], { profile, depth: 0.18 }));
    } else parts.push(part("梭形寝翼端面和背面连续透光薄墙", "box", colors.glass, [(a[0] + b[0]) / 2, top + 2.8, (a[1] + b[1]) / 2], [length, 5.6, 0.12], [0, -Math.atan2(dz, dx) * 180 / Math.PI, 0], { opacity: 0.3, roughness: 0.2 }));
  }
  for (const x of [-6, 6]) for (const side of [-1, 1]) parts.push(box("寝翼分房但让开中央门道的真实薄隔墙", x, top + 2.8, side * 3.8, 0.15, 5.6, 4.4, pale));
  return parts;
}

export const futureSpaceBatchTwelveDesigns: ArchitecturePrototype[] = [
  design("偏置倾鼓媒体总部", "完整倾斜大鼓筒横跨两对外撇支座，七层水平办公板按筒壳实际剖面逐层裁切，底层大门接到连续前梯，内部开孔升降井服务所有楼层", () => {
    const angle = 20 * Math.PI / 180, s = Math.sin(angle), c = Math.cos(angle), center = 29, radius = 22.5, inner = 21.95;
    const parts: ModelPart[] = [base(79, 67, 0.4), part("两端贯通的完整倾斜厚鼓筒", "lathe", steel, [0, center, 0], [1, 1, 1], [70, 0, 0], { profile: [{ x: 22.05, y: -12 }, { x: radius, y: -12 }, { x: radius, y: 12 }, { x: 22.05, y: 12 }, { x: 22.05, y: -12 }] })];
    for (const end of [-12, 12]) {
      const outline: [number, number][] = Array.from({ length: 24 }, (_, i) => { const a = i * Math.PI / 12; return [Math.cos(a) * radius, Math.sin(a) * radius]; });
      const holes: [number, number][][] = end < 0 ? [[[-3, -20.8], [3, -20.8], [3, -15.2], [-3, -15.2]], [[-15, -6], [-4, -6], [-4, 2], [-15, 2]], [[4, -6], [15, -6], [15, 2], [4, 2]], [[-12, 7], [12, 7], [12, 11.5], [-12, 11.5]]] : [[[-12, -9], [12, -9], [12, -6], [-12, -6]], [[-15, -1], [15, -1], [15, 2], [-15, 2]], [[-12, 7], [12, 7], [12, 10], [-12, 10]]];
      const cap = xYWall(end < 0 ? "低位大门及三面窗洞实际开通的倾鼓前壁" : "三条长窗真正开通的倾鼓后壁", outline, holes, 0, 0.3, pale);
      cap.vertices = cap.vertices!.map(p => ({ x: p.x, y: -p.z, z: p.y - 0.15 })); cap.position = { x: 0, y: center + end * s, z: end * c }; cap.rotation = { x: -20, y: 0, z: 0 }; parts.push(cap);
    }
    for (const top of [7.5, 14.5, 21.5, 28.5, 35.5, 42.5, 49.5]) {
      const low = Math.max(-11.8, (top - center - inner * c) / s), high = Math.min(11.8, (top - 0.4 - center + inner * c) / s), y = top - 0.2;
      const nodes = Array.from({ length: 17 }, (_, index) => { const z = low + (high - low) * index / 16, a = (top - center - z * s) / c, b = (top - 0.4 - center - z * s) / c; return { x: Math.sqrt(Math.max(0, inner ** 2 - Math.max(a * a, b * b))), z: z / c - (y - center) * Math.tan(angle) }; });
      const outline: [number, number][] = nodes.map(p => [p.x, p.z]); for (const p of nodes.slice().reverse()) if (p.x > 0.000001) outline.push([-p.x, p.z]);
      parts.push(polygon("按倾斜鼓筒真实剖面裁切的水平办公板", steel, outline, 0.4, [0, top - 0.4, 0], [[[-2.2, -2.2], [2.2, -2.2], [2.2, 2.2], [-2.2, 2.2]]]));
    }
    for (const side of [-1, 1]) for (const axial of [-8, 8]) {
      const localY = -Math.sqrt(radius ** 2 - 17 ** 2), tip: Triple = [side * 17, center + localY * c + axial * s, -localY * s + axial * c];
      parts.push(box("倾鼓外撇支座独立地脚", side * 26, 0.6, tip[2], 4, 0.4, 4, stone), rail([side * 26, 0.8, tip[2]], tip, 1.1, dark));
    }
    for (const x of [-2, 2]) for (const z of [-2, 2]) parts.push(box("鼓筒内部真正贯通各楼层的升降井细柱", x, 29.35, z, 0.2, 43.7, 0.2, dark));
    parts.push(...[-1, 1].map(side => box("内部升降井顶部连柱承索横梁", 0, 51.2, side * 2, 4.4, 0.3, 0.3, dark)), box("两承索横梁之间的独立吊梁", 0, 51.2, 0, 0.3, 0.3, 4.4, dark), box("鼓筒内部升降井最低层独立轿厢", 0, 7.3, 0, 4, 0.4, 4, dark), pipe("鼓筒内部升降井中央独立吊索", [0, 51.2, 0], [0, 7.49, 0], 0.055));
    const entryZ = -11.8 / c - (7.3 - center) * Math.tan(angle);
    for (let flight = 0; flight < 2; flight++) parts.push(stairFlight("倾鼓低位大门连续接入首层的实体前梯", [0, 0.4 + flight * 3.55, entryZ - 12 + flight * 6], 10, 0.355, 0.6, 5));
    parts.push(...[-1, 1].map(side => box("倾鼓前梯上跑下方独立落地支柱", side * 2, 2.175, entryZ - 3, 0.35, 3.55, 0.35, dark)));
    parts.push(box("穿过低位前壁大门的独立首层门槛", 0, 7.3, entryZ - 0.1, 5, 0.4, 0.6, steel));
    return parts;
  }, "建筑", "赛博朋克"),
  design("阶列双层梭舱住宅", "四条长梭形寝翼分别接入高低两段中央步行街，宽阶街把两层街面完整连接，后列寝翼由独立架柱托起而屋内分室保留中央通道", () => {
    const parts: ModelPart[] = [base(73, 99, 0.4), box("低层中央步行街完整落地地台", 0, 0.7, -25.5, 18, 0.6, 31, stone), box("上层中央步行街完整高架地台", 0, 7.3, 25.5, 18, 0.4, 31, steel)];
    for (const level of [0, 1]) for (const side of [-1, 1]) {
      const top = level ? 7.5 : 1, x = side * 15, z = level ? 21 : -21, yaw = side < 0 ? -90 : 90, angle = yaw * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle), cells = spindleResidence(top);
      if (!level) cells.push(polygon("下列梭形寝翼连续落地基台", stone, [[-20, 0], [-14, -6], [14, -6], [20, 0], [14, 6], [-14, 6]], 0.2, [0, 0.4, 0]));
      else for (const u of [-14, 14]) for (const v of [-6, 6]) cells.push(box("上列长寝翼下方完整落地支柱", u, 3.75, v, 0.55, 6.7, 0.55, dark));
      for (const cell of cells) { const u = cell.position.x, v = cell.position.z; cell.position.x = x + u * c + v * s; cell.position.z = z - u * s + v * c; cell.rotation.y += yaw; } parts.push(...cells);
    }
    for (const x of [-8, 8]) for (const z of [12, 39]) parts.push(box("后段高街下方独立落地重柱", x, 3.75, z, 0.55, 6.7, 0.55, dark));
    parts.push(box("宽阶街前段完整落地承载基台", 0, 0.7, -5, 18, 0.6, 10, stone), box("宽阶街后段完整落地承载基台", 0, 2.325, 5, 18, 3.85, 10, stone));
    for (let flight = 0; flight < 2; flight++) parts.push(stairFlight("连接高低两街面的完整宽阶街", [0, 1 + flight * 3.25, -10 + flight * 10], 10, 0.325, 1, 18));
    parts.push(stairFlight("梭舱住宅正面实际接入下街的两级短梯", [0, 0.4, -42.6], 2, 0.3, 0.8, 8));
    return parts;
  }, "建筑", "科幻"),
];
