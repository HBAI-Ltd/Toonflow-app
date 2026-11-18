import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { axles, box, cylinder, strut, surface, transportColors, wheel, type TransportDefinition } from "./parts";

function towingEye(position: Triple, diameter = 0.15): ModelPart {
  return ring("牵引销可实际穿过的拖环", transportColors.dark, diameter / 2, diameter * 0.18, 0, 0.035, { position: { x: position[0], y: position[1], z: position[2] } });
}

// 原理和实体类别：原创无品牌简化模型，不提供制造规格或载荷能力。
// https://www.tronair.com/collections/tripod-jacks
// https://www.iata.org/en/programs/cargo/cargo-operations/unit-load-devices
// https://landingpad.safranmbd.com/lp/mro
export const airfieldServiceModels: TransportDefinition[] = [
  { name: "三角支腿液压飞机顶升架", theme: "现代", itemType: "设施", tags: ["飞机维修千斤顶", "三角液压顶架", "机场地服"], create: () => {
    const parts: ModelPart[] = [cylinder("中心竖直液压顶升筒", [0, 1.38, 0], [0.2, 1.75, 0.2], transportColors.signal), cylinder("上部可伸缩承载活塞杆", [0, 2.4, 0], [0.1, 0.65, 0.1], transportColors.trim), cylinder("机身顶点承托小碟座", [0, 2.75, 0], [0.22, 0.08, 0.22], transportColors.dark), ring("防止下沉的机械保险旋母", transportColors.dark, 0.16, 0.065, 2.1, 0.16), box("侧置液压油箱与泵座", [0.38, 0.62, 0], [0.35, 0.32, 0.4]), strut("泵压操作长柄", [0.4, 0.8, 0], [0.6, 1.4, 0], 0.025), cylinder("面向操作侧的压力表", [0.48, 0.91, -0.17], [0.13, 0.04, 0.13], transportColors.trim, [90, 0, 0]), strut("压力表中心指针", [0.48, 0.91, -0.195], [0.51, 0.94, -0.195], 0.006, transportColors.dark)];
    for (let index = 0; index < 3; index++) {
      const angle = index * Math.PI * 2 / 3, x = Math.cos(angle) * 1.1, z = Math.sin(angle) * 1.1;
      parts.push(strut("向外张开承载的三角支腿", [0, 1.7, 0], [x, 0.13, z], 0.11, transportColors.signal), cylinder("每腿独立可调地脚螺柱", [x, 0.15, z], [0.07, 0.26, 0.07]), cylinder("承载落地圆脚垫", [x, 0.035, z], [0.28, 0.07, 0.28], transportColors.dark), strut("三角腿间水平限位连梁", [x * 1.25 / 1.57, 0.45, z * 1.25 / 1.57], [Math.cos(angle + Math.PI * 2 / 3) * 1.1 * 1.25 / 1.57, 0.45, Math.sin(angle + Math.PI * 2 / 3) * 1.1 * 1.25 / 1.57], 0.045));
    }
    parts.push(strut("侧置泵箱连接中心缸筒的承托梁", [0, 0.5, 0], [0.45, 0.5, 0], 0.08), strut("压力表下部承压表颈", [0.48, 0.78, -0.17], [0.48, 0.88, -0.17], 0.025), cylinder("泵压长柄铰接短座", [0.4, 0.78, 0], [0.05, 0.08, 0.05]), part("泵箱连接主缸的供油软管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.015, path: [{ x: 0.38, y: 0.64, z: 0.17 }, { x: 0.2, y: 0.63, z: 0.2 }, { x: 0.08, y: 0.75, z: 0 }] }));
    return parts;
  } },
  { name: "双轮支承式飞机地面牵引杆", theme: "现代", itemType: "构件", tags: ["飞机拖杆", "前起落架牵引杆", "机场地服"], create: () => {
    return [cylinder("长向中空主牵引梁", [0, 0.38, 0], [0.16, 3.9, 0.16], transportColors.signal, [90, 0, 0]), ...axles(0.75, [0.2], 0.16), strut("车轮轴至拖杆的竖承托", [0, 0.16, 0.2], [0, 0.38, 0.2], 0.08), towingEye([0, 0.38, 2.03], 0.22), box("机轮连接头的剪切保险匣", [0, 0.38, -1.96], [0.35, 0.18, 0.3]), ...[-1, 1].map(side => strut("向前起落架两侧张开的夹接臂", [side * 0.13, 0.38, -2.05], [side * 0.34, 0.38, -2.43], 0.08, transportColors.signal)), ...[-1, 1].map(side => cylinder("横向插入轮轴牵引孔的接销", [side * 0.27, 0.38, -2.43], [0.07, 0.2, 0.07], transportColors.dark, [0, 0, 90])), box("连接头上部保险销拨片", [0, 0.52, -1.98], [0.06, 0.12, 0.17], transportColors.dark)];
  } },
  { name: "油气减振剪臂式双轮主起落架", theme: "现代", itemType: "构件", tags: ["飞机主起落架", "油气减震支柱", "扭力剪臂"], create: () => {
    const parts: ModelPart[] = [cylinder("上部承载油气减振外筒", [0, 1.9, 0], [0.31, 1.6, 0.31], transportColors.body), cylinder("下部向轮轴伸出的活塞滑筒", [0, 0.9, 0], [0.2, 0.9, 0.2], transportColors.trim), cylinder("双轮共用贯通轮轴", [0, 0.4, 0], [0.18, 1.1, 0.18], transportColors.dark, [0, 0, 90]), ...[-1, 1].flatMap(side => wheel([side * 0.46, 0.4, 0], 0.4, 0.18)), ...[-1, 1].map(side => cylinder("轮内侧多盘制动包", [side * 0.3, 0.4, 0], [0.5, 0.1, 0.5], transportColors.dark, [0, 0, 90])), cylinder("连入翼根的上端水平耳轴", [0, 2.7, 0], [0.32, 0.65, 0.32], transportColors.dark, [90, 0, 0]), strut("上半扭力剪臂", [0, 1.5, 0.16], [0, 1.1, 0.46], 0.075), strut("下半扭力剪臂", [0, 1.1, 0.46], [0, 0.65, 0.13], 0.075), cylinder("扭力剪臂共同铰轴", [0, 1.1, 0.46], [0.1, 0.18, 0.1], transportColors.dark, [0, 0, 90]), strut("铰接防折撑杆下段", [0.08, 1.25, 0], [0.72, 1.9, 0], 0.1), strut("铰接防折撑杆上段", [0.72, 1.9, 0], [0.9, 2.7, 0], 0.1), strut("上端耳轴与撑杆的横向安装梁", [0, 2.7, 0], [0.9, 2.7, 0], 0.12), strut("收放执行液压缸", [0.8, 2.62, 0.15], [0.12, 1.85, 0.15], 0.09)];
    parts.push(part("沿支柱引向制动器的柔性管束", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.012, path: [{ x: -0.13, y: 2.4, z: 0.05 }, { x: -0.17, y: 1.5, z: 0.09 }, { x: -0.24, y: 0.9, z: 0.1 }, { x: -0.3, y: 0.5, z: 0.05 }] }));
    return parts;
  } },
  { name: "单侧削角薄壳航空集装货箱", theme: "现代", itemType: "器物", tags: ["航空ULD货箱", "LD3形货箱", "机腹货运"], create: () => {
    const profile = [{ x: -0.78, y: 0.06 }, { x: 0.78, y: 0.06 }, { x: 0.78, y: 1.63 }, { x: -1.2, y: 1.63 }, { x: -1.2, y: 0.63 }];
    const parts: ModelPart[] = [box("符合机腹轮廓的底部刚性货盘", [0, 0.04, 0], [1.6, 0.08, 1.55]), box("右侧竖直薄壁", [0.78, 0.845, 0], [0.03, 1.57, 1.5]), box("顶部薄铝蒙板", [-0.21, 1.63, 0], [2.01, 0.03, 1.5]), box("削角侧上半直立蒙板", [-1.2, 1.13, 0], [0.03, 1, 1.5]), surface("顺机腹内壁收回的下侧斜蒙板", transportColors.body, [[-0.78, 0.06, -0.75], [-1.2, 0.63, -0.75], [-1.2, 0.63, 0.75], [-0.78, 0.06, 0.75]], [0, 1, 2, 0, 2, 3]), part("后端完整薄蒙板", "extrude", transportColors.body, [0, 0, 0.75], [1, 1, 1], [0, 0, 0], { profile, depth: 0.025 }), part("前部闭合的柔性织物门帘", "extrude", transportColors.trim, [0, 0, -0.75], [1, 1, 1], [0, 0, 0], { profile, depth: 0.012 })];
    for (let index = 0; index < profile.length; index++) { const a = profile[index]!, b = profile[(index + 1) % profile.length]!; parts.push(strut("前门周缘连续铝合金框", [a.x, a.y, -0.77], [b.x, b.y, -0.77], 0.035)); }
    for (const x of [-0.55, 0, 0.55]) parts.push(box("门帘闭合后的竖向锁紧绑带", [x, 0.84, -0.777], [0.025, 1.5, 0.018], transportColors.dark));
    return parts;
  } },
  { name: "滚筒甲板式航空货盘拖板车", theme: "现代", tags: ["航空货盘拖车", "ULD地面拖板", "机场地服"], create: () => {
    const parts: ModelPart[] = [...axles(2.05, [-0.8, 0.8], 0.2), ...[-1, 1].map(side => box("货盘两侧承载纵梁", [side * 1.07, 0.47, 0], [0.16, 0.15, 2.6])), ...[-1, 1].map(end => box("前后连接横梁", [0, 0.47, end * 1.2], [2.22, 0.15, 0.15])), strut("长向牵引杆", [0, 0.47, -1.3], [0, 0.28, -2.65], 0.09), towingEye([0, 0.28, -2.69]), ...[-1, 1].map(side => box("侧边货盘锁止挡块", [side * 0.98, 0.66, 0.25], [0.15, 0.18, 0.2], transportColors.signal))];
    for (let index = 0; index < 9; index++) parts.push(cylinder("可沿甲板转运货箱的独立横滚筒", [0, 0.57, -1.04 + index * 0.26], [0.1, 2.02, 0.1], transportColors.trim, [0, 0, 90]));
    return parts;
  } },
  { name: "双侧卷帘棚式机场行李拖车", theme: "现代", tags: ["机场散装行李拖车", "棚式行李挂车", "机场地服"], create: () => {
    const parts: ModelPart[] = [box("低平行李装卸底板", [0, 0.55, 0], [1.8, 0.12, 2.6]), ...axles(1.85, [-0.85, 0.85], 0.25), box("保护行李的整幅棚顶", [0, 2.02, 0], [1.9, 0.07, 2.7], transportColors.trim), ...[-1, 1].map(end => box("两端固定防落挡板", [0, 1.25, end * 1.28], [1.8, 1.4, 0.05], transportColors.signal)), strut("车列首尾串接用的前牵引杆", [0, 0.53, -1.3], [0, 0.32, -2.3], 0.08), towingEye([0, 0.32, -2.35]), box("尾部串车拖钩座", [0, 0.5, 1.4], [0.2, 0.15, 0.2])];
    for (const side of [-1, 1]) {
      for (const end of [-1, 1]) parts.push(strut("棚顶四角承重竖柱", [side * 0.87, 0.56, end * 1.25], [side * 0.87, 2.02, end * 1.25], 0.045));
      parts.push(cylinder("收卷在侧檐下的防雨软帘", [side * 0.9, 1.88, 0], [0.18, 2.45, 0.18], transportColors.body, [90, 0, 0]), strut("侧部敞开装卸口的限位带", [side * 0.91, 1.1, -1.25], [side * 0.91, 1.1, 1.25], 0.025, transportColors.dark));
    }
    return parts;
  } },
  { name: "吊挂式航空发动机维修转运架", theme: "现代", tags: ["发动机托架", "航空发动机维修吊架", "机场机库"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].map(side => box("长向低位防扭主梁", [side * 1.08, 0.35, 0], [0.16, 0.2, 3.6])), ...[-1, 1].map(end => box("连接双主梁的端横梁", [0, 0.35, end * 1.7], [2.3, 0.2, 0.16])), ...[-1, 1].map(end => box("跨过发动机悬吊点的上横梁", [0, 2.65, end * 1.15], [2.4, 0.18, 0.2], transportColors.signal))];
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      parts.push(...wheel([side * 1.1, 0.14, end * 1.4], 0.14, 0.09), cylinder("转运脚轮竖向回转接头", [side * 1.1, 0.29, end * 1.4], [0.1, 0.16, 0.1]), strut("四角悬吊框直立支柱", [side * 1.08, 0.4, end * 1.15], [side * 1.08, 2.65, end * 1.15], 0.12, transportColors.signal), strut("立柱底部外伸防侧倾斜撑", [side * 1.08, 0.4, end * 1.7], [side * 1.08, 1.2, end * 1.15], 0.07), strut("向发动机机匣安装点下降的吊杆", [side * 0.48, 2.6, end * 1.15], [side * 0.48, 1.8, end * 1.15], 0.045), ring("吊杆末端真正贯通的连接耳", transportColors.dark, 0.09, 0.045, 0, 0.055, { position: { x: side * 0.48, y: 1.74, z: end * 1.15 }, rotation: { x: 90, y: 0, z: 0 } }));
    }
    parts.push(strut("机架外端推行横把", [-0.75, 1.1, 1.8], [0.75, 1.1, 1.8], 0.04), ...[-1, 1].map(side => strut("推把与后框连接杆", [side * 0.75, 1.1, 1.8], [side * 1.08, 1.1, 1.15], 0.04)));
    return parts;
  } },
];
