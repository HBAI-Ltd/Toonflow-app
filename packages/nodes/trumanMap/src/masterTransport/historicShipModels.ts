import { pitchedRoof, type ModelPart } from "../assetModelParts";
import { ball, box, cylinder, shipHull, strut, surface, transportColors, type TransportDefinition } from "./parts";

const timber = transportColors.wood;
function squareSail(x: number, y: number, z: number, width: number, height: number): ModelPart[] {
  return [strut("悬挂横帆桁", [x - width * 0.55, y + height / 2, z], [x + width * 0.55, y + height / 2, z], 0.07, timber), surface("鼓起的横帆", transportColors.trim, [[-width / 2, height / 2, 0], [width / 2, height / 2, 0], [width * 0.43, -height / 2, 0], [-width * 0.43, -height / 2, 0], [0, 0, -0.25]], [0, 4, 1, 1, 4, 2, 2, 4, 3, 3, 4, 0], [x, y, z])];
}
function oar(side: number, rootY: number, rootZ: number, length: number): ModelPart[] {
  return [strut("侧舷长木桨", [side * 0.65, rootY, rootZ], [side * length, 0.3, rootZ + 0.6], 0.045, timber), box("长木桨扁桨叶", [side * (length + 0.1), 0.24, rootZ + 0.65], [0.55, 0.06, 0.2], timber, [0, side * -20, side * 12])];
}

