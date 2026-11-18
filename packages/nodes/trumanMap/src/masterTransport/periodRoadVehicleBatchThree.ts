import { type ModelPart, type Triple } from "../assetModelParts";
import { polygon, tube } from "../masterNature/shared";
import { box, cylinder, strut, surface, transportColors, wheel, type TransportDefinition } from "./parts";
import { periodBody, periodCabin, periodFenders, periodGear, periodSides, periodSteering, periodTrim } from "./periodRoadVehicleBatchOne";

function gullDoor(side: number): ModelPart[] {
  const hinge: Triple = [side * 0.19, 1.58, 0.25], a = side * 70 * Math.PI / 180;
  const opened = ([x, y, z]: Triple): Triple => [hinge[0] + (x - hinge[0]) * Math.cos(a) - (y - hinge[1]) * Math.sin(a), hinge[1] + (x - hinge[0]) * Math.sin(a) + (y - hinge[1]) * Math.cos(a), z];
  const outline: [number, number][] = [[-0.55, 1.05], [-0.55, 1.213], [-0.15, 1.58], [0.65, 1.58], [0.98, 1.334], [0.98, 1.05]], window: [number, number][] = [[-0.44, 1.24], [-0.10, 1.48], [0.60, 1.48], [0.87, 1.20]];
  const frame = polygon("带真实开窗及门下沿的上掀鸥翼门侧板", "#a3aaa4", outline, 0.04, [0, 0, 0], [window]), glass = polygon("由鸥翼门实体框承接的独立玻璃", transportColors.glass, window, 0.008);
  for (const value of [frame, glass]) value.vertices = value.vertices!.map(v => { const p = opened([side * 0.68 + v.y - (value === frame ? 0.02 : 0.004), v.z, v.x]); return { x: p[0], y: p[1], z: p[2] }; });
  glass.opacity = 0.40;
  return [frame, glass, surface("由中央车顶铰轴连续连接到门侧板的鸥翼门顶板", "#a3aaa4", [[side * 0.19, 1.58, -0.15], [side * 0.68, 1.58, -0.15], [side * 0.68, 1.58, 0.65], [side * 0.19, 1.58, 0.65]].map(p => opened(p as Triple)), [0, 1, 2, 0, 2, 3]), cylinder("固定中央车顶与活动门顶板共同承接的纵向铰轴", [side * 0.19, 1.58, 0.25], [0.09, 0.90, 0.09], transportColors.trim, [90, 0, 0]), strut("由高门槛撑到门下沿实体的鸥翼门支承杆", [side * 0.70, 1.02, 0.70], opened([side * 0.68, 1.10, 0.70]), 0.045, transportColors.dark)];
}

