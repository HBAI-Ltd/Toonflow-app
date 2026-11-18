import { part, ring, type ModelPart } from "../assetModelParts";
import { box, cylinder, design, rail, colors } from "./structures";
import { polygon } from "../masterNature/shared";
import { doorway, windowBand } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchTwo";

const stone = "#b3b6a9", paving = "#b8ac94", dark = "#52676d", wood = "#a18a68";

export const publicSpaceBatchThreeDesigns = [
  design("锯齿登车位长途汽车总站", "侧置候车楼通过连续锯齿站台伸向独立大巴车位，车头分别贴靠斜边，车尾接向贯通车行区", busTerminal, "建筑", "现代"),
  design("全向斜窗航空管制塔", "真正空心的高塔立井承托高位环行控制舱，倾斜连续玻璃向上外展，控制层环形地板保留电梯开口和真实上下贯通导轨", controlTower, "建筑", "现代"),
  design("半地下岛式铁路客站", "地面广场长洞口下布置独立岛式站台与两侧轨道，连续成组阶梯连接上下六米标高，高位透明顶覆盖洞口", sunkenStation, "建筑", "现代"),
  design("车位直达连房汽车旅馆", "两条低层客房翼部朝中央车行庭院开门，车位直接连接门前短廊，后侧统一接待房围成开口U形院落", courtyardMotel, "建筑", "现代"),
];

function busTerminal(): ModelPart[] {
  const deck: [number, number][] = [[-25, -20], [-8, -20]];
  for (let bay = 0; bay < 5; bay++) { const z = -18 + bay * 7.2; deck.push([-8, z], [-3, z + 2.8], [-8, z + 6.6]); }
  deck.push([-8, 20], [-25, 20]);
  const p: ModelPart[] = [box("汽车总站整片车行场坪", 0, .1, 0, 53, .2, 45, dark), polygon("连续锯齿登车站台完整实体", paving, deck, .22, [0, .2, 0]), box("侧置候车楼完整地板", -18, .32, 0, 12, .24, 38, paving), doorway("候车楼正面主入口", [-18, .44, -19], 12, 4.4, 2.6), doorway("候车楼后端独立疏散门", [-18, .44, 19], 12, 4.4, 1.8), ...windowBand("候车楼西侧透明长窗", -24, 0, 38, 4.6, 90), doorway("候车楼通向登车廊的实际出口", [-12, .44, 0], 38, 4.4, 3.2, 90), box("完整候车楼平顶屋盖", -18, 5.02, 0, 12.5, .25, 38.5, dark), box("锯齿登车廊上方连续宽雨棚", -7.2, 5.2, 0, 10.2, .2, 40.6, dark)];
  for (let bay = 0; bay < 5; bay++) {
    const z = -18 + bay * 7.2;
    p.push(box("锯齿候车廊不占车位的支柱", -10.5, 2.75, z + 1.6, .25, 4.66, .25, stone), rail([-2.7, .225, z + 3.1], [9, .225, z + 9.65], .07, "#cfcebb"), box("站台端部独立止轮矮缘", -3.3, .52, z + 2.8, .28, .2, .9, stone));
  }
  for (const z of [-13, -4, 5, 13]) p.push(box("候车大厅成列固定长座", -18.8, .85, z, 6.2, .3, .8, wood), ...[-1, 1].map(s => box("候车座两端落地脚", -18.8 + s * 2.5, .59, z, .15, .22, .6, dark)));
  p.push(box("售票与询问服务台", -17, 1.12, 16, 7.5, 1.1, .8, stone), box("大巴贯通车行区外缘低分隔岛", 20.2, .35, 0, .7, .3, 40, stone));
  return p;
}

function controlTower(): ModelPart[] {
  const p: ModelPart[] = [cylinder("航空管制塔独立落地承台", 0, .2, 0, 7, .4, stone), doorway("塔脚实际进入电梯前室的门洞", [0, .4, -2], 4, 3.2, 1.3), box("塔脚前室后侧完整围墙", 0, 2, 2, 4, 3.2, .3, stone), ...[-1, 1].map(s => box("塔脚前室两侧真实围墙", s * 1.85, 2, 0, .3, 3.2, 4, stone)), part("内外双面的真正空心高位塔井", "lathe", stone, [0, 3.6, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.9, y: 0 }, { x: 1.9, y: 23.8 }, { x: 1.5, y: 23.8 }, { x: 1.5, y: 0 }, { x: 1.9, y: 0 }] }), ring("保留真实电梯开口的环行控制层地板", paving, 4.2, 2.7, 27.5, .3), part("外展且内外闭合的全向控制舱玻璃", "lathe", colors.glass, [0, 27.65, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 3.8, y: 0 }, { x: 4.8, y: 4 }, { x: 4.72, y: 4 }, { x: 3.72, y: .08 }, { x: 3.8, y: 0 }], opacity: .24, roughness: .15 }), cylinder("管制舱独立宽出檐顶盖", 0, 31.9, 0, 10.1, .35, dark), cylinder("屋顶通信系统独立细桅", 0, 33.1, 0, .1, 2.05, dark)];
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    p.push(rail([Math.cos(a) * 3.8, 27.65, Math.sin(a) * 3.8], [Math.cos(a) * 4.8, 31.65, Math.sin(a) * 4.8], .12, dark));
    const console = box("环向布置而不堵电梯内口的管制台", Math.cos(a) * 3.1, 28.4, Math.sin(a) * 3.1, 1.7, .9, .65, dark); console.rotation.y = -i * 45 - 90; p.push(console);
  }
  for (const x of [-.9, .9]) for (const z of [-.9, .9]) p.push(rail([x, .4, z], [x, 28.2, z], .045, dark));
  p.push(box("处于塔脚且有独立边界的电梯轿厢地板", 0, .55, 0, 1.7, .2, 1.7, dark), ...[-1, 1].map(s => box("电梯轿厢两侧围板", s * .85, 1.8, 0, .04, 2.3, 1.7, dark)), box("电梯轿厢后围板", 0, 1.8, .85, 1.7, 2.3, .04, dark));
  return p;
}

