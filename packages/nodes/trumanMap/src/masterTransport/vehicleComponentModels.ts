import { part, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function discRing(z: number): ModelPart {
  return part("前后分离的制动摩擦环", "lathe", transportColors.body, [0, 0.18, z], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.06, y: -0.004 }, { x: 0.15, y: -0.004 }, { x: 0.15, y: 0.004 }, { x: 0.06, y: 0.004 }, { x: 0.06, y: -0.004 }] });
}
function curvedBrakeShoe(start: number): ModelPart {
  const profile: { x: number; y: number }[] = [];
  for (let index = 0; index <= 10; index++) { const angle = (start + index * 16) * Math.PI / 180; profile.push({ x: Math.cos(angle) * 0.132, y: Math.sin(angle) * 0.132 }); }
  for (let index = 10; index >= 0; index--) { const angle = (start + index * 16) * Math.PI / 180; profile.push({ x: Math.cos(angle) * 0.112, y: Math.sin(angle) * 0.112 }); }
  return part("内张式弧形摩擦制动蹄", "extrude", transportColors.trim, [0, 0.18, 0.01], [1, 1, 1], [0, 0, 0], { profile, depth: 0.018 });
}

export const vehicleComponentModels: TransportDefinition[] = [
  { name: "通风盘式车轮制动组件", theme: "现代", itemType: "构件", tags: ["盘式制动", "浮动卡钳", "通风制动盘"], create: () => {
    const parts: ModelPart[] = [discRing(-0.018), discRing(0.018), part("中部带轴孔的盘毂", "lathe", transportColors.dark, [0, 0.18, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.026, y: -0.035 }, { x: 0.065, y: -0.035 }, { x: 0.065, y: 0.035 }, { x: 0.026, y: 0.035 }, { x: 0.026, y: -0.035 }] }), box("跨过盘外缘的钳桥", [0.18, 0.18, 0], [0.05, 0.16, 0.16], transportColors.signal)];
    for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4; parts.push(box("两个摩擦环之间的通风隔肋", [Math.cos(angle) * 0.105, 0.18 + Math.sin(angle) * 0.105, 0], [0.012, 0.08, 0.028], transportColors.body, [0, 0, index * 45 - 90])); }
    for (let index = 0; index < 5; index++) { const angle = index * Math.PI * 2 / 5; parts.push(cylinder("车轮固定螺柱", [Math.cos(angle) * 0.045, 0.18 + Math.sin(angle) * 0.045, 0.045], [0.012, 0.06, 0.012], transportColors.trim, [90, 0, 0])); }
    for (const side of [-1, 1]) parts.push(box("钳体两侧安装壳", [0.15, 0.18, side * 0.055], [0.11, 0.14, 0.05], transportColors.signal), box("贴近摩擦环的制动片", [0.12, 0.18, side * 0.025], [0.06, 0.11, 0.008], transportColors.dark));
    parts.push(cylinder("钳体液压活塞壳", [0.15, 0.18, 0.09], [0.08, 0.06, 0.08], transportColors.body, [90, 0, 0]));
    return parts;
  } },
  { name: "内张蹄鼓式车轮制动组件", theme: "现代", itemType: "构件", tags: ["鼓式制动", "双制动蹄", "轮缸"], create: () => {
    const parts: ModelPart[] = [part("前侧开放的制动鼓", "lathe", transportColors.dark, [0, 0.18, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -0.035 }, { x: 0.16, y: -0.035 }, { x: 0.16, y: 0.045 }, { x: 0.14, y: 0.045 }, { x: 0.14, y: -0.02 }, { x: 0, y: -0.02 }] }), curvedBrakeShoe(-80), curvedBrakeShoe(100), cylinder("顶部双向液压轮缸", [0, 0.29, 0.01], [0.028, 0.1, 0.028], transportColors.body, [0, 0, 90]), cylinder("底部两蹄间隙调节横杆", [0, 0.065, 0.01], [0.017, 0.1, 0.017], transportColors.body, [0, 0, 90]), ...[-1, 1].map(side => strut("液压轮缸至制动蹄的短推杆", [side * 0.047, 0.285, 0.01], [side * 0.064, 0.285, 0.01], 0.012))];
    const path = Array.from({ length: 37 }, (_, index) => ({ x: -0.09 + index * 0.18 / 36, y: 0.27 + Math.sin(index * Math.PI / 2) * 0.005, z: 0.025 + Math.cos(index * Math.PI / 2) * 0.005 }));
    parts.push(part("连接两蹄的回位拉簧", "tube", transportColors.signal, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.0016, path }));
    return parts;
  } },
  { name: "液冷发动机散热水箱", theme: "现代", itemType: "构件", tags: ["汽车散热器", "冷却水箱", "翅片与风扇"], create: () => {
    const parts: ModelPart[] = [box("上部冷却液集流室", [0, 0.51, 0], [0.65, 0.065, 0.11], transportColors.dark), box("下部回流集流室", [0, 0.05, 0], [0.65, 0.065, 0.11], transportColors.dark), ...[-1, 1].map(side => box("散热芯侧边安装梁", [side * 0.32, 0.28, 0], [0.035, 0.47, 0.1], transportColors.body)), cylinder("上部注液颈口", [-0.16, 0.57, 0], [0.045, 0.08, 0.045]), cylinder("注液旋压盖", [-0.16, 0.62, 0], [0.075, 0.025, 0.075], transportColors.trim), cylinder("上部进液软管接头", [0.25, 0.51, -0.1], [0.045, 0.17, 0.045], transportColors.body, [90, 0, 0]), cylinder("下部回液软管接头", [-0.25, 0.05, 0.1], [0.045, 0.17, 0.045], transportColors.body, [90, 0, 0]), part("后置风扇开放护环", "lathe", transportColors.dark, [0, 0.28, 0.095], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.19, y: -0.02 }, { x: 0.21, y: -0.02 }, { x: 0.21, y: 0.02 }, { x: 0.19, y: 0.02 }, { x: 0.19, y: -0.02 }] }), cylinder("风扇驱动电机", [0, 0.28, 0.13], [0.075, 0.1, 0.075], transportColors.dark, [90, 0, 0])];
    for (let index = 0; index < 20; index++) parts.push(box("贯通上下集流室的散热翅管", [-0.285 + index * 0.03, 0.28, 0], [0.012, 0.4, 0.07], transportColors.body));
    for (const degrees of [0, 120, 240]) { const angle = degrees * Math.PI / 180; parts.push(box("后部冷却扇叶", [Math.sin(angle) * 0.09, 0.28 + Math.cos(angle) * 0.09, 0.13], [0.05, 0.16, 0.015], transportColors.dark, [15, 0, -degrees]), strut("风扇电机至护环安装撑", [0, 0.28, 0.14], [Math.sin(angle) * 0.2, 0.28 + Math.cos(angle) * 0.2, 0.14], 0.015)); }
    for (const side of [-1, 1]) parts.push(strut("风罩至水箱侧梁安装耳", [side * 0.2, 0.28, 0.095], [side * 0.32, 0.28, 0.035], 0.02));
    return parts;
  } },
  { name: "六格铅酸启动蓄电池", theme: "现代", itemType: "器物", tags: ["汽车蓄电池", "启动电瓶", "铅酸电池"], create: () => {
    const parts: ModelPart[] = [box("耐酸槽体", [0, 0.09, 0], [0.26, 0.18, 0.17], transportColors.dark), box("与六格相连的密封上盖", [0, 0.19, 0], [0.27, 0.02, 0.18], transportColors.body)];
    for (const x of [-0.075, 0, 0.075]) for (const z of [-0.035, 0.035]) parts.push(cylinder("独立电池格检查旋塞", [x, 0.208, z], [0.03, 0.016, 0.03], transportColors.dark));
    for (const side of [-1, 1]) parts.push(cylinder("外露正负接线极柱", [side * 0.107, 0.222, -0.06], [0.024, 0.04, 0.024], side < 0 ? transportColors.signal : transportColors.dark), strut("上掀便携提手支臂", [side * 0.085, 0.2, 0], [side * 0.085, 0.28, 0], 0.012));
    parts.push(strut("电池提手横握杆", [-0.085, 0.28, 0], [0.085, 0.28, 0], 0.018, transportColors.dark));
    return parts;
  } },
  { name: "电磁拨叉小齿轮启动机", theme: "现代", itemType: "构件", tags: ["汽车启动机", "电磁开关", "啮合小齿轮"], create: () => {
    const profile: { x: number; y: number }[] = [];
    for (let tooth = 0; tooth < 8; tooth++) for (const [fraction, radius] of [[0, 0.027], [0.2, 0.035], [0.55, 0.035], [0.8, 0.027]]) { const angle = (tooth + fraction!) * Math.PI / 4; profile.push({ x: Math.cos(angle) * radius!, y: Math.sin(angle) * radius! }); }
    return [cylinder("封闭直流启动电机", [0, 0.12, 0], [0.12, 0.24, 0.12], transportColors.dark, [90, 0, 0]), part("收分铸造传动鼻壳", "lathe", transportColors.body, [0, 0.12, 0.16], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.065, y: -0.06 }, { x: 0.065, y: -0.02 }, { x: 0.035, y: 0.06 }, { x: 0.025, y: 0.06 }, { x: 0.025, y: -0.06 }, { x: 0.065, y: -0.06 }] }), cylinder("平行布置的电磁拨叉执行筒", [0.065, 0.21, -0.015], [0.065, 0.13, 0.065], transportColors.signal, [90, 0, 0]), box("电磁执行筒安装支架", [0.045, 0.175, 0], [0.06, 0.055, 0.09]), cylinder("启动小齿轮输出轴", [0, 0.12, 0.21], [0.025, 0.16, 0.025], transportColors.dark, [90, 0, 0]), part("真实外齿的啮合小齿轮", "extrude", transportColors.body, [0, 0.12, 0.25], [1, 1, 1], [0, 0, 0], { profile, depth: 0.025 }), ...[-1, 1].map(side => box("法兰侧向安装耳", [side * 0.065, 0.115, 0.12], [0.04, 0.045, 0.04], transportColors.body)), ...[-1, 1].map(side => cylinder("电磁执行筒接线柱", [0.065 + side * 0.018, 0.21, -0.095], [0.012, 0.035, 0.012], transportColors.trim, [90, 0, 0]))];
  } },
];
