import { beam, part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, wheel, cab, surface, helicalFlight, transportColors, type TransportDefinition } from "./parts";

function vehicleAxles(track: number, positions: number[], radius: number): ModelPart[] {
  return positions.flatMap(z => [cylinder("左右轮组之间的承载车桥", [0, radius, z], [0.14, track, 0.14], transportColors.dark, [0, 0, 90]), ...[-1, 1].flatMap(side => wheel([side * track / 2, radius, z], radius, 0.4))]);
}

function conveyor(start: Triple, end: Triple, width: number): ModelPart[] {
  return [beam("连续上行输料带", transportColors.dark, start, end, width, 0.065), beam("上输送带下方的回程带", transportColors.dark, [start[0], start[1] - 0.19, start[2]], [end[0], end[1] - 0.19, end[2]], width, 0.04), ...[-1, 1].map(side => beam("输送机两侧实体承力梁", transportColors.body, [start[0] + side * (width / 2 + 0.045), start[1] - 0.09, start[2]], [end[0] + side * (width / 2 + 0.045), end[1] - 0.09, end[2]], 0.09, 0.19)), ...[start, end].map(position => cylinder("上下输送带在端部回转的横向滚筒", [position[0], position[1] - 0.09, position[2]], [0.2, width + 0.1, 0.2], transportColors.body, [0, 0, 90]))];
}

