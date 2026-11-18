import type { ModelPart, Triple } from "../assetModelParts";
import { boxBatch, hardPlan, profileBody } from "./everydayOutdoorSpaceBatchOne";
import { box, design, rail } from "./structures";

const paving = "#c1bdab", asphalt = "#78887e", green = "#94a180", metal = "#6b8077", white = "#d5d6bc", dark = "#52695f";

function circle(radius: number): [number, number][] { return Array.from({ length: 32 }, (_, i) => { const a = i * Math.PI / 16; return [Math.cos(a) * radius, Math.sin(a) * radius]; }); }
function turn(points: [number, number][], angle: number): [number, number][] { return points.map(([x, z]) => [x * Math.cos(angle) - z * Math.sin(angle), x * Math.sin(angle) + z * Math.cos(angle)]); }

export const everydayOutdoorSpaceBatchThreeDesigns = [
  design("中央绿岛城市环形交叉口", "四条双向街路接入完整环形行车面，中央绿岛与各入口分流岛形成真实环流，外侧转角步道在出入口间连续连接，过街位置的路缘与分流岛实际降低并留通路", () => {
    const outline: [number, number][] = [], half = 4.5, radius = 18, delta = Math.asin(half / radius), parts: ModelPart[] = [], horizontal: Triple[] = [], vertical: Triple[] = [];
    const append = (p: [number, number]) => { const previous = outline.at(-1); if (!previous || Math.hypot(previous[0] - p[0], previous[1] - p[1]) > 1e-6) outline.push(p); };
    for (let side = 0; side < 4; side++) {
      const a = side * Math.PI / 2;
      append([Math.cos(a - delta) * radius, Math.sin(a - delta) * radius]);
      for (const p of turn([[40, -half], [40, half]], a)) append(p);
      append([Math.cos(a + delta) * radius, Math.sin(a + delta) * radius]);
      for (let i = 1; i <= 4; i++) { const angle = a + delta + i * (Math.PI / 2 - delta * 2) / 4; append([Math.cos(angle) * radius, Math.sin(angle) * radius]); }
    }
    outline.pop();
    parts.push(hardPlan("四臂路口与中央环道共用且保留真绿岛空孔的完整路体", asphalt, outline, .12, [0, 0, 0], [circle(10.5)]), hardPlan("中央绿岛外围完整闭合的低石路缘", paving, circle(10.5), .32, [0, 0, 0], [circle(10)]), hardPlan("环道中央低于路缘的整体绿化地台", green, circle(10), .24));
    const outerDelta = Math.asin(6.5 / 20), innerDelta = Math.asin(4.5 / 18), corner: [number, number][] = [[24, 4.5], [24, 6.5], [Math.cos(outerDelta) * 20, 6.5]];
    for (let i = 1; i <= 6; i++) { const a = outerDelta + (Math.PI / 2 - outerDelta * 2) * i / 6; corner.push([Math.cos(a) * 20, Math.sin(a) * 20]); }
    corner.push([6.5, 24], [4.5, 24], [4.5, Math.cos(innerDelta) * 18]);
    for (let i = 1; i <= 6; i++) { const a = Math.PI / 2 - innerDelta - (Math.PI / 2 - innerDelta * 2) * i / 6; corner.push([Math.cos(a) * 18, Math.sin(a) * 18]); }
    for (let side = 0; side < 4; side++) {
      const a = side * Math.PI / 2;
      parts.push(hardPlan("两相邻入口间沿环道真实连通的完整转角步道", paving, turn(corner, a), .28));
      for (const edge of [-1, 1]) {
        for (const [low, high] of [[24, 26], [28, 40]]) {
          const center = turn([[(low! + high!) / 2, edge * 5.5]], a)[0]!, value = box("道路外侧为过街坡口留空的公共步道段", center[0], .14, center[1], high! - low!, .28, 2, paving); value.rotation.y = -a * 180 / Math.PI; parts.push(value);
        }
        const start = turn([[27, edge * 4.5]], a)[0]!;
        parts.push(profileBody("各入口过街带真实接上外侧步道的路缘缓坡", paving, [[0, 0], [2, 0], [2, .28], [0, .12]], 2, [start[0], 0, start[1]], -(a + edge * Math.PI / 2) * 180 / Math.PI));
      }
      for (const splitter of [[[20, 0], [21.5, -.7], [26, -.7], [26, .7], [21.5, .7]], [[28, -.7], [33, -.7], [34, 0], [33, .7], [28, .7]]] as [number, number][][]) parts.push(hardPlan("过街处断开且车流端真实收尖的入口分流岛", paving, turn(splitter, a), .28));
      const incoming: [number, number][] = [[34.5, 1.95], [32, 1.95], [32, 1.4], [30.8, 2.2], [32, 3], [32, 2.45], [34.5, 2.45]], outgoing: [number, number][] = [[31, -2.45], [33.5, -2.45], [33.5, -3], [34.7, -2.2], [33.5, -1.4], [33.5, -1.95], [31, -1.95]];
      parts.push(hardPlan("接近环道时指向入口的独立路面箭头", white, turn(incoming, a), .015, [0, .12, 0]), hardPlan("离开环道时指向外街的独立路面箭头", white, turn(outgoing, a), .015, [0, .12, 0]));
      for (const cross of [-3.6, -2.6, -1.6, -.6, .6, 1.6, 2.6, 3.6]) { const p = turn([[27, cross]], a)[0]!; (side % 2 ? vertical : horizontal).push([p[0], .13, p[1]]); }
    }
    parts.push(...boxBatch("东西入口跨越实降分流岛的完整行人条带", white, horizontal, [1.8, .02, .45]), ...boxBatch("南北入口跨越实降分流岛的完整行人条带", white, vertical, [.45, .02, 1.8]));
    return parts;
  }, "设施", "现代"),
  design("中央岛式有轨电车站街段", "地面双轨夹住可贯通候车岛，两侧机动车与外围人行道独立连续，岛台两端通过平缓坡和过街路线接到外围，钢轨旁的真实窄槽与上方接触线形成完整街面轨行空间", () => {
    const island: [number, number][] = [[-2.5, -19], [-2.5, 19], [-1.2, 21], [1.2, 21], [2.5, 19], [2.5, -19], [1.2, -21], [-1.2, -21]], parts: ModelPart[] = [box("轨道街段各路线共用的完整低位基层", 0, .05, 0, 21, .1, 80, asphalt), hardPlan("两端收窄且候车区域完整贯通的真实岛台", paving, island, .42), box("独立岛台内不侵入电车净空的完整遮雨顶", 0, 3.8, 0, 4.8, .2, 28, metal)], posts: Triple[] = [], beams: Triple[] = [], droppers: Triple[] = [], crossing: Triple[] = [];
    for (const side of [-1, 1]) {
      const center = side * 3.85, railLeft = center - .7175, railRight = center + .7175;
      parts.push(box("轨行带以外的独立贯通机动车道", side * 8.125, .06, 0, 4.75, .12, 80, asphalt));
      for (const [low, high] of [[center - 1.55, railLeft - .05], [railLeft + .05, railRight - .05], [railRight + .05, center + 1.55]]) parts.push(box("钢轨两侧实际留槽且与街面同高的嵌轨铺面", (low! + high!) / 2, .11, 0, high! - low!, .02, 80, paving));
      for (const x of [railLeft, railRight]) parts.push(box("以米制轨距布置的连续街面钢轨", x, .12, 0, .07, .04, 80, metal), box("钢轨旁低于铺面的窄槽底", x, .105, 0, .1, .01, 80, dark));
      for (const [low, high] of [[-40, -29.2], [-26.8, 26.8], [29.2, 40]]) parts.push(box("外围人行道在两端过街位置留出的真实坡口", side * 12, .14, (low! + high!) / 2, 3, .28, high! - low!, paving));
      for (const end of [-1, 1]) parts.push(profileBody("外围过街路线实际下接轨行街面的路缘坡", paving, [[-1.5, 0], [1.5, 0], [1.5, .28], [-1.5, .12]], 2.4, [side * 12, 0, end * 28], side > 0 ? 0 : 180));
      parts.push(box("候车岛上下车边连续警示色带", side * 2.35, .43, 0, .16, .02, 37, white), box("与米制电车屋顶集电位置对应的连续接触线", center, 5.01, 0, .025, .025, 80, metal));
      for (const z of [-32, -16, 0, 16, 32]) { posts.push([side * 5.575, 2.8, z]); droppers.push([center, 5.255, z]); }
    }
    for (const z of [-32, -16, 0, 16, 32]) beams.push([0, 5.5, z]);
    for (const z of [-9, 0, 9]) {
      parts.push(box("候车岛中线实际落地且接住雨顶的窄立柱", 0, 2.06, z, .2, 3.28, .2, metal), box("雨顶中央立柱向两侧承托的实际横梁", 0, 3.6, z, 4.4, .2, .2, metal));
      for (const side of [-1, 1]) parts.push(rail([0, 3.1, z], [side * 2.1, 3.65, z], .07, metal));
    }
    for (const end of [-1, 1]) {
      parts.push(profileBody("候车岛两端实际下降并接入街面过街线的平缓实坡", paving, [[0, 0], [4, 0], [4, .12], [0, .42]], 2.4, [0, 0, end * 21], end > 0 ? -90 : 90), box("候车岛坡脚与两侧过街路线相接的低位步行段", 0, .06, end * 28, 5, .12, 6, paving));
      for (const x of [-10, -9, -8, -7, -6, -2, -1, 0, 1, 2, 6, 7, 8, 9, 10]) crossing.push([x, .13, end * 28]);
    }
    parts.push(...boxBatch("站台两端避开钢轨槽口的街面过街条带", white, crossing, [.5, .02, 2.1]), ...boxBatch("轨行带边缘不侵入车道的实际接触网立柱", metal, posts, [.12, 5.4, .12]), ...boxBatch("跨越轨行带并高于候车雨顶的接触网横撑", metal, beams, [11.3, .12, .12]), ...boxBatch("横撑实际连接到连续接触线的短吊线", metal, droppers, [.035, .49, .035]));
    return parts;
  }, "设施", "现代"),
];
