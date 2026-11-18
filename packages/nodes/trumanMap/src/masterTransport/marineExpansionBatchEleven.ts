import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";
import { solidPanel } from "./marineExpansionBatchTwo";

// 按机构的一手构造资料制作原创简化几何，不复制现成三维资源；装置不做发电或生命保障仿真。
// https://www.emec.org.uk/about-us/wave-clients/pelamis-wave-power/
// https://era.ed.ac.uk/items/4c01f88d-cac1-4993-bee5-8b1b90c19709
// https://sanctuaries.noaa.gov/missions/2010aquarius/meet_aquarius.html

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;

function pipeShell(name: string, position: Triple, radius: number, length: number, wall: number, rotation: Triple = [90, 0, 0]): ModelPart {
  return part(name, "lathe", body, position, [1, 1, 1], rotation, { profile: [{ x: radius - wall, y: -length / 2 }, { x: radius, y: -length / 2 }, { x: radius, y: length / 2 }, { x: radius - wall, y: length / 2 }, { x: radius - wall, y: -length / 2 }] });
}

export function createArticulatedWavePowerParts(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const z of [-45, -15, 15, 45]) {
    parts.push(part("具有独立密封端部的长圆柱浮力舱", "lathe", body, [0, 1.8, z], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -14.5 }, { x: 1.5, y: -14 }, { x: 1.8, y: -13.4 }, { x: 1.8, y: 13.4 }, { x: 1.5, y: 14 }, { x: 0, y: 14.5 }] }), box("浮力舱上沿窄检修走板", [0, 3.58, z], [0.9, 0.12, 25], dark), cylinder("上沿密封检修人孔", [0, 3.73, z - 4], [0.75, 0.18, 0.75], trim));
    for (const end of [-1, 1]) parts.push(strut("检修走板端部立柱", [0.4, 3.62, z + end * 11.5], [0.4, 4.35, z + end * 11.5], 0.045, trim));
    parts.push(strut("检修走板纵向安全扶手", [0.4, 4.35, z - 11.5], [0.4, 4.35, z + 11.5], 0.045, trim));
  }
  for (const z of [-30, 0, 30]) {
    parts.push(cylinder("万向铰内的横向俯仰轴", [0, 1.8, z], [0.34, 2.6, 0.34], dark, [0, 0, 90]), cylinder("与俯仰轴正交的偏航枢轴", [0, 1.8, z], [0.34, 1.8, 0.34], trim));
    for (const side of [-1, 1]) parts.push(box("前段浮筒伸出的双耳叉板", [side * 0.85, 1.8, z - 0.55], [0.28, 1, 1.25], dark), box("后段浮筒伸出的上下叉板", [0, 1.8 + side * 0.65, z + 0.55], [1.55, 0.22, 1.25], dark), cylinder("跨关节液压取能缸筒", [side * 1.25, 1.8, z - 0.45], [0.27, 1.4, 0.27], dark, [90, 0, 0]), cylinder("液压取能缸外露活塞杆", [side * 1.25, 1.8, z + 0.75], [0.12, 1.3, 0.12], trim, [90, 0, 0]), strut("液压缸前端与浮筒的实心销座", [side * 1.25, 1.8, z - 1.15], [side * 0.8, 1.8, z - 1.8], 0.25, body), strut("液压缸后端与浮筒的实心销座", [side * 1.25, 1.8, z + 1.4], [side * 0.8, 1.8, z + 1.8], 0.25, body));
  }
  parts.push(part("头段接出的柔性电力输出缆", "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: 0, y: 1.8, z: -59.3 }, { x: 0.3, y: 0.7, z: -62 }, { x: 1.2, y: 0.25, z: -66 }], radius: 0.1 }));
  for (const side of [-1, 1]) parts.push(strut("头段端舱上方的拖曳与系泊叉索", [side * 0.75, 1.9, -58.5], [0, 1.1, -62], 0.09, dark));
  return parts;
}

export const marineExpansionBatchEleven: TransportDefinition[] = [
  { name: "圆形脊轴穿心非对称凸轮鸭式波能浮体", theme: "现代", itemType: "设施", tags: ["鸭式波能装置", "偏心凸轮波能", "Salter duck 类构造"], create: () => {
    const outline: [number, number][] = [[3.4, -3.6], [4.6, -1.8], [5, 0], [4.6, 2], [3.3, 3.6], [1.5, 4.7], [-0.5, 5], [-3, 4.2], [-5.5, 2.7], [-7, 1], [-6.5, -0.5], [-4.5, -2], [-2, -3.5], [0, -4.7], [1.8, -4.5]];
    const opening: [number, number][] = Array.from({ length: 16 }, (_, index) => [Math.cos(index * Math.PI / 8) * 2.2, Math.sin(index * Math.PI / 8) * 2.2]);
    const duck = polygon("具有真实贯通脊轴孔的非对称凸轮浮体", body, outline, 25, [0, 0, 0], [opening]);
    duck.vertices = duck.vertices!.map(point => ({ x: point.y - 12.5, y: point.z + 4.7, z: point.x }));
    const parts: ModelPart[] = [duck, part("贯穿浮体并伸出两端的密封浮力脊轴", "lathe", dark, [0, 4.7, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0, y: -15 }, { x: 2, y: -15 }, { x: 2, y: 15 }, { x: 0, y: 15 }] })];
    for (const side of [-1, 1]) {
      parts.push(part("浮体端面嵌入的同心旋转轴承圈", "lathe", trim, [side * 12.5, 4.7, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: 2.03, y: -0.16 }, { x: 2.36, y: -0.16 }, { x: 2.36, y: 0.16 }, { x: 2.03, y: 0.16 }, { x: 2.03, y: -0.16 }] }), cylinder("露在脊轴封闭端面外的同轴取能传动盖", [side * 15.35, 4.7, 0], [1.5, 0.85, 1.5], trim, [0, 0, 90]), box("脊轴上方的端部检修平台", [side * 14, 6.85, 0], [2.5, 0.3, 3.3], dark), strut("端部平台悬挑承托斜杆", [side * 13.2, 5.4, 1.3], [side * 15.1, 6.7, 1.3], 0.2, dark), strut("端部平台另一侧承托斜杆", [side * 13.2, 5.4, -1.3], [side * 15.1, 6.7, -1.3], 0.2, dark), box("系泊索末端重力锚基座", [side * 19, 0.25, 8], [2.4, 0.5, 2.4], dark), strut("浮力脊轴末端到海床锚基的系泊索", [side * 14.4, 4.7, 1.8], [side * 19, 0.5, 8], 0.1, dark));
      for (const z of [-1.5, 1.5]) parts.push(strut("端部检修平台扶手", [side * 12.9, 7.9, z], [side * 15.1, 7.9, z], 0.045, trim), strut("检修平台扶手立柱", [side * 15.1, 6.95, z], [side * 15.1, 7.9, z], 0.045, trim));
    }
    return parts;
  } },
  { name: "海床底架湿式出入井饱和居住实验舱", theme: "现代", itemType: "设施", tags: ["水下居住实验舱", "湿式入口海底舱", "Aquarius 类构造"], create: () => {
    const frontWindow = cylinder("嵌在前封头真实圆孔内的厚玻璃", [0, 4.5, -5.14], [0.79, 0.13, 0.79], transportColors.glass, [90, 0, 0]);
    frontWindow.opacity = 0.35;
    frontWindow.roughness = 0.12;
    const frontWall = solidPanel("湿式前廊正面穿舱圆门框", [0, 3.15, 5.3], [1, 0, 0], [0, 1, 0], [[-1.7, 0], [1.7, 0], [1.7, 2.8], [-1.7, 2.8]], [Array.from({ length: 16 }, (_, index) => [Math.cos(index * Math.PI / 8) * 0.65, 1.35 + Math.sin(index * Math.PI / 8) * 0.65] as [number, number])]);
    frontWall.color = body;
    const parts: ModelPart[] = [box("整舱海床重力锚定厚底板", [0, 0.3, 1.1], [7, 0.6, 17], dark), pipeShell("具有真实内部空间的连续钢质主居住舱壳", [0, 4.5, 0], 1.4, 10, 0.12), pipeShell("前圆观察窗周围厚壁封头", [0, 4.5, -5.03], 1.4, 0.22, 1), frontWindow, pipeShell("主居住舱后端贯通出入门的厚圆封头", [0, 4.5, 5.03], 1.4, 0.22, 0.85), pipeShell("接往湿式前廊的真实短转接筒", [0, 4.5, 5.2], 0.68, 0.6, 0.13), pipeShell("主舱与进出锁舱之间有贯通门的隔壁", [0, 4.5, 2.8], 1.28, 0.14, 0.73), polygon("底面保留真实海水出入井口的湿式前廊地板", dark, [[-1.7, 5.3], [1.7, 5.3], [1.7, 8.7], [-1.7, 8.7]], 0.16, [0, 3.15, 0], [[[-0.65, 6.1], [0.65, 6.1], [0.65, 7.9], [-0.65, 7.9]]]), frontWall, box("湿式前廊后部封壁", [0, 4.55, 8.63], [3.4, 2.8, 0.14], body), box("湿式前廊两侧壁间的实顶盖", [0, 6.02, 7], [3.5, 0.14, 3.5], body), box("主圆舱内平整生活地板", [0, 3.83, 0], [2.1, 0.12, 9.8], dark)];
    for (const side of [-1, 1]) {
      parts.push(box("湿式前廊直立侧围壁", [side * 1.63, 4.55, 7], [0.14, 2.8, 3.4], body), box("圆舱内沿侧壁的工作台", [side * 0.85, 4.24, -0.4], [0.5, 0.7, 2.5], trim), box("圆舱内独立上下铺的下铺", [side * 0.7, 4.1, -3.4], [0.6, 0.2, 1.9], trim), box("圆舱内独立上下铺的上铺", [side * 0.7, 5.05, -3.4], [0.6, 0.2, 1.9], trim), strut("开口出入井旁真正接到地板边的扶梯侧杆", [side * 0.4, 1.15, 7.88], [side * 0.4, 4.1, 7.88], 0.045, trim));
      for (const z of [-3.5, 3.5]) parts.push(strut("底板向圆筒抱箍传力的倾斜支承腿", [side * 2.3, 0.6, z], [side * 1, 3.52, z], 0.3, dark));
      for (const z of [5.8, 8.2]) parts.push(strut("湿式前廊地板下的承托柱", [side * 1.4, 0.6, z], [side * 1.4, 3.15, z], 0.2, dark));
      for (const z of [-4.25, -2.55]) parts.push(strut("上下铺床框竖支柱", [side * 0.95, 3.89, z], [side * 0.95, 5.16, z], 0.035, dark));
    }
    for (const z of [-3.5, 3.5]) parts.push(pipeShell("与支架和主圆舱实接的环形抱箍", [0, 4.5, z], 1.52, 0.3, 0.12));
    for (let index = 0; index < 8; index++) parts.push(strut("海水出入井内的扶梯横踏杆", [-0.4, 1.3 + index * 0.36, 7.88], [0.4, 1.3 + index * 0.36, 7.88], 0.04, trim));
    parts.push(box("从湿式前廊地板升到转接圆门的第一级", [0, 3.41, 5.95], [1.1, 0.2, 0.3], trim), box("从湿式前廊地板升到转接圆门的第二级", [0, 3.515, 5.67], [1.1, 0.41, 0.3], trim), box("与转接圆门下缘相接的末级踏步", [0, 3.625, 5.4], [1.1, 0.63, 0.25], trim), box("主圆舱顶部供气和供电接线柜", [0, 6.05, -0.8], [0.8, 0.4, 1.1], dark), box("底架上可外接水面脐带的实体连接端", [2.9, 0.8, -6.4], [0.5, 0.4, 0.6], dark), part("由底架连接端实际接往主舱接线柜的复合脐带缆", "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: 0, y: 6.15, z: -0.8 }, { x: 0.3, y: 6.3, z: -2.5 }, { x: 1.2, y: 5.9, z: -5.5 }, { x: 2.9, y: 0.9, z: -6.4 }], radius: 0.09 }));
    return parts;
  } },
];
