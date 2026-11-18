import { part, ring, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

export const aeroEngineModels: TransportDefinition[] = [
  { name: "分流环道式航空涡扇发动机", theme: "现代", itemType: "构件", tags: ["高涵道涡扇发动机", "航空动力", "风扇与独立核心"], create: () => {
    const parts: ModelPart[] = [part("保留贯通外涵道的薄壁短舱", "lathe", transportColors.body, [0, 1.1, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.88, y: -1.5 }, { x: 0.98, y: -1.3 }, { x: 0.94, y: 0.9 }, { x: 0.7, y: 1.6 }, { x: 0.65, y: 1.6 }, { x: 0.85, y: 0.85 }, { x: 0.87, y: -1.28 }, { x: 0.8, y: -1.5 }, { x: 0.88, y: -1.5 }] }), cylinder("风扇中央承载轮毂", [0, 1.1, -1.13], [0.4, 0.2, 0.4], transportColors.dark, [90, 0, 0]), part("进气端向前收尖的整流锥", "cone", transportColors.trim, [0, 1.1, -1.37], [0.32, 0.4, 0.32], [-90, 0, 0]), cylinder("与外涵道分离的中央核心包壳", [0, 1.1, 0.05], [0.7, 1.8, 0.7], transportColors.dark, [90, 0, 0]), part("中央热流喷口的真实薄壁收分环", "lathe", transportColors.dark, [0, 1.1, 1.28], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.35, y: -0.35 }, { x: 0.24, y: 0.52 }, { x: 0.19, y: 0.52 }, { x: 0.29, y: -0.35 }, { x: 0.35, y: -0.35 }] }), ring("风扇机匣环状内衬", transportColors.dark, 0.88, 0.08, 0, 0.08, { position: { x: 0, y: 1.1, z: -1.13 }, rotation: { x: 90, y: 0, z: 0 } }), box("顶部发动机吊挂安装座", [0, 2.15, 0.1], [0.4, 0.5, 1], transportColors.trim)];
    parts.push(cylinder("连接风扇轮毂与核心的低压轴", [0, 1.1, -0.94], [0.1, 0.5, 0.1], transportColors.dark, [90, 0, 0]));
    for (let index = 0; index < 12; index++) parts.push(part("沿径向扫掠的独立风扇叶片", "extrude", transportColors.trim, [0, 1.1, -1.13], [1, 1, 1], [0, 0, index * 30], { depth: 0.028, profile: [{ x: 0.18, y: -0.055 }, { x: 0.48, y: -0.02 }, { x: 0.78, y: 0.08 }, { x: 0.75, y: 0.2 }, { x: 0.43, y: 0.08 }, { x: 0.18, y: 0.015 }] }));
    for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3; parts.push(strut("跨外涵道连接核心与短舱的导流支板", [Math.cos(angle) * 0.34, 1.1 + Math.sin(angle) * 0.34, 0.5], [Math.cos(angle) * 0.92, 1.1 + Math.sin(angle) * 0.92, 0.5], 0.055, transportColors.body)); }
    return parts;
  } },
  { name: "星形气冷活塞航空发动机", theme: "欧式", itemType: "构件", tags: ["径向航空发动机", "星形活塞机", "气冷散热肋"], create: () => {
    const parts: ModelPart[] = [cylinder("中央圆形曲轴箱", [0, 1.3, 0], [0.56, 0.5, 0.56], transportColors.body, [90, 0, 0]), cylinder("后部机匣与附件减速匣", [0, 1.3, 0.38], [0.46, 0.35, 0.46], transportColors.dark, [90, 0, 0]), cylinder("前部螺旋桨输出轴", [0, 1.3, -0.35], [0.12, 0.32, 0.12], transportColors.dark, [90, 0, 0]), cylinder("固定双叶桨的金属轮毂", [0, 1.3, -0.48], [0.25, 0.1, 0.25], transportColors.trim, [90, 0, 0])];
    for (let index = 0; index < 7; index++) {
      const degrees = index * 360 / 7, angle = degrees * Math.PI / 180, x = Math.cos(angle), y = Math.sin(angle);
      parts.push(cylinder("沿曲轴箱周向外伸的活塞汽缸", [x * 0.46, 1.3 + y * 0.46, 0], [0.18, 0.4, 0.18], transportColors.dark, [0, 0, degrees - 90]), cylinder("汽缸外端带气门的缸盖", [x * 0.7, 1.3 + y * 0.7, 0], [0.25, 0.14, 0.25], transportColors.body, [0, 0, degrees - 90]));
      parts.push(box("连接两根推杆与缸盖的气门摇臂罩", [x * 0.7, 1.3 + y * 0.7, -0.14], [0.17, 0.09, 0.1], transportColors.body, [0, 0, degrees - 90]));
      for (const radius of [0.39, 0.5, 0.61]) parts.push(ring("围绕每只汽缸的独立散热薄肋", transportColors.body, 0.125, 0.034, 0, 0.025, { position: { x: x * radius, y: 1.3 + y * radius, z: 0 }, rotation: { x: 0, y: 0, z: degrees - 90 } }));
      for (const side of [-1, 1]) parts.push(strut("从曲轴箱凸轮环伸到气门头的推杆", [x * 0.22 - y * side * 0.045, 1.3 + y * 0.22 + x * side * 0.045, -0.22], [x * 0.7 - y * side * 0.045, 1.3 + y * 0.7 + x * side * 0.045, -0.16], 0.018, transportColors.trim));
      parts.push(part("从后部汇入汽缸的弯曲进气管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.035, path: [{ x: x * 0.15, y: 1.3 + y * 0.15, z: 0.4 }, { x: x * 0.48, y: 1.3 + y * 0.48, z: 0.35 }, { x: x * 0.65, y: 1.3 + y * 0.65, z: 0.09 }] }));
    }
    for (const degrees of [0, 180]) parts.push(part("外宽内窄且前缘连续的独立桨叶", "extrude", transportColors.wood, [0, 1.3, -0.48], [1, 1, 1], [0, 0, degrees], { depth: 0.035, profile: [{ x: -0.035, y: 0.1 }, { x: -0.09, y: 0.55 }, { x: -0.1, y: 1.05 }, { x: -0.045, y: 1.2 }, { x: 0.025, y: 1.19 }, { x: 0.095, y: 0.95 }, { x: 0.085, y: 0.48 }, { x: 0.035, y: 0.1 }] }));
    return parts;
  } },
];
