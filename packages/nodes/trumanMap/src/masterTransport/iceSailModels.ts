import { part, type ModelPart } from "../assetModelParts";
import { box, strut, surface, transportColors, type TransportDefinition } from "./parts";

export const iceSailModels: TransportDefinition[] = [
  { name: "三冰刃竞速冰帆艇", itemType: "运动用品", tags: ["冰帆", "冰上帆船", "前刃转向"], create: () => {
    const parts: ModelPart[] = [part("躺姿窄型乘坐艇壳", "extrude", transportColors.wood, [0, 0.39, 0], [1, 1, 1], [0, 90, 0], { depth: 0.38, profile: [{ x: -1.65, y: 0.04 }, { x: -0.65, y: 0.02 }, { x: 1.1, y: -0.11 }, { x: 1.55, y: 0.02 }, { x: 1.15, y: 0.18 }, { x: -0.6, y: 0.24 }, { x: -1.65, y: 0.15 }] }), box("后部坐垫", [0, 0.58, 0.8], [0.34, 0.08, 0.65], transportColors.signal), strut("横向双刃承力梁", [-1.7, 0.25, 0.7], [1.7, 0.25, 0.7], 0.12, transportColors.wood), strut("高位索具主桅", [0, 0.55, -0.5], [0, 4.1, -0.38], 0.065, transportColors.wood), strut("下部帆桁", [0, 0.85, -0.5], [0, 0.85, 1.25], 0.055, transportColors.wood), surface("高纵横比三角帆", transportColors.trim, [[0.025, 0.9, -0.48], [0.025, 4.02, -0.38], [0.025, 1.02, 1.22]], [0, 1, 2]), strut("前缘支索", [0, 4, -0.38], [0, 0.43, -1.5], 0.012), strut("前刃转向立轴", [0, 0.13, -1.42], [0, 0.5, -1.42], 0.045), strut("前刃操纵连杆", [0, 0.48, -1.42], [0, 0.5, -0.1], 0.035), strut("艇内转向横把", [-0.18, 0.5, -0.1], [0.18, 0.5, -0.1], 0.025)];
    parts.push(strut("艇壳至横梁承重座", [0, 0.25, 0.7], [0, 0.43, 0.7], 0.12));
    for (const [x, z] of [[-1.7, 0.7], [1.7, 0.7], [0, -1.42]]) parts.push(strut("冰刃与横梁支座", [x!, 0.12, z!], [x!, 0.25, z!], 0.06), part("弧形钢制冰刃", "extrude", transportColors.dark, [x!, 0, z!], [1, 1, 1], [0, 90, 0], { depth: 0.018, profile: [{ x: -0.35, y: 0.08 }, { x: -0.25, y: 0.005 }, { x: 0.22, y: 0.005 }, { x: 0.35, y: 0.08 }, { x: 0.24, y: 0.14 }, { x: -0.24, y: 0.14 }] }));
    for (const side of [-1, 1]) parts.push(strut("桅顶侧支索", [0, 4, -0.38], [side * 1.7, 0.25, 0.7], 0.012));
    parts.push(strut("帆角操纵缭绳", [0, 0.85, 1.25], [0, 0.52, 0.45], 0.014));
    return parts;
  } },
];
