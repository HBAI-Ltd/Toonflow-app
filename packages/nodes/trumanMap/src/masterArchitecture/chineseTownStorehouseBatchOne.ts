import { beam, part, ring, type ModelPart } from "../assetModelParts";
import { hardPlan, profileBody, riseSteps } from "./everydayOutdoorSpaceBatchOne";
import { holesAt, openingWall, tiledRoof } from "./periodPublicSpaceBatchOne";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";

const stone = "#aaa48f", plaster = "#c6bda4", wood = "#886848", dark = "#66503c", tiles = "#66746b", grain = "#b4a17a", water = "#779b99";

export const chineseTownStorehouseBatchOneDesigns: ArchitecturePrototype[] = [
  design("高基双仓装卸常平仓院", "中式古代古城常备：围院内两座独立高基官仓，各自有装卸坡、门前平台和通风高窗，正门与双仓之间保持贯通货道", publicGranaryCourt, "建筑", "中式"),
  design("方身架空板壁防鼠粮仓", "中式古代古城常备：方身密板仓室落在石帽木桩与交叠底梁上，外挑入口接连续木梯，区别窄长透棂欧式粮仓", raisedPlankGranary, "建筑", "中式"),
  design("前秤侧巷后栈收粮行", "中式古代古城常备：开敞前厅设架秤和验粮案，独立侧巷经侧门收粮入后栈，营业进店与粮包装卸互不阻挡", weighingGrainShop, "建筑", "中式"),
  design("跨街偏置梯廊坊门更铺", "中式古代古城常备：穿街门洞上为开放值更楼，侧置值房与两段外梯、上楼接桥各自真实贯通，不作大型城楼缩放", wardWatchGate, "建筑", "中式"),
  design("双渠汲水公共井台洗衣院", "中式古代古城常备：真实井孔穿过院坪，架梁汲水井旁设两组排水洗衣槽、斜洗衣石及通至街边的两条明沟", publicWellWashCourt, "建筑", "中式"),
];

function publicGranaryCourt(): ModelPart[] {
  const p: ModelPart[] = [box("仓院场坪", 0, .09, 0, 19.6, .18, 19.6, stone), openingWall("院门留货车口", 19, 2.8, holesAt([0], 3.8, 2.7), [0, .18, -9.4], 0, plaster), box("仓院后垣", 0, 1.58, 9.4, 19, 2.8, .3, plaster), tiledRoof("官仓院门小瓦盖", 5, 1.2, 2.98, [0, -9.4], tiles)];
  for (const side of [-1, 1]) {
    const x = side * 5;
    p.push(box("仓院侧垣", side * 9.4, 1.58, 0, .3, 2.8, 18.8, plaster), box("防潮高石基", x, .59, 2, 5.2, .82, 9.2, stone), openingWall("仓房前卸粮门", 5, 3.6, holesAt([0], 1.8, 2.7), [x, 1, -2.5], 0, plaster), openingWall("仓房后通风窗", 5, 3.6, holesAt([-1.3, 1.3], .9, .6, 2.5), [x, 1, 6.5], 0, plaster), tiledRoof("仓房独立灰瓦盖", 5, 9, 4.6, [x, 2], tiles), box("门前卸粮平台", x, .59, -2.95, 5.2, .82, 1.2, stone), profileBody("从场坪接卸粮台的整坡", stone, [[0, .18], [3, .18], [3, 1]], 2, [x, 0, -6.4], -90));
    for (const edge of [-1, 1]) p.push(openingWall("仓房高窗侧壁", 9, 3.6, holesAt([-2.8, 0, 2.8], .9, .6, 2.5), [x + edge * 2.5, 1, 2], 90, plaster), box("垫粮木架底枋", x + edge * 1.4, 1.1, 2.5, 1.2, .2, 5.8, dark), box("架上封闭粮垛", x + edge * 1.4, 1.85, 2.5, 1.1, 1.3, 5.5, grain));
    for (const z of [-2.3, 2, 6.3]) for (const edge of [-1, 1]) p.push(box("仓房接屋盖木柱", x + edge * 2.28, 2.8, z, .22, 3.6, .22, wood));
  }
  p.push(box("仓务验收石座", 7.8, .48, -6.6, 1.6, .6, 1.2, stone), box("仓务验收木案", 7.8, .84, -6.6, 1.8, .12, 1.35, wood));
  return p;
}

