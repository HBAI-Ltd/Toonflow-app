import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, helicalFlight, shipHull, strut, transportColors, type TransportDefinition } from "./parts";

// 具名完整构造的原创简化模型，不是品牌型号或制造图。
// https://www.technipfmc.com/media/ms5nvan3/technip-awarded-spar-hull-and-mooring-contract-for-the-shell-perdido-regional-host-project-in-the-gulf-of-mexico-id653.pdf
// https://scripps.ucsd.edu/ships/flip/technical
// https://monitor.noaa.gov/media/docs/2021-uss-monitor-poster-back.pdf
// https://www.history.navy.mil/research/histories/ship-histories/confederate_ships/virginia.html

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim, glass = transportColors.glass;

function railing(name: string, start: Triple, end: Triple, y: number): ModelPart[] {
  return [strut(name, [start[0], y, start[2]], [end[0], y, end[2]], 0.055, trim), ...[start, end].map(p => strut("护栏立柱", p, [p[0], y, p[2]], 0.055, trim))];
}

export function solidPanel(name: string, origin: Triple, u: Triple, v: Triple, outline: [number, number][], holes: [number, number][][] = []): ModelPart {
  const value = polygon(name, dark, outline, 0.16, [0, 0, 0], holes);
  const normal = [v[1] * u[2] - v[2] * u[1], v[2] * u[0] - v[0] * u[2], v[0] * u[1] - v[1] * u[0]];
  const vertices = value.vertices!.map(p => ({
    x: origin[0] + u[0] * p.x + v[0] * p.z + normal[0]! * (p.y - 0.08),
    y: origin[1] + u[1] * p.x + v[1] * p.z + normal[1]! * (p.y - 0.08),
    z: origin[2] + u[2] * p.x + v[2] * p.z + normal[2]! * (p.y - 0.08),
  }));
  // 每个平面三角形保留自己的法线，舷壁孔边不会把整片装甲面抹成三角形阴影。
  return part(name, "mesh", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices: value.indices!.map(index => vertices[index]!) });
}

function arcWall(name: string, radius: number, thickness: number, a: number, b: number, height: number, y: number, z: number): ModelPart {
  const point = (r: number, angle: number): [number, number] => [Math.cos(angle * Math.PI / 180) * r, Math.sin(angle * Math.PI / 180) * r];
  return polygon(name, dark, [point(radius, a), point(radius, b), point(radius - thickness, b), point(radius - thickness, a)], height, [0, y, z]);
}

function barrel(name: string, position: Triple, rotation: Triple): ModelPart {
  return part(name, "lathe", dark, position, [1, 1, 1], rotation, { profile: [{ x: 0.14, y: -1.5 }, { x: 0.2, y: -1.5 }, { x: 0.24, y: 0.55 }, { x: 0.32, y: 1 }, { x: 0, y: 1.1 }, { x: 0, y: 0.85 }, { x: 0.17, y: 0.55 }, { x: 0.14, y: -1.5 }] });
}

