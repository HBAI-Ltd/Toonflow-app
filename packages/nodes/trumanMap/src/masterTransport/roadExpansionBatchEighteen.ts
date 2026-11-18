import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function pipeHeight(z: number) { return 1.6 + Math.max(0, z - 1.1) ** 2 / 60; }

function bentWorkpiece(): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let station = 0; station < 17; station++) {
    const z = -5 + station * 10 / 16, slope = Math.atan(Math.max(0, z - 1.1) / 30);
    for (const radius of [0.48, 0.44]) for (let side = 0; side < 12; side++) {
      const angle = side * Math.PI / 6;
      vertices.push({ x: Math.cos(angle) * radius, y: pipeHeight(z) + Math.sin(angle) * radius * Math.cos(slope), z: z - Math.sin(angle) * radius * Math.sin(slope) });
    }
    if (!station) continue;
    for (let side = 0; side < 12; side++) {
      const a = (station - 1) * 24 + side, b = (station - 1) * 24 + (side + 1) % 12, c = station * 24 + side, d = station * 24 + (side + 1) % 12;
      indices.push(a, b, c, b, d, c, a + 12, c + 12, b + 12, b + 12, c + 12, d + 12);
    }
  }
  for (let side = 0; side < 12; side++) {
    const next = (side + 1) % 12, end = 16 * 24;
    indices.push(side, side + 12, next, next, side + 12, next + 12, end + side, end + next, end + side + 12, end + next, end + next + 12, end + side + 12);
  }
  return part("已经产生连续微弯且两端真实开口的管线工件", "mesh", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function shoe(name: string, z: number, width: number, upper: boolean): ModelPart {
  const profile = [...Array.from({ length: 9 }, (_, index) => { const angle = ((upper ? 30 : 210) + index * 15) * Math.PI / 180; return { x: Math.cos(angle) * 0.48, y: Math.sin(angle) * 0.48 }; }), ...Array.from({ length: 9 }, (_, index) => { const angle = ((upper ? 150 : 330) - index * 15) * Math.PI / 180; return { x: Math.cos(angle) * 0.65, y: Math.sin(angle) * 0.65 }; })];
  return part(name, "extrude", transportColors.trim, [0, pipeHeight(z), z], [1, 1, 1], [-Math.atan(Math.max(0, z - 1.1) / 30) * 180 / Math.PI, 0, 0], { depth: width, profile });
}

function unpoweredTrack(x: number): ModelPart[] {
  const contour = (radius: number): [number, number][] => [...Array.from({ length: 9 }, (_, index): [number, number] => { const angle = (-90 + index * 22.5) * Math.PI / 180; return [0.27 + Math.sin(angle) * radius, 2.3 + Math.cos(angle) * radius]; }), ...Array.from({ length: 9 }, (_, index): [number, number] => { const angle = (90 + index * 22.5) * Math.PI / 180; return [0.27 + Math.sin(angle) * radius, -2.3 + Math.cos(angle) * radius]; })];
  const band = polygon("供外部牵引转场的非自行连续履带", transportColors.dark, contour(0.27), 0.65, [x + 0.325, 0, 0], [contour(0.21)]);
  band.rotation.z = 90;
  return [band, box("非自行履带内部的轮轴承载架", [x, 0.35, 0], [0.34, 0.26, 4.65], transportColors.dark), ...Array.from({ length: 8 }, (_, index) => cylinder(index === 0 || index === 7 ? "牵引履带的端部导向轮" : "非自行履带的独立承重滚轮", [x, 0.27, -2.3 + index * 4.6 / 7], [0.42, 0.52, 0.42], transportColors.body, [0, 0, 90]))];
}

// 管道贯通框架，弯管模、下压靴和独立夹持靴共同作用；不按管径换模再扩主。
// https://www.crcevans.com/products/pipe-bending-machine-32-42/
export const roadExpansionBatchEighteen: TransportDefinition[] = [
  { name: "贯通模床式管线现场液压冷弯管机", theme: "现代", itemType: "设施", tags: ["管线现场冷弯机", "环弧弯管模与液压压靴", "非自行牵引履带底架"], create: () => {
    const parts: ModelPart[] = [...unpoweredTrack(-1.3), ...unpoweredTrack(1.3), bentWorkpiece(), shoe("包住管线外圆上半周的固定弯管成形模", 0, 2.2, true), shoe("液压抬升且承托管线下半周的弧形压靴", -1.65, 1.0, false), shoe("独立防止管线滑脱变形的上部夹持靴", 1.85, 0.8, true), box("把固定弯管模连到两侧主架的重型上横梁", [0, 2.58, 0], [2.45, 0.62, 2.1], transportColors.signal), box("独立夹持靴的上部反力横梁", [0, 2.96, 1.85], [2.45, 0.18, 0.6], transportColors.body), box("液压控制台与进料绞盘的侧置承台", [1.72, 0.8, -2.1], [1.05, 0.18, 1.65], transportColors.dark), box("侧置液压控制与动力机罩", [1.85, 1.27, -1.7], [0.82, 0.76, 0.65], transportColors.body), cylinder("由液压驱动的进料牵引绞盘", [1.72, 1.08, -2.5], [0.4, 0.68, 0.4], transportColors.dark, [0, 0, 90]), cylinder("进料绞盘的减速驱动端盖", [2.1, 1.08, -2.5], [0.32, 0.2, 0.32], transportColors.signal, [0, 0, 90]), strut("从进料绞盘接到管线前端开口边沿的牵引绳", [1.72, 1.25, -2.5], [0.35, 1.27, -5], 0.012, transportColors.trim), strut("机架前端向牵引车伸出的承重连接舌", [0, 0.65, -3.1], [0, 0.65, -3.6], 0.2, transportColors.body), ring("供外部牵引车连接的真实开口拖环", transportColors.dark, 0.17, 0.065, 0.65, 0.09, { position: { x: 0, y: 0.65, z: -3.7 } })];
    for (const side of [-1, 1]) {
      parts.push(part("位于履带内侧且保留管线贯通净空的长条主侧架", "extrude", transportColors.body, [side * 0.78, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.18, profile: [{ x: -3.2, y: 0.55 }, { x: 3.2, y: 0.55 }, { x: 3.2, y: 1.15 }, { x: 1.0, y: 1.15 }, { x: 1.0, y: 2.8 }, { x: -1.0, y: 2.8 }, { x: -1.0, y: 1.15 }, { x: -3.2, y: 1.15 }] }), box("夹持靴独立上横梁的支承立柱", [side * 0.78, 2.0, 1.85], [0.18, 1.9, 0.4], transportColors.body), cylinder("下压靴与底部反力床之间的液压缸外筒", [side * 0.4, 0.91, -1.65], [0.16, 0.3, 0.16], transportColors.dark), cylinder("抬升下压靴的同轴活塞杆", [side * 0.4, 1.08, -1.65], [0.07, 0.18, 0.07], transportColors.trim), cylinder("独立夹持靴上方的垂直液压缸", [side * 0.4, 2.66, 1.85], [0.14, 0.5, 0.14], transportColors.dark), cylinder("向下接住弧形夹持靴的同轴活塞杆", [side * 0.4, 2.25, 1.85], [0.06, 0.4, 0.06], transportColors.trim));
      for (const z of [-1.3, 1.3]) parts.push(strut("从履带开口内的轮架侧面接出的承重短梁", [side * 1.3, 0.36, z], [side * 0.78, 0.36, z], 0.12, transportColors.dark), box("位于连续履带内侧的主机架承托柱", [side * 0.78, 0.5, z], [0.18, 0.3, 0.2], transportColors.body));
    }
    for (const z of [-2.7, -1.5]) parts.push(strut("侧置绞盘控制承台到主侧架的承重支座", [0.78, 0.85, z], [1.85, 0.85, z], 0.15, transportColors.dark));
    for (const z of [-2.9, -1.65, 2.9]) parts.push(box("连接两侧主架并高于履带回程段的反力横床", [0, 0.7, z], [2.4, 0.2, 0.35], transportColors.dark));
    for (const z of [-2.9, 2.9]) for (const side of [-1, 1]) {
      const y = pipeHeight(z), slope = Math.atan(Math.max(0, z - 1.1) / 30);
      parts.push(cylinder("随管线局部轴线倾斜的V形进出料滚轮", [side * 0.46, y - 0.42 * Math.cos(slope), z + 0.42 * Math.sin(slope)], [0.28, 0.58, 0.28], transportColors.trim, [-slope * 180 / Math.PI, 0, side * -45]), strut("进出料滚轮轴承到底床的独立支承", [side * 0.7, 0.8, z], [side * 0.67, y - 0.21 * Math.cos(slope), z + 0.21 * Math.sin(slope)], 0.07, transportColors.body));
    }
    return parts;
  } },
];
