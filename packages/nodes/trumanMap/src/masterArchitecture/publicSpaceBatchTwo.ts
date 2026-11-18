import { part, type ModelPart } from "../assetModelParts";
import { box, cylinder, design, rail, colors } from "./structures";
import { barrelRoof, rectangularFlue } from "./spatialShells";
import { polygon } from "../masterNature/shared";
import { doorway, windowBand, arcDeck } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchSteps";

export { stairFlight };

const stone = "#b1b4a6", dark = "#506369", wood = "#a48b66", paving = "#b6aa91";

export const publicSpaceBatchTwoDesigns = [
  design("水下透明隧道水族展馆", "两侧水体和上方连续水层环绕真实穿行隧道，水体截面挖去隧道空腔，前后干燥参观厅独立接通", aquariumHall, "建筑", "现代"),
  design("双缓冲前室蝶类生态展馆", "三条透明拱廊围合下方种植沟，入口双道错位缓冲室与中心栈道组成完整生态参观空间", butterflyHouse, "建筑", "现代"),
  design("长坡室内滑雪馆", "约四十米连续升高的滑行面与旁侧上行传送道共处斜剖大馆，顶板与侧墙同坡衔接，后方高位出发厅接到雪坡上端", skiHall, "建筑", "现代"),
  design("四区连桥制播演播中心", "四座无柱制作厅通过中央控播核心和高位服务连桥连接，每座制作厅分别设置大件搬运门和独立屋面", televisionCenter, "建筑", "现代"),
  design("驶入式阶台汽车电影院", "宽大停车阶台分别朝向独立巨幕，内侧连续车行通道绕过低位放映服务岛，出入口不穿越银幕安全前场", driveInCinema, "建筑", "现代"),
  design("分区闭环汽车驾驶考试场", "缓坡、曲线路段、侧方停车袋与倒车入库位通过有宽度的贯通车道接入外圈行驶环路", drivingCourse, "建筑", "现代"),
  design("环看台赛马拍卖厅", "中央宽展马圈接向后方独立进出马通道，两侧观众阶带逐级抬高，后场入口对准环栏缺口", horseAuctionHall, "建筑", "现代"),
  design("分层烟道消防训练塔院", "多层可进入的窗口训练塔接向独立折返楼梯井，侧面贯通烟道与院内供水槽共同组成训练作业区", fireTrainingCourt, "建筑", "现代"),
  design("船池帆装室内训练馆", "低位完整船池被高位环绕干作业平台包围，独立桅杆训练坑与吊装横梁保持净空，长跨度屋盖服务帆具课程", sailingTrainingHall, "建筑", "现代"),
  design("湿干火三院陶艺教学楼", "湿作坊、通风晾坯院与独立烧成院分为三翼，通过有顶连廊连通，火作区和公共教学区之间保留实际防火院隙", ceramicSchool, "建筑", "现代"),
  design("峡谷悬挑玻璃访客中心", "岸后服务房把悬挑观景舱锚在双侧斜撑上，舱下保持通透，玻璃地板与实心过渡走道连续相接", canyonVisitorCenter, "建筑", "现代"),
  design("双桅张索鸟类飞行展馆", "双高桅与外周锚柱张起大跨网格外壳，参观桥穿过高飞行空间，出入口具有独立缓冲前室", aviaryHall, "建筑", "现代"),
  design("环廊犬舍领养中心", "公共领养走廊与独立后勤喂养道分列犬舍两侧，每个犬舍真正通向露天活动栏，中心庭院允许围行参观", adoptionCenter, "建筑", "现代"),
  design("架空地沟汽车检测中心", "平齐入口车道在中央跨过真实下沉检修沟，沟内步梯与车辆通道分开，屋盖由车道两侧门架承托", inspectionCenter, "建筑", "现代"),
  design("现金核心分流银行营业厅", "客户接待环围绕独立现金内核，外侧自助营业前室与后场转运室各有真实通道，金库围护与公共大厅分开", bankHall, "建筑", "现代"),
];

function aquariumHall(): ModelPart[] {
  const tunnel = barrelRoof("真正具有内外表面的透明隧道壳", 1.7, .08, 19.3, [0, .5, 0], colors.glass); tunnel.opacity = .25;
  const p: ModelPart[] = [box("水族馆整体基础底盘", 0, .15, 0, 18, .3, 29, stone), box("中央隧道干燥参观楼面", 0, .4, 0, 3.4, .2, 19, paving), ...[-1, 1].map(s => box("水槽外侧观察窗下挡水实墙", s * 6.2, .65, 0, .3, .7, 19.4, stone)), ...[-1, 1].map(s => box("水槽外侧观察窗上封合梁", s * 6.2, 5.55, 0, .3, .3, 19.4, stone)), tunnel, doorway("前端参观大厅入口", [0, .3, -14.3], 18, 6.5, 2.6), doorway("后端参观大厅出口", [0, .3, 14.3], 18, 6.5, 2.6), ...[-1, 1].map(s => box("展馆两侧建筑围墙", s * 8.8, 3.55, 0, .25, 6.5, 28.6, stone)), box("展馆整体高屋盖", 0, 7, 0, 18.4, .3, 29.4, dark)];
  const waterProfile = [{ x: -6, y: 0 }, { x: -1.8, y: 0 }];
  for (let i = 0; i <= 12; i++) { const angle = Math.PI - i * Math.PI / 12; waterProfile.push({ x: Math.cos(angle) * 1.8, y: .2 + Math.sin(angle) * 1.8 }); }
  waterProfile.push({ x: 1.8, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 5.1 }, { x: -6, y: 5.1 });
  p.push(part("截面真正避开穿行隧道的连续水体", "extrude", colors.water, [0, .3, 0], [1, 1, 1], [0, 0, 0], { depth: 19.1, profile: waterProfile, opacity: .4, roughness: .16 }));
  const endProfile = waterProfile.map(point => ({ x: Math.abs(point.x) === 6 ? Math.sign(point.x) * 6.35 : point.x, y: point.y === 5.1 ? 5.4 : point.y }));
  for (const s of [-1, 1]) p.push(part("紧贴透明拱壳而不留矩形漏口的挡水端墙", "extrude", stone, [0, .3, s * 9.6], [1, 1, 1], [0, 0, 0], { depth: .3, profile: endProfile }));
  for (const z of [-11.9, 11.9]) p.push(box("前后干厅完整地台", 0, .4, z, 16.8, .2, 4.5, paving));
  for (const s of [-1, 1]) { p.push(part("水槽与馆廊之间的透明观鱼长窗", "box", colors.glass, [s * 6.2, 3.2, 0], [.07, 4.4, 18.7], [0, 0, 0], { opacity: .2 })); for (const z of [-9.4, 0, 9.4]) p.push(box("观鱼长窗之间真实承压立框", s * 6.2, 3, z, .3, 5.4, .25, stone)); }
  return p;
}

