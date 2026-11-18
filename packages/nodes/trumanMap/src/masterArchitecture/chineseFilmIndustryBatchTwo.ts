import { beam, part, ring, type ModelPart } from "../assetModelParts";
import { hardPlan, profileBody, riseSteps } from "./everydayOutdoorSpaceBatchOne";
import { holesAt, openingWall, tiledRoof } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { arch, box, cylinder, design, type ArchitecturePrototype } from "./structures";

const stone = "#aaa28e", plaster = "#c9bda1", wood = "#886344", dark = "#604b36", tile = "#657268", earth = "#ae8965", water = "#7b9b91", linen = "#cbb58d";

// 生产空间为原创静态影视布景，工序组织参考传统技艺，不作遗址测绘或动态工艺模拟。
export const chineseFilmIndustryBatchTwoDesigns: ArchitecturePrototype[] = [
  design("甑灶天锅分院高粱酒坊", "古装片场 生产民生：曲房、晾粮前院、蒸馏堂与发酵槽分列，地锅上的酒甑覆冷凝天锅，经低位接酒槽入桶，灶烟从真屋面孔排出", sorghumDistilleryCourt, "建筑", "中式"),
  design("串联晒埕煎卤盐坊", "古装片场 生产民生：三级带溢口晒埕面对搬卤干路，独立煎卤炉房与后干盐仓相接，炉膛、浅盘和穿顶烟道可辨，区别单片盐田", saltBoilingCourt, "建筑", "中式"),
  design("穿院高架绷布晒染坊", "古装片场 生产民生：侧染房接高架晒布院，实际登架长梯接同高操作栈道，吊布横架跨院，染缸、滴布槽和穿院工作路分别布置", highClothDryingWorks, "建筑", "中式"),
  design("双庭分龄桑叶蚕房", "古装片场 生产民生：前桑叶间通两侧分隔蚕房，后上蔟庭另设竹格蔟棚，前后庭院贯通而各室独立开门，区别单间蚕匾架室及缫丝坊", silkwormCourtyardWorks, "建筑", "中式"),
  design("侧驱多碓带碾槽谷粮房", "古装片场 生产民生：侧水轮经一根横轴上的短凸木依次接触多根碓梢，轴穿真墙孔；独立竖碾环槽位于敞院，舂谷房与碾粮院保留转运巷", grainPoundingAndRollingWorks, "建筑", "中式"),
  design("贯梁撞楔蒸籽整院榨油坊", "古装片场 生产民生：长榨膛内直立饼列抵住压板和横入木楔，架梁悬吊撞杵正对插楔；蒸籽灶、踩饼案和低位接油槽接成完整油坊", wedgeOilPressWorks, "建筑", "中式"),
  design("双阴室裱胎髹漆作坊", "古装片场 生产民生：前粗作木胎棚与精髹案间分置，后两间少窗阴房各自出入并设晾器层架，中心无尘搬运庭院保持连通", lacquerFinishingCourt, "建筑", "中式"),
  design("坡窑前制坯晾场砖瓦窑院", "古装片场 生产民生：真空拱膛沿坡升向后烟井，坡底留连续装窑口，前制坯棚、泥料槽与分列晾坯架围出装运场，不是单龙窑外加底座", brickKilnWorkYard, "建筑", "中式"),
];

function roofSet(name: string, w: number, d: number, y: number, x: number, z: number): ModelPart[] {
  return [tiledRoof(name, w, d, y, [x, z], tile), box("封接瓦脊", x, y + .27 + Math.min(w, d) * .2, z, w > d ? w + .8 : .16, .1, w > d ? .16 : d + .8, dark)];
}

function smokeRoof(name: string, w: number, d: number, y: number, x: number, z: number, flueX: number, flueZ: number): ModelPart {
  const a = flueX - x, b = flueZ - z;
  const value = hardPlan(name, tile, [[-w / 2 - .5, -d / 2 - .5], [w / 2 + .5, -d / 2 - .5], [w / 2 + .5, d / 2 + .5], [-w / 2 - .5, d / 2 + .5]], .16, [x, y, z], [[[a - .42, b - .42], [a + .42, b - .42], [a + .42, b + .42], [a - .42, b + .42]]]);
  for (const p of value.vertices!) p.y += Math.max(0, w / 2 + .5 - Math.abs(p.x)) * .22;
  return value;
}

