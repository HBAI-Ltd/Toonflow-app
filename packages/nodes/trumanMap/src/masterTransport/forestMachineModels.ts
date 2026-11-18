import { part, type ModelPart } from "../assetModelParts";
import { axles, box, cab, crawler, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 参照独立机种的作业构造原创简化，不复刻品牌外观或下载模型。
// https://www.tigercat.com/products/feller-bunchers/
// https://www.tigercat.com/products/forwarders/
// https://www.srs.fs.usda.gov/pubs/gtr/uncaptured/gtr_so073.pdf
export const forestMachineModels: TransportDefinition[] = [
  { name: "盘锯集束式履带采伐机", theme: "现代", tags: ["伐木集束机", "盘锯伐木头", "林业机械"], create: () => {
    const parts: ModelPart[] = [...crawler(4.3, 2.7), cylinder("上车回转支承", [0, 1.1, 0], [1.6, 0.35, 1.6]), box("后部平衡动力舱", [0, 1.75, 0.95], [2.3, 1.2, 1.6], transportColors.signal), ...cab([-0.65, 1.45, -0.7], [1.2, 1.7, 1.65]), strut("铰接起升主臂", [0.55, 1.6, -0.7], [0.55, 3.8, -2.05], 0.3, transportColors.signal), strut("前伸伐木斗杆", [0.55, 3.8, -2.05], [0.15, 2.9, -4], 0.24, transportColors.signal), strut("主臂举升液压缸", [0.55, 1.5, -1.1], [0.55, 3.4, -1.83], 0.13), strut("斗杆收放液压缸", [0.55, 3.55, -1.9], [0.27, 3.3, -3.42], 0.11), box("立式夹持头背梁", [0.15, 1.72, -3.98], [0.42, 2.08, 0.35], transportColors.signal), cylinder("根部水平旋转锯盘", [0.15, 0.65, -4.35], [1.22, 0.07, 1.22], transportColors.trim), cylinder("锯盘传动马达", [0.15, 0.82, -4.12], [0.3, 0.32, 0.3]), box("锯盘后半部防护罩", [0.15, 0.72, -4.02], [1.35, 0.22, 0.55], transportColors.signal)];
    for (const y of [1.2, 2.15]) for (const side of [-1, 1]) parts.push(strut("向外张开的集束夹臂", [0.15 + side * 0.18, y, -4], [0.15 + side * 0.63, y, -4.45], 0.13, transportColors.signal), strut("向内收拢的夹臂尖", [0.15 + side * 0.63, y, -4.45], [0.15 + side * 0.32, y, -4.82], 0.1, transportColors.signal));
    for (let index = 0; index < 12; index++) { const angle = index * Math.PI / 6; parts.push(box("外露锯盘切削齿", [0.15 + Math.cos(angle) * 0.61, 0.65, -4.35 + Math.sin(angle) * 0.61], [0.08, 0.085, 0.075], transportColors.dark, [0, -index * 30, 0])); }
    return parts;
  } },
  { name: "铰接八轮背负集材转运车", theme: "现代", tags: ["原木转运车", "背负集材机", "forwarder"], create: () => {
    const parts: ModelPart[] = [box("前部发动机与驾驶承载架", [0, 1.12, -2.25], [2.05, 0.35, 3.2]), box("独立后部载木纵向底架", [0, 1.12, 1.95], [0.85, 0.4, 4.3]), box("后架前伸铰接连接舌", [0, 1.12, -0.4], [0.55, 0.3, 0.6]), cylinder("前后车架竖向铰接销", [0, 1.1, -0.55], [0.3, 0.58, 0.3]), ...axles(2.45, [-3.2, -1.85, 0.8, 2.95], 0.68), ...cab([0, 1.32, -2.2], [1.75, 1.85, 1.85]), box("低置前机罩", [0, 1.5, -3.6], [1.6, 0.7, 1.05], transportColors.signal), cylinder("随车装木吊臂回转座", [0, 1.75, -0.7], [0.7, 0.8, 0.7]), strut("高起吊臂第一节", [0, 2.15, -0.7], [0, 4.45, 0.1], 0.24, transportColors.signal), strut("回折第二节装木臂", [0, 4.45, 0.1], [0, 3.75, 1.6], 0.2, transportColors.signal), strut("起升液压缸", [0, 1.95, -0.35], [0, 3.8, -0.12], 0.11), cylinder("抓木器悬吊回转头", [0, 3.48, 1.6], [0.22, 0.5, 0.22])];
    for (const y of [1.3, 2.05, 2.9]) parts.push(box("前部透空隔护屏横梁", [0, y, -0.15], [2.15, 0.05, 0.06], transportColors.dark));
    for (let index = 0; index < 7; index++) parts.push(box("隔护屏独立细立栅", [-1.02 + index * 0.34, 2.1, -0.15], [0.028, 1.6, 0.055], transportColors.dark));
    for (const z of [0.35, 1.95, 3.55]) {
      parts.push(box("原木承重横向鞍梁", [0, 1.42, z], [2.25, 0.22, 0.3], transportColors.signal));
      for (const side of [-1, 1]) parts.push(strut("两侧外倾挡木桩", [side * 0.97, 1.48, z], [side * 1.17, 3.05, z], 0.12, transportColors.signal));
    }
    for (const side of [-1, 1]) parts.push(strut("抓木器弯爪上段", [0, 3.25, 1.6], [side * 0.45, 2.95, 1.6], 0.08), strut("抓木器内收下段", [side * 0.45, 2.95, 1.6], [side * 0.15, 2.73, 1.6], 0.07));
    return parts;
  } },
  { name: "桅杆索道式移动集材机", theme: "现代", tags: ["索道集材机", "移动绞盘桅杆", "cable yarder"], create: () => {
    const parts: ModelPart[] = [...crawler(4.8, 2.8), box("低位卷扬承载平台", [0, 1.05, 0], [2.9, 0.28, 4.4]), ...cab([-0.7, 1.2, 1.05], [1.25, 1.6, 1.7]), box("卷扬动力机舱", [0.8, 1.8, 1.25], [1, 1.2, 1.7], transportColors.signal)];
    for (const z of [-0.2, 0.6]) parts.push(cylinder("独立索道收放绞盘卷筒", [0.5, 1.65, z], [0.7, 1.3, 0.7], transportColors.dark, [0, 0, 90]), ...[-1, 1].map(side => cylinder("卷筒侧挡盘", [0.5 + side * 0.65, 1.65, z], [0.9, 0.06, 0.9], transportColors.signal, [0, 0, 90])));
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(strut("方形桅杆四角主弦", [side * 0.47, 1.2, -1.3 + end * 0.47], [side * 0.28, 9.8, -1.3 + end * 0.28], 0.1, transportColors.signal));
    for (let level = 0; level < 4; level++) {
      const y = 1.25 + level * 2.1, width = 0.47 - level * 0.047;
      for (const side of [-1, 1]) parts.push(strut("桅杆正面斜向腹杆", [-width, y, -1.3 + side * width], [width - 0.047, y + 2.1, -1.3 + side * (width - 0.047)], 0.045), strut("桅杆侧面斜向腹杆", [side * width, y, -1.3 - width], [side * (width - 0.047), y + 2.1, -1.3 + width - 0.047], 0.045));
    }
    parts.push(cylinder("顶端承索转向滑轮", [0, 9.72, -1.3], [0.62, 0.2, 0.62], transportColors.dark, [0, 0, 90]), strut("连接绞盘与塔顶的工作绳", [0.5, 1.95, -0.2], [0.08, 9.68, -1.3], 0.024), strut("降至地面的待挂集材工作绳", [0.08, 9.68, -1.3], [0.08, 0.15, -3.2], 0.024), part("工作绳末端集材挂环", "torus", transportColors.dark, [0.08, 0.12, -3.2], [0.3, 0.3, 0.08], [90, 0, 0]));
    for (let index = 0; index < 3; index++) {
      const angle = index * Math.PI * 2 / 3, x = Math.cos(angle) * 4.2, z = -1.3 + Math.sin(angle) * 4.2;
      parts.push(strut("桅杆三向稳固拉索", [0, 9.4, -1.3], [x, 0.15, z], 0.022), box("地锚固定横枕", [x, 0.12, z], [0.75, 0.24, 0.35], transportColors.dark, [0, -angle * 180 / Math.PI, 0]));
    }
    return parts;
  } },
];
