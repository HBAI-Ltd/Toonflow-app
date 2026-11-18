import type { ModelPart, Triple } from "../assetModelParts";
import { boxBatch, hardPlan, profileBody, riseSteps } from "./everydayOutdoorSpaceBatchOne";
import { box, colors, design, rail } from "./structures";

const stone = "#aab0a2", paving = "#c1bdab", asphalt = "#78887e", metal = "#6b8077", white = "#d5d6bc", green = "#8daa96";

function raisedCrossing(x: number, width: number): ModelPart[] {
  return [box("过街平台真正抬高到步道标高的路体", x, .2, 0, width, .16, 4, paving), profileBody("车辆接入抬高过街平台的前端缓坡", asphalt, [[-1, .12], [1, .12], [1, .28]], width, [x, 0, -3], -90), profileBody("车辆离开抬高过街平台的后端缓坡", asphalt, [[-1, .12], [1, .12], [1, .28]], width, [x, 0, 3], 90)];
}

function arrow(name: string, x: number, z: number, direction: number): ModelPart {
  const outline: [number, number][] = [[-.12, -2.6], [.12, -2.6], [.12, .6], [.8, .6], [0, 1.9], [-.8, .6], [-.12, .6]];
  return hardPlan(name, white, outline.map(([a, b]) => [a, b * direction]), .015, [x, .12, z]);
}