export const marineExpansionBatchTwo: TransportDefinition[] = [
  { name: "单圆柱深吃水压载式海上作业平台", theme: "现代", itemType: "设施", tags: ["SPAR平台", "单柱浮体平台", "深吃水压载"], create: () => {
    const parts: ModelPart[] = [cylinder("最低部重压载底舱", [0, 2.5, 0], [24, 5, 24], dark), cylinder("深吃水连续圆柱浮体", [0, 40, 0], [24, 70, 24], body), cylinder("支承高架甲板的上颈", [0, 78, 0], [10, 6, 10], body), box("单柱承载的主作业甲板", [0, 81, 0], [36, 2, 32], dark), box("甲板上的生活工作模块", [-8, 85.5, 3], [12, 7, 18], trim), box("生活模块前窗带", [-8, 86, -6.05], [10, 1.2, 0.1], glass), box("连续处理设备底台", [8, 82.8, 0], [12, 1.6, 22], body), cylinder("竖向气液分离容器", [8, 87, 4], [3.5, 7, 3.5], trim), cylinder("低位卧式分离容器", [8, 85.5, -5], [4, 8, 4], body, [90, 0, 0]), cylinder("甲板外伸航空甲板", [-22, 89.5, 5], [17, 0.6, 17], dark), strut("航空甲板悬挑主承梁", [-12, 82, 5], [-22, 89, 5], 1, body), strut("航空甲板第二承梁", [-12, 82, 11], [-22, 89, 8], 0.8, body), ...[-1, 1].map(side => strut("甲板至柱颈倾斜承撑", [side * 3.5, 75, 0], [side * 14, 80.4, 0], 1.2, dark))];
    for (let index = 0; index < 3; index++) {
      const strake = helicalFlight([0, 8, 0], 11.85, 13.6, 63, 1.35, 1, 0.18);
      strake.name = "抑制圆柱绕流涡激振动的连续螺旋鳍";
      strake.rotation.y = index * 120;
      parts.push(strake);
    }
    for (const z of [-12, 0, 12]) parts.push(box("甲板下横向承力深梁", [0, 79.8, z], [35, 0.8, 0.7], body));
    for (const x of [-1.1, 1.1]) {
      parts.push(cylinder("圆柱外侧连续输送立管", [x, 40, -12.3], [0.4, 70, 0.4], dark), strut("立管接入甲板的上弯段", [x, 75, -12.3], [x, 82.2, -10], 0.4, dark));
      for (const y of [8, 28, 48, 68]) parts.push(strut("外置立管至圆柱壳的实际抱箍支座", [x, y, -11.9], [x, y, -12.3], 0.15, body));
    }
    for (const side of [-1, 1]) parts.push(...railing("主甲板两侧防护横栏", [side * 17.5, 82, -15.5], [side * 17.5, 82, 15.5], 83.2), ...railing("生活舱顶前侧护栏", [-13.8, 89, side * 11.7], [-2.2, 89, side * 11.7], 90.1));
    parts.push(...railing("主甲板前端防护栏", [-17.5, 82, -15.5], [17.5, 82, -15.5], 83.2), cylinder("甲板顶部通讯桅", [-8, 94, 3], [0.2, 10, 0.2], dark), strut("外伸火炬梁", [14, 82, -9], [27, 94, -16], 0.65, body), strut("火炬梁下弦回撑", [12, 80.5, -9], [27, 94, -16], 0.35, dark), cylinder("火炬末端放散管口", [27, 94.5, -16], [0.6, 1, 0.6], dark));
    return parts;
  } },
  { name: "压载翻转细管柱海洋观测浮台", theme: "现代", itemType: "设施", tags: ["翻转观测浮台", "FLIP构造型", "非自航管柱浮标"], create: () => {
    const parts: ModelPart[] = [part("深置压载舱至细水线颈的长管柱", "lathe", body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 3.1, y: 0 }, { x: 3.25, y: 8 }, { x: 3.25, y: 48 }, { x: 2, y: 75 }, { x: 2, y: 89 }, { x: 0, y: 89 }] }), box("细管柱顶部窄身实验舱底", [0, 89.2, 0], [4.3, 0.4, 10], dark), box("实验舱右侧连续舱壁", [2.1, 94.1, 0], [0.15, 9.4, 10], trim), box("实验舱左下舱壁", [-2.1, 91.3, 0], [0.15, 3.8, 10], trim), box("实验舱左上舱壁", [-2.1, 97.9, 0], [0.15, 1.8, 10], trim), box("实验舱左窗带透明面", [-2.1, 95.1, 0], [0.05, 3.6, 10], glass), box("实验舱尾部封壁", [0, 94.1, 4.95], [4.3, 9.4, 0.15], trim), box("窄身实验舱顶", [0, 98.9, 0], [4.5, 0.2, 10.3], trim), box("与主浮柱垂直的实验工作层", [0, 94.6, 0], [4.1, 0.18, 9.8], dark), box("前端通行平台", [0, 89.4, -6], [4.3, 0.25, 2.3], dark), ...[-1, 1].map(side => box("前端通行门左右壁", [side * 1.45, 94.1, -4.95], [1.3, 9.4, 0.15], trim)), box("前端通行门上壁", [0, 95.5, -4.95], [1.6, 6.6, 0.15], trim), ...[-1, 1].map(side => box("上层对向安装的室内操作台", [side * 1.4, 95.3, 1], [0.8, 1.2, 2.5], body))];
    for (const side of [-1, 1]) {
      parts.push(strut("展开到船外的测量桁臂上弦", [side * 1.9, 96.5, -2], [side * 18, 93.6, -2], 0.22, dark), strut("测量桁臂下弦", [side * 1.9, 93.8, -2], [side * 18, 93.6, -2], 0.22, dark), strut("桁臂端部垂下的传感器吊索", [side * 18, 93.6, -2], [side * 18, 84, -2], 0.03, dark), cylinder("吊索末端圆柱测量头", [side * 18, 83.7, -2], [0.4, 0.6, 0.4], trim));
      for (let index = 1; index < 5; index++) { const x = side * (1.9 + index * 3.22), height = 96.5 - index * 0.58; parts.push(strut("三角测量桁臂腹杆", [x - side * 3.22, height + 0.58, -2], [x, 93.6, -2], 0.12, body)); }
      parts.push(...railing("前端工作平台护栏", [side * 2, 89.5, -7], [side * 2, 89.5, -5], 90.7), ...railing("实验舱顶两侧细栏", [side * 2.1, 99, -4.8], [side * 2.1, 99, 4.8], 100));
    }
    for (const y of [12, 28, 44, 60, 76]) parts.push(ring("密封压载隔舱的外周加强环", dark, y < 49 ? 3.28 : y > 70 ? 2.03 : 2.7, 0.12, y, 0.18));
    for (const value of parts.filter(value => value.color === glass)) value.opacity = 0.35;
    return parts;
  } },
  { name: "低干舷旋转炮塔浅水铁甲舰", theme: "蒸汽朋克", tags: ["浅水重炮舰", "monitor ironclad", "旋转炮塔舰"], create: () => {
    const deckOutline: [number, number][] = [[-4.8, -26.2], [4.8, -26.2], [6.35, -22], [6.35, 22], [4.8, 26.2], [-4.8, 26.2], [-6.35, 22], [-6.35, -22]];
    const parts: ModelPart[] = [shipHull(10.6, 48.5, 2.8), polygon("大幅外伸的低干舷装甲甲板", dark, deckOutline, 0.45, [0, 2.8, 0]), cylinder("炮塔下部回转座", [0, 3.42, -1], [6.7, 0.35, 6.7], body), cylinder("炮塔封闭平顶", [0, 6.48, -1], [6.6, 0.18, 6.6], dark)];
    const angles = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 248, 262, 270, 278, 292, 300, 315, 330, 345, 360];
    for (let index = 0; index < angles.length - 1; index++) {
      const a = angles[index]!, b = angles[index + 1]!;
      if (a === 248 || a === 278) parts.push(arcWall("炮口下缘真实弧壁", 3.3, 0.28, a, b, 0.75, 3.6, -1), arcWall("炮口上缘真实弧壁", 3.3, 0.28, a, b, 1.25, 5.15, -1));
      else parts.push(arcWall("真实中空旋转炮塔分段装甲壁", 3.3, 0.28, a, b, 2.8, 3.6, -1));
    }
    for (const side of [-1, 1]) parts.push(barrel("穿过真实炮口的圆筒短炮", [side * 0.84, 4.75, -4.15], [90, 0, 0]), box("炮塔内承载滑床", [side * 0.84, 4.05, -2.1], [0.65, 0.65, 2.5], body));
    parts.push(box("艏部小型厚壁驾驶室", [0, 3.9, -18], [2, 1.3, 2], dark), ...[-1, 1].map(side => box("驾驶室细观察缝", [side * 1.01, 4.12, -18], [0.025, 0.09, 1.1], glass)), cylinder("后部排气短筒", [0, 4.2, 10], [0.85, 1.9, 0.85], dark), cylinder("机舱圆形通风头", [0, 3.8, 14], [1.15, 1.1, 1.15], body), box("艉外露舵叶", [0, 1.4, 25.3], [0.15, 1.8, 1.6], dark));
    for (const z of [-9, 7, 18]) parts.push(cylinder("甲板内凹封闭舱口", [2.6, 3.3, z], [1.15, 0.12, 1.15], body));
    return parts;
  } },
  { name: "斜壁中炮廓式蒸汽铁甲舰", theme: "蒸汽朋克", tags: ["炮廓铁甲舰", "casemate ironclad", "舷列炮廓"], create: () => {
    const slope = Math.hypot(2.5, 3.3), endSlope = Math.hypot(3, 3.3);
    const sideOutline: [number, number][] = [[-16.5, 0], [16.5, 0], [13.5, slope], [-13.5, slope]];
    const sideHoles: [number, number][][] = [-9, -3, 3, 9].map(z => [[z - 0.65, 1.3], [z + 0.65, 1.3], [z + 0.65, 2.4], [z - 0.65, 2.4]]);
    const parts: ModelPart[] = [shipHull(14.2, 68, 3.2), polygon("连续狭窄装甲甲板", dark, [[-4, -34], [4, -34], [7.1, -24], [7.1, 24], [4, 34], [-4, 34], [-7.1, 24], [-7.1, -24]], 0.18, [0, 3.2, 0]), box("封闭炮廓顶部连续盖板", [0, 6.72, 0], [7.65, 0.24, 27.2], dark), cylinder("贯穿炮廓顶部的主烟囱", [0, 10.3, 3], [1.5, 7, 1.5], dark), box("低位装甲瞭望室", [0, 7.45, -7], [2.8, 1.3, 2.7], body), box("瞭望室前端窄窗", [0, 7.63, -8.37], [2.2, 0.12, 0.04], glass)];
    for (const side of [-1, 1]) {
      parts.push(solidPanel("四个真实贯通舷炮口的斜装甲侧壁", [side * 6.3, 3.3, 0], [0, 0, 1], [-side * 2.5 / slope, 3.3 / slope, 0], sideOutline, sideHoles));
      for (const z of [-9, -3, 3, 9]) parts.push(barrel("由真实斜壁炮口伸出的舷侧短炮", [side * 6, 4.75, z], [0, 0, side * 90]), box("炮廓内部木制火炮滑座", [side * 4.35, 4.03, z], [2, 0.7, 0.7], transportColors.wood));
      parts.push(strut("炮廓与低舷边之间的侧向行走踏板", [side * 6.7, 3.45, -14], [side * 6.7, 3.45, 14], 0.25, body));
    }
    for (const end of [-1, 1]) {
      parts.push(solidPanel("有真炮孔的收分斜艏艉炮廓端壁", [0, 3.3, end * 16.5], [1, 0, 0], [0, 3.3 / endSlope, -end * 3 / endSlope], [[-6.3, 0], [6.3, 0], [3.8, endSlope], [-3.8, endSlope]], [[[-0.65, 1.3], [0.65, 1.3], [0.65, 2.4], [-0.65, 2.4]]]), barrel("纵向贯通炮口的端部短炮", [0, 4.75, end * 16.2], [-end * 90, 0, 0]));
    }
    parts.push(strut("水线前端突出的加固撞角", [0, 1.5, -31], [0, 1.5, -36], 0.75, dark), cylinder("后部机舱短通风管", [0, 4.1, 23], [1, 1.8, 1], body));
    return parts;
  } },
];