function butterflyHouse(): ModelPart[] {
  const p: ModelPart[] = [box("生态馆连续基础", 0, .1, 0, 21, .2, 25, paving), doorway("生态馆前方入口", [0, .2, -12.3], 21, 4.6, 1.5), doorway("生态馆后方独立出口", [0, .2, 12.3], 21, 4.6, 1.5), ...[-1, 1].map(s => box("生态馆低挡土外墙", s * 10.3, 1.1, 0, .3, 1.8, 24.6, stone)), box("中央贯通干燥参观栈道", 0, .5, 0, 2.3, .3, 24.6, wood)];
  for (const x of [-6.8, 0, 6.8]) {
    const canopy = barrelRoof("透明内外双面的连续生态拱顶", 3.4, .05, 24.9, [x, 4.8, 0], colors.glass); canopy.opacity = .25;
    p.push(canopy, ...[-1, 1].map(s => part("拱下连续透明高墙", "box", colors.glass, [x + s * 3.4, 2.5, 0], [.04, 4.6, 24.8], [0, 0, 0], { opacity: .2 })));
    for (const z of [-10, 0, 10]) p.push(box("三拱共同落地承柱", x - 3.4, 2.55, z, .16, 4.7, .16, dark));
    for (const s of [-1, 1]) p.push(part("把生态拱廊前后端真正封合的半圆透明端窗", "extrude", colors.glass, [x, 4.8, s * 12.42], [1, 1, 1], [0, 0, 0], { depth: .05, profile: Array.from({ length: 13 }, (_, i) => ({ x: Math.cos(i * Math.PI / 12) * 3.4, y: Math.sin(i * Math.PI / 12) * 3.4 })), opacity: .25 }));
  }
  for (const s of [-1, 1]) p.push(box("馆内真正低于栈道的种植沟", s * 5, .3, 0, 6.7, .2, 19, "#8d9770"), doorway("错位缓冲室第一道内门", [s * .5, .2, s * 10.1], 3.8, 4.6, 1.3), box("错位内门与前室侧墙之间的封合短墙", -s * 1.9, 2.5, s * 10.1, 1, 4.6, .18, stone), ...[-1, 1].map(t => box("缓冲前室两侧连续短挡墙", t * 2.4, 2.5, s * 11.2, .16, 4.6, 2.2, stone)), box("生态馆横向参观连桥", 0, .55, s * 6, 19.8, .2, 1.5, wood));
  return p;
}

function skiHall(): ModelPart[] {
  const p: ModelPart[] = [box("滑雪馆长形基础", 0, .1, 0, 21, .2, 47, paving), part("完整连续上升的实体雪坡", "extrude", "#cbd4d0", [0, .2, 0], [1, 1, 1], [0, -90, 0], { depth: 14, profile: [{ x: -20, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 12 }, { x: -20, y: .03 }] }), part("与雪坡同向的宽传送上行带", "extrude", dark, [8.3, .2, 0], [1, 1, 1], [0, -90, 0], { depth: 1.4, profile: [{ x: -20, y: .05 }, { x: 20, y: 12.02 }, { x: 20, y: 12.13 }, { x: -20, y: .16 }] }), doorway("低端入口宽门洞", [0, .2, -23], 20, 3.2, 3, 0, 2.8), box("高端出发厅下部承重后墙", 0, 6.2, 23, 20, 12, .3, stone), doorway("高位出发厅后端入口", [0, 12.2, 23], 20, 5, 2.4, 0, 3), box("雪坡高端出发平台", 0, 12.1, 21.5, 18.5, .2, 3, paving), part("同斜剖面完全衔接的整体屋盖", "extrude", dark, [0, .2, 0], [1, 1, 1], [0, -90, 0], { depth: 20.5, profile: [{ x: -23, y: 3.2 }, { x: 23, y: 17 }, { x: 23, y: 17.22 }, { x: -23, y: 3.42 }] })];
  for (const s of [-1, 1]) p.push(part("从低端到高端连续抬升的侧墙", "extrude", stone, [s * 9.9, .2, 0], [1, 1, 1], [0, -90, 0], { depth: .25, profile: [{ x: -23, y: 0 }, { x: 23, y: 0 }, { x: 23, y: 17 }, { x: -23, y: 3.2 }] }));
  for (const x of [-7.2, 7.2, 9.2]) p.push(rail([x, 1.1, -20], [x, 13.1, 20], .06, dark));
  for (const z of [-16, -8, 0, 8, 16]) p.push(rail([-9.6, 10.15 + .3 * z, z], [9.6, 10.15 + .3 * z, z], .2, dark));
  return p;
}