// 参考真实完整机种的物料路径，造型为原创简化结构，不对应制造商型号。
// https://weilerproducts.com/equipment/material-transfer-vehicles/e1650a/
// https://trebro.com/wp-content/uploads/2021/02/SC2010Roll_spec_sheet.pdf
export const roadExpansionBatchNine: TransportDefinition[] = [
  { name: "缓存双螺旋再拌式沥青混合料中转车", theme: "现代", tags: ["混合料中转车", "缓存再拌仓", "前接料后高位转运"], create: () => {
    const parts: ModelPart[] = [...vehicleAxles(2.4, [-2.3, 2.2], 0.7), box("连接前接料仓与后出料带的专用车架", [0, 1.05, -0.2], [2.16, 0.35, 6.0], transportColors.dark), box("储料仓下方独立计量出料机体", [0, 1.45, 0.3], [1.7, 0.65, 1.8], transportColors.body), box("机器右后方液压动力机罩", [0.82, 1.85, 2.15], [0.95, 1.12, 1.65], transportColors.signal), ...cab([-0.95, 2.3, 2.4], [1.15, 1.35, 1.4]), box("高位操纵室下方与车架相接的承托台", [-0.95, 1.76, 2.4], [1.1, 1.1, 1.45], transportColors.body), ...conveyor([0, 1.5, -3.3], [0, 4.1, -0.6], 1.2), ...conveyor([0, 1.75, 1.6], [0, 3.45, 6.9], 0.9), box("前接料仓底部的连续送料底盘", [0, 1.45, -4.1], [2.25, 0.12, 2.5], transportColors.dark), surface("前接料仓远端薄壁", transportColors.signal, [[-1.65, 2.7, -5.4], [1.65, 2.7, -5.4], [1.1, 1.5, -5.15], [-1.1, 1.5, -5.15]], [0, 1, 2, 0, 2, 3])];
    for (const side of [-1, 1]) {
      parts.push(surface("前接料仓向底部收拢的真实侧壁", transportColors.signal, [[side * 1.65, 2.7, -5.4], [side * 1.65, 2.7, -2.85], [side * 1.1, 1.5, -2.85], [side * 1.1, 1.5, -5.15]], [0, 1, 2, 0, 2, 3]), surface("高位储料仓的独立收分侧壁", transportColors.body, [[side * 0.8, 1.6, -0.5], [side * 0.8, 1.6, 1.1], [side * 1.35, 3.6, 1.6], [side * 1.35, 3.6, -1.0]], [0, 1, 2, 0, 2, 3]), strut("车架托住前方外伸接料仓的斜支撑", [side * 0.85, 1.1, -2.4], [side * 1.05, 1.45, -4.4], 0.16, transportColors.body), strut("后出料输送机外伸段下方的斜支撑", [side * 0.52, 1.1, 2.6], [side * 0.52, 2.9, 5.2], 0.15, transportColors.body));
    }
    for (const end of [-1, 1]) parts.push(surface("储料仓前后端的收分薄壁", transportColors.body, [[-0.8, 1.6, 0.3 + end * 0.8], [0.8, 1.6, 0.3 + end * 0.8], [1.35, 3.6, 0.3 + end * 1.3], [-1.35, 3.6, 0.3 + end * 1.3]], [0, 1, 2, 0, 2, 3]));
    for (const [index, z] of [-0.04, 0.61].entries()) {
      parts.push(cylinder("再拌仓底部独立横向搅拌轴", [0, 1.75, z], [0.09, 1.85, 0.09], transportColors.dark, [0, 0, 90]));
      const screw = helicalFlight([0.82, 1.75, z], 0.05, 0.21, 1.64, 3, index === 0 ? 1 : -1, 0.018);
      screw.rotation.z = 90;
      parts.push(screw);
    }
    parts.push(box("两螺旋再拌仓下方的出料口后导板", [0, 1.61, 1.25], [0.95, 0.15, 0.6], transportColors.dark), box("接料仓前端推车缓冲梁", [0, 1.24, -5.53], [2.95, 0.22, 0.24], transportColors.body), cylinder("后出料皮带朝向调节回转座", [0, 1.57, 1.6], [1.15, 0.22, 1.15], transportColors.body));
    return parts;
  } },
  { name: "整层铲切自动卷皮堆卷草皮收割机", theme: "现代", tags: ["自走草皮收割机", "水平铲切卷皮", "自动码卷门架"], create: () => {
    const parts: ModelPart[] = [...vehicleAxles(2.2, [-1.95, 1.92], 0.6), box("承载铲切头和堆卷设备的独立机架", [0, 0.95, 0], [2.2, 0.35, 5.45], transportColors.dark), ...cab([-0.56, 1.23, 0.05], [1.05, 1.5, 1.6]), box("机器左后方独立动力罩", [-0.47, 1.58, 1.87], [1.3, 0.98, 1.45], transportColors.body), box("草皮根层下方的水平薄铲切刀", [0, 0.05, -3.05], [1.2, 0.035, 0.5], transportColors.trim), cylinder("接在薄铲切刀后方的拾取导向辊", [0, 0.18, -2.98], [0.21, 1.22, 0.21], transportColors.body, [0, 0, 90]), ...conveyor([0, 0.28, -2.91], [0, 1.6, -1.55], 1.16), cylinder("卷皮头前侧横向主动滚筒", [0, 1.77, -1.45], [0.34, 1.23, 0.34], transportColors.dark, [0, 0, 90]), cylinder("卷皮头后侧反向压卷滚筒", [0, 1.77, -0.78], [0.34, 1.23, 0.34], transportColors.dark, [0, 0, 90]), box("从卷皮头横向移送草卷的侧置输送台", [0.76, 1.55, -0.98], [1.95, 0.12, 0.8], transportColors.body), box("与驾驶室分开的右后侧堆卷承托台", [1.1, 1.35, 1.3], [1.5, 0.15, 2.3], transportColors.body), box("堆卷台顶端横向码放轨梁", [1.1, 3.34, 1.25], [1.75, 0.17, 0.3], transportColors.signal), box("横梁下可升降夹持草卷的承载架", [1.1, 2.7, 1.25], [1.15, 0.14, 0.38], transportColors.dark), cylinder("码卷机构立柱后方的垂直举升液压缸", [1.82, 2.37, 1.41], [0.11, 1.6, 0.11], transportColors.body), cylinder("举升缸向顶梁伸出的活塞杆", [1.82, 3.12, 1.41], [0.048, 0.35, 0.048], transportColors.trim)];
    for (const side of [-1, 1]) {
      parts.push(cylinder("限定草皮条两侧边线的竖向圆刀", [side * 0.61, 0.23, -3.24], [0.42, 0.025, 0.42], transportColors.body, [0, 0, 90]), strut("侧切圆刀与前铲切刀共用的支承臂", [side * 0.61, 0.23, -3.24], [side * 0.61, 0.39, -2.65], 0.06, transportColors.signal), strut("前铲切刀背与提升输送机的连接耳", [side * 0.53, 0.1, -3.0], [side * 0.53, 0.3, -2.78], 0.055), box("卷皮头两端滚筒轴承侧板", [side * 0.62, 1.77, -1.12], [0.08, 0.48, 1.0], transportColors.body), box("右侧堆卷台的升降门架立柱", [1.1 + side * 0.72, 2.35, 1.25], [0.13, 1.95, 0.28], transportColors.signal), strut("横梁下夹持一卷草皮的垂直夹臂", [1.1 + side * 0.6, 2.7, 1.25], [1.1 + side * 0.6, 2.45, 1.25], 0.065, transportColors.body), box("夹臂底端向内伸出的短托叉", [1.1 + side * 0.5, 2.44, 1.25], [0.25, 0.06, 0.4], transportColors.dark), strut("机架至右侧堆卷承台的承重斜撑", [0.55, 0.98, 1.3 + side * 0.75], [1.72, 1.31, 1.3 + side * 0.75], 0.12, transportColors.body));
    }
    const freshlyRolled = ring("卷皮头中实际成形的一卷草皮", "#718658", 0.29, 0.19, 0, 0.95, { position: { x: 0, y: 2.09, z: -1.12 }, rotation: { x: 0, y: 0, z: 90 } });
    parts.push(freshlyRolled);
    for (const y of [1.663, 2.139]) for (const z of [0.55, 1.2, 1.85]) parts.push(cylinder("已经码放在承台上的土根草卷", [1.1, y, z], [0.46, 1.08, 0.46], "#847354", [0, 0, 90]), ring("根层草卷外周连续草面", "#718658", 0.238, 0.014, 0, 1.1, { position: { x: 1.1, y, z }, rotation: { x: 0, y: 0, z: 90 } }));
    parts.push(cylinder("动力罩后方竖向排气管", [-0.95, 2.25, 1.9], [0.09, 0.8, 0.09], transportColors.dark));
    return parts;
  } },
];
