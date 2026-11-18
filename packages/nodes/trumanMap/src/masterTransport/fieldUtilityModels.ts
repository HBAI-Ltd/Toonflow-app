import { part, type ModelPart } from "../assetModelParts";
import { axles, box, cylinder, helicalFlight, strut, surface, transportColors, type TransportDefinition } from "./parts";

export const fieldUtilityModels: TransportDefinition[] = [
  { name: "手扶双级螺旋集雪抛雪机", theme: "现代", tags: ["手扶抛雪机", "双向集雪绞龙", "道路除雪"], create: () => {
    const parts: ModelPart[] = [...axles(0.65, [0.48], 0.23), box("双轮间动力传动底箱", [0, 0.31, 0.4], [0.56, 0.25, 0.58]), box("独立汽油发动机罩", [0, 0.58, 0.46], [0.44, 0.38, 0.42], transportColors.signal), box("前端集雪斗后壁", [0, 0.32, -0.29], [0.9, 0.57, 0.07], transportColors.signal), ...[-1, 1].map(side => box("集雪斗侧壁与耐磨滑靴", [side * 0.46, 0.32, -0.5], [0.06, 0.58, 0.48], transportColors.signal)), box("贴地水平铲雪刃", [0, 0.055, -0.7], [0.9, 0.055, 0.12], transportColors.trim), cylinder("贯穿集雪斗的横轴", [0, 0.31, -0.51], [0.07, 0.87, 0.07], transportColors.dark, [0, 0, 90]), cylinder("后方叶轮抛雪室", [0, 0.4, -0.19], [0.38, 0.24, 0.38], transportColors.dark, [90, 0, 0]), part("从叶轮室向上再侧出的抛雪管", "tube", transportColors.signal, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.115, path: [{ x: 0, y: 0.45, z: -0.17 }, { x: 0, y: 0.85, z: -0.17 }, { x: 0.2, y: 1.08, z: -0.17 }, { x: 0.42, y: 1.08, z: -0.17 }] }), surface("抛雪口上缘导向片", transportColors.trim, [[0.3, 1.17, -0.29], [0.6, 1.2, -0.29], [0.6, 1.2, -0.05], [0.3, 1.17, -0.05]], [0, 1, 2, 0, 2, 3])];
    for (const side of [-1, 1]) {
      const flight = helicalFlight([side < 0 ? -0.43 : 0.06, 0.31, -0.51], 0.035, 0.23, 0.37, 1.5, side < 0 ? 1 : -1, 0.025);
      flight.rotation.z = -90;
      parts.push(flight, strut("向操作者后上方延伸的双把", [side * 0.22, 0.4, 0.48], [side * 0.27, 1.05, 1.05], 0.035));
    }
    parts.push(strut("双把上部横握杆", [-0.27, 1.05, 1.05], [0.27, 1.05, 1.05], 0.045, transportColors.dark), box("前进与抛雪控制拨杆面板", [0, 1, 0.97], [0.42, 0.045, 0.19], transportColors.signal));
    return parts;
  } },
  { name: "移动桁架压实棉花模块成型箱", theme: "现代", tags: ["棉花模块打包机", "往复压棉箱", "农业机械"], create: () => {
    const parts: ModelPart[] = [box("棉花成型箱底承载板", [0, 0.69, 0], [2.55, 0.16, 5.5], transportColors.dark), ...axles(2.95, [1.45], 0.55), ...[-1, 1].map(side => box("竖直连续压棉侧墙", [side * 1.3, 1.92, 0], [0.14, 2.4, 5.6], transportColors.signal)), box("箱前端封挡", [0, 1.92, -2.76], [2.6, 2.4, 0.12], transportColors.signal), box("后端可整幅开门的卸包挡板", [0, 1.92, 2.76], [2.6, 2.4, 0.12], transportColors.signal), ...[-1, 1].map(side => box("侧墙顶端移动桁架导轨", [side * 1.3, 3.18, 0], [0.17, 0.15, 5.7], transportColors.dark)), box("可沿长箱移动的压实小车顶梁", [0, 3.6, -0.45], [2.95, 0.24, 0.65]), ...[-1, 1].map(side => strut("桁架小车两侧立脚", [side * 1.4, 3.4, -0.45], [side * 1.4, 3.55, -0.45], 0.15)), cylinder("中央向下工作的压棉液压缸", [0, 3.3, -0.45], [0.22, 1.25, 0.22]), cylinder("压棉缸下伸活塞杆", [0, 2.57, -0.45], [0.12, 0.7, 0.12], transportColors.trim), box("箱内可下行的宽压棉板", [0, 2.2, -0.45], [2.3, 0.16, 0.9], transportColors.dark), strut("前伸牵引长梁", [0, 0.73, -2.75], [0, 0.63, -4.3], 0.16), cylinder("前支撑落地升降支腿", [0, 0.33, -3.9], [0.11, 0.6, 0.11]), box("支腿落地板", [0, 0.06, -3.9], [0.35, 0.12, 0.3], transportColors.dark)];
    for (const side of [-1, 1]) {
      for (const z of [-2.3, -0.8, 0.8, 2.3]) parts.push(box("两侧承受棉包横向压力的外肋", [side * 1.4, 1.93, z], [0.14, 2.4, 0.12]));
      parts.push(box("连接两导轨轮与立脚的行走小车侧梁", [side * 1.4, 3.405, -0.455], [0.14, 0.12, 0.7]));
      for (const z of [-0.68, -0.23]) parts.push(cylinder("桁架小车贴导轨行走轮", [side * 1.3, 3.355, z], [0.2, 0.08, 0.2], transportColors.dark, [0, 0, 90]));
    }
    return parts;
  } },
  { name: "双仓独立计量种肥转运拖车", theme: "现代", tags: ["种肥补给车", "种子转运车", "气力输送"], create: () => {
    const parts: ModelPart[] = [box("双仓承重底盘", [0, 0.82, 0], [2.2, 0.22, 4.2]), ...axles(2.4, [-1.15, 1.15], 0.5), ...[-1, 1].flatMap(end => [-1, 1].map(side => strut("仓体承重斜腿", [side * 0.9, 0.9, end * 1.1], [side * 0.68, 1.95, end * 1.1], 0.11))), strut("前部牵引杆", [0, 0.82, -2], [0, 0.65, -3.2], 0.13), cylinder("牵引杆落地支腿", [0, 0.33, -2.7], [0.1, 0.62, 0.1]), box("支腿落地底垫", [0, 0.04, -2.7], [0.25, 0.08, 0.25], transportColors.dark), cylinder("侧面气送离心鼓风机", [1.2, 1.12, 0], [0.65, 0.35, 0.65], transportColors.signal, [0, 0, 90]), box("风机驱动电机", [1.47, 1.12, 0], [0.25, 0.3, 0.35], transportColors.dark), part("种肥输送软管停放弯段", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.09, path: [{ x: 1.2, y: 1.4, z: 0 }, { x: 1.3, y: 2, z: 0.4 }, { x: 1.28, y: 2.3, z: 1.4 }, { x: 1.15, y: 1.2, z: 2.1 }] })];
    for (const end of [-1, 1]) {
      parts.push(part("真实开口且向下收分的独立储料仓", "lathe", transportColors.trim, [0, 0, end * 1.05], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.12, y: 1.02 }, { x: 0.82, y: 1.98 }, { x: 0.82, y: 3.38 }, { x: 0.76, y: 3.38 }, { x: 0.76, y: 2.02 }, { x: 0.065, y: 1.02 }, { x: 0.12, y: 1.02 }] }), box("仓底单独调节的计量阀", [0, 1.03, end * 1.05], [0.32, 0.2, 0.3], transportColors.signal), part("计量阀至风机的独立进料管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.065, path: [{ x: 0.12, y: 1.03, z: end * 1.05 }, { x: 0.6, y: 1.03, z: end * 1.05 }, { x: 0.9, y: 1.12, z: 0 }, { x: 1.2, y: 1.12, z: 0 }] }));
    }
    parts.push(strut("停放软管的后部承托架", [1.1, 0.85, 1.8], [1.15, 1.15, 2.1], 0.055));
    return parts;
  } },
];
