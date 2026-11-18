import { part, type ModelPart } from "../assetModelParts";
import { box, cab, chassis, crawler, cylinder, helicalFlight, strut, surface, transportColors, type TransportDefinition } from "./parts";

function cuttingDrum(x: number, y: number, z: number, width: number, radius: number): ModelPart[] {
  const flight = helicalFlight([x - width / 2, y, z], radius * 0.62, radius, width, 1.6);
  flight.rotation.z = -90;
  return [cylinder("横轴截割滚筒芯", [x, y, z], [radius * 1.2, width, radius * 1.2], transportColors.dark, [0, 0, 90]), flight];
}

export const miningVehicleModels: TransportDefinition[] = [
  { name: "横滚筒连续采煤机", tags: ["连续采煤", "截割头", "装载耙爪", "后部输送"], create: () => {
    // ACT: 不采用通用履带架的实心中央底座，给拾取铲板至输送槽留下贯通通道。
    const parts: ModelPart[] = [...crawler(4.6, 2.5).slice(1), ...[0, 1.5].map(z => box("输送槽下横向车架", [0, 0.55, z], [2.3, 0.12, 0.2], transportColors.dark)), ...cuttingDrum(0, 1.05, -3.1, 3.3, 0.64), box("前部拾取铲板", [0, 0.18, -2.65], [2.8, 0.14, 1.5], transportColors.trim), surface("铲板至中轴输送导坡", transportColors.dark, [[-0.34, 0.26, -2.8], [0.34, 0.26, -2.8], [0.34, 0.96, -1.75], [-0.34, 0.96, -1.75]], [0, 2, 1, 0, 3, 2]), box("中轴输送刮板底", [0, 0.96, -0.2], [0.68, 0.1, 4.7], transportColors.dark), box("后伸输送尾架", [0, 1.2, 3.1], [0.88, 0.22, 2.2], transportColors.body, [-12, 0, 0])];
    for (const side of [-1, 1]) parts.push(box("留出中部输送槽的侧电驱舱", [side * 0.85, 1.15, 0], [0.55, 0.6, 4.5], transportColors.signal), strut("截割头升降大臂", [side * 0.9, 0.95, -0.9], [side * 0.9, 1.05, -3.1], 0.24), strut("截割举升油缸", [side * 0.76, 1.25, -0.4], [side * 0.9, 1.15, -2.3], 0.12, transportColors.trim), cylinder("拾取耙爪驱动轴", [side * 0.73, 0.3, -2.55], [0.35, 0.14, 0.35]), box("三角耙爪横翼", [side * 0.73, 0.39, -2.55], [0.92, 0.08, 0.13], transportColors.dark, [0, side * 30, 0]), box("三角耙爪纵翼", [side * 0.73, 0.39, -2.55], [0.13, 0.08, 0.92], transportColors.dark, [0, side * 30, 0]), box("中轴输送槽侧板", [side * 0.39, 1.1, -0.2], [0.08, 0.28, 4.8], transportColors.body), box("尾部上扬输送槽侧板", [side * 0.47, 1.3, 3.1], [0.08, 0.24, 2.2], transportColors.body, [-12, 0, 0]));
    for (const z of [-1.8, -0.9, 0, 0.9, 1.8]) parts.push(box("装煤刮板横条", [0, 1.04, z], [0.68, 0.08, 0.09], transportColors.trim));
    return parts;
  } },
  { name: "双臂顶板锚杆钻装机", tags: ["矿井支护", "顶板钻孔", "伸缩钻架"], create: () => {
    const parts: ModelPart[] = [...chassis(2.3, 4.2, 0.36, [-1.4, 1.4]), box("低位液压动力机座", [0, 0.92, 0.2], [2.1, 0.8, 3.6], transportColors.signal), ...cab([-0.55, 1.1, 1.1], [0.95, 1.15, 1.1], true), box("顶板临时支护梁", [0, 3.36, -0.7], [3.3, 0.22, 0.9], transportColors.trim)];
    for (const side of [-1, 1]) {
      parts.push(strut("前支护液压立柱", [side * 0.85, 0.83, -0.7], [side * 0.85, 3.25, -0.7], 0.13), strut("钻架外伸摆臂", [side * 0.7, 1.1, -0.2], [side * 1.5, 1.5, -1.5], 0.19), box("垂直钻架导轨", [side * 1.5, 2.2, -1.5], [0.13, 2.6, 0.18], transportColors.dark), box("沿导轨进给动力头", [side * 1.5, 1.62, -1.68], [0.4, 0.45, 0.4]), cylinder("上向锚杆钻杆", [side * 1.5, 2.65, -1.68], [0.055, 1.9, 0.055], transportColors.trim), cylinder("钻架承压顶盘", [side * 1.5, 3.51, -1.5], [0.36, 0.12, 0.36]), strut("前支脚液压杆", [side * 1.1, 0.27, -1.7], [side * 1.1, 0.85, -1.7], 0.1), box("前部调平支脚", [side * 1.1, 0.16, -1.7], [0.4, 0.25, 0.4], transportColors.dark));
    }
    return parts;
  } },
  { name: "摇臂双滚筒长壁采煤机", tags: ["长壁采煤", "齿轨牵引", "双摇臂"], create: () => {
    const parts: ModelPart[] = [box("长条卧式牵引机身", [0, 1.15, 0], [1.2, 0.85, 5.2], transportColors.signal), box("靠煤壁侧刮板输送槽底", [-0.95, 0.32, 0], [1.1, 0.16, 8.5], transportColors.dark)];
    for (const side of [-1, 1]) {
      const y = side < 0 ? 1.2 : 2.25, z = side * 3.5;
      parts.push(cylinder("截割摇臂回转轴", [0.1, 1.15, side * 2], [0.45, 1.5, 0.45], transportColors.dark, [0, 0, 90]), strut("独立高低截割摇臂", [0, 1.15, side * 2], [0, y, z], 0.36), ...cuttingDrum(-0.45, y, z, 1.8, 0.83), box("牵引靴", [0.32, 0.55, side * 1.6], [0.58, 0.3, 0.7], transportColors.dark), cylinder("牵引小齿轮", [0.68, 0.54, side * 1.6], [0.42, 0.16, 0.42], transportColors.trim, [0, 0, 90]));
    }
    for (const x of [-1.48, -0.42]) parts.push(box("输送槽侧壁", [x, 0.48, 0], [0.08, 0.3, 8.5], transportColors.body));
    parts.push(box("独立啮合牵引齿轨", [0.7, 0.38, 0], [0.15, 0.15, 8.5], transportColors.dark));
    for (let index = 0; index < 12; index++) parts.push(box("牵引轨定距齿条", [0.7, 0.48, -4 + index * 0.7], [0.25, 0.1, 0.15], transportColors.trim));
    return parts;
  } },
  { name: "抱罐式冶金热渣运输车", tags: ["冶金运输", "抱罐", "液压翻转"], create: () => {
    const parts: ModelPart[] = [...chassis(3.5, 4.1, 0.72, [-1.3, 0.8]), ...cab([-0.85, 1.7, -1], [1.6, 1.6, 1.6]), box("前部隔热动力舱", [0.6, 1.65, -0.6], [1.6, 1.6, 2.5], transportColors.signal), part("敞口耐热渣罐", "lathe", transportColors.dark, [0, 0.9, 3.6], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.78, y: 0 }, { x: 1.35, y: 2.15 }, { x: 1.28, y: 2.3 }, { x: 1.12, y: 2.3 }, { x: 0.65, y: 0.2 }, { x: 0, y: 0.2 }] })];
    for (const side of [-1, 1]) {
      parts.push(box("围绕罐体的后伸车架", [side * 1.62, 0.95, 3], [0.36, 0.42, 5]), cylinder("后轮轮胎", [side * 1.72, 0.72, 4.7], [1.44, 0.46, 1.44], transportColors.dark, [0, 0, 90]), cylinder("后轮轮毂", [side * 1.72, 0.72, 4.7], [0.6, 0.5, 0.6], transportColors.trim, [0, 0, 90]), cylinder("侧置抱罐臂根铰轴", [side * 1.62, 1.3, 1.2], [0.5, 0.46, 0.5], transportColors.dark, [0, 0, 90]), strut("抱罐提升大臂", [side * 1.62, 1.3, 1.2], [side * 1.5, 2.6, 3.6], 0.3, transportColors.signal), strut("抱罐举升油缸", [side * 1.62, 1.1, 2.1], [side * 1.5, 2.5, 3.3], 0.22), cylinder("罐体两侧耳轴", [side * 1.28, 2.6, 3.6], [0.28, 0.7, 0.28], transportColors.trim, [0, 0, 90]), box("抱合耳轴承窝", [side * 1.55, 2.6, 3.6], [0.28, 0.55, 0.5], transportColors.signal));
    }
    return parts;
  } },
];
