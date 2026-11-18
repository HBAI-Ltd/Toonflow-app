import { part, ring, pitchedRoof, type ModelPart } from "../assetModelParts";
import { box, cylinder, design, rail, colors } from "./structures";
import { polygon } from "../masterNature/shared";
import { doorway, arcDeck } from "./publicSpaceBatchOne";
import { paint } from "./publicSpaceBatchFive";

const paving = "#b5b19c", wood = "#a78d68", dark = "#54676b", white = "#dadccb";

// https://img.mlbstatic.com/mlb-images/image/upload/mlb/ub08blsefk8wkkd2oemz.pdf
// https://www.lords.org/mcc/about-the-laws-of-cricket
// https://www.sumo.or.jp/pdf/en/sumo_introduction.pdf
// https://www.kyudo.jp/pdf/schedule/taikai/20180930-1003_guidance.pdf
export const publicSpaceBatchSixDesigns = [
  design("钻石内场扇形棒球比赛场", "钻石形跑垒通道接入两条向外延伸的犯规线，抬高的投手丘与本垒相对，完整扇形外场由弧形远墙围合，两侧看台沿界外展开", baseballField, "建筑", "现代"),
  design("椭圆内场板球比赛场", "完整椭圆比赛内场中设置二十点一二米投球区和两端三柱门，椭圆边界线与周围观众区分开，场外独立亭廊朝向赛场", cricketGround, "建筑", "欧式"),
  design("悬吊屋形顶相扑比赛馆", "中央高土台内嵌俵包界圈，上方神社式屋形顶由顶梁悬索承托，四角房穗悬垂，四周观众阶台留出前后通行口", sumoArena, "建筑", "日式"),
  design("射位厅安土靶房弓道场", "完整射亭面对二十八米远的安土靶房，射道两侧独立步廊接通前后建筑，低位三十六厘米圆靶置于倾斜土背之前", kyudoRange, "建筑", "日式"),
];

function baseballField(): ModelPart[] {
  const homeZ = -61, radius = 122, distance = 27.432 / Math.sqrt(2);
  const field: [number, number][] = [[0, homeZ]], base: [number, number][] = [[-26, -82], [26, -82]];
  for (let i = 0; i <= 24; i++) { const a = Math.PI / 4 + i * Math.PI / 48; field.push([Math.cos(a) * radius, homeZ + Math.sin(a) * radius]); base.push([Math.cos(a) * 132, homeZ + Math.sin(a) * 132]); }
  const p: ModelPart[] = [polygon("完整扇形棒球场及界外看台共同场坪", paving, base, .2), polygon("两犯规线之间完整扇形外场", "#819e79", field, .04, [0, .2, 0]), polygon("钻石形跑垒土道", "#b59c78", [[0, homeZ - 2.5], [distance + 2.5, homeZ + distance], [0, homeZ + 2 * distance + 2.5], [-distance - 2.5, homeZ + distance]], .025, [0, .24, 0], [[[0, homeZ + 4], [distance - 4, homeZ + distance], [0, homeZ + 2 * distance - 4], [-distance + 4, homeZ + distance]]]), part("本垒前方抬高的完整投手丘", "lathe", "#b59c78", [0, .24, homeZ + 18.44], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 2.743, y: 0 }, { x: 2.4, y: .08 }, { x: 1.2, y: .254 }, { x: 0, y: .254 }] }), box("投手丘顶端的白色投手板", 0, .504, homeZ + 18.44, .61, .02, .152, white), polygon("五边形独立本垒板", white, [[0, -.216], [.216, 0], [.216, .216], [-.216, .216], [-.216, 0]], .025, [0, .265, homeZ])];
  for (const [x, z] of [[distance, homeZ + distance], [0, homeZ + 2 * distance], [-distance, homeZ + distance]]) { const bag = box("钻石三个独立抬高垒包", x!, .295, z!, .381, .06, .381, white); bag.rotation.y = 45; p.push(bag); }
  for (const side of [-1, 1]) {
    const end: [number, number, number] = [side * radius / Math.sqrt(2), .275, homeZ + radius / Math.sqrt(2)], middle: [number, number, number] = [end[0] / 2, .275, (homeZ + end[2]) / 2];
    p.push(rail([0, .275, homeZ], middle, .06, white), rail(middle, end, .06, white), cylinder("两条远端犯规线上的高位界标杆", end[0], 6.2, end[2], .13, 12, "#c4ac6e"));
  }
  const fence = arcDeck("完整远外场弧形围墙", [0, 0, homeZ], radius, radius + .2, Math.PI / 2, 0, 0, Math.PI / 4);
  fence.vertices = fence.vertices!.map(point => ({ ...point, y: .2 + (point.y + .2) * 15 })); fence.color = "#6b887b"; p.push(fence);
  for (const side of [-1, 1]) for (let row = 0; row < 4; row++) { const seat = box("沿界外两侧逐级升高的观众阶台", side * (22 + row * 1.8), .2 + (row + 1) * .5 / 2, -50 - row * 1.8, 24, (row + 1) * .5, 1.8, "#a0a291"); seat.rotation.y = -side * 45; p.push(seat); }
  p.push(part("本垒后方拦截高球的独立屏网", "box", dark, [0, 4.3, -76], [28, 8, .04], [0, 0, 0], { opacity: .22 }));
  for (const x of [-14, 0, 14]) p.push(cylinder("本垒后网架落地立柱", x, 4.3, -76, .12, 8, dark));
  return p;
}