function televisionCenter(): ModelPart[] {
  const p: ModelPart[] = [
    box("制播中心完整基础", 0, .1, 0, 36, .2, 34, paving),
    box("中央控播服务核心地板", 0, .4, 0, 8, .4, 10, paving),
    ...[-1, 1].map(s => box("中央核心下部连续承重侧墙", s * 4, 2.9, 0, .25, 5.4, 10, stone)),
    ...[-1, 1].map(s => doorway("中央控播前后入口", [0, .2, s * 5], 8, 8.2, 2.3)),
    box("中央控播核心高屋顶", 0, 8.6, 0, 8.3, .3, 10.3, dark),
    polygon("真正保留内楼梯井的控播层地板", paving, [[-4, -5], [4, -5], [4, 5], [-4, 5]], .2, [0, 5.4, 0], [[[-3.5, -4.4], [.4, -4.4], [.4, .2], [-3.5, .2]]]),
    stairFlight("控播核心内首段楼梯", -2.6, .6, -4, 1.5, 12, 2.5 / 12, .3),
    stairFlight("控播核心内折返第二段楼梯", -.5, 3.1, -.4, 1.5, 12, 2.5 / 12, .3, true),
    box("控播内楼梯中间休息平台", -1.55, 3, -.2, 3.8, .2, .6, paving),
    box("控播内楼梯高端接入楼板的平台", -.5, 5.5, -4.3, 1.7, .2, .6, paving),
  ];
  for (const s of [-1, 1]) p.push(part("控播层侧壁两座真正的连桥门洞", "extrude", stone, [s * 4, 5.6, 0], [1, 1, 1], [0, 90, 0], { depth: .25, profile: [{ x: -5, y: 0 }, { x: -4.9, y: 0 }, { x: -4.9, y: 2.5 }, { x: -3.7, y: 2.5 }, { x: -3.7, y: 0 }, { x: 3.7, y: 0 }, { x: 3.7, y: 2.5 }, { x: 4.9, y: 2.5 }, { x: 4.9, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 2.8 }, { x: -5, y: 2.8 }] }));
  for (const x of [-11, 11]) for (const z of [-8.6, 8.6]) {
    const side = Math.sign(x), end = Math.sign(z);
    p.push(box("独立演播厅隔声楼面", x, .35, z, 12.5, .3, 14, paving), box("演播厅远离核心的连续外墙", x + side * 6.25, 4.2, z, .35, 8, 14, stone), box("演播厅内侧下部承重墙", side * 4.75, 2.9, z, .35, 5.4, 14, stone), doorway("服务连桥真正进入演播厅的高位门洞", [side * 4.75, 5.6, z / 2], 5.4, 2.6, 1.6, 90, 2.4), box("高门以外继续封合的演播厅内墙", side * 4.75, 6.9, end * 11.3, .35, 2.6, 8.6, stone), box("演播厅远端封墙", x, 4.2, z + end * 7, 12.5, 8, .3, stone), doorway("各制作厅独立大件搬运门", [x, .2, z - end * 7], 12.5, 8, 4, 0, 4.8), box("演播厅无柱独立屋面", x, 8.5, z, 12.9, .35, 14.4, dark), box("制作厅高位服务连桥", side * 4.55, 5.5, z / 2, 1.25, .2, 1.5, colors.metal));
    for (const offset of [-3.5, 3.5]) p.push(box("高位灯光吊轨", x + offset, 6.8, z, .12, .15, 12.5, dark));
  }
  return p;
}

function driveInCinema(): ModelPart[] {
  const p: ModelPart[] = [box("汽车影院完整车行地坪", 0, .1, 0, 45, .2, 47, dark), box("独立巨幕前场基础", 0, .3, -19.5, 29, .4, 3, stone), box("巨幅室外电影银幕", 0, 8.5, -20, 29, 14, .18, "#cbd0c6"), ...[-1, 1].map(s => box("巨幕实心支柱", s * 12.5, 7.4, -19.8, .6, 14.4, .6, stone)), box("放映服务岛平台", 0, .45, 19, 8, .5, 6, paving), doorway("放映服务小屋入口", [0, .7, 21.8], 8, 3.2, 1.2), box("放映小屋前侧窗下墙", 0, 1.5, 16.2, 8, 1.6, .25, stone), box("放映窗上方墙头", 0, 3.65, 16.2, 8, .5, .25, stone), ...[-1, 1].map(s => box("放映服务岛侧壁", s * 4, 2.3, 19, .2, 3.2, 5.6, stone)), box("放映屋完整平顶", 0, 4.1, 19, 8.3, .24, 6.3, dark)];
  for (let row = 0; row < 5; row++) {
    const z = -9 + row * 5.1, rise = .18 + row * .08;
    p.push(part("前轮抬升朝向银幕的连续停车坡台", "extrude", paving, [0, .2, z], [1, 1, 1], [0, 90, 0], { depth: 33, profile: [{ x: -2.1, y: 0 }, { x: 2.1, y: 0 }, { x: 2.1, y: rise }, { x: 1.7, y: rise }, { x: -2.1, y: .03 }] }));
    for (const x of [-12, -6, 0, 6, 12]) p.push(box("停车位窄边界分隔条", x, .215, z, .065, .025, 4, "#cbd0c6"));
  }
  p.push(box("绕过服务岛的入口分隔岛", -13.5, .38, 19, 1.2, .36, 6, stone), box("影院车辆出口分隔岛", 13.5, .38, 19, 1.2, .36, 6, stone));
  return p;
}