export const everydayOutdoorSpaceBatchTwoDesigns = [
  design("校门前分流接送街", "通过车道、路侧短停湾和连续非机动车带分别布置，同高过街平台把入口前场与两侧步道连通，车辆用缓坡越过平台，校门界墙保留真实通口", () => {
    const outline: [number, number][] = [[-4.5, -40], [4.5, -40], [4.5, 40], [-4.5, 40], [-4.5, 34], [-10.5, 25], [-10.5, -25], [-4.5, -34]], parts: ModelPart[] = [hardPlan("主路与独立渐变接送湾共同组成的完整路体", asphalt, outline, .12), box("接送湾外侧连接入口前场的连续公共步道", -12, .14, 0, 3, .28, 80, paving), box("与学校入口相对的另一侧完整公共步道", 10, .14, 0, 3, .28, 80, paving), box("与机动车分离并贯通街段的完整非机动车路带", 6.75, .06, 0, 2.5, .12, 80, green), box("校门外与公共步道同高的完整接送前场", -18, .14, 0, 9, .28, 20, paving), ...raisedCrossing(0, 9), ...raisedCrossing(-8.25, 4.5), ...raisedCrossing(6.75, 2.5)];
    for (const [x, width, length] of [[-5.25, 1.5, 23], [5, 1, 40], [8.25, .5, 40]]) {
      for (const side of [-1, 1]) parts.push(box("不同交通流之间为过街口留空的连续分隔岛", x!, .14, side * (length! + 4) / 2, width!, .28, length! - 4, stone));
      parts.push(box("同高过街位置真实连通相邻步道的平台短桥", x!, .14, 0, width!, .28, 4, paving));
    }
    const lines: Triple[] = [], crossings: Triple[] = [];
    for (const z of [-22, -14, -6, 6, 14, 22]) lines.push([-8.25, .13, z]);
    for (const x of [-9.9, -8.8, -7.7, -6.6, -4, -2.9, -1.8, -.7, .4, 1.5, 2.6, 3.7, 5.9, 7]) crossings.push([x, .29, 0]);
    parts.push(...boxBatch("接送湾为过街中心留净的短停位界线", white, lines, [4.2, .02, .07]), ...boxBatch("抬高过街平台上的连续行人条带", white, crossings, [.6, .02, 3.2]), arrow("非机动车连续行驶方向地面箭头", 6.75, 16, 1), arrow("接送车辆绕开主路短停的地面方向箭头", -8.25, -18, 1));
    for (const side of [-1, 1]) parts.push(box("入口前场围界在校门两侧保留真实通口", -22.5, .84, side * 6.75, .25, 1.4, 6.5, stone), box("校门通口两侧实际落地独立门柱", -22.5, 1.25, side * 3.5, .7, 2.5, .7, stone));
    return parts;
  }, "设施", "现代"),
  design("平行双岛公交换乘环场", "两条完整长候车岛围出贯通双向公交车道，岛外车道与两端回转区连成换乘环场，中央连续承顶柱撑住双侧遮雨棚，端部坡口和地面步行带通往外围", () => {
    const parts: ModelPart[] = [box("两候车岛与回转车道共同完整落地场坪", 0, .06, 0, 48, .12, 80, asphalt)], walking: Triple[] = [];
    for (const x of [-17, 0, 17]) parts.push(box("换乘车流实际接入外部道路的独立街口", x, .06, -44, x ? 7 : 10, .12, 8, asphalt));
    for (const side of [-1, 1]) {
      const x = side * 7.5, island: [number, number][] = [[-2.5, -22], [-2.5, 22], [-1.4, 24], [1.4, 24], [2.5, 22], [2.5, -22], [1.4, -24], [-1.4, -24]];
      parts.push(hardPlan("两端收窄但候车路线完整贯通的独立长站台岛", paving, island, .28, [x, 0, 0]), box("双侧上车边共同覆盖的完整高位遮雨棚", x, 4.7, 0, 5.8, .2, 35, metal), box("场外连续公共步道", side * 25.5, .14, 0, 3, .28, 80, paving));
      for (const z of [-15, -5, 5, 15]) {
        parts.push(box("不占公交停靠边的岛中承棚立柱", x, 2.44, z, .24, 4.32, .24, stone), box("承棚柱上方两侧实际接顶的横向托梁", x, 4.5, z, 5.6, .2, .25, metal));
        for (const edge of [-1, 1]) parts.push(rail([x, 3.6, z], [x + edge * 2.5, 4.55, z], .09, metal));
      }
      for (const end of [-1, 1]) {
        parts.push(profileBody("长候车岛端部真实下接场坪步行带的短缓坡", paving, [[0, 0], [2, 0], [2, .12], [0, .28]], 2.8, [x, 0, end * 24], end > 0 ? -90 : 90));
        for (let i = 0; i < 8; i++) walking.push([x, .13, end * (26.4 + i * 1.1)]);
      }
      for (const edge of [-1, 1]) parts.push(box("站台上下车边的连续浅色警示带", x + edge * 2.25, .29, 0, .16, .02, 42, white));
      parts.push(arrow("中央双向通行车道各自明确的行驶方向", side * 2.5, 0, side), arrow("绕候车岛外侧回转的公交行驶方向", side * 14, 0, -side));
    }
    for (const z of [-35, 35]) for (let i = 0; i <= 45; i++) walking.push([-22.5 + i, .13, z]);
    parts.push(...boxBatch("站台端部坡口接入外围的分段地面步行引导带", white, walking, [.55, .02, .65]), box("两侧场外步道后端完整连通的人行段", 0, .14, 41.5, 54, .28, 3, paving));
    return parts;
  }, "设施", "现代"),
  design("双口高路堤人行下穿廊", "高路堤中央留出完整贯通人行门洞，两端宽阶从高位公共步道下到低廊，两套折返实坡以平端接入上下通路，所有坡道和入口独立于车行面", () => {
    const parts: ModelPart[] = [box("上下穿路线共用的完整低位步行底坪", 0, .1, 0, 8, .2, 60, paving), box("跨越人行门洞的完整道路承重顶板", 0, 5.05, 0, 10, .3, 16, asphalt)];
    for (const x of [-4.5, 4.5]) parts.push(box("真正让出八米人行净口的路堤门洞承重侧墙", x, 2.55, 0, 1, 4.7, 22, stone));
    for (const side of [-1, 1]) {
      parts.push(profileBody("从路堤中央坡接外部道路的完整实心引坡", asphalt, [[0, 0], [35, 0], [35, .2], [0, 5.2]], 16, [side * 5, 0, 0], side > 0 ? 0 : 180), profileBody("随车道真实坡度连续下降的窄中央界线", white, [[0, 5.2], [35, .2], [35, .215], [0, 5.215]], .1, [side * 5, 0, 0], side > 0 ? 0 : 180));
      for (const end of [-1, 1]) parts.push(profileBody("高路堤两侧随车道坡行且与低廊独立的公共步带", paving, [[0, 0], [35, 0], [35, .2], [0, 5.2]], 3, [side * 5, 0, end * 9.5], side > 0 ? 0 : 180));
    }
    parts.push(box("门洞上方连续道路中央界线", 0, 5.2075, 0, 10, .015, .1, white));
    const upperPosts: Triple[] = [];
    for (const end of [-1, 1]) {
      const stair = riseSteps("从门洞低廊逐级接上外侧高位步道的完整宽阶", .2, 5.2, 25, .6, 4, [0, 0, end * 11]); stair.rotation.y = end > 0 ? -90 : 90; parts.push(stair, box("跨过下行阶梯高端且接通两侧上廊的完整横台", 0, 5.05, end * 27.5, 14, .3, 3, paving));
      parts.push(box("门洞上方车道外侧的完整公共步带", 0, 5.05, end * 9.5, 10, .3, 3, paving));
      for (const side of [-1, 1]) {
        parts.push(box("高位入口两侧不压住地面绕行线的架空步廊", side * 5.5, 5.05, end * 19.25, 3, .3, 16.5, paving), box("侧廊外缘实际落地并高出楼面护边的承重长墙", side * 7.15, 3.15, end * 19.25, .3, 6.3, 16.5, stone), rail([side * 4, 6.3, end * 11], [side * 4, 6.3, end * 26], .07, metal), rail([side * 2.05, 1.3, end * 11], [side * 2.05, 6.3, end * 26], .07, metal));
        for (const z of [11, 18.5, 26]) upperPosts.push([side * 4, 5.75, end * z]);
        for (const distance of [0, 7.5, 15]) upperPosts.push([side * 2.05, .75 + distance / 3, end * (11 + distance)]);
        upperPosts.push([side * 6.5, 5.75, end * 29]);
      }
      parts.push(rail([-7, 6.3, end * 29], [7, 6.3, end * 29], .07, metal));
      for (const x of [-6.5, 6.5]) parts.push(box("高端横台与架空步廊实际落地支柱", x, 2.45, end * 27.5, .45, 4.9, .45, stone));
      const side = end, yaw = side > 0 ? 0 : 180, first = profileBody("外侧折返实坡上跑在高端保留真实平坡接段", paving, [[0, 0], [26, 0], [26, 2.7], [2, 5.2], [0, 5.2]], 2.5, [side * 5, 0, end * 27], yaw), second = profileBody("外侧折返实坡下跑在低端保留真实平坡接段", paving, [[0, 0], [26, 0], [26, .2], [24, .2], [0, 2.7]], 2.5, [side * 31, 0, end * 19], yaw + 180);
      parts.push(first, second, box("两条实坡中间真实连通并能回转的同高平台", side * 32, 1.35, end * 23, 2.5, 2.7, 10.5, paving), box("实坡低端穿入侧廊下方并接到门洞低坪的横向步带", side * 4.15, .1, end * 19, 3.1, .2, 2.5, paving));
      for (const edge of [-1, 1]) {
        parts.push(profileBody("上跑实坡两侧连续随坡升降的防护边", metal, [[0, 5.2], [2, 5.2], [26, 2.7], [26, 3.8], [2, 6.3], [0, 6.3]], .1, [side * 5, 0, end * 27 + edge * 1.3], yaw), profileBody("下跑实坡两侧连续随坡升降的防护边", metal, [[0, 2.7], [24, .2], [26, .2], [26, 1.3], [24, 1.3], [0, 3.8]], .1, [side * 31, 0, end * 19 + edge * 1.3], yaw + 180));
      }
      parts.push(box("折返平台外侧连续防坠低墙", side * 33.2, 3.25, end * 23, .1, 1.1, 10.5, metal));
    }
    parts.push(...boxBatch("高低位步廊与阶道护栏真实接在步面上的短柱", metal, upperPosts, [.07, 1.1, .07]));
    return parts;
  }, "设施", "现代"),
  design("城市亲水台阶滨河步街", "高位公共沿河步道和低位临水步带贯通整段岸线，中段宽阶岸台直接连通两层，两端斜向坡行路线绕接上下步街，中央外阶另接地面入口，水界保持开放", () => {
    const parts: ModelPart[] = [box("沿整段城市岸线贯通的高位公共步街", -5, .8, 0, 6, 1.6, 72, paving), box("沿开放河面贯通且独立于上街的低位临水步带", 5, .2, 0, 2, .4, 72, paving), box("开放水界内用于显示岸线关系的静态水体", 12, .125, 0, 12, .25, 72, colors.water)];
    for (let i = 0; i < 6; i++) { const h = 1.4 - i * .2; parts.push(box("连续岸台中段逐级接到低位步带的宽石阶", -1.5 + i, h / 2, 0, 1, h, 46, stone)); }
    for (const end of [-1, 1]) {
      const length = Math.hypot(8, 10), yaw = -Math.atan2(-end * 10, 8) * 180 / Math.PI;
      parts.push(profileBody("两端斜向绕行且起步段实际保持平坡的接岸实坡", paving, [[0, 0], [length, 0], [length, .4], [2.5, 1.6], [0, 1.6]], 2.5, [-3, 0, end * 35], yaw));
      for (const edge of [-1, 1]) {
        const nx = Math.sin(yaw * Math.PI / 180), nz = Math.cos(yaw * Math.PI / 180);
        parts.push(profileBody("斜向接岸坡外缘连续随坡下降的防护边", metal, [[2.5, 1.6], [length, .4], [length, 1.5], [2.5, 2.7]], .08, [-3 + nx * edge * 1.3, 0, end * 35 + nz * edge * 1.3], yaw));
      }
    }
    const entrance = riseSteps("地面入口真实接上高位公共步街的独立宽阶", 0, 1.6, 8, .5, 4, [-12, 0, 0]); entrance.rotation.y = 0; parts.push(entrance);
    for (const [a, b] of [[-36, -2.2], [2.2, 36]]) parts.push(box("高位步街背缘为地面入口保留通口的完整界墙", -8.1, 1.25, (a! + b!) / 2, .2, 2.5, b! - a!, stone));
    for (const [a, b] of [[-36, -22], [-18, -4], [0, 14], [18, 36]]) parts.push(box("低位步带水缘分段连续的矮挡边", 5.95, .5, (a! + b!) / 2, .1, .2, b! - a!, stone));
    return parts;
  }, "设施", "现代"),
];
