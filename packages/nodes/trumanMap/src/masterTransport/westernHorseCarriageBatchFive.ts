import { part, ring, type ModelPart } from "../assetModelParts";
import { box, strut, surface, type TransportDefinition } from "./parts";
import { curvedStrip } from "./westernHorseCarriageBatchOne";
import { carriageRoof, compactCarriageGear } from "./westernHorseCarriageBatchTwo";
import { solidPanel } from "./marineExpansionBatchTwo";

// 两种独立完整承载车体；不把拆篷、换乘客或更换牵引马匹算新素材。
// https://www.nationaltrustcollections.org.uk/object/272881.1
// https://www.salford.gov.uk/schools-and-learning/info-for-parents-students-and-teachers/ethnic-minorities-and-travellers/traveller-wagon-project/history-of-wagons-and-wagon-building/
// https://www.johnmooremuseum.org/the-vardo/
// https://rm.coe.int/cdadi-2024-14-tool-5-object-biography-20th-century-vardo-/1680b5e81e

const wood = "#8c6845", dark = "#343a35", leather = "#67564a", paint = "#68755a", glass = "#89a5a3";

function livingWagonRoof(): ModelPart[] {
  const roof = carriageRoof("居住车真正留出炉烟管穿孔的薄木拱顶", [[-1.75, 0.9, 2.45], [-0.82, 0.9, 2.45], [-0.38, 0.9, 2.45], [1.75, 0.9, 2.45]], 0.33, 0.06, paint);
  const removed = new Set([23, 24, 41, 42, 32, 33, 50, 51]);
  roof.indices = roof.indices!.filter((_value, index, all) => ![0, 1, 2].every(offset => removed.has(all[index - index % 3 + offset]!)));
  for (const [a, b] of [[23, 24], [24, 42], [42, 41], [41, 23]]) roof.indices.push(a!, b!, b! + 9, a!, b! + 9, a! + 9);
  const x1 = Math.cos(Math.PI * 5 / 8) * 0.9, x2 = Math.cos(Math.PI * 6 / 8) * 0.9, y1 = 2.45 + Math.sin(Math.PI * 5 / 8) * 0.33, y2 = 2.45 + Math.sin(Math.PI * 6 / 8) * 0.33, length = Math.hypot(x2 - x1, y2 - y1);
  const flashing = solidPanel("与顶壳同坡度且真正开圆孔的烟管金属泛水板", [(x1 + x2) / 2, (y1 + y2) / 2 - 0.03, -0.6], [0, 0, 1], [(x2 - x1) / length, (y2 - y1) / length, 0], [[-0.22, -length / 2], [0.22, -length / 2], [0.22, length / 2], [-0.22, length / 2]], [Array.from({ length: 12 }, (_, index) => [Math.cos(index * Math.PI / 6) * 0.1, Math.sin(index * Math.PI / 6) * 0.1] as [number, number])]);
  flashing.color = dark;
  return [roof, flashing];
}