function drivingCourse(): ModelPart[] {
  const p: ModelPart[] = [box("闭环驾驶考试场基层", 0, .1, 0, 48, .2, 47, paving), polygon("保留中央练习岛的环向车道", dark, [[-23, -22], [23, -22], [23, 22], [-23, 22]], .06, [0, .2, 0], [[[-17, -16], [17, -16], [17, 16], [-17, 16]]]), box("场中横贯考试直线连接路", 0, .23, 0, 34, .06, 5.5, dark), ...[-1, 1].map(s => box("通向中央科目的支路", s * 13.7, .23, 0, 5.5, .06, 32, dark)), part("坡道定点停车的完整上行实坡", "extrude", dark, [-7, .26, 10], [1, 1, 1], [0, 0, 0], { depth: 4.5, profile: [{ x: -6, y: 0 }, { x: 6, y: 0 }, { x: 6, y: .03 }, { x: 2, y: 1 }, { x: -1, y: 1 }, { x: -6, y: .03 }] }), box("倒车入库纵深车位基层", 5.4, .24, -9.8, 5.5, .08, 8.5, dark), box("侧方停车袋形场地", 5.5, .24, 10.5, 12, .08, 5.6, dark)];
  for (const z of [-13.5, -6.1]) p.push(box("倒库位前后边线", 5.4, .29, z, 5.5, .02, .08, "#d4d4c4"));
  for (const x of [2.7, 8.1]) p.push(box("倒库位两侧边线", x, .29, -9.8, .08, .02, 7.4, "#d4d4c4"));
  for (const s of [-1, 1]) p.push(box("侧方停车袋两端界线", 5.5 + s * 5.5, .29, 10.5, .08, .02, 5.3, "#d4d4c4"));
  p.push(arcDeck("S形第一段曲线车道", [-6.25, .31, -14], 2.2, 5.3, Math.PI / 2, 0, 0, Math.PI / 2), arcDeck("S形反向回弯车道", [-6.25, .31, -6.5], 2.2, 5.3, Math.PI / 2, 0, 0, -Math.PI / 2), box("曲线起点连接外圈的实际车道", -10, .28, -15, 3.1, .06, 2.2, dark), box("曲线终点连接中央干道的实际车道", -2.5, .28, -4.6, 3.1, .06, 3.8, dark), box("坡道终点与停车区之间的连接带", -.65, .24, 10, .9, .08, 4.5, dark));
  for (const x of [-20, 20]) for (const z of [-19, 19]) p.push(cylinder("场地四角低位隔离桩", x, .6, z, .22, .8, stone));
  return p;
}

function horseAuctionHall(): ModelPart[] {
  const p: ModelPart[] = [box("拍马厅独立大面积基础", 0, .1, 0, 28, .2, 27, paving), doorway("拍马厅观众入口", [0, .2, -13.2], 28, 6.3, 2.5), doorway("展马后场真正大门", [0, .2, 13.2], 28, 6.3, 3.3, 0, 3.6), ...[-1, 1].map(s => box("拍马厅完整外侧墙", s * 13.7, 3.35, 0, .3, 6.3, 26.4, stone)), box("拍马厅完整大跨屋盖", 0, 6.85, 0, 28.5, .4, 27.5, dark), cylinder("中央不阻挡环行的沙质展马岛", 0, .25, 0, 8, .1, "#c4b58e")];
  for (let i = 0; i < 11; i++) { const angle = (110 + i * 32) * Math.PI / 180; p.push(rail([Math.cos(angle) * 6.6, .2, Math.sin(angle) * 6.6], [Math.cos(angle) * 6.6, 1.25, Math.sin(angle) * 6.6], .09, wood)); if (i < 10) { const next = (110 + (i + 1) * 32) * Math.PI / 180; p.push(rail([Math.cos(angle) * 6.6, 1.1, Math.sin(angle) * 6.6], [Math.cos(next) * 6.6, 1.1, Math.sin(next) * 6.6], .08, wood)); } }
  for (const s of [-1, 1]) for (let row = 0; row < 4; row++) p.push(box("展马圈外分级抬升观众席", s * (8.3 + row * 1.1), .3 + (row + 1) * .35 / 2, 0, 1.1, (row + 1) * .35, 21, wood));
  p.push(box("后端进马廊连续平地", 0, .23, 10, 3.4, .06, 6.5, "#c4b58e"));
  return p;
}

