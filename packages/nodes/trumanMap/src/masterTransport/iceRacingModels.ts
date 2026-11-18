import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

export const iceRacingModels: TransportDefinition[] = [
  { name: "流线壳重力竞速雪车", theme: "现代", itemType: "运动用品", tags: ["冰上运动", "雪车", "前刃绳控转向", "独立后制动耙", "开放座舱"], create: () => {
    const stations = [[-1.35, 0.08, 0.62], [-0.7, 0.4, 0.68], [0.6, 0.44, 0.6], [1.3, 0.31, 0.45]];
    const parts: ModelPart[] = [strut("前部转向滑刃横梁", [-0.32, 0.16, -0.8], [0.32, 0.16, -0.8], 0.075), cylinder("前滑刃中央转向销", [0, 0.22, -0.8], [0.1, 0.18, 0.1], transportColors.dark), box("后部固定滑刃横架", [0, 0.17, 0.8], [0.72, 0.08, 0.1], transportColors.dark), ...[-0.45, 0.65].map(z => box("座舱内独立软座", [0, 0.36, z], [0.43, 0.12, 0.48], transportColors.dark))];
    for (let index = 0; index < stations.length - 1; index++) {
      const [z, w, y] = stations[index]!, [nextZ, nextW, nextY] = stations[index + 1]!;
      for (const side of [-1, 1]) {
        const points: Triple[] = [[side * w!, y!, z!], [side * w! * 0.8, 0.26, z!], [side * nextW! * 0.8, 0.26, nextZ!], [side * nextW!, nextY!, nextZ!]];
        parts.push(surface("座舱两侧连续流线壳片", transportColors.signal, points, [0, 1, 2, 0, 2, 3]), strut("开放座舱上缘保护梁", points[0]!, points[3]!, 0.025, transportColors.body));
      }
      parts.push(surface("座舱底部连续承载壳片", transportColors.body, [[-w! * 0.8, 0.26, z!], [w! * 0.8, 0.26, z!], [nextW! * 0.8, 0.26, nextZ!], [-nextW! * 0.8, 0.26, nextZ!]], [0, 1, 2, 0, 2, 3]));
    }
    parts.push(surface("收窄雪车鼻端封板", transportColors.signal, [[-0.08, 0.26, -1.35], [0.08, 0.26, -1.35], [0.08, 0.62, -1.35], [-0.08, 0.62, -1.35]], [0, 1, 2, 0, 2, 3]));
    for (const side of [-1, 1]) {
      for (const z of [-0.8, 0.8]) parts.push(part("雪车分立钢滑刃", "extrude", transportColors.trim, [side * 0.32, 0.015, z], [1, 1, 1], [0, 90, 0], { depth: 0.035, profile: [{ x: -0.36, y: 0.05 }, { x: -0.24, y: 0 }, { x: 0.28, y: 0 }, { x: 0.36, y: 0.04 }, { x: 0.29, y: 0.07 }, { x: -0.21, y: 0.07 }] }), strut("钢滑刃至底盘的支撑", [side * 0.32, 0.1, z], [side * 0.32, 0.28, z], 0.045));
      parts.push(strut("驾驶员握持的绳控转向索", [side * 0.23, 0.4, -0.3], [side * 0.28, 0.19, -0.8], 0.008, transportColors.dark), box("尾部助跑推行把手", [side * 0.38, 0.55, 1], [0.16, 0.035, 0.07], transportColors.dark));
    }
    parts.push(strut("后座手动制动杠杆", [0, 0.2, 0.8], [0, 0.6, 0.55], 0.035), box("后刃之间的制动耙横梁", [0, 0.16, 0.87], [0.32, 0.06, 0.08], transportColors.dark));
    for (const x of [-0.12, 0, 0.12]) parts.push(box("制动耙下向尖齿", [x, 0.11, 0.87], [0.03, 0.1, 0.04], transportColors.trim));
    return parts;
  } },
  { name: "俯卧钢架雪车", theme: "现代", itemType: "运动用品", tags: ["冰上运动", "钢架雪车", "俯卧滑行", "连续双滑管", "无机械转向"], create: () => {
    const parts = [part("俯卧贴身雪车承托板", "extrude", transportColors.body, [0, 0.2, 0], [1, 1, 1], [90, 0, 0], { depth: 0.045, profile: [{ x: -0.12, y: -0.42 }, { x: 0.12, y: -0.42 }, { x: 0.24, y: -0.25 }, { x: 0.22, y: 0.35 }, { x: 0.1, y: 0.48 }, { x: -0.1, y: 0.48 }, { x: -0.22, y: 0.35 }, { x: -0.24, y: -0.25 }] }), box("胸部软包承托垫", [0, 0.24, -0.12], [0.34, 0.05, 0.33], transportColors.dark), ...[-0.25, 0.25].map(z => strut("两侧滑管之间的横承梁", [-0.22, 0.14, z], [0.22, 0.14, z], 0.035))];
    for (const side of [-1, 1]) {
      parts.push(part("前后轻微上翘的连续钢滑管", "tube", transportColors.trim, [side * 0.2, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.012, path: [{ x: 0, y: 0.09, z: -0.5 }, { x: 0, y: 0.03, z: -0.37 }, { x: 0, y: 0.025, z: 0 }, { x: 0, y: 0.03, z: 0.36 }, { x: 0, y: 0.08, z: 0.5 }] }), part("肩侧助跑与握持把手", "tube", transportColors.dark, [side * 0.2, 0.2, -0.1], [1, 1, 1], [0, 0, 0], { radius: 0.014, path: [{ x: 0, y: 0, z: -0.1 }, { x: side * 0.12, y: 0.06, z: -0.07 }, { x: side * 0.12, y: 0.06, z: 0.1 }, { x: 0, y: 0, z: 0.13 }] }));
      for (const z of [-0.3, 0.3]) parts.push(strut("滑管至俯卧板独立撑脚", [side * 0.2, 0.04, z], [side * 0.2, 0.18, z], 0.025));
    }
    for (const z of [-0.47, 0.47]) parts.push(strut("雪车前后保护横杠", [-0.28, 0.16, z], [0.28, 0.16, z], 0.035, transportColors.body));
    return parts;
  } },
];
