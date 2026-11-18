import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, ball, strut, transportColors, type TransportDefinition } from "./parts";

// 只制作完整且不同承压/承力架构的飞行载体，不按人数、品牌或分离状态扩项。
// https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/The_Russian_Soyuz_spacecraft
// https://www.nasa.gov/wp-content/uploads/static/history/SP-4408pt1.pdf
// https://www.nasa.gov/news-release/nasa-at-50-flight-research-centers-llrvs-led-to-apollo-lunar-landers/
export const aerospaceExpansionBatchNineteen: TransportDefinition[] = [
  { name: "球形轨道舱钟形返回舱串接载人飞船", theme: "现代", tags: ["完整载人轨道飞船", "球形轨道舱", "钟形返回压力壳", "独立仪器推进服务段"], create: () => {
    const parts: ModelPart[] = [part("提供轨道机动与能源接口的独立封闭服务段", "lathe", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0.6 }, { x: 1.1, y: 0.6 }, { x: 1.25, y: 0.9 }, { x: 1.25, y: 2.5 }, { x: 1.05, y: 3.2 }, { x: 0, y: 3.2 }] }), part("下宽圆肩上部收窄的钟形载人返回压力壳", "lathe", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 3.2 }, { x: 1.15, y: 3.2 }, { x: 1.35, y: 3.45 }, { x: 1.28, y: 4.1 }, { x: 1.05, y: 4.8 }, { x: 0.7, y: 5.25 }, { x: 0, y: 5.25 }] }), cylinder("钟形返回舱与上部轨道舱之间的短承压颈", [0, 5.3, 0], [0.8, 0.5, 0.8], transportColors.dark), ball("位于返回舱上方的完整球形轨道生活舱", [0, 6.5, 0], [2.3, 2.3, 2.3], transportColors.body), part("服务段下方具有真正空腔的主轨道机动喷口", "lathe", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.42, y: 0 }, { x: 0.5, y: 0 }, { x: 0.25, y: 1.0 }, { x: 0.18, y: 1.0 }, { x: 0.42, y: 0 }] }), ring("球形轨道舱前端的真实中空对接颈", transportColors.dark, 0.45, 0.1, 7.8, 0.6), ring("对接颈最前端的连续承载锁紧环", transportColors.body, 0.55, 0.16, 8.1, 0.15), strut("对接环中心向前伸出的长探杆", [0, 8.1, 0], [0, 8.65, 0], 0.06), cylinder("球形轨道舱侧面的独立圆窗玻璃", [-1.16, 6.5, 0], [0.38, 0.08, 0.38], transportColors.glass, [0, 0, 90])];
    for (let index = 0; index < 3; index++) {
      const a = index * Math.PI * 2 / 3;
      parts.push(strut("将对接探杆根部接到锁紧环的径向短撑", [0, 8.1, 0], [Math.cos(a) * 0.42, 8.1, Math.sin(a) * 0.42], 0.045));
    }
    for (const side of [-1, 1]) parts.push(box("由服务段两侧展开的完整供电翼", [side * 3.25, 1.9, 0], [4.0, 0.06, 1.6], "#496e82"), strut("服务段至展开供电翼的实际承载轴", [side * 1.15, 1.9, 0], [side * 3.25, 1.9, 0], 0.09), cylinder("钟形返回舱前侧的圆形观察窗玻璃", [side * 1.12, 4.45, -0.3], [0.28, 0.08, 0.28], transportColors.glass, [0, 0, 90]), strut("服务段侧方外伸的交会测量天线支座", [side * 1.0, 2.7, 0.4], [side * 1.8, 3.1, 0.4], 0.035), strut("交会测量天线支座外端的短竖杆", [side * 1.8, 3.1, 0.4], [side * 1.8, 3.6, 0.4], 0.025));
    return parts;
  } },
  { name: "球形返回舱外置双锥设备段早期轨道飞船", theme: "现代", tags: ["完整早期轨道飞船", "球形载人返回压力壳", "外露双锥设备段", "环列支承锥架"], create: () => {
    const parts: ModelPart[] = [part("上下收窄且不与球舱混成同一承压体的双锥设备段", "lathe", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0.6 }, { x: 0.6, y: 0.6 }, { x: 1.15, y: 1.35 }, { x: 0.95, y: 2.0 }, { x: 0.6, y: 2.5 }, { x: 0, y: 2.5 }] }), ball("在双锥设备段上方独立装配的球形返回舱", [0, 3.4, 0], [2.3, 2.3, 2.3], transportColors.trim), part("设备段底部真正内凹的轨道机动喷口", "lathe", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.28, y: 0 }, { x: 0.35, y: 0 }, { x: 0.19, y: 0.8 }, { x: 0.13, y: 0.8 }, { x: 0.28, y: 0 }] }), cylinder("球形返回舱侧面为圆形外舱门设置的凸出短套座", [-1.08, 3.4, 0], [1.0, 0.2, 1.0], transportColors.body, [0, 0, 90]), ring("返回舱圆形外舱门周围的连续密封承圈", transportColors.dark, 0.5, 0.06, 0, 0.08, { position: { x: -1.2, y: 3.4, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("飞行状态下保持关闭的圆形金属外舱门", [-1.21, 3.4, 0], [0.88, 0.05, 0.88], transportColors.body, [0, 0, 90]), cylinder("球形返回舱外侧的观察窗玻璃", [0.965, 3.9, 0.4], [0.25, 0.08, 0.25], transportColors.glass, [0, 0, 90]), box("关闭外舱门外表面的可握短把手", [-1.255, 3.4, 0], [0.04, 0.28, 0.06], transportColors.dark)];
    for (let index = 0; index < 6; index++) {
      const a = index * Math.PI / 3;
      parts.push(strut("将独立球形返回舱接到双锥设备段的外露承力斜架", [Math.cos(a) * 0.9, 1.8, Math.sin(a) * 0.9], [Math.cos(a) * 0.76, 2.55, Math.sin(a) * 0.76], 0.07));
    }
    for (const side of [-1, 1]) parts.push(strut("双锥设备段外伸的长测量通信天线", [side * 1.0, 1.5, 0], [side * 2.4, 1.9, 0], 0.03), strut("设备段前后向独立展开的细长天线", [0, 1.5, side * 1.0], [0, 1.9, side * 2.4], 0.03));
    return parts;
  } },
  { name: "开放桁架万向喷气月球着陆训练飞行器", theme: "现代", tags: ["完整着陆训练飞行器", "中央双万向喷气升力", "开放四角承力桁架", "侧前操纵座与滑橇"], create: () => {
    const parts: ModelPart[] = [ring("与开放桁架连成整体的外万向承力环", transportColors.body, 1.3, 0.1, 1.8, 0.12), ring("通过横向转轴接到外环的内万向承力环", transportColors.trim, 1.15, 0.12, 1.8, 0.1), part("由双万向环托持且上下真正贯通的中央喷气升力发动机", "lathe", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.22, y: 0.55 }, { x: 0.3, y: 0.55 }, { x: 0.42, y: 1.3 }, { x: 0.55, y: 1.9 }, { x: 0.58, y: 2.7 }, { x: 0.5, y: 3.0 }, { x: 0.43, y: 3.0 }, { x: 0.49, y: 2.7 }, { x: 0.46, y: 1.9 }, { x: 0.34, y: 1.3 }, { x: 0.22, y: 0.55 }] }), box("与前框架相接而不封住中央进排气的操纵座小地板", [0, 1.75, -2.4], [1.0, 0.12, 1.2], transportColors.body), box("操纵座位的实际坐垫", [0, 2.0, -2.5], [0.5, 0.15, 0.55], transportColors.dark), box("操纵座位后方的短靠背", [0, 2.35, -2.2], [0.52, 0.65, 0.1], transportColors.body), box("操纵座前方的封闭仪表板", [0, 2.3, -2.9], [0.7, 0.4, 0.15], transportColors.dark), strut("操纵座小地板至前仪表板的实际支承", [0, 1.8, -2.95], [0, 2.3, -2.9], 0.055), strut("从座位前缘接出的短操纵杆", [0, 2.0, -2.75], [0, 2.45, -2.75], 0.03)];
    const corners: Triple[] = [[-1.9, 1.8, -1.9], [1.9, 1.8, -1.9], [1.9, 1.8, 1.9], [-1.9, 1.8, 1.9]];
    for (let index = 0; index < corners.length; index++) {
      const a = corners[index]!, b = corners[(index + 1) % corners.length]!, x = Math.sign(a[0]), z = Math.sign(a[2]);
      parts.push(strut("环绕中央万向发动机且保持开敞的主框架边梁", a, b, 0.12), strut("主框架角点至中央万向承力环的径向支承", a, [x * 0.92, 1.8, z * 0.92], 0.11), strut("主框架角点至下方滑橇的外张落地支腿", a, [x * 2.3, 0.16, z * 1.9], 0.12), strut("相邻落腿之间保持开放的横向抗剪斜撑", a, [Math.sign(b[0]) * 2.3, 0.16, Math.sign(b[2]) * 1.9], 0.07), part("主框架角部真正内凹的独立垂直姿态控制喷口", "lathe", transportColors.dark, [x * 1.8, 0, z * 1.8], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.14, y: 1.15 }, { x: 0.2, y: 1.15 }, { x: 0.12, y: 1.9 }, { x: 0.07, y: 1.9 }, { x: 0.14, y: 1.15 }] }));
    }
    for (const side of [-1, 1]) {
      parts.push(box("开放桁架下方前后连续的细长着陆滑橇", [side * 2.3, 0.08, 0], [0.12, 0.16, 5.2], transportColors.dark), cylinder("将内外万向环沿左右方向相连的短耳轴", [side * 1.2, 1.8, 0], [0.13, 0.28, 0.13], transportColors.dark, [0, 0, 90]), cylinder("将中央发动机沿前后方向接到内万向环的短耳轴", [0, 1.8, side * 0.8], [0.13, 0.6, 0.13], transportColors.dark, [90, 0, 0]), part("由主框架实际承托的独立封闭侧置贮箱", "lathe", transportColors.trim, [side * 1.65, 2.0, 0.3], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -1.0 }, { x: 0.35, y: -0.8 }, { x: 0.45, y: -0.5 }, { x: 0.45, y: 0.5 }, { x: 0.35, y: 0.8 }, { x: 0, y: 1.0 }] }));
      for (const end of [-1, 1]) parts.push(strut("侧置贮箱与角部控制喷口之间沿框架铺设的外部管路", [side * 1.65, 1.9, end * 0.6], [side * 1.8, 1.8, end * 1.8], 0.035, transportColors.dark));
    }
    return parts;
  } },
];
