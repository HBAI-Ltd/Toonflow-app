import { part, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";

function climbingTrack(x: number): ModelPart {
  const outlines = [[[-0.5, 0.03], [0.48, 0.03], [0.76, 0.34], [0.76, 0.52], [-0.5, 0.52], [-0.64, 0.36]], [[-0.47, 0.07], [0.46, 0.07], [0.72, 0.36], [0.72, 0.48], [-0.48, 0.48], [-0.6, 0.35]]];
  const vertices = [-0.07, 0.07].flatMap(sideX => outlines.flatMap(outline => outline.map(([z, y]) => ({ x: sideX, y: y!, z: z! }))));
  const indices: number[] = [];
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    indices.push(i, j, 6 + j, i, 6 + j, 6 + i, 12 + i, 18 + j, 12 + j, 12 + i, 18 + i, 18 + j, i, 12 + i, 12 + j, i, 12 + j, j, 6 + i, 6 + j, 18 + j, 6 + i, 18 + j, 18 + i);
  }
  return part("前平后翘的贯通履带环", "mesh", transportColors.dark, [x, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const dailyMobilityModels: TransportDefinition[] = [
  { name: "折叠篷罩婴儿推车", theme: "现代", tags: ["婴儿车", "童车", "儿童推车", "折叠车架", "半拱遮阳篷", "车下储物篮"], create: () => {
    const parts = [box("柔性座兜下部承板", [0, 0.57, -0.03], [0.43, 0.09, 0.47], transportColors.signal), box("后倾座兜靠背", [0, 0.78, 0.22], [0.43, 0.48, 0.07], transportColors.body, [16, 0, 0]), box("婴儿足部承托板", [0, 0.4, -0.32], [0.38, 0.07, 0.2], transportColors.dark), box("下方储物篮底", [0, 0.26, 0.03], [0.43, 0.045, 0.43], transportColors.dark), box("把手横向握持杆", [0, 1.04, 0.47], [0.55, 0.05, 0.055], transportColors.dark), box("座兜前方防滑护杆", [0, 0.76, -0.24], [0.48, 0.04, 0.045], transportColors.trim)];
    for (const side of [-1, 1]) {
      parts.push(...wheel([side * 0.29, 0.11, -0.32], 0.11, 0.07), ...wheel([side * 0.29, 0.14, 0.34], 0.14, 0.08), strut("前轮至推把的长车架", [side * 0.27, 0.11, -0.32], [side * 0.25, 1.04, 0.47], 0.032), strut("后轮至座兜前部的交叉架", [side * 0.28, 0.14, 0.34], [side * 0.25, 0.65, -0.23], 0.032), cylinder("车架交叉折叠转轴", [side * 0.27, 0.53, 0.04], [0.075, 0.055, 0.075], transportColors.dark, [0, 0, 90]), box("座兜两侧连续软包", [side * 0.22, 0.67, 0], [0.055, 0.18, 0.45], transportColors.body), box("储物篮侧围", [side * 0.22, 0.34, 0.03], [0.025, 0.16, 0.43], transportColors.dark));
    }
    const profile = [0.34, 0.326].flatMap((radius, ringIndex) => Array.from({ length: 7 }, (_, index) => { const angle = (ringIndex ? 6 - index : index) * Math.PI / 12; return { x: -Math.cos(angle) * radius, y: Math.sin(angle) * radius }; }));
    parts.push(part("围绕座兜后部的弧形篷布", "extrude", transportColors.signal, [0, 0.84, 0.08], [1, 1, 1], [0, 90, 0], { depth: 0.55, profile }));
    return parts;
  } },
  { name: "网架式步行雪鞋", theme: "现代", itemType: "运动用品", tags: ["雪鞋", "踏雪板", "大面积雪地支撑", "网格承托", "足部绑带"], create: () => {
    const outline = [[0, -0.43], [-0.11, -0.36], [-0.17, -0.18], [-0.17, 0.15], [-0.1, 0.31], [0, 0.39], [0.1, 0.31], [0.17, 0.15], [0.17, -0.18], [0.11, -0.36], [0, -0.43]];
    const parts: ModelPart[] = [part("连续弯曲雪鞋外承力框", "tube", transportColors.trim, [0, 0.035, 0], [1, 1, 1], [0, 0, 0], { radius: 0.009, path: outline.map(([x, z]) => ({ x: x!, y: 0, z: z! })) }), box("鞋尖下方旋转绑带底板", [0, 0.05, -0.08], [0.15, 0.022, 0.22], transportColors.dark), box("脚跟防滑托垫", [0, 0.05, 0.15], [0.14, 0.025, 0.16], transportColors.dark), ...[-1, 1].map(side => strut("足跟后部约束带", [side * 0.07, 0.09, 0.04], [side * 0.055, 0.13, 0.23], 0.012))];
    for (const z of [-0.27, -0.17, -0.07, 0.03, 0.13, 0.23]) { const halfWidth = z > 0.15 ? 0.13 : 0.16; parts.push(strut("雪鞋横向承托网绳", [-halfWidth, 0.035, z], [halfWidth, 0.035, z], 0.008, transportColors.body)); }
    for (const x of [-0.08, 0, 0.08]) parts.push(strut("雪鞋纵向承托网绳", [x, 0.037, -0.35], [x, 0.037, 0.29], 0.008, transportColors.body));
    for (const z of [-0.12, 0]) parts.push(part("鞋面上拱的闭合绑带", "tube", transportColors.signal, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.008, path: [{ x: -0.075, y: 0.05, z }, { x: -0.08, y: 0.12, z }, { x: 0, y: 0.16, z }, { x: 0.08, y: 0.12, z }, { x: 0.075, y: 0.05, z }] }));
    parts.push(box("绑带中央前掌止滑齿", [0, 0.02, -0.1], [0.12, 0.04, 0.018], transportColors.trim));
    return parts;
  } },
  { name: "履带式电动爬楼轮椅", theme: "现代", tags: ["辅助出行", "爬楼轮椅", "履带轮椅", "座椅调平支架", "翘起爬阶履带"], create: () => {
    const parts = [box("座椅下部电池驱动舱", [0, 0.49, 0.02], [0.56, 0.25, 0.7], transportColors.dark), box("软包乘坐座面", [0, 0.7, -0.02], [0.5, 0.12, 0.48], transportColors.body), box("上部后倾支撑靠背", [0, 1.02, 0.23], [0.5, 0.64, 0.1], transportColors.body, [12, 0, 0]), box("前下方连续脚踏板", [0, 0.31, -0.57], [0.48, 0.06, 0.26], transportColors.trim), cylinder("座椅俯仰调平主轴", [0, 0.6, 0], [0.13, 0.64, 0.13], transportColors.trim, [0, 0, 90]), strut("座椅调平作动缸", [0, 0.4, 0.2], [0, 0.63, -0.24], 0.065), box("扶手前端控制器", [0.34, 0.99, -0.26], [0.12, 0.06, 0.17], transportColors.dark), strut("控制器小操纵杆", [0.34, 1.02, -0.26], [0.34, 1.08, -0.28], 0.018)];
    for (const side of [-1, 1]) {
      const x = side * 0.38;
      parts.push(climbingTrack(x), box("履带内部窄承力梁", [x, 0.25, 0.05], [0.09, 0.13, 0.9]), box("软包两侧手臂扶手", [side * 0.31, 0.97, -0.02], [0.1, 0.07, 0.52], transportColors.body), strut("扶手立向支撑", [side * 0.31, 0.62, 0.08], [side * 0.31, 0.94, 0.08], 0.035), strut("前端脚踏支架", [side * 0.2, 0.68, -0.2], [side * 0.2, 0.31, -0.57], 0.04));
      for (const [z, y] of [[-0.48, 0.15], [0.4, 0.15], [0.63, 0.4]]) parts.push(...wheel([x, y!, z!], 0.12, 0.09));
    }
    return parts;
  } },
];
