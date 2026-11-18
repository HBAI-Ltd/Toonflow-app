import { type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, surface, transportColors, wheel, type TransportDefinition } from "./parts";
import { periodBody, periodCabin, periodFenders, periodGear, periodSides, periodSteering, periodTrim } from "./periodRoadVehicleBatchOne";

function sternPropeller(x: number): ModelPart[] {
  const parts = [cylinder("与尾部驱动轴实际连接的推进桨实心轮毂", [x, 0.17, 1.90], [0.12, 0.22, 0.12], transportColors.trim, [90, 0, 0])];
  for (let blade = 0; blade < 3; blade++) {
    const a = blade * Math.PI * 2 / 3;
    parts.push(surface("根部嵌入轮毂且保留真实桨间空隙的推进叶片", transportColors.trim, [[0.02, -0.025], [0.125, -0.02], [0.105, 0.045], [0.02, 0.025]].map(([r, t]) => [x + Math.cos(a) * r! - Math.sin(a) * t!, 0.17 + Math.sin(a) * r! + Math.cos(a) * t!, 1.90]), [0, 1, 2, 0, 2, 3]));
  }
  return parts;
}

export const periodRoadVehicleBatchSix: TransportDefinition[] = [
  { name: "低门槛长机罩整体前驱四门轿车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "战前低车身前驱四门轿车", "长机罩窄V形前围", "低门槛整体乘员舱", "独立圆翼板无长踏板"], create: () => {
    const color = "#626f69", parts: ModelPart[] = [
      ...periodGear(0.33, 1.52, -1.55, 1.33),
      ...periodFenders([-1.55, 1.33], 0.33, 1.52, color),
      ...periodSides("低门槛前驱汽车整体门皮与真实开敞轮拱", [[-2.50, 0.86], [-0.70, 0.99], [1.55, 0.99], [2.35, 0.85]], [-1.55, 1.33], 0.33, 0.73, color),
      periodBody("由窄长机罩平顺接入低乘员舱及圆收后箱的承载车体", [[-2.50, 0.45, 0.41, 0.86], [-0.70, 0.61, 0.41, 0.99], [1.55, 0.62, 0.41, 0.99], [2.35, 0.45, 0.41, 0.85]], color),
      ...periodCabin("低门槛长平顶四门乘员舱", [[-0.70, 0.99], [-0.35, 1.65], [1.15, 1.67], [1.55, 0.99]], [[[-0.56, 1.10], [-0.28, 1.54], [0.25, 1.55], [0.25, 1.10]], [[0.38, 1.10], [0.38, 1.55], [1.08, 1.56], [1.40, 1.10]]], 0.60, color),
      ...periodTrim(-2.50, 2.35, 0.75, 0.83, 0.27, 0.74),
    ];
    const grille = polygon("窄长前围上实际接合的下收V形金属水箱面", transportColors.trim, [[-0.25, 0.90], [0.25, 0.90], [0.13, 0.50], [-0.13, 0.50]], 0.05, [0, 0, -2.485]); grille.rotation = { x: -90, y: 0, z: 0 }; parts.push(grille);
    for (const side of [-1, 1]) for (const z of [0.10, 1.25]) parts.push(box("低门槛四门车各自门皮上的金属外把手", [side * 0.75, 0.91, z], [0.065, 0.035, 0.16], transportColors.trim));
    return parts;
  } },
  { name: "中央尾脊长后背流线四门轿车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "尾脊流线四门轿车", "后移大动力舱", "连续长斜背车顶", "中央纵向尾脊与三前灯"], create: () => {
    const color = "#929b93", parts: ModelPart[] = [
      ...periodGear(0.33, 1.60, -1.40, 1.38),
      ...periodSides("长后背尾脊轿车实际保留轮胎空间的完整侧围", [[-2.60, 0.86], [-1.10, 1.05], [0.90, 1.02], [2.50, 0.78]], [-1.40, 1.38], 0.33, 0.79, color),
      periodBody("前舱窄短后动力舱明显延长的整体流线车身", [[-2.60, 0.64, 0.43, 0.86], [-1.10, 0.69, 0.43, 1.05], [0.90, 0.69, 0.43, 1.02], [2.50, 0.45, 0.43, 0.78]], color),
      ...periodCabin("六侧窗连续弧顶长斜后背座舱", [[-1.10, 1.05], [-0.65, 1.58], [0.20, 1.67], [0.90, 1.54], [2.10, 0.84]], [[[-0.95, 1.15], [-0.58, 1.47], [0, 1.55], [0, 1.13]], [[0.12, 1.13], [0.12, 1.56], [0.48, 1.52], [1.10, 1.12]], [[1.22, 1.10], [0.93, 1.43], [1.80, 0.97]]], 0.66, color),
      ...periodTrim(-2.60, 2.50, 0.81, 0.79, 0.25, 0.67),
      cylinder("在前围中央真实接合的第三枚圆形前照灯", [0, 0.81, -2.63], [0.19, 0.10, 0.19], transportColors.trim, [90, 0, 0]),
    ];
    const spine = polygon("从长斜后车顶连续升起并回接后动力甲板的真实纵向尾脊", color, [[0.30, 1.65], [0.90, 1.85], [2.40, 0.92], [2.40, 0.79], [2.10, 0.83], [0.90, 1.53]], 0.045, [-0.0225, 0, 0]); spine.rotation = { x: -90, y: 0, z: -90 }; parts.push(spine);
    for (const side of [-1, 1]) for (const z of [0.04, 1.0]) parts.push(box("前后车门腰线实体上的独立短金属外把手", [side * 0.81, 0.96, z], [0.065, 0.035, 0.16], transportColors.trim));
    return parts;
  } },
  { name: "单前轮双后轮封闭三门微型轿车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "单前轮双后轮三门轿车", "封闭斜背乘员车体", "短平前机盖", "独立中央前轮舱"], create: () => {
    const color = "#a9a476", parts: ModelPart[] = [
      ...wheel([0, 0.25, -0.98], 0.25, 0.17),
      cylinder("单前轮与两侧导向叉实际相接的短横轴", [0, 0.25, -0.98], [0.065, 0.30, 0.065], transportColors.dark, [0, 0, 90]),
      cylinder("双后轮连续贯通的短后车桥", [0, 0.27, 1.05], [0.07, 1.24, 0.07], transportColors.dark, [0, 0, 90]),
      ...[-1, 1].flatMap(side => wheel([side * 0.62, 0.27, 1.05], 0.27, 0.17)),
      ...periodSides("只有双后轮需要侧面轮拱的封闭三门微型车侧壳", [[-1.70, 0.78], [-0.45, 0.87], [0.90, 0.88], [1.65, 0.75]], [1.05], 0.27, 0.56, color),
      periodBody("真正抬起前机盖腹底并保留中央前轮空间的三轮轿车体", [[-1.70, 0.44, 0.57, 0.78], [-0.45, 0.50, 0.57, 0.87], [-0.20, 0.50, 0.36, 0.88], [0.90, 0.50, 0.36, 0.88], [1.65, 0.46, 0.36, 0.75]], color),
      ...periodCabin("独立低机盖之后的短高斜背三门座舱", [[-0.45, 0.87], [-0.12, 1.37], [0.70, 1.40], [1.45, 0.78]], [[[-0.32, 0.98], [-0.06, 1.28], [0.34, 1.30], [0.34, 0.98]], [[0.46, 0.98], [0.46, 1.30], [0.64, 1.29], [1.12, 0.96]]], 0.48, color),
      ...periodTrim(-1.70, 1.65, 0.57, 0.70, 0.27, 0.64),
    ];
    for (const side of [-1, 1]) parts.push(strut("在单前轮两侧将导向叉真实上接前机盖的斜支柱", [side * 0.13, 0.25, -0.98], [side * 0.13, 0.62, -0.83], 0.05), strut("将双后车桥实际承接到乘员舱地板的短悬架", [side * 0.28, 0.27, 1.05], [side * 0.28, 0.57, 1.05], 0.05), box("封闭三门小车侧门后缘的短外把手", [side * 0.58, 0.81, 0.55], [0.065, 0.035, 0.15], transportColors.trim));
    return parts;
  } },
  { name: "密闭舟体双尾桨敞篷两栖汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "水陆两栖汽车", "密闭上扬舟形前底", "双独立尾推进桨", "四个外置道路轮组"], create: () => {
    const color = "#9eafa1", parts: ModelPart[] = [
      ...periodGear(0.29, 1.50, -1.20, 1.10),
      ...periodFenders([-1.20, 1.10], 0.29, 1.50, color),
      periodBody("保留密闭中央防水底并在前鼻真正上扬的舟形车体", [[-2.20, 0.36, 0.48, 1.02], [-1.50, 0.58, 0.32, 1.08], [-0.50, 0.62, 0.32, 1.12], [1.15, 0.62, 0.32, 1.12], [2.10, 0.58, 0.32, 1.0]], color),
      box("高舟体前甲板上实际承接风挡与转向柱的仪表台", [0, 1.10, -0.56], [1.16, 0.18, 0.14], color),
      box("舟形车体前围上独立相接的窄横保险杠", [0, 0.65, -2.25], [1.32, 0.12, 0.12], transportColors.trim),
      box("密闭尾横板外缘实际相接的后保险杠", [0, 0.60, 2.15], [1.32, 0.12, 0.12], transportColors.trim),
      ...periodSteering([-0.29, 1.41, -0.20], [-0.29, 1.11, -0.54], 0.16),
      ...sternPropeller(-0.28), ...sternPropeller(0.28),
    ];
    const glass = surface("高密闭舟体甲板上连续后倾的敞篷前风挡", transportColors.glass, [[-0.58, 1.17, -0.55], [0.58, 1.17, -0.55], [0.55, 1.68, -0.18], [-0.55, 1.68, -0.18]], [0, 1, 2, 0, 2, 3]); glass.opacity = 0.40; parts.push(glass);
    for (const side of [-1, 1]) {
      parts.push(strut("密闭舟体内的真实尾桨传动轴", [side * 0.28, 0.50, 1.30], [side * 0.28, 0.17, 1.88], 0.055), strut("实际跨接密闭尾底和出水传动轴的短轴承壳", [side * 0.28, 0.38, 1.53], [side * 0.28, 0.27, 1.73], 0.12, color), strut("把后倾风挡边缘实际承接到仪表台的短边柱", [side * 0.59, 1.12, -0.55], [side * 0.56, 1.69, -0.18], 0.04, transportColors.trim), box("独立敞篷座位下实际接合舟体甲板的座基", [side * 0.29, 1.13, 0.25], [0.49, 0.12, 0.58], color), box("独立双座各自的短座垫", [side * 0.29, 1.21, 0.25], [0.45, 0.16, 0.55], transportColors.dark), box("与双座座垫各自实际接合的短靠背", [side * 0.29, 1.46, 0.50], [0.45, 0.42, 0.10], transportColors.dark), cylinder("舟形前鼻两侧与车体相接的圆形前照灯", [side * 0.40, 0.95, -2.22], [0.20, 0.10, 0.20], transportColors.trim, [90, 0, 0]), box("舟形尾横板实体上的独立宽尾灯", [side * 0.40, 0.90, 2.12], [0.16, 0.10, 0.06], transportColors.signal));
      for (const z of [-1.20, 1.10]) parts.push(strut("从密闭舟体实际连接到外侧轮上翼子板的独立支架", [side * 0.50, 0.90, z], [side * 0.75, 0.675, z], 0.045, color));
    }
    parts.push(strut("两根前风挡边柱顶部连续接合的金属横框", [-0.56, 1.69, -0.18], [0.56, 1.69, -0.18], 0.04, transportColors.trim));
    return parts;
  } },
];
