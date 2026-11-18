import { part, type ModelPart } from "../assetModelParts";
import { axles, box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";
import { threePointLink } from "./tillageModels";

export const fieldCareModels: TransportDefinition[] = [
  { name: "中心回转喷灌机", theme: "现代", tags: ["农业", "灌溉", "中心支轴", "轮塔环移", "悬挂喷头", "水管桁架"], create: () => {
    const parts: ModelPart[] = [cylinder("中心供水立管", [0, 1.5, 0], [0.25, 3, 0.25]), cylinder("支轴上方回转接头", [0, 3, 0], [0.45, 0.3, 0.45], transportColors.dark), cylinder("横向连续供水主管", [12, 3, 0], [0.16, 24, 0.16], transportColors.body, [0, 0, 90])];
    for (const x of [-0.65, 0.65]) for (const z of [-0.65, 0.65]) parts.push(strut("中心支轴落地撑架", [x, 0.05, z], [0, 2.7, 0], 0.09), box("撑架地面底垫", [x, 0.04, z], [0.25, 0.08, 0.25], transportColors.dark));
    for (const station of [12, 24]) {
      parts.push(box("轮塔下部切向连梁", [station, 0.55, 0], [0.18, 0.2, 2.8], transportColors.dark));
      for (const side of [-1, 1]) parts.push(...wheel([station, 0.45, side * 1.2], 0.45, 0.22), strut("轮塔斜向承力腿", [station, 0.6, side * 1.2], [station, 3, 0], 0.11));
      const start = station - 12;
      parts.push(strut("跨间抬高桁架前弦", [start, 3, 0], [start + 6, 3.7, 0], 0.07), strut("跨间抬高桁架后弦", [start + 6, 3.7, 0], [station, 3, 0], 0.07), strut("跨中承管短吊杆", [start + 6, 3.7, 0], [start + 6, 3, 0], 0.05));
    }
    for (let index = 0; index < 12; index++) parts.push(cylinder("垂悬喷头供水管", [1 + index * 2, 2.62, 0], [0.035, 0.76, 0.035], transportColors.dark), part("低位散水喷头盘", "cone", transportColors.signal, [1 + index * 2, 2.2, 0], [0.24, 0.09, 0.24], [180, 0, 0]));
    return parts;
  } },
  { name: "滚筒压卷圆草捆机", theme: "现代", tags: ["农业", "农机", "圆捆打捆机", "环列成形辊", "独立拾草器", "滚压成捆"], create: () => {
    const parts: ModelPart[] = [...axles(1.9, [0.55], 0.4), box("圆捆机下部底架", [0, 0.68, 0], [1.6, 0.2, 2.3], transportColors.dark), strut("前置牵引杆", [0, 0.6, -1], [0, 0.5, -2.4], 0.14), cylinder("前端横置拾草滚筒", [0, 0.37, -1.12], [0.4, 1.9, 0.4], transportColors.dark, [0, 0, 90]), box("拾草后倾斜喂入床", [0, 0.61, -0.7], [1.4, 0.1, 0.9], transportColors.trim, [-25, 0, 0]), cylinder("成形仓左侧闭合护板", [-0.75, 1.3, 0.3], [2.02, 0.08, 2.02], transportColors.body, [0, 0, 90]), part("右侧检视护板内外环", "lathe", transportColors.signal, [0.75, 1.3, 0.3], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0.66, y: -0.04 }, { x: 1.01, y: -0.04 }, { x: 1.01, y: 0.04 }, { x: 0.66, y: 0.04 }, { x: 0.66, y: -0.04 }] }), box("仓顶捆网卷承托架", [0, 2.34, 0.3], [1.5, 0.1, 0.55], transportColors.dark), cylinder("仓顶捆网材料卷", [0, 2.5, 0.3], [0.25, 1.4, 0.25], transportColors.trim, [0, 0, 90]), box("后置落捆承接斜板", [0, 0.5, 1.45], [1.5, 0.1, 1], transportColors.dark, [18, 0, 0])];
    for (let index = 0; index < 10; index++) {
      const angle = index * Math.PI * 2 / 10;
      parts.push(cylinder("围绕草捆的分立成形压辊", [0, 1.3 + Math.cos(angle) * 0.8, 0.3 + Math.sin(angle) * 0.8], [0.22, 1.4, 0.22], transportColors.dark, [0, 0, 90]));
    }
    for (let index = 0; index < 8; index++) parts.push(strut("拾草器外露弯齿", [-0.8 + index * 0.23, 0.45, -1.18], [-0.8 + index * 0.23, 0.2, -1.36], 0.018, transportColors.trim));
    return parts;
  } },
  { name: "立轴旋转牧草摊晒机", theme: "现代", tags: ["农业", "农机", "摊晒机", "立轴散草转子", "弯钩弹齿", "宽幅分散"], create: () => {
    const parts = [...threePointLink(1.2, -0.65), box("摊晒机横向动力长梁", [0, 0.85, 0], [4.8, 0.18, 0.2], transportColors.signal), strut("中央传动输入轴", [0, 0.85, -0.2], [0, 0.85, -1], 0.07)];
    for (const x of [-1.8, -0.6, 0.6, 1.8]) {
      parts.push(cylinder("各转子的立向齿轮箱", [x, 0.66, 0], [0.23, 0.4, 0.23], transportColors.body), cylinder("弹齿转子中央盘", [x, 0.5, 0], [0.32, 0.08, 0.32], transportColors.dark), ...wheel([x, 0.2, 0.4], 0.2, 0.1), strut("转子后侧限深轮叉", [x, 0.6, 0.2], [x, 0.2, 0.4], 0.045));
      for (let arm = 0; arm < 4; arm++) {
        const angle = arm * Math.PI / 2 + (x < 0 ? 0 : Math.PI / 4), cos = Math.cos(angle), sin = Math.sin(angle);
        parts.push(strut("旋转散草径向臂", [x, 0.5, 0], [x + cos * 0.48, 0.42, sin * 0.48], 0.03), strut("向下弯折弹齿上段", [x + cos * 0.48, 0.42, sin * 0.48], [x + cos * 0.58, 0.09, sin * 0.58], 0.017, transportColors.trim), strut("散草弹齿贴地尖段", [x + cos * 0.58, 0.09, sin * 0.58], [x + cos * 0.62, 0.05, sin * 0.62], 0.015, transportColors.trim));
      }
    }
    return parts;
  } },
];
