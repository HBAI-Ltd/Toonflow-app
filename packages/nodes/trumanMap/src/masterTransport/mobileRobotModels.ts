import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { ball, box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";

export const mobileRobotModels: TransportDefinition[] = [
  { name: "双卡箍管内尺蠖巡检机器人", itemType: "电子设备", tags: ["管道巡检", "径向撑紧", "轴向伸缩"], create: () => {
    const parts: ModelPart[] = [cylinder("中央轴向伸缩驱动筒", [0, 0.5, 0], [0.18, 0.7, 0.18], transportColors.body, [90, 0, 0]), strut("向前伸出的推进杆", [0, 0.5, -0.15], [0, 0.5, -0.65], 0.07), box("后部供电控制盒", [0, 0.5, 0.65], [0.25, 0.25, 0.3], transportColors.signal), cylinder("前向巡检镜头", [0, 0.5, -0.88], [0.14, 0.18, 0.14], transportColors.glass, [90, 0, 0])];
    for (const z of [-0.55, 0.45]) {
      const collar = ring("三爪扩张卡箍环", transportColors.dark, 0.18, 0.035, 0, 0.16); collar.rotation.x = 90; collar.position = { x: 0, y: 0.5, z }; parts.push(collar);
      for (let index = 0; index < 3; index++) { const a = index * Math.PI * 2 / 3; const link = strut("径向撑管推杆", [Math.cos(a) * 0.14, 0.5 + Math.sin(a) * 0.14, z], [Math.cos(a) * 0.38, 0.5 + Math.sin(a) * 0.38, z], 0.045); link.shape = "cylinder"; parts.push(link, box("管内接触防滑掌", [Math.cos(a) * 0.4, 0.5 + Math.sin(a) * 0.4, z], [0.22, 0.06, 0.22], transportColors.dark, [0, 0, index * 120 - 90])); }
    }
    parts.push(...[-1, 1].map(side => ball("镜头侧照明灯", [side * 0.11, 0.5, -0.85], [0.06, 0.06, 0.05], transportColors.trim))); return parts;
  } },
  { name: "竖索夹轮攀爬器", itemType: "电子设备", tags: ["钢索攀爬", "对压驱动轮"], create: () => {
    const parts = [strut("竖向受检索段", [0, 0.1, 0], [0, 1.4, 0], 0.015), box("侧挂供电控制壳", [0.22, 0.72, 0], [0.18, 0.55, 0.35], transportColors.signal), ...[-1, 1].map(side => box("夹轮两侧承力板", [side * 0.12, 0.72, 0], [0.035, 0.65, 0.4], transportColors.body))];
    for (const y of [0.5, 0.92]) for (const z of [-0.09, 0.09]) parts.push(cylinder("对压包胶牵引滚轮", [0, y, z], [0.17, 0.19, 0.17], transportColors.dark, [0, 0, 90]));
    parts.push(cylinder("侧置夹轮减速电机", [-0.23, 0.72, 0], [0.2, 0.18, 0.2], transportColors.body, [0, 0, 90]), ...[-1, 1].map(end => ring("钢索同轴导向眼", transportColors.trim, 0.05, 0.015, 0.72 + end * 0.41, 0.1)), box("后方巡检摄像模块", [0.2, 0.8, 0.2], [0.1, 0.12, 0.12], transportColors.glass)); return parts;
  } },
  { name: "真空足壁面清洗机器人", itemType: "电子设备", tags: ["壁面清洗", "交替吸附足", "刮洗头"], create: () => {
    const parts = [box("竖置清洗机器人机身", [0, 0.6, 0.24], [0.38, 0.52, 0.18], transportColors.body), box("中央真空配气盒", [0, 0.6, 0.36], [0.25, 0.3, 0.1], transportColors.signal), cylinder("表面清洗剂小罐", [0, 0.58, 0.47], [0.18, 0.35, 0.18], transportColors.trim), box("贴壁刮水刀", [0, 0.1, 0], [0.65, 0.055, 0.08], transportColors.dark), strut("清洗头伸缩支臂", [0, 0.38, 0.24], [0, 0.12, 0.06], 0.055)];
    for (const side of [-1, 1]) for (const end of [-1, 1]) { const x = side * 0.32, y = 0.6 + end * 0.28; parts.push(strut("吸附足外展关节臂", [side * 0.16, 0.6 + end * 0.13, 0.24], [x, y, 0.1], 0.045), part("朝向壁面的柔性吸盘", "lathe", transportColors.dark, [x, y, 0.1], [1, 1, 1], [-90, 0, 0], { profile: [{ x: 0.035, y: -0.04 }, { x: 0.1, y: 0.08 }, { x: 0.115, y: 0.1 }, { x: 0.1, y: 0.1 }, { x: 0.07, y: 0.04 }, { x: 0.025, y: 0 }] }), strut("独立真空分支管", [0, 0.6, 0.36], [x, y, 0.12], 0.012)); }
    return parts;
  } },
  { name: "六杆张拉整体巡视器", theme: "科幻", itemType: "电子设备", tags: ["张拉整体", "六根悬离压杆", "柔索滚动框架"], create: () => {
    const points: Triple[] = [[-1, -0.5, 0], [1, -0.5, 0], [-1, 0.5, 0], [1, 0.5, 0], [0, -1, -0.5], [0, 1, -0.5], [0, -1, 0.5], [0, 1, 0.5], [-0.5, 0, -1], [-0.5, 0, 1], [0.5, 0, -1], [0.5, 0, 1]];
    const parts: ModelPart[] = [ball("中心悬吊导航仪舱", [0, 0, 0], [0.4, 0.4, 0.4], transportColors.body)];
    for (let i = 0; i < points.length; i += 2) { const rod = strut("不相接触的刚性压杆", points[i]!, points[i + 1]!, 0.075, transportColors.signal); rod.shape = "cylinder"; parts.push(rod); }
    for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) { const a = points[i]!, b = points[j]!; const d = a.reduce((sum, value, axis) => sum + (value - b[axis]!) ** 2, 0); if (Math.abs(d - 1.5) < 1e-6) parts.push(strut("跨向预张紧柔索", a, b, 0.012, transportColors.dark)); }
    for (const end of [-1, 1]) parts.push(strut("导航舱内部悬吊索", [0, end * 0.16, 0], [0, end, 0.5], 0.009)); return parts;
  } },
  { name: "缆索悬吊摄影车", itemType: "电子设备", tags: ["影视器材", "索上行走", "三轴悬吊云台"], create: () => {
    const parts = [strut("沿场景跨越的承重缆段", [-1, 1.65, 0], [1, 1.65, 0], 0.012), box("摄影车细长驱动梁", [0, 1.3, 0], [0.85, 0.1, 0.12], transportColors.dark), box("驱动梁上电池盒", [0, 1.4, 0.16], [0.45, 0.15, 0.22], transportColors.signal), ...[-1, 1].flatMap(side => [part("承缆轮槽", "torus", transportColors.trim, [side * 0.32, 1.5, 0], [0.3, 0.3, 0.12]), strut("索轮轴承立架", [side * 0.32, 1.3, 0.12], [side * 0.32, 1.5, 0.12], 0.04), cylinder("索轮驱动电机", [side * 0.32, 1.5, 0.18], [0.12, 0.18, 0.12], transportColors.body, [90, 0, 0]), strut("悬吊V形减振臂", [side * 0.32, 1.25, 0], [0, 0.85, 0], 0.035)]), cylinder("云台偏航轴", [0, 0.82, 0], [0.12, 0.18, 0.12], transportColors.dark), ...[-1, 1].map(side => strut("云台两侧支架", [side * 0.2, 0.75, 0], [side * 0.2, 0.43, 0], 0.035)), box("悬挂摄像机身", [0, 0.48, 0], [0.3, 0.22, 0.28], transportColors.body), cylinder("摄像机前镜头", [0, 0.48, -0.23], [0.18, 0.2, 0.18], transportColors.dark, [90, 0, 0]), cylinder("镜头前光学面", [0, 0.48, -0.34], [0.15, 0.015, 0.15], transportColors.glass, [90, 0, 0])];
    return parts;
  } },
  { name: "三星轮楼梯搬运车", tags: ["搬运设备", "翻转轮组", "楼梯运输"], create: () => {
    const parts = [box("贴近地面的货物承托板", [0, 0.06, -0.2], [0.65, 0.08, 0.55], transportColors.signal), ...[-1, 1].map(side => strut("前倾长承力车架", [side * 0.28, 0.1, 0], [side * 0.28, 1.25, 0.28], 0.045)), strut("顶端连续握持把", [-0.28, 1.25, 0.28], [0.28, 1.25, 0.28], 0.05), box("货物下部横向靠条", [0, 0.45, 0.08], [0.6, 0.08, 0.04], transportColors.dark), box("货物上部横向靠条", [0, 0.9, 0.19], [0.6, 0.08, 0.04], transportColors.dark), cylinder("两侧星轮共用主轴", [0, 0.42, 0.08], [0.07, 0.85, 0.07], transportColors.trim, [0, 0, 90])];
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3, y = 0.42 + Math.cos(a) * 0.2, z = 0.08 + Math.sin(a) * 0.2; parts.push(strut("三星轮独立支臂", [side * 0.4, 0.42, 0.08], [side * 0.4, y, z], 0.055), ...wheel([side * 0.4, y, z], 0.12, 0.075)); }
    return parts;
  } },
];
