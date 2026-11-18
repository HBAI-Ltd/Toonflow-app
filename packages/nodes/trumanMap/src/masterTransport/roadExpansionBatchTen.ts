import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, wheel, transportColors, type TransportDefinition } from "./parts";

function pipe(name: string, position: Triple, radius: number, wall: number, length: number, rotation: Triple): ModelPart {
  return part(name, "lathe", transportColors.body, position, [1, 1, 1], rotation, { profile: [{ x: radius, y: -length / 2 }, { x: radius, y: length / 2 }, { x: radius - wall, y: length / 2 }, { x: radius - wall, y: -length / 2 }, { x: radius, y: -length / 2 }] });
}

// 原创静态设备的类别依据，非制造商型号复刻或工艺性能声明。
// https://www.trecan.com/snowmelters/portable-models/
// https://www.bauer-at.com/en/product/bauer-rainstar/
// https://www.ecoppia.com/warehouse/temp/ecoppia/E4_Product_Overview.pdf
export const roadExpansionBatchTen: TransportDefinition[] = [
  { name: "敞口接雪池燃烧换热式移动融雪机", theme: "现代", itemType: "设施", tags: ["移动融雪机", "接雪熔化池", "燃烧换热与排水"], create: () => {
    const parts: ModelPart[] = [box("承托受雪池的独立拖挂主框", [0, 0.91, 0.1], [2.45, 0.3, 5.0], transportColors.dark), box("敞口受雪池的实厚底板", [0, 1.38, 0], [2.6, 0.22, 4.6], transportColors.body), ...[-1, 1].map(side => box("受雪池两侧隔热薄墙", [side * 1.3, 2.39, 0], [0.2, 1.9, 4.7], transportColors.signal)), ...[-1, 1].map(end => box("受雪池前后隔热端墙", [0, 2.39, end * 2.25], [2.6, 1.9, 0.2], transportColors.signal)), cylinder("池前独立燃烧器送风与燃烧筒", [0, 1.88, -3.1], [0.85, 1.85, 0.85], transportColors.body, [90, 0, 0]), box("燃烧筒底部与拖架连接的承托台", [0, 1.27, -3.07], [1.05, 0.45, 1.6], transportColors.dark), cylinder("燃烧器前方助燃风机封闭机壳", [0, 1.88, -4.0], [0.72, 0.22, 0.72], transportColors.dark, [90, 0, 0]), cylinder("向池内四路分配热烟气的前横管", [0, 1.72, -2.04], [0.28, 2.1, 0.28], transportColors.dark, [0, 0, 90]), cylinder("池后端汇集烟气的横向集管", [0, 1.72, 1.91], [0.28, 2.1, 0.28], transportColors.dark, [0, 0, 90]), pipe("在池后端升起且顶部真实开放的排烟管", [0.86, 3.0, 1.91], 0.18, 0.025, 2.6, [0, 0, 0]), box("池外侧燃烧控制箱", [-1.5, 1.86, -1.68], [0.3, 0.65, 0.55], transportColors.dark), pipe("从受雪池侧面引出的低位排水口", [1.47, 1.6, 1.6], 0.1, 0.018, 0.46, [0, 0, 90]), cylinder("排水口人工截断阀门的立式操作杆", [1.52, 1.78, 1.6], [0.024, 0.24, 0.024]), box("截断阀操作横握杆", [1.52, 1.92, 1.6], [0.22, 0.035, 0.035], transportColors.signal)];
    for (const z of [-1.24, 1.24]) {
      parts.push(cylinder("受雪池下方贯通承重车轴", [0, 0.5, z], [0.14, 2.42, 0.14], transportColors.dark, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(...wheel([side * 1.21, 0.5, z], 0.5, 0.34));
    }
    for (const x of [-0.81, -0.27, 0.27, 0.81]) parts.push(cylinder("在受雪池底部纵向穿过的独立换热烟道", [x, 1.72, -0.065], [0.22, 3.95, 0.22], transportColors.dark, [90, 0, 0]));
    for (const side of [-1, 1]) {
      parts.push(box("池底与主拖架之间的承重垫梁", [side * 0.88, 1.18, 0], [0.22, 0.3, 4.6], transportColors.body), strut("主车架向前汇合的V形牵引梁", [side * 0.88, 0.85, -2.25], [0, 0.7, -4.68], 0.16, transportColors.dark), box("受雪池顶端连续耐磨装载口沿", [side * 1.3, 3.39, 0], [0.28, 0.11, 4.85], transportColors.body));
      for (const z of [-1.5, 0, 1.5]) parts.push(box("受雪池外侧竖向加强框", [side * 1.43, 2.39, z], [0.06, 1.85, 0.12], transportColors.body));
    }
    parts.push(ring("融雪机拖杆前端的真实牵引环", transportColors.body, 0.14, 0.055, 0.7, 0.1, { position: { x: 0, y: 0.7, z: -4.75 } }));
    return parts;
  } },
  { name: "水涡轮回收式大型软管卷盘喷灌机", theme: "现代", itemType: "设施", tags: ["卷盘喷灌机", "PE水管卷盘", "水涡轮排管回收"], create: () => {
    const parts: ModelPart[] = [box("带回转卷盘的双轮拖架", [0, 0.65, 0.2], [1.9, 0.2, 3.4], transportColors.dark), cylinder("拖架上方可调朝向的回转底盘", [0, 0.83, 0.4], [1.4, 0.17, 1.4], transportColors.body), cylinder("卷盘两侧支承共用的横向中心轴", [0, 2.15, 0.4], [0.16, 2.12, 0.16], transportColors.body, [0, 0, 90]), cylinder("水管卷绕所依托的封闭中心鼓", [0, 2.15, 0.4], [0.62, 1.5, 0.62], transportColors.dark, [0, 0, 90]), ring("收纳PE软管内层的实际绕管厚层", transportColors.dark, 0.98, 0.67, 0, 1.4, { position: { x: 0, y: 2.15, z: 0.4 }, rotation: { x: 0, y: 0, z: 90 } }), part("外层水管沿卷盘轴线连续排布的缠绕线", "tube", "#3d4e51", [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.026, path: Array.from({ length: 63 }, (_, index) => { const angle = index / 62 * Math.PI * 16; return { x: -0.7 + index / 62 * 1.4, y: 2.15 + Math.cos(angle) * 0.99, z: 0.4 + Math.sin(angle) * 0.99 }; }) }), cylinder("侧面水涡轮与减速机构的圆形机壳", [-1.04, 1.19, -0.3], [0.45, 0.18, 0.45], transportColors.signal, [0, 0, 90]), pipe("水涡轮低位供水口", [-1.04, 0.98, -0.48], 0.065, 0.015, 0.26, [90, 0, 0]), pipe("卷盘中心独立旋转供水接头", [1.08, 2.15, 0.4], 0.09, 0.02, 0.27, [0, 0, 90]), part("旋转供水接头回到涡轮的弯曲水管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.04, path: [{ x: 1.2, y: 2.15, z: 0.4 }, { x: 1.3, y: 1.35, z: 0.15 }, { x: 0.7, y: 0.98, z: -0.45 }, { x: -0.95, y: 1.15, z: -0.45 }] }), cylinder("前部停放支腿的螺旋调节筒", [0, 0.37, -1.55], [0.09, 0.65, 0.09], transportColors.body), box("停放支腿的接地脚板", [0, 0.045, -1.55], [0.42, 0.09, 0.38], transportColors.dark), ring("前牵引拖环", transportColors.body, 0.12, 0.045, 0.55, 0.08, { position: { x: 0, y: 0.55, z: -3.05 } })];
    parts.push(cylinder("双轮底盘共同车轴", [0, 0.42, 0.4], [0.12, 2.15, 0.12], transportColors.dark, [0, 0, 90]), ...[-1, 1].flatMap(side => wheel([side * 1.075, 0.42, 0.4], 0.42, 0.25)));
    for (const side of [-1, 1]) {
      parts.push(ring("防止软管滑脱的开放卷盘轮缘", transportColors.body, 1.25, 0.08, 0, 0.09, { position: { x: side * 0.78, y: 2.15, z: 0.4 }, rotation: { x: 0, y: 0, z: 90 } }), strut("前方牵引V形拖杆", [side * 0.8, 0.6, -1.45], [0, 0.55, -2.96], 0.11, transportColors.dark));
      for (const z of [-0.6, 1.35]) parts.push(strut("回转底盘至卷盘轴承的三角支架", [side * 0.93, 0.88, z], [side * 0.93, 2.15, 0.4], 0.09, transportColors.signal));
      for (let spoke = 0; spoke < 6; spoke++) { const angle = spoke * Math.PI / 3; parts.push(strut("连接中心鼓和外轮缘的独立辐条", [side * 0.78, 2.15, 0.4], [side * 0.78, 2.15 + Math.cos(angle) * 1.2, 0.4 + Math.sin(angle) * 1.2], 0.055, transportColors.body)); }
    }
    for (const y of [1.0, 1.45]) parts.push(strut("回收水管前方的排管导向横轴", [-0.73, y, -1.12], [0.73, y, -1.12], 0.045, transportColors.body));
    for (const side of [-1, 1]) parts.push(strut("排管横轴至拖架的竖向支承", [side * 0.73, 0.72, -1.12], [side * 0.73, 1.51, -1.12], 0.05, transportColors.body));
    parts.push(strut("侧涡轮减速箱向卷盘传力的侧向支架", [-1.04, 1.19, -0.3], [-0.93, 2.15, 0.4], 0.08, transportColors.body), cylinder("运输位收纳喷灌枪的立式支管", [0, 0.98, 1.85], [0.065, 0.6, 0.065], transportColors.body), part("收纳在卷盘拖架尾端的倾斜喷灌枪管", "tube", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.033, path: [{ x: 0, y: 1.25, z: 1.85 }, { x: 0, y: 1.55, z: 2.6 }] }), pipe("喷灌枪末端真实贯通小径喷嘴", [0, 1.55, 2.6], 0.027, 0.007, 0.14, [68.2, 0, 0]));
    for (const side of [-1, 1]) parts.push(strut("喷灌枪运输支管至拖架的斜支撑", [side * 0.5, 0.76, 1.58], [0, 1.2, 1.85], 0.045, transportColors.body));
    return parts;
  } },
  { name: "跨排端轮导向长滚刷光伏清洁机器人", theme: "现代", itemType: "电子设备", tags: ["光伏清洁机器人", "跨排桥式机架", "长滚刷与端部导向轮"], create: () => {
    const parts: ModelPart[] = [box("跨越光伏组件排面的长桥式机架", [0, 0.43, 0], [5.4, 0.1, 0.48], transportColors.body), cylinder("贯穿整排组件表面的长幅柔性清洁滚刷", [0, 0.14, 0], [0.28, 5.15, 0.28], "#75847a", [0, 0, 90]), box("清洁机器人中央电池与控制舱", [0, 0.54, 0], [1.1, 0.18, 0.5], transportColors.dark), box("机架上方的独立光伏供电板背架", [0.95, 0.6, 0], [1.4, 0.055, 0.53], transportColors.body, [0, 0, 5]), box("供电板上的实际发电面", [0.95, 0.633, 0], [1.35, 0.012, 0.49], "#385568", [0, 0, 5]), box("供电板低端连接机架的短承脚", [0.5, 0.505, 0], [0.12, 0.07, 0.3], transportColors.body), box("供电板高端连接机架的长承脚", [1.4, 0.545, 0], [0.12, 0.15, 0.3], transportColors.body)];
    for (const side of [-1, 1]) {
      parts.push(box("长机架两端独立驱动行走舱", [side * 2.62, 0.36, 0], [0.4, 0.24, 0.9], transportColors.body), box("滚刷轴端与端轮舱相连的减速壳", [side * 2.55, 0.23, 0], [0.22, 0.28, 0.27], transportColors.dark), cylinder("从减速壳伸向滚刷的真实短轴", [side * 2.52, 0.14, 0], [0.055, 0.28, 0.055], transportColors.body, [0, 0, 90]), box("感知组件边缘的前置导向感应头", [side * 2.62, 0.32, -0.51], [0.16, 0.1, 0.17], transportColors.dark));
      for (const z of [-0.32, 0.32]) parts.push(...wheel([side * 2.63, 0.105, z], 0.105, 0.07), strut("端轮轴心与驱动舱之间的承托立臂", [side * 2.63, 0.105, z], [side * 2.63, 0.29, z], 0.035, transportColors.body));
      parts.push(strut("机架上方用于人工提放的短把手", [side * 1.7, 0.5, -0.1], [side * 1.7, 0.62, -0.1], 0.02, transportColors.dark), strut("提放把手的横向握杆", [side * 1.7, 0.62, -0.1], [side * 1.7, 0.62, 0.1], 0.025, transportColors.dark), strut("提放把手后端回到机架的支杆", [side * 1.7, 0.62, 0.1], [side * 1.7, 0.5, 0.1], 0.02, transportColors.dark));
    }
    return parts;
  } },
];
