import { beam, part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, wheel, cab, surface, transportColors, type TransportDefinition } from "./parts";

function vehicleAxles(track: number, positions: number[], radius: number, width: number): ModelPart[] {
  return positions.flatMap(z => [cylinder("承载左右双轮的横向车桥", [0, radius, z], [0.15, track, 0.15], transportColors.dark, [0, 0, 90]), ...[-1, 1].flatMap(side => wheel([side * track / 2, radius, z], radius, width))]);
}

function hydraulic(name: string, start: Triple, joint: Triple, end: Triple, width: number): ModelPart[] {
  const direction = end.map((value, index) => value - start[index]!) as Triple;
  const lengthSquared = direction.reduce((sum, value) => sum + value * value, 0);
  const fraction = Math.max(0.1, Math.min(0.9, direction.reduce((sum, value, index) => sum + value * (joint[index]! - start[index]!), 0) / lengthSquared));
  const axisJoint = start.map((value, index) => value + direction[index]! * fraction) as Triple;
  return [{ ...strut(`${name}外筒`, start, axisJoint, width), shape: "cylinder" }, { ...strut(`${name}活塞杆`, axisJoint, end, width * 0.45, transportColors.trim), shape: "cylinder" }];
}

// 原创完整构造参照下列制造商的机种类别，不复制商标或具体型号零件。
// https://www.komptech.com/en/products/topturn-x/
// https://www.epiroc.com/ja-jp/products/loaders-and-trucks/underground-mining-trucks
// https://www.goldhofer.com/en/heavyduty-modules/towed/ft-series
export const roadExpansionBatchFive: TransportDefinition[] = [
  { name: "跨垄自走门式横鼓堆肥翻抛机", theme: "现代", tags: ["堆肥翻抛机", "跨垄开放通道", "自走横轴翻堆"], create: () => {
    const parts: ModelPart[] = [box("跨过堆肥垄的上部承载横梁", [0, 3.43, 0], [6.0, 0.5, 1.05], transportColors.signal), cylinder("横跨通道的翻抛转鼓", [0, 0.85, 0.2], [1.1, 5.3, 1.1], transportColors.dark, [0, 0, 90]), surface("转鼓后方导回垄面的倾斜防飞溅护罩", transportColors.body, [[-2.6, 2.35, 0.4], [2.6, 2.35, 0.4], [2.6, 1.2, 1.65], [-2.6, 1.2, 1.65]], [0, 1, 2, 0, 2, 3]), ...cab([-2.73, 2.6, -0.5], [1.15, 1.25, 1.6]), cylinder("把升高驾驶室实际连接到动力舱的支柱", [-2.73, 2.4, -0.5], [0.6, 0.45, 0.6]), box("另一侧动力舱上方维护盖", [2.84, 2.51, 0.3], [0.9, 0.4, 2.3], transportColors.body), cylinder("侧舱向上排出的废气管", [2.84, 3.06, 0.9], [0.12, 0.9, 0.12], transportColors.dark)];
    for (const side of [-1, 1]) {
      parts.push(box("通道两侧独立液压动力舱", [side * 2.84, 1.82, 0], [1.0, 1.04, 3.5], transportColors.signal), box("把侧舱连接至跨垄横梁的立架", [side * 2.59, 2.46, 0], [0.25, 2.0, 0.6], transportColors.dark), box("转鼓轴承至侧舱的竖向承力颊板", [side * 2.65, 1.1, 0.2], [0.2, 0.8, 0.75], transportColors.body), cylinder("翻抛鼓两端的独立轴承座", [side * 2.65, 0.85, 0.2], [0.45, 0.34, 0.45], transportColors.body, [0, 0, 90]), surface("位于转鼓两端的防飞料三角护板", transportColors.body, [[side * 2.64, 0.65, 0.3], [side * 2.64, 2.35, 0.4], [side * 2.64, 1.2, 1.65]], [0, 1, 2]));
      for (const z of [-1.08, 1.08]) parts.push(...wheel([side * 2.99, 0.65, z], 0.65, 0.43), strut("轮毂至侧舱承载架的独立支腿", [side * 2.68, 1.42, z], [side * 2.99, 0.65, z], 0.14));
      for (const z of [-0.8, 0.3, 1.2]) parts.push(box("侧舱外侧可拆维护门", [side * 3.35, 1.82, z], [0.025, 0.78, 0.7], transportColors.body));
    }
    for (let row = 0; row < 5; row++) for (let blade = 0; blade < 4; blade++) {
      const angle = row * 0.6 + blade * Math.PI / 2, x = row - 2;
      parts.push(beam("沿转鼓呈螺旋错列的实体翻抛桨板", transportColors.trim, [x, 0.85 + Math.cos(angle) * 0.51, 0.2 + Math.sin(angle) * 0.51], [x + (x > 0 ? -0.12 : 0.12), 0.85 + Math.cos(angle) * 0.79, 0.2 + Math.sin(angle) * 0.79], 0.18, 0.045));
    }
    return parts;
  } },
  { name: "低顶前动力头铰接式地下自卸运矿车", theme: "现代", tags: ["地下运矿车", "低顶铰接底盘", "后斗液压卸料"], create: () => {
    const parts: ModelPart[] = [...vehicleAxles(2.25, [-3.0, 2.95], 0.65, 0.44), box("狭长前动力头承重底架", [0, 0.98, -2.7], [1.65, 0.3, 3.45], transportColors.dark), box("低顶前置发动机罩", [0.32, 1.48, -3.43], [1.45, 0.82, 1.62], transportColors.signal), box("动力头前端横向防撞梁", [0, 0.97, -4.28], [2.25, 0.35, 0.3], transportColors.body), ...cab([-0.64, 1.2, -2.03], [1.08, 1.18, 1.4]), cylinder("前后两车架共用的中央转向立销", [0, 1.13, -0.79], [0.35, 0.8, 0.35]), box("与后桥相连的独立后半车架", [0, 1.0, 2.08], [1.82, 0.33, 4.55], transportColors.dark), ...[-1, 1].map(side => box("后车架托住低斗的纵向承梁", [side * 0.78, 1.23, 2.08], [0.2, 0.4, 4.4], transportColors.body)), box("真正中空卸料斗的底板", [0, 1.4, 2.08], [2.4, 0.14, 4.0], transportColors.dark), box("卸料斗靠动力头一端的挡料前墙", [0, 2.0, 0.13], [2.47, 1.3, 0.13], transportColors.signal), box("卸料斗尾部的独立薄封门", [0, 1.99, 4.03], [2.47, 1.25, 0.13], transportColors.signal), box("后桥上方连接翻斗铰座的尾横梁", [0, 1.24, 3.84], [2.0, 0.3, 0.42], transportColors.body)];
    for (const side of [-1, 1]) {
      parts.push(part("前高后收分的卸料斗薄侧墙", "extrude", transportColors.signal, [side * 1.21, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 0.13, profile: [{ x: 0.06, y: 1.34 }, { x: 4.1, y: 1.34 }, { x: 4.1, y: 2.45 }, { x: 3.85, y: 2.66 }, { x: 0.13, y: 2.66 }, { x: 0.06, y: 2.5 }] }), cylinder("货斗尾部横向承重铰销", [side * 0.9, 1.4, 3.84], [0.18, 0.36, 0.18], transportColors.body, [0, 0, 90]), ...hydraulic("货斗底下的独立举升缸", [side * 0.57, 1.06, 0.48], [side * 0.54, 1.25, 1.1], [side * 0.51, 1.38, 1.62], 0.14), ...hydraulic("铰接式车架转向缸", [side * 0.65, 1.09, -1.42], [side * 0.66, 1.1, -0.76], [side * 0.67, 1.12, -0.16], 0.12), strut("中央铰接颈的前后受力连接臂", [side * 0.43, 1.07, -1.05], [side * 0.43, 1.07, 0.05], 0.16));
      for (const z of [0.8, 1.9, 3.0]) parts.push(box("卸料斗外壁竖向耐冲击加强筋", [side * 1.3, 1.99, z], [0.07, 1.18, 0.13], transportColors.body));
    }
    parts.push(cylinder("司机室后低顶排气净化筒", [0.53, 1.7, -1.5], [0.26, 0.72, 0.26], transportColors.dark), box("发动机罩前方散热格栅", [0.32, 1.48, -4.26], [1.22, 0.6, 0.035], transportColors.dark));
    return parts;
  } },
  { name: "悬载双纵梁液压桥式公路重载运输装置", theme: "现代", tags: ["桥式梁运输装置", "前后独立转向台车", "中间悬载空间"], create: () => {
    const parts: ModelPart[] = [];
    for (const end of [-1, 1]) {
      for (const z of [-1.7, 0, 1.7]) parts.push(...vehicleAxles(2.7, [end * 10 + z], 0.46, 0.35));
      parts.push(box("首尾轮组各自的模块承载甲板", [0, 1.05, end * 10], [3.05, 0.24, 5.3], transportColors.body), cylinder("轮组与桥梁间可回转的承重鞍座", [0, 1.65, end * 10], [1.2, 1.1, 1.2], transportColors.dark), box("桥梁高位端架承重横梁", [0, 2.35, end * 9.6], [3.3, 0.36, 0.65], transportColors.signal));
      for (const side of [-1, 1]) parts.push(strut("从悬载纵梁抬升至轮组承台的端部斜架", [side * 1.8, 1.07, end * 6.8], [side * 1.5, 2.35, end * 9.6], 0.42, transportColors.signal), ...hydraulic("端架高度调节液压缸", [side * 1.16, 1.14, end * 10.2], [side * 1.32, 1.73, end * 9.95], [side * 1.49, 2.27, end * 9.7], 0.19), box("承重台车外侧防滑维护走道", [side * 1.44, 1.23, end * 10], [0.28, 0.08, 4.9], transportColors.dark));
    }
    for (const side of [-1, 1]) {
      parts.push(box("中间开放悬载区两侧的连续箱形纵梁", [side * 1.8, 1.07, 0], [0.42, 0.64, 13.7], transportColors.signal), box("纵梁顶端连续受拉翼缘", [side * 1.8, 1.42, 0], [0.6, 0.08, 13.75], transportColors.body));
      for (const z of [-4.4, 4.4]) parts.push(box("向内承托负载而保留底部空腔的独立支座", [side * 1.52, 0.93, z], [0.65, 0.2, 1.0], transportColors.dark));
      for (const z of [-5.6, -2.8, 0, 2.8, 5.6]) parts.push(box("纵梁外壁竖向腹板加劲肋", [side * 2.03, 1.07, z], [0.05, 0.61, 0.12], transportColors.body));
      parts.push(strut("前转向台车至牵引环的V形拖曳杆", [side * 0.95, 0.77, -12.35], [0, 0.77, -14.7], 0.15, transportColors.dark));
    }
    parts.push(ring("连接外部牵引车的真正贯通拖环", transportColors.body, 0.16, 0.065, 0.77, 0.1, { position: { x: 0, y: 0.77, z: -14.76 } }), box("尾转向台车后部灯具承梁", [0, 1.03, 12.7], [2.9, 0.25, 0.12], transportColors.dark));
    for (const side of [-1, 1]) parts.push(box("尾部组合制动警示灯", [side * 1.18, 1.06, 12.775], [0.38, 0.16, 0.035], transportColors.signal));
    return parts;
  } },
];