function raisedPlankGranary(): ModelPart[] {
  const p: ModelPart[] = [];
  for (const x of [-1.6, 1.6]) for (const z of [-1.6, 1.6]) p.push(cylinder("落地石础", x, .1, z, .58, .2, stone), box("架仓木桩", x, .7, z, .32, 1, .32, dark), cylinder("宽檐防鼠石帽", x, 1.26, z, .88, .16, stone));
  for (const z of [-1.6, 1.6]) p.push(box("石帽横向承仓枋", 0, 1.45, z, 4.5, .22, .25, dark));
  for (const x of [-1.6, 1.6]) p.push(box("接横枋的纵底梁", x, 1.63, -.2, .24, .18, 4.8, wood));
  p.push(box("挑出门口的仓底板", 0, 1.81, -.2, 4.5, .18, 4.8, wood), openingWall("板仓真门", 4.1, 2.35, holesAt([0], 1.05, 1.95), [0, 1.9, -2.05], 0, wood), box("方仓后密板", 0, 3.075, 2.05, 4.1, 2.35, .16, wood), tiledRoof("方仓低檐灰瓦顶", 4.2, 4.3, 4.25, [0, 0], tiles));
  for (const side of [-1, 1]) {
    p.push(openingWall("板仓侧壁高气窗", 4.1, 2.35, holesAt([0], 1.4, .35, 1.72), [side * 2.05, 1.9, 0], 90, wood), box("门前外挑梁", side * .58, 1.63, -2.24, .14, .18, .72, wood), beam("入口木梯边梁", dark, [side * .57, .12, -5.05], [side * .57, 1.83, -2.54], .16));
    for (const z of [-2.05, 2.05]) p.push(box("方仓通高角柱", side * 2.05, 3.075, z, .22, 2.35, .22, dark));
    p.push(box("壁脚连枋", side * 2.05, 2.02, 0, .2, .18, 4.2, dark), box("檐下连枋", side * 2.05, 4.16, 0, .24, .18, 4.2, dark));
  }
  for (let i = 1; i <= 8; i++) p.push(box("连续登仓木踏步", 0, .12 + 1.71 * i / 8, -5.05 + 2.51 * i / 8, 1.15, .14, .32, wood));
  p.push(box("仓内垫粮板", 0, 1.98, .7, 3.3, .16, 1.6, dark), box("板上贮粮包垛", 0, 2.65, .7, 3.1, 1.18, 1.45, grain));
  return p;
}

function weighingGrainShop(): ModelPart[] {
  const p: ModelPart[] = [box("粮行店巷地台", 0, .11, 0, 9.6, .22, 10.6, stone), openingWall("前秤厅临街大开间", 6.3, 3.5, holesAt([0], 5.4, 3.15), [-1.35, .22, -5], 0, plaster), box("前秤厅左墙", -4.5, 1.97, -2.5, .3, 3.5, 5, plaster), box("后栈左墙", -4.5, 2.27, 2.5, .3, 4.1, 5, plaster), openingWall("秤厅进后栈门", 6.3, 4.1, holesAt([1], 1.5, 2.6), [-1.35, .22, 0], 0, plaster), openingWall("后栈背窗墙", 6.3, 4.1, holesAt([-1.7, 1.7], 1.2, .7, 2.8), [-1.35, .22, 5], 0, plaster), openingWall("后栈侧巷收粮口", 5, 4.1, holesAt([0], 1.7, 2.6), [1.8, .22, 2.5], 90, plaster), tiledRoof("临街秤厅瓦盖", 6.3, 5, 3.72, [-1.35, -2.5], tiles), tiledRoof("后栈抬高瓦盖", 6.3, 5, 4.32, [-1.35, 2.5], tiles), box("巷外界墙", 4.6, 1.62, 0, .22, 2.8, 10, plaster), box("前厅验粮柜座", -2.9, .61, -3.5, 2.6, .78, .7, dark), box("验粮柜面", -2.9, 1.06, -3.5, 2.8, .12, .9, wood)];
  for (const x of [-4.35, 1.65]) for (const z of [-4.8, -.2]) p.push(box("前厅接檐木柱", x, 1.97, z, .22, 3.5, .22, wood));
  p.push(box("侧巷单坡雨檐", 3.15, 3.35, 1, 2.6, .15, 8.3, tiles));
  for (const z of [-3, 1, 5]) p.push(box("侧巷雨檐柱", 4.4, 1.75, z, .16, 3.06, .16, wood));
  for (const x of [-.65, 1.25]) p.push(box("秤架落地足", x, .32, -1.9, .5, .2, .65, dark), box("秤架立柱", x, 1.58, -1.9, .16, 2.52, .16, wood));
  p.push(box("秤架接柱横梁", .3, 2.89, -1.9, 2.15, .18, .2, dark), cylinder("秤梁吊杆", .3, 2.6, -1.9, .04, .5, dark), box("悬挂平衡秤梁", .3, 2.35, -1.9, 1.8, .07, .09, wood));
  for (const x of [-.4, 1]) {
    p.push(cylinder("秤盘吊绳", x, 1.92, -1.9, .025, .83, dark), cylinder("秤盘底", x, 1.49, -1.9, .68, .055, dark), ring("秤盘围边", dark, .34, .035, 1.54, .07, { position: { x, y: 1.54, z: -1.9 } }));
  }
  for (const x of [-3.2, -.6]) for (const z of [1.5, 3.8]) p.push(box("后栈防潮木垫", x, .34, z, 1.8, .24, 1.5, dark), box("后栈粮包垛", x, .99, z, 1.65, 1.06, 1.35, grain));
  return p;
}

