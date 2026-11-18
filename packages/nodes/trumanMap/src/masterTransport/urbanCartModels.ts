import { part, type ModelPart, type Triple } from "../assetModelParts";
import { axles, bicycleFrame, box, cylinder, strut, surface, transportColors, wheel, type TransportDefinition } from "./parts";

function caster(position: Triple, radius: number): ModelPart[] {
  return [...wheel(position, radius, radius * 0.45), cylinder("脚轮竖直回转轴", [position[0], position[1] + radius * 1.35, position[2]], [radius * 0.48, radius * 1.7, radius * 0.48]), box("脚轮双侧轮叉桥", [position[0], position[1] + radius * 0.6, position[2]], [radius * 0.9, radius * 0.2, radius * 1.2])];
}

function pedalCrank(position: Triple): ModelPart[] {
  const [x, y, z] = position;
  return [cylinder("曲柄中轴", position, [0.035, 0.34, 0.035], transportColors.trim, [0, 0, 90]), cylinder("链条主动牙盘", [x + 0.13, y, z], [0.21, 0.012, 0.21], transportColors.dark, [0, 0, 90]), ...[-1, 1].flatMap(side => [strut("左右相反的曲柄臂", [x + side * 0.18, y, z], [x + side * 0.18, y + side * 0.13, z], 0.02), box("防滑脚踏", [x + side * 0.24, y + side * 0.13, z], [0.12, 0.025, 0.075], transportColors.dark)])];
}