export const periodRoadVehicleBatchThree: TransportDefinition[] = [
  { name: "圆灯直立三厢小型四门轿车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "直立三厢小型四门轿车", "窄立柱大侧窗", "短前后独立箱体", "六十年代家用轿车"], create: () => {
    const color = "#9eaa9c", parts: ModelPart[] = [
      ...periodGear(0.285, 1.35, -1.13, 1.13),
      ...periodSides("直立小轿车完整四门下围与真实轮拱", [[-2.05, 0.84], [-0.90, 0.94], [1.0, 0.94], [2.0, 0.85]], [-1.13, 1.13], 0.285, 0.70, color),
      periodBody("由短直前机盖与独立平后箱构成的小型三厢车身", [[-2.05, 0.49, 0.40, 0.84], [-0.90, 0.55, 0.40, 0.94], [1.0, 0.55, 0.40, 0.94], [2.0, 0.49, 0.40, 0.85]], color),
      ...periodCabin("平车顶直立四门大窗座舱", [[-0.90, 0.94], [-0.60, 1.47], [0.65, 1.47], [1.0, 0.94]], [[[-0.77, 1.04], [-0.54, 1.38], [-0.05, 1.38], [-0.05, 1.04]], [[0.07, 1.04], [0.07, 1.38], [0.59, 1.38], [0.87, 1.04]]], 0.59, color),
      ...periodTrim(-2.05, 2.0, 0.71, 0.76, 0.33, 0.74),
    ];
    for (const side of [-1, 1]) for (const z of [-0.10, 0.78]) parts.push(box("分别接在前后独立门板上的金属把手", [side * 0.72, 0.87, z], [0.07, 0.035, 0.15], transportColors.trim));
    return parts;
  } },
  { name: "高门槛鸥翼门长机罩双座轿跑车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "鸥翼门双座轿跑车", "高门槛中央车顶铰轴", "长圆收前机罩", "短弧顶双座舱"], create: () => {
    const color = "#a3aaa4", parts: ModelPart[] = [
      ...periodGear(0.31, 1.57, -1.42, 1.38),
      ...periodSides("圆收轿跑车高门槛与实际开敞轮拱侧围", [[-2.35, 0.82], [-0.75, 1.03], [1.4, 1.02], [2.25, 0.83]], [-1.42, 1.38], 0.31, 0.78, color),
      periodBody("长圆机罩与短后甲板构成的低双座承载车身", [[-2.35, 0.53, 0.42, 0.82], [-0.75, 0.68, 0.42, 1.03], [1.4, 0.68, 0.42, 1.02], [2.25, 0.52, 0.42, 0.83]], color),
      box("实际支承两扇鸥翼门铰轴的固定中央车顶脊", [0, 1.58, 0.25], [0.42, 0.075, 0.88], color),
      ...gullDoor(-1), ...gullDoor(1),
      ...periodTrim(-2.35, 2.25, 0.80, 0.76, 0.32, 0.72),
      ...periodSteering([-0.29, 1.30, -0.25], [-0.29, 1.05, -0.60], 0.15),
    ];
    const front = surface("由固定前柱承接而不跟随鸥翼门移动的前风挡", transportColors.glass, [[-0.70, 1.03, -0.75], [0.70, 1.03, -0.75], [0.68, 1.58, -0.15], [-0.68, 1.58, -0.15]], [0, 1, 2, 0, 2, 3]), rear = surface("短双座车顶后方连续降至后甲板的固定后风挡", transportColors.glass, [[-0.68, 1.58, 0.65], [0.68, 1.58, 0.65], [0.70, 1.02, 1.4], [-0.70, 1.02, 1.4]], [0, 1, 2, 0, 2, 3]); front.opacity = 0.40; rear.opacity = 0.40; parts.push(front, rear);
    for (const side of [-1, 1]) parts.push(strut("由高门槛升到中央顶脊之前的固定前风挡边柱", [side * 0.70, 1.03, -0.75], [side * 0.68, 1.58, -0.15], 0.055, color), strut("将中央顶脊后缘接回车身甲板的固定后风挡柱", [side * 0.68, 1.58, 0.65], [side * 0.70, 1.02, 1.4], 0.055, color), box("由车体腰围实际承托的高门槛承力梁", [side * 0.73, 0.99, 0.15], [0.12, 0.22, 1.72], color), box("两侧独立双座坐垫", [side * 0.29, 1.08, 0.30], [0.42, 0.14, 0.55], transportColors.dark), box("与坐垫后缘相接的双座短靠背", [side * 0.29, 1.32, 0.55], [0.42, 0.50, 0.11], transportColors.dark));
    parts.push(strut("在两根固定前风挡柱顶部之间承托中央顶脊的横梁", [-0.68, 1.58, -0.15], [0.68, 1.58, -0.15], 0.055, color), strut("将后风挡固定柱实际连接到中央顶脊的横梁", [-0.68, 1.58, 0.65], [0.68, 1.58, 0.65], 0.055, color));
    return parts;
  } },
  { name: "开放管架窄机罩双座轻量跑车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "管架轻量双座跑车", "敞开三角承载车架", "窄前机罩与外置翼子板", "短直立低前风挡"], create: () => {
    const color = "#b8ab78", parts: ModelPart[] = [
      ...periodGear(0.27, 1.35, -1.10, 1.10, false, 0.24),
      ...periodFenders([-1.10, 1.10], 0.27, 1.35, color),
      periodBody("外露轮组之间由窄车鼻连续升至仪表台的发动机罩", [[-1.65, 0.24, 0.35, 0.55], [-0.25, 0.38, 0.35, 0.78]], color),
      periodBody("乘员舱后方短而独立的尾部车体", [[0.80, 0.40, 0.30, 0.75], [1.50, 0.34, 0.30, 0.70]], color),
      box("在开放管架上承托两个低座位的薄地板", [0, 0.39, 0.40], [0.84, 0.12, 1.50], transportColors.dark),
      tube("从后舱两侧实际升起并连续跨过双座的U形防滚架", transportColors.dark, [[-0.40, 0.70, 0.80], [-0.40, 1.15, 0.80], [0.40, 1.15, 0.80], [0.40, 0.70, 0.80]], 0.035),
      ...periodSteering([-0.21, 0.92, -0.02], [-0.21, 0.69, -0.30], 0.14),
    ];
    const windscreen = surface("窄发动机罩之后的低透明前风挡", transportColors.glass, [[-0.38, 0.77, -0.23], [0.38, 0.77, -0.23], [0.38, 1.15, -0.05], [-0.38, 1.15, -0.05]], [0, 1, 2, 0, 2, 3]); windscreen.opacity = 0.40; parts.push(windscreen);
    for (const side of [-1, 1]) {
      parts.push(strut("外露车架纵向下弦杆", [side * 0.42, 0.33, -0.25], [side * 0.42, 0.33, 0.90], 0.05), strut("开放座舱车架上弦杆", [side * 0.42, 0.74, -0.25], [side * 0.42, 0.70, 0.90], 0.045), strut("把上下弦连接成三角承力面的后斜杆", [side * 0.42, 0.33, -0.25], [side * 0.42, 0.70, 0.90], 0.045), strut("前发动机舱与乘员地板间的立向接杆", [side * 0.42, 0.33, -0.25], [side * 0.42, 0.74, -0.25], 0.045), strut("前风挡侧柱由机罩实体上接玻璃顶缘", [side * 0.38, 0.76, -0.23], [side * 0.38, 1.15, -0.05], 0.035, transportColors.trim), box("双座低位座垫", [side * 0.20, 0.48, 0.35], [0.32, 0.12, 0.45], transportColors.dark), box("独立低位座椅靠背", [side * 0.20, 0.70, 0.56], [0.32, 0.40, 0.10], transportColors.dark), cylinder("窄车鼻两侧实际支架上的独立前照灯", [side * 0.39, 0.64, -1.35], [0.18, 0.12, 0.18], transportColors.trim, [90, 0, 0]));
      for (const z of [-1.10, 1.10]) parts.push(strut("从承载体实际接至外置轮上翼子板的独立支架", [side * 0.30, 0.45, z], [side * 0.675, 0.63, z], 0.04, color));
      parts.push(strut("把外置前照灯实际承接到窄机罩的短灯架", [side * 0.20, 0.56, -1.35], [side * 0.39, 0.64, -1.35], 0.04, transportColors.trim), box("短后尾车体上的小尾灯", [side * 0.23, 0.59, 1.51], [0.12, 0.09, 0.05], transportColors.signal));
    }
    parts.push(strut("两侧机罩后端与座舱上弦的实体横接梁", [-0.42, 0.74, -0.25], [0.42, 0.74, -0.25], 0.06), strut("低前风挡顶部连续横梁", [-0.38, 1.15, -0.05], [0.38, 1.15, -0.05], 0.035, transportColors.trim));
    return parts;
  } },
  { name: "前置长发动机舱雪茄形单座敞轮赛车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "前置发动机古典大奖赛赛车", "雪茄形车身", "无前后空气翼", "外露刚性车桥与窄驾驶舱"], create: () => {
    const color = "#9b6b58", parts: ModelPart[] = [
      periodBody("在驾驶舱之前保持全长的雪茄形发动机罩", [[-2.25, 0.12, 0.42, 0.75], [-1.40, 0.27, 0.42, 0.86], [-0.20, 0.37, 0.42, 0.94]], color),
      periodBody("真正敞开座舱之下的低承载腹体", [[-0.20, 0.36, 0.40, 0.60], [0.70, 0.36, 0.40, 0.60]], color),
      periodBody("驾驶员之后连续尖收的独立短圆尾罩", [[0.70, 0.36, 0.42, 0.92], [2.00, 0.13, 0.48, 0.73]], color),
      box("在低腹体上实际承接的单人座垫", [0, 0.65, 0.29], [0.44, 0.12, 0.48], transportColors.dark),
      box("接在单座座垫后缘的独立短靠背", [0, 0.88, 0.51], [0.44, 0.46, 0.10], transportColors.dark),
      box("发动机罩后缘固定小挡风片的真实安装座", [0, 0.97, -0.20], [0.65, 0.06, 0.09], transportColors.trim),
      ...periodSteering([0, 0.96, -0.11], [0, 0.72, -0.48], 0.16),
    ];
    const deflector = box("驾驶员正前方独立透明小挡风片", [0, 1.04, -0.20], [0.62, 0.18, 0.025], transportColors.glass, [20, 0, 0]); deflector.opacity = 0.40; parts.push(deflector);
    for (const z of [-1.50, 1.30]) {
      parts.push(cylinder("年代赛车两端轮毂实际贯通的外露刚性车桥", [0, 0.34, z], [0.075, 1.50, 0.075], transportColors.dark, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(...wheel([side * 0.75, 0.34, z], 0.34, 0.18), strut("从外露车桥实际升入中央窄车体的短悬架", [side * 0.18, 0.34, z], [side * 0.18, 0.61, z], 0.055));
    }
    for (const side of [-1, 1]) {
      const wall = polygon("开放单座舱两侧保留连续上围的实体薄壁", color, [[-0.20, 0.94], [0.70, 0.92], [0.70, 0.45], [-0.20, 0.45]], 0.045, [side * 0.36 - 0.0225, 0, 0]); wall.rotation = { x: -90, y: 0, z: -90 }; parts.push(wall);
      for (let index = 0; index < 4; index++) { const z = -1.05 + index * 0.11, width = 0.27 + (z + 1.40) / 1.20 * 0.10; parts.push(box("长发动机罩侧面与实体接合的立向散热叶冠", [side * (width - 0.004), 0.74, z], [0.035, 0.16, 0.035], transportColors.trim)); }
    }
    return parts;
  } },
  { name: "前拱驾驶舱后置动力三排六座小型乘用汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "三排六座微型乘用汽车", "五十年代前拱单厢车身", "前桥上方驾驶位", "后置动力短车体"], create: () => {
    const color = "#8ba49d", parts: ModelPart[] = [
      ...periodGear(0.27, 1.28, -1.02, 1.03),
      ...periodSides("前拱单厢乘用车真实轮拱与短后动力舱侧围", [[-1.80, 0.92], [-1.72, 0.98], [1.05, 0.98], [1.75, 0.88]], [-1.02, 1.03], 0.27, 0.65, color),
      periodBody("在前桥之上容纳驾驶位并连到后动力舱的短宽车身", [[-1.80, 0.48, 0.38, 0.92], [-1.72, 0.51, 0.38, 0.98], [1.05, 0.51, 0.38, 0.98], [1.75, 0.48, 0.38, 0.88]], color),
      ...periodCabin("无前机罩整体前拱三排乘员座舱", [[-1.72, 0.98], [-1.30, 1.55], [0.85, 1.62], [1.65, 0.89]], [[[-1.60, 1.10], [-1.23, 1.45], [-0.68, 1.46], [-0.68, 1.10]], [[-0.56, 1.10], [-0.56, 1.47], [0.15, 1.49], [0.15, 1.10]], [[0.27, 1.10], [0.27, 1.49], [0.80, 1.50], [1.34, 1.10]]], 0.62, "#d0d1bf"),
      ...periodTrim(-1.80, 1.75, 0.66, 0.80, 0.31, 0.74),
      ...periodSteering([-0.25, 1.23, -1.20], [-0.25, 0.98, -1.50], 0.15),
    ];
    for (const z of [-1.0, -0.25, 0.50]) parts.push(box("各排可坐两人的独立窄长座垫", [0, 1.02, z], [1.02, 0.10, 0.48], transportColors.dark), box("对应各排座垫后缘的独立短靠背", [0, 1.22, z + 0.22], [1.02, 0.36, 0.09], transportColors.dark));
    for (let index = 0; index < 4; index++) parts.push(box("后置动力舱后围上实际凸出的金属散热叶冠", [0, 0.58 + index * 0.065, 1.755], [0.70, 0.025, 0.035], transportColors.trim));
    for (const side of [-1, 1]) for (const z of [-0.65, 0.70]) parts.push(box("双侧独立乘员门上的短外把手", [side * 0.67, 0.91, z], [0.07, 0.035, 0.15], transportColors.trim));
    return parts;
  } },
  { name: "长窄透明顶串列双座三轮微型汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "串列双座三轮微型汽车", "透明罩长窄乘员舱", "双前轮单后轮", "前后串列座位"], create: () => {
    const color = "#a6987e", parts: ModelPart[] = [
      cylinder("双前轮之间连续贯通的短横桥", [0, 0.22, -0.55], [0.065, 1.10, 0.065], transportColors.dark, [0, 0, 90]),
      ...[-1, 1].flatMap(side => wheel([side * 0.55, 0.22, -0.55], 0.22, 0.16)),
      ...wheel([0, 0.24, 0.92], 0.24, 0.16),
      cylinder("与双叉臂实际相接的单后轮横向短轴", [0, 0.24, 0.92], [0.06, 0.30, 0.06], transportColors.dark, [0, 0, 90]),
      ...periodFenders([-0.55], 0.22, 1.10, color),
      ...periodSides("串列微型车窄围合舱与前轮真实开口侧板", [[-1.50, 0.55], [-0.85, 0.63], [0.65, 0.70], [1.40, 0.63]], [-0.55], 0.22, 0.43, color),
      periodBody("单后轮上方真正升起底板的前窄后收串列车体", [[-1.50, 0.20, 0.27, 0.55], [-0.65, 0.38, 0.27, 0.65], [0.40, 0.36, 0.27, 0.68], [0.60, 0.28, 0.56, 0.70], [1.40, 0.15, 0.56, 0.63]], color),
      ...periodSteering([0, 0.87, -0.43], [0, 0.63, -0.70], 0.14),
      cylinder("窄前鼻与车身实体相接的中央圆形灯座", [0, 0.43, -1.51], [0.20, 0.08, 0.20], transportColors.trim, [90, 0, 0]),
    ];
    const profile: [number, number][] = [[-0.85, 0.63], [-0.45, 1.12], [0.70, 1.15], [1.12, 0.65]];
    for (const side of [-1, 1]) {
      const glass = polygon("由真实细边框支承的整幅串列舱侧面透明罩", transportColors.glass, profile, 0.008, [side * 0.37 - 0.004, 0, 0]); glass.rotation = { x: -90, y: 0, z: -90 }; glass.opacity = 0.40; parts.push(glass);
      for (let index = 0; index < profile.length; index++) { const a = profile[index]!, b = profile[(index + 1) % profile.length]!; parts.push(strut("沿透明舱罩边缘连续承接车体与罩片的细框", [side * 0.37, a[1], a[0]], [side * 0.37, b[1], b[0]], 0.025, transportColors.trim)); }
      parts.push(strut("前轮横桥到窄车体的实际悬架承接杆", [side * 0.30, 0.22, -0.55], [side * 0.30, 0.52, -0.55], 0.045), strut("从窄车体承接到前轮翼子板的短支架", [side * 0.30, 0.50, -0.55], [side * 0.55, 0.52, -0.55], 0.035, color), strut("单后轮两侧接入抬高后底板的双叉臂", [side * 0.13, 0.24, 0.92], [side * 0.13, 0.60, 0.70], 0.05), box("窄后围与实体接合的独立红色尾灯", [side * 0.09, 0.63, 1.42], [0.10, 0.08, 0.05], transportColors.signal));
    }
    for (let index = 0; index < profile.length - 1; index++) { const a = profile[index]!, b = profile[index + 1]!, glass = surface("透明串列舱罩连续的前顶后面片", transportColors.glass, [[-0.37, a[1], a[0]], [0.37, a[1], a[0]], [0.37, b[1], b[0]], [-0.37, b[1], b[0]]], [0, 1, 2, 0, 2, 3]); glass.opacity = 0.40; parts.push(glass); }
    for (const [z, y] of [profile[1]!, profile[2]!]) parts.push(strut("跨接透明罩左右上边框的实际横框", [-0.37, y, z], [0.37, y, z], 0.025, transportColors.trim));
    for (const z of [-0.28, 0.43]) parts.push(box("串列安排而不并排的单人窄座垫", [0, 0.72, z], [0.48, 0.12, 0.42], transportColors.dark), box("与各自串列座垫相接的单独靠背", [0, 0.94, z + 0.19], [0.48, 0.34, 0.08], transportColors.dark));
    return parts;
  } },
];
