import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { stairFlight } from "./futureSpaceBatchSix";
import { xYWall } from "./futureSpaceBatchTen";
import { base, box, colors, design, pipe, rail, type ArchitecturePrototype } from "./structures";

const steel = "#788b8e", pale = "#afb7ad", dark = "#46595f", stone = "#a3977f";

export const futureSpaceBatchFourteenDesigns: ArchitecturePrototype[] = [
  design("斜缝空腹楔塔办公楼", "楔形全楼被一条向上偏移的通高街缝切成错高双翼，层板按街缝和斜屋顶真实裁切，分层短桥接向高翼升降井，地面街口前后贯通", () => {
    const roofY = (x: number) => 30.9 + x * 0.7, gap = 3.8, leftBase = -15 - gap, rightBase = -15 + gap, leftTop = (30.9 + leftBase * 0.7) / 0.65, rightTop = (30.9 + rightBase * 0.7) / 0.65, leftX = leftBase + leftTop * 0.5, rightX = rightBase + rightTop * 0.5;
    const shaft: [number, number][] = [[22.8, -1.4], [25.6, -1.4], [25.6, 1.4], [22.8, 1.4]], parts: ModelPart[] = [base(75, 63, 0.5)];
    for (let level = 0; level < 7; level++) {
      const y = 0.8 + level * 7, minimum = Math.max(-27, (y + 3.2 - 30.9) / 0.7), center = -15 + y * 0.5, a = center - 3.9, b = center + 3.9;
      if (a - minimum >= 3) parts.push(polygon("左楔翼沿街缝与斜屋顶真实裁切的水平楼板", steel, [[minimum, -18], [a, -18], [a, 18], [minimum, 18]], 0.4, [0, y - 0.2, 0]));
      const x = Math.max(minimum, b); parts.push(polygon("高楔翼逐层裁切并保留独立升降孔的办公板", steel, [[x, -18], [27, -18], [27, 18], [x, 18]], 0.4, [0, y - 0.2, 0], [shaft]));
      if (level === 1 || level === 2) {
        const z = level === 1 ? -12 : 12;
        parts.push(box("实际穿过斜缝两壁门口的短桥", center, y, z, 8.4, 0.4, 3.2, steel), ...[-1, 1].map(side => part("短桥与桥板连续相接的透光低护壁", "box", colors.glass, [center, y + 0.8, z + side * 1.5], [7.6, 1.2, 0.08], [0, 0, 0], { opacity: 0.32, roughness: 0.2 })));
      }
    }
    const holes: [number, number][][] = [[[-13.7, 8], [-10.3, 8], [-10.3, 12.2], [-13.7, 12.2]], [[10.3, 15], [13.7, 15], [13.7, 19.2], [10.3, 19.2]]];
    for (const [x0, top] of [[leftBase, leftTop], [rightBase, rightTop]]) {
      const wall = xYWall("分层短桥门真实开通的完整斜街重壁", [[-18, 0.5], [18, 0.5], [18, top!], [-18, top!]], holes, 0, 0.4, pale);
      wall.vertices = wall.vertices!.map(p => { const y = -p.z; return { x: x0! + y * 0.5 - (p.y - 0.2), y, z: p.x }; }); wall.position = { x: 0, y: 0, z: 0 }; wall.rotation = { x: 0, y: 0, z: 0 }; parts.push(wall);
    }
    for (const [a, b] of [[-27, leftX], [rightX, 27]]) {
      const profile = [{ x: a!, y: roofY(a!) }, { x: b!, y: roofY(b!) }, { x: b!, y: roofY(b!) - 0.3 }, { x: a!, y: roofY(a!) - 0.3 }];
      parts.push(part("斜缝实际切开的独立楔翼薄屋顶", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile, depth: 36.8 }));
      for (const z of [-16, 0, 16]) parts.push(rail([a!, roofY(a!) - 0.3, z], [b!, roofY(b!) - 0.3, z], 0.5, dark));
    }
    for (const x of [-27, 27]) {
      const top = roofY(x) - 0.3;
      parts.push(part("楔塔两端完整通高透光薄围护", "box", colors.glass, [x, (1 + top) / 2, 0], [0.12, top - 1, 36], [0, 0, 0], { opacity: 0.28, roughness: 0.2 }));
      for (const z of [-16, 16]) parts.push(box("楔塔外边缘接到斜屋顶的落地承柱", x, (0.5 + top) / 2, z, 0.45, top - 0.5, 0.45, dark));
    }
    const outlines: [number, number][][] = [[[-27, 0.5], [leftBase + 0.25, 0.5], [leftX, leftTop], [-27, 12]], [[rightBase + 0.25, 0.5], [27, 0.5], [27, 49.8], [rightX, rightTop]]];
    for (const z of [-18, 18]) for (let wing = 0; wing < 2; wing++) {
      const x = wing ? 8 : -24, door: [number, number][] = [[x - 1.8, 1], [x + 1.8, 1], [x + 1.8, 5.2], [x - 1.8, 5.2]], facade = xYWall("与楔顶及斜缝同形并保留正门的端面薄窗墙", outlines[wing]!, z < 0 ? [door] : [], z, 0.12, colors.glass); facade.opacity = 0.28; facade.roughness = 0.2; parts.push(facade);
      if (z < 0) parts.push(stairFlight("楔翼正面实际接入底层的两级短梯", [x, 0.5, -19.6], 2, 0.25, 0.8, 3.4));
    }
    for (const x of [-1.4, 1.4]) for (const z of [-1.4, 1.4]) parts.push(box("高楔翼贯穿七层的独立升降井细柱", 24.2 + x, 23.45, z, 0.15, 45.9, 0.15, dark));
    parts.push(box("高楔翼升降井独立顶部承索梁", 24.2, 46.4, 0, 3.2, 0.3, 3.2, dark), box("高楔翼升降井底部独立轿厢", 24.2, 0.8, 0, 2.6, 0.4, 2.6, steel), pipe("高楔翼独立升降井中可见吊索", [24.2, 46.4, 0], [24.2, 0.99, 0], 0.05));
    return parts;
  }, "建筑", "赛博朋克"),
];
