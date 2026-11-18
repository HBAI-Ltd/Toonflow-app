import { beam, type ModelPart } from "../assetModelParts";
import { hardPlan } from "./everydayOutdoorSpaceBatchOne";
import { stairFlight } from "./historicSpaceBatchSeven";
import { holesAt, openingWall, tiledRoof } from "./periodPublicSpaceBatchOne";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";

const stone = "#b7b5a0", plaster = "#d4cbb2", wood = "#79513d", tile = "#62766b", red = "#a15442";

export const chineseGardenBatchOneDesigns: ArchitecturePrototype[] = [
  design("扇面花墙靠背半亭", "中式古代古装剧园林：半圆落地台贴实背花墙，放射扇形屋盖由弧前柱和背墙承接，前侧开放留出登亭入口；不是独立多角亭换边数", fanPavilion, "建筑", "中式"),
  design("花墙横穿门双面复廊", "中式古代古装剧园林：共同瓦顶下两条并行雨廊被透窗中墙分开，居中横穿门真实接通两侧，廊端均可出入；不是单廊增加长度", dividedGallery, "建筑", "中式"),
  design("上下场门后箱传统戏楼", "中式古代古装剧演出布景：开放前戏台、独立后台更衣分室与上下场门相接，侧梯登上完整高台；不同于提线木偶操偶桥", theatreHall, "建筑", "中式"),
  design("十字抱廊四面花厅", "中式古代古装剧园林：中厅四面真实门窗接四条低抱廊，外檐柱和石台承托分层灰瓦屋盖，可四向穿行观景；不是单间水榭换色", gardenHall, "建筑", "中式"),
  design("双跑内梯周廊赏景楼", "中式古代古装剧园楼：两层有真实门窗的空心楼身，双跑内梯和中间歇台穿过专留梯井，上层周廊围栏让开门口，不以楼层数或开窗状态派生计数", viewingTower, "建筑", "中式"),
];

function post(name: string, x: number, z: number, floor: number, top: number): ModelPart[] {
  return [cylinder(`${name}石柱础`, x, floor + .09, z, .46, .18, stone), cylinder(`${name}承重木柱`, x, (floor + .12 + top) / 2, z, .25, top - floor - .12, red)];
}

function fanPavilion(): ModelPart[] {
  const arc = Array.from({ length: 13 }, (_, i): [number, number] => [Math.cos(i * Math.PI / 12) * 4.5, Math.sin(i * Math.PI / 12) * 4.5]);
  const p: ModelPart[] = [hardPlan("贴花墙的完整半圆石台", stone, arc, .45), openingWall("半亭背后保留两扇透景窗的花墙", 9, 3.55, holesAt([-2.8, 2.8], 1.5, 1.5, 1.1), [0, .45, 0], 0, plaster)];
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 6, b = (i + 1) * Math.PI / 6;
    const roof = hardPlan("半亭放射闭合的扇面瓦坡", tile, [[0, 0], [Math.cos(a) * 5, Math.sin(a) * 5], [Math.cos(b) * 5, Math.sin(b) * 5]], .18);
    for (const vertex of roof.vertices!) vertex.y += 3.85 + 1.2 * (1 - Math.hypot(vertex.x, vertex.z) / 5);
    p.push(roof);
  }
  for (const angle of [0, Math.PI / 4, 3 * Math.PI / 4, Math.PI]) {
    const x = Math.cos(angle) * 4.1, z = Math.sin(angle) * 4.1;
    p.push(...post("半亭前弧柱", x, z, .45, 4.1), beam("从前弧柱接到背墙顶的斜托梁", wood, [x, 4.05, z], [x * .45, 4.55, z * .45], .16));
  }
  p.push(box("弧面石台前沿实接全宽短阶的平直登亭小台", 0, .225, 4.45, 2.4, .45, .6, stone), stairFlight("前弧中央实际接上亭台的短石阶", 3, 2.4, .45, .3, 0, [0, 0, 5.65], 90), box("半亭背墙实际承接扇顶中央的短梁", 0, 4.5, 0, .28, 1.15, .32, wood));
  return p;
}

function dividedGallery(): ModelPart[] {
  const p: ModelPart[] = [box("双廊共同落地石坪", 0, .2, 0, 6.5, .4, 24), openingWall("双廊之间真正开窗与横穿门的中墙", 24, 3.5, [...holesAt([0], 2.2, 3.1), ...holesAt([-8, -4, 4, 8], 2.1, 1.35, 1.15)], [0, .4, 0], 90, plaster), tiledRoof("两条行廊共用的完整灰瓦顶", 6.4, 24, 3.9, [0, 0], tile)];
  for (const side of [-1, 1]) {
    for (const z of [-11.4, -5.7, 0, 5.7, 11.4]) p.push(...post("复廊外檐柱", side * 2.9, z, .4, 3.9));
    p.push(box("复廊外柱顶连续额枋", side * 2.9, 3.84, 0, .28, .24, 23.4, wood));
    for (const z of [-8.5, 8.5]) p.push(box("不堵中间横穿门的廊边坐板", side * 2.85, .92, z, .38, .12, 4.8, wood), ...[-1, 1].map(end => box("坐板下实际接地的独立短脚", side * 2.85, .63, z + end * 1.8, .23, .46, .24, wood)));
  }
  return p;
}

