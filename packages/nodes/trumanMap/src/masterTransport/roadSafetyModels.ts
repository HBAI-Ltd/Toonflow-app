import { part, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

export const roadSafetyModels: TransportDefinition[] = [
  { name: "方底中空交通路锥", itemType: "设施", tags: ["路锥", "交通锥", "临时交通"], create: () => [box("柔性路锥方形压重脚", [0, 0.025, 0], [0.4, 0.05, 0.4], transportColors.dark), part("顶口贯通的锥形警示壳", "lathe", transportColors.signal, [0, 0.05, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.16, y: 0 }, { x: 0.025, y: 0.6 }, { x: 0.014, y: 0.6 }, { x: 0.146, y: 0 }, { x: 0.16, y: 0 }] }), part("贴合锥面的反光环带", "lathe", transportColors.trim, [0, 0.05, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.098, y: 0.28 }, { x: 0.07325, y: 0.39 }, { x: 0.07125, y: 0.39 }, { x: 0.096, y: 0.28 }, { x: 0.098, y: 0.28 }] })] },
  { name: "防滑楔形止轮块", itemType: "器物", tags: ["止轮块", "车轮止退", "轮挡"], create: () => [part("凹折轮面橡胶楔", "extrude", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.2, profile: [{ x: -0.18, y: 0 }, { x: 0.18, y: 0 }, { x: 0.18, y: 0.16 }, { x: 0.08, y: 0.15 }, { x: -0.05, y: 0.1 }, { x: -0.18, y: 0.035 }] }), ...[-0.1, 0, 0.1].map(z => box("轮面横向抓地凸肋", [0, 0.15 - (z + 0.1) * 0.35, z], [0.2, 0.012, 0.022], transportColors.body)), part("高背穿绳提取环", "torus", transportColors.signal, [0, 0.105, -0.18], [0.09, 0.075, 0.025])] },
  { name: "折脚反光三角警示架", itemType: "器物", tags: ["三角警示牌", "道路警示", "折叠支脚"], create: () => {
    const points: [number, number, number][] = [[-0.35, 0.08, 0], [0.35, 0.08, 0], [0, 0.68, 0]], parts: ModelPart[] = [];
    for (let index = 0; index < 3; index++) parts.push(strut("三角反光框边", points[index]!, points[(index + 1) % 3]!, 0.045, transportColors.signal));
    for (const side of [-1, 1]) parts.push(box("前后展开稳定脚", [side * 0.25, 0.035, 0], [0.055, 0.07, 0.43], transportColors.dark), cylinder("支脚折叠铰销", [side * 0.25, 0.08, 0], [0.035, 0.1, 0.035], transportColors.body, [90, 0, 0]));
    return parts;
  } },
  { name: "剪式交叉折叠隔离栏", itemType: "设施", tags: ["折叠围栏", "剪式围栏", "隔离栏"], create: () => {
    const parts: ModelPart[] = [];
    for (let index = 0; index < 4; index++) {
      const left = -1.2 + index * 0.6;
      parts.push(strut("斜向展开连杆", [left, 0.15, -0.025], [left + 0.6, 1, -0.025], 0.05, transportColors.signal), strut("反斜向展开连杆", [left, 1, 0.025], [left + 0.6, 0.15, 0.025], 0.05, transportColors.dark), cylinder("中部交叉连杆销", [left + 0.3, 0.575, 0], [0.075, 0.12, 0.075], transportColors.body, [90, 0, 0]));
    }
    for (const side of [-1, 1]) parts.push(box("端部收束立柱", [side * 1.2, 0.58, 0], [0.075, 1.05, 0.12]), box("前后防倾稳定脚", [side * 1.2, 0.04, 0], [0.28, 0.08, 0.6], transportColors.dark));
    for (let index = 0; index < 5; index++) for (const y of [0.15, 1]) parts.push(cylinder("连杆端部铰销", [-1.2 + index * 0.6, y, 0], [0.06, 0.14, 0.06], transportColors.trim, [90, 0, 0]));
    return parts;
  } },
  { name: "翻盖多槽电缆保护过路板", itemType: "设施", tags: ["电缆保护板", "过路板", "内置通槽"], create: () => {
    const parts: ModelPart[] = [box("保护板连续承压底", [0, 0.0125, 0], [1, 0.025, 0.33], transportColors.dark), box("顶部可揭检修盖", [0, 0.0975, 0], [1, 0.025, 0.33], transportColors.signal)];
    for (const z of [-0.15, -0.05, 0.05, 0.15]) parts.push(box("保留通线空腔的隔肋", [0, 0.055, z], [1, 0.06, 0.025], transportColors.dark));
    for (const side of [-1, 1]) parts.push(part("两侧缓坡承压斜台", "extrude", transportColors.dark, [0, 0, side * 0.24], [1, 1, 1], [0, 90, 0], { depth: 1, profile: [{ x: side * 0.075, y: 0.11 }, { x: -side * 0.15, y: 0 }, { x: side * 0.075, y: 0 }] }));
    parts.push(cylinder("沿盖板边缘的翻盖铰轴", [0, 0.0975, 0.15], [0.018, 1, 0.018], transportColors.body, [0, 0, 90]));
    return parts;
  } },
];