function fireTrainingCourt(): ModelPart[] {
  const p: ModelPart[] = [box("消防训练塔与院落共同基础", 0, .1, 0, 24, .2, 24, paving)];
  for (let floor = 0; floor < 4; floor++) {
    const y = .2 + floor * 3;
    p.push(box("训练塔逐层承重楼板", -3.5, y + .1, 3.5, 8, .2, 8, stone), doorway("训练塔前方真实救援大窗", [-3.5, y + .2, -.5], 8, 2.8, 2, 0, 2), ...[-1, 1].map(s => box("训练塔两侧封合墙", -3.5 + s * 3.9, y + 1.6, 3.5, .25, 2.8, 8, stone)), doorway("每层连接独立楼梯井的内门", [-3.5, y + .2, 7.5], 8, 2.8, 1.2));
  }
  p.push(box("训练塔独立高位顶板", -3.5, 12.4, 3.5, 8.4, .25, 8.4, dark), box("独立楼梯井后墙", -3.5, 6.3, 11, 8, 12.2, .25, stone));
  for (let floor = 0; floor < 4; floor++) p.push(stairFlight("塔后上半段独立折返楼梯", -5.5, .2 + floor * 3, 8, 1.8, 8, .1875, .28), stairFlight("塔后下半段独立折返楼梯", -1.5, 1.7 + floor * 3, 10.24, 1.8, 8, .1875, .28, true), box("两段折返楼梯共同中间平台", -3.5, 1.61 + floor * 3, 10.5, 6, .18, .65, stone), box("楼梯高端实际通入训练层的平台", -3.5, 3.11 + floor * 3, 7.75, 6, .18, .55, stone));
  for (const s of [-1, 1]) p.push(box("院内供水练习槽侧壁", 6 + s * 2, .95, -5, .2, 1.5, 4, stone), box("供水槽前后壁", 6, .95, -5 + s * 2, 4, 1.5, .2, stone));
  p.push(box("训练供水槽底板", 6, .3, -5, 4, .2, 4, stone), part("训练水槽中的静水面", "box", colors.water, [6, 1.35, -5], [3.75, .03, 3.75], [0, 0, 0], { opacity: .65 }), rectangularFlue("塔侧真正贯通的竖向训练烟道", 1.1, .9, 12.6, .12, [-8.25, .2, 4.8], dark), box("训练院内宽工作台", 5.5, .8, 3, 5, 1.2, 2, dark));
  return p;
}

function sailingTrainingHall(): ModelPart[] {
  const p: ModelPart[] = [box("帆装馆整体承重基础", 0, .1, 0, 25, .2, 29, paving), box("船池完整底板", 0, .3, 0, 12, .2, 18, stone), ...[-1, 1].map(s => box("船池两侧连续挡水墙", s * 6, 1.1, 0, .25, 1.4, 18.3, stone)), ...[-1, 1].map(s => box("船池前后挡水墙", 0, 1.1, s * 9, 12, 1.4, .25, stone)), part("船池中的静水体", "box", colors.water, [0, 1.4, 0], [11.7, .05, 17.7], [0, 0, 0], { opacity: .65, roughness: .15 }), polygon("围绕船池的连续干作业平台", wood, [[-11.8, -13], [11.8, -13], [11.8, 13], [-11.8, 13]], .25, [0, 1.8, 0], [[[-6.1, -9.2], [6.1, -9.2], [6.1, 9.2], [-6.1, 9.2]]]), doorway("帆装馆完整高门立面", [0, 2.05, -14.2], 25, 10.5, 3.6, 0, 4.5), box("帆装馆完整后立面", 0, 7.3, 14.2, 25, 10.5, .3, stone), ...[-1, 1].map(s => box("高帆两侧连续外墙", s * 12.2, 6.45, 0, .3, 12.5, 28.4, stone)), box("保留高桅杆净空的大跨屋盖", 0, 13, 0, 25.5, .35, 29.4, dark), cylinder("固定在干作业区的完整教学桅杆", -8.7, 6.45, 2, .2, 8.8, wood), rail([-8.7, 4.5, 2], [-8.7, 4.5, -5], .15, wood), ...[-1, 1].map(s => rail([-8.7, 10.8, 2], [-8.7 + s * 2, 2.05, 2], .035, dark)), stairFlight("地面进入高位作业平台的宽阶", 0, .2, -16.9, 3.4, 10, .185, .3), box("作业平台前端入口连接板", 0, 1.925, -13.7, 3.4, .25, 1.6, wood)];
  for (const x of [-10.5, 10.5]) for (const z of [-11, 0, 11]) p.push(box("高作业平台落地支柱", x, 1, z, .25, 1.6, .25, stone));
  p.push(rail([-12.15, 10.8, 3], [12.15, 10.8, 3], .3, dark), box("跨船池吊运梁下方滑车", 0, 10.5, 3, .8, .35, .65, dark), rail([0, 10.3, 3], [0, 6.8, 3], .025, dark));
  return p;
}