export const urbanCartModels: TransportDefinition[] = [
  { name: "篷座脚踏载客三轮车", theme: "异域", tags: ["脚踏人力三轮", "载客三轮", "cycle rickshaw"], create: () => {
    const parts: ModelPart[] = [...wheel([0, 0.34, -1.3], 0.34, 0.07), ...axles(1.18, [0.88], 0.35), ...bicycleFrame([0, 0.34, -1.3], [0, 0.4, 0.72], [0, 0.92, -0.1], [0, 0.4, -0.28], [0, 1, -1.12]), box("驾驶者独立鞍座", [0, 0.96, -0.1], [0.28, 0.07, 0.22], transportColors.dark), box("转向横把", [0, 1.08, -1.12], [0.58, 0.04, 0.05]), ...pedalCrank([0, 0.4, -0.28]), box("双人乘坐底架", [0, 0.56, 0.85], [1.05, 0.13, 1.05]), box("乘客座垫", [0, 0.75, 1.1], [0.98, 0.16, 0.6], transportColors.signal), box("双人乘客后靠背", [0, 1.05, 1.36], [1, 0.65, 0.09], transportColors.signal), box("前低踏脚台", [0, 0.42, 0.3], [1.02, 0.06, 0.48], transportColors.dark), surface("前后敞开的弧折篷顶", transportColors.trim, [[-0.58, 1.85, 0.2], [0, 2.02, 0.2], [0.58, 1.85, 0.2], [-0.58, 1.85, 1.45], [0, 2.02, 1.45], [0.58, 1.85, 1.45]], [0, 1, 4, 0, 4, 3, 1, 2, 5, 1, 5, 4])];
    for (const side of [-1, 1]) parts.push(strut("乘坐舱侧扶手", [side * 0.51, 1.04, 0.62], [side * 0.51, 1.04, 1.32], 0.035), strut("篷顶后部承托杆", [side * 0.51, 0.65, 1.36], [side * 0.55, 1.85, 1.36], 0.03), strut("乘客车厢与驱动轴连接", [side * 0.44, 0.57, 0.2], [side * 0.44, 0.38, 0.88], 0.045));
    parts.push(strut("驱动链条上段", [0.13, 0.5, -0.28], [0.13, 0.43, 0.88], 0.012), strut("驱动链条下段", [0.13, 0.3, -0.28], [0.13, 0.27, 0.88], 0.012));
    return parts;
  } },
  { name: "远端转向前箱两轮货运自行车", theme: "现代", tags: ["长约翰货运自行车", "前置载货箱", "long john cargo bicycle"], create: () => {
    const parts: ModelPart[] = [...wheel([0, 0.25, -1.57], 0.25, 0.06), ...wheel([0, 0.34, 1.1], 0.34, 0.07), ...bicycleFrame([0, 0.38, 0.13], [0, 0.34, 1.1], [0, 0.94, 0.7], [0, 0.4, 0.43], [0, 0.88, 0.14]), strut("延长且低置的载货主梁", [0, 0.34, -1.48], [0, 0.4, 0.43], 0.065, transportColors.signal), strut("位于货箱前方的独立远端转向颈管", [0, 0.34, -1.48], [0, 0.57, -1.44], 0.045), ...[-1, 1].map(side => strut("远端转向头到前轴的双侧前叉", [side * 0.04, 0.57, -1.44], [side * 0.04, 0.25, -1.57], 0.025)), box("低置前货箱底板", [0, 0.45, -0.72], [0.62, 0.06, 1.03], transportColors.wood), ...[-1, 1].map(side => box("前箱高侧板", [side * 0.3, 0.68, -0.72], [0.035, 0.45, 1.05], transportColors.wood)), ...[-1, 1].map(end => box("前箱端壁", [0, 0.68, -0.72 + end * 0.51], [0.62, 0.45, 0.035], transportColors.wood)), box("骑手鞍座", [0, 0.99, 0.7], [0.28, 0.07, 0.2], transportColors.dark), cylinder("近骑手长转向柱", [0, 0.92, 0.1], [0.04, 0.5, 0.04]), box("骑手转向横把", [0, 1.18, 0.1], [0.58, 0.04, 0.045]), strut("箱下远端转向连杆", [0.16, 0.31, 0.12], [0.16, 0.28, -1.5], 0.018), strut("前叉侧向转向摇臂", [0.16, 0.28, -1.5], [0, 0.34, -1.45], 0.025), ...pedalCrank([0, 0.4, 0.43]), strut("后轮传动链条上段", [0.13, 0.5, 0.43], [0.13, 0.4, 1.1], 0.01), strut("后轮传动链条下段", [0.13, 0.3, 0.43], [0.13, 0.28, 1.1], 0.01)];
    for (const side of [-1, 1]) parts.push(strut("两侧承托箱底的横向支架", [0, 0.36, -0.7], [side * 0.3, 0.42, -0.7], 0.035));
    return parts;
  } },
  { name: "遮阳篷冷柜冰淇淋手推车", theme: "现代", tags: ["冰淇淋售卖推车", "移动冷柜", "街头小贩"], create: () => {
    const parts: ModelPart[] = [box("带隔热壁的移动冷柜", [0, 0.62, 0], [0.72, 0.68, 1.25], transportColors.signal), ...axles(0.95, [0.24], 0.26), ...[-1, 1].map(side => box("上部双片保温滑盖", [side * 0.175, 0.97, 0], [0.34, 0.055, 1.2], transportColors.trim)), ...[-1, 1].map(side => box("滑盖提拉把手", [side * 0.1, 1.015, 0], [0.1, 0.035, 0.04], transportColors.dark)), ...[-1, 1].map(side => strut("后部向上推行把杆", [side * 0.29, 0.75, 0.57], [side * 0.29, 1, 0.93], 0.03)), strut("推行握持横把", [-0.29, 1, 0.93], [0.29, 1, 0.93], 0.035), ...caster([0, 0.09, -0.5], 0.09), ...[-1, 1].map(side => cylinder("遮阳篷支撑杆", [side * 0.34, 1.33, 0], [0.025, 1.22, 0.025], transportColors.body)), surface("两坡遮阳蓬布", transportColors.trim, [[-0.64, 1.94, -0.84], [0, 2.12, -0.84], [0.64, 1.94, -0.84], [-0.64, 1.94, 0.84], [0, 2.12, 0.84], [0.64, 1.94, 0.84]], [0, 1, 4, 0, 4, 3, 1, 2, 5, 1, 5, 4])];
    for (const side of [-1, 1]) parts.push(box("遮阳篷两侧下垂短沿", [side * 0.63, 1.89, 0], [0.025, 0.12, 1.68], transportColors.signal));
    return parts;
  } },
  { name: "立架承托式双轮重物手推车", theme: "现代", tags: ["仓库手推搬运车", "老虎车", "sack truck"], create: () => {
    const parts: ModelPart[] = [...axles(0.52, [0.13], 0.14), box("插到重物底下的薄承托铲板", [0, 0.045, -0.14], [0.44, 0.04, 0.4], transportColors.signal), ...[-1, 1].map(side => strut("直立货物承托主框", [side * 0.2, 0.08, 0], [side * 0.2, 1.2, 0.07], 0.035, transportColors.signal)), ...[0.2, 0.55, 0.9].map(y => box("承重梯形横撑", [0, y, 0.03], [0.42, 0.035, 0.04], transportColors.signal)), ...[-1, 1].map(side => strut("后曲人机握把", [side * 0.2, 1.2, 0.07], [side * 0.2, 1.18, 0.25], 0.04, transportColors.dark))];
    for (const side of [-1, 1]) parts.push(strut("轮轴至立框加强斜撑", [side * 0.22, 0.14, 0.13], [side * 0.2, 0.42, 0.03], 0.03));
    return parts;
  } },
  { name: "手动液压双货叉托盘搬运车", theme: "现代", tags: ["手动地牛", "托盘搬运车", "pallet jack"], create: () => {
    const parts: ModelPart[] = [box("后部连接两叉的升降横梁", [0, 0.22, 0.48], [0.62, 0.16, 0.25], transportColors.signal), ...[-1, 1].map(side => box("插入托盘孔的低矮长货叉", [side * 0.19, 0.12, -0.23], [0.15, 0.08, 1.38], transportColors.signal)), cylinder("后部液压起升柱", [0, 0.32, 0.54], [0.17, 0.38, 0.17]), cylinder("转向轮中心回转销", [0, 0.18, 0.62], [0.08, 0.25, 0.08]), ...[-1, 1].flatMap(side => wheel([side * 0.09, 0.09, 0.62], 0.09, 0.06)), strut("兼作泵压摇柄的倾斜操纵杆", [0, 0.33, 0.62], [0, 1.02, 0.91], 0.045), part("操纵杆末端闭合握持框", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.018, path: [{ x: 0, y: 1.02, z: 0.91 }, { x: -0.19, y: 1.08, z: 0.93 }, { x: -0.17, y: 1.25, z: 0.96 }, { x: 0.17, y: 1.25, z: 0.96 }, { x: 0.19, y: 1.08, z: 0.93 }, { x: 0, y: 1.02, z: 0.91 }] })];
    for (const side of [-1, 1]) parts.push(...wheel([side * 0.19, 0.045, -0.77], 0.045, 0.1), strut("货叉底下连接前承重轮的拉杆", [side * 0.19, 0.075, 0.44], [side * 0.19, 0.075, -0.77], 0.02));
    return parts;
  } },
  { name: "四脚轮低平台平板手推车", theme: "现代", tags: ["平板搬运车", "平台推车", "仓储运输"], create: () => {
    const parts: ModelPart[] = [box("连续防滑低货台", [0, 0.22, 0], [0.62, 0.08, 0.95], transportColors.signal), ...[-1, 1].map(side => strut("后部竖直推把支柱", [side * 0.25, 0.25, 0.39], [side * 0.25, 0.94, 0.39], 0.03)), strut("推把上端横向握杆", [-0.25, 0.94, 0.39], [0.25, 0.94, 0.39], 0.035, transportColors.dark), box("靠近推把的货物挡板", [0, 0.4, 0.39], [0.49, 0.25, 0.025])];
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(...caster([side * 0.23, 0.07, end * 0.35], 0.07));
    return parts;
  } },
  { name: "脚踏泵压剪叉升降台车", theme: "现代", tags: ["移动升降台", "液压剪叉台车", "仓储搬运"], create: () => {
    const parts: ModelPart[] = [box("刚性下部轮架", [0, 0.2, 0], [0.62, 0.09, 0.95]), box("升高的平面承货台", [0, 0.83, 0], [0.68, 0.075, 1.04], transportColors.signal), strut("剪叉驱动缸", [0, 0.24, 0.3], [0, 0.62, -0.25], 0.075), strut("后侧推动把立杆", [-0.25, 0.2, 0.44], [-0.25, 1.05, 0.44], 0.03), strut("后侧推动把立杆", [0.25, 0.2, 0.44], [0.25, 1.05, 0.44], 0.03), strut("推动横握把", [-0.25, 1.05, 0.44], [0.25, 1.05, 0.44], 0.035), strut("液压泵脚踏摇臂", [0, 0.21, 0.32], [0, 0.13, 0.7], 0.025), box("脚踏摇臂防滑踏板", [0, 0.13, 0.7], [0.2, 0.03, 0.12], transportColors.dark)];
    for (const side of [-1, 1]) parts.push(strut("侧面第一交叉升降臂", [side * 0.22, 0.25, -0.39], [side * 0.22, 0.79, 0.39], 0.045), strut("侧面第二交叉升降臂", [side * 0.27, 0.25, 0.39], [side * 0.27, 0.79, -0.39], 0.045), cylinder("交叉臂共用连接轴", [side * 0.245, 0.52, 0], [0.065, 0.12, 0.065], transportColors.trim, [0, 0, 90]));
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(...caster([side * 0.23, 0.065, end * 0.34], 0.065));
    return parts;
  } },
  { name: "透空锥篮式超市购物车", theme: "现代", tags: ["超市推车", "金属网篮购物车", "shopping cart"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].map(side => strut("前低后高的底部纵框", [side * 0.23, 0.18, -0.42], [side * 0.26, 0.23, 0.45], 0.025)), strut("底架前部连接横梁", [-0.23, 0.18, -0.42], [0.23, 0.18, -0.42], 0.025), ...[-1, 1].map(side => strut("后部推把承力长杆", [side * 0.26, 0.23, 0.45], [side * 0.3, 1.05, 0.5], 0.025)), strut("后端有握套的推动横把", [-0.3, 1.05, 0.5], [0.3, 1.05, 0.5], 0.035, transportColors.signal)];
    for (const side of [-1, 1]) {
      for (let index = 0; index < 9; index++) { const z = -0.34 + index * 0.085; parts.push(strut("购物篮两长侧面的独立锥形栅丝", [side * 0.22, 0.5, z * 0.83], [side * 0.3, 0.96, z * 1.15], 0.006)); }
      for (let row = 0; row < 3; row++) { const t = row / 2, x = side * (0.22 + 0.08 * t), z = 0.282 + 0.109 * t; parts.push(strut("长侧篮面横向围丝", [x, 0.5 + 0.46 * t, -z], [x, 0.5 + 0.46 * t, z], 0.008)); }
      for (let index = 0; index < 5; index++) { const x = -0.2 + index * 0.1; parts.push(strut("篮子前后端面的独立栅丝", [x, 0.5, side * 0.282], [x * 1.36, 0.96, side * 0.391], 0.006)); }
      for (let row = 0; row < 3; row++) { const t = row / 2, x = 0.22 + 0.08 * t; parts.push(strut("前后端面横向围丝", [-x, 0.5 + 0.46 * t, side * (0.282 + 0.109 * t)], [x, 0.5 + 0.46 * t, side * (0.282 + 0.109 * t)], 0.008)); }
      parts.push(strut("篮底与轮架之间的前撑", [side * 0.22, 0.18, -0.3], [side * 0.22, 0.5, -0.25], 0.022));
    }
    for (let index = 0; index < 6; index++) parts.push(strut("篮底纵向承托丝", [-0.2 + index * 0.08, 0.5, -0.282], [-0.2 + index * 0.08, 0.5, 0.282], 0.006));
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(...caster([side * 0.23, 0.06, end * 0.35], 0.06));
    return parts;
  } },
];
