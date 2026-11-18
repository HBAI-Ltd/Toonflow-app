import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { triangleShell } from "./futureSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { base, box, colors, design, pipe, rail, type ArchitecturePrototype } from "./structures";

const steel = "#788a8c", pale = "#b0b7ad", dark = "#46585e", stone = "#a2957d", warm = "#a1886b";

export function xYWall(name: string, outline: [number, number][], holes: [number, number][][], z: number, thickness: number, color: string): ModelPart {
  const value = polygon(name, color, outline.map(([x, y]) => [x, -y]), thickness, [0, 0, z - thickness / 2], holes.map(loop => loop.map(([x, y]) => [x, -y]))); value.rotation.x = 90; return value;
}

export const futureSpaceBatchTenDesigns: ArchitecturePrototype[] = [
  design("斜框悬箱双层办公楼", "前后两片倾斜大开孔框墙包住两条水平箱楼，上部厚框梁以分离吊杆悬托箱体，外置升降井通过折角短廊接进实际侧门", () => {
    const frame: [number, number][] = [[-28, 0.5], [18, 0.5], [31, 43], [-15, 43]], opening: [number, number][] = [[-19, 7], [12, 7], [21, 36], [-10, 36]];
    const parts: ModelPart[] = [base(79, 61, 0.5), ...[-1, 1].map(side => xYWall("通高中空孔真正贯通的倾斜巨框墙", frame, [opening], side * 13, 0.8, dark))];
    for (let level = 0; level < 2; level++) {
      const x = level * 6, y = 12 + level * 15;
      const profile = [[-22.5, 0], [-22.5, 7.4], [22.5, 7.4], [22.5, 0], [-13, 0], [-13, 4], [-17, 4], [-17, 0]].map(([x, y]) => ({ x: x!, y: y! }));
      parts.push(box("悬箱办公楼完整水平底板", x, y, 0, 45, 0.5, 26, steel), box("悬箱办公楼独立平顶", x, y + 7.6, 0, 45.6, 0.3, 26.6, pale), part("正面侧门真实贯通的悬箱薄围护", "extrude", pale, [x, y + 0.25, -13], [1, 1, 1], [0, 0, 0], { profile, depth: 0.18 }), part("悬箱后部连续透光薄墙", "box", colors.glass, [x, y + 3.95, 13], [45, 7.4, 0.12], [0, 0, 0], { opacity: 0.28, roughness: 0.2 }), ...[-1, 1].map(side => part("悬箱两端透光薄墙", "box", colors.glass, [x + side * 22.5, y + 3.95, 0], [0.12, 7.4, 26], [0, 0, 0], { opacity: 0.28, roughness: 0.2 })));
      for (const localX of [-5, 10]) for (const side of [-1, 1]) parts.push(box("悬箱内保留中央走道的分室薄墙", x + localX, y + 3.95, side * 7.4, 0.15, 7.4, 11.2, warm));
      const doorX = x - 15;
      parts.push(box("外井接到门前转角的横向悬廊", (-24.4 + doorX) / 2, y, -18, doorX + 24.4, 0.5, 3, steel), box("悬廊转角实际接入正面门口的短桥", doorX, y, -15.3, 3, 0.5, 8, steel));
      for (const rodX of level ? [0, 22] : [-8, 18]) for (const side of [-1, 1]) parts.push(pipe("巨框顶梁独立悬下的承箱吊杆", [rodX, 38, side * 13], [rodX, y, side * 13], 0.13));
    }
    for (const x of [-1.6, 1.6]) for (const z of [-1.6, 1.6]) parts.push(box("倾框楼外置升降井四角贯通细柱", -26 + x, 21.75, -18 + z, 0.2, 42.5, 0.2, dark));
    parts.push(box("外置升降井背侧完整薄围护", -27.6, 21.75, -18, 0.2, 42.5, 3.2, pale), box("倾框楼升降井底部独立轿厢", -26, 0.7, -18, 3.2, 0.4, 3.2, dark), pipe("倾框楼外置升降井内的独立吊索", [-26, 42.8, -18], [-26, 0.89, -18], 0.05), box("倾框楼升降井四角柱共同接住吊索的完整顶盖", -26, 42.9, -18, 4, 0.2, 4, dark));
    return parts;
  }, "建筑", "赛博朋克"),
  design("互承冠梁天光学院", "六根深长斜梁在中央相互搭接并围住天光孔，六边外壳内的双层学习廊绕庭布置，两侧双段实体阶梯穿过上层实际楼板孔", () => {
    const hex = (r: number): [number, number][] => Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3; return [Math.cos(a) * r, Math.sin(a) * r]; });
    const stairHoles: [number, number][][] = [-1, 1].map(side => [[side * 18 - 1.9, -12.5], [side * 18 + 1.9, -12.5], [side * 18 + 1.9, 2], [side * 18 - 1.9, 2]]);
    const profile = [{ x: 9, y: 21.65 }, { x: 31, y: 11.65 }, { x: 31, y: 12 }, { x: 9, y: 22 }, { x: 9, y: 21.65 }];
    const parts: ModelPart[] = [base(73, 67, 0.5), polygon("学院完整六边底层学习地坪", stone, hex(31), 0.5, [0, 0.7, 0]), polygon("中央天光庭及两楼梯井真实贯通的二层", steel, hex(29), 0.4, [0, 6.4, 0], [hex(12), ...stairHoles]), part("围住中央天光孔的六梁环伞薄屋盖", "lathe", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile }), ring("梁端共同搭接的中央稳定压环", dark, 10, 1, 21.2, 1.6)];
    const endT = 1.077350269;
    for (let side = 0; side < 6; side++) {
      const a = side * Math.PI / 3, c = Math.cos(a), s = Math.sin(a), qx = 30 - 30 * endT, qz = 8 * endT, endX = qx * c - qz * s, endZ = qx * s + qz * c;
      const start: Triple = [c * 30, 10.8, s * 30], end: Triple = [endX, 20.8, endZ], dx = endX - start[0], dz = endZ - start[2], dy = end[1] - start[1];
      parts.push(box("互承冠梁外侧独立落地重柱", c * 30, 6.05, s * 30, 0.55, 11.1, 0.55, dark), part("内端逐根搭接的完整深截面互承梁", "box", steel, [(start[0] + endX) / 2, 15.8, (start[2] + endZ) / 2], [Math.hypot(dx, dy, dz), 2.8, 1.1], [0, -Math.atan2(dz, dx) * 180 / Math.PI, Math.atan2(dy, Math.hypot(dx, dz)) * 180 / Math.PI]));
      const angle = a + Math.PI / 6, radius = 31 * Math.cos(Math.PI / 6), wallProfile = [{ x: -15.5, y: 1.2 }];
      for (const u of [-15.5, -7.75, 0, 7.75, 15.5]) wallProfile.push({ x: u, y: 12 + (31 - Math.hypot(radius, u)) * 10 / 22 - 0.35 });
      wallProfile.push({ x: 15.5, y: 1.2 }); if (side === 4) wallProfile.push({ x: 3, y: 1.2 }, { x: 3, y: 5 }, { x: -3, y: 5 }, { x: -3, y: 1.2 });
      parts.push(part("贴合高低屋缘且入口保持开通的六边薄窗墙", "extrude", colors.glass, [Math.cos(angle) * radius, 0, Math.sin(angle) * radius], [1, 1, 1], [0, -(angle + Math.PI / 2) * 180 / Math.PI, 0], { profile: wallProfile, depth: 0.12, opacity: 0.28, roughness: 0.2 }));
      if (side !== 0 && side !== 3 && side !== 4) parts.push(part("二层学习廊独立径向短隔屏", "box", warm, [c * 19.5, 8.8, s * 19.5], [7, 4, 0.15], [0, -side * 60, 0]));
    }
    for (const x of [-18, 18]) for (let flight = 0; flight < 2; flight++) parts.push(stairFlight("学院上下层连续相接的穿孔实体阶梯", [x, 1.2 + flight * 2.8, -12 + flight * 7], 10, 0.28, 0.7, 3.2));
    parts.push(stairFlight("正门外接入底层学习地坪的实体短梯", [0, 0.5, -28.95], 2, 0.35, 1.05, 6));
    return parts;
  }, "建筑", "科幻"),
  design("反向倾墙庭院旅馆", "左右居住翼的外墙沿高度向相反方向偏出，层板宽度随倾墙展开，中央长庭保持贯通而交错短桥在每层真实门口之间跨接", () => {
    const parts: ModelPart[] = [base(85, 65, 0.4)];
    for (const side of [-1, 1]) {
      const doors: [number, number][][] = [];
      for (let level = 0; level < 5; level++) {
        const y = 0.8 + level * 6, edge = 27 + y * 0.22, a = side < 0 ? -edge : 9, b = side < 0 ? -9 : edge, shaftX = side * 15;
        const shaft: [number, number][] = [[shaftX - 1.8, -1.8], [shaftX + 1.8, -1.8], [shaftX + 1.8, 1.8], [shaftX - 1.8, 1.8]];
        parts.push(polygon("实际随倾墙展开并保留升降孔的旅馆层板", steel, [[a, -23], [b, -23], [b, 23], [a, 23]], 0.4, [0, y - 0.2, 0], [shaft]), box("房翼内侧让开连续走道的分室短壁", side * (12 + edge) / 2, y + 3, 8, edge - 12, 5.6, 0.16, warm));
        for (const z of [-16, 16]) doors.push([[y + 0.2, z - 1.5], [y + 4.1, z - 1.5], [y + 4.1, z + 1.5], [y + 0.2, z + 1.5]]);
      }
      const inner = polygon("与各层短桥一一对齐开门的内庭薄墙", pale, [[0.4, -23], [31, -23], [31, 23], [0.4, 23]], 0.2, [side * 9 + 0.1, 0, 0], doors); inner.rotation.z = 90; parts.push(inner);
      const topX = side * (27 + 31 * 0.22);
      const outerA = triangleShell("向外偏出的完整倾斜玻璃外墙", [side * 27, 0.4, -23], [topX, 31, -23], [topX, 31, 23], 0.12, colors.glass), outerB = triangleShell("向外偏出的完整倾斜玻璃外墙", [side * 27, 0.4, -23], [topX, 31, 23], [side * 27, 0.4, 23], 0.12, colors.glass); outerA.opacity = 0.3; outerB.opacity = 0.3; parts.push(outerA, outerB);
      for (const z of [-23, 23]) {
        const a = triangleShell("旅馆房翼端面完整透光围护", [side * 9, 0.4, z], [side * 27, 0.4, z], [topX, 31, z], 0.12, colors.glass), b = triangleShell("旅馆房翼端面完整透光围护", [side * 9, 0.4, z], [topX, 31, z], [side * 9, 31, z], 0.12, colors.glass); a.opacity = 0.3; b.opacity = 0.3; parts.push(a, b, rail([side * 27, 0.4, z], [topX, 31, z], 0.5, dark), box("旅馆中庭侧贯通直立重柱", side * 9, 15.7, z, 0.45, 30.6, 0.45, dark));
      }
      parts.push(box("随倾斜外缘展开的完整房翼屋盖", side * (9 + Math.abs(topX)) / 2, 31.15, 0, Math.abs(topX) - 9 + 0.7, 0.3, 47, pale));
      for (const x of [-1.8, 1.8]) for (const z of [-1.8, 1.8]) parts.push(box("旅馆分翼升降井贯通细柱", side * 15 + x, 15.7, z, 0.15, 30.6, 0.15, dark));
      parts.push(box("旅馆分翼升降井底部独立轿厢", side * 15, 0.8, 0, 3.4, 0.4, 3.4, steel), pipe("旅馆分翼升降井内的独立吊索", [side * 15, 30.95, 0], [side * 15, 0.99, 0], 0.05), box("旅馆分翼升降井顶端承索梁实际接回四角柱", side * 15, 30.95, 0, 4, 0.1, 4, dark));
      for (const z of [-16, 16]) { const stairs = stairFlight("内庭进入底层房翼的真实两级踏步", [side * 7.4, 0.4, z], 2, 0.3, 0.8, 2.8); stairs.rotation.y = side > 0 ? 0 : 180; parts.push(stairs); }
    }
    for (let level = 1; level < 5; level++) {
      const y = 0.8 + level * 6, z = level % 2 ? -16 : 16;
      parts.push(box("左右倾斜房翼之间交错跨接的短桥", 0, y, z, 18.4, 0.4, 2.8, steel), ...[-1, 1].map(s => part("内庭短桥两侧与桥板连成整体的低护壁", "box", colors.glass, [0, y + 0.8, z + s * 1.3], [17.6, 1.2, 0.08], [0, 0, 0], { opacity: 0.32, roughness: 0.2 })));
    }
    return parts;
  }, "建筑", "赛博朋克"),
  design("剖角菱台开放商厦", "菱台楼体在前侧切出一直通向屋顶的长街口，四段长坡在同一条空街内交替上行，端部落脚平台同时接向两侧完整商业层", () => {
    const outline: [number, number][] = [[-34, 0], [-6.8, -20], [-4, -20], [-4, 19], [4, 19], [4, -20], [6.8, -20], [34, 0], [0, 25]];
    const parts: ModelPart[] = [base(83, 67, 0.4)];
    for (let level = 0; level < 5; level++) {
      const y = 0.8 + level * 6;
      parts.push(polygon("前侧长街口贯穿的完整菱台商业层", steel, outline, 0.4, [0, y - 0.2, 0]), ...[-1, 1].map(side => box("空街两侧与楼板实际相接的连续低护壁", side * 4, y + 0.7, -0.5, 0.12, 1, 33, pale)), box("长坡端部接向两商业翼的完整落脚台", 0, y, level % 2 ? 18.5 : -19, level % 2 ? 8 : 14, 0.4, level % 2 ? 4 : 3, steel));
    }
    const slope = Math.atan2(6, 36) * 180 / Math.PI;
    for (let flight = 0; flight < 4; flight++) parts.push(part("沿空街交替上行且让开各层板的完整长坡", "box", warm, [flight % 2 ? 2.1 : -2.1, 3.85 + flight * 6, -1], [3.5, 0.3, Math.hypot(36, 6)], [flight % 2 ? slope : -slope, 0, 0]));
    parts.push(polygon("保留同一通高街口的完整菱台屋盖", pale, outline, 0.35, [0, 30.9, 0]));
    const edges: [Triple, Triple][] = [[[-34, 0.4, 0], [-6.8, 0.4, -20]], [[6.8, 0.4, -20], [34, 0.4, 0]], [[34, 0.4, 0], [0, 0.4, 25]], [[0, 0.4, 25], [-34, 0.4, 0]]];
    for (const [a, b] of edges) { const c: Triple = [b[0], 31, b[2]], d: Triple = [a[0], 31, a[2]], wallA = triangleShell("菱台外周完整高位透光薄围护", a, b, c, 0.12, colors.glass), wallB = triangleShell("菱台外周完整高位透光薄围护", a, c, d, 0.12, colors.glass); wallA.opacity = 0.3; wallB.opacity = 0.3; parts.push(wallA, wallB); }
    for (const [x, z] of [[-34, 0], [34, 0], [0, 25], [-6.8, -20], [6.8, -20], [-4, 19], [4, 19]]) parts.push(box("菱台外角和街尾贯通承重细柱", x!, 15.7, z!, 0.4, 30.6, 0.4, dark));
    parts.push(stairFlight("长街正面实际接入首层落脚台的实体短梯", [0, 0.4, -22.1], 2, 0.3, 0.8, 5));
    return parts;
  }, "建筑", "赛博朋克"),
];
