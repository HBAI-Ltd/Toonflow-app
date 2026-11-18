import { part, type ModelPart } from "../assetModelParts";
import { ball, box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 系缆观测球的结构依据 https://ocean.si.edu/human-connections/exploration/deep-sea-submersibles
// 保留无推进器、顶部承缆与前置小观察窗的特征，不复制馆藏模型文件。
export const divingCapsuleModels: TransportDefinition[] = [
  { name: "系缆式深海观测球", theme: "蒸汽朋克", tags: ["潜水球", "Bathysphere", "缆索下放"], create: () => {
    const parts: ModelPart[] = [ball("厚壁球形耐压舱", [0, 0.93, 0], [1.5, 1.5, 1.5]), cylinder("顶部承缆座", [0, 1.72, 0], [0.42, 0.2, 0.42], transportColors.dark), part("吊缆闭合耳环", "torus", transportColors.dark, [0, 1.94, 0], [0.27, 0.33, 0.08]), cylinder("密封人员入口法兰", [0.62, 0.95, 0.08], [0.57, 0.2, 0.57], transportColors.dark, [0, 0, 90]), cylinder("螺栓密闭舱门", [0.75, 0.95, 0.08], [0.49, 0.08, 0.49], transportColors.trim, [0, 0, 90])];
    for (const x of [-0.24, 0.24]) parts.push(cylinder("前置厚窗金属座", [x, 1.08, -0.69], [0.32, 0.13, 0.32], transportColors.dark, [90, 0, 0]), cylinder("小直径石英观察窗", [x, 1.08, -0.77], [0.22, 0.04, 0.22], transportColors.glass, [90, 0, 0]));
    for (const side of [-1, 1]) parts.push(box("落地支承座", [side * 0.43, 0.1, 0], [0.25, 0.2, 0.68], transportColors.dark), strut("球壳下部承托", [side * 0.43, 0.1, 0], [side * 0.43, 0.42, 0], 0.12));
    parts.push(strut("通信接口短管", [0.22, 1.6, 0], [0.22, 1.89, 0.13], 0.065));
    return parts;
  } },
  { name: "底部开放式作业潜水钟", tags: ["开放底", "水下作业", "气室"], create: () => {
    const parts: ModelPart[] = [part("底口贯通圆顶钟壳", "lathe", transportColors.body, [0, 0.12, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.72, y: 0 }, { x: 0.72, y: 1.42 }, { x: 0.58, y: 1.75 }, { x: 0.3, y: 1.97 }, { x: 0, y: 2.04 }, { x: 0, y: 1.96 }, { x: 0.27, y: 1.9 }, { x: 0.52, y: 1.69 }, { x: 0.64, y: 1.4 }, { x: 0.64, y: 0 }, { x: 0.72, y: 0 }] }), part("顶端起吊吊耳", "torus", transportColors.dark, [0, 2.29, 0], [0.29, 0.3, 0.08]), cylinder("顶部进气管接头", [0.25, 2.02, 0], [0.09, 0.28, 0.09], transportColors.signal)];
    for (const side of [-1, 1]) parts.push(box("钟内贴壁座板", [side * 0.49, 0.68, 0], [0.26, 0.08, 0.75], transportColors.wood), strut("座板支撑", [side * 0.6, 0.4, 0], [side * 0.49, 0.68, 0], 0.065), strut("外部着底支脚", [side * 0.67, 0.38, 0], [side * 0.9, 0.08, 0], 0.11), box("着底脚板", [side * 0.9, 0.04, 0], [0.3, 0.08, 0.65], transportColors.dark));
    parts.push(cylinder("前部观察口座", [0, 1.28, -0.71], [0.35, 0.13, 0.35], transportColors.dark, [90, 0, 0]), cylinder("密闭观察玻璃", [0, 1.28, -0.79], [0.25, 0.04, 0.25], transportColors.glass, [90, 0, 0]), strut("内侧上下扶梯左杆", [-0.22, 0.2, 0.52], [-0.22, 1.3, 0.52], 0.035), strut("内侧上下扶梯右杆", [0.22, 0.2, 0.52], [0.22, 1.3, 0.52], 0.035));
    for (const y of [0.3, 0.6, 0.9, 1.2]) parts.push(strut("扶梯横踏杆", [-0.22, y, 0.52], [0.22, y, 0.52], 0.04));
    return parts;
  } },
];