function wardWatchGate(): ModelPart[] {
  const p: ModelPart[] = [box("坊门街坪", -.65, .1, -.25, 15.1, .2, 9.7, stone), box("值房地基", -5.3, .31, .6, 4.5, .22, 5.5, stone), openingWall("更铺值房前门", 4.2, 2.8, holesAt([0], 1.1, 2.35), [-5.3, .42, -2], 0, plaster), box("值房后壁", -5.3, 1.82, 3.2, 4.2, 2.8, .3, plaster), box("值房外侧墙", -7.4, 1.82, .6, .3, 2.8, 5.2, plaster), openingWall("值房面街窗", 5.2, 2.8, holesAt([0], 1.1, 1, 1), [-3.2, .42, .6], 90, plaster), tiledRoof("更铺偏置瓦顶", 4.2, 5.2, 3.22, [-5.3, .6], tiles)];
  for (const side of [-1, 1]) p.push(box("穿街洞旁厚墙", side * 2.55, 1.9, 0, 1.1, 3.4, 2.8, plaster), box("门洞过梁落柱", side * 2.1, 1.9, -1.15, .3, 3.4, .3, dark));
  p.push(box("四米街洞上整过梁", 0, 3.49, 0, 6.2, .22, 2.8, dark), box("值更楼承重板", 0, 3.72, 0, 6.2, .24, 2.8, wood), riseSteps("坊门外第一段梯", .2, 2.02, 8, .28, 1.3, [4.4, 0, -4.1]), box("中间转接平台", 4.4, 1.91, -1.56, 1.3, .22, .6, stone), box("中台落地墩", 4.4, 1.0, -1.56, .4, 1.6, .4, stone), riseSteps("坊门外第二段梯", 2.02, 3.84, 8, .28, 1.3, [4.4, 0, -1.26]), box("梯顶接楼小桥", 3.9, 3.72, 1.2, 2.5, .24, .8, wood), box("小桥落地木柱", 4.9, 1.9, 1.2, .22, 3.4, .22, dark), tiledRoof("值更楼灰瓦顶", 6.2, 2.8, 6.5, [0, 0], tiles));
  for (const x of [-2.8, 2.8]) for (const z of [-1.1, 1.1]) p.push(box("更楼通檐木柱", x, 5.17, z, .22, 2.66, .22, wood));
  for (const z of [-1.3, 1.3]) {
    const length = z < 0 ? 6.1 : 5.2, x = z < 0 ? 0 : -.45;
    p.push(box("更楼临街护栏扶手", x, 4.79, z, length, .1, .1, dark), box("更楼下栏枋", x, 4.17, z, length, .08, .08, wood));
    for (const px of [-2.8, -1.4, 0, 1.4]) p.push(box("护栏接板竖棂", px, 4.31, z, .075, .94, .075, wood));
  }
  for (const z of [-1.3, 1.3]) p.push(box("西边栏柱", -3, 4.31, z, .08, .94, .08, wood));
  for (const z of [-1.3, .6]) p.push(box("登楼口边栏柱", 3, 4.31, z, .08, .94, .08, wood));
  p.push(box("西侧护栏", -3, 4.79, 0, .1, .1, 2.6, dark), box("东侧让开登楼口护栏", 3, 4.79, -.35, .1, .1, 1.9, dark), box("悬钟承梁", 0, 6.4, 0, 5.6, .2, .24, dark), cylinder("值更钟吊杆", 0, 6.03, 0, .06, .6, dark), part("值更铜钟", "lathe", "#858870", [0, 5.05, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .42, y: 0 }, { x: .39, y: .12 }, { x: .27, y: .65 }, { x: .13, y: .78 }, { x: 0, y: .78 }, { x: 0, y: .69 }, { x: .19, y: .58 }, { x: .31, y: .08 }, { x: .34, y: 0 }] }), box("更铺木榻", -5.3, .73, 1.9, 2.3, .62, 1.3, wood));
  return p;
}

