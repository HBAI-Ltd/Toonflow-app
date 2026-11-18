import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { solidPanel } from "./marineExpansionBatchTwo";
import { ball, box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 原创海事大装置外形，非制造规格或真实控制系统。
// https://www.jfdglobal.com/systems/saturation-diving-systems/integrated-saturation-systems/
// https://www.ampelmann.nl/systems/electric-a
// https://www.vplp.fr/en/news/vplp-desgin-launches-oceanwings-reefable-furlable-automated-wingsail/

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;

function pipe(name: string, points: Triple[], radius: number): ModelPart {
  return part(name, "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius, path: points.map(([x, y, z]) => ({ x, y, z })) });
}

export const marineExpansionBatchFive: TransportDefinition[] = [
  { name: "双居住舱联通转接式饱和潜水站", theme: "现代", itemType: "设施", tags: ["饱和潜水站", "甲板减压舱组", "压力转接舱"], create: () => {
    const circle = (radius: number): [number, number][] => Array.from({ length: 16 }, (_, index) => [Math.cos(index * Math.PI / 8) * radius, Math.sin(index * Math.PI / 8) * radius]);
    const parts: ModelPart[] = [box("独立海事潜水站承载滑橇", [0, 0.15, 0], [17.5, 0.3, 5.8], dark), box("中央转接舱底壁", [0, 0.35, 0], [2.6, 0.16, 3], dark), box("中央转接舱顶壁", [0, 3.25, 0], [2.6, 0.16, 3], dark), box("中央转接舱封闭后壁", [0, 1.8, 1.5], [2.6, 2.9, 0.16], dark), solidPanel("中央舱前部真实转接圆孔", [0, 1.8, -1.5], [1, 0, 0], [0, 1, 0], [[-1.3, -1.45], [1.3, -1.45], [1.3, 1.45], [-1.3, 1.45]], [circle(0.85)]), ring("前部压力转接安装法兰", body, 1, 0.15, 1.8, 0.28, { position: { x: 0, y: 1.8, z: -1.64 }, rotation: { x: 90, y: 0, z: 0 } }), cylinder("前接口独立密封盖", [0, 1.8, -1.84], [1.8, 0.12, 1.8], trim, [90, 0, 0]), box("密封盖侧铰链承座", [1.02, 1.8, -1.65], [0.2, 0.5, 0.2], body), cylinder("压力盖竖向铰销", [1.04, 1.8, -1.65], [0.065, 0.65, 0.065], dark)];
    for (const side of [-1, 1]) {
      parts.push(solidPanel("居住舱与中央转接舱之间真正连通的侧壁", [side * 1.3, 1.8, 0], [0, 0, 1], [0, 1, 0], [[-1.5, -1.45], [1.5, -1.45], [1.5, 1.45], [-1.5, 1.45]], [circle(1.24)]), part("端部敞口接中央舱的薄壁居住舱", "lathe", body, [side * 4.45, 1.8, 0], [1, 1, 1], [0, 0, -side * 90], { profile: [{ x: 1.35, y: -3.15 }, { x: 1.35, y: 2.75 }, { x: 1.1, y: 3.05 }, { x: 0, y: 3.2 }, { x: 0, y: 3.06 }, { x: 1, y: 2.94 }, { x: 1.24, y: 2.65 }, { x: 1.24, y: -3.15 }, { x: 1.35, y: -3.15 }] }), ...[3, 6].map(x => box("圆舱底部实际承载鞍座", [side * x, 0.475, 0], [0.55, 0.35, 2.2], dark)), box("居住舱前侧窄操作踏台", [side * 4.4, 0.52, -1.8], [6.2, 0.16, 0.8], dark), strut("前操作踏台扶手", [side * 1.45, 1.55, -2.15], [side * 7.2, 1.55, -2.15], 0.045, trim));
      for (const x of [1.5, 4.4, 7.2]) parts.push(strut("踏台扶手承柱", [side * x, 0.6, -2.15], [side * x, 1.55, -2.15], 0.045, trim));
      for (const x of [2.4, 6.4]) parts.push(ring("居住舱外侧双轴加强法兰", dark, 1.4, 0.13, 1.8, 0.12, { position: { x: side * x, y: 1.8, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }));
      parts.push(pipe("由外侧气源接入居住舱顶的供气弯管", [[side * 7.85, 2.66, 1.7], [side * 6, 3.55, 1.8], [side * 4, 3.55, 0.8], [side * 4, 3.15, 0]], 0.055));
      for (const z of [1.7, 2.25]) parts.push(cylinder("站内储气钢瓶", [side * 7.85, 1.4, z], [0.38, 2.2, 0.38], body), cylinder("气瓶顶端连接阀", [side * 7.85, 2.6, z], [0.1, 0.22, 0.1], dark));
    }
    parts.push(strut("将压力盖与竖铰座连接的实际铰臂", [0.8, 1.8, -1.84], [1.04, 1.8, -1.65], 0.12, body), box("面向中央舱的独立控制台", [0, 1.15, 2.2], [1.8, 1.7, 0.65], body), box("控制台倾斜仪表板", [0, 2.08, 2.15], [1.8, 0.18, 0.9], dark, [12, 0, 0]));
    for (const x of [-0.5, 0, 0.5]) parts.push(cylinder("控制台外部圆形压力表", [x, 2.2, 2.05], [0.25, 0.04, 0.25], trim, [12, 0, 0]));
    return parts;
  } },
  { name: "六杆补偿底座伸缩式海上登乘栈桥", theme: "现代", itemType: "设施", tags: ["海上登乘桥", "六自由度补偿构造", "motion compensated gangway"], create: () => {
    const parts: ModelPart[] = [cylinder("海事登乘系统固定底盘", [0, 0.2, 0], [7.4, 0.4, 7.4], dark), cylinder("六杆共同承载的上部稳定平台", [0, 3.05, 0], [5.6, 0.3, 5.6], body), cylinder("栈桥水平回转轴座", [0, 3.65, 0.8], [2.3, 0.9, 2.3], dark), ...[-1, 1].map(side => box("俯仰轴两侧实际耳板", [side * 1, 4.3, 0.8], [0.35, 1.3, 1.3], body)), cylinder("栈桥俯仰横轴", [0, 4.4, 0.8], [0.3, 2.6, 0.3], trim, [0, 0, 90]), box("回转平台侧控制台", [-1.9, 3.65, -0.6], [0.65, 0.9, 0.8], body)];
    const baseAngles = [10, 110, 130, 230, 250, 350], topAngles = [50, 70, 170, 190, 290, 310];
    for (let index = 0; index < 6; index++) {
      const a = baseAngles[index]! * Math.PI / 180, b = topAngles[index]! * Math.PI / 180;
      const start: Triple = [Math.cos(a) * 3.05, 0.4, Math.sin(a) * 3.05], end: Triple = [Math.cos(b) * 2.3, 2.9, Math.sin(b) * 2.3], middle: Triple = start.map((v, axis) => v + (end[axis]! - v) * 0.72) as Triple;
      const housing = strut("六自由度底座的独立作动缸筒", start, middle, 0.26, body), rod = strut("伸出缸筒并连接上铰点的作动杆", middle, end, 0.1, trim);
      housing.shape = "cylinder";
      rod.shape = "cylinder";
      parts.push(housing, rod, ball("上平台万向铰球", end, [0.3, 0.3, 0.3], dark));
    }
    for (const [z, length, width, floorY] of [[7.8, 14, 1.6, 4.5], [17, 14, 1.25, 4.66]]) {
      parts.push(box("具有搭接行程的独立伸缩步行地板", [0, floorY!, z!], [width!, 0.16, length!], dark));
      for (const side of [-1, 1]) {
        parts.push(box("伸缩段实际纵向承载边梁", [side * width! / 2, floorY! - 0.12, z!], [0.12, 0.35, length!], body), strut("伸缩段上部安全栏", [side * width! / 2, floorY! + 1.1, z! - length! / 2], [side * width! / 2, floorY! + 1.1, z! + length! / 2], 0.045, trim));
        for (const offset of [-0.5, 0, 0.5]) parts.push(strut("伸缩段护栏竖柱", [side * width! / 2, floorY!, z! + offset * length!], [side * width! / 2, floorY! + 1.1, z! + offset * length!], 0.045, trim));
        parts.push(strut("伸缩段桁架对角腹杆", [side * width! / 2, floorY! - 0.25, z! - length! / 2], [side * width! / 2, floorY! + 0.45, z!], 0.07, body));
      }
    }
    parts.push(box("桥端与目标平台接触的弹性落脚垫", [0, 4.65, 24.05], [1.35, 0.2, 0.55], transportColors.wood), strut("俯仰液压缸外筒", [0, 3.85, 0.2], [0, 4.1, 2.8], 0.24, body), strut("俯仰液压缸连接栈桥的活塞杆", [0, 4.1, 2.8], [0, 4.4, 5.5], 0.1, trim));
    return parts;
  } },
  { name: "双翼片铰接式货船风力助推桅帆", theme: "现代", itemType: "设施", tags: ["硬翼助推帆", "双翼片桅帆", "two element wingsail"], create: () => {
    const main = polygon("前主翼的封闭厚水翼截面", trim, [[-2.6, 0], [-2.3, -0.35], [-0.9, -0.48], [0.9, -0.28], [1.9, -0.07], [1.9, 0.07], [0.9, 0.28], [-0.9, 0.48], [-2.3, 0.35]], 30, [0, 3.8, 0]);
    const flap = polygon("与前主翼之间留真缝隙的后襟翼", body, [[-0.8, 0], [-0.6, -0.18], [0.5, -0.12], [1.3, 0], [0.5, 0.12], [-0.6, 0.18]], 30, [2.85, 3.8, 0]);
    const parts: ModelPart[] = [cylinder("甲板固定承力大法兰", [0, 0.25, 0], [4.8, 0.5, 4.8], dark), cylinder("整副桅帆的回转轴承柱", [0, 2.15, 0], [1.8, 3.3, 1.8], body), cylinder("贯穿前主翼的扭矩桅轴", [0, 19.3, 0], [0.65, 31, 0.65], dark), main, flap, cylinder("控制后襟翼角度的贯通竖铰轴", [2.04, 18.8, 0], [0.055, 30, 0.055], dark), box("甲板上的回转电驱动维护匣", [1.6, 0.95, 0], [1.3, 1.4, 1.4], body), strut("电驱维护匣实际承载支脚", [1.6, 0.5, 0], [1.6, 0.95, 0], 0.3, dark)];
    for (const y of [4.2, 18.8, 33.4]) parts.push(strut("将主翼与后襟翼铰轴连成一体的翼肋", [1.6, y, 0], [2.2, y, 0], 0.09, dark));
    parts.push(strut("后襟翼根部变角驱动缸", [0.8, 4, -0.12], [2.9, 4, -0.12], 0.065, dark), cylinder("扭矩桅轴顶端封盖", [0, 34.85, 0], [0.85, 0.1, 0.85], trim));
    return parts;
  } },
];
