import { beam, part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, strut, surface, type TransportDefinition } from "./parts";
import { compactCarriageGear } from "./westernHorseCarriageBatchTwo";

// 原创八角礼仪舆，不复刻王室徽章、绘画或人物雕塑；不以配马数和鎏金换色扩主。
// https://media.rct.uk/sites/default/files/resources/Gold%20State%20Coach_transcript.pdf
// https://www.coronationroll.gov.uk/further_info/gold-state-coach/

const gold = "#b7a16c", dark = "#514b37", leather = "#705247", velvet = "#85513f";

function ceremonialSkirt(a: [number, number], b: [number, number]): ModelPart {
  const vertices = [[1.32, 0.9], [1.6, 1.07], [1.85, 1]].flatMap(([y, size]) => [
    { x: a[0] * size!, y: y!, z: a[1] * size! }, { x: b[0] * size!, y: y!, z: b[1] * size! },
    { x: a[0] * (size! - 0.045), y: y!, z: a[1] * (size! - 0.045) }, { x: b[0] * (size! - 0.045), y: y!, z: b[1] * (size! - 0.045) },
  ]), indices: number[] = [];
  const quad = (a: number, b: number, c: number, d: number) => indices.push(a, b, c, a, c, d);
  for (let level = 0; level < 2; level++) {
    const p = level * 4;
    quad(p, p + 4, p + 5, p + 1);
    quad(p + 2, p + 3, p + 7, p + 6);
    quad(p, p + 2, p + 6, p + 4);
    quad(p + 1, p + 5, p + 7, p + 3);
  }
  quad(0, 1, 3, 2);
  quad(8, 10, 11, 9);
  return part("八角礼仪舆向外鼓出但内部保持空腔的薄木腹板", "mesh", gold, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const westernHorseCarriageBatchSix: TransportDefinition[] = [
  { name: "八柱窗穹顶四点悬舆宫廷礼仪马车", theme: "欧式", tags: ["马车", "影视", "宫廷古装", "八角空舆礼仪车", "大穹顶冠饰皮带悬舆"], create: () => {
    const outline: [number, number][] = [[-0.5, -1.45], [0.5, -1.45], [0.85, -0.7], [0.85, 0.7], [0.5, 1.45], [-0.5, 1.45], [-0.85, 0.7], [-0.85, -0.7]];
    const parts: ModelPart[] = [...compactCarriageGear(-2, 2, 0.72, 1, 2.2), polygon("八角玻璃舆下面真实承重的完整薄地板", dark, outline.map(([x, z]) => [x * 0.9, z * 0.9] as [number, number]), 0.12, [0, 1.2, 0]), part("八柱共同支撑且内部真正有凹顶空间的椭圆穹顶", "lathe", gold, [0, 2.98, 0], [1, 1, 1.7], [0, 0, 0], { profile: [{ x: 1, y: 0 }, { x: 1.07, y: 0.08 }, { x: 0.95, y: 0.2 }, { x: 0.7, y: 0.4 }, { x: 0, y: 0.56 }, { x: 0, y: 0.5 }, { x: 0.66, y: 0.34 }, { x: 0.91, y: 0.14 }, { x: 1, y: 0.04 }, { x: 1, y: 0 }] }), part("穹顶冠饰下端真正落进顶壳的短基座", "lathe", gold, [0, 3.49, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.16, y: 0 }, { x: 0.24, y: 0.09 }, { x: 0.24, y: 0.13 }, { x: 0, y: 0.15 }] }), ring("顶冠具有真实中央空口的冠箍", gold, 0.25, 0.05, 3.62, 0.12), strut("无前车夫箱礼仪车与前转向桥实接的长牵引辕", [0, 0.835, -2], [0, 0.95, -4.9], 0.15, dark), box("长辕前端给成对挽具使用的宽平衡横木", [0, 0.95, -4.7], [1.9, 0.14, 0.17], gold)];
    for (let index = 0; index < outline.length; index++) {
      const a = outline[index]!, b = outline[(index + 1) % outline.length]!;
      if (index !== 2) parts.push(ceremonialSkirt(a, b));
      parts.push(part("八角空舆八个拐角上独立承顶的模线窗柱", "lathe", gold, [a[0], 1.85, a[1]], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.075, y: 0 }, { x: 0.075, y: 0.12 }, { x: 0.045, y: 0.18 }, { x: 0.045, y: 1.07 }, { x: 0.075, y: 1.14 }, { x: 0.075, y: 1.25 }, { x: 0, y: 1.25 }] }), strut("窗柱之间接入穹顶壳的完整上檐枋", [a[0], 3.05, a[1]], [b[0], 3.05, b[1]], 0.09, gold));
      if (index !== 2) {
        parts.push(strut("窗柱之间顺八角边连续连接的下窗槛", [a[0], 1.85, a[1]], [b[0], 1.85, b[1]], 0.09, gold));
        const pane = surface("八角窗框之间实际可以透视空舱的薄玻璃", "#92abaa", [[a[0], 1.88, a[1]], [b[0], 1.88, b[1]], [b[0], 3.02, b[1]], [a[0], 3.02, a[1]]], [0, 1, 2, 0, 2, 3]);
        pane.opacity = 0.23;
        parts.push(pane);
      }
    }
    for (const side of [-1, 1]) {
      parts.push(box("前后桥之间完整而低于悬舆地板的长承架", [side * 0.55, 1.02, 0], [0.14, 0.14, 4.4], dark), box("绕开王销的前桥半幅上承枕", [side * 0.36, 1.06, -2], [0.5, 0.08, 0.2], gold));
      for (const end of [-1, 1]) parts.push(strut("从前后承架升起而不侵入轮辋的悬舆标准架", [side * 0.6, 1.07, end * 2], [side * 0.95, 1.68, end * 1.9], 0.14, gold), beam("四角标准架实际吊住八角舆地板的薄宽皮带", leather, [side * 0.95, 1.68, end * 1.9], [side * 0.7, 1.25, end * 0.8], 0.12, 0.025));
      parts.push(box("礼仪舆门口下侧的第一级窄踏板", [side * 1.1, 0.86, 0], [0.35, 0.09, 0.6], gold), box("礼仪舆地板下的第二级窄踏板", [side * 0.85, 1.07, 0], [0.35, 0.09, 0.6], gold));
      for (const z of [-0.2, 0.2]) parts.push(strut("两级踏板实际接到悬舆地板而非固定车桥的斜托", [side * 0.7, 1.25, z], [side * 1.1, 0.905, z], 0.07, gold));
    }
    for (const z of [-0.8, 0.8]) parts.push(box("舆内面对面长座下面落地的实座箱", [0, 1.5475, z], [1.1, 0.455, 0.5], dark), box("面对面长座完整软垫", [0, 1.84, z], [1.16, 0.13, 0.52], velvet), box("面对面长座后部软靠背", [0, 2.16, z + Math.sign(z) * 0.26], [1.16, 0.55, 0.07], velvet));
    const angle = Math.PI / 6, x = 0.85 + 0.7 * Math.sin(angle), z = -0.7 + 0.7 * Math.cos(angle), rotation: Triple = [0, 30, 0];
    parts.push(box("右侧真实门口向外打开的独立下门板", [x, 1.59, z], [0.06, 0.54, 1.4], gold, rotation), { ...box("右侧礼仪舆活动门框中的上玻璃", [x, 2.45, z], [0.024, 1.14, 1.3], "#92abaa", rotation), opacity: 0.23 }, box("跟随活动门叶而不横挡门口的下窗槛", [x, 1.85, z], [0.075, 0.09, 1.4], gold, rotation), box("活动门叶上端连接玻璃的独立门枋", [x, 3.05, z], [0.075, 0.075, 1.4], gold, rotation));
    for (const f of [0, 1.4]) parts.push(box("活动门叶从下门板一直连到上枋的门梃", [0.85 + f * Math.sin(angle), 2.2, -0.7 + f * Math.cos(angle)], [0.075, 1.78, 0.075], gold, rotation));
    for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3; parts.push(part("顶冠冠箍上实际相接的独立短尖饰", "cone", gold, [Math.cos(angle) * 0.22, 3.765, Math.sin(angle) * 0.22], [0.08, 0.17, 0.08])); }
    return parts;
  } },
];
