import { part, type ModelPart } from "../assetModelParts";
import { base, box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";
import { holesAt, openingWall, tiledRoof } from "./periodPublicSpaceBatchOne";
import { stairFlight } from "./historicSpaceBatchSeven";
import { verticalPanel, windowHole } from "./historicSpaceBatchNine";

const brick = "#8e9288", plaster = "#c3b79b", wood = "#78513e", red = "#a45440", tiles = "#566a67", gold = "#b29251";

export const chineseTownBatchOneDesigns: ArchitecturePrototype[] = [
  design("三券城台重檐古城门楼", "中式古代古装剧城池入口：厚砖城台的三个券洞真实贯通，城顶垛口围护朱柱重檐门楼，侧边登城石阶接通城台；不同于外伸弧郭瓮城与独立机械落闸", cityGateTower, "建筑", "中式"),
  design("双箭楼横廊木栅山寨正门", "中式古代山寨布景：两座完整承重木箭楼通过高栈廊连接，木栅侧墙护住地面门道，外置双梯分别接到箭楼平台，非同城楼换木材", timberStockadeGate, "建筑", "中式"),
  design("前埕抱厦后龛乡土土地庙", "中式古代村镇祭祀布景：低砖台上开放抱厦接入独立后殿神龛，前埕与侧踏道连续相通，后殿有真实侧窗，非寺庙山门通行入口", villageEarthTemple, "建筑", "中式"),
  design("十字通街砖座三层木钟楼", "中式古代城镇报时布景：四向十字通行砖座承住独立木钟层与回廊，侧梯抵达钟层并让开扶栏，钟体有真实中空钟口和悬梁；不同于开放柱式鼓楼", streetBellTower, "建筑", "中式"),
];

function cityGateTower(): ModelPart[] {
  const p: ModelPart[] = [base(28, 24, .2), verticalPanel("三条券道真实贯穿完整厚砖城台", [[-11, 0], [11, 0], [11, 6.2], [-11, 6.2]], [-6, 0, 6].map(x => windowHole(x, .035, 3.4, 4.6)), 8, [0, .2, 0], 0, brick), box("高城台连续城顶行走面", 0, 6.5, 0, 22.6, .2, 8.6, brick), tiledRoof("门楼下重檐完整灰瓦出挑屋盖", 16, 7, 10.1, [0, 0], tiles), tiledRoof("门楼上重檐收分灰瓦高顶", 12, 5, 12.1, [0, 0], tiles), box("上重檐下封闭阁顶木围护", 0, 11.1, 0, 10.8, 2, 4.1, red)];
  for (const x of [-7.2, -3.6, 0, 3.6, 7.2]) for (const z of [-2.7, 2.7]) p.push(cylinder("城台上实际接承上下屋架的朱木立柱", x, 8.35, z, .3, 3.5, red), box("朱柱下落在城顶的独立柱础", x, 6.71, z, .55, .22, .55, plaster));
  for (const z of [-2.7, 2.7]) p.push(box("朱柱顶连续承托出檐的额枋", 0, 10.02, z, 15, .25, .3, wood));
  p.push(openingWall("门楼后壁三路真通行门", 14.6, 3.5, holesAt([-4.8, 0, 4.8], 2, 2.8), [0, 6.6, 2.8], 0, red), box("门楼正面牌匾实接额枋", 0, 9.65, -2.9, 3.1, .65, .12, wood), stairFlight("城门右侧由平地直上城台的完整登城阶", 18, 1.8, 6.4, .45, 0, [12.5, .2, -9], -90), box("登城阶顶与城台同高的侧向接桥", 11.75, 6.5, .1, 3, .2, 2, brick), rail([10.8, 4, .2], [12.5, 6.4, .2], .28, brick));
  for (const z of [-4.15, 4.15]) {
    p.push(box("城顶前后连续女墙", 0, 6.95, z, 22.4, .7, .35, brick));
    for (let i = 0; i < 12; i++) p.push(box("女墙顶独立城垛保留垛口", -10.45 + i * 1.9, 7.55, z, .85, .5, .4, brick));
  }
  for (const x of [-11.1, 11.1]) p.push(box("城台两端留出登阶口的短女墙", x, 7, 2.9, .3, .8, 2.5, brick));
  return p;
}

function timberStockadeGate(): ModelPart[] {
  const p: ModelPart[] = [base(24, 20, .2), box("两箭楼间高栈廊的完整木板面", 0, 5.1, 0, 10, .25, 2.6, wood), box("地面门道上方不挡通行的寨门横梁", 0, 4.8, 0, 8.6, .35, .45, wood)];
  for (const x of [-6, 6]) {
    p.push(box("四主柱承接的独立箭楼平台", x, 5.1, 0, 4.5, .25, 4.5, wood), tiledRoof("箭楼柱架实际承托的灰瓦攒护屋盖", 4.8, 4.8, 8, [x, 0], tiles));
    for (const side of [-1, 1]) for (const end of [-1, 1]) p.push(cylinder("落地至屋架连续承力的箭楼大木柱", x + side * 1.8, 4.1, end * 1.8, .27, 7.8, wood), rail([x + side * 1.8, .4, end * 1.8], [x - side * 1.8, 4.95, end * 1.8], .17, wood));
    for (const z of [-1.8, 1.8]) p.push(box("箭楼柱顶横向承屋枋", x, 7.92, z, 3.9, .25, .28, wood));
    p.push(stairFlight("寨门后侧由地面直达箭楼的实木阶", 15, 1.2, 5.025, .4, 0, [x, .2, -8.25], -90));
    for (const side of [-1, 1]) p.push(box("箭楼侧边低护板实接平台", x + side * 2.1, 5.58, 0, .15, .7, 4.4, wood));
    p.push(box("箭楼前沿不占据后梯口的木护板", x, 5.58, 2.1, 4.4, .7, .15, wood));
  }
  for (const z of [-1.2, 1.2]) {
    p.push(box("高栈廊两侧连续扶手", 0, 6.15, z, 8, .12, .12, wood));
    for (const x of [-3.8, -1.9, 0, 1.9, 3.8]) p.push(cylinder("栈廊扶手实接木板面的栏柱", x, 5.7, z, .09, 1.1, wood));
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) p.push(part("寨门外侧连续落地的尖顶木栅桩", "lathe", wood, [side * (8.3 + i * .48), .2, .4], [1, 1, 1], [0, 0, 0], { profile: [{x:0,y:0},{x:.18,y:0},{x:.18,y:3.1},{x:0,y:3.6}] }));
    for (const y of [1.2, 2.6]) p.push(box("将木栅桩相连且接回箭楼的水平横档", side * 9.25, y, .2, 5, .15, .16, wood));
  }
  return p;
}

