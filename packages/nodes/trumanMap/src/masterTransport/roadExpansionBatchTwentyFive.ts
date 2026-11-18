import { beam, part, ring, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

function chuteHeight(z: number) { return 0.15 + (z + 3.5) * 2.25 / 6.9; }

// 固定雪撬型装岩机使用主、尾绳和地面尾轮往复牵引耙斗，不按底架行走方式再扩主。
// https://zkjiaoche.com/pro12
// https://www.chinamine-safety.gov.cn/zfxxgk/fdzdgknr/zcfg/hybz_01/mkanj/201911/P020210202623856893818.pdf
export const roadExpansionBatchTwentyFive: TransportDefinition[] = [
  { name: "雪撬固定双绞车往复耙斗装岩机", theme: "现代", itemType: "设施", tags: ["双滚筒耙斗装岩机", "主尾绳与固定尾轮", "进料中槽卸料槽贯通"], create: () => {
    const parts: ModelPart[] = [
      box("雪撬底架上实际安装双滚筒绞车的承载台", [0, 0.3, 0.2], [1.8, 0.2, 2.0], transportColors.body),
      box("与主承载台连接的侧向电机承台", [1.2, 0.3, 0.2], [1.4, 0.2, 0.9], transportColors.body),
      cylinder("双滚筒绞车共用的贯通驱动轴", [0, 0.84, 0.2], [0.12, 3.2, 0.12], transportColors.trim, [0, 0, 90]),
      cylinder("主轴侧面独立的封闭电动驱动机", [1.45, 0.84, 0.2], [0.56, 0.7, 0.56], transportColors.dark, [0, 0, 90]),
      cylinder("位于轴承外侧连接电动机的主轴联轴器", [1.07, 0.84, 0.2], [0.26, 0.16, 0.26], transportColors.signal, [0, 0, 90]),
      box("电动机下方到侧承台的真实支座", [1.45, 0.49, 0.2], [0.6, 0.18, 0.55], transportColors.dark),
      box("进料斜槽低口直接接触岩面的耐磨前刃", [0, 0.06, -3.6], [1.8, 0.12, 0.24], transportColors.trim),
      box("上导向轮下方保留耙斗通过净高的横向承梁", [0, 1.9, -0.85], [1.8, 0.16, 0.15], transportColors.body),
      surface("耙斗远离牵引方向的倾斜耐磨后板", transportColors.dark, [[-0.65, 0, -7.15], [0.65, 0, -7.15], [0.65, 0.6, -7.25], [-0.65, 0.6, -7.25]], [0, 1, 2, 0, 2, 3]),
      box("耙斗前方连接左右拉板的齿座横梁", [0, 0.11, -6.4], [1.4, 0.14, 0.12], transportColors.body),
      box("尾轮固定楔实际接地的宽锚座", [0.65, 0.15, -10.5], [0.8, 0.3, 0.75], transportColors.dark),
      box("尾轮双侧轴叉下方的共用承座", [0.65, 0.35, -10.5], [0.4, 0.1, 0.35], transportColors.body),
      cylinder("固定尾轮中央的回绳导向滑轮", [0.65, 0.55, -10.5], [0.36, 0.1, 0.36], transportColors.trim, [0, 0, 90]),
      cylinder("固定尾轮与双侧叉板相接的实际轮轴", [0.65, 0.55, -10.5], [0.04, 0.4, 0.04], transportColors.dark, [0, 0, 90]),
      part("从主滚筒经斜槽实际绳孔绕导轮到耙斗的主牵引绳", "tube", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.013, path: [{ x: -0.45, y: 1.16, z: 0.2 }, { x: -0.45, y: 2.12, z: -0.74 }, { x: -0.45, y: 2.23, z: -0.85 }, { x: -0.45, y: 2.12, z: -0.96 }, { x: 0, y: 0.65, z: -6.1 }] }),
      part("从尾滚筒经远端固定尾轮折返耙斗的连续尾绳", "tube", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.013, path: [{ x: 0.45, y: 1.16, z: 0.2 }, { x: 0.45, y: 2.12, z: -0.74 }, { x: 0.45, y: 2.23, z: -0.85 }, { x: 0.45, y: 2.12, z: -0.96 }, { x: 0.65, y: 0.73, z: -10.5 }, { x: 0.65, y: 0.55, z: -10.68 }, { x: 0.65, y: 0.37, z: -10.5 }, { x: 0, y: 0.4, z: -7.4 }] }),
    ];
    for (const [x, width] of [[-0.64, 0.32], [0, 0.84], [0.64, 0.32]]) parts.push(beam("保留主尾绳真实穿孔的连续进料中间与卸料槽底", transportColors.dark, [x!, chuteHeight(-3.5), -3.5], [x!, chuteHeight(3.4), 3.4], width!, 0.1));
    for (const side of [-1, 1]) {
      parts.push(box("完整雪撬底架的纵向接地滑梁", [side * 0.75, 0.1, 0.2], [0.14, 0.2, 3.2], transportColors.dark), part("带双侧挡盘的实际主尾绳收放滚筒", "lathe", transportColors.body, [side * 0.45, 0.84, 0.2], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0, y: -0.35 }, { x: 0.42, y: -0.35 }, { x: 0.42, y: -0.28 }, { x: 0.3, y: -0.28 }, { x: 0.3, y: 0.28 }, { x: 0.42, y: 0.28 }, { x: 0.42, y: 0.35 }, { x: 0, y: 0.35 }] }), cylinder("主尾绳滚筒内实际储放的密排钢丝绳层", [side * 0.45, 0.84, 0.2], [0.64, 0.54, 0.64], transportColors.dark, [0, 0, 90]), ring("绞车主轴两端保留真实穿轴孔的独立轴承", transportColors.dark, 0.15, 0.065, 0, 0.14, { position: { x: side * 0.9, y: 0.84, z: 0.2 }, rotation: { x: 0, y: 0, z: 90 } }), box("轴承下方不占用主轴空间的承载底座", [side * 0.9, 0.545, 0.2], [0.16, 0.29, 0.35], transportColors.body), beam("两侧从低进料口贯通至高位卸料口的挡料壁", transportColors.body, [side * 0.84, chuteHeight(-3.5) + 0.275, -3.5], [side * 0.84, chuteHeight(3.4) + 0.275, 3.4], 0.08, 0.55), strut("斜槽两侧承托上导向滑轮横梁的净空立柱", [side * 0.84, chuteHeight(-0.85), -0.85], [side * 0.84, 1.9, -0.85], 0.08, transportColors.body), cylinder("主尾绳从下绞车转向工作面的上导向滑轮", [side * 0.45, 2.12, -0.85], [0.22, 0.1, 0.22], transportColors.trim, [0, 0, 90]), cylinder("上导向滑轮与双侧叉片相接的横向轮轴", [side * 0.45, 2.12, -0.85], [0.035, 0.26, 0.035], transportColors.dark, [0, 0, 90]), part("耙斗左右独立且底部着地的完整拉板", "extrude", transportColors.body, [side * 0.65, 0, -6.8], [1, 1, 1], [0, 90, 0], { depth: 0.1, profile: [{ x: -0.4, y: 0 }, { x: 0.35, y: 0 }, { x: 0.45, y: 0.65 }, { x: 0.2, y: 0.62 }, { x: -0.4, y: 0.2 }] }), strut("耙斗前拉板到主绳牵引点的真实三角拉杆", [side * 0.6, 0.2, -6.4], [0, 0.65, -6.1], 0.07, transportColors.dark), strut("耙斗后帮与返回尾绳接点相连的支臂", [side * 0.5, 0.45, -7.2], [0, 0.4, -7.4], 0.06, transportColors.dark), box("固定尾轮轴两侧保留旋转净空的立叉板", [0.65 + side * 0.14, 0.49, -10.5], [0.035, 0.27, 0.3], transportColors.body));
      for (const innerSide of [-1, 1]) parts.push(box("上导向滑轮两侧不碰轮缘的独立叉片", [side * 0.45 + innerSide * 0.07, 2.06, -0.85], [0.03, 0.26, 0.2], transportColors.dark));
      for (const z of [-0.6, 0.9]) parts.push(strut("底部绞车承台向上撑住中间斜槽的侧柱", [side * 0.78, 0.4, z], [side * 0.78, chuteHeight(z) - 0.04, z], 0.12, transportColors.body));
      parts.push(box("高位卸料槽尾部的独立落地稳定脚板", [side * 0.84, 0.1, 2.8], [0.6, 0.2, 0.6], transportColors.dark), strut("尾稳定脚板与高位卸料槽相接的承重立腿", [side * 0.84, 0.2, 2.8], [side * 0.84, chuteHeight(2.8) - 0.04, 2.8], 0.12, transportColors.body));
    }
    for (const x of [-0.5, -0.25, 0, 0.25, 0.5]) parts.push(part("前缘向牵引方向伸出的耐磨独立耙齿", "extrude", transportColors.trim, [x, 0.02, -6.4], [1, 1, 1], [0, -90, 0], { depth: 0.14, profile: [{ x: -0.08, y: 0 }, { x: 0.25, y: 0 }, { x: 0.25, y: 0.08 }, { x: -0.08, y: 0.15 }] }));
    return parts;
  } },
];