function theatreHall(): ModelPart[] {
  const p: ModelPart[] = [box("戏台及后箱共用落地台基", 0, .6, 2.5, 13, 1.2, 18), box("主台完整木面", 0, 1.26, -2, 12.5, .12, 9), openingWall("戏台后壁真正分出的上下场门", 12, 4.6, holesAt([-4.3, 4.3], 1.6, 2.8), [0, 1.2, 2.5], 0, red), tiledRoof("前戏台朱柱共承的大灰瓦盖", 14, 10, 6, [0, -2], tile), tiledRoof("后台更衣房独立低屋盖", 12, 8.6, 4.6, [0, 7], tile), openingWall("后台两间更衣房面向过道的真实木门", 12, 3.4, holesAt([-3, 3], 1.4, 2.65), [0, 1.2, 4.1], 0, plaster), box("后台更衣房独立中隔墙", 0, 2.9, 7.8, .25, 3.4, 7.4, plaster), box("后台完整后墙", 0, 2.9, 11.4, 12, 3.4, .25, plaster)];
  for (const side of [-1, 1]) {
    for (const z of [-6, -.5]) p.push(...post("主台前檐朱柱", side * 5.7, z, 1.2, 6));
    p.push(box("主台侧柱顶额枋", side * 5.7, 5.94, -2.75, .3, .25, 6.9, wood), openingWall("后台带真实上台侧门和窗洞的独立山墙", 8.9, 3.4, [...holesAt([0], 1.7, 1.5, 1.1), ...holesAt([3.65], 1.1, 2.65)], [side * 6, 1.2, 6.95], 90, plaster), stairFlight("后箱外侧实接台基的登台石阶", 6, 1, 1.2, .33, 0, [side * 8.48, 0, 3.3], side > 0 ? 180 : 0));
  }
  p.push(box("前戏台上方实际跨两前柱的横枋", 0, 5.94, -6, 11.8, .25, .3, wood), box("前檐木匾", 0, 5.5, -6.17, 3.6, .6, .14, wood));
  return p;
}

function gardenHall(): ModelPart[] {
  const p: ModelPart[] = [box("中厅四抱廊完整落地石台", 0, .25, 0, 14, .5, 14), tiledRoof("四面花厅中核高灰瓦盖", 10, 10, 4.5, [0, 0], tile)];
  for (const side of [-1, 1]) {
    const holes = [...holesAt([0], 2.5, 3), ...holesAt([-2.8, 2.8], 1.35, 1.4, 1.2)];
    p.push(openingWall("四面花厅对穿的真实门窗围护", 8, 4, holes, [0, .5, side * 4], 0, plaster), openingWall("另两向抱廊真实门窗围护", 8, 4, holes, [side * 4, .5, 0], 90, plaster));
    p.push(tiledRoof("南北抱廊独立低屋盖", 8, 3.5, 3.9, [0, side * 5], tile), tiledRoof("东西抱廊独立低屋盖", 3.5, 8, 3.9, [side * 5, 0], tile));
    for (const offset of [-3.5, 3.5]) p.push(...post("四向抱廊外檐柱", offset, side * 6.3, .5, 3.9), ...post("四向侧抱廊外檐柱", side * 6.3, offset, .5, 3.9));
    p.push(box("南北抱廊外檐额枋", 0, 3.85, side * 6.3, 7.4, .24, .28, wood), box("东西抱廊外檐额枋", side * 6.3, 3.85, 0, .28, .24, 7.4, wood));
  }
  return p;
}

function viewingTower(): ModelPart[] {
  const p: ModelPart[] = [box("赏景楼完整落地石台", 0, .2, 0, 14, .4, 14), hardPlan("上层楼板真实避开双跑内梯井", wood, [[-6,-6],[6,-6],[6,6],[-6,6]], .24, [0, 3.76, 0], [[[-1.7,-3.6],[1.7,-3.6],[1.7,2.1],[-1.7,2.1]]]), tiledRoof("独立赏景楼完整灰瓦屋盖", 14, 14, 7.5, [0, 0], tile), stairFlight("从下层接到中间歇台的第一跑木阶", 10, 1.4, 1.8, .45, 0, [-.85, .4, -3.6], -90), box("双跑内梯共同实承的中间歇台", 0, 1.3, 1.5, 3.4, 1.8, 1.2, wood), stairFlight("从中间歇台反向接上高层地板的第二跑木阶", 10, 1.4, 1.8, .45, 0, [.85, 2.2, .9], 90)];
  for (const side of [-1, 1]) {
    for (const level of [0, 1]) {
      const floor = .4 + level * 3.6, h = level ? 3.5 : 3.6;
      const holes = [...holesAt([0], 2.1, 2.75), ...holesAt([-3.2, 3.2], 1.5, 1.5, 1.05)];
      p.push(openingWall("观景楼前后上下层真正开门窗的墙身", 10, h, holes, [0, floor, side * 5], 0, plaster), openingWall("观景楼侧面上下层真正开门窗的墙身", 10, h, holes, [side * 5, floor, 0], 90, plaster));
    }
    for (const z of [-5.8, 5.8]) p.push(...post("下层外柱实际承接周回楼板与屋檐", side * 5.8, z, .4, 7.5));
    p.push(box("周廊外侧连续木扶手", 0, 5.05, side * 5.8, 11.7, .1, .1, wood));
    p.push(box("周廊两端实接护栏的木扶手", side * 5.8, 5.05, 0, .1, .1, 11.7, wood));
    for (const offset of [-4, -2, 0, 2, 4]) p.push(cylinder("周廊前后护栏实接楼面的立柱", offset, 4.52, side * 5.8, .08, 1.1, wood), cylinder("周廊侧护栏实接楼面的立柱", side * 5.8, 4.52, offset, .08, 1.1, wood));
  }
  p.push(box("第一跑外侧接入歇台的承梯梁", -.85, 1.3, 1.0, 1.6, 1.8, .2, wood));
  return p;
}
