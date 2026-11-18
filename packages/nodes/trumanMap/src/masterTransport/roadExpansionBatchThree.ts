import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, cab, wheel, transportColors, type TransportDefinition } from "./parts";

function openBucket(position: Triple, width: number, height: number, depth: number): ModelPart[] {
  const profile = [[-0.55, 0], [0.35, 0], [0.55, 0.22], [0.48, 1], [0.38, 1], [0.44, 0.25], [0.3, 0.11], [-0.55, 0.11]].map(([x, y]) => ({ x: x! * depth, y: y! * height }));
  const sideProfile = [[-0.55, 0], [0.35, 0], [0.55, 0.22], [0.48, 1], [0.3, 1], [-0.47, 0.32]].map(([x, y]) => ({ x: x! * depth, y: y! * height }));
  return [part("前口敞开的连续铲斗底板与弧背", "extrude", transportColors.signal, position, [1, 1, 1], [0, -90, 0], { profile, depth: width }), ...[-1, 1].map(side => part("铲斗封闭两侧薄板", "extrude", transportColors.signal, [position[0] + side * (width / 2 - 0.03), position[1], position[2]], [1, 1, 1], [0, -90, 0], { profile: sideProfile, depth: 0.06 })), box("铲斗前缘可更换的贯通切削刃", [position[0], position[1] + height * 0.06, position[2] - depth * 0.55], [width + 0.07, height * 0.12, depth * 0.09], transportColors.trim)];
}

function ram(name: string, start: Triple, joint: Triple, end: Triple, diameter: number): ModelPart[] {
  const direction = end.map((value, index) => value - start[index]!) as Triple;
  const lengthSquared = direction.reduce((sum, value) => sum + value * value, 0);
  const fraction = Math.max(0.1, Math.min(0.9, direction.reduce((sum, value, index) => sum + value * (joint[index]! - start[index]!), 0) / lengthSquared));
  const axisJoint = start.map((value, index) => value + direction[index]! * fraction) as Triple;
  return [{ ...strut(`${name}外筒`, start, axisJoint, diameter), shape: "cylinder" }, { ...strut(`${name}外露活塞杆`, axisJoint, end, diameter * 0.48, transportColors.trim), shape: "cylinder" }];
}

function heavyAxles(track: number, positions: number[], radius: number, width: number): ModelPart[] {
  return positions.flatMap(z => [cylinder("左右轮连接的承载桥管", [0, radius, z], [0.14, track, 0.14], transportColors.dark, [0, 0, 90]), ...[-1, 1].flatMap(side => wheel([side * track / 2, radius, z], radius, width))]);
}

