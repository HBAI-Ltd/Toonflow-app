import { part, crystal, ring, type ModelPart } from "../assetModelParts";
import { base, box, cylinder, design, rail } from "./structures";

const stone = "#9c9f94", wood = "#8d7659", ground = "#a69b7e", roof = "#7d8e85", mineral = "#a9bfbd";

function joustingGround(): ModelPart[] {
  const parts: ModelPart[] = [base(32, 60), box("骑士比武两道之间的完整长场地", 0, .23, 0, 12, .1, 48, ground),
    ...[-1, 1].map(side => box("相向骑行但不彼此混入的长直道", side * 2.4, .3, 0, 3.8, .05, 44, stone)), box("贯穿直道并在两端停止的中央防冲隔栏", 0, .95, 0, .24, 1.35, 44, wood)];
  for (const side of [-1, 1]) for (const z of [-16, 0, 16]) {
    for (let row = 0; row < 4; row++) {
      const height = .5 + row * .5;
      parts.push(box("侧观台具有真实下承体的连续看席", side * (6.8 + row * 1.1), .2 + height / 2, z, 1.15, height, 12.8, wood));
    }
    parts.push(part("每个侧观台独立承在四柱上的双坡罩顶", "extrude", roof, [side * 9.1, 5.4, z], [1, 1, 1], [0, 0, 0], { depth: 13.3, profile: [{ x: -3.25, y: 0 }, { x: 0, y: 1.6 }, { x: 3.25, y: 0 }, { x: 3.2, y: -.18 }, { x: 0, y: 1.4 }, { x: -3.2, y: -.18 }] }));
    for (const x of [6, 12.2]) for (const end of [-1, 1]) parts.push(box("看席罩顶真正落地的独立木柱", side * x, 2.8, z + end * 6.2, .2, 5.2, .2, wood));
  }
  for (const end of [-1, 1]) for (const side of [-1, 1]) {
    const x = side * 2.4, z = end * 26;
    parts.push(...[-1, 1].map(edge => box("双向整备门廊留出骑乘通过口的门柱", x + edge * 1.7, 2.7, z, .3, 5, .7, stone)),
      box("整备门廊的高跨梁", x, 5.3, z, 3.8, .35, 1, wood));
  }
  for (const side of [-1, 1]) {
    parts.push(rail([side * 5.5, 1.4, -22], [side * 5.5, 1.4, 22], .1, wood));
    for (let index = 0; index < 8; index++) parts.push(box("骑行道外缘防冲栏落地竖桩", side * 5.5, .8, -22 + index * 44 / 7, .13, 1.3, .13, wood));
  }
  return parts;
}

function quarryStrip(name: string, color: string, innerOffset: number, outerOffset: number, thin: boolean): ModelPart {
  const segments = 96, vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let index = 0; index <= segments; index++) {
    const t = index / segments, angle = t * Math.PI * 6, inner = 8 + t * 16 + innerOffset, outer = 8 + t * 16 + outerOffset;
    const top = .4 + t * 12 + (thin ? .035 : 0), bottom = thin ? top - .055 : .2;
    for (const [radius, y] of [[inner, bottom], [outer, bottom], [inner, top], [outer, top]]) vertices.push({ x: Math.cos(angle) * radius!, y: y!, z: Math.sin(angle) * radius! });
    if (!index) continue;
    const a = (index - 1) * 4, b = index * 4;
    indices.push(a, a + 1, b, b, a + 1, b + 1, a + 2, b + 2, a + 3, a + 3, b + 2, b + 3,
      a, b, a + 2, a + 2, b, b + 2, a + 1, a + 3, b + 1, b + 1, a + 3, b + 3);
  }
  const last = segments * 4;
  indices.push(0, 2, 3, 0, 3, 1, last, last + 1, last + 3, last, last + 3, last + 2);
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function spiralQuarry(): ModelPart[] {
  const parts: ModelPart[] = [cylinder("环坑矿场最低处完整的地基盘", 0, .1, 0, 60, .2, ground), cylinder("低于出坑坡道的中央开敞坑底", 0, .28, 0, 16.3, .16, stone),
    quarryStrip("螺旋台阶岩体外缘逐圈升高的完整矿坑主体", stone, 0, 16 / 3, false), quarryStrip("沿三圈矿坑台阶连续上行的真实出坑道", wood, .65, 4.65, true),
    cylinder("最高出口处的提石桅旋转底座", 26.5, 12.8, 0, 2.1, .8, stone), cylinder("落在最高矿台上的竖直提石桅", 26.5, 15.3, 0, .55, 5.8, wood),
    rail([26.5, 18.2, 0], [16.5, 17, 0], .35, wood), rail([26.5, 13.5, 0], [16.5, 17, 0], .22, stone), rail([16.5, 17, 0], [16.5, 6.4, 0], .055, wood),
    ring("提石索末端实际连接石块的吊环", stone, .3, .06, 0, .12, { position: { x: 16.5, y: 6.4, z: 0 }, rotation: { x: 90, y: 0, z: 0 } }),
    box("下层矿台上被提索接住的独立石料", 16.5, 5.4, 0, 2.8, 1.8, 2.5, ground)];
  for (const t of [.18, .38, .58, .78]) {
    const a = t * Math.PI * 6, r = 8 + t * 16 - .15, y = .4 + t * 12 - 1.2;
    parts.push(crystal("从暴露的内侧采石壁中突出的立体矿脉", mineral, [Math.cos(a) * r, y, Math.sin(a) * r], [1.35, 1.8, .85], { rotation: { x: 12, y: 90 - a * 180 / Math.PI, z: 15 } }));
  }
  return parts;
}

export const fantasySpaceBatchSixDesigns = [
  design("长道隔栏骑士比武场", "双向长直骑行道由中央隔栏分开，四端整备门廊与完整侧观台共同围住长场，六组四柱罩顶覆盖实承阶席；不包含骑士或马匹模型", joustingGround, "建筑", "奇幻"),
  design("环坑矿脉采石场", "实际岩体形成三圈连续升高的矿坑台阶，四米出坑道沿同一螺旋保持缓坡，上层提石桅的缆索接到下层石料；中央坑底、暴露矿脉与各圈的真实高度差可见", spiralQuarry, "建筑", "奇幻"),
];
