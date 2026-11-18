import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon, tapered } from "../masterNature/shared";
import { cylinderBetween } from "./aerospaceExpansionBatchFour";
import { sweptWing } from "./aerospaceExpansionBatchFive";
import { ball, box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 公开结构类别的原创外观总成，不是制造模型，也不模拟推进、自动对接或机翼驱动。
// https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/liquid-rocket-engine/
// https://ntrs.nasa.gov/citations/20170000501
// https://www.esa.int/ESA_Multimedia/Images/2017/04/The_International_Berthing_Docking_Mechanism
// https://www.nasa.gov/centers-and-facilities/armstrong/nasa-armstrong-fact-sheet-x-5-research-aircraft/
export const aerospaceExpansionBatchSeventeen: TransportDefinition[] = [
  { name: "钟形推力室外置泵管液体火箭发动机总成", theme: "现代", itemType: "构件", tags: ["独立火箭发动机", "真正中空钟形推力室", "外置泵壳与管路", "完整大型飞行部件"], create: () => {
    const parts: ModelPart[] = [part("从上部腔体经收缩喉部连续过渡至大开口的双壁推力室", "lathe", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.75, y: 0 }, { x: 1.85, y: 0 }, { x: 1.65, y: 0.6 }, { x: 1.2, y: 1.45 }, { x: 0.65, y: 2.25 }, { x: 0.55, y: 2.8 }, { x: 0.7, y: 3.2 }, { x: 0.7, y: 4.0 }, { x: 0.55, y: 4.25 }, { x: 0.47, y: 4.25 }, { x: 0.62, y: 4.0 }, { x: 0.62, y: 3.2 }, { x: 0.47, y: 2.8 }, { x: 0.57, y: 2.25 }, { x: 1.12, y: 1.45 }, { x: 1.57, y: 0.6 }, { x: 1.75, y: 0 }] }), ring("发动机与运载器推力结构相连的上部承载安装环", transportColors.body, 1.25, 0.15, 5.1, 0.25), ring("外部管路在上部腔体周向汇接的结构环", transportColors.trim, 0.82, 0.15, 4.05, 0.25)];
    for (const [radius, y] of [[1.74, 0.4], [1.4, 1.2], [0.86, 2.0], [0.74, 3.2]]) parts.push(ring("随钟形推力室收分的外部周向管肋承圈", transportColors.body, radius!, 0.08, y!, 0.08));
    for (let index = 0; index < 8; index++) {
      const angle = index * Math.PI / 4, path: Triple[] = [[1.84, 0.1], [1.57, 0.8], [0.98, 1.8], [0.67, 2.25], [0.57, 2.8]].map(([radius, y]) => [Math.cos(angle) * radius!, y!, Math.sin(angle) * radius!]);
      parts.push(tapered("贴合推力室连续曲面的外部长管肋", transportColors.body, path, path.map(() => 0.04)));
    }
    for (const side of [-1, 1]) {
      parts.push(cylinder("推力室上方侧置的独立外部泵壳", [side * 0.9, 4.1, 0], [0.6, 1.0, 0.6], transportColors.body, [90, 0, 0]), ring("泵壳前部具有真实开孔的外接管路法兰", transportColors.dark, 0.25, 0.12, 0, 0.3, { position: { x: side * 0.9, y: 4.1, z: -0.6 }, rotation: { x: 90, y: 0, z: 0 } }), cylinderBetween("从泵壳出口接到上部腔体汇接环的短曲管段", [side * 0.9, 4.1, 0.48], [side * 0.45, 4.15, 0.5], 0.16, transportColors.dark), cylinderBetween("从泵壳法兰沿轴向伸出后再转折的输入管颈", [side * 0.9, 4.1, -0.6], [side * 0.9, 4.1, -1.2], 0.28, transportColors.body), cylinderBetween("将输入管路绕到安装承圈外侧的斜接管段", [side * 0.9, 4.1, -1.2], [side * 1.4, 4.6, -1.2], 0.18, transportColors.body), cylinderBetween("位于承力安装环外侧且不穿过环体的竖向输入管段", [side * 1.4, 4.6, -1.2], [side * 1.4, 5.6, -1.2], 0.18, transportColors.body), ring("高于安装承圈的真实空心外部管路入口", transportColors.dark, 0.17, 0.09, 5.65, 0.3, { position: { x: side * 1.4, y: 5.65, z: -1.2 } }));
      for (const end of [-1, 1]) parts.push(strut("推力室上端与上部安装环之间的斜向承载支柱", [side * 0.4, 4.05, end * 0.4], [side * 0.8, 5.1, end * 0.8], 0.1));
    }
    return parts;
  } },
  { name: "六支杆主动软捕获航天对接机构总成", theme: "科幻", itemType: "构件", tags: ["独立航天对接机构", "六支杆软捕获环", "导向瓣与硬捕获钩", "真正贯通舱口"], create: () => {
    const parts: ModelPart[] = [ring("对接机构根部固定的硬捕获承载环", transportColors.body, 1.25, 0.24, 0.125, 0.25), ring("由六支杆托起并保留中心通孔的软捕获活动环", transportColors.trim, 1.05, 0.16, 1.4, 0.22)];
    for (let index = 0; index < 6; index++) {
      const a = index * Math.PI / 3, b = a + (index % 2 ? -0.36 : 0.36), start: Triple = [Math.cos(a) * 1.13, 0.27, Math.sin(a) * 1.13], end: Triple = [Math.cos(b), 1.3, Math.sin(b)], middle: Triple = start.map((value, axis) => value + (end[axis]! - value) * 0.6) as Triple;
      parts.push(cylinderBetween("软捕获支杆根部的直线驱动套筒", start, middle, 0.12, transportColors.body), cylinderBetween("软捕获支杆从套筒伸出的细承力杆", middle, end, 0.065, transportColors.dark), ball("软捕获支杆与固定环相连的球面铰点", start, [0.14, 0.14, 0.14], transportColors.dark), ball("软捕获支杆与活动环相连的球面铰点", end, [0.12, 0.12, 0.12], transportColors.dark));
    }
    for (let index = 0; index < 3; index++) {
      const a = index * Math.PI * 2 / 3, x = Math.cos(a), z = Math.sin(a), point = (radius: number, tangent: number, y: number): Triple => [x * radius - z * tangent, y, z * radius + x * tangent];
      parts.push(surface("从活动捕获环向上引导相对机构的内倾导向瓣", transportColors.body, [point(1.02, -0.25, 1.5), point(1.02, 0.25, 1.5), point(0.88, 0.12, 2.05), point(0.88, -0.12, 2.05)], [0, 1, 2, 0, 2, 3]), box("固定承载环外侧独立的驱动控制封闭盒", [x * 1.38, 0.4, z * 1.38], [0.28, 0.3, 0.28], transportColors.dark, [0, -a * 180 / Math.PI, 0]), strut("驱动控制盒至硬捕获承载环的短安装托", [x * 1.15, 0.2, z * 1.15], [x * 1.38, 0.3, z * 1.38], 0.1));
    }
    for (let index = 0; index < 12; index++) {
      const a = index * Math.PI / 6;
      parts.push(part("固定环外周完整带钩口的独立硬捕获锁钩", "extrude", transportColors.dark, [Math.cos(a) * 1.1, 0.24, Math.sin(a) * 1.1], [1, 1, 1], [0, -a * 180 / Math.PI, 0], { depth: 0.1, profile: [{ x: -0.08, y: 0 }, { x: 0.12, y: 0 }, { x: 0.12, y: 0.46 }, { x: -0.08, y: 0.46 }, { x: -0.08, y: 0.34 }, { x: 0.02, y: 0.34 }, { x: 0.02, y: 0.12 }, { x: -0.08, y: 0.12 }] }));
    }
    return parts;
  } },
  { name: "可变后掠翼中央承力翼盒完整总成", theme: "现代", itemType: "构件", tags: ["独立航空翼盒总成", "双侧回转承力主翼", "轴承与同步连杆", "真正空心回转轴孔"], create: () => {
    const outline: [number, number][] = [[-2.5, -1.6], [2.5, -1.6], [2.5, 1.6], [-2.5, 1.6]], holes: [number, number][][] = [-1, 1].map(side => Array.from({ length: 16 }, (_, index) => [side * 1.25 + Math.cos(index * Math.PI / 8) * 0.85, Math.sin(index * Math.PI / 8) * 0.85]));
    const top = polygon("带两处真实回转轴孔的翼盒上部承力盖板", transportColors.body, outline, 0.2, [0, 1.0, 0], holes); top.opacity = 0.45;
    const parts: ModelPart[] = [polygon("带两处真实回转轴孔的翼盒下部承力盖板", transportColors.body, outline, 0.2, [0, 0, 0], holes), top, box("翼盒前部连接两侧根部的连续腹板", [0, 0.6, -1.6], [5, 0.8, 0.15], transportColors.body), box("翼盒后部连接两侧根部的连续腹板", [0, 0.6, 1.6], [5, 0.8, 0.15], transportColors.body), box("同步杆在翼盒内共同连接的中央传动横头", [0, 0.6, -0.5], [0.9, 0.16, 0.22], transportColors.trim), cylinderBetween("翼盒后部加强肋至同步横头的中央直线驱动外套", [0, 0.6, 1.4], [0, 0.6, 0.2], 0.22, transportColors.body), cylinderBetween("中央驱动外套伸至同步横头的细杆", [0, 0.6, 0.2], [0, 0.6, -0.5], 0.12, transportColors.dark)];
    for (const z of [-1.4, 1.4]) parts.push(box("保留中央传动空间并与前后腹板相接的加强横肋", [0, 0.6, z], [2.1, 0.8, 0.35], transportColors.dark));
    for (const side of [-1, 1]) {
      parts.push(box("中央承力翼盒外端的连续封闭侧腹板", [side * 2.5, 0.6, 0], [0.15, 0.8, 3.2], transportColors.body), cylinder("从上下轴承之间穿出的完整回转承载轴", [side * 1.25, 0.7, 0], [1.0, 1.5, 1.0], transportColors.dark), sweptWing("将根部弯矩经回转支座传入翼盒的完整后掠主翼", [side * 1.25, 1.45, 0], [side * 10.5, 1.65, 5.5], 3.0, 1.0), box("将主翼回转轴与同步杆连成一体的短承载曲柄", [side * 1.43, 0.6, 0.18], [0.65, 0.12, 0.25], transportColors.trim, [0, -side * 40, 0]), strut("左右回转曲柄与共同传动横头之间的同步连杆", [side * 1.6, 0.6, 0.35], [side * 0.4, 0.6, -0.5], 0.075));
      for (const y of [0.2, 1.0]) parts.push(ring("嵌入盖板孔并抱住回转轴的完整承载轴承", transportColors.body, 0.87, 0.4, y, 0.25, { position: { x: side * 1.25, y, z: 0 } }));
    }
    return parts;
  } },
];
