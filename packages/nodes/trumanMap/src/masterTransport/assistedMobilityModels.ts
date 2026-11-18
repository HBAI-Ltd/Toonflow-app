import { part, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";

export const assistedMobilityModels: TransportDefinition[] = [
  { name: "跪托式四轮助行代步车", tags: ["膝行车", "跪托", "转向车把"], create: () => {
    const parts: ModelPart[] = [strut("主承重纵管", [0, 0.23, -0.42], [0, 0.25, 0.42], 0.055), strut("跪托升降支柱", [0, 0.24, 0.04], [0, 0.57, 0.04], 0.045), box("长条膝部软托", [0, 0.6, 0.03], [0.23, 0.09, 0.46], transportColors.signal), cylinder("转向立管", [0, 0.61, -0.43], [0.045, 0.93, 0.045]), strut("转向车把横杆", [-0.24, 1.08, -0.43], [0.24, 1.08, -0.43], 0.035), ...[-1, 1].map(side => cylinder("车把握套", [side * 0.21, 1.08, -0.43], [0.05, 0.12, 0.05], transportColors.dark, [0, 0, 90]))];
    for (const z of [-0.43, 0.4]) parts.push(strut("低位横向轮桥", [-0.22, 0.1, z], [0.22, 0.1, z], 0.04), ...[-1, 1].flatMap(side => wheel([side * 0.22, 0.1, z], 0.1, 0.045)));
    parts.push(strut("左刹车握杆", [-0.2, 1.05, -0.47], [-0.09, 1.05, -0.49], 0.016), part("连至后轮的制动线", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.003, path: [{ x: -0.12, y: 1.05, z: -0.49 }, { x: -0.07, y: 0.86, z: -0.48 }, { x: -0.04, y: 0.28, z: -0.39 }, { x: -0.13, y: 0.27, z: 0.35 }, { x: -0.2, y: 0.13, z: 0.4 }] }));
    return parts;
  } },
  { name: "髋膝联动下肢步行外骨骼", theme: "科幻", tags: ["下肢助力", "外骨骼", "步态设备"], itemType: "器物", create: () => {
    const parts: ModelPart[] = [part("骨盆环抱束带", "torus", transportColors.signal, [0, 1.2, 0], [0.5, 0.34, 0.12], [90, 0, 0]), box("后背电控电池匣", [0, 1.28, 0.2], [0.29, 0.34, 0.12]), strut("骨盆后部承力横梁", [-0.3, 1.13, 0.12], [0.3, 1.13, 0.12], 0.045)];
    for (const side of [-1, 1]) {
      const x = side * 0.27;
      parts.push(cylinder("髋关节驱动盘", [x, 1.13, 0], [0.16, 0.11, 0.16], transportColors.dark, [0, 0, 90]), cylinder("膝关节驱动盘", [x, 0.65, 0.015], [0.14, 0.1, 0.14], transportColors.dark, [0, 0, 90]), cylinder("踝部铰接轴", [x, 0.13, 0.045], [0.08, 0.09, 0.08], transportColors.dark, [0, 0, 90]), strut("大腿外侧动力连杆", [x, 1.13, 0], [x, 0.65, 0.015], 0.04), strut("小腿外侧承力连杆", [x, 0.65, 0.015], [x, 0.13, 0.045], 0.035), strut("踝轴至足底支承", [x, 0.13, 0.045], [x, 0.04, 0.045], 0.035), box("刚性足底托板", [side * 0.2, 0.022, -0.055], [0.15, 0.044, 0.3], transportColors.dark), box("前足束带", [side * 0.2, 0.085, -0.12], [0.15, 0.035, 0.06], transportColors.signal));
      for (const y of [0.43, 0.95]) parts.push(part("环抱肢体的固定软箍", "torus", transportColors.signal, [side * 0.2, y, 0.01], [0.2, 0.22, 0.07], [90, 0, 0]), strut("箍带外侧支座", [side * 0.2, y, 0.01], [x, y, 0.01], 0.022));
    }
    return parts;
  } },
];