function ceramicSchool(): ModelPart[] {
  const p: ModelPart[] = [box("三院教学楼连续地基", 0, .1, 0, 31, .2, 27, paving), box("湿作坊整体地面", -10.3, .3, 0, 9.6, .2, 22, paving), box("干作坊整体地面", 1.2, .3, 8.4, 10.7, .2, 7.5, paving), box("隔院火作坊地面", 11.5, .3, 4, 6.3, .2, 15.8, paving), doorway("湿作坊前端宽门", [-10.3, .4, -11], 9.6, 4, 2.6), doorway("湿作坊与晾坯院之间侧门", [-5.5, .4, 0], 22, 4, 3.5, 90), box("湿作坊西外墙", -15.1, 2.4, 0, .25, 4, 22, stone), box("湿作坊后外墙", -10.3, 2.4, 11, 9.6, 4, .25, stone), box("湿作坊完整平屋面", -10.3, 4.6, 0, 10, .25, 22.4, dark), doorway("干坯教学翼朝院门洞", [1.2, .4, 4.65], 10.7, 3.7, 2.8), box("干作翼后部外墙", 1.2, 2.25, 12.15, 10.7, 3.7, .25, stone), ...[-1, 1].map(s => box("干作翼两端侧墙", 1.2 + s * 5.35, 2.25, 8.4, .25, 3.7, 7.5, stone)), box("干作翼完整屋盖", 1.2, 4.3, 8.4, 11.1, .25, 7.9, dark), doorway("火作院独立朝院门洞", [8.35, .4, 4], 15.8, 5, 2.4, 90, 3), box("火作翼远端外墙", 14.65, 2.9, 4, .25, 5, 15.8, stone), ...[-1, 1].map(s => box("火作翼两端外墙", 11.5, 2.9, 4 + s * 7.9, 6.3, 5, .25, stone)), box("火作翼高位排热屋面", 11.5, 5.6, 4, 6.7, .25, 16.2, dark), box("横穿敞院的有顶连廊屋面", 1.3, 3.7, -6.2, 14, .18, 2.4, dark)];
  for (const x of [-4.8, 1.3, 7.4]) p.push(box("连廊屋盖真正落地立柱", x, 1.95, -6.2, .16, 3.5, .16, wood));
  for (const z of [-6, 0, 6]) p.push(box("湿作坊连续重型拉坯工作台", -10.2, .95, z, 6, .18, 1.7, wood), ...[-1, 1].map(s => box("工作台落地脚板", -10.2 + s * 2.5, .63, z, .18, .46, 1.5, wood)));
  p.push(box("晾坯院内独立离地长架", 1.2, 1.2, 0, 6, .18, 1.7, wood), box("火作区下部隔热窑台", 11.5, .75, 6, 3.2, .7, 4, stone), cylinder("高于屋面的独立排烟筒", 13.5, 4.8, 7.8, .65, 8.8, dark));
  return p;
}

function canyonVisitorCenter(): ModelPart[] {
  const p: ModelPart[] = [box("岸后深锚整体承台", 0, 1.1, 6, 20, 2.2, 8, stone), box("岸后访客服务楼板", 0, 6.6, 6, 15, .3, 7.5, paving), doorway("岸后访客主入口", [0, 6.75, 9.8], 15, 4, 2.4), ...[-1, 1].map(s => box("岸后服务房侧墙", s * 7.5, 8.75, 6, .25, 4, 7.5, stone)), box("岸后服务屋面", 0, 10.95, 6, 15.5, .25, 8, dark), box("与观景舱相接的实心过渡走道", 0, 6.6, .9, 7, .3, 3, paving), part("伸出岸边的透明观景舱地板", "box", colors.glass, [0, 6.6, -5.5], [13, .15, 10], [0, 0, 0], { opacity: .35, roughness: .15 }), ...[-1, 1].map(s => part("观景舱透明侧面围护", "box", colors.glass, [s * 6.5, 8.65, -5.5], [.08, 4, 10], [0, 0, 0], { opacity: .25 })), part("观景舱前端完整透明视窗", "box", colors.glass, [0, 8.65, -10.5], [13, 4, .08], [0, 0, 0], { opacity: .23 }), box("观景舱上方连续轻屋盖", 0, 10.8, -5, 13.5, .22, 11, dark)];
  for (const s of [-1, 1]) p.push(rail([s * 5.8, 2.2, 3.5], [s * 5.8, 6.4, -9.8], .35, dark), rail([s * 5.8, 2.2, 8.5], [s * 5.8, 6.4, -1], .35, dark), rail([s * 6.45, 6.5, -10.5], [s * 6.45, 6.5, 2.2], .3, dark), ...[-9.8, -.4].map(z => box("玻璃厅角部连到屋面的细柱", s * 6.45, 8.65, z, .16, 4.2, .16, dark)), box("岸后服务房落地承托柱", s * 6.5, 4.35, 6.2, .35, 4.3, .35, stone));
  p.push(doorway("岸后服务厅通往观景舱的实际门洞", [0, 6.75, 2.25], 15, 4, 3), box("过渡走道上连续防雨顶板", 0, 10.8, 1.4, 7.4, .22, 1.9, dark));
  return p;
}