function ellipse(rx: number, rz: number): [number, number][] { return Array.from({ length: 56 }, (_, i) => { const a = i / 56 * Math.PI * 2; return [Math.cos(a) * rx, Math.sin(a) * rz]; }); }

function cricketGround(): ModelPart[] {
  const roof = pitchedRoof("朝向球场的完整亭廊双坡屋面", dark, 27, 10.5, 4.32); roof.position.z = -90;
  const p: ModelPart[] = [polygon("椭圆赛场及界外休息区整体地基", paving, ellipse(82, 97), .2), polygon("完整椭圆板球比赛内场", "#829d79", ellipse(72, 85), .04, [0, .2, 0]), polygon("封合椭圆边界的连续细白线", white, ellipse(72, 85), .012, [0, .242, 0], [ellipse(71.94, 84.94)]), box("二十点一二乘三点零五米中央投球区", 0, .255, 0, 3.05, .03, 20.12, "#bdac84"), box("界外亭廊完整地台", 0, .35, -90, 26, .3, 10, paving), doorway("界外亭廊后方进入门洞", [0, .5, -95], 26, 3.8, 2), ...[-1, 1].map(side => box("场外亭廊两侧封墙", side * 13, 2.4, -90, .24, 3.8, 10, paving)), roof];
  for (const x of [-11, -4, 4, 11]) p.push(box("亭廊面向赛场的落地檐柱", x, 2.4, -85, .2, 3.8, .2, wood));
  const lines = [];
  for (const side of [-1, 1]) {
    for (const x of [-.095, 0, .095]) p.push(cylinder("两端完整三柱门的独立木柱", x, .6255, side * 10.06, .038, .711, wood));
    for (const x of [-.0475, .0475]) p.push(box("三柱顶部实际搭接的小横木", x, .986, side * 10.06, .105, .018, .015, wood));
    lines.push({ x: 0, z: side * 10.06, width: 2.64, depth: .04 }, { x: 0, z: side * 8.84, width: 3.66, depth: .04 });
    for (const x of [-1.32, 1.32]) lines.push({ x, z: side * 10.3, width: .04, depth: 3.7 });
  }
  p.push(paint("投球区两端完整投球及击球界线", white, lines, .275));
  for (const side of [-1, 1]) for (let row = 0; row < 3; row++) p.push(box("界外独立纵向观众长阶台", side * (74 + row * 1.8), .2 + (row + 1) * .5 / 2, 0, 1.8, (row + 1) * .5, 48, "#9ba18d"));
  return p;
}

