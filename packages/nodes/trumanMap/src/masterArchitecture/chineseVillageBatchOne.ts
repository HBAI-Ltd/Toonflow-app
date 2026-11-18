import { beam, part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { boxBatch, profileBody } from "./everydayOutdoorSpaceBatchOne";
import { arch, box, cylinder, design, type ArchitecturePrototype } from "./structures";

const earth = "#ad9673", plaster = "#c5b28d", wood = "#72563c", straw = "#ab965d", strawLight = "#c4ac70", stone = "#99988b";

function grassRoof(name: string, width: number, depth: number, y: number, x: number, z: number): ModelPart[] {
  const half = depth / 2 + .55, rise = Math.min(1.5, depth * .34);
  const outline: [number, number][] = [[-half, 0], [0, rise], [half, 0], [half - .08, -.24], [0, rise - .28], [-half + .08, -.24]];
  const parts = [profileBody(name, straw, outline, width + .9, [x, y, z], 90), box(`${name}实压屋脊的草束`, x, y + rise + .035, z, width + .8, .18, .25, strawLight)];
  for (const side of [-1, 1]) {
    parts.push(beam(`${name}草面横向压杆`, wood, [x - width / 2 - .35, y + rise * .38, z + side * half * .62], [x + width / 2 + .35, y + rise * .38, z + side * half * .62], .055));
    const ends: Triple[] = [];
    for (let index = 0; index < 16; index++) ends.push([x - width / 2 - .35 + index * (width + .7) / 15, y - .045, z + side * (half - .04)]);
    parts.push(...boxBatch(`${name}檐口独立草束纹理`, strawLight, ends, [.065, .18, .17]));
  }
  return parts;
}

function room(name: string, x: number, z: number, width: number, depth: number, floor: number, height: number): ModelPart[] {
  const front = z - depth / 2, door = 1.35;
  const parts: ModelPart[] = [box(`${name}连续地台`, x, floor / 2, z, width + .3, floor, depth + .3, stone), box(`${name}后墙`, x, floor + height / 2, z + depth / 2, width, height, .24, plaster)];
  for (const side of [-1, 1]) {
    parts.push(box(`${name}侧山墙`, x + side * width / 2, floor + height / 2, z, .24, height, depth, plaster), box(`${name}门洞两侧实墙`, x + side * (width + door) / 4, floor + height / 2, front, (width - door) / 2, height, .24, plaster));
    parts.push(box(`${name}实际落地门框`, x + side * .7, floor + 1.05, front - .06, .12, 2.1, .3, wood));
  }
  parts.push(box(`${name}门洞上方过梁`, x, floor + (height + 2.05) / 2, front, 1.5, height - 2.05, .3, wood));
  return parts;
}

export const chineseVillageBatchOneDesigns: ArchitecturePrototype[] = [
  design("曲尺灶房茅顶农家晒院", "古装剧乡村民居，正屋与独立灶房成曲尺形围住晒院，灶台、烟道、木柴棚和真实入户门洞形成完整生活空间；不同于单间草庐或通长覆草农舍", farmCourt, "建筑", "中式"),
  design("下沉天井三孔靠崖窑洞院", "古装剧黄土乡居，三孔真正可进入的拱券窑室背靠厚土体，前方下沉天井由独立踏道登上地面；以院底为放置基准，可配合地形埋置后侧土体", caveCourt, "建筑", "中式"),
  design("长阶石埠竹棚候渡亭", "古装剧水乡渡口，岸上竹构候渡棚连通逐级下水石埠，棚内长凳与岸边系缆桩组成完整候船场所；以最低石阶为放置基准，需自行对齐河岸水位", riverLanding, "建筑", "中式"),
  design("环道畜力双盘石磨作坊", "古装剧乡间磨粮场，中央上下水平磨盘、入粮漏斗与外圈集粉槽由长驱杆带动，完整牲畜环道避开偏置粮间和棚柱；不含牲畜，与蔗辊压榨场及滚子石碾构造不同", grainMill, "建筑", "中式"),
];

function farmCourt(): ModelPart[] {
  const parts: ModelPart[] = [box("完整晒院夯土地坪", 0, .09, 0, 17, .18, 16, earth), ...room("农家正屋", -2.3, 4.2, 9.2, 4.8, .35, 2.8), ...grassRoof("正屋分层厚茅顶", 9.4, 5, 3.18, -2.3, 4.2), ...room("独立侧灶房", 5.3, -.1, 4.4, 6, .3, 2.6), ...grassRoof("灶房独立厚茅顶", 4.6, 6.2, 2.93, 5.3, -.1)];
  for (const x of [-6.7, -2.3, 2.1]) parts.push(cylinder("正屋前廊实落石台的檐柱", x, 1.68, 1.15, .18, 2.66, wood));
  parts.push(box("正屋门前接晒院的踏步", -2.3, .17, 1.2, 2.1, .34, 1.3, stone), box("厨房泥砌灶台", 5.5, .85, 1.4, 2.1, 1.1, 1.25, earth), cylinder("灶上铁锅", 5.5, 1.47, 1.4, 1.05, .18, "#444e48"), box("灶后接到烟囱的封闭烟道", 6.2, 1.65, 1.7, .38, 2.1, .5, earth), box("实接烟道并穿出屋顶的独立烟囱", 6.2, 3.8, 1.7, .46, 2.25, .55, earth));
  for (const side of [-1, 1]) {
    parts.push(box("院口留出入户路线的低土墙", side * 5.3, .65, -7.1, 5.8, 1.1, .3, earth), box("晒院两侧实际接地围墙", side * 8, .65, -.4, .3, 1.1, 13.7, earth));
  }
  parts.push(box("柴棚木架地台", -5.8, .28, -4.7, 3.2, .2, 2.5, wood));
  for (const x of [-7.25, -4.35]) for (const z of [-5.8, -3.6]) parts.push(cylinder("柴棚真实落台立柱", x, 1.25, z, .13, 1.95, wood));
  parts.push(...grassRoof("院内低矮柴棚顶", 3.2, 2.5, 2.28, -5.8, -4.7));
  for (const x of [-6.7, -6.1, -5.5, -4.9]) parts.push(cylinder("实际堆在柴棚台上的木柴", x, .5, -4.7, .22, 1.9, wood, [90, 0, 0]));
  return parts;
}

function caveCourt(): ModelPart[] {
  const parts: ModelPart[] = [box("窑院与洞室完整落地基础", 0, .1, 0, 13.5, .2, 15.6, earth), box("三孔窑洞后方封闭实土背墙", 0, 2.3, 5.3, 12, 4.2, .8, earth), box("拱券上方接到土体顶面的完整覆土", 0, 3.8, 3, 12, .8, 4.7, earth)];
  for (const x of [-3.6, 0, 3.6]) {
    const vault = arch(x, 3, 1.2, 1.8, 4.6, .35);
    vault.color = earth;
    parts.push(vault, box("窑室内低于门槛的真实地坪", x, .19, 3, 2.4, .08, 4.6, stone), box("窑门拱下接室内的木门楣", x, 2.18, .65, 2.4, .13, .2, wood));
    for (const side of [-1, 1]) parts.push(box("窑室前脸留下中央通行口的木门侧框", x + side * 1.12, 1.2, .65, .12, 2, .22, wood));
  }
  for (const x of [-5.65, -1.8, 1.8, 5.65]) parts.push(box("实际承托覆土并接住相邻拱脚的实土隔墩", x, 2.2, 3, Math.abs(x) > 5 ? 1.1 : .55, 4, 4.6, earth));
  for (const side of [-1, 1]) parts.push(box("天井两侧保留开放天空的挡土墙", side * 6.2, 1.9, -2.2, .7, 3.4, 9.8, earth));
  parts.push(box("登院踏道旁真实土台", 3.5, 1.9, -6.7, 5.8, 3.4, 1.2, earth));
  for (let index = 0; index < 12; index++) parts.push(box("院底通向地面的完整逐级登院石阶", -3, .2 + (index + 1) * .14, -2.7 - index * .36, 1.9, (index + 1) * .28, .38, stone));
  parts.push(box("最高踏步实接的院外入口平台", -3, 1.88, -7.15, 2.1, 3.36, 1.3, earth));
  return parts;
}

function riverLanding(): ModelPart[] {
  const parts: ModelPart[] = [box("岸上候渡棚完整高台", 0, 1.1, 1.6, 8.5, 2.2, 6.5, stone), box("棚前贯通石埠的岸边小平台", 0, 1.1, -2.1, 5, 2.2, 1.2, stone)];
  for (let index = 0; index < 10; index++) parts.push(box("向水面逐级下降且互相实接的宽石埠踏步", 0, (index + 1) * .11, -7.2 + index * .45, 3.2, (index + 1) * .22, .47, stone));
  parts.push(box("最高石阶真正接入岸上平台的过渡踏台", 0, 1.1, -2.8, 3.2, 2.2, .6, stone));
  for (const x of [-3.2, 3.2]) for (const z of [-.6, 3.8]) {
    parts.push(cylinder("候渡棚实际插入石台的竹柱", x, 3.65, z, .2, 2.94, wood), beam("竹棚柱头到檐梁的真实斜撑", wood, [x, 4.45, z], [x * .65, 5.03, z], .1));
  }
  parts.push(box("竹棚前后柱共承的横檐梁", 0, 5.03, -.6, 6.6, .2, .2, wood), box("竹棚后部横檐梁", 0, 5.03, 3.8, 6.6, .2, .2, wood), ...grassRoof("竹棚分层苇草盖", 7.2, 5.2, 5.14, 0, 1.6));
  for (const x of [-2.9, 2.9]) {
    parts.push(box("候渡长凳厚坐板", x, 2.72, 1.6, .48, .13, 3.9, wood));
    for (const z of [0, 3.2]) parts.push(box("长凳实际落在石台的支腿", x, 2.45, z, .3, .5, .25, wood));
    parts.push(cylinder("河岸系缆立桩", x, 2.65, -1.2, .25, .9, wood));
  }
  for (const side of [-1, 1]) {
    parts.push(beam("石埠两侧不占通路的木扶栏", wood, [side * 1.6, .95, -7.3], [side * 1.6, 2.95, -2.7], .09));
    for (const z of [-6.8, -4.8, -2.8]) { const top = .97 + (z + 7.3) * 2 / 4.6; parts.push(box("扶栏立柱实际插入逐级石埠并接到斜栏", side * 1.6, top / 2, z, .11, top, .11, wood)); }
  }
  return parts;
}

function grainMill(): ModelPart[] {
  const parts: ModelPart[] = [box("完整磨坊夯土基础", 0, .1, 0, 14, .2, 13, earth), cylinder("牲畜绕行磨坊的完整圆形石坪", -1.2, .23, -.3, 9.3, .06, stone), cylinder("下磨盘落地承重石座", -1.2, .65, -.3, 1.9, .85, stone), cylinder("下层固定石磨盘", -1.2, 1.12, -.3, 2.1, .18, stone)];
  parts.push(part("中间有真实入粮孔的上层旋转磨盘", "lathe", "#aaa68f", [-1.2, 1.355, -.3], [1, 1, 1], [0, 0, 0], { profile: [{ x: .17, y: -.15 }, { x: 1.03, y: -.15 }, { x: 1.03, y: .15 }, { x: .17, y: .15 }, { x: .17, y: -.15 }] }), cylinder("接入承重石座和磨盘中央的传动轴", -1.2, 1.45, -.3, .16, 1.2, wood), box("把竖轴实际楔接到上磨盘的横向驱动键", -1.2, 1.4, -.3, .4, .15, .14, wood), cylinder("从中心石座承托外圈集粉槽的连续底盘", -1.2, .98, -.3, 2.7, .12, stone), ring("磨盘外圈真实敞口集粉槽", wood, 1.24, .12, 1.08, .22, { position: { x: -1.2, y: 1.08, z: -.3 } }), beam("从磨盘中心连续伸至牲畜环道的长驱杆", wood, [-1.2, 1.85, -.3], [-4.7, 1.2, -.3], .15), box("与驱杆末端相连的套畜横轭", -4.7, 1.2, -.3, .15, .15, 1.1, wood));
  for (const x of [-5.8, 3.4]) for (const z of [-4.8, 4.2]) parts.push(cylinder("避开牲畜环道且实际落地的磨棚柱", x, 2.15, z, .2, 3.9, wood));
  parts.push(box("磨棚前后柱实承的横梁", -1.2, 4.05, -4.8, 9.4, .2, .25, wood), box("磨棚后部横梁", -1.2, 4.05, 4.2, 9.4, .2, .25, wood), ...grassRoof("环磨坊完整草棚屋盖", 10.2, 10, 4.15, -1.2, -.3));
  parts.push(...room("偏置粮间", 5.2, 2.1, 3, 4.5, .3, 2.5), ...grassRoof("粮间独立草顶", 3.2, 4.7, 2.83, 5.2, 2.1));
  for (const z of [1.2, 2.2, 3.2]) parts.push(box("粮间墙边实际落地储粮木箱", 5.8, .65, z, .8, .7, .8, wood));
  return parts;
}
