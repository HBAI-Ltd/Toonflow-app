import { beam, part, ring, type ModelPart } from "../assetModelParts";
import { boxBatch } from "./everydayOutdoorSpaceBatchOne";
import { holesAt, openingWall, tiledRoof } from "./periodPublicSpaceBatchOne";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";

const stone = "#a9a48f", plaster = "#c8b797", wood = "#805d40", dark = "#4d514b", clay = "#b38a67", tile = "#5f7168";

export const chineseStreetWorkshopBatchOneDesigns: ArchitecturePrototype[] = [
  design("前敞炉后料间临街铁匠铺", "中式古代古装剧古城街道铁匠铺，敞开前作业间有真炉腔、接风箱的风嘴、砧台与淬水槽，后料间独立开门；前方Z负，可直接并排接街", forgeShop, "建筑", "中式"),
  design("侧院通长木料棚木匠铺", "中式古代古装剧古城街道木匠铺，通长露侧木料棚接偏置工具室，锯架与长工案面对开敞作业院，区别封闭机械工坊", carpenterShop, "建筑", "中式"),
  design("浸篾槽前编后晒竹器铺", "中式古代古装剧古城街道竹器铺，双低翼围住浸篾浅槽，前编台与后晾架分开，保留中央贯通干路；不含人物", bambooShop, "建筑", "中式"),
  design("前店侧轮后晒陶坯铺", "中式古代古装剧古城街道陶器铺，转角售坯台接侧置脚踏轮和泥料槽，后部独立高脚晒坯棚；不是龙窑或教学陶艺院换招牌", potteryShop, "建筑", "中式"),
  design("横檐矮座鞋楦皮作铺", "中式古代古装剧古城街道皮作鞋铺，低工作席与高裁皮案分开，开敞横檐下挂楦架接后储皮间；独立完整铺面可沿街排列", leatherShop, "建筑", "中式"),
];

function forgeShop(): ModelPart[] {
  const p: ModelPart[] = [box("石坪", 0, .075, 0, 8.4, .15, 10.2, stone), tiledRoof("整铺瓦盖", 8, 9.4, 3.6, [0, 0], tile), box("后墙", 0, 1.875, 4.6, 8, 3.45, .24, plaster), openingWall("后料间门墙", 8, 3.45, holesAt([1.8], 1.5, 2.7), [0, .15, 2.2], 0, plaster)];
  for (const side of [-1, 1]) p.push(box("侧墙", side * 3.9, 1.875, 0, .22, 3.45, 9.2, plaster), cylinder("前檐柱", side * 3.65, 1.875, -4.4, .23, 3.45, wood), box("檐枋", side * 3.65, 3.54, 0, .25, .22, 9.2, wood));
  p.push(box("炉底", -2.5, .55, -.1, 2, .8, 2, stone), box("炉后壁", -2.5, 1.4, .8, 2, .9, .2, clay), box("炉口过梁", -2.5, 1.75, -.9, 2, .2, .22, clay), box("烟道", -2.5, 3.15, .65, .65, 3.2, .65, clay));
  p.push(box("炉腔左壁", -3.4, 1.4, -.1, .2, .9, 2, clay), box("风口前砖", -1.6, 1.4, -.4, .2, .9, 1.4, clay), box("风口后砖", -1.6, 1.4, .75, .2, .9, .3, clay), box("风口下砖", -1.6, .98, .45, .2, .06, .3, clay), box("风口上砖", -1.6, 1.52, .45, .2, .66, .3, clay));
  p.push(part("炉中炭火", "box", "#9e5736", [-2.5, .98, -.1], [1.45, .06, 1.4], [0, 0, 0], { emissive: "#b95c28", emissiveIntensity: .35 }), box("木风箱", -.4, 1.1, .45, 1.5, .5, 1, wood), box("风箱支座", -.4, .53, .45, 1.2, .76, .75, wood), cylinder("实接风嘴", -1.35, 1.1, .45, .16, .8, dark, [0, 0, 90]), box("推拉柄", .55, 1.1, .45, .55, .1, .12, wood), cylinder("砧木座", 1.9, .61, -1.7, .8, .92, wood), box("铁砧身", 1.9, 1.2, -1.7, .5, .3, .4, dark), box("铁砧面", 1.9, 1.4, -1.7, 1.05, .13, .55, dark), box("淬水槽底", -2.3, .23, -3.2, 1.4, .16, .9, stone));
  for (const side of [-1, 1]) p.push(box("淬槽侧壁", -2.3 + side * .65, .53, -3.2, .1, .6, .9, stone), box("淬槽端壁", -2.3, .53, -3.2 + side * .4, 1.4, .6, .1, stone));
  p.push(part("槽内水", "box", "#7c9d97", [-2.3, .61, -3.2], [1.2, .025, .7], [0, 0, 0], { opacity: .8 }), box("后料架", -1.8, .8, 3.4, 3, 1.3, .7, wood));
  return p;
}