function post(x: number, z: number, low: number, top: number): ModelPart[] {
  return [box("柱础", x, low + .08, z, .4, .16, .4, stone), box("落地接檐木柱", x, (low + .12 + top) / 2, z, .22, top - low - .12, .22, wood)];
}

function workTable(name: string, x: number, z: number, width: number, depth: number, floor = .16): ModelPart {
  const b: SolidBox[] = [{ center: [x, floor + .84, z], size: [width, .12, depth] }];
  for (const a of [-1, 1]) for (const c of [-1, 1]) b.push({ center: [x + a * (width / 2 - .15), floor + .39, z + c * (depth / 2 - .15)], size: [.12, .78, .12] });
  return boxesMesh(name, wood, b);
}

function basin(name: string, x: number, z: number, w: number, d: number, bottom: number, high: number, color = water): ModelPart[] {
  return [box(`${name}底`, x, bottom + .06, z, w, .12, d, stone), hardPlan(`${name}实空边`, stone, [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]], high, [x, bottom + .12, z], [[[-w / 2 + .16, -d / 2 + .16], [w / 2 - .16, -d / 2 + .16], [w / 2 - .16, d / 2 - .16], [-w / 2 + .16, d / 2 - .16]]]), box(`${name}液面`, x, bottom + high * .65 + .12, z, w - .34, .025, d - .34, color)];
}

function fireStove(x: number, z: number, w: number, d: number, top: number): ModelPart[] {
  const h = top - .36;
  return [box("炉膛承火底", x, .26, z, w, .2, d, stone), openingWall("炉后真排烟孔", w, h, holesAt([0], .45, .3, top - .96), [x, .36, z + d / 2 - .12], 0, earth), ...[-1, 1].map(s => box("炉膛侧承壁", x + s * (w / 2 - .12), (.36 + top) / 2, z, .24, h, d, earth)), box("炉口拱上枋", x, top - .11, z - d / 2 + .12, w, .22, .24, earth), box("炉床炭层", x, .38, z, w - .5, .04, d - .5, dark)];
}

function chimney(x: number, z: number, bottom: number, top: number): ModelPart {
  return hardPlan("通心烟囱", earth, [[-.35, -.35], [.35, -.35], [.35, .35], [-.35, .35]], top - bottom, [x, bottom, z], [[[-.2, -.2], [.2, -.2], [.2, .2], [-.2, .2]]]);
}

