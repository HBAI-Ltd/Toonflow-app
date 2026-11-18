import { part, ring, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";

export const landscapePowerModels: TransportDefinition[] = [
  { name: "前环握把式汽油链锯", theme: "现代", itemType: "器物", tags: ["油锯", "动力链锯", "园林动力工具"], create: () => {
    const outline = [{ x: -0.04, y: -0.075 }, { x: 0.79, y: -0.075 }, { x: 0.84, y: -0.055 }, { x: 0.87, y: -0.02 }, { x: 0.87, y: 0.02 }, { x: 0.84, y: 0.055 }, { x: 0.79, y: 0.075 }, { x: -0.04, y: 0.075 }];
    const chain = [...outline, outline[0]!].map(point => ({ x: 0, y: 0.24 + point.y * 1.1, z: -0.2 - point.x * 1.01 }));
    const parts: ModelPart[] = [box("发动机与链轮封闭机体", [0, 0.24, 0.04], [0.28, 0.4, 0.42], transportColors.signal), box("机体底部平放支脚", [0, 0.025, 0.05], [0.3, 0.05, 0.4], transportColors.dark), part("圆弧端头的扁平金属导板", "extrude", transportColors.trim, [0, 0.24, -0.2], [1, 1, 1], [0, 90, 0], { profile: outline, depth: 0.025 }), part("沿整圈导板连续闭合的传动链", "tube", transportColors.dark, [0, 0, 0], [1.6, 1, 1], [0, 0, 0], { radius: 0.009, path: chain }), part("跨机身前部的完整环形握把", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.018, path: [{ x: -0.12, y: 0.1, z: -0.13 }, { x: -0.21, y: 0.24, z: -0.13 }, { x: -0.18, y: 0.55, z: -0.13 }, { x: 0.18, y: 0.55, z: -0.13 }, { x: 0.21, y: 0.24, z: -0.13 }, { x: 0.12, y: 0.1, z: -0.13 }] }), part("后握把与油门手指护圈", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.023, path: [{ x: 0, y: 0.42, z: 0.2 }, { x: 0, y: 0.43, z: 0.48 }, { x: 0, y: 0.23, z: 0.52 }, { x: 0, y: 0.15, z: 0.22 }] }), cylinder("上置燃油旋盖", [0.075, 0.455, 0.12], [0.075, 0.03, 0.075], transportColors.dark), box("前手护挡与链刹拨片", [0, 0.43, -0.245], [0.28, 0.18, 0.025], transportColors.dark, [-15, 0, 0])];
    for (let index = 0; index < 11; index++) parts.push(box("链条上缘独立切削齿", [0, 0.333, -0.29 - index * 0.067], [0.038, 0.022, 0.025], transportColors.body, [0, 0, index % 2 ? 12 : -12]));
    return parts;
  } },
  { name: "双侧齿刃电动绿篱修剪机", theme: "现代", itemType: "器物", tags: ["动力绿篱机", "双刃绿篱剪", "园林动力工具"], create: () => {
    const parts: ModelPart[] = [box("电机减速与主握把机身", [0, 0.18, 0.04], [0.21, 0.3, 0.34], transportColors.signal), box("可拆卸后置电池座", [0, 0.17, 0.32], [0.23, 0.21, 0.22], transportColors.dark), box("前方防枝叶护手板", [0, 0.25, -0.17], [0.3, 0.22, 0.025], transportColors.dark), box("细长往复剪切刀梁", [0, 0.12, -0.56], [0.07, 0.025, 0.78], transportColors.body), part("前部D形辅助握柄", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.016, path: [{ x: -0.09, y: 0.19, z: -0.07 }, { x: -0.15, y: 0.42, z: -0.07 }, { x: 0.15, y: 0.42, z: -0.07 }, { x: 0.09, y: 0.19, z: -0.07 }] }), part("后部手指可穿入的操作握柄", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.018, path: [{ x: 0, y: 0.3, z: 0.13 }, { x: 0, y: 0.42, z: 0.31 }, { x: 0, y: 0.35, z: 0.48 }, { x: 0, y: 0.23, z: 0.39 }] })];
    for (let index = 0; index < 10; index++) for (const side of [-1, 1]) parts.push(part("两侧保持真实间隔的三角剪切齿", "extrude", transportColors.trim, [0, 0.12, -0.24 - index * 0.07], [1, 1, 1], [90, 0, 0], { depth: 0.018, profile: [{ x: side * 0.02, y: -0.025 }, { x: side * 0.105, y: -0.01 }, { x: side * 0.1, y: 0.01 }, { x: side * 0.02, y: 0.025 }] }));
    return parts;
  } },
  { name: "背负离心风机式吹叶机", theme: "现代", itemType: "器物", tags: ["背包吹风机", "园林吹叶机", "园林动力工具"], create: () => {
    const parts: ModelPart[] = [box("贴背的竖直承重背板", [0, 0.46, 0], [0.42, 0.76, 0.08], transportColors.dark), box("背架落地横脚", [0, 0.035, 0.14], [0.49, 0.07, 0.36], transportColors.dark), cylinder("背架外侧离心风机蜗壳", [0, 0.46, 0.23], [0.48, 0.28, 0.48], transportColors.signal, [90, 0, 0]), cylinder("独立小型内燃动力头", [0, 0.47, 0.43], [0.27, 0.24, 0.27], transportColors.dark, [90, 0, 0]), box("风机下侧燃油储罐", [0, 0.18, 0.29], [0.36, 0.2, 0.25], transportColors.trim), part("从蜗壳侧面引向手持管的柔性风管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.055, path: [{ x: 0.2, y: 0.37, z: 0.21 }, { x: 0.41, y: 0.26, z: 0.1 }, { x: 0.55, y: 0.16, z: -0.25 }, { x: 0.55, y: 0.15, z: -0.8 }] }), part("前端真正贯通的收分吹叶嘴", "lathe", transportColors.dark, [0.55, 0.15, -1.02], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.035, y: -0.24 }, { x: 0.058, y: 0.24 }, { x: 0.049, y: 0.24 }, { x: 0.027, y: -0.24 }, { x: 0.035, y: -0.24 }] }), box("管上油门握把", [0.55, 0.26, -0.48], [0.06, 0.2, 0.13], transportColors.body)];
    for (const side of [-1, 1]) parts.push(part("可穿戴的两侧连续软肩带", "tube", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.025, path: [{ x: side * 0.13, y: 0.8, z: -0.04 }, { x: side * 0.2, y: 0.68, z: -0.22 }, { x: side * 0.18, y: 0.28, z: -0.24 }, { x: side * 0.14, y: 0.15, z: -0.04 }] }));
    return parts;
  } },
  { name: "双把硬轴三齿刀汽油割灌机", theme: "现代", itemType: "器物", tags: ["汽油打草机", "硬轴割灌机", "园林动力工具"], create: () => {
    const parts: ModelPart[] = [box("后置汽油动力头", [0, 0.2, 0.92], [0.24, 0.3, 0.3], transportColors.signal), box("下置燃油箱", [0, 0.06, 0.92], [0.23, 0.12, 0.28], transportColors.trim), cylinder("连接前后齿轮箱的长硬传动轴套管", [0, 0.18, -0.02], [0.038, 1.64, 0.038], transportColors.body, [90, 0, 0]), cylinder("前端伞齿传动头", [0, 0.15, -0.89], [0.105, 0.14, 0.105], transportColors.dark), cylinder("三齿刀片中心压紧盘", [0, 0.07, -0.89], [0.085, 0.03, 0.085], transportColors.trim), part("三向伸出的单片金属割灌刀", "extrude", transportColors.dark, [0, 0.07, -0.89], [1, 1, 1], [90, 0, 0], { depth: 0.008, profile: [{ x: -0.025, y: -0.04 }, { x: -0.045, y: -0.21 }, { x: 0.045, y: -0.21 }, { x: 0.025, y: -0.04 }, { x: 0.2, y: 0.065 }, { x: 0.16, y: 0.14 }, { x: 0, y: 0.04 }, { x: -0.16, y: 0.14 }, { x: -0.2, y: 0.065 }] }), part("位于刀后侧的半圆防飞屑护罩", "extrude", transportColors.signal, [0, 0.13, -0.9], [1, 1, 1], [90, 0, 0], { depth: 0.035, profile: [{ x: -0.27, y: 0 }, { x: -0.24, y: -0.14 }, { x: -0.13, y: -0.24 }, { x: 0.13, y: -0.24 }, { x: 0.24, y: -0.14 }, { x: 0.27, y: 0 }] }), ring("长轴上的背带承重挂环", transportColors.dark, 0.045, 0.018, 0, 0.02, { position: { x: 0, y: 0.22, z: 0.26 }, rotation: { x: 90, y: 0, z: 0 } })];
    for (const side of [-1, 1]) parts.push(strut("左右向外扬起的双手操纵把", [0, 0.18, 0.2], [side * 0.3, 0.4, 0.16], 0.025), box("手把末端橡胶握套", [side * 0.3, 0.43, 0.16], [0.035, 0.16, 0.045], transportColors.dark));
    return parts;
  } },
  { name: "后集草袋手推旋刀草坪机", theme: "现代", tags: ["手推割草机", "旋刀草坪机", "园林机械"], create: () => {
    const parts: ModelPart[] = [part("下侧开放的旋刀圆形防护甲板", "lathe", transportColors.signal, [0, 0.17, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.28, y: -0.05 }, { x: 0.28, y: 0.02 }, { x: 0.2, y: 0.08 }, { x: 0, y: 0.08 }, { x: 0, y: 0.045 }, { x: 0.18, y: 0.045 }, { x: 0.25, y: 0 }, { x: 0.25, y: -0.05 }, { x: 0.28, y: -0.05 }] }), box("甲板上方的小型发动机罩", [0, 0.35, 0], [0.3, 0.25, 0.29], transportColors.dark), cylinder("竖轴直接驱动的下部刀盘轴", [0, 0.16, 0], [0.055, 0.16, 0.055]), box("隐藏在甲板下面的水平旋转刀片", [0, 0.13, 0], [0.46, 0.015, 0.05], transportColors.trim), box("后方集草织物袋", [0, 0.31, 0.43], [0.43, 0.34, 0.41], transportColors.body), box("甲板到集草袋的出草连接颈", [0, 0.26, 0.22], [0.25, 0.15, 0.2], transportColors.dark)];
    for (const side of [-1, 1]) {
      for (const z of [-0.2, 0.2]) parts.push(...wheel([side * 0.31, 0.09, z], 0.09, 0.05), strut("轮轴到甲板的调高支臂", [side * 0.31, 0.09, z], [side * 0.2, 0.19, z], 0.025));
      parts.push(strut("沿集草袋外侧后伸的推把", [side * 0.24, 0.19, 0.2], [side * 0.27, 1.02, 0.86], 0.025));
    }
    parts.push(strut("推把末端横握杆", [-0.27, 1.02, 0.86], [0.27, 1.02, 0.86], 0.035, transportColors.dark), strut("松手即松开的控制压杆", [-0.23, 1.04, 0.81], [0.23, 1.04, 0.81], 0.012));
    return parts;
  } },
  { name: "滚筒空心取芯草坪打孔机", theme: "现代", tags: ["草坪取芯打孔机", "空心齿通气机", "园林机械"], create: () => {
    const parts: ModelPart[] = [box("两侧轮架之间的承载顶板", [0, 0.43, 0], [0.6, 0.1, 0.6]), cylinder("带径向空心齿的横置承载滚筒", [0, 0.22, 0], [0.28, 0.48, 0.28], transportColors.dark, [0, 0, 90]), box("上置驱动发动机", [0, 0.62, 0.03], [0.36, 0.28, 0.34], transportColors.signal), box("侧面齿轮传动保护匣", [0.31, 0.37, 0], [0.09, 0.36, 0.34], transportColors.dark)];
    for (const x of [-0.16, 0, 0.16]) for (const degrees of [0, 90, 180, 270]) { const angle = degrees * Math.PI / 180; parts.push(ring("可排出草坪土芯的真实贯通空心齿", transportColors.trim, 0.02, 0.006, 0, 0.08, { position: { x, y: 0.22 + Math.cos(angle) * 0.18, z: Math.sin(angle) * 0.18 }, rotation: { x: degrees, y: 0, z: 0 } })); }
    for (const side of [-1, 1]) {
      for (const end of [-1, 1]) parts.push(...wheel([side * 0.34, 0.1, end * 0.29], 0.1, 0.05), strut("前后滚轮与机架的安装短臂", [side * 0.34, 0.1, end * 0.29], [side * 0.25, 0.41, end * 0.24], 0.025));
      parts.push(strut("后伸长推行把", [side * 0.25, 0.44, 0.25], [side * 0.3, 1.05, 0.85], 0.03));
    }
    parts.push(strut("推行长把末端横杆", [-0.3, 1.05, 0.85], [0.3, 1.05, 0.85], 0.04, transportColors.dark));
    return parts;
  } },
];