// 完整机种构造参考制造商类别说明；不对应其型号、外观品牌或工程尺寸。
// https://www.cat.com/en_US/products/new/equipment/wheel-tractor-scrapers/open-bowl-scrapers/125868.html
// https://www.liebherr.com/en-int/earthmoving/products/wheel-loaders-5376615
// https://menzimuck.com/en/product/
export const roadExpansionBatchThree: TransportDefinition[] = [
  { name: "鹅颈铰接式自行开口斗铲运机", theme: "现代", tags: ["自行铲运机", "切土装载与顶推卸料", "开口铲斗"], create: () => {
    const parts: ModelPart[] = [...heavyAxles(3.15, [-3.8, 3.65], 0.88, 0.55), box("前部单轴牵引动力架", [0, 1.2, -3.72], [1.8, 0.35, 2.6], transportColors.dark), box("前端散热发动机罩", [0.32, 1.88, -4.35], [1.7, 1.05, 1.55], transportColors.signal), box("前发动机散热格栅", [0.32, 1.88, -5.14], [1.45, 0.8, 0.045], transportColors.dark), ...cab([-0.65, 1.48, -3], [1.25, 1.7, 1.35]), cylinder("前动力头与鹅颈间的立式转向主销", [0, 1.7, -2.38], [0.42, 0.95, 0.42]), strut("前部抬升绕过料斗闸门的鹅颈", [0, 1.9, -2.38], [0, 3.15, -1.4], 0.42, transportColors.signal), strut("高位鹅颈后伸承梁", [0, 3.15, -1.4], [0, 2.92, -0.15], 0.42, transportColors.signal), box("鹅颈后端分叉横梁", [0, 2.85, -0.1], [3.2, 0.35, 0.45], transportColors.signal), box("可下放切土的铲斗底板", [0, 0.67, 1.36], [2.95, 0.14, 4.68], transportColors.dark), box("铲斗前方开放切土口的耐磨刃", [0, 0.65, -1.03], [3.05, 0.14, 0.22], transportColors.trim), box("铲斗后方的横向车桥承框", [0, 1.15, 3.7], [3.1, 0.45, 0.7], transportColors.dark), box("在斗腔中沿纵向推送土料的卸料推板", [0, 1.5, 2.93], [2.73, 1.53, 0.15], transportColors.body), box("推板后液压装置支承梁", [0, 1.45, 3.6], [2.5, 0.25, 0.35]), ...ram("卸料推板纵向驱动缸", [0, 1.45, 3.6], [0, 1.45, 3.25], [0, 1.45, 3.01], 0.18)];
    for (const side of [-1, 1]) {
      parts.push(box("前后贯通的铲斗薄侧墙", [side * 1.46, 1.48, 1.36], [0.15, 1.68, 4.68], transportColors.signal), strut("鹅颈分叉至料斗外侧的承力叉臂", [side * 1.5, 2.84, -0.1], [side * 1.6, 1.92, 1.1], 0.23, transportColors.signal), cylinder("叉臂与料斗之间的横向枢销", [side * 1.58, 1.92, 1.1], [0.23, 0.5, 0.23], transportColors.body, [0, 0, 90]), ...ram("独立铲斗升降液压缸", [side * 1.25, 2.85, -0.08], [side * 1.3, 2.08, 0.18], [side * 1.35, 1.18, 0.5], 0.17), strut("弧形前闸门的外侧摆臂", [side * 1.55, 1.8, 0.3], [side * 1.55, 2.05, -1.12], 0.14, transportColors.signal), ...ram("抬升前闸门的侧向液压缸", [side * 1.61, 1.4, 0.7], [side * 1.6, 1.7, -0.2], [side * 1.55, 2.05, -1.12], 0.12), strut("铰接转向推拉缸", [side * 0.6, 1.55, -2.9], [side * 0.95, 1.6, -1.85], 0.14));
      parts.push(cylinder("把弧形前闸门实际接到摆臂的横销", [side * 1.5, 2.05, -1.12], [0.16, 0.3, 0.16], transportColors.body, [0, 0, 90]));
      for (const z of [-0.45, 1.2, 2.8]) parts.push(box("料斗侧壁外部竖向加强肋", [side * 1.55, 1.48, z], [0.08, 1.55, 0.12], transportColors.body));
    }
    parts.push(part("在切土口上方抬起的连续弧形前闸门", "extrude", transportColors.signal, [0, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 2.92, profile: [{ x: -1.05, y: 1.03 }, { x: -1.3, y: 1.32 }, { x: -1.38, y: 1.82 }, { x: -1.12, y: 2.16 }, { x: -1.04, y: 2.1 }, { x: -1.27, y: 1.79 }, { x: -1.2, y: 1.37 }, { x: -0.97, y: 1.1 }] }), cylinder("驾驶室后方竖向排气管", [0.55, 2.67, -3], [0.14, 1.3, 0.14], transportColors.dark), box("机器最后端推土机助推缓冲板", [0, 1.15, 4.22], [1.65, 0.6, 0.25], transportColors.body));
    return parts;
  } },
  { name: "中央铰接Z形反转连杆轮式装载机", theme: "现代", tags: ["铰接轮式装载机", "Z形翻斗连杆", "前装载机"], create: () => {
    const parts: ModelPart[] = [...heavyAxles(2.3, [-1.45, 1.65], 0.7, 0.5), box("承载前桥与举升臂的前半车架", [0, 0.98, -1.1], [1.35, 0.34, 2.45], transportColors.dark), box("承载发动机与驾驶室的后半车架", [0, 1.02, 1.23], [1.6, 0.36, 2.45], transportColors.dark), cylinder("前后车架中央转向立销", [0, 1.1, 0.12], [0.36, 0.65, 0.36], transportColors.body), box("车尾发动机与配重箱体", [0, 1.7, 2.02], [1.87, 0.97, 1.45], transportColors.signal), box("车尾散热格栅", [0, 1.72, 2.76], [1.55, 0.66, 0.045], transportColors.dark), ...cab([0, 1.42, 0.82], [1.38, 1.62, 1.45]), ...openBucket([0, 0.27, -3.25], 2.6, 1.05, 1.2), strut("Z形翻斗机构的上段摇臂", [0, 2.08, -1.32], [0, 1.35, -1.62], 0.13, transportColors.signal), cylinder("摇臂支承横销", [0, 1.8, -1.43], [0.18, 1.3, 0.18], transportColors.body, [0, 0, 90]), ...ram("从后支承推向Z形摇臂的翻斗缸", [0, 1.5, -0.28], [0, 1.88, -0.98], [0, 2.08, -1.32], 0.17), strut("摇臂下端至斗背的反向翻斗连杆", [0, 1.35, -1.62], [0, 1.05, -2.67], 0.11, transportColors.body)];
    for (const side of [-1, 1]) {
      parts.push(strut("从前车架抬起的举升主臂", [side * 0.56, 1.43, -0.22], [side * 0.56, 1.8, -1.43], 0.18, transportColors.signal), strut("举升主臂弯向斗背的前端", [side * 0.56, 1.8, -1.43], [side * 0.56, 0.87, -2.65], 0.18, transportColors.signal), ...ram("左右独立举升液压缸", [side * 0.52, 0.97, -0.7], [side * 0.55, 1.49, -1.16], [side * 0.56, 1.72, -1.4], 0.14), cylinder("铲斗耳板横向主销", [side * 0.56, 0.87, -2.65], [0.17, 0.32, 0.17], transportColors.body, [0, 0, 90]), box("把铲斗销耳接到斗背的安装板", [side * 0.56, 0.87, -2.68], [0.1, 0.3, 0.24], transportColors.signal), ...ram("中央铰接转向液压缸", [side * 0.55, 1.04, 0.75], [side * 0.68, 1.04, 0.23], [side * 0.68, 1.04, -0.33], 0.12));
      for (const z of [-1.45, 1.65]) parts.push(box("轮胎上方分离式防泥翼板", [side * 1.15, 1.49, z], [0.65, 0.08, 1.3], transportColors.body));
      parts.push(strut("驾驶室登车手扶杆", [side * 0.78, 1.22, 0.4], [side * 0.78, 2.37, 0.4], 0.035), ...[0.66, 0.93, 1.2].map(y => box("驾驶室外置登车阶", [side * 0.88, y, 0.62], [0.34, 0.06, 0.45], transportColors.dark)));
    }
    parts.push(strut("举升臂后端共用支承横梁", [-0.67, 1.43, -0.22], [0.67, 1.43, -0.22], 0.22), cylinder("发动机罩旁排气立管", [0.54, 2.45, 1.72], [0.11, 1.1, 0.11], transportColors.dark));
    return parts;
  } },
  { name: "四支腿独立调姿步履式液压挖掘机", theme: "现代", tags: ["步履式挖掘机", "蜘蛛挖掘机", "四腿轮足底盘"], create: () => {
    const parts: ModelPart[] = [box("四支腿连接的中央下车架", [0, 1.2, 0], [1.35, 0.38, 1.55], transportColors.dark), cylinder("上车体承重回转支承", [0, 1.48, 0], [1.5, 0.2, 1.5], transportColors.body), box("回转体上层工作台", [0, 1.66, 0.05], [1.8, 0.25, 1.95], transportColors.signal), ...cab([-0.43, 1.78, -0.18], [0.98, 1.4, 1.3]), box("驾驶室后方发动机与弧背配重", [0.05, 1.96, 0.93], [1.55, 0.6, 0.68], transportColors.signal), strut("从回转体前端抬升的独立动臂", [0.45, 1.93, -0.52], [0.45, 3.34, -1.86], 0.21, transportColors.signal), strut("由高动臂端向工作面下伸的斗杆", [0.45, 3.34, -1.86], [0.45, 1.36, -3.4], 0.17, transportColors.signal), ...ram("挖掘动臂举升缸", [0.45, 1.85, -0.8], [0.45, 2.65, -1.23], [0.45, 3.03, -1.58], 0.14), ...ram("斗杆独立伸屈缸", [0.45, 3.4, -1.77], [0.45, 2.66, -2.35], [0.45, 2.09, -2.83], 0.12), ...openBucket([0.45, 0.55, -3.85], 0.83, 0.86, 0.8), ...ram("铲斗翻转缸", [0.45, 2.42, -2.52], [0.45, 1.96, -2.94], [0.45, 1.54, -3.24], 0.09), strut("翻斗小连杆", [0.45, 1.54, -3.24], [0.45, 1.16, -3.45], 0.06, transportColors.body)];
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      parts.push(strut("各腿独立外摆的上承力臂", [side * 0.55, 1.2, end * 0.61], [side * 1.24, 0.84, end * 0.99], 0.17, transportColors.signal), strut("独立伸向轮足的下承力臂", [side * 1.24, 0.84, end * 0.99], [side * 1.7, 0.51, end * 1.5], 0.13, transportColors.signal), cylinder("支腿车架侧独立回转枢轴", [side * 0.55, 1.2, end * 0.61], [0.2, 0.32, 0.2]), ...ram("每腿高低调姿液压缸", [side * 0.58, 1.29, end * 0.45], [side * 1.12, 0.99, end * 0.87], [side * 1.45, 0.69, end * 1.23], 0.09), ...wheel([side * 1.72, 0.46, end * 1.5], 0.42, 0.24), strut("轮外向下撑地的足臂", [side * 1.61, 0.57, end * 1.43], [side * 1.93, 0.15, end * 1.78], 0.08), box("支腿独立调平承压足板", [side * 1.93, 0.075, end * 1.78], [0.4, 0.15, 0.43], transportColors.dark));
      for (const offset of [-0.1, 0.1]) parts.push(part("嵌入山坡的短锚爪", "extrude", transportColors.body, [side * 1.93 + offset, 0, end * 1.78], [1, 1, 1], [0, 90, 0], { depth: 0.035, profile: [{ x: -0.2, y: 0 }, { x: 0.2, y: 0 }, { x: 0.15, y: 0.12 }, { x: -0.08, y: 0.16 }] }));
    }
    parts.push(cylinder("斗杆末端与铲斗背耳的横向销轴", [0.45, 1.35, -3.4], [0.13, 0.46, 0.13], transportColors.body, [0, 0, 90]), box("铲斗背板至横销的实际承力耳座", [0.45, 1.28, -3.46], [0.25, 0.24, 0.22], transportColors.signal));
    return parts;
  } },
];