function carpenterShop(): ModelPart[] {
  const p: ModelPart[] = [box("作业院坪", 0, .075, 0, 9.5, .15, 11, stone), tiledRoof("长木料棚", 3, 10, 3.3, [-3, 0], tile), tiledRoof("后工具室", 5, 3.5, 3.4, [1.8, 3.4], tile), openingWall("工具室门", 5, 3.25, holesAt([0], 1.5, 2.6), [1.8, .15, 1.7], 0, plaster), box("工具室后墙", 1.8, 1.775, 5.1, 5, 3.25, .22, plaster)];
  for (const side of [-1, 1]) p.push(box("工具室侧墙", 1.8 + side * 2.5, 1.775, 3.4, .22, 3.25, 3.4, plaster));
  for (const z of [-4.6, 0, 4.6]) for (const x of [-4.2, -1.8]) p.push(cylinder("料棚木柱", x, 1.725, z, .2, 3.15, wood));
  for (const x of [-4.2, -1.8]) p.push(box("料棚檐枋", x, 3.26, 0, .23, .2, 9.5, wood));
  for (const y of [.6, 1.35, 2.1]) { p.push(box("料架横托", -3, y, 0, 2.6, .12, 9.3, wood)); for (const x of [-3.7, -3.1, -2.5]) p.push(box("通长木料", x, y + .16, .2, .22, .2, 7.8, wood)); }
  p.push(box("长工案面", 1.7, 1.08, -.4, 1.4, .16, 4.1, wood));
  for (const x of [1.15, 2.25]) for (const z of [-2, 1.2]) p.push(box("工案腿", x, .6, z, .16, .9, .18, wood));
  for (const z of [-4, -2.8]) { p.push(box("锯架顶梁", -.1, 1.18, z, 1.8, .16, .24, wood)); for (const side of [-1, 1]) p.push(beam("锯架斜脚", wood, [side * .75 - .1, .15, z], [side * .35 - .1, 1.16, z], .14)); }
  return p;
}

function bambooShop(): ModelPart[] {
  const p: ModelPart[] = [box("竹铺石坪", 0, .075, 0, 8.6, .15, 10, stone), tiledRoof("左编制翼", 2.7, 7.2, 2.8, [-2.7, -.5], tile), tiledRoof("右备料翼", 2.5, 5, 2.5, [2.8, 1.9], tile), box("左翼实背墙", -4, 1.475, -.5, .2, 2.65, 7.2, plaster), box("右翼后墙", 2.8, 1.325, 4.3, 2.5, 2.35, .2, plaster)];
  for (const z of [-3.6, 2.6]) for (const x of [-3.8, -1.6]) p.push(cylinder("编制翼柱", x, 1.475, z, .16, 2.65, wood));
  for (const z of [-.3, 4.1]) for (const x of [1.8, 3.8]) p.push(cylinder("备料翼柱", x, 1.325, z, .16, 2.35, wood));
  p.push(box("编器长台", -2.7, .88, -1.4, 1.7, .14, 2.8, wood));
  for (const x of [-3.3, -2.1]) for (const z of [-2.4, -.4]) p.push(box("编台腿", x, .5, z, .13, .7, .14, wood));
  p.push(box("浸篾槽底", 2.5, .23, -2.55, 2, .16, 2.9, stone));
  for (const side of [-1, 1]) p.push(box("槽长壁", 2.5 + side * .94, .53, -2.55, .12, .6, 2.9, stone), box("槽端壁", 2.5, .53, -2.55 + side * 1.39, 2, .6, .12, stone));
  p.push(part("槽中水面", "box", "#8d9e85", [2.5, .58, -2.55], [1.75, .03, 2.6], [0, 0, 0], { opacity: .8 }));
  for (const x of [-1.4, 1.4]) p.push(cylinder("后晒架立杆", x, 1.15, 4.2, .12, 2, wood));
  p.push(box("后晒架横杆", 0, 2.08, 4.2, 3, .12, .13, wood));
  for (const x of [-1, -.5, 0, .5, 1]) p.push(beam("晾晒竹篾", "#aaab72", [x, .35, 4], [x, 2.06, 4.2], .045));
  for (const z of [-2, -.8]) p.push(ring("编制中篮圈", wood, .4, .045, 1.14, .4, { position: { x: -2.7, y: 1.14, z } }));
  return p;
}