export const westernHorseCarriageBatchFive: TransportDefinition[] = [
  { name: "轻骨架高驾座独立后侍座蜘蛛马车", theme: "欧式", tags: ["马车", "影视", "十九世纪年代戏", "Spider Phaeton", "前驾座后独立侍座"], create: () => {
    const parts: ModelPart[] = [...compactCarriageGear(-1.1, 1.1, 0.5, 0.7, 1.75), box("高驾座之前与下面共用的轻薄脚床", [0, 1.16, -0.475], [1.24, 0.12, 1.85], wood), box("主人自驾的完整前排长坐垫", [0, 1.52, 0], [1.18, 0.12, 0.5], leather), box("前排驾座独立低靠背", [0, 1.78, 0.26], [1.18, 0.5, 0.06], wood), box("细骨架末端承托侍从座的窄平台", [0, 1.16, 1.3], [0.9, 0.12, 0.7], wood), box("后侍座下接到两条细梁的横承枕", [0, 1.08, 1.3], [1.3, 0.1, 0.18], dark), box("与前排之间真正留有空隙的后侍从坐垫", [0, 1.62, 1.3], [0.88, 0.12, 0.4], leather), box("独立后侍座的小靠背", [0, 1.87, 1.51], [0.88, 0.4, 0.06], wood), box("驾座前方接在脚床上的完整挡泥前围", [0, 1.45, -1.14], [1.2, 0.62, 0.065], leather, [-10, 0, 0])];
    for (const side of [-1, 1]) {
      parts.push(box("前后车桥之间不填实空车身的细底梁", [side * 0.5, 0.82, 0], [0.12, 0.12, 2.7], dark), box("接到前转向第五轮且绕开王销的半幅承枕", [side * 0.34, 0.83, -1.1], [0.45, 0.06, 0.2], dark), ring("前轮上方真实闭合空腹的完整椭圆悬簧", dark, 1, 0.14, 0, 1, { position: { x: side * 0.6, y: 0.99, z: -0.85 }, scale: { x: 0.14, y: 0.07, z: 0.55 }, rotation: { x: 0, y: 0, z: 90 } }), box("前椭圆簧底部实际接到底梁的夹座", [side * 0.58, 0.875, -0.85], [0.25, 0.08, 0.2], dark), curvedStrip("后端承托细骨架的独立长叶簧", side * 0.6, 1.05, 1.3, 0.98, 0.15, 0.07, 0.025, dark), box("后叶簧中部实际接到底梁的承座", [side * 0.58, 0.92, 1.05], [0.25, 0.1, 0.2], dark), strut("后侍座前后开放而非箱体的独立长骨梁", [side * 0.6, 1.16, 0.3], [side * 0.6, 1.16, 1.75], 0.1, dark), box("前排下方两侧低登车踏板", [side * 0.85, 0.77, -0.35], [0.3, 0.08, 0.55], dark), strut("登车踏板与前脚床之间的短斜撑", [side * 0.6, 1.16, -0.35], [side * 0.85, 0.81, -0.35], 0.05, dark), strut("前桥上实际相连的细长双辕", [side * 0.42, 0.615, -1.1], [side * 0.5, 0.85, -2.9], 0.065, wood));
      for (const z of [-0.17, 0.17]) parts.push(strut("前驾座真正落接脚床的独立座腿", [side * 0.48, 1.21, z], [side * 0.48, 1.46, z], 0.06, wood));
      for (const z of [1.16, 1.44]) parts.push(strut("后侍座真正落在独立窄平台上的支脚", [side * 0.35, 1.21, z], [side * 0.35, 1.56, z], 0.05, wood));
      parts.push(strut("前驾座外沿的低扶手", [side * 0.59, 1.65, -0.17], [side * 0.59, 1.8, 0.25], 0.035, dark), strut("前扶手实际落到坐垫侧沿的短支柱", [side * 0.59, 1.52, -0.17], [side * 0.59, 1.65, -0.17], 0.035, dark));
    }
    return parts;
  } },
  { name: "外张木舱炉烟管前门罗姆居住马车", theme: "欧式", tags: ["马车", "影视", "十九世纪年代戏", "Vardo居住车", "外张木厢完整居住车"], create: () => {
    const parts: ModelPart[] = [...compactCarriageGear(-1.3, 1.3, 0.5, 0.72, 1.9), ...livingWagonRoof(), box("完整住舱内实际可进入的承载地板", [0, 1.1, 0], [1.38, 0.16, 3.4], wood), box("前门外侧供乘客立足的窄门台", [0, 1.1, -1.82], [1, 0.12, 0.55], wood), box("从地面上门台的第一级实踏板", [0, 0.35, -2.4], [0.8, 0.1, 0.28], dark), box("上门台的第二级实踏板", [0, 0.65, -2.17], [0.8, 0.1, 0.3], dark), box("上门台的末级实踏板", [0, 0.95, -1.95], [0.8, 0.1, 0.3], dark), box("后半住舱架空双人床的实木铺板", [0, 1.62, 0.83], [1.24, 0.15, 1.3], wood), box("住舱床板上的完整薄床垫", [0, 1.735, 0.83], [1.18, 0.08, 1.24], "#b7ac91"), box("进入住舱左边固定的短铸铁炉体", [-0.47, 1.42, -0.6], [0.36, 0.5, 0.45], dark), box("炉体前面实闭合的小炉门", [-0.47, 1.42, -0.835], [0.25, 0.3, 0.025], "#44473e"), box("入口右边直接落地的小收纳柜", [0.47, 1.5, -0.65], [0.36, 0.64, 0.55], wood), part("从铸铁炉顶穿过真实顶孔的中空烟管", "lathe", dark, [-0.490405761, 0, -0.6], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.05, y: 1.65 }, { x: 0.07, y: 1.65 }, { x: 0.07, y: 3.08 }, { x: 0.05, y: 3.08 }, { x: 0.05, y: 1.65 }] })];
    for (const side of [-1, 1]) {
      const wall = solidPanel("向上外张且真正开侧窗的住舱厚木壁", [side * 0.67, 1.18, 0], [0, 0, 1], [side * 0.14, 1, 0], [[-1.55, 0], [1.55, 0], [1.55, 1.32], [-1.55, 1.32]], [[[-0.25, 0.6], [0.6, 0.6], [0.6, 1.05], [-0.25, 1.05]]]);
      wall.color = paint;
      const pane = surface("住舱外张壁实际窗洞中的独立薄玻璃", glass, [[side * 0.754, 1.78, -0.25], [side * 0.754, 1.78, 0.6], [side * 0.817, 2.23, 0.6], [side * 0.817, 2.23, -0.25]], [0, 1, 2, 0, 2, 3]);
      pane.opacity = 0.25;
      parts.push(wall, pane, box("前后车桥之间完整的住舱承载底梁", [side * 0.5, 0.84, 0], [0.12, 0.12, 3.2], dark), box("前第五轮上避开王销的半幅承枕", [side * 0.34, 0.83, -1.3], [0.45, 0.06, 0.2], dark), strut("前门台下方接入住舱地板的长承杆", [side * 0.5, 1.1, -1.45], [side * 0.5, 1.1, -1.95], 0.08, wood), strut("三块登门踏板两侧实际贯通的边梁", [side * 0.4, 1.1, -1.8], [side * 0.4, 0.3, -2.4], 0.07, dark), strut("前桥上实际相连且避开登门梯的双辕", [side * 0.65, 0.615, -1.3], [side * 0.58, 0.85, -3.3], 0.07, wood));
      for (const z of [-1, 1]) parts.push(curvedStrip("承托完整居住木舱的长上弓悬簧", side * 0.61, z, 1.2, 0.98, 0.13, 0.075, 0.025, dark), box("住舱悬簧中央实接到底梁的承座", [side * 0.58, 0.94, z], [0.25, 0.1, 0.2], dark));
      for (const z of [0.3, 1.35]) parts.push(strut("架空床板四角真正落在住舱地板上的木床腿", [side * 0.5, 1.17, z], [side * 0.5, 1.545, z], 0.07, wood));
    }
    const arch = Array.from({ length: 9 }, (_, index) => { const x = Math.cos(index * Math.PI / 8) * 0.855; return [x, 2.45 + 0.33 * Math.sqrt(1 - (x / 0.9) ** 2) - 0.025] as [number, number]; });
    const outline: [number, number][] = [[-0.67, 1.18], [0.67, 1.18], ...arch];
    // 门孔与前壁下缘相通，分列两门柱和上门楣，避免使用接触外边界的封闭内孔。
    const frontPieces = [solidPanel("前门左侧真正落地且承托顶拱的实门边", [0, 0, -1.55], [1, 0, 0], [0, 1, 0], [[-0.67, 1.18], [-0.34, 1.18], [-0.34, 2.39], [-0.83, 2.39]]), solidPanel("前门右侧真正落地且承托顶拱的实门边", [0, 0, -1.55], [1, 0, 0], [0, 1, 0], [[0.34, 1.18], [0.67, 1.18], [0.83, 2.39], [0.34, 2.39]]), solidPanel("门口上方与弓顶直接相接的完整上门围", [0, 0, -1.55], [1, 0, 0], [0, 1, 0], [[-0.83, 2.39], [0.83, 2.39], ...arch])];
    frontPieces.forEach(p => p.color = paint);
    const rear = solidPanel("住舱后壁真正开长后窗的弓形实木围", [0, 0, 1.55], [1, 0, 0], [0, 1, 0], outline, [[[-0.45, 1.8], [0.45, 1.8], [0.45, 2.25], [-0.45, 2.25]]]);
    rear.color = paint;
    parts.push(...frontPieces, rear, { ...box("住舱后壁实窗洞内的薄玻璃", [0, 2.025, 1.55], [0.9, 0.45, 0.025], glass), opacity: 0.25 });
    const angle = Math.PI / 4, x = -0.34 + 0.34 * Math.cos(angle), z = -1.55 - 0.34 * Math.sin(angle);
    parts.push(box("前门真实向外打开的下半实木门板", [x, 1.485, z], [0.68, 0.61, 0.045], wood, [0, 45, 0]), { ...box("前门上半框内真实透视住舱的玻璃", [x, 2.09, z], [0.58, 0.56, 0.024], glass, [0, 45, 0]), opacity: 0.24 }, box("前门上下半之间的真实横门枋", [x, 1.79, z], [0.68, 0.06, 0.055], wood, [0, 45, 0]), box("前门玻璃顶端的完整门枋", [x, 2.37, z], [0.68, 0.04, 0.055], wood, [0, 45, 0]));
    for (const f of [0, 0.68]) parts.push(box("前门铰接边与另一边连续相接的实门梃", [-0.34 + f * Math.cos(angle), 1.785, -1.55 - f * Math.sin(angle)], [0.06, 1.21, 0.055], wood, [0, 45, 0]));
    return parts;
  } },
];
