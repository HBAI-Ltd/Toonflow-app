import { part, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, wheel, transportColors, type TransportDefinition } from "./parts";

function mastChannel(name: string, side: number, inner: boolean): ModelPart {
  const contour = inner ? [[0, -0.05], [0.1, -0.05], [0.1, 0.05], [0, 0.05], [0, 0.025], [0.07, 0.025], [0.07, -0.025], [0, -0.025]] : [[0, -0.1], [0.16, -0.1], [0.16, 0.1], [0, 0.1], [0, 0.06], [0.11, 0.06], [0.11, -0.06], [0, -0.06]];
  return part(name, "extrude", inner ? transportColors.trim : transportColors.body, [side * 0.38, inner ? 2.25 : 1.92, -0.95], [1, 1, 1], [90, 0, 0], { depth: inner ? 3.0 : 2.88, profile: contour.map(([x, z]) => ({ x: side * x!, y: z! })) });
}

// 整副门架在跨腿导轨上前移，后轮司机体保持不动，不是平衡重叉车改车色或换门架级数。
// https://nic.crown/content/dam/crown/pdfs/en-us/operator-manuals/reach-trucks/esr-1000-specifications.pdf
export const roadExpansionBatchTwentyOne: TransportDefinition[] = [
  { name: "双跨腿导轨前移门架式仓储叉车", theme: "现代", tags: ["前移式叉车", "整门架横向前移回收", "跨腿承载与侧向司机位"], create: () => {
    const parts: ModelPart[] = [
      box("高于驱动轮且连接双前腿的后车体底盘", [0, 0.49, 0.675], [1.15, 0.12, 1.25], transportColors.dark),
      box("后车体内独立的低位蓄电池配重舱", [0, 0.88, 0.8], [1.15, 0.66, 1.2], transportColors.body),
      ...wheel([-0.25, 0.2, 1.05], 0.2, 0.2),
      ...wheel([0.42, 0.12, 0.85], 0.12, 0.12),
      cylinder("小支承轮叉上与后底盘连接的实际转向轴", [0.42, 0.42, 0.85], [0.07, 0.12, 0.07], transportColors.dark),
      box("司机体内侧朝向作业侧的横向座垫", [-0.2, 1.28, 0.75], [0.44, 0.14, 0.45], transportColors.dark),
      box("侧向司机座的靠背", [-0.44, 1.58, 0.75], [0.08, 0.5, 0.45], transportColors.dark),
      box("面对前移门架的侧置操纵台", [0.42, 1.5, 0.7], [0.22, 0.4, 0.55], transportColors.signal),
      box("侧置操纵台接到后机身的实际支座", [0.42, 1.23, 0.7], [0.18, 0.15, 0.45], transportColors.body),
      box("司机体上方连续防落物顶盖", [0, 2.39, 0.7], [1.25, 0.08, 1.35], transportColors.dark),
      box("横跨前腿导轨并承托整个前移门架的滑台", [0, 0.46, -0.95], [1.4, 0.12, 0.45], transportColors.dark),
      box("后司机体接受前移缸反力的固定耳座", [0, 0.33, 0.15], [0.3, 0.24, 0.25], transportColors.body),
      cylinder("双跨腿之间推动整个门架的水平前移缸", [0, 0.3, -0.175], [0.1, 0.65, 0.1], transportColors.dark, [90, 0, 0]),
      cylinder("前移缸接到门架滑台的共轴活塞杆", [0, 0.3, -0.705], [0.04, 0.49, 0.04], transportColors.trim, [90, 0, 0]),
      box("把前移缸杆端接到门架滑台底部的铰座", [0, 0.37, -0.95], [0.3, 0.22, 0.25], transportColors.body),
      box("外门架根部承力横梁", [0, 0.54, -0.95], [1.13, 0.12, 0.25], transportColors.body),
      box("外门架顶部承力横梁", [0, 3.36, -0.95], [1.13, 0.12, 0.2], transportColors.body),
      box("内门架顶部与起升机构相接的承力横梁", [0, 3.75, -0.95], [0.99, 0.12, 0.12], transportColors.trim),
      box("升降货叉架上横梁", [0, 0.98, -1.13], [1.08, 0.2, 0.13], transportColors.dark),
      box("升降货叉架下横梁", [0, 0.62, -1.13], [1.08, 0.09, 0.13], transportColors.dark),
      box("起升链端与叉架之间的实际承托桥", [0, 0.98, -1.0], [0.6, 0.1, 0.28], transportColors.dark),
    ];
    for (const side of [-1, 1]) {
      parts.push(box("保留中间托盘净空的独立长承载前腿", [side * 0.64, 0.26, -0.6], [0.15, 0.16, 1.6], transportColors.body), box("前腿顶端高于负重小轮的轮仓顶板", [side * 0.64, 0.29, -1.65], [0.23, 0.08, 0.5], transportColors.body), ...wheel([side * 0.64, 0.12, -1.65], 0.12, 0.12), cylinder("穿过前腿轮仓两侧壁的负重轮轴", [side * 0.64, 0.12, -1.65], [0.04, 0.24, 0.04], transportColors.dark, [0, 0, 90]), box("前腿根部与高位后底盘连接的竖向承座", [side * 0.64, 0.36, 0.15], [0.15, 0.2, 0.3], transportColors.body), box("前移门架滑台下方的实际纵向导轨", [side * 0.64, 0.36, -0.625], [0.11, 0.08, 1.45], transportColors.trim), mastChannel("外门架保留开口的完整槽钢", side, false), mastChannel("套在外槽钢内部且为导轮留空的内槽钢", side, true), part("叉根与薄前趾一体成形的完整承载货叉", "extrude", transportColors.dark, [side * 0.32, 0.45, -1.18], [1, 1, 1], [0, 90, 0], { depth: 0.11, profile: [{ x: 0, y: 0 }, { x: 1.2, y: 0 }, { x: 1.2, y: 0.035 }, { x: 0.1, y: 0.08 }, { x: 0.1, y: 0.65 }, { x: 0, y: 0.65 }] }), cylinder("起升滑轮下方的外液压缸", [side * 0.2, 1.4, -0.82], [0.1, 1.7, 0.1], transportColors.dark), cylinder("接住起升滑轮的同轴活塞杆", [side * 0.2, 2.925, -0.82], [0.044, 1.45, 0.044], transportColors.trim), cylinder("内门架上方供起升链回绕的滑轮", [side * 0.2, 3.67, -0.82], [0.16, 0.08, 0.16], transportColors.body, [0, 0, 90]), part("绕顶滑轮连接固定床与货叉架的起升链", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.01, path: [{ x: side * 0.2, y: 0.55, z: -0.74 }, { x: side * 0.2, y: 3.67, z: -0.74 }, { x: side * 0.2, y: 3.75, z: -0.82 }, { x: side * 0.2, y: 3.67, z: -0.9 }, { x: side * 0.2, y: 0.98, z: -0.9 }] }));
      for (const innerSide of [-1, 1]) parts.push(box("轮仓内真实包住小负重轮的侧壁", [side * 0.64 + innerSide * 0.09, 0.2, -1.65], [0.035, 0.26, 0.42], transportColors.dark));
      for (const z of [0.13, 1.27]) parts.push(strut("司机后车体到防落物顶盖的支柱", [side * 0.56, 1.12, z], [side * 0.56, 2.35, z], 0.04, transportColors.body));
      for (const y of [0.78, 1.02]) parts.push(cylinder("内门架空腔内的微型实际导向滚轮", [side * 0.405, y, -0.95], [0.04, 0.04, 0.04], transportColors.dark, [0, 0, 90]), strut("从内槽钢开口伸出的叉架导轮轴", [side * 0.405, y, -0.95], [side * 0.3, y, -0.95], 0.025, transportColors.trim), strut("避开门架翼缘并接到叉架的内侧连接臂", [side * 0.3, y, -0.95], [side * 0.3, y, -1.13], 0.045, transportColors.dark));
    }
    for (const side of [-1, 1]) parts.push(box("独立驱动轮外侧的真实转向轮叉侧板", [-0.25 + side * 0.15, 0.3, 1.05], [0.045, 0.3, 0.24], transportColors.dark));
    for (const side of [-1, 1]) parts.push(box("小支承轮两侧保留转动空隙的轮叉侧板", [0.42 + side * 0.095, 0.27, 0.85], [0.025, 0.2, 0.16], transportColors.dark));
    parts.push(box("驱动轮叉留出轮胎上方间隙的上横座", [-0.25, 0.45, 1.05], [0.35, 0.08, 0.28], transportColors.dark), box("小支承轮转轴和双侧轮叉相接的横座", [0.42, 0.36, 0.85], [0.23, 0.06, 0.19], transportColors.dark));
    return parts;
  } },
];
