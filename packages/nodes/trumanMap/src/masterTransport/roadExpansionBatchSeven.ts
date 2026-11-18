import { beam, part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, wheel, surface, transportColors, type TransportDefinition } from "./parts";

function ram(name: string, start: Triple, end: Triple, diameter: number): ModelPart[] {
  const joint = start.map((value, index) => value + (end[index]! - value) * 0.62) as Triple;
  return [{ ...strut(`${name}外筒`, start, joint, diameter), shape: "cylinder" }, { ...strut(`${name}活塞杆`, joint, end, diameter * 0.46, transportColors.trim), shape: "cylinder" }];
}

function wheels(track: number, zPositions: number[], radius: number): ModelPart[] {
  return zPositions.flatMap(z => [cylinder("独立车桥的横向承重轴", [0, radius, z], [0.13, track, 0.13], transportColors.dark, [0, 0, 90]), ...[-1, 1].flatMap(side => wheel([side * track / 2, radius, z], radius, 0.34))]);
}

// 完整机种参考制造商公开分类，不下载BIM/模型，也不复制具体品牌外观。
// https://www.genielift.com/en/support/BIM
// https://www.weilerproducts.com/equipment/road-wideners/w730c/
export const roadExpansionBatchSeven: TransportDefinition[] = [
  { name: "平行折臂回转底盘自行高空作业平台", theme: "现代", tags: ["自行曲臂高空作业平台", "平行四边形下臂", "伸缩上臂与调平工作篮"], create: () => {
    const parts: ModelPart[] = [...wheels(1.9, [-1.2, 1.2], 0.49), box("无公路车头的紧凑低位承载车架", [0, 0.78, 0], [1.63, 0.36, 3.5], transportColors.dark), cylinder("连接整套折臂的独立回转支承", [0, 1.03, 0], [1.42, 0.25, 1.42], transportColors.body), box("上车体回转平台", [0, 1.26, 0], [1.55, 0.25, 2.25], transportColors.signal), box("折臂后方的一体式动力配重", [0, 1.48, 0.86], [1.68, 0.7, 1.0], transportColors.body), box("配重箱尾端散热通气面", [0, 1.48, 1.38], [1.38, 0.43, 0.035], transportColors.dark), beam("中部上臂的粗外套箱形梁", transportColors.signal, [0, 4.25, -2.1], [0, 6.25, -3.84], 0.32, 0.38), beam("沿相同中轴伸出的内套箱形梁", transportColors.body, [0, 5.95, -3.58], [0, 7.3, -4.75], 0.22, 0.25), strut("伸缩上臂末端的独立短折臂", [0, 7.3, -4.75], [0, 6.65, -5.4], 0.14, transportColors.signal), box("短折臂与调平工作篮的连接座", [0, 6.75, -5.35], [0.6, 0.25, 0.12], transportColors.body), box("高空工作篮的真实薄底板", [0, 6.65, -5.9], [1.85, 0.12, 1.15], transportColors.dark), ...ram("下折臂举升主液压缸", [0, 1.03, -0.75], [0, 3.0, -1.21], 0.18), ...ram("上伸缩臂抬升液压缸", [0, 3.98, -2.0], [0, 5.18, -2.91], 0.13), ...ram("末端短折臂俯仰液压缸", [0, 6.92, -4.59], [0, 6.78, -5.25], 0.07)];
    for (const side of [-1, 1]) {
      parts.push(strut("下部平行四边形的下承力杆", [side * 0.3, 1.45, -0.1], [side * 0.3, 4.25, -2.1], 0.18, transportColors.signal), strut("保持头部姿态的上平行承力杆", [side * 0.3, 1.9, -0.1], [side * 0.3, 4.7, -2.1], 0.13, transportColors.body), strut("上下平行杆末端的短竖接头", [side * 0.3, 4.25, -2.1], [side * 0.3, 4.7, -2.1], 0.14, transportColors.signal), box("下平行杆车架端共同承托座", [side * 0.3, 1.63, -0.1], [0.24, 0.67, 0.28], transportColors.body));
      for (const z of [-6.42, -5.38]) parts.push(strut("篮筐四角竖直防护栏杆", [side * 0.87, 6.7, z], [side * 0.87, 7.75, z], 0.035, transportColors.body));
      for (const y of [7.18, 7.75]) parts.push(strut("工作篮两侧连续横向护栏", [side * 0.87, y, -6.42], [side * 0.87, y, -5.38], 0.035, transportColors.body));
    }
    for (const z of [-6.42, -5.38]) for (const y of [7.18, 7.75]) parts.push(strut("工作篮前后横向防护栏", [-0.87, y, z], [0.87, y, z], 0.035, transportColors.body));
    parts.push(cylinder("下平行杆根部贯穿横销", [0, 1.45, -0.1], [0.16, 0.9, 0.16], transportColors.trim, [0, 0, 90]), cylinder("上平行杆根部贯穿横销", [0, 1.9, -0.1], [0.13, 0.9, 0.13], transportColors.trim, [0, 0, 90]), cylinder("头部接头与上臂共同横销", [0, 4.25, -2.1], [0.18, 0.9, 0.18], transportColors.trim, [0, 0, 90]), box("固定在工作篮后护栏上的操纵台", [0.48, 7.45, -5.42], [0.5, 0.23, 0.25], transportColors.dark));
    return parts;
  } },
  { name: "横向皮带出料自行路肩扩宽布料机", theme: "现代", tags: ["路肩扩宽机", "侧向转运布料", "独立侧置成形板"], create: () => {
    const parts: ModelPart[] = [...wheels(2.04, [-1.76, 1.65], 0.5), box("承托侧向布料机构的专用低车架", [0, 0.83, 0], [1.85, 0.35, 4.85], transportColors.dark), box("后置动力与配重机罩", [0, 1.47, 1.5], [1.74, 1.08, 1.72], transportColors.signal), box("后部散热格栅", [0, 1.47, 2.38], [1.4, 0.8, 0.04], transportColors.dark), box("中部驾驶员开放操作地台", [0, 1.1, 0], [1.73, 0.18, 1.25], transportColors.body), box("驾驶员独立坐垫", [-0.42, 1.46, 0.05], [0.55, 0.18, 0.55], transportColors.dark), box("驾驶员与后机罩分开的竖向靠背", [-0.42, 1.79, 0.36], [0.55, 0.65, 0.09], transportColors.dark), box("操纵侧向布料的独立控制台", [0.34, 1.58, -0.24], [0.52, 0.5, 0.3], transportColors.dark), box("由四根立柱支撑的操作位顶棚", [0, 2.54, 0], [1.95, 0.09, 1.52], transportColors.body), surface("接料斗远离出料口一侧的收分壁", transportColors.signal, [[-1.5, 2.0, -2.56], [-1.5, 2.0, -1.05], [-1.1, 0.95, -1.35], [-1.1, 0.95, -2.25]], [0, 1, 2, 0, 2, 3]), surface("接料斗前方收分斜壁", transportColors.signal, [[-1.5, 2.0, -2.56], [1.3, 2.0, -2.56], [1.1, 0.95, -2.25], [-1.1, 0.95, -2.25]], [0, 1, 2, 0, 2, 3]), surface("接料斗后方收分斜壁", transportColors.signal, [[-1.5, 2.0, -1.05], [-1.1, 0.95, -1.35], [1.1, 0.95, -1.35], [1.3, 2.0, -1.05]], [0, 1, 2, 0, 2, 3]), box("从接料斗底部向右贯通的上层输料带", [1.25, 0.94, -1.8], [4.9, 0.035, 1.02], transportColors.dark), box("同一输送带下方的回程带", [1.25, 0.66, -1.8], [4.9, 0.035, 1.02], transportColors.dark), box("位于路肩而非整车后方的长条成形刮板", [3.52, 0.31, -0.76], [3.35, 0.5, 0.12], transportColors.body, [0, 12, 0]), strut("连接侧置成形板与车架的内侧主支臂", [0.96, 1.1, -0.15], [2.65, 0.82, -0.48], 0.18, transportColors.signal), strut("从主支臂折向成形板的外侧连接臂", [2.65, 0.82, -0.48], [3.5, 0.51, -0.76], 0.15, transportColors.signal), ...ram("侧置成形板角度调整缸", [0.84, 1.03, 0.24], [2.74, 0.81, -0.4], 0.12), ...ram("成形板高程独立调整缸", [2.65, 0.82, -0.48], [3.5, 0.38, -0.8], 0.09)];
    for (const x of [-1.2, 3.7]) parts.push(cylinder("输送带两端与上下带段相接的滚筒", [x, 0.8, -1.8], [0.28, 1.08, 0.28], transportColors.body, [90, 0, 0]));
    for (const z of [-2.35, -1.25]) parts.push(box("贯穿接料斗与侧出料段的输送机纵梁", [1.25, 0.58, z], [5.08, 0.14, 0.12], transportColors.signal), strut("侧向输送机外伸段至车架的斜撑", [0.75, 0.78, z + 0.25], [3.15, 0.59, z], 0.095, transportColors.body));
    for (const side of [-1, 1]) for (const z of [-0.6, 0.6]) parts.push(strut("开放驾驶位顶棚的独立支柱", [side * 0.82, 1.15, z], [side * 0.82, 2.52, z], 0.045, transportColors.dark));
    parts.push(box("前部接料斗开口的防撞推料横梁", [0, 0.85, -2.59], [2.65, 0.22, 0.2], transportColors.body), box("成形板底缘的耐磨贴地刃条", [3.52, 0.055, -0.76], [3.35, 0.07, 0.15], transportColors.dark, [0, 12, 0]));
    return parts;
  } },
];