function aviaryHall(): ModelPart[] {
  const p: ModelPart[] = [box("鸟类展馆完整基础地坪", 0, .1, 0, 27, .2, 40.5, paving), ...[-1, 1].map(s => cylinder("双高桅的独立钢桅杆", 0, 7.2, s * 8, .25, 14, dark)), box("穿越高飞行空间的参观桥", 0, 2.4, 0, 2.8, .22, 27, wood)];
  for (const s of [-1, 1]) p.push(doorway("高位鸟馆缓冲门厅外立面", [0, 2.51, s * 16.2], 5, 3.4, 1.4, 0, 2.6), doorway("高位鸟馆内侧缓冲门", [0, 2.51, s * 13.7], 5, 3.4, 1.4, 0, 2.6), box("鸟馆前室与参观桥连续的地板", 0, 2.4, s * 14.85, 5, .22, 2.7, wood), box("鸟馆缓冲前室防雨屋盖", 0, 6.05, s * 14.85, 5.4, .2, 3.1, dark), ...[-1, 1].map(t => box("鸟馆缓冲前室两侧完整封墙", t * 2.5, 4.21, s * 14.95, .2, 3.4, 2.5, stone)));
  for (const x of [-12, 12]) for (const z of [-14, 0, 14]) p.push(cylinder("外周网壳锚定立柱", x, 2.65, z, .18, 4.9, dark));
  for (const x of [-6, 6]) for (const z of [-14, 14]) p.push(cylinder("端部网壳独立锚柱", x, 4.8, z, .18, 9.2, dark));
  for (const x of [-6, 6]) for (const z of [-7, 7]) {
    const holes: [number, number][][] = [];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const u = -5.85 + i * 1.96, v = -6.85 + j * 2.29; holes.push([[u, v], [u + 1.86, v], [u + 1.86, v + 2.19], [u, v + 2.19]]); }
    const net = polygon("大跨网壳的实体主张网格", dark, [[-6, -7], [6, -7], [6, 7], [-6, 7]], .025, [0, 0, 0], holes);
    net.vertices = net.vertices!.map(point => { const px = point.x + x, pz = point.z + z; return { x: px, y: 5 + 9 * (1 - Math.abs(px) / 12) * (1 - Math.min(1, Math.abs(Math.abs(pz) - 8) / 14) * .5) + point.y, z: pz }; });
    p.push(net);
  }
  for (const side of [-1, 1]) for (const center of [-7, 7]) {
    const holes: [number, number][][] = [];
    for (let i = 0; i < 7; i++) for (let row = 0; row < 2; row++) { const u = -6.9 + i * 2, v = .12 + row * 2.35; holes.push([[u, v], [u + 1.8, v], [u + 1.8, v + 2.15], [u, v + 2.15]]); }
    const wall = polygon("与屋面真正相接的侧向张网格", dark, [[-7, 0], [7, 0], [7, 4.8], [-7, 4.8]], .025, [0, 0, 0], holes);
    wall.vertices = wall.vertices!.map(point => ({ x: side * 12 + point.y - .0125, y: .2 + point.z, z: center + point.x })); p.push(wall);
  }
  for (const side of [-1, 1]) {
    const holes: [number, number][][] = [[[-1.1, 2.31], [1.1, 2.31], [1.1, 5.31], [-1.1, 5.31]]];
    for (let i = 0; i < 8; i++) for (let row = 0; row < 4; row++) {
      const u = -11.9 + i * 3, v = .15 + row * 2.65, end = u + 2.8, top = v + 2.45;
      const ceiling = 4.8 + 9 * (1 - Math.max(Math.abs(u), Math.abs(end)) / 12) * (11 / 14);
      if (top >= ceiling - .1 || (end > -1.1 && u < 1.1 && top > 2.31 && v < 5.31)) continue;
      holes.push([[u, v], [end, v], [end, top], [u, top]]);
    }
    const end = polygon("随张索屋面起伏且保留实际高位入口的端网", dark, [[-12, 0], [12, 0], [12, 4.8], [6, 8.3357142857], [0, 11.8714285714], [-6, 8.3357142857], [-12, 4.8]], .025, [0, 0, 0], holes);
    end.vertices = end.vertices!.map(point => ({ x: point.x, y: .2 + point.z, z: side * 14 - point.y + .0125 })); p.push(end);
  }
  for (const s of [-1, 1]) p.push(rail([0, 14.2, s * 8], [-12, 5.1, s * 14], .045, dark), rail([0, 14.2, s * 8], [12, 5.1, s * 14], .045, dark), rail([0, 14.2, s * 8], [-12, 5.1, 0], .045, dark), rail([0, 14.2, s * 8], [12, 5.1, 0], .045, dark));
  for (const z of [-15, -10, 0, 10, 15]) for (const s of [-1, 1]) p.push(box("参观桥实际落地支脚", s * 1.1, 1.245, z, .15, 2.09, .15, dark));
  p.push(stairFlight("由前厅抵达高位参观桥的阶梯", 0, .2, -19.8, 2.4, 12, .1925, .3), stairFlight("由参观桥离开后厅的阶梯", 0, .2, 19.8, 2.4, 12, .1925, .3, true));
  return p;
}

function adoptionCenter(): ModelPart[] {
  const p: ModelPart[] = [box("领养中心整片基础", 0, .1, 0, 30, .2, 28, paving), polygon("围绕中央庭院的连续公共领养廊", wood, [[-6, -12], [6, -12], [6, 12], [-6, 12]], .16, [0, .2, 0], [[[-3.8, -9.8], [3.8, -9.8], [3.8, 9.8], [-3.8, 9.8]]]), doorway("领养中心前方公共入口", [0, .2, -13.7], 12, 3.5, 2), box("入口登记前厅屋面", 0, 3.9, -12, 12.4, .25, 4, dark)];
  for (const s of [-1, 1]) {
    p.push(box("犬舍翼部完整屋面", s * 7.75, 3.5, 0, 4.2, .2, 24, dark));
    for (let i = 0; i < 4; i++) {
      const z = -9 + i * 6;
      p.push(doorway("犬舍朝公共廊真正观察门洞", [s * 5.7, .2, z], 6, 3.2, .9, 90, 2.1), doorway("犬舍通向室外活动栏真正门洞", [s * 9.8, .2, z], 6, 3.2, 1, 90, 1.8), box("相邻犬舍间隔声实墙", s * 7.75, 1.8, z - 3, 4.1, 3.2, .18, stone), box("活动栏之间实体隔栏", s * 12, 1.1, z - 3, 4.4, 1.8, .12, wood), box("犬舍内离地休息平台", s * 7.8, .45, z + 1, 2.3, .5, 2.4, wood));
      for (const end of [-1, 1]) p.push(rail([s * 14.2, .2, z + end * 2.5], [s * 14.2, 2.1, z + end * 2.5], .07, dark));
      p.push(rail([s * 14.2, 2.1, z - 2.9], [s * 14.2, 2.1, z + 2.9], .07, dark));
    }
    p.push(box("犬舍最后端完整实墙", s * 7.75, 1.8, 12, 4.1, 3.2, .18, stone));
    const holes: [number, number][][] = [];
    for (let i = 0; i < 48; i++) { const u = -11.9 + i * .5; holes.push([[u, .9], [u + .35, .9], [u + .35, 1.75], [u, 1.75]]); }
    const fence = polygon("室外活动栏完整通风围护", wood, [[-12, 0], [12, 0], [12, 1.9], [-12, 1.9]], .07, [0, 0, 0], holes);
    fence.vertices = fence.vertices!.map(point => ({ x: s * 14.2 + point.y - .035, y: .2 + point.z, z: point.x })); p.push(fence);
  }
  return p;
}

