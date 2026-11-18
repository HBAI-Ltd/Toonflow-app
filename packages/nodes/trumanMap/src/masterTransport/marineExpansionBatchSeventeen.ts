import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";
import { solidPanel } from "./marineExpansionBatchTwo";
import { createMarinePropellerParts } from "./marineEquipmentModels";

// 原创简化的完整船用传动轴线；推力座保持上部检修口，不复制厂商图纸或提供轴系设计参数。
// https://www.wartsila.com/encyclopedia/term/shafting
// https://www.wartsila.com/encyclopedia/term/thrust-bearing
// https://www.wartsila.com/marine/products/shaft-line-solutions/wartsila-thrust-bearings

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;

export function annularSector(inner: number, outer: number, start: number, end: number, steps: number): { x: number; y: number }[] {
  return [outer, inner].flatMap((radius, side) => Array.from({ length: steps + 1 }, (_, index) => { const angle = side ? end - (end - start) * index / steps : start + (end - start) * index / steps; return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }; }));
}

function couplingHalf(z: number, upper: boolean): ModelPart {
  const start = upper ? 0 : Math.PI, end = start + Math.PI, outline = annularSector(0.292, 0.5, start, end, 6).map(point => [point.x, point.y] as [number, number]);
  const holes = [Math.PI / 4, Math.PI * 3 / 4].map(base => { const angle = base + start, x = Math.cos(angle) * 0.4, y = Math.sin(angle) * 0.4; return Array.from({ length: 6 }, (_, index) => [x + Math.cos(index * Math.PI / 3) * 0.05, y + Math.sin(index * Math.PI / 3) * 0.05] as [number, number]); });
  return solidPanel("具有真实轴孔和双螺栓孔的对合轴节半法兰", [0, 2.3, z], [1, 0, 0], [0, 1, 0], outline, holes);
}

