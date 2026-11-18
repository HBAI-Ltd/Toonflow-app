import type { ModelPart, Triple } from "../assetModelParts";
import { box, cylinder, design } from "./structures";
import { boxBatch, hardPlan, profileBody } from "./everydayOutdoorSpaceBatchOne";

const paving = "#bdbba9", asphalt = "#7c8b81", ballast = "#9ca593", timber = "#998666", metal = "#687e75", white = "#d4d4bd", red = "#b67d66", dark = "#50675d";

export const everydayOutdoorSpaceBatchSixDesigns = [
  design("公铁平交道口街段", "连续铁路与双向街路同高相交，钢轨两侧保留真实轮缘窄槽，车行及两侧步行铺面分别坡接外部街面，道口两侧设半幅落杆、固定信号与交叉警示板", () => {
    const parts: ModelPart[] = [profileBody("连续铁路道床两侧真实坡落到地面的完整道砟体", ballast, [[-1.75, 0], [-1.35, .2], [1.35, .2], [1.75, 0]], 80, [0, 0, 0], 90)], sleepers: Triple[] = [], dashes: Triple[] = [];
    for (let i = 0; i <= 120; i++) sleepers.push([-39 + i * .65, .275, 0]);
    parts.push(...boxBatch("贯通铁路道口并实际托住两根钢轨的独立轨枕", timber, sleepers, [.23, .15, 2.5]));
    for (const z of [-.7175, .7175]) parts.push(box("道口前后连续且轨距为一千四百三十五毫米的钢轨", 0, .425, z, 80, .15, .075, metal));
    for (const [low, high] of [[-4, -.7925], [-.6425, .6425], [.7925, 4]]) parts.push(box("钢轨旁保留轮缘空槽且与轨顶同高的道口填面", 0, .25, (low! + high!) / 2, 13.2, .5, high! - low!, paving));
    for (const end of [-1, 1]) {
      parts.push(box("铁路道口前后与轨顶同高的完整车辆过渡段", 0, .25, end * 6, 8, .5, 4, asphalt), profileBody("从道口轨顶标高连续坡接外街的完整车行实坡", asphalt, [[0, 0], [6, 0], [6, .2], [0, .5]], 8, [0, 0, end * 8], end > 0 ? -90 : 90), box("道口两端接入外部道路的连续双向街面", 0, .1, end * 27, 8, .2, 26, asphalt), box("半幅落杆之前的真实停车线", 0, .5075, end * 7.8, 7.7, .015, .1, white));
      for (const side of [-1, 1]) parts.push(box("两侧步道在铁路交叉前实际接到同高填面的平段", side * 5.3, .25, end * 6, 2.6, .5, 4, paving), profileBody("步行铺面单独缓坡接顺道口与外围人行道", paving, [[0, 0], [6, 0], [6, .35], [0, .5]], 2.6, [side * 5.3, 0, end * 8], end > 0 ? -90 : 90), box("道口外侧独立于车行面且连续贯通的公共步道", side * 5.3, .175, end * 27, 2.6, .35, 26, paving));
      for (const z of [17, 24, 31, 38]) dashes.push([0, .2075, end * z]);
      const side = -end, x = side * 7.2, z = end * 6.5;
      parts.push(box("道口半幅落杆机独立落地基座", x, .075, z, .8, .15, .8, paving), box("基座上实际承接铰轴的道口驱动机箱", x, .775, z, .45, 1.25, .5, metal), cylinder("与落杆和驱动箱实际相接的水平转轴", x, 1.5, z, .26, .65, metal, [90, 0, 0]), box("覆盖半幅车道及相邻步道的闭合道口栏杆", x / 2, 1.5, z, 7.2, .1, .12, white), box("转轴外侧实际连接的栏杆平衡短臂", x + side * .45, 1.5, z, .9, .1, .12, metal), box("短臂末端独立平衡重", x + side * .9, 1.5, z, .25, .4, .25, dark));
      for (const distance of [1.3, 3.3, 5.3]) parts.push(box("落杆正反面可见的相间警示色带", side * distance, 1.5, z, .45, .104, .124, red));
      const signalZ = end * 4.5;
      parts.push(box("道口信号装置实际落地的独立立柱", x, 1.6, signalZ, .1, 3.2, .1, metal), box("固定在立柱上的双信号灯横向安装架", x, 2.3, signalZ, 1.05, .12, .14, metal));
      for (const edge of [-1, 1]) {
        parts.push(cylinder("面向接近街路且固定于横架的圆形信号灯背壳", x + edge * .35, 2.3, signalZ + end * .08, .3, .13, dark, [90, 0, 0]), cylinder("位于真实灯壳内的静态道口警示灯面", x + edge * .35, 2.3, signalZ + end * .151, .22, .015, red, [90, 0, 0]));
        const cross = box("固定到信号立柱上方的交叉警示板", x, 3.05, signalZ, 1.5, .16, .07, white); cross.rotation.z = edge * 40; parts.push(cross);
      }
    }
    parts.push(...boxBatch("铁路道口外双向街路中央的分段界线", white, dashes, [.07, .015, 3]));
    const shape: [number, number][] = [[-.12, -2.2], [.12, -2.2], [.12, .5], [.7, .5], [0, 1.7], [-.7, .5], [-.12, .5]];
    for (const side of [-1, 1]) parts.push(hardPlan("两侧驶向落杆停车线的明确行驶箭头", white, shape.map(([x, z]) => [x, z * side]), .015, [side * 2, .2, -side * 20]));
    return parts;
  }, "设施", "现代"),
];
