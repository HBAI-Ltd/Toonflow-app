import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, wheel, cab, transportColors, type TransportDefinition } from "./parts";

// 参考真实载体类别；只是原创静态场景造型，不声明装甲等级或运动仿真。
// https://www.army.mil/article/31169/driver_course_prepares_troops_for_new_m_atv
// https://tractorpulling.co.uk/pulling-sledge
export const roadExpansionBatchSix: TransportDefinition[] = [
  { name: "中空V形承载壳轮式防护输送车", theme: "现代", tags: ["V形底盘防护车", "高离地乘员舱", "尾部登车坡道"], create: () => {
    const parts: ModelPart[] = [part("贯通前后乘员舱下方的真正双壁V形底壳", "extrude", transportColors.body, [0, 0, 0.55], [1, 1, 1], [0, 0, 0], { depth: 4.1, profile: [{ x: -1.05, y: 1.75 }, { x: -1.05, y: 1.25 }, { x: 0, y: 0.75 }, { x: 1.05, y: 1.25 }, { x: 1.05, y: 1.75 }, { x: 0.95, y: 1.75 }, { x: 0.95, y: 1.33 }, { x: 0, y: 0.89 }, { x: -0.95, y: 1.33 }, { x: -0.95, y: 1.75 }] }), box("V形壳之上与底部空间分开的平乘员地板", [0, 1.58, 0.55], [1.96, 0.11, 4.05], transportColors.dark), box("前置动力舱封闭机罩", [0, 1.45, -2.17], [1.55, 0.8, 1.8], transportColors.body), box("乘员舱上部封闭顶板", [0, 2.96, 0.55], [2.24, 0.16, 4.14], transportColors.body), box("前后乘员舱下方纵向承力脊", [0, 0.86, 0.55], [0.18, 0.2, 3.9], transportColors.dark), box("高位前保险杠", [0, 1.12, -3.14], [2.1, 0.28, 0.25], transportColors.dark), box("发动机舱前方散热格栅", [0, 1.47, -3.085], [1.22, 0.56, 0.045], transportColors.dark), box("驾驶风挡下部封闭横墙", [0, 1.77, -1.51], [2.12, 0.32, 0.1], transportColors.body), { ...box("驾驶室前方双幅风挡的实际玻璃", [0, 2.4, -1.53], [1.96, 0.85, 0.045], transportColors.glass), opacity: 0.43 }, box("驾驶风挡中央承重隔柱", [0, 2.4, -1.56], [0.085, 0.93, 0.08], transportColors.body), box("驾驶风挡上部结构横梁", [0, 2.88, -1.52], [2.15, 0.12, 0.15], transportColors.body), box("尾部登车口上方横梁", [0, 2.85, 2.6], [2.15, 0.18, 0.15], transportColors.body), part("底端真正接地的楔厚登车坡道", "extrude", transportColors.body, [0, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 1.7, profile: [{ x: 2.58, y: 1.61 }, { x: 4.3, y: 0.06 }, { x: 4.3, y: 0 }, { x: 2.58, y: 1.52 }] }), cylinder("把登车坡道接到尾舱地板的横向铰轴", [0, 1.58, 2.61], [0.13, 1.92, 0.13], transportColors.dark, [0, 0, 90])];
    for (const z of [-2.12, 1.94]) {
      parts.push(cylinder("高离地车桥的共用横轴", [0, 0.58, z], [0.13, 2.3, 0.13], transportColors.dark, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(...wheel([side * 1.15, 0.58, z], 0.58, 0.34), strut("轮轴到V形壳两侧的独立承重支臂", [side * 0.72, 0.58, z], [side * 0.72, 1.16, z], 0.1, transportColors.dark), box("与轮胎保持上方间隙的防溅翼板", [side * 1.13, 1.3, z], [0.57, 0.07, 1.38], transportColors.body));
    }
    for (const z of [-1.48, 2.55]) parts.push(part("封闭底部V形腔而保留上方乘员入口的端隔板", "extrude", transportColors.body, [0, 0, z], [1, 1, 1], [0, 0, 0], { depth: 0.09, profile: [{ x: -1.03, y: 1.6 }, { x: -1.03, y: 1.27 }, { x: 0, y: 0.78 }, { x: 1.03, y: 1.27 }, { x: 1.03, y: 1.6 }] }));
    for (const side of [-1, 1]) {
      const holes: [number, number][][] = [[-1.23, -0.31], [0.12, 1.0], [1.4, 2.3]].map(([a, b]) => [[2.17, a!], [2.65, a!], [2.65, b!], [2.17, b!]]);
      const wall = polygon("在承重侧壳上真正开出的三组乘员窗孔", transportColors.body, [[1.65, -1.5], [2.9, -1.5], [2.9, 2.6], [1.65, 2.6]], 0.08, [side * 1.05 + (side > 0 ? 0.08 : 0), 0, 0], holes);
      wall.rotation.z = 90;
      parts.push(wall, box("尾部开放登车口的独立竖向门框", [side * 1.0, 2.22, 2.6], [0.13, 1.4, 0.15], transportColors.dark), box("沿乘员舱侧面安装的长条座面", [side * 0.67, 1.83, 0.9], [0.48, 0.15, 2.8], transportColors.dark), box("乘员侧座与侧壳之间的竖向靠背", [side * 0.9, 2.15, 0.9], [0.09, 0.6, 2.8], transportColors.dark));
      for (const z of [-0.77, 0.56, 1.85]) parts.push({ ...box("嵌入真实侧窗孔的厚玻璃", [side * 1.09, 2.41, z], [0.028, 0.52, 0.96], transportColors.glass), opacity: 0.43 });
      parts.push(strut("尾坡道两侧的支承拉索", [side * 0.95, 2.22, 2.6], [side * 0.78, 0.42, 3.98], 0.015, transportColors.trim));
    }
    return parts;
  } },
  { name: "轨上移重箱式牵引比赛阻力滑橇", theme: "现代", itemType: "运动用品", tags: ["牵引比赛滑橇", "滑盘移重阻力", "后轮驱动移重箱"], create: () => {
    const parts: ModelPart[] = [part("前端翘起且整片接地的宽承压滑盘", "extrude", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 2.65, profile: [{ x: -4.1, y: 0.42 }, { x: -4.0, y: 0.12 }, { x: -3.6, y: 0 }, { x: -1.3, y: 0 }, { x: -1.3, y: 0.1 }, { x: -3.6, y: 0.1 }, { x: -3.9, y: 0.21 }, { x: -4.0, y: 0.46 }] }), ...[-1, 1].map(side => box("从滑盘延伸到后轮的纵向车架", [side * 0.86, 0.63, 0.03], [0.18, 0.27, 7.55], transportColors.body)), cylinder("后部接地轮组共用轴", [0, 0.55, 2.7], [0.13, 2.2, 0.13], transportColors.dark, [0, 0, 90]), ...[-1, 1].flatMap(side => wheel([side * 1.1, 0.55, 2.7], 0.55, 0.38)), ...cab([0, 1.05, 3.48], [1.08, 1.35, 1.15]), box("操作者舱下方与纵梁相连的承托台", [0, 0.94, 3.48], [1.03, 0.55, 1.1], transportColors.body), box("移重车的薄底架", [0, 1.13, 1.45], [2.0, 0.13, 2.1], transportColors.dark), box("移重箱内部承托配重块的底板", [0, 1.27, 1.45], [1.97, 0.16, 2.03], transportColors.body), ...[-1, 1].map(side => box("移重箱两侧开放上口的薄侧板", [side * 0.99, 1.77, 1.45], [0.09, 0.9, 2.05], transportColors.signal)), ...[-1, 1].map(end => box("移重箱前后端板", [0, 1.77, 1.45 + end * 1.01], [2.05, 0.9, 0.09], transportColors.signal)), ring("滑盘前端连接比赛牵引车的贯通拖环", transportColors.body, 0.15, 0.055, 0.25, 0.09, { position: { x: 0, y: 0.25, z: -4.68 } }), cylinder("从后轮轴取力的减速箱", [0, 0.67, 2.7], [0.45, 0.3, 0.45], transportColors.signal, [0, 0, 90]), strut("由轮轴减速箱送往移重链的竖向传动轴", [0, 0.67, 2.7], [0, 0.88, 3.25], 0.08, transportColors.body), box("把移重箱底架扣在传动链上的连接耳", [0, 1.02, 1.45], [0.12, 0.28, 0.13], transportColors.body)];
    for (const side of [-1, 1]) {
      parts.push(box("移重轮沿全长滚动的独立轨道", [side * 0.86, 0.79, -0.03], [0.16, 0.12, 7.2], transportColors.dark), strut("从滑盘前端通往拖环的V形牵引杆", [side * 0.65, 0.2, -3.95], [0, 0.25, -4.6], 0.1, transportColors.body), strut("移重轨道前端至承压滑盘的竖向支架", [side * 0.86, 0.58, -3.2], [side * 0.86, 0.12, -3.2], 0.13, transportColors.body));
      for (const z of [0.75, 2.15]) parts.push(cylinder("承托移重箱并压在轨道顶面的滚轮", [side * 0.86, 0.97, z], [0.24, 0.12, 0.24], transportColors.body, [0, 0, 90]));
    }
    for (const x of [-0.48, 0.48]) for (const z of [1.0, 1.85]) parts.push(box("收纳在移重箱内的实体压铁", [x, 1.58, z], [0.78, 0.46, 0.7], transportColors.dark));
    parts.push(part("前后链轮间形成闭环的移重驱动链", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.009, path: [{ x: 0, y: 0.93, z: -3.5 }, { x: 0, y: 0.93, z: 3.2 }, { x: 0, y: 0.83, z: 3.35 }, { x: 0, y: 0.73, z: 3.2 }, { x: 0, y: 0.73, z: -3.5 }, { x: 0, y: 0.83, z: -3.65 }, { x: 0, y: 0.93, z: -3.5 }] }));
    for (const z of [-3.55, 3.25]) parts.push(cylinder("移重链前后端支承链轮", [0, 0.83, z], [0.19, 0.07, 0.19], transportColors.body, [0, 0, 90]), box("把链轮轴承座固定到双纵梁的横撑", [0, 0.69, z], [1.9, 0.12, 0.25], transportColors.body));
    return parts;
  } },
];