function potteryShop(): ModelPart[] {
  const p: ModelPart[] = [box("陶坯铺台基", 0, .075, 0, 8.8, .15, 10.2, stone), tiledRoof("前售坯檐", 8, 3, 3, [0, -3.2], tile), tiledRoof("后晒坯棚", 7.5, 3.6, 3.4, [0, 3], tile), box("后棚实背", 0, 1.775, 4.7, 7.5, 3.25, .2, plaster)];
  for (const x of [-3.5, 3.5]) { for (const z of [-4.1, -2.2]) p.push(cylinder("售坯檐柱", x, 1.575, z, .2, 2.85, wood)); for (const z of [1.4, 4.5]) p.push(cylinder("晾坯棚柱", x, 1.775, z, .2, 3.25, wood)); }
  p.push(box("前沿售坯低柜", -1.6, .72, -3.3, 3.6, 1.14, .75, wood), box("转角陈列柜", -3, .72, -1.7, .8, 1.14, 2.5, wood), cylinder("拉坯轮轴座", 2.15, .37, -.6, .6, .44, stone), cylinder("脚踏大转轮", 2.15, .58, -.6, 1.4, .12, wood), cylinder("贯通拉坯轮轴", 2.15, .88, -.6, .15, .8, dark), cylinder("上置拉坯台", 2.15, 1.25, -.6, .75, .14, wood), box("泥料槽底", -.8, .24, .3, 1.8, .18, 1.3, stone));
  for (const side of [-1, 1]) p.push(box("泥料槽长壁", -.8 + side * .85, .46, .3, .1, .45, 1.3, stone), box("泥料槽端壁", -.8, .46, .3 + side * .6, 1.8, .45, .1, stone));
  for (const x of [-2.8, 2.8]) p.push(box("晒坯架立脚", x, 1.35, 3.8, .14, 2.4, .8, wood));
  for (const y of [.7, 1.5, 2.3]) { p.push(box("晒坯长板", 0, y, 3.8, 6, .1, 1, wood)); for (const x of [-2, 0, 2]) p.push(part("晾放空心陶坯", "lathe", clay, [x, y + .05, 3.8], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .25, y: 0 }, { x: .32, y: .25 }, { x: .24, y: .5 }, { x: .16, y: .62 }, { x: .12, y: .62 }, { x: .17, y: .48 }, { x: .24, y: .24 }, { x: .18, y: .07 }, { x: 0, y: .07 }] })); }
  return p;
}

function leatherShop(): ModelPart[] {
  const p: ModelPart[] = [box("皮作铺地坪", 0, .075, 0, 6.8, .15, 8.3, stone), tiledRoof("储皮间瓦盖", 6, 3.7, 3.5, [0, 2], tile), openingWall("储皮间前门", 6, 3.35, holesAt([1.5], 1.2, 2.5), [0, .15, .2], 0, plaster), box("后墙", 0, 1.825, 3.8, 6, 3.35, .2, plaster), tiledRoof("前作业横檐", 6, 3.4, 2.7, [0, -2], tile)];
  for (const side of [-1, 1]) p.push(box("储皮侧墙", side * 3, 1.825, 2, .2, 3.35, 3.6, plaster), cylinder("横檐柱", side * 2.7, 1.425, -3.5, .18, 2.55, wood));
  p.push(box("高裁皮案", -1.65, 1.05, -1.2, 1.5, .14, 2.5, wood));
  for (const x of [-2.2, -1.1]) for (const z of [-2.1, -.3]) p.push(box("案腿", x, .6, z, .12, .9, .13, wood));
  p.push(cylinder("矮工作席", .5, .42, -2.5, .6, .54, wood), box("工作席前的小楦台", .5, .56, -1.5, .75, .82, .55, wood), box("后间储皮柜", -1.6, 1.1, 2.3, 1.7, 1.9, .6, wood));
  for (const x of [.7, 2.2]) p.push(box("挂楦架立柱", x, 1.2, -3.2, .1, 2.1, .12, wood));
  p.push(box("挂楦架横梁", 1.45, 2.2, -3.2, 1.65, .12, .14, wood));
  const pegs: [number, number, number][] = [];
  for (const x of [.9, 1.45, 2]) { pegs.push([x, 2.02, -3.2]); p.push(part("悬挂鞋楦", "capsule", wood, [x, 1.73, -3.2], [.25, .45, .55])); }
  p.push(...boxBatch("挂楦短钩", dark, pegs, [.045, .38, .05]));
  return p;
}
