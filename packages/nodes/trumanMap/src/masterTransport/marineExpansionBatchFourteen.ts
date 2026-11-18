import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, shipHull, strut, surface, transportColors, type TransportDefinition } from "./parts";
import { openHull } from "./marineExpansionBatchOne";
import { createMarinePropellerParts } from "./marineEquipmentModels";

// 原创简化的两种滑行载体：前滑靴/后浸桨三点布局，以及平底空气推进敞口船。
// https://thunderboats.ning.com/page/hydroplanes-101
// https://thunderboats.ning.com/page/unlimited-glossary-of-technical-terms
// https://www.americanairboats.com/recently-sold-airboats/
// https://canadianairboats.com/airboats-workboats/

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;

function glazing(name: string, points: Triple[]): ModelPart {
  const value = surface(name, transportColors.glass, points, [0, 1, 2, 0, 2, 3]);
  value.opacity = 0.4;
  value.roughness = 0.16;
  return value;
}

export const marineExpansionBatchFourteen: TransportDefinition[] = [
  { name: "双前滑靴后浸桨三点式竞速滑行艇", theme: "现代", itemType: "运动用品", tags: ["三点式竞速滑行艇", "hydroplane", "前滑靴气动桥"], create: () => {
    const hull = shipHull(1.3, 9, 0.8);
    hull.name = "高于滑靴运行面的窄中央船体";
    hull.position.y = 0.35;
    const propeller = createMarinePropellerParts().map(value => ({ ...value, position: { x: value.position.x * 0.09, y: 0.35 + (value.position.y - 4) * 0.09, z: 5.1 + value.position.z * 0.09 }, scale: { x: value.scale.x * 0.09, y: value.scale.y * 0.09, z: value.scale.z * 0.09 } }));
    const parts: ModelPart[] = [hull, part("连两前滑靴并留出下部气道的主气动桥翼", "extrude", body, [0, 0.62, -0.4], [1, 1, 1], [0, 90, 0], { depth: 4.1, profile: [{ x: -1.2, y: 0.05 }, { x: -0.9, y: 0.18 }, { x: 0.9, y: 0.08 }, { x: 1.1, y: 0 }, { x: 0.5, y: -0.05 }, { x: -0.9, y: -0.03 }] }), box("驾驶位座椅与船体甲板之间的实脚", [0, 1.19, -0.6], [0.3, 0.12, 0.4], dark), box("前置驾驶座坐垫", [0, 1.3, -0.6], [0.55, 0.14, 0.6], dark), box("驾驶座后背", [0, 1.6, -0.25], [0.55, 0.6, 0.1], dark), glazing("向后倾斜并有真实舱内空间的前风挡", [[-0.43, 1.15, -1.7], [0.43, 1.15, -1.7], [0.35, 1.9, -1.2], [-0.35, 1.9, -1.2]]), glazing("座舱后方独立斜玻璃", [[-0.35, 1.9, -0.1], [0.35, 1.9, -0.1], [0.43, 1.15, 0.4], [-0.43, 1.15, 0.4]]), box("连接侧玻璃上沿的窄座舱顶", [0, 1.93, -0.65], [0.7, 0.06, 1.1], body), part("驾驶舱后方有真实进出气口的动力罩", "lathe", dark, [0, 1.57, 2.05], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.34, y: -1.2 }, { x: 0.42, y: -1.2 }, { x: 0.42, y: 1.2 }, { x: 0.34, y: 1.2 }, { x: 0.34, y: -1.2 }] }), cylinder("由船体下后段伸向浸水桨的推进轴", [0, 0.35, 4.55], [0.14, 1.3, 0.14], dark, [90, 0, 0]), strut("推进轴到船体的倾斜承托", [0, 0.9, 3.9], [0, 0.35, 4.4], 0.14, dark), ...propeller, part("由后机罩两侧支柱承托的气动尾翼", "extrude", body, [0, 2.2, 3.8], [1, 1, 1], [0, 90, 0], { depth: 3.8, profile: [{ x: -0.4, y: 0 }, { x: -0.25, y: 0.1 }, { x: 0.35, y: 0.04 }, { x: 0.45, y: 0 }, { x: 0.2, y: -0.04 }, { x: -0.3, y: -0.03 }] }), box("艉后浸水转向舵叶", [0.7, 0.15, 4.5], [0.08, 0.6, 0.7], dark), box("左滑靴后缘以下的防侧滑刀鳍", [-2.25, 0.2, 0.5], [0.05, 0.7, 0.7], dark), box("将防侧滑刀实接到滑靴侧壁的连接耳", [-2.13, 0.55, 0.5], [0.3, 0.1, 0.4], dark)];
    for (const side of [-1, 1]) {
      const sponson = shipHull(1, 5.3, 0.7);
      sponson.name = "从中央气动桥前伸出的独立承压滑靴";
      sponson.position = { x: side * 1.8, y: 0, z: -1.85 };
      parts.push(sponson, box("滑靴后部与水面接触的耐磨滑行面", [side * 1.8, 0.02, 0.15], [0.52, 0.04, 0.95], dark), glazing("驾驶舱侧面留出真实座椅空腔的玻璃", [[side * 0.43, 1.15, -1.7], [side * 0.35, 1.9, -1.2], [side * 0.35, 1.9, -0.1], [side * 0.43, 1.15, 0.4]]), strut("后尾翼到中央船体的直立支承", [side * 0.5, 1.13, 3.8], [side * 0.5, 2.2, 3.8], 0.12, dark));
    }
    parts.push(strut("尾舵铰支座与船体右后舷实接的承臂", [0.4, 0.8, 4.2], [0.7, 0.3, 4.45], 0.1, dark));
    return parts;
  } },
  { name: "平底浅吃水敞口笼罩空气桨沼泽艇", theme: "现代", tags: ["沼泽风扇艇", "airboat", "空气螺旋桨平底船"], create: () => {
    const hull = openHull("艏底抬起且船内真正敞口的平底浅舷船壳", [[-3.1, 0.8, 0.72, 0.25], [-2.4, 1.1, 0.95, 0.58], [2.7, 1.2, 1.05, 0.62], [3, 1.2, 1.05, 0.62]], 0.065, body);
    hull.vertices = hull.vertices!.map(point => ({ ...point, y: point.y + (point.z < -3 ? 0.45 : point.z < -2 ? 0.02 : 0) }));
    const parts: ModelPart[] = [hull, surface("与上翘艏底及侧舷真正封合的艏端板", body, [[-0.8, 0.7, -3.1], [0.8, 0.7, -3.1], [0.72, 0.45, -3.1], [-0.72, 0.45, -3.1]], [0, 1, 2, 0, 2, 3]), surface("与平底和两侧斜舷封合的梯形艉封板", body, [[-1.2, 0.62, 3], [1.2, 0.62, 3], [1.05, 0, 3], [-1.05, 0, 3]], [0, 1, 2, 0, 2, 3]), box("高位操舵座共同承载平台", [0, 1.28, -0.3], [1.5, 0.15, 1.3], dark), box("操舵座实脚", [0, 1.39, -0.3], [0.35, 0.12, 0.4], body), box("操舵员高位坐垫", [0, 1.5, -0.3], [0.65, 0.12, 0.6], trim), box("操舵员高座靠背", [0, 1.85, 0], [0.65, 0.65, 0.1], trim), box("前方低位乘员横座", [0, 0.62, -1.7], [1.8, 0.12, 0.5], trim), box("前横座竖靠背", [0, 0.9, -1.45], [1.8, 0.6, 0.1], trim), box("后部架空发动机承台", [0, 1.07, 1.2], [1, 0.15, 1], dark), box("空气推进用汽油发动机机体", [0, 1.44, 1.2], [0.8, 0.6, 0.9], body), box("把输出轴抬到空气桨中心的减速箱", [0, 1.8, 1.7], [0.38, 0.7, 0.35], dark), cylinder("穿过前护网中心开口的推进轴", [0, 2.05, 2.15], [0.12, 0.65, 0.12], trim, [90, 0, 0]), cylinder("空气桨中央短轮毂", [0, 2.05, 2.55], [0.32, 0.25, 0.32], dark, [90, 0, 0]), strut("操舵座左侧的转向操纵杆", [-0.62, 1.35, -0.5], [-0.62, 2, -0.42], 0.04, dark), box("操纵杆上端握持柄", [-0.62, 2, -0.42], [0.16, 0.05, 0.06], trim)];
    for (const z of [2.05, 2.55, 3]) parts.push(part("空气桨外围保留真实内空的连续金属护圈", "lathe", dark, [0, 2.05, z], [1, 1, 1], [90, 0, 0], { profile: [{ x: 1.105, y: -0.018 }, { x: 1.135, y: -0.018 }, { x: 1.135, y: 0.018 }, { x: 1.105, y: 0.018 }, { x: 1.105, y: -0.018 }] }));
    for (let index = 0; index < 3; index++) {
      const angle = index * Math.PI * 2 / 3, points = [[0.15, 0, -0.06], [0.85, 0.08, 0], [1.05, 0.18, 0.06], [0.9, 0.32, 0.08], [0.2, 0.15, -0.02]].map(([x, y, z]) => [x! * Math.cos(angle) - y! * Math.sin(angle), 2.05 + x! * Math.sin(angle) + y! * Math.cos(angle), 2.55 + z!] as Triple);
      parts.push(surface("完全处在护圈净空内的扭转空气桨叶", trim, points, [0, 1, 2, 0, 2, 3, 0, 3, 4]));
    }
    for (let index = 0; index < 10; index++) {
      const angle = index * Math.PI / 5, x = Math.cos(angle), y = Math.sin(angle);
      for (const z of [2.05, 3]) parts.push(strut("前后护网避开中心轴孔的径向格条", [x * 0.2, 2.05 + y * 0.2, z], [x * 1.12, 2.05 + y * 1.12, z], 0.018, dark));
      if (!(index % 2)) parts.push(strut("把前后护圈连成整体笼罩的纵向杆", [x * 1.12, 2.05 + y * 1.12, 2.05], [x * 1.12, 2.05 + y * 1.12, 3], 0.025, dark));
    }
    for (const side of [-1, 1]) {
      for (const z of [-0.8, 0.2]) parts.push(strut("操舵高平台四角落入船底的支腿", [side * 0.6, 0.06, z], [side * 0.6, 1.22, z], 0.07, dark));
      for (const z of [0.75, 1.65]) parts.push(strut("后发动机承台四角落入船底的斜腿", [side * 0.52, 0.06, z], [side * 0.45, 1, z], 0.08, dark));
      for (const z of [2.05, 3]) parts.push(strut("外护笼与船底连成整体的斜支承", [side * 0.9, 0.06, z - 0.15], [side * 0.75, 1.24, z], 0.08, dark));
      parts.push(strut("前排低位横座的直立支脚", [side * 0.7, 0.06, -1.7], [side * 0.7, 0.56, -1.7], 0.08, dark), cylinder("上下都实接后护圈的转向舵铰轴", [side * 0.45, 2.05, 3], [0.045, 2.1, 0.045], dark), box("处在空气桨后方的独立垂直导流舵", [side * 0.45, 2.05, 3.25], [0.05, 1.5, 0.6], body));
    }
    parts.push(strut("连接双空气舵下端的同步操纵横杆", [-0.45, 1.2, 3], [0.45, 1.2, 3], 0.035, trim));
    return parts;
  } },
];
