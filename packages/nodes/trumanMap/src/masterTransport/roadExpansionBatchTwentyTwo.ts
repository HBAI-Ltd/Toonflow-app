import { part, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, wheel, transportColors, type TransportDefinition } from "./parts";

function liftChannel(side: number, inner: boolean): ModelPart {
  const points = inner ? [[0, -0.05], [0.1, -0.05], [0.1, 0.05], [0, 0.05], [0, 0.025], [0.07, 0.025], [0.07, -0.025], [0, -0.025]] : [[0, -0.11], [0.16, -0.11], [0.16, 0.11], [0, 0.11], [0, 0.065], [0.11, 0.065], [0.11, -0.065], [0, -0.065]];
  return part(inner ? "伸出外槽钢并为人员平台导轮留空的内槽钢" : "与后车体连续相接的起升外槽钢", "extrude", inner ? transportColors.trim : transportColors.body, [side * 0.4, inner ? 2.9 : 1.9, 0], [1, 1, 1], [90, 0, 0], { depth: inner ? 3.0 : 2.8, profile: points.map(([x, z]) => ({ x: side * x!, y: z! })) });
}

// 人员站台、控制器和货叉一起升降的完整机种，不作为普通叉车加座椅/挂篮变体。
// https://www.crown.com/en-us/forklifts/man-up-order-pickers/sp-1500-stockpicker.html
export const roadExpansionBatchTwentyTwo: TransportDefinition[] = [
  { name: "人员站台货叉同步起升式高位拣选车", theme: "现代", tags: ["高位人上型拣选车", "带操纵台的升降人员平台", "同步升降固定货叉"], create: () => {
    const parts: ModelPart[] = [
      box("后动力车体与起升门架共用的固定底架", [0, 0.54, 0.7], [1.3, 0.12, 1.5], transportColors.dark),
      box("与前方人员平台独立的后置蓄电池动力舱", [0, 0.99, 0.85], [1.23, 0.78, 1.25], transportColors.body),
      ...wheel([0, 0.22, 1.05], 0.22, 0.24),
      box("后驱动轮上方保留转动净空的轮叉上座", [0, 0.49, 1.05], [0.42, 0.08, 0.32], transportColors.dark),
      box("固定外门架底部与车架连接的横梁", [0, 0.56, 0], [1.17, 0.15, 0.25], transportColors.body),
      box("固定外门架顶部的承力横梁", [0, 3.3, 0], [1.17, 0.12, 0.22], transportColors.body),
      box("人员平台内门架顶部的连接横梁", [0, 4.4, 0], [1.08, 0.12, 0.13], transportColors.trim),
      box("随起升门架一起上升的防滑人员站台", [0, 1.95, -0.7], [1.15, 0.1, 1.0], transportColors.body),
      box("人员站台与起升链下端相接的实际承托桥", [0, 2.2, -0.1], [0.7, 0.12, 0.22], transportColors.dark),
      box("随人员平台升降的后侧操纵台", [0, 2.8, -0.18], [1.1, 0.38, 0.15], transportColors.signal),
      box("站台上方保留人员净高的防落物顶盖", [0, 4.2, -0.7], [1.23, 0.08, 1.05], transportColors.dark),
      strut("人员站台前方的防跌落可开合门杆", [-0.53, 2.95, -1.17], [0.53, 2.95, -1.17], 0.045, transportColors.body),
    ];
    for (const side of [-1, 1]) {
      parts.push(box("后驱动轮两侧承接载荷的独立轮叉", [side * 0.18, 0.32, 1.05], [0.04, 0.34, 0.28], transportColors.dark), box("保持前方托盘净空的独立承载跨腿", [side * 0.65, 0.26, -0.65], [0.16, 0.16, 1.8], transportColors.body), box("跨腿末端高于负重轮的轮仓顶板", [side * 0.65, 0.29, -1.8], [0.23, 0.08, 0.5], transportColors.body), ...wheel([side * 0.65, 0.12, -1.8], 0.12, 0.12), cylinder("跨腿小负重轮的真实横向轮轴", [side * 0.65, 0.12, -1.8], [0.04, 0.24, 0.04], transportColors.dark, [0, 0, 90]), box("把前跨腿实际接到后车体的高位承座", [side * 0.65, 0.43, 0.25], [0.16, 0.3, 0.3], transportColors.body), liftChannel(side, false), liftChannel(side, true), box("人员站台起升导轮托臂共用的垂直叉架", [side * 0.3, 2.1, -0.17], [0.1, 0.55, 0.1], transportColors.dark), strut("人员站台前缘向起升叉架传力的下斜梁", [side * 0.3, 2.1, -0.17], [side * 0.3, 1.9, -1.0], 0.1, transportColors.dark), part("与人员站台前缘固定且一起升降的完整货叉", "extrude", transportColors.dark, [side * 0.35, 1.85, -1.16], [1, 1, 1], [0, 90, 0], { depth: 0.12, profile: [{ x: 0, y: 0 }, { x: 1.2, y: 0 }, { x: 1.2, y: 0.035 }, { x: 0.12, y: 0.08 }, { x: 0.12, y: 0.45 }, { x: 0, y: 0.45 }] }), cylinder("带动人员平台主起升机构的外液压缸", [side * 0.28, 1.6, 0.08], [0.12, 2.0, 0.12], transportColors.dark), cylinder("主起升缸上方实际相接的同轴长活塞杆", [side * 0.28, 3.43, 0.08], [0.05, 1.76, 0.05], transportColors.trim), cylinder("人员平台内门架顶部的起升链滑轮", [side * 0.28, 4.32, 0.08], [0.16, 0.09, 0.16], transportColors.body, [0, 0, 90]), part("连接固定车架与人员起升叉架的连续起升链", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.012, path: [{ x: side * 0.28, y: 0.6, z: 0.16 }, { x: side * 0.28, y: 4.32, z: 0.16 }, { x: side * 0.28, y: 4.4, z: 0.08 }, { x: side * 0.28, y: 4.32, z: 0 }, { x: side * 0.28, y: 2.2, z: 0 }] }));
      for (const innerSide of [-1, 1]) parts.push(box("轮仓两侧保留轴承与轮胎净空的叉板", [side * 0.65 + innerSide * 0.09, 0.2, -1.8], [0.035, 0.26, 0.42], transportColors.dark));
      for (const z of [-1.16, -0.24]) parts.push(strut("随人员站台一起移动的防落物顶盖支柱", [side * 0.53, 2.0, z], [side * 0.53, 4.2, z], 0.045, transportColors.body));
      for (const y of [2.45, 3.0]) parts.push(strut("人员站台两侧接到前后门柱的连续护栏", [side * 0.55, y, -1.16], [side * 0.55, y, -0.24], 0.035, transportColors.body));
      for (const y of [1.9, 2.3]) parts.push(cylinder("在内槽钢空腔中承托人员站台的导向滚轮", [side * 0.43, y, 0], [0.04, 0.04, 0.04], transportColors.dark, [0, 0, 90]), strut("从内槽钢开口伸出的实际导轮轴", [side * 0.43, y, 0], [side * 0.3, y, 0], 0.025, transportColors.trim), strut("绕开槽钢翼缘连接到人员叉架的短托臂", [side * 0.3, y, 0], [side * 0.3, y, -0.17], 0.045, transportColors.dark));
    }
    return parts;
  } },
];