export const historicShipModels: TransportDefinition[] = [
  { name: "硬帆远洋福船", theme: "中式", tags: ["历史帆船", "硬帆"], create: () => {
    const parts: ModelPart[] = [shipHull(4.2, 12.5, 1.7), box("尾部高艉甲板", [0, 2.5, 3.9], [3.7, 1.6, 2.9], timber), box("艉楼舱室", [0, 3.6, 4], [2.6, 1.2, 2.1], timber), pitchedRoof("艉楼小顶篷", transportColors.trim, 3, 2.5, 4.25, true), ...[-1, 1].map(side => box("高艏侧挡浪板", [side * 1.3, 2.2, -4.4], [0.15, 1.1, 2], timber, [0, side * -12, 0])), cylinder("前桅", [0, 4.6, -2.5], [0.15, 6.1, 0.15], timber), cylinder("后桅", [0, 5.3, 0.5], [0.19, 7.7, 0.19], timber)];
    for (const [y, z, width, height] of [[5.3, -2.5, 3.1, 3.8], [6.2, 0.5, 3.8, 4.9]]) { parts.push(surface("分段梯形硬帆", transportColors.trim, [[-width! / 2, -height! / 2, 0], [width! / 2, -height! / 2, 0], [width! * 0.38, height! / 2, 0], [-width! * 0.2, height! / 2, 0]], [0, 2, 1, 0, 3, 2], [0, y!, z!])); for (let index = 0; index < 6; index++) { const t = index / 5; parts.push(strut("硬帆整片竹横骨", [-width! / 2 + width! * 0.3 * t, y! - height! / 2 + height! * t, z! - 0.03], [width! / 2 - width! * 0.12 * t, y! - height! / 2 + height! * t, z! - 0.03], 0.035, timber)); } }
    parts.push(box("艉部悬挂大舵", [0, 0.7, 6.1], [0.15, 2.3, 1.2], timber, [0, -10, 0])); return parts;
  } },
  { name: "拉丁帆独桅商船", theme: "异域", tags: ["历史帆船", "拉丁帆"], create: () => [shipHull(3.4, 11.3, 1.4), box("后部载客舱", [0, 2, 3.2], [2.6, 1.2, 2.3], timber), pitchedRoof("低弧尾舱顶", transportColors.trim, 2.9, 2.7, 2.65), strut("长艏斜上挑梁", [0, 1.2, -4.6], [0, 2.6, -6.4], 0.18, timber), cylinder("高主桅", [0, 4.7, -0.3], [0.2, 6.7, 0.2], timber), strut("斜置长拉丁帆桁", [0, 3.2, -3.8], [0, 8.3, 2.8], 0.1, timber), surface("单片三角拉丁帆", transportColors.trim, [[0, 3.2, -3.8], [0, 8.3, 2.8], [0, 2.6, 3.6]], [0, 1, 2]), ...[-1, 1].map(side => strut("侧向主桅支索", [0, 7.7, -0.3], [side * 1.5, 1.5, 1.5], 0.02)), strut("尾舵操纵杆", [0, 1.5, 5.3], [0, 2.6, 4.7], 0.1, timber), box("高尾挂舵", [0, 0.9, 5.6], [0.12, 1.9, 0.9], timber)] },
  { name: "双排桨撞角战船", theme: "欧式", tags: ["古典战船", "双排桨"], create: () => {
    const parts: ModelPart[] = [shipHull(2.9, 14, 1.4), box("贯通桨手甲板", [0, 1.55, 0], [2.3, 0.15, 11.5], timber), strut("艏部青铜撞角", [0, 0.8, -5.8], [0, 0.5, -8.1], 0.3, transportColors.dark), ...[-1, 1].map(side => strut("外伸上层桨架", [side * 1.65, 1.8, -4.6], [side * 1.65, 1.8, 4.6], 0.12, timber)), cylinder("中部桅杆", [0, 4, 0], [0.13, 5.2, 0.13], timber), ...squareSail(0, 4.8, 0, 4.5, 2.7), strut("高翘艉部曲梁", [0, 1.4, 5.2], [0, 3.3, 6.8], 0.17, timber)];
    for (const side of [-1, 1]) for (const z of [-3.8, -2.3, -0.8, 0.8, 2.3, 3.8]) for (const y of [1, 1.65]) parts.push(...oar(side, y, z, y > 1.2 ? 3.2 : 2.7));
    return parts;
  } },
  { name: "高艏艉三桅卡拉克船", theme: "欧式", tags: ["历史帆船", "高艏艉楼"], create: () => {
    const parts: ModelPart[] = [shipHull(4.8, 14, 2.1), box("抬高艏楼", [0, 2.9, -4.5], [3.6, 1.6, 2.7], timber), box("抬高艉楼", [0, 3.3, 4.3], [4.1, 2.4, 3.6], timber), box("艉楼上层舵手室", [0, 5, 4.7], [2.8, 1.1, 2.4], timber), pitchedRoof("舵手室顶", transportColors.trim, 3.1, 2.7, 5.6)];
    for (const [z, h, width] of [[-2.7, 8, 4], [0.5, 9.2, 5]]) { parts.push(cylinder("高横帆主桅", [0, 2 + h! / 2, z!], [0.2, h!, 0.2], timber), ...squareSail(0, h! - 0.1, z!, width!, 2.9), ...squareSail(0, h! + 2, z!, width! * 0.65, 1.5)); }
    parts.push(cylinder("艉部小桅", [0, 5.5, 3.6], [0.12, 5.3, 0.12], timber), surface("艉部拉丁纵帆", transportColors.trim, [[0, 4.8, 2.4], [0, 8.7, 4.2], [0, 4.4, 5.8]], [0, 1, 2]), strut("艏伸斜桅", [0, 3.4, -4.4], [0, 4.6, -8.3], 0.16, timber));
    for (const side of [-1, 1]) for (const z of [-3, -1, 1, 3]) parts.push(cylinder("侧舷轻型炮口", [side * 2.15, 2.55, z], [0.22, 0.5, 0.22], transportColors.dark, [0, 0, 90])); return parts;
  } },
  { name: "北欧龙首桨帆长船", theme: "欧式", tags: ["历史长船", "龙首"], create: () => {
    const parts: ModelPart[] = [shipHull(2.7, 13, 1.1), cylinder("中央单桅", [0, 4.1, 0], [0.16, 6, 0.16], timber), ...squareSail(0, 4.7, 0, 5, 3.7), ...[-1, 1].map(end => strut("高翘首尾脊梁", [0, 0.7, end * 5.1], [0, 2.8, end * 6.8], 0.16, timber)), ball("船艏木雕龙首", [0, 2.9, -6.85], [0.4, 0.42, 0.7], timber), box("龙首向前长吻", [0, 2.8, -7.2], [0.25, 0.12, 0.35], transportColors.trim)];
    for (const side of [-1, 1]) for (const z of [-3.9, -2.3, -0.7, 0.9, 2.5, 4.1]) { parts.push(...oar(side, 1.05, z, 2.7), cylinder("舷侧悬挂圆盾", [side * 1.3, 1.4, z], [0.65, 0.07, 0.65], transportColors.signal, [0, 0, 90]), ball("圆盾中央盾脐", [side * 1.36, 1.4, z], [0.16, 0.16, 0.16], transportColors.dark)); } return parts;
  } },
];
