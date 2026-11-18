import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { rod } from "../masterObjects/parts";
import { steelWheelset } from "./railExpansionBatchOne";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

export function runningFrame(length: number, axlePositions: number[]): ModelPart[] {
  const parts: ModelPart[] = axlePositions.flatMap(z => steelWheelset(z));
  for (const side of [-1, 1]) parts.push(box("通长车底外侧承力边梁", [side * 1.15, .92, 0], [.18, .25, length], transportColors.dark));
  for (const end of [-1, 1]) parts.push(box("端部横向承力梁", [0, .92, end * (length / 2 - .25)], [2.48, .25, .2], transportColors.dark), box("车端独立联结钩柄", [0, .88, end * (length / 2 + .2)], [.22, .2, .55], transportColors.dark));
  for (const z of [axlePositions[0]!, axlePositions.at(-1)!]) parts.push(box("走行架连接车体的横向承台", [0, 1.04, z], [2.2, .2, .35], transportColors.dark));
  return parts;
}

export function archedRoof(width: number, length: number, y: number): ModelPart {
  return part("两侧出檐的薄壁弧形车顶", "extrude", transportColors.body, [0, y, 0], [1, 1, 1], [0, 0, 0], { depth: length, profile: [{ x: -width / 2, y: 0 }, { x: -width * .4, y: .24 }, { x: -width * .2, y: .42 }, { x: width * .2, y: .42 }, { x: width * .4, y: .24 }, { x: width / 2, y: 0 }, { x: width / 2 - .06, y: -.04 }, { x: width * .38, y: .17 }, { x: width * .19, y: .34 }, { x: -width * .19, y: .34 }, { x: -width * .38, y: .17 }, { x: -width / 2 + .06, y: -.04 }] });
}

