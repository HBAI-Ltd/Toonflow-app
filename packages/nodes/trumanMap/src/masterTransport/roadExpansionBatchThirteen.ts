import { part, ring, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 独立完整生产总成，不把同一矿卡的拆车/缺斗状态作为新车辆。
// https://www.wabteccorp.com/mining/electric-drive-systems
// https://www.philsystems.com/bodies
export const roadExpansionBatchThirteen: TransportDefinition[] = [
  { name: "带轮边减速和制动器的矿用电动轮总成", theme: "现代", itemType: "构件", tags: ["矿用电动轮", "牵引电机轮边驱动", "完整驱动生产总成"], create: () => {
    const parts: ModelPart[] = [part("具有真实中心开口和内腔的厚侧壁工程轮胎", "lathe", transportColors.dark, [0, 1.8, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0.8, y: -0.625 }, { x: 1.5, y: -0.625 }, { x: 1.76, y: -0.45 }, { x: 1.8, y: -0.25 }, { x: 1.8, y: 0.25 }, { x: 1.76, y: 0.45 }, { x: 1.5, y: 0.625 }, { x: 0.8, y: 0.625 }, { x: 0.8, y: 0.53 }, { x: 1.45, y: 0.53 }, { x: 1.64, y: 0.37 }, { x: 1.66, y: 0.2 }, { x: 1.66, y: -0.2 }, { x: 1.64, y: -0.37 }, { x: 1.45, y: -0.53 }, { x: 0.8, y: -0.53 }, { x: 0.8, y: -0.625 }] }), ring("支承轮胎内侧胎圈的中空钢轮辋", transportColors.body, 0.8, 0.08, 0, 1.12, { position: { x: 0, y: 1.8, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("位于轮内的密闭行星轮边减速壳", [0.45, 1.8, 0], [1.15, 0.65, 1.15], transportColors.body, [0, 0, 90]), cylinder("车内侧独立牵引电机外壳", [-0.92, 1.8, 0], [0.75, 0.9, 0.75], transportColors.dark, [0, 0, 90]), cylinder("从牵引电机通往行星减速壳的同轴传动管", [-0.15, 1.8, 0], [0.26, 1.3, 0.26], transportColors.trim, [0, 0, 90]), cylinder("电动轮内侧连接车架的安装法兰", [-1.4, 1.8, 0], [0.92, 0.1, 0.92], transportColors.body, [0, 0, 90]), box("电机高压电缆独立接线盒", [-0.95, 2.22, 0], [0.48, 0.18, 0.35], transportColors.signal), ring("减速壳外端密闭多盘制动组件的承载环", transportColors.dark, 0.6, 0.1, 0, 0.15, { position: { x: 0.78, y: 1.8, z: 0 }, rotation: { x: 0, y: 0, z: 90 } })];
    for (const side of [-1, 1]) parts.push(ring("夹住胎圈且保持中心开口的钢轮缘", transportColors.body, 0.87, 0.12, 0, 0.06, { position: { x: side * 0.56, y: 1.8, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }));
    for (let index = 0; index < 6; index++) {
      const angle = index * Math.PI / 3;
      parts.push(strut("从轮边减速壳向钢轮辋传力的独立辐板", [0.6, 1.8 + Math.cos(angle) * 0.5, Math.sin(angle) * 0.5], [0.6, 1.8 + Math.cos(angle) * 0.78, Math.sin(angle) * 0.78], 0.11, transportColors.body), box("电机外周连续轴向散热筋", [-0.92, 1.8 + Math.cos(angle) * 0.39, Math.sin(angle) * 0.39], [0.8, 0.055, 0.055], transportColors.body, [index * 60, 0, 0]), cylinder("车架安装法兰上的独立螺柱", [-1.47, 1.8 + Math.cos(angle) * 0.35, Math.sin(angle) * 0.35], [0.045, 0.14, 0.045], transportColors.trim, [0, 0, 90]));
    }
    for (let tread = 0; tread < 16; tread++) {
      const degrees = tread * 22.5, angle = degrees * Math.PI / 180;
      for (const side of [-1, 1]) parts.push(box("工程轮胎两侧错向人字形实体胎块", [side * 0.28, 1.8 + Math.cos(angle) * 1.79, Math.sin(angle) * 1.79], [0.56, 0.1, 0.23], transportColors.dark, [degrees, side * 25, 0]));
    }
    return parts;
  } },
  { name: "高前挡与驾驶室防护罩自卸矿车承载矿斗", theme: "现代", itemType: "构件", tags: ["独立矿车矿斗", "载荷车斗生产件", "防护罩举升耳与尾铰座"], create: () => {
    const parts: ModelPart[] = [box("矿斗连续耐磨承载底板", [0, 0.22, 0], [4.8, 0.4, 6.5], transportColors.dark), part("由底部向两侧扩开的高前挡料板", "extrude", transportColors.signal, [0, 0, -3.2], [1, 1, 1], [0, 0, 0], { depth: 0.14, profile: [{ x: -2.4, y: 0.4 }, { x: 2.4, y: 0.4 }, { x: 2.94, y: 4.0 }, { x: -2.94, y: 4.0 }] }), box("向前伸出覆盖驾驶室的完整防护罩", [0, 4.05, -4.13], [6.15, 0.18, 2.1], transportColors.body)];
    for (const side of [-1, 1]) {
      parts.push(surface("高前低后并向外倾斜的实际薄侧壁", transportColors.signal, [[side * 2.4, 0.4, -3.2], [side * 2.4, 0.4, 3.2], [side * 2.805, 3.1, 3.2], [side * 2.94, 4.0, -3.2]], [0, 1, 2, 0, 2, 3]), strut("前挡料板与驾驶室上方防护罩之间的支撑", [side * 2.0, 2.7, -3.2], [side * 2.0, 3.96, -4.65], 0.16, transportColors.body), ring("矿斗尾部真正贯通的承重翻转铰座", transportColors.body, 0.18, 0.08, 0, 0.25, { position: { x: side * 1.6, y: -0.1, z: 2.75 }, rotation: { x: 0, y: 0, z: 90 } }), box("把尾部环形铰座焊接到斗底的承托座", [side * 1.6, 0.05, 2.75], [0.32, 0.06, 0.36], transportColors.body), ring("斗底前部连接举升缸的真实穿销耳", transportColors.body, 0.15, 0.065, 0, 0.2, { position: { x: side * 0.9, y: -0.06, z: -1.7 }, rotation: { x: 0, y: 0, z: 90 } }), box("举升缸耳至斗底的独立连接鞍", [side * 0.9, 0.065, -1.7], [0.25, 0.07, 0.3], transportColors.body));
      for (const z of [-2.0, 0, 2.0]) {
        const top = 4 - (z + 3.2) * 0.9 / 6.4;
        parts.push(strut("矿斗外侧沿真实倾壁连接的加强肋", [side * 2.42, 0.45, z], [side * (2.4 + 0.15 * (top - 0.4) + 0.02), top - 0.1, z], 0.12, transportColors.body));
      }
    }
    return parts;
  } },
];