function villageEarthTemple(): ModelPart[] {
  const p: ModelPart[] = [base(14, 18, .2), box("前埕后殿共用的抬高砖石台", 0, .4, 1, 10, .4, 12, brick), tiledRoof("后殿独立曲线灰瓦整盖", 7, 5, 3.9, [0, 3.3], tiles), tiledRoof("前抱厦低出檐独立瓦盖", 6, 4, 3.2, [0, -1.1], tiles), openingWall("后殿面前抱厦保留真实入殿门", 7, 3.3, holesAt([0], 1.9, 2.8), [0, .6, .8], 0, plaster), box("神龛背后完整封合厚墙", 0, 2.25, 5.8, 7, 3.3, .3, plaster)];
  for (const side of [-1, 1]) {
    p.push(openingWall("后殿两侧实际透空的砖窗墙", 5, 3.3, holesAt([0], 1.1, 1.3, 1.3), [side * 3.5, .6, 3.3], 90, plaster));
    for (const z of [-2.8, .3]) p.push(cylinder("抱厦实际落台并托住低屋盖的木柱", side * 2.65, 1.9, z, .18, 2.6, red));
    p.push(box("前抱厦木柱上方的贯通横枋", side * 2.65, 3.13, -1.25, .2, .2, 3.5, wood), box("神龛两侧实心龛壁", side * 1.05, 1.95, 4.6, .16, 1.7, 1.4, red));
  }
  p.push(box("后殿神龛实际承托供台的底座", 0, .95, 4.6, 2.4, .7, 1.5, brick), box("供奉神龛的顶罩", 0, 2.85, 4.6, 2.45, .15, 1.5, wood), box("神龛前供案实接砖座", 0, 1.38, 3.5, 2.4, .4, .7, wood), box("庙门上方附墙木匾", 0, 3.55, .61, 2.8, .45, .1, wood), stairFlight("前埕通到抱厦砖台的三阶宽踏道", 3, 3.5, .4, .35, 0, [0, .2, -6.05], -90));
  for (const x of [-4.4, 4.4]) p.push(box("前埕两侧低砖栏墙", x, 1, -2, .3, .8, 5, brick));
  return p;
}