function sumoArena(): ModelPart[] {
  const p: ModelPart[] = [box("相扑馆完整基础楼面", 0, .15, 0, 29, .3, 31, paving), box("中央六点七米方形黏土土俵", 0, .6, 0, 6.7, .6, 6.7, "#b49f7b"), ring("部分埋入黏土的俵包圆界", wood, 2.355, .08, .94, .12), part("以悬索承托的完整神社式屋形顶", "extrude", dark, [0, 7.5, 0], [1, 1, 1], [0, 0, 0], { depth: 7.8, profile: [{ x: -3.9, y: 0 }, { x: 0, y: 2 }, { x: 3.9, y: 0 }, { x: 3.9, y: -.18 }, { x: 0, y: 1.8 }, { x: -3.9, y: -.18 }] }), box("悬吊屋形顶下部完整承托梁", 0, 7.45, 0, 7.5, .2, .3, wood), doorway("相扑馆前方观众入口", [0, .3, -15.3], 29, 13.5, 3), doorway("相扑馆后方独立出口", [0, .3, 15.3], 29, 13.5, 3), ...[-1, 1].map(side => box("相扑馆两侧完整围护墙", side * 14.3, 7.05, 0, .3, 13.5, 30.6, paving)), box("相扑馆整体高位屋面", 0, 14, 0, 29.5, .3, 31.5, dark)];
  let index = 0;
  for (const x of [-3.7, 3.7]) for (const z of [-3.7, 3.7]) {
    const color = ["#748e85", "#b8bba8", "#4f626a", "#ac7763"][index++]!;
    p.push(rail([x, 7.55, z], [Math.sign(x) * 5, 13.85, Math.sign(z) * 5], .045, dark), cylinder("四角房穗上方独立悬绳", x, 7.125, z, .06, .75, color), part("屋形顶四角悬垂房穗", "cone", color, [x, 6.375, z], [.35, .75, .35]));
  }
  for (const x of [-5, 5]) p.push(rail([x, 13.8, -14.8], [x, 13.8, 14.8], .3, dark));
  for (let row = 0; row < 4; row++) {
    const outer = 6 + row * 1.2, inner = outer - 1, height = (row + 1) * .4;
    for (const side of [-1, 1]) {
      p.push(box("东西向观众阶台", side * (outer + inner) / 2, .3 + height / 2, 0, 1, height, inner * 2, wood));
      for (const end of [-1, 1]) p.push(box("南北观众阶台为通行口留空", end * (outer + 1.4) / 2, .3 + height / 2, side * (outer + inner) / 2, outer - 1.4, height, 1, wood));
    }
  }
  return p;
}

function kyudoRange(): ModelPart[] {
  const shootingRoof = pitchedRoof("射亭完整双坡木屋盖", dark, 16.8, 8.8, 4.02); shootingRoof.position.z = -15;
  const targetRoof = pitchedRoof("安土靶房完整防雨屋盖", dark, 16.8, 6.6, 3.72); targetRoof.position.z = 17.5;
  const p: ModelPart[] = [box("射亭与靶房共同落地场坪", 0, .1, 0, 24, .2, 43, paving), box("抬高的完整木构射亭地板", 0, .3, -15, 16, .2, 8, wood), doorway("射亭后侧实际进出门洞", [0, .4, -19], 16, 3.5, 1.4), ...[-1, 1].map(side => box("射亭两侧连续木墙", side * 8, 2.15, -15, .2, 3.5, 8, wood)), shootingRoof, box("射位至靶房之间完整室外射道", 0, .22, 2.5, 16, .04, 27, "#8e9f7e"), box("安土靶房后端挡箭实墙", 0, 1.9, 20.5, 16, 3.4, .3, paving), ...[-1, 1].map(side => box("安土靶房两侧封合实墙", side * 8, 1.9, 17.5, .3, 3.4, 6, paving)), targetRoof, part("靶面后方斜向升高的完整安土", "extrude", "#b39b76", [0, .24, 17.8], [1, 1, 1], [0, -90, 0], { depth: 14.5, profile: [{ x: -1.7, y: 0 }, { x: 1.7, y: 0 }, { x: 1.7, y: 1.8 }, { x: 1.2, y: 1.8 }, { x: -1.7, y: .08 }] })];
  for (const x of [-6, -2, 2, 6]) {
    p.push(box("射亭前檐完整落地木柱", x, 2.15, -11, .18, 3.5, .18, wood), cylinder("二十八米远的三十六厘米圆靶", x, .51, 16, .36, .025, white, [85, 0, 0]), cylinder("圆靶正面黑色中央靶区", x, .51, 15.98, .12, .015, dark, [85, 0, 0]), rail([x - .08, .24, 16.05], [x, .6, 16.05], .025, wood), rail([x + .08, .24, 16.05], [x, .6, 16.05], .025, wood));
  }
  for (const side of [-1, 1]) {
    p.push(box("射道两侧独立通行步廊", side * 10, .27, .5, 1.8, .14, 38, paving), box("沿射道之外连续铺设的窄廊屋面", side * 10, 3.35, .5, 2.1, .15, 38.5, dark));
    for (const z of [-16, -5, 6, 17]) p.push(box("步廊屋面落地承柱", side * 10, 1.82, z, .14, 2.96, .14, wood));
  }
  p.push(paint("木构射亭前部完整射位线", white, [{ x: 0, z: -12, width: 14, depth: .045 }], .41));
  return p;
}