function sunkenStation(): ModelPart[] {
  const p: ModelPart[] = [box("半地下客站整体基础", 0, .1, 0, 42, .2, 67, stone), polygon("真正保留站厅长洞口的地面公共广场", paving, [[-21, -33], [21, -33], [21, 33], [-21, 33]], .4, [0, 6, 0], [[[-10, -29], [10, -29], [10, 29], [-10, 29]]]), box("洞口下方独立中央岛式站台", 0, .32, 0, 8, .24, 56, paving), ...[-1, 1].map(s => box("下沉站厅两侧连续挡土实墙", s * 10.2, 3.2, 0, .4, 6, 59, stone)), ...[-1, 1].map(s => box("下沉站厅两端挡土墙", 0, 3.2, s * 29.4, 20.4, 6, .4, stone))];
  for (const s of [-1, 1]) {
    p.push(box("岛式站台侧方独立轨道底床", s * 6.8, .25, 0, 3.9, .1, 58, "#85948a"), box("站台边缘连续警示带", s * 3.7, .455, 0, .25, .03, 55, "#c6b67f"), part("地面洞口上方斜面透明雨盖", "box", colors.glass, [s * 5.1, 8.3, 0], [10.5, .06, 58.6], [0, 0, -s * 10], { opacity: .25, roughness: .15 }));
    for (const offset of [-.75, .75]) p.push(box("下沉轨道双钢轨", s * 6.8 + offset, .4, 0, .09, .2, 58, dark));
    for (const z of [-24, -12, 0, 12, 24]) p.push(box("透明顶沿广场边缘落地的细柱", s * 10.1, 6.925, z, .15, 1.05, .15, dark));
    for (let flight = 0; flight < 3; flight++) p.push(stairFlight("连续连接地下与地面层的真正宽阶", 0, .44 + flight * 5.96 / 3, s * (16 + flight * 3.6), 3.2, 12, 5.96 / 36, .3, s < 0));
    p.push(box("高端阶梯与公共广场洞口边缘准确齐平的入口桥板", 0, 6.28, s * 27.9, 3.2, .24, 2.2, paving));
  }
  p.push(rail([0, 9.25, -29.3], [0, 9.25, 29.3], .16, dark), ...[-1, 1].map(s => box("中央采光脊在洞口端部落地的支柱", 0, 7.82, s * 29.3, .2, 2.84, .2, dark)));
  return p;
}

function courtyardMotel(): ModelPart[] {
  const p: ModelPart[] = [box("汽车旅馆包含停车庭的完整地基", 0, .1, 0, 41, .2, 42, dark), box("后端接待与值班楼地板", 0, .33, 17, 22, .26, 6.5, paving), doorway("接待楼朝向车行庭院的真实入口", [0, .46, 13.75], 22, 3.3, 1.6), box("接待楼完整后墙", 0, 2.11, 20.25, 22, 3.3, .25, stone), ...[-1, 1].map(s => box("接待楼两侧封合外墙", s * 10.85, 2.11, 17, .3, 3.3, 6.5, stone)), box("后端接待楼完整屋面", 0, 3.96, 17, 22.5, .2, 7, dark), box("接待值班服务台", 0, 1.15, 18.5, 6, 1.1, .8, wood)];
  for (const s of [-1, 1]) {
    p.push(box("四间连房的完整客房翼地板", s * 15, .33, 0, 8, .26, 28, paving), box("客房背向车庭的连续外墙", s * 19, 2.11, 0, .25, 3.3, 28, stone), box("客房翼完整连续低坡屋面", s * 15, 3.96, 0, 8.5, .22, 28.5, dark), box("客房门前与停车位分开的连续短廊", s * 10.4, .33, 0, 1.2, .26, 28, paving));
    for (let division = 0; division <= 4; division++) p.push(box("每间客房之间真正贯通厚度的隔墙", s * 15, 2.11, -14 + division * 7, 8, 3.3, .18, stone));
    for (let room = 0; room < 4; room++) {
      const z = -10.5 + room * 7;
      p.push(doorway("每个独立客房直接通向自有车位的门洞", [s * 11, .46, z], 7, 3.3, 1.1, 90), box("车位靠近短廊的矮止轮块", s * 9.45, .27, z, .22, .14, 1.7, paving), ...[-1, 1].map(end => box("庭内车位两侧停车分界线", s * 7.2, .215, z + end * 1.4, 4.5, .03, .07, "#d0d2c2")));
    }
  }
  return p;
}