function smokeRoute(stoveX: number, stoveZ: number, depth: number, stoveTop: number, stackX: number, stackTop: number): ModelPart[] {
  const y = stoveTop - .45, z0 = stoveZ + depth / 2 - .32, z1 = stoveZ + depth / 2 + .55, dir = Math.sign(stackX - stoveX), length = Math.abs(stackX - stoveX) - .35, run = z1 - z0;
  const local: [number, number][] = [[-.25, 0], [.25, 0], [.25, run - .25], [length, run - .25], [length, run + .25], [-.25, run + .25]];
  const outline = local.map(([x, z]) => [stoveX + dir * x, z0 + z] as [number, number]);
  const p: ModelPart[] = [hardPlan("折烟道空腔底", earth, outline, .1, [0, y - .25, 0]), hardPlan("折烟道空腔顶", earth, outline, .1, [0, y + .15, 0])];
  for (const i of [1, 2, 4, 5]) { const a = outline[i]!, b = outline[(i + 1) % outline.length]!; p.push(box("折烟道不封首尾的侧壁", (a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2, Math.abs(a[0] - b[0]) || .1, .5, Math.abs(a[1] - b[1]) || .1, earth)); }
  p.push(box("烟井落地承基", stackX, (.16 + y - .25) / 2, z1, .7, y - .41, .7, stone), box("烟井转弯底", stackX, y - .2, z1, .7, .1, .7, earth), box("烟井下远侧壁", stackX + dir * .275, y, z1, .15, .5, .7, earth), chimney(stackX, z1, y + .25, stackTop));
  for (const side of [-1, 1]) p.push(box("烟井下两侧壁", stackX, y, z1 + side * .275, .7, .5, .15, earth));
  return p;
}

function sorghumDistilleryCourt(): ModelPart[] {
  const p: ModelPart[] = [box("酒坊院坪", 0, .08, 0, 19, .16, 19, stone), openingWall("蒸馏堂前通门", 8, 4.04, holesAt([1.8], 1.5, 3), [-3, .16, -.5], 0, plaster), openingWall("蒸馏堂后窗", 8, 4.04, holesAt([-2, 1.8], 1.2, 1, 2.5), [-3, .16, 7.5], 0, plaster), smokeRoof("蒸馏堂真烟孔瓦顶", 8, 8, 4.2, -3, 3.5, -6.2, 4.95), ...fireStove(-4, 3, 2.8, 2.8, 1.5), ...smokeRoute(-4, 3, 2.8, 1.5, -6.2, 6.8), ring("木酒甑桶壁", wood, 1.08, .1, 2.2, 1.4, { position: { x: -4, y: 2.2, z: 3 } }), cylinder("天锅冷凝底盘", -4, 2.925, 3, 2.3, .05, dark), ring("天锅冷水围边", dark, 1.15, .08, 3.075, .35, { position: { x: -4, y: 3.075, z: 3 } }), cylinder("天锅冷却水", -4, 3.13, 3, 2.11, .025, water), beam("甑侧接酒导槽", wood, [-3, 2.85, 3], [-1.7, 1.42, 3], .09), ring("接酒木桶", wood, .42, .06, .76, 1.2, { position: { x: -1.7, y: .76, z: 3 } }), cylinder("接酒桶底", -1.7, .2, 3, .8, .08, dark)];
  for (const x of [-7, 1]) p.push(box("蒸馏堂侧壁", x, 2.18, 3.5, .24, 4.04, 8, plaster));
  for (const x of [-6.7, .7]) for (const z of [-.2, 7.2]) p.push(...post(x, z, .16, 4.2));
  p.push(cylinder("地锅承火底", -4, 1.34, 3, 2.6, .08, dark), ring("地锅水腔壁", dark, 1.3, .1, 1.4, .16, { position: { x: -4, y: 1.4, z: 3 } }), ring("地锅承甑口", dark, 1.3, .4, 1.47, .06, { position: { x: -4, y: 1.47, z: 3 } }));
  p.push(openingWall("曲房前门", 6, 3, holesAt([1.5], 1.2, 2.6), [-5, .16, -8], 0, plaster), openingWall("曲房向院门", 6, 3, holesAt([1.5], 1.2, 2.6), [-5, .16, -4], 0, plaster), box("曲房西壁", -8, 1.66, -6, .22, 3, 4, plaster), box("曲房东壁", -2, 1.66, -6, .22, 3, 4, plaster), ...roofSet("曲房瓦盖", 6, 4, 3.16, -5, -6), workTable("制曲长案", -5.6, -6, 2.3, 1.1), box("露院摊晾粮坪", 3.2, .21, -5.7, 7, .1, 4.5, linen));
  for (const z of [1, 5]) p.push(...basin("封边发酵槽", 5, z, 4, 3, .16, .7, earth), box("发酵槽木盖", 5, .99, z, 4.05, .08, 3.05, wood));
  return p;
}

function saltBoilingCourt(): ModelPart[] {
  const p: ModelPart[] = [box("盐坊工作院坪", 0, .08, 0, 21, .16, 20, stone), openingWall("煎盐房敞炉门", 7, 4.04, holesAt([0], 3.2, 3.5), [5, .16, -.5], 0, plaster), openingWall("煎盐房后货门", 7, 4.04, holesAt([0], 1.5, 2.8), [5, .16, 7.5], 0, plaster), smokeRoof("煎卤房穿烟孔顶", 7, 8, 4.2, 5, 3.5, 7.3, 5.25), ...fireStove(5, 3, 3, 3.4, 1.3), box("煎卤浅盘底", 5, 1.34, 3, 2.8, .08, 3.2, dark), hardPlan("煎盘真空四边", dark, [[-1.4, -1.6], [1.4, -1.6], [1.4, 1.6], [-1.4, 1.6]], .22, [5, 1.38, 3], [[[-1.3, -1.5], [1.3, -1.5], [1.3, 1.5], [-1.3, 1.5]]]), box("盘内浓卤", 5, 1.49, 3, 2.58, .025, 2.98, water), ...smokeRoute(5, 3, 3.4, 1.3, 7.3, 6.7)];
  for (const x of [1.5, 8.5]) p.push(box("煎盐房侧壁", x, 2.18, 3.5, .22, 4.04, 8, plaster));
  for (let i = 0; i < 3; i++) {
    const x = -6 + i * 3.6, level = .56 - i * .2;
    if (i < 2) p.push(box("晒埕承卤底台", x, level / 2 + .08, -5.1, 3.3, level - .16, 5.5, stone));
    p.push(box("晒埕实底", x, level + .06, -5.1, 3.3, .12, 5.5, stone), box("晒埕静卤面", x, level + .289, -5.1, 2.96, .025, 5.16, water));
    for (const side of [-1, 1]) {
      p.push(box("晒埕横边", x, level + .25, -5.1 + side * 2.67, 3.3, .26, .16, stone));
      const slot = side < 0 ? i > 0 : i < 2;
      if (!slot) p.push(box("无连口的埕侧壁", x + side * 1.57, level + .25, -5.1, .16, .26, 5.5, stone));
      else {
        for (const [a, b] of [[-7.85, -4.7], [-4.1, -2.35]]) p.push(box("溢口两旁埕侧壁", x + side * 1.57, level + .25, (a! + b!) / 2, .16, .26, b! - a!, stone));
        p.push(box("低于卤面的溢口槛", x + side * 1.57, level + .18, -4.4, .16, .12, .6, stone));
      }
    }
    if (i < 2) {
      p.push(profileBody("埕间降级实底排槽", stone, [[0, level + .18], [.62, level - .02], [.62, level + .04], [0, level + .24]], .6, [x + 1.49, 0, -4.4]), part("排槽内降级卤面", "box", water, [x + 1.8, level + .15, -4.4], [Math.hypot(.62, .2), .02, .48], [0, 0, -Math.atan2(.2, .62) * 180 / Math.PI]), box("埕间搬卤石踏", x + 1.8, .28, -2.15, .45, .24, .8, stone));
      for (const side of [-1, 1]) p.push(beam("斜排槽侧挡条", stone, [x + 1.49, level + .29, -4.4 + side * .27], [x + 2.11, level + .09, -4.4 + side * .27], .08));
    }
  }
  p.push(openingWall("干盐仓前货门", 8, 2.9, holesAt([0], 2.1, 2.5), [-4, .16, 2.5], 0, plaster), box("盐仓背墙", -4, 1.61, 7.5, 8, 2.9, .22, plaster), ...roofSet("干盐仓瓦顶", 8, 5, 3.06, -4, 5));
  for (const x of [-8, 0]) p.push(box("盐仓端壁", x, 1.61, 5, .22, 2.9, 5, plaster));
  for (const x of [-6.5, -1.5]) p.push(box("防潮盐垛木垫", x, .28, 5.4, 1.5, .24, 2.8, dark), box("垫上成盐垛", x, .9, 5.4, 1.4, 1, 2.5, "#d4cfb7"));
  return p;
}

function highClothDryingWorks(): ModelPart[] {
  const p: ModelPart[] = [box("晒染坊院坪", 0, .08, 0, 18, .16, 20, stone), openingWall("染房前门", 7, 3.94, holesAt([1.5], 1.4, 2.8), [-4, .16, -5], 0, plaster), openingWall("染房后窗", 7, 3.94, holesAt([-2, 1.5], 1.2, 1.2, 1.6), [-4, .16, 5], 0, plaster), box("染房外侧壁", -7.5, 2.13, 0, .22, 3.94, 10, plaster), openingWall("染房通晒院侧门", 10, 3.94, holesAt([0], 1.6, 2.8), [-.5, .16, 0], 90, plaster), ...roofSet("低染房瓦顶", 7, 10, 4.1, -4, 0), box("晒架操作栈道", 6.7, 3.3, 2.4, 1.6, .2, 8.4, wood), riseSteps("晒架操作长梯", .16, 3.4, 14, .3, 1.3, [6.7, 0, -6])];
  for (const x of [1.5, 7.5]) for (const z of [0, 2.5, 5]) p.push(...post(x, z, .16, 5.8));
  for (const z of [0, 2.5, 5]) p.push(box("横院吊布接柱梁", 4.5, 5.7, z, 6.2, .2, .22, dark), box("高架长幅染布", 3.9, 3.95, z, 3.6, 3.5, .035, "#617f8b"));
  for (const z of [-1.7, .7, 3.4, 6.4]) p.push(...post(6.7, z, .16, 3.2), box("栈道外护栏柱", 7.42, 3.87, z, .08, .94, .08, dark));
  p.push(box("栈道外扶手", 7.42, 4.35, 2.4, .1, .1, 8.3, dark));
  for (const [a, b] of [[-1.75, -.5], [.5, 2], [3, 4.5], [5.5, 6.55]]) {
    p.push(box("取布段之间内侧护栏", 5.96, 4.35, (a! + b!) / 2, .08, .1, b! - a!, dark));
    for (const z of [a!, b!]) p.push(box("内护栏接板短柱", 5.96, 3.87, z, .07, .94, .07, dark));
  }
  for (const z of [-2.8, .4, 3.2]) p.push(ring("染缸空壁", earth, .9, .13, .76, 1.2, { position: { x: -5, y: .76, z } }), cylinder("缸底", -5, .21, z, 1.72, .1, earth), cylinder("染液", -5, 1.1, z, 1.5, .025, "#526d80"));
  p.push(...basin("滴染回收浅槽", 3.9, 2.5, 3.9, 6, .16, .2), workTable("洗染折布案", -2.5, -2.5, 1.8, 1.4));
  return p;
}

function silkwormCourtyardWorks(): ModelPart[] {
  const p: ModelPart[] = [box("双庭蚕坊院坪", 0, .08, 0, 17, .16, 22, stone), openingWall("桑叶间进叶门", 7, 2.9, holesAt([1.8], 1.3, 2.5), [-4.5, .16, -9], 0, plaster), openingWall("桑叶间出院门", 7, 2.9, holesAt([1.8], 1.3, 2.5), [-4.5, .16, -5], 0, plaster), ...roofSet("前桑叶间瓦顶", 7, 4, 3.06, -4.5, -7), workTable("摘叶分叶长案", -5.1, -7, 3, 1.3)];
  for (const x of [-8, -1]) p.push(box("桑叶间端壁", x, 1.61, -7, .22, 2.9, 4, plaster));
  for (const side of [-1, 1]) {
    const x = side * 4.5;
    p.push(openingWall("分龄蚕房前门", 5, 3.2, holesAt([0], 1.2, 2.6), [x, .16, -3], 0, plaster), openingWall("分龄蚕房后门", 5, 3.2, holesAt([0], 1.2, 2.6), [x, .16, 5], 0, plaster), openingWall("面庭蚕房高窗", 8, 3.2, holesAt([-2, 2], 1.2, .7, 2.1), [side * 2, .16, 1], 90, plaster), box("蚕房外侧实壁", side * 7, 1.76, 1, .22, 3.2, 8, plaster), ...roofSet("分龄蚕房独立瓦顶", 5, 8, 3.36, x, 1));
    const b: SolidBox[] = [];
    for (const z of [-1.7, 3.7]) for (const a of [-.65, .65]) b.push({ center: [x + side * .65 + a, 1.51, z], size: [.09, 2.7, .09] });
    for (let row = 0; row < 5; row++) b.push({ center: [x + side * .65, .65 + row * .46, 1], size: [1.45, .07, 5.6] });
    p.push(boxesMesh("房内独立蚕匾层架", wood, b));
  }
  p.push(...roofSet("后上蔟庭敞棚", 11, 4, 3.7, 0, 8.4));
  for (const x of [-5.2, 0, 5.2]) for (const z of [6.7, 10.1]) p.push(...post(x, z, .16, 3.7));
  for (const x of [-3, 3]) {
    const b: SolidBox[] = [{ center: [x, .46, 8.4], size: [2.4, .6, 1.2] }];
    for (let row = 0; row < 4; row++) b.push({ center: [x, 1 + row * .35, 8.4], size: [2.4, .055, .85] });
    for (let i = 0; i < 6; i++) b.push({ center: [x - 1.08 + i * .43, 1.52, 8.4], size: [.045, 1.5, .85] });
    p.push(boxesMesh("上蔟竹格架", linen, b));
  }
  return p;
}

function grainPoundingAndRollingWorks(): ModelPart[] {
  const p: ModelPart[] = [box("水渠西侧独立岸坪", -9.25, .08, 0, 2.5, .16, 19, stone), box("水渠东侧碓房碾院坪", 2, .08, 0, 17, .16, 19, stone), box("轮下贯通渠底", -7.25, .02, 0, 1.5, .04, 19, stone), box("轮下贯通引水", -7.25, .12, 0, 1.48, .02, 19, water), openingWall("碓房前进粮门", 10, 4.34, holesAt([2.5], 1.8, 3), [-1.5, .16, -.5], 0, plaster), openingWall("碓房后货门", 10, 4.34, holesAt([2.5], 1.8, 3), [-1.5, .16, 7.5], 0, plaster), openingWall("水轮轴真实穿墙孔", 8, 4.34, holesAt([1.5], .6, .5, 1.3), [-6.5, .16, 3.5], 90, plaster), openingWall("面碾院货门及轴孔", 8, 4.34, [...holesAt([-1.5], 1.5, 2.8), ...holesAt([1.5], .6, .5, 1.3)], [3.5, .16, 3.5], 90, plaster), ...roofSet("连机多碓房瓦盖", 10, 8, 4.5, -1.5, 3.5), cylinder("一根穿墙驱动横轴", -1.7, 1.7, 2, .18, 11, dark, [0, 0, 90]), ring("侧驱水轮轮圈", wood, 1.5, .14, 1.7, .2, { position: { x: -7.2, y: 1.7, z: 2 }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("杠杆共用枢轴", -1, 1.3, 4, .2, 9, dark, [0, 0, 90])];
  for (const x of [-6, 3.3]) p.push(box("驱动轴落地承墩", x, .84, 2, .6, 1.36, .65, stone), box("驱动轴承木座", x, 1.62, 2, .6, .2, .4, wood));
  for (const x of [-5.3, 3.3]) p.push(box("枢轴落地承墩", x, .63, 4, .6, .94, .65, stone), box("枢轴木座", x, 1.2, 4, .6, .2, .4, wood));
  for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4; p.push(beam("轮辐", wood, [-7.2, 1.7, 2], [-7.2, 1.7 + Math.cos(t) * 1.45, 2 + Math.sin(t) * 1.45], .1), part("轮缘接水斗板", "box", wood, [-7.2, 1.7 + Math.cos(t) * 1.5, 2 + Math.sin(t) * 1.5], [.8, .16, .55], [i * 45, 0, 0])); }
  for (const x of [-4, -1, 2]) p.push(box("轴上触梢短凸木", x, 1.87, 2, .25, .55, .3, wood), beam("枢转碓梢长杆", wood, [x, 1.7, 2], [x, .8, 6], .2), box("碓梢端竖柄", x, .6, 6, .22, .4, .22, wood), box("落臼石碓头", x, .37, 6, .45, .3, .45, stone), cylinder("碓臼石底", x, .21, 6, 1.15, .1, stone), ring("真空石臼口", stone, .6, .17, .37, .3, { position: { x, y: .37, z: 6 } }));
  p.push(cylinder("竖碾槽院石盘", 6.4, .28, -3, 4.4, .24, stone), ring("碾槽外挡圈", stone, 2.2, .2, .55, .3, { position: { x: 6.4, y: .55, z: -3 } }), ring("碾槽内挡圈", stone, 1.4, .2, .55, .3, { position: { x: 6.4, y: .55, z: -3 } }), cylinder("碾架中轴墩", 6.4, .8, -3, .35, .8, wood), cylinder("槽内竖滚石砣", 8.1, 1.2, -3, 1.6, .5, stone, [0, 0, 90]), beam("中轴到石砣贯穿径向轴", wood, [6.4, 1.2, -3], [9.1, 1.2, -3], .12), workTable("分粮装袋案", 6.3, 5.8, 2.6, 1.3));
  return p;
}

function wedgeOilPressWorks(): ModelPart[] {
  const p: ModelPart[] = [box("榨油坊院坪", 0, .08, 0, 19, .16, 19, stone), openingWall("油坊临街大工门", 14, 4.04, holesAt([3.5], 2.4, 3.4), [0, .16, -5], 0, plaster), openingWall("油坊后出饼门", 14, 4.04, holesAt([3.5], 1.8, 3), [0, .16, 7], 0, plaster), smokeRoof("油坊蒸籽灶穿烟孔瓦顶", 14, 12, 4.2, 0, 1, -5.8, 0), ...fireStove(-5, -1.8, 2.5, 2.5, 1.25), ...smokeRoute(-5, -1.8, 2.5, 1.25, -5.8, 6.8), cylinder("承蒸笼铁盘", -5, 1.24, -1.8, 2.4, .08, dark), cylinder("蒸籽笼木身", -5, 1.85, -1.8, 2, 1.2, wood), cylinder("蒸笼顶盖", -5, 2.48, -1.8, 2.15, .12, dark), box("榨梁前连续实木", -1, 1.4, 1.475, 8, 1, .25, wood), box("榨梁后西段", -2.275, 1.4, 2.525, 5.45, 1, .25, wood), box("榨梁后东段", 2.425, 1.4, 2.525, 1.15, 1, .25, wood), box("榨梁左端", -4.75, 1.4, 2, .5, 1, 1.3, wood), box("榨梁右端", 2.75, 1.4, 2, .5, 1, 1.3, wood), box("榨膛承饼底板", -1, .98, 2, 7.2, .08, .9, dark), box("榨饼左抵木", -4.25, 1.4, 2, .5, .75, .78, dark), box("向饼列推进的压木", -.3, 1.4, 2, 1.6, .75, .78, dark), box("插楔后抵木", 1.9, 1.4, 2, .8, .75, .78, dark), hardPlan("横入三角木楔", dark, [[.5, 1.65], [1.8, 1.65], [1, 3.3], [.5, 3.3]], .75, [0, 1.02, 0]), box("悬挂撞楔长杵", .8, 1.4, 4.8, .32, .32, 3, wood), workTable("踩饼包饼案", -4.3, -3.7, 2.3, 1.5)];
  for (const x of [-7, 7]) p.push(box("油坊通长侧壁", x, 2.18, 1, .24, 4.04, 12, plaster));
  for (const x of [-4.3, 2.3]) p.push(box("榨梁落地承架", x, .53, 2, .5, .74, 1.6, dark));
  for (const x of [-3.7, -3, -2.3, -1.6]) p.push(cylinder("榨膛直立油饼", x, 1.385, 2, .74, .3, linen, [0, 0, 90]));
  for (const x of [-.8, 2.6]) for (const z of [3.5, 6.3]) p.push(...post(x, z, .16, 4.2));
  for (const x of [-.8, 2.6]) p.push(box("悬杵架接柱纵梁", x, 4.1, 4.9, .24, .2, 3, dark));
  for (const z of [4.2, 5.5]) p.push(box("悬杵架跨接梁", .9, 4.1, z, 3.6, .2, .2, dark), cylinder("撞杵悬索", .8, 2.8, z, .035, 2.8, dark));
  p.push(...basin("低位接油槽", -1, 2.8, 6.8, .8, .16, .35, "#a99c61"));
  return p;
}

function lacquerFinishingCourt(): ModelPart[] {
  const p: ModelPart[] = [box("髹漆作坊内庭坪", 0, .08, 0, 17, .16, 18, stone)];
  for (const side of [-1, 1]) {
    const x = side * 4;
    p.push(openingWall("前作间向街工门", 6, 3.3, holesAt([0], 2.2, 2.8), [x, .16, -6.5], 0, plaster), openingWall("前作间向内院门窗", 6, 3.3, [...holesAt([0], 1.5, 2.7), ...holesAt([-2.1, 2.1], 1, 1.3, 1.1)], [x, .16, .5], 0, plaster), box("前作间外壁", side * 7, 1.81, -3, .22, 3.3, 7, plaster), openingWall("前作间内侧采光窗", 7, 3.3, holesAt([-1.8, 1.8], 1.3, 1.2, 1.3), [side, .16, -3], 90, plaster), ...roofSet("粗精作间分盖瓦顶", 6, 7, 3.46, x, -3), workTable(side < 0 ? "裱胎木案" : "精髹推光案", x, -3.2, 3.2, 1.5));
    const cx = side * 3.5;
    p.push(openingWall("阴房独立搬器门", 5.5, 3, holesAt([0], 1.3, 2.5), [cx, .16, 3.5], 0, dark), openingWall("阴房背高气窗", 5.5, 3, holesAt([0], .6, .25, 2.55), [cx, .16, 7.5], 0, dark), ...roofSet("阴房低灰瓦盖", 5.5, 4, 3.16, cx, 5.5));
    for (const edge of [-1, 1]) p.push(box("阴房封合侧壁", cx + edge * 2.75, 1.66, 5.5, .22, 3, 4, dark));
    const b: SolidBox[] = [];
    for (const z of [4.3, 6.7]) for (const a of [-.65, .65]) b.push({ center: [cx + side + a, 1.46, z], size: [.09, 2.6, .09] });
    for (let i = 0; i < 5; i++) b.push({ center: [cx + side, .65 + i * .45, 5.5], size: [1.5, .07, 2.6] });
    p.push(boxesMesh("阴房晾器层架", wood, b));
    for (const z of [4.8, 5.8]) p.push(box("层架上漆器木胎", cx + side, 1.17, z, .8, .08, .65, side < 0 ? wood : "#9e4f3b"));
  }
  p.push(box("粗作裱胎木框", -4, 1.12, -3.2, 1.4, .12, 1, wood), box("裱胎布面", -4, 1.195, -3.2, 1.3, .03, .9, linen), cylinder("精髹案漆盘", 4, 1.1, -3.2, .65, .08, "#9b4e3a"));
  return p;
}

function brickKilnWorkYard(): ModelPart[] {
  const outer = arch(0, 0, 1.7, .7, 9, .35).profile!.map(p => [p.x, p.y] as [number, number]);
  const shell = profileBody("沿坡真空砖窑拱膛", earth, outer, 9, [0, .16, 6]);
  for (const p of shell.vertices!) p.y += .1 * (p.z + 4.5);
  const p: ModelPart[] = [box("制坯装运整院坪", 0, .08, 2, 21, .16, 25, stone), shell, profileBody("拱窑连续上升窑床", stone, [[0, .16], [9, .16], [9, 1.06]], 4.2, [0, 0, 1.5], -90), openingWall("窑后封壁留烟道", 4.1, 2.75, holesAt([0], .6, .5, .3), [0, 1.06, 10.5], 0, earth), chimney(0, 10.9, 1.86, 6.8), box("烟井下后壁", 0, 1.46, 11.2, .7, .8, .12, earth), ...roofSet("前侧制坯敞棚", 6, 10, 3.5, -6.3, -3), workTable("长制砖模案", -6.3, -4, 3.8, 1.6), workTable("瓦坯弧模案", -6.3, 0, 3.8, 1.5), ...basin("练泥拌料槽", 5, -.5, 3.4, 3, .16, .65, earth)];
  for (const x of [-.3, .3]) p.push(box("烟井下侧支壁", x, 1.46, 10.9, .1, .8, .7, earth));
  p.push(box("窑后烟井落地基", 0, .61, 10.9, .9, .9, 1, stone));
  for (const x of [-8.9, -3.7]) for (const z of [-7.6, -3, 1.6]) p.push(...post(x, z, .16, 3.5));
  for (const x of [4, 7.5]) {
    const b: SolidBox[] = [];
    for (const z of [3, 7]) for (const side of [-1, 1]) b.push({ center: [x + side * .6, 1.1, z], size: [.12, 1.88, .12] });
    for (let i = 0; i < 4; i++) b.push({ center: [x, .6 + i * .46, 5], size: [1.5, .1, 4.2] });
    p.push(boxesMesh("屋外分层晾坯木架", wood, b));
    for (let i = 0; i < 4; i++) p.push(box("架上待烧砖坯", x, .71 + i * .46, 5, 1.25, .12, 3.9, earth));
  }
  return p;
}
