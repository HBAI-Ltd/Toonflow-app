import { part, type ModelPart } from "../assetModelParts";
import { fuselage, propeller, tail } from "./aircraftModels";
import { airfoil, smallGear } from "./aerospaceExpansionBatchOne";
import { ball, boatHull, box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

function waveriderHull(): ModelPart {
  const sections = [[-3.6, 0.03, 0.5, 0.04], [-1.8, 0.55, 0.58, 0.25], [0, 0.98, 0.65, 0.4], [2.8, 1.3, 0.7, 0.45], [3.2, 1.23, 0.7, 0.3]];
  const profile = [[-1, 0], [-0.8, 0.8], [0, 1], [0.8, 0.8], [1, 0], [0, -0.3]];
  const vertices = sections.flatMap(([z, width, y, height]) => profile.map(([px, py]) => ({ x: px! * width!, y: y! + py! * height!, z: z! })));
  const indices: number[] = [];
  for (let section = 0; section < 4; section++) for (let index = 0; index < 6; index++) { const a = section * 6 + index, b = section * 6 + (index + 1) % 6; indices.push(a, a + 6, b + 6, a, b + 6, b); }
  for (let index = 1; index < 5; index++) indices.push(0, index, index + 1, 24, 24 + index + 1, 24 + index);
  return part("扁平菱形断面与锐前缘连续收分的乘波体", "mesh", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// 公开原理指导的原创概念场景几何，不以品牌复刻或可飞行/制造规格计数。
// https://www.grc.nasa.gov/www/k-12/airplane/cyl.html
// https://ntrs.nasa.gov/citations/19820018401
// https://www.nasa.gov/reference/x-43a/
// https://airfish.stengg.com/
export const aerospaceExpansionBatchSix: TransportDefinition[] = [
  { name: "马格努斯转筒翼概念试验飞机", theme: "科幻", tags: ["转筒翼", "马格努斯升力原理", "完整概念飞行器"], create: () => {
    const parts: ModelPart[] = [fuselage(6.8, 0.9, 1.45), ...propeller(0, 1.45, -3.6, 0.95), ...tail(2.7, 1.6, 2.8), ball("转筒承载梁前方的透明飞行座舱", [0, 1.9, -1.35], [0.72, 0.7, 1.35], transportColors.glass), ...smallGear([[-0.7, 1.4, 0.4], [0.7, 1.4, 0.4]], [0, 1.4, -2.1], 0.21)];
    for (const side of [-1, 1]) {
      parts.push(cylinder("沿翼展方向布置的旋转升力圆筒", [side * 2.4, 2.15, 0], [1.1, 3.5, 1.1], transportColors.trim, [0, 0, 90]), strut("保持圆筒前缘开放的下部承载横架", [side * 0.4, 1.5, 0.6], [side * 4.2, 1.5, 0.6], 0.12), strut("外端轴承与下部横架之间的立撑", [side * 4.15, 1.5, 0.6], [side * 4.15, 2.15, 0], 0.08), strut("机体内部至转筒内端轴承的支架", [side * 0.3, 1.55, 0], [side * 0.65, 2.15, 0], 0.09));
      for (const distance of [0.65, 4.15]) parts.push(cylinder("抑制转筒端部泄流的圆形端盘", [side * distance, 2.15, 0], [1.4, 0.04, 1.4], transportColors.body, [0, 0, 90]), cylinder("转筒端盘轴心承座", [side * distance, 2.15, 0], [0.2, 0.2, 0.2], transportColors.dark, [0, 0, 90]));
    }
    return parts;
  } },
  { name: "环形承力翼尾座喷气研究飞行器", theme: "现代", tags: ["筒状环形机翼", "尾座式喷气", "中央机身与环翼分离"], create: () => {
    const parts: ModelPart[] = [part("纵向包围中央机身的中空环形承力翼", "lathe", transportColors.body, [0, 2.65, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.9, y: -1.5 }, { x: 2.15, y: -1.3 }, { x: 2.2, y: -0.8 }, { x: 2.0, y: 1.5 }, { x: 1.83, y: 1.5 }, { x: 1.98, y: -0.8 }, { x: 1.7, y: -1.3 }, { x: 1.9, y: -1.5 }] }), part("环形翼内部竖直流线喷气机身", "lathe", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 1.0 }, { x: 0.55, y: 1.0 }, { x: 0.62, y: 2.2 }, { x: 0.58, y: 5.4 }, { x: 0.48, y: 6.9 }, { x: 0, y: 8.2 }] }), part("中央机身下方的真实开放喷气尾口", "lathe", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.52, y: 0.57 }, { x: 0.46, y: 1.15 }, { x: 0.36, y: 1.15 }, { x: 0.42, y: 0.57 }, { x: 0.52, y: 0.57 }] }), ball("机身高端面向前方的透明座舱罩", [0, 6.6, -0.46], [0.82, 1.3, 0.65], transportColors.glass)];
    for (let index = 0; index < 4; index++) {
      const a = index * Math.PI / 2, x = Math.cos(a), z = Math.sin(a);
      const fin = surface("环翼尾部向外伸出的操纵稳定鳍", transportColors.signal, [[0, 0, -0.4], [0.8, 0, -0.15], [0.8, 1.0, 0.15], [0, 1.0, 0.3]], [0, 1, 2, 0, 2, 3], [x * 2.05, 1.55, z * 2.05]);
      fin.rotation.y = -index * 90;
      parts.push(fin, strut("中央机身与环形翼之间的径向承力肋", [x * 0.55, 2.7, z * 0.55], [x * 1.99, 2.7, z * 1.99], 0.12), strut("从环翼下端外张的尾座支腿", [x * 2.0, 1.45, z * 2.0], [x * 2.5, 0.3, z * 2.5], 0.12), cylinder("尾座支腿末端接地脚轮", [x * 2.5, 0.22, z * 2.5], [0.44, 0.2, 0.44], transportColors.dark, [0, -index * 90 + 90, 90]));
    }
    return parts;
  } },
  { name: "双楔腹部压缩面乘波体无人试验机", theme: "科幻", tags: ["乘波体", "锐前缘双楔", "腹部贯通进气道", "概念研究飞行器"], create: () => {
    const parts: ModelPart[] = [waveriderHull(), surface("机腹前端接至进气口的第一压缩斜面", transportColors.dark, [[-0.025, 0.48, -3.55], [0.025, 0.48, -3.55], [0.48, 0.23, -1.0], [-0.48, 0.23, -1.0]], [0, 1, 2, 0, 2, 3]), surface("进气道后方延伸的第二楔形扩张底板", transportColors.dark, [[-0.47, 0.21, -1.0], [0.47, 0.21, -1.0], [0.62, 0.02, 3.3], [-0.62, 0.02, 3.3]], [0, 1, 2, 0, 2, 3])];
    for (const side of [-1, 1]) parts.push(part("把腹部通道保留为空腔的侧壁", "extrude", transportColors.dark, [side * 0.5, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.06, profile: [{ x: 1.0, y: 0.21 }, { x: -3.25, y: 0.02 }, { x: -3.25, y: 0.72 }, { x: 1.0, y: 0.62 }] }), surface("后段外倾的小型垂直稳定翼", transportColors.signal, [[0, 0, -0.6], [side * 0.22, 0.9, 0.25], [side * 0.12, 0.05, 0.85]], [0, 1, 2], [side * 0.9, 0.95, 2.3]), box("后缘分置升降控制面", [side * 1.03, 0.69, 3.17], [0.55, 0.04, 0.32], transportColors.trim));
    return parts;
  } },
  { name: "反向三角下反翼近水面地效运输艇", theme: "现代", tags: ["反向三角翼", "下反地效翼", "近水面运输", "高置推式推进器"], create: () => {
    const parts: ModelPart[] = [boatHull(2.2, 9.0, 1.2), ball("低矮船体前段的透明乘员舱罩", [0, 1.58, -1.7], [1.55, 1.0, 2.2], transportColors.glass), cylinder("抬高以避开水面的推进发动机", [0, 2.45, 2.25], [0.55, 1.1, 0.55], transportColors.body, [90, 0, 0]), ...propeller(0, 2.45, 2.94, 1.12), strut("从船体抬高推进器的承力支柱", [0, 1.15, 2.1], [0, 2.23, 2.1], 0.17), airfoil("高于推进桨扫掠区的后水平尾翼", 3.8, 0.9, [0, 3.65, 4.0]), surface("船艉至高平尾的垂直方向鳍", transportColors.signal, [[0, 0, -0.65], [0, 2.4, 0.25], [0, 0, 1.05]], [0, 1, 2], [0, 1.2, 3.8])];
    for (const side of [-1, 1]) parts.push(surface("宽前缘向后根部收束的下反三角翼", transportColors.trim, [[side * 0.15, 1.1, -1.85], [side * 4.8, 0.55, -1.85], [side * 0.25, 1.1, 3.1]], [0, 1, 2]), part("翼尖接水支承用长形浮筒", "capsule", transportColors.body, [side * 4.65, 0.29, -1.45], [0.7, 2.65, 0.9], [90, 0, 0]), strut("下反翼尖与稳定浮筒的连接肋", [side * 4.5, 0.59, -1.45], [side * 4.65, 0.39, -1.45], 0.075));
    return parts;
  } },
];
