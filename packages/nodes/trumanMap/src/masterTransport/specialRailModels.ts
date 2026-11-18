import { part, type ModelPart } from "../assetModelParts";
import { railFrame } from "./railModels";
import { box, cab, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

export const specialRailModels: TransportDefinition[] = [
  { name: "齿轨攀坡机车", tags: ["齿轮啮合推进", "山地铁路"], create: () => {
    const parts = [...railFrame(4.8, 2), box("矮位齿轨传动箱", [0, 0.75, 0], [0.5, 0.5, 1.3], transportColors.dark), ...cab([0, 1, 0.9], [1.85, 1.7, 1.8]), box("短发动机罩", [0, 1.45, -1.2], [1.6, 0.9, 1.9], transportColors.signal), cylinder("前端散热风扇罩", [0, 1.45, -2.17], [0.65, 0.08, 0.65], transportColors.dark, [90, 0, 0]), cylinder("外露中央驱动齿轮", [0, 0.53, -0.15], [0.55, 0.24, 0.55], transportColors.trim, [0, 0, 90])];
    for (let index = 0; index < 12; index++) { const angle = index * Math.PI / 6; parts.push(box("齿轨啮合轮齿", [0, 0.53 + Math.cos(angle) * 0.31, -0.15 + Math.sin(angle) * 0.31], [0.24, 0.13, 0.09], transportColors.trim, [index * 30, 0, 0])); }
    parts.push(strut("驱动箱侧输出轴", [0, 0.65, -0.15], [0.7, 0.65, -0.15], 0.11), cylinder("齿轮传动侧盖", [0.68, 0.7, -0.15], [0.6, 0.15, 0.6], transportColors.dark, [0, 0, 90])); return parts;
  } },
  { name: "翼铲式铁路配砟整形车", tags: ["养路机械", "侧翼整砟"], create: () => [...railFrame(7), ...cab([0, 1, -0.8], [2.15, 1.8, 2.2]), box("尾部动力舱", [0, 1.65, 1.9], [2.1, 1.3, 1.8], transportColors.signal), ...[-1, 1].flatMap(side => [strut("侧翼铲外展连杆", [side * 0.8, 1.05, 0.1], [side * 2, 0.65, 0.65], 0.14), box("可展开斜置整砟侧翼", [side * 1.85, 0.58, 0.6], [0.14, 0.8, 2.3], transportColors.trim, [0, side * 35, side * 12]), strut("侧翼液压缸", [side * 0.9, 1.4, 0.8], [side * 1.85, 0.9, 0.2], 0.095), box("人字形前配砟铲", [side * 0.55, 0.6, -3.2], [1.45, 0.75, 0.16], transportColors.dark, [0, side * -28, 0])]), cylinder("尾部清扫滚刷", [0, 0.52, 3.45], [0.85, 2.6, 0.85], transportColors.dark, [0, 0, 90]), box("扫刷防护罩", [0, 1.02, 3.45], [2.7, 0.18, 0.95], transportColors.body)] },
  { name: "楔形铁路推雪车", tags: ["铁路除雪", "双向分雪楔"], create: () => [...railFrame(5.8), box("配重工作舱", [0, 1.8, 1], [2.35, 2, 2.8], transportColors.body), box("瞭望驾驶窗", [0, 2.2, -0.43], [1.7, 0.6, 0.05], transportColors.glass), ...[-1, 1].map(side => surface("贯通分雪斜面", transportColors.signal, [[0, 0.2, -4.1], [side * 1.85, 0.2, -1.8], [side * 1.85, 2.35, -1.8], [0, 1.45, -4.1]], [0, 1, 2, 0, 2, 3])), strut("雪犁中央刃梁", [0, 0.15, -4.1], [0, 1.45, -4.1], 0.13), ...[-1, 1].map(side => strut("推雪铲背撑", [side * 0.85, 0.85, -0.3], [side * 1.2, 1.25, -2.35], 0.2)), box("舱顶压檐", [0, 2.9, 1], [2.5, 0.2, 3], transportColors.dark)] },
  { name: "开放渣罐倾翻轨道车", tags: ["冶金物流", "可倾翻耐火罐"], create: () => [...railFrame(6.6), ...[-1, 1].map(side => box("高位承载叉架", [side * 1.12, 1.5, 0], [0.23, 1.5, 2], transportColors.dark)), part("敞口锥壁渣罐", "lathe", "#a18c76", [0, 1, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.75, y: 0 }, { x: 1.05, y: 1.9 }, { x: 0.89, y: 1.9 }, { x: 0.62, y: 0.2 }, { x: 0, y: 0.2 }] }), ...[-1, 1].flatMap(side => [cylinder("侧向倾翻耳轴", [side * 1.05, 2.03, 0], [0.25, 0.55, 0.25], transportColors.trim, [0, 0, 90]), cylinder("耳轴承托座", [side * 1.15, 1.95, 0], [0.48, 0.24, 0.48], transportColors.dark, [0, 0, 90])]), cylinder("罐侧倾翻驱动齿圈", [-1.37, 2.03, 0], [0.85, 0.1, 0.85], transportColors.dark, [0, 0, 90]), box("罐体侧齿减速箱", [-1.36, 1.5, 0.25], [0.4, 0.4, 0.5], transportColors.signal)] },
  { name: "钳夹悬挂式大件铁路货车", tags: ["钳夹车", "载荷参与承力"], create: () => {
    const parts: ModelPart[] = [box("悬挂的大件运输变压器", [0, 1.6, 0], [2.5, 2.1, 3.4], transportColors.body)];
    for (const end of [-1, 1]) {
      const frame = railFrame(4.5); for (const item of frame) item.position.z += end * 4.8; parts.push(...frame);
      for (const side of [-1, 1]) { parts.push(strut("钳夹车上承力曲梁", [side * 0.75, 1.25, end * 4.5], [side * 0.75, 3.2, end * 2.3], 0.35, transportColors.signal), strut("钳夹车下承力梁", [side * 0.75, 1.1, end * 4.5], [side * 0.75, 0.7, end * 1.7], 0.3), strut("夹持载荷端立臂", [side * 0.75, 0.7, end * 1.7], [side * 0.75, 3.2, end * 2.3], 0.28, transportColors.signal), cylinder("悬挂端部铰接销", [side * 0.75, 1.4, end * 1.7], [0.3, 0.55, 0.3], transportColors.trim, [0, 0, 90])); }
      parts.push(box("钳臂端横联梁", [0, 3.2, end * 2.3], [1.85, 0.3, 0.3], transportColors.signal));
    }
    for (const x of [-1.28, 1.28]) for (const z of [-0.9, -0.3, 0.3, 0.9]) parts.push(box("运输变压器散热片", [x, 1.7, z], [0.12, 1.5, 0.16], transportColors.dark)); return parts;
  } },
  { name: "连续更换轨枕作业列车", tags: ["轨枕更新", "悬跨作业区"], create: () => {
    const parts = [...railFrame(12).slice(1), ...[-1, 1].map(end => box("端部走行平台", [0, 0.8, end * 4.6], [2.5, 0.25, 2.8], transportColors.dark)), ...cab([0, 1, -4.9], [2.15, 1.6, 1.7]), box("后动力控制舱", [0, 1.5, 4.2], [2.25, 1.1, 2.8], transportColors.body), ...[-1, 1].map(side => box("跨空作业纵梁", [side * 1.08, 2.1, 0], [0.24, 0.35, 7.5], transportColors.signal)), box("旧枕提升斜输送链", [0, 1.55, -1.4], [1.6, 0.2, 3.8], transportColors.dark, [-28, 0, 0]), box("新枕投放斜输送链", [0, 1.55, 1.5], [1.6, 0.2, 3.8], transportColors.dark, [28, 0, 0])];
    for (const side of [-1, 1]) parts.push(strut("拨开钢轨导向臂", [side * 0.8, 1.4, -2], [side * 1.45, 0.4, 0], 0.14), cylinder("侧向导轨滚轮", [side * 1.45, 0.4, 0], [0.3, 0.2, 0.3], transportColors.trim));
    for (let index = 0; index < 5; index++) parts.push(box("输送中的待装轨枕", [0, 1.3 + index * 0.27, 0.9 + index * 0.5], [2.6, 0.16, 0.24], transportColors.trim, [28, 0, 0]));
    parts.push(box("低位轨枕夹持横架", [0, 0.45, 0.3], [2.2, 0.2, 0.3], transportColors.dark), ...[-1, 1].map(side => box("轨枕夹持钳", [side * 0.9, 0.35, 0.3], [0.16, 0.4, 0.3], transportColors.signal))); return parts;
  } },
];