function streetBellTower(): ModelPart[] {
  const p: ModelPart[] = [base(18, 26, .2)];
  for (const x of [-3, 3]) for (const z of [-3, 3]) p.push(box("四向十字街口之间的实心砖座承重角墩", x, 2.9, z, 2.6, 5.4, 2.6, brick));
  p.push(box("四角墩顶接承上层钟楼的连续砖盖", 0, 5.8, 0, 8.6, .4, 8.6, brick), box("钟层周回木楼板", 0, 6.1, 0, 9.4, .2, 9.4, wood), tiledRoof("钟层下重檐出挑瓦檐", 11, 10, 9.9, [0, 0], tiles), tiledRoof("上部三层收分阁盖", 7, 6, 12.1, [0, 0], tiles), box("上重檐封闭阁顶围护", 0, 11.1, 0, 5.8, 2, 4.8, red));
  for (const x of [-3.6, 3.6]) for (const z of [-3.6, 3.6]) p.push(cylinder("砖座上连续承托钟层屋架的完整木柱", x, 8.05, z, .28, 3.9, red));
  for (const z of [-3.6, 3.6]) p.push(box("四柱相连的承屋额枋", 0, 9.9, z, 7.5, .3, .32, wood));
  for (const x of [-3.6, 3.6]) p.push(box("悬钟大梁两端接回前后木柱的纵向承力枋", x, 9.5, 0, .32, .4, 7.5, wood));
  p.push(box("真正承托悬钟的跨柱大梁", 0, 9.5, 0, 7.5, .4, .5, wood), cylinder("悬梁下直接接入铜钟顶部的吊轴", 0, 9.02, 0, .13, .65, wood), part("有真实下口及内壁的报时铜钟", "lathe", gold, [0, 7, 0], [1, 1, 1], [0, 0, 0], { profile: [{x:1.2,y:0},{x:1.25,y:.12},{x:1.02,y:.3},{x:.83,y:1.6},{x:.36,y:1.85},{x:0,y:1.85},{x:0,y:1.68},{x:.27,y:1.68},{x:.67,y:1.45},{x:.86,y:.3},{x:1.03,y:.1},{x:1.03,y:0}] }), stairFlight("钟楼西侧直上钟层并接到回廊的石阶", 18, 1.4, 6, .45, 0, [-3.95, .2, -12.8], -90));
  for (const z of [-4.5, 4.5]) {
    const spans = z < 0 ? [[-3.2, 4.5]] : [[-4.5, 4.5]];
    for (const [a, b] of spans) p.push(box("钟层栏杆留出西前登阶入口的连续扶手", (a! + b!) / 2, 7.1, z, b! - a!, .1, .1, wood));
    for (const x of z < 0 ? [-3, -1.5, 0, 1.5, 3, 4.5] : [-4.5, -3, -1.5, 0, 1.5, 3, 4.5]) p.push(cylinder("钟层扶手落在周回木板的实承栏柱", x, 6.65, z, .08, 1, wood));
  }
  for (const x of [-4.5, 4.5]) p.push(box("钟层两侧扶手接承回廊栏柱", x, 7.1, 0, .1, .1, 9, wood));
  return p;
}
