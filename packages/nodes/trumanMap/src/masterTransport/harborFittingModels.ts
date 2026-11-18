import { part, type ModelPart } from "../assetModelParts";
import { ball, box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

export const harborFittingModels: TransportDefinition[] = [
  { name: "无杆转爪双翼船锚", itemType: "构件", tags: ["船锚", "转爪锚", "锚泊"], create: () => {
    const parts: ModelPart[] = [box("锚冠下承力连接体", [0, 0.2, 0], [0.6, 0.2, 0.3], transportColors.dark), cylinder("两锚爪共同回转横轴", [0, 0.4, 0], [0.15, 1.1, 0.15], transportColors.dark, [0, 0, 90]), box("长条受拉锚杆", [0, 1.41, 0], [0.13, 2.03, 0.17]), part("锚链闭合连接耳", "torus", transportColors.dark, [0, 2.55, 0], [0.25, 0.29, 0.07])];
    for (const side of [-1, 1]) parts.push(surface("有厚度的外张掘底锚爪", transportColors.body, [[side * 0.14, 0.35, 0], [side * 0.92, 0.38, 0.12], [side * 0.65, 1.4, 0.72], [side * 0.35, 0.82, 0.38]], [0, 1, 2, 0, 2, 3]), strut("锚爪背面加强筋", [side * 0.25, 0.4, 0.01], [side * 0.65, 1.25, 0.6], 0.075));
    return parts;
  } },
  { name: "四滚轮矩形导缆器", itemType: "构件", tags: ["导缆器", "滚轮导缆", "船舶索具"], create: () => {
    const parts: ModelPart[] = [box("导缆器安装底板", [0, 0.06, 0], [1.2, 0.12, 0.55], transportColors.dark)];
    for (const side of [-1, 1]) parts.push(box("框架外侧承力板", [side * 0.55, 0.35, 0], [0.1, 0.55, 0.35]), cylinder("竖向导缆滚轮", [side * 0.44, 0.335, 0], [0.16, 0.41, 0.16], transportColors.trim));
    for (const y of [0.13, 0.54]) parts.push(cylinder("横向导缆滚轮", [0, y, 0], [0.14, 0.8, 0.14], transportColors.trim, [0, 0, 90]));
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(cylinder("甲板安装紧固头", [side * 0.48, 0.135, end * 0.21], [0.055, 0.03, 0.055], transportColors.body));
    return parts;
  } },
  { name: "双面船用机令车钟", itemType: "器物", tags: ["船用车钟", "机令传递", "驾驶台"], create: () => {
    const parts: ModelPart[] = [cylinder("车钟圆形固定脚", [0, 0.06, 0], [0.42, 0.12, 0.42], transportColors.dark), cylinder("立式机令传动柱", [0, 0.5, 0], [0.14, 0.76, 0.14], transportColors.body), cylinder("双面圆形机令壳", [0, 1.05, 0], [0.52, 0.24, 0.52], transportColors.body, [90, 0, 0]), ...[-1, 1].map(side => cylinder("机令白色刻度盘", [0, 1.05, side * 0.132], [0.45, 0.018, 0.45], transportColors.trim, [90, 0, 0])), strut("定位机令操纵杆", [0, 1.05, -0.17], [0.25, 1.3, -0.17], 0.025), ball("操纵杆横握柄", [0.25, 1.3, -0.17], [0.08, 0.08, 0.18], transportColors.dark), cylinder("前后机令共同转轴", [0, 1.05, 0], [0.06, 0.38, 0.06], transportColors.dark, [90, 0, 0])];
    for (let index = 0; index < 9; index++) {
      const angle = (-140 + index * 35) * Math.PI / 180;
      for (const side of [-1, 1]) parts.push(strut("放射式机令档位刻线", [Math.sin(angle) * 0.16, 1.05 + Math.cos(angle) * 0.16, side * 0.148], [Math.sin(angle) * 0.205, 1.05 + Math.cos(angle) * 0.205, side * 0.148], 0.009, transportColors.dark));
    }
    return parts;
  } },
  { name: "带抓握绳泡沫救生圈", itemType: "器物", tags: ["救生圈", "水上救生", "抓握绳"], create: () => {
    const parts: ModelPart[] = [part("闭合浮力救生圈体", "torus", transportColors.signal, [0, 0.48, 0], [0.8, 0.8, 0.7]), part("圈外连续抓握软绳", "tube", transportColors.trim, [0, 0.48, 0], [1, 1, 1], [0, 0, 0], { radius: 0.008, path: Array.from({ length: 17 }, (_, index) => ({ x: Math.sin(index * Math.PI / 8) * 0.46, y: Math.cos(index * Math.PI / 8) * 0.46, z: 0 })) })];
    for (let index = 0; index < 4; index++) { const angle = index * Math.PI / 2; parts.push(strut("固定抓握绳的穿圈束带", [Math.sin(angle) * 0.32, 0.48 + Math.cos(angle) * 0.32, 0], [Math.sin(angle) * 0.46, 0.48 + Math.cos(angle) * 0.46, 0], 0.018, transportColors.trim)); }
    return parts;
  } },
  { name: "双索防扭引航员软梯", itemType: "器物", tags: ["引航梯", "绳梯", "防扭横撑"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].map(side => cylinder("贯穿各踏板的侧承重绳", [side * 0.24, 1.55, 0], [0.028, 3.1, 0.028], transportColors.trim))];
    for (let index = 0; index < 10; index++) parts.push(box(index === 3 || index === 7 ? "防扭长横撑踏板" : "横向防滑木踏板", [0, 0.12 + index * 0.3, 0], [index === 3 || index === 7 ? 1.3 : 0.6, 0.035, 0.15], transportColors.wood));
    return parts;
  } },
  { name: "旋压扣密封圆形舷窗", itemType: "构件", tags: ["舷窗", "圆窗", "旋压密封"], create: () => {
    const glass = cylinder("圆形透明观察玻璃", [0, 0.43, -0.02], [0.52, 0.012, 0.52], transportColors.glass, [90, 0, 0]);
    glass.opacity = 0.32;
    const parts: ModelPart[] = [part("贯通式圆形舷窗法兰", "lathe", transportColors.body, [0, 0.43, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.26, y: -0.045 }, { x: 0.36, y: -0.045 }, { x: 0.36, y: 0.045 }, { x: 0.29, y: 0.045 }, { x: 0.26, y: 0.01 }, { x: 0.26, y: -0.045 }] }), glass, box("侧向双耳铰链座", [-0.38, 0.43, 0], [0.1, 0.2, 0.1]), cylinder("铰链竖销", [-0.38, 0.43, 0], [0.035, 0.26, 0.035], transportColors.dark)];
    for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4; parts.push(cylinder("外围安装螺栓", [Math.sin(angle) * 0.32, 0.43 + Math.cos(angle) * 0.32, -0.06], [0.035, 0.03, 0.035], transportColors.dark, [90, 0, 0])); }
    for (const degrees of [-60, 60, 180]) { const angle = degrees * Math.PI / 180; parts.push(cylinder("密封压扣转轴", [Math.sin(angle) * 0.37, 0.43 + Math.cos(angle) * 0.37, -0.07], [0.06, 0.07, 0.06], transportColors.dark, [90, 0, 0]), strut("向内旋压的扣臂", [Math.sin(angle) * 0.37, 0.43 + Math.cos(angle) * 0.37, -0.11], [Math.sin(angle) * 0.285, 0.43 + Math.cos(angle) * 0.285, -0.11], 0.035, transportColors.trim)); }
    return parts;
  } },
  { name: "拱形橡胶码头护舷", itemType: "构件", tags: ["护舷", "码头防撞", "橡胶拱"], create: () => {
    const parts: ModelPart[] = [part("底部开放的弹性橡胶拱体", "extrude", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 1.4, profile: [{ x: -0.5, y: 0 }, { x: -0.5, y: 0.08 }, { x: -0.17, y: 0.5 }, { x: 0.17, y: 0.5 }, { x: 0.5, y: 0.08 }, { x: 0.5, y: 0 }, { x: 0.12, y: 0.38 }, { x: -0.12, y: 0.38 }] }), ...[-1, 1].map(side => box("橡胶拱侧边安装脚", [side * 0.5, 0.045, 0], [0.25, 0.09, 1.4], transportColors.dark)), box("拱顶耐磨受压面板", [0, 0.54, 0], [0.34, 0.08, 1.4], transportColors.body)];
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(cylinder("固定脚穿透螺栓头", [side * 0.52, 0.115, end * 0.5], [0.065, 0.05, 0.065], transportColors.trim));
    return parts;
  } },
  { name: "蘑菇帽船用通风筒", itemType: "构件", tags: ["船用通风", "防雨风帽", "敞口风筒"], create: () => {
    const parts: ModelPart[] = [part("保持中空的安装法兰", "lathe", transportColors.body, [0, 0.04, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.13, y: -0.04 }, { x: 0.26, y: -0.04 }, { x: 0.26, y: 0.04 }, { x: 0.13, y: 0.04 }, { x: 0.13, y: -0.04 }] }), part("中空立式通风主管", "lathe", transportColors.body, [0, 0.08, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.13, y: 0 }, { x: 0.16, y: 0 }, { x: 0.16, y: 1.04 }, { x: 0.13, y: 1.04 }, { x: 0.13, y: 0 }] }), part("下沿留通风间隙的薄壁风帽", "lathe", transportColors.trim, [0, 1.1, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0.38 }, { x: 0.2, y: 0.36 }, { x: 0.4, y: 0.22 }, { x: 0.43, y: 0.1 }, { x: 0.4, y: 0.09 }, { x: 0.36, y: 0.2 }, { x: 0.18, y: 0.32 }, { x: 0, y: 0.34 }] })];
    for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(strut("外置风帽支撑耳", [Math.cos(angle) * 0.15, 0.98, Math.sin(angle) * 0.15], [Math.cos(angle) * 0.25, 1.35, Math.sin(angle) * 0.25], 0.025)); }
    return parts;
  } },
];
