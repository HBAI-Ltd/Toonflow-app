import { beam, part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, ball, strut, wheel, transportColors, type TransportDefinition } from "./parts";

function coil(position: Triple, radius: number, height: number, turns: number, wire = 0.005): ModelPart {
  return part("连续螺旋承载弹簧", "tube", transportColors.dark, position, [1, 1, 1], [0, 0, 0], {
    radius: wire,
    path: Array.from({ length: 49 }, (_, index) => { const angle = index / 48 * turns * Math.PI * 2; return { x: Math.cos(angle) * radius, y: index / 48 * height, z: Math.sin(angle) * radius }; }),
  });
}

function eye(name: string, position: Triple, radius: number, thickness: number, rotation: Triple = [0, 0, 90]): ModelPart {
  const value = ring(name, transportColors.body, radius, thickness, 0, thickness * 1.8);
  value.position = { x: position[0], y: position[1], z: position[2] };
  value.rotation = { x: rotation[0], y: rotation[1], z: rotation[2] };
  return value;
}

// 构造类别参照 NTN-SNR 的悬架技术说明；各坐标为自制简化原型，不对应品牌零件尺寸。
// https://www.ntn-snr.com/sites/default/files/2017-03/suspension_en.pdf
export const roadExpansionBatchOne: TransportDefinition[] = [
  { name: "麦弗逊支柱式前轮悬架总成", theme: "现代", itemType: "构件", tags: ["汽车悬架", "麦弗逊", "承重滑柱"], create: () => {
    const parts: ModelPart[] = [...wheel([0.28, 0.32, 0], 0.3, 0.17), cylinder("与车轮相连的转向节轴颈", [0.19, 0.32, 0], [0.075, 0.28, 0.075], transportColors.body, [0, 0, 90]), box("夹住滑柱底端的转向节", [0.11, 0.4, 0], [0.12, 0.22, 0.09]), cylinder("承受侧向力的减振支柱外筒", [0.09, 0.57, 0], [0.07, 0.34, 0.07]), cylinder("从外筒伸向顶座的活塞杆", [0.09, 0.79, 0], [0.028, 0.2, 0.028], transportColors.trim), cylinder("下弹簧承托盘", [0.09, 0.56, 0], [0.23, 0.022, 0.23], transportColors.body), coil([0.09, 0.575, 0], 0.088, 0.3, 5), cylinder("弹簧上隔振压盘", [0.09, 0.89, 0], [0.22, 0.025, 0.22], transportColors.dark), cylinder("车身连接顶轴承座", [0.09, 0.932, 0], [0.17, 0.055, 0.17]), ball("下摆臂球头", [0.12, 0.225, 0], [0.055, 0.055, 0.055], transportColors.dark)];
    for (const z of [-0.2, 0.2]) parts.push(strut("下三角摆臂的独立分叉", [-0.36, 0.2, z], [0.12, 0.225, 0], 0.035), cylinder("摆臂车身侧橡胶衬套", [-0.36, 0.2, z], [0.065, 0.095, 0.065], transportColors.dark, [90, 0, 0]));
    parts.push(strut("三角摆臂内侧连边", [-0.36, 0.2, -0.2], [-0.36, 0.2, 0.2], 0.03), strut("球头至转向节底端的短立销", [0.12, 0.225, 0], [0.11, 0.33, 0], 0.022), strut("转向横拉杆", [-0.35, 0.36, -0.17], [0.11, 0.36, -0.085], 0.022), box("横拉杆连接的转向臂", [0.11, 0.35, -0.06], [0.065, 0.055, 0.13]));
    return parts;
  } },
  { name: "上下双叉臂独立车轮悬架", theme: "现代", itemType: "构件", tags: ["汽车悬架", "双横臂", "独立转向节"], create: () => {
    const parts: ModelPart[] = [...wheel([0.35, 0.32, 0], 0.3, 0.18), strut("上下球头之间的独立立式转向节", [0.22, 0.23, 0], [0.2, 0.51, 0], 0.045), cylinder("连接轮毂的横向轴颈", [0.28, 0.32, 0], [0.07, 0.25, 0.07], transportColors.body, [0, 0, 90]), cylinder("底座至上横梁的减振外筒", [-0.15, 0.39, 0], [0.06, 0.25, 0.06]), cylinder("减振器上端活塞杆", [-0.15, 0.59, 0], [0.025, 0.18, 0.025], transportColors.trim), coil([-0.15, 0.3, 0], 0.07, 0.3, 5), cylinder("叉臂间螺旋弹簧下托盘", [-0.15, 0.29, 0], [0.18, 0.02, 0.18]), cylinder("连接车身的上弹簧座", [-0.15, 0.61, 0], [0.18, 0.025, 0.18])];
    for (const [y, x, span] of [[0.23, 0.22, 0.21], [0.51, 0.2, 0.15]]) {
      for (const side of [-1, 1]) parts.push(strut("上下叉臂的开口V形承力支臂", [-0.36, y, side * span!], [x!, y, 0], 0.028), cylinder("叉臂内枢轴衬套", [-0.36, y, side * span!], [0.052, 0.075, 0.052], transportColors.dark, [90, 0, 0]));
      parts.push(ball("外端独立球铰", [x!, y, 0], [0.055, 0.055, 0.055]));
    }
    parts.push(strut("弹簧下座至下叉臂的承托横边", [-0.15, 0.25, -0.135], [-0.15, 0.25, 0.135], 0.03), box("承托横边上的弹簧座短台", [-0.15, 0.265, 0], [0.1, 0.05, 0.08]), strut("上弹簧座车身安装横梁", [-0.35, 0.62, 0], [-0.03, 0.62, 0], 0.045));
    return parts;
  } },
  { name: "半独立扭力梁式后轮车桥", theme: "现代", itemType: "构件", tags: ["汽车后桥", "扭力梁", "纵向拖曳臂"], create: () => {
    const parts: ModelPart[] = [box("可扭转横梁的下壁", [0, 0.245, 0.04], [1.27, 0.018, 0.19]), ...[-1, 1].map(side => box("开放槽形横梁的侧壁", [0, 0.29, 0.04 + side * 0.085], [1.27, 0.09, 0.018]))];
    for (const side of [-1, 1]) parts.push(...wheel([side * 0.77, 0.31, 0.37], 0.3, 0.16), strut("由前枢轴延伸至后轮的拖曳臂", [side * 0.62, 0.27, -0.42], [side * 0.65, 0.31, 0.37], 0.075), cylinder("拖曳臂前端弹性枢轴", [side * 0.62, 0.27, -0.42], [0.11, 0.14, 0.11], transportColors.dark, [0, 0, 90]), cylinder("连接后轮的短轴颈", [side * 0.7, 0.31, 0.37], [0.075, 0.22, 0.075], transportColors.body, [0, 0, 90]), cylinder("后弹簧下承台", [side * 0.56, 0.36, 0.28], [0.21, 0.025, 0.21]), coil([side * 0.56, 0.375, 0.28], 0.075, 0.265, 4), cylinder("后弹簧上隔振垫", [side * 0.56, 0.65, 0.28], [0.2, 0.025, 0.2], transportColors.dark), cylinder("轮旁独立液压减振筒", [side * 0.66, 0.47, 0.45], [0.045, 0.3, 0.045]), cylinder("减振筒上伸活塞杆", [side * 0.66, 0.68, 0.45], [0.018, 0.18, 0.018], transportColors.trim), eye("减振器上端安装眼", [side * 0.66, 0.78, 0.45], 0.027, 0.009));
    return parts;
  } },
  { name: "叠片钢板弹簧承托刚性驱动车桥", theme: "现代", itemType: "构件", tags: ["板簧车桥", "刚性后桥", "叠片弹簧"], create: () => {
    const parts: ModelPart[] = [cylinder("左右车轮共用刚性桥管", [0, 0.33, 0], [0.105, 1.55, 0.105], transportColors.dark, [0, 0, 90]), ball("桥管中央差速传动封闭壳", [0, 0.33, 0], [0.32, 0.3, 0.25]), cylinder("差速传动输入法兰轴颈", [0, 0.33, -0.19], [0.11, 0.23, 0.11], transportColors.body, [90, 0, 0])];
    for (const side of [-1, 1]) {
      parts.push(...wheel([side * 0.8, 0.33, 0], 0.32, 0.19));
      for (let layer = 0; layer < 4; layer++) {
        const length = 1.05 - layer * 0.18, points = Array.from({ length: 7 }, (_, index) => { const z = (index / 6 - 0.5) * length; return { x: z, y: 0.205 - layer * 0.009 + z * z * 0.42 }; });
        parts.push(part("各层长度递减的连续弧形簧片", "extrude", transportColors.dark, [side * 0.55, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.065, profile: [...points, ...points.toReversed().map(point => ({ x: point.x, y: point.y - 0.008 }))] }));
      }
      for (const z of [-0.525, 0.525]) parts.push(eye("最上层簧片的真实卷耳", [side * 0.55, 0.32, z], 0.026, 0.008), strut("卷耳到簧片端部的短接颈", [side * 0.55, 0.32, z], [side * 0.55, 0.32, z * 0.96], 0.015));
      parts.push(box("桥管与簧片间的下压板", [side * 0.55, 0.15, 0], [0.12, 0.025, 0.2]), box("把桥管载荷传至簧片中央的承托鞍", [side * 0.55, 0.25, 0], [0.085, 0.1, 0.15]));
      for (const x of [-0.045, 0.045]) parts.push(part("绕过桥管并拧紧压板的U形骑马螺栓", "tube", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.006, path: [{ x: side * 0.55 + x, y: 0.15, z: -0.058 }, { x: side * 0.55 + x, y: 0.33, z: -0.058 }, { x: side * 0.55 + x, y: 0.388, z: 0 }, { x: side * 0.55 + x, y: 0.33, z: 0.058 }, { x: side * 0.55 + x, y: 0.15, z: 0.058 }] }));
    }
    return parts;
  } },
  { name: "卷收锁止式汽车三点安全带", theme: "现代", itemType: "构件", tags: ["三点安全带", "肩带与腰带", "惯性卷收器"], create: () => {
    const parts: ModelPart[] = [box("内含卷簧的带轴卷收壳", [-0.27, 0.12, 0.035], [0.1, 0.14, 0.085], transportColors.dark), cylinder("卷收器中心带轴端头", [-0.27, 0.12, -0.015], [0.048, 0.018, 0.048], transportColors.body, [90, 0, 0]), eye("肩部穿带导向环", [-0.27, 1.03, 0], 0.036, 0.009, [90, 0, 0]), eye("下端车身固定带眼", [-0.27, 0.015, 0], 0.023, 0.008, [90, 0, 0]), beam("沿座椅外侧上行至肩部的织带", transportColors.dark, [-0.27, 0.18, 0], [-0.27, 1.015, 0], 0.045, 0.0025), beam("斜跨乘员肩胸的平织带", transportColors.dark, [-0.27, 1.025, -0.01], [0.25, 0.31, -0.01], 0.045, 0.0025), beam("由锁舌横跨腰部回到下锚点的织带", transportColors.dark, [0.25, 0.31, -0.01], [-0.27, 0.03, -0.01], 0.045, 0.0025), box("扣住锁舌的独立锁扣", [0.28, 0.25, -0.005], [0.055, 0.09, 0.045], transportColors.dark), box("锁扣上端释放按钮", [0.28, 0.299, -0.005], [0.041, 0.013, 0.036], transportColors.signal), strut("锁扣至车身的短硬带柄", [0.28, 0.21, 0], [0.34, 0.04, 0], 0.018), eye("锁扣柄末端固定孔", [0.34, 0.025, 0], 0.023, 0.007, [90, 0, 0]), box("织带与锁扣间的金属锁舌", [0.255, 0.312, -0.005], [0.035, 0.034, 0.012], transportColors.trim)];
    return parts;
  } },
  { name: "双枢轴曲柄连杆汽车雨刮总成", theme: "现代", itemType: "构件", tags: ["雨刮器", "曲柄连杆", "双摆臂"], create: () => {
    const parts: ModelPart[] = [cylinder("偏置减速雨刮电机", [-0.28, 0.075, 0.1], [0.085, 0.17, 0.085], transportColors.dark, [0, 0, 90]), box("电机端部蜗轮减速壳", [-0.15, 0.08, 0.1], [0.12, 0.09, 0.12]), box("把电机与两枢轴连接的薄安装梁", [0.05, 0.055, 0], [0.88, 0.025, 0.055]), strut("电机输出短曲柄", [-0.15, 0.14, 0.1], [-0.2, 0.14, 0.03], 0.022), strut("曲柄至主摆轴的驱动连杆", [-0.2, 0.14, 0.03], [-0.33, 0.14, -0.06], 0.014), strut("使两摆轴同步的平行长连杆", [-0.33, 0.14, -0.06], [0.37, 0.14, -0.06], 0.014)];
    for (const x of [-0.3, 0.4]) parts.push(cylinder("穿过安装梁的独立雨刮枢轴", [x, 0.105, 0], [0.03, 0.13, 0.03]), strut("下层同步摆轴曲柄", [x, 0.14, 0], [x - 0.03, 0.14, -0.06], 0.022), strut("风挡上方的弹簧加载刮臂", [x, 0.175, 0], [x + 0.12, 0.27, -0.31], 0.018), strut("刮臂上段至刮片座", [x + 0.12, 0.27, -0.31], [x + 0.17, 0.255, -0.44], 0.012), box("与刮臂末端相接的长条刮片脊梁", [x + 0.17, 0.255, -0.44], [0.47, 0.018, 0.026], transportColors.body), box("贴合风挡的柔性刮水橡胶", [x + 0.17, 0.242, -0.44], [0.49, 0.009, 0.018], transportColors.dark));
    return parts;
  } },
  { name: "铰轴折叠支座式汽车外后视镜", theme: "现代", itemType: "构件", tags: ["汽车后视镜", "外后视镜", "折叠镜座"], create: () => [
    part("圆角收分的后视镜外罩", "extrude", transportColors.body, [0.09, 0.18, 0.015], [1, 1, 1], [0, 0, 0], { depth: 0.075, profile: [{ x: -0.16, y: -0.055 }, { x: 0.1, y: -0.055 }, { x: 0.17, y: -0.025 }, { x: 0.16, y: 0.055 }, { x: 0.09, y: 0.08 }, { x: -0.14, y: 0.065 }, { x: -0.17, y: 0.025 }] }),
    part("外罩前方实际可见的镜片面", "extrude", transportColors.glass, [0.09, 0.18, -0.025], [1, 1, 1], [0, 0, 0], { depth: 0.003, profile: [{ x: -0.145, y: -0.044 }, { x: 0.095, y: -0.044 }, { x: 0.15, y: -0.018 }, { x: 0.14, y: 0.046 }, { x: 0.084, y: 0.066 }, { x: -0.132, y: 0.051 }, { x: -0.15, y: 0.02 }] }),
    strut("从镜壳下端延向门板的支颈", [-0.03, 0.15, 0.04], [-0.13, 0.08, 0.1], 0.045), cylinder("允许镜座向后折叠的竖直铰轴", [-0.14, 0.075, 0.1], [0.052, 0.1, 0.052], transportColors.dark), part("与门板相贴的三角安装足", "extrude", transportColors.dark, [-0.18, 0.075, 0.105], [1, 1, 1], [0, 90, 0], { depth: 0.025, profile: [{ x: -0.075, y: -0.065 }, { x: 0.07, y: -0.065 }, { x: 0.04, y: 0.105 }, { x: -0.025, y: 0.075 }] }),
  ] },
  { name: "带滚轮限位带的汽车门铰链", theme: "现代", itemType: "构件", tags: ["车门铰链", "门限位器", "穿销铰接"], create: () => {
    const parts: ModelPart[] = [box("固定车身的厚铰链页", [-0.055, 0.09, 0], [0.085, 0.12, 0.012]), box("固定车门的活动铰链页", [0.055, 0.09, 0.018], [0.085, 0.12, 0.012]), cylinder("贯穿三段交错铰套的立销", [0, 0.09, 0.015], [0.012, 0.15, 0.012], transportColors.trim), cylinder("铰销上端防退帽", [0, 0.169, 0.015], [0.024, 0.008, 0.024]), cylinder("铰链下段固定销套", [0, 0.046, 0.015], [0.035, 0.033, 0.035]), cylinder("铰链上段固定销套", [0, 0.134, 0.015], [0.035, 0.033, 0.035]), cylinder("中部随车门转动的独立销套", [0, 0.09, 0.015], [0.034, 0.045, 0.034], transportColors.signal), box("门内限位器小壳体", [0.155, 0.05, 0.015], [0.07, 0.07, 0.065], transportColors.dark), box("穿过双压辊的扁平限位带", [0.075, 0.05, 0.015], [0.2, 0.012, 0.022]), eye("限位带固定端真实穿销孔", [-0.035, 0.05, 0.015], 0.017, 0.006, [90, 0, 0]), box("防止限位带拔出的末端止块", [0.19, 0.05, 0.015], [0.018, 0.035, 0.035])];
    for (const side of [-1, 1]) parts.push(cylinder("夹住限位带上下表面的滚轮", [0.145, 0.05 + side * 0.023, 0.015], [0.032, 0.045, 0.032], transportColors.trim, [90, 0, 0]));
    return parts;
  } },
  { name: "双转爪锁止式汽车门锁组件", theme: "现代", itemType: "构件", tags: ["汽车门锁", "旋转锁爪", "锁扣柱"], create: () => {
    const parts: ModelPart[] = [box("门锁后侧承托薄板", [0, 0.075, 0.026], [0.13, 0.15, 0.008]), ...[-1, 1].map(side => box("锁爪侧面壳体边墙", [side * 0.064, 0.075, 0.01], [0.009, 0.15, 0.04], transportColors.dark)), box("门锁上边封板", [0, 0.148, 0.01], [0.13, 0.01, 0.04], transportColors.dark), cylinder("旋转锁爪支承销", [-0.018, 0.073, 0.005], [0.012, 0.055, 0.012], transportColors.trim, [90, 0, 0]), part("真正包住锁柱的开口旋转叉爪", "extrude", transportColors.body, [-0.018, 0.073, 0], [1, 1, 1], [0, 0, -20], { depth: 0.014, profile: [{ x: -0.035, y: -0.04 }, { x: 0.025, y: -0.04 }, { x: 0.045, y: -0.015 }, { x: 0.045, y: 0.032 }, { x: 0.018, y: 0.04 }, { x: 0.018, y: 0.005 }, { x: 0.003, y: -0.008 }, { x: -0.01, y: 0.005 }, { x: -0.01, y: 0.04 }, { x: -0.035, y: 0.028 }] }), part("抵住旋转叉爪台肩的独立棘爪", "extrude", transportColors.signal, [0.028, 0.112, -0.001], [1, 1, 1], [0, 0, 0], { depth: 0.015, profile: [{ x: -0.026, y: -0.019 }, { x: -0.008, y: -0.025 }, { x: 0.018, y: 0.005 }, { x: 0.011, y: 0.02 }, { x: -0.008, y: 0.014 }] }), cylinder("棘爪独立回转支销", [0.032, 0.122, 0], [0.01, 0.04, 0.01], transportColors.trim, [90, 0, 0]), strut("车内把手释放拉杆", [0.035, 0.13, 0], [0.09, 0.21, 0], 0.007), box("车框锁扣柱安装基片", [-0.005, 0.025, -0.065], [0.105, 0.028, 0.012]), strut("从基片伸出的锁扣柱第一腿", [-0.035, 0.025, -0.06], [-0.035, 0.06, -0.02], 0.012), strut("锁扣柱真正横跨的圆杆", [-0.035, 0.06, -0.02], [0.027, 0.06, -0.02], 0.012), strut("锁扣柱返回安装基片的第二腿", [0.027, 0.06, -0.02], [0.027, 0.025, -0.06], 0.012)];
    return parts;
  } },
];