function publicWellWashCourt(): ModelPart[] {
  const bore: [number, number][] = Array.from({ length: 20 }, (_, i) => [-2 + Math.cos(i * Math.PI / 10) * .73, Math.sin(i * Math.PI / 10) * .73]);
  const p: ModelPart[] = [hardPlan("井孔明沟真正留空院坪", stone, [[-5, -4.5], [.95, -4.5], [.95, 2.7], [1.25, 2.7], [1.25, -4.5], [2.95, -4.5], [2.95, 2.7], [3.25, 2.7], [3.25, -4.5], [5, -4.5], [5, 4.5], [-5, 4.5]], .18, [0, 0, 0], [bore]), ring("石砌中空井筒", stone, .95, .22, .56, .76, { position: { x: -2, y: .56, z: 0 } }), ring("圆井厚压口", plaster, 1.02, .29, .96, .14, { position: { x: -2, y: .96, z: 0 } }), cylinder("井底水面", -2, .025, 0, 1.43, .025, water), box("院后矮墙", 0, .83, 4.4, 10, 1.3, .2, plaster), box("井侧矮墙", -4.9, .83, 0, .2, 1.3, 8.8, plaster)];
  for (const x of [-3.35, -.65]) p.push(box("汲水架落地石脚", x, .3, 0, .5, .24, .5, stone), box("汲水木柱", x, 1.62, 0, .2, 2.4, .24, wood));
  p.push(box("井架接柱横梁", -2, 2.87, 0, 3.15, .18, .28, dark), cylinder("吊轮支轴", -2, 2.56, 0, .1, .46, dark, [90, 0, 0]), cylinder("汲水吊轮", -2, 2.56, 0, .36, .1, wood, [90, 0, 0]), cylinder("落井绳", -2.18, 1.5, 0, .025, 2.12, grain), beam("回绳至手摇辘轳", grain, [-1.875, 2.689, 0], [-.65, 1.5, .1], .025), cylinder("侧柱手摇辘轳", -.65, 1.5, .1, .19, .64, dark, [90, 0, 0]), box("辘轳摇臂", -.65, 1.35, .43, .075, .35, .075, wood), cylinder("摇臂手柄", -.65, 1.18, .6, .065, .3, wood, [90, 0, 0]));
  for (const z of [-.19, .19]) p.push(box("梁下滑轮吊耳", -2, 2.67, z, .12, .34, .08, dark));
  for (const x of [1.1, 3.1]) p.push(box("贯通街边明沟底", x, .025, -.9, .3, .05, 7.2, dark));
  for (const z of [-1.4, 1.4]) {
    const outlet = z < 0 ? 1.325 : 2.875, closed = z < 0 ? 2.875 : 1.325;
    p.push(box("洗衣槽石底", 2.1, .22, z, 1.65, .08, 2.3, stone), box("洗槽封闭长边", closed, .395, z, .1, .27, 2.3, stone));
    for (const side of [-1, 1]) p.push(box("洗槽端边", 2.1, .395, z + side * 1.1, 1.65, .27, .1, stone), box("留排水口的槽边", outlet, .395, z + side * .65, .1, .27, 1, stone));
    p.push(box("洗衣槽浅水", 2.1, .3, z, 1.44, .02, 2.08, water), box("槽口接明沟流水", z < 0 ? 1.28 : 2.92, .285, z, .38, .025, .28, water), part("向槽内倾斜的洗衣石", "box", plaster, [2.7, .54, z], [.65, .12, 1.6], [0, 0, 12]));
    for (let i = 0; i < 5; i++) p.push(part("洗衣石纹脊", "box", stone, [2.686, .6055, z - .5 + i * .25], [.58, .014, .025], [0, 0, 12]));
  }
  p.push(box("院后歇脚石凳座", -2.6, .38, 3.5, 2.8, .4, .5, stone), box("歇脚石凳面", -2.6, .62, 3.5, 3.1, .12, .65, plaster));
  return p;
}