// 铰接与传动构型参考保有铁路、铁路博物馆资料；不复制厂商图纸或现存车辆的涂装与编号。
// https://www.festrail.co.uk/locomotives/
// https://www.borail.org/collection/shay/
// https://www.lartiguemonorail.com/museum.html
export const railExpansionBatchThree: TransportDefinition[] = [
  { name: "侧向滑门弧顶铁路棚车", theme: "现代", tags: ["有顶棚货车", "真实侧装卸门洞", "防雨封闭货舱"], create: () => {
    const parts: ModelPart[] = [...runningFrame(12.4, [-4.8, -3.3, 3.3, 4.8]), box("棚车舱内连续载货地板", [0, 1.17, 0], [2.65, .2, 12.25], transportColors.wood), archedRoof(2.85, 12.6, 3.54)];
    for (const side of [-1, 1]) {
      for (const end of [-1, 1]) parts.push(box("装卸门洞两旁完整货舱侧壁", [side * 1.32, 2.34, end * 3.95], [.1, 2.15, 4.2], transportColors.body));
      parts.push(box("跨过中央装卸门洞的顶过梁", [side * 1.32, 3.43, 0], [.13, .22, 12.25], transportColors.dark), box("沿车体外侧滑开的独立货门", [side * 1.43, 2.35, 3.15], [.08, 2.1, 2.7], transportColors.body), box("独立货门的上方连续滑轨", [side * 1.45, 3.45, 1.5], [.12, .08, 6.1], transportColors.dark), box("独立货门下沿导向轨", [side * 1.45, 1.29, 1.5], [.12, .07, 6.1], transportColors.dark), strut("滑门外侧长形拉手", [side * 1.5, 1.91, 2.3], [side * 1.5, 2.65, 2.3], .035, transportColors.trim));
      for (const z of [-5.85, -4.5, -3.05, -1.8, 1.8, 4.65, 5.9]) parts.push(box("货舱立板外侧承重竖肋", [side * 1.39, 2.33, z], [.1, 2.3, .11], transportColors.dark));
      for (const z of [2.1, 3.15, 4.2]) parts.push(box("滑门自身加强肋", [side * 1.48, 2.35, z], [.055, 1.96, .07], transportColors.dark));
    }
    for (const end of [-1, 1]) parts.push(box("棚车车端封闭薄壁", [0, 2.39, end * 6.1], [2.65, 2.26, .11], transportColors.body), strut("端壁外部对角支撑", [-1.15, 1.38, end * 6.19], [1.15, 3.4, end * 6.19], .07, transportColors.dark));
    return parts;
  } },
  { name: "固定高侧板铁路敞车", theme: "现代", tags: ["敞口货舱", "无漏斗平底", "大宗铁路货运"], create: () => {
    const parts: ModelPart[] = [...runningFrame(12.2, [-4.7, -3.2, 3.2, 4.7]), box("敞车平整且无底卸孔的载货地板", [0, 1.17, 0], [2.68, .2, 12.05], transportColors.dark)];
    for (const side of [-1, 1]) {
      parts.push(box("敞车长向薄壁高侧板", [side * 1.3, 2.1, 0], [.1, 1.8, 12], transportColors.body), box("侧板顶部连续加强压梁", [side * 1.3, 3.04, 0], [.17, .12, 12.05], transportColors.dark), box("侧板下方承重腰梁", [side * 1.36, 1.52, 0], [.09, .14, 11.95], transportColors.dark));
      for (const z of [-5.65, -3.8, -1.9, 0, 1.9, 3.8, 5.65]) parts.push(box("舱外独立承力竖肋", [side * 1.38, 2.12, z], [.1, 1.78, .14], transportColors.dark));
    }
    for (const end of [-1, 1]) parts.push(box("固定封闭薄壁端挡板", [0, 2.1, end * 5.98], [2.68, 1.8, .1], transportColors.body), box("端板上沿横向压梁", [0, 3.04, end * 5.98], [2.75, .12, .17], transportColors.dark), ...[-1, 1].map(side => strut("端壁斜向加强支撑", [side * 1.15, 1.3, end * 6.06], [0, 2.96, end * 6.06], .07, transportColors.dark)));
    return parts;
  } },
  { name: "下沉中段客室双层铁路客车", theme: "现代", tags: ["双层客室", "低位下层地板", "端部转向架及层间梯级"], create: () => {
    const parts: ModelPart[] = [...runningFrame(20.4, [-9.15, -7.55, 7.55, 9.15]), box("避开端部转向架的下沉客室地板", [0, .67, 0], [2.58, .15, 13.5], transportColors.dark), polygon("两端各留真实楼梯井的上层客室楼板", transportColors.trim, [[-1.325, -10.05], [1.325, -10.05], [1.325, 10.05], [-1.325, 10.05]], .13, [0, 2.415, 0], [-1, 1].map(end => [[-.48, end * 6.7], [.48, end * 6.7], [.48, end * 8.35], [-.48, end * 8.35]])), archedRoof(2.9, 20.7, 4.52)];
    for (const end of [-1, 1]) {
      parts.push(polygon("留有下层楼梯入口缺口的端部车门平台", transportColors.dark, [[-1.3, end * 6.775], [.5, end * 6.775], [.5, end * 7.15], [1.1, end * 7.15], [1.1, end * 6.775], [1.3, end * 6.775], [1.3, end * 10.125], [-1.3, end * 10.125]], .15, [0, 1.165, 0]), box("车端上层封闭墙板", [0, 3.54, end * 10.12], [2.7, 1.95, .1], transportColors.body), box("车端下层可通行门框上梁", [0, 2.43, end * 10.12], [2.7, .16, .13], transportColors.body));
      for (const side of [-1, 1]) parts.push(box("贯通车端门洞两侧实壁", [side * .96, 1.84, end * 10.12], [.76, 1.15, .1], transportColors.body));
      for (let step = 0; step < 6; step++) parts.push(box("端部平台通向上层客室的实体踏步", [0, 1.36 + step * .2, end * (8.15 - step * .27)], [.87, .17, .3], transportColors.dark));
      for (let step = 0; step < 3; step++) parts.push(box("端部平台通向下沉客室的踏步", [.8, .81 + step * .19, end * (6.55 + step * .24)], [.6, .17, .28], transportColors.dark));
    }
    for (const side of [-1, 1]) {
      parts.push(box("下层车窗之下连续车侧围板", [side * 1.35, .98, 0], [.1, .55, 13.5], transportColors.body), box("两层车窗之间封闭车侧腰板", [side * 1.35, 2.61, 0], [.1, .76, 20.2], transportColors.body), box("上层车窗上方过梁", [side * 1.35, 4.4, 0], [.1, .24, 20.2], transportColors.body), part("上层连续玻璃窗带", "box", transportColors.glass, [side * 1.35, 3.635, 0], [.03, 1.29, 20.14], [0, 0, 0], { opacity: .45 }), part("下层连续玻璃窗带", "box", transportColors.glass, [side * 1.35, 1.7425, 0], [.03, .975, 13.55], [0, 0, 0], { opacity: .45 }));
      for (const z of [-9.95, -7.2, -4.8, -2.4, 0, 2.4, 4.8, 7.2, 9.95]) parts.push(box("上下两层车窗之间的连续竖框", [side * 1.35, 2.77, z], [.12, 3.19, .09], transportColors.dark));
      for (const end of [-1, 1]) parts.push(box("下层客室两端覆盖转向架的车身围板", [side * 1.35, 1.73, end * 8.45], [.1, 1.15, 3.35], transportColors.body));
    }
    return parts;
  } },
  { name: "双动力转向架跨桥式铰接蒸汽机车", tags: ["加拉特构型", "中桥锅炉", "独立前后蒸汽动力转向架"], create: () => {
    const parts: ModelPart[] = [box("仅连接两动力转架枢轴的中央锅炉桥架", [0, 1.35, 0], [2.25, .4, 9.3], transportColors.dark), part("中央桥架上方封闭蒸汽锅炉", "lathe", transportColors.body, [0, 2.74, -.5], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -3.65 }, { x: .9, y: -3.65 }, { x: 1, y: -3.48 }, { x: 1, y: 2.65 }, { x: .9, y: 3.15 }, { x: 0, y: 3.15 }] }), box("司机室地板", [0, 1.67, 3.3], [2.5, .18, 2.1], transportColors.dark), box("司机室顶盖", [0, 4.19, 3.3], [2.65, .15, 2.2], transportColors.dark), cylinder("烟箱上方高烟囱", [0, 4.05, -3.15], [.39, 1.03, .39], transportColors.dark), cylinder("锅炉上方蒸汽汇集穹顶", [0, 3.83, -.95], [.59, .6, .59], transportColors.trim), cylinder("锅炉上方砂箱", [0, 3.79, .65], [.6, .52, .6], transportColors.body)];
    for (const z of [-2.3, 1.3]) parts.push(box("锅炉与桥架相连的鞍式承台", [0, 1.84, z], [1.5, .62, .42], transportColors.dark));
    for (const side of [-1, 1]) parts.push(box("司机室下部实壁", [side * 1.18, 2.44, 3.3], [.09, 1.4, 2]), box("司机室立窗框", [side * 1.18, 3.63, 2.38], [.1, .98, .12], transportColors.dark), box("司机室后立柱", [side * 1.18, 3.55, 4.21], [.1, 1.15, .12], transportColors.dark), part("司机室上部透光侧窗", "box", transportColors.glass, [side * 1.18, 3.62, 3.3], [.025, .91, 1.67], [0, 0, 0], { opacity: .5 }));
    for (const end of [-1, 1]) {
      const center = end * 6.1;
      parts.push(box("独立动力转向架纵向底框", [0, .92, center], [2.35, .25, 5.5], transportColors.dark), cylinder("与锅炉桥架相接的竖直回转枢轴", [0, 1.12, end * 4.5], [.53, .3, .53], transportColors.trim), ...[-1.1, 0, 1.1].flatMap(offset => steelWheelset(center + offset)), box("机车端部牵引缓冲梁", [0, .99, end * 8.87], [2.5, .24, .21], transportColors.dark));
      for (const side of [-1, 1]) {
        parts.push(cylinder("动力转架外侧独立蒸汽气缸", [side * 1.03, .95, center + end * 1.55], [.45, .88, .45], transportColors.body, [90, 0, 0]), strut("贯穿三根车轴曲柄的联动连杆", [side * 1.06, .66, center - 1.1], [side * 1.06, .66, center + 1.1], .09, transportColors.trim), strut("气缸活塞杆接至车轮曲柄", [side * 1.06, .66, center + end * 1.1], [side * 1.06, .95, center + end * 1.63], .065, transportColors.trim), strut("从锅炉桥架到转架气缸的蒸汽管", [side * .74, 2.2, end * 3.7], [side * 1.03, .95, center + end * 1.55], .11, transportColors.dark));
        for (const offset of [-1.1, 0, 1.1]) parts.push(cylinder("轮缘外侧连杆曲柄销", [side * .99, .66, center + offset], [.13, .22, .13], transportColors.trim, [0, 0, 90]));
      }
    }
    parts.push(box("前动力转架上方独立储水箱", [0, 2.015, -6.3], [2.3, 1.95, 4.2], transportColors.body), cylinder("前储水箱注水口盖", [0, 3.04, -6.3], [.47, .14, .47], transportColors.dark), box("后动力转架煤仓底板", [0, 1.47, 6.5], [2.2, .14, 3.55], transportColors.dark));
    for (const side of [-1, 1]) parts.push(box("后煤仓中空高侧板", [side * 1.08, 2.2, 6.5], [.1, 1.5, 3.55], transportColors.body));
    for (const end of [-1, 1]) parts.push(box("煤仓封闭端挡板", [0, 2.2, 6.5 + end * 1.73], [2.2, 1.5, .1], transportColors.body));
    return parts;
  } },
  { name: "立式侧缸万向轴齿轮传动蒸汽机车", tags: ["谢伊构型", "偏置锅炉", "侧置立式三汽缸", "外露纵向传动轴"], create: () => {
    const parts: ModelPart[] = [...runningFrame(12.3, [-4.9, -3.25, 3.25, 4.9]), cylinder("偏置在左侧让出立缸传动空间的锅炉", [-.35, 2.36, -2.25], [1.65, 5.95, 1.65], transportColors.body, [90, 0, 0]), cylinder("前烟箱端板", [-.35, 2.36, -5.26], [1.66, .12, 1.66], transportColors.dark, [90, 0, 0]), cylinder("偏置锅炉上部烟囱", [-.35, 3.64, -4.33], [.34, 1.08, .34], transportColors.dark), cylinder("蒸汽穹顶", [-.35, 3.43, -1.75], [.54, .56, .54], transportColors.trim), box("司机室底板", [0, 1.39, 1.5], [2.55, .18, 2.3], transportColors.wood), box("司机室顶盖", [0, 3.88, 1.5], [2.7, .16, 2.45], transportColors.dark), box("后部独立煤水承载箱", [0, 2.03, 4.56], [2.32, 1.8, 2.84], transportColors.body), cylinder("后部水箱注入口", [.45, 3, 4.8], [.4, .14, .4], transportColors.dark), strut("侧置立式汽缸的共同曲柄轴", [1.14, 1.31, -.65], [1.14, 1.31, .85], .12, transportColors.dark), strut("前转向架可伸缩万向传动轴", [1.14, 1.31, -.65], [1.14, .58, -2.3], .09, transportColors.trim), strut("后转向架可伸缩万向传动轴", [1.14, 1.31, .85], [1.14, .58, 2.4], .09, transportColors.trim), strut("前动力转架外侧纵向齿轮传动轴", [1.14, .58, -5.1], [1.14, .58, -2.3], .09, transportColors.dark), strut("后动力转架外侧纵向齿轮传动轴", [1.14, .58, 2.4], [1.14, .58, 5.1], .09, transportColors.dark)];
    for (const z of [-.45, .1, .65]) parts.push(cylinder("右侧独立竖直蒸汽气缸", [1.05, 2.06, z], [.34, .76, .34], transportColors.body), cylinder("立式汽缸下端活塞杆", [1.05, 1.57, z], [.065, .38, .065], transportColors.trim), rod("立缸活塞到侧曲柄的斜连杆", [1.05, 1.43, z], [1.14, 1.31, z + .12], .055, transportColors.trim), cylinder("立缸顶部进汽短接头", [.725, 2.3, z], [.11, .65, .11], transportColors.dark, [0, 0, 90]));
    for (const z of [-4.9, -3.25, 3.25, 4.9]) parts.push(cylinder("转架车轴外端从动锥齿轮", [1.05, .49, z], [.31, .17, .31], transportColors.trim, [0, 0, 90]), cylinder("万向纵轴与锥齿轮相交的驱动小轮", [1.14, .58, z - .12], [.16, .16, .16], transportColors.dark, [90, 0, 0]), box("轴端锥齿轮的非封闭保护上盖", [1.08, .7, z], [.4, .055, .4], transportColors.dark));
    for (const side of [-1, 1]) parts.push(box("司机室侧下实壁", [side * 1.2, 2.01, 1.5], [.09, 1.1, 2.2], transportColors.body), box("司机室前后窗立柱", [side * 1.2, 3.16, .43], [.1, 1.27, .12], transportColors.dark), box("司机室后窗立柱", [side * 1.2, 3.16, 2.57], [.1, 1.27, .12], transportColors.dark), part("通透司机室长侧窗", "box", transportColors.glass, [side * 1.2, 3.16, 1.5], [.025, 1.19, 1.98], [0, 0, 0], { opacity: .45 }));
    for (const z of [-3.6, -.8]) parts.push(box("偏置锅炉落到主架的鞍座", [-.35, 1.61, z], [1.32, .58, .37], transportColors.dark));
    return parts;
  } },
  { name: "双侧配平货舱骑马式单轨货车", tags: ["拉蒂格式单轨", "中央高位承重轮", "两侧低位配平货舱"], create: () => {
    const parts: ModelPart[] = [box("架在中央高轨上方的纵向承力脊梁", [0, 2.14, 0], [.28, .22, 6.25], transportColors.dark)];
    for (const side of [-1, 1]) {
      parts.push(box("中央轨两侧独立低位货舱底板", [side * .94, .17, 0], [.95, .16, 6.05], transportColors.wood), box("两侧货舱外沿薄壁", [side * 1.39, .8, 0], [.1, 1.18, 6.05], transportColors.wood), box("货舱靠中央轨一侧的独立薄壁", [side * .49, .8, 0], [.08, 1.18, 6.05], transportColors.wood));
      for (const end of [-1, 1]) parts.push(box("配平货舱端部固定挡板", [side * .94, .8, end * 2.98], [.95, 1.18, .1], transportColors.wood), strut("高位轮架至低位货舱的端部斜吊梁", [0, 2.1, end * 2.73], [side * .96, .22, end * 2.73], .1, transportColors.dark));
      for (const z of [-2.4, 0, 2.4]) parts.push(box("木货舱外侧竖向束条", [side * 1.46, .79, z], [.06, 1.3, .12], transportColors.dark));
    }
    for (const z of [-2.35, 2.35]) {
      parts.push(part("单根高轨上的双轮缘承重轮", "lathe", transportColors.dark, [0, 1.72, z], [1, 1, 1], [0, 0, 90], { profile: [{ x: .08, y: -.13 }, { x: .36, y: -.13 }, { x: .36, y: -.09 }, { x: .32, y: -.075 }, { x: .32, y: .075 }, { x: .36, y: .09 }, { x: .36, y: .13 }, { x: .08, y: .13 }, { x: .08, y: -.13 }] }), cylinder("中央高轮横向承重轴", [0, 1.72, z], [.14, .66, .14], transportColors.trim, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(box("承重轴到中央脊梁的轴箱", [side * .26, 1.94, z], [.15, .5, .3], transportColors.body), cylinder("两侧低位导向轨的水平稳定滚轮", [side * 1.04, .07, z], [.2, .12, .2], transportColors.dark), strut("低位导向轮至货舱底梁的固定支架", [side * .94, .17, z], [side * 1.04, .07, z], .065));
    }
    for (const end of [-1, 1]) parts.push(box("中央高位牵引钩座", [0, 2.07, end * 3.28], [.18, .18, .4], transportColors.dark));
    return parts;
  } },
];
