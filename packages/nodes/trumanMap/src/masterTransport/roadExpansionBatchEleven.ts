import { beam, part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, ball, transportColors, type TransportDefinition } from "./parts";

function hydraulic(name: string, start: Triple, end: Triple, diameter: number): ModelPart[] {
  const joint = start.map((value, index) => value + (end[index]! - value) * 0.62) as Triple;
  return [{ ...strut(`${name}外筒`, start, joint, diameter), shape: "cylinder" }, { ...strut(`${name}外露活塞杆`, joint, end, diameter * 0.5, transportColors.trim), shape: "cylinder" }];
}

// 大型独立工程总成，可与已有整机装配；不再登记一台更换部件的盾构机或采煤机。
// https://www.herrenknecht.com.cn/en/allaround-digital/issue-2.html
// https://galbiati.it/en/mechanical-machine-engineering-construction/hiroshima-tbm-erector/
// https://www.komatsu.com/en-au/products/equipment/longwall/joy-engineered-powered-roof-support-prs-solution
export const roadExpansionBatchEleven: TransportDefinition[] = [
  { name: "开放辐板滚刀式全断面掘进刀盘", theme: "现代", itemType: "构件", tags: ["独立掘进刀盘", "开放排渣窗口", "滚刀与径向支承"], create: () => {
    const parts: ModelPart[] = [ring("刀盘外周具有真实贯通内腔的承载环", transportColors.body, 3.15, 0.33, 0, 0.35, { position: { x: 0, y: 3.15, z: 0 }, rotation: { x: 90, y: 0, z: 0 } }), ring("中央保留贯通主轴安装孔的厚轮毂", transportColors.dark, 0.9, 0.52, 0, 0.62, { position: { x: 0, y: 3.15, z: 0 }, rotation: { x: 90, y: 0, z: 0 } }), ring("后端连接主驱动的环形安装法兰", transportColors.body, 1.08, 0.7, 0, 0.12, { position: { x: 0, y: 3.15, z: 0.36 }, rotation: { x: 90, y: 0, z: 0 } })];
    for (let spoke = 0; spoke < 6; spoke++) {
      const angle = spoke * Math.PI / 3, degrees = spoke * 60 - 90;
      parts.push(strut("与外环和轮毂相连且保留窗洞的独立辐板", [Math.cos(angle) * 0.64, 3.15 + Math.sin(angle) * 0.64, 0], [Math.cos(angle) * 2.92, 3.15 + Math.sin(angle) * 2.92, 0], 0.42, transportColors.body), cylinder("后安装法兰上的独立连接螺柱", [Math.cos(angle) * 0.72, 3.15 + Math.sin(angle) * 0.72, 0.45], [0.1, 0.2, 0.1], transportColors.trim, [90, 0, 0]));
      for (const radius of [1.45, 2.55]) {
        parts.push(cylinder("滚动方向与刀盘切向速度相配的切岩滚刀", [Math.cos(angle) * radius, 3.15 + Math.sin(angle) * radius, -0.28], [0.44, 0.1, 0.44], transportColors.dark, [0, 0, degrees]), cylinder("真正贯穿滚刀与两侧支座的径向轮轴", [Math.cos(angle) * radius, 3.15 + Math.sin(angle) * radius, -0.28], [0.08, 0.38, 0.08], transportColors.trim, [0, 0, degrees]));
        for (const side of [-1, 1]) parts.push(box("把滚刀轴两端接到辐板的独立安装座", [Math.cos(angle) * (radius + side * 0.14), 3.15 + Math.sin(angle) * (radius + side * 0.14), -0.1], [0.24, 0.09, 0.34], transportColors.body, [0, 0, degrees]));
      }
    }
    return parts;
  } },
  { name: "环架回转伸缩式隧道管片拼装机", theme: "现代", itemType: "构件", tags: ["独立管片拼装机", "回转环架", "伸缩臂与吸持盘"], create: () => {
    const parts: ModelPart[] = [ring("前侧容许隧道物流通过的开放支承环", transportColors.body, 2.9, 0.34, 0, 0.28, { position: { x: 0, y: 3.0, z: -0.25 }, rotation: { x: 90, y: 0, z: 0 } }), ring("后侧与主机连接的开放承重环", transportColors.body, 2.9, 0.34, 0, 0.28, { position: { x: 0, y: 3.0, z: 0.9 }, rotation: { x: 90, y: 0, z: 0 } }), ring("沿环架连续回转的环形导向带", transportColors.dark, 2.97, 0.1, 0, 0.12, { position: { x: 0, y: 3.0, z: -0.25 }, rotation: { x: 90, y: 0, z: 0 } }), box("沿支承环运行的回转小车承台", [2.38, 4.38, 0.2], [0.7, 0.7, 1.7], transportColors.signal, [0, 0, 30]), beam("从回转小车向管片工作面伸出的外套臂", transportColors.body, [2.3, 4.35, 0.9], [1.6, 3.825, 2.02], 0.3, 0.34), beam("保持同轴方向向外伸出的内套臂", transportColors.signal, [1.76, 3.945, 1.764], [1.1, 3.45, 2.82], 0.2, 0.23), cylinder("吸持头末端姿态调节的横向铰轴", [1.1, 3.45, 2.82], [0.38, 0.9, 0.38], transportColors.dark, [0, 0, 90]), box("四吸盘共同连接的吸持头承托板", [1.1, 3.45, 2.95], [1.3, 0.92, 0.12], transportColors.body), cylinder("回转小车侧面的驱动电机", [2.7, 4.55, 0.35], [0.3, 0.55, 0.3], transportColors.dark, [90, 0, 0]), ...hydraulic("臂架末端角度调节缸", [1.85, 4.08, 1.7], [1.26, 3.68, 2.8], 0.1)];
    for (let index = 0; index < 6; index++) {
      const angle = index * Math.PI / 3;
      parts.push(strut("前后支承环之间的独立轴向拉梁", [Math.cos(angle) * 2.73, 3 + Math.sin(angle) * 2.73, -0.12], [Math.cos(angle) * 2.73, 3 + Math.sin(angle) * 2.73, 0.78], 0.17, transportColors.body));
    }
    for (const x of [-0.43, 0.43]) for (const y of [-0.29, 0.29]) parts.push(part("具有真实开口和厚唇的柔性管片吸持盘", "lathe", transportColors.dark, [1.1 + x, 3.45 + y, 3.04], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -0.07 }, { x: 0.14, y: -0.07 }, { x: 0.2, y: 0.05 }, { x: 0.2, y: 0.08 }, { x: 0.16, y: 0.08 }, { x: 0.11, y: -0.035 }, { x: 0, y: -0.035 }] }));
    parts.push(part("从伸缩臂接回吸持头的柔性服务管束", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.04, path: [{ x: 2.3, y: 4.55, z: 0.9 }, { x: 1.7, y: 4.2, z: 1.9 }, { x: 1.15, y: 3.9, z: 2.6 }, { x: 1.1, y: 3.7, z: 2.95 }] }));
    return parts;
  } },
  { name: "四连杆掩护式双立柱综采液压支架", theme: "现代", itemType: "设施", tags: ["综采液压支架", "顶梁与掩护梁", "四连杆导向与移架缸"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].map(side => box("承托整架并接触矿底的独立底座滑靴", [side * 0.6, 0.18, 0], [0.35, 0.36, 3.8], transportColors.dark)), box("左右底座之间的后连接横梁", [0, 0.25, 1.45], [1.55, 0.3, 0.4], transportColors.body), box("移架缸后铰点实际连接左右底座的横梁", [0, 0.28, 0.4], [1.55, 0.23, 0.3], transportColors.body), box("接触煤层顶板的连续承重顶梁", [0, 3.5, -0.4], [1.7, 0.22, 4.8], transportColors.signal), beam("从后下方接到顶梁的整片倾斜掩护梁", transportColors.body, [0, 1.1, 2.35], [0, 3.35, 1.75], 1.65, 0.18), cylinder("顶梁与掩护梁之间的独立横向铰轴", [0, 3.38, 1.78], [0.32, 1.9, 0.32], transportColors.dark, [0, 0, 90]), ...hydraulic("与输送机相连的底座移架推拉缸", [0, 0.28, 0.4], [0, 0.28, -2.5], 0.26), box("底座前端移架缸连接横耳", [0, 0.28, -2.52], [0.5, 0.25, 0.35], transportColors.body), box("伸向工作面的顶梁前延伸板", [0, 3.45, -2.92], [1.7, 0.16, 0.46], transportColors.signal, [-12, 0, 0]), box("支架外侧独立液压控制阀组", [0.93, 1.2, 0.1], [0.22, 0.25, 0.56], transportColors.dark), strut("控制阀组向底座连接的刚性承托臂", [0.6, 0.35, 0.1], [0.93, 1.12, 0.1], 0.05, transportColors.body)];
    for (const side of [-1, 1]) {
      parts.push(...hydraulic("顶梁下方独立承重液压立柱", [side * 0.45, 0.3, -0.7], [side * 0.45, 3.35, -0.3], 0.35), ball("立柱与顶梁之间的球面承头", [side * 0.45, 3.34, -0.3], [0.28, 0.28, 0.28], transportColors.body), strut("底座前铰点至掩护梁下部的长连杆", [side * 0.6, 0.38, 0.2], [side * 0.6, 1.25, 2.31], 0.14, transportColors.body), strut("底座后铰点至掩护梁上部的短连杆", [side * 0.6, 0.38, 1.45], [side * 0.6, 1.65, 2.203], 0.14, transportColors.body));
      for (const [y, z] of [[0.38, 0.2], [0.38, 1.45], [1.25, 2.31], [1.65, 2.203]]) parts.push(cylinder("四连杆各自独立的真实横向铰销", [side * 0.6, y!, z!], [0.19, 0.28, 0.19], transportColors.dark, [0, 0, 90]));
      for (const z of [-0.1, 0.3]) parts.push(part("从控制阀分配到立柱的柔性液压管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.014, path: [{ x: 0.93, y: 1.2, z }, { x: 0.8, y: 0.8, z: z - 0.3 }, { x: side * 0.45, y: 0.85, z: -0.6 }] }));
    }
    return parts;
  } },
];
