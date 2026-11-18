import type { ModelPart, Triple } from "../assetModelParts";
import { box, cylinder, design } from "./structures";
import { boxBatch, hardPlan, profileBody, riseSteps } from "./everydayOutdoorSpaceBatchOne";

const concrete = "#a7afa4", paving = "#bcb8a7", asphalt = "#7c8b81", metal = "#71877f", rubber = "#52685e", white = "#d4d4bb";

export const everydayOutdoorSpaceBatchFiveDesigns = [
  design("分层接车物流服务庭", "完整U形高货台围住低位大车回转庭，三面独立凹式接车口配有搭板和缓冲块，侧面叉车实坡及后侧独立宽阶分别接入高位货台，车行入口保持正面开敞", () => {
    const outline: [number, number][] = [[-32, -14], [-25, -14]], sideBays = [[-11, -7], [-1, 3]], rearBays = [[-18, -14], [-2, 2], [14, 18]], parts: ModelPart[] = [box("接车服务庭车辆入口与完整回转区共用落地场坪", 0, .1, 0, 90, .2, 80, asphalt)], horizontal: Triple[] = [], vertical: Triple[] = [];
    for (const [low, high] of sideBays) outline.push([-25, low!], [-26, low!], [-26, high!], [-25, high!]);
    outline.push([-25, 21]);
    for (const [low, high] of rearBays) outline.push([low!, 21], [low!, 22], [high!, 22], [high!, 21]);
    outline.push([25, 21]);
    for (const [low, high] of sideBays.slice().reverse()) outline.push([25, high!], [26, high!], [26, low!], [25, low!]);
    outline.push([25, -14], [32, -14], [32, 28], [-32, 28]);
    parts.push(hardPlan("三面真实内凹接车口与贯通货台共同组成的完整U形承台", concrete, outline, 1.4));
    for (const side of [-1, 1]) {
      for (const [low, high] of sideBays) {
        const z = (low! + high!) / 2;
        parts.push(box("侧向凹式接车口内真正跨接货台与车尾的金属搭板", side * 25.3, 1.34, z, 1.4, .12, 3.3, metal), cylinder("侧向搭板后缘实际嵌入承台的通长铰轴", side * 26, 1.34, z, .12, 3.3, metal, [90, 0, 0]));
        for (const edge of [-1, 1]) parts.push(box("接车凹口两侧实际固定到高台正面的缓冲块", side * 25, 1.05, z + edge * 2.12, .2, .6, .25, rubber));
        for (const edge of [-1, 1]) horizontal.push([side * 17.1, .21, z + edge * 1.8]);
      }
      parts.push(profileBody("独立于货车回转庭的侧向叉车连续实坡", concrete, [[0, 0], [12, 0], [12, 1.4], [0, .2]], 3.5, [side * 35.5, 0, -26], -90), box("叉车坡高端平转接入U形货台的同高平台", side * 34.625, .7, -12.25, 5.25, 1.4, 3.5, concrete));
      for (const edge of [-1, 1]) parts.push(profileBody("侧向叉车坡外缘连续随坡升高的防护边", metal, [[0, .2], [12, 1.4], [12, 2.5], [0, 1.3]], .1, [side * 35.5 + edge * 1.8, 0, -26], -90));
      parts.push(box("高货台外边缘为叉车接入口留空的连续护墙", side * 31.95, 1.95, 8.75, .1, 1.1, 38.5, metal), box("货台前端保护低位庭但不封接车面的护边", side * 28.5, 1.95, -14, 7, 1.1, .1, metal), box("叉车转接平台外缘独立防护边", side * 37.2, 1.95, -12.25, .1, 1.1, 3.5, metal), box("叉车转接平台后缘为转入货台留净的防护边", side * 34.625, 1.95, -10.55, 5.25, 1.1, .1, metal));
      const stair = riseSteps("场坪后侧实际接入高位货台的人行独立宽阶", .2, 1.4, 6, .7, 2.4, [side * 10, 0, 32.2]); stair.rotation.y = 90; parts.push(stair);
    }
    for (const [low, high] of rearBays) {
      const x = (low! + high!) / 2;
      parts.push(box("后侧凹式接车口内实际伸向车尾的金属搭板", x, 1.34, 21.3, 3.3, .12, 1.4, metal), cylinder("后侧搭板实际嵌入货台的通长铰轴", x, 1.34, 22, .12, 3.3, metal, [0, 0, 90]));
      for (const edge of [-1, 1]) parts.push(box("后侧接车口两边实际固定到高台的缓冲块", x + edge * 2.12, 1.05, 21, .25, .6, .2, rubber));
      for (const edge of [-1, 1]) vertical.push([x + edge * 1.8, .21, 13.1]);
    }
    for (const [low, high] of [[-32, -11.3], [-8.7, 8.7], [11.3, 32]]) parts.push(box("高位货台背缘为两处人行宽阶保留真实出口的护墙", (low! + high!) / 2, 1.95, 27.95, high! - low!, 1.1, .1, metal));
    parts.push(...boxBatch("侧向接车时为大车保留实际纵深的地面导向界线", white, horizontal, [15, .02, .06]), ...boxBatch("后侧接车时朝向凹口的独立地面导向界线", white, vertical, [.06, .02, 15]));
    for (const side of [-1, 1]) parts.push(box("接车庭入口两侧低位连续公共步行地带", side * 39.5, .14, -18, 3, .28, 36, paving));
    return parts;
  }, "设施", "现代"),
];
