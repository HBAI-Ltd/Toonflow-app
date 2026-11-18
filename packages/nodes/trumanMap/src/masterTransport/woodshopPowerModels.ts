import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function beltProfile(radius: number): [number, number][] {
  return [-1, 1].flatMap(side => Array.from({ length: 13 }, (_, index): [number, number] => {
    const angle = (side < 0 ? 0.5 : -0.5) * Math.PI + index * Math.PI / 12;
    return [Math.sin(angle) * radius, side * 0.12 + Math.cos(angle) * radius];
  }));
}

export const woodshopPowerModels: TransportDefinition[] = [
  { name: "分体底靴手提电圆锯", theme: "现代", itemType: "器物", tags: ["手持电圆锯", "木工圆锯", "电动木工工具"], create: () => {
    const parts: ModelPart[] = [box("左侧宽底靴", [-0.055, 0.025, 0], [0.19, 0.025, 0.32], transportColors.body), box("刀片右侧狭底靴", [0.145, 0.025, 0], [0.045, 0.025, 0.32], transportColors.body), ...[-1, 1].map(end => box("跨过锯片槽前后端的底靴横桥", [0.03, 0.025, end * 0.15], [0.28, 0.025, 0.025])), ring("带中心轴孔的薄木工圆锯片", transportColors.trim, 0.095, 0.08, 0, 0.004, { position: { x: 0.1, y: 0.11, z: -0.02 }, rotation: { x: 0, y: 0, z: 90 } }), ring("自动下护罩的窄缘护圈", transportColors.dark, 0.107, 0.01, 0, 0.025, { position: { x: 0.1, y: 0.11, z: -0.02 }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("固定刀片的主轴压盘", [0.105, 0.11, -0.02], [0.038, 0.045, 0.038], transportColors.dark, [0, 0, 90]), cylinder("横向驱动锯片的电机", [-0.04, 0.15, -0.02], [0.12, 0.16, 0.12], transportColors.signal, [0, 0, 90]), cylinder("电机至锯片的输出横轴", [0.035, 0.11, -0.02], [0.03, 0.16, 0.03], transportColors.dark, [0, 0, 90]), part("上侧操作主握把", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.018, path: [{ x: -0.035, y: 0.17, z: -0.01 }, { x: -0.035, y: 0.3, z: 0.04 }, { x: -0.035, y: 0.3, z: 0.19 }, { x: -0.035, y: 0.14, z: 0.14 }] }), cylinder("前侧辅助圆握钮", [-0.075, 0.235, -0.1], [0.065, 0.1, 0.065], transportColors.dark), strut("前辅助握钮承托座", [-0.075, 0.18, -0.1], [-0.075, 0.11, -0.1], 0.04), box("后方可锁定切深的弧形导架", [-0.05, 0.12, 0.13], [0.045, 0.19, 0.04])];
    return parts;
  } },
  { name: "长行程扁刃电动往复锯", theme: "现代", itemType: "器物", tags: ["马刀锯", "电动往复锯", "电动木工工具"], create: () => {
    const blade = [{ x: 0, y: 0.045 }, { x: 0.35, y: 0.045 }, { x: 0.39, y: 0 }];
    for (let index = 12; index >= 0; index--) blade.push({ x: index * 0.028, y: -0.025 }, { x: Math.max(0, index * 0.028 - 0.012), y: -0.04 });
    blade.pop();
    const parts: ModelPart[] = [box("封闭电机与曲柄导杆机身", [0, 0.17, 0.03], [0.13, 0.2, 0.37], transportColors.signal), box("前端握持减振软胶套", [0, 0.17, -0.12], [0.14, 0.21, 0.13], transportColors.dark), part("前伸且实际具锯齿的窄扁锯条", "extrude", transportColors.trim, [0, 0.17, -0.2], [1, 1, 1], [0, 90, 0], { profile: blade, depth: 0.0025 }), ...[-1, 1].map(side => box("护靴中央锯条孔的两侧边框", [side * 0.055, 0.16, -0.21], [0.02, 0.2, 0.035])), ...[-1, 1].map(end => box("护靴上下连接横边", [0, 0.16 + end * 0.09, -0.21], [0.11, 0.02, 0.035])), part("后部真实穿手的D形握把", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.024, path: [{ x: 0, y: 0.24, z: 0.18 }, { x: 0, y: 0.3, z: 0.38 }, { x: 0, y: 0.12, z: 0.46 }, { x: 0, y: 0.07, z: 0.22 }] }), box("尾端动力电池", [0, 0.11, 0.23], [0.14, 0.16, 0.14], transportColors.body)];
    return parts;
  } },
  { name: "双底板调深手持电刨", theme: "现代", itemType: "器物", tags: ["电动手刨", "手提电刨", "电动木工工具"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].map(end => box("刀轴前后分离的金属刨底板", [0, 0.025, end * 0.09], [0.16, 0.025, 0.14], transportColors.body)), cylinder("两底板之间的横向切削刀轴", [0, 0.06, 0], [0.06, 0.13, 0.06], transportColors.dark, [0, 0, 90]), cylinder("横向布置的高速驱动电机", [0, 0.15, 0.015], [0.15, 0.17, 0.15], transportColors.signal, [0, 0, 90]), box("外侧皮带传动保护匣", [0.105, 0.11, 0.01], [0.045, 0.17, 0.17], transportColors.dark), part("跨后部机身的操作握把", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.016, path: [{ x: 0, y: 0.17, z: -0.015 }, { x: 0, y: 0.3, z: 0.035 }, { x: 0, y: 0.3, z: 0.14 }, { x: 0, y: 0.09, z: 0.14 }] }), cylinder("前底板刨深调节升降杆", [0, 0.075, -0.1], [0.03, 0.09, 0.03]), cylinder("调深兼前手辅助握钮", [0, 0.145, -0.1], [0.075, 0.075, 0.075], transportColors.dark), part("侧面排出木屑的贯通出口", "lathe", transportColors.dark, [-0.11, 0.16, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0.035, y: -0.065 }, { x: 0.035, y: 0.065 }, { x: 0.025, y: 0.065 }, { x: 0.025, y: -0.065 }, { x: 0.035, y: -0.065 }] })];
    for (const degrees of [0, 180]) { const angle = degrees * Math.PI / 180; parts.push(box("嵌在刀轴对侧的直线刨刃", [0, 0.06 + Math.cos(angle) * 0.029, Math.sin(angle) * 0.029], [0.13, 0.006, 0.015], transportColors.trim, [degrees, 0, 0])); }
    return parts;
  } },
  { name: "双滚筒闭合砂带手提砂磨机", theme: "现代", itemType: "器物", tags: ["手提砂带机", "手持砂带砂光机", "电动木工工具"], create: () => {
    const belt = polygon("两端圆弧且中间贯通的连续砂带", transportColors.wood, beltProfile(0.045), 0.15, [0.075, 0.065, 0], [beltProfile(0.041)]);
    belt.rotation.z = 90;
    const parts: ModelPart[] = [belt, ...[-1, 1].map(end => cylinder("砂带内侧承载与张紧滚筒", [0, 0.065, end * 0.12], [0.082, 0.14, 0.082], transportColors.dark, [0, 0, 90])), box("两滚筒间支承底带的压磨板", [0, 0.03, 0], [0.14, 0.012, 0.23], transportColors.body), box("砂带上方电机机身", [0, 0.16, 0.035], [0.14, 0.15, 0.22], transportColors.signal), box("外侧传动齿带护匣", [0.09, 0.12, 0.05], [0.045, 0.16, 0.22], transportColors.dark), part("后方可穿手的主握把", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.015, path: [{ x: 0, y: 0.21, z: 0.02 }, { x: 0, y: 0.3, z: 0.13 }, { x: 0, y: 0.22, z: 0.24 }, { x: 0, y: 0.11, z: 0.18 }] }), cylinder("前端下压辅助圆握柄", [0, 0.205, -0.11], [0.065, 0.12, 0.065], transportColors.dark), strut("前端张紧调节拨杆", [0.08, 0.1, -0.1], [0.13, 0.13, -0.16], 0.012), box("后侧收集磨屑的软袋", [-0.13, 0.15, 0.2], [0.14, 0.1, 0.22], transportColors.body)];
    parts.push(strut("收尘软袋与机身的连接颈", [-0.13, 0.15, 0.2], [-0.04, 0.15, 0.12], 0.04));
    return parts;
  } },
];