export const marineExpansionBatchSeventeen: TransportDefinition[] = [
  { name: "船用推力座中间轴艉轴管螺旋桨传动总成", theme: "现代", itemType: "设施", tags: ["完整船用轴系", "推力轴承艉轴管轴线", "中间轴与推进桨传动"], create: () => {
    const propeller = createMarinePropellerParts().map(value => ({ ...value, position: { x: value.position.x * 0.5, y: 2.3 + (value.position.y - 4) * 0.5, z: 12.6 + value.position.z * 0.5 }, scale: { x: value.scale.x * 0.5, y: value.scale.y * 0.5, z: value.scale.z * 0.5 } }));
    const parts: ModelPart[] = [box("各轴承座共同回传推力的连续安装底床", [0, 0.2, -1.5], [3.4, 0.4, 26], dark), cylinder("动力机到前联轴节的第一段中间轴", [0, 2.3, -10], [0.56, 8, 0.56], body, [90, 0, 0]), cylinder("两联轴节之间的第二段中间轴", [0, 2.3, -2], [0.56, 8, 0.56], body, [90, 0, 0]), cylinder("贯穿艉轴管并接入推进桨毂的连续尾轴", [0, 2.3, 7.5], [0.56, 11, 0.56], body, [90, 0, 0]), ring("固定在前段轴上承受轴向力的推力盘", trim, 0.7, 0.425, 0, 0.25, { position: { x: 0, y: 2.3, z: -11 }, rotation: { x: 90, y: 0, z: 0 } }), part("上方保留检修净空且承托固定背板的推力座外壳", "extrude", body, [0, 2.3, -11], [1, 1, 1], [0, 0, 0], { depth: 1.2, profile: annularSector(0.75, 1, Math.PI * 3 / 4, Math.PI * 9 / 4, 12) }), box("推力座向安装底床传力的刚性基础", [0, 0.85, -11], [2.4, 0.9, 2], dark), part("外侧艉轴管的实际中空固定套筒", "lathe", body, [0, 2.3, 8], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.3, y: -3 }, { x: 0.48, y: -3 }, { x: 0.48, y: 3 }, { x: 0.3, y: 3 }, { x: 0.3, y: -3 }] }), ...propeller];
    for (const z of [-6, 2]) {
      for (const offset of [-0.12, 0.12]) parts.push(couplingHalf(z + offset, true), couplingHalf(z + offset, false));
      for (const side of [-1, 1]) parts.push(ring("两端分别实接轴段与半法兰的夹紧连接毂", body, 0.34, 0.061, 0, 0.4, { position: { x: 0, y: 2.3, z: z + side * 0.3 }, rotation: { x: 90, y: 0, z: 0 } }));
      for (let index = 0; index < 4; index++) {
        const angle = Math.PI / 4 + index * Math.PI / 2, x = Math.cos(angle) * 0.4, y = 2.3 + Math.sin(angle) * 0.4;
        parts.push(cylinder("真实穿过前后法兰孔并连接两轴段的长螺栓", [x, y, z], [0.08, 0.5, 0.08], trim, [90, 0, 0]), cylinder("与前法兰端面贴合的紧固端帽", [x, y, z - 0.24], [0.13, 0.08, 0.13], dark, [90, 0, 0]), cylinder("与后法兰端面贴合的锁紧端帽", [x, y, z + 0.24], [0.13, 0.08, 0.13], dark, [90, 0, 0]));
      }
    }
    for (const side of [-1, 1]) {
      parts.push(ring("固定在推力座内壁并支撑倾瓦支点的厚背板", body, 0.95, 0.65, 0, 0.14, { position: { x: 0, y: 2.3, z: -11 + side * 0.41 }, rotation: { x: 90, y: 0, z: 0 } }), strut("推力座下圆壳到刚性基础的实接鞍撑", [side * 0.95, 1.25, -11], [side * 0.65, 1.54, -11], 0.2, dark));
      for (let index = 0; index < 6; index++) {
        const angle = index * Math.PI / 3;
        parts.push(part("位于推力盘一侧且各自受背销承托的扇形推力瓦", "extrude", trim, [0, 2.3, -11 + side * 0.189], [1, 1, 1], [0, 0, 0], { depth: 0.12, profile: annularSector(0.35, 0.68, angle - 0.28, angle + 0.28, 3) }), cylinder("将独立推力瓦背面连接到固定背板的支点销", [Math.cos(angle) * 0.5, 2.3 + Math.sin(angle) * 0.5, -11 + side * 0.295], [0.14, 0.1, 0.14], dark, [90, 0, 0]));
      }
    }
    for (const z of [-3.5, 4]) parts.push(part("与中间轴保留运转净隙的完整环形轴承", "lathe", trim, [0, 2.3, z], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.282, y: -0.4 }, { x: 0.55, y: -0.4 }, { x: 0.55, y: 0.4 }, { x: 0.282, y: 0.4 }, { x: 0.282, y: -0.4 }] }), box("中间轴承下端实接安装底床的承重墩", [0, 1.1, z], [1.6, 1.4, 1], dark));
    for (const z of [5.4, 10.6]) parts.push(part("嵌入艉轴管并真正围住尾轴的水润滑衬瓦", "lathe", trim, [0, 2.3, z], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.282, y: -0.35 }, { x: 0.34, y: -0.35 }, { x: 0.34, y: 0.35 }, { x: 0.282, y: 0.35 }, { x: 0.282, y: -0.35 }] }));
    for (const z of [5, 11]) parts.push(part("艉轴管两端与船体边界接续的厚法兰", "lathe", dark, [0, 2.3, z], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.282, y: -0.15 }, { x: 0.7, y: -0.15 }, { x: 0.7, y: 0.15 }, { x: 0.282, y: 0.15 }, { x: 0.282, y: -0.15 }] }));
    for (const z of [6.5, 9.8]) {
      parts.push(box("固定艉轴管鞍座的底部承台", [0, 1, z], [1.2, 1.2, 1], dark));
      for (const side of [-1, 1]) parts.push(strut("艉轴管外壁到承台的两侧斜鞍撑", [side * 0.5, 1.55, z], [side * 0.3, 1.94, z], 0.16, dark));
    }
    return parts;
  } },
];
