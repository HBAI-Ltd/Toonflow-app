import { part, ring, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";

export const concreteToolModels: TransportDefinition[] = [
  { name: "轮式水冷金刚石道路切缝锯", theme: "现代", tags: ["路面切割机", "混凝土切缝锯", "施工机具"], create: () => {
    const arch = Array.from({ length: 9 }, (_, index) => { const angle = index * Math.PI / 8; return { x: Math.cos(angle) * 0.24, y: Math.sin(angle) * 0.24 }; });
    arch.push(...Array.from({ length: 9 }, (_, index) => { const angle = (8 - index) * Math.PI / 8; return { x: Math.cos(angle) * 0.225, y: Math.sin(angle) * 0.225 }; }));
    const parts: ModelPart[] = [box("带四轮安装点的锯架底盘", [0, 0.18, 0], [0.55, 0.14, 0.7]), box("汽油发动机机座与散热罩", [0, 0.4, -0.05], [0.35, 0.33, 0.33], transportColors.signal), box("后部供水储罐", [0, 0.46, 0.28], [0.38, 0.43, 0.3], transportColors.trim), cylinder("储水箱上端旋盖", [0.09, 0.69, 0.28], [0.09, 0.04, 0.09], transportColors.dark), ring("带中心安装孔的薄金刚石锯片", transportColors.trim, 0.22, 0.185, 0, 0.012, { position: { x: 0.36, y: 0.22, z: -0.38 }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("锯片主轴锁紧盘", [0.37, 0.22, -0.38], [0.1, 0.045, 0.1], transportColors.dark, [0, 0, 90]), part("只围住上半圆弧的锯片保护罩", "extrude", transportColors.signal, [0.36, 0.22, -0.38], [1, 1, 1], [0, 90, 0], { profile: arch, depth: 0.12 }), box("右侧电机至锯轴传动皮带罩", [0.24, 0.31, -0.2], [0.08, 0.19, 0.52], transportColors.dark), part("从水箱到锯片罩的冷却水管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.008, path: [{ x: 0.17, y: 0.31, z: 0.25 }, { x: 0.28, y: 0.3, z: 0.08 }, { x: 0.36, y: 0.45, z: -0.38 }] })];
    for (const side of [-1, 1]) {
      for (const z of [-0.2, 0.23]) parts.push(...wheel([side * 0.3, 0.1, z], 0.1, 0.05), strut("机架到车轮的短支臂", [side * 0.22, 0.18, z], [side * 0.3, 0.1, z], 0.03));
      parts.push(strut("后伸操控长把", [side * 0.22, 0.24, 0.25], [side * 0.27, 1.08, 0.78], 0.035));
    }
    parts.push(strut("操控把上端横握杆", [-0.27, 1.08, 0.78], [0.27, 1.08, 0.78], 0.04, transportColors.dark));
    return parts;
  } },
  { name: "三盘行星式硬化地坪研磨机", theme: "现代", tags: ["地坪研磨机", "行星磨盘", "施工机具"], create: () => {
    const parts: ModelPart[] = [part("磨盘上方下端开放的防尘罩", "lathe", transportColors.signal, [0, 0.16, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.31, y: -0.08 }, { x: 0.31, y: 0.04 }, { x: 0.2, y: 0.1 }, { x: 0, y: 0.1 }, { x: 0, y: 0.07 }, { x: 0.18, y: 0.07 }, { x: 0.28, y: 0.01 }, { x: 0.28, y: -0.08 }, { x: 0.31, y: -0.08 }] }), cylinder("竖直主驱动电机", [0, 0.5, 0], [0.3, 0.46, 0.3], transportColors.dark), box("主电机上端接线匣", [0.13, 0.62, 0], [0.12, 0.15, 0.16]), strut("低位机架后延承轮梁", [-0.31, 0.2, 0.34], [0.31, 0.2, 0.34], 0.065), ...[-1, 1].flatMap(side => wheel([side * 0.31, 0.13, 0.34], 0.13, 0.065)), ...[-1, 1].map(side => strut("后倾向操作者的推行长把", [side * 0.22, 0.3, 0.13], [side * 0.27, 1, 0.7], 0.03)), strut("推行把上端握杆", [-0.27, 1, 0.7], [0.27, 1, 0.7], 0.04, transportColors.dark), box("推把中部驱动控制匣", [0, 0.94, 0.65], [0.25, 0.12, 0.1]), part("防尘罩侧面真正贯通的吸尘接管", "lathe", transportColors.dark, [-0.34, 0.22, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0.045, y: -0.1 }, { x: 0.045, y: 0.1 }, { x: 0.034, y: 0.1 }, { x: 0.034, y: -0.1 }, { x: 0.045, y: -0.1 }] })];
    for (let index = 0; index < 3; index++) {
      const angle = index * Math.PI * 2 / 3, x = Math.cos(angle) * 0.16, z = Math.sin(angle) * 0.16;
      parts.push(cylinder("独立偏心回转磨盘承载座", [x, 0.075, z], [0.24, 0.055, 0.24], transportColors.body));
      for (let segment = 0; segment < 3; segment++) { const a = segment * Math.PI * 2 / 3; parts.push(box("磨盘底部真实落地的金刚石磨块", [x + Math.cos(a) * 0.07, 0.025, z + Math.sin(a) * 0.07], [0.07, 0.05, 0.035], transportColors.trim, [0, -segment * 120, 0])); }
    }
    return parts;
  } },
  { name: "中心销与偏心销钢筋弯曲台", theme: "现代", itemType: "设施", tags: ["钢筋弯曲机", "偏心销弯筋台", "施工机具"], create: () => {
    const parts: ModelPart[] = [box("封闭减速传动与电机底柜", [0, 0.43, 0], [0.78, 0.82, 0.66], transportColors.signal), box("承载弯曲工作盘的厚钢台面", [0, 0.86, 0], [0.9, 0.07, 0.76], transportColors.dark), cylinder("嵌入台面的水平旋转工作盘", [0, 0.915, 0], [0.46, 0.04, 0.46], transportColors.body), cylinder("保持弯折半径的固定中心销", [0, 0.975, 0], [0.06, 0.14, 0.06], transportColors.trim), cylinder("随工作盘回转的偏心弯曲销", [0.13, 0.975, 0.08], [0.05, 0.14, 0.05], transportColors.dark), ...[-1, 1].map(side => box("限制长钢筋移动的挡靠座", [-0.28, 0.96, side * 0.1], [0.12, 0.14, 0.09])), part("沿工作销弯折的单根钢筋", "tube", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.012, path: [{ x: -0.46, y: 0.95, z: 0.04 }, { x: -0.12, y: 0.95, z: 0.04 }, { x: 0, y: 0.95, z: 0.04 }, { x: 0.09, y: 0.95, z: 0.16 }, { x: 0.09, y: 0.95, z: 0.34 }] }), box("柜体前侧转盘方向操控盒", [0.2, 0.62, -0.345], [0.22, 0.16, 0.045], transportColors.body)];
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(box("柜体四角隔振支脚", [side * 0.31, 0.03, end * 0.25], [0.1, 0.06, 0.1], transportColors.dark));
    return parts;
  } },
  { name: "偏心连杆往复式钢筋切断机", theme: "现代", itemType: "设施", tags: ["钢筋切断机", "机械剪切钢筋", "施工机具"], create: () => {
    const parts: ModelPart[] = [box("承受剪切反力的厚安装底板", [0.08, 0.08, 0], [0.9, 0.12, 0.55], transportColors.dark), box("偏心减速与往复连杆封闭机箱", [0.13, 0.36, 0.02], [0.35, 0.4, 0.42], transportColors.signal), cylinder("横轴驱动电机", [-0.24, 0.32, 0.05], [0.25, 0.4, 0.25], transportColors.body, [0, 0, 90]), ...[-1, 1].map(end => box("驱动电机落地安装脚", [-0.24, 0.16, 0.05 + end * 0.08], [0.38, 0.08, 0.06])), box("切断头固定承力外颚", [0.49, 0.34, -0.14], [0.09, 0.22, 0.2], transportColors.body), cylinder("从偏心箱水平伸出的往复滑杆", [0.32, 0.36, -0.14], [0.09, 0.14, 0.09], transportColors.trim, [0, 0, 90]), box("与滑杆相连的活动剪切刀", [0.395, 0.36, -0.14], [0.035, 0.14, 0.15], transportColors.dark), box("固定外颚内侧可换硬质刀片", [0.44, 0.36, -0.14], [0.02, 0.14, 0.15], transportColors.dark), cylinder("沿横向送料槽通过的一根钢筋", [0.423, 0.36, -0.14], [0.02, 0.68, 0.02], transportColors.trim, [90, 0, 0]), box("前侧独立启停开关座", [0.14, 0.44, -0.205], [0.1, 0.1, 0.06], transportColors.body)];
    parts.push(box("剪切头与安装底板的连接立座", [0.47, 0.19, -0.14], [0.14, 0.2, 0.24]));
    return parts;
  } },
  { name: "卷丝抱钩式电动钢筋绑扎枪", theme: "现代", itemType: "器物", tags: ["自动钢筋绑扎机", "绑扎枪", "施工机具"], create: () => {
    const hook = [{ x: 0, y: 0.29 }, { x: 0.18, y: 0.29 }, { x: 0.18, y: 0.35 }, { x: 0.06, y: 0.35 }, { x: 0.03, y: 0.41 }, { x: 0.06, y: 0.45 }, { x: 0.18, y: 0.45 }, { x: 0.18, y: 0.5 }, { x: 0, y: 0.5 }, { x: -0.05, y: 0.45 }, { x: -0.05, y: 0.35 }];
    const parts: ModelPart[] = [box("握把上部送丝与绞丝机身", [0, 0.38, 0], [0.15, 0.18, 0.28], transportColors.signal), box("握持操作柄", [0, 0.23, 0.09], [0.07, 0.24, 0.1], transportColors.dark, [-10, 0, 0]), box("握把下端可拆动力电池", [0, 0.09, 0.12], [0.17, 0.14, 0.18], transportColors.body), ...[-1, 1].map(side => part("前端留口的C形绕丝抱钩", "extrude", transportColors.body, [side * 0.04, 0, -0.13], [1, 1, 1], [0, 90, 0], { profile: hook, depth: 0.025 })), cylinder("机身侧面绑丝卷承载轴", [-0.115, 0.39, 0.05], [0.07, 0.13, 0.07], transportColors.dark, [0, 0, 90]), ...[-1, 1].map(side => cylinder("绑丝卷两端挡盘", [-0.115 + side * 0.045, 0.39, 0.05], [0.18, 0.015, 0.18], transportColors.body, [0, 0, 90])), part("卷盘内连续金属绑丝", "tube", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.004, path: Array.from({ length: 25 }, (_, index) => { const angle = index * Math.PI / 4; return { x: -0.15 + index * 0.003, y: 0.39 + Math.cos(angle) * 0.065, z: 0.05 + Math.sin(angle) * 0.065 }; }) }), box("握把前方的送丝触发扳机", [0, 0.3, 0.015], [0.025, 0.08, 0.025], transportColors.body)];
    return parts;
  } },
];
