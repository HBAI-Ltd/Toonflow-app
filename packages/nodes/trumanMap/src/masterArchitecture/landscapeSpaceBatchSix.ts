import { part, type ModelPart } from "../assetModelParts";
import { box, colors, design, pipe } from "./structures";

// 与旧直堰、虹吸溢洪道、分池鱼道有不同真实构造的独立大型水工主体。
// https://www.gov.uk/guidance/reservoir-owner-and-operator-guidance-spillways
// https://wetlandinfo.detsi.qld.gov.au/wetlands/management/fish-passage/technologies/fishway-options/denil/
// 原创简化静态资产，不提供水力仿真/工程规格。
const concrete = "#a7b0a4", steel = "#7b8d88";

function outletElbow(): ModelPart {
  const rows = 6, sectors = 32, vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const radius of [4.2, 3.5]) for (let row = 0; row < rows; row++) {
    const a = row / (rows - 1) * Math.PI / 2;
    for (let i = 0; i < sectors; i++) {
      const p = i / sectors * Math.PI * 2;
      vertices.push({ x: Math.cos(p) * radius, y: 14.3 - Math.sin(a) * 10 + Math.sin(p) * radius * Math.sin(a), z: 10 - Math.cos(a) * 10 + Math.sin(p) * radius * Math.cos(a) });
    }
  }
  const layer = rows * sectors;
  for (let row = 0; row < rows - 1; row++) for (let i = 0; i < sectors; i++) {
    const j = (i + 1) % sectors, a = row * sectors + i, b = row * sectors + j, c = (row + 1) * sectors + i, d = (row + 1) * sectors + j;
    indices.push(a, b, c, b, d, c, layer + a, layer + c, layer + b, layer + b, layer + c, layer + d);
  }
  for (const row of [0, rows - 1]) {
    const start = vertices.length;
    for (const offset of [0, layer]) for (let i = 0; i < sectors; i++) vertices.push({ ...vertices[offset + row * sectors + i]! });
    for (let i = 0; i < sectors; i++) {
      const j = (i + 1) % sectors, a = start + i, b = start + j, c = start + sectors + i, d = start + sectors + j;
      indices.push(...(row === 0 ? [a, c, b, b, c, d] : [a, b, c, b, d, c]));
    }
  }
  return part("保持内孔贯通并独立封闭管壁的九十度弯肘", "mesh", concrete, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const landscapeSpaceBatchSixDesigns = [
  design("悬挑交错钢琴键溢流堰", "相邻进水键与出水键朝相反方向敞口，斜底单元交错悬挑在主墩前后，长侧壁与交错端墙形成折返溢流线", () => {
    const parts: ModelPart[] = [box("承住悬挑键组的完整重力基础", 0, .5, 0, 42, 1, 14, concrete)];
    for (let i = 0; i < 14; i++) parts.push(box("相邻进出键之间连续薄侧堰墙", -19.5 + i * 3, 4.5, 0, .22, 7, 18, concrete));
    for (let i = 0; i < 13; i++) {
      const x = -18 + i * 3, forward = i % 2 === 0;
      parts.push(part("相邻键底方向相反的承水斜板", "box", concrete, [x, 2.4, 0], [2.8, .25, 20.2], [forward ? 8 : -8, 0, 0]), box("使进出键朝反向开放的端堰墙", x, 4.5, forward ? 9 : -9, 2.8, 7, .22, concrete));
    }
    parts.push(...[-1, 1].map(s => box("堰组边缘完整封边翼墙", s * 20.8, 4.5, 0, .4, 7, 20, concrete)));
    return parts;
  }, "建筑", "现代"),
  design("漏斗钟口竖井溢洪道", "径向来水越过开放宽钟口进入收分竖井，再经贯通的九十度下弯肘转入水平出水管，可见连续管腔与完整壁厚", () => [
    part("从宽钟口连续收分到竖井的真实空心壳", "lathe", concrete, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 14, y: 32 }, { x: 12, y: 31.8 }, { x: 9, y: 30 }, { x: 6, y: 27 }, { x: 4.2, y: 24 }, { x: 4.2, y: 14.3 }, { x: 3.5, y: 14.3 }, { x: 3.5, y: 24 }, { x: 5.3, y: 27 }, { x: 8.3, y: 30 }, { x: 12, y: 31.1 }, { x: 14, y: 31.3 }, { x: 14, y: 32 }] }),
    outletElbow(),
    part("弯肘后方真正开放的水平出水管", "lathe", concrete, [0, 4.3, 17.5], [1, 1, 1], [90, 0, 0], { profile: [{ x: 4.2, y: -7.5 }, { x: 4.2, y: 7.5 }, { x: 3.5, y: 7.5 }, { x: 3.5, y: -7.5 }, { x: 4.2, y: -7.5 }] }),
    ...[14, 23].map(z => box("水平管底实际接触的承载底座", 0, .1, z, 9.2, .2, 1.5, concrete)),
  ], "建筑", "现代"),
  design("狄尼尔折板斜槽鱼道", "连续倾斜窄槽中密排向上游倾的U形折流板，中央开口连成逆流游动通路，侧墙与落地腿支承整条斜槽，水面仅静态示意", () => {
    const angle = Math.atan(.2) * 180 / Math.PI;
    const parts: ModelPart[] = [part("整条鱼道连续向下倾斜的承水底板", "box", concrete, [0, 4, 0], [1.8, .25, Math.hypot(30, 6)], [angle, 0, 0])];
    for (const s of [-1, 1]) parts.push(part("不分池的连续挡水侧墙", "extrude", concrete, [s * .85, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .15, profile: [{ x: 15, y: 6.9 }, { x: 15, y: 8.4 }, { x: -15, y: 2.4 }, { x: -15, y: .9 }] }));
    for (let i = 0; i < 27; i++) {
      const z = -14.2 + i * 1.08;
      parts.push(part("向上游倾斜并保留中间通孔的独立U形折流板", "extrude", steel, [0, 4 - z * .2 + .12, z], [1, 1, 1], [-45, 0, 0], { depth: .055, profile: [{ x: -.75, y: 0 }, { x: .75, y: 0 }, { x: .75, y: 1 }, { x: .5, y: 1 }, { x: .32, y: .2 }, { x: -.32, y: .2 }, { x: -.5, y: 1 }, { x: -.75, y: 1 }] }));
    }
    for (const z of [-13, -5, 3, 11]) for (const s of [-1, 1]) {
      const h = 4 - z * .2 - .15;
      parts.push(box("托住鱼道底板的独立落地腿", s * .65, h / 2, z, .16, h, .3, concrete));
    }
    parts.push(part("随斜槽坡度下降的静态水层", "box", colors.water, [0, 4.45, 0], [1.45, .025, Math.hypot(29.7, 5.94)], [angle, 0, 0]), ...[-1, 1].map(s => pipe("鱼道边缘维护扶手", [s * .85, 8.9, -15], [s * .85, 2.9, 15], .055)));
    return parts;
  }, "建筑", "现代"),
];
