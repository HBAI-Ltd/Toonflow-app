import { part, type ModelPart } from "../assetModelParts";
import { box, cab, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";
import { railFrame } from "./railModels";

function pantograph(y: number, z: number): ModelPart[] {
  const parts = [box("受电弓屋顶绝缘底座", [0, y, z], [1.2, 0.18, 1.4], transportColors.trim)];
  for (const side of [-1, 1]) parts.push(strut("菱形受电弓下臂", [0, y + 0.2, z], [0, y + 0.9, z + side * 0.7], 0.055), strut("菱形受电弓上臂", [0, y + 0.9, z + side * 0.7], [0, y + 1.6, z], 0.045));
  parts.push(box("横跨接触线的集电滑板", [0, y + 1.65, z], [1.7, 0.08, 0.22], transportColors.dark));
  return parts;
}

function passengerShell(length: number, width: number, floor: number, z = 0): ModelPart[] {
  const parts = [box("低地板客室底板", [0, floor, z], [width, 0.16, length], transportColors.dark), box("客室连续屋盖", [0, floor + 2.5, z], [width + 0.05, 0.17, length], transportColors.trim)];
  for (const side of [-1, 1]) {
    parts.push(box("车窗下段车侧壁", [side * width / 2, floor + 0.55, z], [0.09, 1, length], transportColors.body), box("车窗上段车侧梁", [side * width / 2, floor + 2.31, z], [0.09, 0.3, length], transportColors.body));
    for (let index = 0; index < 5; index++) parts.push(box("客室侧窗框柱", [side * width / 2, floor + 1.66, z + (index - 2) * length / 4], [0.08, 1.05, 0.12], transportColors.dark));
    for (let index = 0; index < 4; index++) parts.push(part("独立客室透明窗格", "box", transportColors.glass, [side * width / 2, floor + 1.66, z + (index - 1.5) * length / 4], [0.035, 1, length / 4 - 0.12], [0, 0, 0], { opacity: 0.48 }));
  }
  return parts;
}

export const mainlineRailModels: TransportDefinition[] = [
  { name: "长机罩柴油电力机车", theme: "现代", tags: ["铁路", "柴油机车", "长机罩", "车侧步道", "内燃发电牵引"], create: () => {
    const parts = [...railFrame(15, 2.8), ...cab([0, 1.05, -4.8], [2.6, 2.8, 2.4]), box("长形柴油发电动力罩", [0, 2.05, 1.75], [1.8, 1.9, 10.4]), box("驾驶舱前低短机罩", [0, 1.65, -6.6], [1.8, 1.2, 1.2]), box("驾驶舱后侧风挡", [0, 3.2, -3.55], [2.2, 0.75, 0.04], transportColors.glass), cylinder("机罩上部排气口", [0, 3.2, 0.3], [0.45, 0.5, 0.45], transportColors.dark)];
    for (const side of [-1, 1]) {
      parts.push(box("可通行的机罩侧步道", [side * 1.12, 1.05, 1.6], [0.42, 0.15, 10.8], transportColors.trim), box("侧步道连续上扶手", [side * 1.28, 2, 1.6], [0.035, 0.035, 10.8], transportColors.dark));
      for (const z of [-3.5, -0.1, 3.3, 6.7]) parts.push(strut("侧步道防护栏立杆", [side * 1.28, 1.05, z], [side * 1.28, 2, z], 0.035));
      for (let index = 0; index < 6; index++) parts.push(box("柴油机罩分立通风百叶", [side * 0.91, 2.3, -2.1 + index * 1.6], [0.045, 1, 0.8], transportColors.dark));
    }
    for (const z of [2.3, 4.7]) parts.push(cylinder("机罩屋顶散热风扇格栅", [0, 3.04, z], [1.3, 0.08, 1.3], transportColors.dark));
    return parts;
  } },
  { name: "双司机室屋顶受电弓机车", theme: "现代", tags: ["铁路", "电力机车", "双端驾驶室", "菱形受电弓", "屋顶高压母线"], create: () => {
    const parts = [...railFrame(18, 2.9), box("连续封闭动力设备车体", [0, 2.35, 0], [2.8, 2.8, 17.3]), box("整车上部平顶", [0, 3.85, 0], [2.9, 0.18, 17.5], transportColors.trim), ...pantograph(4, -5.8), ...pantograph(4, 5.8), strut("屋顶纵向高压母线", [0, 4.3, -4.5], [0, 4.3, 4.5], 0.06, transportColors.trim)];
    for (const end of [-1, 1]) parts.push(box("端部宽幅驾驶风挡", [0, 3, end * 8.7], [2.35, 0.85, 0.05], transportColors.glass), ...[-1, 1].map(side => cylinder("车端独立前照灯", [side * 0.85, 1.5, end * 8.72], [0.25, 0.06, 0.25], transportColors.trim, [90, 0, 0])));
    for (const side of [-1, 1]) for (const z of [-7.5, 7.5]) parts.push(box("驾驶室侧面观察窗", [side * 1.42, 3.02, z], [0.05, 0.85, 1.1], transportColors.glass));
    for (const z of [-2.5, 0, 2.5]) parts.push(box("车顶强迫通风设备箱", [0, 4.1, z], [1.7, 0.4, 1.2], transportColors.dark), cylinder("高压母线支撑绝缘子", [0, 4.1, z + 0.9], [0.2, 0.35, 0.2], transportColors.trim));
    return parts;
  } },
  { name: "低地板铰接有轨电车", theme: "现代", tags: ["铁路", "有轨电车", "铰接车厢", "低地板", "连续过道", "屋顶集电"], create: () => {
    const parts: ModelPart[] = [...passengerShell(7.7, 2.5, 0.55, -4.45), ...passengerShell(7.7, 2.5, 0.55, 4.45), box("铰接过道连接地板", [0, 0.55, 0], [2.2, 0.14, 1.2], transportColors.dark), box("铰接柔性通道顶盖", [0, 3.05, 0], [2.3, 0.14, 1.25], transportColors.dark), ...pantograph(3.18, -3.7)];
    for (const z of [-6.4, 6.4]) for (const side of [-1, 1]) parts.push(...wheel([side * 0.78, 0.25, z], 0.25, 0.13));
    for (const side of [-1, 1]) for (let fold = 0; fold < 6; fold++) parts.push(box("铰接侧围折叠风琴叶", [side * (1.14 + fold % 2 * 0.05), 1.8, (fold - 2.5) * 0.2], [0.12, 2.35, 0.14], transportColors.dark));
    for (const end of [-1, 1]) {
      parts.push(box("电车端部下围", [0, 1.1, end * 8.35], [2.45, 1.1, 0.22], transportColors.signal), part("电车端部大风挡", "box", transportColors.glass, [0, 2.3, end * 8.36], [2.35, 1.25, 0.05], [0, 0, 0], { opacity: 0.58 }));
    }
    return parts;
  } },
  { name: "跨座式橡胶轮单轨车", theme: "现代", tags: ["铁路", "跨座单轨", "轨梁两侧导向轮", "轨顶承重轮", "跨梁转向架"], create: () => {
    const parts: ModelPart[] = [box("单轨混凝土轨梁短段", [0, 0.9, 0], [0.9, 1.6, 18], transportColors.trim), ...passengerShell(14, 2.7, 2.4), ...[-1, 1].map(end => box("单轨车端部封闭风挡", [0, 3.7, end * 7], [2.5, 1.8, 0.08], transportColors.glass))];
    for (const z of [-4.5, 4.5]) {
      for (const side of [-1, 1]) parts.push(box("跨轨梁转向架侧框", [side * 0.77, 1.9, z], [0.25, 0.8, 1.8], transportColors.dark), ...wheel([side * 0.25, 2, z], 0.3, 0.28), cylinder("轨梁侧面水平导向橡胶轮", [side * 0.65, 1.2, z - 0.55], [0.4, 0.25, 0.4], transportColors.dark), cylinder("轨梁侧面水平稳定橡胶轮", [side * 0.65, 0.55, z + 0.55], [0.4, 0.25, 0.4], transportColors.dark));
      parts.push(box("跨轨梁转向架顶桥", [0, 2.3, z], [1.8, 0.16, 1.8], transportColors.body));
    }
    return parts;
  } },
];