function inspectionCenter(): ModelPart[] {
  const p: ModelPart[] = [box("检测中心下沉工作区底板", 0, .1, 0, 21, .2, 26, stone), ...[-1, 1].map(s => box("车行层下部侧承重体", s * 7.4, 1, 0, 6.2, 1.6, 25.6, stone)), box("检修沟前端承重封台", 0, 1, -11.8, 8.6, 1.6, 2.4, stone), box("检修沟后端承重封台", 0, 1, 11.8, 8.6, 1.6, 2.4, stone), polygon("保留长检修沟和独立楼梯孔的真实检测楼板", dark, [[-4.3, -10.6], [4.3, -10.6], [4.3, 10.6], [-4.3, 10.6]], .3, [0, 1.5, 0], [[[-.45, -10], [.45, -10], [.45, 10], [-.45, 10]], [[-3.65, -10.2], [-2.35, -10.2], [-2.35, -7], [-3.65, -7]]]), doorway("车辆检测正面大门", [0, 1.8, -12.8], 21, 5.2, 4.4, 0, 3.7), doorway("检测后独立驶离大门", [0, 1.8, 12.8], 21, 5.2, 4.4, 0, 3.7), ...[-1, 1].map(s => box("检测中心两侧外墙", s * 10.3, 4.4, 0, .3, 5.2, 25.6, stone)), box("检测中心整体门架屋盖", 0, 7.3, 0, 21.5, .3, 26.5, dark), stairFlight("通过实际楼梯孔进入低位检修沟的工作阶梯", -3, .2, -10.1, 1.2, 10, .16, .3), part("车辆到达高位检测层的真正前坡", "extrude", dark, [0, .2, -15.3], [1, 1, 1], [0, -90, 0], { depth: 5.5, profile: [{ x: -2.5, y: 0 }, { x: 2.5, y: 0 }, { x: 2.5, y: 1.6 }, { x: -2.5, y: .03 }] }), part("车辆从检测层下降的真正后坡", "extrude", dark, [0, .2, 15.3], [1, 1, 1], [0, 90, 0], { depth: 5.5, profile: [{ x: -2.5, y: 0 }, { x: 2.5, y: 0 }, { x: 2.5, y: 1.6 }, { x: -2.5, y: .03 }] })];
  for (const z of [-9.5, 0, 9.5]) p.push(rail([-10, 7.1, z], [10, 7.1, z], .25, dark));
  p.push(box("侧向检测操作工作台", 7.1, 2.7, 1, 3, .9, 3, dark));
  return p;
}

function bankHall(): ModelPart[] {
  const p: ModelPart[] = [box("银行营业厅整体基础", 0, .1, 0, 22, .2, 23, paving), doorway("营业厅公共主入口", [0, .2, -11.3], 22, 4.5, 2.5), doorway("后场现金转运独立门洞", [0, .2, 11.3], 22, 4.5, 2), ...[-1, 1].map(s => box("营业厅两侧连续外墙", s * 10.8, 2.45, 0, .3, 4.5, 22.6, stone)), box("营业厅完整大跨屋盖", 0, 4.9, 0, 22.5, .3, 23.5, dark), doorway("前方自助营业区与大厅隔门", [0, .2, -6.5], 22, 4.5, 2.5), ...[-1, 1].map(s => box("现金核心侧面真正厚围护墙", s * 3.5, 2.1, 3.6, .5, 3.8, 11.4, stone)), doorway("现金核心后场受控入口", [0, .2, 9.3], 7, 3.8, 1.2), box("现金核心上部封顶板", 0, 4.1, 3.6, 7.4, .2, 11.8, stone), box("现金服务前柜实体", 0, 1.05, -2.1, 7.1, 1.1, .8, stone), box("柜台上部围护梁", 0, 3.45, -2.1, 7.1, 1.3, .25, stone), part("真正柜台窗口内透明隔板", "box", colors.glass, [0, 2.2, -2.1], [6.6, 1.2, .08], [0, 0, 0], { opacity: .25 }), doorway("后方转运室与客户区分隔门", [0, .2, 10], 22, 4.5, 1.8)];
  for (const s of [-1, 1]) p.push(box("柜台侧方连续客户等候台", s * 6.7, .65, 0, 3, .4, 1, wood), box("自助前室嵌墙机器列主体", s * 7.5, 1.55, -9.9, 4.6, 2.7, .8, dark), box("后场卷款分拣台", s * 6.8, 1, 8, 3.3, .2, 1.5, stone));
  return p;
}
