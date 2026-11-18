import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, helicalFlight, strut, transportColors, type TransportDefinition } from "./parts";

function pinMount(position: Triple, width: number): ModelPart[] {
  const [x, y, z] = position, parts: ModelPart[] = [];
  for (const end of [-1, 1]) {
    parts.push(cylinder("横向安装承载销", [x, y, z + end * 0.18], [0.075, width + 0.12, 0.075], transportColors.dark, [0, 0, 90]));
    for (const side of [-1, 1]) parts.push(ring("真正贯通销孔的安装耳", transportColors.body, 0.095, 0.052, 0, 0.065, { position: { x: x + side * width / 2, y, z: z + end * 0.18 }, rotation: { x: 0, y: 0, z: 90 } }), box("耳环下部承力短肋", [x + side * width / 2, y - 0.14, z + end * 0.18], [0.065, 0.17, 0.12], transportColors.body));
  }
  return parts;
}

// https://www.cat.com/en_US/articles/for-owners/cat-attachments-to-use-for-general-construction-work.html
// 各项是独立完整属具，安装接口可复用；并非将同台挖掘机换附件计为多个主素材。
export const excavatorAttachmentModels: TransportDefinition[] = [
  { name: "齿刃弧背通用挖掘铲斗", theme: "现代", itemType: "构件", tags: ["挖掘机铲斗", "敞口挖斗", "工程属具"], create: () => {
    const shell = [{ x: -0.45, y: 1.2 }, { x: -0.52, y: 0.45 }, { x: -0.35, y: 0.06 }, { x: 0.75, y: 0.04 }, { x: 0.88, y: 0.18 }, { x: -0.24, y: 0.22 }, { x: -0.36, y: 0.49 }, { x: -0.29, y: 1.2 }];
    const cheek = [{ x: -0.45, y: 1.2 }, { x: -0.52, y: 0.45 }, { x: -0.35, y: 0.06 }, { x: 0.75, y: 0.04 }, { x: 0.88, y: 0.18 }, { x: 0.3, y: 0.55 }, { x: -0.05, y: 1.17 }];
    return [part("保留完整内腔的弧背与斗底壳", "extrude", transportColors.signal, [0, 0, 0], [1, 1, 1], [0, 90, 0], { profile: shell, depth: 1.4 }), ...[-1, 1].map(side => part("弧形高侧壁", "extrude", transportColors.signal, [side * 0.71, 0, 0], [1, 1, 1], [0, 90, 0], { profile: cheek, depth: 0.055 })), box("斗背顶部承重横梁", [0, 1.16, 0.21], [1.3, 0.16, 0.3]), ...pinMount([0, 1.43, 0.18], 0.5), ...[-0.54, -0.27, 0, 0.27, 0.54].map(x => part("前缘独立可换楔形斗齿", "extrude", transportColors.trim, [x, 0, -0.81], [1, 1, 1], [0, 90, 0], { profile: [{ x: -0.06, y: 0.07 }, { x: 0.3, y: 0.1 }, { x: 0.3, y: 0.14 }, { x: -0.06, y: 0.24 }], depth: 0.12 }))];
  } },
  { name: "氮气蓄能液压破碎锤属具", theme: "现代", itemType: "构件", tags: ["挖掘机破碎锤", "钎杆", "工程属具"], create: () => {
    return [box("消声外壳与长向缸体", [0, 0.92, 0], [0.42, 1.25, 0.46], transportColors.signal), cylinder("氮气蓄能上部圆顶", [0, 1.54, 0], [0.3, 0.22, 0.3]), box("钎杆导向耐磨前套", [0, 0.29, 0], [0.32, 0.26, 0.36]), cylinder("长向承冲击实心钎杆", [0, -0.03, 0], [0.12, 0.48, 0.12], transportColors.trim), part("钎杆四面收尖工作头", "mesh", transportColors.trim, [0, -0.27, 0], [1, 1, 1], [0, 0, 0], { vertices: [{ x: -0.06, y: 0, z: -0.06 }, { x: 0.06, y: 0, z: -0.06 }, { x: 0.06, y: 0, z: 0.06 }, { x: -0.06, y: 0, z: 0.06 }, { x: 0, y: -0.22, z: 0 }], indices: [0, 2, 1, 0, 3, 2, 0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4] }), ...pinMount([0, 1.85, 0], 0.32), box("安装耳下部共同座板", [0, 1.65, 0], [0.45, 0.08, 0.6]), ...[-1, 1].map(side => cylinder("缸体两侧进回油接头", [side * 0.25, 1.32, 0], [0.06, 0.15, 0.06], transportColors.dark, [0, 0, 90])), ...[-1, 1].flatMap(side => [-1, 1].map(end => cylinder("贯通外壳的四根紧固拉杆", [side * 0.17, 0.93, end * 0.19], [0.024, 1.28, 0.024], transportColors.dark)))];
  } },
  { name: "双缸倾斜回转挖掘属具连接器", theme: "现代", itemType: "构件", tags: ["倾转器", "tiltrotator", "回转快换接口"], create: () => {
    const parts = [box("上部斗杆安装顶座", [0, 0.95, 0], [0.65, 0.13, 0.6]), ...pinMount([0, 1.21, 0], 0.42), cylinder("连接顶座的纵向倾斜铰轴", [0, 0.78, 0], [0.13, 0.7, 0.13], transportColors.dark, [90, 0, 0]), box("可绕纵轴倾斜的中间框体", [0, 0.62, 0], [0.58, 0.25, 0.54], transportColors.signal), ring("下部真正中空的回转支承", transportColors.dark, 0.32, 0.1, 0.4, 0.16), box("下部快换承托底架", [0, 0.22, 0], [0.58, 0.18, 0.65]), cylinder("侧面回转驱动马达", [0.32, 0.42, 0], [0.2, 0.32, 0.2], transportColors.signal)];
    for (const side of [-1, 1]) parts.push(strut("两侧相对控制的倾斜液压缸", [side * 0.31, 0.98, 0.16], [side * 0.25, 0.57, -0.16], 0.1), box("快换接口下部承载钩", [side * 0.22, 0.1, -0.24], [0.12, 0.2, 0.14], transportColors.dark), cylinder("横向锁紧销", [side * 0.23, 0.17, 0.22], [0.07, 0.15, 0.07], transportColors.trim, [0, 0, 90]));
    return parts;
  } },
  { name: "双销液压锁紧快换接头", theme: "现代", itemType: "构件", tags: ["挖掘机快换", "双销连接器", "工程属具"], create: () => {
    const parts: ModelPart[] = [box("保持两侧开口的上部连接桥", [0, 0.39, 0], [0.58, 0.12, 0.65]), ...pinMount([0, 0.65, 0], 0.4), cylinder("中央弹簧复位液压锁缸", [0, 0.25, 0.04], [0.13, 0.38, 0.13], transportColors.signal, [90, 0, 0]), cylinder("向后推动的快换楔销", [0, 0.25, 0.25], [0.075, 0.2, 0.075], transportColors.trim, [90, 0, 0])];
    const profile = [{ x: -0.33, y: 0.42 }, { x: 0.32, y: 0.42 }, { x: 0.32, y: 0.08 }, { x: 0.14, y: 0.08 }, { x: 0.14, y: 0.18 }, { x: -0.19, y: 0.18 }, { x: -0.19, y: 0.04 }, { x: -0.33, y: 0.04 }];
    for (const side of [-1, 1]) parts.push(part("具备向下开放挂销槽的侧钩板", "extrude", transportColors.dark, [side * 0.26, 0, 0], [1, 1, 1], [0, 90, 0], { profile, depth: 0.06 }));
    return parts;
  } },
  { name: "液压驱动螺旋钻孔属具", theme: "现代", itemType: "构件", tags: ["挖掘机螺旋钻", "独立钻孔属具", "工程属具"], create: () => {
    return [cylinder("低转速大扭矩液压减速头", [0, 2.1, 0], [0.38, 0.46, 0.38], transportColors.signal), cylinder("悬吊架横向万向销", [0, 2.43, 0], [0.09, 0.6, 0.09], transportColors.dark, [0, 0, 90]), ...[-1, 1].map(side => strut("U形悬吊安装耳架", [side * 0.25, 2.4, 0], [side * 0.2, 2.8, 0], 0.07)), strut("悬吊耳上部共同横梁", [-0.2, 2.8, 0], [0.2, 2.8, 0], 0.08), cylinder("承载螺旋叶的中心钻杆", [0, 1.1, 0], [0.13, 1.6, 0.13]), helicalFlight([0, 0.3, 0], 0.065, 0.27, 1.55, 4, 1, 0.025), part("导向入土尖", "cone", transportColors.trim, [0, 0.15, 0], [0.17, 0.3, 0.17], [180, 0, 0]), ...[-1, 1].map(side => box("底部可换切土刀", [side * 0.17, 0.3, 0], [0.22, 0.035, 0.12], transportColors.trim, [0, 0, side * 12])), ...[-1, 1].map(side => cylinder("顶部进回油快速接口", [side * 0.1, 2.34, 0.12], [0.04, 0.1, 0.04], transportColors.dark))];
  } },
  { name: "开底齿鼓林地粉碎铣头", theme: "现代", itemType: "构件", tags: ["林业粉碎头", "鼓式mulcher", "独立工程属具"], create: () => {
    const parts: ModelPart[] = [cylinder("横向高速粉碎齿鼓", [0, 0.38, 0], [0.52, 1.65, 0.52], transportColors.dark, [0, 0, 90]), ...[-1, 1].map(side => box("齿鼓两侧落地耐磨滑靴", [side * 0.94, 0.18, 0], [0.1, 0.16, 0.95], transportColors.body)), ...[-1, 1].map(side => box("支承转鼓轴的端部侧板", [side * 0.88, 0.49, 0], [0.09, 0.55, 0.75], transportColors.signal)), box("转鼓上部承重安装梁", [0, 0.83, 0.08], [1.8, 0.2, 0.35]), ...pinMount([0, 1.08, 0.08], 0.45), cylinder("外置液压驱动马达", [1.03, 0.4, 0], [0.3, 0.25, 0.3], transportColors.signal, [0, 0, 90])];
    const hood = [{ x: -0.4, y: 0.38 }, { x: -0.4, y: 0.75 }, { x: 0.22, y: 0.8 }, { x: 0.43, y: 0.55 }, { x: 0.39, y: 0.51 }, { x: 0.19, y: 0.73 }, { x: -0.33, y: 0.69 }, { x: -0.33, y: 0.38 }];
    parts.push(part("保留下方切削开口的弧形飞屑罩", "extrude", transportColors.signal, [0, 0, 0], [1, 1, 1], [0, 90, 0], { profile: hood, depth: 1.7 }));
    for (let index = 0; index < 16; index++) { const angle = index % 4 * Math.PI / 2, x = -0.68 + Math.floor(index / 4) * 0.45; parts.push(box("沿鼓面交错布置的独立粉碎齿", [x, 0.38 + Math.cos(angle) * 0.28, Math.sin(angle) * 0.28], [0.12, 0.11, 0.1], transportColors.trim, [index % 4 * 90, 0, 0])); }
    return parts;
  } },
  { name: "多齿液压混凝土粉碎钳", theme: "现代", itemType: "构件", tags: ["挖掘机粉碎钳", "混凝土拆除属具", "工程属具"], create: () => {
    const fixed = [{ x: -0.24, y: 0.9 }, { x: -0.3, y: 0.35 }, { x: 0.08, y: 0.12 }, { x: 0.58, y: 0.16 }, { x: 0.62, y: 0.28 }, { x: 0.05, y: 0.4 }, { x: -0.02, y: 0.84 }];
    const moving = [{ x: -0.14, y: 0.52 }, { x: 0.03, y: 0.35 }, { x: 0.49, y: 0.5 }, { x: 0.67, y: 0.67 }, { x: 0.58, y: 0.74 }, { x: 0.13, y: 0.6 }];
    return [part("固定下颚贯通承力主梁", "extrude", transportColors.signal, [0, 0, 0], [1, 1, 1], [0, 90, 0], { profile: fixed, depth: 0.45 }), part("张开且与下颚保持破碎间隙的上颚", "extrude", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 90, 0], { profile: moving, depth: 0.32 }), cylinder("破碎钳承力铰接横轴", [0, 0.5, 0.1], [0.15, 0.58, 0.15], transportColors.dark, [0, 0, 90]), strut("驱动上颚合拢的液压缸", [0, 0.92, 0.15], [0, 0.61, -0.21], 0.15), box("机臂连接承托顶座", [0, 1, 0.12], [0.49, 0.15, 0.6]), ...pinMount([0, 1.27, 0.12], 0.34), ...[0.1, 0.27, 0.44].flatMap(z => [box("下颚向上咬合的可换破碎齿", [0, 0.36, -z], [0.28, 0.16, 0.1], transportColors.trim), box("上颚向下咬合的可换破碎齿", [0, 0.48 + z * 0.28, -z - 0.05], [0.23, 0.12, 0.08], transportColors.trim)])];
  } },
];
